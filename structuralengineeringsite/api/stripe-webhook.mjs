import { routePayment } from '../lib/http.mjs';
export default { fetch: (request) => routePayment(request, 'webhook', process.env) };
