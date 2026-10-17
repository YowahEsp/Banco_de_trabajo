/* =====================================================================
   BANCO DE TRABAJO · motor de los crucigramas con pictogramas
   Traducción a JavaScript de herramientas/crucigramas/generar.py del
   repositorio fichas-alfabetizacion (formato aprobado CRUCIGRAMA_L45_01 y
   repertorio cr-01…cr-25), con las mismas reglas:
     · 18 palabras, ninguna pareja en conflicto.
     · Cruces solo en letra idéntica y sin tilde (la ñ solo cruza con ñ).
     · Números de palabra fuera de la rejilla (izquierda / encima).
     · Ningún hueco vacío encerrado por casillas.
     · Casilla lo más grande posible (objetivo ≥ 14 mm) en 281 × 177 mm.
     · Dibujos en huecos de 24 a 32 mm con 2 mm de aire, asignados a su
       palabra por cercanía (asignación húngara).
   Funciona igual en un Web Worker que en la página.
   ===================================================================== */
(function (global) {
  'use strict';

  const RW = 281, RH = 177;      /* zona de trabajo en mm */
  const GAP = 2;                 /* aire mínimo entre dibujos, casillas y números (mm) */
  const NPAL = 18;               /* palabras por crucigrama */
  const PMIN = 24, PMAX = 32;    /* lado del hueco de cada dibujo (mm) */
  const ACC = new Set('áéíóúü');
  const BIT = { A: 1, D: 2 };
  const PESOS = { cruce: 2, tam: 0.6, azar: 1.5, orden: 0, largo: 0, uso: 0, empaquetar: true };   /* puntuación de cada colocación (generar.py) */
  /* Pesos de construir(): menos peso a los cruces y más a lo compacto que en build() */
  const PESOS_RESERVA = { cruce: 1, tam: 1.2, azar: 1.5, largo: 0, uso: 1.5 };
  const K = (r, c) => (r + 512) * 2048 + (c + 512);
  const KR = k => Math.floor(k / 2048) - 512, KC = k => (k % 2048) - 512;

  /* ---------------------------------------------------------- azar */
  function azarSemilla(semilla) {
    let a = semilla >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function barajar(rng, a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------------------------------------------------------- rejilla */
  class Grid {
    constructor() {
      this.cells = new Map(); this.dirs = new Map(); this.words = []; this.labels = new Set();
      this.r0 = Infinity; this.r1 = -Infinity; this.c0 = Infinity; this.c1 = -Infinity;
    }
    /* n.º de cruces si la palabra cabe ahí, o −1 */
    can(w, r, c, d) {
      const dr = d === 'A' ? 0 : 1, dc = d === 'A' ? 1 : 0, n = w.length;
      if (this.cells.has(K(r - dr, c - dc)) || this.cells.has(K(r + dr * n, c + dc * n))) return -1;
      let cross = 0;
      for (let i = 0; i < n; i++) {
        const pr = r + dr * i, pc = c + dc * i, k = K(pr, pc), ch = w[i];
        if (this.cells.has(k)) {
          if ((this.dirs.get(k) & BIT[d]) || this.cells.get(k) !== ch || ACC.has(ch)) return -1;
          cross++;
        } else if (this.cells.has(K(pr + dc, pc + dr)) || this.cells.has(K(pr - dc, pc - dr))) return -1;
      }
      return cross;
    }
    ampliar(r, c) {
      if (r < this.r0) this.r0 = r; if (r > this.r1) this.r1 = r;
      if (c < this.c0) this.c0 = c; if (c > this.c1) this.c1 = c;
    }
    place(w, r, c, d) {
      const dr = d === 'A' ? 0 : 1, dc = d === 'A' ? 1 : 0;
      for (let i = 0; i < w.length; i++) {
        const k = K(r + dr * i, c + dc * i);
        this.cells.set(k, w[i]); this.dirs.set(k, (this.dirs.get(k) || 0) | BIT[d]);
        this.ampliar(r + dr * i, c + dc * i);
      }
      const lr = d === 'A' ? r : r - 1, lc = d === 'A' ? c - 1 : c;
      this.labels.add(K(lr, lc)); this.ampliar(lr, lc);
      this.words.push([w, r, c, d]);
    }
    bbox() { return [this.r0, this.r1, this.c0, this.c1]; }
  }

  /* ¿Queda algún hueco vacío rodeado de casillas? (parecería una casilla más) */
  function huecosCerrados(g) {
    const r0 = g.r0 - 1, r1 = g.r1 + 1, c0 = g.c0 - 1, c1 = g.c1 + 1;
    const W = c1 - c0 + 1, H = r1 - r0 + 1;
    const visto = new Uint8Array(W * H);
    const pila = [[r0, c0]]; let n = 0;
    while (pila.length) {
      const [r, c] = pila.pop();
      if (r < r0 || r > r1 || c < c0 || c > c1) continue;
      const i = (r - r0) * W + (c - c0);
      if (visto[i] || g.cells.has(K(r, c))) continue;
      visto[i] = 1; n++;
      pila.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
    }
    return n < W * H - g.cells.size;
  }

  function build(words, rng, ratio, limite) {
    const g = new Grid(); const ws = words.slice();
    let fi = 0; for (let i = 1; i < ws.length; i++) if (ws[i].length > ws[fi].length) fi = i;
    const first = ws.splice(fi, 1)[0]; g.place(first, 0, 0, 'A');
    let pending = ws;
    for (let pasada = 0; pasada < 3; pasada++) {
      const rest = []; barajar(rng, pending);
      if (pasada === 0 && PESOS.orden > 0) {          /* primero las largas, con algo de azar */
        const clave = new Map(pending.map(w => [w, w.length + rng() * PESOS.orden]));
        pending.sort((a, b) => clave.get(b) - clave.get(a));
      }
      for (const w of pending) {
        const n = w.length; let best = null, bestScore = -Infinity;
        for (const [key, ch] of g.cells) {
          const pr = KR(key), pc = KC(key);
          for (let i = 0; i < n; i++) {
            if (w[i] !== ch) continue;
            for (const d of ['A', 'D']) {
              const r = d === 'A' ? pr : pr - i, c = d === 'A' ? pc - i : pc;
              const x = g.can(w, r, c, d);
              if (x < 1) continue;
              const dr = d === 'A' ? 0 : 1, dc = d === 'A' ? 1 : 0;
              const lr = d === 'A' ? r : r - 1, lc = d === 'A' ? c - 1 : c;
              if (g.labels.has(K(lr, lc))) continue;
              let malo = false;
              for (let k = 0; k < n && !malo; k++) if (g.labels.has(K(r + dr * k, c + dc * k))) malo = true;
              if (malo) continue;
              const nr0 = Math.min(g.r0, lr, r), nr1 = Math.max(g.r1, r + dr * (n - 1));
              const nc0 = Math.min(g.c0, lc, c), nc1 = Math.max(g.c1, c + dc * (n - 1));
              if (limite && (nc1 - nc0 + 1 > limite[0] || nr1 - nr0 + 1 > limite[1])) continue;
              const size = Math.max((nc1 - nc0 + 1) / ratio, nr1 - nr0 + 1);
              const score = x * PESOS.cruce - size * PESOS.tam + rng() * PESOS.azar;
              if (score > bestScore) { bestScore = score; best = [r, c, d]; }
            }
          }
        }
        if (best) g.place(w, best[0], best[1], best[2]); else rest.push(w);
      }
      pending = rest;
      if (!pending.length) break;
    }
    return (pending.length || huecosCerrados(g)) ? null : g;
  }

  /* Construcción con reserva de palabras y rectángulo máximo.
     En lugar de colocar 18 palabras fijas (build), en cada paso se elige, entre todas las
     palabras de la reserva que no chocan con las ya puestas, la colocación con más cruces y
     que menos agranda la rejilla, sin salirse de lim = [columnas, filas] (incluidas las
     casillas de los números). Así salen rejillas compactas aunque haya palabras largas.
     Mismas reglas que build(): cruce en letra idéntica sin tilde, sin palabras pegadas,
     números fuera de la rejilla y sin huecos cerrados. */
  function construir(reserva, rng, lim, ratio, conflicto) {
    const g = new Grid(), sel = [], P = PESOS_RESERVA;
    const prioridad = new Map(reserva.map((w, i) => [w, 1 - i / reserva.length]));   /* las menos usadas, antes */
    const porLetra = new Map();
    const anotar = (w, r, c, d) => {
      const dr = d === 'A' ? 0 : 1, dc = d === 'A' ? 1 : 0;
      for (let i = 0; i < w.length; i++) {
        const k = K(r + dr * i, c + dc * i);
        if (g.cells.has(k)) continue;
        if (!porLetra.has(w[i])) porLetra.set(w[i], []);
        porLetra.get(w[i]).push(k);
      }
    };
    const iniciales = reserva.filter(w => w.length + 1 <= lim[0] && w.length >= 5);
    if (!iniciales.length) return null;
    const w0 = iniciales[Math.floor(rng() * iniciales.length)];
    anotar(w0, 0, 0, 'A'); g.place(w0, 0, 0, 'A'); sel.push(w0);
    const prohibidas = new Set();
    while (sel.length < NPAL) {
      const opciones = [];
      for (const w of reserva) {
        if (sel.includes(w) || prohibidas.has(w) || conflicto(w, sel)) continue;
        const n = w.length;
        for (let i = 0; i < n; i++) {
          const lista = porLetra.get(w[i]);
          if (!lista) continue;
          for (const key of lista) {
            const pr = KR(key), pc = KC(key);
            for (const d of ['A', 'D']) {
              const r = d === 'A' ? pr : pr - i, c = d === 'A' ? pc - i : pc;
              const x = g.can(w, r, c, d);
              if (x < 1) continue;
              const dr = d === 'A' ? 0 : 1, dc = d === 'A' ? 1 : 0;
              const lr = d === 'A' ? r : r - 1, lc = d === 'A' ? c - 1 : c;
              if (g.labels.has(K(lr, lc))) continue;
              let malo = false;
              for (let k = 0; k < n && !malo; k++) if (g.labels.has(K(r + dr * k, c + dc * k))) malo = true;
              if (malo) continue;
              const nr0 = Math.min(g.r0, lr, r), nr1 = Math.max(g.r1, r + dr * (n - 1));
              const nc0 = Math.min(g.c0, lc, c), nc1 = Math.max(g.c1, c + dc * (n - 1));
              const W = nc1 - nc0 + 1, H = nr1 - nr0 + 1;
              if (W > lim[0] || H > lim[1]) continue;
              const size = Math.max(W / ratio, H);
              const score = x * P.cruce - size * P.tam + rng() * P.azar + n * P.largo + prioridad.get(w) * P.uso;
              opciones.push([score, w, r, c, d]);
            }
          }
        }
      }
      if (!opciones.length) return null;
      opciones.sort((a, b) => b[0] - a[0]);
      let puesto = false;
      for (const [, w, r, c, d] of opciones.slice(0, 6)) {
        const copia = { cells: new Map(g.cells), dirs: new Map(g.dirs), labels: new Set(g.labels), words: g.words.slice(),
          r0: g.r0, r1: g.r1, c0: g.c0, c1: g.c1 };
        g.place(w, r, c, d);
        if (huecosCerrados(g)) { Object.assign(g, copia); continue; }
        /* deshacer y volver a colocar anotando las casillas nuevas por letra */
        Object.assign(g, copia); anotar(w, r, c, d); g.place(w, r, c, d); sel.push(w);
        puesto = true; break;
      }
      if (!puesto) prohibidas.add(opciones[0][1]);
    }
    return g;
  }

  /* 18 palabras del subconjunto sin pares en conflicto */
  function libres(sub, rng, conflicto) {
    if (sub.length === NPAL) return sub.slice();
    const ws = barajar(rng, sub.slice()), sel = [];
    for (const w of ws) {
      if (conflicto(w, sel)) continue;
      sel.push(w);
      if (sel.length === NPAL) return sel;
    }
    return null;
  }

  /* ---------------------------------------------------------- huecos para dibujos */
  function obstaculos(words, s, ox, oy, r0, c0) {
    const m = new Uint8Array(RH * RW); const cells = new Set();
    for (const [w, r, c, d] of words) {
      const dr = d === 'A' ? 0 : 1, dc = d === 'A' ? 1 : 0;
      for (let i = 0; i < w.length; i++) cells.add(K(r + dr * i, c + dc * i));
      cells.add(d === 'A' ? K(r, c - 1) : K(r - 1, c));
    }
    for (const k of cells) {
      const y = oy + (KR(k) - r0) * s, x = ox + (KC(k) - c0) * s;
      const ya = Math.floor(Math.max(0, y - GAP)), yb = Math.floor(Math.min(RH, Math.ceil(y + s + GAP)));
      const xa = Math.floor(Math.max(0, x - GAP)), xb = Math.floor(Math.min(RW, Math.ceil(x + s + GAP)));
      for (let yy = ya; yy < yb; yy++) m.fill(1, yy * RW + xa, yy * RW + xb);
    }
    return m;
  }
  function integral(m) {
    const W1 = RW + 1, ii = new Int32Array((RH + 1) * W1);
    for (let y = 0; y < RH; y++) {
      let fila = 0;
      for (let x = 0; x < RW; x++) { fila += m[y * RW + x]; ii[(y + 1) * W1 + x + 1] = ii[y * W1 + x + 1] + fila; }
    }
    return ii;
  }
  /* Mapa de esquinas libres para cuadrados de lado p */
  function mapaLibre(m, p) {
    const ii = integral(m), W1 = RW + 1, H2 = RH - p + 1, W2 = RW - p + 1;
    const libre = new Uint8Array(H2 * W2);
    for (let y = 0; y < H2; y++) {
      const a = y * W1, b = (y + p) * W1;
      for (let x = 0; x < W2; x++) {
        libre[y * W2 + x] = (ii[b + x + p] - ii[a + x + p] - ii[b + x] + ii[a + x]) === 0 ? 1 : 0;
      }
    }
    return { libre, H2, W2 };
  }
  /* Colocación voraz de n cuadrados de lado p (con separación GAP) en el orden dado.
     Devuelve las esquinas [x, y] o null. Órdenes de generar.py: filas, columnas y sus
     inversos; y además «min»: cada cuadrado donde menos sitio quita a los demás (pegado a
     las casillas y a los bordes), que deja huecos grandes para los siguientes. */
  function colocarVoraz(mapa, p, n, orden) {
    const { H2, W2 } = mapa, libre = mapa.libre.slice(), total = H2 * W2;
    const R = p + GAP, res = [];
    const quitar = (y, x) => {
      for (let yy = Math.max(0, y - R + 1); yy < Math.min(H2, y + R); yy++) {
        libre.fill(0, yy * W2 + Math.max(0, x - R + 1), yy * W2 + Math.min(W2, x + R));
      }
    };
    if (orden === 'min') {
      const W1 = W2 + 1, ii = new Int32Array((H2 + 1) * W1);
      for (let k = 0; k < n; k++) {
        for (let y = 0; y < H2; y++) {
          let fila = 0;
          for (let x = 0; x < W2; x++) { fila += libre[y * W2 + x]; ii[(y + 1) * W1 + x + 1] = ii[y * W1 + x + 1] + fila; }
        }
        let mejorC = Infinity, by = -1, bx = -1;
        for (let y = 0; y < H2; y++) {
          const ya = Math.max(0, y - R + 1), yb = Math.min(H2, y + R);
          for (let x = 0; x < W2; x++) {
            if (!libre[y * W2 + x]) continue;
            const xa = Math.max(0, x - R + 1), xb = Math.min(W2, x + R);
            const c = ii[yb * W1 + xb] - ii[ya * W1 + xb] - ii[yb * W1 + xa] + ii[ya * W1 + xa];
            if (c < mejorC) { mejorC = c; by = y; bx = x; }
          }
        }
        if (by < 0) return null;
        res.push([bx, by]); quitar(by, bx);
      }
      return res;
    }
    const pos = t => {
      if (orden === 'row') return [Math.floor(t / W2), t % W2];
      if (orden === 'rowr') return [Math.floor(t / W2), W2 - 1 - (t % W2)];
      if (orden === 'col') return [t % H2, Math.floor(t / H2)];
      return [H2 - 1 - (t % H2), Math.floor(t / H2)];                 /* colr */
    };
    let t = 0;
    for (let k = 0; k < n; k++) {
      let y = 0, x = 0;
      for (; t < total; t++) { [y, x] = pos(t); if (libre[y * W2 + x]) break; }
      if (t >= total) return null;
      res.push([x, y]); quitar(y, x);
    }
    return res;
  }
  /* Primera posición de la rejilla (y huecos de 24 mm) en la que caben los 18 dibujos */
  function factible(cand, s) {
    const [r0, r1, c0, c1] = cand.bbox, H = r1 - r0 + 1, W = c1 - c0 + 1, gw = W * s, gh = H * s;
    if (gw > RW || gh > RH) return null;
    const xs = [...new Set([0, (RW - gw) / 2, RW - gw])].sort((a, b) => a - b);
    const ys = [...new Set([0, (RH - gh) / 2, RH - gh])].sort((a, b) => a - b);
    for (const ox of xs) for (const oy of ys) {
      const m = obstaculos(cand.words, s, ox, oy, r0, c0);
      let libres = 0; for (let i = 0; i < m.length; i++) libres += 1 - m[i];
      if (libres < NPAL * PMIN * PMIN) continue;                  /* no caben ni sin aire */
      const mapa = mapaLibre(m, PMIN);
      for (const orden of ['row', 'col', 'rowr', 'colr', 'min']) {
        const sp = colocarVoraz(mapa, PMIN, NPAL, orden);
        if (sp) return [ox, oy, sp];
      }
    }
    return null;
  }
  function mayorCuadrado(m) {
    const ii = integral(m), W1 = RW + 1;
    const buscar = k => {
      for (let y = 0; y + k <= RH; y++) for (let x = 0; x + k <= RW; x++) {
        if (ii[(y + k) * W1 + x + k] - ii[y * W1 + x + k] - ii[(y + k) * W1 + x] + ii[y * W1 + x] === 0) return [y, x];
      }
      return null;
    };
    let lo = 0, hi = Math.min(RH, RW);
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (buscar(mid)) lo = mid; else hi = mid - 1; }
    if (lo === 0) return [0, 0, 0];
    const [y, x] = buscar(lo);
    return [lo, y, x];
  }

  /* Asignación húngara (matriz cuadrada de costes) */
  function hungaro(cost) {
    const n = cost.length, INF = 1e18;
    const u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0), p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      p[0] = i; let j0 = 0; const minv = new Array(n + 1).fill(INF), used = new Array(n + 1).fill(false);
      do {
        used[j0] = true; const i0 = p[j0]; let delta = INF, j1 = 0;
        for (let j = 1; j <= n; j++) if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (let j = 0; j <= n; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
        j0 = j1;
      } while (p[j0] !== 0);
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }
    const asig = new Array(n);
    for (let j = 1; j <= n; j++) asig[p[j] - 1] = j - 1;
    return asig;
  }

  /* ---------------------------------------------------------- maquetación (mm, desde arriba) */
  /* Agranda cada hueco de 24 mm hasta 32 mm si hay sitio (sin perder el aire de 2 mm) */
  function crecer(m, esquinas) {
    const spots = esquinas.map(([x, y]) => [x, y, PMIN]);
    const bloquear = (mm, x, y, p) => {
      for (let yy = Math.max(0, y - GAP); yy < Math.min(RH, y + p + GAP); yy++) {
        mm.fill(1, yy * RW + Math.max(0, x - GAP), yy * RW + Math.min(RW, x + p + GAP));
      }
    };
    /* 1) cada dibujo, de menor a mayor, se muda al mayor hueco libre si allí cabe más grande
          (centrado en él, como en generar.py) */
    for (let pasada = 0; pasada < 2; pasada++) {
      const orden = spots.map((sp, i) => i).sort((a, b) => spots[a][2] - spots[b][2]);
      for (const i of orden) {
        const mm = m.slice();
        spots.forEach(([x, y, p], j) => { if (j !== i) bloquear(mm, x, y, p); });
        const [q, y, x] = mayorCuadrado(mm), p = Math.min(q, PMAX);
        if (p >= spots[i][2] + 2) spots[i] = [x + Math.floor((q - p) / 2), y + Math.floor((q - p) / 2), p];
      }
    }
    /* 2) los que no se han mudado, se agrandan en su sitio si hay aire */
    for (let i = 0; i < spots.length; i++) {
      const mm = m.slice();
      spots.forEach(([x, y, p], j) => { if (j !== i) bloquear(mm, x, y, p); });
      const ii = integral(mm), W1 = RW + 1;
      const [x0, y0, p0] = spots[i];
      let hecho = false;
      for (let p = PMAX; p > p0 && !hecho; p--) {
        const extra = p - p0, opciones = [];
        for (let dy = 0; dy <= extra; dy++) for (let dx = 0; dx <= extra; dx++) opciones.push([dy, dx]);
        opciones.sort((a, b) => (Math.abs(a[0] - extra / 2) + Math.abs(a[1] - extra / 2)) - (Math.abs(b[0] - extra / 2) + Math.abs(b[1] - extra / 2)));
        for (const [dy, dx] of opciones) {
          const y = y0 - dy, x = x0 - dx;
          if (y < 0 || x < 0 || y + p > RH || x + p > RW) continue;
          if (ii[(y + p) * W1 + x + p] - ii[y * W1 + x + p] - ii[(y + p) * W1 + x] + ii[y * W1 + x] === 0) {
            spots[i] = [x, y, p]; hecho = true; break;
          }
        }
      }
    }
    return spots;
  }

  function maquetar(s, cand, ox, oy, aspectos, esquinas) {
    const [r0, , c0] = cand.bbox;
    const words = cand.words.slice().sort((a, b) => a[1] - b[1] || a[2] - b[2] || (a[3] < b[3] ? -1 : a[3] > b[3] ? 1 : 0));
    const cxy = (r, c) => [ox + (c - c0) * s, oy + (r - r0) * s];
    const m = obstaculos(words, s, ox, oy, r0, c0);
    let spots = [];
    if (esquinas) spots = crecer(m, esquinas);
    else {
      /* procedimiento de generar.py: el mayor hueco libre cada vez */
      for (let k = 0; k < NPAL; k++) {
        let [q, y, x] = mayorCuadrado(m); const p = Math.min(q, PMAX);
        if (p < PMIN) return null;
        y += Math.floor((q - p) / 2); x += Math.floor((q - p) / 2); spots.push([x, y, p]);
        for (let yy = Math.max(0, y - GAP); yy < Math.min(RH, y + p + GAP); yy++) {
          m.fill(1, yy * RW + Math.max(0, x - GAP), yy * RW + Math.min(RW, x + p + GAP));
        }
      }
    }
    const cost = words.map(([w, r, c, d]) => {
      const n = w.length;
      const [wx, wy] = cxy(r + (n - 1) / 2 * (d === 'D' ? 1 : 0), c + (n - 1) / 2 * (d === 'A' ? 1 : 0));
      return spots.map(([x, y, p]) => Math.hypot(x + p / 2 - wx - s / 2, y + p / 2 - wy - s / 2));
    });
    const cj = hungaro(cost);
    const numeros = [], dibujos = [], letras = [], celdas = new Set();
    words.forEach(([w, r, c, d], i) => {
      const num = i + 1, dr = d === 'A' ? 0 : 1, dc = d === 'A' ? 1 : 0;
      for (let k = 0; k < w.length; k++) {
        const [x, y] = cxy(r + dr * k, c + dc * k); celdas.add(K(r + dr * k, c + dc * k));
        letras.push({ x: x + s / 2, y: y + s / 2, l: w[k] });
      }
      if (d === 'A') { const [x, y] = cxy(r, c - 1); numeros.push({ t: 'h', x: x + s - 1.2, y: y + s / 2, num }); }
      else { const [x, y] = cxy(r - 1, c); numeros.push({ t: 'v', x: x + s / 2, y: y + s - 1.2, num }); }
      const [x, y, p] = spots[cj[i]], a = aspectos[w] || 1;
      const NH = 5.0, NW = 3.2 * String(num).length + 1.0;
      const wa = Math.min(p, (p - NH) * a), ha = wa / a, hb = Math.min(p, (p - NW) / a), wb = hb * a;
      let wi, hi, xi, yi, nx, ny;
      if (wa * ha >= wb * hb) { wi = wa; hi = ha; xi = x + (p - wi) / 2; yi = y + p - hi; nx = xi; ny = yi - NH; }
      else { wi = wb; hi = hb; xi = x + (p - wi - NW) / 2 + NW; yi = y + (p - hi) / 2; nx = xi - NW; ny = yi; }
      dibujos.push({ w, xi, yi, wi, hi, nx, ny, num, hueco: [x, y, p] });
    });
    /* aristas únicas, fusionadas en tramos */
    const Hs = new Map(), Vs = new Map();
    const anadir = (mapa, a, b) => { if (!mapa.has(a)) mapa.set(a, new Set()); mapa.get(a).add(b); };
    for (const k of celdas) { const r = KR(k), c = KC(k); anadir(Hs, r, c); anadir(Hs, r + 1, c); anadir(Vs, c, r); anadir(Vs, c + 1, r); }
    const tramos = mapa => {
      const out = [];
      for (const a of [...mapa.keys()].sort((x, y) => x - y)) {
        const bs = [...mapa.get(a)].sort((x, y) => x - y); let st = bs[0], pv = bs[0];
        for (let i = 1; i <= bs.length; i++) {
          if (i < bs.length && bs[i] === pv + 1) { pv = bs[i]; continue; }
          out.push([a, st, pv - st + 1]);
          if (i < bs.length) { st = pv = bs[i]; }
        }
      }
      return out;
    };
    const E = 0.16, lineas = [];
    for (const [rr, cc, n] of tramos(Hs)) { const [x, y] = cxy(rr, cc); lineas.push([x - E, y, x + n * s + E, y]); }
    for (const [cc, rr, n] of tramos(Vs)) { const [x, y] = cxy(rr, cc); lineas.push([x, y - E, x, y + n * s + E]); }
    return {
      s, lineas, numeros, dibujos, letras,
      numeracion: words.map(([w, r, c, d], i) => ({ num: i + 1, w, dir: d === 'A' ? 'horizontal' : 'vertical', r, c })),
      celdas: words.flatMap(([w, r, c, d]) => [...w].map((ch, k) => [r + (d === 'D' ? k : 0), c + (d === 'A' ? k : 0), ch]))
    };
  }

  /* Rejilla con la casilla más grande (pasos de 0,25 mm) en la que caben los 18 dibujos.
     Como en generar.py se recorren las rejillas de mayor a menor casilla posible; para no
     probar cada tamaño de cada rejilla, primero se mira si mejora en 0,25 mm a la mejor
     hallada y solo entonces se busca hacia arriba. */
  function mejor(cands, aspectos, previo, limiteMs) {
    const t0 = Date.now();
    const smax = c => { const [r0, r1, c0, c1] = c.bbox; return Math.min(RW / (c1 - c0 + 1), RH / (r1 - r0 + 1)); };
    const ok = (c, s) => { const r = factible(c, s); return r ? { ox: r[0], oy: r[1], esquinas: r[2] } : null; };
    cands.sort((a, b) => smax(b) - smax(a));
    let best = previo && previo.res ? previo : { s: 0, cand: null, res: null };
    for (const c of cands) {
      if (smax(c) <= best.s + 0.25 - 1e-9) break;
      if (limiteMs && best.res && Date.now() - t0 > limiteMs) break;
      const tope = Math.floor(smax(c) * 4 + 1e-9);
      let q = Math.floor(best.s * 4 + 1e-9) + 1;
      let r = ok(c, q / 4);
      if (!r) continue;
      let mejorQ = q, mejorR = r;
      for (q = mejorQ + 1; q <= tope; q++) {
        r = ok(c, q / 4);
        if (r) { mejorQ = q; mejorR = r; }
        else if (q > mejorQ + 1) break;            /* dos fallos seguidos: no sigue creciendo */
      }
      best = { s: mejorQ / 4, cand: c, res: mejorR };
    }
    return best;
  }

  /* ---------------------------------------------------------- un crucigrama completo
     opciones: { reserva (≈40 palabras, de menos a más usadas), extra (las siguientes, por si
     hacen falta), conflictos (lista de grupos),
     aspectos {palabra: ancho/alto}, semilla, intentos (por ronda), rondas, objetivo (mm),
     progreso(fn) } */
  function generarCrucigrama(op) {
    const rng = azarSemilla(op.semilla >>> 0);
    const grupos = op.conflictos.map(g => new Set(g));
    const conflicto = (w, sel) => grupos.some(G => G.has(w) && sel.some(x => x !== w && G.has(x)));
    const objetivo = op.objetivo || 14, rondas = op.rondas || 4, intentos = op.intentos || 120;
    let best = { s: 0, res: null }, nc = 0;
    /* si con la reserva no sale una rejilla buena, se amplía con más palabras (op.extra) */
    let reserva = op.reserva.slice(), extra = (op.extra || []).slice();
    for (let ronda = 0; ronda < rondas; ronda++) {
      const cands = [];
      for (let k = 0; k < intentos; k++) {
        const st = 12.5 + rng() * 3;                      /* casilla buscada: 12,5–15,5 mm */
        const lim = [Math.floor(RW / st), Math.floor(RH / st)];
        const g = construir(reserva, rng, lim, 1.3 + rng() * 0.9, conflicto);
        if (g) { cands.push({ words: g.words, bbox: g.bbox() }); nc++; }
      }
      best = mejor(cands, op.aspectos, best, 20000);
      if (op.progreso) op.progreso({ ronda: ronda + 1, casilla: best.s, rejillas: nc });
      if (best.s >= objetivo) break;
      if (best.s < 13 && extra.length) reserva = reserva.concat(extra.splice(0, 20));
    }
    if (!best.res) return null;
    /* maquetación final: primero el reparto de generar.py (el mayor hueco libre cada vez); si a
       este tamaño no caben así, los huecos de la comprobación, mudados y agrandados */
    const { ox, oy, esquinas } = best.res;
    const res = maquetar(best.s, best.cand, ox, oy, op.aspectos, null) || maquetar(best.s, best.cand, ox, oy, op.aspectos, esquinas);
    return res ? Object.assign({ rejillas: nc }, res) : null;
  }

  /* Comprobación independiente de un crucigrama terminado (reglas del formato aprobado) */
  function auditar(res, opciones) {
    const errores = [];
    const s = res.s;
    const celdas = new Map();
    for (const [r, c, ch] of res.celdas) {
      const k = K(r, c);
      if (celdas.has(k) && celdas.get(k) !== ch) errores.push('cruce con letras distintas');
      celdas.set(k, ch);
    }
    /* leer los tramos de la rejilla: deben ser exactamente las 18 palabras */
    const leidas = [];
    for (const [k, ch] of celdas) {
      const r = KR(k), c = KC(k);
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        if (celdas.has(K(r - dr, c - dc))) continue;
        let w = '', rr = r, cc = c;
        while (celdas.has(K(rr, cc))) { w += celdas.get(K(rr, cc)); rr += dr; cc += dc; }
        if (w.length > 1) leidas.push(w);
      }
    }
    const esperadas = res.numeracion.map(x => x.w).sort(), vistas = leidas.slice().sort();
    if (JSON.stringify(esperadas) !== JSON.stringify(vistas)) errores.push('los tramos no son las palabras: ' + vistas.join(' '));
    if (new Set(esperadas).size !== esperadas.length) errores.push('palabra repetida');
    if (esperadas.length !== NPAL) errores.push(esperadas.length + ' palabras');
    /* cruces en letra con tilde o diéresis */
    const usos = new Map();
    for (const [r, c, ch] of res.celdas) { const k = K(r, c); usos.set(k, (usos.get(k) || 0) + 1); if (usos.get(k) > 1 && ACC.has(ch)) errores.push('cruce en ' + ch); }
    /* números de palabra fuera de la rejilla y sin repetirse */
    const etiquetas = new Set();
    for (const x of res.numeracion) {
      const k = x.dir === 'horizontal' ? K(x.r, x.c - 1) : K(x.r - 1, x.c);
      if (celdas.has(k)) errores.push('número ' + x.num + ' sobre una casilla');
      if (etiquetas.has(k)) errores.push('dos números en la misma casilla');
      etiquetas.add(k);
    }
    /* huecos cerrados */
    const g = new Grid(); for (const [k, ch] of celdas) { g.cells.set(k, ch); g.ampliar(KR(k), KC(k)); }
    for (const k of etiquetas) g.ampliar(KR(k), KC(k));
    if (huecosCerrados(g)) errores.push('hueco cerrado');
    /* conflictos */
    if (opciones && opciones.conflictos) {
      for (const G of opciones.conflictos) {
        const dentro = esperadas.filter(w => G.includes(w));
        if (dentro.length > 1) errores.push('palabras que se confunden: ' + dentro.join(', '));
      }
    }
    /* cajas: casillas, números y dibujos dentro de la zona y sin solaparse */
    const cajas = [];
    const xs = res.letras.map(l => l.x), ys = res.letras.map(l => l.y);
    for (const l of res.letras) cajas.push(['casilla', l.x - s / 2, l.y - s / 2, l.x + s / 2, l.y + s / 2]);
    for (const n of res.numeros) {
      const w = 3.1 * String(n.num).length, h = 3.8;
      if (n.t === 'h') cajas.push(['número', n.x - w, n.y - h / 2, n.x, n.y + h / 2]);
      else cajas.push(['número', n.x - w / 2, n.y - h, n.x + w / 2, n.y]);
    }
    for (const d of res.dibujos) {
      cajas.push(['dibujo', d.xi, d.yi, d.xi + d.wi, d.yi + d.hi]);
      cajas.push(['número de dibujo', d.nx, d.ny, d.nx + 3.2 * String(d.num).length, d.ny + 4.0]);
      if (d.hueco[2] < PMIN - 1e-6 || d.hueco[2] > PMAX + 1e-6) errores.push('hueco de dibujo fuera de 24–32 mm');
    }
    for (const [t, x0, y0, x1, y1] of cajas) {
      if (x0 < -0.5 || y0 < -0.5 || x1 > RW + 0.5 || y1 > RH + 0.5) errores.push(t + ' fuera de la zona');
    }
    const solapa = (a, b) => a[1] < b[3] - 0.05 && b[1] < a[3] - 0.05 && a[2] < b[4] - 0.05 && b[2] < a[4] - 0.05;
    for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) {
      const a = cajas[i], b = cajas[j];
      if (a[0] === 'casilla' && b[0] === 'casilla') continue;
      if (solapa(a, b)) errores.push(a[0] + ' sobre ' + b[0]);
    }
    if (Math.min(...xs) < 0 || Math.min(...ys) < 0) errores.push('rejilla fuera de la zona');
    return [...new Set(errores)];
  }

  const API = { RW, RH, NPAL, PMIN, PMAX, generarCrucigrama, auditar, _interno: { PESOS, PESOS_RESERVA, build, construir, libres, mejor, maquetar, hungaro, huecosCerrados, factible } };
  global.CrucigramaMotor = API;

  /* En un Web Worker: atender peticiones */
  if (typeof WorkerGlobalScope !== 'undefined' && global instanceof WorkerGlobalScope) {
    global.onmessage = e => {
      const { id, opciones } = e.data;
      try {
        opciones.progreso = p => global.postMessage({ id, progreso: p });
        const res = generarCrucigrama(opciones);
        global.postMessage({ id, res });
      } catch (err) {
        global.postMessage({ id, error: String(err && err.message || err) });
      }
    };
  }
})(typeof self !== 'undefined' ? self : this);
