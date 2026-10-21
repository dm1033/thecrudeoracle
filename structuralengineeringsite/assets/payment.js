(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const id=params.get('session_id');
  const box=document.getElementById('payment-status');
  const reference=document.getElementById('payment-reference');
  const refresh=document.getElementById('payment-refresh');
  // Remove bearer reference from address bar; do not store it or send it to analytics.
  history.replaceState(null,'',location.pathname);
  let attempts=0;
  async function check() {
    refresh.hidden=true;
    if (!id) {
      box.textContent=params.has('cancelled') ? 'You have returned from checkout. This page does not confirm payment. Use the original invitation to resume, or contact the practice if you are unsure whether a payment went through.' : 'Payment invitations are issued privately after written acceptance of a quotation. Contact the practice with your quotation reference.';
      return;
    }
    try {
      const response=await fetch(`/api/payment-status?session_id=${encodeURIComponent(id)}`,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000)});
      const data=await response.json();
      if (!response.ok) throw new Error();
      reference.textContent=`${data.test ? 'TEST ENVIRONMENT — ' : ''}Quotation ${data.reference}, revision ${data.revision}, ${data.stage.replaceAll('_',' ')}: ${new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(data.amountPence/100)}`;
      const messages={paid:'Payment confirmed and recorded against your accepted commission. The practice will confirm the delivery programme separately.',confirming:'Stripe reports payment received. We are waiting for the verified payment record. Do not pay again.',processing:'Your payment is processing. Do not pay again while it is pending; contact the practice for an update.',expired:'This payment invitation has expired. Contact the practice for a reviewed invitation; do not use another payment link for this commission.',unpaid:'Payment is not confirmed. If you have attempted payment, contact the practice before trying again. Otherwise, you can resume using your original invitation.'};
      box.textContent=messages[data.status] || 'Payment is not confirmed. Please contact the practice.';
      if (data.status === 'confirming' && ++attempts<5) setTimeout(check,3000);
      else refresh.hidden=data.status === 'paid';
    } catch {
      box.textContent='We could not verify payment. Do not pay again. Contact the practice with your quotation reference.';
      refresh.hidden=false;
    }
  }
  refresh.addEventListener('click',check); check();
})();
