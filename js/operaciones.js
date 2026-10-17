/* =====================================================================
   BANCO DE TRABAJO · hojas de operaciones (sumas, restas y mixta)
   Copia de la «hoja amplia» de Generador_operaciones (versión 1f7fd27,
   octubre de 2026), que reproduce los cuadernillos originales. Aquí se
   dibuja directamente en PDF vectorial en lugar de en HTML.
   Las medidas «y» son la parte alta del texto tal como la mide el PDF
   original; la línea base está 0,78955·s más abajo en Liberation Sans
   Bold y 0,79295·s más abajo en Helvetica (medido en los cuadernillos).
   ===================================================================== */
(function (global) {
  'use strict';
  const B = global.Banco;

  const COLOR = { K: '#1e293b', B: '#2563eb', G: '#059669', R: '#dc2626', L: '#94a3b8' };
  const ANCHO_CIFRA = 0.556;            /* avance de una cifra en Liberation Sans Bold (em) */
  const BASE_LIB = 0.78955, BASE_HELV = 0.79295;

  /* Rejilla: 5 columnas × 5 filas = 25 operaciones */
  const REJILLA = { cols: 5, px: 114.25, py: 159.5 };

  /* Tipos de hoja. La letra va en el código («HOJA 4821-B»). */
  const TIPOS = {
    B: { nombre: 'Sumas', letra: 'B', sol: 'sumas' },
    R: { nombre: 'Restas', letra: 'R', sol: 'restas' },
    M: { nombre: 'Mixta: sumas y restas', letra: 'M', sol: 'mixta' }
  };

  /* Parámetros del solucionario (ver Generador_operaciones) */
  const SOL = {
    sumas:  { s: 17.1, p: 14.77, R: 85.1, y0: 14.4, dy: 26, signo: 12.6, dl: 20.3, dr: 2.8, cs: 9.5, cy: -0.6, ms: 10, my: 4.8 },
    restas: { s: 18.3, p: 17.93, R: 83.2, y0: 15.5, dy: 33, signo: 13.3, dl: 21.4, dr: 2.8, cs: 9.5, cy: -0.6, ms: 10, my: 4.8 },
    mixta:  { s: 16.6, p: 14.8,  R: 85.3, y0: 14.8, dy: 27, signo: 12.8, dl: 19.7, dr: 2.9, cs: 9.5, cy: -0.6, ms: 9,  my: 9.2 }
  };

  /* ---------- Generación ---------- */
  function suma(azar, filas) {
    const n = filas || (azar() < 0.5 ? 2 : 3);
    return { op: '+', nums: Array.from({ length: n }, () => B.entero(azar, 1000, 9999)) };
  }
  function resta(azar) {
    /* Minuendo y sustraendo de 4 cifras, minuendo estrictamente mayor */
    const sustraendo = B.entero(azar, 1000, 9998);
    return { op: '−', nums: [B.entero(azar, sustraendo + 1, 9999), sustraendo] };
  }
  function generar(tipo, azar) {
    const rep = (n, f) => Array.from({ length: n }, f);
    if (tipo === 'B') return rep(25, () => suma(azar));
    if (tipo === 'R') return rep(25, () => resta(azar));
    if (tipo === 'M') return B.barajar(azar, [...rep(15, () => resta(azar)), ...rep(10, () => suma(azar))]);
    throw new Error('Tipo de operación desconocido: ' + tipo);
  }

  /* ---------- Cálculos del solucionario ---------- */
  function llevadasSuma(nums) {
    const nd = Math.max(...nums.map(n => String(n).length));
    const res = {};
    let c = 0;
    for (let i = 0; i < nd; i++) {
      const s = nums.reduce((t, n) => t + Math.floor(n / 10 ** i) % 10, 0) + c;
      c = Math.floor(s / 10);
      if (c && i + 1 < nd) res[i + 1] = c;
    }
    return res;
  }
  function prestamosResta(a, b) {
    const cols = [];
    let c = 0;
    for (let i = 0; i < String(a).length; i++) {
      const da = Math.floor(a / 10 ** i) % 10;
      const db = Math.floor(b / 10 ** i) % 10 + c;
      if (da < db) { cols.push(i); c = 1; } else c = 0;
    }
    return cols;
  }

  /* ---------- Dibujo ---------- */
  function crearDibujo(lz, f) {
    const col = {}; for (const k in COLOR) col[k] = B.hex(COLOR[k]);
    function texto(txt, x, y, s, color, fuente) {
      if (fuente === 'H' || fuente === 'Hn') {
        lz.texto(txt, x, y + BASE_HELV * s, s, fuente === 'H' ? f.helvB : f.helv, col[color]);
      } else {
        lz.texto(txt, x, y + BASE_LIB * s, s, f.lib, col[color]);
      }
    }
    function numero(str, R, p, y, s, color) {
      const t = String(str);
      for (let i = 0; i < t.length; i++) texto(t[t.length - 1 - i], R - i * p, y, s, color);
    }
    function raya(x0, y, x1, w) { lz.rect(x0, y - w / 2, x1 - x0, w, col.K); }
    function centrada(xCifra, s, cs) { return xCifra + (s - cs) * ANCHO_CIFRA / 2; }
    return { texto, numero, raya, centrada, col };
  }

  function enunciadoBasica(D, lx, ly, o) {
    const s = 20.8, p = 17.93, R = lx + 82.5;
    o.nums.forEach((n, f) => D.numero(n, R, p, ly + 13.5 + f * 33, s, 'K'));
    const ultima = ly + 13.5 + (o.nums.length - 1) * 33;
    D.texto(o.op, lx + 12.6, ultima, s, 'B');
    D.raya(lx + 14, ultima + 24, lx + 97.3, 1.5);
  }
  function solucionBasica(D, lx, ly, o, g) {
    const R = lx + g.R;
    const filaY = f => ly + g.y0 + f * g.dy;
    o.nums.forEach((n, f) => D.numero(n, R, g.p, filaY(f), g.s, 'K'));
    const ultima = filaY(o.nums.length - 1);
    D.texto(o.op, lx + g.signo, ultima, g.s, 'B');
    const yRaya = ultima + g.dl;
    D.raya(lx + 14, yRaya, lx + 97.3, 1.5);
    if (o.op === '+') {
      const total = o.nums.reduce((t, n) => t + n, 0);
      D.numero(total, R, g.p, yRaya + g.dr, g.s, 'G');
      const llev = llevadasSuma(o.nums);
      for (const c in llev) D.texto(String(llev[c]), D.centrada(R - c * g.p, g.s, g.cs), ly + g.cy, g.cs, 'R');
    } else {
      const [a, b] = o.nums;
      D.numero(String(a - b).padStart(String(a).length, '0'), R, g.p, yRaya + g.dr, g.s, 'G');
      const anchoCifra = g.s * ANCHO_CIFRA, anchoMarca = g.ms * ANCHO_CIFRA;
      for (const c of prestamosResta(a, b)) {
        D.texto('1', R - c * g.p - 0.4 - anchoMarca, filaY(0) - g.my, g.ms, 'R');
        D.texto('1', R - (c + 1) * g.p + anchoCifra + 0.4, filaY(1) - g.my, g.ms, 'R');
      }
    }
  }

  function aRomano(n) {
    const tabla = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
                   [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let r = '';
    for (const [v, s] of tabla) { while (n >= v) { r += s; n -= v; } }
    return r;
  }

  /* Una página A4: hoja del alumnado o su solucionario */
  function dibujarPagina(doc, f, hoja, codigo, conSolucion) {
    const pagina = doc.addPage(B.A4V);
    const lz = B.lienzo(pagina);
    const D = crearDibujo(lz, f);
    /* Cuadrícula de 10 pt, trazo de 0,5 pt */
    const gris = B.hex('#e8ecf1');
    for (let x = 0; x <= 590; x += 10) lz.linea(x, 0, x, 841.89, 0.5, gris);
    for (let y = 1.89; y <= 841.89 + 0.001; y += 10) lz.linea(0, y, 595.28, y, 0.5, gris);
    const titulo = conSolucion ? 'Solucionario' : 'Resuelve las siguientes operaciones';
    lz.textoCentro(titulo, 595.28 / 2, 12.5 + BASE_HELV * 12, 12, f.helvB, D.col.K);
    lz.textoDerecha('HOJA ' + codigo, 583.3, 15.7 + BASE_LIB * 8, 8, f.lib, D.col.L);
    const g = SOL[TIPOS[hoja.tipo].sol];
    hoja.ops.forEach((o, i) => {
      const lx = 14 + (i % REJILLA.cols) * REJILLA.px;
      const ly = 36.1 + Math.floor(i / REJILLA.cols) * REJILLA.py;
      D.texto(aRomano(i + 1) + '.', lx, ly, 7.5, 'L', 'Hn');
      if (conSolucion) solucionBasica(D, lx, ly, o, g); else enunciadoBasica(D, lx, ly, o);
    });
  }

  B.operaciones = {
    TIPOS,
    generarHoja(tipo, azar) { return { tipo, ops: generar(tipo, azar) }; },
    formatoCodigo(tipo) { return n => n + '-' + TIPOS[tipo].letra; },
    dibujarFicha(doc, f, hoja, codigo) { dibujarPagina(doc, f, hoja, codigo, false); },
    dibujarSolucion(doc, f, hoja, codigo) { dibujarPagina(doc, f, hoja, codigo, true); },
    /* para las pruebas */
    _interno: { llevadasSuma, prestamosResta, aRomano }
  };
})(typeof self !== 'undefined' ? self : this);
