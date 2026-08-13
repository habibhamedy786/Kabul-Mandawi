# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A marketplace that lets Afghans living abroad buy goods for delivery to family in Afghanistan (Kabul at launch). Customers pay in USD from abroad; goods are purchased and delivered locally, and funds are held until delivery is proven.

**Naming**: the folder is `afghan-family-care` and packages are `@afc/web` / `@afc/api`, but the customer-facing brand is **Kabul Mandawi** (the GitHub repo is `Kabul-Mandawi`, the domain is `kabulmandawi.com`). All three names refer to the same project. The `afc_` prefix appears throughout localStorage keys, cookies, and the S3 bucket name.

## Commands

Run from the repo root — this is an npm workspaces monorepo.

```bash
npm run dev            # both apps: api on :4000, web on :3000 (concurrently)
npm run dev:web        # Next.js only
npm run dev:api        # Express only (tsx watch)
npm run build:web      # next build
npm run build:api      # prisma generate && tsc && tsc-alias
npm run db:migrate     # prisma migrate dev
npm run db:seed        # tsx prisma/seed.ts
```

Inside `apps/api` there is also `npm run db:studio` (Prisma Studio), `db:deploy` (`migrate deploy`, for production), and `db:generate`. Both apps have `lint`.

**There is no test suite** — no test script, no test directories, no test runner installed. Don't invent test commands or claim tests pass. If verification is needed, run the app and exercise the flow.

`.claude/launch.json` defines `web` and `api` preview configurations for the browser tools.

## Architecture

### Two apps, one API contract

`apps/web` (Next.js 14 App Router, TypeScript, Tailwind) is a pure client of `apps/api` (Express + Prisma + Postgres via Neon serverless adapter). There is no Next.js API route layer and no server-side data fetching from the database — **every** browser-to-data path goes through `apps/web/lib/api.ts`, a thin fetch wrapper pointed at `NEXT_PUBLIC_API_BASE_URL`. When adding a feature, you almost always touch a controller + route in `apps/api` and a caller in `lib/api.ts`.

Both apps use the `@/*` path alias mapped to their own app root.

### The Wallet Hold system (the core domain concept)

This is the part that requires reading several files to understand, and the part most likely to be broken by a careless edit. Live in `apps/api/src/services/wallet.service.ts`.

Money flow: the customer's card is **charged immediately** at checkout. "Held" is an internal bookkeeping state, not a Stripe authorization hold. The hold exists because goods are bought and delivered in Afghanistan after payment, and the customer is protected until delivery proof exists.

```
pay → HELD → (delivery proof uploaded) → RELEASED → order COMPLETED
           ↘ (delivery impossible)      → REFUND_PENDING → REFUNDED (real Stripe refund)
```

An order carries **two status fields that must stay in sync**: `Order.status` (`OrderStatus`) and `Order.walletStatus` (`WalletStatus`). The four functions in `wallet.service.ts` (`holdFunds`, `releaseFunds`, `requestRefund`, `processRefund`) each update the `WalletHold` row, the `Order` row's *both* fields, and append to `OrderStatusHistory`. Never update one of those in isolation — go through the service.

`apps/api/src/utils/orderStatus.ts` holds `ORDER_TRANSITIONS`, which validates **manual** admin status changes only. System-driven transitions (payment success → `PROCESSING`, delivery proof → `COMPLETED`) are performed by services and deliberately bypass that map. If a transition seems illegal but happens anyway, check whether a service is driving it.

### Payment providers are pluggable

Two gateways exist: **Stripe** (international cards, Apple/Google Pay) and **HesabPay** (Afghan digital wallet, see `HESABPAY_SETUP.md`). `PAYMENT_PROVIDER` env var selects which powers checkout. HesabPay config is entirely optional so the app boots without it.

Both webhooks are registered in `apps/api/src/app.ts` **before** `express.json()`, using `express.raw()`, because signature verification needs the unparsed body. Adding body-parsing middleware above them will silently break payment confirmation.

Note that `processRefund` is Stripe-only — it requires `payment.stripePaymentIntentId`. HesabPay refunds are not implemented.

### Auth and RBAC

JWT access (15m) + refresh (30d) tokens, stored in `localStorage` under `afc_access_token` / `afc_refresh_token`. Separately, `setAuthTokens` writes a **non-sensitive marker cookie** `afc_has_session=1` purely so Next.js middleware can redirect logged-out visitors away from `/dashboard` and `/admin` before render. The cookie carries no identity — never treat it as authentication.

There are **11 roles**. `apps/api/src/middleware/rbac.ts` defines named permission groups (`ANY_ADMIN`, `CATALOG`, `FINANCE`, `DELIVERY`, `SUPPORT`, `ANALYTICS`, …) rather than per-role checks. A role's real access is the union of every group it appears in. When adding an endpoint, reuse an existing group rather than listing roles inline.

### Localization and currency

Three languages — English, Dari (`fa`), Pashto (`ps`) — via `apps/web/context/LanguageContext.tsx` and `lib/i18n/`. **Dari is the default** and the layout is RTL-aware (`dir` comes from the context). Choice persists in `localStorage` under `afc_lang`. New user-facing strings belong in `lib/i18n/translations.ts`, not hardcoded in components.

Customers are **charged in USD**. AFN amounts are display-only, for receipts and Afghan recipients. `apps/api/src/services/currency.service.ts` pulls a live daily rate with a 12-hour cache and falls back to `AFN_PER_USD`. Keep that env fallback in sync with the storefront's `NEXT_PUBLIC_AFN_PER_USD`.

### Client state

Four React contexts in `apps/web/context/`: `AuthContext`, `CartContext`, `CurrencyContext`, `LanguageContext`. No Redux, no server state library — contexts plus `lib/api.ts` are the whole state story.

## Environment

`apps/api/src/config/env.ts` is the single source of truth and throws on boot if a required var is missing. Required: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_URL`. Everything else (Google OAuth, HesabPay, Resend email, S3/R2) is optional and degrades gracefully — email sending is skipped and logged when `RESEND_API_KEY` is absent.

Storage is S3-compatible (Cloudflare R2) and holds delivery proof photos.

## Reference docs

- `docs/API_ARCHITECTURE.md` — full endpoint reference and the wallet hold state machine
- `docs/DEPLOYMENT.md` — production deploy (Vercel + Node host + Postgres + R2 + Stripe)
- `docs/MVP_ROADMAP.md` — phased roadmap beyond the current scaffold
- `DEPLOY_FRONTEND.md` — click-by-click Vercel deploy, written for a non-technical operator
- `HESABPAY_SETUP.md` — HesabPay merchant onboarding

The seed script creates staff accounts with a shared default password documented in `README.md`; these are development credentials and must be rotated before launch.

## Working style for this repo

The owner is non-technical and deploys by pushing to GitHub via GitHub Desktop, with Vercel auto-deploying. Prefer explaining changes in plain language over jargon, and when a step must happen outside the editor (Vercel dashboard, DNS, Stripe dashboard), give click-by-click instructions.
