import { env } from "@/config/env";

/**
 * HesabPay payment service — SCAFFOLD (ready for real API details).
 *
 * HesabPay (hesab.com) is Afghanistan's main digital wallet + card gateway.
 * Based on their published merchant model (API Key + Merchant PIN + Webhook URL),
 * the integration follows a hosted-checkout + webhook pattern that mirrors the
 * existing Stripe flow:
 *
 *   1. createPaymentForOrder()  → ask HesabPay to create a payment for an order,
 *                                 receive a payment URL + provider reference.
 *   2. The customer is redirected to that URL to pay with their HesabPay wallet,
 *      Visa, Mastercard, Apple Pay or Google Pay.
 *   3. HesabPay calls our webhook (POST /api/payments/hesabpay/webhook) when the
 *      payment succeeds → we mark the order paid and place the Wallet Hold
 *      (exactly like the Stripe webhook does today).
 *   4. refundPayment()          → issue a refund through HesabPay's API (wired to
 *                                 the same admin "Process refund" button).
 *
 * ⚠️  The endpoint paths, request fields, auth headers and response shapes below
 *     are PLACEHOLDERS. Replace them with the real values from HesabPay's merchant
 *     API documentation — see HESABPAY_SETUP.md for the exact checklist of what to
 *     request from HesabPay. Everything is guarded by isHesabPayConfigured(), so
 *     the app runs untouched until real keys are provided.
 */

/** True once the merchant API key + PIN are set in the environment. */
export function isHesabPayConfigured(): boolean {
  return Boolean(env.hesabpay.apiKey && env.hesabpay.merchantPin);
}

interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amountUsd: number;
  customerEmail: string;
}

interface HesabPayCreateResult {
  /** Where to redirect the customer to complete payment. */
  paymentUrl: string;
  /** HesabPay's id for this payment — store it on the Payment row for refunds. */
  providerRef: string;
}

/** Thin wrapper around HesabPay's REST API. TODO: confirm auth header format. */
async function hesabFetch(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${env.hesabpay.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // TODO: confirm HesabPay's auth scheme (Bearer token? "API-KEY" header? + Merchant-PIN?)
      Authorization: `Bearer ${env.hesabpay.apiKey}`,
      "X-Merchant-PIN": env.hesabpay.merchantPin,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HesabPay API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/** Step 1: create a HesabPay payment for an order and get a redirect URL. */
export async function createPaymentForOrder(params: CreatePaymentParams): Promise<HesabPayCreateResult> {
  if (!isHesabPayConfigured()) throw new Error("HesabPay is not configured yet.");

  // TODO: replace the path and payload with HesabPay's real "create payment" endpoint.
  const data = (await hesabFetch("/v1/payments/create", {
    amount: params.amountUsd,
    currency: "USD", // TODO: confirm — HesabPay settlement may require AFN
    reference: params.orderNumber,
    email: params.customerEmail,
    success_url: `${env.clientUrl}/dashboard/orders`,
    cancel_url: `${env.clientUrl}/checkout`,
    metadata: { orderId: params.orderId },
  })) as { payment_url?: string; id?: string };

  return {
    paymentUrl: data.payment_url ?? "",
    providerRef: data.id ?? "",
  };
}

/** Step 4: refund a captured HesabPay payment. */
export async function refundPayment(providerRef: string): Promise<{ refundId: string }> {
  if (!isHesabPayConfigured()) throw new Error("HesabPay is not configured yet.");

  // TODO: replace with HesabPay's real refund endpoint + field names.
  const data = (await hesabFetch("/v1/payments/refund", { payment_id: providerRef })) as { refund_id?: string };
  return { refundId: data.refund_id ?? "" };
}

/** Verifies a webhook actually came from HesabPay before we trust it. */
export function verifyWebhookSignature(_rawBody: Buffer, signature: string | undefined): boolean {
  // TODO: implement HesabPay's signature check (likely HMAC-SHA256 of the raw
  //       body using webhookSecret, compared against a header). Until the exact
  //       scheme is confirmed, we at minimum require the secret + a signature.
  return Boolean(env.hesabpay.webhookSecret && signature);
}

/**
 * Normalises a HesabPay webhook body into the few fields we care about.
 * TODO: map these to HesabPay's real webhook payload field names.
 */
export function parseWebhookEvent(body: Record<string, unknown>): {
  type: "succeeded" | "failed" | "other";
  orderId?: string;
  providerRef?: string;
} {
  const status = String(body.status ?? body.event ?? "").toLowerCase();
  const metadata = (body.metadata ?? {}) as Record<string, unknown>;
  const type = status.includes("success") || status.includes("paid")
    ? "succeeded"
    : status.includes("fail") || status.includes("declin")
      ? "failed"
      : "other";
  return {
    type,
    orderId: (metadata.orderId as string) ?? (body.reference as string) ?? undefined,
    providerRef: (body.id as string) ?? (body.payment_id as string) ?? undefined,
  };
}
