import { createHash } from 'node:crypto';

const APP = 'needacalc-accepted-commission-v1';
const HEX = /^[a-f0-9]{64}$/;
const REF = /^[A-Z0-9][A-Z0-9-]{3,60}$/;
const STAGES = ['fixed_fee', 'deposit', 'balance'];
export const API_HEADERS = { 'Content-Type':'application/json', 'Cache-Control':'no-store, private', 'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'DENY' };
const result = (status, body) => ({status, body});

export function runtimeConfig(env, {operator=false, live=false}={}) {
  if (env.NEEDACALC_PAYMENTS_ENABLED !== 'true') throw new Error('Payments are disabled.');
  const mode=env.STRIPE_MODE || 'test';
  if (!['test','live'].includes(mode) || !new RegExp(`^[rs]k_${mode}_.+`).test(env.STRIPE_API_KEY || '')) throw new Error('Stripe environment is not configured.');
  const livemode=mode === 'live';
  if (livemode && (env.NEEDACALC_ALLOW_LIVE !== 'true' || (operator ? !live : !((env.VERCEL_ENV === 'production' && !env.CONTEXT) || (env.CONTEXT === 'production' && !env.VERCEL_ENV))))) throw new Error('Live payments are blocked outside the approved production environment.');
  const url=new URL(env.NEEDACALC_SITE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Configure a canonical HTTPS site origin.');
  return {livemode, siteUrl:url.origin, apiKey:env.STRIPE_API_KEY, webhookSecret:env.STRIPE_WEBHOOK_SECRET};
}

export function validateCommission(q, now=Date.now()) {
  if (!q || !REF.test(q.reference) || !/^[A-Za-z0-9-]{1,20}$/.test(q.revision) || !STAGES.includes(q.stage)) throw new Error('A quotation reference, revision and payment stage are required.');
  if (!Number.isSafeInteger(q.amountPence) || q.amountPence < 30 || q.amountPence > 10000000 || q.currency !== 'gbp') throw new Error('Supply the agreed GBP total in whole pence.');
  if (!HEX.test(q.quoteSha256) || !HEX.test(q.acceptanceSha256)) throw new Error('Retain the written quotation and written acceptance before creating payment.');
  if (!Number.isFinite(Date.parse(q.acceptedAt)) || Date.parse(q.acceptedAt)>now || !Number.isFinite(Date.parse(q.validUntil)) || Date.parse(q.validUntil)<=now || Date.parse(q.validUntil)<=Date.parse(q.acceptedAt)) throw new Error('Acceptance and payment invitation validity must be current.');
  if (typeof q.email !== 'string' || q.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email)) throw new Error('A valid receipt email is required.');
  for (const name of ['scopeSummary','taxStatement']) if (typeof q[name] !== 'string' || q[name].trim().length<8 || q[name].length>400) throw new Error('Include the accepted scope summary and agreed tax treatment.');
  return q;
}

export function checkoutParameters(q, cfg) {
  validateCommission(q);
  const metadata={ app:APP, quote_ref:q.reference, quote_revision:q.revision, payment_stage:q.stage, quoted_total:String(q.amountPence), quote_sha256:q.quoteSha256, acceptance_sha256:q.acceptanceSha256, accepted_at:q.acceptedAt };
  const label=`${q.reference} / ${q.revision} / ${q.stage}`;
  return {
    mode:'payment', client_reference_id:`${q.reference}-${q.revision}-${q.stage}`,
    customer_email:q.email, locale:'en-GB', adaptive_pricing:{enabled:false}, allow_promotion_codes:false,
    integration_identifier:'needacalc_quoted_services_qszmnrpa',
    line_items:[{quantity:1,price_data:{currency:'gbp',unit_amount:q.amountPence,product_data:{name:`NeedACalc commission ${label}`,description:`${q.scopeSummary} ${q.taxStatement}`}}}],
    metadata,
    payment_intent_data:{metadata,description:`NeedACalc ${label}`,receipt_email:q.email},
    custom_text:{submit:{message:`Payment for accepted quotation ${label}. ${q.taxStatement} Payment does not approve a design for construction.`}},
    success_url:`${cfg.siteUrl}/payment?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:`${cfg.siteUrl}/payment?cancelled=1`,
    expires_at:Math.floor(Math.min(Date.now()+23*3600000,Date.parse(q.validUntil))/1000)
  };
}

function validSession(s,cfg) {
  const m=s?.metadata || {};
  return s?.mode === 'payment' && s.livemode === cfg.livemode && m.app === APP && REF.test(m.quote_ref) && /^[A-Za-z0-9-]{1,20}$/.test(m.quote_revision) && STAGES.includes(m.payment_stage) && HEX.test(m.quote_sha256) && HEX.test(m.acceptance_sha256) && Number.isFinite(Date.parse(m.accepted_at)) && Date.parse(m.accepted_at)<=Date.now() && /^\d+$/.test(m.quoted_total) && Number(m.quoted_total)>0 && s.currency === 'gbp' && s.amount_total === Number(m.quoted_total);
}

export async function createInvitation(stripe,q,cfg,state) {
  validateCommission(q);
  if (state.sessionId) {
    const s=await stripe.checkout.sessions.retrieve(state.sessionId);
    if (!validSession(s,cfg) || s.metadata.quote_sha256 !== q.quoteSha256 || s.metadata.acceptance_sha256 !== q.acceptanceSha256 || s.amount_total !== q.amountPence || s.client_reference_id !== `${q.reference}-${q.revision}-${q.stage}`) throw new Error('Existing invitation differs from the accepted commission; reconcile manually.');
    // Never create a second invitation automatically, even after expiry or a failed payment.
    return {sessionId:s.id,url:s.status === 'open' ? s.url : null,status:s.status};
  }
  if (!state.idempotencyKey || !Number.isFinite(state.attemptAt) || Date.now()-state.attemptAt>23*3600000) throw new Error('Reconcile the previous attempt in Stripe before creating another invitation.');
  const s=await stripe.checkout.sessions.create(state.parameters || checkoutParameters(q,cfg),{idempotencyKey:state.idempotencyKey});
  if (s.livemode !== cfg.livemode) throw new Error('Stripe mode mismatch.');
  return {sessionId:s.id,url:s.url,status:s.status};
}

export async function handleWebhook(req,stripe,cfg) {
  if (req.method !== 'POST') return result(405,{error:'Method not allowed.'});
  let event;
  try { event=stripe.webhooks.constructEvent(req.raw,req.signature,cfg.webhookSecret); }
  catch { return result(400,{error:'Invalid signature.'}); }
  if (event.livemode !== cfg.livemode) return result(400,{error:'Environment mismatch.'});
  if (!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type)) return result(200,{received:true});
  // Unrelated sessions on a shared consultancy account do not belong to this integration.
  if (event.data.object.metadata?.app !== APP) return result(200,{received:true});
  try {
    const s=await stripe.checkout.sessions.retrieve(event.data.object.id);
    if (!validSession(s,cfg)) return result(400,{error:'Commission or amount mismatch. Review this payment.'});
    if (s.payment_status === 'paid' && s.status === 'complete' && s.metadata.payment_verified !== 'true') {
      // Stripe is the durable payment ledger. Monotonic marker: retries/concurrent delivery
      // only write the same value. No design release or email side effects to duplicate.
      await stripe.checkout.sessions.update(s.id,{metadata:{payment_verified:'true'}});
    }
    return result(200,{received:true});
  } catch { return result(503,{error:'Payment recording unavailable. Retry delivery.'}); }
}

export async function paymentStatus(id,stripe,cfg) {
  if (!/^cs_(test|live)_[A-Za-z0-9]{16,200}$/.test(id || '')) return result(400,{error:'A valid payment reference is required.'});
  try {
    const s=await stripe.checkout.sessions.retrieve(id);
    if (!validSession(s,cfg)) return result(404,{error:'Payment reference not found.'});
    const status=s.payment_status === 'paid' ? (s.metadata.payment_verified === 'true' ? 'paid' : 'confirming') : (s.status === 'expired' ? 'expired' : s.status === 'complete' ? 'processing' : 'unpaid');
    return result(200,{status,reference:s.metadata.quote_ref,revision:s.metadata.quote_revision,stage:s.metadata.payment_stage,amountPence:s.amount_total,currency:'gbp',test:!s.livemode});
  } catch(e) { return result(e?.statusCode === 404 ? 404 : 503,{error:'Unable to verify payment. Contact the practice with your quotation reference; do not pay again.'}); }
}

export function commissionFingerprint(q) {
  return createHash('sha256').update(JSON.stringify(q)).digest('hex');
}
