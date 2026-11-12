import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ES from '../src/datos/escenas.js';
import VOCES from '../src/datos/voces-es.js';
import CAT from '../src/datos/catalogo.js';

CAT.registrarVoces();
const REPARTO = ['Lumo', 'Conejo', 'Búho Bruma', 'Titila', 'Brasa', 'Tinta', 'Destello', 'Lagarto gigante', 'Ascua', 'Bit', 'Píxel', 'Cometa', 'Bichito', 'Abuela Chispa'];
const PROHIBIDAS = /empuj|ascensor|variable|contador|par[aá]metro|sensor de luz|si hay luz/i;
const palabras = (s) => s.replace(/[«»¡!¿?.,:;…]/g, ' ').split(/\s+/).filter(Boolean).length;
const frases = (t) => t.split(/(?<=[.!?])\s+(?=[¡¿A-ZÁÉÍÓÚÑ«])/);
const limite = (infantil) => (infantil ? 9 : 14);
const esInfantil = (e) => e.etapa === 'infantil';

test('toda escena usa frases que existen, de su escena, y personajes del reparto', () => {
  const vistos = new Set();
  for (const e of ES.ESCENAS) {
    for (const l of e.lineas) {
      const v = VOCES.lineas[l.id];
      assert.ok(v, `${e.id}: falta la frase ${l.id}`);
      assert.equal(v.escena, e.id, `${l.id} debería pertenecer a ${e.id}`);
      assert.ok(REPARTO.includes(v.quien), `${e.id}: personaje desconocido ${v.quien}`);
      assert.ok(!vistos.has(l.id), `frase repetida ${l.id}`);
      vistos.add(l.id);
    }
  }
});

test('no hay frases de escena huérfanas en voces-es.js', () => {
  for (const [id, v] of Object.entries(VOCES.lineas)) {
    if (v.escena) assert.ok(ES.POR_ID[v.escena], `${id} apunta a una escena que no existe: ${v.escena}`);
  }
});

test('todos los personajes que hablan o salen en créditos tienen figura en arte.js', () => {
  const arte = fs.readFileSync(new URL('../src/ui/arte.js', import.meta.url), 'utf8');
  const nombres = new Set(ES.ESCENAS.flatMap((e) => e.lineas.map((l) => VOCES.lineas[l.id].quien)));
  ES.ESCENAS.forEach((e) => (e.creditos ? e.creditos.filas.forEach((f) => nombres.add(f[0])) : 0));
  for (const n of nombres) if (n !== 'Lumo') assert.ok(arte.includes(`'${n}':`), `falta la figura de ${n}`);
});

test('todo disparador apunta a un nivel real', () => {
  for (const e of ES.ESCENAS) {
    assert.ok(CAT.POR_ID[e.dispara.nivel], `${e.id} se dispara en un nivel que no existe: ${e.dispara.nivel}`);
    assert.ok(['antes', 'despues'].includes(e.dispara.cuando));
  }
  for (const g of ES.GUINOS) for (const k of ['infantil', 'primaria']) if (g[k]) assert.ok(CAT.POR_ID[g[k]], `guiño ${g.id}: nivel ${g[k]}`);
});

test('el orden de las escenas es coherente con el orden de los retos (infantil y primaria por separado)', () => {
  const sec = (e) => (esInfantil(e) ? CAT.SEC_INFANTIL : CAT.SEC_PRIMARIA);
  const pos = (e) => {
    let i = sec(e).indexOf(e.dispara.nivel), base = 0;
    if (i < 0 && !esInfantil(e)) { i = CAT.SEC_INFANTIL.indexOf(e.dispara.nivel); base = -1000; }   // la bienvenida usa los retos de Infantil
    assert.ok(i >= 0, `${e.id}: nivel fuera de secuencia`);
    return base + i * 2 + (e.dispara.cuando === 'despues' ? 1 : 0);
  };
  for (const etapa of ['infantil', 'primaria']) {
    const l = ES.ESCENAS.filter((e) => e.etapa === etapa);
    for (let i = 1; i < l.length; i++) assert.ok(pos(l[i]) >= pos(l[i - 1]), `${l[i].id} aparece antes que ${l[i - 1].id}`);
  }
});

test('ninguna frase supera el límite de palabras ni menciona mecánicas que no existen', () => {
  for (const e of ES.ESCENAS) {
    for (const l of e.lineas) {
      const t = VOCES.lineas[l.id].texto;
      for (const f of frases(t)) assert.ok(palabras(f) <= limite(esInfantil(e)), `${l.id}: demasiado larga (${palabras(f)}): ${f}`);
      assert.ok(!PROHIBIDAS.test(t), `${l.id} menciona algo que no existe: ${t}`);
      assert.notEqual(l.emocion, 'triste');
    }
  }
});

test('número de intervenciones: Infantil 1–3; Primaria 2–6 (salvo la escena de créditos sin frases)', () => {
  for (const e of ES.ESCENAS) {
    if (e.id.startsWith('BV-')) continue;   // la bienvenida no cambia en esta versión
    const n = e.lineas.length;
    if (e.id === 'FIN-03') { assert.equal(n, 0); continue; }
    if (esInfantil(e)) assert.ok(n >= 1 && n <= 3, `${e.id}: ${n}`);
    else if (!e.id.startsWith('GC-')) assert.ok(n >= 2 && n <= 6, `${e.id}: ${n}`);
  }
});

test('las 102 introducciones de nivel son cortas, no mencionan mecánicas inexistentes y no rompen la burbuja del juego', () => {
  assert.equal(CAT.TODOS.length, 102);
  for (const n of CAT.TODOS) {
    assert.ok(n.intro && n.intro.length > 10, `${n.id}: sin introducción`);
    const inf = n.mundo === 0;
    for (const f of frases(n.intro)) assert.ok(palabras(f) <= limite(inf), `${n.id}: frase larga: ${f}`);
    assert.ok(!PROHIBIDAS.test(n.intro), `${n.id}: ${n.intro}`);
    assert.ok(!/^[^:«.!?]{2,24}:/.test(n.intro), `${n.id}: empieza como «Quien:» y la pantalla recortaría el texto`);
    assert.ok(!/faro/i.test(n.intro) || n.mundo === 4 || n.id === 'sec-4' || n.mundo === 'sec', `${n.id}: habla del Faro antes de llegar`);
  }
});

test('Infantil nunca ve escenas de Primaria (CAP, CF, FIN, BV, AR…) y Primaria nunca ve las de Infantil', () => {
  for (const id of CAT.TODOS.map((n) => n.id)) for (const cuando of ['antes', 'despues']) {
    for (const infantil of [true, false]) {
      const l = ES.pendientes({ cuando, nivel: id, infantil, vistas: {}, esFinalDelCurso: true, guinosActivos: true });
      for (const s of l) {
        assert.equal(ES.POR_ID[s].etapa === 'infantil', infantil, `${s} no es para ${infantil ? 'Infantil' : 'Primaria'}`);
        if (infantil) assert.ok(/^(C0|GC-0)/.test(s), `Infantil ve ${s}`);
      }
    }
  }
});

test('cada curso tiene su propio final y ningún curso ve un final que no es el suyo', () => {
  const esperado = { inf3: 'C0-02', inf4: 'C0-03', inf5: 'C0-04', p1: 'CAP1-01', p2: 'CAP1-01', p3: 'CAP2-01', p4: 'CAP2-01', p5: 'FIN-04', p6: 'FIN-04' };
  for (const c of CAT.CURSOS) {
    const nivel = CAT.finalDe(c.id);
    const l = ES.pendientes({ cuando: 'despues', nivel, infantil: c.id.startsWith('inf'), vistas: {}, esFinalDelCurso: true });
    assert.ok(l.includes(esperado[c.id]), `${c.id}: falta ${esperado[c.id]} en ${nivel} (${l})`);
  }
  // 1.º–2.º y 3.º–4.º nunca ven el gran final
  for (const nivel of ['m1-25', 'm2-25']) {
    const l = ES.pendientes({ cuando: 'despues', nivel, infantil: false, vistas: {}, esFinalDelCurso: true });
    assert.ok(!l.some((s) => s.startsWith('FIN-')), `${nivel} muestra el gran final`);
  }
  // quien llega a f-03 sin ser su final de curso no ve FIN
  assert.ok(!ES.pendientes({ cuando: 'despues', nivel: 'f-03', infantil: false, vistas: {}, esFinalDelCurso: false }).some((s) => s.startsWith('FIN-')));
  // el final de 5.º–6.º tiene encendido, abuela, créditos y epílogo
  assert.deepEqual(ES.pendientes({ cuando: 'despues', nivel: 'f-03', infantil: false, vistas: {}, esFinalDelCurso: true }), ['FIN-01', 'FIN-02', 'FIN-03', 'FIN-04']);
});

test('las escenas ya vistas no se repiten', () => {
  const l = ES.pendientes({ cuando: 'despues', nivel: 'm1-25', infantil: false, vistas: { 'CAP1-01': true }, esFinalDelCurso: true });
  assert.deepEqual(l, ['CAP1-02', 'CAP1-03']);
});

test('«Antes, en RUMBO…» solo sale a quien entra al Mundo 2 o 3 sin haber visto el capítulo anterior', () => {
  const n2 = { cuando: 'antes', nivel: 'm2-01', infantil: false, esFinalDelCurso: false };
  assert.deepEqual(ES.pendientes({ ...n2, vistas: {} }), ['AR-2', 'C2-01']);
  assert.deepEqual(ES.pendientes({ ...n2, vistas: { 'CAP1-03': true } }), ['C2-01']);
  const n3 = { cuando: 'antes', nivel: 'm3-p1', infantil: false, esFinalDelCurso: false };
  assert.deepEqual(ES.pendientes({ ...n3, vistas: {} }), ['AR-3', 'C3-01']);
  assert.deepEqual(ES.pendientes({ ...n3, vistas: { 'CAP2-03': true } }), ['C3-01']);
  assert.deepEqual(ES.POR_ID['AR-3'].marca, ['AR-2']);
});

test('los comentarios del guiño no se ofrecen hasta que exista el guiño visual', () => {
  const base = { cuando: 'despues', nivel: 'm1-01', infantil: false, vistas: {}, esFinalDelCurso: false };
  assert.ok(!ES.pendientes({ ...base, guinosActivos: false }).includes('GC-1'));
  assert.ok(ES.pendientes({ ...base, guinosActivos: true }).includes('GC-1'));
  assert.equal(ES.GUINOS_ACTIVOS, true);
});

test('las seis chispas: meta = último reto de su zona, ventanas en orden, anuncio y rescate coherentes', () => {
  assert.equal(ES.CHISPAS.length, 6);
  let previo = -1;
  ES.CHISPAS.forEach((c, i) => {
    const deZona = CAT.SEC_PRIMARIA.filter((id) => CAT.POR_ID[id].zona === c.zona);
    assert.equal(c.meta, deZona[deZona.length - 1], `${c.nombre}: la meta no es el último reto de ${c.zona}`);
    assert.equal(c.ventana, i + 1);
    const pos = CAT.SEC_PRIMARIA.indexOf(c.meta); assert.ok(pos > previo); previo = pos;
    const r = ES.POR_ID[c.rescate]; assert.deepEqual([r.dispara.cuando, r.dispara.nivel], ['despues', c.meta], `${c.nombre}: rescate`);
    assert.equal(CAT.POR_ID[ES.POR_ID[c.anuncio].dispara.nivel].zona, c.zona, `${c.nombre}: se anuncia fuera de su zona`);
    assert.ok(ES.lineasDe(c.anuncio).some((id) => VOCES.lineas[id].texto.includes(c.nombre)) || ES.lineasDe(c.anuncio).some((id) => /Ascua|Cometa|Píxel/.test(VOCES.lineas[id].texto)), `${c.nombre}: no se nombra en ${c.anuncio}`);
  });
});

test('el guiño (corto, corto, largo) se ve al menos seis veces antes del gran final', () => {
  const previos = ES.GUINOS.filter((g) => g.primaria && g.tipo !== 'encendido');
  assert.ok(previos.length >= 6, String(previos.length));
  assert.ok(ES.GUINOS.some((g) => g.tipo === 'encendido'));
});

test('el arco de Bichito tiene sus cinco tiempos y las escenas retiradas ya no existen', () => {
  for (const id of ['C1-02', 'CAP1-02', 'B2-1', 'B2-2', 'CAP2-02', 'BI-3', 'BI-4a', 'BI-4b', 'FIN-01']) assert.ok(ES.POR_ID[id], id);
  for (const id of ['CF-03', 'CF-04', 'CF-05', 'C1-04', 'C1-05', 'C2-04', 'C2-05', 'C3-03', 'C3-05']) assert.ok(!ES.POR_ID[id], `${id} debería estar retirada`);
  assert.ok(VOCES.lineas.c3_03_a.texto.includes('perdido'));
});

test('las escenas CF-01 y CF-02 ya tienen frases y se muestran', () => {
  assert.ok(ES.lineasDe('CF-01').length >= 2 && ES.lineasDe('CF-02').length >= 2);
  assert.ok(ES.pendientes({ cuando: 'antes', nivel: 'f-01', infantil: false, vistas: {}, esFinalDelCurso: false }).includes('CF-01'));
});

test('«Repetir» se explica en m1-15 y no antes (corrige el orden de C1-03 y C1-04)', () => {
  assert.equal(ES.POR_ID['C1-03'].dispara.nivel, 'm1-15');
  assert.ok(!ES.ESCENAS.some((e) => e.dispara.nivel === 'm1-14' && e.dispara.cuando === 'antes' && e.lineas.some((l) => /Repetir/.test(VOCES.lineas[l.id].texto))));
  assert.ok(CAT.POR_ID['m1-15'].cartas.disponibles.includes('repetir'));
});

// ---------------------------------------------------------------- fase 3: pasos de puesta en escena
const E = ES;
{
  const TIPOS = ['fondo', 'entra', 'sale', 'emocion', 'accion', 'objeto', 'camara', 'sonido', 'espera', 'dice'];
  const conPasos = E.ESCENAS.filter(e => e.pasos);
  test('hay escenas con pasos escritos a mano', () => { assert.ok(conPasos.length >= 5); });
  test('todo paso usa un tipo conocido y las cámaras, acciones y objetos son válidos', () => {
    const CAM = ['acerca', 'aleja', 'sacude'], ACC = ['salta', 'baila', 'tiembla', 'gira', 'asiente'], OBJ = ['pieza', 'brujula', 'luz', 'flor', 'zanahoria', 'estrella'];
    conPasos.forEach(e => e.pasos.forEach(p => {
      assert.ok(TIPOS.some(t => t in p), e.id + ': paso desconocido ' + JSON.stringify(p));
      if (p.camara) assert.ok(CAM.includes(p.camara), e.id);
      if (p.haz) assert.ok(ACC.includes(p.haz), e.id + ' acción ' + p.haz);
      if (p.objeto) assert.ok(OBJ.includes(p.objeto), e.id + ' objeto ' + p.objeto);
    }));
  });
  test('cada escena con pasos dice todas sus frases, una vez y en orden', () => {
    conPasos.forEach(e => {
      const dichas = e.pasos.filter(p => p.dice);
      assert.equal(dichas.length, e.lineas.length, e.id + ': nº de {dice} distinto al de líneas');
      dichas.forEach(p => assert.equal(p.dice, '*', e.id));
    });
  });
  test('quien habla entra antes de hablar o es Lumo (el motor lo hace entrar si falta)', () => {
    conPasos.forEach(e => assert.ok(e.pasos.some(p => p.entra === 'Lumo'), e.id + ' no hace entrar a Lumo'));
  });
  test('el fondo de los pasos coincide con la zona de la escena', () => {
    conPasos.forEach(e => e.pasos.filter(p => p.fondo).forEach(p => assert.equal(p.fondo, e.zona, e.id)));
  });
}
