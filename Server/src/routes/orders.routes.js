import { Router } from 'express';
import { prisma } from '../db.js';
import { requireBuyer } from '../middleware/auth.js';

const router = Router();

function orderDto(order) {
  return {
    id: order.id,
    status: order.status,
    providerStatus: order.providerStatus,
    amount: Number(order.amount),
    currency: order.priceCurrency,
    property: {
      id: order.property.id,
      title: order.property.title,
      location: order.property.location,
      images: order.property.images.map(({ id, name, url, mediaType }) => ({ id, name, url, mediaType })),
    },
    invoiceUrl: order.invoiceUrl,
    payCurrency: order.payCurrency,
    payAmount: order.payAmount ? Number(order.payAmount) : null,
    actuallyPaid: order.actuallyPaid ? Number(order.actuallyPaid) : null,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

router.get('/', requireBuyer, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { property: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ items: orders.map(orderDto) });
  } catch (error) { next(error); }
});

router.get('/:id', requireBuyer, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { property: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
    });
    if (!order) return res.status(404).json({ error: 'Transaction not found.' });
    res.json({ item: orderDto(order) });
  } catch (error) { next(error); }
});

export default router;
