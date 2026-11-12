import test from 'node:test';
import assert from 'node:assert/strict';
import P from '../src/progreso/progreso.js';
import C from '../src/datos/catalogo.js';
import I from '../src/engine/interprete.js';
import E from '../src/engine/estrellas.js';

function ganar(perfil, id, est) {
  P.registrar(perfil, id, { ok: true, estrellas: est == null ? 3 : est, tarjetas: 3, motivo: 'meta' }, I);
}

test('perfil nuevo de 1.º: solo está abierto el primer nivel del Mundo 1', () => {
  const p = P.crearPerfil({ nombre: 'Ana', curso: 'p1' });
  assert.equal(P.estaDesbloqueado(p, 'm1-01'), true);
  assert.equal(P.estaDesbloqueado(p, 'm1-02'), false);
  assert.equal(P.estaDesbloqueado(p, 'm2-01'), false);
  assert.equal(P.estaDesbloqueado(p, 'm3-01'), false);
  assert.equal(P.estaDesbloqueado(p, 'f-01'), false);
  assert.equal(P.estaDesbloqueado(p, 'sec-1'), false);
});

test('los niveles se abren de uno en uno', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  ganar(p, 'm1-01');
  assert.equal(P.estaDesbloqueado(p, 'm1-02'), true);
  assert.equal(P.estaDesbloqueado(p, 'm1-03'), false);
});

test('el curso abre los mundos que le corresponden', () => {
  assert.equal(P.estaDesbloqueado(P.crearPerfil({ curso: 'p3' }), 'm2-01'), true);
  assert.equal(P.estaDesbloqueado(P.crearPerfil({ curso: 'p3' }), 'm3-01'), false);
  assert.equal(P.estaDesbloqueado(P.crearPerfil({ curso: 'p5' }), 'm3-p1'), true);
  assert.equal(P.estaDesbloqueado(P.crearPerfil({ curso: 'p5' }), 'm3-p2'), false);
  assert.equal(P.estaDesbloqueado(P.crearPerfil({ curso: 'p5' }), 'm3-01'), true, 'el calentamiento no bloquea');
  assert.equal(P.estaDesbloqueado(P.crearPerfil({ curso: 'p5' }), 'f-01'), false);
});

test('Infantil: los itinerarios dependen de la edad y dentro de cada uno se avanza en orden', () => {
  const a = P.crearPerfil({ curso: 'inf3' });
  assert.equal(P.estaDesbloqueado(a, 'i3-01'), true);
  assert.equal(P.estaDesbloqueado(a, 'i3-02'), false);
  assert.equal(P.estaDesbloqueado(a, 'i4-01'), false);
  const b = P.crearPerfil({ curso: 'inf5' });
  assert.equal(P.estaDesbloqueado(b, 'i4-01'), true);
  assert.equal(P.estaDesbloqueado(b, 'i5-01'), true);
  assert.equal(P.estaDesbloqueado(b, 'i5-02'), false);
});

test('terminar un mundo abre el siguiente aunque el curso no lo incluya', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  C.MUNDOS[1].niveles.forEach(n => ganar(p, n.id, 2));
  assert.equal(P.estaDesbloqueado(p, 'm2-01'), true);
  assert.equal(P.estaDesbloqueado(p, 'm3-01'), false);
});

test('el docente puede abrirlo todo o desbloquear un nivel concreto', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  assert.equal(P.estaDesbloqueado(p, 'm3-10', { todo: true }), true);
  p.desbloqueo.niveles['m3-10'] = true;
  assert.equal(P.estaDesbloqueado(p, 'm3-10'), true);
});

test('el secreto se abre con las estrellas de su mundo', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  C.MUNDOS[1].niveles.slice(0, 17).forEach(n => ganar(p, n.id, 3)); // 51 estrellas
  assert.equal(P.estrellasMundo(p, 1), 51);
  assert.equal(P.estaDesbloqueado(p, 'sec-1'), true);
  assert.equal(P.estaDesbloqueado(p, 'sec-2'), false);
});

test('registrar guarda intentos, errores por tipo y la mejor puntuación', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  P.registrar(p, 'm1-01', { ok: false, motivo: 'choque' }, I);
  P.registrar(p, 'm1-01', { ok: false, motivo: 'choque' }, I);
  P.registrar(p, 'm1-01', { ok: false, motivo: 'caida' }, I);
  const r = P.registrar(p, 'm1-01', { ok: true, estrellas: 1, tarjetas: 5, programa: [{ t: 'repetir', n: 2, cuerpo: [{ t: 'avanzar' }] }] }, I);
  const d = p.niveles['m1-01'];
  assert.equal(d.intentos, 4); assert.equal(d.fallos, 3);
  assert.deepEqual(d.razones, { choque: 2, caida: 1 });
  assert.equal(d.tras, 4);
  assert.equal(r.primeraVez, true);
  assert.equal(d.estrategias.repetir, true);
  const r2 = P.registrar(p, 'm1-01', { ok: true, estrellas: 3, tarjetas: 3 }, I);
  assert.equal(r2.primeraVez, false); assert.equal(r2.mejoro, true);
  assert.equal(d.est, 3); assert.equal(d.mejor, 3);
  // empeorar no baja las estrellas
  P.registrar(p, 'm1-01', { ok: true, estrellas: 1, tarjetas: 9 }, I);
  assert.equal(d.est, 3);
});

test('las insignias se conceden una sola vez', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  ganar(p, 'm1-01');
  assert.deepEqual(P.evaluarLogros(p), ['primer-paso']);
  assert.deepEqual(P.evaluarLogros(p), []);
  ['m1-04', 'm1-05', 'm1-06', 'm1-07', 'm1-08'].forEach(id => ganar(p, id));
  assert.ok(P.evaluarLogros(p).includes('giros'));
});

test('perseverante: superar un reto tras varios intentos', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  for (let i = 0; i < 4; i++) P.registrar(p, 'm1-01', { ok: false, motivo: 'choque' }, I);
  P.registrar(p, 'm1-01', { ok: true, estrellas: 1, tarjetas: 3 }, I);
  assert.ok(P.evaluarLogros(p).includes('perseverante'));
});

test('los disfraces se desbloquean por logros', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  assert.deepEqual(P.disfracesDesbloqueados(p), [0]);
  ['m1-01', 'm1-02', 'm1-03'].forEach(id => ganar(p, id));
  assert.deepEqual(P.disfracesDesbloqueados(p), [0, 1]);
});

test('el resumen docente cuenta errores y estrellas', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  P.registrar(p, 'm1-01', { ok: false, motivo: 'choque' }, I);
  ganar(p, 'm1-01', 2);
  const r = P.resumen(p);
  assert.equal(r.errores.choque, 1); assert.equal(r.intentos, 2); assert.equal(r.estrellas, 2);
  assert.equal(r.mundos[1].completados, 1);
});

test('siguientePendiente guía al primer nivel por hacer', () => {
  const p = P.crearPerfil({ curso: 'p3' });
  assert.equal(P.siguientePendiente(p), 'm1-01');
  ganar(p, 'm1-01');
  assert.equal(P.siguientePendiente(p), 'm1-02');
  const inf = P.crearPerfil({ curso: 'inf3' });
  assert.equal(P.siguientePendiente(inf), 'i3-01');
});

test('código corto: ida y vuelta conserva desbloqueos, totales por mundo, secretos y disfraz', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  C.MUNDOS[1].niveles.forEach((n, i) => ganar(p, n.id, i % 3 + 1));
  C.MUNDOS[2].niveles.slice(0, 7).forEach(n => ganar(p, n.id, 2));
  p.disfraz = 3;
  const { tipo, codigo } = P.aCodigo(p);
  assert.equal(tipo, 'corto');
  const r = P.desdeCodigo(codigo, 'Luis');
  assert.equal(r.ok, true);
  const q = r.perfil;
  assert.equal(P.completadosMundo(q, 1), 25);
  assert.equal(P.completadosMundo(q, 2), 7);
  assert.equal(P.estrellasMundo(q, 1), P.estrellasMundo(p, 1));
  assert.equal(P.estrellasMundo(q, 2), P.estrellasMundo(p, 2));
  assert.equal(q.disfraz, 3);
  assert.equal(P.estaDesbloqueado(q, 'm2-08'), true);
  assert.equal(P.estaDesbloqueado(q, 'm2-09'), false);
  assert.equal(q.nombre, 'Luis');
});

test('código pictográfico (Infantil): ida y vuelta', () => {
  const p = P.crearPerfil({ curso: 'inf5' });
  C.SEC_INFANTIL.slice(0, 9).forEach(id => ganar(p, id, 1));
  const { tipo, codigo } = P.aCodigo(p);
  assert.equal(tipo, 'pictos');
  const r = P.desdeCodigo(codigo, 'Mía');
  assert.equal(r.ok, true);
  assert.equal(C.SEC_INFANTIL.filter(id => P.hecho(r.perfil, id)).length, 9);
});

test('código largo del docente conserva las estrellas de cada nivel', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  ganar(p, 'm1-01', 3); ganar(p, 'm1-02', 1); ganar(p, 'i3-01', 1); ganar(p, 'sec-2', 2);
  const largo = P.aCodigoLargo(p);
  const r = P.desdeCodigo(largo, 'X');
  assert.equal(r.ok, true);
  assert.equal(P.estrellasNivel(r.perfil, 'm1-01'), 3);
  assert.equal(P.estrellasNivel(r.perfil, 'm1-02'), 1);
  assert.equal(P.hecho(r.perfil, 'i3-01'), true);
  assert.equal(P.estrellasNivel(r.perfil, 'sec-2'), 2);
});

test('un código con un símbolo cambiado se rechaza', () => {
  const p = P.crearPerfil({ curso: 'p1' });
  ganar(p, 'm1-01', 3);
  const cod = P.aCodigo(p).codigo.replace(/-/g, '');
  const mal = (cod[0] === 'A' ? 'B' : 'A') + cod.slice(1);
  assert.equal(P.desdeCodigo(mal, 'X').ok, false);
  assert.equal(P.desdeCodigo('hola', 'X').ok, false);
});

test('jugar de verdad con las soluciones de referencia consigue 3 estrellas en cada nivel', () => {
  C.TODOS.forEach(n => {
    const res = I.ejecutar(n, n.referencia);
    assert.equal(res.ok, true, n.id);
    assert.equal(E.calcularEstrellas(n, n.referencia, res), n.etapa === 'infantil' ? 1 : 3, n.id);
  });
});

test('anotarPistas guarda el máximo de pistas pedidas sin contar como intento', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const PR = require('../src/progreso/progreso.js');
  const p = PR.crearPerfil({ nombre: 'A', curso: 'p1' });
  PR.anotarPistas(p, 'm1-01', 2); PR.anotarPistas(p, 'm1-01', 1);
  assert.equal(p.niveles['m1-01'].pistas, 2);
  assert.equal(p.niveles['m1-01'].intentos, 0);
});

test('cada curso tiene su propio final y puede terminar la aventura', async () => {
  const { createRequire } = await import('node:module');
  const C = createRequire(import.meta.url)('../src/datos/catalogo.js');
  const esperado = { inf3: 'i3-', inf4: 'i4-', inf5: 'i5-', p1: 'm1-25', p2: 'm1-25', p3: 'm2-25', p4: 'm2-25', p5: 'f-03', p6: 'f-03' };
  for (const [curso, f] of Object.entries(esperado)) {
    const id = C.finalDe(curso);
    assert.ok(C.POR_ID[id] && id.startsWith(f), curso + ' → ' + id);
    const p = P.crearPerfil({ curso });
    assert.equal(P.finalHecho(p), false);
  }
});

test('aventura de bienvenida: se recomienda a Primaria nuevo, no a Infantil ni a quien ya juega', () => {
  assert.deepEqual(C.BIENVENIDA, C.ITINERARIOS[3]);
  const p = P.crearPerfil({ nombre: 'x', curso: 'p3' });
  assert.equal(P.debeRecomendarBienvenida(p), true);
  assert.equal(P.debeRecomendarBienvenida(P.crearPerfil({ nombre: 'x', curso: 'inf4' })), false);
  p.bienvenida = 'omitida';
  assert.equal(P.debeRecomendarBienvenida(p), false);
  const q = P.crearPerfil({ nombre: 'x', curso: 'p5' });
  ganar(q, 'm1-01');
  assert.equal(P.debeRecomendarBienvenida(q), false, 'quien ya tiene retos superados no recibe la recomendación');
});

test('aventura de bienvenida: el progreso se cuenta y «Continuar» la sigue mientras esté aceptada', () => {
  const p = P.crearPerfil({ nombre: 'x', curso: 'p4' });
  assert.equal(P.bienvenida(p).hechos, 0);
  assert.notEqual(P.siguientePendiente(p), C.BIENVENIDA[0], 'sin aceptar, Continuar sigue la ruta normal de su curso');
  p.bienvenida = 'aceptada';
  assert.equal(P.siguientePendiente(p), C.BIENVENIDA[0]);
  ganar(p, C.BIENVENIDA[0], 1);
  const b = P.bienvenida(p);
  assert.equal(b.hechos, 1); assert.equal(b.siguiente, C.BIENVENIDA[1]); assert.equal(P.siguientePendiente(p), C.BIENVENIDA[1]);
  C.BIENVENIDA.forEach(id => { if (!P.hecho(p, id)) ganar(p, id, 1); });
  assert.equal(P.bienvenida(p).completa, true);
  assert.notEqual(P.siguientePendiente(p), C.BIENVENIDA[0]);
  assert.equal(P.estrellasTotales(p), 0, 'los retos de Infantil no suman estrellas de Primaria');
});
