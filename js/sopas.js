/* =====================================================================
   BANCO DE TRABAJO · sopas de letras
   Reglas y maqueta del cuaderno «Sopas de letras: 50 fichas de vocabulario
   cotidiano» (octubre de 2026): mayúsculas sin tildes (la Ñ se mantiene),
   el mismo número de palabras en cada dirección (→ ↓ ↘ ↗), ninguna al revés,
   cada palabra aparece una sola vez mirando en las 8 direcciones y el
   relleno no forma palabras malsonantes. Cada ficha sale con una cuadrícula
   nueva.
   Dos tamaños: normal (15 × 15, 16 palabras, como el cuaderno) y ampliada
   (18 × 18, 24 palabras).
   Temas y palabras salen de una secuencia fija (ver «Secuencia»): 80 temas
   de 40 palabras o más; un tema no vuelve a salir con las mismas palabras
   hasta pasadas 96 000 sopas.
   ===================================================================== */
(function (global) {
  'use strict';
  const B = global.Banco;

  const FORMATOS = {
    normal: { N: 15, porDir: 4, nombre: 'normal' },
    ampliada: { N: 18, porDir: 6, nombre: 'ampliada' }
  };
  const DIRS = { E: [0, 1], S: [1, 0], SE: [1, 1], NE: [-1, 1] };
  const ALL8 = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  const FREQ = { A: 12.5, B: 1.4, C: 4.7, D: 5.9, E: 13.7, F: .7, G: 1, H: .7, I: 6.2, J: .4, K: .05, L: 5,
    M: 3.2, N: 6.7, 'Ñ': .35, O: 8.7, P: 2.5, Q: .9, R: 6.9, S: 8, T: 4.6, U: 3.9, V: .9, W: .05,
    X: .2, Y: .9, Z: .5 };
  const LETRAS = Object.keys(FREQ), PESOS = LETRAS.map(k => FREQ[k]);
  const MALSONANTES = ['PUTA', 'PUTO', 'CACA', 'PEDO', 'CULO', 'MIERDA', 'POLLA', 'COÑO', 'PENE', 'TETA', 'NAZI',
    'MEAR', 'PIS', 'CAGAR', 'JODE', 'FOLLA', 'CABRON', 'MARICON', 'ZORRA', 'TONTO', 'IDIOTA', 'GUARRA', 'PICHA',
    'CHOCHO', 'PAJA', 'MAMON', 'MAMADA', 'CIPOTE', 'VERGA', 'OSTIA', 'CARAJO', 'COJON'];
  const CAPS = ['#457B9D', '#2A9D8F', '#E9A23B', '#6AA84F', '#D1495B', '#8E6BBF', '#E07A3F', '#3AA6C9'];

  /* Orden alfabético del castellano (Ñ después de N, sin tener en cuenta las tildes) */
  function claveOrden(w) {
    return w.toUpperCase().replace(/Ñ/g, 'N\u007f').normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function ordenar(ws) { return ws.slice().sort((a, b) => (claveOrden(a) < claveOrden(b) ? -1 : claveOrden(a) > claveOrden(b) ? 1 : 0)); }

  /* ---------- Generación ---------- */
  function apariciones(g, w) {
    const N = g.length, L = w.length, vistas = new Set(), res = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (g[r][c] !== w[0]) continue;
      for (const [dr, dc] of ALL8) {
        const er = r + dr * (L - 1), ec = c + dc * (L - 1);
        if (er < 0 || er >= N || ec < 0 || ec >= N) continue;
        let ok = true;
        for (let i = 1; i < L && ok; i++) if (g[r + dr * i][c + dc * i] !== w[i]) ok = false;
        if (!ok) continue;
        const a = r * N + c, b = er * N + ec, k = Math.min(a, b) + ',' + Math.max(a, b);
        if (!vistas.has(k)) { vistas.add(k); res.push({ r, c, dr, dc, k }); }
      }
    }
    return res;
  }

  function colocar(palabras, azar, N) {
    const g = Array.from({ length: N }, () => new Array(N).fill(null));
    const orden = palabras.slice().sort((a, b) => b.length - a.length);
    const plan = B.barajar(azar, palabras.map((_, i) => ['E', 'S', 'SE', 'NE'][i % 4]));
    const colocadas = {};
    for (let k = 0; k < orden.length; k++) {
      const w = orden[k], L = w.length, d0 = plan[k];
      let hecho = false;
      const otras = B.barajar(azar, Object.keys(DIRS).filter(d => d !== d0));
      for (const d of [d0, ...otras]) {
        const [dr, dc] = DIRS[d], opciones = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const er = r + dr * (L - 1), ec = c + dc * (L - 1);
          if (er < 0 || er >= N || ec < 0 || ec >= N) continue;
          let ov = 0, bien = true;
          for (let i = 0; i < L; i++) {
            const ch = g[r + dr * i][c + dc * i];
            if (ch === null) continue;
            if (ch !== w[i]) { bien = false; break; }
            ov++;
          }
          if (bien && ov < L) opciones.push([r, c, ov]);
        }
        if (!opciones.length) continue;
        const conCruce = opciones.filter(o => o[2] > 0);
        const pool = (conCruce.length && azar() < 0.4) ? conCruce : opciones;
        const [r, c] = pool[Math.floor(azar() * pool.length)];
        for (let i = 0; i < L; i++) g[r + dr * i][c + dc * i] = w[i];
        colocadas[w] = { r1: r, c1: c, r2: r + dr * (L - 1), c2: c + dc * (L - 1), dir: d };
        hecho = true; break;
      }
      if (!hecho) return null;
    }
    return { g, colocadas };
  }

  function celdas(o, L) { return Array.from({ length: L }, (_, i) => [o.r + o.dr * i, o.c + o.dc * i]); }

  /* tema: { t: título, p: palabras ya elegidas (con tildes) }; formato: 'normal' o 'ampliada'.
     Devuelve { titulo, palabras, formato, grid (N cadenas), colocadas } */
  function generar(tema, azar, formato) {
    const F = FORMATOS[formato || 'normal'], N = F.N;
    if (tema.p.length !== 4 * F.porDir) throw new Error('La sopa «' + tema.t + '» necesita ' + 4 * F.porDir + ' palabras');
    const palabras = tema.p.map(B.normalizar);
    const malas = MALSONANTES.filter(b => !palabras.some(w => w.includes(b) || w.split('').reverse().join('').includes(b)));
    for (let intento = 0; intento < 6000; intento++) {
      const res = colocar(palabras, azar, N);
      if (!res) continue;
      const { g: g0, colocadas } = res;
      const cuenta = { E: 0, S: 0, SE: 0, NE: 0 };
      for (const w in colocadas) cuenta[colocadas[w].dir]++;
      /* las mismas en cada dirección; si no se logra, una menos como mucho */
      const minimo = intento < 4000 ? F.porDir : F.porDir - 1;
      if (Math.min(cuenta.E, cuenta.S, cuenta.SE, cuenta.NE) < minimo) continue;
      const g = g0.map(fila => fila.map(ch => ch === null ? B.elegirPeso(azar, LETRAS, PESOS) : ch));
      for (let vuelta = 0; vuelta < 300; vuelta++) {
        const malasCeldas = new Map(); let muerta = false;
        const revisar = (lista, propia) => {
          for (const o of lista) {
            if (propia && o.k === propia) continue;
            const libres = celdas(o, o.L).filter(([r, c]) => g0[r][c] === null);
            if (!libres.length) { muerta = true; return; }
            for (const [r, c] of libres) malasCeldas.set(r * N + c, [r, c]);
          }
        };
        for (const w of palabras) {
          const p = colocadas[w];
          const a = p.r1 * N + p.c1, b = p.r2 * N + p.c2;
          revisar(apariciones(g, w).map(o => Object.assign(o, { L: w.length })), Math.min(a, b) + ',' + Math.max(a, b));
          if (muerta) break;
        }
        if (!muerta) for (const m of malas) {
          revisar(apariciones(g, m).map(o => Object.assign(o, { L: m.length })), null);
          if (muerta) break;
        }
        if (muerta) break;
        if (!malasCeldas.size) {
          return { titulo: tema.t, palabras: tema.p.slice(), formato: F.nombre, grid: g.map(f => f.join('')), colocadas };
        }
        for (const [r, c] of malasCeldas.values()) g[r][c] = B.elegirPeso(azar, LETRAS, PESOS);
      }
    }
    throw new Error('No se pudo generar la sopa «' + tema.t + '»');
  }

  /* Comprobación independiente (la usan las pruebas y el generador antes de dibujar) */
  function comprobar(s) {
    const errores = [];
    const ALFA = new Set('ABCDEFGHIJKLMNÑOPQRSTUVWXYZ');
    const F = FORMATOS[s.formato || 'normal'], N = F.N;
    if (s.palabras.length !== 4 * F.porDir) errores.push('número de palabras');
    if (s.grid.length !== N || s.grid.some(f => [...f].length !== N)) errores.push('tamaño');
    const g = s.grid.map(f => [...f]);
    if (g.some(f => f.some(ch => !ALFA.has(ch)))) errores.push('letra no válida');
    const cuenta = { E: 0, S: 0, SE: 0, NE: 0 };
    for (const w0 of s.palabras) {
      const w = B.normalizar(w0);
      const ap = apariciones(g, w);
      if (ap.length !== 1) { errores.push(w + ': ' + ap.length + ' apariciones'); continue; }
      const o = ap[0];
      let d = Object.keys(DIRS).find(k => DIRS[k][0] === o.dr && DIRS[k][1] === o.dc);
      if (!d) { /* se encontró desde el otro extremo */
        d = Object.keys(DIRS).find(k => DIRS[k][0] === -o.dr && DIRS[k][1] === -o.dc);
        const r = o.r + o.dr * (w.length - 1), c = o.c + o.dc * (w.length - 1);
        if (!d || g[r][c] !== w[0]) { errores.push(w + ': solo se lee al revés'); continue; }
      }
      cuenta[d]++;
    }
    for (const m of MALSONANTES) {
      const dentro = s.palabras.some(w0 => { const w = B.normalizar(w0); return w.includes(m) || [...w].reverse().join('').includes(m); });
      if (!dentro && apariciones(g, m).length) errores.push('malsonante ' + m);
    }
    return { errores, cuenta };
  }

  /* ---------- Dibujo ---------- */
  const NAVY = '#1D3557', TURQ = '#2A9D8F', TINTA = '#1B2332', GRIS_REJ = '#C6C6C6';

  function dibujarRejilla(lz, f, s, x0, y0, celda, cuerpo, solucion) {
    const N = s.grid.length, lado = N * celda;
    lz.rect(x0, y0, lado, lado, B.hex('#FFFFFF'));
    const enSol = new Set();
    if (solucion) {
      ordenar(s.palabras).forEach((w0, i) => {
        const w = B.normalizar(w0), q = s.colocadas[w];
        lz.linea(x0 + (q.c1 + 0.5) * celda, y0 + (q.r1 + 0.5) * celda, x0 + (q.c2 + 0.5) * celda, y0 + (q.r2 + 0.5) * celda,
          celda * 0.74, B.hex(CAPS[i % CAPS.length]), { lineCap: PDFLib.LineCapStyle.Round, opacity: 0.42 });
        const dr = Math.sign(q.r2 - q.r1), dc = Math.sign(q.c2 - q.c1);
        for (let k = 0; k < w.length; k++) enSol.add((q.r1 + dr * k) * N + (q.c1 + dc * k));
      });
    }
    const gris = B.hex(GRIS_REJ);
    for (let i = 1; i < N; i++) {
      lz.linea(x0 + i * celda, y0, x0 + i * celda, y0 + lado, 0.3985, gris);
      lz.linea(x0, y0 + i * celda, x0 + lado, y0 + i * celda, 0.3985, gris);
    }
    lz.svg(B.rectRedondeado(lado, lado, 1.2 * B.MM), x0, y0,
      { borderColor: B.hex(NAVY), borderWidth: solucion ? 0.797 : 1.0959 });
    const tinta = B.hex(TINTA), apagada = B.hex('#B9B9B9');
    for (let r = 0; r < N; r++) {
      const fila = [...s.grid[r]];
      for (let c = 0; c < N; c++) {
        const color = (!solucion || enSol.has(r * N + c)) ? tinta : apagada;
        /* línea base 3,945 bp por debajo del centro de la casilla con letra de 9,96 o 17,43 pt
           (medido en el cuaderno); en proporción al cuerpo para otros tamaños */
        lz.textoCentro(fila[c], x0 + (c + 0.5) * celda, y0 + (r + 0.5) * celda + 3.945 * Math.min(1, cuerpo / 9.96), cuerpo, f.helvB, color);
      }
    }
  }

  /* Flechas del enunciado (en el original son glifos de CMSY10 a 11,96 bp) */
  function flecha(lz, x, yBase, tipo, color) {
    const s = 11.96, ej = yBase - 0.25 * s;         /* eje matemático */
    const g = 0.4;
    const punta = (px, py, ang) => {
      const l = 3.1, a = 0.55;
      const p1 = [px - l * Math.cos(ang - a), py - l * Math.sin(ang - a)];
      const p2 = [px - l * Math.cos(ang + a), py - l * Math.sin(ang + a)];
      lz.linea(px, py, p1[0], p1[1], g, color, { lineCap: PDFLib.LineCapStyle.Round });
      lz.linea(px, py, p2[0], p2[1], g, color, { lineCap: PDFLib.LineCapStyle.Round });
    };
    if (tipo === 'E') { const x0 = x + 0.9, x1 = x + s - 0.9; lz.linea(x0, ej, x1, ej, g, color); punta(x1, ej, 0); }
    if (tipo === 'S') { const xc = x + 2.99, y0 = yBase - 8.6, y1 = yBase + 2.4; lz.linea(xc, y0, xc, y1, g, color); punta(xc, y1, Math.PI / 2); }
    if (tipo === 'SE' || tipo === 'NE') {
      const x0 = x + 1.2, x1 = x + s - 1.2;
      const ya = tipo === 'SE' ? yBase - 8.2 : yBase + 1.9, yb = tipo === 'SE' ? yBase + 1.9 : yBase - 8.2;
      lz.linea(x0, ya, x1, yb, g, color);
      punta(x1, yb, Math.atan2(yb - ya, x1 - x0));
    }
  }

  function dibujarFicha(doc, f, s, codigo) {
    const pagina = doc.addPage(B.A4V);
    const lz = B.lienzo(pagina);
    const tinta = B.hex(TINTA), navy = B.hex(NAVY), turq = B.hex(TURQ), gris6 = B.hex('#666666');
    /* Cabecera */
    lz.texto('SOPA DE LETRAS', 42.52, 53.48, 9.96, f.helvB, turq);
    lz.texto('·', 133.42, 53.48, 9.96, f.helvB, turq);
    lz.texto(codigo, 140.61, 53.48, 9.96, f.helvB, turq);
    lz.texto('Nombre', 206.18, 53.48, 10.91, f.helv, gris6);
    lz.linea(250.64, 53.28, 426.39, 53.28, 0.398, tinta);
    lz.texto('Fecha', 443.4, 53.48, 10.91, f.helv, gris6);
    lz.linea(479.05, 53.28, 552.76, 53.28, 0.398, tinta);
    /* Título y enunciado */
    lz.texto(s.titulo, 42.52, 95.62, 25.9, f.helvB, navy);
    const t = 12.95, amp = s.formato === 'ampliada';
    lz.texto('Busca y rodea estas ' + s.palabras.length + ' palabras.', 42.52, 119.09, t, f.helv, tinta);
    lz.texto('Pueden estar en horizontal', 238.86, 119.09, t, f.helv, tinta);
    flecha(lz, 397.24, 119.09, 'E', tinta);
    lz.texto(', en vertical', 409.2, 119.09, t, f.helv, tinta);
    flecha(lz, 479.21, 119.09, 'S', tinta);
    lz.texto('o en', 488.79, 119.09, t, f.helv, tinta);
    lz.texto('diagonal', 42.52, 132.64, t, f.helv, tinta);
    flecha(lz, 95.08, 132.64, 'SE', tinta);
    flecha(lz, 110.62, 132.64, 'NE', tinta);
    lz.texto('.', 122.59, 132.64, t, f.helv, tinta);
    lz.texto('En la sopa, las palabras van sin tilde.', 130.64, 132.64, t, f.helv, tinta);
    /* Cuadrícula: normal, 15 casillas de 10 mm con letras de 17,5 pt;
       ampliada, 18 casillas de 8,5 mm con letras de 14,8 pt, más arriba para que quepa la lista */
    const celda = (amp ? 8.5 : 10) * B.MM, lado = s.grid.length * celda;
    const yRej = amp ? 152 : 200.24;
    dibujarRejilla(lz, f, s, (595.28 - lado) / 2, yRej, celda, amp ? 14.8 : 17.43, false);
    /* Lista de palabras en cuatro columnas (4 filas en la normal, 6 en la ampliada):
       cuerpo de 13,5 pt o menos si no caben */
    const ws = ordenar(s.palabras), nf = ws.length / 4;
    /* orden alfabético por filas, de izquierda a derecha, como en el cuaderno */
    const cols = [0, 1, 2, 3].map(c => Array.from({ length: nf }, (_, r) => ws[r * 4 + c]));
    /* ancho en mm con las métricas de Helvetica Bold y el cuerpo en pt de TeX (1 pt = 0,3515 mm) */
    /* pdf-lib descuenta el interletraje (AV, VA…) al medir, pero no lo aplica al escribir:
       se mide letra a letra para que LAVAVAJILLAS no se salga del margen */
    const ancho = (w, t) => [...w].reduce((s, ch) => s + f.helvB.widthOfTextAtSize(ch, t), 0);
    const anchoMM = (w, ptTeX) => ancho(B.normalizar(w).replace(/Ñ/g, 'N'), ptTeX) * 0.3515;
    let fpt = 13.5;
    while (true) {
      const need = cols.reduce((tot, col) => tot + Math.max(...col.map(w => anchoMM(w, fpt))) + 6.0, 0) + 3 * 7;
      if (need <= 178 || fpt <= 9) break;
      fpt -= 0.5;
    }
    const fs = fpt * 0.99626;
    const anchos = cols.map(col => 10.34 + 7.37 + Math.max(...col.map(w => ancho(w.toUpperCase(), fs))));
    const hueco = (510.24 - anchos.reduce((a, b) => a + b, 0) - 2 * 11.96) / 3;
    const xs = [42.52];
    xs.push(xs[0] + anchos[0] + hueco);
    xs.push(xs[1] + anchos[1] + 11.96 + hueco);
    xs.push(xs[2] + anchos[2] + 11.96 + hueco);
    /* altura de cada fila como en LaTeX: puntal de 11,16 bp o la mayúscula con tilde */
    const alto = fila => Math.max(11.16, ...fila.map(w => (/[ÁÉÍÓÚÑÜ]/.test(w.toUpperCase()) ? 0.926 : 0.72) * fs));
    const filas = Array.from({ length: nf }, (_, r) => [0, 1, 2, 3].map(c => cols[c][r]));
    /* en la normal, la lista empieza 64,8 bp por debajo de la cuadrícula (como en el cuaderno);
       en la ampliada, algo más cerca y con filas un poco más juntas */
    let y = (amp ? yRej + lado + 34 : 690.16) + alto(filas[0]);
    const salto = amp ? 3.2 + 8.6 : 4.78 + 9.64;
    const casilla = B.rectRedondeado(3.4 * B.MM, 3.4 * B.MM, 0.6);
    const navy70 = B.hex('#617289');
    filas.forEach((fila, r) => {
      if (r > 0) y += salto + alto(fila);
      fila.forEach((w, c) => {
        lz.svg(casilla, xs[c] + 0.35, y - 0.71 - 3.4 * B.MM, { borderColor: navy70, borderWidth: 0.6974 });
        lz.texto(w.toUpperCase(), xs[c] + 17.71, y, fs, f.helvB, tinta);
      });
    });
  }

  /* Soluciones: cuatro por página, en el orden de las fichas (maqueta de la página 53 del cuaderno).
     Todas las cuadrículas miden 81 mm: casillas de 5,4 mm (normal) o 4,5 mm (ampliada). */
  function dibujarSoluciones(doc, f, lista) {
    for (let k = 0; k < lista.length; k += 4) {
      const pagina = doc.addPage(B.A4V);
      const lz = B.lienzo(pagina);
      lz.texto('Soluciones', 42.52, 61.42, 25.9, f.helvB, B.hex(NAVY));
      lista.slice(k, k + 4).forEach(({ sopa, codigo }, j) => {
        const x = j % 2 === 0 ? 42.52 : 317.68;
        const yb = j < 2 ? 118.06 : 395.67;
        lz.texto(codigo, x, yb, 11.96, f.helvB, B.hex(TURQ));
        lz.texto(sopa.titulo, x + f.helvB.widthOfTextAtSize(codigo, 11.96) + 9, yb, 11.96, f.helvB, B.hex(NAVY));
        const N = sopa.grid.length;
        dibujarRejilla(lz, f, sopa, x + 2.74, yb + 9.6, 81 * B.MM / N, 9.96 * 15 / N, true);
      });
    }
  }

  /* ---------- Secuencia de temas y palabras ----------
     Las sopas siguen una lista fija y numerada de NUM_SOPAS puestos; el navegador guarda por
     dónde va (CLAVE_INDICE) y empieza en un punto al azar la primera vez.
     · Puesto n: bloque b = n div T (T = número de temas). Cada bloque recorre todos los temas
       en un orden barajado propio, así que un tema sale una vez por bloque y nunca dos
       seguidos (si un bloque empezara con el tema con que acaba el anterior, se cambian los
       dos primeros).
     · La aparición b de un tema con P palabras usa la vuelta v = b div P de una baraja fija de
       sus palabras y empieza en la posición (b mod P) · paso mod P (paso: el primer número
       ≥ 16 sin divisores comunes con P; la baraja de cada vuelta está elegida de antemano para
       que no repita ningún juego de palabras anterior y comparta pocas con el final de la
       vuelta anterior: ver elegirVueltas).
       Desde ahí toma 16 o 24 palabras seguidas, saltando las
       que se contienen en otra ya tomada (PIE / PIERNA). Así, entre una aparición y la
       siguiente cambian casi todas las palabras, y ningún tema repite el mismo juego de
       palabras en sus 1200 apariciones (comprobado con herramientas/comprobar_secuencia.js).
     Resultado: dentro de NUM_SOPAS = 96 000 puestos seguidos no hay dos sopas con el mismo
     tema y las mismas palabras (y además cada cuadrícula se rellena al azar). */
  const VUELTAS = 1200, CLAVE_INDICE = 'banco-trabajo-sopas-indice';

  function sembrar(texto) {                 /* FNV-1a de 32 bits */
    let h = 0x811c9dc5;
    for (const ch of texto) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  const normas = new Map();
  function norma(w) { let n = normas.get(w); if (n === undefined) { n = B.normalizar(w); normas.set(w, n); } return n; }
  function seContienen(a, b) {
    const x = norma(a), y = norma(b);
    const rx = [...x].reverse().join(''), ry = [...y].reverse().join('');
    return x !== y && (y.includes(x) || y.includes(rx) || x.includes(y) || x.includes(ry));
  }
  function mcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }

  function ordenBloque(T, b) {
    const baraja = o => B.barajar(B.crearAzar(sembrar('orden|' + o)), Array.from({ length: T }, (_, i) => i));
    const orden = baraja(b);
    const anterior = baraja((b + VUELTAS - 1) % VUELTAS);   /* el bloque 0 sigue al último */
    if (orden[0] === anterior[T - 1]) [orden[0], orden[1]] = [orden[1], orden[0]];
    return orden;
  }

  /* Para cada palabra de un tema, las que la contienen o están contenidas en ella */
  const choques = new Map();
  function choquesDe(tema) {
    if (!choques.has(tema.t)) {
      const m = new Map(tema.p.map(w => [w, new Set()]));
      tema.p.forEach((a, i) => tema.p.slice(i + 1).forEach(b => { if (seContienen(a, b)) { m.get(a).add(b); m.get(b).add(a); } }));
      choques.set(tema.t, m);
    }
    return choques.get(tema.t);
  }
  /* k palabras seguidas de la baraja desde «inicio», saltando las que chocan con una ya tomada */
  function tomar(baraja, inicio, k, choq) {
    const P = baraja.length, elegidas = [];
    for (let i = 0; i < P && elegidas.length < k; i++) {
      const w = baraja[(inicio + i) % P], c = choq.get(w);
      if (!c.size || !elegidas.some(e => c.has(e))) elegidas.push(w);
    }
    return elegidas;
  }
  function pasoDe(P) { let paso = 16; while (mcd(paso, P) !== 1) paso++; return paso; }

  /* Candidata j para la vuelta w de un tema (siempre la misma: no depende del azar del
     navegador). La vuelta 0 es una baraja cualquiera; las siguientes empiezan casi todas con
     palabras que no salieron en la última aparición de la vuelta anterior. */
  function candidata(tema, w, j, previa) {
    const azar = B.crearAzar(sembrar(tema.t + '|' + w + '|' + j));
    if (w === 0) return B.barajar(azar, tema.p.slice());
    const P = tema.p.length, fin = ((P - 1) * pasoDe(P)) % P;
    const antes = new Set(tomar(previa, fin, 24, choquesDe(tema)));
    const nuevas = B.barajar(azar, tema.p.filter(x => !antes.has(x)));
    const viejas = B.barajar(azar, tema.p.filter(x => antes.has(x)));
    for (let q = 0; q < 3 && q < nuevas.length; q++) {        /* 3 cambiadas de sitio */
      const a = Math.floor(azar() * nuevas.length), b = Math.floor(azar() * viejas.length);
      [nuevas[a], viejas[b]] = [viejas[b], nuevas[a]];
    }
    return B.barajar(azar, nuevas).concat(viejas);
  }

  /* Baraja de la vuelta v de un tema. Cada tema lleva en datos/sopas.json («v») qué candidata
     usa cada vuelta; la eligió herramientas/construir_secuencia.js con elegirVueltas(). */
  const barajas = new Map();
  function barajaVuelta(tema, v) {
    if (!barajas.has(tema.t)) barajas.set(tema.t, []);
    const lista = barajas.get(tema.t);
    while (lista.length <= v) {
      const w = lista.length;
      lista.push(candidata(tema, w, (tema.v && tema.v[w]) || 0, lista[w - 1]));
    }
    return lista[v];
  }

  /* Solo para la herramienta: elige la candidata de cada vuelta. Descarta las que repetirían
     un juego de palabras ya salido (en una vuelta anterior o en la misma, en tamaño normal o
     ampliado) y, de las válidas, se queda con la que menos comparte con el final de la vuelta
     anterior. */
  function elegirVueltas(tema, intentos) {
    const P = tema.p.length, paso = pasoDe(P), choq = choquesDe(tema), usados = new Set();
    const vueltas = Math.ceil(VUELTAS / P), elegidas = [], barajasT = [];
    const clave = ws => ws.slice().sort().join(',');
    const juegos = baraja => {
      const claves = [];
      for (const k of [16, 24]) for (let ini = 0; ini < P; ini++) claves.push(k + ':' + clave(tomar(baraja, ini, k, choq)));
      return new Set(claves).size === claves.length && !claves.some(c => usados.has(c)) ? claves : null;
    };
    for (let w = 0; w < vueltas; w++) {
      const previa = barajasT[w - 1];
      const antes = w ? [16, 24].map(k => new Set(tomar(previa, ((P - 1) * paso) % P, k, choq))) : null;
      let mejor = null;
      for (let j = 0; j < (intentos || 40); j++) {
        const c = candidata(tema, w, j, previa);
        const nota = w ? [16, 24].reduce((t, k, i) => t + tomar(c, 0, k, choq).filter(x => antes[i].has(x)).length, 0) : 0;
        if (mejor && nota >= mejor.nota) continue;
        const claves = juegos(c);
        if (claves) mejor = { j, c, claves, nota };
        if (!w && mejor) break;
      }
      if (!mejor) throw new Error('El tema «' + tema.t + '» no tiene palabras suficientes para la vuelta ' + w);
      mejor.claves.forEach(c => usados.add(c));
      elegidas.push(mejor.j); barajasT.push(mejor.c);
    }
    return elegidas;
  }

  function palabrasDe(tema, aparicion, k) {
    const P = tema.p.length, paso = pasoDe(P);
    const vuelta = Math.floor(aparicion / P), inicio = ((aparicion % P) * paso) % P;
    const elegidas = tomar(barajaVuelta(tema, vuelta), inicio, k, choquesDe(tema));
    if (elegidas.length < k) throw new Error('El tema «' + tema.t + '» no tiene ' + k + ' palabras compatibles');
    return elegidas;
  }

  /* Tema y palabras del puesto n de la secuencia */
  function puesto(temas, n, formato) {
    const T = temas.length, total = T * VUELTAS;
    n = ((n % total) + total) % total;
    const b = Math.floor(n / T), tema = temas[ordenBloque(T, b)[n % T]];
    return { t: tema.t, p: palabrasDe(tema, b, 4 * FORMATOS[formato || 'normal'].porDir), puesto: n };
  }

  /* Los siguientes «cuantos» puestos para este navegador (y avanza el contador) */
  function siguientes(temas, cuantos, formato, azar) {
    const total = temas.length * VUELTAS;
    let n = null;
    try { const v = localStorage.getItem(CLAVE_INDICE); if (v !== null && /^\d+$/.test(v)) n = Number(v) % total; } catch (e) { /* sin almacenamiento */ }
    if (n === null) n = Math.floor(azar() * total);
    const lista = Array.from({ length: cuantos }, (_, i) => puesto(temas, n + i, formato));
    return { lista, confirmar() { try { localStorage.setItem(CLAVE_INDICE, String((n + cuantos) % total)); } catch (e) { /* sin almacenamiento */ } } };
  }

  B.sopas = {
    FORMATOS, VUELTAS, generar, comprobar, ordenar, puesto, siguientes, palabrasDe, ordenBloque, seContienen, elegirVueltas,
    formatoCodigo() { return n => n + '-S'; },
    dibujarFicha, dibujarSoluciones
  };
})(typeof self !== 'undefined' ? self : this);
