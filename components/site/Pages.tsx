'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarCheck, ChevronRight, ArrowUpRight, Languages, Quote, Plus, Clock, Coins, Layers } from 'lucide-react';
import { useStore } from '@/lib/store';
import { ARTISTS, STYLES, ZONES, styleBySlug, artistBySlug, type StyleSlug, type ZoneId } from '@/lib/mock/studio';
import { PHOTOS, type PhotoKey } from '@/lib/photos';
import { firstFree, freeStarts, dayHours } from '@/lib/availability';
import { estimate } from '@/lib/estimate';
import { addDays, todayIso, dayShort, hhmm, weekday, dayNum, durLabel, cap } from '@/lib/dates';
import { DAY_SHORT } from '@/lib/mock/studio';
import { Pic, Tilt, Reveal, Stars, Sk } from '../ui';
import { Backdrop } from '../three';
import Lightbox from './Lightbox';

/** A slim header with the same layered depth, for pages where the content has to start high. */
export function BandHead({ photos, children }: { photos: string[]; children: React.ReactNode }) {
  return (
    <section className="phead band">
      <Backdrop photos={photos} />
      <div className="wrap">{children}</div>
    </section>
  );
}

export function PageHead({ crumbs, title, lead, photos, children }: { crumbs: { href?: string; label: string }[]; title: string; lead?: string; photos: string[]; children?: React.ReactNode }) {
  return (
    <section className="phead">
      <Backdrop photos={photos} />
      <div className="wrap">
        <nav className="crumbs" aria-label="Ruta">
          {crumbs.map((c, i) => (
            <span key={c.label} className="row" style={{ gap: 8 }}>
              {i > 0 && <ChevronRight size={13} />}
              {c.href ? <Link href={c.href}>{c.label}</Link> : <span style={{ color: '#fff' }}>{c.label}</span>}
            </span>
          ))}
        </nav>
        <div className="stack enter" style={{ gap: 16, maxWidth: 720 }}>
          <h1 className="display" style={{ fontSize: 'clamp(34px, 5.4vw, 64px)' }}>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

function NextSlotLine({ id, minutes = 120 }: { id: string; minutes?: number }) {
  const { s, ready } = useStore();
  const slot = useMemo(() => (ready ? firstFree(id as never, minutes, s.appts, s.busy) : null), [ready, id, minutes, s.appts, s.busy]);
  if (!ready) return <Sk h={36} r={12} />;
  return (
    <div className="next-slot">
      <CalendarCheck size={15} />
      {slot ? <span>Próximo hueco de {durLabel(minutes)}: <b>{cap(dayShort(slot.date))}, {hhmm(slot.start)}</b></span> : <span>Agenda completa este mes</span>}
    </div>
  );
}

function ArtistCard({ id, i }: { id: string; i: number }) {
  const { artist } = useStore();
  const a = artist(id);
  return (
    <Reveal delay={(i % 3) * 70}>
      <Tilt max={6}>
        <Link href={`/artistas/${a.slug}`} className="artist-card">
          <div className="portrait"><Pic k={a.photo} sizes="(max-width: 640px) 100vw, 380px" ar="1:1" /></div>
          <div className="body">
            <div>
              <div className="name">{a.name}</div>
              <div className="role">{a.role}</div>
            </div>
            <div className="row wrapflex" style={{ gap: 6 }}>
              {a.styles.map((st) => <span key={st} className="chip" style={{ minHeight: 28, fontSize: 12 }}>{styleBySlug(st)!.name}</span>)}
            </div>
            <NextSlotLine id={a.id} />
          </div>
        </Link>
      </Tilt>
    </Reveal>
  );
}

export function ArtistsView() {
  const [f, setF] = useState<StyleSlug | 'todos'>('todos');
  const { s } = useStore();
  const list = s.artists.filter((a) => a.visible && (f === 'todos' || a.styles.includes(f)));
  return (
    <>
      <PageHead crumbs={[{ href: '/', label: 'Inicio' }, { label: 'Artistas' }]} title="Seis tatuadores, cada uno con su estilo" lead="Elige por estilo y mira el próximo hueco libre de cada uno. Es su agenda real, la misma que ven ellos en su móvil." photos={[PHOTOS.estudioDosPuestos.id, PHOTOS.lua.id, PHOTOS.iker.id, PHOTOS.ruben.id, PHOTOS.dani.id, PHOTOS.laminasPared.id]} />
      <section className="sec" style={{ paddingTop: 24 }}>
        <div className="wrap stack" style={{ gap: 24 }}>
          <div className="row wrapflex" style={{ gap: 8 }}>
            <button className={`chip ${f === 'todos' ? 'on' : ''}`} onClick={() => setF('todos')}>Todos</button>
            {STYLES.map((st) => (
              <button key={st.slug} className={`chip ${f === st.slug ? 'on' : ''}`} onClick={() => setF(st.slug)}>{st.name}</button>
            ))}
          </div>
          <div className="artists-grid">
            {list.map((a, i) => <ArtistCard key={a.id} id={a.id} i={i} />)}
          </div>
        </div>
      </section>
    </>
  );
}

function WeekStrip({ id }: { id: string }) {
  const { s, ready } = useStore();
  const days = useMemo(() => {
    if (!ready) return [];
    return Array.from({ length: 14 }, (_, i) => addDays(todayIso(), i)).map((d) => {
      const h = dayHours(id as never, d);
      const free = h ? freeStarts(id as never, d, 60, s.appts, s.busy).length : 0;
      return { d, open: !!h, free };
    });
  }, [ready, id, s.appts, s.busy]);
  if (!ready) return <Sk h={70} r={14} />;
  return (
    <div className="week-strip">
      {days.map((x) => (
        <div key={x.d} className={`wday ${!x.open ? 'off' : x.free ? 'free' : ''}`}>
          <span>{cap(DAY_SHORT[weekday(x.d)])}</span>
          <b>{dayNum(x.d)}</b>
          <span>{!x.open ? 'No trabaja' : x.free ? `${x.free} huecos` : 'Completo'}</span>
        </div>
      ))}
    </div>
  );
}

export function ArtistView({ slug }: { slug: string }) {
  const base = artistBySlug(slug)!;
  const { s, artist, ready } = useStore();
  const a = artist(base.id);
  const [box, setBox] = useState<number | null>(null);
  const reviews = s.reviews.filter((r) => r.artistId === a.id).slice(0, 3);
  return (
    <>
      <PageHead crumbs={[{ href: '/', label: 'Inicio' }, { href: '/artistas', label: 'Artistas' }, { label: a.name }]} title={a.name} lead={a.role} photos={a.portfolio.map((k) => PHOTOS[k].id)}>
        <div className="row wrapflex" style={{ gap: 10 }}>
          <Link href={`/reservar?artista=${a.id}`} className="btn btn-primary"><CalendarCheck size={18} /> Reservar con {a.short}</Link>
          <a href="#trabajos" className="btn btn-ghost">Ver trabajos</a>
        </div>
      </PageHead>
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap profile">
          <Reveal>
            <Tilt max={5}>
              <div className="portrait"><Pic k={a.photo} sizes="(max-width: 640px) 100vw, 520px" ar="4:5" priority /></div>
            </Tilt>
          </Reveal>
          <Reveal delay={100}>
            <div className="stack" style={{ gap: 22 }}>
              <p className="quote"><Quote size={20} style={{ display: 'inline', marginRight: 8, color: 'var(--accent-2)' }} />{a.quote}</p>
              <p className="lead" style={{ maxWidth: 'none' }}>{a.bio}</p>
              <div className="row wrapflex" style={{ gap: 8 }}>
                {a.styles.map((st) => <Link key={st} href={`/estilos/${st}`} className="chip">{styleBySlug(st)!.name}</Link>)}
                <span className="chip"><Languages size={14} /> {a.languages.join(', ')}</span>
                <span className="chip">Tatuando desde {a.since}</span>
              </div>
              <div className="stack" style={{ gap: 10 }}>
                <b>Sus próximas dos semanas</b>
                <WeekStrip id={a.id} />
                <span className="small" style={{ color: 'var(--cream-muted)' }}>Huecos de una hora o más, ya descontando sus citas y lo que tiene ocupado en su calendario personal.</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="sec night2" id="trabajos">
        <div className="wrap">
          <Reveal className="sec-head"><span className="eyebrow">Trabajos</span><h2 className="h2">Lo que ha tatuado {a.short}</h2></Reveal>
          <div className="gallery">
            {a.portfolio.map((k, i) => (
              <Reveal key={k} delay={(i % 3) * 80}>
                <button className="g-item" onClick={() => setBox(i)} aria-label={`Ampliar: ${PHOTOS[k].alt}`}>
                  <Pic k={k} box={i % 3 === 1 ? '1 / 1' : '4 / 5'} ar={i % 3 === 1 ? '1:1' : '4:5'} sizes="(max-width: 640px) 100vw, 400px" />
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {box !== null && <Lightbox items={a.portfolio.map((k) => ({ k, caption: `${PHOTOS[k].alt}. Trabajo de ${a.name}.` }))} index={box} onClose={() => setBox(null)} onIndex={setBox} />}
      {(reviews.length > 0 || !ready) && (
        <section className="sec paper">
          <div className="wrap">
            <Reveal className="sec-head"><span className="eyebrow">Opiniones en Google</span><h2 className="h2">Quien ya se tatuó con {a.short}</h2></Reveal>
            <div className="reviews">
              {ready ? reviews.map((r) => (
                <article key={r.id} className="review">
                  <div className="who"><span>{r.author}</span><Stars value={r.rating} /></div>
                  <p>{r.text}</p>
                  <span className="tiny muted">{dayShort(r.date)}</span>
                </article>
              )) : [0, 1, 2].map((i) => <Sk key={i} h={140} r={18} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function StylesIndex() {
  return (
    <>
      <PageHead crumbs={[{ href: '/', label: 'Inicio' }, { label: 'Estilos' }]} title="Estilos de tatuaje" lead="Cada estilo tiene su página: cómo lo trabajamos, qué precio tiene, quién lo hace y sus trabajos." photos={STYLES.map((s) => PHOTOS[s.cover].id)} />
      <section className="sec" style={{ paddingTop: 24 }}>
        <div className="wrap styles-grid">
          {STYLES.map((st, i) => (
            <Reveal key={st.slug} delay={i * 60}>
              <Tilt>
                <Link href={`/estilos/${st.slug}`} className="style-card">
                  <Pic k={st.cover} sizes="(max-width: 640px) 100vw, 320px" ar="4:5" />
                  <span className="go"><ArrowUpRight size={18} /></span>
                  <div className="cap">
                    <h3>{st.name}</h3>
                    <p>{st.short}</p>
                    <span className="tiny" style={{ color: 'var(--accent-2)', fontWeight: 700 }}>Desde {st.priceFrom} €</span>
                  </div>
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

const EXAMPLES: Record<StyleSlug, [ZoneId, number, boolean][]> = {
  'fine-line': [['muneca', 5, false], ['antebrazo', 12, false], ['muslo', 20, false]],
  realismo: [['antebrazo', 10, false], ['brazo', 16, false], ['muslo', 25, false]],
  tradicional: [['antebrazo', 8, true], ['gemelo', 14, true], ['pecho', 24, true]],
  japones: [['antebrazo', 16, true], ['muslo', 30, true], ['espalda', 50, true]],
  blackwork: [['muneca', 7, false], ['antebrazo', 14, false], ['muslo', 28, false]],
  lettering: [['muneca', 5, false], ['costillas', 12, false], ['espalda', 22, false]],
  'cover-up': [['muneca', 8, false], ['hombro', 18, false], ['espalda', 30, false]],
};

export function StyleView({ slug }: { slug: string }) {
  const st = styleBySlug(slug)!;
  const { s } = useStore();
  const [box, setBox] = useState<number | null>(null);
  const artists = s.artists.filter((a) => a.visible && a.styles.includes(st.slug));
  return (
    <>
      <PageHead crumbs={[{ href: '/', label: 'Inicio' }, { href: '/estilos', label: 'Estilos' }, { label: st.name }]} title={st.title} lead={st.intro} photos={st.gallery.map((k) => PHOTOS[k].id)}>
        <div className="row wrapflex" style={{ gap: 10 }}>
          <Link href={`/reservar?estilo=${st.slug}`} className="btn btn-primary"><CalendarCheck size={18} /> {st.slug === 'cover-up' ? 'Pedir consulta gratuita' : 'Reservar cita'}</Link>
          <span className="chip"><Coins size={14} /> Desde {st.priceFrom} €</span>
        </div>
      </PageHead>
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap stack" style={{ gap: 40 }}>
          <div className="points">
            {st.points.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div className="point"><h3>{p.title}</h3><p>{p.text}</p></div>
              </Reveal>
            ))}
          </div>
          <div className="gallery">
            {st.gallery.map((k, i) => (
              <Reveal key={k} delay={(i % 3) * 80}>
                <button className="g-item" onClick={() => setBox(i)} aria-label={`Ampliar: ${PHOTOS[k].alt}`}>
                  <Pic k={k} box={i % 2 ? '1 / 1' : '4 / 5'} ar={i % 2 ? '1:1' : '4:5'} sizes="(max-width: 640px) 100vw, 400px" />
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      {box !== null && <Lightbox items={st.gallery.map((k) => ({ k, caption: PHOTOS[k].alt }))} index={box} onClose={() => setBox(null)} onIndex={setBox} />}
      <section className="sec paper">
        <div className="wrap">
          <Reveal className="sec-head">
            <span className="eyebrow">Precio orientativo</span>
            <h2 className="h2">Cuánto cuesta y cuánto dura</h2>
            <p className="lead">Calculado igual que en la reserva: tamaño, zona y estilo. El precio final lo confirma tu tatuador al ver el diseño.</p>
          </Reveal>
          <div className="steps">
            {EXAMPLES[st.slug].map(([z, cm, color]) => {
              const e = estimate({ style: st.slug, zone: z, sizeCm: cm, color });
              const zone = ZONES.find((x) => x.id === z)!;
              return (
                <div key={z + cm} className="step">
                  <span className="n"><Layers size={20} /></span>
                  <h3>{zone.name}, {cm} cm</h3>
                  <p><Clock size={14} style={{ display: 'inline', verticalAlign: -2 }} /> {e.sessions > 1 ? `${e.sessions} sesiones, unas ${e.hours} h en total` : `${durLabel(e.firstKind === 'consulta' ? Math.round(e.hours * 60) : e.firstMinutes)} de sesión`}</p>
                  <b style={{ fontSize: 20 }}>{e.priceMin} a {e.priceMax} €</b>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="sec night2">
        <div className="wrap">
          <Reveal className="sec-head"><span className="eyebrow">Quién lo hace</span><h2 className="h2">Tatuadores de {st.name.toLowerCase()}</h2></Reveal>
          <div className="artists-grid">
            {artists.map((a, i) => <ArtistCard key={a.id} id={a.id} i={i} />)}
          </div>
        </div>
      </section>
      <section className="sec paper">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <Reveal className="sec-head"><span className="eyebrow">Dudas</span><h2 className="h2">Preguntas sobre {st.name.toLowerCase()}</h2></Reveal>
          <div className="faq">
            {st.faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q} <Plus size={18} /></summary>
                <div className="ans">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export const photoKeys = (ks: PhotoKey[]) => ks.map((k) => PHOTOS[k].id);
