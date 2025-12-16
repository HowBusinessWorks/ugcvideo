import { requireNodeEnvVar } from '../server/utils';
export var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["PastDue"] = "past_due";
    SubscriptionStatus["CancelAtPeriodEnd"] = "cancel_at_period_end";
    SubscriptionStatus["Active"] = "active";
    SubscriptionStatus["Deleted"] = "deleted";
})(SubscriptionStatus || (SubscriptionStatus = {}));
export var PaymentPlanId;
(function (PaymentPlanId) {
    // Monthly subscription plans (with included credits per month)
    PaymentPlanId["SubscriptionStarter"] = "subscription-starter";
    PaymentPlanId["SubscriptionPro"] = "subscription-pro";
    PaymentPlanId["SubscriptionBusiness"] = "subscription-business";
})(PaymentPlanId || (PaymentPlanId = {}));
export const paymentPlans = {
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
export function prettyPaymentPlanName(planId) {
    const planToName = {
        [PaymentPlanId.SubscriptionStarter]: 'Starter Subscription',
        [PaymentPlanId.SubscriptionPro]: 'Pro Subscription',
        [PaymentPlanId.SubscriptionBusiness]: 'Business Subscription',
    };
    return planToName[planId];
}
export function parsePaymentPlanId(planId) {
    if (Object.values(PaymentPlanId).includes(planId)) {
        return planId;
    }
    else {
        throw new Error(`Invalid PaymentPlanId: ${planId}`);
    }
}
export function getSubscriptionPaymentPlanIds() {
    return Object.values(PaymentPlanId).filter((planId) => paymentPlans[planId].effect.kind === 'subscription');
}
// Credit cost per generation type
export const CREDIT_COSTS = {
    PERSON: 1, // Person/Photo generation
    COMPOSITE: 1, // Composite (person + product) generation
    VIDEO_FAST: 12, // Video generation with Veo Fast
    VIDEO_STANDARD: 32, // Video generation with Veo Standard
};
// Per-credit price for dynamic credit purchases
export const CREDIT_PRICE = 0.20; // $0.20 per credit
