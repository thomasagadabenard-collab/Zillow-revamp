import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config.js';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { isEmailConfigured, notifyAdmin, sendEmail } from '../mailer.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const resetLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
const emailSchema = z.string().trim().email().max(320);
const signupSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: emailSchema,
  password: z.string().min(12).max(72),
});
const passwordSchema = z.string().min(12).max(72);
const genericResetMessage = 'If an account with that email exists, password-reset instructions will be sent.';

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role, createdAt: user.createdAt };
}

function safePasswordLength(password) {
  return Buffer.byteLength(password, 'utf8') <= 72;
}

function establishSession(req, user, res, next, statusCode = 200) {
  req.session.regenerate((sessionError) => {
    if (sessionError) return next(sessionError);
    req.logIn(user, (loginError) => {
      if (loginError) return next(loginError);
      res.status(statusCode).json({ user: publicUser(user) });
    });
  });
}

router.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

router.post('/register', loginLimit, async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter your name, a valid email address, and a password of at least 12 characters.' });
    if (!safePasswordLength(parsed.data.password)) return res.status(400).json({ error: 'Password must be no longer than 72 UTF-8 bytes.' });
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'An account already uses that email. Sign in or use Forgot password.' });

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        role: 'BUYER',
      },
    });
    notifyAdmin('New Zillow Elite account', `A buyer account has registered.\nName: ${user.name}\nEmail: ${user.email}\nUser ID: ${user.id}\nCreated: ${user.createdAt.toISOString()}`).catch(() => {});
    establishSession(req, user, res, next, 201);
  } catch (error) { next(error); }
});

router.post('/login', loginLimit, async (req, res, next) => {
  try {
    const email = emailSchema.safeParse(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email.success || !password) return res.status(400).json({ error: 'Enter a valid email address and password.' });
    const user = await prisma.user.findUnique({ where: { email: email.data.toLowerCase() } });
    if (!user || user.role !== 'BUYER' || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email or password is incorrect. If this is an older account without a password, use Forgot password to set one.' });
    }
    establishSession(req, user, res, next);
  } catch (error) { next(error); }
});

router.post('/admin/login', loginLimit, async (req, res, next) => {
  try {
    const email = emailSchema.safeParse(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email.success || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const user = await prisma.user.findUnique({ where: { email: email.data.toLowerCase() } });
    const valid = user?.role === 'ADMIN' && user.passwordHash && await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid administrator credentials.' });
    establishSession(req, user, res, next);
  } catch (error) { next(error); }
});

router.post('/profile', requireAuth, async (req, res, next) => {
  try {
    const parsed = z.object({ name: z.string().trim().min(2).max(160) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Name must be between 2 and 160 characters.' });
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { name: parsed.data.name } });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const parsedNew = passwordSchema.safeParse(req.body?.newPassword);
    if (!currentPassword || !parsedNew.success || !safePasswordLength(parsedNew.data)) {
      return res.status(400).json({ error: 'Enter your current password and a new password of 12–72 characters.' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: 'Current password is incorrect. If you need to set a password, use Forgot password.' });
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsedNew.data, 12) } });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.post('/forgot-password', resetLimit, async (req, res, next) => {
  try {
    if (!isEmailConfigured()) return res.status(503).json({ error: 'Password-reset email is not configured on this server yet.' });
    const parsedEmail = emailSchema.safeParse(req.body?.email);
    if (!parsedEmail.success) return res.status(400).json({ error: 'Enter a valid email address.' });
    const user = await prisma.user.findUnique({ where: { email: parsedEmail.data.toLowerCase() } });
    if (!user || user.role !== 'BUYER') return res.status(202).json({ message: genericResetMessage });

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
    const resetUrl = `${env.clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const sent = await sendEmail({
      to: user.email,
      subject: 'Reset your Zillow Elite password',
      text: `Hello ${user.name},\n\nUse this secure link to set or reset your password. It expires in 30 minutes and can be used once:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    });
    if (!sent) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      return res.status(503).json({ error: 'The reset email could not be sent. Please try again later.' });
    }
    res.status(202).json({ message: genericResetMessage });
  } catch (error) { next(error); }
});

router.post('/reset-password', resetLimit, async (req, res, next) => {
  try {
    const parsed = z.object({ token: z.string().min(20).max(200), password: passwordSchema }).safeParse(req.body);
    if (!parsed.success || !safePasswordLength(parsed.data.password)) return res.status(400).json({ error: 'The reset link or new password is invalid.' });
    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const changed = await prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({ where: { tokenHash } });
      if (!token || token.expiresAt <= new Date()) return false;
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await tx.passwordResetToken.deleteMany({ where: { userId: token.userId } });
      return true;
    });
    if (!changed) return res.status(400).json({ error: 'This reset link has expired or was already used. Request a new one.' });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.post('/logout', (req, res, next) => {
  const finish = () => req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('zillowelite.sid').json({ ok: true });
  });
  if (!req.user) return finish();
  req.logout((error) => error ? next(error) : finish());
});

router.get('/account', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
