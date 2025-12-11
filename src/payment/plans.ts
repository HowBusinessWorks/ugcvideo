import { requireNodeEnvVar } from '../server/utils';

export enum SubscriptionStatus {
  PastDue = 'past_due',
  CancelAtPeriodEnd = 'cancel_at_period_end',
  Active = 'active',
  Deleted = 'deleted',
}

export enum PaymentPlanId {
  // Monthly subscription plans (with included credits per month)
  SubscriptionStarter = 'subscription-starter',   // $39.90/month - 200 credits/month
  SubscriptionPro = 'subscription-pro',          // $99.90/month - 500 credits/month
  SubscriptionBusiness = 'subscription-business', // $249.90/month - 1250 credits/month
}

export interface PaymentPlan {
  // Returns the id under which this payment plan is identified on your payment processor.
  // E.g. this might be price id on Stripe, or variant id on LemonSqueezy.
  getPaymentProcessorPlanId: () => string;
  effect: PaymentPlanEffect;
}

export type PaymentPlanEffect =
  | { kind: 'subscription'; monthlyCredits: number }  // Subscription with monthly credit allowance
  | { kind: 'credits'; amount: number }
  | { kind: 'videoCredits'; amount: number };

export const paymentPlans: Record<PaymentPlanId, PaymentPlan> = {
  // Monthly subscriptions with included credits
  [PaymentPlanId.SubscriptionStarter]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_SUBSCRIPTION_STARTER_PLAN_ID'),
    effect: { kind: 'subscription', monthlyCredits: 200 },
  },
  [PaymentPlanId.SubscriptionPro]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_SUBSCRIPTION_PRO_PLAN_ID'),
    effect: { kind: 'subscription', monthlyCredits: 500 },
  },
  [PaymentPlanId.SubscriptionBusiness]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_SUBSCRIPTION_BUSINESS_PLAN_ID'),
    effect: { kind: 'subscription', monthlyCredits: 1250 },
  },
};

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  const planToName: Record<PaymentPlanId, string> = {
    [PaymentPlanId.SubscriptionStarter]: 'Starter Subscription',
    [PaymentPlanId.SubscriptionPro]: 'Pro Subscription',
    [PaymentPlanId.SubscriptionBusiness]: 'Business Subscription',
  };
  return planToName[planId];
}

export function parsePaymentPlanId(planId: string): PaymentPlanId {
  if ((Object.values(PaymentPlanId) as string[]).includes(planId)) {
    return planId as PaymentPlanId;
  } else {
    throw new Error(`Invalid PaymentPlanId: ${planId}`);
  }
}

export function getSubscriptionPaymentPlanIds(): PaymentPlanId[] {
  return Object.values(PaymentPlanId).filter((planId) => paymentPlans[planId].effect.kind === 'subscription');
}

// Credit cost per generation type
export const CREDIT_COSTS = {
  PERSON: 1,           // Person/Photo generation
  COMPOSITE: 1,        // Composite (person + product) generation
  VIDEO_FAST: 12,      // Video generation with Veo Fast
  VIDEO_STANDARD: 32,  // Video generation with Veo Standard
} as const;

// Per-credit price for dynamic credit purchases
export const CREDIT_PRICE = 0.20; // $0.20 per credit
