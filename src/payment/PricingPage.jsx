import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';
import { generateCheckoutSession, purchaseCredits, getCustomerPortalUrl, useQuery } from 'wasp/client/operations';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';
import { PaymentPlanId, paymentPlans, prettyPaymentPlanName, SubscriptionStatus, CREDIT_PRICE } from './plans';
const bestDealPaymentPlanId = PaymentPlanId.SubscriptionPro;
export const paymentPlanCards = {
    [PaymentPlanId.SubscriptionStarter]: {
        name: prettyPaymentPlanName(PaymentPlanId.SubscriptionStarter),
        price: '$39.90',
        description: 'Perfect for consistent content creation',
        features: [
            '200 video credits/month',
            'Unused credits roll over',
            'Buy extra credits anytime',
            'AI-powered generation',
            'Email support'
        ],
    },
    [PaymentPlanId.SubscriptionPro]: {
        name: prettyPaymentPlanName(PaymentPlanId.SubscriptionPro),
        price: '$99.90',
        description: 'Best for content creators and marketers',
        features: [
            '500 video credits/month',
            'Credits accumulate',
            'Purchase additional credits',
            'GPT-4o prompt enhancement',
            'Priority support'
        ],
    },
    [PaymentPlanId.SubscriptionBusiness]: {
        name: prettyPaymentPlanName(PaymentPlanId.SubscriptionBusiness),
        price: '$249.90',
        description: 'Enterprise solution for agencies and teams',
        features: [
            '1250 video credits/month',
            'Unlimited credit rollover',
            'Volume discounts',
            'Dedicated account manager',
            '24/7 priority support'
        ],
    },
};
const PricingPage = () => {
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [creditQuantity, setCreditQuantity] = useState(50);
    const [isLoadingCreditPurchase, setIsLoadingCreditPurchase] = useState(false);
    const { data: user } = useAuth();
    const isUserSubscribed = !!user && !!user.subscriptionStatus && user.subscriptionStatus !== SubscriptionStatus.Deleted;
    const { data: customerPortalUrl, isLoading: isCustomerPortalUrlLoading, error: customerPortalUrlError, } = useQuery(getCustomerPortalUrl, { enabled: isUserSubscribed });
    const navigate = useNavigate();
    async function handleBuyNowClick(paymentPlanId) {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            setIsPaymentLoading(true);
            const checkoutResults = await generateCheckoutSession(paymentPlanId);
            if (checkoutResults?.sessionUrl) {
                window.open(checkoutResults.sessionUrl, '_self');
            }
            else {
                throw new Error('Error generating checkout session URL');
            }
        }
        catch (error) {
            console.error(error);
            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage('Error processing payment. Please try again later.');
            }
            setIsPaymentLoading(false); // We only set this to false here and not in the try block because we redirect to the checkout url within the same window
        }
    }
    const handleCustomerPortalClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (customerPortalUrlError) {
            setErrorMessage('Error fetching Customer Portal URL');
            return;
        }
        if (!customerPortalUrl) {
            setErrorMessage(`Customer Portal does not exist for user ${user.id}`);
            return;
        }
        window.open(customerPortalUrl, '_blank');
    };
    async function handleBuyCredits() {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            setIsLoadingCreditPurchase(true);
            const result = await purchaseCredits({ quantity: creditQuantity });
            if (result?.sessionUrl) {
                window.open(result.sessionUrl, '_self');
            }
        }
        catch (error) {
            console.error(error);
            setErrorMessage('Error processing credit purchase');
            setIsLoadingCreditPurchase(false);
        }
    }
    return (<div className='py-10 lg:mt-10'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div id='pricing' className='mx-auto max-w-4xl text-center'>
          <h2 className='mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
            Choose Your <span className='text-primary'>Plan</span>
          </h2>
        </div>
        <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground'>
          Subscribe for monthly credits or purchase credit packs. Create professional UGC-style videos with AI-powered technology. Credits never expire and roll over each month for subscribers.
        </p>
        {errorMessage && (<Alert variant='destructive' className='mt-8'>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>)}
        <div className='isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:gap-x-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3'>
          {Object.values(PaymentPlanId).map((planId) => (<Card key={planId} className={cn('relative flex flex-col grow justify-between overflow-hidden transition-all duration-300 hover:shadow-lg', {
                'ring-2 ring-primary !bg-transparent': planId === bestDealPaymentPlanId,
                'ring-1 ring-border lg:my-8': planId !== bestDealPaymentPlanId,
            })}>
              {planId === bestDealPaymentPlanId && (<div className='absolute top-0 right-0 -z-10 w-full h-full transform-gpu blur-3xl' aria-hidden='true'>
                  <div className='absolute w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-primary/10 opacity-30' style={{
                    clipPath: 'circle(670% at 50% 50%)',
                }}/>
                </div>)}
              <CardContent className='p-8 xl:p-10 h-full justify-between'>
                <div className='flex items-center justify-between gap-x-4'>
                  <CardTitle id={planId} className='text-foreground text-lg font-semibold leading-8'>
                    {paymentPlanCards[planId].name}
                  </CardTitle>
                </div>
                <p className='mt-4 text-sm leading-6 text-muted-foreground'>
                  {paymentPlanCards[planId].description}
                </p>
                <p className='mt-6 flex items-baseline gap-x-1'>
                  <span className='text-4xl font-bold tracking-tight text-foreground'>
                    {paymentPlanCards[planId].price}
                  </span>
                  <span className='text-sm font-semibold leading-6 text-muted-foreground'>
                    {paymentPlans[planId].effect.kind === 'subscription' && '/month'}
                  </span>
                </p>
                <ul role='list' className='mt-8 space-y-3 text-sm leading-6 text-muted-foreground'>
                  {paymentPlanCards[planId].features.map((feature) => (<li key={feature} className='flex gap-x-3'>
                      <CheckCircle className='h-5 w-5 flex-none text-primary' aria-hidden='true'/>
                      {feature}
                    </li>))}
                </ul>
              </CardContent>
              <CardFooter>
                {isUserSubscribed ? (<Button onClick={handleCustomerPortalClick} disabled={isCustomerPortalUrlLoading} aria-describedby='manage-subscription' variant={planId === bestDealPaymentPlanId ? 'default' : 'outline'} className='w-full'>
                    Manage Subscription
                  </Button>) : (<Button onClick={() => handleBuyNowClick(planId)} aria-describedby={planId} variant={planId === bestDealPaymentPlanId ? 'default' : 'outline'} className='w-full' disabled={isPaymentLoading}>
                    {!!user ? 'Buy plan' : 'Log in to buy plan'}
                  </Button>)}
              </CardFooter>
            </Card>))}
        </div>

        {/* Credit Purchase Slider - Only for Subscribed Users */}
        {isUserSubscribed && (<div className='mx-auto mt-16 max-w-2xl'>
            <Card className='p-8'>
              <CardTitle className='text-2xl font-bold text-center mb-4'>
                Buy Additional Credits
              </CardTitle>
              <p className='text-center text-muted-foreground mb-6'>
                Need more credits? Purchase any amount at ${CREDIT_PRICE} per credit
              </p>

              <div className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium mb-2'>
                    Number of Credits: {creditQuantity}
                  </label>
                  <input type='range' min='10' max='100' step='5' value={creditQuantity} onChange={(e) => setCreditQuantity(parseInt(e.target.value))} className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'/>
                  <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                    <span>10 credits</span>
                    <span>100 credits</span>
                  </div>
                </div>

                <div className='bg-muted p-4 rounded-lg'>
                  <div className='flex justify-between items-center'>
                    <span className='text-lg font-semibold'>Total Price:</span>
                    <span className='text-2xl font-bold text-primary'>
                      ${(creditQuantity * CREDIT_PRICE).toFixed(2)}
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground mt-2'>
                    Credits never expire • Use anytime
                  </p>
                </div>

                <Button onClick={handleBuyCredits} disabled={isLoadingCreditPurchase} className='w-full' size='lg'>
                  Purchase {creditQuantity} Additional Credits
                </Button>
              </div>
            </Card>
          </div>)}
      </div>
    </div>);
};
export default PricingPage;
