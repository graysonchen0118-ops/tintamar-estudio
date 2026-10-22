'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ArrowRight, ArrowLeft, ImagePlus, X, Info, Clock, Coins, Layers, CalendarCheck, Lock, CreditCard, Hourglass, Hand, RefreshCw } from 'lucide-react';
import { useStore, wait } from '@/lib/store';
import { STYLES, ZONES, STUDIO, styleBySlug, zoneById, type StyleSlug, type ZoneId, type ArtistId } from '@/lib/mock/studio';
import { estimate, sizeLabel } from '@/lib/estimate';
import { freeStarts } from '@/lib/availability';
import { addDays, todayIso, dayNum, monthShort, weekday, hhmm, dayLong, durLabel, cap } from '@/lib/dates';
import { DAY_SHORT } from '@/lib/mock/studio';
import { Pic, Avatar, Spinner, Sk } from '../ui';
import { BodyPicker } from '../three';
import { BandHead } from './Pages';
import { PHOTOS } from '@/lib/photos';

const BAND = [PHOTOS.plantillaMorada.id, PHOTOS.mesaDibujo.id, PHOTOS.estudioDosPuestos.id, PHOTOS.peoniaAntebrazo.id, PHOTOS.laminasPared.id];

type Side = 'izquierdo' | 'derecho' | null;
type Draft = {
  style: StyleSlug | null; description: string; references: string[];
  zone: ZoneId | null; side: Side; size: number; color: boolean;
  artist: ArtistId | 'cualquiera'; date: string | null; slot: { artistId: ArtistId; start: number } | null;
  name: string; email: string; phone: string; adult: boolean; privacy: boolean; marketing: boolean; pay: 'ahora' | 'despues';
};
const EMPTY: Draft = { style: null, description: '', references: [], zone: null, side: null, size: 8, color: false, artist: 'cualquiera', date: null, slot: null, name: '', email: '', phone: '', adult: false, privacy: false, marketing: false, pay: 'ahora' };
const STEPS = ['Tu idea', 'Zona y tamaño', 'Artista y fecha', 'Tus datos'];
const DRAFT_KEY = 'tintamar:reserva';

function shrink(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = 360 / Math.max(img.width, img.height);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * Math.min(1, s));
      c.height = Math.round(img.height * Math.min(1, s));
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = rej;
    img.src = url;
  });
}

export default function BookingView() {
  const { s, ready, createBooking, toast, artist } = useStore();
  const router = useRouter();
  const q = useSearchParams();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  // the draft survives a reload, and a link from a style or an artist page starts half filled
  useEffect(() => {
    let draft = EMPTY;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) draft = { ...EMPTY, ...JSON.parse(raw) };
    } catch {}
    const st = q.get('estilo') as StyleSlug | null;
    const ar = q.get('artista') as ArtistId | null;
    if (st && styleBySlug(st)) draft = { ...draft, style: st };
    if (ar) {
      const a = artist(ar);
      if (a) draft = { ...draft, artist: ar, style: draft.style && a.styles.includes(draft.style) ? draft.style : a.styles[0] };
    }
    setD(draft);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {}
  }, [d, loaded]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const zone = d.zone ? zoneById(d.zone)! : null;
  const est = useMemo(() => (d.style && d.zone ? estimate({ style: d.style, zone: d.zone, sizeCm: d.size, color: d.color, artistId: d.artist === 'cualquiera' ? null : d.artist }) : null), [d.style, d.zone, d.size, d.color, d.artist]);
  const candidates = useMemo(() => (d.style ? s.artists.filter((a) => a.visible && a.styles.includes(d.style!)) : []), [d.style, s.artists]);
  const ids: ArtistId[] = d.artist === 'cualquiera' ? candidates.map((a) => a.id) : [d.artist];
  const minutes = est?.firstMinutes ?? 60;

  const days = useMemo(() => {
    if (!ready || !est) return [];
    return Array.from({ length: 28 }, (_, i) => addDays(todayIso(), i)).map((date) => {
      const slots = ids.flatMap((id) => freeStarts(id, date, minutes, s.appts, s.busy).map((start) => ({ artistId: id, start })));
      slots.sort((a, b) => a.start - b.start);
      return { date, slots };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, est, ids.join(','), minutes, s.appts, s.busy]);
  const chosenDay = days.find((x) => x.date === d.date);

  // a slot taken in another tab, or blocked from Google Calendar, disappears from here at once
  useEffect(() => {
    if (!d.slot || !d.date || !ready || submitted.current) return;
    const still = freeStarts(d.slot.artistId, d.date, minutes, s.appts, s.busy).includes(d.slot.start);
    if (!still) {
      set({ slot: null });
      toast('Ese hueco acaba de ocuparse. Elige otro, por favor.', 'info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.appts, s.busy, minutes]);

  const validate = (i: number) => {
    const e: Record<string, string> = {};
    if (i === 0 && !d.style) e.style = 'Elige un estilo para seguir.';
    if (i === 1 && !d.zone) e.zone = 'Señala la zona en la figura o en la lista.';
    if (i === 1 && zone?.sided && !d.side) e.side = 'Dinos si es el lado izquierdo o el derecho.';
    if (i === 2 && !d.slot) e.slot = 'Elige un día y una hora.';
    if (i === 3) {
      if (d.name.trim().length < 2) e.name = 'Escribe tu nombre.';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) e.email = 'Revisa el correo.';
      if (d.phone.replace(/\D/g, '').length < 9) e.phone = 'Revisa el teléfono.';
      if (!d.adult) e.adult = 'Solo tatuamos a mayores de 18 años.';
      if (!d.privacy) e.privacy = 'Necesitamos que aceptes la política de privacidad.';
      if (d.pay === 'ahora') {
        if (card.number.replace(/\D/g, '').length < 16) e.card = 'Revisa el número de la tarjeta.';
        if (!/^\d{2}\/\d{2}$/.test(card.exp)) e.exp = 'Formato MM/AA.';
        if (card.cvc.length < 3) e.cvc = 'Tres cifras.';
      }
    }
    setErrors(e);
    return !Object.keys(e).length;
  };
  const next = () => validate(step) && setStep((x) => Math.min(3, x + 1));

  const submit = async () => {
    if (!validate(3) || !d.style || !d.zone || !d.slot || !d.date) return;
    setBusy(true);
    await wait(1400);
    if (d.pay === 'ahora' && card.number.replace(/\D/g, '').endsWith('0002')) {
      setBusy(false);
      setErrors({ card: 'El banco ha rechazado la tarjeta. Prueba con otra o elige pagar en 48 horas.' });
      return;
    }
    const still = freeStarts(d.slot.artistId, d.date, minutes, s.appts, s.busy).includes(d.slot.start);
    if (!still) {
      setBusy(false);
      setStep(2);
      set({ slot: null });
      toast('Alguien acaba de reservar ese hueco. Elige otro, por favor.', 'bad');
      return;
    }
    submitted.current = true;
    const res = createBooking({
      style: d.style, zone: d.zone, side: d.side, size: d.size, color: d.color, description: d.description.trim(), references: d.references,
      coverUp: d.style === 'cover-up', offer: { artistId: d.slot.artistId, date: d.date, start: d.slot.start, end: d.slot.start + minutes },
      name: d.name.trim(), email: d.email.trim(), phone: d.phone.trim(), marketing: d.marketing, payNow: d.pay === 'ahora', channel: 'web',
    });
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
    router.push(`/reservar/confirmada?codigo=${res.code}`);
  };

  if (!loaded) return <div className="wrap" style={{ padding: '40px 20px' }}><Sk h={420} r={22} /></div>;

  const chosenArtist = d.slot ? artist(d.slot.artistId) : d.artist !== 'cualquiera' ? artist(d.artist) : null;

  return (
    <>
    <BandHead photos={BAND}>
      <div className="stack enter" style={{ gap: 18 }}>
        <h1 className="h2">Reserva tu cita</h1>
        <div className="stepper" role="list">
          {STEPS.map((t, i) => (
            <button key={t} role="listitem" className={`s ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`} onClick={() => i < step && setStep(i)} disabled={i > step} aria-current={i === step ? 'step' : undefined}>
              <i>{i < step ? <Check size={13} /> : i + 1}</i>{t}
            </button>
          ))}
        </div>
      </div>
    </BandHead>
    <div className="wrap" style={{ paddingTop: 10, paddingBottom: 90 }}>
      <div className="book">
        <div className="book-main">
          {step === 0 && (
            <div className="panel-card" key="s0">
              <h2>¿Qué estilo tienes en mente?</h2>
              <div className="opt-grid">
                {STYLES.map((st) => (
                  <button key={st.slug} className={`opt ${d.style === st.slug ? 'on' : ''}`} onClick={() => set({ style: st.slug, artist: d.artist !== 'cualquiera' && !artist(d.artist).styles.includes(st.slug) ? 'cualquiera' : d.artist, slot: null })} aria-pressed={d.style === st.slug}>
                    <Pic k={st.cover} sizes="200px" ar="1:1" />
                    <span>{st.name}</span>
                    {d.style === st.slug && <i className="tick"><Check size={15} /></i>}
                  </button>
                ))}
              </div>
              {errors.style && <span className="err">{errors.style}</span>}
              {d.style === 'cover-up' && <div className="callout warm"><Info size={18} /><span>Para tapar un tatuaje empezamos con una consulta gratuita de 30 minutos. Al final reservas esa consulta, no la sesión.</span></div>}
              <label className="field">
                <span>Cuéntanos la idea con tus palabras</span>
                <textarea className="textarea" value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="Por ejemplo: una rama de olivo fina que siga la línea del antebrazo, sin sombra." maxLength={600} />
              </label>
              <div className="field">
                <span>Fotos de referencia (opcional, hasta 3)</span>
                <div className="refs">
                  {d.references.map((r, i) => (
                    <div key={i} className="ref">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r} alt={`Referencia ${i + 1}`} />
                      <button aria-label="Quitar referencia" onClick={() => set({ references: d.references.filter((_, j) => j !== i) })}><X size={12} /></button>
                    </div>
                  ))}
                  {d.references.length < 3 && (
                    <label className="upload" aria-label="Añadir foto de referencia">
                      <ImagePlus size={20} />
                      <input type="file" accept="image/*" hidden onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const url = await shrink(f);
                          set({ references: [...d.references, url] });
                        } catch {
                          toast('No hemos podido leer esa imagen', 'bad');
                        }
                        e.target.value = '';
                      }} />
                    </label>
                  )}
                </div>
                <span className="tiny" style={{ color: 'var(--cream-muted)' }}>Tu tatuador las verá junto a tu idea. Se usan como referencia, no como plantilla.</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="panel-card" key="s1">
              <h2>¿Dónde y de qué tamaño?</h2>
              <div className="body-wrap">
                <div className="body3d">
                  <BodyPicker zone={d.zone} side={d.side} sizeCm={d.size} onPick={(z, sd) => set({ zone: z, side: sd, size: Math.min(d.size, zoneById(z)!.maxCm), slot: null })} />
                  <span className="hint"><Hand size={13} /> Toca la zona o arrastra para girar</span>
                </div>
                <div className="stack" style={{ gap: 16 }}>
                  <div className="field">
                    <span>Zona</span>
                    <div className="zone-chips">
                      {ZONES.map((z) => (
                        <button key={z.id} className={`chip ${d.zone === z.id ? 'on' : ''}`} onClick={() => set({ zone: z.id, side: z.sided ? d.side ?? 'izquierdo' : null, size: Math.min(d.size, z.maxCm), slot: null })}>{z.name}</button>
                      ))}
                    </div>
                    {errors.zone && <span className="err">{errors.zone}</span>}
                  </div>
                  {zone?.sided && (
                    <div className="field">
                      <span>Lado</span>
                      <div className="row" style={{ gap: 6 }}>
                        {(['izquierdo', 'derecho'] as const).map((sd) => (
                          <button key={sd} className={`chip ${d.side === sd ? 'on' : ''}`} onClick={() => set({ side: sd })}>{sd === 'izquierdo' ? 'Izquierdo' : 'Derecho'}</button>
                        ))}
                      </div>
                      {errors.side && <span className="err">{errors.side}</span>}
                    </div>
                  )}
                  <label className="field">
                    <span>Tamaño: {d.size} cm, {sizeLabel(d.size).toLowerCase()} (el lado más largo)</span>
                    <input type="range" className="range" min={2} max={zone?.maxCm ?? 40} value={d.size} onChange={(e) => set({ size: Number(e.target.value), slot: null })} />
                  </label>
                  <div className="field">
                    <span>Color</span>
                    <div className="row" style={{ gap: 6 }}>
                      <button className={`chip ${!d.color ? 'on' : ''}`} onClick={() => set({ color: false, slot: null })}>Negro y gris</button>
                      <button className={`chip ${d.color ? 'on' : ''}`} onClick={() => set({ color: true, slot: null })}>Color</button>
                    </div>
                  </div>
                  {zone && zone.pain === 3 && <div className="callout warm"><Info size={18} /><span>{zone.name} es de las zonas que más molestan. Hacemos pausas, y por eso la sesión dura algo más.</span></div>}
                </div>
              </div>
              {est && (
                <div className="est enter" key={`${d.zone}${d.size}${d.color}`}>
                  <span className="tiny" style={{ color: 'var(--cream-muted)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>Lo que calculamos</span>
                  <div className="est-row">
                    <div><small>Duración</small><b>{est.sessions > 1 ? `${est.sessions} sesiones` : durLabel(est.firstMinutes)}</b></div>
                    <div><small>Horas en total</small><b>{est.hours} h</b></div>
                    <div><small>Precio orientativo</small><b>{est.priceMin} a {est.priceMax} €</b></div>
                  </div>
                  {est.reason && <span className="small">{est.reason}</span>}
                  {!est.reason && est.sessions > 1 && <span className="small">Reservas ahora la primera sesión de {durLabel(est.firstMinutes)}. Las siguientes se fijan con tu tatuador, con unas semanas de curación entre medias.</span>}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="panel-card" key="s2">
              <h2>{est?.firstKind === 'consulta' ? 'Elige día para la consulta' : 'Elige tatuador, día y hora'}</h2>
              <div className="artist-pick">
                <button className={`apick ${d.artist === 'cualquiera' ? 'on' : ''}`} onClick={() => set({ artist: 'cualquiera', slot: null })}>
                  <span className="avatar" style={{ display: 'grid', placeItems: 'center', background: 'var(--grad)' }}><RefreshCw size={18} color="#fff" /></span>
                  <span><b>El primero libre</b><br /><span className="tiny" style={{ color: 'var(--cream-muted)' }}>Cualquiera de {candidates.length}</span></span>
                </button>
                {candidates.map((a) => (
                  <button key={a.id} className={`apick ${d.artist === a.id ? 'on' : ''}`} onClick={() => set({ artist: a.id, slot: null, date: null })}>
                    <Avatar k={a.photo} size={46} />
                    <span><b>{a.name}</b><br /><span className="tiny" style={{ color: 'var(--cream-muted)' }}>{a.role}</span></span>
                  </button>
                ))}
              </div>
              <div className="callout"><CalendarCheck size={18} /><span>Ves solo los huecos donde caben {durLabel(minutes)} seguidas, con media hora para preparar el puesto, y sin lo que cada tatuador tiene ocupado en su calendario personal.</span></div>
              {!ready ? <Sk h={80} r={14} /> : (
                <div className="days" role="listbox" aria-label="Días">
                  {days.map((x) => (
                    <button key={x.date} className={`day-pill ${d.date === x.date ? 'on' : ''}`} disabled={!x.slots.length} onClick={() => set({ date: x.date, slot: null })} aria-selected={d.date === x.date}>
                      <span>{cap(DAY_SHORT[weekday(x.date)])}</span>
                      <b>{dayNum(x.date)}</b>
                      <span>{monthShort(x.date)}</span>
                      <span className="n">{x.slots.length ? `${x.slots.length} ${x.slots.length === 1 ? 'libre' : 'libres'}` : 'Completo'}</span>
                    </button>
                  ))}
                </div>
              )}
              {chosenDay && (
                <div className="stack enter" style={{ gap: 10 }} key={chosenDay.date}>
                  <b>{cap(dayLong(chosenDay.date))}</b>
                  <div className="times">
                    {chosenDay.slots.map((sl) => (
                      <button key={sl.artistId + sl.start} className={`time-btn ${d.slot?.start === sl.start && d.slot.artistId === sl.artistId ? 'on' : ''}`} onClick={() => set({ slot: sl })}>
                        {hhmm(sl.start)}{d.artist === 'cualquiera' && <span className="tiny" style={{ display: 'block', fontWeight: 600, opacity: 0.75 }}>{artist(sl.artistId).short}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {errors.slot && <span className="err">{errors.slot}</span>}
            </div>
          )}

          {step === 3 && (
            <div className="panel-card" key="s3">
              <h2>Tus datos y la señal</h2>
              <div className="form-grid">
                <label className="field"><span>Nombre</span><input className={`input ${errors.name ? 'bad' : ''}`} value={d.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" />{errors.name && <span className="err">{errors.name}</span>}</label>
                <label className="field"><span>Correo</span><input className={`input ${errors.email ? 'bad' : ''}`} type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" />{errors.email && <span className="err">{errors.email}</span>}</label>
                <label className="field"><span>Teléfono</span><input className={`input ${errors.phone ? 'bad' : ''}`} type="tel" value={d.phone} onChange={(e) => set({ phone: e.target.value })} autoComplete="tel" placeholder="612 345 678" />{errors.phone && <span className="err">{errors.phone}</span>}</label>
              </div>
              <div className="stack" style={{ gap: 10 }}>
                <label className="check"><input type="checkbox" checked={d.adult} onChange={(e) => set({ adult: e.target.checked })} /><span>Tengo 18 años o más y traeré mi DNI o pasaporte.</span></label>
                {errors.adult && <span className="err">{errors.adult}</span>}
                <label className="check"><input type="checkbox" checked={d.privacy} onChange={(e) => set({ privacy: e.target.checked })} /><span>He leído la <Link href="/privacidad" target="_blank" style={{ textDecoration: 'underline' }}>política de privacidad</Link> y acepto que el estudio use mis datos para gestionar la cita.</span></label>
                {errors.privacy && <span className="err">{errors.privacy}</span>}
                <label className="check"><input type="checkbox" checked={d.marketing} onChange={(e) => set({ marketing: e.target.checked })} /><span>Quiero recibir avisos de huecos libres y láminas nuevas (opcional, puedes darte de baja cuando quieras).</span></label>
              </div>
              <div className="field">
                <span>Señal de {STUDIO.deposit} €, que se descuenta del precio final</span>
                <div className="row wrapflex" style={{ gap: 8 }}>
                  <button className={`chip ${d.pay === 'ahora' ? 'on' : ''}`} onClick={() => set({ pay: 'ahora' })}><CreditCard size={14} /> Pagar ahora</button>
                  <button className={`chip ${d.pay === 'despues' ? 'on' : ''}`} onClick={() => set({ pay: 'despues' })}><Hourglass size={14} /> Pagar en 48 horas</button>
                </div>
              </div>
              {d.pay === 'ahora' ? (
                <div className="form-grid enter">
                  <label className="field" style={{ gridColumn: '1 / -1' }}><span>Número de tarjeta</span><input className={`input ${errors.card ? 'bad' : ''}`} inputMode="numeric" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) })} placeholder="4242 4242 4242 4242" autoComplete="cc-number" />{errors.card && <span className="err">{errors.card}</span>}</label>
                  <label className="field"><span>Caducidad</span><input className={`input ${errors.exp ? 'bad' : ''}`} value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value.slice(0, 5) })} placeholder="MM/AA" autoComplete="cc-exp" />{errors.exp && <span className="err">{errors.exp}</span>}</label>
                  <label className="field"><span>CVC</span><input className={`input ${errors.cvc ? 'bad' : ''}`} inputMode="numeric" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" autoComplete="cc-csc" />{errors.cvc && <span className="err">{errors.cvc}</span>}</label>
                  <span className="tiny row" style={{ gap: 6, color: 'var(--cream-muted)', gridColumn: '1 / -1' }}><Lock size={12} /> Pago cifrado. El estudio nunca ve el número de tu tarjeta.</span>
                </div>
              ) : (
                <div className="callout enter"><Hourglass size={18} /><span>Te guardamos el hueco 48 horas. Te enviamos el enlace de pago por correo, y también puedes pagar desde Mi cita con tu código.</span></div>
              )}
            </div>
          )}

          <div className="row between">
            <button className="btn btn-ghost" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}><ArrowLeft size={17} /> Atrás</button>
            {step < 3 ? (
              <button className="btn btn-primary" onClick={next}>Seguir <ArrowRight size={17} /></button>
            ) : (
              <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? <><Spinner /> Reservando</> : <>{d.pay === 'ahora' ? `Pagar ${STUDIO.deposit} € y reservar` : 'Reservar y pagar después'} <Check size={17} /></>}</button>
            )}
          </div>
        </div>

        <aside className="book-side">
          <div className="summary">
            <b style={{ fontSize: 17 }}>Tu reserva</b>
            <div className="line"><span>Estilo</span><span>{d.style ? styleBySlug(d.style)!.name : 'Sin elegir'}</span></div>
            <div className="line"><span>Zona</span><span>{zone ? `${zone.name}${d.side ? `, ${d.side}` : ''}` : 'Sin elegir'}</span></div>
            <div className="line"><span>Tamaño</span><span>{d.size} cm, {d.color ? 'color' : 'negro y gris'}</span></div>
            {est && <div className="line"><span><Clock size={13} style={{ verticalAlign: -2 }} /> {est.firstKind === 'consulta' ? 'Consulta' : 'Sesión'}</span><span>{durLabel(est.firstMinutes)}{est.sessions > 1 ? ` (de ${est.sessions})` : ''}</span></div>}
            {est && <div className="line"><span><Coins size={13} style={{ verticalAlign: -2 }} /> Orientativo</span><span>{est.priceMin} a {est.priceMax} €</span></div>}
            <div className="line"><span>Tatuador</span><span>{chosenArtist ? chosenArtist.name : 'El primero libre'}</span></div>
            <div className="line"><span>Cuándo</span><span>{d.slot && d.date ? `${cap(dayLong(d.date))}, ${hhmm(d.slot.start)}` : 'Sin elegir'}</span></div>
            <div className="line"><span><Layers size={13} style={{ verticalAlign: -2 }} /> Señal</span><span>{STUDIO.deposit} €, se descuenta</span></div>
          </div>
          <div className="callout"><Info size={18} /><span>Tu tatuador ve tu idea y tus referencias en su panel nada más reservar, y te enseña el diseño antes de la cita.</span></div>
        </aside>
      </div>
    </div>
    </>
  );
}
