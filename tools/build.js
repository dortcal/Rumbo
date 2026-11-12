#!/usr/bin/env node
/*
 * RUMBO — Empaquetador. Concatena los módulos en UN solo archivo (js/rumbo.js).
 * No usa dependencias: sirve para publicar en GitHub Pages sin pasos extra.
 * Uso: node tools/build.js
 */
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const orden = [
  'src/engine/interprete.js', 'src/engine/estrellas.js', 'src/progreso/codigo-partida.js',
  'src/datos/voces-es.js', 'src/datos/dsl.js', 'src/datos/demos.js', 'src/datos/retos.js',
  'src/datos/niveles-infantil.js', 'src/datos/niveles-m1.js', 'src/datos/niveles-m2.js', 'src/datos/niveles-m3.js', 'src/datos/niveles-final.js',
  'src/datos/logros.js', 'src/datos/catalogo.js', 'src/progreso/progreso.js', 'src/audio/voz.js',
  'src/ui/util.js', 'src/ui/arte.js', 'src/ui/sonido.js', 'src/ui/guardado.js', 'src/ui/escenario.js', 'src/ui/editor.js', 'src/ui/juego.js',
  'src/ui/app.js', 'src/ui/docente.js', 'src/ui/laboratorio.js', 'src/ui/main.js'
].filter(f => fs.existsSync(path.join(raiz, f)));
let out = '/* RUMBO — paquete generado por tools/build.js. No editar a mano: edita los archivos de /src. */\n';
for (const f of orden) {
  out += '\n/* ===== ' + f + ' ===== */\n;' + fs.readFileSync(path.join(raiz, f), 'utf8') + '\n';
}
fs.mkdirSync(path.join(raiz, 'js'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'js/rumbo.js'), out);
console.log('js/rumbo.js:', (out.length / 1024).toFixed(0), 'KB,', orden.length, 'módulos');

// ---- Service worker versionado: la versión cambia con el contenido, así los equipos reciben las actualizaciones ----
const crypto = require('crypto');
const archivos = ['./', 'index.html', 'manifest.webmanifest', 'css/rumbo.css', 'js/rumbo.js',
  'fonts/baloo-2-latin-700-normal.woff2', 'fonts/baloo-2-latin-800-normal.woff2', 'fonts/nunito-latin-600-normal.woff2', 'fonts/nunito-latin-800-normal.woff2',
  'intro/escena-1.jpg', 'intro/escena-2.jpg', 'intro/escena-3.jpg', 'intro/voz-lumo.mp3', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];
const hash = crypto.createHash('sha1');
for (const f of archivos.filter(f => f !== './')) hash.update(fs.readFileSync(path.join(raiz, f)));
const version = hash.digest('hex').slice(0, 10);
const plantilla = fs.readFileSync(path.join(__dirname, 'sw.plantilla.js'), 'utf8');
fs.writeFileSync(path.join(raiz, 'sw.js'), plantilla.replace(/__VERSION__/g, version).replace('__ARCHIVOS__', JSON.stringify(archivos)));
console.log('sw.js: versión', version);
