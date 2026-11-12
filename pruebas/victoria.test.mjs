import test from 'node:test';
import assert from 'node:assert/strict';
import V from '../src/datos/victoria.js';
import CAT from '../src/datos/catalogo.js';
import ES from '../src/datos/escenas.js';

const nadie = () => false;
const palabras = (t) => t.replace(/[¡!¿?.,]/g, '').split(/\s+/).filter(Boolean).length;

test('el avance cuenta los retos de la zona sin los calentamientos m3-p1…p5', () => {
  assert.equal(V.avance('ciudad', nadie).total, 13);
  assert.ok(!V.retosDeZona('ciudad').some((id) => /m3-p/.test(id)));
  assert.equal(V.avance('bosque', nadie).total, 13);
  assert.equal(V.avance('montanas', nadie).total, 12);
  assert.equal(V.avance('faro', nadie).total, 3);
});
test('textos de avance: plural, singular y llegada', () => {
  const ids = V.retosDeZona('bosque');
  assert.equal(V.avance('bosque', (id) => id === ids[0]).texto, 'Faltan 12 retos para llegar hasta Titila.');
  assert.equal(V.avance('bosque', (id) => id !== ids[3]).texto, 'Falta 1 reto para llegar hasta Titila.');
  const fin = V.avance('bosque', () => true);
  assert.equal(fin.texto, '¡Has encontrado a Titila!'); assert.ok(fin.llegado);
  assert.equal(V.avance('faro', (id) => id !== 'f-03').texto, 'Falta 1 reto para encender el Faro.');
  assert.equal(V.avance('jardin', nadie), null);
});
test('las líneas de avance no superan 14 palabras', () => {
  Object.keys(V.METAS).forEach((z) => {
    [() => true, nadie, (id) => id === V.retosDeZona(z)[0]].forEach((h) => assert.ok(palabras(V.avance(z, h).texto) <= 14, z));
  });
});
test('la celebración es determinista y varía con la posición', () => {
  const a = V.celebracion('m1-05', 3), b = V.celebracion('m1-05', 3);
  assert.deepEqual(a, b);
  const bailes = new Set(CAT.MUNDOS[1].niveles.slice(0, 8).map((n) => V.celebracion(n.id, 3).baile));
  assert.ok(bailes.size >= 3);
  assert.notEqual(V.celebracion('m1-05', 1).baile, V.celebracion('m1-05', 2).baile);
});
test('el último reto de cada zona con chispa vuela al Faro; f-03 enciende el Faro', () => {
  ES.CHISPAS.forEach((c) => { const x = V.celebracion(c.meta, 2); assert.equal(x.especial, 'chispa-al-faro'); assert.equal(x.chispa, c.id); });
  assert.equal(V.celebracion('f-03', 3).especial, 'faro-encendido');
  assert.equal(V.celebracion('m1-05', 3).especial, null);
});
test('Bichito aparece en toda victoria de depuración y solo en ellas', () => {
  CAT.TODOS.forEach((n) => assert.equal(V.celebracion(n.id, 1).bichito, n.tipo === 'depurar', n.id));
});
test('Faro pequeño: una ventana por chispa cuya meta está superada', () => {
  assert.equal(V.faroPequeno(nadie).encendidas, 0);
  assert.equal(V.faroPequeno((id) => id === 'm1-13').encendidas, 1);
  assert.equal(V.faroPequeno(() => true).encendidas, 6);
  assert.ok(V.faroPequeno(() => true).luzFinal);
});
test('diario: perfil vacío solo abre Lumo; páginas se abren desde retos y escenas', () => {
  const p = { niveles: {}, vistos: { escenas: {} } };
  assert.deepEqual(V.paginasDiario(p, false).filter((x) => x.abierta).map((x) => x.id), ['lumo']);
  p.niveles['m1-13'] = { completado: true };
  const ab = V.paginasDiario(p, false).filter((x) => x.abierta).map((x) => x.id);
  assert.ok(['bruma', 'titila'].every((i) => ab.includes(i)));
  p.vistos.escenas['FIN-02'] = true;
  assert.equal(V.paginasDiario(p, false).find((x) => x.id === 'guino').texto, 'Corto, corto, largo. Era la abuela.');
});
test('diario: toda página con escena apunta a una escena real y los textos son cortos', () => {
  V.PAGINAS.forEach((p) => { if (p.escena) assert.ok(ES.POR_ID[p.escena], p.id); assert.ok(palabras(p.texto) <= 14, p.id); });
});
test('diario Infantil: sin texto, sin chispas ni abuela', () => {
  const p = { niveles: {}, vistos: { escenas: {} } };
  const pag = V.paginasDiario(p, true);
  assert.ok(pag.length >= 2 && pag.every((x) => x.texto === ''));
  assert.ok(!pag.some((x) => /abuela|titila|bichito|brasa/.test(x.id)));
});
