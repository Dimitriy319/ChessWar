// Генерація карти, початковий стан, синхронізація стану, допоміжні функції
function genMap(){const H0=13,W0=13;for(;;){const g=Array.from({length:H0},()=>Array(W0).fill('.')),R=n=>Math.random()*n|0;
const x=Math.random(),md=x<.5?0:x<.75?1:2;                    // 0: протилежні кути, 1: обидві столиці на верхній/нижній стороні, 2: на лівій/правій
const mir=(r,c)=>md===0?[H0-1-r,W0-1-c]:md===1?[r,W0-1-c]:[H0-1-r,c],A=[0,0],B=md===0?[H0-1,W0-1]:md===1?[0,W0-1]:[H0-1,0];
const put=(r,c,ch)=>{g[r][c]=ch;const[a,b]=mir(r,c);g[a][b]=ch},dc=(r,c)=>Math.min(Math.abs(r-A[0])+Math.abs(c-A[1]),Math.abs(r-B[0])+Math.abs(c-B[1])),self=(r,c)=>mir(r,c).join()===r+','+c;
g[A[0]][A[1]]='E';g[B[0]][B[1]]='P';
for(let i=0;i<24;i++){const r=R(H0),c=R(W0);if(g[r][c]==='.'&&dc(r,c)>=2)put(r,c,'#')}
for(let k=0,n=0;k<400&&n<5;k++){const r=R(H0),c=R(W0);if(g[r][c]==='.'&&dc(r,c)>=3&&!self(r,c)){put(r,c,'c');n++}}
const rows=g.map(x=>x.join('')),sn=new Set(['0,0']),q=[[0,0]];
while(q.length){const[r,c]=q.shift();for(const[a,b]of D4){const n=r+a,m=c+b;if(n<0||m<0||n>=H0||m>=W0||rows[n][m]==='#'||sn.has(n+','+m))continue;sn.add(n+','+m);q.push([n,m])}}
if(rows.every((x,r)=>[...x].every((ch,c)=>ch==='#'||sn.has(r+','+c)))){
let out=rows;if(Math.random()<.5)out=out.map(x=>[...x].reverse().join(''));    // відбиття ліво/право
if(Math.random()<.5)out=out.slice().reverse();                                  // відбиття верх/низ
if(Math.random()<.5)out=out.map(x=>x.replace(/[PE]/g,ch=>ch==='P'?'E':'P'));    // міняємо, чий який кут
return out}}}
function findCaps(m){const c={};m.forEach((row,r)=>[...row].forEach((ch,i)=>{if(ch==='P')c.me=[r,i];if(ch==='E')c.foe=[r,i]}));return c}
function fresh(){const m=genMap(),ct={};m.forEach((row,r)=>[...row].forEach((ch,c)=>{if(ch==='c')ct[r+','+c]={own:null};if(ch==='P')ct[r+','+c]={own:'me',cap:1};if(ch==='E')ct[r+','+c]={own:'foe',cap:1}}));
const cp=findCaps(m),nx=p=>[p[0],p[1]+(p[1]===0?1:-1)],h=m.length,w=m[0].length,nn=NAMES.slice().sort(()=>Math.random()-.5);return{map:m,cities:ct,gens:[mkG(nn[0],'me',...cp.me),mkG(nn[1],'me',...nx(cp.me)),mkG(nn[2],'foe',...cp.foe),mkG(nn[3],'foe',...nx(cp.foe))],turn:'me',over:false,winner:null,logs:[],D:null}}
const setS=o=>{({cities,gens,turn,over,winner,logs,D}=o);MAP=o.map;H=MAP.length;W=MAP[0].length;Object.assign(caps,findCaps(MAP))};
function push(){if(curCode&&guest)send({t:'state',state:{map:MAP,cities,gens,turn,over,winner,logs,D}})}
const SEL=()=>gens[si],waiting=()=>!BOT&&!!PRES&&!PRES.foeJoined,can=()=>MY&&guest&&!over&&!D&&turn===MY&&!waiting();
const log=(s,v='all')=>{logs.unshift({s,v});if(logs.length>12)logs.pop()};
const at=(r,c)=>gens.find(g=>g.r===r&&g.c===c);
