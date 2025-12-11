import * as z from 'zod';
import type { GenerateCheckoutSession, GetCustomerPortalUrl, PurchaseCredits } from 'wasp/server/operations';
import { PaymentPlanId, paymentPlans, CREDIT_PRICE } from '../payment/plans';
import { paymentProcessor } from './paymentProcessor';
import { HttpError } from 'wasp/server';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
import { fetchStripeCustomer, createDynamicCreditCheckoutSession } from './stripe/checkoutUtils';

export type CheckoutSession = {
  sessionUrl: string | null;
  sessionId: string;
};

const generateCheckoutSessionSchema = z.nativeEnum(PaymentPlanId);

type GenerateCheckoutSessionInput = z.infer<typeof generateCheckoutSessionSchema>;

export const generateCheckoutSession: GenerateCheckoutSession<
  GenerateCheckoutSessionInput,
  CheckoutSession
> = async (rawPaymentPlanId, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  const paymentPlanId = ensureArgsSchemaOrThrowHttpError(generateCheckoutSessionSchema, rawPaymentPlanId);
  const userId = context.user.id;
  const userEmail = context.user.email;
  if (!userEmail) {
    // If using the usernameAndPassword Auth method, switch to an Auth method that provides an email.
    throw new HttpError(403, 'User needs an email to make a payment.');
  }

  const paymentPlan = paymentPlans[paymentPlanId];
  const { session } = await paymentProcessor.createCheckoutSession({
    userId,
    userEmail,
    paymentPlan,
    prismaUserDelegate: context.entities.User,
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
};

export const getCustomerPortalUrl: GetCustomerPortalUrl<void, string | null> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  return paymentProcessor.fetchCustomerPortalUrl({
    userId: context.user.id,
    prismaUserDelegate: context.entities.User,
  });
};

// Dynamic Credit Purchase

const purchaseCreditsSchema = z.object({
  quantity: z.number().int().min(10, 'Minimum purchase is 10 credits').max(100, 'Maximum purchase is 100 credits'),
});

type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;

export const purchaseCredits: PurchaseCredits<PurchaseCreditsInput, CheckoutSession> = async (
  rawInput,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Only authenticated users are allowed to perform this operation');
  }

  const { quantity } = ensureArgsSchemaOrThrowHttpError(purchaseCreditsSchema, rawInput);
  const userEmail = context.user.email;

  if (!userEmail) {
    throw new HttpError(403, 'User needs an email to make a payment.');
  }

  // Fetch or create Stripe customer
  const customer = await fetchStripeCustomer(userEmail);

  // Create checkout session with dynamic pricing
  const session = await createDynamicCreditCheckoutSession({
    customerId: customer.id,
    creditQuantity: quantity,
    pricePerCredit: CREDIT_PRICE,
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
};
