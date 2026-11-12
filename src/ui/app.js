/*
 * RUMBO — Aplicación: router de pantallas, perfiles, mapa de mundos, historia, colección y ajustes.
 * Las pantallas del docente y del Laboratorio se registran desde docente.js y laboratorio.js.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };
  var CAT, PR, I, VOCES, LOG, DEM, G, Ar, ES;
  var App = UI.App = { pantallas: {}, estado: {}, nivelActual: null };

  var ZONA_MUNDO = { 0: 'jardin', 1: 'bosque', 2: 'mar', 3: 'ciudad', 4: 'faro' };

  function perfil() { return App.estado.perfil; }
  function datos() { return App.estado.datos; }
  function guardar() { G.guardar(); }
  function infantil() { return perfil() && PR.esInfantil(perfil()); }
  function opcionesDocente() { return App.estado.docente ? { todo: !!App.estado.docente.todo } : {}; }

  // ---------------------------------------------------------------- arranque
  function iniciar(raiz) {
    CAT = root.RumboCatalogo; PR = root.RumboProgreso; I = root.RumboInterprete; VOCES = root.RumboVoces; LOG = root.RumboLogros; DEM = root.RumboDemos; ES = root.RumboEscenas; Ar = UI.Arte; G = UI.Guardado;
    CAT.registrarVoces();
    Object.keys(DEM.TEXTOS).forEach(function (c) {
      VOCES.lineas['nc_' + c] = { quien: 'Lumo', texto: DEM.TEXTOS[c].replace(/^[^:]+:\s*/, '') };
    });
    Object.keys(DEM.PASOS || {}).forEach(function (c) { DEM.PASOS[c].forEach(function (p, i) { VOCES.lineas['ncp_' + c + '_' + i] = { quien: 'Lumo', texto: p.texto }; }); });
    INTRO.forEach(function (e) { VOCES.lineas[e.id] = { quien: 'Lumo', texto: e.texto }; });
    VOCES.lineas.bienv_1 = { quien: 'Lumo', texto: '¡Bienvenido a RUMBO! ¿Empezamos con la aventura de bienvenida?' };
    Object.keys(DEM.VOZ_INFANTIL).forEach(function (c) { VOCES.lineas['nci_' + c] = { quien: 'Lumo', texto: DEM.VOZ_INFANTIL[c] }; });
    App.raiz = raiz;
    raiz.innerHTML = Ar.defs();
    App.pantalla = h('div.pantalla'); raiz.appendChild(App.pantalla);
    App.avisos = h('div.toasts', { 'aria-live': 'polite' }); raiz.appendChild(App.avisos);
    App.estado.datos = G.cargar();
    App.estado.voz = root.RumboVoz.crearDesdeNavegador({});
    if (datos().ajustes.vozNombre) App.estado.voz.elegirManual(datos().ajustes.vozNombre);
    var act = datos().perfiles.filter(function (p) { return p.id === datos().activo; })[0];
    App.estado.perfil = act || null;
    aplicarAjustes();
    if (!G.persistente()) setTimeout(function () { toast('Este navegador no deja guardar datos: el progreso se perderá al cerrar. Usa «Mi código».', 6000); }, 800);
    if (!datos().ajustes.introVista) intro(function () { ir('portada'); }); else ir('portada');
  }

  function aplicarAjustes() {
    var a = datos().ajustes, b = document.body;
    b.classList.toggle('reducir', !!a.reducir);
    b.classList.toggle('contraste', !!a.contraste);
    b.dataset.fuente = String(a.fuente);
    document.documentElement.style.fontSize = [16, 19, 22][(a.fuente | 0) - 1 || 0] + 'px';
    UI.Sonido.ajustar(a);
    G.guardar();
  }

  function toast(texto, ms) {
    var t = h('div.toast', texto); App.avisos.appendChild(t);
    setTimeout(function () { t.classList.add('fuera'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400); }, ms || 3000);
  }

  var limpiezas = [];
  function ir(nombre, params) {
    limpiezas.forEach(function (f) { try { f(); } catch (e) {} }); limpiezas = [];
    if (App.estado.voz) App.estado.voz.parar();
    var f = App.pantallas[nombre];
    if (!f) throw new Error('pantalla desconocida: ' + nombre);
    App.pantalla.className = 'pantalla p-' + nombre;
    App.pantalla.innerHTML = '';
    document.body.dataset.pantalla = nombre;
    App.estado.pantalla = nombre;
    f(App.pantalla, params || {});
  }
  function alSalirDePantalla(f) { limpiezas.push(f); }

  function registrar(nombre, f) { App.pantallas[nombre] = f; }

  // ---------------------------------------------------------------- piezas comunes
  function boton(texto, clase, fn, icono) {
    return h('button.btn-grande' + (clase ? '.' + clase : ''), { type: 'button', on: { click: function (e) { UI.Sonido.sfx('toque'); fn(e); } } }, icono ? UI.svgEl(icono, 'ic') : null, texto ? h('span', texto) : null);
  }
  function lumoAvatar(clase, expr, d) { return h('div.lumo-av' + (clase ? '.' + clase : ''), { html: Ar.lumo({ expr: expr || 'feliz', dir: 'S', disfraz: d == null ? (perfil() ? perfil().disfraz : 0) : d }) }); }
  function nubes(cont) {
    cont.appendChild(h('div.fondo-capas', h('i.nube.n1'), h('i.nube.n2'), h('i.nube.n3'), h('i.estrellita.e1'), h('i.estrellita.e2'), h('i.estrellita.e3')));
  }
  function cabecera(titulo, opciones) {
    opciones = opciones || {};
    var p = perfil();
    var izq = h('div.cab-izq');
    if (opciones.atras) izq.appendChild(h('button.btn-ic', { type: 'button', 'aria-label': 'Volver', on: { click: function () { UI.Sonido.sfx('toque'); opciones.atras(); } } }, UI.svgEl('<svg viewBox="0 0 32 32"><path d="M20 5L9 16l11 11" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>', 'ic')));
    izq.appendChild(h('h1.cab-titulo', titulo));
    var der = h('div.cab-der');
    if (p && opciones.perfil !== false) {
      var tot = PR.estrellasTotales(p);
      der.appendChild(h('div.chip-perfil', lumoAvatar('mini', 'feliz'), dibujoJugador(p), h('span.nom', p.nombre), PR.esInfantil(p) ? null : h('span.est', UI.svgEl(Ar.estrella(true, 18), ''), String(tot))));
    }
    (opciones.extra || []).forEach(function (e) { der.appendChild(e); });
    return h('header.cabecera', izq, der);
  }
  function btnIcono(svg, etiqueta, fn) {
    return h('button.btn-ic', { type: 'button', 'aria-label': etiqueta, title: etiqueta, on: { click: function () { UI.Sonido.sfx('toque'); fn(); } } }, UI.svgEl(svg, 'ic'));
  }
  var SVG_AJ = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="5" stroke="#fff" stroke-width="3.5" fill="none"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>';
  var SVG_COL = '<svg viewBox="0 0 32 32"><path d="M16 3l3.5 8 8.5.8-6.5 5.7 2 8.5L16 21.5 8.5 26l2-8.5L4 11.8l8.5-.8z" fill="#fff"/></svg>';
  var SVG_COD = '<svg viewBox="0 0 32 32"><rect x="5" y="9" width="22" height="14" rx="3" stroke="#fff" stroke-width="3" fill="none"/><path d="M10 16h2M15 16h2M20 16h2" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';
  var SVG_PROF = '<svg viewBox="0 0 32 32"><path d="M4 12l12-6 12 6-12 6z" fill="#fff"/><path d="M9 15v6c0 2 3 4 7 4s7-2 7-4v-6" stroke="#fff" stroke-width="3" fill="none"/></svg>';

  // ---------------------------------------------------------------- portada
  registrar('portada', function (cont) {
    nubes(cont);
    var p = perfil();
    var centro = h('div.portada-centro');
    centro.appendChild(h('div.logo', { html: Ar.logo() }));
    centro.appendChild(h('p.eslogan', 'Programa el camino. Aprende a pensar.'));
    centro.appendChild(h('div.portada-lumo', lumoAvatar('gigante', 'feliz', p ? p.disfraz : 0)));
    var bs = h('div.portada-botones');
    if (p) {
      bs.appendChild(boton('Jugar como ' + p.nombre, 'principal', function () { ir('mapa'); }, '<svg viewBox="0 0 32 32"><path d="M8 5l18 11L8 27z" fill="#fff"/></svg>'));
      bs.appendChild(boton('Cambiar de jugador', 'sec', function () { ir('jugadores'); }));
    } else {
      bs.appendChild(boton('Jugar', 'principal', function () { ir('jugadores'); }, '<svg viewBox="0 0 32 32"><path d="M8 5l18 11L8 27z" fill="#fff"/></svg>'));
    }
    centro.appendChild(bs);
    cont.appendChild(centro);
    cont.appendChild(h('div.portada-licencia',
      h('a.cc-logo', { href: 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es', target: '_blank', rel: 'license noopener noreferrer', 'aria-label': 'Licencia Creative Commons Reconocimiento-NoComercial-SinObraDerivada 4.0' },
        h('img', { src: 'https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png', alt: 'CC BY-NC-ND 4.0', width: '88', height: '31', loading: 'lazy' })),
      h('p', 'Diseñado por David OZC · © 2026 David. Uso gratuito en centros educativos.'),
      h('p.cc-texto', 'Licencia CC BY-NC-ND 4.0: Reconocimiento · NoComercial · SinObraDerivada.')));
    cont.appendChild(h('div.portada-pie',
      h('button.btn-txt', { type: 'button', on: { click: function () { ir('codigo'); } } }, 'Continuar con un código'),
      h('button.btn-txt', { type: 'button', on: { click: function () { ir('ajustes'); } } }, 'Ajustes'),
      h('button.btn-txt', { type: 'button', on: { click: function () { ir('docente'); } } }, 'Docentes')));
    UI.Sonido.musica('mapa');
  });

  // ---------------------------------------------------------------- intro (3 ilustraciones animadas + subtítulos + voz)
  var INTRO = [
    { img: 'intro/escena-1.jpg', id: 'intro_1', texto: '¡Hola! Soy Lumo.', dur: 3000, mov: 'a' },
    { img: 'intro/escena-2.jpg', id: 'intro_2', texto: 'Mi brújula se ha roto y el Faro se ha apagado.', dur: 2900, mov: 'b' },
    { img: 'intro/escena-3.jpg', id: 'intro_3', texto: '¿Me ayudas a encontrar el camino?', dur: 3900, mov: 'c' }
  ];

  function intro(fin) {
    var ov = h('div.intro', { role: 'dialog', 'aria-label': 'Presentación de RUMBO' });
    var capas = INTRO.map(function (e) { var im = h('img.intro-img.mov-' + e.mov, { src: e.img, alt: '', draggable: 'false' }); var c = h('div.intro-capa', im); ov.appendChild(c); return c; });
    ov.appendChild(h('div.intro-brillos', { 'aria-hidden': 'true' }, [1, 2, 3, 4, 5, 6, 7, 8].map(function (k) { return h('i.b' + k); })));
    var sub = h('div.intro-sub', { 'aria-live': 'polite' });
    var saltar = h('button.btn-txt.intro-saltar', { type: 'button', on: { click: cerrar } }, 'Saltar');
    ov.appendChild(sub); ov.appendChild(saltar);
    document.body.appendChild(ov);
    UI.Sonido.musica('mapa');
    var cerrado = false, tim = null, k = 0, audio = null, vozNav = false;
    // Voz grabada de Lumo (ElevenLabs). Los tiempos de las escenas siguen sus pausas; si no puede sonar, se usa la voz del navegador.
    if (datos().ajustes.voz !== false) {
      try {
        audio = new Audio('intro/voz-lumo.mp3'); audio.preload = 'auto';
        audio.addEventListener('error', function () { vozNav = true; });
      } catch (e) { audio = null; }
    }
    function cerrar() {
      if (cerrado) return; cerrado = true; clearTimeout(tim);
      if (audio) { try { audio.pause(); } catch (e) {} }
      if (App.estado.voz) App.estado.voz.parar();
      datos().ajustes.introVista = true; G.guardar();
      ov.classList.add('sale');
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); fin(); }, 450);
    }
    function paso() {
      if (cerrado) return;
      if (k >= INTRO.length) { cerrar(); return; }
      var e = INTRO[k];
      capas.forEach(function (c, j) { c.classList.toggle('on', j === k); });
      sub.textContent = e.texto; sub.classList.remove('in'); void sub.offsetWidth; sub.classList.add('in');
      var habla = datos().ajustes.voz !== false && App.estado.voz;
      if (k === 0 && audio) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { vozNav = true; if (!cerrado && habla) App.estado.voz.decir(INTRO[Math.max(0, k - 1)].id, { velocidad: 0.95 }); });
      } else if ((!audio || vozNav) && habla) App.estado.voz.decir(e.id, { velocidad: 0.95 });
      k++; tim = setTimeout(paso, e.dur);
    }
    ov.addEventListener('click', function (ev) { if (ev.target === saltar) return; clearTimeout(tim); paso(); });   // toca para pasar a la siguiente
    paso();
  }
  App.intro = function () { intro(function () {}); };

  // Protección de datos: no se pide ningún nombre. Cada jugador es «Jugador N» y se distingue por un dibujo.
  function perfilAnonimo(curso) {
    var ps = datos().perfiles, mayor = 0, usados = {};
    ps.forEach(function (q) { var m = /^Jugador (\d+)$/.exec(q.nombre || ''); if (m) mayor = Math.max(mayor, +m[1]); if (q.picto != null) usados[q.picto] = true; });
    var picto = 0; for (var k = 0; k < 12; k++) if (!usados[k]) { picto = k; break; }
    if (ps.length >= 12) picto = ps.length % 12;
    var p = PR.crearPerfil({ nombre: 'Jugador ' + (mayor + 1), curso: curso });
    p.picto = picto; return p;
  }
  function dibujoJugador(p, tam) { return p && p.picto != null ? h('span.picto-jug', { 'aria-hidden': 'true' }, UI.svgEl(Ar.picto(p.picto), '')) : null; }

  // ---------------------------------------------------------------- jugadores
  registrar('jugadores', function (cont) {
    nubes(cont);
    cont.appendChild(cabecera('¿Quién juega?', { atras: function () { ir('portada'); }, perfil: false }));
    var lista = h('div.jugadores');
    datos().perfiles.forEach(function (p) {
      var curso = CAT.cursoDe(p.curso);
      lista.appendChild(h('button.tarjeta-jugador', { type: 'button', on: { click: function () {
        UI.Sonido.sfx('toque'); App.estado.perfil = p; datos().activo = p.id; guardar(); ir('mapa'); } } },
        lumoAvatar('med', 'feliz', p.disfraz), dibujoJugador(p), h('span.nom', p.nombre), h('span.cur', curso ? curso.nombre : ''),
        PR.esInfantil(p) ? null : h('span.est', UI.svgEl(Ar.estrella(true, 16), ''), String(PR.estrellasTotales(p)))));
    });
    lista.appendChild(h('button.tarjeta-jugador.nuevo', { type: 'button', on: { click: function () { UI.Sonido.sfx('toque'); ir('nuevo-jugador'); } } },
      h('span.mas', '+'), h('span.nom', 'Nuevo jugador')));
    cont.appendChild(lista);
    cont.appendChild(h('div.portada-pie', h('button.btn-txt', { type: 'button', on: { click: function () { ir('codigo'); } } }, 'Tengo un código de partida')));
  });

  registrar('nuevo-jugador', function (cont) {
    nubes(cont);
    cont.appendChild(cabecera('Nuevo jugador', { atras: function () { ir('jugadores'); }, perfil: false }));
    var cursoSel = 'p1';
    var chips = h('div.cursos');
    function pintar() {
      chips.innerHTML = '';
      [['Educación Infantil', ['inf3', 'inf4', 'inf5']], ['Primaria', ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']]].forEach(function (g) {
        var fila = h('div.fila-cursos', h('div.etq', g[0]));
        g[1].forEach(function (c) {
          var cu = CAT.cursoDe(c);
          fila.appendChild(h('button.chip-curso' + (c === cursoSel ? '.sel' : ''), { type: 'button', 'aria-pressed': String(c === cursoSel), on: { click: function () { cursoSel = c; UI.Sonido.sfx('toque'); pintar(); } } }, cu.nombre));
        });
        chips.appendChild(fila);
      });
    }
    pintar();
    var form = h('div.formulario', h('p.aviso-datos', 'No hace falta escribir ningún nombre: tu partida se guarda solo en este navegador.'), h('div.etq.grande', '¿En qué curso estás?'), chips,
      boton('¡Vamos!', 'principal', function () {
        var p = perfilAnonimo(cursoSel);
        datos().perfiles.push(p); datos().activo = p.id; App.estado.perfil = p; guardar();
        if (UI.Sonido) UI.Sonido.sfx('desbloqueo');
        ir('mapa');
      }));
    cont.appendChild(form);
  });

  // ---------------------------------------------------------------- continuar con un código
  registrar('codigo', function (cont) {
    nubes(cont);
    cont.appendChild(cabecera('Continuar con un código', { atras: function () { ir(perfil() ? 'jugadores' : 'portada'); }, perfil: false }));
    var modo = 'texto', picks = [];
    var cuerpo = h('div.formulario.codigo');
    function pintar() {
      cuerpo.innerHTML = '';
      var msg = h('div.msg-error', { role: 'alert' });
      cuerpo.appendChild(h('div.tabs',
        h('button.tab' + (modo === 'texto' ? '.sel' : ''), { type: 'button', on: { click: function () { modo = 'texto'; pintar(); } } }, 'Con letras y números'),
        h('button.tab' + (modo === 'dibujos' ? '.sel' : ''), { type: 'button', on: { click: function () { modo = 'dibujos'; pintar(); } } }, 'Con dibujos')));
      var recoger;
      if (modo === 'texto') {
        var cod = h('textarea.campo.codigo-texto', { rows: '2', placeholder: 'Pega o escribe el código', 'aria-label': 'Código', spellcheck: 'false', autocapitalize: 'characters' });
        cuerpo.appendChild(h('label', h('span.etq', 'Código de partida'), cod));
        recoger = function () { return cod.value; };
      } else {
        var ranuras = h('div.ranuras'), rejilla = h('div.rejilla-pictos');
        var pintarR = function () {
          ranuras.innerHTML = '';
          for (var i = 0; i < 6; i++) ranuras.appendChild(h('span.ranura' + (picks[i] != null ? '.llena' : ''), picks[i] != null ? UI.svgEl(Ar.picto(picks[i]), '') : String(i + 1)));
        };
        for (var k = 0; k < 12; k++) (function (k) {
          rejilla.appendChild(h('button.picto', { type: 'button', 'aria-label': Ar.PICTO_NOMBRE[k], on: { click: function () { if (picks.length < 6) { picks.push(k); UI.Sonido.sfx('poner'); pintarR(); } } } }, UI.svgEl(Ar.picto(k), '')));
        })(k);
        pintarR();
        cuerpo.appendChild(h('div.etq', 'Toca los 6 dibujos en orden'));
        cuerpo.appendChild(ranuras); cuerpo.appendChild(rejilla);
        cuerpo.appendChild(h('button.btn-txt', { type: 'button', on: { click: function () { picks.pop(); pintarR(); } } }, 'Borrar el último'));
        recoger = function () { return picks.slice(); };
      }
      cuerpo.appendChild(msg);
      cuerpo.appendChild(boton('Recuperar mi partida', 'principal', function () {
        var r = PR.desdeCodigo(recoger(), 'Jugador');
        if (!r.ok) { msg.textContent = 'Ese código no es válido. Revisa que no falte ni sobre ningún símbolo.'; UI.Sonido.sfx('choque'); return; }
        var an = perfilAnonimo(r.perfil.curso); r.perfil.nombre = an.nombre; r.perfil.picto = an.picto;
        datos().perfiles.push(r.perfil); datos().activo = r.perfil.id; App.estado.perfil = r.perfil; guardar();
        UI.Sonido.sfx('desbloqueo'); toast('¡Partida recuperada!'); ir('mapa');
      }));
    }
    pintar(); cont.appendChild(cuerpo);
  });

  // ---------------------------------------------------------------- mapa de mundos
  function pestanaMundos() {
    var p = perfil();
    if (PR.esInfantil(p)) return [0];
    return [1, 2, 3, 4];
  }
  function miniaturaMundo(m) {
    var zona = CAT.MUNDOS[m].zonas[0], T = Ar.TEMAS[zona];
    var cs = '';
    for (var y = 0; y < 2; y++) for (var x = 0; x < 4; x++) cs += '<g transform="translate(' + (x * 64) + ' ' + (y * 64) + ')">' + Ar.celda(x === 2 && y === 0 ? '#' : x === 1 && y === 1 ? '~' : '.', zona, x, y, {}) + '</g>';
    return '<svg viewBox="0 0 256 128" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + cs + '</svg>';
  }
  function labDisponible() {
    var p = perfil();
    if (App.estado.docente && App.estado.docente.todo) return true;
    if (p.desbloqueo && p.desbloqueo.lab) return true;
    if (PR.esInfantil(p)) { var k = p.curso === 'inf3' ? 3 : p.curso === 'inf4' ? 4 : 5; return PR.itinerarioCompleto(p, k); }
    return PR.finalHecho(p);
  }
  registrar('mapa', function (cont) {
    var p = perfil(); if (!p) { ir('jugadores'); return; }
    nubes(cont);
    UI.Sonido.musica('mapa');
    cont.appendChild(cabecera('Mapa de mundos', { atras: function () { ir('portada'); }, extra: [
      btnIcono(SVG_COL, 'Colección', function () { ir('coleccion'); }),
      btnIcono(SVG_COD, 'Mi código', function () { mostrarMiCodigo(); }),
      btnIcono(SVG_AJ, 'Ajustes', function () { ir('ajustes'); })] }));
    if (!infantil()) {
      var bv = PR.bienvenida(p);
      var textoBv = bv.completa ? 'Completada. Puedes repetirla cuando quieras.' : bv.hechos ? bv.hechos + ' de ' + bv.total + ' retos. ¡Sigue con Lumo!' : bv.total + ' retos cortos con Lumo para conocer las tarjetas y la historia.';
      cont.appendChild(h('div.mapa-bienvenida' + (bv.completa ? '.hecha' : ''),
        h('div.bv-lumo', { html: Ar.lumo({ expr: 'feliz', dir: 'S', disfraz: p.disfraz }) }),
        h('div.bv-txt', h('div.bv-tit', 'Aventura de bienvenida'), h('div.bv-sub', textoBv), h('div.barra', h('i', { style: { width: Math.round(bv.hechos / bv.total * 100) + '%' } }))),
        h('button.btn-grande.b-bienvenida' + (bv.completa ? '.sec' : '.principal'), { type: 'button', on: { click: function () {
          UI.Sonido.sfx('toque');
          if (bv.completa) { p.bienvenida = 'aceptada'; guardar(); jugarNivel(CAT.BIENVENIDA[0]); } else empezarBienvenida(); } } },
          h('span', bv.completa ? 'Repetir' : bv.hechos ? 'Continuar' : '¡Empezar!'))));
      if (PR.debeRecomendarBienvenida(p)) recomendarBienvenida();
    }
    var grid = h('div.mundos' + (infantil() ? '.uno' : ''));
    var opc = opcionesDocente();
    pestanaMundos().forEach(function (m) {
      var M = CAT.MUNDOS[m], abierto = PR.mundoAbierto(p, m, opc);
      var comp = PR.completadosMundo(p, m), tot = M.niveles.length;
      var est = m === 0 ? null : PR.estrellasMundo(p, m);
      var cls = 'mundo-tarjeta' + (abierto ? '' : '.cerrado') + (comp === tot ? '.completo' : '');
      var tarj = h('button.' + cls, { type: 'button', style: { '--col': M.color }, 'aria-disabled': String(!abierto), on: { click: function () {
        if (!abierto) { UI.Sonido.sfx('choque'); toast(m === 4 ? 'El Faro se abre al terminar el Mundo 3.' : 'Termina el mundo anterior para abrir este.'); return; }
        UI.Sonido.sfx('toque'); ir('mundo', { mundo: m }); } } },
        h('div.mt-arte', { html: miniaturaMundo(m) }),
        h('div.mt-info', h('div.mt-nombre', M.nombre), h('div.mt-edad', M.edades), h('p.mt-desc', M.descripcion),
          h('div.barra', h('i', { style: { width: Math.round(comp / tot * 100) + '%' } })),
          h('div.mt-prog', comp + ' de ' + tot + (est != null ? ' · ★ ' + est + '/' + (tot * 3) : ''))),
        abierto ? null : h('div.mt-candado', UI.svgEl(Ar.candado(), '')));
      grid.appendChild(tarj);
    });
    cont.appendChild(grid);
    // Laboratorio
    var lab = labDisponible();
    cont.appendChild(h('div.mapa-lab', h('button.btn-grande.lab' + (lab ? '' : '.cerrado'), { type: 'button', on: { click: function () {
      if (!lab) { UI.Sonido.sfx('choque'); toast(infantil() ? 'El Laboratorio se abre al terminar tu camino.' : 'El Laboratorio se abre al encender el Faro Mayor.'); return; }
      UI.Sonido.sfx('toque'); ir('laboratorio'); } } }, UI.svgEl(Ar.insignia('lab', 5, !lab), 'lab-ic'), h('span', 'Laboratorio de programación'), lab ? null : UI.svgEl(Ar.candado(), 'cand'))));
    // Botón continuar
    var sig = PR.siguientePendiente(p);
    if (sig) cont.appendChild(h('div.mapa-cont', boton(infantil() ? '' : 'Continuar', 'principal', function () { jugarNivel(sig); }, '<svg viewBox="0 0 32 32"><path d="M8 5l18 11L8 27z" fill="#fff"/></svg>')));
  });

  // Recomendación al empezar: se muestra una sola vez por jugador (se pueda aceptar o dejar para después).
  function recomendarBienvenida() {
    var p = perfil();
    var ov = h('div.modal.bienvenida', { role: 'dialog', 'aria-label': 'Aventura de bienvenida' });
    function cerrar(estado) { p.bienvenida = estado; guardar(); if (App.estado.voz) App.estado.voz.parar(); if (ov.parentNode) ov.parentNode.removeChild(ov); }
    var c = h('div.modal-caja', h('div.bv-lumo.grande', { html: Ar.lumo({ expr: 'feliz', dir: 'S', disfraz: p.disfraz }) }),
      h('h2', '¡Bienvenido a RUMBO!'),
      h('p', 'Te recomendamos empezar con la aventura de bienvenida: ' + CAT.BIENVENIDA.length + ' retos muy cortos con Lumo para aprender a usar las tarjetas y conocer la historia.'),
      h('div.res-acciones',
        h('button.btn-grande.principal.b-bv-si', { type: 'button', on: { click: function () { cerrar('aceptada'); UI.Sonido.sfx('toque'); empezarBienvenida(); } } }, h('span', '¡Vamos!')),
        h('button.btn-grande.sec.b-bv-no', { type: 'button', on: { click: function () { cerrar('omitida'); } } }, h('span', 'Ahora no'))),
      h('p.nota', 'Podrás jugarla cuando quieras desde el mapa.'));
    ov.appendChild(c); document.body.appendChild(ov);
    if (datos().ajustes.voz !== false && App.estado.voz) App.estado.voz.decir('bienv_1', { velocidad: 0.95 });
  }

  function mostrarMiCodigo() {
    var p = perfil(), r = PR.aCodigo(p);
    var ov = h('div.modal', { role: 'dialog', 'aria-label': 'Mi código' });
    var c = h('div.modal-caja', h('h2', 'Mi código de partida'));
    if (r.tipo === 'pictos') {
      c.appendChild(h('p', 'Apunta estos dibujos en orden. Te servirán para continuar en otro equipo.'));
      var fila = h('div.ranuras.grande');
      r.codigo.forEach(function (n) { fila.appendChild(h('span.ranura.llena', UI.svgEl(Ar.picto(n), ''))); });
      c.appendChild(fila);
    } else {
      c.appendChild(h('p', 'Apunta este código. Te servirá para continuar en otro equipo.'));
      c.appendChild(h('div.codigo-grande', String(r.codigo)));
      if (!PR.esInfantil(p)) c.appendChild(h('p.nota', 'Recupera tus mundos desbloqueados y tus estrellas por mundo (no el detalle de cada nivel).'));
    }
    c.appendChild(h('button.btn-grande.principal', { type: 'button', on: { click: function () { document.body.removeChild(ov); } } }, h('span', 'Cerrar')));
    ov.appendChild(c); document.body.appendChild(ov);
  }

  // ---------------------------------------------------------------- niveles de un mundo
  registrar('mundo', function (cont, params) {
    var p = perfil(), m = params.mundo, M = CAT.MUNDOS[m];
    var opc = opcionesDocente();
    cont.style.setProperty('--col', M.color);
    cont.classList.add('zona-' + M.zonas[0]);
    nubes(cont);
    UI.Sonido.musica(M.zonas[0]);
    cont.appendChild(cabecera(M.nombre, { atras: function () { ir('mapa'); } }));
    var cuerpo = h('div.niveles-cuerpo');
    function nodo(n, idx, grande) {
      var ok = PR.estaDesbloqueado(p, n.id, opc), hecho = PR.hecho(p, n.id), est = PR.estrellasNivel(p, n.id);
      var tipo = n.tipo === 'depurar' ? '.dep' : n.tipo === 'optimizar' ? '.opt' : '';
      var b = h('button.nodo' + (hecho ? '.hecho' : ok ? '.abierto' : '.cerrado') + tipo + (grande ? '.grande' : ''), { type: 'button', data: { nivel: n.id },
        'aria-label': 'Nivel ' + (idx + 1) + ': ' + n.titulo + (hecho ? ', superado' : ok ? '' : ', bloqueado'), on: { click: function () {
          if (!ok) { UI.Sonido.sfx('choque'); toast('Supera el reto anterior para abrir este.'); return; }
          UI.Sonido.sfx('toque'); jugarNivel(n.id); } } },
        h('span.num', String(idx + 1)),
        !ok ? UI.svgEl(Ar.candado(), 'cand') : null,
        (hecho && n.etapa !== 'infantil') ? h('span.nodo-est', [1, 2, 3].map(function (k) { return UI.svgEl(Ar.estrella(k <= est, 14), ''); })) : null,
        (hecho && n.etapa === 'infantil') ? h('span.nodo-est', UI.svgEl(Ar.estrella(true, 22), '')) : null,
        (!infantil() && n.etapa !== 'infantil') ? h('span.nodo-t', n.titulo) : null);
      return b;
    }
    if (m === 0) {
      [3, 4, 5].forEach(function (k) {
        var ab = PR.itinerarioAbierto(p, k, opc);
        if (!ab) return;
        var icono = k === 3 ? 'flor' : k === 4 ? 'zanahoria' : 'concha';
        var nombre = k === 3 ? 'Pequeños exploradores' : k === 4 ? 'Aventureros del camino' : 'Guardianes de los patrones';
        var fila = h('section.itinerario', h('div.it-cab', UI.svgEl(Ar.insignia(icono, k, false), 'it-ic'), h('div', h('div.it-nombre', nombre), h('div.it-edad', k + ' años'))));
        var ruta = h('div.ruta');
        CAT.ITINERARIOS[k].forEach(function (id, i) { ruta.appendChild(nodo(CAT.POR_ID[id], i, true)); });
        fila.appendChild(ruta); cuerpo.appendChild(fila);
      });
    } else {
      var zonas = M.zonas;
      var porZona = {};
      M.niveles.forEach(function (n, i) { (porZona[n.zona] = porZona[n.zona] || []).push([n, i]); });
      zonas.forEach(function (z) {
        var sec = h('section.itinerario.zona-' + z, h('div.it-cab', h('div.it-nombre', Ar.NOMBRES_ZONA[z])));
        var ruta = h('div.ruta');
        (porZona[z] || []).forEach(function (par) { ruta.appendChild(nodo(par[0], par[1], false)); });
        sec.appendChild(ruta); cuerpo.appendChild(sec);
      });
      // secreto asociado a este mundo
      var sec = CAT.SECRETOS.filter(function (s) { return s.secreto === m; })[0];
      if (sec) {
        var req = CAT.REQUISITO_SECRETO[m - 1], tengo = PR.estrellasMundo(p, req.mundo), abierto = PR.estaDesbloqueado(p, sec.id, opc);
        var s = h('section.itinerario.secreto', h('div.it-cab', UI.svgEl(Ar.insignia('llave', 6, !abierto), 'it-ic'), h('div', h('div.it-nombre', 'Reto secreto'), h('div.it-edad', abierto ? sec.titulo : 'Reúne ' + req.estrellas + ' estrellas en este mundo (' + Math.min(tengo, req.estrellas) + '/' + req.estrellas + ')'))));
        var ruta2 = h('div.ruta'); var nn = nodo(sec, 0, false); nn.querySelector('.num').textContent = '?'; ruta2.appendChild(nn); s.appendChild(ruta2); cuerpo.appendChild(s);
      }
    }
    cont.appendChild(cuerpo);
  });

  // ---------------------------------------------------------------- jugar un nivel
  function jugarNivel(id, opciones) {
    var n = CAT.POR_ID[id]; if (!n) return;
    antesDe(id, function () {
      App.nivelActual = id;
      limpiezas.forEach(function (f) { try { f(); } catch (e) {} }); limpiezas = [];
      App.pantalla.className = 'pantalla p-juego'; App.pantalla.innerHTML = ''; document.body.dataset.pantalla = 'juego';
      App.estado.pantalla = 'juego';
      UI.Sonido.musica(n.zona || 'jardin');
      var ctl = UI.Juego.abrir(App.pantalla, n, {
        siguiente: enBienvenida(id) ? function (x) { return CAT.BIENVENIDA[CAT.BIENVENIDA.indexOf(x) + 1] || null; } : null,
        perfil: perfil(), ajustes: datos().ajustes, voz: App.estado.voz, guardar: guardar, sinRegistro: !!(opciones && opciones.sinRegistro) || !!(App.estado.docente && App.estado.docente.vista),
        alSalir: function (extra) {
          if (App.estado.docente && App.estado.docente.vista) { App.estado.docente.vista = false; ir('docente'); return; }
          volverTras(n, extra && extra.completado);
        },
        alNivel: function (sig) { despuesDe(n.id, function () { jugarNivel(sig); }); },
        alResolver: function () { if (App.estado.docente && App.estado.docente.vista) { App.estado.docente.vista = false; ir('docente'); } }
      });
      App.estado.controlJuego = ctl;
      alSalirDePantalla(function () { ctl.destruir(); });
    });
  }
  // Juega un nivel que no está en el catálogo (retos del Laboratorio). No registra estrellas.
  function jugarObjeto(n, o) {
    o = o || {};
    limpiezas.forEach(function (f) { try { f(); } catch (e) {} }); limpiezas = [];
    root.RumboVoces.lineas['n_' + n.id] = { quien: 'Lumo', texto: n.objetivo || 'Lleva a Lumo hasta la meta.' };
    App.pantalla.className = 'pantalla p-juego'; App.pantalla.innerHTML = ''; document.body.dataset.pantalla = 'juego'; App.estado.pantalla = 'juego';
    UI.Sonido.musica(n.zona || 'jardin');
    var ctl = UI.Juego.abrir(App.pantalla, n, { perfil: perfil(), ajustes: datos().ajustes, voz: App.estado.voz, guardar: guardar, sinRegistro: true,
      alSalir: o.alSalir || function () { ir('laboratorio'); }, alResolver: o.alResolver || function () { ir('laboratorio'); } });
    App.estado.controlJuego = ctl;
    alSalirDePantalla(function () { ctl.destruir(); });
    return ctl;
  }
  // Aventura de bienvenida: retos de Infantil que se ofrecen al alumnado de Primaria; al terminar, se vuelve al mapa (no al mundo de Infantil).
  function enBienvenida(id) { return !infantil() && CAT.BIENVENIDA.indexOf(id) >= 0; }
  function empezarBienvenida() {
    var p = perfil(), b = PR.bienvenida(p);
    p.bienvenida = 'aceptada'; guardar();
    jugarNivel(b.siguiente || CAT.BIENVENIDA[0]);
  }
  // Cierre de la aventura de bienvenida: anima a empezar la historia con el reto que le toca a su curso.
  function finBienvenida() {
    var p = perfil(); if (!p || document.querySelector('.modal.fin-bienvenida')) return;
    var sig = PR.siguientePendiente(p), M = sig && CAT.POR_ID[sig] ? CAT.mundoDe(sig) : null;
    var ov = h('div.modal.fin-bienvenida', { role: 'dialog', 'aria-label': 'Aventura de bienvenida completada' });
    function cerrar() { if (App.estado.voz) App.estado.voz.parar(); if (ov.parentNode) ov.parentNode.removeChild(ov); }
    var c = h('div.modal-caja', h('div.bv-lumo.grande.baila', { html: Ar.lumo({ expr: 'feliz', dir: 'S', disfraz: p.disfraz }) }),
      h('h2', '¡Ya estás listo para la aventura!'),
      h('p', 'Has aprendido a mover a Lumo, girar y recoger. Ahora empieza la historia: ayúdale a arreglar su brújula y a encender el Faro Mayor.'),
      M ? h('p.nota', 'Tu primera parada: ' + M.nombre + '.') : null,
      h('div.res-acciones',
        sig ? h('button.btn-grande.principal.b-historia', { type: 'button', on: { click: function () { cerrar(); UI.Sonido.sfx('toque'); jugarNivel(sig); } } }, h('span', '¡Empezar la historia!')) : null,
        h('button.btn-grande.sec.b-mapa-bv', { type: 'button', on: { click: cerrar } }, h('span', 'Ver el mapa'))));
    ov.appendChild(c); document.body.appendChild(ov);
    var cf = h('div.confeti-caja'); ov.appendChild(cf); try { UI.confeti ? UI.confeti(cf, 50) : null; } catch (e) {}
    UI.Sonido.sfx('victoria');
  }
  function volverTras(n, completado) {
    if (enBienvenida(n.id)) {
      var b = PR.bienvenida(perfil());
      var vuelta0 = function () {
        ir('mapa');
        if (completado && b.completa && !perfil().bienvenidaFin) { perfil().bienvenidaFin = true; guardar(); setTimeout(finBienvenida, 350); }
      };
      if (completado) despuesDe(n.id, vuelta0); else vuelta0();
      return;
    }
    var mundo = n.mundo === 'sec' ? (n.secreto || 1) : n.mundo;
    var vuelta = function () { ir('mundo', { mundo: mundo }); };
    if (completado) despuesDe(n.id, vuelta); else vuelta();
  }

  // ---------------------------------------------------------------- historia: disparadores y escenas
  // Los disparadores, las etapas y las frases de cada escena viven en src/datos/escenas.js (datos + función pura probada).
  function escenasPendientes(cuando, idNivel) {
    var p = perfil(); if (!p || (App.estado.docente && App.estado.docente.vista)) return [];
    return ES.pendientes({ cuando: cuando, nivel: idNivel, infantil: infantil(), vistas: p.vistos.escenas, esFinalDelCurso: CAT.finalDe(p.curso) === idNivel });
  }
  function antesDe(id, fn) { reproducirEscenas(escenasPendientes('antes', id), fn); }
  function despuesDe(id, fn) { reproducirEscenas(escenasPendientes('despues', id), fn); }

  function lineasDeEscena(e) { return ES.lineasDe(e); }
  function reproducirEscenas(lista, fin) {
    if (!lista.length) { fin(); return; }
    var e = lista[0], resto = lista.slice(1);
    var sigue = function () { reproducirEscenas(resto, fin); };
    PR.marcarEscenaVista(perfil(), e);
    (ES.POR_ID[e].marca || []).forEach(function (m) { PR.marcarEscenaVista(perfil(), m); });
    guardar();
    mostrarEscena(e, sigue);
  }
  // Una escena con créditos los muestra primero y, si además tiene frases (p. ej. el avance del siguiente mundo), las dice después.
  function mostrarEscena(id, fin) {
    var d = ES.POR_ID[id]; if (!d) { fin(); return; }
    var lineas = lineasDeEscena(id);
    var dichas = function () { if (lineas.length) escena(id, lineas, fin); else fin(); };
    if (d.creditos) creditos(d.creditos, dichas); else dichas();
  }
  UI.reproducirEscena = function (id, fin) { mostrarEscena(id, fin || function () {}); };

  function escena(id, lineas, fin) {
    var zona = ES.zonaDe(id);
    var T = Ar.TEMAS[zona];
    var inf = infantil() || (ES.POR_ID[id] && ES.POR_ID[id].etapa === 'infantil');
    var ov = h('div.escena.zona-' + zona, { role: 'dialog', 'aria-label': 'Escena de la historia', style: { '--c1': T.cielo[0], '--c2': T.cielo[1] } });
    var suelo = h('div.escena-suelo', { style: { background: T.c1 } });
    var izq = h('div.act.izq'), der = h('div.act.der');
    var burbuja = h('div.escena-burbuja'), nombre = h('div.escena-nombre'), txt = h('div.escena-texto');
    burbuja.appendChild(nombre); burbuja.appendChild(txt);
    var cerrado = false, i = 0;
    var sig = h('button.btn-grande.principal.b-sig-esc', { type: 'button', 'aria-label': 'Siguiente', on: { click: avanzar } }, UI.svgEl(UI.ICON.sig, 'ic'));
    var saltar = h('button.btn-txt.b-saltar', { type: 'button', on: { click: cerrar } }, 'Saltar escena');
    ov.appendChild(h('i.nube.n1')); ov.appendChild(h('i.nube.n2'));
    ov.appendChild(suelo); ov.appendChild(izq); ov.appendChild(der); ov.appendChild(burbuja); ov.appendChild(sig); ov.appendChild(saltar);
    document.body.appendChild(ov);
    UI.Sonido.musica(zona);
    function cerrar() {
      if (cerrado) return; cerrado = true; App.estado.voz.parar();
      if (ov.parentNode) ov.parentNode.removeChild(ov); fin();
    }
    function mostrar() {
      var id_ = lineas[i], l = VOCES.lineas[id_];
      var quien = l.quien;
      var avatarL = Ar.personaje('Lumo'), otro = quien !== 'Lumo' ? Ar.personaje(quien) : null;
      izq.innerHTML = avatarL; der.innerHTML = otro || '';
      izq.classList.toggle('habla', quien === 'Lumo'); der.classList.toggle('habla', quien !== 'Lumo');
      nombre.textContent = quien;
      var r = datos().ajustes.voz !== false ? App.estado.voz.decir(id_, { velocidad: inf ? 0.85 : 0.95 }) : null;
      var sinVoz = !r || r.modo === 'subtitulo';
      txt.textContent = (!inf || sinVoz) ? l.texto : '';
      burbuja.classList.toggle('sin-texto', inf && !sinVoz);
      UI.Sonido.sfx('toque');
    }
    function avanzar() { i++; if (i >= lineas.length) cerrar(); else mostrar(); }
    mostrar();
  }

  function creditos(datos_, fin) {
    var ov = h('div.escena.creditos.zona-faro');
    var lista = h('div.cred-lista', h('h2', datos_.titulo));
    datos_.filas.forEach(function (c) {
      lista.appendChild(h('div.cred', h('div.cred-av', { html: Ar.personaje(c[0]) }), h('div', h('b', c[0]), h('span', c[1]))));
    });
    ov.appendChild(lista);
    ov.appendChild(h('button.btn-grande.principal.b-sig-esc', { type: 'button', on: { click: function () { if (ov.parentNode) ov.parentNode.removeChild(ov); fin(); } } }, h('span', 'Continuar')));
    document.body.appendChild(ov);
    UI.Sonido.sfx('victoria');
  }

  // ---------------------------------------------------------------- colección
  registrar('coleccion', function (cont) {
    var p = perfil(); nubes(cont);
    cont.appendChild(cabecera('Mi colección', { atras: function () { ir('mapa'); } }));
    var cuerpo = h('div.coleccion');
    // Disfraces
    var disp = PR.disfracesDesbloqueados(p);
    var sec1 = h('section', h('h2', 'Disfraces de Lumo'));
    var fila = h('div.disfraces');
    LOG.DISFRACES.forEach(function (d) {
      var abierto = disp.indexOf(d.id) >= 0 || (App.estado.docente && App.estado.docente.todo);
      fila.appendChild(h('button.disfraz' + (abierto ? '' : '.cerrado') + (p.disfraz === d.id ? '.sel' : ''), { type: 'button', 'aria-pressed': String(p.disfraz === d.id), on: { click: function () {
        if (!abierto) { UI.Sonido.sfx('choque'); toast(d.desc); return; }
        p.disfraz = d.id; guardar(); UI.Sonido.sfx('desbloqueo'); ir('coleccion'); } } },
        h('div.d-av', { html: Ar.lumo({ expr: abierto ? 'feliz' : 'normal', dir: 'S', disfraz: d.id }) }), h('span.d-nom', abierto ? d.nombre : '???'),
        abierto ? null : h('span.d-desc', d.desc)));
    });
    sec1.appendChild(fila); cuerpo.appendChild(sec1);
    // Insignias
    var sec2 = h('section', h('h2', 'Insignias'));
    var gr = h('div.insignias');
    LOG.INSIGNIAS.filter(function (x) { return PR.esInfantil(p) ? true : !x.infantil; }).forEach(function (x) {
      var ok = !!p.logros[x.id];
      gr.appendChild(h('div.insignia' + (ok ? '' : '.cerrada'), { title: x.desc }, UI.svgEl(Ar.insignia(x.icono, LOG.INSIGNIAS.indexOf(x), !ok), ''), h('span.i-nom', ok ? x.nombre : '???'), h('span.i-desc', x.desc)));
    });
    sec2.appendChild(gr); cuerpo.appendChild(sec2);
    // Brújula
    var piezas = [PR.mundoCompleto(p, 1), PR.mundoCompleto(p, 2), PR.mundoCompleto(p, 3), PR.hecho(p, 'f-03')];
    var sec3 = h('section', h('h2', 'La brújula de Lumo'), h('div.brujula', piezas.map(function (v, i) { return UI.svgEl(Ar.brujulaPieza(i + 1, v), ''); })));
    cuerpo.appendChild(sec3);
    // Álbum de recuerdos
    var vistas = Object.keys(p.vistos.escenas);
    var sec4 = h('section', h('h2', 'Álbum de recuerdos'));
    var al = h('div.album');
    vistas.filter(function (e) { return ES.POR_ID[e]; }).sort().forEach(function (e) {
      al.appendChild(h('button.recuerdo', { type: 'button', on: { click: function () { UI.reproducirEscena(e, function () {}); } } }, h('span', ES.POR_ID[e] ? ES.POR_ID[e].titulo : e)));
    });
    if (!vistas.length) al.appendChild(h('p.nota', 'Aquí aparecerán las escenas de la historia que vayas viendo.'));
    sec4.appendChild(al); cuerpo.appendChild(sec4);
    cont.appendChild(cuerpo);
  });

  // ---------------------------------------------------------------- ajustes
  registrar('ajustes', function (cont) {
    nubes(cont);
    var a = datos().ajustes;
    cont.appendChild(cabecera('Ajustes', { atras: function () { ir(perfil() ? 'mapa' : 'portada'); }, perfil: false }));
    var f = h('div.formulario.ajustes');
    function interruptor(clave, texto, desc) {
      var b = h('button.interruptor' + (a[clave] ? '.on' : ''), { type: 'button', role: 'switch', 'aria-checked': String(!!a[clave]), on: { click: function () {
        a[clave] = !a[clave]; aplicarAjustes(); b.classList.toggle('on', a[clave]); b.setAttribute('aria-checked', String(a[clave])); UI.Sonido.sfx('toque'); if (clave === 'voz' && !a[clave]) App.estado.voz.parar(); } } }, h('i'));
      return h('div.ajuste', h('div.aj-txt', h('b', texto), desc ? h('span', desc) : null), b);
    }
    f.appendChild(interruptor('sonido', 'Efectos de sonido'));
    f.appendChild(interruptor('musica', 'Música'));
    f.appendChild(interruptor('voz', 'Voz de Lumo', 'Lee las instrucciones en voz alta.'));
    f.appendChild(interruptor('reducir', 'Reducir animaciones', 'Menos movimiento en pantalla.'));
    f.appendChild(interruptor('contraste', 'Alto contraste'));
    var tam = h('div.ajuste', h('div.aj-txt', h('b', 'Tamaño de letra')), h('div.seg', [[1, 'A'], [2, 'A+'], [3, 'A++']].map(function (o) {
      return h('button.seg-b' + (a.fuente === o[0] ? '.sel' : ''), { type: 'button', 'aria-pressed': String(a.fuente === o[0]), on: { click: function () { a.fuente = o[0]; aplicarAjustes(); ir('ajustes'); } } }, o[1]);
    })));
    f.appendChild(tam);
    // voz concreta
    var vozInfo = h('div.ajuste.col', h('div.aj-txt', h('b', 'Voz'), h('span', 'Se elige automáticamente la mejor voz en español de este equipo.')));
    var sel = h('select.campo', { 'aria-label': 'Elegir voz' });
    function llenarVoces() {
      sel.innerHTML = '';
      sel.appendChild(h('option', { value: '' }, 'Automática'));
      App.estado.voz.listaDeVoces().forEach(function (v) { sel.appendChild(h('option', { value: v.name, selected: a.vozNombre === v.name ? true : null }, v.name + ' (' + v.lang + ')')); });
      var el = App.estado.voz.vozElegida();
      info.textContent = el ? 'Ahora suena: ' + el.name : 'Este equipo no tiene voz en español: se mostrarán subtítulos.';
    }
    var info = h('span.nota');
    sel.addEventListener('change', function () { a.vozNombre = sel.value || null; App.estado.voz.elegirManual(a.vozNombre); G.guardar(); llenarVoces(); });
    var probar = h('button.btn-txt', { type: 'button', on: { click: function () { UI.Sonido.iniciar(); App.estado.voz.decir('ok_1'); } } }, 'Probar la voz');
    vozInfo.appendChild(sel); vozInfo.appendChild(info); vozInfo.appendChild(probar);
    f.appendChild(vozInfo); llenarVoces();
    if (root.speechSynthesis && root.speechSynthesis.addEventListener) root.speechSynthesis.addEventListener('voiceschanged', llenarVoces);
    f.appendChild(h('div.ajuste', h('div.aj-txt', h('b', 'Presentación'), h('span', 'Vuelve a ver la introducción de Lumo.')), h('button.btn-txt', { type: 'button', on: { click: function () { UI.Sonido.iniciar(); App.intro(); } } }, 'Ver la intro')));
    f.appendChild(h('p.nota', 'Los datos se guardan solo en este navegador. Nada se envía a Internet.'));
    cont.appendChild(f);
  });

  App.ir = ir; App.iniciar = iniciar; App.toast = toast; App.boton = boton; App.cabecera = cabecera; App.nubes = nubes; App.registrar = registrar;
  App.jugarNivel = jugarNivel; App.jugarObjeto = jugarObjeto; App.perfil = perfil; App.datos = datos; App.guardar = guardar; App.alSalirDePantalla = alSalirDePantalla; App.lumoAvatar = lumoAvatar;
  App.btnIcono = btnIcono; App.labDisponible = labDisponible; App.aplicarAjustes = aplicarAjustes;
})(typeof self !== 'undefined' ? self : this);
