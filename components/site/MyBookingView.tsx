'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Ticket, CalendarPlus, CreditCard, Check, ClipboardCheck, PenLine, Eraser, CalendarClock, XCircle, Download, Trash2, ShieldCheck, Hourglass, Info, Gift } from 'lucide-react';
import { useStore, wait } from '@/lib/store';
import { STUDIO, styleBySlug, zoneById } from '@/lib/mock/studio';
import { nextOffers } from '@/lib/availability';
import { dayLong, hhmm, durLabel, stampNow, todayIso, addDays, nowMin, cap } from '@/lib/dates';
import { icsFor, downloadIcs } from '@/lib/ics';
import { Avatar, Modal, Spinner, Sk } from '../ui';
import type { HealthForm } from '@/lib/types';
import { BandHead } from './Pages';
import { PHOTOS } from '@/lib/photos';

const BAND = [PHOTOS.recienHecho.id, PHOTOS.estudioNoche.id, PHOTOS.corazonDedo.id, PHOTOS.malagaCalle.id];

function SignaturePad({ onChange }: { onChange: (data: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const has = useRef(false);
  useEffect(() => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    c.width = r.width * 2;
    c.height = r.height * 2;
    const g = c.getContext('2d')!;
    g.scale(2, 2);
    g.lineWidth = 2.2;
    g.lineCap = 'round';
    g.strokeStyle = '#171412';
  }, []);
  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  return (
    <div className="stack" style={{ gap: 6 }}>
      <canvas
        ref={ref}
        className="sig"
        aria-label="Firma"
        onPointerDown={(e) => {
          drawing.current = true;
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          const g = ref.current!.getContext('2d')!;
          const [x, y] = pos(e);
          g.beginPath();
          g.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const g = ref.current!.getContext('2d')!;
          const [x, y] = pos(e);
          g.lineTo(x, y);
          g.stroke();
          has.current = true;
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (has.current) onChange(ref.current!.toDataURL('image/png'));
        }}
      />
      <button type="button" className="btn btn-line btn-xs" style={{ alignSelf: 'flex-start' }} onClick={() => {
        const c = ref.current!;
        c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
        has.current = false;
        onChange('');
      }}><Eraser size={13} /> Borrar firma</button>
    </div>
  );
}

export default function MyBookingView() {
  const { s, ready, payDeposit, signConsent, updateAppt, setApptStatus, forgetClient, toast, artist } = useStore();
  const q = useSearchParams();
  const [code, setCode] = useState(q.get('codigo') ?? '');
  const [contact, setContact] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [searching, setSearching] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [forgetOpen, setForgetOpen] = useState(false);
  const [h, setH] = useState({ allergies: '', anticoagulants: false, diabetes: false, skin: false, pregnant: false, informed: false, photosConsent: false, signature: '' });

  // the booking made in this browser opens straight away; any other needs the contact too
  useEffect(() => {
    if (!ready) return;
    const c = q.get('codigo');
    if (c && c === s.lastBooking) setOpen(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const project = s.projects.find((p) => p.code === open);
  const client = project && s.clients.find((c) => c.id === project.clientId);
  const appts = useMemo(() => (project ? s.appts.filter((a) => a.projectId === project.id).sort((a, b) => (a.date + a.start > b.date + b.start ? 1 : -1)) : []), [project, s.appts]);
  const nextAppt = appts.find((a) => (a.status === 'confirmada' || a.status === 'pendiente_senal') && (a.date > todayIso() || (a.date === todayIso() && a.end > nowMin())));
  const lastDone = [...appts].reverse().find((a) => a.status === 'hecha' && a.spinCode);
  const offers = useMemo(() => (moveOpen && nextAppt ? nextOffers([nextAppt.artistId], nextAppt.end - nextAppt.start, s.appts, s.busy, 6, addDays(todayIso(), 1)) : []), [moveOpen, nextAppt, s.appts, s.busy]);
  const hoursLeft = nextAppt ? (new Date(`${nextAppt.date}T${hhmm(nextAppt.start)}`).getTime() - Date.now()) / 3600000 : 0;

  const find = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSearching(true);
    await wait(700);
    setSearching(false);
    const p = s.projects.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
    const c = p && s.clients.find((x) => x.id === p.clientId);
    const norm = (v: string) => v.replace(/\s/g, '').toLowerCase();
    if (!p || !c || c.deleted || (norm(contact) !== norm(c.email) && norm(contact).replace(/^\+34/, '') !== norm(c.phone).replace(/^\+34/, ''))) {
      setErr('No coincide. Revisa el código y escribe el correo o el teléfono con el que reservaste.');
      return;
    }
    setOpen(p.code);
  };

  if (!ready) return <div className="wrap" style={{ padding: '50px 20px' }}><Sk h={300} r={22} /></div>;

  if (!project || !client) {
    return (
      <>
      <BandHead photos={BAND}><span className="eyebrow"><Ticket size={14} /> Mi cita</span></BandHead>
      <div className="wrap" style={{ paddingTop: 10, paddingBottom: 90, maxWidth: 560 }}>
        <form className="panel-card" onSubmit={find}>
          <span className="eyebrow"><Ticket size={14} /> Mi cita</span>
          <h1 className="h2" style={{ fontSize: 32 }}>Tu cita, tu señal y tu formulario</h1>
          <p style={{ color: 'var(--cream-muted)' }}>Escribe el código que te dimos al reservar y el correo o el teléfono que usaste.</p>
          <label className="field"><span>Código de reserva</span><input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="TM-1234" /></label>
          <label className="field"><span>Correo o teléfono</span><input className="input" value={contact} onChange={(e) => setContact(e.target.value)} /></label>
          {err && <span className="err">{err}</span>}
          <button className="btn btn-primary" disabled={searching}>{searching ? <><Spinner /> Buscando</> : <><Search size={17} /> Ver mi cita</>}</button>
        </form>
      </div>
      </>
    );
  }

  const ar = project.artistId ? artist(project.artistId) : null;
  const pending = !!nextAppt && nextAppt.status === 'pendiente_senal';

  return (
    <>
    <BandHead photos={BAND}>
      <div className="stack enter" style={{ gap: 8 }}>
        <span className="eyebrow"><Ticket size={14} /> Mi cita · {project.code}</span>
        <h1 className="h2">Hola, {client.name.split(' ')[0]}</h1>
      </div>
    </BandHead>
    <div className="wrap" style={{ paddingTop: 10, paddingBottom: 90, maxWidth: 980 }}>
      <div className="book">
        <div className="book-main">
          <div className="panel-card">
            <h2>{nextAppt ? (nextAppt.kind === 'consulta' ? 'Tu próxima consulta' : 'Tu próxima sesión') : 'Tu proyecto'}</h2>
            {ar && <div className="row" style={{ gap: 12 }}><Avatar k={ar.photo} size={52} /><div><b>{ar.name}</b><div className="small" style={{ color: 'var(--cream-muted)' }}>{ar.role}</div></div></div>}
            {nextAppt ? (
              <div className="est">
                <div className="big">{cap(dayLong(nextAppt.date))}, {hhmm(nextAppt.start)}</div>
                <div className="est-row">
                  <div><small>Duración</small><b>{durLabel(nextAppt.end - nextAppt.start)}</b></div>
                  <div><small>Señal</small><b>{pending ? 'Pendiente' : 'Pagada'}</b></div>
                  <div><small>Orientativo</small><b>{project.quote.min} a {project.quote.max} €</b></div>
                </div>
              </div>
            ) : <p style={{ color: 'var(--cream-muted)' }}>No tienes ninguna cita próxima en este proyecto.</p>}
            {pending && (
              <div className="callout warm"><Hourglass size={18} /><span>Hueco guardado hasta el {nextAppt?.holdUntil ? `${dayLong(nextAppt.holdUntil.slice(0, 10))} a las ${nextAppt.holdUntil.slice(11)}` : 'plazo de 48 horas'}. Paga la señal para confirmarlo.</span></div>
            )}
            <div className="row wrapflex" style={{ gap: 8 }}>
              {pending && <button className="btn btn-primary" onClick={() => setPayOpen(true)}><CreditCard size={17} /> Pagar señal de {STUDIO.deposit} €</button>}
              {nextAppt && ar && <button className="btn btn-ghost" onClick={() => downloadIcs(`tintamar-${project.code}.ics`, icsFor({ code: project.code, title: nextAppt.kind === 'consulta' ? 'Consulta de tatuaje' : 'Sesión de tatuaje', date: nextAppt.date, start: nextAppt.start, end: nextAppt.end, artist: ar.name }))}><CalendarPlus size={17} /> Añadir al calendario</button>}
              {nextAppt && <button className="btn btn-ghost" onClick={() => setMoveOpen(true)}><CalendarClock size={17} /> Cambiar fecha</button>}
              {nextAppt && <button className="btn btn-ghost" onClick={() => setCancelOpen(true)}><XCircle size={17} /> Cancelar</button>}
            </div>
          </div>

          <div className="panel-card">
            <h2 className="row" style={{ gap: 10 }}><ClipboardCheck size={22} color="var(--accent-2)" /> Formulario de salud y consentimiento</h2>
            {client.consentSigned ? (
              <div className="callout"><ShieldCheck size={18} /><span>Firmado{client.health?.signedAt ? ` el ${dayLong(client.health.signedAt.slice(0, 10))}` : ''}. Tu tatuador lo revisa antes de empezar. Si algo cambia, díselo el mismo día.</span></div>
            ) : (
              <form className="stack" style={{ gap: 14 }} onSubmit={(e) => {
                e.preventDefault();
                if (!h.informed || !h.signature) {
                  toast('Falta aceptar el consentimiento y firmar', 'bad');
                  return;
                }
                const form: HealthForm = { allergies: h.allergies, anticoagulants: h.anticoagulants, diabetes: h.diabetes, skin: h.skin, pregnant: h.pregnant, signedAt: stampNow(), signature: h.signature, photosConsent: h.photosConsent };
                signConsent(client.id, form);
                toast('Formulario firmado. Gracias.');
              }}>
                <p className="small" style={{ color: 'var(--cream-muted)' }}>Lo pide la normativa sanitaria de los estudios de tatuaje. Solo lo ven tu tatuador y la gerencia del estudio, y nunca se copia a ningún calendario.</p>
                <label className="field"><span>¿Tienes alguna alergia? (látex, tintas, cremas, medicamentos)</span><input className="input" value={h.allergies} onChange={(e) => setH({ ...h, allergies: e.target.value })} placeholder="Ninguna" /></label>
                {([['anticoagulants', 'Tomo anticoagulantes o aspirina a diario'], ['diabetes', 'Tengo diabetes'], ['skin', 'Tengo una lesión o enfermedad de la piel en la zona'], ['pregnant', 'Estoy embarazada o en periodo de lactancia']] as const).map(([k, t]) => (
                  <label key={k} className="check"><input type="checkbox" checked={h[k]} onChange={(e) => setH({ ...h, [k]: e.target.checked })} /><span>{t}</span></label>
                ))}
                {h.pregnant && <div className="callout warm"><Info size={18} /><span>No tatuamos durante el embarazo ni la lactancia. Escríbenos y movemos la cita sin perder la señal.</span></div>}
                <label className="check"><input type="checkbox" checked={h.informed} onChange={(e) => setH({ ...h, informed: e.target.checked })} /><span>He entendido que el tatuaje es permanente, los cuidados que debo seguir y los riesgos de infección o reacción, y doy mi consentimiento.</span></label>
                <label className="check"><input type="checkbox" checked={h.photosConsent} onChange={(e) => setH({ ...h, photosConsent: e.target.checked })} /><span>Permito que el estudio publique fotos del tatuaje terminado, sin mi cara (opcional).</span></label>
                <div className="field"><span><PenLine size={13} style={{ verticalAlign: -2 }} /> Firma con el dedo o el ratón</span><SignaturePad onChange={(sig) => setH((x) => ({ ...x, signature: sig }))} /></div>
                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}><Check size={17} /> Firmar formulario</button>
              </form>
            )}
          </div>

          {lastDone && (
            <div className="panel-card">
              <h2 className="row" style={{ gap: 10 }}><Gift size={22} color="var(--accent-2)" /> Tu giro en la ruleta</h2>
              <p style={{ color: 'var(--cream-muted)' }}>Por tu última sesión tienes un giro. El código está también en la tarjeta que te dimos.</p>
              <Link href={`/ruleta?c=${lastDone.spinCode}`} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}><Gift size={17} /> Girar con el código {lastDone.spinCode}</Link>
            </div>
          )}
        </div>

        <aside className="book-side">
          <div className="summary">
            <b style={{ fontSize: 17 }}>Tu proyecto</b>
            <div className="line"><span>Idea</span><span>{project.title}</span></div>
            <div className="line"><span>Estilo</span><span>{styleBySlug(project.style)!.name}</span></div>
            <div className="line"><span>Zona</span><span>{zoneById(project.zone)!.name}{project.side ? `, ${project.side}` : ''}</span></div>
            <div className="line"><span>Tamaño</span><span>{project.sizeCm} cm</span></div>
            <div className="line"><span>Sesiones</span><span>{appts.filter((a) => a.status === 'hecha' && a.kind === 'sesion').length} de {project.sessionsPlanned}</span></div>
          </div>
          <div className="panel-card" style={{ gap: 12 }}>
            <b>Tus datos</b>
            <p className="small" style={{ color: 'var(--cream-muted)' }}>Puedes descargar todo lo que el estudio guarda de ti, o pedir que se borre.</p>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              const data = { cliente: client, proyecto: project, citas: appts };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `mis-datos-${project.code}.json`;
              a.click();
            }}><Download size={15} /> Descargar mis datos</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setForgetOpen(true)}><Trash2 size={15} /> Borrar mis datos</button>
          </div>
        </aside>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={`Señal de ${STUDIO.deposit} €`}>
        <form className="stack" style={{ gap: 14 }} onSubmit={async (e) => {
          e.preventDefault();
          setPaying(true);
          await wait(1300);
          payDeposit(project.id);
          setPaying(false);
          setPayOpen(false);
          toast('Señal pagada. Tu cita está confirmada.');
        }}>
          <label className="field"><span>Número de tarjeta</span><input className="input" required inputMode="numeric" placeholder="4242 4242 4242 4242" minLength={16} /></label>
          <div className="form-grid">
            <label className="field"><span>Caducidad</span><input className="input" required placeholder="MM/AA" /></label>
            <label className="field"><span>CVC</span><input className="input" required inputMode="numeric" placeholder="123" /></label>
          </div>
          <button className="btn btn-dark" disabled={paying}>{paying ? <><Spinner /> Pagando</> : `Pagar ${STUDIO.deposit} €`}</button>
        </form>
      </Modal>

      <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title="Cambiar la fecha">
        {hoursLeft < 48 ? (
          <p>Quedan menos de 48 horas para la cita. Para cambiarla, escríbenos por WhatsApp al {STUDIO.whatsapp} y lo vemos.</p>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            <p className="small muted">Huecos libres de {ar?.short} con la misma duración. La señal pasa a la nueva fecha.</p>
            {offers.map((o) => (
              <button key={o.date + o.start} className="li clk" style={{ textAlign: 'left' }} onClick={() => {
                if (!nextAppt) return;
                updateAppt(nextAppt.id, { date: o.date, start: o.start, end: o.end });
                setMoveOpen(false);
                toast('Cita movida. Te hemos enviado la nueva fecha.');
              }}>
                <CalendarClock size={18} color="var(--sea)" />
                <span className="grow"><b>{cap(dayLong(o.date))}</b>, {hhmm(o.start)}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancelar la cita">
        <div className="stack" style={{ gap: 14 }}>
          <p>{hoursLeft >= 48 ? 'Faltan más de 48 horas: guardamos tu señal para una nueva fecha durante seis meses.' : 'Faltan menos de 48 horas: la señal no se puede guardar para otra fecha.'}</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-line" onClick={() => setCancelOpen(false)}>Mantener la cita</button>
            <button className="btn btn-danger" onClick={() => {
              if (nextAppt) setApptStatus(nextAppt.id, 'cancelada');
              setCancelOpen(false);
              toast('Cita cancelada', 'info');
            }}>Cancelar la cita</button>
          </div>
        </div>
      </Modal>

      <Modal open={forgetOpen} onClose={() => setForgetOpen(false)} title="Borrar mis datos">
        <div className="stack" style={{ gap: 14 }}>
          {nextAppt ? <p>Tienes una cita pendiente. Cancélala primero, y después podrás borrar tus datos.</p> : <p>Borraremos tu nombre, contacto y formulario de salud. Las facturas se conservan el tiempo que exige la ley, sin datos de salud.</p>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-line" onClick={() => setForgetOpen(false)}>Volver</button>
            {!nextAppt && <button className="btn btn-danger" onClick={() => {
              forgetClient(client.id);
              setForgetOpen(false);
              setOpen(null);
              toast('Tus datos se han borrado', 'info');
            }}>Borrar definitivamente</button>}
          </div>
        </div>
      </Modal>
    </div>
    </>
  );
}
