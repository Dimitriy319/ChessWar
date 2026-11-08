// Спільні константи, імена полководців, змінні стану
const $=s=>document.querySelector(s);
let MAP=[],W=0,H=0;const D4=[[1,0],[-1,0],[0,1],[0,-1]];
const V={P:1,N:3,B:3,R:5,Q:9,K:0},GL={K:"♚\uFE0E",Q:"♛\uFE0E",R:"♜\uFE0E",B:"♝\uFE0E",N:"♞\uFE0E",P:"♟\uFE0E"},NM={P:"Пішак",N:"Кінь",B:"Слон",R:"Тура",Q:"Ферзь"};
const caps={me:[6,8],foe:[0,0]},HIRE=10,GAR=15,NAMES=['Александр','Філіп','Ганнібал','Гасдрубал','Гамількар','Сципіон','Цезар','Помпей','Красс','Марій','Сулла','Агріппа','Фабій','Леонід','Мільтіад','Фемістокл','Кімон','Алківіад','Лісандр','Епамінонд','Пелопід','Агесілай','Пірр','Ксенофонт','Птолемей','Селевк','Антигон','Велізарій'];
let REP={},BOT=false,aiQ=[],seen=new Set(),MY=null,guest=false,si=-1,dsel=null,dmoves=[];
let PROFILE=null,authMsg=null,botReported=false,autoJoined=false,conn=null,netState='idle',netErr='',curCode=null,PRES=null,LIST={mine:[],open:[]},sess=null;
let cities,gens,turn,over,winner,logs,D,L={p:[],rem:null,done:false,pick:'P'};
const mkG=(n,side,r,c)=>({n,side,r,c,bal:20,moved:false});
