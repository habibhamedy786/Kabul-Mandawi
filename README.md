# Afghan Family Care

A full-stack marketplace MVP that lets Afghans living abroad (US, Canada, Germany, Turkey, UK, Australia, Gulf countries) buy groceries, flowers, electronics, clothing, and gifts — plus submit custom requests — for delivery to family in Afghanistan (Kabul at launch).

## Monorepo layout

```
afghan-family-care/
├── apps/
│   ├── web/     Next.js 14 (App Router) + TypeScript + Tailwind — all 13 customer/admin pages
│   └── api/     Express + TypeScript + Prisma — REST API, auth, Stripe, wallet hold, RBAC
├── docs/
│   ├── API_ARCHITECTURE.md   Full endpoint reference + wallet hold state machine
│   ├── DEPLOYMENT.md         Step-by-step deploy to Vercel + a Node host + Postgres + R2/S3 + Stripe
│   └── MVP_ROADMAP.md        Phased roadmap from this scaffold to production scale
└── package.json  npm workspaces root
```

## What's included

- **Database**: complete Prisma/Postgres schema — users, RBAC roles, categories, products, orders, order items, custom requests, payments, wallet holds, refunds, delivery proofs, supplier invoices, audit log, status history.
- **Auth**: JWT access/refresh tokens with rotation, Google OAuth login, role-based middleware (`Super Admin`, `Admin`, `Procurement Officer`, `Delivery Staff`, `Customer Support`, `Customer`).
- **Catalog & checkout**: filterable/paginated product API built for 1000+ SKUs, cart, checkout with receiver details, Stripe PaymentIntents supporting Visa, Mastercard, Apple Pay, and Google Pay.
- **Wallet Hold system**: pay → held → processing → delivery proof uploaded → released → completed, with a parallel refund-pending → refunded path. Implemented as its own service layer so it's triggered consistently by the Stripe webhook and the delivery-proof upload.
- **Custom requests**: free-text submission → admin quote → convert to a real order (same payment pipeline as catalog checkout).
- **Admin panel**: analytics overview, products, categories, orders (status transitions, delivery-staff assignment, delivery-proof upload, supplier invoices), custom requests, refunds, customers, and staff/role management — all gated by role.
- **Customer dashboard**: active/completed orders, wallet hold status, refund history, delivery photos, saved addresses, account settings.
- **UI**: green/white/dark-gray theme, responsive across mobile/tablet/desktop, the exact homepage hero copy and five trust features from the spec.

## Quick start

```bash
npm install
cp apps/api/.env.example apps/api/.env       # fill in DB, JWT, Google, Stripe, S3/R2 keys
cp apps/web/.env.example apps/web/.env.local

cd apps/api && npx prisma migrate dev && npx prisma db seed && cd ../..
npm run dev    # apps/api on :4000, apps/web on :3000
```

Seeded accounts (password `ChangeMe123!` — rotate before going live): `superadmin@afghanfamilycare.com`, `procurement@afghanfamilycare.com`, `delivery@afghanfamilycare.com`, `support@afghanfamilycare.com`, plus a demo customer.

See `docs/API_ARCHITECTURE.md` for the full endpoint reference and `docs/DEPLOYMENT.md` for production deployment (Vercel + Render/Railway + Postgres + Cloudflare R2 + Stripe). `docs/MVP_ROADMAP.md` covers what to do after this scaffold: testing, real catalog data, notifications, and growth features.

## Note on scope

This is a complete, working codebase — not a deployed live app. It's meant to be pushed to GitHub and deployed with your own database, Stripe account, and storage bucket per `docs/DEPLOYMENT.md`.
