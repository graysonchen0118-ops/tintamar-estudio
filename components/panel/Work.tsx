'use client';

import { useMemo, useState } from 'react';
import { Search, CalendarPlus, Send, ArrowRight, Images, Download, Trash2, ArrowUpDown, ClipboardCheck, Megaphone, TriangleAlert } from 'lucide-react';
import { useStore } from '@/lib/store';
import { styleBySlug, zoneById, type ArtistId } from '@/lib/mock/studio';
import { estimate } from '@/lib/estimate';
import { nextOffers } from '@/lib/availability';
import { dayLong, hhmm, ago, durLabel, todayIso, addDays, cap } from '@/lib/dates';
import { STAGES, stageLabel, stageTone, CHANNEL, KIND, STATUS, shortName } from '@/lib/panel';
import { Drawer, Pic, Avatar, Empty } from '../ui';
import { Top, useRole } from './Shell';
import type { Project, Stage } from '@/lib/types';

function ProjectDrawer({ p, onClose }: { p: Project | null; onClose: () => void }) {
  const { s, artist, updateProject, addNote, addAppt, toast } = useStore();
  const { isManager, artistId } = useRole();
  const [note, setNote] = useState('');
  const [propose, setPropose] = useState(false);
  const c = p ? s.clients.find((x) => x.id === p.clientId) : null;
  const ar = p?.artistId ? artist(p.artistId) : null;
  const appts = p ? s.appts.filter((a) => a.projectId === p.id).sort((a, b) => (a.date + hhmm(a.start) > b.date + hhmm(b.start) ? 1 : -1)) : [];
  const e = p ? estimate({ style: p.style, zone: p.zone, sizeCm: p.sizeCm, color: p.color, artistId: p.artistId, coverUp: p.coverUp }) : null;
  const done = appts.filter((a) => a.status === 'hecha' && a.kind === 'sesion').length;
  const sessionMin = e ? Math.round(Math.min(e.hours - done * 5 > 0 ? e.hours - done * 5 : e.hours, 5) * 60) : 60;
  const offers = useMemo(() => (propose && p?.artistId ? nextOffers([p.artistId], sessionMin, s.appts, s.busy, 4) : []), [propose, p?.artistId, sessionMin, s.appts, s.busy]);
  const by = isManager ? 'Clara' : artistId ? artist(artistId).short : '';
  const stIdx = p ? STAGES.findIndex((x) => x.id === p.stage) : -1;

  return (
    <Drawer open={!!p} onClose={() => { setPropose(false); onClose(); }} title={p?.title ?? ''} sub={p ? `${p.code} · ${c?.name ?? ''} · entró ${ago(p.createdAt)} por ${CHANNEL[p.channel]}` : ''}
      foot={p && (
        <>
          {stIdx >= 0 && stIdx < STAGES.length - 1 && <button className="btn btn-dark btn-sm" onClick={() => { updateProject(p.id, { stage: STAGES[stIdx + 1].id }); addNote(p.id, `Pasa a ${STAGES[stIdx + 1].label.toLowerCase()}.`, by); toast(`Movido a ${STAGES[stIdx + 1].label}`); }}>Pasar a {STAGES[stIdx + 1].label.toLowerCase()} <ArrowRight size={15} /></button>}
          {p.artistId && <button className="btn btn-line btn-sm" onClick={() => setPropose((x) => !x)}><CalendarPlus size={15} /> Proponer sesión</button>}
        </>
      )}>
      {p && e && (
        <>
          <div className="row wrapflex" style={{ gap: 6 }}>
            <span className={`badge ${stageTone(p.stage)}`}>{stageLabel(p.stage)}</span>
            <span className="badge">{styleBySlug(p.style)!.name}</span>
            <span className="badge">{zoneById(p.zone)!.name}{p.side ? `, ${p.side}` : ''}</span>
            <span className="badge">{p.sizeCm} cm · {p.color ? 'color' : 'negro y gris'}</span>
            <span className="badge accent">{p.quote.min} a {p.quote.max} €</span>
            <span className={`badge ${p.deposit.paid ? 'ok' : 'warn'}`}>Señal {p.deposit.paid ? 'pagada' : 'pendiente'}</span>
            {p.source === 'Google Ads' && <span className="badge warn"><Megaphone size={12} /> Google Ads{p.campaign ? ` · ${p.campaign}` : ''}</span>}
          </div>
          <p style={{ color: 'var(--ink-2)' }}>{p.description}</p>
          {p.references.length > 0 && (
            <div className="stack" style={{ gap: 8 }}>
              <b className="small row" style={{ gap: 6 }}><Images size={14} /> Referencias del cliente</b>
              <div className="ref-grid">{p.references.map((r) => <div key={r}><Pic id={r} sizes="140px" ar="1:1" alt="Referencia del cliente" /></div>)}</div>
            </div>
          )}
          <dl className="kv">
            <dt>Cliente</dt><dd>{c?.name} · {c?.phone}</dd>
            <dt>Formulario</dt><dd>{c?.consentSigned ? <span className="badge ok"><ClipboardCheck size={12} /> Firmado</span> : <span className="badge warn">Sin firmar</span>}</dd>
            <dt>Cálculo</dt><dd>{e.hours} h en total, {e.sessions} {e.sessions > 1 ? 'sesiones' : 'sesión'}</dd>
            <dt>Tatuador</dt>
            <dd>
              {isManager ? (
                <select className="select" style={{ minHeight: 38 }} value={p.artistId ?? ''} onChange={(ev) => { const id = ev.target.value as ArtistId; updateProject(p.id, { artistId: id, stage: p.stage === 'solicitud' ? 'diseno' : p.stage }); addNote(p.id, `Asignado a ${artist(id).short}.`, by); toast(`Asignado a ${artist(id).short}`); }}>
                  <option value="" disabled>Sin asignar</option>
                  {s.artists.filter((a) => a.styles.includes(p.style) || a.id === p.artistId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              ) : ar?.name}
            </dd>
          </dl>
          {propose && (
            <div className="card enter" style={{ padding: 14, boxShadow: 'none' }}>
              <b className="small">Huecos de {durLabel(sessionMin)} en la agenda de {ar?.short}</b>
              <div className="list" style={{ marginTop: 10 }}>
                {offers.map((o) => (
                  <button key={o.date + o.start} className="li clk" style={{ textAlign: 'left' }} onClick={() => {
                    addAppt({ artistId: o.artistId, clientId: p.clientId, projectId: p.id, kind: done || p.stage !== 'solicitud' ? 'sesion' : e.firstKind, date: o.date, start: o.start, end: o.end, status: p.deposit.paid ? 'confirmada' : 'pendiente_senal', channel: 'mostrador', sessionNo: done + 1 });
                    addNote(p.id, `Sesión propuesta para el ${dayLong(o.date)} a las ${hhmm(o.start)}. Aviso enviado al cliente.`, by);
                    if (p.stage === 'diseno' || p.stage === 'solicitud') updateProject(p.id, { stage: done ? 'sesiones' : 'diseno' });
                    setPropose(false);
                    toast('Sesión añadida a la agenda y aviso enviado al cliente');
                  }}>
                    <CalendarPlus size={17} color="var(--sea)" />
                    <span className="grow"><b>{cap(dayLong(o.date))}</b>, {hhmm(o.start)} a {hhmm(o.end)}</span>
                  </button>
                ))}
                {!offers.length && <span className="small muted">No hay huecos de esa duración en las próximas semanas.</span>}
              </div>
            </div>
          )}
          <div className="stack" style={{ gap: 8 }}>
            <b className="small">Citas del proyecto</b>
            {appts.length ? appts.map((a) => (
              <div key={a.id} className="li">
                <span className="grow small"><b>{cap(dayLong(a.date))}</b>, {hhmm(a.start)} · {KIND[a.kind]}{a.sessionNo ? ` ${a.sessionNo}` : ''}</span>
                <span className={`badge ${STATUS[a.status].tone}`}>{STATUS[a.status].label}</span>
              </div>
            )) : <span className="small muted">Todavía sin citas.</span>}
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <b className="small">Notas del equipo</b>
            <div className="notes">
              {p.notes.map((n, i) => <div key={i} className="note"><small>{n.by} · {ago(n.at)}</small>{n.text}</div>)}
              {!p.notes.length && <span className="small muted">Sin notas.</span>}
            </div>
            <form className="row" style={{ gap: 8 }} onSubmit={(ev) => { ev.preventDefault(); if (!note.trim()) return; addNote(p.id, note.trim(), by); setNote(''); }}>
              <input className="input" value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Añadir una nota" />
              <button className="btn btn-dark btn-sm" aria-label="Guardar nota"><Send size={15} /></button>
            </form>
          </div>
        </>
      )}
    </Drawer>
  );
}

export function ProjectsPage() {
  const { s, artist } = useStore();
  const { isManager, artistId } = useRole();
  const [q, setQ] = useState('');
  const [who, setWho] = useState<ArtistId | 'todos'>('todos');
  const [openId, setOpenId] = useState<string | null>(null);
  const list = s.projects.filter((p) => {
    if (!isManager && p.artistId !== artistId) return false;
    if (isManager && who !== 'todos' && p.artistId !== who) return false;
    if (p.stage === 'terminado' && p.createdAt.slice(0, 10) < addDays(todayIso(), -45)) return false;
    const c = s.clients.find((x) => x.id === p.clientId);
    const t = q.trim().toLowerCase();
    return !t || p.title.toLowerCase().includes(t) || (c?.name.toLowerCase().includes(t) ?? false) || p.code.toLowerCase().includes(t);
  });
  const open = openId ? s.projects.find((p) => p.id === openId) ?? null : null;
  return (
    <>
      <Top title={isManager ? 'Proyectos' : 'Mis proyectos'} sub={isManager ? 'Todos los tatuajes en marcha del estudio' : 'Solo los tuyos. Los de tus compañeros no aparecen aquí.'} />
      <div className="pn-body">
        <div className="toolbar">
          <div className="search"><Search size={16} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por cliente, idea o código" /></div>
          {isManager && (
            <select className="select" style={{ maxWidth: 200, minHeight: 42 }} value={who} onChange={(e) => setWho(e.target.value as ArtistId | 'todos')}>
              <option value="todos">Todos los tatuadores</option>
              {s.artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
        <div className="kanban">
          {STAGES.map((st) => {
            const col = list.filter((p) => p.stage === st.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
            return (
              <div key={st.id} className="kcol">
                <div className="kcol-h"><span>{st.label}</span><span className={`badge ${st.tone}`}>{col.length}</span></div>
                {col.slice(0, 14).map((p, i) => {
                  const c = s.clients.find((x) => x.id === p.clientId);
                  const ar = p.artistId ? artist(p.artistId) : null;
                  const next = s.appts.filter((a) => a.projectId === p.id && a.date >= todayIso() && a.status !== 'cancelada').sort((a, b) => (a.date > b.date ? 1 : -1))[0];
                  return (
                    <button key={p.id} className="kcard" style={{ ['--c' as string]: ar?.color ?? 'var(--accent)', animationDelay: `${i * 30}ms` }} onClick={() => setOpenId(p.id)}>
                      <div className="row between"><span className="t">{p.title}</span>{ar && isManager && <Avatar k={ar.photo} size={24} radius={7} />}</div>
                      <span className="tiny muted">{c ? shortName(c.name) : ''} · {styleBySlug(p.style)!.name} · {zoneById(p.zone)!.name}</span>
                      {p.references.length > 0 && <div className="refs-mini">{p.references.slice(0, 3).map((r) => <div key={r}><Pic id={r} sizes="70px" ar="1:1" alt="Referencia" /></div>)}</div>}
                      <div className="row wrapflex" style={{ gap: 5 }}>
                        {next ? <span className="badge sea">{cap(dayLong(next.date)).split(' ').slice(0, 2).join(' ')} {hhmm(next.start)}</span> : p.stage === 'diseno' ? <span className="badge warn">Sin fecha</span> : null}
                        {!p.deposit.paid && p.stage !== 'solicitud' && <span className="badge warn">Señal</span>}
                        {p.channel === 'chat' && <span className="badge sea">Asistente</span>}
                      </div>
                    </button>
                  );
                })}
                {!col.length && <span className="tiny muted" style={{ padding: 6 }}>Nada en esta columna</span>}
                {col.length > 14 && <span className="tiny muted" style={{ padding: 6 }}>Y {col.length - 14} más. Usa el buscador.</span>}
              </div>
            );
          })}
        </div>
      </div>
      <ProjectDrawer p={open} onClose={() => setOpenId(null)} />
    </>
  );
}

export function ClientsPage() {
  const { s, forgetClient, toast } = useStore();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'nombre' | 'visita' | 'proyectos'>('visita');
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return s.clients
      .filter((c) => !c.deleted)
      .map((c) => {
        const projects = s.projects.filter((p) => p.clientId === c.id);
        const visits = s.appts.filter((a) => a.clientId === c.id && a.status === 'hecha').map((a) => a.date).sort();
        return { c, projects: projects.length, last: visits[visits.length - 1] ?? '' };
      })
      .filter((r) => !t || r.c.name.toLowerCase().includes(t) || r.c.email.toLowerCase().includes(t) || r.c.phone.replace(/\s/g, '').includes(t.replace(/\s/g, '')))
      .sort((a, b) => (sort === 'nombre' ? a.c.name.localeCompare(b.c.name, 'es') : sort === 'proyectos' ? b.projects - a.projects : b.last.localeCompare(a.last)));
  }, [q, sort, s.clients, s.projects, s.appts]);
  const open = openId ? s.clients.find((c) => c.id === openId) : null;
  const openProjects = open ? s.projects.filter((p) => p.clientId === open.id) : [];
  return (
    <>
      <Top title="Clientes" sub={`${rows.length} personas con datos en el estudio`} />
      <div className="pn-body">
        <div className="card">
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <div className="search"><Search size={16} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, correo o teléfono" /></div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => setSort('nombre')}>Cliente <ArrowUpDown size={11} /></th>
                  <th>Contacto</th>
                  <th>Llegó por</th>
                  <th className="sortable" onClick={() => setSort('proyectos')}>Proyectos <ArrowUpDown size={11} /></th>
                  <th className="sortable" onClick={() => setSort('visita')}>Última visita <ArrowUpDown size={11} /></th>
                  <th>Formulario</th>
                  <th>Avisos</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 60).map(({ c, projects, last }) => (
                  <tr key={c.id} className="clk" onClick={() => setOpenId(c.id)}>
                    <td><b>{c.name}</b></td>
                    <td className="small">{c.phone}<br /><span className="muted">{c.email}</span></td>
                    <td><span className="badge">{c.source}</span></td>
                    <td className="num">{projects}</td>
                    <td className="small">{last ? dayLong(last) : 'Aún no ha venido'}</td>
                    <td>{c.consentSigned ? <span className="badge ok">Firmado</span> : <span className="badge warn">Pendiente</span>}</td>
                    <td>{c.marketing ? <span className="badge sea">Sí</span> : <span className="badge">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && <Empty icon={<Search size={22} />} title="Nadie coincide con esa búsqueda" />}
        </div>
      </div>
      <Drawer open={!!open} onClose={() => { setOpenId(null); setConfirm(false); }} title={open?.name ?? ''} sub={open ? `${open.phone} · ${open.email || 'sin correo'}` : ''}
        foot={open && (
          <>
            <button className="btn btn-line btn-sm" onClick={() => {
              const data = { cliente: open, proyectos: openProjects, citas: s.appts.filter((a) => a.clientId === open.id) };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `cliente-${open.id}.json`;
              a.click();
            }}><Download size={15} /> Exportar sus datos</button>
            {!confirm ? <button className="btn btn-danger btn-sm" onClick={() => setConfirm(true)}><Trash2 size={15} /> Borrar sus datos</button> : <button className="btn btn-danger btn-sm" onClick={() => { forgetClient(open.id); setOpenId(null); setConfirm(false); toast('Datos borrados', 'info'); }}><TriangleAlert size={15} /> Confirmar borrado</button>}
          </>
        )}>
        {open && (
          <>
            <dl className="kv">
              <dt>Llegó por</dt><dd>{open.source}</dd>
              <dt>Cliente desde</dt><dd>{dayLong(open.createdAt)}</dd>
              <dt>Avisos</dt><dd>{open.marketing ? 'Acepta recibir avisos' : 'No quiere avisos'}</dd>
              <dt>Formulario</dt><dd>{open.consentSigned ? 'Firmado' : 'Pendiente'}</dd>
              {open.health && <><dt>Alergias</dt><dd>{open.health.allergies || 'Ninguna'}</dd><dt>A tener en cuenta</dt><dd>{[open.health.anticoagulants && 'anticoagulantes', open.health.diabetes && 'diabetes', open.health.skin && 'piel en la zona', open.health.pregnant && 'embarazo o lactancia'].filter(Boolean).join(', ') || 'Nada'}</dd></>}
            </dl>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {open.health?.signature && <img src={open.health.signature} alt="Firma del cliente" style={{ width: 220, borderRadius: 10, border: '1px solid var(--line)', background: '#fff' }} />}
            <b className="small">Proyectos</b>
            <div className="list">
              {openProjects.map((p) => <div key={p.id} className="li"><span className="grow small"><b>{p.title}</b> · {p.code}<br /><span className="muted">{styleBySlug(p.style)!.name}, {zoneById(p.zone)!.name}</span></span><span className={`badge ${stageTone(p.stage)}`}>{stageLabel(p.stage)}</span></div>)}
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}

