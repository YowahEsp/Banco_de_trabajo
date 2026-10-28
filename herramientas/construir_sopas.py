"""Comprueba los temas de las sopas y escribe datos/sopas.json.

Uso:  python3 construir_sopas.py [--sin-diccionario]

Comprobaciones de cada tema:
  · 40 palabras o más, sin repetir, de 3 a 14 letras, solo letras (la Ñ se conserva);
  · ortografía con tilde según el diccionario español de pyspellchecker (las que no figuran se
    listan para revisarlas a mano; no se aceptan si no están en ACEPTADAS);
  · parejas que se contienen (PIE dentro de PIERNA, o al revés): no impiden la palabra, pero el
    generador no las pone juntas en la misma sopa; se comprueba que siempre quedan 24 palabras
    compatibles.
"""
import json, os, sys, unicodedata
from temas_sopas import TEMAS

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIN_PALABRAS, MIN_LETRAS, MAX_LETRAS, MAX_SOPA = 40, 3, 14, 24

# Palabras correctas que no figuran en el diccionario usado (revisadas una a una)
ACEPTADAS = set('''
gominola telediario colutorio yogurtera humidificador purificador depiladora quitamanchas friegasuelos
desatascador abrillantador toallero cortaúñas pintalabios bastoncillo alfombrilla chirimoya lichi breva
cebolleta canónigo guindilla lombarda chistorra sobrasada chicharrones carabinero abadejo pescadilla
escalivada cachopo marmitako fideuá ajoblanco pipirrana flamenquín carajillo kéfir comanda cubierto
leotardos plumífero bermudas batín riñonera coletero pamela pomo moqueta tarima buhardilla cajonera
somier biombo visillo estor puf tumbona banqueta paellera fiambrera manopla pelador termostato
climatizador afeitadora rizador amasadora cabecero edredón nórdico ombligo meñique empeine moflete
ojera patilla escayola jeringuilla pediatra madrastra padrastro ahijado mellizo autoescuela gestoría
herboristería sombrerería mueblería churrería pollería ultramarinos inmobiliaria ambulatorio
conservatorio aparcamiento marquesina alcantarilla adoquín grafiti bordillo badén funicular teleférico
monopatín autocar todoterreno limusina dirigible ferri tapacubos parachoques guantera chasis gasóleo
cobaya hámster lechón guepardo orangután mapache tejón camaleón cochinilla tábano tijereta pulgón
avispero sanguijuela crisálida ciempiés escarcha ventisca nubarrón vendaval anticiclón llovizna
ocre beis subrayador portaminas témpera cartabón chincheta tóner tampón taladradora clasificador
cúter formón plomada mordaza remache arandela sargento pádel taekwondo aeróbic pilates triatlón hípica
petanca ganchillo karaoke parchís origami puzle ducharse vestirse peinarse sonreír agobio timidez
risueño testarudo despistado dehesa olivar estepa archipiélago pentagrama ukelele estribillo zarzuela
hucha bizum titular visado resguardo requisito domicilio notificación albergue parador bronceador
farolillo cabalgata comparsa pregón villancico roscón polvorón mazapán antifaz piñata confeti serpentina
emoticono módem router wifi celador quirófano ecografía gotero vendaje proyector fichaje autónomo
encofrado hormigonera capataz andamio pocilga acequia guadaña centeno vendimia chiringuito colchoneta
espigón socorrista marmota collado montañero acomodador doblaje subtítulos guion tertulia emisora
viñeta hangar turbulencia facturación tripulación dársena transbordo cercanías maquinista minibar bufé
suite peluquera gomina alisado manicura rulo rebozar empanar aliñar trocear gratinar enrollar cruasán
napolitana tiramisú milhojas cuajada gofre tortita dónut sacarina cucharilla páncreas faringe laringe
tiroides húmero rótula fémur neurona astrónomo observatorio nebulosa jilguero vencejo abubilla
estornino petirrojo grulla cotorra anémona boquerón percebe pinsapo madroño acebo alcornoque magnolio
rayuela triciclo sonajero pompas trompo compost deshielo polución dinamo hidrógeno vatio voltio
decámetro hectómetro centilitro decilitro mililitro miligramo octógono cuadrilátero nailon poliéster
mimbre latón caducidad telefonillo derrama felpudo azotea rellano
españa francia italia portugal alemania grecia rumanía marruecos argelia egipto senegal nigeria malí
ghana kenia china japón india pakistán filipinas rusia ucrania polonia bulgaria méxico cuba colombia
venezuela ecuador perú bolivia chile argentina uruguay paraguay brasil honduras guatemala canadá
australia turquía irlanda suecia noruega júpiter saturno urano neptuno mercurio venus marte
aceitunas albóndigas alubias ambientador anorak apartamento apuntes arcoíris astronauta auriculares autobús bacón balonmano bebé bikini bingo bolígrafo bomberos botas bragas bricolaje brócoli
bulevar butano buñuelos béisbol cabina cactus callos calzoncillo camping capó carné cartas castañuelas celos ceras cereales champiñón chanclas charcutería chat churros chándal claxon clip
congelado conservas control correos currículum damas dardos deberes desayunar directo educado entrecot escáner espaguetis especias estrés exprimidor fax fideos floristería fuet furgoneta gachas gafas
galletas garbanzos gastos gel gemelo gemelos grapadora guantes hockey huevos idiomas informático internet jazz jersey judo kiwi koala kárate lavanda lavavajillas legumbres lentejas licuadora macarrones
mantis manualidades maquillaje maquinilla maracas maracuyá maratón marioneta mechas medias menú mesita microondas migas mocasín monedas mopa médula nervios nochevieja normas nuca nécora palomitas
panceta patinaje patines patinete pegamento peluche películas pendientes picadora piragüismo piruleta planos plastilina playeras polideportivo prácticas rebeca reciclaje reportaje retrovisor
reyes rizos robot rock rugby rímel rúcula sacapuntas salami sardinas secadora senderismo series siete silicona suavizante supermercado surf televisor tenazas tienda tijeras tirantes tirita toallita
tobogán torrijas tostadas urgencias uvas uñas vacaciones vaqueros vermú videojuego videojuegos vitrocerámica voleibol váter vídeo xilófono yoga yogur yoyó bodega pesa megafonía
'''.split())


def norm(w):
    s = w.upper().replace('Ñ', '\x01')
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s.replace('\x01', 'Ñ')


def conflicto(a, b):
    na, nb = norm(a), norm(b)
    return na != nb and (na in nb or na[::-1] in nb or nb in na or nb[::-1] in na)


def main():
    usar_dic = '--sin-diccionario' not in sys.argv
    if usar_dic:
        from spellchecker import SpellChecker
        dic = SpellChecker(language='es')
    errores, revisar = [], []
    salida, titulos = [], set()
    for titulo, texto in TEMAS:
        ws = texto.split()
        if titulo in titulos:
            errores.append(f'título repetido: {titulo}')
        titulos.add(titulo)
        if len(ws) < MIN_PALABRAS:
            errores.append(f'{titulo}: solo {len(ws)} palabras')
        vistas = {}
        for w in ws:
            n = norm(w)
            if n in vistas:
                errores.append(f'{titulo}: «{w}» repetida (igual que «{vistas[n]}»)')
            vistas[n] = w
            if not (MIN_LETRAS <= len(n) <= MAX_LETRAS):
                errores.append(f'{titulo}: «{w}» tiene {len(n)} letras')
            if not all(c in 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ' for c in n):
                errores.append(f'{titulo}: «{w}» lleva caracteres no válidos')
            if usar_dic and w.lower() not in dic and w.lower() not in ACEPTADAS:
                revisar.append(f'{titulo}: {w}')
        pares = [(a, b) for i, a in enumerate(ws) for b in ws[i+1:] if conflicto(a, b)]
        # ¿quedan siempre MAX_SOPA palabras compatibles? (cota: quitar una de cada pareja)
        quitadas = set()
        for a, b in pares:
            if a not in quitadas and b not in quitadas:
                quitadas.add(b if len(b) > len(a) else a)
        if len(ws) - len(quitadas) < MAX_SOPA:
            errores.append(f'{titulo}: solo {len(ws) - len(quitadas)} palabras compatibles')
        if pares:
            print(f'  {titulo}: parejas que no irán juntas: ' + ', '.join(f'{a}/{b}' for a, b in pares))
        salida.append({'t': titulo, 'p': ws})
    print(f'{len(salida)} temas · {sum(len(t["p"]) for t in salida)} palabras · '
          f'mínimo por tema {min(len(t["p"]) for t in salida)}')
    if revisar:
        print('NO ESTÁN EN EL DICCIONARIO (revisar):\n  ' + '\n  '.join(revisar))
    if errores:
        sys.exit('ERRORES:\n  ' + '\n  '.join(errores))
    if revisar:
        sys.exit('Hay palabras sin revisar: no se escribe el archivo.')
    with open(os.path.join(RAIZ, 'datos', 'sopas.json'), 'w', encoding='utf-8') as f:
        json.dump(salida, f, ensure_ascii=False, indent=0)
    print('datos/sopas.json escrito')


if __name__ == '__main__':
    main()
