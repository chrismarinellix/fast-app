import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function handler(event: any) {
  const sig = event.headers['stripe-signature'];

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const fastId = session.metadata?.fastId;
        const customerId = session.customer as string;

        console.log('Checkout completed!');
        console.log('userId:', userId);
        console.log('fastId:', fastId);
        console.log('customerId:', customerId);

        // Handle $5 for 200 days of unlimited fasts
        if (userId) {
          // Calculate 200 days from now
          const paidUntil = new Date();
          paidUntil.setDate(paidUntil.getDate() + 200);

          console.log('Updating profile with paid_until:', paidUntil.toISOString());

          const { error } = await supabase
            .from('profiles')
            .update({
              paid_until: paidUntil.toISOString(),
              stripe_customer_id: customerId || undefined,
            })
            .eq('id', userId);

          if (error) {
            console.error('Error updating profile:', error);
          } else {
            console.log('Profile updated successfully!');
          }
        } else {
          console.error('No userId in session metadata!');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const status = subscription.status === 'active' ? 'active' : 'cancelled';

        await supabase
          .from('profiles')
          .update({ subscription_status: status })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('stripe_customer_id', customerId);
        break;
      }
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return { statusCode: 500, body: error.message };
  }
}
