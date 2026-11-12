// Prueba E2E de la aventura de bienvenida (Primaria). Uso: PUPPETEER=ruta/a/puppeteer-core node pruebas/e2e/bienvenida.e2e.cjs
const pp=require(process.env.PUPPETEER);const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','..');
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.statusCode=404;r.end();}else{r.setHeader('Content-Type',f.endsWith('.mp3')?'audio/mpeg':f.endsWith('.jpg')?'image/jpeg':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');r.end(d);}});}).listen(8775,async()=>{
const b=await pp.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});const p=await b.newPage();await p.setViewport({width:1280,height:800});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load/.test(m.text()))errs.push(m.text())});
const w=ms=>new Promise(r=>setTimeout(r,ms));const ev=(f,...a)=>p.evaluate(f,...a);
const ok=(c,t)=>console.log(c?'  ✔':'  ✘',t);
await p.goto('http://localhost:8775/index.html');await ev(()=>{localStorage.clear()});await p.reload();await w(500);
await ev(()=>{const b=document.querySelector('.intro-saltar');if(b)b.click();});await w(700);
await ev(()=>{const PR=RumboProgreso,G=RumboUI.Guardado;const per=PR.crearPerfil({nombre:'Jugador 1',curso:'p4'});const d=G.cargar();d.perfiles.push(per);d.activo=per.id;d.ajustes.introVista=true;G.guardar();});
await p.reload();await w(600);
await ev(()=>RumboUI.App.ir('mapa'));await w(600);
ok(await ev(()=>!!document.querySelector('.modal.bienvenida')),'aparece la recomendación al entrar por primera vez');
ok(await ev(()=>!!document.querySelector('.mapa-bienvenida')),'el mapa muestra la tarjeta de bienvenida');
await p.screenshot({path:'/tmp/bv1.png'});
await ev(()=>document.querySelector('.b-bv-si').click());await w(700);
ok(await ev(()=>!!document.querySelector('.escena')),'antes del primer reto, Lumo se presenta en una escena');
await p.screenshot({path:'/tmp/bv_esc1.png'});
let lineas=0;for(let i=0;i<10;i++){const t=await ev(()=>{const x=document.querySelector('.escena .b-sig-esc');if(x){x.click();return 1}return 0});if(!t)break;lineas++;await w(250);}
ok(lineas>=5,'la presentación tiene varias frases ('+(lineas+1)+')');
for(let i=0;i<8;i++){const h=await ev(()=>{const x=document.querySelector('.escena .b-saltar,.escena .b-sig-esc,.b-entendido');if(x){x.click();return 1}return 0});if(!h)break;await w(300);}
ok(await ev(()=>document.querySelector('.juego')&&document.querySelector('.juego').classList.contains('infantil')),'se juega con la interfaz sencilla de Infantil');
ok(await ev(()=>{const b=document.querySelector('.juego.infantil .btn-pista');const i=b&&b.querySelector('svg');return !!i&&i.getBoundingClientRect().width>30&&b.getBoundingClientRect().width>60;}),'el botón de pista de Infantil muestra su bombilla');
const ids=await ev(()=>RumboCatalogo.BIENVENIDA);
let fin=false;
for(let i=0;i<ids.length;i++){
  const id=await ev(()=>document.querySelector('.juego').dataset.nivel);
  ok(id===ids[i],'reto '+(i+1)+': '+id);
  if(i===4){await p.screenshot({path:'/tmp/bv_fruta.png'});ok(await ev(()=>document.querySelectorAll('.tablero .obj:not(.recogido)').length===1&&RumboUI.App.estado.controlJuego.escenario.posicion().x===0),'la fruta está en otra casilla, visible junto a Lumo');}
  await ev(()=>{const c=RumboUI.App.estado.controlJuego;c.editor.cargar(RumboCatalogo.POR_ID[c.el.dataset.nivel].referencia);});
  await w(200);await ev(()=>document.querySelector('.b-play').click());
  for(let k=0;k<60;k++){await w(500);if(await ev(()=>!!document.querySelector('.resultado')))break;}
  ok(await ev(()=>!!document.querySelector('.resultado')),'  superado');
  if(i<ids.length-1){ok(await ev(()=>!!document.querySelector('.b-sig')),'  ofrece «siguiente»');await ev(()=>document.querySelector('.b-sig').click());await w(500);
    for(let j=0;j<6;j++){const h=await ev(()=>{const x=document.querySelector('.escena .b-saltar,.escena .b-sig-esc,.b-entendido');if(x){x.click();return 1}return 0});if(!h)break;await w(300);}}
  else{ok(!(await ev(()=>!!document.querySelector('.b-sig'))),'  el último no ofrece pasar a niveles de Infantil');await ev(()=>document.querySelector('.b-mapa2').click());await w(800);
    for(let j=0;j<6;j++){const h=await ev(()=>{const x=document.querySelector('.escena .b-saltar,.escena .b-sig-esc');if(x){x.click();return 1}return 0});if(!h)break;await w(400);}await w(600);}
}
ok(await ev(()=>document.body.dataset.pantalla==='mapa'),'al terminar se vuelve al mapa de Primaria');
ok(await ev(()=>!!document.querySelector('.mapa-bienvenida.hecha')),'la tarjeta aparece como completada');
ok(await ev(()=>!!document.querySelector('.modal.fin-bienvenida .b-historia')),'al terminar, se anima a empezar la historia');
await p.screenshot({path:'/tmp/bv2.png'});
await ev(()=>document.querySelector('.b-historia').click());await w(700);
for(let j=0;j<8;j++){const h=await ev(()=>{const x=document.querySelector('.escena .b-saltar,.escena .b-sig-esc,.b-entendido');if(x){x.click();return 1}return 0});if(!h)break;await w(300);}
ok(await ev(()=>{const n=document.querySelector('.juego');return !!n&&/^m1-/.test(n.dataset.nivel)&&!n.classList.contains('infantil');}),'«¡Empezar la historia!» abre el primer reto de su curso');
await ev(()=>RumboUI.App.ir('mapa'));await w(400);
const est=await ev(()=>RumboProgreso.estrellasTotales(RumboUI.App.perfil()));ok(est===0,'no suma estrellas de Primaria');
await p.reload();await w(600);await ev(()=>RumboUI.App.ir('mapa'));await w(500);
ok(!(await ev(()=>!!document.querySelector('.modal.bienvenida'))),'no vuelve a preguntar');
console.log(errs);await b.close();srv.close();});
