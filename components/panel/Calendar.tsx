'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarPlus, CloudCheck, CloudUpload, CloudOff, Lock, List, CalendarDays, Columns3 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { STUDIO, DAY_SHORT, type ArtistId } from '@/lib/mock/studio';
import { addDays, mondayOf, todayIso, weekday, dayNum, monthShort, hhmm, nowMin, dayLong, cap } from '@/lib/dates';
import { dayHours } from '@/lib/availability';
import { KIND, STATUS, shortName } from '@/lib/panel';
import { Avatar } from '../ui';
import ApptDrawer from './ApptDrawer';
import NewAppt from './NewAppt';
import type { Appointment, GoogleBusy } from '@/lib/types';

const OPEN = 600;
const CLOSE = 1200;
const PX = 52 / 60;

type Item = { kind: 'appt'; a: Appointment } | { kind: 'busy'; b: GoogleBusy };

function lanes(items: Item[]) {
  const sorted = [...items].sort((x, y) => st(x) - st(y));
  const out: { it: Item; lane: number; of: number }[] = [];
  let cluster: { it: Item; lane: number }[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const of = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => out.push({ ...c, of }));
    cluster = [];
  };
  for (const it of sorted) {
    if (st(it) >= clusterEnd && cluster.length) flush();
    const used = new Set(cluster.filter((c) => en(c.it) > st(it)).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    cluster.push({ it, lane });
    clusterEnd = Math.max(clusterEnd, en(it));
  }
  if (cluster.length) flush();
  return out;
}
const st = (i: Item) => (i.kind === 'appt' ? i.a.start : i.b.start);
const en = (i: Item) => (i.kind === 'appt' ? i.a.end : i.b.end);

export default function Calendar({ only, initialMode }: { only?: ArtistId; initialMode?: 'dia' | 'semana' | 'lista' }) {
  const { s, artist } = useStore();
  const [mode, setMode] = useState<'dia' | 'semana' | 'lista'>(initialMode ?? (only ? 'semana' : 'dia'));
  const [day, setDay] = useState(todayIso());
  const [hidden, setHidden] = useState<ArtistId[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ artistId: ArtistId; date: string; start: number } | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 60000);
    if (window.innerWidth < 700 && !initialMode) setMode('lista');
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const artists = s.artists.filter((a) => (only ? a.id === only : !hidden.includes(a.id)));
  const monday = mondayOf(day);
  const week = Array.from({ length: 6 }, (_, i) => addDays(monday, i));
  const today = todayIso();
  const ids = new Set(artists.map((a) => a.id));
  const appts = s.appts.filter((a) => ids.has(a.artistId));
  const busy = s.busy.filter((b) => ids.has(b.artistId));
  const conflictIds = useMemo(() => new Set(s.appts.filter((a) => a.status !== 'cancelada' && s.busy.some((b) => b.artistId === a.artistId && b.date === a.date && b.start < a.end && a.start < b.end)).map((a) => a.id)), [s.appts, s.busy]);
  const open = openId ? s.appts.find((a) => a.id === openId) ?? null : null;

  const step = (n: number) => setDay(addDays(day, mode === 'dia' ? n : n * 7));
  const label = mode === 'dia' ? dayLong(day) : `Semana del ${dayNum(monday)} de ${monthShort(monday)} al ${dayNum(addDays(monday, 5))} de ${monthShort(addDays(monday, 5))}`;

  const clickCol = (e: React.MouseEvent<HTMLDivElement>, artistId: ArtistId, date: string) => {
    if ((e.target as HTMLElement).closest('.ev')) return;
    const h = dayHours(artistId, date);
    if (!h) return;
    const r = e.currentTarget.getBoundingClientRect();
    const m = Math.round(((e.clientY - r.top) / PX + OPEN) / 30) * 30;
    setDraft({ artistId, date, start: Math.max(h.open, Math.min(h.close - 60, m)) });
  };

  const ev = (it: Item, lane = 0, of = 1, showArtist = false) => {
    const top = (st(it) - OPEN) * PX;
    const height = Math.max(22, (en(it) - st(it)) * PX - 3);
    const style = { top, height, left: `calc(${(lane / of) * 100}% + 3px)`, right: 'auto', width: `calc(${100 / of}% - 6px)` };
    if (it.kind === 'busy') {
      return (
        <div key={it.b.id} className="ev gbusy" style={style} title="Ocupado en su Google Calendar. Solo llega la hora, nunca el motivo.">
          <b><Lock size={11} style={{ verticalAlign: -1 }} /> Ocupado</b>
          <span>Google · {hhmm(it.b.start)} a {hhmm(it.b.end)}</span>
        </div>
      );
    }
    const a = it.a;
    const c = s.clients.find((x) => x.id === a.clientId);
    const p = a.projectId ? s.projects.find((x) => x.id === a.projectId) : null;
    const ar = artist(a.artistId);
    const cls = a.status === 'pendiente_senal' ? 'pend' : a.status === 'hecha' ? 'done' : a.status === 'cancelada' || a.status === 'no_show' ? 'cancel' : '';
    const Sync = a.gcal === 'sincronizada' ? CloudCheck : a.gcal === 'pendiente' ? CloudUpload : CloudOff;
    return (
      <button key={a.id} className={`ev ${cls} ${conflictIds.has(a.id) ? 'conflict' : ''}`} style={{ ...style, background: ar.color }} onClick={() => setOpenId(a.id)} title={`${hhmm(a.start)} a ${hhmm(a.end)} · ${c?.name ?? ''} · ${STATUS[a.status].label}`}>
        <Sync size={12} className="sync" />
        <b>{hhmm(a.start)} {c ? shortName(c.name) : ''}</b>
        <span>{showArtist ? `${ar.short} · ` : ''}{p ? p.title : KIND[a.kind]}</span>
        {height > 60 && <span>{KIND[a.kind]}{a.sessionNo ? ` ${a.sessionNo}` : ''} · {STATUS[a.status].label}</span>}
      </button>
    );
  };

  const nowTop = (nowMin() - OPEN) * PX;
  const hours = Array.from({ length: (CLOSE - OPEN) / 60 }, (_, i) => OPEN + i * 60);
  const colH = (CLOSE - OPEN) * PX;

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="toolbar between">
        <div className="row wrapflex" style={{ gap: 8 }}>
          <button className="btn btn-line btn-sm" onClick={() => setDay(todayIso())}>Hoy</button>
          <button className="icon-btn" aria-label="Anterior" onClick={() => step(-1)}><ChevronLeft size={20} /></button>
          <button className="icon-btn" aria-label="Siguiente" onClick={() => step(1)}><ChevronRight size={20} /></button>
          <b>{cap(label)}</b>
        </div>
        <div className="row wrapflex" style={{ gap: 8 }}>
          <div className="seg" role="tablist">
            {!only && <button className={mode === 'dia' ? 'on' : ''} onClick={() => setMode('dia')}><Columns3 size={14} style={{ verticalAlign: -2 }} /> Día</button>}
            <button className={mode === 'semana' ? 'on' : ''} onClick={() => setMode('semana')}><CalendarDays size={14} style={{ verticalAlign: -2 }} /> Semana</button>
            <button className={mode === 'lista' ? 'on' : ''} onClick={() => setMode('lista')}><List size={14} style={{ verticalAlign: -2 }} /> Lista</button>
          </div>
          <button className="btn btn-dark btn-sm" onClick={() => setDraft({ artistId: only ?? artists[0]?.id ?? 'lua', date: day < today ? today : day, start: 660 })}><CalendarPlus size={15} /> Nueva cita</button>
        </div>
      </div>
      {!only && (
        <div className="legend">
          {s.artists.map((a) => (
            <button key={a.id} className={hidden.includes(a.id) ? 'off' : ''} onClick={() => setHidden((h) => (h.includes(a.id) ? h.filter((x) => x !== a.id) : [...h, a.id]))} aria-pressed={!hidden.includes(a.id)}>
              <span className="dot" style={{ background: a.color }} /> {a.short}
            </button>
          ))}
          <span className="row tiny muted" style={{ gap: 6 }}><span className="dot" style={{ background: '#d8d0c3' }} /> Ocupado en Google</span>
        </div>
      )}

      {mode === 'lista' ? (
        <div className="agenda-list">
          {week.map((d) => {
            const list: Item[] = [...appts.filter((a) => a.date === d).map((a) => ({ kind: 'appt' as const, a })), ...busy.filter((b) => b.date === d).map((b) => ({ kind: 'busy' as const, b }))].sort((x, y) => st(x) - st(y));
            return (
              <div key={d} className="agenda-day">
                <h4>{cap(dayLong(d))}{d === today ? ' · hoy' : ''}</h4>
                {list.length ? (
                  <div className="list">
                    {list.map((it) => {
                      if (it.kind === 'busy') {
                        const ar = artist(it.b.artistId);
                        return <div key={it.b.id} className="li" style={{ opacity: 0.75 }}><Lock size={16} /><span className="grow small"><b>{hhmm(it.b.start)} a {hhmm(it.b.end)}</b> · {ar.short} ocupado en Google</span></div>;
                      }
                      const a = it.a;
                      const c = s.clients.find((x) => x.id === a.clientId);
                      const p = a.projectId ? s.projects.find((x) => x.id === a.projectId) : null;
                      const ar = artist(a.artistId);
                      return (
                        <button key={a.id} className="li clk" style={{ textAlign: 'left', borderLeft: `4px solid ${ar.color}` }} onClick={() => setOpenId(a.id)}>
                          <Avatar k={ar.photo} size={36} radius={10} />
                          <span className="grow" style={{ minWidth: 0 }}>
                            <b>{hhmm(a.start)} a {hhmm(a.end)}</b> · {c?.name}
                            <div className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ar.short} · {p ? p.title : KIND[a.kind]}</div>
                          </span>
                          <span className={`badge ${STATUS[a.status].tone}`}>{STATUS[a.status].label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : <div className="small muted">Sin citas</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="cal-scroll">
          {mode === 'dia' ? (
            <div className="cal" style={{ gridTemplateColumns: `56px repeat(${artists.length}, minmax(150px, 1fr))` }}>
              <div className="cal-corner" />
              {artists.map((a) => (
                <div key={a.id} className="cal-hd"><Avatar k={a.photo} size={28} radius={9} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.short}</span></div>
              ))}
              <div className="cal-times">{hours.map((h) => <div key={h}>{hhmm(h)}</div>)}</div>
              {artists.map((a) => {
                const h = dayHours(a.id, day);
                const items: Item[] = [...appts.filter((x) => x.artistId === a.id && x.date === day).map((x) => ({ kind: 'appt' as const, a: x })), ...busy.filter((b) => b.artistId === a.id && b.date === day).map((b) => ({ kind: 'busy' as const, b }))];
                return (
                  <div key={a.id} className={`cal-col ${h ? '' : 'closed'}`} style={{ height: colH }} onClick={(e) => clickCol(e, a.id, day)}>
                    {h && h.close < CLOSE && <div style={{ position: 'absolute', left: 0, right: 0, top: (h.close - OPEN) * PX, bottom: 0, background: 'repeating-linear-gradient(45deg, transparent 0 8px, rgba(0,0,0,.03) 8px 16px)' }} />}
                    {lanes(items).map(({ it, lane, of }) => ev(it, lane, of))}
                    {day === today && nowTop > 0 && nowTop < colH && <div className="now-line" style={{ top: nowTop }} />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cal" style={{ gridTemplateColumns: `56px repeat(6, minmax(${only ? 120 : 150}px, 1fr))` }}>
              <div className="cal-corner" />
              {week.map((d) => (
                <div key={d} className={`cal-hd ${d === today ? 'today' : ''}`}>{cap(DAY_SHORT[weekday(d)])} {dayNum(d)}</div>
              ))}
              <div className="cal-times">{hours.map((h) => <div key={h}>{hhmm(h)}</div>)}</div>
              {week.map((d) => {
                const wd = weekday(d);
                const open = STUDIO.hours[wd];
                const items: Item[] = [...appts.filter((x) => x.date === d).map((x) => ({ kind: 'appt' as const, a: x })), ...busy.filter((b) => b.date === d).map((b) => ({ kind: 'busy' as const, b }))];
                const working = only ? !!dayHours(only, d) : !!open;
                return (
                  <div key={d} className={`cal-col ${working ? '' : 'closed'}`} style={{ height: colH }} onClick={(e) => clickCol(e, only ?? artists[0]?.id, d)}>
                    {open && open.close < CLOSE && <div style={{ position: 'absolute', left: 0, right: 0, top: (open.close - OPEN) * PX, bottom: 0, background: 'repeating-linear-gradient(45deg, transparent 0 8px, rgba(0,0,0,.03) 8px 16px)' }} />}
                    {lanes(items).map(({ it, lane, of }) => ev(it, lane, of, !only))}
                    {d === today && nowTop > 0 && nowTop < colH && <div className="now-line" style={{ top: nowTop }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <ApptDrawer appt={open} onClose={() => setOpenId(null)} />
      {draft && <NewAppt draft={draft} only={only} onClose={() => setDraft(null)} />}
    </div>
  );
}
