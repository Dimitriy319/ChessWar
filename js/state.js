// Генерація карти, початковий стан, синхронізація стану, допоміжні функції
function genMap(){const H0=9,W0=13;for(;;){const g=Array.from({length:H0},()=>Array(W0).fill('.')),R=n=>Math.random()*n|0;
const put=(r,c,ch)=>{g[r][c]=ch;g[H0-1-r][W0-1-c]=ch},dc=(r,c)=>Math.min(r+c,H0-1-r+W0-1-c);
g[0][0]='E';g[H0-1][W0-1]='P';
for(let i=0;i<16;i++){const r=R(H0),c=R(W0);if(g[r][c]==='.'&&dc(r,c)>=2)put(r,c,'#')}
for(let k=0,n=0;k<300&&n<4;k++){const r=R(H0),c=R(W0);if(g[r][c]==='.'&&dc(r,c)>=3&&(r!==H0-1-r||c!==W0-1-c)){put(r,c,'c');n++}}
const rows=g.map(x=>x.join('')),sn=new Set(['0,0']),q=[[0,0]];
while(q.length){const[r,c]=q.shift();for(const[a,b]of D4){const n=r+a,m=c+b;if(n<0||m<0||n>=H0||m>=W0||rows[n][m]==='#'||sn.has(n+','+m))continue;sn.add(n+','+m);q.push([n,m])}}
if(rows.every((x,r)=>[...x].every((ch,c)=>ch==='#'||sn.has(r+','+c))))return rows}}
function fresh(){const m=genMap(),ct={};m.forEach((row,r)=>[...row].forEach((ch,c)=>{if(ch==='c')ct[r+','+c]={own:null};if(ch==='P')ct[r+','+c]={own:'me',cap:1};if(ch==='E')ct[r+','+c]={own:'foe',cap:1}}));
const h=m.length,w=m[0].length,nn=NAMES.slice().sort(()=>Math.random()-.5);return{map:m,cities:ct,gens:[mkG(nn[0],'me',h-1,w-1),mkG(nn[1],'me',h-1,w-2),mkG(nn[2],'foe',0,0),mkG(nn[3],'foe',0,1)],turn:'me',over:false,winner:null,logs:[],D:null}}
const setS=o=>{({cities,gens,turn,over,winner,logs,D}=o);MAP=o.map;H=MAP.length;W=MAP[0].length;caps.me=[H-1,W-1]};
function push(){if(curCode&&guest)send({t:'state',state:{map:MAP,cities,gens,turn,over,winner,logs,D}})}
const SEL=()=>gens[si],waiting=()=>!BOT&&!!PRES&&!PRES.foeJoined,can=()=>MY&&guest&&!over&&!D&&turn===MY&&!waiting();
const log=(s,v='all')=>{logs.unshift({s,v});if(logs.length>12)logs.pop()};
const at=(r,c)=>gens.find(g=>g.r===r&&g.c===c);
