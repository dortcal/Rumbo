/*
 * RUMBO — Pruebas de extremo a extremo en Chrome REAL (puppeteer-core).
 * Uso:  CHROME=/usr/bin/google-chrome PUPPETEER=/ruta/a/puppeteer-core node pruebas/e2e/chrome.e2e.cjs
 *       (sirve el repositorio por HTTP en el puerto 8765 desde este mismo script)
 * Comprueba con eventos de ratón y táctiles reales: arrastrar tarjetas, ejecutar, victoria, guardado,
 * códigos de partida, historia, modo docente, Laboratorio e Infantil. Guarda capturas en /tmp/rumbo-shots.
 */
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require(process.env.PUPPETEER || 'puppeteer-core');
const RAIZ = path.join(__dirname, '..', '..');
const SHOTS = process.env.SHOTS || '/tmp/rumbo-shots';
fs.mkdirSync(SHOTS, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const servidor = http.createServer((req, res) => {
  let f = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

const esperar = ms => new Promise(r => setTimeout(r, ms));
let ok = 0, ko = 0; const fallos = [];
function chequear(cond, msg) { if (cond) { ok++; console.log('  ✔', msg); } else { ko++; fallos.push(msg); console.log('  ✘', msg); } }

async function main() {
  await new Promise(r => servidor.listen(8765, r));
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'], headless: 'new' });
  const errores = [];
  async function pagina(op = {}) {
    const p = await browser.newPage();
    await p.setViewport(Object.assign({ width: 1280, height: 800 }, op.viewport || {}));
    p.on('pageerror', e => errores.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|icon-|manifest|sw\.js|Failed to load resource/i.test(m.text())) errores.push(m.text()); });
    p.on('dialog', d => d.accept());
    p.on('framenavigated', f => { if (f === p.mainFrame() && p.__nav) console.log('   [navegación inesperada]', f.url()); });
    p.on('error', e => console.log('   [la página falló]', e.message));
    await p.goto('http://localhost:8765/index.html', { waitUntil: 'load' });
    if (!op.conservar) { await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'load' }); }
    await esperar(300);
    p.__nav = true;
    return p;
  }
  const ev = (p, f, ...a) => p.evaluate(f, ...a);
  async function crearPerfil(p, nombre, curso) {
    await ev(p, (n, c) => { const PR = RumboProgreso, G = RumboUI.Guardado; const per = PR.crearPerfil({ nombre: n, curso: c }); const d = G.cargar(); d.perfiles.push(per); d.activo = per.id; G.guardar(); }, nombre, curso);
    await p.reload({ waitUntil: 'load' }); await esperar(300);
  }
  async function saltarEscenas(p) {
    for (let i = 0; i < 6; i++) { const hay = await ev(p, () => !!document.querySelector('.escena .b-saltar, .escena .b-sig-esc')); if (!hay) break; await ev(p, () => (document.querySelector('.escena .b-saltar') || document.querySelector('.escena .b-sig-esc')).click()); await esperar(250); }
  }
  async function entender(p) {
    for (let i = 0; i < 4; i++) { const hay = await ev(p, () => !!document.querySelector('.b-entendido')); if (!hay) break; await ev(p, () => document.querySelector('.b-entendido').click()); await esperar(250); }
  }
  async function abrirNivel(p, id) {
    await ev(p, id => RumboUI.App.jugarNivel(id), id); await esperar(350); await saltarEscenas(p); await entender(p); await esperar(250);
  }
  async function centro(p, sel) { return ev(p, s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel); }
  async function arrastrarPaleta(p, tipo, destSel, fin = true) {
    const o = await centro(p, `.paleta-carta[data-tipo="${tipo}"]`);
    const d = await ev(p, s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x + r.width - 14, r.y + r.height / 2]; }, destSel || '.bloque-prog.principal > .lista');
    await p.mouse.move(o[0], o[1]); await p.mouse.down(); await p.mouse.move(o[0] + 14, o[1] - 14, { steps: 3 }); await p.mouse.move(d[0], d[1], { steps: 8 }); await esperar(60); await p.mouse.up(); await esperar(120);
  }
  async function esperarFin(p, max = 25000) {
    const t0 = Date.now();
    while (Date.now() - t0 < max) { const u = await ev(p, () => { const j = document.querySelector('.juego'); return j && j.dataset.ultimo; }); if (u) return u; await esperar(150); }
    return null;
  }
  async function programaEnPantalla(p) { return ev(p, () => JSON.stringify(RumboUI.App.estado.controlJuego.editor.obtener())); }
  const rapido = p => ev(p, () => { RumboUI.Guardado.cargar().ajustes.velocidad = 1.7; });

  // =====================================================================
  console.log('\n1. Arranque y flujo básico (ratón)');
  let p = await pagina();
  chequear(await ev(p, () => !!document.querySelector('.p-portada .logo-svg')), 'la portada se muestra con el logotipo');
  chequear(await ev(p, () => typeof RumboCatalogo.total === 'function' && RumboCatalogo.TODOS.length === 97), 'el catálogo tiene 97 retos');
  await p.click('.btn-grande.principal'); await esperar(250); await p.click('.tarjeta-jugador.nuevo'); await esperar(250);
  await p.type('.campo', 'Ana'); await ev(p, () => [...document.querySelectorAll('.chip-curso')].find(b => b.textContent === '1.º').click()); await p.click('.btn-grande.principal'); await esperar(400);
  chequear(await ev(p, () => document.body.dataset.pantalla === 'mapa'), 'se crea el jugador y aparece el mapa');
  await p.screenshot({ path: SHOTS + '/mapa.png' });
  await abrirNivel(p, 'm1-01');
  await arrastrarPaleta(p, 'avanzar'); await arrastrarPaleta(p, 'avanzar'); await arrastrarPaleta(p, 'avanzar');
  chequear((await programaEnPantalla(p)) === JSON.stringify([{ t: 'avanzar' }, { t: 'avanzar' }, { t: 'avanzar' }]), 'arrastrar 3 tarjetas las coloca en la zona de programación');
  await p.screenshot({ path: SHOTS + '/programa.png' });
  await p.click('.b-play'); const fin1 = await esperarFin(p);
  chequear(fin1 === 'victoria:3', 'ejecutar el programa correcto da victoria con 3 estrellas (' + fin1 + ')');
  await esperar(900);
  chequear(await ev(p, () => !!document.querySelector('.resultado .res-estrellas')), 'aparece la pantalla de resultados');
  await p.screenshot({ path: SHOTS + '/resultado.png' });
  chequear(await ev(p, () => { const per = RumboUI.App.perfil(); return per.niveles['m1-01'].completado && per.niveles['m1-01'].est === 3 && !!per.logros['primer-paso']; }), 'el progreso y la insignia «Primer paso» quedan registrados');
  await p.reload({ waitUntil: 'load' }); await esperar(400);
  chequear(await ev(p, () => { const d = RumboUI.Guardado.cargar(); return d.perfiles[0].niveles['m1-01'].est === 3; }), 'el progreso se conserva al recargar la página');

  // =====================================================================
  console.log('\n2. Edición de la secuencia: reordenar, seleccionar, duplicar, borrar, deshacer');
  await abrirNivel(p, 'm1-04');
  for (const t of ['avanzar', 'girar-d', 'avanzar']) await arrastrarPaleta(p, t);
  let prog = JSON.parse(await programaEnPantalla(p));
  chequear(prog.map(x => x.t).join() === 'avanzar,girar-d,avanzar', 'se construye una secuencia mixta');
  // mover la 3.ª carta al principio arrastrándola
  const o = await centro(p, '.carta-prog[data-ruta="2"]'), d = await ev(p, () => { const r = document.querySelector('.carta-prog[data-ruta="0"]').getBoundingClientRect(); return [r.x + 4, r.y + r.height / 2]; });
  await p.mouse.move(o[0], o[1]); await p.mouse.down(); await p.mouse.move(o[0] - 20, o[1] - 20, { steps: 3 }); await p.mouse.move(d[0], d[1], { steps: 8 }); await esperar(60); await p.mouse.up(); await esperar(120);
  prog = JSON.parse(await programaEnPantalla(p));
  chequear(prog.map(x => x.t).join() === 'avanzar,avanzar,girar-d', 'arrastrar una tarjeta dentro de la lista cambia su orden (' + prog.map(x => x.t).join() + ')');
  await p.click('.carta-prog[data-ruta="1"]'); await esperar(150);
  chequear(await ev(p, () => !document.querySelector('.barra-sel').hidden), 'al tocar una tarjeta aparece la barra Duplicar/Mover/Borrar');
  await p.click('.btn-sel.s-dup'); await esperar(150);
  chequear(JSON.parse(await programaEnPantalla(p)).length === 4, 'duplicar añade una tarjeta');
  await p.click('.btn-sel.s-borrar'); await esperar(150);
  chequear(JSON.parse(await programaEnPantalla(p)).length === 3, 'borrar quita la tarjeta seleccionada');
  await p.click('.b-undo'); await esperar(150);
  chequear(JSON.parse(await programaEnPantalla(p)).length === 4, 'deshacer recupera la tarjeta borrada');
  await p.click('.b-clear'); await esperar(150);
  chequear(JSON.parse(await programaEnPantalla(p)).length === 0, 'borrar todo vacía el programa');
  // arrastrar a la paleta elimina
  await arrastrarPaleta(p, 'avanzar');
  const o2 = await centro(p, '.carta-prog[data-ruta="0"]'), d2 = await centro(p, '.paleta');
  await p.mouse.move(o2[0], o2[1]); await p.mouse.down(); await p.mouse.move(o2[0] + 10, o2[1] + 40, { steps: 3 }); await p.mouse.move(d2[0], d2[1], { steps: 8 }); await esperar(60); await p.mouse.up(); await esperar(120);
  chequear(JSON.parse(await programaEnPantalla(p)).length === 0, 'arrastrar una tarjeta a la paleta la elimina');

  // =====================================================================
  console.log('\n3. Errores: respuesta positiva, pistas y «Lumo te lo enseña»');
  await arrastrarPaleta(p, 'avanzar'); await arrastrarPaleta(p, 'avanzar'); await arrastrarPaleta(p, 'avanzar'); await arrastrarPaleta(p, 'avanzar');
  await p.click('.b-play'); let f = await esperarFin(p);
  chequear(/^fallo:/.test(f || ''), 'un programa incorrecto termina como fallo, no como error del juego (' + f + ')');
  const txt = await ev(p, () => document.querySelector('.j-burbuja .txt').textContent);
  chequear(txt.length > 0 && !/mal|error|fracaso/i.test(txt), 'Lumo responde con una frase positiva: «' + txt + '»');
  chequear(await ev(p, () => !!document.querySelector('.carta-prog.error')), 'la tarjeta donde falla queda marcada con suavidad');
  await p.screenshot({ path: SHOTS + '/fallo.png' });
  chequear(await ev(p, () => RumboUI.App.perfil().niveles['m1-04'].fallos >= 1), 'el fallo se anota para el docente (intentos/fallos)');
  await p.click('.b-pista'); await esperar(200);
  chequear(await ev(p, () => /Pista 1/.test(document.querySelector('.aviso').textContent)), 'el botón de pista da la pista 1 de 3');
  await p.click('.b-pista'); await esperar(150); await p.click('.b-pista'); await esperar(150);
  chequear(await ev(p, () => RumboUI.App.perfil().niveles['m1-04'].pistas === 3), 'las 3 pistas progresivas se registran');
  for (let i = 0; i < 2; i++) { await ev(p, () => delete document.querySelector('.juego').dataset.ultimo); await p.click('.b-play'); await esperarFin(p); await esperar(100); }
  chequear(await ev(p, () => !document.querySelector('.b-sol').hidden), 'tras varios fallos aparece «Lumo te lo enseña»');
  await p.click('.b-sol'); await esperar(300);
  await ev(p, () => delete document.querySelector('.juego').dataset.ultimo);
  await p.click('.b-play'); f = await esperarFin(p);
  chequear(f === 'victoria:1', 'usando la ayuda de Lumo se supera el reto con 1 estrella (' + f + ')');

  // =====================================================================
  console.log('\n4. Pausa, continuar y reiniciar durante la ejecución');
  await esperar(900); await ev(p, () => { document.querySelector('.resultado .b-repetir').click(); }); await esperar(300);
  await p.click('.b-clear'); for (let i = 0; i < 6; i++) await arrastrarPaleta(p, 'avanzar');
  await p.click('.b-play'); await esperar(500); await p.click('.b-pausa'); await esperar(300);
  const pos1 = await ev(p, () => JSON.stringify([document.querySelector('.tablero').dataset.x, document.querySelector('.tablero').dataset.y]));
  await esperar(1200);
  const pos2 = await ev(p, () => JSON.stringify([document.querySelector('.tablero').dataset.x, document.querySelector('.tablero').dataset.y]));
  chequear(pos1 === pos2 && await ev(p, () => document.querySelector('.tablero').dataset.estado === 'pausa'), 'en pausa Lumo no se mueve');
  await p.click('.b-pausa'); await esperar(300);
  chequear(await ev(p, () => document.querySelector('.tablero').dataset.estado === 'ejecutando'), 'continuar reanuda la ejecución');
  await p.click('.b-reset'); await esperar(300);
  chequear(await ev(p, () => { const t = document.querySelector('.tablero'); return t.dataset.estado === 'listo' && t.dataset.x === '0' && t.dataset.y === '0'; }), 'reiniciar devuelve a Lumo a la salida');
  await p.close();

  // =====================================================================
  console.log('\n5. Todas las soluciones de referencia, ejecutadas con la interfaz real');
  p = await pagina();
  await crearPerfil(p, 'Todo', 'p6');
  await rapido(p);
  const ids = (await ev(p, () => RumboCatalogo.TODOS.filter(n => n.etapa !== 'infantil').map(n => n.id))).filter(i => !process.env.E2E_IDS || new RegExp(process.env.E2E_IDS).test(i));
  let malos = [];
  for (const id of ids) {
    if (p.isClosed() || p.mainFrame().detached) { console.log('   pagina perdida antes de', id); break; }
    await ev(p, id => { RumboUI.App.estado.docente = { todo: true }; RumboUI.App.jugarNivel(id, { sinRegistro: false }); }, id);
    await esperar(120); await saltarEscenas(p); await entender(p);
    const r = await ev(p, () => { const c = RumboUI.App.estado.controlJuego; const n = RumboCatalogo.POR_ID[c.el.dataset.nivel]; c.editor.cargar(n.referencia); return true; });
    console.log('   ->', id); await p.click('.b-play'); const u = await esperarFin(p, 40000);
    if (u !== 'victoria:3') { malos.push(id + '=' + u); console.log('   diag', id, JSON.stringify(await ev(p, () => ({ escena: !!document.querySelector('.escena'), modal: [...document.querySelectorAll('[class*=modal],[class*=resultado],[class*=demo]')].map(e => e.className), estado: (document.querySelector('.tablero') || {}).dataset && document.querySelector('.tablero').dataset.estado, prog: JSON.stringify(RumboUI.App.estado.controlJuego.editor.obtener()).slice(0, 200) })))); await p.screenshot({ path: SHOTS + '/diag-' + id + '.png' }); }
    await esperar(700); await ev(p, () => { const b = document.querySelector('.resultado .b-mapa2'); if (b) b.click(); }); await esperar(300); await saltarEscenas(p);
  }
  chequear(malos.length === 0, `los ${ids.length} retos de Primaria se superan con 3 estrellas desde la interfaz` + (malos.length ? ' · fallan: ' + malos.join(', ') : ''));
  const prog5 = await ev(p, () => { const per = RumboUI.App.perfil(); return [Object.keys(per.niveles).length, RumboProgreso.estrellasTotales(per)]; });
  console.log('   retos registrados:', prog5[0], 'estrellas totales:', prog5[1]);
  chequear(await ev(p, () => ['mundo-1', 'mundo-2', 'mundo-3', 'faro', 'secretos'].every(k => RumboUI.App.perfil().logros[k])), 'se concedieron las insignias de mundo, Faro y secretos');
  await p.close();

  // =====================================================================
  console.log('\n6. Infantil: voz/imagen, huecos, sin puntuación');
  p = await pagina();
  await crearPerfil(p, 'Leo', 'inf5'); await rapido(p);
  await abrirNivel(p, 'i3-01');
  chequear(await ev(p, () => document.querySelector('.juego').classList.contains('infantil')), 'la pantalla de Infantil usa la interfaz simplificada');
  chequear(await ev(p, () => !document.querySelector('.paleta-carta .carta-nombre') && !document.querySelector('.cuenta')), 'Infantil: tarjetas sin texto y sin contador de tarjetas');
  chequear(await ev(p, () => !document.querySelector('.b-vel') && !document.querySelector('.b-clear')), 'Infantil: pocos botones en pantalla');
  const ref = await ev(p, () => RumboCatalogo.POR_ID['i3-01'].referencia.map(x => x.t));
  for (const t of ref) { await p.click(`.paleta-carta[data-tipo="${t}"]`); await esperar(150); }
  await p.screenshot({ path: SHOTS + '/infantil-programa.png' });
  await p.click('.b-play'); const fi = await esperarFin(p);
  chequear(fi === 'victoria:1', 'Infantil: se resuelve tocando tarjetas y queda una sola estrella de celebración (' + fi + ')');
  await esperar(1200);
  chequear(await ev(p, () => document.querySelectorAll('.res-estrellas .est').length === 1 && !document.querySelector('.res-info')), 'Infantil: la pantalla de resultados no muestra puntuaciones');
  await p.screenshot({ path: SHOTS + '/infantil-resultado.png' });
  // un fallo en Infantil: ayuda visual en la paleta
  await esperar(900); await ev(p, () => document.querySelector('.resultado .b-repetir').click()); await esperar(300);
  await abrirNivel(p, 'i4-03');
  const ini = await programaEnPantalla(p);
  chequear(JSON.parse(ini).length === 4, 'Infantil: el reto de depurar llega con la secuencia desordenada ya puesta');
  await p.click('.b-play'); await esperarFin(p); await ev(p, () => delete document.querySelector('.juego').dataset.ultimo);
  await p.click('.b-pista'); await esperar(300);
  chequear(await ev(p, () => !!document.querySelector('.paleta-carta.pulso')), 'Infantil: la pista resalta con un destello la tarjeta que hace falta');
  await p.close();

  // =====================================================================
  console.log('\n7. Historia, mapa y desbloqueos');
  p = await pagina();
  await crearPerfil(p, 'Eva', 'p1');
  await ev(p, () => RumboUI.App.jugarNivel('m1-01')); await esperar(500);
  chequear(await ev(p, () => !!document.querySelector('.escena')), 'al entrar al primer reto del bosque se muestra la escena C1-01');
  await p.screenshot({ path: SHOTS + '/escena.png' });
  await ev(p, () => document.querySelector('.escena .b-sig-esc').click()); await esperar(300);
  await saltarEscenas(p); await esperar(300);
  chequear(await ev(p, () => !document.querySelector('.escena') && !!document.querySelector('.juego')), 'la escena avanza y se puede saltar');
  chequear(await ev(p, () => RumboUI.App.perfil().vistos.escenas['C1-01']), 'la escena queda marcada como vista (álbum de recuerdos)');
  await ev(p, () => RumboUI.App.ir('mundo', { mundo: 1 })); await esperar(300);
  chequear(await ev(p, () => document.querySelectorAll('.nodo.abierto').length === 1 && document.querySelectorAll('.nodo.cerrado').length >= 20), 'solo está abierto el primer reto; el resto, bloqueado');
  await ev(p, () => RumboUI.App.ir('mapa')); await esperar(300);
  chequear(await ev(p, () => document.querySelectorAll('.mundo-tarjeta.cerrado').length === 3), 'un jugador de 1.º ve cerrados los mundos 2, 3 y el Faro');
  await p.close();

  // =====================================================================
  console.log('\n8. Códigos de partida');
  p = await pagina();
  await crearPerfil(p, 'Pepe', 'p1'); await rapido(p);
  for (const id of ['m1-01', 'm1-02', 'm1-03']) { await ev(p, id => RumboUI.App.estado.docente = { todo: false }, id); await abrirNivel(p, id); await ev(p, () => { const c = RumboUI.App.estado.controlJuego; c.editor.cargar(RumboCatalogo.POR_ID[c.el.dataset.nivel].referencia); }); await p.click('.b-play'); await esperarFin(p, 30000); await esperar(800); await ev(p, () => { const b = document.querySelector('.resultado .b-mapa2'); if (b) b.click(); }); await esperar(300); }
  const codigo = await ev(p, () => RumboProgreso.aCodigo(RumboUI.App.perfil()).codigo);
  console.log('   código corto:', codigo);
  chequear(/^[0-9A-Z-]{11,14}$/.test(String(codigo)), 'se genera un código corto de partida');
  await p.evaluate(() => RumboUI.App.ir('codigo')); await esperar(300);
  await p.type('.campo', 'Copia'); await p.type('.codigo-texto', String(codigo).toLowerCase());
  await ev(p, () => [...document.querySelectorAll('.btn-grande')].find(b => /Recuperar/.test(b.textContent)).click()); await esperar(500);
  chequear(await ev(p, () => { const per = RumboUI.App.perfil(); return per.nombre === 'Copia' && RumboProgreso.hecho(per, 'm1-03') && RumboProgreso.estaDesbloqueado(per, 'm1-04'); }), 'escribir el código en otro perfil restaura los niveles superados y desbloquea el siguiente');
  await p.evaluate(() => RumboUI.App.ir('codigo')); await esperar(300);
  await p.type('.campo', 'X'); await p.type('.codigo-texto', 'ZZZZ-ZZZZ-ZZZ');
  await ev(p, () => [...document.querySelectorAll('.btn-grande')].find(b => /Recuperar/.test(b.textContent)).click()); await esperar(300);
  chequear(await ev(p, () => document.querySelector('.msg-error').textContent.length > 0), 'un código erróneo muestra un mensaje amable y no crea nada');
  await p.close();

  // =====================================================================
  console.log('\n9. Modo docente');
  p = await pagina();
  await crearPerfil(p, 'Mar', 'p3');
  await ev(p, () => RumboUI.App.ir('docente')); await esperar(300);
  chequear(await ev(p, () => !!document.querySelector('.puerta-docente')), 'el modo docente pide mantener pulsado');
  const bt = await centro(p, '.puerta-docente');
  await p.mouse.move(bt[0], bt[1]); await p.mouse.down(); await esperar(600); await p.mouse.up(); await esperar(200);
  chequear(await ev(p, () => !!document.querySelector('.puerta-docente')), 'una pulsación corta no abre el panel');
  await p.mouse.move(bt[0], bt[1]); await p.mouse.down(); await esperar(2400); await p.mouse.up(); await esperar(400);
  chequear(await ev(p, () => !!document.querySelector('.doc-cuerpo')), 'mantener pulsado dos segundos abre el panel docente');
  await p.screenshot({ path: SHOTS + '/docente.png' });
  await ev(p, () => [...document.querySelectorAll('.tab')].find(b => /Niveles/.test(b.textContent)).click()); await esperar(300);
  await ev(p, () => document.querySelectorAll('details.doc-caja')[1].open = true); await esperar(100);
  chequear(await ev(p, () => !!document.querySelector('.curr-of') && !!document.querySelector('.curr-ext')), 'cada nivel muestra su currículo oficial y la propuesta propia del juego por separado');
  await p.screenshot({ path: SHOTS + '/docente-niveles.png' });
  await ev(p, () => [...document.querySelectorAll('.tab')].find(b => /Matriz/.test(b.textContent)).click()); await esperar(300);
  chequear(await ev(p, () => document.querySelectorAll('.doc-tabla tbody tr').length >= 8), 'la matriz curricular lista los criterios y los retos que los trabajan');
  await ev(p, () => [...document.querySelectorAll('.tab')].find(b => /Niveles/.test(b.textContent)).click()); await esperar(300);
  await ev(p, () => { const c = document.querySelector('.chk input'); c.click(); }); await esperar(100);
  await ev(p, () => RumboUI.App.ir('mapa')); await esperar(300);
  chequear(await ev(p, () => document.querySelectorAll('.mundo-tarjeta.cerrado').length === 0), 'abrir todos los niveles desde el modo docente abre todos los mundos');
  await ev(p, () => { RumboUI.App.ir('docente'); }); await esperar(300);
  await ev(p, () => [...document.querySelectorAll('.tab')].find(b => /Niveles/.test(b.textContent)).click()); await esperar(300);
  await ev(p, () => { document.querySelectorAll('details.doc-caja')[1].open = true; }); await esperar(100);
  await ev(p, () => [...document.querySelectorAll('.doc-nivel .btn-txt')].find(b => b.textContent === 'Probar').click()); await esperar(700); await entender(p);
  chequear(await ev(p, () => !!document.querySelector('.juego')), 'el docente puede probar un nivel sin registrar progreso');
  await p.close();

  // =====================================================================
  console.log('\n10. Laboratorio: crear, resolver, guardar, compartir e importar');
  p = await pagina();
  await crearPerfil(p, 'Ana', 'p3'); await rapido(p);
  await ev(p, () => { const per = RumboUI.App.perfil(); per.desbloqueo.lab = true; RumboUI.Guardado.guardar(); });
  await ev(p, () => RumboUI.App.ir('laboratorio')); await esperar(300);
  await p.click('.btn-grande.principal'); await esperar(400);
  // pintar un muro y un objeto con el ratón
  const dims = await ev(p, () => { const s = document.querySelector('.lab-tablero'), r = s.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, nx: s.viewBox.baseVal.width / 64, ny: s.viewBox.baseVal.height / 64 }; });
  const cel = (x, y) => [dims.x + (x + .5) * dims.w / dims.nx, dims.y + (y + .5) * dims.h / dims.ny];
  let c = cel(1, 1); await p.mouse.click(c[0], c[1]); await esperar(150);
  await ev(p, () => [...document.querySelectorAll('.herr')].find(b => /Objeto/.test(b.textContent)).click()); await esperar(100);
  c = cel(2, 0); await p.mouse.click(c[0], c[1]); await esperar(150);
  await p.screenshot({ path: SHOTS + '/lab-editor.png' });
  await ev(p, () => [...document.querySelectorAll('.btn-grande')].find(b => /Probar/.test(b.textContent)).click()); await esperar(500); await entender(p);
  const mapaJ = await ev(p, () => { const t = document.querySelector('.tablero'); return [...t.querySelectorAll('[data-celda]')].length; });
  chequear(mapaJ === 16, 'el reto en prueba se dibuja con el tablero creado (4×4)');
  // programa: E,E(recoge),E,E → fila 0 hasta x=3 ; luego abajo 3
  const prg = [{ t: 'avanzar' }, { t: 'avanzar' }, { t: 'recoger' }, { t: 'avanzar' }, { t: 'girar-d' }, { t: 'avanzar' }, { t: 'avanzar' }, { t: 'avanzar' }];
  await ev(p, prg => { RumboUI.App.estado.controlJuego.editor.cargar(prg); }, prg);
  await p.click('.b-play'); const fl = await esperarFin(p, 30000);
  chequear(fl === 'victoria:3' || /^victoria/.test(fl || ''), 'el autor resuelve su propio reto en el Laboratorio (' + fl + ')');
  await esperar(800); await ev(p, () => document.querySelector('.resultado .b-cont').click()); await esperar(400);
  chequear(await ev(p, () => !!document.querySelector('.modal input.campo')), 'tras resolverlo se pide un nombre para guardar');
  await p.type('.modal input.campo', 'Reto del coral');
  await ev(p, () => [...document.querySelectorAll('.modal .btn-grande')].find(b => /Guardar/.test(b.textContent)).click()); await esperar(500);
  chequear(await ev(p, () => RumboUI.App.perfil().retos.length === 1 && RumboUI.App.perfil().logros.creador > 0), 'el reto se guarda y se concede la insignia «Creador de retos»');
  await ev(p, () => [...document.querySelectorAll('.reto-acc .btn-txt')].find(b => b.textContent === 'Compartir').click()); await esperar(300);
  const cod = await ev(p, () => document.querySelector('.modal textarea').value);
  chequear(/^RUMBO1\./.test(cod), 'el reto se comparte como un código (RUMBO1…)');
  await p.screenshot({ path: SHOTS + '/lab-compartir.png' });
  await ev(p, () => document.querySelector('.modal .btn-grande').click());
  // otro jugador importa el código
  await ev(p, () => { const PR = RumboProgreso, G = RumboUI.Guardado; const per = PR.crearPerfil({ nombre: 'Leo', curso: 'p4' }); per.desbloqueo.lab = true; const d = G.cargar(); d.perfiles.push(per); d.activo = per.id; RumboUI.App.estado.perfil = per; G.guardar(); RumboUI.App.ir('laboratorio'); }); await esperar(300);
  await ev(p, () => [...document.querySelectorAll('.btn-grande')].find(b => /Importar/.test(b.textContent)).click()); await esperar(200);
  await p.type('.modal textarea', 'RUMBO1.xxx.yyy');
  await ev(p, () => [...document.querySelectorAll('.modal .btn-grande')].find(b => /Importar/.test(b.textContent) && !/Cancelar/.test(b.textContent)).click()); await esperar(200);
  chequear(await ev(p, () => document.querySelector('.modal .msg-error').textContent.length > 0), 'un código falso se rechaza con un mensaje');
  await ev(p, c => { const t = document.querySelector('.modal textarea'); t.value = c; }, cod);
  await ev(p, () => [...document.querySelectorAll('.modal .btn-grande')].find(b => /Importar/.test(b.textContent) && !/Cancelar/.test(b.textContent)).click()); await esperar(500);
  chequear(await ev(p, () => RumboUI.App.perfil().retos.length === 1 && RumboUI.App.perfil().retos[0].nombre === 'Reto del coral'), 'otro jugador importa el reto y aparece en su lista');
  await ev(p, () => [...document.querySelectorAll('.reto-acc .btn-txt')].find(b => b.textContent === 'Jugar').click()); await esperar(500); await entender(p);
  await ev(p, () => { RumboUI.App.estado.controlJuego; });
  chequear(await ev(p, () => !!document.querySelector('.juego')), 'el compañero puede jugar el reto importado');
  await p.close();

  // =====================================================================
  console.log('\n11. Pantalla táctil (tableta) y ajustes de accesibilidad');
  p = await pagina({ viewport: { width: 1024, height: 768, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } });
  await crearPerfil(p, 'Tab', 'p1');
  await abrirNivel(p, 'm1-01');
  const oT = await centro(p, '.paleta-carta[data-tipo="avanzar"]'), dT = await ev(p, () => { const r = document.querySelector('.bloque-prog.principal > .lista').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await p.touchscreen.touchStart(oT[0], oT[1]); await p.touchscreen.touchMove(oT[0] + 15, oT[1] - 15); await p.touchscreen.touchMove(dT[0], dT[1]); await p.touchscreen.touchEnd(); await esperar(200);
  chequear(JSON.parse(await programaEnPantalla(p)).length === 1, 'arrastrar con el dedo coloca una tarjeta');
  await p.touchscreen.tap(oT[0], oT[1]); await esperar(150); await p.touchscreen.tap(oT[0], oT[1]); await esperar(150);
  chequear(JSON.parse(await programaEnPantalla(p)).length === 3, 'tocar una tarjeta de la paleta la añade');
  const bp = await centro(p, '.b-play'); await p.touchscreen.tap(bp[0], bp[1]);
  const ft = await esperarFin(p, 20000);
  chequear(ft === 'victoria:3', 'se juega un nivel completo solo con el dedo (' + ft + ')');
  await p.screenshot({ path: SHOTS + '/tableta.png' });
  const tamTarj = await ev(p, () => { const r = document.querySelector('.paleta-carta').getBoundingClientRect(); return Math.min(r.width, r.height); });
  chequear(tamTarj >= 44, 'las tarjetas miden al menos 44 px (' + Math.round(tamTarj) + ' px)');
  await esperar(800); await ev(p, () => document.querySelector('.resultado .b-mapa2').click()); await esperar(300);
  await ev(p, () => { RumboUI.App.ir('ajustes'); }); await esperar(300);
  await ev(p, () => [...document.querySelectorAll('.ajuste')].find(a => /Reducir/.test(a.textContent)).querySelector('button').click()); await esperar(100);
  await ev(p, () => [...document.querySelectorAll('.seg-b')].find(b => b.textContent === 'A++').click()); await esperar(300);
  chequear(await ev(p, () => document.body.classList.contains('reducir') && document.documentElement.style.fontSize === '22px'), 'se pueden reducir las animaciones y agrandar la letra');
  await p.screenshot({ path: SHOTS + '/ajustes.png' });
  chequear(await ev(p, () => RumboUI.Guardado.cargar().ajustes.reducir === true), 'los ajustes se guardan');
  await p.close();

  // =====================================================================
  console.log('\n12. Pantalla estrecha (móvil vertical)');
  p = await pagina({ viewport: { width: 390, height: 780, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } });
  await crearPerfil(p, 'Mov', 'p1');
  await abrirNivel(p, 'm1-04');
  await p.screenshot({ path: SHOTS + '/movil.png' });
  const desborda = await ev(p, () => document.documentElement.scrollWidth > innerWidth + 2);
  chequear(!desborda, 'en móvil vertical no hay desbordamiento horizontal');
  await p.close();

  console.log('\nErrores de consola/página durante las pruebas:', errores.length ? '\n' + errores.slice(0, 12).join('\n') : 'ninguno');
  chequear(errores.length === 0, 'sin errores de JavaScript en la consola');
  await browser.close(); servidor.close();
  console.log(`\nRESULTADO: ${ok} correctas, ${ko} con fallo.`);
  if (ko) { console.log('Fallos:\n - ' + fallos.join('\n - ')); process.exit(1); }
}
main().catch(e => { console.error(e); process.exit(1); });
