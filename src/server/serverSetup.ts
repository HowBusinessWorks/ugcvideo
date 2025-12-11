import cors from 'cors';
import helmet from 'helmet';
import type { MiddlewareConfigFn } from 'wasp/server';

export const serverMiddlewareFn: MiddlewareConfigFn = (middlewareConfig) => {
  // Add CORS middleware to allow your custom domain
  middlewareConfig.set('cors', cors({
    origin: [
      'https://ugcvideo.io',
      'https://www.ugcvideo.io',
      'https://ugcvideo-client-production.up.railway.app',
      'https://ugcvideo-fresh-client-production.up.railway.app',
      'http://localhost:3000', // for development
    ],
    credentials: true,
  }));
  
  // Configure Helmet with custom CSP to allow blob URLs
  middlewareConfig.set('helmet', helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https:', 'blob:'], // Add blob: support
        'connect-src': ["'self'", 'https:'], // Allow HTTPS connections
      },
    },
  }));
  
  return middlewareConfig;
};