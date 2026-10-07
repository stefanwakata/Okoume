/* eslint-disable */
// @ts-nocheck
// The 3D shelf (three.js r128, loaded from /vendor). Ported from the static v4 demo; data comes from the database.
export function mountShelf(root, LISTINGS, RANGES) {
'use strict';
'use strict';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const $=s=>root.querySelector(s);
const offs=[];const on=(t,ev,fn,o)=>{t.addEventListener(ev,fn,o);offs.push(()=>t.removeEventListener(ev,fn,o))};let disposed=false;

const CLOTH=['#3a4a52','#5b3a33','#2d3d33','#6e6248','#41353f','#283845','#7a5a3c','#4c5054','#5f2f2a','#36463e','#8a7d62','#2e3440'];

/* ---------- fallback list (no WebGL or reduced motion) ---------- */
function fillList(box,onPick){RANGES.forEach((rg,ri)=>{const h=document.createElement('h3');h.textContent=rg.name;box.appendChild(h);
  LISTINGS.forEach((x,i)=>{if(x.r!==ri)return;const b=document.createElement('button');b.type='button';b.className='lrow';b.style.setProperty('--c',x.color);
    const ii=document.createElement('i');ii.setAttribute('aria-hidden','true');const sp=document.createElement('span');const bb=document.createElement('b');bb.textContent=x.code;sp.append(bb,x.title+', '+x.ed);const em=document.createElement('em');em.textContent=x.price;b.append(ii,sp,em);b.addEventListener('click',()=>onPick(i));box.appendChild(b)})})}
fillList($('#fallback'),i=>openCard(i,null));
const listDlg=$('#list');
fillList($('#listBody'),i=>{listDlg.close();openCard(i,null)});
$('#listX').addEventListener('click',()=>listDlg.close());
listDlg.addEventListener('click',e=>{if(e.target===listDlg)listDlg.close()});

/* ---------- card (library index card) ---------- */
const card=$('#card'),veil=$('#veil');
let openIdx=-1, onClose=null, lastFocus=null;
function openCard(i,closeCb){
  const x=LISTINGS[i]; openIdx=i; onClose=closeCb; lastFocus=document.activeElement;
  $('#cardCode').textContent='';const cb=document.createElement('b');cb.textContent=x.code;$('#cardCode').append(cb,'\u2002'+RANGES[x.r].name);
  $('#cardT').textContent=x.title;
  $('#cardDl').innerHTML='';[['Édition',x.ed],['Établissement',x.school],['État',x.state]].forEach(([k,v])=>{const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;$('#cardDl').append(dt,dd)});
  $('#cardLink').setAttribute('href','/annonces/'+x.id);
  $('#cardP').textContent=x.price==='Prêt'?'Prêt pour la session':x.price;
  card.classList.add('on'); veil.classList.add('on'); card.setAttribute('aria-hidden','false');
  setTimeout(()=>$('#cardX').focus({preventScroll:true}),60);
}
function closeCard(){
  if(openIdx<0)return; openIdx=-1;
  card.classList.remove('on'); veil.classList.remove('on'); card.setAttribute('aria-hidden','true');
  if(onClose)onClose(); onClose=null; if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true});
}
$('#cardX').addEventListener('click',closeCard); $('#cardC').addEventListener('click',closeCard); veil.addEventListener('click',closeCard);
on(window,'keydown',e=>{if(e.key==='Escape')closeCard();
  if(e.key==='Tab'&&openIdx>=0){const f=[...card.querySelectorAll('button')].filter(b=>b.offsetParent);const i=f.indexOf(document.activeElement);
    if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}}});

/* ---------- captions + range index ---------- */
if(matchMedia('(hover: none)').matches)$('#hintTap').textContent='Touche un livre pour voir l’annonce';
const caps=[...root.querySelectorAll('.cap')].map(el=>({el,a:+el.dataset.from,b:+el.dataset.to,on:el.classList.contains('on')}));
const idx=$('#index'); const idxBtns=[];
RANGES.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.innerHTML=r.name+' <span class="opt">&ensp;'+r.code+'</span>';idx.appendChild(b);idxBtns.push(b)});
{const all=document.createElement('button');all.type='button';all.className='all';all.textContent='Voir la liste';all.addEventListener('click',()=>listDlg.showModal());idx.appendChild(all)}
const shelfEl=$('.shelf');
function shelfProgress(){const r=shelfEl.getBoundingClientRect(),range=shelfEl.offsetHeight-innerHeight;return range>0?clamp(-r.top/range,0,1):0}
let lastRange=-2;
function updateUI(p){
  for(const c of caps){const on=p>=c.a&&p<c.b;if(on!==c.on){c.on=on;c.el.classList.toggle('on',on)}}
}

/* ---------- WebGL ---------- */
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function hasGL(){try{const c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')))}catch(e){return false}}
if(!window.THREE||!hasGL()){root.classList.add('nogl');return ()=>offs.forEach(f=>f())}

const T=window.THREE, canvas=$('#gl');
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
let DPR=Math.min(devicePixelRatio||1,innerWidth<700?1.5:1.75);
renderer.setPixelRatio(DPR);
let slowFrames=0;
function adapt(dt){ // drop resolution once or twice if the GPU cannot keep up, never mid-animation jank loop
  if(dt>22)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
  if(slowFrames>24&&DPR>1){DPR=Math.max(1,DPR-0.35);renderer.setPixelRatio(DPR);resize();slowFrames=0}
}
renderer.outputEncoding=T.sRGBEncoding;
renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();
const WALL=new T.Color('#132029');
scene.background=WALL; scene.fog=new T.Fog(WALL,7,16);
const camera=new T.PerspectiveCamera(36,1,0.1,60);

/* dimensions: the shelf runs along +x */
const SHELF_LEN=30, LEVELS=[0,1.85], BOARD_D=1.15, BOARD_T=0.09;
const START_X=-2.4, END_X=SHELF_LEN-3.2;

/* textures drawn on canvas */
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
function noise(g,w,h,a){const d=g.getImageData(0,0,w,h),p=d.data;for(let i=0;i<p.length;i+=4){const n=(Math.random()-.5)*a;p[i]+=n;p[i+1]+=n;p[i+2]+=n}g.putImageData(d,0,0)}

const woodTex=canvasTex(1024,64,(g,w,h)=>{g.fillStyle='#9a6a55';g.fillRect(0,0,w,h);for(let i=0;i<70;i++){g.strokeStyle='rgba('+(90+Math.random()*40|0)+','+(50+Math.random()*25|0)+','+(35+Math.random()*20|0)+','+(0.08+Math.random()*0.18)+')';g.lineWidth=0.6+Math.random()*1.6;g.beginPath();const y=Math.random()*h;g.moveTo(0,y);for(let x=0;x<=w;x+=32)g.lineTo(x,y+Math.sin(x/90+i)*2.2);g.stroke()}noise(g,w,h,10)});
woodTex.wrapS=woodTex.wrapT=T.RepeatWrapping; woodTex.repeat.set(4,1);
const wallTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#1b2a34';g.fillRect(0,0,w,h);noise(g,w,h,14)});
wallTex.wrapS=wallTex.wrapT=T.RepeatWrapping; wallTex.repeat.set(10,3);

function spineTex(x,color,wpx,hpx){
  return canvasTex(wpx,hpx,(g,w,h)=>{
    g.fillStyle=color;g.fillRect(0,0,w,h);
    const grad=g.createLinearGradient(0,0,w,0);grad.addColorStop(0,'rgba(0,0,0,.28)');grad.addColorStop(.18,'rgba(255,255,255,.06)');grad.addColorStop(.5,'rgba(255,255,255,0)');grad.addColorStop(1,'rgba(0,0,0,.32)');g.fillStyle=grad;g.fillRect(0,0,w,h);
    const light=(parseInt(color.slice(1,3),16)*.3+parseInt(color.slice(3,5),16)*.59+parseInt(color.slice(5,7),16)*.11)>150;
    const ink=light?'#22201c':'#efe7d6';
    g.fillStyle=ink;g.globalAlpha=.85;g.fillRect(0,h*.07,w,3);g.fillRect(0,h*.86,w,3);g.globalAlpha=1;
    g.textAlign='center';g.textBaseline='middle';
    g.font='700 '+Math.round(w*.26)+'px Antonio, "Arial Narrow", sans-serif';
    const [a,b]=x.code.split(' ');g.fillText(a,w/2,h*.12+w*.12);g.fillText(b,w/2,h*.12+w*.42);
    g.save();g.translate(w/2,h*.5);g.rotate(-Math.PI/2);
    g.font='600 '+Math.round(w*.2)+'px "Newsreader Variable", Georgia, serif';
    let t=x.title; while(g.measureText(t).width>h*.44&&t.length>4)t=t.slice(0,-2);if(t!==x.title)t=t.trim()+'…';
    g.fillText(t,0,-w*.1);
    g.font='500 '+Math.round(w*.14)+'px Antonio, sans-serif';g.globalAlpha=.8;g.fillText(x.ed,0,w*.2);g.globalAlpha=1;g.restore();
    g.font='700 '+Math.round(w*.22)+'px Antonio, sans-serif';g.fillText(x.price,w/2,h*.92);
    noise(g,w,h,8);
  });
}
function plainSpine(color,wpx,hpx,seed){
  return canvasTex(wpx,hpx,(g,w,h)=>{g.fillStyle=color;g.fillRect(0,0,w,h);const grad=g.createLinearGradient(0,0,w,0);grad.addColorStop(0,'rgba(0,0,0,.3)');grad.addColorStop(.2,'rgba(255,255,255,.05)');grad.addColorStop(1,'rgba(0,0,0,.34)');g.fillStyle=grad;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(235,225,205,.5)';const bands=seed%3;for(let i=0;i<bands;i++){g.fillRect(0,h*(.1+i*.04),w,2);g.fillRect(0,h*(.88-i*.04),w,2)}noise(g,w,h,9)});
}
function labelTex(r){return canvasTex(512,96,(g,w,h)=>{g.fillStyle='#ece5d8';g.fillRect(0,0,w,h);g.strokeStyle='#2a2622';g.lineWidth=3;g.strokeRect(6,6,w-12,h-12);g.fillStyle='#2a2622';g.textBaseline='middle';let fs=40;g.font='700 '+fs+'px Antonio, sans-serif';while(g.measureText(r.name.toUpperCase()).width>w-44&&fs>22){fs--;g.font='700 '+fs+'px Antonio, sans-serif'}g.fillText(r.name.toUpperCase(),22,h*.42);g.font='500 22px Antonio, sans-serif';g.globalAlpha=.7;g.fillText(r.code,24,h*.78);noise(g,w,h,6)})}

/* scene objects */
const wallMat=new T.MeshStandardMaterial({map:wallTex,color:'#c9d6dd',roughness:.95});
const wall=new T.Mesh(new T.PlaneGeometry(80,14),wallMat);wall.position.set(SHELF_LEN/2,1.2,-0.62);wall.receiveShadow=true;scene.add(wall);
const floor=new T.Mesh(new T.PlaneGeometry(80,20),new T.MeshStandardMaterial({color:'#0f171d',roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.set(SHELF_LEN/2,-1.35,4);floor.receiveShadow=true;scene.add(floor);

const woodMat=new T.MeshStandardMaterial({map:woodTex,roughness:.62,metalness:0});
LEVELS.forEach(y=>{const b=new T.Mesh(new T.BoxGeometry(SHELF_LEN+0.4,BOARD_T,BOARD_D),woodMat);b.position.set(SHELF_LEN/2-0.2,y-BOARD_T/2,0);b.castShadow=b.receiveShadow=true;scene.add(b)});
const top=new T.Mesh(new T.BoxGeometry(SHELF_LEN+0.4,BOARD_T,BOARD_D),woodMat);top.position.set(SHELF_LEN/2-0.2,LEVELS[1]+1.85-BOARD_T/2,0);top.castShadow=top.receiveShadow=true;scene.add(top);
const base=new T.Mesh(new T.BoxGeometry(SHELF_LEN+0.4,0.5,BOARD_D),woodMat);base.position.set(SHELF_LEN/2-0.2,-0.25-BOARD_T,0);base.receiveShadow=true;scene.add(base);
for(let x=0;x<=SHELF_LEN;x+=7.5){const s=new T.Mesh(new T.BoxGeometry(BOARD_T,3.95,BOARD_D),woodMat);s.position.set(x-0.2,1.6,0);s.castShadow=s.receiveShadow=true;scene.add(s)}

/* the frosted window at the start of the shelf (ties back to the film) */
const winTex=canvasTex(512,768,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#5d86b8');gr.addColorStop(1,'#2a4a78');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){g.fillStyle='rgba(225,238,250,'+(Math.random()*.18)+')';const r=Math.random()*3;g.beginPath();g.arc(Math.random()*w,Math.random()*h,r,0,6.28);g.fill()}
  const fr=g.createLinearGradient(0,h*.6,0,h);fr.addColorStop(0,'rgba(220,235,250,0)');fr.addColorStop(1,'rgba(220,235,250,.55)');g.fillStyle=fr;g.fillRect(0,0,w,h);
  g.strokeStyle='#14202a';g.lineWidth=22;g.strokeRect(0,0,w,h);g.lineWidth=14;g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.moveTo(0,h*.52);g.lineTo(w,h*.52);g.stroke()});
const win=new T.Mesh(new T.PlaneGeometry(2.6,3.9),new T.MeshBasicMaterial({map:winTex,fog:false}));win.position.set(-3.9,1.75,-0.6);scene.add(win);

/* lights: cold window from the left, warm lamp from above */
scene.add(new T.HemisphereLight('#6f8fb3','#1a1410',.35));
const cold=new T.DirectionalLight('#9fc0e8',.75);cold.position.set(-6,4,5);scene.add(cold);
const lamp=new T.SpotLight('#ffcf9e',2.1,14,Math.PI/5,.65,1.4);
lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.bias=-0.0006;lamp.shadow.radius=4;
scene.add(lamp);scene.add(lamp.target);

/* books
   Plain books are drawn with InstancedMesh: one mesh per look (cloth color x band style),
   so ~270 books cost about 36 objects instead of 270. Listing books stay individual (pickable). */
const books=[]; const picks=[];
function rnd(seed){let s=seed>>>0;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296}
const pageMat=new T.MeshStandardMaterial({color:'#e9e1cf',roughness:.95});
/* a box with 3 material groups instead of 6: covers (sides), spine (front), pages (top, bottom, back).
   Fewer groups = fewer draw calls per book. */
function bookGeo(w,h,d){const g=new T.BoxGeometry(w,h,d);const idx=g.index.array;const face=f=>Array.from(idx.slice(f*6,f*6+6));
  const order=[...face(0),...face(1),...face(4),...face(2),...face(3),...face(5)];g.setIndex(order);g.clearGroups();g.addGroup(0,12,0);g.addGroup(12,6,1);g.addGroup(18,18,2);return g}
function buildBooks(){
  const r=rnd(11);
  const perRange=SHELF_LEN/RANGES.length;
  RANGES.forEach((rg,ri)=>{
    const lab=new T.Mesh(new T.PlaneGeometry(1.15,0.215),new T.MeshStandardMaterial({map:labelTex(rg),roughness:.8}));
    lab.position.set(ri*perRange+0.9,LEVELS[0]-BOARD_T/2,BOARD_D/2+0.002);scene.add(lab);
  });
  // plain book looks, shared
  const LOOKS=[]; CLOTH.forEach((c,ci)=>{for(let band=0;band<3;band++)LOOKS.push({c,band,list:[]})});
  const looksMats=LOOKS.map((lk,i)=>{const cover=new T.MeshStandardMaterial({color:lk.c,roughness:.75});const front=new T.MeshStandardMaterial({map:plainSpine(lk.c,64,320,lk.band),roughness:.72});return [cover,front,pageMat]});
  const unitBox=bookGeo(1,1,1);
  LEVELS.forEach((y,lv)=>{
    // listings for this level, spread evenly inside their range
    const queue=[]; RANGES.forEach((rg,ri)=>{const mine=LISTINGS.map((l,i)=>i).filter(i=>LISTINGS[i].r===ri&&(i%2)===lv);
      mine.forEach((li,k)=>queue.push({li,at:ri*perRange+perRange*(k+1)/(mine.length+1)-0.4}))});
    queue.sort((p,q)=>p.at-q.at);
    let x=0.15;
    while(x<SHELF_LEN-0.4){
      if(lv===0&&x>SHELF_LEN-2.6){x+=0.25;continue} // the empty slot at the end: "ta place"
      if(queue.length&&x>=queue[0].at){
        const li=queue.shift().li, L0=LISTINGS[li];
        const wdt=0.3+r()*0.06, hgt=1.42+r()*0.18, dep=0.86+r()*0.14;
        const cover=new T.MeshStandardMaterial({color:L0.color,roughness:.75});
        const front=new T.MeshStandardMaterial({map:spineTex(L0,L0.color,128,640),roughness:.72});
        const m=new T.Mesh(bookGeo(wdt,hgt,dep),[cover,front,pageMat]);
        m.position.set(x+wdt/2,y+hgt/2,BOARD_D/2-dep/2-0.03);m.castShadow=m.receiveShadow=true;scene.add(m);
        const bk={m,listing:li,base:m.position.clone(),out:0,target:0,open:0};m.userData.book=bk;books.push(bk);picks.push(m);
        x+=wdt+0.014; continue;
      }
      const wdt=0.1+r()*0.2, hgt=1.05+r()*0.55, dep=0.78+r()*0.24;
      const look=(r()*LOOKS.length)|0;
      const lean=r()<0.08?(r()-.5)*0.18:0;
      LOOKS[look].list.push({x:x+wdt/2,y:y+hgt/2-(lean?Math.abs(lean)*wdt:0),z:BOARD_D/2-dep/2-0.03,w:wdt,h:hgt,d:dep,lean});
      x+=wdt+0.012+(r()<0.05?0.18:0);
    }
  });
  const M=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),P=new T.Vector3(),S=new T.Vector3();
  LOOKS.forEach((lk,i)=>{if(!lk.list.length)return;
    const im=new T.InstancedMesh(unitBox,looksMats[i],lk.list.length);
    lk.list.forEach((b,j)=>{P.set(b.x,b.y,b.z);Q.setFromEuler(E.set(0,0,b.lean));S.set(b.w,b.h,b.d);M.compose(P,Q,S);im.setMatrixAt(j,M)});
    im.instanceMatrix.needsUpdate=true;im.castShadow=im.receiveShadow=true;im.frustumCulled=false;/* instances span the whole shelf */scene.add(im)});
  // the empty slot marker: a paper tag on the board, "ta place"
  const tag=new T.Mesh(new T.PlaneGeometry(1.4,0.5),new T.MeshStandardMaterial({roughness:.85,map:canvasTex(560,200,(g,w,h)=>{g.fillStyle='#ece5d8';g.fillRect(0,0,w,h);g.fillStyle='#b4543f';g.fillRect(0,0,w,10);g.fillStyle='#2a2622';g.textBaseline='middle';g.font='600 58px "Newsreader Variable", Georgia, serif';g.fillText('Ta place',28,h*.45);g.font='500 30px Antonio, sans-serif';g.globalAlpha=.75;g.fillText('TON PREMIER LIVRE ICI',30,h*.78);noise(g,w,h,6)})}));
  tag.position.set(SHELF_LEN-1.5,LEVELS[0]+0.26,BOARD_D/2-0.5);tag.rotation.x=-Math.PI/2+0.32;tag.receiveShadow=true;scene.add(tag);
}

/* camera rig */
let lookY=0.95; let target={x:START_X,y:1.55,z:6.3}, cam={x:START_X,y:1.55,z:6.3}, look={x:0,y:1.3}, mouse={x:0,y:0}, mcur={x:0,y:0};
const SX=()=>innerWidth<700?-1.5:START_X;
function frame(p){
  const mob=innerWidth<700, sx=SX();
  const x=sx+(END_X-sx)*p; target.x=x; target.y=(mob?1.95:2.15)-0.1*Math.sin(p*Math.PI); target.z=mob?7.4:7.6; lookY=mob?1.55:0.95;
}
function resize(){
  const w=canvas.clientWidth,h=canvas.clientHeight; renderer.setSize(w,h,false); camera.aspect=w/h;
  camera.fov=w<700?52:33; camera.updateProjectionMatrix(); frame(shelfProgress()); kick();
}

/* hover + click */
const ray=new T.Raycaster(), ndc=new T.Vector2(); let hovered=null, pointerIn=false, px=0, py=0, needPick=false;
const tip=$('#tip');
canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=canvas.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;ndc.set(px/r.width*2-1,-(py/r.height)*2+1);mouse.x=ndc.x;mouse.y=ndc.y;pointerIn=true;needPick=true;kick()});
canvas.addEventListener('pointerleave',()=>{pointerIn=false;setHover(null);kick()});
function pick(){ray.setFromCamera(ndc,camera);const hit=ray.intersectObjects(picks,false)[0];setHover(hit?hit.object.userData.book:null)}
function setHover(b){
  if(b===hovered){if(b){tip.style.left=px+'px';tip.style.top=py+'px'}return}
  if(hovered&&hovered.open===0)hovered.target=0;
  hovered=b; canvas.style.cursor=b?'pointer':'';
  if(b){if(b.open===0)b.target=1;const l=LISTINGS[b.listing];tip.textContent='';const tb=document.createElement('b');tb.textContent=l.code;tip.append(tb,'\u2002'+l.price);tip.style.left=px+'px';tip.style.top=py+'px';tip.classList.add('on')}else tip.classList.remove('on');
}
let opened=null;
canvas.addEventListener('click',e=>{if(opened)return;
  // touch screens fire no hover first: pick at the tap position
  const rc=canvas.getBoundingClientRect();px=e.clientX-rc.left;py=e.clientY-rc.top;ndc.set(px/rc.width*2-1,-(py/rc.height)*2+1);
  ray.setFromCamera(ndc,camera);const hit=ray.intersectObjects(picks,false)[0];if(!hit)return;
  const b=hit.object.userData.book;hovered=b;opened=b;b.open=1;b.target=2.4;tip.classList.remove('on');kick();
  openCard(b.listing,()=>{b.open=0;b.target=hovered===b?1:0;opened=null;kick()})});

/* render on demand */
let raf=0, onScreen=true, lastT=0;
function kick(){if(!raf&&onScreen)raf=requestAnimationFrame(loop)}
function loop(t){
  raf=0; const dt=Math.min(50,t-(lastT||t)); lastT=t; const k=1-Math.pow(1-(reduce?1:0.11),dt/16.67);
  let moving=false;
  const ease=(o,key,to,kk)=>{const d=to-o[key];if(Math.abs(d)>1e-4){o[key]+=d*kk;moving=true}else o[key]=to};
  ease(cam,'x',target.x,k);ease(cam,'y',target.y,k);ease(cam,'z',target.z,k);
  const mk=1-Math.pow(1-0.06,dt/16.67);ease(mcur,'x',pointerIn&&!opened?mouse.x:0,mk);ease(mcur,'y',pointerIn&&!opened?mouse.y:0,mk);
  camera.position.set(cam.x+mcur.x*0.25,cam.y+mcur.y*0.12,cam.z);
  camera.lookAt(cam.x+(innerWidth<700?0.6:1.1)+mcur.x*0.15,lookY,0);
  lamp.position.set(cam.x+2.5,5.2,3.2); lamp.target.position.set(cam.x+1.6,1.2,0); lamp.target.updateMatrixWorld();
  for(const b of books){
    if(b.listing<0)continue;
    const bk=1-Math.pow(1-0.16,dt/16.67);
    const d=b.target-b.out; if(Math.abs(d)>1e-3){b.out+=d*bk;moving=true}else b.out=b.target;
    const o=b.out;
    b.m.position.z=b.base.z+Math.min(o,1)*0.12+Math.max(0,o-1)*0.42;
    b.m.position.y=b.base.y+Math.max(0,o-1)*0.06;
    b.m.rotation.y=Math.max(0,o-1)*-0.32; b.m.rotation.x=Math.min(o,1)*-0.03;
  }
  if(needPick&&!opened){needPick=false;pick()}
  renderer.render(scene,camera);
  if(moving&&dt>0)adapt(dt);
  if(moving||needPick)raf=requestAnimationFrame(loop); else lastT=0;
}
const io=new IntersectionObserver(es=>{onScreen=es[0].isIntersecting;if(onScreen)kick()});io.observe(shelfEl);

function onScroll(){const p=shelfProgress();frame(p);updateUI(p);
  const ri=Math.min(RANGES.length-1,Math.floor(clamp((p*(END_X-SX())+SX()+1.1)/(SHELF_LEN/RANGES.length),0,RANGES.length-1)));
  if(ri!==lastRange){lastRange=ri;idxBtns.forEach((b,i)=>b.classList.toggle('on',i===ri))}
  kick();}
idxBtns.forEach((b,i)=>b.addEventListener('click',()=>{const per=SHELF_LEN/RANGES.length;const xr=i*per+0.6-1.1;const p=clamp((xr-SX())/(END_X-SX()),0,1);const range=shelfEl.offsetHeight-innerHeight;scrollTo({top:shelfEl.offsetTop+p*range,behavior:reduce?'auto':'smooth'})}));

/* boot once fonts are ready (spines are drawn with the real faces) */
const fontsReady=Promise.race([Promise.all([document.fonts.load('700 40px Antonio'),document.fonts.load('500 20px Antonio'),document.fonts.load('600 40px "Newsreader Variable"')]),new Promise(r=>setTimeout(r,2500))]);
fontsReady.then(()=>{
  if(disposed)return;
  buildBooks(); resize();
  on(window,'resize',resize); on(window,'scroll',onScroll,{passive:true});
  onScroll(); cam.x=target.x;cam.y=target.y;cam.z=target.z;
  $('#loader').classList.add('done'); kick();
});

return () => { disposed = true; offs.forEach((f) => f()); if (typeof raf !== 'undefined' && raf) cancelAnimationFrame(raf); try { io.disconnect(); } catch (e) {} try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {} };
}
