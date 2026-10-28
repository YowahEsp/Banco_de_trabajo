/* Elige, para cada tema de datos/sopas.json, qué baraja usa cada vuelta de la secuencia
   (campo «v») de modo que ningún tema repita juego de palabras. Lo llama construir_sopas.py;
   también se puede usar solo:   node herramientas/construir_secuencia.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const raiz = path.join(__dirname, '..'), archivo = path.join(raiz, 'datos', 'sopas.json');
const ctx = { console, crypto: require('crypto').webcrypto, PDFLib: { LineCapStyle: {} } };
ctx.self = ctx; vm.createContext(ctx);
for (const f of ['comun.js', 'sopas.js']) vm.runInContext(fs.readFileSync(path.join(raiz, 'js', f), 'utf8'), ctx);
const S = ctx.Banco.sopas;
const temas = JSON.parse(fs.readFileSync(archivo, 'utf8'));
const t0 = Date.now();
for (const tema of temas) { delete tema.v; tema.v = S.elegirVueltas(tema); }
fs.writeFileSync(archivo, '[\n' + temas.map(t => JSON.stringify(t)).join(',\n') + '\n]\n');
console.log(`secuencia elegida para ${temas.length} temas en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
