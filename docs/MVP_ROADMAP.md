# MVP Roadmap

## Phase 0 — What's in this scaffold (done)

- Monorepo (`apps/web`, `apps/api`) with Prisma/Postgres schema covering every entity in the spec.
- Auth: email/password + Google login, JWT access/refresh tokens, RBAC for 5 staff roles + customer.
- Catalog: categories, products, search/filter/pagination built to handle a 1000+ item catalog.
- Checkout: cart → order → Stripe PaymentIntent (card, Apple Pay, Google Pay via `automatic_payment_methods`).
- Wallet Hold state machine: Held → Released, and Refund Pending → Refunded, driven by Stripe webhooks and delivery-proof upload.
- Custom requests: submit → admin quote → convert to order → same payment/wallet pipeline.
- Delivery proof upload (photos, signature, receiver name, notes, timestamp) to S3/R2, with automatic wallet release.
- Procurement: supplier invoice upload, auto-transitions Processing → Purchased.
- Full customer dashboard (orders, wallet status, refund history, saved addresses, account settings).
- Full admin dashboard (analytics, products, categories, orders with status/assignment/proof, custom requests, refunds, customers, staff & role management) gated by role.
- All 13 required pages, green/white/dark-gray theme, responsive layout.

## Phase 1 — Pre-launch hardening (1–2 weeks)

- Replace placeholder image URLs and seed catalog with real product photography and ~50–100 real SKUs to start.
- Add automated tests: API integration tests for the checkout → webhook → wallet-release flow and the refund flow (these are the highest-risk paths).
- Add Sentry (or similar) error tracking on both apps.
- Add email notifications (order confirmation, payment received, out for delivery, delivered, refund processed) — SES or Postmark.
- Add pagination/infinite scroll polish and image optimization (next/image + a CDN) for the product grid at catalog scale.
- Security pass: helmet config review, rate limiting on all write endpoints (not just auth), input sanitization audit, dependency audit (`npm audit`).
- Load-test checkout and webhook endpoints; confirm Prisma connection pool sizing for concurrent orders.

## Phase 2 — Operational readiness (2–4 weeks)

- Admin: bulk product import (CSV/Excel) for reaching 1000+ SKUs quickly.
- Admin: delivery staff directory/picker in the assign-order flow (currently takes a raw user ID — swap for a searchable dropdown).
- Customer: order tracking timeline UI using `OrderStatusHistory` (already captured in the DB, not yet surfaced beyond the current status).
- Customer: email/SMS delivery notifications, receipt PDFs.
- Add a second delivery city (Herat or Mazar-i-Sharif): extend `DeliveryCity` enum usage in pricing/fees if delivery cost varies by city.
- Refund automation: auto-flag orders stuck in `OUT_FOR_DELIVERY` past an SLA window for support review.
- Basic fraud checks on checkout (velocity limits, Stripe Radar rules).

## Phase 3 — Growth (1–3 months)

- Multi-currency display (charge in USD via Stripe regardless, but show EUR/GBP/AUD/AED estimates for diaspora customers).
- Loyalty/referral program for repeat senders.
- Subscription/recurring orders ("send groceries every month").
- Multi-city delivery network with per-city courier partners and SLAs.
- Localized Dari/Pashto UI translation.
- Customer support live chat integration.
- Mobile app (React Native) sharing the same API.

## Key risks to track

- **Delivery verification integrity**: the wallet-release trigger is delivery-proof upload by Delivery Staff. As volume grows, add a secondary verification step (e.g. receiver SMS confirmation) before release, to reduce dispute risk.
- **Refund cash flow**: refunds hit the connected Stripe account directly; monitor Stripe balance vs. pending `REFUND_PENDING` liabilities so refunds never bounce for insufficient balance.
- **Cross-border compliance**: review whether facilitating purchases/deliveries into Afghanistan triggers any sanctions/export-control considerations for the target corridor countries — get legal review before processing real payments.
