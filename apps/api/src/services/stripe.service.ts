import Stripe from "stripe";
import { env } from "@/config/env";

export const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: "2024-06-20",
});

/**
 * Creates a PaymentIntent for an order. The frontend uses Stripe Elements /
 * Payment Request Button to collect Visa, Mastercard, Apple Pay or Google Pay
 * and confirms this intent client-side. We never touch raw card data.
 */
export async function createPaymentIntentForOrder(params: {
  orderId: string;
  amountUsd: number;
  customerEmail: string;
}) {
  return stripe.paymentIntents.create({
    amount: Math.round(params.amountUsd * 100), // cents
    currency: "usd",
    automatic_payment_methods: { enabled: true }, // enables card, Apple Pay, Google Pay
    receipt_email: params.customerEmail,
    metadata: { orderId: params.orderId },
  });
}
