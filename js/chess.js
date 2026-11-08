// Шахові правила: ходи, шах, мат
/* ---------- шахи ---------- */
const KN=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],KD=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function pseudo(b,col){const out=[];for(let i=0;i<64;i++){const p=b[i];if(!p||p[0]!==col)continue;const r=i>>3,c=i&7,t=p[1];
const add=(rr,cc)=>{if(rr<0||rr>7||cc<0||cc>7)return false;const j=rr*8+cc,q=b[j];if(q&&q[0]===col)return false;out.push([i,j]);return !q};
if(t==='P'){const d=col==='w'?-1:1,sr=col==='w'?6:1,rr=r+d;if(rr<0||rr>7)continue;
if(!b[rr*8+c]){out.push([i,rr*8+c]);if(r===sr&&!b[(r+2*d)*8+c])out.push([i,(r+2*d)*8+c])}
for(const dc of[-1,1]){const cc=c+dc;if(cc<0||cc>7)continue;const q=b[rr*8+cc];if(q&&q[0]!==col)out.push([i,rr*8+cc])}}
else if(t==='N'){for(const[a,e]of KN)add(r+a,c+e)}else if(t==='K'){for(const[a,e]of KD)add(r+a,c+e)}
else{const ds=t==='R'?KD.slice(0,4):t==='B'?KD.slice(4):KD;for(const[a,e]of ds){let rr=r+a,cc=c+e;while(add(rr,cc)){rr+=a;cc+=e}}}}return out}
function mv(b,m){const n=b.slice(),p=n[m[0]];n[m[1]]=p;n[m[0]]=null;const r=m[1]>>3;if(p[1]==='P'&&(r===0||r===7))n[m[1]]=p[0]+'Q'+(p[2]||'p');return n}
function inCheck(b,col){const k=b.indexOf(col+'K');if(k<0)return true;const o=col==='w'?'b':'w',r=k>>3,c=k&7,at=(rr,cc,t)=>{if(rr<0||rr>7||cc<0||cc>7)return false;const p=b[rr*8+cc];return !!p&&p[0]===o&&t.includes(p[1])};
for(const[a,e]of KN)if(at(r+a,c+e,'N'))return true;for(const[a,e]of KD)if(at(r+a,c+e,'K'))return true;
const pr=col==='w'?r-1:r+1;if(at(pr,c-1,'P')||at(pr,c+1,'P'))return true;
for(let i=0;i<8;i++){const[a,e]=KD[i],rk=i<4?'RQ':'BQ';let rr=r+a,cc=c+e;while(rr>=0&&rr<8&&cc>=0&&cc<8){const p=b[rr*8+cc];if(p){if(p[0]===o&&rk.includes(p[1]))return true;break}rr+=a;cc+=e}}return false}
const legal=(b,col)=>pseudo(b,col).filter(m=>!inCheck(mv(b,m),col));
