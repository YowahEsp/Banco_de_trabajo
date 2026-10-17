"""Verificación independiente de un lote del banco de trabajo, leyendo solo los PDF.
Uso: python3 verificar.py fichas.pdf [crucigramas.pdf] solucionario.pdf
"""
import sys, re, collections, itertools, json, unicodedata
import pdfplumber, pymupdf as fitz

def color(c):
    v = c.get('non_stroking_color')
    if not v: return 'K'
    v = tuple(round(x, 2) for x in v) if isinstance(v, (list, tuple)) else (v,)
    m = {(0.12, 0.16, 0.23): 'K', (0.15, 0.39, 0.92): 'B', (0.02, 0.59, 0.41): 'G', (0.86, 0.15, 0.15): 'R', (0.58, 0.64, 0.72): 'L'}
    return m.get(v, str(v))

def leer_ops(page):
    """Devuelve código y lista de operaciones {op, nums, res, llevadas} de una hoja de operaciones."""
    txt = page.extract_text()
    cod = re.search(r'HOJA (\d{4}-[BRM])', txt).group(1)
    celdas = collections.defaultdict(list)
    for c in page.chars:
        if c['size'] < 9 and color(c) != 'R': continue
        if c['top'] < 30: continue
        i = int((c['x0'] - 14) // 114.25); j = int((c['top'] + 3 - 36.1) // 159.5)
        celdas[(j, i)].append(c)
    ops = []
    for k in sorted(celdas):
        cs = celdas[k]
        filas = collections.defaultdict(list)
        for c in cs:
            if color(c) == 'R' and c['size'] < 12: continue
            filas[(round(c['top'] / 3), color(c) == 'G')].append(c)
        nums, res, op = [], None, None
        for (y, g) in sorted(filas):
            t = ''.join(c['text'] for c in sorted(filas[(y, g)], key=lambda c: c['x0']))
            t = t.replace(' ', '')
            if t and t[0] in '+−':
                op = t[0]; t = t[1:]
            if not t: continue
            if g: res = t
            else: nums.append(t)
        rojos = [c for c in cs if color(c) == 'R']
        ops.append({'op': op, 'nums': nums, 'res': res, 'rojos': rojos})
    return cod, ops

def comprobar_ops(fichas_pdf, sol_pdf):
    F = pdfplumber.open(fichas_pdf); S = pdfplumber.open(sol_pdf)
    fichas = {}
    for p in F.pages:
        t = p.extract_text() or ''
        if 'Resuelve las siguientes operaciones' in t:
            cod, ops = leer_ops(p); fichas[cod] = ops
    errores = 0; n = 0
    for p in S.pages:
        t = p.extract_text() or ''
        if 'Solucionario' not in t: continue
        cod, ops = leer_ops(p)
        if cod not in fichas: print('solucionario sin ficha', cod); errores += 1; continue
        fo = fichas[cod]
        if len(ops) != 25 or len(fo) != 25: print(cod, 'no hay 25 operaciones', len(ops), len(fo)); errores += 1
        for a, b in zip(fo, ops):
            n += 1
            if a['op'] != b['op'] or a['nums'] != b['nums']: print(cod, 'enunciado distinto del solucionario', a['nums'], b['nums']); errores += 1; continue
            nums = list(map(int, b['nums']))
            if b['op'] == '+':
                total = sum(nums)
                if b['res'] != str(total): print(cod, 'suma mal', nums, b['res']); errores += 1
                # llevadas esperadas
                esp = []; c = 0
                for i in range(4):
                    s = sum(x // 10**i % 10 for x in nums) + c; c = s // 10
                    if c and i + 1 < 4: esp.append(str(c))
                got = [ch['text'] for ch in sorted(b['rojos'], key=lambda ch: -ch['x0'])]
                if got != esp: print(cod, 'llevadas', nums, got, esp); errores += 1
            else:
                a_, b_ = nums
                if a_ <= b_: print(cod, 'resta con minuendo menor', nums); errores += 1
                if b['res'] != str(a_ - b_).zfill(4): print(cod, 'resta mal', nums, b['res']); errores += 1
                pres = 0; c = 0
                for i in range(4):
                    da = a_ // 10**i % 10; db = b_ // 10**i % 10 + c
                    if da < db: pres += 1; c = 1
                    else: c = 0
                if len(b['rojos']) != 2 * pres: print(cod, 'marcas de resta', nums, len(b['rojos']), 2 * pres); errores += 1
            if not all(len(x) == 4 for x in b['nums']): print(cod, 'número que no es de 4 cifras', b['nums']); errores += 1
    print(f'operaciones: {len(fichas)} hojas, {n} operaciones comprobadas, errores: {errores}')
    return errores

N8 = [(0,1),(1,0),(1,1),(-1,1),(0,-1),(-1,0),(-1,-1),(1,-1)]
MALAS = ['PUTA','PUTO','CACA','PEDO','CULO','MIERDA','POLLA','COÑO','PENE','TETA','NAZI','MEAR','PIS','CAGAR','JODE','FOLLA','CABRON','MARICON','ZORRA','TONTO','IDIOTA','GUARRA','PICHA','CHOCHO','PAJA','MAMON','MAMADA','CIPOTE','VERGA','OSTIA','CARAJO','COJON']
def norm(w):
    s = w.upper().replace('Ñ', '\x01'); s = unicodedata.normalize('NFD', s)
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn').replace('\x01', 'Ñ')
def buscar(g, w):
    res = set()
    for r in range(15):
        for c in range(15):
            for dr, dc in N8:
                er, ec = r + dr*(len(w)-1), c + dc*(len(w)-1)
                if 0 <= er < 15 and 0 <= ec < 15 and all(g[r+dr*i][c+dc*i] == w[i] for i in range(len(w))):
                    res.add(tuple(sorted([(r, c), (er, ec)])) + ((dr, dc),))
    return res
def leer_rejilla(page, x0, y0, celda, tam):
    g = [[''] * 15 for _ in range(15)]
    for c in page.chars:
        if abs(c['size'] - tam) > 0.3: continue
        cx = (c['x0'] + c['x1']) / 2; cy = (c['top'] + c['bottom']) / 2
        k = int((cx - x0) // celda); r = int((cy - y0) // celda)
        if 0 <= k < 15 and 0 <= r < 15: g[r][k] += c['text']
    return [''.join(f) for f in g], g
def comprobar_sopas(fichas_pdf, sol_pdf):
    F = pdfplumber.open(fichas_pdf); S = pdfplumber.open(sol_pdf)
    errores = 0; sopas = {}
    for p in F.pages:
        t = p.extract_text() or ''
        if 'SOPA DE LETRAS' not in t: continue
        cod = re.search(r'(\d{4}-S)', t).group(1)
        filas, g = leer_rejilla(p, 85.04, 200.24, 28.3465, 17.43)
        if any(len(x) != 1 for f in g for x in f): print(cod, 'rejilla incompleta'); errores += 1; continue
        palabras = [s['text'] for s in p.extract_words(extra_attrs=['size']) if 12 < s['size'] < 14]
        lista = []
        for w in p.extract_words(extra_attrs=['size'], keep_blank_chars=False):
            if 10 < w['size'] < 14 and w['top'] > 650: lista.append(w['text'])
        if len(lista) != 16: print(cod, 'la lista no tiene 16 palabras', lista); errores += 1
        cuenta = collections.Counter()
        for w in lista:
            ap = buscar(filas, norm(w))
            # un palíndromo (OSO, ANA…) se lee desde los dos extremos: es una sola aparición
            porExtremos = {}
            for x in ap: porExtremos.setdefault(x[:2], x)
            ap = set(porExtremos.values())
            if len(ap) != 1: print(cod, w, 'aparece', len(ap), 'veces'); errores += 1; continue
            (a, b, d), = [(x[0], x[1], x[2]) for x in ap]
            ds = {(0,1):'E',(1,0):'S',(1,1):'SE',(-1,1):'NE',(0,-1):'E',(-1,0):'S',(-1,-1):'SE',(1,-1):'NE'}[d]
            cuenta[ds] += 1
        if min(cuenta.values(), default=0) < 3 or len(cuenta) < 4: print(cod, 'direcciones', dict(cuenta)); errores += 1
        for m in MALAS:
            if any(m in norm(w) or m in norm(w)[::-1] for w in lista): continue
            if buscar(filas, m): print(cod, 'malsonante', m); errores += 1
        sopas[cod] = (filas, lista, dict(cuenta))
    # soluciones: 4 por página; código y rejilla deben coincidir
    vistas = 0
    for p in S.pages:
        t = p.extract_text() or ''
        if not t.startswith('Soluciones'): continue
        for x, yb in [(42.52, 118.06), (317.68, 118.06), (42.52, 395.67), (317.68, 395.67)]:
            cods = [w for w in p.extract_words() if abs(w['x0'] - x) < 1 and abs(w['bottom'] - yb) < 4 and re.fullmatch(r'\d{4}-S', w['text'])]
            if not cods: continue
            cod = cods[0]['text']
            filas, g = leer_rejilla(p, x + 2.74, yb + 9.6, 5.4 * 72 / 25.4, 9.96)
            if cod not in sopas or filas != sopas[cod][0]: print(cod, 'la solución no coincide con la ficha'); errores += 1
            vistas += 1
    print(f'sopas: {len(sopas)} fichas, {vistas} soluciones, direcciones {[v[2] for v in sopas.values()]}, errores: {errores}')
    if vistas != len(sopas): print('faltan soluciones de sopas'); errores += 1
    return errores

def comprobar_crucigramas(cr_pdf, sol_pdf):
    """Ficha y solución: mismas líneas, mismos dibujos y números; letras solo en la solución;
    las letras de la solución, leídas por tramos de casillas, forman palabras completas."""
    C = fitz.open(cr_pdf); S = fitz.open(sol_pdf)
    sol = {}
    for p in S:
        t = p.get_text()
        m = re.search(r'(cr-\d{4})', t)
        if m and '(Solución)' in t: sol[m.group(1)] = p
    errores = 0
    for p in C:
        t = p.get_text(); cod = re.search(r'(cr-\d{4})', t).group(1)
        if cod not in sol: print(cod, 'sin solución'); errores += 1; continue
        q = sol[cod]
        lin = lambda pg: sorted((round(d['rect'].x0, 1), round(d['rect'].y0, 1), round(d['rect'].x1, 1), round(d['rect'].y1, 1)) for d in pg.get_drawings())
        if lin(p) != lin(q): print(cod, 'rejilla distinta en la solución'); errores += 1
        img = lambda pg: sorted(tuple(round(v, 1) for v in i['bbox']) for i in pg.get_image_info())
        if img(p) != img(q): print(cod, 'dibujos distintos en la solución'); errores += 1
        nums = lambda pg: sorted((s['text'], round(s['origin'][0], 1), round(s['origin'][1], 1)) for b in pg.get_text('dict')['blocks'] for l in b.get('lines', []) for s in l['spans'] if s['text'].strip().isdigit())
        if nums(p) != nums(q): print(cod, 'números distintos'); errores += 1
        if any(s['font'].endswith('Abecedario') for b in p.get_text('dict')['blocks'] for l in b.get('lines', []) for s in l['spans']): print(cod, 'la ficha lleva letras'); errores += 1
        if len(p.get_image_info()) != 19: print(cod, 'no hay 18 dibujos + icono', len(p.get_image_info())); errores += 1
        # casillas a partir de las líneas: cada letra debe caer en una casilla
        letras = [(c['c'], (c['bbox'][0] + c['bbox'][2]) / 2, c['origin'][1]) for b in q.get_text('rawdict')['blocks'] for l in b.get('lines', []) for s in l['spans'] if 'Abecedario' in s['font'] for c in s['chars'] if c['c'].strip()]
        ds = [d['rect'] for d in q.get_drawings()]
        hs = sorted({round(r.y0, 1) for r in ds if r.height < 1}); vs = sorted({round(r.x0, 1) for r in ds if r.width < 1})
        paso = min(b - a for a, b in zip(vs, vs[1:]) if b - a > 5)
        celdas = {}
        for ch, x, y in letras:
            k = round((x - vs[0]) / paso - 0.5); r = round((y - hs[0]) / paso - 0.5)
            celdas[(r, k)] = ch
        tramos = []
        for (r, k) in celdas:
            for dr, dk in [(0, 1), (1, 0)]:
                if (r - dr, k - dk) in celdas: continue
                w = ''; rr, kk = r, k
                while (rr, kk) in celdas: w += celdas[(rr, kk)]; rr += dr; kk += dk
                if len(w) > 1: tramos.append(w)
        if len(tramos) != 18: print(cod, 'tramos', len(tramos), tramos); errores += 1
        mm = paso / (72 / 25.4)
        print(f'  {cod}: casilla {mm:.2f} mm, palabras: {" ".join(sorted(tramos))}')
    print(f'crucigramas: {len(C)} páginas, errores: {errores}')
    return errores

if __name__ == '__main__':
    args = sys.argv[1:]
    fichas, sol = args[0], args[-1]
    e = comprobar_ops(fichas, sol) + comprobar_sopas(fichas, sol)
    if len(args) == 3: e += comprobar_crucigramas(args[1], sol)
    print('TOTAL DE ERRORES:', e)
