/*
 * RUMBO — Pantalla de juego de un nivel: escenario + editor + ejecución + ayudas + resultados.
 * Se usa igual para los niveles del juego, las vistas previas del docente y los retos del Laboratorio.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };

  var ICON = {
    play: '<svg viewBox="0 0 32 32"><path d="M9 5l18 11L9 27z" fill="#fff"/></svg>',
    pausa: '<svg viewBox="0 0 32 32"><rect x="7" y="5" width="7" height="22" rx="2" fill="#fff"/><rect x="18" y="5" width="7" height="22" rx="2" fill="#fff"/></svg>',
    reiniciar: '<svg viewBox="0 0 32 32"><path d="M7 16a9 9 0 1 0 3-7" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M5 4v8h8" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    deshacer: '<svg viewBox="0 0 32 32"><path d="M10 12h10a6 6 0 0 1 0 12h-6" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M14 6l-6 6 6 6" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    borrar: '<svg viewBox="0 0 32 32"><path d="M7 9h18M13 9V5h6v4M9 9l1 18h12l1-18" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    pista: '<svg viewBox="0 0 32 32"><path d="M16 3a9 9 0 0 0-5 16.5V23h10v-3.5A9 9 0 0 0 16 3z" fill="#fff"/><rect x="11" y="25" width="10" height="3.5" rx="1.5" fill="#fff"/></svg>',
    mapa: '<svg viewBox="0 0 32 32"><path d="M4 8l8-3 8 3 8-3v19l-8 3-8-3-8 3z" stroke="#fff" stroke-width="3" stroke-linejoin="round" fill="none"/><path d="M12 5v19M20 8v19" stroke="#fff" stroke-width="3"/></svg>',
    voz: '<svg viewBox="0 0 32 32"><path d="M5 12h5l7-6v20l-7-6H5z" fill="#fff"/><path d="M21 11a7 7 0 0 1 0 10M24 7a12 12 0 0 1 0 18" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',
    ojo: '<svg viewBox="0 0 32 32"><path d="M2 16c6-9 22-9 28 0-6 9-22 9-28 0z" stroke="#fff" stroke-width="3" fill="none"/><circle cx="16" cy="16" r="4.5" fill="#fff"/></svg>',
    velocidad: '<svg viewBox="0 0 32 32"><path d="M4 22a12 12 0 0 1 24 0" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M16 22l6-9" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>',
    sig: '<svg viewBox="0 0 32 32"><path d="M8 5l17 11L8 27z" fill="#fff"/></svg>'
  };
  UI.ICON = ICON;
  function ic(n) { return UI.svgEl(ICON[n], 'ic'); }

  function confeti(cont, n) {
    var cols = ['#ffd93d', '#ff6f91', '#4dd0e1', '#7ad36b', '#b388ff', '#ff9d2e'];
    for (var i = 0; i < (n || 40); i++) {
      var p = h('i.confeti', { style: { left: Math.round(Math.random() * 100) + '%', background: cols[i % cols.length], '--d': (1.6 + Math.random() * 1.6).toFixed(2) + 's', '--r': Math.round(Math.random() * 720 - 360) + 'deg', 'animation-delay': (Math.random() * .6).toFixed(2) + 's' } });
      cont.appendChild(p);
    }
  }
  UI.confeti = confeti;

  function abrir(contenedor, nivel, ctx) {
    var CAT = root.RumboCatalogo, I = root.RumboInterprete, E = root.RumboEstrellas, PR = root.RumboProgreso, VOCES = root.RumboVoces;
    var DEM = root.RumboDemos;
    var perfil = ctx.perfil, aj = ctx.ajustes || {};
    var infantil = nivel.etapa === 'infantil';
    var zona = nivel.zona || 'jardin';
    var disfraz = perfil ? (perfil.disfraz | 0) : 0;
    var fallos = 0, pistaN = 0, solucionMostrada = false, corriendo = false, ejecutado = false, vivo = true, intentoBase = 0;
    var hablaTimer = null;

    var raiz = h('div.juego.zona-' + zona + (infantil ? '.infantil' : '.primaria'), { data: { nivel: nivel.id } });
    contenedor.innerHTML = ''; contenedor.appendChild(raiz);

    // ----------------------------- cabecera y burbuja
    var btnMapa = h('button.btn-ic.b-mapa', { type: 'button', 'aria-label': 'Volver al mapa', title: 'Mapa', on: { click: function () { salir(); } } }, ic('mapa'));
    var titulo = h('div.j-titulo', h('span.t', nivel.titulo || ''), nivel.bloque && !infantil ? h('span.chip', 'Bloque ' + nivel.bloque) : null,
      nivel.tipo === 'depurar' ? h('span.chip.dep', 'Depurar') : null, nivel.tipo === 'optimizar' ? h('span.chip.opt', 'Optimizar') : null);
    var btnVoz = h('button.btn-ic.b-voz', { type: 'button', 'aria-label': 'Escuchar de nuevo', title: 'Escuchar', on: { click: function () { hablar('n_' + nivel.id, true); } } }, ic('voz'));
    var cab = h('header.j-cab', btnMapa, titulo, btnVoz);

    var burbujaAvatar = h('div.avatar'), burbujaTxt = h('div.txt');
    var burbuja = h('div.j-burbuja', burbujaAvatar, burbujaTxt);
    function avatarDe(nombre) { burbujaAvatar.innerHTML = UI.Arte.personaje(nombre || 'Lumo'); }
    function quienIntro() {
      var m = /^([^:«]{2,24}):/.exec(nivel.intro || '');
      if (m) { var n = m[1].replace(/^El |^La /, ''); var hallado = UI.Arte.PERSONAJES.filter(function (p) { return p.toLowerCase() === m[1].toLowerCase() || p.toLowerCase().indexOf(n.toLowerCase()) >= 0; })[0]; return hallado || 'Lumo'; }
      return 'Lumo';
    }
    function mostrarTexto(texto, quien, forzar) {
      avatarDe(quien);
      var ver = !infantil || forzar;
      burbujaTxt.textContent = ver ? texto : '';
      burbuja.classList.toggle('sin-texto', !ver);
      burbuja.classList.add('habla');
      clearTimeout(hablaTimer); hablaTimer = setTimeout(function () { burbuja.classList.remove('habla'); }, 2200);
    }
    function hablar(id, repetir) {
      var linea = VOCES && VOCES.lineas[id]; if (!linea) return;
      var r = null;
      if (aj.voz !== false && ctx.voz) r = ctx.voz.decir(id, { velocidad: infantil ? 0.85 : 0.95, caracter: true });
      var sinVoz = !r || r.modo === 'subtitulo';
      var texto = linea.texto;
      if (id.indexOf('n_') === 0 && !infantil && nivel.intro && !repetir) texto = nivel.intro.replace(/^[^:«.!?]{2,24}:\s*[«"]?/, '').replace(/[»"]$/, '') + '\n' + linea.texto;
      mostrarTexto(texto, id.indexOf('n_') === 0 && !repetir ? quienIntro() : 'Lumo', sinVoz);
    }

    // ----------------------------- escena y editor
    var escenaEl = h('div.j-escena');
    var contObjetos = h('div.j-objetos', { hidden: true });
    var escenaCaja = h('div.j-escena-caja', UI.Escenas.paisaje(zona, { reducir: !!aj.reducir }), escenaEl, contObjetos);
    var progEl = h('div.j-prog');
    var cuenta = h('span.cuenta');
    var aviso = h('div.aviso', { role: 'status', 'aria-live': 'polite' });
    var progCaja = h('div.j-prog-caja', progEl, aviso);
    var cuerpo = h('div.j-cuerpo', escenaCaja, progCaja);
    function mostrarAviso(t) { aviso.textContent = t; aviso.classList.add('v'); clearTimeout(mostrarAviso.t); mostrarAviso.t = setTimeout(function () { aviso.classList.remove('v'); }, 2600); }

    var esc = UI.Escenario.crear(escenaEl, nivel, { disfraz: disfraz, velocidad: aj.velocidad || 1 });
    var totalObj = nivel.mapa.join('').split('o').length - 1;
    if (totalObj > 0) { contObjetos.hidden = false; }
    function pintarObjetos(n) {
      contObjetos.innerHTML = '';
      for (var i = 0; i < totalObj; i++) contObjetos.appendChild(h('span.objeto' + (i < n ? '.ya' : ''), UI.svgEl('<svg viewBox="0 0 64 64">' + UI.Arte.objeto(zona, nivel.skin) + '</svg>', '')));
    }
    pintarObjetos(0);

    var ed = UI.Editor.crear(progEl, nivel, {
      aviso: mostrarAviso,
      alCambiar: function () {
        if (ejecutado && !corriendo) { esc.reiniciar(); pintarObjetos(0); ejecutado = false; }
        actualizarCuenta();
        pistaVisual(null); armarOcio();
      }
    });
    if (nivel.programaInicial) { ed.cargar(nivel.programaInicial); }

    function actualizarCuenta() {
      if (infantil) return;
      var n = ed.contar(), s2 = nivel.estrellas ? nivel.estrellas.s2max : null;
      cuenta.textContent = 'Tarjetas: ' + n + (s2 ? ' · ★★ con ' + s2 + ' o menos' : '');
    }

    // ----------------------------- pie de botones
    var bPlay = h('button.btn-grande.b-play', { type: 'button', 'aria-label': 'Ejecutar el programa', on: { click: ejecutar } }, ic('play'), infantil ? null : h('span', 'Ejecutar'));
    var bPausa = h('button.btn-ic.b-pausa', { type: 'button', 'aria-label': 'Pausar', disabled: true, on: { click: pausar } }, ic('pausa'));
    var bReset = h('button.btn-ic.b-reset', { type: 'button', 'aria-label': 'Reiniciar el nivel', title: 'Reiniciar', on: { click: reiniciar } }, ic('reiniciar'));
    var bUndo = h('button.btn-ic.b-undo', { type: 'button', 'aria-label': 'Deshacer', title: 'Deshacer', on: { click: function () { if (!corriendo) ed.deshacer(); } } }, ic('deshacer'));
    var bClear = h('button.btn-ic.b-clear', { type: 'button', 'aria-label': 'Borrar el programa', title: 'Borrar todo', on: { click: function () { if (!corriendo) ed.limpiar(); } } }, ic('borrar'));
    var bPista = h('button.btn-pista.b-pista', { type: 'button', 'aria-label': 'Pedir una pista', title: 'Pista', on: { click: pista } }, ic('pista'), h('span', 'Pista'));
    var bVel = h('button.btn-ic.b-vel', { type: 'button', 'aria-label': 'Velocidad', title: 'Velocidad', on: { click: velocidad } }, ic('velocidad'));
    var bSol = h('button.btn-txt.b-sol', { type: 'button', hidden: true, on: { click: ensenar } }, 'Lumo te lo enseña');
    var pie = h('footer.j-pie', infantil ? [bUndo, bReset, bPlay, bPista] : [bUndo, bClear, cuenta, bVel, bReset, bPausa, bPlay, bPista, bSol]);
    if (infantil) pie.appendChild(bSol);

    if (nivel.sinSolucion) bPista.hidden = true;
    // La pista se ofrece sola (sin presionar) cuando el alumnado parece perdido: tras fallar dos veces o tras un rato sin tocar nada.
    var ociosoT = null;
    function ofrecerPista(razon) {
      if (!vivo || nivel.sinSolucion || corriendo) return;
      bPista.classList.add('llama');
      if (razon === 'ocio' && !infantil) mostrarAviso('¿Necesitas una pista? Pulsa la bombilla.');
    }
    function armarOcio() {
      clearTimeout(ociosoT);
      if (nivel.sinSolucion) return;
      ociosoT = setTimeout(function () { ofrecerPista('ocio'); }, infantil ? 25000 : 45000);
    }
    raiz.appendChild(cab); raiz.appendChild(burbuja); raiz.appendChild(cuerpo); raiz.appendChild(pie);
    actualizarCuenta();

    function velocidad() {
      var orden = [0.6, 1, 1.7], i = orden.indexOf(aj.velocidad || 1);
      aj.velocidad = orden[(i + 1) % orden.length]; esc.velocidad(aj.velocidad);
      bVel.dataset.v = aj.velocidad; mostrarAviso(aj.velocidad < 1 ? 'Velocidad lenta' : aj.velocidad > 1 ? 'Velocidad rápida' : 'Velocidad normal');
      if (ctx.guardar) ctx.guardar();
    }

    // ----------------------------- ejecución
    function botones(ejec) {
      bPlay.disabled = ejec; bPausa.disabled = !ejec; bUndo.disabled = ejec; bClear.disabled = ejec; bPista.disabled = ejec;
      if (!ejec) { bPausa.innerHTML = ''; bPausa.appendChild(ic('pausa')); }
    }
    function pausar() {
      if (!corriendo) return;
      if (esc.estaPausado()) { esc.continuar(); bPausa.innerHTML = ''; bPausa.appendChild(ic('pausa')); bPausa.setAttribute('aria-label', 'Pausar'); }
      else { esc.pausar(); bPausa.innerHTML = ''; bPausa.appendChild(ic('play')); bPausa.setAttribute('aria-label', 'Continuar'); }
    }
    function reiniciar() {
      esc.cancelar(); corriendo = false; esc.reiniciar(); pintarObjetos(0); ed.resaltar(null); ed.bloquear(false); botones(false); ejecutado = false;
      if (ctx.voz) ctx.voz.parar();
      if (UI.Sonido) UI.Sonido.sfx('toque');
    }
    async function ejecutar() {
      if (corriendo || !vivo) return;
      if (UI.Sonido) UI.Sonido.iniciar();
      if (ed.vacio()) { hablar('fb_vacio'); progCaja.classList.remove('sacude'); void progCaja.offsetWidth; progCaja.classList.add('sacude'); return; }
      var prog = ed.obtener();
      var resultado = I.ejecutar(nivel, prog);
      corriendo = true; ejecutado = true; ed.bloquear(true); botones(true); pintarObjetos(0);
      if (ctx.voz) ctx.voz.parar();
      var fin = await esc.reproducir(resultado, {
        alPaso: function (p) { ed.resaltar(p.ruta); },
        alRecoger: function (n) { pintarObjetos(n); }
      });
      if (!vivo) return;
      corriendo = false; ed.resaltar(null); ed.bloquear(false); botones(false);
      if (fin.cancelado) return;
      if (resultado.ok) victoria(prog, resultado); else fallo(prog, resultado);
    }

    var FB = { choque: 'fb_choque', caida: 'fb_caida', 'objeto-olvidado': 'fb_objeto', 'objetivo-incompleto': 'fb_corto', 'limite-pasos': 'fb_infinito', profundidad: 'fb_infinito', 'programa-vacio': 'fb_vacio', 'receta-inexistente': 'fb_receta', 'programa-invalido': 'fb_casi' };
    function fallo(prog, resultado) {
      fallos++;
      if (!ctx.sinRegistro && perfil) { PR.registrar(perfil, nivel.id, { ok: false, motivo: resultado.motivo, tarjetas: I.contarTarjetas(prog), programa: prog, pistas: pistaN }, I); ctx.guardar && ctx.guardar(); }
      ed.marcarError(resultado.nodoError);
      var id = FB[resultado.motivo] || 'fb_casi';
      if (fallos % 3 === 0 && (resultado.motivo === 'objetivo-incompleto' || resultado.motivo === 'choque')) id = 'fb_orden';
      else if (fallos % 3 === 2 && I.usaTarjeta(nivel.referencia, 'repetir') && !I.usaTarjeta(prog, 'repetir') && !infantil) id = 'fb_repetir';
      if (UI.Sonido) UI.Sonido.sfx('animo');
      hablar(id);
      if (!nivel.sinSolucion && fallos >= (infantil ? 2 : 3)) bSol.hidden = false;
      if (fallos >= 2) ofrecerPista('fallos'); armarOcio();
      raiz.dataset.ultimo = 'fallo:' + resultado.motivo;
    }

    function pistaVisual(tipo) {
      paletaPulso(tipo);
    }
    function paletaPulso(tipo) {
      raiz.querySelectorAll('.paleta-carta.pulso').forEach(function (e) { e.classList.remove('pulso'); });
      if (!tipo) return;
      var b = raiz.querySelector('.paleta-carta[data-tipo="' + tipo + '"]'); if (b) b.classList.add('pulso');
    }
    function pista() {
      if (corriendo) return;
      bPista.classList.remove('llama'); armarOcio();
      if (UI.Sonido) UI.Sonido.sfx('pista');
      pistaN++;
      if (!ctx.sinRegistro && perfil) { PR.anotarPistas(perfil, nivel.id, pistaN); ctx.guardar && ctx.guardar(); }
      if (infantil || !nivel.pistas || !nivel.pistas.length) {
        // Pista visual: la siguiente tarjeta de la solución que todavía no está bien colocada.
        var ref = Array.isArray(nivel.referencia) ? nivel.referencia : (nivel.referencia.principal || []);
        var act = ed.obtener(); act = Array.isArray(act) ? act : act.principal;
        var k = 0; while (k < act.length && k < ref.length && act[k].t === ref[k].t) k++;
        hablar('fb_pista');
        if (k < ref.length) paletaPulso(ref[k].t);
        else mostrarAviso('¡Parece que ya está todo! Pulsa el botón verde.');
        return;
      }
      var k2 = Math.min(pistaN, nivel.pistas.length);
      hablar('h' + k2 + '_' + nivel.id);
      mostrarAviso('Pista ' + k2 + ' de ' + nivel.pistas.length);
    }
    function ensenar() {
      if (corriendo) return;
      solucionMostrada = true; bSol.hidden = true;
      hablar('fb_solucion');
      ed.cargar(nivel.referencia);
      if (UI.Sonido) UI.Sonido.sfx('pista');
      mostrarAviso('Esta es la solución de Lumo. Si la usas, ganas 1 estrella.');
    }

    // ----------------------------- victoria
    function victoria(prog, resultado) {
      var tarjetas = I.contarTarjetas(prog);
      var est = E.calcularEstrellas(nivel, prog, resultado);
      if (solucionMostrada) est = Math.min(est, 1);
      var antesDisf = perfil && !ctx.sinRegistro ? PR.disfracesDesbloqueados(perfil) : [];
      var info = null, nuevos = [], nuevosDisf = [];
      if (!ctx.sinRegistro && perfil) {
        info = PR.registrar(perfil, nivel.id, { ok: true, motivo: 'meta', estrellas: est, tarjetas: tarjetas, programa: prog, pistas: pistaN }, I);
        nuevos = PR.evaluarLogros(perfil);
        nuevosDisf = PR.disfracesDesbloqueados(perfil).filter(function (d) { return antesDisf.indexOf(d) < 0; });
        ctx.guardar && ctx.guardar();
      }
      raiz.dataset.ultimo = 'victoria:' + est;
      var okId = est >= 3 ? 'ok_3' : est === 2 ? 'ok_2' : 'ok_1';
      hablar(infantil ? 'ok_1' : okId);
      setTimeout(function () { if (vivo) resultados(est, tarjetas, info, nuevos, nuevosDisf); }, 500);
    }
    function textoEstrellas() {
      if (!nivel.estrellas) return [];
      var s3 = nivel.estrellas.s3, t3;
      if (s3.tipo === 'usa') t3 = 'Resuélvelo usando la tarjeta «' + UI.Arte.CARTA_NOMBRE[s3.carta] + '»';
      else t3 = 'Resuélvelo con ' + I.contarTarjetas(nivel.referencia) + ' tarjetas o menos';
      return ['Superar el reto', 'Usar ' + nivel.estrellas.s2max + ' tarjetas o menos', t3];
    }
    function ES_CH(id) { var c = root.RumboEscenas.CHISPAS.filter(function (x) { return x.id === id; })[0]; return c ? c.nombre : 'Lumo'; }
    function resultados(est, tarjetas, info, nuevos, nuevosDisf) {
      var ov = h('div.resultado' + (infantil ? '.infantil' : ''), { role: 'dialog', 'aria-label': 'Reto superado' });
      var tarj = h('div.res-tarjeta');
      var VI = root.RumboVictoria, historia = !ctx.sinRegistro && VI && nivel.mundo !== 'sec' && CAT.POR_ID[nivel.id];
      var cel = historia ? VI.celebracion(nivel.id, est) : null;
      var cab = h('div.res-cabeza' + (cel ? '.baile-' + cel.baile : ''));
      cab.appendChild(h('div.res-lumo', { html: UI.Arte.lumo({ expr: 'emocionado', pose: 'arriba', dir: 'S', disfraz: disfraz }) }));
      if (cel && cel.baile === 'abrazo') cab.appendChild(h('div.res-amigo', { 'aria-hidden': 'true', html: UI.Arte.personaje(VI.amigoDe(cel.zona), { expr: 'alegre' }) }));
      if (cel && cel.bichito) cab.appendChild(h('div.res-bichito', { 'aria-hidden': 'true' }, h('div.rb-pj', { html: UI.Arte.personaje('Bichito') }), infantil ? null : h('span.rb-ji', '¡Ji, ji!')));
      var faroRes = null;
      if (cel && !infantil && nivel.mundo >= 1) {
        var fp = VI.faroPequeno(function (id) { return PR.hecho(perfil, id); });
        var vuela = cel.especial === 'chispa-al-faro' && !aj.reducir;
        faroRes = h('div.res-faro' + (fp.luzFinal ? '.encendido' : ''), { 'aria-hidden': 'true', html: UI.Escenas.faroSvg(vuela ? fp.encendidas - 1 : fp.encendidas) });
        if (vuela) {
          cab.appendChild(h('div.res-chispa-vuela', { html: UI.Arte.personaje(ES_CH(cel.chispa), { expr: 'alegre' }) }));
          setTimeout(function () { if (vivo && faroRes) faroRes.innerHTML = UI.Escenas.faroSvg(fp.encendidas); }, 1700);
        }
        cab.appendChild(faroRes);
      }
      tarj.appendChild(cab);
      tarj.appendChild(h('h2', ctx.sinRegistro ? '¡Resuelto!' : infantil ? '¡Muy bien!' : '¡Reto superado!'));
      var fila = h('div.res-estrellas');
      var n = infantil ? 1 : 3;
      for (var i = 0; i < n; i++) fila.appendChild(h('span.est' + (i < est ? '.ganada' : '') , { style: { 'animation-delay': (0.3 + i * 0.35) + 's' } }, UI.svgEl(UI.Arte.estrella(i < est, infantil ? 96 : 64), '')));
      tarj.appendChild(fila);
      if (!infantil && historia && nivel.mundo >= 1) {
        var av = VI.avance(nivel.zona, function (id) { return PR.hecho(perfil, id); });
        if (av) tarj.appendChild(h('div.res-avance' + (av.llegado ? '.llegado' : ''), av.texto));
      }
      if (!infantil) {
        var t = textoEstrellas();
        tarj.appendChild(h('div.res-info', 'Has usado ' + tarjetas + (tarjetas === 1 ? ' tarjeta.' : ' tarjetas.')));
        if (est < 3 && t.length) tarj.appendChild(h('div.res-pista', est < 2 ? '★★: ' + t[1] : '★★★: ' + t[2]));
        if (solucionMostrada) tarj.appendChild(h('div.res-pista', 'Usaste la ayuda de Lumo: inténtalo sin ella para conseguir más estrellas.'));
      }
      if (nuevos && nuevos.length) {
        var fi = h('div.res-ins');
        nuevos.forEach(function (idn) {
          var d = root.RumboLogros.INSIGNIAS.filter(function (x) { return x.id === idn; })[0]; if (!d) return;
          fi.appendChild(h('div.ins-nueva', UI.svgEl(UI.Arte.insignia(d.icono, root.RumboLogros.INSIGNIAS.indexOf(d), false), ''), h('span', '¡Insignia! ' + d.nombre)));
        });
        tarj.appendChild(fi);
      }
      if (nuevosDisf && nuevosDisf.length) {
        nuevosDisf.forEach(function (d) {
          var dd = root.RumboLogros.DISFRACES.filter(function (x) { return x.id === d; })[0];
          tarj.appendChild(h('div.res-disfraz', UI.svgEl(UI.Arte.lumo({ expr: 'feliz', dir: 'S', disfraz: d }), ''), h('span', '¡Nuevo disfraz! ' + (dd ? dd.nombre : ''))));
        });
        if (UI.Sonido) setTimeout(function () { UI.Sonido.sfx('desbloqueo'); }, 900);
      }
      var sig = ctx.sinRegistro ? null : (ctx.siguiente ? ctx.siguiente(nivel.id) : CAT.siguiente(nivel.id));
      var sigOk = sig && perfil && PR.estaDesbloqueado(perfil, sig, {});
      var acciones = h('div.res-acciones');
      acciones.appendChild(h('button.btn-grande.sec.b-repetir', { type: 'button', 'aria-label': 'Jugar otra vez', on: { click: function () { cerrar(); reiniciar(); } } }, ic('reiniciar'), infantil ? null : h('span', 'Repetir')));
      if (ctx.sinRegistro) {
        acciones.appendChild(h('button.btn-grande.b-cont', { type: 'button', on: { click: function () { cerrar(); if (ctx.alResolver) ctx.alResolver({ estrellas: est, tarjetas: tarjetas, programa: ed.obtener() }); } } }, h('span', 'Continuar'), ic('sig')));
      } else {
        acciones.appendChild(h('button.btn-grande.sec.b-mapa2', { type: 'button', 'aria-label': 'Volver al mapa', on: { click: function () { cerrar(); salir({ completado: true }); } } }, ic('mapa'), infantil ? null : h('span', 'Mapa')));
        if (sigOk) acciones.appendChild(h('button.btn-grande.b-sig', { type: 'button', 'aria-label': 'Siguiente nivel', on: { click: function () { cerrar(); if (ctx.alNivel) ctx.alNivel(sig, { desde: nivel.id }); } } }, infantil ? null : h('span', 'Siguiente'), ic('sig')));
      }
      tarj.appendChild(acciones);
      ov.appendChild(tarj);
      var cf = h('div.confeti-caja'); ov.appendChild(cf); confeti(cf, infantil ? 70 : 45);
      raiz.appendChild(ov);
      if (UI.Sonido) setTimeout(function () { UI.Sonido.sfx('estrella'); }, 300);
      function cerrar() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    }

    function salir(extra) { destruir(); if (ctx.alSalir) ctx.alSalir(extra || {}); }

    // ----------------------------- presentación de tarjetas nuevas
    function presentarNuevas(cartas, fin) {
      if (!cartas.length) { fin(); return; }
      var c = cartas[0], d = DEM && DEM.DEMOS[c];
      if (perfil && !ctx.sinRegistro) { PR.marcarCartaVista(perfil, c); ctx.guardar && ctx.guardar(); }
      // En Primaria, las tarjetas de control se explican por pasos (problema → herramienta). En Infantil, una sola demostración.
      var pasos = !infantil && DEM && DEM.PASOS && DEM.PASOS[c] ? DEM.PASOS[c] : [{ texto: DEM && DEM.TEXTOS[c], demo: d }];
      var paso = 0, vivoDemo = true, gen = 0;
      var ov = h('div.nueva-carta' + (infantil ? '.infantil' : ''), { role: 'dialog', 'aria-label': 'Tarjeta nueva' });
      var caja = h('div.nc-caja');
      var demoEl = h('div.nc-demo'), txt = h('p.nc-texto'), puntos = h('div.nc-puntos', { 'aria-hidden': 'true' });
      caja.appendChild(h('div.nc-titulo', h('span.etq', infantil ? '¡Nueva!' : 'Tarjeta nueva'), h('span.carta.grande', { style: { '--c': UI.Arte.CARTA_COLOR[c] } }, UI.svgEl(UI.Arte.iconoCarta(c, 56), 'ic'), infantil ? null : h('span.carta-nombre', UI.Arte.CARTA_NOMBRE[c]))));
      if (d) caja.appendChild(demoEl);
      if (!infantil) { caja.appendChild(txt); if (pasos.length > 1) caja.appendChild(puntos); }
      var ok = h('button.btn-grande.b-entendido', { type: 'button', on: { click: siguiente } });
      caja.appendChild(ok); ov.appendChild(caja); raiz.appendChild(ov);
      if (UI.Sonido) UI.Sonido.sfx('desbloqueo');
      function cerrar() { vivoDemo = false; gen++; if (ctx.voz) ctx.voz.parar(); if (ov.parentNode) ov.parentNode.removeChild(ov); presentarNuevas(cartas.slice(1), fin); }
      function siguiente() { if (paso < pasos.length - 1) { paso++; mostrar(); } else cerrar(); }
      function mostrar() {
        var p = pasos[paso], mi = ++gen;
        txt.textContent = p.texto || '';
        puntos.innerHTML = ''; pasos.forEach(function (_, i) { puntos.appendChild(h('i' + (i === paso ? '.on' : ''))); });
        ok.innerHTML = '';
        if (infantil) ok.appendChild(ic('play')); else ok.appendChild(h('span', paso < pasos.length - 1 ? 'Siguiente' : '¡Entendido!'));
        var idv = paso === 0 ? (infantil ? 'nci_' : 'nc_') + c : null;
        if (ctx.voz && aj.voz !== false) { ctx.voz.parar(); if (!infantil && pasos.length > 1) { var lid = 'ncp_' + c + '_' + paso; if (VOCES.lineas[lid]) ctx.voz.decir(lid); } else if (idv && VOCES.lineas[idv]) ctx.voz.decir(idv); }
        if (p.demo) {
          demoEl.innerHTML = '';
          var demo = UI.Escenario.crear(demoEl, p.demo, { disfraz: disfraz, velocidad: 0.9 });
          (async function bucle() {
            await UI.esperar(700);
            while (vivoDemo && vivo && gen === mi) {
              var r = I.ejecutar(p.demo, p.demo.programa);
              await demo.reproducir(r, {});
              await UI.esperar(900);
              if (!vivoDemo || gen !== mi) break;
              demo.reiniciar(); await UI.esperar(500);
            }
          })();
        }
      }
      mostrar();
    }

    function destruir() {
      vivo = false; clearTimeout(ociosoT); esc.cancelar(); if (ctx.voz) ctx.voz.parar(); clearTimeout(hablaTimer);
    }

    // ----------------------------- arranque
    avatarDe('Lumo');
    // Se explican las tarjetas que este jugador aún no ha visto (también si empieza a mitad de la aventura, p. ej. en 5.º).
    // A partir de 3.º se da por sabido el movimiento básico para no repetir lo trivial.
    var BASICAS = ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'esperar'];
    var saltaBasicas = !infantil && perfil && /^p[3-6]$/.test(perfil.curso || '');
    var nuevas = ctx.sinRegistro || !perfil ? [] : (infantil ? CAT.cartasNuevas(nivel.id) : nivel.cartas.disponibles).filter(function (c) {
      if (perfil.vistos.cartas[c] || !(DEM && DEM.DEMOS[c]) || nivel.cartas.disponibles.indexOf(c) < 0) return false;
      if (saltaBasicas && BASICAS.indexOf(c) >= 0) { PR.marcarCartaVista(perfil, c); return false; }
      return true;
    });
    if (ctx.mostrarTarjetasNuevas) nuevas = CAT.cartasNuevas(nivel.id).filter(function (c) { return DEM && DEM.DEMOS[c]; });
    presentarNuevas(nuevas, function () { hablar('n_' + nivel.id); armarOcio(); });
    if (!nuevas.length) hablar('n_' + nivel.id);

    return { destruir: destruir, editor: ed, escenario: esc, ejecutar: ejecutar, reiniciar: reiniciar, el: raiz,
      estado: function () { return { fallos: fallos, pistas: pistaN, corriendo: corriendo }; } };
  }

  UI.Juego = { abrir: abrir };
})(typeof self !== 'undefined' ? self : this);
