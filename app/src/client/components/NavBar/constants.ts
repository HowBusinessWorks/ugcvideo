import { routes } from 'wasp/client/router';
import type { NavigationItem } from './NavBar';

export const marketingNavigationItems: NavigationItem[] = [
  { name: 'Generate Videos', to: routes.VideoGeneratorRoute.to },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
] as const;

export const demoNavigationitems: NavigationItem[] = [
  { name: 'Generate Videos', to: routes.VideoGeneratorRoute.to },
  { name: 'Pricing', to: routes.PricingPageRoute.to },
] as const;
