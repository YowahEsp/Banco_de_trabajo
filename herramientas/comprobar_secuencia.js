/* Comprueba la secuencia de las sopas de letras sin navegador:
     node herramientas/comprobar_secuencia.js
   · cada tema sale una vez en cada bloque y nunca dos veces seguidas (tampoco al dar la vuelta);
   · en las 96 000 posiciones, ningún tema repite el mismo juego de palabras (normal y ampliada);
   · ninguna sopa lleva dos palabras que se contengan (PIE / PIERNA);
   · cuántas palabras comparten dos apariciones seguidas del mismo tema. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const raiz = path.join(__dirname, '..');
const ctx = { self: {}, console, crypto: require('crypto').webcrypto };
ctx.self = ctx; vm.createContext(ctx);
ctx.PDFLib = { LineCapStyle: {} };
for (const f of ['comun.js', 'sopas.js']) vm.runInContext(fs.readFileSync(path.join(raiz, 'js', f), 'utf8'), ctx);
const S = ctx.Banco.sopas;
const temas = JSON.parse(fs.readFileSync(path.join(raiz, 'datos', 'sopas.json'), 'utf8'));
const T = temas.length, total = T * S.VUELTAS;
let fallos = 0;
const mal = m => { fallos++; if (fallos < 20) console.log('  ✗ ' + m); };

for (const formato of ['normal', 'ampliada']) {
  const k = 4 * S.FORMATOS[formato].porDir;
  const juegos = new Map(temas.map(t => [t.t, new Set()]));
  const previo = new Map(); let comunes = 0, maxComunes = 0, pares = 0, anterior = null;
  for (let n = 0; n < total; n++) {
    const s = S.puesto(temas, n, formato);
    if (s.p.length !== k) mal(`${formato} ${n}: ${s.p.length} palabras`);
    if (s.t === anterior) mal(`${formato} ${n}: «${s.t}» dos veces seguidas`);
    anterior = s.t;
    const clave = s.p.map(w => w.toUpperCase()).sort().join(',');
    if (juegos.get(s.t).has(clave)) mal(`${formato} ${n}: «${s.t}» repite palabras`);
    juegos.get(s.t).add(clave);
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) if (S.seContienen(s.p[i], s.p[j])) mal(`${n}: ${s.p[i]}/${s.p[j]}`);
    if (previo.has(s.t)) {
      const a = new Set(previo.get(s.t)); const c = s.p.filter(w => a.has(w)).length;
      comunes += c; pares++; maxComunes = Math.max(maxComunes, c);
    }
    previo.set(s.t, s.p);
  }
  /* la vuelta: del último puesto al primero */
  if (S.puesto(temas, total - 1, formato).t === S.puesto(temas, 0, formato).t) mal('mismo tema al dar la vuelta');
  for (const [t, set] of juegos) if (set.size !== S.VUELTAS) mal(`${formato}: «${t}» sale ${set.size} veces`);
  console.log(`${formato}: ${total} sopas, ${k} palabras; palabras repetidas entre dos apariciones seguidas de un tema: media ${(comunes / pares).toFixed(1)}, máximo ${maxComunes}`);
}
console.log(fallos ? `${fallos} fallos` : 'Todo correcto: ningún tema repite juego de palabras en ' + total + ' sopas seguidas.');
process.exit(fallos ? 1 : 0);
