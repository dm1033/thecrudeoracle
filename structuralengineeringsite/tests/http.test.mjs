import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {routePayment} from '../lib/http.mjs';
import {checkoutParameters} from '../lib/payments.mjs';
const env={STRIPE_API_KEY:['rk','test','fixture'].join('_'),STRIPE_MODE:'test',NEEDACALC_PAYMENTS_ENABLED:'true',NEEDACALC_SITE_URL:'https://needacalc.example',STRIPE_WEBHOOK_SECRET:'whsec_fixture'};
const q={reference:'NAC-2026-01234',revision:'P01',stage:'deposit',amountPence:15000,currency:'gbp',scopeSummary:'Accepted opening assessment',taxStatement:'Tax treatment as agreed in quotation',quoteSha256:'a'.repeat(64),acceptanceSha256:'b'.repeat(64),acceptedAt:new Date(Date.now()-10000).toISOString(),validUntil:new Date(Date.now()+86400000).toISOString(),email:'customer@example.com'};
test('raw signed HTTP body is verified, paid record survives return-page read, private data stays private',async()=>{
 const sdk=new Stripe(env.STRIPE_API_KEY);const metadata=checkoutParameters(q,{siteUrl:env.NEEDACALC_SITE_URL}).metadata;
 let current={id:'cs_test_12345678901234567890',metadata,livemode:false,mode:'payment',status:'complete',payment_status:'paid',amount_total:15000,currency:'gbp',customer_details:{email:q.email}};
 const stripe={webhooks:sdk.webhooks,checkout:{sessions:{retrieve:async()=>current,update:async(id,patch)=>{current.metadata={...current.metadata,...patch.metadata};return current;}}}};
 const payload=JSON.stringify({livemode:false,type:'checkout.session.completed',data:{object:current}});
 const signature=sdk.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET});
 const webhook=await routePayment(new Request('https://needacalc.example/api/stripe-webhook',{method:'POST',body:payload,headers:{'stripe-signature':signature}}),'webhook',env,stripe);
 assert.equal(webhook.status,200);
 const response=await routePayment(new Request(`https://needacalc.example/api/payment-status?session_id=${current.id}`),'status',env,stripe);
 assert.match(response.headers.get('cache-control'),/no-store/);
 const data=await response.json();assert.equal(data.status,'paid');assert.equal(data.reference,q.reference);assert.equal(data.stage,'deposit');assert.equal(data.email,undefined);
 const tampered=await routePayment(new Request('https://needacalc.example/api/stripe-webhook',{method:'POST',body:payload+' ',headers:{'stripe-signature':signature}}),'webhook',env,stripe);assert.equal(tampered.status,400);
});
test('HTTP methods and disabled environment fail safely without a Stripe call',async()=>{
 assert.equal((await routePayment(new Request('https://needacalc.example/api/stripe-webhook'),'webhook',env,{})).status,405);
 const disabled=await routePayment(new Request('https://needacalc.example/api/payment-status?session_id=cs_test_12345678901234567890'),'status',{},{});
 assert.equal(disabled.status,503);assert.doesNotMatch(await disabled.text(),/rk_|sk_|undefined|Error:/);
});
