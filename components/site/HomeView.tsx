'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarCheck, Star, ShieldCheck, Coins, ArrowUpRight, ArrowRight, MapPin, Clock, Languages, CreditCard, Sparkles, Plus, MessageCircle, MousePointer2, Ruler, PenLine, Gift } from 'lucide-react';
import { useStore } from '@/lib/store';
import { STUDIO, STYLES, ARTISTS, KB, DAY_NAMES } from '@/lib/mock/studio';
import { PHOTOS, type PhotoKey } from '@/lib/photos';
import { firstFree } from '@/lib/availability';
import { dayShort, hhmm, weekday, todayIso, cap } from '@/lib/dates';
import { Pic, Tilt, Reveal, Layer, Stars, Sk } from '../ui';
import { HeroScene } from '../three';
import Lightbox from './Lightbox';

const HERO_PHOTOS = [PHOTOS.peoniaAntebrazo.id, PHOTOS.leon.id, PHOTOS.golondrinas.id, PHOTOS.dragonColor.id, PHOTOS.geometrico.id, PHOTOS.respira.id, PHOTOS.floresMuslo.id, PHOTOS.calavera.id];

const GALLERY: { k: PhotoKey; a: string }[] = [
  { k: 'peoniaAntebrazo', a: 'lua' }, { k: 'leon', a: 'dani' }, { k: 'golondrinas', a: 'marta' }, { k: 'dragonColor', a: 'iker' },
  { k: 'respira', a: 'noa' }, { k: 'geometrico', a: 'ruben' }, { k: 'floresMuslo', a: 'lua' }, { k: 'retratoMuslo', a: 'dani' },
  { k: 'rana', a: 'marta' }, { k: 'serpiente', a: 'iker' }, { k: 'mandalaCuello', a: 'ruben' }, { k: 'espaldaLetras', a: 'noa' },
];
const RATIOS = ['4:5', '1:1', '4:5', '3:4', '1:1', '4:5', '3:4', '4:5', '1:1', '4:5', '3:4', '1:1'];

function NextSlot({ id }: { id: string }) {
  const { s, ready } = useStore();
  const slot = useMemo(() => (ready ? firstFree(id as never, 120, s.appts, s.busy) : null), [ready, id, s.appts, s.busy]);
  if (!ready) return <Sk h={36} r={12} />;
  return (
    <div className="next-slot">
      <CalendarCheck size={15} />
      {slot ? <span>Próximo hueco de 2 h: <b>{cap(dayShort(slot.date))}, {hhmm(slot.start)}</b></span> : <span>Agenda completa este mes</span>}
    </div>
  );
}

export default function HomeView() {
  const { s, ready, setChatOpen } = useStore();
  const [box, setBox] = useState<number | null>(null);
  const kb = s.kb.length ? s.kb : KB;
  const faqs = ['precios', 'senal', 'duracion', 'cuidados', 'cover', 'edad', 'cancelar'].map((id) => kb.find((k) => k.id === id)).filter(Boolean);
  const reviews = s.reviews.slice(0, 6);
  const today = ready ? weekday(todayIso()) : -1;

  return (
    <>
      <section className="hero">
        <div className="hero-still" />
        <HeroScene photos={HERO_PHOTOS} />
        <div className="hero-shade" />
        <div className="wrap">
          <div className="hero-in enter">
            <span className="eyebrow"><MapPin size={14} /> Estudio de tatuaje en el Soho de Málaga</span>
            <h1 className="display">Tu idea, dibujada <span className="grad-text">a tu medida</span></h1>
            <p className="lead">Seis tatuadores, siete estilos y una agenda que puedes consultar ahora mismo. Cuéntanos qué quieres, dónde y de qué tamaño, y te enseñamos los huecos libres reales con el precio orientativo.</p>
            <div className="hero-cta">
              <Link href="/reservar" className="btn btn-primary"><CalendarCheck size={18} /> Reservar cita</Link>
              <button className="btn btn-ghost" onClick={() => setChatOpen(true)}><MessageCircle size={18} /> Preguntar al asistente</button>
            </div>
            <div className="trust">
              <span><Star size={15} fill="currentColor" /> {String(STUDIO.rating).replace('.', ',')} en Google, {STUDIO.reviewCount} opiniones</span>
              <span><ShieldCheck size={15} /> Agujas de un solo uso, abiertas delante de ti</span>
              <span><Coins size={15} /> Señal de 50 € que se descuenta</span>
            </div>
          </div>
        </div>
        <div className="hero-hint"><MousePointer2 size={14} /> Mueve el ratón, el diseño se sigue dibujando</div>
      </section>

      <section className="sec" id="estilos">
        <div className="wrap">
          <Reveal className="sec-head row-head">
            <div className="stack" style={{ gap: 12, maxWidth: 640 }}>
              <span className="eyebrow">Estilos</span>
              <h2 className="h2">Cada estilo tiene su tatuador</h2>
              <p className="lead">No hacemos de todo un poco. Cada página explica cómo trabajamos ese estilo, qué precio tiene y quién lo hace.</p>
            </div>
            <Link href="/estilos" className="btn btn-ghost">Ver todos <ArrowRight size={16} /></Link>
          </Reveal>
          <div className="styles-grid">
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
        </div>
      </section>

      <section className="sec night2" id="artistas">
        <div className="wrap">
          <Reveal className="sec-head row-head">
            <div className="stack" style={{ gap: 12, maxWidth: 640 }}>
              <span className="eyebrow">El equipo</span>
              <h2 className="h2">Seis tatuadores, seis agendas</h2>
              <p className="lead">El hueco que ves es el de su agenda de verdad, la misma que miran ellos cada mañana.</p>
            </div>
            <Link href="/artistas" className="btn btn-ghost">Conocerlos <ArrowRight size={16} /></Link>
          </Reveal>
          <div className="artists-grid">
            {ARTISTS.map((a, i) => (
              <Reveal key={a.id} delay={i * 70}>
                <Tilt max={6}>
                  <Link href={`/artistas/${a.slug}`} className="artist-card">
                    <div className="portrait"><Pic k={a.photo} sizes="(max-width: 640px) 100vw, 380px" ar="1:1" /></div>
                    <div className="body">
                      <div>
                        <div className="name">{a.name}</div>
                        <div className="role">{a.role}</div>
                      </div>
                      <div className="row wrapflex" style={{ gap: 6 }}>
                        {a.styles.map((st) => <span key={st} className="chip" style={{ minHeight: 28, fontSize: 12 }}>{STYLES.find((x) => x.slug === st)!.name}</span>)}
                      </div>
                      <NextSlot id={a.id} />
                    </div>
                  </Link>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sec paper">
        <div className="wrap">
          <Reveal className="sec-head">
            <span className="eyebrow">Cómo se reserva</span>
            <h2 className="h2">De la idea a la camilla, sin esperar respuesta</h2>
            <p className="lead">Un tatuaje en las costillas no cabe en el hueco de una hora que dejó libre un retoque. Por eso primero calculamos cuánto dura el tuyo, y luego te enseñamos solo los huecos donde cabe entero.</p>
          </Reveal>
          <div className="steps">
            {[
              { icon: PenLine, t: 'Cuéntanos la idea', p: 'Estilo, una frase sobre lo que quieres y, si tienes, fotos de referencia.' },
              { icon: Ruler, t: 'Zona y tamaño', p: 'Lo señalas sobre una figura. Con eso calculamos las horas y el precio orientativo.' },
              { icon: CalendarCheck, t: 'Hueco real', p: 'Ves los días libres de tu tatuador con la duración exacta de tu tatuaje.' },
              { icon: Coins, t: 'Señal y diseño', p: 'Pagas 50 € que se descuentan, y tu tatuador te enseña el diseño antes de la cita.' },
            ].map((st, i) => (
              <Layer key={st.t} speed={0.04 + i * 0.025}>
                <Reveal delay={i * 90}>
                  <div className="step">
                    <span className="n"><st.icon size={20} /></span>
                    <h3>{i + 1}. {st.t}</h3>
                    <p>{st.p}</p>
                  </div>
                </Reveal>
              </Layer>
            ))}
          </div>
          <div className="row wrapflex" style={{ marginTop: 28, gap: 12 }}>
            <Link href="/reservar" className="btn btn-primary"><CalendarCheck size={18} /> Empezar mi reserva</Link>
            <span className="small muted">Tarda unos dos minutos.</span>
          </div>
        </div>
      </section>

      <section className="sec" id="trabajos">
        <div className="wrap">
          <Reveal className="sec-head">
            <span className="eyebrow">Trabajos recientes</span>
            <h2 className="h2">Lo último que ha salido del estudio</h2>
          </Reveal>
          <div className="gallery">
            {GALLERY.map((g, i) => {
              const a = ARTISTS.find((x) => x.id === g.a)!;
              return (
                <Reveal key={g.k} delay={(i % 3) * 80}>
                  <button className="g-item" onClick={() => setBox(i)} aria-label={`Ampliar: ${PHOTOS[g.k].alt}`}>
                    <Pic k={g.k} box={RATIOS[i].replace(':', ' / ')} ar={RATIOS[i]} sizes="(max-width: 640px) 100vw, 400px" />
                    <span className="tag">{a.name}</span>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
      {box !== null && <Lightbox items={GALLERY.map((g) => ({ k: g.k, caption: `${PHOTOS[g.k].alt}. Trabajo de ${ARTISTS.find((a) => a.id === g.a)!.name}.` }))} index={box} onClose={() => setBox(null)} onIndex={setBox} />}

      <section className="sec paper">
        <div className="wrap">
          <Reveal className="sec-head row-head">
            <div className="stack" style={{ gap: 12 }}>
              <span className="eyebrow">Opiniones en Google</span>
              <h2 className="h2">Lo que cuentan al salir</h2>
            </div>
            <div className="g-badge">
              <b>{String(STUDIO.rating).replace('.', ',')}</b>
              <div className="stack" style={{ gap: 2 }}>
                <Stars value={5} size={16} />
                <span className="small muted">{STUDIO.reviewCount} opiniones en Google</span>
              </div>
            </div>
          </Reveal>
          <div className="reviews">
            {ready
              ? reviews.map((r, i) => (
                  <Reveal key={r.id} delay={(i % 3) * 80}>
                    <article className="review">
                      <div className="who"><span>{r.author}</span><Stars value={r.rating} /></div>
                      <p>{r.text}</p>
                      <span className="tiny muted">{dayShort(r.date)}{r.artistId ? ` · con ${ARTISTS.find((a) => a.id === r.artistId)!.short}` : ''}</span>
                    </article>
                  </Reveal>
                ))
              : Array.from({ length: 6 }).map((_, i) => <Sk key={i} h={150} r={18} />)}
          </div>
        </div>
      </section>

      <section className="sec" id="estudio">
        <div className="wrap studio-grid">
          <Layer speed={0.06}>
            <div className="photo-stack">
              <div className="ph ph1"><Pic k="estudioDosPuestos" sizes="(max-width: 640px) 90vw, 520px" ar="1:1" /></div>
              <div className="ph ph2"><Pic k="malagaSoho" sizes="(max-width: 640px) 70vw, 380px" ar="1:1" /></div>
            </div>
          </Layer>
          <Reveal>
            <div className="stack" style={{ gap: 22 }}>
              <span className="eyebrow">El estudio</span>
              <h2 className="h2">Un local pequeño en el Soho, con seis puestos y mucha luz</h2>
              <p className="lead">Cada puesto se limpia y se vuelve a montar entre sesión y sesión. Por eso entre dos citas siempre queda media hora, y por eso la agenda nunca te ofrecerá un hueco pegado a otro.</p>
              <div className="info-list">
                <div><span className="ico"><MapPin size={19} /></span><div><b>{STUDIO.street}</b><div className="small" style={{ color: 'var(--cream-muted)' }}>{STUDIO.zip} {STUDIO.city}. A cinco minutos andando de la Alameda Principal.</div></div></div>
                <div>
                  <span className="ico"><Clock size={19} /></span>
                  <div className="hours">
                    {DAY_NAMES.map((d, i) => {
                      const h = STUDIO.hours[i];
                      return (
                        <span key={d} style={{ display: 'contents' }}>
                          <span className={i === today ? 'today' : ''}>{cap(d)}</span>
                          <span className={i === today ? 'today' : ''}>{h ? `${hhmm(h.open)} a ${hhmm(h.close)}` : 'Cerrado'}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div><span className="ico"><Languages size={19} /></span><div><b>Español, inglés y francés</b><div className="small" style={{ color: 'var(--cream-muted)' }}>Y algo de italiano, gallego, euskera y catalán.</div></div></div>
                <div><span className="ico"><CreditCard size={19} /></span><div><b>Tarjeta, Bizum y efectivo</b><div className="small" style={{ color: 'var(--cream-muted)' }}>La señal se paga online al reservar.</div></div></div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec paper">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <Reveal className="sec-head">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2 className="h2">Lo que más nos preguntan</h2>
            <p className="lead">Son las mismas respuestas que da el asistente, escritas por el equipo.</p>
          </Reveal>
          <div className="faq">
            {faqs.map((k) => (
              <details key={k!.id}>
                <summary>{k!.topic} <Plus size={18} /></summary>
                <div className="ans">{k!.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Reveal>
            <div className="cta-band">
              <div className="bg"><Pic k="estudioNoche" sizes="100vw" ar="16:7" /></div>
              <span className="eyebrow"><Gift size={14} /> Después de tu sesión</span>
              <h2 className="h2" style={{ maxWidth: 640 }}>Al terminar, una tarjeta con tu giro en la ruleta</h2>
              <p className="lead">Cada sesión terminada da un giro con premio: crema de cuidado, láminas firmadas, descuentos para la próxima. El premio es tuyo por haber venido, opines o no.</p>
              <div className="row wrapflex" style={{ gap: 12 }}>
                <Link href="/reservar" className="btn btn-primary"><CalendarCheck size={18} /> Reservar cita</Link>
                <Link href="/ruleta" className="btn btn-ghost"><Sparkles size={18} /> Tengo un código</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
