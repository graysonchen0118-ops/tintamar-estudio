'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, XCircle, UserX, CalendarClock, Phone, Mail, CloudCheck, CloudUpload, CloudOff, Gift, Trash2, CreditCard, TriangleAlert, Send } from 'lucide-react';
import { useStore } from '@/lib/store';
import { styleBySlug, zoneById } from '@/lib/mock/studio';
import { conflicts } from '@/lib/availability';
import { dayLong, hhmm, durLabel, todayIso, nowMin, toMin, cap } from '@/lib/dates';
import { KIND, STATUS, SYNC, CHANNEL } from '@/lib/panel';
import { Drawer, Modal, Pic, Avatar } from '../ui';
import { useRole } from './Shell';
import type { Appointment } from '@/lib/types';

export function SpinCodeModal({ code, onClose }: { code: string | null; onClose: () => void }) {
  const [img, setImg] = useState('');
  const { s, toast } = useStore();
  useEffect(() => {
    if (!code) return;
    QRCode.toDataURL(`${window.location.origin}/ruleta?c=${code}`, { margin: 1, width: 320, color: { dark: '#171412', light: '#ffffff' } }).then(setImg).catch(() => setImg(''));
  }, [code]);
  const entry = code ? s.codes.find((c) => c.code === code) : null;
  const client = entry ? s.clients.find((c) => c.id === entry.clientId) : null;
  return (
    <Modal open={!!code} onClose={onClose} title="Tarjeta de la ruleta">
      <div className="stack" style={{ gap: 14, alignItems: 'center', textAlign: 'center' }}>
        <p className="small muted">Sesión terminada. {client ? `${client.name.split(' ')[0]} tiene` : 'Tiene'} un giro: dale la tarjeta o mándale el enlace.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt={`Código QR de la ruleta para ${code}`} width={200} height={200} style={{ borderRadius: 12, border: '1px solid var(--line)' }} />}
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.08em' }}>{code}</div>
        <div className="callout" style={{ textAlign: 'left' }}><Gift size={18} /><span>El giro va con la sesión. La invitación a opinar en Google llega después, igual para todos y sin condición.</span></div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-line btn-sm" onClick={() => { toast(`Enlace enviado por WhatsApp a ${client?.name.split(' ')[0] ?? 'el cliente'}`); onClose(); }}><Send size={14} /> Enviar por WhatsApp</button>
          <a className="btn btn-dark btn-sm" href={`/ruleta?c=${code}`} target="_blank" rel="noreferrer"><Gift size={14} /> Abrir la ruleta</a>
        </div>
      </div>
    </Modal>
  );
}

export default function ApptDrawer({ appt, onClose }: { appt: Appointment | null; onClose: () => void }) {
  const { s, artist, setApptStatus, updateAppt, removeAppt, toast } = useStore();
  const { isManager } = useRole();
  const [move, setMove] = useState(false);
  const [form, setForm] = useState({ date: '', start: '', dur: 60, artistId: '' });
  const [err, setErr] = useState<string[]>([]);
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    if (appt) setForm({ date: appt.date, start: hhmm(appt.start), dur: appt.end - appt.start, artistId: appt.artistId });
    setMove(false);
    setErr([]);
  }, [appt?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const a = appt;
  const c = a ? s.clients.find((x) => x.id === a.clientId) : null;
  const p = a?.projectId ? s.projects.find((x) => x.id === a.projectId) : null;
  const ar = a ? artist(a.artistId) : null;
  const past = a ? a.date < todayIso() || (a.date === todayIso() && a.start <= nowMin()) : false;
  const clash = a ? conflicts(a, s.appts, s.busy) : null;
  const Sync = a?.gcal === 'sincronizada' ? CloudCheck : a?.gcal === 'pendiente' ? CloudUpload : CloudOff;

  const save = () => {
    if (!a) return;
    const start = toMin(form.start);
    const next = { id: a.id, artistId: form.artistId as Appointment['artistId'], date: form.date, start, end: start + Number(form.dur) };
    const r = conflicts(next, s.appts, s.busy);
    const msgs: string[] = [];
    if (r.outside) msgs.push(`${artist(next.artistId).short} no trabaja a esa hora ese día.`);
    r.overlaps.forEach((o) => msgs.push(`Se pisa con otra cita de ${hhmm(o.start)} a ${hhmm(o.end)}.`));
    r.gbusy.forEach((b) => msgs.push(`${artist(next.artistId).short} tiene algo personal en su Google Calendar de ${hhmm(b.start)} a ${hhmm(b.end)}.`));
    if (msgs.length) {
      setErr(msgs);
      return;
    }
    updateAppt(a.id, { artistId: next.artistId, date: next.date, start: next.start, end: next.end });
    setMove(false);
    toast(r.tight.length ? 'Cita movida. Ojo: queda sin la media hora de margen con la de al lado.' : 'Cita movida. Google Calendar se actualiza en un momento.', r.tight.length ? 'info' : 'ok');
  };

  return (
    <>
      <Drawer open={!!a} onClose={onClose} title={c?.name ?? 'Cita'} sub={a ? `${KIND[a.kind]}${a.sessionNo ? ` ${a.sessionNo}` : ''} · ${dayLong(a.date)}, ${hhmm(a.start)} a ${hhmm(a.end)}` : ''}
        foot={a && (
          <>
            {a.status === 'pendiente_senal' && <button className="btn btn-sea btn-sm" onClick={() => { setApptStatus(a.id, 'confirmada'); toast('Señal marcada como pagada'); }}><CreditCard size={15} /> Señal pagada</button>}
            {(a.status === 'confirmada' || a.status === 'pendiente_senal') && past && <button className="btn btn-dark btn-sm" onClick={() => { const code = setApptStatus(a.id, 'hecha'); if (code) setCode(code); else toast('Marcada como hecha'); }}><CheckCircle2 size={15} /> Terminada</button>}
            {(a.status === 'confirmada' || a.status === 'pendiente_senal') && past && <button className="btn btn-line btn-sm" onClick={() => { setApptStatus(a.id, 'no_show'); toast('Marcada como no presentada', 'info'); }}><UserX size={15} /> No vino</button>}
            {(a.status === 'confirmada' || a.status === 'pendiente_senal') && <button className="btn btn-line btn-sm" onClick={() => setMove((m) => !m)}><CalendarClock size={15} /> Mover</button>}
            {(a.status === 'confirmada' || a.status === 'pendiente_senal') && <button className="btn btn-danger btn-sm" onClick={() => { setApptStatus(a.id, 'cancelada'); toast('Cita cancelada. También sale de Google Calendar.', 'info'); }}><XCircle size={15} /> Cancelar</button>}
            {a.status === 'hecha' && a.spinCode && <button className="btn btn-line btn-sm" onClick={() => setCode(a.spinCode!)}><Gift size={15} /> Tarjeta de la ruleta</button>}
            {isManager && (a.status === 'cancelada' || a.status === 'no_show') && <button className="btn btn-danger btn-sm" onClick={() => { removeAppt(a.id); onClose(); toast('Cita borrada', 'info'); }}><Trash2 size={15} /> Borrar</button>}
          </>
        )}>
        {a && ar && (
          <>
            <div className="row wrapflex" style={{ gap: 6 }}>
              <span className={`badge ${STATUS[a.status].tone}`}>{STATUS[a.status].label}</span>
              <span className={`badge ${SYNC[a.gcal].tone}`}><Sync size={12} /> {SYNC[a.gcal].label}</span>
              <span className="badge">Entró por {CHANNEL[a.channel]}</span>
            </div>
            {clash && clash.gbusy.length > 0 && a.status !== 'cancelada' && (
              <div className="callout bad"><TriangleAlert size={18} /><span>{ar.short} ha marcado algo personal en su Google Calendar a esta misma hora. Habla con {ar.short} o mueve la cita.</span></div>
            )}
            {a.status === 'pendiente_senal' && a.holdUntil && <div className="callout warm"><CreditCard size={18} /><span>Hueco guardado sin señal hasta el {dayLong(a.holdUntil.slice(0, 10))} a las {a.holdUntil.slice(11)}.</span></div>}
            <dl className="kv">
              <dt>Tatuador</dt><dd className="row" style={{ gap: 8 }}><Avatar k={ar.photo} size={26} radius={8} /> {ar.name}</dd>
              <dt>Cuándo</dt><dd>{cap(dayLong(a.date))}, {hhmm(a.start)} a {hhmm(a.end)} ({durLabel(a.end - a.start)})</dd>
              {c && <><dt>Teléfono</dt><dd><a href={`tel:${c.phone}`} className="row" style={{ gap: 6 }}><Phone size={13} /> {c.phone}</a></dd></>}
              {c?.email && <><dt>Correo</dt><dd><a href={`mailto:${c.email}`} className="row" style={{ gap: 6 }}><Mail size={13} /> {c.email}</a></dd></>}
              <dt>Formulario</dt><dd>{c?.consentSigned ? <span className="badge ok">Firmado</span> : <span className="badge warn">Sin firmar</span>}</dd>
            </dl>
            {p && (
              <div className="card" style={{ padding: 16, boxShadow: 'none' }}>
                <div className="row between" style={{ marginBottom: 8 }}><b>{p.title}</b><span className="tiny muted">{p.code}</span></div>
                <p className="small" style={{ color: 'var(--ink-2)', marginBottom: 10 }}>{p.description}</p>
                <div className="row wrapflex" style={{ gap: 6 }}>
                  <span className="badge">{styleBySlug(p.style)!.name}</span>
                  <span className="badge">{zoneById(p.zone)!.name}{p.side ? `, ${p.side}` : ''}</span>
                  <span className="badge">{p.sizeCm} cm</span>
                  <span className="badge">{p.color ? 'Color' : 'Negro y gris'}</span>
                  <span className="badge accent">{p.quote.min} a {p.quote.max} €</span>
                </div>
                {p.references.length > 0 && <div className="ref-grid" style={{ marginTop: 12 }}>{p.references.map((r) => <div key={r}><Pic id={r} sizes="120px" ar="1:1" alt="Referencia del cliente" /></div>)}</div>}
              </div>
            )}
            {move && (
              <div className="card enter" style={{ padding: 16, boxShadow: 'none' }}>
                <b style={{ display: 'block', marginBottom: 12 }}>Mover la cita</b>
                <div className="form-grid">
                  <label className="field"><span>Día</span><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
                  <label className="field"><span>Hora</span><input className="input" type="time" step={1800} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
                  <label className="field"><span>Duración</span>
                    <select className="select" value={form.dur} onChange={(e) => setForm({ ...form, dur: Number(e.target.value) })}>
                      {[30, 60, 90, 120, 150, 180, 240, 300].map((m) => <option key={m} value={m}>{durLabel(m)}</option>)}
                    </select>
                  </label>
                  {isManager && (
                    <label className="field"><span>Tatuador</span>
                      <select className="select" value={form.artistId} onChange={(e) => setForm({ ...form, artistId: e.target.value })}>
                        {s.artists.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </select>
                    </label>
                  )}
                </div>
                {err.length > 0 && <div className="callout bad" style={{ marginTop: 12 }}><TriangleAlert size={18} /><span>{err.join(' ')}</span></div>}
                <div className="row" style={{ gap: 8, marginTop: 12 }}>
                  <button className="btn btn-dark btn-sm" onClick={save}>Guardar</button>
                  <button className="btn btn-line btn-sm" onClick={() => { setMove(false); setErr([]); }}>Cancelar</button>
                </div>
              </div>
            )}
          </>
        )}
      </Drawer>
      <SpinCodeModal code={code} onClose={() => setCode(null)} />
    </>
  );
}
