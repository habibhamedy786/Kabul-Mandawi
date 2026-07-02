import { env } from "@/config/env";

/**
 * Transactional email via Resend's HTTP API (no SDK needed).
 * Until RESEND_API_KEY is configured, sends are skipped and logged so every
 * flow (password reset, order confirmation) still works in development.
 */

export function isEmailConfigured(): boolean {
  return Boolean(env.email.resendApiKey);
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(`[email skipped — RESEND_API_KEY not set] to=${params.to} subject="${params.subject}"`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.email.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.email.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    // Log but never crash the caller — a failed email must not fail an order.
    console.error(`Resend error ${res.status}: ${await res.text()}`);
  }
}

const wrapper = (body: string) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1a202c;">
    <div style="background:#2f855a; color:#fff; padding:16px 24px; border-radius:12px 12px 0 0; font-size:18px; font-weight:bold;">
      Kabul Mandawi
    </div>
    <div style="border:1px solid #e2e8f0; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
      ${body}
      <p style="color:#718096; font-size:12px; margin-top:24px;">
        Kabul Mandawi — send love home to Afghanistan.
      </p>
    </div>
  </div>`;

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: "Reset your Kabul Mandawi password",
    html: wrapper(`
      <h2 style="margin-top:0;">Password reset</h2>
      <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
      <p style="margin:24px 0;">
        <a href="${resetUrl}" style="background:#2f855a; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">Reset password</a>
      </p>
      <p>If you didn't request this, you can safely ignore this email — your password will not change.</p>
    `),
  };
}

export function orderConfirmationEmail(params: {
  orderNumber: string;
  totalUsd: number;
  receiverName: string;
  city: string;
  items: { name: string; quantity: number; lineTotalUsd: number }[];
  cod?: boolean;
}) {
  const rows = params.items
    .map((i) => `<tr><td style="padding:6px 0;">${i.name} × ${i.quantity}</td><td style="text-align:right;">$${i.lineTotalUsd.toFixed(2)}</td></tr>`)
    .join("");
  const intro = params.cod
    ? `<h2 style="margin-top:0;">Your order is placed ✓</h2>
       <p>Your cash-on-delivery order <strong>${params.orderNumber}</strong> is confirmed. <strong>${params.receiverName}</strong> in ${params.city} pays <strong>$${params.totalUsd.toFixed(2)}</strong> in cash when the order is delivered.</p>`
    : `<h2 style="margin-top:0;">Thank you — your payment was received ✓</h2>
       <p>Your order <strong>${params.orderNumber}</strong> is confirmed. The funds are held safely (Wallet Hold) and will only be released once delivery to <strong>${params.receiverName}</strong> in ${params.city} is confirmed with photo proof.</p>`;
  return {
    subject: `Order ${params.orderNumber} confirmed — Kabul Mandawi`,
    html: wrapper(`
      ${intro}
      <table style="width:100%; border-collapse:collapse; margin:16px 0;">${rows}
        <tr><td style="padding:10px 0; border-top:1px solid #e2e8f0; font-weight:bold;">Total</td><td style="text-align:right; border-top:1px solid #e2e8f0; font-weight:bold;">$${params.totalUsd.toFixed(2)}</td></tr>
      </table>
      <p>You can track your order anytime from your dashboard.</p>
    `),
  };
}
