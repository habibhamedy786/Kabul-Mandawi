"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/Button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function InnerForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please check your card details and try again.");
      setSubmitting(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Stripe's PaymentElement automatically surfaces Visa, Mastercard,
          Apple Pay and Google Pay when automatic_payment_methods is enabled
          server-side (see stripe.service.ts). */}
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || submitting}>
        {submitting ? "Processing payment…" : "Pay now"}
      </Button>
    </form>
  );
}

export function StripePaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#0f8a4c" } } }}
    >
      <InnerForm onSuccess={onSuccess} />
    </Elements>
  );
}
