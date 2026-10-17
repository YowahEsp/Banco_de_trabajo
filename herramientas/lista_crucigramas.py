"""Lista cerrada de 600 palabras para los crucigramas del banco de trabajo.

Cada palabra lleva el identificador de su pictograma de ARASAAC. Las 149 primeras se revisaron
en el Proyecto de fichas de alfabetización (octubre de 2026); las demás se revisaron a la vista,
una a una, en hojas de contacto en blanco y negro (17 de octubre de 2026).

Criterio de inclusión: un adulto que no ve la palabra diría esa palabra al ver el dibujo.
Se descartaron los pictogramas con texto, con fondo negro (luna, planeta, astronauta), con flechas que señalan una parte, los escenarios
y lugares genéricos, los que se confunden con otra palabra y los muy pequeños o grises.

Para cambiar una palabra: revisar su pictograma en blanco y negro
(https://api.arasaac.org/v1/pictograms/<ID>?color=false&resolution=500) y volver a ejecutar
preparar_pictos.py.
"""

PALABRAS = {
    # Casa, cocina y aseo (121)
    'abrelatas': 17338, 'alfombra': 2249, 'armario': 2258, 'aspiradora': 3227, 'auriculares': 5915,
    'balanza': 36883, 'balcón': 8254, 'bandeja': 2656, 'batidora': 2274, 'bañera': 2272,
    'bolsa': 27616, 'bombona': 8048, 'botella': 2288, 'buzón': 2292, 'báscula': 31284,
    'cable': 6948, 'cafetera': 2297, 'cajón': 24921, 'calculadora': 5419, 'calendario': 3071,
    'cama': 2304, 'casa': 2317, 'cazo': 3230, 'cesta': 3012, 'champú': 2699, 'chimenea': 2333,
    'cocina': 2341, 'cojín': 3264, 'colador': 2345, 'columpio': 4608, 'copa': 2356, 'cortina': 8344,
    'crema': 35637, 'cuadro': 2360, 'cubo': 2725, 'cuchara': 2362, 'cucharón': 2320,
    'cuchillo': 3237, 'cuenco': 24005, 'cuna': 5980, 'cámara': 2680, 'cómoda': 16281,
    'delantal': 2366, 'despertador': 5560, 'ducha': 2370, 'embudo': 2741, 'enchufe': 2373,
    'escoba': 2745, 'escritorio': 26071, 'espejo': 8573, 'espátula': 7094, 'estantería': 2386,
    'estufa': 2389, 'exprimidor': 3270, 'fregadero': 2399, 'fregona': 3324, 'grifo': 3339,
    'hamaca': 4764, 'horno': 2426, 'impresora': 2970, 'interruptor': 2431, 'jabón': 25171,
    'jarra': 2435, 'jarrón': 28541, 'lata': 6544, 'lavabo': 2441, 'lavadora': 2442,
    'lavavajillas': 2444, 'linterna': 6138, 'llave': 8153, 'lámpara': 4936, 'mantel': 2460,
    'mechero': 4692, 'mesa': 3129, 'mesilla': 3295, 'microondas': 2473, 'móvil': 25269,
    'nevera': 4876, 'olla': 9086, 'ordenador': 7190, 'papelera': 2498, 'pañuelo': 33046,
    'peine': 2852, 'percha': 2846, 'perchero': 3242, 'perfume': 2710, 'persiana': 2518,
    'pila': 8320, 'plancha': 2528, 'plato': 2532, 'puerta': 3244, 'radiador': 3288,
    'rallador': 9089, 'recogedor': 2818, 'reloj': 2549, 'rodillo': 2809, 'sacacorchos': 2552,
    'salero': 2554, 'sartén': 2558, 'secador': 2560, 'silla': 3155, 'sillón': 2570, 'sofá': 25479,
    'sombrilla': 4746, 'taburete': 3291, 'tapa': 37940, 'taza': 2582, 'teclado': 2793,
    'televisor': 25498, 'teléfono': 2791, 'tendedero': 6228, 'tenedor': 2588, 'tetera': 7276,
    'timbre': 2592, 'toalla': 2593, 'tostadora': 2598, 'valla': 6651, 'vaso': 2610, 'ventana': 2611,
    'ventilador': 2612, 'váter': 2430,
    # Comida y bebida (79)
    'sushi': 38993, 'aceite': 2246, 'aceituna': 8316, 'agua': 2248, 'aguacate': 8009, 'ajo': 2641,
    'alcachofa': 5370, 'arroz': 6911, 'berenjena': 2660, 'bocadillo': 2281, 'brócoli': 23853,
    'cacahuete': 8338, 'café': 32512, 'calabaza': 2679, 'calamar': 5418, 'caramelo': 2686,
    'carne': 2316, 'cebolla': 2323, 'cereales': 2328, 'cereza': 8303, 'cerveza': 2330,
    'champiñón': 10220, 'chocolate': 2334, 'chorizo': 2335, 'churros': 3262, 'coco': 10224,
    'coliflor': 23953, 'cruasán': 2358, 'dónut': 2368, 'ensalada': 2377, 'espaguetis': 2383,
    'flan': 3317, 'fresa': 2400, 'gamba': 8350, 'gofre': 34227, 'granada': 8594,
    'hamburguesa': 2419, 'helado': 2420, 'jamón': 2433, 'kiwi': 2955, 'langosta': 2947,
    'leche': 2445, 'lechuga': 2446, 'limón': 3022, 'macarrones': 2455, 'magdalena': 8623,
    'manzana': 2462, 'maíz': 36287, 'mejillón': 2918, 'miel': 2911, 'naranja': 2483, 'nuez': 2880,
    'paella': 5532, 'palomitas': 5534, 'pan': 2494, 'pavo': 2509, 'pepino': 2847, 'pera': 2561,
    'pescado': 2519, 'pimiento': 2838, 'piruleta': 2832, 'pizza': 2527, 'piña': 2525,
    'plátano': 2530, 'pollo': 4952, 'pulpo': 3379, 'queso': 2541, 'salchicha': 6647, 'seta': 8328,
    'sopa': 2573, 'sándwich': 3383, 'tarta': 2579, 'tomate': 2594, 'tortilla': 4966, 'uvas': 3247,
    'vino': 2614, 'yogur': 2618, 'zanahoria': 2619, 'zumo': 11461,
    # Ropa y complementos (43)
    'abrigo': 2242, 'anillo': 2252, 'babero': 2267, 'bañador': 2270, 'bikini': 2279, 'boina': 38441,
    'bolso': 2284, 'bota': 8299, 'botón': 2668, 'bufanda': 2290, 'calcetín': 8339, 'camisa': 2308,
    'camiseta': 2309, 'cartera': 2689, 'chaleco': 2698, 'chancla': 8343, 'chándal': 2332,
    'cinturón': 2336, 'collar': 2347, 'corbata': 2716, 'cremallera': 2723, 'falda': 2391,
    'gafas': 3329, 'gorra': 2411, 'gorro': 2412, 'guante': 8353, 'jersey': 2436, 'medias': 2466,
    'pantalón': 2565, 'paraguas': 2500, 'pendientes': 2515, 'pijama': 2522, 'pulsera': 2537,
    'sandalia': 8368, 'sombrero': 2572, 'sudadera': 8701, 'sujetador': 2576, 'tirantes': 16901,
    'traje': 39694, 'vaqueros': 24222, 'vestido': 2613, 'zapatilla': 8332, 'zapato': 32923,
    # Cuerpo y personas (13)
    'boca': 2663, 'cara': 2684, 'cerebro': 2696, 'corazón': 4613, 'dedo': 3298, 'esqueleto': 5727,
    'hueso': 2972, 'lengua': 2944, 'mano': 2928, 'nariz': 2887, 'ojo': 6573, 'oreja': 2871,
    'pie': 2841,
    # Animales (76)
    'escorpión': 8564, 'abeja': 24823, 'araña': 2254, 'ardilla': 2257, 'avestruz': 2650, 'ballena': 2268,
    'burro': 2291, 'búho': 2671, 'caballo': 2294, 'cabra': 2295, 'camello': 8522, 'cangrejo': 2312,
    'canguro': 2313, 'caracol': 8061, 'castor': 7055, 'cebra': 2324, 'cerdo': 2327, 'ciervo': 3263,
    'cigüeña': 3015, 'cisne': 2337, 'cocodrilo': 2343, 'conejo': 2351, 'cucaracha': 4617,
    'delfín': 2732, 'dinosaurio': 2738, 'elefante': 2372, 'erizo': 26829, 'flamenco': 3316,
    'foca': 2397, 'gallina': 2403, 'gallo': 2404, 'gato': 2406, 'gaviota': 3334, 'gorila': 2410,
    'gusano': 3344, 'hipopótamo': 2424, 'hormiga': 2425, 'hámster': 3346, 'jabalí': 2965,
    'jirafa': 2437, 'koala': 2954, 'lagartija': 2950, 'leopardo': 2942, 'león': 2449, 'lobo': 5892,
    'loro': 2934, 'mariposa': 2465, 'mariquita': 2924, 'medusa': 2920, 'mono': 2477, 'mosca': 2478,
    'mosquito': 2479, 'murciélago': 2903, 'oruga': 16727, 'oso': 2488, 'oveja': 2489,
    'paloma': 25293, 'panda': 2869, 'pato': 2563, 'perro': 2517, 'pez': 2520, 'pingüino': 3243,
    'pájaro': 2490, 'rana': 2543, 'rata': 2821, 'ratón': 2546, 'rinoceronte': 2550,
    'saltamontes': 2805, 'serpiente': 2568, 'tiburón': 2589, 'tigre': 2590, 'toro': 2595,
    'tortuga': 2596, 'vaca': 2609, 'zorro': 2623, 'águila': 2638,
    # Naturaleza y tiempo (34)
    'bellota': 8041, 'bosque': 2666, 'cactus': 3070, 'cascada': 5951, 'cometa': 2350,
    'concha': 34625, 'cueva': 2729, 'estrella': 4644, 'flor': 3102, 'fuego': 4654, 'girasol': 11274,
    'hierba': 3113, 'hoja': 5076, 'isla': 2966, 'lluvia': 3123, 'margarita': 3127,
    'montaña': 2909, 'nido': 7173, 'nieve': 3135, 'nube': 2883, 'ola': 4706, 'palmera': 3138,
    'piedra': 6594, 'pino': 3216, 'playa': 2826, 'rosa': 3151, 'río': 2811,
    'sol': 2798, 'trigo': 7285, 'tronco': 7819, 'tulipán': 3163, 'viento': 7259, 'volcán': 6247,
    'árbol': 3057,
    # Transporte, calle y lugares (41)
    'remolque': 25385, 'ambulancia': 2251, 'autobús': 26654, 'avión': 2264, 'barco': 2273, 'bicicleta': 2277,
    'bote': 3322, 'camión': 6956, 'canoa': 8526, 'caravana': 38741, 'carretera': 2302,
    'casco': 2691, 'castillo': 5421, 'coche': 6981, 'cohete': 2344, 'edificio': 35655,
    'excavadora': 2390, 'faro': 4646, 'farola': 2393, 'fuente': 3273, 'furgoneta': 3275,
    'grúa': 3341, 'helicóptero': 2421, 'lancha': 3277, 'metro': 2472, 'molino': 13086,
    'monopatín': 2507, 'moto': 2480, 'paracaídas': 27949, 'parada': 2499, 'patines': 2506,
    'patinete': 2508, 'rascacielos': 6199, 'rueda': 5566, 'semáforo': 2567, 'submarino': 3157,
    'tractor': 2600, 'tranvía': 2602, 'tren': 7282, 'velero': 8714, 'volante': 6245,
    # Oficios y personas (48)
    'abuela': 2243, 'abuelo': 2244, 'albañil': 2642, 'bailarina': 2653,
    'barrendero': 2993, 'bebé': 6060, 'bombero': 2664, 'buzo': 2999, 'camarero': 2681,
    'cantante': 4585, 'carnicero': 3008, 'carpintero': 2687, 'cartero': 2690, 'científico': 8076,
    'cocinero': 6985, 'dentista': 2733, 'electricista': 2740, 'farmacéutico': 11261,
    'florista': 3318, 'fontanero': 3321, 'fotógrafo': 11267, 'futbolista': 3199, 'granjero': 3338,
    'jardinero': 11288, 'juez': 11291, 'leñador': 2943, 'limpiadora': 3238, 'maestro': 28002,
    'mago': 2932, 'marinero': 5507, 'mecánico': 2921, 'médico': 2467, 'músico': 2890, 'niña': 2484,
    'niño': 2485, 'panadero': 3358, 'pastor': 7788, 'payaso': 2854, 'peluquera': 11333,
    'pescador': 3366, 'piloto': 3370, 'pintor': 11341, 'policía': 5547, 'princesa': 5554,
    'reina': 5559, 'rey': 5563, 'socorrista': 3156, 'veterinario': 11392,
    # Objetos y herramientas (95)
    'abanico': 6871, 'aguja': 2639, 'antifaz': 5904, 'anzuelo': 5906, 'archivador': 10255,
    'bandera': 5918, 'barril': 6934, 'bastón': 5922, 'biberón': 4577, 'bolígrafo': 2282,
    'bombilla': 2285, 'botijo': 6940, 'brocha': 2670, 'cadena': 8051, 'caja': 5935, 'camilla': 5937,
    'campana': 5938, 'candado': 6957, 'carpeta': 3233, 'carretilla': 5947, 'carrito': 5948,
    'caña': 5941, 'ceras': 4951, 'cerradura': 3261, 'chincheta': 8304, 'chupete': 4599,
    'clavo': 8306, 'clip': 10309, 'cochecito': 6281, 'cofre': 5966, 'compás': 9146,
    'confeti': 24990, 'consola': 2354, 'corona': 25016, 'cuaderno': 2359, 'cuerda': 7006,
    'dedal': 3303, 'diamante': 6475, 'dron': 39123, 'escalera': 2743, 'globo': 8313,
    'grapadora': 2413, 'guitarra': 2417, 'hacha': 6519, 'hilo': 2978, 'imán': 8138, 'jarabe': 2962,
    'jeringa': 2960, 'libro': 2450, 'lupa': 9927, 'lápiz': 2440, 'maleta': 2931, 'manguera': 2929,
    'mapa': 5505, 'martillo': 2922, 'mascarilla': 9169, 'microscopio': 8168, 'mochila': 2475,
    'muleta': 8361, 'máscara': 5944, 'ovillo': 11008, 'pala': 2867, 'pegamento': 2510,
    'pelota': 3241, 'pendrive': 9800, 'periódico': 2845, 'pincel': 2523, 'pizarra': 2526,
    'portátil': 7214, 'prismáticos': 8198, 'radio': 11354, 'rastrillo': 6200, 'red': 2548,
    'regadera': 2817, 'regalo': 25381, 'regla': 2815, 'robot': 6208, 'roscón': 5565,
    'sacapuntas': 2553, 'serrucho': 2799, 'silbato': 6182, 'sobre': 10325, 'sonajero': 7254,
    'taladro': 3392, 'tambor': 2578, 'telescopio': 15477, 'termómetro': 2789, 'tijeras': 2591,
    'tirita': 8331, 'tornillo': 2788, 'tuerca': 2785, 'turrón': 2784, 'varita': 6240, 'vela': 6242,
    'venda': 6243,
    # Ocio, música y deporte (50)
    'acordeón': 5895, 'ajedrez': 3054, 'aletas': 3055, 'arpa': 8493, 'baloncesto': 10166,
    'balón': 2269, 'baraja': 3181, 'barbacoa': 5393, 'batería': 5923, 'bolos': 2283,
    'canasta': 3260, 'carrusel': 4757, 'castañuelas': 2318, 'comba': 3265, 'cronómetro': 26018,
    'dado': 2731, 'dardos': 3090, 'dominó': 3095, 'esquís': 3098, 'estadio': 5993, 'flauta': 2396,
    'fútbol': 7137, 'hoguera': 4664, 'maracas': 2463, 'medalla': 3128, 'micrófono': 2912,
    'natación': 25038, 'noria': 4704, 'pandereta': 2564, 'peluche': 4945, 'peonza': 8663,
    'pesas': 6176, 'piano': 2521, 'piscina': 3142, 'portero': 9015, 'portería': 2535,
    'raqueta': 2544, 'saxofón': 2559, 'tenis': 10158, 'tienda': 35695, 'tobogán': 4759,
    'trineo': 8710, 'triángulo': 2604, 'trofeo': 3162, 'trompeta': 2607, 'violonchelo': 4771,
    'violín': 2615, 'xilófono': 2616, 'yoyó': 8734, 'árbitro': 4564,
}

# Palabras que no pueden ir en el mismo crucigrama: dibujos parecidos, o palabras que se
# confunden entre sí al ver el dibujo.
CONFLICTOS = [
    # Casa
    {'sofá', 'sillón'}, {'mesa', 'escritorio', 'mesilla'}, {'armario', 'cómoda', 'estantería', 'cajón'},
    {'silla', 'taburete'}, {'cama', 'cuna'}, {'reloj', 'despertador', 'cronómetro'},
    {'teléfono', 'móvil'}, {'ordenador', 'portátil', 'televisor', 'teclado', 'consola'},
    {'horno', 'cocina', 'microondas'}, {'olla', 'cazo', 'sartén', 'tapa'}, {'vaso', 'copa', 'jarra', 'taza'},
    {'cuchara', 'cucharón', 'espátula'}, {'bolsa', 'cesta', 'bolso', 'mochila'}, {'lavabo', 'fregadero', 'bañera', 'grifo'},
    {'botella', 'agua', 'aceite', 'vino', 'jarabe'}, {'cerveza', 'jarra'}, {'zumo', 'leche', 'batido'},
    {'perfume', 'champú', 'crema', 'jabón'}, {'paraguas', 'sombrilla'}, {'estufa', 'radiador', 'chimenea'},
    {'bombilla', 'lámpara', 'farola', 'linterna'}, {'enchufe', 'cable', 'interruptor', 'timbre'},
    {'escoba', 'cubo', 'fregona', 'recogedor'}, {'lavadora', 'lavavajillas'}, {'cuadro', 'espejo'},
    {'cuenco', 'plato', 'bandeja'}, {'balanza', 'báscula'}, {'mechero', 'fuego'}, {'pila', 'linterna'},
    {'peine', 'secador'}, {'percha', 'perchero'}, {'jarrón', 'flor', 'rosa', 'tulipán', 'margarita'},
    {'pañuelo', 'bufanda'}, {'tostadora', 'pan'}, {'cafetera', 'café', 'tetera'},
    # Comida
    {'pan', 'bocadillo', 'sándwich', 'hamburguesa', 'tostada', 'panadero'}, {'salchicha', 'chorizo'},
    {'tarta', 'magdalena', 'cruasán', 'dónut', 'roscón', 'flan'}, {'gamba', 'langosta'}, {'calamar', 'pulpo'},
    {'pez', 'pescado', 'tiburón', 'delfín', 'ballena'}, {'mejillón', 'concha'},
    {'pimiento', 'pepino', 'berenjena', 'calabaza'}, {'champiñón', 'seta'}, {'brócoli', 'coliflor', 'lechuga', 'ensalada'},
    {'cereza', 'fresa', 'uvas', 'granada'}, {'naranja', 'limón'}, {'manzana', 'granada'},
    {'nuez', 'cacahuete', 'bellota'}, {'chocolate', 'turrón'}, {'caramelo', 'piruleta'}, {'miel', 'abeja'},
    {'cereales', 'leche'}, {'carne', 'jamón'}, {'pavo', 'pollo', 'gallo', 'gallina'}, {'aguacate', 'kiwi', 'coco'},
    {'aceituna', 'uvas'}, {'helado', 'yogur'}, {'queso', 'tarta'}, {'arroz', 'paella'},
    {'macarrones', 'espaguetis'}, {'lata', 'bote'}, {'tomate', 'manzana'}, {'cebolla', 'ajo'},
    {'zanahoria', 'maíz'}, {'pizza', 'tarta'}, {'palomitas', 'maíz'},
    # Ropa
    {'camisa', 'camiseta', 'sudadera', 'jersey'}, {'abrigo', 'chaleco', 'traje'}, {'pantalón', 'vaqueros', 'chándal'},
    {'bañador', 'bikini'}, {'zapato', 'zapatilla', 'bota', 'sandalia', 'chancla'},
    {'gorra', 'gorro', 'boina', 'sombrero', 'casco'}, {'pulsera', 'collar', 'anillo', 'pendientes', 'diamante'},
    {'calcetín', 'medias', 'pie'}, {'mano', 'dedo', 'guante'}, {'falda', 'vestido'}, {'cartera', 'bolso'},
    {'corbata', 'traje'}, {'pijama', 'camiseta'}, {'babero', 'bebé'},
    # Cuerpo y personas
    {'cara', 'ojo', 'boca', 'nariz', 'oreja', 'lengua'}, {'hueso', 'esqueleto'}, {'bebé', 'niño', 'niña'},
    {'abuelo', 'abuela'}, {'rey', 'reina', 'princesa', 'corona'},
    # Animales
    {'tigre', 'león', 'leopardo'}, {'lobo', 'zorro', 'perro'}, {'rana', 'lagartija', 'cocodrilo'},
    {'hipopótamo', 'rinoceronte', 'elefante'}, {'cebra', 'caballo', 'burro'}, {'camello', 'jirafa'},
    {'mono', 'gorila'}, {'koala', 'oso', 'panda', 'peluche'}, {'pingüino', 'pato', 'cisne'}, {'foca', 'delfín'},
    {'pájaro', 'paloma', 'gaviota', 'loro'}, {'águila', 'búho'}, {'cigüeña', 'flamenco', 'avestruz'},
    {'gallina', 'gallo', 'pájaro', 'pato'}, {'vaca', 'toro'}, {'oveja', 'cabra'}, {'cerdo', 'jabalí'},
    {'ratón', 'rata', 'hámster', 'conejo'}, {'hormiga', 'araña', 'mosca', 'mosquito', 'cucaracha'},
    {'saltamontes', 'mariquita'}, {'gusano', 'oruga', 'serpiente', 'caracol'}, {'ciervo', 'caballo'},
    {'murciélago', 'pájaro'}, {'canguro', 'conejo'}, {'mariposa', 'abeja'}, {'tortuga', 'caracol'},
    {'dinosaurio', 'cocodrilo'},
    # Naturaleza
    {'sol', 'estrella', 'luna', 'planeta'}, {'nube', 'lluvia', 'nieve', 'viento'},
    {'río', 'cascada', 'ola', 'playa', 'isla'}, {'montaña', 'volcán', 'cueva'},
    {'bosque', 'árbol', 'pino', 'palmera', 'tronco'}, {'hoja', 'flor', 'rosa', 'tulipán', 'margarita', 'girasol'},
    {'hierba', 'cactus'}, {'cometa', 'globo'}, {'nido', 'pájaro'}, {'trigo', 'pan'}, {'fuego', 'hoguera', 'barbacoa'},
    {'piedra', 'diamante'}, {'concha', 'caracola', 'caracol'},
    # Transporte y lugares
    {'coche', 'furgoneta', 'ambulancia', 'camión', 'caravana'}, {'tren', 'metro', 'tranvía'},
    {'avión', 'helicóptero', 'cohete', 'dron', 'paracaídas'}, {'barco', 'velero', 'canoa', 'lancha', 'submarino'},
    {'bicicleta', 'moto', 'patinete', 'monopatín', 'patines'}, {'tractor', 'excavadora', 'grúa'},
    {'semáforo', 'farola', 'policía'}, {'edificio', 'rascacielos', 'casa'}, {'castillo', 'faro', 'molino'},
    {'parada', 'autobús'}, {'rueda', 'volante'}, {'fuente', 'grifo'}, {'carretera', 'coche'},
    {'tienda', 'edificio'}, {'remolque', 'caravana', 'camión'}, {'escorpión', 'araña'},
    # Oficios
    {'médico', 'dentista', 'veterinario', 'farmacéutico'}, {'cocinero', 'panadero', 'camarero'},
    {'mecánico', 'carpintero', 'albañil', 'pintor', 'fontanero', 'electricista'},
    {'granjero', 'pastor', 'pescador'}, {'piloto', 'astronauta', 'avión', 'cohete'}, {'cantante', 'músico', 'micrófono'},
    {'bailarina', 'payaso', 'mago'}, {'carnicero', 'carne'}, {'barrendero', 'jardinero', 'limpiadora', 'escoba'},
    {'fotógrafo', 'cámara'}, {'científico', 'microscopio'}, {'florista', 'flor'}, {'socorrista', 'bañador'},
    {'marinero', 'buzo', 'leñador', 'bombero', 'cartero', 'policía'}, {'futbolista', 'balón', 'portero', 'fútbol', 'árbitro', 'portería'},
    {'juez', 'policía'}, {'peluquera', 'peine', 'tijeras'}, {'maestro', 'pizarra', 'libro'}, {'cartero', 'buzón', 'sobre'},
    {'pescador', 'caña', 'anzuelo', 'red'}, {'buzo', 'aletas'},
    # Objetos y herramientas
    {'hacha', 'pala', 'rastrillo', 'martillo'}, {'regadera', 'manguera'}, {'carretilla', 'carrito', 'cochecito', 'carro'},
    {'clavo', 'tornillo', 'tuerca', 'taladro', 'martillo'}, {'pegamento', 'grapadora', 'clip', 'chincheta'},
    {'goma', 'sacapuntas', 'lápiz', 'bolígrafo', 'pincel', 'ceras', 'rodillo', 'brocha'},
    {'regla', 'compás'}, {'cuaderno', 'libro', 'carpeta', 'periódico', 'sobre', 'archivador', 'calendario'},
    {'mapa', 'bandera'}, {'lupa', 'prismáticos', 'telescopio', 'microscopio', 'gafas'},
    {'cuerda', 'cadena', 'hilo', 'ovillo', 'aguja', 'dedal'}, {'bastón', 'muleta', 'escoba'},
    {'jeringa', 'termómetro', 'tirita', 'venda', 'mascarilla', 'camilla', 'jarabe'}, {'pizarra', 'tiza'},
    {'cerradura', 'llave', 'candado'}, {'red', 'portería', 'canasta'}, {'varita', 'corona', 'mago'},
    {'cofre', 'caja', 'barril', 'regalo'}, {'botijo', 'botella', 'jarra', 'bote'}, {'chupete', 'biberón', 'sonajero', 'bebé'},
    {'balón', 'pelota', 'globo'}, {'raqueta', 'tenis'}, {'esquís', 'trineo'}, {'peonza', 'yoyó'},
    {'dado', 'dominó', 'ajedrez', 'baraja'}, {'piano', 'acordeón', 'xilófono', 'teclado'},
    {'violín', 'violonchelo', 'guitarra', 'arpa'}, {'trompeta', 'saxofón', 'flauta'},
    {'batería', 'tambor', 'pandereta'}, {'maracas', 'castañuelas'}, {'piscina', 'natación'},
    {'tobogán', 'columpio', 'noria', 'carrusel'}, {'baloncesto', 'canasta', 'balón'},
    {'medalla', 'trofeo', 'copa'}, {'estadio', 'portería', 'fútbol'}, {'confeti', 'globo'},
    {'antifaz', 'máscara', 'mascarilla'}, {'campana', 'timbre'}, {'robot', 'dron'}, {'pendrive', 'cable'},
    {'pesas', 'martillo'}, {'cartera', 'monedero'}, {'regalo', 'caja'}, {'bolos', 'pelota'},
    {'natación', 'bañador', 'piscina'}, {'silbato', 'árbitro'}, {'tijeras', 'cuchillo'}, {'hoguera', 'fuego'},
]

# Retoques de pictogramas: (recorte x0, y0, x1, y1 sobre el PNG de 500 px, quitar línea del suelo)
RETOQUES = {
    'policía': ((0, 0, 347, 500), True),     # el 5547 lleva un semáforo a la derecha
}

PICTO_ENUNCIADO = 2380                         # accion_escribir (mano escribiendo)


def nombre(palabra):
    """Nombre de archivo sin tildes ni ñ."""
    return palabra.translate(str.maketrans('áéíóúüñ', 'aeiouun'))
