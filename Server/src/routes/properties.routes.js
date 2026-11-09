import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { env } from '../config.js';
import { deleteLocalImage, deleteUploadedFiles, mediaRecord, propertyMediaUpload, validateMediaFiles } from '../uploads.js';

const router = Router();
const includeImages = { images: { orderBy: { position: 'asc' } } };
const formSchema = z.object({
  title: z.string().trim().min(3).max(180),
  price: z.coerce.number().positive().finite(),
  currency: z.literal('USD').default('USD'),
  location: z.string().trim().min(2).max(180),
  propertyType: z.string().trim().min(2).max(60).default('House'),
  bedrooms: z.coerce.number().int().min(0).max(100).default(0),
  bathrooms: z.coerce.number().int().min(0).max(100).default(0),
  kitchens: z.coerce.number().int().min(0).max(100).default(1),
  area: z.string().trim().max(80).optional().or(z.literal('')),
  description: z.string().max(10000).default(''),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'SOLD']).optional(),
});

function asFormObject(body = {}) {
  const result = { ...body };
  const removeUrlsField = result.removeMediaUrls ?? result.removeImageUrls;
  if (typeof removeUrlsField === 'string') {
    try { result.removeMediaUrls = JSON.parse(removeUrlsField); } catch { result.removeMediaUrls = []; }
  }
  return result;
}

function propertyDto(property) {
  return {
    id: property.id,
    title: property.title,
    name: property.title,
    price: Number(property.price),
    currency: property.currency,
    location: property.location,
    propertyType: property.propertyType,
    type: property.propertyType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    kitchens: property.kitchens,
    area: property.area,
    description: property.description,
    status: property.status,
    images: property.images.filter((media) => media.mediaType !== 'VIDEO').map(({ id, name, url, mediaType, position }) => ({ id, name, url, mediaType, position })),
    media: property.images.map(({ id, name, url, mediaType, position }) => ({ id, name, url, mediaType, position })),
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}

function parseInput(req, partial = false) {
  const schema = partial ? formSchema.partial() : formSchema;
  const parsed = schema.safeParse(asFormObject(req.body));
  if (!parsed.success) {
    deleteUploadedFiles(req.files);
    return { error: parsed.error.issues };
  }
  const data = { ...parsed.data };
  if (data.area === '') data.area = null;
  if (data.price !== undefined) data.price = data.price.toFixed(2);
  return { data };
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const q = String(req.query.q || '').trim();
    const where = {
      status: 'ACTIVE',
      ...(req.query.type ? { propertyType: String(req.query.type) } : {}),
      ...(req.query.location ? { location: { contains: String(req.query.location), mode: 'insensitive' } } : {}),
      ...(q ? { OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.property.findMany({ where, include: includeImages, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.property.count({ where }),
    ]);
    res.json({ items: items.map(propertyDto), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/saved', requireAuth, async (req, res, next) => {
  try {
    const saved = await prisma.savedProperty.findMany({ where: { userId: req.user.id, property: { status: 'ACTIVE' } }, include: { property: { include: includeImages } }, orderBy: { createdAt: 'desc' } });
    res.json({ items: saved.map((row) => propertyDto(row.property)) });
  } catch (error) { next(error); }
});

router.put('/saved/:propertyId', requireAuth, async (req, res, next) => {
  try {
    const property = await prisma.property.findFirst({ where: { id: req.params.propertyId, status: 'ACTIVE' }, select: { id: true } });
    if (!property) return res.status(404).json({ error: 'Property not found.' });
    await prisma.savedProperty.upsert({ where: { userId_propertyId: { userId: req.user.id, propertyId: property.id } }, update: {}, create: { userId: req.user.id, propertyId: property.id } });
    res.status(200).json({ saved: true });
  } catch (error) { next(error); }
});

router.delete('/saved/:propertyId', requireAuth, async (req, res, next) => {
  try {
    await prisma.savedProperty.deleteMany({ where: { userId: req.user.id, propertyId: req.params.propertyId } });
    res.json({ saved: false });
  } catch (error) { next(error); }
});

router.get('/admin/all', requireAdmin, async (req, res, next) => {
  try {
    const items = await prisma.property.findMany({ include: includeImages, orderBy: { createdAt: 'desc' } });
    res.json({ items: items.map(propertyDto) });
  } catch (error) { next(error); }
});

router.post('/admin', requireAdmin, (req, res, next) => {
  propertyMediaUpload(req, res, async (uploadError) => {
    if (uploadError) return next(uploadError);
    try {
      const parsed = parseInput(req);
      if (parsed.error) return res.status(400).json({ error: 'Invalid property data.', details: parsed.error });
      if (!req.files?.length) return res.status(400).json({ error: 'Upload at least one property image or video.' });
      const mediaError = validateMediaFiles(req.files);
      if (mediaError) { deleteUploadedFiles(req.files); return res.status(400).json({ error: mediaError }); }
      const data = parsed.data;
      const property = await prisma.property.create({
        data: {
          ...data,
          images: { create: req.files.map((file, index) => mediaRecord(file, index)) },
        },
        include: includeImages,
      });
      res.status(201).json({ item: propertyDto(property) });
    } catch (error) { deleteUploadedFiles(req.files); next(error); }
  });
});

router.patch('/admin/:id', requireAdmin, (req, res, next) => {
  propertyMediaUpload(req, res, async (uploadError) => {
    if (uploadError) return next(uploadError);
    try {
      const parsed = parseInput(req, true);
      if (parsed.error) return res.status(400).json({ error: 'Invalid property data.', details: parsed.error });
      const mediaError = validateMediaFiles(req.files || []);
      if (mediaError) { deleteUploadedFiles(req.files); return res.status(400).json({ error: mediaError }); }
      const current = await prisma.property.findUnique({ where: { id: req.params.id }, include: includeImages });
      if (!current) { deleteUploadedFiles(req.files); return res.status(404).json({ error: 'Property not found.' }); }
      const submittedRemoveUrls = req.body.removeMediaUrls ?? req.body.removeImageUrls;
      const removeUrls = Array.isArray(submittedRemoveUrls) ? submittedRemoveUrls.filter((url) => typeof url === 'string') : [];
      const removed = current.images.filter((image) => removeUrls.includes(image.url));
      const remainingCount = current.images.length - removed.length + (req.files?.length || 0);
      if (remainingCount > env.MAX_MEDIA_FILES) { deleteUploadedFiles(req.files); return res.status(400).json({ error: `A property can have at most ${env.MAX_MEDIA_FILES} media files.` }); }
      if (remainingCount < 1) { deleteUploadedFiles(req.files); return res.status(400).json({ error: 'A property must have at least one image or video.' }); }
      const data = parsed.data;
      const updated = await prisma.$transaction(async (tx) => {
        if (removed.length) await tx.propertyImage.deleteMany({ where: { id: { in: removed.map((image) => image.id) } } });
        if (req.files?.length) await tx.propertyImage.createMany({ data: req.files.map((file, i) => ({ propertyId: current.id, ...mediaRecord(file, current.images.length - removed.length + i) })) });
        if (Object.keys(data).length) await tx.property.update({ where: { id: current.id }, data });
        const images = await tx.propertyImage.findMany({ where: { propertyId: current.id }, orderBy: { position: 'asc' } });
        const property = await tx.property.findUnique({ where: { id: current.id } });
        return { ...property, images };
      });
      for (const image of removed) deleteLocalImage(image.url);
      res.json({ item: propertyDto(updated) });
    } catch (error) { deleteUploadedFiles(req.files); next(error); }
  });
});

router.delete('/admin/:id', requireAdmin, async (req, res, next) => {
  try {
    const property = await prisma.property.update({ where: { id: req.params.id }, data: { status: 'ARCHIVED' } });
    res.json({ item: { id: property.id, status: property.status } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const property = await prisma.property.findFirst({ where: { id: req.params.id, status: 'ACTIVE' }, include: includeImages });
    if (!property) return res.status(404).json({ error: 'Property not found.' });
    res.json({ item: propertyDto(property) });
  } catch (error) { next(error); }
});

export default router;
