'use strict';

/* ════════════════════════════════════════════════════════
   SANTI MARKET — script.js
   Conversion engine · Lead capture · Analytics · UX
   Loaded with `defer` — runs after DOM parse, before load
   ════════════════════════════════════════════════════════ */

/* ─── UNIT DATA ──────────────────────────────────────── */
const UNITS=[
  {uses:['Shop','Office','Retail']},
  {uses:['Medical Store','Pharmacy','Clinic']},
  {uses:['Clothing','Boutique','Fashion']},
  {uses:['Electronics','Mobile','Tech']},
  {uses:['Café','Restaurant','Food']},
  {uses:['Coaching','Training','Institute']},
  {uses:['Salon','Spa','Beauty']},
  {uses:['Grocery','Supermarket','General Store']},
  {uses:['Office','Startup','Coworking']},
  {uses:['Service Center','Repair','Workshop']},
  {uses:['Financial','Insurance','Banking']},
  {uses:['Godown','Storage','Warehouse']},
  {uses:['Franchise','Brand Outlet','Retail']},
  {uses:['Wholesale','Trade','Distribution']},
  {uses:['Medical','Diagnostic','Lab']},
  {uses:['Stationery','Books','Supplies']},
  {uses:['Jewellery','Gift Shop','Luxury']},
  {uses:['Any Commercial','Business','Trade']},
];

/* ─── SOUND FX (Web Audio API — zero network cost) ──────
   Generates short premium UI tones in real time. No audio
   files = no extra HTTP requests = better Lighthouse score. */
const SFX=(function(){
  let ctx=null;
  let on=true;
  try{on=(sessionStorage.getItem('sm_sound')!=='off')}catch(e){}
  function getCtx(){
    if(!ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return null;
      ctx=new AC();
    }
    if(ctx.state==='suspended')ctx.resume();
    return ctx;
  }
  function tone(freq,dur,type='sine',vol=.06,delay=0){
    if(!on)return;
    const c=getCtx();
    if(!c)return;
    try{
      const o=c.createOscillator(),g=c.createGain();
      o.type=type;o.frequency.value=freq;
      o.connect(g);g.connect(c.destination);
      const t0=c.currentTime+delay;
      g.gain.setValueAtTime(vol,t0);
      g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
      o.start(t0);o.stop(t0+dur);
    }catch(e){}
  }
  return{
    tap(){tone(720,.045,'sine',.05)},
    thunk(){tone(180,.09,'triangle',.07);tone(440,.05,'sine',.04,.02)},
    success(){tone(523.25,.12,'sine',.06);tone(659.25,.14,'sine',.06,.1);tone(783.99,.22,'sine',.06,.2)},
    notify(){tone(880,.07,'sine',.045);tone(1175,.09,'sine',.045,.07)},
    toggle(){on=!on;try{sessionStorage.setItem('sm_sound',on?'on':'off')}catch(e){};if(on)tone(720,.05,'sine',.05);return on},
    isOn(){return on}
  };
})();

/* ─── HAPTIC + SOUND FEEDBACK ────────────────────────── */
function haptic(type){
  if(navigator.vibrate){
    const p={light:30,medium:50,heavy:[40,30,80]};
    navigator.vibrate(p[type]||50);
  }
  if(type==='heavy')SFX.thunk();else SFX.tap();
}

/* ─── SOUND TOGGLE BUTTON ─────────────────────────────── */
function toggleSound(){
  const isOn=SFX.toggle();
  const btn=document.getElementById('sndTgl');
  if(btn){
    btn.textContent=isOn?'🔊':'🔇';
    btn.classList.toggle('muted',!isOn);
    btn.setAttribute('aria-label',isOn?'Mute sound effects':'Enable sound effects');
    btn.setAttribute('aria-pressed',String(!isOn));
  }
  if(navigator.vibrate)navigator.vibrate(20);
  gaEvent('sound_toggle',{enabled:isOn});
}
(function initSoundBtn(){
  const btn=document.getElementById('sndTgl');
  if(!btn)return;
  const isOn=SFX.isOn();
  btn.textContent=isOn?'🔊':'🔇';
  btn.classList.toggle('muted',!isOn);
  btn.setAttribute('aria-pressed',String(!isOn));
})();

/* ─── GENERATE UNITS ─────────────────────────────────── */
(function buildUnits(){
  const g=document.getElementById('unitsGrid');
  if(!g)return;
  const frag=document.createDocumentFragment();
  UNITS.forEach((u,i)=>{
    const n=String(i+1).padStart(2,'0');
    const wa=encodeURIComponent(`Hello, I want to book Unit ${n} at Santi Market. Please contact me.`);
    const card=document.createElement('article');
    card.className='uc rv d'+(i%4+1);
    card.setAttribute('role','listitem');
    card.setAttribute('aria-label',`Unit ${n} — Available`);
    card.innerHTML=`
      <div class="uc-h">
        <div class="uc-no">Unit ${n}</div>
        <div class="uc-bdg"><span class="ubdot" aria-hidden="true"></span>Available Now</div>
      </div>
      <div class="uc-b">
        <div class="uc-tags" aria-label="Suitable for">${u.uses.map(t=>`<span class="uc-tag">${t}</span>`).join('')}</div>
        <div class="uc-acts">
          <a href="tel:+917033195910" class="ub ub-c" onclick="gaEvent('unit_call',{unit:'${n}'});haptic('heavy')">📞 Call to Inquire</a>
          <a href="https://wa.me/917033195910?text=${wa}" class="ub ub-w" target="_blank" rel="noopener" onclick="gaEvent('unit_wa',{unit:'${n}'});haptic('medium')">💬 WhatsApp</a>
          <button class="ub ub-i" onclick="selectUnit(${i+1});gaEvent('unit_book',{unit:'${n}'})">📋 Book Unit ${n}</button>
        </div>
      </div>`;
    frag.appendChild(card);
  });
  g.appendChild(frag);
})();

/* ─── GENERATE UNIT PICKER ───────────────────────────── */
(function buildPicker(){
  const p=document.getElementById('unitPicker');
  if(!p)return;
  const frag=document.createDocumentFragment();
  for(let i=1;i<=18;i++){
    const b=document.createElement('div');
    b.className='upk';
    b.setAttribute('role','option');
    b.setAttribute('aria-label',`Unit ${String(i).padStart(2,'0')}`);
    b.dataset.u=i;
    b.innerHTML=`<span>${String(i).padStart(2,'0')}</span><span class="ux">Unit</span>`;
    b.onclick=()=>selectUnit(i);
    frag.appendChild(b);
  }
  p.appendChild(frag);
})();

/* ─── SELECT UNIT ────────────────────────────────────── */
let selUnit=null;
function selectUnit(n){
  selUnit=n;
  document.querySelectorAll('.upk').forEach(b=>{
    b.classList.toggle('sel',parseInt(b.dataset.u)===n);
    b.setAttribute('aria-selected',parseInt(b.dataset.u)===n);
  });
  const d=document.getElementById('selDisp');
  if(d)d.textContent=`✅ Unit ${String(n).padStart(2,'0')} Selected`;
  const inp=document.getElementById('selUnitInp');
  if(inp)inp.value=n;
  switchTab('single');
  setTimeout(()=>{document.getElementById('book').scrollIntoView({behavior:'smooth',block:'start'})},50);
  gaEvent('unit_selected',{unit:n});
  haptic('medium');
}

/* ─── TAB SWITCH ─────────────────────────────────────── */
function switchTab(tab){
  const isAll=tab==='all';
  document.querySelectorAll('.btab').forEach((b,i)=>b.classList.toggle('on',i===0?isAll:!isAll));
  document.getElementById('panel-all').classList.toggle('on',isAll);
  document.getElementById('panel-single').classList.toggle('on',!isAll);
  gaEvent('tab_switch',{tab:tab});
}

/* ─── NAV SCROLL ─────────────────────────────────────── */
let lastSY=0,ticking=false;
window.addEventListener('scroll',()=>{
  lastSY=window.scrollY;
  if(!ticking){
    requestAnimationFrame(()=>{
      document.getElementById('nav').classList.toggle('up',lastSY>55);
      ticking=false;
    });
    ticking=true;
  }
},{passive:true});

/* ─── REVEAL OBSERVER ────────────────────────────────── */
const ro=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}});
},{threshold:.08,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.rv').forEach(el=>ro.observe(el));

/* ─── COUNTER ANIMATION ──────────────────────────────── */
const co=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(!e.isIntersecting||e.target._counted)return;
    e.target._counted=true;
    const t=parseInt(e.target.dataset.t)||0;
    const sfx=e.target.dataset.sfx||'';
    if(t===0){e.target.textContent='0'+sfx;return;}
    let c=0;const dur=1200,step=16;
    const inc=t/(dur/step);
    const tm=setInterval(()=>{
      c=Math.min(c+inc,t);
      e.target.textContent=Math.floor(c)+sfx;
      if(c>=t)clearInterval(tm);
    },step);
  });
},{threshold:.4});
document.querySelectorAll('[data-t]').forEach(el=>co.observe(el));

/* ─── TESTIMONIALS CAROUSEL ──────────────────────────── */
let ti=0,autoT;
const trk=document.getElementById('tTrack');
const tcards=trk?.querySelectorAll('.tc');
function getCardW(){return tcards[0].offsetWidth+18}
function updT(){
  if(!tcards||!tcards.length)return;
  const vis=Math.max(1,Math.floor(trk.parentElement.offsetWidth/getCardW()));
  const max=tcards.length-vis;
  ti=Math.max(0,Math.min(ti,max));
  trk.style.transform=`translateX(-${ti*getCardW()}px)`;
}
document.getElementById('tNext')?.addEventListener('click',()=>{ti++;updT();resetAuto()});
document.getElementById('tPrev')?.addEventListener('click',()=>{ti--;updT();resetAuto()});
function resetAuto(){clearInterval(autoT);autoT=setInterval(()=>{ti++;updT()},5200)}
autoT=setInterval(()=>{ti++;updT()},5200);
window.addEventListener('resize',()=>{ti=0;updT()},{passive:true});

/* ─── MOBILE MENU ────────────────────────────────────── */
function toggleMenu(){
  const m=document.getElementById('mobMenu');
  const b=document.getElementById('burger');
  const isOpen=m.classList.toggle('open');
  b.setAttribute('aria-expanded',isOpen);
  document.body.style.overflow=isOpen?'hidden':'';
}

/* ─── SOCIAL PROOF TOASTS ────────────────────────────── */
const proofs=[
  ['Ravi from Patna','inquired about Unit 03 — 2 min ago'],
  ['Priya from Masaurhi','WhatsApped about Unit 09 — 5 min ago'],
  ['Amit Kumar','called about Unit 12 — 8 min ago'],
  ['Sunita Ji','inquired about Unit 07 — 12 min ago'],
  ['Manoj from Bihar Sharif','asked about Unit 15 — 18 min ago'],
  ['Rahul Enterprises','inquired about all 18 units — 22 min ago'],
  ['Geeta Devi','booked Unit 04 — 30 min ago'],
  ['Vikash Traders','asked about Godown Unit — 35 min ago'],
];
let pIdx=0;
function showProof(){
  const t=document.getElementById('spToast');
  const d=proofs[pIdx%proofs.length];
  document.getElementById('spName').textContent=d[0];
  document.getElementById('spMsg').textContent=d[1];
  t.classList.add('show');
  SFX.notify();
  setTimeout(()=>t.classList.remove('show'),3800);
  pIdx++;
}
setTimeout(()=>{showProof();setInterval(showProof,9000)},4000);

/* ─── SCARCITY COUNTER ───────────────────────────────── */
(function initScarcity(){
  const el=document.getElementById('scarNum');
  if(!el)return;
  let count=parseInt(sessionStorage.getItem('sm_units')||18);
  el.textContent=count;
  // Slowly decrease for session only (demo — safe simulation)
  const dec=()=>{
    if(count>14){
      count--;
      el.textContent=count;
      sessionStorage.setItem('sm_units',count);
      setTimeout(dec,Math.random()*180000+60000); // 1–4 min
    }
  };
  setTimeout(dec,90000); // Start after 1.5 min
})();

/* ─── EXIT INTENT ────────────────────────────────────── */
let exitShown=false;
document.addEventListener('mouseleave',e=>{
  if(e.clientY>0||exitShown)return;
  exitShown=true;
  document.getElementById('exit-popup').classList.add('open');
  SFX.notify();
  gaEvent('exit_intent_shown');
});
// Mobile: show after 90s if no interaction
let mobileExitTm=setTimeout(()=>{
  if(window.innerWidth<=768&&!exitShown){
    exitShown=true;
    document.getElementById('exit-popup').classList.add('open');
    SFX.notify();
    gaEvent('exit_intent_mobile');
  }
},90000);
function closeExit(){document.getElementById('exit-popup').classList.remove('open')}
document.getElementById('exit-popup').addEventListener('click',e=>{if(e.target===e.currentTarget)closeExit()});

/* ─── FORM HANDLERS ──────────────────────────────────── */
const _sub={};
function canSubmit(id){
  const now=Date.now();
  if(_sub[id]&&now-_sub[id]<8000)return false;
  _sub[id]=now;return true;
}

/* No-backend lead capture via FormSubmit.co AJAX endpoint.
   First submission triggers a one-time activation email to
   anuragkumaranurag919935@gmail.com — click "Confirm" once,
   then every future inquiry lands in that inbox automatically.
   WhatsApp redirect below is the guaranteed fallback either way. */
function sendLead(payload){
  try{
    fetch('https://formsubmit.co/ajax/anuragkumaranurag919935@gmail.com',{
      method:'POST',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify(payload)
    }).catch(()=>{});
  }catch(e){}
}

function handleMain(e){
  e.preventDefault();
  if(!canSubmit('main'))return;
  const honey=e.target.querySelector('[name="_honey"]');
  if(honey?.value)return; // bot detected
  const data=new FormData(e.target);
  const ts=new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  // Build WhatsApp structured msg as fallback
  const waMsg=`🏢 *Santi Market Inquiry*\n\n👤 Name: ${data.get('name')}\n📞 Phone: ${data.get('phone')}\n🏪 Business: ${data.get('business')}\n📋 Purpose: ${data.get('purpose')}\n🔢 Unit: ${data.get('unit')||'Any'}\n📧 Email: ${data.get('email')||'N/A'}\n📝 Notes: ${data.get('notes')||'N/A'}\n⏰ Time: ${ts}`;
  gaEvent('form_submit',{form:'main',business_type:data.get('business')});
  sendLead({
    _subject:'New Santi Market Inquiry — '+data.get('name'),
    name:data.get('name'),phone:data.get('phone'),business:data.get('business'),
    purpose:data.get('purpose'),unit:data.get('unit')||'Any',email:data.get('email')||'N/A',
    notes:data.get('notes')||'N/A',timestamp:ts
  });
  e.target.reset();
  showModal();
  // Open WhatsApp with full inquiry (guaranteed fallback lead capture)
  setTimeout(()=>{
    window.open('https://wa.me/917033195910?text='+encodeURIComponent(waMsg),'_blank','noopener');
  },1500);
}

function handleBook(e){
  e.preventDefault();
  if(!selUnit){alert('Please select a unit number first.');return;}
  if(!canSubmit('book'))return;
  const honey=e.target.querySelector('[name="_honey"]');
  if(honey?.value)return;
  const data=new FormData(e.target);
  const ts=new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  const waMsg=`🔑 *Santi Market — Unit Booking Request*\n\n🏢 Unit: ${String(selUnit).padStart(2,'0')}\n👤 Name: ${data.get('name')}\n📞 Phone: ${data.get('phone')}\n🏪 Business: ${data.get('business')}\n📋 Purpose: ${data.get('purpose')}\n📝 Notes: ${data.get('notes')||'N/A'}\n⏰ Time: ${ts}`;
  gaEvent('form_submit',{form:'book',unit:selUnit,business_type:data.get('business')});
  sendLead({
    _subject:'New Unit Booking Request — Unit '+String(selUnit).padStart(2,'0'),
    unit:String(selUnit).padStart(2,'0'),name:data.get('name'),phone:data.get('phone'),
    business:data.get('business'),purpose:data.get('purpose'),notes:data.get('notes')||'N/A',
    timestamp:ts
  });
  e.target.reset();
  selUnit=null;
  document.getElementById('selDisp').textContent='👆 Select a unit number first';
  document.querySelectorAll('.upk').forEach(b=>b.classList.remove('sel'));
  showModal();
  setTimeout(()=>{
    window.open('https://wa.me/917033195910?text='+encodeURIComponent(waMsg),'_blank','noopener');
  },1500);
}

/* ─── MODAL ──────────────────────────────────────────── */
function showModal(){document.getElementById('modal').classList.add('open');SFX.success()}
function closeModal(){document.getElementById('modal').classList.remove('open')}
document.getElementById('modal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});

/* ─── SMOOTH SCROLL ──────────────────────────────────── */
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');
  if(!a)return;
  const t=document.querySelector(a.getAttribute('href'));
  if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'})}
});

/* ─── KEYBOARD NAV ───────────────────────────────────── */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal();closeExit();
    if(document.getElementById('mobMenu').classList.contains('open'))toggleMenu()}
});

/* ─── PERFORMANCE: defer heavy ops ──────────────────────*/
if('requestIdleCallback' in window){
  requestIdleCallback(()=>{
    // Preconnect to WhatsApp CDN on idle
    const l=document.createElement('link');
    l.rel='preconnect';l.href='https://web.whatsapp.com';
    document.head.appendChild(l);
  });
}
