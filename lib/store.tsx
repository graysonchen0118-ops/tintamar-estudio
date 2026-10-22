'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ARTISTS, STUDIO, artistById, type Artist, type ArtistId, type KbEntry, type StyleSlug, type ZoneId } from './mock/studio';
import { generate, type Seed } from './mock/generate';
import { reply, welcome, offerText, type Flow } from './assistant';
import { estimate } from './estimate';
import { mondayOf, todayIso, stampNow, hhmm, addDays, dayLong } from './dates';
import type {
  Appointment, ApptStatus, ChatMsg, Client, Conversion, ConversionType, HealthForm, Project, Prize, Role, SlotOffer, Source, Stage, GoogleBusy,
} from './types';

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Chat = { messages: ChatMsg[]; flow: Flow; convId: string | null };

type State = Seed & {
  artists: Artist[];
  user: Role | null;
  chat: Chat;
  gcalPrivacy: 'inicial' | 'completo';
  photoAlts: Record<string, string>;
  attribution: { source: Source; campaign?: string } | null;
  lastBooking: string | null;
  seq: number;
};

export type BookingInput = {
  style: StyleSlug;
  zone: ZoneId;
  side: 'izquierdo' | 'derecho' | null;
  size: number;
  color: boolean;
  description: string;
  references: string[];
  coverUp?: boolean;
  offer: SlotOffer;
  name: string;
  email: string;
  phone: string;
  marketing: boolean;
  payNow: boolean;
  channel: 'web' | 'chat';
};

type Toast = { id: number; text: string; tone: 'ok' | 'info' | 'bad' };

const KEY = 'tintamar:datos:v5';
const COOKIE_KEY = 'tintamar:cookies';

const empty = (): State => ({
  anchor: '',
  clients: [],
  projects: [],
  appts: [],
  busy: [],
  gcal: {} as State['gcal'],
  syncLog: [],
  kb: [],
  conversations: [],
  unanswered: [],
  conversions: [],
  seoPages: [],
  prizes: [],
  codes: [],
  invites: [],
  reviews: [],
  artists: ARTISTS,
  user: null,
  chat: { messages: [], flow: { step: 'idle' }, convId: null },
  gcalPrivacy: 'inicial',
  photoAlts: {},
  attribution: null,
  lastBooking: null,
  seq: 1,
});

const fresh = (keep?: Partial<State>): State => ({ ...empty(), ...generate(), ...keep });

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function useApi() {
  const [s, setS] = useState<State>(empty);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [typing, setTyping] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [cookie, setCookieState] = useState<'granted' | 'denied' | null | 'unknown'>('unknown');
  const sRef = useRef(s);
  sRef.current = s;
  const written = useRef('');

  // Kept in this browser only and shared between its tabs: a booking made on the site shows up in the panel tab.
  useEffect(() => {
    let next: State | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as State;
        if (saved.anchor === mondayOf(todayIso())) {
          next = { ...empty(), ...saved, artists: saved.artists?.length ? saved.artists : ARTISTS };
          written.current = raw;
        } else {
          next = fresh({ user: saved.user ?? null, artists: saved.artists?.length ? saved.artists : ARTISTS });
        }
      }
    } catch {}
    setS(next ?? fresh());
    try {
      const c = localStorage.getItem(COOKIE_KEY);
      setCookieState(c === 'granted' || c === 'denied' ? c : null);
    } catch {
      setCookieState(null);
    }
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        written.current = e.newValue;
        setS({ ...empty(), ...JSON.parse(e.newValue) });
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    // leaving the page writes at once, so a change made a moment before navigating is never lost
    const flush = () => {
      try {
        const json = JSON.stringify(sRef.current);
        if (sRef.current.anchor && json !== written.current) {
          written.current = json;
          localStorage.setItem(KEY, json);
        }
      } catch {}
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try {
        const json = JSON.stringify(s);
        if (json !== written.current) {
          written.current = json;
          localStorage.setItem(KEY, json);
        }
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [s, ready]);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const patch = useCallback((fn: (s: State) => Partial<State>) => setS((prev) => ({ ...prev, ...fn(prev) })), []);

  /** Pushes a studio booking to the artist's Google Calendar, a moment later, like the real sync. */
  const syncUp = useCallback((apptIds: string[], verb = 'Creada') => {
    setTimeout(() => {
      setS((prev) => {
        const appts = prev.appts.map((a) => {
          if (!apptIds.includes(a.id)) return a;
          return prev.gcal[a.artistId]?.connected ? { ...a, gcal: 'sincronizada' as const, gcalId: a.gcalId ?? uid('g') } : a;
        });
        const log = [...prev.syncLog];
        const gcal = { ...prev.gcal };
        for (const id of apptIds) {
          const a = appts.find((x) => x.id === id);
          if (!a || !prev.gcal[a.artistId]?.connected) continue;
          const c = prev.clients.find((x) => x.id === a.clientId);
          const who = prev.gcalPrivacy === 'completo' ? c?.name ?? '' : `${c?.name.split(' ')[0] ?? ''} ${c?.name.split(' ')[1]?.[0] ?? ''}.`;
          log.unshift({ id: uid('s'), at: stampNow(), artistId: a.artistId, dir: 'up', text: `${verb}: ${a.kind === 'consulta' ? 'Consulta' : 'Tatuaje'} · ${who} · ${a.date.slice(8)}/${a.date.slice(5, 7)} ${hhmm(a.start)}`, ok: true });
          gcal[a.artistId] = { ...gcal[a.artistId], up: gcal[a.artistId].up + 1, lastSync: stampNow() };
        }
        return { ...prev, appts, syncLog: log.slice(0, 80), gcal };
      });
    }, 1500);
  }, []);

  const track = useCallback((type: ConversionType, page: string, value = 0) => {
    const consent = (() => {
      try {
        return localStorage.getItem(COOKIE_KEY) === 'granted';
      } catch {
        return false;
      }
    })();
    const attr = sRef.current.attribution;
    const conv: Conversion = { id: uid('cv'), at: stampNow(), type, source: attr?.source ?? 'Directo', campaign: attr?.campaign, page, value, consent };
    if (typeof window !== 'undefined') {
      const w = window as unknown as { dataLayer?: unknown[] };
      w.dataLayer = w.dataLayer ?? [];
      w.dataLayer.push({ event: type, value, currency: 'EUR', campaign: attr?.campaign });
    }
    patch((s) => ({ conversions: [conv, ...s.conversions] }));
  }, [patch]);

  const createBooking = useCallback((b: BookingInput) => {
    const st = sRef.current;
    const n = Math.max(1180, ...st.projects.map((p) => Number(p.code.slice(3)) || 0)) + 1;
    const code = `TM-${n}`;
    const now = stampNow();
    const existing = st.clients.find((c) => !c.deleted && ((b.email && c.email === b.email) || (b.phone && c.phone === b.phone)));
    const attr = st.attribution;
    const source: Source = attr?.source ?? (b.channel === 'chat' ? 'Directo' : 'Directo');
    const client: Client = existing ?? { id: uid('c'), name: b.name, email: b.email, phone: b.phone, source, createdAt: now.slice(0, 10), marketing: b.marketing, consentSigned: false };
    const e = estimate({ style: b.style, zone: b.zone, sizeCm: b.size, color: b.color, artistId: b.offer.artistId, coverUp: b.coverUp });
    const project: Project = {
      id: uid('p'), code, clientId: client.id, artistId: b.offer.artistId, title: b.description ? b.description.split(/[.,\n]/)[0].slice(0, 48) : `Tatuaje de ${b.style}`,
      style: b.style, zone: b.zone, side: b.side, sizeCm: b.size, color: b.color, description: b.description || 'Idea contada por el chat.', references: b.references,
      stage: 'diseno', sessionsPlanned: e.sessions, quote: { min: e.priceMin, max: e.priceMax }, deposit: { amount: STUDIO.deposit, paid: b.payNow, at: b.payNow ? now : undefined },
      channel: b.channel, source, campaign: attr?.campaign, createdAt: now, notes: [], coverUp: b.coverUp || b.style === 'cover-up',
    };
    const appt: Appointment = {
      id: uid('a'), artistId: b.offer.artistId, clientId: client.id, projectId: project.id, kind: e.firstKind, date: b.offer.date, start: b.offer.start, end: b.offer.end,
      status: b.payNow ? 'confirmada' : 'pendiente_senal', channel: b.channel, gcal: 'pendiente', createdAt: now, sessionNo: e.firstKind === 'sesion' ? 1 : undefined,
      holdUntil: b.payNow ? undefined : `${addDays(now.slice(0, 10), 2)} ${now.slice(11)}`,
    };
    patch((s) => ({
      clients: existing ? s.clients : [client, ...s.clients],
      projects: [project, ...s.projects],
      appts: [...s.appts, appt],
      lastBooking: code,
    }));
    track(b.channel === 'chat' ? 'reserva_chat' : project.coverUp ? 'consulta_cover' : 'reserva_web', b.channel === 'chat' ? 'chat' : '/reservar', e.priceMin);
    syncUp([appt.id], 'Nueva reserva');
    return { code, project, appt, client };
  }, [patch, track, syncUp]);

  // ---------- chat
  const chatSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const at = stampNow();
    const userMsg: ChatMsg = { id: uid('m'), from: 'user', text: text.trim(), at };
    let convId = sRef.current.chat.convId;
    if (!convId) {
      convId = uid('cv');
      const conv = { id: convId, startedAt: at, visitor: 'Visita en la web', page: typeof window !== 'undefined' ? window.location.pathname : '/', source: sRef.current.attribution?.source ?? 'Directo', outcome: 'abierta' as const, messages: [] };
      patch((s) => ({ conversations: [conv, ...s.conversations] }));
    }
    patch((s) => ({ chat: { ...s.chat, convId, messages: [...(s.chat.messages.length ? s.chat.messages : [{ ...welcome(), id: uid('m'), at }]), userMsg] } }));
    setTyping(true);
    await wait(650 + Math.min(900, text.length * 12));
    const st = sRef.current;
    const out = reply(text, { kb: st.kb, appts: st.appts, busy: st.busy, flow: st.chat.flow });
    const botMsgs: ChatMsg[] = out.messages.map((m) => ({ ...m, id: uid('m'), at: stampNow() }));
    let outcome: 'reserva' | 'derivada' | 'informacion' | null = null;
    let projectId: string | undefined;
    for (const ef of out.effects) {
      if (ef.type === 'unanswered') {
        patch((s) => {
          const q = ef.question;
          const hit = s.unanswered.find((u) => u.question.toLowerCase() === q.toLowerCase() && !u.resolved);
          return { unanswered: hit ? s.unanswered.map((u) => (u === hit ? { ...u, count: u.count + 1, at: stampNow() } : u)) : [{ id: uid('u'), at: stampNow(), question: q, count: 1 }, ...s.unanswered] };
        });
      }
      if (ef.type === 'kbUse') {
        outcome = outcome ?? 'informacion';
        patch((s) => ({ kb: s.kb.map((k) => (k.id === ef.id ? { ...k, uses: k.uses + 1 } : k)) }));
      }
      if (ef.type === 'handoff') {
        outcome = 'derivada';
        track('clic_whatsapp', 'chat');
      }
      if (ef.type === 'book') {
        const res = createBooking({ style: ef.style, zone: ef.zone, side: null, size: ef.size, color: ef.color, description: '', references: [], offer: ef.offer, name: ef.name, email: ef.email, phone: ef.phone, marketing: false, payNow: false, channel: 'chat' });
        outcome = 'reserva';
        projectId = res.project.id;
        botMsgs.push({
          id: uid('m'), at: stampNow(), from: 'bot', booking: res.code,
          text: `Hecho, ${ef.name.split(' ')[0]}. Te guardo el hueco con ${offerText(ef.offer)} durante 48 horas. Tu código es ${res.code}. Para confirmarla, paga la señal de ${STUDIO.deposit} € desde Mi cita, y ${artistById(ef.offer.artistId)!.short} verá tu idea antes de la sesión.`,
          link: { href: `/mi-cita?codigo=${res.code}`, label: 'Pagar la señal en Mi cita' },
        });
      }
    }
    setTyping(false);
    patch((s) => ({
      chat: { ...s.chat, flow: out.flow, messages: [...s.chat.messages, ...botMsgs] },
      conversations: s.conversations.map((c) =>
        c.id === convId ? { ...c, messages: [...s.chat.messages, ...botMsgs], outcome: outcome === 'reserva' || c.outcome === 'reserva' ? 'reserva' : outcome === 'derivada' ? 'derivada' : outcome ?? c.outcome, projectId: projectId ?? c.projectId } : c,
      ),
    }));
  }, [patch, createBooking, track]);

  const chatReset = useCallback(() => patch(() => ({ chat: { messages: [], flow: { step: 'idle' }, convId: null } })), [patch]);

  // ---------- agenda
  const addAppt = useCallback((a: Omit<Appointment, 'id' | 'gcal' | 'createdAt'>) => {
    const appt: Appointment = { ...a, id: uid('a'), gcal: 'pendiente', createdAt: stampNow() };
    patch((s) => ({ appts: [...s.appts, appt] }));
    syncUp([appt.id], 'Creada');
    return appt;
  }, [patch, syncUp]);

  const updateAppt = useCallback((id: string, p: Partial<Appointment>) => {
    patch((s) => ({ appts: s.appts.map((a) => (a.id === id ? { ...a, ...p, gcal: 'pendiente' } : a)) }));
    syncUp([id], 'Movida');
  }, [patch, syncUp]);

  const issueCode = useCallback((apptId: string) => {
    const st = sRef.current;
    const a = st.appts.find((x) => x.id === apptId);
    if (!a) return null;
    if (a.spinCode) return a.spinCode;
    const n = Math.max(4100, ...st.codes.map((c) => Number(c.code.slice(1)) || 0)) + 1;
    const code = `R${n}`;
    patch((s) => ({
      appts: s.appts.map((x) => (x.id === apptId ? { ...x, spinCode: code } : x)),
      codes: [{ code, clientId: a.clientId, artistId: a.artistId, apptId, issuedAt: stampNow() }, ...s.codes],
    }));
    return code;
  }, [patch]);

  const setApptStatus = useCallback((id: string, status: ApptStatus) => {
    const a = sRef.current.appts.find((x) => x.id === id);
    patch((s) => {
      let projects = s.projects;
      if (a?.projectId && status === 'confirmada' && a.status === 'pendiente_senal') {
        projects = projects.map((p) => (p.id === a.projectId ? { ...p, deposit: { ...p.deposit, paid: true, at: stampNow() } } : p));
      }
      if (a?.projectId && status === 'hecha' && a.kind === 'sesion') {
        const doneCount = s.appts.filter((x) => x.projectId === a.projectId && x.status === 'hecha' && x.kind === 'sesion').length + 1;
        projects = projects.map((p) => (p.id === a.projectId ? { ...p, stage: (doneCount >= p.sessionsPlanned ? 'cicatrizacion' : 'sesiones') as Stage } : p));
      }
      return { appts: s.appts.map((x) => (x.id === id ? { ...x, status } : x)), projects };
    });
    if (status === 'cancelada') syncUp([id], 'Cancelada');
    if (status === 'hecha' && a?.kind === 'sesion') return issueCode(id);
    return null;
  }, [patch, syncUp, issueCode]);

  const removeAppt = useCallback((id: string) => patch((s) => ({ appts: s.appts.filter((a) => a.id !== id) })), [patch]);

  // ---------- projects and clients
  const updateProject = useCallback((id: string, p: Partial<Project>) => patch((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) })), [patch]);
  const addNote = useCallback((id: string, text: string, by: string) => patch((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, notes: [...x.notes, { at: stampNow(), by, text }] } : x)) })), [patch]);
  const addClient = useCallback((c: Client) => patch((s) => ({ clients: [c, ...s.clients] })), [patch]);
  const updateClient = useCallback((id: string, p: Partial<Client>) => patch((s) => ({ clients: s.clients.map((x) => (x.id === id ? { ...x, ...p } : x)) })), [patch]);
  const signConsent = useCallback((clientId: string, health: HealthForm) => patch((s) => ({ clients: s.clients.map((c) => (c.id === clientId ? { ...c, consentSigned: true, health } : c)) })), [patch]);
  const forgetClient = useCallback((id: string) => {
    patch((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, name: 'Cliente eliminado', email: '', phone: '', health: undefined, marketing: false, deleted: true } : c)) }));
  }, [patch]);
  const payDeposit = useCallback((projectId: string) => {
    patch((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, deposit: { ...p.deposit, paid: true, at: stampNow() } } : p)),
      appts: s.appts.map((a) => (a.projectId === projectId && a.status === 'pendiente_senal' ? { ...a, status: 'confirmada', holdUntil: undefined } : a)),
    }));
  }, [patch]);

  // ---------- google calendar
  const connectGcal = useCallback((id: ArtistId) => {
    patch((s) => ({ gcal: { ...s.gcal, [id]: { ...s.gcal[id], connected: true, lastSync: stampNow(), error: undefined } } }));
    const pending = sRef.current.appts.filter((a) => a.artistId === id && a.gcal !== 'sincronizada' && a.status !== 'cancelada').map((a) => a.id);
    syncUp(pending, 'Primera sincronización');
  }, [patch, syncUp]);
  const disconnectGcal = useCallback((id: ArtistId) => patch((s) => ({ gcal: { ...s.gcal, [id]: { ...s.gcal[id], connected: false } } })), [patch]);
  const syncNow = useCallback(async (id: ArtistId) => {
    await wait(1100);
    patch((s) => ({
      gcal: { ...s.gcal, [id]: { ...s.gcal[id], lastSync: stampNow() } },
      syncLog: [{ id: uid('s'), at: stampNow(), artistId: id, dir: 'down' as const, text: 'Revisado: sin cambios en Google', ok: true }, ...s.syncLog],
    }));
  }, [patch]);
  const addBusy = useCallback((b: Omit<GoogleBusy, 'id' | 'receivedAt'>) => {
    const busy: GoogleBusy = { ...b, id: uid('gb'), receivedAt: stampNow() };
    patch((s) => ({
      busy: [...s.busy, busy],
      gcal: { ...s.gcal, [b.artistId]: { ...s.gcal[b.artistId], down: s.gcal[b.artistId].down + 1, lastSync: stampNow() } },
      syncLog: [{ id: uid('s'), at: stampNow(), artistId: b.artistId, dir: 'down' as const, text: `Ocupado ${hhmm(b.start)} a ${hhmm(b.end)}, ${dayLong(b.date)}`, ok: true }, ...s.syncLog],
    }));
    return busy;
  }, [patch]);
  const removeBusy = useCallback((id: string) => patch((s) => ({ busy: s.busy.filter((b) => b.id !== id) })), [patch]);

  // ---------- assistant sheet
  const saveKb = useCallback((k: KbEntry) => patch((s) => ({ kb: s.kb.some((x) => x.id === k.id) ? s.kb.map((x) => (x.id === k.id ? k : x)) : [k, ...s.kb] })), [patch]);
  const deleteKb = useCallback((id: string) => patch((s) => ({ kb: s.kb.filter((x) => x.id !== id) })), [patch]);
  const resolveUnanswered = useCallback((id: string) => patch((s) => ({ unanswered: s.unanswered.map((u) => (u.id === id ? { ...u, resolved: true } : u)) })), [patch]);

  // ---------- seo
  const updateSeo = useCallback((path: string, p: { title?: string; description?: string; keyword?: string }) => patch((s) => ({ seoPages: s.seoPages.map((x) => (x.path === path ? { ...x, ...p } : x)) })), [patch]);
  const setAlt = useCallback((id: string, alt: string) => patch((s) => ({ photoAlts: { ...s.photoAlts, [id]: alt } })), [patch]);

  // ---------- roulette
  const updatePrize = useCallback((id: string, p: Partial<Prize>) => patch((s) => ({ prizes: s.prizes.map((x) => (x.id === id ? { ...x, ...p } : x)) })), [patch]);
  const spin = useCallback((code: string): { ok: true; prize: Prize } | { ok: false; reason: string } => {
    const st = sRef.current;
    const c = st.codes.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
    if (!c) return { ok: false, reason: 'No encontramos ese código. Revisa la tarjeta que te dimos al terminar la sesión.' };
    if (c.usedAt) return { ok: false, reason: 'Este código ya se ha usado. Cada sesión terminada da un giro.' };
    const pool = st.prizes.filter((p) => p.active && p.weight > 0 && (p.stock === null || p.stock > 0));
    const total = pool.reduce((n, p) => n + p.weight, 0);
    let x = Math.random() * total;
    let prize = pool[0];
    for (const p of pool) if ((x -= p.weight) <= 0) { prize = p; break; }
    patch((s) => ({
      codes: s.codes.map((y) => (y.code === c.code ? { ...y, usedAt: stampNow(), prizeId: prize.id } : y)),
      prizes: s.prizes.map((p) => (p.id === prize.id && p.stock !== null ? { ...p, stock: p.stock - 1 } : p)),
      invites: [{ id: uid('i'), code: c.code, at: stampNow(), opened: false }, ...s.invites],
    }));
    return { ok: true, prize };
  }, [patch]);
  const openInvite = useCallback((code: string) => patch((s) => ({ invites: s.invites.map((i) => (i.code === code ? { ...i, opened: true } : i)) })), [patch]);
  const redeem = useCallback((code: string) => patch((s) => ({ codes: s.codes.map((c) => (c.code === code ? { ...c, redeemedAt: stampNow() } : c)) })), [patch]);
  const replyReview = useCallback((id: string, text: string) => patch((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, reply: text } : r)) })), [patch]);

  // ---------- people
  const login = useCallback(async (role: Role) => {
    await wait(700);
    patch(() => ({ user: role }));
  }, [patch]);
  const logout = useCallback(() => patch(() => ({ user: null })), [patch]);
  const updateArtist = useCallback((id: ArtistId, p: Partial<Artist>) => patch((s) => ({ artists: s.artists.map((a) => (a.id === id ? { ...a, ...p } : a)) })), [patch]);

  const setAttribution = useCallback((a: State['attribution']) => patch(() => ({ attribution: a })), [patch]);
  const setCookie = useCallback((v: 'granted' | 'denied') => {
    try {
      localStorage.setItem(COOKIE_KEY, v);
    } catch {}
    setCookieState(v);
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push(['consent', 'update', { ad_storage: v, analytics_storage: v, ad_user_data: v, ad_personalization: v }]);
  }, []);

  const reset = useCallback(() => {
    const user = sRef.current.user;
    setS(fresh({ user }));
    toast('Datos de la sesión reiniciados', 'info');
  }, [toast]);

  const artist = useCallback((id: string) => sRef.current.artists.find((a) => a.id === id) ?? artistById(id)!, []);

  return useMemo(
    () => ({
      s, ready, toasts, toast, typing, chatOpen, setChatOpen, cookie, setCookie, artist,
      createBooking, chatSend, chatReset, track,
      addAppt, updateAppt, setApptStatus, removeAppt, issueCode,
      updateProject, addNote, addClient, updateClient, signConsent, forgetClient, payDeposit,
      connectGcal, disconnectGcal, syncNow, addBusy, removeBusy,
      setPrivacy: (v: State['gcalPrivacy']) => patch(() => ({ gcalPrivacy: v })),
      saveKb, deleteKb, resolveUnanswered, updateSeo, setAlt,
      updatePrize, spin, openInvite, redeem, replyReview,
      login, logout, updateArtist, setAttribution, reset,
    }),
    [s, ready, toasts, toast, typing, chatOpen, cookie, setCookie, artist, createBooking, chatSend, chatReset, track, addAppt, updateAppt, setApptStatus, removeAppt, issueCode, updateProject, addNote, addClient, updateClient, signConsent, forgetClient, payDeposit, connectGcal, disconnectGcal, syncNow, addBusy, removeBusy, patch, saveKb, deleteKb, resolveUnanswered, updateSeo, setAlt, updatePrize, spin, openInvite, redeem, replyReview, login, logout, updateArtist, setAttribution, reset],
  );
}

export type Api = ReturnType<typeof useApi>;
const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}
