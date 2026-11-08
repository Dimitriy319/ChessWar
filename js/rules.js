// Правила карти: рух, захоплення міст, найм, передача військ, кнопки на карті
function reach(g){const res={},q=[[g.r,g.c,0]],seen=new Set([g.r+','+g.c]);
while(q.length){const[r,c,d]=q.shift();if(d===2)continue;
for(const[a,b]of D4){const nr=r+a,nc=c+b,k=nr+','+nc;if(nr<0||nc<0||nr>=H||nc>=W||MAP[nr][nc]==='#'||seen.has(k))continue;seen.add(k);
const o=at(nr,nc);if(o){if(o.side!==g.side)res[k]={r:nr,c:nc,foe:o};continue}if(cities[k]&&cities[k].cap&&cities[k].own!==g.side){res[k]={r:nr,c:nc,gar:1};continue}res[k]={r:nr,c:nc};q.push([nr,nc,d+1])}}return res}
function nearFree(r0,c0){const q=[[r0,c0]],seen=new Set([r0+','+c0]);
while(q.length){const[r,c]=q.shift();if(!at(r,c))return[r,c];for(const[a,b]of D4){const n=r+a,m=c+b,k=n+','+m;if(n<0||m<0||n>=H||m>=W||MAP[n][m]==='#'||seen.has(k))continue;seen.add(k);q.push([n,m])}}}
function retreat(g){const[r,c]=nearFree(...caps[g.side]);g.r=r;g.c=c}
function arrive(g){const ct=cities[g.r+','+g.c];if(!ct||ct.own===g.side)return;
if(ct.cap){over=true;winner=g.side;return}ct.own=g.side;g.bal+=8;log(g.n+' захоплює місто (+8)',g.side)}
function recruit(side){gens.filter(g=>g.side===side).forEach(g=>{const ct=cities[g.r+','+g.c];if(ct&&ct.own===side){const p=ct.cap?10:5;g.bal+=p;log(g.n+' набирає військо (+'+p+')',g.side)}})}
function resolve(att,def,res,pos){const dn=def?def.n:'Гарнізон';if(res==='att'){if(def)retreat(def);att.r=pos[0];att.c=pos[1];log(att.n+' перемагає: '+dn+' відступає');arrive(att)}
else if(res==='def'){retreat(att);log(dn+' відбиває '+att.n)}else log('Нічия: '+att.n+' і '+dn);att.moved=true}
function pickName(){const p=NAMES.filter(x=>!gens.some(y=>y.n===x));return p[Math.random()*p.length|0]||'Новак'}
function hire(g){if(gens.filter(x=>x.side===g.side).length>=4||g.bal<HIRE)return;
const[r,c]=nearFree(g.r,g.c),ng=mkG(pickName(),g.side,r,c);g.bal-=HIRE;ng.bal=5;ng.moved=true;gens.push(ng);log(g.n+' наймає '+ng.n,g.side)}
$('#map').onclick=e=>{const el=e.target.closest('.t');if(!el||!can())return;const r=+el.dataset.r,c=+el.dataset.c,g=at(r,c);
if(g&&g.side===MY){if(SEL()===g){if(!g.moved){g.moved=true;push()}si=-1}else si=gens.indexOf(g);render();return}
const s=SEL();if(!s||s.moved)return;const t=reach(s)[r+','+c];if(!t)return;si=-1;
if(t.foe||t.gar)startDuel(s,t.foe||null,[r,c]);else{s.r=r;s.c=c;s.moved=true;arrive(s);push();render()}};
$('#act').onclick=e=>{const b=e.target.closest('button'),s=SEL();if(!b||!can()||!s)return;
if(b.dataset.a==='hire')hire(s);else{const t=gens[+b.dataset.id],v=b.dataset.v==='all'?s.bal:Math.min(+b.dataset.v,s.bal);if(v>0){s.bal-=v;t.bal+=v;log(s.n+' передає '+v+' до '+t.n,s.side)}}push();render()};
$('#et').onclick=()=>{if(!can())return;si=-1;turn=MY==='me'?'foe':'me';gens.forEach(g=>{if(g.side===turn)g.moved=false});recruit(turn);push();render();if(BOT)setTimeout(aiTurn,500)};
$('#rs').onclick=()=>{$('#end').style.display='none';$('#rc').click()};
