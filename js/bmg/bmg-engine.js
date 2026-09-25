/* DADASHMODE V8 · BMG · 6/8 · GRAPHICS ENGINE (Character Generator) — spec §5, §9, §10, §17
   Graphic Templates (versioned, typed data schema) → Graphic Instances → Graphic State Machine → Timelines on the PVW / PGM clocks.
     states: idle → preroll → entering → live ⇄ updating / emphasis / alert → exiting → hidden   (+ transitioning)
   · live data updates never replay the entrance: only the changed paths are handed to the template, which animates only them
   · rapid updates are coalesced per instance per frame · every instance owns ONE main timeline + a fixed set of named "tracks"
     (a new timeline on a track cancels the previous one on that track), so re-triggering can never accumulate timelines
   · slots + priority + queue + interrupt + rollback · rundown with cue/take · live data bindings · JSON command API (remote control)
   · Preview (PVW) and Program (PGM) are separate instance sets on separate clocks
   No DOM here: draw() receives any Canvas2D context. Runs under Node for tools/bmg-selftest.mjs. */
(function(root){
'use strict';
const B=root.BMG;const {clamp}=B.math;

/* ================= template registry (versioned) ================= */
const REG=B.TEMPLATES=B.TEMPLATES||{};
const REQUIRED=['id','version','category','renderer','dataSchema','enter','exit','draw'];
B.registerTemplate=function(tpl){for(const k of REQUIRED)if(tpl[k]==null)throw new Error(`template ${tpl.id||'?'}: missing ${k}`);
 if(!B.RENDERERS||B.RENDERERS[tpl.renderer]===undefined){/* renderer ids are explicit (spec §17) */if(!['canvas2d','gpu2d','three'].includes(tpl.renderer))throw new Error(`template ${tpl.id}: unknown renderer ${tpl.renderer}`)}
 const e=REG[tpl.id]=REG[tpl.id]||{versions:{},latest:null};e.versions[tpl.version]=tpl;
 const cmp=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)-(y[i]||0)}return 0};
 if(!e.latest||cmp(tpl.version,e.latest)>0)e.latest=tpl.version;return tpl};
B.template=(id,ver)=>{const e=REG[id];if(!e)return null;return e.versions[ver||e.latest]||null};
B.templateList=()=>Object.keys(REG).map(id=>B.template(id));
/* typed schema: fill defaults + coerce (number/string/bool/color/list/object) */
B.applySchema=function(schema,data){const out={};const d=data||{};for(const k in schema){const f=schema[k];let v=d[k]!==undefined?d[k]:(typeof f.default==='function'?f.default():JSON.parse(JSON.stringify(f.default??null)));
  if(f.type==='number'&&v!=null&&v!=='')v=+B.en(v);else if(f.type==='string'&&v!=null)v=String(v);else if(f.type==='bool')v=!!v&&v!=='false';else if(f.type==='color'&&v&&!/^#[0-9a-f]{3,8}$/i.test(v))v=f.default;
  out[k]=v}for(const k in d)if(!(k in out))out[k]=d[k];return out};

/* ================= state machine ================= */
const FLOW={idle:['preroll','hidden'],hidden:['preroll'],preroll:['entering','hidden'],entering:['live','exiting','hidden','updating'],
 live:['updating','emphasis','alert','transitioning','exiting'],updating:['live','updating','emphasis','alert','exiting'],
 emphasis:['live','updating','exiting','alert'],alert:['live','updating','exiting','emphasis'],transitioning:['live','exiting','hidden'],exiting:['hidden','preroll']};
B.STATES=Object.keys(FLOW);
const VISIBLE=new Set(['preroll','entering','live','updating','emphasis','alert','transitioning']);
const LAYER_Z={bg:0,scene:10,full:20,side:30,lower:40,top:50,bug:60,alert:70,fx:80,transition:90};

const E=B.engine={cfg:{width:1920,height:1080,fps:60,safe:'title',guides:false,perfOverlay:false,program:true},
 pgm:new Map(),pvw:new Map(),queues:{},history:[],log:[],bindings:new Map(),rundown:{items:[],pos:0,name:''},stats:{enter:0,update:0,coalesced:0,exit:0,interrupt:0}};
const setOf=ch=>ch==='PVW'?E.pvw:E.pgm;
const note=(msg)=>{E.log.push({t:Date.now(),msg});if(E.log.length>200)E.log.shift();B.bus.emit('bmg.log',msg)};
E.isVisible=inst=>!!inst&&VISIBLE.has(inst.state);

function setState(inst,s,force){if(inst.state===s)return true;const ok=force||(FLOW[inst.state]||[]).includes(s);if(!ok){note(`state ${inst.instanceId}: ${inst.state}→${s} rejected`);return false}
 const from=inst.state;inst.state=s;inst.stateAt=inst.clock().time;B.bus.emit('bmg.state',{id:inst.instanceId,channel:inst.channel,from,to:s});return true}

/* run a builder with the template's own motion tokens (spec §6: tokens centralised, per-template overrides allowed) */
function withTokens(tpl,scale,fn){const keep=B.tokens,keepS=B.motion.durationScale;try{if(tpl.motionTokens)B.tokens=B.deepMerge(keep,tpl.motionTokens);if(scale)B.motion.durationScale=keepS*scale;return fn()}finally{B.tokens=keep;B.motion.durationScale=keepS}}

function makeInst(id,tpl,channel,opt){const inst={instanceId:id,templateId:tpl.id,templateVersion:tpl.version,channel,data:{},prev:{},state:'idle',priority:opt.priority??tpl.priority??50,
  createdAt:Date.now(),currentTransition:null,els:{},mem:{},tl:null,tracks:{},pending:null,enterCount:0,updateCount:0,z:(LAYER_Z[tpl.layer]??40)+(opt.z||0),slot:opt.slot!==undefined?opt.slot:tpl.slot,
  hideAt:null,clock:()=>B.clocks[channel]};inst.tpl=()=>B.template(inst.templateId,inst.templateVersion);
 if(tpl.init)withTokens(tpl,0,()=>tpl.init(inst));return inst}

/* the "U" handed to template.update / actions: named tracks with automatic cancel of the previous timeline on the same track */
function U(inst){return {track(name){const old=inst.tracks[name];if(old){old.cancel();old.kill()}const tl=B.timeline({clock:inst.clock(),name:inst.instanceId+':'+name});inst.tracks[name]=tl;tl._autoplay=true;return tl},
 inst,T:B.T(),data:inst.data,prev:inst.prev}}
function playTracks(inst){for(const k in inst.tracks){const tl=inst.tracks[k];if(tl._autoplay){tl._autoplay=false;if(tl.dur>0)tl.play(inst.clock());else{tl.render(0,0);tl.kill();delete inst.tracks[k]}}}}
function killAll(inst){if(inst.tl){inst.tl.cancel();inst.tl.kill();inst.tl=null}for(const k in inst.tracks){inst.tracks[k].cancel();inst.tracks[k].kill()}inst.tracks={}}
E.timelinesOf=inst=>(inst.tl&&inst.tl.state==='playing'?1:0)+Object.values(inst.tracks).filter(t=>t.state==='playing').length;

function changedPaths(a,b){const out=new Set();const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);
 for(const k of keys){const x=a&&a[k],y=b&&b[k];if(JSON.stringify(x)===JSON.stringify(y))continue;out.add(k);
  if(x&&y&&typeof x==='object'&&typeof y==='object'&&!Array.isArray(x)){for(const j of new Set([...Object.keys(x),...Object.keys(y)]))if(JSON.stringify(x[j])!==JSON.stringify(y[j]))out.add(k+'.'+j)}}return out}

function snapshot(inst){return {id:inst.instanceId,channel:inst.channel,templateId:inst.templateId,visible:E.isVisible(inst)&&inst.state!=='exiting',data:JSON.parse(JSON.stringify(inst.data)),state:inst.state}}
function remember(inst){if(inst.channel!=='PGM')return;E.history.push(snapshot(inst));if(E.history.length>60)E.history.shift()}

/* ---------- entrance ---------- */
function enter(inst,opt={}){const tpl=inst.tpl();killAll(inst);setState(inst,'preroll',true);
 const tl=B.timeline({clock:inst.clock(),name:inst.instanceId+':enter'});inst.tl=tl;inst.currentTransition=opt.transition||'enter';
 withTokens(tpl,opt.scale,()=>tpl.enter(tl,inst,U(inst)));
 tl.cb.onComplete=()=>{if(inst.tl===tl){inst.tl=null;inst.currentTransition=null;if(inst.state==='entering')setState(inst,'live');tl.kill();const ah=Number.isFinite(+inst.data.hold)&&inst.data.hold!==null&&inst.data.hold!==''?+inst.data.hold:(tpl.autoHide&&inst.data.autoHide!==false?(typeof tpl.autoHide==='function'?tpl.autoHide(inst):tpl.autoHide):null);if(ah!=null&&ah>0)inst.hideAt=inst.clock().time+ah}};
 setState(inst,'entering');inst.enterCount++;E.stats.enter++;tl.play(inst.clock());if(tl.dur===0)tl._advance(0);playTracks(inst);return inst}
/* ---------- exit ---------- */
function exit(inst,opt={}){if(!E.isVisible(inst))return false;const tpl=inst.tpl();killAll(inst);inst.pending=null;inst.hideAt=null;setState(inst,'exiting',true);
 const tl=B.timeline({clock:inst.clock(),name:inst.instanceId+':exit'});inst.tl=tl;inst.currentTransition=opt.interrupt?'interrupt':'exit';
 withTokens(tpl,opt.scale,()=>tpl.exit(tl,inst,U(inst)));
 const done=()=>{if(inst.tl!==tl)return;inst.tl=null;inst.currentTransition=null;setState(inst,'hidden',true);tl.kill();if(tpl.onHidden)tpl.onHidden(inst);E.stats.exit++;dequeue(inst.slot,inst.channel)};
 tl.cb.onComplete=done;tl.play(inst.clock());if(tl.dur===0)done();return true}

function occupant(slot,channel,exceptId){if(!slot)return null;for(const i of setOf(channel).values())if(i.slot===slot&&i.instanceId!==exceptId&&E.isVisible(i)&&i.state!=='exiting')return i;return null}
function dequeue(slot,channel){const q=E.queues[channel+':'+slot];if(!q||!q.length)return;if(occupant(slot,channel))return;const n=q.shift();note(`queue → ${n.id}`);E.show(n.id,n.data,Object.assign({},n.opt,{channel}))}

function resolveTpl(id,opt,existing){const tid=opt.template||opt.templateId||(existing&&existing.templateId)||(REG[id]?id:null);const tpl=tid&&B.template(tid,opt.version||(existing&&existing.templateId===tid?existing.templateVersion:undefined));if(!tpl)throw new Error('no template for '+id);return tpl}

/* ================= public API (spec §9) ================= */
E.get=(id,channel='PGM')=>setOf(channel).get(id)||null;
E.showGraphic=E.show=function(id,data,opt={}){const ch=opt.channel||'PGM';const set=setOf(ch);let inst=set.get(id);const tpl=resolveTpl(id,opt,inst);
 if(inst&&inst.templateId!==tpl.id){killAll(inst);set.delete(id);inst=null}
 if(!inst){inst=makeInst(id,tpl,ch,opt);set.set(id,inst)}
 if(opt.priority!=null)inst.priority=opt.priority;
 const merged=B.applySchema(tpl.dataSchema,Object.assign({},inst.enterCount?inst.data:{},data||{}));
 if(E.isVisible(inst)&&inst.state!=='exiting'&&!opt.replay){/* already on air → data update, never an entrance replay */return E.update(id,merged,{channel:ch,now:opt.now})}
 const occ=occupant(inst.slot,ch,id);
 if(occ){if(inst.priority>=occ.priority||opt.force){note(`slot ${inst.slot}: ${occ.instanceId} interrupted by ${id} (priority ${inst.priority}≥${occ.priority})`);exit(occ,{interrupt:true,scale:.5})}
  else{E.queueGraphic(id,data,opt);return {queued:true}}}
 remember(inst);inst.prev=inst.data;inst.data=merged;enter(inst,opt);note(`${ch} show ${id} (${tpl.id}@${tpl.version})`);return inst};
E.updateGraphic=E.update=function(id,data,opt={}){const ch=opt.channel||'PGM';const inst=setOf(ch).get(id);if(!inst)return null;const tpl=inst.tpl();
 const next=B.applySchema(tpl.dataSchema,Object.assign({},inst.data,data||{}));
 if(!E.isVisible(inst)||inst.state==='exiting'){inst.data=next;return inst}
 if(inst.pending){inst.pending.data=next;inst.pending.silent=inst.pending.silent&&!!opt.silent;E.stats.coalesced++}else inst.pending={data:next,silent:!!opt.silent};
 if(opt.now)flush(inst);return inst};
function flush(inst){const p=inst.pending;if(!p)return;inst.pending=null;const tpl=inst.tpl();const ch=changedPaths(inst.data,p.data);if(!ch.size)return;
 if(!p.silent)remember(inst);inst.prev=inst.data;inst.data=p.data;inst.updateCount++;E.stats.update++;
 if(inst.state==='live'||inst.state==='emphasis')setState(inst,'updating');
 if(tpl.update)withTokens(tpl,0,()=>tpl.update(U(inst),inst,ch,inst.prev));playTracks(inst);
 if(inst.state==='updating'){const tr=Object.values(inst.tracks).filter(t=>t.state==='playing');if(!tr.length)setState(inst,'live');else{let n=tr.length;tr.forEach(t=>{const a=t.cb.onComplete;t.cb.onComplete=x=>{a&&a(x);if(--n<=0&&inst.state==='updating')setState(inst,'live')}})}}}
E.hideGraphic=E.hide=function(id,opt={}){const inst=setOf(opt.channel||'PGM').get(id);if(!inst)return false;remember(inst);const r=exit(inst,opt);if(r)note(`${inst.channel} hide ${id}`);return r};
E.interruptGraphic=E.interrupt=function(id,opt={}){const inst=setOf(opt.channel||'PGM').get(id);if(!inst||!E.isVisible(inst))return false;E.stats.interrupt++;remember(inst);note(`interrupt ${id}`);
 if(inst.state==='exiting'){/* already leaving: jump to the end safely */killAll(inst);setState(inst,'hidden',true);dequeue(inst.slot,inst.channel);return true}return exit(inst,{interrupt:true,scale:opt.scale??.45})};
E.queueGraphic=E.queue=function(id,data,opt={}){const ch=opt.channel||'PGM';const existing=setOf(ch).get(id);const tpl=resolveTpl(id,opt,existing);const slot=opt.slot!==undefined?opt.slot:tpl.slot;
 if(!occupant(slot,ch,id))return E.show(id,data,Object.assign({},opt,{channel:ch}));const k=ch+':'+slot;(E.queues[k]=E.queues[k]||[]).push({id,data,opt:Object.assign({},opt,{template:tpl.id})});note(`queued ${id} on ${slot}`);return {queued:true,position:E.queues[k].length}};
E.previewGraphic=E.preview=function(id,data,opt={}){return E.show(id,data,Object.assign({},opt,{channel:'PVW',replay:opt.replay??false}))};
E.takeLive=E.take=function(id,opt={}){const pv=E.pvw.get(id);if(!pv)return null;const data=JSON.parse(JSON.stringify(pv.data));const r=E.show(id,data,{template:pv.templateId,version:pv.templateVersion,priority:pv.priority,channel:'PGM',now:true,force:opt.force});
 if(opt.clearPreview){E.hide(id,{channel:'PVW'})}note(`TAKE ${id} → PGM`);B.bus.emit('bmg.take',id);return r};
E.setGraphicState=E.setState=function(id,state,opt={}){const inst=setOf(opt.channel||'PGM').get(id);if(!inst)return false;const tpl=inst.tpl();
 if(state==='hidden'||state==='exiting')return E.hide(id,opt);if(state==='live'||state==='visible'){if(!E.isVisible(inst))return E.show(id,inst.data,opt);if(inst.tracks.state){inst.tracks.state.cancel()}if(tpl.calm)withTokens(tpl,0,()=>tpl.calm(U(inst),inst));playTracks(inst);return setState(inst,'live')}
 if(!E.isVisible(inst))return false;if(state==='emphasis'||state==='alert'){if(!setState(inst,state))return false;const f=tpl[state]||((u,i)=>B.PRESETS[state==='alert'?'alertPulse':'numberPop'](u.track('state'),i.els.root||Object.values(i.els)[0],{}));
  withTokens(tpl,0,()=>f(U(inst),inst));playTracks(inst);if(state==='emphasis'){const t=inst.tracks.state;const back=()=>{if(inst.state==='emphasis')setState(inst,'live')};if(t&&t.state==='playing'){const a=t.cb.onComplete;t.cb.onComplete=x=>{a&&a(x);back()}}else back()}return true}
 if(state==='transitioning')return setState(inst,'transitioning');return false};
E.trigger=function(id,action,arg,opt={}){const inst=setOf(opt.channel||'PGM').get(id);if(!inst)return false;const tpl=inst.tpl();const f=tpl.actions&&tpl.actions[action];if(!f){note(`trigger ${id}.${action}: unknown`);return false}
 if(!E.isVisible(inst))return false;remember(inst);withTokens(tpl,0,()=>f.call(tpl.actions,U(inst),inst,arg));playTracks(inst);note(`trigger ${id}.${action}`);return true};
/* rollback: restore the previous on-air snapshot (data + visibility) without an entrance replay */
E.rollback=function(){const s=E.history.pop();if(!s)return false;const inst=E.pgm.get(s.id);note(`ROLLBACK ${s.id}`);
 if(!s.visible){if(inst&&E.isVisible(inst))exit(inst,{scale:.6});return true}
 if(inst&&E.isVisible(inst)&&inst.state!=='exiting'){inst.pending={data:s.data};flush(inst)}else E.show(s.id,s.data,{template:s.templateId});E.history.pop();return true};
E.hideAll=function(channel='PGM'){for(const i of setOf(channel).values())if(E.isVisible(i))exit(i,{scale:.6});E.queues={}};
E.clear=function(channel='PGM'){for(const i of setOf(channel).values())killAll(i);setOf(channel).clear()};

/* ---------- rundown (cue / take) ---------- */
E.rundownSet=(items,name)=>{E.rundown={items:(items||[]).map((x,i)=>Object.assign({cue:'C'+(i+1)},x)),pos:0,name:name||''};B.bus.emit('bmg.rundown',E.rundown)};
E.cue=i=>{E.rundown.pos=clamp(i|0,0,Math.max(0,E.rundown.items.length-1));B.bus.emit('bmg.rundown',E.rundown);return E.rundown.items[E.rundown.pos]};
E.takeCue=function(){const it=E.rundown.items[E.rundown.pos];if(!it)return null;const r=E.command(Object.assign({op:it.action||'show'},it));E.rundown.pos=Math.min(E.rundown.items.length,E.rundown.pos+1);B.bus.emit('bmg.rundown',E.rundown);return r};

/* ---------- live data binding ---------- */
E.bind=(id,source,opt={})=>{E.bindings.set(id,{source,last:'',opt})};E.unbind=id=>E.bindings.delete(id);
function pollBindings(){for(const [id,b] of E.bindings){let v;try{v=b.source()}catch(e){continue}if(v==null)continue;const j=JSON.stringify(v);if(j===b.last)continue;b.last=j;
 const inst=E.pgm.get(id);if(inst&&E.isVisible(inst))E.update(id,v,{silent:true});else if(b.opt.autoShow)E.show(id,v,b.opt);else if(inst)inst.data=B.applySchema(inst.tpl().dataSchema,Object.assign({},inst.data,v))}}

/* ---------- JSON command API (studio, rundown, phones, other apps) ---------- */
E.command=function(c){if(typeof c==='string')c=JSON.parse(c);const o={template:c.template||c.templateId,priority:c.priority,channel:c.channel,force:c.force,slot:c.slot};Object.keys(o).forEach(k=>o[k]===undefined&&delete o[k]);
 switch(c.op||c.action){case 'show':return E.show(c.id,c.data,o);case 'update':return E.update(c.id,c.data,o);case 'hide':return E.hide(c.id,o);case 'preview':return E.preview(c.id,c.data,o);case 'take':return E.take(c.id,o);
  case 'interrupt':return E.interrupt(c.id,o);case 'queue':return E.queue(c.id,c.data,o);case 'state':return E.setState(c.id,c.state,o);case 'trigger':return E.trigger(c.id,c.name||c.trigger,c.arg,o);
  case 'rollback':return E.rollback();case 'hideAll':return E.hideAll(c.channel);case 'cue':return E.cue(c.index);case 'takeCue':return E.takeCue();default:throw new Error('unknown op '+(c.op||c.action))}};
B.bus.on('bmg.command',c=>{try{E.command(c)}catch(e){note('command error: '+e.message)}});

/* ================= frame step (tick) + draw ================= */
E.step=function(dt){for(const set of [E.pgm,E.pvw])for(const inst of set.values())if(inst.pending)flush(inst);
 pollBindings();B.clocks.PGM.tick(dt);B.clocks.PVW.tick(dt);
 for(const set of [E.pgm,E.pvw])for(const inst of set.values()){if(!E.isVisible(inst)&&inst.state!=='exiting')continue;const tpl=inst.tpl();
  if(tpl.sim){try{tpl.sim(inst,dt)}catch(e){console.warn('[BMG sim]',e)}}
  if(inst.hideAt!=null&&inst.clock().time>=inst.hideAt&&inst.state!=='exiting'){inst.hideAt=null;exit(inst)}}};
E.draw=function(ctx,channel='PGM',env={}){const t0=root.performance?performance.now():0;const list=Array.from(setOf(channel).values()).filter(i=>E.isVisible(i)||i.state==='exiting').sort((a,b)=>a.z-b.z);
 const ev=Object.assign({channel,t:B.clocks[channel].time},env);
 for(const inst of list){const tpl=inst.tpl();try{ctx.save();tpl.draw(ctx,inst,ev);ctx.restore()}catch(e){try{ctx.restore()}catch(_){}console.warn('[BMG draw]',inst.instanceId,e)}}
 if(channel==='PGM'&&B.gpu&&env.gpu!==false){try{B.gpu.composite(ctx)}catch(e){}}
 if(E.cfg.guides&&B.K)B.K.safeGuides(ctx);if(channel==='PGM'&&E.cfg.perfOverlay)E.drawPerf(ctx);
 if(root.performance&&channel==='PGM')B.perf.addCost(performance.now()-t0);return list.length};
E.onAir=(channel='PGM')=>Array.from(setOf(channel).values()).filter(i=>E.isVisible(i)).map(i=>({id:i.instanceId,template:i.templateId,version:i.templateVersion,state:i.state,priority:i.priority,slot:i.slot,transition:i.currentTransition,timelines:E.timelinesOf(i)}));
E.diag=()=>{const s=B.perf.stats();return Object.assign({},s,{timelines:B.activeTimelines(),pgm:E.onAir('PGM').length,pvw:E.onAir('PVW').length,queues:Object.values(E.queues).reduce((n,q)=>n+q.length,0),
 particles:B.gpu&&B.gpu.stats?B.gpu.stats().particles:0,cache:B.K&&B.K.cacheSize?B.K.cacheSize():0,stats:E.stats})};
E.drawPerf=function(ctx){const d=E.diag();const lines=[`FPS ${d.fps.toFixed(0)} · target ${B.perf.target}`,`frame avg ${d.avg.toFixed(1)}ms · p95 ${(d.p95||0).toFixed(1)} · worst ${(d.worst||0).toFixed(0)}`,`BMG cost ${d.cost.toFixed(2)}ms · dropped ${d.dropped} · quality L${d.level}`,
 `on-air ${d.pgm} · preview ${d.pvw} · timelines ${d.timelines} · queue ${d.queues}`,`particles ${d.particles} · layer cache ${d.cache}`];
 ctx.save();ctx.setTransform(ctx.canvas.width/1920,0,0,ctx.canvas.width/1920,0,0);ctx.globalAlpha=1;ctx.fillStyle='rgba(5,8,20,.78)';ctx.fillRect(24,700,560,30+lines.length*30);ctx.font='600 20px ui-monospace,Consolas,monospace';ctx.textAlign='left';ctx.textBaseline='top';ctx.direction='ltr';
 lines.forEach((l,i)=>{ctx.fillStyle=i===0?(d.fps<50?'#ff5a6a':'#5cf2a8'):'#dfe6ff';ctx.fillText(l,40,714+i*30)});
 const n=Math.min(120,B.perf.n);ctx.strokeStyle='#27e0ff';ctx.beginPath();for(let i=0;i<n;i++){const v=B.perf.ft[(B.perf.i-n+i+B.perf.N)%B.perf.N];const x=320+i*2.1,y=716+Math.min(60,v*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.restore()};

/* ---------- config ---------- */
E.setFps=f=>{E.cfg.fps=f===30?30:60;B.perf.target=E.cfg.fps};
/* own frame loop (browser): ticks both clocks once per frame; drawing is done by whoever owns a canvas (stage, studio monitors) */
let raf=0,last=0,frameSkip=false;
E.start=function(){if(raf||!root.requestAnimationFrame)return;const loop=now=>{raf=requestAnimationFrame(loop);B.perf.frame(now);const dt=last?Math.min(.1,(now-last)/1000):0;
  if(E.cfg.fps===30){frameSkip=!frameSkip;if(frameSkip){return}}last=now;E.step(dt)};raf=requestAnimationFrame(loop)};
E.stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0};
})(typeof window!=='undefined'?window:globalThis);
