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

// Price ID for $5 every 6 months recurring subscription
export const FAST_PRICE_ID = import.meta.env.VITE_STRIPE_FAST_PRICE_ID || '';

// Legacy - keeping for backwards compatibility
export const PRICE_IDS = {
  monthly: FAST_PRICE_ID,
  yearly: FAST_PRICE_ID,
};

// Create checkout session for a fast
export async function createCheckoutSession(
  priceId: string,
  userId: string,
  email: string,
  fastId?: string
): Promise<{ sessionId: string; url: string }> {
  const response = await fetch('/.netlify/functions/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      userId,
      email,
      fastId, // Pass fastId to mark as paid after successful payment
      successUrl: `${window.location.origin}/dashboard?success=true&paid=true`,
      cancelUrl: `${window.location.origin}/dashboard?cancelled=true`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const { sessionId, url } = await response.json();
  return { sessionId, url };
}

// Redirect to Stripe Checkout for fast payment
export async function redirectToCheckout(
  priceId: string,
  userId: string,
  email: string,
  fastId?: string
) {
  console.log('Step 1: Creating checkout session...');

  const { sessionId, url } = await createCheckoutSession(priceId, userId, email, fastId);
  console.log('Step 2: Session created:', sessionId);

  if (!url) {
    throw new Error('No checkout URL returned from Stripe');
  }

  // Redirect using window.location (stripe.redirectToCheckout is deprecated)
  console.log('Step 3: Redirecting to Stripe checkout...');
  window.location.href = url;
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
