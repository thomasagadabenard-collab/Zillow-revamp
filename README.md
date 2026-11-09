# Zillow Elite — React client and Express API

This project contains the existing React/Vite website (`Client`) and the Express/Prisma API (`Server`). The API stores users, listings, saved properties, seller requests, and crypto orders in PostgreSQL; it is designed to use your Neon database. Buyer accounts use email and password (no Google sign-in). Property prices are USD and NOWPayments checkout is configured for BTC.

## Requirements

- Node.js 20 or newer and npm.
- A Neon PostgreSQL database and its connection string.
- A NOWPayments account/API key and IPN secret for real BTC checkout.
- An SMTP account if you want admin email notifications and password reset emails.

Docker and a local PostgreSQL installation are not needed when using Neon.

## 1. Set up and start the API (PowerShell)

Open PowerShell in the `Server` folder (in File Explorer, open the folder, click the address bar, type `powershell`, and press Enter). Then run:

```powershell
Copy-Item .env.example .env
notepad .env
```

In `.env`, enter your Neon `DATABASE_URL`, set a unique `SESSION_SECRET` (generate one with the command below), and set `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 12 characters. Do not add quotes around values unless your provider's value requires them, and never share or commit this file.

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Save `.env`, then run these commands in the `Server` folder:

```powershell
npm install
npm run db:generate
npm run db:deploy
npm run db:seed-admin
npm run dev
```

`db:deploy` applies the included Prisma migrations—including the additive media, kitchen, seller-request, and password-reset changes—without creating a new migration. Keep this terminal running. Check `http://localhost:4000/api/health`; a healthy response is `{"ok":true,"service":"zillowelite-api"}`. The administrator signs in at `http://localhost:5173/admin` after the client is running. If you change `ADMIN_PASSWORD` later, run `npm run db:seed-admin` again to update the stored password hash.

## 2. Set up and start the React client

Open a second PowerShell window in the `Client` folder and run:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The included client `.env.example` points to `http://localhost:4000`. Open the Vite URL shown in the terminal (normally `http://localhost:5173`). If your API uses a different URL, set `VITE_API_URL` in `Client/.env` and restart Vite.

## 3. Configure services

**Neon:** keep the connection string in `Server/.env` as `DATABASE_URL`. It must include the connection details and SSL option provided by Neon. Do not commit it.

**Email:** set `ADMIN_NOTIFICATION_EMAIL` to where admin notices should arrive, and configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`. For Gmail, use an App Password rather than your normal Google account password. SMTP is needed for account-registration and purchase-start/confirmation notices, seller request notices, and password-reset emails; the website still works without email, but those email features will not send.

**NOWPayments:** set `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET` from your merchant account. The server defaults to `NOWPAYMENTS_PRICE_CURRENCY=usd` and `NOWPAYMENTS_PAY_CURRENCY=btc`. For production, set `NOWPAYMENTS_IPN_URL` to the public HTTPS endpoint `https://YOUR_API_HOST/api/payments/nowpayments/ipn`; a localhost or example URL cannot receive payment notifications. Also set `API_PUBLIC_URL` to your externally reachable API origin. The provider callback, not the buyer's return to the site, determines whether an order is marked paid. Test with the provider's sandbox before enabling real payments.

**Images and videos:** admin property publishing and seller requests accept up to eight JPEG/PNG/WEBP/AVIF images (1.5 MB each) and MP4/WebM videos (50 MB each). Development uploads are stored under `Server/uploads` and served from `/uploads`. On deployment, use a host with persistent disk storage or change the upload adapter to durable object storage; ephemeral disks can lose media during redeploys.

**Production sessions:** use HTTPS, set `NODE_ENV=production`, `COOKIE_SECURE=true`, and configure `CLIENT_URL`, `API_PUBLIC_URL`, and `TRUST_PROXY` for your deployment. If the client and API are on different sites, set `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`.

## What is connected

- Email/password account registration, sign-in, profile/password settings, and one-time email reset links.
- Live public property listings and details, including multiple photo/video media, bedroom, bathroom, kitchen, area, USD price, and saved-property hearts.
- Admin sign-in, listing publication/archive, and an inbox to review seller submissions and update their status.
- Buyer order history whose payment state is changed only by a valid NOWPayments IPN.
- Homepage Explore Homes, Explore Loans, and Explore Opportunities cards route to the dashboard.
- Account registrations, seller submissions, and purchase checkout/payment events trigger best-effort admin email notifications when SMTP is configured.

## Useful checks

Run `npm run lint` and `npm run build` in `Client`. Run `npm run check` in `Server`. To use a deployed database for migrations, run `npm run db:deploy` in `Server` after reviewing backups and the target database.

The crypto invoice code records a payment order; it does not transfer legal title, provide escrow, complete conveyancing, or verify a buyer's eligibility. Obtain appropriate legal, financial, security, and operational review before using this for real property settlements.
