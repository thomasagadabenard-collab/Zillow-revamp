import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { env } from '../config.js';
import { prisma } from '../db.js';
import { requireBuyer } from '../middleware/auth.js';
import { notifyAdmin } from '../mailer.js';

const router = Router();
const checkoutSchema = z.object({ propertyId: z.string().uuid() });

async function providerRequest(path, options = {}) {
  if (!env.NOWPAYMENTS_API_KEY) throw Object.assign(new Error('Crypto payments are not configured.'), { status: 503 });
  const response = await fetch(`${env.nowPaymentsApiBase}${path}`, {
    ...options,
    headers: { 'x-api-key': env.NOWPAYMENTS_API_KEY, 'content-type': 'application/json', ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || body.error || `Crypto provider returned HTTP ${response.status}.`;
    throw Object.assign(new Error(String(message)), { status: 502 });
  }
  return body;
}

function safeSignatureCheck(payload, received) {
  if (!env.NOWPAYMENTS_IPN_SECRET || typeof received !== 'string') return false;
  const ordered = Object.fromEntries(Object.keys(payload).sort().map((key) => [key, payload[key]]));
  const expected = createHmac('sha512', env.NOWPAYMENTS_IPN_SECRET).update(JSON.stringify(ordered)).digest('hex');
  const left = Buffer.from(expected.toLowerCase(), 'utf8');
  const right = Buffer.from(received.toLowerCase(), 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

function sameMoney(left, right) {
  const a = Number(left);
  const b = Number(right);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 0.01;
}

router.get('/supported-currencies', requireBuyer, async (_req, res, next) => {
  try {
    const result = await providerRequest('/currencies', { method: 'GET' });
    res.json({ currencies: result.currencies || [] });
  } catch (error) { next(error); }
});

router.post('/checkout', requireBuyer, async (req, res, next) => {
  let order;
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'A valid propertyId is required.' });
    if (!env.NOWPAYMENTS_API_KEY || !env.NOWPAYMENTS_IPN_SECRET) return res.status(503).json({ error: 'Crypto payments are not configured yet.' });
    const ipnUrl = new URL(env.NOWPAYMENTS_IPN_URL);
    if (env.isProduction && (ipnUrl.protocol !== 'https:' || ipnUrl.hostname === 'yourdomain.com' || ipnUrl.hostname === 'api.yourdomain.com' || ipnUrl.hostname === 'localhost')) {
      return res.status(503).json({ error: 'Set NOWPAYMENTS_IPN_URL to your public HTTPS webhook endpoint before enabling production crypto checkout.' });
    }

    const property = await prisma.property.findFirst({ where: { id: parsed.data.propertyId, status: 'ACTIVE' } });
    if (!property) return res.status(404).json({ error: 'This property is not available.' });
    const priceCurrency = property.currency.toLowerCase();
    if (priceCurrency !== env.NOWPAYMENTS_PRICE_CURRENCY.toLowerCase()) {
      return res.status(422).json({ error: `This listing is priced in ${property.currency}, but NOWPAYMENTS_PRICE_CURRENCY is ${env.NOWPAYMENTS_PRICE_CURRENCY.toUpperCase()}. Configure them to match or add a trusted server-side currency conversion before accepting payment.` });
    }

    order = await prisma.order.create({ data: {
      userId: req.user.id,
      propertyId: property.id,
      amount: property.price,
      priceCurrency: property.currency,
      payCurrency: env.NOWPAYMENTS_PAY_CURRENCY.toLowerCase(),
      status: 'PENDING',
    } });

    const invoice = await providerRequest('/invoice', {
      method: 'POST',
      body: JSON.stringify({
        price_amount: Number(property.price),
        price_currency: priceCurrency,
        pay_currency: env.NOWPAYMENTS_PAY_CURRENCY.toLowerCase(),
        order_id: order.id,
        order_description: `Property purchase: ${property.title}`.slice(0, 255),
        ipn_callback_url: env.NOWPAYMENTS_IPN_URL,
        success_url: `${env.clientUrl}/dashboard/transactions?order=${order.id}`,
        cancel_url: `${env.clientUrl}/dashboard/transactions?order=${order.id}&payment=cancelled`,
      }),
    });
    if (!invoice.id || !invoice.invoice_url) throw Object.assign(new Error('Crypto provider response did not include invoice details.'), { status: 502 });

    order = await prisma.order.update({
      where: { id: order.id },
      data: { providerInvoiceId: String(invoice.id), invoiceUrl: String(invoice.invoice_url) },
    });
    notifyAdmin(
      'Zillow Elite property purchase started',
      `A buyer started a cryptocurrency checkout.\n\nBuyer: ${req.user.name} <${req.user.email}>\nProperty: ${property.title}\nPrice: USD ${Number(property.price).toLocaleString()}\nRequired payment currency: ${env.NOWPAYMENTS_PAY_CURRENCY.toUpperCase()}\nOrder ID: ${order.id}\nStatus: awaiting payment\nInvoice: ${order.invoiceUrl}`,
    ).catch(() => {});
    res.status(201).json({ order: { id: order.id, status: order.status, amount: Number(order.amount), currency: order.priceCurrency, invoiceUrl: order.invoiceUrl } });
  } catch (error) {
    if (order?.id) await prisma.order.updateMany({ where: { id: order.id, status: 'PENDING' }, data: { status: 'FAILED', providerStatus: 'invoice_creation_failed' } }).catch(() => {});
    next(error);
  }
});

router.post('/nowpayments/ipn', async (req, res) => {
  const payload = req.body;
  const signature = req.get('x-nowpayments-sig');
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !safeSignatureCheck(payload, signature)) {
    return res.status(401).json({ error: 'Invalid payment notification signature.' });
  }

  const orderId = String(payload.order_id || '');
  const providerStatus = String(payload.payment_status || '').toLowerCase();
  if (!orderId || !providerStatus) return res.status(400).json({ error: 'Missing order_id or payment_status.' });

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (payload.invoice_id && order.providerInvoiceId && String(payload.invoice_id) !== order.providerInvoiceId) {
      return res.status(409).json({ error: 'Invoice ID does not match this order.' });
    }

    let status = order.status;
    if (order.status !== 'PAID' && order.status !== 'REFUNDED') {
      if (providerStatus === 'finished') {
        const amountMatches = sameMoney(payload.price_amount, order.amount);
        const currencyMatches = String(payload.price_currency || '').toLowerCase() === order.priceCurrency.toLowerCase();
        const payCurrencyMatches = String(payload.pay_currency || '').toLowerCase() === String(order.payCurrency || '').toLowerCase();
        status = amountMatches && currencyMatches && payCurrencyMatches ? 'PAID' : 'REVIEW';
      } else if (providerStatus === 'partially_paid') status = 'PARTIALLY_PAID';
      else if (['confirming', 'confirmed', 'sending'].includes(providerStatus)) status = 'CONFIRMING';
      else if (providerStatus === 'failed') status = 'FAILED';
      else if (providerStatus === 'expired') status = 'EXPIRED';
      else if (providerStatus === 'refunded') status = 'REFUNDED';
    } else if (order.status === 'PAID' && providerStatus === 'refunded') {
      status = 'REFUNDED';
    }

    const updateData = {
      status,
      providerStatus,
      providerPaymentId: payload.payment_id ? String(payload.payment_id) : order.providerPaymentId,
      payCurrency: payload.pay_currency ? String(payload.pay_currency).toLowerCase() : order.payCurrency,
      payAmount: payload.pay_amount != null && Number.isFinite(Number(payload.pay_amount)) ? String(payload.pay_amount) : order.payAmount,
      actuallyPaid: payload.actually_paid != null && Number.isFinite(Number(payload.actually_paid)) ? String(payload.actually_paid) : order.actuallyPaid,
      ipnPayload: payload,
      ...(status === 'PAID' && !order.paidAt ? { paidAt: new Date() } : {}),
    };
    await prisma.order.update({ where: { id: order.id }, data: updateData });
    if (status === 'PAID' && order.status !== 'PAID') {
      const paidOrder = await prisma.order.findUnique({ where: { id: order.id }, include: { user: true, property: true } });
      if (paidOrder) {
        notifyAdmin(
          'Zillow Elite crypto payment confirmed',
          `NOWPayments confirmed a BTC payment for a property order.\n\nBuyer: ${paidOrder.user.name} <${paidOrder.user.email}>\nProperty: ${paidOrder.property.title}\nPrice: USD ${Number(paidOrder.amount).toLocaleString()}\nOrder ID: ${paidOrder.id}\nPayment ID: ${paidOrder.providerPaymentId || 'not supplied'}\nPaid at: ${(paidOrder.paidAt || new Date()).toISOString()}`,
        ).catch(() => {});
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('NOWPayments IPN processing error:', error);
    return res.status(500).json({ error: 'Payment notification could not be processed.' });
  }
});

export default router;
