// Бот: стратегічні ходи, розстановка, шаховий пошук
/* ---------- бот ---------- */
function dmap(r,c){const d=Array(H*W).fill(99);d[r*W+c]=0;const q=[[r,c]];while(q.length){const[a,b]=q.shift();for(const[x,y]of D4){const n=a+x,m=b+y;if(n<0||m<0||n>=H||m>=W||MAP[n][m]==='#'||d[n*W+m]<99)continue;d[n*W+m]=d[a*W+b]+1;q.push([n,m])}}return d}
function aiTurn(){aiQ=gens.filter(g=>g.side==='foe').map(g=>g.n);aiNext()}
function aiNext(){if(over||D)return;const n=aiQ.shift();
if(!n){turn='me';gens.forEach(g=>{if(g.side==='me')g.moved=false});recruit('me');push();render();return}
const g=gens.find(x=>x.n===n&&x.side==='foe');if(!g)return aiNext();
const c0=cities[g.r+','+g.c];if(c0&&c0.own==='foe'&&g.bal>=30)hire(g);
const opts=Object.values(reach(g)),tg=opts.find(x=>(x.foe&&g.bal>=x.foe.bal*0.8)||(x.gar&&g.bal>=GAR+10));
if(tg){log(g.n+' нападає на '+(tg.foe?tg.foe.n:'столицю'));render();startDuel(g,tg.foe||null,[tg.r,tg.c]);return}
let goals=g.bal<14?Object.keys(cities).filter(k=>cities[k].own==='foe'):[];
if(!goals.length){goals=Object.keys(cities).filter(k=>cities[k].own!=='foe');gens.filter(x=>x.side==='me').forEach(x=>goals.push(x.r+','+x.c))}
const dm=goals.map(k=>{const[r,c]=k.split(',').map(Number);return dmap(r,c)});let best={r:g.r,c:g.c},bs=1e9;
opts.filter(x=>!x.foe&&!x.gar).concat([{r:g.r,c:g.c}]).forEach(x=>{const v=Math.min(...dm.map(d=>d[x.r*W+x.c]))+Math.random()*.8;if(v<bs){bs=v;best=x}});
g.r=best.r;g.c=best.c;g.moved=true;arrive(g);render();setTimeout(aiNext,350)}
function botPlace(){const ac=mc()==='w'?'b':'w',bal=D[ac+'bal'],rows=bal>=30?3:2,fr=i=>ac==='b'?i>>3:7-(i>>3);let cells=[];
for(let r=0;r<rows;r++)for(let c=0;c<8;c++){const i=(ac==='w'?7-r:r)*8+c;if(!D.b[i])cells.push(i)}
cells.sort(()=>Math.random()-.5);cells.sort((x,y)=>fr(y)-fr(x));
let bud=Math.floor(bal*0.95),list=[];const buy=t=>{if(V[t]<=bud&&list.length<cells.length){list.push(t);bud-=V[t];return true}return false};
for(let i=0;i<Math.min(6,Math.floor(bal*0.3));i++)buy('P');for(const t of['Q','R','B','N','R','B','N','Q','R'])buy(t);while(list.length<cells.length&&buy('P'));
const used=new Set(),back=cells.slice().reverse();let spent=0;
list.filter(t=>t==='P').forEach(t=>{const i=cells.find(i=>!used.has(i)&&fr(i)>0);if(i!=null){used.add(i);D.b[i]=ac+t;spent+=1}});
list.filter(t=>t!=='P').sort((x,y)=>V[y]-V[x]).forEach(t=>{const i=back.find(i=>!used.has(i));if(i!=null){used.add(i);D.b[i]=ac+t;spent+=V[t]}});
D[ac+'rem']=bal-spent;D[ac+'r']=1}
const PV={P:100,N:320,B:330,R:500,Q:900,K:0},MATE=100000,PT=[0,0,5,10,20,40,90,0];
function ev(b,col){const sc={w:0,b:0},mat={w:0,b:0},pc={w:0,b:0},kp={};
for(let i=0;i<64;i++){const p=b[i];if(!p)continue;const k=p[0],t=p[1],r=i>>3,c=i&7,cd=Math.abs(r-3.5)+Math.abs(c-3.5);
if(t==='K'){kp[k]=i;continue}let v=PV[t];if(t==='P')v+=PT[k==='w'?7-r:r];else if(t==='N'||t==='B')v+=(7-cd)*4;else if(t==='Q')v+=(7-cd)*1.5;
sc[k]+=v;mat[k]+=PV[t];if(t!=='P')pc[k]+=PV[t]}
const eg=pc.w+pc.b<1400;
for(const k of['w','b']){if(kp[k]==null)continue;const cdk=Math.abs((kp[k]>>3)-3.5)+Math.abs((kp[k]&7)-3.5);sc[k]+=eg?(7-cdk)*5:-(7-cdk)*3}
for(const k of['w','b']){const o=k==='w'?'b':'w';if(mat[k]-mat[o]>250&&kp[o]!=null&&kp[k]!=null){const ro=kp[o]>>3,co=kp[o]&7,cdo=Math.abs(ro-3.5)+Math.abs(co-3.5),dist=Math.abs((kp[k]>>3)-ro)+Math.abs((kp[k]&7)-co);sc[k]+=cdo*14+(14-dist)*8}}
const o=col==='w'?'b':'w';return sc[col]-sc[o]}
const ord=(b,m)=>(b[m[1]]?10*PV[b[m[1]][1]]-PV[b[m[0]][1]]/10:0)+(b[m[0]][1]==='P'&&((m[1]>>3)===0||(m[1]>>3)===7)?800:0);
let nodes=0,tEnd=0,stopS=false;
function qs(b,col,a,bt,d){const st=ev(b,col);if(d===0||st>=bt)return st;if(st>a)a=st;const o=col==='w'?'b':'w';
const ms=legal(b,col).filter(m=>b[m[1]]).sort((x,y)=>ord(b,y)-ord(b,x));for(const m of ms){const v=-qs(mv(b,m),o,-bt,-a,d-1);if(v>a)a=v;if(a>=bt)break}return a}
function ab(b,col,d,a,bt,ply){if(stopS)return 0;if((++nodes&255)===0&&performance.now()>tEnd){stopS=true;return 0}
const ms=legal(b,col);if(!ms.length)return inCheck(b,col)?-(MATE-ply):0;if(d<=0)return qs(b,col,a,bt,3);
ms.sort((x,y)=>ord(b,y)-ord(b,x));const o=col==='w'?'b':'w';
for(const m of ms){const v=-ab(mv(b,m),o,d-1,-bt,-a,ply+1);if(stopS)return 0;if(v>a)a=v;if(a>=bt)break}return a}
function bestMove(b,col,ms,ms_){const o=col==='w'?'b':'w',key=x=>x.map(p=>p||'.').join(',');ms=ms.slice().sort(()=>Math.random()-.5);let best=ms[0];stopS=false;tEnd=performance.now()+ms_;
for(let d=1;d<=9;d++){let bm=null,bs=-1e9,a=-1e9;
const od=ms.slice().sort((x,y)=>(y===best?1e6:ord(b,y))-(x===best?1e6:ord(b,x)));
for(const m of od){const nb=mv(b,m);let v=-ab(nb,o,d-1,-1e9,-a,1);if(stopS)break;v-=(REP[key(nb)]||0)*40;if(v>bs){bs=v;bm=m}if(v>a)a=v}
if(stopS)break;best=bm;if(bs>MATE-200)break}return best}
function botKick(){if(BOT&&D&&D.ph==='play'&&D.turn===(mc()==='w'?'b':'w'))setTimeout(botMove,450)}
function botMove(){if(!D||D.ph!=='play')return;const o=mc(),ac=o==='w'?'b':'w';if(D.turn!==ac)return;const ms=legal(D.b,ac);if(!ms.length)return;dmove(bestMove(D.b,ac,ms,D.ply<8?600:1000))}
