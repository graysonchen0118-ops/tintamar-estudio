import { ARTISTS, STYLES, ZONES, STUDIO, artistById, styleBySlug, zoneById, type StyleSlug, type ZoneId, type KbEntry } from './mock/studio';
import type { Appointment, GoogleBusy, SlotOffer, ChatMsg } from './types';
import { estimate, sizeLabel } from './estimate';
import { nextOffers } from './availability';
import { dayLong, hhmm, durLabel, addDays, todayIso } from './dates';

export type Flow =
  | { step: 'idle' }
  | { step: 'style' }
  | { step: 'zone'; style: StyleSlug }
  | { step: 'size'; style: StyleSlug; zone: ZoneId }
  | { step: 'color'; style: StyleSlug; zone: ZoneId; size: number }
  | { step: 'slots'; style: StyleSlug; zone: ZoneId; size: number; color: boolean; offers: SlotOffer[]; from: string }
  | { step: 'contact'; style: StyleSlug; zone: ZoneId; size: number; color: boolean; offer: SlotOffer }
  | { step: 'handoff'; question: string };

export type BotMsg = Omit<ChatMsg, 'id' | 'at'>;

export type Effect =
  | { type: 'unanswered'; question: string }
  | { type: 'kbUse'; id: string }
  | { type: 'handoff'; question: string }
  | { type: 'book'; style: StyleSlug; zone: ZoneId; size: number; color: boolean; offer: SlotOffer; name: string; phone: string; email: string };

export type Ctx = { kb: KbEntry[]; appts: Appointment[]; busy: GoogleBusy[]; flow: Flow };

export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const START_CHIPS = ['Quiero reservar', 'Precios', 'Cuidados', 'Horario', 'Hablar con una persona'];

const STYLE_WORDS: [RegExp, StyleSlug][] = [
  [/cover|tapar|cubrir|arreglar/, 'cover-up'],
  [/linea fina|fine ?line|fino|minimal/, 'fine-line'],
  [/realis|retrato|foto real/, 'realismo'],
  [/tradicional|old ?school|neotradi/, 'tradicional'],
  [/japon|koi|dragon|hannya|irezumi/, 'japones'],
  [/black|geometr|mandala|puntill|dotwork/, 'blackwork'],
  [/letter|letra|frase|nombre|fecha|palabra/, 'lettering'],
];

const ZONE_WORDS: [RegExp, ZoneId][] = [
  [/antebrazo/, 'antebrazo'],
  [/muneca/, 'muneca'],
  [/\bmanos?\b|dedo/, 'mano'],
  [/hombro/, 'hombro'],
  [/clavicula/, 'clavicula'],
  [/pecho/, 'pecho'],
  [/costilla|costado/, 'costillas'],
  [/espalda|omoplato/, 'espalda'],
  [/nuca|cuello/, 'nuca'],
  [/muslo|pierna/, 'muslo'],
  [/gemelo|pantorrilla/, 'gemelo'],
  [/tobillo|\bpies?\b/, 'tobillo'],
  [/brazo|biceps/, 'brazo'],
];

const detectStyle = (t: string) => STYLE_WORDS.find(([re]) => re.test(t))?.[1] ?? STYLES.find((s) => t.includes(norm(s.name)))?.slug ?? null;
const detectZone = (t: string) => ZONE_WORDS.find(([re]) => re.test(t))?.[1] ?? null;
const detectSize = (t: string) => {
  if (/muy grande|mas de 25/.test(t)) return 30;
  if (/pequen.*hasta 6/.test(t)) return 5;
  if (/median.*7 a 14/.test(t)) return 10;
  if (/grande.*15 a 25/.test(t)) return 20;
  const m = t.match(/(\d{1,2})\s*(cm|centimetro)/) ?? t.match(/^(\d{1,2})$/);
  if (m) return Number(m[1]);
  if (/pequen/.test(t)) return 5;
  if (/median/.test(t)) return 10;
  if (/grande/.test(t)) return 20;
  return null;
};
const detectColor = (t: string) => (/sin color|negro|gris|blanco y negro/.test(t) ? false : /color/.test(t) ? true : null);

const SIZE_CHIPS = ['Pequeño, hasta 6 cm', 'Mediano, de 7 a 14 cm', 'Grande, de 15 a 25 cm', 'Muy grande, más de 25 cm'];
const ZONE_CHIPS = ['Antebrazo', 'Brazo', 'Muñeca', 'Clavícula', 'Costillas', 'Espalda', 'Muslo', 'Tobillo'];

function matchKb(t: string, kb: KbEntry[]) {
  let best: KbEntry | null = null;
  let score = 0;
  for (const k of kb) {
    if (!k.active) continue;
    const s = k.keys.reduce((n, key) => (t.includes(norm(key)) ? n + key.length : n), 0);
    if (s > score) {
      score = s;
      best = k;
    }
  }
  return best;
}

const offerText = (o: SlotOffer) => `${artistById(o.artistId)!.short}, ${dayLong(o.date)} a las ${hhmm(o.start)}`;

function offersFor(style: StyleSlug, zone: ZoneId, size: number, color: boolean, ctx: Ctx, from = todayIso()) {
  const ids = ARTISTS.filter((a) => a.visible && a.styles.includes(style)).map((a) => a.id);
  const e = estimate({ style, zone, sizeCm: size, color });
  // one offer per artist first, then fill with the soonest days
  const seen = new Set<string>();
  const offers: SlotOffer[] = [];
  for (const id of ids) {
    const o = nextOffers([id], e.firstMinutes, ctx.appts, ctx.busy, 1, from)[0];
    if (o) offers.push(o);
  }
  for (const o of nextOffers(ids, e.firstMinutes, ctx.appts, ctx.busy, 4, from)) {
    const k = `${o.artistId}${o.date}`;
    if (!offers.some((x) => `${x.artistId}${x.date}` === k) && !seen.has(k)) offers.push(o);
    seen.add(k);
  }
  offers.sort((a, b) => (a.date + hhmm(a.start) < b.date + hhmm(b.start) ? -1 : 1));
  return { e, offers: offers.slice(0, 3) };
}

function askNext(flow: Flow, ctx: Ctx): { messages: BotMsg[]; flow: Flow } {
  switch (flow.step) {
    case 'style':
      return { flow, messages: [{ from: 'bot', text: '¿Qué estilo tienes en mente? Si no lo sabes, cuéntamelo con tus palabras.', chips: [...STYLES.map((s) => s.name), 'No lo sé'] }] };
    case 'zone':
      return { flow, messages: [{ from: 'bot', text: `${styleBySlug(flow.style)!.name}, muy bien. ¿En qué zona del cuerpo?`, chips: ZONE_CHIPS }] };
    case 'size':
      return { flow, messages: [{ from: 'bot', text: '¿Y de qué tamaño, más o menos? Me basta con el lado más largo.', chips: SIZE_CHIPS }] };
    case 'color':
      return { flow, messages: [{ from: 'bot', text: '¿Lo quieres en negro y gris o a color?', chips: ['Negro y gris', 'Color'] }] };
    case 'slots': {
      const { e, offers } = offersFor(flow.style, flow.zone, flow.size, flow.color, ctx, flow.from);
      const z = zoneById(flow.zone)!;
      const lines: BotMsg[] = [];
      if (e.firstKind === 'consulta') {
        lines.push({ from: 'bot', text: `${e.reason} Calculo unas ${e.hours} h de tatuaje en total, entre ${e.priceMin} y ${e.priceMax} €.` });
      } else {
        lines.push({ from: 'bot', text: `Para ${sizeLabel(flow.size).toLowerCase()} en ${z.name.toLowerCase()} calculo ${durLabel(e.firstMinutes)}${e.sessions > 1 ? ` por sesión, unas ${e.sessions} sesiones` : ''}, entre ${e.priceMin} y ${e.priceMax} €. El precio exacto lo confirma tu tatuador al ver el diseño.` });
      }
      if (!offers.length) {
        lines.push({ from: 'bot', text: 'No veo huecos de esa duración en las próximas semanas. Te paso con el equipo para buscarte uno.', chips: ['Hablar con una persona'] });
        return { flow: { step: 'idle' }, messages: lines };
      }
      lines.push({ from: 'bot', text: e.firstKind === 'consulta' ? 'Estos son los primeros huecos para la consulta, ya descontando lo que está ocupado:' : 'Estos son los primeros huecos de esa duración, ya descontando lo que está ocupado:', slots: offers, chips: ['Ver otras fechas'] });
      return { flow: { ...flow, offers }, messages: lines };
    }
    case 'contact':
      return { flow, messages: [{ from: 'bot', text: `Te guardo el hueco con ${offerText(flow.offer)}. ¿A qué nombre, y en qué teléfono o correo te aviso?` }] };
    default:
      return { flow, messages: [] };
  }
}

/** One visitor message in, the assistant's answer out. Everything it says comes from the studio sheet or from the real agenda. */
export function reply(raw: string, ctx: Ctx): { messages: BotMsg[]; flow: Flow; effects: Effect[] } {
  const t = norm(raw.trim());
  const flow = ctx.flow;
  const effects: Effect[] = [];

  if (/^(no, gracias|no gracias)$/.test(t)) return { flow: { step: 'idle' }, effects, messages: [{ from: 'bot', text: 'Perfecto. Si te surge otra duda, aquí estoy.', chips: START_CHIPS }] };

  if (flow.step === 'handoff' && /^si|pasame|vale/.test(t)) {
    effects.push({ type: 'handoff', question: flow.question });
    return { flow: { step: 'idle' }, effects, messages: [{ from: 'bot', text: 'Hecho. Tu pregunta ya está en el WhatsApp del estudio con lo que hemos hablado, para que no tengas que repetirla.' }, { from: 'equipo', text: 'Hola, soy Clara, del estudio. Te escribo por WhatsApp en un momento.' }] };
  }

  if (/persona|humano|alguien del equipo|hablar con|whatsapp|llamar/.test(t)) {
    effects.push({ type: 'handoff', question: raw });
    return { flow: { step: 'idle' }, effects, messages: [{ from: 'bot', text: `Te paso con el equipo. Te escribimos por WhatsApp desde el ${STUDIO.whatsapp} con lo que hemos hablado.` }, { from: 'equipo', text: 'Hola, soy Clara, del estudio. Dame un minuto y te escribo.' }] };
  }

  // the booking conversation
  if (flow.step === 'contact') {
    const email = raw.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? '';
    const phone = raw.match(/(\+?\d[\d\s]{7,}\d)/)?.[0]?.replace(/\s+/g, ' ').trim() ?? '';
    const name = raw.replace(email, '').replace(phone, '').replace(/[,;:]/g, ' ').replace(/\b(soy|me llamo|mi nombre es|y|telefono|teléfono|correo|email)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    if (!name || (!email && !phone)) {
      return { flow, effects, messages: [{ from: 'bot', text: 'Me falta algo. Escríbeme tu nombre y un teléfono o un correo, por ejemplo: Lucía, 612 345 678.' }] };
    }
    effects.push({ type: 'book', style: flow.style, zone: flow.zone, size: flow.size, color: flow.color, offer: flow.offer, name, phone, email });
    return { flow: { step: 'idle' }, effects, messages: [] };
  }

  if (flow.step === 'slots') {
    if (/otras|mas tarde|otra fecha|otro dia/.test(t)) {
      const last = flow.offers[flow.offers.length - 1];
      return { ...askNext({ ...flow, from: addDays(last?.date ?? todayIso(), 1) }, ctx), effects };
    }
    const chosen = flow.offers.find((o) => t.includes(norm(offerText(o))) || t === `${o.artistId}|${o.date}|${o.start}`);
    if (chosen) return { ...askNext({ step: 'contact', style: flow.style, zone: flow.zone, size: flow.size, color: flow.color, offer: chosen }, ctx), effects };
  }

  if (flow.step === 'style' || flow.step === 'zone' || flow.step === 'size' || flow.step === 'color') {
    const style = flow.step === 'style' ? detectStyle(t) ?? (/no lo se|ni idea/.test(t) ? 'fine-line' : null) : flow.style;
    if (flow.step === 'style' && /no lo se|ni idea/.test(t)) {
      const next = askNext({ step: 'zone', style: 'fine-line' }, ctx);
      next.messages.unshift({ from: 'bot', text: 'Sin problema. Empezamos como si fuera línea fina y tu tatuador lo ajusta al ver la idea.' });
      return { ...next, effects };
    }
    if (style) {
      const zone = flow.step === 'zone' ? detectZone(t) : flow.step === 'style' ? detectZone(t) : flow.zone;
      const size = flow.step === 'size' ? detectSize(t) : flow.step === 'color' ? flow.size : detectSize(t);
      const color = flow.step === 'color' ? detectColor(t) : flow.step === 'size' ? detectColor(t) : null;
      if (flow.step === 'style' || (flow.step === 'zone' && zone) || (flow.step === 'size' && size) || (flow.step === 'color' && color !== null)) {
        if (!zone) return { ...askNext({ step: 'zone', style }, ctx), effects };
        if (!size) return { ...askNext({ step: 'size', style, zone }, ctx), effects };
        if (color === null && style !== 'tradicional') return { ...askNext({ step: 'color', style, zone, size }, ctx), effects };
        return { ...askNext({ step: 'slots', style, zone, size, color: color ?? true, offers: [], from: todayIso() }, ctx), effects };
      }
    }
  }

  // a question from the sheet, answered at any point of the conversation
  const k = matchKb(t, ctx.kb);
  const wantsBooking = /reserv|cita|hueco|tatuar|quiero un tatuaje|quiero hacerme|disponib|agenda|cuando podria/.test(t);
  if (k && !(wantsBooking && k.id === 'precios' && !/precio|cuesta|cuanto/.test(t))) {
    effects.push({ type: 'kbUse', id: k.id });
    const msgs: BotMsg[] = [{ from: 'bot', text: k.answer, link: k.link }];
    if (flow.step !== 'idle' && flow.step !== 'handoff') {
      const again = askNext(flow, ctx);
      msgs.push({ from: 'bot', text: 'Seguimos con tu reserva.' }, ...again.messages);
      return { flow: again.flow, effects, messages: msgs };
    }
    msgs[0].chips = k.id === 'precios' ? ['Quiero reservar', 'Cuánto dura una sesión'] : ['Quiero reservar', 'Otra pregunta'];
    return { flow: { step: 'idle' }, effects, messages: msgs };
  }

  if (wantsBooking) {
    const style = detectStyle(t);
    if (style) {
      const zone = detectZone(t);
      const size = detectSize(t);
      if (!zone) return { ...askNext({ step: 'zone', style }, ctx), effects };
      if (!size) return { ...askNext({ step: 'size', style, zone }, ctx), effects };
      return { ...askNext({ step: 'color', style, zone, size }, ctx), effects };
    }
    const next = askNext({ step: 'style' }, ctx);
    next.messages.unshift({ from: 'bot', text: 'Vamos a buscarte hueco. Te hago cuatro preguntas y te enseño las fechas libres reales.' });
    return { ...next, effects };
  }

  if (/^(hola|buenas|hey|hello|buenos dias|buenas tardes)\b/.test(t) && t.length < 25) {
    return { flow: { step: 'idle' }, effects, messages: [{ from: 'bot', text: 'Hola. Soy el asistente de Tintamar. Te puedo dar precios orientativos, resolver dudas y buscarte hueco en la agenda real del estudio.', chips: START_CHIPS }] };
  }
  if (/otra pregunta|gracias/.test(t)) {
    return { flow: { step: 'idle' }, effects, messages: [{ from: 'bot', text: t.includes('gracias') ? 'A ti. Si te surge algo más, aquí estoy.' : 'Dime.', chips: t.includes('gracias') ? undefined : START_CHIPS }] };
  }

  effects.push({ type: 'unanswered', question: raw.trim() });
  return {
    flow: { step: 'handoff', question: raw.trim() },
    effects,
    messages: [{ from: 'bot', text: 'Eso no lo tengo confirmado y prefiero no inventármelo. ¿Te paso con una persona del equipo? Le llega tu pregunta ya escrita.', chips: ['Sí, pásame', 'No, gracias'] }],
  };
}

export const welcome = (): BotMsg => ({ from: 'bot', text: 'Hola. Soy el asistente de Tintamar. Te doy precios orientativos, resuelvo dudas y te busco hueco en la agenda real del estudio, a cualquier hora.', chips: START_CHIPS });

export { offerText };
export const zoneNames = ZONES.map((z) => z.name);
