/* DADASHMODE V8 · BMG · 8a · BRIDGE: show engine (V7) → broadcast graphics, style switch, remote control, spec §4 catalogue
   · «سبک گرافیک»: classic (the existing realistic V7 HUD) or broadcast (this system). Selectable at any time, also mid-show.
   · In broadcast style the V7 HUD (bank tiles, main timer, state ribbon) is replaced by the data-bound Scorebug + Bug, and V7 effect events
     are routed to broadcast templates (stinger + segment intro on state change, point splash on awards, winner reveal, alerts …).
   · Data binding: banks/names/colours/timer/state are read from the show engine every frame; the engine diffs and animates only changes.
   · Remote control: window.postMessage({bmg:{op,…}}) and BroadcastChannel('dadashmode-bmg') accept the same JSON commands. */
(function(){
'use strict';
const B=window.BMG,E=B.engine;const LS='bmg-set';
const S=Object.assign({style:'classic',brand:'episode',tempo:1,fps:60,guides:false,perf:false,safeProgram:false,
 auto:{scorebug:true,bug:true,stingers:true,intros:true,splashes:true,alerts:true,winner:true,reveal:true}},(()=>{try{return JSON.parse(localStorage.getItem(LS)||'{}')}catch(e){return {}}})());
S.auto=Object.assign({scorebug:true,bug:true,stingers:true,intros:true,splashes:true,alerts:true,winner:true,reveal:true},S.auto||{});
const save=()=>{try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}};
const V=()=>window.V7&&V7.S?V7:null;const Pp=()=>{try{return (0,eval)('P')}catch(e){return null}};
const bc=()=>S.style==='broadcast';

/* ---------- spec §4 catalogue: every named component → template (+variant data) or explicitly not built ---------- */
const C=(name,template,data,status)=>({name,template,data:data||{},status:status||(template?'template':'not-built')});
B.CATALOG={general:[C('Lower Third','lowerThird'),C('Name Strap','lowerThird',{variant:'name'},'variant'),C('Over-the-Shoulder (OTS)','lowerThird',{variant:'ots'},'variant'),C('Fullscreen Graphic','segmentIntro',{variant:'headline'},'variant'),
  C('Side Panel','playerCard',{},'variant'),C('Information Panel','playerCard',{name:'اطلاعات',stats:[['قانون','کف ۲۰ ثانیه'],['سقف فاصله','۳۰']]},'variant'),C('Bug / Watermark','bug'),C('Sponsor Bug','sponsor'),C('Ticker / Crawl','ticker'),C('Scrolling Crawl','ticker',{},'variant'),
  C('Callout','alert',{level:'info',text:'نکته'},'variant'),C('Annotation','alert',{level:'info',text:'توضیح'},'variant'),C('Location Strap','lowerThird',{variant:'location',title:'تهران',subtitle:'استودیوی خانه'},'variant'),C('Quote Card','lowerThird',{variant:'quote',title:'تاج رو پس می‌گیرم',subtitle:'عماد'},'variant'),
  C('Headline Card','segmentIntro',{variant:'headline'},'variant'),C('Breaking/Alert Graphic','alert'),C('Segment Intro','segmentIntro'),C('Segment Outro','segmentIntro',{variant:'outro',kicker:'پایان',title:'قسمت بعد: دفاع از تاج'},'variant'),C('Bumper','segmentIntro',{variant:'bumper',kicker:'بعد از تبلیغ',title:'فینال گاوصندوق'},'variant'),
  C('Stinger','stinger'),C('Transition','stinger',{},'variant'),C('Wipe Transition','stinger',{style:'wipe'},'variant'),C('DVE-style Transition','stinger',{style:'dve'},'variant'),C('Sponsor Sting','sponsor',{},'variant'),C('Station/Show ID','bug',{},'variant')],
 gameshow:[C('Contestant Card','playerCard'),C('Player Card','playerCard',{},'variant'),C('Team Card','playerCard',{},'variant'),C('Matchup / Head-to-Head','matchup'),C('Question Reveal','answerReveal',{correct:''},'variant'),C('Answer Reveal','answerReveal',{},'variant'),
  C('Correct Answer Reveal','answerReveal',{correct:'yes'},'variant'),C('Wrong Answer Reveal','answerReveal',{correct:'no'},'variant'),C('Locked-In State','lockedIn'),C('Countdown','countdown'),C('Buzzer / Timer','countdown',{},'variant'),C('Score Change','scorebug',{},'variant'),
  C('Score Increment','scoreSplash',{value:10},'variant'),C('Score Decrement','scoreSplash',{value:-5},'variant'),C('Streak','alert',{level:'safe',text:'۳ برد پشت‌سرهم'},'variant'),C('Multiplier','scoreSplash',{value:2,unit:'برابر'},'variant'),C('Progress Meter','progressMeter'),
  C('Round Indicator','segmentIntro',{},'variant'),C('Stage Indicator','scorebug',{},'variant'),C('Jackpot Meter','progressMeter',{style:'jackpot',label:'جک‌پات'},'variant'),C('Bonus Meter','progressMeter',{label:'بونوس'},'variant'),C('Lifeline','lockedIn',{text:'ذره‌بین فعال'},'variant'),
  C('Audience Poll','leaderboard',{title:'رأی کامنت‌ها',rows:[{name:'لیمو',score:48},{name:'خیارشور',score:31},{name:'زیتون',score:21}]},'variant'),C('Elimination Graphic','alert',{level:'danger',text:'حذف شد'},'variant'),C('Danger/Safe State','alert',{},'variant'),C('Finalist Reveal','playerCard',{},'variant'),
  C('Top-N Reveal','leaderboard',{},'variant'),C('Ranking Change','leaderboard',{},'variant'),C('Winner Reveal','winnerReveal'),C('Runner-Up Reveal','winnerReveal',{kicker:'نفر دوم',confetti:false},'variant'),C('Podium','podium'),C('Confetti Celebration','celebration'),
  C('Celebration Fullscreen','winnerReveal',{},'variant'),C('Dramatic Suspense Reveal','numberReveal',{},'variant'),C('3D Hero Graphic','hero3d')],
 sports:[C('Scorebug','scorebug'),C('Game Clock','scorebug',{},'variant'),C('Period/Quarter Indicator','scorebug',{},'variant'),C('Team Score','scorebug',{},'variant'),C('Player Lower Third','lowerThird',{},'variant'),C('Player Intro','playerCard',{},'variant'),
  C('Starting Lineup','leaderboard',{},'variant'),C('Roster','leaderboard',{},'variant'),C('Head-to-Head','matchup',{},'variant'),C('Matchup','matchup',{},'variant'),C('Standings','leaderboard',{},'variant'),C('Leaderboard','leaderboard'),C('Rank Change','leaderboard',{},'variant'),
  C('Position Change','leaderboard',{},'variant'),C('Stat Comparison','matchup',{},'variant'),C('Live Stats','playerCard',{},'variant'),C('Player Stats','playerCard',{},'variant'),C('Team Stats','playerCard',{},'variant'),C('Goal/Point Splash','scoreSplash'),
  C('Replay Bug','bug',{label:'REPLAY',sub:'بازپخش'},'variant'),C('Replay Transition','stinger',{label:'REPLAY'},'variant'),C('Three Stars / Top Players','podium',{},'variant'),C('Period Summary','matchup',{},'variant'),C('Match Summary','matchup',{},'variant'),
  C('Next Event','segmentIntro',{variant:'bumper'},'variant'),C('Coming Up','segmentIntro',{variant:'bumper',kicker:'در ادامه'},'variant'),C('Power-Play / Advantage Timer','countdown',{},'variant'),C('Penalty Box','alert',{level:'danger',text:'جریمه ۱۰ ثانیه'},'variant'),
  C('Shot Counter','progressMeter',{label:'پرتاب‌ها',max:3,value:1,markers:[1,2,3],unit:'پرتاب'},'variant'),C('Race Order','leaderboard',{},'variant'),C('Lap Counter','progressMeter',{label:'دور',max:3,value:1,markers:[1,2,3],unit:''},'variant'),C('Sector/Lap Time','numberReveal',{},'variant'),
  C('Telemetry',null,{},'not-built'),C('Map/Track Overlay',null,{},'not-built'),C('Ticker','ticker',{},'variant'),C('Sponsor Integration','sponsor',{},'variant')]};
B.catalogStats=()=>{const all=[].concat(...Object.values(B.CATALOG));return {total:all.length,templates:all.filter(x=>x.status==='template').length,variants:all.filter(x=>x.status==='variant').length,notBuilt:all.filter(x=>x.status==='not-built').map(x=>x.name)}};

/* ---------- apply settings ---------- */
function applySettings(){B.motion.durationScale=+S.tempo||1;E.setFps(+S.fps);E.cfg.guides=!!S.guides;E.cfg.perfOverlay=!!S.perf;B.a11y.safeProgram=!!S.safeProgram;const p=Pp();try{B.setBrand(S.brand,p&&p.theme)}catch(e){}}
let themeKey='';setInterval(()=>{const p=Pp();const k=JSON.stringify(p&&p.theme||{})+S.brand;if(k!==themeKey){themeKey=k;try{B.setBrand(S.brand,p&&p.theme)}catch(e){}}},2000);

/* ---------- V7 → data (binding sources) ---------- */
const pl=k=>({name:V7.plain(k),color:V7.color(k),score:Math.round(V7.bank(k)*10)/10});
function scorebugData(){const v=V();if(!v)return null;const s=v.S();const t=v.timer();const b=v.banks();const L=v.R.leaderOf(b);
 return {E:pl('E'),M:pl('M'),stage:(v.R.STATE_FA[s.state]||s.state).split(' · ')[0],clock:t?{remain:t.remain!=null?Math.round(t.remain*10)/10:(t.elapsed!=null?Math.round(t.elapsed*10)/10:null),total:t.total||0,label:t.label||''}:{remain:null,total:0,label:''},leader:L||'',unit:(Pp()&&Pp().unit)||'ثانیه'}}
E.bind('scorebug',()=>bc()&&S.auto.scorebug?scorebugData():null);

/* ---------- auto graphics watcher (4 Hz): what should be on air in broadcast style ---------- */
setInterval(()=>{const v=V();if(!v)return;const s=v.S();const want=bc()&&s.on;
 const sb=E.get('scorebug');if(want&&S.auto.scorebug){if(!E.isVisible(sb)||sb.state==='exiting')E.show('scorebug',scorebugData(),{template:'scorebug'});
  else{const t=v.timer();const danger=t&&t.remain!=null&&t.remain<=10&&t.remain>0&&!s.paused;if(danger&&sb.state==='live')E.setState('scorebug','alert');else if(!danger&&sb.state==='alert')E.setState('scorebug','live')}}
 else if(sb&&E.isVisible(sb)&&sb.state!=='exiting'&&(!want||!S.auto.scorebug))E.hide('scorebug');
 const bg=E.get('bug');if(want&&S.auto.bug){if(!E.isVisible(bg)||bg.state==='exiting')E.show('bug',{label:'DADASHMODE',sub:(Pp()&&Pp().name)||'بانک زمان'},{template:'bug'})}else if(bg&&E.isVisible(bg)&&bg.state!=='exiting')E.hide('bug')},250);

/* ---------- V7 effect events → broadcast templates ---------- */
const MAJOR={R1:1,R2:1,R3_SANDWICH:1,R4_GLUE:1,REVEAL:1,SHOP:1,RISK:1,VAULT_ARMED:1,RUN1:1,RUN2:1,CASE:1,END:1};
const ORDER=['R1','R2','R3_SANDWICH','R4_GLUE','SHOP','RISK','RUN1','CASE'];
let coverPending=null;B.bus.on('stinger.cover',()=>{if(coverPending){const f=coverPending;coverPending=null;f()}});
const side=k=>k==='E'||k==='M'?k:'C';
const OWN={
 state(d){if(!S.auto.stingers&&!S.auto.intros)return false;const st=d.st;if(!MAJOR[st]){if(S.auto.stingers)E.show('stinger',{label:fa[0],sub:fa[1]||'',style:'wipe'},{template:'stinger',force:true});return !!S.auto.stingers}const fa=(V7.R.STATE_FA[st]||st).split(' · ');
  const intro=()=>{if(S.auto.intros)E.show('intro',{kicker:fa[0],title:fa[1]||fa[0],subtitle:(V7.INTRO[st]||['',''])[1].split('.').slice(0,1).join('.'),index:Math.max(1,ORDER.indexOf(st)+1),total:ORDER.length,hold:2.6},{template:'segmentIntro',force:true})};
  if(S.auto.stingers){coverPending=intro;E.show('stinger',{label:fa[0],sub:'',style:'slabs'},{template:'stinger',force:true})}else intro();return true},
 win(d){if(!S.auto.splashes)return false;const k=d.k||'E';E.show('splash'+k,{value:d.sec??d.st??0,name:V7.plain(k),color:V7.color(k),side:side(k),unit:(Pp()&&Pp().unit)||'ثانیه'},{template:'scoreSplash',replay:true});return true},
 goal(d){return OWN.win(d)},riskhit(d){return OWN.win({k:d.k,sec:d.st})},
 riskmiss(d){if(!S.auto.splashes)return false;const k=d.k||'E';E.show('splash'+k,{value:-(d.st||0),name:V7.plain(k),color:V7.color(k),side:side(k)},{template:'scoreSplash',replay:true});return true},
 miss(d){if(!S.auto.alerts)return false;E.show('alert',{text:'نخورد',level:'danger',hold:1.2},{template:'alert',force:true});return true},
 stamp(d){if(!S.auto.alerts)return false;E.show('alert',{text:d.text||'',level:d.ok?'safe':'danger',hold:1.4},{template:'alert',force:true});return true},
 sealed(d){if(!S.auto.alerts)return false;const k=d.k||'E';E.show('lock'+k,{name:V7.plain(k),color:V7.color(k),side:k,text:'ثبت شد ●',hold:2.2},{template:'lockedIn',replay:true});return true},
 timeout(d){if(!S.auto.alerts)return false;E.show('alert',{text:'وقت تمام!',level:'danger',sub:d.k?V7.plain(d.k):'',hold:2.2},{template:'alert',force:true});return true},
 suddendeath(){if(!S.auto.alerts)return false;E.show('alert',{text:'مرگ ناگهانی!',level:'danger',sub:'یک سُر توکن · نزدیک‌تر به مرکز برنده',hold:3},{template:'alert',force:true});return true},
 bankopen(){if(!S.auto.stingers)return false;E.show('stinger',{label:'BANK OPEN',sub:'بانک باز شد',style:'dve'},{template:'stinger',force:true});return true},
 reveal(){if(!S.auto.reveal)return false;const u=(Pp()&&Pp().unit)||'ثانیه';E.show('matchup',{title:'رونمایی بانک',E:Object.assign(pl('E'),{tag:''}),M:Object.assign(pl('M'),{tag:''}),unit:u,note:'',hold:4.5},{template:'matchup',force:true});return true},
 vaultopen(d){if(!S.auto.winner)return false;const k=d.k||'E';E.show('celebrate',{kind:'cannons'},{template:'celebration',replay:true});E.show('vaultnum',{label:'گاوصندوق باز شد · '+V7.plain(k),value:d.left!=null?Math.round(d.left*10)/10:0,unit:'ثانیه باقی ماند',color:V7.color(k),hold:3.6},{template:'numberReveal',force:true});return true},
 case(d){if(!S.auto.winner)return false;const k=d.k;if(!k)return false;E.show('winner',{name:V7.plain(k),color:V7.color(k),kicker:'برندهٔ کیف طلایی',subtitle:'نشان ساندویچ طلایی روی تاج',hold:6.5},{template:'winnerReveal',force:true});return true},
 winner(d){return d&&d.k?OWN.case(d):false}};
window.BMGB={S,save,apply:applySettings,broadcast:bc,
 take(kind,d){if(!bc())return false;const f=OWN[kind];if(!f)return false;try{return !!f(d||{})}catch(e){console.warn('[BMG bridge]',kind,e);return false}},
 owns:k=>bc()&&!!OWN[k],
 setStyle(st){S.style=st==='broadcast'?'broadcast':'classic';save();if(!bc()){['scorebug','bug'].forEach(id=>{const i=E.get(id);if(i&&E.isVisible(i))E.hide(id)})}B.bus.emit('bmg.style',S.style)},
 renderProgram(ctx){if(!E.cfg.program)return;const sc=ctx.canvas.width/1920;ctx.save();ctx.setTransform(sc,0,0,sc,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';E.draw(ctx,'PGM');ctx.restore()}};

/* ---------- remote control (other windows / tabs / an OBS browser dock) ---------- */
addEventListener('message',e=>{const c=e.data&&e.data.bmg;if(c){try{E.command(c)}catch(err){console.warn('[BMG remote]',err)}}});
try{const ch=new BroadcastChannel('dadashmode-bmg');ch.onmessage=e=>{if(e.data&&e.data.op){try{E.command(e.data)}catch(err){console.warn('[BMG remote]',err)}}};B.remote=ch}catch(e){}

/* ---------- default rundown for this show (editable in the studio, saved per episode) ---------- */
B.defaultRundown=()=>[{id:'bug',template:'bug',action:'show',data:{},note:'لوگو'},{id:'l3E',template:'lowerThird',action:'show',data:{title:'الیاس',subtitle:'داداش بزرگه · کارگردان'},note:'معرفی الیاس'},
 {id:'l3E',action:'hide',note:''},{id:'l3M',template:'lowerThird',action:'show',data:{title:'عماد',subtitle:'داداش کوچیکه · مدافع تاج',color:'#00c98d'},note:'معرفی عماد'},{id:'l3M',action:'hide'},
 {id:'rules',template:'segmentIntro',action:'show',data:{kicker:'قانون',title:'هر نفر ۴۵ ثانیه',subtitle:'هر ثانیه یه سلاحه',index:0,total:0},note:'قانون بانک'},
 {id:'ticker',template:'ticker',action:'show',data:{},note:'تیکر'},{id:'ticker',action:'hide'},{id:'hero',template:'hero3d',action:'show',data:{title:'تاج',subtitle:'دفاع از تاج · قسمت بعد'},note:'پایان · قهرمان سه‌بعدی'},{id:'hero',action:'hide'}];

applySettings();E.start();
})();
