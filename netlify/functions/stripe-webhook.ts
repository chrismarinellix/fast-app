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
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        console.log('Checkout completed!');
        console.log('userId:', userId);
        console.log('customerId:', customerId);
        console.log('subscriptionId:', subscriptionId);
        console.log('mode:', session.mode);

        // Calculate paid_until - 6 months from now as default
        let paidUntil = new Date();
        paidUntil.setMonth(paidUntil.getMonth() + 6);

        // Try to get exact period from subscription
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            paidUntil = new Date(subscription.current_period_end * 1000);
            console.log('Got paid_until from subscription:', paidUntil.toISOString());
          } catch (e) {
            console.log('Could not fetch subscription, using 6 months default');
          }
        }

        // Update profile with customer ID AND paid_until (backup for race condition)
        if (userId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              subscription_status: 'active',
              paid_until: paidUntil.toISOString(),
            })
            .eq('id', userId);

          if (error) {
            console.error('Error updating profile by userId:', error);
          } else {
            console.log('Profile updated successfully! paid_until:', paidUntil.toISOString());
          }
        } else if (customerId) {
          // Fallback: try by customer email
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          if (customer.email) {
            const { error } = await supabase
              .from('profiles')
              .update({
                stripe_customer_id: customerId,
                subscription_status: 'active',
                paid_until: paidUntil.toISOString(),
              })
              .eq('email', customer.email);

            if (error) {
              console.error('Error updating profile by email:', error);
            } else {
              console.log('Profile updated by email! paid_until:', paidUntil.toISOString());
            }
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.userId;

        console.log('Subscription event:', stripeEvent.type);
        console.log('customerId:', customerId);
        console.log('userId:', userId);
        console.log('status:', subscription.status);

        // Get current period end from subscription
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const status = subscription.status === 'active' ? 'active' :
                       subscription.status === 'canceled' ? 'cancelled' : 'free';

        console.log('current_period_end:', currentPeriodEnd.toISOString());

        // Update by customer ID (more reliable)
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            paid_until: currentPeriodEnd.toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Error updating subscription:', error);
          // Try by userId if customerId fails
          if (userId) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: status,
                paid_until: currentPeriodEnd.toISOString(),
                stripe_customer_id: customerId,
              })
              .eq('id', userId);
          }
        } else {
          console.log('Subscription updated successfully!');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Subscription deleted for customer:', customerId);

        await supabase
          .from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'invoice.payment_succeeded': {
        // Handle successful recurring payment
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        console.log('Invoice paid for customer:', customerId);

        if (subscriptionId) {
          // Fetch subscription to get updated period
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

          await supabase
            .from('profiles')
            .update({
              paid_until: currentPeriodEnd.toISOString(),
              subscription_status: 'active',
            })
            .eq('stripe_customer_id', customerId);

          console.log('Renewed paid_until to:', currentPeriodEnd.toISOString());
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log('Payment failed for customer:', customerId);

        // Don't immediately expire - Stripe will retry
        // Just log for now, subscription.updated will handle status
        break;
      }
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return { statusCode: 500, body: error.message };
  }
}
