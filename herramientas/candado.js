/* Candado del Banco de trabajo.
   La web es pública, así que el programa del generador y sus listas de palabras se publican
   cifrados en datos/banco.cifrado (AES-GCM de 256 bits; clave sacada de la contraseña con
   PBKDF2-SHA-256 y 600 000 vueltas, como en SUPER MATH CODE). La contraseña no se guarda en
   ningún archivo: sin ella, la página no puede generar fichas.

   Uso (desde la carpeta del repositorio, con Node 18 o más):
     node herramientas/candado.js abrir    descifra y deja los archivos en su sitio (js/, datos/…)
     node herramientas/candado.js cerrar   vuelve a cifrar esos archivos en datos/banco.cifrado
   Los archivos descifrados están en .gitignore: nunca se suben. Después de «cerrar», haz commit
   de datos/banco.cifrado. */
const fs = require('fs'), path = require('path'), { webcrypto } = require('crypto');
const subtle = webcrypto.subtle, getRandomValues = a => webcrypto.getRandomValues(a);
const RAIZ = path.join(__dirname, '..'), PAQUETE = path.join(RAIZ, 'datos', 'banco.cifrado');
const ITER = 600000;
const PRIVADOS = [
  'js/comun.js', 'js/operaciones.js', 'js/sopas.js', 'js/crucigramas-motor.js', 'js/crucigramas.js',
  'js/documento.js', 'js/banco.js',
  'datos/sopas.json', 'datos/crucigramas.json',
  'herramientas/temas_sopas.py', 'herramientas/lista_crucigramas.py'
];

function pedir(texto) {
  if (process.env.BANCO_CLAVE) return Promise.resolve(process.env.BANCO_CLAVE);
  return new Promise(resolver => {
    process.stdout.write(texto);
    const entrada = process.stdin; let clave = '';
    entrada.setRawMode && entrada.setRawMode(true); entrada.resume(); entrada.setEncoding('utf8');
    const tecla = ch => {
      if (ch === '\r' || ch === '\n' || ch === '\u0004') {
        entrada.setRawMode && entrada.setRawMode(false); entrada.pause(); entrada.removeListener('data', tecla);
        process.stdout.write('\n'); resolver(clave);
      } else if (ch === '\u0003') { process.stdout.write('\n'); process.exit(1); }
      else if (ch === '\u007f' || ch === '\b') clave = clave.slice(0, -1);
      else clave += ch;
    };
    entrada.on('data', tecla);
  });
}
async function clave(pw, sal, uso) {
  const base = await subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', salt: sal, iterations: ITER, hash: 'SHA-256' }, base,
    { name: 'AES-GCM', length: 256 }, false, [uso]);
}
const b64 = u => Buffer.from(u).toString('base64'), deB64 = s => new Uint8Array(Buffer.from(s, 'base64'));

async function cerrar() {
  const faltan = PRIVADOS.filter(f => !fs.existsSync(path.join(RAIZ, f)));
  if (faltan.length) { console.error('Faltan archivos (¿has hecho «abrir»?): ' + faltan.join(', ')); process.exit(1); }
  const pw = await pedir('Contraseña: ');
  if (!process.env.BANCO_CLAVE && pw !== await pedir('Repítela: ')) { console.error('No coinciden.'); process.exit(1); }
  if (pw.length < 4) { console.error('Contraseña demasiado corta.'); process.exit(1); }
  const archivos = Object.fromEntries(PRIVADOS.map(f => [f, b64(fs.readFileSync(path.join(RAIZ, f)))]));
  const sal = getRandomValues(new Uint8Array(16)), iv = getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, await clave(pw, sal, 'encrypt'),
    new TextEncoder().encode(JSON.stringify(archivos)));
  fs.writeFileSync(PAQUETE, JSON.stringify({ v: 1, iter: ITER, salt: b64(sal), iv: b64(iv), ct: b64(new Uint8Array(ct)) }));
  console.log(`Cifrados ${PRIVADOS.length} archivos en datos/banco.cifrado (${(fs.statSync(PAQUETE).size / 1024).toFixed(0)} KB).`);
}
async function abrir() {
  const p = JSON.parse(fs.readFileSync(PAQUETE, 'utf8'));
  const pw = await pedir('Contraseña: ');
  let datos;
  try {
    datos = await subtle.decrypt({ name: 'AES-GCM', iv: deB64(p.iv) }, await clave(pw, deB64(p.salt), 'decrypt'), deB64(p.ct));
  } catch (e) { console.error('Contraseña incorrecta.'); process.exit(1); }
  const archivos = JSON.parse(new TextDecoder().decode(datos));
  for (const [f, contenido] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(RAIZ, f)), { recursive: true });
    fs.writeFileSync(path.join(RAIZ, f), Buffer.from(contenido, 'base64'));
  }
  console.log(`Descifrados ${Object.keys(archivos).length} archivos. Cuando acabes: node herramientas/candado.js cerrar`);
}
({ abrir, cerrar })[process.argv[2]]?.().catch(e => { console.error(e.message); process.exit(1); })
  ?? console.log('Uso: node herramientas/candado.js abrir | cerrar');
