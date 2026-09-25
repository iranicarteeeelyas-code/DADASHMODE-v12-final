/* DADASHMODE V8 · BMG · 8b · «استودیو گرافیک پخش» — broadcast graphics control (spec §9) + animation builder
   Preview (PVW) monitor · Program (PGM) monitor · template browser with the spec §4 catalogue · schema-generated data form ·
   Preview / TAKE / live update / hide / interrupt / queue / emphasis / alert / rollback / template actions · rundown (cue/take) ·
   preset lab (all 40 presets on a demo element) · live JSON console · motion tokens (tempo), brand, fps 60/30, safe guides, perf overlay. */
(function(){
'use strict';
if(typeof document==='undefined')return;
const B=window.BMG,E=B.engine;const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const faN=n=>B.fa(n);const toast=m=>{try{(0,eval)('toast')(m)}catch(e){console.log(m)}};const Pp=()=>{try{return (0,eval)('P')}catch(e){return null}};
let cur={template:'lowerThird',id:'lowerThird',data:null};let lab={id:'lowerThirdOn',el:B.el({a:1}),tl:null};let pvw=null,pgm=null,raf=0;

function mount(){if($('#view-bmg'))return;const tabs=$('#tabs');if(tabs&&!tabs.querySelector('[data-view="bmg"]')){const b=document.createElement('button');b.setAttribute('role','tab');b.dataset.view='bmg';b.setAttribute('aria-selected','false');b.textContent='استودیو گرافیک پخش';const ref=tabs.querySelector('[data-view="intro"]');tabs.insertBefore(b,ref?ref.nextSibling:null)}
 const sec=document.createElement('section');sec.id='view-bmg';sec.className='hidden';sec.innerHTML=`
 <div class="page bmg-page">
  <div class="page-head"><div><h1>استودیو گرافیک پخش</h1><p>سیستم گرافیک زندهٔ داده‌محور: قالب → نمونه → ماشین حالت → تایم‌لاین → رندرر. اول در «پیش‌نمایش» ببینید، بعد TAKE تا روی خروجی (ضبط) برود.</p></div>
   <div class="row bmg-style"><b>سبک گرافیک:</b><button class="btn" data-style="classic">واقعی (فعلی)</button><button class="btn" data-style="broadcast">پخش (Broadcast)</button></div></div>
  <div class="bmg-grid">
   <div class="block bmg-mon"><h2>پیش‌نمایش · PVW</h2><canvas id="bmgPvw" width="960" height="540"></canvas></div>
   <div class="block bmg-mon"><h2>خروجی · PGM <span class="muted">(همان بوم ضبط)</span></h2><canvas id="bmgPgm" width="960" height="540"></canvas><div id="bmgAir" class="muted"></div></div>
  </div>
  <div class="bmg-grid3">
   <div class="block"><h2>قالب‌ها</h2><div id="bmgTpls"></div><details><summary>پوشش فهرست کامل سند (بخش ۴)</summary><div id="bmgCat"></div></details></div>
   <div class="block"><h2>داده و کنترل</h2>
    <div class="row"><label class="f">شناسهٔ نمونه <input id="bmgId" style="width:140px"></label><label class="f">اولویت <input id="bmgPri" type="number" value="50" style="width:70px"></label><span id="bmgVer" class="muted"></span></div>
    <div id="bmgForm"></div>
    <div class="row wrap">
     <button class="btn" data-a="preview">پیش‌نمایش</button><button class="btn pri" data-a="take">TAKE ← خروجی</button><button class="btn" data-a="show">نمایش مستقیم</button><button class="btn" data-a="update">به‌روزرسانی زنده</button>
     <button class="btn" data-a="hide">خروج</button><button class="btn" data-a="interrupt">قطع فوری</button><button class="btn" data-a="queue">صف</button>
     <button class="btn" data-a="emphasis">تأکید</button><button class="btn" data-a="alert">هشدار</button><button class="btn" data-a="live">عادی</button><button class="btn" data-a="rollback">بازگشت (Rollback)</button><button class="btn" data-a="hideAll">خروج همه</button>
    </div><div id="bmgActs" class="row wrap"></div>
    <details><summary>کنسول JSON زنده (همان API برای کنترل از راه دور)</summary><textarea id="bmgJson" rows="4" style="width:100%;direction:ltr" placeholder='{"op":"update","id":"scorebug","data":{"E":{"score":60}}}'></textarea><button class="btn" data-a="json">ارسال</button>
     <p class="muted">از پنجرهٔ دیگر: <code>postMessage({bmg:{op:'show',id:'l3',template:'lowerThird',data:{title:'…'}}})</code> یا BroadcastChannel «dadashmode-bmg».</p></details>
   </div>
   <div class="block"><h2>ران‌داون (Cue / Take)</h2><div class="row wrap"><button class="btn pri" data-r="take">اجرای کیو بعدی ↵</button><button class="btn" data-r="add">افزودن همین</button><button class="btn" data-r="default">ران‌داون پیش‌فرض</button><button class="btn" data-r="export">خروجی JSON</button><button class="btn" data-r="import">ورود JSON</button></div><ol id="bmgRd"></ol></div>
  </div>
  <div class="bmg-grid3">
   <div class="block"><h2>آزمایشگاه پریست‌ها (۴۰ پریست)</h2><div class="row"><select id="bmgPreset"></select><button class="btn" data-l="play">اجرا در پیش‌نمایش</button><button class="btn" data-l="reverse">برعکس</button><button class="btn" data-l="pause">مکث/ادامه</button></div><input id="bmgSeek" type="range" min="0" max="1" step="0.001" value="0" style="width:100%"><p class="muted" id="bmgLabInfo"></p></div>
   <div class="block"><h2>توکن‌های حرکت و خروجی</h2>
    <label class="row">سرعت کلی (tempo) <input id="bmgTempo" type="range" min="0.6" max="1.6" step="0.05"> <b id="bmgTempoV"></b></label>
    <label class="row">برند <select id="bmgBrand"></select></label>
    <div class="row wrap"><label><input type="radio" name="bmgFps" value="60"> ۶۰ فریم</label><label><input type="radio" name="bmgFps" value="30"> ۳۰ فریم</label>
     <label><input type="checkbox" id="bmgGuides"> محدودهٔ امن</label><label><input type="checkbox" id="bmgPerf"> پنل عملکرد روی خروجی</label><label><input type="checkbox" id="bmgSafe"> حرکت امن روی خروجی (بدون فلش/لرزش شدید)</label></div>
    <h3>گرافیک خودکار در سبک پخش</h3><div class="row wrap" id="bmgAuto"></div></div>
   <div class="block"><h2>عیب‌یابی</h2><pre id="bmgDiag" class="bmg-pre"></pre><pre id="bmgLog" class="bmg-pre"></pre></div>
  </div>
 </div>`;
 (document.querySelector('main')||document.body).appendChild(sec);
 if(tabs)tabs.addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(!b)return;const on=b.dataset.view==='bmg';if(on){document.querySelectorAll('#tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));document.querySelectorAll('main>section').forEach(s=>s.classList.toggle('hidden',s.id!=='view-bmg'));start()}else stop()});
 const st=document.createElement('style');st.textContent=`.bmg-page canvas{width:100%;aspect-ratio:16/9;background:#05060c;border-radius:10px;display:block}.bmg-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bmg-grid3{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:12px;margin-top:12px}
 .bmg-pre{font:12px/1.5 ui-monospace,Consolas,monospace;direction:ltr;text-align:left;max-height:200px;overflow:auto;background:#0b0e1a;color:#cfe;padding:8px;border-radius:8px;white-space:pre-wrap}.bmg-page .wrap{flex-wrap:wrap;gap:6px}.bmg-tpl{display:block;width:100%;text-align:right;margin:2px 0}.bmg-tpl.on{outline:2px solid var(--accent,#ffd60a)}
 .bmg-cat{font-size:12px;margin:2px 0}.bmg-cat.nb{opacity:.5}#bmgRd li{margin:3px 0;padding:4px 6px;border-radius:6px}#bmgRd li.cur{background:rgba(255,214,10,.18)}.bmg-style .btn.on{background:var(--accent,#ffd60a);color:#000}
 @media(max-width:1100px){.bmg-grid,.bmg-grid3{grid-template-columns:1fr}}`;document.head.appendChild(st);
 bind();renderTpls();selectTpl('lowerThird');renderRd();syncSettings()}

/* ---------- template browser + schema form ---------- */
function renderTpls(){const g={general:'عمومی',gameshow:'مسابقه',sports:'ورزشی'};const L=B.templateList();$('#bmgTpls').innerHTML=Object.keys(g).map(c=>`<h3>${g[c]}</h3>`+L.filter(t=>t.category===c).map(t=>`<button class="btn bmg-tpl" data-t="${t.id}">${esc(t.fa||t.name)} <span class="muted">· ${esc(t.name)} · ${t.renderer}</span></button>`).join('')).join('');
 const cs=B.catalogStats();$('#bmgCat').innerHTML=`<p class="muted">${faN(cs.total)} نام در سند · ${faN(cs.templates)} قالب مستقل · ${faN(cs.variants)} نسخه/تنظیم از یک قالب · ساخته‌نشده: ${esc(cs.notBuilt.join('، ')||'—')}</p>`+Object.entries(B.CATALOG).map(([k,arr])=>arr.map(x=>`<div class="bmg-cat ${x.status==='not-built'?'nb':''}">${x.template?`<a href="#" data-cat='${esc(JSON.stringify({t:x.template,d:x.data}))}'>${esc(x.name)}</a>`:esc(x.name)} → ${x.template?esc(x.template):'ساخته نشده'}${x.status==='variant'?' (نسخه)':''}</div>`).join('')).join('')}
function selectTpl(id,data){const t=B.template(id);if(!t)return;cur.template=id;cur.id=id;cur.data=B.applySchema(t.dataSchema,data||{});$('#bmgId').value=id;$('#bmgPri').value=t.priority;$('#bmgVer').textContent=`${t.id}@${t.version} · ${t.renderer} · slot: ${t.slot||'—'}`;
 document.querySelectorAll('.bmg-tpl').forEach(b=>b.classList.toggle('on',b.dataset.t===id));renderForm(t);
 $('#bmgActs').innerHTML=Object.keys(t.actions||{}).map(a=>`<button class="btn" data-act="${a}">اکشن: ${esc(a)}</button>`).join('')}
function renderForm(t){const d=cur.data;$('#bmgForm').innerHTML=Object.entries(t.dataSchema).map(([k,f])=>{const v=d[k];const lab=esc(f.label||k);
  if(f.options)return `<label class="f">${lab} <select data-k="${k}">${f.options.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
  if(f.type==='bool')return `<label class="row"><input type="checkbox" data-k="${k}" ${v?'checked':''}> ${lab}</label>`;
  if(f.type==='number')return `<label class="f">${lab} <input data-k="${k}" type="number" step="any" value="${esc(v)}" style="width:110px"></label>`;
  if(f.type==='color')return `<label class="f">${lab} <input data-k="${k}" type="color" value="${esc(v||'#ff2e4d')}"></label>`;
  if(f.type==='list'||f.type==='object')return `<label class="f" style="display:block">${lab} <textarea data-k="${k}" data-json="1" rows="3" style="width:100%;direction:ltr">${esc(JSON.stringify(v))}</textarea></label>`;
  return `<label class="f">${lab} <input data-k="${k}" value="${esc(v)}" style="width:260px"></label>`}).join('')}
function readForm(){const d={};document.querySelectorAll('#bmgForm [data-k]').forEach(x=>{const k=x.dataset.k;if(x.type==='checkbox')d[k]=x.checked;else if(x.dataset.json){try{d[k]=JSON.parse(x.value)}catch(e){toast('JSON نامعتبر در '+k)}}else if(x.type==='number')d[k]=+x.value;else d[k]=x.value});return d}

/* ---------- actions ---------- */
function act(a){const id=$('#bmgId').value.trim()||cur.template;const data=readForm();const o={template:cur.template,priority:+$('#bmgPri').value||50};cur.data=data;
 try{switch(a){case 'preview':E.preview(id,data,Object.assign({replay:true,force:true},o));break;case 'take':if(!E.get(id,'PVW'))E.preview(id,data,o);E.take(id,{force:true});break;case 'show':E.show(id,data,o);break;case 'update':E.update(id,data);E.update(id,data,{channel:'PVW'});break;
  case 'hide':E.hide(id);break;case 'interrupt':E.interrupt(id);break;case 'queue':{const r=E.queue(id,data,o);toast(r&&r.queued?'در صف · نوبت '+faN(r.position):'نمایش داده شد');break}case 'emphasis':E.setState(id,'emphasis');break;case 'alert':E.setState(id,'alert');break;case 'live':E.setState(id,'live');break;
  case 'rollback':if(!E.rollback())toast('چیزی برای برگرداندن نیست');break;case 'hideAll':E.hideAll();break;
  case 'json':{const r=E.command($('#bmgJson').value);toast('اجرا شد');break}}}catch(e){toast('خطا: '+e.message)}}
/* ---------- rundown ---------- */
function rdSave(){const p=Pp();if(p){p.bmgRundown=E.rundown.items;try{(0,eval)('save')()}catch(e){}}try{localStorage.setItem('bmg-rundown',JSON.stringify(E.rundown.items))}catch(e){}}
function rdLoad(){const p=Pp();let items=p&&Array.isArray(p.bmgRundown)?p.bmgRundown:null;if(!items){try{items=JSON.parse(localStorage.getItem('bmg-rundown')||'null')}catch(e){}}E.rundownSet(items||B.defaultRundown())}
function renderRd(){const r=E.rundown;$('#bmgRd').innerHTML=r.items.map((x,i)=>`<li class="${i===r.pos?'cur':''}" data-i="${i}"><b>${esc(x.cue||'C'+(i+1))}</b> ${esc(x.action||'show')} · ${esc(x.id)}${x.template?' ('+esc(x.template)+')':''} ${x.note?'<span class="muted">· '+esc(x.note)+'</span>':''}
  <span style="float:left"><button class="btn sm" data-ri="cue">کیو</button><button class="btn sm" data-ri="up">▲</button><button class="btn sm" data-ri="del">✕</button></span></li>`).join('')||'<p class="muted">خالی</p>'}
function rd(a){const r=E.rundown;if(a==='take'){E.takeCue();renderRd();return}if(a==='add'){const id=$('#bmgId').value.trim()||cur.template;r.items.push({cue:'C'+(r.items.length+1),id,template:cur.template,action:'show',data:readForm(),note:''});rdSave();renderRd();return}
 if(a==='default'){E.rundownSet(B.defaultRundown());rdSave();renderRd();return}if(a==='export'){const t=JSON.stringify(r.items,null,1);navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>toast('در کلیپ‌بورد کپی شد'),()=>{});$('#bmgJson').value=t;return}
 if(a==='import'){try{const it=JSON.parse($('#bmgJson').value);E.rundownSet(Array.isArray(it)?it:it.items);rdSave();renderRd()}catch(e){toast('JSON ران‌داون نامعتبر')}}}
/* ---------- preset lab ---------- */
function labPlay(rev){const id=$('#bmgPreset').value;lab.id=id;if(lab.tl){lab.tl.kill()}const el=B.elReset(lab.el,{a:1});const tl=B.timeline({clock:B.clocks.PVW});const multi=['matchupReveal','leaderboardReorder','parallaxReveal','podiumReveal'].includes(id);const wr=id==='winnerReveal';
 lab.els=multi?[B.el({a:0}),B.el({a:0}),B.el({a:0})]:wr?{bg:B.el(),name:B.el(),sub:B.el(),rays:B.el()}:null;const target=lab.els||el;if(id==='leaderboardReorder'){lab.els.forEach((e,i)=>{e.a=1;e.y=i*90})}
 const o={at:0,ys:[180,0,90],toY:-90,x:960,y:540};B.preset(id,tl,target,o);lab.tl=tl;tl.play(B.clocks.PVW);if(rev){tl.seek(tl.totalDuration());tl.reverse()}$('#bmgLabInfo').textContent=`${B.PRESET_LABELS[id].label} · ${B.PRESET_LABELS[id].fa} · مدت ${tl.totalDuration().toFixed(2)} ثانیه`}
function drawLab(c){if(!lab.tl)return;const b=B.brand();const card=(e,x,y,label,col)=>B.fx(c,e,x,y,560,140,cc=>{B.K.panel(cc,-280,-70,560,140,{fill:b.panel2,fill2:b.panel,r:b.radius,elev:'e2',stroke:col||b.primary,strokeW:4});B.K.text(cc,label,0,0,{role:'display',size:60,color:b.ink});if(e.p>0&&e.p<1)B.K.ring(cc,0,0,e.p,{r1:300})},{glowColor:b.secondary,channel:'PVW'});
 if(lab.els&&Array.isArray(lab.els)){lab.els.forEach((e,i)=>card(e,960,360+(e.y||i*150)-(lab.id==='leaderboardReorder'?0:0),['اول','دوم','سوم'][i],[b.primary,b.accent,b.secondary][i]))}
 else if(lab.els){const e=lab.els;if(e.bg.a>0){c.save();c.globalAlpha=e.bg.a;c.fillStyle='#000';c.fillRect(0,0,1920,1080);c.restore()}card(e.name,960,500,'برنده!',b.gold);card(e.sub,960,700,'زیرعنوان',b.accent)}
 else{const e=lab.el;if(e.fill>0){c.fillStyle=b.secondary;c.fillRect(760,760-300*e.fill,400,300*e.fill)}card(e,960,540,B.PRESET_LABELS[lab.id].fa,b.primary);if(e.speed)B.K.text(c,'crawl speed '+e.speed.toFixed(2),960,700,{size:24,color:b.inkDim})}
 const s=$('#bmgSeek');if(s&&document.activeElement!==s)s.value=lab.tl.progress()}

/* ---------- monitors ---------- */
function frame(){raf=requestAnimationFrame(frame);if(!pvw)return;const c=pvw.getContext('2d');c.setTransform(1,0,0,1,0,0);c.fillStyle='#0a0d18';c.fillRect(0,0,pvw.width,pvw.height);const sc=pvw.width/1920;c.setTransform(sc,0,0,sc,0,0);
 c.fillStyle='#10152a';for(let x=0;x<1920;x+=120)for(let y=0;y<1080;y+=120)if(((x+y)/120)%2)c.fillRect(x,y,120,120);E.draw(c,'PVW',{gpu:false});drawLab(c);if(E.cfg.guides)B.K.safeGuides(c);
 const st=document.getElementById('stage');if(st&&pgm){const g=pgm.getContext('2d');g.drawImage(st,0,0,pgm.width,pgm.height)}}
let diagT=0;function slow(){if(!$('#view-bmg')||$('#view-bmg').classList.contains('hidden'))return;const d=E.diag();$('#bmgDiag').textContent=`fps ${d.fps.toFixed(1)} · avg ${d.avg.toFixed(2)}ms · p95 ${(d.p95||0).toFixed(1)} · dropped ${d.dropped} · quality L${d.level}\nBMG cost ${d.cost.toFixed(2)}ms (max ${(d.costMax||0).toFixed(2)})\ntimelines ${d.timelines} · PGM ${d.pgm} · PVW ${d.pvw} · queue ${d.queues}\nparticles ${d.particles} · cache ${d.cache}\n3D: ${JSON.stringify(B.three?B.three.info():{})}\nstats ${JSON.stringify(d.stats)}`;
 $('#bmgLog').textContent=E.log.slice(-14).map(x=>new Date(x.t).toLocaleTimeString()+' '+x.msg).reverse().join('\n');
 $('#bmgAir').innerHTML='روی آنتن: '+(E.onAir('PGM').map(x=>`<b>${esc(x.id)}</b> <span class="muted">${x.state}${x.transition?' · '+x.transition:''} · p${x.priority}</span>`).join(' · ')||'—')}
function start(){pvw=$('#bmgPvw');pgm=$('#bmgPgm');if(!raf)raf=requestAnimationFrame(frame);if(!diagT)diagT=setInterval(slow,300)}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;if(diagT)clearInterval(diagT);diagT=0}

/* ---------- settings ---------- */
function syncSettings(){const S=window.BMGB.S;document.querySelectorAll('[data-style]').forEach(b=>b.classList.toggle('on',b.dataset.style===S.style));$('#bmgTempo').value=S.tempo;$('#bmgTempoV').textContent=(+S.tempo).toFixed(2)+'×';
 $('#bmgBrand').innerHTML=Object.entries(B.BRANDS).map(([k,v])=>`<option value="${k}" ${k===S.brand?'selected':''}>${esc(v.name)}</option>`).join('');document.querySelectorAll('[name=bmgFps]').forEach(r=>r.checked=+r.value===+S.fps);
 $('#bmgGuides').checked=!!S.guides;$('#bmgPerf').checked=!!S.perf;$('#bmgSafe').checked=!!S.safeProgram;const AL={scorebug:'اسکوربورد',bug:'لوگو',stingers:'استینگر تغییر مرحله',intros:'معرفی مرحله',splashes:'اسپلش امتیاز',alerts:'هشدارها',winner:'برنده/گاوصندوق',reveal:'رونمایی بانک'};
 $('#bmgAuto').innerHTML=Object.keys(AL).map(k=>`<label><input type="checkbox" data-auto="${k}" ${S.auto[k]?'checked':''}> ${AL[k]}</label>`).join('');
 $('#bmgPreset').innerHTML=Object.keys(B.PRESETS).map(k=>`<option value="${k}">${esc(B.PRESET_LABELS[k].fa)} · ${esc(B.PRESET_LABELS[k].label)}</option>`).join('')}
function bind(){const root=$('#view-bmg');root.addEventListener('click',e=>{const t=e.target;const b=t.closest('button,a');if(!b)return;
  if(b.dataset.t){selectTpl(b.dataset.t);return}if(b.dataset.cat){e.preventDefault();const c=JSON.parse(b.dataset.cat);selectTpl(c.t,c.d);act('preview');return}
  if(b.dataset.a){act(b.dataset.a);return}if(b.dataset.act){const id=$('#bmgId').value.trim()||cur.template;E.trigger(id,b.dataset.act)||E.trigger(id,b.dataset.act,null,{channel:'PVW'});return}
  if(b.dataset.r){rd(b.dataset.r);return}if(b.dataset.ri){const i=+b.closest('li').dataset.i;const r=E.rundown;if(b.dataset.ri==='cue'){E.cue(i)}else if(b.dataset.ri==='up'&&i>0){const x=r.items.splice(i,1)[0];r.items.splice(i-1,0,x)}else if(b.dataset.ri==='del'){r.items.splice(i,1)}rdSave();renderRd();return}
  if(b.dataset.l){if(b.dataset.l==='play')labPlay(false);else if(b.dataset.l==='reverse'){if(lab.tl)lab.tl.reverse();else labPlay(true)}else if(lab.tl){lab.tl.state==='playing'?lab.tl.pause():lab.tl.resume()}return}
  if(b.dataset.style){window.BMGB.setStyle(b.dataset.style);syncSettings();toast(b.dataset.style==='broadcast'?'سبک پخش فعال شد':'سبک واقعی (فعلی) فعال شد')}});
 root.addEventListener('input',e=>{const t=e.target;const S=window.BMGB.S;if(t.id==='bmgTempo'){S.tempo=+t.value;$('#bmgTempoV').textContent=S.tempo.toFixed(2)+'×'}else if(t.id==='bmgSeek'&&lab.tl){lab.tl.pause();lab.tl.progress(+t.value);return}else return;window.BMGB.save();window.BMGB.apply()});
 root.addEventListener('change',e=>{const t=e.target;const S=window.BMGB.S;if(t.id==='bmgBrand')S.brand=t.value;else if(t.name==='bmgFps')S.fps=+t.value;else if(t.id==='bmgGuides')S.guides=t.checked;else if(t.id==='bmgPerf')S.perf=t.checked;else if(t.id==='bmgSafe')S.safeProgram=t.checked;else if(t.dataset.auto)S.auto[t.dataset.auto]=t.checked;else return;window.BMGB.save();window.BMGB.apply()});
 B.bus.on('bmg.rundown',()=>renderRd());addEventListener('keydown',e=>{if($('#view-bmg').classList.contains('hidden'))return;if(e.target.matches('input,textarea,select'))return;if(e.key==='Enter'&&!e.ctrlKey){e.preventDefault();e.stopImmediatePropagation();rd('take')}},true)}

const boot=()=>{if(!window.BMGB||!B.templatesLoaded)return setTimeout(boot,150);try{mount();rdLoad();renderRd()}catch(e){console.warn('[BMG studio]',e)}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
