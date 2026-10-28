/* Comprueba la secuencia de las sopas de letras sin navegador:
     node herramientas/comprobar_secuencia.js
   1. Por tema y tamaño: grupos de palabras, combinaciones posibles (M) y años hasta agotarlas.
   2. 300 000 puestos seguidos desde hoy y 100 000 dentro de 10 años, en los dos tamaños:
      número de palabras, ninguna pareja que se contenga, ningún tema dos veces seguidas y
      ningún tema con el mismo juego de palabras.
   3. Un curso entero simulado con tres ordenadores (horas distintas, lotes de 1 a 30 fichas,
      a veces varios lotes en el mismo minuto): ninguna sopa repetida. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const raiz = path.join(__dirname, '..');
const ctx = { console, crypto: require('crypto').webcrypto, PDFLib: { LineCapStyle: {} }, BigInt };
ctx.self = ctx; vm.createContext(ctx);
for (const f of ['comun.js', 'sopas.js']) vm.runInContext(fs.readFileSync(path.join(raiz, 'js', f), 'utf8'), ctx);
const S = ctx.Banco.sopas;
const temas = JSON.parse(fs.readFileSync(path.join(raiz, 'datos', 'sopas.json'), 'utf8'));
const T = temas.length;
let fallos = 0;
const mal = m => { fallos++; if (fallos < 20) console.log('  ✗ ' + m); };
const clave = s => s.t + '|' + s.p.map(w => w.toUpperCase()).sort().join(',');

/* 1 */
const porAnio = S.POR_MINUTO * 60 * 24 * 365.25 / T;          /* apariciones de un tema al año */
let peor = Infinity, peorTema = '';
for (const tema of temas) for (const k of [16, 24]) {
  const { m, M, A } = S.preparar(tema, k);
  let a = A, b = M; while (b) [a, b] = [b, a % b];
  if (a !== 1n) mal(`${tema.t}: A y M tienen divisores comunes`);
  const anios = Number(M) / porAnio;
  if (anios < peor) { peor = anios; peorTema = `${tema.t} (${k} palabras de ${m} grupos)`; }
}
console.log(`1. El tema con menos combinaciones es ${peorTema}: tardaría ${Math.round(peor).toLocaleString('es')} años en repetir.`);

/* 2 */
const hoy = Math.floor((Date.now() - S.EPOCA) / 60000) * S.POR_MINUTO;
const dentro10 = hoy + Math.round(10 * 365.25 * 24 * 60) * S.POR_MINUTO;
for (const formato of (process.env.RAPIDO ? [] : ['normal', 'ampliada'])) {
  const k = 4 * S.FORMATOS[formato].porDir;
  for (const [desde, cuantos] of [[hoy, 300000], [dentro10, 100000]]) {
    const vistos = new Set(), previo = new Map();
    let anterior = null, comunes = 0, pares = 0;
    for (let n = desde; n < desde + cuantos; n++) {
      const s = S.puesto(temas, n, formato);
      if (s.p.length !== k || new Set(s.p).size !== k) mal(`${formato} ${n}: ${s.p.length} palabras`);
      if (s.t === anterior) mal(`${formato} ${n}: «${s.t}» dos veces seguidas`);
      anterior = s.t;
      const c = clave(s);
      if (vistos.has(c)) mal(`${formato} ${n}: «${s.t}» repite juego de palabras`);
      vistos.add(c);
      for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) if (S.seContienen(s.p[i], s.p[j])) mal(`${n}: ${s.p[i]}/${s.p[j]}`);
      if (previo.has(s.t)) { const a = new Set(previo.get(s.t)); comunes += s.p.filter(w => a.has(w)).length; pares++; }
      previo.set(s.t, s.p);
    }
    console.log(`2. ${formato}: ${cuantos.toLocaleString('es')} sopas seguidas ${desde === hoy ? 'desde hoy' : 'dentro de 10 años'}, sin repetir; palabras en común entre dos apariciones seguidas de un tema: ${(comunes / pares).toFixed(1)} de ${k} de media`);
  }
}

/* 3 */
const azar = ctx.Banco.crearAzar(2026);
const ordenadores = [0, 0, 0];                                  /* último puesto usado en cada uno */
const vistos = new Map(); let sopas = 0, lotes = 0;
const inicio = Date.UTC(2026, 8, 7, 7, 0);
for (let dia = 0; dia < 300; dia++) {
  const veces = Math.floor(azar() * 5);                         /* 0 a 4 lotes al día, en orden */
  const minutos = Array.from({ length: veces }, () => Math.floor(azar() * 14 * 60)).sort((x, y) => x - y);
  for (const minuto of minutos) {                               /* de 7:00 a 21:00 */
    const pc = Math.floor(azar() * 3);
    const desfase = (pc === 2 ? 3 : 0) * 60000;                 /* un ordenador con el reloj 3 min adelantado */
    const ahora = inicio + dia * 86400000 + minuto * 60000 + desfase;
    const repeticiones = azar() < 0.2 ? 3 : 1;                  /* a veces tres lotes seguidos */
    for (let r = 0; r < repeticiones; r++) {
      const fichas = 1 + Math.floor(azar() * 30), formato = azar() < 0.5 ? 'normal' : 'ampliada';
      const reloj = Math.max(0, Math.floor((ahora - S.EPOCA) / 60000)) * S.POR_MINUTO;
      const n = Math.max(reloj, ordenadores[pc]);
      for (let i = 0; i < 2 * fichas; i++) {
        const c = formato + '|' + clave(S.puesto(temas, n + i, formato));
        if (vistos.has(c)) mal(`día ${dia}: sopa repetida (${vistos.get(c)})`);
        vistos.set(c, `día ${dia}, ordenador ${pc + 1}`); sopas++;
      }
      ordenadores[pc] = n + 2 * fichas; lotes++;
    }
  }
}
console.log(`3. Curso simulado: ${lotes} lotes y ${sopas.toLocaleString('es')} sopas en tres ordenadores, ninguna repetida.`);
console.log(fallos ? `${fallos} FALLOS` : 'Todo correcto.');
process.exit(fallos ? 1 : 0);
