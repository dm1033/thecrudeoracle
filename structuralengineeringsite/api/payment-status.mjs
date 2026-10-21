import { routePayment } from '../lib/http.mjs';
export default { fetch: (request) => routePayment(request, 'status', process.env) };
