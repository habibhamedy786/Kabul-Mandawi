import { env } from "@/config/env";
import { formatAfn } from "@/services/currency.service";

/**
 * Transactional email via Resend's HTTP API (no SDK needed).
 * Until RESEND_API_KEY is configured, sends are skipped and logged so every
 * flow (password reset, order confirmation) still works in development.
 */

export function isEmailConfigured(): boolean {
  return Boolean(env.email.resendApiKey);
}

export async function sendEmail(params: { to: string; subject: string; html: string; from?: string }): Promise<void> {
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
      from: params.from ?? env.email.from,
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
        Kabul Mandawi — Afghanistan's online marketplace.<br/>
        کابل منډوی — بازار آنلاین افغانستان.
      </p>
    </div>
  </div>`;

// A right-to-left block for the Dari half of each email.
const rtl = (body: string) =>
  `<div dir="rtl" style="text-align:right; font-family:'Segoe UI',Tahoma,Arial,sans-serif;">${body}</div>`;

// A thin divider between the English and Dari halves.
const divider = `<hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />`;

export function passwordResetEmail(resetUrl: string) {
  const button = (label: string) =>
    `<p style="margin:24px 0;"><a href="${resetUrl}" style="background:#2f855a; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">${label}</a></p>`;
  return {
    subject: "Reset your Kabul Mandawi password — بازنشانی رمز عبور",
    html: wrapper(`
      <h2 style="margin-top:0;">Password reset</h2>
      <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
      ${button("Reset password")}
      <p>If you didn't request this, you can safely ignore this email — your password will not change.</p>
      ${divider}
      ${rtl(`
        <h2 style="margin-top:0;">بازنشانی رمز عبور</h2>
        <p>ما درخواستی برای بازنشانی رمز عبور شما دریافت کردیم. برای انتخاب رمز جدید روی دکمه زیر کلیک کنید. این لینک تا یک ساعت اعتبار دارد.</p>
        ${button("بازنشانی رمز عبور")}
        <p>اگر شما این درخواست را نداده‌اید، می‌توانید این ایمیل را نادیده بگیرید — رمز عبور شما تغییر نخواهد کرد.</p>
      `)}
    `),
  };
}

export function orderConfirmationEmail(params: {
  orderNumber: string;
  totalUsd: number;
  receiverName: string;
  city: string;
  items: { name: string; quantity: number; lineTotalUsd: number }[];
  afnPerUsd: number;
  cod?: boolean;
}) {
  const total = formatAfn(params.totalUsd, params.afnPerUsd);
  const rows = params.items
    .map((i) => `<tr><td style="padding:6px 0;">${i.name} × ${i.quantity}</td><td style="text-align:right;">${formatAfn(i.lineTotalUsd, params.afnPerUsd)}</td></tr>`)
    .join("");

  // English half.
  const introEn = params.cod
    ? `<h2 style="margin-top:0;">Your order is placed ✓</h2>
       <p>Your cash-on-delivery order <strong>${params.orderNumber}</strong> is confirmed. <strong>${params.receiverName}</strong> in ${params.city} pays <strong>${total}</strong> in cash when the order is delivered.</p>`
    : `<h2 style="margin-top:0;">Thank you — your payment was received ✓</h2>
       <p>Your order <strong>${params.orderNumber}</strong> is confirmed. The funds are held safely (Wallet Hold) and will only be released once delivery to <strong>${params.receiverName}</strong> in ${params.city} is confirmed with photo proof.</p>`;

  // Dari half.
  const introDa = params.cod
    ? `<h2 style="margin-top:0;">سفارش شما ثبت شد ✓</h2>
       <p>سفارش نقدی هنگام تحویل شما <strong>${params.orderNumber}</strong> تأیید شد. <strong>${params.receiverName}</strong> در ${params.city} هنگام تحویل مبلغ <strong>${total}</strong> را به صورت نقدی پرداخت می‌کند.</p>`
    : `<h2 style="margin-top:0;">سپاسگزاریم — پرداخت شما دریافت شد ✓</h2>
       <p>سفارش شما <strong>${params.orderNumber}</strong> تأیید شد. مبلغ پرداختی به‌طور امن نگهداری می‌شود (نگهداری در کیف پول) و تنها پس از تأیید تحویل به <strong>${params.receiverName}</strong> در ${params.city} همراه با اثبات تصویری آزاد خواهد شد.</p>`;

  // Shared invoice table (numbers are universal; labels are bilingual).
  const invoice = `
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <tr><td style="padding:6px 0; color:#718096; font-size:13px; border-bottom:1px solid #e2e8f0;">Order summary / خلاصه سفارش</td><td></td></tr>
      ${rows}
      <tr>
        <td style="padding:10px 0; border-top:1px solid #e2e8f0; font-weight:bold;">Total / مجموع</td>
        <td style="text-align:right; border-top:1px solid #e2e8f0; font-weight:bold;">${total}</td>
      </tr>
    </table>`;

  return {
    subject: `Order ${params.orderNumber} confirmed — سفارش ${params.orderNumber} تأیید شد | Kabul Mandawi`,
    html: wrapper(`
      ${introEn}
      <p>You can track your order anytime from your dashboard.</p>
      ${divider}
      ${rtl(`
        ${introDa}
        <p>شما می‌توانید سفارش خود را در هر زمان از داشبورد خود پیگیری کنید.</p>
      `)}
      ${invoice}
    `),
  };
}
