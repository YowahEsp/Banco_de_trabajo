/* =====================================================================
   BANCO DE TRABAJO · montaje de los PDF de un lote
   Un lote son N fichas de cada tipo; cada ficha es un folio a doble cara
   con dos hojas distintas del mismo tipo (cara A y cara B), cada una con su
   código. Salen hasta tres PDF: fichas en vertical (operaciones y sopas),
   crucigramas (en horizontal, para imprimir aparte) y solucionario.
   ===================================================================== */
(function (global) {
  'use strict';
  const B = global.Banco;
  const { PDFDocument, StandardFonts } = PDFLib;

  const TIPOS = [
    { id: 'B', nombre: 'Sumas', familia: 'op' },
    { id: 'R', nombre: 'Restas', familia: 'op' },
    { id: 'M', nombre: 'Mixta: sumas y restas', familia: 'op' },
    { id: 'S', nombre: 'Sopa de letras', familia: 'sopa' },
    { id: 'C', nombre: 'Crucigrama', familia: 'cruci' }
  ];
  const CLAVE_SOPAS = 'banco-trabajo-uso-sopas';

  async function nuevoDoc(titulo, fuentes) {
    const doc = await PDFDocument.create();
    doc.registerFontkit(global.fontkit);
    doc.setTitle(titulo); doc.setAuthor('Banco de trabajo'); doc.setCreator('Banco de trabajo · EPA');
    doc.setLanguage('es-ES');
    const f = { helv: await doc.embedFont(StandardFonts.Helvetica), helvB: await doc.embedFont(StandardFonts.HelveticaBold) };
    if (fuentes.includes('lib')) f.lib = await doc.embedFont(await B.bytes('fuentes/LiberationSans-Bold.ttf'), { subset: true });
    if (fuentes.includes('abc')) f.abc = await doc.embedFont(await B.bytes('fuentes/Abecedario.ttf'), { subset: true });
    return { doc, f, cache: new Map() };
  }

  /* Temas de sopas: no se repiten en el lote hasta agotar los 50 y, entre lotes,
     van primero los que menos han salido en este navegador. */
  function elegirTemas(temas, n, azar) {
    let uso = {};
    try { uso = JSON.parse(localStorage.getItem(CLAVE_SOPAS) || '{}'); } catch (e) { uso = {}; }
    const elegidos = [];
    while (elegidos.length < n) {
      const desempate = new Map(temas.map(t => [t.t, azar()]));
      const orden = temas.slice().sort((a, b) => (uso[a.t] || 0) - (uso[b.t] || 0) || desempate.get(a.t) - desempate.get(b.t));
      for (const t of orden.slice(0, Math.min(n - elegidos.length, temas.length))) {
        elegidos.push(t); uso[t.t] = (uso[t.t] || 0) + 1;
      }
    }
    try { localStorage.setItem(CLAVE_SOPAS, JSON.stringify(uso)); } catch (e) { /* sin almacenamiento */ }
    return elegidos;
  }

  /* pedido: { B: n, R: n, M: n, S: n, C: n, soluciones: bool }
     avisar(texto, fraccion) informa del avance. Devuelve [{ nombre, blob, paginas }]. */
  async function generar(pedido, avisar, semilla) {
    const azar = B.crearAzar(semilla);
    const codigos = B.crearCodigos(azar);
    const aviso = (t, x) => { if (avisar) avisar(t, x); };
    const fichas = [];                 /* { tipo, caras: [{ datos, codigo }, { … }] } */

    /* 1. Contenido */
    for (const t of TIPOS.filter(t => t.familia === 'op')) {
      for (let i = 0; i < (pedido[t.id] || 0); i++) {
        const caras = [0, 1].map(() => ({ datos: B.operaciones.generarHoja(t.id, azar),
          codigo: codigos.nuevo(B.operaciones.formatoCodigo(t.id)) }));
        fichas.push({ tipo: t.id, caras });
      }
    }
    if (pedido.S) {
      aviso('Preparando las sopas de letras…', 0.05);
      const temas = await B.json('datos/sopas.json');
      const elegidos = elegirTemas(temas, 2 * pedido.S, azar);
      for (let i = 0; i < pedido.S; i++) {
        const caras = [];
        for (const tema of elegidos.slice(2 * i, 2 * i + 2)) {
          const sopa = B.sopas.generar(tema, azar);
          const chk = B.sopas.comprobar(sopa);
          if (chk.errores.length) throw new Error('Sopa defectuosa (' + tema.t + '): ' + chk.errores.join('; '));
          caras.push({ datos: sopa, codigo: codigos.nuevo(B.sopas.formatoCodigo()) });
        }
        fichas.push({ tipo: 'S', caras });
        await new Promise(r => setTimeout(r, 0));
      }
    }
    if (pedido.C) {
      aviso('Construyendo los crucigramas…', 0.1);
      const lote = await B.crucigramas.generarLote(2 * pedido.C, azar,
        (hechos, total) => aviso(`Construyendo los crucigramas… ${hechos} de ${total}`, 0.1 + 0.75 * hechos / total));
      for (let i = 0; i < pedido.C; i++) {
        fichas.push({ tipo: 'C', caras: lote.slice(2 * i, 2 * i + 2).map(res => ({ datos: res,
          codigo: codigos.nuevo(B.crucigramas.formatoCodigo()) })) });
      }
    }
    if (!fichas.length) throw new Error('No has pedido ninguna ficha.');

    /* 2. PDF */
    aviso('Montando los PDF…', 0.88);
    const salida = [];
    const verticales = fichas.filter(x => x.tipo !== 'C'), cruces = fichas.filter(x => x.tipo === 'C');
    const fecha = new Date().toISOString().slice(0, 10);
    if (verticales.length) {
      const D = await nuevoDoc('Banco de trabajo · fichas', verticales.some(x => 'BRM'.includes(x.tipo)) ? ['lib'] : []);
      for (const fi of verticales) for (const cara of fi.caras) {
        if (fi.tipo === 'S') B.sopas.dibujarFicha(D.doc, D.f, cara.datos, cara.codigo);
        else B.operaciones.dibujarFicha(D.doc, D.f, cara.datos, cara.codigo);
      }
      salida.push({ nombre: `Banco_fichas_${fecha}.pdf`, titulo: 'Fichas', doc: D.doc });
    }
    if (cruces.length) {
      const D = await nuevoDoc('Banco de trabajo · crucigramas', []);
      for (const fi of cruces) for (const cara of fi.caras) await B.crucigramas.dibujarFicha(D.doc, D.f, D.cache, cara.datos, cara.codigo);
      salida.push({ nombre: `Banco_crucigramas_${fecha}.pdf`, titulo: 'Crucigramas', doc: D.doc });
    }
    if (pedido.soluciones) {
      const fuentes = [];
      if (fichas.some(x => 'BRM'.includes(x.tipo))) fuentes.push('lib');
      if (cruces.length) fuentes.push('abc');
      const D = await nuevoDoc('Banco de trabajo · solucionario', fuentes);
      let sopasPendientes = [];
      const volcarSopas = () => { if (sopasPendientes.length) B.sopas.dibujarSoluciones(D.doc, D.f, sopasPendientes); sopasPendientes = []; };
      for (const fi of verticales.concat(cruces)) {
        if (fi.tipo !== 'S') volcarSopas();
        for (const cara of fi.caras) {
          if (fi.tipo === 'S') sopasPendientes.push({ sopa: cara.datos, codigo: cara.codigo });
          else if (fi.tipo === 'C') await B.crucigramas.dibujarSolucion(D.doc, D.f, D.cache, cara.datos, cara.codigo);
          else B.operaciones.dibujarSolucion(D.doc, D.f, cara.datos, cara.codigo);
        }
      }
      volcarSopas();
      salida.push({ nombre: `Banco_solucionario_${fecha}.pdf`, titulo: 'Solucionario', doc: D.doc });
    }
    for (const s of salida) {
      s.paginas = s.doc.getPageCount();
      s.bytes = await s.doc.save();
      delete s.doc;
    }
    codigos.confirmar();
    aviso('Listo', 1);
    return { archivos: salida, fichas: fichas.map(fi => ({ tipo: fi.tipo, codigos: fi.caras.map(c => c.codigo) })) };
  }

  B.documento = { TIPOS, generar };
})(typeof self !== 'undefined' ? self : this);
