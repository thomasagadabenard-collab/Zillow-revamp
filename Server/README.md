# Zillow Elite Express API

This Express/Prisma API powers the React/Vite client in `../Client`. It uses PostgreSQL (including Neon), database-backed sessions, email/password buyer accounts, administrator login, mixed photo/video uploads, seller submissions, and NOWPayments USD-priced BTC invoices. For complete Windows setup steps, see [`../README.md`](../README.md).

## Requirements and local setup

Use Node.js 20 or newer. A local PostgreSQL installation or Docker is not required if you already have a Neon database.

In this `Server` directory, copy `.env.example` to `.env`, fill in the Neon `DATABASE_URL`, and set a random `SESSION_SECRET` of at least 32 characters. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters. Never commit `.env`.

```powershell
npm install
npm run db:generate
npm run db:deploy
npm run db:seed-admin
npm run dev
```

`db:deploy` applies the included migration history; it does not create a new development migration. For the API health check, open `http://localhost:4000/api/health`; expected JSON is `{"ok":true,"service":"zillowelite-api"}`. If you change the administrator password, run `npm run db:seed-admin` again.

## Buyer accounts and admin notifications

Buyer registration and sign-in use email and password. Passwords are bcrypt-hashed; registration asks only for the buyer's name, email, and password. Forgot-password links require working SMTP settings. Set `ADMIN_NOTIFICATION_EMAIL` and `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` to receive best-effort email notices for new registrations, seller requests, started checkouts, and verified payment confirmations. For Gmail, use an App Password. Email delivery is optional; without it, these notices and reset messages cannot be sent.

Use the seeded administrator credentials at the client's `/admin` route. Admins can publish or archive properties and review seller submissions. Do not use the admin login as a buyer account.

## NOWPayments USD-to-BTC

Set `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET` from your NOWPayments account. The defaults are `NOWPAYMENTS_PRICE_CURRENCY=usd` and `NOWPAYMENTS_PAY_CURRENCY=btc`; the admin form publishes listings only in USD. Set `NOWPAYMENTS_IPN_URL` to a publicly reachable HTTPS URL ending in `/api/payments/nowpayments/ipn` before production checkout, and set `API_PUBLIC_URL` to the public API origin. Localhost and the sample URL cannot receive provider callbacks.

Orders are marked paid only when a valid `x-nowpayments-sig` HMAC-SHA-512 webhook reports a completed payment and its saved USD price and BTC currency match the order. A browser return or invoice redirect is not proof of payment. Use the provider sandbox before real payments.

This checkout records an order; it does not transfer legal title, provide escrow, complete conveyancing, or establish buyer eligibility. Obtain appropriate legal, financial, security, and operational review before accepting real property payments.

## Upload storage

The API accepts up to eight JPEG/PNG/WEBP/AVIF images (up to 1.5 MB each) and MP4/WebM videos (up to 50 MB each) per property/submission. Files are written under `UPLOAD_DIR` and served at `/uploads`. In production, configure persistent disk storage or replace local-disk uploads with durable object storage; ephemeral application filesystems can lose uploads during redeploys. Set `API_PUBLIC_URL` to the externally reachable API origin so generated media URLs work.

## Main API routes

- `GET /api/health` — health check.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — buyer session.
- `POST /api/auth/admin/login` — administrator session.
- `POST /api/auth/profile`, `/api/auth/change-password`, `/api/auth/forgot-password`, `/api/auth/reset-password` — buyer account settings/reset.
- `GET /api/properties?page=1&limit=20&q=...`, `GET /api/properties/:id` — active listings.
- `GET /api/properties/saved`, `PUT/DELETE /api/properties/saved/:propertyId` — buyer favorites.
- `GET /api/properties/admin/all`, `POST /api/properties/admin`, `PATCH/DELETE /api/properties/admin/:id` — admin catalogue and publishing.
- `POST /api/inquiries` — public seller submission with optional media; `GET/PATCH /api/inquiries/admin...` — admin review.
- `POST /api/payments/checkout`, `GET /api/payments/supported-currencies`, `POST /api/payments/nowpayments/ipn` — BTC invoice and signed provider callback.
- `GET /api/orders` and `GET /api/orders/:id` — signed-in buyer order history.

Browser requests use cookie sessions and must include credentials; the included client API helper does this. For cross-site production deployments, use HTTPS, configure exact `CLIENT_URL`, `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`, and the correct `TRUST_PROXY` value.
