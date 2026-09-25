/* DADASHMODE V8 · BMG · 5/8 · GRAPHIC TEMPLATES (spec §4, §10, §16)
   Every template = typed data schema + states + choreography (built only from presets/tokens) + a Canvas2D/GPU/3D draw.
   Template interface: {id, version, category, renderer, slot, layer, safeArea, priority, dataSchema, states, transitions, motionTokens,
                        accessibility, performanceProfile, init, enter, exit, update(U,inst,changed,prev), emphasis, alert, calm, actions, sim, draw}
   All coordinates are the 1920×1080 design space. RTL first: primary edge = right. Player keys follow the show engine: E = right, M = left. */
(function(root){
'use strict';
const B=root.BMG;const {clamp,lerp}=B.math;const P=B.PRESETS;
const br=()=>B.brand?B.brand():{primary:'#ff2e4d',secondary:'#ffd60a',accent:'#27e0ff',ink:'#fbf7ee',inkDim:'#b7bdd8',panel:'#0c1233',panel2:'#18215a',danger:'#ff2e4d',success:'#19e27a',gold:'#f5b82e',silver:'#c9d2e8',bronze:'#d38b4f',radius:18};
const K=()=>B.K;const fa=v=>B.fa(v);
const txt=(c,s,x,y,o)=>K().text(c,s,x,y,o||{});
const el=B.el;const now=()=>(root.performance?performance.now():Date.now())/1000;
const STD_STATES=['idle','preroll','entering','live','updating','emphasis','alert','exiting','hidden'];
const tpl=o=>B.registerTemplate(Object.assign({version:'1.0.0',renderer:'canvas2d',safeArea:'title',priority:50,states:STD_STATES,accessibility:{flash:false},performanceProfile:{cost:'low',particles:0}},o));
const player=(d,k)=>d[k]||{};
const crown=(c,x,y,s,col)=>{c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-22,10);c.lineTo(-26,-12);c.lineTo(-12,-2);c.lineTo(0,-18);c.lineTo(12,-2);c.lineTo(26,-12);c.lineTo(22,10);c.closePath();c.fillStyle=col;c.fill();c.fillRect(-22,12,44,6);c.restore()};

/* ======================= 1 · SCOREBUG (premium) · live-data, per-field update ======================= */
tpl({id:'scorebug',name:'Scorebug',fa:'اسکوربورد',category:'sports',slot:'top',layer:'top',priority:60,
 dataSchema:{E:{type:'object',default:{name:'الیاس',color:'#ff2738',score:45}},M:{type:'object',default:{name:'عماد',color:'#00c98d',score:45}},
  stage:{type:'string',default:'راند ۱',label:'مرحله'},clock:{type:'object',default:{remain:null,total:30,label:''}},unit:{type:'string',default:'ثانیه'},leader:{type:'string',default:''}},
 transitions:{enter:['scorebugBuild','slideIn'],exit:['slideOut','lowerThirdOff'],update:['scoreIncrement','scoreDecrement','numberRoll'],alert:['alertPulse']},
 init(i){i.els={root:el(),clock:el(),E:el(),M:el(),chipE:el(),chipM:el(),crown:el({a:0}),stage:el({a:1})};i.mem.shown={E:{from:null,to:null},M:{from:null,to:null}};i.mem.chip={E:'',M:''}},
 enter(tl,i){const e=i.els;['E','M'].forEach(k=>{const s=player(i.data,k).score;i.mem.shown[k]={from:s,to:s}});tl.set(e.root,{a:1});
  P.scorebugBuild(tl,e.clock,{});P.slideIn(tl,e.E,{from:'left',dist:B.T().dist('short'),at:'<+=0.12'});P.slideIn(tl,e.M,{from:'right',dist:B.T().dist('short'),at:'<+=0.06'});
  tl.to(e.crown,{a:i.data.leader?1:0},{dur:B.T().d('fast'),ease:'standard'});P.lightSweep(tl,e.clock,{at:'<'})},
 exit(tl,i){const e=i.els;P.slideOut(tl,e.E,{to:'left',dist:80});P.slideOut(tl,e.M,{to:'right',dist:80,at:'<'});tl.to(e.clock,{y:-120,a:0},{dur:B.T().d('fast'),ease:B.T().e('exit'),at:'<+=0.08'});tl.to(e.crown,{a:0},{dur:.1,at:'<'})},
 update(U,i,ch,prev){const e=i.els;
  ['E','M'].forEach(k=>{if(!ch.has(k+'.score'))return;const a=+player(prev,k).score||0,b=+player(i.data,k).score||0;const sh=i.mem.shown[k];const cur=sh.to==null?a:lerp(sh.from??a,sh.to,clamp(e[k].roll));i.mem.shown[k]={from:cur,to:b};
   const d=b-a;i.mem.chip[k]=(d>0?'+':'−')+fa(Math.abs(d));const tl=U.track('score'+k);(d>=0?P.scoreIncrement:P.scoreDecrement)(tl,e[k],{});
   const c=e['chip'+k];const t2=U.track('chip'+k);t2.set(c,{a:1,y:0,s:.6},0);t2.spring(c,{s:1},{spring:B.T().s('snappy')});t2.to(c,{y:74},{dur:B.T().d('slow'),ease:B.T().e('enter'),at:0});t2.to(c,{a:0},{dur:B.T().d('base'),ease:'sineIn',at:B.T().d('hold')*.55})});
  if(ch.has('stage')){const tl=U.track('stage');tl.fromTo(e.stage,{wipe:0},{wipe:1},{dur:B.T().d('base'),ease:B.T().e('enter')})}
  if(ch.has('leader')){const tl=U.track('crown');tl.to(e.crown,{a:0,s:.6},{dur:B.T().d('micro')});tl.set(e.crown,{a:i.data.leader?1:0});tl.spring(e.crown,{s:1},{spring:B.T().s('bouncy')})}
  /* clock ticks: nothing is rebuilt; the digits are simply redrawn (spec §5) */},
 alert(U,i){P.alertPulse(U.track('state'),i.els.clock,{n:2})},calm(U,i){U.track('state').to(i.els.clock,{s:1,glow:0},{dur:B.T().d('fast')})},
 sim(i){const c=i.data.clock||{};i.mem.danger=c.remain!=null&&c.remain<=10&&c.remain>0},
 draw(c,i){const e=i.els,d=i.data,b=br();if(e.root.a<=0)return;const Y=92;
  const plate=(k,cx)=>{const p=player(d,k);const col=p.color||(k==='E'?'#ff2738':'#00c98d');const w=440,h=96;const right=k==='E';
   B.fx(c,e[k],cx,Y,w,h,cc=>{K().panel(cc,-w/2,-h/2,w,h,{fill:b.panel2,fill2:b.panel,r:b.radius,elev:'e2',sheen:true});cc.save();K().rrect(cc,-w/2,-h/2,w,h,b.radius);cc.clip();
     const g=cc.createLinearGradient(right?w/2:-w/2,0,right?w/2-200:-w/2+200,0);g.addColorStop(0,B.rgba(col,.55));g.addColorStop(1,B.rgba(col,0));cc.fillStyle=g;cc.fillRect(-w/2,-h/2,w,h);cc.fillStyle=col;cc.fillRect(right?w/2-10:-w/2,-h/2,10,h);
     if(e[k].hl){cc.globalAlpha=Math.abs(e[k].hl)*.35;cc.fillStyle=e[k].hl>0?b.success:b.danger;cc.fillRect(-w/2,-h/2,w,h)}cc.restore();
     txt(cc,p.name||k,right?w/2-30:-w/2+30,-2,{size:36,role:'display',align:right?'right':'left',max:200,color:b.ink,shadow:{blur:8,y:2}});
     const sh=i.mem.shown[k];const val=+p.score||0;K().odometer(cc,sh.to??val,sh.from??val,clamp(e[k].roll),right?-w/2+92:w/2-92,2,{size:60,color:b.ink});
     txt(cc,d.unit||'',right?-w/2+92:w/2-92,38,{size:15,color:b.inkDim,weight:700})},{glowColor:col,channel:'PGM'});
   const cp=e['chip'+k];if(cp.a>0.01)B.fx(c,cp,cx+(right?-130:130),Y+40,120,54,cc=>{K().panel(cc,-60,-27,120,54,{fill:i.mem.chip[k][0]==='+'?b.success:b.danger,r:27,elev:'e1'});txt(cc,i.mem.chip[k],0,2,{role:'num',size:32,color:'#06101f'})});
   if(d.leader===k&&e.crown.a>0.01){c.save();c.globalAlpha*=e.crown.a;crown(c,cx+(right?160:-160),Y-58,1.05*e.crown.s,b.gold);c.restore()}};
  plate('E',1300);plate('M',620);
  const cw=250,chh=112;const danger=i.mem.danger;
  B.fx(c,e.clock,960,Y,cw,chh,cc=>{K().panel(cc,-cw/2,-chh/2,cw,chh,{fill:danger?B.mix(b.panel,b.danger,.35):b.panel,fill2:'#05070f',r:b.radius+4,elev:'e3',stroke:danger?b.danger:B.rgba(b.ink,.18),strokeW:3});
   cc.save();cc.globalAlpha*=e.stage.a;const sw=e.stage.wipe;cc.beginPath();cc.rect(cw/2-cw*sw,-chh/2,cw*sw,40);cc.clip();txt(cc,d.stage||'',0,-32,{size:22,color:b.secondary,max:cw-30,weight:900});cc.restore();
   const ck=d.clock||{};const v=ck.remain;const str=v==null?'—':v>=60?`${fa(Math.floor(v/60))}:${fa(String(Math.floor(v%60)).padStart(2,'0'))}`:(v<10?fa(Math.max(0,v).toFixed(1)):fa(Math.ceil(v)));
   txt(cc,str,0,12,{role:'num',size:50,color:danger?'#ffffff':b.ink});
   if(v!=null&&ck.total){const p=clamp(v/ck.total);cc.fillStyle=B.rgba(b.ink,.12);cc.fillRect(-cw/2+22,chh/2-14,cw-44,5);cc.fillStyle=danger?b.danger:b.secondary;cc.fillRect(cw/2-22-(cw-44)*p,chh/2-14,(cw-44)*p,5)}},{glowColor:b.danger,channel:'PGM'})}});

/* ======================= 2 · LOWER THIRD / NAME STRAP / LOCATION / QUOTE / OTS ======================= */
tpl({id:'lowerThird',name:'Lower Third',fa:'زیرنویس نام',category:'general',slot:'lower',layer:'lower',
 dataSchema:{title:{type:'string',default:'الیاس محمدی'},subtitle:{type:'string',default:'کارگردان و بازیکن'},color:{type:'color',default:''},variant:{type:'string',default:'name',options:['name','location','quote','ots']}},
 transitions:{enter:['lowerThirdOn','slideIn','lightSweep'],exit:['lowerThirdOff'],update:['lowerThirdOn(title only)']},
 init(i){i.els={accent:el(),bar:el(),title:el(),sub:el(),ots:el()}},
 enter(tl,i){const e=i.els;if(i.data.variant==='ots'){P.otsReveal(tl,e.ots,{});P.lightSweep(tl,e.ots,{at:'<+=0.2'});return}
  tl.set(e.accent,{a:1,sy:0});tl.to(e.accent,{sy:1},{dur:B.T().d('fast'),ease:B.T().e('enter')});P.lowerThirdOn(tl,e.bar,{at:'<+=0.06'});
  tl.set(e.title,{a:1,wipe:0},'<+=0.08');tl.to(e.title,{wipe:1},{dur:B.T().d('base'),ease:'quartOut'});P.slideIn(tl,e.sub,{from:'right',dist:B.T().dist('short'),at:'<+=0.1'})},
 exit(tl,i){const e=i.els;if(i.data.variant==='ots'){P.fullscreenExit(tl,e.ots,{});return}P.slideOut(tl,e.sub,{to:'right',dist:60});P.lowerThirdOff(tl,e.bar,{at:'<+=0.04'});tl.to(e.title,{a:0},{dur:B.T().d('fast'),at:'<'});tl.to(e.accent,{sy:0},{dur:B.T().d('fast'),ease:B.T().e('exit'),at:'<+=0.08'});tl.set(e.accent,{a:0})},
 update(U,i,ch){const e=i.els;if(ch.has('title')){const t=U.track('title');t.fromTo(e.title,{wipe:0},{wipe:1},{dur:B.T().d('base'),ease:'quartOut'})}if(ch.has('subtitle')){const t=U.track('sub');t.fromTo(e.sub,{x:40,a:0},{x:0,a:1},{dur:B.T().d('base'),ease:B.T().e('enter')})}},
 draw(c,i){const e=i.els,d=i.data,b=br();const col=d.color||b.primary;const R=1824,Y=846;const k=K();
  if(d.variant==='ots'){B.fx(c,e.ots,1500,300,560,330,cc=>{k.panel(cc,-280,-165,560,330,{fill:b.panel2,fill2:b.panel,r:b.radius,elev:'e3',stroke:B.rgba(col,.7),strokeW:4});cc.fillStyle=col;cc.fillRect(-280,95,560,70);txt(cc,d.title,0,-20,{role:'display',size:64,max:500});txt(cc,d.subtitle,0,130,{size:30,color:'#08101e',max:520})},{channel:'PGM'});return}
  c.font=k.font('display',54);const tw=Math.min(1100,Math.max(360,k.measure(c,d.title,k.font('display',54))+120));const sw=Math.min(tw,Math.max(260,k.measure(c,d.subtitle,k.font('ui',30))+80));
  B.fx(c,e.accent,R-8,Y,16,88,cc=>{cc.fillStyle=col;cc.fillRect(-8,-44*e.accent.sy,16,88*e.accent.sy)},{channel:'PGM'});
  B.fx(c,e.bar,R-24-tw/2,Y,tw,88,cc=>{k.panel(cc,-tw/2,-44,tw,88,{fill:b.panel2,fill2:b.panel,r:6,elev:'e2',sheen:true});if(d.variant==='location'){cc.fillStyle=col;cc.beginPath();cc.arc(tw/2-40,-8,14,Math.PI,0);cc.lineTo(tw/2-40,18);cc.closePath();cc.fill()}},{dir:'rtl',channel:'PGM'});
  const tx=R-24-(d.variant==='location'?74:40);B.fx(c,e.title,tx-tw/2+(d.variant==='location'?34:0)+tw/2,Y,tw,88,cc=>{txt(cc,d.variant==='quote'?'«'+d.title+'»':d.title,0,2,{role:'display',size:54,align:'right',color:b.ink,max:tw-80,shadow:{blur:6,y:2}})},{dir:'rtl',noBlur:true});
  B.fx(c,e.sub,R-24-sw/2-30,Y+70,sw,50,cc=>{k.panel(cc,-sw/2,-25,sw,50,{fill:col,r:4});txt(cc,d.subtitle,sw/2-24,2,{size:28,align:'right',color:'#08101e',max:sw-40,weight:800})},{channel:'PGM'})}});

/* ======================= 3 · CONTESTANT / PLAYER CARD ======================= */
tpl({id:'playerCard',name:'Player / Contestant Card',fa:'کارت بازیکن',category:'gameshow',slot:'side',layer:'side',
 dataSchema:{name:{type:'string',default:'عماد'},role:{type:'string',default:'مدافع تاج'},color:{type:'color',default:'#00c98d'},side:{type:'string',default:'M',options:['E','M','C']},
  stats:{type:'list',default:[['بانک','۴۵ ثانیه'],['نشان‌ها','۱'],['کارت','🛡 سپر']]},badge:{type:'string',default:''}},
 transitions:{enter:['playerCardReveal','lightSweep'],exit:['slideOut'],update:['numberPop']},
 init(i){i.els={card:el(),rows:[el(),el(),el(),el(),el(),el()]}},
 enter(tl,i){P.playerCardReveal(tl,i.els.card,{});const n=(i.data.stats||[]).length;tl.stagger(i.els.rows.slice(0,n),{a:1,x:0},{each:B.T().st('base'),dur:B.T().d('base'),ease:B.T().e('enter'),at:'<+=0.1'});i.els.rows.forEach(r=>{r.x=40})},
 exit(tl,i){P.slideOut(tl,i.els.card,{to:i.data.side==='E'?'right':'left',dist:B.T().dist('long')})},
 update(U,i,ch){if(ch.has('stats')){(i.data.stats||[]).forEach((r,j)=>{const o=(i.prev.stats||[])[j];if(JSON.stringify(o)!==JSON.stringify(r)){const t=U.track('row'+j);P.numberPop(t,i.els.rows[j],{});t.fromTo(i.els.rows[j],{hl:1},{hl:0},{dur:B.T().d('xslow'),at:0})}})}},
 draw(c,i){const e=i.els,d=i.data,b=br();const w=520,h=620;const cx=d.side==='E'?1500:d.side==='M'?420:960,cy=560;const k=K();
  B.fx(c,e.card,cx,cy,w,h,cc=>{k.panel(cc,-w/2,-h/2,w,h,{fill:b.panel2,fill2:b.panel,r:b.radius+6,elev:'e3'});cc.save();k.rrect(cc,-w/2,-h/2,w,h,b.radius+6);cc.clip();
    const g=cc.createLinearGradient(0,-h/2,0,-h/2+230);g.addColorStop(0,d.color);g.addColorStop(1,B.rgba(d.color,.15));cc.fillStyle=g;cc.fillRect(-w/2,-h/2,w,230);cc.restore();
    txt(cc,d.name,0,-h/2+110,{role:'display',size:96,max:w-60,shadow:{blur:14,y:4}});txt(cc,d.role,0,-h/2+190,{size:30,color:'#ffffff',weight:800,max:w-60});
    (d.stats||[]).slice(0,6).forEach((r,j)=>{const re=e.rows[j];const y=-h/2+280+j*74;cc.save();cc.globalAlpha*=re.a;cc.translate(re.x,0);
     if(re.hl){cc.fillStyle=B.rgba(d.color,.28*re.hl);cc.fillRect(-w/2+20,y-30,w-40,60)}cc.fillStyle=B.rgba(b.ink,.08);cc.fillRect(-w/2+30,y+30,w-60,2);
     txt(cc,r[0],w/2-40,y,{size:30,align:'right',color:b.inkDim,weight:700});cc.save();cc.translate(-w/2+40,y);cc.scale(re.s,re.s);txt(cc,r[1],0,0,{size:36,align:'left',color:b.ink,weight:900});cc.restore();cc.restore()});
    if(d.badge)txt(cc,d.badge,0,h/2-40,{size:26,color:b.gold,weight:900})},{channel:'PGM'})}});

/* ======================= 4 · MATCHUP / HEAD-TO-HEAD ======================= */
tpl({id:'matchup',name:'Matchup / Head-to-Head',fa:'رودررو',category:'gameshow',slot:'full',layer:'full',priority:55,
 dataSchema:{title:{type:'string',default:'رونمایی بانک'},E:{type:'object',default:{name:'الیاس',color:'#ff2738',score:65,tag:''}},M:{type:'object',default:{name:'عماد',color:'#00c98d',score:95,tag:''}},unit:{type:'string',default:'ثانیه'},note:{type:'string',default:''}},
 transitions:{enter:['fullscreenTakeover','matchupReveal'],exit:['fullscreenExit'],update:['numberRoll','numberPop']},
 init(i){i.els={bg:el(),E:el(),M:el(),vs:el(),title:el(),note:el()};i.mem.shown={E:{},M:{}}},
 enter(tl,i){const e=i.els;['E','M'].forEach(k=>{const s=+player(i.data,k).score||0;i.mem.shown[k]={from:s,to:s}});tl.set(e.bg,{a:0});tl.to(e.bg,{a:.82},{dur:B.T().d('base'),ease:'sineOut'});
  P.matchupReveal(tl,[e.E,e.M,e.vs],{at:'<'});P.lowerThirdOn(tl,e.title,{at:'<+=0.2'});if(i.data.note)P.slideIn(tl,e.note,{at:'>'})},
 exit(tl,i){const e=i.els;P.slideOut(tl,e.E,{to:'right',dist:500});P.slideOut(tl,e.M,{to:'left',dist:500,at:'<'});tl.to(e.vs,{a:0},{dur:.12,at:'<'});tl.to(e.title,{a:0},{dur:.12,at:'<'});tl.to(e.note,{a:0},{dur:.12,at:'<'});tl.to(e.bg,{a:0},{dur:B.T().d('fast'),at:'<+=0.1'})},
 update(U,i,ch,prev){['E','M'].forEach(k=>{if(!ch.has(k+'.score'))return;const a=+player(prev,k).score||0,b=+player(i.data,k).score||0;i.mem.shown[k]={from:a,to:b};const t=U.track('s'+k);P.numberRoll(t,i.els[k],{});P.numberPop(t,i.els[k],{at:'<'})});
  if(ch.has('note')){const t=U.track('note');t.fromTo(i.els.note,{a:0,x:40},{a:1,x:0},{dur:B.T().d('base'),ease:B.T().e('enter')})}},
 draw(c,i){const e=i.els,d=i.data,b=br();const k=K();if(e.bg.a>0){c.save();c.globalAlpha*=e.bg.a;c.fillStyle='#04060f';c.fillRect(0,0,1920,1080);k.vignette(c,.6);c.restore()}
  B.fx(c,e.title,960,232,900,90,cc=>{txt(cc,d.title,0,0,{role:'display',size:74,color:b.secondary,max:880,shadow:{blur:18,y:4}})},{dir:'center'});
  ['E','M'].forEach(key=>{const p=player(d,key);const cx=key==='E'?1400:520;const w=700,h=470;B.fx(c,e[key],cx,560,w,h,cc=>{k.panel(cc,-w/2,-h/2,w,h,{fill:b.panel2,fill2:b.panel,r:b.radius+8,elev:'e3',stroke:p.color,strokeW:6,sheen:true});
    txt(cc,p.name,0,-120,{role:'display',size:110,color:p.color,max:w-80,shadow:{blur:14,y:4}});const sh=i.mem.shown[key];const v=+p.score||0;
    cc.save();cc.translate(0,40);cc.scale(e[key].s,e[key].s);k.odometer(cc,sh.to??v,sh.from??v,clamp(e[key].roll),0,0,{size:170,color:b.ink});cc.restore();txt(cc,d.unit,0,160,{size:32,color:b.inkDim,weight:700});if(p.tag)txt(cc,p.tag,0,-h/2+36,{size:24,color:b.secondary,weight:900})},{glowColor:p.color,channel:'PGM'})});
  B.fx(c,e.vs,960,560,220,220,cc=>{cc.fillStyle=b.secondary;cc.beginPath();cc.arc(0,0,92,0,Math.PI*2);cc.fill();txt(cc,'VS',0,6,{role:'num',size:88,color:'#0b0f1f'})},{channel:'PGM'});
  if(d.note)B.fx(c,e.note,960,890,1100,70,cc=>{k.panel(cc,-550,-35,1100,70,{fill:B.rgba(b.panel,.92),r:35});txt(cc,d.note,0,2,{size:32,color:b.ink,max:1040})})}});

/* ======================= 5 · COUNTDOWN / BUZZER TIMER ======================= */
tpl({id:'countdown',name:'Countdown',fa:'شمارش معکوس',category:'gameshow',slot:'center',layer:'side',
 dataSchema:{remain:{type:'number',default:10},total:{type:'number',default:10},label:{type:'string',default:'وقت'},danger:{type:'number',default:5}},
 transitions:{enter:['countdownStart'],exit:['fullscreenExit'],update:['countdownTick'],alert:['alertPulse']},
 init(i){i.els={ring:el(),num:el()};i.mem.sec=null},
 enter(tl,i){P.countdownStart(tl,i.els.ring,{});P.numberPop(tl,i.els.num,{at:'<'});tl.set(i.els.num,{a:1},'<');i.mem.sec=Math.ceil(i.data.remain)},
 exit(tl,i){P.fullscreenExit(tl,i.els.ring,{});tl.to(i.els.num,{a:0},{dur:.15,at:'<'})},
 update(U,i,ch){if(ch.has('remain')){const s=Math.ceil(i.data.remain);if(s!==i.mem.sec){i.mem.sec=s;P.countdownTick(U.track('tick'),i.els.num,{});if(s<=i.data.danger&&s>0)P.alertPulse(U.track('ring'),i.els.ring,{n:1})}}},
 draw(c,i){const e=i.els,d=i.data,b=br();const cx=960,cy=540,r=190;const danger=d.remain<=d.danger;const col=danger?b.danger:b.secondary;
  B.fx(c,e.ring,cx,cy,r*2+80,r*2+80,cc=>{cc.fillStyle=B.rgba(b.panel,.9);cc.beginPath();cc.arc(0,0,r+26,0,Math.PI*2);cc.fill();cc.lineWidth=22;cc.lineCap='round';cc.strokeStyle=B.rgba(b.ink,.12);cc.beginPath();cc.arc(0,0,r,0,Math.PI*2);cc.stroke();
    const p=clamp(d.total?d.remain/d.total:0);cc.strokeStyle=col;cc.beginPath();cc.arc(0,0,r,-Math.PI/2,-Math.PI/2-Math.PI*2*p,true);cc.stroke();txt(cc,d.label,0,-r*.55,{size:34,color:b.inkDim,weight:800})},{glowColor:col,channel:'PGM'});
  B.fx(c,e.num,cx,cy+18,300,220,cc=>{txt(cc,d.remain<10?fa(Math.max(0,d.remain).toFixed(1)):fa(Math.ceil(d.remain)),0,0,{role:'num',size:150,color:danger?'#ffffff':b.ink,glow:danger?b.danger:null})},{glowColor:col})}});

/* ======================= 6 · DYNAMIC / DRAMATIC NUMBER REVEAL ======================= */
tpl({id:'numberReveal',name:'Dramatic Number Reveal',fa:'رونمایی عدد',category:'gameshow',slot:'center',layer:'side',
 dataSchema:{label:{type:'string',default:'بانک نهایی'},value:{type:'number',default:85},unit:{type:'string',default:'ثانیه'},color:{type:'color',default:''}},
 transitions:{enter:['glassReveal','dramaticNumber'],exit:['fullscreenExit'],update:['numberRoll','numberPop']},
 init(i){i.els={panel:el(),num:el(),label:el()};i.mem.from=null},
 enter(tl,i){P.glassReveal(tl,i.els.panel,{});P.lowerThirdOn(tl,i.els.label,{at:'<+=0.15'});P.dramaticNumber(tl,i.els.num,{at:'<'});i.mem.from=null},
 exit(tl,i){P.fullscreenExit(tl,i.els.panel,{});tl.to(i.els.num,{a:0},{dur:.15,at:'<'});tl.to(i.els.label,{a:0},{dur:.15,at:'<'})},
 update(U,i,ch,prev){if(ch.has('value')){i.mem.from=+prev.value||0;const t=U.track('v');t.fromTo(i.els.num,{roll:0},{roll:1},{dur:B.T().d('slow'),ease:'expoOut'});P.numberPop(t,i.els.num,{at:'<'})}},
 draw(c,i){const e=i.els,d=i.data,b=br();const col=d.color||b.secondary;const w=760,h=420;
  B.fx(c,e.panel,960,540,w,h,cc=>{K().panel(cc,-w/2,-h/2,w,h,{fill:B.rgba(b.panel2,.92),fill2:B.rgba(b.panel,.96),r:b.radius+10,elev:'e3',stroke:B.rgba(col,.6),strokeW:3,sheen:true})});
  B.fx(c,e.label,960,400,w-80,60,cc=>{txt(cc,d.label,0,0,{size:40,color:col,weight:900,max:w-100})},{dir:'center'});
  B.fx(c,e.num,960,560,w,220,cc=>{if(i.mem.from==null&&e.num.p<1)K().slot(cc,d.value,e.num.p,0,0,{size:170,color:b.ink});else K().odometer(cc,d.value,i.mem.from??d.value,clamp(e.num.roll),0,0,{size:170,color:b.ink});txt(cc,d.unit,0,120,{size:34,color:b.inkDim,weight:700})},{glowColor:col})}});

/* ======================= 7 · PROGRESS / RANK / JACKPOT METER ======================= */
tpl({id:'progressMeter',name:'Progress / Jackpot Meter',fa:'نوار پیشرفت',category:'gameshow',slot:'meter',layer:'side',
 dataSchema:{label:{type:'string',default:'سقف فاصله'},value:{type:'number',default:18},max:{type:'number',default:30},color:{type:'color',default:''},markers:{type:'list',default:[20,30]},unit:{type:'string',default:'ثانیه'},style:{type:'string',default:'bar',options:['bar','jackpot']}},
 transitions:{enter:['slideIn','podiumReveal(fill)'],exit:['slideOut'],update:['fill spring','numberRoll']},
 init(i){i.els={panel:el(),bar:el(),num:el()};i.mem.from=null},
 enter(tl,i){P.slideIn(tl,i.els.panel,{from:'right'});tl.set(i.els.bar,{a:1,fill:0});tl.to(i.els.bar,{fill:clamp(i.data.value/i.data.max)},{dur:B.T().d('slow'),ease:'settle',at:'<+=0.15'});tl.set(i.els.num,{a:1},'<')},
 exit(tl,i){P.slideOut(tl,i.els.panel,{to:'right'});tl.to(i.els.bar,{a:0},{dur:.12,at:'<'});tl.to(i.els.num,{a:0},{dur:.12,at:'<'})},
 update(U,i,ch,prev){if(ch.has('value')||ch.has('max')){i.mem.from=+prev.value||0;const t=U.track('fill');t.spring(i.els.bar,{fill:clamp(i.data.value/i.data.max)},{spring:B.T().s('gentle')});t.fromTo(i.els.num,{roll:0},{roll:1},{dur:B.T().d('slow'),ease:'expoOut',at:0});if(i.data.style==='jackpot')P.lightSweep(t,i.els.panel,{at:0})}},
 sim(i){if(i.data.style==='jackpot'&&i.state==='live'){const p=(now()*.35)%1;i.els.panel.sweep=p<.999?p:0}},
 draw(c,i){const e=i.els,d=i.data,b=br();const col=d.color||b.secondary;const w=940,h=96,cx=960,cy=212;
  B.fx(c,e.panel,cx,cy,w,h,cc=>{K().panel(cc,-w/2,-h/2,w,h,{fill:b.panel2,fill2:b.panel,r:h/2,elev:'e2'});txt(cc,d.label,w/2-36,-16,{size:26,align:'right',color:b.inkDim,weight:800});
    const bx=-w/2+150,bw=w-190,by=14;cc.fillStyle=B.rgba(b.ink,.1);K().rrect(cc,bx,by-9,bw,18,9);cc.fill();const f=clamp(e.bar.fill);
    if(f>0){const g=cc.createLinearGradient(bx+bw,0,bx+bw-bw*f,0);g.addColorStop(0,col);g.addColorStop(1,B.mix(col,'#ffffff',.35));cc.fillStyle=g;K().rrect(cc,bx+bw-bw*f,by-9,bw*f,18,9);cc.fill()}
    (d.markers||[]).forEach(m=>{const x=bx+bw-bw*clamp(m/d.max);cc.fillStyle=b.ink;cc.fillRect(x-1.5,by-18,3,36);txt(cc,fa(m),x,by+30,{size:16,color:b.inkDim})});
    const v=K();v.odometer(cc,d.value,i.mem.from??d.value,clamp(e.num.roll),-w/2+78,0,{size:44,color:b.ink})},{glowColor:col,channel:'PGM'})}});

/* ======================= 8 · LEADERBOARD / STANDINGS · rank-change animates only the moved rows ======================= */
tpl({id:'leaderboard',name:'Leaderboard',fa:'جدول رده‌بندی',category:'sports',slot:'side',layer:'side',
 dataSchema:{title:{type:'string',default:'نشان‌های تاج'},rows:{type:'list',default:[{name:'الیاس',score:3,color:'#ff2738'},{name:'عماد',score:2,color:'#00c98d'},{name:'جمنای',score:1,color:'#27e0ff'}]},unit:{type:'string',default:''}},
 transitions:{enter:['slideIn','stagger'],exit:['slideOut'],update:['rankUp','rankDown','leaderboardReorder','numberRoll']},
 init(i){i.els={panel:el()};i.mem.rows={}},
 rowY:j=>-150+j*86,
 sorted(d){return (d.rows||[]).slice().sort((a,b)=>(+b.score||0)-(+a.score||0))},
 enter(tl,i){const t=B.template('leaderboard');P.slideIn(tl,i.els.panel,{from:'right'});const rs=t.sorted(i.data);i.mem.rows={};
  rs.forEach((r,j)=>{const e=el({y:t.rowY(j),x:60});i.mem.rows[r.name]={el:e,from:+r.score||0,to:+r.score||0,rank:j}});
  tl.stagger(rs.map(r=>i.mem.rows[r.name].el),{a:1,x:0},{each:B.T().st('base'),dur:B.T().d('base'),ease:B.T().e('enter'),at:'<+=0.1'})},
 exit(tl,i){P.slideOut(tl,i.els.panel,{to:'right'});Object.values(i.mem.rows).forEach(r=>tl.to(r.el,{a:0},{dur:.12,at:'<'}))},
 update(U,i,ch,prev){if(!ch.has('rows'))return;const t=B.template('leaderboard');const rs=t.sorted(i.data);const old=i.mem.rows;const next={};
  rs.forEach((r,j)=>{let m=old[r.name];if(!m){m={el:el({y:t.rowY(j),x:60}),from:+r.score||0,to:+r.score||0,rank:j};const tr=U.track('new:'+r.name);tr.to(m.el,{a:1,x:0},{dur:B.T().d('base'),ease:B.T().e('enter')})}
   const sc=+r.score||0;if(sc!==m.to){m.from=m.to;m.to=sc;const tr=U.track('sc:'+r.name);P.numberRoll(tr,m.el,{})}
   if(j!==m.rank){const tr=U.track('rk:'+r.name);(j<m.rank?P.rankUp:P.rankDown)(tr,m.el,{toY:t.rowY(j)});m.rank=j}next[r.name]=m});
  for(const n in old)if(!next[n]){const tr=U.track('gone:'+n);tr.to(old[n].el,{a:0,x:60},{dur:B.T().d('fast'),ease:B.T().e('exit')});next[n]=Object.assign(old[n],{gone:true,rank:99})}
  i.mem.rows=next},
 draw(c,i){const e=i.els,d=i.data,b=br();const w=440,h=440,cx=1600,cy=560;
  B.fx(c,e.panel,cx,cy,w,h,cc=>{K().panel(cc,-w/2,-h/2,w,h,{fill:b.panel2,fill2:b.panel,r:b.radius,elev:'e3'});cc.fillStyle=b.primary;cc.fillRect(-w/2,-h/2,w,64);txt(cc,d.title,w/2-24,-h/2+33,{role:'display',size:36,align:'right',max:w-48});
    const rows=Object.entries(i.mem.rows).sort((a,z)=>a[1].rank-z[1].rank);rows.forEach(([name,m],j)=>{const re=m.el;if(re.a<=0.01)return;const r=(d.rows||[]).find(x=>x.name===name)||{};cc.save();cc.globalAlpha*=re.a;cc.translate(re.x,re.y+40);cc.scale(re.s,re.s);
     K().panel(cc,-w/2+16,-36,w-32,72,{fill:re.hl?B.mix(b.panel,re.hl>0?b.success:b.danger,Math.abs(re.hl)*.45):B.rgba(b.ink,.05),r:10});cc.fillStyle=r.color||b.accent;cc.fillRect(w/2-26,-36,10,72);
     txt(cc,fa(m.rank+1),w/2-54,2,{role:'num',size:30,color:m.rank===0?b.gold:b.inkDim});txt(cc,name,w/2-90,2,{size:32,align:'right',weight:900,max:200});K().odometer(cc,m.to,m.from,clamp(re.roll),-w/2+70,2,{size:36,color:b.ink});cc.restore()})},{channel:'PGM'})}});

/* ======================= 9 · FULLSCREEN WINNER REVEAL (suspense → reveal → celebration) ======================= */
tpl({id:'winnerReveal',name:'Winner Reveal',fa:'رونمایی برنده',category:'gameshow',slot:'full',layer:'full',priority:80,accessibility:{flash:true},performanceProfile:{cost:'high',particles:600},
 dataSchema:{name:{type:'string',default:'الیاس'},color:{type:'color',default:'#ff2738'},kicker:{type:'string',default:'برندهٔ کیف طلایی'},subtitle:{type:'string',default:'گاوصندوق در ۱۲٫۴ ثانیه باز شد'},confetti:{type:'bool',default:true}},
 transitions:{enter:['winnerReveal','suspenseReveal','confetti'],exit:['fullscreenExit']},
 init(i){i.els={bg:el(),name:el(),sub:el(),rays:el(),kicker:el()}},
 enter(tl,i){const e=i.els;P.slideIn(tl,e.kicker,{from:'right',dist:80});P.winnerReveal(tl,{bg:e.bg,name:e.name,sub:e.sub,rays:e.rays},{at:0});if(i.data.confetti)P.confetti(tl,e.name,{at:'reveal',y:420});P.impactBurst(tl,e.name,{at:'reveal',y:520,x:960})},
 exit(tl,i){const e=i.els;P.fullscreenExit(tl,e.name,{});tl.to(e.sub,{a:0},{dur:.15,at:'<'});tl.to(e.kicker,{a:0},{dur:.15,at:'<'});tl.to(e.rays,{a:0},{dur:.15,at:'<'});tl.to(e.bg,{a:0},{dur:B.T().d('base'),at:'<+=0.1'})},
 sim(i){if(i.state==='live'){i.els.rays.p=.35+.05*Math.sin(now()*.8)}},
 draw(c,i){const e=i.els,d=i.data,b=br();const k=K();if(e.bg.a>0){c.save();c.globalAlpha*=e.bg.a;const g=c.createRadialGradient(960,520,60,960,540,1100);g.addColorStop(0,B.mix(d.color,'#000',.55));g.addColorStop(1,'#020308');c.fillStyle=g;c.fillRect(0,0,1920,1080);c.restore()}
  if(e.rays.a>0){c.save();c.globalAlpha*=e.rays.a*.55;c.translate(960,520);c.rotate(now()*.05);const n=20;for(let j=0;j<n;j++){c.rotate(Math.PI*2/n);const g=c.createLinearGradient(0,0,0,-1100);g.addColorStop(0,B.rgba(b.gold,.55));g.addColorStop(1,B.rgba(b.gold,0));c.fillStyle=g;c.beginPath();c.moveTo(-18,0);c.lineTo(-90*Math.min(1,e.rays.p*3),-1100);c.lineTo(90*Math.min(1,e.rays.p*3),-1100);c.lineTo(18,0);c.fill()}c.restore()}
  B.fx(c,e.kicker,960,250,900,80,cc=>{txt(cc,d.kicker,0,0,{size:44,color:b.secondary,weight:900,max:880})});
  B.fx(c,e.name,960,520,1500,300,cc=>{crown(cc,0,-170,2.4,b.gold);txt(cc,d.name,0,20,{role:'display',size:230,color:'#ffffff',max:1450,glow:d.color,glowBlur:60,stroke:B.mix(d.color,'#000',.3),strokeW:10})},{channel:'PGM'});
  B.fx(c,e.sub,960,760,1200,80,cc=>{k.panel(cc,-600,-40,1200,80,{fill:B.rgba(b.panel,.9),r:40});txt(cc,d.subtitle,0,2,{size:36,color:b.ink,max:1150})},{dir:'center'})}});

/* ======================= 10 · CELEBRATION (GPU particles) ======================= */
tpl({id:'celebration',name:'Confetti Celebration',fa:'جشن',category:'gameshow',renderer:'gpu2d',slot:null,layer:'fx',autoHide:2.8,performanceProfile:{cost:'medium',particles:500},
 dataSchema:{kind:{type:'string',default:'cannons',options:['cannons','burst','stars','coins','rain']},x:{type:'number',default:960},y:{type:'number',default:520},text:{type:'string',default:''}},
 transitions:{enter:['confetti','particleBurst']},
 init(i){i.els={t:el()}},
 enter(tl,i){const d=i.data;tl.call(()=>{if(B.gpu)B.gpu.emit(d.kind,{x:d.x,y:d.y})});if(d.text){tl.set(i.els.t,{a:1});P.goalSplash(tl,i.els.t,{x:d.x,y:d.y})}else tl.wait(.01)},
 exit(tl,i){tl.to(i.els.t,{a:0},{dur:B.T().d('fast')})},
 draw(c,i){if(i.data.text)B.fx(c,i.els.t,i.data.x,i.data.y,900,220,cc=>txt(cc,i.data.text,0,0,{role:'display',size:140,color:br().secondary,glow:br().primary}))}});

/* ======================= 11 · STINGER / WIPE / DVE TRANSITION ======================= */
tpl({id:'stinger',name:'Stinger Transition',fa:'استینگر',category:'general',slot:'transition',layer:'transition',priority:90,
 dataSchema:{label:{type:'string',default:'DADASHMODE'},style:{type:'string',default:'slabs',options:['slabs','wipe','dve']},sub:{type:'string',default:''}},
 transitions:{enter:['stinger'],exit:['(auto)']},
 init(i){i.els={s:el()}},
 enter(tl,i){P.stinger(tl,i.els.s,{id:i.instanceId})},exit(tl,i){tl.set(i.els.s,{a:0})},
 onHidden(i){i.els.s.p=0},autoHide:.01,
 draw(c,i){const e=i.els.s,d=i.data,b=br();if(e.a<=0)return;const p=e.p;const k=K();const cover=1-Math.abs(p-.5)*2;/* 0 → 1 (covered) → 0 */
  if(d.style==='dve'){const s=p<.5?1-B.easings.quintInOut(p*2)*.35:1-.35*(1-B.easings.quintInOut((p-.5)*2));c.save();c.globalAlpha=cover;c.fillStyle=b.panel;c.fillRect(0,0,1920,1080);c.restore();c.save();c.translate(960,540);c.scale(s,s);c.globalAlpha=cover;txt(c,d.label,0,0,{role:'display',size:180,color:b.secondary});c.restore();return}
  const cols=[b.primary,b.secondary,b.accent,b.panel];c.save();for(let j=0;j<4;j++){const lag=j*.06;const q=clamp((p-lag)/(1-.18));const x=lerp(2400,-2400,B.easings.quintInOut(q));c.fillStyle=cols[j];c.beginPath();c.moveTo(x+j*120,0);c.lineTo(x+j*120+2200,0);c.lineTo(x+j*120+1700,1080);c.lineTo(x+j*120-500,1080);c.closePath();c.fill()}
  if(cover>.55){c.globalAlpha=clamp((cover-.55)/.3);txt(c,d.label,960,520,{role:'display',size:170,color:'#0b0f1f',stroke:'#ffffff',strokeW:14});if(d.sub)txt(c,d.sub,960,650,{size:44,color:b.ink,weight:900})}c.restore()}});

/* ======================= 12 · TICKER / CRAWL (RTL crawl moves rightwards) ======================= */
tpl({id:'ticker',name:'Ticker / Crawl',fa:'تیکر',category:'general',slot:'ticker',layer:'lower',
 dataSchema:{label:{type:'string',default:'داداش‌مود'},items:{type:'list',default:['قسمت بعد: تاج در خطر','کامنت بنویسید: مجازات بعدی چی باشه؟','بانک زمان · هر ثانیه یه سلاحه']},speed:{type:'number',default:120}},
 transitions:{enter:['tickerStart'],exit:['tickerStop']},
 init(i){i.els={bar:el()};i.mem.off=0;i.mem.list=null;i.mem.next=null},
 enter(tl,i){i.mem.list=(i.data.items||[]).slice();P.tickerStart(tl,i.els.bar,{})},exit(tl,i){P.tickerStop(tl,i.els.bar,{})},
 update(U,i,ch){if(ch.has('items'))i.mem.next=(i.data.items||[]).slice()/* swapped at the loop seam: no visual reset */},
 sim(i,dt){i.mem.off+=dt*(i.data.speed||120)*i.els.bar.speed},
 draw(c,i){const e=i.els.bar,d=i.data,b=br();const k=K();const y=1004,h=60;
  B.fx(c,e,960,y,1860,h,cc=>{k.panel(cc,-930,-h/2,1860,h,{fill:'#070a18',r:8,elev:'e2'});cc.save();cc.beginPath();cc.rect(-930,-h/2,1640,h);cc.clip();
    const font=k.font('ui',30,800);const sep='   ◆   ';const str=(i.mem.list||[]).join(sep)+sep;const W=Math.max(200,k.measure(cc,str,font));if(i.mem.off>=W){i.mem.off-=W;if(i.mem.next){i.mem.list=i.mem.next;i.mem.next=null}}
    cc.font=font;cc.fillStyle=b.ink;cc.textAlign='right';cc.textBaseline='middle';cc.direction='rtl';for(let x=-930+i.mem.off;x<710+W;x+=W)cc.fillText(str,x,2);cc.restore();
    k.panel(cc,710,-h/2,220,h,{fill:b.primary,r:8});txt(cc,d.label,820,2,{role:'display',size:32,max:200})},{dir:'rtl',channel:'PGM'})}});

/* ======================= 13 · BUG / WATERMARK / STATION-SHOW ID ======================= */
tpl({id:'bug',name:'Bug / Show ID',fa:'لوگوی گوشه',category:'general',slot:'bug',layer:'bug',priority:40,
 dataSchema:{label:{type:'string',default:'DADASHMODE'},live:{type:'bool',default:true},sub:{type:'string',default:'بانک زمان'}},
 transitions:{enter:['glitchReveal'],exit:['slideOut']},
 init(i){i.els={b:el()}},enter(tl,i){P.glitchReveal(tl,i.els.b,{})},exit(tl,i){P.slideOut(tl,i.els.b,{to:'left',dist:80})},
 draw(c,i){const e=i.els.b,d=i.data,b=br();B.fx(c,e,230,86,270,64,cc=>{K().panel(cc,-135,-32,270,64,{fill:B.rgba(b.panel,.82),r:12});txt(cc,d.label,-10,-6,{role:'num',size:28,color:b.ink,max:200});txt(cc,d.sub,-10,18,{size:15,color:b.inkDim,weight:700});
   if(d.live){const a=.55+.45*Math.sin(now()*4);cc.fillStyle=B.rgba(b.danger,a);cc.beginPath();cc.arc(112,0,9,0,Math.PI*2);cc.fill()}},{channel:'PGM'})}});

/* ======================= 14 · SPONSOR BUG / SPONSOR STING ======================= */
tpl({id:'sponsor',name:'Sponsor Bug / Sting',fa:'اسپانسر',category:'general',slot:'bug2',layer:'bug',
 dataSchema:{kicker:{type:'string',default:'با حمایت'},name:{type:'string',default:'اسم اسپانسر'},color:{type:'color',default:''}},
 transitions:{enter:['sponsorSting','lightSweep'],exit:['lowerThirdOff']},
 init(i){i.els={b:el()}},enter(tl,i){P.sponsorSting(tl,i.els.b,{})},exit(tl,i){P.lowerThirdOff(tl,i.els.b,{})},
 emphasis(U,i){const t=U.track('state');P.sponsorSting(t,i.els.b,{})},
 draw(c,i){const e=i.els.b,d=i.data,b=br();const col=d.color||b.secondary;B.fx(c,e,1690,86,300,64,cc=>{K().panel(cc,-150,-32,300,64,{fill:B.rgba(b.panel,.85),r:12,stroke:B.rgba(col,.6),strokeW:2});txt(cc,d.kicker,130,-10,{size:16,align:'right',color:b.inkDim,weight:700});txt(cc,d.name,130,14,{size:26,align:'right',color:col,weight:900,max:260})},{channel:'PGM'})}});

/* ======================= 15 · ALERT / BREAKING / DANGER-SAFE ======================= */
tpl({id:'alert',name:'Breaking / Alert · Danger / Safe',fa:'هشدار',category:'gameshow',slot:'alert',layer:'alert',priority:70,autoHide:3.2,
 dataSchema:{text:{type:'string',default:'وقت تمام!'},level:{type:'string',default:'danger',options:['danger','safe','info']},sub:{type:'string',default:''}},
 transitions:{enter:['alertOn'],exit:['lowerThirdOff'],alert:['alertPulse']},
 init(i){i.els={b:el()}},enter(tl,i){P.alertOn(tl,i.els.b,{})},exit(tl,i){P.lowerThirdOff(tl,i.els.b,{})},
 update(U,i,ch){if(ch.has('text')||ch.has('level'))P.alertPulse(U.track('pulse'),i.els.b,{n:1})},
 draw(c,i){const e=i.els.b,d=i.data,b=br();const col=d.level==='safe'?b.success:d.level==='info'?b.accent:b.danger;const w=Math.min(1100,Math.max(520,d.text.length*34+220));
  B.fx(c,e,960,236,w,92,cc=>{K().panel(cc,-w/2,-46,w,92,{fill:col,r:14,elev:'e3'});cc.fillStyle='rgba(0,0,0,.25)';cc.fillRect(w/2-92,-46,92,92);txt(cc,d.level==='safe'?'✓':'!',w/2-46,2,{role:'num',size:56,color:'#ffffff'});
   txt(cc,d.text,-46,d.sub?-12:2,{role:'display',size:52,color:'#ffffff',max:w-160});if(d.sub)txt(cc,d.sub,-46,28,{size:22,color:'rgba(255,255,255,.9)',weight:800,max:w-160})},{dir:'center',glowColor:col,channel:'PGM'})}});

/* ======================= 16 · QUESTION → CORRECT / WRONG ANSWER REVEAL + LOCKED-IN ======================= */
tpl({id:'answerReveal',name:'Question / Answer Reveal',fa:'رونمایی جواب',category:'gameshow',slot:'center',layer:'side',
 dataSchema:{label:{type:'string',default:'معما'},text:{type:'string',default:'جواب: ۲'},correct:{type:'string',default:'',options:['','yes','no']}},
 transitions:{enter:['glassReveal','lowerThirdOn'],exit:['fullscreenExit'],actions:{correct:['impactBurst','particleBurst'],wrong:['scoreDecrement(shake)']}},
 init(i){i.els={box:el(),mark:el()}},
 enter(tl,i){P.glassReveal(tl,i.els.box,{});if(i.data.correct)B.template('answerReveal').actions.reveal({track:()=>tl},i,i.data.correct)},
 exit(tl,i){P.fullscreenExit(tl,i.els.box,{});tl.to(i.els.mark,{a:0},{dur:.12,at:'<'})},
 actions:{reveal(U,i,v){i.data.correct=v==='no'||v===false?'no':'yes';const t=U.track('mark');t.set(i.els.mark,{a:1});if(i.data.correct==='yes'){P.impactBurst(t,i.els.mark,{x:960,y:520});P.particleBurst(t,i.els.mark,{x:960,y:520,at:'<'})}else{P.goalSplash(t,i.els.mark,{x:960,y:520});B.anim.shake(t,i.els.box,{k:1,at:'<'})}},
  correct(U,i){this.reveal(U,i,'yes')},wrong(U,i){this.reveal(U,i,'no')},reset(U,i){i.data.correct='';U.track('mark').set(i.els.mark,{a:0})}},
 update(U,i,ch){if(ch.has('correct')&&i.data.correct)B.template('answerReveal').actions.reveal(U,i,i.data.correct)},
 draw(c,i){const e=i.els,d=i.data,b=br();const ok=d.correct==='yes',bad=d.correct==='no';const col=ok?b.success:bad?b.danger:b.accent;const w=900,h=260;
  B.fx(c,e.box,960,540,w,h,cc=>{K().panel(cc,-w/2,-h/2,w,h,{fill:ok||bad?B.mix(b.panel,col,.45):b.panel2,fill2:b.panel,r:b.radius+6,elev:'e3',stroke:col,strokeW:5});txt(cc,d.label,w/2-40,-h/2+44,{size:28,align:'right',color:b.inkDim,weight:800});txt(cc,d.text,0,20,{role:'display',size:88,color:b.ink,max:w-200})},{glowColor:col,channel:'PGM'});
  if(ok||bad)B.fx(c,e.mark,960-w/2+90,540,140,140,cc=>{cc.fillStyle=col;cc.beginPath();cc.arc(0,0,62,0,Math.PI*2);cc.fill();txt(cc,ok?'✓':'✕',0,4,{role:'num',size:76,color:'#ffffff'})},{channel:'PGM'})}});
tpl({id:'lockedIn',name:'Locked-In State',fa:'ثبت شد',category:'gameshow',slot:null,layer:'lower',
 dataSchema:{name:{type:'string',default:'الیاس'},side:{type:'string',default:'E',options:['E','M']},color:{type:'color',default:'#ff2738'},text:{type:'string',default:'ثبت شد ●'}},
 transitions:{enter:['numberPop','lightSweep'],exit:['slideOut']},
 init(i){i.els={b:el()}},enter(tl,i){tl.set(i.els.b,{a:1,s:.4});P.numberPop(tl,i.els.b,{});P.lightSweep(tl,i.els.b,{at:'<'})},exit(tl,i){P.slideOut(tl,i.els.b,{to:i.data.side==='E'?'right':'left',dist:60})},
 draw(c,i){const d=i.data,b=br();const x=d.side==='E'?1400:520;B.fx(c,i.els.b,x,760,380,84,cc=>{K().panel(cc,-190,-42,380,84,{fill:b.panel2,r:42,stroke:d.color,strokeW:4,elev:'e2'});txt(cc,d.name+' · '+d.text,0,2,{size:32,color:b.ink,weight:900,max:340})},{glowColor:d.color,channel:'PGM'})}});

/* ======================= 17 · GOAL / POINT SPLASH ======================= */
tpl({id:'scoreSplash',name:'Goal / Point Splash',fa:'اسپلش امتیاز',category:'sports',slot:null,layer:'fx',autoHide:1.9,accessibility:{flash:true},
 dataSchema:{value:{type:'number',default:10},name:{type:'string',default:'الیاس'},color:{type:'color',default:'#ff2738'},side:{type:'string',default:'E',options:['E','M','C']},unit:{type:'string',default:'ثانیه'}},
 transitions:{enter:['goalSplash','impactBurst'],exit:['fullscreenExit']},
 init(i){i.els={n:el(),sub:el(),ring:el()}},
 X(d){return d.side==='E'?1380:d.side==='M'?540:960},
 enter(tl,i){const x=B.template('scoreSplash').X(i.data);P.goalSplash(tl,i.els.n,{x,y:520});tl.set(i.els.ring,{a:1},0);tl.fromTo(i.els.ring,{p:0},{p:1},{dur:B.T().d('slow'),ease:'linear',at:0});P.slideIn(tl,i.els.sub,{from:'right',dist:40,at:B.T().d('fast')})},
 exit(tl,i){P.fullscreenExit(tl,i.els.n,{});tl.to(i.els.sub,{a:0},{dur:.15,at:'<'})},
 draw(c,i){const d=i.data,b=br();const x=B.template('scoreSplash').X(d);const neg=d.value<0;const col=neg?b.danger:b.secondary;K().ring(c,x,520,i.els.ring.p,{color:d.color,r1:380,w:22});
  B.fx(c,i.els.n,x,520,700,300,cc=>txt(cc,(neg?'−':'+')+fa(Math.abs(d.value)),0,0,{role:'num',size:250,color:col,glow:neg?b.danger:d.color,glowBlur:50,stroke:'#0a0f22',strokeW:10}),{channel:'PGM'});
  B.fx(c,i.els.sub,x,690,700,70,cc=>txt(cc,d.unit+' برای '+d.name,0,0,{size:44,color:b.ink,weight:900,shadow:{blur:10,y:3}}))}});

/* ======================= 18 · SEGMENT INTRO / ROUND · STAGE INDICATOR / HEADLINE CARD / BUMPER / OUTRO ======================= */
tpl({id:'segmentIntro',name:'Segment Intro · Round Indicator',fa:'معرفی مرحله',category:'general',slot:'full',layer:'full',priority:65,autoHide:2.6,
 dataSchema:{kicker:{type:'string',default:'راند ۲'},title:{type:'string',default:'فاصله را خودت انتخاب کن'},subtitle:{type:'string',default:'دورتر = ثانیهٔ بیشتر'},index:{type:'number',default:2},total:{type:'number',default:6},variant:{type:'string',default:'intro',options:['intro','outro','bumper','headline']},autoHide:{type:'bool',default:true}},
 transitions:{enter:['fullscreenTakeover','parallaxReveal','lightSweep'],exit:['fullscreenExit']},
 init(i){i.els={bg:el(),kicker:el(),title:el(),sub:el(),dots:el()}},
 enter(tl,i){const e=i.els;P.fullscreenTakeover(tl,e.bg,{});P.parallaxReveal(tl,[e.kicker,e.title,e.sub,e.dots],{at:'<+=0.05'});P.lightSweep(tl,e.title,{at:'>'})},
 exit(tl,i){const e=i.els;[e.kicker,e.title,e.sub,e.dots].forEach((x,j)=>tl.to(x,{a:0,x:-60},{dur:B.T().d('fast'),ease:B.T().e('exit'),at:j*B.T().st('tight')}));P.fullscreenExit(tl,e.bg,{at:'<'})},
 update(U,i,ch){if(ch.has('title')){const t=U.track('t');t.fromTo(i.els.title,{a:0,x:60},{a:1,x:0},{dur:B.T().d('base'),ease:B.T().e('enter')})}},
 draw(c,i){const e=i.els,d=i.data,b=br();const k=K();if(e.bg.a>0){B.fx(c,e.bg,960,540,1920,1080,cc=>{const g=cc.createLinearGradient(-960,-540,960,540);g.addColorStop(0,b.panel);g.addColorStop(1,B.mix(b.primary,'#000',.62));cc.fillStyle=g;cc.fillRect(-960,-540,1920,1080);
   cc.globalAlpha*=.14;cc.fillStyle=b.primary;cc.beginPath();cc.moveTo(300,-540);cc.lineTo(960,-540);cc.lineTo(560,540);cc.lineTo(-100,540);cc.fill()},{noBlur:true})}
  B.fx(c,e.kicker,960,330,700,90,cc=>{k.panel(cc,-160,-40,320,80,{fill:b.primary,r:40});txt(cc,d.kicker,0,3,{role:'display',size:50,max:300})});
  B.fx(c,e.title,960,500,1700,200,cc=>txt(cc,d.title,0,0,{role:'display',size:130,color:b.ink,max:1650,shadow:{blur:24,y:6}}),{channel:'PGM'});
  B.fx(c,e.sub,960,640,1400,70,cc=>txt(cc,d.subtitle,0,0,{size:46,color:b.secondary,weight:900,max:1380}));
  if(d.total>1)B.fx(c,e.dots,960,760,d.total*56,40,cc=>{for(let j=0;j<d.total;j++){const x=(d.total-1)*28-j*56;cc.fillStyle=j<d.index?b.secondary:B.rgba(b.ink,.2);cc.beginPath();cc.arc(x,0,j===d.index-1?14:9,0,Math.PI*2);cc.fill()}})}});

/* ======================= 19 · PODIUM ======================= */
tpl({id:'podium',name:'Podium Reveal',fa:'سکو',category:'gameshow',slot:'full',layer:'full',
 dataSchema:{places:{type:'list',default:[{name:'الیاس',value:'۳ نشان',color:'#ff2738'},{name:'عماد',value:'۲ نشان',color:'#00c98d'},{name:'جمنای',value:'داور',color:'#27e0ff'}]},title:{type:'string',default:'رده‌بندی فصل'}},
 transitions:{enter:['fullscreenTakeover','podiumReveal','confetti'],exit:['fullscreenExit']},
 init(i){i.els={bg:el(),b1:el(),b2:el(),b3:el(),title:el()}},
 enter(tl,i){const e=i.els;P.fullscreenTakeover(tl,e.bg,{});P.lowerThirdOn(tl,e.title,{at:'<'});P.podiumReveal(tl,[e.b3,e.b2,e.b1],{at:'<+=0.2'});P.confetti(tl,e.b1,{at:'>'})},
 exit(tl,i){const e=i.els;[e.b1,e.b2,e.b3,e.title].forEach(x=>tl.to(x,{a:0},{dur:.15,at:0}));P.fullscreenExit(tl,e.bg,{at:0})},
 draw(c,i){const e=i.els,d=i.data,b=br();B.fx(c,e.bg,960,540,1920,1080,cc=>{cc.fillStyle=B.rgba('#04060f',.9);cc.fillRect(-960,-540,1920,1080)},{noBlur:true});B.fx(c,e.title,960,180,1000,90,cc=>txt(cc,d.title,0,0,{role:'display',size:80,color:b.secondary}));
  const spots=[[960,340,b.gold],[1380,250,b.silver],[540,180,b.bronze]];[e.b1,e.b2,e.b3].forEach((x,j)=>{const pl=(d.places||[])[j];if(!pl||x.a<=0)return;const [cx,hh,col]=spots[j];const H=hh*clamp(x.fill);c.save();c.globalAlpha*=x.a;K().panel(c,cx-180,960-H,360,H,{fill:B.mix(col,'#000',.35),fill2:B.mix(col,'#000',.7),r:10});
   txt(c,fa(j+1),cx,960-H+60,{role:'num',size:80,color:col});if(x.fill>.6){c.globalAlpha*=clamp((x.fill-.6)/.4);txt(c,pl.name,cx,960-H-80,{role:'display',size:72,color:pl.color||b.ink,max:340});txt(c,pl.value,cx,960-H-24,{size:30,color:b.ink,weight:800})}c.restore()})}});

/* ======================= 20 · 2D GPU GRAPHIC · data-reactive energy field ======================= */
tpl({id:'gpuField',name:'2D GPU Energy Field',fa:'میدان انرژی GPU',category:'general',renderer:'gpu2d',slot:'bg',layer:'bg',performanceProfile:{cost:'medium',particles:120},
 dataSchema:{intensity:{type:'number',default:.8},dust:{type:'bool',default:true}},
 transitions:{enter:['fade field'],exit:['fade field']},
 init(i){i.els={f:el()}},
 enter(tl,i){tl.set(i.els.f,{a:1});tl.call(()=>{if(B.gpu){B.gpu.field({on:true,intensity:i.data.intensity});if(i.data.dust)B.gpu.emit('dust',{count:90})}})},
 exit(tl,i){tl.call(()=>{if(B.gpu)B.gpu.field({on:false})});tl.to(i.els.f,{a:0},{dur:B.T().d('slow')})},
 update(U,i,ch){if(ch.has('intensity')&&B.gpu)B.gpu.field({intensity:i.data.intensity})},
 draw(c,i,env){if(env.channel==='PVW'||!(B.gpu&&B.gpu.available())){/* Canvas2D fallback / preview */const t=now();c.save();c.globalAlpha*=i.els.f.a*.6*i.data.intensity;const g=c.createRadialGradient(960+Math.sin(t)*200,540,50,960,540,900);g.addColorStop(0,B.rgba(br().accent,.5));g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,1920,1080);c.restore()}}});

B.templatesLoaded=true;
})(typeof window!=='undefined'?window:globalThis);
