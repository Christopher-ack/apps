/* Big Year, version 68.2: the game code. Loaded by index.html after the data and map files. */
(()=>{
const BY=window.BY;
/* ---------- small helpers ---------- */
const TAU=Math.PI*2,PI=Math.PI;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const $=id=>document.getElementById(id);
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d};
function hash2(x,y){let h=(x*374761393+y*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y){return vnoise(x,y)*.55+vnoise(x*2.1+5.3,y*2.1+1.7)*.3+vnoise(x*4.3+9.1,y*4.3+3.2)*.15}
function mix(c1,c2,t){return[c1[0]+(c2[0]-c1[0])*t,c1[1]+(c2[1]-c1[1])*t,c1[2]+(c2[2]-c1[2])*t]}
const rgb=c=>`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;
function hex(h){const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]}
function shade(h,amt){return shadeHex(h,amt)}
function limb(x1,y1,x2,y2,col,w){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function dot(x,y,r,col){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,Math.abs(r),0,TAU);ctx.fill()}
function ell(x,y,rx,ry,col,rot=0){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,Math.abs(rx),Math.abs(ry),rot,0,TAU);ctx.fill()}
function namePill(x,y,text,col){ctx.font='700 12px Fredoka,system-ui,sans-serif';const w=ctx.measureText(text).width+24;
  ctx.fillStyle='rgba(16,38,28,.82)';ctx.beginPath();ctx.roundRect(x-w/2,y-10,w,20,10);ctx.fill();dot(x-w/2+10,y,3.5,col);
  ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(text,x-w/2+17,y+.5);ctx.textBaseline='alphabetic'}

function bBubble(x,y,text,col,t){namePill(x,y,text,col);const by=y-30+Math.sin(t*4)*2;ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.arc(x+1,by+2.5,13,0,TAU);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,by,13,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(x-5,by+10);ctx.lineTo(x,by+19);ctx.lineTo(x+5,by+10);ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,by,13,0,TAU);ctx.stroke();
  ctx.fillStyle='#16121c';ctx.font='700 16px Fredoka,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('B',x,by+1);ctx.textBaseline='alphabetic'}

if(window.CanvasRenderingContext2D&&!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){r=Array.isArray(r)?r[0]:r;r=Math.max(0,Math.min(+r||0,Math.abs(w)/2,Math.abs(h)/2));this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();return this};
const DIAG=[];
function diag(m){DIAG.push(new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit',second:'2-digit'})+' '+m);if(DIAG.length>30)DIAG.shift();}
addEventListener('error',e=>diag('Error: '+(e.message||e.type)+(e.lineno?' (line '+e.lineno+')':'')));
addEventListener('unhandledrejection',e=>diag('Error (async): '+(e.reason&&e.reason.message||e.reason)));
try{localStorage.removeItem('birding-diag-open')}catch(e){}
/* ---------- settings ---------- */
const settings={dev:false,hints:true,joyLeft:false,holdSteer:true,sound:true,seeThrough:true,protoOpen:innerHeight>640&&innerWidth>700,shake:true,tod:'day',wx:'clear',body:'man'};
try{Object.assign(settings,JSON.parse(localStorage.getItem('birding-settings')||'{}'))}catch(e){}
function saveSettings(){try{localStorage.setItem('birding-settings',JSON.stringify(settings))}catch(e){}applySettings()}
function applySettings(){document.body.classList.toggle('no-dev',!settings.dev);document.body.classList.toggle('joy-left',settings.joyLeft);document.body.classList.toggle('no-hints',!settings.hints);
  $('proto').classList.toggle('closed',!settings.protoOpen);$('protoToggle').setAttribute('aria-expanded',settings.protoOpen);SFX.setOn(settings.sound)}
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- CD1 conditions: time of day, weather and season decide who is out (data from the species workbook) ---------- */
const COND=BY.COND;
// RB-1: on another map, the East birds that live there use that region's sheet (abundance, seasons, habitats, ranges)
const REGB=!!(settings.map&&settings.map!=='east'&&BY.CONDR&&BY.CONDR[settings.map]);if(REGB)COND.sp=BY.CONDR[settings.map];
const SEAS_I={spring:0,summer:1,fall:2,winter:3};
function wxKind(){return settings.wx==='storm'?(SEASON==='winter'?'snow':'rain'):''}
function isEve(){return settings.tod==='evening'}
function condP(sp){const d=COND.sp[sp];if(!d)return 1;const si=SEAS_I[SEASON];if(!d.se[si])return 0;const F=COND.freq,base=F[d.f[0]].p;
  let p=isEve()?F[d.f[1]].p:base;const w=wxKind();if(w){const q=F[d.f[w==='snow'?3:2]].p;p=isEve()?p*q/Math.max(base,.01):q}return clamp(p,0,1)}
function condCat(sp){const d=COND.sp[sp];if(!d)return'Regular';const w=wxKind();return w?d.f[w==='snow'?3:2]:isEve()?d.f[1]:d.f[0]}
function condRe(sp){return(COND.freq[condCat(sp)]||COND.freq.Regular).re}   // 1 game minute = 1 second
function condMain(d,si){return d.st==='Year-round'||(d.st==='Breeding'&&si===1)||(d.st==='Winter'&&si===3)||(d.st==='Migrant'&&(si===0||si===2))}
const BIRD_SCALE=.55;   // BN1: share of the workbook's bird numbers placed on the map (1 = the old numbers)
function scaleN(n){const x=n*BIRD_SCALE,f=Math.floor(x);return f+(Math.random()<x-f?1:0)}   // fractions become a chance of one more bird
function condCount(sp,n0){const d=COND.sp[sp];if(!d)return n0;const si=SEAS_I[SEASON];if(!d.se[si])return 0;const A=COND.ab[d.ab];if(!A)return n0;
  return scaleN(A.n*(condMain(d,si)?1:COND.off))}
function condShow(sp){const d=COND.sp[sp];if(!d)return .72;if(d.sr)return 1-Math.exp(-COND.watch*d.sr);return(COND.freq[d.f[0]]||COND.freq.Regular).show}
function condSing(sp){return clamp(.72/Math.max(.05,condShow(sp)),.7,2.5)}
// every placed bird is rolled out or not; S.pool keeps them all, S.birds only the ones that are out
function condRoll(){S.pool=S.birds.slice();const easy=!isEve()&&!wxKind();S.pool.forEach((b,i)=>{const p=condP(b.sp);b.out=i<3&&easy&&p>0?true:Math.random()<p;b.reAt=S.t+condRe(b.sp)*(.5+Math.random())});
  S.birds=S.pool.filter(b=>b.out)}
let condClock=0;
function condTick(dt){condClock+=dt;if(condClock<1||!S.pool)return;condClock=0;const L=listener();
  for(const b of S.pool){if(S.t<b.reAt)continue;if(Math.hypot(b.x-L.x,b.y-L.y)<1300){b.reAt=S.t+5;continue}
    b.reAt=S.t+condRe(b.sp)*(.6+Math.random()*.8);const o=Math.random()<condP(b.sp);if(o===b.out)continue;b.out=o;
    if(o)S.birds.push(b);else{const i=S.birds.indexOf(b);if(i>=0)S.birds.splice(i,1)}}}
function condLabel(){return(isEve()?' · Dusk':'')+(wxKind()==='rain'?' · Rain':wxKind()==='snow'?' · Snow':'')}
/* ---------- EV1 / RN1 / SN1: evening light, rain and snow drawn over the scene ---------- */
const ATM={rain:[],snow:[],ring:[],yaw:null};
function atmSeed(n,f){const a=[];for(let i=0;i<n;i++)a.push(f(i));return a}
function drawAtmos(t,bino){const ev=isEve(),w=wxKind();SFX.weather(w==='rain'?1:0,w==='snow'?1:0,ev&&SEASON!=='winter'&&!w?1:0);if(!ev&&!w)return;
  ctx=mainCtx;ctx.setTransform(DPR,0,0,DPR,0,0);ctx.save();const dt=Math.min(.05,t-(ATM.t??t));ATM.t=t;
  let dx=0,dy=0;if(bino&&BV){if(ATM.yaw!=null)dx=-angDiff(ATM.yaw,BV.yaw)*BV.ppr;ATM.yaw=BV.yaw;ATM.cx=null}else{ATM.yaw=null;const cx=S.cam.x,cy=S.cam.y;if(ATM.cx!=null&&Math.hypot(cx-ATM.cx,cy-ATM.cy)<400){dx=ATM.cx-cx;dy=ATM.cy-cy}ATM.cx=cx;ATM.cy=cy}
  ctx.globalCompositeOperation='multiply';
  if(ev){let g;if(bino){g=ctx.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#8a83ad');g.addColorStop(.5,'#b49aa6');g.addColorStop(1,'#a58c8c')}
    else{g=ctx.createRadialGradient(VW/2,VH*.55,Math.min(VW,VH)*.15,VW/2,VH*.55,Math.hypot(VW,VH)*.6);g.addColorStop(0,'#bfaab0');g.addColorStop(1,'#5e5a84')}
    ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH)}
  if(w==='rain'){ctx.fillStyle='#a3adb8';ctx.fillRect(0,0,VW,VH)}else if(w==='snow'){ctx.fillStyle='#d3d9e0';ctx.fillRect(0,0,VW,VH)}
  ctx.globalCompositeOperation='source-over';
  if(ev){const g=ctx.createLinearGradient(0,0,VW,0);g.addColorStop(0,`rgba(255,150,80,${w?.06:.14})`);g.addColorStop(.6,'rgba(255,150,80,0)');ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH)}
  if(w==='snow'){ctx.fillStyle='rgba(236,241,246,.12)';ctx.fillRect(0,0,VW,VH)}
  const slow=reduceMotion?.35:1;
  if(w==='rain'){const n=reduceMotion?70:bino?170:200;if(ATM.rain.length!==n)ATM.rain=atmSeed(n,()=>({x:Math.random()*VW,y:Math.random()*VH,z:.4+Math.random()*.6}));
    ctx.strokeStyle=ev?'rgba(200,205,225,.35)':'rgba(225,232,240,.42)';ctx.lineCap='round';ctx.beginPath();
    for(const p of ATM.rain){const sp=(bino?1500:900)*p.z*slow,len=(bino?34:13)*p.z;p.y+=sp*dt+(bino?0:dy);p.x+=(bino?dx*p.z:dx)+(bino?-60:-140)*p.z*dt*slow;if(!bino){if(p.y<-60)p.y+=VH+60}
      if(p.y>VH+len){p.y=-len-Math.random()*40;p.x=Math.random()*(VW+80)}if(p.x<-40)p.x+=VW+80;if(p.x>VW+40)p.x-=VW+80;
      ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(bino?-.07:-.16)*len,p.y-len)}ctx.lineWidth=bino?1.1:1.2;ctx.stroke();
    if(!bino){const ox=S.cam.x-VW/2,oy=S.cam.y-VH/2;if(Math.random()<dt*60*slow)for(let i=0;i<3;i++)ATM.ring.push({x:ox+Math.random()*VW,y:oy+Math.random()*VH,a:0});
      ctx.strokeStyle='rgba(230,236,244,.5)';ctx.lineWidth=1;for(let i=ATM.ring.length-1;i>=0;i--){const r=ATM.ring[i];r.a+=dt*2.2;if(r.a>1){ATM.ring.splice(i,1);continue}
        if(r.x<ox-20||r.x>ox+VW+20||r.y<oy-20||r.y>oy+VH+20)continue;ctx.globalAlpha=(1-r.a)*.55;ctx.beginPath();ctx.ellipse(r.x-ox,r.y-oy,1+r.a*6,(1+r.a*6)*.5,0,0,TAU);ctx.stroke()}ctx.globalAlpha=1}}
  if(w==='snow'){const n=reduceMotion?60:bino?150:170;if(ATM.snow.length!==n)ATM.snow=atmSeed(n,()=>({x:Math.random()*VW,y:Math.random()*VH,z:.3+Math.random()*.7,ph:Math.random()*TAU}));
    for(const p of ATM.snow){const fall=(bino?70:45)*(.4+p.z)*slow;p.y+=fall*dt+(bino?0:dy*(.7+.3*p.z));p.x+=(bino?dx*p.z:dx*(.7+.3*p.z))+Math.sin(t*1.3+p.ph)*14*p.z*dt*slow-10*dt*slow;if(p.y<-10)p.y+=VH+18;
      if(p.y>VH+8){p.y=-8;p.x=Math.random()*VW}if(p.x<-10)p.x+=VW+20;if(p.x>VW+10)p.x-=VW+20;
      const r=(bino?1.2+p.z*p.z*4.5:.8+p.z*1.8);ctx.fillStyle=`rgba(255,255,255,${bino&&p.z>.85?.45:.85})`;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill()}}
  ctx.restore()}
function condButtons(g,key,opts){g.innerHTML='';for(const [k,lab] of opts()){const b=document.createElement('button');b.type='button';b.className='sea';b.setAttribute('role','radio');b.setAttribute('aria-checked',settings[key]===k);b.textContent=lab;
  b.onclick=()=>{if(settings[key]===k)return;settings[key]=k;saveSettings();for(const o of g.children)o.setAttribute('aria-checked',o===b);applyCond()};g.appendChild(b)}}
const TOD_OPTS=()=>[['day','Day'],['evening','Dusk']],WX_OPTS=()=>[['clear','Clear'],['storm',SEASON==='winter'?'Snow':'Rain']];
function applyCond(){placeBirds();updateSeasonUI();if($('title').classList.contains('out')){const w=wxKind();toast((isEve()?'Dusk: owls and thrushes wake, hawks go to roost':'Daytime')+(w==='rain'?'. Rain: songbirds shelter, seabirds come close in':w==='snow'?'. Snow: feeder birds crowd in':''),3)}}
/* ---------- sound (all synthesized with Web Audio) ---------- */
const SFX=(()=>{let ac=null,master=null,noise=null;const amb={};let eng=null;
  let boat=null,pln=null;function init(){if(ac)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{ac=new AC()}catch(e){ac=null;return}
    master=ac.createGain();master.gain.value=settings.sound?.8:0;master.connect(ac.destination);
    const len=ac.sampleRate*2;noise=ac.createBuffer(1,len,ac.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    amb.wind=loop('lowpass',380,.6,.03);amb.rain=loop('highpass',2200,.35,0);amb.rain2=loop('lowpass',650,.5,0);amb.snow=loop('bandpass',520,.4,0);amb.crk=loop('bandpass',4300,9,0);{const l=ac.createOscillator();l.type='square';l.frequency.value=14;const lg=ac.createGain();lg.gain.value=0;l.connect(lg);lg.connect(amb.crk.gain);l.start();amb.crkL=lg}amb.leaves=loop('highpass',3200,.5,.004);amb.surf=loop('bandpass',700,.5,0);amb.surf2=loop('lowpass',260,.7,0);
    const lfo=ac.createOscillator();lfo.frequency.value=.09;const lg=ac.createGain();lg.gain.value=.02;lfo.connect(lg);lg.connect(amb.surf.gain);lfo.start();
    // Defender engine: a soft diesel note (low fundamental with a few gentle harmonics, no buzz) plus tyre rumble and gravel hiss
    const pw=ac.createPeriodicWave(new Float32Array([0,0,0,0,0,0]),new Float32Array([0,1,.42,.22,.08,.03]));
    const o1=ac.createOscillator(),sub=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain(),sg=ac.createGain();o1.setPeriodicWave(pw);sub.type='sine';o1.frequency.value=26;sub.frequency.value=13;
    f.type='lowpass';f.frequency.value=260;f.Q.value=.5;sg.gain.value=.5;o1.connect(f);sub.connect(sg);sg.connect(f);f.connect(g);g.gain.value=0;g.connect(master);o1.start();sub.start();
    const rum=loop('lowpass',140,.6,0),grit=loop('bandpass',1100,.7,0);eng={o1,sub,f,g,rum,grit,gear:1,on:false};
    // tour boat: a marine diesel with a slow chug, water rushing past the hull and slapping against it
    const bo=ac.createOscillator(),bf=ac.createBiquadFilter(),bg=ac.createGain(),trem=ac.createOscillator(),tg=ac.createGain();bo.type='sawtooth';bo.frequency.value=34;bf.type='lowpass';bf.frequency.value=180;bf.Q.value=.8;
    bg.gain.value=0;trem.frequency.value=6;tg.gain.value=0;trem.connect(tg);tg.connect(bg.gain);bo.connect(bf);bf.connect(bg);bg.connect(master);bo.start();trem.start();
    const rush=loop('lowpass',420,.5,0),slap=loop('bandpass',520,1.2,0);const sl=ac.createOscillator();sl.frequency.value=.7;const slg=ac.createGain();slg.gain.value=0;sl.connect(slg);slg.connect(slap.gain);sl.start();
    boat={bo,bf,bg,trem,tg,rush,slap,slg};
    {const po=ac.createOscillator(),po2=ac.createOscillator(),pf=ac.createBiquadFilter(),pg=ac.createGain(),pt=ac.createOscillator(),ptg=ac.createGain();po.type='sawtooth';po.frequency.value=60;po2.type='square';po2.frequency.value=30;
     pf.type='lowpass';pf.frequency.value=500;pf.Q.value=.7;pg.gain.value=0;pt.frequency.value=30;ptg.gain.value=0;pt.connect(ptg);ptg.connect(pg.gain);const p2g=ac.createGain();p2g.gain.value=.35;po.connect(pf);po2.connect(p2g);p2g.connect(pf);pf.connect(pg);pg.connect(master);po.start();po2.start();pt.start();
     pln={po,po2,pf,pg,pt,ptg,wind:loop('bandpass',850,.6,0)}}}
  function out(pan=0){let n=master;if(pan&&ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=clamp(pan,-1,1);p.connect(master);n=p}return n}
  function loop(type,f,q,vol){const s=ac.createBufferSource();s.buffer=noise;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=vol;s.connect(fl);fl.connect(g);g.connect(master);s.start(0,Math.random()*1.5);return{gain:g.gain,filter:fl}}
  function nshot(type,f,q,dur,vol,fEnd,delay=0,pan=0){if(!ac||!settings.sound)return;const t0=ac.currentTime+delay;const s=ac.createBufferSource();s.buffer=noise;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t0);if(fEnd)fl.frequency.exponentialRampToValueAtTime(fEnd,t0+dur);fl.Q.value=q;
    const g=ac.createGain();g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t0+.006);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(fl);fl.connect(g);g.connect(out(pan));s.start(t0,Math.random()*1.5);s.stop(t0+dur+.05)}
  function tone(type,f,fEnd,dur,vol,delay=0,o={}){if(!ac||!settings.sound||vol<.0005)return;const t0=ac.currentTime+delay;const osc=ac.createOscillator();osc.type=type;osc.frequency.setValueAtTime(f,t0);if(fEnd!==f)osc.frequency.exponentialRampToValueAtTime(Math.max(20,fEnd),t0+dur);
    if(o.vib){const l=ac.createOscillator();l.frequency.value=o.rate||22;const lg=ac.createGain();lg.gain.value=o.vib;l.connect(lg);lg.connect(osc.frequency);l.start(t0);l.stop(t0+dur+.05)}
    const g=ac.createGain();g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+(o.att||.01));g.gain.setValueAtTime(vol,t0+Math.max(o.att||.01,dur*.6));g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    if(o.filt){const fl=ac.createBiquadFilter();fl.type='bandpass';fl.frequency.value=o.filt;fl.Q.value=o.q||2;osc.connect(fl);fl.connect(g)}else osc.connect(g);g.connect(out(o.pan||0));osc.start(t0);osc.stop(t0+dur+.05)}
  return{init,
    resume(){if(ac&&ac.state==='suspended')ac.resume()},
    setOn(on){if(master)master.gain.value=on?.8:0},
    weather(r,sn,ev){if(!ac||!amb.rain)return;const k=r+sn*2+ev*4;if(k===amb.wk)return;amb.wk=k;const n=ac.currentTime;amb.rain.gain.setTargetAtTime(.022*r,n,.8);amb.rain2.gain.setTargetAtTime(.03*r,n,.8);amb.snow.gain.setTargetAtTime(.012*sn,n,1);amb.crk.gain.setTargetAtTime(0,n,.5);amb.crkL.gain.setTargetAtTime(.0035*ev,n,1)},
    ambient(surf,forest){if(!ac)return;const n=ac.currentTime;amb.surf.gain.setTargetAtTime(.05*surf,n,.4);amb.surf2.gain.setTargetAtTime(.07*surf,n,.4);amb.leaves.gain.setTargetAtTime(.002+.006*forest,n,.5);amb.wind.gain.setTargetAtTime(.018+.02*(1-forest),n,.6)},
    // spd 0..1 of top speed; surf: 'paved' | 'dirt' | 'sand' | 'off'. Four soft "gears" so the note climbs and drops instead of whining up
    engine(on,spd,surf='paved'){if(!eng)return;const n=ac.currentTime,G=[0,.22,.45,.7,1.01];let gi=1;while(gi<4&&spd>G[gi])gi++;
      const band=clamp((spd-G[gi-1])/(G[gi]-G[gi-1]),0,1),rpm=on?(spd<.02?0:.25+.75*band*(gi===1?1:.8)):0,hz=26+rpm*26+(gi-1)*1.5;
      eng.o1.frequency.setTargetAtTime(hz,n,.18);eng.sub.frequency.setTargetAtTime(hz/2,n,.18);eng.f.frequency.setTargetAtTime(220+rpm*260,n,.2);
      eng.g.gain.setTargetAtTime(on?.04+.03*rpm:0,n,on?.25:.5);
      eng.rum.gain.setTargetAtTime(on?.015+.05*spd:0,n,.3);eng.rum.filter.frequency.setTargetAtTime(110+spd*120,n,.3);
      eng.grit.gain.setTargetAtTime(on&&surf!=='paved'?.03*spd*(surf==='sand'?.6:1):0,n,.25);eng.grit.filter.frequency.setTargetAtTime(surf==='sand'?700:1200,n,.3)},
    // craft: 'tour' | 'kayak' | 'canoe' | null; spd 0..1 of the boat's top speed
    boat(craft,spd){if(!boat)return;const n=ac.currentTime,on=craft==='tour',mv=craft?spd:0;
      boat.bo.frequency.setTargetAtTime(on?32+spd*30:30,n,.3);boat.bf.frequency.setTargetAtTime(on?170+spd*260:150,n,.3);
      boat.bg.gain.setTargetAtTime(on?.035+.045*spd:0,n,on?.3:.6);boat.tg.gain.setTargetAtTime(on?.012:0,n,.3);boat.trem.frequency.setTargetAtTime(5+spd*9,n,.3);
      boat.rush.gain.setTargetAtTime(craft?(on?.05:.025)*mv:0,n,.3);boat.rush.filter.frequency.setTargetAtTime(300+mv*700,n,.3);
      boat.slap.gain.setTargetAtTime(craft?.008+.02*mv:0,n,.5);boat.slg.gain.setTargetAtTime(craft?.01:0,n,.5)},
    // floatplane: on, rpm 0..1, wind 0..1
    plane(on,rpm,wind){if(!pln)return;const n=ac.currentTime,f=48+rpm*52;pln.po.frequency.setTargetAtTime(f,n,.35);pln.po2.frequency.setTargetAtTime(f/2,n,.35);pln.pf.frequency.setTargetAtTime(320+rpm*900,n,.35);
      pln.pg.gain.setTargetAtTime(on?.025+.045*rpm:0,n,on?.35:.8);pln.pt.frequency.setTargetAtTime(14+rpm*36,n,.35);pln.ptg.gain.setTargetAtTime(on?.01+.012*rpm:0,n,.35);pln.wind.gain.setTargetAtTime(on?.05*wind:0,n,.5)},
    // a paddle dipping in, a swirl, then drips
    paddle(k=1,pan=0){nshot('bandpass',820,1.1,.2,.07*k,380,0,pan);nshot('lowpass',500,.7,.28,.04*k,220,.08,pan);for(let i=0;i<3;i++)tone('sine',1500+Math.random()*900,1200,.05,.012*k,.32+i*.11+Math.random()*.05,{pan})},
    boatStart(){for(let i=0;i<4;i++)nshot('lowpass',300,.7,.08,.05,130,i*.08);tone('sawtooth',30,36,.6,.03,.36,{att:.12,filt:200,q:.8})},
    step(s,k=1){if(s==='water')nshot('bandpass',650,.8,.16,.06*k,300);else if(s==='sand')nshot('bandpass',900,.7,.09,.045*k,400);else if(s==='road')nshot('bandpass',2400,2,.04,.05*k);else if(s==='snow')nshot('lowpass',1500,.6,.12,.06*k,500);else nshot('bandpass',1800,.6,.06,.035*k,900)},
    door(){nshot('lowpass',500,.8,.16,.2,140);nshot('bandpass',2600,2,.03,.04,1800,.02)},
    start(){for(let i=0;i<5;i++)nshot('lowpass',260,.7,.09,.06,120,i*.09);tone('sine',22,30,.7,.05,.45,{att:.15})},
    chime(){[784,988,1319].forEach((f,i)=>tone('triangle',f,f,.32,.07,i*.11))},
    click(){tone('triangle',1500,1300,.04,.04)},
    focus(p){tone('sine',600+p*700,600+p*700,.05,.02)},
    tripod(){nshot('bandpass',1800,1.5,.05,.05,900);nshot('bandpass',1400,1.5,.05,.05,700,.25);nshot('bandpass',1600,1.5,.05,.05,800,.5);tone('triangle',900,600,.05,.03,.8)},
    shutter(){nshot('highpass',3000,.8,.035,.18,2000);nshot('bandpass',1700,1,.05,.14,900,.06)},
    pish(){for(let i=0;i<3;i++)nshot('highpass',3800,.6,.32,.12,2600,i*.42)},
    // songs: vol 0..1 by distance, pan -1..1 by bearing
    song(id,vol,pan){if(vol<.02)return;const v=vol;if(GB[id]){GBSONG[GB[id].song](tone,nshot,v,pan);return}
      if(id==='btbw'){const n=2+Math.floor(Math.random()*2);for(let i=0;i<n;i++)tone('sawtooth',4100,4000,.2,.05*v,i*.3,{vib:420,rate:64,filt:4300,q:3,pan});tone('sawtooth',4300,6100,.42,.06*v,n*.3+.02,{vib:520,rate:70,filt:5200,q:2,pan})}
      else if(id==='pile'){const n=9+Math.floor(Math.random()*5);for(let i=0;i<n;i++){const f=1150+Math.sin(i/n*PI)*180;tone('square',f,f*.86,.075,.06*v*(.6+.4*Math.sin(i/n*PI)),i*.105,{filt:1400,q:1.5,pan})}}
      else{tone('sine',2150,2300,.13,.11*v,0,{pan});tone('sine',1820,1650,.2,.09*v,.17,{pan});if(Math.random()<.5){tone('sine',2150,2300,.12,.09*v,.75,{pan});tone('sine',1820,1650,.18,.07*v,.9,{pan})}}},
    drum(vol,pan){let t=0;for(let i=0;i<16;i++){nshot('lowpass',520,1,.06,.22*vol,180,t,pan);tone('sine',170,120,.05,.08*vol,t,{pan});t+=.055+i*.004}},
    flush(vol,pan){nshot('bandpass',1200,.8,.25,.08*vol,500,0,pan);nshot('bandpass',900,.8,.2,.06*vol,400,.08,pan)},
    chips(vol,pan){nshot('bandpass',2400,1.5,.05,.06*vol,1600,0,pan)}}
})();
const unlockAudio=()=>{SFX.init();SFX.resume()};
addEventListener('pointerdown',unlockAudio);addEventListener('keydown',unlockAudio);

/* ---------- birds: species data + drawing ----------
   Every bird is drawn in its own frame measured in centimetres, so proportions match the real bird.
   Origin = where the feet touch the perch (or trunk / sand). +x = the way the bird faces, -y = up.
   Callers translate to the feet point and pass s = pixels per centimetre. */
const PC=new Map();function P2(d){let p=PC.get(d);if(!p){p=new Path2D(d);PC.set(d,p)}return p}
function fp(d,c){ctx.fillStyle=c;ctx.fill(P2(d))}
function sp_(d,c,w){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(P2(d))}
function circ(x,y,r){return`M${x+r},${y} A${r},${r} 0 1 0 ${x-r},${y} A${r},${r} 0 1 0 ${x+r},${y} Z`}
function cdot(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,TAU);ctx.fill()}
function cline(pts,c,w){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()}
function shadeBody(d,cx,cy,r,a=.22){const g=ctx.createRadialGradient(cx-r*.3,cy-r*.45,r*.1,cx,cy,r*1.3);g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(.55,'rgba(255,255,255,0)');g.addColorStop(1,`rgba(0,0,0,${a})`);ctx.fillStyle=g;ctx.fill(P2(d))}

const SPECIES={
  btbw:{id:'btbw',group:'Wood-warblers',name:'Black-throated Blue Warbler',sci:'Setophaga caerulescens',len:13,ws:20,lenTxt:'13 cm',wsTxt:'20 cm',
    sex:'Adult male',habitat:'Understory of mature deciduous and mixed forest, especially mountain laurel and rhododendron thickets.',
    voice:'A lazy, buzzy "zur, zur, zreeee", rising at the end.',
    hint:'Listen low in the hardwoods for a lazy, buzzy song that climbs at the end.',
    zone:'Hardwood & mixed forest',
    marks:[
      {n:1,t:'Deep blue upperparts, crown to tail',at:[0.6,-5.6]},
      {n:2,t:'Black face, throat and flanks',at:[2.9,-5.0]},
      {n:3,t:'White "pocket handkerchief" at the base of the primaries',at:[0.4,-3.1]},
      {n:4,t:'Clean white belly and undertail',at:[1.6,-2.0]},
      {n:5,t:'Thin, pointed black bill',at:[4.7,-7.42]},
      {n:6,t:'White spots on the outer tail feathers (seen from below)',at:[-3.6,0.7]}],
    flightMarks:['White handkerchief flashes at the base of the primaries','Dark blue back and tail, black flanks below'],
    sound:'btbw'},
  pile:{id:'pile',group:'Woodpeckers',name:'Pileated Woodpecker',sci:'Dryocopus pileatus',len:44,ws:71,lenTxt:'40–49 cm',wsTxt:'66–75 cm',
    sex:'Adult male',habitat:'Mature forest with big trees and standing dead snags. Look for its big round holes in trunks and snags.',
    voice:'A loud, wild "wuk-wuk-wuk-wuk" and slow, booming drumming.',
    hint:'Watch big trunks and dead snags. Fresh round holes with pale chips mean one is close.',
    zone:'Mature forest, north to south',
    marks:[
      {n:1,t:'Flaming red crest that reaches the forehead',at:[-3.4,-22.6]},
      {n:2,t:'Thin white line above the eye',at:[-2.4,-20.25]},
      {n:3,t:'White stripe from the bill down the side of the neck',at:[-3.5,-13.6]},
      {n:4,t:'Red "mustache" (male; black on females)',at:[0.2,-17.55]},
      {n:5,t:'Long, chisel-tipped dark bill',at:[4.4,-19.0]},
      {n:6,t:'Stiff black tail used as a prop',at:[-1.5,10]}],
    flightMarks:['Bright white underwing linings','White crescent at the base of the primaries on top','Crow-sized, with deep, rowing wingbeats'],
    sound:'pile'},
  pipl:{id:'pipl',group:'Plovers & shorebirds',name:'Piping Plover',sci:'Charadrius melodus',len:17.5,ws:38,lenTxt:'17–18 cm',wsTxt:'38 cm',
    sex:'Breeding adult',habitat:'Open sandy Atlantic beaches, above the wrack line. Threatened: nests are roped off with string fencing.',
    voice:'A soft, clear, whistled "peep-lo".',
    hint:'Scan the dry sand near the string fencing. It runs, stops, and blends in.',
    zone:'Atlantic beaches',
    marks:[
      {n:1,t:'Pale, dry-sand upperparts',at:[-2.6,-8.0]},
      {n:2,t:'Black bar across the forecrown',at:[6.3,-13.25]},
      {n:3,t:'Narrow black breast band, often broken in front',at:[5.4,-9.1]},
      {n:4,t:'Stubby orange bill with a black tip',at:[8.2,-11.35]},
      {n:5,t:'Orange legs',at:[0.7,-1.4]},
      {n:6,t:'No dark line through the eye; pale lores',at:[6.8,-11.6]}],
    flightMarks:['White rump and uppertail','Bold white wing stripe','Black band near the tail tip'],
    sound:'pipl'}
};
const SP_ORDER=['btbw','pile','pipl'];

/* ----- Piping Plover (breeding), standing ----- */
const PL={
  body:"M3.8,-10.6 C6.6,-10.0 7.0,-7.6 5.6,-6.0 C4.4,-4.2 2.2,-3.4 0,-3.5 C-2.5,-3.6 -4.6,-4.8 -6.4,-6.0 L-8.7,-6.9 L-8.6,-7.6 C-6.5,-8.2 -4.0,-9.2 -1.5,-9.9 C0.5,-10.4 2.3,-10.9 3.8,-10.6 Z",
  sand:"M4.6,-11 C4.1,-9.8 3.0,-8.5 1.6,-7.6 C0,-6.8 -2,-6.5 -4,-6.6 L-9,-6.4 L-9,-12 L4.6,-12 Z",
  wing:"M3.3,-10.0 C3.5,-8.2 1.8,-6.5 -0.8,-6.1 C-3.4,-5.9 -5.6,-6.6 -7.6,-7.35 C-5.8,-8.3 -2.6,-9.7 0.4,-10.4 C1.6,-10.6 2.6,-10.5 3.3,-10.0 Z",
  tert:"M0.2,-7.0 C-1.6,-6.5 -3.4,-6.4 -4.9,-6.7 C-4.0,-7.6 -2.4,-8.4 -0.8,-8.6 C-0.3,-8.1 0.0,-7.6 0.2,-7.0 Z",
  prim:"M-3.4,-6.35 C-5.0,-6.5 -6.5,-6.95 -7.6,-7.35 C-6.4,-7.9 -5.0,-8.3 -3.5,-8.25 C-3.8,-7.6 -3.8,-6.9 -3.4,-6.35 Z",
  tail:"M-7.2,-6.85 L-8.7,-6.9 L-8.6,-7.6 L-7.3,-7.55 Z",
  head:circ(5.35,-11.05,1.95),
  cap:"M5.75,-13.2 C5.5,-12.45 5.3,-11.95 5.05,-11.6 C4.8,-11.15 4.8,-10.6 4.95,-10.05 L3.0,-10.05 L3.0,-13.4 Z",
  ear:"M5.45,-10.9 C5.75,-10.45 5.6,-10.0 5.15,-9.85 C4.9,-10.25 4.9,-10.7 5.05,-11.15 Z",
  collar:"M2.3,-11.05 C3.3,-11.55 4.3,-11.25 4.85,-10.3 L4.25,-9.8 C3.75,-10.4 3.0,-10.55 2.2,-10.35 Z",
  bar:"M5.4,-13.0 C6.05,-13.15 6.72,-12.98 7.08,-12.5 L6.8,-12.18 C6.45,-12.6 5.95,-12.72 5.48,-12.62 Z",
  band:"M4.25,-10.05 C5.35,-10.05 6.2,-9.35 6.5,-8.55 L5.78,-8.25 C5.3,-8.95 4.7,-9.3 3.95,-9.25 Z",
  bill:"M7.15,-11.55 C7.72,-11.55 8.22,-11.35 8.62,-11.0 C8.22,-10.78 7.72,-10.7 7.15,-10.7 Z",
  c:{sand:'#d8c7a2',sand2:'#c9b68e',fr:'#ece0c4',prim:'#7f6f56',tail:'#4e4335',white:'#fbfaf5',black:'#191613',bill:'#ef8a2a',tip:'#1b1612',leg:'#f2a33c',eye:'#16110d'}
};
function ploverLeg(x,run,ph,col){
  // tibia (mostly feathered) to a backward-pointing heel, then tarsus to the foot. No hind toe on plovers.
  let hx=x-.45,hy=-2.25,fx=x+.45,fy=0;
  if(run){const a=Math.sin(ph);hx=x-.35+a*.5;hy=-2.3+Math.max(0,-Math.cos(ph))*.5;fx=x+a*1.6;fy=-Math.max(0,Math.cos(ph))*.9}
  cline([[x+.3,-3.9],[hx,hy]],col,.62);cline([[hx,hy],[fx,fy]],col,.42);
  cline([[fx,fy],[fx+1.05,fy+.05]],col,.24);cline([[fx,fy],[fx+.75,fy+.32]],col,.22);cline([[fx,fy],[fx+.7,fy-.25]],col,.2)}
function drawPlover(o){const C=PL.c,t=o.t||0,det=o.detail;
  const run=!!o.run,ph=o.ph||0;
  if(o.legs!==false){ploverLeg(-.7,run,ph+PI,'#d98b2c');ploverLeg(.5,run,ph,C.leg)}
  ctx.save();const pk=(o.peck||0)*.62+(run?.06:0);ctx.translate(.4,-4.2);ctx.rotate(pk);ctx.translate(-.4,4.2);
  if(o.bob)ctx.translate(0,o.bob);
  fp(PL.body,C.white);
  ctx.save();ctx.clip(P2(PL.body));fp(PL.sand,C.sand);ctx.restore();
  fp(PL.wing,C.sand);
  if(det){ctx.save();ctx.clip(P2(PL.wing));
    // covert fringes: pale scalloped edges
    ctx.strokeStyle=C.fr;ctx.lineWidth=.13;for(let r=0;r<3;r++)for(let i=0;i<6;i++){const x=2.4-i*1.15-r*.5,y=-9.4+r*.95+i*.08;ctx.beginPath();ctx.arc(x,y,.75,.15,PI*.85);ctx.stroke()}
    ctx.restore()}
  fp(PL.tert,C.sand2);sp_(PL.tert,'rgba(90,72,46,.35)',.1);
  fp(PL.prim,C.prim);fp(PL.tail,C.tail);cline([[-7.3,-6.86],[-8.7,-6.92]],'#ffffff',.14);
  if(det){cline([[-4.2,-6.6],[-7.2,-7.25]],'rgba(255,255,255,.18)',.08);cline([[-4.4,-7.4],[-7.1,-7.42]],'rgba(255,255,255,.14)',.08)}
  if(det)shadeBody(PL.body,0,-7,7,.18);
  fp(PL.head,C.white);ctx.save();ctx.clip(P2(PL.head));fp(PL.cap,C.sand);fp(PL.ear,'#e6d8bb');ctx.restore();
  fp(PL.collar,C.white);fp(PL.bar,C.black);fp(PL.band,C.black);
  cdot(6.15,-11.3,.5,C.eye);cdot(6.28,-11.45,.14,'rgba(255,255,255,.85)');
  fp(PL.bill,C.bill);ctx.save();ctx.clip(P2(PL.bill));ctx.fillStyle=C.tip;ctx.fillRect(8.08,-12.2,2,2);ctx.restore();
  cline([[7.2,-11.1],[7.95,-11.05]],'rgba(80,30,0,.45)',.08);
  ctx.restore()}

/* ----- Black-throated Blue Warbler (adult male), perched ----- */
const WB={
  body:"M1.2,-7.6 C2.9,-7.9 4.1,-7.3 4.0,-6.3 C4.0,-5.2 3.6,-3.9 2.6,-2.8 C1.8,-1.9 0.6,-1.4 -0.6,-1.3 C-1.2,-1.25 -1.7,-1.0 -2.1,-0.6 L-2.6,-0.9 C-1.9,-2.4 -1.0,-4.4 -0.2,-5.8 C0.3,-6.7 0.6,-7.3 1.2,-7.6 Z",
  tail:"M-1.6,-0.75 L-4.25,1.72 L-4.43,1.45 L-4.65,1.3 L-2.55,-1.48 Z",
  tailW:"M-3.0,0.62 L-3.85,1.4 L-4.08,1.22 L-3.25,0.45 Z",
  head:circ(2.65,-7.35,1.55),
  blue:"M4.2,-7.98 C3.5,-7.98 2.85,-7.88 2.35,-7.62 C1.75,-7.28 1.3,-6.75 0.9,-6.15 C0.5,-5.45 -0.3,-4.4 -1.0,-3.4 L-3,-1 L-3,-10 L4.6,-10 Z",
  white:"M3.45,-3.65 C2.55,-2.85 1.2,-1.95 -0.6,-1.6 L-2.4,-0.72 L-2.4,0.6 L4.6,0.6 Z",
  wing:"M1.4,-6.3 C2.3,-5.6 2.2,-4.2 1.3,-3.1 C0.3,-2.0 -1.0,-1.2 -3.05,-0.25 C-2.7,-1.5 -1.8,-3.4 -0.7,-4.8 C-0.1,-5.6 0.6,-6.3 1.4,-6.3 Z",
  cov:"M1.4,-6.3 C2.3,-5.6 2.2,-4.2 1.45,-3.3 C0.65,-3.55 -0.05,-4.15 -0.5,-4.9 C0,-5.7 0.6,-6.3 1.4,-6.3 Z",
  hank:"M1.1,-3.22 L0.3,-2.52 L-0.12,-2.98 L0.68,-3.7 Z",
  bill:"M3.95,-7.78 C4.4,-7.72 4.85,-7.56 5.25,-7.4 C4.85,-7.26 4.4,-7.16 3.95,-7.06 Z",
  c:{blue:'#2d55a8',blue2:'#3f6cc4',dark:'#172650',edge:'#5582d6',black:'#121216',white:'#f8f8f5',bill:'#141414',leg:'#3b322d'}
};
function drawWarbler(o){const C=WB.c,det=o.detail;
  if(o.legs!==false){cline([[.45,-1.6],[.05,-.12]],C.leg,.24);cline([[-.25,-1.5],[-.4,-.1]],'#2a2420',.22);
    cline([[.05,0],[.75,.12],[1.0,.45]],C.leg,.13);cline([[.05,0],[.55,.3],[.65,.62]],C.leg,.12);cline([[-.35,0],[-.85,.25],[-.95,.55]],C.leg,.12)}
  ctx.save();if(o.bob)ctx.translate(0,o.bob);ctx.translate(.2,-1.5);ctx.rotate(.3);ctx.translate(-.2,1.5);
  const tf=o.tailFlick||0;ctx.save();ctx.translate(-2.1,-1.1);ctx.rotate(-tf*.35);ctx.translate(2.1,1.1);
  fp(WB.tail,C.dark);if(det){cline([[-2.2,-1.0],[-4.35,1.55]],'rgba(85,130,214,.55)',.1);}
  if(o.under)fp(WB.tailW,C.white);ctx.restore();
  fp(WB.body,C.black);ctx.save();ctx.clip(P2(WB.body));fp(WB.blue,C.blue);fp(WB.white,C.white);ctx.restore();
  fp(WB.wing,C.dark);fp(WB.cov,C.blue);
  if(det){ctx.save();ctx.clip(P2(WB.wing));for(let i=0;i<4;i++){const x=.9-i*.95,y=-3.0+i*.75;cline([[x+.6,y-.9],[x-1.4,y+1.4]],'rgba(85,130,214,.75)',.09)}ctx.restore();
    ctx.save();ctx.clip(P2(WB.cov));ctx.strokeStyle='rgba(20,30,70,.45)';ctx.lineWidth=.08;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(1.1-i*.55,-5.0+i*.45,.55,.3,PI*.9);ctx.stroke()}ctx.restore()}
  fp(WB.hank,C.white);
  if(det)shadeBody(WB.body,.8,-4.2,4,.25);
  fp(WB.head,C.black);ctx.save();ctx.clip(P2(WB.head));fp(WB.blue,C.blue);ctx.restore();
  if(det){ctx.save();ctx.clip(P2(WB.head));const g=ctx.createRadialGradient(2.3,-8.3,.1,2.65,-7.35,1.8);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,-10,6,5);ctx.restore()}
  cdot(3.05,-7.42,.33,'#050506');cdot(3.13,-7.52,.1,'rgba(255,255,255,.8)');
  fp(WB.bill,C.bill);
  ctx.restore()}

/* ----- Pileated Woodpecker (adult male), clinging to a trunk on its right ----- */
const PW={
  tail:"M-1.2,4.4 C-0.8,8.0 -0.2,12.0 0.45,15.7 C-1.2,13.6 -2.9,10.4 -3.9,7.0 C-3.9,6.0 -3.7,5.3 -3.4,4.9 Z",
  body:"M-2.2,-15.6 C-0.6,-14.6 -0.2,-12.4 -0.4,-10.0 C-0.6,-6.0 -0.4,-2.0 -0.6,1.2 C-0.8,3.0 -1.0,4.2 -1.2,5.0 L-3.6,5.2 C-5.6,3.6 -7.7,0.0 -8.0,-4.2 C-8.2,-8.0 -7.0,-11.2 -5.6,-13.0 C-4.9,-14.0 -4.5,-15.6 -4.6,-17.0 Z",
  wing:"M-2.2,-12.6 C-0.8,-9.0 -0.8,-3.0 -1.4,1.8 C-1.8,3.6 -2.4,5.4 -3.0,6.6 C-5.0,4.0 -7.0,-0.8 -7.3,-5.0 C-7.5,-8.4 -6.1,-11.6 -4.4,-12.8 C-3.6,-13.2 -2.8,-13.1 -2.2,-12.6 Z",
  wpatch:"M-1.25,-3.1 C-1.35,-2.1 -1.55,-1.1 -1.85,-0.25 L-2.65,-0.55 C-2.45,-1.35 -2.3,-2.3 -2.2,-3.25 Z",
  head:"M-4.8,-17.6 C-5.6,-19.6 -4.6,-22.2 -2.2,-22.6 C0.0,-23.0 1.4,-21.6 1.8,-20.3 C2.0,-19.4 1.6,-18.2 1.0,-17.6 C0,-16.8 -1.2,-16.0 -2.2,-15.6 C-3.4,-16.0 -4.4,-16.6 -4.8,-17.6 Z",
  crest:"M1.7,-20.35 C1.2,-21.8 0.0,-22.8 -1.6,-23.1 C-3.6,-23.5 -6.0,-23.9 -8.6,-23.9 C-7.2,-22.8 -6.2,-21.6 -5.5,-20.4 C-5.2,-19.8 -5.0,-19.0 -4.8,-18.3 C-3.4,-19.6 -1.6,-20.45 0.0,-20.65 C0.6,-20.7 1.15,-20.6 1.7,-20.35 Z",
  sup:"M0.55,-20.5 C-1.2,-20.55 -3.0,-20.45 -4.9,-19.85 L-5.0,-19.35 C-3.0,-19.9 -1.2,-20.05 0.5,-20.08 Z",
  face:"M1.75,-18.75 C0.4,-18.62 -1.4,-18.5 -2.5,-17.95 C-3.4,-17.4 -3.6,-16.3 -3.6,-15.0 C-3.6,-13.6 -3.9,-12.0 -5.0,-10.4 L-6.2,-9.6 C-5.6,-9.1 -4.6,-9.3 -3.9,-10.0 C-2.9,-11.3 -2.6,-13.0 -2.6,-14.6 C-2.6,-15.8 -2.2,-16.8 -1.4,-17.25 C-0.5,-17.75 0.6,-17.95 1.7,-18.15 Z",
  malar:"M1.6,-18.15 C0.6,-17.95 -0.5,-17.65 -1.3,-17.15 L-1.05,-16.6 C-0.3,-17.05 0.7,-17.35 1.55,-17.55 Z",
  chin:"M1.45,-17.5 C0.7,-17.3 -0.15,-16.95 -0.75,-16.45 L-0.5,-15.95 C0.1,-16.45 0.8,-16.8 1.25,-17.0 Z",
  bill:"M1.4,-20.25 C3.0,-19.95 5.0,-19.45 6.75,-19.05 C5.0,-18.6 3.0,-18.2 1.5,-17.92 Z",
  billLo:"M1.5,-18.62 C3.4,-18.72 5.0,-18.9 6.7,-19.05 C5.0,-18.6 3.0,-18.2 1.5,-17.92 Z",
  c:{black:'#1b1a1d',wing:'#232226',edge:'#3e3a3a',red:'#e3262c',red2:'#b3161c',white:'#f5f3ec',bill:'#3b3e44',lo:'#8e949c',iris:'#efe4b0',foot:'#6d7076'}
};
function drawPileated(o){const C=PW.c,det=o.detail;
  ctx.save();if(o.peck)ctx.translate(o.peck*.9,0);
  fp(PW.tail,C.black);if(det){for(let i=0;i<4;i++)cline([[-1.6-i*.5,5.4+i*.2],[-.3-i*.6,13.4-i*1.2]],'rgba(80,74,74,.7)',.12)}
  // feet gripping the bark
  const ft=(y)=>{cline([[-1.4,y-.6],[-.15,y]],C.foot,.5);cline([[-.15,y],[.15,y-.8]],'#3a3c40',.18);cline([[-.15,y],[.2,y+.5]],'#3a3c40',.18)};
  ft(-1.3);ft(.9);
  fp(PW.body,C.black);fp(PW.wing,C.wing);
  if(det){ctx.save();ctx.clip(P2(PW.wing));for(let i=0;i<6;i++){cline([[-1.6-i*.95,-1.5+i*.6],[-2.2-i*.55,5.6-i*1.1]],'rgba(80,72,70,.55)',.13)}
    ctx.strokeStyle='rgba(80,72,70,.5)';ctx.lineWidth=.12;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(-3.0-i*1.1,-8.0+i*.9,1.4,.4,PI*.9);ctx.stroke()}ctx.restore()}
  fp(PW.wpatch,C.white);
  if(det)shadeBody(PW.body,-4,-5,9,.3);
  fp(PW.head,C.black);fp(PW.face,C.white);fp(PW.malar,C.red);fp(PW.chin,C.white);
  fp(PW.crest,C.red);if(det){ctx.save();ctx.clip(P2(PW.crest));for(let i=0;i<7;i++)cline([[.5-i*1.15,-21.2+i*.12],[-1.6-i*1.05,-23.1-i*.1]],'rgba(140,10,16,.55)',.14);ctx.restore()}
  fp(PW.sup,C.white);
  cdot(-.2,-19.45,.62,C.iris);cdot(-.1,-19.45,.32,'#0b0b0c');cdot(0,-19.58,.1,'#fff');
  fp(PW.bill,C.bill);fp(PW.billLo,C.lo);cline([[5.4,-19.2],[6.7,-19.05]],'#24262a',.14);
  ctx.restore()}

/* ----- flight, seen from above (dorsal) or below (ventral). Forward = -y. Used on the map and journal plates ----- */
const FL={
  btbw:{L:13,WS:20,bw:2.4,hr:1.25,bill:1.0,tl:4.6,tw:2.6,chord:4.6,tip:.82,round:.3},
  pile:{L:44,WS:71,bw:8.6,hr:3.6,bill:5.2,tl:15,tw:7.5,chord:17,tip:.7,round:1},
  pipl:{L:17.5,WS:38,bw:3.6,hr:1.9,bill:1.3,tl:5,tw:3.6,chord:7.0,tip:1,round:0}
};
function wingPt(F,u,v,k){const half=F.WS/2*k,x0=F.bw*.42,y0=-F.L*.12;
  // leading edge: shoulder -> wrist (slightly forward) -> tip (swept back)
  const lx=x0+(half-x0)*u,ly=u<.45?y0-F.chord*.18*(u/.45):y0-F.chord*.18+(F.chord*(.18+F.tip*.32))*((u-.45)/.55)**1.4;
  const tc=F.chord*(1-.85*Math.pow(u,2.2)*(1-F.round*.55));
  const ty=y0+tc*(u<.98?1:1)-F.chord*.08*u;
  const tx=lx-(F.round?0:F.chord*.15*u);
  return[lx+(tx-lx)*v,ly+(ty-ly)*v]}
function wingZone(F,u0,u1,v0,v1,k,col,side){ctx.fillStyle=col;ctx.beginPath();const N=8;
  for(let i=0;i<=N;i++){const p=wingPt(F,u0+(u1-u0)*i/N,v0,k);ctx.lineTo(p[0]*side,p[1])}
  for(let i=N;i>=0;i--){const p=wingPt(F,u0+(u1-u0)*i/N,v1,k);ctx.lineTo(p[0]*side,p[1])}ctx.closePath();ctx.fill()}
function drawFlightTop(id,o){if(GB[id]){drawGBFlight(id,o);return}const F=FL[id],k=.3+.7*Math.abs(Math.cos(o.flap||0)),ven=!!o.ventral,det=o.detail;
  const L=F.L,hy=-L*.36,ty=L*.18;
  for(const side of[-1,1]){
    if(id==='pipl'){
      wingZone(F,0,1,0,1,k,ven?'#f4f2ec':'#cdbb97',side);
      if(!ven){wingZone(F,.42,1,.0,.62,k,'#5e5141',side);wingZone(F,0,.42,.55,1,k,'#8c7b61',side);wingZone(F,.02,.92,.48,.62,k,'#fbfaf5',side);wingZone(F,.86,1,0,1,k,'#3f3529',side)}
      else{wingZone(F,.5,1,.55,1,k,'#d9d6cf',side)}}
    else if(id==='btbw'){
      wingZone(F,0,1,0,1,k,ven?'#c9ccd3':'#1c2c5c',side);
      if(!ven){wingZone(F,0,.5,0,.5,k,'#2d55a8',side);wingZone(F,.42,.56,.38,.62,k,'#fbfbf8',side);if(det)for(let i=1;i<6;i++)wingZone(F,.45+i*.09,.47+i*.09,.3,1,k,'#3d63b8',side)}
      else{wingZone(F,0,.5,0,.4,k,'#141416',side)}}
    else{
      wingZone(F,0,1,0,1,k,'#1d1c20',side);
      if(!ven){wingZone(F,.5,.62,.25,.62,k,'#f3f1ea',side)}
      else{wingZone(F,0,.95,0,.5,k,'#f3f1ea',side);wingZone(F,.55,.95,0,.18,k,'#1d1c20',side)}
      if(det)for(let i=0;i<5;i++)wingZone(F,.72+i*.055,.735+i*.055,.55,1,k,ven?'#0e0d10':'#0f0e11',side)}
  }
  // tail
  ctx.beginPath();ctx.moveTo(-F.tw*.32,ty-1);ctx.lineTo(-F.tw/2,ty+F.tl);ctx.lineTo(F.tw/2,ty+F.tl);ctx.lineTo(F.tw*.32,ty-1);ctx.closePath();
  const tcol=id==='pipl'?(ven?'#f4f2ec':'#cbb995'):id==='btbw'?(ven?'#1b1e28':'#1c2c5c'):'#1b1a1d';ctx.fillStyle=tcol;ctx.fill();
  if(id==='pipl'&&!ven){ctx.fillStyle='#2b241c';ctx.fillRect(-F.tw*.45,ty+F.tl*.62,F.tw*.9,F.tl*.22);ctx.fillStyle='#fbfaf5';ctx.fillRect(-F.tw/2,ty+F.tl*.84,F.tw,F.tl*.16);ctx.fillRect(-F.tw/2,ty,F.tw*.16,F.tl);ctx.fillRect(F.tw*.34,ty,F.tw*.16,F.tl)}
  if(id==='btbw'&&ven){ctx.fillStyle='#f4f4f0';ctx.fillRect(-F.tw*.48,ty+F.tl*.45,F.tw*.24,F.tl*.32);ctx.fillRect(F.tw*.24,ty+F.tl*.45,F.tw*.24,F.tl*.32)}
  if(id==='pile'){ctx.strokeStyle='#38353a';ctx.lineWidth=.25;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*F.tw*.1,ty);ctx.lineTo(i*F.tw*.16,ty+F.tl);ctx.stroke()}}
  // body
  const bodyCol=id==='pipl'?(ven?'#fbfaf5':'#d4c29d'):id==='btbw'?(ven?'#f6f6f3':'#2d55a8'):'#1b1a1d';
  ctx.fillStyle=bodyCol;ctx.beginPath();ctx.ellipse(0,0,F.bw/2,L*.33,0,0,TAU);ctx.fill();
  if(id==='pipl'&&!ven){ctx.fillStyle='#fbfaf5';ctx.beginPath();ctx.ellipse(0,ty-.2,F.bw*.36,L*.08,0,0,TAU);ctx.fill()}
  if(id==='btbw'&&ven){ctx.fillStyle='#121216';ctx.beginPath();ctx.ellipse(-F.bw*.36,-.6,F.bw*.18,L*.22,0,0,TAU);ctx.ellipse(F.bw*.36,-.6,F.bw*.18,L*.22,0,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(0,hy+1.4,F.bw*.42,1.4,0,0,TAU);ctx.fill()}
  if(id==='pipl'&&ven){ctx.fillStyle='#191613';ctx.fillRect(-F.bw*.5,hy+1.3,F.bw*.28,.7);ctx.fillRect(F.bw*.22,hy+1.3,F.bw*.28,.7)}
  // head
  const hc=id==='pipl'?(ven?'#fbfaf5':'#d4c29d'):id==='btbw'?(ven?'#121216':'#2d55a8'):'#1b1a1d';
  ctx.fillStyle=hc;ctx.beginPath();ctx.arc(0,hy,F.hr,0,TAU);ctx.fill();
  if(id==='pipl'){if(!ven){ctx.fillStyle='#fbfaf5';ctx.fillRect(-F.hr*.9,hy+F.hr*.55,F.hr*1.8,.5);ctx.fillStyle='#191613';ctx.fillRect(-F.hr*.75,hy-F.hr*.65,F.hr*1.5,.42)}
    ctx.fillStyle='#ef8a2a';ctx.beginPath();ctx.moveTo(-.38,hy-F.hr+.1);ctx.lineTo(0,hy-F.hr-F.bill);ctx.lineTo(.38,hy-F.hr+.1);ctx.fill();ctx.fillStyle='#1b1612';ctx.beginPath();ctx.moveTo(-.18,hy-F.hr-F.bill*.55);ctx.lineTo(0,hy-F.hr-F.bill);ctx.lineTo(.18,hy-F.hr-F.bill*.55);ctx.fill()}
  if(id==='btbw'){if(!ven){ctx.fillStyle='#121216';ctx.fillRect(-F.hr,hy-.1,.42,1.1);ctx.fillRect(F.hr-.42,hy-.1,.42,1.1)}
    ctx.fillStyle='#141414';ctx.beginPath();ctx.moveTo(-.22,hy-F.hr+.1);ctx.lineTo(0,hy-F.hr-F.bill);ctx.lineTo(.22,hy-F.hr+.1);ctx.fill()}
  if(id==='pile'){ctx.fillStyle='#f3f1ea';
    for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(s*F.hr*.7,hy-F.hr*.2);ctx.quadraticCurveTo(s*F.hr*1.1,hy+F.hr*1.6,s*F.bw*.42,hy+F.hr*3.2);ctx.lineTo(s*F.bw*.3,hy+F.hr*3.2);ctx.quadraticCurveTo(s*F.hr*.7,hy+F.hr*1.6,s*F.hr*.35,hy-F.hr*.1);ctx.fill()}
    if(!ven){ctx.fillStyle='#e3262c';ctx.beginPath();ctx.ellipse(0,hy+F.hr*.15,F.hr*.78,F.hr*1.15,0,0,TAU);ctx.fill()}
    else{ctx.fillStyle='#f3f1ea';ctx.beginPath();ctx.ellipse(0,hy-F.hr*.35,F.hr*.42,F.hr*.5,0,0,TAU);ctx.fill();ctx.fillStyle='#e3262c';ctx.fillRect(-F.hr*.75,hy-F.hr*.5,F.hr*.3,F.hr*.9);ctx.fillRect(F.hr*.45,hy-F.hr*.5,F.hr*.3,F.hr*.9)}
    ctx.fillStyle='#3b3e44';ctx.beginPath();ctx.moveTo(-.55,hy-F.hr+.3);ctx.lineTo(-.12,hy-F.hr-F.bill);ctx.lineTo(.12,hy-F.hr-F.bill);ctx.lineTo(.55,hy-F.hr+.3);ctx.fill()}
}

/* ----- flight through the binoculars: the top/bottom view turned side-on and foreshortened ----- */
function drawFlightSide(id,o){ctx.save();ctx.scale(1,.55+.25*Math.abs(Math.sin(o.flap||0)));ctx.rotate(PI/2);drawFlightTop(id,{flap:o.flap,ventral:o.ventral,detail:o.detail});ctx.restore()}
function shadeHex(hex,amt){let r,g,b;if(hex[0]==='#'){const n=parseInt(hex.slice(1),16);r=n>>16;g=n>>8&255;b=n&255}else{[r,g,b]=hex.match(/\d+/g).map(Number)}const f=amt<0?0:255,p=Math.abs(amt);
  r=Math.round((f-r)*p+r);g=Math.round((f-g)*p+g);b=Math.round((f-b)*p+b);return`rgb(${r},${g},${b})`}

/* the one entry point: draws a bird at the current origin, s px/cm, face +1 right / -1 left */
function drawBird(id,pose,s,face,o={}){ctx.save();ctx.scale(s*face,s);
  const det=o.detail??s>2.2;
  if(GB[id]&&pose!=='fly'&&pose!=='top'){drawGB(id,pose==='trunk'?'perch':pose,{...o,detail:det});ctx.restore();return}
  if(pose==='fly')drawFlightSide(id,{flap:o.flap,ventral:o.ventral,detail:det});
  else if(pose==='top'){ctx.restore();ctx.save();ctx.rotate(o.heading||0);ctx.scale(s,s);drawFlightTop(id,{flap:o.flap,ventral:o.ventral,detail:det})}
  else if(id==='pipl')drawPlover({...o,detail:det});
  else if(id==='btbw')drawWarbler({...o,detail:det});
  else drawPileated({...o,detail:det});
  ctx.restore()}

/* ===== 27 more birds (version 18) =====
   One set of body shapes (songbird, ground bird, shorebird, wader, swimmer, seabird) drawn in centimetres like the first three
   birds: origin at the feet (or the waterline), +x the way the bird faces, -y up. Each species brings its own size, posture,
   colours and field marks. kinds: perch (in trees), ground (walks and pecks), reed (sits on cattails),
   wade (stands in shallow water), swim (floats), sea (flies over the sea and floats). */
const GB={};
const GBC={dark:'#141416',white:'#f6f5f0',eye:'#0b0b0c'};
/* ===== body plans (version 20) =====
   A species picks the closest body plan with form:'...' and then overrides anything that makes it itself:
   gb('bufl',{form:'diver',shape:{hr:.15},...}). Size (len, cm) always comes from the species, so two birds can share a plan
   and still read differently by size. Extra controls on top of the proportions:
     body  plump | slim | potbelly | round | boat | long      (side profile of the body)
     head  round | flat | peak | puffy                         (crown shape)
     neckW neck thickness (1 = normal)     legW leg thickness (1 = normal)
     tail  square | notch | round | point | fan                (tail tip, side and flight views)
     bill types: thin, needle, cone, wedge, dagger, chisel, blade, hook, blunt, curve, flat, pouch
   A species can also bring its own drawing: draw(ctx,pose,o,geom,G) runs after the body is drawn
   (or instead of it with drawOnly:true), so an odd-shaped bird can be hand-drawn without touching the rest. */
const FORMS={
  sparrow:  {label:'Sparrow / bunting',len:15,body:'plump',head:'round',tail:'notch',bl:.52,bh:.33,hr:.11,tl:.3,tw:.12,tilt:.3,gtilt:.18,legs:.11,neck:0,bill:{l:1.1,d:.5,type:'cone',ang:.1},wingExt:0,chord:.22},
  finch:    {label:'Finch / grosbeak',len:16,body:'plump',head:'round',tail:'notch',bl:.5,bh:.34,hr:.12,tl:.26,tw:.13,tilt:.35,gtilt:.22,legs:.1,neck:0,bill:{l:1.5,d:1.15,type:'cone',ang:.1},wingExt:.02,chord:.22},
  warbler:  {label:'Warbler',len:13,body:'slim',head:'round',tail:'square',bl:.56,bh:.3,hr:.105,tl:.26,tw:.11,tilt:.25,gtilt:.15,legs:.12,neck:0,bill:{l:1.3,d:.3,type:'needle',ang:.04},wingExt:.03,chord:.22},
  thrush:   {label:'Thrush / robin',len:24,body:'potbelly',head:'round',tail:'square',bl:.5,bh:.31,hr:.095,tl:.28,tw:.12,tilt:.6,gtilt:.45,legs:.15,neck:0,bill:{l:2,d:.55,type:'thin',ang:.12},wingExt:.02,chord:.22},
  mimic:    {label:'Catbird / thrasher',len:22,body:'slim',head:'round',tail:'round',bl:.48,bh:.28,hr:.09,tl:.46,tw:.12,tilt:.3,gtilt:.2,legs:.11,neck:0,bill:{l:1.9,d:.4,type:'thin',ang:.12},wingExt:0,chord:.22},
  wren:     {label:'Wren',len:13,body:'round',head:'round',tail:'round',bl:.56,bh:.38,hr:.12,tl:.28,tw:.13,tilt:.2,gtilt:.15,legs:.12,neck:0,bill:{l:1.6,d:.35,type:'thin',ang:.18},tailUp:.9,wingExt:0,chord:.22},
  blackbird:{label:'Blackbird / meadowlark',len:22,body:'slim',head:'flat',tail:'round',bl:.54,bh:.3,hr:.095,tl:.3,tw:.13,tilt:.4,gtilt:.25,legs:.12,neck:0,bill:{l:2.5,d:.75,type:'dagger',ang:.06},wingExt:0,chord:.23},
  nuthatch: {label:'Nuthatch',len:11,body:'round',head:'flat',tail:'square',bl:.64,bh:.4,hr:.13,tl:.14,tw:.2,tilt:.05,gtilt:.05,legs:.11,neck:0,bill:{l:1.3,d:.34,type:'chisel',ang:-.05},wingExt:.02,chord:.22},
  pigeon:   {label:'Pigeon / dove',len:32,body:'potbelly',head:'round',tail:'round',bl:.58,bh:.36,hr:.075,tl:.28,tw:.22,tilt:.2,gtilt:.15,legs:.08,legW:1.25,neck:0,bill:{l:1.8,d:.55,type:'thin',ang:.15},wingExt:.02,chord:.22},
  kingfisher:{label:'Kingfisher',len:32,body:'plump',head:'peak',tail:'square',bl:.44,bh:.32,hr:.16,tl:.2,tw:.18,tilt:.55,gtilt:.4,legs:.04,neck:0,bill:{l:6,d:1.6,type:'dagger',ang:.02},wingExt:.02,chord:.24},
  dabbler:  {label:'Dabbling duck',len:56,body:'boat',head:'round',tail:'point',bl:.62,bh:.3,hr:.085,tl:.14,tw:.16,tilt:.05,gtilt:.05,stilt:0,legs:.07,neck:7,neckAng:1.25,bill:{l:5.4,d:1.7,type:'flat',ang:.18},tailUp:.35,wingExt:.02},
  diver:    {label:'Diving duck (bufflehead)',len:35,body:'round',head:'puffy',tail:'point',bl:.6,bh:.36,hr:.13,tl:.1,tw:.14,tilt:.02,gtilt:.05,stilt:0,legs:.06,neck:2,neckAng:1.3,neckW:1.3,bill:{l:2.6,d:1.2,type:'flat',ang:.12},tailUp:.2,wingExt:0},
  loon:     {label:'Loon / grebe',len:80,body:'long',head:'flat',tail:'square',bl:.66,bh:.22,hr:.068,tl:.05,tw:.12,tilt:0,gtilt:.05,stilt:-.03,legs:.06,neck:11,neckAng:1.15,neckW:1.15,bill:{l:7.5,d:1.8,type:'dagger',ang:.06},wingExt:0},
  plover:   {label:'Plover',len:18,body:'potbelly',head:'round',tail:'square',bl:.56,bh:.38,hr:.14,tl:.14,tw:.2,tilt:0,gtilt:0,legs:.17,neck:0,bill:{l:1.0,d:.55,type:'blunt',ang:.03},wingExt:.06,chord:.2},
  sandpiper:{label:'Sandpiper',len:19,body:'plump',head:'round',tail:'square',bl:.62,bh:.32,hr:.095,tl:.16,tw:.18,tilt:-.04,gtilt:-.06,legs:.14,neck:0,bill:{l:2.9,d:.45,type:'thin',ang:.1},wingExt:.09,chord:.2},
  yellowlegs:{label:'Yellowlegs / tall sandpiper',len:33,body:'slim',head:'round',tail:'square',bl:.5,bh:.28,hr:.09,tl:.15,tw:.16,tilt:.18,gtilt:.15,legs:.34,legW:.8,neck:3.5,neckAng:1.25,neckW:.85,bill:{l:5.6,d:.55,type:'needle',ang:.05},wingExt:.07,chord:.2},
  oystercatcher:{label:'Oystercatcher',len:44,body:'potbelly',head:'round',tail:'square',bl:.56,bh:.34,hr:.085,tl:.14,tw:.18,tilt:.1,gtilt:.08,legs:.15,legW:1.9,neck:2.5,neckAng:1.2,neckW:1.25,bill:{l:9,d:1.9,type:'blade',ang:.04},wingExt:.05,chord:.2},
  pipit:    {label:'Pipit / lark',len:16,body:'slim',head:'round',tail:'notch',bl:.52,bh:.32,hr:.115,tl:.34,tw:.15,tilt:.15,gtilt:.1,legs:.14,neck:0,bill:{l:1.4,d:.32,type:'needle',ang:.06},wingExt:.05,chord:.22},
  raptor:   {label:'Hawk / osprey',len:55,body:'slim',head:'flat',tail:'square',bl:.52,bh:.3,hr:.08,tl:.32,tw:.14,tilt:.75,gtilt:.6,legs:.12,legW:1.5,neck:0,bill:{l:3.2,d:2,type:'hook',ang:.25},wingExt:.06,chord:.2,tip:.55,round:.7},
  owl:      {label:'Owl',len:50,body:'potbelly',head:'flat',tail:'round',bl:.5,bh:.42,hr:.16,tl:.18,tw:.2,tilt:1.0,gtilt:.9,legs:.06,legW:2.4,neck:0,bill:{l:1.6,d:1.4,type:'hook',ang:.9},wingExt:0,chord:.26,tip:.5,round:.9},
  jay:      {label:'Jay / crow',len:28,body:'plump',head:'round',tail:'round',bl:.48,bh:.32,hr:.1,tl:.4,tw:.14,tilt:.45,gtilt:.3,legs:.13,legW:1.2,neck:0,bill:{l:2.6,d:1,type:'dagger',ang:.06},wingExt:0,chord:.22,crest:'point'},
  swallow:  {label:'Swallow',len:17,body:'slim',head:'flat',tail:'fork',bl:.5,bh:.3,hr:.105,tl:.42,tw:.11,tilt:.15,gtilt:.1,legs:.05,neck:0,bill:{l:.6,d:.45,type:'cone',ang:.1},wingExt:.2,chord:.16,tip:1,round:0},
  tern:     {label:'Tern / gull',len:30,body:'slim',head:'flat',tail:'fork',bl:.5,bh:.28,hr:.1,tl:.36,tw:.1,tilt:.15,gtilt:.12,stilt:-.05,legs:.06,neck:0,bill:{l:3,d:.6,type:'dagger',ang:.08},wingExt:.18,chord:.16,tip:1,round:0},
  tubenose: {label:'Shearwater / petrel',len:46,body:'long',head:'round',tail:'round',bl:.6,bh:.26,hr:.085,tl:.18,tw:.13,tilt:.05,gtilt:.05,stilt:-.02,legs:.05,neck:0,bill:{l:4.5,d:1.2,type:'hook',ang:.06},wingExt:.12,chord:.13,tip:1,round:0},
  alcid:    {label:'Puffin / auk',len:32,body:'plump',head:'round',tail:'square',bl:.58,bh:.36,hr:.12,tl:.08,tw:.12,tilt:.45,gtilt:.5,stilt:0,legs:.06,legW:1.5,neck:0,bill:{l:2.6,d:1.4,type:'wedge',ang:.1},wingExt:0,chord:.14,tip:.9,round:.2},
  gull:     {label:'Gull',len:60,body:'plump',head:'round',tail:'square',bl:.55,bh:.3,hr:.08,tl:.16,tw:.14,tilt:.15,gtilt:.12,stilt:-.02,legs:.12,neck:2,neckAng:1.2,neckW:1.4,bill:{l:5.5,d:1.5,type:'hook',ang:.08},wingExt:.16,chord:.17,tip:.9,round:.15},
  grouse:   {label:'Grouse / ptarmigan',len:38,body:'potbelly',head:'round',tail:'round',bl:.6,bh:.42,hr:.08,tl:.2,tw:.2,tilt:.2,gtilt:.15,legs:.07,legW:2.2,neck:0,bill:{l:1.4,d:1,type:'cone',ang:.2},wingExt:0,chord:.25,tip:.5,round:.9},
  chickadee:{label:'Chickadee / titmouse',len:13,body:'round',head:'round',tail:'square',bl:.5,bh:.4,hr:.14,tl:.36,tw:.14,tilt:.35,gtilt:.2,legs:.12,neck:0,bill:{l:.8,d:.4,type:'cone',ang:.08},wingExt:0,chord:.22},
  frigate:  {label:'Frigatebird',len:100,body:'slim',head:'flat',tail:'fork',bl:.4,bh:.18,hr:.05,tl:.45,tw:.08,tilt:.4,gtilt:.3,stilt:0,legs:.03,neck:3,neckAng:1.2,bill:{l:11,d:1.2,type:'hook',ang:.08},wingExt:.15,chord:.11,tip:1,round:0},
  woodpecker:{label:'Woodpecker',len:22,body:'slim',head:'flat',tail:'point',bl:.52,bh:.32,hr:.11,tl:.3,tw:.13,tilt:1.0,gtilt:.6,legs:.08,legW:1.4,neck:0,bill:{l:2.2,d:.65,type:'chisel',ang:0},wingExt:0,chord:.22},
  heron:    {label:'Heron / egret',len:110,body:'slim',head:'flat',tail:'square',bl:.38,bh:.2,hr:.05,tl:.08,tw:.1,tilt:.55,gtilt:.55,legs:.3,neck:32,neckAng:1.45,bill:{l:13,d:1.6,type:'dagger',ang:.1},wingExt:.04,chord:.2,tip:.6,round:.8},
  ibis:     {label:'Ibis',len:64,body:'plump',head:'round',tail:'square',bl:.44,bh:.22,hr:.048,tl:.1,tw:.12,tilt:.3,gtilt:.25,legs:.2,neck:14,neckAng:1.0,bill:{l:15,d:1.5,type:'curve',ang:.35},wingExt:.02,chord:.21,tip:.7,round:.6},
  pelican:  {label:'Pelican',len:125,body:'long',head:'flat',tail:'square',bl:.5,bh:.24,hr:.042,tl:.1,tw:.14,tilt:.2,gtilt:.2,stilt:.1,legs:.08,neck:20,neckAng:1.45,neckW:1.1,bill:{l:30,d:3,type:'pouch',ang:.55},wingExt:.02,chord:.17,tip:.7,round:.6},
  gannet:   {label:'Gannet / booby',len:94,body:'long',head:'round',tail:'point',bl:.58,bh:.22,hr:.058,tl:.2,tw:.12,tilt:.25,gtilt:.25,stilt:-.05,legs:.07,neck:9,neckAng:1.1,neckW:1.2,bill:{l:9.5,d:2.2,type:'dagger',ang:.05},wingExt:.05,chord:.13,tip:1,round:0}};
function gbMergeShape(base,over){const o=Object.assign({},base,over||{});o.bill=Object.assign({},base.bill||{},(over||{}).bill||{});delete o.label;delete o.len;return o}
function gb(id,d){d.id=id;if(d.form){if(!FORMS[d.form])throw new Error('unknown form '+d.form);d.shape=gbMergeShape(FORMS[d.form],d.shape)}GB[id]=d}
// ---- the species. shape: bl body length, bh body depth, hr head radius, tl tail, tw tail width (all x length);
//      tilt perched / gtilt standing (radians, head up), legs (x length), neck (cm), bill {l cm, d cm, type, ang}
for(const a of BY.BIRDS[0])gb(...a);
// ---- songs: tone(type,f0,f1,dur,vol,delay,{vib,rate,filt,q,pan}) and nshot(type,f,q,dur,vol,fEnd,delay,pan)
const GBSONG={
  quack:(T,N,v,p)=>{const n=3+Math.floor(Math.random()*3);for(let i=0;i<n;i++){const k=1-i*.12;T('sawtooth',360*k,300*k,.16,.07*v,i*.24,{filt:900,q:3,pan:p});N('bandpass',1100,3,.14,.03*v,700,i*.24,p)}},
  wail:(T,N,v,p)=>{T('sine',600,960,1.1,.11*v,0,{vib:6,rate:5,pan:p});T('sine',960,780,1.2,.1*v,1.1,{vib:10,rate:6,pan:p});T('sine',1180,1050,.9,.04*v,1.2,{pan:p})},
  urrah:(T,N,v,p)=>{for(let i=0;i<2;i++){T('sawtooth',320,250,.38,.06*v,i*.5,{vib:30,rate:28,filt:900,q:2,pan:p});N('lowpass',600,1,.35,.04*v,300,i*.5,p)}},
  grunt:(T,N,v,p)=>{N('lowpass',260,1,.28,.06*v,160,0,p);T('sawtooth',110,90,.25,.03*v,0,{filt:300,pan:p})},
  croakB:(T,N,v,p)=>{T('sawtooth',230,150,.6,.08*v,0,{filt:700,q:2,vib:20,rate:24,pan:p});N('bandpass',500,1.5,.55,.05*v,260,0,p)},
  croakE:(T,N,v,p)=>{for(let i=0;i<2;i++){T('sawtooth',190,140,.32,.06*v,i*.42,{filt:600,q:2,vib:30,rate:30,pan:p})}},
  honk:(T,N,v,p)=>{for(let i=0;i<4;i++){T('sawtooth',420,340,.13,.06*v,i*.28,{filt:1000,q:3,pan:p})}},
  kut:(T,N,v,p)=>{for(let i=0;i<7;i++){T('square',2900-i*60,2700-i*60,.04,.035*v,i*.065,{filt:3400,q:2,pan:p})}},
  kip:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sine',4300,4000,.045,.07*v,i*.17+Math.random()*.04,{pan:p})},
  coo:(T,N,v,p)=>{T('sine',430,380,.28,.09*v,0,{vib:7,rate:9,pan:p});T('sine',380,300,.55,.09*v,.32,{vib:9,rate:9,pan:p});T('sine',400,340,.3,.07*v,.95,{pan:p})},
  rattle:(T,N,v,p)=>{for(let i=0;i<20;i++){N('bandpass',2600+Math.random()*400,4,.03,.06*v,0,i*.045,p);T('square',1800,1700,.025,.02*v,i*.045,{filt:2600,pan:p})}},
  yank:(T,N,v,p)=>{const n=3+Math.floor(Math.random()*3);for(let i=0;i<n;i++)T('square',640,610,.11,.04*v,i*.2,{filt:1300,q:4,pan:p})},
  teakettle:(T,N,v,p)=>{for(let r=0;r<3;r++){const d=r*.42;T('sine',3800,3000,.09,.08*v,d,{pan:p});T('sine',2600,2700,.08,.07*v,d+.12,{pan:p});T('sine',3300,2900,.11,.08*v,d+.24,{pan:p})}},
  mew:(T,N,v,p)=>{T('sine',1900,1300,.32,.07*v,0,{vib:12,rate:20,pan:p});for(let i=0;i<6;i++){const f=2000+Math.random()*2500;T(Math.random()<.5?'square':'sine',f,f*(.85+Math.random()*.3),.08,.035*v,.45+i*.15,{filt:5000,pan:p})}},
  chur:(T,N,v,p)=>{for(let r=0;r<2;r++){T('sine',1500,2200,.2,.06*v,r*.62,{pan:p});T('sine',2000,1800,.25,.05*v,r*.62+.24,{pan:p})}},
  carol:(T,N,v,p)=>{const n=4+Math.floor(Math.random()*3);for(let i=0;i<n;i++){const f=2300+Math.random()*900;T('sine',f,f*(Math.random()<.5?.82:1.15),.2,.07*v,i*.34,{vib:30,rate:40,pan:p})}},
  pipit:(T,N,v,p)=>{for(let i=0;i<3;i++){T('sine',5000,4600,.05,.05*v,i*.38,{pan:p});T('sine',4400,4300,.05,.05*v,i*.38+.09,{pan:p})}},
  snow:(T,N,v,p)=>{for(let i=0;i<8;i++){const f=2500+Math.random()*1300;T('sine',f,f*1.08,.1,.05*v,i*.12,{pan:p})}},
  trill:(T,N,v,p)=>{const f=3400+Math.random()*400,n=16+Math.floor(Math.random()*6);for(let i=0;i<n;i++)T('sine',f,f*.92,.04,.05*v,i*.058,{pan:p})},
  drink:(T,N,v,p)=>{T('sine',2600,2700,.16,.07*v,0,{pan:p});T('sine',1900,1800,.12,.06*v,.24,{pan:p});for(let i=0;i<9;i++)T('sine',3300,3100,.035,.05*v,.44+i*.045,{pan:p})},
  meadow:(T,N,v,p)=>{T('sine',3600,3200,.3,.07*v,0,{pan:p});T('sine',3000,2700,.25,.06*v,.38,{pan:p});T('sine',3400,3500,.22,.06*v,.75,{pan:p});T('sine',3300,2300,.45,.07*v,1.02,{pan:p})},
  conk:(T,N,v,p)=>{T('sine',1700,1800,.09,.06*v,0,{pan:p});T('sine',2300,2200,.09,.06*v,.15,{pan:p});T('sawtooth',3600,3300,.7,.045*v,.32,{vib:200,rate:55,filt:4200,q:2,pan:p})},
  sweet:(T,N,v,p)=>{const n=5+Math.floor(Math.random()*3);for(let i=0;i<n;i++)T('sine',3500,4300,.1,.07*v,i*.18,{pan:p})},
  buzztrill:(T,N,v,p)=>{for(let i=0;i<11;i++)T('sawtooth',4300+i*25,4250+i*25,.055,.035*v,i*.07,{filt:5000,q:2,vib:120,rate:70,pan:p})},
  hoarse:(T,N,v,p)=>{const n=4+Math.floor(Math.random()*2);for(let i=0;i<n;i++){const f=2500+Math.random()*700;T('sawtooth',f,f*(Math.random()<.5?.85:1.12),.2,.04*v,i*.28,{filt:3300,q:2,vib:90,rate:60,pan:p})}},
  cheer:(T,N,v,p)=>{const n=3+Math.floor(Math.random()*2);for(let i=0;i<n;i++)T('sine',3800,1900,.2,.08*v,i*.3,{pan:p});for(let i=0;i<4;i++)T('sine',2400,3200,.08,.06*v,n*.3+.15+i*.13,{pan:p})},
  warble:(T,N,v,p)=>{for(let i=0;i<10;i++){const f=3000+Math.random()*2000;T('sine',f,f*(.9+Math.random()*.2),.08,.05*v,i*.1,{pan:p})}}};
// ---- drawing ----
function gbS(G,pose){const S=G.shape;return pose==='perch'?S.tilt:pose==='swim'?(S.stilt??0):S.gtilt}
function gbGeom(G,pose,o={}){const S=G.shape,L=G.len,A=L*S.bl/2,B=L*S.bh/2,R=L*S.hr*(S.hrk??.92),tilt=gbS(G,pose),legH=pose==='swim'?0:L*S.legs;
  let cy=pose==='swim'?-B*.28:-(legH+B*.72);if(pose==='perch')cy+=B*.18;const cx=0,ca=Math.cos(tilt),sa=Math.sin(tilt);
  const loc=(u,v)=>[cx+u*ca+v*sa,cy-u*sa+v*ca];
  const neckBase=loc(A*.72,-B*.5);let Hc;
  if(S.neck){const na=S.neckAng??1.2,nk=S.neck*(pose==='swim'?.85:1);Hc=[neckBase[0]+Math.cos(na)*nk+R*.3,neckBase[1]-Math.sin(na)*nk]}
  else{const nl=S.nl??.34;Hc=loc(A*.78-R*.1,-B*.55-R*.38);Hc=[Hc[0]+Math.cos(1.0)*R*nl,Hc[1]-Math.sin(1.0)*R*nl]}
  const pk=o.peck||0;if(pk>0){const gy=pose==='swim'?R*.2:-R*1.1;Hc=[Hc[0]+A*.45*pk,lerp(Hc[1],gy,pk*(S.neck?.9:.7))]}
  const ba=(S.bill.ang??.1)+pk*.9,bb=[Hc[0]+R*.9*Math.cos(ba),Hc[1]+R*.9*Math.sin(ba)],btip=[bb[0]+S.bill.l*Math.cos(ba),bb[1]+S.bill.l*Math.sin(ba)];
  const t2=tilt-(S.tailUp||0)-(o.tailFlick||0)*.3,Lt=L*S.tl,rear=loc(-A*.95,-B*.08),tailTip=[rear[0]-Lt*Math.cos(t2),rear[1]+Lt*Math.sin(t2)];
  const hip=loc(-A*.02,B*.62);
  return{A,B,R,tilt,ca,sa,cx,cy,loc,neckBase,Hc,ba,bb,btip,t2,Lt,rear,tailTip,hip,legH,L}}
const GB_BODY={
  plump:[[.97,0],[.97,-1.02],[.12,-1.15],[-.55,-.78],[-.85,-.5],[-1.06,-.16],[-1.07,.06],[-.9,.48],[-.3,1.06],[.28,.98],[.72,.86],[.97,.5],[.97,0]],
  slim:[[.97,0],[.97,-.9],[.15,-1.0],[-.55,-.68],[-.88,-.42],[-1.1,-.12],[-1.12,.05],[-.92,.36],[-.3,.82],[.3,.84],[.74,.74],[.97,.42],[.97,0]],
  potbelly:[[.97,0],[.97,-1.0],[.2,-1.1],[-.5,-.78],[-.85,-.5],[-1.05,-.2],[-1.06,.04],[-.85,.42],[-.35,.98],[.35,1.16],[.86,1.06],[.98,.5],[.97,0]],
  round:[[.97,0],[.98,-1.08],[.1,-1.2],[-.6,-.92],[-.94,-.62],[-1.06,-.2],[-1.06,.1],[-.96,.62],[-.3,1.14],[.3,1.12],[.82,.96],[.98,.5],[.97,0]],
  boat:[[.97,0],[.97,-1.0],[.2,-1.1],[-.5,-.95],[-.92,-.88],[-1.12,-.52],[-1.14,-.1],[-1.02,.58],[-.4,.84],[.3,.84],[.86,.78],[.98,.4],[.97,0]],
  long:[[.97,0],[.98,-.86],[.25,-.96],[-.5,-.8],[-.92,-.6],[-1.14,-.26],[-1.14,0],[-1.02,.46],[-.3,.86],[.35,.86],[.8,.76],[.98,.4],[.97,0]]};
function gbBodyPath(g,S){const {A,B,loc}=g,P=new Path2D();const m=(u,v)=>loc(u*A,v*B);
  const pts=GB_BODY[(S&&S.body)||'plump']||GB_BODY.plump;
  const tp=S&&S.taper!=null?S.taper:.4,q=pts.map(p=>m(p[0],p[0]<0?p[1]*(1-tp*Math.pow(-p[0],1.6))-(p[1]<0?0:0):p[1]));P.moveTo(...q[0]);for(let i=1;i+2<q.length;i+=3)P.bezierCurveTo(...q[i],...q[i+1],...q[i+2]);P.closePath();return P}
function gbWingPath(g,G){const {A,B,loc}=g,ext=G.shape.wingExt*G.len,P=new Path2D();const s=loc(A*.62,-B*.6),tip=loc(-A*1.02-ext,B*.06);
  P.moveTo(...s);P.bezierCurveTo(...loc(A*.15,-B*.95),...loc(-A*.65,-B*.55),...tip);P.bezierCurveTo(...loc(-A*.55,B*.32),...loc(A*.1,B*.32),...loc(A*.48,B*.06));P.bezierCurveTo(...loc(A*.68,-B*.15),...loc(A*.72,-B*.45),...s);P.closePath();return{P,s,tip}}
function gbHeadPath(Hc,R,kind){const P=new Path2D();
  if(kind==='flat'){P.ellipse(Hc[0]-R*.06,Hc[1]+R*.06,R*1.14,R*.9,-.08,0,TAU)}
  else if(kind==='peak'){P.arc(Hc[0],Hc[1],R,0,TAU);P.moveTo(Hc[0]-R*.35+R*.62,Hc[1]-R*.7);P.ellipse(Hc[0]-R*.35,Hc[1]-R*.7,R*.62,R*.52,-.3,0,TAU)}
  else if(kind==='puffy'){P.ellipse(Hc[0]-R*.18,Hc[1]-R*.08,R*1.24,R*1.12,0,0,TAU)}
  else P.arc(Hc[0],Hc[1],R,0,TAU);return P}
// tail outline from the base (b, half-width w0) to the tip (t, half-width w1); n is the sideways unit vector
function gbTailPath(kind,b,t,n,w0,w1,k0){const P=new Path2D(),dx=t[0]-b[0],dy=t[1]-b[1];
  const at=(k,s)=>[b[0]+dx*k+n[0]*s,b[1]+dy*k+n[1]*s];
  if(k0){// a base hidden inside the body: smooth concave sides narrowing to the tail's own width
    const S=(k)=>k0+(1-k0)*k,side=s=>{P.quadraticCurveTo(...at(k0*.55,s*w1*1.15),...at(S(.12),s*w1))},end=s=>{P.lineTo(...at(S(.12),s*w1));P.quadraticCurveTo(...at(k0*.55,s*w1*1.15),...at(0,s*w0))};
    P.moveTo(...at(0,w0));side(1);
    if(kind==='point'){P.quadraticCurveTo(...at(S(.62),w1*1.05),...at(S(1.06),0));P.quadraticCurveTo(...at(S(.62),-w1*1.05),...at(S(.12),-w1))}
    else if(kind==='notch'){P.lineTo(...at(S(.9),w1*.86));P.quadraticCurveTo(...at(1,w1*.84),...at(1.01,w1*.66));P.lineTo(...at(S(.9),0));P.lineTo(...at(1.01,-w1*.66));P.quadraticCurveTo(...at(1,-w1*.84),...at(S(.9),-w1*.86))}
    else if(kind==='round'){P.lineTo(...at(S(.86),w1));P.quadraticCurveTo(...at(S(1.12),0),...at(S(.86),-w1))}
    else if(kind==='fork'){P.lineTo(...at(S(1.3),w1));P.lineTo(...at(S(.62),0));P.lineTo(...at(S(1.3),-w1))}
    else if(kind==='fan'){P.lineTo(...at(S(.8),w1*1.5));P.quadraticCurveTo(...at(S(1.1),0),...at(S(.8),-w1*1.5))}
    else{P.lineTo(...at(S(.88),w1*.82));P.quadraticCurveTo(...at(1.01,w1*.8),...at(1.02,w1*.45));P.lineTo(...at(1.02,-w1*.45));P.quadraticCurveTo(...at(1.01,-w1*.8),...at(S(.88),-w1*.82))}
    end(-1);P.closePath();return P}
  P.moveTo(...at(0,w0));
  if(kind==='point'){P.quadraticCurveTo(...at(.55,w1*1.05),...at(1.08,0));P.quadraticCurveTo(...at(.55,-w1*1.05),...at(0,-w0))}
  else if(kind==='notch'){P.lineTo(...at(1,w1));P.lineTo(...at(.86,0));P.lineTo(...at(1,-w1));P.lineTo(...at(0,-w0))}
  else if(kind==='round'){P.lineTo(...at(.86,w1));P.quadraticCurveTo(...at(1.14,0),...at(.86,-w1));P.lineTo(...at(0,-w0))}
  else if(kind==='fork'){P.lineTo(...at(1.3,w1));P.lineTo(...at(.6,0));P.lineTo(...at(1.3,-w1));P.lineTo(...at(0,-w0))}
  else if(kind==='fan'){P.lineTo(...at(.8,w1*1.5));P.quadraticCurveTo(...at(1.12,0),...at(.8,-w1*1.5));P.lineTo(...at(0,-w0))}
  else{P.lineTo(...at(1,w1));P.lineTo(...at(1,-w1));P.lineTo(...at(0,-w0))}
  P.closePath();return P}
function gbEll(x,y,rx,ry,rot,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),rot,0,TAU);ctx.fill()}
function drawGB(id,pose,o){const G=GB[id],S=G.shape,C=G.c,det=o.detail,g=gbGeom(G,pose,o),{A,B,R,loc,Hc,L}=g;
  if(G.draw&&G.drawOnly){G.draw(ctx,pose,o,g,G);return}
  const lw=Math.max(.12,L*.011)*(S.legW||1);
  if(pose==='swim'){ctx.save();ctx.beginPath();ctx.rect(-L*3,-L*3,L*6,L*3);ctx.clip()}
  if(o.stem){ctx.strokeStyle='#8a7a46';ctx.lineWidth=Math.max(.25,L*.016);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(L*.05,o.stem*.5,-L*.02,o.stem);ctx.stroke();
    gbEll(0,L*.12,L*.045,L*.12,0,'#6a4426');cline([[0,L*.24],[0,L*.34]],'#8a7a46',L*.01)}
  // tail
  {const {rear,tailTip,t2}=g,tw=L*S.tw,nx=Math.sin(t2),ny=Math.cos(t2);ctx.fillStyle=C.tail;
    const tb=loc(-A*.45,-B*.02),kk=Math.hypot(rear[0]-tb[0],rear[1]-tb[1])/Math.max(.01,Math.hypot(tailTip[0]-tb[0],tailTip[1]-tb[1]));const TP=gbTailPath(S.tail,tb,tailTip,[nx,ny],B*.4,tw*.33,kk);ctx.fill(TP);ctx.save();ctx.clip(TP);
    if(C.tailEdge&&(o.under||det)){ctx.strokeStyle=C.tailEdge;ctx.lineWidth=tw*.14;ctx.beginPath();ctx.moveTo(rear[0]+nx*tw*.28,rear[1]+ny*tw*.28);ctx.lineTo(tailTip[0]+nx*tw*.4,tailTip[1]+ny*tw*.4);ctx.stroke()}
    if(C.tailBand){ctx.strokeStyle=C.tailBand;ctx.lineWidth=g.Lt*.16;ctx.beginPath();const k=.88;ctx.moveTo(lerp(rear[0],tailTip[0],k)+nx*tw*.44,lerp(rear[1],tailTip[1],k)+ny*tw*.44);ctx.lineTo(lerp(rear[0],tailTip[0],k)-nx*tw*.42,lerp(rear[1],tailTip[1],k)-ny*tw*.42);ctx.stroke()}
    if(C.tailMid){ctx.strokeStyle=C.tailMid;ctx.lineWidth=tw*.3;ctx.beginPath();ctx.moveTo(...rear);ctx.lineTo(...tailTip);ctx.stroke()}
    ctx.restore();if(S.curl){ctx.strokeStyle=C.under||GBC.dark;ctx.lineWidth=L*.007;ctx.beginPath();ctx.arc(rear[0]-L*.02,rear[1]-L*.05,L*.025,PI*.2,PI*1.6);ctx.stroke()}}
  // legs and feet
  if(pose!=='swim'){const {hip,legH}=g,lc=C.leg;const run=o.run?Math.sin(o.ph||0):0;
    if(pose==='perch'){cline([[hip[0]+L*.01,hip[1]],[L*.02,0]],lc,lw*1.2);cline([[hip[0]-L*.03,hip[1]],[-L*.03,0]],lc,lw*1.1);
      for(const fx of[L*.02,-L*.03]){cline([[fx,0],[fx+L*.06,L*.008],[fx+L*.075,L*.03]],lc,lw*.7);cline([[fx,0],[fx-L*.04,L*.02]],lc,lw*.7)}}
    else{const wl=o.water?-Math.min(legH*.75,o.water):1e9;
      for(const [k,sh] of[[1,run],[-1,-run]]){const fx=sh*L*.06+(k>0?L*.015:-L*.02),kx=lerp(hip[0],fx,.5)+(S.legs>.15?-L*.02:L*.01),ky=lerp(hip[1],0,.5);
        const pts=[[hip[0]+k*L*.012,hip[1]],[kx,ky],[fx,0]];ctx.save();if(o.water){ctx.beginPath();ctx.rect(-L*3,-L*3,L*6,L*3+wl);ctx.clip()}
        cline(pts,lc,lw*(S.legs>.15?.9:1.1));cline([[fx,0],[fx+L*.07,0]],lc,lw*.7);cline([[fx,0],[fx-L*.035,-L*.004]],lc,lw*.6);ctx.restore()}
      if(C.thigh)cline([[g.hip[0],g.hip[1]],[lerp(g.hip[0],0,.25),lerp(g.hip[1],0,.25)]],C.thigh,lw*2.2)}}
  // body
  const body=gbBodyPath(g,S);ctx.fillStyle=C.belly;ctx.fill(body);ctx.save();ctx.clip(body);
  {ctx.fillStyle=C.back;ctx.beginPath();const a=loc(A*1.2,-B*.08),b=loc(-A*1.3,B*.3);ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(...loc(-A*1.3,-B*1.6));ctx.lineTo(...loc(A*1.2,-B*1.6));ctx.closePath();ctx.fill()}
  if(C.breast)gbEll(...loc(A*.62,B*.3),A*.62,B*.78,-g.tilt,C.breast);
  if(C.flank)gbEll(...loc(-A*.08,B*.42),A*.48,B*.42,-g.tilt,C.flank);
  if(C.rump)gbEll(...loc(-A*.9,B*.05),A*.28,B*.4,-g.tilt,C.rump);
  if(C.under)gbEll(...loc(-A*.95,B*.62),A*.32,B*.42,-g.tilt,C.under);
  if(C.band){const p=loc(A*.72,-B*.05);gbEll(p[0],p[1],A*.32,B*.42,-g.tilt,C.band)}
  if(C.checks&&det){ctx.fillStyle=C.checks;for(let i=0;i<14;i++){const u=-.7+(i%7)*.2,v=-.75+Math.floor(i/7)*.22,p=loc(A*u,B*v);ctx.fillRect(p[0]-L*.006,p[1]-L*.004,L*.012,L*.008)}}
  if(false){ctx.strokeStyle=C.necklace;ctx.lineWidth=B*.16;ctx.beginPath();const a=loc(A*.95,-B*.35),m=loc(A*.62,B*.12),b=loc(A*.32,-B*.48);ctx.moveTo(...a);ctx.lineTo(...m);ctx.lineTo(...b);ctx.stroke()}
  if(C.streaks&&det){ctx.fillStyle=C.streaks;const sp=C.spotty;for(let i=0;i<26;i++){const h1=((i*7919)%997)/997,h2=((i*104729)%991)/991,Z=C.streakZone==='throat'?[.6,1,-.55,.05]:C.streakZone==='flank'?[-.5,.45,.1,.82]:[-.1,.95,-.2,.75],u=Z[0]+h1*(Z[1]-Z[0]),v=Z[2]+h2*(Z[3]-Z[2]);if(u*u*.6+v*v>1.1)continue;const p=loc(A*u,B*v),sz=B*(sp?.075:.045)*(.7+h2*.6)*(C.streakZone==='throat'?.5:1);ctx.beginPath();ctx.ellipse(p[0],p[1],sz,sp?sz*.85:sz*3,-g.tilt+1.45,0,TAU);ctx.fill()}}
  if(C.harlequin){ctx.strokeStyle=C.harlequin;ctx.lineWidth=B*.14;ctx.beginPath();ctx.moveTo(...loc(A*.4,-B*.7));ctx.quadraticCurveTo(...loc(A*.1,-B*.2),...loc(-A*.4,-B*.55));ctx.stroke()}
  ctx.restore();
  // wing
  if(pose!=='swim'||id!=='colo'){const W=gbWingPath(g,G);ctx.fillStyle=C.wing;ctx.fill(W.P);ctx.save();ctx.clip(W.P);
    if(C.cov)gbEll(...loc(A*.32,-B*.28),A*.5,B*.45,-g.tilt,C.cov);
    if(C.prim){ctx.fillStyle=C.prim;ctx.beginPath();ctx.moveTo(...loc(-A*.35,-B*1.2));ctx.lineTo(...loc(-A*2,-B*1.2));ctx.lineTo(...loc(-A*2,B*1.2));ctx.lineTo(...loc(-A*.2,B*1.2));ctx.closePath();ctx.fill()}
    if(C.bars)C.bars.forEach((bc,i)=>{ctx.strokeStyle=bc;ctx.lineWidth=B*.11;ctx.beginPath();const u=.38-i*.2;ctx.moveTo(...loc(A*(u+.12),-B*.9));ctx.lineTo(...loc(A*(u-.12),B*.4));ctx.stroke()});
    if(C.barring&&det){ctx.strokeStyle=C.barring;ctx.lineWidth=B*.05;for(let i=0;i<6;i++){const u=.4-i*.22;ctx.beginPath();ctx.moveTo(...loc(A*(u+.1),-B*.8));ctx.lineTo(...loc(A*(u-.1),B*.3));ctx.stroke()}}
    if(C.speculum){const p=loc(-A*.1,B*.02);gbEll(p[0],p[1],A*.26,B*.13,-g.tilt,'#f6f5f0');gbEll(p[0],p[1],A*.22,B*.09,-g.tilt,C.speculum)}
    if(C.wpatch){const p=loc(-A*.25,B*.0);gbEll(p[0],p[1],A*.09,B*.1,-g.tilt,C.wpatch)}
    if(C.spots&&det){ctx.fillStyle=C.spots;for(let i=0;i<8;i++){const p=loc(A*(.3-i*.17),B*(-.4+(i%2)*.3));ctx.beginPath();ctx.arc(p[0],p[1],L*.006,0,TAU);ctx.fill()}}
    if(det){ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=L*.004;for(let i=0;i<4;i++){const u=-.15-i*.22;ctx.beginPath();ctx.moveTo(...loc(A*(u+.2),-B*.55));ctx.lineTo(...loc(A*(u-.25),B*.25));ctx.stroke()}}
    ctx.restore();
    if(C.epaulet){const p=loc(A*.42,-B*.38);gbEll(p[0],p[1],A*.24,B*.2,-g.tilt,C.epaulet);if(C.epauletEdge){const q=loc(A*.4,-B*.18);gbEll(q[0],q[1],A*.2,B*.06,-g.tilt,C.epauletEdge)}}}
  if(det)shadeBody(body,...loc(A*.3,-B*.3),Math.max(A,B)*1.1,.24);
  // neck
  if(S.neck){const nb=g.neckBase,hc=Hc,sN=S.neckAng>1.3,nk=Math.hypot(hc[0]-nb[0],hc[1]-nb[1]),mid=[lerp(nb[0],hc[0],.5)+(sN?-L*.05:L*.02),lerp(nb[1],hc[1],.5)];const nw=R*(sN?1.05:1.2)*(S.neckW||1);
    const c1=sN?[nb[0]+L*.02,nb[1]-nk*.45]:mid,c2=sN?[hc[0]-L*.09,hc[1]+nk*.35]:mid;
    ctx.strokeStyle=C.neck||C.throat;ctx.lineCap='round';ctx.lineWidth=nw*1.35;ctx.beginPath();ctx.moveTo(...nb);ctx.lineTo(lerp(nb[0],c1[0],.3),lerp(nb[1],c1[1],.3));ctx.stroke();ctx.lineWidth=nw;ctx.beginPath();ctx.moveTo(...nb);ctx.bezierCurveTo(...c1,...c2,...hc);ctx.stroke();
    if(C.neckFront){ctx.strokeStyle=C.neckFront;ctx.lineWidth=nw*.38;ctx.beginPath();ctx.moveTo(nb[0]+nw*.45,nb[1]);ctx.bezierCurveTo(c1[0]+nw*.4,c1[1],c2[0]+nw*.4,c2[1],hc[0]+nw*.3,hc[1]+R*.3);ctx.stroke()}
    if(C.necklace){ctx.strokeStyle=C.necklace;ctx.lineWidth=nw*.12;for(const k of[.42,.5,.58]){const p=[lerp(nb[0],hc[0],k)+(S.neckAng>1.3?-L*.03:L*.01),lerp(nb[1],hc[1],k)];ctx.beginPath();ctx.moveTo(p[0]-nw*.45,p[1]-nw*.1);ctx.lineTo(p[0]+nw*.2,p[1]+nw*.12);ctx.stroke()}}}
  // neck join: one continuous outline from back to nape and from throat to breast, like a drawn bird
  if(!S.neck||S.neck<=4){const bA=loc(A*.12,-B*1.0),bB=[Hc[0]-R*.95,Hc[1]+R*.12],fB=[Hc[0]+R*.18,Hc[1]+R*.96],fA=loc(A*.98,-B*.02),mid=loc(A*.45,-B*.35);
    const sh=loc(A*.5,-B*.42),ncx=lerp(Hc[0],sh[0],.5),ncy=lerp(Hc[1],sh[1],.5),nl=Math.hypot(Hc[0]-sh[0],Hc[1]-sh[1]),nan=Math.atan2(Hc[1]-sh[1],Hc[0]-sh[0]);
    const J=new Path2D();J.ellipse(ncx,ncy,nl*.5+R*.55,R*.86,nan,0,TAU);
    ctx.fillStyle=C.nape||C.back;ctx.fill(J);ctx.save();ctx.clip(J);
    // the front of the neck takes the throat/breast colour, split along a soft line from the head to the shoulder
    ctx.fillStyle=C.breast||C.belly;ctx.beginPath();ctx.moveTo(Hc[0]-R*.5,Hc[1]+R*.2);ctx.quadraticCurveTo(lerp(Hc[0],mid[0],.5)-R*.1,lerp(Hc[1],mid[1],.5)-R*.15,mid[0]-R*.3,mid[1]-R*.2);ctx.lineTo(fA[0]+R,fA[1]+R);ctx.lineTo(fB[0]+R,fB[1]+R*2);ctx.lineTo(Hc[0]+R*2,Hc[1]);ctx.closePath();ctx.fill();
    if(C.throat)gbEll(Hc[0]+R*.35,Hc[1]+R*.9,R*.75,R*.5,0,C.throat);
    if(C.collar&&!S.neck){ctx.strokeStyle=C.collar;ctx.lineWidth=R*.3;ctx.beginPath();ctx.moveTo(bB[0]+R*.1,bB[1]+R*.15);ctx.quadraticCurveTo(Hc[0]-R*.1,Hc[1]+R*.85,fB[0]+R*.2,fB[1]+R*.1);ctx.stroke()}
    if(C.necklace&&!S.neck){ctx.strokeStyle=C.necklace;ctx.lineWidth=R*.28;ctx.beginPath();ctx.moveTo(fB[0]+R*.1,fB[1]+R*.25);ctx.quadraticCurveTo(lerp(fB[0],fA[0],.5)-R*.3,lerp(fB[1],fA[1],.5)+R*.1,mid[0]+R*.2,mid[1]+R*.3);ctx.stroke()}
    ctx.restore()}
  // head
  const head=gbHeadPath(Hc,R,S.head);ctx.fillStyle=C.face||C.crown;ctx.fill(head);ctx.save();ctx.clip(head);
  if(C.nape)gbEll(Hc[0]-R*.75,Hc[1]+R*.2,R*.5,R*.9,0,C.nape);
  if(C.crown)gbEll(Hc[0]-R*.1,Hc[1]-R*(C.chin?.82:.62),R*1.15,R*.62,0,C.crown);if(C.chin)gbEll(Hc[0]+R*.1,Hc[1]+R*1.12,R*1.2,R*.42,0,C.chin);
  if(C.throat){const tk=C.throatK||1;gbEll(Hc[0]+R*.35+R*(1-tk)*.25,Hc[1]+R*.8+R*(1-tk)*.25,R*.8*tk,R*.55*tk,0,C.throat)}
  if(C.supercilium){ctx.strokeStyle=C.supercilium;ctx.lineWidth=R*.2;ctx.beginPath();ctx.moveTo(Hc[0]-R*.95,Hc[1]-R*.3);ctx.quadraticCurveTo(Hc[0]-R*.1,Hc[1]-R*.55,Hc[0]+R*.75,Hc[1]-R*.38);ctx.stroke()}
  if(C.eyeline){ctx.strokeStyle=C.eyeline;ctx.lineWidth=R*.2;ctx.beginPath();ctx.moveTo(Hc[0]-R*1.05,Hc[1]-R*.02);ctx.lineTo(Hc[0]+R*.95,Hc[1]-R*.1);ctx.stroke()}
  if(C.mask)gbEll(Hc[0]+R*.7,Hc[1]-R*.05,R*.45,R*.3,0,C.mask);
  if(C.billMask)gbEll(Hc[0]+R*.82,Hc[1]+R*.1,R*.52,R*.6,0,C.billMask);
  if(C.harlequin){ctx.strokeStyle=C.harlequin;ctx.lineWidth=R*.28;ctx.beginPath();ctx.moveTo(Hc[0]+R*.9,Hc[1]);ctx.lineTo(Hc[0]+R*.1,Hc[1]+R*.1);ctx.lineTo(Hc[0]-R*.2,Hc[1]+R*.9);ctx.stroke()}
  if(C.lore)gbEll(Hc[0]+R*.72,Hc[1]-R*.2,R*.2,R*.16,0,C.lore);
  if(det){const gr=ctx.createRadialGradient(Hc[0]-R*.3,Hc[1]-R*.5,R*.1,Hc[0],Hc[1],R*1.2);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(0,0,0,.12)');ctx.fillStyle=gr;ctx.fillRect(Hc[0]-R*1.2,Hc[1]-R*1.2,R*2.4,R*2.4)}
  ctx.restore();
  if(C.collar){ctx.strokeStyle=C.collar;ctx.lineWidth=R*(S.neck?.18:.28);ctx.beginPath();if(!S.neck||S.neck<=4){}else if(S.neck){const p=[lerp(g.neckBase[0],Hc[0],.3),lerp(g.neckBase[1],Hc[1],.3)],dx=Hc[0]-g.neckBase[0],dy=Hc[1]-g.neckBase[1],l=Math.hypot(dx,dy)||1,px=-dy/l,py=dx/l;ctx.moveTo(p[0]-px*R*.62,p[1]-py*R*.62);ctx.lineTo(p[0]+px*R*.62,p[1]+py*R*.62)}else{ctx.arc(Hc[0],Hc[1],R*1.02,PI*.45,PI*1.05)}ctx.stroke()}
  if(C.plume){ctx.strokeStyle=C.plume;ctx.lineCap='round';ctx.lineWidth=R*.26;ctx.beginPath();ctx.moveTo(Hc[0]+R*.45,Hc[1]-R*.42);ctx.quadraticCurveTo(Hc[0]-R*.6,Hc[1]-R*.7,Hc[0]-R*2.4,Hc[1]-R*.1);ctx.stroke()}
  if(S.crest){ctx.fillStyle=C.crest||C.crown;ctx.beginPath();if(S.crest==='point'){ctx.moveTo(Hc[0]+R*.3,Hc[1]-R*.85);ctx.lineTo(Hc[0]-R*1.2,Hc[1]-R*1.75);ctx.lineTo(Hc[0]-R*.75,Hc[1]-R*.4);ctx.closePath()}
    else if(S.crest==='swept'){const k=S.crestK||1,q=(u,v)=>[Hc[0]+R*(.3+(u-.3)*k),Hc[1]+R*(-.7+(v+.7)*k)];// scaled about the crown
      ctx.moveTo(...q(.55,-.82));ctx.quadraticCurveTo(...q(-.3,-1.25),...q(-1.1,-.88));ctx.quadraticCurveTo(...q(-1.6,-.45),...q(-1.7,.3));ctx.quadraticCurveTo(...q(-1.2,.02),...q(-.75,.05));ctx.quadraticCurveTo(...q(-.2,-.55),...q(.55,-.82))}
    else if(S.crest==='nape'){ctx.moveTo(Hc[0]+R*.75,Hc[1]-R*.45);ctx.quadraticCurveTo(Hc[0]+R*.2,Hc[1]-R*1.05,Hc[0]-R*.5,Hc[1]-R*.98);ctx.quadraticCurveTo(Hc[0]-R*1,Hc[1]-R*.95,Hc[0]-R*1.55,Hc[1]-R*.62);ctx.lineTo(Hc[0]-R*1.05,Hc[1]-R*.5);ctx.lineTo(Hc[0]-R*1.4,Hc[1]-R*.28);ctx.quadraticCurveTo(Hc[0]-R*.9,Hc[1]-R*.2,Hc[0]-R*.6,Hc[1]-R*.3);ctx.quadraticCurveTo(Hc[0]+R*.1,Hc[1]-R*.55,Hc[0]+R*.75,Hc[1]-R*.45);ctx.closePath()}
    else if(S.crest==='ragged'){ctx.moveTo(Hc[0]+R*.35,Hc[1]-R*.88);ctx.quadraticCurveTo(Hc[0]-R*.2,Hc[1]-R*1.35,Hc[0]-R*.55,Hc[1]-R*1.55);ctx.lineTo(Hc[0]-R*.6,Hc[1]-R*1.2);ctx.lineTo(Hc[0]-R*1.25,Hc[1]-R*1.42);ctx.quadraticCurveTo(Hc[0]-R*1.05,Hc[1]-R*.95,Hc[0]-R*1.15,Hc[1]-R*.55);ctx.quadraticCurveTo(Hc[0]-R*.75,Hc[1]-R*.3,Hc[0]-R*.6,Hc[1]-R*.6);ctx.closePath()}
    else{ctx.moveTo(Hc[0]+R*.2,Hc[1]-R*.9);ctx.quadraticCurveTo(Hc[0]-R*.4,Hc[1]-R*1.5,Hc[0]-R*.75,Hc[1]-R*1.25);ctx.quadraticCurveTo(Hc[0]-R*1.05,Hc[1]-R*1.3,Hc[0]-R*1.2,Hc[1]-R*.95);ctx.quadraticCurveTo(Hc[0]-R*1.55,Hc[1]-R*.85,Hc[0]-R*1.45,Hc[1]-R*.45);ctx.quadraticCurveTo(Hc[0]-R*1.2,Hc[1]-R*.1,Hc[0]-R*.8,Hc[1]+R*.1);ctx.closePath()}ctx.fill()}
  // eye
  {const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);if(C.eyering&&!C.eyeThin){ctx.strokeStyle=C.eyering;ctx.lineWidth=er*.42;ctx.beginPath();ctx.arc(ex,ey,er*1.3,0,TAU);ctx.stroke()}
    if(C.eyeThin){ctx.strokeStyle=C.eyering;ctx.lineWidth=er*.35;ctx.beginPath();ctx.arc(ex,ey,er*1.25,0,TAU);ctx.stroke();ctx.fillStyle='#3a3a3c';ctx.beginPath();ctx.moveTo(ex-er*1.1,ey-er*1.2);ctx.lineTo(ex+er*.2,ey-er*1.3);ctx.lineTo(ex-er*.3,ey-er*2.4);ctx.fill()}cdot(ex,ey,er,C.iris||GBC.eye);if(C.iris)cdot(ex,ey,er*.5,GBC.eye);cdot(ex+er*.3,ey-er*.35,er*.32,'rgba(255,255,255,.85)')}
  // bill
  {const {bb,btip,ba}=g,bt=S.bill.type,d=S.bill.d,l=S.bill.l,nx=-Math.sin(ba),ny=Math.cos(ba),up=[bb[0]-nx*d*.5,bb[1]-ny*d*.5],lo=[bb[0]+nx*d*.5,bb[1]+ny*d*.5];
    ctx.fillStyle=C.bill;ctx.beginPath();
    if(bt==='curve'){const c1=[lerp(bb[0],btip[0],.55),lerp(bb[1],btip[1],.55)-l*.12],tip=[btip[0]-l*.08,btip[1]+l*.18];ctx.moveTo(...up);ctx.quadraticCurveTo(c1[0],c1[1]-d*.3,...tip);ctx.quadraticCurveTo(c1[0],c1[1]+d*.4,...lo)}
    else if(bt==='flat'){ctx.moveTo(...up);ctx.lineTo(btip[0]-nx*d*.35,btip[1]-ny*d*.35);ctx.quadraticCurveTo(btip[0]+Math.cos(ba)*d*.4,btip[1]+Math.sin(ba)*d*.4,btip[0]+nx*d*.3,btip[1]+ny*d*.3);ctx.lineTo(...lo)}
    else if(bt==='pouch'){ctx.moveTo(...up);ctx.lineTo(btip[0]-nx*d*.2,btip[1]-ny*d*.2);ctx.lineTo(btip[0]+nx*d*.35,btip[1]+ny*d*.35);ctx.lineTo(...lo);ctx.fill();ctx.fillStyle=C.pouch;ctx.beginPath();ctx.moveTo(...lo);ctx.quadraticCurveTo(lerp(lo[0],btip[0],.5)+nx*d*1.6,lerp(lo[1],btip[1],.5)+ny*d*1.6,btip[0]+nx*d*.3,btip[1]+ny*d*.3);ctx.lineTo(btip[0]-nx*d*.05,btip[1]-ny*d*.05);ctx.lineTo(...lo)}
    else if(bt==='chisel'||bt==='blade'){const e=bt==='blade'?.4:.28;ctx.moveTo(...up);ctx.lineTo(btip[0]-nx*d*e,btip[1]-ny*d*e);ctx.lineTo(btip[0]+nx*d*e*.6,btip[1]+ny*d*e*.6);ctx.lineTo(...lo)}
    else if(bt==='hook'){const hk=[btip[0]+nx*d*.7,btip[1]+ny*d*.7];ctx.moveTo(...up);ctx.quadraticCurveTo(btip[0]-nx*d*.4,btip[1]-ny*d*.4,btip[0]+Math.cos(ba)*d*.2,btip[1]+Math.sin(ba)*d*.2);ctx.quadraticCurveTo(hk[0]+Math.cos(ba)*d*.1,hk[1],hk[0]-Math.cos(ba)*d*.3,hk[1]-Math.sin(ba)*d*.3);ctx.lineTo(...lo)}
    else if(bt==='skimmer'){const ut=[lerp(bb[0],btip[0],.72),lerp(bb[1],btip[1],.72)];ctx.moveTo(...up);ctx.lineTo(ut[0]-nx*d*.05,ut[1]-ny*d*.05);ctx.lineTo(bb[0]+nx*d*.05,bb[1]+ny*d*.05);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(bb[0]+nx*d*.1,bb[1]+ny*d*.1);ctx.lineTo(btip[0]+nx*d*.25,btip[1]+ny*d*.25);ctx.lineTo(...lo)}
    else if(bt==='spoon'){const sp=[lerp(bb[0],btip[0],.8),lerp(bb[1],btip[1],.8)];ctx.moveTo(...up);ctx.lineTo(sp[0]-nx*d*.25,sp[1]-ny*d*.25);ctx.quadraticCurveTo(btip[0]-nx*d*.9,btip[1]-ny*d*.9,btip[0],btip[1]);ctx.quadraticCurveTo(btip[0]+nx*d*.8,btip[1]+ny*d*.8,sp[0]+nx*d*.2,sp[1]+ny*d*.2);ctx.lineTo(...lo)}
    else if(bt==='puffin'){ctx.moveTo(bb[0]-nx*d*.72,bb[1]-ny*d*.72);ctx.quadraticCurveTo(lerp(bb[0],btip[0],.45)-nx*d*.78,lerp(bb[1],btip[1],.45)-ny*d*.78,btip[0]+nx*d*.08,btip[1]+ny*d*.08);ctx.quadraticCurveTo(lerp(bb[0],btip[0],.6)+nx*d*.42,lerp(bb[1],btip[1],.6)+ny*d*.42,bb[0]+nx*d*.66,bb[1]+ny*d*.66)}
    else if(bt==='blunt'){const sw=[lerp(bb[0],btip[0],.72),lerp(bb[1],btip[1],.72)];ctx.moveTo(...up);ctx.lineTo(sw[0]-nx*d*.3,sw[1]-ny*d*.3);ctx.quadraticCurveTo(btip[0]-nx*d*.42,btip[1]-ny*d*.42,btip[0],btip[1]);ctx.lineTo(...lo)}
    else{const w=bt==='cone'?1:bt==='wedge'?.85:bt==='needle'?.5:.7;ctx.moveTo(...up);ctx.quadraticCurveTo(lerp(up[0],btip[0],.5),lerp(up[1],btip[1],.5)-(bt==='cone'?d*.1:0),...btip);ctx.lineTo(lo[0]+(btip[0]-lo[0])*(1-w)*.2,lo[1]+(btip[1]-lo[1])*(1-w)*.2);ctx.lineTo(...lo)}
    ctx.closePath();ctx.fill();ctx.save();ctx.clip();
    if(bt==='puffin'){// deep triangular bill: blue-gray base plate, yellow ridge line, orange-red outer half with grooves
      const at=(k,s)=>[lerp(bb[0],btip[0],k)+nx*d*s,lerp(bb[1],btip[1],k)+ny*d*s];
      ctx.fillStyle=C.bill2||'#53698a';ctx.beginPath();ctx.moveTo(...at(-.1,-.7));ctx.lineTo(...at(.38,-.7));ctx.lineTo(...at(.3,.7));ctx.lineTo(...at(-.1,.7));ctx.fill();
      ctx.strokeStyle=C.bill3||'#f2c43a';ctx.lineWidth=d*.07;ctx.beginPath();ctx.moveTo(...at(.39,-.7));ctx.lineTo(...at(.31,.7));ctx.stroke();ctx.beginPath();ctx.moveTo(...at(.02,-.7));ctx.lineTo(...at(.02,.7));ctx.stroke();
      ctx.strokeStyle='rgba(120,30,10,.45)';ctx.lineWidth=d*.04;for(const k of[.55,.7]){ctx.beginPath();ctx.moveTo(...at(k,-.6));ctx.quadraticCurveTo(...at(k+.07,0),...at(k-.03,.45));ctx.stroke()}}
    else if(C.bill2){ctx.fillStyle=C.bill2;ctx.beginPath();ctx.moveTo(...bb);ctx.lineTo(...btip);ctx.lineTo(...lo);ctx.closePath();ctx.fill()}
    if(C.cere)gbEll(bb[0]+Math.cos(ba)*l*.15,bb[1]-d*.35,l*.14,d*.25,ba,C.cere);
    if(det){ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=Math.max(.05,d*.06);ctx.beginPath();ctx.moveTo(...bb);
      if(bt==='curve'){const c1=[lerp(bb[0],btip[0],.55),lerp(bb[1],btip[1],.55)-l*.12];ctx.quadraticCurveTo(c1[0],c1[1]+d*.05,btip[0]-l*.1,btip[1]+l*.15)}
      else if(bt==='puffin'||bt==='hook'||bt==='skimmer'||bt==='spoon')ctx.lineTo(lerp(bb[0],btip[0],.55)+nx*d*.12,lerp(bb[1],btip[1],.55)+ny*d*.12);
      else ctx.lineTo(lerp(bb[0],btip[0],.85),lerp(bb[1],btip[1],.85));ctx.stroke()}
    ctx.restore();if(bt==='puffin'&&C.gape)gbEll(bb[0]-Math.cos(ba)*d*.05,bb[1]+d*.42,d*.2,d*.14,ba,C.gape)}
  if(pose==='swim'){ctx.restore();if(o.water!==false){ctx.strokeStyle='rgba(240,250,252,.8)';ctx.lineWidth=Math.max(.2,L*.012);ctx.beginPath();ctx.ellipse(-A*.05,0,A*1.25,A*.18,0,0,TAU);ctx.stroke()}}
  if(o.water&&pose!=='swim'){ctx.strokeStyle='rgba(240,250,252,.8)';ctx.lineWidth=Math.max(.2,L*.012);const wl=-Math.min(g.legH*.75,o.water);ctx.beginPath();ctx.ellipse(0,wl,L*.12,L*.03,0,0,TAU);ctx.stroke()}
  if(G.draw)G.draw(ctx,pose,o,g,G)}
// flight, seen from above or below (same frame as drawFlightTop: forward = -y)
function gbFL(G){const S=G.shape;return{L:G.len,WS:G.ws,bw:G.len*Math.max(.14,S.bh*.55),hr:G.len*S.hr*.72,bill:S.bill.l,tl:G.len*S.tl*.9,tw:G.len*S.tw*1.1,chord:G.ws*(S.chord??.23),tip:S.tip??.82,round:S.round??.3}}
function drawGBFlight(id,o){const G=GB[id],C=G.c,Fc=G.f||{},F=FL[id],k=.3+.7*Math.abs(Math.cos(o.flap||0)),ven=!!o.ventral,det=o.detail,L=F.L,hy=-L*.36,ty=L*.18,S=G.shape;
  for(const side of[-1,1]){wingZone(F,0,1,0,1,k,ven?(Fc.under||'#e6e4dd'):(Fc.wing||C.wing),side);
    if(!ven){wingZone(F,0,.48,0,.5,k,Fc.cov||C.back,side);wingZone(F,.6,1,0,1,k,Fc.prim||C.prim||C.wing,side);if(Fc.bar)wingZone(F,.08,.82,.52,.66,k,Fc.bar,side);if(Fc.epaulet)wingZone(F,0,.3,0,.42,k,Fc.epaulet,side);
      if(Fc.dots&&det)for(let i=0;i<6;i++)wingZone(F,.1+i*.07,.12+i*.07,.15,.3,k,Fc.dots,side)}
    else if(Fc.prim&&!Fc.under)wingZone(F,.62,1,0,1,k,Fc.prim,side);
    if(Fc.tip)wingZone(F,.8,1,0,1,k,Fc.tip,side);
    if(det)for(let i=0;i<5;i++)wingZone(F,.7+i*.06,.712+i*.06,.55,1,k,'rgba(0,0,0,.18)',side)}
  // legs trailing (long-legged birds)
  if(S.legs>.15){cline([[-.6,ty],[-.8,ty+F.tl+L*.22]],C.leg,Math.max(.3,L*.012));cline([[.6,ty],[.8,ty+F.tl+L*.22]],C.leg,Math.max(.3,L*.012))}
  ctx.fillStyle=ven?(C.under||C.belly):C.tail;ctx.fill(gbTailPath(S.tail,[0,ty-1],[0,ty+F.tl],[1,0],F.tw*.32,F.tw/2));
  if(C.tailEdge){ctx.fillStyle=C.tailEdge;ctx.fillRect(-F.tw/2,ty,F.tw*.16,F.tl);ctx.fillRect(F.tw*.34,ty,F.tw*.16,F.tl)}
  if(C.tailBand){ctx.fillStyle=C.tailBand;ctx.fillRect(-F.tw/2,ty+F.tl*.8,F.tw,F.tl*.2)}
  ctx.fillStyle=ven?C.belly:C.back;ctx.beginPath();ctx.ellipse(0,0,F.bw/2,L*.33,0,0,TAU);ctx.fill();
  if(ven&&C.breast){ctx.fillStyle=C.breast;ctx.beginPath();ctx.ellipse(0,-L*.15,F.bw*.46,L*.14,0,0,TAU);ctx.fill()}
  if(!ven&&C.rump){ctx.fillStyle=C.rump;ctx.beginPath();ctx.ellipse(0,ty-.5,F.bw*.4,L*.07,0,0,TAU);ctx.fill()}
  const nk=S.neck&&S.neckAng<1.3?S.neck*.5:0;if(nk){ctx.strokeStyle=C.neck||C.throat;ctx.lineWidth=F.hr*1.3;ctx.beginPath();ctx.moveTo(0,hy+F.hr);ctx.lineTo(0,hy-nk);ctx.stroke()}
  const hy2=hy-nk;ctx.fillStyle=ven?(C.throat||C.face):(C.crown||C.face);ctx.beginPath();ctx.arc(0,hy2,F.hr,0,TAU);ctx.fill();
  ctx.fillStyle=C.bill;ctx.beginPath();ctx.moveTo(-F.hr*.35,hy2-F.hr*.7);ctx.lineTo(0,hy2-F.hr-F.bill);ctx.lineTo(F.hr*.35,hy2-F.hr*.7);ctx.fill();
  if(S.legs>.15&&det){}}
// ---- integration helpers ----
function gbKind(sp){return GB[sp]?GB[sp].kind:null}
function gbPose(b){const k=gbKind(b.sp);return b.st==='swim'?'swim':b.st==='perch'||b.st==='reed'?'perch':'stand'}
function gbMapScale(sp){const L=SPECIES[sp]?.len||13;return L<=30?1:(30+(L-30)*.42)/L}
function gbBinoEx(sp){const L=SPECIES[sp]?.len||13;return L>30?Math.pow(30/L,.6):1}
// where each kind can stand
const RB_EDGE=new Set(['saline','bay','potholes','lake','pond','marsh']);
function gbSpotOK(sp,x,y,loose){const G=GB[sp];if(!G)return false;if(x<700||x>WW-80||y<120||y>WH-120)return false;const t=terr(x,y),h=habitatAt(x,y);
  if(!loose&&G.bands&&!G.bands.includes(bandAt(y).id))return false;if(!loose&&G.isles&&!G.isles.includes(isleAt(x,y)))return false;const home=loose||G.homes.includes(h);
  switch(G.kind==='soar'?G.rest:G.kind){
    case'ground':if(!home)return false;if(REGB&&RB_EDGE.has(h)&&(waterKind(x,y)==='wade'||(t===T.LAKE&&wdist(x,y)<60)))return true;if(G.spot==='surf')return t===T.WET||(t===T.SAND&&wdist(x,y)<110);if(G.spot==='shore')return t===T.ROCK||t===T.WET||t===T.SAND;
      return isLand(t)&&!waterKind(x,y)&&t!==T.ICE&&!blockedAt(x,y,6);
    case'reed':return home&&(t===T.MARSH||t===T.SALT||t===T.BOG||t===T.FIELD||t===T.HEDGE||t===T.GRASS)&&!blockedAt(x,y,6);
    case'wade':return home&&(waterKind(x,y)==='wade'||t===T.MARSH||t===T.SALT||t===T.MUD||(REGB&&(t===T.MANGROVE||(t===T.LAKE&&RB_EDGE.has(h)&&wdist(x,y)<120))))&&t!==T.ICE;
    case'swim':return home&&(t===T.LAKE||t===T.SHAL||t===T.DEEP)&&t!==T.ICE&&wdist(x,y)>(G.id==='colo'?60:18);
    case'sea':return(t===T.DEEP||t===T.SHAL)&&(loose||h==='ocean'||h==='pelagic'||h==='bay'||h==='reef');
    default:return G.homes.includes(h)}}
function gbFindSpot(sp,x,y,rmin,rmax,tries=40){for(let i=0;i<tries;i++){const a=Math.random()*TAU,r=rmin+Math.random()*(rmax-rmin),px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(gbSpotOK(sp,px,py))return[px,py]}return null}
function gbRestZ(sp,st){return st==='reed'?1.1:0}
// bring a dormant bird to life when the player comes near
function gbActivate(b){const G=GB[b.sp],k=G.kind,h=b.home;
  if(k==='soar'&&Math.random()<(G.restP||0)&&soarRestInit(b))return true;
  if(k==='soar'){b.x=h.x;b.y=h.y;startSoar(b);b.z=b.soar.zt*(.8+Math.random()*.2);return true}
  if(k==='perch'){const ts=suitableTrees(b.sp,h.x,h.y,0,650,false).sort((a,c)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(c.x-h.x,c.y-h.y));if(!ts.length)return false;landOn(b,ts[0]);return true}
  const sp=gbSpotOK(b.sp,h.x,h.y)?[h.x,h.y]:gbFindSpot(b.sp,h.x,h.y,10,400,60);if(!sp)return false;b.x=sp[0];b.y=sp[1];
  if(k==='sea'){b.z=6+Math.random()*10;b.st='swim';if(G.id==='noga'||Math.random()<.5){b.st='fly';gbSeaLeg(b)}else b.z=0;return true}
  b.st=k==='swim'?'swim':k==='reed'?'reed':k==='wade'?'wade':'ground';b.z=gbRestZ(b.sp,b.st);b.goal=null;if(G.ledge&&inCity(b.x,b.y)&&Math.random()<.45)goLedge(b,true);return true}
function gbSeaLeg(b){const G=GB[b.sp],sp=gbFindSpot(b.sp,b.x,b.y,300,1100,30)||[b.x+(Math.random()-.5)*400,b.y+(Math.random()-.5)*400];
  const plunge=G.plunge&&Math.random()<.35,land=!G.plunge&&Math.random()<.3;const z=plunge||land?0:(G.id==='noga'?14+Math.random()*12:4+Math.random()*6);
  b.fly={ax:b.x,ay:b.y,az:b.z,bx:sp[0],by:sp[1],bz:z,t:0,dur:Math.max(1,Math.hypot(sp[0]-b.x,sp[1]-b.y)/G.flyspd),next:{st:plunge||land?'swim':'fly'},sea:true};b.st='fly';b.hd=Math.atan2(sp[1]-b.y,sp[0]-b.x)}
function gbFlush(b){const G=GB[b.sp],k=G.kind,L=listener();
  if(k==='soar'){if(!b.soar)startSoar(b);return}
  if(G.ledge&&inCity(b.x,b.y)&&Math.random()<.5&&goLedge(b))return;
  if(k==='swim'&&G.dive){b.under=6+Math.random()*5;const sp=gbFindSpot(b.sp,b.x,b.y,120,300,40);if(sp){b.x=sp[0];b.y=sp[1]}return}
  if(k==='sea'){if(b.st!=='fly')gbSeaLeg(b);return}
  const away=Math.atan2(b.y-L.y,b.x-L.x),far=k==='wade'||k==='swim'?[300,750]:k==='reed'?[60,220]:[180,450];let sp=null;
  for(let i=0;i<40&&!sp;i++){const a=away+(Math.random()-.5)*1.8,r=far[0]+Math.random()*(far[1]-far[0]),px=b.x+Math.cos(a)*r,py=b.y+Math.sin(a)*r;if(gbSpotOK(b.sp,px,py))sp=[px,py]}
  if(!sp)sp=gbFindSpot(b.sp,b.x,b.y,far[0],far[1]*1.6,40);if(!sp)return;const st=k==='swim'?'swim':k==='reed'?'reed':k==='wade'?'wade':'ground';
  flyTo(b,sp[0],sp[1],gbRestZ(b.sp,st),{st});b.home={x:sp[0],y:sp[1]};b.goal=null}
function gbUpdate(b,dt){const G=GB[b.sp];b.tm-=dt;
  if(b.under){b.under-=dt;if(b.under<=0)b.under=0;return}
  if(b.st==='ground'||b.st==='wade'||b.st==='swim'){const spd=b.st==='ground'?(G.walk||40):b.st==='wade'?10:8;
    if(b.goal){const dx=b.goal.x-b.x,dy=b.goal.y-b.y,l=Math.hypot(dx,dy);if(l<2){b.goal=null;b.tm=(b.st==='ground'?1:3)+Math.random()*(b.st==='wade'?6:3);if(Math.random()<.55)b.peck=1}
      else{const s=spd*dt;b.x+=dx/l*Math.min(s,l);b.y+=dy/l*Math.min(s,l);b.hd=Math.atan2(dy,dx);b.run=(b.run||0)+dt*(b.st==='ground'?(G.walk>80?30:18):6)}}
    else if(b.tm<=0&&G.still){b.tm=3+Math.random()*6;b.hd+=(Math.random()-.5)*1.2}
    else if(b.tm<=0){const r=b.st==='ground'?(G.spot==='surf'?90:70):b.st==='wade'?45:80;const sp=gbFindSpot(b.sp,b.x,b.y,15,r,10);if(sp){b.goal={x:sp[0],y:sp[1]}}else b.tm=1+Math.random()*2;
      if(b.st==='swim'&&G.dive&&Math.random()<.25){b.under=5+Math.random()*6;b.goal=null}
      if(b.st==='swim'&&G.kind==='sea'&&Math.random()<.4)gbSeaLeg(b)}
    b.z=0;b.bob=b.st==='swim'?Math.sin(S.t*1.6+b.x)*.04:0}
  else if(b.st==='reed'){b.bob=Math.sin(S.t*1.8+b.x)*.05;b.z=1.1;if(b.tm<=0){b.tm=4+Math.random()*7;if(Math.random()<.35){const sp=gbFindSpot(b.sp,b.x,b.y,25,110,12);if(sp){flyTo(b,sp[0],sp[1],1.1,{st:'reed'})}}}}}
function gbSongGap(sp){return gbSongGap0(sp)*condSing(sp)*(GB[sp]&&GB[sp].gapK||1)}
function gbSongGap0(sp){const k=gbKind(sp);return k==='sea'?40+Math.random()*40:k==='wade'?30+Math.random()*30:k==='swim'?18+Math.random()*20:7+Math.random()*9}

/* ===== 20 more birds (version 21), spread over the habitats that had the fewest ===== */
for(const a of BY.BIRDS[1])gb(...a);
// ---- their songs ----
Object.assign(GBSONG,{
  wheek:(T,N,v,p)=>{T('sawtooth',900,2300,.4,.06*v,0,{filt:2800,q:3,pan:p});T('sine',2300,2000,.15,.04*v,.4,{pan:p})},
  ahoo:(T,N,v,p)=>{T('sine',300,420,.25,.08*v,0,{vib:6,rate:6,pan:p});T('sine',420,330,.4,.07*v,.25,{pan:p})},
  skeow:(T,N,v,p)=>{T('sawtooth',1500,650,.24,.07*v,0,{filt:2600,q:2,pan:p});N('bandpass',1800,2,.2,.04*v,900,0,p)},
  cheep:(T,N,v,p)=>{for(let i=0;i<5;i++)T('sine',2500,3100,.12,.07*v,i*.22,{pan:p})},
  kildee:(T,N,v,p)=>{for(let r=0;r<3;r++){const d=r*.5;T('sine',3000,3600,.1,.07*v,d,{pan:p});T('sine',3600,2500,.2,.07*v,d+.12,{pan:p})}},
  wheep:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',2700,3400,.14,.08*v,i*.24,{pan:p})},
  peet:(T,N,v,p)=>{T('sine',3500,3800,.08,.07*v,0,{pan:p});T('sine',3800,3200,.1,.07*v,.12,{pan:p});for(let i=0;i<4;i++)T('sine',3600,3300,.06,.05*v,.4+i*.12,{pan:p})},
  pill:(T,N,v,p)=>{T('sine',1800,2300,.12,.08*v,0,{pan:p});T('sine',2100,2100,.1,.07*v,.16,{pan:p});T('sine',2500,1900,.32,.08*v,.32,{pan:p})},
  kideek:(T,N,v,p)=>{for(let i=0;i<3;i++){T('sine',4200,4900,.06,.06*v,i*.3,{pan:p});T('sine',4900,4100,.09,.06*v,i*.3+.08,{pan:p})}},
  hoot:(T,N,v,p)=>{for(let i=0;i<2;i++)T('sine',320,290,.5,.11*v,i*.65,{pan:p})},
  jeer:(T,N,v,p)=>{for(let i=0;i<2;i++)T('sawtooth',2700,1900,.3,.05*v,i*.42,{filt:3600,q:2,vib:60,rate:40,pan:p})},
  twitter:(T,N,v,p)=>{for(let i=0;i<14;i++){const f=3000+Math.random()*2200;T('sine',f,f*(.9+Math.random()*.2),.05,.045*v,i*.08,{pan:p})}for(let i=0;i<8;i++)N('bandpass',3200,4,.03,.04*v,0,1.2+i*.04,p)},
  rattlesong:(T,N,v,p)=>{T('sine',3000,3200,.1,.05*v,0,{pan:p});for(let i=0;i<18;i++)N('bandpass',3400+Math.random()*500,5,.03,.05*v,0,.2+i*.04,p)},
  doubles:(T,N,v,p)=>{for(let k=0;k<4;k++){const f=1800+Math.random()*2000,g=f*(Math.random()<.5?.8:1.25);for(let r=0;r<2;r++){const d=k*.9+r*.4;T('sine',f,g,.12,.06*v,d,{pan:p});T('sine',g,f,.12,.05*v,d+.15,{pan:p})}}},
  ehola:(T,N,v,p)=>{T('sine',1500,1500,.16,.07*v,0,{pan:p});T('sine',1900,1800,.22,.08*v,.2,{pan:p});T('sine',1300,1250,.22,.07*v,.46,{pan:p});for(let i=0;i<8;i++)T('sine',3000,2900,.03,.04*v,.75+i*.035,{pan:p})},
  chirp:(T,N,v,p)=>{const n=4+Math.floor(Math.random()*3);for(let i=0;i<n;i++)T('sine',3500,2700,.08,.06*v,i*.25,{pan:p})},
  tsit:(T,N,v,p)=>{for(let i=0;i<10;i++)T('sine',8000,7800,.03,.035*v*(.5+Math.sin(i/9*Math.PI)),i*.08,{pan:p})}});
// Snowy Owl: drawn by hand (the body-plan drawing can't make an upright owl with its head sunk into its shoulders)
GB.snowl.drawOnly=true;
GB.snowl.draw=function(c,pose,o,g,G){const L=G.len,C=G.c,det=o.detail;
  const E=(x,y,rx,ry,r,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,r||0,0,TAU);c.fill()};
  // short tail behind, under the wingtips
  c.fillStyle='#ece9e1';c.beginPath();c.moveTo(-L*.2,-L*.2);c.lineTo(-L*.36,-L*.06);c.lineTo(-L*.3,-L*.02);c.lineTo(-L*.12,-L*.14);c.fill();
  // body and head as one soft silhouette
  const P=new Path2D();P.moveTo(L*.02,-L*.02);P.bezierCurveTo(L*.28,-L*.04,L*.31,-L*.42,L*.24,-L*.62);P.bezierCurveTo(L*.3,-L*.72,L*.27,-L*.9,L*.1,-L*.94);
  P.bezierCurveTo(-L*.08,-L*.97,-L*.2,-L*.88,-L*.19,-L*.72);P.bezierCurveTo(-L*.28,-L*.55,-L*.3,-L*.2,-L*.16,-L*.06);P.bezierCurveTo(-L*.1,-L*.01,-L*.04,-L*.01,L*.02,-L*.02);P.closePath();
  c.fillStyle=C.belly;c.fill(P);c.save();c.clip(P);
  // folded wing with dark spots and faint bars
  const W=new Path2D();W.moveTo(-L*.05,-L*.62);W.bezierCurveTo(L*.12,-L*.55,L*.12,-L*.2,-L*.02,-L*.1);W.bezierCurveTo(-L*.18,-L*.06,-L*.32,-L*.2,-L*.3,-L*.4);W.bezierCurveTo(-L*.28,-L*.58,-L*.18,-L*.66,-L*.05,-L*.62);
  c.fillStyle=C.wing;c.fill(W);c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=L*.004;c.stroke(W);
  if(det){c.fillStyle=C.spots;for(let i=0;i<16;i++){const h1=((i*7919)%97)/97,h2=((i*104729)%89)/89,x=-L*.26+h1*L*.3,y=-L*.56+h2*L*.44;c.beginPath();c.ellipse(x,y,L*.008,L*.005,.3,0,TAU);c.fill()}
    c.strokeStyle=C.barring;c.lineWidth=L*.004;for(let i=0;i<5;i++){c.beginPath();c.moveTo(L*.06,-L*(.5-i*.08));c.quadraticCurveTo(L*.15,-L*(.48-i*.08),L*.22,-L*(.52-i*.08));c.stroke()}}
  // facial disc and the gentle shading of the head
  E(L*.1,-L*.78,L*.13,L*.12,0,C.face);
  if(det){const gr=c.createRadialGradient(-L*.05,-L*.85,L*.02,0,-L*.5,L*.5);gr.addColorStop(0,'rgba(255,255,255,.25)');gr.addColorStop(1,'rgba(0,0,0,.1)');c.fillStyle=gr;c.fill(P)}
  c.restore();
  // eye (yellow iris), a short hooked bill almost hidden in feathers
  E(L*.17,-L*.8,L*.036,L*.032,0,C.iris);E(L*.18,-L*.8,L*.019,L*.019,0,'#141416');E(L*.188,-L*.809,L*.007,L*.007,0,'rgba(255,255,255,.9)');
  c.fillStyle=C.bill;c.beginPath();c.moveTo(L*.235,-L*.77);c.quadraticCurveTo(L*.275,-L*.765,L*.268,-L*.725);c.lineTo(L*.245,-L*.735);c.closePath();c.fill();
  // thick, feathered feet with dark claws
  for(const fx of[-L*.03,L*.09]){E(fx,-L*.015,L*.055,L*.025,0,C.leg);c.fillStyle='#2a2826';for(const k of[0,1,2]){c.beginPath();c.arc(fx+L*(.03+k*.012),-L*.002,L*.006,0,TAU);c.fill()}}};
GB.snowl.boxPts=L=>[[-L*.37,0],[L*.3,0],[-L*.3,-L*.96],[L*.3,-L*.96]];
GB.snowl.pinPts=L=>({eye:[L*.17,-L*.8],crown:[L*.02,-L*.9],back:[L*.15,-L*.45],leg:[L*.09,-L*.02],wing:[-L*.15,-L*.35]});

/* ===== 25 more birds (version 22) ===== */
for(const a of BY.BIRDS[2])gb(...a);
Object.assign(GBSONG,{
  purr:(T,N,v,p)=>{T('sawtooth',180,150,.7,.05*v,0,{filt:500,q:2,vib:20,rate:22,pan:p})},
  seep:(T,N,v,p)=>{T('sine',5200,5600,.7,.05*v,0,{vib:40,rate:20,pan:p})},
  peep:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',3600,3400,.05,.03*v,i*.2,{pan:p})},
  owk:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sawtooth',380,300,.22,.07*v,i*.32,{filt:900,q:2,pan:p})},
  kronk:(T,N,v,p)=>{for(let i=0;i<2;i++)T('sawtooth',260,220,.35,.08*v,i*.55,{filt:700,q:3,vib:30,rate:30,pan:p})},
  tinkle:(T,N,v,p)=>{for(let i=0;i<10;i++){const f=3500+Math.random()*1500;T('sine',f,f*1.05,.07,.05*v,i*.09,{pan:p})}},
  goback:(T,N,v,p)=>{for(let i=0;i<3;i++){T('sawtooth',700,500,.12,.06*v,i*.4,{filt:1400,q:2,pan:p});T('sawtooth',600,420,.18,.06*v,i*.4+.15,{filt:1400,q:2,pan:p})}},
  jumble:(T,N,v,p)=>{for(let i=0;i<9;i++){const f=1800+Math.random()*4000;T(Math.random()<.3?'square':'sine',f,f*(.7+Math.random()*.6),.1,.04*v,i*.13,{filt:6000,pan:p})}},
  kak:(T,N,v,p)=>{for(let i=0;i<6;i++)T('sawtooth',1500,1300,.08,.06*v,i*.13,{filt:2500,q:2,pan:p})},
  mourn:(T,N,v,p)=>{T('sine',500,640,.3,.08*v,0,{pan:p});T('sine',640,480,.5,.09*v,.32,{pan:p});for(let i=0;i<3;i++)T('sine',470,450,.35,.07*v,1+i*.45,{pan:p})},
  feebee:(T,N,v,p)=>{T('sine',3900,3900,.35,.08*v,0,{pan:p});T('sine',3400,3350,.4,.07*v,.42,{pan:p})},
  yrwa:(T,N,v,p)=>{for(let i=0;i<9;i++)T('sine',4200-i*60,4000-i*60,.07,.05*v,i*.1,{pan:p})},
  whinny:(T,N,v,p)=>{T('sine',3200,3000,.05,.05*v,0,{pan:p});for(let i=0;i<10;i++)T('sine',2600-i*60,2500-i*60,.04,.045*v,.25+i*.055,{pan:p})},
  kwirr:(T,N,v,p)=>{T('sawtooth',1300,1500,.4,.06*v,0,{filt:2200,q:2,vib:60,rate:40,pan:p})},
  witchety:(T,N,v,p)=>{for(let r=0;r<3;r++){const d=r*.45;T('sine',2600,3200,.08,.07*v,d,{pan:p});T('sine',3200,2400,.1,.07*v,d+.1,{pan:p});T('sine',2800,2900,.09,.06*v,d+.22,{pan:p})}},
  buzzup:(T,N,v,p)=>{for(let i=0;i<6;i++)T('sawtooth',3600+i*350,3700+i*350,.14,.03*v,i*.17,{filt:7000,q:2,vib:150,rate:80,pan:p})},
  bubbly:(T,N,v,p)=>{for(let i=0;i<16;i++){const f=1500+Math.random()*3500;T('sine',f,f*(.7+Math.random()*.6),.06,.05*v,i*.07,{pan:p})}},
  killy:(T,N,v,p)=>{for(let i=0;i<6;i++)T('sine',3600,3200,.08,.06*v,i*.12,{pan:p})},
  cowcow:(T,N,v,p)=>{for(let i=0;i<5;i++)T('sine',700,560,.18,.07*v*(i<3?1:1.2),i*.28,{pan:p})},
  eaglechirp:(T,N,v,p)=>{for(let i=0;i<7;i++)T('sine',3000,2600,.07,.04*v,i*.11,{vib:80,rate:50,pan:p})},
  bark:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sawtooth',900,700,.1,.06*v,i*.3,{filt:1500,q:2,pan:p})},
  potato:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',3200,3600,.06,.06*v,i*.11,{pan:p})},
  peter:(T,N,v,p)=>{for(let i=0;i<4;i++){T('sine',2600,2700,.12,.08*v,i*.32,{pan:p});T('sine',2100,2000,.12,.07*v,i*.32+.14,{pan:p})}}});

/* ===== 25 more birds (version 27): soaring birds of the sky, plus gaps in the thinnest habitats ===== */
// kind 'soar': circles on a thermal (soarZ metres up, soarR map-units radius, soarT seconds), then rests (rest: perch | ground | wade | swim), restT seconds; ledge: may rest on city rooftops
for(const a of BY.BIRDS[3])gb(...a);
Object.assign(GBSONG,{
  hiss:(T,N,v,p)=>{N('highpass',3000,.5,.6,.025*v,2000,0,p)},
  keer:(T,N,v,p)=>{T('sawtooth',3400,2100,1.1,.05*v,0,{filt:3000,q:1.5,vib:40,rate:30,pan:p})},
  peetee:(T,N,v,p)=>{T('sine',3600,3800,.15,.06*v,0,{pan:p});T('sine',3800,3300,.7,.06*v,.17,{pan:p})},
  kear:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sawtooth',2600,2000,.35,.045*v,i*.42,{filt:2800,q:2,pan:p})},
  kek:(T,N,v,p)=>{for(let i=0;i<6;i++)T('sawtooth',1800,1600,.07,.04*v,i*.13,{filt:2400,q:3,pan:p})},
  garoo:(T,N,v,p)=>{for(let i=0;i<5;i++)T('sawtooth',900,820,.18,.05*v,i*.2,{filt:1400,q:2,vib:120,rate:35,pan:p})},
  haha:(T,N,v,p)=>{for(let i=0;i<6;i++)T('sawtooth',1500,1100,.16,.045*v,i*.2+(i>2?.1:0),{filt:2200,q:2,pan:p})},
  kittiwake:(T,N,v,p)=>{T('sawtooth',1600,2200,.15,.04*v,0,{filt:2500,q:2,pan:p});T('sawtooth',2200,1500,.25,.04*v,.18,{filt:2500,q:2,pan:p});T('sawtooth',1700,1300,.3,.04*v,.5,{filt:2500,q:2,pan:p})},
  sdee:(T,N,v,p)=>{T('sine',5200,5000,.08,.04*v,0,{pan:p});for(let i=0;i<2;i++)T('sawtooth',1500,1300,.25,.035*v,.15+i*.28,{filt:2200,q:1.5,vib:200,rate:60,pan:p})}});
// Peregrines now soar and rest on skyscraper ledges; pigeons use rooftops too
Object.assign(GB.pefa,{kind:'soar',rest:'perch',ledge:true,soarZ:[35,65],soarR:[260,560],soarT:[40,90],restT:[60,150],flapK:.35});
GB.ropi.ledge=true;
// SO3 how much of the day each soaring bird spends aloft: restP = chance it is resting when you arrive
for(const id of['lagu','rbgu','hegu'])Object.assign(GB[id],{restP:.8,soarT:[15,40],restT:[90,220],ledge:true,ledgeAny:true});
delete GB.lagu.spot;delete GB.hegu.spot;GB.lagu.homes.push('city');
for(const [id,p] of [['tuvu',.1],['bkvu',.15],['rtha',.5],['bwha',.5],['rsha',.6],['rlha',.5],['noha',.2],['pefa',.5],['awpe',.5],['wost',.5],['anhi',.6],['sacr',.6]])GB[id].restP=p;

/* ===== 25 more birds (version 29): night birds for dusk, backyard and park birds, water birds ===== */
for(const a of BY.BIRDS[4])gb(...a);
Object.assign(GBSONG,{
  whocooks:(T,N,v,p)=>{const n=[[420,.18,0],[440,.18,.24],[430,.18,.5],[460,.3,.78],[430,.18,1.4],[440,.18,1.64],[430,.18,1.9],[400,.55,2.16]];for(const [f,d,t] of n)T('sine',f,f*.92,d,.07*v,t,{pan:p})},
  peent:(T,N,v,p)=>{T('sawtooth',2600,2300,.18,.045*v,0,{filt:2800,q:6,pan:p})},
  hum:(T,N,v,p)=>{T('sawtooth',80,80,.7,.02*v,0,{filt:300,q:1,vib:6,rate:9,pan:p});for(let i=0;i<3;i++)T('sine',6200,6000,.04,.03*v,.8+i*.18,{pan:p})},
  wicka:(T,N,v,p)=>{for(let i=0;i<12;i++)T('sawtooth',1600,1450,.08,.04*v,i*.11,{filt:2200,q:2,pan:p})},
  phoebe:(T,N,v,p)=>{T('sawtooth',3400,4200,.18,.04*v,0,{filt:4000,q:2,pan:p});T('sawtooth',3800,3100,.25,.04*v,.22,{filt:3800,q:2,vib:300,rate:70,pan:p})},
  zeet:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sawtooth',4800,5600,.09,.035*v,i*.12,{filt:5200,q:2,pan:p})},
  vireo:(T,N,v,p)=>{const ph=[[2600,3200,.18],[3100,2500,.2]];const k=Math.random()<.5?0:1;T('sine',ph[k][0],ph[k][1],ph[k][2],.05*v,0,{pan:p});T('sine',ph[1-k][0]*1.05,ph[1-k][1]*1.05,ph[1-k][2],.05*v,.24,{pan:p})},
  sosp:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sine',2700,2700,.12,.05*v,i*.16,{pan:p});T('sawtooth',4200,4000,.4,.03*v,.55,{filt:4500,q:2,vib:600,rate:40,pan:p});for(let i=0;i<5;i++)T('sine',3000+Math.random()*1500,2600+Math.random()*1200,.07,.04*v,1+i*.09,{pan:p})},
  oriole:(T,N,v,p)=>{const n=[[1800,2200,.15],[2200,2000,.15],[1700,1700,.22],[2300,1900,.2],[1900,2100,.18]];let t=0;for(const [a,b,d] of n){T('sine',a,b,d,.06*v,t,{pan:p});t+=d+.06}},
  paired:(T,N,v,p)=>{let t=0;for(const f of[6200,5400,4800,5800]){for(let r=0;r<2;r++){T('sine',f,f*.9,.08,.04*v,t,{pan:p});t+=.11}t+=.06}},
  keearr:(T,N,v,p)=>{T('sawtooth',3200,2000,.45,.045*v,0,{filt:3200,q:2,pan:p})}});
/* hand-drawn owls (the body-plan owl tilts badly), one drawing tuned per species: ear tufts, facial disc, chest pattern */
function gbOwlDraw(K){return function(c,pose,o,g,G){const L=G.len,C=G.c,det=o.detail;
  const E=(x,y,rx,ry,r,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,r||0,0,TAU);c.fill()};
  const hsh=(i,k)=>{const x=Math.sin(i*12.9898+k*78.233)*43758.5453;return x-Math.floor(x)};
  c.fillStyle=C.tail;c.beginPath();c.moveTo(-L*.2,-L*.2);c.lineTo(-L*.35,-L*.06);c.lineTo(-L*.29,-L*.02);c.lineTo(-L*.12,-L*.13);c.fill();
  // ear tufts grow out of the corners of the head, two-tone
  if(K.tufts){const tl=L*K.tufts;for(const [bx,lean] of[[-L*.07,-.35],[L*.17,.15]]){const P2=new Path2D();P2.moveTo(bx-L*.045,-L*.86);P2.quadraticCurveTo(bx-L*.03+lean*tl*.3,-L*.88-tl*.55,bx+lean*tl*.9,-L*.87-tl);P2.quadraticCurveTo(bx+L*.03,-L*.9-tl*.35,bx+L*.05,-L*.85);P2.closePath();
    c.fillStyle=C.crest;c.fill(P2);c.save();c.clip(P2);c.strokeStyle=shadeC(C.crest,-.35);c.lineWidth=L*.008;c.beginPath();c.moveTo(bx,-L*.85);c.lineTo(bx+lean*tl*.85,-L*.87-tl);c.stroke();c.restore()}}
  const P=new Path2D();P.moveTo(L*.02,-L*.02);P.bezierCurveTo(L*.28,-L*.04,L*.31,-L*.42,L*.25,-L*.6);P.bezierCurveTo(L*.31,-L*.72,L*.28,-L*.92,L*.08,-L*.93);
  P.bezierCurveTo(-L*.1,-L*.95,-L*.21,-L*.86,-L*.19,-L*.7);P.bezierCurveTo(-L*.28,-L*.55,-L*.3,-L*.2,-L*.16,-L*.06);P.bezierCurveTo(-L*.1,-L*.01,-L*.04,-L*.01,L*.02,-L*.02);P.closePath();
  c.fillStyle=C.belly;c.fill(P);c.save();c.clip(P);
  // back and nape colour round the far side of the body, so the front reads as the chest
  E(-L*.16,-L*.5,L*.16,L*.36,.1,C.back);
  E(L*.12,-L*.55,L*.17,L*.11,0,C.breast);
  if(det){c.lineCap='round';
    // bars: short, wavy, broken pieces, finer lower down
    if(K.bars){c.strokeStyle=C.barring;for(let i=0;i<K.bars[1];i++){const y=-L*(K.bars[0]-i*(K.bars[2]||.045));c.lineWidth=L*(.006-i*.0002);
      for(let j=0;j<4;j++){const x0=-L*.04+j*L*.085+hsh(i,j)*L*.02,w=L*(.045+hsh(j,i)*.025);c.beginPath();c.moveTo(x0,y+L*.004);c.quadraticCurveTo(x0+w/2,y-L*.008,x0+w,y+L*.003);c.stroke()}}}
    // streaks: tapered drops of different lengths
    if(K.streaks){c.fillStyle=C.streaks;for(let i=0;i<7;i++){const x=L*(.005+i*.034+hsh(i,3)*.012),y0=-L*(K.streaks[0]-hsh(i,1)*.06),ln=L*K.streaks[1]*(.55+hsh(i,2)*.5),w=L*.007;
      c.beginPath();c.moveTo(x-w,y0);c.quadraticCurveTo(x,y0-w*2,x+w,y0);c.lineTo(x+w*.3,y0+ln);c.lineTo(x-w*.3,y0+ln);c.closePath();c.fill()}}}
  // folded wing, set back along the side, mottled
  const W=new Path2D();W.moveTo(-L*.08,-L*.62);W.bezierCurveTo(L*.06,-L*.55,L*.07,-L*.22,-L*.05,-L*.1);W.bezierCurveTo(-L*.19,-L*.06,-L*.32,-L*.2,-L*.3,-L*.4);W.bezierCurveTo(-L*.29,-L*.58,-L*.2,-L*.66,-L*.08,-L*.62);
  c.fillStyle=C.wing;c.fill(W);c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=L*.004;c.stroke(W);
  if(det){c.save();c.clip(W);c.fillStyle=C.checks;for(let i=0;i<26;i++){c.beginPath();c.ellipse(-L*.28+hsh(i,5)*L*.32,-L*.6+hsh(i,7)*L*.5,L*.011,L*.006,.4,0,TAU);c.fill()}
    c.strokeStyle=shadeC(C.wing,-.28);c.lineWidth=L*.005;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-L*(.27-i*.05),-L*.24);c.quadraticCurveTo(-L*(.24-i*.05),-L*.17,-L*(.21-i*.05),-L*.11);c.stroke()}c.restore()}
  // head: a soft crown, then a facial disc made of two rounded halves (one round each eye), no hard ring
  E(L*.05,-L*.82,L*.22,L*.12,0,C.crown);
  const D=new Path2D();D.ellipse(L*.055,-L*.765,L*.085,L*.1,-.15,0,TAU);D.ellipse(L*.165,-L*.765,L*.085,L*.1,.15,0,TAU);
  c.fillStyle=C.face;c.fill(D);
  if(det){c.save();c.clip(D);
    if(K.rings){c.strokeStyle=shadeC(C.face,-.14);c.lineWidth=L*.004;for(const r of[.045,.065]){for(const ex of[.055,.165]){c.beginPath();c.arc(L*ex,-L*.785,L*r,.2*Math.PI,.95*Math.PI);c.stroke()}}}
    c.restore();
    // a thin dark rim only on the outer edges of the disc
    if(K.rim){c.strokeStyle=C.eyering;c.globalAlpha=.75;c.lineWidth=L*.007;c.beginPath();c.ellipse(L*.055,-L*.765,L*.085,L*.1,-.15,.55*Math.PI,1.35*Math.PI);c.stroke();c.beginPath();c.ellipse(L*.165,-L*.765,L*.085,L*.1,.15,-.35*Math.PI,.45*Math.PI);c.stroke();c.globalAlpha=1}
    // pale brows meeting over the bill
    c.strokeStyle=shadeC(C.face,.35);c.lineWidth=L*.011;c.beginPath();c.moveTo(L*.02,-L*.835);c.quadraticCurveTo(L*.08,-L*.85,L*.11,-L*.8);c.quadraticCurveTo(L*.14,-L*.85,L*.2,-L*.835);c.stroke()}
  if(K.throat){const T=new Path2D();T.ellipse(L*.11,-L*.655,L*.07,L*.022,0,0,TAU);c.fillStyle=C.throat;c.fill(T)}
  if(det){const gr=c.createRadialGradient(-L*.05,-L*.85,L*.02,0,-L*.5,L*.5);gr.addColorStop(0,'rgba(255,255,255,.16)');gr.addColorStop(1,'rgba(0,0,0,.12)');c.fillStyle=gr;c.fill(P)}
  c.restore();
  // two eyes looking forward, the far one a touch smaller, and a hooked bill between them
  const eye=(x,y,r)=>{E(x,y,r*1.12,r*1.12,0,shadeC(C.face,-.45));E(x,y,r,r,0,C.iris);E(x+r*.08,y,r*(K.dark?.92:.52),r*(K.dark?.92:.52),0,'#141416');E(x+r*.32,y-r*.32,r*.2,r*.2,0,'rgba(255,255,255,.9)')};
  eye(L*.055,-L*.785,L*.025);eye(L*.165,-L*.785,L*.028);
  c.fillStyle=C.bill;c.beginPath();c.moveTo(L*.096,-L*.775);c.quadraticCurveTo(L*.13,-L*.765,L*.122,-L*.722);c.lineTo(L*.104,-L*.735);c.closePath();c.fill();
  for(const fx of[-L*.03,L*.09]){E(fx,-L*.015,L*.05,L*.024,0,C.leg);c.fillStyle='#2a2826';for(const k of[0,1,2]){c.beginPath();c.arc(fx+L*(.03+k*.012),-L*.002,L*.006,0,TAU);c.fill()}}}}
function shadeC(h,k){const n=parseInt(h.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)));return'#'+[n>>16,n>>8&255,n&255].map(v=>f(v).toString(16).padStart(2,'0')).join('')}
GB.ghow.draw=gbOwlDraw({tufts:.15,bars:[.5,10,.044],throat:true,rim:true});
GB.baow.draw=gbOwlDraw({bars:[.63,4,.03],streaks:[.47,.2],dark:true,rings:true});
GB.easo.draw=gbOwlDraw({tufts:.09,bars:[.5,7,.05],streaks:[.53,.15],rim:true});
for(const id of['ghow','baow','easo']){GB[id].drawOnly=true;GB[id].boxPts=L=>[[-L*.37,0],[L*.3,0],[-L*.3,-L*1.0],[L*.3,-L*1.0]];
  GB[id].pinPts=L=>({eye:[L*.17,-L*.79],crest:[L*.18,-L*.95],face:[L*.11,-L*.72],crown:[L*.04,-L*.9],throat:[L*.13,-L*.63],breast:[L*.2,-L*.52],belly:[L*.18,-L*.3],streaks:[L*.18,-L*.3],bill:[L*.12,-L*.73],back:[-L*.1,-L*.5],wing:[-L*.15,-L*.35],leg:[L*.09,-L*.02]})}

/* version 29.2 detail hooks: small marks the body plan can't place well (drawn last, in the bird's own frame) */
function gbFineStreaks(col,n,lw,zone){return function(c,pose,o,g,G){if(!o.detail)return;const {A,B,loc}=g;c.save();c.strokeStyle=col;c.lineCap='round';c.lineWidth=B*lw;const Z=zone||[.3,.9,-.05,.6];
  for(let i=0;i<n;i++){const h1=((i*7919)%997)/997,h2=((i*104729)%991)/991,u=Z[0]+h1*(Z[1]-Z[0]),v=Z[2]+h2*(Z[3]-Z[2]);if(u*u*.7+v*v>.85)continue;const p=loc(A*u,B*v),q=loc(A*(u-.12),B*(v+.16));c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()}}
GB.lesa.draw=gbFineStreaks('rgba(106,78,52,.75)',24,.035);
GB.yewa.draw=gbFineStreaks('rgba(196,74,40,.8)',16,.04,[.35,.9,0,.55]);
GB.bcnh.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#f6f6f3';c.lineCap='round';c.lineWidth=R*.12;for(const k of[0,1]){c.beginPath();c.moveTo(Hc[0]-R*.6,Hc[1]-R*.45+k*R*.14);c.quadraticCurveTo(Hc[0]-R*1.7,Hc[1]-R*(.2-k*.1),Hc[0]-R*(2.3-k*.3),Hc[1]+R*(1.5+k*.2));c.stroke()}c.restore()};
GB.amwo.draw=function(c,pose,o,g){if(!o.detail)return;const {Hc,R}=g;c.save();c.fillStyle='#2e2218';for(let k=0;k<3;k++){c.beginPath();c.ellipse(Hc[0]-R*(.1+k*.3),Hc[1]-R*(.6-k*.1),R*.1,R*.24,.5+k*.25,0,TAU);c.fill()}c.restore()};
GB.nofl.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();
  c.fillStyle='#d8232a';c.beginPath();c.ellipse(Hc[0]-R*.82,Hc[1]-R*.05,R*.22,R*.36,.3,0,TAU);c.fill();
  c.strokeStyle='#1a1a1a';c.lineCap='round';c.lineWidth=R*.2;c.beginPath();c.moveTo(Hc[0]+R*.55,Hc[1]+R*.42);c.lineTo(Hc[0]+R*.05,Hc[1]+R*.62);c.stroke();
  c.fillStyle='#1a1a1a';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]+R*1.45,R*.75,R*.32,-.35,0,TAU);c.fill();
  if(o.detail)for(let i=0;i<22;i++){const h1=((i*7919)%997)/997,h2=((i*104729)%991)/991,u=-.3+h1*.95,v=.15+h2*.7;if(u*u*.7+v*v>.8)continue;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*.045,0,TAU);c.fill()}c.restore()};
GB.cedw.draw=function(c,pose,o,g){const {Hc,R,ba}=g;c.save();c.translate(Hc[0],Hc[1]-R*.15);c.rotate(ba*.5);
  c.fillStyle='#f6f6f3';c.beginPath();c.moveTo(R*.95,-R*.02);c.quadraticCurveTo(R*.1,-R*.38,-R*.85,-R*.12);c.lineTo(-R*.8,R*.16);c.quadraticCurveTo(R*.1,R*.12,R*.95,R*.22);c.closePath();c.fill();
  c.fillStyle='#141414';c.beginPath();c.moveTo(R*.95,R*.02);c.quadraticCurveTo(R*.1,-R*.3,-R*.78,-R*.06);c.lineTo(-R*.74,R*.1);c.quadraticCurveTo(R*.1,R*.06,R*.95,R*.18);c.closePath();c.fill();c.restore();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(ex+er*.3,ey-er*.35,er*.32,0,TAU);c.fill()};
GB.home.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.moveTo(Hc[0]-R*.05,Hc[1]-R*.2);c.quadraticCurveTo(Hc[0]-R*.2,Hc[1]-R*.95,Hc[0]-R*1.15,Hc[1]-R*.85);c.quadraticCurveTo(Hc[0]-R*1.1,Hc[1]-R*.25,Hc[0]-R*.05,Hc[1]-R*.2);c.fill();c.restore()};

/* ===== 25 more birds (version 30): city birds, mangrove keys, offshore, arctic and highlands, dusk ===== */
for(const a of BY.BIRDS[5])gb(...a);
/* detail hooks */
GB.dunl.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;const p=loc(A*.12,B*.52);c.save();c.fillStyle='#141414';c.beginPath();c.ellipse(p[0],p[1],A*.22,B*.17,-tilt,0,TAU);c.fill();c.restore();gbFineStreaks('rgba(70,56,44,.6)',18,.03,[.45,.95,-.05,.35])(c,pose,o,g)};
GB.susc.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]+R*.25,Hc[1]-R*.75,R*.32,R*.18,-.3,0,TAU);c.fill();c.restore()};
GB.razo.draw=function(c,pose,o,g){const {Hc,R,bb,btip}=g;c.save();c.strokeStyle='#f6f6f3';c.lineCap='round';c.lineWidth=R*.07;c.beginPath();c.moveTo(Hc[0]+R*.48,Hc[1]-R*.3);c.lineTo(bb[0],bb[1]-R*.3);c.stroke();
  const mx=bb[0]+(btip[0]-bb[0])*.55,my=bb[1]+(btip[1]-bb[1])*.55;c.lineWidth=R*.08;c.beginPath();c.moveTo(mx,my-R*.2);c.lineTo(mx+R*.04,my+R*.16);c.stroke();c.restore()};
GB.rcki.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#e2283a';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]-R*.82,R*.32,R*.14,-.1,0,TAU);c.fill();c.restore()};
GB.dick.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#141414';c.beginPath();c.moveTo(Hc[0]+R*.05,Hc[1]+R*.95);c.lineTo(Hc[0]+R*.55,Hc[1]+R*.95);c.lineTo(Hc[0]+R*.25,Hc[1]+R*1.45);c.closePath();c.fill();c.restore()};
GB.witu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#c8202a';c.beginPath();c.ellipse(Hc[0]+R*.9,Hc[1]+R*.55,R*.2,R*.75,.15,0,TAU);c.fill();c.restore()};
GB.wcpi.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#3a7a6a';for(let k=0;k<5;k++){c.beginPath();c.ellipse(Hc[0]-R*(.55+(k%2)*.2),Hc[1]+R*(.35+k*.2),R*.14,R*.08,.4,0,TAU);c.fill()}c.restore()};
Object.assign(GBSONG,{
  snowhonk:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sawtooth',720,600,.14,.05*v,i*.24+Math.random()*.06,{filt:1600,q:3,pan:p})},
  puhk:(T,N,v,p)=>{for(let i=0;i<3;i++)T('square',420,360,.07,.04*v,i*.18,{filt:900,q:4,pan:p})},
  gobble:(T,N,v,p)=>{for(let i=0;i<12;i++)T('sawtooth',380+((i%3)*60),320,.06,.05*v,i*.065,{filt:1200,q:5,pan:p})},
  croak:(T,N,v,p)=>{for(let i=0;i<8;i++)T('sawtooth',260,220,.05,.045*v,i*.07,{filt:700,q:4,pan:p})},
  wwcoo:(T,N,v,p)=>{const n=[[520,.16,0],[560,.2,.22],[520,.16,.5],[480,.4,.74]];for(const [f,d,t] of n)T('sine',f,f*.94,d,.06*v,t,{pan:p})},
  royal:(T,N,v,p)=>{T('sawtooth',2600,2200,.12,.04*v,0,{filt:3000,q:3,pan:p});T('sawtooth',2900,2300,.28,.04*v,.14,{filt:3000,q:3,vib:120,rate:30,pan:p})},
  pitirre:(T,N,v,p)=>{T('sawtooth',3000,3400,.1,.035*v,0,{filt:3600,q:2,pan:p});T('sawtooth',3600,2800,.2,.035*v,.13,{filt:3600,q:2,vib:250,rate:50,pan:p});T('sawtooth',3200,3000,.1,.03*v,.36,{filt:3400,q:2,pan:p})},
  whisper:(T,N,v,p)=>{T('sine',1800,2400,.2,.04*v,0,{pan:p});T('sine',2300,1600,.35,.04*v,.26,{pan:p})},
  caw:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sawtooth',620,480,.26,.06*v,i*.42,{filt:1400,q:4,vib:40,rate:25,pan:p})},
  squeak:(T,N,v,p)=>{T('sawtooth',1800,3800,.12,.035*v,0,{filt:4000,q:6,pan:p});T('square',900,700,.06,.03*v,.2,{filt:1500,q:3,pan:p})},
  squawk:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sawtooth',1500+Math.random()*500,1200,.12,.05*v,i*.17,{filt:2600,q:4,pan:p})},
  kinglet:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',7000,7200,.05,.03*v,i*.08,{pan:p});for(let i=0;i<5;i++)T('sine',3600,4200,.09,.04*v,.45+i*.12,{pan:p});T('sine',4400,3400,.2,.04*v,1.1,{pan:p})},
  redstart:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',7200,6800,.08,.035*v,i*.13,{pan:p});T('sine',7600,5600,.18,.04*v,.56,{pan:p})},
  dickcissel:(T,N,v,p)=>{T('sawtooth',3800,3600,.08,.035*v,0,{filt:4200,q:2,pan:p});T('sawtooth',3800,3600,.08,.035*v,.12,{filt:4200,q:2,pan:p});for(let i=0;i<3;i++)T('sawtooth',5200,4800,.07,.03*v,.32+i*.1,{filt:5600,q:2,vib:400,rate:60,pan:p})}});
GB.susc.draw0=GB.susc.draw;GB.susc.draw=function(c,pose,o,g){GB.susc.draw0(c,pose,o,g);const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]-R*.62,Hc[1]-R*.42,R*.2,R*.32,.5,0,TAU);c.fill();c.restore()};
GB.wwdo.draw=function(c,pose,o,g){const {A,B,loc}=g;const a=loc(A*.22,B*.04),b=loc(-A*.42,-B*.06);c.save();c.strokeStyle='#f6f6f3';c.lineCap='round';c.lineWidth=B*.09;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.restore()};
GB.rhwo.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;const p=loc(-A*.25,-B*.05);c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(p[0],p[1],A*.36,B*.3,-tilt,0,TAU);c.fill();c.restore()};
/* version 30.1 clean-up hooks */
GB.sngo.draw=function(c,pose,o,g){const {bb,btip,R}=g;c.save();c.strokeStyle='#2a2626';c.lineCap='round';c.lineWidth=R*.14;c.beginPath();c.moveTo(bb[0]+R*.05,bb[1]+R*.05);c.quadraticCurveTo((bb[0]+btip[0])/2,bb[1]+R*.22,btip[0]-R*.25,btip[1]+R*.02);c.stroke();c.restore()};
GB.amco.draw=function(c,pose,o,g){const {Hc}=g,R=g.R*1.7;c.save();const x0=Hc[0]+g.R*.75;
  c.fillStyle='#f4f2ea';c.beginPath();c.moveTo(x0,Hc[1]-R*.38);c.quadraticCurveTo(x0+R*.7,Hc[1]-R*.2,x0+R*1.15,Hc[1]+R*.12);c.quadraticCurveTo(x0+R*.6,Hc[1]+R*.32,x0,Hc[1]+R*.36);c.closePath();c.fill();
  c.strokeStyle='#7a2a2a';c.lineWidth=R*.08;c.beginPath();c.moveTo(x0+R*.78,Hc[1]-R*.1);c.lineTo(x0+R*.72,Hc[1]+R*.26);c.stroke();
  c.fillStyle='#7a2030';c.beginPath();c.ellipse(x0+R*.08,Hc[1]-R*.3,R*.1,R*.16,-.2,0,TAU);c.fill();c.restore()};
GB.susc.draw1=GB.susc.draw;GB.susc.draw=function(c,pose,o,g){GB.susc.draw1(c,pose,o,g);const {Hc,R}=g;c.save();const x0=Hc[0]+R*.7;
  c.fillStyle='#ee8a2a';c.beginPath();c.moveTo(x0,Hc[1]-R*.55);c.quadraticCurveTo(x0+R*.9,Hc[1]-R*.5,x0+R*1.55,Hc[1]+R*.12);c.lineTo(x0+R*1.45,Hc[1]+R*.3);c.quadraticCurveTo(x0+R*.6,Hc[1]+R*.42,x0,Hc[1]+R*.4);c.closePath();c.fill();
  c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(x0+R*.38,Hc[1]+R*.02,R*.3,R*.26,0,0,TAU);c.fill();c.fillStyle='#141414';c.beginPath();c.arc(x0+R*.4,Hc[1]+R*.04,R*.15,0,TAU);c.fill();
  c.fillStyle='#d8302a';c.beginPath();c.ellipse(x0+R*1.3,Hc[1]+R*.18,R*.16,R*.08,.5,0,TAU);c.fill();c.restore()};
GB.witu.draw0=GB.witu.draw;GB.witu.draw=function(c,pose,o,g){GB.witu.draw0(c,pose,o,g);const {A,B,loc,tilt}=g;const p=loc(A*.72,B*.15);c.save();c.strokeStyle='#141210';c.lineCap='round';c.lineWidth=B*.07;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]+B*.06,p[1]+B*.55);c.stroke();c.restore()};
GB.grki.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='rgba(42,46,52,.8)';c.beginPath();c.ellipse(Hc[0]+R*.25,Hc[1]-R*.12,R*.55,R*.15,.05,0,TAU);c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(ex+er*.3,ey-er*.35,er*.32,0,TAU);c.fill();c.restore()};
GB.caja.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.beginPath();c.arc(Hc[0],Hc[1],R*1.01,0,TAU);c.clip();c.fillStyle='#3a3c40';c.beginPath();c.ellipse(Hc[0]-R*.55,Hc[1]-R*.35,R*.85,R*.7,-.2,0,TAU);c.fill();c.restore()};
GB.rcki.draw0=GB.rcki.draw;GB.rcki.draw=function(c,pose,o,g){GB.rcki.draw0(c,pose,o,g);const {A,B,loc}=g;const a=loc(A*.12,-B*.18),b=loc(-A*.22,-B*.02);c.save();c.lineCap='round';c.strokeStyle='#f2f2ea';c.lineWidth=B*.1;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();
  const a2=loc(A*.0,-B*.05),b2=loc(-A*.3,B*.08);c.strokeStyle='#22281a';c.lineWidth=B*.09;c.beginPath();c.moveTo(a2[0],a2[1]);c.lineTo(b2[0],b2[1]);c.stroke();c.restore()};

/* ===== 25 more birds (version 31): ducks, shorebirds, offshore, mangrove keys, sandhill scrub, woods and mountaintops ===== */
for(const a of BY.BIRDS[6])gb(...a);
/* detail hooks: marks the body plans can't place well (drawn last) */
function gbWingBars(c1,c2){return function(c,pose,o,g){const {A,B,loc}=g;c.save();c.lineCap='round';c.lineWidth=B*.09;
  c.strokeStyle=c1;let a=loc(A*.14,-B*.2),b=loc(-A*.2,-B*.04);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();
  c.strokeStyle=c2||c1;a=loc(A*.04,-B*.04);b=loc(-A*.3,B*.1);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.restore()}}
GB.eawp.draw=gbWingBars('#d8d8c8');
GB.pigr.draw=gbWingBars('#f6f6f3');
GB.bawa.draw=function(c,pose,o,g){const {A,B,loc}=g;c.save();c.strokeStyle='#f6f6f3';c.lineCap='round';c.lineWidth=B*.07;for(const v of[-.42,-.58]){const a=loc(A*.5,B*v),b=loc(-A*.1,B*v);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()}c.restore();gbWingBars('#f6f6f3')(c,pose,o,g)};
GB.ybsa.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;const a=loc(A*.45,-B*.25),b=loc(-A*.35,-B*.3);c.save();c.strokeStyle='#f6f5f0';c.lineCap='round';c.lineWidth=B*.16;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.restore()};
GB.rbgr.draw=function(c,pose,o,g){const {Hc,R,A,B,loc}=g;c.save();c.fillStyle='#f6f6f3';const p=loc(-A*.1,-B*.25);c.beginPath();c.ellipse(p[0],p[1],B*.18,B*.12,0,0,TAU);c.fill();
  c.fillStyle='#d8203a';c.beginPath();c.moveTo(Hc[0]-R*.3,Hc[1]+R*.85);c.lineTo(Hc[0]+R*.85,Hc[1]+R*.85);c.lineTo(Hc[0]+R*.15,Hc[1]+R*2.3);c.closePath();c.fill();c.restore()};
GB.rugr.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#1e1a16';c.beginPath();c.ellipse(Hc[0]-R*.5,Hc[1]+R*1.15,R*.28,R*.42,.3,0,TAU);c.fill();c.restore()};
GB.bwvi.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#1a1a1a';c.lineCap='round';c.lineWidth=R*.12;c.beginPath();c.moveTo(Hc[0]+R*.62,Hc[1]+R*.42);c.lineTo(Hc[0]+R*.32,Hc[1]+R*.68);c.stroke();c.restore()};
GB.bbpl.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.moveTo(Hc[0]+R*.9,Hc[1]-R*.55);c.quadraticCurveTo(Hc[0]-R*.2,Hc[1]-R*.75,Hc[0]-R*.95,Hc[1]+R*.1);c.quadraticCurveTo(Hc[0]-R*1.0,Hc[1]+R*1.2,Hc[0]-R*.55,Hc[1]+R*1.95);c.lineTo(Hc[0]-R*.3,Hc[1]+R*1.9);c.quadraticCurveTo(Hc[0]-R*.62,Hc[1]+R*.9,Hc[0]-R*.55,Hc[1]-R*.15);c.quadraticCurveTo(Hc[0]+R*.2,Hc[1]-R*.55,Hc[0]+R*.9,Hc[1]-R*.45);c.closePath();c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(ex+er*.3,ey-er*.35,er*.32,0,TAU);c.fill();c.restore()};
GB.brno.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#f2f0ea';c.lineCap='round';c.lineWidth=R*.1;c.beginPath();c.arc(Hc[0]+R*.4,Hc[1]-R*.15,R*.3,.3*Math.PI,.9*Math.PI);c.stroke();c.restore()};
Object.assign(GBSONG,{
  drum:(T,N,v,p)=>{let t=0,gap=.55;for(let i=0;i<22;i++){T('sine',70,55,.08,.08*v,t,{pan:p});t+=gap;gap=Math.max(.05,gap*.82)}},
  groundcoo:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',520,620,.3,.05*v,i*.6,{pan:p})},
  cuckoo:(T,N,v,p)=>{let t=0;for(let i=0;i<7;i++){T('square',700,640,.06,.035*v,t,{filt:1400,q:3,pan:p});t+=.09}for(let i=0;i<3;i++){T('sine',520,440,.22,.05*v,t,{pan:p});t+=.32}},
  ploverwhistle:(T,N,v,p)=>{T('sine',2400,2800,.2,.05*v,0,{pan:p});T('sine',2200,1900,.25,.05*v,.24,{pan:p});T('sine',2200,2600,.22,.05*v,.52,{pan:p})},
  tewtew:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sine',2800,2300,.12,.05*v,i*.16,{pan:p})},
  tututu:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sine',2400,2200,.07,.045*v,i*.1,{pan:p})},
  noddy:(T,N,v,p)=>{T('sawtooth',700,520,.3,.05*v,0,{filt:1300,q:4,pan:p})},
  mew:(T,N,v,p)=>{T('sawtooth',1500,1100,.35,.04*v,0,{filt:2000,q:5,pan:p})},
  pewee:(T,N,v,p)=>{T('sine',3400,3000,.25,.05*v,0,{pan:p});T('sine',3000,2600,.2,.05*v,.28,{pan:p});T('sine',2600,3600,.45,.05*v,.52,{pan:p})},
  wheep:(T,N,v,p)=>{T('sawtooth',1800,3000,.25,.04*v,0,{filt:3200,q:3,pan:p})},
  carolina:(T,N,v,p)=>{const n=[[4000,.25],[3200,.25],[4200,.25],[3000,.3]];let t=0;for(const [f,d] of n){T('sine',f,f*.98,d,.045*v,t,{pan:p});t+=d+.08}},
  gnat:(T,N,v,p)=>{T('sawtooth',5200,4600,.22,.025*v,0,{filt:5600,q:3,pan:p})},
  hermit:(T,N,v,p)=>{const b=[2200,2800,3400,2600][Math.floor(Math.random()*4)];T('sine',b,b,.4,.05*v,0,{pan:p});for(let i=0;i<6;i++)T('sine',b*1.4+Math.random()*900,b*1.3+Math.random()*700,.1,.035*v,.45+i*.1,{pan:p})},
  canada:(T,N,v,p)=>{T('sine',3200,3200,.4,.05*v,0,{pan:p});T('sine',4200,4200,.45,.05*v,.45,{pan:p});for(let i=0;i<3;i++){T('sine',3700,3700,.14,.045*v,1+i*.42,{pan:p});T('sine',3700,3700,.14,.045*v,1.16+i*.42,{pan:p})}},
  weesa:(T,N,v,p)=>{for(let i=0;i<6;i++){T('sine',7200,6800,.06,.03*v,i*.18,{pan:p});T('sine',6000,5800,.06,.03*v,i*.18+.08,{pan:p})}},
  teetew:(T,N,v,p)=>{T('sine',2600,2800,.15,.05*v,0,{pan:p});T('sine',2600,2800,.15,.05*v,.2,{pan:p});T('sine',2800,2200,.3,.05*v,.42,{pan:p})},
  robinish:(T,N,v,p)=>{const n=[[2400,2900],[2900,2500],[2200,2700],[2700,3200],[3000,2400],[2500,2800]];let t=0;for(const [a,b] of n){T('sine',a,b,.13,.05*v,t,{pan:p});t+=.16}}});
GB.hawo.draw=function(c,pose,o,g){const {Hc,R,A,B,loc}=g;c.save();c.fillStyle='#e2262a';c.beginPath();c.ellipse(Hc[0]-R*.82,Hc[1]-R*.15,R*.2,R*.28,.3,0,TAU);c.fill();
  const a=loc(A*.5,-B*.7),b=loc(-A*.2,-B*.74);c.strokeStyle='#f6f5f0';c.lineCap='round';c.lineWidth=B*.14;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.restore()};
/* version 31.1 clean-up hooks */
GB.nsho.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();if(pose==='swim'){c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip()}let p=loc(-A*.02,B*.02);c.fillStyle='#b5602e';c.beginPath();c.ellipse(p[0],p[1],A*.48,B*.24,-tilt,0,TAU);c.fill();
  p=loc(A*.74,B*.02);c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(p[0],p[1],A*.18,B*.36,-tilt,0,TAU);c.fill();c.restore()};
GB.heth.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.fillStyle='#3a3028';for(let i=0;i<20;i++){const h1=((i*7919)%997)/997,h2=((i*104729)%991)/991,u=.5+h1*.45,v=-.05+h2*.45;if(u*u*.7+v*v>.85)continue;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*(.035+.015*(1-h2)),0,TAU);c.fill()}c.restore()};
GB.rnph.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#c0582a';c.beginPath();c.ellipse(Hc[0]-R*.2,Hc[1]+R*1.0,R*.5,R*.62,.45,0,TAU);c.fill();c.restore()};

/* ===== 25 more birds (version 32): ducks and grebes, marsh birds, shorebirds and terns, night birds, woodland songbirds ===== */
for(const a of BY.BIRDS[7])gb(...a);
/* detail hooks */
GB.blte.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.moveTo(Hc[0]+R*.75,Hc[1]-R*.75);c.quadraticCurveTo(Hc[0]+R*.05,Hc[1]-R*.1,Hc[0]+R*.7,Hc[1]+R*.62);c.quadraticCurveTo(Hc[0]+R*.38,Hc[1]-R*.1,Hc[0]+R*.75,Hc[1]-R*.75);c.fill();
  c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip();const {A,B,loc}=g;const p=loc(-A*.8,-B*.2);c.beginPath();c.ellipse(p[0],p[1],A*.08,B*.24,0,0,TAU);c.fill();c.restore()};
GB.amwi.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#1a6a4a';c.beginPath();c.ellipse(Hc[0]-R*.2,Hc[1]-R*.15,R*.75,R*.24,.15,0,TAU);c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(ex+er*.3,ey-er*.35,er*.32,0,TAU);c.fill();
  c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip();const {A,B,loc}=g;const p=loc(-A*.8,-B*.2);c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(p[0],p[1],A*.08,B*.24,0,0,TAU);c.fill();c.restore()};
GB.rndu.draw=function(c,pose,o,g){const {bb,btip,R,A,B,loc,tilt}=g;c.save();c.strokeStyle='#f6f6f3';c.lineWidth=R*.1;const m=(k)=>[bb[0]+(btip[0]-bb[0])*k,bb[1]+(btip[1]-bb[1])*k];for(const k of[.05,.72]){const p=m(k);c.beginPath();c.moveTo(p[0],p[1]-R*.28);c.lineTo(p[0],p[1]+R*.28);c.stroke()}
  c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip();let q=loc(-A*.02,B*.02);c.fillStyle='#b8bcc0';c.beginPath();c.ellipse(q[0],q[1],A*.5,B*.24,-tilt,0,TAU);c.fill();q=loc(A*.5,-B*.02);c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(q[0],q[1],A*.05,B*.26,-tilt+.3,0,TAU);c.fill();c.restore()};
GB.lesc.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip();const q=loc(-A*.02,B*.02);c.fillStyle='#f2f2ee';c.beginPath();c.ellipse(q[0],q[1],A*.5,B*.24,-tilt,0,TAU);c.fill();c.restore()};
GB.hogr.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#e8b84a';c.beginPath();c.moveTo(Hc[0]+R*.4,Hc[1]-R*.3);c.quadraticCurveTo(Hc[0]-R*.4,Hc[1]-R*.75,Hc[0]-R*1.25,Hc[1]-R*.55);c.quadraticCurveTo(Hc[0]-R*.4,Hc[1]-R*.2,Hc[0]+R*.4,Hc[1]-R*.1);c.closePath();c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#d8302a';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er*.5,0,TAU);c.fill();c.restore()};
GB.coga.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();c.fillStyle='#d8202a';c.beginPath();c.ellipse(Hc[0]+R*.78,Hc[1]-R*.5,R*.16,R*.32,-.2,0,TAU);c.fill();
  if(pose==='swim'){c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip()}const a=loc(A*.38,-B*.02),b=loc(-A*.4,-B*.14);c.strokeStyle='#f6f6f3';c.lineCap='round';c.lineWidth=B*.09;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.restore()};
GB.bnst.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]+R*.35,Hc[1]-R*.48,R*.2,R*.12,0,0,TAU);c.fill();c.restore()};
GB.ycnh.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]+R*.15,Hc[1]+R*.3,R*.5,R*.28,-.1,0,TAU);c.fill();c.restore()};
GB.sote.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]+R*.6,Hc[1]-R*.5,R*.32,R*.16,-.3,0,TAU);c.fill();c.restore()};
GB.ewpw.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f2efe8';c.beginPath();c.ellipse(Hc[0]+R*.1,Hc[1]+R*.85,R*.45,R*.09,-.15,0,TAU);c.fill();c.restore()};
GB.logs.draw=function(c,pose,o,g){const {A,B,loc}=g;const p=loc(-A*.2,-B*.05);c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(p[0],p[1],B*.13,B*.09,0,0,TAU);c.fill();c.restore()};
GB.gckl.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f2c22a';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]-R*.8,R*.55,R*.17,-.08,0,TAU);c.fill();c.fillStyle='#ee7a1a';c.beginPath();c.ellipse(Hc[0]-R*.1,Hc[1]-R*.84,R*.32,R*.09,-.08,0,TAU);c.fill();c.restore();gbWingBars('#f2f2ea','#22281a')(c,pose,o,g)};
GB.veer.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.fillStyle='rgba(150,100,60,.5)';for(let i=0;i<10;i++){const x1=Math.sin(i*12.9898)*43758.5453,x2=Math.sin(i*78.233)*43758.5453,h1=x1-Math.floor(x1),h2=x2-Math.floor(x2),u=.55+h1*.38,v=-.12+h2*.42;if(u*u*.7+v*v>.85)continue;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*.032,0,TAU);c.fill()}c.restore()};
GB.oven.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#1e1e1a';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]-R*.78,R*.6,R*.22,-.08,0,TAU);c.fill();c.fillStyle='#d8782a';c.beginPath();c.ellipse(Hc[0]-R*.08,Hc[1]-R*.82,R*.45,R*.12,-.08,0,TAU);c.fill();c.restore();gbFineStreaks('rgba(40,36,30,.85)',20,.035,[.45,.95,-.05,.55])(c,pose,o,g)};
GB.nopa.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();let p=loc(A*.3,-B*.55);c.fillStyle='#8aa04a';c.beginPath();c.ellipse(p[0],p[1],A*.18,B*.16,-tilt,0,TAU);c.fill();
  c.lineCap='round';c.lineWidth=R*.14;c.strokeStyle='#2a3048';c.beginPath();c.moveTo(Hc[0]-R*.05,Hc[1]+R*1.5);c.quadraticCurveTo(Hc[0]+R*.35,Hc[1]+R*1.62,Hc[0]+R*.7,Hc[1]+R*1.45);c.stroke();c.strokeStyle='#b8582a';c.beginPath();c.moveTo(Hc[0]+R*.05,Hc[1]+R*1.68);c.quadraticCurveTo(Hc[0]+R*.35,Hc[1]+R*1.8,Hc[0]+R*.62,Hc[1]+R*1.66);c.stroke();c.restore();gbWingBars('#f6f6f3')(c,pose,o,g)};
Object.assign(GBSONG,{
  teal:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sine',4200,3800,.07,.035*v,i*.2,{pan:p})},
  wigeon:(T,N,v,p)=>{T('sine',2400,2600,.12,.04*v,0,{pan:p});T('sine',2600,3000,.22,.045*v,.16,{pan:p});T('sine',2600,2200,.18,.04*v,.42,{pan:p})},
  whinnyrail:(T,N,v,p)=>{T('sine',1800,2600,.25,.05*v,0,{pan:p});for(let i=0;i<9;i++)T('sine',2800-i*150,2600-i*150,.08,.045*v,.35+i*.1,{pan:p})},
  cackle:(T,N,v,p)=>{for(let i=0;i<6;i++)T('square',900-i*40,800-i*40,.07,.035*v,i*.12,{filt:1600,q:3,pan:p})},
  chuwee:(T,N,v,p)=>{T('sine',2000,2000,.08,.045*v,0,{pan:p});T('sine',2200,3200,.18,.05*v,.1,{pan:p})},
  pumper:(T,N,v,p)=>{for(let r=0;r<3;r++){T('sine',110,90,.22,.08*v,r*.85,{pan:p});T('sine',140,100,.3,.08*v,r*.85+.25,{pan:p})}},
  wackywack:(T,N,v,p)=>{T('sawtooth',1500,1300,.1,.04*v,0,{filt:2200,q:3,pan:p});T('sawtooth',1700,1500,.12,.04*v,.14,{filt:2200,q:3,pan:p});T('sawtooth',1500,1200,.16,.04*v,.32,{filt:2200,q:3,pan:p})},
  whippoorwill:(T,N,v,p)=>{for(let r=0;r<3;r++){const t=r*.9;T('sine',1600,2000,.1,.05*v,t,{pan:p});T('sine',1500,1300,.1,.045*v,t+.15,{pan:p});T('sine',1500,2300,.25,.05*v,t+.3,{pan:p})}},
  harsh:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sawtooth',2200,1800,.1,.035*v,i*.16,{filt:2600,q:3,pan:p})},
  ahah:(T,N,v,p)=>{for(let i=0;i<2;i++)T('sawtooth',900,820,.16,.05*v,i*.24,{filt:1500,q:5,pan:p})},
  veery:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',3800-i*350,3500-i*350,.35,.04*v,i*.32,{vib:200,rate:40,pan:p})},
  teacher:(T,N,v,p)=>{for(let i=0;i<5;i++){const k=1+i*.08;T('sine',3200,3800,.08,.035*v*k,i*.28,{pan:p});T('sine',3600,3000,.1,.035*v*k,i*.28+.1,{pan:p})}},
  parula:(T,N,v,p)=>{T('sawtooth',3800,6200,.9,.03*v,0,{filt:6000,q:2,vib:500,rate:60,pan:p});T('sine',6600,5800,.06,.04*v,.95,{pan:p})},
  glug:(T,N,v,p)=>{T('sine',600,500,.1,.05*v,0,{pan:p});T('sine',700,560,.1,.05*v,.13,{pan:p});T('sine',5000,8000,.4,.03*v,.3,{pan:p})},
  pikituk:(T,N,v,p)=>{const n=[3000,2600,3200];n.forEach((f,i)=>T('square',f,f*.9,.05,.03*v,i*.09,{filt:3600,q:2,pan:p}))}});
GB.sepl.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#141416';c.beginPath();c.ellipse(Hc[0]-R*.3,Hc[1]+R*1.15,R*.62,R*.2,.35,0,TAU);c.fill();c.restore()};
/* version 32.1 clean-up hooks */
GB.ambi.draw=function(c,pose,o,g){const {Hc,R,neckBase}=g;const dx=neckBase[0]-Hc[0],dy=neckBase[1]-Hc[1];c.save();c.lineCap='round';
  c.strokeStyle='#1e1812';c.lineWidth=R*.2;c.beginPath();c.moveTo(Hc[0]+R*.55,Hc[1]+R*.35);c.lineTo(Hc[0]+dx*.55+R*.75,Hc[1]+dy*.55);c.stroke();
  if(o.detail){c.strokeStyle='rgba(120,84,48,.85)';c.lineWidth=R*.13;for(let k=0;k<3;k++){const ox=R*(.3-k*.3);c.beginPath();c.moveTo(Hc[0]+dx*.25+ox,Hc[1]+dy*.25);c.lineTo(Hc[0]+dx*.85+ox,Hc[1]+dy*.85);c.stroke()}}c.restore()};
GB.logs.draw0=GB.logs.draw;GB.logs.draw=function(c,pose,o,g){GB.logs.draw0(c,pose,o,g);const {Hc,R}=g;c.save();c.fillStyle='#141416';c.beginPath();c.moveTo(Hc[0]+R*.95,Hc[1]-R*.05);c.quadraticCurveTo(Hc[0]+R*.3,Hc[1]-R*.42,Hc[0]-R*.55,Hc[1]-R*.2);c.lineTo(Hc[0]-R*.5,Hc[1]+R*.05);c.quadraticCurveTo(Hc[0]+R*.3,Hc[1]+R*.1,Hc[0]+R*.95,Hc[1]+R*.12);c.closePath();c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(ex+er*.3,ey-er*.35,er*.32,0,TAU);c.fill();c.restore()};

/* ===== 25 more birds (version 33): bog, spruce-fir, alpine, salt marsh, rocky shore, offshore and cypress swamp birds ===== */
for(const a of BY.BIRDS[8])gb(...a);

/* detail hooks */
GB.musw.draw=function(c,pose,o,g){const {bb,R}=g;c.save();c.fillStyle='#141414';c.beginPath();c.ellipse(bb[0]+R*.3,bb[1]-R*.12,R*.24,R*.17,-.2,0,TAU);c.fill();c.restore()};
GB.hadu.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();c.fillStyle='#f6f6f3';
  c.beginPath();c.ellipse(Hc[0]+R*.72,Hc[1]-R*.2,R*.16,R*.36,.2,0,TAU);c.fill();
  c.beginPath();c.arc(Hc[0]-R*.12,Hc[1]+R*.05,R*.16,0,TAU);c.fill();
  c.beginPath();c.ellipse(Hc[0]-R*.55,Hc[1]+R*.3,R*.08,R*.42,.35,0,TAU);c.fill();
  c.fillStyle='#b85a32';c.beginPath();c.ellipse(Hc[0]-R*.1,Hc[1]-R*.72,R*.55,R*.13,-.1,0,TAU);c.fill();
  if(pose==='swim'){c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip()}
  {const q=loc(-A*.1,-B*.1);c.fillStyle='#b85a32';c.beginPath();c.ellipse(q[0],q[1],A*.4,B*.16,-tilt,0,TAU);c.fill()}c.strokeStyle='#f6f6f3';c.lineCap='round';c.lineWidth=B*.08;
  let p=loc(A*.62,-B*.25),q=loc(A*.48,B*.35);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();
  p=loc(A*.05,-B*.62);q=loc(-A*.45,-B*.5);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.restore();c.save();c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(ex+er*.3,ey-er*.35,er*.32,0,TAU);c.fill();c.restore()};
GB.cogo.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]+R*.68,Hc[1]+R*.22,R*.2,R*.24,0,0,TAU);c.fill();
  c.strokeStyle='#f6f6f3';c.lineWidth=B*.07;c.lineCap='round';for(let k=0;k<3;k++){const p=loc(A*(.3-k*.22),-B*.62),q=loc(A*(.18-k*.22),-B*.42);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.rbme.draw=function(c,pose,o,g){if(!o.detail)return;const {Hc,R,neckBase}=g;const x0=neckBase[0],y0=neckBase[1];c.save();if(pose==='swim'){c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip()}c.fillStyle='rgba(50,34,22,.7)';
  for(let i=0;i<14;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=h1-Math.floor(h1),v=h2-Math.floor(h2);c.beginPath();c.arc(x0+R*(-.1+u*.9),y0+R*(.2+v*.7),R*.08,0,TAU);c.fill()}c.restore()};
GB.clra.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();c.strokeStyle='rgba(246,246,240,.8)';c.lineWidth=B*.05;for(let k=0;k<5;k++){const p=loc(-A*(.05+k*.13),B*.1),q=loc(-A*(.12+k*.13),B*.42);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.wisn.draw=function(c,pose,o,g){const {Hc,R,A,B,loc}=g;c.save();c.fillStyle='#e2cfa8';c.beginPath();c.ellipse(Hc[0]-R*.1,Hc[1]-R*.82,R*.6,R*.09,-.05,0,TAU);c.fill();
  c.strokeStyle='#e2cfa8';c.lineWidth=B*.06;c.lineCap='round';for(const v of[-.62,-.42]){const p=loc(A*.45,B*v),q=loc(-A*.55,B*(v+.06));c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}
  c.strokeStyle='rgba(70,50,30,.6)';c.lineWidth=B*.04;for(let k=0;k<4;k++){const p=loc(-A*(.05+k*.14),B*.18),q=loc(-A*(.1+k*.14),B*.42);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.tbmu.draw=function(c,pose,o,g){const {bb,btip,R}=g;c.save();c.strokeStyle='#f6f6f3';c.lineWidth=Math.max(.1,R*.07);c.beginPath();c.moveTo(bb[0],bb[1]);c.lineTo(bb[0]+(btip[0]-bb[0])*.55,bb[1]+(btip[1]-bb[1])*.55);c.stroke();c.restore()};
GB.grco.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();if(pose==='swim'){c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip()}const p=loc(-A*.3,B*.1);c.fillStyle='#f2f0ea';c.beginPath();c.ellipse(p[0],p[1],A*.12,B*.2,-tilt,0,TAU);c.fill();c.restore()};
GB.attw.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f2d23a';c.beginPath();c.ellipse(Hc[0]+R*.05,Hc[1]-R*.6,R*.4,R*.2,-.08,0,TAU);c.fill();c.restore()};
GB.ybfl.draw=function(c,pose,o,g){gbWingBars('#f2f2e2','#2a2c1e')(c,pose,o,g)};
GB.bevi.draw=function(c,pose,o,g){gbWingBars('#e8e8e0')(c,pose,o,g)};
GB.swth.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.fillStyle='rgba(70,60,40,.8)';for(let i=0;i<14;i++){const x1=Math.sin(i*12.9898)*43758.5453,x2=Math.sin(i*78.233)*43758.5453,h1=x1-Math.floor(x1),h2=x2-Math.floor(x2),u=.45+h1*.4,v=-.08+h2*.38;if(u*u*.7+v*v>.85)continue;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*.042,0,TAU);c.fill()}c.restore()};
GB.pisi.draw=function(c,pose,o,g){gbWingBars('#e8d23a','#2a2620')(c,pose,o,g);gbFineStreaks('rgba(50,40,28,.85)',22,.035,[.35,.95,-.1,.5])(c,pose,o,g)};
GB.sesp.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#4a4e42';c.lineWidth=R*.12;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]+R*.35,Hc[1]+R*.55);c.lineTo(Hc[0]-R*.25,Hc[1]+R*.85);c.stroke();c.restore();gbFineStreaks('rgba(80,80,66,.7)',14,.04,[.4,.9,-.05,.45])(c,pose,o,g)};
GB.lisp.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#9aa0a0';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]-R*.78,R*.5,R*.08,-.08,0,TAU);c.fill();c.restore();gbFineStreaks('rgba(40,30,20,.85)',18,.03,[.4,.9,-.05,.45])(c,pose,o,g)};
GB.nowa.draw=function(c,pose,o,g){gbFineStreaks('rgba(40,36,26,.9)',24,.04,[.4,.95,-.08,.55])(c,pose,o,g)};
GB.mawa.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();let p=loc(-A*.02,-B*.42);c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(p[0],p[1],A*.2,B*.14,-tilt,0,TAU);c.fill();c.restore();gbFineStreaks('rgba(20,20,22,.95)',16,.045,[.45,.9,-.02,.45])(c,pose,o,g)};
Object.assign(GBSONG,{
  swanhum:(T,N,v,p)=>{for(let i=0;i<4;i++){N('bandpass',420,2,.25,.05*v,500,i*.4,p)}N('highpass',3000,.5,.5,.02*v,2000,1.7,p)},
  gadwall:(T,N,v,p)=>{T('sawtooth',420,380,.09,.05*v,0,{filt:900,q:4,pan:p});T('sawtooth',440,380,.09,.05*v,.32,{filt:900,q:4,pan:p})},
  seamouse:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sine',3200,2600,.1,.035*v,i*.18,{vib:120,rate:30,pan:p})},
  goldeneye:(T,N,v,p)=>{T('square',1400,1500,.08,.04*v,0,{filt:2000,q:4,pan:p});for(let i=0;i<5;i++)N('bandpass',3200,3,.12,.03*v,2800,.3+i*.14,p)},
  clapper:(T,N,v,p)=>{for(let i=0;i<10;i++)T('sawtooth',1300,1150,.06,.045*v,i*(.16-i*.008),{filt:2000,q:3,pan:p})},
  winnow:(T,N,v,p)=>{for(let i=0;i<9;i++)T('sine',380+i*18,420+i*18,.1,.05*v,i*.11,{vib:60,rate:12,pan:p})},
  leachpurr:(T,N,v,p)=>{T('sawtooth',300,280,.9,.03*v,0,{filt:700,q:2,vib:40,rate:28,pan:p});for(let i=0;i<4;i++)T('square',1600,1300,.05,.03*v,1+i*.1,{filt:2200,pan:p})},
  pik:(T,N,v,p)=>{T('square',2600,2200,.04,.035*v,0,{filt:3200,q:2,pan:p})},
  threebeers:(T,N,v,p)=>{T('sine',1800,2000,.08,.05*v,0,{pan:p});T('sine',2600,2700,.14,.055*v,.18,{pan:p});T('sine',2500,2000,.3,.05*v,.42,{pan:p})},
  perwee:(T,N,v,p)=>{T('sine',2400,2400,.06,.035*v,0,{pan:p});T('sine',2400,3300,.2,.04*v,.08,{pan:p})},
  bellsvireo:(T,N,v,p)=>{for(let i=0;i<9;i++){const f=2800+((i*37)%5)*260;T('sine',f,f+(i%2?-500:500),.06,.035*v,i*.075,{pan:p})}T('sine',3600,2600,.12,.04*v,.7,{pan:p})},
  spiral:(T,N,v,p)=>{for(let i=0;i<7;i++){const f=1800+i*320;T('sine',f,f+260,.14,.04*v,i*.15,{vib:90,rate:30,pan:p})}},
  winterwren:(T,N,v,p)=>{for(let i=0;i<34;i++){const f=3500+Math.sin(i*1.7)*1300+(i%6)*120;T('sine',f,f+(i%2?300:-300),.04,.03*v,i*.065,{pan:p})}},
  siskin:(T,N,v,p)=>{T('sawtooth',2600,4800,.6,.025*v,0,{filt:5200,q:2,vib:300,rate:60,pan:p})},
  seaside:(T,N,v,p)=>{T('square',3000,2800,.04,.025*v,0,{filt:3600,pan:p});T('square',3000,2800,.04,.025*v,.12,{filt:3600,pan:p});T('sawtooth',5000,4600,.55,.025*v,.3,{filt:5200,q:2,vib:400,rate:70,pan:p})},
  lincoln:(T,N,v,p)=>{for(let i=0;i<12;i++){const f=2600+(i<6?i*200:(12-i)*180)+((i*13)%3)*150;T('sine',f,f-200,.05,.035*v,i*.08,{pan:p})}},
  rustygate:(T,N,v,p)=>{T('sawtooth',1800,2400,.12,.03*v,0,{filt:2800,q:3,pan:p});T('sawtooth',3600,4200,.25,.03*v,.16,{filt:4400,q:3,vib:200,rate:50,pan:p})},
  boattail:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sawtooth',1200+i*300,1700+i*300,.1,.04*v,i*.16,{filt:2600,q:3,pan:p});for(let i=0;i<6;i++)N('bandpass',2400,4,.03,.05*v,2200,.75+i*.05,p)},
  waterthrush:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',3600,3300,.08,.045*v,i*.17,{pan:p});for(let i=0;i<3;i++)T('sine',3000,2600,.08,.045*v,.75+i*.12,{pan:p});T('sine',2600,2000,.12,.04*v,1.15,{pan:p})}});

/* ===== 25 more birds (version 34): offshore, salt marsh, mangrove, spruce-fir and northern forest, ponds and rocky shore ===== */
for(const a of BY.BIRDS[9])gb(...a);

/* detail hooks */
GB.gwte.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();c.fillStyle='#1a6a4a';c.beginPath();c.moveTo(Hc[0]+R*.45,Hc[1]-R*.2);c.quadraticCurveTo(Hc[0]-R*.3,Hc[1]-R*.45,Hc[0]-R*.95,Hc[1]+R*.05);c.quadraticCurveTo(Hc[0]-R*.3,Hc[1]+R*.05,Hc[0]+R*.45,Hc[1]+R*.05);c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(ex+er*.3,ey-er*.35,er*.32,0,TAU);c.fill();
  if(pose==='swim'){c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip()}const p=loc(A*.42,-B*.1);c.strokeStyle='#f6f6f3';c.lineWidth=B*.08;c.lineCap='round';c.beginPath();c.moveTo(p[0],p[1]-B*.25);c.lineTo(p[0]+B*.03,p[1]+B*.18);c.stroke();c.restore()};
GB.rtlo.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.fillStyle='rgba(240,240,232,.7)';for(let i=0;i<16;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=-.6+(h1-Math.floor(h1))*1,v=-.55+(h2-Math.floor(h2))*.35;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*.035,0,TAU);c.fill()}c.restore()};
GB.reph.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]+R*.1,Hc[1]+R*.15,R*.62,R*.42,0,0,TAU);c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.restore()};
GB.whim.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#e8dcc4';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]-R*.82,R*.55,R*.1,-.05,0,TAU);c.fill();c.restore()};
GB.nesp.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#8a8e92';c.beginPath();c.ellipse(Hc[0]+R*.05,Hc[1]+R*.25,R*.42,R*.3,0,0,TAU);c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.restore();gbFineStreaks('rgba(120,90,50,.6)',12,.03,[.45,.9,-.05,.4])(c,pose,o,g)};
GB.goea.draw=function(c,pose,o,g){const {Hc,R,neckBase}=g;c.save();c.fillStyle='#c8962e';c.beginPath();c.ellipse(Hc[0]-R*.45,Hc[1]+R*.15,R*.55,R*.7,.5,0,TAU);c.fill();c.fillStyle='rgba(200,150,46,.6)';c.beginPath();c.ellipse(Hc[0]-R*.1,Hc[1]-R*.55,R*.5,R*.3,0,0,TAU);c.fill();c.restore()};
GB.spgr.draw=function(c,pose,o,g){const {Hc,R,A,B,loc}=g;c.save();c.fillStyle='#e2342a';c.beginPath();c.ellipse(Hc[0]+R*.35,Hc[1]-R*.45,R*.28,R*.12,-.1,0,TAU);c.fill();
  if(o.detail){c.fillStyle='rgba(246,246,240,.85)';for(let i=0;i<9;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=-.35+(h1-Math.floor(h1))*.75,v=.05+(h2-Math.floor(h2))*.35;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*.045,0,TAU);c.fill()}}c.restore()};
GB.nswo.draw=gbOwlDraw({streaks:[.5,.2],rim:true});
GB.nswo.drawOnly=true;GB.nswo.boxPts=GB.easo.boxPts;GB.nswo.pinPts=GB.easo.pinPts;
GB.bbwo.draw=function(c,pose,o,g){const {Hc,R,A,B,loc}=g;c.save();c.fillStyle='#f2d23a';c.beginPath();c.ellipse(Hc[0]+R*.05,Hc[1]-R*.6,R*.4,R*.2,-.08,0,TAU);c.fill();
  c.fillStyle='#f6f5f0';c.beginPath();c.ellipse(Hc[0]+R*.15,Hc[1]+R*.35,R*.6,R*.14,.1,0,TAU);c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.restore()};
GB.merl.draw=function(c,pose,o,g){gbFineStreaks('rgba(110,70,40,.85)',22,.045,[.3,.95,-.1,.55])(c,pose,o,g)};
GB.blbw.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();c.fillStyle='#141416';c.beginPath();c.moveTo(Hc[0]+R*.7,Hc[1]-R*.3);c.lineTo(Hc[0]-R*.55,Hc[1]-R*.35);c.lineTo(Hc[0]-R*.2,Hc[1]+R*.45);c.closePath();c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();
  const p=loc(-A*.02,-B*.42);c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(p[0],p[1],A*.18,B*.13,-tilt,0,TAU);c.fill();c.restore()};
GB.btnw.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#5a6a28';c.lineWidth=R*.14;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]+R*.7,Hc[1]+R*.05);c.quadraticCurveTo(Hc[0],Hc[1]+R*.2,Hc[0]-R*.6,Hc[1]-R*.05);c.stroke();c.restore();gbWingBars('#f6f6f3')(c,pose,o,g);gbFineStreaks('rgba(20,20,22,.85)',10,.04,[.15,.6,.15,.5])(c,pose,o,g)};
GB.recr.draw=function(c,pose,o,g){const {bb,btip,R}=g;c.save();c.strokeStyle='#4a4440';c.lineWidth=Math.max(.12,R*.12);c.lineCap='round';c.beginPath();c.moveTo(bb[0],bb[1]+R*.18);c.quadraticCurveTo(bb[0]+(btip[0]-bb[0])*.8,bb[1]+(btip[1]-bb[1])*.8+R*.22,btip[0]-R*.1,btip[1]-R*.2);c.stroke();c.restore()};
GB.evgr.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();const p=loc(-A*.12,-B*.35);c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(p[0],p[1],A*.16,B*.18,-tilt,0,TAU);c.fill();c.restore()};
GB.nowh.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();const p=loc(-A*.75,-B*.1);c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(p[0],p[1],A*.12,B*.22,-tilt,0,TAU);c.fill();c.restore()};
GB.puga.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#a8c8e8';c.beginPath();c.ellipse(Hc[0]+R*.78,Hc[1]-R*.5,R*.16,R*.32,-.2,0,TAU);c.fill();c.restore()};
GB.leye.draw=function(c,pose,o,g){gbFineStreaks('rgba(90,90,82,.6)',12,.03,[.5,.95,-.1,.3])(c,pose,o,g)};
Object.assign(GBSONG,{
  crick:(T,N,v,p)=>{for(let i=0;i<2;i++)T('square',3400,3200,.06,.03*v,i*.5,{filt:4000,q:3,pan:p})},
  whimbrel:(T,N,v,p)=>{for(let i=0;i<7;i++)T('sine',2600,2400,.06,.045*v,i*.09,{pan:p})},
  sizzle:(T,N,v,p)=>{T('square',3000,2800,.03,.02*v,0,{filt:3600,pan:p});N('highpass',4500,.6,.8,.03*v,5500,.08,p);T('square',3200,3000,.03,.02*v,.95,{filt:3600,pan:p})},
  kaywek:(T,N,v,p)=>{T('sawtooth',1600,1800,.1,.04*v,0,{filt:2400,q:4,pan:p});T('sawtooth',1900,1500,.14,.04*v,.14,{filt:2400,q:4,pan:p})},
  pitypit:(T,N,v,p)=>{const n=[0,.12,.22,.32];n.forEach(t=>T('square',2400,2000,.04,.035*v,t,{filt:3000,q:3,pan:p}))},
  kee:(T,N,v,p)=>{T('sine',2600,2300,.25,.035*v,0,{vib:80,rate:20,pan:p})},
  chewp:(T,N,v,p)=>{T('sawtooth',3800,3200,.05,.03*v,0,{filt:5000,q:2,pan:p});for(let i=0;i<5;i++)N('highpass',6000,.8,.05,.015*v,6000,.15+i*.06,p)},
  sawwhet:(T,N,v,p)=>{for(let i=0;i<8;i++)T('sine',1150,1120,.1,.05*v,i*.24,{pan:p})},
  kikiki:(T,N,v,p)=>{for(let i=0;i<8;i++)T('sawtooth',2800,2600,.07,.035*v,i*.11,{filt:3600,q:3,pan:p})},
  nashville:(T,N,v,p)=>{for(let i=0;i<3;i++){T('sine',5200,5600,.07,.03*v,i*.2,{pan:p});T('sine',5600,4800,.07,.03*v,i*.2+.08,{pan:p})}for(let i=0;i<5;i++)T('sine',4400,4200,.05,.03*v,.65+i*.07,{pan:p})},
  thinzee:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sine',6200,6400,.06,.025*v,i*.13,{pan:p});T('sine',7000,9000,.5,.025*v,.45,{pan:p})},
  zeezoo:(T,N,v,p)=>{const f=[4800,4800,4000,3800,5000];f.forEach((x,i)=>T('sawtooth',x,x-200,.22,.022*v,i*.26,{filt:6000,q:2,vib:200,rate:60,pan:p}))},
  kipkip:(T,N,v,p)=>{for(let i=0;i<2;i++)T('square',2800,2400,.05,.035*v,i*.14,{filt:3400,q:3,pan:p})},
  peeer:(T,N,v,p)=>{T('sawtooth',2600,2200,.2,.035*v,0,{filt:3200,q:3,pan:p})},
  tutu:(T,N,v,p)=>{for(let i=0;i<2;i++)T('sine',2300,2100,.08,.045*v,i*.14,{pan:p})},
  chack:(T,N,v,p)=>{N('bandpass',3200,3,.05,.06*v,3000,0,p);N('bandpass',3200,3,.05,.06*v,3000,.3,p)}});

/* ===== 25 more birds (version 35): waterfowl, farm and grassland, shore and beach, owls and hawks, swallows and songbirds ===== */
for(const a of BY.BIRDS[10])gb(...a);

/* detail hooks */
GB.bbwd.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#6a4a32';c.beginPath();c.ellipse(Hc[0]-R*.1,Hc[1]-R*.7,R*.6,R*.25,-.05,0,TAU);c.fill();c.restore()};
GB.bran.draw=function(c,pose,o,g){const {Hc,R,neckBase}=g;c.save();c.strokeStyle='#f6f6f3';c.lineWidth=R*.18;c.lineCap='round';const x=Hc[0]+(neckBase[0]-Hc[0])*.35,y=Hc[1]+(neckBase[1]-Hc[1])*.35;c.beginPath();c.moveTo(x-R*.35,y-R*.05);c.lineTo(x+R*.15,y+R*.1);c.stroke();c.restore()};
GB.tusw.draw=function(c,pose,o,g){const {bb,R}=g;c.save();c.fillStyle='#f2d23a';c.beginPath();c.ellipse(bb[0]+R*.15,bb[1]+R*.05,R*.14,R*.08,0,0,TAU);c.fill();c.restore()};
GB.nopi.draw=function(c,pose,o,g){const {Hc,R,neckBase}=g;c.save();c.strokeStyle='#f6f6f3';c.lineWidth=R*.13;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]-R*.5,Hc[1]-R*.1);c.quadraticCurveTo(Hc[0]-R*.2,Hc[1]+R*.7,(Hc[0]+neckBase[0])/2+R*.15,(Hc[1]+neckBase[1])/2+R*.3);c.stroke();c.restore()};
GB.ltdu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#3a3430';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]+R*.35,R*.38,R*.42,0,0,TAU);c.fill();c.restore()};
GB.rudu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#141414';c.beginPath();c.ellipse(Hc[0],Hc[1]-R*.3,R*.98,R*.62,0,PI,TAU);c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.restore()};
GB.nobo.draw=function(c,pose,o,g){const {Hc,R,A,B,loc}=g;c.save();if(o.detail){c.fillStyle='rgba(246,246,240,.85)';for(let i=0;i<10;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=-.2+(h1-Math.floor(h1))*.75,v=.05+(h2-Math.floor(h2))*.35;const q=loc(A*u,B*v);c.beginPath();c.ellipse(q[0],q[1],B*.06,B*.035,0,0,TAU);c.fill()}}c.restore()};
GB.rinp.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#d02a2a';c.beginPath();c.ellipse(Hc[0]+R*.3,Hc[1]-R*.05,R*.4,R*.45,0,0,TAU);c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#e8c84a';c.beginPath();c.arc(ex,ey,er*1.25,0,TAU);c.fill();c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er,0,TAU);c.fill();c.restore()};
GB.vira.draw=function(c,pose,o,g){const {A,B,loc}=g;c.save();c.strokeStyle='rgba(246,246,240,.85)';c.lineWidth=B*.05;for(let k=0;k<5;k++){const p=loc(-A*(.05+k*.13),B*.1),q=loc(-A*(.12+k*.13),B*.42);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.bogu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#2a2a2a';c.beginPath();c.arc(Hc[0]-R*.38,Hc[1]+R*.12,R*.13,0,TAU);c.fill();c.restore()};
GB.seow.draw=gbOwlDraw({tufts:.03,streaks:[.5,.25],rim:true});
GB.seow.drawOnly=true;GB.seow.boxPts=GB.easo.boxPts;GB.seow.pinPts=GB.easo.pinPts;
GB.abow.draw=gbOwlDraw({rim:true});
GB.abow.drawOnly=true;GB.abow.boxPts=GB.easo.boxPts;GB.abow.pinPts=GB.easo.pinPts;
GB.ssha.draw=function(c,pose,o,g){gbFineStreaks('rgba(192,99,58,.75)',14,.05,[.3,.95,.0,.55])(c,pose,o,g)};
GB.clsw.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f2e8d0';c.beginPath();c.ellipse(Hc[0]+R*.5,Hc[1]-R*.45,R*.2,R*.17,0,0,TAU);c.fill();c.restore()};
GB.wevi.draw=function(c,pose,o,g){gbWingBars('#f6f6f3')(c,pose,o,g)};
GB.bhnu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.arc(Hc[0]-R*.75,Hc[1]-R*.1,R*.14,0,TAU);c.fill();c.restore()};
GB.cswa.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();c.strokeStyle='#141414';c.lineWidth=R*.12;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]+R*.2,Hc[1]+R*.1);c.lineTo(Hc[0]-R*.1,Hc[1]+R*.7);c.stroke();
  const p=loc(A*.05,B*.25);c.fillStyle='#a8502a';c.beginPath();c.ellipse(p[0],p[1],A*.38,B*.07,-tilt,0,TAU);c.fill();c.restore();gbWingBars('#f2e8a0')(c,pose,o,g)};
GB.wcsp.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]-R*.82,R*.55,R*.1,-.05,0,TAU);c.fill();c.restore();gbWingBars('#f2f0e8')(c,pose,o,g)};
Object.assign(GBSONG,{
  whistleduck:(T,N,v,p)=>{T('sine',2600,3200,.12,.04*v,0,{pan:p});T('sine',3000,2600,.1,.04*v,.16,{pan:p});T('sine',3000,2600,.1,.04*v,.3,{pan:p});T('sine',2800,3400,.18,.04*v,.46,{pan:p})},
  cronk:(T,N,v,p)=>{T('sawtooth',300,260,.25,.04*v,0,{filt:700,q:3,vib:30,rate:22,pan:p})},
  woohoo:(T,N,v,p)=>{T('sine',900,1100,.14,.045*v,0,{pan:p});T('sine',1200,900,.2,.045*v,.18,{pan:p})},
  prrip:(T,N,v,p)=>{T('sine',1800,1600,.12,.035*v,0,{vib:120,rate:40,pan:p});T('sine',1800,1600,.12,.035*v,.3,{vib:120,rate:40,pan:p})},
  yodel:(T,N,v,p)=>{T('sawtooth',700,1000,.14,.035*v,0,{filt:1600,q:3,pan:p});T('sawtooth',1000,800,.14,.035*v,.16,{filt:1600,q:3,pan:p});T('sawtooth',800,1050,.2,.035*v,.34,{filt:1600,q:3,pan:p})},
  tickbubble:(T,N,v,p)=>{for(let i=0;i<6;i++)T('square',600,500,.03,.025*v,i*.07,{filt:1200,pan:p});T('sine',400,300,.15,.03*v,.5,{pan:p})},
  bobwhite:(T,N,v,p)=>{T('sine',1400,1450,.12,.05*v,0,{pan:p});T('sine',1500,2800,.22,.055*v,.28,{pan:p})},
  kawk:(T,N,v,p)=>{T('sawtooth',1100,900,.14,.05*v,0,{filt:2000,q:4,pan:p});T('sawtooth',1000,800,.1,.04*v,.2,{filt:2000,q:4,pan:p});for(let i=0;i<8;i++)N('lowpass',300,1,.05,.04*v,200,.4+i*.05,p)},
  kidick:(T,N,v,p)=>{for(let i=0;i<3;i++){T('square',2400,2000,.04,.03*v,i*.3,{filt:3000,q:3,pan:p});T('square',2600,2200,.04,.03*v,i*.3+.08,{filt:3000,q:3,pan:p})}},
  kleek:(T,N,v,p)=>{T('sawtooth',2800,3200,.1,.04*v,0,{filt:3800,q:3,pan:p})},
  knut:(T,N,v,p)=>{T('sine',800,700,.1,.04*v,0,{pan:p});T('sine',1400,1800,.14,.035*v,.3,{pan:p})},
  cheer:(T,N,v,p)=>{T('sawtooth',2200,2000,.16,.035*v,0,{filt:3000,q:3,pan:p})},
  kraa:(T,N,v,p)=>{T('sawtooth',800,700,.4,.05*v,0,{filt:1500,q:3,vib:40,rate:30,pan:p})},
  kirrick:(T,N,v,p)=>{T('sawtooth',2400,2600,.12,.04*v,0,{filt:3200,q:3,vib:200,rate:50,pan:p});T('sawtooth',2600,2200,.06,.04*v,.15,{filt:3200,q:3,pan:p})},
  bark:(T,N,v,p)=>{T('sawtooth',700,600,.12,.035*v,0,{filt:1200,q:2,pan:p})},
  screech:(T,N,v,p)=>{N('bandpass',3000,1,1,.06*v,2600,0,p)},
  peetew:(T,N,v,p)=>{T('sine',3200,3000,.08,.035*v,0,{pan:p});T('sine',3200,2400,.3,.035*v,.12,{pan:p})},
  gurgle:(T,N,v,p)=>{for(let i=0;i<8;i++){const f=1800+((i*37)%5)*300;T('sine',f,f-400,.07,.03*v,i*.09,{vib:80,rate:40,pan:p})}},
  veer:(T,N,v,p)=>{T('sawtooth',2200,1900,.12,.025*v,0,{filt:3000,q:2,pan:p});for(let i=0;i<4;i++)T('square',3200,2900,.03,.02*v,.2+i*.06,{filt:4000,pan:p})},
  quickbeer:(T,N,v,p)=>{T('square',3400,3000,.04,.03*v,0,{filt:4000,pan:p});T('sine',2800,3200,.08,.04*v,.08,{pan:p});T('sine',3200,2600,.12,.04*v,.2,{pan:p});T('square',3400,3000,.05,.04*v,.42,{filt:4000,pan:p})},
  rubberduck:(T,N,v,p)=>{for(let i=0;i<2;i++){T('square',2400,2600,.05,.03*v,i*.3,{filt:3000,q:3,pan:p});T('square',2900,2700,.08,.03*v,i*.3+.07,{filt:3000,q:3,pan:p})}},
  taweeteeo:(T,N,v,p)=>{for(let i=0;i<2;i++){T('sine',3000,3400,.08,.04*v,i*.24,{pan:p});T('sine',3400,3000,.08,.04*v,i*.24+.1,{pan:p})}T('sine',3000,3800,.12,.045*v,.55,{pan:p});T('sine',3800,2800,.18,.04*v,.7,{pan:p})},
  meetcha:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sine',4000,4200,.08,.035*v,i*.13,{pan:p});T('sine',4400,5000,.14,.04*v,.45,{pan:p});T('sine',4600,3600,.16,.04*v,.6,{pan:p})},
  whitecrown:(T,N,v,p)=>{T('sine',3200,3200,.3,.035*v,0,{pan:p});T('sine',3600,3400,.2,.035*v,.35,{pan:p});T('sawtooth',4200,4000,.4,.02*v,.6,{filt:5000,vib:300,rate:60,pan:p})}});

/* ===== 25 more birds (version 36): diving ducks, marsh and shore, grassland, and common songbirds ===== */
for(const a of BY.BIRDS[11])gb(...a);

/* detail hooks */
GB.cavs.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#3a1a10';c.beginPath();c.ellipse(Hc[0]+R*.35,Hc[1]-R*.2,R*.45,R*.35,0,0,TAU);c.fill();
  const ex=Hc[0]+R*.4,ey=Hc[1]-R*.15,er=Math.max(.12,R*.19);c.fillStyle='#c8202a';c.beginPath();c.arc(ex,ey,er*1.2,0,TAU);c.fill();c.fillStyle='#050505';c.beginPath();c.arc(ex,ey,er*.6,0,TAU);c.fill();c.restore()};
GB.wwsc.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#f6f6f3';c.lineWidth=R*.11;c.lineCap='round';c.beginPath();c.arc(Hc[0]+R*.36,Hc[1]-R*.1,R*.2,PI*.1,PI*1.1);c.stroke();c.restore()};
GB.ecdo.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#141414';c.lineWidth=R*.2;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]-R*1.6,Hc[1]+R*.9);c.lineTo(Hc[0]-R*.7,Hc[1]+R*1.25);c.stroke();c.strokeStyle='#f6f4ee';c.lineWidth=R*.08;c.beginPath();c.moveTo(Hc[0]-R*1.55,Hc[1]+R*1.08);c.lineTo(Hc[0]-R*.75,Hc[1]+R*1.4);c.stroke();c.restore()};
GB.limp.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.fillStyle='rgba(246,240,224,.85)';for(let i=0;i<22;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=-.6+(h1-Math.floor(h1))*1.2,v=-.5+(h2-Math.floor(h2))*.75;const q=loc(A*u,B*v);c.beginPath();c.ellipse(q[0],q[1],B*.05,B*.03,0,0,TAU);c.fill()}c.restore()};
GB.wipl.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]+R*.4,Hc[1]-R*.5,R*.4,R*.14,-.1,0,TAU);c.fill();c.restore()};
GB.pesa.draw=function(c,pose,o,g){gbFineStreaks('rgba(90,64,40,.75)',20,.035,[.45,.95,-.1,.3])(c,pose,o,g)};
GB.bkte.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();if(pose==='swim'){c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip()}const p=loc(-A*.55,B*.32);c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(p[0],p[1],A*.18,B*.14,-tilt,0,TAU);c.fill();c.restore()};
GB.crca.draw=function(c,pose,o,g){const {A,B,loc}=g;if(!o.detail)return;c.save();c.strokeStyle='rgba(30,28,26,.75)';c.lineWidth=B*.04;for(let k=0;k<6;k++){const p=loc(A*(.55-k*.05),-B*(.1-k*.08)),q=loc(A*(.75-k*.05),-B*(.1-k*.08));c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.lefl.draw=function(c,pose,o,g){gbWingBars('#f6f6f3','#2a2c26')(c,pose,o,g)};
GB.savs.draw=function(c,pose,o,g){gbFineStreaks('rgba(80,60,40,.8)',22,.035,[.4,.95,-.1,.45])(c,pose,o,g)};
GB.fisp.draw=function(c,pose,o,g){gbWingBars('#f2eee4')(c,pose,o,g)};
GB.fosp.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.fillStyle='rgba(176,86,40,.9)';for(let i=0;i<18;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=.35+(h1-Math.floor(h1))*.55,v=-.1+(h2-Math.floor(h2))*.55;if(u*u*.6+v*v>.75)continue;const q=loc(A*u,B*v);c.beginPath();c.moveTo(q[0],q[1]-B*.05);c.lineTo(q[0]+B*.05,q[1]+B*.04);c.lineTo(q[0]-B*.05,q[1]+B*.04);c.fill()}c.restore()};
GB.oror.draw=function(c,pose,o,g){gbWingBars('#f6f6f3')(c,pose,o,g)};
GB.blgr.draw=function(c,pose,o,g){gbWingBars('#a8582a','#1a1e2a')(c,pose,o,g)};
GB.cmwa.draw=function(c,pose,o,g){gbFineStreaks('rgba(20,20,22,.9)',18,.04,[.4,.92,-.05,.5])(c,pose,o,g)};
Object.assign(GBSONG,{
  meow:(T,N,v,p)=>{T('sawtooth',900,1200,.1,.035*v,0,{filt:1600,q:4,pan:p});T('sawtooth',1200,800,.25,.035*v,.1,{filt:1600,q:4,pan:p})},
  coocook:(T,N,v,p)=>{T('sine',520,500,.15,.05*v,0,{pan:p});T('sine',600,560,.3,.06*v,.22,{pan:p});T('sine',480,440,.18,.05*v,.62,{pan:p})},
  cucucu:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',700,680,.09,.04*v,i*.14,{pan:p})},
  chuckwill:(T,N,v,p)=>{T('sine',900,850,.05,.03*v,0,{pan:p});T('sine',1600,2200,.18,.05*v,.12,{pan:p});T('sine',2400,1800,.16,.05*v,.34,{pan:p});T('sine',1700,1400,.16,.045*v,.54,{pan:p})},
  kreeow:(T,N,v,p)=>{T('sawtooth',1400,2200,.25,.05*v,0,{filt:2600,q:3,pan:p});T('sawtooth',2200,1200,.4,.05*v,.25,{filt:2600,q:3,pan:p})},
  coocoo:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',420,400,.1,.04*v,i*.15,{pan:p})},
  wheet:(T,N,v,p)=>{T('sine',2600,3400,.14,.045*v,0,{pan:p})},
  kerwhit:(T,N,v,p)=>{T('sawtooth',1400,1300,.08,.04*v,0,{filt:2200,q:3,pan:p});T('sawtooth',1500,2000,.12,.04*v,.12,{filt:2600,q:3,pan:p})},
  krrrp:(T,N,v,p)=>{T('sawtooth',1100,1000,.16,.04*v,0,{filt:1800,q:2,vib:200,rate:70,pan:p})},
  kik:(T,N,v,p)=>{T('square',3000,2700,.04,.03*v,0,{filt:3600,q:3,pan:p})},
  rattle:(T,N,v,p)=>{for(let i=0;i<10;i++)N('bandpass',1400,3,.04,.05*v,1200,i*.06,p)},
  chebek:(T,N,v,p)=>{T('square',3600,3200,.03,.03*v,0,{filt:4200,pan:p});T('sawtooth',4200,3400,.07,.035*v,.06,{filt:5000,q:2,pan:p})},
  warble:(T,N,v,p)=>{for(let i=0;i<14;i++){const f=2400+Math.sin(i*1.9)*700+(i>11?600:0);T('sine',f,f+(i%2?300:-200),.07,.03*v,i*.085,{pan:p})}},
  savannah:(T,N,v,p)=>{for(let i=0;i<3;i++)T('square',6000,5800,.03,.015*v,i*.12,{filt:7000,pan:p});T('sawtooth',6500,6200,.35,.015*v,.42,{filt:7500,vib:500,rate:80,pan:p});T('sine',5000,4400,.2,.02*v,.85,{pan:p})},
  pingpong:(T,N,v,p)=>{for(let i=0;i<10;i++){const gap=.26*Math.pow(.84,i);T('sine',3800+i*60,3800+i*60,.06,.035*v,(1-Math.pow(.84,i))/.16*.26,{pan:p})}},
  foxwarble:(T,N,v,p)=>{for(let i=0;i<9;i++){const f=2200+((i*29)%7)*200;T('sine',f,f+(i%2?250:-250),.1,.035*v,i*.12,{pan:p})}},
  chatjumble:(T,N,v,p)=>{T('sine',1600,1600,.12,.04*v,0,{pan:p});T('sawtooth',900,700,.1,.035*v,.3,{filt:1600,q:3,pan:p});for(let i=0;i<4;i++)T('square',2200,2000,.03,.025*v,.6+i*.07,{filt:3000,pan:p});T('sine',2400,1800,.2,.035*v,1.0,{pan:p})},
  ororwarble:(T,N,v,p)=>{for(let i=0;i<11;i++){const f=2600+((i*41)%6)*220;T('sine',f,f+(i%2?300:-300),.06,.03*v,i*.07,{pan:p})}T('sine',3000,2000,.2,.035*v,.82,{pan:p})},
  seetseet:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sine',7600,7800,.08,.02*v,i*.16,{pan:p})}});

/* ===== 25 more birds (version 37): sea ducks, shorebirds, northern birds, and woodland songbirds ===== */
for(const a of BY.BIRDS[12])gb(...a);

/* detail hooks */
GB.blsc.draw=function(c,pose,o,g){const {Hc,R,btip}=g;c.save();c.fillStyle='#f2b81a';c.beginPath();c.ellipse(Hc[0]+R*.96,Hc[1]+R*.02,R*.26,R*.32,-.2,0,TAU);c.fill();c.restore()};
GB.bago.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]+R*.82,Hc[1]+R*.12,R*.11,R*.24,-.3,0,TAU);c.fill();
  if(pose!=='swim'||true){for(let k=0;k<5;k++){const q=loc(A*(.25-k*.14),-B*.22);c.beginPath();c.ellipse(q[0],q[1],B*.07,B*.045,-tilt,0,TAU);c.fill()}}c.restore()};
GB.kira.draw=function(c,pose,o,g){const {A,B,loc}=g;c.save();c.strokeStyle='rgba(246,246,240,.85)';c.lineWidth=B*.035;for(let k=0;k<8;k++){const p=loc(A*(.15-k*.1),B*.12),q=loc(A*(.09-k*.1),B*.4);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.snpl.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();c.fillStyle='#3a3228';c.beginPath();c.ellipse(g.Hc[0]-g.R*.4,g.Hc[1]+g.R*1.0,g.R*.28,g.R*.15,.9,0,TAU);c.fill();c.restore()};
GB.upsa.draw=function(c,pose,o,g){gbFineStreaks('rgba(90,64,40,.75)',18,.03,[.45,.95,-.1,.35])(c,pose,o,g)};
GB.wesa.draw=function(c,pose,o,g){gbFineStreaks('rgba(70,56,44,.7)',10,.03,[.55,.92,-.12,.12])(c,pose,o,g)};
GB.sosa.draw=function(c,pose,o,g){gbFineStreaks('rgba(70,70,60,.7)',14,.03,[.5,.95,-.1,.25])(c,pose,o,g)};
GB.wiph.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();if(pose==='swim'){c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip()}c.strokeStyle='#1e1e20';c.lineWidth=R*.14;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]+R*.05,Hc[1]-R*.08);c.quadraticCurveTo(Hc[0]-R*.45,Hc[1]+R*.1,Hc[0]-R*.4,Hc[1]+R*.95);c.stroke();c.restore()};
GB.palo.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.lineCap='round';for(let k=0;k<5;k++){c.strokeStyle=k%2?'rgba(246,246,243,.9)':'rgba(30,30,36,.85)';c.lineWidth=R*.07;c.beginPath();c.moveTo(Hc[0]-R*(.62+k*.07),Hc[1]+R*.6);c.lineTo(Hc[0]-R*(.5+k*.07),Hc[1]+R*1.3);c.stroke()}c.restore()};
GB.agos.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.strokeStyle='rgba(120,128,138,.7)';c.lineWidth=B*.025;for(let k=0;k<9;k++){const p=loc(A*(.62-k*.06),B*(.02+k*.04)),q=loc(A*(.82-k*.06),B*(.02+k*.04));c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.leow.draw=gbOwlDraw({tufts:.14,streaks:[.5,.3],rim:true});
GB.leow.drawOnly=true;GB.leow.boxPts=GB.easo.boxPts;GB.leow.pinPts=GB.easo.pinPts;
GB.acfl.draw=function(c,pose,o,g){gbWingBars('#e8e0b8','#2a2e22')(c,pose,o,g)};
GB.ytvi.draw=function(c,pose,o,g){gbWingBars('#f6f6f3','#2e3238')(c,pose,o,g)};
GB.bhvi.draw=function(c,pose,o,g){gbWingBars('#f6f6f3','#2e3228')(c,pose,o,g)};
GB.bank.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#6a5a48';c.beginPath();c.ellipse(Hc[0]+R*.05,Hc[1]+R*1.3,R*.62,R*.2,-.15,0,TAU);c.fill();c.restore()};
GB.pufi.draw=function(c,pose,o,g){gbFineStreaks('rgba(160,70,80,.55)',10,.03,[.1,.6,.2,.5])(c,pose,o,g)};
GB.vesp.draw=function(c,pose,o,g){gbFineStreaks('rgba(80,62,44,.8)',20,.032,[.4,.95,-.1,.45])(c,pose,o,g)};
GB.ytwa.draw=function(c,pose,o,g){gbFineStreaks('rgba(20,20,22,.85)',10,.035,[.0,.45,.15,.45])(c,pose,o,g);gbWingBars('#f6f6f3')(c,pose,o,g)};
GB.ocwa.draw=function(c,pose,o,g){gbFineStreaks('rgba(120,124,70,.45)',12,.04,[.45,.9,-.05,.35])(c,pose,o,g)};
Object.assign(GBSONG,{
  cour:(T,N,v,p)=>{T('sine',900,1100,.25,.04*v,0,{pan:p});T('sine',1100,800,.35,.04*v,.25,{pan:p})},
  wolfwhistle:(T,N,v,p)=>{T('sine',1800,4200,.7,.035*v,0,{vib:120,rate:30,pan:p});T('sine',4200,1400,.9,.035*v,.7,{pan:p})},
  nyah:(T,N,v,p)=>{T('sawtooth',600,520,.14,.03*v,0,{filt:1400,q:3,pan:p})},
  hooo:(T,N,v,p)=>{T('sine',340,320,.45,.06*v,0,{pan:p})},
  peetsa:(T,N,v,p)=>{T('square',3800,4600,.06,.03*v,0,{filt:5200,pan:p});T('sawtooth',4400,3200,.1,.035*v,.07,{filt:5200,q:2,pan:p})},
  ytvi:(T,N,v,p)=>{T('sawtooth',1800,2200,.25,.03*v,0,{filt:2800,q:2,vib:150,rate:40,pan:p});T('sawtooth',2300,1700,.3,.03*v,.6,{filt:2800,q:2,vib:150,rate:40,pan:p})},
  buzzchatter:(T,N,v,p)=>{for(let i=0;i<5;i++)T('sawtooth',3000,2800,.08,.025*v,i*.11,{filt:3800,q:2,vib:300,rate:90,pan:p})},
  vesper:(T,N,v,p)=>{T('sine',2600,2600,.35,.035*v,0,{pan:p});T('sine',3200,3200,.35,.035*v,.45,{pan:p});for(let i=0;i<8;i++)T('sine',4200-i*180,4000-i*180,.06,.03*v,.95+i*.08,{pan:p});T('sine',3000,3000,.4,.025*v,1.65,{vib:500,rate:60,pan:p})},
  teedescend:(T,N,v,p)=>{for(let i=0;i<8;i++){const f=5200-i*300;T('sine',f,f-150,.09,.03*v,i*.11,{pan:p})}T('sine',3200,4400,.12,.03*v,.95,{pan:p})},
  tenn:(T,N,v,p)=>{for(let i=0;i<4;i++)T('square',5200,5000,.04,.02*v,i*.13,{filt:6000,pan:p});for(let i=0;i<5;i++)T('square',5800,5600,.03,.02*v,.55+i*.08,{filt:6500,pan:p});for(let i=0;i<10;i++)T('square',6200,6000,.02,.02*v,.98+i*.04,{filt:7000,pan:p})},
  ocwatrill:(T,N,v,p)=>{for(let i=0;i<14;i++){const f=5200-(i>8?(i-8)*250:0);T('sine',f,f-100,.035,.025*v,i*.05,{pan:p})}}});

/* ===== 25 more birds (version 38): swans and eiders, tundra shorebirds, offshore, northern winter birds, and thicket warblers ===== */
for(const a of BY.BIRDS[13])gb(...a);

/* detail hooks */
GB.fuwd.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();if(pose==='swim'){c.beginPath();c.rect(-1e3,-1e3,2e3,1e3);c.clip()}c.strokeStyle='#f2ece0';c.lineWidth=B*.05;c.lineCap='round';for(let k=0;k<4;k++){const p=loc(A*(.15-k*.15),-B*.12),q=loc(A*(.02-k*.15),B*.02);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.trus.draw=function(c,pose,o,g){const {Hc,R,bb}=g;c.save();c.fillStyle='#141414';c.beginPath();c.moveTo(Hc[0]+R*.3,Hc[1]-R*.15);c.lineTo(bb[0]+R*.2,bb[1]-R*.2);c.lineTo(bb[0]+R*.2,bb[1]+R*.2);c.lineTo(Hc[0]+R*.3,Hc[1]+R*.25);c.closePath();c.fill();c.restore()};
GB.kiei.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f2a82a';c.beginPath();c.ellipse(Hc[0]+R*.88,Hc[1]-R*.32,R*.28,R*.2,-.5,0,TAU);c.fill();c.restore()};
GB.grpa.draw=function(c,pose,o,g){const {A,B,loc,tilt}=g;c.save();c.fillStyle='#6a3a22';const q=loc(A*.25,B*.42);c.beginPath();c.ellipse(q[0],q[1],A*.14,B*.12,-tilt,0,TAU);c.fill();c.restore()};
GB.amgp.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.moveTo(Hc[0]+R*.95,Hc[1]-R*.3);c.quadraticCurveTo(Hc[0]+R*.2,Hc[1]-R*.75,Hc[0]-R*.35,Hc[1]-R*.25);c.quadraticCurveTo(Hc[0]-R*.7,Hc[1]+R*.6,Hc[0]-R*.45,Hc[1]+R*1.55);c.quadraticCurveTo(Hc[0]-R*.15,Hc[1]+R*1.6,Hc[0]-R*.2,Hc[1]+R*1.25);c.quadraticCurveTo(Hc[0]-R*.45,Hc[1]+R*.55,Hc[0]-R*.1,Hc[1]-R*.15);c.quadraticCurveTo(Hc[0]+R*.35,Hc[1]-R*.48,Hc[0]+R*.95,Hc[1]-R*.15);c.closePath();c.fill();c.restore()};
GB.wrsa.draw=function(c,pose,o,g){gbFineStreaks('rgba(80,64,50,.65)',14,.03,[.1,.85,.12,.3])(c,pose,o,g)};
GB.buow.draw=gbOwlDraw({rim:true,bars:true});
GB.buow.drawOnly=true;GB.buow.boxPts=GB.easo.boxPts;GB.buow.pinPts=GB.easo.pinPts;
GB.alfl.draw=function(c,pose,o,g){gbWingBars('#e8e8d8','#2a2c22')(c,pose,o,g)};
GB.nshr.draw=function(c,pose,o,g){const {A,B,loc}=g;c.save();c.fillStyle='#f6f6f3';const p=loc(-A*.2,-B*.05);c.beginPath();c.ellipse(p[0],p[1],B*.13,B*.09,0,0,TAU);c.fill();if(o.detail){c.strokeStyle='rgba(140,146,154,.6)';c.lineWidth=B*.025;for(let k=0;k<6;k++){const a=loc(A*(.5-k*.07),B*(.05+k*.05)),b2=loc(A*(.72-k*.07),B*(.05+k*.05));c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b2[0],b2[1]);c.stroke()}}c.restore()};
GB.sewr.draw=function(c,pose,o,g){gbFineStreaks('rgba(246,240,224,.8)',12,.03,[-.4,.3,-.4,-.1])(c,pose,o,g)};
GB.gcth.draw=GB.swth.draw;
GB.repo.draw=function(c,pose,o,g){{const {Hc,R}=g;c.save();c.fillStyle='#1e1a16';c.beginPath();c.ellipse(Hc[0]+R*.62,Hc[1]+R*.42,R*.2,R*.14,.2,0,TAU);c.fill();c.restore()}gbWingBars('#f2efe8','#2a2622')(c,pose,o,g);gbFineStreaks('rgba(70,60,48,.75)',14,.03,[.1,.7,.15,.5])(c,pose,o,g)};
GB.grsp.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f2c02a';c.beginPath();c.ellipse(Hc[0]+R*.62,Hc[1]-R*.25,R*.14,R*.1,0,0,TAU);c.fill();c.restore()};
GB.lasp.draw=function(c,pose,o,g){{const {Hc,R}=g;c.save();c.fillStyle='#a8582a';c.beginPath();c.ellipse(Hc[0]-R*.2,Hc[1]+R*.15,R*.36,R*.22,.1,0,TAU);c.fill();c.strokeStyle='#2a2420';c.lineWidth=R*.08;c.beginPath();c.moveTo(Hc[0]+R*.55,Hc[1]+R*.45);c.lineTo(Hc[0]+R*.1,Hc[1]+R*.62);c.stroke();c.restore()}const {A,B,loc}=g;c.save();c.fillStyle='#1e1a16';const q=loc(A*.72,B*.15);c.beginPath();c.arc(q[0],q[1],B*.08,0,TAU);c.fill();c.restore()};
GB.atsp.draw=function(c,pose,o,g){const {A,B,loc}=g;c.save();c.fillStyle='#3a3430';const q=loc(A*.72,B*.12);c.beginPath();c.arc(q[0],q[1],B*.07,0,TAU);c.fill();c.restore();gbWingBars('#f2efe8')(c,pose,o,g)};
GB.lowa.draw=function(c,pose,o,g){gbFineStreaks('rgba(60,52,40,.9)',20,.04,[.4,.92,0,.5])(c,pose,o,g)};
GB.bwwa.draw=function(c,pose,o,g){gbWingBars('#f6f6f3','#4a5868')(c,pose,o,g)};
GB.cawa.draw=function(c,pose,o,g){gbFineStreaks('rgba(20,22,26,.9)',12,.04,[.55,.92,-.05,.2])(c,pose,o,g)};
Object.assign(GBSONG,{
  trumpet:(T,N,v,p)=>{T('sawtooth',360,380,.2,.05*v,0,{filt:900,q:3,pan:p});T('sawtooth',420,400,.35,.05*v,.25,{filt:900,q:3,pan:p})},
  reebeeo:(T,N,v,p)=>{T('sawtooth',2600,3200,.12,.03*v,0,{filt:4000,q:2,vib:300,rate:70,pan:p});T('sawtooth',3600,3800,.16,.035*v,.13,{filt:4500,q:2,vib:300,rate:70,pan:p});T('sine',3000,2600,.1,.03*v,.32,{pan:p})},
  chapchap:(T,N,v,p)=>{for(let i=0;i<3;i++)T('square',4200,4000,.03,.02*v,i*.2,{filt:5000,pan:p});for(let i=0;i<10;i++)T('square',4600,4400,.02,.02*v,.65+i*.04,{filt:5500,pan:p})},
  grasshopper:(T,N,v,p)=>{T('square',7000,6800,.02,.012*v,0,{filt:8000,pan:p});T('square',7000,6800,.02,.012*v,.12,{filt:8000,pan:p});N('highpass',7500,2,1.1,.02*v,7500,.3,p)},
  beebzz:(T,N,v,p)=>{T('sawtooth',5200,5200,.3,.02*v,0,{filt:6500,vib:200,rate:60,pan:p});T('sawtooth',4200,4200,.35,.02*v,.4,{filt:5500,vib:600,rate:110,pan:p})},
  churry:(T,N,v,p)=>{for(let i=0;i<5;i++){T('sine',2800,3400,.08,.035*v,i*.2,{pan:p});T('sine',3400,2600,.08,.035*v,i*.2+.08,{pan:p})}},
  chichi:(T,N,v,p)=>{for(let i=0;i<12;i++){const f=5200-(i>6?(i-6)*180:0);T('square',f,f-100,.03,.018*v,i*.065,{filt:6200,pan:p})}}});

/* ===== 25 more birds (version 39): the last non-rare East species, plus five regular rarities ===== */
for(const a of BY.BIRDS[14])gb(...a);

/* detail hooks */
GB.egyg.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt}=g;c.save();c.fillStyle='#6a3e22';c.beginPath();c.ellipse(Hc[0]+R*.35,Hc[1]-R*.12,R*.42,R*.34,0,0,TAU);c.fill();c.fillStyle='#e8a040';c.beginPath();c.arc(Hc[0]+R*.38,Hc[1]-R*.12,R*.15,0,TAU);c.fill();c.fillStyle='#141414';c.beginPath();c.arc(Hc[0]+R*.39,Hc[1]-R*.12,R*.08,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(Hc[0]+R*.42,Hc[1]-R*.16,R*.03,0,TAU);c.fill();c.fillStyle='#6a3e22';const q=loc(A*.72,B*.15);c.beginPath();c.ellipse(q[0],q[1],B*.1,B*.08,-tilt,0,TAU);c.fill();if(pose!=='swim'||true){c.strokeStyle='#f6f6f3';c.lineWidth=B*.06;c.lineCap='round';const a1=loc(A*.35,-B*.12),a2=loc(-A*.25,-B*.02);c.beginPath();c.moveTo(a1[0],a1[1]);c.lineTo(a2[0],a2[1]);c.stroke()}c.restore()};
GB.stgr.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.strokeStyle='rgba(110,86,60,.85)';c.lineWidth=B*.035;for(let i=0;i<10;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=.3+(h1-Math.floor(h1))*.55,v=-.05+(h2-Math.floor(h2))*.4;const q=loc(A*u,B*v);c.beginPath();c.moveTo(q[0]-B*.05,q[1]-B*.04);c.lineTo(q[0],q[1]+B*.02);c.lineTo(q[0]+B*.05,q[1]-B*.04);c.stroke()}c.restore()};
GB.basa.draw=function(c,pose,o,g){gbFineStreaks('rgba(90,72,50,.6)',12,.03,[.5,.92,-.12,.15])(c,pose,o,g)};
GB.brte.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#f6f6f3';c.lineWidth=R*.12;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]+R*.85,Hc[1]-R*.15);c.lineTo(Hc[0]-R*.1,Hc[1]-R*.35);c.stroke();c.restore()};
GB.nanp.draw=function(c,pose,o,g){const {A,B,loc,tilt,bb,R}=g;c.save();c.fillStyle='#1e1e1e';c.beginPath();c.moveTo(bb[0]-R*.05,bb[1]-R*.3);c.quadraticCurveTo(bb[0]+R*.55,bb[1]-R*.35,bb[0]+R*.5,bb[1]+R*.3);c.quadraticCurveTo(bb[0]+R*.38,bb[1]+R*.1,bb[0]-R*.05,bb[1]+R*.2);c.closePath();c.fill();c.fillStyle='#c8302a';const q=loc(A*.05,B*.78);c.beginPath();c.ellipse(q[0],q[1],A*.12,B*.12,-tilt,0,TAU);c.fill();c.restore()};
GB.wifl.draw=function(c,pose,o,g){gbWingBars('#d8d4c0','#2a2a22')(c,pose,o,g)};
GB.rwbu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#141414';c.beginPath();c.moveTo(Hc[0]-R*.6,Hc[1]-R*.45);c.quadraticCurveTo(Hc[0]-R*.3,Hc[1]-R*1.1,Hc[0]+R*.15,Hc[1]-R*1.55);c.quadraticCurveTo(Hc[0]+R*.2,Hc[1]-R*1.0,Hc[0]+R*.5,Hc[1]-R*.7);c.closePath();c.fill();c.fillStyle='#e2343a';c.beginPath();c.ellipse(Hc[0]+R*.15,Hc[1]+R*.05,R*.16,R*.12,0,0,TAU);c.fill();c.fillStyle='#141414';c.beginPath();c.ellipse(Hc[0]+R*.2,Hc[1]+R*.62,R*.38,R*.1,.3,0,TAU);c.fill();c.restore()};
GB.etsp.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#141414';c.beginPath();c.ellipse(Hc[0]-R*.12,Hc[1]+R*.18,R*.16,R*.14,0,0,TAU);c.fill();c.beginPath();c.ellipse(Hc[0]+R*.4,Hc[1]+R*.78,R*.26,R*.2,.3,0,TAU);c.fill();c.restore();gbWingBars('#f2efe8')(c,pose,o,g)};
GB.wwcr.draw=function(c,pose,o,g){const {bb,R}=g;c.save();c.fillStyle='#5e5852';c.beginPath();c.moveTo(bb[0]-R*.05,bb[1]-R*.24);c.quadraticCurveTo(bb[0]+R*.62,bb[1]-R*.3,bb[0]+R*.74,bb[1]+R*.3);c.quadraticCurveTo(bb[0]+R*.42,bb[1]+R*.02,bb[0]-R*.05,bb[1]+R*.04);c.closePath();c.fill();c.fillStyle='#8a847c';c.beginPath();c.moveTo(bb[0]-R*.05,bb[1]+R*.22);c.quadraticCurveTo(bb[0]+R*.55,bb[1]+R*.32,bb[0]+R*.6,bb[1]-R*.36);c.quadraticCurveTo(bb[0]+R*.35,bb[1]+R*.06,bb[0]-R*.05,bb[1]+R*.04);c.closePath();c.fill();c.restore();gbWingBars('#f6f6f3','#141212')(c,pose,o,g)};
GB.ccsp.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#b08a60';c.strokeStyle='rgba(90,64,44,.9)';c.lineWidth=R*.06;c.beginPath();c.ellipse(Hc[0]-R*.22,Hc[1]+R*.25,R*.4,R*.27,0,0,TAU);c.fill();c.stroke();c.restore()};
GB.lcsp.draw=function(c,pose,o,g){gbFineStreaks('rgba(70,50,30,.7)',10,.03,[.2,.6,.25,.45])(c,pose,o,g)};
GB.hesp.draw=function(c,pose,o,g){gbFineStreaks('rgba(40,30,20,.85)',16,.035,[.4,.92,-.05,.45])(c,pose,o,g)};
GB.wewa.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#2a2420';c.lineWidth=R*.13;c.lineCap='round';for(const dy of [-.45,-.15]){c.beginPath();c.moveTo(Hc[0]+R*.7,Hc[1]+R*dy);c.lineTo(Hc[0]-R*.7,Hc[1]+R*(dy-.05));c.stroke()}c.restore()};
GB.bbwa.draw=function(c,pose,o,g){gbWingBars('#f6f6f3','#3a3e44')(c,pose,o,g)};
GB.rcwo.draw=function(c,pose,o,g){const {Hc,R,A,B,loc}=g;c.save();c.strokeStyle='#f6f5f0';c.lineWidth=B*.05;for(let k=0;k<6;k++){const p=loc(A*(.3-k*.13),-B*.32),q=loc(A*(.24-k*.13),-B*.1);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.fillStyle='#f6f5f0';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]+R*.15,R*.55,R*.32,0,0,TAU);c.fill();c.restore()};
GB.cerw.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#2a4a7a';c.lineWidth=R*.14;c.beginPath();c.moveTo(Hc[0]+R*.5,Hc[1]+R*1.05);c.quadraticCurveTo(Hc[0]+R*.1,Hc[1]+R*1.25,Hc[0]-R*.3,Hc[1]+R*1.05);c.stroke();c.restore();gbWingBars('#f6f6f3','#2a4a6a')(c,pose,o,g)};
Object.assign(GBSONG,{
  fitzbew:(T,N,v,p)=>{T('sawtooth',3800,4600,.1,.03*v,0,{filt:5200,q:2,vib:400,rate:90,pan:p});T('sine',3600,2800,.12,.03*v,.13,{pan:p})},
  tsilick:(T,N,v,p)=>{T('square',6200,6800,.05,.02*v,0,{filt:7500,pan:p});T('square',7200,5800,.06,.02*v,.07,{filt:7500,pan:p})}});

/* ===== 25 more birds (version 40): the East's rarities ===== */
for(const a of BY.BIRDS[15])gb(...a);

/* detail hooks */
GB.amfl.draw=function(c,pose,o,g){const {bb,R}=g;c.save();c.translate(bb[0],bb[1]);c.scale(1.5,1.5);c.translate(-bb[0],-bb[1]);c.fillStyle='#f2e0d8';c.beginPath();c.moveTo(bb[0]-R*.1,bb[1]-R*.45);c.quadraticCurveTo(bb[0]+R*1.1,bb[1]-R*.55,bb[0]+R*1.3,bb[1]+R*.1);c.lineTo(bb[0]+R*1.15,bb[1]+R*.35);c.quadraticCurveTo(bb[0]+R*.7,bb[1]+R*.25,bb[0]-R*.1,bb[1]+R*.35);c.closePath();c.fill();c.fillStyle='#141414';c.beginPath();c.moveTo(bb[0]+R*.85,bb[1]-R*.4);c.quadraticCurveTo(bb[0]+R*1.2,bb[1]-R*.4,bb[0]+R*1.3,bb[1]+R*.1);c.lineTo(bb[0]+R*1.15,bb[1]+R*.35);c.quadraticCurveTo(bb[0]+R*1.0,bb[1]+R*.2,bb[0]+R*.75,bb[1]+R*.25);c.closePath();c.fill();c.restore()};
GB.sban.draw=function(c,pose,o,g){const {bb,R}=g;c.save();c.fillStyle='#141414';c.beginPath();c.moveTo(bb[0]-R*.1,bb[1]-R*.6);c.quadraticCurveTo(bb[0]+R*.35,bb[1]-R*.75,bb[0]+R*.85,bb[1]+R*.05);c.lineTo(bb[0]+R*.8,bb[1]+R*.15);c.lineTo(bb[0]-R*.1,bb[1]+R*.3);c.closePath();c.fill();c.restore()};
GB.yera.draw=function(c,pose,o,g){const {A,B,loc}=g;c.save();c.strokeStyle='rgba(246,240,224,.75)';c.lineWidth=B*.025;for(let k=0;k<9;k++){const p=loc(A*(.2-k*.09),-B*.3),q=loc(A*(.16-k*.09),-B*.1);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.blra.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.fillStyle='rgba(246,240,230,.85)';for(let i=0;i<14;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=-.6+(h1-Math.floor(h1))*1.0,v=-.4+(h2-Math.floor(h2))*.4;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*.025,0,TAU);c.fill()}c.restore()};
GB.bhgu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#2a2a2a';c.beginPath();c.arc(Hc[0]-R*.38,Hc[1]+R*.12,R*.14,0,TAU);c.fill();c.restore()};
GB.ligu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#3a3a3e';c.beginPath();c.arc(Hc[0]-R*.35,Hc[1]+R*.12,R*.13,0,TAU);c.fill();c.restore()};
GB.wttr.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#141414';c.lineWidth=R*.15;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]+R*.5,Hc[1]-R*.12);c.quadraticCurveTo(Hc[0]+R*.05,Hc[1]-R*.25,Hc[0]-R*.55,Hc[1]+R*.05);c.stroke();c.restore()};
GB.mabo.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#1a1a1c';c.beginPath();c.ellipse(Hc[0]+R*.5,Hc[1]+R*.05,R*.5,R*.36,.1,0,TAU);c.fill();c.fillStyle='#f2d23a';c.beginPath();c.arc(Hc[0]+R*.38,Hc[1]-R*.08,R*.12,0,TAU);c.fill();c.fillStyle='#141414';c.beginPath();c.arc(Hc[0]+R*.38,Hc[1]-R*.08,R*.06,0,TAU);c.fill();c.restore()};
GB.bcpe.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#141416';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]-R*.35,R*.8,R*.5,0,PI,TAU);c.fill();c.beginPath();c.ellipse(Hc[0]+R*.38,Hc[1]-R*.05,R*.22,R*.2,0,0,TAU);c.fill();c.restore()};
GB.nhow.draw=gbOwlDraw({rim:true,bars:[.5,9,.04]});
GB.nhow.drawOnly=true;GB.nhow.boxPts=GB.easo.boxPts;GB.nhow.pinPts=GB.easo.pinPts;
GB.ggow.draw=gbOwlDraw({rim:true,streaks:[.5,.25],throat:true});
GB.ggow.drawOnly=true;GB.ggow.boxPts=GB.easo.boxPts;GB.ggow.pinPts=GB.easo.pinPts;
GB.boow.draw=gbOwlDraw({rim:true,streaks:[.5,.2]});
GB.boow.drawOnly=true;GB.boow.boxPts=GB.easo.boxPts;GB.boow.pinPts=GB.easo.pinPts;
GB.gyrf.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.fillStyle='rgba(90,96,104,.6)';for(let i=0;i<14;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=.35+(h1-Math.floor(h1))*.5,v=0+(h2-Math.floor(h2))*.4;const q=loc(A*u,B*v);c.beginPath();c.ellipse(q[0],q[1],B*.035,B*.025,0,0,TAU);c.fill()}c.restore()};
GB.bith.draw=GB.swth.draw;
GB.ssts.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#8a8e92';c.beginPath();c.ellipse(Hc[0]+R*.05,Hc[1]+R*.25,R*.4,R*.28,0,0,TAU);c.fill();c.restore();gbFineStreaks('rgba(50,40,30,.9)',16,.035,[.4,.92,-.05,.4])(c,pose,o,g)};
GB.sbor.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.fillStyle='#141414';for(let i=0;i<7;i++){const q=loc(A*(.6+(i%3)*.08),B*(.05+Math.floor(i/3)*.08+(i%2)*.03));c.beginPath();c.arc(q[0],q[1],B*.04,0,TAU);c.fill()}c.restore()};
GB.kiwa.draw=function(c,pose,o,g){gbFineStreaks('rgba(20,22,26,.8)',10,.035,[.2,.6,.15,.4])(c,pose,o,g)};

/* ===== the last two East species (version 41): 402 in all ===== */
for(const a of BY.BIRDS[16])gb(...a);

/* detail hooks */
GB.rbtr.draw=function(c,pose,o,g){const {Hc,R,A,B,loc}=g;c.save();c.strokeStyle='#141414';c.lineWidth=R*.15;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]+R*.5,Hc[1]-R*.12);c.quadraticCurveTo(Hc[0]+R*.05,Hc[1]-R*.25,Hc[0]-R*.55,Hc[1]+R*.05);c.stroke();if(o.detail){c.strokeStyle='rgba(30,30,32,.8)';c.lineWidth=B*.03;for(let k=0;k<9;k++){const p=loc(A*(.3-k*.1),-B*.4),q=loc(A*(.25-k*.1),-B*.18);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}}c.restore()};

/* ===== CB-1 (version 65): the first 25 Central birds that are not on the East list ===== */
for(const a of BY.BIRDS[17])gb(...a);

/* detail hooks */
GB.gwfg.draw=function(c,pose,o,g){const {Hc,R,A,B,loc,tilt,bb}=g;c.save();c.fillStyle='#f6f4ee';c.beginPath();c.ellipse(bb[0]-R*.08,bb[1],R*.16,R*.36,0,0,TAU);c.fill();
  if(pose!=='swim'){c.strokeStyle='#1e1a16';c.lineWidth=B*.07;c.lineCap='round';for(const u of[.05,-.15,-.35]){const p=loc(A*(u+.1),B*.55),q=loc(A*u,B*.85);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}}c.restore()};
GB.mudu.draw=function(c,pose,o,g){const {Hc,R,A,B,loc}=g;c.save();c.fillStyle='#f2f1ec';{const q=loc(A*.25,-B*.25);c.beginPath();c.ellipse(q[0],q[1],A*.16,B*.16,0,0,TAU);c.fill()}c.fillStyle='#c8302a';c.beginPath();c.ellipse(Hc[0]+R*.45,Hc[1]-R*.05,R*.42,R*.32,0,0,TAU);c.fill();c.beginPath();c.arc(Hc[0]+R*.85,Hc[1]-R*.35,R*.16,0,TAU);c.fill();
  c.fillStyle='#e8c83a';c.beginPath();c.arc(Hc[0]+R*.42,Hc[1]-R*.12,R*.11,0,TAU);c.fill();c.fillStyle='#141414';c.beginPath();c.arc(Hc[0]+R*.42,Hc[1]-R*.12,R*.055,0,TAU);c.fill();c.restore()};
GB.plch.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#d84a3a';c.beginPath();c.ellipse(Hc[0]+R*.35,Hc[1]+R*.85,R*.2,R*.32,.2,0,TAU);c.fill();c.restore()};
GB.scqu.draw=function(c,pose,o,g){GB.scqu.draw2(c,pose,o,g);if(!o.detail)return;const {A,B,loc}=g;c.save();c.strokeStyle='rgba(40,44,52,.75)';c.lineWidth=B*.03;
  for(let i=0;i<5;i++)for(let j=0;j<4;j++){const u=.62-i*.15+(j%2)*.07,v=.05+j*.15;if(u*u+v*v>.62)continue;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*.07,.3,PI-.3);c.stroke()}c.restore()};
GB.scqu.drawCrest=1;GB.scqu.draw2=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#8a7e6a';c.beginPath();c.moveTo(Hc[0]-R*.3,Hc[1]-R*.8);c.quadraticCurveTo(Hc[0]-R*.2,Hc[1]-R*1.45,Hc[0]+R*.15,Hc[1]-R*1.25);c.quadraticCurveTo(Hc[0]+R*.05,Hc[1]-R*.95,Hc[0]+R*.2,Hc[1]-R*.75);c.closePath();c.fill();c.fillStyle='#f6f2e6';c.beginPath();c.arc(Hc[0]-R*.02,Hc[1]-R*1.3,R*.17,0,TAU);c.fill();c.restore()};
GB.moqu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#141414';c.beginPath();c.moveTo(Hc[0]+R*.2,Hc[1]-R*.55);c.quadraticCurveTo(Hc[0]-R*.35,Hc[1]+R*.1,Hc[0]+R*.05,Hc[1]+R*.6);c.lineTo(Hc[0]+R*.3,Hc[1]+R*.45);c.quadraticCurveTo(Hc[0],Hc[1]+R*.05,Hc[0]+R*.35,Hc[1]-R*.4);c.closePath();c.fill();
  c.beginPath();c.ellipse(Hc[0]+R*.62,Hc[1]+R*.32,R*.24,R*.14,.5,0,TAU);c.fill();c.beginPath();c.ellipse(Hc[0]-R*.35,Hc[1]-R*.1,R*.16,R*.28,0,0,TAU);c.fill();
  c.fillStyle='#3a2a1e';c.beginPath();c.arc(Hc[0]+R*.42,Hc[1]-R*.15,R*.1,0,TAU);c.fill();if(o.detail){const {A,B,loc}=g;c.fillStyle='#f6f6f3';for(let i=0;i<14;i++){const h1=Math.sin(i*12.9898)*43758.5453,h2=Math.sin(i*78.233)*43758.5453,u=-.45+(h1-Math.floor(h1))*.9,v=.15+(h2-Math.floor(h2))*.5;if(u*u+v*v>.6)continue;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*.04,0,TAU);c.fill()}}c.restore()};
GB.grsg.draw=function(c,pose,o,g){const {A,B,loc,Hc,R}=g;c.save();c.fillStyle='#141414';const q=loc(A*.05,B*.62);c.beginPath();c.ellipse(q[0],q[1],A*.32,B*.3,0,0,TAU);c.fill();
  c.fillStyle='#f6f4ee';const p=loc(A*.62,B*.32);c.beginPath();c.ellipse(p[0],p[1],A*.2,B*.36,0,0,TAU);c.fill();c.restore()};
GB.grpc.draw=function(c,pose,o,g){const {A,B,loc,Hc,R}=g;c.save();c.fillStyle='#e8902a';c.beginPath();c.ellipse(Hc[0]-R*.2,Hc[1]+R*1.1,R*.35,R*.28,0,0,TAU);c.fill();
  c.fillStyle='#2a221c';c.beginPath();c.ellipse(Hc[0]-R*.7,Hc[1]-R*.4,R*.12,R*.55,-.5,0,TAU);c.fill();if(o.detail){c.strokeStyle='rgba(60,40,24,.7)';c.lineWidth=B*.045;for(let k=0;k<7;k++){const p=loc(A*(.7-k*.17),B*.05),q=loc(A*(.66-k*.17),B*.7);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}}c.restore()};
GB.lepc.draw=function(c,pose,o,g){const {A,B,loc,Hc,R}=g;c.save();c.fillStyle='#d8482a';c.beginPath();c.ellipse(Hc[0]-R*.2,Hc[1]+R*1.1,R*.3,R*.24,0,0,TAU);c.fill();
  c.fillStyle='#3a2e24';c.beginPath();c.ellipse(Hc[0]-R*.7,Hc[1]-R*.4,R*.1,R*.5,-.5,0,TAU);c.fill();if(o.detail){c.strokeStyle='rgba(90,64,40,.6)';c.lineWidth=B*.035;for(let k=0;k<8;k++){const p=loc(A*(.7-k*.15),B*.05),q=loc(A*(.66-k*.15),B*.7);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}}c.restore()};
GB.eagr.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#e0a82a';for(let k=0;k<5;k++){const a=-.5+k*.22;c.beginPath();c.moveTo(Hc[0]+R*.3,Hc[1]-R*.05);c.quadraticCurveTo(Hc[0]-R*.2,Hc[1]+R*(a*.6),Hc[0]-R*.75,Hc[1]+R*(a+.35));c.lineTo(Hc[0]-R*.65,Hc[1]+R*(a+.5));c.quadraticCurveTo(Hc[0]-R*.1,Hc[1]+R*(a*.5+.15),Hc[0]+R*.3,Hc[1]+R*.08);c.closePath();c.fill()}
  c.fillStyle='#e2302a';c.beginPath();c.arc(Hc[0]+R*.4,Hc[1]-R*.15,R*.1,0,TAU);c.fill();c.restore()};
GB.indo.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.strokeStyle='rgba(60,54,46,.7)';c.lineWidth=B*.035;
  for(let i=0;i<8;i++)for(let j=0;j<5;j++){const u=.7-i*.2+(j%2)*.1,v=-.6+j*.28;if(u*u+v*v>.55)continue;const q=loc(A*u,B*v);c.beginPath();c.arc(q[0],q[1],B*.08,.25,PI-.25);c.stroke()}c.restore()};
GB.gban.draw=function(c,pose,o,g){const {bb,R}=g;c.save();c.fillStyle='#141414';c.beginPath();c.moveTo(bb[0]-R*.1,bb[1]-R*.5);c.quadraticCurveTo(bb[0]+R*.45,bb[1]-R*.6,bb[0]+R*.8,bb[1]+R*.05);c.lineTo(bb[0]+R*.75,bb[1]+R*.15);c.lineTo(bb[0]-R*.1,bb[1]+R*.3);c.closePath();c.fill();
  c.strokeStyle='#4a4a4e';c.lineWidth=R*.05;for(const k of[-.3,-.12,.06]){c.beginPath();c.moveTo(bb[0]+R*.02,bb[1]+R*k);c.quadraticCurveTo(bb[0]+R*.35,bb[1]+R*(k-.12),bb[0]+R*.62,bb[1]+R*(k+.12));c.stroke()}c.restore()};
GB.grro.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#3a6ab8';c.beginPath();c.ellipse(Hc[0]-R*.05,Hc[1]-R*.1,R*.2,R*.14,0,0,TAU);c.fill();c.fillStyle='#d8482a';c.beginPath();c.ellipse(Hc[0]-R*.32,Hc[1]-R*.08,R*.13,R*.1,0,0,TAU);c.fill();c.restore();
  gbFineStreaks('rgba(40,30,22,.75)',14,.035,[.3,.9,-.1,.4])(c,pose,o,g)};
GB.wtsw.draw=function(c,pose,o,g){const {A,B,loc}=g;c.save();c.fillStyle='#f6f4ee';const q=loc(A*.25,B*.55);c.beginPath();c.ellipse(q[0],q[1],A*.42,B*.18,0,0,TAU);c.fill();const r=loc(-A*.55,B*.1);c.beginPath();c.ellipse(r[0],r[1],A*.12,B*.2,0,0,TAU);c.fill();c.restore()};
GB.btmg.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#f6f6f3';c.lineWidth=R*.08;c.lineCap='round';c.beginPath();c.moveTo(Hc[0]+R*.15,Hc[1]-R*.05);c.lineTo(Hc[0]-R*.5,Hc[1]+R*.05);c.stroke();c.restore()};
Object.assign(GBSONG,{
  rossgoose:(T,N,v,p)=>{for(let i=0;i<4;i++)T('sawtooth',980,860,.09,.04*v,i*.2+Math.random()*.05,{filt:2200,q:3,pan:p})},
  laughgoose:(T,N,v,p)=>{const f=[760,900,820,940];for(let i=0;i<4;i++)T('sawtooth',f[i],f[i]*.86,.11,.05*v,i*.16,{filt:1800,q:4,pan:p})},
  cackhonk:(T,N,v,p)=>{for(let i=0;i<5;i++)T('sawtooth',640,560,.08,.045*v,i*.17,{filt:1500,q:3,pan:p})},
  chatterteal:(T,N,v,p)=>{for(let i=0;i<9;i++)N('bandpass',1400,3,.04,.05*v,1200,i*.05,p)},
  chachalaca:(T,N,v,p)=>{for(let r=0;r<3;r++){const t=r*.75,f=520+Math.random()*80;T('sawtooth',f,f*.9,.1,.06*v,t,{filt:1400,q:4,pan:p});T('sawtooth',f,f*.9,.1,.06*v,t+.14,{filt:1400,q:4,pan:p});T('sawtooth',f*1.25,f,.18,.07*v,t+.3,{filt:1600,q:4,pan:p});T('sawtooth',f*.95,f*.85,.12,.05*v,t+.5,{filt:1400,q:4,pan:p})}},
  pecos:(T,N,v,p)=>{for(let r=0;r<2;r++){T('square',1100,1300,.1,.03*v,r*.7,{filt:2000,q:3,pan:p});T('square',1500,1250,.14,.035*v,r*.7+.13,{filt:2200,q:3,pan:p})}},
  montezuma:(T,N,v,p)=>{T('sine',3200,1400,1.1,.05*v,0,{vib:120,rate:14,pan:p})},
  sagepop:(T,N,v,p)=>{T('sine',140,110,.25,.05*v,0,{pan:p});N('lowpass',600,1,.06,.12*v,300,.32,p);N('lowpass',500,1,.05,.1*v,250,.5,p);T('sine',900,700,.15,.03*v,.6,{pan:p})},
  boom:(T,N,v,p)=>{T('sine',300,320,.35,.08*v,0,{pan:p});T('sine',320,340,.3,.08*v,.38,{pan:p});T('sine',340,280,.7,.09*v,.72,{vib:8,rate:6,pan:p})},
  bubble:(T,N,v,p)=>{for(let i=0;i<6;i++)T('sine',520+(i%2)*80,460,.09,.06*v,i*.12,{pan:p})},
  beeptrill:(T,N,v,p)=>{T('square',1700,1650,.12,.03*v,0,{filt:2600,q:3,pan:p});for(let i=0;i<12;i++)T('sine',2200+i*40,2100+i*40,.04,.04*v,.25+i*.05,{pan:p})},
  pooeep:(T,N,v,p)=>{T('sine',1600,2600,.22,.05*v,0,{pan:p})},
  kreekreek:(T,N,v,p)=>{for(const t of[0,.22]){N('bandpass',2400,2,.05,.06*v,2000,t,p);T('sawtooth',2200,2600,.12,.04*v,t+.04,{filt:3200,q:4,pan:p})}},
  kreek:(T,N,v,p)=>{N('bandpass',2400,2,.05,.06*v,2000,0,p);T('sawtooth',2000,2800,.2,.045*v,.04,{filt:3400,q:4,pan:p})},
  upcupcoo:(T,N,v,p)=>{T('sine',380,360,.9,.07*v,0,{pan:p});for(let i=0;i<4;i++)T('sine',420,400,.15,.06*v,1.1+i*.2,{pan:p})},
  nohope:(T,N,v,p)=>{T('sine',560,580,.25,.06*v,0,{pan:p});T('sine',500,470,.35,.06*v,.32,{pan:p})},
  bottlecoo:(T,N,v,p)=>{T('sine',300,310,.2,.05*v,0,{pan:p});T('sine',320,260,.9,.08*v,.3,{vib:4,rate:5,pan:p})},
  teeho:(T,N,v,p)=>{for(let r=0;r<3;r++){T('sine',2400,2600,.1,.05*v,r*.5,{pan:p});T('sine',1500,1300,.15,.05*v,r*.5+.12,{pan:p})}},
  roadrunner:(T,N,v,p)=>{for(let i=0;i<5;i++)T('sine',520-i*45,500-i*45,.25+i*.04,.06*v,i*.42,{pan:p})},
  toadtrill:(T,N,v,p)=>{for(let i=0;i<40;i++)T('sine',900,860,.03,.04*v,i*.045,{pan:p})},
  pauraque:(T,N,v,p)=>{T('sine',1400,1300,.06,.03*v,0,{pan:p});T('sine',1400,1300,.06,.03*v,.1,{pan:p});T('sine',1300,2600,.5,.06*v,.25,{pan:p});T('sine',2600,1900,.2,.05*v,.75,{pan:p})},
  poorwill:(T,N,v,p)=>{T('sine',1700,1800,.15,.04*v,0,{pan:p});T('sine',1500,2000,.22,.05*v,.2,{pan:p})},
  jeejee:(T,N,v,p)=>{for(let i=0;i<9;i++)T('sawtooth',5200-i*260,5000-i*260,.05,.025*v,i*.07,{filt:6500,q:2,pan:p})}});

/* ===== CB-2 (version 66): Central birds 26-50 ===== */
for(const a of BY.BIRDS[18])gb(...a);
/* detail hooks */
GB.luhu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#a02a8a';c.beginPath();c.moveTo(Hc[0]+R*.6,Hc[1]+R*.3);c.quadraticCurveTo(Hc[0]+R*.2,Hc[1]+R*1.4,Hc[0]-R*.35,Hc[1]+R*1.25);c.quadraticCurveTo(Hc[0]-R*.05,Hc[1]+R*.6,Hc[0]+R*.1,Hc[1]+R*.25);c.closePath();c.fill();c.restore()};
GB.bchu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#6a3ab8';c.lineWidth=R*.14;c.beginPath();c.arc(Hc[0]+R*.25,Hc[1]+R*.35,R*.62,.35,1.75);c.stroke();c.restore()};
GB.cahu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#f6f6f3';c.beginPath();c.ellipse(Hc[0]+R*.4,Hc[1]+R*.62,R*.38,R*.3,0,0,TAU);c.fill();c.strokeStyle='#c8306a';c.lineWidth=R*.08;for(let k=0;k<5;k++){c.beginPath();c.moveTo(Hc[0]+R*.55,Hc[1]+R*.4);c.lineTo(Hc[0]+R*(.1+k*.15),Hc[1]+R*(.95-Math.abs(k-2)*.06));c.stroke()}c.restore()};
GB.whcr.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#c8302a';c.beginPath();c.ellipse(Hc[0]+R*.05,Hc[1]-R*.6,R*.45,R*.3,0,0,TAU);c.fill();c.fillStyle='#1e1e20';c.beginPath();c.ellipse(Hc[0]+R*.45,Hc[1]+R*.2,R*.4,R*.32,.3,0,TAU);c.fill();c.fillStyle='#e8c83a';c.beginPath();c.arc(Hc[0]+R*.38,Hc[1]-R*.12,R*.12,0,TAU);c.fill();c.fillStyle='#141414';c.beginPath();c.arc(Hc[0]+R*.38,Hc[1]-R*.12,R*.06,0,TAU);c.fill();c.restore()};
GB.mopl.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#1e1a16';c.beginPath();c.ellipse(Hc[0]+R*.25,Hc[1]-R*.7,R*.42,R*.2,.2,0,TAU);c.fill();c.restore()};
GB.wfib.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#f6f6f3';c.lineWidth=R*.12;c.beginPath();c.ellipse(Hc[0]+R*.5,Hc[1]-R*.05,R*.42,R*.36,0,0,TAU);c.stroke();c.restore()};
GB.neco.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#f2f2ee';c.lineWidth=R*.1;c.beginPath();c.moveTo(Hc[0]+R*.65,Hc[1]+R*.1);c.lineTo(Hc[0]+R*.1,Hc[1]+R*.55);c.lineTo(Hc[0]+R*.5,Hc[1]+R*.75);c.stroke();c.restore()};
GB.frgu.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.strokeStyle='#f6f6f3';c.lineWidth=R*.12;c.lineCap='round';c.beginPath();c.arc(Hc[0]+R*.38,Hc[1]-R*.15,R*.22,-2.6,-.6);c.stroke();c.beginPath();c.arc(Hc[0]+R*.38,Hc[1]-R*.15,R*.22,.6,2.6);c.stroke();c.restore()};
GB.cagu.draw=function(c,pose,o,g){const {bb,btip,R}=g;c.save();const x=bb[0]+(btip[0]-bb[0])*.78,y=bb[1]+(btip[1]-bb[1])*.78;c.fillStyle='#c8302a';c.beginPath();c.arc(x,y+R*.12,R*.11,0,TAU);c.fill();c.fillStyle='#141414';c.beginPath();c.arc(x-R*.06,y-R*.06,R*.08,0,TAU);c.fill();c.restore()};
GB.wtki.draw=function(c,pose,o,g){const {Hc,R}=g;c.save();c.fillStyle='#3a3a3e';c.beginPath();c.ellipse(Hc[0]+R*.3,Hc[1]-R*.15,R*.2,R*.12,0,0,TAU);c.fill();c.fillStyle='#c8302a';c.beginPath();c.arc(Hc[0]+R*.38,Hc[1]-R*.15,R*.09,0,TAU);c.fill();c.restore()};
GB.hash.draw=function(c,pose,o,g){const {A,B,loc}=g;c.save();c.fillStyle='#a8502a';const q=loc(A*.05,B*.55);c.beginPath();c.ellipse(q[0],q[1],A*.22,B*.32,0,0,TAU);c.fill();c.restore()};
GB.feha.draw=function(c,pose,o,g){const {A,B,loc}=g;c.save();c.fillStyle='#a8582e';const q=loc(-A*.05,B*.6);c.beginPath();c.ellipse(q[0],q[1],A*.2,B*.28,0,0,TAU);c.fill();c.restore()};
GB.grha.draw=function(c,pose,o,g){if(!o.detail)return;const {A,B,loc}=g;c.save();c.strokeStyle='rgba(110,118,128,.7)';c.lineWidth=B*.04;for(let k=0;k<7;k++){const p=loc(A*(.6-k*.13),B*.1),q=loc(A*(.62-k*.13),B*.65);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}c.restore()};
GB.fepo.draw=gbOwlDraw({streaks:[.5,.2],rim:true});
GB.elow.draw=gbOwlDraw({streaks:[.5,.15]});
for(const id of['fepo','elow']){GB[id].drawOnly=true;GB[id].boxPts=GB.easo.boxPts;GB[id].pinPts=GB.easo.pinPts}
GB.gfwo.draw=function(c,pose,o,g){const {bb,R}=g;c.save();c.fillStyle='#e8c83a';c.beginPath();c.arc(bb[0]-R*.12,bb[1]-R*.2,R*.16,0,TAU);c.fill();c.restore()};
GB.rnsa.draw=function(c,pose,o,g){GB.ybsa.draw(c,pose,o,g);const {Hc,R}=g;c.save();c.fillStyle='#d8202a';c.beginPath();c.ellipse(Hc[0]-R*.62,Hc[1]+R*.05,R*.16,R*.12,0,0,TAU);c.fill();c.restore()};
Object.assign(GBSONG,{
  whoop:(T,N,v,p)=>{for(let i=0;i<3;i++){T('sawtooth',700,900,.18,.06*v,i*.5,{filt:1600,q:4,pan:p});T('sawtooth',900,640,.22,.06*v,i*.5+.2,{filt:1600,q:4,pan:p})}},
  curlee:(T,N,v,p)=>{T('sine',1500,2500,.35,.06*v,0,{pan:p});T('sine',2500,2200,.2,.05*v,.38,{pan:p})},
  kowii:(T,N,v,p)=>{for(let i=0;i<3;i++)T('sawtooth',900,1300,.14,.035*v,i*.3,{filt:2200,q:4,pan:p})},
  kewp:(T,N,v,p)=>{T('sine',2600,2200,.12,.05*v,0,{pan:p});T('sine',2600,2200,.12,.05*v,.4,{pan:p})},
  poip:(T,N,v,p)=>{for(let i=0;i<10;i++)T('sine',1300,1250,.08,.05*v,i*.3,{pan:p})},
  yipyip:(T,N,v,p)=>{for(let i=0;i<7;i++)T('sine',1500+(i<3?i*120:360-(i-3)*90),1300,.07,.05*v,i*.13,{pan:p})},
  tick:(T,N,v,p)=>{for(let i=0;i<4;i++)N('bandpass',3800,4,.025,.06*v,3600,i*.16,p)}});

function gbPlatePose(id){const k=GB[id].kind;return k==='perch'||k==='reed'?'perch':k==='swim'?'swim':'stand'}
function gbPlateBox(id){const G=GB[id],g=gbGeom(G,gbPlatePose(id)),{A,B,R,Hc,loc,L}=g;const P=G.boxPts?G.boxPts(G.len):[g.tailTip,g.btip,[Hc[0]-R,Hc[1]-R*(G.shape.crest?1.9:1.15)],[Hc[0]+R,Hc[1]+R],loc(A,-B),loc(-A*1.1,-B),loc(A,B),loc(-A,B),[0,0]];
  const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);const m=L*.05;return[Math.min(...xs)-m,Math.max(...xs)+m,Math.min(...ys)-m,Math.max(...ys,G.kind==='swim'?B*.4:0)+m]}
function gbPlateBg(g,id,s){const G=GB[id],L=G.len,pose=gbPlatePose(id);
  if(pose==='perch'&&G.kind==='reed'){g.strokeStyle='#8a7a46';g.lineWidth=Math.max(2,L*.02*s);g.beginPath();g.moveTo(0,0);g.lineTo(-L*.02*s,L*2*s);g.stroke();g.fillStyle='#6a4426';g.beginPath();g.ellipse(0,L*.14*s,L*.05*s,L*.13*s,0,0,TAU);g.fill();return}
  if(pose==='perch'){g.fillStyle='#6b513b';g.beginPath();g.moveTo(-L*3*s,.004*L*s);g.quadraticCurveTo(0,-.015*L*s,L*3*s,.04*L*s);g.lineTo(L*3*s,.11*L*s);g.quadraticCurveTo(0,.065*L*s,-L*3*s,.09*L*s);g.fill();
    g.fillStyle='#55803a';for(const [x,y,r] of[[-.34,-.09,.1],[.36,.03,.085],[-.25,.07,.07]]){g.beginPath();g.ellipse(x*L*s,y*L*s,r*L*s*1.6,r*L*s*.6,-.4,0,TAU);g.fill()}return}
  if(pose==='swim'){g.fillStyle='#86b4c4';g.fillRect(-L*3*s,0,L*6*s,L*2*s);g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=Math.max(1,L*.01*s);for(let i=0;i<4;i++){g.beginPath();g.moveTo((-1+i*.55)*L*s,(.08+i*.05)*L*s);g.lineTo((-.7+i*.55)*L*s,(.08+i*.05)*L*s);g.stroke()}return}
  const sp=G.spot,col=G.kind==='wade'?'#86b4c4':G.kind==='sea'?'#9a958a':sp==='surf'||sp==='shore'?'#ead6a3':G.homes[0]==='arctic'||G.homes[0]==='tundra'?'#cdd2c8':G.homes[0]==='city'?'#c9c5bb':'#9db36d';
  if(G.kind==='wade'){const wl=-L*G.shape.legs*.45;g.fillStyle='#b9c48f';g.fillRect(-L*3*s,0,L*6*s,L*2*s);g.fillStyle=col;g.fillRect(-L*3*s,wl*s,L*6*s,(L*2-wl)*s);return}
  g.fillStyle=col;g.fillRect(-L*3*s,0,L*6*s,L*2*s);g.fillStyle='rgba(0,0,0,.05)';for(let i=0;i<24;i++)g.fillRect(((i*37)%120-60)/60*L*s,((i*13)%8)*.01*L*s,.012*L*s,.006*L*s)}
function gbMarks(G){const g=gbGeom(G,gbPlatePose(G.id)),{A,B,R,Hc,loc}=g;
  const at={crown:[Hc[0]-R*.1,Hc[1]-R*.8],face:[Hc[0]+R*.55,Hc[1]-R*.05],eye:[Hc[0]+R*.4,Hc[1]-R*.15],throat:[Hc[0]+R*.55,Hc[1]+R*.75],
    collar:G.shape.neck?[lerp(g.neckBase[0],Hc[0],.45),lerp(g.neckBase[1],Hc[1],.45)]:[Hc[0]-R*.55,Hc[1]+R*.8],
    neck:G.shape.neck?[lerp(g.neckBase[0],Hc[0],.55),lerp(g.neckBase[1],Hc[1],.55)]:[Hc[0]-R*.6,Hc[1]+R*.7],
    bill:[lerp(g.bb[0],g.btip[0],.55),lerp(g.bb[1],g.btip[1],.55)],breast:loc(A*.7,B*.3),belly:loc(A*.05,B*.75),back:loc(-A*.25,-B*.78),wing:loc(-A*.4,-B*.05),
    flank:loc(-A*.05,B*.45),tail:[lerp(g.rear[0],g.tailTip[0],.7),lerp(g.rear[1],g.tailTip[1],.7)],leg:[lerp(g.hip[0],0,.55),lerp(g.hip[1],0,.55)]};
  if(G.pinPts)Object.assign(at,G.pinPts(G.len));return G.marks.map(([k,t],i)=>({n:i+1,t,at:at[k]||at.back}))}
function gbCallSpot(sp,x,y){for(let i=0;i<260;i++){const a=Math.random()*TAU,r=80+Math.random()*520,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(gbSpotOK(sp,px,py,true))return[px,py]}return null}
for(const id in GB){const G=GB[id];SPECIES[id]={id,group:G.group,name:G.name,sci:G.sci,len:G.len,ws:G.ws,lenTxt:G.lenTxt,wsTxt:G.wsTxt,sex:G.sex,habitat:G.habitat,voice:G.voice,hint:G.hint,zone:G.zone,marks:gbMarks(G),flightMarks:G.flightMarks,sound:id};FL[id]=gbFL(G)}
SP_ORDER.length=0;SP_ORDER.push('fuwd','bbwd','sngo','rogo','gwfg','bran','cack','cago','egyg','musw','tusw','trus','mudu','blte','cite','nsho','gadw','euwi','amwi','mall','abdu','modu','gwte','nopi','wodu','buff','cogo','bago','home','come','rbme','rudu','cavs','redh','rndu','grsc','lesc','kiei','coei','hadu','susc','wwsc','blsc','witu','ltdu','plch','nobo','scqu','moqu','rugr','grsg','rinp','grpa','stgr','grpc','lepc','spgr','wipt','ropt','amfl','legr','pbgr','hogr','rngr','eagr','wegr','clgr','ropi','wcpi','rbpi','ecdo','modo','wwdo','indo','cgdo','wtdo','ybcu','bbcu','sban','gban','grro','macu','leni','coni','anni','copa','copo','cwwi','ewpw','chsw','wtsw','btmg','bbhu','luhu','bchu','rthu','bthu','cahu','ruhu','yera','blra','clra','kira','vira','sora','puga','coga','amco','limp','sacr','whcr','bnst','bbpl','amgp','sepl','wipl','snpl','mopl','kill','pipl','amoy','amav','lbcu','whim','mago','upsa','hugo','rutu','redk','sand','dunl','lesa','wrsa','stsa','basa','bbsa','pesa','sesa','wesa','pusa','sbdo','lbdo','amwo','wisn','spsa','sosa','will','grye','leye','wiph','rnph','reph','spsk','poja','paja','ltja','dove','atpu','comu','tbmu','razo','bgui','blki','ivgu','bogu','bhgu','ligu','sagu','frgu','lagu','rbgu','cagu','hegu','icgu','glgu','lbbg','gbbg','brno','gbte','cate','sote','brte','lete','bkte','cote','rost','arte','frte','rote','sate','blsk','wttr','rbtr','rtlo','palo','colo','wisp','lesp','bsto','nofu','bcpe','cosh','grsh','sosh','aush','mash','wost','mafr','mabo','brbo','noga','anhi','grco','neco','dcco','awpe','brpe','ambi','lebi','gbhe','greg','sneg','libh','reeg','trhe','grhe','caeg','bcnh','ycnh','whib','glib','wfib','rosp','bkvu','tuvu','ospr','wtki','stki','miki','snki','noha','ssha','coha','agos','baea','goea','rsha','hash','wtha','grha','sthk','bwha','swha','ztha','rtha','rlha','feha','abow','easo','fepo','elow','ghow','snowl','nhow','baow','ggow','boow','buow','leow','seow','nswo','beki','riki','gnki','rhwo','rbwo','gfwo','ybsa','rnsa','dowo','hawo','rcwo','attw','bbwo','nofl','pile','crca','amke','merl','gyrf','pefa','mopa','nanp','osfl','eawp','acfl','alfl','wifl','ybfl','lefl','eaph','gcfl','eaki','grki','wevi','ytvi','bhvi','bevi','revi','wavi','phvi','bwvi','logs','nshr','caja','flsj','blja','amcr','ficr','cora','cach','bcch','boch','tuti','hola','puma','trsw','nrws','bank','bars','clsw','wbnu','rbnu','bhnu','brcr','cawr','howr','wiwr','sewr','mawr','rwbu','gckl','rcki','bggn','grca','brth','nomo','eust','eabl','nowh','veer','gcth','bith','swth','heth','woth','amro','bowa','cedw','ampi','hosp','etsp','evgr','hofi','pufi','repo','pigr','recr','wwcr','pisi','amgo','lalo','snbu','atsp','basp','chsp','fisp','ccsp','vesp','lasp','daju','grsp','lcsp','hesp','savs','sesp','ssts','nesp','fosp','sosp','swsp','lisp','wtsp','wcsp','eato','ybch','bobo','eame','oror','baor','sbor','rwbl','rubl','cogr','btgr','bhco','shco','coye','cawa','wiwa','howa','oven','wewa','swwa','tewa','ocwa','nowa','lowa','bawa','gwwa','bwwa','nawa','prow','kewa','mowa','cowa','bkpw','piwa','kiwa','yewa','cswa','blbw','mawa','cmwa','yrwa','pawa','ytwa','prwa','btbw','bbwa','btnw','amre','nopa','cerw','suta','scta','noca','rbgr','blgr','inbu','dick','pabu');

/* ---------- world: the East Coast region ----------
   x grows east, y grows south. Atlantic to the east, Appalachians to the west, cold north, subtropical south.
   1 world unit = 10 cm on the ground (M units per metre). Heights draw at HS screen px per metre. */
// which map is loaded: the East Coast or the Central (settings.map, changed by travelling from a trailhead)
// CEN = the Central, WEST = the West Coast; CENTRAL is true on both (maps built from world data, as opposed to the East Coast)
// PAC = the Pacific Isles (an archipelago: no single coast, no highway); BIGM = maps with big mountains in full relief (West, Pacific)
// CAR = the Caribbean Isle; ISLE = either island map
const MAP=['central','west','pacific','caribbean','britain'].includes(settings.map)?settings.map:'east',WEST=MAP==='west',CEN=MAP==='central',PAC=MAP==='pacific',CAR=MAP==='caribbean',BRI=MAP==='britain',TROP=PAC||CAR,ISLE=PAC||CAR||BRI,BIGM=WEST||ISLE,CENTRAL=MAP!=='east',MAP_NAME=BRI?'British Isle':CAR?'Caribbean Isle':PAC?'Pacific Isles':WEST?'West Coast':CEN?'Central':'East Coast';
// TSTYLE: each region's own town (version 53)
const TSTYLE=BRI?'british':CAR?'colonial':PAC?'plantation':WEST?'mission':'prairie';
const WW=BRI?24000:CAR?30000:PAC?34000:WEST?26000:CEN?24000:17000,WH=BRI?36000:CAR?16000:PAC?24000:34000,CELL=1000,M=10,HS=7;
/* ---------- the world map (World Plan, draft G) ----------
   The habitats come from a map baked into the game: one code every 15 units (1.5 m), run-length packed.
   The coast and highway stay as smooth formulas so the shoreline and road never look blocky. */

// the Central map (draft A of the Big Year Central Plan), same layout as WD_E plus the Route 83 and coast tables

// the West Coast map (draft A of the Big Year West Plan): same layout as WD_C plus a mountain-height table (mtn)

// the Pacific Isles map (draft B of the Big Year Tropical Isles Plan): same layout as WD_W plus islands, scenery folk and map labels

// the Caribbean Isle map (draft B of the Big Year Tropical Isles Plan): same layout as WD_P

// the British Isle (draft A of the Big Year British Isle Plan): same layout as WD_K, plus walls, stone circles and the chalk horse

const WD=BY.MAPS[MAP];
const WU=WD.U,WGW=WD.W,WGH=WD.H,WKEYS=WD.keys,WK=k=>WKEYS.indexOf(k);
const WGRID=(()=>{const g=new Uint8Array(WGW*WGH),b=atob(WD.rle);let p=0,o=0;
  while(p<b.length){const v=b.charCodeAt(p++);let l=0,s=0,c;do{c=b.charCodeAt(p++);l|=(c&127)<<s;s+=7}while(c&128);g.fill(v,o,o+l);o+=l}return g})();
const WATERK=new Uint8Array(WKEYS.length);for(const k of['ocean','pelagic','bay','lake','pond','river','pools','saline','potholes'])if(WK(k)>=0)WATERK[WK(k)]=1;
// distance from every cell to the nearest cell of the other kind (water vs land), used for beaches, shallows and lake depth
const WDIST=(()=>{const N=WGW*WGH,d=new Uint16Array(N).fill(65000),G=WGRID,W=WGW,H=WGH;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const o=j*W+i,w=WATERK[G[o]];
    if((i>0&&WATERK[G[o-1]]!==w)||(i<W-1&&WATERK[G[o+1]]!==w)||(j>0&&WATERK[G[o-W]]!==w)||(j<H-1&&WATERK[G[o+W]]!==w))d[o]=2}
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const o=j*W+i;let v=d[o];
    if(i>0)v=Math.min(v,d[o-1]+3);if(j>0){v=Math.min(v,d[o-W]+3);if(i>0)v=Math.min(v,d[o-W-1]+4);if(i<W-1)v=Math.min(v,d[o-W+1]+4)}d[o]=v}
  for(let j=H-1;j>=0;j--)for(let i=W-1;i>=0;i--){const o=j*W+i;let v=d[o];
    if(i<W-1)v=Math.min(v,d[o+1]+3);if(j<H-1){v=Math.min(v,d[o+W]+3);if(i<W-1)v=Math.min(v,d[o+W+1]+4);if(i>0)v=Math.min(v,d[o+W-1]+4)}d[o]=v}
  const out=new Float32Array(N);for(let o=0;o<N;o++)out[o]=Math.min(255,d[o]/3);
  // two passes of a 5-cell box blur (running sums) take out the chamfer stair-steps
  const tmp=new Float32Array(N),R=2;
  const blurH=(a,b)=>{for(let j=0;j<H;j++){const r0=j*W;let sum=0,n=0;for(let i=0;i<=R&&i<W;i++){sum+=a[r0+i];n++}
      for(let i=0;i<W;i++){b[r0+i]=sum/n;const add=i+R+1,sub=i-R;if(add<W){sum+=a[r0+add];n++}if(sub>=0){sum-=a[r0+sub];n--}}}};
  const blurV=(a,b)=>{for(let i=0;i<W;i++){let sum=0,n=0;for(let j=0;j<=R&&j<H;j++){sum+=a[j*W+i];n++}
      for(let j=0;j<H;j++){b[j*W+i]=sum/n;const add=j+R+1,sub=j-R;if(add<H){sum+=a[add*W+i];n++}if(sub>=0){sum-=a[sub*W+i];n--}}}};
  for(let p=0;p<2;p++){blurH(out,tmp);blurV(tmp,out)}
  return out})();
function wcell(x,y){let i=Math.floor(x/WU),j=Math.floor(y/WU);i=i<0?0:i>=WGW?WGW-1:i;j=j<0?0:j>=WGH?WGH-1:j;return j*WGW+i}
function wcode(x,y){return WGRID[wcell(x,y)]}
// borders between habitats: blend the four nearest map cells and add a small wobble, so edges are smooth curves rather than steps
const WS_C=[0,0,0,0],WS_W=[0,0,0,0];
function wsample(x,y){const w=(vnoise(x/46+31,y/46+17)-.5)*18;x+=w;y-=w*.7;
  let fx=x/WU-.5,fy=y/WU-.5,i=Math.floor(fx),j=Math.floor(fy);fx-=i;fy-=j;i=clamp(i,0,WGW-2);j=clamp(j,0,WGH-2);
  const o=j*WGW+i,a=WGRID[o],b=WGRID[o+1],c=WGRID[o+WGW],d=WGRID[o+WGW+1];if(a===b&&a===c&&a===d)return a;
  const n=(vnoise(x/38+3,y/38+7)-.5)*.24;let best=a,bw=-1;
  const cs=[a,b,c,d],ws=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];
  for(let k=0;k<4;k++){let t=0;for(let m=0;m<4;m++)if(cs[m]===cs[k])t+=ws[m];t+=n*(k&1?1:-1)*(k&2?1:-1);if(t>bw){bw=t;best=cs[k]}}return best}
function wkey(x,y){return WKEYS[wsample(x,y)]}
function wdist(x,y){let fx=x/WU-.5,fy=y/WU-.5,i=Math.floor(fx),j=Math.floor(fy);fx-=i;fy-=j;i=clamp(i,0,WGW-2);j=clamp(j,0,WGH-2);const o=j*WGW+i,D=WDIST;
  return((D[o]*(1-fx)+D[o+1]*fx)*(1-fy)+(D[o+WGW]*(1-fx)+D[o+WGW+1]*fx)*fy)*WU+(vnoise(x/30+5,y/30+1)-.5)*14}   // distance to the water's edge (from land) or to land (from water)
function coast1(y){let c=12550+260*Math.sin(y/5200+1)+130*Math.sin(y/1300)+55*Math.sin(y/420+2);if(y<7600)c+=260*Math.abs(Math.sin(y/850))-180;return c}
function tab100(a,y){const t=clamp(y/100,0,a.length-1.001),i=Math.floor(t),f=t-i;return a[i]*(1-f)+a[i+1]*f}
function coastX(y){return CENTRAL?tab100(WD.coast,y):coast1(y-4000)}
const CSD=WEST?-1:1;   // which side of the coastline the sea is on
const MTNW=BIGM?(()=>{const b=atob(WD.mtn.d),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a})():null;
function mtnW(x,y){const M=WD.mtn,fx=clamp(x/M.s,0,M.w-1.001),fy=clamp(y/M.s,0,M.h-1.001),i=Math.floor(fx),j=Math.floor(fy),u=fx-i,v=fy-j,o=j*M.w+i;
  return((MTNW[o]*(1-u)+MTNW[o+1]*u)*(1-v)+(MTNW[o+M.w]*(1-u)+MTNW[o+M.w+1]*u)*v)/255}
function roadX0(y){const yy=y-4000;let t=clamp((yy-18000)/3600,0,1);t=t*t*(3-2*t);return coast1(yy)-2000-900*t}
const HWC_X=CENTRAL?0:WD.city[0]+2333,HWC_Y0=CENTRAL?0:WD.city[1],HWC_Y1=CENTRAL?0:WD.city[3];
function roadX(y){if(CENTRAL)return tab100(WD.road,y);const x=roadX0(y);let w=y<HWC_Y0?clamp((y-(HWC_Y0-1800))/1650,0,1):y>HWC_Y1?clamp(((HWC_Y1+1800)-y)/1650,0,1):1;w=w*w*(3-2*w);return x+(HWC_X-x)*w}
const HW0r=CENTRAL?WD.hw[0]:3100,HW1r=CENTRAL?WD.hw[1]:33800,HW0=HW0r<400?-200:HW0r,HW1=HW1r>(BRI?36000:CAR?16000:PAC?24000:34000)-400?(BRI?36000:CAR?16000:PAC?24000:34000)+200:HW1r;   // the coast highway runs from the arctic gravel road to the far south
// Central: Pine Ridge and Sky Peak are the only high ground
function mtnK(x,y){if(BIGM)return mtnW(x,y);if(CENTRAL){const a=Math.hypot(x-3400,y-11500)/2300,b=Math.hypot(x-3850,y-27100)/2000;return clamp(1.15-Math.min(a,b)*1.15,0,1)}const yy=y-4000,ridge=900+350*Math.sin(yy/5200)+150*Math.sin(yy/1500+1),span=3300-700*sstep(8000,26000,yy),h=1-.5*sstep(10000,24000,yy);
  return clamp(Math.pow(clamp(1-(x-ridge)/span,0,1),1.15)*h,0,1)}
function seaNear(x,y){let best=1400;for(const r of[150,400,800,1300])for(let a=0;a<TAU;a+=PI/4){const k=WKEYS[wcode(x+Math.cos(a)*r,y+Math.sin(a)*r)];if(k==='reef'||k==='pelagic'||k==='ocean'){best=Math.min(best,r);break}}return best}
function isleAt(x,y){if(!ISLE)return'';let best='Open ocean',bd=2.2;for(const [n,cx,cy,rx,ry,r] of WD.isles){const c=Math.cos(r),s=Math.sin(r),dx=x-cx,dy=y-cy,u=(c*dx+s*dy)/rx,v=(-s*dx+c*dy)/ry,d=u*u+v*v;if(d<=1)return n;if(d<bd){bd=d;best=n}}return best}
function forestMask(x,y){return fbm(x/1700+11,y/1700+7)}
/* ---------- seasons: the snow line, frozen water and sea ice move with the season you pick ---------- */
const SEASON_INFO={spring:{name:'Spring',title:'Spring migration',snow:2300,frz:2500,peak:13000,ice:1800},summer:{name:'Summer',title:'Summer nesting',snow:-9e9,frz:-9e9,peak:-9e9,ice:800},
  fall:{name:'Fall',title:'Fall migration',snow:1500,frz:1400,peak:9000,ice:1400},winter:{name:'Winter',title:'Winter',snow:15200,frz:13000,peak:9e9,ice:5200}};
if(WEST)Object.assign(SEASON_INFO,{spring:{...SEASON_INFO.spring,snow:4300,frz:5200,peak:26000,ice:2600},summer:{...SEASON_INFO.summer,snow:-9e9,frz:-9e9,peak:11500,ice:-9e9},
  fall:{...SEASON_INFO.fall,snow:2800,frz:2400,peak:15000,ice:600},winter:{...SEASON_INFO.winter,snow:10500,frz:9600,peak:9e9,ice:4200}});
if(TROP)for(const k in SEASON_INFO)Object.assign(SEASON_INFO[k],{snow:-9e9,frz:-9e9,peak:-9e9,ice:-9e9});
// Britain: snow on the Highland and Lakes tops in winter and spring, lowland snow only in the far north in winter; no sea ice
if(BRI)Object.assign(SEASON_INFO,{spring:{...SEASON_INFO.spring,snow:-9e9,frz:-9e9,peak:21000,ice:-9e9},summer:{...SEASON_INFO.summer,snow:-9e9,frz:-9e9,peak:-9e9,ice:-9e9},
  fall:{...SEASON_INFO.fall,snow:-9e9,frz:-9e9,peak:9000,ice:-9e9},winter:{...SEASON_INFO.winter,snow:9000,frz:5000,peak:9e9,ice:-9e9}});
if(CEN)Object.assign(SEASON_INFO,{spring:{...SEASON_INFO.spring,snow:900,frz:1200,peak:6000,ice:-9e9},summer:{...SEASON_INFO.summer,ice:-9e9},
  fall:{...SEASON_INFO.fall,snow:500,frz:300,peak:4000,ice:-9e9},winter:{...SEASON_INFO.winter,snow:15500,frz:14500,peak:9e9,ice:-9e9}});
let SEASON=SEASON_INFO[settings.season]?settings.season:'spring';
const SZ=()=>SEASON_INFO[SEASON];
function seasonJit(x,y){return(fbm(x/1600+3,y/1600+5)-.5)*3000}
function snowCover(x,y,k){k=k||WKEYS[wsample(x,y)];if(k==='snow')return 1;if(TROP){if(CAR||SEASON!=='winter')return 0;return sstep(.66,.8,mtnK(x,y))*(k==='cinder'||k==='lava'?1:.6)}const Z=SZ();if(Z.snow<-1e8)return 0;const yy=y+seasonJit(x,y);let c=sstep(Z.snow+500,Z.snow-500,yy);
  // mountain snow fades in over the lower slopes instead of starting at a hard line (SN1)
  const mk=mtnK(x,y);if(k==='tundra'||k==='highlands'||mk>.35)c=Math.max(c,sstep(Z.peak+800,Z.peak-800,yy)*(k==='tundra'||k==='arctic'?1:k==='highlands'?.85:.6*sstep(.35,.75,mk)));return c}
function frozen(x,y){return y+seasonJit(x,y)<SZ().frz}

/* ---------- roads and tracks: polylines, looked up through a coarse grid ---------- */
const ROAD_HALF=54;   // RD5: was 40 (80 wide); now 108 wide so traffic is easier to pass
const TRACKS=[...WD.tracks,...WD.drives.map(p=>({name:'Driveway',kind:'dirt',w:15,pts:p,drive:true}))].map(t=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const q of t.pts){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}return{...t,x0,x1,y0,y1}});
const TSEG=new Map();
for(const t of TRACKS)for(let i=0;i<t.pts.length-1;i++){const a=t.pts[i],b=t.pts[i+1],m=t.w+90;
  for(let cy=Math.floor((Math.min(a[1],b[1])-m)/CELL);cy<=Math.floor((Math.max(a[1],b[1])+m)/CELL);cy++)for(let cx=Math.floor((Math.min(a[0],b[0])-m)/CELL);cx<=Math.floor((Math.max(a[0],b[0])+m)/CELL);cx++){
    const k=cx*1000+cy;let l=TSEG.get(k);if(!l)TSEG.set(k,l=[]);l.push([t,i])}}
function segDist(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy||1,t=clamp(((px-a[0])*dx+(py-a[1])*dy)/L,0,1);return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)}
const LOTS=WD.lots||[];
function roadAt(x,y,pad=0){
  const cs=cityStreet(x,y,pad);if(cs)return cs;
  if(AP)for(const R of[AP.rw,AP.ap])if(x>R[0]-pad&&x<R[2]+pad&&y>R[1]-pad&&y<R[3]+pad)return{kind:'paved',d:0,air:1};
  for(const L of LOTS){const dx=x-L[0],dy=y-L[1];if(dx*dx+dy*dy<(L[2]+pad)*(L[2]+pad))return{kind:L[3]==='hw'?'paved':L[3],d:0,lot:L}}
  if(y>HW0&&y<HW1){const d=Math.abs(x-roadX(y));if(d<ROAD_HALF+pad)return{kind:'paved',d,main:true}}
  const l=TSEG.get(Math.floor(x/CELL)*1000+Math.floor(y/CELL));if(l)for(const [t,i] of l){const d=segDist(x,y,t.pts[i],t.pts[i+1]);if(d<t.w+pad)return{kind:t.kind,d,t}}
  return null}
// trailheads: travel between the maps (East Coast: end of Ridge Road; Central: East Trail and West Trail)
if(WEST&&!WD.places.find(q=>q[0]==='Pacific ferry'))WD.places.push(['Pacific ferry',6330,20780]);
/* AP-1 airports: a runway, an apron with a terminal, tower and hangar, and a DC-3 that flies to every other airport */
const AIRPORTS={
  east:{name:'Port Bostick Airport',town:'Port Bostick',rw:[7000,19860,9800,20060],ap:[8800,19250,9800,19860],term:[9420,19300,340,150],tower:[8930,19390],hangar:[8850,19560,260,170],plane:[9530,19580,PI/2],door:[9300,19640],sock:[7160,19790],end:1},
  britain:{name:'Kingsport Airport',town:'Kingsport',rw:[18200,27370,20400,27570],ap:[18200,27570,19200,27860],term:[18220,27700,320,150],tower:[18560,27630],hangar:[18580,27700,220,140],plane:[19050,27720,-PI/2],door:[18880,27800],sock:[20270,27330],end:-1}};
const AP=AIRPORTS[MAP]||null;
const TRAILS=CENTRAL?(BRI?[['Kingsport Airport','air','Airport',1],['Port Ardan ferry','ferry','the isles',1],['Balnamara ferry','ferry','the isles',1],['North ferry','ferry','the isles',1],['Northern Isles ferry','ferry','the isles',1],['Channel ferry','ferry','the isles',1],['Chalk Isle ferry','ferry','the isles',1]]:CAR?[['Bahía Vieja pier','east','East Coast',1],['Este ferry','ferry','the islands',1],['Isla Cayo ferry','ferry','the islands',1]]:PAC?[['Harbor City pier','west','West Coast',1],['Garden Town ferry','ferry','the islands',1],['Cloud Bay ferry','ferry','the islands',1],['Sunset Bay ferry','ferry','the islands',1]]:WEST?[['East Trail','central','Central',1],['Pacific ferry','pacific','Pacific Isles',-1]]:[['East Trail','east','East Coast',1],['West Trail','west','West Coast',-1]]).map(([name,to,dest,dir])=>{const p=WD.places.find(q=>q[0]===name);return{x:p[1],y:p[2],name,to,dest,dir}})
  :(()=>{const RIDGE_RD=TRACKS.find(t=>t.name==='Ridge Road');return[{x:RIDGE_RD.pts[RIDGE_RD.pts.length-1][0]+60,y:RIDGE_RD.pts[RIDGE_RD.pts.length-1][1],name:'Trailhead · Ridge Road',to:'central',dest:'Central',dir:-1},{x:12540,y:32620,name:'Caribbean ferry',to:'caribbean',dest:'Caribbean Isle',dir:1},{x:AP.door[0],y:AP.door[1],name:AP.name,to:'air',dest:'Airport',dir:1}]})();
for(const TR of TRAILS)if(TR.to==='air'){TR.x=AP.door[0];TR.y=AP.door[1];TR.land=[AP.door[0],AP.door[1]+20]}
const TRAIL=TRAILS[0];
function nearTrail(x,y,r){for(const t of TRAILS)if(Math.hypot(x-t.x,y-t.y)<r)return t;return null}
const START=(()=>{const p=WD.places.find(q=>q[0]==='START');return{x:p[1],y:p[2]}})();

// terrain classes
const T={DEEP:0,SHAL:1,WET:2,SAND:3,DUNE:4,FLOOR:5,MEADOW:6,ROCK:7,SNOW:8,ALPINE:9,LAKE:10,MARSH:11,SALT:12,SWAMP:13,FIELD:14,GRASS:15,SCRUB:16,SANDHILL:17,CITY:18,PARK:19,YARD:20,HEDGE:21,BOG:22,MANGROVE:23,MUD:24,ARCTIC:25,ICE:26};
function tidalCreek(x,y){return Math.abs(fbm(x/300+9,y/300+2)-.5)<.03}
function nearRd(x,y){const r=roadAt(x,y,26);return !!r&&!r.city&&r.kind!=='boardwalk'}
function terr(x,y){
  if(x<0||y<0||y>WH||x>WW)return T.ROCK;
  const k=WKEYS[wsample(x,y)];
  switch(k){
    case'ocean':case'pelagic':if(y+seasonJit(x,y)<SZ().ice&&fbm(x/240+1,y/240+3)>.47)return T.ICE;return wdist(x,y)<300?T.SHAL:T.DEEP;
    case'bay':return fbm(x/170+3,y/170+9)>.6&&wdist(x,y)<100?T.MUD:T.SHAL;
    case'pools':if(nearRd(x,y))return T.MARSH;return frozen(x,y)?T.ICE:T.LAKE;case'lake':case'pond':case'river':return frozen(x,y)?T.ICE:T.LAKE;
    case'beach':{const d=wdist(x,y);return d<50?T.WET:d<290?T.SAND:T.DUNE}
    case'rocky':return T.ROCK;
    case'saltmarsh':return tidalCreek(x,y)&&!nearRd(x,y)?T.LAKE:T.SALT;
    case'mangrove':return fbm(x/90+5,y/90+2)>.64?T.SHAL:T.MANGROVE;
    case'marsh':return fbm(x/260+5,y/260+1)>.66&&!nearRd(x,y)?(frozen(x,y)?T.ICE:T.LAKE):T.MARSH;
    case'bog':return fbm(x/110+2,y/110+4)>.7&&!nearRd(x,y)?(frozen(x,y)?T.ICE:T.LAKE):T.BOG;
    case'swamp':return T.SWAMP;
    case'scrub':return T.SCRUB;
    case'sandhill':return T.SANDHILL;
    case'grassland':return T.GRASS;
    case'farm':{const ft=farmTerr(x,y);return ft>=0?ft:T.HEDGE}
    case'city':case'park':if(inCity(x,y))return inPark(x,y)?T.PARK:T.CITY;return T.PARK;
    case'tundra':{const n=fbm(x/380,y/380);if(BRI)return n<.36?T.ROCK:T.ALPINE;return n>.58?T.SNOW:n<.38?T.ROCK:T.ALPINE}
    case'moor':return fbm(x/150+4,y/150+1)<.22?T.ROCK:T.SCRUB;case'heath':return T.SCRUB;case'downs':return T.GRASS;case'machair':return T.MEADOW;
    case'arctic':{const n=fbm(x/300+2,y/300+7);return n>.7?T.SNOW:n<.3?T.ROCK:T.ARCTIC}
    case'snow':return T.SNOW;
    case'highlands':if(fbm(x/380,y/380)<.33)return T.ROCK;break;
    case'foothills':if(fbm(x/380,y/380)<.24)return T.ROCK;break;
    case'tallgrass':case'mixedgrass':case'shortgrass':case'coastalprairie':return T.GRASS;
    case'sagebrush':return T.SCRUB;
    case'desert':return T.SANDHILL;
    case'badlands':return fbm(x/160+3,y/160+1)>.62?T.SANDHILL:T.ROCK;
    case'potholes':if(nearRd(x,y))return T.MARSH;return frozen(x,y)?T.ICE:T.LAKE;
    case'saline':return T.LAKE;
    case'skyisland':if(fbm(x/300,y/300)<.27)return T.ROCK;break;
    case'chaparral':return T.SCRUB;
    case'reef':return T.SHAL;
    case'pool':return T.LAKE;
    case'golf':return T.PARK;
    case'islets':return fbm(x/120+4,y/120+2)>.62?T.ROCK:T.DUNE;
    case'cinder':return fbm(x/200+2,y/200+6)>.62?T.ROCK:T.SANDHILL;
    case'lava':return T.ROCK;
    case'dryscrub':case'kiawe':return T.SCRUB;
    case'pasture':return T.GRASS;
    case'cane':return T.GRASS;
    case'mojave':case'sonoran':return T.SANDHILL;
    case'canyon':return fbm(x/160+3,y/160+1)>.62?T.SANDHILL:T.ROCK;
    case'cliffs':return T.ROCK;
    case'meadow':return T.MEADOW;
    case'subalpine':if(fbm(x/300+3,y/300+1)<.2)return T.ROCK;break;
    case'pinyon':if(fbm(x/220+5,y/220+2)<.25)return T.ROCK;break}
  if(CENTRAL){const F=CFOR[k];if(F)return forestMask(x,y)<F.mw?T.MEADOW:T.FLOOR}
  return forestMask(x,y)<.36?T.MEADOW:T.FLOOR}
const isLand=t=>t>=T.WET&&t!==T.LAKE;
const isWater=t=>t<=T.SHAL||t===T.LAKE;
const isBeach=t=>t===T.WET||t===T.SAND||t===T.DUNE;
const nN=BRI?(y=>1-sstep(9000,17000,y)):TROP?(y=>0):WEST?(y=>1-sstep(8500,12500,y)):CENTRAL?(y=>1-sstep(6000,9500,y)):(y=>1-sstep(11500,14800,y)), nS=BRI?(y=>0):TROP?(y=>1):WEST?(y=>sstep(25000,28500,y)):CENTRAL?(y=>sstep(26000,29500,y)):(y=>sstep(23500,26500,y));

// ground colours (RGB arrays) used by the map textures, minimap and the binocular ground
const GC={deepN:hex('#264f6e'),deep:hex('#1f6a93'),deepS:hex('#17839e'),shalN:hex('#4a8ea3'),shal:hex('#4eaab8'),shalS:hex('#45cbc9'),
  wet:hex('#c4ad80'),sand:hex('#ead6a3'),sandS:hex('#f2e4c0'),dune:hex('#cdbb7e'),
  floorN:hex('#38533a'),floor:hex('#4d6e35'),floorS:hex('#6f8a3f'),litter:hex('#6b5a35'),meadowN:hex('#617a4e'),meadow:hex('#7aa04a'),meadowS:hex('#9cad55'),
  rock:hex('#8b8a84'),rock2:hex('#6f6e69'),snow:hex('#eef3f6'),alpine:hex('#6f8a55'),road:hex('#4a4b4e'),dirt:hex('#9a7b52'),sandroad:hex('#d6be88'),
  bog:hex('#8a9152'),bog2:hex('#a4864e'),mangrove:hex('#3b5e3c'),mud:hex('#8c7c5c'),mud2:hex('#a39270'),arctic:hex('#9aa486'),arctic2:hex('#b9b49a'),lichen:hex('#c7c09b'),ice:hex('#d5e6ee'),pelagic:hex('#163f5f')};
function blend3(a,b,c,y){const n=nN(y),s=nS(y);let col=mix(b,a,n);return mix(col,c,s)}
const TINT={fall:hex('#c49a4a'),winter:hex('#9b8c66'),spring:hex('#8fc552'),straw:hex('#b9a976'),snow:hex('#eef3f6')};
const WTINT={winter:[hex('#71899a'),.2],summer:[hex('#36b8cc'),.1],fall:[hex('#2e5f7a'),.1],spring:[hex('#4a9fb8'),0]};
function groundColor(x,y,tt){const t=tt??terr(x,y);let c=groundColor0(x,y,t);if(t===T.ICE)return c;if(!isLand(t)){const W=WTINT[SEASON];return W[1]?mix(c,W[0],W[1]):c}
  if(TROP){}else if(SEASON==='fall'){if(t===T.GRASS||t===T.MEADOW||t===T.SCRUB||t===T.HEDGE||t===T.MARSH)c=mix(c,TINT.fall,.3);else if(t===T.SANDHILL||t===T.DUNE||t===T.MANGROVE)c=mix(c,TINT.fall,.12);else if(t===T.FLOOR)c=mix(c,TINT.fall,.2*(1-nN(y)))}
  else if(SEASON==='winter'){if(t===T.GRASS||t===T.MEADOW||t===T.SCRUB||t===T.HEDGE||t===T.FIELD||t===T.PARK||t===T.YARD)c=mix(c,TINT.winter,BRI?.2:.45);else if(t===T.MARSH||t===T.SALT||t===T.BOG)c=mix(c,TINT.straw,.45);else if(t===T.SANDHILL||t===T.DUNE)c=mix(c,TINT.straw,.28);else if(t===T.MANGROVE)c=mix(c,TINT.winter,.12);else if(t===T.FLOOR)c=mix(c,TINT.winter,.3*(1-nS(y)*.6))}
  else if(SEASON==='spring'){if(t===T.GRASS||t===T.MEADOW||t===T.FLOOR||t===T.PARK)c=mix(c,TINT.spring,.12)}
  const s=t===T.CITY?0:snowCover(x,y);if(s>0)c=mix(c,TINT.snow.map(v=>v*(.95+vnoise(x/40,y/40)*.05)),s*.9);
  if(CENTRAL)c=reliefTone(c,x,y,t);
  return c}
function groundColor0(x,y,t){const n=vnoise(x/90,y/90);if(CENTRAL){const c=cenColor(x,y,t,n);if(c)return c}
  switch(t){
    case T.DEEP:{const c=blend3(GC.deepN,GC.deep,GC.deepS,y);return mix(c,GC.pelagic,clamp((wdist(x,y)-900)/1600,0,.8)).map(v=>v*(.97+n*.05))}
    case T.SHAL:{const d0=wdist(x,y),d=clamp(d0/300,0,1),rim=d0<9?(1-d0/9)*.28:0;return mix(mix(blend3(GC.shalN,GC.shal,GC.shalS,y),blend3(GC.deepN,GC.deep,GC.deepS,y),d*d),[226,240,236],rim)}
    case T.WET:return GC.wet.map(v=>v*(.95+n*.08));
    case T.SAND:return mix(GC.sand,GC.sandS,nS(y)).map(v=>v*(.96+n*.06));
    case T.DUNE:return mix(GC.dune,GC.sand,n*.6);
    case T.ROCK:return mix(GC.rock2,GC.rock,fbm(x/120,y/120));
    case T.SNOW:return GC.snow.map(v=>v*(.95+n*.05));
    case T.ALPINE:return mix(GC.alpine,GC.rock,n*.5);
    case T.MEADOW:return blend3(GC.meadowN,GC.meadow,GC.meadowS,y).map(v=>v*(.92+n*.14));
    case T.FLOOR:{const b=blend3(GC.floorN,GC.floor,GC.floorS,y),l=fbm(x/260+4,y/260+9);return mix(b,GC.litter,clamp((l-.45)*1.6,0,.55)*(1-nN(y)*.6)).map(v=>v*(.9+n*.16))}
    default:return habColor(x,y,t,n)||GC.floor}}
function zoneName(x,y){return placeName(x,y)}
function zoneCat(x,y){return HAB_CATS[HABITATS[habitatAt(x,y)].cat].name}
function tempC(x,y){if(BRI)return Math.round(lerp(8,13,y/WH)+({spring:0,summer:7,fall:1,winter:-7})[SEASON]-mtnK(x,y)*9);if(ISLE)return Math.round((CAR?27:25)+({spring:0,summer:2,fall:1,winter:-2})[SEASON]-mtnK(x,y)*(CAR?11:24));if(WEST)return Math.round(lerp(-8,30,y/WH)-mtnK(x,y)*12+({spring:0,summer:9,fall:-2,winter:-12})[SEASON]);if(CENTRAL)return Math.round(lerp(-3,31,y/WH)-mtnK(x,y)*6+({spring:0,summer:9,fall:-2,winter:-15})[SEASON]);return Math.round(lerp(-6,29,y/WH)-mtnK(x,y)*7+({spring:0,summer:8,fall:-2,winter:-14})[SEASON])}

/* ---------- trees and decorations, generated per grid cell from a per-cell seed ---------- */
const CELLS=new Map();
function cellKey(cx,cy){return cx*1000+cy}
// world streaming: cells are made as you come near and dropped once they are far from you and the camera and unused for a few seconds
// (Pirate Seas does the same). Trees a far-off bird is perched on are kept by id so the bird still has its branch.
const CELL_KEEP=3,CELL_IDLE=4;let cellClock=0,cellSweepT=0;
function getCell(cx,cy){const k=cellKey(cx,cy);let c=CELLS.get(k);if(!c){c=genCell(cx,cy);
    for(let i=0;i<c.trees.length;i++){const o=TREE_BY_ID.get(c.trees[i].id);if(o)c.trees[i]=o}CELLS.set(k,c)}
  c.used=cellClock;return c}
function forgetTree(T){if(T.spr){T.spr=null;const i=SPRITED.indexOf(T);if(i>=0)SPRITED.splice(i,1)}}
function sweepCells(dt){cellClock+=dt;if((cellSweepT-=dt)>0)return;cellSweepT=1;
  const L=listener(),px=Math.floor(L.x/CELL),py=Math.floor(L.y/CELL),qx=Math.floor(S.cam.x/CELL),qy=Math.floor(S.cam.y/CELL),keep=new Set();
  for(const b of S.birds){if(b.tree!=null)keep.add(b.tree);if(b.pending&&b.pending.tree!=null)keep.add(b.pending.tree)}
  for(const [k,c] of CELLS){const cx=Math.floor(k/1000),cy=k%1000;
    if(Math.max(Math.abs(cx-px),Math.abs(cy-py))<=CELL_KEEP||Math.max(Math.abs(cx-qx),Math.abs(cy-qy))<=CELL_KEEP||cellClock-c.used<CELL_IDLE)continue;
    for(const T of c.trees)if(!keep.has(T.id)){forgetTree(T);TREE_BY_ID.delete(T.id)}
    CELLS.delete(k)}
  for(const [id,T] of TREE_BY_ID)if(!keep.has(id)&&!CELLS.has(Math.floor(id/10000))){forgetTree(T);TREE_BY_ID.delete(id)}}
const TREE_TYPES=['decid','spruce','birch','pine','palm','liveoak','snag','hemlock','cypress','cedar','mangrove'];
/* Central habitats: forest kinds (open or closed woods, tree mix, height), grassland and scrub plants, ground colours */
const CFOR={aspen:{mw:.5,dens:.75,h:.8,mix:{birch:6,spruce:.4,decid:.4,snag:.3}},
  ponderosa:{mw:.46,dens:.5,h:1,mix:{pine:8,juniper:.9,snag:.3},under:[['grass',.45],['flowers',.05],['rock',.05],['boulder',.02]]},
  pinyon:{mw:.42,dens:.46,h:1,mix:{pinyon:5,juniper:5,snag:.15},under:[['dgrass',.16],['grass',.08],['soapweed',.04],['pear',.04],['boulder',.05]]},
  oakhickory:{mw:.3,dens:1,h:.95,mix:{decid:7,cedar:.5,snag:.45},under:[['fern',.2],['shrub',.15],['grass',.1]]},
  juniperoak:{mw:.42,dens:.6,h:1,mix:{juniper:6,hoak:3.5,decid:.5},under:[['grass',.28],['shrub',.08],['soapweed',.03],['agave',.015],['rock',.05]]},
  skyisland:{mw:.36,dens:.66,h:.8,mix:{pine:4,hoak:3,juniper:1.4,pinyon:1.2},under:[['dgrass',.22],['rock',.08],['agave',.04],['soapweed',.02]]},
  thorn:{mw:.3,dens:.92,h:1,mix:{mesquite:4.5,ebony:3,hoak:.4},under:[['shrub',.22],['pear',.1],['dgrass',.1],['soapweed',.03]]},
  riparian:{mw:.26,dens:1,h:1.1,mix:{decid:8,birch:.3,snag:.5},under:[['shrub',.22],['tallgrass',.12],['fern',.05]]},
  piney:{mw:.3,dens:.85,h:1.05,mix:{pine:7,decid:1,liveoak:.5,snag:.35},under:[['grass',.3],['palmetto',.06],['fern',.06]]},
  boreal:{mw:.36,dens:1,h:1,mix:{spruce:6,birch:1.6,snag:.45}}};
const CVEG={tallgrass:{dens:.004,trees:[['decid',1,10,15]],decor:[['tallgrass',.68],['flowers',.14]],multi:3},
  mixedgrass:{dens:.003,trees:[['cedar',1,4,7]],decor:[['tallgrass',.32],['grass',.3],['flowers',.07]],multi:2},
  shortgrass:{dens:0,decor:[['grass',.34],['pear',.02],['soapweed',.03],['flowers',.03]],multi:2},
  coastalprairie:{dens:.004,trees:[['liveoak',1,6,10]],decor:[['tallgrass',.55],['flowers',.1]],multi:3},
  sagebrush:{dens:0,decor:[['sage',.55],['grass',.16]],multi:3},
  desert:{dens:.006,trees:[['mesquite',1,2.5,4]],decor:[['creosote',.26],['dgrass',.07],['agave',.03],['ocotillo',.02],['pear',.025],['cholla',.02],['soapweed',.015],['barrel',.012],['rock',.02]],multi:1},
  badlands:{dens:.002,trees:[['juniper',1,3,5]],decor:[['dgrass',.05],['boulder',.015],['soapweed',.008]]}};
// [meadow / open ground, forest floor] for each Central habitat; grass and scrub use the first two as a blend
const CCOL={};for(const [k,a,b] of [['tallgrass','#98ad4c','#b6b55c'],['mixedgrass','#b4ab5e','#cbbd73'],['shortgrass','#c6bc86','#d8cc9a'],['coastalprairie','#a2b357','#bfbc69'],
  ['sagebrush','#b3b08b','#a3a588'],['desert','#d6bf95','#c9aa7b'],['aspen','#8dab55','#6f8f45'],['ponderosa','#aba86b','#867f4c'],['pinyon','#c0b183','#a99a6c'],
  ['juniperoak','#a6a46a','#8c8a55'],['skyisland','#98a463','#6f7c48'],['thorn','#b6a874','#958a5a'],['riparian','#7aa04a','#5b7a3b'],['piney','#a4a062','#77733f']])CCOL[k]=[hex(a),hex(b)];
const BADL=[hex('#b5694c'),hex('#cf8f6a'),hex('#e2bf98'),hex('#9e5a44'),hex('#d8a57c')],SALINE=[hex('#e9ece6'),hex('#cfe0e3')];
/* West Coast habitats (Big Year West Plan, draft A): forest kinds, open-country plants and ground colours */
const WFOR={rainforest:{mw:.2,dens:1.15,h:1.45,mix:{spruce:4,hemlock:4,cedar:1.2,decid:.4,snag:.6},under:[['fern',.45],['shrub',.16]]},
  montane:{mw:.34,dens:.9,h:1.2,mix:{pine:4,spruce:3,hemlock:1.5,snag:.4},under:[['grass',.2],['shrub',.12],['fern',.06],['rock',.04]]},
  subalpine:{mw:.46,dens:.85,h:.72,mix:{spruce:7,pine:.8,snag:.5},under:[['grass',.25],['flowers',.08],['rock',.08],['boulder',.03]]},
  oak:{mw:.55,dens:.55,h:.95,mix:{hoak:4,decid:1.6},under:[['dgrass',.35],['grass',.15],['flowers',.04]]},
  pineoak:{mw:.36,dens:.7,h:.85,mix:{pine:4,hoak:3,juniper:1.2},under:[['dgrass',.2],['rock',.08],['agave',.04],['soapweed',.02]]}};
const WVEG={chaparral:{dens:.02,trees:[['hoak',1,3,5]],decor:[['shrub',.62],['sage',.12],['flowers',.03]],multi:3},
  mojave:{dens:.003,trees:[['mesquite',1,2.5,4]],decor:[['creosote',.2],['joshua',.03],['cholla',.025],['dgrass',.08],['barrel',.008],['rock',.02]],multi:1},
  sonoran:{dens:.008,trees:[['mesquite',1,3,5]],decor:[['saguaro',.04],['creosote',.14],['cholla',.04],['ocotillo',.025],['pear',.025],['barrel',.015],['dgrass',.05],['rock',.015]],multi:1},
  meadow:{dens:.002,trees:[['spruce',1,6,10]],decor:[['grass',.45],['flowers',.22],['tallgrass',.08]],multi:3},
  grassland:{dens:.002,trees:[['hoak',1,8,12]],decor:[['dgrass',.35],['grass',.25],['flowers',.04]],multi:2},
  scrub:{dens:.04,trees:[['spruce',1,4,7],['decid',1,4,7],['birch',.5,4,6]],decor:[['shrub',.55],['tallgrass',.12],['flowers',.04]],multi:2},
  canyon:{dens:.002,trees:[['juniper',1,3,5]],decor:[['dgrass',.04],['boulder',.02],['soapweed',.006]]},
  cliffs:{dens:0,decor:[['boulder',.05],['rock',.1],['dgrass',.04]]},rocky:{dens:0,decor:[['boulder',.04],['rock',.12]]}};
const WCOL={};for(const [k,a,b] of [['rainforest','#6d8f4a','#4b6a35'],['montane','#8fa25e','#6a7a45'],['subalpine','#93a774','#6f8358'],['oak','#c2b26a','#9c9a5a'],
  ['pineoak','#9aa363','#707b48'],['chaparral','#a59a63','#8a8352'],['meadow','#9cba5c','#86a84e'],['grassland','#bdb35f','#b0ad62'],['scrub','#a6a565','#8f9157']])WCOL[k]=[hex(a),hex(b)];
if(WEST){Object.assign(CFOR,WFOR);Object.assign(CVEG,WVEG);Object.assign(CCOL,WCOL)}
/* Pacific Isles habitats (Big Year Tropical Isles Plan, draft B): forest kinds, open-country plants and ground colors */
const PFOR={wet:{mw:.14,dens:1.1,h:1,mix:{ohia:7,koa:.5,snag:.25},under:[['treefern',.32],['fern',.28],['shrub',.06]]},
  koa:{mw:.3,dens:.85,h:1,mix:{koa:6,ohia:2.5,snag:.2},under:[['treefern',.06],['fern',.16],['grass',.22],['shrub',.06]]},
  mamane:{mw:.52,dens:.5,h:1,mix:{mamane:7,ohia:.5},under:[['dgrass',.3],['grass',.1],['rock',.06]]},
  valley:{mw:.26,dens:.95,h:1,mix:{decid:3,hoak:2,palm:1.4,ohia:1},under:[['fern',.22],['shrub',.15],['treefern',.04]]},
  stream:{mw:.32,dens:.75,h:1,mix:{decid:3,palm:2,hoak:1.4,ohia:.8},under:[['taro',.12],['fern',.24],['shrub',.08]]}};
const PVEG={kiawe:{dens:.07,trees:[['mesquite',1,4,7]],decor:[['dgrass',.24],['shrub',.08],['rock',.02]],multi:2},
  dryscrub:{dens:.006,trees:[['mesquite',1,3,5],['palm',.3,7,10]],decor:[['dgrass',.34],['shrub',.12],['grass',.1],['rock',.02]],multi:2},
  pasture:{dens:.004,trees:[['hoak',1,8,12],['ohia',.4,6,9]],decor:[['grass',.42],['tallgrass',.07],['flowers',.03]],multi:3},
  cinder:{dens:0,decor:[['silversword',.09],['rock',.07],['boulder',.02]]},
  lava:{dens:.006,trees:[['ohia',1,2.5,5]],decor:[['fern',.03],['rock',.05],['dgrass',.02]]},
  islets:{dens:0,decor:[['naupaka',.24],['dgrass',.14]],multi:2},
  rocky:{dens:0,decor:[['boulder',.04],['rock',.12],['naupaka',.02]]},
  beach:{dens:.012,trees:[['palm',1,9,14]],decor:[['naupaka',.05]]},
  park:{dens:.035,trees:[['palm',2,9,14],['hoak',1,8,11]],decor:[['flowers',.02]]},golf:{dens:0,decor:[]},
  city:{dens:.03,trees:[['palm',1,9,13]],decor:[['flowers',.02]]}};
const PCOL={};for(const [k,a,b] of [['wet','#5d8a45','#3c6633'],['koa','#7d9a52','#56763e'],['mamane','#aaa86a','#8c8a56'],['valley','#6f9a48','#527a3a'],
  ['stream','#6c9a4a','#4c7838'],['kiawe','#b9ac70','#a39860'],['dryscrub','#c8b07a','#b39d6a'],['pasture','#93b452','#84a84a']])PCOL[k]=[hex(a),hex(b)];
if(PAC){Object.assign(CFOR,PFOR);Object.assign(CVEG,PVEG);Object.assign(CCOL,PCOL)}
/* Caribbean Isle habitats (Big Year Tropical Isles Plan, draft B) */
const KFOR={rain:{mw:.12,dens:1.1,h:1.1,mix:{decid:4,hoak:2,palm:2.5,flambo:.2,snag:.2},under:[['treefern',.25],['fern',.3],['shrub',.08]]},
  cloud:{mw:.18,dens:1.2,h:.55,mix:{ebony:6,palm:1},under:[['fern',.35],['treefern',.08],['shrub',.1]]},
  coffee:{mw:.3,dens:.7,h:1,mix:{hoak:3,decid:3,flambo:1,palm:1},under:[['coffee',.45],['fern',.1],['shrub',.06]]},
  karst:{mw:.24,dens:.9,h:.9,mix:{hoak:3,decid:2,ebony:2,palm:.6},under:[['fern',.2],['shrub',.15],['rock',.05]]},
  dry:{mw:.46,dens:.6,h:.75,mix:{mesquite:3,ebony:3,hoak:.6},under:[['pear',.08],['agave',.05],['saguaro',.02],['dgrass',.25],['rock',.04]]}};
const KVEG={scrub:{dens:.012,trees:[['mesquite',1,3,5],['palm',.5,8,12],['flambo',.3,6,9]],decor:[['shrub',.3],['dgrass',.22],['grass',.1],['naupaka',.03]],multi:2},
  cane:{dens:.002,trees:[['palm',1,9,13]],decor:[['tallgrass',.62],['grass',.12]],multi:3},
  islets:{dens:0,decor:[['naupaka',.2],['dgrass',.14],['pear',.03]],multi:2},
  rocky:{dens:0,decor:[['boulder',.04],['rock',.12],['naupaka',.02]]},
  beach:{dens:.012,trees:[['palm',1,9,14]],decor:[['naupaka',.05]]},
  park:{dens:.035,trees:[['palm',2,9,14],['flambo',1.2,7,10],['hoak',.6,8,11]],decor:[['flowers',.03]]},
  city:{dens:.03,trees:[['palm',1,9,13],['flambo',.5,7,10]],decor:[['flowers',.02]]}};
const KCOL={};for(const [k,a,b] of [['rain','#4f7f45','#2f5c33'],['cloud','#6f8a6a','#4f6a52'],['coffee','#6f9a50','#4c7a3c'],['karst','#86a454','#5e7f40'],
  ['dry','#b2a66c','#968c5a'],['scrub','#c2b077','#ab9c69'],['cane','#a8c25c','#98b452']])KCOL[k]=[hex(a),hex(b)];
if(CAR){Object.assign(CFOR,KFOR);Object.assign(CVEG,KVEG);Object.assign(CCOL,KCOL)}
/* British Isle habitats (Big Year British Isle Plan, draft A) */
const BFOR={oakwood:{mw:.22,dens:1,h:1,mix:{oak:5,ash:2,beech:.6,hawthorn:.8,birch:.6,yew:.2,snag:.2},under:[['bluebell',.42],['bracken',.18],['fern',.12],['shrub',.1]]},
  beechwood:{mw:.12,dens:1.1,h:1,mix:{beech:7,oak:1,yew:.8,ash:.6},under:[['bluebell',.22],['fern',.06]]},
  pinewood:{mw:.3,dens:.8,h:1,mix:{pine:7,birch:1.6,rowan:.5,snag:.3},under:[['heather',.3],['blueberry',.25],['bracken',.12]]},
  glen:{mw:.36,dens:.75,h:.8,mix:{birch:6,rowan:1.4,willow:1,oak:.6},under:[['bracken',.32],['fern',.14],['foxglove',.05]]},
  conifer:{mw:.05,dens:1.25,h:1,mix:{spruce:8,pine:.6},under:[['fern',.06]]}};
const BVEG={moor:{dens:.002,trees:[['rowan',1,4,6],['birch',1,5,8]],decor:[['heather',.62],['grass',.1],['bracken',.06],['rock',.03]],multi:3},
  heath:{dens:.012,trees:[['pine',1,8,14],['birch',1.2,6,10],['oak',.4,8,12]],decor:[['heather',.38],['gorse',.3],['bracken',.1]],multi:2},
  downs:{dens:.002,trees:[['hawthorn',2,4,6],['yew',.5,6,9]],decor:[['grass',.18],['flowers',.12],['sheep',.012]],multi:2},
  pasture:{dens:.004,trees:[['oak',2,12,17],['hawthorn',1,4,6],['ash',.6,11,15]],decor:[['grass',.14],['sheep',.014],['cow',.004]],multi:2},
  machair:{dens:0,decor:[['flowers',.3],['grass',.2],['thrift',.04]],multi:3},
  tundra:{dens:0,decor:[['heath',.2],['rock',.1]]},
  bog:{dens:.002,trees:[['birch',1,3,5]],decor:[['cotton',.34],['heather',.2],['grass',.12]],multi:3},
  cliffs:{dens:0,decor:[['thrift',.06],['rock',.06]]},
  beach:{dens:0,decor:[['dgrass',.05]]},
  islets:{dens:0,decor:[['thrift',.12],['rock',.08]]},
  saltmarsh:{dens:0,decor:[['cordgrass',.6]],multi:3},
  park:{dens:.03,trees:[['decid',2,13,19],['oak',1,12,17],['willow',.6,9,13],['yew',.3,7,10]],decor:[['flowers',.04]]},
  city:{dens:.02,trees:[['decid',2,12,17],['oak',.6,11,15]],decor:[['flowers',.02]]}};
const BRCOL={};for(const [k,a,b] of [['oakwood','#5e8a46','#3f6a35'],['beechwood','#7a8a4a','#4f6a38'],['pinewood','#6c7a52','#435a3f'],['glen','#7c9a58','#56743f'],['conifer','#4f6a48','#33503c'],
  ['moor','#7a5f6a','#6b5a4a'],['heath','#8a7f52','#7a6a48'],['downs','#a8bf72','#c2cf88'],['pasture','#6fa04a','#86b456'],['machair','#a9c26e','#cbd48a'],['tundra','#8c8f7c','#a8a796'],['bog','#8a7f56','#a09464']])BRCOL[k]=[hex(a),hex(b)];
if(BRI){Object.assign(CFOR,BFOR);Object.assign(CVEG,BVEG);Object.assign(CCOL,BRCOL)}
// north of the Dales the field edges are dry-stone walls, not hedges
const BR_WALLY=21500,BR_WALL={dens:0,decor:[]};
// the ground of the British habitats: heather moor that blooms purple in late summer, gorse, chalk downland, peat bog, chalk and granite cliffs, a grey-green sea
const BRC={sea:hex('#3f6f82'),seaD:hex('#284f66'),seaS:hex('#5b8a92'),chalk:hex('#eeece4'),chalk2:hex('#d9d6cc'),gran:hex('#8a8780'),gran2:hex('#6a6862'),turf:hex('#7e9e52'),
  heather:hex('#7a5a6e'),heatherB:hex('#9a5a92'),heather2:hex('#5f5048'),peat:hex('#5a4a38'),bogpool:hex('#3d4a44'),wall:hex('#9a968c'),wall2:hex('#76726a'),hedge:hex('#3f6a32')};
// the white horse cut into the chalk of the Downs (B-F4): body, neck, head, four legs and a tail, about 50 m long
function brHorse(u,v){if(u<-300||u>320||v<-170||v>190)return false;const seg=(ax,ay,bx,by,w)=>{const dx=bx-ax,dy=by-ay,t=clamp(((u-ax)*dx+(v-ay)*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(u-ax-t*dx,v-ay-t*dy)<w};
  return((u/160)**2+(v/38)**2<1)||seg(120,-15,215,-105,26)||((u-245)/52)**2+((v+118)/20)**2<1||seg(-105,18,-140,140,13)||seg(-55,22,-68,150,13)||seg(65,18,88,145,13)||seg(118,12,150,132,13)||seg(-150,-8,-245,55,11)}
function brColor(x,y,t,n){const k=wkey(x,y);
  if(t===T.SHAL||t===T.DEEP){if(k!=='ocean'&&k!=='pelagic'&&k!=='bay')return null;const d=wdist(x,y);let c=mix(BRC.seaS,BRC.sea,clamp(d/260,0,1));c=mix(c,BRC.seaD,clamp((d-500)/1400,0,1));if(d<9)c=mix(c,[232,240,238],(1-d/9)*.4);return c.map(v=>v*(.97+n*.05))}
  if(t===T.HEDGE){const F=farmAt(x,y);let d=99;if(F){const f=FIELDS.find(q=>q.farm&&x>q.x0-80&&x<q.x1+80&&y>q.y0-80&&y<q.y1+80);if(f)d=Math.max(f.x0-x,x-f.x1,f.y0-y,y-f.y1)}
    const grass=hex('#6fa04a').map(v=>v*(.92+n*.12));if(y<BR_WALLY){if(d>4&&d<17){const st=((Math.floor(x/5)+Math.floor(y/3.5))&1)?BRC.wall:BRC.wall2;return st.map(v=>v*(.92+n*.12))}return grass}
    return d<30?BRC.hedge.map(v=>v*(.88+n*.18)):grass}
  if(k==='cliffs'&&t!==T.LAKE){const chalk=(x>17500&&y>29500)||y>32600&&x>13700&&x<16200,f=fbm(x/40+2,y/40+7),d=wdist(x,y);let c=chalk?mix(BRC.chalk,BRC.chalk2,f):mix(BRC.gran,BRC.gran2,f);
    if(chalk&&d<44){c=d<34?mix(BRC.chalk,hex('#c9c6bc'),clamp(fbm(x/6+3,y/30+1)*1.4-.4,0,.7)):hex('#a8a59a')}else if(d>70)c=mix(c,BRC.turf,clamp((d-70)/40,0,.85));if(!chalk&&fbm(x/26+3,y/11+8)>.64)c=mix(c,hex('#eeebe2'),.4);if(d<40)c=mix(c,hex('#4a4a46'),(1-d/40)*.4);return c.map(v=>v*(.95+n*.08))}
  if(k==='moor'&&t===T.SCRUB){const f=fbm(x/90+1,y/90+6),bloom=SEASON==='summer'?.3:SEASON==='fall'?.1:0;let c=mix(BRC.heather,BRC.heather2,f);if(bloom)c=mix(c,BRC.heatherB,bloom*clamp(fbm(x/40+5,y/40+2)*1.6-.3,0,1));
    if(fbm(x/200+7,y/200+3)>.62)c=mix(c,hex('#8a9a5a'),.4);if(SEASON==='winter')c=mix(c,hex('#6a5040'),.3);return c.map(v=>v*(.92+n*.12))}
  if(k==='bog'&&t===T.BOG){const f=fbm(x/50+3,y/50+8);return(f>.66?mix(BRC.bogpool,BRC.peat,.2):mix(BRC.peat,hex('#a09060'),clamp(fbm(x/120,y/120)*1.4-.2,0,1))).map(v=>v*(.92+n*.12))}
  if(k==='heath'&&t===T.SCRUB){const f=fbm(x/70+4,y/70+2);let c=mix(hex('#8a7a50'),hex('#6a5a48'),f);if(f>.6)c=mix(c,hex('#3f6a32'),.5);return c.map(v=>v*(.92+n*.12))}
  if(k==='downs'&&t===T.GRASS&&WD.horse&&brHorse(x-WD.horse[0],y-WD.horse[1]))return BRC.chalk.map(v=>v*(.97+n*.04));
  if(k==='downs'&&t===T.GRASS){const f=fbm(x/120+2,y/120+5);let c=mix(hex('#a8bf72'),hex('#c6cf8e'),f);return c.map(v=>v*(.95+n*.08))}
  return null}
// many small fields: look fields up in a coarse grid instead of a list
const BR_ST={thatch:{wall:'#f3efe4',roof:'#b8975a',thatch:1},honey:{wall:'#d8b676',roof:'#8a7e6a',stone:1},slate:{wall:'#8d8c86',roof:'#3f454d',stone:1},
  grey:{wall:'#a8a399',roof:'#4a4f57',stone:1},brick:{wall:'#a5543c',roof:'#8f4a36',brick:1},white:{wall:'#f2f0ea',roof:'#5a5f66'},harl:{wall:'#efede6',roof:'#3f454d'},
  black:{wall:'#8a857a',roof:'#7a6844',thatch:1,low:1,stone:1},redroof:{wall:'#ece4d2',roof:'#b4553a'}};
const BR_DOORS=['#2f4a3a','#6b1f24','#1f2f4a','#2a2a2a','#4a6a8a','#7a5a2a','#3a5a3a'];
function brStyleAt(x,y){return y<18000?'harl':x<9000&&y>23000&&y<29000?'slate':y<23500?'grey':y>30000&&x<9000?'white':x>16500?'brick':'honey'}
const BR_CROPS=['wheat','rape','plowed','barley','wheat','rape','barley'];





// which trees grow in each forest habitat
function pickType(r,x,y,h){if(CENTRAL&&CFOR[h]){const W=CFOR[h].mix;let tot=0;for(const k in W)tot+=W[k];let q=r()*tot;for(const k in W){q-=W[k];if(q<=0)return k}return'decid'}
  const s=nS(y),n=nN(y),coast=x>coastX(y)-1200;
  const W={boreal:{spruce:6,birch:1.6,hemlock:.3,snag:.45},highlands:{spruce:7,birch:.5,snag:.4},
    hardwood:{decid:6,hemlock:1.4,birch:.6+n,pine:.8,snag:.45,spruce:n*2},foothills:{decid:5,hemlock:2.2,pine:.6,birch:.3,snag:.45},
    maritime:{pine:3,decid:1.5*(1-s),liveoak:2*s,cedar:1,palm:1.6*s,snag:.3,spruce:n*2},southern:{pine:2.5,liveoak:3.2,palm:coast?2.2:.9,decid:.6,snag:.45}}[h]||{decid:5,pine:1,snag:.4};
  let tot=0;for(const k in W)tot+=W[k];let q=r()*tot;for(const k in W){q-=W[k];if(q<=0)return k}return'decid'}
// what grows in each habitat: tree density, tree mix (with height range) and ground cover
const VEG={
  [T.SWAMP]:{dens:.27,trees:[['cypress',7,16,26],['decid',2,12,18],['snag',.6,9,16]],decor:[['knee',.16],['fern',.08],['lily',.05]]},
  [T.MARSH]:{dens:.006,trees:[['snag',1,7,12]],decor:[['cattail',.62],['reed',.25]],multi:3},
  [T.SALT]:{dens:0,decor:[['cordgrass',.7]],multi:3},
  [T.GRASS]:{dens:.012,trees:[['decid',1,13,19]],decor:[['tallgrass',.66],['flowers',.16]],multi:3},
  [T.SCRUB]:{dens:.11,trees:[['cedar',3,5,9],['decid',2,5,9],['pine',1,7,11],['birch',.5,6,9]],decor:[['shrub',.5],['tallgrass',.2],['flowers',.06]],multi:2},
  [T.SANDHILL]:{dens:.085,trees:[['pine',5,14,22],['liveoak',2,5,8]],decor:[['dgrass',.22],['palmetto',.1],['yucca',.07],['pear',.07]]},
  [T.HEDGE]:{dens:.28,trees:[['decid',3,9,16],['cedar',1,6,10]],decor:[['shrub',.6]]},
  [T.PARK]:{dens:.06,trees:[['decid',1,12,18]],decor:[['flowers',.03]]},
  [T.BOG]:{dens:.05,trees:[['spruce',4,4,8],['snag',.6,5,8]],decor:[['blueberry',.3],['grass',.22],['cattail',.05]],multi:2},
  [T.MANGROVE]:{dens:.42,trees:[['mangrove',6,4,7.5],['palm',.3,7,10]],decor:[['knee',.12]]},
  [T.ARCTIC]:{dens:0,decor:[['heath',.16],['rock',.05],['mound',.04]]},
  [T.MUD]:{dens:0,decor:[['shell',.02]]},
  [T.FIELD]:{dens:0,decor:[]},[T.YARD]:{dens:0,decor:[]},[T.CITY]:{dens:0,decor:[]},[T.ICE]:{dens:0,decor:[]}};
if(BRI)VEG[T.HEDGE]={dens:.3,trees:[['hawthorn',4,4,6.5],['oak',1.4,11,16],['ash',.8,10,14],['yew',.15,6,9]],decor:[['shrub',.55],['hedgeflower',.12]]};
function vegPick(r,list){let tot=0;for(const e of list)tot+=e[1];let q=r()*tot;for(const e of list){q-=e[1];if(q<=0)return e}return list[0]}
const TREE_R={banyan:14,flambo:8,ohia:6,koa:8,mamane:5,palm:5,liveoak:9,cypress:6,cedar:4,mangrove:6,juniper:4,pinyon:4,mesquite:6,hoak:7,ebony:5};
/* DC1: Central dry-country trees. th trunk height, rh/rv crown half-width/half-height, ch crown centre (all × tree height),
   stems extra trunks, br limbs, nc leaf clumps, cr clump size, kind of foliage for the binoculars, sh shadow, hmin+hvar height in metres */
const CT_SHAPE={
  juniper:{th:.16,rh:.44,rv:.36,ch:.5,w0:.22,w1:.1,stems:3,br:6,bw:.07,nc:46,cr:.27,kind:'needle',sh:.42,hmin:3.5,hvar:3.5},
  pinyon:{th:.2,rh:.38,rv:.38,ch:.56,w0:.24,w1:.1,stems:1,br:6,bw:.07,nc:44,cr:.26,kind:'needle',sh:.38,hmin:4.5,hvar:3},
  mesquite:{th:.42,rh:.62,rv:.2,ch:.74,w0:.15,w1:.07,stems:3,br:7,bw:.06,nc:22,cr:.16,kind:'leaf',sh:.56,hmin:4,hvar:3.5},
  hoak:{th:.3,rh:.5,rv:.3,ch:.6,w0:.42,w1:.26,stems:1,br:7,bw:.14,nc:34,cr:.18,kind:'leaf',sh:.5,hmin:7,hvar:4},
  ebony:{th:.26,rh:.4,rv:.32,ch:.6,w0:.22,w1:.12,stems:2,br:6,bw:.08,nc:30,cr:.2,kind:'leaf',sh:.4,hmin:5,hvar:3},
  ohia:{th:.36,rh:.4,rv:.34,ch:.64,w0:.24,w1:.12,stems:2,br:7,bw:.08,nc:34,cr:.2,kind:'leaf',sh:.45,hmin:7,hvar:7},
  koa:{th:.46,rh:.52,rv:.24,ch:.74,w0:.36,w1:.2,stems:1,br:8,bw:.11,nc:38,cr:.18,kind:'leaf',sh:.55,hmin:13,hvar:7},
  mamane:{th:.3,rh:.42,rv:.3,ch:.6,w0:.18,w1:.1,stems:2,br:6,bw:.07,nc:26,cr:.2,kind:'leaf',sh:.4,hmin:4,hvar:3},
  flambo:{th:.42,rh:.62,rv:.22,ch:.7,w0:.3,w1:.16,stems:1,br:8,bw:.1,nc:36,cr:.18,kind:'leaf',sh:.6,hmin:7,hvar:4},
  banyan:{th:.34,rh:1.15,rv:.3,ch:.68,w0:.6,w1:.4,stems:5,br:12,bw:.2,nc:70,cr:.15,kind:'leaf',sh:.7,hmin:14,hvar:3}};
function genCell(cx,cy){const r=rng(cx*7919+cy*104729+13),trees=[],decor=[];const x0=cx*CELL,y0=cy*CELL;
  const STEP=62;const addTree=(type,x,y,h,v)=>(TSTYLE==='prairie'&&inPark(x,y)&&parkPath(x,y,10))?0:trees.push({id:cellKey(cx,cy)*10000+trees.length,x,y,type,h,v,seed:(r()*1e9)|0,r:TREE_R[type]||(h<9?5:7)});
  for(let gy=0;gy<CELL/STEP;gy++)for(let gx=0;gx<CELL/STEP;gx++){
    const x=x0+(gx+.5)*STEP+(r()-.5)*44,y=y0+(gy+.5)*STEP+(r()-.5)*44,q=r();
    if(x<0||x>WW||y<0||y>WH)continue;const t=terr(x,y);
    if(roadAt(x,y,t>=T.LAKE?30:44)||onPier(x,y)||buildingAt(x,y,30))continue;
    if(AP&&[AP.rw,AP.ap].some(R=>x>R[0]-280&&x<R[2]+280&&y>R[1]-200&&y<R[3]+300))continue;
    if(CENTRAL&&t!==T.LAKE&&!inCity(x,y,300)){const rk=rockAt(x,y);if(rk&&q<rk.p&&!nearTrail(x,y,150)){decor.push({k:rk.k,x,y,s:r()});continue}}
    const V=t===T.PARK&&inPark(x,y)?parkVeg(x,y):BRI&&t===T.HEDGE?(y<BR_WALLY?BR_WALL:VEG[t]):BRI&&t===T.FIELD?null:(CENTRAL&&CVEG[wkey(x,y)])||VEG[t];if(t===T.PARK&&inPark(x,y)&&!V)continue;
    if(V){if(nearTrail(x,y,170)||Math.hypot(x-START.x,y-START.y)<260)continue;
      if(q<V.dens&&!(t===T.GRASS&&!WEST&&x>coastX(y)-200)){const e=vegPick(r,V.trees);addTree(e[0],x,y,e[2]+r()*(e[3]-e[2]));
        if(e[0]==='cypress')for(let k=0;k<3;k++)decor.push({k:'knee',x:x+(r()-.5)*70,y:y+8+r()*40,s:r()})}
      else{let acc=V.dens;for(const [k,p] of V.decor){acc+=p;if(q<acc){if(SEASON==='winter'&&(k==='flowers'||k==='lily'))break;decor.push({k,x,y,s:r()});
        for(let m=1;m<(V.multi||1);m++){const mx=x+(r()-.5)*58,my=y+(r()-.5)*58;if(terr(mx,my)===t)decor.push({k:r()<.8?k:V.decor[0][0],x:mx,y:my,s:r()})}break}}}
      continue}
    if(t===T.LAKE){const hk=wkey(x,y);if((hk==='lake'||hk==='pond'||hk==='river'||hk==='marsh'||hk==='swamp')&&wdist(x,y)<(hk==='river'?20:70)&&q<.12)decor.push({k:'lily',x,y,s:r()});continue}
    if(t!==T.FLOOR&&t!==T.MEADOW&&t!==T.ALPINE&&t!==T.ROCK){
      if(t===T.DUNE&&q<.6)decor.push({k:'dgrass',x,y,s:r()});
      else if(t===T.SAND&&q<.05&&!inCity(x,y,200))decor.push({k:r()<.6?'shell':'drift',x,y,s:r()});
      else if(t===T.SNOW&&q<.08)decor.push({k:'mound',x,y,s:r()});
      continue}
    if(nearTrail(x,y,170)||Math.hypot(x-START.x,y-START.y)<260)continue;
    const hab=wkey(x,y);if(hab==='rocky'||hab==='tundra'||hab==='arctic'){if(q<.3)decor.push({k:hab==='tundra'&&t===T.ALPINE?'heath':'rock',x,y,s:r()});continue}
    const fm=forestMask(x,y);
    let dens=t===T.MEADOW?.04:t===T.ROCK?.06:t===T.ALPINE?.2:sstep(.34,.55,fm)*.62;
    if(hab==='highlands')dens=Math.max(dens,.3)*(t===T.ROCK?.3:1);
    const CF=CENTRAL?CFOR[hab]:null;if(CF){dens*=CF.dens;if(TROP&&t===T.FLOOR)dens=Math.max(dens,.3*CF.dens);if(t===T.ROCK)dens=.02}
    if(CF&&CF.under&&q>=dens){if(q<dens+.3&&t!==T.ROCK){const u=vegPick(r,CF.under);if(r()<u[1]*2.2)decor.push({k:u[0],x,y,s:r()})}else if(t===T.ROCK&&q<.2)decor.push({k:'rock',x,y,s:r()});continue}
    if(q<dens){const type=pickType(r,x,y,hab);const h=CT_SHAPE[type]?CT_SHAPE[type].hmin+r()*CT_SHAPE[type].hvar:type==='palm'?9+r()*5:type==='liveoak'?10+r()*5:type==='birch'?11+r()*5:type==='snag'?9+r()*9:type==='pine'?17+r()*8:type==='spruce'||type==='hemlock'?13+r()*9:14+r()*9;
      addTree(type,x,y,hab==='highlands'?h*.65:CF&&!CT_SHAPE[type]?h*CF.h*(.85+r()*.3):h)}
    else if(q<dens+.25&&t!==T.ROCK&&t!==T.ALPINE){const s=nS(y),n=nN(y);if(snowCover(x,y,hab)>.6){if(q<dens+.08)decor.push({k:'mound',x,y,s:r()});continue}decor.push({k:s>.5?(r()<.6?'palmetto':'fern'):n>.5?(r()<.5?'blueberry':'fern'):(r()<.45?'laurel':r()<.6?'fern':'grass'),x,y,s:r()})}
    else if(t===T.MEADOW&&q<dens+.5)decor.push({k:'grass',x,y,s:r()});
    else if(t===T.ALPINE&&q<dens+.3)decor.push({k:'heath',x,y,s:r()});
    else if((t===T.ROCK||t===T.ALPINE)&&q<.3)decor.push({k:'rock',x,y,s:r()});
  }
  const pl=plantedIn(cx,cy);for(const p of pl.trees){addTree(p.type,p.x,p.y,p.h,p.v)}for(const d of pl.decor)decor.push({...d});
  return{trees,decor}}
function cellsNear(x,y,rad){const out=[];const c0=Math.floor((x-rad)/CELL),c1=Math.floor((x+rad)/CELL),r0=Math.floor((y-rad)/CELL),r1=Math.floor((y+rad)/CELL);
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++)if(cx>=0&&cy>=0&&cx*CELL<WW&&cy*CELL<WH)out.push(getCell(cx,cy));return out}
function treesNear(x,y,rad){const out=[];for(const c of cellsNear(x,y,rad))for(const t of c.trees)if(Math.abs(t.x-x)<rad&&Math.abs(t.y-y)<rad)out.push(t);return out}
const TREE_BY_ID=new Map();
function treeById(id){let t=TREE_BY_ID.get(id);if(t)return t;const ck=Math.floor(id/10000),c=getCell(Math.floor(ck/1000),ck%1000);t=c.trees[id%10000];if(t)TREE_BY_ID.set(id,t);return t}

// plover nesting areas, roped off with string fencing
const FENCES=[];if(!CENTRAL)for(const y of[...WD.places.filter(p=>p[0]==='Plover nesting').map(p=>p[2]),12600,21600,24400,26900])FENCES.push({x:coastX(y)-250,y:y-180,w:170,h:360});

/* ---------- habitats ----------
   The map is divided into habitats, and each one is tied to the birds that live there.
   Five groups: woodland, aquatic, scrub-shrub, open and urban. */
const HAB_CATS={woodland:{name:'Woodland',col:'#3f6b3f'},aquatic:{name:'Aquatic',col:'#2f7891'},scrub:{name:'Scrub-shrub',col:'#8a7330'},open:{name:'Open',col:'#b0812c'},urban:{name:'Urban',col:'#5f6170'}};
const HABITATS={
  boreal:{name:'Boreal spruce forest',cat:'woodland',sub:'Coniferous',desc:'Dark red spruce and fir with birch and a carpet of moss and blueberry. Cold, quiet and mossy.',play:['btbw'],birds:['Blackburnian Warbler','Boreal Chickadee','Spruce Grouse','Black-backed Woodpecker']},
  highlands:{name:'Spruce–fir highlands',cat:'woodland',sub:'Coniferous',desc:'Stunted spruce and fir on the high ridges, wrapped in fog and snow patches.',play:[],birds:["Bicknell's Thrush",'Blackpoll Warbler','Red Crossbill']},
  tundra:{name:'Alpine tundra',cat:'open',sub:'Tundra',desc:'Above the tree line on the northern summits: bare rock, snow and low cushion plants hugging the ground.',play:[],birds:['American Pipit','Common Raven','Dark-eyed Junco']},
  arctic:{name:'Arctic tundra',cat:'open',sub:'Tundra',desc:'The far north: lichen, moss and dwarf willow, snowfields and hundreds of small thaw pools under a huge sky.',play:[],birds:['Snowy Owl','Snow Bunting','Willow Ptarmigan','Lapland Longspur']},
  hardwood:{name:'Eastern hardwood forest',cat:'woodland',sub:'Deciduous',desc:'Oak, maple and beech with hemlock in the cool hollows and laurel thickets below.',play:['btbw','pile'],birds:['Scarlet Tanager','Wood Thrush','Ovenbird','Red-eyed Vireo']},
  foothills:{name:'Blue Ridge foothills',cat:'woodland',sub:'Mixed',desc:'Hardwoods and hemlock climbing the first ridges, rocky and steep.',play:['btbw','pile'],birds:['Cerulean Warbler','Ruffed Grouse','Hooded Warbler']},
  maritime:{name:'Maritime forest',cat:'woodland',sub:'Mixed',desc:'Salt-pruned oaks, pines and holly just behind the dunes.',play:['pile'],birds:['Pine Warbler','Brown-headed Nuthatch','Painted Bunting']},
  southern:{name:'Live oak & longleaf pine',cat:'woodland',sub:'Mixed',desc:'Moss-draped live oaks, tall longleaf pines and palmetto in the warm south.',play:['pile'],birds:['Red-cockaded Woodpecker','Northern Parula','Summer Tanager']},
  swamp:{name:'Cypress swamp',cat:'aquatic',sub:'Swamp',desc:'Bald cypress standing in dark still water, knees poking up, Spanish moss everywhere.',play:['pile'],birds:['Prothonotary Warbler','Barred Owl','Anhinga','Wood Duck']},
  lake:{name:'Lake',cat:'aquatic',sub:'Lake',desc:'Deep, clear cold water ringed with sedge and spruce.',play:[],birds:['Common Loon','Osprey','Bald Eagle','Common Merganser']},
  pond:{name:'Pond',cat:'aquatic',sub:'Pond',desc:'A small, still pond with cattails, lily pads and a dock.',play:[],birds:['Wood Duck','Belted Kingfisher','Green Heron','Pied-billed Grebe']},
  river:{name:'River',cat:'aquatic',sub:'River',desc:'Creeks and brooks running from the mountains to the sea.',play:[],birds:['Belted Kingfisher','Louisiana Waterthrush','Spotted Sandpiper']},
  bog:{name:'Spruce bog & fen',cat:'aquatic',sub:'Bog',desc:'A spongy mat of sphagnum moss and sedge with stunted black spruce and little dark pools. Wet underfoot.',play:[],birds:['Palm Warbler',"Lincoln's Sparrow",'Olive-sided Flycatcher','Rusty Blackbird']},
  marsh:{name:'Freshwater marsh',cat:'aquatic',sub:'Marsh',desc:'Cattails and reeds with open pools: loud with blackbirds, hiding rails and herons.',play:[],birds:['Red-winged Blackbird','Marsh Wren','Great Blue Heron','Sora']},
  saltmarsh:{name:'Salt marsh',cat:'aquatic',sub:'Salt marsh',desc:'Flat cordgrass meadows cut by tidal creeks, flooded and drained twice a day.',play:[],birds:['Clapper Rail','Saltmarsh Sparrow','Great Egret','Willet']},
  bay:{name:'Back bay & tidal flats',cat:'aquatic',sub:'Estuary',desc:'Sheltered shallow water behind the barrier island. At low tide the mudflats fill with feeding shorebirds.',play:[],birds:['Brant','Dunlin','Black Skimmer','Short-billed Dowitcher']},
  beach:{name:'Beach & dunes',cat:'aquatic',sub:'Shoreline',desc:'Open sand, dunes and the wrack line where shorebirds feed and nest.',play:['pipl'],birds:['Sanderling','Least Tern','American Oystercatcher']},
  rocky:{name:'Rocky shore',cat:'aquatic',sub:'Shoreline',desc:'Granite ledges and boulders battered by cold surf, with little sandy coves between the headlands.',play:[],birds:['Purple Sandpiper','Common Eider','Black Guillemot','Ruddy Turnstone']},
  mangrove:{name:'Mangrove keys',cat:'aquatic',sub:'Mangrove',desc:'Low islands of tangled mangrove roots in warm, clear water at the far southern end.',play:[],birds:['Roseate Spoonbill','Mangrove Cuckoo','White-crowned Pigeon','Magnificent Frigatebird']},
  ocean:{name:'Nearshore ocean',cat:'aquatic',sub:'Ocean',desc:'Open water beyond the surf, out to the shelf edge.',play:[],birds:['Northern Gannet','Brown Pelican','Common Eider']},
  pelagic:{name:'Offshore waters',cat:'aquatic',sub:'Ocean',desc:'Deep blue water past the shelf edge, out of sight of land.',play:[],birds:['Great Shearwater',"Wilson's Storm-Petrel",'Northern Fulmar','Pomarine Jaeger']},
  scrub:{name:'Shrubland',cat:'scrub',sub:'Scrub-shrub',desc:'Old fields growing back, hedgerows, clearcuts and the powerline cut: dogwood, sumac, red cedar and young trees in tangles.',play:[],birds:['Prairie Warbler','Eastern Towhee','Brown Thrasher','Field Sparrow']},
  sandhill:{name:'Sandhill scrub',cat:'scrub',sub:'Dry sandy scrub',desc:'Our driest habitat, almost a desert: white sand, wiregrass, scrub oak, yucca and prickly pear.',play:[],birds:['Florida Scrub-Jay',"Bachman's Sparrow",'Common Ground Dove']},
  grassland:{name:'Grassland',cat:'open',sub:'Grassland',desc:'Tall grass and wildflowers rolling to the foot of the mountains, plus blueberry barrens in the north.',play:[],birds:['Bobolink','Eastern Meadowlark','Grasshopper Sparrow','Northern Harrier']},
  farm:{name:'Farmland',cat:'open',sub:'Agricultural',desc:'Three small family farms: crop, hay and pasture fields split by hedgerows, each with a red barn and silo.',play:[],birds:['Barn Swallow','Killdeer','American Kestrel','Eastern Bluebird']},
  city:{name:'Port Bostick',cat:'urban',sub:'City',desc:'A small coastal city: shops, offices, apartments, hotels on Ocean Drive, a fishing pier and a marina.',play:[],birds:['Rock Pigeon','House Sparrow','Peregrine Falcon','European Starling']},
  park:{name:'Ellis Park & yards',cat:'urban',sub:'Parks & yards',desc:'Lawns, shade trees and a fountain in the city, and gardens with feeders along Sea Horse Street.',play:[],birds:['American Robin','Northern Cardinal','Blue Jay','Mourning Dove']}};
const HAB_ORDER=['boreal','highlands','hardwood','foothills','maritime','southern','lake','pond','river','bog','marsh','swamp','saltmarsh','bay','beach','rocky','mangrove','ocean','pelagic','scrub','sandhill','grassland','farm','tundra','arctic','city','park'];
// the Central's 34 habitats (Big Year Central Plan, draft A). Birds come in a later update, so play lists start empty
const HAB_C={
  boreal:{name:'Boreal forest',cat:'woodland',sub:'Coniferous',desc:'Spruce and fir across the top of the map, dark, cold and mossy, around Kettle Lake.',birds:['Boreal Chickadee','Gray Jay','Spruce Grouse']},
  aspen:{name:'Aspen parkland',cat:'woodland',sub:'Deciduous',desc:'Groves of white-barked aspen broken by grass: the edge where the forest gives way to the prairie.',birds:['Sharp-tailed Grouse','Black-billed Magpie','Clay-colored Sparrow']},
  ponderosa:{name:'Ponderosa pine hills',cat:'woodland',sub:'Coniferous',desc:'Open, park-like ponderosa pine on the Pine Ridge dome, with grass beneath and rimrock around.',birds:["Lewis's Woodpecker",'Pygmy Nuthatch','Red Crossbill']},
  pinyon:{name:'Pinyon-juniper',cat:'woodland',sub:'Coniferous',desc:'Short, round pinyon pines and junipers scattered over the dry mesas, with bare rock between.',birds:['Pinyon Jay','Woodhouse\'s Scrub-Jay','Juniper Titmouse']},
  oakhickory:{name:'Oak-hickory woods',cat:'woodland',sub:'Deciduous',desc:'Eastern oaks and hickories on the bluffs of the Big Muddy, where eastern birds reach the plains.',birds:['Red-bellied Woodpecker','Kentucky Warbler','Summer Tanager']},
  juniperoak:{name:'Hill Country juniper-oak',cat:'woodland',sub:'Mixed',desc:'Ashe juniper and live oak on rolling limestone hills with clear creeks.',birds:['Golden-cheeked Warbler','Black-capped Vireo','Canyon Towhee']},
  skyisland:{name:'Sky island pine-oak',cat:'woodland',sub:'Mixed',desc:'Pine and oak woods high on Sky Peak, an island of cool forest in the desert.',birds:['Colima Warbler','Mexican Jay','Hepatic Tanager']},
  thorn:{name:'Thorn forest',cat:'woodland',sub:'Thorn scrub',desc:'Dense mesquite, ebony and thorny brush along the Rio Verde.',birds:['Green Jay','Plain Chachalaca','Altamira Oriole']},
  riparian:{name:'Cottonwood riparian',cat:'woodland',sub:'Deciduous',desc:'Tall cottonwoods and willows lining every river across the plains.',birds:["Bullock's Oriole",'Western Kingbird','Red-headed Woodpecker']},
  piney:{name:'Piney woods',cat:'woodland',sub:'Coniferous',desc:'Tall loblolly and longleaf pines in the south-east corner.',birds:['Red-cockaded Woodpecker','Brown-headed Nuthatch','Pine Warbler']},
  lake:{name:'Lakes & reservoirs',cat:'aquatic',sub:'Lake',desc:'Kettle Lake, Pothole Lake, Prairie Reservoir and Canyon Lake.',birds:['American White Pelican','Western Grebe','Common Loon']},
  saline:{name:'Saline lake',cat:'aquatic',sub:'Salt flat',desc:'The Salt Plains: a shallow lake edged with a white salt crust.',birds:['American Avocet','Snowy Plover','Wilson\'s Phalarope']},
  pond:{name:'Ponds & stock tanks',cat:'aquatic',sub:'Pond',desc:'Small ponds and stock tanks scattered over the plains, magnets for birds.',birds:['Blue-winged Teal','Killdeer']},
  river:{name:'Rivers & creeks',cat:'aquatic',sub:'River',desc:'The Cottonwood River, the Big Muddy, the Rio Verde and their creeks.',birds:['Belted Kingfisher','Least Tern']},
  potholes:{name:'Prairie potholes',cat:'aquatic',sub:'Marsh',desc:'Hundreds of small marshy ponds in the prairie: the duck factory of the continent.',birds:['Canvasback','Eared Grebe','Yellow-headed Blackbird']},
  marsh:{name:'Freshwater marsh',cat:'aquatic',sub:'Marsh',desc:'Cattails and open pools at the Bottoms and the Pothole Lake Refuge.',birds:['Sandhill Crane','Franklin\'s Gull','Sora']},
  bog:{name:'Spruce bog',cat:'aquatic',sub:'Bog',desc:'Sphagnum moss and stunted black spruce beside Kettle Lake, with a boardwalk.',birds:['Palm Warbler','Lincoln\'s Sparrow']},
  swamp:{name:'Bottomland swamp',cat:'aquatic',sub:'Swamp',desc:'Cypress and tupelo where the Big Muddy reaches the coast.',birds:['Prothonotary Warbler','Anhinga']},
  saltmarsh:{name:'Salt marsh',cat:'aquatic',sub:'Salt marsh',desc:'Cordgrass flats along Laguna Bay.',birds:['Seaside Sparrow','Clapper Rail']},
  bay:{name:'Laguna Bay & tidal flats',cat:'aquatic',sub:'Estuary',desc:'A shallow bay behind the barrier island, with mudflats at low tide.',birds:['Roseate Spoonbill','Reddish Egret']},
  beach:{name:'Beach & dunes',cat:'aquatic',sub:'Shoreline',desc:'The barrier island\'s Gulf beach.',birds:['Sanderling','Snowy Plover']},
  ocean:{name:'Gulf nearshore',cat:'aquatic',sub:'Ocean',desc:'Warm Gulf water beyond the surf.',birds:['Brown Pelican','Magnificent Frigatebird','Royal Tern']},
  pelagic:{name:'Gulf offshore',cat:'aquatic',sub:'Ocean',desc:'Deep blue Gulf water out of sight of land.',birds:['Masked Booby','Red-necked Phalarope']},
  scrub:{name:'Shrubland',cat:'scrub',sub:'Scrub-shrub',desc:'Brushy edges, old burns and draws.',birds:['Bell\'s Vireo','Field Sparrow']},
  sagebrush:{name:'Sagebrush steppe',cat:'scrub',sub:'Sagebrush',desc:'Silver-grey big sagebrush in the north-west plains.',birds:['Greater Sage-Grouse','Sage Thrasher','Brewer\'s Sparrow']},
  desert:{name:'Chihuahuan desert',cat:'scrub',sub:'Desert',desc:'Creosote bush, yucca and prickly pear under a huge sky.',birds:['Greater Roadrunner','Cactus Wren','Pyrrhuloxia']},
  tallgrass:{name:'Tallgrass prairie',cat:'open',sub:'Grassland',desc:'Big bluestem higher than your head in the Flint Hills.',birds:['Greater Prairie-Chicken','Dickcissel','Henslow\'s Sparrow']},
  mixedgrass:{name:'Mixed-grass prairie',cat:'open',sub:'Grassland',desc:'Knee-high grass and wildflowers across the middle of the plains.',birds:['Upland Sandpiper','Grasshopper Sparrow','Western Meadowlark']},
  shortgrass:{name:'Shortgrass prairie',cat:'open',sub:'Grassland',desc:'Short buffalo grass running to the horizon on the high plains.',birds:['Burrowing Owl','Mountain Plover','Ferruginous Hawk']},
  coastalprairie:{name:'Coastal prairie',cat:'open',sub:'Grassland',desc:'Tall grass and live-oak mottes behind the Gulf coast.',birds:['White-tailed Hawk','Whooping Crane']},
  farm:{name:'Farmland',cat:'open',sub:'Agricultural',desc:'Quarter-section farms of corn, wheat and pasture with stock tanks and hedgerows.',birds:['Horned Lark','Swainson\'s Hawk']},
  badlands:{name:'Badlands & canyons',cat:'open',sub:'Rock',desc:'Banded red and buff badlands and canyon walls.',birds:['Rock Wren','Prairie Falcon','Say\'s Phoebe']},
  city:{name:'Cottonwood',cat:'urban',sub:'Town',desc:'The big town where the Cottonwood River meets the Big Muddy.',birds:['Mississippi Kite','Great-tailed Grackle']},
  park:{name:'Riverside Park & yards',cat:'urban',sub:'Parks & yards',desc:'Riverside Park on the river, the courthouse square, and the shade trees and feeders of the house streets.',birds:['Eurasian Collared-Dove','Blue Jay']}};
for(const k in HAB_C)HAB_C[k].play=[];
const HAB_ORDER_C=['boreal','aspen','ponderosa','pinyon','oakhickory','juniperoak','skyisland','thorn','riparian','piney','lake','saline','pond','river','potholes','marsh','bog','swamp','saltmarsh','bay','beach','ocean','pelagic','scrub','sagebrush','desert','tallgrass','mixedgrass','shortgrass','coastalprairie','farm','badlands','city','park'];

// the West Coast's 35 habitats (Big Year West Plan, draft A). Birds come in a later update, so play lists start empty
const HAB_W={
  boreal:{name:'Boreal forest',cat:'woodland',sub:'Coniferous',desc:'Alaska taiga of spruce and birch around Tamarack Lake, broken by bogs.',birds:['Spruce Grouse','Boreal Chickadee','Bohemian Waxwing']},
  rainforest:{name:'Rainforest & redwoods',cat:'woodland',sub:'Coniferous',desc:'Giant spruce, hemlock and cedar draped in moss along the wet coast, and a grove of redwoods south of Harbor Bay.',birds:['Varied Thrush','Pacific Wren','Spotted Owl']},
  subalpine:{name:'Subalpine spruce-fir',cat:'woodland',sub:'Coniferous',desc:'Dense, short spruce and fir high on the Ice Range, Cinder Peak, the Rockies and the Sierra.',birds:["Clark's Nutcracker",'Pine Grosbeak','Canada Jay']},
  montane:{name:'Mountain conifer forest',cat:'woodland',sub:'Coniferous',desc:'Pine, fir and hemlock on the middle slopes of every range.',birds:["Steller's Jay",'Hermit Warbler','Mountain Chickadee']},
  ponderosa:{name:'Ponderosa pine',cat:'woodland',sub:'Coniferous',desc:'Open, park-like pines on the Rockies foothills and the plateau.',birds:['Pygmy Nuthatch','Flammulated Owl','Western Tanager']},
  pinyon:{name:'Pinyon-juniper',cat:'woodland',sub:'Coniferous',desc:'Round pinyons and junipers on the basin hills and the mesas.',birds:['Pinyon Jay','Juniper Titmouse','Gray Vireo']},
  oak:{name:'Oak woodland',cat:'woodland',sub:'Deciduous',desc:'Spreading oaks over golden grass in the Coast Range and the Sierra foothills.',birds:['Acorn Woodpecker','Oak Titmouse','Yellow-billed Magpie']},
  pineoak:{name:'Sky island pine-oak',cat:'woodland',sub:'Mixed',desc:'Pine and oak woods on Madre Peak, an island of cool forest above the Sonoran desert.',birds:['Elegant Trogon','Painted Redstart','Red-faced Warbler']},
  riparian:{name:'Riparian woods',cat:'woodland',sub:'Deciduous',desc:'Cottonwoods, willows and sycamores along every river and creek.',birds:["Bullock's Oriole",'Yellow-billed Cuckoo',"Lucy's Warbler"]},
  lake:{name:'Lakes & reservoirs',cat:'aquatic',sub:'Lake',desc:'Tamarack Lake, Cedar Lake, Elk Lake and Granite Lake.',birds:['Western Grebe',"Barrow's Goldeneye",'American White Pelican']},
  pond:{name:'Ponds',cat:'aquatic',sub:'Pond',desc:'Farm ponds, stock tanks and mountain tarns.',birds:['Cinnamon Teal','Ring-necked Duck']},
  river:{name:'Rivers & mountain streams',cat:'aquatic',sub:'River',desc:'The Caribou, Gorge, Valley and Canyon Rivers and their creeks.',birds:['American Dipper','Harlequin Duck','Common Merganser']},
  marsh:{name:'Freshwater marsh',cat:'aquatic',sub:'Marsh',desc:'Tules and open water at the Tule Refuge and in the basin.',birds:['Tricolored Blackbird','White-faced Ibis','Sandhill Crane']},
  bog:{name:'Bogs & tundra pools',cat:'aquatic',sub:'Bog',desc:'Thaw pools on the tundra and moss bogs in the boreal forest.',birds:['Red-throated Loon','Red-necked Phalarope']},
  saline:{name:'Saline lakes',cat:'aquatic',sub:'Salt lake',desc:'Soda Lake under the Sierra and the Salt Sea in the desert, edged with white crust.',birds:["Wilson's Phalarope",'American Avocet','Yellow-footed Gull']},
  saltmarsh:{name:'Salt marsh',cat:'aquatic',sub:'Salt marsh',desc:'Pickleweed flats at the river mouths and the southern lagoon.',birds:["Ridgway's Rail",'Willet']},
  bay:{name:'Bays & tidal flats',cat:'aquatic',sub:'Estuary',desc:'Harbor Bay, the Gorge Estuary, the Caribou Delta and the southern lagoon.',birds:['Marbled Godwit','Long-billed Curlew','Brant']},
  beach:{name:'Beach & dunes',cat:'aquatic',sub:'Shoreline',desc:'Sandy beaches between the rocky headlands.',birds:['Snowy Plover','Sanderling','Elegant Tern']},
  rocky:{name:'Rocky shore & sea stacks',cat:'aquatic',sub:'Rocky shore',desc:'Wave-washed rock and stacks along the rainforest coast.',birds:['Black Oystercatcher','Black Turnstone','Surfbird']},
  cliffs:{name:'Seabird cliffs & islands',cat:'aquatic',sub:'Islands',desc:'Auklet Isle, the sea stacks and the cliffs of Oak Isle.',birds:['Tufted Puffin','Horned Puffin','Least Auklet']},
  ocean:{name:'Kelp & nearshore Pacific',cat:'aquatic',sub:'Ocean',desc:'Cold green water and kelp beds along the whole coast.',birds:["Brandt's Cormorant",'Pigeon Guillemot','Pacific Loon']},
  pelagic:{name:'Offshore Pacific',cat:'aquatic',sub:'Ocean',desc:'Deep blue ocean out to Deep Canyon and the shelf edge.',birds:['Black-footed Albatross','Pink-footed Shearwater',"Cassin's Auklet"]},
  chaparral:{name:'Chaparral & coastal sage',cat:'scrub',sub:'Chaparral',desc:'Dense, fragrant brush over the Coast Range and the southern coast.',birds:['Wrentit','California Thrasher','California Gnatcatcher']},
  scrub:{name:'Shrubland & thickets',cat:'scrub',sub:'Scrub-shrub',desc:'Willow flats, old burns and avalanche chutes.',birds:["MacGillivray's Warbler",'Lazuli Bunting','Golden-crowned Sparrow']},
  sagebrush:{name:'Sagebrush steppe',cat:'scrub',sub:'Sagebrush',desc:'Silver-grey sagebrush across the basin, with a sage-grouse lek.',birds:['Greater Sage-Grouse','Sage Thrasher','Sagebrush Sparrow']},
  mojave:{name:'Mojave desert',cat:'scrub',sub:'Desert',desc:'Creosote flats and a grove of Joshua trees.',birds:["LeConte's Thrasher","Scott's Oriole",'Black-throated Sparrow']},
  sonoran:{name:'Sonoran desert',cat:'scrub',sub:'Desert',desc:'Saguaros, cholla and ocotillo around Saguaro Springs.',birds:['Gila Woodpecker','Cactus Wren',"Gambel's Quail"]},
  arctic:{name:'Arctic tundra',cat:'open',sub:'Tundra',desc:'Open tundra and thaw pools at the top of the map, white for much of the year.',birds:['Bluethroat','Bristle-thighed Curlew','Spectacled Eider']},
  tundra:{name:'Alpine tundra & talus',cat:'open',sub:'Alpine',desc:'Rock, snow and cushion plants above the tree line.',birds:['White-tailed Ptarmigan','Black Rosy-Finch','American Pipit']},
  meadow:{name:'Mountain meadows',cat:'open',sub:'Meadow',desc:'Wildflower meadows in the high forests.',birds:['Mountain Bluebird',"Lincoln's Sparrow",'Wilson\'s Snipe']},
  grassland:{name:'Grassland',cat:'open',sub:'Grassland',desc:'Golden grass on the Wheat Hills and the valley edges.',birds:['Burrowing Owl','Grasshopper Sparrow','Ferruginous Hawk']},
  farm:{name:'Farmland',cat:'open',sub:'Agricultural',desc:'Fields and flooded rice in the Central Valley, wheat in the north, farms by the Salt Sea.',birds:["Swainson's Hawk",'Tricolored Blackbird','Mountain Plover']},
  canyon:{name:'Canyons & cliffs',cat:'open',sub:'Rock',desc:'Condor Canyon and the red walls of the gorge.',birds:['California Condor','Canyon Wren','White-throated Swift']},
  city:{name:'Towns',cat:'urban',sub:'Town',desc:'Port Madrone and the small towns along the roads.',birds:["Anna's Hummingbird",'Black Phoebe','House Finch']},
  park:{name:'Parks & yards',cat:'urban',sub:'Parks & yards',desc:'Madrone Plaza, the house gardens and the park at Saguaro Springs.',birds:["Anna's Hummingbird",'California Towhee','Bushtit']}};
for(const k in HAB_W)HAB_W[k].play=[];
const HAB_ORDER_W=['boreal','rainforest','subalpine','montane','ponderosa','pinyon','oak','pineoak','riparian','lake','pond','river','marsh','bog','saline','saltmarsh','bay','beach','rocky','cliffs','ocean','pelagic','chaparral','scrub','sagebrush','mojave','sonoran','arctic','tundra','meadow','grassland','farm','canyon','city','park'];

// the Pacific Isles' 19 habitats (Big Year Tropical Isles Plan, draft B). Birds come in a later update, so play lists start empty
const HAB_P={
  wet:{name:'Wet native forest',cat:'woodland',sub:'Rain forest',desc:'ʻŌhiʻa lehua and tree ferns in the clouds on the windward slopes: the plateau on Garden Isle, the reserve on Cloud Isle and the wet side of Fire Isle.',birds:['ʻApapane','Hawaiʻi ʻAmakihi','ʻElepaio']},
  koa:{name:'Upland koa forest',cat:'woodland',sub:'Montane forest',desc:'Tall koa and ʻōhiʻa above the farms and below the summits, with grassy openings.',birds:['ʻApapane','Hawaiʻi ʻAmakihi','Red-billed Leiothrix']},
  mamane:{name:'Māmane dry forest',cat:'woodland',sub:'Dry forest',desc:'Open, yellow-flowered māmane on the dry upper slope of Fire Isle.',birds:['Hawaiʻi ʻAmakihi','ʻElepaio','Chukar']},
  valley:{name:'Lowland valley forest',cat:'woodland',sub:'Mixed',desc:'Kukui, monkeypod and palms in the deep valleys of Garden Isle and Harbor Isle.',birds:['White-rumped Shama','Red-vented Bulbul','Spotted Dove']},
  kiawe:{name:'Kiawe dry woodland',cat:'woodland',sub:'Thorn woodland',desc:'Thorny kiawe on the hot leeward coasts.',birds:["Gambel's Quail",'Gray Francolin','Northern Mockingbird']},
  stream:{name:'Streams & taro fields',cat:'aquatic',sub:'Stream',desc:'Clear streams down the windward valleys, with wet taro patches along the banks.',birds:['Hawaiian Duck (Koloa)','Common Gallinule','Black-crowned Night-Heron']},
  marsh:{name:'Fishponds & coastal wetlands',cat:'aquatic',sub:'Wetland',desc:'Old stone-walled fishponds and marshy pools by the shore.',birds:['Black-necked Stilt','Common Gallinule','Ruddy Turnstone']},
  beach:{name:'Beach',cat:'aquatic',sub:'Shoreline',desc:'White sand under the coconut palms, with naupaka along the top of the beach.',birds:['Pacific Golden-Plover','Ruddy Turnstone','Sanderling']},
  rocky:{name:'Rocky shore & sea cliffs',cat:'aquatic',sub:'Rocky shore',desc:'Black lava benches and windward sea cliffs pounded by surf.',birds:['Red-tailed Tropicbird','Great Frigatebird','Black Noddy']},
  islets:{name:'Seabird islets & atoll',cat:'aquatic',sub:'Islands',desc:'Coral Atoll, Bird Rock and the little islets offshore, crowded with nesting seabirds.',birds:['Laysan Albatross','White Tern (Manu-o-Kū)','Wedge-tailed Shearwater']},
  reef:{name:'Coral reef & nearshore',cat:'aquatic',sub:'Reef',desc:'Turquoise water over the reef round every island, and the lagoon inside the atoll.',birds:['Brown Booby','Brown Noddy','Great Frigatebird']},
  pelagic:{name:'Offshore Pacific',cat:'aquatic',sub:'Ocean',desc:'Deep blue water between the islands and out past the reef.',birds:['Laysan Albatross',"Bulwer's Petrel",'Sooty Tern']},
  cinder:{name:'Summit cinder desert',cat:'open',sub:'Alpine',desc:'Red cinder and silverswords at the tops of Cloud Isle and Fire Isle, dusted with snow in winter.',birds:["Hawaiian Petrel (ʻUaʻu)",'Chukar']},
  lava:{name:'Lava fields & volcanic shrubland',cat:'open',sub:'Lava',desc:'Black lava flows and young ʻōhiʻa round the fiery crater and down to the south coast.',birds:['Hawaiian Goose (Nēnē)','Chukar','Short-eared Owl']},
  dryscrub:{name:'Dry leeward scrub & grass',cat:'open',sub:'Scrub',desc:'Dry grass and scrub on the leeward sides and the red canyon country.',birds:['Saffron Finch','Spotted Dove','Gray Francolin']},
  pasture:{name:'Upland pasture & ranchland',cat:'open',sub:'Grassland',desc:'Green ranchland on the saddle of Fire Isle and the slopes above the towns.',birds:['Cattle Egret','Western Meadowlark','Wild Turkey']},
  farm:{name:'Ranch hay fields',cat:'open',sub:'Agricultural',desc:'Hay and grazing fields at the ranch on Fire Isle\'s saddle.',birds:['Cattle Egret','Eurasian Skylark']},
  city:{name:'Towns',cat:'urban',sub:'Town',desc:'Harbor City and the small harbor towns.',birds:['Red-vented Bulbul','Java Sparrow','Spotted Dove']},
  park:{name:'Parks, resorts & golf',cat:'urban',sub:'Parks & yards',desc:'Banyan Court, the resort lawns and the two golf courses.',birds:['Red-crested Cardinal','Pacific Golden-Plover','Zebra Dove']}};
for(const k in HAB_P)HAB_P[k].play=[];
const HAB_ORDER_P=['wet','koa','mamane','valley','kiawe','stream','marsh','beach','rocky','islets','reef','pelagic','cinder','lava','dryscrub','pasture','farm','city','park'];

// the Caribbean Isle's 18 habitats (Big Year Tropical Isles Plan, draft B). Birds come in a later update, so play lists start empty
const HAB_K={
  rain:{name:'Rainforest',cat:'woodland',sub:'Rain forest',desc:'Tall tabonuco forest, palms and tree ferns in the Sierra Nublada, with the waterfall and the parrot aviary.',birds:['Puerto Rican Tody','Puerto Rican Woodpecker','Puerto Rican Spindalis']},
  cloud:{name:'Cloud & elfin forest',cat:'woodland',sub:'Elfin forest',desc:'Short, mossy elfin woods on the windswept tops of Sierra Nublada and Cerro Alto.',birds:['Puerto Rican Tanager','Puerto Rican Emerald','Puerto Rican Bullfinch']},
  coffee:{name:'Mountain forest & shade coffee',cat:'woodland',sub:'Montane forest',desc:'Coffee bushes under shade trees along Camino Alto and round Cafetal.',birds:['Puerto Rican Tody','Puerto Rican Spindalis','Red-tailed Hawk']},
  karst:{name:'Karst limestone forest',cat:'woodland',sub:'Karst forest',desc:'Forest over the haystack hills of the north, with the cave park.',birds:["Adelaide's Warbler",'Pearly-eyed Thrasher','Puerto Rican Spindalis']},
  dry:{name:'Dry forest',cat:'woodland',sub:'Dry forest',desc:'Low thorny forest and cactus in the south-west and on Isla Iguana and Isla Cayo.',birds:["Adelaide's Warbler",'Pearly-eyed Thrasher','Ovenbird']},
  mangrove:{name:'Mangroves',cat:'woodland',sub:'Mangrove',desc:'Mangrove edges round the lagoons, Las Salinas and the glowing bay on Isla Cayo.',birds:['Puerto Rican Woodpecker','Great Egret','Palm Warbler']},
  marsh:{name:'Freshwater lagoons & marsh',cat:'aquatic',sub:'Lagoon',desc:'Laguna Verde, Laguna Este and the north lagoon by Bahía Vieja.',birds:['Pied-billed Grebe','Ruddy Duck','Blue-winged Teal']},
  lake:{name:'Reservoirs & rivers',cat:'aquatic',sub:'Reservoir',desc:'Lago Cerro and Lago Alto in the mountains, and the rivers down to the sea.',birds:['Belted Kingfisher','Green Heron','Common Gallinule']},
  saline:{name:'Salt flats & salt ponds',cat:'aquatic',sub:'Salt flat',desc:'White salt crust and pink-tinged ponds at Las Salinas and on the south coast.',birds:['Semipalmated Plover','Black-bellied Plover','Killdeer']},
  beach:{name:'Beach',cat:'aquatic',sub:'Shoreline',desc:'Sandy beaches under palms and sea grape.',birds:['Royal Tern','Sanderling','Brown Pelican']},
  rocky:{name:'Rocky shore & sea cliffs',cat:'aquatic',sub:'Rocky shore',desc:'Cliffs on the Atlantic side, round Isla Iguana and under the old fort.',birds:['White-tailed Tropicbird','Red-billed Tropicbird','Peregrine Falcon']},
  islets:{name:'Seabird cays',cat:'aquatic',sub:'Islands',desc:'The Cayos de Aves and the little bird islets off Isla Iguana and Isla Cayo.',birds:['Brown Booby','Sooty Tern','Brown Noddy']},
  reef:{name:'Coral reef & nearshore',cat:'aquatic',sub:'Reef',desc:'A wide reef on the calm Caribbean side, a narrow one on the Atlantic side.',birds:['Brown Pelican','Magnificent Frigatebird','Sandwich Tern']},
  pelagic:{name:'Offshore Caribbean & Atlantic',cat:'aquatic',sub:'Ocean',desc:'The Atlantic to the north and the Caribbean Sea to the south.',birds:["Audubon's Shearwater",'Masked Booby','Bridled Tern']},
  scrub:{name:'Coastal scrub & grassy edges',cat:'scrub',sub:'Scrub',desc:'Dry scrub and grass along the coast roads and round the towns.',birds:['Black-faced Grassquit','Yellow-faced Grassquit','Northern Mockingbird']},
  cane:{name:'Cane fields & pasture',cat:'open',sub:'Agricultural',desc:'Sugar cane and pasture on the south plain and in the west valley.',birds:['Cattle Egret','Bronze Mannikin','Red-tailed Hawk']},
  city:{name:'Towns',cat:'urban',sub:'Town',desc:'Bahía Vieja and the small towns of Cafetal, Puerto Oeste, Playa Sur and Este.',birds:['Scaly-naped Pigeon','Saffron Finch','White-winged Dove']},
  park:{name:'Parks & gardens',cat:'urban',sub:'Parks & yards',desc:'The Plaza de Armas, the botanical garden and the gardens round the houses on Camino Alto.',birds:['Zenaida Dove','Puerto Rican Woodpecker','Bronze Mannikin']}};
for(const k in HAB_K)HAB_K[k].play=[];
const HAB_ORDER_K=['rain','cloud','coffee','karst','dry','mangrove','marsh','lake','saline','beach','rocky','islets','reef','pelagic','scrub','cane','city','park'];

// the British Isle's 25 habitats (Big Year British Isle Plan, draft A). Birds come in a later update, so play lists start empty
const HAB_B={
  oakwood:{name:'Oak & ash woodland',cat:'woodland',sub:'Broadleaf wood',desc:'Old oak woods with ash and hawthorn, bluebells in spring: the Greenwood, the Forest and the Welsh valleys.',birds:['Pied Flycatcher','Great Spotted Woodpecker','Eurasian Nuthatch']},
  beechwood:{name:'Beech woods & hangers',cat:'woodland',sub:'Beech wood',desc:'Tall beeches on the chalk scarp above the Downs.',birds:['Marsh Tit','Hawfinch','Common Chaffinch']},
  pinewood:{name:'Caledonian pinewood',cat:'woodland',sub:'Pinewood',desc:'Old Scots pines with heather and blaeberry beneath, in Strath Ard and Glen Mhòr.',birds:['Western Capercaillie','Crested Tit','Scottish Crossbill']},
  glen:{name:'Birch & hazel glens',cat:'woodland',sub:'Upland wood',desc:'Birch, rowan and willow along the Highland glens and the Lakes.',birds:['Common Redstart','Wood Warbler','Tree Pipit']},
  conifer:{name:'Conifer plantations',cat:'woodland',sub:'Plantation',desc:'Dark rows of spruce in the Border forest and the Welsh hills.',birds:['Goldcrest','Common Crossbill','Eurasian Siskin']},
  farm:{name:'Farmland & hedgerows',cat:'open',sub:'Agricultural',desc:'A patchwork of wheat, barley, rape and hay fields edged with hedgerows (stone walls in the north).',birds:['Yellowhammer','Eurasian Skylark','Grey Partridge']},
  pasture:{name:'Pasture & meadows',cat:'open',sub:'Grazing',desc:'Sheep and cattle pasture between the fields, with old field oaks.',birds:['Northern Lapwing','Rook','Pied Wagtail']},
  downs:{name:'Chalk downs',cat:'open',sub:'Grassland',desc:'Short flowery turf on the chalk, with the Old Stones and the chalk horse.',birds:['Corn Bunting','Eurasian Skylark','Meadow Pipit']},
  heath:{name:'Lowland heath & gorse',cat:'scrub',sub:'Heath',desc:'Heather and gorse in the Forest and the Brecks, with ponies.',birds:['Dartford Warbler','Woodlark','European Nightjar']},
  moor:{name:'Heather moorland',cat:'open',sub:'Moor',desc:'Heather hills of the Pennines, the Highlands, Wales and High Tor; purple in late summer.',birds:['Red Grouse','European Golden Plover','Eurasian Curlew']},
  tundra:{name:'Mountain tops & plateaus',cat:'open',sub:'Montane',desc:'Stony tops of the Cairns, Ben Ardan, Ben Fionn, Y Moel and the fells; snow in winter.',birds:['Rock Ptarmigan','Eurasian Dotterel','Snow Bunting']},
  bog:{name:'Blanket bog & flows',cat:'aquatic',sub:'Peatland',desc:'Wet peat with pools and bog cotton in the Flows and on the Hebrides.',birds:['Common Greenshank','Red-throated Loon','Dunlin']},
  machair:{name:'Machair & crofts',cat:'open',sub:'Machair',desc:'Flower-filled grassland behind the Hebridean beaches.',birds:['Corn Crake','Twite','Northern Wheatear']},
  marsh:{name:'Fens, reedbeds & broads',cat:'aquatic',sub:'Reedbed',desc:'Reeds and open water in the Fens and the Broads, with the Fen reserve.',birds:['Eurasian Bittern','Western Marsh Harrier','Bearded Reedling']},
  lake:{name:'Lochs & lakes',cat:'aquatic',sub:'Lake',desc:'Loch Mhòr, Loch Ard, Grassmere Water, Llyn Wen and Greenwood Lake.',birds:['Black-throated Loon','Great Crested Grebe','Common Goldeneye']},
  river:{name:'Rivers',cat:'aquatic',sub:'River',desc:'The Wend, the Ure, the Ard, the Spey and the Welsh rivers.',birds:['White-throated Dipper','Common Kingfisher','Grey Wagtail']},
  bay:{name:'Estuaries & mudflats',cat:'aquatic',sub:'Estuary',desc:'Mudflats and sands of the Wend, the Ure, the Severn, Ard Sands and the Firth of Ard.',birds:['Eurasian Oystercatcher','Common Redshank','Pink-footed Goose']},
  saltmarsh:{name:'Saltmarsh',cat:'aquatic',sub:'Saltmarsh',desc:'Saltmarsh round the edges of the estuaries.',birds:['Common Redshank','Little Egret','Eurasian Curlew']},
  beach:{name:'Dunes, sand & shingle',cat:'aquatic',sub:'Shoreline',desc:'Sandy bays, dunes and shingle round the coast.',birds:['Ringed Plover','Sanderling','Little Tern']},
  cliffs:{name:'Sea cliffs & stacks',cat:'aquatic',sub:'Cliffs',desc:'White chalk cliffs in the south-east, granite and sandstone cliffs everywhere else.',birds:['Atlantic Puffin','Black-legged Kittiwake','Red-billed Chough']},
  islets:{name:'Seabird islands',cat:'aquatic',sub:'Islands',desc:'Gannet Rock in the Firth and Puffin Isle off Wales.',birds:['Northern Gannet','Atlantic Puffin','Razorbill']},
  ocean:{name:'Inshore waters & sea lochs',cat:'aquatic',sub:'Inshore',desc:'Firths, sea lochs and the water near the shore.',birds:['Common Eider','Black Guillemot','Northern Gannet']},
  pelagic:{name:'North Sea & Atlantic',cat:'aquatic',sub:'Ocean',desc:'The North Sea, the Atlantic and the Channel.',birds:['Manx Shearwater','Northern Fulmar','Great Skua']},
  city:{name:'Cities & villages',cat:'urban',sub:'Town',desc:'Kingsport, Castlegate and the villages.',birds:['House Sparrow','Common Swift','Eurasian Blackbird']},
  park:{name:'Parks, greens & gardens',cat:'urban',sub:'Parks & gardens',desc:'Kingsgate Gardens, Castlegate’s valley gardens and the village greens.',birds:['European Robin','Eurasian Blue Tit','Common Wood Pigeon']}};
for(const k in HAB_B)HAB_B[k].play=[];
const HAB_ORDER_B=['oakwood','beechwood','pinewood','glen','conifer','farm','pasture','downs','heath','moor','tundra','bog','machair','marsh','lake','river','bay','saltmarsh','beach','cliffs','islets','ocean','pelagic','city','park'];
if(CENTRAL){for(const k in HABITATS)delete HABITATS[k];Object.assign(HABITATS,BRI?HAB_B:CAR?HAB_K:PAC?HAB_P:WEST?HAB_W:HAB_C);HAB_ORDER.length=0;HAB_ORDER.push(...(BRI?HAB_ORDER_B:CAR?HAB_ORDER_K:PAC?HAB_ORDER_P:WEST?HAB_ORDER_W:HAB_ORDER_C))}


/* ---------- named water: lakes, ponds, marshes, creeks ---------- */
const WATERS=WD.waters,RIVERS=WD.rivers;
const LAKES=WATERS;
function nearestWater(x,y,hab){let best=null,bd=1e9;for(const w of WATERS){if(w.hab!==hab)continue;const d=Math.hypot(x-w.x,y-w.y);if(d<bd){bd=d;best=w}}return bd<(hab==='marsh'?2600:1900)?best:null}
function nearestRiver(x,y){let best=null,bd=1e9;for(const r of RIVERS)for(let i=0;i<r.pts.length-1;i++){const d=segDist(x,y,r.pts[i],r.pts[i+1]);if(d<bd){bd=d;best=r}}return best}
// a point on the bank of a named creek, part way along
function riverPoint(name,f,side=1){const r=RIVERS.find(q=>q.name===name)||RIVERS[0],p=r.pts,i=Math.min(p.length-2,Math.floor(f*(p.length-1))),a=p[i],b=p[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;
  let x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;for(let k=0;k<30;k++){x-=dy/l*side*12;y+=dx/l*side*12;if(terr(x,y)!==T.LAKE)break}return{x:x-dy/l*side*20,y:y+dx/l*side*20}}

/* ---------- Port Bostick: a grid of streets either side of the coast highway ---------- */
const CITY={name:'Port Bostick',x0:WD.city[0],x1:WD.city[2],y0:WD.city[1],y1:WD.city[3]};
const AVES=(BRI?[0,520,1040,1560,2080,2600]:PAC?[0,440,880,1520,1960,2400]:CAR?[0,480,960,1440,1920,2400]:CENTRAL?[0,600,1200,1800,2400,3000]:[0,425,850,1750,2333,2917,3500]).map(v=>CITY.x0+v),STS=(CENTRAL?[0,1,2,3].map(j=>j/3):[0,1,2,3,4,5,6].map(j=>j/6)).map(f=>Math.round(CITY.y0+(CITY.y1-CITY.y0)*f));
const ST_HALF=TSTYLE==='colonial'?54:78,WALK=TSTYLE==='colonial'?18:26,OCEAN_DR=CITY.x1,PIER_Y=STS[2],FERRY_Y=16450;
const PARK={x0:AVES[2]+ST_HALF+WALK,x1:AVES[3]-ST_HALF-WALK,y0:STS[1]+ST_HALF+WALK,y1:STS[CENTRAL?2:4]-ST_HALF-WALK};
const ELM_X=WD.elm;
function inCity(x,y,pad=0){return x>CITY.x0-ST_HALF-WALK-pad&&x<OCEAN_DR+ST_HALF+WALK+pad&&y>CITY.y0-ST_HALF-WALK-pad&&y<CITY.y1+ST_HALF+WALK+pad}
function inPark(x,y){return x>PARK.x0&&x<PARK.x1&&y>PARK.y0&&y<PARK.y1}
const ST_GAP=CENTRAL?[]:[STS[2],STS[3]],ST_OPEN=STS.filter(sy=>!ST_GAP.includes(sy));
function stGap(sy,x){return ST_GAP.includes(sy)&&x>AVES[2]+ST_HALF&&x<AVES[3]-ST_HALF}
/* CT2 Ellis Park, a Central Park for Port Bostick: the Meadow (north), the Ramble woods (middle), the Pond (south), crossed by two transverse roads */
const PSEC=[[PARK.y0,STS[2]+40],[STS[2]+40,STS[3]+40],[STS[3]+40,PARK.y1]];
const POND={x:PARK.x0+(PARK.x1-PARK.x0)*.45,y:(STS[3]+ST_HALF+WALK+PARK.y1)/2,rx:210,ry:95};
function parkSec(y){for(let i=0;i<3;i++)if(y>=PSEC[i][0]&&y<=PSEC[i][1])return i;return -1}
/* CT1 Cottonwood's courthouse square */
function cenSqPath(x,y,pad=0){if(!inPark(x,y))return false;const P=PARK,edge=Math.min(x-P.x0,P.x1-x,y-P.y0,P.y1-y);if(edge>14-pad&&edge<36+pad)return true;
  const cx=(P.x0+P.x1)/2,cy=(P.y0+P.y1)/2;if(Math.abs(x-cx)<13+pad||Math.abs(y-cy)<13+pad)return true;
  const w=P.x1-P.x0,h=P.y1-P.y0,u=(x-P.x0)/w,v=(y-P.y0)/h;return Math.abs(u-v)*Math.min(w,h)<9+pad||Math.abs(u+v-1)*Math.min(w,h)<9+pad}
// TW1/TP1/TC1: each town square's own ground
function plazaColor(x,y,n){const P=PARK,cx=(P.x0+P.x1)/2,cy=(P.y0+P.y1)/2,edge=Math.min(x-P.x0,P.x1-x,y-P.y0,P.y1-y);
  if(TSTYLE==='british'){if(edge<5)return[40,40,40];const rr=Math.hypot((x-cx)/(P.x1-P.x0)*2,(y-cy-10)/(P.y1-P.y0)*2);if(Math.abs(rr-.62)<.05||Math.abs(x-cx)<14||Math.abs(y-cy)<14&&rr>.2||rr<.18)return[212,198,168].map(v=>v*(.96+n*.06));
    const st=(Math.floor((x-y)/40)&1)?1:.96;return GC.park.map(v=>v*st*(.98+n*.08))}
  if(TSTYLE==='colonial'){// big stone slabs laid on the diagonal, a darker border
    if(edge<10)return[120,112,102].map(v=>v*(.95+n*.08));const u=(x+y)/56,v=(x-y)/56,t=((Math.floor(u)+Math.floor(v))&1)?1:.92,g=(u%1<.05||v%1<.05)?.86:1;
    const d=Math.hypot(x-cx,y-cy-10);if(d<70&&d>58)return[176,92,70];return[214,206,190].map(c=>c*t*g*(.97+n*.05))}
  if(TSTYLE==='mission'){// tan decomposed granite, terracotta tile walks, four small lawns
    if(edge<8)return[150,120,96];const tile=(Math.floor(x/14)+Math.floor(y/14))&1?.94:1.02;
    if(edge<30||Math.abs(x-cx)<18||Math.abs(y-(cy+40))<18)return[184,104,74].map(v=>v*tile*(.97+n*.04));
    const lawn=Math.abs(x-cx)>40&&Math.abs(x-cx)<(P.x1-P.x0)/2-60&&Math.abs(y-(cy+40))>40&&y>P.y0+190&&y<P.y1-50;if(lawn)return GC.park.map(v=>v*(1.02+n*.08));
    return mix([218,196,154],[200,176,134],fbm(x/30,y/30)).map(v=>v*(.97+n*.06))}
  // plantation: Banyan Court lawn, worn bare and shady under the banyan, a brick walk round the edge
  if(edge<6)return[140,96,74];if(edge<26){const b=(Math.floor(x/12)+Math.floor(y/8))&1?.92:1;return[168,92,68].map(v=>v*b)}
  const d=Math.hypot((x-cx)/(P.x1-P.x0)*2,(y-cy-30)/(P.y1-P.y0)*2);let c=GC.park.map(v=>v*(.94+n*.12));
  if(d<.85)c=mix(c,[120,100,70],clamp(fbm(x/40,y/40)*1.4-.4,0,.6)*(1-d));return c}
function parkPath(x,y,pad=0){if(CENTRAL)return cenSqPath(x,y,pad);if(!inPark(x,y))return false;const edge=Math.min(x-PARK.x0,PARK.x1-x,y-PARK.y0,PARK.y1-y);if(edge>16-pad&&edge<40+pad)return true;
  const s=parkSec(y);if(s<0)return false;const a=PSEC[s][0],b=PSEC[s][1],h=b-a,w=PARK.x1-PARK.x0,u=(x-PARK.x0)/w,v=(y-a)/h,cx=(PARK.x0+PARK.x1)/2,cy=(a+b)/2;
  if(s<2&&Math.abs(x-(PARK.x0+w*.3+w*.05*Math.sin((y-PARK.y0)/170)))<9+pad)return true;
  if(s===0){const e=Math.hypot((x-cx)/(w*.36),(y-cy)/(h*.32));return Math.abs(e-1)*Math.min(w*.36,h*.32)<10+pad||(Math.abs(x-cx)<9+pad&&e>1)}
  if(s===1){const t1=cy+h*.24*Math.sin(u*TAU*1.3+.6),t2=cx+w*.22*Math.sin(v*TAU*.9+1.4),t3=PARK.x0+w*.78+w*.06*Math.sin(v*TAU*1.6);return Math.abs(y-t1)<9+pad||Math.abs(x-t2)<9+pad||Math.abs(x-t3)<7.5+pad}
  const e=Math.hypot((x-POND.x)/(POND.rx*1.28),(y-POND.y)/(POND.ry*1.42));return Math.abs(e-1)*POND.ry*1.42<10+pad||(Math.abs(y-POND.y)<9+pad&&x>POND.x+POND.rx*1.25)}
function parkLawn(x,y){if(CENTRAL)return inPark(x,y)&&!cenSqPath(x,y);if(parkSec(y)!==0)return false;const a=PSEC[0][0],b=PSEC[0][1],w=PARK.x1-PARK.x0,h=b-a;return Math.hypot((x-(PARK.x0+PARK.x1)/2)/(w*.36),(y-(a+b)/2)/(h*.32))<1}
const PV={wall:{dens:.3,trees:[['decid',1,12,17]],decor:[]},lawn:{dens:0,decor:[['flowers',.012]]},grove:{dens:.34,trees:[['decid',3,11,17],['birch',.6,8,11]],decor:[['shrub',.12]]},
  ramble:{dens:.6,trees:[['decid',4,10,17],['cedar',1,6,10],['birch',.8,8,12]],decor:[['shrub',.42],['fern',.1],['flowers',.03]],multi:2},
  lake:{dens:.22,trees:[['decid',2,10,16],['birch',.7,8,11]],decor:[['shrub',.2],['flowers',.03]]},sq:{dens:.04,trees:[['decid',1,13,18]],decor:[['flowers',.02]]}};
function parkVeg(x,y){if(CENTRAL&&TSTYLE!=='prairie')return null;if(CENTRAL){if(cenSqPath(x,y,9))return null;const P=PARK,edge=Math.min(x-P.x0,P.x1-x,y-P.y0,P.y1-y);if(edge<12)return PV.wall;
    if(Math.abs(x-(P.x0+P.x1)/2)<150&&Math.abs(y-(P.y0+P.y1)/2)<115)return null;return PV.sq}
  if(parkPath(x,y,9))return null;const edge=Math.min(x-PARK.x0,PARK.x1-x,y-PARK.y0,PARK.y1-y);if(edge<12)return PV.wall;const s=parkSec(y);
  if(s===0)return parkLawn(x,y)?PV.lawn:PV.grove;if(s===1)return PV.ramble;if(s===2)return PV.lake;return null}
// city streets as straight strips
function cityStreet(x,y,pad=0){if(!inCity(x,y,pad))return null;
  for(const sy of STS){const d=Math.abs(y-sy);if(d<ST_HALF+pad&&x>CITY.x0-ST_HALF&&x<OCEAN_DR+ST_HALF&&!stGap(sy,x))return{kind:'paved',d,city:true,axis:'x',c:sy}}
  for(const ax of AVES){const d=Math.abs(x-ax);if(d<ST_HALF+pad&&y>CITY.y0-ST_HALF&&y<CITY.y1+ST_HALF)return{kind:'paved',d,city:true,axis:'y',c:ax}}
  return null}

/* ---------- farmland: three small family farms, crop fields split by hedgerows ---------- */
const CROPS=['corn','wheat','soy','plowed','corn','soy','wheat'];
const FIELDS=[];{let k=0;for(const f of WD.fields){FIELDS.push({x0:f.x0,x1:f.x1,y0:f.y0,y1:f.y1,farm:f.farm,crop:f.kind==='crop'?(BRI?BR_CROPS:CROPS)[(k*5+2)%(BRI?BR_CROPS:CROPS).length]:f.kind==='hay'?'hay':'pasture',dir:(f.x1-f.x0)>(f.y1-f.y0)?0:1,id:k});k++}}
const FARMS=Object.entries(WD.yards).map(([name0,y])=>{const name=name0.split('#')[0];const fs=FIELDS.filter(f=>f.farm===name0);return{name,x0:Math.min(y[0],...fs.map(f=>f.x0)),x1:Math.max(y[2],...fs.map(f=>f.x1)),y0:Math.min(y[1],...fs.map(f=>f.y0)),y1:Math.max(y[3],...fs.map(f=>f.y1)),yard:{x0:y[0],y0:y[1],x1:y[2],y1:y[3]}}});
const FARM=FARMS[0];
const FGRID=new Map(),FARMGRID=new Map();if(FIELDS.length>40){for(const f of FIELDS)for(let cy=Math.floor(f.y0/1000);cy<=Math.floor(f.y1/1000);cy++)for(let cx=Math.floor(f.x0/1000);cx<=Math.floor(f.x1/1000);cx++){const q=cx*1000+cy;if(!FGRID.has(q))FGRID.set(q,[]);FGRID.get(q).push(f)}
  for(const F of FARMS)for(let cy=Math.floor((F.y0-60)/1000);cy<=Math.floor((F.y1+60)/1000);cy++)for(let cx=Math.floor((F.x0-60)/1000);cx<=Math.floor((F.x1+60)/1000);cx++){const q=cx*1000+cy;if(!FARMGRID.has(q))FARMGRID.set(q,[]);FARMGRID.get(q).push(F)}}
function fieldAt(x,y){if(FGRID.size){const a=FGRID.get(Math.floor(x/1000)*1000+Math.floor(y/1000));if(a)for(const f of a)if(x>f.x0&&x<f.x1&&y>f.y0&&y<f.y1)return f;return null}for(const f of FIELDS)if(x>f.x0&&x<f.x1&&y>f.y0&&y<f.y1)return f;return null}
function farmAt(x,y){if(FARMGRID.size){const a=FARMGRID.get(Math.floor(x/1000)*1000+Math.floor(y/1000));if(a)for(const F of a)if(x>F.x0-60&&x<F.x1+60&&y>F.y0-60&&y<F.y1+60)return F;return null}for(const F of FARMS)if(x>F.x0-60&&x<F.x1+60&&y>F.y0-60&&y<F.y1+60)return F;return null}
function farmTerr(x,y){const F=farmAt(x,y);if(!F)return -1;const Y=F.yard;if(x>Y.x0&&x<Y.x1&&y>Y.y0&&y<Y.y1)return T.YARD;return fieldAt(x,y)?T.FIELD:T.HEDGE}
function inLot(x,y){return false}

/* ---------- piers, docks and boat launches ---------- */
const PIERS=[];// walkable decks over water
if(!CENTRAL){const cx=coastX(PIER_Y);PIERS.push({x0:OCEAN_DR+ST_HALF,x1:cx+600,y0:PIER_Y-24,y1:PIER_Y+24,kind:'pier',name:'Bostick Pier'});PIERS.push({x0:cx+590,x1:cx+700,y0:PIER_Y-56,y1:PIER_Y+56,kind:'pier',name:'Bostick Pier'});
  }{for(const [a,b] of WD.piers){const y=a[1];PIERS.push({x0:Math.min(a[0],b[0]),x1:Math.max(a[0],b[0]),y0:y-22,y1:y+22,kind:'pier',name:y<12000?'Lighthouse harbor pier':'Island ferry dock'})}
  // the marina: a walkway along the harbour with finger docks
  if(!CENTRAL){const y=18175,x0=OCEAN_DR+ST_HALF+WALK,x1=coastX(y)-40;PIERS.push({x0,x1,y0:y-20,y1:y+20,kind:'pier',name:'Port Bostick marina'});
    for(let x=x0+140;x<x1-40;x+=150)PIERS.push({x0:x-12,x1:x+12,y0:y-150,y1:y+150,kind:'dock',name:'Port Bostick marina'})}}
let JETTY=null;if(!CENTRAL){const y=18760,x0=coastX(y)-200;JETTY={x0,x1:x0+900,y0:y-26,y1:y+26,kind:'jetty',name:'Bostick jetty'};PIERS.push(JETTY)}
// launch spots for the tour boat (T), kayak (K) and canoe (C): a short dock out into the water from the shore
const LAUNCHES=[];
for(const [craft,name,x,y,face] of WD.docks){let best=null;
  for(const a of(face!=null?[[0,PI/2,PI,-PI/2][face]]:[0,PI/2,PI,-PI/2]))for(let d=20;d<=420;d+=20){const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(isWater(terr(px,py))||boatWater(craft,px,py)){if(!best||d<best.d)best={a,d};break}}
  const L={craft,name,x,y};LAUNCHES.push(L);if(!best||name==='Port Bostick marina')continue;
  const a=best.a,sx=x,sy=y;let len=best.d+100;for(let k=0;k<8&&!boatWater(craft,sx+Math.cos(a)*(len+30),sy+Math.sin(a)*(len+30));k++)len+=40;
  const ex=sx+Math.cos(a)*len,ey=sy+Math.sin(a)*len;
  PIERS.push(Math.abs(Math.cos(a))>.5?{x0:Math.min(sx,ex),x1:Math.max(sx,ex),y0:sy-14,y1:sy+14,kind:'dock',name}:{x0:sx-14,x1:sx+14,y0:Math.min(sy,ey),y1:Math.max(sy,ey),kind:'dock',name});
  L.x=ex;L.y=ey}
function onPier(x,y){for(const p of PIERS)if(x>p.x0&&x<p.x1&&y>p.y0&&y<p.y1)return p;return null}

/* which habitat a point belongs to (for the status pill, the log and bird placement) */
function habitatAt(x,y){const k=WKEYS[wsample(x,y)];
  if(PAC){if(k==='golf'||k==='pool')return'park';if(k==='river')return'stream'}
  if(CAR){if(k==='river')return'lake';if(k==='farm')return'cane'}
  if(k==='snow'||k==='pools')return'arctic';
  if(k==='city'||k==='park'){if(inCity(x,y))return inPark(x,y)?'park':'city';return CENTRAL&&k==='city'?'city':'park'}
  return k}
function placeName(x,y){const pr=onPier(x,y);if(pr)return pr.name||'Dock';const h=habitatAt(x,y);if(CENTRAL&&inPark(x,y))return BRI?(y<20000?'Castlegate gardens':'Kingsgate Gardens'):CAR?'Plaza de Armas':PAC?'Banyan Court':WEST?'Madrone Plaza':'Courthouse Square';
  if(CENTRAL&&(h==='city'||h==='park')&&!inCity(x,y)){let best=null,bd=1500;for(const F of FEATURES)if(F.hab==='city'||F.hab==='park'){const d=Math.hypot(F.x-x,F.y-y);if(d<bd){bd=d;best=F}}if(best)return best.name}
  if(h==='lake'||h==='pond'||h==='marsh'){const w=nearestWater(x,y,h);if(w)return w.name}
  if(h==='river'){const r=nearestRiver(x,y);if(r)return r.name}
  if(h==='farm'){const F=farmAt(x,y);if(F)return F.name}
  if(h==='saline'||h==='bog'){const w=nearestWater(x,y,h);if(w)return w.name}
  return HABITATS[h].name}

// named places for the full map
const FEAT_E=[
  {name:'Arctic tundra',x:4500,y:1400,hab:'arctic'},{name:'Loon Lake',x:5950,y:8950,hab:'lake'},{name:'Spruce bog',x:3900,y:8150,hab:'bog'},{name:'Barrens',x:9000,y:7150,hab:'grassland'},
  {name:'Rocky shore',x:12300,y:8200,hab:'rocky'},{name:'Alpine tundra',x:1300,y:6300,hab:'tundra'},{name:'Puffin Rock',x:15400,y:5600,hab:'rocky'},
  {name:'Gribley Farm',x:8200,y:13950,hab:'farm'},{name:'Powerline cut',x:4900,y:13300,hab:'scrub'},{name:'Grassland',x:4200,y:16900,hab:'grassland'},{name:'Port Bostick',x:10084,y:16450,hab:'city'},
  {name:'Mill Farm',x:7300,y:22300,hab:'farm'},{name:'Mill Pond',x:5150,y:21350,hab:'pond'},{name:'Laurel Lake',x:2300,y:24150,hab:'lake'},{name:'Laurel Farm',x:3800,y:25350,hab:'farm'},
  {name:'Heron Marsh',x:7000,y:24750,hab:'marsh'},{name:'Cypress swamp',x:6300,y:27700,hab:'swamp'},{name:'Salt marsh',x:10600,y:26800,hab:'saltmarsh'},{name:'Back bay',x:10900,y:30200,hab:'bay'},
  {name:'Sandhill scrub',x:5000,y:31100,hab:'sandhill'},{name:'Mangrove keys',x:14500,y:33000,hab:'mangrove'},{name:'Offshore',x:16200,y:12000,hab:'pelagic'}];
const FEATURES=CENTRAL?WD.features.map(([name,x,y,hab])=>({name,x,y,hab})):FEAT_E;

// colours for the habitat ground
Object.assign(GC,{lake:hex('#3d7c8c'),lakeN:hex('#35687a'),lakeShal:hex('#62a19b'),marsh:hex('#76884a'),marsh2:hex('#97994f'),salt:hex('#9fae5c'),salt2:hex('#c1b96f'),mudS:hex('#7b6f53'),
  swamp:hex('#3d5638'),swampW:hex('#435b4c'),duck:hex('#7f9a3f'),grass:hex('#a7ae5f'),grass2:hex('#c3b86b'),scrub:hex('#6f8547'),scrub2:hex('#8c9a55'),sandhill:hex('#e0d1a0'),wire:hex('#b4ad6c'),
  city:hex('#c4c0b6'),asphalt:hex('#5a5b5e'),pool:hex('#5fc3d6'),walk:hex('#d9d5cb'),park:hex('#7cab52'),path:hex('#d3c4a0'),yard:hex('#b3a587'),hedge:hex('#56733c'),
  corn:hex('#5b8a34'),corn2:hex('#4c7a2c'),soil:hex('#7d5e3d'),wheat:hex('#d9bf68'),wheat2:hex('#c6a955'),soy:hex('#7fb046'),hay:hex('#a9b65c'),hay2:hex('#c9c27a'),plow:hex('#6a4b31'),pasture:hex('#8db352')});


/* DC4: dry-country ground. Height fields lit from the upper left, like the trees, so hills and gullies read as relief */
const LIME=hex('#d7d2c1');
// warm shading for bare clay and rock: shadows go red-brown, sunlit sides go cream
const WARM_SH=hex('#7a4a3a'),WARM_LT=hex('#f4e6cb');
function warmShade(c,sh){return sh<1?mix(c,WARM_SH,(1-sh)*1.35):mix(c,WARM_LT,(sh-1)*1.1)}
function hillshade(fn,x,y,k){const e=8,h=fn(x,y);return clamp(1+(-(fn(x+e,y)-h)-(fn(x,y+e)-h))*k,.7,1.24)}
const badH=(x,y)=>clamp((fbm(x/620+11,y/620+3)*.78+fbm(x/210+5,y/210+9)*.22-.3)/.4,0,1);
// badlands: grassy tables on top, slopes in stacked colour bands (the strata), pale clay floors in the gullies
const BAD_STRATA=['#cf9f7d','#e2cfad','#c3876a','#dac09b','#c4b8a6','#e6d7bb','#c98f70','#dcc6a2'].map(hex),BAD_TOP=hex('#b4ab5e'),BAD_FLOOR=hex('#c9b08a'),BAD_CAP=hex('#8f5f45');
function badlandsColor(x,y,n){const h=badH(x,y),slope=h>.2&&h<.7;let sh=1;let c;
  if(h>.7)c=mix(BAD_TOP,hex('#c4ba78'),fbm(x/60,y/60)*.6);
  else if(h>.675)c=mix(BAD_CAP,BAD_TOP,sstep(.675,.7,h)*.6);
  else if(h<.2)c=mix(BAD_FLOOR,hex('#bea27d'),fbm(x/40+2,y/40)*.7);
  else{const b=(h-.2)/.07+fbm(x/90,y/90)*.35,i=Math.floor(b),f=b-i;c=mix(BAD_STRATA[i%8],BAD_STRATA[(i+1)%8],sstep(.55,1,f))}
  return warmShade(c,sh).map(v=>v*(.97+n*.05))}
// mesas: red-tan soil and grass, flat tops edged with a dark rimrock ledge
const MESA_SOIL=hex('#bf9d74'),MESA_GRASS=hex('#a9a26a'),MESA_TOP=hex('#b8ad78'),MESA_RIM=hex('#8c553a');
const mesaH=(x,y)=>clamp((fbm(x/900+2,y/900+8)-.3)/.4,0,1);
function mesaColor(x,y,t,n){const h=mesaH(x,y),sh=1;
  if(t===T.ROCK)return warmShade(mix(hex('#c99a6c'),hex('#a8714e'),fbm(x/90,y/90)),sh);
  let c=mix(MESA_SOIL,MESA_GRASS,clamp(fbm(x/120+4,y/120+1)*1.4-.35,0,1));
  if(h>.58)c=mix(c,MESA_TOP,.55);
  if(h>.545&&h<.585)c=mix(c,MESA_RIM,.8*(1-Math.abs(h-.565)/.02));
  if(h>.835)c=mix(c,MESA_TOP,.35);if(h>.795&&h<.835)c=mix(c,MESA_RIM,.75*(1-Math.abs(h-.815)/.02));
  return warmShade(c,sh).map(v=>v*(.96+n*.06))}
// Chihuahuan desert: tan gravel, dark varnished pavement, pale sandy washes with low banks
const DES_A=hex('#d9c19a'),DES_B=hex('#cdb08a'),DES_PAVE=hex('#b5926b'),DES_WASH=hex('#ebdcb6'),DES_BANK=hex('#bfa078');
const desH=(x,y)=>fbm(x/1300+6,y/1300+2);
function desertColor(x,y,n){let c=mix(DES_A,DES_B,fbm(x/180+1,y/180+7));
  const pv=fbm(x/320+9,y/320+3);if(pv>.6)c=mix(c,DES_PAVE,clamp((pv-.6)*4,0,.6));
  const w=Math.abs(fbm(x/850+3,y/850+1)-.5);if(w<.016)c=mix(c,DES_WASH,clamp((.016-w)/.006,0,1));else if(w<.022)c=mix(c,DES_BANK,.45*(1-(w-.016)/.006));
  if(vnoise(x/7,y/7)>.82)c=c.map(v=>v*.93);
  return c.map(v=>v*hillshade(desH,x,y,16)*(.97+n*.05))}
const skyH=(x,y)=>mtnK(x,y)*.7+fbm(x/320+1,y/320+5)*.3;
/* RL1: real relief. Heights in metres for the rough country (Pine Ridge and Sky Peak, the mesas, the badlands, the hills),
   blended by habitat. The ground is lit from the upper left like the trees, ridges cast soft shadows down-sun,
   and steep slopes shed their soil to show bare rock. */
const RLF=CENTRAL?(()=>{const S=4,W=Math.ceil(WGW/S),H=Math.ceil(WGH/S),N=W*H,cls=CAR?{rain:0,cloud:0,coffee:0,karst:0,dry:3,scrub:3,cane:3}:PAC?{wet:0,koa:0,mamane:0,valley:0,stream:0,cinder:0,lava:0,kiawe:3,dryscrub:3,pasture:3}:WEST?{tundra:0,subalpine:0,montane:0,pineoak:0,meadow:0,ponderosa:0,pinyon:1,canyon:2,oak:3,chaparral:3,mojave:3,sonoran:3}:{skyisland:0,ponderosa:0,pinyon:1,badlands:2,juniperoak:3,desert:3,thorn:3};
  const M=[0,1,2,3].map(()=>new Float32Array(N)),wet=new Float32Array(N),any=new Float32Array(N);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const c=WGRID[Math.min(WGH-1,j*S)*WGW+Math.min(WGW-1,i*S)],q=cls[WKEYS[c]];if(q!==undefined){M[q][j*W+i]=1;any[j*W+i]=1}if(WATERK[c])wet[j*W+i]=1}
  const tmp=new Float32Array(N),blur=(a,R)=>{for(let p=0;p<2;p++){
    for(let j=0;j<H;j++){const r0=j*W;let sum=0,n=0;for(let i=0;i<=R&&i<W;i++){sum+=a[r0+i];n++}for(let i=0;i<W;i++){tmp[r0+i]=sum/n;const ad=i+R+1,sb=i-R;if(ad<W){sum+=a[r0+ad];n++}if(sb>=0){sum-=a[r0+sb];n--}}}
    for(let i=0;i<W;i++){let sum=0,n=0;for(let j=0;j<=R&&j<H;j++){sum+=tmp[j*W+i];n++}for(let j=0;j<H;j++){a[j*W+i]=sum/n;const ad=j+R+1,sb=j-R;if(ad<H){sum+=tmp[ad*W+i];n++}if(sb>=0){sum-=tmp[sb*W+i];n--}}}}};
  M.forEach(a=>blur(a,4));blur(wet,2);blur(any,7);return{S:S*WU,W,H,M,wet,any}})():null;
function rlw(a,x,y){const R=RLF,fx=x/R.S,fy=y/R.S;let i=Math.floor(fx),j=Math.floor(fy);const u=fx-i,v=fy-j;i=i<0?0:i>R.W-2?R.W-2:i;j=j<0?0:j>R.H-2?R.H-2:j;const o=j*R.W+i;
  return(a[o]*(1-u)+a[o+1]*u)*(1-v)+(a[o+R.W]*(1-u)+a[o+R.W+1]*u)*v}
const ridged=(x,y)=>1-Math.abs(2*fbm(x,y)-1);
function reliefH(x,y){const R=RLF;let h=0;const mk=mtnK(x,y);
  if(mk>0){const wm=.45+.55*clamp(rlw(R.M[0],x,y)*1.5,0,1);if(BIGM)h+=wm*(mk*mk*(ISLE?150:190)+Math.pow(mk,1.5)*(26*ridged(x/1900+3,y/1900+1)+8*ridged(x/600+7,y/600+2)));else h+=wm*(Math.pow(mk,1.5)*(70+65*ridged(x/760+3,y/760+1))+mk*mk*24*ridged(x/260+7,y/260+2))}
  const wa=rlw(R.M[1],x,y);if(wa>.01){const m=mesaH(x,y);h+=wa*(42*sstep(.53,.6,m)+28*sstep(.795,.835,m)+10*m)}
  const wb=rlw(R.M[2],x,y);if(wb>.01){const b=badH(x,y),u=clamp((b-.2)/.5,0,1)*7,i=Math.floor(u),f=u-i;h+=wb*44*Math.min(7,i+sstep(.45,1,f))/7}
  const wh=rlw(R.M[3],x,y);if(wh>.01)h+=wh*30*fbm(x/650+3,y/650+8);
  return h*(1-rlw(R.wet,x,y)*.9)}
// soft cast shadows on a 40-unit grid, worked out once per point as the map streams in
const RS_G=40,RS_W=CENTRAL?Math.ceil(WW/RS_G)+2:0,RS_H=CENTRAL?Math.ceil(WH/RS_G)+2:0,RS=CENTRAL?new Float32Array(RS_W*RS_H).fill(-1):null,RSH=CENTRAL?new Float32Array(RS_W*RS_H).fill(NaN):null,SUNT=Math.tan(27*PI/180);
function rsH(i,j){const o=j*RS_W+i;let v=RSH[o];if(v!==v)v=RSH[o]=reliefH(i*RS_G,j*RS_G);return v}
function rsNode(i,j){i=i<0?0:i>=RS_W?RS_W-1:i;j=j<0?0:j>=RS_H?RS_H-1:j;const o=j*RS_W+i;let v=RS[o];if(v>=0)return v;
  const h0=rsH(i,j);let best=0;for(let k=1;k<=14;k++){const ii=i-k,jj=j-k;if(ii<0||jj<0)break;const ex=rsH(ii,jj)-(h0+k*RS_G*1.4142/10*SUNT);if(ex>best)best=ex}
  return RS[o]=clamp(best/6,0,1)}
function rlShadow(x,y){const fx=x/RS_G,fy=y/RS_G,i=Math.floor(fx),j=Math.floor(fy),u=fx-i,v=fy-j;
  return(rsNode(i,j)*(1-u)+rsNode(i+1,j)*u)*(1-v)+(rsNode(i,j+1)*(1-u)+rsNode(i+1,j+1)*u)*v}
const SUNL=[-.5,-.5,.7071];
function reliefLight(x,y){const e=6,h=reliefH(x,y),gx=(reliefH(x+e,y)-h)/e*10,gy=(reliefH(x,y+e)-h)/e*10,E=BIGM?1:1.3,nx=-gx*E,ny=-gy*E,l=Math.hypot(nx,ny,1);
  const d=(nx*SUNL[0]+ny*SUNL[1]+SUNL[2])/l/SUNL[2];return{h,gx,gy,slope:Math.hypot(gx,gy),sh:clamp(d,.36,1.34)*(1-(BIGM?.2:.34)*rlShadow(x,y))}}
const SLK=BIGM?.45:1,RL_SNOW=hex('#9fb0c6'),RL_GRAN=[hex('#a39886'),hex('#c7bba6'),hex('#8a7f70')],RL_CLIFF=['#b06a45','#cf9a6c','#9a5a3d','#d9b080','#a8714e','#c98e63'].map(hex),RL_COOL=hex('#33413a');
function rockAt(x,y){const mk=mtnK(x,y),wa=rlw(RLF.M[1],x,y),wb=rlw(RLF.M[2],x,y);if(mk<=0&&wa<.3&&wb<.3)return null;
  if(wb>.5){const b=badH(x,y);if(b>.32&&b<.62)return{k:'hoodoo',p:.06};return null}
  if(wa>.5){const m=mesaH(x,y);if(Math.abs(m-.57)<.025||Math.abs(m-.815)<.02)return{k:'ledge',p:.22};return null}
  if(mk>.45){const L=reliefLight(x,y),th=BIGM?.42:1.1;if(L.slope>th)return{k:'crag',p:.14*sstep(th,th*1.6,L.slope)*sstep(.45,.7,mk)}}return null}
function reliefTone(c,x,y,t){if(!RLF||t===T.LAKE||t===T.CITY||t===T.FIELD||t===T.PARK||t===T.YARD||t===T.HEDGE)return c;const mk=mtnK(x,y);if(mk<=0&&rlw(RLF.any,x,y)<.02)return c;
  const L=reliefLight(x,y),wa=rlw(RLF.M[1],x,y),wb=rlw(RLF.M[2],x,y);let col=c;
  if(L.slope>Math.min(.7,SLK)){const st=sstep(.7,1.5,L.slope);
    let mz=0;if(wa>.35&&wa>wb){const m=mesaH(x,y);mz=Math.max(1-Math.abs(m-.565)/.04,1-Math.abs(m-.815)/.03,0)}
    if(mz>0){const b=L.h/7+fbm(x/80,y/80)*.6,i=Math.floor(b);col=mix(col,mix(RL_CLIFF[((i%6)+6)%6],RL_CLIFF[((i+1)%6+6)%6],sstep(.6,1,b-i)),st*.85*Math.min(1,mz*1.6))}   // banded scarps
    else if(mk>.45&&wb<.3&&L.slope>SLK){const g=fbm(x/70+4,y/70+9);col=mix(col,g>.55?RL_GRAN[1]:g<.4?RL_GRAN[2]:RL_GRAN[0],(BIGM?sstep(.62,1.1,L.slope)*sstep(.62,.85,mk)*(ISLE?.25:.5):sstep(SLK,SLK*1.8,L.slope)*sstep(.45,.7,mk)*.75)*(1-snowCover(x,y)))}}                                         // granite crags
  const wk=wkey(x,y),bare=wa>.4||wb>.4||(t===T.ROCK&&!BIGM)||wk==='desert'||wk==='mojave'||wk==='sonoran'||wk==='canyon',sh=BIGM?1+(L.sh-1)*.6:L.sh;
  if(BIGM){const sn=snowCover(x,y,wk);if(sn>.05){const k=Math.min(1,sn*1.4);const base=sh<1?mix(col,RL_COOL,(1-sh)*1.1):mix(col,WARM_LT,(sh-1)*.6);
    return mix(base,sh<1?mix(col,RL_SNOW,(1-sh)*.85):mix(col,[255,255,255],(sh-1)*.5),k)}}
  if(bare)return sh<1?mix(col,WARM_SH,Math.min(.62,(1-sh)*1.1)):mix(col,WARM_LT,(sh-1)*1.1);
  return sh<1?mix(col,RL_COOL,(1-sh)*1.1):mix(col,WARM_LT,(sh-1)*.6)}

const PCOLS={reef:hex('#3ec2c0'),reefL:hex('#8be3d2'),coral:hex('#2a8f95'),deep:hex('#16648f'),deep2:hex('#0e3c66'),lava:hex('#2f2c2e'),lava2:hex('#4a4446'),lavaS:hex('#6d6062'),
  cinder:hex('#8a4f3e'),cinder2:hex('#b0705a'),cinder3:hex('#5f3a33'),basalt:hex('#3d3a38'),basalt2:hex('#6a645e'),fair:hex('#5fae4a'),fair2:hex('#6cbc54'),green:hex('#78c85c'),pool:hex('#4fd2e8'),poolL:hex('#a8f0f8'),isle:hex('#e8dcb2'),isle2:hex('#cdbf92')};
function pacColor(x,y,t,n){const k=wkey(x,y);
  if(t===T.SHAL||t===T.DEEP){if(k==='reef'){const d=wdist(x,y),s=fbm(x/90+3,y/90+8),cr=fbm(x/34+5,y/34+1);let c=mix(PCOLS.reef,PCOLS.reefL,clamp((s-.45)*2.2,0,.75));
      if(cr>.6&&d>40)c=mix(c,PCOLS.coral,Math.min(.7,(cr-.6)*5));c=mix(c,PCOLS.deep,clamp((d-500)/900,0,.55));if(d<9)c=mix(c,[236,248,244],(1-d/9)*.45);return c.map(v=>v*(.97+n*.05))}
    if(k==='pelagic'){const d=wdist(x,y);return mix(PCOLS.deep,PCOLS.deep2,clamp((d-700)/1800,0,1)).map(v=>v*(.97+n*.05))}return null}
  if(t===T.LAKE&&k==='pool'){const d=wdist(x,y);return d<6?[246,246,240]:mix(PCOLS.pool,PCOLS.poolL,(Math.sin(x/9+y/14)+1)*.18)}
  if(t===T.PARK&&k==='golf'){const g=wdist(x,y);const st=(Math.floor((x*.7+y*.7)/60)&1)?PCOLS.fair:PCOLS.fair2;return st.map(v=>v*(.98+n*.04))}
  if(k==='lava'&&t!==T.LAKE){const f=fbm(x/60+3,y/60+7),r=Math.abs(fbm(x/140+1,y/140+5)-.5);let c=mix(PCOLS.lava,PCOLS.lava2,f);if(r<.04)c=mix(c,PCOLS.lavaS,(.04-r)/.04*.6);
    if(fbm(x/45+9,y/45+2)>.7)c=mix(c,hex('#5d7a3c'),.35);return c.map(v=>v*(.94+n*.1))}
  if(k==='cinder'&&t!==T.LAKE){const f=fbm(x/80+2,y/80+4);let c=f>.55?mix(PCOLS.cinder,PCOLS.cinder2,(f-.55)*2):mix(PCOLS.cinder3,PCOLS.cinder,f/.55);return c.map(v=>v*(.95+n*.08))}
  if((k==='rocky')&&t!==T.LAKE){const f=fbm(x/45+2,y/45+7);let c=mix(PCOLS.basalt,PCOLS.basalt2,f);const d=wdist(x,y);if(d<60)c=mix(c,hex('#2a2826'),(1-d/60)*.45);return c.map(v=>v*(.95+n*.08))}
  if(k==='islets'){if(t===T.ROCK)return mix(PCOLS.basalt,PCOLS.basalt2,fbm(x/40,y/40)).map(v=>v*(.95+n*.08));const g=fbm(x/70+2,y/70+5);return mix(PCOLS.isle,PCOLS.isle2,g).map(v=>v*(.96+n*.06))}
  return null}
function cenColor(x,y,t,n){
  if(BRI){const c=brColor(x,y,t,n);if(c)return c}
  if(TROP){const c=pacColor(x,y,t,n);if(c)return c}
  if(t===T.GRASS||t===T.SCRUB||t===T.SANDHILL||t===T.MEADOW||t===T.FLOOR||t===T.ROCK||t===T.LAKE){const k=wkey(x,y);
    if(k==='badlands'||k==='canyon')return badlandsColor(x,y,n);
    if(k==='desert'&&t!==T.LAKE)return desertColor(x,y,n);
    if(WEST&&(k==='cliffs'||k==='rocky')&&t!==T.LAKE){const f=fbm(x/45+2,y/45+7),cr=Math.abs(fbm(x/120+5,y/120+1)-.5);let c=mix(hex('#7d786f'),hex('#b3ac9e'),f);if(cr<.03)c=mix(c,hex('#4f4b45'),(.03-cr)/.03*.7);
      const d=wdist(x,y);if(d<70)c=mix(c,hex('#4a4a46'),(1-d/70)*.55);if(k==='cliffs'){const g=fbm(x/26+3,y/11+8);if(g>.62)c=mix(c,hex('#eeebe2'),Math.min(.6,(g-.62)*4))}if(fbm(x/60+9,y/60+3)>.66)c=mix(c,hex('#9a9a5a'),.35);return c.map(v=>v*(.95+n*.08))}
    if(k==='mojave'&&t!==T.LAKE)return mix(desertColor(x,y,n),hex('#e4d3ad'),.35);
    if(k==='sonoran'&&t!==T.LAKE)return mix(desertColor(x,y,n),hex('#c9a77c'),.3);
    if(k==='pinyon'&&t!==T.LAKE)return mesaColor(x,y,t,n);
    if(k==='saline'){const d=wdist(x,y);if(CAR&&d>50)return mix(SALINE[1],hex('#d9a3a8'),clamp((d-50)/140,0,.8)).map(v=>v*(.97+n*.03));if(WEST&&d>70)return mix(SALINE[1],hex('#5f9fa6'),clamp((d-70)/160,0,1)).map(v=>v*(.97+n*.03));return mix(SALINE[0],SALINE[1],clamp(d/120,0,1)*(.6+fbm(x/50,y/50)*.4)).map(v=>v*(.97+n*.04))}
    const C=CCOL[k];if(!C||t===T.LAKE||t===T.ROCK&&k!=='pinyon'&&k!=='skyisland')return null;
    if(t===T.ROCK)return mix(GC.rock2,hex('#b28d6a'),.35+fbm(x/120,y/120)*.3);
    let col;if(t===T.FLOOR){const l=fbm(x/260+4,y/260+9);col=mix(C[1],GC.litter,clamp((l-.45)*1.4,0,.4)).map(v=>v*(.9+n*.16))}
    else col=mix(C[0],C[1],fbm(x/70+2,y/70+5)*(t===T.MEADOW?.4:1)).map(v=>v*(.92+n*.12));
    if(k==='juniperoak'){const l=fbm(x/110+3,y/110+6);if(l>.7)col=mix(col,LIME,clamp((l-.7)*14,0,.75))}
    return col}
  return null}
function habColor(x,y,t,n){
  switch(t){
    case T.LAKE:{const hk=wkey(x,y),base=y<14000?GC.lakeN:GC.lake,deep=clamp(wdist(x,y)/(hk==='river'||hk==='pools'?40:220),0,1);const d0=wdist(x,y),rim=d0<9?(1-d0/9)*.32:0;return mix(mix(GC.lakeShal,base,hk==='lake'?deep:deep*.7),[226,240,236],rim)}
    case T.MARSH:{const k=fbm(x/60,y/60);return mix(GC.marsh,GC.marsh2,k).map(v=>v*(.9+n*.14))}
    case T.SALT:{const k=fbm(x/90+2,y/90);return(k>.66?GC.mudS:mix(GC.salt,GC.salt2,k)).map(v=>v*(.94+n*.08))}
    case T.SWAMP:{const k=fbm(x/80+7,y/80+3);return(k>.55?mix(GC.duck,GC.swamp,n*.4):mix(GC.swampW,GC.swamp,k)).map(v=>v*(.92+n*.1))}
    case T.BOG:{const k=fbm(x/55+3,y/55+8);return mix(GC.bog,GC.bog2,clamp(k*1.4-.3,0,1)).map(v=>v*(.9+n*.14))}
    case T.MANGROVE:{const k=fbm(x/70+1,y/70+5);return(k>.56?mix(GC.shalS,GC.mangrove,.45):GC.mangrove).map(v=>v*(.92+n*.12))}
    case T.MUD:{const k=fbm(x/50+4,y/50+1);return mix(GC.mud,GC.mud2,k).map(v=>v*(.94+n*.08))}
    case T.ARCTIC:{const k=fbm(x/70+2,y/70+6);return(k>.62?GC.lichen:mix(GC.arctic,GC.arctic2,k)).map(v=>v*(.93+n*.1))}
    case T.ICE:return GC.ice.map(v=>v*(.97+n*.05));
    case T.GRASS:return mix(GC.grass,GC.grass2,fbm(x/70,y/70)).map(v=>v*(.92+n*.12));
    case T.SCRUB:return mix(GC.scrub,GC.scrub2,fbm(x/50+4,y/50)).map(v=>v*(.9+n*.14));
    case T.SANDHILL:return mix(GC.sandhill,GC.wire,clamp(fbm(x/40+1,y/40+6)*1.6-.5,0,1)).map(v=>v*(.95+n*.06));
    case T.HEDGE:return GC.hedge.map(v=>v*(.9+n*.15));
    case T.YARD:return GC.yard.map(v=>v*(.94+n*.1));
    case T.PARK:{if(!inPark(x,y))return GC.park.map(v=>v*(.92+n*.1));// gardens along Sea Horse Street
      if(CENTRAL&&TSTYLE!=='prairie')return plazaColor(x,y,n);
      const edge=Math.min(x-PARK.x0,PARK.x1-x,y-PARK.y0,PARK.y1-y);if(edge<5)return[141,134,120].map(v=>v*(.94+n*.1));
      if(parkPath(x,y))return GC.path.map(v=>v*(.96+n*.06));if(parkLawn(x,y))return GC.park.map(v=>v*(1.04+n*.08));return GC.park.map(v=>v*(.86+n*.14))}
    case T.CITY:{const lot=typeof cityLotAt==='function'?cityLotAt(x,y):null;if(lot){if(lot.kind==='lawn')return mix(GC.park,GC.grass,fbm(x/60,y/60)*.5).map(v=>v*(.95+n*.08));if(lot.kind==='gravel')return[184,174,154].map(v=>v*(.93+n*.1));if(lot.kind==='patio'){const t=(Math.floor(x/16)+Math.floor(y/16))&1?.93:1.03;return[196,120,88].map(v=>v*t*(.97+n*.05))}if(lot.kind==='parking')return GC.asphalt.map(v=>v*(.96+n*.06));if(lot.kind==='plaza'){const tile=((Math.floor(x/24)+Math.floor(y/24))&1)?.97:1.03;return GC.walk.map(v=>v*tile)}if(lot.kind==='pool'){const cx=(lot.x0+lot.x1)/2,cy=(lot.y0+lot.y1)/2;if(Math.abs(x-cx)<(lot.x1-lot.x0)*.3&&Math.abs(y-cy)<(lot.y1-lot.y0)*.28)return GC.pool;return GC.walk}return GC.park.map(v=>v*(.9+n*.14))}
      let walk=false;for(const sy of STS)if(Math.abs(y-sy)<ST_HALF+WALK)walk=true;for(const ax of AVES)if(Math.abs(x-ax)<ST_HALF+WALK)walk=true;
      const hw=Math.abs(x-roadX(y));if(hw<ROAD_HALF+WALK)walk=true;
      if(walk){const tile=((Math.floor(x/30)+Math.floor(y/30))&1)?.97:1.02;return GC.walk.map(v=>v*tile*(.97+n*.04))}return GC.city.map(v=>v*(.95+n*.08))}
    case T.FIELD:{const f=fieldAt(x,y);if(!f)return GC.hedge;const u=f.dir?x:y,s=((u%20)+20)%20/20,rough=fbm(x/50,y/50);
      switch(f.crop){case'corn':return(s<.6?mix(GC.corn,GC.corn2,rough):GC.soil).map(v=>v*(.92+n*.12));
        case'soy':return(s<.5?GC.soy:mix(GC.soil,GC.soy,.25)).map(v=>v*(.92+n*.12));
        case'wheat':return mix(GC.wheat,GC.wheat2,s<.3?.6:rough*.5).map(v=>v*(.95+n*.08));
        case'hay':{const w=((u%70)+70)%70<9;return(w?GC.hay2:mix(GC.hay,GC.pasture,rough*.5)).map(v=>v*(.94+n*.1))}
        case'plowed':return(s<.5?GC.plow:GC.soil).map(v=>v*(.92+n*.1));
        case'rape':{const y0=SEASON==='spring'?hex('#e8d838'):SEASON==='summer'?hex('#9aa848'):SEASON==='fall'?hex('#8a7a4a'):hex('#6f8a4a');return mix(y0,shadeHex2(y0,-.1),s<.4?.6:rough*.4).map(v=>v*(.95+n*.08))}
        case'barley':return mix(SEASON==='summer'?hex('#d8c47a'):SEASON==='spring'?hex('#8fb05a'):GC.wheat2,GC.wheat,s<.3?.5:rough*.4).map(v=>v*(.95+n*.08));
        default:return mix(GC.pasture,GC.hay,rough*.6).map(v=>v*(.9+n*.14))}}}
  return null}

/* ---------- planted things the city and farms add to each map cell ---------- */
const PLANTED={trees:[],decor:[]};
// the Old Wall, the stone circles, the chalk horse, sheep in the pasture fields and cattle in a few
function brPlant(r){for(const L of WD.walls||[])for(let i=0;i<L.length-1;i++){const [x0,y0]=L[i],[x1,y1]=L[i+1],len=Math.hypot(x1-x0,y1-y0);for(let d=0;d<len;d+=46)PLANTED.decor.push({k:'drywall',x:x0+(x1-x0)*d/len,y:y0+(y1-y0)*d/len,s:r()})}
  for(const [cx,cy,R,n] of WD.stones||[])for(let i=0;i<n;i++){const a=i/n*TAU;PLANTED.decor.push({k:'stone',x:cx+Math.cos(a)*R,y:cy+Math.sin(a)*R*.7,s:r()})}
  for(const f of FIELDS){if(f.crop!=='pasture')continue;const n=3+Math.floor(r()*5),cow=r()<.2;for(let i=0;i<n;i++)PLANTED.decor.push({k:cow?'cow':'sheep',x:f.x0+40+r()*(f.x1-f.x0-80),y:f.y0+40+r()*(f.y1-f.y0-80),s:r()})}}
function cenPlant(){const r=rng(4242);
  for(let j=0;j<STS.length;j++){const sy=STS[j];for(const side of[-1,1]){const yy=sy+side*(ST_HALF+9),bj=side<0?j-1:j;
    for(let x=CITY.x0+60;x<OCEAN_DR-40;x+=120){let near=false;for(const ax of AVES)if(Math.abs(x-ax)<ST_HALF+WALK+40)near=true;if(near)continue;
      const i=AVES.findIndex((ax,k)=>k<AVES.length-1&&x>ax&&x<AVES[k+1]);const out=bj<0||bj>=STS.length-1,main=!out&&i>=1&&i<=3;
      if(TSTYLE==='british'){if(!main&&!out&&r()<.7)PLANTED.trees.push({x:x+(r()-.5)*24,y:yy,type:'decid',h:13+r()*5,r:8})}else if(TSTYLE==='colonial'){}else if(TSTYLE==='plantation'){if(!out&&r()<.8)PLANTED.trees.push(main?{x:x+(r()-.5)*24,y:yy,type:'palm',h:11+r()*4,r:5}:{x:x+(r()-.5)*24,y:yy,type:'hoak',h:10+r()*3,r:9})}
      else if(TSTYLE==='mission'){if(!out&&r()<.85)PLANTED.trees.push(main?{x:x+(r()-.5)*24,y:yy,type:'palm',v:'fan',h:16+r()*5,r:4}:{x:x+(r()-.5)*24,y:yy,type:'liveoak',h:9+r()*3,r:8})}
      else if(!main&&!out&&r()<.85)PLANTED.trees.push({x:x+(r()-.5)*24,y:yy,type:'decid',h:10+r()*5,r:7});
      if((main||TSTYLE==='colonial')&&Math.round((x-CITY.x0-60)/120)%2===0)PLANTED.decor.push({k:'lamp',x,y:sy+side*(ST_HALF+3),s:r()});
      if(out&&side>0&&Math.round((x-CITY.x0-60)/120)%3===0)PLANTED.decor.push({k:'bench',x,y:sy+ST_HALF+WALK+40,s:r()})}}}
  for(const sy of STS)for(const ax of AVES)if(TSTYLE==='british'){if(r()<.3)PLANTED.decor.push({k:r()<.5?'phonebox':'postbox',x:ax+ST_HALF+14,y:sy+ST_HALF+14,s:.5})}else if(r()<.45)PLANTED.decor.push({k:'hydrant',x:ax+ST_HALF+12,y:sy+ST_HALF+8,s:r()});
  if(BRI)brPlant(r);
  if(TSTYLE!=='prairie')return;
  const P=PARK,cx=(P.x0+P.x1)/2,cy=(P.y0+P.y1)/2;
  for(const [dx,dy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){PLANTED.decor.push({k:'lamp',x:cx+dx*(P.x1-P.x0)/2*.82,y:cy+dy*(P.y1-P.y0)/2*.8,s:r()});PLANTED.decor.push({k:'bench',x:cx+dx*(P.x1-P.x0)*.3,y:cy+dy*(P.y1-P.y0)*.36,s:r()})}
  for(const [dx,dy] of[[0,-1],[0,1],[-1,0],[1,0]])PLANTED.decor.push({k:'bin',x:cx+dx*170+(dy?22:0),y:cy+dy*140+(dx?22:0),s:r()})}
if(CENTRAL)cenPlant();else{const r=rng(4242);
  // street trees along the east-west streets, lamp posts on every block
  for(const sy of STS)for(const side of[-1,1]){const yy=sy+side*(ST_HALF+9);
    for(let x=CITY.x0+40;x<OCEAN_DR-20;x+=150){if(stGap(sy,x))continue;let nearAve=false;for(const ax of AVES)if(Math.abs(x-ax)<ST_HALF+WALK+30)nearAve=true;if(nearAve||Math.abs(x-roadX(yy))<ROAD_HALF+WALK+40)continue;
      if(side>0||r()<.5)PLANTED.trees.push({x:x+(r()-.5)*20,y:yy,type:'decid',h:8+r()*4,r:6});
      PLANTED.decor.push({k:'lamp',x:x+70,y:sy+side*(ST_HALF+3),s:r()})}}
  for(const ax of AVES)for(const side of[-1,1])for(let y=CITY.y0+60;y<CITY.y1;y+=170){let nearSt=false;for(const sy of STS)if(Math.abs(y-sy)<ST_HALF+WALK+30)nearSt=true;if(nearSt)continue;PLANTED.decor.push({k:'lamp',x:ax+side*(ST_HALF+3),y,s:r()})}
  // hydrants and bins near the corners
  for(const sy of STS)for(const ax of AVES){if(r()<.5)PLANTED.decor.push({k:'hydrant',x:ax+ST_HALF+12,y:sy+ST_HALF+8,s:r()});if(r()<.6)PLANTED.decor.push({k:'bin',x:ax-ST_HALF-12,y:sy-ST_HALF-6,s:r()})}
  // the park: benches round the loop path, a fountain in the middle
  const P=PARK,cx=(P.x0+P.x1)/2;PLANTED.decor.push({k:'fountain',x:cx,y:PSEC[1][0]+46,s:.5});
  for(let x=P.x0+110;x<P.x1-60;x+=240)PLANTED.decor.push({k:'bench',x,y:P.y0+50,s:r()});PLANTED.decor.push({k:'bench',x:(P.x0+P.x1)/2+120,y:P.y1-46,s:r()});
  for(let y=P.y0+80;y<P.y1-40;y+=150){if(parkSec(y)<0)continue;PLANTED.decor.push({k:'lamp',x:P.x0+46,y,s:r()});PLANTED.decor.push({k:'lamp',x:P.x1-46,y:y+60,s:r()})}
  for(let a=.3;a<TAU;a+=TAU/4){const x=POND.x+Math.cos(a)*POND.rx*1.4,y=POND.y+Math.sin(a)*POND.ry*1.6;if(inPark(x,y))PLANTED.decor.push({k:'bench',x,y,s:r()})}
  // beach umbrellas and towels on the city beach
  for(let i=0;i<9;i++){const y=CITY.y0+150+i*190+r()*80,x=coastX(y)-150-r()*120;PLANTED.decor.push({k:'umbrella',x,y,s:r()})}}
function plantedIn(cx,cy){const x0=cx*CELL,y0=cy*CELL,inC=p=>p.x>=x0&&p.x<x0+CELL&&p.y>=y0&&p.y<y0+CELL,warm=SEASON==='spring'||SEASON==='summer';return{trees:PLANTED.trees.filter(inC),decor:PLANTED.decor.filter(p=>inC(p)&&(warm||p.k!=='umbrella'))}}

/* ---------- tree models ----------
   Each tree is a small 3D model in metres: trunk, branches, foliage clumps and perches.
   The map draws it from the south at a 3/4 angle; the binoculars draw it from wherever you stand,
   so a bird on the far side of a trunk is really hidden until you walk around. */
// four flat tones per species: shadow, base, light, highlight
const LEAF={decid:[['#2f5a2e','#46783a','#6b9d4b','#9cc46a'],['#2e5e33','#4a8a3f','#74b152','#a8d273'],['#4a6a2c','#6a8d37','#93b24d','#c0d37b']],
  birch:[['#4b7a30','#6c9c3d','#96c156','#c8e08a']],spruce:[['#1c3d34','#2a5647','#3e715f','#5f927e']],hemlock:[['#1f3e2b','#2e5a3b','#477b4f','#6f9e6e']],
  pine:[['#2b4f2b','#3e6b36','#5d8b45','#8bb065']],palm:[['#3b6633','#5a8a41','#83b058','#b3d27c']],liveoak:[['#2b4226','#3e5b30','#5a7a40','#83a05a']],
  cypress:[['#4a6a2e','#678c39','#8db34e','#b9d47a']],mangrove:[['#22412b','#335d37','#4b7b45','#76a35e']],cedar:[['#22392c','#30503a','#45694b','#678a62']],
  juniper:[['#2f4a3e','#3f6051','#5a7e69','#87a594'],['#2b4538','#3b5a48','#567a61','#80a088']],pinyon:[['#23402c','#32563a','#4b7347','#73975e']],
  mesquite:[['#506b37','#6b8a43','#90ab55','#bccd7d']],hoak:[['#2c4128','#3d5834','#57773f','#7f9c58'],['#34442c','#495c39','#677d4a','#92a46a']],
  ebony:[['#1c3221','#29452f','#3d613f','#5d8457']],
  ohia:[['#2b4429','#3f5f37','#5a7c47','#cf3a2e'],['#2f4a2c','#46663a','#638650','#d8503a']],koa:[['#344f2c','#4b6a3a','#68864b','#8fa462']],mamane:[['#3f5a32','#587545','#7a955a','#e8c23a']],flambo:[['#2f5a2c','#467a3a','#62964a','#e4502a']],banyan:[['#203c1e','#30552a','#466e36','#6a8f4a']]};
// bark: lit side, shadow side
const BARK={oak:['#6a5a4b','#4b3f35'],maple:['#7a7266','#58524a'],beech:['#a7a69d','#7f7e76'],birch:['#efebe2','#c9c3b6'],spruce:['#6e5242','#4d382c'],hemlock:['#73584a','#503c31'],
  pine:['#a8714a','#7a4f33'],palm:['#a8977a','#7f6f55'],liveoak:['#5c5248','#3f3730'],snag:['#a59e92','#7d776d'],
  cypress:['#9a7a62','#6f5544'],cedar:['#9a5f45','#6a3f2e'],mangrove:['#8f7f68','#5e5242'],
  juniper:['#8d7262','#5f4b3e'],pinyon:['#7a6352','#54443a'],mesquite:['#54433a','#33281f'],hoak:['#5f574e','#3f3933'],ebony:['#5a524b','#3a3431'],ohia:['#6d6158','#463d36'],koa:['#7a5a42','#4f3a2a'],mamane:['#6a5e50','#463d34'],flambo:['#7d7468','#504a42'],banyan:['#8f877a','#625a50']};
const FALLPAL={oak:[['#6e3a1c','#9a4f24','#c4702e','#e09a48'],['#5e4a22','#8a6a2c','#b48c3c','#d8b45c']],maple:[['#7a221a','#b03424','#d8552c','#f08c3c'],['#8a4a14','#c0701e','#e49a2a','#f6c454']],beech:[['#7a5a1e','#a8822a','#cca638','#e8cc64']],birch:[['#7a6a1c','#a8962a','#ccbc38','#ece070']],cypress:[['#6a3e1c','#94582a','#b87a3c','#d6a060']]};
function shadeHex2(c,a){return c.map(v=>clamp(Math.round(v*(1+a)),0,255))}
function mixHex(a,b,t){const A=hex(a),B=hex(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
function seasonPal(T,pal,sp){if(TROP)return pal;if(SEASON==='fall'&&FALLPAL[sp]){const v=FALLPAL[sp];return v[T.seed%v.length]}
  if(SEASON==='spring'&&(T.type==='decid'||T.type==='birch'||T.type==='mesquite'||BR_BARE.has(T.type)))return pal.map(c=>mixHex(c,'#b6e07a',.28));
  if((T.type==='spruce'||T.type==='hemlock'||T.type==='pine'||T.type==='cedar'||T.type==='juniper'||T.type==='pinyon')&&snowCover(T.x,T.y)>.5)return[pal[0],pal[1],mixHex(pal[2],'#dfe8ea',.55),'#f4f7f9'];
  return pal}
function model(T){if(T.m)return T.m;const r=rng(T.seed),H=T.h,m={tr:null,br:[],cl:[],perch:[],moss:[],holes:[],type:T.type};
  const pi=LEAF[T.type]?Math.floor(r()*LEAF[T.type].length):0,pal=LEAF[T.type]?LEAF[T.type][pi]:LEAF.decid[0];m.sp=T.type==='decid'?['oak','maple','beech'][pi]:T.type;m.pal=seasonPal(T,pal,m.sp);[m.bark,m.barkD]=BARK[m.sp];
  const lean=[(r()-.5)*.6,(r()-.5)*.6];
  const addClump=(x,y,h,rad,kind='leaf')=>{const sub=[];for(let i=0;i<5;i++){const a=r()*TAU,d=r()*.55;sub.push([Math.cos(a)*d,Math.sin(a)*d*.8,.38+r()*.3])}m.cl.push({x,y,h,r:rad,kind,sub,s:r()*1000|0})};
  const addBranch=(a,b,w,perch=true)=>{m.br.push({a,b,w});if(perch){for(const f of[.55+r()*.15,.86+r()*.1]){m.perch.push({x:lerp(a[0],b[0],f),y:lerp(a[1],b[1],f),h:lerp(a[2],b[2],f)+w*.5,kind:'b',outer:f>.8,ang:Math.atan2(b[1]-a[1],b[0]-a[0])})}}};
  const t=T.type;
  if(CT_SHAPE[t]){const C=CT_SHAPE[t],th=H*C.th,Rh=H*C.rh,Rv=H*C.rv,ch=H*C.ch;
    m.crown={x:lean[0]*.5,y:lean[1]*.5,h:ch,rx:Rh,rv:Rv};
    m.tr={h:th,top:[lean[0]*.5,lean[1]*.5],w0:C.w0+H*.008,w1:C.w1,col:m.bark,kind:t};
    m.stems=[];for(let i=1;i<C.stems;i++){const a=i/C.stems*TAU+r()*1.2;m.stems.push([Math.cos(a)*(.3+r()*.25),Math.sin(a)*(.18+r()*.2),a])}
    for(let i=0;i<C.br;i++){const a=i/C.br*TAU+r()*.6,base=[lean[0]*.4,lean[1]*.4,th*(.75+r()*.25)],end=[Math.cos(a)*Rh*(.55+r()*.35),Math.sin(a)*Rh*(.55+r()*.35)*.9,ch+(r()-.45)*Rv*.9];addBranch(base,end,C.bw)}
    for(let i=0;i<C.nc;i++){const a=r()*TAU,u=r()*2-1,k=.5+r()*.5,sv=Math.sqrt(1-u*u);addClump(Math.cos(a)*sv*Rh*k,Math.sin(a)*sv*Rh*k*.9,ch+u*Rv*k*.85,Rh*C.cr+r()*Rh*.08,C.kind)}
  }else if(t==='decid'||t==='birch'||t==='liveoak'||t==='mangrove'){const mg=t==='mangrove';
    const sp=m.sp,th=H*(mg?.34:t==='liveoak'?.3:t==='birch'?.5:.46+r()*.08),Rh=H*(mg?.5:t==='liveoak'?.62:t==='birch'?.22:sp==='oak'?.34:sp==='beech'?.26:.3),Rv=H*(mg?.26:t==='liveoak'?.2:sp==='beech'?.34:.3),ch=H*(mg?.64:t==='liveoak'?.6:.68);
    m.crown={x:lean[0],y:lean[1],h:ch,rx:Rh,rv:Rv};
    if(mg){m.roots=[];const nr=8+Math.floor(r()*4);for(let i=0;i<nr;i++){const a=i/nr*TAU+r()*.5;m.roots.push({a,h:.5+r()*1.3,R:1+r()*1.4})}}
    m.tr={h:th,top:[lean[0],lean[1]],w0:mg?.17:t==='liveoak'?.55:t==='birch'?.16:.3+H*.006,w1:t==='liveoak'?.35:.16,col:m.bark,kind:t==='decid'?sp:t};
    const n=t==='liveoak'?7:5+Math.floor(r()*3);
    for(let i=0;i<n;i++){const a=i/n*TAU+r()*.6,base=[lean[0]*.8,lean[1]*.8,th*(.8+r()*.2)];
      const end=[Math.cos(a)*Rh*(.6+r()*.3),Math.sin(a)*Rh*(.6+r()*.3)*.9,ch+(r()-.4)*Rv*.9];addBranch(base,end,t==='liveoak'?.18:.1);
      const mid=[lerp(base[0],end[0],.55),lerp(base[1],end[1],.55),lerp(base[2],end[2],.55)];const a2=a+(r()-.5)*1.4;
      addBranch(mid,[mid[0]+Math.cos(a2)*Rh*.4,mid[1]+Math.sin(a2)*Rh*.4,mid[2]+(r()-.2)*Rv*.5],.05);
      if(t==='liveoak'&&r()<.8)m.moss.push({x:end[0]*.8,y:end[1]*.8,h:end[2]-.3,len:1.2+r()*1.8,s:r()})}
    // a low side branch: warblers like to forage low
    if(t!=='liveoak'&&!mg){const a=r()*TAU,hb=2.2+r()*1.8;addBranch([0,0,hb],[Math.cos(a)*2.6,Math.sin(a)*2.6,hb+.6],.05);addClump(Math.cos(a)*2.4,Math.sin(a)*2.4,hb+.9,.9);addClump(Math.cos(a)*1.6,Math.sin(a)*1.6,hb+.8,.7)}
    const nc=t==='liveoak'?40:mg?34:t==='birch'?20:32;
    for(let i=0;i<nc;i++){const a=r()*TAU,u=r()*2-1,k=.55+r()*.45,sv=Math.sqrt(1-u*u);
      addClump(Math.cos(a)*sv*Rh*k,Math.sin(a)*sv*Rh*k*.9,ch+u*Rv*k*.85,Rh*(t==='liveoak'?.18:.2)+r()*Rh*.1)}
  }else if(t==='spruce'||t==='hemlock'||t==='cedar'){
    const cr=t==='cedar'?.15:.21,hb=t==='cedar'?.06:.16;
    m.tr={h:H,top:[lean[0]*.3,lean[1]*.3],w0:t==='cedar'?.16:.26,w1:.03,col:m.bark,kind:t};m.cone={hb:H*hb,r:H*cr+.35};
    const N=9;for(let k=0;k<N;k++){const f=k/N,hk=H*(hb+(1-hb-.04)*f),rk=(1-f)*H*cr+.35,nn=5+Math.floor((1-f)*3);
      for(let i=0;i<nn;i++){const a=i/nn*TAU+k*.7+r()*.4;const tip=[Math.cos(a)*rk*.9,Math.sin(a)*rk*.9,hk-.2];
        m.br.push({a:[0,0,hk+.1],b:tip,w:.04});addClump(Math.cos(a)*rk*.55,Math.sin(a)*rk*.55,hk,rk*.55+.25,'needle');
        if(k<N-2)m.perch.push({x:tip[0]*.92,y:tip[1]*.92,h:hk-.12,kind:'b',outer:true,ang:a})}}
    addClump(0,0,H*.97,.45,'needle');
  }else if(t==='pine'){
    const th=H*.66;m.tr={h:H*.94,top:[lean[0],lean[1]],w0:.3,w1:.1,col:m.bark,kind:t};
    const n=5+Math.floor(r()*3);for(let i=0;i<n;i++){const a=r()*TAU,hb=th+r()*H*.28,len=1.5+r()*2.4,end=[Math.cos(a)*len,Math.sin(a)*len,hb+r()*.8];
      addBranch([0,0,hb],end,.08);addClump(end[0],end[1],end[2]+.2,1.1+r()*.6,'needle');addClump(end[0]*.55,end[1]*.55,end[2]+.1,.9,'needle')}
    addClump(0,0,H*.97,1.2,'needle');
  }else if(t==='cypress'){
    // bald cypress: a fluted, flared base, a tall straight trunk and a flat-topped crown of feathery sprays
    m.tr={h:H*.94,top:[lean[0]*.4,lean[1]*.4],w0:.5,w1:.12,col:m.bark,kind:'cypress'};
    const n=7+Math.floor(r()*3);for(let i=0;i<n;i++){const a=i/n*TAU+r()*.5,hb=H*(.5+r()*.38),len=1.6+r()*2.6*(1-(hb/H-.5)),end=[Math.cos(a)*len,Math.sin(a)*len,hb+.4+r()*.6];
      addBranch([lean[0]*.4*hb/H,lean[1]*.4*hb/H,hb],end,.08);addClump(end[0],end[1],end[2]+.15,1.15+r()*.5,'needle');addClump(end[0]*.5,end[1]*.5,end[2]-.1,.95,'needle');
      if(r()<.7)m.moss.push({x:end[0]*.7,y:end[1]*.7,h:end[2]-.3,len:1+r()*1.6,s:r()})}
    for(let i=0;i<4;i++){const a=r()*TAU;addClump(Math.cos(a)*1.2,Math.sin(a)*1.2,H*.96+r()*.4,1.3,'needle')}
  }else if(t==='palm'){
    m.tr={h:H,top:[lean[0]*1.4,lean[1]*1.4],w0:.22,w1:.2,col:m.bark,kind:'palm'};
    const n=14;for(let i=0;i<n;i++){const a=i/n*TAU+r()*.3,up=r();m.cl.push({x:lean[0]*1.4+Math.cos(a)*1.4,y:lean[1]*1.4+Math.sin(a)*1.4,h:H+(up-.35)*1.6,r:1.5,kind:'frond',a,up,s:r()*1000|0,sub:[]});
      if(i%3===0)m.perch.push({x:lean[0]*1.4+Math.cos(a)*.7,y:lean[1]*1.4+Math.sin(a)*.7,h:H-.15,kind:'b',ang:a})}
  }else{ // snag: a dead standing tree with a broken top
    m.tr={h:H,top:[lean[0],lean[1]],w0:.34,w1:.18,col:m.bark,kind:'snag'};
    const n=2+Math.floor(r()*3);for(let i=0;i<n;i++){const a=r()*TAU,hb=H*(.45+r()*.4),len=1+r()*2;addBranch([0,0,hb],[Math.cos(a)*len,Math.sin(a)*len,hb+len*.5],.06)}
  }
  // Pileated holes: round excavations in big trunks
  if((t==='snag'||(t==='decid'&&r()<.25)||(t==='pine'&&r()<.15)||(t==='cypress'&&r()<.2))){const k=1+Math.floor(r()*3);for(let i=0;i<k;i++){const d=.11+r()*.07;m.holes.push({a:r()*TAU,h:1.4+r()*Math.min(5,m.tr.h*.5),w:d,hh:d*1.12})}}
  m.ow=m.cl.filter((c,i)=>c.kind==='frond'||c.kind==='needle'||i%3===0).map(c=>({...c,r:c.kind==='frond'||c.kind==='needle'?c.r:c.r*1.55}));
  if(!TROP&&SEASON==='winter'&&(t==='decid'||t==='birch'||t==='cypress'||t==='mesquite'||BR_BARE.has(t))){m.bare=true;m.cl=m.cl.filter(c=>c.kind==='frond')}
  T.m=m;return m}
function trunkRadiusAt(m,h){return lerp(m.tr.w0,m.tr.w1,clamp(h/m.tr.h,0,1))}
function trunkAt(m,h){const f=clamp(h/m.tr.h,0,1);return[m.tr.top[0]*f*f,m.tr.top[1]*f*f]}

/* ----- the map (3/4 view from the south) ----- */
function owPt(T,x,y,h){return[T.x+x*M,T.y+y*M-h*HS]}
/* map trees are cached as small sprites; perched birds are drawn on top */
const SPRITED=[];let sprBudget=0;
function treeSprite(T){if(T.spr)return T.spr;if(sprBudget<=0)return null;sprBudget--;const m=model(T),tmp={...T,x:0,y:0,m};
  let x0=-m.tr.w0*M*2,x1=-x0,y0=-m.tr.h*HS-14,y1=4;
  for(const c of m.ow){const p=owPt(tmp,c.x,c.y,c.h),r=c.r*M*(c.kind==='frond'?1.4:1.05);x0=Math.min(x0,p[0]-r);x1=Math.max(x1,p[0]+r);y0=Math.min(y0,p[1]-r);y1=Math.max(y1,p[1]+r)}
  for(const b of m.br)for(const q of[b.a,b.b]){const p=owPt(tmp,q[0],q[1],q[2]);x0=Math.min(x0,p[0]-3);x1=Math.max(x1,p[0]+3);y0=Math.min(y0,p[1]-3);y1=Math.max(y1,p[1]+3)}
  for(const s of m.moss){const p=owPt(tmp,s.x,s.y,s.h);y1=Math.max(y1,p[1]+s.len*HS+2)}
  if(CT_SHAPE[m.type]){const cc=owPt(tmp,m.crown.x,m.crown.y,m.crown.h),rx=m.crown.rx*M*1.35+6,ry=m.crown.rv*HS*2.8+6;x0=Math.min(x0,cc[0]-rx);x1=Math.max(x1,cc[0]+rx);y0=Math.min(y0,cc[1]-ry);y1=Math.max(y1,cc[1]+ry)}
  x0=Math.floor(x0-2);y0=Math.floor(y0-2);const K=Math.min(1.5,devicePixelRatio||1),c=document.createElement('canvas');c.width=Math.ceil((x1-x0+4)*K);c.height=Math.ceil((y1-y0+4)*K);
  const g=c.getContext('2d'),prev=ctx;ctx=g;g.scale(K,K);g.translate(-x0,-y0);try{drawTreeOW(tmp,null,0,true)}finally{ctx=prev}
  T.spr={c,x0,y0,K};SPRITED.push(T);if(SPRITED.length>420){const o=SPRITED.shift();o.spr=null}return T.spr}
function drawTreeFast(T,birds,t,alpha=1){const s=treeSprite(T);if(!s){ctx.globalAlpha=alpha;drawTreeOW(T,null,t);ctx.globalAlpha=1;if(birds)for(const b of birds)drawBirdOW(b,t);return}
  ctx.globalAlpha=alpha;ctx.drawImage(s.c,T.x+s.x0,T.y+s.y0,s.c.width/s.K,s.c.height/s.K);ctx.globalAlpha=1;if(birds)for(const b of birds)drawBirdOW(b,t)}

/* ---------- plants: flat, clean illustration in the same style as the birds ----------
   Map trees are drawn as species silhouettes with 3–4 flat tones (shadow, base, light, highlight),
   crisp lobes with pointed notches instead of round blobs, visible limbs and species bark.
   Binocular foliage is built from real leaf shapes on twigs (oak, maple, beech, birch, live oak)
   and needle sprays (spruce, hemlock, longleaf pine). */
const SPEC_NAME={oak:'Oak',maple:'Maple',beech:'Beech',birch:'Paper birch',spruce:'Red spruce',hemlock:'Eastern hemlock',pine:'Longleaf pine',palm:'Cabbage palm',liveoak:'Live oak',snag:'Snag',cypress:'Bald cypress',cedar:'Eastern red cedar',mangrove:'Red mangrove',juniper:'Juniper',pinyon:'Pinyon pine',mesquite:'Honey mesquite',hoak:'Plateau live oak',ebony:'Texas ebony',ohia:'ʻŌhiʻa lehua',koa:'Koa',mamane:'Māmane',flambo:'Flamboyán',banyan:'Banyan'};
if(WEST)SPEC_NAME.liveoak='Coast live oak';
if(BRI){Object.assign(SPEC_NAME,{oak:'English oak',beech:'Beech',ash:'Ash',hawthorn:'Hawthorn',rowan:'Rowan',willow:'Willow',yew:'Yew',pine:'Scots pine',birch:'Silver birch',spruce:'Sitka spruce',maple:'Sycamore',snag:'Dead tree'})}
if(CAR){SPEC_NAME.palm='Palm';SPEC_NAME.hoak='Ausubo';SPEC_NAME.decid='Tabonuco';SPEC_NAME.ebony='Elfin-woods tree';SPEC_NAME.mesquite='Mesquite'}
if(PAC){SPEC_NAME.palm='Coconut palm';SPEC_NAME.hoak='Monkeypod';SPEC_NAME.decid='Kukui';SPEC_NAME.mesquite='Kiawe'}

/* lobed canopy outline: rounded lobes meeting in sharp notches */
function lobePath(cx,cy,rx,ry,n,r,o={}){const p=new Path2D(),a0=o.a0??r()*TAU,cusp=[],lobe=[],ang=[];
  for(let i=0;i<n;i++){ang.push(a0+(i+(r()-.5)*.35)/n*TAU);cusp.push((o.cusp??.84)+(r()-.5)*(o.cj??.08));lobe.push((o.lobe??1.1)+(r()-.5)*(o.amp??.14))}
  const P=(a,k)=>{let s=Math.sin(a);if(o.flat&&s>0)s*=o.flat;if(o.peak&&s<0)s*=1+o.peak*Math.max(0,-Math.cos(a+PI/2));return[cx+Math.cos(a)*rx*k,cy+s*ry*k]};
  const c0=P(ang[0],cusp[0]);p.moveTo(c0[0],c0[1]);
  for(let i=0;i<n;i++){const a=ang[i],b=i+1<n?ang[i+1]:ang[0]+TAU,k=lobe[i],q1=P(a+(b-a)*.06,k),q2=P(a+(b-a)*.94,k),e=P(b,cusp[(i+1)%n]);p.bezierCurveTo(q1[0],q1[1],q2[0],q2[1],e[0],e[1])}
  p.closePath();return p}
function fillP(p,c){ctx.fillStyle=c;ctx.fill(p)}
function taper(x0,y0,x1,y1,w0,w1,col){const dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;ctx.fillStyle=col;ctx.beginPath();
  ctx.moveTo(x0+nx*w0,y0+ny*w0);ctx.lineTo(x1+nx*w1,y1+ny*w1);ctx.lineTo(x1-nx*w1,y1-ny*w1);ctx.lineTo(x0-nx*w0,y0-ny*w0);ctx.closePath();ctx.fill()}
// a limb with a lit side and a shadow side
function limb2(x0,y0,x1,y1,w0,w1,light,dark){taper(x0,y0,x1,y1,w0,w1,dark);const dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,s=nx<0?1:-1;
  ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(x0+nx*w0*s,y0+ny*w0*s);ctx.lineTo(x1+nx*w1*s,y1+ny*w1*s);ctx.lineTo(x1-nx*w1*.1*s,y1-ny*w1*.1*s);ctx.lineTo(x0-nx*w0*.1*s,y0-ny*w0*.1*s);ctx.closePath();ctx.fill()}

/* a round woodpecker hole: pale chiselled rim, dark cavity, shadow under the top lip */
function drawHole(x,y,rw,rh){ell(x,y,rw*1.32,rh*1.28,'#e2d0aa');ell(x,y+rh*.08,rw,rh,'#2a1d14');
  ctx.fillStyle='#120c08';ctx.beginPath();ctx.ellipse(x,y+rh*.08,rw,rh,0,PI*1.05,PI*1.95);ctx.ellipse(x,y-rh*.25,rw*.9,rh*.55,0,PI*1.95,PI*1.05,true);ctx.fill();
  ctx.fillStyle='#c9b48a';ctx.beginPath();ctx.ellipse(x,y+rh*.08,rw,rh,0,PI*.15,PI*.85);ctx.ellipse(x,y+rh*.5,rw*.92,rh*.55,0,PI*.85,PI*.15,true);ctx.fill()}
/* ---------- leaf shapes (unit length along +x from the stalk) ---------- */
const LEAFP={
  oak:"M0,0 C.08,-.1 .16,-.06 .2,-.16 C.25,-.3 .37,-.22 .4,-.1 C.45,-.3 .59,-.31 .61,-.14 C.68,-.3 .83,-.25 .81,-.08 C.93,-.12 1.02,-.03 1,0 C1.02,.03 .93,.12 .81,.08 C.83,.25 .68,.3 .61,.14 C.59,.31 .45,.3 .4,.1 C.37,.22 .25,.3 .2,.16 C.16,.06 .08,.1 0,0 Z",
  maple:"M0,0 L.22,-.04 L.18,-.22 L.3,-.18 L.3,-.42 L.44,-.3 L.5,-.48 L.56,-.26 L.72,-.38 L.7,-.16 L.98,-.14 L.8,-.04 L1,0 L.8,.04 L.98,.14 L.7,.16 L.72,.38 L.56,.26 L.5,.48 L.44,.3 L.3,.42 L.3,.18 L.18,.22 L.22,.04 Z",
  beech:"M0,0 C.12,-.18 .4,-.27 .62,-.24 C.82,-.2 .95,-.08 1,0 C.95,.08 .82,.2 .62,.24 C.4,.27 .12,.18 0,0 Z",
  birch:"M0,0 L.08,-.2 L.18,-.3 L.26,-.28 L.32,-.3 L.42,-.26 L.48,-.24 L.58,-.18 L.64,-.15 L.74,-.1 L.8,-.08 L.9,-.04 L1,0 L.9,.04 L.8,.08 L.74,.1 L.64,.15 L.58,.18 L.48,.24 L.42,.26 L.32,.3 L.26,.28 L.18,.3 L.08,.2 Z",
  liveoak:"M0,0 C.2,-.2 .62,-.22 1,0 C.62,.22 .2,.2 0,0 Z",mangrove:"M0,0 C.14,-.24 .56,-.3 .82,-.18 C.96,-.1 1,-.02 1,0 C1,.02 .96,.1 .82,.18 C.56,.3 .14,.24 0,0 Z"};
const LEAFSIZE={ash:8,hawthorn:6,rowan:8,willow:7,yew:4,banyan:5,flambo:4.5,ohia:5.5,koa:7,mamane:5,oak:15,maple:15,beech:13,birch:11,liveoak:6,mangrove:9,mesquite:13,hoak:6.5,ebony:5};
LEAFP.hoak=LEAFP.liveoak;LEAFP.ebony=LEAFP.liveoak;LEAFP.ohia=LEAFP.liveoak;LEAFP.koa=LEAFP.liveoak;LEAFP.flambo=LEAFP.mesquite||LEAFP.liveoak;LEAFP.oak=LEAFP.oak||LEAFP.liveoak;LEAFP.ash=LEAFP.mesquite||LEAFP.liveoak;LEAFP.rowan=LEAFP.mesquite||LEAFP.liveoak;LEAFP.hawthorn=LEAFP.oak;LEAFP.willow=LEAFP.liveoak;LEAFP.yew=LEAFP.liveoak;LEAFP.banyan=LEAFP.liveoak;
LEAFP.mesquite=(()=>{let p='M0,-.018 L1,-.008 L1,.008 L0,.018 Z';for(let i=1;i<=10;i++){const u=i/11.5;for(const sd of[-1,1])p+=` M${u.toFixed(3)},${(sd*.01).toFixed(3)} C${(u+.02).toFixed(3)},${(sd*.12).toFixed(3)} ${(u+.06).toFixed(3)},${(sd*.2).toFixed(3)} ${(u+.1).toFixed(3)},${(sd*.21).toFixed(3)} C${(u+.08).toFixed(3)},${(sd*.13).toFixed(3)} ${(u+.05).toFixed(3)},${(sd*.05).toFixed(3)} ${(u+.035).toFixed(3)},${(sd*.01).toFixed(3)} Z`}return p})();
function drawLeaf(sp,x,y,ang,len,base,light,vein){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.scale(len,len);const p=P2(LEAFP[sp]);
  ctx.fillStyle=base;ctx.fill(p);if(light){ctx.save();ctx.clip(p);ctx.fillStyle=light;ctx.fillRect(0,-1,1.1,1);ctx.restore()}
  if(vein&&len>7){ctx.strokeStyle=vein;ctx.lineWidth=1.1/len;ctx.beginPath();ctx.moveTo(.02,0);ctx.lineTo(.9,0);ctx.stroke();
    if(sp==='beech'&&len>12){ctx.beginPath();for(let i=1;i<7;i++){const u=i/7.5;ctx.moveTo(u,0);ctx.lineTo(u+.12,-.17);ctx.moveTo(u,0);ctx.lineTo(u+.12,.17)}ctx.stroke()}}
  ctx.restore()}

/* ---------- map trees ---------- */
function drawTreeShadow(T){const m=model(T),t=m.type,R=CT_SHAPE[t]?T.h*CT_SHAPE[t].sh:t==='spruce'||t==='hemlock'?T.h*.2:t==='liveoak'?T.h*.66:t==='mangrove'?T.h*.5:t==='palm'?2.4:t==='snag'?1:t==='pine'?2.6:T.h*.32;
  ctx.fillStyle='rgba(16,40,22,.26)';ctx.beginPath();ctx.ellipse(T.x+R*M*.3,T.y+R*M*.12,R*M*.85,R*M*.38,0,0,TAU);ctx.fill()}
function drawTreeOW(T,birds,t){const m=model(T),r=rng(T.seed+11),P=m.pal,X=T.x,Y=T.y;
  switch(m.type){
    case'decid':owBroadleaf(T,m,r);break;case'mangrove':owMangrove(T,m,r);break;case'birch':owBirch(T,m,r);break;case'liveoak':owLiveOak(T,m,r);break;
    case'spruce':case'hemlock':case'cedar':owConifer(T,m,r);break;case'juniper':owJuniper(T,m,r);break;case'pinyon':owPinyon(T,m,r);break;case'mesquite':owMesquite(T,m,r);break;case'hoak':case'ebony':case'ohia':case'koa':case'mamane':case'flambo':owRoundOak(T,m,r);break;case'oak':case'beech':case'ash':case'hawthorn':case'rowan':case'willow':case'yew':owBrit(T,m,r);break;case'banyan':owBanyan(T,m,r);break;case'cypress':owCypress(T,m,r);break;case'pine':owPine(T,m,r);break;case'palm':owPalm(T,m,r);break;default:owSnag(T,m,r)}
  if(birds)for(const b of birds)drawBirdOW(b,t)}
function owTrunk(T,m,topH,w0,w1){const tp=m.tr,b=owPt(T,0,0,0),e=owPt(T,tp.top[0]*topH/tp.h,tp.top[1]*topH/tp.h,topH);
  const W0=w0*M*1.3,W1=w1*M*1.3;
  // root flare, then a two-tone trunk
  ctx.fillStyle=m.barkD;ctx.beginPath();ctx.moveTo(b[0]-W0*1.6,b[1]+1);ctx.quadraticCurveTo(b[0]-W0,b[1]-W0*.8,b[0]-W0,b[1]-W0*2);ctx.lineTo(b[0]+W0,b[1]-W0*2);ctx.quadraticCurveTo(b[0]+W0,b[1]-W0*.8,b[0]+W0*1.6,b[1]+1);ctx.fill();
  limb2(b[0],b[1],e[0],e[1],W0,W1,m.bark,m.barkD);return[b,e,W0,W1]}
function barkMarks(kind,b,e,W0,W1,r){const n=Math.max(2,Math.floor(Math.abs(b[1]-e[1])/7));
  if(kind==='birch'){ctx.fillStyle='#2b2723';for(let i=0;i<n*1.5;i++){const f=r(),x=lerp(b[0],e[0],f),y=lerp(b[1],e[1],f),w=lerp(W0,W1,f);ctx.fillRect(x-w*(.8-r()*.6),y,w*(.5+r()*.6),Math.max(.8,w*.18))}}
  else if(kind==='palm'){ctx.strokeStyle='rgba(70,52,34,.55)';ctx.lineWidth=.9;for(let i=0;i<n*1.4;i++){const f=(i+.5)/(n*1.4),x=lerp(b[0],e[0],f),y=lerp(b[1],e[1],f),w=lerp(W0,W1,f);ctx.beginPath();ctx.moveTo(x-w,y-w*.5);ctx.lineTo(x,y+w*.3);ctx.lineTo(x+w,y-w*.5);ctx.stroke()}}
  else if(kind==='pine'){ctx.fillStyle='rgba(70,40,22,.35)';for(let i=0;i<n*2;i++){const f=(i+.5)/(n*2),x=lerp(b[0],e[0],f),y=lerp(b[1],e[1],f),w=lerp(W0,W1,f),o=i%2?-w*.8:w*.05;ctx.beginPath();ctx.roundRect(x+o,y-1.2,w*.72,2.2,1);ctx.fill()}}
  else if(kind!=='beech'){ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=.8;for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(b[0]+k*W0*.45,b[1]-2);ctx.lineTo(e[0]+k*W1*.45,e[1]);ctx.stroke()}}}
function crownLayers(cx,cy,rx,ry,r,P,o){
  // shadow mass, base mass shifted up-left, light lobes, highlights, then notches of definition
  const n=o.n;fillP(lobePath(cx,cy,rx,ry,n,r,o),P[0]);
  fillP(lobePath(cx-rx*.06,cy-ry*.1,rx*.88,ry*.84,n,r,{...o,a0:undefined}),P[1]);
  // one clean light mass on the sunny upper left, a smaller highlight inside it, and a soft second light lobe
  const lx=cx-rx*.28,ly=cy-ry*.32;
  fillP(lobePath(lx,ly,rx*.5,ry*.42,o.n>11?7:6,r,{cusp:.84,lobe:1.08,amp:.08,flat:o.flat}),P[2]);
  fillP(lobePath(cx+rx*.22,cy-ry*.4,rx*.28,ry*.22,5,r,{cusp:.84,lobe:1.06,amp:.06,flat:o.flat}),P[2]);
  fillP(lobePath(lx-rx*.1,ly-ry*.12,rx*.22,ry*.17,5,r,{cusp:.84,lobe:1.05,amp:.05}),P[3])
}
function edgeLeaves(cx,cy,rx,ry,r,sp,P,n){for(let i=0;i<n;i++){const a=-PI+r()*PI,x=cx+Math.cos(a)*rx*(.95+r()*.08),y=cy+Math.sin(a)*ry*(.92+r()*.08);drawLeaf(sp,x,y,a+(r()-.5)*.6,3.2+r()*1.5,i%3?P[1]:P[2],null,null)}}
function owBroadleaf(T,m,r){const c=m.crown,P=m.pal,sp=m.sp;const top=c.h-c.rv*.2;const [b,e,W0,W1]=owTrunk(T,m,c.h-c.rv*.35,m.tr.w0,m.tr.w1*.8);barkMarks(sp,b,e,W0,W1,r);
  const cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M,ry=c.rv*HS*1.12;
  // main limbs reaching into the crown
  for(let i=0;i<3;i++){const a=-PI/2+(i-1)*.75+(r()-.5)*.3,ex=cc[0]+Math.cos(a)*rx*.5,ey=cc[1]+Math.sin(a)*ry*.35+ry*.15;limb2(e[0],e[1]+W1,ex,ey,W1*.8,W1*.3,m.bark,m.barkD)}
  if(m.bare){for(const br of m.br){const a=owPt(T,br.a[0],br.a[1],br.a[2]),q=owPt(T,br.b[0],br.b[1],br.b[2]);limb2(a[0],a[1],q[0],q[1],Math.max(1.4,br.w*M*1.6),.8,m.bark,m.barkD);for(let k=0;k<3;k++){const ang=Math.atan2(q[1]-a[1],q[0]-a[0])+(r()-.5)*1.6,L=6+r()*9;limb(q[0],q[1],q[0]+Math.cos(ang)*L,q[1]+Math.sin(ang)*L,m.barkD,.9)}}return}
  const o=sp==='oak'?{n:9,cusp:.8,lobe:1.14,amp:.2,lines:4}:sp==='maple'?{n:13,cusp:.87,lobe:1.08,amp:.08,lines:3,lights:5}:{n:10,cusp:.86,lobe:1.08,amp:.1,lines:3,peak:.15};
  crownLayers(cc[0],cc[1],rx,ry,r,P,o);
  // limbs peeking through the leaves
}
function owBirch(T,m,r){const c=m.crown,P=m.pal;const stems=[[-.25,-.05],[.3,.05],[0,.02]].slice(0,2+(T.seed%2));
  for(const [dx,lean] of stems){const b=owPt(T,dx,0,0),e=owPt(T,dx+lean*14+m.tr.top[0],m.tr.top[1],T.h*.92);limb2(b[0],b[1],e[0],e[1],m.tr.w0*M*1.1,m.tr.w1*M*.8,m.bark,m.barkD);barkMarks('birch',b,e,m.tr.w0*M*1.1,m.tr.w1*M*.8,r);
    // black chevrons where branches leave the trunk
    ctx.fillStyle='#2b2723';for(let i=0;i<2;i++){const f=.35+i*.25,x=lerp(b[0],e[0],f),y=lerp(b[1],e[1],f);ctx.beginPath();ctx.moveTo(x-3,y-3);ctx.lineTo(x,y);ctx.lineTo(x+3,y-3);ctx.lineTo(x,y-1.4);ctx.fill()}}
  const cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M*1.1,ry=c.rv*HS*1.5;
  if(m.bare){for(const br of m.br){const a=owPt(T,br.a[0],br.a[1],br.a[2]),q=owPt(T,br.b[0],br.b[1],br.b[2]);limb2(a[0],a[1],q[0],q[1],1.6,.7,m.bark,m.barkD)}return}
  const cl=[[-.62,.3,.34],[.6,.26,.34],[-.2,.38,.3],[.22,.34,.3],[-.48,-.12,.36],[.46,-.18,.36],[0,-.05,.36],[-.2,-.52,.32],[.2,-.55,.32],[0,-.85,.26]].map(([dx,dy,sz])=>[cc[0]+dx*rx,cc[1]+dy*ry,sz*1.15]);
  for(const [x,y,sz] of cl)fillP(lobePath(x,y,rx*sz,ry*sz*.6,7,r,{cusp:.84,lobe:1.1,amp:.14,peak:-.2}),P[0]);
  for(const [x,y,sz] of cl)fillP(lobePath(x-rx*sz*.06,y-ry*sz*.1,rx*sz*.84,ry*sz*.48,7,r,{cusp:.84,lobe:1.1}),P[1]);
  for(const [x,y,sz] of cl.filter((_,i)=>i%2===0))fillP(lobePath(x-rx*sz*.22,y-ry*sz*.2,rx*sz*.42,ry*sz*.25,5,r,{cusp:.82}),P[2]);
}
function owMangrove(T,m,r){const c=m.crown,P=m.pal,tp=m.tr;
  // prop roots arching from the trunk down into the water, the far ones first
  const roots=[...m.roots].sort((a,b)=>Math.sin(a.a)-Math.sin(b.a));
  for(const q of roots){const s=owPt(T,Math.cos(q.a)*.15,Math.sin(q.a)*.15,q.h),e=owPt(T,Math.cos(q.a)*q.R,Math.sin(q.a)*q.R,0),k=owPt(T,Math.cos(q.a)*q.R*.75,Math.sin(q.a)*q.R*.75,q.h*.95);
    const front=Math.sin(q.a)>0;ctx.strokeStyle=front?m.bark:m.barkD;ctx.lineWidth=front?2.2:1.8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(s[0],s[1]);ctx.quadraticCurveTo(k[0],k[1],e[0],e[1]);ctx.stroke()}
  const [b,e,W0,W1]=owTrunk(T,m,c.h-c.rv*.4,tp.w0,tp.w1);
  const cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M,ry=c.rv*HS*2.2;
  for(const s of[-1,1,0]){limb2(e[0],e[1],cc[0]+s*rx*.55,cc[1]+ry*.15,W1*.8,W1*.35,m.bark,m.barkD)}
  const masses=[[-.5,.08,.52],[.5,.1,.52],[0,-.12,.62],[-.15,.18,.46],[.25,.0,.46]];
  for(const [dx,dy,s] of masses)fillP(lobePath(cc[0]+dx*rx,cc[1]+dy*ry,rx*s,ry*s*.85,11,r,{cusp:.88,lobe:1.07,amp:.08}),P[0]);
  for(const [dx,dy,s] of masses)fillP(lobePath(cc[0]+dx*rx-rx*.03,cc[1]+dy*ry-ry*.1,rx*s*.84,ry*s*.7,11,r,{cusp:.88,lobe:1.06}),P[1]);
  for(const [dx,dy,s] of masses.slice(0,3))fillP(lobePath(cc[0]+dx*rx-rx*s*.25,cc[1]+dy*ry-ry*s*.32,rx*s*.42,ry*s*.34,7,r,{cusp:.86}),P[2]);
  // glossy highlights
  ctx.fillStyle=P[3];for(let i=0;i<10;i++){const x=cc[0]+(r()-.5)*rx*1.3,y=cc[1]-ry*(.1+r()*.45);ctx.beginPath();ctx.ellipse(x,y,2.2,1.2,-.5,0,TAU);ctx.fill()}}
function owLiveOak(T,m,r){const c=m.crown,P=m.pal;const [b,e,W0,W1]=owTrunk(T,m,c.h*.55,m.tr.w0,m.tr.w0*.75);barkMarks('liveoak',b,e,W0,W1,r);
  const cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M,ry=c.rv*HS*3.2;
  // great sinuous limbs spreading sideways
  for(const s of[-1,1,-.45,.5]){const ex=cc[0]+s*rx*.8,ey=cc[1]+ry*.2;ctx.save();limb2(e[0],e[1],lerp(e[0],ex,.5),e[1]-ry*.5,W1*.8,W1*.5,m.bark,m.barkD);limb2(lerp(e[0],ex,.5),e[1]-ry*.5,ex,ey,W1*.5,W1*.2,m.bark,m.barkD);ctx.restore()}
  // several flat-bottomed masses side by side
  const masses=[[-.55,.05,.5],[.55,.08,.5],[0,-.15,.62],[-.2,.12,.45],[.3,-.05,.45]];
  for(const [dx,dy,s] of masses)fillP(lobePath(cc[0]+dx*rx,cc[1]+dy*ry,rx*s,ry*s*.8,8,r,{cusp:.84,lobe:1.1,amp:.14,flat:.6}),P[0]);
  for(const [dx,dy,s] of masses)fillP(lobePath(cc[0]+dx*rx-rx*.03,cc[1]+dy*ry-ry*.12,rx*s*.85,ry*s*.66,8,r,{cusp:.84,lobe:1.08,flat:.55}),P[1]);
  for(const [dx,dy,s] of masses.slice(0,3))fillP(lobePath(cc[0]+dx*rx-rx*s*.25,cc[1]+dy*ry-ry*s*.35,rx*s*.4,ry*s*.34,5,r,{cusp:.82,flat:.6}),P[2]);
  // Spanish moss hanging from the undersides
  if(!WEST)for(let i=0;i<9;i++){const x=cc[0]+(r()-.5)*rx*1.6,y=cc[1]+ry*(.15+r()*.25),len=8+r()*12;mossStrand(x,y,len,2.2+r(),r)}}

/* ---------- DC1: dry-country trees on the map ---------- */
// short trunk plus any extra stems; returns nothing, the crown covers the tops
function owCTrunks(T,m,r){const tp=m.tr,b=owPt(T,0,0,0),e=owPt(T,tp.top[0],tp.top[1],tp.h),W0=tp.w0*M*1.3,W1=tp.w1*M*1.3;
  for(const [dx,dy,a] of m.stems){const sb=owPt(T,dx*.35,dy*.35,0),se=owPt(T,dx*2+tp.top[0],dy*1.4+tp.top[1],tp.h*(.9+.25*Math.abs(Math.sin(a))));limb2(sb[0],sb[1],se[0],se[1],W0*.7,W1*.7,m.bark,m.barkD)}
  ctx.fillStyle=m.barkD;ctx.beginPath();ctx.ellipse(b[0],b[1],W0*1.4,W0*.45,0,0,TAU);ctx.fill();limb2(b[0],b[1],e[0],e[1],W0,W1,m.bark,m.barkD)}
function sprayTuft(x,y,R,col,r){ctx.strokeStyle=col;ctx.lineWidth=1.3;ctx.lineCap='round';ctx.beginPath();for(let i=0;i<4;i++){const a=-PI/2+(r()-.5)*2.4;ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R*.8)}ctx.stroke()}
function needleTuft(x,y,R,c1,c2){ctx.lineCap='round';ctx.lineWidth=1.2;for(const [col,o] of[[c1,0],[c2,-.9]]){ctx.strokeStyle=col;ctx.beginPath();for(let i=0;i<7;i++){const a=-PI/2+(i/6-.5)*2.6;ctx.moveTo(x,y+o);ctx.lineTo(x+Math.cos(a)*R,y+o+Math.sin(a)*R*.8)}ctx.stroke()}}
// juniper: a dense, lumpy, blue-green crown that reaches almost to the ground, shaggy stems, frosty blue berries
function owJuniper(T,m,r){const c=m.crown,P=m.pal;owCTrunks(T,m,r);
  const cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M,ry=c.rv*HS*1.9;
  const ms=[[0,0,1],[-.48,.22,.6],[.5,.2,.58],[-.22,-.42,.55],[.26,-.4,.5],[0,.34,.6]];
  for(const [dx,dy,k] of ms)fillP(lobePath(cc[0]+dx*rx*.7,cc[1]+dy*ry*.7,rx*k*.72,ry*k*.62,12,r,{cusp:.9,lobe:1.06,amp:.12}),P[0]);
  for(const [dx,dy,k] of ms)fillP(lobePath(cc[0]+dx*rx*.7-rx*.05,cc[1]+dy*ry*.7-ry*.08,rx*k*.6,ry*k*.5,12,r,{cusp:.9,lobe:1.06,amp:.08}),P[1]);
  for(let i=0;i<22;i++){const a=-PI*.95+r()*PI*.9,k=Math.sqrt(r())*.85,x=cc[0]-rx*.12+Math.cos(a)*rx*k,y=cc[1]-ry*.15+Math.sin(a)*ry*k*.75,R=2.4+r()*2.2;fillP(lobePath(x,y,R,R*.7,7,r,{cusp:.78,lobe:1.15,amp:.3}),i%3?P[2]:P[3])}
  for(let i=0;i<8;i++){const x=cc[0]+(r()-.5)*rx*1.3,y=cc[1]+(r()-.5)*ry;dot(x,y,1,'#8ea6bf');dot(x-.3,y-.3,.4,'#e2eaf1')}}
// pinyon: a short stout trunk under a dense, round to slightly pointed crown of short needles, with a few cones
function owPinyon(T,m,r){const c=m.crown,P=m.pal;owCTrunks(T,m,r);
  const cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M,ry=c.rv*HS*1.75;
  fillP(lobePath(cc[0],cc[1],rx,ry,13,r,{cusp:.88,lobe:1.08,amp:.12,peak:.3}),P[0]);
  fillP(lobePath(cc[0]-rx*.06,cc[1]-ry*.1,rx*.86,ry*.8,13,r,{cusp:.88,lobe:1.07,amp:.1,peak:.3}),P[1]);
  for(let i=0;i<22;i++){const a=r()*TAU,k=Math.sqrt(r())*.82,x=cc[0]+Math.cos(a)*rx*k,y=cc[1]+Math.sin(a)*ry*k*.85,up=y<cc[1]-ry*.1||x<cc[0]-rx*.3;needleTuft(x,y,3+r()*2,up?P[2]:P[1],up?P[3]:P[2])}
  for(let i=0;i<4;i++)ell(cc[0]+(r()-.5)*rx*1.2,cc[1]+(r()-.2)*ry*.6,1.6,1.25,'#8a5a34')}
// honey mesquite: crooked dark stems leaning out, zigzag limbs, a wide airy crown of feathery leaves with sky showing through
function owMesquite(T,m,r){const c=m.crown,P=m.pal,tp=m.tr,W0=tp.w0*M*1.5,cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M,ry=c.rv*HS*2.6;
  for(const [dx,dy,a] of[[0,0,-PI/2],...m.stems]){const s0=owPt(T,dx*.3,dy*.3,0),lean=dx?Math.cos(a):(r()-.5)*.4;
    const k1=[s0[0]+lean*rx*.22+(r()-.5)*4,s0[1]-tp.h*HS*.6],k2=[s0[0]+lean*rx*.5+(r()-.5)*6,cc[1]+ry*.18];
    limb2(s0[0],s0[1],k1[0],k1[1],W0,W0*.75,m.bark,m.barkD);limb2(k1[0],k1[1],k2[0],k2[1],W0*.75,W0*.42,m.bark,m.barkD);
    for(let i=0;i<3;i++){const ex=k2[0]+(r()-.5)*rx*.95,ey=cc[1]-ry*(.05+r()*.35);limb2(k2[0],k2[1],ex,ey,W0*.4,.6,m.bark,m.barkD)}}
  if(m.bare)return;
  const ms=[[-.42,.1,.52],[.42,.12,.52],[0,-.12,.62],[-.15,.2,.4]];
  ctx.globalAlpha=.85;for(const [dx,dy,k] of ms)fillP(lobePath(cc[0]+dx*rx,cc[1]+dy*ry,rx*k,ry*k*.8,16,r,{cusp:.72,lobe:1.14,amp:.3,flat:.6}),P[0]);
  for(const [dx,dy,k] of ms)fillP(lobePath(cc[0]+dx*rx-rx*.04,cc[1]+dy*ry-ry*.12,rx*k*.82,ry*k*.62,16,r,{cusp:.72,lobe:1.12,amp:.28,flat:.6}),P[1]);ctx.globalAlpha=1;
  const sp=[];for(let i=0;i<40;i++){const a=r()*TAU,k=Math.sqrt(r()),x=cc[0]+Math.cos(a)*rx*k*.95,y=cc[1]-ry*.15+Math.sin(a)*ry*k*.6;sp.push([x,y,(x<cc[0]?PI:0)+(x<cc[0]?-1:1)*(.3+r()*.6),3.5+r()*2.5])}
  for(const [x,y,a,L] of sp)frond(x,y,a,L,y<cc[1]-ry*.2?P[2]:P[1]);
  for(let i=0;i<12;i++){const q=sp[(r()*sp.length)|0];frond(q[0]-1,q[1]-1.5,q[2]+(r()-.5)*.5,q[3]*.7,P[3])}
  if(SEASON==='summer'||SEASON==='fall'){ctx.strokeStyle='#d6bf73';ctx.lineWidth=1.3;ctx.lineCap='round';for(let i=0;i<6;i++){const x=cc[0]+(r()-.5)*rx*1.2,y=cc[1]+r()*ry*.4;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+2,y+3,x+1,y+7);ctx.stroke()}}}
// plateau live oak / gray oak and Texas ebony: rounded, dark, moss-free crowns on short trunks
// British trees (B-T1..T7). Drawn by owBrit; deciduous ones go bare in winter
const BR_BARE=new Set(['oak','beech','ash','hawthorn','rowan','willow']);
Object.assign(CT_SHAPE,{
  oak:{th:.3,rh:.62,rv:.3,ch:.6,w0:.5,w1:.3,stems:1,br:9,bw:.17,nc:46,cr:.17,kind:'leaf',sh:.6,hmin:13,hvar:5},
  beech:{th:.36,rh:.5,rv:.4,ch:.62,w0:.42,w1:.24,stems:1,br:8,bw:.13,nc:46,cr:.18,kind:'leaf',sh:.6,hmin:16,hvar:6},
  ash:{th:.42,rh:.46,rv:.32,ch:.66,w0:.32,w1:.16,stems:1,br:7,bw:.1,nc:26,cr:.17,kind:'leaf',sh:.4,hmin:13,hvar:6},
  hawthorn:{th:.24,rh:.46,rv:.32,ch:.56,w0:.16,w1:.08,stems:2,br:6,bw:.06,nc:28,cr:.2,kind:'leaf',sh:.45,hmin:4,hvar:2.5},
  rowan:{th:.36,rh:.32,rv:.34,ch:.62,w0:.15,w1:.07,stems:2,br:6,bw:.06,nc:22,cr:.2,kind:'leaf',sh:.36,hmin:5,hvar:3},
  willow:{th:.3,rh:.52,rv:.34,ch:.58,w0:.36,w1:.2,stems:2,br:8,bw:.1,nc:36,cr:.19,kind:'leaf',sh:.5,hmin:8,hvar:4},
  yew:{th:.16,rh:.5,rv:.42,ch:.5,w0:.5,w1:.26,stems:2,br:6,bw:.12,nc:44,cr:.26,kind:'needle',sh:.55,hmin:6,hvar:4}});
Object.assign(LEAF,{oak:[['#2f4f26','#45692f','#628a3f','#8aab58'],['#34502a','#4b6c34','#698c45','#93ad60']],beech:[['#355a26','#4f7a30','#73a040','#a6c868']],
  ash:[['#3f5f2e','#57793a','#78984a','#a2bb6c']],hawthorn:[['#2f5428','#456f33','#62904a','#f4f1e6']],rowan:[['#355a2c','#4e7838','#6e9a48','#d23a2a']],
  willow:[['#5a7050','#748a62','#93a87a','#b8c89c']],yew:[['#142a1c','#1f3a26','#2f5032','#46683f']]});
Object.assign(BARK,{oak:BARK.oak||['#6a5a4b','#4b3f35'],ash:['#8a8a80','#62625a'],hawthorn:['#5f554b','#3f3730'],rowan:['#7a7468','#55504a'],willow:['#7a6f60','#544b40'],yew:['#8a4a32','#5e3122']});
Object.assign(FALLPAL,{ash:[['#6a6a24','#8e8c2e','#b4ae44','#d6cc6a']],hawthorn:[['#5e3a1e','#86522a','#a8703a','#c23a2a']],rowan:[['#7a2a1a','#a83a22','#d0582e','#e83a2a']],willow:[['#6a6a30','#8e8a3e','#b0a854','#cfc67a']]});
Object.assign(TREE_R,{oak:10,beech:9,ash:8,hawthorn:4,rowan:4,willow:7,yew:6});
function owBrit(T,m,r){const c=m.crown,P=m.pal,tp=m.type;owCTrunks(T,m,r);
  const cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M,ry=c.rv*HS*2.4;
  if(m.bare){// winter: the branching shows: limbs out from the trunk, finer twigs at the ends
    for(const B of m.br){const a=owPt(T,B.a[0],B.a[1],B.a[2]),e=owPt(T,B.b[0],B.b[1],B.b[2]);limb2(a[0],a[1],e[0],e[1],Math.max(1,B.w*M*1.2),.8,m.bark,m.barkD);
      ctx.strokeStyle=shadeHex(m.barkD,.1);ctx.lineWidth=.7;ctx.beginPath();for(let i=0;i<5;i++){const an=Math.atan2(e[1]-a[1],e[0]-a[0])+(r()-.5)*1.6,L=6+r()*10;ctx.moveTo(e[0],e[1]);ctx.lineTo(e[0]+Math.cos(an)*L,e[1]+Math.sin(an)*L)}ctx.stroke()}
    if(tp==='hawthorn'||tp==='rowan')for(let i=0;i<6;i++)dot(cc[0]+(r()-.5)*rx,cc[1]+(r()-.5)*ry,1.2,'#a82a22');return}
  for(const s of[-1,1]){const e=owPt(T,m.tr.top[0],m.tr.top[1],m.tr.h);limb2(e[0],e[1],cc[0]+s*rx*.55,cc[1]+ry*.1,m.tr.w1*M,1,m.bark,m.barkD)}
  const ms=tp==='oak'?[[-.55,.08,.46],[.55,.06,.48],[0,-.2,.58],[-.28,.16,.44],[.3,-.02,.44],[-.1,.25,.38]]:tp==='beech'?[[0,-.1,.72],[-.45,.12,.5],[.45,.1,.52]]:
    tp==='ash'?[[-.5,.1,.36],[.5,.05,.38],[0,-.25,.4],[-.2,.2,.3],[.25,-.05,.32],[.05,.1,.28]]:tp==='willow'?[[-.4,.1,.55],[.4,.1,.55],[0,-.15,.6]]:
    tp==='yew'?[[0,0,.82],[-.4,.16,.55],[.42,.14,.55]]:[[-.35,.08,.55],[.35,.06,.55],[0,-.2,.6]];
  const gap=tp==='ash'?{cusp:.7,lobe:1.18,amp:.2,flat:.7}:tp==='oak'?{cusp:.78,lobe:1.14,amp:.18,flat:.72}:{cusp:.86,lobe:1.08,amp:.12,flat:.7};
  for(const [dx,dy,k] of ms)fillP(lobePath(cc[0]+dx*rx,cc[1]+dy*ry,rx*k,ry*k*.8,tp==='yew'?12:9,r,gap),P[0]);
  for(const [dx,dy,k] of ms)fillP(lobePath(cc[0]+dx*rx-rx*.03,cc[1]+dy*ry-ry*.1,rx*k*.82,ry*k*.64,9,r,{...gap,flat:.65}),P[1]);
  for(const [dx,dy,k] of ms.slice(0,3))fillP(lobePath(cc[0]+dx*rx-rx*k*.25,cc[1]+dy*ry-ry*k*.33,rx*k*.4,ry*k*.32,6,r,{cusp:.84,flat:.6}),P[2]);
  if(tp==='willow'){ctx.strokeStyle=P[3];ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<16;i++){const fx=cc[0]+(r()-.5)*rx*1.6,fy=cc[1]-ry*.2+(r()-.5)*ry*.8;ctx.moveTo(fx,fy);ctx.quadraticCurveTo(fx+2,fy+8,fx+1,fy+14)}ctx.stroke()}
  if(tp==='hawthorn'&&SEASON==='spring')for(let i=0;i<34;i++)dot(cc[0]+(r()-.5)*rx*1.6,cc[1]-ry*(r()*.6)+(r()-.5)*ry*.5,1.7,P[3]);
  if(tp==='hawthorn'&&SEASON==='fall')for(let i=0;i<20;i++)dot(cc[0]+(r()-.5)*rx*1.5,cc[1]-ry*(r()*.5)+(r()-.5)*ry*.5,1.4,'#b02a22');
  if(tp==='rowan'&&(SEASON==='summer'||SEASON==='fall'))for(let i=0;i<7;i++){const fx=cc[0]+(r()-.5)*rx*1.4,fy=cc[1]-ry*(r()*.5);for(let q=0;q<5;q++)dot(fx+(r()-.5)*4,fy+(r()-.5)*3,1.3,P[3])}
  if(tp==='yew'&&r()<.4)for(let i=0;i<8;i++)dot(cc[0]+(r()-.5)*rx*1.3,cc[1]+(r()-.5)*ry,1,'#d0302a')}
function owRoundOak(T,m,r){const c=m.crown,P=m.pal,eb=m.type==='ebony';owCTrunks(T,m,r);
  const cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M,ry=c.rv*HS*(eb?2.1:2.4);
  if(!eb)for(const s of[-1,1]){const e=owPt(T,m.tr.top[0],m.tr.top[1],m.tr.h);limb2(e[0],e[1],cc[0]+s*rx*.6,cc[1]+ry*.15,m.tr.w1*M,1,m.bark,m.barkD)}
  const ms=eb?[[0,0,.8],[-.42,.12,.55],[.42,.1,.55],[0,-.32,.5]]:[[-.5,.06,.5],[.5,.08,.5],[0,-.15,.62],[-.2,.15,.46],[.28,-.04,.46]];
  for(const [dx,dy,k] of ms)fillP(lobePath(cc[0]+dx*rx,cc[1]+dy*ry,rx*k,ry*k*.8,eb?11:9,r,{cusp:.86,lobe:1.08,amp:.12,flat:.7}),P[0]);
  for(const [dx,dy,k] of ms)fillP(lobePath(cc[0]+dx*rx-rx*.03,cc[1]+dy*ry-ry*.1,rx*k*.84,ry*k*.66,eb?11:9,r,{cusp:.86,lobe:1.07,flat:.65}),P[1]);
  for(const [dx,dy,k] of ms.slice(0,3))fillP(lobePath(cc[0]+dx*rx-rx*k*.25,cc[1]+dy*ry-ry*k*.33,rx*k*.4,ry*k*.32,6,r,{cusp:.84,flat:.6}),P[2]);
  if(m.type==='flambo'){const fl=SEASON==='summer'||SEASON==='spring'?26:8;for(let i=0;i<fl;i++){const fx=cc[0]+(r()-.5)*rx*1.7,fy=cc[1]-ry*(r()*.7)+(r()-.5)*ry*.5;dot(fx,fy,2.3,P[3]);dot(fx-.7,fy-.7,1,'#ffb060')}return}
  if(m.type==='ohia'||m.type==='mamane'){const fl=m.type==='ohia'?6+Math.floor(r()*8):SEASON==='winter'||SEASON==='spring'?12:3;for(let i=0;i<fl;i++){const fx=cc[0]+(r()-.5)*rx*1.5,fy=cc[1]-ry*(r()*.6)+(r()-.5)*ry*.5;dot(fx,fy,m.type==='ohia'?2.1:1.7,P[3]);dot(fx-.6,fy-.6,.9,m.type==='ohia'?'#f07a5a':'#fbe48a')}return}
  for(let i=0;i<8;i++)drawLeaf('liveoak',cc[0]-rx*.2+(r()-.5)*rx*1.1,cc[1]-ry*(.2+r()*.35),-PI/2+(r()-.5)*2,3.5,P[3],null,null)}
function mossStrand(x,y,len,w,r){ctx.fillStyle='#a9b293';ctx.beginPath();ctx.moveTo(x-w,y);ctx.quadraticCurveTo(x-w*.6+(r()-.5)*2,y+len*.6,x+(r()-.5)*2,y+len);ctx.quadraticCurveTo(x+w*.5,y+len*.5,x+w,y);ctx.fill();
  ctx.fillStyle='#8f9a7a';ctx.beginPath();ctx.moveTo(x+w*.1,y);ctx.quadraticCurveTo(x+w*.3,y+len*.5,x+(r()-.5),y+len*.85);ctx.quadraticCurveTo(x+w*.7,y+len*.45,x+w,y);ctx.fill()}
function owConifer(T,m,r){const P=m.pal,H=m.tr.h,hem=m.type==='hemlock',b=owPt(T,0,0,0),R=m.cone.r*M,hb=m.cone.hb;
  limb2(b[0],b[1],b[0],b[1]-hb*HS-6,m.tr.w0*M*1.3,m.tr.w0*M*1,m.bark,m.barkD);
  const N=hem?8:9;for(let k=0;k<N;k++){const f=k/N,yb=b[1]-(hb+(H-hb)*f*.92)*HS,yt=yb-(H-hb)/N*HS*2.1,w=R*(1-f*.9)+2,tx=b[0]+m.tr.top[0]*M*f;
    const teeth=hem?7:5+Math.floor((1-f)*4),droop=hem?w*.22:w*.08;
    const tier=new Path2D();tier.moveTo(tx,yt);tier.quadraticCurveTo(tx-w*.35,yb-(yb-yt)*.5,tx-w,yb+droop);
    for(let i=1;i<=teeth*2;i++){const u=i/(teeth*2),x=tx-w+u*w*2,dip=Math.sin(u*PI)*(hem?-droop*.6:0),yy=yb+(i%2?-(yb-yt)*.16:droop*(1-Math.abs(u-.5)*1.6))+dip;tier.lineTo(x,i===teeth*2?yb+droop:yy)}
    tier.quadraticCurveTo(tx+w*.35,yb-(yb-yt)*.5,tx,yt);tier.closePath();
    fillP(tier,P[k%2?0:1]);ctx.save();ctx.clip(tier);ctx.fillStyle=P[k%2?1:2];ctx.beginPath();ctx.moveTo(tx-w*1.2,yt-5);ctx.lineTo(tx+w*.05,yt-5);ctx.lineTo(tx-w*.15,yb+10);ctx.lineTo(tx-w*1.2,yb+10);ctx.fill();
    ctx.fillStyle=P[0];ctx.fillRect(tx-w-2,yb-(yb-yt)*.08,w*2+4,30);ctx.restore()}
  // leader: straight on spruce, nodding on hemlock
  const tx=b[0]+m.tr.top[0]*M,ty=b[1]-H*HS;ctx.strokeStyle=P[1];ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tx,ty+6);if(hem)ctx.quadraticCurveTo(tx+1,ty-6,tx+6,ty-3);else ctx.lineTo(tx,ty-7);ctx.stroke()}
function owCypress(T,m,r){const P=m.pal,tp=m.tr,b=owPt(T,0,0,0),e=owPt(T,tp.top[0],tp.top[1],tp.h),W0=tp.w0*M*1.3,W1=tp.w1*M*1.3;
  // fluted buttress flaring out at the waterline, then the straight grey-brown trunk
  ctx.fillStyle=m.barkD;ctx.beginPath();ctx.moveTo(b[0]-W0*2.3,b[1]+1);ctx.quadraticCurveTo(b[0]-W0*.9,b[1]-W0*.6,b[0]-W0*.7,b[1]-W0*3.2);ctx.lineTo(b[0]+W0*.7,b[1]-W0*3.2);ctx.quadraticCurveTo(b[0]+W0*.9,b[1]-W0*.6,b[0]+W0*2.3,b[1]+1);ctx.fill();
  ctx.fillStyle=m.bark;ctx.beginPath();ctx.moveTo(b[0]-W0*2.1,b[1]);ctx.quadraticCurveTo(b[0]-W0*.8,b[1]-W0*.6,b[0]-W0*.6,b[1]-W0*3.2);ctx.lineTo(b[0]-W0*.05,b[1]-W0*3.2);ctx.lineTo(b[0]-W0*.3,b[1]);ctx.fill();
  limb2(b[0],b[1]-W0*3,e[0],e[1],W0*.7,W1,m.bark,m.barkD);
  ctx.strokeStyle='rgba(60,40,28,.35)';ctx.lineWidth=.9;for(const k of[-.4,.1,.5]){ctx.beginPath();ctx.moveTo(b[0]+k*W0*2,b[1]-1);ctx.quadraticCurveTo(b[0]+k*W0*.8,b[1]-W0*2,b[0]+k*W0*.5,b[1]-W0*4);ctx.stroke()}
  const cl=m.cl.filter(c=>c.kind==='needle');
  for(const br of m.br){const a=owPt(T,br.a[0],br.a[1],br.a[2]),q=owPt(T,br.b[0],br.b[1],br.b[2]);limb2(a[0],a[1],q[0],q[1],2,1,m.bark,m.barkD)}
  // flat, layered pads of soft feathery foliage
  const pads=cl.map(c=>{const p=owPt(T,c.x,c.y,c.h);return[p[0],p[1],c.r*M*1.6]}).sort((a,b)=>b[1]-a[1]);
  for(const [x,y,R] of pads)fillP(lobePath(x,y,R,R*.55,9,r,{cusp:.86,lobe:1.1,amp:.14,flat:.35}),P[0]);
  for(const [x,y,R] of pads)fillP(lobePath(x-R*.08,y-R*.14,R*.82,R*.4,9,r,{cusp:.86,lobe:1.08,amp:.12,flat:.35}),P[1]);
  for(const [x,y,R] of pads.filter((_,i)=>i%2===0))fillP(lobePath(x-R*.25,y-R*.2,R*.42,R*.15,6,r,{cusp:.86,flat:.4}),P[2]);
  for(const s of m.moss){const p=owPt(T,s.x,s.y,s.h);mossStrand(p[0],p[1],s.len*HS*1.4,2,r)}}
function owPine(T,m,r){const P=m.pal,[b,e,W0,W1]=owTrunk(T,m,m.tr.h,m.tr.w0,m.tr.w1);barkMarks('pine',b,e,W0,W1,r);
  const tufts=m.cl.filter(c=>c.kind==='needle');
  for(const c of tufts){const p=owPt(T,c.x,c.y,c.h);if(Math.hypot(c.x,c.y)>.4){const q=owPt(T,c.x*.15,c.y*.15,c.h-.4);limb2(q[0],q[1],p[0],p[1],2,1,m.bark,m.barkD)}}
  const cand=!(CENTRAL&&(WEST||BRI||T.x<16000));for(const c of tufts){const p=owPt(T,c.x,c.y,c.h);needleBurst(p[0],p[1],c.r*M*1.05,r,P,cand)}}
function needleBurst(x,y,R,r,P,cand=true){ctx.lineCap='round';for(let layer=0;layer<3;layer++){ctx.strokeStyle=P[layer];ctx.lineWidth=1.5;ctx.beginPath();const n=22-layer*5,rr=R*(1-layer*.16);
    for(let i=0;i<n;i++){const a=-PI/2+(i/(n-1)-.5)*PI*1.6+(r()-.5)*.12,l=rr*(.7+r()*.35);ctx.moveTo(x-layer*.6,y-layer);ctx.quadraticCurveTo(x+Math.cos(a)*l*.5-layer*.6,y+Math.sin(a)*l*.5-2-layer,x+Math.cos(a)*l-layer*.6,y+Math.sin(a)*l*.8+l*.12-layer)}ctx.stroke()}
  if(cand){ctx.fillStyle='#ece6d2';ctx.beginPath();ctx.ellipse(x-1,y-3,1.3,2.6,0,0,TAU);ctx.fill()}}
function owPalm(T,m,r){if(T.v==='royal')return owRoyalPalm(T,m,r);const P=m.pal,tp=m.tr,b=owPt(T,0,0,0),e=owPt(T,tp.top[0],tp.top[1],tp.h),fan=T.v==='fan';
  // slightly curved booted trunk
  ctx.save();const W=tp.w0*M*1.3*(fan?.6:1);ctx.fillStyle=m.barkD;ctx.beginPath();ctx.moveTo(b[0]-W,b[1]);ctx.quadraticCurveTo(b[0]-W+(e[0]-b[0])*.2,(b[1]+e[1])/2,e[0]-W*.9,e[1]);ctx.lineTo(e[0]+W*.9,e[1]);ctx.quadraticCurveTo(b[0]+W+(e[0]-b[0])*.2,(b[1]+e[1])/2,b[0]+W,b[1]);ctx.fill();
  ctx.fillStyle=m.bark;ctx.beginPath();ctx.moveTo(b[0]-W,b[1]);ctx.quadraticCurveTo(b[0]-W+(e[0]-b[0])*.2,(b[1]+e[1])/2,e[0]-W*.9,e[1]);ctx.lineTo(e[0],e[1]);ctx.lineTo(b[0],b[1]);ctx.fill();ctx.restore();
  barkMarks('palm',b,e,W,W*.9,r);
  // dead fronds hanging in a skirt under the crown
  if(fan){ctx.fillStyle='#9a8358';ctx.beginPath();ctx.ellipse(e[0],e[1]+9,9,12,0,0,TAU);ctx.fill();ctx.strokeStyle='#7a6646';ctx.lineWidth=.8;ctx.beginPath();for(let i=-3;i<=3;i++){ctx.moveTo(e[0]+i*2.4,e[1]);ctx.lineTo(e[0]+i*3,e[1]+20)}ctx.stroke()}
  else if(TROP){for(let i=0;i<3;i++)dot(e[0]+(i-1)*3.2,e[1]+3+(i&1),2.3,'#6b4a2a')}else for(let i=0;i<4;i++){const a=PI*.25+i*PI*.17;fanLeaf(e[0],e[1]+4,a+(r()-.5)*.2,18,.7,'#a08a5c','#86714a',r)}
  const fr=m.cl.filter(c=>c.kind==='frond').sort((a,b)=>a.up-b.up);
  for(const c of fr){const a=Math.atan2(Math.sin(c.a)*.55-(c.up-.35)*1.4,Math.cos(c.a));fanLeaf(e[0],e[1],a,(26+c.up*7)*(fan?.62:1),1,c.up>.55?P[2]:c.up>.3?P[1]:P[0],c.up>.55?P[1]:P[0],r)}
  dot(e[0],e[1],2.5,P[0])}
// TC5 royal palm: a smooth pale trunk with a slight bulge, a bright green crownshaft, long arching feather fronds
function owRoyalPalm(T,m,r){const tp=m.tr,b=owPt(T,0,0,0),e=owPt(T,tp.top[0]*.3,tp.top[1]*.3,tp.h),W=tp.w0*M*1.5;
  ctx.fillStyle='#a9a59a';ctx.beginPath();ctx.moveTo(b[0]-W,b[1]);ctx.quadraticCurveTo(b[0]-W*1.25,(b[1]*.6+e[1]*.4),e[0]-W*.75,e[1]);ctx.lineTo(e[0]+W*.75,e[1]);ctx.quadraticCurveTo(b[0]+W*1.25,(b[1]*.6+e[1]*.4),b[0]+W,b[1]);ctx.fill();
  ctx.fillStyle='#cfccc2';ctx.beginPath();ctx.moveTo(b[0]-W,b[1]);ctx.quadraticCurveTo(b[0]-W*1.25,(b[1]*.6+e[1]*.4),e[0]-W*.75,e[1]);ctx.lineTo(e[0],e[1]);ctx.lineTo(b[0],b[1]);ctx.fill();
  ctx.strokeStyle='rgba(90,85,75,.35)';ctx.lineWidth=.7;ctx.beginPath();for(let f=.08;f<1;f+=.09){const y=lerp(b[1],e[1],f),x=lerp(b[0],e[0],f),w=lerp(W,W*.75,f)*1.05;ctx.moveTo(x-w,y);ctx.lineTo(x+w,y)}ctx.stroke();
  const cs=[e[0],e[1]-18];ctx.fillStyle='#5f9a3a';ctx.beginPath();ctx.moveTo(e[0]-W*.8,e[1]);ctx.lineTo(cs[0]-W*.6,cs[1]);ctx.lineTo(cs[0]+W*.6,cs[1]);ctx.lineTo(e[0]+W*.8,e[1]);ctx.fill();ctx.fillStyle='#7fb84e';ctx.fillRect(e[0]-W*.6,cs[1],W*.4,18);
  const P=m.pal,N=11;for(let i=0;i<N;i++){const a=-PI/2+(i/(N-1)-.5)*3.9+(r()-.5)*.2,L=30+r()*8,ex=cs[0]+Math.cos(a)*L,ey=cs[1]+Math.sin(a)*L*.55+L*.42,mx=cs[0]+Math.cos(a)*L*.5,my=cs[1]+Math.sin(a)*L*.4-10;
    const col=i%2?P[1]:P[2];ctx.strokeStyle=P[0];ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(cs[0],cs[1]);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=1.1;ctx.beginPath();
    for(let q=1;q<12;q++){const u=q/12,px=(1-u)*(1-u)*cs[0]+2*(1-u)*u*mx+u*u*ex,py=(1-u)*(1-u)*cs[1]+2*(1-u)*u*my+u*u*ey,l=(1-u*.6)*5;ctx.moveTo(px,py);ctx.lineTo(px-Math.sin(a)*l*.5,py+l);ctx.moveTo(px,py);ctx.lineTo(px+Math.sin(a)*l*.5+1,py+l*.9)}ctx.stroke()}}
// TP1 banyan: several trunks and a curtain of aerial roots under one huge crown
function owBanyan(T,m,r){const c=m.crown,cc=owPt(T,c.x,c.y,c.h),rx=c.rx*M,b=owPt(T,0,0,0);
  ctx.fillStyle='rgba(20,40,20,.18)';ctx.beginPath();ctx.ellipse(b[0]+rx*.15,b[1]+4,rx*.95,rx*.42,0,0,TAU);ctx.fill();
  for(let i=0;i<10;i++){const ox=(r()-.5)*rx*1.1,oy=(r()-.5)*rx*.35,w=3+r()*5;limb2(b[0]+ox,b[1]+oy,b[0]+ox*.7,cc[1]+12,w,w*.7,m.bark,m.barkD)}
  ctx.strokeStyle='rgba(110,98,84,.75)';for(let i=0;i<90;i++){const ox=(r()-.5)*rx*1.6,oy=(r()-.5)*rx*.4;ctx.lineWidth=.6+r()*1.2;ctx.beginPath();ctx.moveTo(b[0]+ox,cc[1]+10+r()*20);ctx.lineTo(b[0]+ox+(r()-.5)*3,b[1]+oy-r()*20*(r()<.5?1:0));ctx.stroke()}
  owRoundOak(T,m,r);const P=m.pal;for(let i=0;i<14;i++){const ox=(r()-.5)*rx*1.7,oy=(r()-.5)*rx*.45;fillP(lobePath(cc[0]+ox,cc[1]+oy-10,rx*.24,rx*.16,9,r,{cusp:.86,lobe:1.08,amp:.12,flat:.7}),i%3?P[1]:P[0])}
  for(let i=0;i<10;i++){const ox=(r()-.5)*rx*1.4,oy=(r()-.5)*rx*.35;fillP(lobePath(cc[0]+ox-4,cc[1]+oy-18,rx*.12,rx*.08,7,r,{cusp:.84,flat:.6}),P[2])}}
// a palmetto fan: stalk, then a pleated fan with split tips
function fanLeaf(x,y,a,L,spread,col,dark,r){const sx=x+Math.cos(a)*L*.4,sy=y+Math.sin(a)*L*.4;ctx.strokeStyle=dark;ctx.lineWidth=Math.max(1,L*.06);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(sx,sy);ctx.stroke();
  const n=9,half=.7*spread;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(sx,sy);for(let i=0;i<=n*2;i++){const u=i/(n*2),aa=a-half+u*half*2,l=L*(i%2?.62:.78)*(1-Math.abs(u-.5)*.35);ctx.lineTo(sx+Math.cos(aa)*l,sy+Math.sin(aa)*l*.75)}ctx.closePath();ctx.fill();
  ctx.strokeStyle=dark;ctx.lineWidth=.7;ctx.beginPath();for(let i=1;i<n;i++){const aa=a-half+i/n*half*2;ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(aa)*L*.55,sy+Math.sin(aa)*L*.55*.75)}ctx.stroke()}
function owSnag(T,m,r){const tp=m.tr,[b,e,W0,W1]=owTrunk(T,m,tp.h,tp.w0,tp.w1);
  // peeled bark patches, broken top, stubs, bracket fungus, feeding holes
  ctx.fillStyle='#c9c1b2';for(let i=0;i<4;i++){const f=.15+r()*.7,x=lerp(b[0],e[0],f),y=lerp(b[1],e[1],f),w=lerp(W0,W1,f);ctx.beginPath();ctx.ellipse(x-w*.3,y,w*.35,4+r()*5,0,0,TAU);ctx.fill()}
  ctx.fillStyle=m.bark;ctx.beginPath();ctx.moveTo(e[0]-W1,e[1]);ctx.lineTo(e[0]-W1*.7,e[1]-9);ctx.lineTo(e[0]-W1*.1,e[1]-4);ctx.lineTo(e[0]+W1*.4,e[1]-11);ctx.lineTo(e[0]+W1,e[1]-3);ctx.lineTo(e[0]+W1,e[1]);ctx.fill();
  for(const br of m.br){const a=owPt(T,br.a[0],br.a[1],br.a[2]),q=owPt(T,lerp(br.a[0],br.b[0],.6),lerp(br.a[1],br.b[1],.6),lerp(br.a[2],br.b[2],.6));limb2(a[0],a[1],q[0],q[1],2.2,1,m.bark,m.barkD)}
  ctx.fillStyle='#c79a5a';for(let i=0;i<2;i++){const f=.25+i*.2,x=lerp(b[0],e[0],f)+W0*.7,y=lerp(b[1],e[1],f);ctx.beginPath();ctx.ellipse(x,y,5,2,0,PI,TAU);ctx.fill();ctx.fillStyle='#a87a40'}
  for(const h of m.holes){if(Math.sin(h.a)<0)continue;const f=h.h/tp.h,x=lerp(b[0],e[0],f)+Math.cos(h.a)*W0*.4,y=lerp(b[1],e[1],f),rr=Math.max(1.4,h.w*M*.9);drawHole(x,y,rr,rr*1.12)}}

/* ---------- map bushes and ground cover ---------- */
function drawDecor(d,t){const x=d.x,y=d.y,s=.75+d.s*.5,r=rng((d.x*7+d.y*13)|0);
  switch(d.k){
    case'laurel':{const P=['#2c4a2a','#3f6436','#5d8a49'];fillP(lobePath(x,y-7*s,12*s,8*s,7,r,{cusp:.86,flat:.4}),P[0]);fillP(lobePath(x-1,y-9*s,10*s,6*s,7,r,{cusp:.86,flat:.4}),P[1]);
      for(let i=0;i<7;i++)drawLeaf('beech',x+(r()-.5)*16*s,y-(6+r()*7)*s,-PI/2+(r()-.5)*2,5*s,P[2],null,null);
      for(let i=0;i<4;i++){const fx=x+(r()-.5)*15*s,fy=y-(8+r()*6)*s;for(let k=0;k<5;k++)dot(fx+Math.cos(k*1.26)*1.1,fy+Math.sin(k*1.26)*.9,.8,'#f5d3dc');dot(fx,fy,.45,'#c2577a')}break}
    case'fern':{for(let i=0;i<6;i++){const a=-PI/2+(i-2.5)*.42,L=(11+r()*4)*s;frond(x,y,a,L,i%2?'#4f8a3a':'#6aa24a')}break}
    case'grass':{for(let i=0;i<7;i++){const a=-PI/2+(i-3)*.18,L=(6+r()*4)*s;blade(x+(i-3)*.9,y,a,L,1.6,i%2?'#7fa64a':'#98bd5c')}break}
    case'blueberry':{const P=['#3e5a35','#55753f','#79984f'];for(let i=0;i<5;i++){const a=-PI/2+(i-2)*.45;limb(x,y,x+Math.cos(a)*5*s,y+Math.sin(a)*5*s,'#7a5444',.6)}
      for(let i=0;i<22;i++){const a=-PI/2+(r()-.5)*2.2,d=r()*8*s;drawLeaf('liveoak',x+Math.cos(a)*d,y-2+Math.sin(a)*d*.7,a,3.6*s,P[i%3],null,null)}
      for(let i=0;i<4;i++){const bx=x+(r()-.5)*11*s,by=y-(2+r()*5)*s;dot(bx,by,1,'#3d4f8f');dot(bx-.3,by-.3,.35,'#8f9cd0')}break}
    case'palmetto':{for(let i=0;i<5;i++){const a=-PI/2+(i-2)*.5;fanLeaf(x,y,a,(13+r()*3)*s,.8,i%2?'#5e8d3f':'#76a24b','#3f6a34',r)}break}
    case'dgrass':{for(let i=0;i<8;i++){const a=-PI/2+(i-3.5)*.16+Math.sin(t*1.6+x*.02)*.08,L=(11+r()*5)*s;blade(x+(i-3.5)*1.1,y,a,L,1.5,i%2?'#9aa357':'#b3b86a')}
      for(let i=0;i<2;i++){const a=-PI/2+(i-.5)*.3+Math.sin(t*1.6+x*.02)*.08,L=16*s;ctx.fillStyle='#d8c89a';ctx.beginPath();ctx.ellipse(x+Math.cos(a)*L,y+Math.sin(a)*L,1.2,3.6,a+PI/2,0,TAU);ctx.fill()}break}
    case'shell':{ctx.save();ctx.translate(x,y);ctx.rotate(d.s*6);ctx.fillStyle='#f4ece0';ctx.beginPath();ctx.moveTo(0,1.5);for(let i=0;i<=8;i++){const a=PI+i/8*PI;ctx.lineTo(Math.cos(a)*3.2,Math.sin(a)*3+1.5)}ctx.fill();
      ctx.strokeStyle='#d9b9a0';ctx.lineWidth=.5;ctx.beginPath();for(let i=1;i<6;i++){const a=PI+i/6*PI;ctx.moveTo(0,1.5);ctx.lineTo(Math.cos(a)*3,Math.sin(a)*2.8+1.5)}ctx.stroke();ctx.restore();break}
    case'drift':{ctx.save();ctx.translate(x,y);ctx.rotate(-.12+d.s*.3);ctx.fillStyle='#b9ad99';ctx.beginPath();ctx.roundRect(-11,-2,22,4,2);ctx.fill();ctx.fillStyle='#d6ccba';ctx.fillRect(-10,-2,20,1.4);
      ctx.strokeStyle='#9c8f7b';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(-8,.5);ctx.lineTo(7,.8);ctx.stroke();taper(4,-1,9,-6,1.3,.6,'#b9ad99');ctx.restore();break}
    case'mound':{ctx.fillStyle='#c9d6e2';ctx.beginPath();ctx.ellipse(x+2,y-1,15*s,5.5*s,0,0,TAU);ctx.fill();ctx.fillStyle='#f3f7fa';ctx.beginPath();ctx.ellipse(x,y-3,14*s,5*s,0,PI,TAU);ctx.lineTo(x+14*s,y-1);ctx.quadraticCurveTo(x,y+1,x-14*s,y-2);ctx.fill();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(x-4*s,y-5*s,6*s,2*s,0,0,TAU);ctx.fill();break}
    case'rock':{const k=s*1.1;ctx.fillStyle='#6f6e6a';ctx.beginPath();ctx.moveTo(x-11*k,y);ctx.lineTo(x-8*k,y-7*k);ctx.lineTo(x-1*k,y-11*k);ctx.lineTo(x+8*k,y-8*k);ctx.lineTo(x+12*k,y-1*k);ctx.lineTo(x+7*k,y+2);ctx.closePath();ctx.fill();
      ctx.fillStyle='#9a9993';ctx.beginPath();ctx.moveTo(x-8*k,y-7*k);ctx.lineTo(x-1*k,y-11*k);ctx.lineTo(x+8*k,y-8*k);ctx.lineTo(x+1*k,y-5*k);ctx.closePath();ctx.fill();
      ctx.fillStyle='#84837e';ctx.beginPath();ctx.moveTo(x-11*k,y);ctx.lineTo(x-8*k,y-7*k);ctx.lineTo(x+1*k,y-5*k);ctx.lineTo(x-1*k,y+1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#7f9a5a';ctx.beginPath();ctx.ellipse(x-3*k,y-8*k,3*k,1.2*k,-.3,0,TAU);ctx.fill();break}
    default:drawDecor2Fast(d,t)}}
function blade(x,y,a,L,w,col){const ex=x+Math.cos(a)*L,ey=y+Math.sin(a)*L,mx=x+Math.cos(a+.15)*L*.5,my=y+Math.sin(a+.15)*L*.5;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.quadraticCurveTo(mx+w,my,x+w/2,y);ctx.fill()}
function frond(x,y,a,L,col){ctx.strokeStyle=col;ctx.lineWidth=Math.max(.8,L*.05);ctx.lineCap='round';const ex=x+Math.cos(a)*L,ey=y+Math.sin(a)*L*.85,cx=x+Math.cos(a)*L*.55,cy=y+Math.sin(a)*L*.55-L*.15;
  ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(cx,cy,ex,ey);ctx.stroke();ctx.fillStyle=col;
  for(let i=1;i<9;i++){const u=i/9,px=(1-u)*(1-u)*x+2*(1-u)*u*cx+u*u*ex,py=(1-u)*(1-u)*y+2*(1-u)*u*cy+u*u*ey,l=L*.28*(1-u*.8),tg=Math.atan2(ey-y,ex-x);for(const s of[-1,1]){ctx.beginPath();ctx.ellipse(px+Math.cos(tg+s*1.1)*l*.5,py+Math.sin(tg+s*1.1)*l*.5,l*.5,l*.18,tg+s*1.1,0,TAU);ctx.fill()}}}

/* ---------- binoculars: foliage sprays built from real leaf shapes ---------- */
const LEAFSPR=new Map(),SPR=380;
function leafSprite(m,kind,v){const sp=kind==='needle'?(m.type==='pine'||m.type==='pinyon'?'pineN':m.type==='hemlock'?'hemlockN':m.type==='cypress'?'cypressN':m.type==='cedar'||m.type==='juniper'?'cedarN':'spruceN'):m.sp,key=sp+v+m.pal[0]+m.pal[3];let s=LEAFSPR.get(key);if(s)return s;
  const c=document.createElement('canvas');c.width=c.height=SPR;const g=c.getContext('2d'),prev=ctx;ctx=g;const r=rng(v*7919+sp.length*131+sp.charCodeAt(0)),P=m.pal,C=SPR/2;
  try{
    if(sp==='spruceN'||sp==='hemlockN'||sp==='cedarN'||sp==='cypressN'){const hem=sp==='hemlockN'||sp==='cypressN';
      for(let pass=0;pass<2;pass++)for(let i=0;i<12;i++){const a=PI*(1.05+r()*.9)+(pass?0:.1),L=SPR*(.22+r()*.22),x0=C+(r()-.5)*SPR*.18,y0=C+(r()-.5)*SPR*.14;
        const ex=x0+Math.cos(a)*L,ey=y0+Math.sin(a)*L*.35+L*(hem?.28:.1);needleSpray(x0,y0,ex,ey,hem,pass?P[1+(i%2)]:P[0],pass?P[3]:P[1],r);
        if(pass&&r()<.6){const f=.4+r()*.3,bx=lerp(x0,ex,f),by=lerp(y0,ey,f),b2=a+(r()<.5?-.6:.6);needleSpray(bx,by,bx+Math.cos(b2)*L*.4,by+Math.sin(b2)*L*.2+L*.08,hem,P[2],P[3],r)}}}
    else if(sp==='pineN'){for(let i=0;i<4;i++){const x=C+(r()-.5)*SPR*.35,y=C+(r()-.5)*SPR*.25;g.strokeStyle='#6b4a32';g.lineWidth=4;g.beginPath();g.moveTo(C,C+SPR*.3);g.lineTo(x,y+12);g.stroke();
        for(let layer=0;layer<3;layer++){g.strokeStyle=P[layer];g.lineWidth=2.2;g.lineCap='round';g.beginPath();const n=34-layer*6;for(let k=0;k<n;k++){const a=-PI/2+(k/(n-1)-.5)*PI*1.7+(r()-.5)*.1,l=SPR*(.2+r()*.1)*(1-layer*.12);g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*l*.5,y+Math.sin(a)*l*.5-6,x+Math.cos(a)*l,y+Math.sin(a)*l*.85+l*.1)}g.stroke()}
        g.fillStyle='#ece6d2';g.beginPath();g.ellipse(x,y-6,4,9,0,0,TAU);g.fill()}}
    else{ // broadleaf: twigs radiating, leaves alternating along them
      const L=LEAFSIZE[sp]*(sp==='liveoak'?2.4:2.2),twigs=sp==='liveoak'?11:sp==='birch'||sp==='beech'?11:8;
      const sprays=[];for(let i=0;i<twigs;i++){const a=-PI/2+(r()-.5)*PI*1.9,len=SPR*(.26+r()*.18),x0=C+(r()-.5)*SPR*.12,y0=C+SPR*.1+(r()-.5)*SPR*.1;sprays.push({a,len,x0,y0,back:r()<.4})}
      for(const back of[true,false])for(const s of sprays){if(s.back!==back)continue;const ex=s.x0+Math.cos(s.a)*s.len,ey=s.y0+Math.sin(s.a)*s.len;
        g.strokeStyle=m.barkD||'#5a4a3c';g.lineWidth=2.2;g.beginPath();g.moveTo(s.x0,s.y0);g.lineTo(ex,ey);g.stroke();
        const n=Math.floor(s.len/(L*.42));for(let k=1;k<=n;k++){const f=k/(n+.4),px=lerp(s.x0,ex,f),py=lerp(s.y0,ey,f),side=k%2?1:-1,la=s.a+side*(.7+r()*.35)+(r()-.5)*.2;
          const up=py<C;const base=back?P[0]:up?P[2]:P[1],light=back?P[1]:up?P[3]:P[2];drawLeaf(sp,px,py,la,L*(.8+r()*.35)*(1-f*.15),base,light,back?null:P[0])}
        drawLeaf(sp,ex,ey,s.a,L*.9,back?P[0]:P[1],back?null:P[2],back?null:P[0])}}
  }finally{ctx=prev}
  const a=g.getImageData(0,0,SPR,SPR).data,Q=SPR/4,al=new Uint8Array(Q*Q);for(let j=0;j<Q;j++)for(let i=0;i<Q;i++)al[j*Q+i]=a[((j*4+2)*SPR+(i*4+2))*4+3];
  s={c,al,Q};LEAFSPR.set(key,s);return s}
// one conifer twig with needles: stiff all round for spruce, flat two-ranked for hemlock
function needleSpray(x0,y0,ex,ey,hem,col,tip,r){const g=ctx,n=hem?24:20,dx=ex-x0,dy=ey-y0,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l;
  g.strokeStyle=hem?'#6b4f3a':'#5d4535';g.lineWidth=1.6;g.lineCap='round';g.beginPath();g.moveTo(x0,y0);g.lineTo(ex,ey);g.stroke();
  for(let i=0;i<n;i++){const f=(i+.5)/n,px=x0+dx*f,py=y0+dy*f,nl=(hem?8:11)*(1-f*.45)*(.85+r()*.3),fw=hem?.55:.75;
    for(const s of[-1,1]){const ax=-uy*s*.62+ux*fw,ay=ux*s*.62+uy*fw,al=Math.hypot(ax,ay);g.strokeStyle=f>.8?tip:col;g.lineWidth=hem?2.4:1.8;g.beginPath();g.moveTo(px,py);g.lineTo(px+ax/al*nl,py+ay/al*nl);g.stroke()}
    if(!hem&&i%3===0){g.strokeStyle=col;g.lineWidth=1.6;g.beginPath();g.moveTo(px,py);g.lineTo(px+ux*nl*.7,py+uy*nl*.7-nl*.45);g.stroke()}}
  g.strokeStyle=tip;g.lineWidth=hem?2.4:1.8;g.beginPath();g.moveTo(ex,ey);g.lineTo(ex+ux*6,ey+uy*6);g.stroke()}
function clumpBox(T,c){const p=bproj(T.x+c.x*M,T.y+c.y*M,c.h);if(!p)return null;const m=model(T),R=c.r*p.s*1.15,ry=c.kind==='needle'?(m.type==='pine'?.85:.78):.95;return{p,R,ry,flip:c.s%2?-1:1,sp:leafSprite(m,c.kind,c.s%3)}}
function binoClump(T,m,c,lod,t){const p=bproj(T.x+c.x*M,T.y+c.y*M,c.h);if(!p)return;const R=c.r*p.s;if(p.x+R*2<0||p.x-R*2>VW||p.y+R*2<0||p.y-R*2>VH)return;
  const P=m.pal,dist=p.d;
  if(c.kind==='frond'){const len=c.r*1.3*p.s,lat=Math.cos(c.a)*BV.rx+Math.sin(c.a)*BV.ry,a=Math.atan2(-(c.up-.35)*1.3,lat||.01);
    const cx=bproj(T.x+m.tr.top[0]*M,T.y+m.tr.top[1]*M,m.tr.h);const ox=cx?cx.x:p.x,oy=cx?cx.y:p.y;
    fanLeaf(ox,oy,a,len,1.05,hazeCol(hex(c.up>.55?P[2]:c.up>.3?P[1]:P[0]),dist),hazeCol(hex(P[0]),dist+30),rng(c.s));return}
  if(lod===0&&R<5){ctx.fillStyle=hazeCol(hex(P[0]),dist);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.5,R),0,TAU);ctx.fill();return}
  const b=clumpBox(T,c);if(!b)return;if(!BV.fading)BV.drawn.push({b});ctx.save();ctx.translate(b.p.x,b.p.y);ctx.scale(b.flip,1);ctx.drawImage(b.sp.c,-b.R,-b.R*b.ry,b.R*2,b.R*2*b.ry);ctx.restore()}
// trunk: two flat tones, root flare, species bark
function binoTrunk(T,m,dist){const tr=m.tr,b=bproj(T.x,T.y,0),tp=bproj(T.x+tr.top[0]*M,T.y+tr.top[1]*M,tr.h);if(!b||!tp)return;
  const w0=tr.w0*b.s,w1=Math.max(.6,tr.w1*tp.s);BV.drawn.push({t:[b.x,b.y,tp.x,tp.y,w0,w1]});
  const light=hazeCol(hex(m.bark),dist),dark=hazeCol(hex(m.barkD),dist);
  if(w0>2){ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(b.x-w0*1.7,b.y+w0*.15);ctx.quadraticCurveTo(b.x-w0,b.y-w0*.4,b.x-w0,b.y-w0*1.6);ctx.lineTo(b.x+w0,b.y-w0*1.6);ctx.quadraticCurveTo(b.x+w0,b.y-w0*.4,b.x+w0*1.7,b.y+w0*.15);ctx.fill()}
  limb2(b.x,b.y,tp.x,tp.y,w0,w1,light,dark);
  const seg=f=>[lerp(b.x,tp.x,f),lerp(b.y,tp.y,f),lerp(w0,w1,f)];const r=rng(T.seed+5);
  if(w0>3){
    if(tr.kind==='birch'){ctx.fillStyle='#2b2723';for(let i=0;i<30;i++){const f=r(),[x,y,w]=seg(f);ctx.fillRect(x-w*(.85-r()*.7),y,w*(.25+r()*.45),Math.max(1,w*.09))}}
    else if(tr.kind==='palm'){ctx.strokeStyle='rgba(70,52,34,.5)';ctx.lineWidth=Math.max(1,w0*.09);for(let i=0;i<26;i++){const f=(i+.5)/26,[x,y,w]=seg(f);ctx.beginPath();ctx.moveTo(x-w,y-w*.4);ctx.lineTo(x,y+w*.35);ctx.lineTo(x+w,y-w*.4);ctx.stroke()}}
    else if(tr.kind==='pine'){ctx.fillStyle='rgba(70,40,22,.32)';for(let i=0;i<46;i++){const f=r(),[x,y,w]=seg(f),bw=w*(.35+r()*.4);ctx.beginPath();ctx.roundRect(x-w+r()*(w*2-bw),y,bw,w*(.25+r()*.2),w*.06);ctx.fill()}}
    else if(m.sp==='beech'){ctx.fillStyle='rgba(60,60,55,.35)';for(let i=0;i<6;i++){const f=r()*.8,[x,y,w]=seg(f);ctx.beginPath();ctx.ellipse(x+(r()-.5)*w,y,w*.18,w*.06,0,0,TAU);ctx.fill()}}
    else{ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=Math.max(.8,w0*.07);for(let k=-3;k<=3;k++){ctx.beginPath();const o=k/3.5;ctx.moveTo(b.x+o*w0,b.y);for(let i=1;i<=6;i++){const f=i/6,[x,y,w]=seg(f);ctx.lineTo(x+o*w+Math.sin(i*2.1+k)*w*.06,y)}ctx.stroke()}}
    if(tr.kind==='snag'){ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(tp.x-w1,tp.y);ctx.lineTo(tp.x-w1*.6,tp.y-w1*3);ctx.lineTo(tp.x-w1*.1,tp.y-w1*1.2);ctx.lineTo(tp.x+w1*.4,tp.y-w1*2.4);ctx.lineTo(tp.x+w1,tp.y-w1*.6);ctx.lineTo(tp.x+w1,tp.y);ctx.fill();
      ctx.fillStyle='#c79a5a';for(let i=0;i<2;i++){const [x,y,w]=seg(.2+i*.12);ctx.beginPath();ctx.ellipse(x+w*.85,y,w*.5,w*.16,0,PI,TAU);ctx.fill()}}
    for(const h of m.holes){const v=[(BV.E.x-T.x),(BV.E.y-T.y)],vl=Math.hypot(v[0],v[1])||1,dt=(Math.cos(h.a)*v[0]+Math.sin(h.a)*v[1])/vl;if(dt<.25)continue;
      const lat=Math.cos(h.a)*BV.rx+Math.sin(h.a)*BV.ry,[x,y,w]=seg(h.h/tr.h),hw=h.w*b.s*(.4+.6*dt),hh=h.hh*b.s;
      const rw=Math.max(.8,h.w*.5*b.s*(.45+.55*dt));drawHole(x+lat*w*.8,y-h.hh*.5*b.s,rw,h.hh*.5*b.s)}}}
// shrubs and grass in the binoculars
function drawShrubBino(d,t){const p=bproj(d.x,d.y,0);if(!p)return;const s=p.s,x=p.x,y=p.y,r=rng((d.x*7+d.y*13)|0);
  if(DEC2.has(d.k)){const k=s/10;if(k*40<1.5)return;ctx.save();ctx.translate(x,y);ctx.scale(k,k);drawDecor2(d,t,0,0);ctx.restore();return}
  if(d.k==='dgrass'||d.k==='grass'){const n=d.k==='dgrass'?11:9;for(let i=0;i<n;i++){const a=-PI/2+(i-n/2)*.13+Math.sin(t*1.5+i+d.x)*.05,L=(d.k==='dgrass'?.7:.4)*(.7+r()*.5)*s;blade(x+(i-n/2)*.04*s,y,a,L,Math.max(1,.025*s),i%2?'#9aa357':'#b6bb6c')}
    if(d.k==='dgrass')for(let i=0;i<2;i++){const a=-PI/2+(i-.5)*.25,L=.85*s;ctx.fillStyle='#d8c89a';ctx.beginPath();ctx.ellipse(x+Math.cos(a)*L,y+Math.sin(a)*L,.02*s,.08*s,a+PI/2,0,TAU);ctx.fill()}return}
  if(d.k==='drift'){ctx.fillStyle='#b9ad99';ctx.beginPath();ctx.roundRect(x-.6*s,y-.12*s,1.2*s,.12*s,.05*s);ctx.fill();ctx.fillStyle='#d6ccba';ctx.fillRect(x-.55*s,y-.12*s,1.1*s,.04*s);return}
  if(d.k==='rock'){ctx.fillStyle='#6f6e6a';ctx.beginPath();ctx.moveTo(x-.6*s,y);ctx.lineTo(x-.35*s,y-.35*s);ctx.lineTo(x+.1*s,y-.5*s);ctx.lineTo(x+.55*s,y-.25*s);ctx.lineTo(x+.65*s,y);ctx.fill();ctx.fillStyle='#9a9993';ctx.beginPath();ctx.moveTo(x-.35*s,y-.35*s);ctx.lineTo(x+.1*s,y-.5*s);ctx.lineTo(x+.2*s,y-.25*s);ctx.fill();return}
  if(d.k==='palmetto'){for(let i=0;i<6;i++){const a=-PI/2+(i-2.5)*.42;fanLeaf(x,y,a,.9*s,.8,i%2?'#5e8d3f':'#76a24b','#3f6a34',r)}return}
  if(d.k==='fern'){for(let i=0;i<7;i++){const a=-PI/2+(i-3)*.38;frond(x,y,a,(.55+r()*.15)*s,i%2?'#4f8a3a':'#6aa24a')}return}
  const h=d.k==='laurel'?1.5:.7,P=d.k==='laurel'?['#2c4a2a','#3f6436','#5d8a49','#86ad66']:['#3e5a35','#55753f','#79984f','#9cb86a'];
  fillP(lobePath(x,y-h*.5*s,h*.75*s,h*.5*s,8,r,{cusp:.86,flat:.3}),P[0]);
  const lf=d.k==='laurel'?'beech':'liveoak',ls=(d.k==='laurel'?.13:.06)*s;
  for(let i=0;i<(d.k==='laurel'?26:30);i++){const a=-PI*.95+r()*PI*.9,k=Math.sqrt(r()),lx=x+Math.cos(a)*h*.72*s*k,ly=y-h*.45*s+Math.sin(a)*h*.5*s*k;drawLeaf(lf,lx,ly,a+(r()-.5)*.8,ls*(.8+r()*.4),ly<y-h*.6*s?P[2]:P[1],ly<y-h*.6*s?P[3]:P[2],ls>7?P[0]:null)}
  if(d.k==='laurel')for(let i=0;i<7;i++){const fx=x+(r()-.5)*h*1.1*s,fy=y-h*(.55+r()*.4)*s,fr=.035*s;for(let k=0;k<6;k++){const a=k/6*TAU;dot(fx+Math.cos(a)*fr*1.6,fy+Math.sin(a)*fr*1.3,Math.max(.8,fr),'#f6d9e0')}dot(fx,fy,Math.max(.5,fr*.5),'#c2577a')}
  if(d.k==='blueberry')for(let i=0;i<8;i++){const bx=x+(r()-.5)*h*s,by=y-h*(.3+r()*.4)*s;dot(bx,by,Math.max(.8,.025*s),'#3d4f8f');dot(bx-.008*s,by-.008*s,Math.max(.3,.008*s),'#9aa6d6')}}

/* ---------- habitat ground cover and street furniture ----------
   Same flat, clean style as the birds and trees. Each is drawn at map scale around (ox,oy);
   the binoculars reuse the same drawing, scaled to true size (10 map px ≈ 1 m). */
const DEC2=new Set(['heather','gorse','bracken','bluebell','foxglove','thrift','cotton','hedgeflower','sheep','cow','drywall','stone','chalkhorse','phonebox','postbox','bandstand','plumeria','hibiscus','ti','bougain','coffee','treefern','naupaka','taro','silversword','saguaro','joshua','hoodoo','crag','ledge','ocotillo','cholla','barrel','agave','soapweed','boulder','sage','creosote','cattail','reed','lily','cordgrass','tallgrass','flowers','shrub','yucca','pear','knee','heath','lamp','bench','hydrant','bin','fountain','umbrella']);
const DEC2_NAME={heather:'Heather',gorse:'Gorse',bracken:'Bracken',bluebell:'Bluebells',foxglove:'Foxglove',thrift:'Thrift (sea pink)',cotton:'Bog cotton',hedgeflower:'Hedgerow flowers',sheep:'Sheep',cow:'Cattle',drywall:'Dry-stone wall',stone:'Standing stone',chalkhorse:'Chalk horse',phonebox:'Telephone box',postbox:'Post box',bandstand:'Bandstand',plumeria:'Plumeria',hibiscus:'Hibiscus',ti:'Ti plant',bougain:'Bougainvillea',coffee:'Shade coffee',treefern:'Hāpuʻu tree fern',naupaka:'Beach naupaka',taro:'Taro (kalo)',silversword:'Silversword',saguaro:'Saguaro',joshua:'Joshua tree',hoodoo:'Hoodoos',crag:'Granite crag',ledge:'Rimrock ledge',ocotillo:'Ocotillo',cholla:'Tree cholla',barrel:'Fishhook barrel cactus',agave:'Lechuguilla',soapweed:'Soapweed yucca',boulder:'Sandstone boulders',sage:'Big sagebrush',creosote:'Creosote bush',cattail:'Cattails',reed:'Common reed',lily:'Water lilies',cordgrass:'Smooth cordgrass',tallgrass:'Tall grass',flowers:'Goldenrod & asters',shrub:'Dogwood & sumac thicket',
  yucca:'Yucca',pear:'Prickly pear',knee:'Cypress knees',heath:'Alpine cushion plants',lamp:'Street lamp',bench:'Park bench',hydrant:'Fire hydrant',bin:'Litter bin',fountain:'Park fountain',umbrella:'Beach umbrella'};
if(PAC)DEC2_NAME.crag='Lava rock';if(CAR){DEC2_NAME.crag='Limestone rock';DEC2_NAME.naupaka='Sea grape';DEC2_NAME.saguaro='Column cactus';DEC2_NAME.agave='Agave';DEC2_NAME.pear='Prickly pear'}
const DEC2_BLOCK={bandstand:40,stone:6,phonebox:5,fountain:36,lamp:3,hydrant:3,bin:4};
const DEC2_K={heather:1.3,gorse:1.4,bracken:1.3,bluebell:1.5,foxglove:1.3,thrift:1.2,cotton:1.2,hedgeflower:1.2,sheep:1.5,cow:1.6,drywall:1.4,stone:1.8,chalkhorse:4,phonebox:1.3,postbox:1.3,bandstand:1.6,plumeria:1.6,hibiscus:1.35,ti:1.3,bougain:1.4,coffee:1.3,treefern:1.9,naupaka:1.35,taro:1.3,silversword:1.25,saguaro:1.85,joshua:1.9,hoodoo:1.5,crag:1.5,ledge:1.4,ocotillo:1.15,cholla:1.35,barrel:1.5,agave:1.3,soapweed:1.3,boulder:1.2,sage:1.35,creosote:1.45,cattail:1.3,reed:1.2,cordgrass:1.45,tallgrass:1.4,flowers:1.25,shrub:1.7,yucca:1.4,pear:1.35,heath:1.3,knee:1.2};
function drawDecor2(d,t,ox=d.x,oy=d.y){const kk=DEC2_K[d.k];if(kk){ctx.save();ctx.translate(ox,oy);ctx.scale(kk,kk);ctx.translate(-ox,-oy);drawDecor2b(d,t,ox,oy);ctx.restore()}else drawDecor2b(d,t,ox,oy)}
// map drawing goes through small cached sprites (four variants per plant), so dense marsh and grassland stay fast
const D2SPR=new Map();
function drawDecor2Fast(d,t){if(d.k==='fountain'){drawDecor2(d,t);return}const v=((d.x*7+d.y*13)|0)&3,sv=Math.min(3,Math.floor(d.s*4)),key=d.k+v+'_'+sv;let sp=D2SPR.get(key);
  if(!sp){const W=96,H=110,K=Math.min(2,(devicePixelRatio||1)*1.25),c=document.createElement('canvas');c.width=W*K;c.height=H*K;const g=c.getContext('2d'),prev=ctx;ctx=g;g.scale(K,K);
    try{drawDecor2({k:d.k,x:v*97+11,y:v*61+5,s:(sv+.5)/4},0,W/2,H-24)}finally{ctx=prev}sp={c,ox:-W/2,oy:-(H-24),W,H};D2SPR.set(key,sp)}
  ctx.drawImage(sp.c,d.x+sp.ox,d.y+sp.oy,sp.W,sp.H)}
function drawDecor2b(d,t,ox,oy){const x=ox,y=oy,s=.75+d.s*.5,r=rng((d.x*7+d.y*13)|0),sway=Math.sin(t*1.4+d.x*.02)*.06;
  switch(d.k){
    case'cattail':{for(let i=0;i<8;i++){const a=-PI/2+(i-3.5)*.12+sway,L=(14+r()*7)*s;blade(x+(i-3.5)*1.2,y,a,L,1.9,i%2?'#5c7c37':'#7e9b46')}
      for(let i=0;i<3;i++){const bx=x+(i-1)*3.4+(r()-.5),h=(18+r()*5)*s,tx=bx+sway*h;limb(bx,y,tx,y-h,'#6d873c',.8);
        ctx.fillStyle='#6a4327';ctx.beginPath();ctx.roundRect(tx-1.5,y-h+1,3,6.5*s,1.5);ctx.fill();ctx.fillStyle='#8c5c37';ctx.fillRect(tx-1.5,y-h+1.8,1.1,5*s);limb(tx,y-h+1,tx,y-h-3,'#6d873c',.6)}break}
    case'reed':{for(let i=0;i<9;i++){const a=-PI/2+(i-4)*.08+sway,L=(20+r()*8)*s;blade(x+(i-4)*1.1,y,a,L,1.4,i%2?'#7c9149':'#97a95a')}
      for(let i=0;i<3;i++){const a=-PI/2+(i-1)*.12+sway,L=(27+r()*5)*s,px=x+Math.cos(a)*L,py=y+Math.sin(a)*L;limb(x+(i-1)*1.4,y,px,py,'#8e9b5a',.7);
        ctx.fillStyle='#b19a85';ctx.beginPath();ctx.ellipse(px+1,py+2,2.2,5,.3+sway,0,TAU);ctx.fill();ctx.fillStyle='#cdb9a3';ctx.beginPath();ctx.ellipse(px,py+1,1,3.5,.3+sway,0,TAU);ctx.fill()}break}
    case'lily':{for(let i=0;i<3;i++){const px=x+(r()-.5)*16,py=y+(r()-.5)*7,R=(3.4+r()*2.2)*s,a=r()*TAU;
        ctx.fillStyle=i%2?'#5c8d3e':'#78a84b';ctx.beginPath();ctx.moveTo(px,py);ctx.ellipse(px,py,R,R*.55,0,a+.3,a-.3+TAU);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.ellipse(px-R*.3,py-R*.18,R*.4,R*.18,0,0,TAU);ctx.fill()}
      if(d.s>.55){const fx=x+3,fy=y-1;for(let k=0;k<7;k++){const a=k/7*TAU;ell(fx+Math.cos(a)*1.6,fy+Math.sin(a)*.9-1,1.4,.8,d.s>.8?'#f2c7d6':'#fbfaf3',a)}dot(fx,fy-1,.9,'#f0c43a')}break}
    case'cordgrass':{for(let i=0;i<12;i++){const a=-PI/2+(i-5.5)*.1+sway,L=(8+r()*5)*s;blade(x+(i-5.5)*1.1,y,a,L,1.6,i%3===0?'#c9c06c':i%2?'#6f8f3e':'#89a24c')}break}
    case'tallgrass':{for(let i=0;i<10;i++){const a=-PI/2+(i-4.5)*.12+sway,L=(11+r()*6)*s;blade(x+(i-4.5)*1.1,y,a,L,1.7,i%3===0?'#c9bd6e':i%2?'#8c9a4a':'#a6aa58')}
      for(let i=0;i<3;i++){const a=-PI/2+(i-1)*.18+sway,L=(16+r()*3)*s;ctx.fillStyle='#cdb27a';ctx.beginPath();ctx.ellipse(x+Math.cos(a)*L,y+Math.sin(a)*L,1,3.2,a+PI/2,0,TAU);ctx.fill()}break}
    case'flowers':{for(let i=0;i<7;i++){const a=-PI/2+(i-3)*.15+sway,L=(9+r()*5)*s;blade(x+(i-3)*1.1,y,a,L,1.5,i%2?'#7f9c49':'#99b257')}
      if(d.s<.5){for(let k=0;k<3;k++){const bx=x+(k-1)*4,h=(14+r()*4)*s;limb(bx,y,bx+sway*h,y-h,'#6e8a3e',.8);ctx.fillStyle='#e9b92c';ctx.beginPath();ctx.ellipse(bx+sway*h+1,y-h-1,2.4,4.5,.4,0,TAU);ctx.fill();ctx.fillStyle='#f6d75a';ctx.beginPath();ctx.ellipse(bx+sway*h,y-h-2,1.2,2.8,.4,0,TAU);ctx.fill()}}
      else for(let k=0;k<5;k++){const fx=x+(r()-.5)*12,fy=y-(8+r()*6)*s;for(let p=0;p<6;p++){const a=p/6*TAU;dot(fx+Math.cos(a)*1.5,fy+Math.sin(a)*1.5,.9,'#9c84c9')}dot(fx,fy,.7,'#f0c43a')}break}
    case'creosote':{const n=9,H=(15+r()*5)*s,st=[];ctx.fillStyle='rgba(70,48,24,.16)';ctx.beginPath();ctx.ellipse(x+4,y+1,10*s,3*s,0,0,TAU);ctx.fill();
      for(let i=0;i<n;i++){const a=-PI/2+(i/(n-1)-.5)*1.5+(r()-.5)*.15,L=H*(.75+r()*.3),ex=x+Math.cos(a)*L,ey=y+Math.sin(a)*L*.95;st.push([ex,ey]);limb(x+(i-n/2)*.35,y,ex,ey,'#6e5e4c',.55)}
      for(const [ex,ey] of st)for(let k=0;k<7;k++){const f=.45+k*.08;ell(lerp(x,ex,f)+(r()-.5)*2.4,lerp(y,ey,f)+(r()-.5)*2,1.5,1.1,k%3?'#55692f':'#71883d',r())}
      if(SEASON==='spring'||SEASON==='summer')for(let k=0;k<5;k++){const q=st[(r()*n)|0];dot(q[0]+(r()-.5)*2,q[1]+(r()-.5)*2,.9,'#f2cf3a')}break}
    case'heather':{// a low cushion of heather: dark green-brown, purple spikes in late summer
      const bl=SEASON==='summer'?1:SEASON==='fall'?.4:0;ctx.fillStyle='rgba(40,30,30,.16)';ctx.beginPath();ctx.ellipse(x+2,y+1,11*s,3*s,0,0,TAU);ctx.fill();
      for(let i=0;i<9;i++){ctx.fillStyle=['#4a4038','#5a4a40','#4f5a3a'][i%3];ctx.beginPath();ctx.ellipse(x+(r()-.5)*16*s,y-3*s-r()*5*s,4*s,2.6*s,0,0,TAU);ctx.fill()}
      if(bl)for(let i=0;i<7;i++){const fx=x+(r()-.5)*16*s,fy=y-4*s-r()*7*s;ctx.fillStyle=r()<.5?'#8a5a86':'#a37a9e';ctx.globalAlpha=bl;ctx.fillRect(fx,fy-2.5*s,1.4*s,3*s);ctx.globalAlpha=1}
      else if(SEASON==='winter')for(let i=0;i<6;i++)dot(x+(r()-.5)*14*s,y-4*s-r()*5*s,1.2*s,'#7a5a48');break}
    case'gorse':{// a spiny dark-green bush, covered in yellow flowers in spring, a few the rest of the year
      ctx.fillStyle='rgba(40,40,20,.18)';ctx.beginPath();ctx.ellipse(x+3,y+1,13*s,3.4*s,0,0,TAU);ctx.fill();
      for(let i=0;i<10;i++){ctx.fillStyle=['#2f4a26','#3f5a2c','#25401f'][i%3];ctx.beginPath();ctx.ellipse(x+(r()-.5)*20*s,y-4*s-r()*11*s,5*s,4*s,r()*PI,0,TAU);ctx.fill()}
      ctx.strokeStyle='#4f6a3a';ctx.lineWidth=.6;ctx.beginPath();for(let i=0;i<16;i++){const fx=x+(r()-.5)*20*s,fy=y-4*s-r()*12*s;ctx.moveTo(fx,fy);ctx.lineTo(fx+(r()-.5)*4,fy-2*s)}ctx.stroke();
      const n=SEASON==='spring'?30:SEASON==='winter'?4:9;for(let i=0;i<n;i++)dot(x+(r()-.5)*20*s,y-5*s-r()*12*s,1.4*s,i%3?'#f2c81e':'#f8de4a');break}
    case'bracken':{// fronds of bracken: green in spring and summer, rust in fall and winter
      const cols=SEASON==='fall'||SEASON==='winter'?['#a8622e','#8a4e26','#c27a3a']:SEASON==='spring'?['#6f9a3a','#8ab64a','#5a8030']:['#4f7a2e','#62903a','#3f6a28'];
      for(let i=0;i<5;i++){const a=-PI/2+(i/4-.5)*1.9,L=(10+r()*5)*s,ex=x+Math.cos(a)*L,ey=y+Math.sin(a)*L*.8;ctx.strokeStyle=cols[i%3];ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.cos(a)*L*.4,y-L*.7,ex,ey);ctx.stroke();
        ctx.lineWidth=1.4;ctx.beginPath();for(let q=2;q<8;q++){const u=q/8,px=x+(ex-x)*u,py=y+(ey-y)*u-Math.sin(u*PI)*3*s,l=(1-u)*4*s;ctx.moveTo(px,py);ctx.lineTo(px-Math.sin(a)*l,py+Math.cos(a)*l*.5+l*.3);ctx.moveTo(px,py);ctx.lineTo(px+Math.sin(a)*l,py-Math.cos(a)*l*.5+l*.3)}ctx.stroke()}break}
    case'bluebell':{// in spring a carpet of nodding blue bells; the rest of the year a few strap leaves
      for(let i=0;i<6;i++){const a=-PI/2+(r()-.5)*1.4;limb(x+(r()-.5)*8*s,y,x+Math.cos(a)*8*s,y+Math.sin(a)*6*s,'#3f6a2e',1.2)}
      if(SEASON==='spring')for(let k=0;k<9;k++){const sx=x+(r()-.5)*22*s,sy=y-1*s;ctx.strokeStyle='#4f6a3a';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+1,sy-9*s,sx+4*s,sy-11*s);ctx.stroke();
        for(let q=0;q<4;q++)dot(sx+1*s+q*1*s,sy-4*s-q*2*s,1.3*s,q%2?'#5a5ad2':'#6f6ae6')}break}
    case'foxglove':{// a tall spike of pink-purple bells in summer
      for(let i=0;i<5;i++){ctx.fillStyle='#3f6a32';ctx.beginPath();ctx.ellipse(x+(r()-.5)*10*s,y-1.5*s,4.5*s,1.8*s,r(),0,TAU);ctx.fill()}
      if(SEASON==='summer'||SEASON==='spring'){limb(x,y,x,y-24*s,'#4f6a3a',1.2);for(let q=0;q<9;q++){const by=y-8*s-q*1.8*s;dot(x+(q%2?1.6:-1.6)*s,by,1.6*s*(1-q*.05),SEASON==='spring'&&q>4?'#6f8a4a':'#b04a9a')}}break}
    case'thrift':{// sea pink: a cushion of grassy leaves with pink pompom flowers
      ctx.fillStyle='#4f6a3a';ctx.beginPath();ctx.ellipse(x,y-2*s,6*s,3*s,0,0,TAU);ctx.fill();
      if(SEASON!=='winter')for(let i=0;i<6;i++){const fx=x+(r()-.5)*10*s,fy=y-6*s-r()*4*s;limb(fx,y-2*s,fx,fy,'#6f8a4a',.6);dot(fx,fy,1.6*s,SEASON==='fall'?'#b49a8a':'#e88ab4')}break}
    case'cotton':{// bog cotton: tufts of white fluff on thin stems (summer), sedge the rest of the year
      for(let i=0;i<6;i++){const a=-PI/2+(r()-.5)*1;limb(x,y,x+Math.cos(a)*9*s,y+Math.sin(a)*9*s,SEASON==='winter'?'#a08a5a':'#7a8a4a',.8)}
      if(SEASON==='summer'||SEASON==='spring')for(let i=0;i<5;i++){const fx=x+(r()-.5)*10*s,fy=y-10*s-r()*4*s;limb(fx,y,fx,fy,'#6f7a4a',.6);dot(fx,fy,2*s,'#fbfaf4');dot(fx+.6,fy+.4,1.4*s,'#eeeae0')}break}
    case'hedgeflower':{// cow parsley in spring, dog rose in summer, haws in fall along the hedges
      if(SEASON==='spring')for(let i=0;i<5;i++){const fx=x+(r()-.5)*12*s,fy=y-6*s-r()*6*s;limb(fx,y,fx,fy,'#6f8a4a',.6);for(let q=0;q<5;q++)dot(fx+(r()-.5)*4*s,fy+(r()-.5)*2*s,1*s,'#fbf8ee')}
      else if(SEASON==='summer')for(let i=0;i<4;i++)dot(x+(r()-.5)*12*s,y-4*s-r()*8*s,1.8*s,'#f2b8c8');else if(SEASON==='fall')for(let i=0;i<6;i++)dot(x+(r()-.5)*12*s,y-4*s-r()*8*s,1.2*s,'#b02a22');break}
    case'sheep':{// a grazing sheep: woolly body, black face and legs
      const f=d.s>.5?1:-1;ctx.fillStyle='rgba(30,40,20,.2)';ctx.beginPath();ctx.ellipse(x+1,y+1,7*s,2.2*s,0,0,TAU);ctx.fill();
      for(const lx of[-3.5,-1.5,1.5,3.5])limb(x+lx*s,y,x+lx*s,y-3*s,'#2a2622',1);
      ctx.fillStyle=SEASON==='summer'?'#efeade':'#e4ddca';ctx.beginPath();ctx.ellipse(x,y-5*s,6*s,3.6*s,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.ellipse(x-1*s,y-6.4*s,3.6*s,1.6*s,0,0,TAU);ctx.fill();
      ctx.fillStyle='#2a2622';ctx.beginPath();ctx.ellipse(x+f*6.4*s,y-4*s+(d.s>.75?2*s:0),2*s,1.5*s,f*.4,0,TAU);ctx.fill();break}
    case'cow':{// a cow; in Scotland a shaggy ginger Highland cow with long horns
      const hl=d.y<18000,f=d.s>.5?1:-1,col=hl?'#b4622e':d.s>.3?'#3a2e26':'#f2efe6';ctx.fillStyle='rgba(30,40,20,.2)';ctx.beginPath();ctx.ellipse(x+1,y+1,10*s,2.6*s,0,0,TAU);ctx.fill();
      for(const lx of[-5,-3,3,5])limb(x+lx*s,y,x+lx*s,y-4.5*s,shadeHex(col,-.3),1.6);ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(x-8*s,y-10*s,16*s,6.5*s,3*s);ctx.fill();
      if(!hl&&col==='#f2efe6'){ctx.fillStyle='#2a2622';ctx.beginPath();ctx.ellipse(x-2*s,y-8*s,3*s,2*s,0,0,TAU);ctx.fill()}
      ctx.fillStyle=shadeHex(col,-.1);ctx.beginPath();ctx.ellipse(x+f*9*s,y-8*s,2.6*s,2.4*s,0,0,TAU);ctx.fill();
      if(hl){ctx.strokeStyle='#efe6c8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+f*8*s,y-10*s);ctx.quadraticCurveTo(x+f*5*s,y-13*s,x+f*4*s,y-14*s);ctx.moveTo(x+f*10*s,y-10*s);ctx.quadraticCurveTo(x+f*13*s,y-13*s,x+f*14*s,y-14*s);ctx.stroke();
        ctx.strokeStyle='rgba(120,60,20,.5)';ctx.beginPath();for(let i=0;i<8;i++){const fx=x-7*s+i*2*s;ctx.moveTo(fx,y-10*s);ctx.lineTo(fx+.5,y-4*s)}ctx.stroke()}break}
    case'drywall':{// a stretch of dry-stone wall (the Old Wall)
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x-16*s,y,32*s,2*s);for(let row=0;row<3;row++)for(let i=0;i<6;i++){const sx=x-16*s+i*5.4*s+(row%2?2.6*s:0),sy=y-3*s-row*3*s;ctx.fillStyle=['#a49e92','#8a857a','#bab4a8'][(i+row)%3];ctx.beginPath();ctx.roundRect(sx,sy,5*s,3*s,1);ctx.fill()}
      ctx.fillStyle='#6f8a4a';ctx.fillRect(x-16*s,y-10*s,32*s,1.2*s);break}
    case'stone':{// a standing stone, grey and lichened
      ctx.fillStyle='rgba(30,30,20,.22)';ctx.beginPath();ctx.ellipse(x+5*s,y+1,7*s,2*s,0,0,TAU);ctx.fill();
      ctx.fillStyle='#8a877e';ctx.beginPath();ctx.moveTo(x-4*s,y);ctx.lineTo(x-4.5*s,y-14*s-d.s*8*s);ctx.lineTo(x+1*s,y-17*s-d.s*8*s);ctx.lineTo(x+4.5*s,y-12*s-d.s*6*s);ctx.lineTo(x+4*s,y);ctx.closePath();ctx.fill();
      ctx.fillStyle='#a8a499';ctx.beginPath();ctx.moveTo(x-4*s,y);ctx.lineTo(x-4.5*s,y-14*s-d.s*8*s);ctx.lineTo(x-1*s,y-16*s-d.s*8*s);ctx.lineTo(x-1*s,y);ctx.fill();dot(x+1.5*s,y-7*s,1.4*s,'#b8c07a');dot(x-2*s,y-11*s,1*s,'#d0c88a');break}
    case'chalkhorse':{// the white horse cut into the chalk hillside, flat on the turf
      ctx.save();ctx.translate(x,y);ctx.scale(s*1.2,s*.7);ctx.fillStyle='#f2f0e8';ctx.beginPath();ctx.moveTo(-60,0);ctx.quadraticCurveTo(-30,-14,10,-8);ctx.quadraticCurveTo(40,-18,58,-30);ctx.lineTo(66,-26);ctx.quadraticCurveTo(52,-12,48,-4);ctx.lineTo(40,-4);ctx.quadraticCurveTo(20,-2,0,2);ctx.lineTo(-40,6);ctx.closePath();ctx.fill();
      ctx.lineWidth=6;ctx.strokeStyle='#f2f0e8';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-40,4);ctx.lineTo(-50,24);ctx.moveTo(-20,4);ctx.lineTo(-26,26);ctx.moveTo(20,0);ctx.lineTo(28,22);ctx.moveTo(36,-2);ctx.lineTo(46,18);ctx.moveTo(-58,-2);ctx.quadraticCurveTo(-72,4,-80,16);ctx.stroke();dot(56,-24,2.4,'#6f8a4a');ctx.restore();break}
    case'phonebox':{// a red telephone box
      ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(x-3,y-1,10,3);ctx.fillStyle='#c4231c';ctx.fillRect(x-4.5,y-26,9,26);ctx.fillStyle='#a01a14';ctx.fillRect(x+2,y-26,2.5,26);
      ctx.fillStyle='#e8f0f2';for(let q=0;q<3;q++)ctx.fillRect(x-3.2,y-20+q*5.5,5,4.4);ctx.fillStyle='#f8f4e6';ctx.fillRect(x-3.6,y-24.5,6.6,1.6);ctx.fillStyle='#c4231c';ctx.beginPath();ctx.moveTo(x-5.5,y-26);ctx.quadraticCurveTo(x,y-31,x+5.5,y-26);ctx.fill();break}
    case'postbox':{// a red pillar box
      ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(x+2,y+1,4,1.4,0,0,TAU);ctx.fill();ctx.fillStyle='#c4231c';ctx.beginPath();ctx.roundRect(x-3,y-13,6,13,[3,3,0,0]);ctx.fill();ctx.fillStyle='#1d1d1d';ctx.fillRect(x-2,y-9,4,1);ctx.fillRect(x-3.4,y-1.4,6.8,1.4);break}
    case'bandstand':{// a Victorian bandstand: a round platform, slim iron columns and a green tented roof
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(x+4,y+2,34,10,0,0,TAU);ctx.fill();ctx.fillStyle='#d8d2c4';ctx.beginPath();ctx.ellipse(x,y,32,10,0,0,TAU);ctx.fill();ctx.fillStyle='#bdb5a4';ctx.fillRect(x-32,y-4,64,4);ctx.beginPath();ctx.ellipse(x,y-4,32,10,0,0,TAU);ctx.fillStyle='#e6e0d2';ctx.fill();
      for(let i=0;i<8;i++){const a=i/8*TAU,cx2=x+Math.cos(a)*28,cy2=y-4+Math.sin(a)*8.5;if(Math.sin(a)<-.2)continue;limb(cx2,cy2,cx2,cy2-30,'#2f4a3a',1.6)}
      ctx.fillStyle='#3f6a4a';ctx.beginPath();ctx.moveTo(x-36,y-34);ctx.quadraticCurveTo(x,y-58,x+36,y-34);ctx.quadraticCurveTo(x,y-26,x-36,y-34);ctx.fill();ctx.fillStyle='#5a8a62';ctx.beginPath();ctx.moveTo(x-30,y-36);ctx.quadraticCurveTo(x-6,y-54,x,y-52);ctx.lineTo(x-4,y-34);ctx.fill();limb(x,y-52,x,y-60,'#c9a043',1.4);break}
    case'plumeria':{// TP5 a small tree of stubby grey branches, each ending in a rosette of leaves and a cluster of flowers
      ctx.fillStyle='rgba(30,50,25,.18)';ctx.beginPath();ctx.ellipse(x+4,y+1,16*s,4*s,0,0,TAU);ctx.fill();const fc=d.s>.5?['#fbf6e8','#f3d34a']:['#f2a6c4','#f7e18a'];
      const tips=[];const br=(bx,by,a,L,dep)=>{const ex=bx+Math.cos(a)*L,ey=by+Math.sin(a)*L;limb(bx,by,ex,ey,'#8f8a80',2.4*s*(dep+1)/3);if(dep>0){br(ex,ey,a-.5-r()*.3,L*.75,dep-1);br(ex,ey,a+.5+r()*.3,L*.75,dep-1)}else tips.push([ex,ey])};
      br(x,y,-PI/2+(r()-.5)*.2,9*s,2);for(const [tx,ty] of tips){for(let k=0;k<6;k++){const a=k/6*TAU;ctx.fillStyle=k%2?'#3f7a36':'#56913f';ctx.beginPath();ctx.ellipse(tx+Math.cos(a)*4*s,ty+Math.sin(a)*2.2*s,3.6*s,1.4*s,a,0,TAU);ctx.fill()}
        for(let k=0;k<4;k++){const fx=tx+(r()-.5)*5*s,fy=ty-2*s-r()*3*s;for(let p=0;p<5;p++){const a=p/5*TAU;dot(fx+Math.cos(a)*1.3*s,fy+Math.sin(a)*1.3*s,1.1*s,fc[0])}dot(fx,fy,.7*s,fc[1])}}break}
    case'hibiscus':{// a rounded glossy shrub with big five-petalled flowers
      ctx.fillStyle='rgba(30,50,25,.18)';ctx.beginPath();ctx.ellipse(x+3,y+1,13*s,3.6*s,0,0,TAU);ctx.fill();
      for(let i=0;i<10;i++){const ox=(r()-.5)*20*s,oy=-r()*13*s;ctx.fillStyle=['#2f6232','#3f7a3a','#55904a'][i%3];ctx.beginPath();ctx.ellipse(x+ox,y+oy-3*s,4.5*s,3.2*s,r()*PI,0,TAU);ctx.fill()}
      const fc=['#d6262f','#e8558a','#f4a63a','#d6262f'][Math.floor(d.s*4)];for(let i=0;i<6;i++){const fx=x+(r()-.5)*18*s,fy=y-4*s-r()*11*s;for(let p=0;p<5;p++){const a=p/5*TAU;dot(fx+Math.cos(a)*1.7*s,fy+Math.sin(a)*1.5*s,1.5*s,fc)}dot(fx,fy,.8*s,'#f6e08a')}break}
    case'ti':{// ti plant: a few slim stalks topped with fans of long strap leaves, red or green
      const red=d.s>.45,cols=red?['#7a1f3a','#a8324a','#5a1a2e']:['#3f7a36','#5a9443','#2f5a2a'];
      for(let k=0;k<3;k++){const sx=x+(k-1)*4*s,H=(10+k*4+r()*4)*s;limb(sx,y,sx+(r()-.5)*2,y-H,'#7a6a52',1.2*s);for(let i=0;i<8;i++){const a=-PI/2+(i/7-.5)*2.6,L=(7+r()*3)*s;ctx.strokeStyle=cols[i%3];ctx.lineWidth=2.2*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx,y-H);ctx.quadraticCurveTo(sx+Math.cos(a)*L*.5,y-H+Math.sin(a)*L*.5-2*s,sx+Math.cos(a)*L,y-H+Math.sin(a)*L*.6+2*s);ctx.stroke()}ctx.lineCap='butt'}break}
    case'bougain':{// bougainvillea: a sprawling mound of green spilling with magenta (now and then orange) bracts
      const bc=d.s>.8?['#f08a3a','#f6a85a']:['#d6338a','#e85aa6'];ctx.fillStyle='rgba(30,50,25,.18)';ctx.beginPath();ctx.ellipse(x+3,y+1,15*s,4*s,0,0,TAU);ctx.fill();
      for(let i=0;i<9;i++){const ox=(r()-.5)*24*s,oy=-r()*14*s;ctx.fillStyle=i%2?'#3f7a36':'#2f6232';ctx.beginPath();ctx.ellipse(x+ox,y+oy-3*s,4.4*s,3*s,r()*PI,0,TAU);ctx.fill()}
      for(let i=0;i<26;i++){const ox=(r()-.5)*24*s,oy=-2*s-r()*16*s;dot(x+ox,y+oy,(1.3+r()*1.1)*s,bc[i%2])}break}
    case'coffee':{// a dark glossy coffee bush with clusters of red and green cherries along the branches
      ctx.fillStyle='rgba(30,50,25,.2)';ctx.beginPath();ctx.ellipse(x+3,y+1,12*s,3.5*s,0,0,TAU);ctx.fill();
      for(let i=0;i<5;i++){const a=-PI/2+(i/4-.5)*1.5,L=(12+r()*6)*s;limb(x,y,x+Math.cos(a)*L*.7,y+Math.sin(a)*L,'#6b5a44',1.1)}
      for(let i=0;i<14;i++){const ox=(r()-.5)*20*s,oy=-4*s-r()*14*s;ctx.fillStyle=['#1f4a2a','#2f6236','#3f7a40'][i%3];ctx.beginPath();ctx.ellipse(x+ox,y+oy,3.4*s,1.8*s,r()*PI,0,TAU);ctx.fill()}
      for(let i=0;i<8;i++){const ox=(r()-.5)*16*s,oy=-5*s-r()*11*s;dot(x+ox,y+oy,1.2*s,SEASON==='fall'||SEASON==='winter'?(i%3?'#c8302a':'#8a1f1f'):(i%3?'#7fae4a':'#c8302a'))}break}
    case'treefern':{// a shaggy brown trunk with a crown of long arching fronds; a curled fiddlehead or two in the middle
      const H=(16+r()*16)*s,w=2.6*s,tx=x+sway*H*.3,ty=y-H;ctx.fillStyle='rgba(30,50,25,.2)';ctx.beginPath();ctx.ellipse(x+H*.3,y+1,H*.55,3.4*s,0,0,TAU);ctx.fill();
      limb2(x,y,tx,ty,w*1.15,w,'#6b4a30','#4a3220');for(let k=0;k<5;k++){const f=(k+.5)/5;ctx.strokeStyle='#8a6440';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(lerp(x,tx,f)-w,lerp(y,ty,f));ctx.lineTo(lerp(x,tx,f)+w*.6,lerp(y,ty,f)+2);ctx.stroke()}
      const N=9;for(let i=0;i<N;i++){const a=-PI/2+(i/(N-1)-.5)*3.6+(r()-.5)*.2,L=(15+r()*8)*s,ex=tx+Math.cos(a)*L,ey=ty+Math.sin(a)*L*.62+L*.35,mx=tx+Math.cos(a)*L*.55,my=ty+Math.sin(a)*L*.5-4*s;
        const col=i%2?'#3f7a36':'#56913f';ctx.strokeStyle=col;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();
        ctx.lineWidth=1;for(let q=1;q<9;q++){const u=q/9,px=(1-u)*(1-u)*tx+2*(1-u)*u*mx+u*u*ex,py=(1-u)*(1-u)*ty+2*(1-u)*u*my+u*u*ey,l=(1-u*.7)*3.2*s;ctx.beginPath();ctx.moveTo(px-l*.7,py-l*.5);ctx.lineTo(px+l*.7,py+l*.5);ctx.stroke()}}
      ctx.strokeStyle='#b0884a';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(tx+1,ty-4*s,2*s,PI*.2,PI*1.9);ctx.stroke();break}
    case'naupaka':{// a low mound of glossy leaves; little white half-flowers
      ctx.fillStyle='rgba(40,60,30,.18)';ctx.beginPath();ctx.ellipse(x+3,y+1,15*s,4*s,0,0,TAU);ctx.fill();
      for(let i=0;i<9;i++){const ox=(r()-.5)*24*s,oy=-r()*9*s;ctx.fillStyle=['#3f7a36','#5a9443','#79b05a'][i%3];ctx.beginPath();ctx.ellipse(x+ox,y+oy-3*s,(4+r()*2.5)*s,(3+r()*1.5)*s,r()*PI,0,TAU);ctx.fill()}
      for(let i=0;i<5;i++){const ox=(r()-.5)*20*s,oy=-3*s-r()*9*s;ctx.fillStyle='#f6f3ea';ctx.beginPath();ctx.arc(x+ox,y+oy,1.4*s,PI,TAU);ctx.fill()}break}
    case'taro':{// big heart-shaped leaves on long stems, standing in wet ground
      ctx.fillStyle='rgba(60,90,90,.22)';ctx.beginPath();ctx.ellipse(x,y+1,13*s,3.5*s,0,0,TAU);ctx.fill();
      for(let i=0;i<6;i++){const a=-PI/2+(i/5-.5)*1.9,L=(10+r()*7)*s,ex=x+Math.cos(a)*L*.8+sway*L,ey=y+Math.sin(a)*L;limb(x,y,ex,ey,'#6f9a6a',1);
        const lw=(5+r()*2)*s,lh=lw*1.1;ctx.save();ctx.translate(ex,ey);ctx.rotate(a+PI/2+(r()-.5)*.4);ctx.fillStyle=i%2?'#4f8a6a':'#6aa684';ctx.beginPath();
        ctx.moveTo(0,-lh*.35);ctx.bezierCurveTo(-lw,-lh*.9,-lw*1.1,lh*.2,0,lh*.75);ctx.bezierCurveTo(lw*1.1,lh*.2,lw,-lh*.9,0,-lh*.35);ctx.fill();
        ctx.strokeStyle='rgba(220,240,225,.5)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(0,-lh*.3);ctx.lineTo(0,lh*.65);ctx.stroke();ctx.restore()}break}
    case'silversword':{// a silver globe of curved sword leaves; now and then a tall stalk of maroon flowers in summer
      ctx.fillStyle='rgba(60,30,20,.2)';ctx.beginPath();ctx.ellipse(x+2,y+1,10*s,3*s,0,0,TAU);ctx.fill();const R=8*s,cy=y-R*.8;
      for(let i=0;i<34;i++){const a=r()*TAU,l=R*(.6+r()*.5);ctx.strokeStyle=i%3?'#d9dee2':i%2?'#b9c3c9':'#eef2f4';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,cy);ctx.quadraticCurveTo(x+Math.cos(a)*l*.6,cy+Math.sin(a)*l*.6-2,x+Math.cos(a)*l,cy+Math.sin(a)*l*.7);ctx.stroke()}
      if((SEASON==='summer'||SEASON==='fall')&&d.s>.78){const H=34*s;limb(x,cy,x+sway*H,cy-H,'#9aa59a',2.4);for(let k=0;k<16;k++){const u=k/16,px=x+sway*H*u+(r()-.5)*5*s,py=cy-H*(.25+u*.75);dot(px,py,1.6*s,k%2?'#8a2f4a':'#a8465f')}}break}
    case'saguaro':{// a ribbed green column with upturned arms; cream flowers on the tips in spring
      const H=(46+r()*30)*s,w=4.6*s,nA=d.s<.25?0:d.s<.6?1:d.s<.88?2:3,G=['#4a6a3a','#5f8148','#7e9d5f','#9cb779'];
      ctx.fillStyle='rgba(70,48,24,.17)';ctx.beginPath();ctx.ellipse(x+H*.2,y+1,H*.32,3.4*s,0,0,TAU);ctx.fill();
      const col=(x0,y0,x1,y1,ww)=>{ctx.fillStyle=G[1];ctx.beginPath();ctx.moveTo(x0-ww,y0);ctx.lineTo(x1-ww,y1+ww);ctx.quadraticCurveTo(x1-ww,y1-ww*.9,x1,y1-ww*.95);ctx.quadraticCurveTo(x1+ww,y1-ww*.9,x1+ww,y1+ww);ctx.lineTo(x0+ww,y0);ctx.closePath();ctx.fill();
        ctx.fillStyle=G[0];ctx.fillRect(Math.min(x0,x1)+ww*.35,Math.min(y0,y1)+ww*.2,ww*.65,Math.abs(y1-y0)+ww*.6);
        ctx.fillStyle=G[2];ctx.fillRect(Math.min(x0,x1)-ww*.7,Math.min(y0,y1)+ww*.3,ww*.45,Math.abs(y1-y0)+ww*.5);
        ctx.strokeStyle='rgba(40,60,30,.4)';ctx.lineWidth=.5;ctx.beginPath();for(const f of[-.35,.25])ctx.moveTo(x0+ww*f,y0),ctx.lineTo(x1+ww*f,y1);ctx.stroke()};
      const arms=[];for(let i=0;i<nA;i++){const side=i%2?1:-1,ay=y-H*(.38+r()*.22),out=(5+r()*4)*s,up=(12+r()*14)*s;arms.push([side,ay,out,up])}
      for(const [sd,ay,out,up] of arms){const ex=x+sd*(w+out);ctx.strokeStyle=G[1];ctx.lineWidth=w*1.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,ay);ctx.quadraticCurveTo(ex,ay+2*s,ex,ay-4*s);ctx.stroke();col(ex,ay-3*s,ex,ay-up,w*.78)}
      col(x,y,x,y-H,w);
      if(SEASON==='spring'||(SEASON==='summer'&&d.s>.5)){for(const [sd,ay,out,up] of[[0,y,0,H],...arms.map(a=>[a[0],a[1],a[2],a[3]])]){const tx=sd?x+sd*(w+out):x,ty=sd?ay-up-w*.8:y-H-w;dot(tx-1.5,ty,1.2,'#f5efd8');dot(tx+1.5,ty+.3,1.2,'#f5efd8');dot(tx,ty-.8,1.1,'#fbf6e4')}}break}
    case'joshua':{// shaggy trunk, branches that fork, and spiky leaf clusters at every tip
      const H=(40+r()*18)*s,bark=['#6f6553','#8a7f69','#a39a83'],L=['#5f733a','#7d8f4c','#a2b36a'];
      ctx.fillStyle='rgba(70,48,24,.17)';ctx.beginPath();ctx.ellipse(x+H*.2,y+1,H*.38,3.6*s,0,0,TAU);ctx.fill();
      const tips=[];const br=(x0,y0,a,len,ww,dep)=>{const ex=x0+Math.cos(a)*len,ey=y0+Math.sin(a)*len;limb2(x0,y0,ex,ey,ww,ww*.8,bark[1],bark[0]);
        for(let k=0;k<3;k++){const f=(k+.5)/3;ctx.strokeStyle=bark[2];ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(lerp(x0,ex,f)-ww*.4,lerp(y0,ey,f));ctx.lineTo(lerp(x0,ex,f)+ww*.3,lerp(y0,ey,f)+2);ctx.stroke()}
        if(dep>0&&r()<.85){br(ex,ey,a-.45-r()*.3,len*.72,ww*.78,dep-1);br(ex,ey,a+.45+r()*.3,len*.72,ww*.78,dep-1)}else tips.push([ex,ey,a])};
      br(x,y,-PI/2+(r()-.5)*.15,H*.42,4.2*s,2);
      for(const [tx,ty,a] of tips){for(let k=0;k<11;k++){const b=a+(k/10-.5)*2.6,l=(4+r()*2.5)*s;ctx.strokeStyle=L[k%3];ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+Math.cos(b)*l,ty+Math.sin(b)*l);ctx.stroke()}
        dot(tx,ty,1.6*s,L[0]);if(SEASON==='spring'&&d.s>.4){dot(tx,ty-3*s,1.6*s,'#ece6c4');dot(tx+1,ty-4.5*s,1.2*s,'#f4efd6')}}break}
    case'ocotillo':{const n=12,leafy=SEASON!=='winter'&&d.s>.3;ctx.fillStyle='rgba(70,48,24,.15)';ctx.beginPath();ctx.ellipse(x+8,y+1,14*s,3.5*s,0,0,TAU);ctx.fill();
      for(let i=0;i<n;i++){const u=i/(n-1)-.5,a=-PI/2+u*1.1+(r()-.5)*.12,L=(36+r()*14)*s,x0=x+u*3,cx=x+Math.cos(a)*L*.5+u*6,cy=y+Math.sin(a)*L*.5,ex=x+Math.cos(a)*L+u*12,ey=y+Math.sin(a)*L;
        ctx.strokeStyle=i%2?'#6f6a55':'#857f66';ctx.lineWidth=1.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0,y);ctx.quadraticCurveTo(cx,cy,ex,ey);ctx.stroke();
        for(let k=1;k<10;k++){const f=k/10,px=(1-f)*(1-f)*x0+2*(1-f)*f*cx+f*f*ex,py=(1-f)*(1-f)*y+2*(1-f)*f*cy+f*f*ey;
          if(leafy){ell(px-1.2,py,1.3,.7,'#7f9c3e',-.4);ell(px+1.2,py,1.3,.7,'#93ad48',.4)}else{ctx.strokeStyle='#5b5646';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+1.6,py-.8);ctx.stroke()}}
        if(SEASON==='spring'||(SEASON==='summer'&&d.s>.6)){ctx.fillStyle='#e0442c';ctx.beginPath();ctx.ellipse(ex,ey-2,1,2.6,a+PI/2,0,TAU);ctx.fill();dot(ex,ey-4,.6,'#f57a3a')}}break}
    case'cholla':{const P=['#6d8a4a','#8aa65c'];ctx.fillStyle='rgba(70,48,24,.16)';ctx.beginPath();ctx.ellipse(x+5,y+1,9*s,2.6*s,0,0,TAU);ctx.fill();
      const seg=(x0,y0,a,L,w,dep)=>{const ex=x0+Math.cos(a)*L,ey=y0+Math.sin(a)*L;limb2(x0,y0,ex,ey,w,w*.85,P[1],P[0]);
        for(let k=0;k<4;k++){const f=(k+.5)/4;dot(lerp(x0,ex,f)+(r()-.5)*w*1.4,lerp(y0,ey,f),.55,'#f1ead2')}
        ell(ex,ey,w*.95,w*.7,P[1]);if(dep>0){for(const sd of[-1,1])if(r()<.88)seg(ex,ey,a+sd*(.45+r()*.35)*(a<-PI*.8||a>-PI*.2?.5:1),L*(.78+r()*.15),w*.9,dep-1)}else if(r()<.6)ell(ex,ey-1.5,1.7,1.4,'#e2c23a')};
      limb2(x,y,x,y-7*s,2.4*s,2.1*s,'#8f8466','#6a614a');seg(x,y-7*s,-PI/2,7.5*s,2.2*s,3);break}
    case'barrel':{const R=(4.2+r()*1.5)*s,H=(9+r()*4)*s;ctx.fillStyle='rgba(70,48,24,.18)';ctx.beginPath();ctx.ellipse(x+3,y+.5,R*1.3,R*.4,0,0,TAU);ctx.fill();
      ell(x,y-H*.5,R,H*.55,'#4f6b3a');ell(x-R*.25,y-H*.55,R*.6,H*.48,'#6b8a48');
      ctx.strokeStyle='#3c5230';ctx.lineWidth=.5;for(let k=-2;k<=2;k++){ctx.beginPath();if(k===0){ctx.moveTo(x,y-H*1.05);ctx.lineTo(x,y+.05*H)}else ctx.ellipse(x,y-H*.5,Math.abs(k)*R*.4,H*.55,0,k<0?PI*.5:-PI*.5,k<0?PI*1.5:PI*.5);ctx.stroke()}
      ctx.strokeStyle='#c2513a';ctx.lineWidth=.6;for(let k=0;k<10;k++){const px=x+(r()-.5)*R*1.6,py=y-H*(.15+r()*.75);ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+1.5,py-1.5,px+1,py-2.5);ctx.stroke()}
      if(SEASON!=='winter')for(let k=0;k<6;k++){const a=k/6*TAU;dot(x+Math.cos(a)*R*.55,y-H*1.02+Math.sin(a)*.8,1.1,SEASON==='summer'?'#f0a23a':'#e8c94a')}break}
    case'agave':{const n=15,R=(11+r()*3)*s,lv=[];ctx.fillStyle='rgba(70,48,24,.15)';ctx.beginPath();ctx.ellipse(x+3,y+1,R*.9,R*.28,0,0,TAU);ctx.fill();
      for(let i=0;i<n;i++){const u=i/(n-1)-.5;lv.push([-PI/2+u*2.6+(r()-.5)*.15,R*(.75+r()*.35)*(1-Math.abs(u)*.35),Math.abs(u)])}
      lv.sort((p,q)=>q[2]-p[2]);
      for(const [a,L,o] of lv){const ex=x+Math.cos(a)*L,ey=y-1+Math.sin(a)*L*.85,w=2.3*s,nx=-Math.sin(a),ny=Math.cos(a),mx=x+Math.cos(a)*L*.45,my=y-1+Math.sin(a)*L*.42;
        ctx.fillStyle=o>.3?'#62886a':'#7da37f';ctx.beginPath();ctx.moveTo(x+nx*w,y-1+ny*w*.6);ctx.quadraticCurveTo(mx+nx*w*1.7,my+ny*w*1.2,ex,ey);ctx.quadraticCurveTo(mx-nx*w*1.7,my-ny*w*1.2,x-nx*w,y-1-ny*w*.6);ctx.fill();
        ctx.strokeStyle=o>.3?'#88aa8a':'#a6c4a2';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y-1);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();
        ctx.strokeStyle='#4a3020';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+Math.cos(a)*1.4,ey+Math.sin(a)*1.4);ctx.stroke()}
      if(d.s>.86){const h=(36+r()*8)*s;limb(x,y-3,x+2,y-h,'#8a7a52',1.5);for(let k=0;k<7;k++){const yy=y-h*.55-k*h*.065,sd=k%2?1:-1;limb(x+1,yy,x+1+sd*4,yy-2,'#8a7a52',.7);ell(x+1+sd*5,yy-2.5,2.2,1.4,SEASON==='winter'?'#9a8a62':'#e3c33e')}}break}
    case'soapweed':{const n=26,R=(9+r()*3)*s;ctx.fillStyle='rgba(70,48,24,.14)';ctx.beginPath();ctx.ellipse(x+2,y+1,R*.8,R*.25,0,0,TAU);ctx.fill();
      ctx.strokeStyle='#9c9070';ctx.lineWidth=.9;ctx.beginPath();for(let i=0;i<8;i++){const a=PI*.1+i/7*PI*.8;ctx.moveTo(x,y-2);ctx.lineTo(x+Math.cos(a)*R*.7,y-2+Math.sin(a)*R*.25)}ctx.stroke();
      for(let i=0;i<n;i++){const a=-PI/2+(r()-.5)*PI*1.25,L=R*(.6+r()*.45);ctx.strokeStyle=i%3?'#6f8a55':'#93a96f';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x,y-2);ctx.lineTo(x+Math.cos(a)*L,y-2+Math.sin(a)*L*.95);ctx.stroke()}
      if(d.s>.55){const bloom=SEASON==='spring'||SEASON==='summer',h=(26+r()*8)*s;limb(x,y-4,x+1,y-h,bloom?'#7d8a52':'#8d7f5a',1.2);
        for(let k=0;k<(bloom?9:6);k++){const yy=y-h*.45-k*h*.06,sd=k%2?1:-1;if(bloom){ell(x+1+sd*2.4,yy,1.6,2.1,'#f4efd6');dot(x+1+sd*2.4,yy+1.2,.5,'#d9cfa6')}else ell(x+1+sd*2,yy,1.3,1.8,'#8a7550')}}break}
    case'hoodoo':{// soft clay spires: wide eroded bases, gently banded, each topped with a harder dark caprock; lit from the left
      const n=1+((d.s*2.6)|0),B=['#d7a886','#e6d2b0','#c99274','#ddc4a0','#cf9a7a'];ctx.fillStyle='rgba(110,62,40,.24)';ctx.beginPath();ctx.ellipse(x+12*s,y+2,22*s,5*s,.12,0,TAU);ctx.fill();
      for(let i=0;i<n;i++){const hx=x+(i-(n-1)/2)*13*s+(r()-.5)*5,big=i===((n-1)/2|0),h=(22+r()*16)*s*(big?1.15:.78),wb=(9+r()*3)*s,wt=wb*(.36+r()*.12);
        const prof=[];for(let k=0;k<=8;k++){const f=k/8,w=lerp(wb,wt,Math.pow(f,.7))*(1+.12*Math.sin(f*9+i*2.1+d.s*5));prof.push([w,y-h*f])}
        const side=sg=>{ctx.beginPath();ctx.moveTo(hx,y);for(const [w,yy] of prof)ctx.lineTo(hx+sg*w,yy);ctx.lineTo(hx,y-h);ctx.closePath()};
        ctx.save();side(-1);ctx.fill();ctx.restore();ctx.fillStyle=B[(i*2)%5];side(-1);ctx.fill();ctx.fillStyle=B[(i*2+1)%5];side(1);ctx.fill();
        ctx.save();ctx.beginPath();ctx.moveTo(hx-prof[0][0],y);for(const [w,yy] of prof)ctx.lineTo(hx-w,yy);for(let k=prof.length-1;k>=0;k--)ctx.lineTo(hx+prof[k][0],prof[k][1]);ctx.closePath();ctx.clip();
        for(let k=1;k<5;k++){const yy=y-h*k/5+(r()-.5)*2;ctx.fillStyle=k%2?'rgba(170,96,70,.35)':'rgba(250,236,210,.35)';ctx.fillRect(hx-wb,yy,wb*2,h/10)}
        ctx.fillStyle='rgba(120,70,52,.38)';ctx.fillRect(hx+wt*.2,y-h,wb,h);ctx.fillStyle='rgba(255,248,232,.22)';ctx.fillRect(hx-wb,y-h,wb*.55,h);ctx.restore();
        const cw=wt*1.8;ctx.fillStyle='#7d5040';ctx.beginPath();ctx.ellipse(hx+.5,y-h,cw,2.8*s,0,0,TAU);ctx.fill();ctx.fillStyle='#9a6650';ctx.beginPath();ctx.ellipse(hx-.5,y-h-1.6*s,cw*.92,2.4*s,0,0,TAU);ctx.fill();ctx.fillStyle='#b98466';ctx.beginPath();ctx.ellipse(hx-cw*.3,y-h-2.2*s,cw*.45,1.1*s,0,0,TAU);ctx.fill()}
      for(let k=0;k<4;k++)ell(x+(r()-.5)*34*s,y+1+r()*2,2+r()*2,1.1,'#c4a383');break}
    case'crag':{// a granite outcrop: a few blocky boulders piled together, lit facets on the upper left
      const G=['#b9ae98','#9a8f7c','#7a7062','#5e564c'],n=2+((d.s*3)|0);ctx.fillStyle='rgba(40,40,35,.22)';ctx.beginPath();ctx.ellipse(x+8*s,y+2,22*s,5*s,.1,0,TAU);ctx.fill();
      const bl=[];for(let i=0;i<n;i++)bl.push({bx:x+(i-(n-1)/2)*10*s+(r()-.5)*5,w:(7+r()*6)*s*(i===1?1.3:1),h:(7+r()*8)*s*(i===1?1.35:1),k:r()});
      bl.sort((a,b)=>a.h-b.h);for(const q of bl){const {bx,w,h}=q,tp=[bx-w*.25+(q.k-.5)*4,y-h];
        ctx.fillStyle=G[2];ctx.beginPath();ctx.moveTo(bx-w,y);ctx.lineTo(bx-w*.85,y-h*.55);ctx.lineTo(...tp);ctx.lineTo(bx+w*.55,y-h*.8);ctx.lineTo(bx+w,y-h*.25);ctx.lineTo(bx+w*.9,y);ctx.closePath();ctx.fill();
        ctx.fillStyle=G[0];ctx.beginPath();ctx.moveTo(bx-w*.85,y-h*.55);ctx.lineTo(...tp);ctx.lineTo(bx+w*.55,y-h*.8);ctx.lineTo(bx+w*.1,y-h*.5);ctx.lineTo(bx-w*.5,y-h*.38);ctx.closePath();ctx.fill();
        ctx.fillStyle=G[1];ctx.beginPath();ctx.moveTo(bx-w,y);ctx.lineTo(bx-w*.85,y-h*.55);ctx.lineTo(bx-w*.5,y-h*.38);ctx.lineTo(bx-w*.3,y);ctx.closePath();ctx.fill();
        ctx.fillStyle=G[3];ctx.beginPath();ctx.moveTo(bx+w*.55,y-h*.8);ctx.lineTo(bx+w,y-h*.25);ctx.lineTo(bx+w*.9,y);ctx.lineTo(bx+w*.25,y);ctx.lineTo(bx+w*.1,y-h*.5);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(45,40,34,.45)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(tp[0]+1,tp[1]+2);ctx.lineTo(bx,y-h*.3);ctx.stroke()}
      if(r()<.7)for(let k=0;k<4;k++)ell(x-14*s+r()*28*s,y-r()*3,2.4,1.2,'#7d8a4e',r());break}
    case'ledge':{// rimrock: broken slabs of caprock along the mesa edge, sunlit tops, dark faces, a strata line
      const n=3+((d.s*3)|0);ctx.fillStyle='rgba(90,50,30,.26)';ctx.beginPath();ctx.ellipse(x+8*s,y+3,(n*8+8)*s,5*s,.06,0,TAU);ctx.fill();
      let bx=x-n*7*s;for(let i=0;i<n;i++){const w=(8+r()*8)*s,fh=(5+r()*6)*s,dp=(3+r()*3)*s,yo=(r()-.5)*4*s,top=y+yo-fh,j=()=>(r()-.5)*2*s;
        ctx.fillStyle=i%2?'#8c553a':'#9a5f40';ctx.beginPath();ctx.moveTo(bx,y+yo);ctx.lineTo(bx+j(),top);ctx.lineTo(bx+w+j(),top+j()*.5);ctx.lineTo(bx+w,y+yo+j()*.5);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(bx+w*.6,top+1,w*.4,fh-1);ctx.fillStyle='rgba(240,200,160,.28)';ctx.fillRect(bx,top+fh*.45,w,1.1);
        ctx.fillStyle=i%2?'#cc9d6f':'#d8ad80';ctx.beginPath();ctx.moveTo(bx-.5,top);ctx.lineTo(bx+dp*.7+j(),top-dp);ctx.lineTo(bx+w+dp*.7+j(),top-dp+j()*.4);ctx.lineTo(bx+w+.5,top);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,240,215,.25)';ctx.fillRect(bx+1,top-dp*.7,w*.45,1.2);bx+=w*(.8+r()*.25)}
      if(r()<.6){const px=x+(r()-.2)*n*8*s,py=y+5*s;ell(px,py,3.6*s,2*s,'#a8714e');ell(px-.8,py-.8,2*s,1.1*s,'#c99a6c')}
      if(r()<.5)for(let k=0;k<3;k++)ell(x-n*6*s+r()*n*12*s,y-9*s-r()*3,2,1,'#7f8a4e',r());break}
    case'boulder':{const P=['#8f5a3e','#b0754f','#d39a6c'],n=1+((d.s*3)|0);ctx.fillStyle='rgba(60,35,20,.22)';ctx.beginPath();ctx.ellipse(x+5,y+1,16*s,4.5*s,0,0,TAU);ctx.fill();
      for(let i=0;i<n;i++){const bx=x+(i-(n-1)/2)*11*s+(r()-.5)*4,by=y+(i%2)*2,R=(8-i*1.5+r()*3)*s,Hh=R*(.7+r()*.3);
        fillP(lobePath(bx,by-Hh*.55,R,Hh*.7,7,r,{cusp:.92,lobe:1.05,amp:.18,flat:.5}),P[0]);fillP(lobePath(bx-R*.12,by-Hh*.7,R*.8,Hh*.5,7,r,{cusp:.92,lobe:1.05,amp:.15}),P[1]);
        fillP(lobePath(bx-R*.3,by-Hh*.88,R*.42,Hh*.24,5,r,{cusp:.9,lobe:1.04}),P[2]);ctx.strokeStyle='rgba(90,50,30,.35)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(bx-R*.8,by-Hh*.45);ctx.lineTo(bx+R*.7,by-Hh*.5);ctx.stroke()}break}
    case'sage':{const sg=d.k==='sage',P=sg?['#78866c','#98a386','#bcc4aa']:['#4b5d33','#647b3d','#86a052'];
      fillP(lobePath(x,y-6*s,13*s,7*s,9,r,{cusp:.8,flat:.45}),P[0]);fillP(lobePath(x-1.5,y-8*s,10*s,5*s,9,r,{cusp:.82,flat:.45}),P[1]);
      for(let i=0;i<11;i++)drawLeaf('birch',x+(r()-.5)*19*s,y-(5+r()*7)*s,-PI/2+(r()-.5)*2.2,(sg?3:3.6)*s,i%2?P[2]:P[1],null,null);
      if(sg){for(let i=0;i<4;i++)limb(x+(i-1.5)*3*s,y,x+(i-1.5)*4.5*s,y-4*s,'#6b5c48',.8)}else for(let i=0;i<5;i++)dot(x+(r()-.5)*16*s,y-(7+r()*6)*s,.9,'#f0c93a');break}
    case'shrub':{const sumac=d.s>.72,P=sumac?['#3f5f2c','#5b8239','#80a84d']:['#355a30','#4c7a3c','#6f9c52'];
      fillP(lobePath(x,y-7*s,14*s,8.5*s,8,r,{cusp:.85,flat:.4}),P[0]);fillP(lobePath(x-1.5,y-9*s,11*s,6*s,8,r,{cusp:.86,flat:.4}),P[1]);
      for(let i=0;i<9;i++)drawLeaf(sumac?'birch':'beech',x+(r()-.5)*20*s,y-(6+r()*8)*s,-PI/2+(r()-.5)*2.2,4.6*s,i%2?P[2]:P[1],null,null);
      if(sumac)for(let i=0;i<3;i++){const fx=x+(r()-.5)*14*s,fy=y-(13+r()*4)*s;ctx.fillStyle='#b8332a';ctx.beginPath();ctx.moveTo(fx-2,fy+3);ctx.lineTo(fx,fy-4);ctx.lineTo(fx+2,fy+3);ctx.fill();dot(fx,fy+1,1,'#d14a35')}
      else for(let i=0;i<5;i++){const fx=x+(r()-.5)*16*s,fy=y-(7+r()*8)*s;for(let k=0;k<4;k++)dot(fx+Math.cos(k*1.57+.8)*1.2,fy+Math.sin(k*1.57+.8)*1,.9,'#f5f2e6')}break}
    case'yucca':{if(d.s>.5){const h=26*s;limb(x,y-4,x,y-h,'#7d8a52',1.4);for(let k=0;k<8;k++){const by=y-h+3+k*2,side=k%2?1:-1;dot(x+side*(1.8+k*.15),by,1.4,'#f6f2df');dot(x+side*(1.8+k*.15),by+.5,.6,'#d9d2b0')}}
      for(let i=0;i<13;i++){const a=-PI/2+(i-6)*.2,L=(10+r()*4)*s*(1-Math.abs(i-6)*.04);const ex=x+Math.cos(a)*L,ey=y-2+Math.sin(a)*L;ctx.fillStyle=i%2?'#7b9877':'#9ab394';ctx.beginPath();ctx.moveTo(x-1,y-1);ctx.lineTo(ex,ey);ctx.lineTo(x+1,y-1);ctx.fill()}break}
    case'pear':{const pads=[[0,-4,4.4,5.6,0],[-5,-8,3.6,4.6,-.4],[4.6,-9,3.4,4.4,.4],[1,-13,3,4,.1]];
      for(const [px,py,rx,ry,a] of pads){ell(x+px*s,y+py*s,rx*s,ry*s,'#5f8c41',a);ell(x+px*s-rx*.25*s,y+py*s-ry*.2*s,rx*.55*s,ry*.6*s,'#80ad55',a);
        for(let k=0;k<4;k++)dot(x+(px+(r()-.5)*rx*1.2)*s,y+(py+(r()-.5)*ry*1.2)*s,.5,'#efe6b8')}
      if(d.s>.4){for(let k=0;k<6;k++){const a=k/6*TAU;dot(x+1*s+Math.cos(a)*1.6,y-17.5*s+Math.sin(a)*1.2,1.2,'#f2cf3a')}dot(x+1*s,y-17.5*s,.8,'#d58a2a')}break}
    case'knee':{const n=1+Math.floor(d.s*3);for(let i=0;i<n;i++){const kx=x+(i-n/2)*4,h=(3+r()*4)*s;ctx.fillStyle='#7a5f4b';ctx.beginPath();ctx.moveTo(kx-2.6,y);ctx.quadraticCurveTo(kx-1.2,y-h,kx,y-h);ctx.quadraticCurveTo(kx+1.2,y-h,kx+2.6,y);ctx.fill();
        ctx.fillStyle='#9a7d66';ctx.beginPath();ctx.moveTo(kx-2,y);ctx.quadraticCurveTo(kx-1,y-h+.5,kx,y-h);ctx.lineTo(kx-.3,y);ctx.fill()}break}
    case'heath':{ell(x,y-2*s,9*s,4*s,'#4c673a');ell(x-1.5,y-3*s,6.5*s,2.6*s,'#67844c');ell(x-3,y-4*s,3*s,1.2*s,'#86a062');for(let i=0;i<7;i++)dot(x+(r()-.5)*14*s,y-(1.5+r()*3.5)*s,.8,d.s>.5?'#efb3c9':'#f6f3ea');break}
    case'lamp':{ctx.save();ctx.translate(x,y);ctx.scale(1.6,1.6);ctx.translate(-x,-y);ell(x+3,y,4,1.5,'rgba(0,0,0,.2)');limb(x,y,x,y-34,'#2d3833',2.2);ctx.fillStyle='#2d3833';ctx.fillRect(x-2.2,y-3,4.4,3);
      ctx.fillStyle='#2d3833';ctx.beginPath();ctx.moveTo(x-4,y-34);ctx.lineTo(x+4,y-34);ctx.lineTo(x+2.6,y-40);ctx.lineTo(x-2.6,y-40);ctx.fill();ctx.fillStyle='#f7e7a8';ctx.fillRect(x-2.6,y-39,5.2,4.4);
      ctx.fillStyle='#2d3833';ctx.beginPath();ctx.moveTo(x-4.2,y-40);ctx.lineTo(x,y-43.5);ctx.lineTo(x+4.2,y-40);ctx.fill();ctx.restore();break}
    case'bench':{ctx.save();ctx.translate(x,y);ctx.scale(1.9,1.9);ctx.translate(-x,-y);ell(x,y+1,11,2,'rgba(0,0,0,.18)');for(const lx of[-8,8]){limb(x+lx,y,x+lx,y-6,'#2b2e2c',1.2);limb(x+lx,y-6,x+lx,y-12,'#2b2e2c',1)}
      ctx.fillStyle='#8a6440';ctx.fillRect(x-10,y-7,20,2.2);ctx.fillStyle='#9e7650';ctx.fillRect(x-10,y-5,20,1.6);ctx.fillStyle='#8a6440';ctx.fillRect(x-10,y-12.5,20,2);ctx.fillRect(x-10,y-10,20,1.8);ctx.restore();break}
    case'hydrant':{ell(x,y,3.5,1.3,'rgba(0,0,0,.2)');ctx.fillStyle='#c4362b';ctx.beginPath();ctx.roundRect(x-2.2,y-8,4.4,8,1);ctx.fill();ctx.fillRect(x-3.6,y-6,7.2,1.8);ctx.beginPath();ctx.arc(x,y-8,2.4,PI,TAU);ctx.fill();dot(x,y-10.6,.8,'#e1e0d8');ctx.fillStyle='#e05a49';ctx.fillRect(x-1.6,y-7.4,1,6.4);break}
    case'bin':{ell(x,y,4.4,1.5,'rgba(0,0,0,.2)');ctx.fillStyle='#2f5a43';ctx.beginPath();ctx.roundRect(x-3.6,y-9,7.2,9,1.4);ctx.fill();ctx.fillStyle='#3d7356';ctx.fillRect(x-2.6,y-8,1.4,7);ctx.fillStyle='#244636';ctx.beginPath();ctx.roundRect(x-4.2,y-10.5,8.4,2,1);ctx.fill();break}
    case'fountain':{ell(x,y+2,40,15,'rgba(0,0,0,.14)');ell(x,y,38,15,'#a9a397');ell(x,y-3,38,15,'#cfc9bc');ell(x,y-3,32,12,'#5aa4b8');ell(x-6,y-6,18,5,'rgba(255,255,255,.18)');
      ctx.fillStyle='#bdb7aa';ctx.fillRect(x-4,y-22,8,19);ell(x,y-22,13,5,'#cfc9bc');ell(x,y-22,10,3.6,'#6bb2c4');ctx.fillStyle='#bdb7aa';ctx.fillRect(x-2,y-32,4,10);ell(x,y-32,5,2,'#cfc9bc');
      ctx.strokeStyle='rgba(235,248,252,.85)';ctx.lineWidth=1.2;for(let k=0;k<6;k++){const a=k/6*TAU+t*.3,ph=(t*1.6+k*.3)%1;ctx.beginPath();ctx.moveTo(x,y-34);ctx.quadraticCurveTo(x+Math.cos(a)*7,y-46,x+Math.cos(a)*11,y-24+Math.sin(a)*3);ctx.stroke();dot(x+Math.cos(a)*(10+ph*4),y-24+Math.sin(a)*3+ph*6,.9,'rgba(235,248,252,.8)')}
      for(let k=0;k<3;k++){const ph=(t*.5+k/3)%1;ctx.strokeStyle=`rgba(255,255,255,${.5*(1-ph)})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y-3,10+ph*20,4+ph*8,0,0,TAU);ctx.stroke()}break}
    case'umbrella':{const cols=[['#d9443a','#f4efe4'],['#2f7fb5','#f4efe4'],['#f2b632','#3a7d6b'],['#3a9d8f','#f6e7c6']][Math.floor(d.s*4)%4];
      ctx.save();ctx.translate(x+10,y+6);ctx.rotate(-.08);ctx.fillStyle=cols[0];ctx.fillRect(-12,-5,24,10);ctx.fillStyle=cols[1];for(let i=0;i<4;i++)ctx.fillRect(-12+i*6+3,-5,3,10);ctx.restore();
      ell(x+6,y+1,16,5,'rgba(0,0,0,.15)');limb(x,y,x-2,y-27,'#e9e4d6',1.2);
      ctx.save();ctx.beginPath();ctx.moveTo(x-19,y-27);ctx.quadraticCurveTo(x-2,y-42,x+15,y-27);ctx.quadraticCurveTo(x-2,y-30,x-19,y-27);ctx.closePath();ctx.fillStyle=cols[0];ctx.fill();ctx.clip();
      ctx.fillStyle=cols[1];for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x-2,y-36);ctx.lineTo(x-19+i*9+3,y-25);ctx.lineTo(x-19+i*9+7.5,y-25);ctx.closePath();ctx.fill()}ctx.restore();
      for(let i=0;i<9;i++){const sx=x-19+i*4.25;ctx.fillStyle=cols[i%2];ctx.beginPath();ctx.arc(sx+2.1,y-27,2.1,0,PI);ctx.fill()}dot(x-2,y-37,1,'#e9e4d6');break}
  }}

/* ---------- buildings ----------
   Footprints sit on the ground in world units. On the map heights are drawn BH× taller than life,
   the same exaggeration as the Defender and people, so doors fit the figures. In the binoculars they are true size meshes. */
const BH=1.7,STORY=3.3;
const BLD=[];
function addB(o){o.id=BLD.length;o.seed=(o.seed??BLD.length*7919+101)|0;BLD.push(o);return o}
const CEN_SHOPS=['CAFÉ','HARDWARE','FEED & SEED','DINER','DRUG STORE','BANK','THEATER','BOOTS & SADDLES','BAKERY','GROCERY','BARBER','HOTEL','POST OFFICE','LUMBER','SADDLERY','PHOTO','IMPLEMENTS','FLORIST'];
const W_SHOPS=['COFFEE','SURF SHOP','TAQUERIA','BOOKS','OUTFITTERS','BAKERY','CHOWDER HOUSE','GALLERY','HARDWARE','THEATER','BANK','GROCERY','KITE SHOP','DINER','BIKE SHOP','POST OFFICE','ICE CREAM','HOTEL'];
const P_SHOPS=['SHAVE ICE','SURF SHOP','POKE BAR','BOOKS','DIVE SHOP','BAKERY','PLATE LUNCH','GALLERY','HARDWARE','THEATER','BANK','GROCERY','UKULELE SHOP','DINER','BIKE RENTAL','POST OFFICE','FLOWER SHOP','COFFEE'];
const C_SHOPS=['PANADERÍA','COLMADO','CAFÉ','FARMACIA','LIBRERÍA','HELADOS','RESTAURANTE','FERRETERÍA','BANCO','TEATRO','CORREO','MERCADO','MÚSICA','BARBERÍA','BICICLETAS','ARTESANÍAS','FLORES','SUPERMERCADO'];
const C_SHOPCOL=['#f2c6a0','#bfe0d8','#f4e2a1','#e9b8c4','#c9d7f0','#f6d3a8','#d7ecc1','#f0c0a8','#e8d4f0'];
const P_SHOPCOL=['#f3e1c4','#cfe6e0','#f2c9b4','#e8e0a8','#bfe0ea','#f4d6d8','#d8e8c0','#f6ead2','#e6c8a0'];
const W_SHOPCOL=['#e9d8b8','#d9a98a','#c9d6c8','#e6c79c','#b9cdd8','#e8d0c4','#d4b48c','#f0e6d0','#c6b49a'];
const CEN_SHOPCOL=['#a8553f','#b8694c','#c9a27a','#d8c6a2','#8e4a3a','#b07d58','#cdb592','#9b5d48','#e0d2b4'];
const SHOP_NAMES=['CAFÉ','BOOKS','MARKET','BAKERY','FLORIST','HARDWARE','PHARMACY','DINER','ICE CREAM','SURF SHOP','DELI','GALLERY','OUTFITTERS','BIKES','BAIT & TACKLE'];
const HOTEL_NAMES=['SEA BREEZE','THE ATLANTIC','SANDPIPER INN','OCEAN VIEW','THE GULL','DUNES HOTEL'];
const BCOL={row:['#e8b4a0','#f1d9a6','#b9d3c2','#c8d6e6','#f0c9cf','#e7e1cf','#d8c3e3','#f3e3b5'],brick:['#a8553f','#b8694c','#8e4a3a','#c08a6a','#9b5d48'],
  office:['#7b93a3','#8aa0ad','#6f8796','#9aa9b0'],hotel:['#f3efe6','#f1e2c8','#d9ecec','#f5d7c4','#e4eef5'],shop:['#e9e2d0','#c9dccb','#e7c9a5','#d6dbe3','#f0d8c8','#d9cbb2'],
  awn:[['#c23b2e','#f4efe4'],['#2f6b5a','#f4efe4'],['#2d55a8','#f4efe4'],['#e3a23b','#7a3b22'],['#7b3f6a','#f4efe4'],['#3a9d8f','#f6e7c6']]};
const BKIND={bcot:'Cottage',bfarm:'Farmhouse',bbarn:'Stone barn',vshop:'Village shop',pub:'Pub',parish:'Parish church',manor:'Manor house',castle:'Castle',ruin:'Ruined castle',abbey:'Abbey ruins',distillery:'Distillery',tenement:'Tenement',georgian:'Georgian townhouse',terrace:'Victorian terrace',clocktower:'Clock tower',domecath:'Cathedral',colonial:'Colonial townhouse',catedral:'Cathedral',alcaldia:'Town hall',mission:'Mission-style hall',adobe:'Mission-style shop',craftsman:'Craftsman bungalow',lanaishop:'Plantation-era storefront',pcottage:'Plantation cottage',lanaihall:'City hall',courthouse:'County courthouse',elevator:'Grain elevator',watertower:'Water tower',beachhouse:'Beach house',home:'House',cabin:'Cabin in the woods',ranger:'Ranger station',station:'Research station',tower:'Fire lookout',mill:'Old mill',store:'General store',marina:'Marina office',ferry:'Ferry terminal',rowhouse:'Rowhouse',apartment:'Apartment block',office:'Office tower',hotel:'Beach hotel',shop:'Shop with flat above',church:'Church',barn:'Gambrel barn',house:'Farmhouse',silo:'Silo',shed:'Machine shed',lighthouse:'Lighthouse',cottage:"Keeper's cottage",bait:'Bait shop',lifeguard:'Lifeguard stand',kiosk:'Pier kiosk'};
// each city block: one row of buildings along its south side, facing the street, with a parking lot or a yard behind
const CITY_LOTS=[];
{const r=rng(31337),pick=a=>a[Math.floor(r()*a.length)];let shopI=0,hotelI=0;
  const TOWERS=CENTRAL?{'4,1':{floors:16,col:'#8a7a63',name:'Plains Bank'},'3,4':{floors:12,col:'#7b8c92',name:'Grain Exchange'}}:{'4,2':{floors:30,col:'#5f8199',name:'Harbor Tower'},'4,3':{floors:24,col:'#6e8a99',name:'Bostick Trust'}};
  let cenShop=0;const nb=(zone,i,j,first)=>{let b;
    if(zone==='main')return{kind:'shop',w:70+r()*55,floors:1+(r()<.55?1:0),d:110+r()*30,att:true};
    if(zone==='res'&&i===0&&j===2&&first)b={kind:'church',w:150,h:9,roof:'gableS',col:'#f2efe7',trim:'#d9d4c6',roofCol:'#5d6670',d:150};
    else if(zone==='res'){if(r()<.25)b={kind:'apartment',w:90+r()*40,floors:4+Math.floor(r()*2),d:120};else{const f=r()<.4?4:3;b={kind:'rowhouse',w:52+r()*20,floors:f,col:pick(BCOL.row),trim:'#f6f3ea',shut:pick(['#2f4a3a','#30465e','#5a3a2e','#3c3c3c']),door:pick(['#2f4a3a','#7a2e2a','#30465e','#1e1f20']),d:110};b.att=true}}
    else if(zone==='mixed')b=r()<.5?{kind:'shop',w:80+r()*50,floors:2+(r()<.5?1:0),d:120}:{kind:'apartment',w:110+r()*60,floors:4+Math.floor(r()*3),d:130};
    else if(zone==='down')b=r()<.3?{kind:'shop',w:80+r()*50,floors:2+Math.floor(r()*2),d:120}:{kind:'office',w:120+r()*80,floors:6+Math.floor(r()*6),d:140};
    else b=r()<.25?{kind:'shop',w:80+r()*40,floors:2,d:110}:{kind:'hotel',w:150+r()*90,floors:4+Math.floor(r()*3),d:140};
    return b};
  const dress=b=>{b.roof=b.roof||'flat';b.h=b.h||b.floors*STORY;
    if(b.kind==='shop'){b.col=pick(BCOL.shop);b.awn=pick(BCOL.awn);b.sign=SHOP_NAMES[shopI++%14];b.trim='#f4f1e8'}
    if(b.kind==='apartment'){b.col=pick(BCOL.brick);b.trim='#e9e3d6';b.fire=r()<.6;b.tank=r()<.5}
    if(b.kind==='office'&&!b.col){b.col=pick(BCOL.office);b.trim='#d7d6d0'}
    if(b.kind==='hotel'){b.col=pick(BCOL.hotel);b.trim='#ffffff';b.sign=HOTEL_NAMES[hotelI++%HOTEL_NAMES.length];b.awn=pick(BCOL.awn)}
    if(CENTRAL&&b.kind==='shop'){b.col=pick(CAR?C_SHOPCOL:PAC?P_SHOPCOL:WEST?W_SHOPCOL:CEN_SHOPCOL);{const SN=CAR?C_SHOPS:PAC?P_SHOPS:WEST?W_SHOPS:CEN_SHOPS;b.sign=SN[cenShop++%SN.length]}b.parapet=true;b.trim=r()<.5?'#efe6d2':'#d9cdb0'}
    b.roofTone=b.roofTone||pick(['#8f8c86','#7d7b77','#a6a39b','#6f6d69']);return addB(b)};
  // a row of buildings along one face of the block; y0 = the face line, dir +1 = facing south (row sits above y0), -1 = facing north
  const row=(zone,i,j,sx0,sx1,yFace,south,dCap)=>{let x=sx0,first=true,dmax=0;
    while(x<sx1-40){const b=nb(zone,i,j,first&&south);if(sx1-(x+b.w)<45)b.w=sx1-x;if(b.w<40)break;b.d=Math.min(b.d,dCap);if(b.d<60)break;
      b.x=x;b.y=south?yFace-b.d:yFace;dress(b);dmax=Math.max(dmax,b.d);x+=b.w+(b.att?0:8+r()*10);first=false}return dmax};
  // CT1 Cottonwood: one block of Main Street all round the courthouse square, houses on the outer blocks, the co-op elevator by Trail Rd
  const cenBlock=(i,j,bx0,bx1,by0,by1)=>{
    if(i===2&&j===1){const w=210,d=150;addB({kind:'courthouse',w,d,h:11,floors:3,x:Math.round((bx0+bx1)/2-w/2),y:Math.round((by0+by1)/2-d/2),col:CAR?'#f4dcae':PAC?'#f4ead6':WEST?'#efe2c6':'#ddd1b3',trim:'#f3ecdb',roof:'flat',roofTone:'#8f948f',bh:1.15,sign:CAR?'ALCALDÍA':BIGM?'CITY HALL':'COUNTY COURTHOUSE'});return}
    if(i>=1&&i<=3){const dS=row('main',i,j,bx0,bx1,by1,true,150),room=by1-by0-dS-14;let dN=0;if(room>=70)dN=row('main',i,j,bx0,bx1,by0,false,Math.min(140,room));
      const ly0=by0+dN+(dN?6:0),ly1=by1-dS-6;if(ly1-ly0>24)CITY_LOTS.push({x0:bx0,x1:bx1,y0:ly0,y1:ly1,kind:'parking'});return}
    if(i===0&&j===2&&!BIGM){CITY_LOTS.push({x0:bx0-6,x1:bx1+6,y0:by0-6,y1:by1+6,kind:'gravel'});const sw=62;let x=bx0+18;
      for(let k=0;k<4;k++){addB({kind:'silo',x:Math.round(x),y:by0+64,w:sw,d:sw,h:27,bh:.85,col:'#e4ddce',roofCol:'#d2cbbb',grain:true});x+=sw+2}
      addB({kind:'elevator',x:Math.round(x+4),y:by0+44,w:92,d:92,h:36,bh:.85,col:'#d8d1c0',trim:'#efe9da',roof:'flat',roofTone:'#aaa497',floors:1,sign:'CO-OP'});
      addB({kind:'shed',x:bx0+30,y:by1-104,w:210,d:88,h:5.5,roof:'gableE',col:'#9aa3a6',roofCol:'#7f888b'});return}
    const tower=i===4&&j===0&&!BIGM;CITY_LOTS.push({x0:bx0-6,x1:bx1+6,y0:by0-6,y1:by1+6,kind:'lawn'});
    const HC=['#f1ede3','#e6dcc4','#d7e0d3','#e9d6c4','#cfd9e2','#f3e6c4','#e2d2d9','#d9d2c0','#c9d3bd'],RC=['#5d6670','#7a4a3a','#4f5d55','#8a8478','#6b5d50'];
    for(const south of[true,false]){if(tower&&!south)continue;let x=bx0+12,first=true;
      while(x<bx1-100){if(i===0&&j===0&&south&&first){addB({kind:'church',x:Math.round(x),y:by1-26-150,w:150,d:150,h:9,roof:'gableS',col:'#f2efe7',trim:'#d9d4c6',roofCol:'#5d6670'});x+=196;first=false;continue}
        const w=100+r()*22,d=78+r()*12,lot=w+38+r()*24;if(x+w>bx1-8)break;const y=south?by1-34-d:by0+34;first=false;
        addB({kind:'home',x:Math.round(x),y:Math.round(y),w:Math.round(w),d:Math.round(d),h:6.5,roof:'gableE',col:pick(HC),trim:'#f6f3ea',roofCol:pick(RC),shut:pick(['#2f4a3a','#30465e','#5a3a2e','#3c3c3c']),door:pick(['#2f4a3a','#7a2e2a','#30465e','#1e1f20']),porch:r()<.75});
        if(r()<.7)PLANTED.trees.push({x:x+w+(lot-w)/2,y:south?by1-58:by0+58,type:ISLE?'palm':'decid',h:10+r()*5,r:ISLE?5:7});x+=lot}}
    const my=(by0+by1)/2,tx=(bx0+bx1)/2;for(let x=bx0+50;x<bx1-30;x+=105+r()*60)if(r()<.7&&!(tower&&Math.abs(x-tx)<90))PLANTED.trees.push({x,y:my+(r()-.5)*24,type:ISLE?'palm':'decid',h:11+r()*6,r:ISLE?5:7});
    if(tower)addB({kind:'watertower',x:Math.round(tx-34),y:by0+40,w:68,d:68,h:30,bh:.85,col:'#d3dde0',roofCol:'#9fb0b6',sign:'COTTONWOOD'})};
  // TW/TP/TC: the West, Pacific and Caribbean towns (version 53). Each block is built in its own style; Cottonwood keeps cenBlock.
  const TPAL={british:{},mission:{shop:['#f4ede0','#efe2c8','#f2e6d4','#e9d8bc','#e8cfa8','#f3ead8'],house:['#a89a72','#8e7a5c','#b7a27a','#7f8a68','#c9b48a','#9a6e4e','#6f7f73'],
      roof:['#b5543a','#a8462f','#c0603f'],hroof:['#4a3a2e','#5a4a3a','#3f4a3c','#6b4e36'],trim:'#f4ede0',door:['#5a3a24','#2f4a3a','#6b2f24']},
    plantation:{shop:['#f3e1c4','#cfe6e0','#f2c9b4','#e8e0a8','#bfe0ea','#f4d6d8','#d8e8c0','#f6ead2'],house:['#f6efe0','#e6efe0','#f4e4cc','#dfe9ee','#f3dede','#e9f0d8','#fff4dc'],
      roof:['#a8352b','#3f6b4a','#2f6f7a','#8f9a9e','#b0472f','#4f7f5a'],trim:'#ffffff',door:['#2f6b5a','#7a2e2a','#2f5a7a']},
    colonial:{wall:['#f2a65a','#5aa9c4','#f4d35e','#e86f6f','#7cc29a','#f7f0e1','#9b8ec7','#f29ec0','#6fb1d6','#e8b04a','#ef8f5f','#8fd0c4'],trim:'#f7f3ea',
      shut:['#2f6b5a','#2e4f8a','#6b2f24','#3d6e3a','#1f5f6b','#7a5a2a'],door:['#4a2e1e','#2f6b5a','#2e4f8a']}};
  const TP=TPAL[TSTYLE];let tShop=0;
  const SNAMES=BRI?['SHOP']:CAR?C_SHOPS:PAC?P_SHOPS:W_SHOPS;
  const tree=(x,y,o)=>PLANTED.trees.push({x,y,...o}),deco=(k,x,y)=>PLANTED.decor.push({k,x,y,s:r()});
  // TC: a run of painted townhouses wall to wall along one face of the block
  const colRow=(bx0,bx1,yFace,south,dCap,shops)=>{let x=bx0,last='';while(x<bx1-30){let w=58+r()*44;if(bx1-(x+w)<46)w=bx1-x;if(w<30)break;
      let col=pick(TP.wall);if(col===last)col=pick(TP.wall);last=col;const fl=2+(r()<.4?1:0),d=Math.min(dCap,110+r()*30);
      addB({kind:'colonial',x:Math.round(x),y:Math.round(south?yFace-d:yFace),w:Math.round(w),d:Math.round(d),h:fl*STORY,floors:fl,roof:'flat',roofTone:pick(['#d9d2c4','#c9a48a','#e2ddd2','#b98a6a']),
        col,trim:TP.trim,shut:pick(TP.shut),door:pick(TP.door),parapet:true,sign:shops&&r()<.55?SNAMES[tShop++%SNAMES.length]:null,bou:r()<.25});x+=w}};
  // B-T Kingsport (version 58): red-brick Victorian terraces, Georgian squares, the clock tower, the domed cathedral and Kingsgate Gardens
  const B_SHOPS=['TEA ROOM','BOOKSHOP','CHEMIST','BAKERY','NEWSAGENT','FISH & CHIPS','GREENGROCER','IRONMONGER','POST OFFICE','BANK','BUTCHER','CAFÉ','FLORIST','HABERDASHER','OPTICIAN','CHEESEMONGER','DELI','RECORD SHOP','TOY SHOP','THE KING’S ARMS'];
  const B_BRICK=['#a5543c','#9a4a36','#b0624a','#8f4a38','#a85a42','#c4795a'],B_SHOPC=['#1f3a2a','#3a1f2a','#1f2f4a','#6b1f24','#2f4a5a','#4a3a1f','#2a2a2a'];let bShop=0;
  const brRow=(bx0,bx1,yFace,south,dCap,shops,fl)=>{let x=bx0;while(x<bx1-30){let w=48+r()*14;if(bx1-(x+w)<36)w=bx1-x;if(w<28)break;const d=Math.min(dCap,100+r()*20),f=fl||2+(r()<.35?1:0),col=pick(B_BRICK);
      addB({kind:'terrace',x:Math.round(x),y:Math.round(south?yFace-d:yFace),w:Math.round(w),d:Math.round(d),h:f*STORY,floors:f,roof:'gableE',roofCol:'#4a4f57',col,door:pick(BR_DOORS),
        sign:shops&&r()<.8?B_SHOPS[bShop++%B_SHOPS.length]:null,shop:pick(B_SHOPC)});x+=w}};
  const geoRow=(bx0,bx1,yFace,south,dCap)=>{for(let x=bx0;x<bx1-60;x+=64){const d=Math.min(dCap,110);addB({kind:'georgian',x:Math.round(x),y:Math.round(south?yFace-d:yFace),w:64,d,h:STORY*3.4,floors:3,roof:'flat',roofTone:'#5a5f66',col:'#e6dcc6',trim:'#f4efe2',door:pick(['#1d1f2a','#2f4a3a','#6b1f24','#1f2f4a']),parapet:true})}};
  const brBlock=(i,j,bx0,bx1,by0,by1)=>{const cx=(bx0+bx1)/2,cy=(by0+by1)/2,W=bx1-bx0,D=by1-by0,main=i>=1&&i<=3;
    if(i===2&&j===1){// Kingsgate Gardens: lawns, gravel walks, a bandstand, plane trees and oaks
      deco('bandstand',cx,cy+10);for(let a=0;a<TAU;a+=TAU/14){const tx=cx+Math.cos(a)*(W/2-30),ty=cy+Math.sin(a)*(D/2-30);tree(tx,ty,{type:a%(TAU/7)<.1?'oak':'decid',h:13+r()*5,r:8})}
      for(const [dx,dy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){deco('lamp',cx+dx*60,cy+dy*50);deco('bench',cx+dx*110,cy+dy*30)}tree(cx-W*.28,cy+D*.18,{type:'willow',h:10,r:7});return}
    if(i===2&&j===0){const w=90,d=90;addB({kind:'clocktower',x:Math.round(cx-w/2),y:by1-d,w,d,h:30,roof:'flat',roofTone:'#7a766c',col:'#cfc4a8'});brRow(bx0,cx-w/2-6,by1,true,130,true);brRow(cx+w/2+6,bx1,by1,true,130,true);brRow(bx0,bx1,by0,false,110,true);
      CITY_LOTS.push({x0:bx0,x1:bx1,y0:by0+110,y1:by1-130,kind:'gravel'});return}
    if(i===2&&j===2){const w=300,d=200;addB({kind:'domecath',x:Math.round(cx-w/2),y:by0,w,d,h:13,roof:'flat',roofTone:'#9a978e',col:'#e2dccb'});brRow(bx0,cx-w/2-8,by0,false,120,true);brRow(cx+w/2+8,bx1,by0,false,120,true);brRow(bx0,bx1,by1,true,110,true);return}
    if((i===1||i===3)&&j===2){geoRow(bx0,bx1,by0,false,110);geoRow(bx0,bx1,by1,true,110);CITY_LOTS.push({x0:bx0,x1:bx1,y0:by0+110,y1:by1-110,kind:'lawn'});for(let x=bx0+50;x<bx1-30;x+=90)tree(x,cy,{type:'decid',h:12+r()*4,r:8});return}
    if(main){const dS=Math.min(130,Math.floor(D*.45)),dN=Math.min(120,Math.floor(D*.42));brRow(bx0,bx1,by1,true,dS,true,3);brRow(bx0,bx1,by0,false,dN,true,3);CITY_LOTS.push({x0:bx0,x1:bx1,y0:by0+dN+4,y1:by1-dS-4,kind:'gravel'});return}
    const dS=Math.min(110,Math.floor(D*.38)),dN=Math.min(110,Math.floor(D*.38));brRow(bx0,bx1,by1,true,dS,false);brRow(bx0,bx1,by0,false,dN,false);
    CITY_LOTS.push({x0:bx0,x1:bx1,y0:by0+dN+4,y1:by1-dS-4,kind:'lawn'});for(let x=bx0+40;x<bx1-20;x+=70+r()*50)if(r()<.6)tree(x,cy+(r()-.5)*30,{type:r()<.5?'hawthorn':'decid',h:r()<.5?5:10,r:5})};
  const styleBlock=(i,j,bx0,bx1,by0,by1)=>{if(TSTYLE==='british')return brBlock(i,j,bx0,bx1,by0,by1);const cx=(bx0+bx1)/2,cy=(by0+by1)/2,W=bx1-bx0,D=by1-by0;
    // ---- the square in the middle of town
    if(i===2&&j===1){
      if(TSTYLE==='mission'){// TW1 Madrone Plaza: mission City Hall along the north side, paved plaza with a tiled fountain, fan palms at the corners
        const w=Math.min(380,W-60),d=150;addB({kind:'mission',w,d,h:7.5,floors:2,x:Math.round(cx-w/2),y:by0+14,col:'#f6f1e6',trim:'#efe6d6',roof:'gableE',tile:true,roofCol:'#b5543a',sign:'CITY HALL'});
        const py=by0+14+d+(by1-by0-14-d)/2;deco('fountain',cx,py+10);
        for(const [dx,dy] of[[-1,-1],[1,-1],[-1,1],[1,1]])tree(cx+dx*(W/2-40),py+dy*((by1-by0-14-d)/2-34)+10,{type:'palm',v:'fan',h:17+r()*4,r:4});
        for(const dx of[-1,1]){deco('bench',cx+dx*110,py-40);deco('bench',cx+dx*110,py+70);deco('lamp',cx+dx*60,py-70);deco('bougain',cx+dx*(w/2+18),by0+14+d+6)}return}
      if(TSTYLE==='plantation'){// TP1 Banyan Court: one giant banyan fills the square, benches and lamps round it
        tree(cx,cy+30,{type:'banyan',h:16,r:20});
        for(let a=0;a<TAU;a+=TAU/8){deco('bench',cx+Math.cos(a)*(W/2-34),cy+Math.sin(a)*(D/2-34))}
        for(const [dx,dy] of[[-1,-1],[1,-1],[-1,1],[1,1]])deco('lamp',cx+dx*(W/2-16),cy+dy*(D/2-16));return}
      // TC1 Plaza de Armas: paved, a fountain in the middle, flamboyán in planters, royal palms at the corners
      deco('fountain',cx,cy+10);
      for(const [dx,dy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){tree(cx+dx*(W/2-30),cy+dy*(D/2-30),{type:'palm',v:'royal',h:15+r()*3,r:4});deco('bench',cx+dx*90,cy+dy*80)}
      for(const dx of[-1,1])tree(cx+dx*(W/2-30),cy+10,{type:'flambo',h:8,r:8});
      for(const dx of[-1,1])for(const dy of[-1,1])deco('lamp',cx+dx*50,cy+dy*60);return}
    // ---- landmarks facing the square from across the street
    if(TSTYLE==='plantation'&&i===2&&j===0){// TP2 City Hall faces Banyan Court
      const w=Math.min(300,W-40),d=150;addB({kind:'lanaihall',w,d,h:2*STORY,floors:2,x:Math.round(cx-w/2),y:by1-d,col:'#f8f6f0',trim:'#ffffff',roof:'hip',metal:true,roofCol:'#3f6b4a',door:'#5a3424',sign:'CITY HALL'});
      for(const x of[bx0+30,bx1-30])tree(x,by1-30,{type:'palm',h:12+r()*3,r:5});CITY_LOTS.push({x0:bx0-6,x1:bx1+6,y0:by0-6,y1:by1+6,kind:'lawn'});return}
    if(TSTYLE==='colonial'&&i===2&&j===0){// TC2 the Catedral faces the Plaza de Armas, townhouses either side
      const w=210,d=180;addB({kind:'catedral',w,d,h:11,floors:3,x:Math.round(cx-w/2),y:by1-d,col:'#f4ead2',trim:'#ffffff',roof:'flat',roofTone:'#d8cdb8',roofCol:'#c0603f'});
      colRow(bx0,cx-w/2-8,by1,true,150,true);colRow(cx+w/2+8,bx1,by1,true,150,true);colRow(bx0,bx1,by0,false,100,false);CITY_LOTS.push({x0:bx0,x1:bx1,y0:by0+100,y1:by1-150,kind:'patio'});return}
    if(TSTYLE==='colonial'&&i===1&&j===0){// TC3 the Alcaldía, its arcade on the street along the plaza's north side
      const w=Math.min(260,W-30),d=140;addB({kind:'alcaldia',w,d,h:2*STORY,floors:2,x:Math.round(cx-w/2),y:by1-d,col:'#f7f0e1',trim:'#ffffff',roof:'flat',roofTone:'#d9d2c4',sign:'ALCALDÍA'});
      colRow(bx0,cx-w/2-6,by1,true,140,true);colRow(cx+w/2+6,bx1,by1,true,140,true);colRow(bx0,bx1,by0,false,100,false);CITY_LOTS.push({x0:bx0,x1:bx1,y0:by0+100,y1:by1-140,kind:'patio'});return}
    if(TSTYLE==='mission'&&i===0&&j===2){// TW5 the old mission chapel on the edge of town
      const w=170,d=150;addB({kind:'mission',w,d,h:7,floors:1,chapel:true,x:Math.round(cx-w/2),y:by1-26-d,col:'#f6f1e6',trim:'#efe6d6',roof:'gableE',tile:true,roofCol:'#a8462f',sign:''});
      CITY_LOTS.push({x0:bx0-6,x1:bx1+6,y0:by0-6,y1:by1+6,kind:'lawn'});for(const x of[bx0+30,bx1-30])tree(x,by1-40,{type:'palm',v:'fan',h:18,r:4});deco('agave',cx-110,by0+60);deco('agave',cx+120,by0+70);return}
    const main=i>=1&&i<=3;
    // ---- TC: every block is townhouses wall to wall, a shared patio inside
    if(TSTYLE==='colonial'){const dS=Math.min(150,Math.floor(D*.45)),dN=Math.min(130,Math.floor(D*.42));colRow(bx0,bx1,by1,true,dS,main);colRow(bx0,bx1,by0,false,dN,main);
      const ly0=by0+dN+4,ly1=by1-dS-4;if(ly1-ly0>20){CITY_LOTS.push({x0:bx0,x1:bx1,y0:ly0,y1:ly1,kind:'patio'});for(let x=bx0+50;x<bx1-30;x+=110+r()*60)tree(x,(ly0+ly1)/2,r()<.5?{type:'flambo',h:6+r()*2,r:6}:{type:'palm',v:'royal',h:11+r()*3,r:4})}
      for(let x=bx0+40;x<bx1-20;x+=70+r()*70)if(r()<.45)deco('bougain',x,by1+4);return}
    // ---- main-street shops
    if(main){const row=(yFace,south,dCap)=>{let x=bx0,dm=0;while(x<bx1-40){let w=TSTYLE==='plantation'?96+r()*44:84+r()*50;if(bx1-(x+w)<50)w=bx1-x;if(w<44)break;
          const d=Math.min(dCap,TSTYLE==='plantation'?120:110+r()*30),fl=TSTYLE==='plantation'?2:1+(r()<.45?1:0),y=Math.round(south?yFace-d:yFace);
          if(TSTYLE==='plantation')addB({kind:'lanaishop',x:Math.round(x),y,w:Math.round(w),d:Math.round(d),h:fl*STORY,floors:fl,roof:'hip',metal:true,roofCol:pick(TP.roof),col:pick(TP.shop),trim:TP.trim,door:pick(TP.door),sign:SNAMES[tShop++%SNAMES.length]});
          else addB({kind:'adobe',x:Math.round(x),y,w:Math.round(w),d:Math.round(d),h:fl*STORY,floors:fl,roof:'flat',roofTone:pick(['#c9b79a','#bfa98a','#d4c2a2']),parapet:true,roofCol:pick(TP.roof),col:pick(TP.shop),trim:TP.trim,sign:SNAMES[tShop++%SNAMES.length]});
          dm=Math.max(dm,d);x+=w+(TSTYLE==='plantation'?4+r()*8:2+r()*6)}return dm};
        const dS=row(by1,true,140),room=D-dS-14;let dN=0;if(room>=80)dN=row(by0,false,Math.min(130,room));
        const ly0=by0+dN+6,ly1=by1-dS-6;if(ly1-ly0>24)CITY_LOTS.push({x0:bx0,x1:bx1,y0:ly0,y1:ly1,kind:TSTYLE==='mission'?'patio':'parking'});
        if(TSTYLE==='mission'&&ly1-ly0>40)for(let x=bx0+60;x<bx1-40;x+=150+r()*60)tree(x,(ly0+ly1)/2,{type:'liveoak',h:8+r()*3,r:7});return}
    // ---- homes on the outer blocks
    CITY_LOTS.push({x0:bx0-6,x1:bx1+6,y0:by0-6,y1:by1+6,kind:'lawn'});
    for(const south of[true,false]){let x=bx0+12;
      while(x<bx1-100){const w=96+r()*24,d=78+r()*12,lot=w+42+r()*30;if(x+w>bx1-8)break;const y=Math.round(south?by1-34-d:by0+34),yy=south?by1-58:by0+58,tx=x+w+(lot-w)/2;
        if(TSTYLE==='plantation'){addB({kind:'pcottage',x:Math.round(x),y,w:Math.round(w),d:Math.round(d),h:4.6,roof:'hip',metal:true,roofCol:pick(TP.roof),col:pick(TP.house),trim:TP.trim,door:pick(TP.door),porch:r()<.8});
          const q=r();if(q<.35)tree(tx,yy,{type:'hoak',h:9+r()*3,r:8});else if(q<.65)tree(tx,yy,{type:'palm',h:10+r()*4,r:5});else deco('plumeria',tx,yy);
          deco(r()<.5?'hibiscus':'ti',x+10,south?by1-28:by0+30+d+8);if(r()<.5)deco('hibiscus',x+w-12,south?by1-28:by0+30+d+8)}
        else{addB({kind:'craftsman',x:Math.round(x),y,w:Math.round(w),d:Math.round(d),h:5.5,roof:'gableE',ov:12,roofCol:pick(TP.hroof),col:pick(TP.house),trim:'#efe6d2',door:pick(TP.door),porch:true});
          const q=r();if(q<.45)tree(tx,yy,{type:'liveoak',h:8+r()*4,r:8});else if(q<.7)tree(tx,yy,{type:'palm',v:'fan',h:15+r()*5,r:4});else deco('bougain',tx,yy);
          deco('agave',x+8,south?by1-26:by0+30+d+6);if(r()<.4)deco('agave',x+w-10,south?by1-26:by0+30+d+6)}
        x+=lot}}};
  for(let i=0;i<AVES.length-1;i++)for(let j=0;j<STS.length-1;j++){
    const bx0=AVES[i]+ST_HALF+WALK+6,bx1=AVES[i+1]-ST_HALF-WALK-6,by0=STS[j]+ST_HALF+WALK+6,by1=STS[j+1]-ST_HALF-WALK-6;
    if(CENTRAL){(TSTYLE==='prairie'?cenBlock:styleBlock)(i,j,bx0,bx1,by0,by1);continue}
    if(i===2&&j>=1&&j<=3)continue; // Ellis Park
    if(CENTRAL){let wet=false;for(let yy=by0-30;yy<=by1+30&&!wet;yy+=40)for(let xx=bx0-30;xx<=bx1+30;xx+=40)if(WATERK[wcode(xx,yy)]){wet=true;break}if(wet)continue}
    let rmin=1e9,rmax=-1e9;for(let y=by0-60;y<=by1+60;y+=20){rmin=Math.min(rmin,roadX(y));rmax=Math.max(rmax,roadX(y))}
    const segs=[],gL=rmin-ROAD_HALF-WALK-8,gR=rmax+ROAD_HALF+WALK+8;
    if(gR>bx0&&gL<bx1){if(gL-bx0>70)segs.push([bx0,gL]);if(bx1-gR>70)segs.push([gR,bx1])}else segs.push([bx0,bx1]);
    const zone=CENTRAL?(i===0||i===5?'res':i===1||i===2?'mixed':'down'):i<=1?'res':i===2?'mixed':i<=4?'down':'beach';
    for(const [sx0,sx1] of segs){
      const TW=TOWERS[i+','+j];
      if(TW&&sx1-sx0>240){const w=Math.min(330,sx1-sx0-30),d=Math.min(230,by1-by0-30);
        dress({kind:'office',tower:true,name:TW.name,floors:TW.floors,w,d,x:Math.round((sx0+sx1)/2-w/2),y:Math.round((by0+by1)/2-d/2+10),col:TW.col,trim:'#e6e8ea',bh:.8,roofTone:'#7a7f84'});
        CITY_LOTS.push({x0:sx0,x1:sx1,y0:by0,y1:Math.round((by0+by1)/2-d/2),kind:'plaza'});continue}
      const dS=row(zone,i,j,sx0,sx1,by1,true,150);
      const room=by1-by0-dS-14;let dN=0;if(room>=70&&!(zone==='res'&&r()<.2))dN=row(zone,i,j,sx0,sx1,by0,false,Math.min(140,room));
      // what is left between the two rows: a service alley, now and then a small garden
      const ly0=by0+dN+(dN?6:0),ly1=by1-dS-6;if(ly1-ly0>24){const kind=zone==='res'&&(dN===0||r()<.25)?'yard':'parking';CITY_LOTS.push({x0:sx0,x1:sx1,y0:ly0,y1:ly1,kind});
        if(kind==='yard')for(let x=sx0+30;x<sx1-20;x+=80+r()*50){const ty=(ly0+ly1)/2+(r()-.5)*Math.max(0,ly1-ly0-40);PLANTED.trees.push({x,y:ty,type:'decid',h:8+r()*5,r:6})}}}}}
function cityLotAt(x,y){for(const l of CITY_LOTS)if(x>l.x0&&x<l.x1&&y>l.y0&&y<l.y1)return l;return null}
/* British buildings (B-A1..A16). Styles by country: thatch (the Downs), honey stone (Ashcombe), slate and grey stone (Wales, the Lakes, the Dales),
   brick (the Fens, the Midlands), whitewash (the south-west), harled white (the Highlands), blackhouse (the Hebrides), red pantiles (Ravenscar) */
function brBuilding(k,x,y,sign,C,r,pick){
  if(k==='bcot'){const st=sign||'honey',S=BR_ST[st];C({kind:'bcot',w:S.low?130:100+r()*24,d:S.low?72:78,h:S.low?3:4.8,roof:'gableE',ov:S.thatch?9:5,col:S.wall,roofCol:S.roof,thatch:!!S.thatch,stone:!!S.stone,brick:!!S.brick,style:st,door:pick(BR_DOORS),chim:!S.low,roses:r()<.45&&(st==='thatch'||st==='honey'||st==='white')},x,y);return true}
  if(k==='pub'){const st=y>29500&&x<16000?'thatch':brStyleAt(x,y),S=BR_ST[st];C({kind:'pub',w:180,d:100,h:6,floors:2,roof:'gableE',ov:S.thatch?9:5,col:st==='brick'?S.wall:'#efe8d6',roofCol:S.roof,thatch:!!S.thatch,beams:st==='thatch'||st==='honey',chim:true,sign:sign||'THE CROWN',door:'#2a2a2a'},x,y);return true}
  if(k==='parish'){const st=brStyleAt(x,y),col=st==='brick'?'#9a948a':st==='harl'?'#e9e6de':BR_ST[st].wall;
    C({kind:'parish',w:sign==='chapel'||sign==='kirk'?150:210,d:100,h:sign==='chapel'?7.5:6.5,roof:'gableE',col,roofCol:'#4a4f57',trim:'#cfc8b8',ptype:sign||'tower',stone:st!=='harl'},x,y);
    if(sign!=='crown')for(let i=0;i<7;i++)PLANTED.decor.push({k:'stone',x:x-90+(i%4)*55+r()*20,y:y+90+Math.floor(i/4)*36,s:.1+r()*.2});return true}
  if(k==='vshop'){const st=brStyleAt(x,y),S=BR_ST[st];C({kind:'vshop',w:124,d:80,h:4.8,roof:'gableE',col:S.wall,roofCol:S.roof,stone:!!S.stone,brick:!!S.brick,chim:true,sign:sign||'POST OFFICE',door:pick(BR_DOORS)},x,y);
    PLANTED.decor.push({k:'phonebox',x:x+80,y:y+64,s:.5},{k:'postbox',x:x-40,y:y+58,s:.5});return true}
  if(k==='bfarm'){const S=BR_ST[sign||'honey'];C({kind:'bfarm',w:150,d:100,h:6.6,floors:2,roof:'gableE',ov:S.thatch?9:5,col:S.wall,roofCol:S.roof,thatch:!!S.thatch,stone:!!S.stone,brick:!!S.brick,chim:true,door:pick(BR_DOORS)},x,y);return true}
  if(k==='bbarn'){const S=BR_ST[sign||'honey'];C({kind:'bbarn',w:190,d:110,h:6,roof:'gableE',col:shadeHex(S.wall,-.1),roofCol:S.thatch?'#6a6f74':S.roof,stone:!!S.stone,brick:!!S.brick},x,y);return true}
  if(k==='manor'){C({kind:'manor',w:420,d:180,h:10,floors:3,roof:'hip',roofCol:'#5a5f66',col:'#d9c9a5',trim:'#f2ecdc',chim:true,sign:sign||''},x,y);return true}
  if(k==='castle'){C({kind:'castle',w:420,d:300,h:9,roof:'flat',roofTone:'#7a766c',col:'#8f8a80',trim:'#a8a398',sign:sign||''},x,y);return true}
  if(k==='ruin'){C({kind:'ruin',w:130,d:130,h:10,roof:'flat',roofTone:'#5f6a4a',col:'#8a857a',trim:'#9a958a'},x,y);return true}
  if(k==='abbey'){C({kind:'abbey',w:340,d:150,h:10,roof:'flat',roofTone:'#6f8a4a',col:'#a39a8a',trim:'#b8ae9c'},x,y);return true}
  if(k==='distillery'){C({kind:'distillery',w:300,d:140,h:6.5,floors:2,roof:'gableE',col:'#f2f0ea',roofCol:'#3f454d',sign:sign||'DISTILLERY'},x,y);return true}
  if(k==='tenement'){C({kind:'tenement',w:150,d:118,h:STORY*5,floors:5,roof:'gableE',col:pick(['#8e8a82','#9a948a','#7f7b74','#a39b8c']),roofCol:'#3f454d',chim:true,door:pick(BR_DOORS)},x,y);return true}
  if(k==='georgian'){C({kind:'georgian',w:128,d:110,h:STORY*3.4,floors:3,roof:'flat',roofTone:'#5a5f66',col:pick(['#d9c9a5','#dccfae','#cfbf9a']),trim:'#f2ecdc',door:pick(['#1d1f2a','#2f4a3a','#6b1f24','#1f2f4a']),parapet:true},x,y);return true}
  if(k==='bothy'){C({kind:'bcot',w:80,d:60,h:3.2,roof:'gableE',col:'#8a857a',roofCol:'#3f454d',stone:true,style:'grey',door:'#4a3a2a'},x,y);return true}
  return false}
{ // buildings outside the city, from the World Plan
  const lh=WD.buildings.find(b=>b[0]==='lighthouse');let keeper=CENTRAL;const r=rng(9091),pick=a=>a[Math.floor(r()*a.length)];
  const BEACH=['#f3efe6','#cfe0e6','#f1dcc0','#e6d4dc','#d9e6d2','#f4e6b8','#c9d6e8'],ROOFS=['#5d6670','#7a4a3a','#4f5d55','#8a8478'];
  const C=(o,x,y)=>addB({...o,x:Math.round(x-o.w/2),y:Math.round(y-o.d/2)});
  for(let [k,x,y,sign] of WD.buildings){if(k==='marina'&&!CENTRAL)y=17900;if(BRI&&brBuilding(k,x,y,sign,C,r,pick))continue;
    if(k==='hotel'){C({kind:'hotel',w:420,d:130,h:13,floors:4,roof:'flat',col:'#f4ecdc',trim:'#ffffff',awn:['#2f8f86','#f6efe0'],sign:sign||'RESORT',roofTone:'#b3ada2'},x,y);continue}
    if(k==='bungalow'){C({kind:'beachhouse',w:96,d:90,h:5,roof:'gableE',col:pick(BEACH),trim:'#f6f3ea',roofCol:pick(['#7a4a3a','#5d6670','#4f5d55','#8a6a4a']),shut:pick(['#2f6b5a','#30465e','#5a3a2e']),door:pick(['#2f6b5a','#7a2e2a']),porch:true},x,y);continue}
    if(k==='fort'){C({kind:'station',w:240,d:170,h:6.5,roof:'flat',col:'#cdb48a',trim:'#e9dcc0',roofTone:'#a8956f',sign:'OLD FORT'},x,y);continue}
    if(k==='dryshed'){C({kind:'shed',w:130,d:80,h:4,roof:'gableE',col:'#9a7b5a',roofCol:'#6f6252'},x,y);continue}
    if(k==='clubhouse'){C({kind:'station',w:210,d:110,h:5.5,roof:'gableE',col:'#f2ebd8',trim:'#ffffff',roofCol:'#4f6d55',porch:true,sign},x,y);continue}
    if(k==='lighthouse'){C({kind:'lighthouse',w:60,d:60,h:26,bh:1.35,col:'#f4f1ea',roofCol:'#c23b2e'},x,y);continue}
    if(k==='house'&&CAR){C({kind:'colonial',w:96+r()*20,d:84,h:STORY,floors:1,roof:'flat',roofTone:'#d9d2c4',col:pick(['#f2a65a','#5aa9c4','#f4d35e','#e86f6f','#7cc29a','#9b8ec7','#f29ec0','#6fb1d6']),trim:'#f7f3ea',shut:pick(['#2f6b5a','#2e4f8a','#6b2f24']),door:'#4a2e1e',parapet:true,bou:r()<.4},x,y);continue}
    if(k==='house'&&PAC){C({kind:'pcottage',w:104,d:84,h:4.6,roof:'hip',metal:true,roofCol:pick(['#a8352b','#3f6b4a','#2f6f7a','#8f9a9e']),col:pick(['#f6efe0','#e6efe0','#f4e4cc','#dfe9ee','#f3dede']),trim:'#ffffff',door:pick(['#2f6b5a','#7a2e2a']),porch:true},x,y);continue}
    if(k==='store'&&CAR){C({kind:'colonial',w:150,d:100,h:STORY,floors:1,roof:'flat',roofTone:'#d9d2c4',col:pick(['#f2a65a','#5aa9c4','#f4d35e','#7cc29a']),trim:'#f7f3ea',shut:'#2f6b5a',door:'#4a2e1e',parapet:true,sign:sign||'COLMADO'},x,y);continue}
    if(k==='store'&&PAC){C({kind:'lanaishop',w:150,d:100,h:STORY,floors:1,roof:'hip',metal:true,roofCol:pick(['#a8352b','#3f6b4a']),col:pick(['#f3e1c4','#cfe6e0','#f2c9b4']),trim:'#ffffff',door:'#2f6b5a',sign:sign||'STORE'},x,y);continue}
    if(k==='house'){if(!keeper&&Math.hypot(x-lh[1],y-lh[2])<400){keeper=true;C({kind:'cottage',w:110,d:80,h:6,roof:'gableE',col:'#f4f1ea',trim:'#2f4a3a',roofCol:'#a8352b',shut:'#2f4a3a',door:'#2f4a3a'},x,y);continue}
      const elm=Math.abs(x-(ELM_X+150))<80;C({kind:elm?'home':'beachhouse',w:elm?120:116,d:elm?90:84,h:elm?6.5:6,roof:'gableE',col:pick(BEACH),trim:'#f6f3ea',roofCol:pick(ROOFS),shut:pick(['#2f4a3a','#30465e','#5a3a2e']),door:pick(['#2f4a3a','#7a2e2a','#30465e']),porch:!elm&&r()<.6},x,y);continue}
    if(k==='cabin'){C({kind:'cabin',w:92,d:70,h:5,roof:'gableE',col:'#7a5236',trim:'#e9dcc0',roofCol:'#3f4a3c',shut:'#3f4a3c',door:'#4a3020',porch:r()<.5},x,y);continue}
    if(k==='farmhouse'){C({kind:'house',w:150,d:110,h:7,roof:'gableE',col:'#f1ede3',trim:'#3f5a43',roofCol:'#5d6670',porch:true,shut:'#3f5a43',door:'#7a2e2a'},x,y);continue}
    if(k==='barn'){C({kind:'barn',w:190,d:150,h:10,roof:'gambrel',col:'#a8352b',trim:'#f1ece0',roofCol:'#77807a'},x,y);C({kind:'shed',w:170,d:100,h:5.5,roof:'gableE',col:'#9aa3a6',roofCol:'#7f888b'},x-20,y+150);continue}
    if(k==='silo'){C({kind:'silo',w:56,d:56,h:17,col:'#cfc8b8',roofCol:'#9aa2a6'},x,y);C({kind:'silo',w:48,d:48,h:14,col:'#c4bdad',roofCol:'#9aa2a6'},x+60,y+12);continue}
    if(k==='ranger'){C({kind:'ranger',w:130,d:90,h:5.5,roof:'gableE',col:'#6d7f5a',trim:'#e9dcc0',roofCol:'#3d4a3a',shut:'#3d4a3a',door:'#5a3a2e',porch:true},x,y);continue}
    if(k==='station'){C(sign?{kind:'station',w:170,d:100,h:5,roof:'gableE',col:'#c9a46a',trim:'#f4f1e8',roofCol:'#6b4a33',porch:true}:{kind:'station',w:160,d:100,h:5,roof:'gableE',col:'#d9772f',roofCol:'#9aa3a6'},x,y);continue}
    if(k==='tower'){C({kind:'tower',w:40,d:40,h:14,col:'#8a6b45',roofCol:'#5d6670'},x,y);continue}
    if(k==='mill'){C({kind:'mill',w:150,d:110,h:7.5,roof:'gableE',col:'#9c7a55',trim:'#e9dcc0',roofCol:'#5a4636',shut:'#5a4636',door:'#4a3020'},x,y);continue}
    if(k==='store'){C({kind:'store',w:160,d:100,h:4.5,floors:1,roof:'flat',col:'#e9e2d0',trim:'#f4f1e8',awn:['#2f6b5a','#f4efe4'],sign:sign||'GENERAL STORE',roofTone:'#8f8c86'},x,y);continue}
    if(k==='marina'){C({kind:'marina',w:110,d:70,h:3.6,floors:1,roof:'flat',col:'#cfe3ea',trim:'#ffffff',awn:['#2d55a8','#f4efe4'],sign:'MARINA',roofTone:'#a6a39b'},x,y);continue}
    if(k==='ferry'){C({kind:'ferry',w:140,d:80,h:4,floors:1,roof:'flat',col:'#e9e2d0',trim:'#ffffff',awn:['#3a9d8f','#f6e7c6'],sign:'FERRY',roofTone:'#a6a39b'},x,y);continue}}
  // Mill Pond bait shop by the canoe landing, the pier kiosk, lifeguard stands
  {const L=LAUNCHES.find(l=>l.name==='Mill Pond landing'),d=WD.docks.find(q=>q[1]==='Mill Pond landing');if(L&&d){const dx=L.x-d[2],dy=L.y-d[3],l=Math.hypot(dx,dy)||1;C({kind:'bait',w:100,d:70,h:4.2,roof:'gableS',col:'#8c6a4a',trim:'#e9dcc0',roofCol:'#5a4636',sign:'BAIT & TACKLE'},d[2]-dx/l*150-dy/l*130,d[3]-dy/l*150+dx/l*130)}}
  if(!CENTRAL)addB({kind:'ferry',x:OCEAN_DR+ST_HALF+WALK+24,y:FERRY_Y-170,w:150,d:90,h:4.2,floors:1,roof:'flat',col:'#e9e2d0',trim:'#ffffff',awn:['#2d55a8','#f4efe4'],sign:'FERRY',roofTone:'#a6a39b'});
  if(!CENTRAL){const cx=coastX(PIER_Y);addB({kind:'kiosk',x:cx-280,y:PIER_Y-110,w:96,d:70,h:3.6,col:'#cfe3ea',trim:'#ffffff',awn:['#2d55a8','#f4efe4'],sign:'BAIT · SNACKS'})}
  if(!CENTRAL)for(const y of[CITY.y0+720,CITY.y0+1600])addB({kind:'lifeguard',x:coastX(y)-150,y,w:24,d:24,h:3.2,col:'#f2efe6',roofCol:'#c23b2e'})}
const LH=(()=>{const b=BLD.find(q=>q.kind==='lighthouse');return b?{x:b.x+30,y:b.y+30}:{x:-9999,y:-9999}})();
const LOTS_EXTRA=[];// (reserved)
// a coarse grid so collisions and drawing only look at nearby buildings
const BGRID=new Map();for(const b of BLD){for(let cy=Math.floor(b.y/CELL);cy<=Math.floor((b.y+b.d)/CELL);cy++)for(let cx=Math.floor(b.x/CELL);cx<=Math.floor((b.x+b.w)/CELL);cx++){const k=cellKey(cx,cy);let a=BGRID.get(k);if(!a)BGRID.set(k,a=[]);a.push(b)}}
function buildingsNear(x,y,rad){const out=new Set();for(let cy=Math.floor((y-rad)/CELL);cy<=Math.floor((y+rad)/CELL);cy++)for(let cx=Math.floor((x-rad)/CELL);cx<=Math.floor((x+rad)/CELL);cx++){const a=BGRID.get(cellKey(cx,cy));if(a)for(const b of a)out.add(b)}return[...out]}
function buildingAt(x,y,rad=0){for(const b of buildingsNear(x,y,60)){if(b.kind==='silo'||b.kind==='lighthouse'){const R=b.w/2;if(Math.hypot(x-(b.x+R),y-(b.y+b.d/2))<R+rad)return b;continue}
  if(x>b.x-rad&&x<b.x+b.w+rad&&y>b.y-rad&&y<b.y+b.d+rad)return b}return null}

/* ---------- map drawing ---------- */
const bPx=b=>b.h*HS*(b.bh||BH),storyPx=b=>STORY*HS*(b.bh||BH);
function roofRise(b){const k=HS*(b.bh||BH);if(b.roof==='hip')return Math.min(b.d/M*.26*k,40);if(b.roof==='gableS')return b.w/M*.3*k;if(b.roof==='gambrel')return b.w/M*.42*k;if(b.roof==='gableE')return Math.min(b.d/M*.28*k,46);return 0}
function bExtent(b){const H=bPx(b),R=roofRise(b);let top=b.y-H-R-14;if(b.kind==='church')top=b.y+b.d-H-STORY*HS*BH*5.2;if(b.kind==='office')top-=30;if(b.kind==='apartment'&&b.tank)top-=40;if(b.kind==='lighthouse')top-=60;if(b.kind==='hotel')top-=22;if(b.kind==='courthouse')top-=96;if(b.kind==='parish')top-=b.ptype==='kirk'?60:b.ptype==='chapel'?20:150;if(b.kind==='castle')top-=70;if(b.kind==='clocktower')top-=260;if(b.kind==='domecath')top-=230;if(b.kind==='distillery')top-=46;if(b.kind==='tenement')top-=34;if(b.kind==='manor'||b.chim)top-=24;if(b.kind==='catedral')top-=140;if(b.kind==='alcaldia')top-=66;if(b.kind==='mission')top-=110;if(b.kind==='lanaihall')top-=56;if(b.kind==='lanaishop')top-=20;if(b.kind==='elevator')top-=70;if(b.parapet)top-=12;if(b.kind==='watertower'){top-=24;return{x0:b.x-40,x1:b.x+b.w+40,y0:top,y1:b.y+b.d+10}}
  return{x0:b.x-16,x1:b.x+b.w+16,y0:top,y1:b.y+b.d+10}}
function bWin(x,y,w,h,frame,o={}){ctx.fillStyle=frame;ctx.fillRect(x-1.3,y-1.3,w+2.6,h+2.6);ctx.fillStyle=o.glass||'#3f5a6a';ctx.fillRect(x,y,w,h);
  if(o.curtain){ctx.fillStyle=o.curtain;ctx.fillRect(x,y,w*.32,h);ctx.fillRect(x+w*.68,y,w*.32,h)}
  ctx.fillStyle='rgba(255,255,255,.24)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w*.55,y);ctx.lineTo(x,y+h*.6);ctx.fill();
  if(o.mull){ctx.fillStyle=frame;ctx.fillRect(x+w/2-.5,y,1,h);ctx.fillRect(x,y+h*.42,w,1)}
  if(o.sill){ctx.fillStyle=o.sill;ctx.fillRect(x-2.2,y+h+1.3,w+4.4,1.8)}
  if(o.shut){ctx.fillStyle=o.shut;ctx.fillRect(x-5,y-1,3.4,h+2);ctx.fillRect(x+w+1.6,y-1,3.4,h+2);ctx.fillStyle='rgba(0,0,0,.18)';for(let k=1;k<4;k++){ctx.fillRect(x-5,y-1+k*(h+2)/4,3.4,.6);ctx.fillRect(x+w+1.6,y-1+k*(h+2)/4,3.4,.6)}}}
// red barrel tiles: rows of half-round tiles over a roof face
// thatch: a thick straw roof with rounded eaves and a patterned ridge
function thatchTex(x0,x1,top,ridge,eave,col){ctx.fillStyle=shadeHex(col,.1);ctx.beginPath();ctx.moveTo(x0+3,top);ctx.lineTo(x1-3,top);ctx.quadraticCurveTo(x1+2,(top+ridge)/2,x1-1,ridge);ctx.lineTo(x0+1,ridge);ctx.quadraticCurveTo(x0-2,(top+ridge)/2,x0+3,top);ctx.fill();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x0+1,ridge);ctx.lineTo(x1-1,ridge);ctx.quadraticCurveTo(x1+4,(ridge+eave)/2,x1-2,eave+2);ctx.quadraticCurveTo((x0+x1)/2,eave+6,x0+2,eave+2);ctx.quadraticCurveTo(x0-4,(ridge+eave)/2,x0+1,ridge);ctx.fill();
  ctx.strokeStyle=shadeHex(col,-.14);ctx.lineWidth=.7;ctx.beginPath();for(let yy=ridge+5;yy<eave;yy+=4)for(let xx=x0+3+((yy|0)%3);xx<x1-3;xx+=5){ctx.moveTo(xx,yy);ctx.lineTo(xx+.6,yy+3)}ctx.stroke();
  ctx.fillStyle=shadeHex(col,-.2);ctx.fillRect(x0+2,ridge-2,x1-x0-4,6);ctx.fillStyle=shadeHex(col,.05);for(let xx=x0+4;xx<x1-6;xx+=8){ctx.beginPath();ctx.moveTo(xx,ridge+4);ctx.lineTo(xx+4,ridge+9);ctx.lineTo(xx+8,ridge+4);ctx.fill()}
  ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.moveTo(x0+2,eave+2);ctx.quadraticCurveTo((x0+x1)/2,eave+6,x1-2,eave+2);ctx.lineTo(x1-2,eave+5);ctx.quadraticCurveTo((x0+x1)/2,eave+9,x0+2,eave+5);ctx.fill()}
function stoneTex(x0,y0,w,h,col,r){ctx.strokeStyle=shadeHex(col,-.16);ctx.lineWidth=.6;ctx.beginPath();for(let yy=y0+4;yy<y0+h;yy+=4.5){ctx.moveTo(x0,yy);ctx.lineTo(x0+w,yy);for(let xx=x0+((yy*7)|0)%9;xx<x0+w;xx+=6+((xx*13+yy)|0)%6){ctx.moveTo(xx,yy);ctx.lineTo(xx,yy-4.5)}}ctx.stroke()}
function brickTex(x0,y0,w,h,col){ctx.strokeStyle=shadeHex(col,-.12);ctx.lineWidth=.5;ctx.beginPath();for(let yy=y0+3;yy<y0+h;yy+=3){ctx.moveTo(x0,yy);ctx.lineTo(x0+w,yy)}ctx.stroke()}
function chimney(x,yb,h,col){ctx.fillStyle=col;ctx.fillRect(x,yb-h,9,h);ctx.fillStyle=shadeHex(col,-.2);ctx.fillRect(x+6,yb-h,3,h);ctx.fillStyle=shadeHex(col,.1);ctx.fillRect(x-1,yb-h-2,11,3);ctx.fillStyle='#8a4a32';ctx.fillRect(x+1.5,yb-h-6,2.6,4);ctx.fillRect(x+5,yb-h-6,2.6,4)}
function crowSteps(x,w,y,col){const n=4,sw=w/(2*n+1);ctx.fillStyle=col;for(let i=0;i<n;i++){ctx.fillRect(x+i*sw,y-(i+1)*6,w-2*i*sw,6)}ctx.fillRect(x+n*sw,y-(n+1)*6,sw,6)}
function battlements(x,w,y,col){ctx.fillStyle=col;for(let xx=x;xx<x+w-4;xx+=10)ctx.fillRect(xx,y-6,6,6)}
function lancet(x,y,w,h,frame,glass){ctx.fillStyle=frame;ctx.beginPath();ctx.moveTo(x-1.5,y+h);ctx.lineTo(x-1.5,y+w*.6);ctx.quadraticCurveTo(x+w/2,y-w*.6,x+w+1.5,y+w*.6);ctx.lineTo(x+w+1.5,y+h);ctx.fill();
  ctx.fillStyle=glass;ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y+w*.6);ctx.quadraticCurveTo(x+w/2,y-w*.4,x+w,y+w*.6);ctx.lineTo(x+w,y+h);ctx.fill()}
function tileTex(x0,x1,y0,y1,col){ctx.fillStyle=shadeHex(col,-.2);for(let yy=y0+4;yy<y1;yy+=5)for(let xx=x0+((Math.round((yy-y0)/5))%2?3:0);xx<x1;xx+=6){ctx.beginPath();ctx.arc(xx+3,yy,2.8,0,PI);ctx.fill()}
  ctx.fillStyle=shadeHex(col,.14);for(let yy=y0+2;yy<y1;yy+=5)ctx.fillRect(x0,yy,x1-x0,.8)}
function tileRoof(x0,x1,y0,y1,col){ctx.fillStyle=col;ctx.fillRect(x0,y0,x1-x0,y1-y0);tileTex(x0,x1,y0,y1,col);ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(x0,y1-1.5,x1-x0,1.5)}
function bText(txt,x,y,size,col,w){ctx.font=`700 ${size}px Fredoka,system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=col;let s=size;while(w&&ctx.measureText(txt).width>w&&s>4){s-=.5;ctx.font=`700 ${s}px Fredoka,system-ui,sans-serif`}ctx.fillText(txt,x,y);ctx.textBaseline='alphabetic'}
function awning(x0,x1,yTop,drop,cols,out=7){const n=Math.max(3,Math.round((x1-x0)/9));ctx.fillStyle=shadeHex(cols[0],-.25);ctx.fillRect(x0-2,yTop,x1-x0+4,2);
  for(let i=0;i<n;i++){const a=x0+(x1-x0)*i/n,b=x0+(x1-x0)*(i+1)/n;ctx.fillStyle=cols[i%2];ctx.beginPath();ctx.moveTo(a,yTop+2);ctx.lineTo(b,yTop+2);ctx.lineTo(b+(b-(x0+x1)/2)*.04,yTop+drop);ctx.lineTo(a+(a-(x0+x1)/2)*.04,yTop+drop);ctx.fill()}
  for(let i=0;i<n;i++){const a=x0+(x1-x0)*i/n,b=x0+(x1-x0)*(i+1)/n;ctx.fillStyle=cols[i%2];ctx.beginPath();ctx.arc((a+b)/2,yTop+drop,(b-a)/2,0,PI);ctx.fill()}
  ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(x0,yTop+drop+(x1-x0)/n/2,x1-x0,3)}
function clap(x,y,w,h,col){ctx.strokeStyle=shadeHex(col,-.08);ctx.lineWidth=.7;ctx.beginPath();for(let yy=y+4;yy<y+h;yy+=4){ctx.moveTo(x,yy);ctx.lineTo(x+w,yy)}ctx.stroke()}
function roofUnits(b,top,r){const n=1+Math.floor(r()*3);for(let i=0;i<n;i++){const ux=b.x+12+r()*(b.w-40),uy=top+10+r()*(b.d-30),uw=12+r()*10;ctx.fillStyle='#b9b8b2';ctx.fillRect(ux,uy-7,uw,7);ctx.fillStyle='#d4d3cd';ctx.fillRect(ux,uy-11,uw,4);ctx.fillStyle='#8f8e88';ctx.beginPath();ctx.arc(ux+uw/2,uy-9,2.6,0,TAU);ctx.fill()}}
function drawBuildingShadow(b){const H=bPx(b)+roofRise(b)*.6,sx=H*.32,sy=H*.07;ctx.fillStyle='rgba(16,30,22,.22)';
  if(b.kind==='silo'||b.kind==='lighthouse'){const R=b.w/2,cx=b.x+R,cy=b.y+b.d/2;ctx.beginPath();ctx.ellipse(cx,cy,R,R*.9,0,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(cx,cy-R);ctx.lineTo(cx+sx,cy-R*.6+sy);ctx.lineTo(cx+sx,cy+R*.6+sy);ctx.lineTo(cx,cy+R);ctx.fill();return}
  ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+b.w,b.y);ctx.lineTo(b.x+b.w+sx,b.y+sy);ctx.lineTo(b.x+b.w+sx,b.y+b.d+sy);ctx.lineTo(b.x+sx,b.y+b.d+sy);ctx.lineTo(b.x,b.y+b.d);ctx.closePath();ctx.fill()}
const BSTYLE={beachhouse:'cottage',home:'house',cabin:'cottage',ranger:'cottage',mill:'house',station:'shed',store:'shop',marina:'kiosk',ferry:'kiosk',tower:'lifeguard'};
function drawBuildingOW(b){const r=rng(b.seed),H=bPx(b),SP=storyPx(b),x=b.x,w=b.w,fy=b.y+b.d,top=b.y-H,wy=fy-H;// wy: top of the front wall
  const k=BSTYLE[b.kind]||b.kind;
  if(k==='silo')return owSilo(b,r);if(k==='watertower')return owWaterTower(b,r);if(k==='lighthouse')return owLighthouse(b,r);if(k==='lifeguard')return owLifeguard(b,r);
  // roof
  if(b.roof==='flat'){ctx.fillStyle=b.roofTone||'#8f8c86';ctx.fillRect(x,top,w,b.d);ctx.fillStyle='rgba(255,255,255,.05)';for(let yy=top+8;yy<top+b.d;yy+=10)ctx.fillRect(x+4,yy,w-8,4);ctx.fillStyle=shadeHex(b.trim||'#cfcac0',-.05);ctx.fillRect(x,top,w,3);ctx.fillRect(x,top,3,b.d);ctx.fillRect(x+w-3,top,3,b.d);
    ctx.fillStyle='rgba(0,0,0,.1)';ctx.fillRect(x+3,top+3,w-6,4);
    if(k==='office'){const pw=w*.4,px=x+w*.3;ctx.fillStyle='#b4b9bc';ctx.fillRect(px,top+b.d*.25-18,pw,18);ctx.fillStyle='#c9cdcf';ctx.fillRect(px,top+b.d*.25-22,pw,4);if(b.floors>=8){limb(px+pw*.7,top+b.d*.25-22,px+pw*.7,top+b.d*.25-48,'#6f7477',1.4);dot(px+pw*.7,top+b.d*.25-48,1.6,'#c23b2e')}}
    else if(k!=='courthouse'&&k!=='elevator'&&k!=='catedral'&&k!=='alcaldia'&&k!=='adobe'&&!BRI)roofUnits(b,top,r);
    if(k==='apartment'&&b.tank){const tx=x+w*.7,ty=top+b.d*.45;for(const lx of[-7,7])limb(tx+lx,ty,tx+lx*.8,ty-14,'#3a3330',1.4);ctx.fillStyle='#8a6a4a';ctx.fillRect(tx-10,ty-36,20,22);ctx.fillStyle='#a3825f';ctx.fillRect(tx-10,ty-36,6,22);ctx.strokeStyle='#4a3a2a';ctx.lineWidth=.8;for(const yy of[-30,-21])ctx.strokeRect(tx-10,ty+yy,20,.1);
      ctx.fillStyle='#5a4a3a';ctx.beginPath();ctx.moveTo(tx-11,ty-36);ctx.lineTo(tx,ty-44);ctx.lineTo(tx+11,ty-36);ctx.fill()}
    if(k==='rowhouse'){ctx.fillStyle='#8a5a48';ctx.fillRect(x+w*.7,top+8,8,10);ctx.fillStyle='#6f4636';ctx.fillRect(x+w*.7-1,top+6,10,3)}}
  else if(b.roof==='gableE'){const R=roofRise(b),ridge=b.y+b.d/2-H-R,ov=b.ov||6;ctx.fillStyle=shadeHex(b.roofCol,.12);ctx.beginPath();ctx.moveTo(x-ov,top);ctx.lineTo(x+w+ov,top);ctx.lineTo(x+w+ov,ridge);ctx.lineTo(x-ov,ridge);ctx.fill();
    ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(x-ov,ridge);ctx.lineTo(x+w+ov,ridge);ctx.lineTo(x+w+ov,wy+4);ctx.lineTo(x-ov,wy+4);ctx.fill();
    if(b.thatch)thatchTex(x-ov,x+w+ov,top,ridge,wy+4,b.roofCol);else if(b.tile){tileTex(x-ov,x+w+ov,ridge,wy+4,b.roofCol);tileTex(x-ov,x+w+ov,top,ridge,shadeHex(b.roofCol,.12))}else{ctx.fillStyle='rgba(0,0,0,.12)';for(let yy=ridge+6;yy<wy;yy+=6)ctx.fillRect(x-ov,yy,w+ov*2,1)}ctx.fillStyle=shadeHex(b.roofCol,.25);ctx.fillRect(x-ov,ridge-1.5,w+ov*2,3);
    if(b.ov>8){ctx.fillStyle=shadeHex(b.roofCol,-.25);for(let xx=x-ov+3;xx<x+w+ov;xx+=7)ctx.fillRect(xx,wy+4,2.2,3)}
    if(k==='shed'){ctx.fillStyle='rgba(255,255,255,.12)';for(let xx=x;xx<x+w;xx+=6)ctx.fillRect(xx,ridge,1.2,wy-ridge)}
    if(k==='house'||k==='cottage'){ctx.fillStyle='#8a5a48';ctx.fillRect(x+w*.75,ridge-16,10,20);ctx.fillStyle='#6f4636';ctx.fillRect(x+w*.75-1,ridge-18,12,3)}}
  else if(b.roof==='gableS'||b.roof==='gambrel'){const R=roofRise(b),ov=5,ax=x+w/2,back=top,eave=wy;
    const sl=(sgn,col)=>{ctx.fillStyle=col;ctx.beginPath();if(b.roof==='gambrel'){const kx=sgn<0?x+w*.16:x+w*.84,ky=R*.6;ctx.moveTo(sgn<0?x-ov:x+w+ov,eave+3);ctx.lineTo(kx,eave-ky);ctx.lineTo(kx,back-ky);ctx.lineTo(sgn<0?x-ov:x+w+ov,back+3);ctx.fill();
        ctx.fillStyle=shadeHex(col,sgn<0?.1:-.06);ctx.beginPath();ctx.moveTo(kx,eave-ky);ctx.lineTo(ax,eave-R);ctx.lineTo(ax,back-R);ctx.lineTo(kx,back-ky);ctx.fill()}
      else{ctx.moveTo(sgn<0?x-ov:x+w+ov,eave+3);ctx.lineTo(ax,eave-R);ctx.lineTo(ax,back-R);ctx.lineTo(sgn<0?x-ov:x+w+ov,back+3);ctx.fill()}};
    sl(-1,shadeHex(b.roofCol,.1));sl(1,shadeHex(b.roofCol,-.08));
    if(b.roof==='gambrel'){// a little ventilator cupola on the ridge
      const cy=b.y+b.d/2-H-R;ctx.fillStyle='#f1ece0';ctx.fillRect(ax-7,cy-12,14,12);ctx.fillStyle='#4f5650';ctx.beginPath();ctx.moveTo(ax-10,cy-12);ctx.lineTo(ax,cy-20);ctx.lineTo(ax+10,cy-12);ctx.fill();ctx.fillStyle='#3a3f3c';for(const dx of[-4,1.5])ctx.fillRect(ax+dx,cy-10,2.5,7);limb(ax,cy-20,ax,cy-28,'#3a3f3c',1)}}
  else if(b.roof==='hip'){// hip roof (four slopes); corrugated tin when b.metal
    const R=roofRise(b),ov=b.ov||6,ins=Math.min(w*.32,b.d*.45),ridge=b.y+b.d/2-H-R;
    const poly=(pts,col)=>{ctx.fillStyle=col;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill()};
    poly([[x-ov,top-2],[x+w+ov,top-2],[x+w-ins,ridge],[x+ins,ridge]],shadeHex(b.roofCol,.16));
    poly([[x-ov,top-2],[x+ins,ridge],[x-ov,wy+4]],shadeHex(b.roofCol,.05));poly([[x+w+ov,top-2],[x+w-ins,ridge],[x+w+ov,wy+4]],shadeHex(b.roofCol,-.12));
    poly([[x-ov,wy+4],[x+w+ov,wy+4],[x+w-ins,ridge],[x+ins,ridge]],b.roofCol);
    if(b.metal){ctx.strokeStyle='rgba(255,255,255,.17)';ctx.lineWidth=1;ctx.beginPath();for(let xx=x-ov+3;xx<x+w+ov;xx+=4.5){const f=(xx-(x-ov))/(w+2*ov),xr=x+ins+f*(w-2*ins);ctx.moveTo(xx,wy+4);ctx.lineTo(xr,ridge)}ctx.stroke()}
    ctx.strokeStyle=shadeHex(b.roofCol,.32);ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x+ins,ridge);ctx.lineTo(x+w-ins,ridge);ctx.moveTo(x+ins,ridge);ctx.lineTo(x-ov,wy+4);ctx.moveTo(x+w-ins,ridge);ctx.lineTo(x+w+ov,wy+4);
    ctx.moveTo(x+ins,ridge);ctx.lineTo(x-ov,top-2);ctx.moveTo(x+w-ins,ridge);ctx.lineTo(x+w+ov,top-2);ctx.stroke();ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x-ov,wy+4,w+ov*2,2)}
  // front wall (with the gable end for south-facing gables)
  ctx.fillStyle=b.col;ctx.fillRect(x,wy,w,H);
  if(b.roof==='gableS'||b.roof==='gambrel'){const R=roofRise(b);ctx.beginPath();if(b.roof==='gambrel'){ctx.moveTo(x,wy);ctx.lineTo(x+w*.16,wy-R*.6);ctx.lineTo(x+w/2,wy-R);ctx.lineTo(x+w*.84,wy-R*.6);ctx.lineTo(x+w,wy)}else{ctx.moveTo(x,wy);ctx.lineTo(x+w/2,wy-R);ctx.lineTo(x+w,wy)}ctx.fill();
    ctx.strokeStyle=b.trim;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.beginPath();if(b.roof==='gambrel'){ctx.moveTo(x-3,wy+2);ctx.lineTo(x+w*.16,wy-R*.6);ctx.lineTo(x+w/2,wy-R);ctx.lineTo(x+w*.84,wy-R*.6);ctx.lineTo(x+w+3,wy+2)}else{ctx.moveTo(x-4,wy+3);ctx.lineTo(x+w/2,wy-R);ctx.lineTo(x+w+4,wy+3)}ctx.stroke()}
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x,fy-5,w,5);
  const flo=b.floors||Math.max(1,Math.round(b.h/STORY));
  switch(k){
    // ---------- British Isle ----------
    case'bcot':case'bfarm':case'vshop':{// B-A1 cottage / B-A5 farmhouse / B-A4 village shop: stone, brick, whitewash or harled walls, small-paned windows, chimneys
      if(b.stone)stoneTex(x,wy,w,H,b.col,r);else if(b.brick)brickTex(x,wy,w,H,b.col);
      const two=flo>1||k==='bfarm',low=b.style==='black';
      if(b.chim&&b.roof==='gableE'){const ridge=b.y+b.d/2-H-roofRise(b);chimney(x+4,ridge+6,14,b.stone?shadeHex(b.col,-.08):b.brick?b.col:'#b8b0a2');chimney(x+w-13,ridge+6,14,b.stone?shadeHex(b.col,-.08):b.brick?b.col:'#b8b0a2')}
      const dx=k==='vshop'?x+w*.72:x+w/2-6;ctx.fillStyle=b.door||'#2f4a3a';ctx.fillRect(dx,fy-SP*(low?.62:.78),12,SP*(low?.62:.78));dot(dx+9,fy-SP*.36,.9,'#d7b65c');
      if(!low){ctx.fillStyle=shadeHex(b.col,-.2);ctx.fillRect(dx-2,fy-SP*.82,16,2.5)}
      if(k==='vshop'){ctx.fillStyle='#2f4a3a';ctx.fillRect(x+8,fy-SP*.78,w*.52,SP*.66);bWin(x+10,fy-SP*.74,w*.52-4,SP*.56,'#f2ece0',{mull:true});ctx.fillStyle='#2f4a3a';ctx.fillRect(x+6,wy+2,w-12,9);bText(b.sign||'POST OFFICE',x+w/2,wy+6.5,6,'#f2e6c0',w-16)}
      else{const ws=low?[x+w*.2]:[x+w*.18,x+w*.78];for(const wx of ws)bWin(wx-6,fy-SP*.66,12,SP*.4,b.stone||b.brick?'#efeae0':'#3a3a32',{mull:true,sill:true})}
      if(two&&!low)for(const fx of[.18,.5,.78])bWin(x+w*fx-6,fy-SP*1.66,12,SP*.42,b.stone||b.brick?'#efeae0':'#3a3a32',{mull:true});
      if(b.roses)for(let i=0;i<12;i++)dot(dx+(i<6?-4:16)+(r()-.5)*5,fy-SP*(.1+r()*.75),1.5,i%3?'#d6476a':'#3f6a32');
      if(low){ctx.fillStyle='#5a4a32';for(let i=0;i<5;i++){const rx=x+w*(.1+i*.2);ctx.fillRect(rx,wy-14,2,14);dot(rx+1,wy+2,3,'#8a857a')}}
      if(b.stone){ctx.fillStyle=shadeHex(b.col,.1);for(let yy=wy+3;yy<fy-3;yy+=9){ctx.fillRect(x,yy,6,5);ctx.fillRect(x+w-6,yy,6,5)}}break}
    case'bbarn':{// B-A6 stone or brick barn with big doors
      if(b.stone)stoneTex(x,wy,w,H,b.col,r);else if(b.brick)brickTex(x,wy,w,H,b.col);
      ctx.fillStyle='#5a4632';ctx.fillRect(x+w*.38,fy-SP*1.1,w*.24,SP*1.1);ctx.strokeStyle='#3a2e22';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w/2,fy-SP*1.1);ctx.lineTo(x+w/2,fy);ctx.moveTo(x+w*.38,fy-SP*1.1);ctx.lineTo(x+w*.62,fy);ctx.stroke();
      for(const fx of[.14,.86])ctx.fillRect(x+w*fx-3,fy-SP*1.1,6,8);break}
    case'pub':{// B-A3 village pub: a long low old building, black timbering in the south, a painted sign on a bracket, hanging baskets, benches
      if(b.brick)brickTex(x,wy,w,H,b.col);
      if(b.beams){ctx.fillStyle='#2a2622';for(let xx=x+4;xx<x+w;xx+=22)ctx.fillRect(xx,wy,4,H);ctx.fillRect(x,fy-SP-2,w,4);ctx.fillRect(x,wy,w,3)}
      const ridge=b.y+b.d/2-H-roofRise(b);chimney(x+12,ridge+6,16,'#9a5a44');chimney(x+w-20,ridge+6,16,'#9a5a44');
      ctx.fillStyle='#2a2a2a';ctx.fillRect(x+w*.46,fy-SP*.82,16,SP*.82);for(const fx of[.14,.32,.68,.86]){bWin(x+w*fx-8,fy-SP*.7,16,SP*.44,'#efeae0',{mull:true,sill:true});bWin(x+w*fx-7,fy-SP*1.7,14,SP*.38,'#efeae0',{mull:true})}
      for(const fx of[.23,.77]){limb(x+w*fx,fy-SP*.92,x+w*fx,fy-SP*.82,'#2a2a2a',1);dot(x+w*fx,fy-SP*.78,5,'#3f7a32');for(let i=0;i<6;i++)dot(x+w*fx+(r()-.5)*9,fy-SP*.8+(r()-.5)*5,1.3,i%2?'#e84a6a':'#f2d23a')}
      const sx=x-6,sy=wy+SP*.2;limb(sx,sy,sx+20,sy,'#2a2a2a',1.6);ctx.fillStyle='#1f3a2a';ctx.fillRect(sx+2,sy+3,16,20);ctx.strokeStyle='#d7b65c';ctx.lineWidth=1;ctx.strokeRect(sx+3,sy+4,14,18);dot(sx+10,sy+12,4,'#c9a043');
      ctx.fillStyle='#1f3a2a';ctx.fillRect(x+w*.3,wy+4,w*.4,9);bText(b.sign||'THE CROWN',x+w/2,wy+8.5,6,'#f2e6c0',w*.38);
      for(const bx of[x+20,x+w-46]){ctx.fillStyle='#6a4a2e';ctx.fillRect(bx,fy+12,26,3);ctx.fillRect(bx,fy+20,26,3);ctx.fillRect(bx+4,fy+15,18,5)}break}
    case'parish':{// B-A7 parish church: a long nave with pointed windows; a square tower with battlements, a spire, a Welsh chapel front, a Scottish kirk with a bellcote, or a crown spire
      if(b.stone)stoneTex(x,wy,w,H,b.col,r);const pt=b.ptype;
      if(pt==='chapel'){ctx.fillStyle=b.col;ctx.beginPath();ctx.moveTo(x,wy);ctx.lineTo(x+w/2,wy-30);ctx.lineTo(x+w,wy);ctx.fill();ctx.strokeStyle=b.trim;ctx.lineWidth=2;ctx.stroke();for(const fx of[.2,.4,.6,.8])lancet(x+w*fx-6,fy-SP*1.6,12,SP*1.2,b.trim,'#4a5f6a');
        ctx.fillStyle='#3a2a20';ctx.fillRect(x+w/2-8,fy-SP*.9,16,SP*.9);bText('CAPEL',x+w/2,wy-10,6,'#5a4a3a',40);break}
      for(const fx of[.42,.58,.74,.9])lancet(x+w*fx-5,fy-SP*1.25,10,SP*.95,b.trim,'#4a5f6a');ctx.fillStyle='#5a3a24';ctx.fillRect(x+w*.5-1,fy-SP*.8,1,1);
      const tw=pt==='kirk'?0:w*.3,tx=x+2;
      if(pt==='kirk'){ctx.fillStyle=b.col;ctx.fillRect(x+w*.12,wy-20,16,20);ctx.beginPath();ctx.moveTo(x+w*.12-2,wy-20);ctx.lineTo(x+w*.12+8,wy-30);ctx.lineTo(x+w*.12+18,wy-20);ctx.fill();ctx.fillStyle='#3b3f45';ctx.fillRect(x+w*.12+4,wy-17,8,9);dot(x+w*.12+8,wy-10,2.4,'#c9a043');
        ctx.fillStyle='#3a2a20';ctx.fillRect(x+w*.22,fy-SP*.85,14,SP*.85);break}
      const th=H*(pt==='crown'?2.6:2.2);ctx.fillStyle=b.col;ctx.fillRect(tx,fy-th,tw,th);if(b.stone)stoneTex(tx,fy-th,tw,th,b.col,r);ctx.fillStyle='rgba(0,0,0,.1)';ctx.fillRect(tx+tw*.75,fy-th,tw*.25,th);
      ctx.fillStyle='#3a2a20';ctx.beginPath();ctx.moveTo(tx+tw/2-8,fy);ctx.lineTo(tx+tw/2-8,fy-SP*.7);ctx.quadraticCurveTo(tx+tw/2,fy-SP*1.05,tx+tw/2+8,fy-SP*.7);ctx.lineTo(tx+tw/2+8,fy);ctx.fill();
      lancet(tx+tw/2-5,fy-th+18,10,22,b.trim,'#2f3a40');dot(tx+tw/2,fy-th*.62,6.5,'#f4f0e4');ctx.strokeStyle='#2a2a2a';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(tx+tw/2,fy-th*.62);ctx.lineTo(tx+tw/2,fy-th*.62-4.5);ctx.moveTo(tx+tw/2,fy-th*.62);ctx.lineTo(tx+tw/2+3,fy-th*.62);ctx.stroke();
      if(pt==='tower'){battlements(tx,tw,fy-th,b.col);for(const px of[tx,tx+tw-5]){ctx.fillStyle=b.col;ctx.fillRect(px,fy-th-14,5,14);ctx.beginPath();ctx.moveTo(px-1,fy-th-14);ctx.lineTo(px+2.5,fy-th-20);ctx.lineTo(px+6,fy-th-14);ctx.fill()}}
      else if(pt==='spire'){ctx.fillStyle='#6a6f74';ctx.beginPath();ctx.moveTo(tx+2,fy-th);ctx.lineTo(tx+tw/2,fy-th-H*2.4);ctx.lineTo(tx+tw-2,fy-th);ctx.fill();ctx.fillStyle='#868b90';ctx.beginPath();ctx.moveTo(tx+2,fy-th);ctx.lineTo(tx+tw/2,fy-th-H*2.4);ctx.lineTo(tx+tw/2,fy-th);ctx.fill();limb(tx+tw/2,fy-th-H*2.4,tx+tw/2,fy-th-H*2.4-10,'#c9a043',1.2)}
      else if(pt==='crown'){battlements(tx,tw,fy-th,b.col);const cx=tx+tw/2,cy=fy-th;ctx.strokeStyle=b.col;ctx.lineWidth=3.2;ctx.beginPath();for(const s of[-1,1]){ctx.moveTo(cx+s*tw*.45,cy-4);ctx.quadraticCurveTo(cx+s*tw*.4,cy-34,cx,cy-40)}ctx.moveTo(cx-tw*.2,cy-4);ctx.quadraticCurveTo(cx-tw*.15,cy-30,cx,cy-40);ctx.moveTo(cx+tw*.2,cy-4);ctx.quadraticCurveTo(cx+tw*.15,cy-30,cx,cy-40);ctx.stroke();
        ctx.fillStyle=b.col;ctx.fillRect(cx-3,cy-56,6,18);ctx.beginPath();ctx.moveTo(cx-4,cy-56);ctx.lineTo(cx,cy-70);ctx.lineTo(cx+4,cy-56);ctx.fill()}
      break}
    case'manor':{// B-A11 manor house: pale stone, three rows of sash windows, a pediment over the door, tall chimneys
      const ridge=b.y+b.d/2-H-roofRise(b);for(const fx of[.08,.3,.62,.86])chimney(x+w*fx,ridge+10,20,'#c9b890');
      const n=9;for(let f=0;f<flo;f++)for(let i=0;i<n;i++){const cx=x+w*(i+.5)/n;if(f===0&&i===4)continue;bWin(cx-6,fy-f*SP-SP*.82,12,SP*.6,b.trim,{mull:true})}
      ctx.fillStyle=b.trim;ctx.beginPath();ctx.moveTo(x+w*.4,wy+6);ctx.lineTo(x+w/2,wy-14);ctx.lineTo(x+w*.6,wy+6);ctx.fill();for(const fx of[.42,.47,.53,.58])ctx.fillRect(x+w*fx-2,fy-SP*1.1,4,SP*1.1);
      ctx.fillStyle='#2a2a2a';ctx.fillRect(x+w/2-8,fy-SP*.8,16,SP*.8);ctx.fillStyle='#bdb5a2';ctx.fillRect(x+w/2-24,fy,48,4);if(b.sign)bText(b.sign,x+w/2,wy-3,6,'#5a4a3a',60);break}
    case'castle':{// B-A8 the castle on its rock: curtain wall with battlements, round towers, a gatehouse, the keep behind
      stoneTex(x,wy,w,H,b.col,r);battlements(x,w,wy,b.col);
      const kx=x+w*.55,kw=w*.3,kh=H*1.9;ctx.fillStyle=shadeHex(b.col,.06);ctx.fillRect(kx,wy-kh*.75,kw,kh*.75);stoneTex(kx,wy-kh*.75,kw,kh*.75,b.col,r);battlements(kx,kw,wy-kh*.75,shadeHex(b.col,.06));
      for(const fx of[.15,.5,.85])lancet(kx+kw*fx-3,wy-kh*.6,6,12,'#6a665e','#2a2a2a');ctx.fillStyle='#c4231c';limb(kx+kw/2,wy-kh*.75-6,kx+kw/2,wy-kh*.75-28,'#3a3a3a',1.2);ctx.fillRect(kx+kw/2,wy-kh*.75-28,14,8);
      for(const tx of[x-8,x+w-22]){ctx.fillStyle=shadeHex(b.col,-.04);ctx.fillRect(tx,wy-10,30,H+10);stoneTex(tx,wy-10,30,H+10,b.col,r);battlements(tx,30,wy-10,shadeHex(b.col,-.04));lancet(tx+12,wy+12,6,12,'#6a665e','#2a2a2a')}
      const gx=x+w*.3,gw=60;ctx.fillStyle=shadeHex(b.col,.03);ctx.fillRect(gx,wy-16,gw,H+16);battlements(gx,gw,wy-16,shadeHex(b.col,.03));ctx.fillStyle='#2a2622';ctx.beginPath();ctx.moveTo(gx+gw/2-12,fy);ctx.lineTo(gx+gw/2-12,fy-SP*.8);ctx.quadraticCurveTo(gx+gw/2,fy-SP*1.15,gx+gw/2+12,fy-SP*.8);ctx.lineTo(gx+gw/2+12,fy);ctx.fill();
      ctx.strokeStyle='#5a4a3a';ctx.lineWidth=1;ctx.beginPath();for(let xx=gx+gw/2-10;xx<gx+gw/2+12;xx+=4){ctx.moveTo(xx,fy-SP*.85);ctx.lineTo(xx,fy-SP*.35)}ctx.stroke();break}
    case'ruin':case'abbey':{// B-A15 ruins: roofless walls, broken tops, empty pointed windows, grass inside
      stoneTex(x,wy,w,H,b.col,r);ctx.fillStyle='#6f8a4a';ctx.fillRect(x+4,top+4,w-8,b.d-6);
      ctx.fillStyle=b.col;ctx.beginPath();ctx.moveTo(x,wy);for(let xx=x;xx<=x+w;xx+=8)ctx.lineTo(xx,wy-(k==='abbey'?(Math.abs(xx-x-w*.3)<w*.12?H*.6:r()*14):r()*20+(xx<x+w*.4?18:0)));ctx.lineTo(x+w,wy+4);ctx.lineTo(x,wy+4);ctx.fill();
      const n=k==='abbey'?7:2;for(let i=0;i<n;i++)lancet(x+w*(i+.5)/n-6,wy+(k==='abbey'?2:10),12,H*.62,shadeHex(b.col,-.12),'#7f9a5a');
      if(k==='abbey'){const gx=x+w*.3;ctx.fillStyle=b.col;ctx.fillRect(gx-w*.1,wy-H*.6,w*.2,H*.6);lancet(gx-14,wy-H*.5,28,H*.7,shadeHex(b.col,-.12),'#8fa6b8')}
      for(let i=0;i<10;i++)dot(x+r()*w,wy-r()*6,2.4,'#5a7a3a');break}
    case'distillery':{// B-A10 whitewashed distillery with two pagoda-roofed kiln vents
      const ridge=b.y+b.d/2-H-roofRise(b);for(const fx of[.25,.65]){const px=x+w*fx;ctx.fillStyle='#f2f0ea';ctx.fillRect(px-12,ridge-22,24,24);ctx.fillStyle='#3f454d';ctx.beginPath();ctx.moveTo(px-20,ridge-20);ctx.quadraticCurveTo(px,ridge-34,px+20,ridge-20);ctx.lineTo(px+14,ridge-24);ctx.lineTo(px,ridge-44);ctx.lineTo(px-14,ridge-24);ctx.fill()}
      for(let i=0;i<8;i++)bWin(x+w*(i+.5)/8-5,fy-SP*1.7,10,SP*.4,'#2f2f2f',{mull:true});ctx.fillStyle='#4a3a2a';ctx.fillRect(x+w*.45,fy-SP*.9,w*.1,SP*.9);ctx.fillStyle='#2f2f2f';ctx.fillRect(x+w*.2,wy+4,w*.6,10);bText(b.sign||'DISTILLERY',x+w/2,wy+9,6.5,'#f2e6c0',w*.56);break}
    case'tenement':{// B-A9 Old Town tenement: four or five floors of dark stone, crow-stepped gable, many windows
      stoneTex(x,wy,w,H,b.col,r);crowSteps(x+w*.3,w*.4,wy,b.col);const n=Math.max(3,Math.round(w/30));
      for(let f=0;f<flo;f++)for(let i=0;i<n;i++){const cx=x+w*(i+.5)/n;if(f===0&&i===1){ctx.fillStyle=b.door;ctx.fillRect(cx-6,fy-SP*.8,12,SP*.8);continue}bWin(cx-5,fy-f*SP-SP*.78,10,SP*.56,'#d8d2c4',{mull:true})}
      const ridge=b.y+b.d/2-H-roofRise(b);chimney(x+6,ridge+6,16,shadeHex(b.col,-.05));chimney(x+w-15,ridge+6,16,shadeHex(b.col,-.05));
      if(r()<.5){ctx.fillStyle='#2f4a3a';ctx.fillRect(x+4,fy-SP*.9,w*.5,SP*.75);bWin(x+6,fy-SP*.82,w*.5-4,SP*.5,'#2f4a3a',{glass:'#3a5060'})}break}
    case'georgian':{// B-A13 Georgian townhouse: pale stone, tall sash windows, a fanlight door, iron railings
      for(let f=0;f<flo;f++)for(const fx of[.22,.5,.78]){const cx=x+w*fx;if(f===0&&fx===.22){ctx.fillStyle=b.door;ctx.fillRect(cx-7,fy-SP*.9,14,SP*.9);ctx.fillStyle='#f2ecdc';ctx.beginPath();ctx.arc(cx,fy-SP*.9,7,PI,TAU);ctx.fill();continue}bWin(cx-6,fy-f*SP-SP*.86,12,SP*.66,b.trim,{mull:true})}
      ctx.fillStyle=b.trim;ctx.fillRect(x,fy-SP-2,w,3);ctx.fillRect(x,wy-1,w,4);ctx.strokeStyle='#1d1d1d';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,fy+8);ctx.lineTo(x+w,fy+8);for(let xx=x;xx<=x+w;xx+=3){ctx.moveTo(xx,fy+8);ctx.lineTo(xx,fy+16)}ctx.stroke();break}
    case'terrace':{// B-A12 Victorian terrace: red brick, chimney pots; houses have a bay window and a coloured door, shops a painted shopfront and a sign
      brickTex(x,wy,w,H,b.col);ctx.fillStyle=shadeHex(b.col,-.18);ctx.fillRect(x+w-1.5,wy,1.5,H);chimney(x+w*.6,wy+2,12,b.col);
      if(b.sign){ctx.fillStyle=b.shop;ctx.fillRect(x+2,fy-SP*.95,w-4,SP*.95);bWin(x+5,fy-SP*.78,w*.62,SP*.66,b.shop,{glass:'#3f5a6a'});ctx.fillStyle='#2a2a2a';ctx.fillRect(x+w*.74,fy-SP*.82,w*.18,SP*.82);
        ctx.fillStyle=shadeHex(b.shop,-.2);ctx.fillRect(x+2,fy-SP*.98,w-4,8);bText(b.sign,x+w/2,fy-SP*.98+4,5.5,'#f2e6c0',w-6)}
      else{ctx.fillStyle=shadeHex(b.col,.08);ctx.fillRect(x+w*.08,fy-SP*.9,w*.46,SP*.9);bWin(x+w*.1,fy-SP*.78,w*.42,SP*.6,'#efeae0',{mull:true});ctx.fillStyle=b.door;ctx.fillRect(x+w*.66,fy-SP*.82,w*.2,SP*.82);ctx.fillStyle='#d8d2c4';ctx.beginPath();ctx.arc(x+w*.76,fy-SP*.82,w*.1,PI,TAU);ctx.fill()}
      for(let f=1;f<flo;f++)for(const fx of[.3,.72])bWin(x+w*fx-5,fy-f*SP-SP*.78,10,SP*.56,'#efeae0',{mull:true});break}
    case'clocktower':{// B-A16 Kingsport's clock tower: tall stone, a big clock face on each side, a gilded spire
      const th=H;stoneTex(x,wy,w,H,b.col,r);ctx.fillStyle='rgba(0,0,0,.1)';ctx.fillRect(x+w*.75,wy,w*.25,H);
      const cy=wy+w*.7;ctx.fillStyle='#c9a043';ctx.beginPath();ctx.arc(x+w/2,cy,w*.42,0,TAU);ctx.fill();ctx.fillStyle='#f6f2e4';ctx.beginPath();ctx.arc(x+w/2,cy,w*.36,0,TAU);ctx.fill();
      ctx.strokeStyle='#1d1d1d';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x+w/2,cy);ctx.lineTo(x+w/2,cy-w*.26);ctx.moveTo(x+w/2,cy);ctx.lineTo(x+w/2+w*.18,cy+w*.05);ctx.stroke();
      for(let i=0;i<12;i++){const a=i/12*TAU;dot(x+w/2+Math.cos(a)*w*.3,cy+Math.sin(a)*w*.3,.8,'#1d1d1d')}
      ctx.fillStyle=b.col;ctx.fillRect(x-3,wy-6,w+6,6);ctx.fillStyle='#4a5a62';ctx.beginPath();ctx.moveTo(x-2,wy-6);ctx.lineTo(x+w/2,wy-th*.5);ctx.lineTo(x+w+2,wy-6);ctx.fill();ctx.fillStyle='#c9a043';ctx.beginPath();ctx.moveTo(x+w/2-3,wy-th*.42);ctx.lineTo(x+w/2,wy-th*.58);ctx.lineTo(x+w/2+3,wy-th*.42);ctx.fill();
      for(let f=0;f<5;f++)lancet(x+w/2-4,fy-SP*(1.2+f*1.4),8,SP*.7,shadeHex(b.col,-.1),'#3a4a52');break}
    case'domecath':{// B-A16 the domed cathedral: a columned portico, two west towers, a great dome with a lantern
      stoneTex(x,wy,w,H,b.col,r);const cx=x+w/2,dr=w*.24,dy=top+b.d*.5;ctx.fillStyle=b.col;ctx.fillRect(cx-dr,dy-dr*.6,dr*2,dr*.7);for(let i=0;i<10;i++)ctx.fillStyle='rgba(0,0,0,.06)',ctx.fillRect(cx-dr+i*dr*.2,dy-dr*.6,2,dr*.7);
      ctx.fillStyle='#7a8a8e';ctx.beginPath();ctx.ellipse(cx,dy-dr*.6,dr,dr*.95,0,PI,TAU);ctx.fill();ctx.fillStyle='#93a3a6';ctx.beginPath();ctx.ellipse(cx-dr*.25,dy-dr*.75,dr*.45,dr*.65,0,PI,TAU);ctx.fill();
      ctx.fillStyle=b.col;ctx.fillRect(cx-7,dy-dr*1.55-22,14,22);ctx.fillStyle='#c9a043';dot(cx,dy-dr*1.55-26,4,'#c9a043');limb(cx,dy-dr*1.55-28,cx,dy-dr*1.55-38,'#c9a043',1.4);
      for(const tx of[x+6,x+w-46]){ctx.fillStyle=b.col;ctx.fillRect(tx,wy-H*.9,40,H*.9+2);stoneTex(tx,wy-H*.9,40,H*.9,b.col,r);ctx.fillStyle='#7a8a8e';ctx.beginPath();ctx.moveTo(tx-2,wy-H*.9);ctx.quadraticCurveTo(tx+20,wy-H*1.5,tx+42,wy-H*.9);ctx.fill();lancet(tx+15,wy-H*.7,10,20,'#d8d0bc','#3a4a52')}
      ctx.fillStyle=b.col;ctx.beginPath();ctx.moveTo(cx-w*.22,wy+4);ctx.lineTo(cx,wy-22);ctx.lineTo(cx+w*.22,wy+4);ctx.fill();ctx.strokeStyle=shadeHex(b.col,-.15);ctx.lineWidth=1.4;ctx.stroke();
      for(let i=0;i<8;i++){const px=cx-w*.2+i*w*.4/7;ctx.fillStyle='#f2ecdc';ctx.fillRect(px-2.5,wy+4,5,H-6);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(px+1,wy+4,1.5,H-6)}
      ctx.fillStyle='#bdb5a2';for(let q=0;q<4;q++)ctx.fillRect(cx-w*.24-q*5,fy+q*3,w*.48+q*10,3);break}
    // ---------- TC Bahía Vieja ----------
    case'colonial':{// TC4 painted townhouse: quoins, tall arched shuttered openings, iron balconies with flower pots, a cornice and parapet
      ctx.fillStyle='rgba(255,255,255,.06)';for(let yy=wy+6;yy<fy;yy+=9)ctx.fillRect(x,yy,w,1);
      ctx.fillStyle=b.trim;for(let yy=wy+4;yy<fy-4;yy+=10){ctx.fillRect(x,yy,5,6);ctx.fillRect(x+w-5,yy,5,6)}
      const n=Math.max(1,Math.round(w/32));
      for(let f=0;f<flo;f++){const base=fy-f*SP;for(let i=0;i<n;i++){const cx=x+w*(i+.5)/n,dw=12,dh=f===0?SP*.8:SP*.66,dy=base-dh-(f===0?0:SP*.14);
        ctx.fillStyle=b.trim;ctx.beginPath();ctx.moveTo(cx-dw/2-2,dy+dh);ctx.lineTo(cx-dw/2-2,dy+5);ctx.arc(cx,dy+5,dw/2+2,PI,TAU);ctx.lineTo(cx+dw/2+2,dy+dh);ctx.fill();
        const open=f===0&&b.sign&&i===Math.floor(n/2);ctx.fillStyle=open?'#3a3530':b.shut;ctx.beginPath();ctx.moveTo(cx-dw/2,dy+dh);ctx.lineTo(cx-dw/2,dy+5);ctx.arc(cx,dy+5,dw/2,PI,TAU);ctx.lineTo(cx+dw/2,dy+dh);ctx.fill();
        if(!open){ctx.fillStyle='rgba(0,0,0,.2)';for(let yy=dy+7;yy<dy+dh;yy+=3)ctx.fillRect(cx-dw/2,yy,dw,.8);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(cx-.5,dy+2,1,dh-2)}
        if(f>0){const by=base-SP*.14;ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(cx-dw/2-6,by+1.4,dw+12,3);ctx.fillStyle='#262626';ctx.fillRect(cx-dw/2-6,by-1,dw+12,2.4);ctx.fillRect(cx-dw/2-6,by-11,dw+12,1.2);
          for(let xx=cx-dw/2-6;xx<=cx+dw/2+6;xx+=2.6)ctx.fillRect(xx,by-11,.8,10);
          if(r()<.6)for(const px of[-1,1]){ctx.fillStyle='#b5543a';ctx.fillRect(cx+px*(dw/2+3)-2,by-15,4,4);dot(cx+px*(dw/2+3),by-16,3,r()<.5?'#d63384':'#4f8a3a');dot(cx+px*(dw/2+3)+1,by-17,1.2,'#f6d4e4')}}}}
      if(b.sign){const sw=Math.min(w*.8,74);ctx.fillStyle=b.trim;ctx.fillRect(x+w/2-sw/2,fy-SP*1.02,sw,9);bText(b.sign,x+w/2,fy-SP*1.02+4.5,6,'#4a3a2a',sw-4)}
      ctx.fillStyle=b.trim;ctx.fillRect(x-1,wy-2,w+2,5);ctx.fillStyle=b.col;ctx.fillRect(x,wy-9,w,7);ctx.fillStyle=b.trim;ctx.fillRect(x-1,wy-11,w+2,3);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x,wy+3,w,2);
      ctx.fillStyle=shadeHex(b.col,-.18);ctx.fillRect(x,fy-4,w,4);
      if(b.bou){const bx=x+w*(r()<.5?.12:.88);for(let i=0;i<14;i++)dot(bx+(r()-.5)*16,wy+6+r()*SP*1.2,2+r()*1.6,i%4?'#d6338a':'#3f7a36')}break}
    case'catedral':{// TC2 cream facade with two bell towers, a curved gable, a rose window and a tall arched door; a red dome behind
      const dxm=x+w/2,dym=top+b.d*.45;ctx.fillStyle=b.col;ctx.fillRect(dxm-28,dym-18,56,22);ctx.fillStyle=b.trim;ctx.fillRect(dxm-30,dym-20,60,4);
      ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(dxm-28,dym-20);ctx.quadraticCurveTo(dxm-28,dym-54,dxm,dym-58);ctx.quadraticCurveTo(dxm+28,dym-54,dxm+28,dym-20);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.moveTo(dxm-22,dym-22);ctx.quadraticCurveTo(dxm-22,dym-46,dxm-6,dym-54);ctx.quadraticCurveTo(dxm-14,dym-40,dxm-12,dym-22);ctx.fill();limb(dxm,dym-58,dxm,dym-70,'#d9a441',1.4);ctx.fillStyle='#d9a441';ctx.fillRect(dxm-4,dym-66,8,1.4);
      ctx.fillStyle='rgba(0,0,0,.05)';for(let yy=wy+6;yy<fy;yy+=8)ctx.fillRect(x,yy,w,1);
      const tw=w*.22,tH=H*1.75,gx=x+w/2;
      ctx.fillStyle=b.col;ctx.beginPath();ctx.moveTo(x+tw,wy+1);ctx.quadraticCurveTo(gx-w*.2,wy-8,gx-w*.13,wy-24);ctx.quadraticCurveTo(gx,wy-42,gx+w*.13,wy-24);ctx.quadraticCurveTo(gx+w*.2,wy-8,x+w-tw,wy+1);ctx.fill();ctx.strokeStyle=b.trim;ctx.lineWidth=2.4;ctx.stroke();
      limb(gx,wy-40,gx,wy-54,'#d9a441',1.6);ctx.fillStyle='#d9a441';ctx.fillRect(gx-5,wy-50,10,1.6);
      dot(gx,wy-16,10,b.trim);dot(gx,wy-16,7.5,'#4a6a8a');ctx.strokeStyle=b.trim;ctx.lineWidth=.8;ctx.beginPath();for(let q=0;q<8;q++){const a=q/8*TAU;ctx.moveTo(gx,wy-16);ctx.lineTo(gx+Math.cos(a)*7.5,wy-16+Math.sin(a)*7.5)}ctx.stroke();
      ctx.fillStyle=b.trim;ctx.fillRect(x+tw,wy-1,w-2*tw,4);for(const px of[x+tw+5,x+w-tw-9])ctx.fillRect(px,wy,4,H);
      const dw=34,dh=SP*1.3;ctx.fillStyle=b.trim;ctx.beginPath();ctx.moveTo(gx-dw/2-4,fy);ctx.lineTo(gx-dw/2-4,fy-dh+dw/2);ctx.arc(gx,fy-dh+dw/2,dw/2+4,PI,TAU);ctx.lineTo(gx+dw/2+4,fy);ctx.fill();
      ctx.fillStyle='#5a3424';ctx.beginPath();ctx.moveTo(gx-dw/2,fy);ctx.lineTo(gx-dw/2,fy-dh+dw/2);ctx.arc(gx,fy-dh+dw/2,dw/2,PI,TAU);ctx.lineTo(gx+dw/2,fy);ctx.fill();ctx.fillStyle='#3a2018';ctx.fillRect(gx-.6,fy-dh+4,1.2,dh-4);
      for(const wx of[gx-w*.2,gx+w*.2])bWin(wx-5,fy-SP*1.7,10,SP*.7,b.trim,{glass:'#4a6a8a'});
      for(const tx of[x,x+w-tw]){ctx.fillStyle=b.col;ctx.fillRect(tx,fy-tH,tw,tH);ctx.fillStyle='rgba(0,0,0,.08)';ctx.fillRect(tx+tw*.75,fy-tH,tw*.25,tH);
        ctx.fillStyle=b.trim;ctx.fillRect(tx-2,fy-H-2,tw+4,4);ctx.fillRect(tx-2,fy-tH-3,tw+4,5);ctx.fillRect(tx,fy-tH,3,tH);ctx.fillRect(tx+tw-3,fy-tH,3,tH);
        const ay=fy-tH+8,aw=tw*.5,acx=tx+tw/2;ctx.fillStyle='#3b3f45';ctx.beginPath();ctx.moveTo(acx-aw/2,ay+28);ctx.lineTo(acx-aw/2,ay+aw/2);ctx.arc(acx,ay+aw/2,aw/2,PI,TAU);ctx.lineTo(acx+aw/2,ay+28);ctx.fill();
        ctx.fillStyle='#c9a043';ctx.beginPath();ctx.moveTo(acx-5,ay+22);ctx.quadraticCurveTo(acx-4,ay+12,acx,ay+11);ctx.quadraticCurveTo(acx+4,ay+12,acx+5,ay+22);ctx.fill();
        bWin(acx-4,fy-H*.72,8,14,b.trim,{glass:'#4a6a8a'});
        ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(tx+1,fy-tH-3);ctx.quadraticCurveTo(tx+1,fy-tH-24,acx,fy-tH-26);ctx.quadraticCurveTo(tx+tw-1,fy-tH-24,tx+tw-1,fy-tH-3);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.moveTo(tx+5,fy-tH-5);ctx.quadraticCurveTo(tx+6,fy-tH-19,acx-2,fy-tH-23);ctx.quadraticCurveTo(tx+tw*.3,fy-tH-15,tx+tw*.3,fy-tH-5);ctx.fill();
        limb(acx,fy-tH-26,acx,fy-tH-36,'#d9a441',1.4);ctx.fillStyle='#d9a441';ctx.fillRect(acx-3.5,fy-tH-33,7,1.4)}
      ctx.fillStyle='#bdb5a2';for(let q=0;q<3;q++)ctx.fillRect(gx-30-q*5,fy+q*3,60+q*10,3);bText('CATEDRAL',gx,wy+12,6,'#7a5a3a',w*.4);break}
    case'alcaldia':{// TC3 town hall: an arcade of round arches, a long iron balcony, a clock turret
      const n=Math.max(4,Math.round(w/30)),aw=w/n;ctx.fillStyle=shadeHex(b.col,-.06);ctx.fillRect(x,fy-SP,w,SP);
      for(let i=0;i<n;i++){const cx=x+aw*(i+.5),hw=aw*.36;ctx.fillStyle='#4a3f36';ctx.beginPath();ctx.moveTo(cx-hw,fy);ctx.lineTo(cx-hw,fy-SP*.6);ctx.arc(cx,fy-SP*.6,hw,PI,TAU);ctx.lineTo(cx+hw,fy);ctx.fill();ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(cx-hw,fy-SP*.6,hw*.5,SP*.6)}
      ctx.fillStyle=b.trim;ctx.fillRect(x-2,fy-SP-2,w+4,4);
      for(let f=1;f<flo;f++){const base=fy-f*SP;for(let i=0;i<n;i++){const cx=x+aw*(i+.5);bWin(cx-6,base-SP*.8,12,SP*.62,b.trim,{glass:'#4f5f63',mull:true})}
        ctx.fillStyle='#262626';ctx.fillRect(x+3,base-SP*.16,w-6,2);ctx.fillRect(x+3,base-SP*.36,w-6,1.2);for(let xx=x+3;xx<x+w-3;xx+=3)ctx.fillRect(xx,base-SP*.36,.8,SP*.2)}
      ctx.fillStyle=b.trim;ctx.fillRect(x-2,wy-2,w+4,5);ctx.fillStyle=b.col;ctx.fillRect(x,wy-9,w,7);ctx.fillStyle=b.trim;ctx.fillRect(x-1,wy-11,w+2,3);
      const cx=x+w/2,ty=wy-11,tw=32;ctx.fillStyle=b.col;ctx.fillRect(cx-tw/2,ty-30,tw,30);ctx.fillStyle=b.trim;ctx.fillRect(cx-tw/2-2,ty-32,tw+4,3);
      dot(cx,ty-16,8.5,'#f6f3ea');ctx.strokeStyle='#3a3a3a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,ty-16,8.5,0,TAU);ctx.moveTo(cx,ty-16);ctx.lineTo(cx,ty-22);ctx.moveTo(cx,ty-16);ctx.lineTo(cx+4,ty-16);ctx.stroke();
      ctx.fillStyle=b.trim;ctx.beginPath();ctx.moveTo(cx-tw/2-2,ty-32);ctx.quadraticCurveTo(cx,ty-50,cx+tw/2+2,ty-32);ctx.fill();bText(b.sign||'ALCALDÍA',cx,fy-SP-9,6.5,'#5a3a22',w*.5);break}
    // ---------- TW Port Madrone ----------
    case'mission':{// TW2 white stucco, a red-tile arcade on round arches, a curved mission gable with a bell, a bell tower (the chapel has only the gable)
      ctx.fillStyle='rgba(0,0,0,.04)';for(let yy=wy+6;yy<fy;yy+=9)ctx.fillRect(x,yy,w,1);
      const gx=x+w/2,gw=Math.min(w*.4,130);
      ctx.fillStyle=b.col;ctx.beginPath();ctx.moveTo(gx-gw/2,wy+3);ctx.lineTo(gx-gw/2,wy-10);ctx.quadraticCurveTo(gx-gw/2+8,wy-12,gx-gw*.3,wy-24);ctx.quadraticCurveTo(gx-gw*.18,wy-42,gx,wy-44);ctx.quadraticCurveTo(gx+gw*.18,wy-42,gx+gw*.3,wy-24);ctx.quadraticCurveTo(gx+gw/2-8,wy-12,gx+gw/2,wy-10);ctx.lineTo(gx+gw/2,wy+3);ctx.fill();
      ctx.strokeStyle=shadeHex(b.col,-.12);ctx.lineWidth=1.6;ctx.stroke();
      ctx.fillStyle='#3b3f45';ctx.beginPath();ctx.moveTo(gx-7,wy-14);ctx.lineTo(gx-7,wy-26);ctx.arc(gx,wy-26,7,PI,TAU);ctx.lineTo(gx+7,wy-14);ctx.fill();ctx.fillStyle='#c9a043';ctx.beginPath();ctx.moveTo(gx-4,wy-16);ctx.quadraticCurveTo(gx,wy-28,gx+4,wy-16);ctx.fill();
      limb(gx,wy-44,gx,wy-56,'#4a3a2a',1.4);ctx.fillStyle='#4a3a2a';ctx.fillRect(gx-4.5,wy-52,9,1.4);
      if(b.chapel){const dh=SP*1.1;ctx.fillStyle='#6b3f24';ctx.beginPath();ctx.moveTo(gx-12,fy);ctx.lineTo(gx-12,fy-dh+12);ctx.arc(gx,fy-dh+12,12,PI,TAU);ctx.lineTo(gx+12,fy);ctx.fill();
        for(const wx of[x+w*.18,x+w*.82])bWin(wx-4,fy-SP*1.2,8,SP*.5,shadeHex(b.col,-.1),{glass:'#3f4e55'});break}
      const ah=SP*.95,n=Math.max(4,Math.round(w/34)),aw=w/n;
      for(let i=0;i<n;i++){const cx=x+aw*(i+.5),hw=aw*.38;ctx.fillStyle='#5a4a3c';ctx.beginPath();ctx.moveTo(cx-hw,fy);ctx.lineTo(cx-hw,fy-ah*.55);ctx.arc(cx,fy-ah*.55,hw,PI,TAU);ctx.lineTo(cx+hw,fy);ctx.fill()}
      for(let i=0;i<n;i++){const cx=x+aw*(i+.5);if(i%2)bWin(cx-5,fy-ah*.62,10,ah*.42,'#e9e0cc',{glass:'#3f4e55'});else{ctx.fillStyle='#6b3f24';ctx.fillRect(cx-5,fy-ah*.64,10,ah*.64)}}
      tileRoof(x-4,x+w+4,fy-ah-12,fy-ah+2,b.roofCol);
      if(flo>1)for(let i=0;i<n;i++){const cx=x+aw*(i+.5);if(Math.abs(cx-gx)<gw/2+6)continue;bWin(cx-5,fy-ah-SP*.72,10,SP*.42,shadeHex(b.col,-.08),{glass:'#3f4e55'})}
      const tw=46,tx=x+w-tw-6,tH=H+STORY*HS*BH*1.6;ctx.fillStyle=b.col;ctx.fillRect(tx,fy-tH,tw,tH-ah-12);ctx.fillStyle='rgba(0,0,0,.08)';ctx.fillRect(tx+tw*.7,fy-tH,tw*.3,tH-ah-12);
      for(const ox of[.28,.72]){const cx=tx+tw*ox;ctx.fillStyle='#3b3f45';ctx.beginPath();ctx.moveTo(cx-6,fy-tH+30);ctx.lineTo(cx-6,fy-tH+16);ctx.arc(cx,fy-tH+16,6,PI,TAU);ctx.lineTo(cx+6,fy-tH+30);ctx.fill();ctx.fillStyle='#c9a043';ctx.beginPath();ctx.moveTo(cx-3.5,fy-tH+26);ctx.quadraticCurveTo(cx,fy-tH+14,cx+3.5,fy-tH+26);ctx.fill()}
      ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(tx-4,fy-tH+2);ctx.lineTo(tx+tw/2,fy-tH-20);ctx.lineTo(tx+tw+4,fy-tH+2);ctx.fill();tileTex(tx,tx+tw,fy-tH-10,fy-tH+2,b.roofCol);
      limb(tx+tw/2,fy-tH-20,tx+tw/2,fy-tH-32,'#4a3a2a',1.4);ctx.fillStyle='#4a3a2a';ctx.fillRect(tx+tw/2-4,fy-tH-28,8,1.4);
      if(b.sign)bText(b.sign,gx,fy-ah-SP*.25,7,'#7a3a22',gw*.9);break}
    case'adobe':{// TW3 stucco shop under a red-tile visor, an arched wooden door, a carved sign, a curved parapet
      ctx.fillStyle='rgba(0,0,0,.04)';for(let yy=wy+6;yy<fy;yy+=9)ctx.fillRect(x,yy,w,1);
      const gh=SP*.92;ctx.fillStyle='#34495a';ctx.fillRect(x+8,fy-gh*.74,w*.56-8,gh*.64);ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.moveTo(x+8,fy-gh*.74);ctx.lineTo(x+8+w*.2,fy-gh*.74);ctx.lineTo(x+8,fy-gh*.3);ctx.fill();
      ctx.fillStyle='#5a3a24';for(let xx=x+8;xx<x+w*.56;xx+=(w*.56-8)/3)ctx.fillRect(xx,fy-gh*.74,2,gh*.64);
      const dx=x+w*.78;ctx.fillStyle='#6b3f24';ctx.beginPath();ctx.moveTo(dx-8,fy);ctx.lineTo(dx-8,fy-gh*.58);ctx.arc(dx,fy-gh*.58,8,PI,TAU);ctx.lineTo(dx+8,fy);ctx.fill();dot(dx+4,fy-gh*.32,1,'#d7b65c');
      tileRoof(x-3,x+w+3,fy-gh-10,fy-gh+1,b.roofCol);for(const px of[x+5,x+w-5])limb(px,fy-gh+1,px,fy-gh+7,'#5a3a24',1.6);
      if(flo>1){const n=Math.max(2,Math.round(w/34));for(let i=0;i<n;i++){const cx=x+w*(i+.5)/n;ctx.fillStyle='#5a3a24';ctx.fillRect(cx-7,fy-SP*1.78,14,SP*.5);bWin(cx-5.5,fy-SP*1.75,11,SP*.44,'#5a3a24',{glass:'#3f4e55'});
        if(r()<.5){ctx.fillStyle='#262626';ctx.fillRect(cx-9,fy-SP*1.28,18,2);for(let xx=cx-9;xx<=cx+9;xx+=3)ctx.fillRect(xx,fy-SP*1.4,.8,4)}}}
      ctx.fillStyle=b.col;ctx.beginPath();ctx.moveTo(x,wy+2);ctx.lineTo(x,wy-6);ctx.lineTo(x+w*.3,wy-6);ctx.quadraticCurveTo(x+w*.5,wy-24,x+w*.7,wy-6);ctx.lineTo(x+w,wy-6);ctx.lineTo(x+w,wy+2);ctx.closePath();ctx.fill();ctx.strokeStyle=shadeHex(b.col,-.14);ctx.lineWidth=1.4;ctx.stroke();
      const sw=Math.min(w*.62,72);ctx.fillStyle='#7a4e2e';ctx.fillRect(x+w/2-sw/2,wy+4,sw,11);ctx.strokeStyle='#4a2e1a';ctx.lineWidth=1;ctx.strokeRect(x+w/2-sw/2,wy+4,sw,11);bText(b.sign||'SHOP',x+w/2,wy+9.5,6.5,'#f6e7c6',sw-6);break}
    case'craftsman':{// TW4 craftsman bungalow: shingle walls, grouped windows, a deep porch on tapered columns over stone piers, rafter tails
      ctx.fillStyle='rgba(0,0,0,.08)';for(let yy=wy+3;yy<fy;yy+=4)for(let xx=x+((yy/4|0)%2?0:3);xx<x+w;xx+=6)ctx.fillRect(xx,yy,.8,3);
      for(const fx of[.14,.26,.84])bWin(x+w*fx-5,fy-SP*.74,10,SP*.46,b.trim,{mull:true,curtain:'#efe4cc'});
      ctx.fillStyle=b.door;ctx.fillRect(x+w*.55-7,fy-SP*.8,14,SP*.8);bWin(x+w*.55-4,fy-SP*.72,8,6,b.trim);
      const py=fy-SP*.98;ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(x-10,py+5);ctx.lineTo(x+w+10,py+5);ctx.lineTo(x+w+6,py-6);ctx.lineTo(x-6,py-6);ctx.fill();
      ctx.fillStyle=shadeHex(b.roofCol,.25);for(let xx=x-8;xx<x+w+8;xx+=7)ctx.fillRect(xx,py+5,2.4,3);
      for(const fx of[0,.38,.74,1]){const px=x+w*fx;ctx.fillStyle='#8a8478';ctx.fillRect(px-5,fy-SP*.36,10,SP*.36);ctx.fillStyle='rgba(0,0,0,.15)';for(let yy=fy-SP*.34;yy<fy;yy+=4)ctx.fillRect(px-5,yy,10,.8);
        ctx.fillStyle=b.trim;ctx.beginPath();ctx.moveTo(px-4,fy-SP*.36);ctx.lineTo(px-2.2,py+5);ctx.lineTo(px+2.2,py+5);ctx.lineTo(px+4,fy-SP*.36);ctx.fill()}
      ctx.fillStyle='#a9a69d';ctx.fillRect(x+w*.55-10,fy,20,3);break}
    // ---------- TP Harbor City ----------
    case'lanaishop':{// TP3 board-and-batten storefront; upstairs a lanai with a rail, a tin roof over it and posts down to the sidewalk
      ctx.strokeStyle=shadeHex(b.col,-.1);ctx.lineWidth=.8;ctx.beginPath();for(let xx=x+4;xx<x+w;xx+=5){ctx.moveTo(xx,wy);ctx.lineTo(xx,fy)}ctx.stroke();
      const gh=SP*.92;ctx.fillStyle='#34495a';ctx.fillRect(x+6,fy-gh*.8,w*.6-6,gh*.74);ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.moveTo(x+6,fy-gh*.8);ctx.lineTo(x+6+w*.22,fy-gh*.8);ctx.lineTo(x+6,fy-gh*.3);ctx.fill();
      ctx.fillStyle=b.trim;for(let q=0;q<=3;q++)ctx.fillRect(x+6+q*(w*.6-8)/3,fy-gh*.8,1.6,gh*.74);
      ctx.fillStyle=b.door;ctx.fillRect(x+w*.7,fy-gh*.84,w*.18,gh*.84);ctx.fillStyle='#55707e';ctx.fillRect(x+w*.72,fy-gh*.78,w*.14,gh*.4);
      for(let i=0;i<3;i++)dot(x+12+i*9,fy-3,3,['#e9b24a','#c94f3d','#6fa058'][(i+b.id)%3]);
      if(flo>1){const n=Math.max(2,Math.round(w/30));for(let i=0;i<n;i++){const cx=x+w*(i+.5)/n;ctx.fillStyle=b.trim;ctx.fillRect(cx-8,fy-SP*1.86,16,SP*.6);ctx.fillStyle='#5f7f86';ctx.fillRect(cx-6.5,fy-SP*1.83,13,SP*.54);ctx.fillStyle='rgba(255,255,255,.35)';for(let yy=fy-SP*1.81;yy<fy-SP*1.3;yy+=3)ctx.fillRect(cx-6.5,yy,13,1)}
        const dy=fy-SP;ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(x-4,dy+1,w+8,4);ctx.fillStyle=shadeHex(b.trim,-.06);ctx.fillRect(x-4,dy-3,w+8,4);
        ctx.strokeStyle=b.trim;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-4,dy-13);ctx.lineTo(x+w+4,dy-13);for(let xx=x-4;xx<=x+w+4;xx+=3.5){ctx.moveTo(xx,dy-13);ctx.lineTo(xx,dy-3)}ctx.stroke();
        const ry=fy-SP*2+3;ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(x-7,ry+6);ctx.lineTo(x+w+7,ry+6);ctx.lineTo(x+w+3,ry-3);ctx.lineTo(x-3,ry-3);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';for(let xx=x-5;xx<x+w+5;xx+=4)ctx.fillRect(xx,ry-3,1,9);
        const np=Math.max(2,Math.round(w/40));for(let i=0;i<=np;i++){const px=x-2+i*(w+4)/np;limb(px,ry+6,px,fy+8,b.trim,2.4)}}
      ctx.fillStyle=b.trim;ctx.fillRect(x+w*.1,wy-15,w*.8,14);ctx.fillStyle=shadeHex(b.trim,-.2);ctx.fillRect(x+w*.1,wy-2,w*.8,1.6);bText(b.sign||'STORE',x+w/2,wy-8,7.5,'#2f4a4a',w*.72);break}
    case'pcottage':{// TP4 plantation cottage: board walls on a raised floor with a lattice skirt, jalousie windows, a front lanai, a tin hip roof
      ctx.strokeStyle=shadeHex(b.col,-.08);ctx.lineWidth=.7;ctx.beginPath();for(let xx=x+4;xx<x+w;xx+=5){ctx.moveTo(xx,wy);ctx.lineTo(xx,fy-6)}ctx.stroke();
      ctx.fillStyle='#e9e2d0';ctx.fillRect(x,fy-6,w,6);ctx.strokeStyle='rgba(90,70,50,.5)';ctx.lineWidth=.6;ctx.beginPath();for(let xx=x;xx<x+w;xx+=4){ctx.moveTo(xx,fy-6);ctx.lineTo(xx+4,fy);ctx.moveTo(xx+4,fy-6);ctx.lineTo(xx,fy)}ctx.stroke();
      for(const fx of[.2,.8]){const cx=x+w*fx;ctx.fillStyle=b.trim;ctx.fillRect(cx-8,fy-SP*.82,16,SP*.5);ctx.fillStyle='#5f7f86';ctx.fillRect(cx-6.5,fy-SP*.79,13,SP*.44);ctx.fillStyle='rgba(255,255,255,.35)';for(let yy=fy-SP*.77;yy<fy-SP*.36;yy+=3)ctx.fillRect(cx-6.5,yy,13,1)}
      ctx.fillStyle=b.door;ctx.fillRect(x+w/2-7,fy-SP*.84,14,SP*.78);ctx.fillStyle='#a9a69d';ctx.fillRect(x+w/2-10,fy,20,3);ctx.fillRect(x+w/2-8,fy+3,16,2);
      if(b.porch){const py=fy-SP*.98;ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(x-6,py+4);ctx.lineTo(x+w+6,py+4);ctx.lineTo(x+w+2,py-6);ctx.lineTo(x-2,py-6);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';for(let xx=x-4;xx<x+w+4;xx+=4)ctx.fillRect(xx,py-6,1,10);
        for(let i=0;i<=4;i++)limb(x+2+i*(w-4)/4,py+5,x+2+i*(w-4)/4,fy-6,b.trim,2.2);ctx.strokeStyle=b.trim;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,fy-SP*.4);ctx.lineTo(x+w*.4,fy-SP*.4);ctx.moveTo(x+w*.6,fy-SP*.4);ctx.lineTo(x+w,fy-SP*.4);ctx.stroke()}break}
    case'lanaihall':{// TP2 white hall with a lanai on both floors on slim columns, a green tin hip roof, a flag
      const n=Math.max(5,Math.round(w/28));for(let f=0;f<flo;f++){const base=fy-f*SP;for(let i=0;i<n;i++){const cx=x+w*(i+.5)/n;if(f===0&&i===Math.floor(n/2)){ctx.fillStyle='#5a3424';ctx.fillRect(cx-8,base-SP*.8,16,SP*.8);continue}bWin(cx-6,base-SP*.78,12,SP*.56,'#ffffff',{glass:'#4f6a72',mull:true})}
        ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x,base-SP,w,6);ctx.fillStyle=b.trim;ctx.fillRect(x-6,base-SP-1,w+12,4);
        for(let i=0;i<=n;i++){const px=x-4+i*(w+8)/n;limb(px,base-SP+3,px,base,'#ffffff',2.6)}
        if(f>0){ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-4,base-SP*.36);ctx.lineTo(x+w+4,base-SP*.36);for(let xx=x-4;xx<=x+w+4;xx+=3.5){ctx.moveTo(xx,base-SP*.36);ctx.lineTo(xx,base-2)}ctx.stroke()}}
      ctx.fillStyle='#bdb5a2';for(let q=0;q<3;q++)ctx.fillRect(x+w/2-22-q*4,fy+q*3,44+q*8,3);
      ctx.fillStyle='#ffffff';ctx.fillRect(x+w/2-36,wy-14,72,12);bText(b.sign||'CITY HALL',x+w/2,wy-8,7,'#2f4a3a',66);
      const fx=x+w*.86,fyy=top+b.d*.4;limb(fx,fyy,fx,fyy-46,'#4d4d4a',1.6);ctx.fillStyle='#2f8f86';ctx.fillRect(fx,fyy-46,14,8);ctx.fillStyle='#f4efe0';ctx.fillRect(fx,fyy-42,14,1.6);break}
    case'rowhouse':{clap(x,wy,w,H,b.col);const n=2,ww=12,wh=SP*.46;for(let f=1;f<flo;f++){const yy=fy-(f+1)*SP+SP*.24;for(let i=0;i<n;i++)bWin(x+w*(i+1)/(n+1)-ww/2,yy,ww,wh,'#f6f3ea',{shut:b.shut,sill:'#e9e3d6',mull:true,curtain:r()<.4?'#efe4cc':null})}
      const dl=r()<.5,dx=dl?x+w*.3:x+w*.7;ctx.fillStyle='#f6f3ea';ctx.fillRect(dx-9,fy-SP*.82,18,SP*.82);ctx.fillStyle=b.door;ctx.fillRect(dx-6.5,fy-SP*.76,13,SP*.76-3);dot(dx+3.6,fy-SP*.38,1,'#d7b65c');ctx.fillStyle='#cfe3ea';ctx.fillRect(dx-6,fy-SP*.88,12,4);
      bWin(dl?x+w*.72-6:x+w*.28-6,fy-SP*.72,12,SP*.46,'#f6f3ea',{shut:b.shut,mull:true});
      ctx.fillStyle='#a9a69d';ctx.fillRect(dx-11,fy,22,3);ctx.fillRect(dx-13,fy+3,26,3);
      ctx.fillStyle=b.trim;ctx.fillRect(x-2,wy,w+4,5);ctx.fillStyle='rgba(0,0,0,.15)';for(let xx=x+3;xx<x+w-2;xx+=6)ctx.fillRect(xx,wy+5,2.4,2.4);break}
    case'apartment':{ctx.fillStyle='rgba(255,255,255,.07)';for(let yy=wy+5;yy<fy;yy+=5)ctx.fillRect(x,yy,w,1);
      const cols=Math.max(2,Math.floor(w/30)),ww=13,wh=SP*.48;for(let f=1;f<flo;f++){const yy=fy-(f+1)*SP+SP*.24;for(let i=0;i<cols;i++){bWin(x+w*(i+.5)/cols-ww/2,yy,ww,wh,b.trim,{sill:b.trim,mull:true,curtain:r()<.35?'#e8dcc4':null});ctx.fillStyle=b.trim;ctx.fillRect(x+w*(i+.5)/cols-ww/2-1.5,yy-4,ww+3,2.4)}}
      for(let i=0;i<cols;i++){if(i===Math.floor(cols/2))continue;bWin(x+w*(i+.5)/cols-ww/2,fy-SP*.72,ww,SP*.42,b.trim,{mull:true})}
      const ex=x+w*(Math.floor(cols/2)+.5)/cols;ctx.fillStyle='#2c2b29';ctx.fillRect(ex-9,fy-SP*.8,18,SP*.8);ctx.fillStyle='#6b8796';ctx.fillRect(ex-7,fy-SP*.76,14,SP*.5);ctx.fillStyle='#2f3a4a';ctx.beginPath();ctx.moveTo(ex-15,fy-SP*.86);ctx.lineTo(ex+15,fy-SP*.86);ctx.lineTo(ex+12,fy-SP*.78);ctx.lineTo(ex-12,fy-SP*.78);ctx.fill();
      if(b.fire){const fx=x+w*(.5/cols),fw=w/cols*.9;ctx.strokeStyle='#26282a';ctx.lineWidth=1.2;for(let f=1;f<flo;f++){const yy=fy-f*SP-SP*.04;ctx.fillStyle='#26282a';ctx.fillRect(fx-fw/2,yy,fw,2);ctx.beginPath();for(let xx=fx-fw/2;xx<=fx+fw/2;xx+=4){ctx.moveTo(xx,yy);ctx.lineTo(xx,yy-7)}ctx.moveTo(fx-fw/2,yy-7);ctx.lineTo(fx+fw/2,yy-7);
        if(f<flo-1){ctx.moveTo(fx-fw*.35,yy);ctx.lineTo(fx+fw*.35,yy-SP)}ctx.stroke()}}
      ctx.fillStyle=b.trim;ctx.fillRect(x-2,wy,w+4,5);break}
    case'office':{for(let f=1;f<flo;f++){const yy=fy-(f+1)*SP;ctx.fillStyle=b.col;ctx.fillRect(x,yy,w,SP);ctx.fillStyle='#d7d6d0';ctx.fillRect(x,yy+SP-8,w,8);
        ctx.fillStyle='#3e5a6c';ctx.fillRect(x+4,yy+3,w-8,SP-12);ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.moveTo(x+4,yy+3);ctx.lineTo(x+4+w*.3,yy+3);ctx.lineTo(x+4,yy+SP-9);ctx.fill();
        ctx.fillStyle='rgba(180,205,220,.25)';ctx.fillRect(x+w*.55,yy+3,w*.12,SP-12);ctx.fillStyle='#c9ccc8';for(let xx=x+4;xx<x+w-4;xx+=15)ctx.fillRect(xx,yy+3,1.4,SP-12)}
      ctx.fillStyle='#d7d6d0';ctx.fillRect(x,fy-SP,w,SP);ctx.fillStyle='#2f4250';ctx.fillRect(x+8,fy-SP+8,w-16,SP-8);ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(x+8,fy-SP+8,(w-16)*.4,SP*.3);
      ctx.fillStyle='#c9ccc8';for(let xx=x+8;xx<x+w-8;xx+=18)ctx.fillRect(xx,fy-SP+8,1.6,SP-8);ctx.fillStyle='#1d2730';ctx.fillRect(x+w/2-9,fy-SP*.7,18,SP*.7);ctx.fillStyle='#e9e7df';ctx.fillRect(x+w/2-20,fy-SP+2,40,5);ctx.fillStyle='#d7d6d0';ctx.fillRect(x-2,wy,w+4,4);break}
    case'hotel':{for(let f=1;f<flo;f++){const yy=fy-(f+1)*SP;const cols=Math.max(2,Math.floor(w/34));for(let i=0;i<cols;i++){const cx=x+w*(i+.5)/cols;bWin(cx-9,yy+SP*.2,18,SP*.62,'#ffffff',{glass:'#4a6b7c',mull:true});
          ctx.fillStyle='#ffffff';ctx.fillRect(cx-13,yy+SP*.82,26,3);ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(cx-13,yy+SP*.6);ctx.lineTo(cx+13,yy+SP*.6);for(let xx=cx-13;xx<=cx+13;xx+=3.25){ctx.moveTo(xx,yy+SP*.6);ctx.lineTo(xx,yy+SP*.82)}ctx.stroke();ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(cx-13,yy+SP*.85,26,2)}}
      ctx.fillStyle='#2f4250';ctx.fillRect(x+10,fy-SP*.82,w-20,SP*.82);ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(x+10,fy-SP*.82,(w-20)*.35,SP*.3);awning(x+w/2-34,x+w/2+34,fy-SP*.98,12,b.awn);
      const sw=Math.min(w*.8,110);ctx.fillStyle='#24384a';ctx.fillRect(x+w/2-sw/2,wy-20,sw,16);limb(x+w/2-sw*.3,wy-4,x+w/2-sw*.3,wy,'#24384a',1.4);limb(x+w/2+sw*.3,wy-4,x+w/2+sw*.3,wy,'#24384a',1.4);bText(b.sign,x+w/2,wy-12,9.5,'#ffe9a8',sw-8);ctx.fillStyle=b.trim;ctx.fillRect(x-2,wy,w+4,4);break}
    case'shop':case'kiosk':{const ups=flo-1;for(let f=1;f<=ups;f++){const yy=fy-(f+1)*SP+SP*.24,cols=Math.max(2,Math.floor(w/32));for(let i=0;i<cols;i++)bWin(x+w*(i+.5)/cols-6.5,yy,13,SP*.48,b.trim,{sill:b.trim,mull:true,curtain:r()<.4?'#efe4cc':null})}
      const gh=SP*(k==='kiosk'?.8:.92);ctx.fillStyle=shadeHex(b.col,-.12);ctx.fillRect(x,fy-gh,w,gh);ctx.fillStyle='#34495a';ctx.fillRect(x+6,fy-gh*.78,w*.62-6,gh*.72);ctx.fillStyle='rgba(255,255,255,.24)';ctx.beginPath();ctx.moveTo(x+6,fy-gh*.78);ctx.lineTo(x+6+w*.25,fy-gh*.78);ctx.lineTo(x+6,fy-gh*.3);ctx.fill();
      for(let i=0;i<4;i++){const ix=x+10+i*(w*.62-14)/4;ctx.fillStyle=['#e9b24a','#c94f3d','#6fa058','#e5ddc8'][(i+b.id)%4];ctx.fillRect(ix,fy-gh*.24,(w*.62-14)/4-3,gh*.18)}
      ctx.fillStyle='#2b2a28';ctx.fillRect(x+w*.72,fy-gh*.82,w*.2,gh*.82);ctx.fillStyle='#55707e';ctx.fillRect(x+w*.74,fy-gh*.76,w*.16,gh*.42);
      awning(x+3,x+w-3,fy-gh-2,13,b.awn||['#c23b2e','#f4efe4']);ctx.fillStyle='#24384a';const sw=w*.7;ctx.fillRect(x+w/2-sw/2,fy-gh-17,sw,12);bText(b.sign||'SHOP',x+w/2,fy-gh-11,7.5,'#fff4d6',sw-6);
      ctx.fillStyle=b.trim;ctx.fillRect(x-2,wy,w+4,4);
      if(b.parapet){// a false front: stepped parapet with a cornice, the way prairie main streets look
        const pc=shadeHex(b.col,-.04),st=w>95;ctx.fillStyle=pc;ctx.fillRect(x,wy-9,w,10);if(st){ctx.fillRect(x+w*.3,wy-17,w*.4,9)}
        ctx.fillStyle=b.trim;ctx.fillRect(x-2,wy-11,w+4,3);if(st)ctx.fillRect(x+w*.3-2,wy-19,w*.4+4,3);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x,wy-8,w,2)}
      break}
    case'courthouse':{// limestone county courthouse: tall windows, a columned porch, a clock cupola on the roof
      const ww=11,wh=SP*.62,cols=Math.max(4,Math.floor(w/26));ctx.fillStyle='rgba(0,0,0,.06)';for(let yy=wy+6;yy<fy;yy+=7)ctx.fillRect(x,yy,w,1);
      for(let f=0;f<flo;f++){const yy=fy-(f+1)*SP+SP*.2;for(let i=0;i<cols;i++){const cx=x+w*(i+.5)/cols;if(Math.abs(cx-(x+w/2))<w*.17)continue;bWin(cx-ww/2,yy,ww,wh,b.trim,{glass:'#3c5463',mull:true,sill:b.trim})}}
      ctx.fillStyle=b.trim;ctx.fillRect(x-3,wy-2,w+6,6);ctx.fillRect(x-2,fy-SP*1.05,w+4,3);
      const pw=w*.34,px=x+w/2-pw/2,ph=SP*2.15;ctx.fillStyle=shadeHex(b.col,.06);ctx.fillRect(px,fy-ph,pw,ph);
      ctx.fillStyle=b.trim;ctx.beginPath();ctx.moveTo(px-6,fy-ph);ctx.lineTo(px+pw/2,fy-ph-22);ctx.lineTo(px+pw+6,fy-ph);ctx.fill();ctx.fillStyle=shadeHex(b.col,-.06);ctx.beginPath();ctx.moveTo(px+4,fy-ph-3);ctx.lineTo(px+pw/2,fy-ph-16);ctx.lineTo(px+pw-4,fy-ph-3);ctx.fill();
      ctx.fillStyle='#2c3a42';ctx.fillRect(px+8,fy-SP*.9,pw-16,SP*.9);for(let i=0;i<4;i++){const cx=px+6+i*(pw-12)/3;ctx.fillStyle='#f6f1e3';ctx.fillRect(cx-3,fy-ph+4,6,ph-4);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(cx+1.5,fy-ph+4,1.5,ph-4)}
      ctx.fillStyle=b.trim;ctx.fillRect(px-4,fy-ph,pw+8,5);bText(b.sign||'COURTHOUSE',px+pw/2,fy-ph+11,6,'#5a4e3a',pw-10);
      ctx.fillStyle='#bdb5a2';for(let k=0;k<3;k++)ctx.fillRect(px-6-k*4,fy+k*3,pw+12+k*8,3);
      // cupola from the middle of the roof
      const ry=top+b.d*.5,cx=x+w/2,dw=46,dh=38;ctx.fillStyle=b.trim;ctx.fillRect(cx-dw/2-4,ry-6,dw+8,8);ctx.fillStyle=b.col;ctx.fillRect(cx-dw/2,ry-dh,dw,dh-4);ctx.fillStyle='rgba(0,0,0,.1)';ctx.fillRect(cx+dw*.2,ry-dh,dw*.3,dh-4);
      dot(cx,ry-dh*.55,10,'#f6f3ea');ctx.strokeStyle='#3a3a3a';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,ry-dh*.55,10,0,TAU);ctx.moveTo(cx,ry-dh*.55);ctx.lineTo(cx,ry-dh*.55-7);ctx.moveTo(cx,ry-dh*.55);ctx.lineTo(cx+5,ry-dh*.55);ctx.stroke();
      ctx.fillStyle=b.trim;ctx.fillRect(cx-dw/2-3,ry-dh-4,dw+6,5);ctx.fillStyle='#6f9284';ctx.beginPath();ctx.moveTo(cx-dw/2,ry-dh-4);ctx.quadraticCurveTo(cx-dw/2,ry-dh-36,cx,ry-dh-40);ctx.quadraticCurveTo(cx+dw/2,ry-dh-36,cx+dw/2,ry-dh-4);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.moveTo(cx-dw/2+5,ry-dh-6);ctx.quadraticCurveTo(cx-dw/2+4,ry-dh-30,cx-4,ry-dh-36);ctx.quadraticCurveTo(cx-dw/2+12,ry-dh-24,cx-dw/2+12,ry-dh-6);ctx.fill();
      limb(cx,ry-dh-40,cx,ry-dh-54,'#4d4d4a',1.6);ctx.fillStyle='#c23b2e';ctx.fillRect(cx,ry-dh-54,12,7);ctx.fillStyle='#2d55a8';ctx.fillRect(cx,ry-dh-54,5,4);break}
    case'elevator':{// the co-op's headhouse: a tall concrete leg with a spout across to the bins
      ctx.fillStyle='rgba(0,0,0,.05)';for(let xx=x+8;xx<x+w;xx+=12)ctx.fillRect(xx,wy,1.5,H);ctx.fillStyle='rgba(0,0,0,.1)';ctx.fillRect(x+w*.7,wy,w*.3,H);
      for(let yy=wy+18;yy<fy-30;yy+=26)bWin(x+w*.3-4,yy,8,10,'#c9c2b1',{glass:'#3d4a52'});ctx.fillStyle='#3a3f42';ctx.fillRect(x+w*.5,fy-SP*1.1,w*.32,SP*1.1);
      ctx.fillStyle='#8a2f28';ctx.fillRect(x+4,wy+10,w-8,18);bText(b.sign||'CO-OP',x+w/2,wy+19.5,9,'#fff3d6',w-14);
      const hx=x+w*.18,hw=w*.64,hh=56;ctx.fillStyle=shadeHex(b.col,.04);ctx.fillRect(hx,top+b.d*.4-hh,hw,hh);ctx.fillStyle='rgba(0,0,0,.1)';ctx.fillRect(hx+hw*.7,top+b.d*.4-hh,hw*.3,hh);ctx.fillStyle=b.trim;ctx.fillRect(hx-3,top+b.d*.4-hh-4,hw+6,5);
      bWin(hx+hw*.3-4,top+b.d*.4-hh+14,8,10,'#c9c2b1',{glass:'#3d4a52'});
      ctx.strokeStyle='#6b6f70';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hx,top+b.d*.4-hh+10);ctx.lineTo(x-170,top+b.d*.4-hh*.35);ctx.stroke();ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(hx,top+b.d*.4-hh+18);ctx.lineTo(x-170,top+b.d*.4-hh*.35+8);ctx.stroke();break}
    case'church':{clap(x,wy,w,H,b.col);for(const fx of[.2,.8]){const cx=x+w*fx;ctx.fillStyle='#e0dccf';ctx.beginPath();ctx.moveTo(cx-9,fy-8);ctx.lineTo(cx-9,fy-SP*1.5);ctx.arc(cx,fy-SP*1.5,9,PI,TAU);ctx.lineTo(cx+9,fy-8);ctx.fill();ctx.fillStyle='#5a7a9a';ctx.beginPath();ctx.moveTo(cx-6.5,fy-10);ctx.lineTo(cx-6.5,fy-SP*1.5);ctx.arc(cx,fy-SP*1.5,6.5,PI,TAU);ctx.lineTo(cx+6.5,fy-10);ctx.fill();ctx.fillStyle='#d9a441';ctx.fillRect(cx-6.5,fy-SP*1.2,13,3);ctx.fillStyle='#b2463a';ctx.fillRect(cx-.7,fy-SP*1.9,1.4,SP*1.5)}
      // the steeple stands in front of the nave
      const tw=38,tx=x+w/2-tw/2,tH=STORY*HS*BH*3.2;ctx.fillStyle='#f6f3ec';ctx.fillRect(tx,fy-tH,tw,tH);clap(tx,fy-tH,tw,tH,'#f6f3ec');ctx.fillStyle='#e0dccf';ctx.fillRect(tx+tw-6,fy-tH,6,tH);
      ctx.fillStyle='#7a2e2a';ctx.beginPath();ctx.moveTo(tx+9,fy);ctx.lineTo(tx+9,fy-26);ctx.arc(tx+tw/2,fy-26,10,PI,TAU);ctx.lineTo(tx+tw-9,fy);ctx.fill();ctx.fillStyle='#5e2420';ctx.fillRect(tx+tw/2-.7,fy-34,1.4,34);
      dot(tx+tw/2,fy-tH*.62,7.5,'#ffffff');ctx.strokeStyle='#3a3a3a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(tx+tw/2,fy-tH*.62,7.5,0,TAU);ctx.moveTo(tx+tw/2,fy-tH*.62);ctx.lineTo(tx+tw/2,fy-tH*.62-5);ctx.moveTo(tx+tw/2,fy-tH*.62);ctx.lineTo(tx+tw/2+3.5,fy-tH*.62);ctx.stroke();
      const by=fy-tH;ctx.fillStyle='#f6f3ec';ctx.fillRect(tx+4,by-26,tw-8,26);ctx.fillStyle='#3b3f45';for(const dx of[8,tw/2-3,tw-14])ctx.fillRect(tx+dx,by-21,6,16);ctx.fillStyle=b.trim;ctx.fillRect(tx+1,by-2,tw-2,4);ctx.fillRect(tx+3,by-28,tw-6,3);
      ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(tx+4,by-28);ctx.lineTo(tx+tw/2,by-28-tH*.62);ctx.lineTo(tx+tw-4,by-28);ctx.fill();ctx.fillStyle=shadeHex(b.roofCol,.15);ctx.beginPath();ctx.moveTo(tx+4,by-28);ctx.lineTo(tx+tw/2,by-28-tH*.62);ctx.lineTo(tx+tw/2,by-28);ctx.fill();
      limb(tx+tw/2,by-28-tH*.62,tx+tw/2,by-36-tH*.62,'#d9a441',1.4);break}
    case'barn':{const R=roofRise(b);ctx.strokeStyle=shadeHex(b.col,-.15);ctx.lineWidth=.8;ctx.beginPath();for(let xx=x+5;xx<x+w;xx+=5){ctx.moveTo(xx,wy-(Math.abs(xx-(x+w/2))<w*.34?R*.6*(1-Math.abs(xx-(x+w/2))/(w*.5)):0));ctx.lineTo(xx,fy)}ctx.stroke();
      const dw=w*.42,dx=x+w/2-dw/2,dh=H*.72;ctx.fillStyle=shadeHex(b.col,-.08);ctx.fillRect(dx,fy-dh,dw,dh);ctx.strokeStyle=b.trim;ctx.lineWidth=2.4;ctx.strokeRect(dx,fy-dh,dw,dh);ctx.beginPath();ctx.moveTo(dx+dw/2,fy-dh);ctx.lineTo(dx+dw/2,fy);
      for(const [a0,a1] of[[dx,dx+dw/2],[dx+dw/2,dx+dw]]){ctx.moveTo(a0,fy-dh);ctx.lineTo(a1,fy);ctx.moveTo(a1,fy-dh);ctx.lineTo(a0,fy)}ctx.stroke();
      ctx.fillStyle='#3a2a22';ctx.fillRect(x+w/2-11,wy-R*.55,22,22);ctx.strokeStyle=b.trim;ctx.lineWidth=2;ctx.strokeRect(x+w/2-11,wy-R*.55,22,22);ctx.beginPath();ctx.moveTo(x+w/2-11,wy-R*.55);ctx.lineTo(x+w/2+11,wy-R*.55+22);ctx.stroke();
      for(const fx of[.12,.88]){bWin(x+w*fx-7,fy-dh*.82,14,14,b.trim,{glass:'#2c2a28',mull:true})}
      ctx.fillStyle=b.trim;ctx.fillRect(x,wy-1,w,2.4);ctx.fillRect(x,fy-2.4,w,2.4);ctx.fillRect(x,wy,2.4,H);ctx.fillRect(x+w-2.4,wy,2.4,H);break}
    case'house':case'cottage':{clap(x,wy,w,H,b.col);const ww=12,wh=SP*.5;
      if(flo>1)for(let i=0;i<3;i++)bWin(x+w*(i+.5)/3-ww/2,fy-2*SP+SP*.22,ww,wh,'#f6f3ea',{shut:b.shut,mull:true,curtain:'#efe4cc'});
      for(const fx of[.2,.8])bWin(x+w*fx-ww/2,fy-SP*.74,ww,wh,'#f6f3ea',{shut:b.shut,mull:true,curtain:'#efe4cc'});
      ctx.fillStyle=b.door;ctx.fillRect(x+w/2-7,fy-SP*.8,14,SP*.8);dot(x+w/2+4,fy-SP*.4,1,'#d7b65c');
      if(b.porch){const py=fy-SP*.98;ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(x-6,py+4);ctx.lineTo(x+w+6,py+4);ctx.lineTo(x+w+2,py-6);ctx.lineTo(x-2,py-6);ctx.fill();ctx.fillStyle=shadeHex(b.roofCol,.2);ctx.fillRect(x-6,py+3,w+12,2);
        for(let i=0;i<=5;i++)limb(x+2+i*(w-4)/5,py+5,x+2+i*(w-4)/5,fy,'#f6f3ea',2.2);ctx.strokeStyle='#f6f3ea';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,fy-SP*.36);ctx.lineTo(x+w*.38,fy-SP*.36);ctx.moveTo(x+w*.62,fy-SP*.36);ctx.lineTo(x+w,fy-SP*.36);ctx.stroke()}
      ctx.fillStyle='#a9a69d';ctx.fillRect(x+w/2-10,fy,20,3);break}
    case'shed':{ctx.fillStyle='rgba(255,255,255,.14)';for(let xx=x+3;xx<x+w;xx+=6)ctx.fillRect(xx,wy,1.4,H);ctx.fillStyle='#2f3436';ctx.fillRect(x+w*.12,fy-H*.82,w*.5,H*.82);ctx.fillStyle='#4d5a3a';ctx.fillRect(x+w*.18,fy-H*.4,w*.24,H*.36);ctx.fillStyle='#262a2b';ctx.beginPath();ctx.arc(x+w*.22,fy-6,6,0,TAU);ctx.arc(x+w*.4,fy-5,4,0,TAU);ctx.fill();bWin(x+w*.75,fy-H*.66,14,10,'#d9dcdd');break}
    case'bait':{clap(x,wy,w,H,b.col);ctx.fillStyle='#2b241e';ctx.fillRect(x+w*.62,fy-H*.82,18,H*.82);bWin(x+w*.16,fy-H*.66,22,14,'#e9dcc0',{mull:true});ctx.fillStyle='#e9dcc0';ctx.fillRect(x+6,wy-R0(b)*.55-12,w-12,14);bText(b.sign,x+w/2,wy-R0(b)*.55-5,7,'#5a3a22',w-16);
      ctx.fillStyle='#d4dfe2';ctx.fillRect(x+w+4,fy-14,18,14);ctx.fillStyle='#2d55a8';ctx.fillRect(x+w+4,fy-14,18,4);bText('ICE',x+w+13,fy-6,5.5,'#2d55a8');break}
  }}
const R0=b=>roofRise(b);
function owSilo(b,r){const R=b.w/2,cx=b.x+R,base=b.y+b.d/2+R*.45,H=bPx(b),topY=base-H;
  const g=ctx.createLinearGradient(cx-R,0,cx+R,0);g.addColorStop(0,shadeHex(b.col,.1));g.addColorStop(.35,shadeHex(b.col,.16));g.addColorStop(1,shadeHex(b.col,-.18));ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(cx-R,topY);ctx.lineTo(cx-R,base);ctx.ellipse(cx,base,R,R*.35,0,PI,0,true);ctx.lineTo(cx+R,topY);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.12)';ctx.lineWidth=1;for(let yy=topY+14;yy<base;yy+=14){ctx.beginPath();ctx.ellipse(cx,yy,R,R*.35,0,0,PI);ctx.stroke()}
  ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.ellipse(cx,topY,R,R*.35,0,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(cx-R,topY);ctx.quadraticCurveTo(cx-R*.8,topY-R*.95,cx,topY-R*.95);ctx.quadraticCurveTo(cx+R*.8,topY-R*.95,cx+R,topY);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.moveTo(cx-R*.75,topY-R*.1);ctx.quadraticCurveTo(cx-R*.55,topY-R*.8,cx-R*.1,topY-R*.88);ctx.quadraticCurveTo(cx-R*.45,topY-R*.5,cx-R*.75,topY-R*.1);ctx.fill();
  ctx.strokeStyle='#5c5f5c';ctx.lineWidth=1;ctx.beginPath();const lx=cx+R*.35;ctx.moveTo(lx,base);ctx.lineTo(lx,topY);ctx.moveTo(lx+5,base);ctx.lineTo(lx+5,topY);for(let yy=base-4;yy>topY;yy-=5){ctx.moveTo(lx,yy);ctx.lineTo(lx+5,yy)}ctx.stroke()}
function owWaterTower(b,r){const cx=b.x+b.w/2,fy=b.y+b.d,H=bPx(b),R=b.w*.78,tb=fy-H*.62,tt=fy-H*.9;
  ctx.fillStyle='rgba(16,30,22,.18)';ctx.beginPath();ctx.ellipse(cx+H*.2,fy+4,R*1.1,R*.3,0,0,TAU);ctx.fill();
  for(const [dx,c,wd] of[[-.32,'#8d999d',2.2],[.32,'#8d999d',2.2],[-.62,'#a9b4b7',3],[.62,'#a9b4b7',3]])limb(cx+dx*b.w*.9,fy-(Math.abs(dx)<.5?6:0),cx+dx*b.w*.55,tb+4,c,wd);
  ctx.strokeStyle='#9aa6aa';ctx.lineWidth=1;ctx.beginPath();for(const f of[.3,.62]){const y=fy-(fy-tb)*f,hw=lerp(b.w*.56,b.w*.34,f);ctx.moveTo(cx-hw,y);ctx.lineTo(cx+hw,y)}ctx.moveTo(cx-b.w*.56,fy);ctx.lineTo(cx+b.w*.45,fy-(fy-tb)*.62);ctx.moveTo(cx+b.w*.56,fy);ctx.lineTo(cx-b.w*.45,fy-(fy-tb)*.62);ctx.stroke();
  limb(cx,fy,cx,tb,'#8d999d',3.2);
  const g=ctx.createLinearGradient(cx-R,0,cx+R,0);g.addColorStop(0,shadeHex(b.col,.04));g.addColorStop(.35,shadeHex(b.col,.14));g.addColorStop(1,shadeHex(b.col,-.2));ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(cx-R,tt);ctx.lineTo(cx-R,tb-R*.25);ctx.quadraticCurveTo(cx-R*.9,tb+R*.25,cx,tb+R*.32);ctx.quadraticCurveTo(cx+R*.9,tb+R*.25,cx+R,tb-R*.25);ctx.lineTo(cx+R,tt);ctx.fill();
  ctx.fillStyle='#7e8c91';ctx.fillRect(cx-R-2,tb-R*.3,R*2+4,3);ctx.strokeStyle='#6f7c80';ctx.lineWidth=.8;ctx.beginPath();for(let xx=cx-R;xx<=cx+R;xx+=5){ctx.moveTo(xx,tb-R*.3);ctx.lineTo(xx,tb-R*.3-7)}ctx.moveTo(cx-R,tb-R*.3-7);ctx.lineTo(cx+R,tb-R*.3-7);ctx.stroke();
  bText(b.sign||'',cx,(tt+tb-R*.3)/2,10,'#2f5a7a',R*1.8);
  ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.ellipse(cx,tt,R,R*.22,0,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(cx-R,tt);ctx.lineTo(cx,tt-R*.55);ctx.lineTo(cx+R,tt);ctx.fill();ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.moveTo(cx-R*.8,tt-2);ctx.lineTo(cx,tt-R*.55);ctx.lineTo(cx-R*.3,tt-1);ctx.fill();
  limb(cx,tt-R*.55,cx,tt-R*.55-10,'#4d4d4a',1.4);dot(cx,tt-R*.55-11,1.8,'#c23b2e')}
function owLighthouse(b,r){const R0b=b.w/2,cx=b.x+R0b,base=b.y+b.d/2+R0b*.4,H=bPx(b),topY=base-H,R1=R0b*.62;
  // stone base, tapered white tower with red bands, gallery, glass lantern, red cap
  ctx.fillStyle='#8f8b82';ctx.beginPath();ctx.ellipse(cx,base+2,R0b*1.35,R0b*.5,0,0,TAU);ctx.fill();ctx.fillStyle='#a8a398';ctx.fillRect(cx-R0b*1.2,base-14,R0b*2.4,14);ctx.beginPath();ctx.ellipse(cx,base-14,R0b*1.2,R0b*.42,0,0,TAU);ctx.fill();
  const band=(y0,y1,col)=>{const w0=lerp(R0b,R1,(base-y0)/H),w1=lerp(R0b,R1,(base-y1)/H);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(cx-w0,y0);ctx.lineTo(cx-w1,y1);ctx.lineTo(cx+w1,y1);ctx.lineTo(cx+w0,y0);ctx.fill()};
  band(base-14,topY,'#f4f1ea');for(const f of[.18,.48,.78])band(base-14-(H-14)*f,base-14-(H-14)*(f+.13),'#c23b2e');
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.moveTo(cx+R0b*.35,base-14);ctx.lineTo(cx+R1*.35,topY);ctx.lineTo(cx+R1,topY);ctx.lineTo(cx+R0b,base-14);ctx.fill();
  for(const f of[.32,.62]){const yy=base-14-(H-14)*f;ctx.fillStyle='#2f3b46';ctx.fillRect(cx-3,yy-9,6,9)}ctx.fillStyle='#2b2b2b';ctx.fillRect(cx-5,base-26,10,12);
  ctx.fillStyle='#2b2b2b';ctx.fillRect(cx-R1-8,topY-4,R1*2+16,5);ctx.strokeStyle='#2b2b2b';ctx.lineWidth=1;ctx.beginPath();for(let xx=cx-R1-8;xx<=cx+R1+8;xx+=4){ctx.moveTo(xx,topY-4);ctx.lineTo(xx,topY-12)}ctx.moveTo(cx-R1-8,topY-12);ctx.lineTo(cx+R1+8,topY-12);ctx.stroke();
  ctx.fillStyle='#2b2b2b';ctx.fillRect(cx-R1*.8,topY-34,R1*1.6,30);ctx.fillStyle='#fff3b8';ctx.fillRect(cx-R1*.7,topY-32,R1*1.4,24);const pulse=.5+.5*Math.sin(S.t*2);ctx.fillStyle=`rgba(255,240,170,${.35+pulse*.4})`;ctx.beginPath();ctx.arc(cx,topY-20,7,0,TAU);ctx.fill();
  ctx.fillStyle='#2b2b2b';for(let k=-1;k<=1;k++)ctx.fillRect(cx+k*R1*.45-.6,topY-32,1.2,24);
  ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(cx-R1*.95,topY-34);ctx.quadraticCurveTo(cx-R1*.4,topY-52,cx,topY-54);ctx.quadraticCurveTo(cx+R1*.4,topY-52,cx+R1*.95,topY-34);ctx.fill();limb(cx,topY-54,cx,topY-62,'#2b2b2b',1.4);dot(cx,topY-63,1.8,'#2b2b2b')}
function owLifeguard(b,r){const LC=b.kind==='tower'?'#8a6b45':'#f2efe6',AC=b.kind==='tower'?'#5d6670':'#c23b2e';const x=b.x,fy=b.y+b.d,w=b.w,H=bPx(b);for(const lx of[x+2,x+w-2])limb(lx,fy,lx+(lx<x+w/2?3:-3),fy-H*.55,LC,2.4);
  ctx.strokeStyle=(b.kind==='tower'?'#6f563a':'#d9d4c6');ctx.lineWidth=1.2;ctx.beginPath();for(let yy=fy-6;yy>fy-H*.55;yy-=6){ctx.moveTo(x+w/2-5,yy+12);ctx.lineTo(x+w/2+5,yy+12)}ctx.stroke();limb(x+w/2-5,fy+10,x+w/2-5,fy-H*.55,(b.kind==='tower'?'#6f563a':'#d9d4c6'),1.2);limb(x+w/2+5,fy+10,x+w/2+5,fy-H*.55,(b.kind==='tower'?'#6f563a':'#d9d4c6'),1.2);
  ctx.fillStyle=LC;ctx.fillRect(x-3,fy-H*.55-4,w+6,5);ctx.fillRect(x,fy-H*.95,w,H*.4);ctx.fillStyle=AC;ctx.fillRect(x-1,fy-H*.92,w+2,5);
  ctx.fillStyle=b.roofCol;ctx.beginPath();ctx.moveTo(x-6,fy-H*.95);ctx.lineTo(x+w/2,fy-H*1.12);ctx.lineTo(x+w+6,fy-H*.95);ctx.fill();if(b.kind!=='tower'){ctx.fillStyle=AC;ctx.fillRect(x+w/2-4,fy-H*.85,8,8);ctx.fillStyle='#fff';ctx.fillRect(x+w/2-1,fy-H*.84,2,6);ctx.fillRect(x+w/2-3,fy-H*.82,6,2)}}
// cached sprites
const BSPR=[];let bsprBudget=0;
function buildingSprite(b){if(b.spr)return b.spr;if(bsprBudget<=0)return null;bsprBudget--;const e=bExtent(b),K=Math.min(1.5,devicePixelRatio||1),c=document.createElement('canvas');
  c.width=Math.ceil((e.x1-e.x0)*K);c.height=Math.ceil((e.y1-e.y0)*K);const g=c.getContext('2d'),prev=ctx;ctx=g;g.scale(K,K);g.translate(-e.x0,-e.y0);try{drawBuildingOW(b)}finally{ctx=prev}
  b.spr={c,x0:e.x0,y0:e.y0,K};BSPR.push(b);if(BSPR.length>110){const o=BSPR.shift();o.spr=null}return b.spr}
function drawBuildingFast(b,alpha=1){if(b.kind==='lighthouse'){ctx.globalAlpha=alpha;drawBuildingOW(b);ctx.globalAlpha=1;return}const s=buildingSprite(b);ctx.globalAlpha=alpha;
  if(s)ctx.drawImage(s.c,s.x0,s.y0,s.c.width/s.K,s.c.height/s.K);else drawBuildingOW(b);ctx.globalAlpha=1}

/* ---------- binoculars: each building becomes a true-size mesh ---------- */
function buildingMesh(b){if(b.mesh)return b.mesh;const B0=b;b={...b,kind:BSTYLE[b.kind]||b.kind};const K=meshKit(),{add,dec,box,cyl}=K,W=b.w/M,D=b.d/M,H=b.h,x0=-W/2,x1=W/2,y0=-D/2,y1=D/2,wall=b.col,roof=b.roofCol||'#8e8b85';
  if(b.kind==='silo'){cyl(0,0,H/2,W/2,H,'z',wall,[0,0,H/2],14,'s');const ring=[];for(let i=0;i<14;i++){const a=i/14*TAU;ring.push([Math.cos(a)*W/2,Math.sin(a)*W/2,H])}for(let i=0;i<14;i++)add([ring[i],ring[(i+1)%14],[0,0,H+W*.4]],roof,[0,0,H]);B0.mesh=K.finish();return B0.mesh}
  if(b.kind==='lighthouse'){const N=14,lev=[[0,W/2,'#a8a398'],[1.4,W/2*.98,wall],[H*.25,W/2*.88,'#c23b2e'],[H*.33,W/2*.84,wall],[H*.55,W/2*.74,'#c23b2e'],[H*.63,W/2*.7,wall],[H,W/2*.6,wall]];
    const rg=(z,R)=>{const p=[];for(let i=0;i<N;i++){const a=i/N*TAU;p.push([Math.cos(a)*R,Math.sin(a)*R,z])}return p};
    for(let l=0;l<lev.length-1;l++){const A=rg(lev[l][0],lev[l][1]),B=rg(lev[l+1][0],lev[l+1][1]);for(let i=0;i<N;i++)add([A[i],A[(i+1)%N],B[(i+1)%N],B[i]],lev[l][2],[0,0,lev[l][0]+.1])}
    cyl(0,0,H+1.2,W/2*.42,2.4,'z','#fff3b8',[0,0,H+1.2],12,'l');cyl(0,0,H+.15,W/2*.75,.3,'z','#2b2b2b',[0,0,H+.15],14,'g');const top=rg(H+2.4,W/2*.45);for(let i=0;i<N;i++)add([top[i],top[(i+1)%N],[0,0,H+3.6]],roof,[0,0,H+2.5]);B0.mesh=K.finish();return B0.mesh}
  if(b.kind==='watertower'){for(const sx of[-1,1])for(const sy of[-1,1])box(sx*W*.38-.12,sx*W*.38+.12,sy*D*.38-.12,sy*D*.38+.12,0,H*.66,'#8d999d');
    cyl(0,0,H*.79,W*.78,H*.26,'z',wall,[0,0,H*.79],14,'t');const ring=[];for(let i=0;i<14;i++){const a=i/14*TAU;ring.push([Math.cos(a)*W*.78,Math.sin(a)*W*.78,H*.92])}for(let i=0;i<14;i++)add([ring[i],ring[(i+1)%14],[0,0,H*1.05]],roof,[0,0,H*.92]);B0.mesh=K.finish();return B0.mesh}
  if(b.kind==='lifeguard'){for(const sx of[-1,1])for(const sy of[-1,1])box(sx*W*.4-.06,sx*W*.4+.06,sy*D*.4-.06,sy*D*.4+.06,0,H*.55,wall);box(x0,x1,y0,y1,H*.55,H*.95,wall);box(x0-.2,x1+.2,y0-.2,y1+.2,H*.95,H*1.05,roof);B0.mesh=K.finish();return B0.mesh}
  box(x0,x1,y0,y1,0,H,wall);
  const ridgeY=b.roof==='gableS'||b.roof==='gambrel',R=b.roof==='gableS'?W*.3:b.roof==='gambrel'?W*.42:b.roof==='gableE'?Math.min(D*.28,3.3):0;
  if(b.roof==='hip'){const R2=Math.min(D*.26,3),ins=Math.min(W*.32,D*.45),A=[x0,y0,H],B2=[x1,y0,H],C2=[x1,y1,H],D2=[x0,y1,H],r1=[x0+ins,0,H+R2],r2=[x1-ins,0,H+R2];
    add([A,B2,r2,r1],roof,[0,0,H+1]);add([D2,C2,r2,r1],roof,[0,0,H+1]);add([A,r1,D2],roof,[0,0,H+1]);add([B2,r2,C2],roof,[0,0,H+1])}
  else if(R){if(ridgeY){// ridge runs north–south (along y)
      const prof=b.roof==='gambrel'?[[x0,H],[x0+W*.16,H+R*.6],[0,H+R],[x1-W*.16,H+R*.6],[x1,H]]:[[x0,H],[0,H+R],[x1,H]];
      for(let i=0;i<prof.length-1;i++){const a=prof[i],c=prof[i+1];add([[a[0],y0,a[1]],[c[0],y0,c[1]],[c[0],y1,c[1]],[a[0],y1,a[1]]],roof,[0,0,H+R*.3])}
      for(const yy of[y0,y1])add(prof.map(p=>[p[0],yy,p[1]]),wall,[0,0,H+R*.3])}
    else{const prof=[[y0,H],[0,H+R],[y1,H]];for(let i=0;i<2;i++){const a=prof[i],c=prof[i+1];add([[x0,a[0],a[1]],[x0,c[0],c[1]],[x1,c[0],c[1]],[x1,a[0],a[1]]],roof,[0,0,H+R*.3])}for(const xx of[x0,x1])add(prof.map(p=>[xx,p[0],p[1]]),wall,[0,0,H+R*.3])}}
  else box(x0,x1,y0,y1,H,H+.4,shadeHex(b.trim||'#cfcac0',-.05));
  if(b.kind==='courthouse'){box(-2.4,2.4,-2.4,2.4,H,H+3.8,b.col);cyl(0,0,H+4.9,2.4,2.2,'z','#6f9284',[0,0,H+4.9],12,'d');box(-1.8,1.8,y1-.1,y1+1.6,0,STORY*2.15,b.trim)}
  if(b.kind==='parish'&&b.ptype!=='chapel'&&b.ptype!=='kirk'){const tw=W*.3;box(x0,x0+tw,y1-tw,y1,0,H*2.2,wall);if(b.ptype==='spire')cyl(x0+tw/2,y1-tw/2,H*2.2+H*1.2,tw*.45,H*2.4,'z','#6a6f74',[x0+tw/2,y1-tw/2,H*2.4],8,'s')}
  if(b.kind==='castle'){box(x0+W*.55,x0+W*.85,-D*.2,D*.2,0,H*1.9,wall);for(const sx of[x0,x1-3])box(sx,sx+3,y1-3,y1,0,H*1.2,wall)}
  if(b.kind==='clocktower')box(x0+.3,x1-.3,y0+.3,y1-.3,H,H*1.35,'#4a5a62');
  if(b.kind==='domecath'){cyl(0,0,H+3,W*.22,6,'z','#7a8a8e',[0,0,H+3],12,'d');for(const sx of[-1,1])box(sx>0?x1-4:x0,sx>0?x1:x0+4,y1-4,y1,0,H*1.9,wall)}
  if(b.kind==='catedral'){for(const sx of[-1,1])box(sx>0?x1-W*.22:x0,sx>0?x1:x0+W*.22,y1-D*.2,y1,0,H*1.75,wall);cyl(0,0,H+1.6,2.8,3.2,'z',b.roofCol,[0,0,H+1.6],12,'d')}
  if(b.kind==='mission'&&!b.chapel)box(x1-5.2,x1-.6,y1-4.6,y1,0,H+STORY*1.6,wall);
  if(b.kind==='alcaldia')box(-1.6,1.6,-1.6,1.6,H,H+3,wall);
  if(b.kind==='elevator'){box(x0+W*.18,x1-W*.18,y0+D*.2,y1-D*.4,H,H+7,wall)}
  if(b.kind==='church'){box(-1.9,1.9,y1-.1,y1+3.6,0,STORY*3.2,'#f6f3ec');box(-1.5,1.5,y1+.2,y1+3.3,STORY*3.2,STORY*3.2+2.4,'#f6f3ec');const zt=STORY*3.2+2.4,c=[0,y1+1.75];const sq=[[-1.5,y1+.2],[1.5,y1+.2],[1.5,y1+3.3],[-1.5,y1+3.3]];for(let i=0;i<4;i++){const a=sq[i],d2=sq[(i+1)%4];add([[a[0],a[1],zt],[d2[0],d2[1],zt],[c[0],c[1],zt+STORY*3.2*.62]],roof,[0,c[1],zt+1])}}
  // windows on every wall: decals laid just outside each face
  const flo=b.floors||Math.max(1,Math.round(H/STORY)),gl=b.kind==='office'?'#3e5a6c':'#3f5a6a',fr=b.trim||'#f4f1e8';
  const faces=[[[0,1,0],(u,z)=>[u,y1+.01,z],W],[[0,-1,0],(u,z)=>[-u,y0-.01,z],W],[[1,0,0],(u,z)=>[x1+.01,-u,z],D],[[-1,0,0],(u,z)=>[x0-.01,u,z],D]];
  if(b.kind!=='barn'&&b.kind!=='shed'&&b.kind!=='bait')for(const [n,P,len] of faces){
    if(b.kind==='office'){for(let f=1;f<flo;f++){const z0=f*STORY+.35,z1=(f+1)*STORY-.55;dec([P(-len/2+.3,z0),P(len/2-.3,z0),P(len/2-.3,z1),P(-len/2+.3,z1)],gl,n)}continue}
    const cols=Math.max(1,Math.floor(len/(b.kind==='rowhouse'?3.2:3.4)));for(let f=(b.kind==='shop'?1:0);f<flo;f++)for(let i=0;i<cols;i++){const u=-len/2+len*(i+.5)/cols,z0=f*STORY+.9,z1=f*STORY+2.3;
      dec([P(u-.62,z0-.1),P(u+.62,z0-.1),P(u+.62,z1+.1),P(u-.62,z1+.1)],fr,n);dec([P(u-.5,z0),P(u+.5,z0),P(u+.5,z1),P(u-.5,z1)],gl,n)}}
  {const P=faces[0][1],n=[0,1,0];
    if(b.kind==='shop'||b.kind==='kiosk'){dec([P(-W/2+.4,.2),P(W*.15,.2),P(W*.15,2.6),P(-W/2+.4,2.6)],'#34495a',n);dec([P(-W/2+.2,2.7),P(W/2-.2,2.7),P(W/2-.2,3.2),P(-W/2+.2,3.2)],(b.awn||['#c23b2e'])[0],n)}
    else if(b.kind==='barn'){dec([P(-W*.21,0),P(W*.21,0),P(W*.21,H*.72),P(-W*.21,H*.72)],'#8e2d25',n);dec([P(-W*.21,H*.72-.25),P(W*.21,H*.72-.25),P(W*.21,H*.72),P(-W*.21,H*.72)],b.trim,n)}
    else dec([P(-.55,0),P(.55,0),P(.55,2.2),P(-.55,2.2)],b.door||'#2c2b29',n)}
  B0.mesh=K.finish();return B0.mesh}
function drawBuildingBino(b){const o={x:b.x+b.w/2,y:b.y+b.d/2,ang:0,color:b.col};drawMeshBino(o,buildingMesh(b));
  // its silhouette hides birds behind it
  const pts=[];for(const [px,py] of[[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.d],[b.x+b.w,b.y+b.d]])for(const z of[0,b.h*.95]){const q=bproj(px,py,z);if(q)pts.push(q)}
  if(pts.length>2)BV.drawn.push({r:[Math.min(...pts.map(q=>q.x)),Math.min(...pts.map(q=>q.y)),Math.max(...pts.map(q=>q.x)),Math.max(...pts.map(q=>q.y))]})}

/* ---------- state ---------- */
var WIPED=false;   // set while all progress is being deleted, so nothing is saved again before the reload
const JOURNAL_KEY='birding-journal-v1';const GEAR_IDS=['bino','scope','cam'];
function loadJournal(){let j=null;try{j=JSON.parse(localStorage.getItem(JOURNAL_KEY)||'null')}catch(e){}if(!j||!j.seen)j={seen:{}};
  // every sighting, oldest first; older saves only had first sightings, so rebuild those
  if(!Array.isArray(j.log)){j.log=[];for(const sp in j.seen){const f=j.seen[sp].first||{};j.log.push({sp,ts:f.ts||Date.now(),zone:f.zone||'East Coast',temp:f.temp??null,how:'bino',region:'East Coast'})}j.log.sort((a,b)=>a.ts-b.ts)}
  return j}
const KIT_KEY='birding-kit-v1';function loadKit(){try{return JSON.parse(localStorage.getItem(KIT_KEY)||'null')||{}}catch(e){return{}}}
function saveKit(){if(WIPED)return;try{localStorage.setItem(KIT_KEY,JSON.stringify({gear:S.gear,outfit:S.outfit,mm:S.bino.mm,paint:S.paint}))}catch(e){}}
function saveJournal(){if(WIPED)return;try{localStorage.setItem(JOURNAL_KEY,JSON.stringify(S.journal))}catch(e){}}
const S={mode:'walk',player:{x:START.x-60,y:START.y+40,face:-PI/2,walk:0,moving:false,vx:0,vy:0,sneak:false,look:0},
  car:{x:START.x+40,y:START.y,ang:PI,v:0,roll:0,lights:false},cam:{x:START.x,y:START.y},birds:[],journal:loadJournal(),
  bino:{on:false,yaw:0,pitch:.12,zoom:1,prog:0,target:null,shake:0,mm:300},gear:'bino',outfit:'field',pishCD:0,showBirds:false,showPlates:false,region:'east'};
const REGION_NEED=3;
// FP1: in Free Play every trailhead is open from the start; the minimum is kept for Story mode
const trailNeed=()=>settings.play==='story'?REGION_NEED:0;
{const k=loadKit();if(GEAR_IDS.includes(k.gear))S.gear=k.gear;if(k.outfit)S.outfit=k.outfit;if(k.mm)S.bino.mm=k.mm;if(k.paint)S.paint=k.paint}
const speciesSeen=()=>SP_ORDER.filter(k=>S.journal.seen[k]).length;

/* ---------- canvas ---------- */
const cv=$('game');const mainCtx=cv.getContext('2d');let ctx=mainCtx;
let VW=0,VH=0,DPR=1,VZ=1;
function resize(){DPR=Math.min(devicePixelRatio||1,2);VW=innerWidth;VH=innerHeight;cv.width=VW*DPR;cv.height=VH*DPR}
addEventListener('resize',resize);resize();

/* ---------- input ---------- */
const keys=new Set(),joy={active:false,id:null,x:0,y:0};
const GPS={linked:false,mode:'fullscreen',paused:false,dirs:new Set(),b:null,lab:''};
const overlays=['journal','foundBack','noteBack','mapBack','title','photoBack'];
const paused=()=>GPS.paused||overlays.some(id=>!$(id).hidden&&!$(id).classList.contains('out'));
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='escape'){if(!$('foundBack').hidden)closeFound();else if(!$('noteBack').hidden)closeNote();else if(!$('journal').hidden)phoneBack();else if(!$('mapBack').hidden)mapBackStep();else if(S.bino.on)toggleBino(false);else if(GPS.linked)GP.openArcade();return}
  if(paused())return;
  if(e.target.closest&&e.target.closest('button')&&(k===' '||k==='enter'))return;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
  if(keys.has(k))return;keys.add(k);
  if(k===' '&&S.bino.on&&S.gear==='cam'){shutter();return}
  if(k==='b'||k===' ')toggleBino();
  if(k==='g'&&!S.bino.on){cycleGear();return}
  if(S.bino.on){if(k==='+'||k==='='||k==='q')zoomBy(1);if(k==='-'||k==='_'||k==='z')zoomBy(-1);if(k==='f'&&S.gear==='cam')shutter();return}
  if(k==='e'||k==='enter')doUse();if(k==='p')doPish();if(k==='j'||k==='tab'){e.preventDefault();toggleJournal(true)}if(k==='m')toggleMap(true);
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>keys.clear());
const joyEl=$('joy'),knob=$('knob');
function joyStart(e,el,float){joy.active=true;joy.id=e.pointerId;
  if(float){const w=joyEl.offsetWidth;joyEl.classList.add('floating');joyEl.style.left=(e.clientX-w/2)+'px';joyEl.style.top=(e.clientY-w/2)+'px'}
  const r=joyEl.getBoundingClientRect();joy.cx=r.left+r.width/2;joy.cy=r.top+r.height/2;joy.max=r.width/2-16;
  try{el.setPointerCapture(e.pointerId)}catch(_){}joyMove(e)}
function joyMove(e){let dx=e.clientX-joy.cx,dy=e.clientY-joy.cy;const l=Math.hypot(dx,dy);if(l>joy.max){dx*=joy.max/l;dy*=joy.max/l}
  joy.x=dx/joy.max;joy.y=dy/joy.max;knob.style.transform=`translate(${dx}px,${dy}px)`}
function joyEnd(e){if(e.pointerId!==joy.id)return;joy.active=false;joy.x=joy.y=0;knob.style.transform='';joyEl.classList.remove('floating');joyEl.style.left=joyEl.style.top=''}
for(const el of[joyEl,cv]){el.addEventListener('pointermove',e=>{if(joy.active&&e.pointerId===joy.id)joyMove(e)});el.addEventListener('pointerup',joyEnd);el.addEventListener('pointercancel',joyEnd)}
joyEl.addEventListener('pointerdown',e=>{if(!joy.active)joyStart(e,joyEl,false)});
// drag-to-look in the binoculars; elsewhere a floating stick on the steering side
const drag={id:null,x:0,y:0};
cv.addEventListener('pointerdown',e=>{
  if(GPS.mode==='console'&&!S.bino.on)return;
  if(S.bino.on){if(drag.id===null&&!joy.active){const steerSide=settings.joyLeft?e.clientX<VW*.45:e.clientX>VW*.55;if(steerSide&&e.pointerType!=='mouse'){joyStart(e,cv,true);return}
    drag.id=e.pointerId;drag.x=e.clientX;drag.y=e.clientY;try{cv.setPointerCapture(e.pointerId)}catch(_){}}return}
  if(!settings.holdSteer||joy.active)return;const steerSide=settings.joyLeft?e.clientX<VW*.62:e.clientX>VW*.38;if(steerSide)joyStart(e,cv,true)});
cv.addEventListener('pointermove',e=>{if(e.pointerId!==drag.id)return;const B=S.bino,ppr=binoPPR();B.yaw-=(e.clientX-drag.x)/ppr;B.pitch=clamp(B.pitch+(e.clientY-drag.y)/ppr,-.35,1.2);drag.x=e.clientX;drag.y=e.clientY});
const dragEnd=e=>{if(e.pointerId===drag.id)drag.id=null};cv.addEventListener('pointerup',dragEnd);cv.addEventListener('pointercancel',dragEnd);
cv.addEventListener('wheel',e=>{if(S.bino.on){e.preventDefault();zoomBy(e.deltaY<0?1:-1,true)}},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
function getInput(){
  if(joy.active){const m=Math.min(1,Math.hypot(joy.x,joy.y));return{x:joy.x/(m||1),y:joy.y/(m||1),m:m<.15?0:m}}
  let x=0,y=0;
  if(keys.has('a')||keys.has('arrowleft')||GPS.dirs.has('left'))x--;if(keys.has('d')||keys.has('arrowright')||GPS.dirs.has('right'))x++;
  if(keys.has('w')||keys.has('arrowup')||GPS.dirs.has('up'))y--;if(keys.has('s')||keys.has('arrowdown')||GPS.dirs.has('down'))y++;
  const l=Math.hypot(x,y);return l?{x:x/l,y:y/l,m:1}:{x:0,y:0,m:0}}
let toastT=0;function toast(msg,sec=2.8){const el=$('toast');el.textContent=msg;el.style.opacity=1;toastT=sec}

/* ---------- collisions ---------- */
function blockedAt(x,y,rad){if(x<620||x>WW-50||y<80||y>WH-80)return true;
  for(const c of cellsNear(x,y,80)){for(const t of c.trees){const dx=t.x-x,dy=t.y-y,rr=t.r+rad;if(dx*dx+dy*dy<rr*rr)return t}
    for(const d of c.decor){const R=DEC2_BLOCK[d.k];if(!R)continue;const dx=d.x-x,dy=d.y-y,rr=R+rad;if(dx*dx+dy*dy<rr*rr)return d}}
  const b=buildingAt(x,y,rad);if(b)return b;const v=trafficAt(x,y,rad);if(v)return v;return false}
// deep=true: can you walk here? deep=false: can the Defender drive here? Bridges, piers and docks count.
function waterAt(x,y,deep){if(onPier(x,y))return!deep;const t=terr(x,y),rd=roadAt(x,y);
  if(deep)return(t===T.DEEP||t===T.LAKE)&&!rd;
  if(rd)return rd.kind==='boardwalk';
  return t<=T.SHAL||t===T.LAKE||t===T.MARSH||t===T.SALT||t===T.SWAMP||t===T.BOG||t===T.MANGROVE||t===T.MUD||t===T.ICE}
const WALKK={[T.BOG]:.6,[T.MANGROVE]:.5,[T.MUD]:.7,[T.ARCTIC]:.9,[T.ICE]:.8,[T.SHAL]:.5,[T.SNOW]:.85,[T.SAND]:.85,[T.MARSH]:.55,[T.SALT]:.6,[T.SWAMP]:.6,[T.SCRUB]:.75,[T.SANDHILL]:.85,[T.FIELD]:.85,[T.GRASS]:.9,[T.HEDGE]:.7};

/* ---------- player ----------
   Walking (M1–M6): the birder eases into and out of a walk, turns smoothly toward the stick,
   and the walk cycle is driven by distance so the feet stay planted. A light push on the stick
   gives a slower walk.
   Trunks, posts and buildings push you around their edge instead of stopping you dead. */
const WALK_SPD=150,SNEAK_SPD=62,STRIDE=11,SNEAK_STRIDE=7;
// how deep is the water here? 'wade' in the shallows and small creeks, 'swim' in lakes, pools, deep creeks and the sea
function waterKind(x,y){if(onPier(x,y)||roadAt(x,y))return null;const t=terr(x,y);
  if(t===T.DEEP)return'swim';
  if(t===T.SHAL){const k=wkey(x,y),d=wdist(x,y);if(k==='ocean'||k==='pelagic')return d<110?'wade':'swim';return d<260?'wade':'swim'}
  if(t===T.LAKE){const k=wkey(x,y),d=wdist(x,y);if(k==='river')return d<36?'wade':'swim';if(k==='saltmarsh')return'wade';if(k==='lake'||k==='pond')return d<40?'wade':'swim';return d<14?'wade':'swim'}
  return null}
const WATER_K={wade:.5,swim:.38};
function stepSurface(x,y){const t=terr(x,y);if(onPier(x,y)||roadAt(x,y)||t===T.CITY||t===T.YARD)return'road';if(t===T.SHAL||t===T.LAKE)return'water';
  if(isBeach(t)||t===T.SANDHILL||t===T.MARSH||t===T.SWAMP||t===T.SALT)return'sand';if(t===T.SNOW)return'snow';return'grass'}
// keep a circle of radius rad out of trees, posts, buildings and vehicles by sliding it to their edge
function pushOut(o,rad){
  for(const c of cellsNear(o.x,o.y,80)){for(const t of c.trees){const dx=o.x-t.x,dy=o.y-t.y,m=t.r+rad;if(Math.abs(dx)>m||Math.abs(dy)>m)continue;const d=Math.hypot(dx,dy);if(d<m){const k=d>.01?1/d:0;o.x=t.x+(k?dx*k:1)*m;o.y=t.y+(k?dy*k:0)*m}}
    for(const q of c.decor){const R=DEC2_BLOCK[q.k];if(!R)continue;const dx=o.x-q.x,dy=o.y-q.y,m=R+rad,d=Math.hypot(dx,dy);if(d<m&&d>.01){o.x=q.x+dx/d*m;o.y=q.y+dy/d*m}}}
  for(const b of buildingsNear(o.x,o.y,60)){
    if(b.kind==='silo'||b.kind==='lighthouse'){const R=b.w/2,cx=b.x+R,cy=b.y+b.d/2,dx=o.x-cx,dy=o.y-cy,d=Math.hypot(dx,dy),m=R+rad;if(d<m&&d>.01){o.x=cx+dx/d*m;o.y=cy+dy/d*m}continue}
    const nx=clamp(o.x,b.x,b.x+b.w),ny=clamp(o.y,b.y,b.y+b.d),dx=o.x-nx,dy=o.y-ny,d=Math.hypot(dx,dy);if(d>=rad)continue;
    if(d>.01){o.x=nx+dx/d*rad;o.y=ny+dy/d*rad}
    else{const e=[[o.x-b.x,-1,0],[b.x+b.w-o.x,1,0],[o.y-b.y,0,-1],[b.y+b.d-o.y,0,1]].sort((p,q)=>p[0]-q[0])[0];o.x+=e[1]*(e[0]+rad);o.y+=e[2]*(e[0]+rad)}}
  for(const v of[...TRAFFIC,TRACTOR,...parkedNear(o.x,o.y,150)]){if(Math.abs(v.x-o.x)>160||Math.abs(v.y-o.y)>160)continue;
    const ca=Math.cos(v.ang),sa=Math.sin(v.ang),dx=o.x-v.x,dy=o.y-v.y,lx=dx*ca+dy*sa,ly=-dx*sa+dy*ca,hx=vLen(v)/2*M*VX+rad,hy=vWid(v)/2*M*VX+rad;
    if(Math.abs(lx)<hx&&Math.abs(ly)<hy){let nx=lx,ny=ly;if(hx-Math.abs(lx)<hy-Math.abs(ly))nx=Math.sign(lx||1)*hx;else ny=Math.sign(ly||1)*hy;o.x=v.x+nx*ca-ny*sa;o.y=v.y+nx*sa+ny*ca}}
  o.x=clamp(o.x,620+rad,WW-50-rad);o.y=clamp(o.y,80+rad,WH-80-rad)}
// footprints in sand, mud and snow, and rings in shallow water
S.prints=[];S.tracks=[];
function addPrint(x,y,a,kind){S.prints.push({x,y,a,kind,t:S.t||0});if(S.prints.length>70)S.prints.shift()}
const TRACK_SOFT={[T.WET]:'sand',[T.SAND]:'sand',[T.DUNE]:'sand',[T.SANDHILL]:'sand',[T.MUD]:'mud',[T.MARSH]:'mud',[T.SALT]:'mud',[T.BOG]:'mud',[T.FIELD]:'dirt',[T.SNOW]:'snow',[T.ARCTIC]:'snow'};
function trackKind(x,y){const r=roadAt(x,y);if(r)return r.kind==='sand'?'sand':r.kind==='dirt'?'dirt':null;if(onPier(x,y))return null;const t=terr(x,y);if(frozen&&frozen(x,y))return null;return(snowCover&&snowCover(x,y)>.5)?'snow':TRACK_SOFT[t]||null}
function addTrack(c){const k=trackKind(c.x,c.y);c.lastTrack=c.lastTrack||{x:c.x,y:c.y};const d=Math.hypot(c.x-c.lastTrack.x,c.y-c.lastTrack.y);if(d<6)return;c.lastTrack={x:c.x,y:c.y};
  if(!k){c.trackRun=(c.trackRun||0)+1;return}const half=.78*M*VX,nx=-Math.sin(c.ang)*half,ny=Math.cos(c.ang)*half*KD,bx=-Math.cos(c.ang)*.9*M*VX,by=-Math.sin(c.ang)*.9*M*VX*KD,run=c.trackRun||0,t=S.t||0;
  S.tracks.push({x:c.x+bx+nx,y:c.y+by+ny,w:0,run,kind:k,t},{x:c.x+bx-nx,y:c.y+by-ny,w:1,run,kind:k,t});if(S.tracks.length>900)S.tracks.splice(0,2)}
// each wheel's marks are joined into a continuous tread band, fading with age
function drawTracks(x0,y0,x1,y1){const now=S.t||0,last=[null,null];ctx.lineCap='round';
  for(const q of S.tracks){const pv=last[q.w];last[q.w]=q;if(!pv||pv.run!==q.run)continue;if(q.x<x0-30||q.x>x1+30||q.y<y0-30||q.y>y1+30)continue;if(Math.abs(q.x-pv.x)+Math.abs(q.y-pv.y)>40)continue;
    const life=q.kind==='snow'?60:q.kind==='mud'?45:35,age=now-q.t;if(age>life)continue;const al=Math.min(1,(1-age/life)*1.5)*(q.kind==='snow'?.4:q.kind==='mud'?.34:.24);
    ctx.strokeStyle=q.kind==='snow'?`rgba(110,135,170,${al})`:q.kind==='mud'?`rgba(50,38,22,${al})`:`rgba(70,48,24,${al})`;ctx.lineWidth=5.2;ctx.beginPath();ctx.moveTo(pv.x,pv.y);ctx.lineTo(q.x,q.y);ctx.stroke();
    ctx.strokeStyle=`rgba(0,0,0,${al*.3})`;ctx.lineWidth=1.2;ctx.setLineDash([1.6,2.2]);ctx.beginPath();ctx.moveTo(pv.x,pv.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([])}}
function drawPrints(x0,y0,x1,y1){const now=S.t||0;for(const q of S.prints){if(q.x<x0-20||q.x>x1+20||q.y<y0-20||q.y>y1+20)continue;const age=now-q.t;
  if(q.kind==='water'){if(age>1.4)continue;const k=age/1.4;ctx.strokeStyle=`rgba(240,250,250,${.6*(1-k)})`;ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(q.x,q.y,5+k*16,2+k*6,0,0,TAU);ctx.stroke();continue}
  const life=q.kind==='snow'?40:25;if(age>life)continue;const al=Math.min(1,(1-age/life)*1.6)*(q.kind==='snow'?.5:.34);
  ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.a);ctx.fillStyle=q.kind==='snow'?`rgba(110,135,170,${al})`:`rgba(60,40,20,${al})`;
  ctx.beginPath();ctx.ellipse(1.6,0,3.4,2.1,0,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(-3.2,0,2,1.8,0,0,TAU);ctx.fill();ctx.restore()}}
let sneakTold=false;
function updatePlayer(dt){const p=S.player,inp=getInput();if(DEV.obs&&S.mode==='walk'){devUpdate(p,inp,dt);return}
  p.tripod=S.gear==='scope'&&S.bino.on;p.vx=p.vx||0;p.vy=p.vy||0;
  const want=inp.m>0&&!S.bino.on;
  const surf=stepSurface(p.x,p.y),tt=terr(p.x,p.y),wk=waterKind(p.x,p.y);p.water=wk;
  if(S.mode!=='walk')S.touchSneak=false;
  p.sneak=S.mode==='walk'&&wk!=='swim'&&!S.bino.on&&(keys.has('shift')||!!S.touchSneak||!!(GPS.b&&!GPS.b.used&&performance.now()-GPS.b.t>200));
  if(p.sneak&&want){if(GPS.b)GPS.b.sneaked=true;if(!sneakTold){sneakTold=true;toast('Walking slowly. Birds let you get much closer.',2.2)}}
  if(wk==='swim'&&S.bino.on)toggleBino(false);
  const ground=onPier(p.x,p.y)||roadAt(p.x,p.y)?1:wk?WATER_K[wk]:WALKK[tt]??1;
  const top=p.sneak?SNEAK_SPD:WALK_SPD*(joy.active?lerp(.45,1,clamp((inp.m-.15)/.75,0,1)):1);
  const tvx=want?inp.x*top*ground:0,tvy=want?inp.y*top*ground:0;
  // ease in and out: about a tenth of a second to get going or to stop
  const ka=1-Math.exp(-dt*(want?13:17));p.vx+=(tvx-p.vx)*ka;p.vy+=(tvy-p.vy)*ka;
  if(!want&&Math.hypot(p.vx,p.vy)<4)p.vx=p.vy=0;
  // turn smoothly toward the stick
  if(want)p.face+=angDiff(p.face,Math.atan2(inp.y,inp.x))*Math.min(1,dt*(p.sneak?9:14));
  const ox=p.x,oy=p.y;let nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;
  // you can wade and swim anywhere, but not swim out of sight of land
  const tooFar=(x,y)=>waterKind(x,y)==='swim'&&wdist(x,y)>1300;
  if(tooFar(nx,ny)){if(!tooFar(nx,p.y))ny=p.y;else if(!tooFar(p.x,ny))nx=p.x;else{nx=p.x;ny=p.y}if(!S.farTold){S.farTold=true;toast('That\'s far enough out. Swim back to shore.',2)}}
  p.x=nx;p.y=ny;pushOut(p,8);
  const moved=Math.hypot(p.x-ox,p.y-oy),spd=moved/Math.max(dt,1e-4);
  p.moving=spd>6;p.mv=clamp(spd/WALK_SPD,0,1);
  // the walk cycle follows the distance covered, so feet don't skate
  const stride=p.sneak?SNEAK_STRIDE:STRIDE;p.stride=stride;const prev=p.walk||0;p.walk=prev+moved/stride;
  if(Math.floor(p.walk/PI)!==Math.floor(prev/PI)&&spd>10){const side=Math.floor(p.walk/PI)%2?1:-1;
    SFX.step(surf,p.sneak?.35:wk==='swim'?.6:1);
    const fx=Math.cos(p.face),fy=Math.sin(p.face),k=1.15;
    if(surf==='sand'||surf==='snow')addPrint(p.x+fx*stride*.8*k-fy*2.6*k*side,p.y+fy*stride*.8*k+fx*1.4*k*side,p.face,surf);
    else if(surf==='water'&&wk!=='swim')addPrint(p.x+fx*6,p.y+fy*4,0,'water')}
  // standing still for a while: look around
  p.idleT=p.moving||S.bino.on?0:(p.idleT||0)+dt;const lk=p.idleT>2.5?Math.sin((p.idleT-2.5)*.9)*.75:0;p.look=lerp(p.look||0,lk,Math.min(1,dt*4))}

/* ---------- Defender ---------- */
function carWet(x,y){if(onPier(x,y))return'pier';const rd=roadAt(x,y);if(rd)return rd.kind==='boardwalk'?'pier':null;const t=terr(x,y);
  if(t===T.MARSH||t===T.SALT||t===T.MUD||t===T.BOG)return null;
  if(t===T.SHAL||t===T.LAKE)return waterKind(x,y)==='wade'?null:'deep';
  if(t===T.DEEP)return'deep';if(t===T.SWAMP||t===T.MANGROVE)return'trees';if(t===T.ICE)return'ice';return null}
const CAR_SOFT={[T.SHAL]:130,[T.LAKE]:130,[T.MARSH]:170,[T.SALT]:200,[T.MUD]:140,[T.BOG]:120};
function updateCar(dt){const c=S.car,inp=getInput(),drive=S.mode==='drive'&&!S.bino.on;
  const r=roadAt(c.x,c.y),t=terr(c.x,c.y);
  const vmax=r?(r.city?400:r.kind==='paved'?620:r.kind==='sand'?360:440):CAR_SOFT[t]||(isBeach(t)?280:t===T.SNOW?260:t===T.ROCK?200:320);
  if(drive&&inp.m>0){const want=Math.atan2(inp.y,inp.x);let d=angDiff(c.ang,want);
    // D1 pointing back behind the car: brake, then reverse straight back
    if(!c.rev&&Math.abs(d)>2.45&&c.v<70)c.rev=true;else if(c.rev&&Math.abs(d)<1.75)c.rev=false;
    if(c.rev||(Math.abs(d)>2.45&&c.v>=70)){
      if(c.v>0){c.v=Math.max(0,c.v-700*dt)}
      else{const rv=-Math.min(220,vmax*.45)*inp.m;c.v+=(rv<c.v?-320:320)*dt;if(Math.abs(c.v-rv)<10)c.v=rv;
        const d2=angDiff(c.ang,want+PI),dz=.44,sg=Math.abs(d2)<dz?0:(d2-Math.sign(d2)*dz);c.ang+=clamp(sg*1.4,-1,1)*dt*1.1*clamp(-c.v/120,0,1)}}
    else{// gentle steering: quicker when slow, calmer at speed
      const steer=clamp(d*1.6,-1,1)*(1.1+1.2*clamp(1-Math.abs(c.v)/620,0,1));c.ang+=steer*dt*clamp(Math.abs(c.v)/110,.3,1);
      const tv=vmax*inp.m*clamp(1.25-Math.abs(d)/1.4,.25,1);c.v+=(tv>c.v?260*(1-.5*clamp(c.v/vmax,0,1)):-520)*dt;if(c.v>tv&&c.v-tv<12)c.v=tv}}
  else{c.v*=Math.pow(.25,dt);if(Math.abs(c.v)<4)c.v=0;if(!c.v)c.rev=false}
  if(c.v>vmax)c.v-=500*dt;
  const nx=c.x+Math.cos(c.ang)*c.v*dt,ny=c.y+Math.sin(c.ang)*c.v*dt;
  let what=null;const hit=pt=>{const b=blockedAt(pt[0],pt[1],16);if(b){what=b;return true}const w=carWet(pt[0],pt[1]);if(w){what='water';c.wetWhy=w;return true}return false};
  const fx=Math.cos(c.ang)*30,fy=Math.sin(c.ang)*30;
  if(!hit([nx+fx,ny+fy])&&!hit([nx-fx,ny-fy])&&!hit([nx,ny])){c.x=nx;c.y=ny}
  else{if(Math.abs(c.v)>140){toast(what==='water'?(c.wetWhy==='pier'?'The pier is for walking. Park and go on foot.':c.wetWhy==='trees'?'Too tangled for the Defender. Walk from here.':c.wetWhy==='ice'?'Not on the ice. Walk from here.':'Too deep for the Defender. Walk or take a boat from here.'):what&&what.kind&&BKIND[what.kind]?'Bump! Mind the buildings.':what&&what.type&&VTYPES[what.type]?'Bump! Careful with the other cars.':'Bump! Mind the trees.',1.6)}c.v*=-.25}
  c.roll+=c.v*dt/(.4*M*VX);if(Math.abs(c.v)>8)addTrack(c);if((t===T.SHAL||t===T.LAKE)&&Math.abs(c.v)>30){c.spl=(c.spl||0)-dt;if(c.spl<=0){c.spl=.1;addPrint(c.x-Math.cos(c.ang)*26,c.y-Math.sin(c.ang)*26,c.ang,'water')}}
  SFX.engine(S.mode==='drive',clamp(Math.abs(c.v)/620,0,1),r?(r.kind==='paved'?'paved':r.kind==='sand'?'sand':'dirt'):isBeach(t)?'sand':'off')}

/* ---------- boats (W1 tour boat, W2 kayak, W3 canoe) ----------
   Each launch has its own boat. Walk up and press Use to get in; steer like the Defender.
   Each boat only goes on its own kind of water: the tour boat on the sea, the kayak in the bay,
   marsh, mangroves and close along the shore, the canoe on lakes, ponds, creeks and the swamp. */
const BOATK={tour:{name:'Sandpiper',L:11,W:3.4,vmax:520,acc:150,turn:.9,col:'#f6f4ee',trim:'#1d2733'},
  kayak:{name:'Kayak',L:4.4,W:.8,vmax:230,acc:190,turn:2.2,col:'#e6781e',trim:'#f6c454'},
  canoe:{name:'Canoe',L:5,W:1,vmax:200,acc:170,turn:1.8,col:'#2f6b4a',trim:'#c9a46a'}};
function boatWater(craft,x,y){if(craft==='plane')return planeWater(x,y);const t=terr(x,y);if(t===T.ICE)return false;const k=wkey(x,y);
  if(JETTY&&x>JETTY.x0-20&&x<JETTY.x1+20&&y>JETTY.y0-20&&y<JETTY.y1+20)return false;
  if(craft==='tour')return(t===T.DEEP||t===T.SHAL)&&(k==='ocean'||k==='pelagic'||k==='reef'||(CEN&&k==='bay'))&&wdist(x,y)>28;
  if(craft==='kayak'){if(t===T.SHAL||t===T.LAKE||t===T.DEEP)return k==='bay'||k==='saltmarsh'||k==='mangrove'||k==='marsh'||k==='river'||k==='ocean'||k==='reef';return t===T.MARSH&&k==='marsh'}
  if(t===T.LAKE)return k!=='ocean'&&k!=='pelagic'&&k!=='bay'&&k!=='saltmarsh'&&k!=='pool';return t===T.SWAMP||(t===T.MARSH&&k==='marsh')}
const BOATS=[];
for(const L of LAUNCHES){const d=WD.docks.find(q=>q[1]===L.name&&q[0]===L.craft)||[0,0,L.x,L.y];let ang=Math.atan2(L.y-d[3],L.x-d[2]);if(!isFinite(ang)||(L.x===d[2]&&L.y===d[3]))ang=0;
  const B={craft:L.craft,name:L.name,x:L.x+Math.cos(ang)*40-Math.sin(ang)*34,y:L.y+Math.sin(ang)*40+Math.cos(ang)*34,ang,v:0,ph:0,home:L};
  // settle it on its own kind of water near the dock
  if(!boatWater(B.craft,B.x,B.y)){let best=null;for(let r=20;r<500&&!best;r+=20)for(let a=0;a<TAU;a+=.35){const x=L.x+Math.cos(a)*r,y=L.y+Math.sin(a)*r;if(boatWater(B.craft,x,y)){best=[x,y];break}}if(best){B.x=best[0];B.y=best[1]}}
  BOATS.push(B)}
// 3D models (metres, x forward, y right, z up) for the optics
const BOATMESH={};
function hullOutline(L,W,blunt,n=10){const P=[];for(let i=0;i<=n;i++){const u=i/n,x=L/2-u*L,ex=Math.abs(2*x/L),w=W/2*Math.pow(Math.max(0,1-Math.pow(ex,blunt?4:2)),blunt?.35:.6);P.push([x,-Math.max(w,blunt&&u>.9?W*.36:.002)])}
  for(let i=n;i>=0;i--){const p=P[i];P.push([p[0],-p[1]])}P.splice(n+1,1);return P}
// tour boat plan view: a fine bow, full-width sides and a flat transom straight across the stern
function tourOutline(L,W,n=12){const P=[];for(let i=0;i<=n;i++){const u=i/n,x=L/2-u*L,ex=Math.abs(2*x/L);
    const w=x>0?W/2*Math.pow(Math.max(0,1-Math.pow(ex,2.1)),.55):W/2*(1-.1*Math.pow(ex,5));P.push([x,-Math.max(w,.002)])}
  for(let i=n;i>=0;i--){const p=P[i];P.push([p[0],-p[1]])}P.pop();return P}
function boatMesh(craft){if(craft==='plane')return planeMesh(false);if(BOATMESH[craft])return BOATMESH[craft];const K=BOATK[craft],{add,dec,loft,prism,box,cyl,finish}=meshKit();
  const top=craft==='tour'?tourOutline(K.L,K.W):hullOutline(K.L,K.W,false),bot=top.map(p=>[craft==='tour'&&p[0]<0?p[0]*.995:p[0]*.92,p[1]*(craft==='tour'&&p[0]<0?.82:.7)]),zt=craft==='tour'?1.1:craft==='kayak'?.32:.38,zb=-.05;
  loft(bot,zb,top,zt,K.col,[0,0,zt/2]);
  if(craft==='tour'){const hl=K.L/2,WH='#f4f2ec',CAN='#2d5c9c',SEAT='#c9b48c';
    // deck flush with the gunwale, a dark rub strake along the top of the white hull
    prism(top.map(p=>[p[0]*.985,p[1]*.96]),zt-.03,zt+.02,'#d6d3c8');
    const rs=top.map(p=>[p[0]*1.004,p[1]*1.025]);loft(rs,zt-.17,rs,zt+.03,K.trim,[0,0,zt]);
    // bulwarks all round (white), with blue canvas panels along the sides and a white rail on top; two-sided so you see the inside too
    const wall=(a,b,z0,z1,col)=>{const q=[[a[0],a[1],z0],[b[0],b[1],z0],[b[0],b[1],z1],[a[0],a[1],z1]],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,mz=(z0+z1)/2;add(q,col,[mx*.5,my*.5,mz]);add(q.slice(),col,[mx*1.8,my*1.8,mz])};
    const bw=top.map(p=>[p[0]*.985,p[1]*.965]);
    for(let i=0;i<bw.length;i++){const a=bw[i],b=bw[(i+1)%bw.length],mx=(a[0]+b[0])/2,side=mx>-hl+.7&&mx<hl-1.7;
      wall(a,b,zt,zt+.36,WH);wall(a,b,zt+.36,zt+.86,side?CAN:WH);wall(a,b,zt+.86,zt+.95,'#ffffff')}
    // benches along both sides, passengers in sun hats facing in
    const SH=['#d8573f','#3d7bb8','#f2c14e','#6aa86b','#efe9dc','#8d5aa8','#e98a3c','#2f4d6b','#c94c6f','#5fb0b7'],HT=['#f1e4c3','#2b3a55','#c9a25e','#e8e8e8','#7a4a2a','#d8573f'],SK=['#e2b48c','#c68b5e','#8d5a3b','#f0c8a0'];
    let pi=0;const pax=(x,y)=>{const c=SH[pi%SH.length],h=HT[(pi*7+3)%HT.length],k=SK[(pi*5+1)%SK.length];pi++;
      cyl(x,y,zt+.62,.19,.4,'z',c,null,10);cyl(x,y,zt+.86,.15,.1,'z',c,null,10);cyl(x,y,zt+.96,.06,.08,'z',k,null,6);cyl(x,y,zt+1.1,.12,.2,'z',k,null,10);cyl(x,y,zt+1.215,.24,.03,'z',h,null,12);cyl(x,y,zt+1.28,.11,.12,'z',h,null,10)};
    for(const sd of[-1,1])for(const x of[3.5,2.6,1.7,.8,-.1])pax(x,sd*1.02);
    // the wheelhouse: white, a roof with an overhang, windows all round, a red door at the back, an orange life ring on each side
    const wx0=-3.3,wx1=-.9,wy=.95,wz=zt+2.05,GL='#35546e';box(wx0,wx1,-wy,wy,zt,wz,'#f6f4ee');box(wx0-.15,wx1+.22,-wy-.14,wy+.14,wz,wz+.14,'#e9e6dc');
    dec([[wx1+.005,-.8,zt+1.15],[wx1+.005,.8,zt+1.15],[wx1+.005,.8,zt+1.86],[wx1+.005,-.8,zt+1.86]],GL,[1,0,0]);
    for(const sd of[-1,1]){const y=sd*(wy+.005);for(const [a,b] of[[-3.12,-2.52],[-2.34,-1.74]])dec([[a,y,zt+1.2],[b,y,zt+1.2],[b,y,zt+1.86],[a,y,zt+1.86]],GL,[0,sd,0]);
      const ring=(r,col,o)=>{const P=[];for(let q=0;q<14;q++){const a=q/14*TAU;P.push([-1.3+Math.cos(a)*r,y+sd*o,zt+1.3+Math.sin(a)*r])}dec(P,col,[0,sd,0])};ring(.28,'#f08a24',.001);ring(.14,'#f6f4ee',.002)}
    dec([[wx0-.005,-.36,zt+.03],[wx0-.005,.36,zt+.03],[wx0-.005,.36,zt+1.86],[wx0-.005,-.36,zt+1.86]],'#c23b2e',[-1,0,0]);
    dec([[wx0-.01,-.2,zt+1.3],[wx0-.01,.2,zt+1.3],[wx0-.01,.2,zt+1.7],[wx0-.01,-.2,zt+1.7]],GL,[-1,0,0]);
    box(-2.2,-2.0,-.08,.08,wz+.14,wz+.7,'#f4f2ec');box(-2.5,-1.7,-.05,.05,wz+.62,wz+.7,'#2a2f33');
    // a flag on a staff at the stern
    const fx=-hl+.5;box(fx-.04,fx+.04,-.04,.04,zt,zt+3.3,'#f4f2ec');
    const flag=(z0,z1,col)=>{const q=[[fx,0,z1],[fx-1.0,0,z1-.12],[fx-1.0,0,z0-.12],[fx,0,z0]];add(q,col,[fx-.5,1,(z0+z1)/2]);add(q.slice(),col,[fx-.5,-1,(z0+z1)/2])};
    flag(zt+2.98,zt+3.25,CAN);flag(zt+2.7,zt+2.98,'#ffffff')}
  else if(craft==='kayak'){prism(top.map(p=>[p[0]*.98,p[1]*.96]),zt-.02,zt+.02,K.col);cyl(-.05,0,zt+.03,.33,.06,'z','#1f2a2e');
    for(const x of[1.2,-1.3])dec([[x-.6,0,zt+.025],[x+.6,0,zt+.025],[x+.6,.03,zt+.025],[x-.6,.03,zt+.025]],K.trim,[0,0,1])}
  else{prism(top.map(p=>[p[0]*.94,p[1]*.86]),zt-.12,zt-.08,'#7a5a3a');for(const x of[-1.1,0,1.1])box(x-.07,x+.07,-.42,.42,zt-.12,zt-.02,K.trim)}
  BOATMESH[craft]=finish();return BOATMESH[craft]}
function boatNear(x,y,r=230){let best=null,bd=r;for(const B of BOATS){if(B===S.boat)continue;const d=Math.hypot(B.x-x,B.y-y);if(d<bd){bd=d;best=B}}return best}
function shoreSpot(B){const ca=Math.cos(B.ang),sa=Math.sin(B.ang);
  for(const r of[50,80,110,140,170])for(const a of[PI/2,-PI/2,0,PI,PI/4,-PI/4,3*PI/4,-3*PI/4]){const x=B.x+Math.cos(B.ang+a)*r,y=B.y+Math.sin(B.ang+a)*r;
    if((onPier(x,y)||(!waterKind(x,y)&&!waterAt(x,y,true)))&&!blockedAt(x,y,8))return[x,y]}return null}
function updateBoat(dt){const B=S.boat;if(S.mode!=='boat'||!B){SFX.boat(null,0);return}const K=BOATK[B.craft],inp=getInput(),steer=!S.bino.on&&inp.m>0;
  if(steer){const want0=Math.atan2(inp.y,inp.x),d0=angDiff(B.ang,want0);
    if(!B.rev&&Math.abs(d0)>2.45&&B.v<K.vmax*.25)B.rev=true;else if(B.rev&&Math.abs(d0)<1.75)B.rev=false}else if(!B.v)B.rev=false;
  if(steer&&(B.rev||Math.abs(angDiff(B.ang,Math.atan2(inp.y,inp.x)))>2.45)){const want=Math.atan2(inp.y,inp.x);
    if(B.v>0)B.v=Math.max(0,B.v-K.acc*2.2*dt);
    else if(B.rev){const rv=-K.vmax*.4*inp.m;B.v+=(rv<B.v?-K.acc:K.acc)*dt;const d2=angDiff(B.ang,want+PI),dz=.44,sg=Math.abs(d2)<dz?0:(d2-Math.sign(d2)*dz);B.ang+=clamp(sg*1.4,-1,1)*K.turn*.6*dt}}
  else if(steer){const want=Math.atan2(inp.y,inp.x),d=angDiff(B.ang,want);B.ang+=clamp(d*1.4,-1,1)*K.turn*dt*clamp(.35+Math.abs(B.v)/K.vmax,.35,1.2);
    const tv=K.vmax*inp.m*clamp(1.2-Math.abs(d)/1.6,.15,1);B.v+=(tv>B.v?K.acc:-K.acc*1.4)*dt}
  else{B.v*=Math.pow(B.craft==='tour'?.5:.3,dt);if(Math.abs(B.v)<3)B.v=0}
  const nx=B.x+Math.cos(B.ang)*B.v*dt,ny=B.y+Math.sin(B.ang)*B.v*dt,bow=K.L*M*.5,fx=Math.cos(B.ang)*bow,fy=Math.sin(B.ang)*bow;
  const ok=boatWater(B.craft,nx+fx,ny+fy)&&boatWater(B.craft,nx,ny)&&!(B.craft!=='tour'&&blockedAt(nx+fx*.8,ny+fy*.8,10));
  if(ok){B.x=nx;B.y=ny}else{if(Math.abs(B.v)>40&&!S.boatTold){S.boatTold=true;setTimeout(()=>S.boatTold=false,2500);
      const t=terr(nx+fx,ny+fy);toast(t===T.ICE?'Ice ahead.':B.craft==='tour'?'Too shallow for the tour boat.':B.craft==='canoe'&&wkey(nx+fx,ny+fy)==='ocean'?'The canoe stays on lakes, ponds, creeks and the swamp.':B.craft==='kayak'&&(t===T.DEEP||t===T.SHAL)?'Open ocean ahead. That\'s tour boat water.':(GPS.linked&&GPS.mode==='console'?'Ashore here. Press B to step out.':'Ashore here. Press Use to step out.'),1.8)}B.v*=-.2}
  const ph0=B.ph;B.ph+=B.craft==='tour'?Math.abs(B.v)*dt*.045:steer?(1.6+Math.abs(B.v)*.02)*dt:0;
  if(B.craft!=='tour'){const P=paddlePose(B),wb=P.blades.find(b=>b.wet);B.pfx=(B.pfx||0)-dt;if(wb&&steer&&B.pfx<=0){B.pfx=.12;const ca=Math.cos(B.ang),sa=Math.sin(B.ang);addPrint(B.x+(wb.p[0]*ca-wb.p[1]*sa)*M*VX,B.y+(wb.p[0]*sa+wb.p[1]*ca)*M*VX*KD,B.ang,'water')}}
  if(B.craft!=='tour'&&(steer||Math.abs(B.v)>30)&&Math.floor(B.ph/PI)!==Math.floor(ph0/PI))SFX.paddle(clamp(.5+Math.abs(B.v)/K.vmax,.5,1.2),paddlePose(B).side>0?.35:-.35);
  pushWake(B);SFX.boat(B.craft,clamp(Math.abs(B.v)/K.vmax,0,1));
  const p=S.player;p.x=B.x;p.y=B.y;p.face=B.ang;p.moving=false;p.water=null}

/* P1 kayak and P2 canoe strokes, in the boat's own metres (x forward, y right, z up from the water).
   Each stroke: the blade goes in well forward (the catch), pulls back to the hip, lifts out and swings forward again.
   The kayak's double blade alternates sides; the canoe's single blade stays on one side for six strokes, then switches. */
const pEase=u=>u<.5?2*u*u:1-2*(1-u)*(1-u);
function paddlePose(B){const ph=Math.max(0,B.ph||0),n=Math.floor(ph/PI),u=ph/PI-n;
  const shoulder=(sit,s,tw)=>[sit+s*Math.sin(tw)*.2,s*Math.cos(tw)*.2,.55];
  if(B.craft==='kayak'){const side=n%2?1:-1,sit=-.1,Y=.95;let A,O,wet=false,tw;
    if(u<.62){const e=pEase(u/.62);A=[sit+lerp(.85,-.35,e),side*Y,u<.06?(.06-u)/.06*.25:u>.55?(u-.55)/.07*.15:0];wet=u>=.06&&u<=.55;
      const cx=sit+lerp(.38,.22,e);O=[2*cx-A[0],-side*Y,lerp(1,.85,e)];tw=side*lerp(.35,-.35,e)}
    else{const e=pEase((u-.62)/.38);A=[sit+lerp(-.35,-.09,e),side*Y,lerp(.15,1,e)];O=[sit+lerp(.79,.85,e),-side*Y,lerp(.85,.25,e)];tw=-side*.35}
    const c=[(A[0]+O[0])/2,0,(A[2]+O[2])/2],hand=p=>[c[0]+(p[0]-c[0])*.32,p[1]*.32,c[2]+(p[2]-c[2])*.32+.12];
    const L=A[1]<0?A:O,R=A[1]<0?O:A;
    return{sit,n,u,side,tw,blades:[{p:A,wet},{p:O,wet:false}],shaft:[A,O],sh:[shoulder(sit,-1,tw),shoulder(sit,1,tw)],hands:[hand(L),hand(R)]}}
  const side=Math.floor(n/6)%2?1:-1,sit=-.7,Y=.62;let A,wet=false,tw;
  if(u<.6){const e=pEase(u/.6);A=[sit+lerp(.75,-.35,e),side*Y,u<.06?(.06-u)/.06*.2:u>.52?(u-.52)/.08*.15:0];wet=u>=.06&&u<=.52;tw=side*lerp(.3,-.3,e)}
  else{const r=(u-.6)/.4,e=pEase(r);A=[sit+lerp(-.35,.75,e),side*Y*(1-.25*Math.sin(r*PI)),.15+.05*e+Math.sin(r*PI)*.25];tw=side*lerp(-.3,.3,e)}
  const grip=[lerp(A[0],sit,.35)+.05,side*.08,1.15],low=[A[0]+(grip[0]-A[0])*.45,A[1]+(grip[1]-A[1])*.45,A[2]+(grip[2]-A[2])*.45];
  return{sit,n,u,side,tw,grip,blades:[{p:A,wet}],shaft:[A,grip],sh:[shoulder(sit,side,tw),shoulder(sit,-side,tw)],hands:[low,grip]}}
function riderHead(o,px,py){ctx.fillStyle='#e2b48c';ctx.beginPath();ctx.arc(px,py-13,3.6,0,TAU);ctx.fill();ctx.fillStyle=o.hatC||'#c9b27c';ctx.beginPath();ctx.ellipse(px,py-15,5.6,2.4,0,0,TAU);ctx.fill();ctx.beginPath();ctx.arc(px,py-15.5,3,PI,TAU);ctx.fill()}
const WAKE={tour:{life:5.5,w0:.42,band:1,arms:.34,foam:1,lw:2.6},kayak:{life:2.8,w0:.5,band:0,arms:.3,foam:0,lw:1.3},canoe:{life:2.8,w0:.5,band:0,arms:.3,foam:0,lw:1.3}};let WAKE_ID=0;
function pushWake(B){const K=BOATK[B.craft],W=WAKE[B.craft],v=B.v;B.trail=B.trail||[];
  while(B.trail.length&&S.t-B.trail[0].t>W.life)B.trail.shift();
  if(v<12){B.wbrk=true;return}if(B.wbrk){B.wseg=(B.wseg|0)+1;B.wbrk=false}
  B.wang=B.wang==null?B.ang:B.wang+angDiff(B.wang,B.ang)*(B.craft==='tour'?.5:.12);const L=K.L*M*VX*.5,ca=Math.cos(B.wang),sa=Math.sin(B.wang),sx=B.x-ca*L*.94,sy=B.y-sa*L*.94*KD,last=B.trail[B.trail.length-1];
  if(last&&last.seg===B.wseg&&Math.hypot(sx-last.x,sy-last.y)<5)return;
  let px=-sa,py=ca*KD;const n=Math.hypot(px,py);px/=n;py/=n;
  B.wv=B.wv==null?v:B.wv+(v-B.wv)*.08;const vv=B.wv;B.trail.push({x:sx,y:sy,px,py,t:S.t,id:WAKE_ID++,seg:B.wseg|0,str:clamp(vv/K.vmax+.2,0,1),sp:vv*W.arms,w:K.W*M*VX*.5*W.w0});if(B.trail.length>500)B.trail.shift()}
function drawWakes(x0,y0,x1,y1){const now=S.t;
  for(const B of BOATS){const tr=B.trail;if(!tr||tr.length<2)continue;const W=WAKE[B.craft];
    const lastP=tr[tr.length-1];if(lastP.x<x0-900||lastP.x>x1+900||lastP.y<y0-900||lastP.y>y1+900)continue;
    ctx.lineCap='round';ctx.lineJoin='round';
    const seg=(fn)=>{for(let i=1;i<tr.length;i++){const a=tr[i-1],b=tr[i];if(a.seg!==b.seg)continue;const age=now-a.t,f=1-age/W.life;if(f<=0)continue;fn(a,b,age,f,i)}};
    // churned water behind the propeller: soft, wide, widening band
    // churned water behind the propeller: soft bands that widen with age, drawn as joined strips so nothing overlaps into beads
    const strip=(wf,cf)=>seg((a,b,age,f)=>{const ag2=now-b.t,wa=wf(a,age),wb=wf(b,ag2);if(wa<=0)return;ctx.fillStyle=cf(a,age,f);ctx.beginPath();
      ctx.moveTo(a.x+a.px*wa,a.y+a.py*wa);ctx.lineTo(b.x+b.px*wb,b.y+b.py*wb);ctx.lineTo(b.x-b.px*wb,b.y-b.py*wb);ctx.lineTo(a.x-a.px*wa,a.y-a.py*wa);ctx.closePath();ctx.fill()});
    if(W.band){strip((a,age)=>a.w*.62+age*a.sp*.15,(a,age,f)=>`rgba(205,240,238,${.22*f*a.str})`);
      strip((a,age)=>age>1.6?0:(a.w*.3+age*a.sp*.06)*(1-age/1.6*.4),(a,age,f)=>`rgba(250,253,252,${.42*Math.max(0,1-age/1.6)*a.str})`)}
    // foam bubbles scattered through the wash; fixed per point so they don't flicker, shrinking as they age
    if(W.foam)for(let i=0;i<tr.length;i++){const a=tr[i],age=now-a.t,f=1-age/W.life;if(f<=0)continue;const span=a.w*.9+age*a.sp*.2;
      for(let k=0;k<3;k++){const h1=whash(a.id,k*7+1),h2=whash(k*13+5,a.id),off=(h1-.5)*2*span,r=(.8+h2*2.2)*(1-.6*age/W.life);
        ctx.fillStyle=`rgba(255,255,255,${.6*f*a.str})`;ctx.beginPath();ctx.ellipse(a.x+a.px*off+(h2-.5)*3,a.y+a.py*off,r,r*.62,0,0,TAU);ctx.fill()}}
    // transverse crests: faint arcs across the wake every few points
    if(W.band)for(let i=2;i<tr.length;i+=6){const a=tr[i],age=now-a.t,f=1-age/W.life;if(f<=0||age<.3)continue;const o=a.w+age*a.sp,bend=age*a.sp*.35,ca=a.py,sa=-a.px;
      ctx.strokeStyle=`rgba(240,250,250,${.22*f*a.str})`;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(a.x+a.px*o*.85,a.y+a.py*o*.85);ctx.quadraticCurveTo(a.x-ca*bend,a.y-sa*bend,a.x-a.px*o*.85,a.y-a.py*o*.85);ctx.stroke()}
    // the two wave arms (Kelvin wake): crisp white lines spreading at the wake angle, with a fainter echo outside
    ctx.lineCap='butt';for(const side of[-1,1])for(const [mul,al,lw] of[[1,.85,1],[1.22,.3,.6]]){seg((a,b,age,f)=>{const oa=(a.w+age*a.sp)*mul,ob=(b.w+(now-b.t)*b.sp)*mul;
      ctx.strokeStyle=`rgba(246,252,250,${al*f*a.str})`;ctx.lineWidth=(.7+W.lw*f)*lw;ctx.beginPath();ctx.moveTo(a.x+a.px*side*oa,a.y+a.py*side*oa);ctx.lineTo(b.x+b.px*side*ob,b.y+b.py*side*ob);ctx.stroke()})}
    // little curls along the arms where the waves break (tour boat)
    if(W.band)for(let i=1;i<tr.length;i+=6){const a=tr[i],age=now-a.t,f=1-age/W.life;if(f<=0||age>3)continue;
      for(const side of[-1,1]){const o=a.w+age*a.sp,cx=a.x+a.px*side*o,cy=a.y+a.py*side*o,r=2+age*2;ctx.strokeStyle=`rgba(255,255,255,${.2*f*a.str})`;ctx.lineWidth=1;ctx.beginPath();const an=Math.atan2(a.py*side,a.px*side);ctx.arc(cx,cy,r,an-1.2,an+1.2);ctx.stroke()}}}}
function drawBoat(B,t){if(B.craft==='plane'){drawPlane(B,t);return}const K=BOATK[B.craft],L=K.L*M*VX*.5,W=K.W*M*VX*.5,bob=Math.sin(t*1.7+B.x*.01)*.8,rider=S.boat===B&&S.mode==='boat',v=Math.abs(B.v);
  // wake behind and a bow wave
  ctx.save();ctx.translate(B.x,B.y+bob);ctx.scale(1,KD);ctx.rotate(B.ang);
  if(v>12){const a=clamp(v/K.vmax,0,1),big=B.craft==='tour';
    // bow wave: a foam cushion at the stem and two curling whiskers peeling off along the hull
    ctx.fillStyle=`rgba(255,255,255,${.32*a+.06})`;ctx.beginPath();ctx.ellipse(L*.99,0,(big?4:2)*(.5+a),W*(big?.32:.28),0,0,TAU);ctx.fill();
    ctx.lineCap='round';for(const s of[-1,1]){ctx.strokeStyle=`rgba(255,255,255,${.75*a+.1})`;ctx.lineWidth=big?2.4:1.2;ctx.beginPath();ctx.moveTo(L*.98,s*W*.15);ctx.quadraticCurveTo(L*.78,s*W*1.05,L*(.62-.3*a),s*W*(1.18+.35*a));ctx.stroke();
      ctx.strokeStyle=`rgba(255,255,255,${.35*a})`;ctx.lineWidth=big?1.6:.8;ctx.beginPath();ctx.moveTo(L*.6,s*W*1.12);ctx.quadraticCurveTo(0,s*W*1.22,-L*.92,s*W*1.06);ctx.stroke();
      // a few flecks of spray off the bow
      if(big)for(let k=0;k<4;k++){const h=whash(k*31+(t*6|0),s*7+3);ctx.fillStyle=`rgba(255,255,255,${.5*a})`;ctx.beginPath();ctx.arc(L*(.8-h*.5),s*W*(1.3+h*.6*a),1+h*1.4,0,TAU);ctx.fill()}}}
  // a soft shadow in the water
  ctx.fillStyle='rgba(10,30,40,.22)';ctx.beginPath();ctx.ellipse(4,6,L*1.02,W*1.15,0,0,TAU);ctx.fill();
  const hull=(l,w,blunt)=>{ctx.beginPath();ctx.moveTo(l,0);ctx.bezierCurveTo(l*.55,-w*1.05,-l*.55,-w*1.05,-l*(blunt?1:1),blunt?-w*.75:0);if(blunt)ctx.lineTo(-l,w*.75);ctx.bezierCurveTo(-l*.55,w*1.05,l*.55,w*1.05,l,0);ctx.closePath()};
  if(B.craft==='tour'){/* drawn as a 3D model below */}
  else{
    hull(L,W,false);ctx.fillStyle=K.col;ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=shadeHex(K.col,-.3);ctx.stroke();
    if(B.craft==='kayak'){ctx.strokeStyle=K.trim;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L*.9,0);ctx.lineTo(L*.25,0);ctx.moveTo(-L*.25,0);ctx.lineTo(-L*.9,0);ctx.stroke();
      ctx.fillStyle='#1f2a2e';ctx.beginPath();ctx.ellipse(-L*.02,0,L*.2,W*.62,0,0,TAU);ctx.fill();ctx.strokeStyle='#f6c454';ctx.lineWidth=1.2;ctx.stroke()}
    else{hull(L*.92,W*.78,false);ctx.fillStyle=shadeHex(K.col,.18);ctx.fill();ctx.strokeStyle=K.trim;ctx.lineWidth=2.4;ctx.beginPath();for(const x of[-L*.45,0,L*.45]){ctx.moveTo(x,-W*.74);ctx.lineTo(x,W*.74)}ctx.stroke()}}
  ctx.restore();
  if(B.craft==='tour')drawMeshMap({x:B.x,y:B.y+bob,ang:B.ang},boatMesh('tour'));
  // the birder aboard: standing in the tour boat's stern cockpit, or paddling
  if(rider){const o=outfitDef(S.outfit),ca=Math.cos(B.ang),sa=Math.sin(B.ang),sc=M*VX,zs=VX*HS;
    const W2S=(x,y,z)=>[B.x+(x*ca-y*sa)*sc,B.y+bob+(x*sa+y*ca)*sc*KD-z*zs];
    if(B.craft==='tour'){if(sa>.3)return;const [px,py]=W2S(-3.95,0,1.1);ctx.fillStyle=o.vest||o.top;ctx.beginPath();ctx.ellipse(px,py-6,6.5,5,0,0,TAU);ctx.fill();riderHead(o,px,py);return}
    const P=paddlePose(B),[px,py]=W2S(P.sit,0,0);
    const sh=P.sh.map(q=>W2S(...q)),hands=P.hands.map(q=>W2S(...q)),bl=P.blades.map(b=>({s:W2S(...b.p),w:W2S(b.p[0],b.p[1],0),b}));
    // the water: a lifted blade's shadow and drips, foam where a blade bites, a splash at the catch
    for(const q of bl){if(!q.b.wet&&q.b.p[2]>.04){ctx.fillStyle='rgba(10,30,40,.18)';ctx.beginPath();ctx.ellipse(q.w[0],q.w[1],5,2,B.ang,0,TAU);ctx.fill();
        if(B.craft==='kayak'||P.u>.6)for(let i=0;i<3;i++){const f=(t*2.4+i*.37+q.b.p[1])%1,yy=q.s[1]+(q.w[1]-q.s[1])*f;ctx.fillStyle=`rgba(235,248,255,${.85*(1-f)})`;ctx.fillRect(q.s[0]-.8+(i-1)*1.7,yy,1.6,1.8)}}
      else if(q.b.wet){ctx.strokeStyle='rgba(240,250,252,.8)';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(q.w[0],q.w[1],6.5,2.8,B.ang,0,TAU);ctx.stroke();
        if(P.u<.22){const k=(P.u-.06)/.16;if(k>0)for(let i=0;i<6;i++){const a=i/6*TAU+P.n,r=3+k*8;ctx.fillStyle=`rgba(240,250,255,${.9*(1-k)})`;ctx.beginPath();ctx.arc(q.w[0]+Math.cos(a)*r,q.w[1]+Math.sin(a)*r*.45-Math.sin(k*PI)*6,1.3,0,TAU);ctx.fill()}}}}
    // body (turning a little with each stroke), the paddle, then arms and head
    ctx.fillStyle=o.vest||o.top;ctx.beginPath();ctx.ellipse(px,py-6,6.5,5,P.tw*.5,0,TAU);ctx.fill();
    ctx.lineCap='round';const sf=P.shaft.map(q=>W2S(...q));ctx.strokeStyle=B.craft==='kayak'?'#2a2f33':'#7a5a38';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sf[0][0],sf[0][1]);ctx.lineTo(sf[1][0],sf[1][1]);ctx.stroke();
    if(P.grip){const g=W2S(...P.grip);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(g[0]-2.6,g[1]);ctx.lineTo(g[0]+2.6,g[1]);ctx.stroke()}
    for(const q of bl){const a=Math.atan2(q.s[1]-py,q.s[0]-px);ctx.fillStyle=q.b.wet?(B.craft==='kayak'?'rgba(214,160,50,.55)':'rgba(120,88,54,.55)'):(B.craft==='kayak'?'#f6c454':'#9a7448');ctx.beginPath();ctx.ellipse(q.s[0],q.s[1],5.6,q.b.wet?2.1:2.6,a,0,TAU);ctx.fill()}
    ctx.strokeStyle=o.top||'#5a7';ctx.lineWidth=2.6;for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(sh[i][0],sh[i][1]);ctx.lineTo(hands[i][0],hands[i][1]);ctx.stroke()}
    ctx.fillStyle='#e2b48c';for(const h of hands){ctx.beginPath();ctx.arc(h[0],h[1],1.7,0,TAU);ctx.fill()}
    riderHead(o,px,py)}}

/* ---------- birds ---------- */
const FLUSH={btbw:70,pile:150,pipl:110},FLYSPD={btbw:260,pile:300,pipl:420};
const SUIT={btbw:['decid','hemlock','birch','spruce'],pile:['decid','snag','pine','liveoak','spruce','hemlock','cypress'],pipl:[]};
// each species is placed only in its own habitats
const HOMES={btbw:['hardwood','foothills','boreal'],pile:['hardwood','southern','swamp','maritime','foothills'],pipl:['beach']};
for(const id in GB){const G=GB[id];FLUSH[id]=G.flush;FLYSPD[id]=G.flyspd;SUIT[id]=G.suit||[];HOMES[id]=G.homes;
  for(const h of G.homes){const H=CENTRAL?null:HABITATS[h];if(!H)continue;if(!H.play.includes(id))H.play.push(id);H.birds=H.birds.filter(n=>n!==G.name)}}
// RB-1: trees of the other maps that an East bird treats like its own (oak and beech like the hardwoods, juniper like cedar...)
const SUIT_ALT={decid:['oak','ash','beech','hawthorn','rowan','willow','hoak','ohia','koa','mamane','flambo','banyan','mesquite','ebony'],liveoak:['hoak','oak','banyan'],pine:['pinyon'],cedar:['juniper','yew'],cypress:['juniper']};
if(CENTRAL)for(const id in SUIT){const s=SUIT[id];if(!s.length)continue;const a=new Set(s);for(const t of s)for(const u of SUIT_ALT[t]||[])a.add(u);if(TROP&&a.has('decid')){a.add('palm');a.add('mangrove')}SUIT[id]=[...a]}
if(REGB)for(const id in COND.sp){const N=SPECIES[id]?SPECIES[id].name:'';for(const h of new Set(COND.sp[id].hs.flat())){const H=HABITATS[h];if(!H)continue;if(!H.play.includes(id))H.play.push(id);H.birds=H.birds.filter(n=>n!==N)}}
function listener(){return S.mode==='drive'?S.car:S.player}
function perchWorld(T,p){return{x:T.x+p.x*M,y:T.y+p.y*M,z:p.h}}
function trunkPerch(T,a,h){const m=model(T);h=clamp(h,1.6,m.tr.h*.82);const w=trunkRadiusAt(m,h),c=trunkAt(m,h);return{x:c[0]+Math.cos(a)*(w+.01),y:c[1]+Math.sin(a)*(w+.01),h,kind:'t',a}}
function suitableTrees(sp,x,y,rmin,rmax,away){const L=listener();
  return treesNear(x,y,rmax).filter(t=>{if(!SUIT[sp].includes(t.type))return false;const d=Math.hypot(t.x-x,t.y-y);if(d<rmin||d>rmax)return false;
    if(sp==='pile'&&model(t).tr.h<6)return false;if(GB[sp]&&GB[sp].nearWater&&wdist(t.x,t.y)>90)return false;if(away){const ax=t.x-x,ay=t.y-y,bx=x-L.x,by=y-L.y;if(ax*bx+ay*by<0)return false}return true})}
function pickPerch(sp,m){const ps=m.perch;if(!ps.length)return null;const r=Math.random();let pool=ps;
  if((sp==='btbw'||GB[sp]?.low)&&r<.45){const low=ps.filter(p=>p.h<6.5);if(low.length)pool=low}else if(r<.8){const o=ps.filter(p=>p.outer);if(o.length)pool=o}
  return pool[Math.floor(Math.random()*pool.length)]}
function landOn(b,T){b.tree=T.id;const m=model(T);
  if(b.sp==='pile'){b.perch=trunkPerch(T,Math.random()*TAU,3+Math.random()*7);b.st='trunk'}
  else{b.perch=pickPerch(b.sp,m)||{x:0,y:0,h:m.tr.h*.6,kind:'b',ang:0};b.st='perch'}
  const w=perchWorld(T,b.perch);b.x=w.x;b.y=w.y;b.z=w.z;b.hd=b.sp==='pile'?b.perch.a+PI:Math.random()*TAU}
function makeBird(sp,x,y){if(GB[sp])return{sp,x,y,z:0,st:'dormant',wake:Math.random()*2,hd:Math.random()*TAU,tm:2+Math.random()*4,song:3+Math.random()*10,note:0,flap:0,peck:0,bob:0,tail:0,curious:0,home:{x,y},id:Math.random().toString(36).slice(2,8)};const b={sp,x,y,z:0,st:'ground',hd:Math.random()*TAU,tm:2+Math.random()*4,song:3+Math.random()*10,note:0,flap:0,peck:0,bob:0,tail:0,curious:0,home:{x,y},id:Math.random().toString(36).slice(2,8)};
  if(sp!=='pipl'){const ts=suitableTrees(sp,x,y,0,500,false).sort((a,c)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(c.x-x,c.y-y));if(ts.length)landOn(b,ts[0]);else return null}
  else{b.x=x;b.y=y;b.st='ground';b.goal=null}
  return b}
function placeBirds(){placeBirds0();condRoll()}
const BAND_L='AFNMST';
const PAC_ISL=['Garden Isle','Harbor Isle','Cloud Isle','Fire Isle','Coral Atoll'];
function zoneAt(x,y){return PAC?isleAt(x,y):bandAt(y).id}
const RG_X={btbw:{kind:'perch'},pile:{kind:'perch'},pipl:{kind:'ground'}};   // range state for the three hand-drawn birds
function applyRangesR(){const si=SEAS_I[SEASON];for(const id of [...Object.keys(GB),'btbw','pile','pipl']){const G=GB[id]||RG_X[id],d=COND.sp[id];
  if(!HOMES[id])continue;const H=HOMES[id];if(!G.homes0)G.homes0=H.slice();G.isles=null;
  if(!d){H.length=0;G.rangeB=null;G.bands=null;G.strayB=[];continue}   // not on this map
  H.length=0;H.push(...(d.hs[si]||[]));const rg=d.rg?d.rg[si]||'':null;
  if(rg===null||(PAC&&G.kind==='sea')){G.rangeB=null;G.bands=null;G.strayB=[];continue}
  if(PAC){const I=[...rg].map(c=>PAC_ISL[+c]);G.isles=I.length>=4?null:I;G.rangeB=null;G.bands=null;G.strayB=[];continue}
  const NB=BANDS.length,ix=[...rg].map(Number),all=new Set();for(const i of ix){all.add(i);if(i>0)all.add(i-1);if(i<NB-1)all.add(i+1)}
  G.rangeB=ix.map(i=>BANDS[i].id);G.bands=[...all].sort().map(i=>BANDS[i].id);G.strayB=G.bands.filter(b=>!G.rangeB.includes(b))}}
function applyRanges(){if(REGB)return applyRangesR();const si=SEAS_I[SEASON];for(const id in GB){const G=GB[id],d=COND.sp[id];if(!d||!d.hs)continue;if(!G.homes0)G.homes0=G.homes.slice();
  const hs=d.hs[si]&&d.hs[si].length?d.hs[si]:G.homes0;G.homes.length=0;G.homes.push(...hs);const rg=d.rg&&d.rg[si]||'';
  if(!rg){G.rangeB=null;G.strayB=[];G.bands=null;continue}const ix=[...rg].map(c=>BAND_L.indexOf(c)),all=new Set();for(const i of ix){all.add(i);if(i>0)all.add(i-1);if(i<5)all.add(i+1)}
  G.rangeB=ix.map(i=>'R'+(i+1));G.bands=[...all].map(i=>'R'+(i+1));G.strayB=G.bands.filter(b=>!G.rangeB.includes(b))}}
function rangeTxt(id){if(REGB){const d=COND.sp[id];if(!d)return'Not on this map';const si=SEAS_I[SEASON];if(!d.se[si])return'Away this season';if(!d.rg)return'';const rg=d.rg[si];
    const N=[...rg].map(c=>PAC?PAC_ISL[+c]:BANDS[+c].name);return PAC?(N.length>=4?'All islands':N.join(', ')):N.length===1?N[0]+' only':N.length===BANDS.length?'Whole map':N[0]+' to '+N[N.length-1]}
  const d=COND.sp[id];if(!d&&GB[id]&&GB[id].xr)return'Not on this map';if(!d||!d.rg)return'';const rg=d.rg[SEAS_I[SEASON]];if(!rg)return'Away this season';const BE=BANDS_BY.east||BANDS,N=[...rg].map(c=>BE[BAND_L.indexOf(c)].name);
  return N.length===1?N[0]+' only':N.length===6?'Whole coast':N[0]+' to '+N[N.length-1]}
function placeBirds0(){const r=rng(2024);S.birds=[];applyRanges();if(CENTRAL){if(REGB)placeRegion(r);return}
  const add=(sp,x,y)=>{const b=makeBird(sp,x,y);if(b)S.birds.push(b)};
  // one of each close to the start so the first finds come quickly
  add('btbw',START.x-430,START.y-160);add('pile',START.x-900,START.y+420);add(SEASON==='summer'?'lagu':'sand',coastX(START.y+120)-150,START.y+120);
  const inHome=(sp,x,y)=>HOMES[sp].includes(habitatAt(x,y));
  for(let i=0,n=0,w=scaleN(7);i<200&&n<w;i++){const y=9200+r()*15000,x=3900+r()*(roadX(y)-4400);if(!inHome('btbw',x,y))continue;n++;add('btbw',x,y)}
  for(let i=0,n=0,w=scaleN(8);i<200&&n<w;i++){const y=11600+r()*20000,x=3600+r()*(coastX(y)-4900);if(!inHome('pile',x,y))continue;n++;add('pile',x,y)}
  {const q=riverPoint('Black Creek',.62,1);add('pile',q.x,q.y+200)}
  {const d=COND.sp.pipl,rg=d&&d.rg?d.rg[SEAS_I[SEASON]]:'',want=condCount('pipl',1),C=[];   // nests by the plover fences or on open beach in its range
   for(const f of FENCES)C.push([f.x+f.w*.5,f.y+f.h*(.3+r()*.4)]);for(let i=0;i<60;i++){const y=150+r()*(WH-300);C.push([coastX(y)-140,y])}
   let n=0;for(const [x,y] of C.sort(()=>Math.random()-.5)){if(n>=want)break;if(!rg.includes(BAND_L[BANDS.indexOf(bandAt(y))]))continue;if(habitatAt(x,y)!=='beach')continue;add('pipl',x,y);n++}}
  // the 27 version-18 species: scattered through their own habitats (and regions), woken when you come near
  for(const id in GB){if(!COND.sp[id])continue;const G=GB[id];let n=0,st=false;const want=condCount(id,G.n),main=G.rangeB||G.bands,sb=G.strayB||[],pick=()=>{st=sb.length>0&&Math.random()<(COND.stray||0)};pick();
    for(let i=0;i<6000&&n<want;i++){const x=700+r()*(WW-800),y=150+r()*(WH-300);if(!G.homes.includes(habitatAt(x,y)))continue;const bd=bandAt(y).id;
      if(st?!sb.includes(bd):(main&&!main.includes(bd))){if(st&&i%400===399)st=false;continue}
      n++;const L0=S.birds.length;add(id,x,y);if(st&&S.birds.length>L0)S.birds[L0].stray=1;pick()}}}
// RB-1: the East birds that live on this map, scattered through their season habitats and range, woken when you come near
function placeRegion(r){const add=(sp,x,y)=>{const b=makeBird(sp,x,y);if(b)S.birds.push(b);return b};
  for(const id in COND.sp){const G=GB[id]||RG_X[id]||{},H=HOMES[id];if(!H||!H.length)continue;let n=0,st=false;const want=condCount(id,G.n||3),main=G.rangeB,sb=G.strayB||[],pick=()=>{st=sb.length>0&&Math.random()<(COND.stray||0)};pick();
    for(let i=0;i<6000&&n<want;i++){const x=700+r()*(WW-800),y=150+r()*(WH-300);if(!H.includes(habitatAt(x,y)))continue;
      if(G.isles&&!G.isles.includes(isleAt(x,y)))continue;
      if(main){const bd=bandAt(y).id;if(st?!sb.includes(bd):!main.includes(bd)){if(st&&i%400===399)st=false;continue}}
      if(id==='pipl'&&(!isLand(terr(x,y))||waterKind(x,y)))continue;
      const b=add(id,x,y);if(!b)continue;n++;if(st)b.stray=1;pick()}}}
function plHop(b,r0,r1){for(let i=0;i<40;i++){const a=Math.random()*TAU,r=r0+Math.random()*(r1-r0),x=b.x+Math.cos(a)*r,y=b.y+Math.sin(a)*r;
    if(x>700&&x<WW-80&&y>120&&y<WH-120&&HOMES.pipl.includes(habitatAt(x,y))&&isLand(terr(x,y))&&!waterKind(x,y))return[x,y]}return null}
function flyTo(b,x,y,z,next){b.fly={ax:b.x,ay:b.y,az:b.z,bx:x,by:y,bz:z,t:0,dur:Math.max(.6,Math.hypot(x-b.x,y-b.y)/FLYSPD[b.sp]),next};b.st='fly';b.hd=Math.atan2(y-b.y,x-b.x)}
function flushBird(b,scare){const L=listener();if(GB[b.sp]&&GB[b.sp].kind!=='perch'){gbFlush(b);if(scare){const d=Math.hypot(b.x-L.x,b.y-L.y);SFX.flush(clamp(1-d/700,0,1),0)}return}
  if(b.sp==='pipl'&&CENTRAL){const p=plHop(b,300,800);if(p){flyTo(b,p[0],p[1],0,{st:'ground'});b.home={x:p[0],y:p[1]}}}
  else if(b.sp==='pipl'){const dir=Math.sign(b.y-L.y)||1,ny=clamp(b.y+dir*(300+Math.random()*500),6000,25000);flyTo(b,coastX(ny)-80-Math.random()*190,ny,0,{st:'ground'});b.home={x:b.fly.bx,y:ny}}
  else{let ts=suitableTrees(b.sp,b.x,b.y,180,650,true);if(!ts.length)ts=suitableTrees(b.sp,b.x,b.y,150,700,false);if(!ts.length)return;
    const T2=ts[Math.floor(Math.random()*ts.length)],tmp={sp:b.sp};landOn(tmp,T2);b.pending={tree:T2.id,perch:tmp.perch};flyTo(b,tmp.x,tmp.y,tmp.z,{st:tmp.st})}
  if(scare){const d=Math.hypot(b.x-L.x,b.y-L.y);SFX.flush(clamp(1-d/700,0,1),0)}}
const HEAR_R=870,CUE_R=500;   // SN1: heard out to ~80 m; SN2: arrow only within 50 m (1 unit = 10 cm)
function birdSing(b){const L=listener(),d=Math.hypot(b.x-L.x,b.y-L.y);const vol=Math.pow(clamp(1-d/HEAR_R,0,1),1.4);if(vol<.03)return;
  const yaw=S.bino.on?S.bino.yaw:(S.mode==='drive'?S.car.ang:S.player.face);const pan=Math.sin(angDiff(yaw,Math.atan2(b.y-L.y,b.x-L.x)))*.8;
  if(b.sp==='pile'&&Math.random()<.45)SFX.drum(vol,pan);else SFX.song(b.sp,vol,pan);if(d<CUE_R)b.note=1.8}
const SOAR_SLOW=.22;   // soaring birds drift at 30% speed while an optic is raised, so they are easy to follow
function startSoar(b){const G=GB[b.sp],Z=G.soarZ,R=G.soarR;b.tree=null;b.perch=null;b.pending=null;b.bld=null;b.hop=null;b.goal=null;b.fly=null;
  const r=R[0]+Math.random()*(R[1]-R[0]),a=Math.random()*TAU;
  b.soar={cx:b.x-Math.cos(a)*r,cy:b.y-Math.sin(a)*r*(G.quarter?.45:1),r,a,dir:Math.random()<.5?1:-1,zt:Z[0]+Math.random()*(Z[1]-Z[0]),t:0,dur:G.soarT[0]+Math.random()*(G.soarT[1]-G.soarT[0]),wa:Math.random()*TAU,bout:0};b.st='fly'}
function soarUpdate(b,dt){const G=GB[b.sp],o=b.soar;if(S.bino.on)dt*=SOAR_SLOW;o.t+=dt;
  const v=G.soarV||G.flyspd*.45;o.a+=o.dir*v/o.r*dt;
  // the thermal drifts with the wind, and is pulled back if it wanders far from home
  const hx=b.home.x-o.cx,hy=b.home.y-o.cy,hd=Math.hypot(hx,hy)||1;o.wa+=(Math.random()-.5)*dt*.3;
  o.cx+=Math.cos(o.wa)*12*dt+(hd>900?hx/hd*25*dt:0);o.cy+=Math.sin(o.wa)*12*dt+(hd>900?hy/hd*25*dt:0);
  const nx=o.cx+Math.cos(o.a)*o.r,ny=o.cy+Math.sin(o.a)*o.r*(G.quarter?.45:1);if(dt>0)b.hd=Math.atan2(ny-b.y,nx-b.x);b.x=nx;b.y=ny;
  b.z+=(o.zt-b.z)*Math.min(1,dt*.25);
  // a few wingbeats now and then, otherwise a glide on flat wings
  if(o.bout>0){o.bout-=dt;b.flap+=dt*G.flap}else{const m=Math.round(b.flap/PI)*PI;b.flap+=(m-b.flap)*Math.min(1,dt*6);if(Math.random()<dt*(G.flapK??.2))o.bout=.6+Math.random()*1.2}
  b.note=Math.max(0,b.note-dt);b.song-=dt;if(b.song<=0){b.song=gbSongGap(b.sp);birdSing(b)}
  if(o.t>o.dur&&G.rest)soarLand(b)}
function soarRestInit(b){const G=GB[b.sp],h=b.home;b.restT=5+restFor(G)*Math.random();
  if(G.ledge&&inCity(h.x,h.y)&&Math.random()<.4&&goLedge(b,true))return true;
  if(G.rest==='perch'){const ts=suitableTrees(b.sp,h.x,h.y,0,650,false).sort((a,c)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(c.x-h.x,c.y-h.y));if(!ts.length)return false;landOn(b,ts[0]);return true}
  const sp=gbSpotOK(b.sp,h.x,h.y)?[h.x,h.y]:gbFindSpot(b.sp,h.x,h.y,10,400,60);if(!sp)return false;b.x=sp[0];b.y=sp[1];b.st=G.rest==='swim'?'swim':G.rest==='wade'?'wade':'ground';b.z=0;b.goal=null;return true}
function restFor(G){const R=G.restT||[30,60];return R[0]+Math.random()*(R[1]-R[0])}
function soarLand(b){const G=GB[b.sp];b.soar.t=b.soar.dur-8;
  if(G.ledge&&inCity(b.x,b.y)&&Math.random()<.75&&goLedge(b))return;
  if(G.rest==='perch'){const ts=suitableTrees(b.sp,b.x,b.y,0,700,false);if(!ts.length)return;const T2=ts[Math.floor(Math.random()*ts.length)],tmp={sp:b.sp};landOn(tmp,T2);
    b.soar=null;b.pending={tree:T2.id,perch:tmp.perch};flyTo(b,tmp.x,tmp.y,tmp.z,{st:tmp.st});b.restT=restFor(G);return}
  const sp=gbFindSpot(b.sp,b.x,b.y,0,800,40);if(!sp)return;const st=G.rest==='swim'?'swim':G.rest==='wade'?'wade':'ground';b.soar=null;flyTo(b,sp[0],sp[1],0,{st});b.restT=restFor(G)}
// LG1 rooftop ledges: Peregrines and Red-tailed Hawks take the tallest roof nearby, pigeons any flat roof
function goLedge(b,instant){const G=GB[b.sp],c=buildingsNear(b.x,b.y,900).filter(B=>B.h>=9&&B.roof==='flat'&&B.kind!=='lifeguard');if(!c.length)return false;
  c.sort((p,q)=>q.h-p.h);const B=G.kind==='soar'&&!G.ledgeAny?c[0]:c[Math.floor(Math.random()*c.length)];
  const x=B.x+12+Math.random()*(B.w-24),y=B.y+B.d-3,z=B.h+.1;b.soar=null;b.tree=null;b.perch=null;b.goal=null;b.bld=B.id;
  if(instant){b.x=x;b.y=y;b.z=z;b.st='ledge'}else flyTo(b,x,y,z,{st:'ledge'});b.restT=restFor(G);b.ltm=15+Math.random()*30;return true}
function soarHook(b,dt){const G=GB[b.sp];
  if(b.soar){soarUpdate(b,dt);return true}
  if(G.kind==='soar'&&b.st!=='fly'&&b.st!=='dormant'){b.restT=(b.restT??30)-dt;if(b.restT<=0){startSoar(b);return true}}
  if(b.st==='ledge'){b.note=Math.max(0,b.note-dt);b.song-=dt;if(b.song<=0){b.song=gbSongGap(b.sp);birdSing(b)}b.bob=Math.sin(S.t*2+b.x)*.05;
    b.tm-=dt;if(b.tm<=0){b.tm=3+Math.random()*6;if(Math.random()<.4)b.hd=b.hd>1?0:PI}
    if(G.kind!=='soar'&&(b.ltm-=dt)<=0){b.ltm=15+Math.random()*30;if(Math.random()<.5){const sp=gbFindSpot(b.sp,b.x,b.y+150,40,400,30);if(sp){b.bld=null;flyTo(b,sp[0],sp[1],0,{st:'ground'});b.home={x:sp[0],y:sp[1]}}}}
    return true}
  if(G.ledge&&G.kind!=='soar'&&b.st==='ground'&&Math.random()<dt*.015&&inCity(b.x,b.y))goLedge(b);
  return false}
// aim help: while the optic is on a soaring bird, the view eases along with it
function soarAssist(dt){const B=S.bino;if(!B.on){B.follow=null;return}const R=frameGeom().R;
  if(B.best&&(B.best.soar||B.best.st==='ledge')&&B.bestD<R*.34)B.follow=B.best;const b=B.follow;if(!b||!(b.soar||b.st==='ledge'||b.st==='fly'))return;
  if(b.scr&&Math.hypot(b.scr.x-VW/2,b.scr.y-VH/2)>R*.95){B.follow=null;return}
  const E=binoEye(),dx=(b.x-E.x)/M,dy=(b.y-E.y)/M,dist=Math.hypot(dx,dy),k=Math.min(1,dt*3);
  B.yaw+=angDiff(B.yaw,Math.atan2(dy,dx))*k;B.pitch+=(clamp(Math.atan2(b.z-E.h,dist),-.35,1.2)-B.pitch)*k}
function updateBird(b,dt){if(GB[b.sp]&&soarHook(b,dt))return;
  b.note=Math.max(0,b.note-dt);b.curious=Math.max(0,b.curious-dt);b.peck=Math.max(0,b.peck-dt*3);
  b.song-=dt;if(b.song<=0){b.song=GB[b.sp]?gbSongGap(b.sp):b.sp==='btbw'?7+Math.random()*7:b.sp==='pile'?16+Math.random()*16:9+Math.random()*9;if(b.st!=='fly')birdSing(b)}
  const L=listener(),d=Math.hypot(b.x-L.x,b.y-L.y);
  if(b.st!=='fly'&&!b.curious&&!b.under&&!DEV.obs){const k=S.mode==='drive'?(Math.abs(S.car.v)>60?1.8:.9):(S.player.sneak?.4:S.player.moving?1:.55);if(d<FLUSH[b.sp]*k){flushBird(b,true);return}}
  if(b.st==='fly'){const f=b.fly;f.t+=dt/f.dur;const u=clamp(f.t,0,1),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
    b.x=lerp(f.ax,f.bx,e);b.y=lerp(f.ay,f.by,e);const arc=b.sp==='pipl'||f.sea?1.2:4+f.dur*2;b.z=lerp(f.az,f.bz,e)+Math.sin(u*PI)*arc+(b.sp==='pile'?Math.sin(u*f.dur*9)*.4:0);
    b.flap+=dt*(GB[b.sp]?GB[b.sp].flap:b.sp==='btbw'?34:b.sp==='pile'?12:26);if(b.sp==='pile'&&Math.sin(u*f.dur*9)>.4)b.flap-=dt*12;
    if(f.t>=1){b.z=f.bz;b.st=f.next.st;if(b.st==='fly'){gbSeaLeg(b);return}b.tm=2+Math.random()*4;if(b.pending){b.tree=b.pending.tree;b.perch=b.pending.perch;b.pending=null;b.hd=b.sp==='pile'?b.perch.a+PI:b.hd}}
    return}
  if(GB[b.sp]&&b.st!=='perch'&&b.st!=='trunk'){gbUpdate(b,dt);return}
  b.tm-=dt;
  if(b.st==='perch'){b.bob=Math.sin(S.t*3+b.x)*.08;b.tail=Math.max(0,Math.sin(S.t*2.3+b.y)*1.6-.9);
    if(b.hop){b.hop.t+=dt/.28;const u=clamp(b.hop.t,0,1);b.x=lerp(b.hop.ax,b.hop.bx,u);b.y=lerp(b.hop.ay,b.hop.by,u);b.z=lerp(b.hop.az,b.hop.bz,u)+Math.sin(u*PI)*.35;if(u>=1)b.hop=null}
    if(b.tm<=0){const T=treeById(b.tree);b.tm=b.curious?1.5+Math.random()*2:2.5+Math.random()*5;
      if(T&&(Math.random()<.82||b.curious)){const m=model(T);let p=pickPerch(b.sp,m);
        if(b.curious){// edge toward the person pishing, lower and on the near side
          const best=m.perch.map(q=>({q,s:Math.hypot(T.x+q.x*M-L.x,T.y+q.y*M-L.y)+q.h*6})).sort((a,c)=>a.s-c.s);p=best[Math.floor(Math.random()*Math.min(3,best.length))].q}
        const w=perchWorld(T,p);b.hop={ax:b.x,ay:b.y,az:b.z,bx:w.x,by:w.y,bz:w.z,t:0};b.perch=p;b.hd=Math.atan2(w.y-b.y,w.x-b.x)+(Math.random()<.3?PI:0)}
      else if(!b.curious)flushBird(b,false)}}
  else if(b.st==='trunk'){const T=treeById(b.tree);
    if(b.tm<=0){b.tm=1.4+Math.random()*2.6;const r=Math.random();
      if(r<.5&&T){b.perch=trunkPerch(T,b.perch.a+(Math.random()-.5)*.6,b.perch.h+.25+Math.random()*.3);const w=perchWorld(T,b.perch);b.x=w.x;b.y=w.y;b.z=w.z;b.hd=b.perch.a+PI}
      else if(r<.85){b.peck=1;const dd=Math.hypot(b.x-L.x,b.y-L.y);SFX.chips(clamp(1-dd/600,0,1),0)}
      else flushBird(b,false);
      if(T&&b.perch.h>model(T).tr.h*.78)flushBird(b,false)}
    b.bob=b.peck>0?Math.sin(b.peck*PI*4)*.6:0}
  else if(b.st==='ground'){// run, stop, look, peck
    if(b.goal){const dx=b.goal.x-b.x,dy=b.goal.y-b.y,l=Math.hypot(dx,dy);if(l<3){b.goal=null;b.tm=1.4+Math.random()*3;if(Math.random()<.6)b.peck=1}else{const sp=48*dt;b.x+=dx/l*Math.min(sp,l);b.y+=dy/l*Math.min(sp,l);b.hd=Math.atan2(dy,dx);b.run=(b.run||0)+dt*22}}
    else if(b.tm<=0&&CENTRAL){const p=plHop(b,20,110);if(p)b.goal={x:p[0],y:p[1]};else b.tm=1+Math.random()*2}
    else if(b.tm<=0){const ny=clamp(b.home.y+(Math.random()-.5)*300,12000,31000);b.goal={x:coastX(ny)-60-Math.random()*220,y:ny};b.goal.y=lerp(b.y,b.goal.y,.35);b.goal.x=coastX(b.goal.y)-60-Math.random()*220}
    b.z=0}}
function updateBirds(dt){const L=listener();for(const b of S.birds){if(b.st==='dormant'){if((b.wake-=dt)<=0){b.wake=3+Math.random()*3;if(Math.hypot(b.home.x-L.x,b.home.y-L.y)<(GB[b.sp].kind==='soar'?3800:2300))gbActivate(b)}continue}const far=Math.hypot(b.x-L.x,b.y-L.y)>2600;if(far&&b.st!=='fly'){b.song-=dt;continue}updateBird(b,dt)}}

/* ---------- actions ---------- */
function useTarget(){if(S.mode==='airliner')return null;if(S.mode==='plane')return planeUse();
  {const tr=nearTrail(listener().x,listener().y,200);if(tr){S.trailAt=tr;return'travel'}}
  if(S.mode==='drive')return'exit';
  if(S.mode==='boat')return Math.abs(S.boat.v)<90&&shoreSpot(S.boat)?'land':null;
  if(Math.hypot(S.player.x-S.car.x,S.player.y-S.car.y)<90)return'drive';if(S.player.water!=='swim'&&boatNear(S.player.x,S.player.y))return'board';if(S.player.water==='swim'&&boatNear(S.player.x,S.player.y,90))return'board';return null}
function doUse(){if(S.bino.on)return;const u=useTarget();if(u==='takeoff'){planeTakeoff();return}if(u==='pland'){planeLand();return}if(u==='pout'){planeOut();return}
  if(!u&&S.mode==='walk'){S.touchSneak=!S.touchSneak;SFX.click();toast(S.touchSneak?'Walking slowly. Birds let you get much closer. Tap Walk again to stop.':'Back to normal pace.',2.2);return}
  if(u==='drive'){S.mode='drive';SFX.door();setTimeout(()=>SFX.start(),200);toast('Driving. Head north for the cold, south for the tropics.')}
  else if(u==='exit'){if(Math.abs(S.car.v)>120){toast('Slow down first');return}S.car.v=0;S.mode='walk';SFX.door();
    const c=S.car,side=[[-Math.sin(c.ang),Math.cos(c.ang)],[Math.sin(c.ang),-Math.cos(c.ang)]];let placed=false;
    for(const s of side){const x=c.x+s[0]*58,y=c.y+s[1]*58;if(!blockedAt(x,y,8)&&!waterAt(x,y,true)){S.player.x=x;S.player.y=y;placed=true;break}}
    if(!placed){S.player.x=c.x-Math.cos(c.ang)*80;S.player.y=c.y-Math.sin(c.ang)*80}S.player.face=PI/2;S.player.vx=S.player.vy=0}
  else if(u==='board'){const B=boatNear(S.player.x,S.player.y);if(!B)return;if(B.craft==='plane'){boardPlane(B);return}if(terr(B.x,B.y)===T.ICE){toast('The water is frozen. Come back when it thaws.',2);return}
    S.mode='boat';S.boat=B;B.v=0;if(B.craft==='tour')SFX.boatStart();else SFX.paddle(.6);toast(B.craft==='tour'?'Aboard the Sandpiper, the tour boat. Head out to the shelf edge or north to Puffin Rock.':B.craft==='kayak'?'In the kayak. Slip quietly through the marsh and mangroves.':'In the canoe. Lakes, ponds, creeks and the swamp are yours.',2.4)}
  else if(u==='land'){const sp=shoreSpot(S.boat);if(!sp)return;S.boat.v=0;SFX.boat(null,0);S.mode='walk';S.player.x=sp[0];S.player.y=sp[1];S.player.vx=S.player.vy=0;S.player.face=Math.atan2(sp[1]-S.boat.y,sp[0]-S.boat.x);S.boat=null;SFX.click()}
  else if(u==='travel')openTravel()}
function doPish(){if(S.mode!=='walk'||S.bino.on||S.player.water==='swim')return;if(S.pishCD>0){toast('Give them a moment');return}S.pishCD=6;SFX.pish();
  let n=0;for(const b of S.birds){if(!(b.sp==='btbw'||gbKind(b.sp)==='perch'&&b.sp!=='beki')||b.st==='fly'||b.st==='dormant')continue;const d=Math.hypot(b.x-S.player.x,b.y-S.player.y);if(d<480){b.curious=18;b.tm=.3;n++;if(d>260){const ts=suitableTrees(b.sp,S.player.x,S.player.y,90,220,false);if(ts.length){const tmp={sp:b.sp};landOn(tmp,ts[0]);b.pending={tree:ts[0].id,perch:tmp.perch};flyTo(b,tmp.x,tmp.y,tmp.z,{st:'perch'});b.curious=18}}}}
  toast(n?'Pssh-pssh-pssh… something small is coming to look':'Pssh-pssh-pssh… nothing answered here')}

/* ---------- gear ---------- */
function cycleGear(){setGear(GEAR_IDS[(GEAR_IDS.indexOf(S.gear)+1)%GEAR_IDS.length])}
function setGear(g){if(S.bino.on)toggleBino(false);S.gear=g;saveKit();updateGearUI();SFX.click();
  toast(g==='scope'?'Spotting scope: stand still and raise it to set up the tripod (20–60×)'+(GPS.linked&&GPS.mode==='console'?' · Start/Select zoom':''):g==='cam'?'Camera: 100–600 mm zoom. '+(GPS.linked&&GPS.mode==='console'?'A takes a photo · Start/Select zoom':'Space or the shutter button takes a photo'):'Binoculars: 10×, quick and handheld',3.2)}
function shutter(){const B=S.bino;if(!B.on||S.gear!=='cam')return;if(B.cool>performance.now())return;B.cool=performance.now()+350;B.shoot=true;B.flash=1;SFX.shutter();const sb=$('shutterBtn');sb.classList.add('pressed');setTimeout(()=>sb.classList.remove('pressed'),120)}

/* ---------- the Defender ----------
   One small 3D model in metres (x forward, y to the right, z up), shared by the map and the binoculars.
   Faces are lit by a fixed sun and drawn back to front, so arches, wheels, mirrors and the spare wheel overlap correctly.
   Classic 90 station wagon: Coniston green, Alpine white roof, rounded corners, big tyres on white steel wheels,
   black flares, nudge bar, snorkel, the spare on the rear door and a low black roof rack with a light load. No tent or safari kit. */
const VX=2.2,KD=.72; // KD: ground depth is squashed on the map, like a 3/4 view
/* ---------- v55: ferries you can see (FR1–FR4) and a floatplane you fly (FP1–FP8) ----------
   FR: the Caribbean ferry leaves from a pier in Port Bostick (East Coast) and docks at a pier at Bahía Vieja.
       The ferry itself is a car ferry, drawn as a 3D model, moored alongside; walk out on the pier and press Use.
   FP: a floatplane on Loon Lake (East), Kettle Lake (Central) and Tamarack Lake (West). Board it, taxi, press Use to
       take off when there is open water ahead, steer anywhere, press Use to land when there is water ahead.
       Fly off the map's west or east edge to the next region (East ↔ Central ↔ West). */

/* ===== the ferry ===== */
const FERRYK={L:34,W:9.6,K:1.45};// metres, drawn K× on the map (the Sandpiper is 2.2×)
let FERRY_MESH=null;
function ferryMesh(){if(FERRY_MESH)return FERRY_MESH;const {add,dec,loft,prism,box,cyl,finish}=meshKit(),L=FERRYK.L,W=FERRYK.W,hl=L/2,hw=W/2;
  const HULL='#f4f2ec',NAVY='#1f3a5f',RED='#b8322a',GL='#2c4458',DECK='#8f9599',STEEL='#d9dbd6';
  // hull: a full-width box with a rounded bow, navy band and red boot top at the waterline
  const out=[];for(let i=0;i<=8;i++){const a=-PI/2+i/8*PI;out.push([hl-3.2+Math.cos(a)*3.2,Math.sin(a)*hw])}out.push([-hl,hw],[-hl,-hw]);
  const sc=(P,k,ky)=>P.map(p=>[p[0]*k,p[1]*ky]);
  loft(sc(out,.99,.94),-.3,out,.35,RED,[0,0,0]);loft(out,.35,out,1.15,NAVY,[0,0,.7]);loft(out,1.15,out,2.6,HULL,[0,0,1.9]);
  prism(sc(out,.985,.97),2.55,2.62,DECK);
  // bulwark rail round the open car deck aft
  const rail=(a,b)=>{const q=[[a[0],a[1],2.6],[b[0],b[1],2.6],[b[0],b[1],3.5],[a[0],a[1],3.5]],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;add(q,HULL,[mx*.5,my*.5,3]);add(q.slice(),HULL,[mx*1.6,my*1.6,3])};
  rail([-hl+.2,hw-.1],[1,hw-.1]);rail([-hl+.2,-hw+.1],[1,-hw+.1]);
  // stern ramp (raised) and bow visor line
  box(-hl-.05,-hl+.35,-3.2,3.2,2.6,5.4,'#6d7478');
  // superstructure forward: two decks with a band of windows, the bridge on top with wings
  const sx0=1,sx1=hl-4.2;box(sx0,sx1,-hw+.6,hw-.6,2.6,5.2,HULL);box(sx0+.6,sx1-.4,-hw+.9,hw-.9,5.2,7.6,HULL);
  for(const sd of[-1,1]){const y1=sd*(hw-.6+.005),y2=sd*(hw-.9+.005);
    for(let x=sx0+.5;x<sx1-.5;x+=1.4)dec([[x,y1,3.6],[x+.95,y1,3.6],[x+.95,y1,4.5],[x,y1,4.5]],GL,[0,sd,0]);
    for(let x=sx0+1.1;x<sx1-.9;x+=1.4)dec([[x,y2,6.2],[x+.95,y2,6.2],[x+.95,y2,7],[x,y2,7]],GL,[0,sd,0]);
    // orange life rafts on the side
    cyl(sx0+2.2,sd*(hw-.35),5.6,.45,1.4,'x','#ef7d22',null,10)}
  dec([[sx1+.005,-hw+.7,3.6],[sx1+.005,hw-.7,3.6],[sx1+.005,hw-.7,4.6],[sx1+.005,-hw+.7,4.6]],GL,[1,0,0]);
  const bx0=sx1-4.6,bx1=sx1-.4;box(bx0,bx1,-hw-.2,hw+.2,7.6,9.4,HULL);box(bx0-.2,bx1+.2,-hw-.35,hw+.35,9.4,9.6,'#e4e2da');
  dec([[bx1+.005,-hw,8.1],[bx1+.005,hw,8.1],[bx1+.005,hw,9.1],[bx1+.005,-hw,9.1]],GL,[1,0,0]);
  for(const sd of[-1,1])dec([[bx0+.4,sd*(hw+.205),8.1],[bx1-.4,sd*(hw+.205),8.1],[bx1-.4,sd*(hw+.205),9.1],[bx0+.4,sd*(hw+.205),9.1]],GL,[0,sd,0]);
  // the funnel: white with a navy top and a red band; a mast
  box(sx0+1.2,sx0+3.2,-.8,.8,7.6,10.6,HULL);box(sx0+1.15,sx0+3.25,-.85,.85,9.4,9.9,RED);box(sx0+1.15,sx0+3.25,-.85,.85,10.1,10.7,NAVY);
  box(bx0+1.8,bx0+2,-.1,.1,9.6,12.4,STEEL);box(bx0+1.2,bx0+2.6,-.05,.05,11.6,11.7,STEEL);
  // cars on the open deck, in two lanes
  const CC=['#c23b2e','#2d55a8','#e9e7e0','#5c6b4d','#d9b84a','#24384a','#8a8f93','#3f7f86'];let ci=0;
  for(const ly of[-1.7,1.7])for(let x=-hl+1.6;x<sx0-3;x+=5.4){const c=CC[ci++%CC.length];box(x,x+4.4,ly-.9,ly+.9,2.62,3.4,c);box(x+1,x+3.4,ly-.82,ly+.82,3.4,3.95,GL);box(x+1.05,x+3.35,ly-.8,ly+.8,3.95,4.02,c)}
  // a few people at the bow rail
  for(const [x,y,c] of[[hl-3.1,-1.6,'#d8573f'],[hl-3.3,.4,'#3d7bb8'],[hl-3.6,2.2,'#f2c14e']]){cyl(x,y,2.95,.22,.7,'z',c,null,8);cyl(x,y,3.45,.16,.25,'z','#e2b48c',null,8)}
  FERRY_MESH=finish();return FERRY_MESH}
const FERRIES=[];
// a straight pier from a land point P toward the sea (dir is one of the four axis directions), with the ferry alongside its outer end
function ferryDock(P,dir,name,len,side){const wet=(x,y)=>{const t=terr(x,y);return t===T.SHAL||t===T.DEEP||t===T.LAKE};let s=0;for(;s<3000;s+=10)if(wet(P[0]+dir[0]*s,P[1]+dir[1]*s))break;
  const e=s+len,hw=26,ax=dir[0]!==0,ex=P[0]+dir[0]*e,ey=P[1]+dir[1]*e;
  PIERS.push(ax?{x0:Math.min(P[0],ex),x1:Math.max(P[0],ex),y0:P[1]-hw,y1:P[1]+hw,kind:'pier',name}:{x0:P[0]-hw,x1:P[0]+hw,y0:Math.min(P[1],ey),y1:Math.max(P[1],ey),kind:'pier',name});
  // a wider berth at the end
  const bx=P[0]+dir[0]*(e-40),by=P[1]+dir[1]*(e-40);PIERS.push(ax?{x0:Math.min(bx,ex),x1:Math.max(bx,ex),y0:P[1]-60,y1:P[1]+60,kind:'pier',name}:{x0:P[0]-60,x1:P[0]+60,y0:Math.min(by,ey),y1:Math.max(by,ey),kind:'pier',name});
  const n=[-dir[1]*side,dir[0]*side],half=FERRYK.L*M*FERRYK.K/2,beam=FERRYK.W*M*FERRYK.K/2*(ax?KD:1),off=hw+beam+8,mid=e-half-20;
  const F={x:P[0]+dir[0]*mid+n[0]*off,y:P[1]+dir[1]*mid+n[1]*off+(ax&&n[1]>0?beam*.35:0),ang:Math.atan2(dir[1],dir[0]),name};FERRIES.push(F);
  return{use:[P[0]+dir[0]*mid,P[1]+dir[1]*mid],sign:[P[0]+dir[0]*Math.max(0,s-120)+n[0]*-70,P[1]+dir[1]*Math.max(0,s-120)+n[1]*-70],land:[P[0]+dir[0]*Math.max(0,s-90),P[1]+dir[1]*Math.max(0,s-90)]}}
{const fd=!CENTRAL?ferryDock([OCEAN_DR+ST_HALF+WALK+4,FERRY_Y],[1,0],'Port Bostick ferry pier',520,1):CAR?(()=>{const T0=TRAILS.find(t=>t.name==='Bahía Vieja pier');return ferryDock([T0.x,T0.y-40],[0,-1],'Bahía Vieja pier',560,-1)})():null;
  if(fd){const TR=TRAILS.find(t=>!CENTRAL?t.to==='caribbean':t.name==='Bahía Vieja pier');TR.x=fd.use[0];TR.y=fd.use[1];TR.fdock=true;TR.sign=fd.sign;TR.land=fd.land}}
for(const TR of TRAILS){if(TR.fdock||!/ferry|pier/i.test(TR.name))continue;const wet=(x,y)=>{const t=terr(x,y);return t===T.SHAL||t===T.DEEP||t===T.LAKE};let best=null;
  for(const len of[520,600,680,780])if(!best||best.nb)for(const dir of[[1,0],[-1,0],[0,1],[0,-1]]){let s0=-1;for(let k=0;k<1400;k+=10)if(wet(TR.x+dir[0]*k,TR.y+dir[1]*k)){s0=k;break}if(s0<0)continue;
    let ok=true;for(let k=s0;k<=s0+len+80;k+=20)if(!wet(TR.x+dir[0]*k,TR.y+dir[1]*k)){ok=false;break}if(!ok)continue;
    const nb=BOATS.some(B=>{for(let k=0;k<=s0+len;k+=40)if(Math.hypot(B.x-TR.x-dir[0]*k,B.y-TR.y-dir[1]*k)<320)return true;return false})?1:0;
    for(const side of[1,-1]){const n=[-dir[1]*side,dir[0]*side],e=s0+len,half=FERRYK.L*M*FERRYK.K/2,off=26+FERRYK.W*M*FERRYK.K/2+8;let clear=true;
      for(let a=e-2*half-30;a<=e;a+=40)for(const b of[off-30,off,off+30])if(!wet(TR.x+dir[0]*a+n[0]*b,TR.y+dir[1]*a+n[1]*b))clear=false;
      if(clear&&(!best||nb*2000+s0<best.nb*2000+best.s0))best={dir,side,s0,len,nb}}}
  if(!best)continue;const P=[TR.x-best.dir[0]*60,TR.y-best.dir[1]*60],fd=ferryDock(P,best.dir,TR.name,best.len,best.side);TR.x=fd.use[0];TR.y=fd.use[1];TR.fdock=true;TR.sign=fd.sign;TR.land=fd.land}
// a launch boat moored where a ferry now lies moves along a little
for(const F of FERRIES)for(const B of BOATS){const d=Math.hypot(B.x-F.x,B.y-F.y);if(d>360)continue;let a=Math.atan2(B.y-F.y,B.x-F.x);for(let k=0;k<24;k++){const aa=a+(k%2?1:-1)*Math.ceil(k/2)*.26;for(const r of[400,460,540]){const x=F.x+Math.cos(aa)*r,y=F.y+Math.sin(aa)*r;if(boatWater(B.craft,x,y)&&!onPier(x,y)){B.x=x;B.y=y;k=99;break}}}}
function drawFerry(F,t){const bob=Math.sin(t*.8+F.x*.01)*.6,K=FERRYK.K;
  ctx.save();ctx.translate(F.x,F.y);ctx.scale(1,KD);ctx.rotate(F.ang);ctx.fillStyle='rgba(10,30,40,.22)';ctx.beginPath();ctx.ellipse(10,10,FERRYK.L*M*K*.52,FERRYK.W*M*K*.6,0,0,TAU);ctx.fill();ctx.restore();
  drawMeshMap({x:F.x,y:F.y+bob,ang:F.ang},ferryMesh(),K);
  // a thin wisp from the funnel
  const ca=Math.cos(F.ang),sa=Math.sin(F.ang),fx=F.x+ca*3.2*M*K,fy=F.y+bob+sa*3.2*M*K*KD-10.8*K*HS;
  for(let i=0;i<4;i++){const u=((t*.25+i/4)%1);ctx.fillStyle=`rgba(235,235,235,${(.35*(1-u)).toFixed(3)})`;ctx.beginPath();ctx.arc(fx-u*60,fy-u*90,6+u*16,0,TAU);ctx.fill()}}
// the small blue sign where the pier meets the land
function drawFerrySign(TR){const [x,y]=TR.sign;limb(x-14,y,x-14,y-40,'#5a3e26',3.4);limb(x+14,y,x+14,y-40,'#5a3e26',3.4);
  ctx.fillStyle='#2d5f8a';ctx.fillRect(x-24,y-58,48,26);ctx.strokeStyle='#f3e9c8';ctx.lineWidth=1;ctx.strokeRect(x-22,y-56,44,22);
  ctx.fillStyle='#f3e9c8';ctx.textAlign='center';ctx.font='700 7px Fredoka,system-ui';ctx.fillText('FERRY',x,y-47);ctx.font='600 5.2px Fredoka,system-ui';ctx.fillText('to the '+TR.dest,x,y-39)}

/* ===== the floatplane ===== */
BOATK.plane={name:'Floatplane',L:9.7,W:2.8,vmax:240,acc:120,turn:1.25,col:'#f3f1ea',trim:'#c8372d'};
WAKE.plane={life:4,w0:.45,band:0,arms:.32,foam:1,lw:2};
const PLK=1.9,ALT_PX=240,P_CRUISE=1000,P_ROT=520,P_TD=560;
const pZoom=()=>Math.min(innerWidth,innerHeight)<600?.55:.3;// how far the view pulls back at full height
function planeWater(x,y){const t=terr(x,y);if(t!==T.LAKE&&t!==T.DEEP&&t!==T.SHAL&&t!==T.ICE)return false;return wkey(x,y)!=='pool'&&!onPier(x,y)}
const PMESH={};
function planeMesh(run){const key=run?'r':'s';if(PMESH[key])return PMESH[key];const {add,dec,prism,box,cyl,finish}=meshKit();
  const WH='#f3f1ea',RD='#c8372d',DR='#9e2a22',GL='#2f4656',FL='#c3cacd',FLD='#98a2a7',BK='#24282b';
  // fuselage from stations [x, half-width, bottom z, top z, segment colour set]
  const ST=[[3.45,.42,2.05,2.75],[2.9,.62,1.85,2.9],[1.9,.68,1.7,2.95],[1.1,.7,1.6,3.3],[-.8,.7,1.6,3.3],[-2.6,.5,1.9,3.2],[-5,.22,2.5,3.05],[-6.1,.1,2.76,2.98]];
  const sec=([x,w,zb,zt])=>{const h=zt-zb;return[[x,-w*.6,zb],[x,w*.6,zb],[x,w,zb+h*.3],[x,w,zt-h*.3],[x,w*.6,zt],[x,-w*.6,zt],[x,-w,zt-h*.3],[x,-w,zb+h*.3]]};
  const segCol=(s,i)=>s<2?(i===0?DR:RD):s===2?(i>=3&&i<=5?GL:i===0?DR:i===1||i===7?RD:WH):(i===0?DR:i===1||i===7?RD:WH);
  for(let s=0;s<ST.length-1;s++){const A=sec(ST[s]),B=sec(ST[s+1]),I=[(ST[s][0]+ST[s+1][0])/2,0,(ST[s][2]+ST[s][3])/2];
    for(let i=0;i<8;i++){const j=(i+1)%8;add([A[i],A[j],B[j],B[i]],segCol(s,i),I)}}
  add(sec(ST[0]),RD,[3,0,2.4]);add(sec(ST[ST.length-1]),WH,[-5.5,0,2.9]);
  // cabin windows
  for(const sd of[-1,1]){const y=sd*.705;for(const [a,b] of[[.25,.95],[-.6,.1]])dec([[a,y,2.3],[b,y,2.3],[b,y,2.76],[a,y,2.76]],GL,[0,sd,0])}
  // spinner and propeller
  cyl(3.6,0,2.4,.2,.3,'x','#f3f1ea',null,10);
  if(!run){box(3.68,3.74,-.09,.09,1.25,3.55,BK);box(3.68,3.745,-.095,.095,1.25,1.5,'#f2c230');box(3.68,3.745,-.095,.095,3.3,3.55,'#f2c230')}
  // high wing with red tips, slight taper
  for(const sd of[-1,1]){const P=[[1.25,0],[1.25,sd*6.3],[-.7,sd*6.3],[-.7,0]].map(p=>[p[0],p[1]]);prism(sd>0?P:P.slice().reverse(),3.3,3.43,WH);
    const Q=[[1.22,sd*6.3],[1.1,sd*7.3],[-.6,sd*7.3],[-.7,sd*6.3]];prism(sd>0?Q:Q.slice().reverse(),3.3,3.43,RD)}
  // tail: stabiliser and fin
  for(const sd of[-1,1]){const P=[[-4.85,sd*.1],[-5.2,sd*2.3],[-5.95,sd*2.3],[-6.05,sd*.1]];prism(sd>0?P:P.slice().reverse(),2.92,3,WH);
    const Q=[[-5.2,sd*1.9],[-5.25,sd*2.35],[-5.95,sd*2.35],[-5.95,sd*1.9]];prism(sd>0?Q:Q.slice().reverse(),2.92,3.005,RD)}
  {const fin=[[-4.7,3.0],[-6.15,2.95],[-6.25,4.45],[-5.6,4.5]];for(const sd of[-1,1]){const q=fin.map(p=>[p[0],sd*.06,p[1]]);add(q,RD,[-5.5,-sd,3.6])}
    for(let i=0;i<4;i++){const a=fin[i],b=fin[(i+1)%4];add([[a[0],-.06,a[1]],[b[0],-.06,b[1]],[b[0],.06,b[1]],[a[0],.06,a[1]]],RD,[-5.5,0,3.6])}}
  // rods: struts as thin boxes along a segment
  const rod=(a,b,r,col)=>{const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],l=Math.hypot(...d),u=d.map(v=>v/l);let p=Math.abs(u[2])<.9?[0,0,1]:[1,0,0];
    let v1=[u[1]*p[2]-u[2]*p[1],u[2]*p[0]-u[0]*p[2],u[0]*p[1]-u[1]*p[0]];const l1=Math.hypot(...v1);v1=v1.map(v=>v/l1*r);const v2=[u[1]*v1[2]-u[2]*v1[1],u[2]*v1[0]-u[0]*v1[2],u[0]*v1[1]-u[1]*v1[0]];
    const C=[[1,1],[-1,1],[-1,-1],[1,-1]].map(([s,t])=>[v1[0]*s+v2[0]*t/r*r,v1[1]*s+v2[1]*t,v1[2]*s+v2[2]*t]),m=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
    for(let i=0;i<4;i++){const j=(i+1)%4;add([[a[0]+C[i][0],a[1]+C[i][1],a[2]+C[i][2]],[a[0]+C[j][0],a[1]+C[j][1],a[2]+C[j][2]],[b[0]+C[j][0],b[1]+C[j][1],b[2]+C[j][2]],[b[0]+C[i][0],b[1]+C[i][1],b[2]+C[i][2]]],col,m)}};
  for(const sd of[-1,1]){rod([.35,sd*.66,1.8],[.45,sd*3.3,3.3],.05,WH);
    // floats: long pointed pontoons with a darker deck
    const fy=sd*1.4,P=[];for(let i=0;i<=10;i++){const u=i/10,x=3.95-u*8.5,w=.38*Math.pow(Math.max(0,1-Math.pow(Math.max(0,(x-1.2)/2.75),2)),.5)*(x<-3.6?1-(-3.6-x)/1.4*.55:1);P.push([x,fy-Math.max(w,.03)])}
    for(let i=10;i>=0;i--){const p=P[i];P.push([p[0],2*fy-p[1]])}
    prism(P,-.12,.4,FL);prism(P.map(p=>[p[0]*.97,fy+(p[1]-fy)*.7]),.4,.44,FLD);
    rod([1.55,fy,.42],[1.45,sd*.5,1.66],.05,BK);rod([-.75,fy,.42],[-.7,sd*.5,1.62],.05,BK)}
  rod([1.55,-1.4,.5],[1.55,1.4,.5],.04,BK);rod([-.75,-1.4,.5],[-.75,1.4,.5],.04,BK);
  PMESH[key]=finish();return PMESH[key]}
// the mesh turned by bank (roll about x) and pitch (about y); cached in small steps
const PROLL=new Map();
function planeMeshAt(run,roll,pitch){const rq=Math.round(roll/.06),pq=Math.round(pitch/.05),key=(run?1:0)+':'+rq+':'+pq;let m=PROLL.get(key);if(m)return m;
  const base=planeMesh(run),r=rq*.06,p=pq*.05,cr=Math.cos(r),sr=Math.sin(r),cp=Math.cos(p),sp=Math.sin(p);
  const tf=v=>{const y=v[1]*cr-(v[2]-2.4)*sr,z=v[1]*sr+(v[2]-2.4)*cr;const x2=v[0]*cp-z*sp,z2=v[0]*sp+z*cp;return[x2,y,z2+2.4]};
  const tn=v=>{const y=v[1]*cr-v[2]*sr,z=v[1]*sr+v[2]*cr;return[v[0]*cp-z*sp,y,v[0]*sp+z*cp]};
  m=base.map(f=>({...f,pts:f.pts.map(tf),c:tf(f.c),n:tn(f.n)}));m.forEach((f,i)=>{if(base[i].parent)f.parent=m[base.indexOf(base[i].parent)]});
  if(PROLL.size>80)PROLL.clear();PROLL.set(key,m);return m}

// floatplane docks: beside each region's canoe landing on the right lake, on the side with the most open water
const PDOCK_LIST={east:[['Loon Lake landing','Loon Lake','canoe']],central:[['Kettle Lake landing','Kettle Lake','canoe']],west:[['Tamarack Lake landing','Tamarack Lake','canoe']],
  pacific:[['Lighthouse cove','Lighthouse Cove','kayak'],['Cloud Coast beach','the Cloud Coast','kayak']],britain:[['Loch Mhòr landing','Loch Mhòr','canoe'],['Grassmere','Grassmere Water','canoe']],caribbean:[['Lago Cerro','Lago Cerro','canoe'],['Lago Alto','Lago Alto','canoe'],['Laguna Verde','Laguna Verde','canoe']]}[MAP]||[];
const PDEST={britain:'nowhere: the British Isle is reached by airliner from Kingsport Airport',east:'Central · Caribbean',central:'East Coast · West Coast',west:'Central · Pacific',pacific:'West Coast',caribbean:'East Coast'}[MAP];
const PDOCKS=[];let PLANE=null;
function runClear(x,y,ang,a,b,step=50){const ca=Math.cos(ang),sa=Math.sin(ang);for(let s=a;s<=b;s+=step)if(!planeWater(x+ca*s,y+sa*s))return false;return true}
for(const PDOCK_AT of PDOCK_LIST){if(PLANE)break;const PCR=PDOCK_AT[2]||'canoe',Dk=WD.docks.find(q=>q[1]===PDOCK_AT[0]&&q[0]===PCR);let d=null;
  // which way the water is from the canoe landing (frozen or not)
  const Lc=LAUNCHES.find(l=>l.craft===PCR&&l.name===PDOCK_AT[0]);
  if(Dk&&Lc&&Math.hypot(Lc.x-Dk[2],Lc.y-Dk[3])>20){const v=[Lc.x-Dk[2],Lc.y-Dk[3]];d=Math.abs(v[0])>Math.abs(v[1])?[Math.sign(v[0]),0]:[0,Math.sign(v[1])]}
  else if(Dk){let bd=1e9;for(const q of[[1,0],[-1,0],[0,1],[0,-1]])for(let k=40;k<=500;k+=20)if(planeWater(Dk[2]+q[0]*k,Dk[3]+q[1]*k)){if(k<bd){bd=k;d=q}break}}
  if(Dk&&d){const n=[-d[1],d[0]],ang=Math.atan2(d[1],d[0]);
    let best=null;
    for(const s of[420,-420,560,-560,320,-320,700,-700,850,-850,1000,-1000]){const P0=[Dk[2]+n[0]*s-d[0]*160,Dk[3]+n[1]*s-d[1]*160];if(waterAt(P0[0],P0[1],true))continue;if(FERRIES.some(F=>Math.hypot(F.x-P0[0],F.y-P0[1])<1500))continue;
      let sh=-1;for(let k=0;k<1200;k+=10)if(planeWater(P0[0]+d[0]*k,P0[1]+d[1]*k)){sh=k;break}if(sh<0)continue;
      const sd=Math.sign(s),px=P0[0]+d[0]*(sh+120)+n[0]*sd*110,py=P0[1]+d[1]*(sh+120)+n[1]*sd*110;
      const ok=[[0,0],[110,0],[-110,0],[0,150],[0,-150],[60,120],[60,-120]].every(([a,b])=>planeWater(px+d[0]*a+n[0]*b,py+d[1]*a+n[1]*b));if(!ok)continue;
      let run=0;while(run<2400&&planeWater(px+d[0]*run,py+d[1]*run))run+=40;if(run<(MAP==='caribbean'?380:700))continue;
      const sc=run-Math.abs(s)*.4;if(!best||sc>best.sc)best={sc,P0,sh,px,py}}
    if(best){const {P0,sh,px,py}=best,ax=d[0]!==0,a0=sh-60,a1=sh+200,e0=[P0[0]+d[0]*a0,P0[1]+d[1]*a0],e1=[P0[0]+d[0]*a1,P0[1]+d[1]*a1],hw=16;
      PIERS.push(ax?{x0:Math.min(e0[0],e1[0]),x1:Math.max(e0[0],e1[0]),y0:P0[1]-hw,y1:P0[1]+hw,kind:'dock',name:'Floatplane dock'}:{x0:P0[0]-hw,x1:P0[0]+hw,y0:Math.min(e0[1],e1[1]),y1:Math.max(e0[1],e1[1]),kind:'dock',name:'Floatplane dock'});
      PDOCKS.push({x:(e0[0]+e1[0])/2,y:(e0[1]+e1[1])/2,name:'Floatplane dock',dest:PDEST,plane:true,lake:PDOCK_AT[1],land:[P0[0]+d[0]*(sh-120),P0[1]+d[1]*(sh-120)]});
      PLANE={craft:'plane',name:'Floatplane',x:px,y:py,ang,v:0,ph:0,alt:0,st:'water',bank:0,pitch:0,rpm:0,home:{x:px,y:py,ang}};BOATS.push(PLANE)}}}
if(!PLANE&&PDOCK_LIST.length){const Dk=WD.docks.find(q=>q[1]===PDOCK_LIST[0][0]);let best=null;
  if(Dk)for(let r=200;r<=1400;r+=40)for(let a=0;a<TAU;a+=40/r){const qx=Dk[2]+Math.cos(a)*r,qy=Dk[3]+Math.sin(a)*r;if(planeWater(qx,qy)||waterAt(qx,qy,true)||onPier(qx,qy))continue;if(FERRIES.some(F=>Math.hypot(F.x-qx,F.y-qy)<1500))continue;
    for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){let sh=-1;for(let k=10;k<=120;k+=10)if(planeWater(qx+dx*k,qy+dy*k)){sh=k;break}if(sh<0)continue;let ok=true;for(let k=sh;k<=sh+260;k+=20)if(!planeWater(qx+dx*k,qy+dy*k)){ok=false;break}if(!ok)continue;
      const px=qx+dx*(sh+150)-dy*100,py=qy+dy*(sh+150)+dx*100;if(![[0,0],[100,0],[-100,0],[0,120],[0,-120]].every(([u,v])=>planeWater(px+dx*u-dy*v,py+dy*u+dx*v)))continue;
      if(TRACKS.some(t=>t.pts.some((q,i)=>{const r2=t.pts[i+1];if(!r2)return false;const ux=r2[0]-q[0],uy=r2[1]-q[1],l=ux*ux+uy*uy||1,u=clamp(((px-q[0])*ux+(py-q[1])*uy)/l,0,1);return Math.hypot(q[0]+ux*u-px,q[1]+uy*u-py)<380})))continue;
      let run=0;for(let ang=0;ang<TAU;ang+=PI/8){let k=0;while(k<1500&&planeWater(px+Math.cos(ang)*k,py+Math.sin(ang)*k))k+=40;run=Math.max(run,k)}if(run<760)continue;
      const sc=run-r*.5;if(!best||sc>best.sc)best={sc,qx,qy,dx,dy,sh,px,py}}}
  if(best){const {qx,qy,dx,dy,sh,px,py}=best,a0=sh-60,a1=sh+220,e0=[qx+dx*a0,qy+dy*a0],e1=[qx+dx*a1,qy+dy*a1],hw=16;
    PIERS.push(dx?{x0:Math.min(e0[0],e1[0]),x1:Math.max(e0[0],e1[0]),y0:qy-hw,y1:qy+hw,kind:'dock',name:'Floatplane dock'}:{x0:qx-hw,x1:qx+hw,y0:Math.min(e0[1],e1[1]),y1:Math.max(e0[1],e1[1]),kind:'dock',name:'Floatplane dock'});
    PDOCKS.push({x:(e0[0]+e1[0])/2,y:(e0[1]+e1[1])/2,name:'Floatplane dock',dest:PDEST,plane:true,lake:PDOCK_LIST[0][1],land:[qx-dx*120,qy-dy*120]});
    PLANE={craft:'plane',name:'Floatplane',x:px,y:py,ang:Math.atan2(dy,dx),v:0,ph:0,alt:0,st:'water',bank:0,pitch:0,rpm:0,home:{x:px,y:py,ang:Math.atan2(dy,dx)}};BOATS.push(PLANE)}}
function pDockSign(PD){const [x,y]=PD.land;limb(x-12,y,x-12,y-36,'#5a3e26',3.2);limb(x+12,y,x+12,y-36,'#5a3e26',3.2);
  ctx.fillStyle='#b8322a';ctx.fillRect(x-24,y-56,48,24);ctx.fillStyle='#f6efe0';ctx.textAlign='center';ctx.font='700 6.4px Fredoka,system-ui';ctx.fillText('FLOATPLANE',x,y-46);ctx.font='600 5.2px Fredoka,system-ui';ctx.fillText('to the '+PDEST.split(' · ')[0],x,y-38)}

// drawing: shadow on the ground, the plane lifted by its height, a spinning propeller disc
function drawPlane(B,t){const alt=B.alt||0,ap=alt*ALT_PX,k=PLK*(1+.22*alt),bob=alt>0?0:Math.sin(t*1.7+B.x*.01)*.8,run=B.rpm>.05;
  const ca=Math.cos(B.ang),sa=Math.sin(B.ang),sx=B.x+ap*.32,sy=B.y+ap*.1;
  // shadow: a flat cross of wing, fuselage and tail
  ctx.save();ctx.translate(sx,sy);ctx.scale(1,KD);ctx.rotate(B.ang);ctx.fillStyle=`rgba(10,25,30,${(alt>0?.2*(1-alt*.35):.22).toFixed(3)})`;const m=M*PLK,sk=Math.cos(B.bank||0);
  ctx.beginPath();ctx.rect(-.7*m,-7.3*m*sk,1.95*m,14.6*m*sk);ctx.rect(-6.1*m,-.6*m,9.6*m,1.2*m);ctx.rect(-6*m,-2.3*m*sk,1.15*m,4.6*m*sk);if(alt<.05){ctx.rect(-4.5*m,-1.8*m,8.4*m,.8*m);ctx.rect(-4.5*m,1*m,8.4*m,.8*m)}ctx.fill();ctx.restore();
  if(alt<.05&&Math.abs(B.v)>40){const a=clamp(Math.abs(B.v)/400,0,1);for(const s of[-1,1]){const fx=B.x+ca*3.9*M*PLK-sa*s*1.4*M*PLK,fy=B.y+(sa*3.9*M*PLK+ca*s*1.4*M*PLK)*KD;ctx.fillStyle=`rgba(255,255,255,${(.5*a).toFixed(2)})`;ctx.beginPath();ctx.ellipse(fx,fy,6+a*8,3+a*3,B.ang,0,TAU);ctx.fill()}}
  const o={x:B.x,y:B.y-ap+bob,ang:B.ang};drawMeshMap(o,planeMeshAt(run,-(B.bank||0),B.pitch||0),k);
  if(run){const w=carLocalToWorld(o,[3.72,0,2.4],k),px=w[0],py=o.y+(w[1]-o.y)*KD-w[2]*HS,R=1.25*M*k*.42;
    ctx.save();ctx.translate(px,py);ctx.rotate(B.ang+PI/2);ctx.scale(1,Math.max(.25,Math.abs(sa)*.9+.12));ctx.fillStyle='rgba(40,44,48,.18)';ctx.beginPath();ctx.arc(0,0,R*2.6,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(30,32,34,.35)';ctx.lineWidth=2;const a=t*60;ctx.beginPath();ctx.moveTo(Math.cos(a)*R*2.6,Math.sin(a)*R*2.6);ctx.lineTo(-Math.cos(a)*R*2.6,-Math.sin(a)*R*2.6);ctx.stroke();
    ctx.strokeStyle='rgba(242,194,48,.5)';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,R*2.5,0,TAU);ctx.stroke();ctx.restore()}}
// where a landing would touch down: a soft marker on the water
function drawTouchdown(B,t){const p=landSpotAhead(B);if(!p)return;const a=.45+.25*Math.sin(t*5);ctx.save();ctx.translate(p[0],p[1]);ctx.scale(1,KD);ctx.rotate(B.ang);
  ctx.strokeStyle=`rgba(255,255,255,${a.toFixed(2)})`;ctx.lineWidth=4;ctx.setLineDash([16,14]);ctx.beginPath();ctx.ellipse(40,0,130,52,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=`rgba(255,255,255,${a.toFixed(2)})`;for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(-50,s*30);ctx.lineTo(10,s*30);ctx.lineTo(-20,s*46);ctx.fill()}ctx.restore()}
// touchdown point and a check that the water there and beyond is long enough to stop in
function landSpotAhead(B){if(B.st!=='air'||B.alt<.6)return null;const ca=Math.cos(B.ang),sa=Math.sin(B.ang),D=P_TD;
  if(!runClear(B.x,B.y,B.ang,D-40,D+380,40))return null;for(const s of[-1,1])if(!planeWater(B.x+ca*(D+150)-sa*s*110,B.y+sa*(D+150)+ca*s*110))return null;return[B.x+ca*D,B.y+sa*D]}

// which edges lead on to another region
function planeEdge(x){const to=MAP==='east'?(x<260?'central':x>WW-260?'caribbean':null):MAP==='britain'?null:MAP==='central'?(x<260?'west':x>WW-260?'east':null):MAP==='west'?(x>WW-260?'central':x<260?'pacific':null):
  MAP==='pacific'?(x>WW-260?'west':null):MAP==='caribbean'?(x<260?'east':null):null;return to&&!storyOpen(to)?'locked:'+to:to}
const RNAME={britain:'British Isle',east:'East Coast',central:'Central',west:'West Coast',pacific:'Pacific Isles',caribbean:'Caribbean Isle'};
function planeUse(){const B=S.boat;if(!B)return null;
  if(B.st==='water'){if(Math.abs(B.v)<90&&shoreSpot(B))return'pout';return runClear(B.x,B.y,B.ang,60,720)?'takeoff':null}
  if(B.st==='air')return landSpotAhead(B)?'pland':null;return null}
const PLBL={takeoff:'Take off',pland:'Land',pout:'Get out'};
function boardPlane(B){S.mode='plane';S.boat=B;B.v=0;B.st='water';B.alt=0;S.touchSneak=false;SFX.plane(true,.2,0);
  toast('In the floatplane. Taxi out on the lake, then press '+(GPS.linked&&GPS.mode==='console'?'B':'Use')+' to take off when the water ahead is clear.',3.4)}
function planeOut(){const B=S.boat,sp=shoreSpot(B);if(!sp)return;B.v=0;B.rpm=0;SFX.plane(false,0,0);S.mode='walk';S.player.x=sp[0];S.player.y=sp[1];S.player.vx=S.player.vy=0;S.player.face=Math.atan2(sp[1]-B.y,sp[0]-B.x);S.boat=null;SFX.click()}
function planeTakeoff(){const B=S.boat;B.st='takeoff';toast('Full throttle…',1.4)}
function planeLand(){const B=S.boat;B.st='landing';toast('Setting down on the water.',1.4)}
function planeCross(to){const B=S.boat;goMap(to,'plane:'+Math.round(B.y)+':'+B.ang.toFixed(3))}
function updatePlane(dt){const B=S.boat;if(S.mode!=='plane'||!B){if(PLANE&&PLANE.rpm>0)PLANE.rpm=Math.max(0,PLANE.rpm-dt);SFX.plane(false,0,0);VZ+=((DEV.obs?DEV.vz:1)-VZ)*Math.min(1,dt*2);return}
  const inp=getInput(),steer=!S.bino.on&&inp.m>0,ca=()=>Math.cos(B.ang),sa=()=>Math.sin(B.ang);let turn=0;
  if(B.st==='water'){const K=BOATK.plane;
    if(steer){const want=Math.atan2(inp.y,inp.x),d=angDiff(B.ang,want);turn=clamp(d*1.4,-1,1)*K.turn*clamp(.45+Math.abs(B.v)/K.vmax,.45,1.1);B.ang+=turn*dt;
      const tv=K.vmax*inp.m*clamp(1.2-Math.abs(d)/1.6,.15,1);B.v+=(tv>B.v?K.acc:-K.acc*1.4)*dt}
    else{B.v*=Math.pow(.45,dt);if(Math.abs(B.v)<3)B.v=0}
    const nx=B.x+ca()*B.v*dt,ny=B.y+sa()*B.v*dt,bow=4*M*PLK;
    if(planeWater(nx+ca()*bow,ny+sa()*bow)&&planeWater(nx,ny)){B.x=nx;B.y=ny}else{if(Math.abs(B.v)>40&&!S.boatTold){S.boatTold=true;setTimeout(()=>S.boatTold=false,2500);toast(GPS.linked&&GPS.mode==='console'?'Shore ahead. Press B to get out.':'Shore ahead. Press Use to get out.',1.8)}B.v*=-.2}
    B.rpm+=(.22+.5*Math.abs(B.v)/K.vmax-B.rpm)*Math.min(1,dt*2);B.pitch+=(0-B.pitch)*Math.min(1,dt*3)}
  else if(B.st==='takeoff'){B.v=Math.min(P_CRUISE,B.v+(B.v<P_ROT?280:340)*dt);if(steer){const d=angDiff(B.ang,Math.atan2(inp.y,inp.x));turn=clamp(d,-1,1)*.35;B.ang+=turn*dt}
    if(B.alt<=0&&!runClear(B.x,B.y,B.ang,40,4*M*PLK+60,30)){B.st='water';B.v=0;toast('Not enough open water. Line up with a longer stretch.',2.4)}
    if(B.v>=P_ROT){B.alt=Math.min(1,B.alt+dt*.42);B.pitch+=(.12-B.pitch)*Math.min(1,dt*3)}if(B.alt>=.4)B.st='air';B.rpm+=(1-B.rpm)*Math.min(1,dt*3)}
  else if(B.st==='air'){B.v+=(P_CRUISE-B.v)*Math.min(1,dt*.8);B.alt=Math.min(1,B.alt+dt*.35);
    if(steer){const want=Math.atan2(inp.y,inp.x),d=angDiff(B.ang,want);turn=clamp(d*2.2,-1,1)*1.15;B.ang+=turn*dt}
    B.pitch+=((B.alt<1?.08:0)-B.pitch)*Math.min(1,dt*2);B.rpm+=(.85-B.rpm)*Math.min(1,dt*2);
    // edges: on to the next region, or turn back
    const nx=B.x+ca()*B.v*dt,ny=B.y+sa()*B.v*dt,to=planeEdge(nx);
    if(S.edgeAsk&&$('noteBack').hidden&&B.x>900&&B.x<WW-900)S.edgeAsk=false;
    if(to&&to.startsWith('locked:')&&!S.edgeAsk){S.edgeAsk=true;const k=to.slice(7);B.ang+=PI;B.x=clamp(B.x,700,WW-700);toast(`The ${RNAME[k]} isn't open yet in Story mode. Turning back.`,2.6);setTimeout(()=>S.edgeAsk=false,1500);return}
    if(to&&!S.edgeAsk){S.edgeAsk=true;const dir=nx<WW/2?'west':'east';
      openNote('Floatplane',`Fly on to the ${RNAME[to]}?`,`Keep flying ${dir} and you come out over the ${RNAME[to]} at the same latitude. Your journal, photos and gear come with you; your Defender will be waiting by the floatplane dock there.`,
        [['Turn back',()=>{B.ang+=PI;B.x=clamp(B.x,700,WW-700);S.edgeAsk=false},true],[`Fly on to the ${RNAME[to]}`,()=>planeCross(to)]]);return}
    if(nx<300||nx>WW-300||ny<300||ny>WH-300){const want=Math.atan2(WH/2-B.y,WW/2-B.x);B.ang+=clamp(angDiff(B.ang,want),-1,1)*1.6*dt;if(!S.boatTold){S.boatTold=true;setTimeout(()=>S.boatTold=false,4000);toast('Nothing but '+(ISLE?'ocean':'open country and sea')+' out there. Turning back.',2)}}}
  else if(B.st==='landing'){B.v+=(520-B.v)*Math.min(1,dt*3.5);B.alt=Math.max(0,B.alt-dt/.8);B.pitch+=(-.04-B.pitch)*Math.min(1,dt*3);B.rpm+=(.4-B.rpm)*Math.min(1,dt*2);
    if(B.alt<=0){if(planeWater(B.x,B.y)){B.st='roll';SFX.paddle(1.4);for(let i=0;i<6;i++)addPrint(B.x+(Math.random()-.5)*120,B.y+(Math.random()-.5)*60,B.ang,'water')}else{B.st='air';B.alt=.05;toast('Missed the water. Climbing out.',2)}}}
  else if(B.st==='roll'){B.v=Math.max(0,B.v-430*dt);B.rpm+=(.25-B.rpm)*Math.min(1,dt*2);B.pitch+=(0-B.pitch)*Math.min(1,dt*3);
    if(!planeWater(B.x+ca()*4*M*PLK,B.y+sa()*4*M*PLK)){B.v=0;B.st='water'}if(B.v<=220)B.st='water'}
  if(B.st!=='water'&&B.st!=='air'){B.x+=ca()*B.v*dt;B.y+=sa()*B.v*dt}else if(B.st==='air'){B.x+=ca()*B.v*dt;B.y+=sa()*B.v*dt;B.x=clamp(B.x,150,WW-150);B.y=clamp(B.y,150,WH-150)}
  B.bank+=((B.alt>.1?clamp(turn*.55,-.6,.6):clamp(turn*.08,-.08,.08))-B.bank)*Math.min(1,dt*3);
  if(B.alt<.02&&Math.abs(B.v)>12)pushWake(B);
  B.ph+=dt*B.rpm*40;SFX.plane(true,B.rpm,clamp(B.alt*B.v/P_CRUISE,0,1));
  VZ+=((1-pZoom()*B.alt)-VZ)*Math.min(1,dt*1.5);
  const p=S.player;p.x=B.x;p.y=B.y;p.face=B.ang;p.moving=false;p.water=null}
// arriving by air from the next region: in the air over the edge you flew in from, heading inward
function planeArrive(code){if(!PLANE)return false;const [,y,a]=code.split(':'),ang=+a,B=PLANE;B.y=clamp(+y,1500,WH-1500);B.x=Math.cos(ang)<0?WW-700:700;B.ang=ang;B.st='air';B.alt=1;B.v=P_CRUISE;B.rpm=.85;
  S.mode='plane';S.boat=B;VZ=1-pZoom();Object.assign(S.player,{x:B.x,y:B.y,vx:0,vy:0});const PD=PDOCKS[0],cs=carSpot(PD.land[0],PD.land[1]);if(cs){S.car.x=cs[0];S.car.y=cs[1];S.car.v=0}
  S.backAt=null;S.arrived=MAP_NAME;S.arrivedFrom='plane';return true}
function planeWelcome(){const PD=PDOCKS[0];return`You fly in over the ${MAP_NAME}. Find open water, line up and press ${GPS.linked&&GPS.mode==='console'?'B':'Use'} to land. Your Defender is parked by the floatplane dock on ${PD?PD.lake:'the lake'}.`}
function planeBubble(u,t){const B=S.boat,gp=GPS.linked&&GPS.mode==='console',nm=PLBL[u],col='#ffc93c';if(u==='pland')drawTouchdown(B,t);
  const x=B.x,y=B.y-(B.alt||0)*ALT_PX-60;if(gp)bBubble(x,y,nm,col,t);else namePill(x,y,nm+' · E',col)}

const CARC={body:'#33503f',bodyHi:'#3d5d49',roof:'#ecebe3',trim:'#1d1f1f',tire:'#1b1c1c',steel:'#ecebe4',glass:'#283844',glassHi:'#6f8a99',chrome:'#c9ccc8',lamp:'#fff4c8',red:'#c23b2e',amber:'#e89a2c',plate:'#aeb2b1'};
const PAINTS={coniston:{name:'Coniston green',body:'#33503f',hi:'#3d5d49'},sand:{name:'Safari sand',body:'#b5a079',hi:'#c2ae88'},white:{name:'Alpine white',body:'#e2e1d8',hi:'#ebeae2'},blue:{name:'Arles blue',body:'#3b586f',hi:'#45647c'},red:{name:'Masai red',body:'#76302a',hi:'#853931'}};
const SUN=(()=>{const v=[-.35,-.5,.8],l=Math.hypot(...v);return v.map(x=>x/l)})();
function meshKit(){const F=[];
  const cen=pts=>pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length,a[2]+p[2]/pts.length],[0,0,0]);
  const add=(pts,col,inside,o={})=>{// orient each face outward using a point inside the solid
    const c=cen(pts);let n=[0,0,0];
    for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1])}
    const l=Math.hypot(...n)||1;n=n.map(x=>x/l);
    if(inside&&(n[0]*(c[0]-inside[0])+n[1]*(c[1]-inside[1])+n[2]*(c[2]-inside[2]))<0)n=n.map(x=>-x);
    F.push({pts,col,n,c,flat:o.flat,grp:o.grp});return F[F.length-1]};
  const dec=(pts,col,n,o={})=>{F.push({pts,col,n,c:cen(pts),dec:true,flat:o.flat})};
  // plan outline with cut corners: [x0,x1,y0,y1] and corner cuts (front, rear)
  const plan=(x0,x1,y0,y1,cf,cr)=>[[x1-cf,y0],[x1,y0+cf],[x1,y1-cf],[x1-cf,y1],[x0+cr,y1],[x0,y1-cr],[x0,y0+cr],[x0+cr,y0]];
  // rounded-corner outline: radius rf on the front corners, rr at the rear, SEG points per corner, counter-clockwise from the front-left
  const SEG=4,planR=(x0,x1,y0,y1,rf,rr)=>{const P=[],arc=(cx,cy,r,a0)=>{for(let i=0;i<=SEG;i++){const a=a0+i/SEG*PI/2;P.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}};
    arc(x1-rf,y0+rf,rf,-PI/2);arc(x1-rf,y1-rf,rf,0);arc(x0+rr,y1-rr,rr,PI/2);arc(x0+rr,y0+rr,rr,PI);return P};
  // loft: join two outlines (same vertex count) at z0 and z1, optional cap on top
  const loft=(A,z0,B,z1,col,inside,o={})=>{const n=A.length;for(let i=0;i<n;i++){const j=(i+1)%n;add([[A[i][0],A[i][1],z0],[A[j][0],A[j][1],z0],[B[j][0],B[j][1],z1],[B[i][0],B[i][1],z1]],(o.cols&&o.cols[i])||col,inside,o)}
    if(o.cap)add(B.map(p=>[p[0],p[1],z1]),o.capCol||col,inside,o)};
  const prism=(P,z0,z1,col,o={})=>{const I=[...cen(P.map(p=>[p[0],p[1],0])).slice(0,2),(z0+z1)/2];loft(P,z0,P,z1,col,I,{...o,cap:true})};
  const box=(x0,x1,y0,y1,z0,z1,col,o={})=>prism([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],z0,z1,col,o);
  const ring=(cx,cy,cz,r,axis,n=18)=>{const p=[];for(let i=0;i<n;i++){const a=i/n*TAU,u=Math.cos(a)*r,v=Math.sin(a)*r;p.push(axis==='y'?[cx+u,cy,cz+v]:axis==='x'?[cx,cy+u,cz+v]:[cx+u,cy+v,cz])}return p};
  const cyl=(cx,cy,cz,r,len,axis,col,inside,N=16,grp='w')=>{const d=axis==='y'?[0,len/2,0]:axis==='x'?[len/2,0,0]:[0,0,len/2];
    const a=ring(cx-d[0],cy-d[1],cz-d[2],r,axis,N),b=ring(cx+d[0],cy+d[1],cz+d[2],r,axis,N),I=inside||[cx,cy,cz];
    for(let k=0;k<N;k++){const k2=(k+1)%N;add([a[k],a[k2],b[k2],b[k]],col===CARC.tire&&k%2?'#2b2c2c':col,I,{grp})}add(a,col,I,{grp});add(b,col,I,{grp})};
  // parent each decal to the face it sits on, so it sorts with that face
  const finish=()=>{const faces=F.filter(f=>!f.dec);F.forEach((f,i)=>{f.ord=i;if(!f.dec)return;
    const bb=g=>{const xs=g.pts.map(p=>p[0]),ys=g.pts.map(p=>p[1]),zs=g.pts.map(p=>p[2]);return[Math.min(...xs)-.06,Math.max(...xs)+.06,Math.min(...ys)-.06,Math.max(...ys)+.06,Math.min(...zs)-.06,Math.max(...zs)+.06]};
    f.parent=faces.find(g=>{if(g.n[0]*f.n[0]+g.n[1]*f.n[1]+g.n[2]*f.n[2]<.85)return false;const d=g.n[0]*(f.c[0]-g.c[0])+g.n[1]*(f.c[1]-g.c[1])+g.n[2]*(f.c[2]-g.c[2]);if(Math.abs(d)>.03)return false;const b=bb(g);return f.c[0]>=b[0]&&f.c[0]<=b[1]&&f.c[1]>=b[2]&&f.c[1]<=b[3]&&f.c[2]>=b[4]&&f.c[2]<=b[5]})||null});return F};
  return{F,add,dec,plan,planR,loft,prism,box,ring,cyl,finish,cen}}
const CARMESH=(()=>{const {F,add,dec,plan,planR,loft,prism,box,ring,cyl,finish}=meshKit();
  const XR=-1.83,XF=1.89,YW=.895,ZB=.54,ZBELT=1.15,FA=1.12,RA=-1.24,TR=.45,ARCH=.57,zR=1.94;
  // ---- wheels: tyre, white steel wheel, hub, nuts ----
  for(const ax of[FA,RA])for(const s of[-1,1]){const yo=s*.905;cyl(ax,s*.745,TR,TR,.32,'y',CARC.tire,[ax,s*.745,TR],22);
    const nn=[0,s,0];dec(ring(ax,yo+s*.003,TR,.29,'y',18),CARC.steel,nn);dec(ring(ax,yo+s*.006,TR,.22,'y',16),'#d6d5cd',nn);dec(ring(ax,yo+s*.009,TR,.08,'y',10),CARC.trim,nn);
    for(let k=0;k<5;k++){const a=k/5*TAU+.3;dec(ring(ax+Math.cos(a)*.15,yo+s*.008,TR+Math.sin(a)*.15,.027,'y',6),'#b9b8b0',nn)}}
  // ---- chassis rails, axles and diffs, seen under the body ----
  box(-1.6,1.75,-.46,.46,.34,ZB+.01,'#191a1a');
  for(const ax of[FA,RA]){cyl(ax,0,TR,.07,1.3,'y','#202222',[ax,0,TR],8);prism(planR(ax-.17,ax+.17,-.24+(ax>0?.08:-.08),.12+(ax>0?.08:-.08),.08,.08),TR-.16,TR+.13,'#252727')}
  // ---- lower tub: corners cut, real wheel-arch openings on the sides ----
  const cF=.1,cR=.16,I0=[0,0,.85],pl=planR(XR,XF,-YW,YW,cF,cR);
  const prof=[[XR+cR,ZB]],arch=ax=>{const a0=PI-Math.asin((ZB-TR)/ARCH),a1=Math.asin((ZB-TR)/ARCH);prof.push([ax-Math.cos(a1)*ARCH,ZB]);for(let i=0;i<=14;i++){const a=a0-(a0-a1)*i/14;prof.push([ax+Math.cos(a)*ARCH,TR+Math.sin(a)*ARCH])}};
  arch(RA);arch(FA);prof.push([XF-cF,ZB],[XF-cF,ZBELT-.05],[XF-cF-.04,ZBELT],[XR+cR+.04,ZBELT],[XR+cR,ZBELT-.05]);
  for(const s of[-1,1])add(prof.map(p=>[p[0],s*YW,p[1]]),CARC.body,I0);
  // every outline edge except the two long sides becomes a vertical face (front, rear, rounded corners)
  for(let i=0;i<pl.length;i++){const a=pl[i],b=pl[(i+1)%pl.length];if(Math.abs(a[1])>YW-.001&&Math.abs(b[1])>YW-.001)continue;add([[a[0],a[1],ZB],[b[0],b[1],ZB],[b[0],b[1],ZBELT-.05],[a[0],a[1],ZBELT-.05]],CARC.body,I0)}
  const pl2=planR(XR+.04,XF-.04,-YW+.04,YW-.04,cF-.02,cR-.02);loft(pl,ZBELT-.05,pl2,ZBELT,CARC.body,I0,{cap:true});
  // door hinges (outside, as on the real thing), waist capping
  for(const s of[-1,1]){const n=[0,s,0];for(const z of[.72,1.0])dec([[.5,s*(YW+.002),z],[.6,s*(YW+.002),z],[.6,s*(YW+.002),z+.06],[.5,s*(YW+.002),z+.06]],CARC.trim,n);
    dec([[XR+cR,s*(YW+.002),ZBELT-.09],[XF-cF,s*(YW+.002),ZBELT-.09],[XF-cF,s*(YW+.002),ZBELT-.06],[XR+cR,s*(YW+.002),ZBELT-.06]],'rgba(0,0,0,.18)',n)}
  // black arch flares
  for(const ax of[FA,RA])for(const s of[-1,1]){const N=12,a0=PI-Math.asin((ZB-TR)/ARCH)+.04,a1=Math.asin((ZB-TR)/ARCH)-.04,yo=s*(YW+.05),yi=s*YW,Ro=ARCH+.1;
    const P=(ang,R,y)=>[ax+Math.cos(ang)*R,y,TR+Math.sin(ang)*R];
    for(let k=0;k<N;k++){const a=a0+(a1-a0)*k/N,b=a0+(a1-a0)*(k+1)/N;add([P(a,ARCH,yo),P(b,ARCH,yo),P(b,Ro,yo),P(a,Ro,yo)],CARC.trim,[ax,0,TR],{grp:'f'});add([P(a,Ro,yi),P(b,Ro,yi),P(b,Ro,yo),P(a,Ro,yo)],CARC.trim,[ax,s*.5,TR],{grp:'f'})}}
  // ---- front: flat-topped wings with rounded edges, raised bonnet ----
  for(const s of[-1,1]){const y0=s>0?.58:-YW,y1=s>0?YW:-.58,P=[[.6,y0],[XF-.02,y0],[XF-.02,y1],[.6,y1]],Pt=[[.62,y0+(s<0?.04:0)],[XF-.06,y0+(s<0?.04:0)],[XF-.06,y1-(s>0?.04:0)],[.62,y1-(s>0?.04:0)]];
    loft(P,ZBELT,P,1.19,CARC.body,[1.2,s*.74,1.17]);loft(P,1.19,Pt,1.22,CARC.body,[1.2,s*.74,1.17],{cap:true});
    dec([[.66,s*.64,1.221],[1.12,s*.64,1.221],[1.12,s*.84,1.221],[.66,s*.84,1.221]],CARC.plate,[0,0,1])}
  {const P=[[.6,-.58],[XF-.05,-.58],[XF-.05,.58],[.6,.58]],Pt=[[.64,-.5],[XF-.12,-.5],[XF-.12,.5],[.64,.5]];
    loft(P,ZBELT,P,1.21,CARC.bodyHi,[1.2,0,1.18]);loft(P,1.21,Pt,1.26,CARC.bodyHi,[1.2,0,1.18],{cap:true})}
  // grille, lamps in black surrounds, indicators
  const nf=[1,0,0];dec([[XF+.001,-.5,.66],[XF+.001,.5,.66],[XF+.001,.5,1.08],[XF+.001,-.5,1.08]],'#232525',nf);
  for(let k=0;k<5;k++)dec([[XF+.002,-.46,.71+k*.075],[XF+.002,.46,.71+k*.075],[XF+.002,.46,.74+k*.075],[XF+.002,-.46,.74+k*.075]],'#3a3d3d',nf);
  for(const s of[-1,1]){dec(ring(XF+.002,s*.68,.94,.12,'x',16),CARC.trim,nf);dec(ring(XF+.003,s*.68,.94,.09,'x',16),CARC.lamp,nf);dec(ring(XF+.004,s*.68,.94,.045,'x',10),'#ffffff',nf);
    dec([[XF+.002,s*.6,.7],[XF+.002,s*.78,.7],[XF+.002,s*.78,.78],[XF+.002,s*.6,.78]],CARC.amber,nf)}
  // ---- cabin: raked screen, tumblehome sides, rounded rear corners ----
  const cb=planR(XR,.6,-.87,.87,.05,.16),cm=planR(XR+.025,.5,-.81,.81,.06,.17),ct=planR(XR+.05,.44,-.77,.77,.07,.19),IC=[-.6,0,1.55];
  loft(cb,ZBELT,cm,zR-.05,CARC.body,IC);loft(cm,zR-.05,ct,zR,CARC.body,IC);
  const r1=planR(XR+.06,.45,-.79,.79,.08,.2),r2=planR(XR+.1,.41,-.74,.74,.1,.22),r3=planR(XR+.18,.33,-.66,.66,.12,.24);
  loft(ct,zR,r1,zR+.03,CARC.roof,IC);loft(r1,zR+.03,r2,zR+.07,CARC.roof,IC);loft(r2,zR+.07,r3,zR+.09,CARC.roof,IC,{cap:true});
  for(const s of[-1,1])for(const z of[1.42,1.72])dec([[.47,s*.79,z],[.52,s*.79,z],[.52,s*.79,z+.06],[.47,s*.79,z+.06]],CARC.trim,[0,s,0]);
  const sideY=z=>.87-.07*(z-ZBELT)/(zR-ZBELT),scrX=z=>.6-.12*(z-ZBELT)/(zR-ZBELT),rearX=z=>XR+.03*(z-ZBELT)/(zR-ZBELT);
  const glass=(pts,n)=>{dec(pts,CARC.glass,n);const p2=[pts[0],pts[1],pts[1].map((v,i)=>lerp(v,pts[2][i],.45)),pts[0].map((v,i)=>lerp(v,pts[3][i],.22))];dec(p2,'rgba(160,190,205,.16)',n)};
  {const n=(()=>{const a=[-.12,0,zR-ZBELT],l=Math.hypot(...a);return[a[2]/l,0,-a[0]/l]})();const W=(y,z)=>[scrX(z)+.004,y,z];
    glass([W(-.68,1.3),W(.68,1.3),W(.64,1.87),W(-.64,1.87)],n);dec([W(-.02,1.3),W(.02,1.3),W(.02,1.87),W(-.02,1.87)],CARC.body,n)}
  for(const s of[-1,1]){const n=(()=>{const l=Math.hypot(zR-ZBELT,.07);return[0,s*(zR-ZBELT)/l,.07/l]})(),Wp=(x,z)=>[x,s*(sideY(z)+.003),z];
    glass([Wp(.0,1.33),Wp(.5,1.33),Wp(.42,1.86),Wp(.0,1.86)],n);
    glass([Wp(-1.52,1.33),Wp(-.18,1.33),Wp(-.18,1.86),Wp(-1.52,1.86)],n);
    dec([Wp(-1.46,1.885),Wp(-.34,1.885),Wp(-.34,1.92),Wp(-1.46,1.92)],CARC.glassHi,n);
    dec([Wp(.33,1.2),Wp(.45,1.2),Wp(.45,1.23),Wp(.33,1.23)],CARC.chrome,n)}
  for(const s of[-1,1]){const n=[0,s,0];dec([[-.08,s*(YW+.001),.58],[-.06,s*(YW+.001),.58],[-.06,s*(YW+.001),1.08],[-.08,s*(YW+.001),1.08]],'rgba(0,0,0,.3)',n);
    dec([[XR+.16,s*(YW+.001),.64],[XR+.26,s*(YW+.001),.64],[XR+.26,s*(YW+.001),.94],[XR+.16,s*(YW+.001),.94]],'rgba(0,0,0,.18)',n)}
  // rear: window, lamps, spare wheel on the door, step
  {const n=[-1,0,0];glass([[rearX(1.45)-.003,-.5,1.45],[rearX(1.45)-.003,.5,1.45],[rearX(1.86)-.003,.5,1.86],[rearX(1.86)-.003,-.5,1.86]],n);
    for(const s of[-1,1]){dec([[XR-.002,s*.62,.66],[XR-.002,s*.76,.66],[XR-.002,s*.76,.8],[XR-.002,s*.62,.8]],CARC.red,n);dec([[XR-.002,s*.62,.81],[XR-.002,s*.76,.81],[XR-.002,s*.76,.92],[XR-.002,s*.62,.92]],CARC.amber,n)}
    cyl(XR-.13,0,1.05,.38,.24,'x',CARC.tire,[XR-.13,0,1.05]);dec(ring(XR-.252,0,1.05,.25,'x',16),CARC.steel,n);dec(ring(XR-.255,0,1.05,.07,'x',10),CARC.trim,n)}
  // bumpers with rounded ends, nudge bar, side steps
  prism(plan(XF,XF+.16,-.92,.92,.06,0),.38,.6,CARC.trim);prism(plan(XR-.14,XR,-.84,.84,0,.06),.4,.6,CARC.trim);
  for(const s of[-1,1]){box(XF+.2,XF+.25,s*.38-.025,s*.38+.025,.45,1.02,CARC.trim);box(XF+.16,XF+.25,s*.38-.03,s*.38+.03,.46,.52,CARC.trim)}
  box(XF+.2,XF+.25,-.42,.42,.97,1.02,CARC.trim);box(XF+.2,XF+.25,-.42,.42,.62,.66,CARC.trim);
  for(const s of[-1,1])box(-.6,.55,s*.9,s*1.0,.44,.5,CARC.trim);
  // mirrors and snorkel
  for(const s of[-1,1]){box(.44,.5,s*.86,s*1.0,1.5,1.53,CARC.trim);prism(plan(.42,.5,s<0?-1.08:.98,s<0?-.98:1.08,.02,.02),1.45,1.64,CARC.trim)}
  box(.62,1.25,.9,.98,1.07,1.15,CARC.trim);prism(plan(.5,.6,.86,.96,.03,.03),1.07,2.0,CARC.trim);prism(plan(.46,.7,.84,.98,.05,.03),2.0,2.1,CARC.trim);
  // V5: low black roof rack with a light load (two jerry cans, a duffel bag, a storage case)
  const zr=zR+.13,RK='#161818';
  for(const s of[-1,1]){box(-1.78,.36,s*.74-.025,s*.74+.025,zr,zr+.04,RK);for(const x of[-1.7,-.68,.3])box(x,x+.05,s*.74-.025,s*.74+.025,zR+.07,zr,RK)}
  box(-1.8,-1.76,-.74,.74,zr,zr+.04,RK);box(.34,.38,-.74,.74,zr,zr+.04,RK);
  for(const x of[-1.4,-1.0,-.6,-.2,.15])box(x,x+.035,-.72,.72,zr+.005,zr+.03,RK);
  // storage case at the back
  prism(planR(-1.66,-1.08,-.5,.42,.04,.04),zr+.03,zr+.24,'#2b2f2c');box(-1.66,-1.08,-.5,.42,zr+.24,zr+.255,'#3a3f3b');
  for(const y of[-.36,.24])dec([[-1.08+.001,y,zr+.12],[-1.08+.001,y+.1,zr+.12],[-1.08+.001,y+.1,zr+.16],[-1.08+.001,y,zr+.16]],'#8f948f',[1,0,0]);
  // olive duffel bag, lying across the middle
  cyl(-.62,-.08,zr+.13,.11,.86,'y','#5c6b42',[-.62,-.08,zr+.13],10,'d');dec([[-.66,-.44,zr+.241],[-.58,-.44,zr+.241],[-.58,.28,zr+.241],[-.66,.28,zr+.241]],'#46522f',[0,0,1]);
  // two jerry cans on their sides near the front, strapped down
  for(const y of[-.56,-.22]){box(-.22,.22,y,y+.3,zr+.03,zr+.17,'#7a8a4a');dec([[.22+.001,y+.06,zr+.06],[.22+.001,y+.24,zr+.06],[.22+.001,y+.24,zr+.14],[.22+.001,y+.06,zr+.14]],'#68773d',[1,0,0]);
    box(-.2,-.12,y+.12,y+.18,zr+.17,zr+.21,'#2b2f2c')}
  dec([[-.02,-.6,zr+.171],[.04,-.6,zr+.171],[.04,.12,zr+.171],[-.02,.12,zr+.171]],'#1d1f1f',[0,0,1]);
  return finish()})();
function shadeCol(col,k){if(col[0]!=='#')return col;const n=parseInt(col.slice(1),16);return`rgb(${Math.min(255,(n>>16)*k)|0},${Math.min(255,(n>>8&255)*k)|0},${Math.min(255,(n&255)*k)|0})`}
// project and draw the mesh. proj(local point) -> [sx,sy]; vis(normalWorld, centroidLocal) -> bool; depth(centroidLocal) -> number (larger = nearer)
function drawMesh(c,toWorld,proj,vis,depth,mesh=CARMESH){const ca=Math.cos(c.ang||0),sa=Math.sin(c.ang||0),list=[];
  for(const f of mesh){const nw=[f.n[0]*ca-f.n[1]*sa,f.n[0]*sa+f.n[1]*ca,f.n[2]];if(!vis(nw,f.c))continue;
    const lit=f.flat?1:.8+.3*Math.max(0,nw[0]*SUN[0]+nw[1]*SUN[1]+nw[2]*SUN[2]);const base=f.parent||f;list.push({f,d:depth(base.c)+(f.parent?1e-5*(f.ord-f.parent.ord):0),lit})}
  list.sort((a,b)=>a.d-b.d);
  const pt=mesh===CARMESH?PAINTS[(c.paint||S.paint)||'coniston']||PAINTS.coniston:{body:c.color||'#888888',hi:c.colorHi||c.color||'#999999'};
  for(const {f,lit} of list){const col=mesh===CARMESH?(f.col===CARC.body?pt.body:f.col===CARC.bodyHi?pt.hi:f.col):(f.col==='BODY'?pt.body:f.col==='BODYHI'?pt.hi:f.col);ctx.fillStyle=shadeCol(col,lit);ctx.beginPath();f.pts.forEach((p,i)=>{const s=proj(p);i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1])});ctx.closePath();ctx.fill()}}
// world point (units) for a local point on the car
function carLocalToWorld(c,p,k){const ca=Math.cos(c.ang),sa=Math.sin(c.ang);return[c.x+(p[0]*ca-p[1]*sa)*M*k,c.y+(p[0]*sa+p[1]*ca)*M*k,p[2]*k]}
/* map (3/4 view from the south), exaggerated VX× to match the people */
function drawCar(c,t){const ca=Math.cos(c.ang),sa=Math.sin(c.ang);
  // flat shadow
  softShadow(c.x,c.y,c.ang,4.1,2.0,.3);
  const V=[0,.7,1];
  drawMesh(c,null,p=>{const w=carLocalToWorld(c,p,VX);return[w[0],c.y+(w[1]-c.y)*KD-w[2]*HS]},(n)=>n[0]*V[0]+n[1]*V[1]+n[2]*V[2]>.001,
    p=>{const wy=(p[0]*sa+p[1]*ca),z=p[2];return wy*.7+z});
  if(c.lights){const n=[ca,sa];for(const yy of[-.69,.69]){const w=carLocalToWorld(c,[1.95,yy,.95],VX);const x=w[0],y=c.y+(w[1]-c.y)*KD-w[2]*HS;const g=ctx.createRadialGradient(x,y,1,x+n[0]*60,y+n[1]*60,80);g.addColorStop(0,'rgba(255,240,190,.4)');g.addColorStop(1,'rgba(255,240,190,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x+n[0]*45,y+n[1]*45,80,0,TAU);ctx.fill()}}}
/* binoculars: true size, perspective from the eye */
function drawCarBino(d){const c=S.car,E=BV.E;
  drawMesh(c,null,p=>{const w=carLocalToWorld(c,p,1),q=bproj(w[0],w[1],w[2]);return q?[q.x,q.y]:[BV.cx,BV.cy]},
    (n,p)=>{const w=carLocalToWorld(c,p,1);return n[0]*(E.x-w[0])/M+n[1]*(E.y-w[1])/M+n[2]*(E.h-w[2])>0},
    p=>{const w=carLocalToWorld(c,p,1);return-Math.hypot((w[0]-E.x)/M,(w[1]-E.y)/M,w[2]-E.h)});
  BV.drawn.push({t:(()=>{const a=bproj(c.x,c.y,0),b=bproj(c.x,c.y,2);return a&&b?[a.x,a.y,b.x,b.y,2.2*a.s,2.2*b.s]:[0,0,0,0,0,0]})()})}

/* any mesh (traffic, buildings) in the binoculars, true size */
function drawMeshBino(o,mesh){const E=BV.E;
  drawMesh(o,null,p=>{const w=carLocalToWorld(o,p,1),q=bproj(w[0],w[1],w[2]);return q?[q.x,q.y]:[BV.cx,BV.cy]},
    (n,p)=>{const w=carLocalToWorld(o,p,1);return n[0]*(E.x-w[0])/M+n[1]*(E.y-w[1])/M+n[2]*(E.h-w[2])>0},
    p=>{const w=carLocalToWorld(o,p,1);return-Math.hypot((w[0]-E.x)/M,(w[1]-E.y)/M,w[2]-E.h)},mesh)}
/* any vehicle mesh on the map, at the same VX scale as the Defender */
function drawMeshMap(o,mesh,k=VX){const ca=Math.cos(o.ang),sa=Math.sin(o.ang),V=[0,.7,1];
  drawMesh(o,null,p=>{const w=carLocalToWorld(o,p,k);return[w[0],o.y+(w[1]-o.y)*KD-w[2]*HS]},n=>n[0]*V[0]+n[1]*V[1]+n[2]*V[2]>.001,p=>(p[0]*sa+p[1]*ca)*.7+p[2],mesh)}

/* ---------- other vehicles: parked and moving ----------
   Small 3D models in metres (x forward, y right, z up) built with the same mesh kit as the Defender.
   'BODY' faces take each vehicle's own paint. Drawn VX× on the map like the Defender, true size in the binoculars. */
const VCOLS=['#c23b2e','#2d55a8','#e9e7e0','#1d1f22','#8a8f93','#5c6b4d','#d9b84a','#6e2f3a','#3f7f86','#b7b9b6','#24384a','#e07a2f'];
const VTYPES={sedan:{name:'Sedan',L:4.7,W:1.84},hatch:{name:'Hatchback',L:4.0,W:1.78},suv:{name:'SUV',L:4.8,W:1.95},pickup:{name:'Pickup truck',L:5.6,W:2.0},
  van:{name:'Delivery van',L:5.4,W:2.0},taxi:{name:'Taxi',L:4.7,W:1.84},bus:{name:'City bus',L:11,W:2.5},tractor:{name:'Farm tractor',L:3.8,W:2.0}};
const VMESH={};
function vehMesh(type){if(VMESH[type])return VMESH[type];const K=meshKit(),{add,dec,planR,loft,prism,box,ring,cyl}=K;
  const T0=VTYPES[type],L=T0.L,W=T0.W,hx=L/2,hw=W/2,TIRE='#1b1c1c',GL='#2a3a46',LAMP='#fff4c8',RED='#c23b2e',TRIM='#202224';
  const wheels=(xs,r,rim='#b9bcbf',inset=.13,wid=.22)=>{for(const ax of xs)for(const s of[-1,1]){cyl(ax,s*(hw-inset),r,r,wid,'y',TIRE,[ax,s*(hw-inset),r],14);dec(ring(ax,s*(hw-inset+wid/2+.004),r,r*.6,'y',12),rim,[0,s,0]);dec(ring(ax,s*(hw-inset+wid/2+.008),r,r*.18,'y',8),'#6f7376',[0,s,0])}};
  const lamps=(zf,zr,y0=.55)=>{for(const s of[-1,1]){dec([[hx+.003,s*y0,zf],[hx+.003,s*(y0+.25),zf],[hx+.003,s*(y0+.25),zf+.12],[hx+.003,s*y0,zf+.12]],LAMP,[1,0,0]);dec([[-hx-.003,s*y0,zr],[-hx-.003,s*(y0+.25),zr],[-hx-.003,s*(y0+.25),zr+.14],[-hx-.003,s*y0,zr+.14]],RED,[-1,0,0])}};
  // a car: lower body, glasshouse with a painted roof, bumpers, lamps
  const car=(o)=>{wheels([o.fa,o.ra],o.tr);const pl=planR(-hx,hx,-hw,hw,o.rf||.35,o.rr||.3),I=[0,0,(o.zb+o.zbelt)/2];prism(pl,o.zb,o.zbelt,'BODY');
    const g0=planR(o.c0,o.c1,-hw+.04,hw-.04,.15,.15),g1=planR(o.t0,o.t1,-hw+.16,hw-.16,.18,.18);loft(g0,o.zbelt,g1,o.zr,GL,[ (o.c0+o.c1)/2,0,(o.zbelt+o.zr)/2]);
    const g2=planR(o.t0+.02,o.t1-.02,-hw+.18,hw-.18,.16,.16);loft(g1,o.zr,g2,o.zr+.04,'BODY',[(o.t0+o.t1)/2,0,o.zr-.1],{cap:true});
    for(const s of[-1,1]){const n=[0,s,0];dec([[(o.c0+o.c1)/2-.04,s*(hw-.03),o.zbelt+.02],[(o.c0+o.c1)/2+.04,s*(hw-.03),o.zbelt+.02],[(o.t0+o.t1)/2+.04,s*(hw-.15),o.zr-.02],[(o.t0+o.t1)/2-.04,s*(hw-.15),o.zr-.02]],'BODY',n)}
    prism(planR(hx-.12,hx+.06,-hw+.05,hw-.05,.1,.02),o.zb-.04,o.zb+.18,TRIM);prism(planR(-hx-.06,-hx+.12,-hw+.05,hw-.05,.02,.1),o.zb-.04,o.zb+.18,TRIM);
    lamps(o.zbelt-.18,o.zbelt-.2);for(const s of[-1,1])box(o.c1-.12,o.c1-.02,s*(hw+.02),s*(hw+.12),o.zbelt+.02,o.zbelt+.12,TRIM)};
  switch(type){
    case'sedan':case'taxi':car({fa:1.42,ra:-1.42,tr:.33,zb:.3,zbelt:.84,c0:-1.35,c1:.72,t0:-1.0,t1:.2,zr:1.42});
      if(type==='taxi'){box(-.55,-.15,-.3,.3,1.46,1.64,'#f6f1d6');dec([[-.151,-.25,1.5],[-.151,.25,1.5],[-.151,.25,1.6],[-.151,-.25,1.6]],'#222',[1,0,0])}break;
    case'hatch':car({fa:1.28,ra:-1.22,tr:.31,zb:.3,zbelt:.84,c0:-1.85,c1:.55,t0:-1.82,t1:0,zr:1.46,rr:.18});break;
    case'suv':car({fa:1.45,ra:-1.45,tr:.37,zb:.36,zbelt:1.0,c0:-2.25,c1:.7,t0:-2.2,t1:.1,zr:1.78,rr:.2});for(const s of[-1,1])box(-2.1,.2,s*.66-.03,s*.66+.03,1.82,1.88,TRIM);break;
    case'pickup':{wheels([1.72,-1.72],.39,'#c9ccc8');prism(planR(-hx,hx,-hw,hw,.3,.12),.4,1.02,'BODY');
      const g0=planR(-.3,1.0,-hw+.05,hw-.05,.12,.08),g1=planR(-.25,.62,-hw+.16,hw-.16,.14,.08);loft(g0,1.02,g1,1.82,GL,[.35,0,1.4]);const g2=planR(-.23,.6,-hw+.18,hw-.18,.12,.06);loft(g1,1.82,g2,1.86,'BODY',[.2,0,1.7],{cap:true});
      for(const s of[-1,1])dec([[.33,s*(hw-.04),1.04],[.4,s*(hw-.04),1.04],[.22,s*(hw-.15),1.8],[.15,s*(hw-.15),1.8]],'BODY',[0,s,0]);
      box(-hx+.05,-.35,-hw+.06,hw-.06,1.0,1.02,'#3a3c3e');box(-hx,-.35,-hw,-hw+.07,1.02,1.32,'BODY');box(-hx,-.35,hw-.07,hw,1.02,1.32,'BODY');box(-hx,-hx+.07,-hw,hw,1.02,1.3,'BODY');box(-.42,-.35,-hw,hw,1.02,1.36,'BODY');
      prism(planR(hx-.12,hx+.08,-hw+.04,hw-.04,.08,.02),.36,.62,'#c9ccc8');lamps(.82,.86,.6);break}
    case'van':{wheels([1.75,-1.75],.37);const pl=planR(-hx,hx,-hw,hw,.3,.12);prism(pl,.36,1.0,'#f0efe9');const up=planR(-hx,hx-.95,-hw,hw,.06,.08);prism(up,1.0,2.25,'#f0efe9');
      const nose=planR(hx-.95,hx-.08,-hw+.02,hw-.02,.25,.05);loft(nose,1.0,planR(hx-.95,hx-.55,-hw+.08,hw-.08,.12,.05),2.0,GL,[hx-.6,0,1.4]);box(hx-.97,hx-.55,-hw+.08,hw-.08,2.0,2.22,'#f0efe9');
      for(const s of[-1,1]){dec([[-hx+.4,s*(hw+.003),1.3],[hx-1.3,s*(hw+.003),1.3],[hx-1.3,s*(hw+.003),1.8],[-hx+.4,s*(hw+.003),1.8]],'BODY',[0,s,0]);dec([[hx-1.25,s*(hw+.003),1.2],[hx-.97,s*(hw+.003),1.2],[hx-.97,s*(hw+.003),1.9],[hx-1.25,s*(hw+.003),1.9]],GL,[0,s,0])}
      dec([[-hx-.003,-.02,.5],[-hx-.003,.02,.5],[-hx-.003,.02,2.1],[-hx-.003,-.02,2.1]],'#9a9a94',[-1,0,0]);lamps(.72,.7,.6);break}
    case'bus':{wheels([3.6,-2.9],.5,'#c9ccc8',.2,.3);prism(planR(-hx,hx,-hw,hw,.25,.2),.42,3.0,'#f0efe9');prism(planR(-hx+.1,hx-.1,-hw+.1,hw-.1,.2,.2),3.0,3.12,'#d6d5cf');
      for(const s of[-1,1]){const n=[0,s,0];dec([[-hx+.4,s*(hw+.004),1.45],[hx-1.3,s*(hw+.004),1.45],[hx-1.3,s*(hw+.004),2.55],[-hx+.4,s*(hw+.004),2.55]],GL,n);
        for(let x=-hx+1.6;x<hx-1.4;x+=1.2)dec([[x,s*(hw+.006),1.45],[x+.08,s*(hw+.006),1.45],[x+.08,s*(hw+.006),2.55],[x,s*(hw+.006),2.55]],'#e8e7e1',n);
        dec([[-hx+.2,s*(hw+.004),.75],[hx-.2,s*(hw+.004),.75],[hx-.2,s*(hw+.004),1.15],[-hx+.2,s*(hw+.004),1.15]],'BODY',n)}
      dec([[hx+.004,-1.1,1.0],[hx+.004,1.1,1.0],[hx+.004,1.1,2.6],[hx+.004,-1.1,2.6]],GL,[1,0,0]);dec([[hx+.006,-.9,2.68],[hx+.006,.9,2.68],[hx+.006,.9,2.92],[hx+.006,-.9,2.92]],'#1d1f22',[1,0,0]);
      dec([[hx+.008,-.6,2.72],[hx+.008,.2,2.72],[hx+.008,.2,2.88],[hx+.008,-.6,2.88]],'#f2b632',[1,0,0]);dec([[hx-1.25,hw+.006,.45],[hx-.35,hw+.006,.45],[hx-.35,hw+.006,2.6],[hx-1.25,hw+.006,2.6]],'#3a4c58',[0,1,0]);lamps(.6,.6,.85);break}
    case'tractor':{wheels([-.95],.82,'#e3b52c',.25,.42);wheels([1.25],.46,'#e3b52c',.18,.24);box(-.3,1.75,-.42,.42,.55,1.28,'BODY');box(1.62,1.78,-.38,.38,.6,1.2,'#2b2d2e');
      box(-1.55,-.3,-.7,.7,.75,1.1,'BODY');const c0=planR(-1.5,-.35,-.68,.68,.06,.06);loft(c0,1.1,c0,2.45,GL,[-.9,0,1.7]);box(-1.6,-.25,-.78,.78,2.45,2.56,'BODY');
      for(const s of[-1,1])box(-.95-.05,-.95+.05,s*.74,s*.78,.8,1.75,'BODY');cyl(.9,-.25,1.7,.05,1.0,'z','#2b2d2e',[.9,-.25,1.7],6,'x');dec([[1.755,-.3,1.0],[1.755,.3,1.0],[1.755,.3,1.12],[1.755,-.3,1.12]],LAMP,[1,0,0]);
      for(const s of[-1,1])box(-1.5,-.4,s*.82,s*1.0,1.45,1.53,'BODY');break}
  }
  VMESH[type]=K.finish();return VMESH[type]}
const vLen=v=>VTYPES[v.type].L,vWid=v=>VTYPES[v.type].W;
// a rounded shadow under a vehicle: a soft outer edge and a darker core, lying on the squashed ground
function softShadow(x,y,ang,L,W,a){ctx.save();ctx.translate(x+4,y+3);ctx.scale(1,KD);ctx.rotate(ang);const l=L*M*VX,w=W*M*VX,r=Math.min(w*.4,M*VX*.6);
  ctx.fillStyle=`rgba(10,24,14,${a*.45})`;ctx.beginPath();ctx.roundRect(-l/2-5,-w/2-5,l+10,w+10,r+5);ctx.fill();
  ctx.fillStyle=`rgba(10,24,14,${a*.75})`;ctx.beginPath();ctx.roundRect(-l/2,-w/2,l,w,r);ctx.fill();ctx.restore()}
function vehShadow(v){softShadow(v.x,v.y,v.ang,vLen(v)*.98,vWid(v)*1.02,.28)}
// parked vehicles never move, so their map drawing is cached
function vehSprite(v){if(v.spr)return v.spr;const hl=vLen(v)/2*M*VX,R=Math.hypot(hl,vWid(v)/2*M*VX)+8,top=(v.type==='bus'?3.4:2.7)*HS*VX,K=Math.min(1.5,devicePixelRatio||1),c=document.createElement('canvas');
  c.width=Math.ceil(R*2*K);c.height=Math.ceil((R*2+top)*K);const g=c.getContext('2d'),prev=ctx;ctx=g;g.scale(K,K);g.translate(R,R+top);try{drawMeshMap({...v,x:0,y:0},vehMesh(v.type))}finally{ctx=prev}
  v.spr={c,ox:-R,oy:-R-top,K};return v.spr}
function drawVehicle(v){if(v.parked){const s=vehSprite(v);ctx.drawImage(s.c,v.x+s.ox,v.y+s.oy,s.c.width/s.K,s.c.height/s.K)}else drawMeshMap(v,vehMesh(v.type));
  if(v.type==='taxi'||v.type==='bus'){}}
function vehHit(v,x,y,rad){const dx=x-v.x,dy=y-v.y,ca=Math.cos(v.ang),sa=Math.sin(v.ang),lx=dx*ca+dy*sa,ly=-dx*sa+dy*ca;return Math.abs(lx)<vLen(v)/2*M*VX+rad&&Math.abs(ly)<vWid(v)/2*M*VX+rad}
function randCol(r){return VCOLS[Math.floor(r()*VCOLS.length)]}

/* ---------- parked cars ---------- */
const PARKED=[];
{const r=rng(5150),types=CENTRAL?['pickup','sedan','suv','pickup','hatch','pickup','suv','sedan','van']:['sedan','sedan','hatch','suv','pickup','hatch','suv','sedan','van','hatch','suv','sedan','taxi'];
  const park=(type,x,y,ang)=>{const col=type==='taxi'?'#f2c230':randCol(r);PARKED.push({type,x,y,ang,parked:true,color:col,colorHi:shadeHex(col,.08)})};
  for(const sy of STS)for(const side of[-1,1])for(let x=CITY.x0+170;x<OCEAN_DR-120;x+=118){if(stGap(sy,x))continue;let bad=false;for(const ax of AVES)if(Math.abs(x-ax)<ST_HALF+WALK+70)bad=true;if(bad||Math.abs(x-roadX(sy))<ROAD_HALF+150||r()<.42)continue;
    park(types[Math.floor(r()*types.length)],x+(r()-.5)*14,sy+side*57,side>0?0:PI)}
  for(const ax of AVES)for(const side of[-1,1])for(let y=CITY.y0+170;y<CITY.y1-120;y+=118){let bad=false;for(const sy of STS)if(Math.abs(y-sy)<ST_HALF+WALK+70)bad=true;if(bad||r()<.5)continue;
    park(types[Math.floor(r()*types.length)],ax+side*57,y+(r()-.5)*14,side>0?-PI/2:PI/2)}
  for(const l of CITY_LOTS){if(l.kind!=='parking')continue;for(let x=l.x0+36;x<l.x1-26;x+=52){if(r()<.62)park(types[Math.floor(r()*types.length)],x,l.y0+26,r()<.5?PI/2:-PI/2);if(r()<.62)park(types[Math.floor(r()*types.length)],x,l.y1-26,r()<.5?PI/2:-PI/2)}}
  if(!CENTRAL){park('pickup',8930,18240,-.2);park('sedan',7800,16560,PI/2+.1);park('suv',7900,16545,PI/2-.05);park('hatch',coastX(7000)-560,7050,PI*.95)}}
const PGRID=new Map();for(const v of PARKED){const k=cellKey(Math.floor(v.x/CELL),Math.floor(v.y/CELL));let a=PGRID.get(k);if(!a)PGRID.set(k,a=[]);a.push(v)}
function parkedNear(x,y,rad){const out=[];for(let cy=Math.floor((y-rad)/CELL);cy<=Math.floor((y+rad)/CELL);cy++)for(let cx=Math.floor((x-rad)/CELL);cx<=Math.floor((x+rad)/CELL);cx++){const a=PGRID.get(cellKey(cx,cy));if(a)out.push(...a)}return out}

/* ---------- moving traffic ----------
   Highway: southbound in the west lane, northbound in the east lane (they drive on the right).
   City: along the streets and avenues of Port Bostick. Everyone stops for the Defender, for you and for people crossing. */
const TRAFFIC=[];const LANE=20,HW_LANE=27;   // RD5: highway lanes sit in the middle of the wider lanes
function laneXY(v,s){if(v.road==='hw'){const x=roadX(s)+(v.dir>0?-HW_LANE:HW_LANE)+v.off*(v.dir>0?1:-1),dx=(roadX(s+5)-roadX(s-5))/10;return[x,s,Math.atan2(v.dir,v.dir*dx)]}
  if(v.road==='st')return[s,v.c+(v.dir>0?LANE:-LANE)-v.off*(v.dir>0?1:-1),v.dir>0?0:PI];
  if(v.road==='av')return[v.c+(v.dir>0?-LANE:LANE)+v.off*(v.dir>0?1:-1),s,v.dir>0?PI/2:-PI/2];
  return[v.x,v.y,v.ang]}
function laneRange(v){if(v.road==='hw')return[HW0>0?HW0+60:-400,HW1<WH?HW1-60:WH+400];if(v.road==='st')return[CITY.x0-ST_HALF,OCEAN_DR];return[CITY.y0-ST_HALF,CITY.y1+ST_HALF]}
// where an obstacle sits in this vehicle's lane: distance ahead, or null
function aheadOf(v,x,y,halfW){if(v.road==='turn')return null;let s,lat;if(v.road==='hw'){s=y;lat=x-(roadX(y)+(v.dir>0?-HW_LANE:HW_LANE)+v.off*(v.dir>0?1:-1))}else if(v.road==='st'){s=x;lat=y-(v.c+(v.dir>0?LANE:-LANE)-v.off*(v.dir>0?1:-1))}else{s=y;lat=x-(v.c+(v.dir>0?-LANE:LANE)+v.off*(v.dir>0?1:-1))}
  if(Math.abs(lat)>halfW+vWid(v)/2*M*VX)return null;const d=(s-v.s)*v.dir;return d>0?d:null}
function spawnTraffic(v,far){const r=Math.random,L=listener();
  if(v.road==='hw'){v.dir=r()<.5?1:-1;let s=L.y+(r()<.5?1:-1)*(far?2200+r()*1400:300+r()*2600);v.s=clamp(s,HW0+400,HW1-400)}
  else{const st=r()<.6;v.road=st?'st':'av';v.c=st?ST_OPEN[Math.floor(r()*ST_OPEN.length)]:AVES[Math.floor(r()*(AVES.length-1))];v.dir=r()<.5?1:-1;const [a,b]=laneRange(v);
    for(let k=0;k<12;k++){v.s=a+r()*(b-a);const p=laneXY(v,v.s);if(!far||Math.hypot(p[0]-L.x,p[1]-L.y)>Math.max(VW,VH)*.75)break}}
  for(const o of TRAFFIC)if(o!==v&&o.road===v.road&&o.c===v.c&&o.dir===v.dir&&Math.abs(o.s-v.s)<180)v.s+=v.dir*-220;
  v.v=v.vmax*.8;v.off=0;v.offT=0;v.wait=0;const p=laneXY(v,v.s);v.x=p[0];v.y=p[1];v.ang=p[2]}
{const r=rng(808);const add=(road,type)=>{const col=type==='taxi'?'#f2c230':type==='bus'?'#2f7fb5':randCol(r);const v={road,type,color:col,colorHi:shadeHex(col,.08),c:0,dir:1,s:0,v:0,vmax:road==='hw'?(type==='bus'?380:430+r()*90):type==='bus'?200:240+r()*60,off:0};spawnTraffic(v,false);TRAFFIC.push(v)};
  if(!ISLE)for(let i=0;i<9;i++)add('hw',['sedan','suv','hatch','pickup','van','sedan','suv','hatch','pickup'][i]);
  if(CENTRAL){for(let i=0;i<6;i++)add('city',['pickup','sedan','suv','pickup','van','tractor'][i])}else{for(let i=0;i<8;i++)add('city',['sedan','taxi','hatch','suv','van','sedan','taxi','pickup'][i]);add('city','bus')}}
// the tractor works one field, up and down the rows
const TRACTOR={type:'tractor',color:'#3d7a3a',colorHi:'#4a8a45',field:FIELDS.find(f=>f.crop==='plowed')||FIELDS[0],row:0,dir:1,x:0,y:0,ang:0,v:60,turn:0};
{const f=TRACTOR.field;TRACTOR.x=f.x0+40;TRACTOR.y=f.y0+40}
function updateTractor(dt){const T0=TRACTOR,f=T0.field,horiz=!f.dir,a0=horiz?f.x0+50:f.y0+50,a1=horiz?f.x1-50:f.y1-50,rows=Math.floor(((horiz?f.y1-f.y0:f.x1-f.x0)-80)/44);
  if(T0.turn>0){T0.turn-=dt;return}
  let s=horiz?T0.x:T0.y;s+=T0.dir*T0.v*dt;if(s>a1||s<a0){s=clamp(s,a0,a1);T0.dir*=-1;T0.row=(T0.row+1)%Math.max(1,rows);T0.turn=1.4}
  const c=(horiz?f.y0:f.x0)+40+T0.row*44;if(horiz){T0.x=s;T0.y=lerp(T0.y,c,.05);T0.ang=T0.dir>0?0:PI}else{T0.y=s;T0.x=lerp(T0.x,c,.05);T0.ang=T0.dir>0?PI/2:-PI/2}}
function bez(P,t){const u=1-t;return[u*u*u*P[0][0]+3*u*u*t*P[1][0]+3*u*t*t*P[2][0]+t*t*t*P[3][0],u*u*u*P[0][1]+3*u*u*t*P[1][1]+3*u*t*t*P[2][1]+t*t*t*P[3][1]]}
function startTurn(v,nx,uturn){const p0=laneXY(v,v.s),w={road:nx.road,c:nx.c,dir:nx.dir,off:0},p3=laneXY(w,nx.s),a0=p0[2],a3=p3[2];let c1,c2;
  if(uturn){const k=HW_LANE*2.6;c1=[p0[0]+Math.cos(a0)*k,p0[1]+Math.sin(a0)*k];c2=[p3[0]-Math.cos(a3)*k,p3[1]-Math.sin(a3)*k]}
  else{const Q=Math.abs(Math.cos(a0))>.5?[p3[0],p0[1]]:[p0[0],p3[1]];c1=[p0[0]+(Q[0]-p0[0])*2/3,p0[1]+(Q[1]-p0[1])*2/3];c2=[p3[0]+(Q[0]-p3[0])*2/3,p3[1]+(Q[1]-p3[1])*2/3]}
  const P=[[p0[0],p0[1]],c1,c2,[p3[0],p3[1]]];let len=0,q=P[0];for(let k=1;k<=12;k++){const b=bez(P,k/12);len+=Math.hypot(b[0]-q[0],b[1]-q[1]);q=b}
  v.turn={P,t:0,len:Math.max(20,len),next:nx};v.road='turn';v.off=0;v.offT=0;v.wait=0}
function trafficTurn(v,dt){const T0=v.turn;v.v=Math.min(v.v,v.vmax*.5+40);T0.t+=v.v*dt/T0.len;
  if(T0.t>=1){const n=T0.next;v.road=n.road;v.c=n.c;v.dir=n.dir;v.s=n.s;v.turn=null;const p=laneXY(v,v.s);v.x=p[0];v.y=p[1];v.ang=p[2];return}
  const a=bez(T0.P,T0.t),b=bez(T0.P,Math.min(1,T0.t+.02));v.x=a[0];v.y=a[1];if(Math.hypot(b[0]-a[0],b[1]-a[1])>.01)v.ang=Math.atan2(b[1]-a[1],b[0]-a[0])}
// has the car just reached a corner (or the end of the highway)? then maybe turn
function trafficJunction(v,s0){const cross=e=>(s0-e)*v.dir<0&&(v.s-e)*v.dir>=0,R=ST_HALF,pick=a=>a[Math.floor(Math.random()*a.length)];
  if(v.road==='hw'){if(HW0>0&&v.dir<0&&cross(HW0+140)){startTurn(v,{road:'hw',c:0,dir:1,s:HW0+140},true);return true}
    if(HW1<WH&&v.dir>0&&cross(HW1-140)){startTurn(v,{road:'hw',c:0,dir:-1,s:HW1-140},true);return true}return false}
  if(v.road==='st'){for(const cx of AVES){if(!cross(cx-v.dir*R))continue;const ahead=AVES.some(q=>(q-cx)*v.dir>0),cy=v.c,o=[];if(cy<STS[STS.length-1])o.push(1);if(cy>STS[0])o.push(-1);
      if(!o.length||(ahead&&Math.random()<.55))return false;const d2=pick(o);startTurn(v,{road:'av',c:cx,dir:d2,s:cy+d2*R},false);return true}return false}
  if(v.road==='av'){for(const cy of STS){if(!cross(cy-v.dir*R))continue;const ahead=STS.some(q=>(q-cy)*v.dir>0);if(!ST_OPEN.includes(cy)){if(!ahead)break;continue}
      const cx=v.c,o=[];if(cx<AVES[AVES.length-1])o.push(1);if(cx>AVES[0])o.push(-1);
      if(!o.length||(ahead&&Math.random()<.55))return false;const d2=pick(o);startTurn(v,{road:'st',c:cy,dir:d2,s:cx+d2*R},false);return true}return false}
  return false}
function updateTraffic(dt){const L=listener();
  for(const v of TRAFFIC){
    if((v.turn?v.turn.next.road:v.road)!=='hw'&&!inCity(L.x,L.y,3000))continue;
    // what's ahead: other traffic, the Defender, you, and anyone on foot
    let gap=1e9,stat=false;
    for(const o of TRAFFIC){if(o===v)continue;const d=aheadOf(v,o.x,o.y,vWid(o)/2*M*VX*.6);if(d!=null&&d<gap){gap=d-(vLen(o)+vLen(v))/2*M*VX}}
    {const d=aheadOf(v,S.car.x,S.car.y,30);if(d!=null){const g=d-(vLen(v)/2+2.1)*M*VX;if(g<gap){gap=g;stat=Math.abs(S.car.v)<20}}}
    if(S.mode==='walk'){const d=aheadOf(v,S.player.x,S.player.y,14);if(d!=null){const g=d-vLen(v)/2*M*VX-20;if(g<gap){gap=g;stat=!S.player.moving}}}
    for(const p of PEOPLE){if(!p.street)continue;const d=aheadOf(v,p.x,p.y,10);if(d!=null){const g=d-vLen(v)/2*M*VX-16;if(g<gap)gap=g}}
    for(const o of parkedNear(v.x,v.y,300)){const d=aheadOf(v,o.x,o.y,vWid(o)/2*M*VX*.7);if(d!=null){const g=d-(vLen(o)+vLen(v))/2*M*VX;if(g<gap){gap=g;stat=true}}}
    const safe=40+v.v*.55,want=gap<safe?Math.max(0,(gap-25)*1.6):v.vmax;
    v.v+=(want>v.v?150:-520)*dt;v.v=clamp(v.v,0,v.vmax);if(gap<8)v.v=0;
    // waiting behind something that isn't moving: pull out and pass when the other lane is clear
    if(v.v<5&&stat&&gap<160){v.wait+=dt;if(v.wait>2.2&&!v.offT){let clear=true;for(const o of TRAFFIC)if(o!==v&&o.road===v.road&&o.c===v.c&&o.dir!==v.dir&&Math.abs(o.s-v.s)<700)clear=false;if(clear)v.offT=-LANE*2}}
    else if(v.offT&&gap>400){v.wait+=dt;if(v.wait>6){v.offT=0;v.wait=0}}else if(!v.offT)v.wait=0;
    v.off+=((v.offT||0)-v.off)*Math.min(1,dt*1.8);
    if(v.turn){trafficTurn(v,dt);continue}
    const s0=v.s;v.s+=v.dir*v.v*dt;if(trafficJunction(v,s0)){trafficTurn(v,0);continue}const [a,b]=laneRange(v);
    const p=laneXY(v,v.s);v.x=p[0];v.y=p[1];v.ang=p[2];
    const far=v.road==='hw'?Math.abs(v.s-L.y)>3800:false;
    if(v.s<a||v.s>b||far){if(v.road!=='hw')v.road='city';spawnTraffic(v,true)}}
  if(Math.hypot(L.x-TRACTOR.x,L.y-TRACTOR.y)<4000)updateTractor(dt)}
function trafficAt(x,y,rad){for(const v of TRAFFIC)if(Math.abs(v.x-x)<160&&Math.abs(v.y-y)<160&&vehHit(v,x,y,rad))return v;if(vehHit(TRACTOR,x,y,rad))return TRACTOR;
  for(const v of parkedNear(x,y,120))if(vehHit(v,x,y,rad))return v;return null}
function drawVehicleBino(v){drawMeshBino(v,vehMesh(v.type));const a=bproj(v.x,v.y,0),b=bproj(v.x,v.y,1.6);if(a&&b)BV.drawn.push({t:[a.x,a.y,b.x,b.y,vLen(v)*.4*a.s,vLen(v)*.4*b.s]})}

/* ---------- people ----------
   Commuters, shoppers, joggers, dog walkers and tourists in Port Bostick, anglers on the pier, the beach and the ponds,
   farmers in the farmyard. No interaction yet: they go about their day and traffic stops for them.
   Figures use the same flat style and proportions as the birder (about 30 units tall, drawn 1.15× on the map). */
const SKINS=['#f1c9a5','#e2b48c','#c68e63','#a8714a','#7d5233','#5c3b25'],HAIRS=['#2b1d14','#5a3e2a','#a0522d','#d8b26a','#1a1a1a','#8c8c8c'];
const PKIND={commuter:'Commuter',shopper:'Shopper',jogger:'Jogger',dogwalker:'Dog walker',tourist:'Tourist',angler:'Angler',farmer:'Farmer',walker:'Beach walker'};
function personLook(kind,r){const pick=a=>a[Math.floor(r()*a.length)],L={kind,skin:pick(SKINS),hair:pick(HAIRS),long:r()<.45,shoe:'#2a2522'};
  switch(kind){
    case'commuter':{const suit=pick(['#2b3445','#3a3f48','#4a4f57','#2f3b33','#5b4a3c']);Object.assign(L,{top:suit,pants:suit,shirt:'#f2f0ea',tie:pick(['#a8352b','#2d55a8','#6e2f3a','#c9a23a']),acc:r()<.75?'briefcase':'laptop',cup:r()<.35,shoe:'#1a1a1a'});break}
    case'shopper':Object.assign(L,{top:pick(['#d9534f','#5bc0de','#f0ad4e','#9b59b6','#e8e1d2','#3fa37a','#f2a7b5']),pants:pick(['#3d5a80','#2e2e2e','#c8b48a','#6b4f3a']),acc:'bags',bags:[pick(['#c9a66b','#e7dccb','#f2f0ea']),pick(['#c23b2e','#2d55a8','#3fa37a','#e7dccb'])],nb:1+(r()<.6?1:0)});break;
    case'jogger':Object.assign(L,{top:pick(['#f05a3a','#2fb3a0','#f2c230','#7b5cc9','#ffffff']),pants:'#24262a',shoe:'#f2f0ea',band:pick(['#ffffff','#f2c230','#2fb3a0']),shorts:true,run:true});break;
    case'dogwalker':Object.assign(L,{top:pick(['#6f8250','#b5534a','#4a6f8f','#d8c3a0']),pants:pick(['#3d5a80','#5a5440']),acc:'dog',dog:pick(['#c9a066','#2b2622','#f0ece4','#8a5a3a'])});break;
    case'tourist':Object.assign(L,{top:pick(['#f2f0ea','#f6d26a','#86c5e8','#f08a6a']),pants:pick(['#c8b48a','#e6dcc6','#5a7a9a']),hat:pick(['sun','cap']),hatC:pick(['#e3cb8d','#c23b2e','#2d55a8','#f2f0ea']),acc:'camera',pack:pick(['#3f5a43','#c23b2e','#2d55a8']),shorts:r()<.6});break;
    case'angler':Object.assign(L,{top:pick(['#6f7f5a','#8a7a5a','#4a5a6a','#b5534a']),vest:pick(['#a58a5c','#5d6b4a','#7a6a4e']),pants:pick(['#5a5440','#3d4a5a','#6d6450']),hat:pick(['cap','bucket']),hatC:pick(['#c9b183','#3f5a43','#2d55a8','#c23b2e']),acc:'rod',shoe:'#4a3524'});break;
    case'farmer':Object.assign(L,{top:pick(['#c23b2e','#e8e1d2','#4a6f8f']),pants:'#3f5f8a',overalls:true,hat:'straw',hatC:'#e3cb8d',shoe:'#4a3524'});break;
    default:Object.assign(L,{top:pick(['#f2f0ea','#86c5e8','#f2a7b5','#f6d26a']),pants:pick(['#e6dcc6','#5a7a9a']),hat:'sun',hatC:pick(['#e3cb8d','#f2f0ea']),shorts:true})}
  return L}
/* draw one figure at the origin (feet), facing view: 'front' | 'back' | 'side' (sx = ±1). ph = walk phase, mv = moving */
function drawPersonFig(L,view,sx,ph,mv,t,o={}){const run=L.run&&mv,sw=mv?Math.sin(ph):0,bob=mv?Math.abs(Math.cos(ph))*(run?2.2:1.1):Math.sin(t*2+ph)*.25;
  ell(0,1,8.5,3,'rgba(0,0,0,.22)');ctx.save();ctx.scale(1.15,1.15);const hip=-12+bob*.3-(o.sit?5:0),sh=hip-12,hy=sh-6.8;
  if(view==='side'){ctx.scale(sx,1);const st=run?7:5;
    if(o.sit){limb(0,hip,6,hip,L.pants,4.2);limb(6,hip,6,-1.5,L.pants,4);ell(7.4,-1,2.4,1.5,L.shoe)}
    else{limb(0,hip,sw*st,-1.5,L.pants,4.2);limb(sw*st,-1.5,sw*st+2.4,-.8,L.shoe,3.2);limb(0,hip,-sw*st,-1.5,shadeHex(L.pants,-.12),4.2);limb(-sw*st,-1.5,-sw*st+2.4,-.8,L.shoe,3.2)}
    if(L.shorts&&!o.sit){limb(0,hip,sw*st*.45,hip+5,L.pants,4.6);limb(0,hip,-sw*st*.45,hip+5,L.pants,4.6);limb(sw*st*.45,hip+5,sw*st,-1.5,L.skin,3);limb(-sw*st*.45,hip+5,-sw*st,-1.5,L.skin,3)}
    if(L.pack){ctx.fillStyle=L.pack;ctx.beginPath();ctx.roundRect(-7.5,sh+1,4.5,10,2);ctx.fill()}
    ctx.fillStyle=L.top;ctx.beginPath();ctx.roundRect(-4,sh,8,13,3.5);ctx.fill();if(L.vest){ctx.fillStyle=L.vest;ctx.beginPath();ctx.roundRect(-4,sh+1,6.5,11,2.5);ctx.fill()}
    if(L.overalls){ctx.fillStyle=L.pants;ctx.fillRect(-4,sh+5,8,8);limb(1,sh+5,1,sh,L.pants,1.4)}
    if(L.tie){ctx.fillStyle=L.shirt;ctx.fillRect(2.5,sh,1.6,4);ctx.fillStyle=L.tie;ctx.fillRect(3,sh+1,1.2,5)}
    // arms: holding something forward, swinging, or pumping
    const handY=sh+10.5;
    if(L.acc==='rod'){limb(1,sh+3,6,sh+7,L.top,3);dot(6.5,sh+7,1.7,L.skin);drawRod(6.5,sh+7,1,t,o)}
    else if(run){limb(0,sh+3,3+sw*3,sh+6,L.top,3);limb(3+sw*3,sh+6,6+sw*3,sh+2,L.skin,2.4)}
    else if(L.acc==='camera'&&!mv){limb(1,sh+3,6,hy+2,L.top,3);ctx.fillStyle='#1d1f1f';ctx.fillRect(5,hy-2,4,4);ctx.fillStyle='#d9d8d2';ctx.fillRect(8.5,hy-1.2,3.5,2.4)}
    else{limb(0,sh+2,-sw*4,handY-.5,L.top,3.2);dot(-sw*4,handY,1.7,L.skin);carry(L,'side',-sw*4,handY,mv,ph);if(L.cup){dot(sw*3+2,sh+9,1.7,L.skin);ctx.fillStyle='#f2efe6';ctx.fillRect(sw*3+1,sh+5,2.6,3.6);ctx.fillStyle='#6b4a32';ctx.fillRect(sw*3+1,sh+6,2.6,1)}}
    if(L.acc==='dog'){limb(0,sh+2,4,handY-2,L.top,3);dot(4.5,handY-1.5,1.6,L.skin)}
    dot(.5,hy,5.6,L.skin);ctx.fillStyle=L.hair;if(L.long){ctx.beginPath();ctx.moveTo(-4.4,hy-3);ctx.quadraticCurveTo(-6.8,hy+3.5,-5.4,hy+7.6);ctx.lineTo(-2,hy+6.8);ctx.quadraticCurveTo(-2.4,hy+2.4,-.6,hy-.6);ctx.closePath();ctx.fill()}ctx.beginPath();ctx.arc(.4,hy,6,PI*.8,PI*1.9);ctx.quadraticCurveTo(1.2,hy-2.6,-1.6,hy+1.2);ctx.quadraticCurveTo(-2.4,hy+3.6,-4.4,hy+3.4);ctx.closePath();ctx.fill();dot(3.4,hy-.4,.8,'#1a120c');
    if(L.band){ctx.fillStyle=L.band;ctx.fillRect(-5,hy-3.4,10.6,1.8)}hatOn(L,'side',hy)}
  else{const back=view==='back',l=mv?sw*(run?4:3):0;
    if(o.sit){limb(-2.3,hip,-2.3,-1.5,L.pants,4.2);limb(2.3,hip,2.3,-1.5,L.pants,4.2)}
    else{limb(-2.3,hip,-2.3,-1.5-Math.max(0,l),L.shorts?L.skin:L.pants,L.shorts?3.2:4.2);limb(2.3,hip,2.3,-1.5-Math.max(0,-l),L.shorts?L.skin:L.pants,L.shorts?3.2:4.2);if(L.shorts){ctx.fillStyle=L.pants;ctx.fillRect(-4.8,hip-1,9.6,5.5)}}
    ell(-2.3,-1-Math.max(0,l),2.2,1.5,L.shoe);ell(2.3,-1-Math.max(0,-l),2.2,1.5,L.shoe);
    ctx.fillStyle=L.top;ctx.beginPath();ctx.roundRect(-6,sh,12,13,3.5);ctx.fill();
    if(L.overalls){ctx.fillStyle=L.pants;ctx.fillRect(-4.5,sh+4.5,9,8.5);if(!back){ctx.fillRect(-3.6,sh,1.4,5);ctx.fillRect(2.2,sh,1.4,5)}}
    if(L.vest&&!back){ctx.fillStyle=L.vest;ctx.beginPath();ctx.roundRect(-6,sh+.5,4.6,12,2.5);ctx.roundRect(1.4,sh+.5,4.6,12,2.5);ctx.fill()}
    if(L.pack&&back){ctx.fillStyle=L.pack;ctx.beginPath();ctx.roundRect(-4.6,sh+1,9.2,9.5,2.5);ctx.fill()}
    if(L.tie&&!back){ctx.fillStyle=L.shirt;ctx.beginPath();ctx.moveTo(-2.2,sh);ctx.lineTo(2.2,sh);ctx.lineTo(0,sh+5);ctx.fill();ctx.fillStyle=L.tie;ctx.fillRect(-.7,sh+1.5,1.4,6.5)}
    if(L.acc==='rod'){limb(-5,sh+2,-1,sh+8,L.top,3);limb(5,sh+2,1,sh+8,L.top,3);dot(0,sh+8.4,1.8,L.skin);drawRod(0,sh+8,back?-1:1,t,{...o,view})}
    else{const a=run?-3:mv?sw:0;limb(-6,sh+2,-6.6-a,sh+10,L.top,3.2);limb(6,sh+2,6.6+a,sh+10,L.top,3.2);dot(-6.6-a,sh+10.6,1.7,L.skin);dot(6.6+a,sh+10.6,1.7,L.skin);carry(L,view,6.6+a,sh+10.6,mv,ph);
      if(L.cup){ctx.fillStyle='#f2efe6';ctx.fillRect(-8.2-a,sh+7,2.8,3.6);ctx.fillStyle='#6b4a32';ctx.fillRect(-8.2-a,sh+8,2.8,1)}}
    dot(0,hy,5.8,L.skin);
    if(back){ctx.fillStyle=L.hair;ctx.beginPath();ctx.arc(0,hy,5.9,-.2,PI+.2);if(L.long)ctx.rect(-5.6,hy,11.2,6);ctx.fill()}
    else{ctx.fillStyle=L.hair;ctx.beginPath();ctx.arc(0,hy,5.9,PI*1.05,PI*1.95);ctx.fill();if(L.long){ctx.fillRect(-5.9,hy-1,2.2,7);ctx.fillRect(3.7,hy-1,2.2,7)}dot(-2,hy-.2,.8,'#1a120c');dot(2,hy-.2,.8,'#1a120c');ctx.strokeStyle='#8a4a3a';ctx.lineWidth=.6;ctx.beginPath();ctx.arc(0,hy+1.8,1.2,.3,PI-.3);ctx.stroke()}
    if(L.band){ctx.fillStyle=L.band;ctx.fillRect(-5.8,hy-3.4,11.6,1.8)}hatOn(L,back?'back':'front',hy)}
  ctx.restore();if(L.acc==='dog')drawDog(L,view,sx,ph,t,mv)}
function hatOn(L,view,hy){if(!L.hat)return;const c=L.hatC,sx=view==='side'?.5:0;
  if(L.hat==='cap'){ctx.fillStyle=c;ctx.beginPath();ctx.arc(sx,hy-1.5,6.2,PI,TAU);ctx.fill();if(view==='side'){ctx.beginPath();ctx.ellipse(6.5,hy-1.6,4.2,1.2,.1,0,TAU);ctx.fill()}else if(view==='front')ell(0,hy-1.2,6.4,2.2,shadeHex(c,-.15))}
  else if(L.hat==='bucket'){ell(sx,hy-3.5,8.6,view==='side'?2.4:2.8,c);ell(sx,hy-5.4,5.4,3.4,shadeHex(c,-.08))}
  else{ell(sx,hy-3.6,view==='side'?11:12,view==='side'?2.2:3.4,c);ell(sx,hy-5.6,5,3.2,shadeHex(c,-.06));ctx.fillStyle=L.hat==='straw'?'#b8322a':'#2f6b6b';ctx.fillRect(-5,hy-4.9,10.2,1.3)}}
function carry(L,view,hx,hy,mv,ph){const sw=mv?Math.sin(ph)*.6:0;
  if(L.acc==='briefcase'){ctx.save();ctx.translate(hx,hy);ctx.rotate(sw*.15);ctx.fillStyle='#4a3322';ctx.beginPath();ctx.roundRect(-4,1.2,8,6,1);ctx.fill();ctx.fillStyle='#6b4a32';ctx.fillRect(-4,1.2,8,1.4);limb(-1.4,1.2,-1.4,0,'#2a1d14',.8);limb(1.4,1.2,1.4,0,'#2a1d14',.8);ctx.restore()}
  else if(L.acc==='laptop'){ctx.fillStyle='#2b2e33';ctx.beginPath();ctx.roundRect(hx-4,hy-1,8,7,1.2);ctx.fill();limb(hx-4,hy-1,hx-3,hy-9,'#2b2e33',.8)}
  else if(L.acc==='bags'){for(let i=0;i<L.nb;i++){const bx=hx+(i?-3.5:0)*(view==='side'?1:-1),by=hy+.6;ctx.fillStyle=L.bags[i];ctx.beginPath();ctx.roundRect(bx-3,by+1,6,7.5,.8);ctx.fill();ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(bx-3,by+1,6,1.2);ctx.strokeStyle=shadeHex(L.bags[i],-.3);ctx.lineWidth=.7;ctx.beginPath();ctx.arc(bx,by+1,1.8,PI,TAU);ctx.stroke()}}
  else if(L.acc==='camera'){ctx.fillStyle='#1d1f1f';ctx.fillRect(hx-2,hy-6,4,3)}}
function drawDog(L,view,sx,ph,t,mv){const run=mv?Math.sin(ph*1.5):0,k=1.15,fl=view==='side'?sx:1,dx=view==='side'?sx*17:13,dy=view==='side'?2:5;
  ctx.save();ctx.translate(dx,dy);ctx.scale(fl*k,k);ell(0,1,6,1.6,'rgba(0,0,0,.18)');for(const lx of[-3.5,3.5])limb(lx,-3.5,lx+run*1.4,0,L.dog,1.4);ell(0,-5,5,2.8,L.dog);ell(5.2,-7.2,2.4,2.2,L.dog);ell(7,-6.8,1.4,1,shadeHex(L.dog,-.2));dot(5.6,-7.8,.5,'#111');
  ctx.fillStyle=shadeHex(L.dog,-.25);ctx.beginPath();ctx.ellipse(4.2,-8.2,1,1.8,-.4,0,TAU);ctx.fill();limb(-5,-6,-7,-8+Math.sin(t*12)*1,L.dog,1);ctx.restore();
  const hx=view==='side'?sx*5.2:7.6,hy=-16.5,cx=dx+fl*5*k,cy=dy-7*k;ctx.strokeStyle='rgba(60,40,30,.85)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo((hx+cx)/2,Math.max(hy,cy)+3,cx,cy);ctx.stroke()}
function drawRod(hx,hy,dirx,t,o){const cast=o.cast||0,a=-PI/2.6-Math.sin(cast*PI)*1.1;const L=40,tx=hx+Math.cos(a)*L*dirx*(o.view==='back'?.35:1),ty=hy+Math.sin(a)*L;
  limb(hx,hy,tx,ty,'#3a2f28',1.1);dot(hx-.5*dirx,hy+1.5,1.4,'#8f8e88');
  const bx=o.bob?o.bob[0]:hx+dirx*52,by=o.bob?o.bob[1]:hy+30;ctx.strokeStyle='rgba(240,240,235,.75)';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(lerp(tx,bx,.6),ty+12,bx,by);ctx.stroke();
  const bb=Math.sin(t*2.4+hx)*.8;dot(bx,by+bb,1.4,'#e23a2e');dot(bx,by+bb-1,.8,'#f6f3ea')}

/* ---------- where people go ---------- */
const PEOPLE=[];const SW_OFF=ST_HALF+17;
// sidewalk lines through the city: east-west at each street, north-south at each avenue, either side
const SW_EW=[],SW_NS=[];for(const sy of STS)for(const s of[-1,1])SW_EW.push(sy+s*SW_OFF);for(const ax of AVES)for(const s of[-1,1])SW_NS.push(ax+s*SW_OFF);
const SW_X0=CITY.x0-SW_OFF,SW_X1=OCEAN_DR+SW_OFF,SW_Y0=CITY.y0-SW_OFF,SW_Y1=CITY.y1+SW_OFF;
function mkPerson(kind,r,o){const p={kind,look:personLook(kind,r),x:0,y:0,ph:r()*10,mv:false,face:PI/2,speed:kind==='jogger'?120:kind==='commuter'?72:kind==='angler'?0:48,pause:0,...o};PEOPLE.push(p);return p}
{const r=rng(9090);
  for(let i=0;i<38;i++){const kind=['commuter','commuter','shopper','shopper','tourist','commuter','shopper','dogwalker'][i%8];const ew=r()<.55;
    const p=mkPerson(kind,r,{mode:'grid',axis:ew?'x':'y',c:ew?SW_EW[Math.floor(r()*SW_EW.length)]:SW_NS[Math.floor(r()*SW_NS.length)],dir:r()<.5?1:-1});p.s=ew?lerp(SW_X0,SW_X1,r()):lerp(SW_Y0,SW_Y1,r());}
  // park loop: joggers and dog walkers
  const P=PARK,loop=[[P.x0+36,P.y0+36],[P.x1-36,P.y0+36],[P.x1-36,P.y1-36],[P.x0+36,P.y1-36]];
  for(let i=0;i<5;i++)mkPerson(i<3?'jogger':'dogwalker',r,{mode:'path',path:loop,loop:true,i:Math.floor(r()*4),f:r()});
  // beach walkers on the wet sand by the city
  if(!CENTRAL){for(let i=0;i<4;i++){const ys=[12350,14450];mkPerson(i%2?'walker':'tourist',r,{mode:'beach',dir:r()<.5?1:-1,y:lerp(ys[0],ys[1],r()),y0:ys[0],y1:ys[1]})}
  }
  // anglers: pier rail, surf, ponds, the creek
  const ang=(x,y,face,o={})=>{const p=mkPerson('angler',r,{mode:'fish',face,cast:0,castT:8+r()*25,...o});p.x=x;p.y=y;const d=o.reach||70;p.bob=[x+Math.cos(face)*d,y+Math.sin(face)*d];return p};
  if(!CENTRAL){const cx=coastX(PIER_Y);for(const [dx,s] of[[160,-1],[300,1],[430,-1],[560,1],[640,-1]])ang(cx+dx,PIER_Y+s*16,s<0?-PI/2:PI/2,{reach:60})}
  if(!CENTRAL)for(const y of[CITY.y0+320,CITY.y0+1360,CITY.y0+1700])ang(coastX(y)-24,y,0,{reach:110,spike:true});
  if(!CENTRAL){ang(7702,16335,-PI/2,{reach:70,sit:true});ang(7380,16300,-PI*.25,{reach:80});ang(8020,16290,-PI*.78,{reach:70});ang(6303,4575,-PI/2,{reach:80});
  {const q=riverPoint('Black Creek',.12,1);ang(q.x,q.y,-PI/2,{reach:40})}}
  // farmers between the barn, silos and house
  const FY=[[8495,18070],[8640,18020],[8835,18035],[8700,18120],[8520,18150]];if(!CENTRAL)for(let i=0;i<2;i++)mkPerson('farmer',r,{mode:'path',path:FY,loop:true,i:i*2,f:0});
  // the lighthouse keeper
  if(!CENTRAL){const lx=LH.x-260,ly=LH.y+150;mkPerson('walker',r,{mode:'path',path:[[lx-90,ly],[lx+40,ly],[lx+40,ly+100],[lx-90,ly+100]],loop:true,i:0,f:0}).look.hat='cap'}
  for(const p of PEOPLE)if(p.mode==='path'){const a=p.path[p.i],b=p.path[(p.i+1)%p.path.length];p.x=lerp(a[0],b[0],p.f);p.y=lerp(a[1],b[1],p.f)}}
function gridPos(p){if(p.axis==='x'){p.x=p.s;p.y=p.c}else{p.x=p.c;p.y=p.s}}
function updatePeople(dt){const L=listener();
  for(const p of PEOPLE){if(Math.abs(p.x-L.x)>3200||Math.abs(p.y-L.y)>3200){if(p.mode!=='grid')continue}
    if(p.mode==='fish'){p.mv=false;p.castT-=dt;if(p.castT<=0){p.cast=1;p.castT=14+Math.random()*30}if(p.cast>0)p.cast=Math.max(0,p.cast-dt*.9);continue}
    if(p.pause>0){p.pause-=dt;p.mv=false;continue}
    p.mv=true;p.ph+=dt*(p.look.run?13:9);const sp=p.speed*dt;
    if(p.mode==='grid'){const prev=p.s;p.s+=p.dir*sp;const lo=p.axis==='x'?SW_X0:SW_Y0,hi=p.axis==='x'?SW_X1:SW_Y1;
      if(p.s<lo||p.s>hi){p.s=clamp(p.s,lo,hi);p.dir*=-1}
      const cross=p.axis==='x'?SW_NS:SW_EW;for(const k of cross)if((prev-k)*(p.s-k)<=0&&prev!==k){if(Math.random()<.32){const pos=p.c;p.axis=p.axis==='x'?'y':'x';p.c=k;p.s=pos;p.dir=Math.random()<.5?1:-1}else if(Math.random()<.08&&p.kind==='shopper')p.pause=2+Math.random()*4;break}
      gridPos(p);p.face=p.axis==='x'?(p.dir>0?0:PI):(p.dir>0?PI/2:-PI/2);p.street=!!cityStreet(p.x,p.y)||Math.abs(p.x-roadX(p.y))<ROAD_HALF}
    else if(p.mode==='path'){const a=p.path[p.i],b=p.path[(p.i+1)%p.path.length],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;p.f+=sp/len;if(p.f>=1){p.f=0;p.i=(p.i+1)%p.path.length;if(p.kind==='farmer'||p.kind==='walker')p.pause=1+Math.random()*3}
      const a2=p.path[p.i],b2=p.path[(p.i+1)%p.path.length];p.x=lerp(a2[0],b2[0],p.f);p.y=lerp(a2[1],b2[1],p.f);p.face=Math.atan2(b2[1]-a2[1],b2[0]-a2[0])}
    else if(p.mode==='beach'){p.y+=p.dir*sp;if(p.y<p.y0||p.y>p.y1){p.dir*=-1;p.y=clamp(p.y,p.y0,p.y1)}p.x=coastX(p.y)-34;p.face=p.dir>0?PI/2:-PI/2}}}
function viewOf(face){const c=Math.cos(face),s=Math.sin(face);return Math.abs(s)>Math.abs(c)*1.2?(s<0?'back':'front'):'side'}
function drawPerson(p,t){ctx.save();ctx.translate(p.x,p.y);const v=viewOf(p.face),sx=Math.cos(p.face)>=0?1:-1;
  const o={cast:p.cast,sit:p.look.kind==='angler'&&p.sit};if(p.bob)o.bob=[(p.bob[0]-p.x)/1.15*(v==='side'?sx:1),(p.bob[1]-p.y)/1.15];
  if(p.mode==='fish'&&p.sit){ctx.fillStyle='#d9d4c6';ctx.fillRect(-4,-6,8,6);ctx.fillStyle='#2d55a8';ctx.fillRect(-4,-6,8,1.5)}
  if(p.mode==='fish'&&!p.sit){ctx.fillStyle='#e9e4d6';ctx.beginPath();ctx.roundRect(6,-6,6,6,1);ctx.fill();ctx.fillStyle='#c23b2e';ctx.fillRect(6,-6,6,1.6)}
  if(p.spike){limb(10,0,22,-22,'#8f8e88',1)}
  drawPersonFig(p.look,v,sx,p.ph,p.mv,t,o);ctx.restore()}
function drawPersonBino(p,t){const q=bproj(p.x,p.y,onPier(p.x,p.y)?.45:0);if(!q)return;const k=1.75*q.s/34;if(k*34<3)return;
  const rel=p.face-BV.yaw,c=Math.cos(rel),s=Math.sin(rel),v=c>.7?'back':c<-.7?'front':'side',sx=s>=0?1:-1;
  ctx.save();ctx.translate(q.x,q.y);ctx.scale(k,k);const o={cast:p.cast,sit:p.sit,view:v};drawPersonFig(p.look,v,sx,p.ph,p.mv,t,o);ctx.restore()}

/* ---------- ground textures, one small canvas per grid cell ---------- */
/* ground (G1): each map cell gets a small painted texture. Colours are worked out every 4 units,
   but where two kinds of ground meet (sand and dune, forest floor and swamp water…) the edge is
   worked out every 2 units, so borders stay smooth instead of stepping. */
const TEX=new Map(),TEXRES=4,TEXFINE=3,TEX_KEEP=22;let texBudget=0;
/* Ground textures. Each 100 m cell's full texture is slow to make, so it is built a few milliseconds per frame
   (TEXJOB), cells ahead of the camera first; until it is done the cell shows a quick soft preview (TEXLOW). */
const TEXJOB=new Map(),TEXLOW=new Map(),LOWN=40;let texCam=null,texVel={x:0,y:0};
function texReset(){TEXJOB.clear();TEXLOW.clear();texCam=null}
// high in the plane the ground is far away, so cells are first made at "mid" detail (no edge work); full detail follows once you are low again
const texMid=()=>S.mode==='plane'&&VZ<.8;
function texWant(cx,cy,pri,up){if(cx<0||cy<0||cx*CELL>=WW||cy*CELL>=WH)return;const k=cellKey(cx,cy),have=TEX.get(k);if(have&&!(up&&have.mid))return;
  let J=TEXJOB.get(k);if(!J){const mid=!up&&texMid(),R=mid?TEXRES*2:TEXRES,N=CELL/R,W=N+2;J={k,cx,cy,N,R,mid,F:N*TEXFINE,W,x0:cx*CELL,y0:cy*CELL,cr:new Uint8ClampedArray(W*W*3),img:null,st:0,p:0,pri};TEXJOB.set(k,J)}
  else J.pri=Math.min(J.pri,pri);J.seen=performance.now()}
function texRun(J,dl){const {N,F,W,x0,y0,cr,R:TR,mid}=J;
  // pass 1: colour at every coarse point (one ring wider, to spot edges at the cell border)
  if(J.st===0){const tot=W*W;let p=J.p;
    while(p<tot){const j=Math.floor(p/W)-1,i=p%W-1,col=groundColor(x0+(i+.5)*TR,y0+(j+.5)*TR),o=p*3;cr[o]=col[0];cr[o+1]=col[1];cr[o+2]=col[2];p++;
      if((p&63)===0&&performance.now()>dl){J.p=p;return false}}
    J.st=1;J.p=0;J.img=new ImageData(F,F)}
  const d=J.img.data,put=(px,py,r,gg,bb)=>{const o=(py*F+px)*4;d[o]=r;d[o+1]=gg;d[o+2]=bb;d[o+3]=255};
  // pass 2: where the colour jumps between neighbours, work the edge out at double detail
  let p=J.p;const tot=N*N;
  while(p<tot){const j=Math.floor(p/N),i=p%N,o=((j+1)*W+i+1)*3,r=cr[o],gg=cr[o+1],bb=cr[o+2];p++;
    let edge=false;if(!mid)for(let dj=-1;dj<=1&&!edge;dj++)for(let di=-1;di<=1;di++){const q=o+(dj*W+di)*3;if(Math.abs(cr[q]-r)+Math.abs(cr[q+1]-gg)+Math.abs(cr[q+2]-bb)>40){edge=true;break}}
    if(!edge){for(let b=0;b<TEXFINE;b++)for(let a=0;a<TEXFINE;a++){
        // blend smoothly between this sample and its neighbours (bilinear), so flat ground has no blocks
        const fx=(a+.5)/TEXFINE-.5,fy=(b+.5)/TEXFINE-.5,sx=fx<0?-1:1,sy=fy<0?-1:1,ax=Math.abs(fx),ay=Math.abs(fy);
        const o1=o+sx*3,o2=o+sy*W*3,o3=o+(sy*W+sx)*3,w0=(1-ax)*(1-ay),w1=ax*(1-ay),w2=(1-ax)*ay,w3=ax*ay;
        put(i*TEXFINE+a,j*TEXFINE+b,cr[o]*w0+cr[o1]*w1+cr[o2]*w2+cr[o3]*w3,cr[o+1]*w0+cr[o1+1]*w1+cr[o2+1]*w2+cr[o3+1]*w3,cr[o+2]*w0+cr[o1+2]*w1+cr[o2+2]*w2+cr[o3+2]*w3)}}
    else{for(let b=0;b<TEXFINE;b++)for(let a=0;a<TEXFINE;a++){let R=0,G2=0,B2=0;for(let q=0;q<4;q++){const col=groundColor(x0+(i*TEXFINE+a+(q&1?.75:.25))*TEXRES/TEXFINE,y0+(j*TEXFINE+b+(q&2?.75:.25))*TEXRES/TEXFINE);R+=col[0];G2+=col[1];B2+=col[2]}put(i*TEXFINE+a,j*TEXFINE+b,R/4,G2/4,B2/4)}
      if(performance.now()>dl){J.p=p;return false}}
    if((p&15)===0&&performance.now()>dl){J.p=p;return false}}
  const cvs=document.createElement('canvas');cvs.width=cvs.height=F;cvs.getContext('2d').putImageData(J.img,0,0);
  TEX.set(J.k,{cvs,used:S.t,mid});TEXJOB.delete(J.k);TEXLOW.delete(J.k);
  if(TEX.size>TEX_KEEP){let old=null;for(const [kk,v] of TEX)if(!old||v.used<old[1].used)old=[kk,v];TEX.delete(old[0])}
  return true}
function texWork(ms){const now=performance.now(),dl=now+ms;for(const [k,J] of TEXJOB)if(now-J.seen>2500)TEXJOB.delete(k);
  while(TEXJOB.size&&performance.now()<dl){let best=null;
    for(const J of TEXJOB.values())if(!best||J.pri<best.pri-.01||(Math.abs(J.pri-best.pri)<.01&&(J.st*1e6+J.p)>(best.st*1e6+best.p)))best=J;
    texRun(best,dl)}}
function texLow(cx,cy){const k=cellKey(cx,cy);let c=TEXLOW.get(k);if(c){c.used=S.t;return c}
  if(texBudget<=0)return null;texBudget--;
  const cv=document.createElement('canvas');cv.width=cv.height=LOWN;const g=cv.getContext('2d'),img=g.createImageData(LOWN,LOWN),d=img.data,st=CELL/LOWN;
  for(let j=0;j<LOWN;j++)for(let i=0;i<LOWN;i++){const col=groundColor(cx*CELL+(i+.5)*st,cy*CELL+(j+.5)*st),o=(j*LOWN+i)*4;d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255}
  g.putImageData(img,0,0);c={cvs:cv,used:S.t,low:true};TEXLOW.set(k,c);
  if(TEXLOW.size>60){let old=null;for(const [kk,v] of TEXLOW)if(!old||v.used<old[1].used)old=[kk,v];TEXLOW.delete(old[0])}
  return c}
function cellTex(cx,cy){const k=cellKey(cx,cy);let c=TEX.get(k);if(c){c.used=S.t;if(c.mid&&!texMid())texWant(cx,cy,.3,true);return c}
  texWant(cx,cy,0);return texLow(cx,cy)}
// after drawing: queue the cells the camera is heading into, then spend a few ms on the queue
function texAhead(x0,y0,x1,y1){const now=performance.now(),cx=(x0+x1)/2,cy=(y0+y1)/2;
  if(texCam){const dt=Math.max(.001,(now-texCam.t)/1000),jump=Math.hypot(cx-texCam.x,cy-texCam.y);
    if(jump<3000){const k=Math.min(1,dt*3);texVel.x+=((cx-texCam.x)/dt-texVel.x)*k;texVel.y+=((cy-texCam.y)/dt-texVel.y)*k}else texVel={x:0,y:0}}
  texCam={x:cx,y:cy,t:now};const sp=Math.hypot(texVel.x,texVel.y),hw=(x1-x0)/2+150,hh=(y1-y0)/2+150;
  if(sp>60)for(const la of[.6,1.2,1.9,2.7]){const ax=cx+texVel.x*la,ay=cy+texVel.y*la;
    for(let gy=Math.floor((ay-hh)/CELL);gy<=Math.floor((ay+hh)/CELL);gy++)for(let gx=Math.floor((ax-hw)/CELL);gx<=Math.floor((ax+hw)/CELL);gx++)texWant(gx,gy,la)}
  let vis=false;for(const J of TEXJOB.values())if(J.pri<.5){vis=true;break}
  texWork(vis?7:4)}
const speck=(()=>{const c=document.createElement('canvas');c.width=c.height=160;const g=c.getContext('2d'),r=rng(9);
  for(let i=0;i<700;i++){g.fillStyle=r()<.5?'rgba(0,0,0,.07)':'rgba(255,255,255,.06)';const s=.7+r()*1.6,x=r()*160,y=r()*160;g.beginPath();g.ellipse(x,y,s,s*(.6+r()*.5),r()*3,0,TAU);g.fill()}return mainCtx.createPattern(c,'repeat')})();

/* ---------- the birder: outfits and gear ---------- */
const OUTFITS={
  field:{name:'Field khaki',note:'Bucket hat, olive shirt and a khaki vest with deep pockets.',hat:'bucket',hatC:'#c9b183',band:'#5d4a2d',top:'#6f8250',vest:'#a58a5c',pants:'#6d6450',boot:'#4a3524',pack:'#3f5a43'},
  rain:{name:'Rain shell',note:'Yellow waterproof with the hood up, dark rain pants and green wellies.',hat:'hood',hatC:'#e7b628',top:'#e7b628',trim:'#c7951a',vest:null,pants:'#384049',boot:'#2f5b3b',pack:'#2c3640'},
  winter:{name:'Winter parka',note:'Navy parka, red scarf and a knit beanie for the cold north.',hat:'beanie',hatC:'#c23b2e',pom:'#f1ede4',top:'#2d4a68',trim:'#d9cdb5',scarf:'#c23b2e',vest:null,pants:'#38383d',boot:'#6b4a2e',pack:'#283646',long:true},
  tropic:{name:'Tropical linen',note:'Wide straw hat, sky-blue linen shirt and light trousers for the warm south.',hat:'straw',hatC:'#e3cb8d',band:'#2f6b6b',top:'#bcd5e5',vest:null,pants:'#d6c7a3',boot:'#7a5a3a',pack:'#a0794f'},
  camo:{name:'Woodland camo',note:'Muted camo shirt, vest and cap for getting close to shy birds.',hat:'cap',hatC:'#5b6a3e',top:'#6a7346',pattern:'camo',vest:'#4d5833',pants:'#5a5440',boot:'#3e3022',pack:'#4d5833'}};
const OUTFITS_W={
  field:{name:'Field khaki',note:'Bucket hat, sage shirt, a fitted khaki vest and a low ponytail.',fem:true,hair:'#3e2618',hat:'bucket',hatC:'#cdb48a',band:'#6a3f2e',top:'#7f9160',vest:'#ad9064',pants:'#6a6253',boot:'#4a3524',pack:'#7a4f3a'},
  rain:{name:'Rain shell',note:'Teal waterproof with the hood up, dark leggings and red wellies.',fem:true,hair:'#3e2618',hat:'hood',hatC:'#2f8f8a',top:'#2f8f8a',trim:'#226c68',vest:null,pants:'#2f3640',boot:'#b8322a',pack:'#3a3f46'},
  winter:{name:'Winter parka',note:'Long plum parka, cream scarf and a dusty-rose beanie with a pom.',fem:true,hair:'#3e2618',hat:'beanie',hatC:'#c792a8',pom:'#f4efe3',top:'#6a2f4f',trim:'#d9cdb5',scarf:'#efe6d2',vest:null,pants:'#38383d',boot:'#6b4a2e',pack:'#3a3340',long:true},
  tropic:{name:'Tropical linen',note:'Wide sun hat with a coral ribbon, white linen shirt and sand trousers.',fem:true,hair:'#3e2618',hat:'straw',hatC:'#e8d29a',band:'#d0614e',top:'#f2efe6',vest:null,pants:'#cdb994',boot:'#7a5a3a',pack:'#a0794f'},
  camo:{name:'Woodland camo',note:'Camo cap and shirt with a dark vest, ponytail pulled through the cap.',fem:true,hair:'#3e2618',hat:'cap',hatC:'#5b6a3e',top:'#6a7346',pattern:'camo',vest:'#4d5833',pants:'#5a5440',boot:'#3e3022',pack:'#4d5833'}};
function birderSheet(c,id){const x=c.getContext('2d'),prev=ctx;ctx=x;try{for(const [dir,px] of[['front',65],['side',180],['back',295]]){x.save();x.translate(px,235);x.scale(3.3,3.3);drawBirder({x:0,y:0,dir,sx:1,preview:true,glass:false},0,id);x.restore()}}finally{ctx=prev}return c.toDataURL()}
function outfitDef(id){const T=settings.body==='woman'?OUTFITS_W:OUTFITS;return T[id]||T.field}
const OUTFIT_IDS=Object.keys(OUTFITS);
const SKIN='#e2b48c',HAIR='#5a3e2a',DARK='#1f2222';
function camoClip(x,y,w,h,base){ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,3);ctx.clip();const r=rng(7);
  for(let i=0;i<14;i++){ctx.fillStyle=['#4b5530','#8a8452','#3a3424','#77824e'][i%4];ctx.beginPath();ctx.ellipse(x+r()*w,y+r()*h,1.5+r()*2.5,1+r()*1.6,r()*3,0,TAU);ctx.fill()}ctx.restore()}
function torso(o,x,y,w,h){ctx.fillStyle=o.top;ctx.beginPath();ctx.roundRect(x,y,w,h+(o.long?3:0),3.5);ctx.fill();if(o.pattern==='camo')camoClip(x,y,w,h,o.top);
  if(o.trim){ctx.fillStyle=o.trim;ctx.fillRect(x+w/2-.5,y+2,1,h-2)}}
function drawHat(o,view,hy,face){const c=o.hatC;
  if(o.hat==='bucket'){ell(view==='side'?.5:0,hy-3.5,9.6,view==='side'?2.6:3,c);ell(view==='side'?.5:0,hy-5.4,5.5,3.6,shade(c,-.08));ctx.fillStyle=o.band;ctx.fillRect(-5,hy-4.6,10.4,1.3);return}
  if(o.hat==='straw'){ell(view==='side'?.5:0,hy-3.6,12.5,view==='side'?2.4:3.6,c);ell(view==='side'?.5:0,hy-5.6,5.2,3.4,shade(c,-.06));ctx.fillStyle=o.band;ctx.fillRect(-5.1,hy-4.9,10.4,1.4);
    ctx.strokeStyle=shade(c,-.18);ctx.lineWidth=.5;ctx.beginPath();ctx.ellipse(view==='side'?.5:0,hy-3.6,10,view==='side'?1.8:2.8,0,0,TAU);ctx.stroke();return}
  if(o.hat==='cap'){ctx.fillStyle=c;ctx.beginPath();ctx.arc(view==='side'?.5:0,hy-1.5,6.2,PI,TAU);ctx.fill();
    if(view==='side'){ctx.beginPath();ctx.ellipse(6.5,hy-1.6,4.2,1.2,.1,0,TAU);ctx.fill()}else if(view==='front'){ell(0,hy-1.2,6.4,2.2,shade(c,-.15))}
    dot(view==='side'?.5:0,hy-7.6,1,shade(c,-.2));return}
  if(o.hat==='beanie'){ctx.fillStyle=c;ctx.beginPath();ctx.arc(view==='side'?.5:0,hy-1,6.3,PI*1.02,PI*1.98);ctx.lineTo(6.3,hy-1);ctx.lineTo(-6.3,hy-1);ctx.fill();
    ctx.fillStyle=shade(c,-.18);ctx.fillRect(-6.4,hy-2.6,12.8,2.2);dot(view==='side'?.5:0,hy-7.8,2,o.pom);return}
  if(o.hat==='hood'){ctx.fillStyle=c;if(view==='front'){ctx.beginPath();ctx.arc(0,hy+.3,7.6,PI*.95,PI*2.05);ctx.lineTo(7.4,hy+5);ctx.lineTo(5.6,hy+5);ctx.lineTo(5.4,hy);ctx.arc(0,hy+.4,5.4,0,PI,true);ctx.lineTo(-5.6,hy+5);ctx.lineTo(-7.4,hy+5);ctx.fill();ctx.strokeStyle=o.trim;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,hy+.4,5.6,PI,TAU);ctx.stroke()}
    else if(view==='side'){ctx.beginPath();ctx.arc(-.5,hy,7.2,PI*.45,PI*1.95);ctx.lineTo(4.6,hy-3);ctx.quadraticCurveTo(2,hy-1,2.6,hy+5);ctx.closePath();ctx.fill()}
    else{ctx.beginPath();ctx.arc(0,hy+.3,7.4,0,TAU);ctx.fill();ctx.fillStyle=shade(c,-.12);ctx.beginPath();ctx.moveTo(0,hy-6);ctx.lineTo(0,hy+6);ctx.lineWidth=.8;ctx.strokeStyle=shade(c,-.2);ctx.stroke()}}}
// gear the birder carries: binoculars on the chest, camera at the hip, scope and tripod over the shoulder
function carryGear(view,sh,hy,glass){const g=S.gear;
  if(g==='bino'){if(glass){if(view==='side'){ctx.fillStyle=DARK;ctx.fillRect(3.5,hy-2.6,5.5,3.4)}else if(view==='front'){ctx.fillStyle=DARK;ctx.beginPath();ctx.roundRect(-4.4,hy-2,3.6,4,1.2);ctx.roundRect(.8,hy-2,3.6,4,1.2);ctx.fill();ctx.fillRect(-1,hy-1.2,2,1.6)}}
    else if(view==='front'){limb(-3.5,sh,0,sh+5,'#2a2a2a',.7);limb(3.5,sh,0,sh+5,'#2a2a2a',.7);ctx.fillStyle=DARK;ctx.beginPath();ctx.roundRect(-3,sh+4.5,2.7,3.8,1);ctx.roundRect(.3,sh+4.5,2.7,3.8,1);ctx.fill()}
    else if(view==='side'){ctx.fillStyle=DARK;ctx.fillRect(1.6,sh+3.5,3.4,4.2)}return}
  if(g==='cam'){if(glass){if(view==='side'){ctx.fillStyle=DARK;ctx.fillRect(2,hy-3.4,4,4.4);ctx.fillStyle='#d9d8d2';ctx.beginPath();ctx.roundRect(5.5,hy-2.6,12,3.4,1);ctx.fill();ctx.fillStyle=DARK;ctx.fillRect(16.5,hy-2.9,1.6,4)}
      else if(view==='front'){ctx.fillStyle=DARK;ctx.fillRect(-4,hy-2.6,8,4.6);dot(0,hy-.3,3.4,'#d9d8d2');dot(0,hy-.3,2.2,'#2b3942');dot(-.7,hy-1,.7,'rgba(255,255,255,.6)')}}
    else{if(view!=='back')limb(-3.5,sh,4.5,sh+11,'#2a2a2a',.7);const x=view==='side'?-1:4.2;ctx.fillStyle=DARK;ctx.fillRect(x-1.6,sh+9.5,3.6,3);ctx.fillStyle='#d9d8d2';ctx.beginPath();ctx.roundRect(x-1.2,sh+12.3,2.8,6.5,1);ctx.fill()}return}
  if(g==='scope'&&!glass&&false){// (old carry, replaced by BD3 in drawBirder)
    ctx.save();ctx.translate(view==='side'?-3:4,sh+1);ctx.rotate(view==='side'?-.5:-.35);limb(0,-2,0,20,'#3c3f3d',1.3);limb(-1,-2,-2,19,'#2e302f',1);limb(1,-2,2,19,'#2e302f',1);
    ctx.fillStyle='#4a5a4c';ctx.beginPath();ctx.roundRect(-1.8,-9,3.6,9,1.2);ctx.fill();ctx.fillStyle=DARK;ctx.fillRect(-1.3,-10.5,2.6,1.6);ctx.restore()}}
// the scope standing on its tripod, set up in front of the birder
function drawTripod(x,y,face){ctx.save();ctx.translate(x,y);const s=1.15;ctx.scale(s,s);
  ell(0,1,7,2.4,'rgba(0,0,0,.2)');for(const [lx,ly] of[[-6,0],[5,1],[0,-3]])limb(0,-21,lx,ly,'#3c3f3d',1.2);limb(0,-21,0,-14,'#2e302f',1.4);
  ctx.save();ctx.translate(0,-23);ctx.rotate(face<0?PI:0);ctx.fillStyle='#4a5a4c';ctx.beginPath();ctx.roundRect(-6,-2.4,13,4.8,1.6);ctx.fill();ctx.fillStyle=DARK;ctx.fillRect(6,-2.8,2.2,5.6);ctx.fillRect(-8.5,-1.6,3,3.2);ctx.restore();ctx.restore()}
/* the birder from any direction (C1): legs, arms, pack and head are placed around the facing angle,
   so the figure turns smoothly instead of snapping between front, side and back */
function drawBirder(p,t,outfitId){const o=outfitDef(outfitId||S.outfit),fem=!!o.fem,HC=o.hair||HAIR;
  const glass=p.glass??(S.bino.on&&S.mode==='walk'&&!(S.bino.setup>0)),scopeUp=S.gear==='scope'&&glass,lift=glass&&!scopeUp;
  const a=p.preview&&p.dir?{front:PI/2,back:-PI/2,side:p.sx<0?PI:0}[p.dir]:p.face;
  const fx=Math.cos(a),fy=Math.sin(a),lx=-fy,ly=fx;
  const mv=p.preview?0:clamp(p.mv??(p.moving?1:0),0,1),ph=p.walk||0,sneak=!!p.sneak&&!glass&&!p.preview;
  const ha=a+(p.look||0),hfx=Math.cos(ha),hfy=Math.sin(ha);
  if(scopeUp&&!p.preview){const f=fx>=0?1:-1;drawTripod(p.x+f*14,p.y+4,f)}
  ctx.save();ctx.translate(p.x,p.y);ell(0,1,10,3.6,'rgba(0,0,0,.25)');ctx.scale(1.15,1.15);
  const cr=sneak?3.4:0,bobY=mv?-(1-Math.abs(Math.sin(ph)))*1.1*mv:Math.sin(t*2)*.3;
  const lean=mv*.8+(sneak?1.8:0),bx=fx*lean,by=fy*lean*.4;
  const hip=-12+cr+bobY,sh=hip-12,hy=sh-6.2+(sneak?.8:0);
  const bw=(fem?7.2:8)+(fem?3.4:4)*Math.abs(fy),view=Math.abs(fx)>.72?'side':fy>=0?'front':'back',sg=fx>=0?1:-1;
  const A=(p.stride||STRIDE)/1.15*.85*Math.min(1,mv*3);
  // legs: feet swing along the ground in the walking direction; the moving foot lifts
  const legs=[-1,1].map(s=>{const q=Math.sin(ph+(s>0?0:PI)),vq=Math.cos(ph+(s>0?0:PI)),lift=Math.max(0,vq)*(sneak?1.6:2.6)*Math.min(1,mv*3);
    const hx=lx*2.3*s+bx*.3,hyy=hip+ly*1.1*s,fxp=lx*2.6*s+fx*A*q,fyp=ly*1.2*s+fy*A*q*.42-lift;
    return{s,hx,hyy,fxp,fyp,kx:(hx+fxp)/2+fx*(1.4+cr*.7),ky:(hyy+fyp)/2-.6-cr*.3,dep:ly*s+fy*q*.05}}).sort((m,n)=>m.dep-n.dep);
  const pantsD=shade(o.pants,-.15);
  const drawLegs=()=>{for(const L of legs){const col=L.dep<0?pantsD:o.pants;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=col;ctx.lineWidth=4.2;ctx.beginPath();ctx.moveTo(L.hx,L.hyy);ctx.lineTo(L.kx,L.ky);ctx.lineTo(L.fxp,L.fyp-1.2);ctx.stroke();
    ell(L.fxp+fx*1.2,L.fyp-.5,2.1+.6*Math.abs(fx),1.6,o.boot)}};
  // BD3: scope and tripod carried on the shoulder nearest you; that hand holds the legs
  const carry=S.gear==='scope'&&!glass&&!p.noGear,cs=ly>=0?1:-1,cfx=fx,cfy=fy*.45,clx=lx*cs,cly=ly*cs*.45;
  const P0=[bx+lx*(bw/2-.4)*cs,sh+.6+by+ly*.8*cs],Hf=[P0[0]+cfx*5-clx*1.4,P0[1]+cfy*5+6.2-cly*1.4],Rb=[P0[0]-cfx*5.5+clx*2.8,P0[1]-cfy*5.5-4.6+cly*2.8];
  const tLegs=(a,b,ext)=>{const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,ex=dx/L*ext,ey=dy/L*ext;
    for(const [k,col,w] of [[-1,'#2e302f',1],[1,'#2e302f',1],[0,'#3c3f3d',1.35]])limb(a[0]+nx*k*.75,a[1]+ny*k*.75,b[0]+ex+nx*k*.9,b[1]+ey+ny*k*.9,col,w)};
  const drawCarryFront=()=>{if(!carry)return;tLegs(P0,Hf,2.2)};
  const drawCarryRear=()=>{if(!carry)return;tLegs(P0,Rb,0);const dx=Rb[0]-P0[0],dy=Rb[1]-P0[1],an=Math.atan2(dy,dx);
    ctx.save();ctx.translate(Rb[0],Rb[1]);ctx.rotate(an);ctx.fillStyle='#2e302f';ctx.beginPath();ctx.roundRect(-1.4,-1.6,2.8,3.2,.8);ctx.fill();
    ctx.fillStyle='#4a5a4c';ctx.beginPath();ctx.roundRect(.4,-1.9,5.8,3.8,1.5);ctx.fill();ctx.fillStyle='#5d6f60';ctx.fillRect(1.2,-1.6,3.8,1);
    ctx.fillStyle='#1c1e1d';ctx.beginPath();ctx.roundRect(5.8,-2.2,1.6,4.4,.7);ctx.fill();ctx.restore()};
  const backView=fy<-.3;
  // arms swing against the legs
  const arms=[-1,1].map(s=>{const sx=bx+lx*(bw/2-.6)*s,sy=sh+2+by+ly*.8*s,asw=-Math.sin(ph+(s>0?0:PI))*mv;
    let hx=sx+fx*asw*3.6+fx*(sneak?2:0),hy2=sy+8.2+fy*asw*2-(sneak?1.2:0);
    if(lift){hx=bx*1.2+hfx*3.4+lx*1.6*s;hy2=hy+2.6}else if(scopeUp&&s===(ly>=0?1:-1)){hx=sx+fx*7;hy2=sh+4}else if(carry&&s===cs){hx=Hf[0];hy2=Hf[1]-.6}
    return{s,sx,sy,hx,hy:hy2,dep:ly*s}});
  const drawArm=A2=>{limb(A2.sx,A2.sy,A2.hx,A2.hy,o.top,3.2);dot(A2.hx,A2.hy+.5,1.7,SKIN)};
  const packFirst=fy>-.3;
  const drawPack=()=>{const w=4.5+4.7*Math.abs(fy),px=bx-fx*4.4-w/2,py=sh+1+by-fy*1.2;ctx.fillStyle=o.pack;ctx.beginPath();ctx.roundRect(px,py,w,10,2.4);ctx.fill();
    if(fy<-.3){ctx.fillStyle=shade(o.pack,-.2);ctx.fillRect(px+1.2,py+5,w-2.4,1.2)}};
  if(backView)drawCarryFront();
  if(packFirst)drawPack();
  for(const A2 of arms)if(A2.dep<-.2&&!lift)drawArm(A2);
  drawLegs();
  // torso, vest, scarf
  const tx=bx-bw/2,ty=sh+by;torso(o,tx,ty,bw,13);ctx.fillStyle=shade(SKIN,-.12);ctx.beginPath();ctx.roundRect(bx*1.2-1.7,hy+by+2.5,3.4,ty-(hy+by)-1.5,1);ctx.fill();
  if(o.vest){ctx.fillStyle=o.vest;if(fy>.2){ctx.beginPath();ctx.roundRect(tx,ty+.5,bw*.38,12,2.5);ctx.roundRect(tx+bw*.62,ty+.5,bw*.38,12,2.5);ctx.fill();ctx.fillStyle=shade(o.vest,-.15);ctx.fillRect(tx+.8,ty+6,bw*.25,2.4);ctx.fillRect(tx+bw*.66,ty+6,bw*.25,2.4)}
    else if(fy>=-.2){ctx.beginPath();ctx.roundRect(fx>0?tx+bw-6.5:tx,ty+1,6.5,11,2.5);ctx.fill()}}
  if(o.scarf){ctx.fillStyle=o.scarf;ctx.fillRect(tx+.8,ty-.6,bw-1.6,2.6);if(fy>.2)ctx.fillRect(bx+1,ty+1,2.2,6)}
  if(!packFirst)drawPack();
  if(!backView){drawCarryRear();drawCarryFront()}
  for(const A2 of arms)if(lift?fy>-.3:A2.dep>=-.2)drawArm(A2);
  // head: it can turn a little on its own while you stand and look around
  const hx=bx*1.2,hyH=hy+by,hk=ha+PI;
  if(fem&&o.hat!=='hood'&&hfy>-.3){ctx.fillStyle=HC;const bkx=Math.cos(hk);
    if(Math.abs(hfx)<.72)for(const s of[-1,1]){ctx.beginPath();ctx.ellipse(hx+s*5.1+bkx*.8,hyH+2.2,2.1,4.6,s*.12,0,TAU);ctx.fill()}
    if(Math.abs(hfx)>.25){ctx.beginPath();ctx.ellipse(hx+bkx*3.4,hyH+1.2,4.2,5.2,0,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(hx+bkx*6.2,hyH+4,1.9,4.4,bkx>0?-.35:.35,0,TAU);ctx.fill()}}
  if(o.hat==='hood'){ctx.fillStyle=o.hatC;ctx.beginPath();ctx.moveTo(hx-6.9,hyH+1.5);ctx.lineTo(hx+6.9,hyH+1.5);ctx.lineTo(tx+bw+.4,ty+4);ctx.lineTo(tx-.4,ty+4);ctx.closePath();ctx.fill()}
  dot(hx,hyH,5.8,SKIN);
  if(o.hat!=='hood'){ctx.fillStyle=HC;ctx.beginPath();if(hfy<-.3)ctx.arc(hx,hyH,5.9,-.2,PI+.2);else{const bk=ha+PI;ctx.arc(hx,hyH,5.75,bk-1.1,bk+1.1)}ctx.fill();
    if(fem&&hfy<-.3){ctx.beginPath();ctx.ellipse(hx,hyH+2.8,6.1,4.9,0,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(hx,hyH+7,2.2,3.6,0,0,TAU);ctx.fill()}}
  const phi=Math.atan2(hfx,hfy),feat=l=>{const q=phi+l;return{x:hx+5.25*Math.sin(q),c:Math.cos(q)}};
  if(!lift){const hood=o.hat==='hood';
    if(!fem&&!hood)for(const s of[-1,1]){const e=feat(s*1.62);if(e.c>.45&&Math.cos(phi)>-.3){ell(hx+5.55*Math.sin(phi+s*1.62),hyH+.7,.75+.35*e.c,1.35,shade(SKIN,-.12))}}
    for(const s of[-1,1]){const e=feat(s*.5);if(e.c<.2)continue;ctx.fillStyle='#1a120c';ctx.beginPath();ctx.ellipse(e.x,hyH-.25,.8*Math.max(.55,Math.min(1,e.c*1.3)),.85,0,0,TAU);ctx.fill()}
    const m=feat(0);if(m.c>.45){ctx.strokeStyle='#8a4a3a';ctx.lineWidth=.7;const mw=1.3*Math.min(1,m.c*1.2);ctx.beginPath();ctx.ellipse(m.x,hyH+1.6,mw,.75,0,.25,PI-.25);ctx.stroke()}
    if(Math.abs(Math.sin(phi))>.88&&!hood)dot(hx+5.9*Math.sin(phi),hyH+.5,.95,SKIN)}
  ctx.save();ctx.translate(bx,by);if(view==='side')ctx.scale(sg,1);carryGear(view,sh,hy,glass);ctx.restore();
  if(backView)drawCarryRear();
  if(o.hat==='hood'){const op=Math.cos(phi),c=o.hatC;ctx.fillStyle=c;ctx.beginPath();ctx.arc(hx,hyH+.2,7.5,0,TAU);let ox=0,rx=0;
    if(op>-.2){ox=hx+Math.sin(phi)*3.1;rx=Math.min(5.3*(.4+.6*Math.max(0,op)),5.65-Math.abs(ox-hx));ctx.moveTo(ox+rx,hyH+1);ctx.ellipse(ox,hyH+1,rx,5,0,0,TAU)}ctx.fill('evenodd');
    ctx.strokeStyle=shade(c,-.14);ctx.lineWidth=.6;ctx.beginPath();ctx.arc(hx,hyH+.2,7.2,PI*1.15,PI*1.85);ctx.stroke();
    if(op>-.2){ctx.strokeStyle=o.trim||shade(c,-.2);ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(ox,hyH+1,rx+.3,5.3,0,0,TAU);ctx.stroke()}
    else{ctx.strokeStyle=shade(c,-.2);ctx.lineWidth=.8;const sx=hx-Math.sin(phi)*2.4;ctx.beginPath();ctx.moveTo(sx,hyH-6.6);ctx.quadraticCurveTo(sx+Math.sin(phi)*.8,hyH+1,sx,hyH+7.4);ctx.stroke()}}
  else{ctx.save();ctx.translate(hx,by*0);const hv=Math.abs(hfx)>.72?'side':hfy>=0?'front':'back';if(hv==='side')ctx.scale(hfx>=0?1:-1,1);drawHat(o,hv,hyH);ctx.restore()}
  ctx.restore()}
/* ---------- small decorations ---------- */
/* ---------- birds on the map ---------- */
const OW_S=1.0; // px per cm on the map: birds are drawn larger than life next to trees, but true to each other
function birdOWPos(b){if(b.st==='ledge'&&b.bld!=null){const B=BLD[b.bld];return[b.x,B.y+B.d-bPx(B)]}if((b.st==='perch'||b.st==='trunk')&&!b.hop&&b.tree){const T=treeById(b.tree);if(T){const p=owPt(T,b.perch.x,b.perch.y,b.perch.h);return[p[0],p[1]]}}return[b.x,b.y-b.z*HS]}
function drawBirdOW(b,t){const [x,y]=birdOWPos(b);ctx.save();ctx.translate(x,y);
  if(b.st==='fly'){ctx.restore();return}
  const face=Math.cos(b.hd)>=0?1:-1;
  if(GB[b.sp]){const s=OW_S*gbMapScale(b.sp);drawBird(b.sp,gbPose(b),s,face,{bob:b.bob,tailFlick:b.tail,run:!!b.goal&&b.st==='ground',ph:b.run||0,peck:b.peck,stem:b.st==='reed'?1.1*HS/s:0,water:b.st==='wade'?SPECIES[b.sp].len*GB[b.sp].shape.legs*.6:0});ctx.restore();return}
  if(b.st==='trunk')drawBird('pile','trunk',OW_S,face,{peck:b.peck>0?Math.sin(b.peck*PI*4)*.5:0});
  else if(b.sp==='pipl')drawBird('pipl','stand',OW_S,face,{run:!!b.goal,ph:b.run||0,peck:b.peck});
  else drawBird(b.sp,'perch',OW_S,face,{bob:b.bob,tailFlick:b.tail});
  ctx.restore()}
function flyK(sp){const ws=FL[sp].WS,s=1.1*(GB[sp]?gbMapScale(sp):1);return Math.min(1,(40+Math.max(0,ws-40)*.35)/(ws*s))}
function drawFlyingOW(b,t){const sx=b.x,sy=b.y-b.z*HS;
  ell(b.x,b.y,FL[b.sp].WS*.25*(GB[b.sp]?gbMapScale(b.sp):1)*flyK(b.sp),FL[b.sp].WS*.1*(GB[b.sp]?gbMapScale(b.sp):1)*flyK(b.sp),'rgba(0,0,0,.16)');
  ctx.save();ctx.translate(sx,sy);drawBird(b.sp,'top',OW_S*1.1*(GB[b.sp]?gbMapScale(b.sp):1)*flyK(b.sp),1,{heading:b.hd+PI/2,flap:b.flap});ctx.restore()}
function drawNote(x,y,t,k){const a=Math.min(1,k);ctx.save();ctx.globalAlpha=a;ctx.translate(x+Math.sin(t*4)*3,y-(1.8-k)*14);
  ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.ellipse(-3,4,3.2,2.4,-.4,0,TAU);ctx.fill();ctx.fillRect(-.6,-8,1.8,12);ctx.beginPath();ctx.moveTo(1.2,-8);ctx.quadraticCurveTo(7,-6,5,0);ctx.quadraticCurveTo(5,-4,1.2,-4.5);ctx.fill();ctx.restore()}

/* ---------- roads, fencing, trailhead ---------- */
function drawCityStreets(x0,y0,x1,y1){ctx.save();ctx.beginPath();ctx.rect(-1e5,-1e5,3e5,3e5);for(const sy of ST_GAP)ctx.rect(AVES[2]+ST_HALF+4,sy-ST_HALF-30,AVES[3]-AVES[2]-ST_HALF*2-8,ST_HALF*2+60);ctx.clip('evenodd');drawCityStreets0(x0,y0,x1,y1);ctx.restore()}
let COBBLE=null;function cobble(){if(COBBLE)return COBBLE;const c=document.createElement('canvas');c.width=c.height=36;const g=c.getContext('2d'),r=rng(77);g.fillStyle='#3e4a5a';g.fillRect(0,0,36,36);
  for(let j=0;j<4;j++)for(let i=-1;i<4;i++){const x=i*12+(j%2?6:0),y=j*9;g.fillStyle=['#5f7189','#566880','#677a93','#5a6b84','#6e7f96'][Math.floor(r()*5)];g.beginPath();g.roundRect(x+1,y+1,10,7,2.2);g.fill();g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x+2,y+1.5,7,1.2)}
  return COBBLE=ctx.createPattern(c,'repeat')}
function drawCityStreets0(x0,y0,x1,y1){if(x1<CITY.x0-200||x0>OCEAN_DR+200||y1<CITY.y0-200||y0>CITY.y1+200)return;const H=ST_HALF;
  const ew=[],ns=[];for(const sy of STS)if(sy+H>y0&&sy-H<y1)ew.push(sy);for(const ax of AVES)if(ax+H>x0&&ax-H<x1)ns.push(ax);
  const X0=CITY.x0-H,X1=OCEAN_DR+H,Y0=CITY.y0-H,Y1=CITY.y1+H;
  ctx.fillStyle='#a19e95';for(const sy of ew)ctx.fillRect(X0-4,sy-H-4,X1-X0+8,H*2+8);for(const ax of ns)ctx.fillRect(ax-H-4,Y0-4,H*2+8,Y1-Y0+8);
  if(TSTYLE==='colonial'){ctx.fillStyle=cobble();for(const sy of ew)ctx.fillRect(X0,sy-H,X1-X0,H*2);for(const ax of ns)ctx.fillRect(ax-H,Y0,H*2,Y1-Y0);
    ctx.fillStyle='rgba(30,40,55,.25)';for(const sy of ew)ctx.fillRect(X0,sy-1.5,X1-X0,3);for(const ax of ns)ctx.fillRect(ax-1.5,Y0,3,Y1-Y0);return}
  ctx.fillStyle='#4f5054';for(const sy of ew)ctx.fillRect(X0,sy-H,X1-X0,H*2);for(const ax of ns)ctx.fillRect(ax-H,Y0,H*2,Y1-Y0);
  ctx.fillStyle='#55565a';for(const sy of ew)ctx.fillRect(X0,sy-H+8,X1-X0,H*2-16);for(const ax of ns)ctx.fillRect(ax-H+8,Y0,H*2-16,Y1-Y0);
  const inX=x=>AVES.some(ax=>Math.abs(x-ax)<H+2)||Math.abs(x-roadX(0))<0,inY=y=>STS.some(sy=>Math.abs(y-sy)<H+2);
  // centre lines (double yellow), parking-lane ticks, crosswalks at every corner
  for(const sy of ew){for(let x=Math.max(X0,x0-40);x<Math.min(X1,x1+40);x+=8){if(AVES.some(ax=>Math.abs(x-ax)<H+28))continue;if(CENTRAL)break;ctx.fillStyle='#e8c24a';ctx.fillRect(x,sy-3,8,1.6);ctx.fillRect(x,sy+1.4,8,1.6)}
    ctx.fillStyle='rgba(255,255,255,.7)';for(let x=X0;x<X1;x+=118){if(x<x0-40||x>x1+40)continue;ctx.fillRect(x,sy-H+4,2,30);ctx.fillRect(x,sy+H-34,2,30)}}
  for(const ax of ns){for(let y=Math.max(Y0,y0-40);y<Math.min(Y1,y1+40);y+=8){if(STS.some(sy=>Math.abs(y-sy)<H+28))continue;if(CENTRAL)break;ctx.fillStyle='#e8c24a';ctx.fillRect(ax-3,y,1.6,8);ctx.fillRect(ax+1.4,y,1.6,8)}
    ctx.fillStyle='rgba(255,255,255,.7)';for(let y=Y0;y<Y1;y+=118){if(y<y0-40||y>y1+40)continue;ctx.fillRect(ax-H+4,y,30,2);ctx.fillRect(ax+H-34,y,30,2)}}
  ctx.fillStyle='rgba(250,250,245,.85)';for(const sy of STS)for(const ax of AVES){if(Math.abs(ax-(x0+x1)/2)>(x1-x0)/2+H+40||Math.abs(sy-(y0+y1)/2)>(y1-y0)/2+H+40)continue;if(CENTRAL&&!((ax===AVES[2]||ax===AVES[3])&&(sy===STS[1]||sy===STS[2])))continue;
    for(let k=-H+6;k<H-6;k+=11){ctx.fillRect(ax-H-24,sy+k,20,6);ctx.fillRect(ax+H+4,sy+k,20,6);ctx.fillRect(ax+k,sy-H-24,6,20);ctx.fillRect(ax+k,sy+H+4,6,20)}
    ctx.fillStyle='#55565a';ctx.fillRect(ax-H+2,sy-H+2,H*2-4,H*2-4);ctx.fillStyle='rgba(250,250,245,.85)'}
  // back lots: parking stalls, pool decks
  for(const l of CITY_LOTS){if(l.x1<x0||l.x0>x1||l.y1<y0||l.y0>y1)continue;
    if(l.kind==='parking'){ctx.fillStyle='rgba(255,255,255,.7)';for(let x=l.x0+10;x<l.x1-10;x+=52){ctx.fillRect(x,l.y0+6,2,40);ctx.fillRect(x,l.y1-46,2,40)}ctx.fillStyle='#e8c24a';ctx.fillRect(l.x0+8,(l.y0+l.y1)/2-1,l.x1-l.x0-16,2)}
    if(l.kind==='pool'){const cx=(l.x0+l.x1)/2,cy=(l.y0+l.y1)/2,w=(l.x1-l.x0)*.6,h=(l.y1-l.y0)*.56;ctx.strokeStyle='#f4f1ea';ctx.lineWidth=4;ctx.strokeRect(cx-w/2,cy-h/2,w,h);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.5;for(let k=0;k<3;k++){const ph=(S.t*.3+k/3)%1;ctx.beginPath();ctx.moveTo(cx-w/2+6,cy-h/2+8+ph*(h-16));ctx.quadraticCurveTo(cx,cy-h/2+4+ph*(h-16),cx+w/2-6,cy-h/2+8+ph*(h-16));ctx.stroke()}}}
  // where the streets meet the highway: crosswalks across it
  for(const sy of ew){const hx=roadX(sy);if(hx<x0-100||hx>x1+100)continue;for(let k=-ROAD_HALF+5;k<ROAD_HALF-5;k+=11){ctx.fillRect(hx+k,sy-H-22,6,18);ctx.fillRect(hx+k,sy+H+4,6,18)}}}
const BRIDGES=(()=>{const out=[];let a=null;for(let y=HW0;y<HW1;y+=6){const t=terr(roadX(y),y),w=t===T.LAKE||t===T.SHAL||t===T.DEEP||t===T.MUD;if(w&&a===null)a=y;if(!w&&a!==null){out.push({y0:a-30,y1:y+30});a=null}}return out})();
function drawJetty(p){const r=rng(4242);ctx.fillStyle='rgba(10,30,40,.3)';ctx.fillRect(p.x0+6,p.y0+4,p.x1-p.x0,p.y1-p.y0+14);
  // armour stone either side, then the walkway on top, then the light at the end
  for(let x=p.x0;x<p.x1+30;x+=16)for(const side of[-1,1]){const yy=(side<0?p.y0:p.y1)+(r()-.5)*10,rr=13+r()*9;ctx.fillStyle=['#7d7a73','#8d8a82','#6e6b65','#9a968c'][Math.floor(r()*4)];ctx.beginPath();ctx.ellipse(x+(r()-.5)*8,yy,rr,rr*.72,r()*3,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.ellipse(x-3,yy-4,rr*.5,rr*.3,0,0,TAU);ctx.fill()}
  for(let k=0;k<5;k++){const rr=20+r()*10;ctx.fillStyle=['#7d7a73','#8d8a82','#6e6b65'][k%3];ctx.beginPath();ctx.arc(p.x1+10+(r()-.5)*30,(p.y0+p.y1)/2+(r()-.5)*50,rr,0,TAU);ctx.fill()}
  ctx.fillStyle='#b8b1a0';ctx.fillRect(p.x0,p.y0+8,p.x1-p.x0,p.y1-p.y0-16);ctx.fillStyle='rgba(80,70,55,.25)';for(let x=p.x0+30;x<p.x1;x+=60)ctx.fillRect(x,p.y0+8,2,p.y1-p.y0-16);
  const lx=p.x1-10,ly=(p.y0+p.y1)/2;ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(lx+8,ly+6,14,8,0,0,TAU);ctx.fill();
  ctx.fillStyle='#f2efe6';ctx.fillRect(lx-7,ly-34,14,34);ctx.fillStyle='#c23b2e';ctx.fillRect(lx-7,ly-34,14,8);ctx.fillRect(lx-7,ly-14,14,6);
  const on=(S.t%3)<1.6;ctx.fillStyle=on?'#ffd75a':'#8a7a4a';ctx.beginPath();ctx.arc(lx,ly-38,5,0,TAU);ctx.fill();if(on){ctx.fillStyle='rgba(255,215,90,.25)';ctx.beginPath();ctx.arc(lx,ly-38,14,0,TAU);ctx.fill()}}
function drawPiers(x0,y0,x1,y1){for(const p of PIERS){if(p.x1<x0-60||p.x0>x1+60||p.y1<y0-60||p.y0>y1+60)continue;if(p.kind==='jetty'){drawJetty(p);continue}
    ctx.fillStyle='rgba(10,30,40,.3)';ctx.fillRect(p.x0+6,p.y0+8,p.x1-p.x0,p.y1-p.y0);
    ctx.fillStyle='#5a4632';for(let x=p.x0+10;x<p.x1;x+=40){ctx.fillRect(x,p.y1-2,5,9);ctx.fillRect(x,p.y0-2,5,6)}
    ctx.fillStyle='#a88a64';ctx.fillRect(p.x0,p.y0,p.x1-p.x0,p.y1-p.y0);ctx.fillStyle='rgba(70,50,30,.28)';
    if(p.x1-p.x0>p.y1-p.y0)for(let x=p.x0;x<p.x1;x+=6)ctx.fillRect(x,p.y0,1,p.y1-p.y0);else for(let y=p.y0;y<p.y1;y+=6)ctx.fillRect(p.x0,y,p.x1-p.x0,1);
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(p.x0,p.y0,p.x1-p.x0,3);
    if(p.kind==='pier'){ctx.strokeStyle='#ece6d6';ctx.lineWidth=1.6;for(const yy of[p.y0+2,p.y1-1]){ctx.beginPath();ctx.moveTo(p.x0,yy-9);ctx.lineTo(p.x1,yy-9);ctx.stroke();for(let x=p.x0;x<=p.x1;x+=24)limb(x,yy,x,yy-9,'#ece6d6',1.6)}}}}
function drawBridge(x0,y0,x1,y1){for(const B of BRIDGES)drawBridge1(B,x0,y0,x1,y1)}
function drawBridge1(B,x0,y0,x1,y1){if(B.y1<y0-40||B.y0>y1+40)return;
  for(let y=B.y0;y<B.y1;y+=6){const x=roadX(y);ctx.fillStyle='rgba(10,30,30,.32)';ctx.fillRect(x-ROAD_HALF+8,y+10,ROAD_HALF*2,6)}
  for(const s of[-1,1]){ctx.strokeStyle='#cfcac0';ctx.lineWidth=5;ctx.beginPath();for(let y=B.y0;y<=B.y1;y+=10){const x=roadX(y)+s*(ROAD_HALF+3);y===B.y0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke();
    ctx.strokeStyle='#e9e5da';ctx.lineWidth=2;ctx.beginPath();for(let y=B.y0;y<=B.y1;y+=10){const x=roadX(y)+s*(ROAD_HALF+3);y===B.y0?ctx.moveTo(x,y-7):ctx.lineTo(x,y-7)}ctx.stroke();
    for(let y=B.y0;y<=B.y1;y+=22){const x=roadX(y)+s*(ROAD_HALF+3);limb(x,y,x,y-7,'#cfcac0',2)}}}
const TRACK_RANK={dirt:1,sand:1,paved:2,boardwalk:3};
function trackBridges(t){if(t.br)return t.br;const out=[],p=t.pts;
  for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);let s0=null;
    for(let s=0;s<=L;s+=8){const x=a[0]+(b[0]-a[0])*s/L,y=a[1]+(b[1]-a[1])*s/L,tt=terr(x,y),w=tt===T.LAKE||tt===T.SHAL||tt===T.DEEP||tt===T.MUD||tt===T.ICE;
      if(w&&s0===null)s0=s;if((!w||s+8>L)&&s0!==null){if(s-s0>=12)out.push({a,b,L,s0:Math.max(0,s0-26),s1:Math.min(L,s+26)});s0=null}}}
  return t.br=out}
function drawTrackBridge(t,r){const ux=(r.b[0]-r.a[0])/r.L,uy=(r.b[1]-r.a[1])/r.L,nx=-uy,ny=ux,w=t.w+5,len=r.s1-r.s0,cx=r.a[0]+ux*(r.s0+r.s1)/2,cy=r.a[1]+uy*(r.s0+r.s1)/2;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(uy,ux));const paved=t.kind==='paved';
  ctx.fillStyle='rgba(10,30,40,.3)';ctx.fillRect(-len/2,-w+5,len,w*2+4);
  ctx.fillStyle=paved?'#9a988e':'#8a6a48';ctx.fillRect(-len/2,-w,len,w*2);
  if(paved){ctx.fillStyle='#4d4e51';ctx.fillRect(-len/2,-t.w,len,t.w*2);ctx.fillStyle='#e8c24a';for(let x=-len/2;x<len/2;x+=40)ctx.fillRect(x,-1,22,2)}
  else{ctx.fillStyle='#6e5236';for(let x=-len/2+3;x<len/2;x+=9)ctx.fillRect(x,-w+3,2,w*2-6)}
  ctx.fillStyle=paved?'#d8d6ce':'#5a4430';ctx.fillRect(-len/2,-w-3,len,4);ctx.fillRect(-len/2,w-1,len,4);
  for(let x=-len/2;x<=len/2;x+=paved?30:24){ctx.fillRect(x-2,-w-5,4,7);ctx.fillRect(x-2,w-2,4,7)}
  ctx.restore()}
function drawRoads(x0,y0,x1,y1){
  const vis=TRACKS.filter(t=>!(t.x1<x0-80||t.x0>x1+80||t.y1<y0-80||t.y0>y1+80)).sort((a,b)=>(a.drive?0:TRACK_RANK[a.kind]||1)-(b.drive?0:TRACK_RANK[b.kind]||1));
  const lotsV=LOTS.filter(L=>L[0]>x0-L[2]-80&&L[0]<x1+L[2]+80&&L[1]>y0-L[2]-80&&L[1]<y1+L[2]+80);
  const lotPaint=(pass,hw)=>{for(const L of lotsV){if((L[3]==='hw')!==hw)continue;const k=L[3],c=(r,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(L[0],L[1],r,0,TAU);ctx.fill()};
      if(k==='paved'||k==='hw'){if(!pass)c(L[2]+3,'#8b8a78');else{c(L[2],'#4d4e51');c(L[2]-4,'#535458');if(k==='hw'){ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(L[0],L[1],L[2]-7,0,TAU);ctx.stroke();ctx.fillStyle='#6f8f55';ctx.beginPath();ctx.arc(L[0],L[1],L[2]*.32,0,TAU);ctx.fill()}}}
      else if(k==='sand'){if(!pass)c(L[2],'#ccb47e');else c(L[2]-5,'#d9c28c')}else{if(!pass)c(L[2],'#8f714b');else c(L[2]-5,'#9e7f56')}}};
  for(const pass of[0,1]){lotPaint(pass,false);for(const t of vis){const p=t.pts,rut=Math.round(t.w*.38);
    const sp=(w,col,dash,off=0)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap=dash?'butt':'round';ctx.lineJoin='round';ctx.setLineDash(dash||[]);ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]+off):ctx.moveTo(q[0],q[1]+off));ctx.stroke();ctx.setLineDash([]);ctx.lineCap='butt'};
    if(t.kind==='paved'){if(!pass)sp(t.w*2+6,'#8b8a78');else{sp(t.w*2,'#4d4e51');sp(t.w*2-8,'#535458');sp(2,'#e8c24a',[22,18])}}
    else if(t.kind==='boardwalk'){if(pass){sp(t.w*2+8,'rgba(10,30,20,.28)',null,6);sp(t.w*2,'#a88a64');sp(t.w*2-4,'#5a4632',[1.2,5]);sp(2,'#ece6d6',null,-t.w);sp(2,'#ece6d6',null,t.w)}}
    else if(t.kind==='dirt'){if(!pass)sp(t.w*2,'#8f714b');else if(t.drive)sp(t.w*2-8,'#9e7f56');else{sp(t.w*2-10,'#9e7f56');sp(5,'#82663f',null,-rut);sp(5,'#82663f',null,rut)}}
    else{if(!pass)sp(t.w*2,'#ccb47e');else{sp(t.w*2-10,'#d9c28c');sp(5,'#c4ab74',null,-rut);sp(5,'#c4ab74',null,rut)}}
    if(pass&&t.kind!=='boardwalk')for(const r of trackBridges(t))drawTrackBridge(t,r)}}
  drawCityStreets(x0,y0,x1,y1);
  // where a country road meets a city street, open the curb so the asphalt runs straight in
  for(const t of vis){if(t.kind!=='paved'||t.drive)continue;const p=t.pts;
    for(const [e,q] of[[p[0],p[1]],[p[p.length-1],p[p.length-2]]]){const cs=cityStreet(e[0],e[1],t.w+60);if(!cs)continue;
      const L=Math.hypot(e[0]-q[0],e[1]-q[1]),dx=(e[0]-q[0])/L,dy=(e[1]-q[1])/L;let k;
      if(cs.axis==='y'){if(Math.abs(dx)<.3)continue;k=(cs.c-Math.sign(cs.c-e[0])*(ST_HALF-10)-e[0])/dx}else{if(Math.abs(dy)<.3)continue;k=(cs.c-Math.sign(cs.c-e[1])*(ST_HALF-10)-e[1])/dy}
      if(k<-t.w*2||k>ST_HALF*3)continue;const ax=e[0]-dx*t.w,ay=e[1]-dy*t.w,bx=e[0]+dx*k,by=e[1]+dy*k;
      ctx.lineCap='butt';ctx.strokeStyle='#4d4e51';ctx.lineWidth=t.w*2;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
      ctx.strokeStyle='#535458';ctx.lineWidth=t.w*2-8;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
      // at a corner, carry the crosswalk across the mouth of the road
      ctx.fillStyle='rgba(250,250,245,.85)';const H=ST_HALF;
      if(cs.axis==='y'){const sy=STS.find(v=>Math.abs(v-e[1])<H+t.w);if(sy!==undefined){const xs=cs.c<e[0]?cs.c+H+4:cs.c-H-24;for(let kk=-H+6;kk<H-6;kk+=11)ctx.fillRect(xs,sy+kk,20,6)}}
      else{const sx=AVES.find(v=>Math.abs(v-e[0])<H+t.w);if(sx!==undefined){const ys=cs.c<e[1]?cs.c+H+4:cs.c-H-24;for(let kk=-H+6;kk<H-6;kk+=11)ctx.fillRect(sx+kk,ys,6,20)}}}}
  // the coast highway
  const pts=[];for(let y=Math.max(HW0,Math.floor(y0/40)*40-40);y<=Math.min(HW1,y1+40);y+=40){if(!CENTRAL&&y>HWC_Y0-ST_HALF+40&&y<HWC_Y1+ST_HALF-40){if(pts.length&&pts[pts.length-1]!==null)pts.push(null);continue}pts.push([roadX(y),y])}
  const strokeP=(w,col,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();let mv=true;for(const p of pts){if(!p){mv=true;continue}mv?ctx.moveTo(p[0],p[1]):ctx.lineTo(p[0],p[1]);mv=false}ctx.stroke();ctx.setLineDash([])};
  if(pts.length){strokeP(ROAD_HALF*2+8,'#8b8a78');strokeP(ROAD_HALF*2,'#4a4b4e');strokeP(ROAD_HALF*2-8,'#55565a');
    ctx.save();ctx.translate(-ROAD_HALF+6,0);strokeP(2,'rgba(255,255,255,.75)');ctx.restore();ctx.save();ctx.translate(ROAD_HALF-6,0);strokeP(2,'rgba(255,255,255,.75)');ctx.restore();
    ctx.save();ctx.translate(-2,0);strokeP(2,'#e8c24a',[22,18]);ctx.restore();ctx.save();ctx.translate(2,0);strokeP(2,'#e8c24a',[22,18]);ctx.restore()}
  lotPaint(0,true);lotPaint(1,true)}
function drawFence(f){ctx.strokeStyle='rgba(250,250,245,.85)';ctx.lineWidth=1.2;ctx.strokeRect(f.x,f.y,f.w,f.h);
  for(let i=0;i<=f.w;i+=34)for(const yy of[f.y,f.y+f.h]){limb(f.x+i,yy,f.x+i,yy-9,'#8a6b45',2)}
  for(let j=0;j<=f.h;j+=34)for(const xx of[f.x,f.x+f.w]){limb(xx,f.y+j,xx,f.y+j-9,'#8a6b45',2)}
  // sign
  const sx=f.x-6,sy=f.y+f.h*.5;limb(sx,sy,sx,sy-18,'#6b5236',2);ctx.fillStyle='#f4f1e6';ctx.fillRect(sx-12,sy-30,24,13);ctx.fillStyle='#b8322a';ctx.fillRect(sx-12,sy-30,24,3.5);
  ctx.fillStyle='#2b3a2f';ctx.font='700 4px Fredoka,system-ui';ctx.textAlign='center';ctx.fillText('NESTING',sx,sy-21.5);ctx.fillText('AREA',sx,sy-18.2)}
/* AP-1 drawing: runway and apron on the ground; terminal, tower, hangar, windsock and the DC-3 stand up */
function drawAirportGround(x0,y0,x1,y1){if(!AP)return;const R=AP.rw,A=AP.ap;if(R[2]<x0-50||R[0]>x1+50||A[1]>y1+50||Math.max(R[3],A[3])<y0-50)return;const c=ctx;c.save();
  c.fillStyle='#a3a29b';c.fillRect(A[0],A[1],A[2]-A[0],A[3]-A[1]);c.strokeStyle='rgba(60,60,58,.18)';c.lineWidth=2;
  for(let x=A[0]+100;x<A[2];x+=100){c.beginPath();c.moveTo(x,A[1]);c.lineTo(x,A[3]);c.stroke()}for(let y=A[1]+100;y<A[3];y+=100){c.beginPath();c.moveTo(A[0],y);c.lineTo(A[2],y);c.stroke()}
  c.fillStyle='#6f7a5a';c.fillRect(R[0]-30,R[1]-30,R[2]-R[0]+60,R[3]-R[1]+60);c.fillStyle='#46474a';c.fillRect(R[0],R[1],R[2]-R[0],R[3]-R[1]);
  const cy=(R[1]+R[3])/2,hw=(R[3]-R[1])/2;c.fillStyle='#f2f2ee';c.fillRect(R[0]+20,R[1]+8,R[2]-R[0]-40,4);c.fillRect(R[0]+20,R[3]-12,R[2]-R[0]-40,4);
  for(let x=R[0]+260;x<R[2]-260;x+=200)c.fillRect(x,cy-3,110,6);
  for(const [ex,s] of[[R[0]+30,1],[R[2]-30,-1]]){for(let k=0;k<8;k++){const yy=R[1]+18+k*((hw*2-36)/8);c.fillRect(Math.min(ex,ex+s*90),yy,90,(hw*2-36)/8-8)}
    c.save();c.translate(ex+s*160,cy);c.rotate(s>0?PI/2:-PI/2);c.font='bold 54px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(s>0?'09':'27',0,0);c.restore();
    c.fillRect(Math.min(ex+s*330,ex+s*450),R[1]+28,120,18);c.fillRect(Math.min(ex+s*330,ex+s*450),R[3]-46,120,18)}
  // taxi line from the parking spot to the runway
  const P=AP.plane;c.strokeStyle='#e8c23a';c.lineWidth=5;c.beginPath();c.moveTo(P[0],P[1]);c.lineTo(P[0],cy+(P[1]<cy?-hw-10:hw+10));c.stroke();
  c.beginPath();c.arc(P[0],P[1],70,0,TAU);c.stroke();
  // runway edge lights
  c.fillStyle='#f6e7a0';for(let x=R[0];x<=R[2];x+=150){c.beginPath();c.arc(x,R[1]-14,4,0,TAU);c.arc(x,R[3]+14,4,0,TAU);c.fill()}
  c.restore()}
function apBox(x,y,w,d,h,roof,wall,trim){const c=ctx;c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+10,y+12,w,d);c.fillStyle=wall;c.fillRect(x,y+d-h,w,h);c.fillStyle=roof;c.fillRect(x,y-h,w,d);if(trim){c.fillStyle=trim;c.fillRect(x,y+d-h,w,6)}}
function drawAirportBuildings(items,vis,t){if(!AP)return;const T=AP.term,H=AP.hangar,W=AP.tower;
  if(vis(T[0]+T[2]/2,T[1]+T[3]/2,400))items.push({y:T[1]+T[3],f:()=>{const c=ctx;apBox(T[0],T[1],T[2],T[3],60,'#c9c6bc','#e8e4d8','#2a4a8a');
      c.fillStyle='#3a5a78';for(let x=T[0]+16;x<T[0]+T[2]-20;x+=34)c.fillRect(x,T[1]+T[3]-46,22,26);c.fillStyle='#5a4a3a';c.fillRect(T[0]+T[2]/2-22,T[1]+T[3]-34,44,34);
      c.fillStyle='#1e2a3a';c.font='bold 22px sans-serif';c.textAlign='center';c.fillText(AP.town.toUpperCase()+' AIRPORT',T[0]+T[2]/2,T[1]-30)}});
  if(vis(H[0]+H[2]/2,H[1]+H[3]/2,400))items.push({y:H[1]+H[3],f:()=>{const c=ctx;c.fillStyle='rgba(0,0,0,.22)';c.fillRect(H[0]+10,H[1]+12,H[2],H[3]);
      const g=c.createLinearGradient(0,H[1]-80,0,H[1]+H[3]-80);g.addColorStop(0,'#c8ccd0');g.addColorStop(.5,'#9ea4aa');g.addColorStop(1,'#c8ccd0');c.fillStyle=g;c.fillRect(H[0],H[1]-80,H[2],H[3]);
      c.strokeStyle='rgba(60,64,70,.35)';c.lineWidth=2;for(let y=H[1]-70;y<H[1]+H[3]-80;y+=18){c.beginPath();c.moveTo(H[0],y);c.lineTo(H[0]+H[2],y);c.stroke()}
      c.fillStyle='#7a8088';c.fillRect(H[0],H[1]+H[3]-80,H[2],80);c.fillStyle='#4a5058';c.fillRect(H[0]+20,H[1]+H[3]-70,H[2]-40,70)}});
  if(vis(W[0],W[1],400))items.push({y:W[1]+20,f:()=>{const c=ctx,x=W[0],y=W[1];c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(x+40,y+14,34,12,0,0,TAU);c.fill();
      c.fillStyle='#d8d4c8';c.fillRect(x-14,y-150,28,150);c.fillStyle='#bdb8aa';c.fillRect(x+6,y-150,8,150);c.fillStyle='#2a3a4a';c.fillRect(x-30,y-196,60,46);c.fillStyle='#7ab0d0';c.fillRect(x-26,y-190,52,26);
      c.fillStyle='#e8e4d8';c.fillRect(x-34,y-204,68,10);c.fillStyle=(t%2)<1?'#e83a2a':'#7a2a2a';c.beginPath();c.arc(x,y-214,5,0,TAU);c.fill()}});
  const sk=AP.sock;if(vis(sk[0],sk[1],300))items.push({y:sk[1],f:()=>{const c=ctx,x=sk[0],y=sk[1],wv=Math.sin(t*2.3)*.12;c.strokeStyle='#5a5a5a';c.lineWidth=4;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-90);c.stroke();
      c.save();c.translate(x,y-86);c.rotate(-.15+wv);for(let k=0;k<5;k++){c.fillStyle=k%2?'#f2f2ee':'#e8642a';c.fillRect(k*12,-9+k*.9,12,18-k*1.8)}c.restore()}});
  const P=AIRF.on?AIRF:{x:AP.plane[0],y:AP.plane[1],ang:AP.plane[2],alt:0,prop:0};
  if(vis(P.x,P.y,600))items.push({y:P.alt>.05?1e9:P.y+40,f:()=>drawDC3(P,t)})}
// a DC-3, seen from above: polished metal, blue cheatline, two radial engines
function drawDC3(P,t){const c=ctx,al=P.alt||0,lift=al*160,sc=1+al*.45;c.save();
  // shadow on the ground
  c.save();c.translate(P.x+lift*.5,P.y+8);c.rotate(P.ang);c.scale(1,.9);c.fillStyle=`rgba(0,0,0,${.25-al*.1})`;dc3Shape(c,true);c.restore();
  c.translate(P.x,P.y-lift);c.scale(sc,sc);c.rotate(P.ang);
  // wings
  const wing=s=>{c.beginPath();c.moveTo(42,0);c.lineTo(28,s*145);c.quadraticCurveTo(20,s*150,12,s*145);c.lineTo(-6,0);c.closePath()};
  for(const s of[-1,1]){wing(s);c.fillStyle='#c3c7cb';c.fill();c.strokeStyle='rgba(70,76,84,.45)';c.lineWidth=1.5;c.stroke();c.strokeStyle='rgba(70,76,84,.25)';for(const f of[.35,.7]){c.beginPath();c.moveTo(42-14*f,s*145*f);c.lineTo(-6+18*f,s*145*f);c.stroke()}
    c.fillStyle=s<0?'#c83a2a':'#2a8a4a';c.beginPath();c.arc(20,s*143,3,0,TAU);c.fill()}
  // tailplane
  for(const s of[-1,1]){c.beginPath();c.moveTo(-74,0);c.lineTo(-86,s*50);c.quadraticCurveTo(-94,s*52,-100,s*46);c.lineTo(-98,0);c.closePath();c.fillStyle='#c3c7cb';c.fill();c.strokeStyle='rgba(70,76,84,.45)';c.stroke()}
  // engines and propellers
  for(const s of[-1,1]){const y=s*50;c.fillStyle='#8c9298';c.beginPath();c.ellipse(46,y,30,10,0,0,TAU);c.fill();c.fillStyle='#3a3d42';c.beginPath();c.ellipse(72,y,7,11,0,0,TAU);c.fill();
    if(P.prop>.2){c.fillStyle='rgba(60,60,64,.35)';c.beginPath();c.ellipse(79,y,3,24,0,0,TAU);c.fill()}else{c.strokeStyle='#2a2a2c';c.lineWidth=4;const a=P.spin||.5;c.beginPath();c.moveTo(79,y+Math.cos(a)*22);c.lineTo(79,y-Math.cos(a)*22);c.stroke()}}
  // fuselage
  c.beginPath();dc3Body(c);const fg=c.createLinearGradient(0,-14,0,14);fg.addColorStop(0,'#aeb4ba');fg.addColorStop(.35,'#f2f4f6');fg.addColorStop(.65,'#e2e6ea');fg.addColorStop(1,'#9aa0a6');c.fillStyle=fg;c.fill();
  c.strokeStyle='#2a4a8a';c.lineWidth=3;for(const s of[-1,1]){c.beginPath();c.moveTo(88,s*7);c.lineTo(-70,s*5);c.stroke()}
  c.fillStyle='#1e2a3a';for(let x=-50;x<62;x+=11)for(const s of[-1,1]){c.fillRect(x,s*10-2,6,4)}
  c.fillStyle='#2a3a4e';c.beginPath();c.moveTo(91,-6);c.quadraticCurveTo(97,0,91,6);c.lineTo(86,5);c.lineTo(86,-5);c.closePath();c.fill();
  c.fillStyle='#c83a2a';c.fillRect(-100,-2,30,4);c.restore()}
function dc3Body(c){c.moveTo(97,0);c.bezierCurveTo(97,-9,88,-13,74,-13);c.lineTo(-40,-12);c.bezierCurveTo(-70,-10,-92,-5,-102,-2);c.lineTo(-102,2);c.bezierCurveTo(-92,5,-70,10,-40,12);c.lineTo(74,13);c.bezierCurveTo(88,13,97,9,97,0);c.closePath()}
function dc3Shape(c){c.beginPath();dc3Body(c);c.fill();for(const s of[-1,1]){c.beginPath();c.moveTo(42,0);c.lineTo(28,s*145);c.lineTo(12,s*145);c.lineTo(-6,0);c.fill();c.beginPath();c.moveTo(-74,0);c.lineTo(-88,s*50);c.lineTo(-100,s*46);c.lineTo(-98,0);c.fill()}}
// the flight: taxi from the stand onto the runway, turn west, take off, and travel
const AIRF={on:false};
function boardDC3(k){const P=AP.plane,R=AP.rw,cy=(R[1]+R[3])/2;closeNote&&closeNote();
  Object.assign(AIRF,{on:true,land:false,done:false,to:k,t:0,x:P[0],y:P[1],ang:P[2],alt:0,v:0,prop:0,spin:0,cy,ph:0});
  S.mode='airliner';S.bino.on&&toggleBino&&toggleBino(false);SFX.start&&SFX.start();toast(`Boarding the DC-3 for ${AIRPORTS[k].town}…`,3)}
const apTurn=(a,b,k)=>{const d=((b-a)%TAU+TAU*1.5)%TAU-PI;return a+d*k};
// AP-8/AP-10 arriving: the DC-3 comes in from the far end, touches down, rolls the whole runway, taxis to the stand and you step out
function landDC3(){const P=AP.plane,R=AP.rw,s=AP.end||1,cy=(R[1]+R[3])/2;
  Object.assign(AIRF,{on:true,land:true,done:false,to:null,t:0,x:s>0?R[0]-2400:R[2]+2400,y:cy,ang:s>0?0:PI,alt:1,v:820,prop:1,spin:0,cy,ph:10});
  S.mode='airliner';S.player.x=AIRF.x;S.player.y=AIRF.y;const cs=carSpot(AP.door[0]-60*s,AP.door[1]+40);if(cs){S.car.x=cs[0];S.car.y=cs[1];S.car.v=0}}
function landedDC3(){const sp=landSpot(AP.door[0],AP.door[1]+20)||AP.door;AIRF.on=false;AIRF.land=false;S.mode='walk';Object.assign(S.player,{x:sp[0],y:sp[1],vx:0,vy:0});
  toast(MAP==='britain'?'Welcome to the British Isle. Your DC-3 has landed at Kingsport Airport, just north of town. Your Defender is parked by the terminal; island ferries leave from Port Ardan, the north coast and the south coast.'
    :`Welcome to ${AP.name}, just ${MAP==='east'?'south':'outside'} of ${AP.town}. Your Defender is parked by the terminal.`,5)}
function updateLanding(dt){const F=AIRF,P=AP.plane,R=AP.rw,s=AP.end||1,td=s>0?R[0]+380:R[2]-380,h0=s>0?0:PI;
  if(F.ph===10){F.x+=s*F.v*dt;F.v=Math.max(640,F.v-70*dt);const k=clamp(s*(td-F.x)/2600,0,1);F.alt=k*k*(3-2*k);if(s*(F.x-td)>=0){F.alt=0;F.ph=11;F.v0=F.v;F.x0=F.x}}
  else if(F.ph===11){const L=Math.max(300,Math.abs(P[0]-F.x0)),k=clamp(Math.abs(F.x-F.x0)/L,0,1);F.v=Math.max(45,F.v0*Math.sqrt(Math.max(0,1-k)));F.x+=s*F.v*dt;if(s*(F.x-P[0])>=-1){F.x=P[0];F.ph=12;F.t=0}}
  else if(F.ph===12){const k=Math.min(1,F.t/1.4),e=k*k*(3-2*k);F.ang=apTurn(h0,P[2]+PI,e);if(k>=1){F.ph=13;F.t=0}}
  else if(F.ph===13){const k=Math.min(1,F.t/3),e=k*k*(3-2*k);F.y=F.cy+(P[1]-F.cy)*e;if(k>=1){F.ph=14;F.t=0}}
  else if(F.ph===14){const k=Math.min(1,F.t/1.6),e=k*k*(3-2*k);F.ang=apTurn(P[2]+PI,P[2],e);F.prop=Math.max(0,1-F.t*.6);if(k>=1&&!F.done){F.done=true;F.ang=P[2];setTimeout(landedDC3,500)}}}
// leaving: taxi out to the runway, turn away from the buildings and take off down the whole runway
function updateAirliner(dt){if(!AIRF.on)return;const F=AIRF,P=AP.plane,R=AP.rw,s=AP.end||1,h1=s>0?PI:0;F.t+=dt;F.spin+=dt*30;
  if(F.land){updateLanding(dt);S.player.x=F.x;S.player.y=F.y;S.player.vx=S.player.vy=0;return}F.prop=Math.min(1,F.prop+dt*.8);
  if(F.ph===0){const k=Math.min(1,F.t/3),e=k*k*(3-2*k);F.y=P[1]+(F.cy-P[1])*e;F.ang=P[2];if(k>=1){F.ph=1;F.t=0}}
  else if(F.ph===1){const k=Math.min(1,F.t/1.4),e=k*k*(3-2*k);F.ang=apTurn(P[2],h1,e);if(k>=1){F.ph=2;F.t=0;F.ang=h1;const far=s>0?R[0]+150:R[2]-150;F.acc=900*900/(2*Math.max(600,Math.abs(F.x-far)-250))}}
  else if(F.ph===2){F.v=Math.min(1100,F.v+F.acc*dt);F.x-=s*F.v*dt;if(F.v>700)F.alt=Math.min(1,F.alt+dt*.45);if(F.alt>.85&&!F.done){F.done=true;const to=F.to;setTimeout(()=>goMap(to,AIRPORTS[to].name),900)}}
  S.player.x=F.x;S.player.y=F.y;S.player.vx=S.player.vy=0}
function drawTrailhead(t,TR=TRAIL){if(TR.to==='air')return;if(TR.fdock){drawFerrySign(TR);return}const x=TR.x,y=TR.y,dir=TR.dir||-1,fy=/ferry|pier/i.test(TR.name);
  ctx.fillStyle=fy?'#cbc5b8':'#a49a86';ctx.beginPath();ctx.ellipse(x+40,y,120,70,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.06)';ctx.beginPath();ctx.ellipse(x+40,y-8,100,50,0,0,TAU);ctx.fill();
  // kiosk sign
  limb(x-18,y-10,x-18,y-46,'#5a3e26',4);limb(x+18,y-10,x+18,y-46,'#5a3e26',4);ctx.fillStyle='#5a3e26';ctx.beginPath();ctx.moveTo(x-30,y-46);ctx.lineTo(x,y-60);ctx.lineTo(x+30,y-46);ctx.fill();
  ctx.fillStyle=fy?'#2d5f8a':'#3d5a3a';ctx.fillRect(x-22,y-45,44,26);ctx.fillStyle='#f3e9c8';ctx.font='700 6.5px Fredoka,system-ui';ctx.textAlign='center';ctx.fillText(fy?'FERRY':'TRAILHEAD',x,y-35);ctx.font='600 5.5px Fredoka,system-ui';ctx.fillText('to the',x,y-28);ctx.fillText(TR.dest||'Central',x,y-22);
  const open=CENTRAL?true:speciesSeen()>=trailNeed();ctx.fillStyle=open?'#2f8f5b':'#b8322a';ctx.beginPath();ctx.arc(x+26,y-52,5,0,TAU);ctx.fill();
  // trail into the mountains
  if(fy)return;ctx.strokeStyle='rgba(120,95,65,.8)';ctx.lineWidth=6;ctx.setLineDash([2,6]);ctx.beginPath();ctx.moveTo(x+30*dir,y);ctx.quadraticCurveTo(x+90*dir,y-40,x+150*dir,y-20);ctx.stroke();ctx.setLineDash([])}

/* ---------- world ---------- */
function treeRect(T){const s=T.spr;if(s)return{x0:T.x+s.x0,x1:T.x+s.x0+s.c.width/s.K,y0:T.y+s.y0,y1:T.y+s.y0+s.c.height/s.K};const r=(T.type==='liveoak'?.66:.35)*T.h*M;return{x0:T.x-r,x1:T.x+r,y0:T.y-T.h*HS-10,y1:T.y+4}}
function rectsMeet(a,b){return a.x0<b.x1&&a.x1>b.x0&&a.y0<b.y1&&a.y1>b.y0}
function camTarget(){if(S.mode==='airliner'&&AIRF.on)return{x:AIRF.x+(AIRF.land&&AIRF.ph>=12?0:Math.cos(AIRF.ang)*Math.min(400,AIRF.v*.3)),y:AIRF.y-AIRF.alt*160};if(S.mode==='plane'&&S.boat){const B=S.boat,al=B.alt||0,ap=al*ALT_PX,la=Math.min(lerp(B.v*.3,P_TD*.5,al),(.1+.3*al)*Math.min(VW,VH)/VZ);const lg=la+B.v/5.5*al;return{x:B.x+Math.cos(B.ang)*lg+ap*.16,y:B.y+Math.sin(B.ang)*lg-ap*.55-22}}if(S.mode==='boat'&&S.boat){const B=S.boat;return{x:B.x+Math.cos(B.ang)*B.v*.45,y:B.y+Math.sin(B.ang)*B.v*.45}}if(S.mode==='drive'){const c=S.car;return{x:c.x+Math.cos(c.ang)*c.v*.35,y:c.y+Math.sin(c.ang)*c.v*.35}}return{x:S.player.x,y:S.player.y}}
function drawWorld(t){const vw=VW,vh=VH;if(VZ<.999){VW=vw/VZ;VH=vh/VZ}try{drawWorld0(t)}finally{VW=vw;VH=vh}}
function drawWorld0(t){ctx=mainCtx;ctx.setTransform(DPR*VZ,0,0,DPR*VZ,0,0);
  const cam=S.cam,x0=cam.x-VW/2,y0=cam.y-VH/2,x1=cam.x+VW/2,y1=cam.y+VH/2;
  ctx.fillStyle='#4d6e35';ctx.fillRect(0,0,VW,VH);
  ctx.save();ctx.translate(Math.round(VW/2-cam.x),Math.round(VH/2-cam.y));
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  texBudget=2;sprBudget=60;bsprBudget=6;
  for(let cy=Math.floor(y0/CELL);cy<=Math.floor(y1/CELL);cy++)for(let cx=Math.floor(x0/CELL);cx<=Math.floor(x1/CELL);cx++){
    if(cx<0||cy<0||cx*CELL>=WW||cy*CELL>=WH)continue;const tx=cellTex(cx,cy);
    if(tx)ctx.drawImage(tx.cvs,cx*CELL,cy*CELL,CELL+1,CELL+1);else{ctx.fillStyle=rgb(groundColor(cx*CELL+500,cy*CELL+500));ctx.fillRect(cx*CELL,cy*CELL,CELL+1,CELL+1)}}
  texAhead(x0,y0,x1,y1);
  if(x0<0){ctx.fillStyle='#6f6e69';ctx.fillRect(x0-10,y0-10,-x0+10,VH+20)}
  ctx.save();ctx.globalAlpha=.55;ctx.fillStyle=speck;ctx.fillRect(x0,y0,VW,VH);ctx.restore();
  drawSea(x0,y0,x1,y1,t);drawWaves(x0,y0,x1,y1,t);drawWakes(x0,y0,x1,y1);drawFolk(x0,y0,x1,y1,t);
  drawRoads(x0,y0,x1,y1);drawAirportGround(x0,y0,x1,y1);drawBridge(x0,y0,x1,y1);drawPiers(x0,y0,x1,y1);
  for(const TR of TRAILS)if(Math.abs(TR.x-cam.x)<VW&&Math.abs(TR.y-cam.y)<VH)drawTrailhead(t,TR);
  for(const PD of PDOCKS)if(Math.abs(PD.x-cam.x)<VW&&Math.abs(PD.y-cam.y)<VH)pDockSign(PD);
  for(const f of FENCES)if(f.x<x1&&f.x+f.w>x0&&f.y<y1+40&&f.y+f.h>y0)drawFence(f);
  drawTracks(x0,y0,x1,y1);drawPrints(x0,y0,x1,y1);
  // y-sorted scene
  const items=[],treeBirds=new Map();
  const FOC=S.mode!=='drive'?{x0:S.player.x-15,x1:S.player.x+15,y0:S.player.y-62,y1:S.player.y+4,fy:S.player.y,hit:false}:{x0:S.car.x-62,x1:S.car.x+62,y0:S.car.y-72,y1:S.car.y+28,fy:S.car.y+18,hit:false};
  for(const b of S.birds){if((b.st==='perch'||b.st==='trunk')&&b.tree){let a=treeBirds.get(b.tree);if(!a)treeBirds.set(b.tree,a=[]);const T=treeById(b.tree);if(T){b.py=b.perch.y;b.ph=b.perch.h;a.push(b)}}}
  for(const c of cellsNear(cam.x,cam.y,Math.max(VW,VH)/2+300)){
    for(const T of c.trees){if(T.x<x0-160||T.x>x1+160||T.y<y0-20||T.y>y1+260)continue;
      // trees standing in front of you fade (see-through), or stay solid and you show through as a shaded figure
      const occ=T.y>FOC.fy&&rectsMeet(treeRect(T),FOC);if(occ)FOC.hit=true;T.fa=lerp(T.fa??1,occ&&settings.seeThrough?.3:1,.18);
      items.push({y:T.y,f:()=>drawTreeFast(T,treeBirds.get(T.id),t,T.fa),s:()=>drawTreeShadow(T)})}
    if(VZ>.85)for(const d of c.decor){if(d.x<x0-30||d.x>x1+30||d.y<y0-10||d.y>y1+30)continue;items.push({y:d.y,f:()=>drawDecor(d,t)})}}
  // buildings fade too when you are behind them
  for(const b of buildingsNear(cam.x,cam.y,Math.max(VW,VH)/2+400)){const e=bExtent(b);if(e.x1<x0||e.x0>x1||e.y1<y0||e.y0>y1)continue;
    const occ=b.y+b.d>FOC.fy&&rectsMeet(e,FOC);if(occ)FOC.hit=true;b.fa=lerp(b.fa??1,occ&&settings.seeThrough?.32:1,.18);items.push({y:b.y+b.d,f:()=>drawBuildingFast(b,b.fa),s:()=>drawBuildingShadow(b)})}
  const vis=(x,y,m=160)=>x>x0-m&&x<x1+m&&y>y0-m&&y<y1+m+80;
  for(const v of parkedNear(cam.x,cam.y,Math.max(VW,VH)/2+300))if(vis(v.x,v.y))items.push({y:v.y,f:()=>drawVehicle(v),s:()=>vehShadow(v)});
  for(const v of[...TRAFFIC,TRACTOR])if(vis(v.x,v.y,260))items.push({y:v.y,f:()=>drawVehicle(v),s:()=>vehShadow(v)});
  for(const p of PEOPLE)if(vis(p.x,p.y,40))items.push({y:p.y,f:()=>drawPerson(p,t)});
  for(const b of S.birds)if((b.st==='ground'||b.st==='wade'||b.st==='swim'||b.st==='reed')&&!b.under&&Math.abs(b.x-cam.x)<VW/2+60&&Math.abs(b.y-cam.y)<VH/2+80){items.push({y:b.y,f:()=>{if(b.st!=='swim'){const k=GB[b.sp]?Math.min(1.8,SPECIES[b.sp].len*gbMapScale(b.sp)/18):1;ell(b.x,b.y+.5,6*k,2*k,'rgba(0,0,0,.18)')}drawBirdOW(b,t)}})}
  for(const b of S.birds)if(b.st==='ledge'&&b.bld!=null){const B=BLD[b.bld],sy=B.y+B.d-bPx(B);if(Math.abs(b.x-cam.x)<VW/2+60&&sy>y0-80&&sy<y1+80)items.push({y:B.y+B.d+4,f:()=>drawBirdOW(b,t)})}
  if(S.mode==='walk')items.push({y:S.player.y,f:()=>{drawFacing();drawBirderInWater(S.player,t)}});
  for(const B of BOATS)if(vis(B.x,B.y,B.alt?900:300))items.push({y:B.alt>.02?1e9:B.y+8,f:()=>drawBoat(B,t)});
  for(const F of FERRIES)if(vis(F.x,F.y,700))items.push({y:F.y+30,f:()=>drawFerry(F,t)});
  drawAirportBuildings(items,vis,t);mpDrawItems(items,vis,t);

  items.push({y:S.car.y+18,f:()=>drawCar(S.car,t)});
  for(const it of items)if(it.s)it.s();
  items.sort((a,b)=>a.y-b.y);for(const it of items)it.f();
  // shaded mode: draw the hidden figure on top, darkened as if under the canopy
  if(FOC.hit&&!settings.seeThrough){ctx.save();ctx.globalAlpha=.88;if('filter' in ctx)ctx.filter='brightness(.5) saturate(.7)';if(S.mode==='walk')drawBirder(S.player,t);else drawCar(S.car,t);ctx.restore()}
  for(const b of S.birds)if(b.st==='fly'&&Math.abs(b.x-cam.x)<VW/2+80&&(Math.abs(b.y-cam.y)<VH/2+200||Math.abs(b.y-b.z*HS-cam.y)<VH/2+120))drawFlyingOW(b,t);
  for(const b of S.birds)if(b.note>0){const p=birdOWPos(b);if(Math.abs(p[0]-cam.x)<VW/2&&Math.abs(p[1]-cam.y)<VH/2)drawNote(p[0],p[1]-18,t,b.note)}
  if(S.showBirds)for(const b of S.birds){const p=birdOWPos(b);if(Math.abs(p[0]-cam.x)>VW/2+40||Math.abs(p[1]-cam.y)>VH/2+40)continue;ctx.strokeStyle='#ffc93c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[0],p[1]-6,16,0,TAU);ctx.stroke();namePill(p[0],p[1]-34,SPECIES[b.sp].name.split(' ').slice(-1)[0],'#ffc93c')}
  const u=useTarget();if(u&&PLBL[u]&&!S.bino.on)planeBubble(u,t);else if(u&&u!=='exit'&&!S.bino.on){const gp=GPS.linked&&GPS.mode==='console',bn=u==='board'?boatNear(S.player.x,S.player.y):null,sp=u==='land'?shoreSpot(S.boat):null;
    const at=u==='travel'?(S.trailAt||TRAIL):u==='land'?(sp?{x:sp[0],y:sp[1]}:null):bn||S.car;
    if(at){const yy=at.y-(u==='travel'?74:u==='board'?(bn.craft==='tour'?90:40):u==='land'?16:62),nm=u==='travel'?(at.to==='air'?'Fly':/ferry|pier/i.test(at.name)?'Ferry':'Trailhead'):u==='drive'?'Defender':u==='board'?BOATK[bn.craft].name:'Go ashore',col=u==='travel'?'#ffc93c':u==='board'||u==='land'?'#7fc8e8':'#7fd38f';
      if(gp)bBubble(at.x,yy,nm,col,t);else if(u!=='land')namePill(at.x,yy,nm+' · E',col)}}
  ctx.restore();
  // northern chill / southern warmth tint
  const y=S.cam.y,n=nN(y),s=nS(y);if(SEASON==='winter'){ctx.fillStyle='rgba(205,220,240,.08)';ctx.fillRect(0,0,VW,VH)}else if(SEASON==='fall'){ctx.fillStyle='rgba(255,190,120,.05)';ctx.fillRect(0,0,VW,VH)}if(n>0){ctx.fillStyle=`rgba(200,220,255,${n*.1})`;ctx.fillRect(0,0,VW,VH)}if(s>0){ctx.fillStyle=`rgba(255,220,150,${s*.07})`;ctx.fillRect(0,0,VW,VH)}}
function drawBirderInWater(p,t){const w=p.water;if(!w){drawBirder(p,t);return}
  const sw=w==='swim',cut=sw?2:8,dip=sw?19+Math.sin(t*2.4)*1.2:0;
  ctx.save();ctx.beginPath();ctx.rect(p.x-60,p.y-120,120,120-cut);ctx.clip();ctx.translate(0,dip);drawBirder(p,t);ctx.restore();
  // the water line: a ring of ripples, wider when moving
  const k=p.moving?1:0,r0=sw?12:9;ctx.strokeStyle='rgba(240,250,250,.75)';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(p.x,p.y-cut,r0+k*2,(r0+k*2)*.38,0,0,TAU);ctx.stroke();
  ctx.strokeStyle='rgba(240,250,250,.35)';ctx.beginPath();ctx.ellipse(p.x,p.y-cut,r0+5+Math.sin(t*3)*2,(r0+5)*.38,0,0,TAU);ctx.stroke();
  if(sw&&p.moving){// arms reaching forward in turn
    const ph=(p.walk||0)*.8,fx=Math.cos(p.face),fy=Math.sin(p.face),side=Math.sin(ph)>0?1:-1,reach=Math.abs(Math.sin(ph));
    const sx=p.x-fy*6*side,sy=p.y-cut+fx*2.5*side;ctx.strokeStyle=outfitDef(S.outfit).top;ctx.lineWidth=3.2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(sx,sy-2);ctx.lineTo(sx+fx*10*reach,sy-2+fy*5*reach-reach*5);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<3;i++)ctx.fillRect(sx+fx*10*reach+(i-1)*3,sy+fy*5*reach,2,2)}}
function drawFacing(){if(S.player.water==='swim')return;const p=S.player;if(p.moving)return;const a=p.face;ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(p.x,p.y,34,a-.35,a+.35);ctx.stroke();ctx.setLineDash([]);
  const tx=p.x+Math.cos(a)*40,ty=p.y+Math.sin(a)*40;ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.moveTo(tx+Math.cos(a)*6,ty+Math.sin(a)*6);ctx.lineTo(tx+Math.cos(a+2.3)*5,ty+Math.sin(a+2.3)*5);ctx.lineTo(tx+Math.cos(a-2.3)*5,ty+Math.sin(a-2.3)*5);ctx.fill()}
function drawSea(x0,y0,x1,y1,t){if(ISLE){drawSeaP(x0,y0,x1,y1,t);return}
  // breaking surf along the shore, plus swell lines moving in
  const step=24,ys=Math.floor(y0/step)*step-step;
  for(let k=0;k<4;k++){const ph=((t*.22+k/4)%1),off=6+ph*220;ctx.strokeStyle=`rgba(255,255,255,${(1-ph)*.55})`;ctx.lineWidth=k===0?2.4:1.6;ctx.beginPath();
    for(let y=ys;y<=y1+step;y+=step){const x=coastX(y)+CSD*off+Math.sin(y/90+t+k)*5;y===ys?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
  const ph=(Math.sin(t*1.3)+1)/2;ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();
  for(let y=ys;y<=y1+step;y+=step)ctx.lineTo(coastX(y)+CSD*(-2+ph*10),y);for(let y=y1+step;y>=ys;y-=step)ctx.lineTo(coastX(y)+CSD*(10+ph*16)+Math.sin(y/40+t*2)*3,y);ctx.fill();
}
// Pacific: foam that comes and goes on every shore, and white water on the surf breaks (P-SEA)
function drawSeaP(x0,y0,x1,y1,t){const G=30;
  for(let gy=Math.floor(y0/G)-1;gy<=Math.ceil(y1/G);gy++)for(let gx=Math.floor(x0/G)-1;gx<=Math.ceil(x1/G);gx++){const h=whash(gx+911,gy-37),h2=whash(gy+5,gx+71);
    const x=gx*G+h*G*.8,y=gy*G+h2*G*.8,tt=terr(x,y);if(tt!==T.SHAL&&tt!==T.DEEP)continue;const d=wdist(x,y);if(d>46)continue;
    const ph=(t*.32+h*5)%1,a=Math.sin(ph*PI)*(1-d/46);if(a<.05)continue;ctx.fillStyle=`rgba(255,255,255,${(.6*a).toFixed(3)})`;ctx.beginPath();ctx.ellipse(x,y,8+h2*8,3+h*3,h*PI,0,TAU);ctx.fill()}
  for(const f of WD.folk){if(f[0]!=='break'||f[1]<x0-500||f[1]>x1+500||f[2]<y0-500||f[2]>y1+500)continue;
    for(let k=0;k<4;k++){const ph=(t*.18+k/4)%1,a=Math.sin(ph*PI);ctx.strokeStyle=`rgba(255,255,255,${(.55*a).toFixed(3)})`;ctx.lineWidth=2+a*2.5;ctx.beginPath();
      const yy=f[2]-200+ph*320,w=230+k*24;for(let i=0;i<=16;i++){const u=i/16,xx=f[1]-w/2+u*w,ww=yy+Math.sin(u*PI*2+k)*14-Math.sin(u*PI)*30;i?ctx.lineTo(xx,ww):ctx.moveTo(xx,ww)}ctx.stroke()}}}
// kayakers paddling on the reef, surfers riding the breaks, flags on the golf greens (scenery: they never get in your way)
function drawFolk(x0,y0,x1,y1,t){if(!ISLE)return;
  for(const [k,x,y,a] of WD.folk){if(x<x0-80||x>x1+80||y<y0-80||y>y1+80)continue;const h=whash(x|0,y|0);
    if(k==='kayak'){const ang=a+Math.sin(t*.2+h*9)*.25,dx=Math.cos(t*.25+h*6)*30,dy=Math.sin(t*.21+h*4)*20;ctx.save();ctx.translate(x+dx,y+dy);ctx.rotate(ang);ctx.scale(1.5,1.5);
      ctx.fillStyle='rgba(20,60,70,.25)';ctx.beginPath();ctx.ellipse(3,5,24,6,0,0,TAU);ctx.fill();
      ctx.fillStyle=['#e8742a','#f2c43a','#d23a3a','#2f8fd0'][Math.floor(h*4)];ctx.beginPath();ctx.moveTo(-24,0);ctx.quadraticCurveTo(0,-7,24,0);ctx.quadraticCurveTo(0,7,-24,0);ctx.fill();
      ctx.fillStyle='#2a2a2a';ctx.beginPath();ctx.ellipse(0,0,6,3.4,0,0,TAU);ctx.fill();
      const pa=Math.sin(t*3.2+h*20)*.7;ctx.strokeStyle='#e9e2d0';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-3+Math.sin(pa)*4,-15*Math.cos(pa));ctx.lineTo(3-Math.sin(pa)*4,15*Math.cos(pa));ctx.stroke();
      ctx.fillStyle='#2f6b8a';ctx.beginPath();ctx.ellipse(-1,0,4,4.4,0,0,TAU);ctx.fill();ctx.fillStyle='#c8925a';ctx.beginPath();ctx.arc(-1,0,2.6,0,TAU);ctx.fill();ctx.restore()}
    else if(k==='surf'){const ph=(t*.12+h)%1,run=Math.sin(ph*PI),ang=a,sx=x+Math.cos(ang)*ph*160-80*Math.cos(ang),sy=y+Math.sin(ang)*ph*60;ctx.save();ctx.translate(sx,sy);ctx.scale(1.5,1.5);ctx.translate(-sx,-sy);ctx.translate(sx,sy);ctx.rotate(ang);
      if(run>.3){ctx.strokeStyle=`rgba(255,255,255,${(run*.7).toFixed(2)})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-40,4);ctx.stroke()}
      ctx.fillStyle=['#f6f3ea','#f2c43a','#e86a9a','#6ac0e8'][Math.floor(h*4)];ctx.beginPath();ctx.ellipse(0,0,14,4,0,0,TAU);ctx.fill();ctx.restore();
      ctx.save();ctx.translate(sx,sy);ctx.scale(1.5,1.5);ctx.translate(-sx,-sy);
      if(run>.25){ctx.fillStyle='#2f3e4a';ctx.fillRect(sx-2,sy-15,4,12);ctx.fillStyle='#c8925a';ctx.beginPath();ctx.arc(sx,sy-17,2.6,0,TAU);ctx.fill();ctx.strokeStyle='#c8925a';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(sx-7,sy-12);ctx.lineTo(sx+7,sy-11);ctx.stroke()}
      else{ctx.fillStyle='#2f3e4a';ctx.beginPath();ctx.ellipse(sx,sy-2,3,4,0,0,TAU);ctx.fill();ctx.fillStyle='#c8925a';ctx.beginPath();ctx.arc(sx,sy-5,2.4,0,TAU);ctx.fill()}ctx.restore()}
    else if(k==='flag'){ctx.fillStyle='rgba(30,60,30,.25)';ctx.beginPath();ctx.ellipse(x+12,y+1,14,3,0,0,TAU);ctx.fill();ctx.fillStyle='#2b3a2a';ctx.beginPath();ctx.ellipse(x,y,4.5,2.4,0,0,TAU);ctx.fill();limb(x,y,x,y-46,'#efeae0',2);
      const w=Math.sin(t*3+h*7)*3;ctx.fillStyle='#d23a2a';ctx.beginPath();ctx.moveTo(x,y-46);ctx.quadraticCurveTo(x+9,y-43+w,x+18,y-40+w);ctx.lineTo(x,y-34);ctx.fill()}}}
const whash=(a,b)=>{let h=Math.imul(a|0,374761393)+Math.imul(b|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
function drawWaves(x0,y0,x1,y1,t){const G=130;ctx.lineCap='round';ctx.lineJoin='round';
  for(let gy=Math.floor(y0/G)-1;gy<=Math.ceil(y1/G);gy++)for(let gx=Math.floor(x0/G)-1;gx<=Math.ceil(x1/G);gx++){const h=whash(gx,gy),h2=whash(gy+77,gx-31);
    const x=gx*G+h*G*.85,y=gy*G+h2*G*.85,tt=terr(x,y);if(tt!==T.DEEP&&tt!==T.SHAL&&tt!==T.LAKE)continue;const d=wdist(x,y);if(d<(tt===T.LAKE?26:50))continue;
    const ph=(t*.28+h*7)%1,a=Math.sin(ph*PI);if(a<.06)continue;const k=tt===T.DEEP?1:tt===T.LAKE?.6:.85,w=(15+h2*12)*k,lift=(4.5+h*2)*k,dx=(ph-.5)*10*k,yy=y-ph*3;
    ctx.strokeStyle=`rgba(255,255,255,${(.42*a).toFixed(3)})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-w+dx,yy);ctx.quadraticCurveTo(x-w*.5+dx,yy-lift,x+dx,yy);ctx.quadraticCurveTo(x+w*.5+dx,yy-lift,x+w+dx,yy);ctx.stroke()}}

/* ---------- compass + minimap ---------- */
const cmp=$('compass'),cmpCtx=cmp.getContext('2d');const mm=document.createElement('canvas');mm.width=mm.height=72;let mmT=0,mmAt=null;
const MMZ=[100,42,22,12];
/* R1-R6: north-south bands the birds' ranges will use (with the habitats). y in world units, north at 0. */
const BANDS_BY={britain:[{id:'B-SC',name:'Scotland',sub:'the Highlands, the Flows, the Hebrides, the Northern Isles and Castlegate',y0:0,y1:18000,col:'#3f6fa8'},{id:'B-NE',name:'Northern England',sub:'the Pennines, the Lakes, the Dales and the North Moors',y0:18000,y1:23200,col:'#7a5f8a'},{id:'B-WM',name:'Wales & the Midlands',sub:'Y Moel, the Welsh oakwoods, the Greenwood and the Fens',y0:23200,y1:27800,col:'#c2573a'},{id:'B-S',name:'Southern England',sub:'Kingsport, the Downs, the Forest and the far south-west',y0:27800,y1:36000,col:'#2f8f5b'}],caribbean:[{id:'K',name:'Caribbean Isle',sub:'the main island, Isla Iguana, Isla Cayo and the Cayos de Aves',y0:0,y1:16000,col:'#c2573a'}],pacific:[{id:'P',name:'Pacific Isles',sub:'four high islands, an atoll, the reef and the open ocean',y0:0,y1:24000,col:'#2fa39a'}],west:[{id:'W-AK',name:'Alaska',sub:'tundra, Bering Sea, boreal forest, Ice Range',y0:0,y1:9000,col:'#5f8fa8'},{id:'W-NW',name:'Pacific Northwest',sub:'rainforest, Cinder Peak, basin, Rockies',y0:9000,y1:18500,col:'#2f7a55'},
  {id:'W-CA',name:'California & Great Basin',sub:'Harbor Bay, Central Valley, Sierra, Soda Lake',y0:18500,y1:26500,col:'#c49a3a'},{id:'W-SW',name:'Desert Southwest',sub:'Mojave, Salt Sea, Sonoran desert, Madre Peak',y0:26500,y1:34000,col:'#c06a3a'}],central:[{id:'C-N',name:'North Woods',sub:'boreal forest, Kettle Lake',y0:0,y1:6500,col:'#3f7d5a'},{id:'C-NP',name:'Northern Plains',sub:'parkland, potholes, sagebrush, Pine Ridge',y0:6500,y1:14000,col:'#c9a94a'},
  {id:'C-CP',name:'Central Plains',sub:'high plains, Flint Hills, Cottonwood',y0:14000,y1:21500,col:'#b0812c'},{id:'C-HD',name:'Hills & Desert',sub:'mesas, Hill Country, Sky Peak',y0:21500,y1:28500,col:'#a8623a'},
  {id:'C-G',name:'Rio Verde & Gulf',sub:'thorn forest, coastal prairie, Gulf',y0:28500,y1:34000,col:'#2f7891'}],east:[{id:'R1',name:'Arctic',sub:'tundra, pack ice',y0:0,y1:3000,col:'#7fb3d5'},{id:'R2',name:'Northern Forests',sub:'boreal forest, Loon Lake',y0:3000,y1:12500,col:'#3f7d5a'},
  {id:'R3',name:'North',sub:'hardwoods, farms, Port Bostick',y0:12500,y1:19400,col:'#8aa34a'},{id:'R4',name:'Mid-Atlantic',sub:'hardwoods, Mill Farm',y0:19400,y1:23800,col:'#c9a227'},
  {id:'R5',name:'South',sub:'marsh, swamp, salt marsh',y0:23800,y1:29000,col:'#c9772e'},{id:'R6',name:'Subtropical',sub:'longleaf, sandhills, keys',y0:29000,y1:34000,col:'#b8483a'}]};const BANDS=BANDS_BY[MAP];
function bandAt(y){for(const b of BANDS)if(y<b.y1)return b;return BANDS[BANDS.length-1]}
function drawCompass(t){const L=listener(),SP=MMZ[clamp(S.mmZ??1,0,3)];
  if(t-mmT>.35||!mmAt||Math.hypot(L.x-mmAt.x,L.y-mmAt.y)>SP*7||mmAt.sp!==SP){mmT=t;mmAt={x:L.x,y:L.y,sp:SP};const g=mm.getContext('2d'),img=g.createImageData(72,72),d=img.data;
    for(let j=0;j<72;j++)for(let i=0;i<72;i++){const x=L.x+(i-36)*SP,y=L.y+(j-36)*SP;const c=x<0?[110,110,105]:groundColor(x,y);const o=(j*72+i)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255}g.putImageData(img,0,0)}
  const D=Math.min(devicePixelRatio||1,2),W=140;if(cmp.width!==W*D){cmp.width=cmp.height=W*D}const g=cmpCtx;g.setTransform(D,0,0,D,0,0);g.clearRect(0,0,W,W);
  g.save();g.beginPath();g.arc(70,70,58,0,TAU);g.clip();g.imageSmoothingEnabled=true;const ox=(L.x-mmAt.x)/SP*1.6,oy=(L.y-mmAt.y)/SP*1.6;g.drawImage(mm,70-36*1.6-ox,70-36*1.6-oy,72*1.6,72*1.6);
  const k=1.6/SP;g.strokeStyle='#3b3c40';g.lineWidth=3;g.beginPath();{let f=true;for(let y=Math.max(HW0,L.y-SP*58);y<=Math.min(HW1,L.y+SP*58);y+=SP*2.4){const sx=70+(roadX(y)-L.x)*k,sy=70+(y-L.y)*k;f?g.moveTo(sx,sy):g.lineTo(sx,sy);f=false}}g.stroke();
  for(const tr of TRACKS){if(tr.drive||tr.x1<L.x-SP*62||tr.x0>L.x+SP*62||tr.y1<L.y-SP*62||tr.y0>L.y+SP*62)continue;g.strokeStyle=tr.kind==='paved'?'#3b3c40':tr.kind==='boardwalk'?'#a88a64':'#9a7b52';g.lineWidth=2;g.beginPath();tr.pts.forEach((q,i)=>{const sx=70+(q[0]-L.x)*k,sy=70+(q[1]-L.y)*k;i?g.lineTo(sx,sy):g.moveTo(sx,sy)});g.stroke()}
  g.fillStyle='#6d6a64';for(const b of buildingsNear(L.x,L.y,SP*60)){g.fillRect(70+(b.x-L.x)*k,70+(b.y-L.y)*k,Math.max(1.5,b.w*k),Math.max(1.5,b.d*k))}
  for(const TR of TRAILS){const tx=70+(TR.x-L.x)*k,ty=70+(TR.y-L.y)*k;g.fillStyle='#ffc93c';g.beginPath();g.arc(tx,ty,4,0,TAU);g.fill()}
  for(const B of BOATS){const bx=70+(B.x-L.x)*k,by=70+(B.y-L.y)*k;if(Math.abs(bx-70)<60&&Math.abs(by-70)<60){g.fillStyle=B===S.boat?'#ffc93c':{tour:'#c82846',kayak:'#e6781e',canoe:'#288c46',plane:'#d9482b'}[B.craft];g.beginPath();g.arc(bx,by,2.6,0,TAU);g.fill()}}
  if(S.mode!=='drive'){const cx=70+(S.car.x-L.x)*k,cy=70+(S.car.y-L.y)*k;g.fillStyle='#fff';g.fillRect(cx-3.5,cy-2.5,7,5);g.fillStyle='#3f5a43';g.fillRect(cx-2.5,cy-1.5,5,3)}
  mpMini(g,L,k);
  if(MSG.alert){const a=MSG.alert,ax=70+(a.x-L.x)*k,ay=70+(a.y-L.y)*k;g.fillStyle='rgba(229,55,43,.22)';g.strokeStyle='#e5372b';g.lineWidth=2;g.beginPath();g.arc(ax,ay,Math.max(6,a.r*k),0,TAU);g.fill();g.stroke()}
  if(S.showBirds)for(const b of S.birds){const bx=70+(b.x-L.x)*k,by=70+(b.y-L.y)*k;g.fillStyle=GB[b.sp]?GB[b.sp].c.mm:b.sp==='btbw'?'#2d55a8':b.sp==='pile'?'#e3262c':'#ef8a2a';g.beginPath();g.arc(bx,by,2.4,0,TAU);g.fill()}
  g.restore();
  // ring
  g.lineWidth=10;g.strokeStyle='#ffffff';g.beginPath();g.arc(70,70,63,0,TAU);g.stroke();
  if(MSG.alert){const a=MSG.alert,dx=a.x-L.x,dy=a.y-L.y,dd=Math.hypot(dx,dy);if(dd*1.6/SP>58){const an=Math.atan2(dy,dx),px=70+Math.cos(an)*63,py=70+Math.sin(an)*63;
    g.save();g.translate(px,py);g.rotate(an);g.fillStyle='#e5372b';g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.moveTo(7,0);g.lineTo(-5,-6);g.lineTo(-5,6);g.closePath();g.fill();g.stroke();g.restore()}}g.lineWidth=1.5;g.strokeStyle='#1f3a2c';g.beginPath();g.arc(70,70,58,0,TAU);g.stroke();
  g.font='700 11px Fredoka,system-ui';g.textAlign='center';g.textBaseline='middle';[['N',0,'#c23b2e'],['E',PI/2,'#1f3a2c'],['S',PI,'#1f3a2c'],['W',-PI/2,'#1f3a2c']].forEach(([l,a,c])=>{g.fillStyle=c;g.fillText(l,70+Math.sin(a)*63,70-Math.cos(a)*63+.5)});
  const a=S.mode==='drive'?S.car.ang:S.player.face;g.save();g.translate(70,70);g.rotate(a+PI/2);g.fillStyle='#ffc93c';g.strokeStyle='#1f3a2c';g.lineWidth=1.5;g.beginPath();g.moveTo(0,-8);g.lineTo(6,6);g.lineTo(0,3);g.lineTo(-6,6);g.closePath();g.fill();g.stroke();g.restore()}

/* ---------- full map ---------- */
let bigMap=null;
function renderBigMap(H){const W=Math.round(H*WW/WH),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),img=g.createImageData(W,H),d=img.data;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const x=(i+.5)/W*WW,y=(j+.5)/H*WH,col=groundColor(x,y),o=(j*W+i)*4;const n=fbm(x/1700+11,y/1700+7);const tr=terr(x,y);
    const k=(tr===T.FLOOR&&n>.42)?.84:1;d[o]=col[0]*k;d[o+1]=col[1]*k;d[o+2]=col[2]*k;d[o+3]=255}
  g.putImageData(img,0,0);return{c,W,H}}
/* RT1: region fast travel (Free Play). The full map has a row of region tabs; another region shows a preview of its map
   with its named places, and tapping one travels there (the page reloads into that map). */
const RGN=[['east','East Coast','#2f8f5b'],['central','Central','#c9a227'],['west','West Coast','#3f7fa8'],['pacific','Pacific Isles','#2fa39a'],['caribbean','Caribbean Isle','#c2573a'],['britain','British Isle','#4a5fa8']];
let MAPR=MAP;
const regionWD=k=>BY.MAPS[k];
const regionFeat=k=>k==='east'?FEAT_E:regionWD(k).features.map(([name,x,y,hab])=>({name,x,y,hab}));
const freePlay=()=>settings.play!=='story';
const KEYCOL={pelagic:'#1d5f8a',ocean:'#2f7fa6',reef:'#43c0bf',bay:'#4a9fb0',lake:'#3d7c8c',pond:'#3d7c8c',river:'#3d7c8c',pools:'#7fb3c8',potholes:'#5a95a8',saline:'#dfe3df',pool:'#4fd2e8',
  beach:'#ead6a3',rocky:'#8b8a84',cliffs:'#8b8a84',islets:'#e2d6aa',city:'#a6a49e',park:'#7cab52',golf:'#6cbc54',farm:'#c9c071',arctic:'#a9b293',snow:'#eef3f6',tundra:'#9aa486',
  marsh:'#76884a',saltmarsh:'#9fae5c',swamp:'#3d5638',bog:'#8a9152',mangrove:'#3b5e3c',lava:'#3a3638',cinder:'#8a4f3e',desert:'#d6bf95',mojave:'#e0cfa8',sonoran:'#c9a77c',badlands:'#b5694c',canyon:'#b5694c',
  sandhill:'#cdbb7e',grassland:'#b9b36a',tallgrass:'#98ad4c',mixedgrass:'#b4ab5e',shortgrass:'#c6bc86',coastalprairie:'#a2b357',sagebrush:'#b3b08b',scrub:'#b7a874',chaparral:'#a59a63',dryscrub:'#c8b07a',
  pasture:'#7fae52',cane:'#a8c25c',oakwood:'#4f7a3e',beechwood:'#6a7f40',pinewood:'#3f5a44',glen:'#6f8f52',conifer:'#33503c',downs:'#b4c67e',heath:'#8a7a50',moor:'#7a5f6e',machair:'#c4cf88',meadow:'#9cba5c',kiawe:'#b9ac70',dry:'#b2a66c'};
function keyCol(k){if(KEYCOL[k])return KEYCOL[k];let h=0;for(const c of k)h=(h*31+c.charCodeAt(0))|0;const g=90+(h&31);return`rgb(${55+(h>>5&31)},${g+20},${50+(h>>10&31)})`}
const RPREV={};
function regionPreview(k){if(RPREV[k])return RPREV[k];const D=regionWD(k),W=D.W,H=D.H,S=Math.max(1,Math.ceil(Math.max(W,H)/900)),w=Math.ceil(W/S),h=Math.ceil(H/S);
  const grid=new Uint8Array(W*H),b=atob(D.rle);let p=0,o=0;while(p<b.length){const v=b.charCodeAt(p++);let l=0,sh=0,c;do{c=b.charCodeAt(p++);l|=(c&127)<<sh;sh+=7}while(c&128);grid.fill(v,o,o+l);o+=l}
  const pal=D.keys.map(q=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=keyCol(q);c.fillRect(0,0,1,1);return c.getImageData(0,0,1,1).data});
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d'),img=g.createImageData(w,h),d=img.data;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const c=pal[grid[Math.min(H-1,j*S)*W+Math.min(W-1,i*S)]],q=(j*w+i)*4;d[q]=c[0];d[q+1]=c[1];d[q+2]=c[2];d[q+3]=255}
  g.putImageData(img,0,0);return RPREV[k]={c:cv,WW:W*D.U,WH:H*D.U}}
function goRegion(F){if(S.mode==='plane'&&S.boat&&S.boat.st!=='water'){toggleMap(false);toast('Land the plane first, or fly off the map edge to the next region.',2.6);return}const to=F.region,nm=RGN.find(r=>r[0]===to)[1];toggleMap(false);
  openNote('Fast travel',`Travel to ${F.name}?`,`This takes you to ${F.name} on the ${nm} map. Your journal, photos and gear come with you, and your Defender will be parked nearby.`,
    [['Stay here',null,true],['Travel',()=>{try{travelNote(JSON.stringify({v:2,at:Date.now(),map:to,place:F.name,fast:1,wel:MSG.welRead?1:0}))}catch(e){}
      settings.map=to;try{localStorage.setItem('birding-settings',JSON.stringify(settings))}catch(e){}mpTravelOut(to,null,[F.x,F.y],F.name);travelCard(F.name);setTimeout(()=>location.reload(),MP.room?350:60)}]])}
/* MP1–MP8: the map as a modern maps app. The map fills the screen; region tabs sit in one scrolling row at the top;
   places are small pins with labels that never overlap (less important ones wait until you zoom in); the regions inside
   each map are a coloured rail down the left edge; tapping a pin opens a place card with Travel; a Places list groups
   every place by region. Drag to move, pinch / wheel / + − to zoom, the arrow button finds you again. */
const MAPUI={sheet:'peek',sel:null,key:false,list:null};
const ISLE_OF=(D,x,y)=>{let best='Open ocean',bd=2.2;for(const [n,cx,cy,rx,ry,r] of D.isles){const c=Math.cos(r),s=Math.sin(r),dx=x-cx,dy=y-cy,u=(c*dx+s*dy)/rx,v=(-s*dx+c*dy)/ry,d=u*u+v*v;if(d<=1)return n;if(d<bd){bd=d;best=n}}return best};
const KEYNAME=k=>({pelagic:'Open ocean',ocean:'Ocean',city:'Town',saltmarsh:'Salt marsh',coastalprairie:'Coastal prairie',tallgrass:'Tallgrass prairie',mixedgrass:'Mixed-grass prairie',shortgrass:'Shortgrass prairie',
  skyisland:'Sky island',juniperoak:'Juniper-oak hills',pinyon:'Pinyon-juniper',oakhickory:'Oak-hickory woods',dryscrub:'Dry scrub',subalpine:'Subalpine forest'})[k]||(k?k[0].toUpperCase()+k.slice(1).replace(/([a-z])([A-Z])/g,'$1 $2'):'');
const BR_VILL=new Set(['Porthcarrow','Ashcombe','Little Thatchley','Llanwen','Fenby','Grassmere','Thornby','Ravenscar','Inverard','Kilbrae','Balnamara']);
function mapRegionInfo(k){const own=k===MAP,D=own?WD:regionWD(k),nm=RGN.find(r=>r[0]===k);
  const bands=D.isles&&D.grp!=='bands'?null:(BANDS_BY[k]||[]);
  const groupOf=F=>{if(D.isles&&D.grp!=='bands'){const n=ISLE_OF(D,F.x,F.y);return{id:n,name:n,col:nm[2]}}const b=bands.find(b=>F.y<b.y1)||bands[bands.length-1];return b?{id:b.id,name:b.name,col:b.col}:{id:'',name:nm[1],col:nm[2]}};
  const places=(own?FEATURES:regionFeat(k)).map((F,i)=>{const H=own&&HABITATS[F.hab],cat=H&&HAB_CATS[H.cat];
    const big=F.hab==='city'&&!BR_VILL.has(F.name)||/Port |City|Bahía|Cottonwood|Harbor|Town\b|Kingsport|Castlegate/.test(F.name);
    return{...F,region:own?undefined:k,i,grp:groupOf(F),col:cat?cat.col:keyCol(F.hab),habName:H?H.name:KEYNAME(F.hab),rank:big?0:/pelagic|ocean|Offshore/.test(F.hab+F.name)?2:1}});
  return{k,own,D,nm,bands,places,WW:own?WW:regionPreview(k).WW,WH:own?WH:regionPreview(k).WH}}
let MAPRI=null;
function mapInfo(){if(!MAPRI||MAPRI.k!==MAPR)MAPRI=mapRegionInfo(MAPR);return MAPRI}
function mapLayout(){const el=$('mapWrap'),CW=el.clientWidth,H=el.clientHeight,wide=CW>=700;
  return{CW,H,wide,pad:{t:wide?66:60,b:wide?22:62,l:wide?22:8,r:wide?70:8}}}
function mapFitK(R,Lg){return Math.min((Lg.CW-Lg.pad.l-Lg.pad.r)/R.WW,(Lg.H-Lg.pad.t-Lg.pad.b)/R.WH)}
function mapClampView(R,Lg){const k=MAPV.k,vw=(Lg.CW-Lg.pad.l-Lg.pad.r)/k,vh=(Lg.H-Lg.pad.t-Lg.pad.b)/k;
  MAPV.cx=vw>=R.WW?R.WW/2:clamp(MAPV.cx,vw/2,R.WW-vw/2);MAPV.cy=vh>=R.WH?R.WH/2:clamp(MAPV.cy,vh/2,R.WH-vh/2)}
function mapP(x,y){const Lg=MAPV.Lg,ccx=Lg.pad.l+(Lg.CW-Lg.pad.l-Lg.pad.r)/2,ccy=Lg.pad.t+(Lg.H-Lg.pad.t-Lg.pad.b)/2;return[ccx+(x-MAPV.cx)*MAPV.k,ccy+(y-MAPV.cy)*MAPV.k]}
function mapW(px,py){const Lg=MAPV.Lg,ccx=Lg.pad.l+(Lg.CW-Lg.pad.l-Lg.pad.r)/2,ccy=Lg.pad.t+(Lg.H-Lg.pad.t-Lg.pad.b)/2;return[MAPV.cx+(px-ccx)/MAPV.k,MAPV.cy+(py-ccy)/MAPV.k]}
const MAP_ZMAX=7,MAP_ZDEF=2;   // MP9: the map opens half zoomed in (owner's choice)
function mapHome(k){if(k===MAP){const L=listener();return[L.x,L.y]}const R=mapInfo(),t=R.places.find(F=>F.rank===0);return t?[t.x,t.y]:[R.WW/2,R.WH/2]}
function renderRegionBar(){const bar=$('mapRegions'),fp=freePlay();bar.hidden=!fp;$('mapTitle').hidden=fp;$('mapTitle').textContent=MAP_NAME;if(!fp)return;
  if(bar.dataset.k!==MAPR){bar.innerHTML='';bar.dataset.k=MAPR;
    for(const [k,nm,col] of RGN){const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',k===MAPR);
      b.innerHTML=`<i style="background:${col}"></i><span>${nm}</span>${k===MAP?'<svg class="here" viewBox="0 0 24 24" aria-label="You are here"><path d="M12 2l7 19-7-4-7 4z" fill="currentColor"/></svg>':''}`;
      b.onclick=e=>{e.stopPropagation();mapSwitch(k)};bar.appendChild(b)}
    const on=bar.querySelector('[aria-selected=true]');if(on)requestAnimationFrame(()=>{try{on.scrollIntoView({inline:'center',block:'nearest'})}catch(e){}})}}
function mapSwitch(k){if(k===MAPR)return;if(!BY.MAPS[k]){BY.need(k,()=>mapSwitch(k),()=>toast("Couldn't load that region's map. Check your connection and try again.",3));return}MAPR=k;mapSel=-1;MAPUI.sel=null;MAPUI.sheet='peek';MAPV.z=MAP_ZDEF;[MAPV.cx,MAPV.cy]=mapHome(k);mapWin=null;SFX.click();drawMap()}
function toggleMap(on){const el=$('mapBack'),was=!el.hidden;el.hidden=!on;document.body.classList.toggle('map-open',!!on);if(!on)return;
  if(!was){MAPR=MAP;MAPV.z=MAP_ZDEF;[MAPV.cx,MAPV.cy]=mapHome(MAP);mapSel=-1;MAPUI.sel=null;MAPUI.sheet='peek';MAPUI.key=false}
  drawMap()}
function mapZoom(d,at,factor){const R=mapInfo(),Lg=mapLayout(),k1=mapFitK(R,Lg),z0=MAPV.z,z=clamp(z0*(factor||Math.pow(1.7,d)),1,MAP_ZMAX);if(Math.abs(z-z0)<1e-3)return;
  if(at){const a=mapP(at[0],at[1]);MAPV.z=z;MAPV.k=k1*z;const w=mapW(a[0],a[1]);MAPV.cx+=at[0]-w[0];MAPV.cy+=at[1]-w[1]}
  else{if(z0===1&&MAPUI.sel){MAPV.cx=MAPUI.sel.x;MAPV.cy=MAPUI.sel.y}else if(z0===1&&R.own){const L=listener();MAPV.cx=L.x;MAPV.cy=L.y}MAPV.z=z}
  drawMap()}
function mapCenterOn(x,y){MAPV.cx=x;MAPV.cy=y;drawMap()}
function mapSelect(F,center){MAPUI.sel=F;MAPUI.sheet=F?'card':'peek';if(F){const i=MAPL.findIndex(q=>q.F.name===F.name);if(i>=0)mapSel=i}else mapSel=-1;
  if(F&&center){if(MAPV.z<1.6)MAPV.z=1.7;MAPV.cx=F.x;MAPV.cy=F.y}drawMap();
  if(F&&!center&&MAPV.Lg&&!MAPV.Lg.wide){const c=document.querySelector('#mapSheet .mcard'),p=mapP(F.x,F.y),top=c?c.getBoundingClientRect().top-$('mapWrap').getBoundingClientRect().top:MAPV.H;
    if(p[1]>top-30||p[0]>MAPV.CW-60){const w=mapW(MAPV.CW/2,(MAPV.Lg.pad.t+top)/2);MAPV.cx+=F.x-w[0];MAPV.cy+=F.y-w[1];drawMap()}}
  if(F)SFX.click()}
function mapBackStep(){if(MAPUI.sheet!=='peek'){MAPUI.sheet='peek';MAPUI.sel=null;mapSel=-1;drawMap();return true}toggleMap(false);return false}
function mapDist(F){const L=listener(),m=Math.hypot(F.x-L.x,F.y-L.y)/10;return m<950?Math.round(m/10)*10+' m':(m/1000).toFixed(m<9500?1:0)+' km'}
function renderMapSheet(R,Lg){const sh=$('mapSheet'),st=MAPUI.sheet,gp=GPS.linked&&GPS.mode==='console';sh.dataset.state=st;sh.classList.toggle('wide',Lg.wide);
  const pin=(col)=>`<i class="mdot" style="background:${col}"></i>`;
  if(st==='card'&&MAPUI.sel){const F=MAPUI.sel;
    sh.innerHTML=`<div class="mcard"><div class="mgrab"></div><div class="mchead"><div><h3>${F.name}</h3><p>${pin(F.col)}${F.habName}<span class="msep">·</span>${F.grp.name}</p>${R.own?`<p class="mdist">${mapDist(F)} from you</p>`:`<p class="mdist">On the ${R.nm[1]} map</p>`}</div>
      <button class="mx" type="button" aria-label="Close place">${XSVG}</button></div>
      <div class="mbtns">${freePlay()&&!mpNoFast()?`<button class="mgo" type="button">${GOSVG}${R.own?'Travel here':'Fast travel'}${gp?' <kbd>A</kbd>':''}</button>`:''}<button class="mlist" type="button">${LISTSVG}All places</button></div></div>`;
    sh.querySelector('.mx').onclick=e=>{e.stopPropagation();mapSelect(null)};{const g=sh.querySelector('.mgo');if(g)g.onclick=e=>{e.stopPropagation();fastTravel(F)}};
    sh.querySelector('.mlist').onclick=e=>{e.stopPropagation();MAPUI.sheet='list';MAPUI.sel=null;mapSel=-1;drawMap()};return}
  if(st==='list'){const groups=[];for(const F of R.places){let g=groups.find(q=>q.id===F.grp.id);if(!g)groups.push(g={id:F.grp.id,name:F.grp.name,col:F.grp.col,items:[]});g.items.push(F)}
    if(R.own&&!R.D.isles)groups.forEach(g=>g.items.sort((a,b)=>a.y-b.y));else groups.forEach(g=>g.items.sort((a,b)=>a.name.localeCompare(b.name)));
    sh.innerHTML=`<div class="mlistp"><div class="mgrab"></div><div class="mlhead"><h3>${R.nm[1]}</h3><span>${R.places.length} places</span><button class="mx" type="button" aria-label="Close list">${XSVG}</button></div>
      <div class="mscroll">${groups.map(g=>`<section><h4><i style="background:${g.col}"></i>${g.id&&g.id!==g.name?`<b>${g.id}</b>`:''}${g.name}</h4>${g.items.map(F=>`<button class="mrow" type="button" data-i="${F.i}">${pin(F.col)}<span class="mrn">${F.name}</span><span class="mrh">${R.own?mapDist(F):F.habName}</span></button>`).join('')}</section>`).join('')}</div></div>`;
    sh.querySelector('.mx').onclick=e=>{e.stopPropagation();MAPUI.sheet='peek';drawMap()};
    sh.querySelectorAll('.mrow').forEach(b=>b.onclick=e=>{e.stopPropagation();const F=R.places.find(q=>q.i===+b.dataset.i);mapSelect(F,true)});return}
  sh.innerHTML=`<button class="mpeek" type="button">${LISTSVG}<span>Places</span><em>${R.places.length}</em></button>${gp?`<div class="mgphint">D-pad pick · A select${freePlay()?' · Select region':''}</div>`:''}`;
  sh.querySelector('.mpeek').onclick=e=>{e.stopPropagation();MAPUI.sheet='list';drawMap()}}
const XSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const GOSVG='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 11.5L21 3l-8.5 18-2-7.5z"/></svg>';
const LISTSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3" fill="currentColor"/><circle cx="4.5" cy="12" r="1.3" fill="currentColor"/><circle cx="4.5" cy="18" r="1.3" fill="currentColor"/></svg>';
/* ---------- MP9: one clean map style for every region. The map app's base picture is made from the region's habitat
   grid (not the game's ground texture): flat soft colours per habitat, smooth edges, soft hill shading, crisp shores. ---------- */
const CST={pelagic:'#7db8e2',ocean:'#94cbec',bay:'#a2d4ef',reef:'#9fe0df',lake:'#95ccec',pond:'#95ccec',river:'#95ccec',stream:'#95ccec',pools:'#a9d8ef',potholes:'#9fd0ec',pool:'#8fdcef',saline:'#dfeef1',
  boreal:'#96c48a',highlands:'#94c08c',conifer:'#94c287',pinewood:'#9cc78e',subalpine:'#9cc492',montane:'#9bc68b',ponderosa:'#b0d096',rainforest:'#8dc189',piney:'#a1d191',
  hardwood:'#a9d293',foothills:'#a4cc90',maritime:'#a6d094',southern:'#abd296',oakhickory:'#a9d093',oak:'#c6dca6',oakwood:'#a9d093',beechwood:'#a4cc8e',glen:'#b1d49a',riparian:'#a3d094',
  valley:'#9ecc90',koa:'#9bc98f',wet:'#91c48f',rain:'#92c48e',cloud:'#96bf98',coffee:'#a8cf94',karst:'#a6ca91',aspen:'#b6d69b',
  swamp:'#94c296',mangrove:'#91c19a',bog:'#d3debd',marsh:'#cde5c6',saltmarsh:'#d2e6c4',
  pinyon:'#cfdcab',juniperoak:'#c6d9a5',skyisland:'#bed5a1',pineoak:'#c1d7a2',thorn:'#cfdba9',kiawe:'#d3dbad',mamane:'#c9d9a6',dry:'#ccd9a8',
  scrub:'#dce4b9',chaparral:'#d4dcb0',sagebrush:'#e3e4c9',dryscrub:'#e5e2c0',heath:'#e7dfc8',moor:'#e5d5dd',sandhill:'#ece2bf',
  grassland:'#e1eabe',tallgrass:'#dbe9b6',mixedgrass:'#e2eabd',shortgrass:'#e9ebc6',coastalprairie:'#d9e9b8',meadow:'#d5eab3',pasture:'#d8ebb5',downs:'#dceab9',machair:'#e6efc4',
  farm:'#ece8bf',cane:'#dbe8ad',golf:'#c6e8ab',park:'#c3e4a9',city:'#e9e6e1',
  desert:'#f0e3c3',mojave:'#f3e8cc',sonoran:'#efddbe',badlands:'#ecd2be',canyon:'#e9cfba',cinder:'#ebd3c7',lava:'#d3cecf',
  beach:'#f7edcd',islets:'#f3ead0',rocky:'#ddd9d1',cliffs:'#d9d4cb',tundra:'#e6eadf',arctic:'#e9ede4',snow:'#f8fbfc'};
const CWATER=new Set(['pelagic','ocean','bay','reef','lake','pond','river','stream','pools','potholes','pool']);
const CTREE=new Set(['boreal','highlands','conifer','pinewood','subalpine','montane','ponderosa','rainforest','piney','hardwood','foothills','maritime','southern','oakhickory','oak','oakwood','beechwood','glen','riparian','valley','koa','wet','rain','cloud','coffee','karst','aspen','swamp','mangrove','pinyon','juniperoak','skyisland','pineoak','thorn','kiawe','mamane','dry']);
// height for maps with no mountain table: how high each habitat tends to sit
const CHILL={tundra:1,highlands:.85,foothills:.5,subalpine:.85,montane:.65,skyisland:.9,ponderosa:.45,pinyon:.35,badlands:.4,canyon:.4,juniperoak:.25,cinder:1,cloud:.75,moor:.55,pinewood:.35,mamane:.6,koa:.45,wet:.4,cliffs:.35,karst:.35,coffee:.45,rain:.5,boreal:.12,heath:.15,downs:.2};
const CFIELD={crop:'#efe6b2',hay:'#ebeab8',pasture:'#d6eab1'};
const CFIELD_SAT={crop:['#79a440','#c2ad52','#8b6a3e','#9db84e','#cdb95e','#6c9a3c','#a7843f'],hay:['#a8b35a','#c3b867','#9fae52'],pasture:['#7fae4c','#88b452','#78a647']};
// MP10 Satellite: realistic colours per habitat, texture amounts [fine canopy, broad mottle]
const CSAT={pelagic:'#1b5f9e',ocean:'#2a7cc0',bay:'#3b8fc4',reef:'#2f9fc0',lake:'#2f7fae',pond:'#3a86ad',river:'#3a86b0',stream:'#3a86b0',pools:'#4a93b3',potholes:'#3d88b0',pool:'#4fc3dc',saline:'#a9c4c2',
  boreal:'#2f5a2c',highlands:'#2e5530',conifer:'#2f5b2d',pinewood:'#36612f',subalpine:'#3a5f35',montane:'#37602f',ponderosa:'#56743a',rainforest:'#2a5a2a',piney:'#3c6a2f',
  hardwood:'#3f6e2e',foothills:'#3e6a30',maritime:'#46713a',southern:'#456f30',oakhickory:'#466f2f',oak:'#6c7d3e',oakwood:'#43702f',beechwood:'#3f6a2c',glen:'#4d7638',riparian:'#3f6f32',
  valley:'#3b6c30',koa:'#3d6b31',wet:'#356a33',rain:'#336833',cloud:'#3e6440',coffee:'#4f7a36',karst:'#4a7136',aspen:'#5c7f3c',swamp:'#36572f',mangrove:'#2f5a35',
  pinyon:'#6f7546',juniperoak:'#66743f',skyisland:'#4f6a3a',pineoak:'#566e3a',thorn:'#7a7a48',kiawe:'#7f7c4c',mamane:'#6b7742',dry:'#727a44',
  scrub:'#8a8f52',chaparral:'#6f7745',sagebrush:'#a3a283',dryscrub:'#a29a6e',heath:'#8c7a5c',moor:'#8a6f6c',sandhill:'#c7b47e',bog:'#857f52',marsh:'#7f8f4a',saltmarsh:'#8a9a52',
  grassland:'#b3ad66',tallgrass:'#a3a85a',mixedgrass:'#b4ae6a',shortgrass:'#c2b67a',coastalprairie:'#a1aa5c',meadow:'#8fb257',pasture:'#8db35a',downs:'#9ab65f',machair:'#a8c070',
  farm:'#a9a65e',cane:'#7fa54a',golf:'#6fae4f',park:'#6ea84c',city:'#8f8c86',
  desert:'#d3b98c',mojave:'#d8c49a',sonoran:'#c9a87c',badlands:'#c39b7a',canyon:'#b98a68',cinder:'#8e5a48',lava:'#3d3a3c',
  beach:'#e7d4a0',islets:'#e3d2a4',rocky:'#8f8b82',cliffs:'#9a948a',tundra:'#8e9670',arctic:'#c9cfc5',snow:'#f1f4f6'};
const CSAT_TX=k=>CTREE.has(k)?(/pinyon|juniperoak|thorn|kiawe|mamane|dry|pineoak/.test(k)?[.18,.12]:[.26,.10]):/scrub|chaparral|sagebrush|dryscrub|heath|moor|sandhill/.test(k)?[.12,.12]:
  /marsh|saltmarsh|bog/.test(k)?[.10,.24]:/grass|prairie|meadow|pasture|downs|machair|farm|cane|golf|park/.test(k)?[.05,.10]:/rocky|cliffs|tundra|arctic|cinder|lava|badlands|canyon/.test(k)?[.09,.14]:
  /desert|mojave|sonoran|beach|islets/.test(k)?[.03,.06]:[0,0];
const CSEA=new Set(['pelagic','ocean','bay','reef']);
const MSTY=()=>settings.mapStyle==='sat'?'sat':'map';
// a smooth tiling noise (256 x 256, blurred), sampled in world units; no grain
const CNOISE=(()=>{const N=256,a=new Float32Array(N*N),b=new Float32Array(N*N),r=rng(4242);for(let i=0;i<a.length;i++)a[i]=r();
  for(let p=0;p<2;p++){for(let y=0;y<N;y++)for(let x=0;x<N;x++){let s=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)s+=a[((y+dy)&255)*N+((x+dx)&255)];b[y*N+x]=s/9}a.set(b)}
  let lo=1,hi=0;for(const v of a){lo=Math.min(lo,v);hi=Math.max(hi,v)}for(let i=0;i<a.length;i++)a[i]=(a[i]-lo)/(hi-lo);return a})();
function cnoise(x,y){const fx=x-Math.floor(x),fy=y-Math.floor(y),i=Math.floor(x)&255,j=Math.floor(y)&255,i1=(i+1)&255,j1=(j+1)&255,A=CNOISE;
  return (A[j*256+i]*(1-fx)+A[j*256+i1]*fx)*(1-fy)+(A[j1*256+i]*(1-fx)+A[j1*256+i1]*fx)*fy}
const CARTO={};
function cartoRGB(s){const c=document.createElement('canvas').getContext('2d');c.fillStyle=s;c.fillRect(0,0,1,1);return c.getImageData(0,0,1,1).data}
function cartoData(k){if(CARTO[k])return CARTO[k];const D=regionWD(k),W=D.W,H=D.H,U=D.U;
  const grid=new Uint8Array(W*H),b=atob(D.rle);let p=0,o=0;while(p<b.length){const v=b.charCodeAt(p++);let l=0,sh=0,c;do{c=b.charCodeAt(p++);l|=(c&127)<<sh;sh+=7}while(c&128);grid.fill(v,o,o+l);o+=l}
  const nk=D.keys.length,col=new Float32Array(nk*3),wat=new Uint8Array(nk),tree=new Uint8Array(nk),hill=new Float32Array(nk);
  D.keys.forEach((q,i)=>{const c=cartoRGB(CST[q]||keyCol(q));col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];wat[i]=CWATER.has(q)?1:0;tree[i]=CTREE.has(q)?1:0;hill[i]=CHILL[q]||0});
  // round off the blocky steps of the habitat grid: a weighted majority over 11 x 11 cells; water keeps thin streams
  {const R=5,wt=[],acc=new Float32Array(nk),sm=grid.slice();let tot=0;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const w=Math.exp(-(dx*dx+dy*dy)/(2*2.6*2.6));wt.push(w);tot+=w}
   for(let j=R;j<H-R;j++)for(let i=R;i<W-R;i++){const o=j*W+i,c=grid[o];
     if(grid[o-R]===c&&grid[o+R]===c&&grid[o-R*W]===c&&grid[o+R*W]===c&&grid[o-R*W-R]===c&&grid[o+R*W+R]===c&&grid[o-R*W+R]===c&&grid[o+R*W-R]===c&&grid[o-1]===c&&grid[o+1]===c&&grid[o-W]===c&&grid[o+W]===c)continue;
     acc.fill(0);let m=0;for(let dy=-R;dy<=R;dy++){const r=o+dy*W;for(let dx=-R;dx<=R;dx++)acc[grid[r+dx]]+=wt[m++]}
     if(acc[c]/tot>=(wat[c]?.14:.44))continue;let b=c,bv=-1;for(let q=0;q<nk;q++)if(acc[q]>bv){bv=acc[q];b=q}sm[o]=b}
   grid.set(sm)}
  // relief: height on a coarse grid (4 cells = 60 units), then a light from the upper left
  const B=4,hw=Math.ceil(W/B),hh=Math.ceil(H/B),hg=new Float32Array(hw*hh);
  if(D.mtn){const M=D.mtn,s=atob(M.d),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);
    for(let j=0;j<hh;j++)for(let i=0;i<hw;i++){const fx=clamp((i+.5)*B*U/M.s,0,M.w-1.001),fy=clamp((j+.5)*B*U/M.s,0,M.h-1.001),x0=Math.floor(fx),y0=Math.floor(fy),u=fx-x0,v=fy-y0,q=y0*M.w+x0;
      hg[j*hw+i]=((a[q]*(1-u)+a[q+1]*u)*(1-v)+(a[q+M.w]*(1-u)+a[q+M.w+1]*u)*v)/255}}
  else{for(let j=0;j<hh;j++)for(let i=0;i<hw;i++){let s=0,n=0;for(let y=j*B;y<Math.min(H,j*B+B);y++)for(let x=i*B;x<Math.min(W,i*B+B);x++){s+=hill[grid[y*W+x]];n++}hg[j*hw+i]=s/n}
    const t=new Float32Array(hw*hh),R=5;for(let pass=0;pass<3;pass++){for(let j=0;j<hh;j++){let s=0;for(let i=-R;i<=R;i++)s+=hg[j*hw+clamp(i,0,hw-1)];for(let i=0;i<hw;i++){t[j*hw+i]=s/(2*R+1);s+=hg[j*hw+clamp(i+R+1,0,hw-1)]-hg[j*hw+clamp(i-R,0,hw-1)]}}
      for(let i=0;i<hw;i++){let s=0;for(let j=-R;j<=R;j++)s+=t[clamp(j,0,hh-1)*hw+i];for(let j=0;j<hh;j++){hg[j*hw+i]=s/(2*R+1);s+=t[clamp(j+R+1,0,hh-1)*hw+i]-t[clamp(j-R,0,hh-1)*hw+i]}}}}
  const sh=new Float32Array(hw*hh),mags=[];
  for(let j=0;j<hh;j++)for(let i=0;i<hw;i++){const gx=hg[j*hw+Math.min(hw-1,i+1)]-hg[j*hw+Math.max(0,i-1)],gy=hg[Math.min(hh-1,j+1)*hw+i]-hg[Math.max(0,j-1)*hw+i],v=-(gx*.75+gy);sh[j*hw+i]=v;if((i+j)%7===0&&v)mags.push(Math.abs(v))}
  mags.sort((x,y)=>x-y);const p98=mags.length?mags[Math.floor(mags.length*.98)]||1e-3:1;for(let i=0;i<sh.length;i++)sh[i]=clamp(sh[i]/p98*.13,-.17,.17);
  // soft, slow colour variation in woods and grass (no grain): a smoothed random field, 8 cells per step
  const NB=8,nw=Math.ceil(W/NB)+1,nh=Math.ceil(H/NB)+1,nz=new Float32Array(nw*nh),r=rng(k.length*977+W);for(let i=0;i<nz.length;i++)nz[i]=r();
  const colS=new Float32Array(nk*3),tx=new Float32Array(nk*2),sea=new Uint8Array(nk);
  D.keys.forEach((q,i)=>{const c=cartoRGB(CSAT[q]||CST[q]||keyCol(q));colS[i*3]=c[0];colS[i*3+1]=c[1];colS[i*3+2]=c[2];const t=CSAT_TX(q);tx[i*2]=t[0];tx[i*2+1]=t[1];sea[i]=CSEA.has(q)?1:0});
  // distance from the nearest land, in world units, on the 4-cell grid (two-pass chamfer), for water depth
  const dw=new Float32Array(hw*hh),BU=B*U,INF=1e9;
  for(let j=0;j<hh;j++)for(let i=0;i<hw;i++){const c=grid[Math.min(H-1,j*B+2)*W+Math.min(W-1,i*B+2)];dw[j*hw+i]=wat[c]?INF:0}
  const d1=BU,d2=BU*1.414;
  for(let j=0;j<hh;j++)for(let i=0;i<hw;i++){const o=j*hw+i;let v=dw[o];if(!v)continue;if(i>0)v=Math.min(v,dw[o-1]+d1);if(j>0){v=Math.min(v,dw[o-hw]+d1);if(i>0)v=Math.min(v,dw[o-hw-1]+d2);if(i<hw-1)v=Math.min(v,dw[o-hw+1]+d2)}dw[o]=v}
  for(let j=hh-1;j>=0;j--)for(let i=hw-1;i>=0;i--){const o=j*hw+i;let v=dw[o];if(!v)continue;if(i<hw-1)v=Math.min(v,dw[o+1]+d1);if(j<hh-1){v=Math.min(v,dw[o+hw]+d1);if(i<hw-1)v=Math.min(v,dw[o+hw+1]+d2);if(i>0)v=Math.min(v,dw[o+hw-1]+d2)}dw[o]=v}
  for(let i=0;i<dw.length;i++)dw[i]=Math.min(dw[i],6000);
  return CARTO[k]={D,W,H,U,grid,col,wat,tree,B,hw,hh,sh,hg,NB,nw,nh,nz,colS,tx,sea,dw,bigs:{}}}
// paint the world rectangle x0..x1, y0..y1 of region k into a PW x PH canvas
function cartoPaint(k,x0,y0,x1,y1,PW,PH,st){st=st||MSTY();const SAT=st==='sat',C=cartoData(k),{W,H,U,grid,wat,tree,B,hw,hh,sh,NB,nw,nh,nz,tx,sea,dw}=C,col=SAT?C.colS:C.col;
  const c=document.createElement('canvas');c.width=PW;c.height=PH;const g=c.getContext('2d'),img=g.createImageData(PW,PH),d=img.data,isW=new Uint8Array(PW*PH);
  const sx=(x1-x0)/PW,sy=(y1-y0)/PH,ppc=Math.max(1,U/sx),fineK=clamp(2-sx/10,0,1),SH=[95,202,214],LH=[78,156,184],bl=(A,w,i,j,fu,fv)=>(A[j*w+i]*(1-fu)+A[j*w+i+1]*fu)*(1-fv)+(A[(j+1)*w+i]*(1-fu)+A[(j+1)*w+i+1]*fu)*fv;
  for(let py=0;py<PH;py++){const y=y0+(py+.5)*sy,v=clamp(y/U-.5,0,H-1.001),j=Math.floor(v),fv=v-j,hv=clamp(y/(U*B)-.5,0,hh-1.001),hj=Math.floor(hv),hfv=hv-hj,nv=clamp(y/(U*NB),0,nh-1.001),nj=Math.floor(nv),nfv=nv-nj;
    for(let px=0;px<PW;px++){const x=x0+(px+.5)*sx,o=py*PW+px,q=o*4;if(x<0||y<0||x>W*U||y>H*U){d[q]=232;d[q+1]=227;d[q+2]=211;d[q+3]=255;continue}
      let XX=x,J=j,FV=fv;if(SAT){XX=x+(cnoise(x/90+3,y/90+7)-.5)*80;const vv=clamp((y+(cnoise(x/90+51,y/90+13)-.5)*80)/U-.5,0,H-1.001);J=Math.floor(vv);FV=vv-J}
      const u=clamp(XX/U-.5,0,W-1.001),i=Math.floor(u),fu=u-i,a0=grid[J*W+i],a1=grid[J*W+i+1],a2=grid[(J+1)*W+i],a3=grid[(J+1)*W+i+1];
      let P=a0,Q=a0,t=1;
      if(!(a0===a1&&a0===a2&&a0===a3)){const w0=(1-fu)*(1-FV),w1=fu*(1-FV),w2=(1-fu)*FV,w3=fu*FV,K=[a0,a1,a2,a3],Wt=[w0,w1,w2,w3],S={};
        for(let m=0;m<4;m++)S[K[m]]=(S[K[m]]||0)+Wt[m];let b1=-1,b2=-1;for(const key in S){const s=S[key];if(s>b1){b2=b1;Q=P;b1=s;P=+key}else if(s>b2){b2=s;Q=+key}}
        t=clamp(.5+(b1-b2)*.5*ppc,.5,1)}
      let r=col[P*3]*t+col[Q*3]*(1-t),gg=col[P*3+1]*t+col[Q*3+1]*(1-t),bb=col[P*3+2]*t+col[Q*3+2]*(1-t);
      if(SAT){const hu=clamp(x/(U*B)-.5,0,hw-1.001),hi=Math.floor(hu);
        if(!wat[P]){const s=bl(sh,hw,hi,hj,hu-hi,hfv),m=s>0?1+s*.4:1+s*1.6;
          const a=tx[P*2]*fineK,b2=tx[P*2+1],n=1+a*(cnoise(x/28,y/28)-.5)*2+b2*(cnoise(x/150+97,y/150+31)-.5)*2;r*=m*n;gg*=m*n;bb*=m*(s<0?1.05:1)*n}
        else{isW[o]=sea[P]?2:1;const dd=bl(dw,hw,hi,hj,hu-hi,hfv),D0=sea[P]?(C.D.isles?1300:800):260,f=clamp(dd/D0,0,1),e=f*f*(3-2*f),S=sea[P]?SH:LH;
          r=S[0]+(r-S[0])*e;gg=S[1]+(gg-S[1])*e;bb=S[2]+(bb-S[2])*e;const n=1+.05*(cnoise(x/200+11,y/200+5)-.5)*2;r*=n;gg*=n;bb*=n}}
      else if(!wat[P]){const hu=clamp(x/(U*B)-.5,0,hw-1.001),hi=Math.floor(hu),s=bl(sh,hw,hi,hj,hu-hi,hfv),m=s>0?1+s*.12:1+s;r*=m;gg*=m;bb*=m*(s<0?1.04:1);
        if(tree[P]){const nu=clamp(x/(U*NB),0,nw-1.001),ni=Math.floor(nu),n=bl(nz,nw,ni,nj,nu-ni,nfv)-.5;r*=1+n*.07;gg*=1+n*.05;bb*=1+n*.07}}
      else isW[o]=1;
      d[q]=r;d[q+1]=gg;d[q+2]=bb;d[q+3]=255}}
  // shores: a thin darker line on the water side, and a light band just inside it
  const near=(o,dx,dy,px,py)=>{const X=px+dx,Y=py+dy;return X>=0&&Y>=0&&X<PW&&Y<PH&&!isW[o+dy*PW+dx]};
  const lw=Math.max(1,Math.round(Math.min(PW/(x1-x0),PH/(y1-y0))*8));
  if(SAT){for(let py=0;py<PH;py++)for(let px=0;px<PW;px++){const o=py*PW+px;if(!isW[o])continue;const q=o*4;
      const e1=near(o,1,0,px,py)||near(o,-1,0,px,py)||near(o,0,1,px,py)||near(o,0,-1,px,py),e2=!e1&&lw>1&&(near(o,2,0,px,py)||near(o,-2,0,px,py)||near(o,0,2,px,py)||near(o,0,-2,px,py));
      if(e1||e2){const f=(isW[o]===2?.5:.22)*(e1?1:.5);d[q]+=(255-d[q])*f;d[q+1]+=(255-d[q+1])*f;d[q+2]+=(255-d[q+2])*f}}
    g.putImageData(img,0,0);return{c,x0,y0,x1,y1}}
  for(let py=0;py<PH;py++)for(let px=0;px<PW;px++){const o=py*PW+px;if(!isW[o])continue;const q=o*4;
    if(near(o,1,0,px,py)||near(o,-1,0,px,py)||near(o,0,1,px,py)||near(o,0,-1,px,py)){d[q]=d[q]*.62+60*.38;d[q+1]=d[q+1]*.62+130*.38;d[q+2]=d[q+2]*.62+180*.38;continue}
    let e=0;for(const s of[2,3,4].map(v=>v*lw))if(near(o,s,0,px,py)||near(o,-s,0,px,py)||near(o,0,s,px,py)||near(o,0,-s,px,py)){e=s;break}
    if(e){const f=e<=2*lw?.22:e<=3*lw?.14:.07;d[q]+=(255-d[q])*f;d[q+1]+=(255-d[q+1])*f;d[q+2]+=(255-d[q+2])*f}}
  g.putImageData(img,0,0);return{c,x0,y0,x1,y1}}
function cartoBig(k,st){st=st||MSTY();const C=cartoData(k);if(C.bigs[st])return C.bigs[st];const WWr=C.W*C.U,WHr=C.H*C.U,L=1700,PW=Math.round(WWr>=WHr?L:L*WWr/WHr),PH=Math.round(WWr>=WHr?L*WHr/WWr:L);return C.bigs[st]=cartoPaint(k,0,0,WWr,WHr,PW,PH,st)}
// farm plots, and (for other regions) roads, drawn as clean lines over the base
function cartoOver(g,k,own,z,lw){const D=regionWD(k),P=mapP,kk=MAPV.k;
  const SAT=MSTY()==='sat';(D.fields||[]).forEach((f,fi)=>{const a=P(f.x0,f.y0),w=(f.x1-f.x0)*kk,h=(f.y1-f.y0)*kk;if(w<1.5||h<1.5)return;const pal=CFIELD_SAT[f.kind]||CFIELD_SAT.crop;
    g.fillStyle=SAT?pal[(fi*7+(f.x0|0)/100)%pal.length|0]:CFIELD[f.kind]||CFIELD.crop;g.fillRect(a[0],a[1],w,h);
    if(SAT&&w>10&&h>10&&f.kind!=='pasture'){g.save();g.beginPath();g.rect(a[0],a[1],w,h);g.clip();g.strokeStyle='rgba(0,0,0,.07)';g.lineWidth=1;const sp=Math.max(3,2.2*z);if(fi%2)for(let x=a[0];x<a[0]+w;x+=sp){g.beginPath();g.moveTo(x,a[1]);g.lineTo(x,a[1]+h);g.stroke()}else for(let y=a[1];y<a[1]+h;y+=sp){g.beginPath();g.moveTo(a[0],y);g.lineTo(a[0]+w,y);g.stroke()}g.restore()}
    if(w>7&&h>7){g.strokeStyle=SAT?'rgba(48,62,28,.55)':'rgba(150,142,98,.55)';g.lineWidth=Math.min(1.2,.5+z*.12);g.strokeRect(a[0]+.5,a[1]+.5,w-1,h-1)}});
  {const A=AIRPORTS[k];if(A){for(const [R,col] of[[A.ap,'#b8b6ae'],[A.rw,'#55565a']]){const a=P(R[0],R[1]);g.fillStyle=col;g.fillRect(a[0],a[1],(R[2]-R[0])*kk,(R[3]-R[1])*kk)}
    if((A.rw[3]-A.rw[1])*kk>3){const a=P(A.rw[0],(A.rw[1]+A.rw[3])/2),b=P(A.rw[2],(A.rw[1]+A.rw[3])/2);g.strokeStyle='#f2f2ee';g.lineWidth=1;g.setLineDash([4,3]);g.beginPath();g.moveTo(a[0]+4,a[1]);g.lineTo(b[0]-4,b[1]);g.stroke();g.setLineDash([])}}}
  if(own)return;
  if(D.road&&D.hw&&D.hw[1]>D.hw[0]&&!(D.isles&&D.isles.length)){g.lineCap='round';g.beginPath();for(let y=D.hw[0];y<D.hw[1];y+=200){const p=P(tab100(D.road,y),y);y===D.hw[0]?g.moveTo(p[0],p[1]):g.lineTo(p[0],p[1])}
    g.strokeStyle='#fff';g.lineWidth=lw+2.4;g.stroke();g.strokeStyle='#e8a33a';g.lineWidth=lw+1;g.stroke()}
  for(const tr of D.tracks||[]){g.strokeStyle=tr.kind==='paved'?'rgba(255,255,255,.95)':tr.kind==='boardwalk'?'#c8a77e':'rgba(255,248,230,.8)';g.lineWidth=tr.kind==='paved'?lw+.6:lw*.8;if(tr.kind!=='paved')g.setLineDash([4,3]);
    g.beginPath();tr.pts.forEach((q,i)=>{const p=P(q[0],q[1]);i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])});g.stroke();g.setLineDash([])}
  if(D.city&&D.city.length===4){const a=P(D.city[0],D.city[1]),b=P(D.city[2],D.city[3]);g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=Math.max(1,lw*.7);g.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1])}
  g.fillStyle=SAT?'#e2ddd4':'#c4bcb0';for(const B of D.buildings||[]){if(!Array.isArray(B))continue;const p=P(B[1],B[2]);g.fillRect(p[0]-1.2,p[1]-1.2,2.4,2.4)}}
let cartoWin=null,cartoT=0;
function drawMap(){const el=$('mapBack');if(el.hidden)return;renderRegionBar();const R=mapInfo(),Lg=mapLayout();renderMapSheet(R,Lg);renderMapKey(R);const cvs=$('mapCanvas'),D=Math.min(devicePixelRatio||1,2),{CW,H}=Lg;
  MAPV.Lg=Lg;const k1=mapFitK(R,Lg);MAPV.k=k1*MAPV.z;if(MAPV.cx==null){MAPV.cx=R.WW/2;MAPV.cy=R.WH/2}mapClampView(R,Lg);MAPV.CW=CW;MAPV.H=H;
  $('mapIn').disabled=MAPV.z>=MAP_ZMAX-1e-3;$('mapOut').disabled=MAPV.z<=1+1e-3;$('mapMe').hidden=!R.own;$('mapKeyBtn').setAttribute('aria-pressed',MAPUI.key);
  if(cvs.width!==Math.round(CW*D)||cvs.height!==Math.round(H*D)){cvs.width=Math.round(CW*D);cvs.height=Math.round(H*D)}cvs.style.width=CW+'px';cvs.style.height=H+'px';
  const g=cvs.getContext('2d');g.setTransform(D,0,0,D,0,0);g.fillStyle='#e8e3d3';g.fillRect(0,0,CW,H);const P=mapP,k=MAPV.k,z=MAPV.z;g.imageSmoothingEnabled=true;
  // base picture
  const o=P(0,0),bw=R.WW*k,bh=R.WH*k;g.save();g.shadowColor='rgba(0,0,0,.18)';g.shadowBlur=14;g.fillStyle='#cfc8b4';g.fillRect(o[0],o[1],bw,bh);g.restore();
  {const ST=MSTY(),big=cartoBig(MAPR,ST);g.drawImage(big.c,o[0],o[1],bw,bh);
    if(z>=1.6){const key=[MAPR,ST,z.toFixed(2),Math.round(MAPV.cx),Math.round(MAPV.cy),CW,H].join(),DD=Math.min(D,1.6);
      const drawW=w=>{const a=P(w.x0,w.y0);g.drawImage(w.c,a[0],a[1],(w.x1-w.x0)*k,(w.y1-w.y0)*k)};
      if(cartoWin&&cartoWin.key===key)drawW(cartoWin);
      else{if(cartoWin&&cartoWin.r===MAPR&&cartoWin.st===ST&&cartoWin.z===z.toFixed(2))drawW(cartoWin);
        clearTimeout(cartoT);cartoT=setTimeout(()=>{if($('mapBack').hidden)return;const RW=R.WW,RH=R.WH,a=mapW(0,0),b=mapW(CW,H),X0=Math.max(0,a[0]),Y0=Math.max(0,a[1]),X1=Math.min(RW,b[0]),Y1=Math.min(RH,b[1]);if(X1<=X0||Y1<=Y0)return;
          cartoWin=cartoPaint(MAPR,X0,Y0,X1,Y1,Math.max(8,Math.round((X1-X0)*MAPV.k*DD)),Math.max(8,Math.round((Y1-Y0)*MAPV.k*DD)),ST);cartoWin.key=key;cartoWin.r=MAPR;cartoWin.st=ST;cartoWin.z=z.toFixed(2);drawMap()},140)}}}
  // roads, buildings, docks (own map)
  const lw=clamp(.8+z*.35,1,3.2);cartoOver(g,MAPR,R.own,z,lw);
  if(R.own){if(!ISLE&&!PAC){g.strokeStyle='#fff';g.lineWidth=lw+2.4;g.lineCap='round';g.beginPath();for(let y=HW0;y<HW1;y+=200){const p=P(roadX(y),y);y===HW0?g.moveTo(p[0],p[1]):g.lineTo(p[0],p[1])}g.stroke();g.strokeStyle='#e8a33a';g.lineWidth=lw+1;g.stroke()}
    for(const tr of TRACKS){if(tr.drive)continue;g.strokeStyle=tr.kind==='paved'?'rgba(255,255,255,.95)':tr.kind==='boardwalk'?'#c8a77e':'rgba(255,248,230,.75)';g.lineWidth=tr.kind==='paved'?lw+.6:lw*.8;if(tr.kind!=='paved')g.setLineDash([4,3]);
      g.beginPath();tr.pts.forEach((q,i)=>{const p=P(q[0],q[1]);i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])});g.stroke();g.setLineDash([])}
    g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=Math.max(1,lw*.8);g.beginPath();for(const sy of STS){const segs=ST_GAP.includes(sy)?[[CITY.x0-ST_HALF,AVES[2]+ST_HALF],[AVES[3]-ST_HALF,OCEAN_DR+ST_HALF]]:[[CITY.x0-ST_HALF,OCEAN_DR+ST_HALF]];for(const [u,v] of segs){const a=P(u,sy),b=P(v,sy);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1])}}for(const ax of AVES){const a=P(ax,CITY.y0-ST_HALF),b=P(ax,CITY.y1+ST_HALF);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1])}g.stroke();
    const SATB=MSTY()==='sat';g.fillStyle=SATB?'#dcd6cc':'#bdb5a8';for(const b of BLD){const p=P(b.x,b.y),bw2=Math.max(1.2,b.w*k),bh2=Math.max(1.2,b.d*k);g.fillRect(p[0],p[1],bw2,bh2);if(SATB&&bw2>5){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(p[0]+bw2,p[1]+1,Math.min(3,bw2*.12),bh2);g.fillStyle='#dcd6cc'}}
    g.fillStyle='#8a6b45';for(const pr of PIERS){const p=P(pr.x0,pr.y0);g.fillRect(p[0],p[1],Math.max(1,(pr.x1-pr.x0)*k),Math.max(1.5,(pr.y1-pr.y0)*k))}
    for(const f of FENCES){const p=P(f.x,f.y);g.fillStyle='#b8322a';g.fillRect(p[0]-1,p[1],2,f.h*k)}
    if(z>=1.6)for(const L of LAUNCHES){const p=P(L.x,L.y),c={tour:'#c82846',kayak:'#e6781e',canoe:'#288c46'}[L.craft];g.fillStyle='#fff';g.beginPath();g.arc(p[0],p[1],5,0,TAU);g.fill();g.fillStyle=c;g.beginPath();g.moveTo(p[0],p[1]-3.5);g.lineTo(p[0]+3.5,p[1]);g.lineTo(p[0],p[1]+3.5);g.lineTo(p[0]-3.5,p[1]);g.closePath();g.fill()}}
  if(MSG.alert&&MAPR===MAP){const a=MSG.alert,p=P(a.x,a.y),rr=Math.max(12,a.r*k);g.fillStyle='rgba(229,55,43,.2)';g.strokeStyle='#e5372b';g.lineWidth=3;g.beginPath();g.arc(p[0],p[1],rr,0,TAU);g.fill();g.stroke();
    g.font='700 12px Fredoka,system-ui';const t=(a.stray?'Out of range: ':'Rare: ')+SPECIES[a.sp].name,w=g.measureText(t).width+16,lx=clamp(p[0]+rr+6,4,(MAPV.CW||400)-w-4),ly=clamp(p[1]-10,4,(MAPV.H||400)-24);
    g.fillStyle='#e5372b';g.beginPath();g.roundRect(lx,ly,w,20,10);g.fill();g.fillStyle='#fff';g.textAlign='left';g.fillText(t,lx+8,ly+14)}
  // ---- labels: everything placed through one list of boxes so nothing overlaps; the panels count as taken space
  const taken=[],hit=(b,own)=>taken.some(q=>!(own&&q.pin===own)&&b.x<q.x+q.w&&b.x+b.w>q.x&&b.y<q.y+q.h&&b.y+b.h>q.y),take=b=>taken.push(b);
  const wrap=$('mapWrap');for(const sel of['.maptop','.mapctl','#mapSheet>*','#mapKeyCard']){wrap.querySelectorAll(sel).forEach(e=>{if(e.hidden||e.offsetParent===null)return;let x=0,y=0,n=e;while(n&&n!==wrap){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent}if(e.offsetWidth&&e.offsetHeight)take({x:x-4,y:y-4,w:e.offsetWidth+8,h:e.offsetHeight+8})})}
  const halo=(t,x,y,f,col,al='left',hc='rgba(255,253,246,.95)',hw=3.4)=>{g.font=f;g.textAlign=al;g.lineJoin='round';g.lineWidth=hw;g.strokeStyle=hc;g.strokeText(t,x,y);g.fillStyle=col;g.fillText(t,x,y)};
  const small=CW<520,FS=small?11:12;
  // scale bar
  {const mpp=1/(k*10),target=(small?70:90)*mpp,steps=[10,20,50,100,200,500,1000,2000,5000];let m=steps[0];for(const s of steps)if(s<=target)m=s;const w=m/mpp,x=CW-(Lg.wide?Lg.pad.r-4:14)-w,y=H-(Lg.wide?14:22);
    if(!hit({x:x-4,y:y-14,w:w+8,h:20})){take({x:x-4,y:y-16,w:w+8,h:22});g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y);g.stroke();g.strokeStyle='#2b3a2f';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y);g.stroke();
      halo(m>=1000?m/1000+' km':m+' m',x+w/2,y-5,'600 10.5px Fredoka,system-ui','#2b3a2f','center')}}
  // the regions inside this map: a colour rail down the left edge with a name tag per region, faint dashed edges across
  for(const F of R.places){const p=P(F.x,F.y),r=F.rank===0?5.5:4.5;if(p[0]>=0&&p[1]>=0&&p[0]<=CW&&p[1]<=H)take({x:p[0]-r-1,y:p[1]-r-1,w:2*r+2,h:2*r+2,pin:F.name})}
  const BB=R.own?(R.D.isles?null:BANDS):R.bands;let youBand=null;if(R.own&&BB){const L=listener();youBand=BB.find(b=>L.y<b.y1)||BB[BB.length-1]}
  if(BB&&BB.length>1){const rx=Math.max(o[0],2)+0,top=Math.max(o[1],Lg.pad.t-6),bot=Math.min(o[1]+bh,H-4);
    for(const Bd of BB){const a=P(0,Bd.y0)[1],b=P(0,Bd.y1)[1];if(b<top||a>bot)continue;
      if(Bd.y0>0&&a>top){g.strokeStyle='rgba(255,255,255,.55)';g.setLineDash([7,6]);g.lineWidth=1.4;g.beginPath();g.moveTo(Math.max(o[0],0),a);g.lineTo(Math.min(o[0]+bw,CW),a);g.stroke();g.setLineDash([])}
      g.fillStyle=Bd.col;g.fillRect(rx,Math.max(a,top),6,Math.min(b,bot)-Math.max(a,top))}
    for(const Bd of BB){const a=P(0,Bd.y0)[1],b=P(0,Bd.y1)[1],ya=Math.max(a,top),yb=Math.min(b,bot);if(yb-ya<22)continue;
      g.font=`700 ${small?10:11}px Fredoka,system-ui`;const t=(Bd.id+'  '+Bd.name).toUpperCase(),w=g.measureText(t).width+(Bd===youBand?30:18),y=clamp((a+b)/2,ya+12,yb-12),box={x:rx+9,y:y-10,w,h:20};
      if(hit(box))box.y=ya+4;if(hit(box)||box.y+20>yb)continue;take({x:box.x-2,y:box.y-2,w:box.w+4,h:box.h+4});
      g.fillStyle=Bd.col;g.beginPath();g.roundRect(box.x,box.y,w,20,10);g.fill();g.fillStyle='rgba(0,0,0,.12)';g.beginPath();g.roundRect(box.x,box.y+10,w,10,[0,0,10,10]);g.fill();
      g.fillStyle='#fff';g.textAlign='left';g.fillText(t,box.x+9,box.y+14);if(Bd===youBand){g.beginPath();g.arc(box.x+w-11,box.y+10,4,0,TAU);g.fillStyle='#fff';g.fill();g.beginPath();g.arc(box.x+w-11,box.y+10,2.2,0,TAU);g.fillStyle='#1a73e8';g.fill()}}}
  // You and the Defender take their space first
  let you=null;if(R.own){const L=listener();you=P(L.x,L.y);take({x:you[0]-12,y:you[1]-12,w:24,h:24});const cp=P(S.car.x,S.car.y);if(Math.hypot(cp[0]-you[0],cp[1]-you[1])>10)take({x:cp[0]-8,y:cp[1]-7,w:16,h:14})}
  // trailheads and ferries
  const TRL=[];if(R.own)for(const TR of [...TRAILS,...PDOCKS]){const tp=P(TR.x,TR.y);TRL.push([TR,tp]);take({x:tp[0]-8,y:tp[1]-8,w:16,h:16})}
  // island names and seas (own island maps), then the places by importance
  if(R.own&&ISLE&&WD.labels)for(const [n,x,y] of WD.labels){const p=P(x,y),sea=/Ocean|Sea/.test(n),t=sea||n==='Coral reef'?n.toUpperCase():n;g.font=`${sea?'italic 600':'700'} ${sea?11:13}px Fredoka,system-ui`;const w=g.measureText(t).width,box={x:p[0]-w/2,y:p[1]-11,w,h:14};
    if(hit(box))continue;take(box);halo(t,p[0],p[1],g.font,sea?'#e8f4f8':'#2b3a2f','center',sea?'rgba(20,70,100,.55)':'rgba(255,253,246,.9)',sea?3:3.6)}
  if(R.own&&z<2.5&&!CENTRAL){const p=P(WW*.97,WH*.3);if(!hit({x:p[0]-62,y:p[1]-11,w:64,h:14}))halo('ATLANTIC',p[0],p[1],'italic 600 11px Fredoka,system-ui','#e8f4f8','right','rgba(20,70,100,.5)',3)}
  if(R.own&&z<2.5&&WEST){const p=P(WW*.03,WH*.66);if(!hit({x:p[0]-2,y:p[1]-11,w:56,h:14}))halo('PACIFIC',p[0],p[1],'italic 600 11px Fredoka,system-ui','#e8f4f8','left','rgba(20,70,100,.5)',3)}
  const order=[...R.places].sort((a,b)=>(a===MAPUI.sel?-1:b===MAPUI.sel?1:0)||(MAPUI.sel&&a.name===MAPUI.sel.name?-1:MAPUI.sel&&b.name===MAPUI.sel.name?1:0)||a.rank-b.rank||a.i-b.i);
  MAPL=[];const pins=[];
  for(const F of order){const p=P(F.x,F.y);if(p[0]<-10||p[1]<-10||p[0]>CW+10||p[1]>H+10)continue;const isSel=MAPUI.sel&&MAPUI.sel.name===F.name;
    const r=F.rank===0?5.5:4.5,dot={x:p[0]-r-1,y:p[1]-r-1,w:2*r+2,h:2*r+2};const vis=p[0]>=0&&p[1]>=Lg.pad.t-8&&p[0]<=CW&&p[1]<=H;
    let lab=null;const f=`${F.rank===0||isSel?700:600} ${isSel?FS+1:FS}px Fredoka,system-ui`;g.font=f;const tw=g.measureText(F.name).width;
    if(vis&&(isSel||!hit(dot,F.name))){for(const [dx,dy,al] of[[r+5,4,'left'],[-r-5,4,'right'],[0,r+15,'center'],[0,-r-6,'center']]){const x0=al==='left'?p[0]+dx:al==='right'?p[0]+dx-tw:p[0]-tw/2,box={x:x0-2,y:p[1]+dy-12,w:tw+4,h:16};
        if(box.x<2||box.x+box.w>CW-2)continue;if(!hit(box,F.name)||isSel){lab={t:F.name,x:p[0]+dx,y:p[1]+dy,al,f,box};break}}}
    pins.push({F,p,r,isSel,lab,vis});take(dot);if(lab)take(lab.box);
    if(vis){const bx=lab?{x:Math.min(dot.x,lab.box.x),y:Math.min(dot.y,lab.box.y),w:0,h:0}:{...dot};if(lab){bx.w=Math.max(dot.x+dot.w,lab.box.x+lab.box.w)-bx.x;bx.h=Math.max(dot.y+dot.h,lab.box.y+lab.box.h)-bx.y}
      MAPL.push({F,x:bx.x-4,y:bx.y-4,w:bx.w+8,h:bx.h+8,cx:p[0],cy:p[1]})}}
  MAPL.sort((a,b)=>a.cy-b.cy||a.cx-b.cx);mapSel=MAPUI.sel?MAPL.findIndex(q=>q.F.name===MAPUI.sel.name):-1;
  for(const q of pins){if(!q.vis)continue;const {p,r,F}=q;if(q.isSel)continue;g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.arc(p[0]+.6,p[1]+1.2,r+1.6,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(p[0],p[1],r+1.6,0,TAU);g.fill();
    g.fillStyle=F.col;g.beginPath();g.arc(p[0],p[1],r,0,TAU);g.fill();if(F.rank===0){g.fillStyle='#fff';g.fillRect(p[0]-1.6,p[1]-1.6,3.2,3.2)}}
  for(const q of pins)if(q.lab&&!q.isSel)halo(q.lab.t,q.lab.x,q.lab.y,q.lab.f,q.F.rank===0?'#1f2a24':'#2b3a2f',q.lab.al);
  // trailhead and ferry markers
  for(const [TR,tp] of TRL){if(TR.plane){mapPlaneMark(g,tp);const t='→ '+TR.dest;g.font=`700 ${FS}px Fredoka,system-ui`;const tw=g.measureText(t).width;
      for(const [dx,al] of[[-12,'right'],[12,'left']]){const box={x:al==='left'?tp[0]+dx-2:tp[0]+dx-tw-2,y:tp[1]-8,w:tw+4,h:16};if(hit(box)||box.x<0||box.x+box.w>CW)continue;take(box);halo(t,tp[0]+dx,tp[1]+4,g.font,'#9e2a22',al);break}continue}
    const ferry=/ferry|pier/i.test(TR.name);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(tp[0]+.6,tp[1]+1.2,8,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(tp[0],tp[1],8,0,TAU);g.fill();g.fillStyle=ferry?'#2f6fb3':'#e0a21c';g.beginPath();g.arc(tp[0],tp[1],6.4,0,TAU);g.fill();
    g.strokeStyle='#fff';g.lineWidth=1.8;g.lineCap='round';g.beginPath();if(ferry){g.moveTo(tp[0]-3.5,tp[1]+1);g.quadraticCurveTo(tp[0],tp[1]+4,tp[0]+3.5,tp[1]+1);g.moveTo(tp[0],tp[1]-3.5);g.lineTo(tp[0],tp[1]+2)}else{g.moveTo(tp[0]-3,tp[1]);g.lineTo(tp[0]+3,tp[1]);g.moveTo(tp[0]+.5,tp[1]-2.6);g.lineTo(tp[0]+3,tp[1]);g.lineTo(tp[0]+.5,tp[1]+2.6)}g.stroke();
    if(ISLE&&TR.to==='ferry')continue;const t='→ '+TR.dest;g.font=`700 ${FS}px Fredoka,system-ui`;const tw=g.measureText(t).width;
    for(const [dx,al] of[[-12,'right'],[12,'left']]){const box={x:al==='left'?tp[0]+dx-2:tp[0]+dx-tw-2,y:tp[1]-8,w:tw+4,h:16};if(hit(box)||box.x<0||box.x+box.w>CW)continue;take(box);halo(t,tp[0]+dx,tp[1]+4,g.font,'#7a5208',al);break}}
  // the Defender and you (blue dot with a soft ring, like a phone map)
  if(R.own){const cp=P(S.car.x,S.car.y);if(Math.hypot(cp[0]-you[0],cp[1]-you[1])>10){g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.roundRect(cp[0]-7,cp[1]-5.5,15,12,4);g.fill();g.fillStyle='#fff';g.beginPath();g.roundRect(cp[0]-7.5,cp[1]-6.5,15,12,4);g.fill();
      g.fillStyle='#33503f';g.beginPath();g.roundRect(cp[0]-5.5,cp[1]-4.5,11,8,2.5);g.fill();g.fillStyle='#dfe8e2';g.fillRect(cp[0]-3.6,cp[1]-3,7.2,2.6)}
    g.fillStyle='rgba(26,115,232,.18)';g.beginPath();g.arc(you[0],you[1],16,0,TAU);g.fill();g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(you[0]+.6,you[1]+1.2,8.5,0,TAU);g.fill();
    g.fillStyle='#fff';g.beginPath();g.arc(you[0],you[1],8.5,0,TAU);g.fill();g.fillStyle='#1a73e8';g.beginPath();g.arc(you[0],you[1],6,0,TAU);g.fill();
    const fa=S.mode==='drive'?S.car.ang:(S.player.face!=null?S.player.face:0);g.fillStyle='rgba(26,115,232,.55)';g.beginPath();g.moveTo(you[0]+Math.cos(fa)*17,you[1]+Math.sin(fa)*17);g.lineTo(you[0]+Math.cos(fa+.45)*10,you[1]+Math.sin(fa+.45)*10);g.lineTo(you[0]+Math.cos(fa-.45)*10,you[1]+Math.sin(fa-.45)*10);g.closePath();g.fill()}
  mpMapDraw(g,P,CW,H,halo);
  // the chosen place: a red pin on top of everything
  for(const q of pins){if(!q.isSel)continue;const {p}=q;g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(p[0],p[1]+1,5,2,0,0,TAU);g.fill();
    g.fillStyle='#e5483b';g.beginPath();g.moveTo(p[0],p[1]);g.bezierCurveTo(p[0]-3,p[1]-9,p[0]-11,p[1]-13,p[0]-11,p[1]-22);g.arc(p[0],p[1]-22,11,PI,0);g.bezierCurveTo(p[0]+11,p[1]-13,p[0]+3,p[1]-9,p[0],p[1]);g.fill();
    g.fillStyle='#fff';g.beginPath();g.arc(p[0],p[1]-22,4.5,0,TAU);g.fill();if(q.lab)halo(q.lab.t,q.lab.al==='left'?q.lab.x+6:q.lab.al==='right'?q.lab.x-6:q.lab.x,q.lab.al==='center'&&q.lab.y<p[1]?p[1]-38:q.lab.y,q.lab.f,'#b3261e',q.lab.al)}
  // controller highlight
  if(GPS.linked&&mapSel>=0&&MAPL[mapSel]&&!MAPUI.sel){const q=MAPL[mapSel];g.strokeStyle='#ffc93c';g.lineWidth=3;g.beginPath();g.roundRect(q.x,q.y,q.w,q.h,10);g.stroke()}
}
function mapPlaneMark(g,tp){g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(tp[0]+.6,tp[1]+1.2,8,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(tp[0],tp[1],8,0,TAU);g.fill();g.fillStyle='#c8372d';g.beginPath();g.arc(tp[0],tp[1],6.4,0,TAU);g.fill();
  g.strokeStyle='#fff';g.lineWidth=1.6;g.lineCap='round';g.beginPath();g.moveTo(tp[0]-4,tp[1]);g.lineTo(tp[0]+4,tp[1]);g.moveTo(tp[0]+.8,tp[1]-3.6);g.lineTo(tp[0]+.8,tp[1]+3.6);g.moveTo(tp[0]-3.4,tp[1]-1.6);g.lineTo(tp[0]-3.4,tp[1]+1.6);g.stroke()}
function renderMapKey(R){const c=$('mapKeyCard');c.hidden=!MAPUI.key;if(c.hidden)return;const ST=MSTY();
  c.innerHTML=`<h4>Map style</h4><div class="mstyle"><button data-s="map" class="${ST==='map'?'on':''}" aria-pressed="${ST==='map'}"><i class="msw msw-map"></i>Map</button><button data-s="sat" class="${ST==='sat'?'on':''}" aria-pressed="${ST==='sat'}"><i class="msw msw-sat"></i>Satellite</button></div><h4>Map key</h4>${R.own?Object.values(HAB_CATS).map(h=>`<p><i class="mdot" style="background:${h.col}"></i>${h.name}</p>`).join(''):''}
    ${R.own?`<p><i class="kyou"></i>You</p><p><i class="kcar"></i>Your Defender</p>`:''}<p><i class="ktrail"></i>Trailhead</p><p><i class="kferry"></i>Ferry</p>${R.own&&PDOCKS.length?'<p><i class="kplane"></i>Floatplane dock</p>':''}${R.own?`<p><i class="kboat"></i>Boat launch</p><p><i class="kroad"></i>Road</p>`:''}
    ${(R.own?(R.D.isles?null:BANDS):R.bands)?`<h4>Regions</h4>${(R.own?BANDS:R.bands).map(b=>`<p><i class="kband" style="background:${b.col}"></i>${b.id} ${b.name}</p>`).join('')}`:''}`}
$('mapIn').onclick=e=>{e.stopPropagation();mapZoom(1)};$('mapOut').onclick=e=>{e.stopPropagation();mapZoom(-1)};
$('mapMe').onclick=e=>{e.stopPropagation();const L=listener();if(MAPV.z<1.6)MAPV.z=1.7;mapCenterOn(L.x,L.y)};
$('mapKeyBtn').onclick=e=>{e.stopPropagation();MAPUI.key=!MAPUI.key;drawMap()};
$('mapKeyCard').addEventListener('click',e=>{const b=e.target.closest('.mstyle button');e.stopPropagation();if(!b)return;if(settings.mapStyle!==b.dataset.s){settings.mapStyle=b.dataset.s;saveSettings();cartoWin=null;drawMap()}});
window.addEventListener('resize',()=>{if(!$('mapBack').hidden)drawMap()});
{const mc=$('mapCanvas'),pts=new Map();let dr=null,pinch=null;
  mc.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});try{mc.setPointerCapture(e.pointerId)}catch(_){}
    if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:MAPV.z};dr=null}else dr={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}});
  mc.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&pts.size>=2){const [a,b]=[...pts.values()],d=Math.hypot(a.x-b.x,a.y-b.y),r=mc.getBoundingClientRect(),m=mapW((a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);mapZoom(0,m,clamp(pinch.z*d/pinch.d,1,MAP_ZMAX)/MAPV.z);mc._dragged=true;return}
    if(!dr||e.pointerId!==dr.id)return;const dx=e.clientX-dr.x,dy=e.clientY-dr.y;if(!dr.moved&&Math.hypot(dx,dy)<6)return;dr.moved=true;
    MAPV.cx-=dx/MAPV.k;MAPV.cy-=dy/MAPV.k;dr.x=e.clientX;dr.y=e.clientY;drawMap()});
  const end=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(dr&&e.pointerId===dr.id){mc._dragged=dr.moved;dr=null}};mc.addEventListener('pointerup',end);mc.addEventListener('pointercancel',end);
  mc.addEventListener('wheel',e=>{e.preventDefault();const r=mc.getBoundingClientRect(),w=mapW(e.clientX-r.left,e.clientY-r.top);mapZoom(0,w,Math.pow(1.0018,-e.deltaY))},{passive:false})}

/* ---------- binoculars ----------
   A 2D view from where you stand. Everything is projected with one rule (angle -> pixels),
   so trees and birds sit exactly where they are in the world: walk around a trunk to see the other side. */
/* three optics share this view: binoculars (handheld), spotting scope (tripod, much higher power), camera (zoom lens + shutter) */
const ZOOMS=[{fov:15,lbl:'10×'}];   // OP2: binoculars do not zoom
const SCOPE_ZOOMS=[{fov:5.6,lbl:'20×'},{fov:3.7,lbl:'30×'},{fov:2.5,lbl:'45×'},{fov:1.9,lbl:'60×'}];
const GEAR={bino:{name:'Binoculars',short:'Binos'},scope:{name:'Spotting scope',short:'Scope'},cam:{name:'Camera',short:'Camera'}};
const CAM_MM=[100,600];
function opticZooms(){return S.gear==='scope'?SCOPE_ZOOMS:ZOOMS}
function fovDeg(){if(S.gear==='cam')return 2*Math.atan(18/S.bino.mm)*180/PI;const z=opticZooms();return z[clamp(S.bino.zoom,0,z.length-1)].fov}
function zoomLabel(){return S.gear==='cam'?Math.round(S.bino.mm)+' mm':opticZooms()[clamp(S.bino.zoom,0,opticZooms().length-1)].lbl}
const EYE_H=1.6,BIRD_EX=2.3,RANGE=95;
const PANO={cols:720,ds:[]};{let d=1.1;while(d<420){PANO.ds.push(d);d*=1.085}}
function binoFov(){return fovDeg()*PI/180}
function binoPPR(){return Math.max(VW,VH*1.25)/binoFov()}
function binoEye(){const L=listener();return{x:L.x,y:L.y,h:S.mode==='drive'?2.3:EYE_H}}
function buildPano(){const E=binoEye(),N=PANO.cols,ds=PANO.ds,c=document.createElement('canvas');c.width=N;c.height=ds.length;const g=c.getContext('2d'),img=g.createImageData(N,ds.length),d=img.data;
  const water=new Float32Array(N).fill(1e9);
  for(let i=0;i<N;i++){const b=i/N*TAU,cx=Math.cos(b),cy=Math.sin(b);
    for(let j=0;j<ds.length;j++){const D=ds[j],x=E.x+cx*D*M,y=E.y+cy*D*M;const tt=terr(x,y);let col=groundColor(x,y,tt);
      const r=roadAt(x,y);if(r&&tt>=T.FLOOR)col=r.kind==='paved'?GC.road:r.kind==='dirt'?GC.dirt:GC.sandroad;
      if(tt<=T.SHAL&&water[i]>D)water[i]=D;
      const o=(j*N+i)*4;d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255}}
  g.putImageData(img,0,0);
  // far skyline per bearing: open sea, a tree line, or mountains
  const sky=new Float32Array(N),mtn=new Float32Array(N);
  for(let i=0;i<N;i++){const b=i/N*TAU;let open=false;for(const D of[160,300,500]){const t=terr(E.x+Math.cos(b)*D*M,E.y+Math.sin(b)*D*M);if(t<=T.SHAL||isBeach(t)||t===T.LAKE||t===T.FIELD||t===T.GRASS||t===T.SALT||t===T.MARSH||t===T.CITY){open=true;break}}
    sky[i]=open?0:(1.2+2.4*vnoise(i/18,3)+vnoise(i/4,7)*.6)*PI/180;
    const west=-Math.cos(b);mtn[i]=west>-.2?((ISLE?.25:WEST?.5:CENTRAL?.14:clamp((10500-E.x)/8000,.18,1))*(2+5*vnoise(i/40,11)+1.5*vnoise(i/9,5))*(west+.2)/1.2)*PI/180:0}
  const city=new Float32Array(N);for(let i=0;i<N;i++){const b=i/N*TAU;for(let D=90;D<1500;D+=30){const x=E.x+Math.cos(b)*D*M,y=E.y+Math.sin(b)*D*M;if(inCity(x,y)&&!cityStreet(x,y)){const bb=buildingAt(x,y,4);if(bb){city[i]=Math.max(city[i],Math.atan2(bb.h,D));}}}}
  PANO.img=c;PANO.water=water;PANO.sky=sky;PANO.mtn=mtn;PANO.city=city;PANO.at={x:E.x,y:E.y}}
function drawPierBino(p){if(!p.mesh){const K=meshKit(),W=(p.x1-p.x0)/M,D=(p.y1-p.y0)/M,x0=-W/2,x1=W/2,y0=-D/2,y1=D/2,z=p.kind==='pier'?.5:p.kind==='jetty'?.9:.35;K.box(x0,x1,y0,y1,z-(p.kind==='jetty'?1.2:.3),z,p.kind==='jetty'?'#8d8a82':'#a88a64');
    if(W>D){for(let x=x0+1;x<x1;x+=4)for(const y of[y0+.2,y1-.2])K.box(x-.15,x+.15,y-.15,y+.15,-1,z-.3,'#5a4632');if(p.kind==='pier')for(const y of[y0+.06,y1-.06]){K.box(x0,x1,y-.04,y+.04,z+.9,z+1,'#ece6d6');for(let x=x0;x<=x1;x+=2.4)K.box(x-.04,x+.04,y-.04,y+.04,z,z+.9,'#ece6d6')}}
    else{for(let y=y0+1;y<y1;y+=4)for(const x of[x0+.2,x1-.2])K.box(x-.12,x+.12,y-.12,y+.12,-1,z-.3,'#5a4632')}p.mesh=K.finish()}
  drawMeshBino({x:(p.x0+p.x1)/2,y:(p.y0+p.y1)/2,ang:0},p.mesh)}
function skyCols(){const y=listener().y,n=nN(y),s=nS(y);let top=mix(mix(hex('#7fb3df'),hex('#a9c3d6'),n),hex('#5aa8e3'),s),hor=mix(mix(hex('#dcebf2'),hex('#e8eef0'),n),hex('#eef4ec'),s);
  if(SEASON==='winter'){top=mix(top,hex('#b8c6d2'),.4);hor=mix(hor,hex('#eef1f3'),.4)}else if(SEASON==='fall'){hor=mix(hor,hex('#f4e6cf'),.35)}
  if(isEve()){top=mix(top,hex('#46508f'),.72);hor=mix(hor,hex('#f3a46a'),.68)}const w=wxKind();if(w==='rain'){top=mix(top,hex('#7e8995'),.75);hor=mix(hor,hex('#b6bec6'),.75)}else if(w==='snow'){top=mix(top,hex('#a6b0ba'),.75);hor=mix(hor,hex('#e0e5ea'),.75)}return{top,hor}}
// A1 the bird most in front of you within ~60 m and ~35 degrees either side: where is it in the optic?
function aimTarget(yaw){const E=binoEye();let best=null,bs=1e9;
  for(const b of S.birds){if(b.st==='dormant'||b.under)continue;const dx=(b.x-E.x)/M,dy=(b.y-E.y)/M,dist=Math.hypot(dx,dy),so=!!b.soar||b.st==='ledge';if(dist<2||dist>(so?190:60))continue;
    const by=Math.atan2(dy,dx),da=Math.abs(angDiff(yaw,by));if(da>(so?.95:.62))continue;const sc=so?da*1.1+dist/260:da*1.6+dist/60+(b.st==='fly'?.4:0);if(sc<bs){bs=sc;best={yaw:by,pitch:clamp(Math.atan2((b.z||0)+.1-E.h,dist),-.35,1.2),b}}}
  return best}
function toggleBino(on){on=on??!S.bino.on;if(paused())return;const B=S.bino;
  if(on&&S.mode==='walk'&&S.player.water==='swim'){toast('You can\'t use your optics while swimming. Wade in the shallows or take a boat.',2);return}
  if(on&&S.mode==='plane'&&S.boat&&S.boat.st!=='water'){toast('Hands on the controls. Land first, then raise your optics.',2);return}
  if(on&&(S.mode==='boat'||S.mode==='plane')&&S.gear==='scope'){toast('The scope needs solid ground. Use binoculars or the camera from a boat.',2);return}
  if(on){
    if(S.mode==='drive'&&Math.abs(S.car.v)>90){toast('Pull over first');return}
    if(S.gear==='scope'&&S.mode==='drive'){toast('Get out to set up the scope');return}
    B.on=true;B.yaw=S.mode==='drive'?S.car.ang:S.player.face;B.pitch=.02;{const a=aimTarget(B.yaw);B.follow=a&&a.b&&(a.b.soar||a.b.st==='ledge')?a.b:null;if(a){B.yaw=a.yaw;B.pitch=a.pitch}}B.prog=0;B.target=null;S.player.moving=false;buildPano();SFX.click();
    // the scope needs its tripod set up first
    if(S.gear==="scope"){B.fade=-1.2;B.setup=1.1;SFX.tripod();$('idtag').textContent='Setting up the tripod…';$('idtag').style.opacity=1}else B.fade=0;
    B.zoom=clamp(B.zoom,0,opticZooms().length-1)}
  else{B.on=false;B.setup=0;$('idtag').style.opacity=0}
  document.body.classList.toggle('bino',B.on);document.body.classList.toggle('cam',B.on&&S.gear==='cam');document.body.dataset.gear=S.gear;$('binoBtn').classList.toggle('on',B.on);
  $('binoLbl').textContent=B.on?'Lower '+GEAR[S.gear].name.toLowerCase():GEAR[S.gear].name;$('zoomLbl').textContent=zoomLabel()}
function zoomBy(d,fine){const B=S.bino;if(S.gear==='cam')B.mm=clamp(Math.round((B.mm+d*(fine?25:50))/25)*25,CAM_MM[0],CAM_MM[1]);else B.zoom=clamp(B.zoom+d,0,opticZooms().length-1);$('zoomLbl').textContent=zoomLabel();SFX.click()}
function updateBino(dt){const B=S.bino,inp=getInput();B.fade=Math.min(1,(B.fade||0)+dt*4);B.flash=Math.max(0,(B.flash||0)-dt*3);
  if(B.setup>0){B.setup-=dt;if(B.setup<=0)$('idtag').style.opacity=0}
  if(inp.m>0){const rate=binoFov()*(S.gear==='scope'?.45:.75);B.yaw+=inp.x*inp.m*rate*dt;B.pitch=clamp(B.pitch-inp.y*inp.m*rate*dt,-.35,1.2)}
  const L=listener();if(!PANO.at||Math.hypot(PANO.at.x-L.x,PANO.at.y-L.y)>30)buildPano()}

// projection
let BV=null;
function bproj(x,y,h){const E=BV.E,rx=(x-E.x)/M,ry=(y-E.y)/M,f=rx*BV.fx+ry*BV.fy,l=rx*BV.rx+ry*BV.ry;if(f<.3)return null;
  const dist=Math.hypot(f,l),az=Math.atan2(l,f),el=Math.atan2(h-E.h,dist);return{x:BV.cx+az*BV.ppr,y:BV.cy-(el-BV.pitch)*BV.ppr,s:BV.ppr/dist,d:dist}}
function hazeCol(c,d){const k=clamp(d/220,0,.7);return rgb(mix(c,BV.sky.hor,k))}

function drawBino(t){ctx=mainCtx;ctx.setTransform(DPR,0,0,DPR,0,0);const B=S.bino,E=binoEye(),ppr=binoPPR();
  const sh=settings.shake&&!reduceMotion?(S.gear==='scope'?.08:S.gear==='cam'?.7:1):0,fd=fovDeg();const jx=(Math.sin(t*1.7)*.6+Math.sin(t*3.1+1)*.4)*.0009*sh*fd/10,jy=(Math.sin(t*2.3+2)*.6+Math.sin(t*1.1)*.4)*.0009*sh*fd/10;
  const yaw=B.yaw+jx,pitch=B.pitch+jy;
  BV={drawn:[],E,cx:VW/2,cy:VH/2,ppr,pitch,focus:B.focus||30,fx:Math.cos(yaw),fy:Math.sin(yaw),rx:-Math.sin(yaw),ry:Math.cos(yaw),sky:skyCols(),yaw};
  const hy=VH/2+pitch*ppr;
  // sky
  const g=ctx.createLinearGradient(0,hy-ppr*.6,0,hy);g.addColorStop(0,rgb(BV.sky.top));g.addColorStop(1,rgb(BV.sky.hor));ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  // clouds at fixed bearings
  for(let i=0;i<9;i++){const b=i*.7+.3,el=(.12+(i%3)*.08),sx=VW/2+angDiff(yaw,b)*ppr,sy=VH/2-(el-pitch)*ppr;const w=(.12+(i%4)*.03)*ppr;if(sx<-w||sx>VW+w)continue;
    ctx.fillStyle='rgba(255,255,255,.75)';for(let k=0;k<5;k++)ell(sx+(k-2)*w*.28,sy+Math.sin(k*2)*w*.06,w*.24,w*.11)}
  // mountains and far tree line
  const N=PANO.cols,col=i=>((i%N)+N)%N;const a0=yaw-(VW/2)/ppr,a1=yaw+(VW/2)/ppr,i0=Math.floor(a0/TAU*N)-1,i1=Math.ceil(a1/TAU*N)+1;
  const bx=i=>VW/2+angDiff(yaw,i/N*TAU)*ppr;
  ctx.fillStyle=hazeCol(hex('#7d8aa0'),180);ctx.beginPath();ctx.moveTo(bx(i0),hy);for(let i=i0;i<=i1;i++)ctx.lineTo(VW/2+(i/N*TAU-yaw)*ppr,hy-PANO.mtn[col(i)]*ppr);ctx.lineTo(VW/2+(i1/N*TAU-yaw)*ppr,hy);ctx.fill();
  const tl=mix(nN(E.y)>.5?hex('#2c4f36'):hex('#40623a'),BV.sky.hor,.45);ctx.fillStyle=rgb(tl);ctx.beginPath();ctx.moveTo(VW/2+(i0/N*TAU-yaw)*ppr,hy+1);
  for(let i=i0;i<=i1;i++){const h=PANO.sky[col(i)];ctx.lineTo(VW/2+(i/N*TAU-yaw)*ppr,hy-h*ppr*(.85+.15*Math.sin(i*2.7)))}ctx.lineTo(VW/2+(i1/N*TAU-yaw)*ppr,hy+1);ctx.fill();
  // the city skyline beyond the near buildings
  if(PANO.city){ctx.fillStyle=hazeCol(hex('#8e98a4'),160);ctx.beginPath();ctx.moveTo(VW/2+(i0/N*TAU-yaw)*ppr,hy+1);for(let i=i0;i<=i1;i++){const h=PANO.city[col(i)];const x=VW/2+(i/N*TAU-yaw)*ppr;ctx.lineTo(x,hy-h*ppr);ctx.lineTo(x+TAU/N*ppr,hy-h*ppr)}ctx.lineTo(VW/2+(i1/N*TAU-yaw)*ppr,hy+1);ctx.fill()}
  // ground: one strip per distance ring from the panorama
  ctx.imageSmoothingEnabled=true;const ds=PANO.ds;
  // which bearings are on screen, as panorama columns (with wrap)
  const c0=(a0/TAU*N),c1=(a1/TAU*N);
  for(let j=ds.length-1;j>=0;j--){const yTop=hy+Math.atan2(E.h,ds[j]+(j===ds.length-1?2000:0))*ppr,yBot=j===0?VH+2:hy+Math.atan2(E.h,ds[j-1])*ppr+.5;
    if(yBot<0||yTop>VH)continue;
    let s0=c0,first=true;while(s0<c1){const base=Math.floor(s0/N)*N,seg=Math.min(c1,base+N),u0=s0-base,u1=seg-base;
      const X0=VW/2+(s0/N*TAU-yaw)*ppr,X1=VW/2+(seg/N*TAU-yaw)*ppr;ctx.drawImage(PANO.img,u0,j,Math.max(.01,u1-u0),1,X0,yTop,X1-X0+1,yBot-yTop+.5);s0=seg;first=false}}
  // haze toward the horizon
  const hz=ctx.createLinearGradient(0,hy,0,hy+ppr*.06);hz.addColorStop(0,`rgba(${BV.sky.hor.join(',')},.65)`);hz.addColorStop(1,`rgba(${BV.sky.hor.join(',')},0)`);ctx.fillStyle=hz;ctx.fillRect(0,hy,VW,ppr*.06);
  // swells rolling in where the panorama found water
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;for(let k=0;k<5;k++){const D=6+((k*13+t*3.2)%60);const yy=hy+Math.atan2(E.h,D)*ppr;ctx.beginPath();let on=false;
    for(let x=0;x<=VW;x+=6){const i=col(Math.floor((yaw+(x-VW/2)/ppr)/TAU*N));if(PANO.water[i]<D-1){if(!on){ctx.moveTo(x,yy);on=true}else ctx.lineTo(x,yy+Math.sin(x*.05+t*2)*.6)}else on=false}ctx.stroke()}
  // scene: trees, shrubs, birds, sorted far to near
  const items=[];const halfX=(VW/2)/ppr+.15;
  const inView=(x,y,rad)=>{const rx=(x-E.x)/M,ry=(y-E.y)/M,f=rx*BV.fx+ry*BV.fy,l=rx*BV.rx+ry*BV.ry;if(f<-rad)return null;const d=Math.hypot(f,l);if(d>RANGE+rad)return null;const az=Math.atan2(l,f);if(Math.abs(az)-Math.atan2(rad,Math.max(d,.1))>halfX)return null;return d};
  const treeBirds=new Map();for(const b of S.birds){b.scr=null;if((b.st==='perch'||b.st==='trunk')&&b.tree&&!b.hop){let a=treeBirds.get(b.tree);if(!a)treeBirds.set(b.tree,a=[]);a.push(b)}}
  for(const c of cellsNear(E.x,E.y,RANGE*M)){
    for(const T of c.trees){const d=inView(T.x,T.y,T.h*.7);if(d==null||d<.8)continue;items.push({d,f:()=>drawTreeBino(T,treeBirds.get(T.id),d,t)})}
    for(const dd of c.decor){if(dd.k==='shell'||dd.k==='mound')continue;const d=inView(dd.x,dd.y,2);if(d==null||d>45||d<1)continue;items.push({d,f:()=>drawShrubBino(dd,t)})}}
  for(const b of S.birds){if(b.st==='dormant'||b.under)continue;if(b.st==='ground'||b.st==='fly'||b.hop||!b.tree){const d=inView(b.x,b.y,1);if(d==null)continue;items.push({d,f:()=>drawBirdBino(b,t,null)})}}
  {const d=S.mode!=='drive'?inView(S.car.x,S.car.y,3):null;if(d!=null&&d>2)items.push({d,f:()=>drawCarBino(d)})}
  for(const B of BOATS){if(B===S.boat&&(S.mode==='boat'||S.mode==='plane')||B.alt>.02)continue;const K=BOATK[B.craft],d=inView(B.x,B.y,K.L*.6);if(d==null||d<1.5)continue;
    items.push({d,f:()=>{const o={x:B.x,y:B.y,ang:B.ang,color:K.col};drawMeshBino(o,boatMesh(B.craft));
      if(B===S.boat)return;const a=bproj(B.x,B.y,0),b=bproj(B.x,B.y,1.2);if(a&&b)BV.drawn.push({t:[a.x,a.y,b.x,b.y,K.W*a.s*.5,K.W*b.s*.5]})}})}
  // buildings (seen much further than plants), piers, vehicles and people
  const farView=(x,y,rad,max)=>{const rx=(x-E.x)/M,ry=(y-E.y)/M,f=rx*BV.fx+ry*BV.fy,l=rx*BV.rx+ry*BV.ry;if(f<-rad)return null;const d=Math.hypot(f,l);if(d>max+rad)return null;if(Math.abs(Math.atan2(l,f))-Math.atan2(rad,Math.max(d,.1))>halfX)return null;return d};
  for(const b of buildingsNear(E.x,E.y,2600)){const R=Math.hypot(b.w,b.d)/M/2,d=farView(b.x+b.w/2,b.y+b.d/2,R+2,260);if(d==null)continue;if(E.x>b.x&&E.x<b.x+b.w&&E.y>b.y&&E.y<b.y+b.d)continue;items.push({d:Math.max(d-R*.5,.5),f:()=>drawBuildingBino(b)})}
  for(const F of FERRIES){const d=farView(F.x,F.y,FERRYK.L/2,400);if(d!=null)items.push({d,f:()=>drawMeshBino({x:F.x,y:F.y,ang:F.ang,color:'#ffffff'},ferryMesh())})}
  for(const p of PIERS){const R=Math.hypot(p.x1-p.x0,p.y1-p.y0)/M/2,d=farView((p.x0+p.x1)/2,(p.y0+p.y1)/2,R,260);if(d==null)continue;items.push({d:onPier(E.x,E.y)===p?999:d+R*.3,f:()=>drawPierBino(p)})}
  for(const v of[...parkedNear(E.x,E.y,1400),...TRAFFIC,TRACTOR]){const d=farView(v.x,v.y,6,140);if(d!=null&&d>1.5)items.push({d,f:()=>drawVehicleBino(v)})}
  for(const p of PEOPLE){const d=farView(p.x,p.y,1,90);if(d!=null&&d>1)items.push({d,f:()=>drawPersonBino(p,t)})}
  items.sort((a,b)=>b.d-a.d);
  let band=0;const bands=[60,32,16];
  for(const it of items){while(band<bands.length&&it.d<bands[band]){ctx.fillStyle=`rgba(${BV.sky.hor.join(',')},${[.16,.1,.05][band]})`;ctx.fillRect(0,0,VW,hy+ppr*.2);band++}it.f()}
  drawAtmos(t,true);birdVisibility();opticTarget();if(B.shoot){B.shoot=false;capturePhoto()}binoFrame(t);binoID(t);if(B.flash>0){ctx.fillStyle=`rgba(255,255,255,${B.flash*.5})`;ctx.fillRect(0,0,VW,VH)}}


function drawTreeBino(T,birds,dist,t){const m=model(T),lod=dist>45?0:dist>20?1:2;
  const parts=[];const E=BV.E;
  const W=(ox,oy)=>[T.x+ox*M,T.y+oy*M];const dd=(ox,oy)=>{const w=W(ox,oy);return Math.hypot(w[0]-E.x,w[1]-E.y)/M};
  parts.push({d:dist,trunk:true,f:()=>binoTrunk(T,m,dist)});
  if(m.stems)for(const [sx,sy] of m.stems)parts.push({d:dd(sx,sy),f:()=>{const a=bproj(...W(sx*.35,sy*.35),0),e=bproj(...W(sx*2+m.tr.top[0],sy*1.4+m.tr.top[1]),m.tr.h*.95);if(!a||!e)return;limb2(a.x,a.y,e.x,e.y,Math.max(1,m.tr.w0*.7*a.s),Math.max(.8,m.tr.w1*.7*e.s),hazeCol(hex(m.bark),dist),hazeCol(hex(m.barkD),dist))}});
  if(m.roots)for(const q of m.roots){parts.push({d:dd(Math.cos(q.a)*q.R*.6,Math.sin(q.a)*q.R*.6),f:()=>{const s=bproj(...W(Math.cos(q.a)*.15,Math.sin(q.a)*.15),q.h),k=bproj(...W(Math.cos(q.a)*q.R*.75,Math.sin(q.a)*q.R*.75),q.h*.95),e=bproj(...W(Math.cos(q.a)*q.R,Math.sin(q.a)*q.R),0);if(!s||!k||!e)return;ctx.strokeStyle=hazeCol(hex(m.bark),dist);ctx.lineWidth=Math.max(1,.07*s.s);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.quadraticCurveTo(k.x,k.y,e.x,e.y);ctx.stroke()}})}
  if(lod>0||m.cl.length===0)for(const b of m.br){const mx=(b.a[0]+b.b[0])/2,my=(b.a[1]+b.b[1])/2;parts.push({d:dd(mx,my),f:()=>{const a=bproj(...W(b.a[0],b.a[1]),b.a[2]),e=bproj(...W(b.b[0],b.b[1]),b.b[2]);if(a&&e){const w0=Math.max(1,b.w*2*a.s),w1=Math.max(.8,b.w*1.2*e.s);ctx.fillStyle=m.tr.col;const nx=-(e.y-a.y),ny=e.x-a.x,l=Math.hypot(nx,ny)||1;ctx.beginPath();ctx.moveTo(a.x+nx/l*w0/2,a.y+ny/l*w0/2);ctx.lineTo(e.x+nx/l*w1/2,e.y+ny/l*w1/2);ctx.lineTo(e.x-nx/l*w1/2,e.y-ny/l*w1/2);ctx.lineTo(a.x-nx/l*w0/2,a.y-ny/l*w0/2);ctx.fill()}}})}
  for(const c of m.cl)parts.push({d:dd(c.x,c.y),c,f:()=>binoClump(T,m,c,lod,t)});
  for(const s of m.moss)parts.push({d:dd(s.x,s.y)-.05,f:()=>{const p=bproj(...W(s.x,s.y),s.h);if(!p)return;ctx.strokeStyle='rgba(176,184,156,.85)';ctx.lineWidth=Math.max(1,.05*p.s);ctx.beginPath();for(let k=-2;k<=2;k++){ctx.moveTo(p.x+k*.08*p.s,p.y);ctx.quadraticCurveTo(p.x+k*.12*p.s+Math.sin(t+k)*.05*p.s,p.y+s.len*.5*p.s,p.x+k*.06*p.s,p.y+s.len*p.s*(.7+.3*Math.sin(k*5)))}ctx.stroke()}});
  if(birds)for(const b of birds){const bd=Math.hypot(b.x-E.x,b.y-E.y)/M;parts.push({d:bd-(b.st==='trunk'?.0:.05),bird:b})}
  parts.sort((a,b)=>b.d-a.d);
  const nearK=BV.focus*.42;
  for(let i=0;i<parts.length;i++){const p=parts[i];if(p.bird){drawBirdBino(p.bird,t)}else if(p.d<nearK&&!p.trunk){ctx.globalAlpha=clamp(.12+.5*(p.d/nearK)**2,.1,.6);BV.fading=true;p.f();BV.fading=false;ctx.globalAlpha=1}else p.f()}}
/* foliage sprites: leaves with real gaps, so a bird can show through or hide behind them */
function coveredBy(it,x,y){if(it.r){const R=it.r;return x>R[0]&&x<R[2]&&y>R[1]&&y<R[3]}if(it.b){const B=it.b;let u=(x-B.p.x)/(2*B.R)+.5,v=(y-B.p.y)/(2*B.R*B.ry)+.5;if(u<0||u>=1||v<0||v>=1)return false;if(B.flip<0)u=1-u;return B.sp.al[Math.floor(v*B.sp.Q)*B.sp.Q+Math.floor(u*B.sp.Q)]>110}
  const [bx,by,tx,ty,w0,w1]=it.t;if(y>by||y<ty)return false;const f=(by-y)/Math.max(1,by-ty);return Math.abs(x-lerp(bx,tx,f))<lerp(w0,w1,f)}
function birdVisibility(){for(const b of S.birds){if(!b.scr||!b._pts)continue;let vis=0;for(const q of b._pts){let hid=false;for(let i=b._idx;i<BV.drawn.length;i++)if(coveredBy(BV.drawn[i],q[0],q[1])){hid=true;break}if(!hid)vis++}b.scr.vis=vis/b._pts.length}}
function drawBirdBino(b,t){const E=BV.E;let wx=b.x,wy=b.y;
  const p=bproj(wx,wy,b.z);if(!p)return;const s=p.s/100*BIRD_EX*(GB[b.sp]?gbBinoEx(b.sp):1);const len=SPECIES[b.sp].len*s;
  if(p.x<-len*2||p.x>VW+len*2||p.y<-len*2||p.y>VH+len*2)return;
  const lat=Math.cos(b.hd)*BV.rx+Math.sin(b.hd)*BV.ry;let face=lat>=0?1:-1;
  ctx.save();ctx.translate(p.x,p.y);
  if(b.st==='fly'){const above=b.z>E.h+.3;drawBird(b.sp,'fly',s,face,{flap:b.flap,ventral:above,detail:s>2})}
  else if(GB[b.sp])drawBird(b.sp,gbPose(b),s,face,{bob:b.bob,tailFlick:b.tail,under:b.z>E.h+2,run:!!b.goal&&b.st==='ground',ph:b.run||0,peck:b.peck,stem:b.st==='reed'?110:0,water:b.st==='wade'?SPECIES[b.sp].len*GB[b.sp].shape.legs*.6:0,detail:s>1.6});
  else if(b.st==='trunk'){const T=treeById(b.tree),m=T&&model(T);if(m){const c=trunkAt(m,b.perch.h),cp=bproj(T.x+c[0]*M,T.y+c[1]*M,b.perch.h);if(cp)face=cp.x>=p.x?1:-1}
    drawBird('pile','trunk',s,face,{peck:b.peck>0?Math.sin(b.peck*PI*4)*.5:0,detail:s>1.6})}
  else if(b.sp==='pipl')drawBird('pipl','stand',s,face,{run:!!b.goal,ph:b.run||0,peck:b.peck,detail:s>1.6});
  else drawBird(b.sp,'perch',s,face,{bob:b.bob,tailFlick:b.tail,under:b.z>E.h+2,detail:s>1.6});
  ctx.restore();
  // how much of the bird is hidden by foliage or trunk drawn in front of it
  const F=FL[b.sp],h=GB[b.sp]&&b.st!=='fly'?SPECIES[b.sp].len*(GB[b.sp].shape.bh+GB[b.sp].shape.legs*.7+(GB[b.sp].shape.neck?.4:.12))*s:b.st==='trunk'?SPECIES.pile.len*.7*s:b.sp==='btbw'?8*s:13*s,cy=p.y-h*.5;const pts=[[p.x,cy],[p.x-len*.3,cy],[p.x+len*.3,cy],[p.x,cy-h*.3],[p.x,cy+h*.3],[p.x+len*.15,cy-h*.15],[p.x-len*.15,cy+h*.15]];
  b._idx=BV.drawn.length;b._pts=pts;
  b.scr={x:p.x,y:cy,len,hh:h*.5,vis:1,d:p.d}}

const MASK={};
function frameGeom(){const g=S.gear;if(g==='cam')return{kind:'cam',R:Math.min(VW,VH)*.45};if(g==='scope')return{kind:'scope',R:Math.min(VW*.47,VH*.45),two:false,off:0};
  const two=VW/VH>1.15,R=two?Math.min(VW*.29,VH*.47):Math.min(VW*.49,VH*.4);return{kind:'bino',R,two,off:two?R*.62:0}}
function binoFrame(t){const B=S.bino,G=frameGeom(),cx=VW/2,cy=VH/2,R=G.R;BV.R=R;BV.two=G.two;
  if(G.kind!=='cam'){
    const key=G.kind+VW+'x'+VH+'x'+DPR;if(!MASK.c||MASK.k!==key){MASK.k=key;const c=MASK.c=document.createElement('canvas');c.width=VW*DPR;c.height=VH*DPR;const g=c.getContext('2d');g.scale(DPR,DPR);g.fillStyle='#050807';g.fillRect(0,0,VW,VH);
      const soft=G.kind==='scope'?.9:.8;for(const ox of G.two?[-G.off,G.off]:[0]){const gr=g.createRadialGradient(cx+ox,cy,R*soft,cx+ox,cy,R);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.85,'rgba(0,0,0,.6)');gr.addColorStop(1,'rgba(0,0,0,0)');g.globalCompositeOperation='destination-out';g.fillStyle=gr;g.beginPath();g.arc(cx+ox,cy,R,0,TAU);g.fill()}
      if(G.kind==='scope'){g.globalCompositeOperation='source-over';g.strokeStyle='#1d2220';g.lineWidth=10;g.beginPath();g.arc(cx,cy,R+4,0,TAU);g.stroke();g.strokeStyle='rgba(255,255,255,.06)';g.lineWidth=2;g.beginPath();g.arc(cx,cy,R+10,0,TAU);g.stroke()}}
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(MASK.c,0,0);ctx.restore()}
  else camFrame(t);
  if(B.fade<1){ctx.fillStyle=`rgba(5,8,7,${Math.min(1,1-B.fade)})`;ctx.fillRect(0,0,VW,VH)}
  // bearing tape
  const brg=((B.yaw*180/PI+90)%360+360)%360,ppd=BV.ppr*PI/180,ty=G.kind==='cam'?40:cy-R*.86,tw=G.kind==='cam'?180:R*.6;
  ctx.save();ctx.beginPath();ctx.rect(cx-tw,ty-16,tw*2,30);ctx.clip();ctx.font='600 11px Fredoka,system-ui';ctx.textAlign='center';
  const span=G.kind==='scope'?20:60,k=G.kind==='scope'?.1:.35;
  for(let d=Math.floor(brg-span);d<=brg+span;d++){if(G.kind!=='scope'&&d%5)continue;const x=cx+(d-brg)*ppd*k;const dd=((d%360)+360)%360;ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(x-.5,ty,1,dd%15?4:8);
    if(dd%45===0){ctx.fillStyle=dd%90?'rgba(255,255,255,.75)':'#ffc93c';ctx.fillText(['N','NE','E','SE','S','SW','W','NW'][dd/45],x,ty-3)}}
  ctx.restore();ctx.fillStyle='#ffc93c';ctx.beginPath();ctx.moveTo(cx,ty+11);ctx.lineTo(cx-4,ty+17);ctx.lineTo(cx+4,ty+17);ctx.fill()}
// camera viewfinder: thirds grid, focus points, settings strip
function camFrame(t){const B=S.bino,cx=VW/2,cy=VH/2;
  const v=ctx.createRadialGradient(cx,cy,Math.min(VW,VH)*.45,cx,cy,Math.hypot(VW,VH)*.6);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');ctx.fillStyle=v;ctx.fillRect(0,0,VW,VH);
  ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=1;ctx.beginPath();for(const f of[1/3,2/3]){ctx.moveTo(VW*f,0);ctx.lineTo(VW*f,VH);ctx.moveTo(0,VH*f);ctx.lineTo(VW,VH*f)}ctx.stroke();
  const af=Math.min(VW,VH)*.07;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const x=cx+i*af*1.6,y=cy+j*af*1.2,w=af*.42;ctx.beginPath();for(const [sx,sy] of[[-1,-1],[1,-1],[1,1],[-1,1]]){ctx.moveTo(x+sx*w,y+sy*w*.7);ctx.lineTo(x+sx*w*.55,y+sy*w*.7);ctx.moveTo(x+sx*w,y+sy*w*.7);ctx.lineTo(x+sx*w,y+sy*w*.3)}ctx.stroke()}
  // focus box locks onto the subject
  const T=B.target;if(T&&T.scr){const s=T.scr,ok=B.lock,w=Math.max(30,s.len*.75);ctx.strokeStyle=ok?'#7fe08a':'rgba(255,255,255,.85)';ctx.lineWidth=2.5;ctx.strokeRect(s.x-w,s.y-w*.75,w*2,w*1.5)}
  // settings strip
  const sp=Math.round(B.mm),shutter=sp>=400?'1/2000':'1/1250',fnum=sp>=500?'f/6.3':'f/5.6';
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,VH-34,VW,34);ctx.font='600 13px Fredoka,system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';
  ctx.fillText(`${sp} mm    ${shutter}    ${fnum}    ISO 800    [${S.album?S.album.count:0}]`,cx,VH-17);ctx.textBaseline='alphabetic';
  dot(28,VH-17,5,B.lock?'#7fe08a':'#666')}
function opticTarget(){const B=S.bino,cx=VW/2,cy=VH/2,R=frameGeom().R;let best=null,bs=1e9;
  // distance from the centre of the view to the bird's outline, so a bird that fills the frame still counts
  for(const b of S.birds){const s=b.scr;if(!s)continue;const d=Math.hypot(Math.max(0,Math.abs(s.x-cx)-s.len*.4),Math.max(0,Math.abs(s.y-cy)-(s.hh||0)*.8));if(d<R*.34&&d<bs){bs=d;best=b}}
  B.best=best;B.bestD=bs;const s=best&&best.scr;B.lock=!!(s&&s.len>=24&&s.vis>=.45&&bs<R*.24);
  if(S.gear==='cam'){if(best!==B.target)B.target=best}}
function binoID(t){const B=S.bino,cx=VW/2,cy=VH/2,R=BV.R;const best=B.best,bs=B.bestD;
  if(B.setup>0)return;
  let msg='',ok=false;
  if(best){const s=best.scr;if(s.len<24)msg='Too far to see field marks. Zoom in';else if(s.vis<.45)msg='Mostly hidden. Wait, or walk around for a clearer look';else if(bs>R*.2)msg='Center it';else{ok=true;msg='Hold steady…'}}
  if(S.gear==='cam'){camUI(best);return}
  if(best!==B.target){B.target=best;B.prog=0}
  {const want=best?best.scr.d:30;B.focus=lerp(B.focus||30,want,.08)}
  if(ok&&best.logged){ok=false;msg=''}
  if(ok){const p0=B.prog;B.prog=Math.min(1,B.prog+(B._dt||1/60)/1.1);if(Math.floor(B.prog*6)!==Math.floor(p0*6))SFX.focus(B.prog)}else B.prog=Math.max(0,B.prog-(B._dt||1/60)*2);
  // reticle
  const rr=R*.2;ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=1.5;ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(cx,cy,rr,0,TAU);ctx.stroke();ctx.setLineDash([]);
  if(B.prog>0){ctx.strokeStyle='#ffc93c';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(cx,cy,rr,-PI/2,-PI/2+TAU*B.prog);ctx.stroke()}
  const tag=$('idtag');
  if(best&&S.journal.seen[best.sp]&&best.scr.len>=24&&best.scr.vis>=.45){tag.textContent=SPECIES[best.sp].name+(S.journal.seen[best.sp].count>1?` · seen ${S.journal.seen[best.sp].count}×`:'');tag.style.opacity=1}
  else if(msg){tag.textContent=msg;tag.style.opacity=1}else tag.style.opacity=0;
  if(B.prog>=1&&best){B.prog=0;B.target=null;logSighting(best,S.gear)}}
function camUI(best){const B=S.bino,tag=$('idtag');let msg='';
  if(best){const s=best.scr;msg=s.len<24?'Too small in the frame. Zoom in':s.vis<.45?'Leaves in the way':B.lock?(S.journal.seen[best.sp]?'Focus locked: '+SPECIES[best.sp].name:'Focus locked'):'Put it in the focus box'}
  tag.textContent=msg||'Camera ready';tag.style.opacity=1}

/* ---------- photo album ----------
   Photos are JPEGs kept in this browser's IndexedDB (they never leave the device).
   If IndexedDB is unavailable (private window, blocked storage) photos live in memory until the page closes. */
S.album={count:0,list:[],persistent:true};
const ALBUM=(()=>{let dbp=null;const mem=new Map();
  function open(){if(dbp)return dbp;dbp=new Promise(res=>{try{const rq=indexedDB.open('field-guide-album',1);rq.onupgradeneeded=()=>{rq.result.createObjectStore('photos',{keyPath:'id'})};rq.onsuccess=()=>res(rq.result);rq.onerror=()=>res(null);rq.onblocked=()=>res(null)}catch(e){res(null)}});return dbp}
  async function tx(mode,fn){const db=await open();if(!db)return null;return new Promise(res=>{try{const t=db.transaction('photos',mode),st=t.objectStore('photos');const r=fn(st);t.oncomplete=()=>res(r&&r.result!==undefined?r.result:true);t.onerror=()=>res(null)}catch(e){res(null)}})}
  return{
    async all(){const r=await tx('readonly',st=>st.getAll());if(r===null){S.album.persistent=false;return[...mem.values()]}return r},
    async put(p){const ok=await tx('readwrite',st=>st.put(p));if(ok===null){S.album.persistent=false;mem.set(p.id,p)}},
    async del(id){const ok=await tx('readwrite',st=>st.delete(id));mem.delete(id);return ok}}})();
async function refreshAlbum(){const all=await ALBUM.all();all.sort((a,b)=>b.ts-a.ts);S.album.list=all;S.album.count=all.length;return all}
refreshAlbum();
// grab the scene (before the viewfinder overlays are drawn) as a photo
function capturePhoto(){const B=S.bino,best=B.best,ok=B.lock&&best;
  const W=Math.min(1600,cv.width),H=Math.round(W*cv.height/cv.width);const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(cv,0,0,W,H);
  const tw=360,th=Math.round(tw*H/W),tc=document.createElement('canvas');tc.width=tw;tc.height=th;tc.getContext('2d').drawImage(c,0,0,tw,th);
  const L=listener(),rec={id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),ts:Date.now(),sp:ok?best.sp:null,zone:zoneName(L.x,L.y),temp:tempC(L.x,L.y),mm:Math.round(B.mm),fav:false,thumb:tc.toDataURL('image/jpeg',.8),w:W,h:H};
  c.toBlob(async blob=>{rec.full=blob;await ALBUM.put(rec);await refreshAlbum();if(!$('journal').hidden&&jApp==='album')renderJournal()},'image/jpeg',.88);
  if(ok){if(!best.logged)logSighting(best,'cam');toast(`Photo: ${S.journal.seen[best.sp]?SPECIES[best.sp].name:'bird'} · saved to your album`,2)}
  else toast(best?'Photo saved. The bird was not in focus':'Photo saved to your album',2)}

/* ---------- species plates (journal, new-species card, thumbnails) ---------- */
const PLATE_BOUNDS={btbw:[-5.6,5.8,-9.4,2.4],pile:[-9.5,7.5,-26.5,16.5],pipl:[-9.2,9.4,-14.2,.8]};
const SHAPE_TXT={mall:'Large, heavy-bodied duck that floats high, with a long flat bill and a rounded head.',
  colo:'Big, long-bodied diver that sits low in the water, with a thick neck, flat crown and heavy dagger bill.',
  noga:'Very large seabird, pointed at both ends: long narrow wings, pointed tail and a pointed bill.',
  brpe:'Huge, heavy waterbird with a very long bill and throat pouch, short legs and a thick, S-curved neck.',
  gbhe:'Very tall wader with long legs, a long S-curved neck and a heavy dagger bill.',
  greg:'Tall, slender wader; a thinner neck than the Great Blue Heron and long black legs.',
  whib:'Medium wader with a long, down-curved bill and medium-length legs.',
  rutu:'Stocky, short-legged shorebird with a short, slightly upturned wedge bill.',
  sand:'Small, plump sandpiper with a short, straight black bill. Runs like a wind-up toy.',
  ropi:'Plump body with a small head, short legs and a fairly long, rounded tail.',
  beki:'Big-headed, with a shaggy crest, a long heavy bill, and short legs and tail.',
  rbnu:'Tiny, compact and big-headed, with almost no neck, a short tail and a sharp, chisel-like bill.',
  cawr:'Small, round wren with a long, often cocked tail and a slightly curved bill.',
  grca:'Slim, long-tailed songbird with a rounded tail and a thin bill.',
  eabl:'Small thrush with a round belly, short legs, a short notched tail and a thin bill.',
  amro:'Large songbird with a round belly, long legs and a fairly long tail. A handy yardstick for other birds.',
  ampi:'Slim, long-legged ground bird with a thin bill. Bobs its tail as it walks.',
  snbu:'Chunky, short-legged bunting with a short conical bill and a notched tail.',
  daju:'Medium sparrow with a round head, a small conical bill and a fairly long notched tail.',
  eato:'Large, long-tailed sparrow with a thick conical bill.',
  eame:'Chunky, short-tailed ground bird with a flat head and a long, sharp bill.',
  rwbl:'Stocky blackbird with a flat crown, a sharply pointed bill and a rounded tail.',
  prow:'Chunky, short-tailed warbler with a long, sharp bill.',
  pawa:'Slim warbler with a thin, sharp bill. Pumps its tail.',
  scta:'Medium, stocky songbird with a thick, pale bill.',
  noca:'Long-tailed songbird with a tall crest and a thick, cone-shaped bill.',
  pabu:'Small, compact bunting with a short, thick conical bill.',
  pipl:'Small, round plover with a short, stubby bill and short orange legs.',
  btbw:'Small, compact warbler with a short, thin bill.',
  pile:'Crow-sized woodpecker with a pointed crest, a long neck and a chisel-like bill.'};
function sizeRef(id){const L=SPECIES[id].len;let r=L>=60?'mall':'amro';if(r===id)r=id==='amro'?'daju':'amro';return r}
function sizeText(id){const D=SPECIES[id],R=SPECIES[sizeRef(id)],k=D.len/R.len,nm=R.name.replace('Dark-eyed ','').replace('American ','');
  const a=k>=1.6?`About ${k>=2.5?Math.round(k):(Math.round(k*2)/2)} times as long as a ${nm}`:k>=1.15?`A bit bigger than a ${nm}`:k>.87?`About the size of a ${nm}`:k>.6?`Smaller than a ${nm}`:`Much smaller than a ${nm}`;
  return`${SHAPE_TXT[id]||(GB[id]&&GB[id].shapeTxt)||''} ${a} (${Math.round(D.len)} cm long vs ${Math.round(R.len)} cm).`}
function sizePose(id){return id==='pile'?'trunk':id==='pipl'?'stand':GB[id]?gbPlatePose(id):'perch'}
function drawSizeCompare(cvs,id){const g=cvs.getContext('2d'),W=cvs.width,H=cvs.height,prev=ctx,ref=sizeRef(id);
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);g.fillStyle='#f3eedd';g.fillRect(0,0,W,H);
  const bx=[id,ref].map(k=>plateBox(k,'perched')),wd=bx.map(b=>b[1]-b[0]),ht=bx.map(b=>b[3]-b[2]),gap=Math.max(wd[0],wd[1])*.35;
  const s=Math.min(W*.86/(wd[0]+wd[1]+gap),H*.66/Math.max(ht[0],ht[1])),base=H*.8;
  g.strokeStyle='#cfc6aa';g.lineWidth=2;g.beginPath();g.moveTo(W*.04,base);g.lineTo(W*.96,base);g.stroke();
  g.font=`600 ${Math.round(H*.075)}px Fredoka,system-ui`;const lab=k=>`${SPECIES[k].name} · ${Math.round(SPECIES[k].len)} cm`,slot=[0,1].map(i=>Math.max(wd[i]*s,g.measureText(lab(i?ref:id)).width+H*.1));
  let x=(W-(slot[0]+slot[1]+gap*s*.5))/2;
  [[ref,1],[id,0]].forEach(([k,i],n)=>{const b=bx[i],lay=document.createElement('canvas');lay.width=W;lay.height=H;const lg=lay.getContext('2d');
    const ox=x+(slot[i]-wd[i]*s)/2-b[0]*s,oy=base-b[3]*s;lg.translate(ox,oy);ctx=lg;drawBird(k,sizePose(k),s,1,{detail:false});
    lg.setTransform(1,0,0,1,0,0);lg.globalCompositeOperation='source-in';lg.fillStyle=k===id?'#2f4a3a':'#a7ad9f';lg.fillRect(0,0,W,H);g.drawImage(lay,0,0);
    g.fillStyle=k===id?'#2f4a3a':'#7d8577';g.font=`600 ${Math.round(H*.075)}px Fredoka,system-ui`;g.textAlign='center';g.textBaseline='top';g.fillText(lab(k),x+slot[i]/2,base+H*.04);
    x+=slot[i]+gap*s*.5});ctx=prev}
function plateBox(id,view){if(view==='perched')return PLATE_BOUNDS[id]||gbPlateBox(id);const F=FL[id];return[-F.WS/2,F.WS/2,-F.L*.36-F.hr-F.bill,F.L*.18+F.tl]}
function drawPlate(cvs,id,view='perched',o={}){const g=cvs.getContext('2d'),W=cvs.width,H=cvs.height;const prev=ctx;ctx=g;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);
  const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#f3eedd');bg.addColorStop(1,'#e6dfc8');g.fillStyle=bg;g.fillRect(0,0,W,H);
  const [x0,x1,y0,y1]=plateBox(id,view),pad=o.pad??1.22,s=Math.min(W/((x1-x0)*pad),H/((y1-y0)*pad));
  const ox=W/2-(x0+x1)/2*s,oy=H/2-(y0+y1)/2*s;g.save();g.translate(ox,oy);
  if(view==='perched'){
    if(id==='btbw'){g.fillStyle='#6b513b';g.beginPath();g.moveTo(-40*s,.05*s);g.quadraticCurveTo(0,-.2*s,40*s,.55*s);g.lineTo(40*s,1.55*s);g.quadraticCurveTo(0,.85*s,-40*s,1.15*s);g.fill();
      g.fillStyle='#55803a';for(const [x,y,r] of[[-4.4,-1.2,1.3],[4.6,.4,1.1],[-3.2,.9,.9]]){g.beginPath();g.ellipse(x*s,y*s,r*s*1.6,r*s*.6,-.4,0,TAU);g.fill()}}
    if(id==='pile'){g.fillStyle='#6d5d4b';g.fillRect(0,-60*s,30*s,120*s);g.fillStyle='rgba(0,0,0,.14)';for(let i=0;i<6;i++)g.fillRect((2+i*4.6)*s,-60*s,.8*s,120*s);
      drawHole(14*s,-4*s,2.6*s,2.9*s)}
    if(GB[id])gbPlateBg(g,id,s);
    if(id==='pipl'){g.fillStyle='#ead6a3';g.fillRect(-60*s,0,120*s,40*s);g.fillStyle='rgba(0,0,0,.05)';for(let i=0;i<30;i++)g.fillRect(((i*37)%120-60)*s,((i*13)%8)*.3*s,.6*s,.25*s)}}
  // bird on its own layer so an unseen species can be shown as a plain silhouette
  const lay=document.createElement('canvas');lay.width=W;lay.height=H;const lg=lay.getContext('2d');lg.translate(ox,oy);ctx=lg;
  if(view==='perched')drawBird(id,id==='pile'?'trunk':id==='pipl'?'stand':GB[id]?gbPlatePose(id):'perch',s,1,{detail:true,under:true});
  else drawBird(id,'top',s,1,{flap:0,ventral:view==='ventral',detail:true,heading:0});
  if(o.locked){lg.setTransform(1,0,0,1,0,0);lg.globalCompositeOperation='source-in';lg.fillStyle='#3d4b40';lg.fillRect(0,0,W,H)}
  ctx=g;g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(lay,0,0);g.restore();
  if(o.pins&&view==='perched'&&!o.locked){for(const mk of SPECIES[id].marks){let [mx,my]=mk.at;if(id==='btbw'&&mx>-1.9){const c=Math.cos(.3),sn=Math.sin(.3),dx=mx-.2,dy=my+1.5;mx=.2+dx*c-dy*sn;my=-1.5+dx*sn+dy*c}const r=Math.max(9,W*.018);g.fillStyle='#c23b2e';g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.arc(mx*s,my*s,r,0,TAU);g.fill();g.stroke();
    g.fillStyle='#fff';g.font=`700 ${Math.round(r*1.15)}px Fredoka,system-ui`;g.textAlign='center';g.textBaseline='middle';g.fillText(mk.n,mx*s,my*s+1)}}
  g.restore();
  if(view!=='perched'){g.fillStyle='#6a7a6e';g.font=`600 ${Math.round(H*.045)}px Fredoka,system-ui`;g.textAlign='left';g.textBaseline='top';g.fillText(view==='dorsal'?'From above':'From below',W*.03,H*.04)}
  ctx=prev}

/* ---------- life list + new species ---------- */
function updateLife(pop){const n=speciesSeen();const el=$('lifeCount');el.textContent=`${n}/${SP_ORDER.length}`;if(pop){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}}
function fmtWhen(ts){try{return new Date(ts).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch(e){return''}}
function logSighting(b,how='bino'){if(b.logged)return;b.logged=true;const sp=b.sp,j=S.journal.seen[sp];
  S.journal.log.push({sp,ts:Date.now(),zone:zoneName(b.x,b.y),temp:tempC(b.x,b.y),how,region:MAP_NAME});
  if(!j){S.journal.seen[sp]={count:1,first:{ts:Date.now(),zone:zoneName(b.x,b.y),temp:tempC(b.x,b.y)}};saveJournal();updateLife(true);SFX.chime();showFound(sp);
    if(trailNeed()>0&&speciesSeen()===REGION_NEED)setTimeout(()=>toast('Central unlocked! Find the trailhead at the end of Ridge Road.',5),400)}
  else{j.count++;saveJournal();toast(`${SPECIES[sp].name} · ${j.count} logged`);SFX.click()}}
let foundSp=null;
function showFound(sp){foundSp=sp;const D=SPECIES[sp],j=S.journal.seen[sp];$('foundName').textContent=D.name;$('foundSci').textContent=D.sci;
  $('foundEyebrow').textContent=`New species · ${speciesSeen()} of ${SP_ORDER.length}`;
  $('foundNote').textContent=`${fmtWhen(j.first.ts)}, ${j.first.zone}, ${j.first.temp}°C. ${D.marks.slice(0,3).map(m=>m.t.toLowerCase()).join('; ')}.`;
  drawPlate($('foundCanvas'),sp,'perched',{pins:false});$('foundBack').hidden=false;$('foundOk').focus()}
function closeFound(){$('foundBack').hidden=true}
$('foundOk').onclick=closeFound;$('foundJournal').onclick=()=>{closeFound();toggleJournal(true,foundSp)};

/* ---------- trailhead / region travel ---------- */
function openNote(eyebrow,title,body,btns){$('noteEyebrow').textContent=eyebrow;$('noteTitle').textContent=title;$('noteBody').textContent=body;const b=$('noteBtns');b.innerHTML='';
  for(const [lbl,fn,ghost] of btns){const e=document.createElement('button');e.className='btn'+(ghost?' ghost':'');e.textContent=lbl;e.onclick=()=>{closeNote();fn&&fn()};b.appendChild(e)}$('noteBack').hidden=false;b.lastChild&&b.lastChild.focus()}
function closeNote(){$('noteBack').hidden=true}
function storyOpen(k){return settings.play!=='story'||(settings.storyOpen||['east']).includes(k)}
function storyUnlock(k){const o=settings.storyOpen||['east'];if(!o.includes(k)){o.push(k);settings.storyOpen=o;try{localStorage.setItem('birding-settings',JSON.stringify(settings))}catch(e){}}}
function goMap(to,arrive){if(!storyOpen(to)){toast(`The ${({britain:'British Isle',east:'East Coast',central:'Central',west:'West Coast',pacific:'Pacific Isles',caribbean:'Caribbean Isle'})[to]} isn't open yet in Story mode.`,2.6);return}mpTravelOut(to,arrive);try{travelNote(JSON.stringify({v:2,at:Date.now(),map:to,arrive,wel:MSG.welRead?1:0}))}catch(e){}
  settings.map=to;try{localStorage.setItem('birding-settings',JSON.stringify(settings))}catch(e){}
  TRAVELLING=true;{const c=document.createElement('div');c.style.cssText='position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:#1f3a2c;color:#f4f1e6;font:600 22px/1.3 Fredoka,system-ui,sans-serif;text-align:center';c.innerHTML='<div><div style="font-size:14px;letter-spacing:.14em;text-transform:uppercase;opacity:.7">Big Year</div>Travelling to '+RNAME[to]+'…</div>';document.body.appendChild(c)}setTimeout(()=>location.reload(),MP.room?350:60)}
function openTravel(){const n=speciesSeen(),TR=S.trailAt||TRAIL;
  if(TR.to==='air'){const dest=Object.keys(AIRPORTS).filter(k=>k!==MAP);
    openNote(AP.name,'Where to?',`A DC-3 airliner flies from ${AP.town} to ${dest.map(k=>AIRPORTS[k].town).join(', ')}. Your Defender is shipped ahead and waits for you at the airport. The British Isle can only be reached by air.`,
      [['Stay here',null,true],...dest.map(k=>[`Fly to ${AIRPORTS[k].town} · ${RNAME[k]}`,()=>{if(!storyOpen(k)){toast(`The ${RNAME[k]} isn't open yet in Story mode.`,2.6);return}boardDC3(k)}])]);return}
  if(BRI){const PR={'Port Ardan ferry':'Balnamara ferry','Balnamara ferry':'Port Ardan ferry','North ferry':'Northern Isles ferry','Northern Isles ferry':'North ferry','Channel ferry':'Chalk Isle ferry','Chalk Isle ferry':'Channel ferry'},
      NM={'Port Ardan ferry':'Port Ardan','Balnamara ferry':'Balnamara','North ferry':'the north coast','Northern Isles ferry':'the Northern Isles','Channel ferry':'the south coast','Chalk Isle ferry':'Chalk Isle'};
    const q=TRAILS.find(t=>t.name===PR[TR.name]);openNote(TR.name,'Island ferry',`The ferry crosses to ${NM[q.name]}; your Defender rides along where there is a road.`,[['Stay here',null,true],[`Sail to ${NM[q.name]}`,()=>fastTravel({name:NM[q.name],x:q.x,y:q.y})]]);return}
  if(CAR){const NM={'Bahía Vieja pier':'Bahía Vieja','Este ferry':'Este','Isla Cayo ferry':'Isla Cayo'},hop=TRAILS.filter(q=>q!==TR).map(q=>[NM[q.name],()=>fastTravel({name:NM[q.name],x:q.x,y:q.y})]);
    if(TR.to==='east'){openNote('Bahía Vieja pier','Where to?','The island ferry calls at Este and Isla Cayo; your Defender rides along where there is a road. The big ferry sails north-west to Port Bostick on the East Coast.',[['Stay on the island',null,true],...hop,['Sail to the East Coast',()=>goMap('east','Caribbean ferry')]]);return}
    openNote(TR.name,'Island ferry','The ferry calls at Bahía Vieja, Este and Isla Cayo; your Defender rides along where there is a road. The ferry to the East Coast leaves from Bahía Vieja pier. Isla Iguana and the Cayos de Aves are reached by boat.',[['Stay here',null,true],...hop]);return}
  if(!CENTRAL&&TR.to==='caribbean'){openNote('Port Bostick ferry pier','Where to?','The car ferry sails south-east to Bahía Vieja on the Caribbean Isle, and your Defender rides along. For the British Isle, fly from Port Bostick Airport, just south of town.',[['Stay on the East Coast',null,true],['Sail to the Caribbean Isle',()=>goMap('caribbean','Bahía Vieja pier')]]);return}
  if(PAC){const ISL={'Harbor City pier':'Harbor City · Harbor Isle','Garden Town ferry':'Garden Town · Garden Isle','Cloud Bay ferry':'Cloud Bay · Cloud Isle','Sunset Bay ferry':'Sunset Bay · Fire Isle'},
      hop=TRAILS.filter(q=>q!==TR).map(q=>[ISL[q.name],()=>fastTravel({name:ISL[q.name].split(' · ')[0],x:q.x,y:q.y})]);
    if(TR.to==='west'){openNote('Harbor City pier','Where to?','The inter-island ferry calls at Garden Town, Cloud Bay and Sunset Bay, and your Defender rides along. The big ferry sails east across the Pacific to Port Madrone on the West Coast.',[['Stay in the islands',null,true],...hop,['Sail to the West Coast',()=>goMap('west','Pacific ferry')]]);return}
    openNote(TR.name,'Inter-island ferry','The ferry calls at the four island harbors, and your Defender rides along. The ferry to the West Coast leaves from Harbor City pier. Coral Atoll and Bird Rock are reached by boat from the marinas.',[['Stay here',null,true],...hop]);return}
  if(WEST&&TR.to==='pacific'){openNote('Ferry terminal','Sail to the Pacific Isles?','The ferry from Port Madrone crosses the Pacific to Harbor City on Harbor Isle: rain forest, volcanoes, coral reef and resorts on four high islands and an atoll. The islands\' birds come in a later update.',[['Stay on the West Coast',null,true],['Sail to the Pacific Isles',()=>goMap('pacific','Harbor City pier')]]);return}
  if(WEST){openNote('East Trail','Back to the Central?','The trail runs east over Elk Pass and down out of the Rockies to the West Trail trailhead on the Central\'s high plains.',[['Stay on the West Coast',null,true],['Go to the Central',()=>goMap('central','West Trail')]]);return}
  if(CENTRAL){if(TR.to==='west'){openNote('West Trail','Travel to the West Coast?','The trail climbs west over the Rockies to Elk Pass: rainforest, high peaks, deserts and the Pacific, from the Alaska tundra to the saguaros. You arrive at the East Trail trailhead by Elk Pass. The West\'s birds come in a later update.',[['Stay in the Central',null,true],['Go to the West Coast',()=>goMap('west','East Trail')]]);return}
    openNote('East Trail','Back to the East Coast?','The trail runs east through the oak-hickory woods and over the mountains to the trailhead at the end of Ridge Road.',[['Stay in the Central',null,true],['Go to the East Coast',()=>goMap('east','ridge')]]);return}
  if(n<trailNeed())openNote('Trailhead · Ridge Road','Central is locked',`Log ${REGION_NEED} East Coast species to open the trail west. You have ${n} of ${REGION_NEED}.`,[['Keep birding',null]]);
  else openNote('Trailhead · Ridge Road','Travel to the Central?','The trail over the mountains leads west to the Great Plains: prairie, pothole marshes, desert and the Gulf coast. You arrive at the East Trail trailhead near Cottonwood. The Central\'s birds come in a later update.',[['Stay on the East Coast',null,true],['Go to the Central',()=>goMap('central','East Trail')]])}

/* ---------- field journal: life list, log, album, gear, regions, settings ---------- */
let jTab='birds',jDetail=null,jView='perched';const JF={zone:'',sp:'',group:''};let albumFilter='all';
const HOW={bino:'Binoculars',scope:'Scope',cam:'Camera'};
const HEART='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.2 4.3 2.4.7-1.2 2.1-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
const HEART_O='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.3-9-8.6C1.6 8.2 3.6 5 6.8 5c2 0 3.4 1.2 4.2 2.5C11.8 6.2 13.2 5 15.2 5c3.2 0 5.2 3.2 3.8 6.4C17 15.7 12 20 12 20z"/></svg>';
function toggleJournal(on,sp){const el=$('journal');el.hidden=!on;if(!on){return}if(sp){jApp='guide';jTab='birds';jDetail=sp;jView='perched'}else if(MSG.bannerUntil>performance.now()){jApp='messages';jTab='messages';jDetail=null;$('msgBanner').classList.remove('show')}else{jApp='home';jDetail=null}
  renderJournal();if(jApp==='messages'){MSG.unread=0;MSG.welRead=true;updateMsgBadge()}$('jClose').focus()}
$('jHome').onclick=()=>phoneBack();$('jHomeBar').onclick=()=>{if(jApp==='home'){toggleJournal(false);return}jApp='home';jDetail=null;renderJournal()};
$('jClose').onclick=()=>toggleJournal(false);$('journal').addEventListener('pointerdown',e=>{if(e.target.id==='journal')toggleJournal(false)});
const plateCache={};let PLATE_C=null;function plateURL(id,locked){const k=id+(locked?'L':'');if(!plateCache[k]){if(!PLATE_C){PLATE_C=document.createElement('canvas');PLATE_C.width=192;PLATE_C.height=132}const c=PLATE_C;c.getContext('2d').clearRect(0,0,192,132);const prev=ctx;try{drawPlate(c,id,'perched',{locked,pad:1.1})}finally{ctx=prev}plateCache[k]=c.toDataURL('image/png')}return plateCache[k]}
let KIT_C=null;function kitPic(draw){if(!KIT_C){KIT_C=document.createElement('canvas');KIT_C.width=480;KIT_C.height=320}const c=KIT_C,x=c.getContext('2d'),prev=ctx;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,480,320);try{draw(c,x)}catch(e){diag('Error drawing a picture: '+e.message)}finally{ctx=prev;x.setTransform(1,0,0,1,0,0)}return c.toDataURL('image/png')}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
const APP_IC={
  maps:'<svg viewBox="0 0 40 40"><path d="M6 10l9-3 10 3 9-3v23l-9 3-10-3-9 3z" fill="#fff"/><path d="M15 7v23M25 10v23" stroke="#9fd8cf" stroke-width="1.6"/><circle cx="20" cy="18" r="3.4" fill="#c23b2e"/><path d="M20 24l-3-4h6z" fill="#c23b2e"/></svg>',
  guide:'<svg viewBox="0 0 40 40"><path fill="#fff" d="M8 25c4-1 7-4 9-8 2-5 6-8 11-7l5 2-4 2c1 4-1 9-5 12-4 3-9 4-14 3l-6 4 1-5c-2-1-1-3 3-3z"/><circle cx="29" cy="14" r="1.6" fill="#1c3a2a"/></svg>',
  messages:'<svg viewBox="0 0 40 40"><path fill="#fff" d="M20 7c9 0 15 5.5 15 12.5S29 32 20 32c-2 0-4-.3-5.6-.8L8 34l2-5.6C7 26 5 23 5 19.5 5 12.5 11 7 20 7z"/></svg>',
  notes:'<svg viewBox="0 0 40 40"><rect x="8" y="6" width="24" height="28" rx="3" fill="#fff"/><rect x="8" y="6" width="24" height="7" rx="3" fill="#e9b72a"/><path d="M12 18h16M12 23h16M12 28h10" stroke="#b8b2a0" stroke-width="2"/></svg>',
  album:'<svg viewBox="0 0 40 40"><rect x="5" y="8" width="30" height="24" rx="4" fill="#fff"/><rect x="8" y="11" width="24" height="18" rx="2" fill="#8fc6ea"/><circle cx="26" cy="16" r="2.6" fill="#f5c542"/><path d="M8 29l7-9 5 6 3-3 9 6z" fill="#3f8a4f"/><path d="M15 20l5 6-3 3H8z" fill="#2f6b3c"/></svg>',
  weather:'<svg viewBox="0 0 40 40"><circle cx="16" cy="15" r="7" fill="#ffd34a"/><g stroke="#ffd34a" stroke-width="2.4" stroke-linecap="round"><path d="M16 3v3M5 15h-2M7.5 6.5l2 2M24.5 6.5l-2 2"/></g><path d="M14 31a6 6 0 010-12 8 8 0 0115 2 5 5 0 01-1 10z" fill="#fff"/></svg>',
  gear:'<svg viewBox="0 0 40 40"><path fill="#fff" d="M9 14h22l-1.6 20H10.6z"/><path d="M15 15v-3a5 5 0 0110 0v3" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="15" cy="19" r="1.4" fill="#c4572b"/><circle cx="25" cy="19" r="1.4" fill="#c4572b"/></svg>',
  settings:'<svg viewBox="0 0 40 40"><path fill="#fff" d="M17.5 5h5l1 4.2 3 1.3 3.7-2.3 3.6 3.6-2.3 3.7 1.3 3 4.2 1v5l-4.2 1-1.3 3 2.3 3.7-3.6 3.6-3.7-2.3-3 1.3-1 4.2h-5l-1-4.2-3-1.3-3.7 2.3-3.6-3.6 2.3-3.7-1.3-3L5 22.5v-5l4.2-1 1.3-3-2.3-3.7 3.6-3.6 3.7 2.3 3-1.3z"/><circle cx="20" cy="20" r="5.5" fill="#8e9399"/></svg>',
  dev:'<svg viewBox="0 0 40 40"><g transform="rotate(45 20 20)"><rect x="18" y="5" width="4" height="15" rx="1" fill="#f2c94c"/><rect x="16.5" y="19" width="7" height="16" rx="3" fill="#e8743b"/><path d="M18.5 22v10M21.5 22v10" stroke="#b8501f" stroke-width="1.2"/></g><g transform="rotate(-45 20 20)"><rect x="18.2" y="11" width="3.6" height="23" rx="1.8" fill="#fff"/><path d="M13.5 9.5a6.5 6.5 0 0013 0l-1-4-3 3.2h-5l-3-3.2z" fill="#fff"/></g></svg>',
  arcade:'<svg viewBox="0 0 40 40"><rect x="5" y="13" width="30" height="16" rx="8" fill="#fff"/><path d="M12 18v6M9 21h6" stroke="#5b3fc4" stroke-width="2.4"/><circle cx="26" cy="19" r="2" fill="#5b3fc4"/><circle cx="30" cy="23" r="2" fill="#5b3fc4"/></svg>'};
const APPS=[['guide','Field Guide','#2f6b45'],['maps','Maps','#2fa39a'],['messages','Messages','#34c759'],['weather','Weather','#3b8ed8'],['album','Album','#e9eef3'],['gear','Gear','#e8743b'],['notes','Notes','#f6f3e6'],['settings','Settings','#8e9399'],['dev','Dev tools','#3a4150']];
const APP_TABS={guide:[['birds','Birds'],['habitats','Habitats']],notes:[['life','Life List'],['log','Log'],['regions','Regions']]};
let jApp='home';
function openApp(a,tab){if(a==='maps'){toggleJournal(false);toggleMap(true);return}jApp=a;jTab=tab||(APP_TABS[a]?APP_TABS[a][0][0]:a);jDetail=null;if(a==='messages'){MSG.list.forEach(m=>m.seenAt=m.seenAt||Date.now())}renderJournal();if(a==='messages'){MSG.unread=0;MSG.welRead=true;updateMsgBadge()}if(GPS.linked)setTimeout(()=>{const t=$('jTabs').querySelector('[aria-selected="true"]')||gpFocusables($('jPanel'))[0]||$('jHome');if(t)gpFocus(t)},80)}
function phoneBack(){if($('journal').hidden)return;if(jDetail){jDetail=null;renderJournal()}else if(jApp!=='home'){jApp='home';jDetail=null;renderJournal()}else toggleJournal(false)}
const FG_I={check:'<svg viewBox="0 0 16 16" aria-label="On your life list"><circle cx="8" cy="8" r="7" fill="#2f8f5b"/><path d="M4.5 8.3l2.3 2.3 4.7-5" fill="none" stroke="#fff" stroke-width="2"/></svg>',
  cam:'<svg viewBox="0 0 16 16" aria-label="You have a photo"><rect x="1" y="4.5" width="14" height="9.5" rx="2" fill="#2f6fb5"/><path d="M5 4.5l1.2-2h3.6l1.2 2z" fill="#2f6fb5"/><circle cx="8" cy="9.2" r="2.8" fill="#fff"/><circle cx="8" cy="9.2" r="1.5" fill="#2f6fb5"/></svg>',
  cal:'<svg viewBox="0 0 16 16" aria-label="Seen this year"><rect x="1.5" y="2.5" width="13" height="12" rx="2" fill="#fff" stroke="#d2493a" stroke-width="1.4"/><rect x="1.5" y="2.5" width="13" height="4" rx="1.5" fill="#d2493a"/><rect x="4" y="1" width="1.8" height="3" rx=".8" fill="#d2493a"/><rect x="10.2" y="1" width="1.8" height="3" rx=".8" fill="#d2493a"/><text x="8" y="13" font-size="6.5" text-anchor="middle" fill="#1c2420" font-family="monospace">Y</text></svg>'};
function seenThisYear(id){const y=new Date().getFullYear();return S.journal.log.some(e=>e.sp===id&&new Date(e.ts).getFullYear()===y)}
function hasPhoto(id){return S.album.list.some(p=>p.sp===id)}
function abTag(id){const d=COND.sp[id];if(!d||!d.ab)return'';return `<span class="abtag" data-ab="${d.ab.toLowerCase().replace(/ /g,'-')}" title="How common it is ${REGB?'on the '+MAP_NAME:'in the East'}">${d.ab}</span>`}
function fgIcons(id){const on=(k,v,lab)=>v?FG_I[k]:FG_I[k].replace('<svg ','<svg class="off" aria-hidden="true" ').replace(/ aria-label="[^"]*"/,'');return `<span class="fgic">${on('check',S.journal.seen[id])}${on('cam',hasPhoto(id))}${on('cal',seenThisYear(id))}</span>`}
function renderJournal(){const app=jApp+(jDetail?'/'+jDetail:''),t0=performance.now();
  try{renderJournal0();diag('Opened '+app+' in '+Math.round(performance.now()-t0)+' ms')}catch(e){console.error(e);diag('Error in '+app+': '+(e&&e.message||e));const P=$('jPanel');P.insertAdjacentHTML('beforeend',`<div class="empty">Sorry, this app hit a problem. Please tell Claude: ${esc(e&&e.message||e)}</div>`)}}
function renderJournal0(){const ph=$('journal').querySelector('.phone');ph.dataset.app=jApp;ph.querySelector('.screen').style.background='';
  try{$('phClock').textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}).replace(/\s?[AP]M$/i,'')}catch(e){}
  const tabs=$('jTabs');tabs.innerHTML='';const P=$('jPanel');P.innerHTML='';P.scrollTop=0;
  if(jApp==='home'){$('jTitle').firstChild.textContent='Home';$('jSub').textContent='';renderHome(P);return}
  const A=APPS.find(a=>a[0]===jApp)||[jApp,jApp==='games'?'Games':jApp];$('jTitle').firstChild.textContent=jDetail?SPECIES[jDetail].name:A[1];$('jBackLbl').textContent=jDetail?'Birds':'Home';
  for(const [k,l] of jDetail?[]:(APP_TABS[jApp]||[])){const b=document.createElement('button');b.className='tab';b.role='tab';b.textContent=l;b.setAttribute('aria-selected',jTab===k);b.onclick=()=>{jTab=k;jDetail=null;renderJournal()};tabs.appendChild(b)}
  const n=speciesSeen();
  $('jSub').textContent=jApp==='guide'?(jDetail?SPECIES[jDetail].sci:`${SP_ORDER.length} birds · ${n} on your life list`):jApp==='notes'?`${n} of ${SP_ORDER.length} species · ${S.journal.log.length} sightings`:jApp==='album'?`${S.album.count} photos`:jApp==='messages'?'Big Year East Birders':jApp==='weather'?'Birding conditions':'';
  if(jApp==='guide'){if(jDetail)return renderDetail(P,jDetail);if(jTab==='habitats')return renderHabitats(P);return renderGuideBirds(P)}
  if(jApp==='games'){$('jSub').textContent=MP.room?mpCount()+' in room '+MP.room:'';if(!MP.room){jApp='home';return renderJournal0()}return mpRender(P)}
  if(jApp==='messages')return renderMessages(P);
  if(jApp==='notes'){if(jTab==='log')return renderLog(P);if(jTab==='regions')return renderRegions(P);return renderLifeNote(P)}
  if(jApp==='album')return renderAlbum(P);
  if(jApp==='weather')return renderWeather(P);
  if(jApp==='gear')return renderGear(P);
  if(jApp==='settings')return renderSettingsApp(P);
  if(jApp==='dev'){$('jSub').textContent='For testing the game';return renderDevApp(P)}}
function renderHome(P){const n=speciesSeen(),w=wxKind();
  P.insertAdjacentHTML('beforeend',`<div class="widget"><b>Big Year · ${MAP_NAME}</b><span>${n} of ${SP_ORDER.length} species · ${S.journal.log.length} sightings</span><span>${SZ().name} · ${isEve()?'Dusk':'Day'} · ${w==='rain'?'Rain':w==='snow'?'Snow':'Clear'}</span><span class="bar"><i style="width:${n/SP_ORDER.length*100}%"></i></span></div><div class="apps" id="phApps"></div>`);
  const G=$('phApps');const A0=[...APPS.filter(a=>a[0]!=='dev'||settings.dev),...(MP.room?[['games','Games','#d9482b']]:[])],list=GPS.linked?[...A0,['arcade','Arcade','#5b3fc4']]:A0;
  for(const [k,l,col] of list){const b=document.createElement('button');b.className='app';b.innerHTML=`<span class="ic" style="background:${col}">${APP_IC[k]}${k==='messages'&&MSG.unread?`<span class="badge">${MSG.unread}</span>`:''}${k==='games'?`<span class="badge mpb">${mpCount()}</span>`:''}</span>${l}`;
    b.setAttribute('aria-label',l+(k==='messages'&&MSG.unread?`, ${MSG.unread} new`:''));b.onclick=()=>{if(k==='arcade')GP.openArcade();else openApp(k)};G.appendChild(b)}}

/* WX1 Weather app: season, time of day and conditions, chosen with weather-style tiles */
const WXI={
  sun:'<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="#ffd34a"/><g stroke="#ffd34a" stroke-width="2.6" stroke-linecap="round"><path d="M20 4v4M20 32v4M4 20h4M32 20h4M8.7 8.7l2.8 2.8M28.5 28.5l2.8 2.8M8.7 31.3l2.8-2.8M28.5 11.5l2.8-2.8"/></g></svg>',
  dusk:'<svg viewBox="0 0 40 40"><path d="M7 27a13 13 0 0126 0z" fill="#ff9a4a"/><g stroke="#ffc36a" stroke-width="2.4" stroke-linecap="round"><path d="M20 7v4M8 13l2.6 2.6M32 13l-2.6 2.6"/></g><path d="M4 30h32M9 34h22" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
  clearnight:'<svg viewBox="0 0 40 40"><path d="M26 31A13 13 0 0118 7a13 13 0 1012 22 13 13 0 01-4 2z" fill="#ffe7a3"/><circle cx="30" cy="10" r="1.4" fill="#fff"/><circle cx="33" cy="17" r="1" fill="#fff"/></svg>',
  rain:'<svg viewBox="0 0 40 40"><path d="M12 25a7 7 0 010-14 9 9 0 0117 2 6 6 0 01-1 12z" fill="#fff"/><g stroke="#8fd0ff" stroke-width="2.6" stroke-linecap="round"><path d="M13 29l-2 5M20 29l-2 5M27 29l-2 5"/></g></svg>',
  snow:'<svg viewBox="0 0 40 40"><path d="M12 24a7 7 0 010-14 9 9 0 0117 2 6 6 0 01-1 12z" fill="#fff"/><g fill="#fff"><circle cx="12" cy="30" r="1.8"/><circle cx="20" cy="33" r="1.8"/><circle cx="28" cy="30" r="1.8"/><circle cx="16" cy="37" r="1.4"/><circle cx="24" cy="37" r="1.4"/></g></svg>',
  spring:'<svg viewBox="0 0 40 40"><path d="M20 35V18" stroke="#7fd36b" stroke-width="3" stroke-linecap="round"/><path d="M20 22c-8 0-11-5-11-9 6 0 11 3 11 9zM20 19c0-7 4-11 10-11 0 6-4 11-10 11z" fill="#7fd36b"/><circle cx="20" cy="12" r="0" fill="#fff"/></svg>',
  summer:'<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="9" fill="#ffc531"/><g stroke="#ffc531" stroke-width="3" stroke-linecap="round"><path d="M20 3v4M20 33v4M3 20h4M33 20h4M8 8l3 3M29 29l3 3M8 32l3-3M29 11l3-3"/></g></svg>',
  fall:'<svg viewBox="0 0 40 40"><path d="M20 4l3 7 7-2-2 7 7 3-6 4 3 6-7-1-1 8h-8l-1-8-7 1 3-6-6-4 7-3-2-7 7 2z" fill="#f08a3a"/><path d="M20 15v22" stroke="#9a4a1e" stroke-width="2" stroke-linecap="round"/></svg>',
  winter:'<svg viewBox="0 0 40 40"><g stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M20 4v32M6 12l28 16M6 28l28-16"/><path d="M15 6l5 4 5-4M15 34l5-4 5 4M5 17l6-1-1-6M35 23l-6 1 1 6M5 23l6 1-1 6M35 17l-6-1 1-6"/></g></svg>'};
function wxTile(icon,label,on,fn){const b=document.createElement('button');b.className='wxt';b.setAttribute('aria-pressed',on);b.innerHTML=WXI[icon]+`<span>${label}</span>`;b.onclick=fn;return b}
function renderWeather(P){const L=listener(),w=wxKind(),ev=isEve(),win=SEASON==='winter',t=tempC(L.x,L.y);
  const bg=w==='rain'?(ev?'linear-gradient(#3b4456,#6f7886)':'linear-gradient(#5b6976,#9aa5ae)'):w==='snow'?(ev?'linear-gradient(#4d5a73,#a7b1c0)':'linear-gradient(#93a3b3,#dde3e9)'):ev?'linear-gradient(#34407e,#b5607a 62%,#f0a565)':'linear-gradient(#2f7fd0,#86c3ee)';
  $('journal').querySelector('.screen').style.background=bg;
  const icon=w==='rain'?'rain':w==='snow'?'snow':ev?'dusk':'sun',cond=(w==='rain'?'Rain':w==='snow'?'Snow':ev?'Clear dusk':'Sunny')+' · '+SZ().name;
  const out=new Set(S.birds.map(b=>b.sp)).size;
  const tips=[];if(ev)tips.push('Owls, nightjars, woodcock and thrushes are calling. Hawks and most songbirds have gone to roost.');else tips.push('Songbirds are busiest early and late; hawks and vultures soar in the warm middle of the day.');
  if(w==='rain')tips.push('Rain sends songbirds into cover, but storms push seabirds close to shore.');if(w==='snow')tips.push('Snow brings cardinals, juncos, finches and woodpeckers in close, and Snow Buntings and Horned Larks to the roadsides.');
  if(!w&&!ev)tips.push('Good birding weather. Try the Ramble in Ellis Park or any edge between woods and fields.');
  const best=[...new Set(S.birds.filter(b=>!S.journal.seen[b.sp]&&b.out!==false).map(b=>b.sp))].filter(k=>['Constant','Regular'].includes(condCat(k))).slice(0,4).map(k=>SPECIES[k].name);
  P.innerHTML=`<div class="wxnow">${WXI[icon]}<span class="place">${esc(placeName(L.x,L.y)||zoneName(L.x,L.y))}</span><span class="deg">${t}°</span><span class="cond">${cond}</span></div>
    <div class="wxcard"><div class="wxh">SEASON</div><div class="wxrow four" id="wxSeason"></div></div>
    <div class="wxcard"><div class="wxh">TIME OF DAY</div><div class="wxrow two" id="wxTod"></div></div>
    <div class="wxcard"><div class="wxh">CONDITIONS</div><div class="wxrow two" id="wxCond"></div></div>
    <div class="wxcard"><div class="wxh">BIRDING FORECAST</div><p>${out} species out on the map right now.</p>${tips.map(x=>`<p>${x}</p>`).join('')}${best.length?`<p><b>Good chances for new birds:</b> ${best.join(', ')}</p>`:''}</div>`;
  const G=$('wxSeason');for(const k of Object.keys(SEASON_INFO))G.appendChild(wxTile(k,SEASON_INFO[k].name,SEASON===k,()=>{applySeason(k);renderJournal()}));
  const set=(key,v)=>{if(settings[key]===v)return;settings[key]=v;saveSettings();applyCond();renderJournal()};
  $('wxTod').append(wxTile('sun','Day',!ev,()=>set('tod','day')),wxTile('dusk','Dusk',ev,()=>set('tod','evening')));
  $('wxCond').append(wxTile(ev?'clearnight':'sun','Clear',!w,()=>set('wx','clear')),wxTile(win?'snow':'rain',win?'Snow':'Rain',!!w,()=>set('wx','storm')))}
/* ---- Field Guide: every bird, with filters ---- */
const GF={sort:'order',region:'',hab:'',status:'',season:'',q:''};
function spBands(id){const G=GB[id];return G&&G.bands?G.bands:BANDS.map(b=>b.id)}
function renderGuideBirds(P){const opt=(v,t,cur)=>`<option value="${esc(v)}"${v===cur?' selected':''}>${esc(t)}</option>`;
  P.insertAdjacentHTML('beforeend',`<div class="fgtools"><input id="fgQ" type="text" autocomplete="off" placeholder="Search birds" aria-label="Search birds" value="${esc(GF.q)}">
    <select id="fgSort" aria-label="Sort">${[['order','Field guide order'],['az','A to Z'],['unseen','Not seen first'],['seen','Seen first']].map(([v,t])=>opt(v,t,GF.sort)).join('')}</select>
    <select id="fgStatus" aria-label="Show">${[['','All birds'],['unseen','Not on life list'],['seen','On life list'],['photo','Photographed'],['year','Seen this year']].map(([v,t])=>opt(v,t,GF.status)).join('')}</select>
    <select id="fgRegion" aria-label="Region">${[['','All regions'],...BANDS.map(b=>[b.id,b.id+' '+b.name])].map(([v,t])=>opt(v,t,GF.region)).join('')}</select>
    <select id="fgHab" aria-label="Habitat">${[['','All habitats'],...HAB_ORDER.map(k=>[k,HABITATS[k].name])].map(([v,t])=>opt(v,t,GF.hab)).join('')}</select>
    <select id="fgSeason" aria-label="Season">${[['','Any season'],['now','Here now'],...Object.keys(SEASON_INFO).map(k=>[k,SEASON_INFO[k].name])].map(([v,t])=>opt(v,t,GF.season)).join('')}</select></div><div class="fgkey"><span>${FG_I.check} Life list</span><span>${FG_I.cam} Photographed</span><span>${FG_I.cal} This year</span></div><div class="fgcount" id="fgCount"></div><div class="fglist" id="fgList"></div>`);
  for(const [id,k] of[['fgSort','sort'],['fgStatus','status'],['fgRegion','region'],['fgHab','hab'],['fgSeason','season']])$(id).onchange=e=>{GF[k]=e.target.value;fillGuide()};
  $('fgQ').oninput=e=>{GF.q=e.target.value;fillGuide()};fillGuide()}
function fillGuide(){const q=GF.q.trim().toLowerCase(),si=GF.season==='now'?SEAS_I[SEASON]:GF.season?SEAS_I[GF.season]:-1;
  let ids=SP_ORDER.filter(id=>{const D=SPECIES[id],seen=!!S.journal.seen[id];
    if(q&&!(D.name.toLowerCase().includes(q)||D.group.toLowerCase().includes(q)))return false;
    if(GF.status==='seen'&&!seen||GF.status==='unseen'&&seen||GF.status==='photo'&&!hasPhoto(id)||GF.status==='year'&&!seenThisYear(id))return false;
    if(GF.region&&!spBands(id).includes(GF.region))return false;
    if(GF.hab&&!HABITATS[GF.hab].play.includes(id))return false;
    if(si>=0){const c=COND.sp[id];if(c&&!c.se[si])return false}return true});
  if(GF.sort==='az')ids.sort((a,b)=>SPECIES[a].name.localeCompare(SPECIES[b].name));
  if(GF.sort==='unseen'||GF.sort==='seen'){const k=GF.sort==='seen'?-1:1;ids.sort((a,b)=>((S.journal.seen[a]?1:0)-(S.journal.seen[b]?1:0))*k)}
  $('fgCount').textContent=`Showing ${ids.length} of ${SP_ORDER.length}`;const L=$('fgList');L.innerHTML='';
  if(!ids.length){L.innerHTML='<div class="empty">No birds match. Try fewer filters.</div>';return}
  for(const id of ids){const D=SPECIES[id],b=document.createElement('button');b.className='fgrow';
    b.innerHTML=`<img data-id="${id}" alt=""><div><b>${D.name} ${fgIcons(id)}</b><i>${D.group} · ${D.lenTxt}</i>${abTag(id)}</div>`;b.onclick=()=>{jDetail=id;jView='perched';renderJournal()};L.appendChild(b)}
  const pq=[...L.querySelectorAll('img[data-id]')];const step=()=>{const t0=performance.now();while(pq.length&&performance.now()-t0<14){const im=pq.shift();if(!im.isConnected)continue;try{im.src=plateURL(im.dataset.id)}catch(e){console.error(e)}}if(pq.length)setTimeout(step,0)};step()}
/* where & when, from the species workbook */
const FREQ_WORDS={Constant:'almost always out',Regular:'out most of the time',Intermittent:'out now and then',Irregular:'comes and goes',Occasional:'rarely out','Not out':'not out'};
const RMAP={};
function rangeMap(id){if(RMAP[id])return RMAP[id];const G=GB[id],homes=REGB?HOMES[id]||[]:G?G.homes:id==='pipl'?['beach']:id==='pile'?['hardwood','foothills','southern','swamp','maritime']:['hardwood','foothills','highlands'];
  const bands=G&&G.bands,STEP=120,w=Math.ceil(WW/STEP),h=Math.ceil(WH/STEP),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),img=x.createImageData(w,h),D=img.data;
  const WATER=new Set(['ocean','pelagic','bay','lake','pond','river','pools']);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const X=(i+.5)*STEP,Y=(j+.5)*STEP,hb=habitatAt(X,Y),k=(j*w+i)*4;let col;
    if(homes.includes(hb)&&(!bands||bands.includes(bandAt(Y).id))&&!(G&&G.isles&&!G.isles.includes(isleAt(X,Y))))col=[47,143,91];else if(WATER.has(hb))col=[160,196,214];else col=[226,221,205];D[k]=col[0];D[k+1]=col[1];D[k+2]=col[2];D[k+3]=255}
  x.putImageData(img,0,0);return RMAP[id]=c.toDataURL()}
function whereWhen(id){const c=COND.sp[id],SN=['spring','summer','fall','winter'];const regs=spBands(id).map(r=>BANDS.find(b=>b.id===r)).filter(Boolean).map(b=>b.name).join(', ');
  let html=`<div class="sub">Where &amp; when</div><div class="ww"><div><img id="jRange" alt="Map of where ${esc(SPECIES[id].name)} lives on the ${esc(MAP_NAME)}"><div class="key"><i></i>Lives here</div></div><div>`;
  html+=`<p class="txt"><b>Regions:</b> ${regs||'All'}</p>`;
  if(c){const se=SN.filter((k,i)=>c.se[i]).map(k=>SEASON_INFO[k].name);html+=`<p class="txt"><b>Seasons:</b> ${se.length===4?'All year':se.join(', ')} (${c.st})</p><p class="txt"><b>How many:</b> ${c.ab}</p>`;
    html+=`<p class="txt"><b>How often out:</b> by day ${FREQ_WORDS[c.f[0]]||c.f[0]}; dusk ${FREQ_WORDS[c.f[1]]||c.f[1]}; rain ${FREQ_WORDS[c.f[2]]||c.f[2]}${c.se[3]?'; snow '+(FREQ_WORDS[c.f[3]]||c.f[3]):''}</p>`;
    if(c.act)html+=`<p class="txt"><b>Most active:</b> ${c.act==='Night'?'at night':c.act==='Dawn & dusk'?'at dawn and dusk':'by day'}</p>`;
    html+=`<p class="txt"><b>Right now:</b> ${c.se[SEAS_I[SEASON]]?FREQ_WORDS[condCat(id)]||condCat(id):'away this season'}</p>`}
  return html+'</div></div>'}
/* ---- Notes: the life list as a checklist ---- */
function renderLifeNote(P){const n=speciesSeen(),ids=SP_ORDER.filter(k=>S.journal.seen[k]);
  P.insertAdjacentHTML('beforeend',`<div class="prog"><span>${n}/${SP_ORDER.length} found</span><span class="bar"><i style="width:${n/SP_ORDER.length*100}%"></i></span><span>${n>=trailNeed()?'Central open':'Central at '+REGION_NEED}</span></div>`);
  if(!ids.length){P.insertAdjacentHTML('beforeend','<div class="empty">Nothing on your life list yet. Raise your binoculars and hold a bird in the ring. Every bird is in the Field Guide app.</div>');return}
  const L=document.createElement('div');L.className='notelist';P.appendChild(L);
  ids.forEach((id,i)=>{const j=S.journal.seen[id],r=document.createElement('div');r.className='noterow';r.innerHTML=`<span class="ck">✓</span><button>${i+1}. ${SPECIES[id].name} ${fgIcons(id)}</button><span>${j.count}× · ${fmtWhen(j.first.ts)}</span>`;
    r.querySelector('button').onclick=()=>{jApp='guide';jTab='birds';jDetail=id;jView='perched';renderJournal()};L.appendChild(r)})}
/* ---- Messages: rare bird alerts from the local birding group ---- */
const MSG={list:[{id:0,from:'Big Year Club',sys:true,ts:Date.now(),text:'Welcome to Big Year East Birders! We text here when someone finds a rare bird. Each alert has a map with a red circle around where it was seen. Birds move, so go soon.'}],unread:1,next:75,cool:{},bannerUntil:0,id:1};
MSG.welRead=(()=>{try{const d=JSON.parse(localStorage.getItem('birding-progress-v1')||'null');if(d&&d.wel)return true}catch(e){}try{return Object.keys((S.journal&&S.journal.seen)||{}).length>0}catch(e){return false}})();
if(MSG.welRead){MSG.unread=0;MSG.list[0].seenAt=MSG.list[0].ts}
const SENDERS=['Dana R.','Marcus T.','Priya K.','Old Walt','Ranger Jo','Sam L.','Rosa M.','Theo B.'];
const MSG_TXT=[(n,p,m)=>`${n} at ${p}! Seen ${m} min ago.`,(n,p)=>`Just had a ${n} near ${p}. Still there when I left.`,(n,p)=>`RBA: ${n}, ${p}. Get there fast!`,(n,p)=>`${n} reported around ${p}. I circled roughly where.`,(n,p,m)=>`Heads up, ${n} in the ${p} area about ${m} min ago.`];
function isRareish(sp,b){const d=COND.sp[sp];return!!d&&(['Rare','Very rare'].includes(d.ab)||!!(b&&b.stray))}
MSG.next=300;MSG.alert=null;MSG.chk=0;
function alertGone(){const a=MSG.alert;if(!a)return;const m=MSG.list.find(q=>q.id===a.id);if(m)m.gone=true;MSG.alert=null;
  if(!$('journal').hidden&&jApp==='messages')renderJournal()}
function showAlertOnMap(){const a=MSG.alert;if(!a){toast('That bird has moved on.',2);return}toggleJournal(false);toggleMap(true);
  MAPV.z=Math.max(MAPV.z,2.6);mapCenterOn(a.x,a.y)}
{const _ls=logSighting;logSighting=function(b){const r=_ls.apply(this,arguments);if(MSG.alert&&b&&MSG.alert.sp===b.sp)alertGone();return r}}
function msgTick(dt){if(!$('title').classList.contains('out'))return;
  const A=MSG.alert;if(A&&(MSG.chk-=dt)<=0){MSG.chk=1;if(S.t>A.until||!S.birds.some(q=>q.id===A.bid))alertGone()}
  MSG.next-=dt;if(MSG.next>0)return;if(MSG.alert){MSG.next=60;return}MSG.next=480+Math.random()*240;
  const cand=S.birds.filter(b=>isRareish(b.sp,b)&&!(MSG.cool[b.sp]>S.t)&&!b.under);if(!cand.length)return;
  const rk=q=>(S.journal.seen[q.sp]?1:0)+(q.stray&&!['Rare','Very rare'].includes(COND.sp[q.sp].ab)?.6:0)+Math.random()*.9;cand.forEach(q=>q._rk=rk(q));cand.sort((a,c)=>a._rk-c._rk);const b=cand[0];MSG.cool[b.sp]=S.t+900;
  const r=650+Math.random()*200,a=Math.random()*TAU,off=Math.random()*r*.55,x=clamp(b.x+Math.cos(a)*off,200,WW-200),y=clamp(b.y+Math.sin(a)*off,200,WH-200);
  const place=placeName(x,y)||zoneName(x,y),nm=SPECIES[b.sp].name,m={id:MSG.id++,from:SENDERS[Math.floor(Math.random()*SENDERS.length)],sp:b.sp,x,y,r,place,ts:Date.now(),text:b.stray?`${nm} near ${place}! Way out of its usual range for this time of year.`:MSG_TXT[Math.floor(Math.random()*MSG_TXT.length)](nm,place,5+Math.floor(Math.random()*25))};
  MSG.alert={id:m.id,bid:b.id,sp:b.sp,x,y,r,until:S.t+600,stray:!!b.stray};
  MSG.list.push(m);if(MSG.list.length>40)MSG.list.splice(1,1);MSG.unread++;updateMsgBadge();showMsgBanner(m)}
function showMsgBanner(m){const el=$('msgBanner');el.innerHTML=`<span class="ic">${APP_IC.messages}</span><span><small>MESSAGES · now</small><b>${esc(m.from)}</b><span>${esc(m.text)}</span></span>`;el.classList.add('show');MSG.bannerUntil=performance.now()+7000;
  try{SFX.chime()}catch(e){}clearTimeout(showMsgBanner.t);showMsgBanner.t=setTimeout(()=>el.classList.remove('show'),7000)}
$('msgBanner').onclick=()=>{$('msgBanner').classList.remove('show');toggleJournal(true);openApp('messages')};
function updateMsgBadge(){const b=$('journalBtn');let s=b.querySelector('.hudbadge');if(!MSG.unread){if(s)s.remove();return}if(!s){s=document.createElement('span');s.className='hudbadge';b.appendChild(s)}s.textContent=MSG.unread}
function msgMap(m){if(m.img)return m.img;const W=256,H=176,SC=30,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),img=x.createImageData(W,H),D=img.data,X0=m.x-W/2*SC,Y0=m.y-H/2*SC;
  const WATER=new Set(['ocean','pelagic','bay','lake','pond','river','pools']);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const X=X0+(i+.5)*SC,Y=Y0+(j+.5)*SC,k=(j*W+i)*4;let col;if(X<0||Y<0||X>WW||Y>WH)col=[200,200,200];else{const hb=habitatAt(X,Y);
      if(WATER.has(hb))col=[150,190,214];else if(hb==='city')col=[196,194,188];else{const C=HABITATS[hb]&&HAB_CATS[HABITATS[hb].cat];const h=C?hex(C.col):[150,170,120];col=h.map(v=>Math.round(v*.72+235*.28))}}
    D[k]=col[0];D[k+1]=col[1];D[k+2]=col[2];D[k+3]=255}
  x.putImageData(img,0,0);x.strokeStyle='rgba(120,120,120,.6)';x.lineWidth=1;
  {x.strokeStyle='#4a4b50';x.lineWidth=2.2;x.beginPath();let f=1;for(let yy=Math.max(HW0,Y0);yy<=Math.min(HW1,Y0+H*SC);yy+=SC*2){const px=(roadX(yy)-X0)/SC,py=(yy-Y0)/SC;f?x.moveTo(px,py):x.lineTo(px,py);f=0}x.stroke();
   x.font='600 10px Fredoka,system-ui';x.textAlign='left';for(const F of FEATURES){const px=(F.x-X0)/SC,py=(F.y-Y0)/SC;if(px<6||py<12||px>W-60||py>H-26)continue;
     x.fillStyle='#2b3a2f';x.beginPath();x.arc(px,py,2.5,0,TAU);x.fill();x.fillStyle='rgba(255,252,242,.8)';const tw=x.measureText(F.name).width;x.fillRect(px+4,py-7,tw+4,12);x.fillStyle='#2b3a2f';x.fillText(F.name,px+6,py+3)}}
  x.fillStyle='rgba(229,55,43,.16)';x.strokeStyle='#e5372b';x.lineWidth=3;x.beginPath();x.arc(W/2,H/2,m.r/SC,0,TAU);x.fill();x.stroke();
  const L=listener(),lx=(L.x-X0)/SC,ly=(L.y-Y0)/SC;if(lx>4&&ly>4&&lx<W-4&&ly<H-4){x.fillStyle='#2f6fb5';x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.arc(lx,ly,5,0,TAU);x.fill();x.stroke()}
  x.font='600 12px "Pixelify Sans",monospace';x.fillStyle='#1c2420';x.fillText(m.place,8,H-9);return m.img=c.toDataURL()}
function renderMessages(P){const C=document.createElement('div');C.className='chat';P.appendChild(C);let day='';
  for(const m of MSG.list){const d=new Date(m.ts).toLocaleDateString([],{weekday:'long',hour:'numeric',minute:'2-digit'});if(d.split(' ')[0]!==day){day=d.split(' ')[0];C.insertAdjacentHTML('beforeend',`<div class="day">${esc(d)}</div>`)}
    const el=document.createElement('div');el.className='msg'+(m.sys?' sys':'')+(!m.seenAt||Date.now()-m.seenAt<1500?' new':'');
    el.innerHTML=`<span class="from">${esc(m.from)}</span><p>${esc(m.text)}</p>${m.sp?`<img alt="Map of ${esc(m.place)} with a red circle where the ${esc(SPECIES[m.sp].name)} was seen" src="${msgMap(m)}">`:''}<div class="meta"><span>${new Date(m.ts).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</span>${m.sp&&MSG.alert&&MSG.alert.id===m.id?'<button class="onmap">Show on map ›</button>':''}${m.sp&&m.gone?'<span class="gone">Moved on</span>':''}${m.sp?'<button class="fg">Field Guide ›</button>':''}</div>`;
    if(m.sp)el.querySelector('button.fg').onclick=()=>{jApp='guide';jTab='birds';jDetail=m.sp;jView='perched';renderJournal()};
    {const ob=el.querySelector('button.onmap');if(ob)ob.onclick=showAlertOnMap}C.appendChild(el)}
  setTimeout(()=>{P.scrollTop=P.scrollHeight},0)}
function renderRegions(P){const n=speciesSeen(),here=MAP;
    const RN={east:'East Coast',central:'Central',west:'West Coast',pacific:'Pacific Isles',caribbean:'Caribbean Isle',britain:'British Isle'};
    // how to reach map k from map h, as [text, chip, label]
    const how=(k,h)=>{if(k===h)return[{east:'You are here: Atlantic beaches, hardwoods, cold north and warm south.',central:'You are here: the Great Plains from the north woods to the Gulf. Birds arrive in a later update.',
        west:'You are here: the Pacific side from the Alaska tundra to the Sonoran desert. Birds arrive in a later update.',pacific:'You are here: four high islands, a coral atoll and the reef. Birds arrive in a later update.',
        caribbean:'You are here: rainforest, coffee country, karst hills and reefs. Birds arrive in a later update.',britain:'You are here: hedgerows, heather moors, Highland lochs and sea cliffs. Birds arrive in a later update.'}[k],'now',k==='east'?`${n}/${SP_ORDER.length}`:'Here'];
      const step={east:{central:'the Ridge Road trailhead, or fly the floatplane west from Loon Lake',caribbean:'the ferry from the pier in Port Bostick',britain:'the airliner at Port Bostick Airport, just south of town'},central:{east:'the East Trail by Cottonwood, or fly the floatplane east from Kettle Lake',west:'the West Trail, or fly the floatplane west from Kettle Lake'},west:{central:'the East Trail by Elk Pass, or fly the floatplane east from Tamarack Lake',pacific:'the ferry by Port Madrone'},
        pacific:{west:'the ferry at Harbor City pier'},caribbean:{east:'the ferry at Bahía Vieja pier'},britain:{east:'the airliner at Kingsport Airport'}}[h];
      const ff=settings.play!=='story'?' Or fast travel from the Map.':'';
      if(step[k])return['Open. Take '+step[k]+'.'+ff,'good','Open'];
      const via={east:{west:'central',pacific:'central'},central:{pacific:'west',caribbean:'east',britain:'east'},west:{east:'central',caribbean:'central',britain:'central'},pacific:{east:'west',central:'west',caribbean:'west',britain:'west'},caribbean:{central:'east',west:'east',pacific:'east',britain:'east'},britain:{central:'east',west:'east',pacific:'east',caribbean:'east'}}[h][k];
      return['Through the '+RN[via]+': take '+step[via]+'.'+ff,'',ff?'Open':'Via '+RN[via]]};
    const reg=[['east','#2f8f5b'],['central','#c9a227'],['west','#3f7fa8'],['pacific','#2fa39a'],['caribbean','#c2573a'],['britain','#4a5fa8']].map(([k,col])=>{const v=how(k,here);return[RN[k],v[0],col,v[1],v[2]]});
    for(const [nm,tx,col,chip,lbl] of reg)P.insertAdjacentHTML('beforeend',`<div class="region"><span class="ic" style="background:${col}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19l6-12 4 7 3-4 5 9z"/></svg></span><div><b>${nm}</b><span>${tx}</span></div><span class="chip ${chip}">${lbl}</span></div>`)}

function renderSettingsApp(P){
    {const d=document.createElement('div');d.className='setting';d.innerHTML=`<div><b>Birder</b><span>Who you play. Your outfits in Gear change to match.</span></div><span class="bodysel">${[['man','Man'],['woman','Woman']].map(([k,l])=>`<button data-b="${k}" class="${(settings.body||'man')===k?'on':''}">${l}</button>`).join('')}</span>`;
      d.querySelectorAll('button').forEach(b=>b.onclick=()=>{settings.body=b.dataset.b;saveSettings();d.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});P.appendChild(d)}
    const rows=[['sound','Sound','Bird songs, surf and the Defender'],['seeThrough','See-through trees','Trees in front of you fade. Turn off to keep them solid and see yourself as a shaded figure under the canopy'],['hints','Keyboard hints','Show the key list at the bottom'],['joyLeft','Joystick on the left','Swap the stick and the action wheel'],['holdSteer','Touch to steer','The stick appears wherever your thumb lands'],['shake','Hand shake','A little natural wobble in the binoculars and camera'],['dev','Dev tools','Adds the Dev tools app to your phone (observer mode, tap to identify) and shows the Prototype panel']];
    for(const [k,b,s] of rows){const d=document.createElement('label');d.className='setting';d.innerHTML=`<div><b>${b}</b><span>${s}</span></div><span class="switch"><input type="checkbox" id="set-${k}" ${settings[k]?'checked':''}><i></i></span>`;d.querySelector('input').onchange=e=>{settings[k]=e.target.checked;saveSettings();if(k==='dev'&&!settings.dev)devOff()};P.appendChild(d)}
    {const n=Object.keys(S.journal.seen||{}).length,d=document.createElement('div');d.className='setting wipe';
      const ask=()=>{d.innerHTML=`<div><b>Delete all progress</b><span>Start the game over: erases your life list (${n} species), journal, photos, gear and outfits. Your settings stay.</span></div><span class="wipebtns"><button class="wipe-go">Delete…</button></span>`;d.querySelector('.wipe-go').onclick=sure};
      const sure=()=>{d.innerHTML=`<div><b>Delete everything?</b><span>This can't be undone. Your life list, journal, photos, gear and outfits will be gone for good.</span></div><span class="wipebtns"><button class="wipe-no">Cancel</button><button class="wipe-yes">Yes, delete</button></span>`;
        d.querySelector('.wipe-no').onclick=()=>{ask();d.querySelector('.wipe-go').focus()};d.querySelector('.wipe-yes').onclick=wipeAll;d.querySelector('.wipe-no').focus()};
      ask();P.appendChild(d)}}
function wipeAll(){WIPED=true;for(const k of['birding-journal-v1','birding-kit-v1','birding-progress-v1'])try{localStorage.removeItem(k)}catch(e){}
  const done=()=>{try{location.reload()}catch(e){}};try{const r=indexedDB.deleteDatabase('field-guide-album');r.onsuccess=r.onerror=r.onblocked=done;setTimeout(done,1500)}catch(e){done()}}
/* habitats: what the East Coast is made of, and who lives where */
function renderHabitats(P){const here=habitatAt(listener().x,listener().y);
  P.insertAdjacentHTML('beforeend','<p class="txt" style="margin:0 0 10px">Every bird has its habitat. Learn the places and you know where to look. Birds marked ✓ are in the game now; the rest are coming.</p>');
  for(const cat of Object.keys(HAB_CATS)){const C=HAB_CATS[cat],hs=HAB_ORDER.filter(k=>HABITATS[k].cat===cat);if(!hs.length)continue;
    P.insertAdjacentHTML('beforeend',`<div class="sub"><span class="habdot" style="background:${C.col}"></span>${C.name}</div>`);const G=document.createElement('div');G.className='habgrid';P.appendChild(G);
    for(const k of hs){const H=HABITATS[k],d=document.createElement('div');d.className='habc'+(k===here?' here':'');
      const live=H.play.map(id=>`<li class="live${S.journal.seen[id]?' seen':''}">${S.journal.seen[id]?'✓ ':''}${SPECIES[id].name}</li>`).join(''),soon=H.birds.map(b=>`<li>${esc(b)}</li>`).join('');
      d.innerHTML=`<canvas width="320" height="160"></canvas><b>${H.name}${k===here?' <em>You are here</em>':''}</b><span class="hsub" style="color:${C.col}">${H.sub}</span><p>${H.desc}</p><ul>${live}${soon}</ul>`;G.appendChild(d);habSwatch(d.querySelector('canvas'),k)}}}
// a little landscape view for each habitat, drawn by the real map renderer (ground, plants, buildings, people), cached
function findHab(k,x,y){for(let r=0;r<3000;r+=60)for(let a=0;a<6.28;a+=.3){const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(habitatAt(px,py)===k&&habitatAt(px+200,py)===k&&habitatAt(px-200,py)===k)return[px,py]}return[x,y]}
const HAB_SAMPLE=CENTRAL?Object.assign({},WD.samples,{park:[(PARK.x0+PARK.x1)/2,(PARK.y0+PARK.y1)/2],city:[AVES[4]+150,STS[1]+150],farm:[(FIELDS[0].x0+FIELDS[0].x1)/2,(FIELDS[0].y0+FIELDS[0].y1)/2]},PAC?{park:WD.samples.golf||WD.samples.park}:{}):Object.assign({},WD.samples,{beach:[coastX(20400)-150,20400],ocean:[coastX(20400)+300,20400],park:[(PARK.x0+PARK.x1)/2,(PARK.y0+PARK.y1)/2],city:[AVES[4]+150,STS[1]+150],farm:[(FIELDS[0].x0+FIELDS[0].x1)/2,(FIELDS[0].y0+FIELDS[0].y1)/2],pelagic:[15900,15000],bay:[10850,27650],arctic:[7200,1900],lake:[5950,8250],pond:[5150,20850],ocean:[coastX(20400)+160,20400],mangrove:findHab('mangrove',14500,32900),tundra:findHab('tundra',1300,11200)});
const SWATCH={};
function habSwatch(c,k){const g=c.getContext('2d'),W=c.width,H=c.height;if(SWATCH[k]){g.drawImage(SWATCH[k],0,0,W,H);return}
  const [sx,sy]=HAB_SAMPLE[k]||[0,0],Z=.5,ww=W/Z,hh=H/Z,x0=sx-ww/2,y0=sy-hh/2,cv2=document.createElement('canvas');cv2.width=W*2;cv2.height=H*2;const q=cv2.getContext('2d');
  const gw=Math.ceil(W/2),gh=Math.ceil(H/2),img=q.createImageData(gw,gh),d=img.data;for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const col=groundColor(x0+(i+.5)*ww/gw,y0+(j+.5)*hh/gh),o=(j*gw+i)*4;d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255}
  const tmp=document.createElement('canvas');tmp.width=gw;tmp.height=gh;tmp.getContext('2d').putImageData(img,0,0);q.imageSmoothingEnabled=true;q.drawImage(tmp,0,0,W*2,H*2);
  const prev=ctx;ctx=q;q.save();q.scale(2*Z,2*Z);q.translate(-x0,-y0);
  try{drawRoads(x0,y0,x0+ww,y0+hh);drawAirportGround(x0,y0,x0+ww,y0+hh);drawPiers(x0,y0,x0+ww,y0+hh);if(k==='ocean'||k==='beach')drawSea(x0,y0,x0+ww,y0+hh,0);
    const items=[];for(const cell of cellsNear(sx,sy,Math.max(ww,hh)/2+200)){for(const T0 of cell.trees)if(T0.x>x0-150&&T0.x<x0+ww+150&&T0.y>y0-20&&T0.y<y0+hh+250)items.push({y:T0.y,f:()=>drawTreeOW(T0,null,0),s:()=>drawTreeShadow(T0)});
      for(const dd of cell.decor)if(dd.x>x0-30&&dd.x<x0+ww+30&&dd.y>y0-10&&dd.y<y0+hh+40)items.push({y:dd.y,f:()=>drawDecor(dd,0)})}
    for(const b of buildingsNear(sx,sy,900)){const e=bExtent(b);if(e.x1<x0||e.x0>x0+ww||e.y0>y0+hh||e.y1<y0)continue;items.push({y:b.y+b.d,f:()=>drawBuildingOW(b),s:()=>drawBuildingShadow(b)})}
    for(const v of parkedNear(sx,sy,900))if(v.x>x0-80&&v.x<x0+ww+80&&v.y>y0-20&&v.y<y0+hh+80)items.push({y:v.y,f:()=>drawMeshMap(v,vehMesh(v.type)),s:()=>vehShadow(v)});
    for(const p of PEOPLE)if(p.x>x0-20&&p.x<x0+ww+20&&p.y>y0&&p.y<y0+hh+40)items.push({y:p.y,f:()=>drawPerson(p,0)});
    for(const it of items)if(it.s)it.s();items.sort((a,b)=>a.y-b.y);for(const it of items)it.f()}finally{q.restore();ctx=prev}
  SWATCH[k]=cv2;g.drawImage(cv2,0,0,W,H)}
/* log: every sighting, newest first, grouped by day, with filters */
function renderLog(P){const log=S.journal.log.slice().reverse();
  if(!log.length){P.innerHTML='<div class="empty">No sightings yet. Raise your binoculars, scope or camera and hold a bird in view.</div>';return}
  const zones=[...new Set(log.map(e=>e.zone))].sort(),groups=[...new Set(SP_ORDER.map(k=>SPECIES[k].group))];
  const sel=(id,lbl,opts,val)=>`<select id="${id}" aria-label="${lbl}"><option value="">${lbl}: all</option>${opts.map(([v,t])=>`<option value="${esc(v)}" ${v===val?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
  P.insertAdjacentHTML('beforeend',`<div class="filters">${sel('fZone','Location',zones.map(z=>[z,z]),JF.zone)}${sel('fSp','Species',SP_ORDER.filter(k=>S.journal.seen[k]).map(k=>[k,SPECIES[k].name]),JF.sp)}${sel('fGroup','Category',groups.map(g=>[g,g]),JF.group)}</div><div id="logList"></div>`);
  for(const [id,key] of[['fZone','zone'],['fSp','sp'],['fGroup','group']])$(id).onchange=e=>{JF[key]=e.target.value;renderJournal();jTab='log'};
  const rows=log.filter(e=>(!JF.zone||e.zone===JF.zone)&&(!JF.sp||e.sp===JF.sp)&&(!JF.group||SPECIES[e.sp].group===JF.group));
  const L=$('logList');L.insertAdjacentHTML('beforeend',`<p class="txt" style="margin:0 0 6px">${rows.length} sighting${rows.length===1?'':'s'} · ${new Set(rows.map(e=>e.sp)).size} species</p>`);
  let day='';for(const e of rows){const d=new Date(e.ts).toLocaleDateString([], {weekday:'long',month:'long',day:'numeric'});if(d!==day){day=d;L.insertAdjacentHTML('beforeend',`<div class="dayhead">${esc(d)}</div>`)}
    const t=new Date(e.ts).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
    L.insertAdjacentHTML('beforeend',`<div class="logrow"><img src="${plateURL(e.sp)}" alt=""><div><b>${SPECIES[e.sp].name}</b><span>${t} · ${esc(e.zone)}${e.temp!=null?' · '+e.temp+'°C':''} · ${SPECIES[e.sp].group}</span></div><span class="how ${e.how}">${HOW[e.how]||'Binoculars'}</span></div>`)}
  if(!rows.length)L.insertAdjacentHTML('beforeend','<div class="empty">Nothing matches these filters.</div>')}
/* album: thumbnails, favourites, open, delete */
function albumRows(){const l=S.album.list;return albumFilter==='all'?l:albumFilter==='fav'?l.filter(p=>p.fav):l.filter(p=>p.sp===albumFilter)}
function renderAlbum(P){const l=S.album.list,favs=l.filter(p=>p.fav).length;
  const sps=SP_ORDER.filter(k=>l.some(p=>p.sp===k));
  P.insertAdjacentHTML('beforeend',`<div class="chips" id="aChips"></div>${S.album.persistent?'':'<p class="txt" style="margin:0 0 10px">This browser is not keeping photos, so they last until you close the page.</p>'}<div class="album" id="aGrid"></div>`);
  const C=$('aChips');for(const [k,lbl] of[['all',`All (${l.length})`],['fav',`Favorites (${favs})`],...sps.map(k=>[k,`${SPECIES[k].name} (${l.filter(p=>p.sp===k).length})`])]){const b=document.createElement('button');b.className='chipb';b.textContent=lbl;b.setAttribute('aria-pressed',albumFilter===k);b.onclick=()=>{albumFilter=k;renderJournal()};C.appendChild(b)}
  const G=$('aGrid'),rows=albumRows();
  if(!rows.length){G.outerHTML=`<div class="empty">${l.length?'No photos here yet.':'No photos yet. Switch to the camera with the Gear button (or G), raise it, then press the shutter (Space).'}</div>`;return}
  rows.forEach((p,i)=>{const d=document.createElement('div');d.className='shot';d.innerHTML=`<button class="open" aria-label="Open photo"><img src="${p.thumb}" alt="${p.sp?SPECIES[p.sp].name:'Photo'}" loading="lazy"></button><span class="cap">${p.sp?SPECIES[p.sp].name:'Unidentified'} · ${fmtWhen(p.ts)}</span><button class="heart ${p.fav?'on':''}" aria-label="${p.fav?'Remove from favorites':'Add to favorites'}" aria-pressed="${p.fav}">${p.fav?HEART:HEART_O}</button>`;
    d.querySelector('.open').onclick=()=>openPhoto(i);d.querySelector('.heart').onclick=async()=>{p.fav=!p.fav;await ALBUM.put(p);await refreshAlbum();renderJournal()};G.appendChild(d)})}
let photoIdx=0,photoURL=null;
function openPhoto(i){const rows=albumRows();if(!rows.length){closePhoto();return}photoIdx=(i+rows.length)%rows.length;const p=rows[photoIdx];
  if(photoURL)URL.revokeObjectURL(photoURL);photoURL=p.full?URL.createObjectURL(p.full):null;$('photoImg').src=photoURL||p.thumb;
  $('photoTitle').textContent=p.sp?SPECIES[p.sp].name:'Unidentified bird or scene';$('photoMeta').textContent=`${fmtWhen(p.ts)} · ${p.zone} · ${p.mm} mm · ${photoIdx+1} of ${rows.length}`;
  $('photoFav').innerHTML=(p.fav?HEART:HEART_O)+(p.fav?' Favorite':' Add to favorites');$('photoFav').classList.toggle('on',p.fav);$('photoConfirm').hidden=true;$('photoBack').hidden=false}
function closePhoto(){$('photoBack').hidden=true;if(photoURL){URL.revokeObjectURL(photoURL);photoURL=null}if(!$('journal').hidden)renderJournal()}
$('photoClose').onclick=closePhoto;$('photoPrev').onclick=()=>openPhoto(photoIdx-1);$('photoNext').onclick=()=>openPhoto(photoIdx+1);
$('photoFav').onclick=async()=>{const p=albumRows()[photoIdx];if(!p)return;p.fav=!p.fav;await ALBUM.put(p);await refreshAlbum();const rows=albumRows();openPhoto(Math.max(0,rows.indexOf(p)>=0?rows.indexOf(p):photoIdx))};
$('photoDel').onclick=()=>{$('photoConfirm').hidden=false;$('photoDelNo').focus()};$('photoDelNo').onclick=()=>{$('photoConfirm').hidden=true};
$('photoDelYes').onclick=async()=>{const p=albumRows()[photoIdx];if(!p)return;await ALBUM.del(p.id);await refreshAlbum();toast('Photo deleted');const n=albumRows().length;if(!n)closePhoto();else openPhoto(Math.min(photoIdx,n-1))};
addEventListener('keydown',e=>{if($('photoBack').hidden)return;if(e.key==='Escape'){closePhoto();e.stopImmediatePropagation()}if(e.key==='ArrowLeft')openPhoto(photoIdx-1);if(e.key==='ArrowRight')openPhoto(photoIdx+1)},true);
/* gear and outfits */
function drawGearArt(c,g){const x=c.getContext('2d'),W=c.width,H=c.height,prev=ctx;ctx=x;x.fillStyle='#e9e3cf';x.fillRect(0,0,W,H);x.save();x.translate(W/2,H/2);const k=W/240;x.scale(k,k);
  if(g==='bino'){for(const s of[-1,1]){x.fillStyle='#1f2222';x.beginPath();x.roundRect(s*26-17,-28,34,58,12);x.fill();x.fillStyle='#3a3f3d';x.beginPath();x.roundRect(s*26-13,-44,26,20,6);x.fill();dot(s*26,24,10,'#2b3942');dot(s*26-3,21,3,'rgba(255,255,255,.5)')}x.fillStyle='#2b2f2e';x.fillRect(-12,-18,24,14);dot(0,-30,6,'#555b58')}
  if(g==='scope'){limb(0,10,-40,60,'#3c3f3d',5);limb(0,10,40,60,'#3c3f3d',5);limb(0,10,0,64,'#2e302f',5);x.fillStyle='#4a5a4c';x.beginPath();x.roundRect(-70,-22,120,30,10);x.fill();x.fillStyle='#1f2222';x.beginPath();x.roundRect(48,-27,26,40,6);x.fill();x.beginPath();x.roundRect(-92,-14,26,18,5);x.fill();x.fillRect(-6,6,12,8)}
  if(g==='cam'){x.fillStyle='#1f2222';x.beginPath();x.roundRect(-92,-34,58,62,10);x.fill();x.fillRect(-74,-46,24,14);x.fillStyle='#d9d8d2';x.beginPath();x.roundRect(-36,-24,116,44,8);x.fill();x.fillStyle='#1f2222';x.fillRect(-36,-24,10,44);x.fillRect(66,-28,18,52);x.fillStyle='#b8b7af';x.fillRect(10,-24,6,44);x.fillRect(30,-24,6,44);dot(-60,-10,5,'#c23b2e')}
  x.restore();ctx=prev}
function renderGear(P){P.insertAdjacentHTML('beforeend','<div class="sub" style="margin-top:0">Gear</div><div class="kit" id="kitGear"></div><div class="sub">Outfits</div><div class="kit" id="kitOut"></div><div class="sub">Defender paint</div><div class="kit" id="kitPaint"></div>');
  const info={bino:['Binoculars','10×. Quick and handheld; hold a bird steady in the ring to log it.'],scope:['Spotting scope','20× to 60× on a tripod. Stand still to set it up; moving packs it away. Not from the Defender.'],cam:['Camera and zoom lens','100 to 600 mm. Press the shutter to take a photo; a sharp bird in the focus box is logged and named in your album.']};
  const KG=$('kitGear');for(const g of GEAR_IDS){const d=document.createElement('div');d.className='kitc'+(S.gear===g?' sel':'');d.innerHTML=`<img class="kimg" alt=""><b>${info[g][0]}</b><span>${info[g][1]}</span><button class="btn ${S.gear===g?'ghost':''}">${S.gear===g?'In hand':'Use'}</button>`;
    d.querySelector('img').src=kitPic(c=>drawGearArt(c,g));d.querySelector('button').onclick=()=>{setGear(g);renderJournal()};KG.appendChild(d)}
  const KO=$('kitOut');for(const id of OUTFIT_IDS){const o=outfitDef(id),d=document.createElement('div');d.className='kitc'+(S.outfit===id?' sel':'');d.innerHTML=`<img class="kimg" alt=""><b>${o.name}</b><span>${o.note}</span><button class="btn ${S.outfit===id?'ghost':''}">${S.outfit===id?'Wearing':'Wear'}</button>`;
    d.querySelector('img').src=kitPic((c,x)=>{ctx=x;x.fillStyle='#e9e3cf';x.fillRect(0,0,480,320);
    for(const [dir,px] of[['front',150],['side',330]]){x.save();x.translate(px,285);x.scale(3.4,3.4);drawBirder({x:0,y:0,dir,sx:1,preview:true,glass:false},0,id);x.restore()}});
    d.querySelector('button').onclick=()=>{S.outfit=id;saveKit();SFX.click();renderJournal()};KO.appendChild(d)}
  const KP=$('kitPaint');for(const id of Object.keys(PAINTS)){const pt=PAINTS[id],cur=(S.paint||'coniston')===id,d=document.createElement('div');d.className='kitc'+(cur?' sel':'');
    d.innerHTML=`<img class="kimg" alt=""><b>${pt.name}</b><button class="btn ${cur?'ghost':''}">${cur?'On the Defender':'Paint it'}</button>`;
    d.querySelector('img').src=kitPic((c,x)=>{ctx=x;x.fillStyle='#e9e3cf';x.fillRect(0,0,480,320);x.save();x.translate(250,190);x.scale(1.75,1.75);drawCar({x:0,y:0,ang:.55,roll:0,v:0,paint:id},0);x.restore()});
    d.querySelector('button').onclick=()=>{S.paint=id;saveKit();SFX.click();renderJournal()};KP.appendChild(d)}}
function renderDetail(P,id){const D=SPECIES[id],j=S.journal.seen[id],show=true;
  P.insertAdjacentHTML('beforeend',`<div class="detail"><div><div class="plate"><canvas id="jPlate" width="880" height="660"></canvas></div><div class="views" id="jViews"></div><div id="jShots"></div></div><div id="jInfo"></div></div>`);
  
  const V=$('jViews');for(const [k,l] of[['perched','Perched'],['dorsal','Flight, above'],['ventral','Flight, below']]){const b=document.createElement('button');b.textContent=l;b.setAttribute('aria-pressed',jView===k);b.disabled=!show;b.onclick=()=>{jView=k;renderJournal()};V.appendChild(b)}
  drawPlate($('jPlate'),id,show?jView:'perched',{pins:show,locked:!show});
  const shots=S.album.list.filter(p=>p.sp===id);if(shots.length){const J=$('jShots');J.innerHTML=`<div class="sub">Your photos (${shots.length})</div><div class="album"></div>`;const G=J.querySelector('.album');
    shots.slice(0,6).forEach(p=>{const d=document.createElement('div');d.className='shot';d.innerHTML=`<button class="open" aria-label="Open photo"><img src="${p.thumb}" alt="${D.name}"></button>`;d.querySelector('.open').onclick=()=>{albumFilter=id;openPhoto(albumRows().indexOf(p))};G.appendChild(d)})}
  const I=$('jInfo');
  if(!show){I.innerHTML=`<p class="dname">Not yet seen</p><p class="dsci">${D.zone}</p><div class="facts">${abTag(id)}${rangeTxt(id)?`<span title="Where in the East it is this season">Range: ${rangeTxt(id)}</span>`:''}</div><p class="hand">${D.hint}</p><div class="sub">Habitat</div><p class="txt">${D.habitat}</p><div class="sub">Listen for</div><p class="txt">${D.voice}</p>`;return}
  const fm=jView==='perched'?`<ol class="marks">${D.marks.map(m=>`<li><b>${m.n}</b><span>${m.t}</span></li>`).join('')}</ol>`:`<ul class="marks">${D.flightMarks.map(m=>`<li><b>•</b><span>${m}</span></li>`).join('')}</ul>`;
  I.innerHTML=`<p class="dname">${D.name} ${fgIcons(id)}</p><p class="dsci">${D.sci}</p><div class="facts">${abTag(id)}${rangeTxt(id)?`<span title="Where in the East it is this season">Range: ${rangeTxt(id)}</span>`:''}<span>${D.group}</span><span>${D.sex}</span><span>Length ${D.lenTxt}</span><span>Wingspan ${D.wsTxt}</span></div>
    <div class="sub">Field marks</div>${fm}
    <div class="sub">Size &amp; shape</div><p class="txt">${sizeText(id)}</p><canvas id="jSize" width="880" height="280" style="width:100%;height:auto;border-radius:10px;display:block;margin:6px 0 4px"></canvas>
    <div class="sub">Habitat</div><p class="txt">${D.habitat}</p><div class="habtags">${HAB_ORDER.filter(k=>HABITATS[k].play.includes(id)).map(k=>`<span style="border-color:${HAB_CATS[HABITATS[k].cat].col}">${HABITATS[k].name}</span>`).join('')}</div>${whereWhen(id)}<div class="sub">Voice</div><p class="txt">${D.voice} <button class="btn ghost" id="jPlay" style="padding:4px 12px;font-size:13px;margin-left:4px">Play</button></p>
    ${j?`<div class="sub">Your notes</div><p class="hand">First seen ${fmtWhen(j.first.ts)}<br>${j.first.zone}, ${j.first.temp}°C<br>Logged ${j.count}× · ${shots.length} photo${shots.length===1?'':'s'}</p>`:'<p class="hand">Not on your life list yet. Use Where &amp; when to go and find it.</p>'}`;
  drawSizeCompare($('jSize'),id);{const rm=$('jRange');if(rm)rm.src=rangeMap(id)}
  $('jPlay').onclick=()=>{SFX.init();SFX.resume();if(id==='pile'){SFX.song('pile',1,0);setTimeout(()=>SFX.drum(1,0),1900)}else SFX.song(id,1,0)}}

/* ---------- HUD wiring ---------- */
function press(el,fn){el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.classList.add('pressed');fn()});const up=()=>el.classList.remove('pressed');el.addEventListener('pointerup',up);el.addEventListener('pointerleave',up);
  el.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();fn()}})}
press($('binoBtn'),()=>toggleBino());press($('jrBtn'),()=>toggleJournal(true));press($('pishBtn'),doPish);press($('useBtn'),doUse);
press($('zoomIn'),()=>zoomBy(1));press($('zoomOut'),()=>zoomBy(-1));press($('gearBtn'),cycleGear);press($('shutterBtn'),shutter);
const GICON={bino:'<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><rect x="5" y="15" width="12" height="18" rx="5"/><rect x="23" y="15" width="12" height="18" rx="5"/><rect x="8" y="8" width="7" height="9" rx="2"/><rect x="25" y="8" width="7" height="9" rx="2"/><rect x="15" y="16" width="10" height="5" rx="2"/></svg>',
  scope:'<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><rect x="5" y="9" width="24" height="9" rx="3" transform="rotate(-12 17 13)"/><rect x="28" y="4" width="7" height="11" rx="2" transform="rotate(-12 31 9)"/><path d="M18 19l-8 17h3l6-12 6 12h3l-8-17z"/><rect x="18" y="19" width="3" height="17"/></svg>',
  cam:'<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><rect x="3" y="11" width="15" height="18" rx="3"/><rect x="7" y="7" width="6" height="5" rx="1"/><rect x="17" y="13" width="17" height="14" rx="3"/><rect x="33" y="11" width="4" height="18" rx="1"/></svg>'};
function updateGearUI(){const g=S.gear;$('binoBtn').querySelector('.disk').innerHTML=GICON[g];$('gearIcon').innerHTML=GICON[g].replace('fill="currentColor"','fill="currentColor" width="24" height="24"');$('gearLbl').textContent=GEAR[g].short;
  $('binoLbl').textContent=S.bino.on?'Lower '+GEAR[g].name.toLowerCase():GEAR[g].name;$('zoomLbl').textContent=zoomLabel();$('binoBtn').setAttribute('aria-label',$('binoLbl').textContent)}
updateGearUI();
$('journalBtn').onclick=()=>toggleJournal(true);$('compass').onclick=()=>toggleMap(true);$('compass').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')toggleMap(true)});
$('mapClose').onclick=()=>toggleMap(false);$('mapBack').addEventListener('pointerdown',e=>{if(e.target.id==='mapBack')toggleMap(false)});
$('protoToggle').onclick=()=>{settings.protoOpen=!settings.protoOpen;saveSettings()};
const ICONS={plane:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 11.2h7.4l1-6.2h2.2l.8 6.2H20l1.8-2.4h1.2l-.6 3.4.6 3.4h-1.2L20 13.2h-6.6l-.8 3.4h-2.2l-1-3.4H2z"/><rect x="7" y="18" width="12" height="1.6" rx=".8"/></svg>',walk:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="8.5" cy="8" rx="2.6" ry="4"/><ellipse cx="15.5" cy="12.5" rx="2.6" ry="4"/><circle cx="8.5" cy="14.2" r="1.4"/><circle cx="15.5" cy="18.7" r="1.4"/></svg>',boat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h18l-2.5 4.5h-13z"/><path d="M12 14V4l6 7h-6"/></svg>',drive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v-4l2-5h10l3 5h3v4"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/><path d="M9 16h6"/></svg>',
  exit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h9"/></svg>',
  travel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19l6-12 4 7 3-4 5 9z"/></svg>'};
let lastUse='',stT=0;
function updateHUD(dt){const u=useTarget()||'',wk1=!u&&S.mode==='walk'&&S.player.water!=='swim',uk=u+S.mode+(wk1?'w'+!!S.touchSneak:'');if(uk!==lastUse){lastUse=uk;const b=$('useBtn');b.disabled=!u&&!wk1;if(wk1){$('useLbl').textContent=S.touchSneak?'Walking':'Walk';$('useIcon').innerHTML=ICONS.walk;b.classList.toggle('hot',!!S.touchSneak);b.setAttribute('aria-pressed',S.touchSneak?'true':'false')}else{b.removeAttribute('aria-pressed');$('useLbl').textContent=PLBL[u]?PLBL[u]:S.mode==='plane'?'Flying':u==='travel'?'Travel':u==='exit'?'Get out':u==='board'?'Board':u==='land'||S.mode==='boat'?'Go ashore':'Drive';$('useIcon').innerHTML=PLBL[u]||S.mode==='plane'||(u==='board'&&boatNear(S.player.x,S.player.y)?.craft==='plane')?ICONS.plane:ICONS[u==='board'||u==='land'||S.mode==='boat'?'boat':u||'drive'];b.classList.toggle('hot',!!u&&u!=='exit')}}
  $('pishBtn').disabled=S.mode!=='walk';$('gearBtn').disabled=S.bino.on;
  stT-=dt;if(stT<=0){stT=.5;const L=listener();const act=(S.mode==='boat'||S.mode==='plane')&&S.boat?' · '+BOATK[S.boat.craft].name+(S.mode==='plane'&&S.boat.alt>0?' · flying':''):S.mode==='walk'&&S.player.water?(S.player.water==='swim'?' · Swimming':' · Wading'):'';$('statusText').innerHTML=`${zoneName(L.x,L.y)} <span class="temp">· ${TROP?isleAt(L.x,L.y):bandAt(L.y).name} ·${GPS.mode==='console'?'':' '+zoneCat(L.x,L.y)+' ·'} ${tempC(L.x,L.y)}°C${act}</span>`}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').style.opacity=0}}

/* ---------- prototype panel ---------- */
function freeSpot(x,y){for(let r=0;r<600;r+=20)for(let a=0;a<TAU;a+=.5){const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(!blockedAt(px,py,20)&&isLand(terr(px,py))&&!roadAt(px,py)||(!blockedAt(px,py,20)&&roadAt(px,py)))return[px,py]}return[x,y]}
function teleport(x,y){if(S.mode==='boat'){S.mode='walk';S.boat=null}const [px,py]=freeSpot(x,y);if(S.mode==='drive'){S.car.x=px;S.car.y=py;S.car.v=0}else{S.player.x=px;S.player.y=py}S.cam.x=px;S.cam.y=py;if(S.bino.on)toggleBino(false)}
const LPT=n=>{const L=LAUNCHES.find(l=>l.name===n)||LAUNCHES[0];const d=WD.docks.find(q=>q[1]===n)||[0,0,L.x,L.y];return[d[2],d[3]+30]};
const TRAVEL=CENTRAL?[...TRAILS.map(t=>[t.name,()=>teleport(t.x-(t.dir||-1)*160,t.y+40)]),...FEATURES.map(F=>[F.name,()=>fastTravel(F)])]:[['Arctic tundra',()=>teleport(8300,1150)],['Cold north',()=>teleport(roadX(8200)-60,8200)],['Hardwoods',()=>teleport(roadX(15200)-60,15200)],['Warm south',()=>teleport(roadX(29200)-60,29200)],
  ['Beach',()=>teleport(coastX(START.y+300)-200,START.y+300)],['Mountains',()=>teleport(2600,14600)],['Trailhead',()=>teleport(TRAIL.x+120,TRAIL.y+30)],
  ['Port Bostick',()=>teleport(AVES[4]+150,STS[1]+110)],['Pier',()=>teleport(coastX(PIER_Y)+200,PIER_Y)],['Marina',()=>teleport(OCEAN_DR+200,18175)],['Ellis Park',()=>teleport((PARK.x0+PARK.x1)/2,PARK.y0+60)],
  ['Gribley Farm',()=>teleport(FARMS[1].yard.x0+60,FARMS[1].yard.y1+40)],['Mill Farm',()=>teleport(FARMS[0].yard.x0+60,FARMS[0].yard.y1+40)],['Laurel Farm',()=>teleport(FARMS[2].yard.x0+60,FARMS[2].yard.y1+40)],
  ['Mill Pond',()=>teleport(...LPT('Mill Pond landing'))],['Laurel Lake',()=>teleport(...LPT('Laurel Lake landing'))],['Loon Lake',()=>teleport(...LPT('Loon Lake landing'))],['Spruce bog',()=>teleport(4200,8350)],
  ['Heron Marsh',()=>teleport(8500,24800)],['Cypress swamp',()=>teleport(...LPT('Swamp boardwalk landing'))],['Salt marsh',()=>teleport(roadX(26600)+150,26600)],['Back bay',()=>teleport(...LPT('Causeway launch'))],
  ['Barrier island',()=>teleport(coastX(31300)-170,31300)],['Mangrove keys',()=>teleport(coastX(32100)-420,32100)],['Grassland',()=>teleport(4200,16900)],['Barrens',()=>teleport(9000,7150)],
  ['Powerline cut',()=>teleport(5600,13800)],['Sandhill',()=>teleport(5000,31200)],['Tundra',()=>teleport(1200,8000)],['Lighthouse',()=>teleport(LH.x-260,LH.y+180)],['Rocky shore',()=>teleport(coastX(9000)-200,9000)],
  ['To the Defender',()=>{if(S.mode==='drive')return;teleport(S.car.x-50,S.car.y+40)}],['Start',()=>teleport(START.x-60,START.y+40)]];

$('callBtn').onclick=()=>{const L=listener();let msg=[];
  for(const sp of SP_ORDER){const b=S.birds.filter(q=>q.sp===sp).sort((a,c)=>Math.hypot(a.x-L.x,a.y-L.y)-Math.hypot(c.x-L.x,c.y-L.y))[0];if(!b)continue;b.logged=false;
    if(GB[sp]&&GB[sp].kind!=='perch'){const q=gbCallSpot(sp,L.x,L.y);if(!q){msg.push('no spot for the '+SPECIES[sp].name);continue}b.x=q[0];b.y=q[1];b.fly=null;b.under=0;b.home={x:b.x,y:b.y};const k=GB[sp].kind;b.st=k==='sea'||k==='swim'?'swim':k==='reed'?'reed':k==='wade'?'wade':'ground';b.z=gbRestZ(sp,b.st);b.goal=null;b.song=.5+Math.random()*4}
    else if(sp==='pipl'){const y=L.y+80;b.x=coastX(y)-150;b.y=y;b.z=0;b.st='ground';b.goal=null;b.home={x:b.x,y};msg.push('plover on the beach due east')}
    else{const ts=suitableTrees(sp,L.x,L.y,sp==='pile'?160:100,sp==='pile'?380:260,false);if(!ts.length){msg.push(`no ${sp==='pile'?'big trees':'trees'} nearby`);continue}landOn(b,ts[Math.floor(Math.random()*ts.length)]);b.fly=null;b.hop=null;b.curious=sp==='btbw'?20:0;b.song=.5}}
  toast(msg.length?'Moved them all nearby, except: '+msg.slice(0,4).join(', '):'Moved one of each bird nearby',4)};
$('markBtn').onclick=e=>{S.showBirds=!S.showBirds;e.currentTarget.setAttribute('aria-pressed',S.showBirds)};
$('plateBtn').onclick=e=>{S.showPlates=!S.showPlates;e.currentTarget.setAttribute('aria-pressed',S.showPlates);if(S.showPlates)toggleJournal(true)};
$('logAllBtn').onclick=()=>{for(const sp of SP_ORDER)if(!S.journal.seen[sp]){S.journal.seen[sp]={count:1,first:{ts:Date.now(),zone:'Logged from the prototype panel',temp:tempC(listener().x,listener().y)}};S.journal.log.push({sp,ts:Date.now(),zone:zoneName(listener().x,listener().y),temp:tempC(listener().x,listener().y),how:'bino',region:'East Coast'})}saveJournal();updateLife(true);toast(`All ${SP_ORDER.length} logged. The Central trail is open.`)};
$('resetBtn').onclick=()=>{S.journal={seen:{},log:[]};saveJournal();for(const b of S.birds)b.logged=false;updateLife();toast('Journal cleared')};

/* ---------- update + loop ---------- */
function update(dt,t){S.t=t;condTick(dt);msgTick(dt);soarAssist(dt);S.pishCD=Math.max(0,S.pishCD-dt);
  if(S.bino.on){S.bino._dt=dt;updateBino(dt)}
  if(S.mode==='walk')updatePlayer(dt);
  updateCar(dt);updateBoat(dt);updatePlane(dt);updateBirds(dt);updateTraffic(dt);updateAirliner(dt);mpTick(dt);updatePeople(dt);sweepCells(dt);
  const tg=camTarget(),k=1-Math.pow(.004,dt);S.cam.x+=(tg.x-S.cam.x)*k;S.cam.y+=(tg.y-S.cam.y)*k;
  const L=listener(),dc=ISLE?seaNear(L.x,L.y):coastX(L.y)-L.x;SFX.ambient(clamp(1-Math.abs(dc)/1400,0,1)*(S.bino.on?.7:1),clamp(forestMask(L.x,L.y)*1.6-.4,0,1)*(dc>500?1:0))}
let last=performance.now(),TT=0;
function drawCallCues(t){if(settings.callCues===false||VZ<.98)return;ctx=mainCtx;ctx.setTransform(DPR,0,0,DPR,0,0);
  const B=S.bino,mT=84,mB=128,mS=Math.min(78,VW*.14);
  for(const b of S.birds){if(!(b.note>0))continue;let sx,sy,ok=true;
    if(B.on){if(!BV)return;const E=BV.E,dx=(b.x-E.x)/M,dy=(b.y-E.y)/M,dist=Math.hypot(dx,dy),az=angDiff(BV.yaw,Math.atan2(dy,dx)),el=Math.atan2((b.z||0)-E.h,dist)-BV.pitch;
      sx=VW/2+az*BV.ppr;sy=VH/2-el*BV.ppr;if(Math.abs(az)>1.4){sx=VW/2+Math.sign(az)*VW*4;sy=VH/2}}
    else{const p=birdOWPos(b);sx=p[0]-S.cam.x+VW/2;sy=p[1]-18-S.cam.y+VH/2}
    if(sx>mS&&sx<VW-mS&&sy>mT&&sy<VH-mB)continue;
    // pull the point in along the line from the centre until it sits on the inset edge
    const cx=VW/2,cy=(mT+VH-mB)/2,vx=sx-cx,vy=sy-cy,kx=vx?((vx>0?VW-mS:mS)-cx)/vx:1e9,ky=vy?((vy>0?VH-mB:mT)-cy)/vy:1e9,k=Math.min(kx,ky,1),ex=cx+vx*k,ey0=cy+vy*k,ey=(!GPS.linked||GPS.mode!=='console')&&ey0>VH-215&&(ex<250||ex>VW-250)?VH-215:ey0,ang=Math.atan2(vy,vx);
    const a=Math.min(1,b.note/.6)*.95;ctx.save();ctx.globalAlpha=a;ctx.translate(ex,ey);
    ctx.fillStyle='rgba(20,28,24,.72)';ctx.beginPath();ctx.arc(0,0,15,0,TAU);ctx.fill();if(!S.journal.seen[b.sp]){ctx.strokeStyle='#e5383b';ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(0,0,15.5,0,TAU);ctx.stroke()}
    ctx.save();ctx.rotate(ang);ctx.fillStyle='#ffd166';ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(14,-7);ctx.lineTo(14,7);ctx.closePath();ctx.fill();ctx.restore();
    const bob=Math.sin(t*6+b.x)*1.2;ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(-3,5+bob,3.6,2.7,-.4,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(.3,4+bob);ctx.lineTo(.3,-7+bob);ctx.quadraticCurveTo(4,-5+bob,6,-1+bob);ctx.stroke();
    ctx.restore()}}
/* ---------- DV1-DV4 Dev tools (phone app, only with Settings > Dev tools on; nothing here is saved) ---------- */
const DEV={obs:false,spd:8,vz:1,inspect:false,info:false,pick:null,mark:null,infoT:0,ft:16};
const DEV_SPD=[[3,'Brisk'],[8,'Fast'],[20,'Very fast']],DEV_VZ=[[1,'Normal'],[.7,'Far'],[.5,'Very far']];
function devOff(){DEV.obs=false;DEV.inspect=false;DEV.info=false;DEV.pick=null;DEV.mark=null;devCard();$('devInfo').hidden=true;document.body.classList.remove('dev-obs','dev-inspect')}
function setObserver(on){if(on&&S.mode!=='walk'){toast('Get out of the '+(S.mode==='drive'?'Defender':'boat')+' first');return false}
  DEV.obs=on;document.body.classList.toggle('dev-obs',on);if(!on){const p=S.player;p.vx=p.vy=0;
    if(waterKind(p.x,p.y)==='swim'||blockedAt(p.x,p.y,6)){const s=landSpot?landSpot(p.x,p.y):null;if(s){p.x=s[0];p.y=s[1]}}}
  toast(on?'Observer mode: glide anywhere, birds stay put':'Observer mode off');return true}
function renderDevApp(P){
  const sw=(k,b,s,fn)=>{const d=document.createElement('label');d.className='setting';d.innerHTML=`<div><b>${b}</b><span>${s}</span></div><span class="switch"><input type="checkbox" id="dev-${k}" ${(k==='showBirds'?S.showBirds:DEV[k])?'checked':''}><i></i></span>`;
    d.querySelector('input').onchange=e=>{const ok=fn(e.target.checked);if(ok===false)e.target.checked=false};P.appendChild(d)};
  const pick=(id,b,s,opts,cur,fn)=>{const d=document.createElement('div');d.className='setting devpick';d.innerHTML=`<div><b>${b}</b><span>${s}</span></div><span class="bodysel">${opts.map(([v,l])=>`<button data-v="${v}" class="${v===cur?'on':''}">${l}</button>`).join('')}</span>`;
    d.querySelectorAll('button').forEach(x=>x.onclick=()=>{fn(+x.dataset.v);d.querySelectorAll('button').forEach(y=>y.classList.toggle('on',y===x))});d.id=id;P.appendChild(d)};
  P.insertAdjacentHTML('beforeend',`<p class="txt" style="margin:0 0 10px">Tools for testing. They change nothing in your save, and switch off when you reload or turn Dev tools off in Settings.</p>`);
  sw('obs','Observer mode','Glide anywhere quickly, over water and through trees and buildings. Birds don\'t fly off.',v=>setObserver(v));
  pick('devSpd','Observer speed','How fast you glide',DEV_SPD,DEV.spd,v=>DEV.spd=v);
  pick('devVz','Observer view','Pull the view back to see more of the map',DEV_VZ,DEV.vz,v=>DEV.vz=v);
  sw('inspect','Inspect','Tap anything on the map (a bird, tree, building, vehicle, person or the ground) to see its name and ID',v=>{DEV.inspect=v;document.body.classList.toggle('dev-inspect',v);if(!v){DEV.pick=null;DEV.mark=null;devCard()}toast(v?'Inspect on: close the phone and tap anything':'Inspect off')});
  sw('info','Position readout','Place, habitat, band, coordinates, frame time and birds out, in the top corner',v=>{DEV.info=v;$('devInfo').hidden=!v});
  sw('showBirds','Show birds','Mark every bird that is out on the map',v=>{S.showBirds=v;const m=$('markBtn');if(m)m.setAttribute('aria-pressed',v)});
  const d=document.createElement('div');d.className='setting';d.innerHTML=`<div><b>Bring birds near</b><span>One of each bird that is out, close to you</span></div><span class="wipebtns"><button id="devCall">Bring</button></span>`;
  d.querySelector('button').onclick=()=>{$('callBtn').onclick();toast('Birds brought near')};P.appendChild(d)}
function devUpdate(p,inp,dt){const want=inp.m>0&&!S.bino.on,v=WALK_SPD*DEV.spd*(joy.active?Math.max(.25,inp.m):1),ka=1-Math.exp(-dt*8);
  p.vx+=((want?inp.x*v:0)-p.vx)*ka;p.vy+=((want?inp.y*v:0)-p.vy)*ka;if(!want&&Math.hypot(p.vx,p.vy)<4)p.vx=p.vy=0;
  if(want)p.face+=angDiff(p.face,Math.atan2(inp.y,inp.x))*Math.min(1,dt*14);
  p.x=clamp(p.x+p.vx*dt,40,WW-40);p.y=clamp(p.y+p.vy*dt,40,WH-40);p.water=null;p.sneak=false;p.tripod=false;
  const sp=Math.hypot(p.vx,p.vy);p.moving=sp>6;p.mv=clamp(sp/WALK_SPD,0,1);p.walk=(p.walk||0)+Math.min(sp,WALK_SPD)*dt/STRIDE;p.idleT=0;p.look=0}
// DV3: screen point -> world point (1 world unit = 1 px at normal view)
function devWorld(cx,cy){const r=cv.getBoundingClientRect();return{x:(cx-r.left-VW/2)/VZ+S.cam.x,y:(cy-r.top-VH/2)/VZ+S.cam.y}}
function devPick(cx,cy){const w=devWorld(cx,cy),R=Math.max(14,22/VZ),hits=[],seg=(px,py,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1,u=clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1);return Math.hypot(px-ax-u*dx,py-ay-u*dy)};
  for(const b of S.birds){if(b.st==='dormant'&&!S.showBirds)continue;let q;try{q=birdOWPos(b)}catch(e){q=[b.x,b.y]}const d=Math.hypot(q[0]-w.x,q[1]-w.y);if(d<R*1.2)hits.push({k:'bird',o:b,d:d*.5,x:q[0],y:q[1]})}
  for(const p of PEOPLE){const d=seg(w.x,w.y,p.x,p.y,p.x,p.y-26);if(d<R)hits.push({k:'person',o:p,d,x:p.x,y:p.y-12})}
  for(const v of [...PARKED,...TRAFFIC,S.car]){if(!v)continue;const d=Math.hypot(v.x-w.x,v.y-14-w.y);if(d<R*1.6)hits.push({k:'vehicle',o:v,d:d+4,x:v.x,y:v.y-10})}
  for(const B of BOATS){const d=Math.hypot(B.x-w.x,B.y-w.y);if(d<R*1.8)hits.push({k:'boat',o:B,d:d+4,x:B.x,y:B.y})}
  for(const B of buildingsNear(w.x,w.y+80,320)){const top=B.y-bPx(B);if(w.x>=B.x&&w.x<=B.x+B.w&&w.y>=top&&w.y<=B.y+B.d)hits.push({k:'building',o:B,d:R+6,x:B.x+B.w/2,y:B.y+B.d/2})}
  for(const T of treesNear(w.x,w.y+120,220)){let H=8;try{H=model(T).tr.h||8}catch(e){}const d=seg(w.x,w.y,T.x,T.y,T.x,T.y-H*HS*1.1);if(d<R*1.3)hits.push({k:'tree',o:T,d:d+8,x:T.x,y:T.y})}
  hits.sort((a,b)=>a.d-b.d);const hit=hits[0]||{k:'ground',o:null,x:w.x,y:w.y};hit.wx=w.x;hit.wy=w.y;DEV.pick=hit;DEV.mark={x:hit.x,y:hit.y,t:TT,o:hit.k==='bird'?hit.o:null};devCard()}
function devWhere(x,y){const hb=habitatAt(x,y),H=HABITATS[hb];return[['Habitat',(H?H.name:hb)+` (${hb})`],[PAC?'Island':'Band',PAC?isleAt(x,y):bandAt(y).name+` (${bandAt(y).id})`],['Place',placeName(x,y)],['Position',`x ${Math.round(x)} · y ${Math.round(y)} (${(x/M).toFixed(0)} m, ${(y/M).toFixed(0)} m)`]]}
function devCard(){const el=$('devCard'),P=DEV.pick;if(!P||!DEV.inspect){el.hidden=true;return}const o=P.o;let t='',rows=[];
  if(P.k==='bird'){const D=SPECIES[o.sp]||{},c=COND.sp[o.sp];t=D.name||o.sp;
    rows=[['Species code',o.sp],['Bird ID',o.id],['Doing',o.soar?'soaring':o.st+(o.under?' (under water)':'')],['Kind',GB[o.sp]?GB[o.sp].kind:'hand-drawn'],['Abundance',c?c.ab+' · '+c.st:'—'],['Out now',o.out===false?'no':'yes'],['Stray',o.stray?'yes, outside its range':'no'],['Logged',S.journal.seen[o.sp]?'on your life list':'not yet'],...devWhere(o.x,o.y)]}
  else if(P.k==='tree'){let sp=o.type;try{sp=model(o).sp}catch(e){}t=SPEC_NAME[sp]||SPEC_NAME[o.type]||o.type;rows=[['Tree type',o.type+(sp!==o.type?' / '+sp:'')],['Tree ID',o.id],['Height',o.h?(+o.h).toFixed(1)+' m':'—'],...devWhere(o.x,o.y)]}
  else if(P.k==='building'){t=o.name||o.sign||BKIND[o.kind]||o.kind;rows=[['Kind',(BKIND[o.kind]||o.kind)+` (${o.kind})`],['Building ID',o.id],['Size',`${Math.round(o.w/M)} × ${Math.round(o.d/M)} m, ${(+o.h).toFixed(1).replace(/\.0$/,'')} m tall`],...devWhere(o.x+o.w/2,o.y+o.d/2)]}
  else if(P.k==='vehicle'){t=o===S.car?'Your Defender':(o.parked?'Parked ':'')+(o.type||'vehicle');rows=[['Type',o.type||(o===S.car?'defender':'—')],['Moving',Math.abs(o.v||o.spd||0)>1?'yes':'no'],...devWhere(o.x,o.y)]}
  else if(P.k==='boat'){t=(o.name||'')+' '+(o.craft==='tour'?'Sandpiper tour boat':o.craft||'boat');rows=[['Craft',o.craft||'—'],...devWhere(o.x,o.y)]}
  else if(P.k==='person'){t=(o.kind||'Person').replace(/^./,c=>c.toUpperCase());rows=[['Kind',o.kind||'—'],...devWhere(o.x,o.y)]}
  else{t='Ground';rows=[['Terrain',Object.keys(T).find(k=>T[k]===terr(P.wx,P.wy))||'—'],...devWhere(P.wx,P.wy)]}
  el.innerHTML=`<div class="dch"><b>${esc(t.trim())}</b><button id="devX" aria-label="Close">×</button></div><table>${rows.map(([a,b])=>`<tr><th>${esc(a)}</th><td>${esc(String(b))}</td></tr>`).join('')}</table>${P.k==='bird'&&SPECIES[o.sp]?'<button id="devFG">Open in Field Guide</button>':''}`;
  el.hidden=false;$('devX').onclick=()=>{DEV.pick=null;DEV.mark=null;el.hidden=true};if($('devFG'))$('devFG').onclick=()=>toggleJournal(true,o.sp)}
// pick ring on the map, and the live readout
function devDraw(t){if(!settings.dev)return;
  if(DEV.mark&&!S.bino.on){const m=DEV.mark;let x=m.x,y=m.y;if(m.o){try{[x,y]=birdOWPos(m.o)}catch(e){}}const sx=(x-S.cam.x)*VZ+VW/2,sy=(y-S.cam.y)*VZ+VH/2,a=(t-m.t)*3;
    ctx=mainCtx;ctx.setTransform(DPR,0,0,DPR,0,0);ctx.strokeStyle='#ff3b6b';ctx.lineWidth=2.5;ctx.setLineDash([6,4]);ctx.lineDashOffset=-a*8;ctx.beginPath();ctx.arc(sx,sy,18,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(sx-26,sy);ctx.lineTo(sx-12,sy);ctx.moveTo(sx+12,sy);ctx.lineTo(sx+26,sy);ctx.moveTo(sx,sy-26);ctx.lineTo(sx,sy-12);ctx.moveTo(sx,sy+12);ctx.lineTo(sx,sy+26);ctx.stroke()}
  if(DEV.info&&t-DEV.infoT>.25){DEV.infoT=t;const L=listener(),hb=habitatAt(L.x,L.y);
    $('devInfo').textContent=`${placeName(L.x,L.y)} · ${hb} · ${PAC?isleAt(L.x,L.y):bandAt(L.y).id}\nx ${Math.round(L.x)}  y ${Math.round(L.y)} · ${Math.round(DEV.ft)} ms\nbirds out ${S.birds.length} of ${S.pool?S.pool.length:S.birds.length}${DEV.obs?' · observer':''}`}}
{const pd={};cv.addEventListener('pointerdown',e=>{pd[e.pointerId]={x:e.clientX,y:e.clientY,t:performance.now()}});
 cv.addEventListener('pointerup',e=>{const q=pd[e.pointerId];delete pd[e.pointerId];if(!q||!DEV.inspect||!settings.dev||S.bino.on)return;
   if(Math.hypot(e.clientX-q.x,e.clientY-q.y)<10&&performance.now()-q.t<450)devPick(e.clientX,e.clientY)})}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
  try{if(!paused()){TT+=dt;update(dt,TT)}if(S.bino.on)drawBino(TT);else{drawWorld(TT);drawAtmos(TT,false)}drawCallCues(TT);devDraw(TT);updateHUD(dt);if(!S.bino.on)drawCompass(TT)}catch(err){console.error(err)}finally{ctx=mainCtx}DEV.ft+=(dt*1000-DEV.ft)*.1}
function start(data){
  if(data&&data.v===1&&data.player){Object.assign(S.player,data.player);Object.assign(S.car,data.car);S.mode=data.mode==='plane'||data.mode==='boat'?'walk':data.mode||'walk';$('title').classList.add('out');setTimeout(()=>$('title').hidden=true,800)}
  if(!(data&&data.v===1&&data.player))loadProgress();
  placeBirds();if(data&&data.v===1&&Array.isArray(data.birds)&&data.birds.length===S.birds.length)data.birds.forEach((b,i)=>Object.assign(S.birds[i],b));
  S.cam.x=listener().x;S.cam.y=listener().y;
  document.body.classList.toggle('on-title',!$('title').classList.contains('out'));titleStage(S.arrived?'free':'modes');applySettings();updateLife();requestAnimationFrame(frame);
  if((S.arrived||S.fastTo)&&!$('title').classList.contains('out')){const pl=settings.play;$('startBtn').onclick();$('title').hidden=true;if(pl&&pl!=='free'){settings.play=pl;try{localStorage.setItem('birding-settings',JSON.stringify(settings))}catch(e){}}}
  {const ac=document.getElementById('arriveCard');if(ac){ac.style.opacity='0';setTimeout(()=>ac.remove(),700)}document.documentElement.classList.remove('arriving')}
  if(S.arrived||S.fastTo){
    // sound can only start after a tap or key press, so wake it on the first one
    const wake=()=>{SFX.init();SFX.resume()};addEventListener('pointerdown',wake,{once:true});addEventListener('keydown',wake,{once:true})}}
// MO1: which step of the start screen is showing ('modes' or 'free')
function titleStage(st){$('titleModes').hidden=st!=='modes';$('titleFree').hidden=st!=='free';{const m=$('titleMulti');if(m)m.hidden=st!=='multi'}if(st==='multi'){setTimeout(()=>{try{$('mpCode').focus({preventScroll:true})}catch(e){}},80);return}
  if(GPS.linked)setTimeout(()=>gpFocus(st==='free'?$('startBtn'):$('modeFree')),80);else try{(st==='free'?$('startBtn'):$('modeFree')).focus({preventScroll:true})}catch(e){}}
$('modeFree').onclick=()=>{SFX.init();SFX.resume();titleStage('free')};
$('titleBack').onclick=()=>titleStage('modes');
$('startBtn').onclick=()=>{settings.play='free';try{localStorage.setItem('birding-settings',JSON.stringify(settings))}catch(e){}SFX.init();SFX.resume();const t=$('title');t.classList.add('out');document.body.classList.remove('on-title');setTimeout(()=>t.hidden=true,800);
  setTimeout(()=>AIRF.land?0:toast(S.arrivedFrom==='plane'?planeWelcome():S.arrived?(S.arrived==='British Isle'?'Welcome to the British Isle. Your DC-3 landed at Kingsport Airport, just north of town; island ferries leave from Port Ardan, the north coast and the south coast.':S.arrived==='Caribbean Isle'?'Welcome to the Caribbean Isle. You came ashore at Bahía Vieja pier; the island ferry runs from here to Este and Isla Cayo. The birds arrive in a later update.':S.arrived==='East Coast'&&S.arrivedFrom==='Caribbean ferry'?'Back on the East Coast at the ferry pier in Port Bostick, north of Bostick Pier.':S.arrived==='Pacific Isles'?'Welcome to the Pacific Isles. You came ashore at Harbor City pier on Harbor Isle; inter-island ferries leave from here, Garden Town, Cloud Bay and Sunset Bay. The birds arrive in a later update.':S.arrived==='West Coast'&&S.arrivedFrom==='Pacific ferry'?'Welcome back to the West Coast. The ferry docked at Port Madrone\'s terminal on the beach; the town is just east.':S.arrived==='West Coast'?'Welcome to the West Coast. Elk Pass is just down the road; Port Madrone is on the coast to the south-west. The birds arrive in a later update.':S.arrived==='Central'?'Welcome to the Central. Cottonwood is just west along Trail Rd; the birds arrive in a later update.':'Back on the East Coast at the Ridge Road trailhead.'):S.fastTo?`Fast traveled to ${S.fastTo} on the ${MAP_NAME} map.`:S.backAt?`Welcome back to ${S.backAt}. Your Defender is waiting on the nearest road.`:BRI?'Your Defender is parked in Kingsport. Hedgerows, moors, lochs and sea cliffs to explore; the birds arrive in a later update.':CAR?'Your Defender is parked in Bahía Vieja. The island ferry runs to Este and Isla Cayo; the birds arrive in a later update, so explore the map for now.':PAC?'Your Defender is parked in Harbor City on Harbor Isle. Ferries hop between the islands; the birds arrive in a later update, so explore the map for now.':WEST?'Your Defender is parked in Port Madrone. The West\'s birds arrive in a later update, so explore the map for now.':CENTRAL?'Your Defender is parked in Cottonwood. The Central\'s birds arrive in a later update, so explore the map for now'+(GPS.linked?'.':'.'):'Your Defender is parked by the beach road. Listen, then raise the binoculars'+(GPS.linked?(GPS.mode==='console'?' (A).':'.'):' (B).'),5),600)};
window.claude?.hot?.snapshot?.(()=>JSON.parse(JSON.stringify({v:1,mode:S.mode,player:S.player,car:S.car,birds:S.birds.map(b=>({x:b.x,y:b.y,z:b.z,st:b.st==='fly'?(b.sp==='pipl'?'ground':b.fly&&b.fly.next?b.fly.next.st:'perch'):b.st,tree:b.pending?b.pending.tree:b.tree,perch:b.pending?b.pending.perch:b.perch,hd:b.hd,home:b.home,logged:b.logged}))})));
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});
/* ---------- Pocket Arcade bridge (GP v1.1) ----------
   Does nothing until the arcade sends its first message, so the game still works on its own.
   D-pad moves (and looks around in an optic), A raises the current optic (A is the shutter with the camera up), B lowers it,
   B tap = use what's nearby (a "B" bubble shows over it) or pish, B held while walking = walk slowly,
   Select = switch gear, Start = field journal (with an Arcade tab), L/R = zoom (L opens the map when no optic is up).
   In menus the D-pad moves the highlight, A chooses, B goes back, L/R switch journal tabs. */
function gpSend(m){try{parent.postMessage(Object.assign({gp:1},m),'*')}catch(e){}}
function gpTopOverlay(){for(const id of['photoBack','foundBack','noteBack','mapBack','journal','title']){const el=$(id);if(el&&!el.hidden&&!el.classList.contains('out'))return id}return null}
function gpLabels(){const ov=gpTopOverlay();
  if(ov==='title')return $('titleFree').hidden?{a:'Choose',b:'',l:'',r:'',select:'',start:'Free Play'}:{a:'Choose',b:'Back',l:'',r:'',select:'',start:'Start'};
  if(ov==='mapBack')return{a:MAPUI.sel&&freePlay()?'Travel':'Pick',b:MAPUI.sheet!=='peek'?'Back':'Close',l:'Zoom out',r:'Zoom in',select:freePlay()?'Region':'',start:'Phone'};
  if(ov)return{a:'Choose',b:ov==='journal'&&(jDetail||jApp!=='home')?'Back':'Close',l:ov==='journal'?'Prev tab':ov==='mapBack'?'Close':'',r:ov==='journal'?'Next tab':'',select:'',start:ov==='journal'?'Close':'Journal'};
  const u=useTarget(),walk=S.mode==='walk',swim=walk&&S.player.water==='swim';
  const b=S.bino.on?'Lower':PLBL[u]?PLBL[u]:u==='travel'?'Travel':u==='exit'?'Get out':u==='drive'?'Drive':u==='board'?'Board':u==='land'?'Go ashore':walk&&!swim?'Pish · hold: sneak':'';
  return{a:S.bino.on?(S.gear==='cam'?'Shutter':'Lower'):(S.mode==='plane'&&S.boat&&S.boat.st!=='water')||swim||(S.mode==='boat'&&S.gear==='scope')?'':GEAR[S.gear].name,b,l:S.bino.on?(S.gear==='bino'?'':'Zoom out'):'Map',r:S.bino.on&&S.gear!=='bino'?'Zoom in':'',select:S.bino.on&&S.gear!=='bino'?'Zoom out':'Gear',start:S.bino.on&&S.gear!=='bino'?'Zoom in':'Phone'}}
function stackHud(on){let box=$('gpTop');const items=[document.querySelector('.topleft'),$('status'),$('toast')];
  if(on){if(box)return;box=document.createElement('div');box.id='gpTop';document.body.appendChild(box);
    for(const el of items){const mk=document.createComment('gp-spot');el.parentNode.insertBefore(mk,el);el._gpMark=mk}
    box.appendChild(items[0]);items[0].appendChild(items[1]);box.appendChild(items[2])}
  else{if(!box)return;for(const el of items){const mk=el._gpMark;if(mk&&mk.parentNode){mk.parentNode.insertBefore(el,mk);mk.remove()}el._gpMark=null}box.remove()}}
function gpMode(m){GPS.mode=m==='console'?'console':'fullscreen';document.body.classList.toggle('gp-console',GPS.mode==='console');stackHud(GPS.mode==='console');if(joy.active)joyEnd({pointerId:joy.id})}
function gpFocusables(root){return[...root.querySelectorAll('button,select,input,[tabindex="0"],a[href]')].filter(e=>!e.disabled&&e.getClientRects().length&&!e.closest('[hidden]'))}
function gpFocus(e){document.querySelectorAll('.gp-focus').forEach(x=>x.classList.remove('gp-focus'));if(!e)return;e.classList.add('gp-focus');try{e.focus({preventScroll:true})}catch(_){}e.scrollIntoView({block:'nearest',inline:'nearest'})}
function gpNav(dir){const id=gpTopOverlay();if(!id)return;const root=$(id),list=gpFocusables(root);if(!list.length)return;const cur=document.activeElement;
  if(!list.includes(cur)){gpFocus(id==='journal'?$('jTabs').querySelector('[aria-selected="true"]')||list[0]:list[0]);return}
  const dx=dir==='left'?-1:dir==='right'?1:0,dy=dir==='up'?-1:dir==='down'?1:0;
  if(dx&&cur.tagName==='SELECT'){cur.selectedIndex=clamp(cur.selectedIndex+dx,0,cur.options.length-1);cur.dispatchEvent(new Event('change',{bubbles:true}));return}
  if(dx&&cur.type==='range'){dx>0?cur.stepUp():cur.stepDown();cur.dispatchEvent(new Event('input',{bubbles:true}));cur.dispatchEvent(new Event('change',{bubbles:true}));return}
  const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,bs=1e9;
  for(const e of list){if(e===cur)continue;const q=e.getBoundingClientRect(),vx=q.left+q.width/2-cx,vy=q.top+q.height/2-cy,along=vx*dx+vy*dy;if(along<4)continue;const sc=along+(Math.abs(vx*dy)+Math.abs(vy*dx))*2.5;if(sc<bs){bs=sc;best=e}}
  if(best)gpFocus(best);else if(dy){const P=root.querySelector('#jPanel')||root;P.scrollBy({top:dy*140,behavior:'smooth'})}}
function gpClick(){const id=gpTopOverlay();if(!id)return;const root=$(id),list=gpFocusables(root),cur=document.activeElement;
  if(!list.includes(cur)){if(id==='foundBack')$('foundOk').click();else if(id==='title')($('titleFree').hidden?$('modeFree'):$('startBtn')).click();else gpFocus(id==='journal'?$('jTabs').querySelector('[aria-selected="true"]')||list[0]:list[0]);return}
  const idx=list.indexOf(cur),txt=cur.textContent;cur.click();
  setTimeout(()=>{const id2=gpTopOverlay();if(!id2)return;const L=gpFocusables($(id2));if(L.includes(cur)){gpFocus(cur);return}const m=L.find(e=>e.textContent===txt)||L[Math.min(idx,L.length-1)];if(m)gpFocus(m)},40)}
function gpBack(ov){if(ov==='title'){if(!$('titleFree').hidden)titleStage('modes');return}if(ov==='photoBack')closePhoto();else if(ov==='foundBack')closeFound();else if(ov==='noteBack')closeNote();else if(ov==='mapBack')mapBackStep();
  else if(ov==='journal'){const was=jApp;phoneBack();if(!$('journal').hidden)gpAfterOpen()}}
function gpTab(d){const tabs=[...$('jTabs').querySelectorAll('.tab:not(.arcade)')],i=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true'),nx=tabs[clamp(i+d,0,tabs.length-1)];if(nx&&nx!==tabs[i]){nx.click();gpAfterOpen()}}
function gpAfterOpen(){setTimeout(()=>{const ov=gpTopOverlay();if(!ov)return;const sel=ov==='journal'?$('jTabs').querySelector('[aria-selected="true"]'):null;gpFocus(sel||gpFocusables($(ov))[0])},30)}
function gpButton(id,down){
  if(id==='up'||id==='down'||id==='left'||id==='right'){if(down&&gpTopOverlay()){if(gpTopOverlay()==='mapBack')mapNav(id);else gpNav(id);return}if(down)GPS.dirs.add(id);else GPS.dirs.delete(id);return}
  if(!down){if(id==='b'&&GPS.b){const b=GPS.b;GPS.b=null;if(!b.used&&!b.sneaked&&performance.now()-b.t<320&&!gpTopOverlay())doPish()}return}
  SFX.init();SFX.resume();const ov=gpTopOverlay();
  if(ov){GPS.dirs.clear();
    if(id==='a'){if(ov==='mapBack'){if(MAPUI.sel)fastTravel(MAPUI.sel);else if(MAPL[mapSel])mapSelect(MAPL[mapSel].F);else mapNav('up')}else gpClick()}
    else if(id==='b')gpBack(ov);
    else if(id==='start'){if(ov==='title')($('titleFree').hidden?$('modeFree'):$('startBtn')).click();else if(ov==='journal')toggleJournal(false);else if(ov==='mapBack'){toggleMap(false);toggleJournal(true);gpAfterOpen()}}
    else if((id==='l'||id==='r')&&ov==='journal')gpTab(id==='l'?-1:1);
    else if(id==='select'&&ov==='mapBack'&&freePlay()){const i=RGN.findIndex(r=>r[0]===MAPR);mapSwitch(RGN[(i+1)%RGN.length][0])}else if((id==='l'||id==='r')&&ov==='mapBack')mapZoom(id==='r'?1:-1);
    return}
  if(S.bino.on&&S.gear!=='bino'&&(id==='start'||id==='select')){zoomBy(id==='start'?1:-1);return}
  if(id==='start'){toggleJournal(true);gpAfterOpen()}
  else if(id==='select')cycleGear();
  else if(id==='a'){if(S.bino.on&&S.gear==='cam')shutter();else toggleBino()}
  else if(id==='b'){GPS.b={t:performance.now(),used:false,sneaked:false};if(S.bino.on){toggleBino(false);GPS.b.used=true}else if(useTarget()){doUse();GPS.b.used=true}}
  else if(id==='l'){if(S.bino.on)zoomBy(-1);else{mapSel=-1;toggleMap(true);mapNav('up')}}
  else if(id==='r'){if(S.bino.on)zoomBy(1)}}
function gpReceive(m){if(!m||m.gp!==1)return;
  if(!GPS.linked){GPS.linked=true;document.body.classList.add('gp-linked');setInterval(()=>{const L=gpLabels(),j=JSON.stringify(L);if(j!==GPS.lab){GPS.lab=j;gpSend({type:'labels',buttons:L})}const bx=$('gpTop');if(bx)bx.style.visibility=gpTopOverlay()==='title'?'hidden':''},200);if(gpTopOverlay()==='title')gpFocus($('titleFree').hidden?$('modeFree'):$('startBtn'))}
  if(m.type==='hello'){const L=gpLabels();GPS.lab=JSON.stringify(L);gpSend({type:'ready',title:'Big Year',buttons:L,arcadeTab:true})}
  else if(m.type==='mode')gpMode(m.mode);
  else if(m.type==='button')gpButton(m.id,!!m.down);
  else if(m.type==='pause'){GPS.paused=!!m.paused;SFX.setOn(!GPS.paused&&settings.sound!==false);if(GPS.paused){GPS.dirs.clear();GPS.b=null;keys.clear()}}}
window.GP={receive:gpReceive,openArcade:()=>gpSend({type:'menu'})};
addEventListener('message',e=>{const m=e.data;if(m&&m.gp===1&&e.source!==window)gpReceive(m)});

/* ---------- fast travel (map) and saved progress ---------- */
let MAPL=[],mapSel=-1,mapWin=null,mapWinT=0;const MAPV={z:1,cx:WW/2,cy:WH/2,k:1,CW:0,H:0,Lg:null};
function renderMapWin(x0,y0,x1,y1,W,H){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),img=g.createImageData(W,H),d=img.data;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const x=x0+(i+.5)/W*(x1-x0),y=y0+(j+.5)/H*(y1-y0),o=(j*W+i)*4;if(x<0||y<0||x>WW||y>WH){d[o]=246;d[o+1]=241;d[o+2]=225;d[o+3]=255;continue}
    const col=groundColor(x,y),n=fbm(x/1700+11,y/1700+7),kk=(terr(x,y)===T.FLOOR&&n>.42)?.84:1;d[o]=col[0]*kk;d[o+1]=col[1]*kk;d[o+2]=col[2]*kk;d[o+3]=255}
  g.putImageData(img,0,0);return{c,x0,y0,x1,y1}}
function landSpot(x,y,max=4000){for(let r=0;r<max;r+=25)for(let a=0;a<TAU;a+=Math.max(.06,14/Math.max(r,1))){const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(px<660||px>WW-80||py<120||py>WH-120)continue;
  if(!waterKind(px,py)&&!waterAt(px,py,true)&&isLand(terr(px,py))&&!blockedAt(px,py,16))return[px,py]}return null}
function carSpot(x,y){const IS=ISLE?isleAt(x,y):'';for(let r=40;r<6000;r+=r<2000?20:50)for(let a=0;a<TAU;a+=r<2000?.25:.1){const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(ISLE&&isleAt(px,py)!==IS)continue;const rd=roadAt(px,py);if(rd&&rd.kind!=='boardwalk'&&!waterAt(px,py,false)&&!blockedAt(px,py,34))return[px,py]}
  if(ISLE)return null;   // islands without a road (the atoll, Bird Rock): the Defender waits where it is
  for(let r=60;r<2500;r+=25)for(let a=0;a<TAU;a+=.25){const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(!waterAt(px,py,false)&&!waterKind(px,py)&&!blockedAt(px,py,36))return[px,py]}return null}
function fastTravel(F){if(mpNoFast()){mpNoFastMsg();return}if(F&&F.mp){toggleMap(false);mpGoTo(F.x,F.y,F.region||MAP,F.name);return}if(!freePlay()){toast('No fast travel in Story mode. Use the trails, ferries and the floatplane.',2.6);return}if(S.mode==='plane'&&S.boat&&S.boat.st!=='water'){toast('Land the plane first.',2);return}if(F.region&&F.region!==MAP){goRegion(F);return}const sp=landSpot(F.x,F.y);if(!sp){toast('No way in there on foot.',2);return}
  if(S.bino.on)toggleBino(false);if(S.mode==='boat'||S.mode==='plane'){S.boat.v=0;S.mode='walk';S.boat=null;SFX.boat(null,0)}
  const cs=carSpot(sp[0],sp[1]),P=S.player;
  if(S.mode==='drive'){const c=cs||sp;S.car.x=c[0];S.car.y=c[1];S.car.v=0;P.x=c[0];P.y=c[1]}
  else{P.x=sp[0];P.y=sp[1];P.vx=P.vy=0;if(cs){S.car.x=cs[0];S.car.y=cs[1];S.car.v=0;S.car.ang=Math.atan2(sp[1]-cs[1],sp[0]-cs[0])}}
  const L=listener();S.cam.x=L.x;S.cam.y=L.y;mmAt=null;toggleMap(false);SFX.click();
  toast(S.mode==='drive'?`Drove to ${F.name}.`:cs?`Traveled to ${F.name}. Your Defender came along.`:`Traveled to ${F.name}.`,2.6);saveProgress()}
$('mapCanvas').addEventListener('click',e=>{if(e.currentTarget._dragged){e.currentTarget._dragged=false;return}const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  let hit=null,bd=1e9;for(const q of MAPL){if(x>=q.x&&x<=q.x+q.w&&y>=q.y&&y<=q.y+q.h){const d=Math.hypot(x-q.cx,y-q.cy);if(d<bd){bd=d;hit=q}}}
  if(hit){e.stopPropagation();mapSelect(hit.F)}else if(MAPUI.sheet!=='peek'){MAPUI.sheet='peek';MAPUI.sel=null;mapSel=-1;drawMap()}});
function mapNav(dir){if(!MAPL.length)return;if(mapSel<0||mapSel>=MAPL.length){const L=MAPR===MAP?listener():{x:MAPV.cx,y:MAPV.cy};let bd=1e18,bi=0;MAPL.forEach((q,i)=>{const d=Math.hypot(q.F.x-L.x,q.F.y-L.y);if(d<bd){bd=d;bi=i}});mapSelect(MAPL[bi].F);return}
  const c=MAPL[mapSel],dx=dir==='left'?-1:dir==='right'?1:0,dy=dir==='up'?-1:dir==='down'?1:0;let best=-1,bs=1e9;
  MAPL.forEach((q,i)=>{if(i===mapSel)return;const vx=q.cx-c.cx,vy=q.cy-c.cy,al=vx*dx+vy*dy;if(al<3)return;const sc=al+(Math.abs(vx*dy)+Math.abs(vy*dx))*2.2;if(sc<bs){bs=sc;best=i}});
  if(best>=0){const q=MAPL[best],Lg=MAPV.Lg;mapSelect(q.F);if(q.cx<40||q.cy<Lg.pad.t+20||q.cx>MAPV.CW-60||q.cy>MAPV.H-160)mapCenterOn(q.F.x,q.F.y)}}
// Progress (where you are, the Defender, the boats, the mini map zoom) is kept in localStorage as birding-progress-v1.
// Pocket Arcade copies that key, with the journal, kit and settings keys, into the player's account.
// Progress = the named map place nearest to where you were (localStorage birding-progress-v1). Pocket Arcade copies this key,
// with the journal (life list and log), kit and settings keys, into the player's account.
function nearestPlace(x,y){let best=null,bd=1e18;for(const F of FEATURES){const d=Math.hypot(F.x-x,F.y-y);if(d<bd){bd=d;best=F}}return best}
let TRAVELLING=false;
function saveProgress(){if(WIPED||TRAVELLING)return;try{const L=listener(),F=nearestPlace(L.x,L.y);if(F)localStorage.setItem('birding-progress-v1',JSON.stringify({v:2,at:Date.now(),map:MAP,place:F.name,wel:MSG.welRead?1:0}))}catch(e){}}
function loadProgress(){let d=null;try{const nx=sessionStorage.getItem('birding-progress-next');if(nx){sessionStorage.removeItem('birding-progress-next');const n=JSON.parse(nx);if(n&&Date.now()-(n.at||0)<600000)d=n}}catch(e){}try{if(!d)d=JSON.parse(localStorage.getItem('birding-progress-v1')||'null')}catch(e){}if(!d)return false;
  if((d.map||'east')!==MAP)return false;
  if(d.xy){const sp=landSpot(d.xy[0],d.xy[1]);if(sp){const cs=carSpot(sp[0],sp[1]);S.mode='walk';S.boat=null;Object.assign(S.player,{x:sp[0],y:sp[1],vx:0,vy:0});if(cs){S.car.x=cs[0];S.car.y=cs[1];S.car.v=0}S.backAt=null;S.fastTo=d.xyName||'your group';return true}}
  if(typeof d.arrive==='string'&&d.arrive.startsWith('plane:')&&planeArrive(d.arrive))return true;
  if(d.arrive&&AP&&d.arrive===AP.name){S.arrived=MAP_NAME;S.arrivedFrom=d.arrive;S.backAt=null;landDC3();return true}
  if(d.arrive){const A=d.arrive==='ridge'?TRAILS[0]:TRAILS.find(t=>t.name===d.arrive)||TRAILS[0],sp=A.land?landSpot(A.land[0],A.land[1]):landSpot(A.x+(A.dir||-1)*-160,A.y+40);if(!sp)return false;const cs=carSpot(sp[0],sp[1]);
    S.mode='walk';S.boat=null;Object.assign(S.player,{x:sp[0],y:sp[1],vx:0,vy:0});if(cs){S.car.x=cs[0];S.car.y=cs[1];S.car.v=0}S.backAt=null;S.arrived=MAP_NAME;S.arrivedFrom=d.arrive;return true}
  const F=d.v===2?FEATURES.find(f=>f.name===d.place):d.player&&isFinite(d.player.x)?nearestPlace(d.player.x,d.player.y):null;if(!F)return false;
  const sp=landSpot(F.x,F.y);if(!sp)return false;const cs=carSpot(sp[0],sp[1]),P=S.player;
  S.mode='walk';S.boat=null;Object.assign(P,{x:sp[0],y:sp[1],vx:0,vy:0});if(cs){S.car.x=cs[0];S.car.y=cs[1];S.car.v=0;S.car.ang=Math.atan2(sp[1]-cs[1],sp[0]-cs[0])}
  S.backAt=F.name;if(d.fast){S.backAt=null;S.fastTo=F.name;d.fast=0}return true}
setInterval(()=>{if($('title').hidden)saveProgress()},5000);
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&$('title').hidden)saveProgress()});addEventListener('pagehide',()=>{if($('title').hidden)saveProgress()});

/* ---------- season picker ---------- */
function seasonButtons(g){g.innerHTML='';for(const k of Object.keys(SEASON_INFO)){const b=document.createElement('button');b.type='button';b.className='sea';b.setAttribute('role','radio');b.setAttribute('aria-checked',k===SEASON);b.textContent=SEASON_INFO[k].name;b.onclick=()=>{applySeason(k);for(const o of g.children)o.setAttribute('aria-checked',o===b)};g.appendChild(b)}}
function updateSeasonUI(){$('titleSub').textContent=MAP_NAME+' · '+SZ().title+condLabel();{const l=$('lifeLbl');if(l)l.textContent=MAP_NAME}const g=$('titleWx');if(g)condButtons(g,'wx',WX_OPTS);document.querySelectorAll('.wxset').forEach(e=>condButtons(e,'wx',WX_OPTS))}
function applySeason(s){if(!SEASON_INFO[s]||s===SEASON)return;SEASON=s;settings.season=s;saveSettings();
  CELLS.clear();TREE_BY_ID.clear();TEX.clear();texReset();LEAFSPR.clear();SPRITED.length=0;for(const k in SWATCH)delete SWATCH[k];bigMap=null;mmAt=null;
  placeBirds();updateSeasonUI();if($('title').classList.contains('out'))toast(SZ().name+(s==='winter'?': snow in the north, lakes frozen':s==='fall'?': autumn colours':''),2.2)}
seasonButtons($('titleSeasons'));condButtons($('titleTod'),'tod',TOD_OPTS);updateSeasonUI();
/* ===== MP-1..MP-7 multiplayer (version 68) =====
   Rooms with a code, other birders on the map, pins, travel together, and room games (Birding Sprint, Rare Bird Hunt).
   NET carries the messages. Inside Pocket Arcade the arcade relays them to Supabase Realtime (owner's choice A: the game never
   touches the database). Opened on its own (a claude.ai artifact, or the folder in a browser), Big Year uses a test room shared
   between tabs of the same browser (BroadcastChannel), so two windows can play together for testing. */
const NET=(()=>{const N={kind:null,me:null,room:null,members:[],ready:null},on={};
  const emit=(t,m)=>{for(const f of on[t]||[])try{f(m)}catch(e){console.error(e)}};
  N.listen=(t,f)=>{(on[t]=on[t]||[]).push(f)};
  // ---- through Pocket Arcade (postMessage to the parent page; every message carries mp:1)
  let arc=false;const toArc=m=>{try{parent.postMessage({mp:1,...m},'*')}catch(e){}};
  addEventListener('message',e=>{const m=e.data;if(!m||m.mp!==1||window.parent===window||e.source!==window.parent)return;
    if(m.type==='hi'){if(!m.me){N.signedOut=true;return}arc=true;if(m.me)N.me=Object.assign(N.me||{},m.me);emit('hi',m)}
    else if(m.type==='joined'){if(m.me)N.me=Object.assign(N.me||{},m.me);emit('joined',m)}
    else if(m.type==='presence'){N.members=(m.members||[]).map(x=>({id:x.id,state:x.state||{}}));emit('presence',N.members)}
    else if(m.type==='msg'){if(m.from!==N.me.id)emit('msg',m)}
    else if(m.type==='error')emit('error',m)});
  // ---- test room on this device (BroadcastChannel between tabs)
  let bc=null,mine=null,peers={};
  const bcPost=m=>{try{bc&&bc.postMessage({...m,room:N.room,from:N.me.id})}catch(e){}};
  const syncLocal=()=>{N.members=[{id:N.me.id,state:mine||{}},...Object.values(peers).map(p=>({id:p.id,state:p.state}))];emit('presence',N.members)};
  function localStart(){if(bc)return;try{bc=new BroadcastChannel('bigyear-mp')}catch(e){bc=null;return}
    bc.onmessage=e=>{const m=e.data;if(!m||!N.room||m.room!==N.room||m.from===N.me.id)return;
      if(m.k==='pres'){const isNew=!peers[m.from];peers[m.from]={id:m.from,state:m.state||{},seen:Date.now()};if(isNew)bcPost({k:'pres',state:mine});syncLocal()}
      else if(m.k==='bye'){delete peers[m.from];syncLocal()}
      else if(m.k==='msg')emit('msg',{from:m.from,ev:m.ev,data:m.data})};
    setInterval(()=>{if(!N.room)return;bcPost({k:'pres',state:mine});const now=Date.now();let ch=false;for(const id in peers)if(now-peers[id].seen>8000){delete peers[id];ch=true}if(ch)syncLocal()},2500)}
  N.init=()=>{let id=null;try{id=sessionStorage.getItem('birding-mp-id')}catch(e){}if(!id){id='p'+Math.random().toString(36).slice(2,10);try{sessionStorage.setItem('birding-mp-id',id)}catch(e){}}   // one id per tab, kept through travel reloads
    N.me={id,name:settings.mpName||('Birder '+id.slice(-2).toUpperCase())};
    N.ready=new Promise(res=>{if(window.parent===window){N.kind='local';localStart();res('local');return}
      let done=false;N.listen('hi',()=>{if(!done){done=true;N.kind='arcade';res('arcade')}});toArc({type:'hello',game:'big-year'});
      setTimeout(()=>{if(!done){done=true;N.kind='local';localStart();res('local')}},1500)})};
  N.join=(room,state)=>{N.room=room;mine=state;if(N.kind==='arcade')toArc({type:'join',room,game:'big-year',state});else{peers={};bcPost({k:'pres',state});syncLocal()}};
  N.leave=()=>{if(N.kind==='arcade')toArc({type:'leave'});else bcPost({k:'bye'});N.room=null;N.members=[];peers={};emit('presence',[])};
  N.track=state=>{mine=state;if(!N.room)return;if(N.kind==='arcade')toArc({type:'track',state});else{bcPost({k:'pres',state});syncLocal()}};
  N.send=(ev,data)=>{if(!N.room)return;N.sent=(N.sent||0)+1;if(N.kind==='arcade')toArc({type:'send',ev,data});else bcPost({k:'msg',ev,data})};
  return N})();

const MP={room:null,joined:0,others:{},pins:[],game:null,opt:{target:10,mins:10},sentAt:0,last:null,known:new Set(),pending:null};
const MP_COLS=['#e8743b','#3b8ed8','#9b59d0','#d9a52a','#2fa39a','#d84a7a','#5aa84a','#c0503a'];
function mpCol(id){let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))|0;return MP_COLS[Math.abs(h)%MP_COLS.length]}
function mpCode(){const W=['OWL','JAY','WREN','KITE','TERN','RAIL','LARK','DOVE','HAWK','LOON','CROW','RUFF','SWAN','TEAL','COOT','SKUA'];return W[Math.floor(Math.random()*W.length)]+'-'+(10+Math.floor(Math.random()*90))}
function mpNorm(s){s=String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');const m=s.match(/^([A-Z]+)(\d+)$/);return m?m[1]+'-'+m[2]:s}
function mpPos(){if(S.mode==='airliner'&&AIRF.on)return{x:AIRF.x,y:AIRF.y,mode:'air',ang:AIRF.ang,alt:AIRF.alt};
  if(S.mode==='drive')return{x:S.car.x,y:S.car.y,mode:'drive',ang:S.car.ang};
  if((S.mode==='boat'||S.mode==='plane')&&S.boat)return{x:S.boat.x,y:S.boat.y,mode:S.mode,ang:S.boat.ang||0,craft:S.boat.craft,alt:S.boat.alt||0};
  return{x:S.player.x,y:S.player.y,mode:'walk',ang:S.player.face||0}}
function mpState(){const p=mpPos();return{name:NET.me.name,outfit:S.outfit,map:MAP,cfg:{map:MAP,season:SEASON,tod:settings.tod,wx:settings.wx},joined:MP.joined,x:Math.round(p.x),y:Math.round(p.y)}}
const mpSt=m=>m&&m.state||{};
function mpName(id){if(id===NET.me.id)return NET.me.name;const m=NET.members.find(x=>x.id===id);return mpSt(m).name||(MP.others[id]&&MP.others[id].name)||'A birder'}
function mpCount(){return Math.max(1,NET.members.length)}
function mpHostId(){const L=NET.members.slice().sort((a,b)=>((mpSt(a).joined||9e15)-(mpSt(b).joined||9e15))||String(a.id).localeCompare(String(b.id)));return L[0]&&L[0].id}
function mpSave(){try{if(MP.room){const G=MP.game?{...MP.game,found:[...MP.game.found]}:null;sessionStorage.setItem('birding-mp',JSON.stringify({room:MP.room,joined:MP.joined,at:Date.now(),game:G,pins:MP.pins}))}else sessionStorage.removeItem('birding-mp')}catch(e){}}
function mpSession(){try{const s=JSON.parse(sessionStorage.getItem('birding-mp')||'null');return s&&s.room&&Date.now()-s.at<30*60e3?s:null}catch(e){return null}}
function mpDist(x,y){const p=mpPos(),d=Math.hypot(x-p.x,y-p.y)/10,a=Math.atan2(x-p.x,-(y-p.y)),dir=['north','north-east','east','south-east','south','south-west','west','north-west'][Math.round(((a+TAU)%TAU)/(TAU/8))%8];
  return(d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(d<10000?1:0)+' km')+' '+dir}

/* MP-3 the banner across the top of everyone's screen, and the game pill under it */
const mpCSS=document.createElement('style');mpCSS.textContent=`
#mpBanner{position:fixed;left:50%;top:10px;transform:translate(-50%,-140%);z-index:40;width:min(560px,calc(100vw - 24px));background:rgba(24,36,30,.94);color:#fff3cf;border:2px solid #f5c542;border-radius:18px;padding:12px 16px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:500 15px/1.35 var(--font-ui,system-ui);transition:transform .35s cubic-bezier(.2,.9,.3,1.2);pointer-events:auto}
#mpBanner.on{transform:translate(-50%,0)}#mpBanner b{display:block;font:700 13px var(--font-ui,system-ui);letter-spacing:.12em;text-transform:uppercase;color:#f5c542;margin-bottom:3px}
#mpBanner .mpbb{display:flex;gap:8px;margin-top:9px;flex-wrap:wrap}#mpBanner button{border:0;border-radius:999px;padding:8px 14px;font:700 14px var(--font-ui,system-ui);background:#f5c542;color:#2a2205;cursor:pointer}#mpBanner button.g{background:rgba(255,243,207,.16);color:#fff3cf}
#mpHud{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:5;background:rgba(24,36,30,.88);color:#fff;border-radius:999px;padding:7px 16px;font:700 15px var(--font-ui,system-ui);display:none;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.25)}
#mpHud i{font-style:normal;color:#f5c542}body.mp-banner #mpHud{top:130px}
.mpapp{display:flex;flex-direction:column;gap:12px;padding:4px 2px 16px}.mpcard{background:#fff;border-radius:16px;padding:12px 14px;box-shadow:0 1px 0 rgba(0,0,0,.06)}.mpcard h4{margin:0 0 6px;font:700 13px var(--font-ui,system-ui);letter-spacing:.08em;text-transform:uppercase;color:#6b6f66}
.mpcode{font:800 30px/1 var(--font-ui,system-ui);letter-spacing:.06em;color:#1f3a2c}.mpvia{font-size:13px;color:#6b6f66;margin-top:4px}
.mpp{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid #eee}.mpp:first-of-type{border-top:0}.mpdot{width:14px;height:14px;border-radius:50%;flex:none}.mpp .nm{flex:1;font-weight:700}.mpp .nm small{display:block;font-weight:500;color:#6b6f66}
.mpbtn{border:0;border-radius:999px;padding:8px 14px;font:700 14px var(--font-ui,system-ui);background:#1f6b45;color:#fff;cursor:pointer}.mpbtn.g{background:#e9ece6;color:#1f3a2c}.mpbtn:disabled{opacity:.45}
.mprow{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px}.mpopt{border:2px solid #d8dcd2;background:#fff;border-radius:999px;padding:5px 11px;font:700 13px var(--font-ui,system-ui);color:#1f3a2c;cursor:pointer}.mpopt[aria-pressed=true]{border-color:#1f6b45;background:#e3f1e8}
.mpgame{border-top:1px solid #eee;padding-top:10px;margin-top:10px}.mpgame:first-of-type{border-top:0;margin-top:0;padding-top:0}.mpgame b{font-size:16px}.mpgame p{margin:3px 0 0;font-size:13px;color:#555}
.mpname{border:2px solid #d8dcd2;border-radius:10px;padding:6px 10px;font:600 15px var(--font-ui,system-ui);width:150px}
.app .ic .badge.mpb{background:#1f6b45}
#titleMulti .mpt{display:flex;flex-direction:column;gap:10px;align-items:center;margin:14px 0 4px;width:min(420px,92vw)}
#titleMulti .mpvia2{font:500 14px/1.4 var(--font-ui);color:#d9ead9;text-align:center;max-width:420px}
#titleMulti .mpline{display:flex;gap:10px;width:100%;justify-content:center}
#titleMulti input{flex:1;min-width:0;border-radius:14px;border:2px solid rgba(255,243,207,.6);background:rgba(16,38,28,.55);color:#fff3cf;font:700 20px var(--font-ui);padding:12px 14px;letter-spacing:.06em;text-transform:uppercase}
#titleMulti input::placeholder{color:rgba(255,243,207,.5);letter-spacing:0;text-transform:none;font-weight:500;font-size:16px}
#titleMulti .mpmsg{min-height:20px;font:600 14px var(--font-ui);color:#f5c542;text-align:center}
#titleMulti .mpwide{width:100%}`;document.head.appendChild(mpCSS);
const mpB=document.createElement('div');mpB.id='mpBanner';mpB.setAttribute('role','status');document.body.appendChild(mpB);
const mpH=document.createElement('div');mpH.id='mpHud';document.body.appendChild(mpH);
let mpBT=null;
function mpBanner(head,text,btns=[],sec=7){mpB.innerHTML=`<b>${esc(head)}</b>${esc(text)}`;if(btns.length){const R=document.createElement('div');R.className='mpbb';
    for(const [l,f,g] of btns){const b=document.createElement('button');b.textContent=l;if(g)b.className='g';b.onclick=()=>{mpBHide();f&&f()};R.appendChild(b)}mpB.appendChild(R)}
  mpB.classList.add('on');document.body.classList.add('mp-banner');clearTimeout(mpBT);mpBT=setTimeout(mpBHide,sec*1000);try{SFX.chime&&SFX.chime()}catch(e){}}
function mpBHide(){mpB.classList.remove('on');document.body.classList.remove('mp-banner')}

/* MP-1 joining, leaving and the room's presence */
function mpEnter(room,joined,ses){MP.room=room;MP.joined=joined||Date.now();if(ses){if(ses.game&&ses.game.live){MP.game={...ses.game,found:new Set(ses.game.found||[])};if(MP.game.kind==='hunt'&&MP.game.map===MAP)mpForce(MP.game.sp)}MP.pins=(ses.pins||[]).filter(p=>Date.now()-p.at<15*60e3)}
  NET.join(room,mpState());mpSave();document.body.classList.add('mp-on');MP.sentAt=0;MP.last=null}
function mpLeave(){NET.leave();MP.room=null;MP.others={};MP.pins=[];MP.game=null;MP.known.clear();mpSave();document.body.classList.remove('mp-on');mpH.style.display='none';toast('You left the room.',2.4);if(!$('journal').hidden){jApp='home';renderJournal()}}
NET.listen('error',m=>mpBanner('Multiplayer',m.message||'Something went wrong with the room.',[['OK',null,1]],8));
NET.listen('presence',L=>{if(!MP.room)return;const ids=new Set(L.map(m=>m.id));
  for(const m of L)if(m.id!==NET.me.id&&!MP.known.has(m.id)){MP.known.add(m.id);if(MP.ready)mpBanner('Room '+MP.room,`${mpSt(m).name||'A birder'} joined the room${mpSt(m).map&&mpSt(m).map!==MAP?' on the '+RNAME[mpSt(m).map]:''}.`,[],5);MP.sentAt=0;MP.last=null}
  for(const id of[...MP.known])if(!ids.has(id)){MP.known.delete(id);if(MP.ready)toast(`${(MP.others[id]&&MP.others[id].name)||'A birder'} left the room.`,2.6);delete MP.others[id]}
  MP.ready=true;if(!$('journal').hidden&&(jApp==='home'||jApp==='games'))renderJournal()});

/* MP-4 position updates, sent less often when nobody is near or you aren't moving */
function mpTick(dt){if(!MP.room)return;const k=Math.min(1,dt*5),now=performance.now()/1000;
  for(const id in MP.others){const R=MP.others[id];if(R.tx==null)continue;R.mv=Math.hypot(R.tx-R.x,R.ty-R.y)>1.5;R.x+=(R.tx-R.x)*k;R.y+=(R.ty-R.y)*k;if(R.mv&&R.mode==='walk')R.walk=(R.walk||0)+dt*9}
  MP.pins=MP.pins.filter(p=>Date.now()-p.at<15*60e3);mpGameTick();
  if(NET.members.length<2)return;const p=mpPos(),L=MP.last;let near=1e9;for(const id in MP.others){const R=MP.others[id];if(R.map===MAP)near=Math.min(near,Math.hypot(R.x-p.x,R.y-p.y))}
  const moved=!L||L.map!==MAP||Math.hypot(p.x-L.x,p.y-L.y)>12||p.mode!==L.mode||Math.abs((p.alt||0)-(L.alt||0))>.04;
  const gap=!moved?6:near<3000?.25:near<12000?1:4;MP.gap=gap;if(now-MP.sentAt<gap)return;MP.sentAt=now;MP.last={...p,map:MAP};
  NET.send('pos',{x:Math.round(p.x),y:Math.round(p.y),mode:p.mode,ang:+(+p.ang||0).toFixed(2),alt:+(+p.alt||0).toFixed(2),craft:p.craft,map:MAP,o:S.outfit,p:S.paint||'coniston',c:S.mode==='drive'?null:[Math.round(S.car.x),Math.round(S.car.y),+(+S.car.ang||0).toFixed(2)]});
  if(now-(MP.savedAt||0)>15){MP.savedAt=now;mpSave()}if(now-(MP.trackAt||0)>60){MP.trackAt=now;NET.track(mpState())}}
NET.listen('msg',m=>{if(!MP.room)return;const d=m.data||{},who=mpName(m.from);
  if(m.ev==='pos'){let R=MP.others[m.from];if(!R)R=MP.others[m.from]={id:m.from,x:d.x,y:d.y};
    if(R.map!==d.map||Math.hypot(R.x-d.x,R.y-d.y)>4000){R.x=d.x;R.y=d.y}Object.assign(R,{tx:d.x,ty:d.y,mode:d.mode,ang:d.ang,alt:d.alt||0,craft:d.craft,map:d.map,outfit:d.o,paint:d.p,car:d.c||null,at:Date.now(),name:who});return}
  if(m.ev==='pin'){MP.pins.push(d);mpSave();if(d.map===MAP)mpBanner(`${d.by||who} dropped a pin`,`“${d.label}” · ${mpDist(d.x,d.y)} of you.`,[['Go there',()=>mpGoTo(d.x,d.y,d.map,d.label)],['OK',null,1]],9);
    else mpBanner(`${d.by||who} dropped a pin`,`“${d.label}” on the ${RNAME[d.map]}.`,[['Go there',()=>mpGoTo(d.x,d.y,d.map,d.label)],['OK',null,1]],9);return}
  if(m.ev==='travel'){if(d.map!==MAP)mpBanner('Travel together',`${who} is ${d.how||'heading'} to ${d.place?d.place+' on ':''}the ${RNAME[d.map]}.`,[['Follow',()=>mpFollow(d)],['Stay here',null,1]],14);return}
  if(m.ev==='game'){mpGameStart(d,m.from);return}
  if(m.ev==='score'){const G=MP.game;if(G&&G.gid===d.gid){G.scores[m.from]=d.n;mpHudDraw()}return}
  if(m.ev==='won'){const G=MP.game;if(G&&G.gid===d.gid&&G.live)mpGameEnd(m.from);return}
  if(m.ev==='sitout'){const G=MP.game;if(G&&G.gid===d.gid){G.out=G.out||[];G.out.push(m.from)}return}});

/* MP-5 drawing other birders, their vehicles and the pins */
function mpDrawItems(items,vis,t){if(!MP.room)return;const now=Date.now();
  for(const id in MP.others){const R=MP.others[id];if(R.map!==MAP||now-R.at>90000||!vis(R.x,R.y,500))continue;
    const air=(R.mode==='air'||R.mode==='plane')&&R.alt>.05;items.push({y:air?1e9:R.y+(R.mode==='drive'?18:0),f:()=>{try{mpDrawOne(R,t)}catch(e){}
      const lift=R.mode==='air'?R.alt*160+70:R.mode==='plane'?R.alt*ALT_PX+60:R.mode==='drive'?52:R.mode==='boat'?44:62;namePill(R.x,R.y-lift,R.name,mpCol(R.id))}})}
  for(const id in MP.others){const R=MP.others[id];if(R.map!==MAP||R.mode==='drive'||!R.car||now-R.at>90000)continue;let [x,y,a]=R.car;if(Math.hypot(x-S.car.x,y-S.car.y)<70)x+=95;   // parked side by side, not on top of yours
    if(vis(x,y,300))items.push({y:y+18,f:()=>drawCar(mpCarOf(R,x,y,a),t)})}
  for(const P of MP.pins)if(P.map===MAP&&vis(P.x,P.y,300))items.push({y:P.y,f:()=>mpDrawPin(P,t)})}
// each birder has their own Defender, in their own paint; if a friend picked the same paint as you, theirs is shown in another colour
function mpPaint(R){const mine=S.paint||'coniston';if(R.paint&&R.paint!==mine&&PAINTS[R.paint])return R.paint;const K=Object.keys(PAINTS).filter(k=>k!==mine);let h=0;for(const c of String(R.id))h=(h*31+c.charCodeAt(0))|0;return K[Math.abs(h)%K.length]}
function mpCarOf(R,x,y,ang){R.carObj=Object.assign(R.carObj||{},S.car,{x,y,ang,v:0,lights:false,paint:mpPaint(R)});return R.carObj}
function mpDrawOne(R,t){if(R.mode==='drive'){drawCar(mpCarOf(R,R.x,R.y,R.ang),t);return}
  if(R.mode==='air'){drawDC3({x:R.x,y:R.y,ang:R.ang,alt:R.alt,prop:1,spin:t*30},t);return}
  if(R.mode==='plane'||R.mode==='boat'){const B=BOATS.find(b=>b.craft===R.craft)||BOATS.find(b=>b.craft===(R.mode==='plane'?'plane':'canoe'));if(B){drawBoat(Object.assign({},B,{x:R.x,y:R.y,ang:R.ang,alt:R.alt,rpm:R.alt>0?1:0}),t);return}}
  drawBirder({x:R.x,y:R.y,face:R.ang,walk:R.walk||0,moving:!!R.mv,vx:0,vy:0,glass:false,look:0,sneak:false},t,R.outfit)}
function mpDrawPin(P,t){const c=ctx,col=mpCol(P.byId),w=Math.sin(t*3+P.x)*4;c.save();c.translate(P.x,P.y);c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(4,2,12,5,0,0,TAU);c.fill();
  c.strokeStyle='#4a4a46';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(0,-64);c.stroke();c.fillStyle=col;c.beginPath();c.moveTo(1,-64);c.quadraticCurveTo(20,-60+w*.3,38,-56+w);c.quadraticCurveTo(20,-50,1,-46);c.closePath();c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(0,-66,4,0,TAU);c.fill();c.restore();namePill(P.x,P.y-84,`${P.by}: ${P.label}`,col)}
function mpMini(g,L,k){if(!MP.room)return;for(const P of MP.pins){if(P.map!==MAP)continue;const x=70+(P.x-L.x)*k,y=70+(P.y-L.y)*k;if(Math.hypot(x-70,y-70)>56)continue;g.fillStyle=mpCol(P.byId);g.beginPath();g.moveTo(x,y);g.lineTo(x-4,y-8);g.lineTo(x+4,y-8);g.closePath();g.fill()}
  for(const id in MP.others){const R=MP.others[id];if(R.map!==MAP)continue;let x=70+(R.x-L.x)*k,y=70+(R.y-L.y)*k;const d=Math.hypot(x-70,y-70);if(d>54){x=70+(x-70)/d*54;y=70+(y-70)/d*54}
    g.fillStyle='#fff';g.beginPath();g.arc(x,y,4.6,0,TAU);g.fill();g.fillStyle=mpCol(R.id);g.beginPath();g.arc(x,y,3.2,0,TAU);g.fill()}}

/* MP-6 pins, going to someone, and travelling together */
function mpDropPin(label,x,y){const p=mpPos(),P={id:NET.me.id+'-'+Date.now(),x:Math.round(x??p.x),y:Math.round(y??p.y),map:MAP,label,by:NET.me.name,byId:NET.me.id,at:Date.now()};
  const mine=MP.pins.filter(q=>q.byId===NET.me.id);if(mine.length>=3)MP.pins=MP.pins.filter(q=>q!==mine[0]);   // up to 3 pins each; the oldest goes
  MP.pins.push(P);NET.send('pin',P);mpSave();toast(`Pin dropped: “${label}”. Everyone in the room can see it.`,2.6)}
function mpGoTo(x,y,map,name){if(mpNoFast()){mpNoFastMsg();return}if(S.mode==='airliner'){toast('Wait until the plane has landed.',2);return}
  if(map===MAP){toggleJournal(false);fastTravel({name:name||'your group',x:x+40,y:y+40});return}
  mpTravelOut(map,null,null,name);try{travelNote(JSON.stringify({v:2,at:Date.now(),map,xy:[x+40,y+40],xyName:name||'your group',wel:MSG.welRead?1:0}))}catch(e){}
  settings.map=map;try{localStorage.setItem('birding-settings',JSON.stringify(settings))}catch(e){}travelCard(RNAME[map]);mpSave();setTimeout(()=>location.reload(),350)}
function mpTravelOut(map,arrive,xy,place){if(!MP.room||map===MAP)return;const air=arrive&&Object.values(AIRPORTS).some(a=>a.name===arrive);
  NET.send('travel',{map,arrive:arrive||null,xy:xy||null,place:place||(air?arrive:/ferry|pier/i.test(arrive||'')?arrive:null),how:air?'flying':/ferry|pier/i.test(arrive||'')?'sailing':'heading'});mpSave()}
function mpFollow(d){if(mpNoFast()){mpNoFastMsg();return}if(d.arrive)goMap(d.map,d.arrive);else{const R=Object.values(MP.others).find(r=>r.map===d.map);const xy=d.xy||(R?[R.x,R.y]:null);if(xy)mpGoTo(xy[0],xy[1],d.map,d.place);else goMap(d.map,null)}}
function travelCard(name){TRAVELLING=true;const c=document.createElement('div');c.style.cssText='position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:#1f3a2c;color:#f4f1e6;font:600 22px/1.3 Fredoka,system-ui,sans-serif;text-align:center';
  c.innerHTML=`<div><div style="font-size:14px;letter-spacing:.14em;text-transform:uppercase;opacity:.7">Big Year</div>Travelling to ${esc(name)}…</div>`;document.body.appendChild(c)}

/* MP-7 room games: Birding Sprint and Rare Bird Hunt */
const mpFmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function mpPickRare(){const ok=id=>COND.sp[id]&&condP(id)>0&&S.birds.some(b=>b.sp===id)&&SPECIES[id];
  const all=Object.keys(COND.sp).filter(ok),rare=all.filter(id=>/rare/i.test(COND.sp[id].ab||'')),unc=all.filter(id=>COND.sp[id].ab==='Uncommon');
  const L=rare.length?rare:unc;return L.length?L[Math.floor(Math.random()*L.length)]:null}
let condP_base=null;
function mpForce(sp){if(!condP_base){condP_base=condP;condP=s=>MP.game&&MP.game.live&&MP.game.kind==='hunt'&&s===MP.game.sp&&MP.game.map===MAP?1:condP_base(s)}
  for(const b of S.birds)if(b.sp===sp){b.out=true;b.reAt=S.t+1e6}}
function mpStartGame(kind){if(MP.game&&MP.game.live){toast('A game is already running.',2);return}if(NET.members.length<2){toast('Wait for someone to join the room first.',2.6);return}
  const G={gid:NET.me.id+'-'+Date.now(),kind,by:NET.me.name,byId:NET.me.id,in:10,map:MAP};
  if(kind==='sprint'){G.target=MP.opt.target;G.mins=MP.opt.mins}
  else{const sp=mpPickRare();if(!sp){toast('No rare birds are out on this map this season. Try another season or map.',3);return}G.sp=sp;G.mins=20}
  NET.send('game',G);mpGameStart(G,NET.me.id)}
function mpGameStart(G,from){const now=Date.now();MP.game={...G,start:now+G.in*1000,end:now+(G.in+G.mins*60)*1000,scores:{},found:new Set(),live:true};
  const who=from===NET.me.id?'You':G.by;
  if(G.kind==='sprint')mpBanner(`${G.kind==='sprint'?'Birding Sprint':''} starts in ${G.in} s`,`${who} started a game: find ${G.target} species in ${G.mins} minutes. Every species you identify counts, even ones already on your life list. No fast travel until it ends.`,from===NET.me.id?[]:[['Sit out',mpSitOut,1]],G.in);
  else{const D=SPECIES[G.sp];mpForce(G.sp);mpBanner(`Rare Bird Hunt starts in ${G.in} s`,`${who} started a hunt: be the first to find a ${D.name} on the ${RNAME[G.map]}. No clues: check the Field Guide. No fast travel until it ends.`,[['Field Guide',()=>{openApp('guide');jDetail=G.sp;renderJournal()}],...(from===NET.me.id?[]:[['Sit out',mpSitOut,1]])],G.in+4)}
  mpSave();mpHudDraw()}
function mpSitOut(){const G=MP.game;if(!G)return;G.me_out=true;NET.send('sitout',{gid:G.gid});mpH.style.display='none';toast('You are sitting this one out.',2.4)}
function mpOnLog(sp){const G=MP.game;if(!G||!G.live||G.me_out||Date.now()<G.start)return;
  if(G.kind==='sprint'){if(G.found.has(sp))return;G.found.add(sp);const n=G.found.size;G.scores[NET.me.id]=n;NET.send('score',{gid:G.gid,n});mpHudDraw();
    if(n>=G.target){NET.send('won',{gid:G.gid});mpGameEnd(NET.me.id)}else toast(`Sprint: ${n} of ${G.target} species`,2);mpSave()}
  else if(sp===G.sp){NET.send('won',{gid:G.gid});mpGameEnd(NET.me.id)}}
function mpGameTick(){const G=MP.game;if(!G||!G.live)return;if(Date.now()>=G.end)mpGameEnd(null);else mpHudDraw()}
function mpHudDraw(){const G=MP.game;if(!G||!G.live||G.me_out){mpH.style.display='none';return}const now=Date.now();
  if(now<G.start){mpH.style.display='block';mpH.innerHTML=`${G.kind==='sprint'?'Birding Sprint':'Rare Bird Hunt'} starts in <i>${Math.ceil((G.start-now)/1000)}</i>`;return}
  const left=mpFmt((G.end-now)/1000);mpH.style.display='block';
  if(G.kind==='sprint'){let best=null,bn=-1;for(const id in G.scores)if(id!==NET.me.id&&G.scores[id]>bn){bn=G.scores[id];best=id}
    mpH.innerHTML=`Sprint <i>${left}</i> · You ${G.found.size}/${G.target}${best?` · ${esc(mpName(best))} ${bn}`:''}`}
  else mpH.innerHTML=`Hunt <i>${left}</i> · Find: ${esc(SPECIES[G.sp].name)}${G.map!==MAP?' · on the '+RNAME[G.map]:''}`}
function mpGameEnd(winner){const G=MP.game;if(!G||!G.live)return;G.live=false;mpH.style.display='none';mpSave();
  const nm=G.kind==='sprint'?'Birding Sprint':'Rare Bird Hunt',me=winner===NET.me.id;
  if(G.kind==='sprint'){G.scores[NET.me.id]=G.found.size;const ids=new Set([...NET.members.map(m=>m.id),...Object.keys(G.scores)]);
    const rows=[...ids].map(id=>[id,G.scores[id]||0]).sort((a,b)=>(b[0]===winner)-(a[0]===winner)||b[1]-a[1]);const top=winner||(rows[0]&&rows[0][1]>0?rows[0][0]:null);
    const tie=!winner&&rows.length>1&&rows[0][1]===rows[1][1]&&rows[0][1]>0;
    openNote(nm,top?(tie?'A tie!':top===NET.me.id?'You won!':`${mpName(top)} won`):'Time is up',(winner?`${winner===NET.me.id?'You':mpName(winner)} found ${G.target} species first. `:'Time is up. ')+rows.map(([id,n],i)=>`${i+1}. ${id===NET.me.id?'You':mpName(id)}: ${n}`).join(' · '),[['Keep birding',null,true]])}
  else{const D=SPECIES[G.sp];openNote(nm,winner?(me?'You found it!':`${mpName(winner)} found it`):'Nobody found it',winner?`${me?'You were':mpName(winner)+' was'} first to find the ${D.name}.`:`The ${D.name} got away this time.`,[['Keep birding',null,true],['Field Guide',()=>{openApp('guide');jDetail=G.sp;renderJournal()}]])}
  if(winner&&!me)SFX.click&&SFX.click()}

/* MP-2 the Games app on the phone (multiplayer only): the room, who's in it, pins and the room games */
APP_IC.games='<svg viewBox="0 0 40 40"><rect x="5" y="12" width="30" height="18" rx="9" fill="#fff"/><path d="M13 17v8M9 21h8" stroke="#d9482b" stroke-width="2.6" stroke-linecap="round"/><circle cx="26" cy="19" r="2.2" fill="#d9482b"/><circle cx="30" cy="23.5" r="2.2" fill="#d9482b"/><circle cx="31" cy="9" r="5" fill="#f5c542"/></svg>';
function mpRender(P){const W=document.createElement('div');W.className='mpapp';P.appendChild(W);const L=NET.members.length?NET.members:[{id:NET.me.id,state:mpState()}];
  const via=NET.kind==='arcade'?'Connected through Pocket Arcade':'Test room on this device: open Big Year in another tab or window to join it';
  W.insertAdjacentHTML('beforeend',`<div class="mpcard"><h4>Room</h4><div class="mpcode">${MP.room}</div><div class="mpvia">${via}. Friends join with this code from Multiplayer on the start screen.</div></div>`);
  const pc=document.createElement('div');pc.className='mpcard';pc.innerHTML=`<h4>In this room (${L.length})</h4>`;
  for(const m of L){const id=m.id,me=id===NET.me.id,R=MP.others[id],st=mpSt(m),map=me?MAP:(R&&R.map)||st.map,where=map===MAP?(me?'You · '+RNAME[MAP]:R?mpDist(R.x,R.y):RNAME[map]):'On the '+(RNAME[map]||'way');
    const row=document.createElement('div');row.className='mpp';row.innerHTML=`<span class="mpdot" style="background:${mpCol(id)}"></span><span class="nm">${esc(me?NET.me.name+' (you)':st.name||'A birder')}<small>${esc(where)}${id===mpHostId()?' · started the room':''}</small></span>`;
    if(!me){const b=document.createElement('button');b.className='mpbtn g';b.textContent='Go to';b.onclick=()=>{const x=R?R.x:st.x,y=R?R.y:st.y;if(x==null){toast('Waiting for their position.',2);return}mpGoTo(x,y,map,st.name)};row.appendChild(b)}
    pc.appendChild(row)}
  if(NET.kind!=='arcade'){const r=document.createElement('div');r.className='mprow';r.innerHTML='<span style="font-size:13px;color:#555">Your name</span>';const i=document.createElement('input');i.className='mpname';i.value=NET.me.name;i.maxLength=16;
    i.onchange=()=>{const v=i.value.trim().slice(0,16);if(!v)return;NET.me.name=settings.mpName=v;saveSettings();NET.track(mpState())};r.appendChild(i);pc.appendChild(r)}
  W.appendChild(pc);
  const pin=document.createElement('div');pin.className='mpcard';pin.innerHTML='<h4>Drop a pin where you stand</h4><p style="margin:-2px 0 4px;font-size:12px;color:#6b6f66">Quicker: press and hold anywhere on the map for half a second, or press T.</p>';const pr=document.createElement('div');pr.className='mprow';
  for(const l of['Bird here!','Meet here','Rare bird!']){const b=document.createElement('button');b.className='mpbtn';b.textContent=l;b.onclick=()=>{mpDropPin(l);toggleJournal(false)};pr.appendChild(b)}pin.appendChild(pr);W.appendChild(pin);
  const gc=document.createElement('div');gc.className='mpcard';gc.innerHTML='<h4>Games</h4>';const G=MP.game,live=G&&G.live;
  const add=(title,txt,extra,kind)=>{const d=document.createElement('div');d.className='mpgame';d.innerHTML=`<b>${title}</b><p>${txt}</p>`;if(extra)d.appendChild(extra);
    if(kind){const r=document.createElement('div');r.className='mprow';const b=document.createElement('button');b.className='mpbtn';b.textContent=live&&G.kind===kind?'Running…':'Start for everyone';b.disabled=!!live||L.length<2;b.onclick=()=>{mpStartGame(kind);toggleJournal(false)};r.appendChild(b);
      if(L.length<2){const s=document.createElement('span');s.style.cssText='font-size:12px;color:#6b6f66';s.textContent='Needs at least 2 players';r.appendChild(s)}d.appendChild(r)}gc.appendChild(d)};
  add('Birding together','Always on: see each other on the map, drop pins and travel together. When someone takes a ferry or a flight you can follow them.');
  const opts=document.createElement('div');const row=(lab,key,vals,fmt)=>{const r=document.createElement('div');r.className='mprow';r.innerHTML=`<span style="font-size:13px;color:#555;width:62px">${lab}</span>`;
    for(const v of vals){const b=document.createElement('button');b.className='mpopt';b.textContent=fmt(v);b.setAttribute('aria-pressed',MP.opt[key]===v);b.onclick=()=>{MP.opt[key]=v;renderJournal()};r.appendChild(b)}opts.appendChild(r)};
  row('Find','target',[5,10,15,20],v=>v+' species');row('Within','mins',[5,10,15,20],v=>v+' min');
  add('Birding Sprint',`First to identify ${MP.opt.target} different species in ${MP.opt.mins} minutes wins. If time runs out, the most species wins.`,opts,'sprint');
  add('Rare Bird Hunt','The game picks a rare bird on this map for this season. No clues on where it is: read its Field Guide page, work out its habitat and range, then go and find it. First to identify it wins (20 minutes).',null,'hunt');
  if(live)gc.insertAdjacentHTML('afterbegin',`<p style="margin:0 0 8px;font-weight:700;color:#d9482b">${G.kind==='sprint'?'Birding Sprint':'Rare Bird Hunt'} running · ${mpFmt((G.end-Date.now())/1000)} left</p>`);
  W.appendChild(gc);
  const lv=document.createElement('button');lv.className='mpbtn g';lv.style.alignSelf='center';lv.textContent='Leave room';lv.onclick=mpLeave;W.appendChild(lv)}

/* MP-1 the start screen: Multiplayer → create a room or join one */
function mpCreate(){const code=mpCode();mpEnter(code,Date.now());setTimeout(()=>mpBanner('Room '+code,`Your room is open. Friends join with the code ${code} from Multiplayer on the start screen. Open Games on your phone to see who's here.`,[['OK',null,1]],10),1200)}
function mpJoin(code){code=mpNorm(code);const msg=$('mpMsg');if(!/^[A-Z]{2,5}-\d{2}$/.test(code)){msg.textContent='Room codes look like OWL-42.';return}
  msg.textContent=`Looking for room ${code}…`;MP.room=code;MP.joined=Date.now();NET.join(code,{...mpState(),joining:1});let done=false;
  const look=L=>{if(done)return;const H=L.filter(m=>m.id!==NET.me.id&&mpSt(m).cfg&&!mpSt(m).joining).sort((a,b)=>(mpSt(a).joined||0)-(mpSt(b).joined||0))[0];if(!H)return;done=true;
    const s=mpSt(H),c=s.cfg;msg.textContent=`Found ${s.name||'the room'}! Travelling to the ${RNAME[c.map]}…`;settings.map=c.map;settings.season=c.season;settings.tod=c.tod;settings.wx=c.wx;settings.play='free';saveSettings();
    try{travelNote(JSON.stringify({v:2,at:Date.now(),map:c.map,xy:[(s.x||START.x)+60,(s.y||START.y)+60],xyName:s.name||'your group',wel:1}))}catch(e){}
    try{sessionStorage.setItem('birding-mp',JSON.stringify({room:code,joined:MP.joined,at:Date.now()}))}catch(e){}TRAVELLING=true;setTimeout(()=>location.reload(),500)};
  NET.listen('presence',look);look(NET.members);
  setTimeout(()=>{if(done)return;done=true;NET.leave();MP.room=null;msg.textContent=`Nobody is in room ${code} right now. Check the code, or create a room.`},6000)}
{const via=()=>{const v=$('mpVia');if(v)v.textContent=NET.kind==='arcade'?`Playing as ${NET.me.name} through Pocket Arcade.`:NET.signedOut?'Sign in to Pocket Arcade to play with friends anywhere. Until then: test rooms on this device (another tab or window).':'Test rooms on this device: open Big Year in another tab or window to play together. Inside Pocket Arcade you can play with friends anywhere.'};
  $('modeMulti').onclick=()=>{SFX.init();SFX.resume();titleStage('multi');via();const s=mpSession();$('mpRejoin').hidden=!s;if(s)$('mpRejoin').textContent='Rejoin room '+s.room};
  $('mpBack').onclick=()=>titleStage('modes');
  $('mpCreate').onclick=()=>{MP.pending='create';titleStage('free');$('titleFree').querySelector('.mode-name').textContent='Multiplayer · new room';$('startBtn').textContent='Create room'};
  $('mpJoin').onclick=()=>mpJoin($('mpCode').value);$('mpCode').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();mpJoin($('mpCode').value)}e.stopPropagation()};
  $('mpRejoin').onclick=()=>{const s=mpSession();if(!s)return;$('mpCode').value=s.room;mpJoin(s.room)};
  const tb=$('titleBack').onclick;$('titleBack').onclick=()=>{if(MP.pending){MP.pending=null;$('titleFree').querySelector('.mode-name').textContent='Free Play';$('startBtn').textContent='Start birding';titleStage('multi');return}tb()};
  const sb=$('startBtn').onclick;$('startBtn').onclick=()=>{const c=MP.pending==='create';MP.pending=null;sb();if(c)mpCreate()}}
/* hooks: sightings count in room games; NET starts; a room you were in comes back after travelling */
{const L0=logSighting;logSighting=function(b,how){const was=b.logged;L0(b,how);if(!was&&b.logged&&MP.room)mpOnLog(b.sp)}}
NET.init();NET.ready.then(()=>{const s=mpSession();if(s&&$('title').hidden)mpEnter(s.room,s.joined,s);
});
/* travel notes go to this tab's sessionStorage too, so a second tab in the same browser (a test room) can't save over them */
function travelNote(json){try{localStorage.setItem('birding-progress-v1',json)}catch(e){}try{sessionStorage.setItem('birding-progress-next',json)}catch(e){}}

/* MP-9 quick tags: press and hold on the game (touch or mouse, about half a second, without moving) to drop a pin right there.
   Works full screen and in Pocket Arcade's handheld view. Keyboard: T drops one where you stand. Only while in a room. */
const MPQ={el:null,t:null,x:0,y:0,id:null};
const mpqCSS=document.createElement('style');mpqCSS.textContent=`
#mpQuick{position:fixed;z-index:45;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:auto;animation:mpq .18s ease-out}
@keyframes mpq{from{opacity:0;transform:translate(-50%,-90%) scale(.8)}}
#mpQuick .row{display:flex;gap:8px;background:rgba(24,36,30,.94);border:2px solid #f5c542;border-radius:999px;padding:7px;box-shadow:0 8px 22px rgba(0,0,0,.35)}
#mpQuick button{border:0;border-radius:999px;padding:9px 13px;font:700 14px var(--font-ui,system-ui);color:#2a2205;background:#f5c542;cursor:pointer;white-space:nowrap}
#mpQuick button.m{background:#9fd4ff}#mpQuick button.r{background:#ff9a8a}
#mpQuick .tip{font:600 12px var(--font-ui,system-ui);color:#fff3cf;background:rgba(24,36,30,.8);border-radius:999px;padding:3px 10px}
#mpQuick .ring{width:26px;height:26px;border-radius:50%;border:3px solid #f5c542;box-shadow:0 0 0 3px rgba(0,0,0,.25);margin-top:2px;animation:mpr 1s ease-in-out infinite alternate}
@keyframes mpr{to{transform:scale(1.25)}}`;document.head.appendChild(mpqCSS);
function mpQuickOK(){return MP.room&&$('title').hidden&&$('journal').hidden&&$('mapBack').hidden&&$('noteBack').hidden&&$('foundBack').hidden&&!S.bino.on&&S.mode!=='airliner'}
function mpQuickClose(){if(MPQ.el){MPQ.el.remove();MPQ.el=null}clearTimeout(MPQ.auto)}
function mpQuickOpen(sx,sy,wx,wy){mpQuickClose();const d=document.createElement('div');d.id='mpQuick';d.style.left=sx+'px';d.style.top=(sy+14)+'px';
  d.innerHTML='<span class="tip">Drop a pin here</span><div class="row"></div><span class="ring"></span>';const R=d.querySelector('.row');
  for(const [l,c] of[['Bird here!',''],['Meet here','m'],['Rare bird!','r']]){const b=document.createElement('button');b.textContent=l;if(c)b.className=c;
    b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();mpDropPin(l,wx,wy);mpQuickClose()});R.appendChild(b)}
  document.body.appendChild(d);MPQ.el=d;MPQ.auto=setTimeout(mpQuickClose,6000);try{navigator.vibrate&&navigator.vibrate(18)}catch(e){}}
function mpScreenToWorld(sx,sy){return[S.cam.x+(sx-innerWidth/2)/VZ,S.cam.y+(sy-innerHeight/2)/VZ]}
cv.addEventListener('pointerdown',e=>{if(MPQ.el){mpQuickClose();return}if(!mpQuickOK()||e.button>0)return;MPQ.id=e.pointerId;MPQ.x=e.clientX;MPQ.y=e.clientY;clearTimeout(MPQ.t);
  MPQ.t=setTimeout(()=>{if(MPQ.id!==e.pointerId||!mpQuickOK())return;if(joy.active&&joy.id===e.pointerId)joyEnd({pointerId:e.pointerId});const [wx,wy]=mpScreenToWorld(MPQ.x,MPQ.y);mpQuickOpen(MPQ.x,MPQ.y,wx,wy)},550)});
cv.addEventListener('pointermove',e=>{if(e.pointerId===MPQ.id&&Math.hypot(e.clientX-MPQ.x,e.clientY-MPQ.y)>14){clearTimeout(MPQ.t);MPQ.id=null}});
for(const ev of['pointerup','pointercancel'])cv.addEventListener(ev,e=>{if(e.pointerId===MPQ.id){clearTimeout(MPQ.t);MPQ.id=null}});
addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='t'||e.target.tagName==='INPUT'||e.ctrlKey||e.metaKey)return;if(MPQ.el){mpQuickClose();return}if(!mpQuickOK())return;
  const p=mpPos(),sx=innerWidth/2+(p.x-S.cam.x)*VZ,sy=innerHeight/2+(p.y-S.cam.y)*VZ;mpQuickOpen(sx,sy-40,p.x,p.y)});

/* MP-10 friends and pins on the big map (Maps app). Tap one for its card; "Travel here" goes there.
   No fast travel of any kind during a room game (Sprint or Hunt) unless you sat it out: drive, fly or take a ferry. */
function mpNoFast(){return!!(MP.game&&MP.game.live&&!MP.game.me_out)}
function mpNoFastMsg(){toast('No fast travel during a room game. Drive, fly or take a ferry.',2.8)}
function mpMapDraw(g,P,CW,H,halo){if(!MP.room)return;const k=MAPR,ago=t=>{const m=Math.round((Date.now()-t)/60000);return m<1?'just now':m+' min ago'};
  const mark=(F,p)=>{MAPL.push({F,x:p[0]-14,y:p[1]-26,w:28+g.measureText(F.name).width,h:34,cx:p[0],cy:p[1]})};
  g.font='700 12px Fredoka,system-ui';
  for(const Pn of MP.pins){if(Pn.map!==k)continue;const p=P(Pn.x,Pn.y);if(p[0]<-20||p[1]<-20||p[0]>CW+20||p[1]>H+20)continue;const col=mpCol(Pn.byId);
    g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(p[0]+1,p[1]+1,5,2,0,0,TAU);g.fill();g.strokeStyle='#3a3a36';g.lineWidth=2;g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0],p[1]-20);g.stroke();
    g.fillStyle=col;g.beginPath();g.moveTo(p[0],p[1]-20);g.lineTo(p[0]+13,p[1]-16);g.lineTo(p[0],p[1]-11);g.closePath();g.fill();g.strokeStyle='#fff';g.lineWidth=1;g.stroke();
    const t=`${Pn.by}: ${Pn.label}`;halo(t,p[0]+16,p[1]-12,g.font,'#2b2b28','left');
    mark({name:t,x:Pn.x,y:Pn.y,col,habName:'Pin dropped '+ago(Pn.at),grp:{id:'mp',name:'Room '+MP.room},rank:1,i:0,mp:1,region:k!==MAP?k:undefined},p)}
  for(const id in MP.others){const R=MP.others[id];if(R.map!==k||Date.now()-R.at>120000)continue;const p=P(R.x,R.y),col=mpCol(id);if(p[0]<-20||p[1]<-20||p[0]>CW+20||p[1]>H+20)continue;
    g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(p[0]+.6,p[1]+1.2,9,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(p[0],p[1],9,0,TAU);g.fill();g.fillStyle=col;g.beginPath();g.arc(p[0],p[1],7,0,TAU);g.fill();
    g.fillStyle='#fff';g.font='700 9px Fredoka,system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText((R.name||'?')[0].toUpperCase(),p[0],p[1]+.5);g.textAlign='left';g.textBaseline='alphabetic';g.font='700 12px Fredoka,system-ui';
    halo(R.name,p[0]+12,p[1]+4,g.font,col,'left');
    const how={drive:'Driving',walk:'On foot',boat:'On the water',plane:'Flying the floatplane',air:'On the DC-3'}[R.mode]||'Birding';
    mark({name:R.name,x:R.x,y:R.y,col,habName:how,grp:{id:'mp',name:'Room '+MP.room},rank:1,i:0,mp:1,region:k!==MAP?k:undefined},p)}}

if(location.protocol==="file:")window.__G={MSTY,cartoBig,cartoData,cartoPaint,cartoWinGet:()=>cartoWin,DEV,devPick,devWorld,setObserver,HOMES,SUIT,isleAt,zoneAt,gbActivate,PLANE:()=>PLANE,PDOCKS,FERRIES,updatePlane,planeUse,landSpotAhead,VZ:()=>VZ,goMap,drawMap,mapSelect,mapSwitch,mapZoom,MAPUI,MAPV,getMAPL:()=>MAPL,specimens:(cv,season)=>{const prev=ctx,g=cv.getContext('2d');ctx=g;g.fillStyle='#d9c19a';g.fillRect(0,0,cv.width,cv.height);g.save();g.scale(3,3);
  try{const kinds=['creosote','ocotillo','cholla','barrel','agave','soapweed','boulder','pear'];kinds.forEach((k,i)=>drawDecor2({k,x:i*100+7,y:3,s:.9},0,30+i*44,92));
    ['juniper','pinyon','mesquite','hoak','ebony'].forEach((tp,i)=>{const T={id:-1-i,x:40+i*72,y:200,type:tp,h:CT_SHAPE[tp].hmin+CT_SHAPE[tp].hvar*.6,seed:1234+i*77};drawTreeShadow(T);drawTreeOW(T,null,0)})}finally{g.restore();ctx=prev}},titleStage,CELLS,TREE_BY_ID,SPRITED,cellStats:()=>({cells:CELLS.size,trees:[...CELLS.values()].reduce((n,c)=>n+c.trees.length,0),byId:TREE_BY_ID.size,sprites:SPRITED.length}),settings,outfitDef,drawPreview:birderSheet,HABITATS,HAB_CATS,HAB_ORDER,habitatAt,placeName,zoneCat,terr,T,groundColor,BLD,BKIND,drawBuildingOW,drawBuildingShadow,drawBuildingBino,buildingMesh,PARKED,TRAFFIC,TRACTOR,VTYPES,vehMesh,drawMeshMap,drawMeshBino,drawVehicle,drawVehicleBino,vehShadow,PEOPLE,PKIND,personLook,drawPersonFig,drawPerson,drawPersonBino,drawDecor2,DEC2_NAME,LAKES,PIERS,applySeason,snowCover,seasonNow:()=>SEASON,applyRanges,rangeTxt,isRareish,showAlertOnMap,alertGone,doUse,ZOOMS,BIRD_SCALE:()=>BIRD_SCALE,DIAG,MSG,msgTick,openApp,phoneBack,jState:()=>({jApp,jTab,jDetail}),startSoar,goLedge,BLD,buildingsNear,COND,condP,condCount,condRoll,applyCond,wxKind,drawAtmos,cellsNear,waterAt,GB,gbSpotOK,gbActivate,gbGeom,drawPlate,BOATS,BOATK,boatMesh,paddlePose,fastTravel,landSpot,carSpot,saveProgress,loadProgress,MAPL:()=>MAPL,TRAILS,BLD,MAPR:()=>MAPR,BANDS,bandAt,FEATURES,CITY_LOTS,GPS,gpLabels,boatWater,waterKind,updateBoat,FIELDS,FARMS,CITY,PARK,AVES,STS,riverPoint,LAUNCHES,TRACKS,WD,wkey,wdist,BRIDGES,LH,habSwatch,setGear,shutter,cycleGear,renderJournal,refreshAlbum,ALBUM,openPhoto,closePhoto,drawShrubBino,drawCarBino,setCtx:c=>{ctx=c},getCtx:()=>ctx,setBV:v=>{BV=v},drawBird,drawPlate,drawTreeOW,drawTreeShadow,drawTreeBino,drawCar,drawBirder,drawDecor,drawFence,drawTrailhead,drawNote,namePill,openTravel,closeNote,toast,doPish,GC,LEAF,BARK,CARC,PL,WB,PW,FL,skyCols,buildPano,PANO,ZOOMS,TRAIL,START,FENCES,coastX,roadX,openNote,updateLife,renderJournal,S,toggleBino,teleport,toggleJournal,toggleMap,doUse,zoomBy,logSighting,showFound,closeFound,treesNear,model,suitableTrees,landOn,SPECIES,carWet,aimTarget,updateCar,listener,drawSizeCompare,sizeText,FORMS,gbBodyPath,trackKind,cellTex,TEX};

})();
