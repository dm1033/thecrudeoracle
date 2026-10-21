import Stripe from 'stripe';
import { readFile, writeFile, mkdir, open, realpath, rename } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { runtimeConfig, validateCommission, checkoutParameters, createInvitation, commissionFingerprint } from '../lib/payments.mjs';

const repo=await realpath(fileURLToPath(new URL('../../',import.meta.url)));
function outsideRepo(path) {
  const r=relative(repo,path);
  if (!r.startsWith('..'+(process.platform === 'win32' ? '\\' : '/')) && !isAbsolute(r)) throw new Error('Keep commission files, evidence and payment records outside the public repository.');
  return path;
}
async function evidence(path) {
  const target=outsideRepo(await realpath(resolve(path)));
  const data=await readFile(target);
  if (!data.length) throw new Error('Evidence files cannot be empty.');
  return createHash('sha256').update(data).digest('hex');
}
async function save(path,state) {
  const tmp=`${path}.${randomUUID()}.tmp`;
  await writeFile(tmp,JSON.stringify(state,null,2),{mode:0o600}); await rename(tmp,path);
}
let lock, lockPath;
try {
  const arg=process.argv[2];
  if (!arg || arg.startsWith('--')) throw new Error('Usage: node scripts/create-payment-invitation.mjs /private/commission.json [--live]');
  const input=outsideRepo(await realpath(resolve(arg)));
  const q=JSON.parse(await readFile(input,'utf8'));
  if (q.acceptanceConfirmed !== true) throw new Error('The operator must verify written acceptance of this exact quotation, revision, scope, fee and terms, then set acceptanceConfirmed to true.');
  q.quoteSha256=await evidence(resolve(dirname(input),q.quoteFile));
  q.acceptanceSha256=await evidence(resolve(dirname(input),q.acceptanceFile));
  validateCommission(q);
  const cfg=runtimeConfig(process.env,{operator:true,live:process.argv.includes('--live')});
  if (Date.parse(q.validUntil)-Date.now()<31*60000) throw new Error('At least 31 minutes validity is required.');
  // One private ledger file per reference/payment obligation, independent of quote revision.
  const ledgerDir=resolve(dirname(input),'needacalc-payment-records');
  await mkdir(ledgerDir,{recursive:true,mode:0o700});
  outsideRepo(await realpath(ledgerDir));
  const path=resolve(ledgerDir,`${q.reference}-${q.stage}-${cfg.livemode?'live':'test'}.json`);
  lockPath=`${path}.lock`;
  lock=await open(lockPath,'wx',0o600);
  let state;
  try { state=JSON.parse(await readFile(path,'utf8')); }
  catch(e) { if (e.code !== 'ENOENT') throw e; }
  const fingerprint=commissionFingerprint(q);
  if (state && (state.fingerprint !== fingerprint || state.siteUrl !== cfg.siteUrl)) throw new Error('This payment obligation already has a different quote or site. Reconcile manually; do not create a second charge.');
  if (!state) {
    state={fingerprint,siteUrl:cfg.siteUrl,idempotencyKey:randomUUID(),attemptAt:Date.now(),parameters:checkoutParameters(q,cfg)};
    // Persist the exact request BEFORE Stripe. A timeout retry uses identical parameters.
    await save(path,state);
  }
  const stripe=new Stripe(cfg.apiKey,{maxNetworkRetries:2,timeout:20000});
  const invitation=await createInvitation(stripe,q,cfg,state);
  await save(path,{...state,...invitation});
  // The private invitation URL is intentionally only shown on the operator's terminal.
  console.log(JSON.stringify({reference:q.reference,revision:q.revision,stage:q.stage,...invitation},null,2));
} catch(e) {
  // Never print upstream Stripe response bodies, credentials or customer information.
  console.error(e.type?.startsWith('Stripe') ? 'Stripe request failed. Reconcile using the private ledger before retrying.' : e.message);
  process.exitCode=1;
} finally {
  if (lock) { await lock.close(); const {unlink}=await import('node:fs/promises'); await unlink(lockPath); }
}
