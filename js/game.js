/* ===== La Ruta del 2% · minijuego satírico del ISAMI (personajes ficticios) =====
   Versión independiente con nombre del jugador, puntaje y tabla de ganadores. */
(function(){
'use strict';
const sec=document.querySelector('[data-id="juego"]');if(!sec)return;
const $=s=>sec.querySelector(s);
const cv=$('#gm'),g=cv.getContext('2d');
const W=960,H=540,T=24,ROWS=22,GR=1700;
const hud=$('#g-hud'),hC=$('#g-c'),hT=$('#g-t'),hR=$('#g-r'),hL=$('#g-lv');
const modal=$('#g-modal'),mK=$('#gm-k'),mT=$('#gm-t'),mP=$('#gm-p'),mN=$('#gm-n'),bGo=$('#g-go'),bEx=$('#g-ex');
const bub=$('#g-bub'),touch=$('#g-touch');
const coarse=matchMedia('(pointer: coarse)').matches;
const FONT="'Public Sans',Arial,sans-serif";

let mode='off',raf=0,lastT=0,clock=0,onGo=null;
let li=0,LV=null,map=null,worldW=0,items=[],enemies=[],movers=[],shots=[],parts=[],boss=null,goal=null;
let P=null,cam=0,coins=0,stolen=0,fees=0,receipts=0,timeLeft=0,rainT=0,endT=0,bossBeat=false,bubT=0,bubE=null;
let rec1=0,tBonus=0,played=0,runId='';
const K={L:false,R:false,J:false};let jBuf=0,coyT=0;

/* ---------- niveles ---------- */
function grid(w){const m=[];for(let y=0;y<ROWS;y++)m.push(new Array(w).fill('.'));return m;}
function fill(m,x0,x1,y0,y1,c){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(m[y]&&x>=0&&x<m[0].length)m[y][x]=c;}
function L1(){const w=96,m=grid(w),it=[];
  fill(m,0,20,19,21,'#');fill(m,24,45,19,21,'#');fill(m,50,70,19,21,'#');fill(m,74,95,19,21,'#');
  fill(m,8,11,15,15,'-');fill(m,28,31,15,15,'-');fill(m,34,38,12,12,'-');fill(m,46,49,16,16,'-');fill(m,56,59,15,15,'-');fill(m,63,66,12,12,'-');fill(m,84,87,15,15,'-');
  [14,41,60,80].forEach(x=>m[18][x]='x');
  it.push({t:'r',x:9.5,y:14},{t:'r',x:29.5,y:14},{t:'r',x:36,y:11},{t:'r',x:64.5,y:11},{t:'r',x:85.5,y:14});
  [5,17,26,33,44,52,68,77,90].forEach(x=>it.push({t:'c',x,y:18}));
  return{name:'Nivel 1 · La fila del día 25',w,m,it,en:[],mv:[],start:[2,17],goal:{x:91,y:15,w:4,h:4,kind:'ventanilla'},time:60,rain:true,bg:'city',pal:{top:'#C9B48A',body:'#8B6A43',line:'#6E5232'}};}
function L2(){const w=100,m=grid(w),it=[];
  fill(m,0,30,19,21,'#');fill(m,34,55,19,21,'#');fill(m,62,80,19,21,'#');fill(m,84,99,19,21,'#');
  fill(m,10,13,15,15,'-');fill(m,20,23,13,13,'-');fill(m,40,44,15,15,'-');fill(m,48,51,12,12,'-');fill(m,66,69,15,15,'-');fill(m,74,77,12,12,'-');fill(m,88,91,15,15,'-');
  [27,46,78].forEach(x=>m[18][x]='x');
  [[4,18],[11.5,14],[21.5,12],[22.5,12],[37,18],[42,14],[49.5,11],[50.5,11],[58,15],[67.5,14],[75.5,11],[86,18],[89.5,14],[93,18]].forEach(p=>it.push({t:'c',x:p[0],y:p[1]}));
  return{name:'Nivel 2 · Trámite exprés',w,m,it,en:[16,38,66,87],mv:[{x0:55.5,x1:59,y:17,w:3,sp:70}],start:[2,17],goal:{x:95,y:15,w:3,h:4,kind:'oficina'},time:75,bg:'office',pal:{top:'#B9C4BD',body:'#56655D',line:'#3F4C45'}};}
function L3(){const w=40,m=grid(w);
  fill(m,0,39,19,21,'#');fill(m,4,8,15,15,'-');fill(m,31,35,15,15,'-');fill(m,16,23,11,11,'-');
  return{name:'Nivel 3 · Los bolsillos del Licenciado',w,m,it:[{t:'c',x:6,y:14},{t:'c',x:33,y:14},{t:'c',x:20,y:10}],en:[],mv:[],start:[3,17],goal:null,time:90,boss:true,bg:'vault',pal:{top:'#E9D9B0',body:'#14553F',line:'#0B3A2B'}};}
const LEVELS=[L1,L2,L3];

/* ---------- utilidades ---------- */
const tile=(x,y)=>{const tx=Math.floor(x/T),ty=Math.floor(y/T);if(ty<0)return'.';if(ty>=ROWS||tx<0||tx>=map[0].length)return tx<0||tx>=map[0].length?'#':'.';return map[ty][tx];};
const over=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function say(e,txt,d){bub.textContent=txt;bubE=e;bubT=d||1.8;bub.classList.add('on');}
function burst(x,y,c,n){for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*260,vy:-Math.random()*260-60,t:.6+Math.random()*.3,c,s:3+Math.random()*3});}
function fmtT(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}

function load(i){li=i;LV=LEVELS[i]();map=LV.m;worldW=LV.w*T;
  items=LV.it.map(o=>({t:o.t,x:o.x*T,y:o.y*T+T/2,got:false,vy:0,vx:0,dyn:false}));
  enemies=LV.en.map(x=>({x:x*T,y:19*T-30,w:20,h:30,dir:-1,sp:62,run:0,gone:false,ph:Math.random()*6}));
  movers=LV.mv.map(o=>({x:o.x0*T,y:o.y*T,w:o.w*T,h:12,x0:o.x0*T,x1:o.x1*T,sp:o.sp,dir:1,dx:0}));
  goal=LV.goal?{x:LV.goal.x*T,y:LV.goal.y*T,w:LV.goal.w*T,h:LV.goal.h*T,kind:LV.goal.kind}:null;
  shots=[];parts=[];receipts=0;timeLeft=LV.time;rainT=1.5;endT=0;
  P={x:LV.start[0]*T,y:LV.start[1]*T-6,w:18,h:30,vx:0,vy:0,on:false,face:1,inv:0,anim:0,cx:LV.start[0]*T,cy:LV.start[1]*T-6};
  boss=LV.boss?{x:26*T,y:19*T-84,w:64,h:84,dir:-1,sp:80,hp:3,pock:2,stun:0,thr:2.2,abs:3.4,flash:0,dead:false,deadT:0}:null;
  cam=clamp(P.x-W*.4,0,Math.max(0,worldW-W));hL.textContent=LV.name;hR.style.display=i===0?'':'none';}

/* ---------- física del jugador ---------- */
function solidAt(x,y){return tile(x,y)==='#';}
function movePlayer(dt){
  const acc=P.on?2600:1700,max=240;
  let dir=(K.R?1:0)-(K.L?1:0);
  if(dir){P.vx=clamp(P.vx+dir*acc*dt,-max,max);P.face=dir;}else{const f=P.on?2400:900;P.vx=Math.abs(P.vx)<f*dt?0:P.vx-Math.sign(P.vx)*f*dt;}
  coyT=P.on?.1:coyT-dt;jBuf-=dt;
  if(jBuf>0&&coyT>0){P.vy=-640;P.on=false;coyT=0;jBuf=0;burst(P.x+9,P.y+30,'#E9DCC0',5);}
  if(!K.J&&P.vy<-260)P.vy=-260;
  P.vy=Math.min(P.vy+GR*dt,950);
  // eje X
  P.x+=P.vx*dt;
  if(P.vx>0&&(solidAt(P.x+P.w,P.y+2)||solidAt(P.x+P.w,P.y+P.h-2)||solidAt(P.x+P.w,P.y+P.h/2))){P.x=Math.floor((P.x+P.w)/T)*T-P.w-.01;P.vx=0;}
  if(P.vx<0&&(solidAt(P.x,P.y+2)||solidAt(P.x,P.y+P.h-2)||solidAt(P.x,P.y+P.h/2))){P.x=Math.floor(P.x/T+1)*T+.01;P.vx=0;}
  P.x=clamp(P.x,0,worldW-P.w);
  // eje Y
  const prevB=P.y+P.h;P.y+=P.vy*dt;P.on=false;
  if(P.vy>=0){const b=P.y+P.h;
    for(const fx of[P.x+2,P.x+P.w-2]){const t=tile(fx,b);const top=Math.floor(b/T)*T;
      if(t==='#'||(t==='-'&&prevB<=top+1)){P.y=top-P.h;P.vy=0;P.on=true;}}
    for(const m of movers){if(P.x+P.w>m.x&&P.x<m.x+m.w&&prevB<=m.y+1&&P.y+P.h>=m.y){P.y=m.y-P.h;P.vy=0;P.on=true;P.x+=m.dx;}}
  }else{if(solidAt(P.x+2,P.y)||solidAt(P.x+P.w-2,P.y)){P.y=Math.floor(P.y/T+1)*T;P.vy=0;}}
  if(P.on&&tile(P.x+P.w/2,P.y+P.h+4)==='#'){P.cx=P.x;P.cy=P.y;}
  P.inv=Math.max(0,P.inv-dt);P.anim+=Math.abs(P.vx)*dt*.06;
  if(P.y>H+80){lose(1,'fee');P.x=P.cx;P.y=P.cy-4;P.vx=0;P.vy=0;say(P,'¡Te caíste en un bache! Recargo: −1',1.6);}
  return prevB;}
function lose(n,kind){const t=Math.min(coins,n);coins-=t;if(kind==='stolen')stolen+=t;else fees+=t;burst(P.x+9,P.y+10,'#E09A1A',6);return t;}
function hurt(n,kind,txt,src){if(P.inv>0)return;lose(n,kind);P.inv=1.3;P.vy=-380;P.vx=(src&&src.x>P.x?-1:1)*260;say(src||P,txt,1.8);}

/* ---------- actualización ---------- */
function update(dt){
  clock+=dt;timeLeft-=dt;played+=dt;
  for(const m of movers){const nx=m.x+m.sp*m.dir*dt;if(nx<m.x0||nx>m.x1)m.dir*=-1;m.dx=m.sp*m.dir*dt;m.x+=m.dx;}
  const prevB=movePlayer(dt);
  // objetos
  for(const it of items){if(it.got)continue;
    if(it.dyn){it.vy+=GR*.7*dt;it.x+=it.vx*dt;it.y+=it.vy*dt;if(tile(it.x,it.y+9)!=='.'&&it.vy>0){it.y=Math.floor((it.y+9)/T)*T-9;it.vy=0;it.vx*=.6;}it.x=clamp(it.x,8,worldW-8);}
    if(Math.abs(it.x-(P.x+9))<20&&Math.abs(it.y-(P.y+15))<24){it.got=true;
      if(it.t==='c'){coins++;burst(it.x,it.y,'#F2C14E',7);}else{receipts++;burst(it.x,it.y,'#FCFAF3',8);say(P,['¡Copia 1 de 5!','¡Otra copia!','¡Sellada y firmada!','¡Ya casi!','¡Expediente completo!'][receipts-1],1.3);}}}
  // obstáculos de trámites
  if(P.inv<=0){const cx=P.x+9,by=P.y+P.h-4;if(tile(cx,by)==='x'||tile(P.x+2,by)==='x'||tile(P.x+P.w-2,by)==='x')hurt(1,'fee',['¡Te faltó un formato! −1','Pila de trámites: −1','¡Requisito nuevo! −1'][Math.floor(Math.random()*3)],P);}
  // lluvia de formatos (nivel 1)
  if(LV.rain){rainT-=dt;if(rainT<=0){rainT=1.1+Math.random()*.6;shots.push({k:'paper',x:cam+80+Math.random()*(W-160),y:-20,vx:0,vy:110,r:0,ph:Math.random()*6});}}
  // coyotes
  for(const e of enemies){if(e.gone)continue;
    if(e.run>0){e.run-=dt;e.y-=260*dt;e.x+=e.dir*120*dt;if(e.run<=0)e.gone=true;continue;}
    const nx=e.x+e.dir*e.sp*dt,front=e.dir>0?nx+e.w:nx;
    if(tile(front,e.y+e.h+4)==='.'||solidAt(front,e.y+e.h-4)||tile(front,e.y+e.h-4)==='x')e.dir*=-1;else e.x=nx;
    if(over(P,e)){
      if(P.vy>0&&prevB<=e.y+10){e.run=1.2;e.dir=P.x<e.x?1:-1;P.vy=-520;
        for(let i=0;i<2;i++)items.push({t:'c',x:e.x+10,y:e.y,got:false,dyn:true,vx:(Math.random()-.5)*240,vy:-420});
        say(e,['¡Yo no fui!','¡Ni vi nada!','¡Era una propina!'][Math.floor(Math.random()*3)],1.4);}
      else hurt(2,'stolen',['«Se lo agilizo por $500»','«Sin mordida no hay trámite»','«Cooperación voluntaria, jefa»'][Math.floor(Math.random()*3)],e);}}
  // jefe
  if(boss)updateBoss(dt,prevB);
  // proyectiles
  for(const s of shots){s.ph+=dt;
    if(s.k==='paper'){s.x+=Math.sin(s.ph*2.4)*50*dt;s.y+=s.vy*dt;s.r=Math.sin(s.ph*3)*.6;}
    else{s.vy+=900*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=dt*8;}
    if(!s.dead&&Math.abs(s.x-(P.x+9))<18&&Math.abs(s.y-(P.y+15))<20){s.dead=true;
      hurt(1,'fee',s.k==='paper'?['¡Formato por triplicado! −1','¡Se actualizó el formato! −1','¡Falta la firma! −1'][Math.floor(Math.random()*3)]:['¡Multa por no traer copia!','¡Recargo sorpresa!','¡Multa por existir!'][Math.floor(Math.random()*3)],P);}
    if(s.y>H+40||tile(s.x,s.y)==='#')s.dead=true;}
  shots=shots.filter(s=>!s.dead);
  for(const p of parts){p.t-=dt;p.vy+=900*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.to){p.k+=dt/.7;const k=Math.min(1,p.k);p.x=p.fx+(p.to.x-p.fx)*k;p.y=p.fy+(p.to.y-p.fy)*k-Math.sin(k*Math.PI)*90;if(k>=1)p.t=0;}}
  parts=parts.filter(p=>p.t>0);
  // cámara que sigue a Doña Chuy (con ligera inercia)
  const tx=clamp(P.x+P.face*60-W*.42,0,Math.max(0,worldW-W));cam+=(tx-cam)*Math.min(1,dt*5);
  // meta y tiempo
  if(goal&&over(P,goal))return finish('goal');
  if(boss&&boss.dead){endT+=dt;if(endT>2.4)return finish('boss');}
  if(timeLeft<=0)return finish('time');
  if(bubT>0){bubT-=dt;if(bubT<=0)bub.classList.remove('on');}}
function updateBoss(dt,prevB){const b=boss;b.flash=Math.max(0,b.flash-dt);
  if(b.dead){b.deadT+=dt;b.x+=260*dt;b.y-=40*dt;return;}
  if(b.stun>0){b.stun-=dt;}
  else{b.x+=b.dir*b.sp*dt;if(b.x<2*T||b.x>38*T-b.w){b.dir*=-1;b.x=clamp(b.x,2*T,38*T-b.w);}
    b.thr-=dt;if(b.thr<=0){b.thr=2.3-(3-b.hp)*.35;const dx=(P.x-b.x);shots.push({k:'multa',x:b.x+b.w/2,y:b.y+20,vx:clamp(dx*.9,-420,420),vy:-520,r:0,ph:0});say(b,['«Multa por no traer copia»','«Recargo administrativo»','«Actualización del formato»'][Math.floor(Math.random()*3)],1.2);}
    b.abs-=dt;if(b.abs<=0){b.abs=3.4;if(coins>0){coins--;stolen++;b.pock=Math.min(6,b.pock+1);parts.push({x:P.x,y:P.y,fx:P.x+9,fy:P.y,to:{x:b.x+(Math.random()<.5?6:b.w-6),y:b.y+50},k:0,t:2,vx:0,vy:0,c:'#F2C14E',s:6,coin:true});say(b,['«Comisión administrativa»','«Cuota de recuperación»','«Es para la obra… mía»'][Math.floor(Math.random()*3)],1.5);}}}
  if(over(P,b)){
    if(P.vy>0&&prevB<=b.y+14&&b.stun<=0){b.hp--;b.stun=1.4;b.flash=.35;P.vy=-600;
      const n=Math.min(b.pock,3)+2;b.pock=Math.max(0,b.pock-3);
      for(let i=0;i<n;i++)items.push({t:'c',x:b.x+b.w/2,y:b.y+30,got:false,dyn:true,vx:(Math.random()-.5)*520,vy:-480-Math.random()*200});
      if(b.hp<=0){b.dead=true;say(b,'«¡Me voy de año sabático!»',2.4);}
      else say(b,['«¡Fue un error administrativo!»','«¡Yo sólo lo cuidaba!»'][2-b.hp]||'«¡Auch!»',1.6);}
    else if(b.stun<=0)hurt(2,'stolen','«¡Gracias por su aportación!»',b);}}

/* ---------- dibujo ---------- */
function R(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function txt(s,x,y,size,c,al){g.font='800 '+size+'px '+FONT;g.fillStyle=c;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(s,Math.round(x),Math.round(y));}
function drawBG(){
  if(LV.bg==='city'){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#F6C177');gr.addColorStop(.6,'#F8E3BC');gr.addColorStop(1,'#F6F1E4');g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.fillStyle='#FFE7A3';g.beginPath();g.arc(760-cam*.05,110,54,0,7);g.fill();
    // ciudad lejana
    for(let i=0;i<30;i++){const x=i*120-(cam*.2)%120-120,h=60+((i*37)%5)*26;R(x,400-h,90,h+200,'#E7C79A');}
    // edificio de gobierno ficticio en el fondo
    const gx=900-cam*.35;R(gx,250,220,170,'#D8B482');R(gx+90,190,40,60,'#D8B482');R(gx+70,180,80,14,'#C9A16C');for(let j=0;j<5;j++)R(gx+16+j*42,280,14,120,'#C9A16C');
    // espectacular satírico
    const bx=420-cam*.5;R(bx+60,330,10,90,'#6E5232');R(bx+190,330,10,90,'#6E5232');R(bx,250,260,86,'#0B3A2B');R(bx+6,256,248,74,'#FCFAF3');txt('BIENVENIDO A',bx+130,276,16,'#0B3A2B');txt('BAJA CORRUPCIÓN',bx+130,302,24,'#B23A1E');txt('pague su 2% con una sonrisa',bx+130,322,11,'#56655D');
    const bx2=1650-cam*.5;R(bx2+40,330,10,90,'#6E5232');R(bx2+170,330,10,90,'#6E5232');R(bx2,256,220,80,'#E09A1A');txt('VENTANILLA 3',bx2+110,282,22,'#0B3A2B');txt('cerramos a las 2:00',bx2+110,310,14,'#0B3A2B');
    for(let i=0;i<24;i++){const x=i*170-(cam*.6)%170-170;R(x,402,120,140,'#C99A5B');R(x+14,420,30,30,'#F8E3BC');R(x+70,420,30,30,'#F8E3BC');}}
  else if(LV.bg==='office'){R(0,0,W,H,'#ECE4CF');R(0,300,W,8,'#C9BFA5');
    for(let i=0;i<20;i++){const x=i*260-(cam*.4)%260-260;
      R(x+30,110,110,140,'#8B6A43');R(x+38,118,94,124,'#F6F1E4');g.fillStyle='#56655D';g.beginPath();g.arc(x+85,160,18,0,7);g.fill();R(x+60,182,50,46,'#56655D');txt('LIC.',x+85,236,12,'#875709');
      R(x+170,160,70,140,'#9FB7AA');for(let j=0;j<3;j++){R(x+176,168+j*44,58,36,'#B9C4BD');R(x+196,182+j*44,18,6,'#56655D');}}
    for(let i=0;i<8;i++){const x=i*640+260-(cam*.6)%640;R(x,60,250,70,'#0B3A2B');txt('TRÁMITE EXPRÉS*',x+125,86,20,'#F2C14E');txt('*sujeto a cooperación',x+125,112,13,'#CFE0D6');}}
  else{R(0,0,W,H,'#0F4434');for(let y=0;y<10;y++)for(let x=0;x<14;x++)txt('$',x*80+(y%2)*40+20,y*60+30,26,'rgba(242,193,78,.10)');
    g.fillStyle='#14553F';g.beginPath();g.arc(480,250,150,0,7);g.fill();g.strokeStyle='#E09A1A';g.lineWidth=8;g.stroke();
    for(let a=0;a<8;a++){g.save();g.translate(480,250);g.rotate(a*Math.PI/4+clock*.2);R(-6,-130,12,40,'#E09A1A');g.restore();}
    txt('BÓVEDA DEL LIC. BOLSILLOS',480,60,26,'#F2C14E');txt('«uso exclusivamente personal… digo, oficial»',480,92,16,'#CFE0D6');}}
function drawTiles(){const p=LV.pal,x0=Math.floor(cam/T),x1=Math.min(map[0].length-1,x0+W/T+1);
  for(let y=0;y<ROWS;y++)for(let x=x0;x<=x1;x++){const c=map[y][x],sx=x*T-cam,sy=y*T;
    if(c==='#'){R(sx,sy,T,T,p.body);if(y===0||map[y-1][x]!=='#'){R(sx,sy,T,7,p.top);R(sx,sy+7,T,2,p.line);}else{R(sx+((y%2)?0:12),sy,2,T,p.line);R(sx,sy+T-2,T,2,p.line);}}
    else if(c==='-'){R(sx,sy,T,12,'#E3C08A');R(sx,sy+10,T,3,'#C99A5B');R(sx+3,sy+3,T-6,2,'#FCFAF3');R(sx,sy,1,13,'#B5864A');}
    else if(c==='x'){R(sx+2,sy+6,20,18,'#FCFAF3');R(sx+4,sy+2,18,6,'#EDE5D0');R(sx+2,sy+10,20,2,'#B9C4BD');R(sx+2,sy+16,20,2,'#B9C4BD');g.save();g.translate(sx+12,sy+15);g.rotate(-.35);R(-11,-5,22,10,'rgba(178,58,30,.9)');txt('NO',0,0,8,'#FCFAF3');g.restore();}}}
function drawGoal(){if(!goal)return;const x=goal.x-cam,y=goal.y;
  if(goal.kind==='ventanilla'){R(x,y,goal.w,goal.h,'#0B3A2B');R(x+8,y+8,goal.w-16,22,'#E09A1A');txt('VENTANILLA 3',x+goal.w/2,y+19,12,'#0B3A2B');R(x+14,y+38,goal.w-28,40,'#CFE0D6');for(let i=0;i<5;i++)R(x+18+i*14,y+38,3,40,'#56655D');R(x+20,y+48,goal.w-40,20,'#FCFAF3');txt(Math.sin(clock*3)>0?'ABIERTO':'CERRADO',x+goal.w/2,y+58,10,Math.sin(clock*3)>0?'#0A7A45':'#B23A1E');}
  else{R(x,y,goal.w,goal.h,'#8B6A43');R(x+6,y+6,goal.w-12,goal.h-6,'#6E5232');R(x+goal.w-18,y+52,6,6,'#F2C14E');R(x-10,y-26,goal.w+20,22,'#0B3A2B');txt('OFICINA DEL LIC.',x+goal.w/2,y-15,11,'#F2C14E');}
  const a=.5+.5*Math.sin(clock*5);g.fillStyle='rgba(242,193,78,'+(.25+.25*a)+')';g.beginPath();g.moveTo(x+goal.w/2-10,y-40-a*6);g.lineTo(x+goal.w/2+10,y-40-a*6);g.lineTo(x+goal.w/2,y-26-a*6);g.fill();}
function drawItems(){for(const it of items){if(it.got)continue;const x=it.x-cam,y=it.y+Math.sin(clock*4+it.x)*2;if(x<-20||x>W+20)continue;
  if(it.t==='c'){const s=Math.abs(Math.cos(clock*5+it.x*.1));g.fillStyle='#E09A1A';g.beginPath();g.ellipse(x,y,Math.max(2,9*s),9,0,0,7);g.fill();g.fillStyle='#F2C14E';g.beginPath();g.ellipse(x,y,Math.max(1,6*s),6,0,0,7);g.fill();if(s>.5)txt('2%',x,y+1,7,'#875709');}
  else{R(x-8,y-10,16,20,'#FCFAF3');R(x-8,y-10,16,3,'#0A7A45');R(x-5,y-4,10,2,'#B9C4BD');R(x-5,y,10,2,'#B9C4BD');R(x-5,y+4,7,2,'#B9C4BD');g.strokeStyle='#0B3A2B';g.lineWidth=1.5;g.strokeRect(x-8,y-10,16,20);}}}
function drawPlayer(){if(P.inv>0&&Math.floor(clock*16)%2)return;const x=Math.round(P.x-cam),y=Math.round(P.y),f=P.face,lg=P.on&&Math.abs(P.vx)>20?Math.round(Math.sin(P.anim*6)*3):0;
  g.save();g.translate(x+9,y);g.scale(f,1);
  R(-9,18,8,12-Math.max(0,lg),'#5B3A22');R(1,18,8,12-Math.max(0,-lg),'#5B3A22');
  R(-10,9,20,12,'#0A7A45');R(-8,9,16,3,'#FCFAF3');
  R(-13,10,7,12,'#E09A1A');R(-12,11,5,3,'#875709');txt('$',-9.5,17,7,'#875709');
  R(-7,-2,14,12,'#D9A27A');R(-8,-6,16,6,'#3B2A20');R(-11,-8,7,7,'#3B2A20');R(3,2,2,2,'#22322A');R(-1,7,5,1,'#8B4A3A');
  g.restore();}
function drawEnemies(){for(const e of enemies){if(e.gone)continue;const x=Math.round(e.x-cam),y=Math.round(e.y),b=e.run>0?0:Math.round(Math.sin(clock*8+e.ph)*1.5);if(x<-40||x>W+40)continue;
  g.save();g.translate(x+10,y);g.scale(e.dir,1);if(e.run>0)g.globalAlpha=Math.max(0,e.run);
  R(-8,18+b,6,12,'#22322A');R(2,18-b,6,12,'#22322A');R(-10,8,20,13,'#6B7A72');R(-2,8,4,10,'#B23A1E');R(6,10,10,9,'#E3C08A');
  R(-7,-3,14,12,'#C98F6A');R(-8,-6,16,4,'#22322A');R(-6,1,13,3,'#0B0B0B');R(-4,6,8,2,'#3B2A20');
  g.restore();
  if(e.run<=0){txt('COYOTE',x+10,y-12,8,'#B23A1E');}}}
function drawBoss(){const b=boss;if(!b)return;const x=Math.round(b.x-cam),y=Math.round(b.y),wob=b.stun>0?Math.sin(clock*40)*3:Math.sin(clock*4)*1.5;
  g.save();g.translate(x+b.w/2+wob,y);if(b.dead)g.globalAlpha=Math.max(0,1-b.deadT/2);
  const pr=10+b.pock*3.2;
  R(-20,64,14,20,'#22322A');R(6,64,14,20,'#22322A');
  g.fillStyle=b.flash>0?'#FFFFFF':'#22322A';g.beginPath();g.ellipse(0,46,30,28,0,0,7);g.fill();
  R(-8,22,16,26,'#FCFAF3');R(-3,24,6,22,'#B23A1E');
  for(const s of[-1,1]){g.fillStyle='#E09A1A';g.beginPath();g.arc(s*(28+pr*.4),52,pr,0,7);g.fill();g.fillStyle='#F2C14E';g.beginPath();g.arc(s*(28+pr*.4)-2,49,pr*.6,0,7);g.fill();txt('$',s*(28+pr*.4),53,Math.round(pr*.9),'#875709');}
  R(-14,0,28,24,'#D9A27A');R(-16,-4,32,7,'#3B2A20');R(-10,14,20,4,'#3B2A20');
  if(b.stun>0){txt('×',-6,8,10,'#22322A');txt('×',6,8,10,'#22322A');}else{R(-8,6,4,4,'#22322A');R(4,6,4,4,'#22322A');}
  g.restore();
  txt('LIC. BOLSILLOS',x+b.w/2,y-14,11,'#F2C14E');
  for(let i=0;i<3;i++)R(x+b.w/2-24+i*18,y-34,14,8,i<b.hp?'#B23A1E':'rgba(255,255,255,.25)');}
function drawShots(){for(const s of shots){const x=s.x-cam;g.save();g.translate(x,s.y);g.rotate(s.r);
  if(s.k==='paper'){R(-9,-11,18,22,'#FCFAF3');R(-6,-6,12,2,'#B9C4BD');R(-6,-1,12,2,'#B9C4BD');R(-6,4,8,2,'#B9C4BD');g.strokeStyle='#56655D';g.lineWidth=1;g.strokeRect(-9,-11,18,22);}
  else{R(-12,-9,24,18,'#FCFAF3');R(-12,-9,24,6,'#B23A1E');txt('MULTA',0,-6,6,'#FCFAF3');R(-8,1,16,2,'#B9C4BD');R(-8,5,12,2,'#B9C4BD');}
  g.restore();}}
function drawParts(){for(const p of parts){g.globalAlpha=Math.max(0,Math.min(1,p.t*2));if(p.coin){g.fillStyle='#E09A1A';g.beginPath();g.arc(p.x-cam,p.y,7,0,7);g.fill();}else R(p.x-cam,p.y,p.s,p.s,p.c);}g.globalAlpha=1;}
function draw(){drawBG();drawTiles();for(const m of movers){const x=m.x-cam;R(x,m.y,m.w,12,'#0A7A45');R(x,m.y,m.w,4,'#CFE0D6');txt('SELLO',x+m.w/2,m.y+8,8,'#FCFAF3');}
  drawGoal();drawItems();drawEnemies();drawBoss();drawPlayer();drawShots();drawParts();}

/* ---------- interfaz ---------- */
let hudCache='';
function updHud(){const s=coins+'|'+fmtT(timeLeft)+'|'+receipts;if(s===hudCache)return;hudCache=s;hC.textContent=coins;hT.textContent=fmtT(timeLeft);hR.textContent='Comprobantes '+receipts+'/5';
  hT.parentElement.style.background=timeLeft<10?'rgba(178,58,30,.92)':'';}
function placeBub(){if(!bub.classList.contains('on')||!bubE)return;const e=bubE;bub.style.left=((e.x+(e.w||18)/2-cam)*2)+'px';bub.style.top=(Math.min(900,Math.max(110,(e.y-8)*2)))+'px';}
let onEx=null;
function show(k,t,html,go,note,onGoFn,ex){mK.textContent=k;mT.textContent=t;mP.innerHTML=html;bGo.textContent=go;mN.textContent=note||'';
  if(ex){bEx.style.display='';bEx.textContent=ex[0];onEx=ex[1];}else{bEx.style.display='none';onEx=null;}
  onGo=onGoFn;modal.classList.add('on');hud.classList.remove('on');touch.classList.remove('on');bub.classList.remove('on');}
function hide(){modal.classList.remove('on');}
const CTRL=coarse?'<span class="ctr">Usa los botones de abajo: ◀ ▶ para caminar y ⤒ para saltar</span>':'<span class="ctr">← → para caminar · Espacio o ↑ para saltar · Esc para pausar</span>';
const NOTE='Sátira con personajes y lugares ficticios. Exagera la desconfianza ciudadana; no acusa a ninguna persona ni institución real.';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
let player={name:store.get('r2-name'),group:store.get('r2-group')};
function title(msg){mode='title';stop();load(0);coins=0;stolen=0;fees=0;draw();
  show('Minijuego · Sátira · menos de 5 minutos','La Ruta del 2%','<p>Ayuda a <b>Doña Chuy</b>, dueña de una tlapalería en Mexicali, a pagar su ISAMI antes del día 25. En el camino hay trámites infinitos, coyotes que «agilizan» y un tal <b>Lic. Bolsillos</b> con bolsillos sospechosamente grandes.</p>'+
    '<div class="who"><label>Tu nombre<input id="g-name" maxlength="24" autocomplete="nickname" placeholder="Como quieres salir en la tabla" value="'+esc(player.name)+'"></label><label class="sm">Grupo<input id="g-grp" maxlength="12" placeholder="Opcional" value="'+esc(player.group)+'"></label></div>'+
    (msg?'<p class="warn">'+msg+'</p>':'')+CTRL,'Jugar',NOTE,()=>{
      const n=$('#g-name').value.replace(/\s+/g,' ').trim(),gp=$('#g-grp').value.replace(/\s+/g,' ').trim();
      if(n.length<2){title('Escribe tu nombre para que tu puntaje cuente.');setTimeout(()=>$('#g-name').focus(),30);return;}
      player={name:n,group:gp};store.set('r2-name',n);store.set('r2-group',gp);intro(0);},['Ver ganadores',()=>board()]);}
const INTRO=[
  ['Junta tus <b>5 comprobantes</b> y llega a la <b>Ventanilla 3</b> antes de que se acabe el día 25. Salta las pilas de trámites y esquiva los formatos que caen del cielo.','Cada moneda es tu 2%: llévalas todas.'],
  ['Recupera monedas camino a la <b>oficina del Lic. Bolsillos</b>. Si un <b>coyote</b> te alcanza, te «agiliza» el trámite… y la cartera. <b>Salta sobre ellos</b> para que huyan y suelten lo que se llevaron.','Súbete a los sellos que se mueven para cruzar.'],
  ['Cada cierto tiempo el Licenciado se cobra una «comisión administrativa» de tus monedas. <b>Salta sobre su cabeza 3 veces</b> para vaciarle los bolsillos y regresar el dinero. Cuidado con las multas que lanza.','Las monedas que suelta se pueden recoger.']];
function intro(i){load(i);if(i===0){coins=0;stolen=0;fees=0;rec1=0;tBonus=0;played=0;runId=Date.now().toString(36)+Math.random().toString(36).slice(2,8);}draw();mode='intro';
  show('Nivel '+(i+1)+' de 3',LV.name.split('· ')[1],'<p>'+INTRO[i][0]+'</p><p>'+INTRO[i][1]+'</p>','¡Vamos!','',()=>play(),['Salir',()=>title()]);}
function play(){hide();mode='play';hud.classList.add('on');if(coarse)touch.classList.add('on');K.L=K.R=K.J=false;hudCache='';start();}
function finish(why){mode='modal';stop();K.L=K.R=K.J=false;
  if(why==='goal'||why==='boss')tBonus+=Math.max(0,Math.ceil(timeLeft));if(li===0)rec1=receipts;
  if(li===0){let t,h;if(why==='goal'){t='Ventanilla 3: «Se cayó el sistema»';h='<p>«Uy, sin sistema no hay pago… pero pásele con el Licenciado, él se lo arregla.»</p>'+(receipts<5?'<p>«Y le faltan '+(5-receipts)+' copias, pero eso también se “arregla”…»</p>':'<p>Llevabas los 5 comprobantes. Igual no sirvió.</p>');}
    else{const c=lose(3,'fee');t='¡Se acabó el día 25!';h='<p>Te cobraron recargos: −'+c+' monedas.</p><p>«Regrese mañana… o pásele con el Licenciado.»</p>';}
    show('Nivel 1 terminado',t,h,'Continuar','',()=>intro(1));}
  else if(li===1){let t,h;if(why==='goal'){t='Oficina del Lic. Bolsillos';h='<p>«Pásele, pásele. Aquí su 2% queda en buenas manos… en las mías.»</p><p>Llegas con <b>'+coins+'</b> monedas.</p>';}
    else{const c=lose(3,'fee');t='Se te fue la mañana en la fila';h='<p>Recargos: −'+c+' monedas. «El Licenciado lo recibe ahorita… bueno, en un ratito.»</p>';}
    show('Nivel 2 terminado',t,h,'Entrar','',()=>intro(2));}
  else ending(why==='boss');}
const SCORE={coin:100,rec:50,sec:10,boss:1500};
function scoreOf(r){return r.coins*SCORE.coin+r.receipts*SCORE.rec+r.tbonus*SCORE.sec+(r.boss?SCORE.boss:0);}
function ending(won){mode='end';stop();bossBeat=won;
  const delivered=coins;let t;
  if(won&&stolen<=3)t='¡Recuperaste el 2%!';else if(won)t='Ganaste… pero algo se quedó en el camino';else t='El Lic. se fue de vacaciones con tu 2%';
  const run={v:2,run:runId,name:player.name,group:player.group,coins:delivered,receipts:rec1,tbonus:tBonus,boss:won,stolen,fees,played:Math.round(played),ending:t};
  const pts=scoreOf(run);
  show('Fin del juego · '+esc(player.name),t,'<p class="score"><b>'+pts.toLocaleString('es-MX')+'</b> puntos</p>'+
    '<div class="gstats"><span>'+delivered+' monedas × 100</span><span>'+rec1+' comprobantes × 50</span><span>'+tBonus+' s sobrantes × 10</span><span>'+(won?'Lic. vencido +1,500':'Lic. sin vencer +0')+'</span></div>'+
    '<div class="gstats dim"><span>Bolsillos ajenos: '+stolen+'</span><span>Recargos y multas: '+fees+'</span></div>'+
    '<p class="net" id="g-net">'+(window.ISAMI_SCORES_URL?'Enviando tu puntaje…':'Tabla de ganadores sin conectar: tu puntaje sólo se guardó en este dispositivo.')+'</p>'+
    '<div class="real"><b>Lo que sí es real:</b> el ISAMI recauda unos 14.6 millones de pesos al año, el 0.096% de los impuestos del Estado. No encontramos pruebas de que ese dinero se desvíe; lo que sí encontramos es que el trámite cuesta mucho para lo poco que junta.</div>',
    'Jugar otra vez',NOTE,()=>intro(0),['Ver ganadores',()=>board()]);
  saveLocal(run,pts);
  if(window.ISAMI_SCORES_URL)sendScore(run).then(r=>{const el=$('#g-net');if(!el)return;
    if(r&&r.ok)el.innerHTML='Puntaje enviado. '+(r.rank?'Vas en el <b>lugar '+r.rank+'</b> de '+r.players+' jugadores.':'');
    else el.textContent='No se pudo enviar el puntaje'+(r&&r.error?' ('+r.error+')':'')+'. Revisa tu conexión y vuelve a jugar.';});}
function saveLocal(run,pts){try{const a=JSON.parse(store.get('r2-runs')||'[]');a.push({name:run.name,group:run.group,score:pts,date:new Date().toISOString()});store.set('r2-runs',JSON.stringify(a.slice(-30)));}catch(e){}}
function sendScore(run){
  return fetch(window.ISAMI_SCORES_URL,{method:'POST',body:JSON.stringify(run),credentials:'omit'}).then(r=>r.json()).catch(()=>null);}
function fetchTop(){
  if(!window.ISAMI_SCORES_URL){let a=[];try{a=JSON.parse(store.get('r2-runs')||'[]');}catch(e){}
    const best={};for(const r of a){const k=r.name.toLowerCase();if(!best[k]||r.score>best[k].score)best[k]=r;}
    return Promise.resolve({ok:true,local:true,top:Object.values(best).sort((x,y)=>y.score-x.score).slice(0,10)});}
  return fetch(window.ISAMI_SCORES_URL+(window.ISAMI_SCORES_URL.includes('?')?'&':'?')+'action=top&n=10&t='+Date.now(),{credentials:'omit'}).then(r=>r.json()).catch(()=>null);}
function board(){mode='board';stop();
  show('Tabla de ganadores','Los que recuperaron más 2%','<p class="net">Cargando…</p>','Jugar','',()=>title(),['Actualizar',()=>board()]);
  fetchTop().then(d=>{if(mode!=='board')return;
    if(!d||!d.ok){mP.innerHTML='<p class="net">No se pudo cargar la tabla. Revisa tu conexión.</p>';return;}
    if(!d.top.length){mP.innerHTML='<p class="net">Todavía nadie ha jugado. ¡Sé el primero!</p>';return;}
    mP.innerHTML=(d.local?'<p class="net">Sin conexión a la tabla general: estos son los puntajes de este dispositivo.</p>':'')+
      '<table class="lb"><thead><tr><th>#</th><th>Nombre</th><th>Grupo</th><th>Puntos</th></tr></thead><tbody>'+
      d.top.map((r,i)=>'<tr'+(r.name.toLowerCase()===String(player.name).toLowerCase()?' class="me"':'')+'><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.group||'—')+'</td><td>'+Number(r.score).toLocaleString('es-MX')+'</td></tr>').join('')+
      '</tbody></table>'+(d.plays?'<p class="net">'+d.plays+(d.plays===1?' partida jugada':' partidas jugadas')+' en total.</p>':'');});}
function pause(){if(mode!=='play')return;mode='pause';stop();show('Pausa','Juego en pausa','<p>¿Seguimos?</p>','Continuar','',()=>{mode='play';hide();hud.classList.add('on');if(coarse)touch.classList.add('on');start();});}
bGo.addEventListener('click',e=>{e.stopPropagation();const f=onGo;onGo=null;if(f)f();});
bEx.addEventListener('click',e=>{e.stopPropagation();const f=onEx;if(f)f();});

/* ---------- ciclo ---------- */
function frame(t){raf=requestAnimationFrame(frame);const dt=Math.min(.033,(t-lastT)/1000||0);lastT=t;if(mode!=='play')return;update(dt);if(mode==='play'){draw();updHud();placeBub();}}
function start(){if(raf)return;lastT=performance.now();raf=requestAnimationFrame(frame);}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}

/* ---------- controles ---------- */
function key(e,down){if(mode==='off')return;const k=e.key;let used=true;
  if(mode==='title'||mode==='board'){if(k==='Enter'&&down&&modal.classList.contains('on')){e.preventDefault();bGo.click();}return;}
  if(k==='ArrowLeft'||k==='a'||k==='A')K.L=down;
  else if(k==='ArrowRight'||k==='d'||k==='D')K.R=down;
  else if(k===' '||k==='ArrowUp'||k==='w'||k==='W'){if(down&&!K.J)jBuf=.14;K.J=down;}
  else if(k==='Escape'){if(down){if(mode==='play')pause();else if(mode==='pause')bGo.click();}}
  else if(k==='Enter'){if(down&&modal.classList.contains('on'))bGo.click();}
  else used=false;
  if(used)e.preventDefault();}
addEventListener('keydown',e=>key(e,true));addEventListener('keyup',e=>key(e,false));
touch.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;
  const on=e=>{e.preventDefault();e.stopPropagation();if(k==='J'&&!K.J)jBuf=.14;K[k]=true;},off=e=>{e.preventDefault();e.stopPropagation();K[k]=false;};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
sec.addEventListener('click',e=>e.stopPropagation());

window.GAME={
  captures(){return mode!=='off'&&mode!=='title';},
  __dbg:{scoreOf,board,ending,get run(){return {rec1,tBonus,played,stolen,fees}},get P(){return P},get boss(){return boss},get mode(){return mode},get li(){return li},set coins(v){coins=v},get coins(){return coins},get items(){return items},K,finish,intro,play,setTime(v){timeLeft=v;}}};
const go=()=>title();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go);else go();
})();
