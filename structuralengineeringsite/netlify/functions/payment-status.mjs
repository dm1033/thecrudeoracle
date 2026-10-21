import { routePayment } from '../../lib/http.mjs';
export default (req) => routePayment(req, 'status', {
  STRIPE_API_KEY:Netlify.env.get('STRIPE_API_KEY'), STRIPE_MODE:Netlify.env.get('STRIPE_MODE'),
  NEEDACALC_PAYMENTS_ENABLED:Netlify.env.get('NEEDACALC_PAYMENTS_ENABLED'), NEEDACALC_ALLOW_LIVE:Netlify.env.get('NEEDACALC_ALLOW_LIVE'),
  NEEDACALC_SITE_URL:Netlify.env.get('NEEDACALC_SITE_URL'), CONTEXT:Netlify.env.get('CONTEXT')
});
export const config = {path:'/api/payment-status',rateLimit:{windowSize:60,windowLimit:30,aggregateBy:['ip','domain'],action:'rate_limit'}};
