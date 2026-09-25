/* DADASHMODE V8 · BMG · 4/8 · ANIMATION PRIMITIVES + 40 BROADCAST PRESETS (spec §3, §11, §12)
   An "element" is a plain object of animatable channels (no DOM): x y s sx sy a r wipe blur sweep glow shake glitch flash cam p fill roll hl speed glass.
   Presets only ADD tweens to a timeline, read every number from the Motion Design Token System (BMG.T) and never draw.
   Drawing reads the channels through BMG.fx() (renderer adapter side), so motion and rendering stay decoupled (spec §2). */
(function(root){
'use strict';
const B=root.BMG;const {clamp,lerp}=B.math;

/* ---------- element factory ---------- */
B.el=(o)=>Object.assign({x:0,y:0,s:1,sx:1,sy:1,a:0,r:0,wipe:1,blur:0,sweep:0,glow:0,shake:0,glitch:0,flash:0,cam:0,p:0,fill:0,roll:1,hl:0,speed:0,glass:0},o||{});
B.elReset=(el,o)=>Object.assign(el,B.el(),o||{});

/* ---------- animation API (spec §11): thin, token-aware helpers over the Timeline engine ---------- */
const A=B.anim={
 timeline:(o)=>B.timeline(o),
 animate:(tl,el,prop,from,to,timing={})=>tl.fromTo(el,{[prop]:from},{[prop]:to},Object.assign({dur:B.T().d(timing.dur||'base'),ease:timing.ease||'standard'},timing,{dur:B.T().d(timing.dur||'base')})),
 sequence:(tl,steps)=>{steps.forEach(fn=>fn(tl));return tl},
 parallel:(tl,steps,at)=>{const t0=tl._pos(at);let end=t0;steps.forEach(fn=>{tl.lastEnd=t0;tl.lastStart=t0;fn(tl,t0);end=Math.max(end,tl.lastEnd)});tl.lastEnd=end;return tl},
 stagger:(tl,els,to,o={})=>tl.stagger(els,to,Object.assign({each:B.T().st(o.each||'base'),dur:B.T().d(o.dur||'base'),ease:o.ease||'broadcastIn'},o,{each:B.T().st(o.each||'base'),dur:B.T().d(o.dur||'base')})),
 spring:(tl,el,to,o={})=>tl.spring(el,to,Object.assign({spring:B.T().s(o.spring||'snappy')},o)),
 physics:(tl,el,o={})=>{/* ballistic arc with drag (closed form), e.g. a chip thrown to a scorebug */const v=o.v||[0,-900],g=o.g??1800,d=o.drag??1.4,x0=el.x,y0=el.y;
  return tl.sim((dt,t)=>{const k=(1-Math.exp(-d*t))/d;el.x=x0+v[0]*k;el.y=y0+v[1]*k+.5*g*t*t*.6},o.dur??1.2,o.at)},
 motionPath:(tl,el,pts,o={})=>{/* Catmull-Rom path through points */const P=pts;const f=u=>{const n=P.length-1;const s=clamp(u)*n;const i=Math.min(n-1,Math.floor(s));const t=s-i;const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(n,i+2)];
   const c=(a,b,c2,d2)=>.5*((2*b)+(-a+c2)*t+(2*a-5*b+4*c2-d2)*t*t+(-a+3*b-3*c2+d2)*t*t*t);return [c(p0[0],p1[0],p2[0],p3[0]),c(p0[1],p1[1],p2[1],p3[1])]};
  const o2={u:0};return tl.to(o2,{u:1},{dur:B.T().d(o.dur||'slow'),ease:o.ease||'quintInOut',at:o.at,onUpdate:()=>{const q=f(o2.u);el.x=q[0];el.y=q[1]}})},
 morph:(tl,el,key,shapeA,shapeB,o={})=>{/* point-list morph: el[key] receives the interpolated polygon */const n=Math.max(shapeA.length,shapeB.length);const pick=(S,i)=>S[Math.floor(i*S.length/n)];const st={m:0};
  return tl.to(st,{m:1},{dur:B.T().d(o.dur||'base'),ease:o.ease||'quintInOut',at:o.at,onUpdate:()=>{el[key]=Array.from({length:n},(_,i)=>{const a=pick(shapeA,i),b=pick(shapeB,i);return [lerp(a[0],b[0],st.m),lerp(a[1],b[1],st.m)]})}})},
 counter:(tl,el,from,to,o={})=>tl.fromTo(el,{val:from},{val:to},{dur:B.T().d(o.dur||'slow'),ease:o.ease||'expoOut',at:o.at}),
 scrambleText:(tl,el,o={})=>tl.fromTo(el,{scr:0},{scr:1},{dur:B.T().d(o.dur||'slow'),ease:'linear',at:o.at}),
 splitText:(tl,el,o={})=>tl.fromTo(el,{split:0},{split:1},{dur:B.T().d(o.dur||'slow'),ease:'linear',at:o.at}),
 reveal:(tl,el,o={})=>{tl.set(el,{a:1},o.at);return tl.fromTo(el,{wipe:0},{wipe:1},{dur:B.T().d(o.dur||'base'),ease:o.ease||'broadcastIn'})},
 maskReveal:(tl,el,o={})=>A.reveal(tl,el,Object.assign({ease:'quartOut'},o)),
 wipe:(tl,el,o={})=>tl.fromTo(el,{wipe:o.from??0},{wipe:o.to??1},{dur:B.T().d(o.dur||'fast'),ease:o.ease||'quintInOut',at:o.at}),
 pop:(tl,el,o={})=>{const T=B.T();tl.to(el,{s:T.sc('pop')},{dur:T.d('micro'),ease:'quadOut',at:o.at});return tl.spring(el,{s:1},{spring:T.s('settle')})},
 settle:(tl,el,o={})=>tl.spring(el,Object.assign({s:1,x:0,y:0,r:0},o.to||{}),{spring:B.T().s('settle'),at:o.at}),
 shake:(tl,el,o={})=>tl.fromTo(el,{shake:o.k??1},{shake:0},{dur:B.T().d(o.dur||'slow'),ease:'quadOut',at:o.at}),
 impact:(tl,el,o={})=>{const T=B.T();tl.fromTo(el,{s:T.sc('punch'),flash:1},{s:1,flash:0},{dur:T.d('base'),ease:'overshoot',at:o.at});return tl.fromTo(el,{p:0},{p:1},{dur:T.d('slow'),ease:'linear',at:'<'})},
 burst:(tl,el,o={})=>tl.call(()=>{if(B.gpu)B.gpu.emit(o.kind||'burst',{x:o.x??960,y:o.y??540,count:o.count,colors:o.colors})},o.at),
 particleBurst:(tl,el,o={})=>A.burst(tl,el,Object.assign({kind:'sparks'},o))};

/* ---------- the 40 presets (spec §12). Signature: (tl, el|els, o) → tl.  o.at positions the block inside tl. ---------- */
const P=B.PRESETS={};const L=B.PRESET_LABELS={};
const def=(id,label,fa,fn)=>{P[id]=fn;L[id]={label,fa}};
const T=()=>B.T();
const side=o=>o.from==='left'?-1:1;
def('slideIn','Broadcast Slide In','ورود پخش',(tl,el,o={})=>{const t=T();const d=o.dist??t.dist('medium');tl.set(el,{a:0},o.at);return tl.fromTo(el,{x:side(o)*d,a:0,blur:t.b('motion')},{x:0,a:1,blur:0},{dur:t.d(o.dur||'base'),ease:t.e('enter')})});
def('slideOut','Broadcast Slide Out','خروج پخش',(tl,el,o={})=>{const t=T();const d=o.dist??t.dist('medium');return tl.to(el,{x:side(o)*d,a:0,blur:t.b('motion')},{dur:t.d(o.dur||'fast'),ease:t.e('exit'),at:o.at})});
def('lowerThirdOn','Lower Third Build-On','ساخت زیرنویس نام',(tl,el,o={})=>{const t=T();tl.set(el,{a:1,wipe:0},o.at);tl.fromTo(el,{wipe:0,x:t.dist('nudge')},{wipe:1,x:0},{dur:t.d('base'),ease:t.e('enter')});return tl.fromTo(el,{sweep:0},{sweep:1},{dur:t.d('slow'),ease:'sineInOut',at:'<+=0.18'})});
def('lowerThirdOff','Lower Third Build-Off','جمع شدن زیرنویس نام',(tl,el,o={})=>{const t=T();tl.to(el,{wipe:0,x:-t.dist('nudge')},{dur:t.d('fast'),ease:t.e('exit'),at:o.at});return tl.set(el,{a:0})});
def('otsReveal','OTS Reveal','باکس روی شانه',(tl,el,o={})=>{const t=T();tl.set(el,{a:1},o.at);return tl.fromTo(el,{s:t.sc('enterFrom'),x:t.dist('short'),wipe:0},{s:1,x:0,wipe:1},{dur:t.d('slow'),ease:t.e('enter')})});
def('scorebugBuild','Scorebug Build','ساخت اسکوربورد',(tl,el,o={})=>{const t=T();tl.set(el,{a:1,wipe:.15},o.at);tl.spring(el,{y:0},{spring:t.s('snappy'),from:{y:-t.dist('medium')}});return tl.fromTo(el,{wipe:.15},{wipe:1},{dur:t.d('base'),ease:t.e('enter'),at:'<'})});
def('scoreIncrement','Score Increment','افزایش امتیاز',(tl,el,o={})=>{const t=T();tl.fromTo(el,{roll:0},{roll:1},{dur:t.d('slow'),ease:'expoOut',at:o.at});tl.to(el,{s:t.sc('pop'),glow:1,hl:1},{dur:t.d('micro'),ease:'quadOut',at:'<'});tl.spring(el,{s:1},{spring:t.s('settle')});return tl.to(el,{glow:0,hl:0},{dur:t.d('slow'),ease:'sineOut',at:'<'})});
def('scoreDecrement','Score Decrement','کاهش امتیاز',(tl,el,o={})=>{const t=T();tl.fromTo(el,{roll:0},{roll:1},{dur:t.d('slow'),ease:'expoOut',at:o.at});tl.fromTo(el,{shake:.8,flash:1,hl:-1},{shake:0,flash:0},{dur:t.d('slow'),ease:'quadOut',at:'<'});return tl.to(el,{hl:0},{dur:t.d('base'),ease:'sineOut'})});
def('numberRoll','Number Roll','چرخش عدد',(tl,el,o={})=>tl.fromTo(el,{roll:0},{roll:1},{dur:T().d(o.dur||'slow'),ease:'expoOut',at:o.at}));
def('numberPop','Number Pop','پاپ عدد',(tl,el,o={})=>{const t=T();tl.to(el,{s:t.sc('overscale')},{dur:t.d('micro'),ease:'quadOut',at:o.at});return tl.spring(el,{s:1},{spring:t.s('settle')})});
def('rankUp','Rank Up','بالا رفتن رتبه',(tl,el,o={})=>{const t=T();tl.fromTo(el,{hl:1},{hl:0},{dur:t.d('xslow'),ease:'sineOut',at:o.at});tl.to(el,{y:o.toY??el.y,s:t.sc('pop')},{dur:t.d('slow'),ease:t.e('move'),at:'<'});return tl.spring(el,{s:1},{spring:t.s('gentle')})});
def('rankDown','Rank Down','پایین رفتن رتبه',(tl,el,o={})=>{const t=T();tl.fromTo(el,{hl:-1},{hl:0},{dur:t.d('xslow'),ease:'sineOut',at:o.at});return tl.to(el,{y:o.toY??el.y},{dur:t.d('slow'),ease:t.e('move'),at:'<'})});
def('leaderboardReorder','Leaderboard Reorder','جابه‌جایی جدول',(tl,els,o={})=>{const t=T();const base=tl._pos(o.at);const ys=o.ys||[];els.forEach((e,i)=>{tl.to(e,{y:ys[i]??e.y},{dur:t.d('slow'),ease:t.e('move'),at:base+i*t.st('tight')})});return tl});
def('playerCardReveal','Player Card Reveal','رونمایی کارت بازیکن',(tl,el,o={})=>{const t=T();tl.set(el,{a:1},o.at);tl.fromTo(el,{sx:0,y:t.dist('short'),blur:t.b('soft')},{sx:1,y:0,blur:0},{dur:t.d('base'),ease:'back.out(1.25)'});return tl.fromTo(el,{sweep:0},{sweep:1},{dur:t.d('slow'),ease:'sineInOut',at:'<+=0.2'})});
def('teamCardReveal','Team Card Reveal','رونمایی کارت تیم',(tl,el,o={})=>{P.slideIn(tl,el,Object.assign({dist:T().dist('long')},o));return tl.fromTo(el,{sweep:0},{sweep:1},{dur:T().d('slow'),ease:'sineInOut',at:'<+=0.15'})});
def('matchupReveal','Matchup Reveal','رونمایی رودررو',(tl,els,o={})=>{const t=T();const [a,b,vs]=els;const base=tl._pos(o.at);
 tl.set(a,{a:1},base);tl.fromTo(a,{x:t.dist('long'),blur:t.b('motion')},{x:0,blur:0},{dur:t.d('slow'),ease:t.e('enter'),at:base});
 tl.set(b,{a:1},base+t.st('loose'));tl.fromTo(b,{x:-t.dist('long'),blur:t.b('motion')},{x:0,blur:0},{dur:t.d('slow'),ease:t.e('enter'),at:base+t.st('loose')});
 if(vs){tl.set(vs,{a:1},base+t.d('base'));tl.fromTo(vs,{s:0,r:-.3},{s:t.sc('punch'),r:0},{dur:t.d('fast'),ease:'expoOut',at:base+t.d('base')});tl.spring(vs,{s:1},{spring:t.s('settle')})}return tl});
def('winnerReveal','Winner Reveal','رونمایی برنده',(tl,els,o={})=>{const t=T();const {bg,name,sub,rays}=els;const base=tl._pos(o.at);
 tl.set(bg,{a:0},base);tl.to(bg,{a:.88},{dur:t.d('slow'),ease:'sineInOut',at:base});
 const r=base+t.d('slow')+(o.suspense??t.d('xslow'));/* purposeful anticipation: a held beat before the reveal */
 if(rays){tl.set(rays,{a:1},r);tl.fromTo(rays,{p:0},{p:1},{dur:t.d('cinematic'),ease:'linear',at:r})}
 tl.set(name,{a:1},r);tl.fromTo(name,{s:.62,blur:t.b('heavy'),flash:1},{s:1,blur:0,flash:0},{dur:t.d('base'),ease:'overshoot',at:r});
 if(sub){tl.set(sub,{a:1,wipe:0},r+t.d('fast'));tl.fromTo(sub,{wipe:0},{wipe:1},{dur:t.d('base'),ease:t.e('enter'),at:r+t.d('fast')})}
 tl.addLabel('reveal',r);return tl});
def('podiumReveal','Podium Reveal','رونمایی سکو',(tl,els,o={})=>{const t=T();const base=tl._pos(o.at);els.forEach((e,i)=>{const at=base+i*t.st('cascade')*2.2;tl.set(e,{a:1},at);tl.fromTo(e,{fill:0},{fill:1},{dur:t.d('slow'),ease:'settle',at})});return tl});
def('goalSplash','Goal/Point Splash','اسپلش امتیاز',(tl,el,o={})=>{const t=T();tl.set(el,{a:1},o.at);tl.fromTo(el,{s:.35,flash:1},{s:1,flash:0},{dur:t.d('base'),ease:'back.out(2.2)'});tl.fromTo(el,{p:0},{p:1},{dur:t.d('slow'),ease:'linear',at:'<'});return tl.call(()=>{if(B.gpu)B.gpu.emit('burst',{x:o.x??960,y:o.y??540,count:70})},'<')});
def('countdownStart','Countdown Start','شروع شمارش',(tl,el,o={})=>{const t=T();tl.set(el,{a:0},o.at);tl.fromTo(el,{s:1.3,a:0},{s:1,a:1},{dur:t.d('fast'),ease:t.e('enter')});return tl.fromTo(el,{p:0},{p:1},{dur:t.d('slow'),ease:'linear',at:'<'})});
def('countdownTick','Countdown Tick','تیک شمارش',(tl,el,o={})=>{const t=T();return tl.fromTo(el,{s:t.em('pulseScale'),glow:.8},{s:1,glow:0},{dur:t.em('pulseDur'),ease:'quadOut',at:o.at})});
def('alertPulse','Alert Pulse','پالس هشدار',(tl,el,o={})=>{const t=T();const n=o.n||2;let at=tl._pos(o.at);for(let i=0;i<n;i++){tl.to(el,{s:t.em('alertScale'),glow:1},{dur:t.em('pulseDur')*.5,ease:'quadOut',at});tl.to(el,{s:1,glow:.15},{dur:t.em('pulseDur'),ease:'sineInOut'});at=tl.lastEnd}return tl});
def('sponsorSting','Sponsor Sting','استینگ اسپانسر',(tl,el,o={})=>{const t=T();tl.set(el,{a:1,wipe:0},o.at);tl.fromTo(el,{wipe:0,s:1.04},{wipe:1,s:1},{dur:t.d('fast'),ease:'quintInOut'});return tl.fromTo(el,{sweep:0},{sweep:1},{dur:t.d('slow'),ease:'sineInOut'})});
def('tickerStart','Ticker Start','شروع تیکر',(tl,el,o={})=>{const t=T();tl.set(el,{a:1,wipe:0,speed:0},o.at);tl.fromTo(el,{wipe:0},{wipe:1},{dur:t.d('base'),ease:t.e('enter')});return tl.to(el,{speed:1},{dur:t.d('slow'),ease:'sineInOut'})});
def('tickerStop','Ticker Stop','توقف تیکر',(tl,el,o={})=>{const t=T();tl.to(el,{speed:0},{dur:t.d('slow'),ease:'sineOut',at:o.at});tl.to(el,{wipe:0},{dur:t.d('fast'),ease:t.e('exit')});return tl.set(el,{a:0})});
def('stinger','Stinger Transition','ترنزیشن استینگر',(tl,el,o={})=>{const t=T();const d=t.d(o.dur||'cinematic');tl.set(el,{a:1,p:0},o.at);tl.to(el,{p:.5},{dur:d*.5,ease:'quintInOut'});tl.call(()=>{if(o.onCover)o.onCover();B.bus.emit('stinger.cover',o.id||'')});tl.addLabel('cover');tl.to(el,{p:1},{dur:d*.5,ease:'quintInOut'});return tl.set(el,{a:0})});
def('fullscreenTakeover','Fullscreen Takeover','تمام‌صفحه',(tl,el,o={})=>{const t=T();tl.set(el,{a:0},o.at);return tl.fromTo(el,{a:0,s:t.sc('overscale'),blur:t.b('heavy')},{a:1,s:1,blur:0},{dur:t.d('slow'),ease:t.e('enter')})});
def('fullscreenExit','Fullscreen Exit','خروج تمام‌صفحه',(tl,el,o={})=>{const t=T();return tl.to(el,{a:0,s:1.05,blur:t.b('medium')},{dur:t.d('fast'),ease:t.e('exit'),at:o.at})});
def('impactBurst','Impact Burst','ضربه',(tl,el,o={})=>{A.impact(tl,el,o);A.shake(tl,el,{k:.7,at:'<'});return A.burst(tl,el,Object.assign({kind:'impact'},o,{at:'<'}))});
def('confetti','Confetti Celebration','جشن کاغذرنگی',(tl,el,o={})=>tl.call(()=>{if(B.gpu){B.gpu.emit('cannons',{count:o.count||150});B.gpu.emit('stars',{x:o.x??960,y:o.y??420,count:26})}},o.at));
def('suspenseReveal','Suspense Reveal','رونمایی تعلیقی',(tl,el,o={})=>{const t=T();tl.set(el,{a:0},o.at);tl.fromTo(el,{a:0,s:.9,blur:t.b('medium')},{a:.32,s:.96,blur:t.b('soft')},{dur:t.d('xslow'),ease:'sineInOut'});tl.wait(o.hold??t.d('base'));return tl.to(el,{a:1,s:1,blur:0,flash:1},{dur:t.d('fast'),ease:'expoOut'}).to(el,{flash:0},{dur:t.d('base'),ease:'sineOut'})});
def('dramaticNumber','Dramatic Number Reveal','رونمایی دراماتیک عدد',(tl,el,o={})=>{const t=T();tl.set(el,{a:1,p:0},o.at);tl.to(el,{p:1},{dur:t.d('cinematic'),ease:'linear'});return P.numberPop(tl,el,{})});
def('hero3d','3D Hero Reveal','قهرمان سه‌بعدی',(tl,el,o={})=>{const t=T();tl.set(el,{a:1,p:0,cam:0},o.at);tl.to(el,{p:1},{dur:t.d('cinematic')*1.4,ease:'quintOut'});return tl.to(el,{cam:1},{dur:t.d('cinematic')*1.6,ease:'sineInOut',at:'<'})});
def('cameraPush','Camera Push','حرکت دوربین به جلو',(tl,el,o={})=>tl.to(el,{cam:1},{dur:T().d(o.dur||'cinematic'),ease:'sineInOut',at:o.at}));
def('cameraPull','Camera Pull','حرکت دوربین به عقب',(tl,el,o={})=>tl.to(el,{cam:0},{dur:T().d(o.dur||'cinematic'),ease:'sineInOut',at:o.at}));
def('parallaxReveal','Parallax Reveal','رونمایی پارالاکس',(tl,els,o={})=>{const t=T();const base=tl._pos(o.at);els.forEach((e,i)=>{const at=base+i*t.st('base');const d=t.dist('short')*(1+i*.8)*side(o);tl.set(e,{a:0},at);tl.fromTo(e,{x:d,a:0},{x:0,a:1},{dur:t.d('slow'),ease:t.e('enter'),at})});return tl});
def('lightSweep','Light Sweep','نور گذرا',(tl,el,o={})=>tl.fromTo(el,{sweep:0},{sweep:1},{dur:T().d(o.dur||'slow'),ease:'sineInOut',at:o.at}));
def('glassReveal','Glass Reveal','رونمایی شیشه‌ای',(tl,el,o={})=>{const t=T();tl.set(el,{a:0},o.at);return tl.fromTo(el,{a:0,glass:0,blur:t.b('heavy'),s:1.03},{a:1,glass:1,blur:0,s:1},{dur:t.d('slow'),ease:t.e('enter')})});
def('glitchReveal','Glitch Reveal','رونمایی گلیچ',(tl,el,o={})=>{const t=T();tl.set(el,{a:0,glitch:1},o.at);tl.to(el,{a:1},{dur:t.d('fast'),ease:'steps(4)'});return tl.to(el,{glitch:0},{dur:t.d('base'),ease:'steps(7)',at:'<'})});
def('particleBurst','Particle Burst','انفجار ذرات',(tl,el,o={})=>A.particleBurst(tl,el,o));
def('alertOn','Breaking/Alert Build','ورود هشدار',(tl,el,o={})=>{const t=T();tl.set(el,{a:1,wipe:0},o.at);tl.fromTo(el,{wipe:0,y:-t.dist('short')},{wipe:1,y:0},{dur:t.d('base'),ease:t.e('enter')});return P.alertPulse(tl,el,{n:1})});
B.presetCount=()=>Object.keys(P).length;
/* run a preset by id (studio + remote control) */
B.preset=(id,tl,el,o)=>{const f=P[id];if(!f)throw new Error('unknown preset '+id);return f(tl,el,o||{})};

/* ---------- renderer-side channel application (Canvas2D) ----------
   fx(ctx, el, cx, cy, w, h, draw, o): draw() paints in LOCAL coords centred on (0,0), size w×h.
   wipe = mask reveal (RTL by default: grows from the right edge, like Persian reading) · blur uses ctx.filter only on quality ≥ .55
   sweep = specular light sweep · glitch = offset slices · shake = seeded noise shake · flash = additive white · glow = soft brand glow */
const NZ=(t,s)=>B.noise?B.noise(t*23+s,s*1.7):Math.sin(t*50+s);
B.fx=function(ctx,el,cx,cy,w,h,draw,o={}){if(!el||el.a<=.003)return;const q=B.q();const t=(root.performance?performance.now():Date.now())/1000;
 ctx.save();ctx.globalAlpha*=clamp(el.a);let sx=0,sy=0;if(el.shake>0.001){const k=el.shake*18*B.a11y.k(o.channel||'PGM','shake');sx=NZ(t,1)*k;sy=NZ(t,2)*k*.6}
 ctx.translate(cx+el.x+sx,cy+el.y+sy);if(el.r)ctx.rotate(el.r);const S=el.s;if(S!==1||el.sx!==1||el.sy!==1)ctx.scale(S*el.sx,S*el.sy);
 const pad=o.pad??40;
 if(el.wipe<.999){const e=clamp(el.wipe);const dir=o.dir||'rtl';ctx.beginPath();
  if(dir==='rtl')ctx.rect(w/2-w*e-1,-h/2-pad,w*e+2,h+pad*2);else if(dir==='ltr')ctx.rect(-w/2-1,-h/2-pad,w*e+2,h+pad*2);else if(dir==='up')ctx.rect(-w/2-pad,h/2-h*e,w+pad*2,h*e+1);else if(dir==='down')ctx.rect(-w/2-pad,-h/2,w+pad*2,h*e);else ctx.rect(-w*e/2,-h/2-pad,w*e,h+pad*2);ctx.clip()}
 const useBlur=el.blur>.6&&q>.5&&!o.noBlur;if(useBlur)ctx.filter=`blur(${(el.blur*q).toFixed(1)}px)`;
 if(el.glow>.01&&q>.3&&o.glowColor){ctx.shadowColor=o.glowColor;ctx.shadowBlur=el.glow*B.T().em('glow')*40*q}
 try{draw(ctx)}catch(e){console.warn('[BMG fx]',e)}
 ctx.shadowColor='transparent';ctx.shadowBlur=0;if(useBlur)ctx.filter='none';
 if(el.sweep>0&&el.sweep<1&&q>.3)B.K&&B.K.sweep(ctx,-w/2,-h/2,w,h,el.sweep,{rtl:true,path:o.path,alpha:o.sweepAlpha??.45});
 if(el.flash>.01){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=clamp(el.flash)*.55*B.a11y.k(o.channel||'PGM','flash');ctx.fillStyle='#ffffff';if(o.path){o.path();ctx.fill()}else ctx.fillRect(-w/2,-h/2,w,h);ctx.restore()}
 if(el.glitch>.02&&B.a11y.k(o.channel||'PGM','glitch')>0){const n=Math.ceil(6*el.glitch);const br=B.brand?B.brand():{};ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const yy=-h/2+((NZ(t*.3,i)+1)/2)*h;const hh=4+Math.abs(NZ(t,i+9))*18;const dx=NZ(t*2,i+3)*40*el.glitch;ctx.globalAlpha=.35*el.glitch;ctx.fillStyle=i%2?(br.accent||'#27e0ff'):(br.primary||'#ff2e4d');ctx.fillRect(-w/2+dx,yy,w,hh)}ctx.restore()}
 ctx.restore()};
})(typeof window!=='undefined'?window:globalThis);
