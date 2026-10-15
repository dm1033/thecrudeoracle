import Stripe from 'stripe';
import { API_HEADERS, runtimeConfig, handleWebhook, paymentStatus } from './payments.mjs';

export async function routePayment(request, kind, env, injectedStripe) {
  try {
    const expected=kind === 'webhook' ? 'POST' : 'GET';
    if (request.method !== expected) return new Response(JSON.stringify({error:'Method not allowed.'}),{status:405,headers:{...API_HEADERS,Allow:expected}});
    const cfg=runtimeConfig(env);
    if (kind === 'webhook' && !cfg.webhookSecret) throw new Error('Missing webhook configuration.');
    const stripe=injectedStripe || new Stripe(cfg.apiKey,{maxNetworkRetries:2,timeout:10000});
    let output;
    if (kind === 'webhook') {
      const raw=await request.text();
      if (Buffer.byteLength(raw)>262144) return new Response(JSON.stringify({error:'Request too large.'}),{status:413,headers:API_HEADERS});
      output=await handleWebhook({method:request.method,raw,signature:request.headers.get('stripe-signature')},stripe,cfg);
    } else {
      output=await paymentStatus(new URL(request.url).searchParams.get('session_id'),stripe,cfg);
    }
    return new Response(JSON.stringify(output.body),{status:output.status,headers:API_HEADERS});
  } catch { return new Response(JSON.stringify({error:'Payment service unavailable. Contact the practice; do not pay again.'}),{status:503,headers:API_HEADERS}); }
}
