import type { SubscriptionStatus } from '../plans';
import { PaymentPlanId } from '../plans';
import { PrismaClient } from '@prisma/client';

export const updateUserStripePaymentDetails = async (
  { userStripeId, subscriptionPlan, subscriptionStatus, datePaid, numOfCreditsPurchased, numOfVideoCreditsPurchased }: {
    userStripeId: string;
    subscriptionPlan?: PaymentPlanId;
    subscriptionStatus?: SubscriptionStatus;
    numOfCreditsPurchased?: number;
    numOfVideoCreditsPurchased?: number;
    datePaid?: Date;
  },
  userDelegate: PrismaClient['user']
) => {
  return userDelegate.update({
    where: {
      paymentProcessorUserId: userStripeId
    },
    data: {
      paymentProcessorUserId: userStripeId,
      subscriptionPlan,
      subscriptionStatus,
      datePaid,
      credits: numOfCreditsPurchased !== undefined ? { increment: numOfCreditsPurchased } : undefined,
      videoCredits: numOfVideoCreditsPurchased !== undefined ? { increment: numOfVideoCreditsPurchased } : undefined,
    },
  });
};
