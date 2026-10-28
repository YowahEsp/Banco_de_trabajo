/* =====================================================================
   BANCO DE TRABAJO · página
   ===================================================================== */
(function () {
  'use strict';
  const B = window.Banco;
  const MAX = 30;

  const TARJETAS = [
    { id: 'B', titulo: 'Sumas', que: '25 sumas de 2 o 3 filas, de 4 cifras' },
    { id: 'R', titulo: 'Restas', que: '25 restas de 4 cifras' },
    { id: 'M', titulo: 'Sumas y restas', que: '15 restas y 10 sumas mezcladas' },
    { id: 'S', titulo: 'Sopa de letras', que: '16 palabras de un tema cotidiano' },   /* cambia con el tamaño */
    { id: 'C', titulo: 'Crucigrama', que: '18 dibujos para escribir su nombre' }
  ];

  /* ---------- miniaturas (contenido real, a escala) ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  function cuadricula(w, h, paso) {
    let d = '';
    for (let x = paso; x < w; x += paso) d += `M${x} 0V${h}`;
    for (let y = paso; y < h; y += paso) d += `M0 ${y}H${w}`;
    return `<path d="${d}" stroke="#E8ECF1" stroke-width=".5" fill="none"/>`;
  }
  function miniOperaciones(tipo) {
    const ejemplos = {
      B: [['+', 3938, 8386, 4837], ['+', 7973, 1227], ['+', 5643, 7180], ['+', 8487, 6392, 1055], ['+', 7201, 5153], ['+', 2606, 8197], ['+', 5280, 9916], ['+', 7158, 2058, 3311], ['+', 8484, 3016]],
      R: [['−', 7219, 7110], ['−', 8297, 5310], ['−', 1365, 1066], ['−', 8530, 5681], ['−', 4045, 3086], ['−', 9318, 4380], ['−', 8868, 4615], ['−', 2416, 2185], ['−', 9023, 1096]],
      M: [['−', 1365, 1066], ['+', 1475, 9644, 4632], ['+', 8174, 9123], ['−', 7818, 7115], ['+', 9205, 7915, 9318], ['−', 4110, 3180], ['+', 8868, 4977], ['−', 7623, 4550], ['−', 3682, 3501]]
    }[tipo];
    let s = `<svg viewBox="0 0 140 198" xmlns="${NS}" aria-hidden="true">${cuadricula(140, 198, 7)}`;
    s += `<rect x="40" y="7" width="60" height="3" rx="1" fill="#1e293b"/>`;
    ejemplos.forEach((o, i) => {
      const x = 14 + (i % 3) * 42, y = 24 + Math.floor(i / 3) * 60;
      const nums = o.slice(1);
      nums.forEach((n, f) => s += `<text x="${x + 30}" y="${y + 9 + f * 10}" text-anchor="end" font-family="Liberation Sans Banco, Arial" font-weight="700" font-size="8.4" letter-spacing="1.4" fill="#1e293b">${n}</text>`);
      const yu = y + 9 + (nums.length - 1) * 10;
      s += `<text x="${x - 2}" y="${yu}" font-family="Liberation Sans Banco, Arial" font-weight="700" font-size="8.4" fill="#2563eb">${o[0]}</text>`;
      s += `<rect x="${x - 2}" y="${yu + 3}" width="33" height=".9" fill="#1e293b"/>`;
    });
    return s + '</svg>';
  }
  function miniSopa() {
    const filas = ['OSTBCRRENSSAAAG', 'SSETDJMONOAASRA', 'LORADPLOLICAENR', 'BIOTLAELVENTANA', 'ATUJSTIIBMTEODJ',
      'LAPUASCENSORONE', 'CPTUARULTICRCME', 'OTGPESAEREAASME', 'NNENCRSOLLJZPBI', 'HNDMTOTQEOAAAAI',
      'DIDROICAPAREDÑA', 'OIOHMUIIAITLNOA', 'AACRPETNNAYNABS', 'SEOQCENTJARDINO', 'TDMENHEDALRAYRQ'];
    let s = `<svg viewBox="0 0 140 198" xmlns="${NS}" aria-hidden="true">`;
    s += `<rect x="10" y="10" width="34" height="2.6" rx="1" fill="#2A9D8F"/><rect x="10" y="18" width="44" height="6" rx="1.5" fill="#1D3557"/>`;
    s += `<rect x="10" y="28" width="118" height="2" rx="1" fill="#C3CAD5"/><rect x="10" y="32.5" width="80" height="2" rx="1" fill="#C3CAD5"/>`;
    const x0 = 22, y0 = 48, c = 6.4;
    s += `<rect x="${x0}" y="${y0}" width="${15 * c}" height="${15 * c}" rx="1.4" fill="#fff" stroke="#1D3557" stroke-width=".8"/>`;
    filas.forEach((f, r) => [...f].forEach((ch, k) => {
      s += `<text x="${x0 + (k + .5) * c}" y="${y0 + (r + .5) * c + 1.9}" text-anchor="middle" font-family="Liberation Sans Banco, Arial" font-weight="700" font-size="4.6" fill="#1B2332">${ch}</text>`;
    }));
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
      const x = 10 + k * 31, y = 158 + r * 9;
      s += `<rect x="${x}" y="${y}" width="3.4" height="3.4" rx=".5" fill="none" stroke="#617289" stroke-width=".5"/><rect x="${x + 5.5}" y="${y + .6}" width="${12 + ((r * 5 + k * 3) % 9)}" height="2.2" rx="1" fill="#1B2332"/>`;
    }
    return s + '</svg>';
  }
  function miniCrucigrama() {
    const c = 8.4, ox = 52, oy = 22;
    const celdas = [];
    for (let i = 0; i < 6; i++) celdas.push([1, i]);          /* horizontal */
    for (let i = 0; i < 5; i++) celdas.push([4, i + 2]);
    for (let i = 0; i < 7; i++) celdas.push([i, 1]);          /* vertical */
    for (let i = 0; i < 6; i++) celdas.push([i + 1, 4]);
    for (let i = 0; i < 4; i++) celdas.push([i + 3, 7]);
    const vistas = new Set();
    let s = `<svg viewBox="0 0 168 119" xmlns="${NS}" aria-hidden="true">`;
    s += `<rect x="9" y="7" width="8" height="8" rx="1" fill="none" stroke="#1B2332" stroke-width=".6"/><rect x="21" y="9.5" width="70" height="2.6" rx="1" fill="#1B2332"/>`;
    for (const [r, k] of celdas) {
      const key = r + ',' + k; if (vistas.has(key)) continue; vistas.add(key);
      s += `<rect x="${ox + k * c}" y="${oy + r * c}" width="${c}" height="${c}" fill="#fff" stroke="#1B2332" stroke-width=".55"/>`;
    }
    const dibujos = [['gato', 8, 22], ['casa', 8, 62], ['sol', 128, 20], ['pez', 128, 62], ['llave', 20, 92], ['pan', 128, 94]];
    for (const [f, x, y] of dibujos) s += `<image href="pictos/${f}.png" x="${x}" y="${y}" width="24" height="22" preserveAspectRatio="xMidYMid meet"/>`;
    return s + '</svg>';
  }

  /* ---------- tarjetas ---------- */
  /* tamaño de la sopa elegido (se recuerda en este navegador) */
  const CLAVE_TAM = 'banco-trabajo-tam-sopa';
  let tamSopa = 'normal';
  try { if (localStorage.getItem(CLAVE_TAM) === 'ampliada') tamSopa = 'ampliada'; } catch (e) { /* sin almacenamiento */ }
  const boton = document.getElementById('generar');
  const solCasilla = document.getElementById('soluciones');
  const estado = Object.fromEntries(TARJETAS.map(t => [t.id, 0]));
  const bandeja = document.getElementById('bandeja');
  for (const t of TARJETAS) {
    const li = document.createElement('li');
    li.className = 'tipo'; li.dataset.tipo = t.id;
    const mini = t.id === 'S' ? miniSopa() : t.id === 'C' ? miniCrucigrama() : miniOperaciones(t.id);
    li.innerHTML = `
      <div class="monton${t.id === 'C' ? ' horizontal' : ''}" data-n="0">
        <div class="capa"></div><div class="capa"></div><div class="capa"></div><div class="capa"></div>
        <div class="folio">${mini}</div>
      </div>
      <h2 id="t-${t.id}">${t.titulo}</h2>
      <p class="que">${t.que}</p>
      <div class="cantidad" role="group" aria-labelledby="t-${t.id}">
        <button type="button" data-paso="-1" aria-label="Una ficha menos de ${t.titulo.toLowerCase()}">−</button>
        <input type="number" min="0" max="${MAX}" value="0" inputmode="numeric" aria-label="Fichas de ${t.titulo.toLowerCase()}">
        <button type="button" data-paso="1" aria-label="Una ficha más de ${t.titulo.toLowerCase()}">+</button>
      </div>${t.id === 'S' ? `
      <fieldset class="tamano">
        <legend>Tamaño de la sopa</legend>
        <label><input type="radio" name="tam-sopa" value="normal"><b>Normal</b><small>15 × 15</small></label>
        <label><input type="radio" name="tam-sopa" value="ampliada"><b>Ampliada</b><small>18 × 18</small></label>
      </fieldset>` : ''}`;
    bandeja.appendChild(li);
    const input = li.querySelector('input');
    const fijar = v => {
      v = Math.max(0, Math.min(MAX, Math.round(Number(v) || 0)));
      estado[t.id] = v; input.value = v;
      li.querySelector('.monton').dataset.n = String(Math.min(v, 4));
      li.classList.toggle('activo', v > 0);
      li.querySelector('[data-paso="-1"]').disabled = v === 0;
      li.querySelector('[data-paso="1"]').disabled = v === MAX;
      resumir();
    };
    li.querySelectorAll('button').forEach(b => b.addEventListener('click', () => fijar(estado[t.id] + Number(b.dataset.paso))));
    input.addEventListener('change', () => fijar(input.value));
    input.addEventListener('focus', () => input.select());
    fijar(0);
  }

  /* tamaño de la sopa (el navegador recuerda el último elegido) */
  const queSopa = document.querySelector('.tipo[data-tipo="S"] .que');
  const ponerTam = v => {
    tamSopa = v === 'ampliada' ? 'ampliada' : 'normal';
    document.querySelectorAll('input[name="tam-sopa"]').forEach(r => { r.checked = r.value === tamSopa; });
    queSopa.textContent = (tamSopa === 'ampliada' ? '24' : '16') + ' palabras de un tema cotidiano';
    try { localStorage.setItem(CLAVE_TAM, tamSopa); } catch (e) { /* sin almacenamiento */ }
    resumir();
  };
  document.querySelectorAll('input[name="tam-sopa"]').forEach(r => r.addEventListener('change', () => ponerTam(r.value)));
  ponerTam(tamSopa);

  function resumir() {
    const total = Object.values(estado).reduce((a, b) => a + b, 0);
    const res = document.getElementById('resumen');
    if (!total) { res.textContent = 'Aún no has elegido ninguna ficha.'; boton.disabled = true; boton.textContent = 'Generar fichas'; return; }
    const partes = TARJETAS.filter(t => estado[t.id]).map(t => `${estado[t.id]} de ${t.titulo.toLowerCase()}`
      + (t.id === 'S' && tamSopa === 'ampliada' ? ' (ampliada)' : ''));
    const lista = partes.length > 1 ? partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1] : partes[0];
    res.innerHTML = `<b>${total} ${total === 1 ? 'ficha' : 'fichas'}</b> (${total === 1 ? 'un folio' : total + ' folios'}, ${2 * total} hojas): ${lista}.`
      + (estado.C ? ' Los crucigramas tardan unos segundos cada uno.' : '');
    boton.disabled = false;
    boton.textContent = total === 1 ? 'Generar 1 ficha' : `Generar ${total} fichas`;
  }

  /* ---------- generar ---------- */
  const caja = document.getElementById('estado');
  const barra = document.getElementById('barra');
  const texto = document.getElementById('estado-texto');
  const descargas = document.getElementById('descargas');
  const codigos = document.getElementById('codigos');
  let enlaces = [];

  boton.addEventListener('click', async () => {
    const pedido = Object.assign({}, estado, { soluciones: solCasilla.checked, tamSopa });
    boton.disabled = true;
    caja.hidden = false; caja.classList.remove('error');
    descargas.innerHTML = ''; codigos.hidden = true;
    enlaces.forEach(u => URL.revokeObjectURL(u)); enlaces = [];
    const t0 = performance.now();
    try {
      const r = await B.documento.generar(pedido, (t, x) => { texto.textContent = t; barra.style.width = Math.round(x * 100) + '%'; });
      const seg = Math.max(1, Math.round((performance.now() - t0) / 1000));
      texto.textContent = `Hecho en ${seg} s. Descarga los PDF:`;
      for (const a of r.archivos) {
        const url = URL.createObjectURL(new Blob([a.bytes], { type: 'application/pdf' }));
        enlaces.push(url);
        const li = document.createElement('li');
        li.innerHTML = `<a href="${url}" download="${a.nombre}" class="${a.titulo === 'Solucionario' ? 'sol' : ''}">
          <b>${a.titulo}</b><span>${a.paginas} páginas · ${a.nombre}</span></a>`;
        descargas.appendChild(li);
      }
      const nombres = Object.fromEntries(TARJETAS.map(t => [t.id, t.titulo]));
      document.getElementById('tabla-codigos').innerHTML = r.fichas.map((f, i) =>
        `<tr><td>${i + 1}</td><td>${nombres[f.tipo]}</td><td class="cod">${f.codigos[0]}</td><td class="cod">${f.codigos[1]}</td></tr>`).join('');
      codigos.hidden = false;
    } catch (e) {
      caja.classList.add('error');
      texto.textContent = 'No se han podido crear las fichas: ' + (e && e.message ? e.message : e)
        + (location.protocol === 'file:' ? ' Abre la página desde su dirección web: abierta como archivo, el navegador no deja leer los dibujos ni los datos.' : ' Vuelve a pulsar «Generar».');
      barra.style.width = '0';
    } finally {
      boton.disabled = false; resumir();
    }
  });
})();
