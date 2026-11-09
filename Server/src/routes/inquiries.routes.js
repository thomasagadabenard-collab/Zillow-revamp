import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { notifyAdmin } from '../mailer.js';
import { deleteUploadedFiles, mediaRecord, propertyMediaUpload, validateMediaFiles } from '../uploads.js';

const router = Router();
const submitLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
const inquirySchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(40),
  title: z.string().trim().min(3).max(180),
  propertyType: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(240),
  price: z.coerce.number().positive().finite(),
  bedrooms: z.coerce.number().int().min(0).max(100).default(0),
  bathrooms: z.coerce.number().int().min(0).max(100).default(0),
  kitchens: z.coerce.number().int().min(0).max(100).default(1),
  description: z.string().trim().min(10).max(10000),
});

function inquiryDto(item) {
  return {
    id: item.id,
    fullName: item.fullName,
    email: item.email,
    phone: item.phone,
    title: item.title,
    propertyType: item.propertyType,
    city: item.city,
    address: item.address,
    price: Number(item.price),
    currency: 'USD',
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    kitchens: item.kitchens,
    description: item.description,
    status: item.status,
    media: item.media.map(({ id, name, url, mediaType, position }) => ({ id, name, url, mediaType, position })),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

router.post('/', submitLimit, (req, res, next) => {
  propertyMediaUpload(req, res, async (uploadError) => {
    if (uploadError) return next(uploadError);
    try {
      const parsed = inquirySchema.safeParse(req.body);
      if (!parsed.success) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({ error: 'Check the contact and property details and try again.', details: parsed.error.issues });
      }
      const mediaError = validateMediaFiles(req.files || []);
      if (mediaError) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({ error: mediaError });
      }
      const data = parsed.data;
      const item = await prisma.propertyInquiry.create({
        data: {
          ...data,
          email: data.email.toLowerCase(),
          price: data.price.toFixed(2),
          media: { create: (req.files || []).map((file, position) => mediaRecord(file, position)) },
        },
        include: { media: { orderBy: { position: 'asc' } } },
      });
      const links = item.media.map((file) => `${file.mediaType}: ${file.url}`).join('\n');
      notifyAdmin(
        'New Zillow Elite property submission',
        `A property owner submitted a listing request.\n\nName: ${item.fullName}\nEmail: ${item.email}\nPhone: ${item.phone}\nProperty: ${item.title}\nType: ${item.propertyType}\nLocation: ${item.address}, ${item.city}\nAsking price: USD ${Number(item.price).toLocaleString()}\nBedrooms: ${item.bedrooms}; bathrooms: ${item.bathrooms}; kitchens: ${item.kitchens}\n\nDescription:\n${item.description}\n\nSubmission ID: ${item.id}\nMedia:\n${links || 'No media attached'}\n\nReview this request in the Zillow Elite admin dashboard.`,
      ).catch(() => {});
      res.status(201).json({ ok: true, id: item.id, message: 'Your property submission was sent to the Zillow Elite team for review.' });
    } catch (error) {
      deleteUploadedFiles(req.files);
      next(error);
    }
  });
});

router.get('/admin', requireAdmin, async (_req, res, next) => {
  try {
    const items = await prisma.propertyInquiry.findMany({
      include: { media: { orderBy: { position: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ items: items.map(inquiryDto) });
  } catch (error) { next(error); }
});

router.patch('/admin/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = z.object({ status: z.enum(['NEW', 'REVIEWED', 'CONTACTED', 'CLOSED']) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Choose a valid submission status.' });
    const item = await prisma.propertyInquiry.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
      include: { media: { orderBy: { position: 'asc' } } },
    });
    res.json({ item: inquiryDto(item) });
  } catch (error) { next(error); }
});

export default router;
