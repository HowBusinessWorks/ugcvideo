import type { PaymentPlanEffect } from '../plans';
import type { CreateCheckoutSessionArgs, FetchCustomerPortalUrlArgs, PaymentProcessor } from '../paymentProcessor'
import { fetchStripeCustomer, createStripeCheckoutSession } from './checkoutUtils';
import { requireNodeEnvVar } from '../../server/utils';
import { stripeWebhook, stripeMiddlewareConfigFn } from './webhook';
import { stripe } from './stripeClient';
import { HttpError } from 'wasp/server';

export type StripeMode = 'subscription' | 'payment';

export const stripePaymentProcessor: PaymentProcessor = {
  id: 'stripe',
  createCheckoutSession: async ({ userId, userEmail, paymentPlan, prismaUserDelegate }: CreateCheckoutSessionArgs) => {
    const customer = await fetchStripeCustomer(userEmail);
    const stripeSession = await createStripeCheckoutSession({
      priceId: paymentPlan.getPaymentProcessorPlanId(),
      customerId: customer.id,
      mode: paymentPlanEffectToStripeMode(paymentPlan.effect),
    });
    await prismaUserDelegate.update({
      where: {
        id: userId
      },
      data: {
        paymentProcessorUserId: customer.id
      }
    })
    if (!stripeSession.url) throw new Error('Error creating Stripe Checkout Session');
    const session = {
      url: stripeSession.url,
      id: stripeSession.id,
    };
    return { session };
  },
  fetchCustomerPortalUrl: async ({ userId, prismaUserDelegate }: FetchCustomerPortalUrlArgs) => {
    // Get user's Stripe customer ID
    const user = await prismaUserDelegate.findUnique({
      where: { id: userId },
      select: { paymentProcessorUserId: true },
    });

    if (!user?.paymentProcessorUserId) {
      throw new HttpError(404, 'User does not have a Stripe customer ID');
    }

    // Get the web app URL (defaults to localhost for development)
    const webAppUrl = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.paymentProcessorUserId,
      return_url: `${webAppUrl}/account`,
    });

    return session.url;
  },
  webhook: stripeWebhook,
  webhookMiddlewareConfigFn: stripeMiddlewareConfigFn,
};

function paymentPlanEffectToStripeMode(planEffect: PaymentPlanEffect): StripeMode {
  const effectToMode: Record<PaymentPlanEffect['kind'], StripeMode> = {
    subscription: 'subscription',
    credits: 'payment',
    videoCredits: 'payment',
  };
  return effectToMode[planEffect.kind];
}
