export declare enum SubscriptionStatus {
    PastDue = "past_due",
    CancelAtPeriodEnd = "cancel_at_period_end",
    Active = "active",
    Deleted = "deleted"
}
export declare enum PaymentPlanId {
    SubscriptionStarter = "subscription-starter",// $39.90/month - 200 credits/month
    SubscriptionPro = "subscription-pro",// $99.90/month - 500 credits/month
    SubscriptionBusiness = "subscription-business"
}
export interface PaymentPlan {
    getPaymentProcessorPlanId: () => string;
    effect: PaymentPlanEffect;
}
export type PaymentPlanEffect = {
    kind: 'subscription';
    monthlyCredits: number;
} | {
    kind: 'credits';
    amount: number;
} | {
    kind: 'videoCredits';
    amount: number;
};
export declare const paymentPlans: Record<PaymentPlanId, PaymentPlan>;
export declare function prettyPaymentPlanName(planId: PaymentPlanId): string;
export declare function parsePaymentPlanId(planId: string): PaymentPlanId;
export declare function getSubscriptionPaymentPlanIds(): PaymentPlanId[];
export declare const CREDIT_COSTS: {
    readonly PERSON: 1;
    readonly COMPOSITE: 1;
    readonly VIDEO_FAST: 12;
    readonly VIDEO_STANDARD: 32;
};
export declare const CREDIT_PRICE = 0.2;
