/* =====================================================================
   BANCO DE TRABAJO · crucigramas con pictogramas: reparto de palabras,
   trabajo en paralelo (Web Workers) y dibujo en PDF.
   Maqueta medida sobre el repertorio cr-01…cr-25b (XeLaTeX, A4 apaisado):
     enunciado con el pictograma «escribir» (11 mm) y texto de 11,96 bp;
     zona de 281 × 177 mm que empieza en (22,68; 60,53) bp; líneas de 0,9 bp;
     números de palabra en negrita de 14,94 bp y de dibujo de 15,94 bp;
     atribución de ARASAAC y código abajo, en gris.
   ===================================================================== */
(function (global) {
  'use strict';
  const B = global.Banco;

  const X0 = 22.677, Y0 = 60.53;               /* esquina de la zona de trabajo (bp) */
  const ALTO_DIGITO = 0.7135;                  /* altura de las cifras en Helvetica Bold (em) */
  const ATRIBUCION = 'Pictogramas: Sergio Palao. Origen: ARASAAC (https://arasaac.org). '
    + 'Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón.';
  const CLAVE_USO = 'banco-trabajo-uso-crucigramas';
  const TAM_RESERVA = 40;

  let datos = null;
  async function preparar() {
    if (!datos) {
      const d = await B.json('datos/crucigramas.json');
      datos = { palabras: d.palabras, conflictos: d.conflictos,
        aspectos: Object.fromEntries(d.palabras.map(x => [x.p, x.a])),
        archivo: Object.fromEntries(d.palabras.map(x => [x.p, x.f])) };
    }
    return datos;
  }

  /* ---------- uso de las palabras (para que vayan rotando) ---------- */
  function leerUso() {
    try { return JSON.parse(localStorage.getItem(CLAVE_USO) || '{}'); } catch (e) { return {}; }
  }
  function guardarUso(uso) {
    try { localStorage.setItem(CLAVE_USO, JSON.stringify(uso)); } catch (e) { /* sin almacenamiento */ }
  }

  /* Reservas de palabras para k crucigramas simultáneos: disjuntas entre sí, con el mismo
     reparto de longitudes que la lista completa y, dentro de cada longitud, las menos usadas. */
  function reservas(k, uso, azar) {
    const todas = datos.palabras.map(x => x.p);
    const cubo = w => Math.min(Math.max(w.length, 4), 9);
    const desempate = new Map(todas.map(w => [w, azar()]));
    const orden = todas.slice().sort((a, b) => (uso[a] || 0) - (uso[b] || 0) || desempate.get(a) - desempate.get(b));
    const tam = {}; for (const w of todas) tam[cubo(w)] = (tam[cubo(w)] || 0) + 1;
    const cupo = {}; for (const c in tam) cupo[c] = Math.max(1, Math.round(tam[c] * TAM_RESERVA / todas.length));
    const res = Array.from({ length: k }, () => []), lleno = Array.from({ length: k }, () => ({}));
    const usadas = new Set();
    for (let j = 0; j < k; j++) {
      for (const w of orden) {
        if (usadas.has(w)) continue;
        const c = cubo(w);
        if ((lleno[j][c] || 0) >= cupo[c]) continue;
        res[j].push(w); lleno[j][c] = (lleno[j][c] || 0) + 1; usadas.add(w);
      }
    }
    return res.map(r => {
      r.sort((a, b) => (uso[a] || 0) - (uso[b] || 0) || desempate.get(a) - desempate.get(b));
      const extra = orden.filter(w => !r.includes(w)).slice(0, 120);
      return { reserva: r, extra };
    });
  }

  /* ---------- trabajadores ---------- */
  function crearTrabajadores(n) {
    const lista = [];
    for (let i = 0; i < n; i++) {
      try { lista.push(new Worker('js/crucigramas-motor.js')); } catch (e) { break; }
    }
    return lista;
  }
  function enTrabajador(w, opciones, alProgreso) {
    return new Promise((resolver, rechazar) => {
      const id = Math.random().toString(36).slice(2);
      w.onmessage = e => {
        if (e.data.id !== id) return;
        if (e.data.progreso) { if (alProgreso) alProgreso(e.data.progreso); return; }
        if (e.data.error) rechazar(new Error(e.data.error)); else resolver(e.data.res);
      };
      w.onerror = e => rechazar(new Error(e.message || 'Error en el generador de crucigramas'));
      w.postMessage({ id, opciones });
    });
  }
  function enPagina(opciones) {
    return new Promise((resolver, rechazar) => setTimeout(() => {
      try { resolver(global.CrucigramaMotor.generarCrucigrama(opciones)); } catch (e) { rechazar(e); }
    }, 20));
  }

  /* Genera n crucigramas nuevos. avisar(hechos, total) informa del avance. */
  async function generarLote(n, azar, avisar) {
    await preparar();
    const uso = leerUso();
    const hilos = Math.max(1, Math.min(n, (global.navigator && navigator.hardwareConcurrency ? navigator.hardwareConcurrency - 1 : 2), 6));
    let trabajadores = crearTrabajadores(hilos);
    const resultados = []; let hechos = 0;
    try {
      while (resultados.length < n) {
        const ola = Math.min(n - resultados.length, Math.max(1, trabajadores.length));
        const reparto = reservas(ola, uso, azar);
        const tareas = reparto.map((r, j) => {
          const opciones = { reserva: r.reserva, extra: r.extra, conflictos: datos.conflictos,
            aspectos: datos.aspectos, semilla: Math.floor(azar() * 4294967296) };
          const p = trabajadores[j] ? enTrabajador(trabajadores[j], opciones) : enPagina(opciones);
          return p.then(res => { hechos++; if (avisar) avisar(hechos, n); return res; });
        });
        const ola_res = await Promise.all(tareas);
        for (const res of ola_res) {
          if (!res) throw new Error('No se pudo construir un crucigrama. Vuelve a intentarlo.');
          const errores = global.CrucigramaMotor.auditar(res, { conflictos: datos.conflictos });
          if (errores.length) throw new Error('Crucigrama defectuoso: ' + errores.join('; '));
          for (const x of res.numeracion) uso[x.w] = (uso[x.w] || 0) + 1;
          resultados.push(res);
        }
      }
    } finally {
      for (const t of trabajadores) t.terminate();
    }
    guardarUso(uso);
    return resultados;
  }

  /* ---------- dibujo ---------- */
  async function imagenes(doc, cache, nombres) {
    for (const nombre of nombres) {
      if (cache.has(nombre)) continue;
      const bytes = await B.bytes('pictos/' + nombre + '.png');
      cache.set(nombre, await doc.embedPng(bytes));
    }
  }

  async function dibujarPagina(doc, f, cache, res, codigo, solucion) {
    await preparar();
    const nombres = ['accion_escribir', ...res.dibujos.map(d => datos.archivo[d.w])];
    await imagenes(doc, cache, nombres);
    const pagina = doc.addPage(B.A4H);
    const lz = B.lienzo(pagina);
    const negro = B.hex('#000000'), gris = B.hex('#7F807F');
    const mm = v => v * B.MM;
    /* enunciado */
    const icono = cache.get('accion_escribir');
    const altoIcono = 31.18;
    lz.imagen(icono, 22.68, 19.85, altoIcono * icono.width / icono.height, altoIcono);
    const enunciado = 'Escribe en el crucigrama el nombre de cada dibujo.';
    lz.texto(enunciado, 65.21, 40.11, 11.96, f.helv, negro);
    if (solucion) lz.texto('(Solución)', 65.21 + f.helv.widthOfTextAtSize(enunciado, 11.96) + 4.44, 40.11, 11.96, f.helvB, negro);
    /* dibujos y sus números */
    for (const d of res.dibujos) {
      lz.imagen(cache.get(datos.archivo[d.w]), X0 + mm(d.xi), Y0 + mm(d.yi), mm(d.wi), mm(d.hi));
      lz.texto(String(d.num), X0 + mm(d.nx), Y0 + mm(d.ny) + ALTO_DIGITO * 15.94, 15.94, f.helvB, negro);
    }
    /* rejilla */
    for (const [x0, y0, x1, y1] of res.lineas) {
      lz.linea(X0 + mm(x0), Y0 + mm(y0), X0 + mm(x1), Y0 + mm(y1), 0.9, negro);
    }
    for (const n of res.numeros) {
      if (n.t === 'h') lz.textoDerecha(String(n.num), X0 + mm(n.x), Y0 + mm(n.y) + ALTO_DIGITO / 2 * 14.94, 14.94, f.helvB, negro);
      else lz.textoCentro(String(n.num), X0 + mm(n.x), Y0 + mm(n.y), 14.94, f.helvB, negro);
    }
    /* solución en letra ligada (Abecedario), centrada en la casilla:
       el tramo de la cola de la q al asta de la l ocupa el 87 % de la casilla */
    if (solucion) {
      const tam = 0.8734 * mm(res.s) / 1.011;
      for (const l of res.letras) {
        lz.textoCentro(l.l, X0 + mm(l.x), Y0 + mm(l.y) + 0.1645 * tam, tam, f.abc, negro);
      }
    }
    /* pie */
    lz.texto(ATRIBUCION, 22.68, 581.11, 4.98, f.helv, gris);
    lz.textoDerecha(codigo, 819.21, 581.11, 7.97, f.helv, gris);
  }

  B.crucigramas = {
    preparar, generarLote,
    formatoCodigo() { return n => 'cr-' + n; },
    dibujarFicha(doc, f, cache, res, codigo) { return dibujarPagina(doc, f, cache, res, codigo, false); },
    dibujarSolucion(doc, f, cache, res, codigo) { return dibujarPagina(doc, f, cache, res, codigo, true); },
    _interno: { reservas }
  };
})(typeof self !== 'undefined' ? self : this);
