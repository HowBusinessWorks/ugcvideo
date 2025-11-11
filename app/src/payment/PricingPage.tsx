import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';
import { generateCheckoutSession, getCustomerPortalUrl, useQuery } from 'wasp/client/operations';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';
import { PaymentPlanId, paymentPlans, prettyPaymentPlanName, SubscriptionStatus } from './plans';

const bestDealPaymentPlanId: PaymentPlanId = PaymentPlanId.VideoCreator;

interface PaymentPlanCard {
  name: string;
  price: string;
  description: string;
  features: string[];
}

export const paymentPlanCards: Record<PaymentPlanId, PaymentPlanCard> = {
  [PaymentPlanId.VideoStarter]: {
    name: prettyPaymentPlanName(PaymentPlanId.VideoStarter),
    price: '$19.90',
    description: 'Perfect for getting started with UGC videos',
    features: ['3 video credits', '8-second UGC style videos', 'Portrait format (9:16)', 'AI-powered generation', 'Basic support'],
  },
  [PaymentPlanId.VideoCreator]: {
    name: prettyPaymentPlanName(PaymentPlanId.VideoCreator),
    price: '$49.90',
    description: 'Best for content creators and small businesses',
    features: ['8 video credits', 'High-quality AI videos', 'Professional UGC style', 'Upload your own images', 'Priority support'],
  },
  [PaymentPlanId.VideoPro]: {
    name: prettyPaymentPlanName(PaymentPlanId.VideoPro),
    price: '$249.90',
    description: 'Professional package for agencies and teams',
    features: ['50 video credits', 'Bulk video generation', 'Premium quality output', 'Dedicated account manager', '24/7 priority support'],
  },
};

const PricingPage = () => {
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: user } = useAuth();
  const isUserSubscribed =
    !!user && !!user.subscriptionStatus && user.subscriptionStatus !== SubscriptionStatus.Deleted;

  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(getCustomerPortalUrl, { enabled: isUserSubscribed });

  const navigate = useNavigate();

  async function handleBuyNowClick(paymentPlanId: PaymentPlanId) {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setIsPaymentLoading(true);

      const checkoutResults = await generateCheckoutSession(paymentPlanId);

      if (checkoutResults?.sessionUrl) {
        window.open(checkoutResults.sessionUrl, '_self');
      } else {
        throw new Error('Error generating checkout session URL');
      }
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
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

  return (
    <div className='py-10 lg:mt-10'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div id='pricing' className='mx-auto max-w-4xl text-center'>
          <h2 className='mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
            Choose Your <span className='text-primary'>Video Credits</span>
          </h2>
        </div>
        <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground'>
          Purchase video generation credits to create professional UGC-style videos. Each credit generates one 8-second portrait video using AI-powered technology.
        </p>
        {errorMessage && (
          <Alert variant='destructive' className='mt-8'>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className='isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:gap-x-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3'>
          {Object.values(PaymentPlanId).map((planId) => (
            <Card
              key={planId}
              className={cn(
                'relative flex flex-col grow justify-between overflow-hidden transition-all duration-300 hover:shadow-lg',
                {
                  'ring-2 ring-primary !bg-transparent': planId === bestDealPaymentPlanId,
                  'ring-1 ring-border lg:my-8': planId !== bestDealPaymentPlanId,
                }
              )}
            >
              {planId === bestDealPaymentPlanId && (
                <div
                  className='absolute top-0 right-0 -z-10 w-full h-full transform-gpu blur-3xl'
                  aria-hidden='true'
                >
                  <div
                    className='absolute w-full h-full bg-gradient-to-br from-primary/40 via-primary/20 to-primary/10 opacity-30'
                    style={{
                      clipPath: 'circle(670% at 50% 50%)',
                    }}
                  />
                </div>
              )}
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
                  {paymentPlanCards[planId].features.map((feature) => (
                    <li key={feature} className='flex gap-x-3'>
                      <CheckCircle className='h-5 w-5 flex-none text-primary' aria-hidden='true' />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isUserSubscribed ? (
                  <Button
                    onClick={handleCustomerPortalClick}
                    disabled={isCustomerPortalUrlLoading}
                    aria-describedby='manage-subscription'
                    variant={planId === bestDealPaymentPlanId ? 'default' : 'outline'}
                    className='w-full'
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleBuyNowClick(planId)}
                    aria-describedby={planId}
                    variant={planId === bestDealPaymentPlanId ? 'default' : 'outline'}
                    className='w-full'
                    disabled={isPaymentLoading}
                  >
                    {!!user ? 'Buy plan' : 'Log in to buy plan'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
