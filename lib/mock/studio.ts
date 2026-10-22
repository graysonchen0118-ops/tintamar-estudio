import type { PhotoKey } from '../photos';

export const STUDIO = {
  name: 'Tintamar',
  full: 'Tintamar Estudio de Tatuaje',
  tagline: 'Estudio de tatuaje en el Soho de Málaga',
  street: 'Calle Casas de Campos 18',
  zip: '29001',
  city: 'Málaga',
  area: 'Soho',
  phone: '+34 951 204 318',
  whatsapp: '+34 611 204 318',
  email: 'hola@tintamar.es',
  instagram: '@tintamar.estudio',
  geo: { lat: 36.7157, lng: -4.4256 },
  deposit: 50,
  minPrice: 80,
  bufferMin: 30,
  maxSessionHours: 5,
  /** 0 = lunes ... 6 = domingo, minutes from midnight */
  hours: [
    { open: 660, close: 1200 },
    { open: 660, close: 1200 },
    { open: 660, close: 1200 },
    { open: 660, close: 1200 },
    { open: 660, close: 1200 },
    { open: 600, close: 900 },
    null,
  ] as ({ open: number; close: number } | null)[],
  rating: 4.9,
  reviewCount: 312,
};

export const DAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const DAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

export type StyleSlug = 'fine-line' | 'realismo' | 'tradicional' | 'japones' | 'blackwork' | 'lettering' | 'cover-up';

export type Style = {
  slug: StyleSlug;
  name: string;
  short: string;
  keyword: string;
  title: string;
  description: string;
  intro: string;
  cover: PhotoKey;
  gallery: PhotoKey[];
  factor: number;
  priceFrom: number;
  points: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
};

export const STYLES: Style[] = [
  {
    slug: 'fine-line',
    name: 'Línea fina',
    short: 'Trazos finos, flores, fechas y piezas pequeñas que se leen de cerca.',
    keyword: 'tatuajes de línea fina en Málaga',
    title: 'Tatuajes de línea fina en Málaga',
    description: 'Tatuajes de línea fina en el Soho de Málaga: flores, fechas, frases y piezas pequeñas dibujadas a tu medida. Reserva tu hueco con señal de 50 €.',
    intro: 'Una línea fina es como la firma de alguien: si tiembla un milímetro, se nota. Por eso aquí la trabajan dos tatuadoras que solo hacen esto, con agujas de una sola punta y un diseño pensado para que siga leyéndose dentro de diez años.',
    cover: 'peoniaAntebrazo',
    gallery: ['peoniaAntebrazo', 'floresMuslo', 'floresAntebrazo', 'rosaMano', 'hojaDedo', 'corazonFino', 'corazonCurado'],
    factor: 1,
    priceFrom: 80,
    points: [
      { title: 'Tamaño que aguanta el tiempo', text: 'Una letra de dos milímetros se ve preciosa el primer día y borrosa a los cinco años. Te proponemos el tamaño mínimo para que eso no pase.' },
      { title: 'Zonas que curan bien', text: 'Antebrazo, brazo, clavícula y tobillo. En dedos y manos la línea fina se abre antes, y te lo decimos antes de tatuar.' },
      { title: 'Sesiones cortas', text: 'La mayoría de piezas se hacen en una o dos horas, sin necesidad de volver.' },
    ],
    faqs: [
      { q: '¿Cuánto cuesta un tatuaje de línea fina pequeño?', a: 'El mínimo del estudio es de 80 €. Una pieza pequeña de línea fina suele estar entre 80 y 150 €, según el detalle y la zona.' },
      { q: '¿La línea fina se borra con los años?', a: 'Se suaviza, como cualquier tatuaje. Por eso ajustamos el tamaño y la separación entre líneas para que siga leyéndose.' },
    ],
  },
  {
    slug: 'realismo',
    name: 'Realismo',
    short: 'Retratos, animales y piezas en negro y gris con sombra suave.',
    keyword: 'tatuajes realistas en Málaga',
    title: 'Tatuajes realistas y retratos en Málaga',
    description: 'Retratos, animales y realismo en negro y gris en Málaga. Diseño a partir de tu foto, sesiones planificadas y señal de 50 € para reservar.',
    intro: 'Un retrato se parece a la persona por cinco o seis sombras, no por los mil detalles. Dani trabaja tu foto antes de la cita para decidir cuáles son, y por eso pedimos la foto con buena luz.',
    cover: 'leon',
    gallery: ['leon', 'calavera', 'angelEspalda', 'ojosManga', 'retratoMuslo', 'mangaProceso', 'leonPierna'],
    factor: 1.6,
    priceFrom: 250,
    points: [
      { title: 'La foto decide la mitad', text: 'Una foto oscura o pequeña obliga a inventar. Te decimos qué foto sirve antes de reservar.' },
      { title: 'Por sesiones', text: 'Un retrato mediano son unas 4 o 5 horas. Las piezas grandes se reparten en varias sesiones con curación entre medias.' },
      { title: 'Negro y gris', text: 'Trabajamos el realismo en negro y gris, que envejece mejor en la piel que el color muy claro.' },
    ],
    faqs: [
      { q: '¿Puedo tatuarme el retrato de un familiar?', a: 'Sí. Envía la foto con más resolución que tengas, con la cara bien iluminada. Dani te dice si sirve antes de reservar.' },
      { q: '¿Cuántas sesiones necesita un retrato?', a: 'Un retrato del tamaño de una mano suele salir en una sesión larga. Si es más grande, dos o tres.' },
    ],
  },
  {
    slug: 'tradicional',
    name: 'Tradicional',
    short: 'Línea gruesa, color plano y diseños que se leen desde lejos.',
    keyword: 'tatuaje tradicional en Málaga',
    title: 'Tatuaje tradicional y neotradicional en Málaga',
    description: 'Golondrinas, rosas, dagas y panteras de estilo tradicional y neotradicional en Málaga. Color que dura y línea que se lee de lejos.',
    intro: 'El tradicional es el tatuaje que se reconoce desde la otra acera: línea gruesa, pocos colores y nada que sobre. Marta dibuja cada pieza a mano y tiene láminas propias para elegir el mismo día.',
    cover: 'golondrinas',
    gallery: ['golondrinas', 'calaveraTradi', 'rosaRojaMano', 'brazosColor', 'rana', 'manoCalendula', 'frase'],
    factor: 1.15,
    priceFrom: 120,
    points: [
      { title: 'Color que dura', text: 'Rojo, amarillo y verde muy saturados, con contorno negro que los sujeta con los años.' },
      { title: 'Láminas propias', text: 'Si no tienes idea cerrada, puedes elegir una lámina de Marta y adaptarla a tu zona.' },
      { title: 'Ideal para empezar', text: 'Es un estilo agradecido para un primer tatuaje: cura bien y se ve bien desde el primer día.' },
    ],
    faqs: [
      { q: '¿Puedo elegir un diseño ya dibujado?', a: 'Sí. Marta tiene láminas disponibles y se adaptan al tamaño de tu zona.' },
      { q: '¿El color necesita retoque?', a: 'A veces una zona pide un segundo pase. El retoque es gratis durante los tres primeros meses.' },
    ],
  },
  {
    slug: 'japones',
    name: 'Japonés',
    short: 'Koi, dragones y olas en piezas grandes que siguen la forma del cuerpo.',
    keyword: 'tatuaje japonés en Málaga',
    title: 'Tatuaje japonés en Málaga: mangas, espaldas y piezas grandes',
    description: 'Tatuaje japonés en Málaga: koi, dragones, olas y máscaras en mangas, espaldas y muslos. Proyecto por sesiones con consulta previa.',
    intro: 'Una pieza japonesa se dibuja sobre el músculo, no sobre un papel: la ola tiene que romper donde dobla el codo. Iker empieza siempre con una consulta para medir la zona y planificar las sesiones.',
    cover: 'dragonColor',
    gallery: ['dragonColor', 'espaldaJapo', 'espaldaCompleta', 'serpiente', 'mangaJapo', 'mangaGris'],
    factor: 1.5,
    priceFrom: 350,
    points: [
      { title: 'Proyecto, no cita', text: 'Una manga son entre cinco y ocho sesiones. Te damos el plan completo antes de empezar.' },
      { title: 'Consulta de medidas', text: 'Treinta minutos en el estudio para tomar medidas y fotos de la zona. Es gratuita.' },
      { title: 'Curación entre sesiones', text: 'Dejamos tres o cuatro semanas entre sesiones de la misma zona.' },
    ],
    faqs: [
      { q: '¿Cuánto cuesta una manga japonesa?', a: 'Depende del tamaño y del fondo. Se cobra por sesión, entre 550 y 700 € la sesión de día completo.' },
      { q: '¿Puedo hacer la manga por partes?', a: 'Sí, se planifica entera y se tatúa por partes, empezando por la figura principal.' },
    ],
  },
  {
    slug: 'blackwork',
    name: 'Blackwork',
    short: 'Negro sólido, geometría, puntillismo y ornamentos.',
    keyword: 'tatuaje blackwork en Málaga',
    title: 'Tatuaje blackwork y geométrico en Málaga',
    description: 'Blackwork, geometría, mandalas y puntillismo en Málaga. Diseños que se adaptan a tu cuerpo y negro que no pierde fuerza.',
    intro: 'En blackwork el negro es la pintura y la piel es el blanco. Rubén mide la zona con compás antes de dibujar, porque un círculo que no cierra se ve desde lejos.',
    cover: 'geometrico',
    gallery: ['geometrico', 'flecha', 'cuerpoBlack', 'espaldaBlack', 'espaldaBlack2', 'mandalaCuello', 'biomecanico'],
    factor: 1.25,
    priceFrom: 120,
    points: [
      { title: 'Medido sobre ti', text: 'La geometría se dibuja sobre tu medida real, no sobre una plantilla estándar.' },
      { title: 'Negro sólido', text: 'El relleno sólido necesita una buena curación. Te damos la pauta por escrito.' },
      { title: 'Buen aliado del cover-up', text: 'Un negro bien pensado tapa casi cualquier tatuaje antiguo.' },
    ],
    faqs: [
      { q: '¿El blackwork duele más?', a: 'El relleno sólido es más intenso que la línea. Hacemos pausas y repartimos en sesiones si la pieza es grande.' },
    ],
  },
  {
    slug: 'lettering',
    name: 'Lettering',
    short: 'Nombres, fechas y frases con la letra pensada para tu zona.',
    keyword: 'tatuajes de letras y frases en Málaga',
    title: 'Tatuajes de letras, nombres y frases en Málaga',
    description: 'Tatuajes de nombres, fechas y frases en Málaga, con la tipografía dibujada para tu zona. Revisamos la ortografía contigo antes de tatuar.',
    intro: 'Una frase tatuada es lo único que tu madre va a leer en voz alta, así que la letra tiene que entenderse y la ortografía, estar perfecta. Noa te enseña la frase impresa a tamaño real antes de empezar.',
    cover: 'respira',
    gallery: ['respira', 'music', 'fire', 'espaldaLetras', 'fraseMano', 'loveCursiva'],
    factor: 0.9,
    priceFrom: 80,
    points: [
      { title: 'Prueba a tamaño real', text: 'Imprimimos la frase y la pegamos en la zona antes de tatuar, para que la veas puesta.' },
      { title: 'Ortografía revisada', text: 'Comprobamos tildes, fechas y nombres contigo y por escrito.' },
      { title: 'Letra dibujada', text: 'No usamos una fuente del ordenador sin más, la ajustamos para que respire en la piel.' },
    ],
    faqs: [
      { q: '¿Puedo tatuarme la letra de otra persona?', a: 'Sí, a partir de una foto del papel escrito. Es un encargo muy bonito y bastante habitual.' },
    ],
  },
  {
    slug: 'cover-up',
    name: 'Cover-up',
    short: 'Tapar o transformar un tatuaje antiguo con un diseño nuevo.',
    keyword: 'tapar tatuaje en Málaga',
    title: 'Cover-up en Málaga: tapar un tatuaje que ya no quieres',
    description: 'Tapamos o transformamos tatuajes antiguos en Málaga. Consulta gratuita de 30 minutos para ver qué se puede hacer antes de reservar.',
    intro: 'Tapar un tatuaje es como pintar encima de una pared con humedades: primero hay que ver qué hay debajo. Por eso un cover-up siempre empieza con una consulta gratuita en el estudio.',
    cover: 'espaldaBlack',
    gallery: ['espaldaBlack', 'brazosColor', 'mangaGris', 'biomecanico', 'espaldaBlack2'],
    factor: 1.4,
    priceFrom: 200,
    points: [
      { title: 'Consulta primero', text: 'Treinta minutos con Rubén o Dani, sin coste, para ver el tatuaje antiguo con buena luz.' },
      { title: 'Diseño más grande', text: 'El diseño nuevo suele ser algo más grande y más oscuro que el antiguo. Te lo enseñamos antes.' },
      { title: 'Láser si hace falta', text: 'Si el antiguo es muy oscuro, a veces conviene aclararlo antes. Te lo diremos con sinceridad.' },
    ],
    faqs: [
      { q: '¿Se puede tapar cualquier tatuaje?', a: 'Casi siempre, pero no con cualquier diseño. Lo vemos en la consulta gratuita.' },
    ],
  },
];

export const styleBySlug = (s: string) => STYLES.find((x) => x.slug === s);

export type ArtistId = 'lua' | 'dani' | 'marta' | 'iker' | 'noa' | 'ruben';

export type Artist = {
  id: ArtistId;
  slug: string;
  name: string;
  short: string;
  role: string;
  styles: StyleSlug[];
  bio: string;
  quote: string;
  since: number;
  photo: PhotoKey;
  color: string;
  instagram: string;
  email: string;
  hourly: number;
  workDays: number[];
  portfolio: PhotoKey[];
  languages: string[];
  visible: boolean;
};

export const ARTISTS: Artist[] = [
  {
    id: 'lua', slug: 'lua-ferrer', name: 'Lúa Ferrer', short: 'Lúa', role: 'Línea fina y botánico',
    styles: ['fine-line', 'lettering'],
    bio: 'Lúa dibuja flores como quien las aprieta entre las páginas de un libro: finas, planas y con aire alrededor. Empezó en ilustración botánica y lleva tatuando desde 2017. Le gustan las piezas pequeñas que cuentan algo, y te dirá con franqueza si una letra es demasiado pequeña para durar.',
    quote: 'Si una línea necesita lupa para leerse, la hacemos más grande.',
    since: 2017, photo: 'lua', color: '#2f8a87', instagram: '@lua.tintamar', email: 'lua@tintamar.es', hourly: 110,
    workDays: [1, 2, 3, 4, 5], portfolio: ['peoniaAntebrazo', 'floresMuslo', 'floresAntebrazo', 'rosaMano', 'hojaDedo', 'corazonFino', 'corazonCurado', 'loveCursiva'],
    languages: ['Español', 'Inglés', 'Gallego'], visible: true,
  },
  {
    id: 'dani', slug: 'dani-orts', name: 'Dani Orts', short: 'Dani', role: 'Realismo y retrato',
    styles: ['realismo', 'cover-up'],
    bio: 'Dani mira una foto como un restaurador mira un cuadro: buscando las cinco sombras que sostienen la cara. Trabaja en negro y gris desde 2012 y planifica cada retrato antes de la cita, con la foto que le mandas impresa en la mesa.',
    quote: 'Un retrato se parece por las sombras, no por los detalles.',
    since: 2012, photo: 'dani', color: '#4f6a95', instagram: '@dani.orts.ink', email: 'dani@tintamar.es', hourly: 130,
    workDays: [0, 1, 2, 3, 4], portfolio: ['leon', 'calavera', 'angelEspalda', 'ojosManga', 'retratoMuslo', 'mangaProceso', 'leonPierna'],
    languages: ['Español', 'Inglés'], visible: true,
  },
  {
    id: 'marta', slug: 'marta-vidal', name: 'Marta Vidal', short: 'Marta', role: 'Tradicional y color',
    styles: ['tradicional'],
    bio: 'Marta pinta como se pintaban los carteles de feria: colores que se ven desde la otra punta del recinto. Lleva diez años con el tradicional y el neotradicional, y su pared de láminas cambia cada mes.',
    quote: 'Un buen tradicional se entiende desde la otra acera.',
    since: 2015, photo: 'marta', color: '#d4553a', instagram: '@marta.vidal.tattoo', email: 'marta@tintamar.es', hourly: 110,
    workDays: [0, 1, 2, 3, 5], portfolio: ['golondrinas', 'calaveraTradi', 'rosaRojaMano', 'brazosColor', 'rana', 'manoCalendula', 'frase'],
    languages: ['Español', 'Francés'], visible: true,
  },
  {
    id: 'iker', slug: 'iker-sanz', name: 'Iker Sanz', short: 'Iker', role: 'Japonés y piezas grandes',
    styles: ['japones', 'blackwork'],
    bio: 'Iker diseña sobre el músculo, como un sastre que corta sobre el cuerpo y no sobre la mesa. Se formó en estudios de Bilbao y Barcelona y desde 2014 hace sobre todo mangas, espaldas y muslos completos, por sesiones y con plan.',
    quote: 'La ola tiene que romper donde dobla el codo.',
    since: 2014, photo: 'iker', color: '#b0832f', instagram: '@iker.horimar', email: 'iker@tintamar.es', hourly: 120,
    workDays: [0, 1, 2, 3, 4], portfolio: ['dragonColor', 'espaldaJapo', 'espaldaCompleta', 'serpiente', 'mangaJapo', 'mangaGris'],
    languages: ['Español', 'Euskera', 'Inglés'], visible: true,
  },
  {
    id: 'noa', slug: 'noa-belda', name: 'Noa Belda', short: 'Noa', role: 'Lettering y minimalista',
    styles: ['lettering', 'fine-line'],
    bio: 'Noa trata cada frase como una invitación de boda: se revisa tres veces antes de imprimir. Viene del diseño gráfico, dibuja sus propias letras y te enseña la frase pegada en la piel antes de encender la máquina.',
    quote: 'La ortografía se revisa en papel, nunca en la piel.',
    since: 2019, photo: 'noa', color: '#8a5fa8', instagram: '@noa.letras', email: 'noa@tintamar.es', hourly: 100,
    workDays: [2, 3, 4, 5], portfolio: ['respira', 'music', 'fire', 'espaldaLetras', 'fraseMano', 'loveCursiva'],
    languages: ['Español', 'Inglés', 'Italiano'], visible: true,
  },
  {
    id: 'ruben', slug: 'ruben-coll', name: 'Rubén Coll', short: 'Rubén', role: 'Blackwork, geometría y cover-up',
    styles: ['blackwork', 'cover-up'],
    bio: 'Rubén mide antes de dibujar, como un carpintero que no corta sin marcar. Hace blackwork, geometría y puntillismo desde 2013, y es quien mira primero los tatuajes que quieres tapar.',
    quote: 'Un círculo que no cierra se ve desde lejos.',
    since: 2013, photo: 'ruben', color: '#3f6b48', instagram: '@ruben.coll.black', email: 'ruben@tintamar.es', hourly: 115,
    workDays: [0, 1, 3, 4, 5], portfolio: ['geometrico', 'flecha', 'cuerpoBlack', 'espaldaBlack', 'espaldaBlack2', 'mandalaCuello', 'biomecanico'],
    languages: ['Español', 'Catalán'], visible: true,
  },
];

export const artistById = (id: string) => ARTISTS.find((a) => a.id === id);
export const artistBySlug = (s: string) => ARTISTS.find((a) => a.slug === s);

export const MANAGER = { id: 'gerencia', name: 'Clara Montes', role: 'Gerencia del estudio', email: 'clara@tintamar.es', photo: 'clara' as PhotoKey };

export type ZoneId =
  | 'antebrazo' | 'brazo' | 'hombro' | 'mano' | 'muneca' | 'clavicula' | 'pecho' | 'costillas'
  | 'espalda' | 'nuca' | 'muslo' | 'gemelo' | 'tobillo';

export type Zone = { id: ZoneId; name: string; sided: boolean; factor: number; maxCm: number; pain: 1 | 2 | 3; back?: boolean };

export const ZONES: Zone[] = [
  { id: 'antebrazo', name: 'Antebrazo', sided: true, factor: 1, maxCm: 25, pain: 1 },
  { id: 'brazo', name: 'Brazo', sided: true, factor: 1, maxCm: 25, pain: 1 },
  { id: 'hombro', name: 'Hombro', sided: true, factor: 1.05, maxCm: 20, pain: 2 },
  { id: 'muneca', name: 'Muñeca', sided: true, factor: 1, maxCm: 8, pain: 2 },
  { id: 'mano', name: 'Mano', sided: true, factor: 1.15, maxCm: 12, pain: 3 },
  { id: 'clavicula', name: 'Clavícula', sided: true, factor: 1.05, maxCm: 15, pain: 2 },
  { id: 'pecho', name: 'Pecho', sided: false, factor: 1.1, maxCm: 30, pain: 2 },
  { id: 'costillas', name: 'Costillas', sided: true, factor: 1.25, maxCm: 30, pain: 3 },
  { id: 'espalda', name: 'Espalda', sided: false, factor: 1, maxCm: 60, pain: 2, back: true },
  { id: 'nuca', name: 'Nuca', sided: false, factor: 1.1, maxCm: 12, pain: 2, back: true },
  { id: 'muslo', name: 'Muslo', sided: true, factor: 1, maxCm: 35, pain: 1 },
  { id: 'gemelo', name: 'Gemelo', sided: true, factor: 1, maxCm: 28, pain: 2, back: true },
  { id: 'tobillo', name: 'Tobillo', sided: true, factor: 1.1, maxCm: 10, pain: 3 },
];

export const zoneById = (id: string) => ZONES.find((z) => z.id === id);

/** The one sheet the assistant answers from. Edited by the studio in the panel. */
export type KbEntry = { id: string; topic: string; keys: string[]; answer: string; active: boolean; updatedAt: string; uses: number; link?: { href: string; label: string } };

export const KB: KbEntry[] = [
  { id: 'precios', topic: 'Precios', keys: ['precio', 'cuesta', 'cuanto vale', 'cuanto sale', 'tarifa', 'presupuesto', 'caro', 'barato', 'costaria', 'coste'], answer: 'El mínimo del estudio es de 80 €. Una pieza pequeña de línea fina suele estar entre 80 y 150 €, una mediana entre 200 y 400 €, y una sesión de día completo entre 550 y 700 €. El precio exacto lo confirma tu tatuador cuando ve el diseño, el tamaño y la zona.', active: true, updatedAt: '2026-10-02', uses: 214 },
  { id: 'senal', topic: 'Señal para reservar', keys: ['señal', 'senal', 'adelanto', 'depósito', 'deposito', 'reservar hueco', 'pagar antes'], answer: 'Para guardar el hueco pedimos una señal de 50 €, que se descuenta del precio final. Si cambias la cita con más de 48 horas de margen, la señal pasa a la nueva fecha.', active: true, updatedAt: '2026-09-18', uses: 131 },
  { id: 'edad', topic: 'Edad mínima', keys: ['edad', 'años', 'menor', 'menores', '17', '16', 'mayor de edad', 'dni'], answer: 'Solo tatuamos a mayores de 18 años, y el día de la cita te pedimos el DNI o el pasaporte.', active: true, updatedAt: '2026-08-30', uses: 58 },
  { id: 'horario', topic: 'Horario', keys: ['horario', 'a que hora', 'abierto', 'abrís', 'abris', 'cerráis', 'cerrais', 'sábado', 'sabado', 'domingo', 'open'], answer: 'Abrimos de lunes a viernes de 11:00 a 20:00 y los sábados de 10:00 a 15:00. Los domingos está cerrado.', active: true, updatedAt: '2026-09-01', uses: 97 },
  { id: 'direccion', topic: 'Dónde estamos', keys: ['dónde', 'donde', 'dirección', 'direccion', 'calle', 'llegar', 'ubicación', 'ubicacion', 'soho', 'where'], answer: 'Estamos en la Calle Casas de Campos 18, en el Soho de Málaga, a cinco minutos andando de la Alameda Principal.', active: true, updatedAt: '2026-09-01', uses: 76 },
  { id: 'parking', topic: 'Aparcar y transporte', keys: ['aparcar', 'parking', 'coche', 'aparcamiento', 'tren', 'autobús', 'autobus', 'metro'], answer: 'Hay varios parkings públicos a menos de cinco minutos andando. Si vienes en tren, la estación Málaga Centro-Alameda queda a unos diez minutos a pie.', active: true, updatedAt: '2026-09-01', uses: 21 },
  { id: 'pago', topic: 'Formas de pago', keys: ['pago', 'pagar', 'tarjeta', 'bizum', 'efectivo', 'transferencia'], answer: 'Aceptamos tarjeta, Bizum y efectivo. La señal se puede pagar online al reservar.', active: true, updatedAt: '2026-09-18', uses: 44 },
  { id: 'cuidados', topic: 'Cuidados después', keys: ['cuidado', 'cuidados', 'curar', 'curación', 'curacion', 'crema', 'playa', 'piscina', 'el sol', 'tomar el sol', 'film', 'despues de tatuarme'], answer: 'Los primeros días, lávalo con jabón neutro dos veces al día, sécalo a toques y pon una capa fina de crema. Nada de sol, piscina ni mar durante dos semanas.', active: true, updatedAt: '2026-10-05', uses: 88, link: { href: '/cuidados', label: 'Ver la guía de cuidados' } },
  { id: 'dolor', topic: 'Dolor', keys: ['dolor', 'duele', 'doler', 'molesta', 'aguantar'], answer: 'Depende de la zona. Costillas, manos y tobillos molestan más; antebrazo y muslo, bastante menos. Paramos cuando lo necesites.', active: true, updatedAt: '2026-08-30', uses: 63 },
  { id: 'primer', topic: 'Primer tatuaje', keys: ['primer tatuaje', 'primera vez', 'nunca me he tatuado', 'primero'], answer: 'Para un primer tatuaje solemos recomendar algo pequeño o mediano en antebrazo, brazo o muslo. Ven descansado, habiendo comido y sin alcohol el día anterior.', active: true, updatedAt: '2026-08-30', uses: 39 },
  { id: 'cover', topic: 'Tapar un tatuaje', keys: ['tapar', 'cover', 'cubrir', 'antiguo', 'viejo', 'arreglar'], answer: 'Sí, hacemos cover-up. Siempre empezamos con una consulta gratuita de 30 minutos para ver el tatuaje antiguo, porque el diseño nuevo depende de lo que hay que tapar.', active: true, updatedAt: '2026-09-22', uses: 52, link: { href: '/estilos/cover-up', label: 'Cómo trabajamos el cover-up' } },
  { id: 'embarazo', topic: 'Embarazo y lactancia', keys: ['embarazo', 'embarazada', 'lactancia', 'dando el pecho', 'bebé', 'bebe'], answer: 'No tatuamos durante el embarazo ni la lactancia. Cuando pase, encantados de verte.', active: true, updatedAt: '2026-08-30', uses: 9 },
  { id: 'salud', topic: 'Salud y alergias', keys: ['alergia', 'alergias', 'anticoagulante', 'diabetes', 'medicación', 'medicacion', 'piel sensible', 'psoriasis'], answer: 'Si tienes alergias, tomas anticoagulantes o tienes diabetes, indícalo en el formulario de salud antes de la cita. Tu tatuador lo revisa antes de empezar.', active: true, updatedAt: '2026-09-12', uses: 17 },
  { id: 'retoque', topic: 'Retoques', keys: ['retoque', 'repasar', 'repaso', 'retocar'], answer: 'El retoque durante los tres primeros meses es gratis si has seguido los cuidados.', active: true, updatedAt: '2026-08-30', uses: 26 },
  { id: 'cancelar', topic: 'Cambiar o cancelar', keys: ['cancelar', 'anular', 'cambiar la cita', 'mover la cita', 'no puedo ir', 'cambiar fecha'], answer: 'Puedes cambiar o cancelar desde Mi cita o escribiéndonos. Con más de 48 horas de margen, la señal pasa a la nueva fecha.', active: true, updatedAt: '2026-09-18', uses: 34, link: { href: '/mi-cita', label: 'Ir a Mi cita' } },
  { id: 'diseno', topic: 'El diseño', keys: ['diseño', 'diseno', 'dibujo', 'boceto', 'copiar', 'pinterest'], answer: 'Cada diseño se dibuja para ti. Lo ves antes de la sesión y se ajusta lo que haga falta. Si traes una foto de Pinterest, la usamos como referencia, no como plantilla.', active: true, updatedAt: '2026-09-12', uses: 71 },
  { id: 'duracion', topic: 'Duración de la sesión', keys: ['cuanto dura', 'duración', 'duracion', 'cuantas horas', 'sesiones', 'cuántas sesiones', 'dura una sesion'], answer: 'Un tatuaje pequeño son una o dos horas, uno mediano tres o cuatro. Los grandes se hacen en varias sesiones de hasta cinco horas, con unas semanas de curación entre una y otra.', active: true, updatedAt: '2026-09-12', uses: 49 },
  { id: 'color', topic: 'Color o negro', keys: ['color', 'colores', 'negro', 'gris', 'blanco y negro'], answer: 'Trabajamos negro y gris y también color. El color necesita algo más de tiempo y a veces un segundo pase.', active: true, updatedAt: '2026-09-12', uses: 23 },
  { id: 'piercing', topic: 'Piercing', keys: ['piercing', 'perforación', 'perforacion', 'pendiente'], answer: 'En Tintamar solo hacemos tatuaje. Para piercing te recomendamos un estudio especializado.', active: true, updatedAt: '2026-10-08', uses: 12 },
];
