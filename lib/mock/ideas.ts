import type { StyleSlug, ZoneId } from './studio';
import type { PhotoKey } from '../photos';

export type Idea = { title: string; text: string; zones: ZoneId[]; size: [number, number]; color?: number; refs?: PhotoKey[]; coverUp?: boolean };

export const IDEAS: Record<StyleSlug, Idea[]> = {
  'fine-line': [
    { title: 'Rama de olivo', text: 'Una rama de olivo fina, con siete u ocho hojas, que siga la línea del antebrazo.', zones: ['antebrazo', 'brazo', 'clavicula'], size: [9, 16], refs: ['floresAntebrazo'] },
    { title: 'Fecha en números romanos', text: 'La fecha en que nació mi hijo en números romanos, con letra fina y recta.', zones: ['muneca', 'antebrazo', 'clavicula'], size: [5, 9] },
    { title: 'Flor de azahar', text: 'Una flor de azahar pequeña, abierta. Me recuerda a casa de mi abuela.', zones: ['tobillo', 'muneca', 'brazo'], size: [4, 7], refs: ['rosaMano'] },
    { title: 'Constelación de Leo', text: 'Los puntos de la constelación unidos por líneas muy finas, sin nombre.', zones: ['clavicula', 'antebrazo', 'nuca'], size: [6, 10] },
    { title: 'Golondrina pequeña', text: 'Una golondrina de línea fina volando hacia arriba.', zones: ['muneca', 'nuca', 'clavicula'], size: [4, 7] },
    { title: 'Ramo de lavanda', text: 'Tres espigas de lavanda atadas con un lazo fino.', zones: ['antebrazo', 'costillas', 'tobillo'], size: [8, 14], refs: ['floresMuslo'] },
    { title: 'Ola de una sola línea', text: 'Una ola dibujada con un único trazo, muy simple.', zones: ['muneca', 'antebrazo'], size: [5, 8] },
    { title: 'Peonía abierta', text: 'Una peonía con dos hojas, solo línea, sin sombra.', zones: ['brazo', 'muslo', 'hombro'], size: [10, 16], refs: ['peoniaAntebrazo'] },
  ],
  realismo: [
    { title: 'Retrato de mi abuela', text: 'Tengo una foto de mi abuela de joven en blanco y negro y quiero llevarla conmigo.', zones: ['brazo', 'antebrazo', 'muslo'], size: [12, 18], refs: ['retratoMuslo'] },
    { title: 'Cabeza de león', text: 'Un león mirando de frente, negro y gris, con la melena perdiéndose hacia el codo.', zones: ['antebrazo', 'brazo', 'gemelo'], size: [12, 20], refs: ['leon'] },
    { title: 'Reloj y rosa', text: 'Un reloj de bolsillo marcando la hora en que nació mi hija, con una rosa al lado.', zones: ['antebrazo', 'brazo'], size: [12, 16] },
    { title: 'Lobo entre árboles', text: 'Un lobo saliendo de un bosque con niebla.', zones: ['muslo', 'gemelo', 'brazo'], size: [15, 22] },
    { title: 'Retrato de mi perro', text: 'Mi perro Toby. Tengo varias fotos con buena luz.', zones: ['antebrazo', 'brazo', 'gemelo'], size: [9, 14] },
    { title: 'Ojo realista', text: 'Un ojo con pestañas y reflejo, en negro y gris.', zones: ['antebrazo', 'gemelo'], size: [8, 12], refs: ['ojosManga'] },
  ],
  tradicional: [
    { title: 'Golondrina y ancla', text: 'Golondrina tradicional sobre un ancla, con los colores clásicos.', zones: ['gemelo', 'brazo'], size: [10, 14], color: 1, refs: ['golondrinas'] },
    { title: 'Daga con rosa', text: 'Una daga atravesando una rosa roja, estilo clásico.', zones: ['antebrazo'], size: [12, 16], color: 1 },
    { title: 'Pantera', text: 'Una pantera trepando, de las de toda la vida.', zones: ['brazo', 'muslo'], size: [14, 18], color: 0.7 },
    { title: 'Barco a toda vela', text: 'Un barco de vela con olas y una cinta con una fecha.', zones: ['pecho', 'brazo'], size: [15, 20], color: 1 },
    { title: 'Corazón con nombre', text: 'Corazón con una cinta y el nombre de mi madre dentro.', zones: ['brazo', 'antebrazo'], size: [8, 12], color: 1 },
    { title: 'Rana con sombrero', text: 'Una rana neotradicional con sombrero, algo divertido para la pierna.', zones: ['gemelo', 'muslo'], size: [12, 16], color: 1, refs: ['rana'] },
  ],
  japones: [
    { title: 'Koi con olas', text: 'Una carpa koi subiendo contra la corriente, con olas y flores de cerezo.', zones: ['muslo', 'brazo'], size: [25, 35], color: 1, refs: ['dragonColor'] },
    { title: 'Manga japonesa', text: 'Manga completa del brazo derecho, con un dragón y nubes.', zones: ['brazo'], size: [30, 35], color: 0.8, refs: ['mangaJapo'] },
    { title: 'Máscara Hannya', text: 'Máscara Hannya con flores de peonía alrededor.', zones: ['hombro', 'muslo'], size: [18, 24], color: 0.8 },
    { title: 'Dragón en la espalda', text: 'Espalda completa con un dragón y agua. Sé que es un proyecto largo.', zones: ['espalda'], size: [45, 55], color: 0.6, refs: ['espaldaCompleta'] },
    { title: 'Loto y ola', text: 'Una flor de loto sobre una ola, para el gemelo.', zones: ['gemelo', 'antebrazo'], size: [16, 22], color: 0.7 },
  ],
  blackwork: [
    { title: 'Brazalete geométrico', text: 'Un brazalete de triángulos alrededor del brazo, negro sólido.', zones: ['antebrazo', 'brazo'], size: [8, 12], refs: ['geometrico'] },
    { title: 'Mandala en el codo', text: 'Mandala centrado en el codo, con puntillismo.', zones: ['brazo'], size: [12, 16], refs: ['mandalaCuello'] },
    { title: 'Luna en puntillismo', text: 'Una luna llena hecha a puntos, con un marco geométrico.', zones: ['antebrazo', 'gemelo'], size: [10, 14] },
    { title: 'Patrón ornamental', text: 'Un patrón ornamental que baje por el muslo.', zones: ['muslo', 'espalda'], size: [20, 30], refs: ['biomecanico'] },
    { title: 'Flecha y montañas', text: 'Una flecha larga con montañas en la punta.', zones: ['antebrazo'], size: [12, 18], refs: ['flecha'] },
  ],
  lettering: [
    { title: 'Nombre de mi hija', text: 'El nombre de mi hija, Vega, en cursiva fina.', zones: ['costillas', 'antebrazo', 'clavicula'], size: [8, 12] },
    { title: 'Respira', text: 'La palabra "respira" escrita a máquina, en minúsculas.', zones: ['antebrazo', 'muneca'], size: [6, 10], refs: ['respira'] },
    { title: 'Frase de mi padre', text: 'Una frase que me decía mi padre, con su propia letra. Tengo una carta suya.', zones: ['antebrazo', 'costillas'], size: [10, 16] },
    { title: 'Fecha y coordenadas', text: 'La fecha de mi boda y las coordenadas de la playa donde nos casamos.', zones: ['brazo', 'costillas'], size: [8, 12] },
    { title: 'Calma', text: 'La palabra calma, pequeña, para verla cuando la necesite.', zones: ['muneca', 'nuca'], size: [4, 7], refs: ['music'] },
  ],
  'cover-up': [
    { title: 'Tapar tribal antiguo', text: 'Tengo un tribal de hace veinte años en el hombro y quiero algo que lo tape del todo.', zones: ['hombro', 'brazo'], size: [18, 25], coverUp: true },
    { title: 'Cubrir un nombre', text: 'Un nombre en la muñeca que ya no quiero ver. Algo con flores, quizá.', zones: ['muneca', 'antebrazo'], size: [6, 10], coverUp: true },
    { title: 'Tapar estrella del tobillo', text: 'Una estrella azul muy borrosa en el tobillo.', zones: ['tobillo', 'gemelo'], size: [8, 12], coverUp: true },
    { title: 'Arreglar golondrina borrosa', text: 'Una golondrina que se ha corrido con los años. ¿Se puede arreglar o mejor tapar?', zones: ['brazo', 'antebrazo'], size: [10, 14], coverUp: true },
  ],
};

export const FIRST = ['Lucía', 'Marta', 'Paula', 'Carmen', 'Alba', 'Irene', 'Laura', 'Sara', 'Elena', 'Claudia', 'Nerea', 'Andrea', 'Rocío', 'Inés', 'Julia', 'Celia', 'Noelia', 'Rosa', 'Ana', 'María', 'Pablo', 'Javier', 'Álvaro', 'Sergio', 'Adrián', 'Hugo', 'Diego', 'Manuel', 'Antonio', 'José', 'Iván', 'Raúl', 'Fran', 'Jorge', 'Miguel', 'Alejandro', 'Carlos', 'Mario', 'Óscar', 'Víctor', 'Rafa', 'Nacho', 'Juanma', 'Blanca', 'Lorena', 'Patricia', 'Cristina', 'Silvia', 'Tomás', 'Gonzalo'];
export const LAST = ['García', 'Martín', 'López', 'Sánchez', 'Romero', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Núñez', 'Iglesias', 'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Cruz', 'Calvo', 'Gallego', 'León', 'Márquez', 'Herrera', 'Peña', 'Flores', 'Cabrera', 'Campos', 'Vega', 'Fuentes', 'Carrasco', 'Caballero', 'Reyes', 'Aguilar', 'Pascual', 'Montero', 'Lorenzo', 'Hidalgo', 'Benítez', 'Mora', 'Arias', 'Carmona', 'Crespo', 'Román', 'Pastor', 'Soto', 'Velasco', 'Moya', 'Parra', 'Bravo', 'Gallardo', 'Rojas'];
export const FOREIGN = ['Sophie Laurent', 'Jonas Berg', 'Emma Wilson', 'Lukas Meyer', 'Chloé Martin', 'Matteo Rossi', 'Freya Hansen', 'Liam Walsh', 'Ana Costa', 'Nina Kowalski', 'Hannah Becker', 'Julien Moreau'];
