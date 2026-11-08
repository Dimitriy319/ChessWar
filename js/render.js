// Малювання карти, туман війни, бокова панель
function vision(){if(!MY)return null;const v=new Set();gens.filter(g=>g.side===MY).forEach(g=>{v.add(g.r+','+g.c);Object.keys(reach(g)).forEach(k=>v.add(k))});
for(const k in cities)if(cities[k].own===MY){const[r,c]=k.split(',').map(Number),n=cities[k].cap?2:1;for(let a=-n;a<=n;a++)for(let b=-n;b<=n;b++)if(r+a>=0&&c+b>=0&&r+a<H&&c+b<W)v.add((r+a)+','+(c+b))}
const add=[];for(let r=0;r<H;r++)for(let c=0;c<W;c++)if(MAP[r][c]==='#'&&D4.some(([a,b])=>v.has((r+a)+','+(c+b))))add.push(r+','+c);add.forEach(k=>v.add(k));return v}
function render(){if(!gens)return;const gvv=vision(),gv=(r,c)=>{const o=at(r,c);return o&&(!gvv||gvv.has(r+','+c))?o:null};
const lblCls=(r,c)=>{const L=!!gv(r,c-1),R=!!gv(r,c+1);let k=c===W-1?' ra':c===0?' la':R&&!L?' ra':L&&!R?' la':'';
if((R&&c+1===W-1)||(L&&c-1===0))k+=' up';return k};let h='';const s=SEL(),R=s&&!s.moved&&can()?reach(s):{};
const vis=vision();if(vis)vis.forEach(k=>seen.add(k));
for(let r=0;r<H;r++)for(let c=0;c<W;c++){const ch=MAP[r][c],k=r+','+c,ct=cities[k],t=R[k],v=!vis||vis.has(k),sn=!vis||seen.has(k),g=v?at(r,c):null;
let cl='t'+(sn&&ch==='#'?' m':'')+(!sn?' f':!v?' o':'')+(t?((t.foe||t.gar)?' atk':' ok'):'')+(g?' hg':''),x=sn&&ch==='#'?'▲':'';
if(sn&&ct)x='<span class="city '+(v?ct.own||'':'')+'">'+(ct.cap?'⚑':'⌂')+'</span>';
if(g)x+='<i class="g '+g.side+(g.moved&&g.side===MY?' dn':'')+(s===g?' sel':'')+'">'+g.bal+'</i><span class="gn '+g.side+(g.moved&&g.side===MY?' dn':'')+(lblCls(r,c))+'">'+hh(g.n)+'</span>';
h+='<div class="'+cl+'" data-r="'+r+'" data-c="'+c+'">'+x+'</div>'}
const mp=$('#map');mp.style.gridTemplateColumns='repeat('+W+',minmax(0,1fr))';mp.style.gridTemplateRows='repeat('+H+',minmax(0,1fr))';mp.style.aspectRatio=W+'/'+H;mp.innerHTML=h;
$('#st').textContent=(BOT?'Гра проти бота':curCode?'Кімната '+curCode+(guest?' · з’єднано':' · відновлення з’єднання…'):'')+(MY?' · ви — '+(MY==='me'?'сині':'червоні'):'');renderRoomBar();
$('#tt').textContent=over?'Гру завершено':!MY?'Глядач':turn===MY?'Ваш хід':'Хід суперника';
$('#gl').innerHTML=gens.map(g=>'<div class="gl"><span class="'+g.side+'-c">'+hh(g.n)+(g.moved&&g.side===MY?' ✓':'')+'</span><b>'+(g.side===MY||!vis||vis.has(g.r+','+g.c)?g.bal:'?')+'</b></div>').join('');
$('#hint').textContent=can()?(s?'Оберіть клітинку. Клік по полководцю ще раз — залишитись.':'Оберіть свого полководця.'):waiting()?'Чекаємо, поки суперник приєднається. Надішліть йому код кімнати.':'';
let a='';if(can()&&s){const ct=cities[s.r+','+s.c];
if(ct&&ct.own===MY)a+='<p><button data-a="hire"'+(s.bal<HIRE||gens.filter(x=>x.side===MY).length>=4?' disabled':'')+'>Найняти полководця (−'+HIRE+')</button></p>';
gens.filter(x=>x.side===MY&&x!==s&&Math.abs(x.r-s.r)+Math.abs(x.c-s.c)===1).forEach(x=>{a+='<p class="log">Передати до '+x.n+':<br>'+[5,10,'all'].map(v=>'<button class="alt" data-a="tr" data-id="'+gens.indexOf(x)+'" data-v="'+v+'">'+(v==='all'?'Все':v)+'</button>').join(' ')+'</p>'})}
$('#act').innerHTML=a;$('#et').disabled=!can();$('#lg').innerHTML=logs.filter(x=>x.v==='all'||x.v===MY).map(x=>'<div>'+x.s+'</div>').join('');
$('#duel').style.display=D&&MY?'block':'none';
if(over&&BOT&&PROFILE&&!botReported&&netState==='connected'){botReported=true;send({t:'bot',win:winner===MY})}
if(over&&MY){$('#em').textContent=winner===MY?'Перемога! Ворожу столицю взято':MY?'Поразка: вашу столицю захоплено':'Гру завершено';$('#end').style.display='flex'}else $('#end').style.display='none'}
