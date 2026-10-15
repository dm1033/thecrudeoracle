import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const html=await readFile(new URL('../payment.html',import.meta.url),'utf8');
const js=await readFile(new URL('../assets/payment.js',import.meta.url),'utf8');
async function render(status,search='?session_id=cs_test_12345678901234567890') {
 const dom=new JSDOM(html,{url:'https://needacalc.example/payment'+search,runScripts:'outside-only'});const w=dom.window;
 w.fetch=async()=>({ok:true,json:async()=>({status,reference:'NAC-2026-01234',revision:'P01',stage:'deposit',amountPence:15000,test:true})});
 w.eval(js);await new Promise(resolve=>setTimeout(resolve,10));return {dom,box:w.document.getElementById('payment-status'),ref:w.document.getElementById('payment-reference')};
}
test('only verified paid response reports confirmation; pending and unpaid warn against another payment',async()=>{
 for(const status of ['paid','confirming','processing','unpaid','expired']){
  const {dom,box,ref}=await render(status);assert.equal(dom.window.location.search,'');
  if(status==='paid'){assert.match(box.textContent,/Payment confirmed and recorded/);assert.match(ref.textContent,/TEST ENVIRONMENT.*deposit.*£150/);}
  else {assert.doesNotMatch(box.textContent,/Payment confirmed and recorded/);assert.match(box.textContent,/not pay again|before trying again|expired/i);}
  dom.window.close();
 }
});
test('cancelled query and missing session ID cannot fabricate a payment success',async()=>{
 for(const query of ['?cancelled=1','?paid=true','']){const {dom,box}=await render('paid',query);assert.doesNotMatch(box.textContent,/Payment confirmed and recorded/);dom.window.close();}
});
