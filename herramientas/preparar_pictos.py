"""Descarga y prepara los pictogramas de los crucigramas y escribe datos/crucigramas.json.

Uso:  python3 preparar_pictos.py [--cache carpeta_de_descargas]

- Descarga cada pictograma de ARASAAC en blanco y negro (500 px); lo ya descargado no se repite.
- Recorta el margen, lo aplana sobre blanco puro (los semitransparentes dejaban un rectángulo
  gris al imprimir), lo reduce a 400 px de lado mayor (≈ 32 mm a 300 ppp) y lo guarda en gris.
- datos/crucigramas.json: palabras, archivo, proporción ancho/alto y grupos en conflicto.
"""
import json, os, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image
from lista_crucigramas import PALABRAS, CONFLICTOS, RETOQUES, PICTO_ENUNCIADO, nombre

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'https://api.arasaac.org/v1/pictograms/{}?color=false&resolution=500'
LADO = 400


def descargar(ident, destino):
    for _ in range(4):
        if os.path.exists(destino) and os.path.getsize(destino) > 1000:
            return True
        subprocess.run(['curl', '-sS', '-m', '45', '-o', destino, URL.format(ident)])
        time.sleep(1)
    return os.path.exists(destino) and os.path.getsize(destino) > 1000


def preparar(origen, destino, retoque=None):
    im = Image.open(origen).convert('RGBA')
    if retoque:
        (x0, y0, x1, y1), sin_suelo = retoque
        a = np.array(im)
        if sin_suelo:                                   # filas casi llenas = línea del suelo
            lleno = (a[:, :, 3] > 20).sum(1) > 0.6 * a.shape[1]
            a[lleno, :, 3] = 0
        im = Image.fromarray(a).crop((x0, y0, x1, y1))
    caja = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    im = im.crop(caja); w, h = im.size; m = int(0.02 * max(w, h))
    lienzo = Image.new('RGBA', (w + 2*m, h + 2*m), (255, 255, 255, 255))
    lienzo.alpha_composite(im, (m, m))
    g = lienzo.convert('L')
    if max(g.size) > LADO:
        f = LADO / max(g.size)
        g = g.resize((max(1, round(g.size[0]*f)), max(1, round(g.size[1]*f))), Image.LANCZOS)
    a = np.array(g); a[a > 225] = 255
    a = (np.round(a / 17) * 17).astype(np.uint8)        # 16 niveles de gris: archivo más ligero
    Image.fromarray(a).save(destino, optimize=True)
    return round(lienzo.size[0] / lienzo.size[1], 4)


if __name__ == '__main__':
    cache = sys.argv[sys.argv.index('--cache') + 1] if '--cache' in sys.argv else os.path.join(RAIZ, '.cache_arasaac')
    final = os.path.join(RAIZ, 'pictos')
    os.makedirs(cache, exist_ok=True); os.makedirs(final, exist_ok=True)
    tareas = list(PALABRAS.items()) + [('accion_escribir', PICTO_ENUNCIADO)]
    with ThreadPoolExecutor(6) as ex:
        ok = list(ex.map(lambda t: descargar(t[1], os.path.join(cache, f'{t[1]}.png')), tareas))
    faltan = [t for t, o in zip(tareas, ok) if not o]
    if faltan:
        sys.exit(f'No se pudieron descargar: {faltan}. Vuelve a ejecutar el script.')
    palabras = []
    for w, i in tareas:
        asp = preparar(os.path.join(cache, f'{i}.png'), os.path.join(final, f'{nombre(w)}.png'), RETOQUES.get(w))
        if w != 'accion_escribir':
            palabras.append({'p': w, 'f': nombre(w), 'a': asp, 'id': i})
    conflictos = [sorted(c & set(PALABRAS)) for c in CONFLICTOS]
    conflictos = [c for c in conflictos if len(c) > 1]
    datos = {'nota': 'Pictogramas: Sergio Palao. Origen: ARASAAC (https://arasaac.org). '
                     'Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón.',
             'palabras': palabras, 'conflictos': conflictos}
    with open(os.path.join(RAIZ, 'datos', 'crucigramas.json'), 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{len(palabras)} pictogramas listos en {final}; {len(conflictos)} grupos en conflicto')
