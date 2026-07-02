# HesabPay Setup — What You Need to Do

This project is **pre-wired for HesabPay**. The plumbing is done and waiting; it just
needs your real merchant credentials and a few API details from HesabPay to go live.
Nothing here affects the current site — it stays dormant until the keys below are filled in.

---

## Step 1 — Become a HesabPay merchant (only you can do this)

1. Go to **https://hesab.com** and apply for a **Business / Merchant account**.
2. Complete their verification (business documents, Afghan bank account for payouts).
3. Once approved, you'll get access to a **merchant dashboard**.

## Step 2 — Get these 5 things from HesabPay and send them to me

When you contact HesabPay support (or read their merchant API docs), get:

| # | What to ask for | Where it goes |
|---|-----------------|----------------|
| 1 | **API Key** (merchant secret key) | `HESABPAY_API_KEY` |
| 2 | **Merchant PIN** | `HESABPAY_MERCHANT_PIN` |
| 3 | **Webhook signing secret** | `HESABPAY_WEBHOOK_SECRET` |
| 4 | **API base URL** (the real address of their API) | `HESABPAY_BASE_URL` |
| 5 | **Their merchant API documentation (PDF or link)** | I read this to finish the code |

## Step 3 — Ask HesabPay these 4 questions (they decide a few code details)

1. **Does HesabPay support holding funds until I confirm delivery** (escrow / authorize-then-capture)?
   - If **yes** → we keep the full "Wallet Hold" experience (money held until the family receives the order).
   - If **no** → we charge at checkout and use the existing **"Process refund"** button if a delivery can't be completed. (Your app already supports this.)
2. **What currency must I charge in — USD or Afghani (AFN)?**
3. **What does the "payment succeeded" webhook look like** (which fields tell me the order reference and status)?
4. **What are the merchant fees per transaction?**

---

## What's already built (so you know it's ready)

- ✅ Config slots for all HesabPay keys (`apps/api/.env` + `src/config/env.ts`)
- ✅ A `PAYMENT_PROVIDER` switch — flip from `stripe` to `hesabpay` to go live
- ✅ Payment service skeleton (`src/services/hesabpay.service.ts`)
- ✅ Create-payment endpoint: `POST /api/payments/hesabpay/create`
- ✅ Webhook receiver: `POST /api/payments/hesabpay/webhook` (reuses the Wallet Hold + refund logic you already have)
- ✅ All of it is guarded — the app runs normally and ignores HesabPay until the keys are set.

## What I finish once you send me Step 2 + Step 3 answers

1. Fill in the real API endpoint paths, fields and auth headers (marked `TODO` in the code).
2. Wire the checkout button to redirect customers to HesabPay.
3. Point the "Process refund" button at HesabPay's refund.
4. Test the full flow end-to-end, then flip `PAYMENT_PROVIDER=hesabpay`.

After that, real money can move and your store is open for business.
