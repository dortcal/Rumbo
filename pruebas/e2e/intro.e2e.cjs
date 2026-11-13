// E2E de la intro: aparece al pulsar «Jugar» (no al abrir), se puede saltar y solo se muestra una vez.
const pp=require(process.env.PUPPETEER);const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','..');
const srv=http.createServer((q,r)=>{let f=path.join(root,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.statusCode=404;r.end();}else{r.setHeader('Content-Type',f.endsWith('.mp3')?'audio/mpeg':f.endsWith('.jpg')?'image/jpeg':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');r.end(d);}});}).listen(8777,async()=>{
const b=await pp.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1280,height:720});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const w=ms=>new Promise(r=>setTimeout(r,ms));const ev=(f,...a)=>p.evaluate(f,...a);
const ok=(c,t)=>console.log(c?'  ✔':'  ✘',t);
await p.goto('http://localhost:8777/index.html');await ev(()=>localStorage.clear());await p.reload();await w(1200);
ok(!(await ev(()=>!!document.querySelector('.intro'))),'al abrir el juego NO sale la intro');
ok(await ev(()=>!!document.querySelector('.p-portada')),'se ve la portada');
await p.screenshot({path:'/tmp/p_portada.png'});
await ev(()=>[...document.querySelectorAll('button')].find(b=>/^Jugar/.test(b.textContent.trim())).click());await w(900);
ok(await ev(()=>!!document.querySelector('.intro')),'al pulsar «Jugar» sale la intro');
ok(await ev(()=>!!document.querySelector('.intro-saltar')),'con botón «Saltar»');
await p.screenshot({path:'/tmp/p_intro.png'});
await ev(()=>document.querySelector('.intro-saltar').click());await w(900);
ok(!(await ev(()=>!!document.querySelector('.intro'))),'«Saltar» la cierra');
ok(await ev(()=>!!document.querySelector('.p-jugadores,.p-nuevo')||document.body.dataset.pantalla!=='portada'),'continúa a la pantalla siguiente: '+await ev(()=>document.body.dataset.pantalla));
ok(await ev(()=>RumboUI.Guardado.cargar().ajustes.introVista===true),'queda registrada como vista');
await p.reload();await w(800);
await ev(()=>RumboUI.App.ir('portada'));await w(400);
await ev(()=>[...document.querySelectorAll('button')].find(b=>/^Jugar/.test(b.textContent.trim())).click());await w(700);
ok(!(await ev(()=>!!document.querySelector('.intro'))),'la segunda vez ya no sale');
console.log(errs);await b.close();srv.close();});
