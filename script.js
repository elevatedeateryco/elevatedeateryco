
const CFG=window.ELEVATED_CONFIG;
document.querySelectorAll('[data-phone]').forEach(a=>{a.href=`tel:${CFG.phoneDial}`;a.textContent=CFG.phoneDisplay});
document.querySelectorAll('[data-email]').forEach(a=>{a.href=`mailto:${CFG.email}`;a.textContent=CFG.email});
document.querySelectorAll('[data-instagram]').forEach(a=>a.href=CFG.instagram);
document.querySelectorAll('[data-tiktok]').forEach(a=>a.href=CFG.tiktok);

const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('nav');
if(toggle)toggle.addEventListener('click',()=>nav.classList.toggle('open'));

function updateCountdown(){
  const el=document.querySelector('#weekly-countdown'); if(!el)return;
  const now=new Date(),target=new Date(now);
  let days=(5-now.getDay()+7)%7;
  target.setDate(now.getDate()+days); target.setHours(21,0,0,0);
  if(target<=now)target.setDate(target.getDate()+7);
  const diff=target-now;
  const d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),
        m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  el.innerHTML=`<div class="countdown-label">Ordering closes Friday at 9:00 PM</div>
  <div class="clock-countdown">
    <div><strong>${String(d).padStart(2,'0')}</strong><span>Days</span></div>
    <div><strong>${String(h).padStart(2,'0')}</strong><span>Hours</span></div>
    <div><strong>${String(m).padStart(2,'0')}</strong><span>Minutes</span></div>
    <div><strong>${String(s).padStart(2,'0')}</strong><span>Seconds</span></div>
  </div>`;
}
updateCountdown(); setInterval(updateCountdown,1000);

const form=document.querySelector('#meal-builder');
if(form){
  const sides=[...form.querySelectorAll('input[name=sides]')];
  const fulfillment=[...form.querySelectorAll('input[name=fulfillment]')];
  const qtyInput=document.querySelector('#meal-quantity');
  const qtyMinus=document.querySelector('#qty-minus');
  const qtyPlus=document.querySelector('#qty-plus');
  const qtyHelp=document.querySelector('#quantity-help');

  function selected(name){
    const x=form.querySelector(`input[name="${name}"]:checked`);
    return x?x.value:"Not selected";
  }

  function planMinimum(plan){
    if(plan==="10+ Meals")return 10;
    if(plan==="Monthly Service 25+")return 25;
    return 1;
  }

  function enforceQuantity(){
    const plan=selected('plan');
    const min=planMinimum(plan);
    qtyInput.min=min;
    if(Number(qtyInput.value)<min)qtyInput.value=min;
    if(plan==="Single Meal"){
      qtyInput.value=1;
      qtyHelp.textContent="Single meals are ordered one at a time.";
    }else if(plan==="10+ Meals"){
      qtyHelp.textContent="Choose any quantity starting at 10 meals.";
    }else{
      qtyHelp.textContent="Monthly service begins at 25 meals.";
    }
  }

  function deliveryFee(){
    const choice=selected('fulfillment');
    if(choice==="Delivery within 25 miles")return 50;
    if(choice==="Delivery over 25 miles")return 75;
    return 0;
  }

  function pricing(){
    const plan=selected('plan');
    const prep=selected('prep');
    const qty=Math.max(planMinimum(plan),Number(qtyInput.value)||1);
    let unit=15;
    if(plan==="10+ Meals")unit=14;
    if(plan==="Monthly Service 25+")unit=13;
    if(prep==="Halal"){
      if(plan==="Single Meal")unit=18;
      if(plan==="10+ Meals")unit=16;
      if(plan==="Monthly Service 25+")unit=15;
    }
    const fee=deliveryFee();
    return {qty,unit,fee,total:(qty*unit)+fee};
  }

  function updateSummary(){
    enforceQuantity();
    const plan=selected('plan'),prep=selected('prep'),protein=selected('protein');
    const chosen=sides.filter(x=>x.checked).map(x=>x.value);
    const price=pricing();
    document.querySelector('#sum-plan').textContent=plan;
    document.querySelector('#sum-quantity').textContent=`${price.qty} meal${price.qty===1?'':'s'}`;
    document.querySelector('#sum-prep').textContent=prep;
    document.querySelector('#sum-fulfillment').textContent=selected('fulfillment');
    document.querySelector('#sum-protein').textContent=protein;
    document.querySelector('#sum-sides').textContent=chosen.length?chosen.join(", "):"Choose two";
    document.querySelector('#sum-total').textContent=`$${price.total.toFixed(2)} total`;
  }

  sides.forEach(box=>box.addEventListener('change',()=>{
    if(sides.filter(x=>x.checked).length>2){
      box.checked=false;
      alert("Please choose exactly two sides.");
    }
    updateSummary();
  }));

  form.querySelectorAll('input[name=plan],input[name=protein],input[name=prep],input[name=fulfillment]').forEach(x=>x.addEventListener('change',updateSummary));
  qtyInput.addEventListener('input',updateSummary);
  qtyMinus.addEventListener('click',()=>{
    const min=planMinimum(selected('plan'));
    qtyInput.value=Math.max(min,(Number(qtyInput.value)||min)-1);
    updateSummary();
  });
  qtyPlus.addEventListener('click',()=>{
    qtyInput.value=(Number(qtyInput.value)||planMinimum(selected('plan')))+1;
    updateSummary();
  });

  updateSummary();

  document.querySelector('#checkout-btn').addEventListener('click',()=>{
    if(!form.querySelector('input[name=protein]:checked'))return alert("Please choose one protein.");
    if(sides.filter(x=>x.checked).length!==2)return alert("Please choose exactly two sides.");
    const plan=selected('plan');
    const key=plan==="Single Meal"?"singleMeal":plan==="10+ Meals"?"tenMealPack":"monthlyService";
    CFG.squareLinks[key]?window.open(CFG.squareLinks[key],"_blank"):document.querySelector('#square-modal').classList.add('open');
  });
}

document.querySelectorAll('.signature-order-btn').forEach(btn=>btn.addEventListener('click',()=>{
  CFG.squareLinks.singleMeal?window.open(CFG.squareLinks.singleMeal,"_blank"):document.querySelector('#square-modal').classList.add('open');
}));
document.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>document.querySelector('#square-modal').classList.remove('open')));

function mailForm(id,subject){
  const f=document.querySelector(id); if(!f)return;
  f.addEventListener('submit',e=>{
    e.preventDefault();
    const fd=new FormData(f),lines=[];
    for(const [k,v] of fd.entries())lines.push(`${k}: ${v}`);
    window.location.href=`mailto:${CFG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  });
}
mailForm('#catering-form','Catering Inquiry');
mailForm('#chef-form','Private Chef Inquiry');


/* Dynamic meal-prep ordering cart */
(() => {
  const section = document.querySelector('#order-meal-prep');
  if (!section) return;

  const state = {
    plan: {
      key: 'single-standard',
      label: 'Individual Standard',
      minimum: 1,
      unitPrice: 15,
      preparation: 'Standard',
      monthly: false
    },
    fulfillment: 'pickup',
    deliveryFee: 0,
    deliveryZip: '',
    meals: {},
    customBowls: []
  };

  const money = amount => `$${Number(amount).toFixed(2)}`;
  const mealCards = [...section.querySelectorAll('.meal-choice-card[data-meal]:not(.custom-meal-card)')];
  const modal = document.querySelector('#custom-bowl-modal');

  function mealCount() {
    return Object.values(state.meals).reduce((sum, qty) => sum + qty, 0) + state.customBowls.length;
  }

  function priceForPreparation(preparation) {
    const tier = state.plan.minimum >= 25 ? 'monthly' : state.plan.minimum >= 10 ? 'ten' : 'single';
    const prices = {
      single: { Standard: 15, Halal: 18 },
      ten: { Standard: 14, Halal: 16 },
      monthly: { Standard: 13, Halal: 15 }
    };
    return prices[tier][preparation] || state.plan.unitPrice;
  }

  function subtotal() {
    const signatureCount = Object.values(state.meals).reduce((sum, qty) => sum + qty, 0);
    const signatureSubtotal = signatureCount * state.plan.unitPrice;
    const customSubtotal = state.customBowls.reduce((sum, bowl) => sum + priceForPreparation(bowl.preparation), 0);
    return signatureSubtotal + customSubtotal;
  }

  function total() {
    return subtotal() + state.deliveryFee;
  }

  function setStep(step) {
    section.querySelectorAll('[data-order-step]').forEach(panel => {
      panel.classList.toggle('active', Number(panel.dataset.orderStep) === step);
    });
    section.querySelectorAll('[data-step-dot]').forEach(dot => {
      dot.classList.toggle('active', Number(dot.dataset.stepDot) <= step);
    });
    if (step === 4) renderReview();
    section.scrollIntoView({behavior:'smooth', block:'start'});
  }

  section.querySelectorAll('.package-card').forEach(card => {
    card.addEventListener('click', () => {
      section.querySelectorAll('.package-card').forEach(x => x.classList.remove('selected'));
      card.classList.add('selected');
      state.plan = {
        key: card.dataset.plan,
        label: card.querySelector('strong').textContent,
        minimum: Number(card.dataset.min),
        unitPrice: Number(card.dataset.unit),
        preparation: card.dataset.prep,
        monthly: card.dataset.monthly === 'true'
      };
      updateCart();
    });
  });

  section.querySelectorAll('.fulfillment-card').forEach(card => {
    card.addEventListener('click', () => {
      section.querySelectorAll('.fulfillment-card').forEach(x => x.classList.remove('selected'));
      card.classList.add('selected');
      state.fulfillment = card.dataset.fulfillment;
      state.deliveryFee = Number(card.dataset.fee);
      const box = section.querySelector('.delivery-zip-box');
      box.hidden = state.fulfillment !== 'delivery';
      if (state.fulfillment === 'pickup') {
        state.deliveryZip = '';
        state.deliveryFee = 0;
      }
      updateCart();
    });
  });

  const zoneButton = section.querySelector('#check-delivery-zone');
  zoneButton.addEventListener('click', () => {
    const input = section.querySelector('#delivery-zip');
    const result = section.querySelector('#delivery-zone-result');
    const zip = input.value.trim();
    if (!/^\d{5}$/.test(zip)) {
      result.textContent = 'Please enter a valid 5-digit ZIP code.';
      return;
    }
    state.deliveryZip = zip;
    // Exact driving-distance validation should occur server-side.
    // The preview uses a simple customer confirmation choice.
    const far = window.confirm('Is this delivery address more than 25 miles from ZIP code 32712?\n\nChoose OK for more than 25 miles ($75), or Cancel for within 25 miles ($50).');
    state.deliveryFee = far ? 75 : 50;
    result.textContent = far
      ? `${zip}: $75 delivery fee. Final service-area confirmation may be required.`
      : `${zip}: $50 delivery fee.`;
    updateCart();
  });

  mealCards.forEach(card => {
    const name = card.dataset.meal;
    state.meals[name] = 0;
    card.querySelector('[data-meal-minus]').addEventListener('click', () => {
      state.meals[name] = Math.max(0, state.meals[name] - 1);
      card.querySelector('output').textContent = state.meals[name];
      updateCart();
    });
    card.querySelector('[data-meal-plus]').addEventListener('click', () => {
      state.meals[name] += 1;
      card.querySelector('output').textContent = state.meals[name];
      updateCart();
    });
  });

  function openCustomModal() {
    const preferredPreparation = state.plan.preparation === 'Halal' ? 'Halal' : 'Standard';
    const preparationInput = modal.querySelector(`input[name="modal-preparation"][value="${preferredPreparation}"]`);
    if (preparationInput) preparationInput.checked = true;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }
  function closeCustomModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    modal.querySelectorAll('input').forEach(input => input.checked = false);
    const regular = modal.querySelector('input[name="modal-preparation"][value="Standard"]');
    if (regular) regular.checked = true;
    modal.querySelector('#custom-bowl-note').value = '';
  }
  section.querySelector('.custom-bowl-open').addEventListener('click', openCustomModal);
  modal.querySelector('.custom-modal-close').addEventListener('click', closeCustomModal);
  modal.querySelector('.custom-modal-cancel').addEventListener('click', closeCustomModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeCustomModal(); });

  modal.querySelectorAll('input[name="modal-side"]').forEach(box => {
    box.addEventListener('change', () => {
      const checked = [...modal.querySelectorAll('input[name="modal-side"]:checked')];
      if (checked.length > 2) {
        box.checked = false;
        alert('Please choose exactly two sides.');
      }
    });
  });

  modal.querySelector('#add-custom-bowl').addEventListener('click', () => {
    const preparation = modal.querySelector('input[name="modal-preparation"]:checked')?.value;
    const protein = modal.querySelector('input[name="modal-protein"]:checked')?.value;
    const sides = [...modal.querySelectorAll('input[name="modal-side"]:checked')].map(x => x.value);
    const note = modal.querySelector('#custom-bowl-note').value.trim();
    if (!preparation) return alert('Please choose Regular or Halal preparation.');
    if (!protein) return alert('Please choose one protein.');
    if (sides.length !== 2) return alert('Please choose exactly two sides.');
    state.customBowls.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      preparation, protein, sides, note
    });
    closeCustomModal();
    updateCart();
  });

  function removeCustom(id) {
    state.customBowls = state.customBowls.filter(bowl => bowl.id !== id);
    updateCart();
  }

  function updateCart() {
    const count = mealCount();
    section.querySelector('#cart-meal-count').textContent = count;
    section.querySelector('#meal-subtotal').textContent = money(subtotal());
    section.querySelector('#delivery-subtotal').textContent = money(state.deliveryFee);
    section.querySelector('#order-grand-total').textContent = money(total());

    const min = state.plan.minimum;
    const percent = min <= 1 ? (count ? 100 : 0) : Math.min(100, (count / min) * 100);
    section.querySelector('#minimum-meter-fill').style.width = `${percent}%`;
    const msg = section.querySelector('#minimum-message');
    if (min <= 1) msg.textContent = count ? `${count} meal${count===1?'':'s'} selected.` : 'This plan has no minimum.';
    else if (count >= min) msg.textContent = `Minimum met — ${count} meals selected.`;
    else msg.textContent = `Add ${min-count} more meal${min-count===1?'':'s'} to meet the ${min}-meal minimum.`;

    const lines = [];
    Object.entries(state.meals).forEach(([name, qty]) => {
      if (qty > 0) lines.push(`<div class="mini-cart-line"><span>${name}</span><strong>× ${qty}</strong></div>`);
    });
    state.customBowls.forEach((bowl, index) => {
      lines.push(`<div class="mini-cart-line">
        <span>Custom Bowl ${index+1}<small>${bowl.preparation} · ${bowl.protein} · ${bowl.sides.join(' + ')} · ${money(priceForPreparation(bowl.preparation))}</small></span>
        <button type="button" data-remove-custom="${bowl.id}" aria-label="Remove custom bowl">×</button>
      </div>`);
    });
    const container = section.querySelector('#mini-cart-lines');
    container.innerHTML = lines.length ? lines.join('') : '<p class="empty-cart">Your selected bowls will appear here.</p>';
    container.querySelectorAll('[data-remove-custom]').forEach(btn => btn.addEventListener('click', () => removeCustom(btn.dataset.removeCustom)));
  }

  section.querySelectorAll('.order-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = Number(btn.dataset.nextStep);
      if (next === 3 && state.fulfillment === 'delivery' && !state.deliveryZip) {
        return alert('Please enter and check your delivery ZIP code.');
      }
      if (next === 4) {
        const count = mealCount();
        if (count === 0) return alert('Please select at least one meal.');
        if (count < state.plan.minimum) return alert(`This plan requires at least ${state.plan.minimum} meals.`);
      }
      setStep(next);
    });
  });
  section.querySelectorAll('.order-back').forEach(btn => btn.addEventListener('click', () => setStep(Number(btn.dataset.backStep))));

  function renderReview() {
    const mealLines = [];
    Object.entries(state.meals).forEach(([name, qty]) => {
      if (qty) mealLines.push(`<div class="review-line"><span>${name}</span><strong>${qty}</strong></div>`);
    });
    state.customBowls.forEach((bowl, i) => {
      mealLines.push(`<div class="review-line"><span>Custom Bowl ${i+1}<small style="display:block">${bowl.preparation}; ${bowl.protein}; ${bowl.sides.join(', ')}</small></span><strong>${money(priceForPreparation(bowl.preparation))}</strong></div>`);
    });
    section.querySelector('#checkout-review-details').innerHTML = `
      <h4>Your Order</h4>
      <div class="review-section">
        <div class="review-line"><span>Plan</span><strong>${state.plan.label}</strong></div>
        <div class="review-line"><span>Preparation</span><strong>${state.plan.preparation}</strong></div>
        <div class="review-line"><span>Price per meal</span><strong>${money(state.plan.unitPrice)}</strong></div>
      </div>
      <div class="review-section">
        <div class="review-line"><span>Fulfillment</span><strong>${state.fulfillment === 'pickup' ? 'Sunday Pickup' : `Delivery — ${state.deliveryZip}`}</strong></div>
        <div class="review-line"><span>Delivery fee</span><strong>${money(state.deliveryFee)}</strong></div>
      </div>
      <div class="review-section">${mealLines.join('')}</div>
      <div class="review-section">
        <div class="review-line"><span>Total meals</span><strong>${mealCount()}</strong></div>
        <div class="review-line"><span>Estimated total</span><strong>${money(total())}</strong></div>
      </div>`;
  }

  section.querySelector('#square-dynamic-checkout').addEventListener('click', async () => {
    const name = section.querySelector('#order-name').value.trim();
    const phone = section.querySelector('#order-phone').value.trim();
    const email = section.querySelector('#order-email').value.trim();
    const notes = section.querySelector('#order-notes').value.trim();
    if (!name || !phone || !email) return alert('Please enter your name, phone number, and email.');

    const payload = {
      customer: {name, phone, email},
      notes,
      plan: state.plan,
      fulfillment: {
        method: state.fulfillment,
        zip: state.deliveryZip,
        fee: state.deliveryFee
      },
      signatureMeals: Object.entries(state.meals)
        .filter(([,qty]) => qty > 0)
        .map(([name,quantity]) => ({name, quantity})),
      customBowls: state.customBowls,
      totalMeals: mealCount(),
      subtotal: subtotal(),
      total: total()
    };

    const endpoint = window.ELEVATED_CONFIG?.squareCheckoutEndpoint || '';
    if (!endpoint) {
      console.log('Square checkout payload:', payload);
      alert('The ordering experience is complete. The final step is connecting the secure Cloudflare checkout endpoint to your Square account.');
      return;
    }

    const button = section.querySelector('#square-dynamic-checkout');
    button.disabled = true;
    button.textContent = 'Creating Secure Checkout…';
    try {
      const response = await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Checkout request failed');
      const result = await response.json();
      if (!result.checkoutUrl) throw new Error('No checkout URL received');
      window.location.href = result.checkoutUrl;
    } catch (error) {
      console.error(error);
      alert('We could not open checkout. Please try again or contact Elevated Eatery Co.');
      button.disabled = false;
      button.textContent = 'Continue to Secure Square Checkout';
    }
  });

  updateCart();
})();
