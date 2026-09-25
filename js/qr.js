/* DADASHMODE V8 · offline QR Code generator (Model 2, byte mode, versions 1–40, ECC L/M/Q/H, automatic mask by penalty score).
   Algorithm follows ISO/IEC 18004 (structure after Project Nayuki's reference design, MIT). No network, no dependencies.
   QR.make(text,{ecl:'M'}) → {size, get(x,y)}   ·   QR.draw(canvas,text,{scale,margin,dark,light})   ·   QR.svg(text) */
(function(root){'use strict';
const ECC=[[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
 [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
 [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
 [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]];
const BLK=[[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
 [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
 [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
 [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]];
const ECL={L:[0,1],M:[1,0],Q:[2,3],H:[3,2]};/* [table row, format bits] */
const rawModules=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
const dataCodewords=(v,e)=>Math.floor(rawModules(v)/8)-ECC[e][v]*BLK[e][v];
function gmul(x,y){let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11d);z^=((y>>>i)&1)*x}return z&255}
function rsDivisor(d){const r=new Array(d).fill(0);r[d-1]=1;let root=1;for(let i=0;i<d;i++){for(let j=0;j<d;j++){r[j]=gmul(r[j],root);if(j+1<d)r[j]^=r[j+1]}root=gmul(root,2)}return r}
function rsRem(data,div){const r=div.map(()=>0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=gmul(c,f))}return r}
function utf8(s){return Array.from(new TextEncoder().encode(String(s)))}
function make(text,opt={}){const bytes=utf8(text);const want=ECL[(opt.ecl||'M').toUpperCase()]||ECL.M;let e=want[0],ver=0;
 for(let v=opt.minVersion||1;v<=40;v++){const cc=v<10?8:16;const bits=4+cc+bytes.length*8;if(bits<=dataCodewords(v,e)*8){ver=v;break}}
 if(!ver)throw new Error('QR: text too long');
 /* boost ECC if it still fits */
 for(const k of ['M','Q','H']){const c=ECL[k];if(c[0]>e&&(4+(ver<10?8:16)+bytes.length*8)<=dataCodewords(ver,c[0])*8&&opt.boost!==false)e=c[0]}
 const fmt=[1,0,3,2][e];const cap=dataCodewords(ver,e)*8;const bb=[];const push=(val,n)=>{for(let i=n-1;i>=0;i--)bb.push((val>>>i)&1)};
 push(4,4);push(bytes.length,ver<10?8:16);bytes.forEach(b=>push(b,8));push(0,Math.min(4,cap-bb.length));push(0,(8-bb.length%8)%8);for(let p=0xec;bb.length<cap;p^=0xec^0x11)push(p,8);
 const data=[];for(let i=0;i<bb.length;i+=8){let b=0;for(let j=0;j<8;j++)b=(b<<1)|bb[i+j];data.push(b)}
 /* ECC + interleave */
 const nb=BLK[e][ver],el=ECC[e][ver],raw=Math.floor(rawModules(ver)/8),nShort=nb-raw%nb,shortLen=Math.floor(raw/nb);const div=rsDivisor(el);const blocks=[];
 for(let i=0,k=0;i<nb;i++){const d=data.slice(k,k+shortLen-el+(i<nShort?0:1));k+=d.length;const ecc=rsRem(d,div);if(i<nShort)d.push(0);blocks.push(d.concat(ecc))}
 const cw=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==shortLen-el||j>=nShort)cw.push(b[i])});
 /* matrix */
 const N=ver*4+17;const M=Array.from({length:N},()=>new Array(N).fill(false));const F=Array.from({length:N},()=>new Array(N).fill(false));
 const set=(x,y,d)=>{M[y][x]=d;F[y][x]=true};
 for(let i=0;i<N;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
 const finder=(x,y)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),xx=x+dx,yy=y+dy;if(xx>=0&&xx<N&&yy>=0&&yy<N)set(xx,yy,d!==2&&d!==4)}};
 finder(3,3);finder(N-4,3);finder(3,N-4);
 const ap=(()=>{if(ver===1)return [];const n=Math.floor(ver/7)+2;const step=ver===32?26:Math.ceil((ver*4+4)/(n*2-2))*2;const r=[6];for(let p=N-7;r.length<n;p-=step)r.splice(1,0,p);return r})();
 ap.forEach((a,i)=>ap.forEach((b,j)=>{if((i===0&&j===0)||(i===0&&j===ap.length-1)||(i===ap.length-1&&j===0))return;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}));
 const format=mask=>{const d=fmt<<3|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const bits=((d<<10)|r)^0x5412;const g=i=>((bits>>>i)&1)!==0;
  for(let i=0;i<=5;i++)set(8,i,g(i));set(8,7,g(6));set(8,8,g(7));set(7,8,g(8));for(let i=9;i<15;i++)set(14-i,8,g(i));
  for(let i=0;i<8;i++)set(N-1-i,8,g(i));for(let i=8;i<15;i++)set(8,N-15+i,g(i));set(8,N-8,true)};
 format(0);
 if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1f25);const bits=ver<<12|r;for(let i=0;i<18;i++){const b=((bits>>>i)&1)!==0,a=N-11+i%3,c=Math.floor(i/3);set(a,c,b);set(c,a,b)}}
 let bi=0;for(let right=N-1;right>=1;right-=2){if(right===6)right=5;for(let v=0;v<N;v++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?N-1-v:v;if(!F[y][x]&&bi<cw.length*8){M[y][x]=((cw[bi>>>3]>>>(7-(bi&7)))&1)!==0;bi++}}}
 const inv=(m,x,y)=>[(x+y)%2===0,y%2===0,x%3===0,(x+y)%3===0,(Math.floor(x/3)+Math.floor(y/2))%2===0,x*y%2+x*y%3===0,(x*y%2+x*y%3)%2===0,((x+y)%2+x*y%3)%2===0][m];
 const apply=m=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!F[y][x]&&inv(m,x,y))M[y][x]=!M[y][x]};
 const penalty=()=>{let p=0;const line=get=>{for(let a=0;a<N;a++){let run=1;for(let b=1;b<N;b++){if(get(a,b)===get(a,b-1)){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}
   for(let b=0;b+10<N;b++){const s=[];for(let k=0;k<11;k++)s.push(get(a,b+k)?1:0);const t=s.join('');if(t==='10111010000'||t==='00001011101')p+=40}}};
  line((a,b)=>M[a][b]);line((a,b)=>M[b][a]);for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])p+=3}
  let dark=0;M.forEach(r=>r.forEach(v=>{if(v)dark++}));p+=Math.floor(Math.abs(dark*20-N*N*10)/(N*N))*10;return p};
 let best=0,bp=1e9;if(opt.mask!=null)best=opt.mask;else for(let m=0;m<8;m++){apply(m);format(m);const pp=penalty();if(pp<bp){bp=pp;best=m}apply(m)}
 apply(best);format(best);
 return {size:N,version:ver,ecl:'LMQH'[e],mask:best,get:(x,y)=>x>=0&&y>=0&&x<N&&y<N&&M[y][x],matrix:M}}
function draw(cv,text,o={}){const q=make(text,o);const m=o.margin??4,sc=o.scale||Math.max(2,Math.floor((o.px||320)/(q.size+m*2)));const W=(q.size+m*2)*sc;cv.width=W;cv.height=W;const c=cv.getContext('2d');
 c.fillStyle=o.light||'#ffffff';c.fillRect(0,0,W,W);c.fillStyle=o.dark||'#000000';for(let y=0;y<q.size;y++)for(let x=0;x<q.size;x++)if(q.get(x,y))c.fillRect((x+m)*sc,(y+m)*sc,sc,sc);return q}
function svg(text,o={}){const q=make(text,o);const m=o.margin??4,W=q.size+m*2;let d='';for(let y=0;y<q.size;y++)for(let x=0;x<q.size;x++)if(q.get(x,y))d+=`M${x+m},${y+m}h1v1h-1z`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" shape-rendering="crispEdges"><rect width="${W}" height="${W}" fill="${o.light||'#fff'}"/><path d="${d}" fill="${o.dark||'#000'}"/></svg>`}
const QR={make,draw,svg};root.QR=QR;if(typeof module!=='undefined'&&module.exports)module.exports=QR;
})(typeof globalThis!=='undefined'?globalThis:window);
