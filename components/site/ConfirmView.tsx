'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, CalendarPlus, Ticket, ClipboardCheck, PenLine, Sun, ArrowRight, Hourglass } from 'lucide-react';
import { useStore } from '@/lib/store';
import { styleBySlug, zoneById, STUDIO } from '@/lib/mock/studio';
import { dayLong, hhmm, durLabel, cap } from '@/lib/dates';
import { icsFor, downloadIcs } from '@/lib/ics';
import { Avatar, Sk, Empty } from '../ui';
import { BandHead } from './Pages';
import { PHOTOS } from '@/lib/photos';

export default function ConfirmView() {
  const { s, ready, artist } = useStore();
  const q = useSearchParams();
  const code = q.get('codigo') ?? s.lastBooking;
  if (!ready) return <div className="wrap" style={{ padding: '60px 20px' }}><Sk h={360} r={22} /></div>;
  const p = s.projects.find((x) => x.code === code);
  const a = p && s.appts.find((x) => x.projectId === p.id);
  if (!p || !a) {
    return <div className="wrap" style={{ padding: '60px 20px' }}><div className="paper" style={{ borderRadius: 22 }}><Empty icon={<Ticket size={24} />} title="No encontramos esa reserva" text="Si ya la hiciste, búscala en Mi cita con tu código y tu correo." action={<Link href="/mi-cita" className="btn btn-dark">Ir a Mi cita</Link>} /></div></div>;
  }
  const ar = artist(a.artistId);
  const pending = a.status === 'pendiente_senal';
  return (
    <>
    <BandHead photos={[PHOTOS.plantillaPierna.id, PHOTOS.dibujandoDiseno.id, PHOTOS.estudioDosPuestos.id, PHOTOS[ar.portfolio[0]].id]}><span className="eyebrow"><Check size={14} /> Reserva {p.code}</span></BandHead>
    <div className="wrap" style={{ paddingTop: 10, paddingBottom: 90, maxWidth: 820 }}>
      <div className="panel-card success">
        <div className="ring"><Check size={40} strokeWidth={3} /></div>
        <h1 className="h2">{pending ? 'Hueco guardado' : 'Cita reservada'}</h1>
        <p className="lead" style={{ margin: '0 auto' }}>{pending ? `Te guardamos el hueco 48 horas. Paga la señal de ${STUDIO.deposit} € desde Mi cita para confirmarlo.` : `Señal pagada. ${ar.short} ya tiene tu idea en su agenda.`}</p>
        <div className="code-box">{p.code}</div>
        <span className="small" style={{ color: 'var(--cream-muted)' }}>Tu código de reserva. Te lo hemos enviado también a {s.clients.find((c) => c.id === p.clientId)?.email || 'tu correo'}.</span>
        <div className="summary" style={{ width: '100%', textAlign: 'left' }}>
          <div className="row" style={{ gap: 12 }}><Avatar k={ar.photo} size={52} /><div><b>{ar.name}</b><div className="small muted">{ar.role}</div></div></div>
          <div className="line"><span>{a.kind === 'consulta' ? 'Consulta' : 'Sesión'}</span><span>{cap(dayLong(a.date))}, {hhmm(a.start)}</span></div>
          <div className="line"><span>Duración</span><span>{durLabel(a.end - a.start)}</span></div>
          <div className="line"><span>Tatuaje</span><span>{styleBySlug(p.style)!.name}, {zoneById(p.zone)!.name.toLowerCase()}, {p.sizeCm} cm</span></div>
          <div className="line"><span>Precio orientativo</span><span>{p.quote.min} a {p.quote.max} €</span></div>
          <div className="line"><span>Señal</span><span>{pending ? <span className="badge warn"><Hourglass size={12} /> Pendiente</span> : <span className="badge ok"><Check size={12} /> Pagada</span>}</span></div>
        </div>
        <div className="row wrapflex" style={{ gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-light" onClick={() => downloadIcs(`tintamar-${p.code}.ics`, icsFor({ code: p.code, title: a.kind === 'consulta' ? 'Consulta de tatuaje' : 'Sesión de tatuaje', date: a.date, start: a.start, end: a.end, artist: ar.name }))}><CalendarPlus size={18} /> Añadir a mi calendario</button>
          <Link href={`/mi-cita?codigo=${p.code}`} className="btn btn-primary"><Ticket size={18} /> {pending ? 'Pagar la señal' : 'Ver Mi cita'}</Link>
        </div>
      </div>
      <div className="points" style={{ marginTop: 20 }}>
        <div className="point"><h3 className="row" style={{ gap: 8 }}><PenLine size={18} color="var(--accent-2)" /> El diseño</h3><p>{ar.short} revisa tu idea y te enseña el diseño antes de la cita. Se ajusta lo que haga falta.</p></div>
        <div className="point"><h3 className="row" style={{ gap: 8 }}><ClipboardCheck size={18} color="var(--accent-2)" /> El formulario de salud</h3><p>Rellénalo desde Mi cita antes de venir. Son dos minutos y la cita empieza a su hora. <Link href={`/mi-cita?codigo=${p.code}`} style={{ color: 'var(--accent-2)', fontWeight: 700 }}>Rellenarlo ahora <ArrowRight size={13} style={{ verticalAlign: -2 }} /></Link></p></div>
        <div className="point"><h3 className="row" style={{ gap: 8 }}><Sun size={18} color="var(--accent-2)" /> El día de la cita</h3><p>Ven habiendo comido, sin alcohol el día anterior y con ropa que deje la zona a mano.</p></div>
      </div>
    </div>
    </>
  );
}
