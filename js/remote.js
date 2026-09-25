/* DADASHMODE V8 · remote.js · phone screen for phone mode (book §9.2). Vertical, big buttons (≥56px), Persian RTL.
   Roles: DIRECTOR · PLAYER_E · PLAYER_M · JUDGE · MONITOR. The phone only SENDS commands; the computer computes everything.
   Transport: WebSocket /ws on the same local server (tools/ws-hub.mjs) → fallback BroadcastChannel (same device, no server).
   Reliability: every command has a unique id (repeat = ignored on the computer); an unanswered command is re-sent after a reconnect
   only if it is younger than 3 s (the computer stamps event time on arrival, so an old press is never replayed late).
   SYNC = round trip phone → hub → computer → phone (ping/pong); > 150 ms = yellow.  Wake Lock (with a video fallback on http),
   vibration after every accepted command, full screen.                                                                            */
(function(){'use strict';
const $=s=>document.querySelector(s);
const fa=n=>String(n==null?'':n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\./g,'٫');
const en=s=>String(s==null?'':s).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٫,]/g,'.');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rid=()=>{const a=new Uint32Array(3);(self.crypto||window.msCrypto).getRandomValues(a);return Array.from(a,x=>x.toString(36)).join('').slice(0,12)};
const ROLES=[['DIRECTOR','🎬 کارگردان','بانک‌ها، مرحله، تایمر، همهٔ دکمه‌ها'],['PLAYER_E','🔴 بازیکن E','«تمام»، کارت مخفی، شرط ریسک'],['PLAYER_M','🟢 بازیکن M','«تمام»، کارت مخفی، شرط ریسک'],['JUDGE','⚖️ داور سوم','خالی ✔، غلط، چالش، گل، ریسک'],['MONITOR','🖥 مانیتور','تمام‌صفحه، بدون دکمه']];
const q=new URLSearchParams(location.search);
let room=(q.get('room')||localStorage.getItem('dm-rem-room')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
let pin=(q.get('pin')||localStorage.getItem('dm-rem-pin')||'').replace(/\D/g,'').slice(0,4);
let role=(q.get('role')||'').toUpperCase();if(!ROLES.some(r=>r[0]===role))role=room?(localStorage.getItem('dm-rem-role-'+room)||''):'';
const R={ws:null,bc:null,mode:'',open:false,host:false,rtt:null,pub:null,priv:null,rxAt:0,prevTimer:null,lastRx:0,pending:new Map(),n:0,retry:0,fatal:'',cid:'',timer:null,pingT:null,html:'',vals:{},wake:null};
const cidKey=()=>`dm-rem-cid-${room}-${role}`;
function setRoute(){const u=new URL(location.href);u.searchParams.set('room',room);u.searchParams.set('pin',pin);if(role)u.searchParams.set('role',role);else u.searchParams.delete('role');history.replaceState(null,'',u)}

/* ---------- toast / vibrate ---------- */
let tT=0;function toast(m,err){const t=$('#toast');t.textContent=m;t.className='toast'+(err?' err':'');clearTimeout(tT);tT=setTimeout(()=>t.className='toast hide',err?3200:1600)}
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

/* ---------- screen wake lock (secure contexts) + fallback: a tiny muted looping video (works on http://LAN-IP) ---------- */
async function wakeOn(){if(document.visibilityState!=='visible')return;
 if('wakeLock' in navigator&&window.isSecureContext){try{if(!R.wake){R.wake=await navigator.wakeLock.request('screen');R.wake.addEventListener('release',()=>{R.wake=null})}return}catch(e){}}
 if(!R.vid){try{const c=document.createElement('canvas');c.width=c.height=2;const g=c.getContext('2d');const v=document.createElement('video');v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.loop=true;
  v.style.cssText='position:fixed;width:1px;height:1px;opacity:0.01;pointer-events:none;bottom:0;left:0';v.srcObject=c.captureStream(1);document.body.appendChild(v);
  setInterval(()=>{g.fillStyle=Date.now()%2000<1000?'#000':'#010101';g.fillRect(0,0,2,2)},1000);R.vid=v}catch(e){}}
 try{R.vid&&R.vid.play()}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){wakeOn();if(!R.open&&!R.fatal&&room)reconnectNow()}});
document.addEventListener('pointerdown',()=>wakeOn(),{once:false,passive:true});

/* ---------- transport ---------- */
async function start(){R.cid=localStorage.getItem(cidKey())||rid();localStorage.setItem(cidKey(),R.cid);localStorage.setItem('dm-rem-room',room);localStorage.setItem('dm-rem-pin',pin);localStorage.setItem('dm-rem-role-'+room,role);setRoute();
 R.fatal='';let ws=false;if(/^https?:$/.test(location.protocol)){try{const c=new AbortController();setTimeout(()=>c.abort(),2500);const r=await fetch('api/config?'+Date.now(),{cache:'no-store',signal:c.signal});const j=await r.json();ws=!!j.ws}catch(e){ws=false}}
 if(ws){R.mode='ws';connectWS()}else{R.mode='bc';connectBC()}render();clearInterval(R.pingT);R.pingT=setInterval(ping,2000)}
function connectWS(){clearTimeout(R.timer);if(R.fatal)return;const proto=location.protocol==='https:'?'wss:':'ws:';
 const url=`${proto}//${location.host}/ws?room=${encodeURIComponent(room)}&pin=${encodeURIComponent(pin)}&role=${role}&cid=${encodeURIComponent(R.cid)}&name=${encodeURIComponent((navigator.userAgentData&&navigator.userAgentData.platform)||'')}`;
 let ws;try{ws=new WebSocket(url)}catch(e){schedule();return}R.ws=ws;
 ws.onopen=()=>{R.open=true;R.retry=0;R.lastRx=performance.now();resendRecent();ping();render()};
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(err){return}onMsg(m)};
 ws.onclose=e=>{if(R.ws!==ws)return;R.ws=null;R.open=false;R.host=false;R.rtt=null;
  const F={4000:'اتاق یا PIN نامعتبر است. QR را دوباره اسکن کنید.',4001:'PIN اشتباه است (یا کامپیوتر PIN جدید ساخته). QR را دوباره اسکن کنید.',4002:'نقش نامعتبر.',4003:'کامپیوتر این گوشی را بیرون کرد.',4011:'کامپیوتر حالت گوشی را بست یا PIN را عوض کرد. QR جدید را اسکن کنید.',4012:'همین نقش در یک تب/گوشی دیگر باز شد. این صفحه متوقف شد.'};
  if(F[e.code]){R.fatal=F[e.code];render();return}schedule();render()}}
function schedule(){clearTimeout(R.timer);if(R.fatal)return;const w=Math.min(3000,300*Math.pow(2,R.retry++));R.timer=setTimeout(connectWS,w)}
function reconnectNow(){if(R.mode!=='ws'||R.fatal)return;if(R.ws){try{R.ws.onclose=null;R.ws.close()}catch(e){}R.ws=null;R.open=false}R.retry=0;connectWS()}
addEventListener('online',()=>{if(!R.open)reconnectNow()});
function connectBC(){try{R.bc=new BroadcastChannel('dadashmode-sync')}catch(e){R.fatal='این مرورگر نه به سرور محلی دسترسی دارد و نه BroadcastChannel. اپ را با server.js اجرا کنید.';render();return}
 R.bc.onmessage=e=>{const m=e.data||{};if(m.type==='state'){onMsg({type:'state',seq:m.seq,pub:m.pub,priv:m.priv?m.priv[role]||null:null});return}if((m.type==='ack'||m.type==='pong')&&m.cid===R.cid)onMsg(m)};
 R.open=true;const hello=()=>R.bc.postMessage({type:'hello',room,pin,role,cid:R.cid});hello();setInterval(hello,3000)}
function raw(m){if(R.mode==='ws'){if(R.ws&&R.ws.readyState===1){R.ws.send(JSON.stringify(m));return true}return false}
 if(R.bc){R.bc.postMessage(Object.assign({room,pin,role,cid:R.cid},m));return true}return false}
function ping(){if(!R.open)return;raw({type:'ping',t:performance.now()});
 if(R.mode==='ws'&&R.lastRx&&performance.now()-R.lastRx>7000&&R.ws){/* half-open socket (Wi-Fi dropped silently) → force reconnect */try{R.ws.close()}catch(e){}R.ws=null;R.open=false;R.host=false;schedule();render()}
 if(R.mode==='bc'&&R.lastRx&&performance.now()-R.lastRx>6000){R.host=false;render()}}
function onMsg(m){R.lastRx=performance.now();
 switch(m.type){
  case 'hello':R.host=!!m.host;render();break;
  case 'host':R.host=!!m.online;if(!R.host)R.rtt=null;render();break;
  case 'state':R.host=true;if(R.pub&&R.pub.timer)R.prevTimer=R.pub.timer.remain;R.pub=m.pub||{};R.priv=m.priv||null;R.rxAt=performance.now();render();break;
  case 'pong':if(m.host===false){R.host=false;R.rtt=null}else{R.host=true;R.rtt=performance.now()-m.t}live();break;
  case 'ack':{const p=R.pending.get(m.id);if(!p)break;R.pending.delete(m.id);if(m.ok){buzz(25);if(m.msg)toast(m.msg)}else{buzz([60,40,60]);toast(m.err||'انجام نشد',true)}render();break}}}
function resendRecent(){const now=performance.now();for(const [id,p] of R.pending){if(now-p.at<3000)raw(p.m);else{R.pending.delete(id);toast(`«${p.label||p.m.action}» به کامپیوتر نرسید؛ اگر لازم است دوباره بزنید`,true)}}}
function send(action,payload,label){if(role==='MONITOR')return;if(!R.open||!R.host){buzz([80,40,80]);toast(R.open?'کامپیوتر وصل نیست':'اتصال قطع است؛ چند لحظه صبر کنید',true);return}
 const id=`${R.cid}-${Date.now().toString(36)}-${++R.n}`;const m={type:'cmd',id,action,payload:payload||{},ts:Date.now()};R.pending.set(id,{m,at:performance.now(),label});
 if(!raw(m)){/* socket just dropped: keep it for the 3 s resend window */}render();
 setTimeout(()=>{if(R.pending.has(id)){R.pending.delete(id);toast(`پاسخی برای «${label||action}» نیامد؛ صفحهٔ کامپیوتر را چک کنید`,true);render()}},5000)}

/* ---------- helpers for views ---------- */
const P=()=>R.pub||{};
const nm=k=>(P().names&&P().names[k])||(k==='E'?'الیاس':'عماد');
const col=k=>(P().colors&&P().colors[k])||(k==='E'?'#ff2738':'#00c98d');
const me=()=>role==='PLAYER_E'?'E':role==='PLAYER_M'?'M':null;
const pendingAct=a=>[...R.pending.values()].some(p=>p.m.action===a);
function B(a,l,p,cls,extra){const pay=p||{};return `<button class="b ${cls||''} ${pendingAct(a)?'pending':''}" data-a="${esc(a)}" data-p='${esc(JSON.stringify(pay))}' data-l="${esc(String(l).replace(/<[^>]+>/g,''))}" ${extra||''}>${l}</button>`}
const card=(title,body,cls)=>`<section class="card ${cls||''}">${title?`<h3>${title}</h3>`:''}${body}</section>`;
const grid=(items,n)=>items.filter(Boolean).length?`<div class="grid ${n===1?'one':n===3?'three':''}">${items.filter(Boolean).join('')}</div>`:'';
function banks(){const b=P().banks||{};return `<div class="banks">${['E','M'].map(k=>`<div class="bank" style="--c:${esc(col(k))}"><small>${esc(nm(k))}</small><b class="num">${b[k]!=null?fa(b[k]):'—'}</b></div>`).join('')}</div>`}
function stateBar(){const p=P();const title=p.v7on?(p.stateFa||p.state||''):(p.seg&&p.seg.live>=0&&p.seg.list[p.seg.live]?p.seg.list[p.seg.live].t:(p.seg?'بخش‌ها':'منتظر کامپیوتر'));
 return `<div class="statebar"><span class="st">${esc(title)}${p.paused?' · ⏸ مکث':''}</span><span class="tm num" data-live="timer"></span></div>`}
function timerNow(){const p=P();let t=null;
 if(p.v7on&&p.run&&p.run.started&&!p.run.done){/* final: runner clock is inside timer too */}
 if(p.v7on&&p.timer){const tm=p.timer;if(tm.remain!=null){let r=tm.remain;const running=R.prevTimer!=null&&tm.remain<R.prevTimer&&!p.paused;if(running)r=Math.max(0,r-Math.min(.35,(performance.now()-R.rxAt)/1000));t={v:r,hot:r<=10&&r>0}}else if(tm.elapsed!=null)t={v:tm.elapsed+Math.min(.35,(performance.now()-R.rxAt)/1000)*(p.paused?0:1),hot:false}}
 else if(p.v8g&&p.v8g.run&&p.v8g.elapsed!=null)t={v:p.v8g.elapsed+Math.min(.35,(performance.now()-R.rxAt)/1000),hot:false};
 else if(p.seg&&p.seg.timer){let r=p.seg.timer.remain;if(p.seg.timer.running)r=Math.max(0,r-Math.min(.35,(performance.now()-R.rxAt)/1000));t={v:r,hot:r<=10&&r>0}}
 return t}
const mmss=s=>{s=Math.max(0,s);const m=Math.floor(s/60),x=s-m*60;return `${String(m).padStart(2,'0')}:${x.toFixed(1).padStart(4,'0')}`};

/* ---------- action tables (same commands as the computer's V7 console; names from the episode) ---------- */
function acts(st,d){const E=esc(nm('E')),M=esc(nm('M'));const A=(a,l,p,c)=>B(a,l,p,c);const p=P();
 const T={
 R1:[d&&A('r1.start','▶ شروع ۳۰ ثانیه',{},'pri'),A('r1.valid',`${E} برج ✔`,{p:'E'},'E'),A('r1.valid',`${M} برج ✔`,{p:'M'},'M'),A('r1.fall',`${E} ریخت`,{p:'E'}),A('r1.fall',`${M} ریخت`,{p:'M'}),d&&A('r1.tie','هم‌زمان (تروث‌کم)')],
 R2:[d&&A('r2.lock','🔒 قفل انتخاب خط',{},'pri'),A('r2.throw',`گل ${E}`,{p:'E',res:'hit'},'E'),A('r2.throw',`گل ${M}`,{p:'M',res:'hit'},'M'),A('r2.throw','نخورد',{res:'miss'}),A('r2.throw','پا روی خط',{res:'foot'},'bad')],
 R3_SANDWICH:[d&&A('r3.start','▶ شروع دوئل',{},'pri'),A('r3.mouthfull',`${E} دهان‌پر`,{p:'E'},'E'),A('r3.mouthfull',`${M} دهان‌پر`,{p:'M'},'M'),A('r3.empty',`${E} خالی ✔`,{p:'E'},'E'),A('r3.empty',`${M} خالی ✔`,{p:'M'},'M'),A('r3.pen',`جریمه ${E}`,{p:'E'},'bad'),A('r3.pen',`جریمه ${M}`,{p:'M'},'bad'),d&&A('r3.safety','«قرمز» توقف ایمنی',{},'bad'),d&&A('r3.confirm','✓ تأیید نتیجه',{},'ok')],
 R4_GLUE:[d&&A('r4.start','▶ شروع ۱۸۰ ثانیه',{},'pri'),d&&A('r4.finish',`${E} تمام`,{p:'E'},'E'),d&&A('r4.finish',`${M} تمام`,{p:'M'},'M'),A('r4.wrong','✕ غلط (قفل ۵ث)',{},'bad'),A('r4.valid','✓ تأیید معتبر',{},'ok'),d&&A('gc.open','چالش چسب',{},'gold'),d&&A('r4.tie','هم‌زمان درست (تروث‌کم)'),d&&A('r4.none','هیچ‌کس تمام نکرد')],
 GLUE_CHALLENGE:[A('gc.check','تکان ✔ سالم',{k:'shake',v:true},'ok'),A('gc.check','تکان ✕ ریخت',{k:'shake',v:false},'bad'),A('gc.check','قاب ✔',{k:'frame',v:true},'ok'),A('gc.check','قاب ✕',{k:'frame',v:false},'bad'),A('gc.check','تمیزی ✔',{k:'clean',v:true},'ok'),A('gc.check','تمیزی ✕',{k:'clean',v:false},'bad'),A('gc.result','چالش موفق',{res:'win'},'ok'),A('gc.result','ناموفق',{res:'lose'},'bad'),A('gc.result','نامشخص',{res:'unclear'})],
 REVEAL:[d&&A('reveal.show','رونمایی + سقف ۳۰',{},'gold')],
 SHOP:[d&&A('shop.submit',`ثبت ${E}`,{p:'E'},'E'),d&&A('shop.submit',`ثبت ${M}`,{p:'M'},'M'),d&&A('shop.reveal','رونمایی کارت‌ها',{},'gold')],
 RISK:[A('risk.result',`${E} خورد`,{p:'E',hit:true},'E'),A('risk.result',`${E} نخورد`,{p:'E',hit:false}),A('risk.result',`${M} خورد`,{p:'M',hit:true},'M'),A('risk.result',`${M} نخورد`,{p:'M',hit:false})],
 VAULT_ARMED:[d&&A('vault.arm','مسلح کردن گاوصندوق',{},'gold')],
 RUN:[d&&A('run.start','▶ شروع ساعت',{},'pri'),A('s1.pass','ایستگاه ۱ ✔',{},'ok'),A('s1.fail','نقاشی دوباره',{},'bad'),d&&A('s2.start','نمایش حافظه'),A('s2.check','بررسی حافظه',{},'pri'),d&&A('run.pause',p.run&&p.run.paused&&p.run.started?'▶ ادامهٔ ساعت':'⏸ توقف داور'),d&&A('run.pen','جریمه ۱۰',{sec:10},'bad'),d&&A('run.glovesOff','🥊 یک دست آزاد −۵'),d&&A('s2.hint','🔍 ذره‌بین')],
 CASE:[d&&A('sd.start','شروع مرگ ناگهانی',{},'bad'),A('sd.result',`${E} بیرون`,{p:'E',out:true}),A('sd.result',`${M} بیرون`,{p:'M',out:true}),d&&A('case.winner',`برنده ${E}`,{p:'E'},'E'),d&&A('case.winner',`برنده ${M}`,{p:'M'},'M')],
 CASE_L2:[d&&A('case.env','پاکت تصادفی',{random:true},'gold')],
 CASE_L3:d?[1,2,3,4,5,6].map(n=>A('case.bite','جعبه '+fa(n),{n})):[]};
 return T[st==='RUN1'||st==='RUN2'?'RUN':st]||[]}
function inp(key,ph,mode){const v=R.vals[key]||'';return `<input class="in num" data-k="${key}" placeholder="${esc(ph)}" inputmode="${mode||'numeric'}" value="${esc(v)}" autocomplete="off">`}
function runExtras(d){const p=P(),r=p.run;if(!r)return '';let h=`<p class="mut">دونده: <b>${esc(nm(r.k))}</b> · ایستگاه ${fa(r.station||0)}${r.done?' · تمام شد':''} <span class="lock" data-live="lock3"></span> <span class="lock" data-live="lockCode"></span></p>`;
 if(d&&r.s2&&r.s2.phase==='input')h+=`<p class="mut">اتاق حافظه: الگوی دونده را بزنید (طلایی/ساده)</p><div class="grid" style="grid-template-columns:repeat(4,1fr)">${[0,1,2,3,4,5,6,7].map(i=>B('s2.toggle',(r.s2.input&&r.s2.input[i])?'🟡':'⚪',{i},(r.s2.input&&r.s2.input[i])?'gold':'')).join('')}</div>`;
 if(r.s2&&r.s2.n!=null&&r.s2.n<8)h+=`<p class="mut">بررسی قبلی: ${fa(r.s2.n)} از ۸</p>`;
 h+=`<div class="row" style="margin-top:8px">${inp('ans','جواب معما')}${B('s3.answer','ثبت جواب',{},'pri','data-in="ans:d"')}</div>`;
 if(d)h+=`<div class="row" style="margin-top:8px">${inp('code','رمز ۳ رقمی')}${B('code.enter','ثبت رمز',{},'gold','data-in="code:code"')}</div>`;
 return h}
function sdExtras(){const sd=P().cse&&P().cse.sd;if(!sd||!sd.on)return '';
 return `<p class="mut">مرگ ناگهانی · دور ${fa(sd.round||1)} · فاصلهٔ توکن تا مرکز (سانتی‌متر)</p>${['E','M'].map(k=>`<div class="row" style="margin-top:6px">${sd.res&&sd.res[k]?`<span>${esc(nm(k))}: ${sd.res[k].out?'بیرون':fa(sd.res[k].cm)+' سانت'}</span>`:inp('sd'+k,esc(nm(k))+' · سانتی‌متر','decimal')+B('sd.result','ثبت '+esc(nm(k)),{p:k},k,`data-in="sd${k}:cm"`)}</div>`).join('')}`}

/* ---------- new-game engine (v8-games) ---------- */
function v8gCard(){const g=P().v8g;if(!g)return '';const d=role==='DIRECTOR';const j=d||role==='JUDGE';if(!j)return '';
 let h=`<p class="mut">${esc(g.modeFa)}${g.limit?' · '+fa(g.limit)+' ثانیه':''}${g.rules&&g.rules.length?' · '+g.rules.map(esc).join(' · '):''}</p>`;
 if(d)h+=grid([g.run?B('v8g.stop','⏸ توقف'):B('v8g.start',g.result?'شروع دوباره':'▶ شروع',{},'pri')]);
 for(const k of ['E','M']){const N=esc(nm(k));let x=[];
  if(g.mode==='first'){x.push(g.finish&&g.finish[k]!=null?B('v8g.unfinish',`لغو تمام ${N} (${fa(g.finish[k])}ث)`,{k}):B('v8g.finish',`✓ ${N} تمام کرد`,{k},k));if(g.fallback)x.push(`<div class="row">${inp('pg'+k,'پیشرفت '+N)}${B('v8g.progress','ثبت',{k},'',`data-in="pg${k}:v"`)}</div>`)}
  if(g.mode==='points'){g.events.forEach(e=>x.push(B('v8g.ev',`${esc(e.label)} ${N} ${e.value>=0?'+':''}${fa(e.value)}${e.max!=null?` (${fa((g.counts[k]||{})[e.id]||0)}/${fa(e.max)})`:''}`,{k,id:e.id},k)));x.push(B('v8g.pop',`↶ ${N}`,{k}))}
  if(g.mode==='metric')x.push(`<div class="row">${inp('mt'+k,(g.metric.label||'نتیجه')+' '+N,'decimal')}${B('v8g.metric','ثبت',{k},k,`data-in="mt${k}:v"`)}</div>${g.metric[k]!=null?`<p class="mut">ثبت‌شده: ${fa(g.metric[k])}</p>`:''}`);
  if(g.mode==='judge')x.push(B('v8g.pick',`برنده ${N}`,{v:k},g.pick===k?'on '+k:k));
  g.penalties.forEach(pn=>x.push(B('v8g.pen',`${esc(pn.label)} ${N} ${fa(pn.value)}`,{k,id:pn.id},'bad')));
  h+=`<div style="margin-top:8px"><b style="color:${esc(col(k))}">${N}</b>${grid(x)}</div>`}
 if(g.mode==='judge')h+=grid([B('v8g.pick','تساوی',{v:'tie'},g.pick==='tie'?'on':''),B('v8g.pick','بدون برنده',{v:'none'},g.pick==='none'?'on':'')]);
 const aw=o=>Object.entries(o||{}).map(([k,v])=>`${esc(nm(k))} ${v>0?'+':''}${fa(v)}`).join(' · ')||'بدون امتیاز';
 h+=`<p>${g.result?'<b>ثبت شد:</b> '+esc(g.result.note)+' · '+aw(g.result.awards):'<span class="mut">پیش‌نمایش:</span> '+esc(g.preview.note)+' · '+aw(g.preview.awards)}</p>`;
 if(d)h+=grid([g.applied?B('v8g.revert','↶ برگرداندن امتیاز'):B('v8g.apply','✓ محاسبه و ثبت امتیاز',{},'ok')]);
 return card('بازی جدید · '+esc(g.title),h)}

/* ---------- views ---------- */
function viewDirector(){const p=P();let h=banks()+stateBar();
 if(p.gem&&p.gem.say)h+=card('جملهٔ بعدی جمنای',`<div class="gem">${esc(p.gem.say)}</div>${grid([B('gem.say','▶ TTS روی کامپیوتر',{},'pri')],1)}`);
 const sc=p.subsCfg||{};
 h+=card('',grid([p.v7on?B('state.next','مرحلهٔ بعد ◀',{},'ok'):B('v7.on','روشن کردن موتور V7',{on:true},'ok'),B('undo','↶ UNDO'+(p.undo?`<br><small class="mut">${esc(p.undo)}</small>`:'')),B('pause',p.paused?'▶ ادامه':'⏸ PAUSE'),B('sub.toggle',sc.on?'CC زیرنویس: روشن':'CC زیرنویس: خاموش',{},sc.on?'on':'')]));
 if(p.v7on){const a=acts(p.state,true);let x=grid(a);if(p.state==='RUN1'||p.state==='RUN2')x+=runExtras(true);if(p.state==='CASE')x+=sdExtras();
  h+=card('دکمه‌های این مرحله',x||'<p class="mut">با «مرحلهٔ بعد» جلو بروید.</p>')}
 h+=v8gCard();
 if(p.seg){const s=p.seg;h+=`<section class="card"><details ${p.v7on?'':'open'}><summary>بخش‌های قسمت (${fa(s.list.length)})${s.live>=0?' · روی آنتن: '+esc((s.list[s.live]||{}).t||''):''}</summary>
  ${grid([B('seg.prev','⏭ قبلی'),B('seg.toggle',s.playing&&s.live>=0?'⏸ مکث':'▶ پخش',{},'pri'),B('seg.next','بعدی ⏮',{},'ok'),B('seg.stop','■ توقف',{},'bad')])}
  <div class="row" style="margin-top:8px"><select class="in" data-k="segi" style="font-size:16px">${s.list.map((x,i)=>`<option value="${i}" ${i===(s.live>=0?s.live:s.sel)?'selected':''}>${fa(i+1)}. ${esc(x.t)}${x.game?' 🎮':''}</option>`).join('')}</select>${B('seg.go','برو',{},'','data-in="segi:i"')}</div></details></section>`}
 h+=`<section class="card"><details><summary>زیرنویس</summary>${grid(Object.keys(sc.spk||{}).map(k=>B('sub.spk',(sc.spk[k]?'✔ ':'✕ ')+esc(k),{k},sc.spk[k]?'on':'')))}
  <div class="row" style="margin-top:8px">${B('sub.cps','− کندتر',{d:-1})}<b class="num" style="text-align:center">${fa(sc.cps||15)} نویسه/ث</b>${B('sub.cps','+ تندتر',{d:1})}</div>
  ${grid(['all','word','typewriter','karaoke'].map(m=>B('sub.mode',{all:'یکجا',word:'کلمه‌به‌کلمه',typewriter:'تایپی',karaoke:'کارائوکه'}[m],{m},sc.mode===m?'on':'')))}</details></section>`;
 if(p.gfx!=null)h+=`<section class="card"><details><summary>سبک گرافیک: ${p.gfx==='broadcast'?'پخش':'واقعی'}</summary>${grid([B('gfx.style','واقعی (فعلی)',{v:'classic'},p.gfx!=='broadcast'?'on':''),B('gfx.style','پخش',{v:'broadcast'},p.gfx==='broadcast'?'on':'')])}</details></section>`;
 if(p.v7on&&p.states)h+=`<section class="card"><details><summary>پرش به مرحله</summary><div class="row"><select class="in" data-k="stj" style="font-size:16px">${p.states.map(([k,n])=>`<option value="${k}" ${k===p.state?'selected':''}>${esc(n)}</option>`).join('')}</select>${B('state.go','برو',{},'bad','data-in="stj:state"')}</div></details></section>`;
 return h}
function viewJudge(){const p=P();let h=banks()+stateBar();
 if(p.v7on){let x=grid(acts(p.state,false));if(p.state==='RUN1'||p.state==='RUN2')x+=runExtras(false);if(p.state==='CASE')x+=sdExtras();h+=card('داوری این مرحله',x||'<p class="mut">در این مرحله دکمهٔ داوری نیست.</p>')}
 h+=v8gCard();if(!h.includes('class="b'))h+=card('','<p class="mut">منتظر مرحلهٔ بعد…</p>');
 if(p.gem&&p.gem.say)h+=card('جمنای',`<div class="gem">${esc(p.gem.say)}</div>`);return h}
function viewPlayer(){const p=P(),k=me(),pv=R.priv||{};let h=banks()+stateBar();let main='';
 if(p.v7on&&(p.state==='R4_GLUE'||p.state==='GLUE_CHALLENGE')){const r=p.r4||{};const fin=r.fin&&r.fin[k]!=null;
  if(fin)main=`<div class="sealed"><b>ثبت شد ●</b><span class="mut">«تمام» تو رسید${r.valid&&r.valid[k]?' · معتبر ✔':' · منتظر داور'}</span></div>`;
  else if(!r.run)main=`<div class="sealed"><span class="mut">منتظر شروع راند ۴…</span></div>`;
  else main=B('r4.finish','تمام',{},'huge '+k,'data-lockfor="r4"')+`<p class="lock" style="text-align:center" data-live="r4lock"></p>`}
 else if(p.v7on&&p.state==='SHOP'){const sh=pv.shop||{};
  if(sh.sub)main=`<div class="sealed"><b>ثبت شد ●</b><span class="mut">انتخابت مهر شد. تا رونمایی هیچ‌کس آن را نمی‌بیند.</span></div>`;
  else{const av=sh.avail||{};const picks=sh.picks||[];main=`<p class="mut">حداکثر ۲ کارت، فقط یکی قرمز. انتخابت فقط روی همین گوشی دیده می‌شود.</p><div class="grid">${(p.cards||[]).map(c=>{const a=av[c.id]||{};const sel=picks.includes(c.id);
    return B('shop.pick',`<span class="ic">${c.icon}</span>${esc(c.fa)}<small>${a.price!=null?fa(a.price)+' ثانیه'+(a.tax?' (مالیات '+fa(a.tax)+')':''):''}${!a.ok&&!sel&&a.reason?' · '+esc(a.reason):''}</small>`,{card:c.id},`cardpick ${c.color} ${sel?'sel':''}`,(!a.ok&&!sel)?'disabled':'')}).join('')}</div>
    ${grid([B('shop.none','بدون کارت'),B('shop.submit',picks.length?`ثبت ${fa(picks.length)} کارت ●`:'ثبت (بدون کارت) ●',{},'ok','data-confirm="انتخاب مهر شود؟ بعد از ثبت عوض نمی‌شود."')])}`}}
 else if(p.v7on&&p.state==='RISK'){const rk=pv.risk||{};const lock=p.risk&&p.risk.lock&&p.risk.lock[k];const ord=(p.risk&&p.risk.order)||[];
  if(lock)main=`<div class="sealed"><b>قفل شد 🔒</b><span class="mut">شرط: ${rk.stake===30?'همه یا هیچ ۳۰':fa(rk.stake)+' ثانیه'}</span></div>`;
  else{const o=rk.options||{};const wait=ord[1]===k&&!(p.risk.lock||{})[ord[0]];
   main=`<p class="mut">${ord[0]===k?'تو اول اعلام می‌کنی (نفر عقب).':wait?'اول نفر عقب اعلام می‌کند؛ بعد نوبت توست.':''}</p>${grid(Object.entries(o).map(([s,x])=>B('risk.stake',x.allin?'همه یا هیچ · '+fa(s):fa(s)+' ثانیه',{stake:+s},(+rk.stake===+s?'on ':'')+(x.allin?'gold':''),x.ok?'':'disabled')))}
   ${rk.stake!=null?grid([B('risk.lock','🔒 قفل شرط',{},'ok',wait?'disabled':'')],1):''}`}}
 else if(p.v8g&&p.v8g.mode==='first'){const g=p.v8g;
  if(g.finish&&g.finish[k]!=null)main=`<div class="sealed"><b>ثبت شد ●</b><span class="mut">${fa(g.finish[k])} ثانیه</span></div>`;
  else if(!g.run)main=`<div class="sealed"><span class="mut">«${esc(g.title)}» · منتظر شروع…</span></div>`;
  else main=B('v8g.finish','تمام',{},'huge '+k)}
 else main=`<div class="sealed"><span class="mut">در این مرحله دکمه‌ای برای تو نیست. گوشی را روشن نگه دار.</span></div>`;
 h+=card(`<span style="color:${esc(col(k))}">${esc(nm(k))}</span>`,main);
 const e=p.effects&&p.effects[k];if(e&&(e.gloves||e.spicy||e.hint))h+=card('کارت‌های روی تو',`<p>${e.gloves?'🥊 دستکش بوکس در اتاق حافظه · ':''}${e.spicy?'🌶 معمای تند · ':''}${e.hint?'🔍 ذره‌بین'+(e.hintUsed?' (مصرف شد)':''):''}</p>`);
 return h}
function viewMonitor(){const p=P();return `<div class="mon">${banks()}<div class="st">${esc(p.v7on?(p.stateFa||''):(p.seg&&p.seg.live>=0?(p.seg.list[p.seg.live]||{}).t:''))}${p.paused?' · ⏸':''}</div><div class="tm num" data-live="timer"></div>${p.gem&&p.gem.say?`<div class="gem">${esc(p.gem.say)}</div>`:''}<div><span class="sync" data-live="sync"></span></div></div>`}

function header(){const rn=(ROLES.find(r=>r[0]===role)||[0,''])[1];
 return `<header class="top"><div class="bar"><span class="role">${esc(rn)}</span><span class="sync" data-live="sync">…</span><button class="iconbtn" data-ui="fs" title="تمام‌صفحه">⛶</button><button class="iconbtn" data-ui="role" title="تغییر نقش">⇄</button></div></header>`}
function setupView(){return `<main><section class="card"><h3>اتصال به کامپیوتر</h3><p class="mut">QR صفحهٔ «📱 حالت گوشی» اپ را اسکن کنید، یا اتاق و PIN را وارد کنید.</p>
 <div class="grid one"><input class="in" data-k="room" placeholder="اتاق (مثلاً K7QM)" value="${esc(room)}" autocapitalize="characters" dir="ltr"><input class="in num" data-k="pin" placeholder="PIN چهاررقمی" value="${esc(pin)}" inputmode="numeric" dir="ltr">${`<button class="b pri" data-ui="join">اتصال</button>`}</div></section></main>`}
function roleView(){return `<main><section class="card"><h3>این گوشی کدام نقش است؟ · اتاق ${esc(room)}</h3><div class="grid one">${ROLES.map(([r,n,d])=>`<button class="b" data-role="${r}">${n}<br><small class="mut">${d}</small></button>`).join('')}</div></section></main>`}

function render(){const app=$('#app');
 if(!room||!/^\d{4}$/.test(pin)){paint(app,setupView());return}
 if(!role){paint(app,roleView());return}
 document.body.classList.toggle('monitor',role==='MONITOR');
 let body;if(R.fatal)body=`<div class="offline"><b style="font-size:20px">اتصال متوقف شد</b><p>${esc(R.fatal)}</p><button class="b pri" data-ui="retry">تلاش دوباره</button><button class="b" data-ui="setup">وارد کردن اتاق/PIN</button></div>`;
 else if(!R.pub)body=`<div class="offline"><b style="font-size:20px">${R.open?(R.host?'در حال دریافت وضعیت…':'به سرور وصل شد · کامپیوتر آنلاین نیست'):'در حال اتصال به کامپیوتر…'}</b><p class="mut">اتاق ${esc(room)} · ${R.mode==='bc'?'همین دستگاه (بدون سرور)':'شبکهٔ محلی'}</p>${R.open?'':'<p class="mut">گوشی و کامپیوتر باید در یک Wi-Fi باشند و اپ روی کامپیوتر با server.js اجرا شده باشد.</p>'}</div>`;
 else body=(role==='MONITOR'?viewMonitor():`${header()}<main>${role==='DIRECTOR'?viewDirector():role==='JUDGE'?viewJudge():viewPlayer()}</main>`)+(!R.open||!R.host?`<div class="toast" style="top:calc(env(safe-area-inset-top) + 60px);bottom:auto">${R.open?'کامپیوتر آفلاین است · دکمه‌ها کار نمی‌کنند':'اتصال قطع شد · در حال اتصال دوباره…'}</div>`:'');
 paint(app,body)}
function paint(app,html){/* do not rebuild the DOM while the user is typing, and only when something visible changed (buttons stay under the finger) */
 const a=document.activeElement;if(a&&a.matches&&a.matches('input,select')&&app.contains(a)){R.dirty=true;return}
 if(html===R.html){live();return}R.html=html;app.innerHTML=html;live()}
function live(){const p=P();
 document.querySelectorAll('[data-live="sync"]').forEach(el=>{let t,c;if(!R.open){t='● قطع';c='bad'}else if(!R.host){t='● کامپیوتر آفلاین';c='bad'}else if(R.rtt==null){t='● SYNC …';c=''}else{const ms=Math.round(R.rtt);t=`● SYNC ${ms}ms`;c=ms>150?'slow':'ok'}if(R.mode==='bc'&&R.open&&R.host)t+=' · تب';el.textContent=t;el.className='sync '+c});
 document.querySelectorAll('[data-live="timer"]').forEach(el=>{const t=timerNow();el.textContent=t?mmss(t.v):'';el.classList.toggle('hot',!!(t&&t.hot))});
 const dt=Math.min(1,(performance.now()-R.rxAt)/1000);
 const k=me();document.querySelectorAll('[data-live="r4lock"]').forEach(el=>{const l=p.r4&&p.r4.lock?Math.max(0,(p.r4.lock[k]||0)-dt):0;el.textContent=l>0?`قفل ${fa(l.toFixed(1))} ثانیه`:'';const b=document.querySelector('[data-lockfor="r4"]');if(b)b.disabled=l>0});
 document.querySelectorAll('[data-live="lock3"]').forEach(el=>{const l=p.run?Math.max(0,p.run.lock3-dt):0;el.textContent=l>0?`معما قفل ${fa(l.toFixed(1))}`:''});
 document.querySelectorAll('[data-live="lockCode"]').forEach(el=>{const l=p.run?Math.max(0,p.run.lockCode-dt):0;el.textContent=l>0?`گاوصندوق قفل ${fa(l.toFixed(1))}`:''})}
setInterval(live,100);

/* ---------- input ---------- */
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.k)R.vals[t.dataset.k]=t.value});
document.addEventListener('focusout',()=>{setTimeout(()=>{if(R.dirty&&!(document.activeElement&&document.activeElement.matches('input,select'))){R.dirty=false;R.html='';render()}},50)});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.k)R.vals[t.dataset.k]=t.value});
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.role){role=b.dataset.role;R.html='';R.pub=null;await start();return}
 const ui=b.dataset.ui;
 if(ui==='join'){room=(R.vals.room||room||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);pin=en(R.vals.pin||pin||'').replace(/\D/g,'').slice(0,4);if(!/^[A-Z0-9]{4,8}$/.test(room)||!/^\d{4}$/.test(pin)){toast('اتاق یا PIN نامعتبر',true);return}role=localStorage.getItem('dm-rem-role-'+room)||'';setRoute();R.html='';if(role)await start();else render();return}
 if(ui==='role'){if(!confirm('نقش این گوشی عوض شود؟'))return;try{R.ws&&(R.ws.onclose=null,R.ws.close())}catch(err){}R.ws=null;R.open=false;R.pub=null;role='';localStorage.removeItem('dm-rem-role-'+room);setRoute();R.html='';render();return}
 if(ui==='fs'){try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen({navigationUI:'hide'})}catch(err){}wakeOn();return}
 if(ui==='retry'){R.fatal='';R.retry=0;R.html='';if(R.mode==='ws')connectWS();else await start();render();return}
 if(ui==='setup'){R.fatal='';try{R.ws&&(R.ws.onclose=null,R.ws.close())}catch(err){}room='';pin='';role='';R.pub=null;R.html='';render();return}
 const a=b.dataset.a;if(!a)return;let p={};try{p=JSON.parse(b.dataset.p||'{}')}catch(err){}
 if(b.dataset.in){const [key,field]=b.dataset.in.split(':');const el=document.querySelector(`[data-k="${key}"]`);const v=el?el.value:(R.vals[key]||'');
  if(String(v).trim()===''){toast('اول مقدار را وارد کنید',true);return}p[field]=field==='state'?v:en(v);if(field==='i')p.i=+p.i;
  if(el&&el.tagName==='INPUT'){el.value='';R.vals[key]=''}}
 if(b.dataset.confirm&&!confirm(b.dataset.confirm))return;
 send(a,p,b.dataset.l||a);wakeOn()});

if(room&&/^\d{4}$/.test(pin)&&role)start();else render();
})();
