import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
}

// Price IDs - these will be created in Stripe dashboard
export const PRICE_IDS = {
  monthly: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || '',
  yearly: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || '',
};

// Create checkout session
export async function createCheckoutSession(
  priceId: string,
  userId: string,
  email: string
): Promise<string> {
  const response = await fetch('/.netlify/functions/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      userId,
      email,
      successUrl: `${window.location.origin}/dashboard?success=true`,
      cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const { sessionId } = await response.json();
  return sessionId;
}

// Redirect to Stripe Checkout
export async function redirectToCheckout(
  priceId: string,
  userId: string,
  email: string
) {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe not loaded');

  const sessionId = await createCheckoutSession(priceId, userId, email);

  // Use type assertion for redirectToCheckout as it exists but may not be in types
  const result = await (stripe as unknown as { redirectToCheckout: (opts: { sessionId: string }) => Promise<{ error?: Error }> }).redirectToCheckout({ sessionId });
  if (result.error) throw result.error;
}

// Create customer portal session
export async function createPortalSession(customerId: string): Promise<string> {
  const response = await fetch('/.netlify/functions/create-portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      returnUrl: `${window.location.origin}/dashboard`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }

  const { url } = await response.json();
  return url;
}
