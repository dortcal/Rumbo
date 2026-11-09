/*
 * RUMBO — Utilidades de interfaz (DOM mínimo, sin dependencias).
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};

  // h('div.clase#id', {atributo: valor, on: {click: fn}}, hijos...)
  function h(sel, props) {
    var m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(sel) || [];
    var el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, function (_, t, n) {
      if (t === '.') el.classList.add(n); else el.id = n;
    });
    var i = 1;
    if (props && typeof props === 'object' && !Array.isArray(props) && !(props.nodeType)) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'on') Object.keys(v).forEach(function (e) { el.addEventListener(e, v[e]); });
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (s) { el.style.setProperty(s, v[s]); });
        else if (k === 'data') Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
        else if (k === 'texto') el.textContent = v;
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      });
      i = 2;
    } else { i = 1; }
    for (; i < arguments.length; i++) anadir(el, arguments[i]);
    return el;
  }
  function anadir(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { anadir(el, x); }); return; }
    if (typeof c === 'string' || typeof c === 'number') el.appendChild(document.createTextNode(String(c)));
    else el.appendChild(c);
  }
  function vaciar(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clon(o) { return JSON.parse(JSON.stringify(o)); }
  function svgEl(html, clase) { var d = document.createElement('span'); d.className = 'svg ' + (clase || ''); d.innerHTML = html; return d; }

  UI.h = h; UI.vaciar = vaciar; UI.esperar = esperar; UI.clamp = clamp; UI.esc = esc; UI.clon = clon; UI.svgEl = svgEl;
})(typeof self !== 'undefined' ? self : this);
