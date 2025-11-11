import { requireNodeEnvVar } from '../server/utils';

export enum SubscriptionStatus {
  PastDue = 'past_due',
  CancelAtPeriodEnd = 'cancel_at_period_end',
  Active = 'active',
  Deleted = 'deleted',
}

export enum PaymentPlanId {
  // Video credit plans
  VideoStarter = 'video-starter',    // 3 video credits - $19.90
  VideoCreator = 'video-creator',    // 8 video credits - $49.90
  VideoPro = 'video-pro',           // 50 video credits - $249.90
}

export interface PaymentPlan {
  // Returns the id under which this payment plan is identified on your payment processor.
  // E.g. this might be price id on Stripe, or variant id on LemonSqueezy.
  getPaymentProcessorPlanId: () => string;
  effect: PaymentPlanEffect;
}

export type PaymentPlanEffect = 
  | { kind: 'subscription' } 
  | { kind: 'credits'; amount: number }
  | { kind: 'videoCredits'; amount: number };

export const paymentPlans: Record<PaymentPlanId, PaymentPlan> = {
  [PaymentPlanId.VideoStarter]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_VIDEO_STARTER_PLAN_ID'),
    effect: { kind: 'videoCredits', amount: 3 },
  },
  [PaymentPlanId.VideoCreator]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_VIDEO_CREATOR_PLAN_ID'),
    effect: { kind: 'videoCredits', amount: 8 },
  },
  [PaymentPlanId.VideoPro]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_VIDEO_PRO_PLAN_ID'),
    effect: { kind: 'videoCredits', amount: 50 },
  },
};

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  const planToName: Record<PaymentPlanId, string> = {
    [PaymentPlanId.VideoStarter]: 'Video Starter',
    [PaymentPlanId.VideoCreator]: 'Video Creator',
    [PaymentPlanId.VideoPro]: 'Video Pro',
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

export function getVideoPaymentPlanIds(): PaymentPlanId[] {
  return Object.values(PaymentPlanId).filter((planId) => 
    paymentPlans[planId].effect.kind === 'videoCredits'
  );
}
