// Онлайн: підключення до сервера, профілі, лобі, кімнати
const send=o=>{if(conn)return conn.send(JSON.stringify(o))};
const esc=s=>String(s??'');
function showGame(){$('#lobby').style.display='none';$('#game').style.display='grid';render()}
function showLobby(){$('#game').style.display='none';$('#duel').style.display='none';$('#end').style.display='none';$('#lobby').style.display='block';renderLobby()}
function startOnline(){if(conn)return;const SC=window.StarClient;if(!SC){netState='error';netErr='Мережевий модуль не завантажився.';renderLobby();return}conn=SC.createConnection({
onConnect(s){sess=s;{const t=ls('polk-token');if(t)send({t:'resume',token:t})}flushAuth();send({t:'list'});if(curCode)send({t:'join',code:curCode});flushPending();renderLobby();render()},
onMessage(e){handleNet(e.data)},
onStatus(st){netState=st.state;netErr=st.error?esc(st.error.message):'';if(st.state!=='connected')guest=false;
if(st.state==='replaced')netErr='Гру відкрито в іншій вкладці. Натисніть «Повторити».';
renderLobby();if(curCode)render()}})}
const ls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){return null}};
const hh=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inp='style="padding:8px;border-radius:6px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:15px system-ui;width:46%"';
function renderProfile(){const d=$('#pfv'),p=PROFILE;
if(p)d.innerHTML='<p><b>'+hh(p.name)+'</b></p><p class="log">Онлайн: перемог '+p.wins+', поразок '+p.losses+'<br>Проти бота: перемог '+p.botWins+', поразок '+p.botLosses+'</p><p><button class="alt" id="lo">Вийти з профілю</button></p>';
else d.innerHTML='<p class="log">Створіть профіль або увійдіть: так працює онлайн-гра, ведеться статистика, а партії відкриваються на будь-якому пристрої.</p><p><input id="pn" maxlength="20" autocomplete="username" placeholder="Ім’я" '+inp+'> <input id="pp" type="password" autocomplete="current-password" placeholder="Пароль (від 4)" '+inp+'></p><p><button id="li">Увійти</button> <button class="alt" id="rg">Створити профіль</button></p>'}
function flushAuth(){if(authMsg&&conn&&netState==='connected'){send(authMsg);authMsg=null}}
$('#pf').onclick=e=>{const id=e.target.id;
if(id==='lo'){send({t:'logout'});ls('polk-token',null);return}
if(id==='li'||id==='rg'){authMsg={t:id==='li'?'login':'register',name:$('#pn').value,pin:$('#pp').value};startOnline();if(netState==='connected')flushAuth();else $('#lm').textContent='Підключаємось до сервера…'}};
function handleNet(raw){let m;try{m=JSON.parse(raw)}catch(e){return}
if(m.t==='auth'){PROFILE=m.profile;if(m.token)ls('polk-token',m.token);if(m.expired)ls('polk-token',null);$('#lm').textContent='';renderProfile();if(!PROFILE){LIST={mine:[],open:[]};curCode=null}
else{const invitedRoomCode=window.StarClient&&window.StarClient.getLaunchContext().invitedRoomCode;if(invitedRoomCode&&!curCode&&!autoJoined){autoJoined=true;requestOnline({code:invitedRoomCode})}}renderLobby();return}
if(m.t==='profile'){PROFILE=m.profile;renderProfile();return}
if(m.t==='list'){LIST=m;renderLobby();return}
if(m.t==='error'){$('#lm').textContent=esc(m.message);return}
if(m.t==='joined'){curCode=m.code;MY=m.side;guest=true;PRES=m.presence;$('#lm').textContent='';setS(m.state);if(!D)L={p:[],rem:null,done:false,pick:'P'};showGame();render();drawDuel();return}
if(m.t==='state'){if(m.code!==curCode)return;PRES=m.presence;setS(m.state);if(!D)L={p:[],rem:null,done:false,pick:'P'};
if(D&&D.ph==='place'&&L.done&&MY&&!D[mc()+'r']){commit();push()}render();drawDuel()}}
let pending=null;
function flushPending(){if(!pending||!conn)return;const p=pending;pending=null;
if(p==='create'){$('#lm').textContent='';send({t:'create',state:fresh()})}
else{$('#lm').textContent='Входимо в кімнату '+p.code+'…';send({t:'join',code:p.code})}}
function requestOnline(p){BOT=false;if(!PROFILE){$('#lm').textContent='Спершу увійдіть у профіль або створіть його.';startOnline();return}pending=p;startOnline();if(netState==='connected')flushPending();else $('#lm').textContent='Підключаємось до сервера…'}
function renderLobby(){
const lab={connected:'Онлайн: з’єднано',connecting:'Підключення… (безкоштовний сервер може прокидатися до хвилини)',reconnecting:'Перепідключення…',offline:'Немає мережі. Чекаємо…',replaced:'Відкрито в іншій вкладці.',error:netErr,closed:'З’єднання закрито.',idle:'Онлайн ще не підключено.'};
$('#cs').textContent=netState==='error'||netState==='replaced'?netErr:(lab[netState]||lab.idle);
const row=(text,btn,code)=>{const d=document.createElement('div');d.style.cssText='display:flex;justify-content:space-between;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--line)';
const s=document.createElement('span');s.textContent=text;const b=document.createElement('button');b.className='alt';b.textContent=btn;b.dataset.code=code;d.append(s,b);return d};
const mine=$('#mine');mine.innerHTML='';
LIST.mine.forEach(r=>{const other=r.side==='me'?r.names.foe:r.names.me;
const st=r.over?'завершено':!r.foeJoined?'чекає суперника':r.turn===r.side?'ваш хід':'хід суперника';
mine.append(row('Кімната '+r.code+' · '+esc(other||'суперник ще не приєднався')+' · '+st,'Продовжити',r.code))});
if(!LIST.mine.length)mine.textContent='Ще немає збережених партій.';
const op=$('#open');op.innerHTML='';
LIST.open.forEach(r=>op.append(row('Кімната '+r.code+' · створив '+esc(r.names.me),'Приєднатися',r.code)));
if(!LIST.open.length)op.textContent='Наразі немає відкритих кімнат.'}
function renderRoomBar(){$('#cm').textContent=curCode?'Кімната '+curCode+'. Щоб повернутися пізніше, відкрийте «Мої партії» або введіть код.':''}
async function copyText(text,msg){try{await navigator.clipboard.writeText(text);$('#cm').textContent=msg}catch(e){$('#cm').textContent='Скопіюйте вручну: '+text}}
$('#bt').onclick=()=>{botReported=false;BOT=true;MY='me';guest=true;curCode=null;PRES=null;setS(fresh());showGame()};
$('#mk').onclick=()=>{curCode=null;requestOnline('create')};
$('#jn').onclick=()=>{const code=$('#cin').value.trim().toUpperCase();if(!code){$('#lm').textContent='Введіть код кімнати.';return}curCode=null;requestOnline({code})};
$('#cin').onkeydown=e=>{if(e.key==='Enter')$('#jn').click()};
$('#lobby').onclick=e=>{const b=e.target.closest('button[data-code]');if(b){curCode=null;requestOnline({code:b.dataset.code})}};
renderProfile();addEventListener('DOMContentLoaded',()=>{const SC=window.StarClient,inv=SC&&SC.getLaunchContext().invitedRoomCode;if(inv||ls('polk-token'))startOnline()});
$('#rc').onclick=()=>{if(curCode)send({t:'leave'});curCode=null;MY=null;guest=false;BOT=false;PRES=null;$('#cm').textContent='';$('#lm').textContent='Партію збережено. Її можна продовжити зі списку «Мої партії».';startOnline();showLobby()};
$('#cc').onclick=()=>{if(curCode)copyText(curCode,'Код скопійовано. Надішліть його другові.')};
$('#ic').onclick=()=>{const u=sess&&sess.inviteUrl;if(!u||!curCode){$('#cm').textContent='Посилання ще не готове.';return}copyText(u,'Посилання скопійовано. Друг відкриє його і введе код '+curCode+'.')};
