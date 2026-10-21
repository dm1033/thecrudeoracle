import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const js=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');
async function form(outcome,{ok=true}={}) {
  const dom=new JSDOM(html,{url:'https://needacalc.example',runScripts:'outside-only'});
  const w=dom.window;let calls=0;
  w.fetch=async()=>{calls++;return {ok,json:async()=>outcome};};
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  if (w.document.readyState === 'loading') await new Promise(resolve=>w.document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  w.eval(js);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  const f=w.document.getElementById('needacalc-quote-form');
  f.elements.name.value='Test Customer';f.elements.email.value='test@example.com';f.elements.project.selectedIndex=1;f.elements.details.value='Test opening for a quotation';f.elements.consent.checked=true;
  return {dom,w,f,calls:()=>calls,status:()=>w.document.getElementById('q-status').textContent};
}
async function submit(ctx) {ctx.f.dispatchEvent(new ctx.w.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,20));}

test('HTTP 200 with rejected service outcome never claims enquiry received and retains details',async()=>{
 const ctx=await form({success:false});await submit(ctx);
 assert.match(ctx.status(),/could not confirm submission/i);assert.equal(ctx.f.elements.name.value,'Test Customer');ctx.dom.window.close();
});
test('accepted response states delivery uncertainty and keeps enquiry separate from commission',async()=>{
 const ctx=await form({success:'true'});await submit(ctx);
 assert.equal(ctx.calls(),1);assert.match(ctx.status(),/delivery.*not yet confirmed/i);assert.match(ctx.status(),/not a commission or a payment/i);assert.equal(ctx.f.elements.name.value,'');assert.match(ctx.f.elements.enquiry_reference.value,/NAC-/);ctx.dom.window.close();
});
test('invalid email or unacknowledged privacy notice blocks submission',async()=>{
 const ctx=await form({success:true});ctx.f.elements.consent.checked=false;await submit(ctx);assert.equal(ctx.calls(),0);
 ctx.f.elements.consent.checked=true;ctx.f.elements.email.value='invalid';await submit(ctx);assert.equal(ctx.calls(),0);ctx.dom.window.close();
});
test('budget estimator changes fee but never returns steel or support sizes; samples are not approved',async()=>{
 const ctx=await form({success:true}); const d=ctx.w.document;
 const before=d.getElementById('res-fee').textContent;d.getElementById('calc-scope').value='loft-pack';d.getElementById('calc-scope').dispatchEvent(new ctx.w.Event('change'));
 assert.notEqual(d.getElementById('res-fee').textContent,before);assert.match(d.getElementById('res-beam').textContent,/design required/);
 for(const btn of d.querySelectorAll('[data-sample-tab]')) {btn.click();assert.match(d.getElementById('sample-status').textContent,/NOT FOR CONSTRUCTION/);assert.doesNotMatch(d.getElementById('sample-lines').textContent,/PASS|SWL|900 mm|24 hrs/);}
 ctx.dom.window.close();
});
