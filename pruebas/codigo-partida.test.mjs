import test from 'node:test';
import assert from 'node:assert/strict';
import C from '../src/progreso/codigo-partida.js';

// Generador pseudoaleatorio con semilla, para que las pruebas sean reproducibles.
function crearRng(semilla) {
  let s = semilla >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ent = (rng, max) => Math.floor(rng() * (max + 1));

function estadoCortoAleatorio(rng) {
  return {
    nivel: ent(rng, 127),
    estrellasMundo: [ent(rng, 127), ent(rng, 127), ent(rng, 127), ent(rng, 31)],
    secretos: [rng() < 0.5, rng() < 0.5, rng() < 0.5, rng() < 0.5],
    disfraz: ent(rng, 31)
  };
}

test('corto: ida y vuelta con 3000 estados aleatorios', () => {
  const rng = crearRng(1);
  for (let i = 0; i < 3000; i++) {
    const e = estadoCortoAleatorio(rng);
    const codigo = C.codificarCorto(e);
    assert.match(codigo, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{3}$/);
    const r = C.decodificarCorto(codigo);
    assert.equal(r.ok, true, codigo);
    assert.deepEqual(r.estado, e);
  }
});

test('corto: valores extremos y estado vacío', () => {
  const max = { nivel: 127, estrellasMundo: [127, 127, 127, 31], secretos: [true, true, true, true], disfraz: 31 };
  assert.deepEqual(C.decodificarCorto(C.codificarCorto(max)).estado, max);
  const vacio = C.decodificarCorto(C.codificarCorto({}));
  assert.equal(vacio.ok, true);
  assert.equal(vacio.estado.nivel, 0);
  assert.deepEqual(vacio.estado.estrellasMundo, [0, 0, 0, 0]);
});

test('corto: dos niveles consecutivos no producen códigos parecidos', () => {
  const a = C.codificarCorto({ nivel: 10 }).replace(/-/g, '');
  const b = C.codificarCorto({ nivel: 11 }).replace(/-/g, '');
  let iguales = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) iguales++;
  assert.ok(iguales <= 4, 'demasiados símbolos iguales: ' + iguales);
});

test('corto: normaliza minúsculas, espacios, guiones y confusiones O/0 I/L/1', () => {
  const rng = crearRng(2);
  for (let i = 0; i < 300; i++) {
    const e = estadoCortoAleatorio(rng);
    const codigo = C.codificarCorto(e);
    const sucio = ' ' + codigo.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, i % 2 ? 'l' : 'i') + ' ';
    const r = C.decodificarCorto(sucio);
    assert.equal(r.ok, true, sucio);
    assert.deepEqual(r.estado, e);
  }
});

test('corto: rechaza longitud, caracteres no válidos y texto vacío', () => {
  assert.deepEqual(C.decodificarCorto(''), { ok: false, motivo: 'longitud' });
  assert.deepEqual(C.decodificarCorto(null), { ok: false, motivo: 'longitud' });
  assert.deepEqual(C.decodificarCorto('ABCD-EFGH'), { ok: false, motivo: 'longitud' });
  assert.equal(C.decodificarCorto('ABCD-EFGH-IJU').motivo, 'caracter'); // la U no existe en el alfabeto
  assert.equal(C.decodificarCorto('ABCD-EFGH-JKMN').motivo, 'longitud');
});

test('corto: detecta el 99,9 % de los errores de un solo símbolo', () => {
  const rng = crearRng(3);
  let pruebas = 0, aceptados = 0;
  for (let i = 0; i < 1500; i++) {
    const codigo = C.codificarCorto(estadoCortoAleatorio(rng)).replace(/-/g, '');
    for (let pos = 0; pos < codigo.length; pos++) {
      for (const s of C.ALFABETO) {
        if (s === codigo[pos]) continue;
        const roto = codigo.slice(0, pos) + s + codigo.slice(pos + 1);
        pruebas++;
        if (C.decodificarCorto(roto).ok) aceptados++;
      }
    }
  }
  const tasa = 1 - aceptados / pruebas;
  assert.ok(tasa >= 0.999, `tasa de detección ${tasa} (${aceptados} aceptados de ${pruebas})`);
});

test('corto: detecta intercambio de dos símbolos contiguos distintos', () => {
  const rng = crearRng(4);
  let pruebas = 0, aceptados = 0;
  for (let i = 0; i < 1500; i++) {
    const codigo = C.codificarCorto(estadoCortoAleatorio(rng)).replace(/-/g, '');
    for (let pos = 0; pos < codigo.length - 1; pos++) {
      if (codigo[pos] === codigo[pos + 1]) continue;
      const roto = codigo.slice(0, pos) + codigo[pos + 1] + codigo[pos] + codigo.slice(pos + 2);
      pruebas++;
      if (C.decodificarCorto(roto).ok) aceptados++;
    }
  }
  assert.ok(1 - aceptados / pruebas >= 0.995, `aceptados ${aceptados} de ${pruebas}`);
});

test('corto: valores fuera de rango lanzan RangeError', () => {
  assert.throws(() => C.codificarCorto({ nivel: 128 }), RangeError);
  assert.throws(() => C.codificarCorto({ nivel: -1 }), RangeError);
  assert.throws(() => C.codificarCorto({ nivel: 1.5 }), RangeError);
  assert.throws(() => C.codificarCorto({ estrellasMundo: [0, 0, 0, 32] }), RangeError);
  assert.throws(() => C.codificarCorto({ estrellasMundo: [128, 0, 0, 0] }), RangeError);
  assert.throws(() => C.codificarCorto({ disfraz: 32 }), RangeError);
});

test('pictos: ida y vuelta de las 256 combinaciones', () => {
  const vistos = new Set();
  for (let n = 0; n <= 15; n++) {
    for (let d = 0; d <= 15; d++) {
      const dibujos = C.codificarPictos({ nivelInfantil: n, disfraz: d });
      assert.equal(dibujos.length, 6);
      assert.ok(dibujos.every(x => Number.isInteger(x) && x >= 0 && x <= 11));
      const r = C.decodificarPictos(dibujos);
      assert.equal(r.ok, true);
      assert.deepEqual(r.estado, { nivelInfantil: n, disfraz: d });
      vistos.add(dibujos.join(','));
    }
  }
  assert.equal(vistos.size, 256, 'no debe haber dos estados con los mismos dibujos');
});

test('pictos: detecta al menos el 99 % de los cambios de un dibujo', () => {
  let pruebas = 0, aceptados = 0;
  for (let n = 0; n <= 15; n++) {
    for (let d = 0; d <= 15; d++) {
      const base = C.codificarPictos({ nivelInfantil: n, disfraz: d });
      for (let pos = 0; pos < 6; pos++) {
        for (let nuevo = 0; nuevo < 12; nuevo++) {
          if (nuevo === base[pos]) continue;
          const roto = base.slice();
          roto[pos] = nuevo;
          pruebas++;
          if (C.decodificarPictos(roto).ok) aceptados++;
        }
      }
    }
  }
  assert.ok(1 - aceptados / pruebas >= 0.99, `aceptados ${aceptados} de ${pruebas}`);
});

test('pictos: entradas no válidas', () => {
  assert.equal(C.decodificarPictos([1, 2, 3]).motivo, 'longitud');
  assert.equal(C.decodificarPictos('abc').motivo, 'longitud');
  assert.equal(C.decodificarPictos([1, 2, 3, 4, 5, 12]).motivo, 'caracter');
  assert.equal(C.decodificarPictos([11, 11, 11, 11, 11, 11]).motivo, 'formato');
  assert.throws(() => C.codificarPictos({ nivelInfantil: 16 }), RangeError);
  assert.throws(() => C.codificarPictos({ disfraz: 16 }), RangeError);
});

test('largo: ida y vuelta con estrellas de 90 niveles', () => {
  const rng = crearRng(5);
  for (let i = 0; i < 200; i++) {
    const n = ent(rng, 120);
    const estrellas = Array.from({ length: n }, () => ent(rng, 3));
    const e = { estrellas, disfraz: ent(rng, 31), secretos: [rng() < 0.5, rng() < 0.5, rng() < 0.5, rng() < 0.5] };
    const r = C.decodificarLargo(C.codificarLargo(e));
    assert.equal(r.ok, true);
    assert.deepEqual(r.estado, e);
  }
});

test('largo: longitud razonable y casos límite', () => {
  const noventa = C.codificarLargo({ estrellas: new Array(90).fill(3) }).replace(/-/g, '');
  assert.ok(noventa.length <= 45, 'longitud ' + noventa.length);
  const vacio = C.decodificarLargo(C.codificarLargo({}));
  assert.equal(vacio.ok, true);
  assert.deepEqual(vacio.estado.estrellas, []);
  const max = C.decodificarLargo(C.codificarLargo({ estrellas: new Array(255).fill(2) }));
  assert.equal(max.estado.estrellas.length, 255);
  assert.throws(() => C.codificarLargo({ estrellas: new Array(256).fill(1) }), RangeError);
  assert.throws(() => C.codificarLargo({ estrellas: [4] }), RangeError);
});

test('largo: detecta errores de tecleo y texto cortado', () => {
  const rng = crearRng(6);
  const estrellas = Array.from({ length: 90 }, () => ent(rng, 3));
  const codigo = C.codificarLargo({ estrellas, disfraz: 7 }).replace(/-/g, '');
  let pruebas = 0, aceptados = 0;
  for (let pos = 0; pos < codigo.length; pos++) {
    for (const s of C.ALFABETO) {
      if (s === codigo[pos]) continue;
      pruebas++;
      if (C.decodificarLargo(codigo.slice(0, pos) + s + codigo.slice(pos + 1)).ok) aceptados++;
    }
  }
  assert.ok(1 - aceptados / pruebas >= 0.999, `aceptados ${aceptados} de ${pruebas}`);
  assert.equal(C.decodificarLargo(codigo.slice(0, 20)).ok, false);
  assert.equal(C.decodificarLargo('').ok, false);
  assert.equal(C.decodificarLargo('ñ').motivo, 'caracter');
});

test('los tres formatos no se confunden entre sí', () => {
  const corto = C.codificarCorto({ nivel: 5 });
  assert.equal(C.decodificarLargo(corto).ok, false);
});
