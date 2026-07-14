
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
