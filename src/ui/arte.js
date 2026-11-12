/*
 * RUMBO — Arte vectorial propio (SVG generado por código).
 * Todo el arte del juego es original: Lumo, sus amigos, las casillas de cada mundo,
 * los iconos de las tarjetas y las insignias.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};

  // ---------------------------------------------------------------- temas
  var TEMAS = {
    jardin:   { c1: '#bfe99a', c2: '#b2e08b', muro: 'arbusto',    agua: 'estanque', barrera: 'valla',   obj: 'flor',       meta: 'flor',   cielo: ['#9fdcff', '#e6f8d4'], deco: '#98d172' },
    granja:   { c1: '#ecd894', c2: '#e3cd87', muro: 'pajar',      agua: 'estanque', barrera: 'valla',   obj: 'zanahoria',  meta: 'casa',   cielo: ['#a8dcff', '#fff0c4'], deco: '#d4bb6c' },
    playa:    { c1: '#f8e5ab', c2: '#f2da98', muro: 'roca',       agua: 'mar',      barrera: 'tronco',  obj: 'concha',     meta: 'cofre',  cielo: ['#8fdcff', '#fff4d6'], deco: '#e3c677' },
    bosque:   { c1: '#7fcb6c', c2: '#74c062', muro: 'arbol',      agua: 'arroyo',   barrera: 'tronco',  obj: 'luciernaga', meta: 'portal', cielo: ['#17413f', '#3d7d57'], deco: '#5fae52' },
    montanas: { c1: '#c9c3dc', c2: '#bdb6d3', muro: 'roca-nieve', agua: 'abismo',   barrera: 'hielo',   obj: 'cristal',    meta: 'portal', cielo: ['#5b6ab0', '#c9d4f2'], deco: '#a79fc2' },
    mar:      { c1: '#f1dba3', c2: '#e9d095', muro: 'coral',      agua: 'remolino', barrera: 'alga',    obj: 'perla',      meta: 'portal', cielo: ['#0b4f7f', '#2aa4c9'], deco: '#d9bd7d' },
    volcan:   { c1: '#7a6560', c2: '#6e5954', muro: 'roca-negra', agua: 'lava',     barrera: 'columna', obj: 'gema',       meta: 'portal', cielo: ['#2f101a', '#a3402b'], deco: '#5a4743' },
    ciudad:   { c1: '#ccd6e8', c2: '#c0cce1', muro: 'edificio',   agua: 'vacio',    barrera: 'laser',   obj: 'bateria',    meta: 'portal', cielo: ['#222c57', '#5a78c9'], deco: '#a9b8d4' },
    espacio:  { c1: '#625f8d', c2: '#585584', muro: 'asteroide',  agua: 'agujero',  barrera: 'energia', obj: 'estrella',   meta: 'portal', cielo: ['#07071d', '#2b2468'], deco: '#7a76a8' },
    faro:     { c1: '#f5e7c6', c2: '#eedcb8', muro: 'piedra',     agua: 'oscuro',   barrera: 'valla',   obj: 'chispa',     meta: 'faro',   cielo: ['#18204a', '#e9a64c'], deco: '#dcc597' }
  };
  var NOMBRES_ZONA = {
    jardin: 'Jardín de colores', granja: 'Granja de los movimientos', playa: 'Playa de las formas',
    bosque: 'Bosque encantado', montanas: 'Reino de las montañas', mar: 'Mundo submarino',
    volcan: 'Isla volcánica', ciudad: 'Ciudad tecnológica', espacio: 'Mundo espacial', faro: 'El Faro Mayor'
  };

  function hash(x, y) { var n = (x * 73856093) ^ (y * 19349663); n = (n ^ (n >>> 13)) >>> 0; return n % 1000; }

  // ---------------------------------------------------------------- casillas (64×64)
  function suelo(tema, x, y) {
    var T = TEMAS[tema], par = (x + y) % 2 === 0;
    var h = hash(x, y), dx = 10 + (h % 40), dy = 12 + ((h >> 3) % 36);
    var deco = '';
    if (tema === 'jardin' || tema === 'bosque') deco = '<path d="M' + dx + ' ' + (dy + 6) + 'l2-8 2 8m3 0l2-6 2 6" stroke="' + T.deco + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    else if (tema === 'granja') deco = '<circle cx="' + dx + '" cy="' + dy + '" r="2" fill="' + T.deco + '"/><circle cx="' + (dx + 9) + '" cy="' + (dy + 5) + '" r="1.6" fill="' + T.deco + '"/>';
    else if (tema === 'playa') deco = '<path d="M' + dx + ' ' + dy + 'q4-4 8 0" stroke="' + T.deco + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
    else if (tema === 'mar') deco = '<circle cx="' + dx + '" cy="' + dy + '" r="2.2" fill="#fff" opacity=".55"/><circle cx="' + (dx + 8) + '" cy="' + (dy - 6) + '" r="1.4" fill="#fff" opacity=".55"/>';
    else if (tema === 'volcan') deco = '<path d="M' + dx + ' ' + dy + 'l6 3-3 5" stroke="#e3703a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>';
    else if (tema === 'ciudad') deco = '<path d="M8 32h48M32 8v48" stroke="' + T.deco + '" stroke-width="1.5" opacity=".6"/><circle cx="32" cy="32" r="3" fill="#5fe0ff" opacity=".7"/>';
    else if (tema === 'espacio') deco = '<circle cx="' + dx + '" cy="' + dy + '" r="1.5" fill="#fff" opacity=".7"/><circle cx="' + (dx + 14) + '" cy="' + (dy + 9) + '" r="1" fill="#cfd0ff" opacity=".7"/>';
    else if (tema === 'faro') deco = '<path d="M0 32h64M32 0v64" stroke="' + T.deco + '" stroke-width="1.6" opacity=".7"/>';
    else if (tema === 'montanas') deco = '<path d="M' + dx + ' ' + dy + 'l5-5 5 5z" fill="#fff" opacity=".6"/>';
    return '<rect x="1" y="1" width="62" height="62" rx="8" fill="' + (par ? T.c1 : T.c2) + '"/>' +
      '<rect x="1" y="1" width="62" height="10" rx="8" fill="#fff" opacity=".10"/>' + deco;
  }

  var MUROS = {
    arbusto: function () { return '<ellipse cx="32" cy="52" rx="22" ry="6" fill="#000" opacity=".15"/><circle cx="20" cy="38" r="15" fill="#4fb64c"/><circle cx="42" cy="38" r="15" fill="#5ac857"/><circle cx="31" cy="26" r="16" fill="#6bd864"/><circle cx="26" cy="22" r="3" fill="#ff6f91"/><circle cx="40" cy="30" r="3" fill="#ffd166"/>'; },
    arbol: function () { return '<ellipse cx="32" cy="56" rx="20" ry="5" fill="#000" opacity=".2"/><rect x="27" y="36" width="10" height="20" rx="3" fill="#8a5a33"/><circle cx="32" cy="24" r="19" fill="#2f8a4a"/><circle cx="21" cy="30" r="12" fill="#3aa55a"/><circle cx="43" cy="30" r="12" fill="#3aa55a"/><circle cx="32" cy="16" r="9" fill="#52c372"/><circle cx="26" cy="22" r="2.2" fill="#ffe27a"/><circle cx="40" cy="28" r="2" fill="#ffe27a"/>'; },
    pajar: function () { return '<ellipse cx="32" cy="54" rx="24" ry="5" fill="#000" opacity=".15"/><rect x="8" y="22" width="48" height="32" rx="10" fill="#e8b94a"/><path d="M12 32h40M12 42h40" stroke="#c99125" stroke-width="3"/><path d="M14 22c4-8 10-8 14 0m6 0c4-8 10-8 14 0" stroke="#c99125" stroke-width="2.5" fill="none"/>'; },
    roca: function () { return '<ellipse cx="32" cy="54" rx="24" ry="5" fill="#000" opacity=".15"/><path d="M8 50l6-24 14-10 16 4 12 16 0 14z" fill="#9aa3ad"/><path d="M14 26l14-10 8 16-20 6z" fill="#b8c0c9"/><path d="M36 20l8 14 12 16-24 0z" fill="#808a95"/>'; },
    'roca-nieve': function () { return '<ellipse cx="32" cy="54" rx="24" ry="5" fill="#000" opacity=".15"/><path d="M6 52L24 12l12 18 8-10 14 32z" fill="#7d7a96"/><path d="M24 12l-8 18 8-4 6 6 6-6z" fill="#fff"/><path d="M44 20l-5 9 5-3 4 4z" fill="#eef"/>'; },
    coral: function () { return '<ellipse cx="32" cy="56" rx="22" ry="4" fill="#000" opacity=".15"/><path d="M32 56V30M32 40l-12-14M32 36l12-16M20 26V14M44 20V10M32 30V12" stroke="#ff6f91" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="20" cy="14" r="5" fill="#ff9aa9"/><circle cx="44" cy="10" r="5" fill="#ff9aa9"/><circle cx="32" cy="12" r="5" fill="#ff9aa9"/>'; },
    'roca-negra': function () { return '<ellipse cx="32" cy="55" rx="24" ry="5" fill="#000" opacity=".25"/><path d="M6 54l8-28 14-12 18 6 12 16 0 18z" fill="#3a2f33"/><path d="M14 26l14-12 8 14-16 8z" fill="#524449"/><path d="M26 30l4 8-4 8m14-18l-3 8" stroke="#ff7a2f" stroke-width="3" fill="none" stroke-linecap="round"/>'; },
    edificio: function () { return '<ellipse cx="32" cy="57" rx="22" ry="4" fill="#000" opacity=".2"/><rect x="14" y="8" width="36" height="50" rx="5" fill="#4d5f8f"/><rect x="14" y="8" width="36" height="8" rx="4" fill="#6c82b8"/><g fill="#ffe27a"><rect x="20" y="22" width="7" height="7" rx="1"/><rect x="37" y="22" width="7" height="7" rx="1"/><rect x="20" y="36" width="7" height="7" rx="1"/></g><g fill="#5fe0ff"><rect x="37" y="36" width="7" height="7" rx="1"/><rect x="20" y="49" width="7" height="6" rx="1"/><rect x="37" y="49" width="7" height="6" rx="1"/></g>'; },
    asteroide: function () { return '<ellipse cx="32" cy="56" rx="20" ry="4" fill="#000" opacity=".25"/><path d="M12 36l4-16 14-10 16 6 8 16-6 16-18 6-14-6z" fill="#8b86b8"/><circle cx="26" cy="28" r="5" fill="#6d68a0"/><circle cx="42" cy="40" r="4" fill="#6d68a0"/><circle cx="30" cy="46" r="3" fill="#6d68a0"/>'; },
    piedra: function () { return '<ellipse cx="32" cy="56" rx="22" ry="4" fill="#000" opacity=".2"/><rect x="8" y="12" width="48" height="42" rx="6" fill="#b9a98e"/><path d="M8 26h48M8 40h48M24 12v14M42 26v14M20 40v14" stroke="#8e7f66" stroke-width="2.5"/>'; }
  };

  var PELIGROS = {
    estanque: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#43a9ff"/><g class="ola" stroke="#cfeaff" stroke-width="3" fill="none" stroke-linecap="round"><path d="M10 24q6-6 12 0t12 0 12 0"/><path d="M6 42q6-6 12 0t12 0 12 0 10 0"/></g>'; },
    arroyo: function () { return PELIGROS.estanque(); },
    mar: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#1e88e5"/><g class="ola" stroke="#bfe6ff" stroke-width="3" fill="none" stroke-linecap="round"><path d="M8 22q6-6 12 0t12 0 12 0"/><path d="M12 40q6-6 12 0t12 0 12 0"/></g>'; },
    abismo: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#2c2a4a"/><rect x="8" y="8" width="48" height="48" rx="8" fill="#1a1933"/><path d="M14 18l36 0M18 30l28 0M22 42l20 0" stroke="#5b5a8c" stroke-width="2.5" stroke-linecap="round"/>'; },
    remolino: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#0d3f66"/><g class="gira"><path d="M32 32m0-4a4 4 0 1 1-4 4M32 32m0-10a10 10 0 1 1-10 10M32 32m0-16a16 16 0 1 1-16 16" stroke="#7ad7ff" stroke-width="3" fill="none" stroke-linecap="round"/></g>'; },
    lava: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#e8452c"/><g class="ola"><path d="M0 26q10-8 20 0t20 0 24 0" stroke="#ffb02e" stroke-width="5" fill="none"/><path d="M0 46q10-8 20 0t20 0 24 0" stroke="#ff8a2a" stroke-width="5" fill="none"/></g><circle cx="20" cy="36" r="4" fill="#ffd166"/><circle cx="44" cy="20" r="3" fill="#ffd166"/>'; },
    vacio: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#101a3a"/><path d="M8 8l48 48M56 8L8 56" stroke="#2fd6ff" stroke-width="2" opacity=".5"/><rect x="6" y="6" width="52" height="52" rx="7" fill="none" stroke="#2fd6ff" stroke-width="2.5"/><circle cx="32" cy="32" r="6" fill="#2fd6ff" opacity=".5"/>'; },
    agujero: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#0a0820"/><g class="gira"><ellipse cx="32" cy="32" rx="24" ry="10" fill="none" stroke="#a86bff" stroke-width="4" opacity=".8"/><ellipse cx="32" cy="32" rx="14" ry="5" fill="none" stroke="#ff8ad8" stroke-width="3" opacity=".8"/></g><circle cx="32" cy="32" r="7" fill="#000"/>'; },
    oscuro: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#0f1a3d"/><g class="ola" stroke="#4c6bd1" stroke-width="3" fill="none" stroke-linecap="round"><path d="M8 24q6-6 12 0t12 0 12 0"/><path d="M12 42q6-6 12 0t12 0 12 0"/></g>'; }
  };

  var BARRERAS = {
    valla: function () { return '<rect x="6" y="26" width="52" height="7" rx="3" fill="#b9793f"/><rect x="6" y="40" width="52" height="7" rx="3" fill="#b9793f"/><rect x="10" y="18" width="8" height="38" rx="3" fill="#d4934f"/><rect x="28" y="18" width="8" height="38" rx="3" fill="#d4934f"/><rect x="46" y="18" width="8" height="38" rx="3" fill="#d4934f"/>'; },
    tronco: function () { return '<rect x="6" y="26" width="52" height="22" rx="11" fill="#9a6232"/><ellipse cx="12" cy="37" rx="6" ry="11" fill="#c78e55"/><circle cx="12" cy="37" r="3" fill="#9a6232"/><path d="M26 32h20M30 42h18" stroke="#7a4a22" stroke-width="2.5" stroke-linecap="round"/>'; },
    hielo: function () { return '<path d="M8 50l6-26 18-8 18 8 6 26z" fill="#bfe9ff" stroke="#fff" stroke-width="2"/><path d="M18 26l8 22M34 22l-4 26" stroke="#fff" stroke-width="2.5" opacity=".8"/>'; },
    alga: function () { return '<g stroke="#2fbf71" stroke-width="7" stroke-linecap="round" fill="none"><path class="ola" d="M14 56q-8-14 0-26t0-18"/><path class="ola" d="M32 56q-8-14 0-26t0-20"/><path class="ola" d="M50 56q-8-14 0-26t0-18"/></g>'; },
    columna: function () { return '<rect x="14" y="14" width="36" height="42" rx="6" fill="#8d7b74"/><rect x="10" y="10" width="44" height="10" rx="4" fill="#a99690"/><rect x="10" y="50" width="44" height="8" rx="4" fill="#a99690"/><path d="M26 22v26M38 22v26" stroke="#6e5d57" stroke-width="3"/>'; },
    laser: function () { return '<rect x="8" y="14" width="8" height="42" rx="3" fill="#3b476e"/><rect x="48" y="14" width="8" height="42" rx="3" fill="#3b476e"/><path d="M16 24h32M16 36h32M16 48h32" stroke="#ff3d6e" stroke-width="3.5" opacity=".9"/><circle cx="12" cy="18" r="4" fill="#ff3d6e"/><circle cx="52" cy="18" r="4" fill="#ff3d6e"/>'; },
    energia: function () { return '<path d="M32 6l16 14v26L32 60 16 46V20z" fill="#7be0ff" opacity=".85" stroke="#fff" stroke-width="2.5"/><path d="M32 6v54M16 20l32 26M48 20L16 46" stroke="#fff" stroke-width="1.5" opacity=".7"/>'; }
  };

  var OBJETOS = {
    flor: function () { return '<g><path d="M32 54V34" stroke="#3aa55a" stroke-width="4" stroke-linecap="round"/><g fill="#ff6f91"><circle cx="32" cy="18" r="8"/><circle cx="43" cy="26" r="8"/><circle cx="39" cy="38" r="8"/><circle cx="25" cy="38" r="8"/><circle cx="21" cy="26" r="8"/></g><circle cx="32" cy="29" r="8" fill="#ffd166"/></g>'; },
    zanahoria: function () { return '<g><path d="M26 14l6 8 6-8" stroke="#3aa55a" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M20 22h24l-12 36z" fill="#ff8a2a"/><path d="M26 30h8M28 40h6" stroke="#e66a10" stroke-width="2.5" stroke-linecap="round"/></g>'; },
    fruta: function () { return '<g><circle cx="32" cy="36" r="17" fill="#ff5a5f"/><path d="M32 20q2-8 8-9" stroke="#6b4a2a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M33 20q10-8 14 0-8 4-14 0z" fill="#3aa55a"/><circle cx="26" cy="30" r="4" fill="#fff" opacity=".5"/></g>'; },
    concha: function () { return '<g><path d="M10 46q0-28 22-30 22 2 22 30z" fill="#ffb3c7"/><path d="M32 16v30M22 20l6 26M42 20l-6 26M15 30l12 16M49 30L37 46" stroke="#ff7fa1" stroke-width="2.5" fill="none"/><rect x="12" y="46" width="40" height="6" rx="3" fill="#ff93b0"/></g>'; },
    luciernaga: function () { return '<g><circle cx="32" cy="32" r="22" fill="#fff6a6" opacity=".35" class="brillo"/><ellipse cx="32" cy="38" rx="10" ry="12" fill="#2d3a2f"/><ellipse cx="32" cy="42" rx="8" ry="8" fill="#ffe55a"/><circle cx="28" cy="28" r="2" fill="#fff"/><circle cx="36" cy="28" r="2" fill="#fff"/><path d="M24 30q-10-8-12 2 8 4 12-2zM40 30q10-8 12 2-8 4-12-2z" fill="#cfe9ff" opacity=".8"/></g>'; },
    cristal: function () { return '<g><path d="M32 8l14 14-6 30H24l-6-30z" fill="#7be0ff"/><path d="M32 8l-5 14 5 30 5-30z" fill="#bff3ff"/><path d="M18 22h28" stroke="#fff" stroke-width="2.5"/></g>'; },
    perla: function () { return '<g><path d="M8 40q0-14 12-14h24q12 0 12 14l-6 10H14z" fill="#e0e8f5"/><circle cx="32" cy="30" r="12" fill="#fff" stroke="#c9d6ee" stroke-width="3"/><circle cx="28" cy="26" r="4" fill="#fff"/><circle cx="28" cy="26" r="2" fill="#dff1ff"/></g>'; },
    gema: function () { return '<g><path d="M32 8l18 14-18 34L14 22z" fill="#ffb02e"/><path d="M14 22h36M32 8l-7 14 7 34 7-34z" fill="none" stroke="#ff7a1a" stroke-width="2.5"/><path d="M32 8l-7 14h14z" fill="#ffe3a0"/></g>'; },
    bateria: function () { return '<g><rect x="16" y="14" width="32" height="40" rx="7" fill="#2fd6ff"/><rect x="26" y="8" width="12" height="8" rx="2" fill="#8d9bb8"/><path d="M34 22l-8 14h8l-4 14 12-18h-8z" fill="#fff"/></g>'; },
    estrella: function () { return '<g><path d="M32 6l7.5 17 18.5 1.6-14 12.2 4.3 18.2L32 45.5 15.7 55l4.3-18.2L6 24.6 24.5 23z" fill="#ffd93d" stroke="#ffb800" stroke-width="2.5" stroke-linejoin="round"/></g>'; },
    chispa: function () { return '<g><circle cx="32" cy="32" r="22" fill="#ffe27a" opacity=".3" class="brillo"/><path d="M32 8l5 19 19 5-19 5-5 19-5-19-19-5 19-5z" fill="#ffd166" stroke="#ff9d2e" stroke-width="2.5" stroke-linejoin="round"/></g>'; }
  };

  var METAS = {
    flor: function () { return '<g transform="scale(1.1) translate(-3 -4)">' + OBJETOS.flor() + '</g><ellipse cx="32" cy="56" rx="20" ry="4" fill="#000" opacity=".12"/>'; },
    zanahoria: function () { return '<ellipse cx="32" cy="56" rx="22" ry="4" fill="#000" opacity=".12"/><g transform="translate(-4 -4) scale(1.15)">' + OBJETOS.zanahoria() + '</g>'; },
    casa: function () { return '<ellipse cx="32" cy="57" rx="24" ry="4" fill="#000" opacity=".15"/><rect x="12" y="28" width="40" height="28" rx="4" fill="#ffd9a0"/><path d="M6 32L32 8l26 24z" fill="#e8553f"/><rect x="26" y="38" width="12" height="18" rx="3" fill="#8a5a33"/><rect x="16" y="34" width="8" height="8" rx="2" fill="#9be0ff"/><rect x="40" y="34" width="8" height="8" rx="2" fill="#9be0ff"/><rect x="40" y="12" width="7" height="12" fill="#b5442f"/>'; },
    arbol: function () { return MUROS.arbol(); },
    cofre: function () { return '<ellipse cx="32" cy="56" rx="24" ry="4" fill="#000" opacity=".15"/><rect x="8" y="28" width="48" height="26" rx="5" fill="#a8672d"/><path d="M8 34q0-20 24-20t24 20z" fill="#c98441"/><rect x="8" y="34" width="48" height="5" fill="#ffd166"/><rect x="27" y="34" width="10" height="14" rx="2" fill="#ffd166"/><circle cx="32" cy="42" r="2.5" fill="#7a4a1f"/><path d="M44 10l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff6a6" class="brillo"/>'; },
    portal: function () { return '<g class="gira"><circle cx="32" cy="32" r="24" fill="none" stroke="#ffd166" stroke-width="5" stroke-dasharray="10 6"/></g><circle cx="32" cy="32" r="17" fill="#fff6c9" opacity=".55" class="brillo"/><circle cx="32" cy="32" r="10" fill="#fff"/><path d="M32 18l3 11 11 3-11 3-3 11-3-11-11-3 11-3z" fill="#ffb02e"/>'; },
    faro: function () { return '<ellipse cx="32" cy="58" rx="20" ry="4" fill="#000" opacity=".2"/><path d="M20 56l5-34h14l5 34z" fill="#f4f1ea"/><path d="M23 40h18l1.6 10H21.4z M25 26h14l1 6H24z" fill="#e8553f"/><rect x="22" y="14" width="20" height="10" rx="2" fill="#ffd166" class="brillo"/><path d="M20 14h24l-12-9z" fill="#e8553f"/><path d="M12 19l8 3M52 19l-8 3" stroke="#ffd166" stroke-width="3" stroke-linecap="round"/>'; }
  };

  function interruptor(activo) {
    return '<rect x="10" y="10" width="44" height="44" rx="12" fill="#00000022"/><circle cx="32" cy="32" r="17" fill="' + (activo ? '#3ddc84' : '#ff5a5f') + '"/><circle cx="32" cy="' + (activo ? 36 : 30) + '" r="11" fill="' + (activo ? '#7af0ac' : '#ff8a8e') + '"/>';
  }
  function puerta(abierta, tema) {
    if (abierta) return '<rect x="6" y="48" width="52" height="8" rx="4" fill="#00000030"/><rect x="8" y="52" width="48" height="5" rx="2" fill="#8a96b3"/>';
    return '<rect x="6" y="8" width="52" height="50" rx="8" fill="#5b6b92"/><rect x="12" y="14" width="40" height="38" rx="5" fill="#3e4a6e"/><g fill="#b9c4e0"><rect x="19" y="14" width="5" height="38"/><rect x="30" y="14" width="5" height="38"/><rect x="41" y="14" width="5" height="38"/></g><circle cx="32" cy="32" r="6" fill="#ffd166"/><rect x="30" y="30" width="4" height="9" rx="1" fill="#a8672d"/>';
  }

  function celda(tipo, tema, x, y, skin) {
    var T = TEMAS[tema] || TEMAS.jardin;
    skin = skin || {};
    if (tipo === '~') return PELIGROS[T.agua]();
    var base = suelo(tema, x, y);
    switch (tipo) {
      case '#': return base + MUROS[T.muro]();
      case 'b': return base + BARRERAS[T.barrera]();
      case 'G': return base + METAS[skin.meta || T.meta]();
      case 's': return base + '<g class="interruptor" data-x="' + x + '" data-y="' + y + '">' + interruptor(false) + '</g>';
      case 'd': return base + '<g class="puerta" data-x="' + x + '" data-y="' + y + '">' + puerta(false, tema) + '</g>';
      default: return base;
    }
  }
  function objeto(tema, skin) { var T = TEMAS[tema] || TEMAS.jardin; skin = skin || {}; return OBJETOS[skin.obj || T.obj](); }

  // ---------------------------------------------------------------- Lumo (rediseño fase 3)
  // Una sola figura modular: cuerpo redondo con llama, ojos grandes y brillantes, mejillas, bracitos, pies y brújula dorada en el pecho.
  // Expresiones: normal, alegre, concentrado, sorprendido, ups, orgulloso, emocionado, tierno.
  // Nombres antiguos aceptados: feliz→alegre, sorpresa→sorprendido, pensando→concentrado, triste→ups (ya no hay cara triste).
  var EXPR_ALIAS = { feliz: 'alegre', sorpresa: 'sorprendido', pensando: 'concentrado', triste: 'ups', literal: 'normal', serena: 'tierno', sereno: 'tierno', tierna: 'tierno', sincero: 'tierno', soñador: 'tierno', ilusionado: 'emocionado', divertido: 'alegre', travieso: 'alegre', terco: 'concentrado', curioso: 'sorprendido' };
  var EXPRESIONES = ['normal', 'alegre', 'concentrado', 'sorprendido', 'ups', 'orgulloso', 'emocionado', 'tierno'];
  function exprDe(e) { e = EXPR_ALIAS[e] || e; return EXPRESIONES.indexOf(e) >= 0 ? e : 'normal'; }
  var TINTA = '#7a2a1a';
  function boca(expr, cx, cy) {
    cx = cx == null ? 50 : cx; cy = cy == null ? 64 : cy;
    var t = 'translate(' + (cx - 50) + ' ' + (cy - 64) + ')';
    var g;
    switch (exprDe(expr)) {
      case 'alegre': g = '<path d="M38 60q12 16 24 0z" fill="' + TINTA + '" stroke="' + TINTA + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M43 65q7 5 14 0" stroke="#ff7f8a" stroke-width="3" fill="none"/>'; break;
      case 'emocionado': g = '<path d="M36 64q14 19 28 0z" fill="' + TINTA + '" stroke="' + TINTA + '" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 71q8 6 16 0" stroke="#ff7f8a" stroke-width="3.5" fill="none"/><rect x="43" y="64" width="14" height="3.2" rx="1.5" fill="#fff"/>'; break;
      case 'sorprendido': g = '<ellipse cx="50" cy="66" rx="5.5" ry="7" fill="' + TINTA + '"/><ellipse cx="50" cy="68" rx="3" ry="3.4" fill="#ff7f8a"/>'; break;
      case 'ups': g = '<path d="M38 67q4-6 8 0t8 0 8 0" stroke="' + TINTA + '" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; break;
      case 'concentrado': g = '<path d="M42 66h16" stroke="' + TINTA + '" stroke-width="3.6" stroke-linecap="round"/>'; break;
      case 'orgulloso': g = '<path d="M39 62q11 12 22 0" stroke="' + TINTA + '" stroke-width="3.8" fill="none" stroke-linecap="round"/><path d="M60 62l3-3" stroke="' + TINTA + '" stroke-width="3" stroke-linecap="round"/>'; break;
      case 'tierno': g = '<path d="M42 63q8 7 16 0" stroke="' + TINTA + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>'; break;
      default: g = '<path d="M40 63q10 9 20 0" stroke="' + TINTA + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    }
    return '<g transform="' + t + '">' + g + '</g>';
  }
  // Ojos de frente. cx = centro horizontal; dx,dy = hacia dónde mira la pupila.
  function ojoFrente(cx, e, dx, dy) {
    var c = '#2b2140', B = '<circle cx="' + (cx + dx + 2) + '" cy="' + (50 + dy) + '" r="2.2" fill="#fff"/>';
    switch (e) {
      case 'alegre': case 'orgulloso': return '<path d="M' + (cx - 8) + ' 54q8-13 16 0" stroke="' + c + '" stroke-width="4.2" fill="none" stroke-linecap="round"/>';
      case 'tierno': return '<ellipse cx="' + cx + '" cy="53" rx="9" ry="9" fill="#fff"/><circle cx="' + (cx + dx) + '" cy="' + (55 + dy) + '" r="5.6" fill="' + c + '"/><circle cx="' + (cx + dx + 2) + '" cy="' + (52.6 + dy) + '" r="2" fill="#fff"/><path d="M' + (cx - 9.5) + ' 51q9.5-6 19 0v-3h-19z" fill="url(#gLumo)"/><path d="M' + (cx - 9) + ' 50.5q9-5 18 0" stroke="#c9741a" stroke-width="1.8" fill="none"/>';
      case 'emocionado': return '<ellipse cx="' + cx + '" cy="52" rx="10" ry="11.5" fill="#fff"/><circle cx="' + (cx + dx) + '" cy="' + (53 + dy) + '" r="7" fill="' + c + '"/><circle cx="' + (cx + dx + 2.6) + '" cy="' + (50 + dy) + '" r="2.8" fill="#fff"/><circle cx="' + (cx + dx - 2.4) + '" cy="' + (56 + dy) + '" r="1.5" fill="#fff"/>';
      case 'sorprendido': return '<ellipse cx="' + cx + '" cy="52" rx="10" ry="12" fill="#fff"/><circle cx="' + (cx + dx) + '" cy="' + (52 + dy) + '" r="3.8" fill="' + c + '"/><circle cx="' + (cx + dx + 1.2) + '" cy="' + (50.6 + dy) + '" r="1.4" fill="#fff"/>';
      case 'ups': return '<ellipse cx="' + cx + '" cy="52" rx="9.5" ry="10.5" fill="#fff"/><circle cx="' + (cx + dx) + '" cy="' + (53 + dy) + '" r="3" fill="' + c + '"/>';
      case 'concentrado': return '<ellipse cx="' + cx + '" cy="53" rx="9" ry="7.5" fill="#fff"/><circle cx="' + (cx + dx + 2) + '" cy="' + (54 + dy) + '" r="4.8" fill="' + c + '"/><circle cx="' + (cx + dx + 3.6) + '" cy="' + (52.4 + dy) + '" r="1.7" fill="#fff"/>';
      default: return '<ellipse cx="' + cx + '" cy="52" rx="9" ry="10" fill="#fff"/><circle cx="' + (cx + dx) + '" cy="' + (53 + dy) + '" r="5.4" fill="' + c + '"/>' + B.replace('r="2.2"', 'r="2"');
    }
  }
  function cejasFrente(e) {
    var s = 'stroke="' + TINTA + '" stroke-width="3.4" fill="none" stroke-linecap="round"';
    switch (e) {
      case 'concentrado': return '<path d="M30 42l14 3M70 42l-14 3" ' + s + '/>';
      case 'sorprendido': case 'emocionado': return '<path d="M28 35q10-6 18-1M72 35q-10-6-18-1" ' + s + '/>';
      case 'ups': return '<path d="M29 40q9-6 17-2M71 40q-9-6-17-2" ' + s + '/><path d="M80 40q4 6 0 9q-4-3 0-9z" fill="#7be0ff" stroke="#3a9fd0" stroke-width="1.5"/>';
      case 'orgulloso': return '<path d="M29 39q9-5 16-1M71 39q-9-5-16-1" ' + s + '/>';
      case 'tierno': return '<path d="M29 39q9-4 16 0M71 39q-9-4-16 0" ' + s + ' opacity=".7"/>';
      default: return '';
    }
  }
  var DISFRACES_SVG = {
    1: '<path d="M26 34q24-26 48 0z" fill="#3aa55a" stroke="#2c8745" stroke-width="2.5" stroke-linejoin="round"/><path d="M62 34h22q-2 6-12 6H62z" fill="#2c8745"/><circle cx="50" cy="20" r="4" fill="#ffd166"/>',
    2: '<g fill="#fff" fill-opacity=".35" stroke="#2b3a67" stroke-width="3.5"><circle cx="39" cy="50" r="11"/><circle cx="61" cy="50" r="11"/></g><path d="M50 50h0M28 48l-6-3M72 48l6-3" stroke="#2b3a67" stroke-width="3.5" stroke-linecap="round"/>',
    4: '<path d="M22 52Q22 14 50 14t28 38z" fill="#9fb0c8" stroke="#5c6f8f" stroke-width="3" opacity=".6"/><path d="M22 52Q22 14 50 14t28 38" fill="none" stroke="#5c6f8f" stroke-width="4"/><circle cx="50" cy="14" r="4" fill="#ff5a5f"/>',
    5: '<path d="M24 36q26-14 52 0v8H24z" fill="#4a4a5c"/><g fill="#7be0ff" stroke="#2b2b3a" stroke-width="3"><circle cx="38" cy="38" r="8"/><circle cx="62" cy="38" r="8"/></g>',
    6: '<path d="M50 24V6" stroke="#8d9bb8" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="6" r="6" fill="#ff5a5f"/><circle cx="48" cy="4" r="2" fill="#fff"/>',
    7: '<path d="M28 28l6-16 8 10 8-14 8 14 8-10 6 16z" fill="#ffd166" stroke="#ff9d2e" stroke-width="2.5" stroke-linejoin="round"/><circle cx="50" cy="20" r="3" fill="#ff5a5f"/>'
  };
  var CAPA = '<path d="M26 52Q10 78 18 92l32-6 32 6q8-14-8-40z" fill="#e8553f"/><path d="M26 52Q20 70 26 84" stroke="#b83a28" stroke-width="3" fill="none"/>';

  // Bracitos: pose 'bajos' (por defecto), 'arriba' (¡viva!), 'saludo' (una mano arriba), 'pecho' (orgullo), 'recoge' (hacia delante).
  function brazos(pose) {
    var f = 'fill="#e0731a"', st = ' stroke="#c9601a" stroke-width="1.6"';
    switch (pose) {
      case 'arriba': return '<g class="brazo-i"><ellipse cx="17" cy="48" rx="6.5" ry="10" transform="rotate(-35 17 48)" ' + f + st + '/></g><g class="brazo-d"><ellipse cx="83" cy="48" rx="6.5" ry="10" transform="rotate(35 83 48)" ' + f + st + '/></g>';
      case 'saludo': return '<ellipse cx="18" cy="72" rx="6" ry="9" transform="rotate(15 18 72)" ' + f + st + '/><g class="brazo-d"><ellipse cx="83" cy="46" rx="6.5" ry="10" transform="rotate(30 83 46)" ' + f + st + '/></g>';
      case 'pecho': return '<ellipse cx="33" cy="74" rx="6" ry="8" transform="rotate(-30 33 74)" ' + f + st + '/><ellipse cx="67" cy="74" rx="6" ry="8" transform="rotate(30 67 74)" ' + f + st + '/>';
      case 'recoge': return '<ellipse cx="30" cy="80" rx="6" ry="8" transform="rotate(-20 30 80)" ' + f + st + '/><ellipse cx="70" cy="80" rx="6" ry="8" transform="rotate(20 70 80)" ' + f + st + '/>';
      default: return '<ellipse cx="17" cy="70" rx="6" ry="9.5" transform="rotate(12 17 70)" ' + f + st + '/><ellipse cx="83" cy="70" rx="6" ry="9.5" transform="rotate(-12 83 70)" ' + f + st + '/>';
    }
  }

  // Lumo: viewBox 0 0 100 100. dir: E/O/N/S (hacia dónde mira). S = de frente · N = de espaldas · E/O = de perfil.
  // op: { dir, expr, disfraz, pose, mira:[dx,dy] }
  function lumo(op) {
    op = op || {};
    var dir = op.dir || 'S', e = exprDe(op.expr), d = op.disfraz | 0, mira = op.mira || [0, 1.2];
    var glow = '<circle cx="50" cy="56" r="46" fill="url(#gLumoGlow)"/>';
    var llama = '<g class="llama"><path d="M50 3q15 15 11 27-3 7-11 7t-11-7Q35 18 50 3z" fill="url(#gLlama)"/><path d="M50 13q6 8 3 15-3 4-3 4t-3-4q-3-7 3-15z" fill="#fff3a8" opacity=".9"/></g>';
    var interior, pies, br = (dir === 'N') ? '' : brazos(op.pose);
    var mejillas = e === 'tierno' || e === 'orgulloso' || e === 'emocionado' ? .85 : .55;
    if (dir === 'N') {
      interior = '<ellipse cx="50" cy="60" rx="36" ry="32" fill="url(#gLumo)"/><ellipse cx="50" cy="60" rx="36" ry="32" fill="#c8641a" opacity=".2"/>' +
        '<path d="M50 34q-9 4-9 12t9 10 9-6q0-7-7-8" fill="none" stroke="#e0731a" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>' +
        '<ellipse cx="50" cy="72" rx="15" ry="13" fill="#e8553f"/><ellipse cx="50" cy="72" rx="15" ry="13" fill="none" stroke="#b83a28" stroke-width="3"/><circle cx="50" cy="72" r="4" fill="#ffd166"/>' +
        '<ellipse cx="15" cy="68" rx="6" ry="9" fill="#e0731a"/><ellipse cx="85" cy="68" rx="6" ry="9" fill="#e0731a"/>';
      pies = '<ellipse cx="36" cy="91" rx="10" ry="5" fill="#e0731a"/><ellipse cx="64" cy="91" rx="10" ry="5" fill="#e0731a"/>';
    } else if (dir === 'E' || dir === 'O') {
      var ojoC = e === 'alegre' || e === 'orgulloso' ?
        '<path d="M60 56q8-13 16 0" stroke="#2b2140" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="M47 56q5-9 10 0" stroke="#2b2140" stroke-width="3.4" fill="none" stroke-linecap="round"/>' :
        '<ellipse cx="68" cy="52" rx="8.5" ry="' + (e === 'concentrado' ? 7 : e === 'sorprendido' || e === 'emocionado' ? 11 : 9.8) + '" fill="#fff"/><circle cx="' + (72 + mira[0] / 2) + '" cy="' + (53 + mira[1]) + '" r="' + (e === 'sorprendido' ? 3.6 : e === 'emocionado' ? 6.6 : 4.8) + '" fill="#2b2140"/><circle cx="' + (73.6 + mira[0] / 2) + '" cy="' + (51 + mira[1]) + '" r="1.8" fill="#fff"/>' +
        '<ellipse cx="52" cy="52" rx="6.5" ry="8" fill="#fff"/><circle cx="55.5" cy="53" r="3.8" fill="#2b2140"/><circle cx="56.8" cy="51.4" r="1.4" fill="#fff"/>';
      var ce = e === 'concentrado' ? '<path d="M60 43l16 4" stroke="' + TINTA + '" stroke-width="3.2" stroke-linecap="round"/>' : e === 'sorprendido' || e === 'emocionado' ? '<path d="M60 36q9-5 16-1" stroke="' + TINTA + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>' : e === 'ups' ? '<path d="M82 40q4 6 0 9q-4-3 0-9z" fill="#7be0ff" stroke="#3a9fd0" stroke-width="1.5"/>' : '';
      interior = '<ellipse cx="48" cy="60" rx="31" ry="32" fill="url(#gLumo)"/><ellipse cx="42" cy="40" rx="11" ry="6" fill="#fff" opacity=".28" transform="rotate(-20 42 40)"/>' +
        '<circle cx="76" cy="66" r="6" fill="#ff7f8a" opacity="' + mejillas + '"/>' + ojoC + ce + boca(e, 66, 66) +
        '<ellipse cx="30" cy="70" rx="7" ry="10" fill="#e0731a" opacity=".85"/><path d="M62 78a6 6 0 1 0 0 .1" fill="none"/>';
      pies = '<ellipse cx="42" cy="91" rx="10" ry="5" fill="#e0731a"/><ellipse cx="62" cy="91" rx="9" ry="5" fill="#e0731a"/>';
      var bp = e === 'emocionado' || op.pose === 'arriba' ? '<ellipse cx="30" cy="50" rx="6" ry="10" transform="rotate(-30 30 50)" fill="#e0731a" stroke="#c9601a" stroke-width="1.6"/>' : '<ellipse cx="50" cy="82" rx="6" ry="8" transform="rotate(-18 50 82)" fill="#e0731a" stroke="#c9601a" stroke-width="1.6"/>';
      br = bp;
      if (dir === 'O') { var espejo = function (s) { return '<g transform="translate(100 0) scale(-1 1)">' + s + '</g>'; }; interior = espejo(interior); pies = espejo(pies); br = espejo(br); }
    } else {
      interior = '<ellipse cx="50" cy="60" rx="36" ry="32" fill="url(#gLumo)"/>' +
        '<ellipse cx="38" cy="40" rx="13" ry="7" fill="#fff" opacity=".28" transform="rotate(-20 38 40)"/>' +
        '<circle cx="25" cy="64" r="6.5" fill="#ff7f8a" opacity="' + mejillas + '"/><circle cx="75" cy="64" r="6.5" fill="#ff7f8a" opacity="' + mejillas + '"/>' +
        ojoFrente(38, e, mira[0], mira[1]) + ojoFrente(62, e, mira[0], mira[1]) + cejasFrente(e) + boca(e) +
        '<g transform="translate(50 84)"><circle r="8.5" fill="#fff" stroke="#c9741a" stroke-width="2.5"/><circle r="6" fill="#fff6c9"/><path d="M0-6l3 6-3 6-3-6z" fill="#e8553f"/><path d="M0 6l-3-6h6z" fill="#7a8aa8"/></g>';
      pies = '<ellipse cx="34" cy="91" rx="10" ry="5" fill="#e0731a"/><ellipse cx="66" cy="91" rx="10" ry="5" fill="#e0731a"/>';
    }
    var capaAtras = d === 3 ? CAPA : '';
    return '<svg viewBox="0 0 100 100" class="lumo-svg" data-expr="' + e + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      capaAtras + glow + llama + interior + pies + br + (DISFRACES_SVG[d] || '') + '</svg>';
  }

  // ---------------------------------------------------------------- personajes secundarios
  // Las seis chispas comparten el lenguaje visual de Lumo (cuerpo redondo, llama, ojos grandes, mejillas, bracitos)
  // y se distinguen por el color y un rasgo propio. Expresiones: normal, alegre, sorprendido, tierno.
  var CHISPAS_DISENO = {
    'Titila':   { c1: '#8fdc86', c2: '#d6f7c8', rasgo: '<path d="M50 14q-14-6-20 4 12 6 20-4z" fill="#3aa55a"/><path d="M50 14q12-8 20 2-10 8-20-2z" fill="#2c8745"/>' },
    'Brasa':    { c1: '#ff7a55', c2: '#ffc2a8', rasgo: '<path d="M36 24l6-12 6 10 6-12 6 12 6-10 2 16z" fill="#c9401f"/>' },
    'Destello': { c1: '#5ec8ff', c2: '#c4ecff', rasgo: '<path d="M30 22q8-14 22-6 8 4 6 12-10-4-14 2-6-6-14-8z" fill="#2a9ad6"/><circle cx="66" cy="18" r="3" fill="#fff"/>' },
    'Ascua':    { c1: '#e8603f', c2: '#ffa571', rasgo: '<path d="M34 28q-6-14 2-18 2 10 8 14zM66 28q6-14-2-18-2 10-8 14z" fill="#8c2a1a"/>' },
    'Píxel':    { c1: '#4fe0c8', c2: '#b6f7ec', rasgo: '<path d="M50 20V6" stroke="#2a8f80" stroke-width="3.5"/><rect x="43" y="-1" width="14" height="14" rx="2" fill="#7affe4" stroke="#2a8f80" stroke-width="2.5"/><rect x="47" y="3" width="6" height="6" fill="#2a8f80"/>' },
    'Cometa':   { c1: '#b58cff', c2: '#e3d3ff', rasgo: '<path d="M72 18l6-14 3 11 12 1-10 6 3 12-10-8-9 6 3-12-10-5z" fill="#ffd166" stroke="#e8a82e" stroke-width="2" stroke-linejoin="round"/>' }
  };
  function chispa(nombre, expr) {
    var D = CHISPAS_DISENO[nombre]; if (!D) return '';
    expr = EXPR_ALIAS[expr] || expr;
    var ojos, boca_;
    switch (expr) {
      case 'alegre': case 'emocionado': case 'orgulloso':
        ojos = '<path d="M31 58q8-12 16 0M53 58q8-12 16 0" stroke="#2b2140" stroke-width="4" fill="none" stroke-linecap="round"/>';
        boca_ = '<path d="M40 66q10 14 20 0z" fill="#7a2a1a" stroke="#7a2a1a" stroke-width="2" stroke-linejoin="round"/>'; break;
      case 'sorprendido': case 'ups':
        ojos = '<ellipse cx="39" cy="58" rx="8.5" ry="10" fill="#fff"/><ellipse cx="61" cy="58" rx="8.5" ry="10" fill="#fff"/><circle cx="39" cy="58" r="3.4" fill="#2b2140"/><circle cx="61" cy="58" r="3.4" fill="#2b2140"/>';
        boca_ = '<ellipse cx="50" cy="72" rx="4.5" ry="5.5" fill="#7a2a1a"/>'; break;
      case 'tierno':
        ojos = '<ellipse cx="39" cy="59" rx="8" ry="8" fill="#fff"/><ellipse cx="61" cy="59" rx="8" ry="8" fill="#fff"/><circle cx="40" cy="60" r="5" fill="#2b2140"/><circle cx="62" cy="60" r="5" fill="#2b2140"/><circle cx="41.6" cy="58" r="1.8" fill="#fff"/><circle cx="63.6" cy="58" r="1.8" fill="#fff"/><path d="M30 55q9-6 18 0M52 55q9-6 18 0" stroke="' + D.c1 + '" stroke-width="3" fill="none"/>';
        boca_ = '<path d="M44 70q6 5 12 0" stroke="#7a2a1a" stroke-width="3" fill="none" stroke-linecap="round"/>'; break;
      default:
        ojos = '<ellipse cx="39" cy="58" rx="8" ry="9" fill="#fff"/><ellipse cx="61" cy="58" rx="8" ry="9" fill="#fff"/><circle cx="40" cy="59" r="4.8" fill="#2b2140"/><circle cx="62" cy="59" r="4.8" fill="#2b2140"/><circle cx="41.6" cy="57" r="1.8" fill="#fff"/><circle cx="63.6" cy="57" r="1.8" fill="#fff"/>';
        boca_ = '<path d="M43 70q7 6 14 0" stroke="#7a2a1a" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
    }
    return '<defs><radialGradient id="gCh' + nombre.charCodeAt(0) + '"><stop offset="55%" stop-color="' + D.c1 + '" stop-opacity=".4"/><stop offset="100%" stop-color="' + D.c1 + '" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="58" r="48" fill="url(#gCh' + nombre.charCodeAt(0) + ')"/><ellipse cx="50" cy="93" rx="24" ry="4" fill="#000" opacity=".15"/>' +
      '<g class="llama"><path d="M50 6q15 15 10 28-3 7-10 7t-10-7Q35 21 50 6z" fill="' + D.c1 + '"/><path d="M50 16q6 8 3 14-3 4-3 4t-3-4q-3-6 3-14z" fill="' + D.c2 + '" opacity=".9"/></g>' +
      D.rasgo +
      '<ellipse cx="50" cy="64" rx="33" ry="29" fill="' + D.c1 + '"/><ellipse cx="38" cy="46" rx="11" ry="5.5" fill="#fff" opacity=".3" transform="rotate(-20 38 46)"/>' +
      '<ellipse cx="17" cy="72" rx="5.5" ry="8.5" transform="rotate(12 17 72)" fill="' + D.c1 + '" stroke="#0002" stroke-width="1.4"/><ellipse cx="83" cy="72" rx="5.5" ry="8.5" transform="rotate(-12 83 72)" fill="' + D.c1 + '" stroke="#0002" stroke-width="1.4"/>' +
      '<circle cx="27" cy="68" r="5" fill="#ff7f8a" opacity=".55"/><circle cx="73" cy="68" r="5" fill="#ff7f8a" opacity=".55"/>' + ojos + boca_ +
      '<ellipse cx="38" cy="91" rx="9" ry="4.5" fill="' + D.c1 + '"/><ellipse cx="62" cy="91" rx="9" ry="4.5" fill="' + D.c1 + '"/>';
  }
  var PERSONAJES = {
    'Abuela Chispa': '<defs><radialGradient id="gChAb"><stop offset="55%" stop-color="#c9a0ff" stop-opacity=".4"/><stop offset="100%" stop-color="#c9a0ff" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="56" r="48" fill="url(#gChAb)"/><path d="M50 2q16 16 11 30-3 7-11 7t-11-7Q34 18 50 2z" fill="#d9a8ff"/><ellipse cx="50" cy="62" rx="36" ry="32" fill="#b784f0"/><ellipse cx="50" cy="62" rx="36" ry="32" fill="url(#gLumoGlow)" opacity=".4"/><g fill="#fff" fill-opacity=".4" stroke="#6a3fa8" stroke-width="3"><circle cx="37" cy="54" r="10"/><circle cx="63" cy="54" r="10"/></g><path d="M47 54h6" stroke="#6a3fa8" stroke-width="3"/><circle cx="37" cy="55" r="4" fill="#2b2140"/><circle cx="63" cy="55" r="4" fill="#2b2140"/><path d="M40 72q10 9 20 0" stroke="#5a2a7a" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="26" cy="68" r="5" fill="#ff9ac8" opacity=".6"/><circle cx="74" cy="68" r="5" fill="#ff9ac8" opacity=".6"/><ellipse cx="36" cy="93" rx="10" ry="5" fill="#8b57c9"/><ellipse cx="64" cy="93" rx="10" ry="5" fill="#8b57c9"/><path d="M30 28q20-12 40 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>',
    'Búho Bruma': '<ellipse cx="50" cy="94" rx="30" ry="5" fill="#000" opacity=".15"/><path d="M20 38l-4-22 18 12q16-6 32 0l18-12-4 22q8 22-6 40-12 14-24 14T26 78q-14-18-6-40z" fill="#8b6bd1"/><ellipse cx="50" cy="70" rx="20" ry="20" fill="#d7c8f5"/><g fill="#fff" stroke="#4a3a8a" stroke-width="3"><circle cx="37" cy="48" r="13"/><circle cx="63" cy="48" r="13"/></g><circle cx="38" cy="49" r="6" fill="#2b2140"/><circle cx="62" cy="49" r="6" fill="#2b2140"/><circle cx="40" cy="47" r="2" fill="#fff"/><circle cx="64" cy="47" r="2" fill="#fff"/><path d="M50 54l-5 8h10z" fill="#ffb02e"/><path d="M38 78l6 6M50 82l0 6M62 78l-6 6" stroke="#8b6bd1" stroke-width="3" stroke-linecap="round"/>',
    'Bichito': '<ellipse cx="50" cy="90" rx="22" ry="4" fill="#000" opacity=".15"/><path d="M36 34q-6-14-16-14M64 34q6-14 16-14" stroke="#2d6a3e" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="20" cy="20" r="4" fill="#ff6f91"/><circle cx="80" cy="20" r="4" fill="#ff6f91"/><ellipse cx="50" cy="62" rx="30" ry="28" fill="#6fcf6f"/><path d="M50 36v52" stroke="#3aa55a" stroke-width="3"/><circle cx="38" cy="66" r="5" fill="#2d6a3e"/><circle cx="62" cy="74" r="5" fill="#2d6a3e"/><circle cx="50" cy="52" r="16" fill="#8be08b"/><circle cx="43" cy="50" r="5" fill="#fff"/><circle cx="57" cy="50" r="5" fill="#fff"/><circle cx="44" cy="51" r="2.4" fill="#2b2140"/><circle cx="58" cy="51" r="2.4" fill="#2b2140"/><path d="M43 60q7 6 14 0" stroke="#2d6a3e" stroke-width="3" fill="none" stroke-linecap="round"/>',
    'Tinta': '<ellipse cx="50" cy="94" rx="30" ry="4" fill="#000" opacity=".15"/><g stroke="#ff7fb0" stroke-width="9" stroke-linecap="round" fill="none"><path d="M28 70q-10 12-4 22"/><path d="M40 76q-4 12 2 18"/><path d="M60 76q4 12-2 18"/><path d="M72 70q10 12 4 22"/></g><ellipse cx="50" cy="44" rx="30" ry="34" fill="#ff7fb0"/><ellipse cx="50" cy="44" rx="30" ry="34" fill="url(#gLumoGlow)" opacity=".25"/><g fill="#fff" stroke="#c43b78" stroke-width="3"><circle cx="38" cy="52" r="9"/><circle cx="62" cy="52" r="9"/></g><circle cx="39" cy="53" r="4" fill="#2b2140"/><circle cx="63" cy="53" r="4" fill="#2b2140"/><path d="M42 68q8 7 16 0" stroke="#8c1f52" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M32 22q18-14 36 0" stroke="#ffc0da" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="76" cy="20" r="7" fill="#ffd166"/><path d="M72 20h8M76 16v8" stroke="#a8672d" stroke-width="2.5"/>',
    'Lagarto gigante': '<ellipse cx="50" cy="94" rx="36" ry="4" fill="#000" opacity=".2"/><path d="M8 78q14-24 40-24h20q22 0 26 16l-12 6q-6-6-16-4-24 4-58 6z" fill="#4faf5a"/><path d="M68 54q10-16 22-8-2 12-14 14z" fill="#4faf5a"/><circle cx="82" cy="52" r="5" fill="#fff"/><circle cx="83" cy="53" r="2.4" fill="#2b2140"/><path d="M20 70l6-10 6 10M36 66l6-10 6 10M52 62l6-10 6 10" fill="#ffb02e"/><rect x="26" y="76" width="9" height="14" rx="4" fill="#3d9148"/><rect x="62" y="76" width="9" height="14" rx="4" fill="#3d9148"/>',
    'Conejo': '<ellipse cx="50" cy="93" rx="26" ry="4" fill="#000" opacity=".15"/><ellipse cx="38" cy="22" rx="8" ry="20" fill="#f0e6dc"/><ellipse cx="62" cy="22" rx="8" ry="20" fill="#f0e6dc"/><ellipse cx="50" cy="66" rx="30" ry="26" fill="#f7f1ea"/><circle cx="41" cy="60" r="4" fill="#2b2140"/><circle cx="59" cy="60" r="4" fill="#2b2140"/><path d="M44 72q6 5 12 0" stroke="#a8672d" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="50" cy="67" r="3" fill="#ff9ac8"/>',
    'Bit': '<ellipse cx="50" cy="94" rx="26" ry="4" fill="#000" opacity=".15"/><rect x="40" y="2" width="4" height="12" fill="#8d9bb8"/><circle cx="42" cy="4" r="5" fill="#ff5a5f"/><rect x="22" y="14" width="56" height="40" rx="12" fill="#c9d4ea"/><rect x="28" y="22" width="44" height="24" rx="8" fill="#26335e"/><circle cx="40" cy="34" r="6" fill="#5fe0ff"/><circle cx="60" cy="34" r="6" fill="#5fe0ff"/><path d="M42 42q8 4 16 0" stroke="#5fe0ff" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="28" y="56" width="44" height="30" rx="8" fill="#9fb0cf"/><circle cx="50" cy="70" r="7" fill="#ffd166"/><rect x="14" y="58" width="12" height="22" rx="6" fill="#c9d4ea"/><rect x="74" y="58" width="12" height="22" rx="6" fill="#c9d4ea"/><rect x="32" y="86" width="12" height="8" rx="3" fill="#7b8bb0"/><rect x="56" y="86" width="12" height="8" rx="3" fill="#7b8bb0"/>'
  };
  function personaje(nombre, op) {
    if (CHISPAS_DISENO[nombre]) return '<svg viewBox="0 0 100 100" class="pers-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + chispa(nombre, op && op.expr) + '</svg>';
    if (nombre === 'Lumo') return lumo({ expr: op && op.expr || 'alegre', dir: 'S', pose: op && op.pose });
    return '<svg viewBox="0 0 100 100" class="pers-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + (PERSONAJES[nombre] || '') + '</svg>';
  }

  // ---------------------------------------------------------------- iconos de tarjetas (48×48, trazo blanco)
  var S = 'stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  var ICONOS = {
    'avanzar': '<path d="M24 40V10M11 22l13-13 13 13" ' + S + '/>',
    'retroceder': '<path d="M24 8v30M11 26l13 13 13-13" ' + S + '/>',
    'girar-d': '<path d="M12 40V26q0-12 12-12h14M30 5l9 9-9 9" ' + S + '/>',
    'girar-i': '<path d="M36 40V26q0-12-12-12H10M18 5l-9 9 9 9" ' + S + '/>',
    'saltar': '<path d="M6 36Q24-4 42 36" ' + S + '/><path d="M36 28l7 8-10 2" ' + S + ' stroke-width="5"/>',
    'recoger': '<path d="M24 6l14 12-14 24L10 18z" fill="#fff"/><path d="M10 18h28" stroke="#0003" stroke-width="2.5"/>',
    'activar': '<rect x="6" y="32" width="36" height="10" rx="4" fill="#fff"/><circle cx="24" cy="24" r="11" fill="#fff"/><path d="M24 4v6M8 10l4 4M40 10l-4 4" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    'esperar': '<path d="M13 7h22M13 41h22M15 7c0 10 18 10 18 17S15 31 15 41M33 7c0 10-18 10-18 17s18 7 18 17" ' + S + ' stroke-width="4"/>',
    'repetir': '<path d="M9 22a15 15 0 0 1 27-8M39 26a15 15 0 0 1-27 8" ' + S + ' stroke-width="5"/><path d="M36 5v10H26M12 43V33h10" ' + S + ' stroke-width="5"/>',
    'si': '<path d="M24 42V26M24 26L11 10M24 26l13-16" ' + S + ' stroke-width="5"/><circle cx="11" cy="9" r="4.5" fill="#fff"/><circle cx="37" cy="9" r="4.5" fill="#fff"/><circle cx="24" cy="42" r="4.5" fill="#fff"/>',
    'mientras': '<path d="M3 24c8-13 34-13 42 0-8 13-34 13-42 0z" ' + S + ' stroke-width="4"/><circle cx="24" cy="24" r="6.5" fill="#fff"/>',
    'receta': '<path d="M9 22h30v12a8 8 0 0 1-8 8H17a8 8 0 0 1-8-8z" fill="#fff"/><path d="M9 26H4M39 26h5" ' + S + ' stroke-width="4"/><path d="M17 16q-3-4 0-8M25 16q-3-4 0-8M33 16q-3-4 0-8" ' + S + ' stroke-width="3.5"/>'
  };
  var CARTA_COLOR = {
    'avanzar': '#2f80ed', 'retroceder': '#2f80ed', 'girar-d': '#7c4dff', 'girar-i': '#7c4dff', 'saltar': '#0fa37f',
    'recoger': '#e07b00', 'activar': '#d6453d', 'esperar': '#6f7d8f',
    'repetir': '#ab47bc', 'si': '#d81b7a', 'mientras': '#8e44ad', 'receta': '#1f9d55'
  };
  var CARTA_NOMBRE = {
    'avanzar': 'Avanzar', 'retroceder': 'Retroceder', 'girar-d': 'Girar derecha', 'girar-i': 'Girar izquierda', 'saltar': 'Saltar',
    'recoger': 'Recoger', 'activar': 'Activar', 'esperar': 'Esperar', 'repetir': 'Repetir', 'si': 'Si', 'mientras': 'Mientras', 'receta': 'Receta'
  };
  function iconoCarta(t, tam) {
    return '<svg viewBox="0 0 48 48" width="' + (tam || 48) + '" height="' + (tam || 48) + '" aria-hidden="true">' + (ICONOS[t] || '') + '</svg>';
  }

  // Condiciones (32×32)
  var COND_ICONOS = {
    'obstaculo-delante': '<rect x="4" y="9" width="24" height="16" rx="2" fill="#b0673a"/><path d="M4 17h24M12 9v8M20 17v8" stroke="#6d3c1b" stroke-width="2"/>',
    'agua-delante': '<rect x="3" y="6" width="26" height="20" rx="5" fill="#3aa0ff"/><path d="M6 13q3.5-3.5 7 0t7 0 6 0M6 20q3.5-3.5 7 0t7 0 6 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    'objeto-aqui': '<path d="M16 3l9 8-9 18-9-18z" fill="#ffb02e" stroke="#e07b00" stroke-width="2" stroke-linejoin="round"/>',
    'interruptor-aqui': '<circle cx="16" cy="16" r="12" fill="#eee" stroke="#555" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="#ff5a5f"/>',
    'meta-aqui': '<path d="M9 28V4" stroke="#444" stroke-width="3" stroke-linecap="round"/><path d="M10 5h16l-4 6 4 6H10z" fill="#e8553f"/>'
  };
  var COND_NOMBRE = {
    'obstaculo-delante': 'obstáculo delante', 'agua-delante': 'vacío delante', 'objeto-aqui': 'objeto aquí',
    'interruptor-aqui': 'interruptor aquí', 'meta-aqui': 'meta aquí'
  };
  function iconoCond(c, no, tam) {
    tam = tam || 32;
    return '<svg viewBox="0 0 32 32" width="' + tam + '" height="' + tam + '" aria-hidden="true">' + (COND_ICONOS[c] || '') +
      (no ? '<circle cx="16" cy="16" r="14" fill="none" stroke="#d6232d" stroke-width="3"/><path d="M6 26L26 6" stroke="#d6232d" stroke-width="3.5" stroke-linecap="round"/>' : '') + '</svg>';
  }

  // ---------------------------------------------------------------- insignias (64×64)
  var INS = {
    huella: '<path d="M22 44c-4-6-1-14 5-14s9 8 5 14-6 6-10 0zM14 28a4 5 0 1 1 8 0 4 5 0 1 1-8 0zM30 22a4 5 0 1 1 8 0 4 5 0 1 1-8 0z" fill="#fff"/>',
    giro: '<path d="M18 46V32q0-12 12-12h14M38 12l8 8-8 8" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    luz: '<path d="M32 8l5 17 17 5-17 5-5 17-5-17-17-5 17-5z" fill="#fff"/>',
    salto: '<path d="M8 46Q32-6 56 46" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="56" cy="46" r="4" fill="#fff"/>',
    bucle: '<path d="M14 30a18 18 0 0 1 32-10M50 34a18 18 0 0 1-32 10" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M48 8v14H34M16 56V42h14" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    lupa: '<circle cx="28" cy="28" r="13" stroke="#fff" stroke-width="6" fill="none"/><path d="M38 38l14 14" stroke="#fff" stroke-width="7" stroke-linecap="round"/>',
    receta: '<path d="M12 28h40v14a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" fill="#fff"/><path d="M22 20q-4-5 0-10M32 20q-4-5 0-10M42 20q-4-5 0-10" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>',
    si: '<path d="M32 54V34M32 34L16 14M32 34l16-20" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="16" cy="12" r="6" fill="#fff"/><circle cx="48" cy="12" r="6" fill="#fff"/>',
    estrella: '<path d="M32 6l8.5 19.5 21 2-16 14 5 21L32 50 13.5 62.5l5-21-16-14 21-2z" fill="#fff"/>',
    corazon: '<path d="M32 54C10 38 8 22 18 16c7-4 12 0 14 6 2-6 7-10 14-6 10 6 8 22-14 38z" fill="#fff"/>',
    flor: '<g fill="#fff"><circle cx="32" cy="18" r="9"/><circle cx="44" cy="28" r="9"/><circle cx="40" cy="42" r="9"/><circle cx="24" cy="42" r="9"/><circle cx="20" cy="28" r="9"/></g><circle cx="32" cy="32" r="8" fill="#ffd166"/>',
    zanahoria: '<path d="M26 12l6 8 6-8" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M18 20h28L32 58z" fill="#fff"/>',
    concha: '<path d="M8 48q0-32 24-34 24 2 24 34z" fill="#fff"/><path d="M32 14v34M20 20l7 28M44 20l-7 28" stroke="#0003" stroke-width="3" fill="none"/>',
    brujula: '<circle cx="32" cy="32" r="22" stroke="#fff" stroke-width="5" fill="none"/><path d="M32 14l7 18-7 18-7-18z" fill="#fff"/>',
    faro: '<path d="M20 56l5-34h14l5 34z" fill="#fff"/><rect x="22" y="12" width="20" height="10" rx="2" fill="#fff"/><path d="M12 17l8 3M52 17l-8 3" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    llave: '<circle cx="22" cy="24" r="12" stroke="#fff" stroke-width="6" fill="none"/><path d="M30 32l22 22M44 46l6-6M38 40l6-6" stroke="#fff" stroke-width="6" stroke-linecap="round"/>',
    lab: '<path d="M24 8h16M28 8v18L12 54h40L36 26V8" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="30" cy="42" r="4" fill="#fff"/><circle cx="40" cy="46" r="3" fill="#fff"/>'
  };
  var INS_COLOR = ['#ef6c57', '#f59e0b', '#22a06b', '#2f80ed', '#7c4dff', '#d81b7a', '#0ea5a4'];
  function insignia(icono, idx, bloqueada) {
    var c = bloqueada ? '#c3c9d4' : INS_COLOR[(idx | 0) % INS_COLOR.length];
    return '<svg viewBox="0 0 64 64" class="ins-svg" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="' + c + '"/><circle cx="32" cy="32" r="30" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>' +
      '<g opacity="' + (bloqueada ? .45 : 1) + '">' + (INS[icono] || INS.estrella) + '</g></svg>';
  }

  // ---------------------------------------------------------------- varios
  function estrella(llena, tam) {
    return '<svg viewBox="0 0 64 64" class="estrella ' + (llena ? 'llena' : 'vacia') + '" width="' + (tam || 40) + '" height="' + (tam || 40) + '" aria-hidden="true">' +
      '<path d="M32 5l8.7 19.2 21 2.2-15.7 14 4.6 20.6L32 50.3 13.4 61l4.6-20.6L2.3 26.4l21-2.2z" fill="' + (llena ? '#ffd93d' : '#e6e9f2') + '" stroke="' + (llena ? '#ffb800' : '#c8cede') + '" stroke-width="4" stroke-linejoin="round"/></svg>';
  }
  function candado() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="14" width="20" height="14" rx="3" fill="#8a94a8"/><path d="M10 14v-3a6 6 0 0 1 12 0v3" stroke="#8a94a8" stroke-width="3.5" fill="none"/><circle cx="16" cy="21" r="2.5" fill="#fff"/></svg>';
  }
  function brujulaPieza(n, llena) {
    return '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="' + (llena ? '#ffe9a8' : '#e3e7f0') + '" stroke="' + (llena ? '#e0a21b' : '#b7bfd0') + '" stroke-width="4"/>' +
      (llena ? '<path d="M32 10l7 22-7 22-7-22z" fill="#e8553f"/><path d="M32 54l-7-22h14z" fill="#7a8aa8"/>' : '<text x="32" y="40" text-anchor="middle" font-size="24" font-family="Baloo 2,sans-serif" fill="#b7bfd0">' + n + '</text>') + '</svg>';
  }

  // 12 pictogramas para el código de partida de Infantil (valores 0..11)
  var PICTOS = ['flor', 'zanahoria', 'fruta', 'concha', 'luciernaga', 'cristal', 'perla', 'gema', 'bateria', 'estrella', 'chispa', 'casa'];
  var PICTO_NOMBRE = ['Flor', 'Zanahoria', 'Fruta', 'Concha', 'Luciérnaga', 'Cristal', 'Perla', 'Gema', 'Batería', 'Estrella', 'Chispa', 'Casa'];
  function picto(i) {
    var n = PICTOS[i];
    return '<svg viewBox="0 0 64 64" class="picto-svg" aria-hidden="true">' + (n === 'casa' ? METAS.casa() : OBJETOS[n]()) + '</svg>';
  }

  // Defs globales (degradados reutilizables por todos los SVG en línea)
  function defs() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<radialGradient id="gLumoGlow"><stop offset="55%" stop-color="#ffe27a" stop-opacity=".45"/><stop offset="100%" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gLumo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ff9d2e"/></linearGradient>' +
      '<linearGradient id="gLlama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient>' +
      '</defs></svg>';
  }

  function logo() {
    return '<svg viewBox="0 0 560 180" class="logo-svg" role="img" aria-label="RUMBO"><defs><linearGradient id="gLogo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset="1" stop-color="#ffb02e"/></linearGradient></defs>' +
      '<g font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="128" text-anchor="middle">' +
      '<text x="280" y="136" fill="#5b2a86" stroke="#5b2a86" stroke-width="18" stroke-linejoin="round">RUMBO</text>' +
      '<text x="280" y="136" fill="url(#gLogo)" stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke">RUMBO</text></g></svg>';
  }

  UI.Arte = {
    TEMAS: TEMAS, NOMBRES_ZONA: NOMBRES_ZONA, celda: celda, objeto: objeto, interruptor: interruptor, puerta: puerta,
    lumo: lumo, exprDe: exprDe, EXPRESIONES: EXPRESIONES, personaje: personaje, PERSONAJES: Object.keys(PERSONAJES).concat(Object.keys(CHISPAS_DISENO), ['Lumo']),
    iconoCarta: iconoCarta, CARTA_COLOR: CARTA_COLOR, CARTA_NOMBRE: CARTA_NOMBRE,
    iconoCond: iconoCond, COND_NOMBRE: COND_NOMBRE, insignia: insignia,
    picto: picto, PICTOS: PICTOS, PICTO_NOMBRE: PICTO_NOMBRE,
    estrella: estrella, candado: candado, brujulaPieza: brujulaPieza, defs: defs, logo: logo
  };
})(typeof self !== 'undefined' ? self : this);
