# Banco de trabajo

Generador de fichas para el banco de trabajo del aula (Educación de Personas Adultas). Se elige cuántas fichas se quieren de cada tipo y salen los PDF listos para imprimir, con su solucionario.

**Web:** https://yowahesp.github.io/Banco_de_trabajo/

| Tipo | Qué lleva cada hoja | Código |
|---|---|---|
| Sumas | 25 sumas de 2 o 3 filas, de 4 cifras | `4821-B` |
| Restas | 25 restas de 4 cifras | `0573-R` |
| Sumas y restas | 15 restas y 10 sumas mezcladas | `9902-M` |
| Sopa de letras | Normal: 16 palabras, 15 × 15. Ampliada: 24 palabras, 18 × 18 | `3310-S` |
| Crucigrama | 18 dibujos para escribir su nombre (A4 apaisado) | `cr-7247` |

- **Cada ficha es un folio a doble cara**: dos hojas distintas del mismo tipo, cada una con su código.
- **Los códigos son al azar** y no se repiten dentro de un lote; el navegador recuerda los últimos usados para no repetirlos entre lotes.
- **Todo sale nuevo cada vez**: operaciones, cuadrículas de las sopas y crucigramas.
- **Las sopas no se repiten, aunque se usen ordenadores distintos**: 80 temas con 40 palabras o más cada uno. Qué sopas salen lo decide la hora: cada minuto tiene sus propias sopas, distintas de las de cualquier otro minuto, y cada navegador recuerda además las que ya ha usado para no repetirlas si se piden varios lotes seguidos. Un tema nunca sale dos veces seguidas, nunca repite el mismo juego de palabras (cada tema tiene miles de millones de combinaciones: harían falta miles de años para agotarlas) y dos palabras que se contienen (PIE y PIERNA) nunca van juntas. Solo podrían coincidir dos ordenadores usados con pocos minutos de diferencia, si uno de ellos tiene mal la hora.
- Se descargan hasta tres PDF: fichas (vertical), crucigramas (apaisado; al imprimir a doble cara, voltear por el borde corto) y solucionario.
- Los PDF se crean en el propio navegador; no se envía nada a ningún servidor.

## De dónde sale cada tipo

Nada está hecho desde cero: cada tipo copia el trabajo ya aprobado. Este repositorio es **independiente** y no cambia ninguno de los otros.

- **Operaciones**: la «hoja amplia» de [Generador_operaciones](https://github.com/yowahesp/Generador_operaciones) (versión `1f7fd27`), que reproduce los cuadernillos. Aquí se dibuja directamente en PDF vectorial (con [pdf-lib](https://pdf-lib.js.org)), así que imprimir y descargar dan lo mismo. Comparada píxel a píxel con los cuadernillos originales.
- **Sopas de letras**: las reglas y la maqueta del cuaderno «Sopas de letras: 50 fichas de vocabulario cotidiano» (octubre de 2026): el mismo número de palabras en cada dirección (→ ↓ ↘ ↗; cuatro en la normal, seis en la ampliada), ninguna al revés, cada palabra aparece una sola vez y el relleno no forma palabras malsonantes. Las cuadrículas son nuevas cada vez.
  - Los 50 temas del cuaderno se han ampliado a 40 palabras o más y se han añadido 31 temas nuevos (80 en total; «Los meses» y «Los días de la semana» se juntan en «El calendario»).
  - Dos palabras que se contienen (PIE y PIERNA, METRO y KILÓMETRO) nunca van en la misma sopa: se agrupan y de cada grupo sale como mucho una.
  - La ampliada usa casillas de 8,5 mm y letra de 14,8 pt; en el solucionario, todas las cuadrículas miden 81 mm.
- **Crucigramas**: el generador de cruzadas con pictogramas del proyecto de [fichas de alfabetización](https://github.com/yowahesp/fichas-alfabetizacion) (`herramientas/crucigramas`), traducido a JavaScript para que funcione en el navegador, con las mismas reglas del formato aprobado (cr-01…cr-25):
  - 18 palabras; ninguna pareja que se confunda en el mismo crucigrama.
  - Cruces solo en letra idéntica y sin tilde; números fuera de la rejilla; ningún hueco cerrado.
  - Casillas lo más grandes posible (en las pruebas, entre 13,5 y 15,5 mm; media de 14,2 mm).
  - Dibujos de 24 a 32 mm junto a su palabra, con 2 mm de aire.
  - Solución en letra ligada.
  - La lista cerrada pasa de 149 a **600 palabras**, cada una con su pictograma revisado a la vista. Las palabras van rotando: primero salen las menos usadas.

## Cambios respecto a los originales

- La solución de los crucigramas usa la letra ligada **Abecedario** (GPL), porque MemimaM no se puede publicar.
- La lista de 600 palabras no sigue la progresión de Palau: son palabras cotidianas sin restricción de lección, como en el repertorio cr-01…cr-25.

## Archivos

```
index.html                  página del generador
js/comun.js                 azar, códigos, utilidades de dibujo
js/operaciones.js           sumas, restas y mixta (hoja amplia)
js/sopas.js                 sopas de letras: generación, comprobación y dibujo
js/crucigramas-motor.js     motor de los crucigramas (también como Web Worker)
js/crucigramas.js           reparto de palabras, trabajo en paralelo y dibujo
js/documento.js             montaje de los PDF de un lote
js/banco.js                 interfaz
js/vendor/                  pdf-lib 1.17.1 y @pdf-lib/fontkit 1.1.1 (MIT)
datos/sopas.json            80 temas de 40 palabras o más y su secuencia (herramientas/construir_sopas.py)
datos/crucigramas.json      600 palabras, proporción de cada dibujo y parejas que se confunden
pictos/                     600 pictogramas de ARASAAC en blanco y negro
fuentes/                    Liberation Sans Bold (OFL) y Abecedario (GPL 2)
herramientas/               lista de palabras, preparación de pictogramas y comprobaciones
```

## Mantenimiento

**Cambiar o añadir palabras de los crucigramas**

1. Edita `herramientas/lista_crucigramas.py`. Antes, revisa el pictograma en blanco y negro: sin texto, sin flechas y que no se confunda con otra palabra.
2. Prepara los pictogramas y el archivo de datos:
   ```bash
   cd herramientas
   python3 preparar_pictos.py
   ```
   Necesita Python 3 con `numpy` y `Pillow`, y `curl`.

**Cambiar o añadir temas y palabras de las sopas**

1. Edita `herramientas/temas_sopas.py`: cada tema necesita 40 palabras o más, de 3 a 14 letras, escritas con sus tildes.
2. Comprueba y crea el archivo de datos:
   ```bash
   cd herramientas
   python3 construir_sopas.py        # necesita pyspellchecker y Node
   node comprobar_secuencia.js       # comprueba la secuencia (tarda unos 4 minutos)
   ```
   `construir_sopas.py` no escribe nada si hay errores o palabras que no están en el diccionario: las correctas se añaden a `ACEPTADAS`. Cambiar las palabras de un tema cambia también qué juegos de palabras salen de ese tema (y podrían volver a salir juegos ya usados con la lista anterior).

**Comprobar un lote descargado**

Necesita `pdfplumber` y `pymupdf`.

```bash
python3 herramientas/verificar_lote.py Banco_fichas.pdf Banco_crucigramas.pdf Banco_solucionario.pdf
python3 herramientas/verificar_dibujos.py Banco_crucigramas.pdf Banco_solucionario.pdf
```

Lo que comprueban:
- **Operaciones**: la aritmética, las llevadas y que el enunciado coincida con el solucionario.
- **Sopas** (los dos tamaños): que cada palabra salga una sola vez, las mismas por dirección, que no haya malsonantes, que no se repita ninguna sopa en el lote, que no se salga nada del margen y que la solución coincida.
- **Crucigramas**: que ficha y solución sean iguales, que haya 18 palabras y que cada dibujo lleve el número de su palabra.

## Licencias de terceros

- **Pictogramas**: Sergio Palao. Origen: ARASAAC (https://arasaac.org). Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón.
- **Liberation Sans**: SIL Open Font License 1.1 (`fuentes/OFL-LiberationSans.txt`).
- **Abecedario**: JJMG, GNU GPL 2 (`fuentes/GPL-2.txt`).
- **pdf-lib y fontkit**: MIT (`js/vendor/`).
