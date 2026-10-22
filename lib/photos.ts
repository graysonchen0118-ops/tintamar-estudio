/** Every photo on the site, with the alt text and the file name it is published under. */
export type Photo = { id: string; alt: string; file: string; kb: number };

const P = (id: string, alt: string, file: string, kb = 2400): Photo => ({ id, alt, file, kb });

export const PHOTOS = {
  // the studio at work
  estudioDosPuestos: P('1769605767701-6e5a680ef685', 'Dos tatuadores trabajando a la vez en el estudio Tintamar bajo el aro de luz', 'estudio-tatuaje-soho-malaga-puestos.jpg', 3120),
  estudioNoche: P('1775135981378-4e7c1767436d', 'Sesión de tatuaje por la tarde en el estudio, con láminas en la pared', 'sesion-tatuaje-estudio-malaga.jpg', 2840),
  manosTrabajando: P('1513078094721-e7b6e0394a6a', 'Tatuador con guantes y mascarilla trabajando un antebrazo', 'tatuador-trabajando-antebrazo.jpg', 2210),
  maquinaMano: P('1542744383-8c330d91f4b1', 'Tatuadora sujetando la máquina antes de empezar la línea', 'maquina-tatuaje-linea.jpg', 1980),
  plantillaMorada: P('1643513456892-437e82e06f4a', 'Plantilla morada transferida a la piel antes de tatuar', 'plantilla-tatuaje-transferida.jpg', 1760),
  plantillaPierna: P('1769605767707-80909ec160cc', 'Plantilla de un diseño grande sobre el muslo, lista para la primera sesión', 'plantilla-diseno-muslo.jpg', 2650),
  laminasPared: P('1769485016772-c5a4234a6be3', 'Diseños dibujados a mano colgados en la pared del estudio', 'disenos-flash-pared-estudio.jpg', 2390),
  dibujandoDiseno: P('1537209383625-19584677a4d3', 'Tatuador dibujando a tinta un diseño en papel', 'dibujo-diseno-tatuaje-papel.jpg', 2050),
  mesaDibujo: P('1649688066826-947419c66e5c', 'Mesa de dibujo con el boceto de un tatuaje y rotuladores', 'boceto-tatuaje-mesa.jpg', 1890),
  dibujoFlores: P('1454191297004-cefa4b1042d8', 'Tatuadora dibujando un diseño floral', 'diseno-floral-dibujo.jpg', 1720),
  maquinaRosa: P('1526893299283-37e82b1e4da5', 'Máquina de bobinas roja sobre fondo rosa', 'maquina-tatuaje-bobinas.jpg', 940),
  tatuadorLuzRoja: P('1616879564267-a336232e3a95', 'Tatuador preparando la máquina con luz roja', 'tatuador-preparando-maquina.jpg', 2120),
  neon: P('1516008684536-605574d804ce', 'Cartel de neón con la palabra tattoo', 'neon-tattoo.jpg', 1210),
  sesionColor: P('1638458957842-d901372fed55', 'Tatuadora trabajando a color sobre una pierna', 'sesion-tatuaje-color.jpg', 2470),
  sesionMedusa: P('1775565892377-16d3bc7135f2', 'Sesión de un tatuaje grande en la pierna', 'sesion-tatuaje-pierna.jpg', 2280),
  recienHecho: P('1707395294378-e48ae9f33748', 'Tatuaje recién terminado sobre papel de protección', 'tatuaje-recien-hecho-cuidados.jpg', 1640),
  corazonDedo: P('1736628495264-2728d5582aa2', 'Corazón pequeño en el dedo, recién tatuado', 'tatuaje-corazon-dedo.jpg', 1310),
  sesionTriangulo: P('1712432321375-226f466fff85', 'Tatuador repasando una línea geométrica en el antebrazo', 'tatuaje-geometrico-antebrazo.jpg', 1880),
  sesionManga: P('1597852075234-fd721ac361d3', 'Sesión de manga con guantes negros', 'sesion-manga-tatuaje.jpg', 2010),
  sesionDetalle: P('1565058379802-bbe93b2f703a', 'Primer plano de la aguja trabajando el brazo', 'detalle-aguja-tatuaje.jpg', 1690),
  sesionNegro: P('1564426622559-5af68da63b96', 'Tatuaje en negro y gris en proceso', 'tatuaje-negro-gris-proceso.jpg', 1730),
  fachada: P('1774249447467-b9bbecffc7a2', 'Fachada de un estudio de tatuaje en una calle peatonal', 'fachada-estudio-tatuaje.jpg', 2560),
  // Málaga
  malagaCalle: P('1549643276-fdf2fab574f5', 'Calle del centro de Málaga con macetas en los balcones', 'calle-centro-malaga.jpg', 2150),
  malagaLarios: P('1612972735944-ed73dd220d21', 'Calle peatonal del centro de Málaga a media mañana', 'calle-peatonal-malaga.jpg', 2330),
  malagaSoho: P('1732279770688-03e57529f333', 'Callejón con grafitis cerca del Soho de Málaga', 'soho-malaga-grafiti.jpg', 1980),
  malagaVista: P('1717256703483-235896055307', 'Vista de Málaga y el mar desde Gibralfaro', 'vista-malaga-mar.jpg', 2410),
  malagaBalcones: P('1738680980147-4d73d8da12bc', 'Calle con árboles y balcones en Málaga', 'calle-balcones-malaga.jpg', 2090),
  // fine line
  peoniaAntebrazo: P('1562962230-16e4623d36e6', 'Peonía en línea fina en el antebrazo', 'peonia-linea-fina-antebrazo.jpg', 1720),
  floresMuslo: P('1596896734952-c4c1cd2efe0f', 'Ramo de flores en línea fina en el muslo', 'flores-linea-fina-muslo.jpg', 1840),
  floresAntebrazo: P('1651692883249-ed36b3523419', 'Flores y frase en línea fina a lo largo del antebrazo', 'flores-frase-linea-fina.jpg', 1510),
  rosaMano: P('1626215549618-f2f2aaff7d87', 'Rosa en línea fina en el dorso de la mano', 'rosa-linea-fina-mano.jpg', 1390),
  hojaDedo: P('1736628153972-9850cf7fddfe', 'Hoja pequeña tatuada en el lateral del dedo', 'hoja-linea-fina-dedo.jpg', 1120),
  corazonFino: P('1736628314121-0af6d9a1d368', 'Corazón fino tatuado en el dedo', 'corazon-linea-fina-dedo.jpg', 1080),
  corazonCurado: P('1736628283631-8d9c8167fa88', 'Corazón pequeño ya curado en el dedo', 'corazon-curado-dedo.jpg', 990),
  // realismo
  leon: P('1522687533888-1078974f88ec', 'León realista en negro y gris en el antebrazo', 'leon-realismo-antebrazo.jpg', 1960),
  calavera: P('1519822356-4853be4346a8', 'Calavera realista con sombreado suave', 'calavera-realismo.jpg', 2040),
  angelEspalda: P('1540174053853-1cc5d1fa8814', 'Ángel arrodillado en la espalda completa', 'angel-espalda-realismo.jpg', 2310),
  ojosManga: P('1706433758051-73c10d1157ca', 'Manga de ojos realistas en el antebrazo', 'manga-ojos-realismo.jpg', 1820),
  retratoMuslo: P('1775565928016-140246e5c1bb', 'Retrato de mujer con flores en el muslo', 'retrato-realismo-muslo.jpg', 1930),
  mangaProceso: P('1568515045052-f9a854d70bfd', 'Manga de realismo en proceso', 'manga-realismo-proceso.jpg', 2210),
  leonPierna: P('1712027858694-8ad107b64b88', 'Rostro de león en la pierna durante la sesión', 'leon-realismo-pierna.jpg', 1780),
  // tradicional
  golondrinas: P('1601848714157-d845bb5c11ff', 'Golondrina y rosa de estilo tradicional en el brazo', 'golondrina-tradicional.jpg', 1870),
  calaveraTradi: P('1543244128-30d70d41e2a9', 'Calavera tradicional con botella en el brazo', 'calavera-tradicional.jpg', 1690),
  rosaRojaMano: P('1585303390830-874c989ce8f1', 'Rosa roja tradicional en la mano', 'rosa-roja-tradicional-mano.jpg', 1420),
  brazosColor: P('1759247943688-5d47a84dd615', 'Brazos cubiertos de tradicional a color', 'brazos-tradicional-color.jpg', 2180),
  rana: P('1712027858623-feaadeec9c0e', 'Rana neotradicional a todo color', 'rana-neotradicional-color.jpg', 1750),
  manoCalendula: P('1718661426798-208d614f4f1e', 'Mano de esqueleto con caléndula a color', 'calendula-neotradicional.jpg', 1610),
  frase: P('1479767574301-a01c78234a0c', 'Brazo con frase y adornos tradicionales', 'frase-tradicional-brazo.jpg', 1900),
  // japonés
  dragonColor: P('1778837224447-8f3b265035eb', 'Dragón japonés a color en el brazo', 'dragon-japones-brazo.jpg', 2020),
  espaldaJapo: P('1770112035323-b8da0cdefa00', 'Hombro y pecho con tatuaje japonés', 'japones-hombro-pecho.jpg', 2130),
  espaldaCompleta: P('1759247943094-38c725526a5d', 'Espalda completa y brazos tatuados', 'espalda-completa-tatuada.jpg', 2290),
  serpiente: P('1713392874058-9a8a10a22a54', 'Serpiente en el muslo durante la sesión', 'serpiente-muslo-tatuaje.jpg', 1990),
  mangaJapo: P('1641402027551-6a2fbf05b356', 'Manga con nubes y figura de estilo japonés', 'manga-japones-nubes.jpg', 1880),
  mangaGris: P('1659693707379-f7b696d92011', 'Manga en negro y gris', 'manga-negro-gris.jpg', 1760),
  // lettering
  music: P('1547754145-ef9ff306e3f3', 'Palabra en cursiva fina en el brazo', 'lettering-cursiva-brazo.jpg', 980),
  respira: P('1777507743485-d4a69842a34e', 'Frase escrita a máquina en el antebrazo', 'frase-antebrazo-lettering.jpg', 1210),
  fire: P('1577357922830-eae2e1c7b4de', 'Palabra corta en mayúsculas en el brazo', 'palabra-mayusculas-brazo.jpg', 1140),
  espaldaLetras: P('1536942493149-0922f79832b9', 'Frase caligráfica en la parte alta de la espalda', 'caligrafia-espalda.jpg', 1630),
  fraseMano: P('1523346889551-06a8879f5c71', 'Frase fina en el lateral de la mano', 'frase-mano-lettering.jpg', 1290),
  loveCursiva: P('1570168983832-8989dae1522e', 'Frase en cursiva en el brazo', 'frase-cursiva-brazo.jpg', 1150),
  // blackwork
  cuerpoBlack: P('1561377455-190afb395ed7', 'Espalda y brazos de blackwork tribal', 'blackwork-espalda-brazos.jpg', 2090),
  espaldaBlack: P('1557130641-1b14718f096a', 'Espalda de blackwork con formas geométricas', 'blackwork-espalda-geometrico.jpg', 2170),
  espaldaBlack2: P('1561491040-14a86bca9106', 'Blackwork en negro sólido en la espalda', 'blackwork-negro-solido.jpg', 2010),
  flecha: P('1588417490413-57973b627712', 'Flecha geométrica en el antebrazo', 'flecha-geometrica-antebrazo.jpg', 1320),
  geometrico: P('1588417490421-63d4e4175f95', 'Diseño geométrico en el antebrazo', 'geometrico-antebrazo.jpg', 1340),
  mandalaCuello: P('1562379825-415aea84ebcf', 'Mandala en la nuca y flores en las manos', 'mandala-nuca-blackwork.jpg', 1880),
  biomecanico: P('1609320367552-d6860fcc43d7', 'Antebrazo con diseño ornamental en negro entre flores', 'ornamental-negro-antebrazo.jpg', 2230),
  // people
  lua: P('1631377307692-36a9b6ae3ef6', 'Lúa Ferrer, tatuadora de línea fina en Tintamar', 'lua-ferrer-tatuadora.jpg', 1480),
  dani: P('1761956317387-390b7924eef5', 'Dani Orts, tatuador de realismo en Tintamar', 'dani-orts-tatuador.jpg', 1520),
  marta: P('1691048539876-b172790bb66c', 'Marta Vidal, tatuadora de tradicional en Tintamar', 'marta-vidal-tatuadora.jpg', 1390),
  iker: P('1671136880406-1ad617787bf5', 'Iker Sanz tatuando en su puesto de Tintamar', 'iker-sanz-tatuador.jpg', 1610),
  noa: P('1628876952472-6acfde923caf', 'Noa Belda, tatuadora de lettering en Tintamar', 'noa-belda-tatuadora.jpg', 1270),
  ruben: P('1552627019-947c3789ffb5', 'Rubén Coll tatuando blackwork en Tintamar', 'ruben-coll-tatuador.jpg', 1560),
  clara: P('1581459641910-41208d0ce8cb', 'Clara Montes, gerente de Tintamar', 'clara-montes-gerencia.jpg', 1330),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;

export const photo = (k: PhotoKey) => PHOTOS[k];

export const photoUrl = (id: string, w: number, h?: number, q = 75) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ''}&fit=crop&q=${q}&auto=format`;
