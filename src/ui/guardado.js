/*
 * RUMBO — Guardado local (localStorage con respaldo en memoria).
 * Nada sale del equipo. Se puede exportar/importar una copia JSON completa
 * (útil para llevar a una clase los perfiles de otra).
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var CLAVE = 'rumbo.v1';
  var memoria = null, almacen = null;

  try { almacen = root.localStorage; var t = '__rumbo'; almacen.setItem(t, '1'); almacen.removeItem(t); } catch (e) { almacen = null; }

  function porDefecto() {
    return { version: 1, perfiles: [], activo: null, retos: [],
      ajustes: { sonido: true, musica: true, voz: true, reducir: false, fuente: 1, contraste: false, velocidad: 1 } };
  }
  function cargar() {
    if (memoria) return memoria;
    var d = null;
    try { if (almacen) d = JSON.parse(almacen.getItem(CLAVE) || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object' || !Array.isArray(d.perfiles)) d = porDefecto();
    var def = porDefecto();
    d.ajustes = Object.assign(def.ajustes, d.ajustes || {});
    d.retos = Array.isArray(d.retos) ? d.retos : [];
    memoria = d;
    return d;
  }
  function guardar() {
    if (!memoria) return true;
    try { if (almacen) almacen.setItem(CLAVE, JSON.stringify(memoria)); return !!almacen; } catch (e) { return false; }
  }
  function persistente() { return !!almacen; }
  function exportar() { return JSON.stringify(cargar(), null, 1); }
  function importar(texto) {
    var d = JSON.parse(texto);
    if (!d || !Array.isArray(d.perfiles)) throw new Error('Archivo no válido');
    d.perfiles = d.perfiles.filter(function (p) { return p && typeof p.id === 'string' && p.niveles && typeof p.niveles === 'object'; });
    var def = porDefecto();
    d.ajustes = Object.assign(def.ajustes, d.ajustes || {});
    d.retos = Array.isArray(d.retos) ? d.retos : [];
    memoria = Object.assign(def, d);
    guardar();
    return memoria;
  }
  function reiniciarTodo() { memoria = porDefecto(); guardar(); return memoria; }

  UI.Guardado = { cargar: cargar, guardar: guardar, persistente: persistente, exportar: exportar, importar: importar, reiniciarTodo: reiniciarTodo };
})(typeof self !== 'undefined' ? self : this);
