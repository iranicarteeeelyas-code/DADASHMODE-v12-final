/* DADASHMODE V8 · BMG · 7/8 · THREE.JS 3D RENDERER ADAPTER + «3D Hero» template (spec §3 3D motion, §8 renderer strategy)
   · three.js r185 (MIT) is bundled as js/bmg/vendor/three-bmg.js (global BMG_THREE) and LAZY-loaded only when a 3D graphic is used
     (spec §15: "do not make every graphic a 3D scene").
   · Real extruded Persian 3D text: the string is shaped by the browser (correct joins), rasterised, traced with marching squares,
     simplified (Ramer–Douglas–Peucker), holes are classified by containment, and the outlines become THREE.Shape → ExtrudeGeometry
     with bevel. If tracing fails, a textured plate is used instead (never a broken graphic).
   · One shared WebGLRenderer (offscreen), PBR materials + RoomEnvironment reflections, UnrealBloom on quality level 0, camera push/pull
     driven by the template's `cam` channel, 3D reveal driven by `p`. Result is composited into the recorded 1920×1080 stage. */
(function(){
'use strict';
const B=window.BMG;const {clamp,lerp}=B.math;
let T3=null,loading=null,R=null,CV=null,ENV=null,failed=false;
B.three={available:()=>!!T3&&!failed,failed:()=>failed,
 load(){if(T3)return Promise.resolve(T3);if(loading)return loading;loading=new Promise((res,rej)=>{if(window.BMG_THREE){T3=window.BMG_THREE;return res(T3)}const s=document.createElement('script');s.src='js/bmg/vendor/three-bmg.js';s.onload=()=>{T3=window.BMG_THREE;T3?res(T3):rej(new Error('three bundle missing'))};s.onerror=()=>{failed=true;rej(new Error('three bundle failed to load'))};document.head.appendChild(s)});return loading},
 renderer(){if(R||failed||!T3)return R;try{CV=document.createElement('canvas');R=new T3.WebGLRenderer({canvas:CV,alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance'});R.setPixelRatio(1);R.outputColorSpace=T3.SRGBColorSpace;R.toneMapping=T3.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
  const pm=new T3.PMREMGenerator(R);ENV=pm.fromScene(new T3.RoomEnvironment(),.04).texture;pm.dispose()}catch(e){console.warn('[BMG 3D] WebGL unavailable',e);failed=true;R=null}return R},
 info:()=>({loaded:!!T3,failed,revision:T3&&T3.REVISION})};

/* ---------- Persian text → contours (marching squares) ---------- */
function contours(str,fontPx,family){const c=document.createElement('canvas');const x=c.getContext('2d');const font=`900 ${fontPx}px "${family}", Vazirmatn, sans-serif`;x.font=font;const w=Math.ceil(x.measureText(str).width+fontPx*.6),h=Math.ceil(fontPx*1.7);c.width=w;c.height=h;
 x.font=font;x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.direction='rtl';x.fillText(str,w/2,h/2);const img=x.getImageData(0,0,w,h).data;const S=2;const gw=Math.floor(w/S),gh=Math.floor(h/S);
 const v=(i,j)=>i<0||j<0||i>=gw||j>=gh?0:img[((j*S)*w+i*S)*4+3]/255;const TH=.5;
 const segs=new Map();const key=p=>p[0].toFixed(2)+','+p[1].toFixed(2);const add=(a,b)=>{const ka=key(a);if(!segs.has(ka))segs.set(ka,[]);segs.get(ka).push(b)};
 const lerpE=(a,b)=>clamp((TH-a)/((b-a)||1e-6));
 for(let j=-1;j<gh;j++)for(let i=-1;i<gw;i++){const a=v(i,j),b=v(i+1,j),c2=v(i+1,j+1),d=v(i,j+1);const idx=(a>TH?8:0)|(b>TH?4:0)|(c2>TH?2:0)|(d>TH?1:0);if(idx===0||idx===15)continue;
  const T_=[i+lerpE(a,b),j],Rr=[i+1,j+lerpE(b,c2)],Bt=[i+lerpE(d,c2),j+1],L=[i,j+lerpE(a,d)];
  const C={1:[[L,Bt]],2:[[Bt,Rr]],3:[[L,Rr]],4:[[Rr,T_]],5:[[L,T_],[Rr,Bt]],6:[[Bt,T_]],7:[[L,T_]],8:[[T_,L]],9:[[T_,Bt]],10:[[T_,Rr],[Bt,L]],11:[[T_,Rr]],12:[[Rr,L]],13:[[Rr,Bt]],14:[[Bt,L]]}[idx];
  C.forEach(([p,q])=>add(p,q))}
 const loops=[];const used=new Set();for(const [k0,arr] of segs){for(let n=0;n<arr.length;n++){const id=k0+'>'+n;if(used.has(id))continue;used.add(id);const loop=[k0.split(',').map(Number)];let cur=arr[n];let guard=0;
   while(guard++<20000){const kc=key(cur);if(kc===k0)break;loop.push(cur);const nx=segs.get(kc);if(!nx)break;let f=-1;for(let m=0;m<nx.length;m++)if(!used.has(kc+'>'+m)){f=m;break}if(f<0)break;used.add(kc+'>'+f);cur=nx[f]}
   if(loop.length>6)loops.push(rdp(loop,.35).map(p=>[p[0]*S,p[1]*S]))}}
 return {loops,w,h}}
function rdp(pts,eps){if(pts.length<4)return pts;const d=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1];const L=dx*dx+dy*dy||1e-9;const t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L);const x=a[0]+t*dx-p[0],y=a[1]+t*dy-p[1];return Math.sqrt(x*x+y*y)};
 const rec=(s,e,out)=>{let m=0,idx=-1;for(let i=s+1;i<e;i++){const dd=d(pts[i],pts[s],pts[e]);if(dd>m){m=dd;idx=i}}if(m>eps&&idx>0){rec(s,idx,out);rec(idx,e,out)}else out.push(pts[s])};const out=[];rec(0,pts.length-1,out);out.push(pts[pts.length-1]);return out}
const area=p=>{let a=0;for(let i=0,j=p.length-1;i<p.length;j=i++)a+=(p[j][0]+p[i][0])*(p[j][1]-p[i][1]);return a/2};
const inside=(pt,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>pt[1])!==(b[1]>pt[1]))&&(pt[0]<(b[0]-a[0])*(pt[1]-a[1])/((b[1]-a[1])||1e-9)+a[0]))c=!c}return c};
function textGeometry(str,o={}){const {loops,w,h}=contours(str,o.px||200,o.family||'Estedad');if(!loops.length)throw new Error('no contours');
 const depth=loops.map((L,i)=>loops.reduce((n,M,j)=>n+(j!==i&&inside(L[0],M)?1:0),0));const shapes=[];const sc=(o.size||1)/(o.px||200);const tp=p=>new T3.Vector2((p[0]-w/2)*sc,-(p[1]-h/2)*sc);
 loops.forEach((L,i)=>{if(depth[i]%2)return;const pts=area(L)>0?L.slice().reverse():L;const s=new T3.Shape(pts.map(tp));loops.forEach((H,j)=>{if(depth[j]===depth[i]+1&&inside(H[0],L)){const hp=area(H)>0?H:H.slice().reverse();s.holes.push(new T3.Path(hp.map(tp)))}});shapes.push(s)});
 const g=new T3.ExtrudeGeometry(shapes,{depth:o.depth??.16,bevelEnabled:true,bevelThickness:o.bevel??.03,bevelSize:(o.bevel??.03)*.7,bevelSegments:3,curveSegments:4});g.center();return g}
B.three.textGeometry=textGeometry;B.three._contours=contours;

/* ---------- 3D hero scene (one per instance, shared renderer) ---------- */
function build(inst){const d=inst.data;const S=new T3.Scene();const cam=new T3.PerspectiveCamera(30,16/9,.1,100);cam.position.set(0,.2,9);S.environment=ENV;
 const key=new T3.DirectionalLight(0xffffff,2.4);key.position.set(3,4,6);S.add(key);const rim=new T3.DirectionalLight(new T3.Color(d.color||'#ff2e4d'),5);rim.position.set(-5,2,-4);S.add(rim);S.add(new T3.AmbientLight(0xffffff,.25));
 const gold=new T3.MeshPhysicalMaterial({color:new T3.Color(B.brand().gold||'#f5b82e'),metalness:1,roughness:.22,clearcoat:.6,clearcoatRoughness:.2});
 const face=new T3.MeshPhysicalMaterial({color:new T3.Color(d.color||B.brand().primary),metalness:.55,roughness:.32,clearcoat:1,emissive:new T3.Color(d.color||B.brand().primary),emissiveIntensity:.08});
 const G=new T3.Group();S.add(G);
 /* medallion: extruded ring with notches */const ring=new T3.Shape();const N=24;for(let i=0;i<=N*2;i++){const a=i*Math.PI/N;const r=i%2?2.05:2.25;const p=[Math.cos(a)*r,Math.sin(a)*r];i?ring.lineTo(p[0],p[1]):ring.moveTo(p[0],p[1])}
 const hole=new T3.Path();hole.absarc(0,0,1.72,0,Math.PI*2,true);ring.holes.push(hole);const rg=new T3.ExtrudeGeometry(ring,{depth:.28,bevelEnabled:true,bevelThickness:.06,bevelSize:.05,bevelSegments:3,curveSegments:48});rg.center();
 const medal=new T3.Mesh(rg,gold);G.add(medal);const disc=new T3.Mesh(new T3.CylinderGeometry(1.72,1.72,.12,64),face);disc.rotation.x=Math.PI/2;G.add(disc);
 let text=null;try{const tg=textGeometry(d.title||'داداش‌مود',{size:2.9,px:220,depth:.22,family:B.brand().fontNum||'Estedad'});tg.computeBoundingBox();const bb=tg.boundingBox;const k=Math.min(1,3.1/((bb.max.x-bb.min.x)||1));text=new T3.Mesh(tg,gold);text.scale.setScalar(k);text.position.z=.2;G.add(text);inst.mem.text3d='extruded'}
 catch(e){const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');x.fillStyle='#fff';x.font='900 190px Estedad, Vazirmatn';x.textAlign='center';x.textBaseline='middle';x.direction='rtl';x.fillText(d.title||'',512,256);const tex=new T3.CanvasTexture(c);tex.colorSpace=T3.SRGBColorSpace;
  text=new T3.Mesh(new T3.PlaneGeometry(3.2,1.6),new T3.MeshBasicMaterial({map:tex,transparent:true}));text.position.z=.2;G.add(text);inst.mem.text3d='texture'}
 /* instanced sparkle field (one draw call) */const M=180;const sp=new T3.InstancedMesh(new T3.SphereGeometry(.022,6,6),new T3.MeshBasicMaterial({color:new T3.Color(B.brand().gold||'#ffd166')}),M);const o=new T3.Object3D();const rnd=B.rng?B.rng(7):Math.random;
 const seeds=[];for(let i=0;i<M;i++){seeds.push([(rnd()-.5)*12,(rnd()-.5)*7,-rnd()*6-1,rnd()*6.28]);o.position.set(...seeds[i].slice(0,3));o.updateMatrix();sp.setMatrixAt(i,o.matrix)}S.add(sp);
 let comp=null;try{comp=new T3.EffectComposer(R);comp.addPass(new T3.RenderPass(S,cam));const bloom=new T3.UnrealBloomPass(new T3.Vector2(1280,720),.55,.5,.82);comp.addPass(bloom);comp.addPass(new T3.OutputPass());inst.mem.bloom=bloom}catch(e){comp=null}
 inst.mem.three={S,cam,G,medal,text,disc,sp,seeds,o,comp};}
function dispose(inst){const t=inst.mem.three;if(!t)return;t.S.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material){(Array.isArray(x.material)?x.material:[x.material]).forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}});if(t.comp&&t.comp.dispose)t.comp.dispose();inst.mem.three=null}
function render3d(inst,W,H){const r=B.three.renderer();if(!r)return null;if(!inst.mem.three)build(inst);const t=inst.mem.three;const e=inst.els.hero;const p=clamp(e.p),cam=e.cam;const tt=(performance.now()/1000);
 if(CV.width!==W||CV.height!==H){r.setSize(W,H,false);if(t.comp)t.comp.setSize(W,H)}t.cam.aspect=W/H;t.cam.updateProjectionMatrix();
 /* 3D choreography: medal spins in with decaying velocity, text rises from depth, camera push (cam) + subtle parallax micro-motion */
 const spin=(1-B.easings.quintOut(p))*Math.PI*3;t.G.rotation.y=spin+Math.sin(tt*.6)*.08*p;t.G.rotation.x=Math.sin(tt*.4)*.05;t.G.position.y=lerp(-1.2,0,B.easings.expoOut(p));
 if(t.text){t.text.position.z=lerp(-1.4,.22,B.easings.backOut(clamp(p*1.25)));}t.cam.position.z=lerp(10.5,7.6,B.easings.sineInOut(cam));t.cam.position.x=Math.sin(tt*.3)*.15;t.cam.lookAt(0,0,0);
 for(let i=0;i<t.seeds.length;i++){const s=t.seeds[i];t.o.position.set(s[0],s[1]+Math.sin(tt*.5+s[3])*.2,s[2]);const k=.6+.4*Math.sin(tt*2+s[3]);t.o.scale.setScalar(k*p);t.o.updateMatrix();t.sp.setMatrixAt(i,t.o.matrix)}t.sp.instanceMatrix.needsUpdate=true;
 const useBloom=t.comp&&B.q()>.9;if(inst.mem.bloom)inst.mem.bloom.strength=.35+.5*(1-Math.abs(p-.85));if(useBloom)t.comp.render();else r.render(t.S,t.cam);return CV}

B.registerTemplate({id:'hero3d',version:'1.0.0',name:'3D Hero Graphic',fa:'قهرمان سه‌بعدی',category:'gameshow',renderer:'three',slot:'full',layer:'full',priority:75,safeArea:'action',
 states:['idle','preroll','entering','live','updating','emphasis','exiting','hidden'],accessibility:{flash:false},performanceProfile:{cost:'high',gpu:true,lazy:true},
 dataSchema:{title:{type:'string',default:'تاج'},subtitle:{type:'string',default:'دفاع از تاج · قسمت بعد'},color:{type:'color',default:'#ff2e4d'}},
 transitions:{enter:['hero3d','cameraPush','lightSweep'],exit:['cameraPull','fullscreenExit']},
 init(i){i.els={hero:B.el(),sub:B.el(),bg:B.el()};B.three.load().catch(()=>{})},
 enter(tl,i){const e=i.els;tl.set(e.bg,{a:0});tl.to(e.bg,{a:.9},{dur:B.T().d('slow'),ease:'sineInOut'});B.PRESETS.hero3d(tl,e.hero,{at:0});B.PRESETS.lowerThirdOn(tl,e.sub,{at:B.T().d('cinematic')*.8})},
 exit(tl,i){const e=i.els;B.PRESETS.cameraPull(tl,e.hero,{dur:'base'});tl.to(e.hero,{a:0},{dur:B.T().d('fast'),at:'<'});tl.to(e.sub,{a:0},{dur:.12,at:'<'});tl.to(e.bg,{a:0},{dur:B.T().d('base'),at:'<+=0.1'})},
 update(U,i,ch){if(ch.has('title')||ch.has('color')){dispose(i);const t=U.track('re');t.fromTo(i.els.hero,{p:.55},{p:1},{dur:B.T().d('slow'),ease:'quintOut'})}},
 onHidden(i){dispose(i)},
 draw(c,i,env){const e=i.els,d=i.data,b=B.brand();if(e.bg.a>0){c.save();c.globalAlpha*=e.bg.a;const g=c.createRadialGradient(960,500,80,960,540,1100);g.addColorStop(0,B.mix(d.color,'#000',.6));g.addColorStop(1,'#010207');c.fillStyle=g;c.fillRect(0,0,1920,1080);c.restore()}
  let drawn=false;if(e.hero.a>0.003&&B.three.available()){const q=B.q();const W=q>.9?1280:q>.5?960:640;const cv=render3d(i,W,Math.round(W*9/16));if(cv){c.save();c.globalAlpha*=e.hero.a;c.drawImage(cv,0,0,1920,1080);c.restore();drawn=true}}
  if(!drawn&&e.hero.a>0.003){/* 2D fallback while three.js loads or without WebGL */B.fx(c,e.hero,960,500,700,700,cc=>{const p=clamp(e.hero.p);cc.rotate((1-B.easings.quintOut(p))*3);cc.strokeStyle=b.gold;cc.lineWidth=36;cc.beginPath();cc.arc(0,0,250,0,Math.PI*2);cc.stroke();cc.rotate(-(1-B.easings.quintOut(p))*3);cc.fillStyle=d.color;cc.beginPath();cc.arc(0,0,215,0,Math.PI*2);cc.fill();B.K.text(cc,d.title,0,0,{role:'num',size:150,color:b.gold,max:380})})}
  B.fx(c,e.sub,960,900,1100,80,cc=>{B.K.panel(cc,-550,-40,1100,80,{fill:B.rgba(b.panel,.88),r:40});B.K.text(cc,d.subtitle,0,2,{size:38,color:b.ink,max:1060})},{dir:'center'})}});
})();
