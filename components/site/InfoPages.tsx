'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Droplets, Sun, Waves, Hand, AlertTriangle, RefreshCcw, Clock, Cookie, ShieldCheck, Gift, Star, Check, Ticket, Sparkles, Info } from 'lucide-react';
import { useStore, wait } from '@/lib/store';
import { STUDIO } from '@/lib/mock/studio';
import { PHOTOS } from '@/lib/photos';
import { dayLong, addDays } from '@/lib/dates';
import { PageHead } from './Pages';
import { Reveal, Pic, Spinner, Sk } from '../ui';
import { RouletteWheel } from '../three';
import type { Prize } from '@/lib/types';

const CARE = [
  { icon: Clock, when: 'Las primeras horas', t: 'Deja el film puesto', p: 'Si te pusimos film transpirable, déjalo entre tres y cinco días aunque se vea tinta debajo: es el tatuaje sudando, no borrándose. Si es film normal, quítalo a las dos o tres horas.' },
  { icon: Droplets, when: 'Días 1 a 3', t: 'Lavar, secar, crema fina', p: 'Dos veces al día, con agua tibia y jabón neutro, con la mano limpia. Seca a toques con papel de cocina y pon una capa de crema tan fina que casi no se vea, como si fuera crema de manos.' },
  { icon: Hand, when: 'Días 4 a 14', t: 'Pica y se pela, no rasques', p: 'Se pela como la piel después de un día de playa. Si pica, unas palmaditas. Rascar arranca tinta, y eso se ve en el retoque.' },
  { icon: Waves, when: 'Dos semanas', t: 'Nada de mar, piscina ni sauna', p: 'El cloro y la sal se meten en una herida abierta. Ducha sí, baño no.' },
  { icon: Sun, when: 'Para siempre', t: 'Protector solar del 50', p: 'El sol de Málaga apaga los negros y los colores antes que el tiempo. Protector siempre que el tatuaje vaya al aire.' },
  { icon: RefreshCcw, when: 'Hasta tres meses', t: 'Retoque gratis', p: 'Si alguna zona ha quedado más clara al curar, el retoque es gratis durante los tres primeros meses.' },
];

export function CareView() {
  return (
    <>
      <PageHead crumbs={[{ href: '/', label: 'Inicio' }, { label: 'Cuidados' }]} title="Cuidados de un tatuaje nuevo, día a día" lead="Un tatuaje recién hecho es una herida bonita. Lo que hagas las dos primeras semanas decide cómo se verá dentro de diez años." photos={[PHOTOS.recienHecho.id, PHOTOS.corazonDedo.id, PHOTOS.sesionDetalle.id, PHOTOS.peoniaAntebrazo.id, PHOTOS.manosTrabajando.id]} />
      <section className="sec" style={{ paddingTop: 24 }}>
        <div className="wrap" style={{ maxWidth: 900 }}>
          <div className="stack" style={{ gap: 14 }}>
            {CARE.map((c, i) => (
              <Reveal key={c.t} delay={i * 60}>
                <div className="point" style={{ gridTemplateColumns: 'auto 1fr', display: 'grid', gap: 16, alignItems: 'start' }}>
                  <span className="ico" style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(212,85,58,.14)', display: 'grid', placeItems: 'center', color: 'var(--accent-2)' }}><c.icon size={20} /></span>
                  <div className="stack" style={{ gap: 6 }}>
                    <span className="eyebrow" style={{ fontSize: 11 }}>{c.when}</span>
                    <h3>{c.t}</h3>
                    <p>{c.p}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal>
              <div className="callout warm"><AlertTriangle size={18} /><span>Si la zona se pone cada vez más roja y caliente, supura o tienes fiebre, llámanos al {STUDIO.phone} y ve a tu centro de salud. Es raro, pero no se espera.</span></div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

export function PrivacyView() {
  const { cookie, setCookie } = useStore();
  const S = ({ id, t, children }: { id?: string; t: string; children: React.ReactNode }) => (
    <section id={id} className="stack" style={{ gap: 10, scrollMarginTop: 90 }}>
      <h2 className="h3" style={{ color: '#fff' }}>{t}</h2>
      <div className="stack" style={{ gap: 8, color: 'var(--cream-muted)' }}>{children}</div>
    </section>
  );
  return (
    <>
      <PageHead crumbs={[{ href: '/', label: 'Inicio' }, { label: 'Privacidad y cookies' }]} title="Privacidad y cookies" lead="Qué datos guardamos, para qué, cuánto tiempo y cómo puedes llevártelos o borrarlos." photos={[PHOTOS.estudioNoche.id, PHOTOS.laminasPared.id, PHOTOS.malagaCalle.id]} />
      <section className="sec" style={{ paddingTop: 24 }}>
        <div className="wrap stack" style={{ gap: 30, maxWidth: 860 }}>
          <S t="Quién es el responsable">
            <p>{STUDIO.full}, {STUDIO.street}, {STUDIO.zip} {STUDIO.city}. Para cualquier cosa sobre tus datos: {STUDIO.email}.</p>
          </S>
          <S t="Qué datos guardamos y para qué">
            <p>Nombre, correo y teléfono, para gestionar tu cita y avisarte. Tu idea, la zona, el tamaño y las fotos de referencia, para que tu tatuador prepare el diseño. El formulario de salud y tu firma, porque lo exige la normativa sanitaria de los estudios de tatuaje.</p>
            <p>El formulario de salud solo lo ven tu tatuador y la gerencia. No se copia a ningún calendario ni sale del sistema del estudio.</p>
          </S>
          <S t="Calendarios de Google del equipo">
            <p>Cada tatuador ve sus citas en su propio Google Calendar. A ese calendario solo llega la hora, la duración y tu nombre de pila con la inicial del apellido. Nunca tu teléfono, tu correo ni datos de salud.</p>
          </S>
          <S t="Cuánto tiempo">
            <p>Los datos de la cita, mientras seas cliente y hasta dos años después de tu última visita. El formulario de salud, el plazo que fije la normativa sanitaria aplicable. Las facturas, el tiempo que exige la ley fiscal.</p>
          </S>
          <S t="Tus derechos">
            <p>Puedes ver, corregir, descargar o borrar tus datos desde <Link href="/mi-cita" style={{ color: 'var(--accent-2)' }}>Mi cita</Link>, o escribiendo a {STUDIO.email}. Si crees que no los tratamos bien, puedes reclamar ante la Agencia Española de Protección de Datos.</p>
          </S>
          <S id="cookies" t="Cookies">
            <p>Cookies propias, necesarias para que la web funcione y recuerde tu reserva a medio hacer. Y, solo si aceptas, cookies de Google para medir qué anuncios traen citas. Si las rechazas, Google solo recibe datos sin identificarte.</p>
            <div className="callout"><Cookie size={18} /><span>Tu elección ahora: <b>{cookie === 'granted' ? 'aceptadas' : cookie === 'denied' ? 'rechazadas' : 'sin elegir'}</b>.</span></div>
            <div className="row wrapflex" style={{ gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setCookie('denied')}>Rechazar las de Google</button>
              <button className="btn btn-light btn-sm" onClick={() => setCookie('granted')}>Aceptar las de Google</button>
            </div>
          </S>
        </div>
      </section>
    </>
  );
}

export function RouletteView() {
  const { s, ready, spin, openInvite } = useStore();
  const q = useSearchParams();
  const [code, setCode] = useState(q.get('c') ?? '');
  const [active, setActive] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [checking, setChecking] = useState(false);
  const [target, setTarget] = useState<{ id: string; n: number } | null>(null);
  const [won, setWon] = useState<Prize | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [invited, setInvited] = useState(false);
  const wheel = useMemo(() => s.prizes.filter((p) => p.active && p.weight > 0).map((p) => ({ id: p.id, short: p.short, color: p.color })), [s.prizes]);
  const entry = active ? s.codes.find((c) => c.code === active) : null;
  const ar = entry ? s.artists.find((a) => a.id === entry.artistId) : null;

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setChecking(true);
    await wait(600);
    setChecking(false);
    const c = s.codes.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
    if (!c) return setErr('No encontramos ese código. Revisa la tarjeta que te dimos al terminar la sesión.');
    if (c.usedAt) return setErr('Este código ya se ha usado. Cada sesión terminada da un giro.');
    setActive(c.code);
  };
  const go = () => {
    if (!active || spinning) return;
    const r = spin(active);
    if (!r.ok) return setErr(r.reason);
    setSpinning(true);
    setTarget({ id: r.prize.id, n: Date.now() });
    setTimeout(() => setWon(r.prize), 50);
  };

  return (
    <div className="wrap" style={{ paddingTop: 30, paddingBottom: 90 }}>
      <div className="ruleta">
        <div className="wheel3d">
          {ready && wheel.length ? <RouletteWheel prizes={wheel} spinTo={target} onDone={() => setSpinning(false)} /> : <Sk h="100%" r={28} />}
        </div>
        <div className="stack" style={{ gap: 18 }}>
          <span className="eyebrow"><Gift size={14} /> La ruleta de Tintamar</span>
          <h1 className="h2">Un giro por cada sesión terminada</h1>
          <p className="lead">Al acabar tu sesión te damos una tarjeta con un código. El premio es por haber venido: es tuyo opines o no.</p>
          {!active && (
            <form className="panel-card" onSubmit={check} style={{ gap: 12 }}>
              <label className="field"><span>Tu código</span><input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="R4123" /></label>
              {err && <span className="err">{err}</span>}
              <button className="btn btn-primary" disabled={checking || !ready}>{checking ? <><Spinner /> Comprobando</> : <><Ticket size={17} /> Usar código</>}</button>
            </form>
          )}
          {active && !spinning && !won && (
            <div className="panel-card enter" style={{ gap: 12 }}>
              <b>Código {active} listo{ar ? `, de tu sesión con ${ar.short}` : ''}.</b>
              <button className="btn btn-primary" onClick={go}><Sparkles size={18} /> Girar la ruleta</button>
            </div>
          )}
          {spinning && <div className="panel-card" style={{ gap: 8 }}><b className="row" style={{ gap: 8 }}><Spinner /> Girando...</b></div>}
          {won && !spinning && (
            <>
              <div className="prize-card">
                <span className="badge ok" style={{ justifySelf: 'start' }}><Check size={12} /> Premio para ti</span>
                <div className="pz">{won.name}</div>
                <p className="small" style={{ color: 'var(--ink-2)' }}>Enséñale a recepción el código <b>{active}</b> en tu próxima visita. Válido hasta el {dayLong(addDays(new Date().toISOString().slice(0, 10), 90))}.</p>
              </div>
              <div className="invite">
                <b className="row" style={{ gap: 8 }}><Star size={18} color="var(--accent-2)" /> ¿Nos cuentas cómo fue?</b>
                <p className="small" style={{ color: 'var(--cream-muted)' }}>Se lo pedimos a todo el mundo, con premio o sin él, y tu opinión no cambia nada de lo anterior. Lo que escribas en Google ayuda a quien está dudando con su primer tatuaje.</p>
                {invited ? (
                  <span className="badge ok" style={{ justifySelf: 'start' }}><Check size={12} /> Gracias. Se ha abierto la ficha de Google del estudio.</span>
                ) : (
                  <a className="btn btn-light" style={{ justifySelf: 'start' }} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Tintamar estudio de tatuaje Málaga')}`} target="_blank" rel="noreferrer" onClick={() => { openInvite(active!); setInvited(true); }}><Star size={16} /> Escribir mi opinión en Google</a>
                )}
              </div>
            </>
          )}
          <div className="callout"><Info size={18} /><span>El giro llega con la sesión, nunca a cambio de una opinión. Google retira las opiniones que se consiguen con premios, y así las que tiene el estudio se quedan.</span></div>
        </div>
      </div>
    </div>
  );
}
