/* DADASHMODE V8 · Broadcast Motion Graphics (BMG) · 1/8 · CORE
   Architecture (spec §2):  DATA/EVENTS → EVENT BUS → GRAPHIC STATE MACHINE → TIMELINE/SEQUENCER → ANIMATION PRIMITIVES → RENDERER ADAPTERS → COMPOSITOR
   This file holds everything that is renderer-independent:
     · Motion Design Token System (§6)  · easing / spring / physics math (§3)  · deterministic channel clocks
     · Timeline engine with play/pause/resume/reverse/seek/progress/cancel/kill/restart/timeScale/labels/nesting (§11)
     · Broadcast event bus with coalescing (§5)  · object pools  · performance monitor + graceful degradation (§7)
   No DOM access here, so it also runs under Node for the self-test (tools/v8-selftest.mjs). */
(function(root){
'use strict';
const BMG=root.BMG=root.BMG||{};
BMG.version='1.0.0';

/* ================= math ================= */
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x;
const lerp=(a,b,t)=>a+(b-a)*t;
const inv=(a,b,x)=>b===a?0:(x-a)/(b-a);
BMG.math={clamp,lerp,inv,map:(x,a,b,c,d)=>c+(d-c)*clamp(inv(a,b,x)),smooth:t=>t*t*(3-2*t),
 fract:x=>x-Math.floor(x),deg:d=>d*Math.PI/180,wrap:(x,n)=>((x%n)+n)%n};

/* ================= seeded randomness + procedural noise ================= */
function hashStr(s){s=String(s);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
BMG.hash=hashStr;
BMG.rng=seed=>mulberry32(typeof seed==='number'?seed>>>0:hashStr(seed));
const P256=new Uint8Array(512);{const r=mulberry32(1337),p=[...Array(256).keys()];for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));[p[i],p[j]]=[p[j],p[i]]}for(let i=0;i<512;i++)P256[i]=p[i&255]}
const grad=(h,x,y)=>{const v=h&7;const u=v<4?x:y,w=v<4?y:x;return((v&1)?-u:u)+((v&2)?-2*w:2*w)};
const fade=t=>t*t*t*(t*(t*6-15)+10);
/* 2D gradient noise in [-1,1] (deterministic, used for noise-driven motion, shake, turbulence) */
function noise2(x,y){const X=Math.floor(x)&255,Y=Math.floor(y)&255;x-=Math.floor(x);y-=Math.floor(y);const u=fade(x),v=fade(y);
 const a=P256[X]+Y,b=P256[X+1]+Y;return lerp(lerp(grad(P256[a],x,y),grad(P256[b],x-1,y),u),lerp(grad(P256[a+1],x,y-1),grad(P256[b+1],x-1,y-1),u),v)*.25}
BMG.noise=noise2;
BMG.fbm=(x,y,oct=4)=>{let s=0,a=.5,f=1;for(let i=0;i<oct;i++){s+=a*noise2(x*f,y*f);f*=2;a*=.5}return s};

/* ================= easing vocabulary (§3 timing and easing) ================= */
function bezier(x1,y1,x2,y2){/* cubic-bezier() solver (Newton-Raphson, bisection fallback) */
 const cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx,cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
 const sx=t=>((ax*t+bx)*t+cx)*t,sy=t=>((ay*t+by)*t+cy)*t,dx=t=>(3*ax*t+2*bx)*t+cx;
 const solve=x=>{let t=x;for(let i=0;i<8;i++){const e=sx(t)-x;if(Math.abs(e)<1e-6)return t;const d=dx(t);if(Math.abs(d)<1e-6)break;t-=e/d}
  let a=0,b=1;t=x;for(let i=0;i<40;i++){const v=sx(t);if(Math.abs(v-x)<1e-6)return t;if(x>v)a=t;else b=t;t=(a+b)/2}return t};
 return x=>x<=0?0:x>=1?1:sy(solve(x))}
const powE=p=>[t=>t**p,t=>1-(1-t)**p,t=>t<.5?2**(p-1)*t**p:1-((-2*t+2)**p)/2];
const E={linear:t=>t};
[['quad',2],['cubic',3],['quart',4],['quint',5]].forEach(([n,p])=>{const f=powE(p);E[n+'In']=f[0];E[n+'Out']=f[1];E[n+'InOut']=f[2]});
E.sineIn=t=>1-Math.cos(t*Math.PI/2);E.sineOut=t=>Math.sin(t*Math.PI/2);E.sineInOut=t=>-(Math.cos(Math.PI*t)-1)/2;
E.expoIn=t=>t<=0?0:2**(10*t-10);E.expoOut=t=>t>=1?1:1-2**(-10*t);E.expoInOut=t=>t<=0?0:t>=1?1:t<.5?2**(20*t-10)/2:(2-2**(-20*t+10))/2;
E.circIn=t=>1-Math.sqrt(1-t*t);E.circOut=t=>Math.sqrt(1-(t-1)**2);E.circInOut=t=>t<.5?(1-Math.sqrt(1-(2*t)**2))/2:(Math.sqrt(1-(-2*t+2)**2)+1)/2;
const backIn=(s=1.70158)=>t=>(s+1)*t*t*t-s*t*t,backOut=(s=1.70158)=>t=>1+(s+1)*(t-1)**3+s*(t-1)**2,backInOut=(s=1.70158)=>{const c=s*1.525;return t=>t<.5?((2*t)**2*((c+1)*2*t-c))/2:((2*t-2)**2*((c+1)*(t*2-2)+c)+2)/2};
const elasticOut=(a=1,p=.3)=>t=>t<=0?0:t>=1?1:Math.max(1,a)*2**(-10*t)*Math.sin((t-p/(2*Math.PI)*Math.asin(1/Math.max(1,a)))*(2*Math.PI)/p)+1;
const elasticIn=(a=1,p=.3)=>{const o=elasticOut(a,p);return t=>1-o(1-t)};
const elasticInOut=(a=1,p=.45)=>{const o=elasticOut(a,p);return t=>t<.5?(1-o(1-2*t))/2:(1+o(2*t-1))/2};
const bounceOut=t=>{const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d)return n*(t-=1.5/d)*t+.75;if(t<2.5/d)return n*(t-=2.25/d)*t+.9375;return n*(t-=2.625/d)*t+.984375};
E.backIn=backIn();E.backOut=backOut();E.backInOut=backInOut();E.elasticIn=elasticIn();E.elasticOut=elasticOut();E.elasticInOut=elasticInOut();
E.bounceOut=bounceOut;E.bounceIn=t=>1-bounceOut(1-t);E.bounceInOut=t=>t<.5?(1-bounceOut(1-2*t))/2:(1+bounceOut(2*t-1))/2;
const steps=(n,jump='end')=>t=>{n=Math.max(1,n|0);if(t>=1)return 1;return jump==='start'?Math.min(1,Math.ceil(t*n)/n):Math.floor(t*n)/n};
/* broadcast-grade named curves */
E.standard=bezier(.2,0,0,1);E.emphasized=bezier(.05,.7,.1,1);E.accelerate=bezier(.3,0,.8,.15);E.decelerate=bezier(0,0,0,1);
E.broadcastIn=bezier(.16,1,.3,1);E.broadcastOut=bezier(.7,0,.84,0);E.snap=bezier(.2,.9,.1,1);
E.anticipate=bezier(.55,-.28,.68,.53);/* small pull-back before the move */E.anticipateOvershoot=bezier(.68,-.55,.27,1.55);
E.overshoot=backOut(1.35);E.settle=elasticOut(1,.55);E.inertia=bezier(.1,.7,.25,1);E.whip=bezier(.9,0,.1,1);
/* custom curve through points [[x,y],…] (monotone cubic in x) */
function customCurve(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]);if(pts[0][0]>0)pts.unshift([0,0]);if(pts[pts.length-1][0]<1)pts.push([1,1]);
 return t=>{let i=1;while(i<pts.length-1&&pts[i][0]<t)i++;const a=pts[i-1],b=pts[i];const u=inv(a[0],b[0],t);const s=u*u*(3-2*u);return lerp(a[1],b[1],s)}}

/* ================= springs (mass-spring-damper, analytic) ================= */
/* unit step 0→1 with initial velocity v0 (units of "whole distance per second"). Returns {f(t), dur, vel(t)} */
function spring(o={}){const k=o.k??o.stiffness??300,c=o.c??o.damping??26,m=o.m??o.mass??1,v0=o.v0??o.velocity??0;
 const w0=Math.sqrt(k/m),z=c/(2*Math.sqrt(k*m));let f;
 if(z<1){const wd=w0*Math.sqrt(1-z*z),a=z*w0,B=(a-v0)/wd;f=t=>1-Math.exp(-a*t)*(Math.cos(wd*t)+B*Math.sin(wd*t))}
 else if(Math.abs(z-1)<1e-6){const B=w0-v0;f=t=>1-Math.exp(-w0*t)*(1+B*t)}
 else{const s=Math.sqrt(z*z-1),r1=-w0*(z-s),r2=-w0*(z+s),C2=(-v0-r1)/(r2-r1),C1=1-C2;f=t=>1-(C1*Math.exp(r1*t)+C2*Math.exp(r2*t))}
 const vel=t=>(f(t+1e-4)-f(t))/1e-4;let dur=0;for(let t=0;t<12;t+=1/240){if(Math.abs(1-f(t))<.0008&&Math.abs(vel(t))<.02){let ok=true;for(let u=t;u<t+.25;u+=1/60)if(Math.abs(1-f(u))>.0008){ok=false;break}if(ok){dur=t;break}}}
 if(!dur)dur=12;return {f,dur,vel,z,w0}}
BMG.spring=spring;

/* ================= Motion Design Token System (§6) =================
   Every template reads timing from here. Nothing hard-codes a duration or curve on its own. */
const DEF_TOKENS={
 duration:{instant:.08,micro:.16,fast:.26,base:.42,slow:.66,xslow:1.0,cinematic:1.6,hold:3.2},
 easing:{standard:'standard',enter:'broadcastIn',exit:'broadcastOut',emphasis:'emphasized',move:'quintInOut',snap:'snap',linear:'linear',anticipate:'anticipate',overshoot:'overshoot',settle:'settle',inertia:'inertia',whip:'whip'},
 spring:{snappy:{k:520,c:36,m:1},gentle:{k:170,c:24,m:1},bouncy:{k:340,c:15,m:1},heavy:{k:260,c:34,m:2.4},settle:{k:420,c:22,m:1}},
 stagger:{tight:.035,base:.065,loose:.11,cascade:.17},
 blur:{none:0,soft:6,medium:14,heavy:28,motion:22},
 elevation:{e0:{blur:0,y:0,a:0},e1:{blur:14,y:5,a:.28},e2:{blur:30,y:12,a:.36},e3:{blur:64,y:24,a:.46}},
 opacity:{ghost:.12,dim:.42,muted:.72,full:1},
 scale:{enterFrom:.86,pop:1.08,overscale:1.16,punch:1.3,settleUnder:.975},
 emphasis:{pulseScale:1.06,pulseDur:.34,alertScale:1.1,flash:.55,glow:.8},
 distance:{nudge:14,short:56,medium:160,long:460,offscreen:1200}};
const deepMerge=(a,b)=>{const o=Array.isArray(a)?a.slice():Object.assign({},a);if(b&&typeof b==='object')for(const k in b){const v=b[k];o[k]=v&&typeof v==='object'&&!Array.isArray(v)&&a&&typeof a[k]==='object'?deepMerge(a[k],v):v}return o};
BMG.deepMerge=deepMerge;
BMG.DEF_TOKENS=DEF_TOKENS;
BMG.tokens=deepMerge(DEF_TOKENS,{});
BMG.motion={durationScale:1};/* global tempo (e.g. 1.15 = everything 15% slower); set by the episode / studio */
/* token accessor with per-template overrides: T.d('slow') T.e('enter') T.s('snappy') T.st('base') */
BMG.T=function(over){const tk=over?deepMerge(BMG.tokens,over):BMG.tokens;const sc=BMG.motion.durationScale||1;
 return {raw:tk,d:k=>(typeof k==='number'?k:(tk.duration[k]??tk.duration.base))*sc,e:k=>BMG.ease(tk.easing[k]||k),s:k=>tk.spring[k]||tk.spring.snappy,st:k=>(typeof k==='number'?k:(tk.stagger[k]??tk.stagger.base))*sc,
  b:k=>tk.blur[k]??0,el:k=>tk.elevation[k]||tk.elevation.e1,o:k=>tk.opacity[k]??1,sc:k=>tk.scale[k]??1,em:k=>tk.emphasis[k],dist:k=>tk.distance[k]??0}};

/* ease resolver: 'expoOut' · 'back.out(1.6)' · 'cubic(0.2,0,0,1)' / 'cubic-bezier(…)' · 'steps(6)' · 'elastic.out(1,0.4)' · 'spring(snappy)' · token name · function */
const EC=new Map();
BMG.ease=function(spec){if(typeof spec==='function')return spec;if(!spec)return E.standard;if(E[spec])return E[spec];if(EC.has(spec))return EC.get(spec);let f=null;const s=String(spec).trim();
 const tk=BMG.tokens&&BMG.tokens.easing&&BMG.tokens.easing[s];if(tk&&tk!==s)f=BMG.ease(tk);
 let m;if(!f&&(m=s.match(/^(?:cubic|cubic-bezier)\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/)))f=bezier(+m[1],+m[2],+m[3],+m[4]);
 if(!f&&(m=s.match(/^steps\(\s*(\d+)\s*(?:,\s*(start|end))?\s*\)$/)))f=steps(+m[1],m[2]);
 if(!f&&(m=s.match(/^back\.(in|out|inOut)(?:\(([-\d.]+)\))?$/)))f=({in:backIn,out:backOut,inOut:backInOut})[m[1]](m[2]!=null?+m[2]:undefined);
 if(!f&&(m=s.match(/^elastic\.(in|out|inOut)(?:\(([-\d.]+)\s*,\s*([-\d.]+)\))?$/)))f=({in:elasticIn,out:elasticOut,inOut:elasticInOut})[m[1]](m[2]!=null?+m[2]:undefined,m[3]!=null?+m[3]:undefined);
 if(!f&&(m=s.match(/^spring\(\s*([a-z]+|[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?)\s*\)$/i))){const a=m[1].split(',').map(x=>x.trim());const o=a.length>1?{k:+a[0],c:+a[1],m:+(a[2]||1)}:(BMG.tokens.spring[a[0]]||BMG.tokens.spring.snappy);const sp=spring(o);f=t=>sp.f(t*sp.dur)}
 if(!f&&(m=s.match(/^pow\(\s*([\d.]+)\s*\)\.(in|out|inOut)$/))){const pf=powE(+m[1]);f=pf[{in:0,out:1,inOut:2}[m[2]]]}
 if(!f)f=E.standard;EC.set(spec,f);return f};
BMG.easings=E;BMG.bezier=bezier;BMG.steps=steps;BMG.customCurve=customCurve;
BMG.EASE_NAMES=Object.keys(E);

/* ================= value interpolation ================= */
const HEX=/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
function parseColor(c){if(Array.isArray(c))return c;c=String(c).trim();let m;
 if(HEX.test(c)){let h=c.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h.slice(0,6),16);return [n>>16&255,n>>8&255,n&255,h.length===8?parseInt(h.slice(6),16)/255:1]}
 if((m=c.match(/^rgba?\(([^)]+)\)$/))){const p=m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);return [p[0],p[1],p[2],p[3]??1]}return null}
BMG.parseColor=parseColor;
BMG.rgba=(c,a)=>{const p=parseColor(c)||[255,255,255,1];return `rgba(${Math.round(p[0])},${Math.round(p[1])},${Math.round(p[2])},${a==null?p[3]:a*p[3]})`};
BMG.mix=(a,b,t)=>{const A=parseColor(a)||[0,0,0,1],B=parseColor(b)||[0,0,0,1];return `rgba(${Math.round(lerp(A[0],B[0],t))},${Math.round(lerp(A[1],B[1],t))},${Math.round(lerp(A[2],B[2],t))},${lerp(A[3],B[3],t).toFixed(3)})`};
function interp(a,b,t){if(typeof b==='number')return lerp(+a||0,b,t);if(Array.isArray(b)&&Array.isArray(a)&&typeof b[0]==='number')return b.map((v,i)=>lerp(a[i]??v,v,t));
 if(typeof b==='string'&&(HEX.test(b)||/^rgba?\(/.test(b))){return BMG.mix(a??b,b,t)}return t<1?a:b}
BMG.interp=interp;
const getv=(o,k)=>{if(k.indexOf('.')<0)return o[k];return k.split('.').reduce((x,y)=>x==null?x:x[y],o)};
const setv=(o,k,v)=>{if(k.indexOf('.')<0){o[k]=v;return}const p=k.split('.');let x=o;for(let i=0;i<p.length-1;i++){if(x[p[i]]==null)x[p[i]]={};x=x[p[i]]}x[p[p.length-1]]=v};
BMG.getv=getv;BMG.setv=setv;

/* ================= channel clocks (deterministic, time-based) =================
   PGM = program output (recorded), PVW = preview monitor. Each has its own clock, so scrubbing the preview never touches the program. */
class Clock{constructor(name){this.name=name;this.time=0;this.timeScale=1;this.items=new Set();this.frame=0;this.fps=60}
 add(tl){this.items.add(tl)}remove(tl){this.items.delete(tl)}
 tick(dt){dt=clamp(dt,0,.5)*this.timeScale;this.time+=dt;this.frame++;for(const tl of Array.from(this.items)){try{tl._advance(dt)}catch(e){console.warn('[BMG timeline]',e);this.items.delete(tl)}}}
 get active(){return this.items.size}}
BMG.Clock=Clock;
BMG.clocks={PGM:new Clock('PGM'),PVW:new Clock('PVW')};

/* ================= Timeline / Sequencer (§11) ================= */
let TLID=0;
class Tween{constructor(target,to,o={}){this.kind='tween';this.target=target;this.to=to;this.from=o.from||null;this.dur=Math.max(0,o.dur??.42);this.ease=BMG.ease(o.ease);this.onUpdate=o.onUpdate||null;this.f=null;this.lastP=-1}
 capture(){if(this.f)return;const f={};for(const k in this.to)f[k]=this.from&&k in this.from?this.from[k]:getv(this.target,k);this.f=f}
 render(p){this.capture();if(p===this.lastP)return;this.lastP=p;const e=this.dur?this.ease(p):(p>0?1:0);for(const k in this.to)setv(this.target,k,interp(this.f[k],this.to[k],e));if(this.onUpdate)this.onUpdate(e,p)}}
class SpringTween extends Tween{constructor(target,to,o={}){super(target,to,o);this.kind='spring';this.sp=spring(o.spring||o);this.dur=o.dur??this.sp.dur;this.ease=t=>this.sp.f(t*this.sp.dur)}}
class Sim{constructor(fn,dur){this.kind='sim';this.fn=fn;this.dur=dur??1e9;this.age=0}render(){}step(dt,local){this.age=local;this.fn(dt,local)}}
class Timeline{
 constructor(o={}){this.id=++TLID;this.kind='timeline';this.name=o.name||'';this.children=[];this.labels={};this.time=0;this.dur=0;this._ts=1;this.reversed=false;
  this.state='idle';this.repeat=o.repeat||0;this.yoyo=!!o.yoyo;this.iter=0;this.cb={onStart:o.onStart,onUpdate:o.onUpdate,onComplete:o.onComplete,onReverseComplete:o.onReverseComplete,onInterrupt:o.onInterrupt};
  this.clock=o.clock||BMG.clocks.PGM;this.parent=null;this.data=o.data||null;this.lastEnd=0;this.lastStart=0;if(o.paused!==true&&o.autoplay)this.play()}
 _pos(at){/* position parser: number · '+=0.2' · '-=0.1' · '<' (start of previous) · '>' (end of previous) · 'label' · 'label+=0.3' */
  if(at==null)return this.lastEnd;if(typeof at==='number')return at;const s=String(at);let m;
  if(s==='<')return this.lastStart;if(s==='>')return this.lastEnd;if((m=s.match(/^([+-])=([\d.]+)$/)))return this.lastEnd+(m[1]==='+'?1:-1)*+m[2];
  if((m=s.match(/^<([+-])=?([\d.]+)$/)))return this.lastStart+(m[1]==='+'?1:-1)*+m[2];
  if((m=s.match(/^([^+\-]+)(?:([+-])=([\d.]+))?$/))&&m[1] in this.labels)return this.labels[m[1]]+(m[2]?(m[2]==='+'?1:-1)*+m[3]:0);return this.lastEnd}
 _push(item,at,dur){const start=Math.max(0,this._pos(at));this.children.push({item,start,dur,fired:false});this.lastStart=start;this.lastEnd=start+dur;this.dur=Math.max(this.dur,start+dur);
  if(item.kind==='timeline')item.parent=this;return this}
 to(target,to,o={}){const tw=new Tween(target,to,o);return this._push(tw,o.at??(o.delay!=null?'+='+o.delay:undefined),tw.dur)}
 fromTo(target,from,to,o={}){return this.to(target,to,Object.assign({},o,{from}))}
 from(target,from,o={}){const to={};for(const k in from)to[k]=getv(target,k);return this.to(target,to,Object.assign({},o,{from}))}
 set(target,props,at){const tw=new Tween(target,props,{dur:0});return this._push(tw,at,0)}
 spring(target,to,o={}){const tw=new SpringTween(target,to,o);return this._push(tw,o.at,tw.dur)}
 call(fn,at){return this._push({kind:'call',fn},at,0)}
 sim(fn,dur,at){return this._push(new Sim(fn,dur),at,dur??0)}
 add(child,at){if(!child)return this;if(child instanceof Timeline){child.clock=null;return this._push(child,at,child.totalDuration())}if(child.kind)return this._push(child,at,child.dur||0);return this}
 addLabel(name,at){this.labels[name]=at==null?this.lastEnd:this._pos(at);return this}
 wait(sec){this.lastEnd+=sec;this.dur=Math.max(this.dur,this.lastEnd);return this}
 stagger(targets,to,o={}){const n=targets.length;const each=o.each??BMG.T().st('base');const from=o.from||'start';const base=this._pos(o.at);
  const order=i=>from==='end'?n-1-i:from==='center'?Math.abs(i-(n-1)/2):from==='edges'?(n-1)/2-Math.abs(i-(n-1)/2):typeof from==='number'?Math.abs(i-from):i;
  let end=base;targets.forEach((t,i)=>{const oo=Object.assign({},o,{from:o.fromValues||null});const tw=o.spring?new SpringTween(t,typeof to==='function'?to(t,i):to,oo):new Tween(t,typeof to==='function'?to(t,i):to,oo);const st=base+order(i)*each;this.children.push({item:tw,start:st,dur:tw.dur,fired:false});end=Math.max(end,st+tw.dur)});
  this.lastStart=base;this.lastEnd=end;this.dur=Math.max(this.dur,end);return this}
 totalDuration(){return this.repeat<0?1e9:this.dur*(this.repeat+1)}
 /* render at local time t (no side effects on the clock) */
 render(t,dt=0){const prev=this.time;this.time=t;const lt=this._iterTime(t);
  for(const c of this.children){const it=c.item;const local=lt-c.start;
   if(it.kind==='call'){if(!c.fired&&lt>=c.start&&prev<=t){c.fired=true;try{it.fn()}catch(e){console.warn(e)}}else if(lt<c.start)c.fired=false;continue}
   if(it.kind==='timeline'){if(local>=0||it.time>0)it.render(clamp(local,0,it.totalDuration()),dt);continue}
   if(it.kind==='sim'){if(local>=0&&local<=it.dur&&dt>0)it.step(dt,local);continue}
   if(local<0){if(it.lastP>0)it.render(0);continue}
   it.render(c.dur>0?clamp(local/c.dur):1)}
  if(this.cb.onUpdate)this.cb.onUpdate(this.progress())}
 _iterTime(t){if(!this.repeat||!this.dur)return Math.min(t,this.dur);const it=Math.floor(t/this.dur);const r=t-it*this.dur;this.iter=it;return this.yoyo&&it%2===1?this.dur-r:Math.min(r,this.dur)}
 _advance(dt){if(this.state!=='playing')return;const tot=this.totalDuration();let t=this.time+dt*this._ts*(this.reversed?-1:1);
  if(!this.reversed&&t>=tot){this.render(tot,dt);this._finish('onComplete');return}
  if(this.reversed&&t<=0){this.render(0,dt);this._finish('onReverseComplete');return}this.render(t,dt)}
 _finish(cb){this.state='done';if(this.clock)this.clock.remove(this);const f=this.cb[cb];if(f)try{f(this)}catch(e){console.warn(e)}}
 /* ----- controls ----- */
 play(clock){if(clock)this.clock=clock;if(this.state==='killed')return this;if(this.state==='idle'&&this.cb.onStart)try{this.cb.onStart(this)}catch(e){}this.reversed=false;if(this.time>=this.totalDuration()&&this.state==='done')this.time=0;this.state='playing';if(this.clock){this.clock.add(this);if(this.time===0)this.render(0,0)}return this}
 pause(){if(this.state==='playing')this.state='paused';return this}
 resume(){if(this.state==='paused'){this.state='playing';this.clock&&this.clock.add(this)}return this}
 reverse(){this.reversed=!this.reversed;if(this.state==='done'||this.state==='paused'||this.state==='idle'){this.state='playing';this.clock&&this.clock.add(this)}return this}
 seek(t){const pos=typeof t==='string'?(this.labels[t]??0):t;this.render(clamp(pos,0,this.totalDuration()),0);return this}
 progress(p){if(p==null)return this.totalDuration()?clamp(this.time/this.totalDuration()):1;return this.seek(p*this.totalDuration())}
 restart(){this.time=0;this.children.forEach(c=>{c.fired=false});this.state='idle';return this.play()}
 timeScale(n){if(n==null)return this._ts;this._ts=Math.max(.01,n);return this}
 /* cancel = stop where it is (values stay, nothing jumps) · kill = stop, forget, release */
 cancel(){if(this.state==='playing'||this.state==='paused'){this.state='cancelled';this.clock&&this.clock.remove(this);if(this.cb.onInterrupt)try{this.cb.onInterrupt(this)}catch(e){}}return this}
 kill(){this.cancel();this.state='killed';this.children.length=0;this.labels={};return this}
 isActive(){return this.state==='playing'}
 then(){return new Promise(r=>{if(this.state==='done')return r(this);const a=this.cb.onComplete,b=this.cb.onInterrupt;this.cb.onComplete=x=>{a&&a(x);r(x)};this.cb.onInterrupt=x=>{b&&b(x);r(x)}})}}
BMG.Timeline=Timeline;BMG.Tween=Tween;BMG.SpringTween=SpringTween;
BMG.timeline=o=>new Timeline(o);
BMG.activeTimelines=()=>Object.values(BMG.clocks).reduce((n,c)=>n+c.active,0);

/* ================= event bus with coalescing (§5 "rapid events must be coalesced") ================= */
const subs={};const pending=new Map();let flushQueued=false;
BMG.bus={
 on(type,fn){(subs[type]=subs[type]||new Set()).add(fn);return()=>subs[type]&&subs[type].delete(fn)},
 once(type,fn){const off=this.on(type,d=>{off();fn(d)});return off},
 emit(type,data){const s=subs[type];if(s)for(const f of Array.from(s)){try{f(data)}catch(e){console.warn('[BMG bus]',type,e)}}const w=subs['*'];if(w)for(const f of Array.from(w)){try{f({type,data})}catch(e){}}},
 /* coalesce(type,key,data): several events with the same key inside one frame → only the last one is delivered */
 coalesce(type,key,data){pending.set(type+''+key,{type,data});if(!flushQueued){flushQueued=true;(root.requestAnimationFrame||(f=>setTimeout(f,16)))(()=>BMG.bus.flush())}},
 flush(){flushQueued=false;const items=Array.from(pending.values());pending.clear();items.forEach(x=>BMG.bus.emit(x.type,x.data))},
 count:()=>Object.values(subs).reduce((n,s)=>n+s.size,0)};

/* ================= object pool ================= */
class Pool{constructor(make,reset,n=0){this.make=make;this.reset=reset;this.free=[];this.made=0;for(let i=0;i<n;i++){this.free.push(make());this.made++}}
 get(){if(this.free.length)return this.free.pop();this.made++;return this.make()}put(o){if(this.reset)this.reset(o);this.free.push(o)}}
BMG.Pool=Pool;

/* ================= performance instrumentation (§7) =================
   frame time ring buffer, fps, p95, dropped frames, BMG render cost, and a 3-level graceful degradation:
   level 0 full · level 1 fewer particles, cheaper blur/glow · level 2 "30 fps profile": no blur, minimal particles, cached layers only */
BMG.perf={N:240,ft:new Float32Array(240),cost:new Float32Array(240),i:0,n:0,last:0,dropped:0,level:0,forced:null,target:60,_hi:0,_lo:0,
 frame(now){if(this.last){const dt=now-this.last;if(dt>0&&dt<1000){this.ft[this.i]=dt;this.i=(this.i+1)%this.N;this.n=Math.min(this.N,this.n+1);if(dt>1500/this.target)this.dropped++;this._adapt(dt)}}this.last=now},
 addCost(ms){this.cost[(this.i+this.N-1)%this.N]=ms},
 _adapt(dt){if(this.forced!=null){this.level=this.forced;return}const budget=1000/this.target;
  if(dt>budget*1.35){this._hi+=dt;this._lo=0}else if(dt<budget*1.08){this._lo+=dt;this._hi=Math.max(0,this._hi-dt*.5)}
  if(this._hi>2200&&this.level<2){this.level++;this._hi=0;BMG.bus.emit('perf.level',this.level)}
  if(this._lo>6000&&this.level>0){this.level--;this._lo=0;BMG.bus.emit('perf.level',this.level)}},
 stats(){const n=this.n;if(!n)return {fps:0,avg:0,p95:0,worst:0,cost:0,dropped:this.dropped,level:this.level};const a=Array.from(this.ft.slice(0,n)).sort((x,y)=>x-y);const avg=a.reduce((s,x)=>s+x,0)/n;
  const c=Array.from(this.cost.slice(0,n));return {fps:1000/avg,avg,p95:a[Math.floor(n*.95)],worst:a[n-1],cost:c.reduce((s,x)=>s+x,0)/n,costMax:Math.max(...c),dropped:this.dropped,level:this.level}},
 reset(){this.n=0;this.i=0;this.dropped=0;this.last=0}};
/* quality scalar used by renderers: 1 / .55 / .25 */
BMG.q=()=>[1,.55,.25][BMG.perf.level]||1;

/* ================= accessibility (§7 reduced motion without breaking broadcast mode) =================
   reduced motion affects the operator UI and preview; the program output keeps its choreography and only drops
   photosensitive effects (flash / strobe / heavy shake) when «safe motion on program» is enabled. */
BMG.a11y={reduced:false,safeProgram:false,
 k(channel,kind){/* intensity multiplier for shake/flash/glitch/strobe */const r=channel==='PGM'?this.safeProgram:this.reduced||this.safeProgram;return r?(kind==='flash'?.25:kind==='shake'?.2:kind==='glitch'?0:.4):1}};
try{if(root.matchMedia){const mq=root.matchMedia('(prefers-reduced-motion: reduce)');BMG.a11y.reduced=mq.matches;mq.addEventListener&&mq.addEventListener('change',e=>BMG.a11y.reduced=e.matches)}}catch(e){}

/* ================= persian formatting helpers (shared) ================= */
BMG.fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\./g,'٫');
BMG.en=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
BMG.num=(v,dec=0)=>BMG.fa((+v||0).toFixed(dec));
})(typeof window!=='undefined'?window:globalThis);
