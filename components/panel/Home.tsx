'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, useEffect } from 'react';
import { CalendarDays, Clock, Inbox, CreditCard, Bot, TriangleAlert, ArrowRight, Unplug, MessageSquareText, Sparkles, Hourglass, ClipboardCheck, Images } from 'lucide-react';
import { useStore } from '@/lib/store';
import { DAY_SHORT, styleBySlug, zoneById, type ArtistId } from '@/lib/mock/studio';
import { addDays, mondayOf, todayIso, weekday, hhmm, nowMin, ago, dayLong, durLabel, dayNum, cap, pl } from '@/lib/dates';
import { bookedMinutes } from '@/lib/availability';
import { CHANNEL, KIND, STATUS, shortName, SOURCE_COLOR, stageLabel } from '@/lib/panel';
import { Avatar, Pic } from '../ui';
import { WeekBoard } from '../three';
import { Top, useRole } from './Shell';
import Calendar from './Calendar';
import ApptDrawer from './ApptDrawer';
import type { Source } from '@/lib/types';

function useBoard() {
  const { s } = useStore();
  const monday = mondayOf(todayIso());
  const days = Array.from({ length: 6 }, (_, i) => addDays(monday, i));
  const hours = s.artists.map((a) => days.map((d) => bookedMinutes(a.id, d, s.appts) / 60));
  const last = useRef<{ n: number; key: string }>({ n: 0, key: '' });
  const newest = [...s.appts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  let flash: { a: number; d: number; n: number } | null = null;
  if (newest && days.includes(newest.date)) {
    if (last.current.key !== newest.id) last.current = { n: last.current.n + 1, key: newest.id };
    flash = { a: s.artists.findIndex((x) => x.id === newest.artistId), d: days.indexOf(newest.date), n: last.current.n };
  }
  return { artists: s.artists.map((a) => ({ id: a.id, color: a.color })), days, hours, today: days.indexOf(todayIso()), flash };
}

export function ManagerHome() {
  const { s, artist } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const board = useBoard();
  const today = todayIso();
  const monday = mondayOf(today);
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(monday, i));
  const live = s.appts.filter((a) => a.status !== 'cancelada' && a.status !== 'no_show');
  const weekAppts = live.filter((a) => weekDays.includes(a.date));
  const weekHours = weekAppts.reduce((n, a) => n + (a.end - a.start), 0) / 60;
  const capacity = s.artists.reduce((n, a) => n + weekDays.filter((d) => a.workDays.includes(weekday(d))).reduce((m, d) => m + (weekday(d) === 5 ? 5 : 9), 0), 0);
  const requests = s.projects.filter((p) => p.stage === 'solicitud');
  const pendingDeposit = live.filter((a) => a.status === 'pendiente_senal' && a.date >= today);
  const chat7 = s.conversations.filter((c) => c.startedAt.slice(0, 10) >= addDays(today, -7));
  const chatBookings = chat7.filter((c) => c.outcome === 'reserva').length;
  const reviews30 = s.reviews.filter((r) => r.date >= addDays(today, -30));
  const conflictsList = s.appts.filter((a) => a.date >= today && a.status !== 'cancelada' && s.busy.some((b) => b.artistId === a.artistId && b.date === a.date && b.start < a.end && a.start < b.end));
  const notConnected = s.artists.filter((a) => !s.gcal[a.id]?.connected);
  const unanswered = s.unanswered.filter((u) => !u.resolved);
  const nowM = nowMin();
  const unclosed = s.appts.filter((a) => a.status === 'confirmada' && a.kind !== 'consulta' && (a.date < today || (a.date === today && a.end <= nowM)));
  const todayList = live.filter((a) => a.date === today).sort((a, b) => a.start - b.start);
  const recent = [...s.projects].filter((p) => p.channel === 'web' || p.channel === 'chat').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);
  const bySource = useMemo(() => {
    const m = new Map<Source, number>();
    s.conversions.filter((c) => c.type === 'reserva_web' || c.type === 'reserva_chat' || c.type === 'consulta_cover').forEach((c) => m.set(c.source, (m.get(c.source) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [s.conversions]);
  const maxSrc = Math.max(1, ...bySource.map(([, n]) => n));

  return (
    <>
      <Top title="Resumen del estudio" sub={`${dayLong(today)} · ${s.artists.length} tatuadores`} actions={<Link href="/panel/calendario" className="btn btn-dark btn-sm"><CalendarDays size={15} /> Calendario general</Link>} />
      <div className="pn-body">
        <div className="kpis">
          <div className="kpi"><small>Citas esta semana</small><b>{weekAppts.length}</b><span className="sub">{Math.round(weekHours)} h de {Math.round(capacity)} h posibles</span></div>
          <div className="kpi" style={{ animationDelay: '60ms' }}><small>Solicitudes sin asignar</small><b>{requests.length}</b><span className="sub">{(() => { const n = requests.filter((p) => p.channel === 'chat').length; return n === 1 ? '1 entró por el asistente' : `${n} entraron por el asistente`; })()}</span></div>
          <div className="kpi" style={{ animationDelay: '120ms' }}><small>Huecos sin señal</small><b>{pendingDeposit.length}</b><span className="sub">guardados 48 h</span></div>
          <div className="kpi" style={{ animationDelay: '180ms' }}><small>Reservas del asistente</small><b>{chatBookings}</b><span className="sub">de {chat7.length} charlas en 7 días</span></div>
          <div className="kpi" style={{ animationDelay: '240ms' }}><small>Opiniones en Google</small><b>{reviews30.length}</b><span className="sub">últimos 30 días</span></div>
        </div>

        <div className="two">
          <div className="card">
            <div className="card-head"><h2>La semana de un vistazo</h2><span className="tiny muted">Altura = horas reservadas</span></div>
            <div className="board3d">
              <WeekBoard data={board} />
              <div className="lg">{s.artists.map((a) => <span key={a.id} className="row" style={{ gap: 5 }}><span className="dot" style={{ background: a.color }} />{a.short}</span>)}</div>
              <div className="days-lbl">{board.days.map((d) => <span key={d} style={{ color: d === today ? '#fff' : undefined }}>{cap(DAY_SHORT[weekday(d)])} {dayNum(d)}</span>)}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h2>Avisos</h2></div>
            <div className="list">
              {unclosed.length > 0 && (
                <button className="li clk" style={{ textAlign: 'left' }} onClick={() => setOpenId(unclosed[0].id)}>
                  <ClipboardCheck size={18} color="var(--accent)" />
                  <span className="grow small"><b>{unclosed.length} {unclosed.length === 1 ? 'sesión terminada sin cerrar' : 'sesiones terminadas sin cerrar'}</b><br />Al cerrarlas sale el código de la ruleta para el cliente.</span>
                </button>
              )}
              {conflictsList.map((a) => (
                <button key={a.id} className="li clk" style={{ textAlign: 'left', borderColor: '#f2c1c8', background: 'var(--bad-soft)' }} onClick={() => setOpenId(a.id)}>
                  <TriangleAlert size={18} color="var(--bad)" />
                  <span className="grow small"><b>{artist(a.artistId).short} tiene algo en Google a la hora de una cita</b><br />{dayLong(a.date)}, {hhmm(a.start)}</span>
                </button>
              ))}
              {notConnected.map((a) => (
                <Link key={a.id} href="/panel/google" className="li clk"><Unplug size={18} color="var(--warn)" /><span className="grow small"><b>{a.short} no ha conectado su Google Calendar</b><br />Sus citas no salen en su móvil y el asistente no ve lo que tiene ocupado.</span></Link>
              ))}
              {pendingDeposit.slice(0, 3).map((a) => (
                <button key={a.id} className="li clk" style={{ textAlign: 'left' }} onClick={() => setOpenId(a.id)}>
                  <CreditCard size={18} color="var(--warn)" />
                  <span className="grow small"><b>Señal pendiente: {shortName(s.clients.find((c) => c.id === a.clientId)?.name ?? '')}</b><br />{artist(a.artistId).short}, {dayLong(a.date)} {hhmm(a.start)}</span>
                </button>
              ))}
              {unanswered.length > 0 && <Link href="/panel/asistente" className="li clk"><Bot size={18} color="var(--sea)" /><span className="grow small"><b>{unanswered.length === 1 ? '1 pregunta que el asistente no supo responder' : `${unanswered.length} preguntas que el asistente no supo responder`}</b><br />Enséñale la respuesta una vez y ya la tiene.</span></Link>}
            </div>
          </div>
        </div>

        <div className="two">
          <div className="card">
            <div className="card-head"><h2>Hoy en el estudio</h2><Link href="/panel/calendario" className="small strong">Ver el día <ArrowRight size={13} style={{ verticalAlign: -2 }} /></Link></div>
            {todayList.length ? (
              <div className="list">
                {todayList.map((a) => {
                  const ar = artist(a.artistId);
                  const c = s.clients.find((x) => x.id === a.clientId);
                  const now = nowMin();
                  const on = a.start <= now && now < a.end;
                  return (
                    <button key={a.id} className="li clk" style={{ textAlign: 'left', borderLeft: `4px solid ${ar.color}` }} onClick={() => setOpenId(a.id)}>
                      <Avatar k={ar.photo} size={36} radius={10} />
                      <span className="grow" style={{ minWidth: 0 }}><b>{hhmm(a.start)} a {hhmm(a.end)}</b> · {c?.name}<div className="tiny muted">{ar.short} · {KIND[a.kind]}</div></span>
                      {on ? <span className="badge accent">En curso</span> : <span className={`badge ${STATUS[a.status].tone}`}>{STATUS[a.status].label}</span>}
                    </button>
                  );
                })}
              </div>
            ) : <p className="small muted">Hoy no hay citas.</p>}
          </div>
          <div className="card">
            <div className="card-head"><h2>Últimas reservas de la web y el asistente</h2></div>
            <div className="list">
              {recent.map((p) => {
                const c = s.clients.find((x) => x.id === p.clientId);
                return (
                  <Link key={p.id} href="/panel/proyectos" className="li clk">
                    <span className="grow" style={{ minWidth: 0 }}><b>{c?.name}</b> · {p.title}<div className="tiny muted">{styleBySlug(p.style)!.name} · {zoneById(p.zone)!.name} · {ago(p.createdAt)}</div></span>
                    <span className={`badge ${p.channel === 'chat' ? 'sea' : ''}`}>{CHANNEL[p.channel]}</span>
                  </Link>
                );
              })}
            </div>
            <div style={{ marginTop: 16 }}>
              <b className="small">De dónde vienen las reservas</b>
              <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                {bySource.map(([src, n]) => (
                  <div key={src} className="row" style={{ gap: 10 }}>
                    <span className="small" style={{ width: 120 }}>{src}</span>
                    <div className="bar grow"><i style={{ width: `${(n / maxSrc) * 100}%`, background: SOURCE_COLOR[src] }} /></div>
                    <b className="small num" style={{ width: 24, textAlign: 'right' }}>{n}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ApptDrawer appt={openId ? s.appts.find((a) => a.id === openId) ?? null : null} onClose={() => setOpenId(null)} />
    </>
  );
}

export function ArtistHome({ id }: { id: ArtistId }) {
  const { s, artist } = useStore();
  const me = artist(id);
  const today = todayIso();
  const now = nowMin();
  const mine = s.appts.filter((a) => a.artistId === id && a.status !== 'cancelada' && a.status !== 'no_show');
  const next = mine.filter((a) => a.date > today || (a.date === today && a.end > now)).sort((a, b) => (a.date + hhmm(a.start) > b.date + hhmm(b.start) ? 1 : -1))[0];
  const nextP = next?.projectId ? s.projects.find((p) => p.id === next.projectId) : null;
  const nextC = next ? s.clients.find((c) => c.id === next.clientId) : null;
  const monday = mondayOf(today);
  const weekMins = mine.filter((a) => a.date >= monday && a.date <= addDays(monday, 5)).reduce((n, a) => n + a.end - a.start, 0);
  const newReq = s.projects.filter((p) => p.artistId === id && p.stage === 'solicitud').length;
  const toPropose = s.projects.filter((p) => p.artistId === id && p.stage === 'diseno' && !s.appts.some((a) => a.projectId === p.id && a.date >= today && a.status !== 'cancelada')).length;
  const [openId, setOpenId] = useState<string | null>(null);
  const board = useBoard();
  useEffect(() => setOpenId(null), [id]);
  return (
    <>
      <Top title={`Mi semana, ${me.short}`} sub="Solo ves tus citas y tus proyectos. Lo que marcas en tu Google Calendar aparece aquí como ocupado." />
      <div className="pn-body">
        <div className="kpis">
          <div className="kpi"><small>Horas reservadas esta semana</small><b>{durLabel(weekMins)}</b></div>
          <div className="kpi"><small>Solicitudes nuevas para mí</small><b>{newReq}</b><span className="sub"><Link href="/panel/proyectos">Ver proyectos</Link></span></div>
          <div className="kpi"><small>Diseños sin fecha propuesta</small><b>{toPropose}</b></div>
          <div className="kpi"><small>Google Calendar</small><b style={{ fontSize: 18 }}>{s.gcal[id]?.connected ? 'Conectado' : 'Sin conectar'}</b><span className="sub"><Link href="/panel/google">{s.gcal[id]?.connected ? 'Ver sincronización' : 'Conectarlo ahora'}</Link></span></div>
        </div>
        {next && nextC && (
          <div className="card" style={{ borderLeft: `5px solid ${me.color}` }}>
            <div className="card-head"><h2 className="row" style={{ gap: 8 }}><Clock size={17} /> Tu próxima cita</h2><button className="btn btn-line btn-sm" onClick={() => setOpenId(next.id)}>Abrir</button></div>
            <div className="row wrapflex" style={{ gap: 18, alignItems: 'flex-start' }}>
              <div className="stack grow" style={{ gap: 6, minWidth: 220 }}>
                <b style={{ fontSize: 20 }}>{cap(dayLong(next.date))}, {hhmm(next.start)}</b>
                <span>{nextC.name} · {KIND[next.kind]}{next.sessionNo ? ` ${next.sessionNo}` : ''} · {durLabel(next.end - next.start)}</span>
                {nextP && <span className="small muted">{nextP.title}: {nextP.description}</span>}
                <div className="row wrapflex" style={{ gap: 6 }}>
                  <span className={`badge ${STATUS[next.status].tone}`}><Hourglass size={12} /> {STATUS[next.status].label}</span>
                  <span className={`badge ${nextC.consentSigned ? 'ok' : 'warn'}`}><ClipboardCheck size={12} /> {nextC.consentSigned ? 'Formulario firmado' : 'Formulario sin firmar'}</span>
                  {nextP && <span className="badge"><Images size={12} /> {pl(nextP.references.length, 'referencia', 'referencias')}</span>}
                </div>
              </div>
              {nextP && nextP.references.length > 0 && <div className="ref-grid" style={{ width: 200 }}>{nextP.references.slice(0, 2).map((r) => <div key={r}><Pic id={r} sizes="100px" ar="1:1" alt="Referencia del cliente" /></div>)}</div>}
            </div>
          </div>
        )}
        <div className="card">
          <div className="card-head"><h2>Tu semana en bloques</h2><span className="tiny muted">Altura = horas reservadas cada día</span></div>
          <div className="board3d" style={{ height: 220 }}>
            <WeekBoard data={{ ...board, artists: board.artists.filter((a) => a.id === id), hours: board.hours.filter((_, i) => board.artists[i].id === id), flash: board.flash && board.artists[board.flash.a]?.id === id ? { ...board.flash, a: 0 } : null }} />
            <div className="days-lbl">{board.days.map((d) => <span key={d} style={{ color: d === today ? '#fff' : undefined }}>{cap(DAY_SHORT[weekday(d)])} {dayNum(d)}</span>)}</div>
          </div>
        </div>
        <div className="card"><Calendar only={id} key={id} /></div>
      </div>
      <ApptDrawer appt={openId ? s.appts.find((a) => a.id === openId) ?? null : null} onClose={() => setOpenId(null)} />
    </>
  );
}

function BoardCard() {
  const { s } = useStore();
  const board = useBoard();
  const today = todayIso();
  const [open, setOpen] = useState(true);
  return (
    <div className="card">
      <div className="card-head" style={{ marginBottom: open ? 14 : 0 }}><h2>Esta semana, en bloques</h2><button className="btn btn-line btn-xs" onClick={() => setOpen((o) => !o)}>{open ? 'Ocultar' : 'Mostrar'}</button></div>
      {open && (
        <div className="board3d" style={{ height: 240 }}>
          <WeekBoard data={board} />
          <div className="lg">{s.artists.map((a) => <span key={a.id} className="row" style={{ gap: 5 }}><span className="dot" style={{ background: a.color }} />{a.short}</span>)}</div>
          <div className="days-lbl">{board.days.map((d) => <span key={d} style={{ color: d === today ? '#fff' : undefined }}>{cap(DAY_SHORT[weekday(d)])} {dayNum(d)}</span>)}</div>
        </div>
      )}
    </div>
  );
}

export function CalendarPage() {
  const { isManager, artistId } = useRole();
  const { s } = useStore();
  const synced = s.appts.filter((a) => a.gcal === 'sincronizada').length;
  return (
    <>
      <Top title={isManager ? 'Calendario general' : 'Mi agenda'} sub={isManager ? `Todas las agendas en un sitio. ${synced} citas ya están en Google Calendar.` : 'Tu agenda, sin las de tus compañeros'} />
      <div className="pn-body">
        {isManager && <BoardCard />}
        <div className="card"><Calendar only={isManager ? undefined : artistId ?? undefined} /></div>
      </div>
    </>
  );
}

export function RequestsPage() {
  const { s, updateProject, addNote, toast, artist } = useStore();
  const { isManager } = useRole();
  const list = s.projects.filter((p) => p.stage === 'solicitud').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const [gone, setGone] = useState<string[]>([]);
  return (
    <>
      <Top title="Solicitudes" sub="Ideas que han llegado por la web o por el asistente y aún no tienen tatuador" />
      <div className="pn-body">
        {!list.length && <div className="card"><p className="muted">No hay solicitudes pendientes.</p></div>}
        <div className="two" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          {list.filter((p) => !gone.includes(p.id)).map((p) => {
            const c = s.clients.find((x) => x.id === p.clientId);
            const st = styleBySlug(p.style)!;
            const suggested = s.artists.filter((a) => a.styles.includes(p.style));
            return (
              <div key={p.id} className="card enter stack" style={{ gap: 12 }}>
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div><b style={{ fontSize: 16 }}>{p.title}</b><div className="tiny muted">{c?.name} · {p.code} · {ago(p.createdAt)}</div></div>
                  <span className={`badge ${p.channel === 'chat' ? 'sea' : ''}`}>{p.channel === 'chat' ? <MessageSquareText size={12} /> : <Inbox size={12} />} {CHANNEL[p.channel]}</span>
                </div>
                <p className="small" style={{ color: 'var(--ink-2)' }}>{p.description}</p>
                <div className="row wrapflex" style={{ gap: 6 }}>
                  <span className="badge">{st.name}</span><span className="badge">{zoneById(p.zone)!.name}</span><span className="badge">{p.sizeCm} cm</span><span className="badge accent">{p.quote.min} a {p.quote.max} €</span>
                  {p.source === 'Google Ads' && <span className="badge warn"><Sparkles size={12} /> Google Ads</span>}
                </div>
                <div className="stack" style={{ gap: 6 }}>
                  <span className="tiny muted strong">{p.artistId ? `Pidió a ${artist(p.artistId).short}. Asignar a:` : 'Asignar a:'}</span>
                  <div className="row wrapflex" style={{ gap: 6 }}>
                    {suggested.map((a) => (
                      <button key={a.id} className="chip" disabled={!isManager} onClick={() => {
                        setGone((g) => [...g, p.id]);
                        setTimeout(() => {
                          updateProject(p.id, { artistId: a.id, stage: 'diseno' });
                          addNote(p.id, `Asignado a ${a.short} desde Solicitudes.`, 'Clara');
                          toast(`Asignado a ${a.short}. Ya lo ve en sus proyectos.`);
                        }, 250);
                      }}>
                        <Avatar k={a.photo} size={22} radius={7} /> {a.short}{p.artistId === a.id ? ' (pedido)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="tiny muted">Etapa actual de todas: {stageLabel('solicitud')}. Al asignarlas pasan a Diseño en el panel del tatuador.</p>
      </div>
    </>
  );
}

