import nodemailer from 'nodemailer';
import { env } from './config.js';

const smtpReady = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
let transporter;

function getTransporter() {
  if (!smtpReady) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.smtpSecure,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export function isEmailConfigured() {
  return smtpReady && Boolean(env.EMAIL_FROM || env.SMTP_USER);
}

export async function sendEmail({ to, subject, text }) {
  const mailer = getTransporter();
  if (!mailer || !to) return false;
  try {
    await mailer.sendMail({
      from: env.EMAIL_FROM || env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error(`Email delivery failed (${error?.code || error?.name || 'unknown error'}).`);
    return false;
  }
}

export async function notifyAdmin(subject, text) {
  if (!env.adminNotificationEmail) return false;
  return sendEmail({ to: env.adminNotificationEmail, subject, text });
}
