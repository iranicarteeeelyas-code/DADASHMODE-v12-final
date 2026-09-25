/* DADASHMODE V8 · BMG · 3/8 · WEBGL2 "2D GPU" RENDERER ADAPTER
   Replaces PixiJS for this offline app (no dependency): GPU instancing for thousands of 2D particles + procedural full-screen shaders.
   · Stateless GPU particles: each particle is spawned ONCE into a ring buffer (x0,y0,v0,t0,life,size,rot,drag,gravity,shape,colour);
     its whole motion is evaluated analytically in the vertex shader (drag + gravity closed form), so nothing is created,
     destroyed or re-uploaded per frame (object pooling at the buffer level, spec §7).
   · Two pools: normal (premultiplied alpha: confetti, smoke, coins) and additive (sparks, dust, stars, energy).
   · Full-screen programs: energy field (noise-driven, data/audio-reactive), luma wipe, radial wipe (stinger transitions).
   · Composited into the recorded stage canvas; Canvas2D fallback when WebGL2 is missing. */
(function(){
'use strict';
const B=window.BMG;const {clamp,lerp}=B.math;
const STRIDE=17,CAP=8192;/* per pool */
let cv=null,gl=null,ok=null,prog=null,fprog=null,qbuf=null,fbuf=null,U={},FU={};let T=0,lastNow=0;const pools={};
const VS=`#version 300 es
layout(location=0) in vec2 corner;layout(location=1) in vec4 a0;layout(location=2) in vec4 a1;layout(location=3) in vec4 a2;layout(location=4) in vec4 a3;layout(location=5) in float a4;
uniform float uT;uniform vec2 uRes;out vec2 vUV;out vec4 vCol;out float vShape;out float vFade;
void main(){float age=uT-a1.x;float life=a1.y;if(age<0.0||age>life){gl_Position=vec4(3.0,3.0,0.0,1.0);return;}
 float k=max(a2.y,0.001);float g=a2.z;float e=exp(-k*age);vec2 v0=a0.zw;
 vec2 pos=a0.xy+v0*(1.0-e)/k+vec2(0.0,g)*(age/k-(1.0-e)/(k*k));vec2 vel=v0*e+vec2(0.0,g)*(1.0-e)/k;
 float rot=a1.w+a2.x*age;float fl=a4>0.0?max(0.15,abs(cos(age*a4+a1.w))):1.0;float size=a1.z*(1.0-0.35*age/life);vec2 c=corner;
 if(a2.w>1.5&&a2.w<2.5){float sp=length(vel);vec2 dir=sp>1.0?vel/sp:vec2(1.0,0.0);vec2 nr=vec2(-dir.y,dir.x);float len=size*(1.0+min(sp/260.0,5.0));pos+=dir*c.x*len+nr*c.y*size*0.32;}
 else{c.y*=fl;float cs=cos(rot),sn=sin(rot);pos+=vec2(c.x*cs-c.y*sn,c.x*sn+c.y*cs)*size;}
 vec2 clip=(pos/uRes)*2.0-1.0;clip.y=-clip.y;gl_Position=vec4(clip,0.0,1.0);
 vUV=corner;vCol=a3;vShape=a2.w;vFade=clamp((life-age)/min(0.6,life*0.45),0.0,1.0)*clamp(age/0.04,0.0,1.0);}`;
const FS=`#version 300 es
precision mediump float;in vec2 vUV;in vec4 vCol;in float vShape;in float vFade;out vec4 o;
void main(){vec2 p=vUV;float r=length(p);float a=1.0;
 if(vShape<0.5){a=1.0-smoothstep(0.82,1.0,max(abs(p.x),abs(p.y)));}
 else if(vShape<1.5){a=1.0-smoothstep(0.0,1.0,r);a*=a;}
 else if(vShape<2.5){a=(1.0-smoothstep(0.15,1.0,abs(p.y)))*(1.0-smoothstep(0.35,1.0,abs(p.x)));}
 else if(vShape<3.5){float an=atan(p.y,p.x);float s=0.5+0.5*pow(abs(cos(an*2.5)),6.0);a=1.0-smoothstep(s*0.75,s,r);a=max(a,(1.0-smoothstep(0.0,0.35,r))*0.9);}
 else if(vShape<4.5){a=smoothstep(0.6,0.72,r)*(1.0-smoothstep(0.86,1.0,r));}
 else if(vShape<5.5){a=(1.0-smoothstep(0.1,1.0,r));a=a*a*0.5;}
 else{a=1.0-smoothstep(0.86,1.0,r);float rim=smoothstep(0.55,0.86,r);float al=a*vFade*vCol.a;o=vec4(mix(vCol.rgb*1.2,vCol.rgb*0.55,rim)*al,al);return;}
 float al=a*vFade*vCol.a;o=vec4(vCol.rgb*al,al);}`;
const FVS=`#version 300 es
layout(location=0) in vec2 p;out vec2 v;void main(){v=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}`;
const FFS=`#version 300 es
precision highp float;in vec2 v;out vec4 o;uniform float uT,uI,uA,uP,uMode;uniform vec3 c1,c2,c3;uniform vec2 uRes,uC;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=0.5;}return s;}
void main(){vec2 uv=vec2(v.x,1.0-v.y);vec2 q=uv*vec2(uRes.x/uRes.y,1.0);
 if(uMode<0.5){float t=uT*0.12;vec2 w=vec2(fbm(q*2.2+t),fbm(q*2.2-t+4.7));float r=fbm(q*2.6+w*1.8+vec2(t*0.7,-t));
  float band=smoothstep(0.35,0.95,r);vec3 col=mix(c1,c2,band);col+=c3*pow(band,5.0)*(1.4+uA*2.0);float edge=pow(1.0-abs(uv.y-0.5)*1.6,2.0);
  float al=uI*clamp(0.18+0.82*band*edge+uA*0.3,0.0,1.0);o=vec4(col*al,al);return;}
 if(uMode<1.5){float nn=fbm(q*3.5+uT*0.3)*0.55+uv.x*0.45;float th=uP*1.25-0.1;float m=smoothstep(th-0.04,th,nn);float edge=smoothstep(th-0.10,th-0.02,nn)-m;
  vec3 col=mix(c1,c2,uv.y)+c3*edge*3.0;float al=clamp(1.0-m+edge,0.0,1.0);if(uP>=1.0)al=0.0;o=vec4(col*al,al);return;}
 float d=distance(q,uC*vec2(uRes.x/uRes.y,1.0));float r2=uP*2.2;float m=1.0-smoothstep(r2-0.02,r2,d);float edge=smoothstep(r2-0.07,r2-0.01,d)*m;vec3 col=mix(c1,c2,d)+c3*edge*2.5;float al=m;o=vec4(col*al,al);}`;
function sh(t,s){const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x}
function link(vs,fs){const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p}
function makePool(name,additive){const data=new Float32Array(CAP*STRIDE);const vao=gl.createVertexArray();gl.bindVertexArray(vao);
 gl.bindBuffer(gl.ARRAY_BUFFER,qbuf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data.byteLength,gl.DYNAMIC_DRAW);const S=STRIDE*4;
 [[1,4,0],[2,4,16],[3,4,32],[4,4,48],[5,1,64]].forEach(([loc,n,off])=>{gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,S,off);gl.vertexAttribDivisor(loc,1)});
 gl.bindVertexArray(null);pools[name]={name,additive,data,vao,buf,head:0,used:0,aliveUntil:0,dirtyFrom:CAP,dirtyTo:-1}}
function init(){if(ok!==null)return ok;try{cv=document.createElement('canvas');cv.width=1920;cv.height=1080;gl=cv.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});if(!gl)throw new Error('no webgl2');
 prog=link(VS,FS);fprog=link(FVS,FFS);['uT','uRes'].forEach(k=>U[k]=gl.getUniformLocation(prog,k));['uT','uI','uA','uP','uMode','c1','c2','c3','uRes','uC'].forEach(k=>FU[k]=gl.getUniformLocation(fprog,k));
 qbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qbuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 fbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,fbuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 makePool('normal',false);makePool('add',true);cv.addEventListener('webglcontextlost',e=>{e.preventDefault();ok=false});ok=true}catch(e){console.warn('[BMG gpu] WebGL2 unavailable → Canvas2D fallback',e.message);ok=false}return ok}
const col3=c=>{const p=B.parseColor(c)||[255,255,255,1];return [p[0]/255,p[1]/255,p[2]/255,p[3]]};
/* ---------------- CPU fallback (pooled) ---------------- */
const CPU=[];const cpuPool=new B.Pool(()=>({}),null,256);
function spawn(poolName,o){const q=B.q();if(q<.5&&o.optional)return;if(!init()){if(CPU.length<900*q){const p=cpuPool.get();Object.assign(p,o,{t0:T});CPU.push(p)}return}
 const P=pools[poolName];const i=P.head;const d=P.data;const b=i*STRIDE;const c=col3(o.color||'#ffffff');
 d[b]=o.x;d[b+1]=o.y;d[b+2]=o.vx||0;d[b+3]=o.vy||0;d[b+4]=T+(o.delay||0);d[b+5]=o.life||1.5;d[b+6]=o.size||10;d[b+7]=o.rot||0;
 d[b+8]=o.vr||0;d[b+9]=o.drag??1;d[b+10]=o.g??0;d[b+11]=o.shape||0;d[b+12]=c[0];d[b+13]=c[1];d[b+14]=c[2];d[b+15]=(o.alpha??1)*c[3];d[b+16]=o.flutter||0;
 P.dirtyFrom=Math.min(P.dirtyFrom,i);P.dirtyTo=Math.max(P.dirtyTo,i);P.head=(i+1)%CAP;P.used=Math.min(CAP,P.used+1);P.aliveUntil=Math.max(P.aliveUntil,T+(o.delay||0)+(o.life||1.5))}
const R=B.rng('gpu');const rr=(a,b)=>a+(b-a)*R();
/* ---------------- emitters / presets ---------------- */
const G={};
G.confetti=(o={})=>{const n=Math.round((o.count||160)*B.q());const cols=o.colors||[B.brand().primary,B.brand().secondary,B.brand().accent,'#ffffff',B.brand().gold];const dir=o.dir??-Math.PI/2,spr=o.spread??1.1;
 for(let i=0;i<n;i++){const a=dir+(R()-.5)*spr;const sp=rr(700,1500)*(o.power||1);spawn('normal',{x:o.x??960,y:o.y??1080,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rr(2.6,4.4),size:rr(7,14),rot:R()*6,vr:rr(-8,8),drag:rr(1.2,2.2),g:rr(700,1000),shape:0,color:cols[i%cols.length],flutter:rr(6,14),delay:(o.stagger||0)*R()})}};
G.cannons=(o={})=>{G.confetti(Object.assign({x:120,y:1100,dir:-1.15,spread:.55,count:140},o));G.confetti(Object.assign({x:1800,y:1100,dir:-1.99,spread:.55,count:140},o))};
G.rain=(o={})=>{const n=Math.round((o.count||220)*B.q());const cols=o.colors||[B.brand().primary,B.brand().secondary,'#ffffff',B.brand().accent];for(let i=0;i<n;i++)spawn('normal',{x:rr(-40,1960),y:rr(-400,-20),vx:rr(-40,40),vy:rr(80,240),life:rr(4,6.5),size:rr(7,13),rot:R()*6,vr:rr(-5,5),drag:.6,g:rr(120,220),shape:o.shape??0,color:cols[i%cols.length],flutter:rr(4,10),delay:rr(0,1.8)})};
G.burst=(o={})=>{const n=Math.round((o.count||90)*B.q());const cols=o.colors||[B.brand().secondary,'#ffffff',B.brand().accent];for(let i=0;i<n;i++){const a=R()*Math.PI*2;const sp=rr(500,1500)*(o.power||1);spawn('add',{x:o.x??960,y:o.y??540,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rr(.5,1.2),size:rr(3,7),drag:rr(2.5,4),g:o.g??260,shape:2,color:cols[i%cols.length]})}
 for(let i=0;i<Math.round(24*B.q());i++){const a=R()*Math.PI*2,sp=rr(100,420);spawn('add',{x:o.x??960,y:o.y??540,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rr(.8,1.6),size:rr(10,26),drag:2,g:0,shape:3,color:cols[i%cols.length],alpha:.9,optional:true})}};
G.sparks=(o={})=>G.burst(Object.assign({count:40,power:.7},o));
G.stars=(o={})=>{const n=Math.round((o.count||30)*B.q());for(let i=0;i<n;i++){const a=R()*Math.PI*2,sp=rr(60,380);spawn('add',{x:o.x??960,y:o.y??540,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-80,life:rr(1,2.2),size:rr(12,30),drag:1.6,g:40,shape:3,color:o.color||B.brand().gold,vr:rr(-3,3)})}};
G.dust=(o={})=>{const n=Math.round((o.count||80)*B.q());const r=o.rect||[0,0,1920,1080];for(let i=0;i<n;i++)spawn('add',{x:rr(r[0],r[0]+r[2]),y:rr(r[1],r[1]+r[3]),vx:rr(-18,18),vy:rr(-30,-6),life:rr(3,7),size:rr(2,6),drag:.2,g:-4,shape:1,color:o.color||'#ffffff',alpha:rr(.25,.7),delay:rr(0,o.spreadTime||2)})};
G.smoke=(o={})=>{const n=Math.round((o.count||26)*B.q());for(let i=0;i<n;i++)spawn('normal',{x:(o.x??960)+rr(-80,80),y:(o.y??900)+rr(-20,20),vx:rr(-60,60),vy:rr(-160,-50),life:rr(2,3.6),size:rr(60,150),drag:1.1,g:-30,shape:5,color:o.color||'#c9ccd8',alpha:rr(.25,.5),vr:rr(-.5,.5),optional:true})};
G.coins=(o={})=>{const n=Math.round((o.count||60)*B.q());for(let i=0;i<n;i++){const a=-Math.PI/2+(R()-.5)*1.6;const sp=rr(500,1200);spawn('normal',{x:o.x??960,y:o.y??620,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:rr(2,3.2),size:rr(12,20),drag:.9,g:1300,shape:6,color:B.brand().gold,flutter:rr(6,12),rot:0})}};
G.streak=(o={})=>{const n=Math.round((o.count||60)*B.q());const x0=o.x0??0,y0=o.y0??540,x1=o.x1??1920,y1=o.y1??540;const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1;for(let i=0;i<n;i++){const t=R();spawn('add',{x:x0+dx*t,y:y0+dy*t+rr(-8,8),vx:dx/L*rr(300,900),vy:dy/L*rr(300,900),life:rr(.3,.8),size:rr(3,6),drag:2,g:0,shape:2,color:o.color||B.brand().accent,delay:t*.25})}};
G.impact=(o={})=>{G.burst(o);G.smoke(Object.assign({count:12},o))};
/* ---------------- full-screen programs ---------------- */
const FX={field:{on:false,i:0,target:0,audio:0,colors:null},wipe:{on:false,p:0,mode:1,c:[.5,.5],colors:null}};
B.audioLevel=(()=>{let an=null,buf=null,lv=0;return()=>{try{if(!an&&window.AE&&AE.ctx&&AE.master){an=AE.ctx.createAnalyser();an.fftSize=512;AE.master.connect(an);buf=new Float32Array(an.fftSize)}if(!an)return 0;an.getFloatTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i++)s+=buf[i]*buf[i];const r=Math.sqrt(s/buf.length);lv=lv*.8+Math.min(1,r*6)*.2;return lv}catch(e){return 0}}})();
function drawField(){const f=FX.field;f.i+=(f.target-f.i)*.06;if(f.i<.004&&!f.on){f.i=0;return false}const b=B.brand();const cs=(f.colors||[b.panel2,b.primary,b.secondary]).map(col3);
 gl.useProgram(fprog);gl.bindBuffer(gl.ARRAY_BUFFER,fbuf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.vertexAttribDivisor(0,0);
 gl.uniform1f(FU.uT,T);gl.uniform1f(FU.uI,f.i);gl.uniform1f(FU.uA,f.audio?B.audioLevel():0);gl.uniform1f(FU.uP,0);gl.uniform1f(FU.uMode,0);gl.uniform3fv(FU.c1,cs[0].slice(0,3));gl.uniform3fv(FU.c2,cs[1].slice(0,3));gl.uniform3fv(FU.c3,cs[2].slice(0,3));gl.uniform2f(FU.uRes,cv.width,cv.height);gl.uniform2f(FU.uC,.5,.5);
 gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return true}
function drawWipe(){const w=FX.wipe;if(!w.on)return false;const b=B.brand();const cs=(w.colors||[b.panel,b.primary,b.secondary]).map(col3);gl.useProgram(fprog);gl.bindBuffer(gl.ARRAY_BUFFER,fbuf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 gl.uniform1f(FU.uT,T);gl.uniform1f(FU.uI,1);gl.uniform1f(FU.uA,0);gl.uniform1f(FU.uP,w.p);gl.uniform1f(FU.uMode,w.mode);gl.uniform3fv(FU.c1,cs[0].slice(0,3));gl.uniform3fv(FU.c2,cs[1].slice(0,3));gl.uniform3fv(FU.c3,cs[2].slice(0,3));gl.uniform2f(FU.uRes,cv.width,cv.height);gl.uniform2f(FU.uC,w.c[0],w.c[1]);
 gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return true}
function drawPools(){let any=false;gl.useProgram(prog);gl.uniform1f(U.uT,T);gl.uniform2f(U.uRes,1920,1080);
 for(const P of Object.values(pools)){if(P.aliveUntil<T)continue;any=true;if(P.dirtyTo>=P.dirtyFrom){gl.bindBuffer(gl.ARRAY_BUFFER,P.buf);gl.bufferSubData(gl.ARRAY_BUFFER,P.dirtyFrom*STRIDE*4,P.data,P.dirtyFrom*STRIDE,(P.dirtyTo-P.dirtyFrom+1)*STRIDE);P.dirtyFrom=CAP;P.dirtyTo=-1}
  gl.bindVertexArray(P.vao);if(P.additive)gl.blendFunc(gl.ONE,gl.ONE);else gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,P.used);gl.bindVertexArray(null)}return any}
function cpuDraw(ctx,dt){for(let i=CPU.length-1;i>=0;i--){const p=CPU[i];const age=T-p.t0-(p.delay||0);if(age<0)continue;if(age>p.life){CPU.splice(i,1);cpuPool.put(p);continue}const k=Math.max(p.drag??1,.001),e=Math.exp(-k*age),g=p.g||0;
 const x=p.x+(p.vx||0)*(1-e)/k,y=p.y+(p.vy||0)*(1-e)/k+g*(age/k-(1-e)/(k*k));const a=clamp((p.life-age)/.5)*(p.alpha??1);ctx.save();ctx.globalAlpha*=a;ctx.translate(x,y);ctx.rotate((p.rot||0)+(p.vr||0)*age);ctx.fillStyle=p.color||'#fff';
 const s=p.size||8;if(p.shape===1||p.shape===5){ctx.beginPath();ctx.arc(0,0,s,0,7);ctx.fill()}else ctx.fillRect(-s,-s*.5*(p.flutter?Math.abs(Math.cos(age*p.flutter)):1),s*2,s*(p.flutter?Math.abs(Math.cos(age*p.flutter)):1));ctx.restore()}}
B.gpu={
 available:()=>init(),
 emit:(name,o)=>{const f=G[name];if(f)f(o||{});else console.warn('[BMG gpu] unknown emitter',name)},
 presets:Object.keys(G),
 field(o){Object.assign(FX.field,o||{});if(o&&o.on!==undefined)FX.field.target=o.on?(o.intensity??(FX.field.target||.8)):0;if(o&&o.intensity!=null&&FX.field.on)FX.field.target=o.intensity},
 wipe(p,o){Object.assign(FX.wipe,o||{},{p,on:p>0&&p<1})},
 alive(){if(ok===false)return CPU.length>0;return Object.values(pools).some(P=>P.aliveUntil>=T)||FX.field.i>.004||FX.field.on||FX.wipe.on},
 time:()=>T,
 stats(){return {webgl2:ok===true,particles:Object.values(pools).reduce((n,P)=>n+(P.aliveUntil>=T?P.used:0),0),cpu:CPU.length,field:+FX.field.i.toFixed(2)}},
 clear(){Object.values(pools).forEach(P=>{P.aliveUntil=0;P.used=0;P.head=0});CPU.length=0;FX.field.on=false;FX.field.target=0;FX.wipe.on=false},
 /* advance + draw onto the 1920×1080 design space of ctx */
 composite(ctx,now){const t=(now||performance.now())/1000;const dt=lastNow?clamp(t-lastNow,0,.1):0;lastNow=t;T+=dt;
  if(ok===false||!init()){if(CPU.length)cpuDraw(ctx,dt);return}if(!this.alive())return;
  const W=Math.min(1920,ctx.canvas.width),H=Math.round(W*9/16);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);
  const a=drawField(),w=drawWipe(),p=drawPools();if(a||w||p){ctx.save();ctx.globalCompositeOperation='source-over';ctx.drawImage(cv,0,0,1920,1080);ctx.restore()}}};
})();
