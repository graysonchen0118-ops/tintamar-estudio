import { ARTISTS, STUDIO, STYLES, KB, artistById, zoneById, type ArtistId, type StyleSlug, type KbEntry } from './studio';
import { IDEAS, FIRST, LAST, FOREIGN } from './ideas';
import { estimate } from '../estimate';
import { dayHours } from '../availability';
import { addDays, mondayOf, todayIso, nowMin, stampOf, hhmm, weekday } from '../dates';
import type {
  Client, Project, Appointment, GoogleBusy, GcalAccount, SyncEntry, Conversation, Unanswered, Conversion,
  SeoPage, Prize, SpinCode, ReviewInvite, GoogleReview, Source, Channel, ChatMsg, ApptStatus,
} from '../types';
import { PHOTOS, type PhotoKey } from '../photos';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

export type Seed = ReturnType<typeof generate>;

export function generate() {
  const r = rng(20261022);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const chance = (p: number) => r() < p;
  const between = (a: number, b: number) => Math.round(a + r() * (b - a));
  const weighted = <T,>(pairs: [T, number][]) => {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let x = r() * total;
    for (const [v, w] of pairs) if ((x -= w) <= 0) return v;
    return pairs[pairs.length - 1][0];
  };

  const today = todayIso();
  const now = nowMin();
  const monday = mondayOf(today);
  const first = addDays(monday, -7);
  const last = addDays(monday, 27);

  // clients
  const clients: Client[] = [];
  const usedNames = new Set<string>();
  const newClient = (createdAt: string, source: Source): Client => {
    let name = '';
    for (let i = 0; i < 20; i++) {
      name = chance(0.12) ? pick(FOREIGN) : `${pick(FIRST)} ${pick(LAST)}`;
      if (!usedNames.has(name)) break;
    }
    usedNames.add(name);
    const [fn, ln] = name.split(' ');
    const c: Client = {
      id: `c${clients.length + 1}`,
      name,
      email: `${strip(fn)}.${strip(ln ?? '')}${between(1, 99)}@${pick(['gmail.com', 'gmail.com', 'hotmail.com', 'outlook.es', 'yahoo.es'])}`,
      phone: `+34 6${between(10, 99)} ${between(100, 999)} ${between(100, 999)}`,
      source,
      createdAt,
      marketing: chance(0.42),
      consentSigned: false,
    };
    clients.push(c);
    return c;
  };

  const sourceFor = (ch: Channel): Source =>
    ch === 'mostrador' ? weighted<Source>([['Mostrador', 5], ['Recomendación', 3], ['Instagram', 2]])
      : ch === 'whatsapp' ? weighted<Source>([['Instagram', 5], ['Recomendación', 3], ['Google orgánico', 2]])
      : weighted<Source>([['Google orgánico', 32], ['Instagram', 24], ['Google Ads', 16], ['Recomendación', 18], ['Directo', 10]]);
  const pickChannel = () => weighted<Channel>([['web', 38], ['chat', 22], ['whatsapp', 15], ['mostrador', 15], ['telefono', 10]]);
  const campaignFor = (style: StyleSlug) => (style === 'cover-up' ? 'cover-up-malaga' : style === 'fine-line' || style === 'lettering' ? 'linea-fina-malaga' : 'tatuajes-malaga');

  // projects
  const projects: Project[] = [];
  let codeN = 1180;
  const newProject = (artistId: ArtistId | null, style: StyleSlug, createdAt: string, channel = pickChannel()): Project => {
    const idea = pick(IDEAS[style]);
    const zone = pick(idea.zones);
    const sizeCm = between(idea.size[0], idea.size[1]);
    const color = chance(idea.color ?? (style === 'tradicional' ? 0.9 : 0.1));
    const source = sourceFor(channel);
    const client = newClient(createdAt.slice(0, 10), source);
    const est = estimate({ style, zone, sizeCm, color, artistId, coverUp: idea.coverUp });
    const p: Project = {
      id: `p${projects.length + 1}`,
      code: `TM-${codeN++}`,
      clientId: client.id,
      artistId,
      title: idea.title,
      style,
      zone,
      side: ['pecho', 'espalda', 'nuca'].includes(zone) ? null : chance(0.55) ? 'izquierdo' : 'derecho',
      sizeCm,
      color,
      description: idea.text,
      references: (idea.refs ?? []).map((k) => PHOTOS[k].id),
      stage: 'diseno',
      sessionsPlanned: est.sessions,
      quote: { min: est.priceMin, max: est.priceMax },
      deposit: { amount: STUDIO.deposit, paid: false },
      channel,
      source,
      campaign: source === 'Google Ads' ? campaignFor(style) : undefined,
      createdAt,
      notes: [],
      coverUp: idea.coverUp,
    };
    projects.push(p);
    return p;
  };

  // google calendar accounts (Noa has not connected hers yet)
  const gcal = Object.fromEntries(
    ARTISTS.map((a) => [
      a.id,
      {
        connected: a.id !== 'noa',
        email: a.email.replace('@tintamar.es', '.tintamar@gmail.com'),
        calendar: `Tintamar · ${a.short}`,
        lastSync: a.id === 'noa' ? '' : stampOf(today, Math.max(0, now - between(2, 14))),
        up: 0,
        down: 0,
      } satisfies GcalAccount,
    ]),
  ) as Record<ArtistId, GcalAccount>;

  // busy blocks that come from each artist's own Google Calendar
  const busy: GoogleBusy[] = [];
  for (const a of ARTISTS) {
    if (!gcal[a.id].connected) continue;
    const n = between(2, 4);
    for (let i = 0; i < n; i++) {
      const date = addDays(monday, between(0, 18));
      const h = dayHours(a.id, date);
      if (!h) continue;
      const start = pick([h.open, h.open + 60, h.close - 120, 13 * 60]);
      const len = pick([60, 90, 120, 180]);
      if (start + len > h.close) continue;
      busy.push({ id: `gb${busy.length + 1}`, artistId: a.id, date, start, end: start + len, receivedAt: stampOf(addDays(date, -between(2, 9)), between(480, 1320)) });
    }
  }

  // appointments, artist by artist, day by day
  const appts: Appointment[] = [];
  const occupancy = (date: string) => {
    const d = Math.floor((Date.parse(date) - Date.parse(monday)) / (7 * 86400000));
    return d < 0 ? 0.95 : d === 0 ? 0.92 : d === 1 ? 0.78 : d === 2 ? 0.52 : 0.3;
  };
  const statusFor = (date: string, end: number): ApptStatus => {
    const past = date < today || (date === today && end <= now);
    // the last day of work is often still open: the artist closes the session later from the phone
    const recent = date === today || (date === addDays(today, -1) && end > now);
    if (past && recent && chance(0.5)) return 'confirmada';
    if (past) return weighted<ApptStatus>([['hecha', 93], ['no_show', 4], ['cancelada', 3]]);
    return 'confirmada';
  };
  const ongoing: Project[] = [];

  for (let d = 0; d <= 34; d++) {
    const date = addDays(first, d);
    if (date > last) break;
    for (const a of ARTISTS) {
      const h = dayHours(a.id, date);
      if (!h) continue;
      const occ = occupancy(date);
      let cursor = h.open + (chance(0.3) ? 60 : 0);
      let guard = 0;
      while (cursor < h.close - 30 && guard++ < 8) {
        if (!chance(occ)) {
          cursor += pick([60, 90, 120]);
          continue;
        }
        // continue a long project, or start a new one
        let p = ongoing.find((x) => x.artistId === a.id && r() < 0.5);
        let kind: Appointment['kind'] = 'sesion';
        let minutes: number;
        if (!p) {
          const style = pick(a.styles);
          // a booking is always made before its date and never after today
          const created = date <= today ? addDays(date, -between(6, 40)) : addDays(today, -between(1, Math.max(2, Math.min(30, 40 - Math.floor((Date.parse(date) - Date.parse(today)) / 86400000)))));
          p = newProject(a.id, style, stampOf(created, between(540, 1320)));
          const est = estimate({ style: p.style, zone: p.zone, sizeCm: p.sizeCm, color: p.color, artistId: a.id, coverUp: p.coverUp });
          if (est.firstKind === 'consulta' && chance(0.6)) {
            kind = 'consulta';
            minutes = 30;
          } else {
            minutes = Math.round(Math.min(est.hours, STUDIO.maxSessionHours) * 60);
          }
          if (est.sessions > 1) ongoing.push(p);
        } else {
          const est = estimate({ style: p.style, zone: p.zone, sizeCm: p.sizeCm, color: p.color, artistId: a.id });
          minutes = Math.round(Math.min(est.hours, STUDIO.maxSessionHours) * 60);
        }
        if (chance(0.06) && kind === 'sesion') {
          kind = 'retoque';
          minutes = 60;
        }
        const start = cursor;
        const end = start + minutes;
        const clash = busy.some((b) => b.artistId === a.id && b.date === date && b.start < end + STUDIO.bufferMin && start - STUDIO.bufferMin < b.end);
        if (end > h.close || clash) {
          cursor += 60;
          continue;
        }
        const done = appts.filter((x) => x.projectId === p!.id && x.kind === 'sesion').length;
        const status = statusFor(date, end);
        const ch = p.channel;
        appts.push({
          id: `a${appts.length + 1}`,
          artistId: a.id,
          clientId: p.clientId,
          projectId: p.id,
          kind,
          date,
          start,
          end,
          status,
          channel: ch,
          gcal: gcal[a.id].connected ? 'sincronizada' : 'pendiente',
          gcalId: gcal[a.id].connected ? `g${appts.length + 1}x` : undefined,
          createdAt: p.createdAt,
          sessionNo: kind === 'sesion' ? done + 1 : undefined,
        });
        if (kind === 'sesion' && done + 1 >= p.sessionsPlanned) {
          const i = ongoing.indexOf(p);
          if (i >= 0) ongoing.splice(i, 1);
        }
        cursor = end + STUDIO.bufferMin + (chance(0.4) ? 30 : 0);
      }
    }
  }

  // pending deposits on bookings made in the last two days for the next ten
  for (const a of appts) {
    if (a.status === 'confirmada' && a.date <= addDays(today, 10) && chance(0.14)) {
      a.status = 'pendiente_senal';
      a.createdAt = stampOf(addDays(today, -between(0, 1)), between(540, Math.max(560, now)));
      a.holdUntil = stampOf(addDays(a.createdAt.slice(0, 10), 2), Number(a.createdAt.slice(11, 13)) * 60);
    }
  }

  // stages, deposits and consents from what happened in the agenda
  for (const p of projects) {
    const mine = appts.filter((a) => a.projectId === p.id);
    const done = mine.filter((a) => a.status === 'hecha' && a.kind === 'sesion').length;
    const future = mine.filter((a) => a.date > today || (a.date === today && a.end > now)).filter((a) => a.status === 'confirmada' || a.status === 'pendiente_senal');
    const lastDone = mine.filter((a) => a.status === 'hecha').map((a) => a.date).sort().pop();
    if (future.length) p.stage = done ? 'sesiones' : 'diseno';
    else if (done >= p.sessionsPlanned) p.stage = lastDone && lastDone >= addDays(today, -21) ? 'cicatrizacion' : 'terminado';
    else if (done) p.stage = 'sesiones';
    p.deposit.paid = !mine.some((a) => a.status === 'pendiente_senal');
    if (p.deposit.paid) p.deposit.at = p.createdAt;
    const c = clients.find((x) => x.id === p.clientId)!;
    c.consentSigned = done > 0 || chance(0.55);
    if (done || chance(0.5)) {
      p.notes.push({ at: addDays(p.createdAt.slice(0, 10), 2) + ' 12:40', by: artistById(p.artistId!)!.short, text: pick(['Diseño enviado por WhatsApp, le encaja.', 'Ajustado el tamaño para que la línea respire.', 'Prefiere el lado izquierdo, es diestra.', 'Viene con su pareja, que también quiere uno pequeño.', 'Ha mandado tres referencias más.', 'Cambiamos la flor por una más abierta.']) });
    }
  }

  // new requests nobody has taken yet (web and chat)
  const requests: [StyleSlug, ArtistId | null, Channel, number][] = [
    ['fine-line', 'lua', 'chat', 40], ['japones', null, 'web', 190], ['cover-up', null, 'chat', 410], ['realismo', 'dani', 'web', 600],
    ['lettering', null, 'web', 1250], ['tradicional', 'marta', 'chat', 1500], ['blackwork', null, 'web', 2300],
  ];
  for (const [style, artistId, ch, minsAgo] of requests) {
    const t = new Date(Date.now() - minsAgo * 60000);
    const stamp = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ${hhmm(t.getHours() * 60 + t.getMinutes())}`;
    const p = newProject(artistId, style, stamp, ch);
    p.stage = 'solicitud';
    p.deposit = { amount: STUDIO.deposit, paid: false };
  }
  // projects waiting for the artist to propose a date
  for (const a of ARTISTS.slice(0, 5)) {
    const p = newProject(a.id, pick(a.styles), stampOf(addDays(today, -between(1, 5)), between(600, 1200)));
    p.stage = 'diseno';
    p.notes.push({ at: stampOf(addDays(today, -1), 1010), by: a.short, text: 'Boceto en marcha, falta proponer fecha.' });
  }

  // google sync counters and log
  const syncLog: SyncEntry[] = [];
  for (const a of ARTISTS) {
    const g = gcal[a.id];
    if (!g.connected) continue;
    g.up = appts.filter((x) => x.artistId === a.id && x.gcal === 'sincronizada').length;
    g.down = busy.filter((b) => b.artistId === a.id).length;
  }
  const recent = appts.filter((a) => a.gcal === 'sincronizada').slice(-40);
  for (let i = 0; i < 14; i++) {
    const a = pick(recent);
    const c = clients.find((x) => x.id === a.clientId)!;
    syncLog.push({ id: `s${i}`, at: stampOf(addDays(today, -Math.floor(i / 4)), Math.max(540, now - i * 37)), artistId: a.artistId, dir: 'up', text: `${a.kind === 'consulta' ? 'Consulta' : 'Tatuaje'} · ${c.name.split(' ')[0]} ${c.name.split(' ')[1]?.[0] ?? ''}. · ${hhmm(a.start)}`, ok: true });
  }
  for (const b of busy.slice(0, 6)) syncLog.push({ id: `sb${b.id}`, at: b.receivedAt, artistId: b.artistId, dir: 'down', text: `Ocupado ${hhmm(b.start)} a ${hhmm(b.end)} el ${b.date.slice(8)}/${b.date.slice(5, 7)}`, ok: true });
  syncLog.sort((x, y) => (x.at < y.at ? 1 : -1));

  // roulette: one code per finished session in the last twelve days
  const prizes: Prize[] = [
    { id: 'crema', name: 'Crema de cuidado Tintamar', short: 'Crema', weight: 26, stock: 40, color: '#2f8a87', active: true },
    { id: 'lamina', name: 'Lámina firmada de tu tatuador', short: 'Lámina', weight: 16, stock: 25, color: '#d4553a', active: true },
    { id: 'descuento', name: '10 % en tu próximo tatuaje', short: '10 %', weight: 18, stock: null, color: '#b0832f', active: true },
    { id: 'retoque', name: 'Retoque prioritario', short: 'Retoque', weight: 10, stock: null, color: '#4f6a95', active: true },
    { id: 'camiseta', name: 'Camiseta del estudio', short: 'Camiseta', weight: 8, stock: 12, color: '#8a5fa8', active: true },
    { id: 'stickers', name: 'Pack de pegatinas', short: 'Pegatinas', weight: 14, stock: 60, color: '#3f6b48', active: true },
    { id: 'bolsa', name: 'Bolsa de tela del estudio', short: 'Bolsa', weight: 8, stock: 18, color: '#c46a3a', active: true },
    { id: 'cafe', name: 'Café en el bar de la esquina', short: 'Café', weight: 0, stock: 0, color: '#6d6157', active: false },
  ];
  const codes: SpinCode[] = [];
  const invites: ReviewInvite[] = [];
  const doneRecent = appts.filter((a) => a.status === 'hecha' && a.kind === 'sesion' && a.date >= addDays(today, -12));
  let codeSeq = 4100;
  for (const a of doneRecent) {
    const code = `R${codeSeq++}`;
    a.spinCode = code;
    const sc: SpinCode = { code, clientId: a.clientId, artistId: a.artistId, apptId: a.id, issuedAt: stampOf(a.date, a.end) };
    if (a.date < today && chance(0.68)) {
      sc.usedAt = stampOf(a.date, Math.min(1430, a.end + between(20, 300)));
      sc.prizeId = weighted(prizes.filter((p) => p.active).map((p) => [p.id, p.weight] as [string, number]));
      if (chance(0.55)) sc.redeemedAt = stampOf(addDays(a.date, between(0, 6)), between(660, 1190));
      invites.push({ id: `i${invites.length + 1}`, code, at: sc.usedAt, opened: chance(0.72) });
    }
    codes.push(sc);
  }

  // conversations with the assistant
  const conversations: Conversation[] = [];
  const unanswered: Unanswered[] = [
    { id: 'u1', at: stampOf(addDays(today, -1), 1310), question: 'Tenéis tarjeta regalo para un cumpleaños?', count: 4 },
    { id: 'u2', at: stampOf(addDays(today, -2), 745), question: 'Se puede pagar a plazos un tatuaje grande?', count: 3 },
    { id: 'u3', at: stampOf(addDays(today, -3), 1395), question: 'Tatuáis sobre la cicatriz de una cesárea?', count: 2 },
    { id: 'u4', at: stampOf(addDays(today, -4), 960), question: 'Puedo ir con mi perro a la cita?', count: 1 },
    { id: 'u5', at: stampOf(addDays(today, -6), 1180), question: 'Hacéis tatuajes con tinta UV?', count: 1 },
  ];
  const chatProjects = projects.filter((p) => p.channel === 'chat').slice(-12);
  for (const p of chatProjects) {
    const c = clients.find((x) => x.id === p.clientId)!;
    const style = STYLES.find((s) => s.slug === p.style)!;
    const at = p.createdAt;
    const appt = appts.find((a) => a.projectId === p.id);
    const msgs: ChatMsg[] = [
      { id: 'm1', from: 'user', text: pick(['Hola! Quería información para un tatuaje', 'Buenas, cuánto costaría un tatuaje pequeño?', 'Hola, tenéis hueco esta semana?', 'Me gustaría tatuarme, cómo funciona?']), at },
      { id: 'm2', from: 'bot', text: 'Hola. Te ayudo a encontrar hueco. ¿Qué estilo tienes en mente?', at },
      { id: 'm3', from: 'user', text: style.name, at },
      { id: 'm4', from: 'bot', text: '¿En qué zona del cuerpo y de qué tamaño, más o menos?', at },
      { id: 'm5', from: 'user', text: `${zoneById(p.zone)!.name}, unos ${p.sizeCm} cm. ${p.description}`, at },
      { id: 'm6', from: 'bot', text: `Para eso calculo unas ${Math.max(1, Math.round(estimate({ style: p.style, zone: p.zone, sizeCm: p.sizeCm, color: p.color }).hours))} h, entre ${p.quote.min} y ${p.quote.max} €. El precio exacto lo confirma tu tatuador al ver el diseño.`, at },
    ];
    if (appt && p.stage !== 'solicitud') {
      msgs.push({ id: 'm7', from: 'bot', text: `Hay hueco con ${artistById(appt.artistId)!.short} el ${appt.date.slice(8)}/${appt.date.slice(5, 7)} a las ${hhmm(appt.start)}. ¿Te lo guardo?`, at });
      msgs.push({ id: 'm8', from: 'user', text: 'Sí, perfecto', at });
      msgs.push({ id: 'm9', from: 'bot', text: `Hecho. Tu código es ${p.code}. Te he mandado el enlace para pagar la señal de 50 €.`, at, booking: p.code });
    } else {
      msgs.push({ id: 'm7', from: 'bot', text: 'He pasado tu idea al equipo para que te propongan fecha. Te escriben hoy mismo.', at });
    }
    conversations.push({ id: `cv${conversations.length + 1}`, startedAt: at, visitor: c.name, page: pick(['/', '/estilos/' + p.style, '/artistas', '/reservar']), source: p.source, outcome: p.stage === 'solicitud' ? 'solicitud' : 'reserva', messages: msgs, projectId: p.id });
  }
  const infoChats: [string, string, Conversation['outcome']][] = [
    ['A qué hora abrís el sábado?', 'horario', 'informacion'],
    ['Cuánto tiempo sin playa después de tatuarme?', 'cuidados', 'informacion'],
    ['Tengo 17, puedo con autorización de mis padres?', 'edad', 'informacion'],
    ['Tenéis tarjeta regalo para un cumpleaños?', '', 'derivada'],
    ['Se puede pagar a plazos un tatuaje grande?', '', 'derivada'],
    ['Dónde estáis exactamente? Voy en tren', 'parking', 'informacion'],
  ];
  infoChats.forEach(([q, kb, outcome], i) => {
    const at = stampOf(addDays(today, -i - 1), 600 + i * 97);
    const entry = KB.find((k) => k.id === kb);
    const msgs: ChatMsg[] = [
      { id: 'm1', from: 'user', text: q, at },
      entry
        ? { id: 'm2', from: 'bot', text: entry.answer, at }
        : { id: 'm2', from: 'bot', text: 'Eso no lo tengo confirmado y prefiero no inventarlo. Te paso con una persona del equipo por WhatsApp, con tu pregunta ya escrita.', at },
    ];
    if (!entry) msgs.push({ id: 'm3', from: 'equipo', text: 'Hola, soy Clara. Te respondemos por WhatsApp en un momento.', at });
    conversations.push({ id: `cv${conversations.length + 1}`, startedAt: at, visitor: `Visita ${4800 + i * 13}`, page: pick(['/', '/cuidados', '/artistas']), source: pick<Source>(['Google orgánico', 'Instagram', 'Directo']), outcome, messages: msgs });
  });
  conversations.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));

  // conversions, as Google Ads would receive them
  const conversions: Conversion[] = [];
  for (const p of projects) {
    if (p.createdAt.slice(0, 10) < addDays(today, -28)) continue;
    if (p.channel !== 'web' && p.channel !== 'chat') continue;
    conversions.push({ id: `cv-${p.id}`, at: p.createdAt, type: p.coverUp ? 'consulta_cover' : p.channel === 'web' ? 'reserva_web' : 'reserva_chat', source: p.source, campaign: p.campaign, page: p.channel === 'web' ? '/reservar' : '/estilos/' + p.style, value: p.quote.min, consent: chance(0.71) });
  }
  for (let i = 0; i < 26; i++) {
    const source = weighted<Source>([['Google orgánico', 40], ['Google Ads', 20], ['Instagram', 25], ['Directo', 15]]);
    conversions.push({ id: `cx${i}`, at: stampOf(addDays(today, -between(0, 27)), between(600, 1320)), type: chance(0.65) ? 'clic_whatsapp' : 'llamada', source, campaign: source === 'Google Ads' ? pick(['linea-fina-malaga', 'tatuajes-malaga', 'cover-up-malaga']) : undefined, page: pick(['/', '/artistas', '/estilos/fine-line', '/estilos/cover-up', '/estilos/realismo']), value: 0, consent: chance(0.7) });
  }
  conversions.sort((a, b) => (a.at < b.at ? 1 : -1));

  // search console style figures for the pages that exist
  const seoPages: SeoPage[] = [
    { path: '/', title: 'Tintamar · Estudio de tatuaje en el Soho de Málaga', description: 'Estudio de tatuaje en el Soho de Málaga con seis tatuadores: línea fina, realismo, tradicional, japonés, blackwork y lettering. Reserva con señal de 50 €.', keyword: 'estudio de tatuaje Málaga', clicks: 412, impressions: 9870, position: 6.8 },
    ...STYLES.map((s, i) => ({ path: `/estilos/${s.slug}`, title: s.title, description: s.description, keyword: s.keyword, clicks: [188, 96, 74, 52, 61, 83, 129][i], impressions: [3920, 2810, 1990, 1430, 1610, 2240, 2650][i], position: [5.2, 9.4, 11.8, 14.1, 12.6, 8.9, 4.7][i] })),
    ...ARTISTS.map((a, i) => ({ path: `/artistas/${a.slug}`, title: `${a.name}, ${a.role.toLowerCase()} en Málaga`, description: `${a.name} tatúa ${a.styles.map((s) => STYLES.find((x) => x.slug === s)!.name.toLowerCase()).join(' y ')} en Tintamar, en el Soho de Málaga. Mira sus trabajos y reserva con su agenda real.`, keyword: `${a.name.split(' ')[0].toLowerCase()} tatuador${a.id === 'lua' || a.id === 'marta' || a.id === 'noa' ? 'a' : ''} Málaga`, clicks: [64, 51, 38, 29, 22, 33][i], impressions: [690, 540, 470, 380, 310, 420][i], position: [3.1, 2.8, 4.2, 5.5, 6.1, 4.9][i] })),
    { path: '/cuidados', title: 'Cuidados de un tatuaje nuevo, día a día', description: 'Qué hacer con un tatuaje recién hecho: lavado, crema, sol, playa y piscina. La guía que damos en Tintamar, día a día.', keyword: 'cuidados tatuaje nuevo', clicks: 231, impressions: 7410, position: 7.6 },
    { path: '/reservar', title: 'Reservar cita de tatuaje en Málaga', description: 'Cuéntanos tu idea, elige zona y tamaño y reserva el hueco real de tu tatuador. Señal de 50 € descontada del precio.', keyword: 'cita tatuaje Málaga', clicks: 57, impressions: 880, position: 8.3 },
  ];

  const reviews: GoogleReview[] = [
    ['Alba Romero', 5, 'Me hice una rama de olivo con Lúa y la línea es finísima. Me explicó por qué no la hacía más pequeña y tenía razón, ahora la veo y se lee perfecta.', 3, 'lua'],
    ['Javier Molina', 5, 'Retrato de mi padre con Dani. Le mandé tres fotos y me dijo cuál servía y por qué. Salí del estudio emocionado.', 5, 'dani'],
    ['Emma Wilson', 5, 'Estaba de vacaciones en Málaga y reservé por la web el mismo día que llegué. Estudio muy limpio, y Noa me hizo una palabra pequeña en la muñeca.', 8, 'noa'],
    ['Rocío Navarro', 5, 'Reservé por el chat a las once de la noche y a la mañana siguiente ya tenía la señal pagada y la cita confirmada. Marta es un amor.', 9, 'marta'],
    ['Diego Castillo', 4, 'Muy buen trabajo en la manga, Iker lo planifica todo. Le quito una estrella porque la primera sesión se retrasó media hora.', 12, 'iker'],
    ['Paula Serrano', 5, 'Tapé un nombre que ya no quería ver con unas flores. Rubén me enseñó tres opciones antes y elegí con calma.', 14, 'ruben'],
    ['Sergio Ortega', 5, 'Primer tatuaje y me trataron de maravilla. Me explicaron los cuidados y me dieron todo por escrito.', 16, 'marta'],
    ['Lucía Garrido', 5, 'La letra de mi abuela en el antebrazo. Noa la imprimió y me la pegó antes para ver cómo quedaba. Un detalle precioso.', 19, 'noa'],
    ['Lukas Meyer', 5, 'Muy buena experiencia. Hablan inglés y Dani es un artista de verdad. Reservar por internet fue facilísimo.', 22, 'dani'],
    ['Andrea Vega', 5, 'Todo limpio, desechable y explicado. La crema que me tocó en la ruleta me ha venido genial para la curación.', 25, 'lua'],
    ['Antonio Peña', 3, 'El tatuaje bien, pero tuve que esperar bastante para que me respondieran por WhatsApp un domingo.', 31],
    ['Irene Campos', 5, 'Segundo tatuaje con Lúa y repetiré. Se nota que dibuja ella cada pieza.', 34, 'lua'],
    ['Hugo Fuentes', 5, 'Blackwork en el antebrazo perfecto, círculos perfectos. Rubén mide hasta el último milímetro.', 38, 'ruben'],
    ['Claudia Medina', 5, 'Me encantó poder elegir el hueco en la web viendo la agenda real. Nada de esperar a que te contesten.', 41, 'marta'],
    ['Chloé Martin', 5, 'Estudio muy limpio y un equipo encantador. Marta habla francés y me lo explicó todo en mi idioma.', 45, 'marta'],
    ['Raúl Iglesias', 5, 'Koi en el muslo, tres sesiones, sin una sola sorpresa en el precio. Lo que me dijeron es lo que pagué.', 49, 'iker'],
    ['Celia Montero', 4, 'Muy contenta con el resultado. El local es pequeño y a veces hay que esperar un poco en la entrada.', 55],
    ['Manuel Cabrera', 5, 'Fui a tapar un tribal de los 2000 y no queda ni rastro. Consulta gratis antes, todo claro.', 60, 'ruben'],
    ['Nerea Gil', 5, 'Me hice la fecha de mi boda en romanos. Revisamos los números tres veces, menos mal.', 66, 'noa'],
    ['Pablo Herrera', 5, 'El chat me dijo el precio aproximado y el hueco al momento, y el precio final estuvo dentro del rango.', 71, 'dani'],
    ['Inés Aguilar', 5, 'Golondrina tradicional preciosa. Colores muy vivos un mes después.', 78, 'marta'],
    ['Freya Hansen', 5, 'El mejor estudio de Málaga para mí. Limpio, tranquilo y muy profesional.', 84, 'iker'],
  ].map(([author, rating, text, days, artistId, lang], i) => ({ id: `r${i + 1}`, author: author as string, rating: rating as number, text: text as string, date: addDays(today, -(days as number)), artistId: artistId as ArtistId | undefined, lang: (lang as 'en' | undefined) ?? 'es', reply: i % 3 === 1 ? 'Gracias por confiar en nosotros, te esperamos para el siguiente.' : undefined }));

  return {
    anchor: monday,
    clients,
    projects,
    appts,
    busy,
    gcal,
    syncLog,
    kb: KB.map((k) => ({ ...k })) as KbEntry[],
    conversations,
    unanswered,
    conversions,
    seoPages,
    prizes,
    codes,
    invites,
    reviews,
  };
}

export const photoOf = (k: PhotoKey) => PHOTOS[k];
export const weekdayOf = weekday;
