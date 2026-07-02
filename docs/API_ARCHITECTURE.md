# API Architecture

Base URL: `{API_BASE_URL}/api` (e.g. `http://localhost:4000/api` in development).

All authenticated requests send `Authorization: Bearer <accessToken>`. Access tokens are short-lived JWTs; refresh tokens are stored server-side (`RefreshToken` table) and rotated on every `/auth/refresh` call.

## Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | Create a customer account. Returns `{ user, accessToken, refreshToken }`. |
| POST | `/auth/login` | none | Email/password login. |
| POST | `/auth/google` | none | Body `{ idToken }`. Verifies a Google ID token server-side and logs in or creates a linked account. |
| POST | `/auth/refresh` | none | Body `{ refreshToken }`. Rotates the refresh token, returns a new pair. |
| POST | `/auth/logout` | none | Body `{ refreshToken }`. Revokes the token. |

`/auth/register`, `/auth/login`, `/auth/google` are rate-limited (30 requests / 15 min / IP).

## Users — `/users`, `/admin/users`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/users/me` | any | Current user profile + saved addresses. |
| PATCH | `/users/me` | any | Update name/phone/country. |
| GET | `/users/me/addresses` | any | List saved delivery addresses. |
| POST | `/users/me/addresses` | any | Add a saved address. |
| DELETE | `/users/me/addresses/:id` | any (owner) | Remove a saved address. |
| GET | `/admin/users` | Super Admin, Admin | Paginated user list (`?role=&search=&page=&pageSize=`). |
| PATCH | `/admin/users/:id/role` | Super Admin | Change a user's role. |
| PATCH | `/admin/users/:id/status` | Super Admin, Admin | Activate/deactivate a user. |

## Catalog — `/categories`, `/products`, `/admin/categories`, `/admin/products`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/categories` | public | Active categories with product counts. |
| GET | `/products` | public | `?category=&city=&search=&featured=&page=&pageSize=` (pageSize up to 100), supports a 1000+ item catalog. |
| GET | `/products/:id` | public | Single product detail. |
| POST | `/admin/categories` | Admin | Create category. |
| PATCH | `/admin/categories/:id` | Admin | Update category. |
| DELETE | `/admin/categories/:id` | Admin | Soft-delete (sets `isActive: false`). |
| POST | `/admin/products` | Admin | Create product. |
| PATCH | `/admin/products/:id` | Admin | Update product. |
| DELETE | `/admin/products/:id` | Admin | Soft-delete. |
| PATCH | `/admin/products/:id/restock` | Procurement Officer | Update stock quantity. |

## Orders — `/orders`, `/admin/orders`, `/delivery`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/orders` | customer | Checkout. Validates cart items, computes totals + $5 delivery fee, creates the `Order`/`OrderItem`s, creates a Stripe `PaymentIntent`, returns `{ order, clientSecret }`. |
| GET | `/orders/mine` | customer | All orders for the logged-in customer. |
| GET | `/orders/:id` | owner or staff | Full order detail incl. items, payment, wallet hold, delivery proof, refund, status history. |
| GET | `/admin/orders` | any staff | Paginated/filterable order list (`?status=&city=&page=&pageSize=`). |
| PATCH | `/admin/orders/:id/status` | any staff | Manual status transition, validated against the allowed-transitions map (see Wallet Hold below). Moving to `REFUND_PENDING` triggers the refund-request flow automatically. |
| PATCH | `/admin/orders/:id/assign` | Admin | Assign a Delivery Staff user to the order. |
| GET | `/delivery/my-assignments` | Delivery Staff | Orders assigned to the current delivery staff member with status `PURCHASED` or `OUT_FOR_DELIVERY`. |

## Custom Requests — `/custom-requests`, `/admin/custom-requests`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/custom-requests` | customer | Free-text request: title, description, city, receiver info. |
| GET | `/custom-requests/mine` | customer | Customer's own requests + any converted order. |
| GET | `/admin/custom-requests` | Admin, Customer Support | `?status=` filter. |
| PATCH | `/admin/custom-requests/:id/quote` | Admin | Body `{ quotedAmountUsd, quoteNote }`. |
| POST | `/admin/custom-requests/:id/convert` | Admin | Converts a quoted request into a real `Order` with its own Stripe PaymentIntent (the same payment/wallet pipeline as catalog checkout). |
| PATCH | `/admin/custom-requests/:id/decline` | Admin | Body `{ note }`. |

## Payments — `/payments`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/payments/config` | public | Returns the Stripe publishable key for the frontend. |
| POST | `/payments/webhook` | Stripe signature | Registered directly in `app.ts` with `express.raw()` (must run before the global JSON body parser). Handles `payment_intent.succeeded` (→ `walletService.holdFunds`) and `payment_intent.payment_failed`. |

## Wallet & Refunds — `/wallet`, `/admin/refunds`, `/admin/orders/:id/refund-*`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/wallet/mine` | customer | `{ held, released, refunds, orders }` — orders grouped by wallet state. |
| GET | `/admin/refunds` | Admin, Support | `?status=` filter; includes order + customer. |
| POST | `/admin/orders/:id/refund-request` | any staff | Flags an order as undeliverable; moves wallet/order to `REFUND_PENDING`. |
| POST | `/admin/orders/:id/refund-process` | Admin | Issues the actual Stripe refund, sets `REFUNDED`. |

## Delivery Proof & Procurement — `/orders/:id/delivery-proof`, `/admin/orders/:id/*`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/orders/:id/delivery-proof` | owner or staff | View uploaded proof. |
| POST | `/admin/orders/:id/delivery-proof` | Delivery Staff | `multipart/form-data`: `photos[]` (≤5), `signature` (optional), `receiverName`, `deliveryNotes`. Uploads to S3/R2, sets order `DELIVERED`, and calls `walletService.releaseFunds` — this is the step that flips Wallet Hold from `HELD` to `RELEASED` and the order to `COMPLETED`. |
| POST | `/admin/orders/:id/supplier-invoice` | Procurement Officer | Records a supplier invoice and auto-advances `PROCESSING → PURCHASED`. |

## Analytics — `/admin/analytics/overview`

Returns total orders, customers, active products, revenue collected, wallet funds held, pending custom requests, pending refunds, an orders-by-status breakdown, and the last 30 days of orders — backing the Admin Overview page.

## Wallet Hold state machine

```
PENDING_PAYMENT --(Stripe payment_intent.succeeded)--> PAYMENT_RECEIVED --> PROCESSING   [wallet: HELD]
PROCESSING --(supplier invoice uploaded)--> PURCHASED
PURCHASED --(admin)--> OUT_FOR_DELIVERY
OUT_FOR_DELIVERY --(delivery proof uploaded)--> DELIVERED --(system)--> COMPLETED   [wallet: RELEASED]
any of PROCESSING/PURCHASED/OUT_FOR_DELIVERY/DELIVERED --(admin)--> REFUND_PENDING [wallet: REFUND_PENDING]
REFUND_PENDING --(admin processes Stripe refund)--> REFUNDED   [wallet: REFUNDED]
PENDING_PAYMENT/PAYMENT_RECEIVED/PROCESSING --(admin)--> CANCELLED
```

Automatic transitions (payment success, delivery-proof upload) are driven by `wallet.service.ts` and bypass the manual-transition map in `utils/orderStatus.ts`, which only governs admin-initiated status changes via `PATCH /admin/orders/:id/status`.
