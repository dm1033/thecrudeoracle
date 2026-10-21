import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { validateCommission, checkoutParameters, createInvitation, handleWebhook, paymentStatus, runtimeConfig } from '../lib/payments.mjs';

const now = Date.now();
const quote = () => ({ reference:'NAC-2026-01234', revision:'P01', stage:'fixed_fee', amountPence:24900, currency:'gbp', scopeSummary:'Single opening assessment as quoted', taxStatement:'Total includes the tax treatment stated in quotation P01.', quoteSha256:'a'.repeat(64), acceptanceSha256:'b'.repeat(64), acceptedAt:new Date(now-1000).toISOString(), validUntil:new Date(now+86400000).toISOString(), email:'customer@example.com' });
const config = {siteUrl:'https://needacalc.example',livemode:false};
function session() { const p=checkoutParameters(quote(), config); return { id:'cs_test_12345678901234567890',livemode:false,mode:'payment',status:'complete',payment_status:'paid',amount_total:24900,currency:'gbp',metadata:p.metadata,client_reference_id:p.client_reference_id,url:'https://checkout.stripe.com/c/pay/test' }; }
const stripeSdk = new Stripe('sk_test_local_fixture_not_a_real_key');
const secret='whsec_local_fixture_not_a_real_secret';
function eventRequest(event, signature=true) { const payload=JSON.stringify(event); return { method:'POST', raw:payload, signature:signature ? stripeSdk.webhooks.generateTestHeaderString({payload,secret}) : 'bad' }; }
const event=(s,type='checkout.session.completed')=>({id:'evt_test',type,livemode:false,data:{object:s}});

test('refuses missing written quotation, acceptance or invalid fee before checkout',()=>{
 for (const patch of [{acceptanceSha256:''},{quoteSha256:''},{acceptedAt:new Date(now+60000).toISOString()},{amountPence:0},{amountPence:24.9},{currency:'usd'},{validUntil:new Date(now-1000).toISOString()}]) assert.throws(()=>validateCommission({...quote(),...patch}));
});
test('Checkout uses only the accepted gross GBP amount and connects receipt to revision and stage',()=>{
 const p=checkoutParameters(quote(),config);
 assert.equal(p.line_items[0].price_data.unit_amount,24900);
 assert.equal(p.line_items[0].quantity,1);
 assert.equal(p.payment_intent_data.receipt_email,'customer@example.com');
 assert.match(p.payment_intent_data.description,/NAC-2026-01234.*P01.*fixed_fee/);
 assert.equal(p.metadata.acceptance_sha256,'b'.repeat(64));
 assert.equal(p.adaptive_pricing.enabled,false);
 assert.equal(p.allow_promotion_codes,false);
 assert.equal(p.payment_method_types,undefined);
 assert.match(p.success_url,/session_id=\{CHECKOUT_SESSION_ID\}/);
});
test('reuses open invitation and refuses another charge after completed or pending completion',async()=>{
 for (const status of ['open','complete']) {
  let creates=0;
  const s={...session(),status};
  const stripe={checkout:{sessions:{retrieve:async()=>s,create:async()=>{creates++;}}}};
  const result=await createInvitation(stripe,quote(),config,{sessionId:s.id});
  assert.equal(creates,0); assert.equal(result.sessionId,s.id);
 }
});
test('ambiguous attempt older than idempotency window fails closed',async()=>{
 await assert.rejects(()=>createInvitation({},quote(),config,{attemptAt:now-25*3600000,idempotencyKey:'attempt'}),/reconcile/i);
});
test('rejects unsigned webhook and wrong environment without recording payment',async()=>{
 let writes=0;
 const stripe={webhooks:stripeSdk.webhooks,checkout:{sessions:{retrieve:async()=>session(),update:async()=>{writes++;}}}};
 assert.equal((await handleWebhook(eventRequest(event(session()),false),stripe,{...config,webhookSecret:secret})).status,400);
 assert.equal((await handleWebhook(eventRequest({...event(session()),livemode:true}),stripe,{...config,webhookSecret:secret})).status,400);
 assert.equal(writes,0);
});
test('completed unpaid event cannot confirm payment; delayed success can; retries are harmless',async()=>{
 let current={...session(),payment_status:'unpaid'}; const writes=[];
 const stripe={webhooks:stripeSdk.webhooks,checkout:{sessions:{retrieve:async()=>current,update:async(id,patch)=>{writes.push(patch);current={...current,metadata:{...current.metadata,...patch.metadata}};return current;}}}};
 const cfg={...config,webhookSecret:secret};
 assert.equal((await handleWebhook(eventRequest(event(current)),stripe,cfg)).status,200); assert.equal(writes.length,0);
 current={...current,payment_status:'paid'};
 assert.equal((await handleWebhook(eventRequest(event(current,'checkout.session.async_payment_succeeded')),stripe,cfg)).status,200);
 assert.equal(current.metadata.payment_verified,'true');
 await handleWebhook(eventRequest(event(current)),stripe,cfg);
 assert.equal(writes.length,1);
});
test('mismatched amount cannot be recorded and Stripe write failures request webhook retry',async()=>{
 let s={...session(),amount_total:1};
 const stripe={webhooks:stripeSdk.webhooks,checkout:{sessions:{retrieve:async()=>s,update:async()=>{throw new Error('private stripe error');}}}};
 assert.equal((await handleWebhook(eventRequest(event(s)),stripe,{...config,webhookSecret:secret})).status,400);
 s=session(); const result=await handleWebhook(eventRequest(event(s)),stripe,{...config,webhookSecret:secret});
 assert.equal(result.status,503); assert.doesNotMatch(JSON.stringify(result),/private stripe error/);
});
test('return page status requires durable webhook marker and exposes no private customer details',async()=>{
 let s={...session(),customer_details:{email:'private@example.com'}};
 const stripe={checkout:{sessions:{retrieve:async()=>s}}};
 assert.equal((await paymentStatus(s.id,stripe,config)).body.status,'confirming');
 s.metadata.payment_verified='true';
 const result=await paymentStatus(s.id,stripe,config);
 assert.equal(result.body.status,'paid'); assert.doesNotMatch(JSON.stringify(result),/private@example|acceptance_sha256/);
});
test('live operation is disabled by default and forbidden on preview deployments',()=>{
 assert.throws(()=>runtimeConfig({STRIPE_API_KEY:'rk_live_fixture',STRIPE_MODE:'live',NEEDACALC_PAYMENTS_ENABLED:'true',NEEDACALC_ALLOW_LIVE:'true',VERCEL_ENV:'preview'}));
 assert.throws(()=>runtimeConfig({}));
});

test('cancel, expiry and delayed failure never downgrade a previously recorded payment',async()=>{
 let current={...session(),metadata:{...session().metadata,payment_verified:'true'}};let writes=0;
 const stripe={webhooks:stripeSdk.webhooks,checkout:{sessions:{retrieve:async()=>current,update:async()=>{writes++;}}}};
 for(const type of ['checkout.session.expired','checkout.session.async_payment_failed']) assert.equal((await handleWebhook(eventRequest(event(current,type)),stripe,{...config,webhookSecret:secret})).status,200);
 assert.equal(writes,0);assert.equal((await paymentStatus(current.id,stripe,config)).body.status,'paid');
});
test('unrelated consultancy session is ignored without touching its payment',async()=>{
 let reads=0;const unrelated={...session(),metadata:{app:'different-service'}};
 const stripe={webhooks:stripeSdk.webhooks,checkout:{sessions:{retrieve:async()=>{reads++;}}}};
 assert.equal((await handleWebhook(eventRequest(event(unrelated)),stripe,{...config,webhookSecret:secret})).status,200);assert.equal(reads,0);
});
test('retry preserves the exact Checkout request and idempotency key saved before the API call',async()=>{
 const q=quote();const parameters=checkoutParameters(q,config);const calls=[];
 const stripe={checkout:{sessions:{create:async(p,o)=>{calls.push({p,o});return {...session(),status:'open'};}}}};
 const state={parameters,attemptAt:Date.now(),idempotencyKey:'private-attempt-reference'};
 await createInvitation(stripe,q,config,state);await createInvitation(stripe,q,config,state);
 assert.deepEqual(calls[0],calls[1]);assert.equal(calls[0].p,parameters);
});
