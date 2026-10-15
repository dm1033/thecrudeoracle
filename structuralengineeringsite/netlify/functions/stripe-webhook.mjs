import { routePayment } from '../../lib/http.mjs';
export default (req) => routePayment(req, 'webhook', {
  STRIPE_API_KEY:Netlify.env.get('STRIPE_API_KEY'), STRIPE_MODE:Netlify.env.get('STRIPE_MODE'),
  STRIPE_WEBHOOK_SECRET:Netlify.env.get('STRIPE_WEBHOOK_SECRET'), NEEDACALC_PAYMENTS_ENABLED:Netlify.env.get('NEEDACALC_PAYMENTS_ENABLED'),
  NEEDACALC_ALLOW_LIVE:Netlify.env.get('NEEDACALC_ALLOW_LIVE'), NEEDACALC_SITE_URL:Netlify.env.get('NEEDACALC_SITE_URL'), CONTEXT:Netlify.env.get('CONTEXT')
});
export const config = {path:'/api/stripe-webhook'};
