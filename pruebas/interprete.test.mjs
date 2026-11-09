import test from 'node:test';
import assert from 'node:assert/strict';
import I from '../src/engine/interprete.js';

const E = { x: 0, y: 0, dir: 'E' };
const niv = (mapa, inicio = E) => ({ mapa, inicio });
const A = { t: 'avanzar' };
const GD = { t: 'girar-d' };
const GI = { t: 'girar-i' };
const rep = (n, ...cuerpo) => ({ t: 'repetir', n, cuerpo });
const veces = (n, nodo) => Array.from({ length: n }, () => nodo);
const si = (cond, entonces, sino = []) => ({ t: 'si', cond, entonces, sino });
const mientras = (cond, ...cuerpo) => ({ t: 'mientras', cond, cuerpo });
const c = (t, no = false) => ({ t, no });

// [nombre, mapa, inicio, programa, esperado]
const CASOS = [
  ['recto hasta la meta', ['...G'], E, veces(3, A), { ok: true, motivo: 'meta', x: 3 }],
  ['programa corto', ['...G'], E, veces(2, A), { ok: false, motivo: 'objetivo-incompleto', x: 2 }],
  ['termina al llegar a la meta (sobran tarjetas)', ['...G'], E, veces(4, A), { ok: true, motivo: 'meta', pasos: 3 }],
  ['choque con pared', ['.#.G'], E, [A], { ok: false, motivo: 'choque', x: 0, nodoError: '0' }],
  ['choque con el borde', ['..G'], E, [GI, A], { ok: false, motivo: 'choque', nodoError: '1' }],
  ['recorrido con giros', ['...', '.#.', '..G'], E, [A, A, GD, A, A], { ok: true, motivo: 'meta', x: 2, y: 2 }],
  ['recorrido con giros, orden equivocado', ['...', '.#.', '..G'], E, [GD, A, A, GI, A, A], { ok: true, motivo: 'meta', x: 2, y: 2 }],
  ['cuatro giros a la derecha vuelven al este', ['...'], E, veces(4, GD), { ok: false, dir: 'E' }],
  ['girar a la izquierda desde el este mira al norte', ['...'], E, [GI], { ok: false, dir: 'N' }],
  ['retroceder', ['...G'], { x: 2, y: 0, dir: 'E' }, [{ t: 'retroceder' }], { ok: false, x: 1, dir: 'E' }],
  ['recoger y llegar', ['.o.G'], E, [A, { t: 'recoger' }, A, A], { ok: true, motivo: 'meta' }],
  ['llegar sin recoger no gana', ['.o.G'], E, veces(3, A), { ok: false, motivo: 'objeto-olvidado', x: 3 }],
  ['recoger sin objeto no es error', ['..G'], E, [{ t: 'recoger' }, A, A], { ok: true, motivo: 'meta' }],
  ['caída al agua', ['.~.G'], E, [A], { ok: false, motivo: 'caida', x: 1 }],
  ['saltar el agua', ['.~.G'], E, [{ t: 'saltar' }, A], { ok: true, motivo: 'meta' }],
  ['saltar la barrera baja', ['.b.G'], E, [{ t: 'saltar' }, A], { ok: true, motivo: 'meta' }],
  ['no se puede avanzar contra la barrera baja', ['.b.G'], E, [A], { ok: false, motivo: 'choque' }],
  ['no se puede saltar un muro', ['.#.G'], E, [{ t: 'saltar' }], { ok: false, motivo: 'choque' }],
  ['saltar y aterrizar en un muro', ['..#G'], E, [{ t: 'saltar' }], { ok: false, motivo: 'choque' }],
  ['saltar y aterrizar en el agua', ['..~G'], E, [{ t: 'saltar' }], { ok: false, motivo: 'caida' }],
  ['interruptor abre la puerta', ['s.dG'], E, [{ t: 'activar' }, A, A, A], { ok: true, motivo: 'meta' }],
  ['puerta cerrada bloquea', ['s.dG'], E, [A, A], { ok: false, motivo: 'choque', x: 1 }],
  ['activar fuera del interruptor no es error', ['..G'], E, [{ t: 'activar' }, A, A], { ok: true }],
  ['repetir 5', ['.....G'], E, [rep(5, A)], { ok: true, motivo: 'meta' }],
  ['repetir 4 se queda corto', ['.....G'], E, [rep(4, A)], { ok: false, motivo: 'objetivo-incompleto', x: 4 }],
  ['repetir 0 no es válido', ['...G'], E, [rep(0, A)], { ok: false, motivo: 'programa-invalido' }],
  ['repetir 100 no es válido', ['...G'], E, [rep(100, A)], { ok: false, motivo: 'programa-invalido' }],
  ['repetir 1,5 no es válido', ['...G'], E, [rep(1.5, A)], { ok: false, motivo: 'programa-invalido' }],
  ['bucles anidados', ['....G'], E, [rep(2, rep(2, A))], { ok: true, motivo: 'meta' }],
  ['mientras no esté en la meta', ['....G'], E, [mientras(c('meta-aqui', true), A)], { ok: true, motivo: 'meta' }],
  ['mientras no haya obstáculo delante', ['..#'], E, [mientras(c('obstaculo-delante', true), A)], { ok: false, x: 1 }],
  ['si / si no', ['..G'], E, [rep(2, si(c('obstaculo-delante'), [{ t: 'esperar' }], [A]))], { ok: true }],
  ['si hay un objeto aquí', ['o.G'], E, [si(c('objeto-aqui'), [{ t: 'recoger' }]), A, A], { ok: true }],
  ['si hay agua delante salta', ['.~.G'], E, [si(c('agua-delante'), [{ t: 'saltar' }], [A]), A], { ok: true }],
  ['si estoy en un interruptor', ['s.dG'], E, [si(c('interruptor-aqui'), [{ t: 'activar' }]), A, A, A], { ok: true }],
  ['receta reutilizable', ['....G'], E, { principal: [{ t: 'receta', nombre: 'A' }, { t: 'receta', nombre: 'A' }], recetas: { A: [A, A] } }, { ok: true, motivo: 'meta' }],
  ['receta inexistente', ['...G'], E, { principal: [{ t: 'receta', nombre: 'X' }], recetas: {} }, { ok: false, motivo: 'receta-inexistente' }],
  ['recursión infinita de recetas', ['...G'], E, { principal: [{ t: 'receta', nombre: 'A' }], recetas: { A: [{ t: 'receta', nombre: 'A' }] } }, { ok: false, motivo: 'profundidad' }],
  ['programa vacío', ['...G'], E, [], { ok: false, motivo: 'programa-vacio', pasos: 0 }],
  ['programa vacío con objeto', ['...G'], E, { principal: [] }, { ok: false, motivo: 'programa-vacio' }],
  ['tarjeta desconocida', ['...G'], E, [{ t: 'volar' }], { ok: false, motivo: 'programa-invalido', nodoError: '0' }],
  ['nodo nulo', ['...G'], E, [null], { ok: false, motivo: 'programa-invalido' }],
  ['condición desconocida', ['...G'], E, [si(c('llueve'), [A])], { ok: false, motivo: 'programa-invalido' }]
];

for (const [nombre, mapa, inicio, programa, esperado] of CASOS) {
  test('programa: ' + nombre, () => {
    const r = I.ejecutar(niv(mapa, inicio), programa);
    for (const k of Object.keys(esperado)) {
      let real;
      if (k === 'x' || k === 'y' || k === 'dir') real = r.final[k];
      else real = r[k];
      assert.equal(real, esperado[k], `${k}: esperado ${esperado[k]}, real ${real} (motivo ${r.motivo})`);
    }
  });
}

test('mientras infinito se corta por el límite de pasos', () => {
  const r = I.ejecutar(niv(['...']), [mientras(c('objeto-aqui', true), { t: 'esperar' })]);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'limite-pasos');
  assert.ok(r.pasos > 500 && r.traza.length < 1500, `pasos ${r.pasos}, traza ${r.traza.length}`);
});

test('el límite de pasos se puede ajustar', () => {
  const r = I.ejecutar(niv(['...']), [mientras(c('objeto-aqui', true), { t: 'esperar' })], { maxPasos: 20 });
  assert.equal(r.motivo, 'limite-pasos');
  assert.ok(r.traza.length < 60);
});

test('un bucle de repetir vacío anidado no cuelga el navegador', () => {
  const r = I.ejecutar(niv(['...']), [rep(99, rep(99, rep(99, rep(99, { t: 'esperar' }))))]);
  assert.equal(r.motivo, 'limite-pasos');
});

test('traza: rutas, eventos y posiciones para resaltar tarjetas', () => {
  const r = I.ejecutar(niv(['...G']), [A, rep(2, A)]);
  assert.equal(r.ok, true);
  assert.deepEqual(r.traza.map(p => p.ruta), ['0', '1', '1.c.0', '1', '1.c.0']);
  assert.deepEqual(r.traza.map(p => p.evento), ['mover', 'control', 'mover', 'control', 'mover']);
  assert.deepEqual(r.traza[0].de, { x: 0, y: 0, dir: 'E' });
  assert.deepEqual(r.traza[0].a, { x: 1, y: 0, dir: 'E' });
  assert.equal(r.traza[1].iteracion, 1);
  assert.equal(r.traza[3].iteracion, 2);
});

test('traza: la receta usa rutas de su propia zona', () => {
  const r = I.ejecutar(niv(['..G']), { principal: [{ t: 'receta', nombre: 'A' }], recetas: { A: [A, A] } });
  assert.deepEqual(r.traza.map(p => p.ruta), ['0', 'r.A.0', 'r.A.1']);
});

test('traza: rutas de las ramas de un si', () => {
  const r = I.ejecutar(niv(['..G']), [si(c('obstaculo-delante'), [A], [A]), A]);
  assert.deepEqual(r.traza.map(p => p.ruta), ['0', '0.s.0', '1']);
  assert.equal(r.traza[0].valor, false);
});

test('traza: un choque queda registrado y señala la tarjeta culpable', () => {
  const r = I.ejecutar(niv(['.#']), [A]);
  assert.equal(r.traza.at(-1).evento, 'choque');
  assert.equal(r.nodoError, '0');
});

test('es determinista', () => {
  const p = [rep(3, A), GD, rep(2, A)];
  const n = niv(['....', '...G']);
  assert.deepEqual(I.ejecutar(n, p), I.ejecutar(n, p));
});

test('no modifica ni el nivel ni el programa', () => {
  const congelar = o => { Object.freeze(o); Object.values(o).forEach(v => { if (v && typeof v === 'object') congelar(v); }); return o; };
  const n = congelar({ mapa: ['.o.G'], inicio: { x: 0, y: 0, dir: 'E' } });
  const p = congelar([A, { t: 'recoger' }, rep(2, A)]);
  assert.doesNotThrow(() => I.ejecutar(n, p));
});

test('contar tarjetas: bucle y condición cuentan 1 más su contenido', () => {
  assert.equal(I.contarTarjetas([A, A, A]), 3);
  assert.equal(I.contarTarjetas([rep(5, A)]), 2);
  assert.equal(I.contarTarjetas([rep(2, rep(3, A), GD)]), 4);
  assert.equal(I.contarTarjetas([si(c('objeto-aqui'), [{ t: 'recoger' }], [A])]), 3);
  assert.equal(I.contarTarjetas({ principal: [{ t: 'receta', nombre: 'A' }, { t: 'receta', nombre: 'A' }], recetas: { A: [A, A] } }), 4);
  assert.equal(I.contarTarjetas([]), 0);
  assert.equal(I.contarTarjetas(null), 0);
});

test('contar por tipo y detectar uso de tarjetas', () => {
  const p = [A, rep(2, A, GD)];
  assert.deepEqual(I.contarPorTipo(p), { avanzar: 2, repetir: 1, 'girar-d': 1 });
  assert.equal(I.usaTarjeta(p, 'repetir'), true);
  assert.equal(I.usaTarjeta(p, 'mientras'), false);
});

test('un nivel sin mapa lanza un error claro', () => {
  assert.throws(() => I.ejecutar({ inicio: E }, [A]), TypeError);
});
