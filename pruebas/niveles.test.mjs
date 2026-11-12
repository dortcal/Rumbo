import test from 'node:test';
import assert from 'node:assert/strict';
import I from '../src/engine/interprete.js';
import V from '../src/engine/validador-nivel.js';
import C from '../src/datos/catalogo.js';
import VOCES from '../src/datos/voces-es.js';

test('hay 15 retos de Infantil y 25 niveles por ciclo, más el Faro y los secretos', () => {
  assert.equal(C.MUNDOS[0].niveles.length, 15);
  [1, 2].forEach(m => assert.equal(C.MUNDOS[m].niveles.length, 25));
  assert.equal(C.MUNDOS[3].niveles.length, 30);   // 5 de calentamiento + 25
  assert.equal(C.MUNDOS[4].niveles.length, 3);
  assert.equal(C.SECRETOS.length, 4);
  assert.equal(C.TODOS.length, 102);
});

test('los identificadores son únicos', () => {
  const ids = C.TODOS.map(n => n.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('TODOS los niveles superan el validador (referencia correcta y, en Primaria, 3 estrellas)', () => {
  const malos = [];
  C.TODOS.forEach(n => { const r = V.validarNivel(n); if (!r.ok) malos.push(n.id + ': ' + r.errores.join('; ')); });
  assert.deepEqual(malos, []);
});

test('los niveles de depuración tienen un programa inicial que FALLA y los de optimización uno que FUNCIONA', () => {
  const con = C.TODOS.filter(n => n.programaInicial);
  assert.ok(con.length >= 20, 'debe haber muchos niveles de depuración');
  con.forEach(n => {
    const r = I.ejecutar(n, n.programaInicial);
    if (n.tipo === 'optimizar') assert.equal(r.ok, true, n.id);
    else assert.equal(r.ok, false, n.id);
  });
});

test('Infantil no usa bucles, condiciones, funciones ni textos de código', () => {
  C.MUNDOS[0].niveles.forEach(n => {
    ['repetir', 'si', 'mientras', 'receta', 'activar'].forEach(t => assert.ok(!n.cartas.disponibles.includes(t), n.id + ' usa ' + t));
    assert.ok(n.huecos >= 1 && n.huecos <= 7, n.id + ' huecos');
    assert.ok(n.curriculo.oficial.every(o => o.decreto === '196/2022'), n.id);
  });
});

test('Infantil: 3 años ≤ 3 tarjetas (solo el último reto, el de recoger, llega a 3); 4 años ≤ 4; 5 años ≤ 7', () => {
  const tope = { 3: 3, 4: 4, 5: 7 };
  C.ITINERARIOS[3].slice(0, 4).forEach(id => assert.ok(I.contarTarjetas(C.POR_ID[id].referencia) <= 2, id));
  C.MUNDOS[0].niveles.forEach(n => assert.ok(I.contarTarjetas(n.referencia) <= tope[n.itinerario], n.id));
  ['3', '4', '5'].forEach(k => assert.equal(C.ITINERARIOS[k].length, 5));
});

test('los bucles no aparecen antes de su mundo y los anidados solo en 3.er ciclo', () => {
  [C.MUNDOS[1], C.MUNDOS[2]].forEach(m => m.niveles.forEach(n => {
    let anidado = false;
    (function visita(l, dentro) {
      (Array.isArray(l) ? l : []).forEach(x => {
        if (x.t === 'repetir' && dentro) anidado = true;
        visita(x.cuerpo, dentro || x.t === 'repetir'); visita(x.entonces, dentro); visita(x.sino, dentro);
      });
    })(Array.isArray(n.referencia) ? n.referencia : n.referencia.principal, false);
    assert.equal(anidado, false, n.id + ' tiene bucles anidados');
  }));
  C.MUNDOS[1].niveles.slice(0, 14).forEach(n => assert.ok(!n.cartas.disponibles.includes('repetir'), n.id));
});

test('cada nivel de Primaria declara curriculo oficial real y la extensión aparte', () => {
  C.TODOS.filter(n => n.etapa !== 'infantil').forEach(n => {
    assert.ok(n.curriculo.oficial.length > 0, n.id);
    n.curriculo.oficial.forEach(o => { assert.equal(o.decreto, '211/2022'); assert.ok(o.texto === undefined || o.texto.length > 10); });
    assert.ok(n.curriculo.extension.length > 0, n.id + ' sin extensión');
  });
});

test('cada nivel tiene título, objetivo e introducción', () => {
  C.TODOS.forEach(n => { assert.ok(n.titulo && n.objetivo && n.intro && n.zona, n.id); });
});

test('las tarjetas nuevas se introducen de forma gradual', () => {
  assert.deepEqual(C.cartasNuevas('m1-03'), ['retroceder']);
  assert.deepEqual(C.cartasNuevas('m1-14'), ['saltar']);
  assert.deepEqual(C.cartasNuevas('m1-15'), ['repetir']);
  assert.deepEqual(C.cartasNuevas('m2-11'), ['receta']);
  assert.deepEqual(C.cartasNuevas('m2-22'), ['si']);
  assert.deepEqual(C.cartasNuevas('m3-06'), ['mientras']);
});

test('las voces de los niveles se añaden al archivo único', () => {
  C.registrarVoces();
  assert.ok(VOCES.lineas['n_i3-01']);
  assert.ok(VOCES.lineas['i_m3-25']);
  assert.equal(VOCES.lineas['n_m1-01'].texto, 'Lleva a Lumo hasta la meta.');
});

test('la solución de referencia respeta el límite de pasos con holgura', () => {
  C.TODOS.forEach(n => { const r = I.ejecutar(n, n.referencia); assert.ok(r.pasos < 200, n.id + ' pasos ' + r.pasos); });
});
