/* DADASHMODE V8 · BMG · 2/8 · CANVAS 2D RENDERER ADAPTER + DRAWING KIT
   Why Canvas2D (spec §8 "lightest renderer"): the program output is the 1920×1080 stage canvas that MediaRecorder captures,
   so DOM/SVG graphics would never reach the recorded file. Text-heavy graphics (lower thirds, cards, tables) are drawn here;
   particle-heavy work goes to the WebGL2 adapter (bmg-gpu.js) and real 3D to the three.js adapter (bmg-3d.js).
   Persian kinetic typography: a cursive script breaks if letters are drawn one by one, so every per-character effect draws the
   FULL shaped string and reveals/moves clipped slices of it ("slice animation"). Tracking uses kashida (ـ) instead of
   letter-spacing, which would break the joins. Variable-font weight animation works with Vazirmatn / Estedad. */
(function(){
'use strict';
const B=window.BMG;const {clamp,lerp}=B.math;const K=B.K={};

/* ================= brand tokens (look) · independent from motion tokens ================= */
B.BRANDS={
 episode:{name:'تم همین قسمت (خودکار)',auto:true},
 studio:{name:'استودیو قرمز',primary:'#ff2e4d',secondary:'#ffd60a',accent:'#27e0ff',ink:'#fbf7ee',inkDim:'#b7bdd8',panel:'#0c1233',panel2:'#18215a',danger:'#ff2e4d',success:'#19e27a',gold:'#f5b82e',silver:'#c9d2e8',bronze:'#d38b4f',radius:18},
 nightGold:{name:'طلایی شب',primary:'#f5b82e',secondary:'#ff7a1a',accent:'#fff1c2',ink:'#fff8ec',inkDim:'#d6c7a3',panel:'#120c05',panel2:'#2a1c08',danger:'#ff4d3d',success:'#9be15d',gold:'#ffd166',silver:'#d8d8e0',bronze:'#c9834a',radius:10},
 arena:{name:'آرنای نئونی',primary:'#8b5cff',secondary:'#29f0c8',accent:'#ff4fa0',ink:'#f4f1ff',inkDim:'#a9a3cf',panel:'#0b0820',panel2:'#1c1446',danger:'#ff4f6d',success:'#29f0c8',gold:'#ffd23f',silver:'#c8c6e6',bronze:'#e09a5b',radius:6},
 paper:{name:'کاغذی روشن',primary:'#e2462f',secondary:'#1c1a17',accent:'#2c6bed',ink:'#1b1916',inkDim:'#5d5850',panel:'#f4efe6',panel2:'#e8e0d2',danger:'#d7263d',success:'#1f9d55',gold:'#c9971c',silver:'#9aa0a6',bronze:'#b06b35',radius:4},
 ice:{name:'یخ و برق',primary:'#5ec8ff',secondary:'#fff36b',accent:'#ffffff',ink:'#f5fbff',inkDim:'#a8c6dd',panel:'#07182e',panel2:'#0e2d55',danger:'#ff5a7a',success:'#5cf2a8',gold:'#ffd86b',silver:'#dbe7f5',bronze:'#d99a62',radius:24}};
const FONTS={display:'Lalezar',ui:'Vazirmatn',num:'Estedad'};
let BRAND=Object.assign({},B.BRANDS.studio);let BRAND_V=1;
B.brand=()=>BRAND;B.brandVersion=()=>BRAND_V;
B.setBrand=function(idOrObj,theme){let b;if(typeof idOrObj==='object'&&idOrObj)b=Object.assign({},B.BRANDS.studio,idOrObj);else if(idOrObj==='episode'||!B.BRANDS[idOrObj])b=fromTheme(theme);else b=Object.assign({},B.BRANDS[idOrObj]);
 b.fontDisplay=b.fontDisplay||(theme&&theme.font)||FONTS.display;b.fontUi=b.fontUi||FONTS.ui;b.fontNum=b.fontNum||FONTS.num;BRAND=b;BRAND_V++;K.flushCache();return b};
function fromTheme(th){th=th||{};const dk=c=>B.mix(c||'#000000','#000000',.55);return Object.assign({},B.BRANDS.studio,{name:'تم قسمت',primary:th.accent||'#ff2e4d',secondary:th.accent2||'#ffd60a',accent:th.accent2||'#27e0ff',ink:th.ink||'#fbf7ee',panel:dk(th.bg1||'#0c1233'),panel2:B.mix(th.bg2||'#18215a','#000000',.35),radius:18,fontDisplay:th.font||FONTS.display})}

/* ================= text ================= */
K.font=(role,size,weight)=>{const b=BRAND;const fam=role==='display'?b.fontDisplay||FONTS.display:role==='num'?b.fontNum||FONTS.num:b.fontUi||FONTS.ui;
 const w=weight||(role==='display'?400:role==='num'?900:800);return `${fam==='Lalezar'?400:w} ${Math.max(1,Math.round(size))}px "${fam}", Vazirmatn, Tahoma, sans-serif`};
const MC=new Map();
K.measure=(ctx,str,font)=>{const k=font+''+str;let w=MC.get(k);if(w==null){const f=ctx.font;ctx.font=font;w=ctx.measureText(str).width;ctx.font=f;if(MC.size>4000)MC.clear();MC.set(k,w)}return w};
K.fit=(ctx,str,role,size,maxW,weight)=>{const w=K.measure(ctx,str,K.font(role,size,weight));return w>maxW?Math.max(8,size*maxW/w):size};
const segmenter=(typeof Intl!=='undefined'&&Intl.Segmenter)?new Intl.Segmenter('fa',{granularity:'grapheme'}):null;
K.graphemes=str=>segmenter?Array.from(segmenter.segment(String(str)),s=>s.segment):Array.from(String(str));
const isRTL=s=>/[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/.test(s);
K.isRTL=isRTL;
/* draw text; returns width. o:{size,role,weight,color,align:'center'|'right'|'left',base,max,alpha,stroke,strokeW,shadow,glow,ls,skew} */
K.text=(ctx,str,x,y,o={})=>{str=String(str??'');if(!str)return 0;const role=o.role||'ui';let size=o.size||40;if(o.max)size=K.fit(ctx,str,role,size,o.max,o.weight);const font=K.font(role,size,o.weight);
 ctx.save();ctx.font=font;ctx.textAlign=o.align||'center';ctx.textBaseline=o.base||'middle';ctx.direction=isRTL(str)?'rtl':'ltr';if(o.alpha!=null)ctx.globalAlpha*=o.alpha;
 if(o.ls&&!isRTL(str)&&'letterSpacing' in ctx)ctx.letterSpacing=o.ls+'px';if(o.skew){ctx.translate(x,y);ctx.transform(1,0,o.skew,1,0,0);x=0;y=0}
 if(o.shadow){ctx.shadowColor=o.shadow.color||'rgba(0,0,0,.55)';ctx.shadowBlur=o.shadow.blur??12;ctx.shadowOffsetX=o.shadow.x||0;ctx.shadowOffsetY=o.shadow.y??4}
 if(o.stroke){ctx.lineJoin='round';ctx.lineWidth=o.strokeW||size*.12;ctx.strokeStyle=o.stroke;ctx.strokeText(str,x,y);ctx.shadowColor='transparent'}
 if(o.glow){ctx.shadowColor=o.glow;ctx.shadowBlur=o.glowBlur||size*.45;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0}
 ctx.fillStyle=o.color||BRAND.ink;ctx.fillText(str,x,y);const w=ctx.measureText(str).width;ctx.restore();return w};
/* kashida tracking for Persian (ـ between joining letters). amount 0..1 → up to `max` tatweels per gap */
const NONJOIN=new Set('اآأإدذرزژوؤةءٱ'.split(''));const LETTER=/[\u0620-\u064a\u066e-\u06d3\u06fa-\u06fc]/;
K.kashida=(str,amount,max=3)=>{const n=Math.round(clamp(amount)*max);if(!n)return str;const ch=Array.from(str);let out='';for(let i=0;i<ch.length;i++){out+=ch[i];const a=ch[i],b=ch[i+1];if(b&&LETTER.test(a)&&LETTER.test(b)&&!NONJOIN.has(a))out+='\u0640'.repeat(n)}return out};
/* grapheme slice bounds [{g,x0,x1}] measured from the anchor (RTL: from the right edge leftwards) */
const SB=new Map();
K.slices=(ctx,str,font)=>{const k=font+'\u0001'+str;if(SB.has(k))return SB.get(k);const g=K.graphemes(str);const rtl=isRTL(str);const total=K.measure(ctx,str,font);let acc='';const out=[];let prev=0;
 for(const c of g){acc+=c;const w=Math.min(total,K.measure(ctx,acc,font));out.push({g:c,a:prev,b:w,space:/^\s$/.test(c)});prev=w}if(SB.size>600)SB.clear();const r={total,rtl,list:out};SB.set(k,r);return r};
/* kinetic reveal of a single line. mode: wipe|char|word|type|blur|mask|drop|scale|track|weight|scramble
   p = 0..1 overall progress. The string is always drawn whole (joins intact); reveal is done with clips. */
K.reveal=(ctx,str,x,y,o,p,mode='wipe')=>{str=String(str??'');if(!str||p<=0)return;if(p>=1&&mode!=='scramble'&&mode!=='weight'&&mode!=='track'){K.text(ctx,str,x,y,o);return}
 const role=o.role||'ui';let size=o.size||40;if(o.max)size=K.fit(ctx,str,role,size,o.max,o.weight);const oo=Object.assign({},o,{size,max:0});const font=K.font(role,size,o.weight);
 const sl=K.slices(ctx,str,font);const W=sl.total,H=size*1.5;const align=o.align||'center';const rtl=sl.rtl;
 /* anchor → absolute right/left edge */
 const left=align==='center'?x-W/2:align==='right'?x-W:x;const right=left+W;
 const gx=s=>rtl?[right-s.b,right-s.a]:[left+s.a,left+s.b];
 if(mode==='wipe'||mode==='mask'){const e=B.easings.quartOut(p);ctx.save();ctx.beginPath();if(rtl)ctx.rect(right-W*e-2,y-H,W*e+4,H*2);else ctx.rect(left-2,y-H,W*e+4,H*2);ctx.clip();K.text(ctx,str,x,y,oo);ctx.restore();
  if(mode==='mask'&&p<1){const bx=rtl?right-W*e:left+W*e;ctx.save();ctx.fillStyle=o.maskColor||BRAND.primary;ctx.fillRect(bx-(rtl?0:8),y-H*.42,8,H*.84);ctx.restore()}return}
 if(mode==='blur'){ctx.save();ctx.globalAlpha*=clamp(p*1.4);const b=(1-p)*14*B.q();if(b>.5&&'filter' in ctx)ctx.filter=`blur(${b.toFixed(1)}px)`;const sc=lerp(1.08,1,B.easings.quartOut(p));ctx.translate(x,y);ctx.scale(sc,sc);K.text(ctx,str,0,0,oo);ctx.restore();return}
 if(mode==='weight'){const w=Math.round(lerp(o.fromWeight||200,o.weight||900,B.easings.expoOut(p)));K.text(ctx,str,x,y,Object.assign({},oo,{weight:w,alpha:(o.alpha??1)*clamp(p*3)}));return}
 if(mode==='track'){const s=rtl?K.kashida(str,1-B.easings.expoOut(p),4):str;K.text(ctx,s,x,y,Object.assign({},oo,{ls:rtl?0:(1-B.easings.expoOut(p))*size*.6,alpha:(o.alpha??1)*clamp(p*2)}));return}
 if(mode==='scramble'){K.text(ctx,K.scramble(str,p,o.seed||7),x,y,oo);return}
 if(mode==='type'){const g=sl.list;const n=g.length;const shown=Math.floor(p*n+1e-6);const upto=shown?g[Math.min(n,shown)-1].b:0;ctx.save();ctx.beginPath();if(rtl)ctx.rect(right-upto-1,y-H,upto+2,H*2);else ctx.rect(left-1,y-H,upto+2,H*2);ctx.clip();K.text(ctx,str,x,y,oo);ctx.restore();
  if(p<1&&(Math.floor((o.t||0)*3)%2===0||p<.98)){const cx=rtl?right-upto-6:left+upto+6;ctx.fillStyle=o.cursor||BRAND.secondary;ctx.fillRect(cx-2,y-size*.45,4,size*.9)}return}
 /* per-slice modes: char / drop / scale */
 const units=mode==='word'?wordsOf(sl.list):sl.list.map(s=>({a:s.a,b:s.b,space:s.space}));const n=units.length;const spread=o.spread??.55;
 units.forEach((u,i)=>{if(u.space)return;const st=(i/Math.max(1,n-1))*spread;const lp=clamp((p-st)/(1-spread));if(lp<=0)return;const e=B.easings.expoOut(lp);const [x0,x1]=gx(u);
  ctx.save();ctx.beginPath();ctx.rect(x0-1.5,y-H,x1-x0+3,H*2);ctx.clip();ctx.globalAlpha*=clamp(lp*2.2);
  if(mode==='drop'||mode==='char'||mode==='word'){ctx.translate(0,(1-e)*size*(mode==='drop'?-.9:.55))}if(mode==='scale'){const cx=(x0+x1)/2;ctx.translate(cx,y);ctx.scale(lerp(1.8,1,e),lerp(1.8,1,e));ctx.translate(-cx,-y)}
  K.text(ctx,str,x,y,oo);ctx.restore()})};
function wordsOf(list){const out=[];let cur=null;for(const s of list){if(s.space){if(cur){out.push(cur);cur=null}out.push({a:s.a,b:s.b,space:true});continue}if(!cur)cur={a:s.a,b:s.b};else cur.b=s.b}if(cur)out.push(cur);return out}
const SCR_FA='ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی',SCR_D='۰۱۲۳۴۵۶۷۸۹',SCR_L='ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
K.scramble=(str,p,seed=7)=>{const g=K.graphemes(str);const r=B.rng(seed+Math.floor(p*24));const n=g.length;const done=Math.floor(clamp(p)*n);
 return g.map((c,i)=>{if(i<done||/\s/.test(c))return c;const set=/[۰-۹0-9]/.test(c)?SCR_D:isRTL(c)?SCR_FA:SCR_L;return set[Math.floor(r()*set.length)]}).join('')};
/* ================= numbers: counter · odometer · slot · flip ================= */
K.counter=(from,to,p,dec=0)=>B.num(lerp(from,to,p),dec);
/* odometer: every digit rolls independently from its old value to its new one (digit-by-digit transition) */
K.odometer=(ctx,value,prev,p,x,y,o={})=>{const size=o.size||80;const font=K.font(o.role||'num',size,o.weight||900);const cur=String(Math.round(Math.abs(value))),old=String(Math.round(Math.abs(prev??value)));
 const len=Math.max(cur.length,old.length);const a=cur.padStart(len,' '),b=old.padStart(len,' ');const dw=K.measure(ctx,'۸',font)*1.02;const total=dw*len;const align=o.align||'center';
 let x0=align==='center'?x-total/2:align==='right'?x-total:x;ctx.save();ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=o.color||BRAND.ink;if(o.alpha!=null)ctx.globalAlpha*=o.alpha;
 const up=(value??0)>=(prev??0);for(let i=0;i<len;i++){const dNew=a[i],dOld=b[i];const cx=x0+dw*(i+.5);const lag=(len-1-i)*.12;const lp=clamp((p-lag)/(1-Math.min(.6,lag)));const e=o.ease?o.ease(lp):B.easings.expoOut(lp);
  ctx.save();ctx.beginPath();ctx.rect(cx-dw/2,y-size*.62,dw,size*1.24);ctx.clip();
  if(dNew===dOld||lp>=1){if(dNew!==' ')ctx.fillText(B.fa(dNew),cx,y)}else{const dir=up?-1:1;const off=size*1.1*e;if(dOld!==' ')ctx.fillText(B.fa(dOld),cx,y+dir*off);if(dNew!==' '){ctx.globalAlpha*=clamp(e*1.5);ctx.fillText(B.fa(dNew),cx,y-dir*(size*1.1-off))}}
  ctx.restore()}ctx.restore();return total};
/* slot machine: fast spin, decelerate, tiny settle bounce */
K.slot=(ctx,value,p,x,y,o={})=>{const size=o.size||120;const font=K.font('num',size,900);const str=String(Math.round(value));const dw=K.measure(ctx,'۸',font)*1.05;const n=str.length;const x0=x-dw*n/2;
 ctx.save();ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=o.color||BRAND.ink;
 for(let i=0;i<n;i++){const stop=.45+i*(.5/n);const lp=clamp(p/stop);const target=+str[i];const spins=6+i*2;const pos=lp>=1?target:(target+spins*(1-B.easings.cubicOut(lp))*10)%10;const settle=lp>=1?Math.sin(clamp((p-stop)/.12)*Math.PI)*.08*(1-clamp((p-stop)/.12)):0;
  const cx=x0+dw*(i+.5);ctx.save();ctx.beginPath();ctx.rect(cx-dw/2,y-size*.6,dw,size*1.2);ctx.clip();const f=pos%1,d=Math.floor(pos)%10;
  ctx.globalAlpha*=lp<1?.92:1;ctx.fillText(B.fa(d),cx,y+f*size*1.1+settle*size);ctx.fillText(B.fa((d+1)%10),cx,y-(1-f)*size*1.1+settle*size);ctx.restore()}ctx.restore()};
/* flip clock (split-flap halves) */
K.flip=(ctx,cur,prev,p,x,y,o={})=>{const size=o.size||90;const w=o.w||size*.9,h=size*1.25;const font=K.font('num',size,900);const draw=(txt,clipTop)=>{ctx.save();ctx.beginPath();ctx.rect(x-w/2,clipTop?y-h/2:y,w,h/2);ctx.clip();K.rrect(ctx,x-w/2,y-h/2,w,h,10);ctx.fillStyle=o.bg||BRAND.panel2;ctx.fill();ctx.font=font;ctx.fillStyle=o.color||BRAND.ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(B.fa(txt),x,y+size*.04);ctx.restore()};
 const e=clamp(p);draw(cur,true);draw(prev,false);if(e<1){if(e<.5){ctx.save();ctx.translate(x,y);ctx.scale(1,1-e*2);ctx.translate(-x,-y);draw(prev,true);ctx.restore()}else{ctx.save();ctx.translate(x,y);ctx.scale(1,(e-.5)*2);ctx.translate(-x,-y);draw(cur,false);ctx.restore()}}else draw(cur,false);
 ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-w/2,y-1,w,2)};

/* ================= shapes ================= */
K.rrect=(ctx,x,y,w,h,r)=>{r=Math.max(0,Math.min(r,Math.abs(h)/2,Math.abs(w)/2));ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()};
K.para=(ctx,x,y,w,h,sk)=>{ctx.beginPath();ctx.moveTo(x+sk,y);ctx.lineTo(x+w+sk,y);ctx.lineTo(x+w-sk,y+h);ctx.lineTo(x-sk,y+h);ctx.closePath()};
K.chamfer=(ctx,x,y,w,h,c)=>{ctx.beginPath();ctx.moveTo(x+c,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+h-c);ctx.lineTo(x+w-c,y+h);ctx.lineTo(x,y+h);ctx.lineTo(x,y+c);ctx.closePath()};
K.poly=(ctx,pts)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath()};
K.star=(ctx,x,y,r1,r2,n=5,rot=-Math.PI/2)=>{ctx.beginPath();for(let i=0;i<n*2;i++){const r=i%2?r2:r1,a=rot+i*Math.PI/n;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()};
/* panel: o {r,fill,fill2 (vertical gradient),stroke,strokeW,elev,glass,sheen,shape:'round'|'para'|'chamfer',skew,chamfer,alpha} */
K.panel=(ctx,x,y,w,h,o={})=>{if(w<=0||h<=0)return;const r=o.r??BRAND.radius;const path=()=>{if(o.shape==='para')K.para(ctx,x,y,w,h,o.skew||h*.25);else if(o.shape==='chamfer')K.chamfer(ctx,x,y,w,h,o.chamfer||h*.3);else K.rrect(ctx,x,y,w,h,r)};
 ctx.save();if(o.alpha!=null)ctx.globalAlpha*=o.alpha;const el=o.elev?B.T().el(o.elev):null;
 if(o.glass&&K.src){ctx.save();path();ctx.clip();K.frost(ctx,x,y,w,h,o.glass);ctx.restore()}
 path();if(el&&B.q()>.3){ctx.shadowColor=`rgba(0,0,0,${el.a})`;ctx.shadowBlur=el.blur*B.q();ctx.shadowOffsetY=el.y}
 if(o.fill2){const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,o.fill||BRAND.panel2);g.addColorStop(1,o.fill2);ctx.fillStyle=g}else ctx.fillStyle=o.fill||BRAND.panel;
 if(o.glass)ctx.globalAlpha*=.72;ctx.fill();ctx.shadowColor='transparent';if(o.glass)ctx.globalAlpha/=.72;
 if(o.sheen){const g=ctx.createLinearGradient(0,y,0,y+h*.55);g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fill()}
 if(o.stroke){ctx.lineWidth=o.strokeW||2;ctx.strokeStyle=o.stroke;ctx.stroke()}ctx.restore()};
/* ================= effects ================= */
/* light / specular / gradient sweep inside the current clip region */
K.sweep=(ctx,x,y,w,h,p,o={})=>{if(p<=0||p>=1)return;const ang=o.angle??-.35;const bw=o.width||Math.max(60,w*.18);const cx=lerp(x-bw*2,x+w+bw*2,o.rtl?1-p:p);ctx.save();ctx.beginPath();if(o.path)o.path();else ctx.rect(x,y,w,h);ctx.clip();
 ctx.translate(cx,y+h/2);ctx.rotate(ang);const g=ctx.createLinearGradient(-bw,0,bw,0);const c=o.color||'#ffffff';const a=o.alpha??.55;
 if(o.mode==='gradient'){g.addColorStop(0,B.rgba(c,0));g.addColorStop(.5,B.rgba(c,a));g.addColorStop(1,B.rgba(c,0))}else{g.addColorStop(0,B.rgba(c,0));g.addColorStop(.42,B.rgba(c,a*.25));g.addColorStop(.5,B.rgba(c,a));g.addColorStop(.58,B.rgba(c,a*.25));g.addColorStop(1,B.rgba(c,0))}
 ctx.globalCompositeOperation=o.mode==='specular'?'lighter':'source-atop';if(o.mode==='specular'||o.lighter)ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(-bw,-h*2,bw*2,h*4);ctx.restore()};
K.glowRect=(ctx,x,y,w,h,color,blur,alpha=1)=>{if(B.q()<.3)return;ctx.save();ctx.globalAlpha*=alpha;ctx.shadowColor=color;ctx.shadowBlur=blur*B.q();ctx.fillStyle=color;K.rrect(ctx,x,y,w,h,BRAND.radius);ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.25;ctx.fill();ctx.restore()};
K.flash=(ctx,a,color='#ffffff',ch='PGM')=>{a*=B.a11y.k(ch,'flash');if(a<=.003)return;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=clamp(a);ctx.fillStyle=color;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore()};
K.vignette=(ctx,a)=>{if(a<=0)return;const g=ctx.createRadialGradient(960,540,420,960,540,1180);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${a})`);ctx.fillStyle=g;ctx.fillRect(0,0,1920,1080)};
K.dim=(ctx,a,color='#05060f')=>{if(a<=0)return;ctx.save();ctx.globalAlpha*=a;ctx.fillStyle=color;ctx.fillRect(0,0,1920,1080);ctx.restore()};
/* impact ring / shockwave ring */
K.ring=(ctx,x,y,p,o={})=>{if(p<=0||p>=1)return;const r=lerp(o.r0||20,o.r1||420,B.easings.expoOut(p));ctx.save();ctx.globalAlpha*=(1-p)*(o.alpha??.9);ctx.lineWidth=(o.w||26)*(1-p)+1;ctx.strokeStyle=o.color||BRAND.secondary;if(B.q()>.5){ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=30}ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.restore()};
K.burstRays=(ctx,x,y,p,o={})=>{if(p<=0||p>=1)return;const n=o.n||18;const r0=lerp(40,200,B.easings.expoOut(p)),r1=lerp(80,(o.len||620),B.easings.expoOut(p));ctx.save();ctx.globalAlpha*=(1-p)*.85;ctx.strokeStyle=o.color||BRAND.secondary;ctx.lineCap='round';ctx.lineWidth=(o.w||10)*(1-p*.7);
 const rot=o.rot||0;for(let i=0;i<n;i++){const a=rot+i*Math.PI*2/n;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);ctx.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);ctx.stroke()}ctx.restore()};
K.streak=(ctx,x0,y0,x1,y1,p,o={})=>{if(p<=0||p>=1)return;const e=B.easings.expoOut(p),s=B.easings.expoIn(clamp(p*1.2));const ax=lerp(x0,x1,s),ay=lerp(y0,y1,s),bx=lerp(x0,x1,e),by=lerp(y0,y1,e);const g=ctx.createLinearGradient(ax,ay,bx,by);const c=o.color||BRAND.accent;g.addColorStop(0,B.rgba(c,0));g.addColorStop(1,B.rgba(c,.95));
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=g;ctx.lineCap='round';ctx.lineWidth=o.w||10;if(B.q()>.5){ctx.shadowColor=c;ctx.shadowBlur=24}ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();ctx.restore()};
K.flare=(ctx,x,y,k,o={})=>{if(k<=.01||B.q()<.3)return;const c=o.color||'#fff6d8';ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y,0,x,y,260*k);g.addColorStop(0,B.rgba(c,.9*k));g.addColorStop(.25,B.rgba(c,.25*k));g.addColorStop(1,B.rgba(c,0));ctx.fillStyle=g;ctx.fillRect(x-300*k,y-300*k,600*k,600*k);
 const h=ctx.createLinearGradient(x-900*k,y,x+900*k,y);h.addColorStop(0,B.rgba(c,0));h.addColorStop(.5,B.rgba(c,.55*k));h.addColorStop(1,B.rgba(c,0));ctx.fillStyle=h;ctx.fillRect(x-900*k,y-3*k,1800*k,6*k);
 [[-.6,24,.18],[.45,40,.12],[.9,16,.2]].forEach(([d,r,a])=>{ctx.fillStyle=B.rgba(o.ghost||BRAND.accent,a*k);ctx.beginPath();ctx.arc(x+(960-x)*d*2,y+(540-y)*d*2,r*k*2,0,Math.PI*2);ctx.fill()});ctx.restore()};
/* cached noise tile → film grain / turbulence overlay */
let NOISE=null;function noiseTile(){if(NOISE)return NOISE;const c=mk(256,256);const x=c.getContext('2d');const id=x.createImageData(256,256);const r=B.rng(99);for(let i=0;i<id.data.length;i+=4){const v=r()*255|0;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255}x.putImageData(id,0,0);NOISE=c;return c}
K.grain=(ctx,a,t=0,rect)=>{if(a<=0||B.q()<.3)return;const n=noiseTile();ctx.save();ctx.globalAlpha*=a;ctx.globalCompositeOperation='overlay';const ox=(t*997|0)%256,oy=(t*613|0)%256;ctx.translate(-ox,-oy);const pat=ctx.createPattern(n,'repeat');ctx.fillStyle=pat;
 const R=rect||[0,0,1920,1080];ctx.fillRect(R[0]+ox,R[1]+oy,R[2],R[3]);ctx.restore()};
K.scanlines=(ctx,a,rect)=>{if(a<=0)return;const R=rect||[0,0,1920,1080];ctx.save();ctx.globalAlpha*=a;ctx.fillStyle='rgba(0,0,0,.5)';for(let y=R[1];y<R[1]+R[3];y+=4)ctx.fillRect(R[0],y,R[2],2);ctx.restore()};
/* holographic foil sweep inside current clip */
K.holo=(ctx,x,y,w,h,t,a=.35)=>{ctx.save();ctx.globalCompositeOperation='overlay';ctx.globalAlpha*=a;const off=(t*120)%(w+400);const g=ctx.createLinearGradient(x-400+off,y,x+off,y+h);['#ff3d7f','#ffd23f','#3dffb0','#3db4ff','#b33dff','#ff3d7f'].forEach((c,i)=>g.addColorStop(i/5,c));ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.restore()};
/* frosted glass: blur what is already on the program canvas behind the rect (downsampled for speed) */
let FR=null;K.src=null;
K.frost=(ctx,x,y,w,h,k=1)=>{const src=K.src||ctx.canvas;if(!src||B.q()<.3)return;const sc=ctx.getTransform().a||1;const ds=6;const fw=Math.max(8,Math.ceil(w/ds)),fh=Math.max(8,Math.ceil(h/ds));if(!FR)FR=mk(fw,fh);if(FR.width<fw||FR.height<fh){FR.width=fw;FR.height=fh}
 const fx=FR.getContext('2d');fx.filter=`blur(${(2.4*k).toFixed(1)}px)`;fx.clearRect(0,0,FR.width,FR.height);try{fx.drawImage(src,x*sc,y*sc,w*sc,h*sc,0,0,fw,fh)}catch(e){return}fx.filter='none';ctx.save();ctx.globalAlpha*=clamp(k);ctx.drawImage(FR,0,0,fw,fh,x,y,w,h);ctx.restore()};
/* RGB split + glitch slices of an already rendered layer canvas */
K.rgbSplit=(ctx,layer,x,y,w,h,amt)=>{if(amt<=.2){ctx.drawImage(layer,x,y,w,h);return}ctx.save();ctx.globalCompositeOperation='lighter';[['#ff0040',-amt],['#00ff90',0],['#2060ff',amt]].forEach(([c,dx])=>{const t=tint(layer,c);ctx.drawImage(t,x+dx,y,w,h)});ctx.restore()};
const TINT=new Map();function tint(layer,color){const k=color;let c=TINT.get(k);if(!c){c=mk(layer.width,layer.height);TINT.set(k,c)}if(c.width!==layer.width||c.height!==layer.height){c.width=layer.width;c.height=layer.height}const x=c.getContext('2d');x.globalCompositeOperation='source-over';x.clearRect(0,0,c.width,c.height);x.drawImage(layer,0,0);x.globalCompositeOperation='multiply';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);x.globalCompositeOperation='destination-in';x.drawImage(layer,0,0);return c}
K.glitch=(ctx,layer,x,y,w,h,amt,seed)=>{if(amt<=.02){ctx.drawImage(layer,x,y,w,h);return}const r=B.rng(seed|0);const n=8+Math.floor(amt*10);const sh=layer.height/n;for(let i=0;i<n;i++){const off=(r()<amt?(r()-.5)*amt*120:0);const sy=i*sh;ctx.drawImage(layer,0,sy,layer.width,sh,x+off,y+sy*(h/layer.height),w,sh*(h/layer.height))}
 if(amt>.3&&B.q()>.5){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=amt*.5;ctx.drawImage(tint(layer,'#ff0050'),x-amt*18,y,w,h);ctx.drawImage(tint(layer,'#00e0ff'),x+amt*18,y,w,h);ctx.restore()}};
/* motion blur: draw `fn(dx,dy)` several times along the motion vector (only while moving) */
K.motionBlur=(ctx,vx,vy,fn,samples)=>{const sp=Math.hypot(vx,vy);const n=Math.min(samples||6,Math.floor(sp/6));if(n<2||B.q()<.5){fn(0,0);return}ctx.save();const a=ctx.globalAlpha;for(let i=n-1;i>=0;i--){ctx.globalAlpha=a*(i===0?1:.22*(1-i/n));fn(-vx*i/n,-vy*i/n)}ctx.restore()};
/* ================= offscreen layer cache (static parts are rendered once per data version) ================= */
function mk(w,h){if(typeof OffscreenCanvas!=='undefined'){try{return new OffscreenCanvas(w,h)}catch(e){}}const c=document.createElement('canvas');c.width=w;c.height=h;return c}
K.mk=mk;
const LAYERS=new Map();
K.layer=(key,w,h,draw,scale=1)=>{w=Math.max(1,Math.ceil(w*scale));h=Math.max(1,Math.ceil(h*scale));const k=key+'|'+BRAND_V+'|'+w+'x'+h;let L=LAYERS.get(k);if(L){LAYERS.delete(k);LAYERS.set(k,L);return L}
 L=mk(w,h);const x=L.getContext('2d');x.scale(scale,scale);try{draw(x)}catch(e){console.warn('[BMG layer]',e)}LAYERS.set(k,L);if(LAYERS.size>90){const first=LAYERS.keys().next().value;LAYERS.delete(first)}return L};
K.flushCache=()=>{LAYERS.clear();MC.clear();SB.clear();TINT.clear()};
K.cacheSize=()=>LAYERS.size;
/* safe areas (SMPTE-style): action 93% / title 90% of 1920×1080, configurable */
B.SAFE={action:{x:67,y:38,w:1786,h:1004},title:{x:96,y:54,w:1728,h:972}};
K.safeGuides=(ctx)=>{ctx.save();ctx.setLineDash([14,10]);ctx.lineWidth=2;ctx.strokeStyle='rgba(39,224,255,.55)';const a=B.SAFE.action,t=B.SAFE.title;ctx.strokeRect(a.x,a.y,a.w,a.h);ctx.strokeStyle='rgba(255,214,10,.6)';ctx.strokeRect(t.x,t.y,t.w,t.h);ctx.setLineDash([]);ctx.strokeStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.moveTo(960,520);ctx.lineTo(960,560);ctx.moveTo(940,540);ctx.lineTo(980,540);ctx.stroke();ctx.restore()};
/* renderer registry (spec §2/§8): explicit renderer choice per template */
B.RENDERERS={canvas2d:{name:'Canvas 2D (DOM-free, recorded)',available:()=>true},gpu2d:{name:'WebGL2 · 2D GPU (instancing)',available:()=>!!(B.gpu&&B.gpu.available())},
 three:{name:'Three.js · 3D (lazy)',available:()=>!!(B.three&&B.three.available())},lottie:{name:'Lottie (adapter slot · runtime not bundled)',available:()=>!!window.lottie},rive:{name:'Rive (adapter slot · runtime not bundled)',available:()=>!!window.rive}};
B.registerRenderer=(id,adapter)=>{B.RENDERERS[id]=adapter};
})();
