import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  clientUrl: required("CLIENT_URL", "http://localhost:3000"),

  databaseUrl: required("DATABASE_URL"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },

  stripe: {
    secretKey: required("STRIPE_SECRET_KEY"),
    webhookSecret: required("STRIPE_WEBHOOK_SECRET"),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
  },

  // Which gateway powers checkout: "stripe" (international) or "hesabpay" (Afghanistan).
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "stripe",

  // Fallback AFN per 1 USD for receipts/emails, used only until the live daily
  // rate loads. Keep this in sync with the storefront's NEXT_PUBLIC_AFN_PER_USD.
  afnPerUsd: Number(process.env.AFN_PER_USD ?? 70),

  // HesabPay (hesab.com) — Afghanistan's digital wallet + card gateway.
  // All optional so the app boots without them; fill these in from your
  // HesabPay merchant dashboard once approved (see HESABPAY_SETUP.md).
  hesabpay: {
    apiKey: process.env.HESABPAY_API_KEY ?? "",
    merchantPin: process.env.HESABPAY_MERCHANT_PIN ?? "",
    webhookSecret: process.env.HESABPAY_WEBHOOK_SECRET ?? "",
    // Confirm the exact API base URL from HesabPay's merchant docs.
    baseUrl: process.env.HESABPAY_BASE_URL ?? "https://api.hesab.com",
  },

  // Transactional email via Resend (resend.com). Optional — email sending is
  // skipped (and logged) until RESEND_API_KEY is set.
  email: {
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    // Order / transactional emails come from this address (typically orders@).
    from: process.env.EMAIL_FROM ?? "Kabul Mandawi <onboarding@resend.dev>",
    // Account/support emails (e.g. password reset) come from support@ instead.
    // Falls back to EMAIL_FROM if not set separately.
    fromSupport:
      process.env.EMAIL_FROM_SUPPORT ??
      process.env.EMAIL_FROM ??
      "Kabul Mandawi Support <support@kabulmandawi.com>",
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "",
    region: process.env.S3_REGION ?? "auto",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.S3_BUCKET ?? "afc-delivery-proofs",
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "",
  },
};
