import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { priceId, userId, email, fastId, successUrl, cancelUrl } = JSON.parse(event.body);

    // Check if we have an existing customer
    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription', // Recurring subscription
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId,
          fastId,
        },
      },
      metadata: {
        userId,
        fastId,
      },
    };

    // Use existing customer or create new one with email
    if (customerId) {
      sessionConfig.customer = customerId;
    } else {
      sessionConfig.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error: any) {
    console.error('Checkout error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
