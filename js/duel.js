// Шахова дуель: розстановка, ходи, підрахунок балів
/* ---------- дуель ---------- */
const mc=()=>D&&MY&&D.as!==MY?'b':'w';
const ens=()=>{if(D&&L.rem==null)L.rem=D[mc()+'bal']};
const sv=col=>D.b.reduce((s,p)=>s+(p&&p[0]===col?(p[2]==='w'?0:p[2]==='p'?1:V[p[1]]):0),0);
function commit(){const c=mc();L.p.forEach(([i,p])=>D.b[i]=p);D[c+'rem']=L.rem;D[c+'r']=1;if(D.wr&&D.br)D.ph='play';botKick()}
function startDuel(a,d,pos){const ds=d?d.side:(a.side==='me'?'foe':'me'),ct=cities[pos[0]+','+pos[1]],G=ct&&ct.cap&&ct.own===ds?GAR:0,bb=(d?d.bal:0)+G;
D={a:gens.indexOf(a),d:d?gens.indexOf(d):-1,as:a.side,dn:d?d.n:'Гарнізон',G,pr:pos[0],pc:pos[1],b:Array(64).fill(null),ph:'place',wbal:a.bal,bbal:bb,wrem:a.bal,brem:bb,wr:0,br:0,turn:'w',ply:0,res:null};
D.b[60]='wK';D.b[4]='bK';if(ct&&ct.own===ds){for(let c=0;c<8;c++)D.b[24+c]='bPw';D.wall=1}L={p:[],rem:null,done:false,pick:'P'};dsel=null;dmoves=[];REP={};rsgAsk=false;if(BOT)botPlace();push();render();drawDuel()}
$('#bd').onclick=e=>{const el=e.target.closest('.c');if(!el||!D||!MY)return;const i=+el.dataset.i,c=mc(),r=i>>3;ens();
if(D.ph==='place'){if(L.done)return;const rows=D[c+'bal']>=30?3:2;if(!(c==='w'?r>=8-rows:r<rows))return;
const k=L.p.findIndex(x=>x[0]===i);
if(k>=0){L.rem+=V[L.p[k][1][1]];L.p.splice(k,1)}else if(!D.b[i]&&L.rem>=V[L.pick]&&!(L.pick==='P'&&r===(c==='w'?7:0))){L.p.push([i,c+L.pick]);L.rem-=V[L.pick]}
drawDuel();return}
if(D.ph==='play'&&D.turn===c){const p=D.b[i];
if(p&&p[0]===c){dsel=i;dmoves=legal(D.b,c).filter(m=>m[0]===i)}else if(dsel!=null){const m=dmoves.find(m=>m[1]===i);if(m){dmove(m);return}}drawDuel()}};
$('#dp').onclick=e=>{const bt=e.target.closest('button');if(!bt||!D||!MY)return;
if(bt.dataset.t){L.pick=bt.dataset.t;drawDuel()}else if(bt.id==='go'){ens();L.done=true;commit();push();drawDuel()}else if(bt.id==='fin')closeDuel();else if(bt.id==='rsg')resign()};
let rsgAsk=false,rsgT=null;
function resign(){if(!D||D.ph!=='play'||!MY)return;
if(!rsgAsk){rsgAsk=true;clearTimeout(rsgT);rsgT=setTimeout(()=>{rsgAsk=false;drawDuel()},4000);drawDuel();return}
clearTimeout(rsgT);rsgAsk=false;const c=mc();D.ph='done';D.res=c==='w'?'b':'w';D.rsg=c;push();drawDuel()}
function dmove(m){D.lm=D.lm||{};D.lm[D.turn]=[m[0],m[1]];D.b=mv(D.b,m);{const kk=D.b.map(p=>p||'.').join(',');REP[kk]=(REP[kk]||0)+1}D.ply++;dsel=null;dmoves=[];const o=D.turn==='w'?'b':'w';D.turn=o;const ls=legal(D.b,o);
if(!ls.length){D.ph='done';D.res=inCheck(D.b,o)?(o==='w'?'b':'w'):'d'}else if(D.b.every(p=>!p||p[1]==='K')||D.ply>=160){D.ph='done';D.res='d'}
push();drawDuel();botKick()}
function closeDuel(){if(!D||D.ph!=='done')return;const A=gens[D.a],B=D.d>=0?gens[D.d]:null,ws=sv('w'),bs=sv('b'),w=D.res,pos=[D.pr,D.pc];let wb,bb;
if(w==='w'){wb=D.wrem+ws+bs;bb=D.brem}else if(w==='b'){bb=D.brem+ws+bs;wb=D.wrem}else{wb=D.wrem+ws;bb=D.brem+bs}
const b0=B?B.bal:0;A.bal=wb;if(B)B.bal=w==='w'?Math.min(b0,bb):Math.max(0,bb-D.G);
if(w!=='d'){const ls=w==='w'?B:A;if(ls&&ls.bal>0)log(ls.n+' відступає з '+ls.bal+' війська')}
D=null;resolve(A,B,w==='w'?'att':w==='b'?'def':'draw',pos);push();render();if(BOT&&turn==='foe'&&!over)setTimeout(aiNext,400)}
function drawDuel(){if(!D)return;const c=mc();ens();let h='';
for(let v=0;v<64;v++){const i=c==='b'?63-v:v,r=i>>3,cc=i&7;let p=D.b[i];
if(D.ph==='place'){if(p&&p[1]!=='K'&&p[2]!=='w'&&p[0]!==c)p=null;if(!L.done){const x=L.p.find(x=>x[0]===i);if(x)p=x[1]}}
let cl='c '+((r+cc)%2?'d':'l');
if(D.ph==='place'&&!L.done&&MY){const rows=D[c+'bal']>=30?3:2;if(c==='w'?r>=8-rows:r<rows)cl+=' z'}
{const o=c==='w'?'b':'w',lm=D.lm&&D.lm[o];if(lm&&D.ph!=='place'){if(lm[0]===i)cl+=' lf';if(lm[1]===i)cl+=' lt'}}
if(dsel===i)cl+=' s';const m=dmoves.find(m=>m[1]===i);if(m)cl+=' v'+(D.b[i]?' cap':'');
h+='<div class="'+cl+'" data-i="'+i+'">'+(p?'<span class="'+(p[0]==='w'?'pw':'pb')+'">'+GL[p[1]]+'</span>':'')+'</div>'}
$('#bd').innerHTML=h;let top='<h2>'+gens[D.a].n+' (білі) проти '+D.dn+' (чорні)'+(D.G?' · гарнізон +'+D.G:'')+(D.wall?' · стіни міста':'')+'</h2>',pn='';
if(D.ph==='place'){if(!L.done){top+='<p class="log">Купуйте фігури й ставте їх у підсвічені ряди. Клік по своїй фігурі — повернути гроші. Пішаки не стають на крайній ряд. Баланс: <b>'+L.rem+'</b></p>';
pn=['P','N','B','R','Q'].map(t=>'<button class="pk'+(L.pick===t?' on':'')+'" data-t="'+t+'">'+GL[t]+' '+NM[t]+' · '+V[t]+'</button>').join('')+'<p><button id="go">Готово</button></p>'}
else top+='<p class="log">Чекаємо, поки суперник розставить фігури…</p>'}
else if(D.ph==='play'){top+='<p class="log">'+(MY?(D.turn===c?'Ваш хід':'Хід суперника'):'Глядач')+' · ви — '+(c==='w'?'білі':'чорні')+'</p>';
if(MY)pn='<p class="rsg"><button class="alt" id="rsg">'+(rsgAsk?'Точно здатись? Натисніть ще раз':'🏳 Здатись')+'</button></p>'}
else{const w=D.res,t=w==='d'?'Нічия. Кожен повертає свої фігури, що вціліли.':D.rsg?(w===c?'Суперник здався. Ви перемогли, фігури, що вціліли, переходять до вашого балансу.':'Ви здались. Суперник забирає фігури, що вціліли.'):w===c?'Мат! Ви перемогли. Фігури, що вціліли, переходять до вашого балансу.':'Вам поставили мат. Суперник забирає фігури, що вціліли.';
pn='<p>'+t+'</p>'+(MY?'<button id="fin">Повернутися на карту</button>':'')}
$('#dh').innerHTML=top;$('#dp').innerHTML=pn}
