"""Comprueba en el PDF que el dibujo n.º N es el de la palabra N (por los píxeles del pictograma).
Uso: python3 verificar_dibujos.py crucigramas.pdf solucionario.pdf
"""
import sys, re, json, hashlib, io
import numpy as np, pymupdf as fitz
from PIL import Image
import os
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(f'{RAIZ}/datos/crucigramas.json'))
huella = {}
for x in d['palabras'] + [{'p': '(icono)', 'f': 'accion_escribir'}]:
    a = np.array(Image.open(f"{RAIZ}/pictos/{x['f']}.png").convert('L'))
    huella[hashlib.md5(a.tobytes()).hexdigest()] = x['p']
def palabras_por_numero(q):
    chars = [(c['c'], (c['bbox'][0]+c['bbox'][2])/2, c['origin'][1]) for b in q.get_text('rawdict')['blocks'] for l in b.get('lines', []) for s in l['spans'] if 'Abecedario' in s['font'] for c in s['chars'] if c['c'].strip()]
    ds = [r['rect'] for r in q.get_drawings()]
    hs = sorted({round(r.y0, 1) for r in ds if r.height < 1}); vs = sorted({round(r.x0, 1) for r in ds if r.width < 1})
    paso = min(b - a for a, b in zip(vs, vs[1:]) if b - a > 5)
    celdas = {}
    for ch, x, y in chars: celdas[(round((y - hs[0]) / paso - .5), round((x - vs[0]) / paso - .5))] = ch
    nums = [(s['text'].strip(), (s['bbox'][0]+s['bbox'][2])/2, (s['bbox'][1]+s['bbox'][3])/2, s['size']) for b in q.get_text('dict')['blocks'] for l in b.get('lines', []) for s in l['spans'] if s['text'].strip().isdigit()]
    res = {}
    for (r, k) in celdas:
        for dr, dk in [(0, 1), (1, 0)]:
            if (r - dr, k - dk) in celdas or (r + dr, k + dk) not in celdas: continue
            w = ''; rr, kk = r, k
            while (rr, kk) in celdas: w += celdas[(rr, kk)]; rr += dr; kk += dk
            lr, lk = (r, k - 1) if dk else (r - 1, k)
            cx = vs[0] + (lk + .5) * paso; cy = hs[0] + (lr + .5) * paso
            cand = [n for n in nums if abs(n[3] - 14.94) < .1 and abs(n[1] - cx) < paso / 2 and abs(n[2] - cy) < paso / 2]
            if len(cand) != 1: res[w] = None; continue
            res[int(cand[0][0])] = w
    return res
C = fitz.open(sys.argv[1]); S = fitz.open(sys.argv[2])
sol = {re.search(r'cr-\d{4}', p.get_text()).group(0): p for p in S if '(Solución)' in p.get_text()}
err = 0
for p in C:
    cod = re.search(r'cr-\d{4}', p.get_text()).group(0)
    porNum = palabras_por_numero(sol[cod])
    nums = [(int(s['text']), s['origin']) for b in p.get_text('dict')['blocks'] for l in b.get('lines', []) for s in l['spans'] if s['text'].strip().isdigit() and abs(s['size'] - 15.94) < .1]
    vistos = 0
    for img in p.get_images(full=True):
        xref = img[0]
        pix = fitz.Pixmap(C, xref)
        a = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, 0]
        w = huella.get(hashlib.md5(a.tobytes()).hexdigest(), '?')
        if w == '(icono)': continue
        for rect in p.get_image_rects(xref):
            # número encima (mismo x, línea base 2,8 bp sobre el dibujo) o a la izquierda (misma altura)
            cand = [n for n, (ox, oy) in nums if (abs(ox - rect.x0) < .3 and abs(oy - (rect.y0 - 14.17 + 11.37)) < .3)
                    or (ox < rect.x0 and rect.x0 - ox < 25 and abs(oy - (rect.y0 + 11.37)) < .3)]
            if len(cand) != 1: print(cod, w, 'números candidatos', cand); err += 1; continue
            n = cand[0]
            ok = porNum.get(n) == w
            vistos += 1
            if not ok: print(cod, 'dibujo', n, 'es', w, 'pero la palabra', n, 'es', porNum.get(n)); err += 1
    print(cod, 'dibujos comprobados:', vistos, '· palabras numeradas:', len([k for k in porNum if isinstance(k, int)]))
print('errores:', err)
