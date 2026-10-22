'use client';

import { useMemo, useState } from 'react';
import { TriangleAlert, UserPlus, Search } from 'lucide-react';
import { useStore } from '@/lib/store';
import { conflicts } from '@/lib/availability';
import { hhmm, toMin, durLabel, stampNow } from '@/lib/dates';
import type { ArtistId } from '@/lib/mock/studio';
import { Modal } from '../ui';
import type { ApptKind, Client } from '@/lib/types';

export default function NewAppt({ draft, only, onClose }: { draft: { artistId: ArtistId; date: string; start: number }; only?: ArtistId; onClose: () => void }) {
  const { s, addAppt, addClient, toast, artist } = useStore();
  const [f, setF] = useState({ artistId: draft.artistId, date: draft.date, start: hhmm(draft.start), dur: 120, kind: 'sesion' as ApptKind, projectId: '' });
  const [q, setQ] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [nc, setNc] = useState({ name: '', phone: '' });
  const [newClient, setNewClient] = useState(false);
  const [err, setErr] = useState<string[]>([]);
  const clients = useMemo(() => {
    const t = q.trim().toLowerCase();
    const pool = s.clients.filter((c) => !c.deleted && (only ? s.projects.some((p) => p.clientId === c.id && p.artistId === only) : true));
    return t ? pool.filter((c) => c.name.toLowerCase().includes(t) || c.phone.replace(/\s/g, '').includes(t.replace(/\s/g, ''))).slice(0, 6) : pool.slice(0, 5);
  }, [q, s.clients, s.projects, only]);
  const projects = clientId ? s.projects.filter((p) => p.clientId === clientId && p.stage !== 'terminado') : [];

  const save = () => {
    const start = toMin(f.start);
    const c = { artistId: f.artistId, date: f.date, start, end: start + Number(f.dur) };
    const r = conflicts(c, s.appts, s.busy);
    const msgs: string[] = [];
    if (!clientId && !(newClient && nc.name.trim() && nc.phone.trim())) msgs.push('Elige un cliente o crea uno nuevo.');
    if (r.outside) msgs.push(`${artist(f.artistId).short} no trabaja a esa hora ese día.`);
    r.overlaps.forEach((o) => msgs.push(`Se pisa con otra cita de ${hhmm(o.start)} a ${hhmm(o.end)}.`));
    r.gbusy.forEach((b) => msgs.push(`${artist(f.artistId).short} tiene algo personal en su Google Calendar de ${hhmm(b.start)} a ${hhmm(b.end)}.`));
    if (msgs.length) return setErr(msgs);
    let cid = clientId;
    if (!cid) {
      const cl: Client = { id: `c${Date.now().toString(36)}`, name: nc.name.trim(), phone: nc.phone.trim(), email: '', source: 'Mostrador', createdAt: stampNow().slice(0, 10), marketing: false, consentSigned: false };
      addClient(cl);
      cid = cl.id;
    }
    addAppt({ artistId: f.artistId, clientId: cid, projectId: f.projectId || null, kind: f.kind, date: f.date, start, end: start + Number(f.dur), status: 'confirmada', channel: 'mostrador' });
    toast(r.tight.length ? 'Cita creada. Ojo: queda sin la media hora de margen con la de al lado.' : 'Cita creada. Sale en Google Calendar en un momento.', r.tight.length ? 'info' : 'ok');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Nueva cita">
      <div className="stack" style={{ gap: 14 }}>
        <div className="form-grid">
          {!only && (
            <label className="field"><span>Tatuador</span>
              <select className="select" value={f.artistId} onChange={(e) => setF({ ...f, artistId: e.target.value as ArtistId })}>
                {s.artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          )}
          <label className="field"><span>Tipo</span>
            <select className="select" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as ApptKind, dur: e.target.value === 'consulta' ? 30 : e.target.value === 'retoque' ? 60 : f.dur })}>
              <option value="sesion">Sesión</option><option value="consulta">Consulta</option><option value="retoque">Retoque</option>
            </select>
          </label>
          <label className="field"><span>Día</span><input className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label className="field"><span>Hora</span><input className="input" type="time" step={1800} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label>
          <label className="field"><span>Duración</span>
            <select className="select" value={f.dur} onChange={(e) => setF({ ...f, dur: Number(e.target.value) })}>
              {[30, 60, 90, 120, 150, 180, 240, 300].map((m) => <option key={m} value={m}>{durLabel(m)}</option>)}
            </select>
          </label>
        </div>
        {!newClient ? (
          <div className="field">
            <span>Cliente</span>
            <div className="search" style={{ maxWidth: 'none' }}><Search size={16} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por nombre o teléfono" /></div>
            <div className="list">
              {clients.map((c) => (
                <button key={c.id} className="li clk" style={{ textAlign: 'left', borderColor: clientId === c.id ? 'var(--accent)' : undefined }} onClick={() => setClientId(c.id)}>
                  <span className="grow"><b>{c.name}</b><div className="tiny muted">{c.phone}</div></span>
                  {clientId === c.id && <span className="badge accent">Elegido</span>}
                </button>
              ))}
            </div>
            <button className="btn btn-line btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setNewClient(true); setClientId(null); }}><UserPlus size={14} /> Cliente nuevo</button>
          </div>
        ) : (
          <div className="form-grid">
            <label className="field"><span>Nombre</span><input className="input" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} /></label>
            <label className="field"><span>Teléfono</span><input className="input" value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} /></label>
            <button className="btn btn-line btn-sm" style={{ alignSelf: 'end' }} onClick={() => setNewClient(false)}>Buscar uno existente</button>
          </div>
        )}
        {projects.length > 0 && (
          <label className="field"><span>Proyecto</span>
            <select className="select" value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })}>
              <option value="">Sin proyecto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
            </select>
          </label>
        )}
        {err.length > 0 && <div className="callout bad"><TriangleAlert size={18} /><span>{err.join(' ')}</span></div>}
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-dark" onClick={save}>Crear cita</button>
          <button className="btn btn-line" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </Modal>
  );
}
