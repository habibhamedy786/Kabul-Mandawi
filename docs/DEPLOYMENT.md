# Deployment Guide

This is a two-service deployment: the Next.js frontend (`apps/web`) on Vercel, and the Express API (`apps/api`) on a Node host with a managed Postgres database. Object storage for delivery proof photos and product images lives on Cloudflare R2 (S3-compatible).

## 1. Database (PostgreSQL)

Use a managed Postgres provider (Railway, Render, Supabase, or AWS RDS).

1. Create a Postgres instance and copy its connection string.
2. Set `DATABASE_URL` in `apps/api/.env`.
3. Run migrations and seed data:
   ```bash
   cd apps/api
   npx prisma migrate deploy
   npx prisma db seed
   ```
   The seed script creates a Super Admin, Admin, Procurement Officer, Delivery Staff, and Customer Support account (all `ChangeMe123!` — rotate immediately), a demo customer, 6 categories, and 16 starter products.

## 2. Object storage (Cloudflare R2 or AWS S3)

1. Create a bucket (e.g. `afc-uploads`).
2. If using R2, create an API token with read/write access and note the account ID — the S3-compatible endpoint is `https://<account-id>.r2.cloudflarestorage.com`.
3. Make the bucket's contents publicly readable (or front it with a CDN/custom domain) and set that base URL.
4. Set in `apps/api/.env`:
   ```
   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   S3_REGION=auto
   S3_BUCKET=afc-uploads
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   S3_PUBLIC_BASE_URL=https://uploads.afghanfamilycare.com
   ```

## 3. Stripe

1. Create a Stripe account, enable Apple Pay/Google Pay in the Stripe Dashboard (Payment method domains), and grab the test (then live) API keys.
2. Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in the API and web env files respectively.
3. Add a webhook endpoint pointing at `https://<your-api-domain>/api/payments/webhook`, subscribed to `payment_intent.succeeded` and `payment_intent.payment_failed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. The webhook route is registered in `apps/api/src/app.ts` with `express.raw()` **before** the global `express.json()` middleware — this ordering is required for Stripe's signature verification and must be preserved if the app is restructured.

## 4. API deployment (Render / Railway / Fly.io / a VPS)

1. Push this repo to GitHub.
2. Create a new Node service pointed at `apps/api`, build command `npm install && npx prisma generate && npm run build`, start command `npm run start`.
3. Set all variables from `apps/api/.env.example` as environment variables on the host: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `S3_*`, `CLIENT_URL` (the deployed frontend origin, used for CORS).
4. After first deploy, run `npx prisma migrate deploy` against production from a one-off shell/job.

## 5. Frontend deployment (Vercel)

1. Import the repo into Vercel, set the root directory to `apps/web`.
2. Environment variables: `NEXT_PUBLIC_API_BASE_URL` (e.g. `https://api.afghanfamilycare.com/api`), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
3. Deploy. Vercel will build the Next.js App Router project automatically (`next build`).
4. Point your domain (e.g. `afghanfamilycare.com`) at the Vercel deployment, and a subdomain (e.g. `api.afghanfamilycare.com`) at the API host. Update `CLIENT_URL` on the API and the Stripe webhook URL accordingly.

## 6. Google OAuth setup

1. In Google Cloud Console, create an OAuth 2.0 Client ID (Web application).
2. Authorized JavaScript origins: your frontend domain(s) (including `http://localhost:3000` for dev).
3. Copy the Client ID into both `GOOGLE_CLIENT_ID` (API) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (web).

## 7. Post-deploy checklist

- [ ] Rotate all seeded staff passwords.
- [ ] Confirm the Stripe webhook is receiving events (Stripe Dashboard → Webhooks → recent deliveries).
- [ ] Place a $1 test order end-to-end: checkout → pay with a Stripe test card → webhook fires → wallet held → upload delivery proof → wallet released → order completed.
- [ ] Verify CORS: `CLIENT_URL` on the API matches the live frontend origin exactly.
- [ ] Confirm uploaded delivery-proof photos are publicly viewable at `S3_PUBLIC_BASE_URL`.
- [ ] Set up DB backups (most managed Postgres providers offer automatic daily snapshots — enable them).

## Local development

```bash
# from repo root
npm install
cp apps/api/.env.example apps/api/.env      # fill in real values
cp apps/web/.env.example apps/web/.env.local

npm run db:migrate   # apps/api: prisma migrate dev
npm run db:seed      # apps/api: prisma db seed

npm run dev          # runs both apps/api (port 4000) and apps/web (port 3000)
```

Stripe webhooks locally: `stripe listen --forward-to localhost:4000/api/payments/webhook` and use the printed signing secret as `STRIPE_WEBHOOK_SECRET`.
