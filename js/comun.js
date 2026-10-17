/* =====================================================================
   BANCO DE TRABAJO · utilidades comunes
   Medidas en puntos PDF (bp). El origen de coordenadas de pdf-lib está
   abajo a la izquierda; aquí todo se escribe «desde arriba» (como en los
   originales medidos) y se convierte al dibujar.
   ===================================================================== */
(function (global) {
  'use strict';

  const MM = 72 / 25.4;                       /* 1 mm en bp */
  const A4V = [595.28, 841.89];               /* vertical */
  const A4H = [841.89, 595.28];               /* apaisado */

  /* ---------- Azar ---------- */
  /* Generador con semilla (mulberry32) para poder repetir pruebas; sin
     semilla usa crypto, de modo que cada lote sale distinto. */
  function crearAzar(semilla) {
    let a = (semilla === undefined || semilla === null)
      ? (crypto.getRandomValues(new Uint32Array(1))[0] >>> 0)
      : (semilla >>> 0);
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function entero(azar, min, max) { return Math.floor(azar() * (max - min + 1)) + min; }
  function barajar(azar, arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function elegirPeso(azar, claves, pesos) {
    let total = 0; for (const p of pesos) total += p;
    let x = azar() * total;
    for (let i = 0; i < claves.length; i++) { x -= pesos[i]; if (x < 0) return claves[i]; }
    return claves[claves.length - 1];
  }

  /* ---------- Colores ---------- */
  function hex(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return PDFLib.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }

  /* ---------- Códigos de ficha ----------
     Cuatro cifras al azar; nunca se repite dentro de un lote y, si el
     navegador lo permite, tampoco con los últimos códigos usados aquí. */
  const CLAVE_CODIGOS = 'banco-trabajo-codigos';
  function leerUsados() {
    try { return new Set(JSON.parse(localStorage.getItem(CLAVE_CODIGOS) || '[]')); }
    catch (e) { return new Set(); }
  }
  function guardarUsados(set) {
    try {
      const arr = Array.from(set);
      localStorage.setItem(CLAVE_CODIGOS, JSON.stringify(arr.slice(-3000)));
    } catch (e) { /* sin almacenamiento: solo se evita repetir dentro del lote */ }
  }
  function crearCodigos(azar) {
    const usados = leerUsados();
    const lote = new Set();
    return {
      /* clave: código completo que se guarda; formato: función que lo construye a partir de las 4 cifras */
      nuevo(formato) {
        for (let intento = 0; intento < 20000; intento++) {
          const n = String(entero(azar, 0, 9999)).padStart(4, '0');
          const c = formato(n);
          if (lote.has(c)) continue;
          if (intento < 15000 && usados.has(c)) continue;
          lote.add(c);
          return c;
        }
        throw new Error('No quedan códigos libres');
      },
      confirmar() { for (const c of lote) usados.add(c); guardarUsados(usados); }
    };
  }

  /* ---------- Dibujo en una página de pdf-lib ---------- */
  function lienzo(pagina) {
    const H = pagina.getHeight();
    return {
      pagina, H,
      /* texto con la línea base a «y» desde arriba */
      texto(t, x, y, size, font, color, opciones) {
        pagina.drawText(t, Object.assign({ x, y: H - y, size, font, color }, opciones || {}));
      },
      textoDerecha(t, xDer, y, size, font, color) {
        const w = font.widthOfTextAtSize(t, size);
        pagina.drawText(t, { x: xDer - w, y: H - y, size, font, color });
      },
      textoCentro(t, xc, y, size, font, color) {
        const w = font.widthOfTextAtSize(t, size);
        pagina.drawText(t, { x: xc - w / 2, y: H - y, size, font, color });
      },
      linea(x0, y0, x1, y1, grosor, color, opciones) {
        pagina.drawLine(Object.assign({ start: { x: x0, y: H - y0 }, end: { x: x1, y: H - y1 },
          thickness: grosor, color }, opciones || {}));
      },
      /* rectángulo relleno (x, y = esquina superior izquierda) */
      rect(x, y, w, h, color) {
        pagina.drawRectangle({ x, y: H - y - h, width: w, height: h, color, borderWidth: 0 });
      },
      /* trazo SVG con coordenadas «desde arriba» relativas a (x, y) */
      svg(d, x, y, opciones) {
        pagina.drawSvgPath(d, Object.assign({ x, y: H - y }, opciones));
      },
      imagen(img, x, y, w, h) {
        pagina.drawImage(img, { x, y: H - y - h, width: w, height: h });
      }
    };
  }

  /* Rectángulo de esquinas redondeadas como trazo SVG (origen arriba a la izquierda) */
  function rectRedondeado(w, h, r) {
    const k = 0.5523 * r;
    return `M ${r} 0 L ${w - r} 0 C ${w - r + k} 0 ${w} ${r - k} ${w} ${r} L ${w} ${h - r} `
      + `C ${w} ${h - r + k} ${w - r + k} ${h} ${w - r} ${h} L ${r} ${h} C ${r - k} ${h} 0 ${h - r + k} 0 ${h - r} `
      + `L 0 ${r} C 0 ${r - k} ${r - k} 0 ${r} 0 Z`;
  }

  /* ---------- Carga de recursos ---------- */
  const cacheBytes = new Map();
  async function bytes(url) {
    if (!cacheBytes.has(url)) {
      cacheBytes.set(url, fetch(url).then(r => {
        if (!r.ok) throw new Error('No se pudo cargar ' + url);
        return r.arrayBuffer();
      }));
    }
    return cacheBytes.get(url);
  }
  async function json(url) {
    const b = await bytes(url);
    return JSON.parse(new TextDecoder('utf-8').decode(b));
  }

  /* Normaliza para sopas: mayúsculas sin tildes, conservando la Ñ */
  function normalizar(w) {
    return w.toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD')
      .replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ');
  }

  global.Banco = global.Banco || {};
  Object.assign(global.Banco, {
    MM, A4V, A4H, crearAzar, entero, barajar, elegirPeso, hex, crearCodigos, lienzo,
    rectRedondeado, bytes, json, normalizar
  });
})(typeof self !== 'undefined' ? self : this);
