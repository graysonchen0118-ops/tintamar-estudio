'use client';

import { useMemo, useState } from 'react';
import { CloudCheck, Plug, Unplug, RefreshCw, ArrowUpRight, ArrowDownLeft, CalendarX2, ShieldCheck, Lock, Bot, MessageSquareText, Plus, Pencil, Trash2, WandSparkles, Megaphone, ExternalLink, FileCode, Image as ImageIcon, Globe, Check, TriangleAlert, Info } from 'lucide-react';
import { useStore, wait } from '@/lib/store';
import { STYLES, type ArtistId, type KbEntry } from '@/lib/mock/studio';
import { PHOTOS } from '@/lib/photos';
import { addDays, todayIso, ago, hhmm, toMin, dayLong, stampNow, pl } from '@/lib/dates';
import { conflicts } from '@/lib/availability';
import { studioJsonLd } from '@/lib/site';
import { SOURCE_COLOR } from '@/lib/panel';
import { Avatar, Modal, Drawer, Switch, Spinner, Pic } from '../ui';
import { Top, useRole, ManagerOnly } from './Shell';
import type { ConversionType, Outcome, Source } from '@/lib/types';

export function GooglePage() {
  const { s, artist, connectGcal, disconnectGcal, syncNow, addBusy, setPrivacy, toast } = useStore();
  const { isManager, artistId } = useRole();
  const list = isManager ? s.artists : s.artists.filter((a) => a.id === artistId);
  const [connecting, setConnecting] = useState<ArtistId | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const firstConnected = list.find((a) => s.gcal[a.id]?.connected)?.id ?? list[0]?.id;
  const [sim, setSim] = useState({ artistId: firstConnected as ArtistId, date: addDays(todayIso(), 2), from: '12:00', to: '14:00' });
  const [simResult, setSimResult] = useState<string | null>(null);
  const log = s.syncLog.filter((l) => isManager || l.artistId === artistId).slice(0, 18);

  return (
    <>
      <Top title={isManager ? 'Google Calendar' : 'Mi Google Calendar'} sub={isManager ? 'Cada tatuador con su calendario, y la gerencia con todos a la vez' : 'Tus citas del estudio llegan a tu móvil, y lo que tú marques llega aquí como ocupado'} />
      <div className="pn-body">
        <div className="callout"><Info size={18} /><span>Funciona en los dos sentidos. Una cita del estudio aparece en el Google Calendar del tatuador en segundos. Y si el tatuador apunta algo suyo en Google, aquí llega solo la hora como ocupado, sin título ni detalles, y la web y el asistente dejan de ofrecer ese hueco.</span></div>
        <div className="two" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {list.map((a) => {
            const g = s.gcal[a.id];
            return (
              <div key={a.id} className="card stack" style={{ gap: 12 }}>
                <div className="row" style={{ gap: 12 }}>
                  <Avatar k={a.photo} size={44} />
                  <div className="grow"><b>{a.name}</b><div className="tiny muted">{g?.connected ? g.email : 'Sin conectar'}</div></div>
                  {g?.connected ? <span className="badge ok"><CloudCheck size={12} /> Conectado</span> : <span className="badge warn"><Unplug size={12} /> Sin conectar</span>}
                </div>
                {g?.connected ? (
                  <>
                    <div className="row wrapflex small" style={{ gap: 14 }}>
                      <span><ArrowUpRight size={14} color="var(--sea)" style={{ verticalAlign: -2 }} /> {pl(g.up, 'cita enviada', 'citas enviadas')}</span>
                      <span><ArrowDownLeft size={14} color="var(--accent)" style={{ verticalAlign: -2 }} /> {pl(g.down, 'ocupado recibido', 'ocupados recibidos')}</span>
                    </div>
                    <span className="tiny muted">Calendario «{g.calendar}» · última revisión {g.lastSync ? ago(g.lastSync) : 'nunca'}</span>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn btn-line btn-sm" disabled={syncing === a.id} onClick={async () => { setSyncing(a.id); await syncNow(a.id); setSyncing(null); toast(`Calendario de ${a.short} al día`); }}>{syncing === a.id ? <Spinner size={14} /> : <RefreshCw size={14} />} Sincronizar ahora</button>
                      <button className="btn btn-line btn-sm" onClick={() => { disconnectGcal(a.id); toast(`Calendario de ${a.short} desconectado`, 'info'); }}><Unplug size={14} /> Desconectar</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="small muted">Mientras no lo conecte, sus citas no salen en su móvil y el asistente no ve lo que tiene apuntado fuera del estudio.</span>
                    <button className="btn btn-dark btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setConnecting(a.id)}><Plug size={14} /> Conectar Google Calendar</button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="two">
          <div className="card">
            <div className="card-head"><h2>Probar: algo personal en Google</h2></div>
            <p className="small muted" style={{ marginBottom: 12 }}>Como si {isManager ? 'un tatuador' : 'tú'} apuntara el dentista en su Google Calendar. Mira después la web: ese hueco ya no se ofrece.</p>
            <div className="form-grid">
              {isManager && (
                <label className="field"><span>Tatuador</span>
                  <select className="select" value={sim.artistId} onChange={(e) => setSim({ ...sim, artistId: e.target.value as ArtistId })}>
                    {s.artists.filter((a) => s.gcal[a.id]?.connected).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
              )}
              <label className="field"><span>Día</span><input className="input" type="date" value={sim.date} onChange={(e) => setSim({ ...sim, date: e.target.value })} /></label>
              <label className="field"><span>Desde</span><input className="input" type="time" step={1800} value={sim.from} onChange={(e) => setSim({ ...sim, from: e.target.value })} /></label>
              <label className="field"><span>Hasta</span><input className="input" type="time" step={1800} value={sim.to} onChange={(e) => setSim({ ...sim, to: e.target.value })} /></label>
            </div>
            <button className="btn btn-dark btn-sm" style={{ marginTop: 12 }} disabled={!s.gcal[sim.artistId]?.connected} onClick={async () => {
              const start = toMin(sim.from);
              const end = toMin(sim.to);
              if (end <= start) return toast('La hora final tiene que ser después de la inicial', 'bad');
              setSimResult(null);
              await wait(900);
              const b = addBusy({ artistId: sim.artistId, date: sim.date, start, end });
              const c = conflicts({ artistId: b.artistId, date: b.date, start: b.start, end: b.end }, s.appts, []);
              setSimResult(c.overlaps.length ? `Ojo: ${artist(b.artistId).short} ya tenía una cita del estudio a esa hora (${hhmm(c.overlaps[0].start)}). Aparece marcada en rojo en el calendario general.` : `Recibido. ${artist(b.artistId).short} sale ocupado el ${dayLong(b.date)} de ${sim.from} a ${sim.to}, y ni la web ni el asistente ofrecen ese hueco.`);
              toast('Ocupado recibido desde Google Calendar');
            }}><CalendarX2 size={15} /> Apuntar ocupado en Google</button>
            {simResult && <div className={`callout ${simResult.startsWith('Ojo') ? 'bad' : ''}`} style={{ marginTop: 12 }}>{simResult.startsWith('Ojo') ? <TriangleAlert size={18} /> : <Check size={18} />}<span>{simResult}</span></div>}
          </div>
          {isManager && (
            <div className="card">
              <div className="card-head"><h2>Qué se escribe en Google</h2></div>
              <div className="stack" style={{ gap: 10 }}>
                {([['inicial', 'Nombre de pila e inicial', 'Tatuaje · Lucía G. · 11:00'], ['completo', 'Nombre completo', 'Tatuaje · Lucía García · 11:00']] as const).map(([v, t, ex]) => (
                  <label key={v} className="li clk" style={{ borderColor: s.gcalPrivacy === v ? 'var(--accent)' : undefined }}>
                    <input type="radio" name="priv" checked={s.gcalPrivacy === v} onChange={() => { setPrivacy(v); toast('Guardado. Se aplica a las próximas citas.'); }} style={{ accentColor: 'var(--accent)' }} />
                    <span className="grow"><b className="small">{t}</b><div className="tiny muted">{ex}</div></span>
                  </label>
                ))}
                <div className="callout"><ShieldCheck size={18} /><span>Nunca se envían el teléfono, el correo ni el formulario de salud. Un calendario de Google se comparte con facilidad, y eso no debe viajar con él.</span></div>
                <div className="li"><Lock size={16} /><span className="small grow">La gerencia ve los seis calendarios a la vez porque cada uno está compartido con su cuenta. Cada tatuador solo ve el suyo.</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h2>Registro de sincronización</h2><span className="tiny muted">Lo último primero</span></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Cuándo</th><th>Tatuador</th><th>Sentido</th><th>Qué</th><th /></tr></thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id}>
                    <td className="small">{ago(l.at)}</td>
                    <td className="small">{l.artistId === 'general' ? 'General' : artist(l.artistId).short}</td>
                    <td>{l.dir === 'up' ? <span className="badge sea"><ArrowUpRight size={12} /> Estudio a Google</span> : <span className="badge accent"><ArrowDownLeft size={12} /> Google al estudio</span>}</td>
                    <td className="small">{l.text}</td>
                    <td>{l.ok ? <Check size={15} color="var(--ok)" /> : <TriangleAlert size={15} color="var(--bad)" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={!!connecting} onClose={() => setConnecting(null)} title="Conectar Google Calendar">
        {connecting && (
          <div className="stack" style={{ gap: 14 }}>
            <p className="small">{artist(connecting).name} va a dar permiso a Tintamar para dos cosas, y nada más:</p>
            <div className="li"><ArrowUpRight size={18} color="var(--sea)" /><span className="small grow">Crear y cambiar eventos en un calendario nuevo llamado «Tintamar · {artist(connecting).short}», solo con las citas del estudio.</span></div>
            <div className="li"><ArrowDownLeft size={18} color="var(--accent)" /><span className="small grow">Saber cuándo está ocupado en sus otros calendarios, sin ver títulos, personas ni lugares.</span></div>
            <ConnectButton onDone={() => { connectGcal(connecting); toast(`Calendario de ${artist(connecting).short} conectado. Sus citas se están copiando.`); setConnecting(null); }} />
          </div>
        )}
      </Modal>
    </>
  );
}

function ConnectButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return <button className="btn btn-dark" disabled={busy} onClick={async () => { setBusy(true); await wait(1400); onDone(); }}>{busy ? <><Spinner /> Esperando a Google</> : <><Plug size={16} /> Dar permiso con la cuenta de Google</>}</button>;
}

const OUTCOME: Record<Outcome, { label: string; tone: string }> = {
  reserva: { label: 'Reservó', tone: 'ok' },
  solicitud: { label: 'Dejó su idea', tone: 'sea' },
  derivada: { label: 'Pasó a una persona', tone: 'warn' },
  informacion: { label: 'Solo preguntó', tone: '' },
  abierta: { label: 'En curso', tone: 'accent' },
};

export function AssistantPage() {
  return (
    <ManagerOnly>
      <AssistantInner />
    </ManagerOnly>
  );
}

function AssistantInner() {
  const { s, saveKb, deleteKb, resolveUnanswered, toast } = useStore();
  const [tab, setTab] = useState<'charlas' | 'sin' | 'hoja'>('charlas');
  const [openId, setOpenId] = useState<string | null>(null);
  const [edit, setEdit] = useState<(KbEntry & { from?: string }) | null>(null);
  const today = todayIso();
  const week = s.conversations.filter((c) => c.startedAt.slice(0, 10) >= addDays(today, -7));
  const open = openId ? s.conversations.find((c) => c.id === openId) : null;
  const unanswered = s.unanswered.filter((u) => !u.resolved);
  return (
    <>
      <Top title="Asistente IA" sub="Responde solo con la hoja del estudio y con la agenda real. Lo que no sabe, lo pasa a una persona." />
      <div className="pn-body">
        <div className="kpis">
          <div className="kpi"><small>Charlas en 7 días</small><b>{week.length}</b></div>
          <div className="kpi"><small>Acabaron en reserva</small><b>{week.filter((c) => c.outcome === 'reserva').length}</b></div>
          <div className="kpi"><small>Pasadas a una persona</small><b>{week.filter((c) => c.outcome === 'derivada').length}</b></div>
          <div className="kpi"><small>Preguntas sin respuesta</small><b>{unanswered.length}</b></div>
        </div>
        <div className="card">
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={tab === 'charlas' ? 'on' : ''} onClick={() => setTab('charlas')}>Conversaciones</button>
            <button className={tab === 'sin' ? 'on' : ''} onClick={() => setTab('sin')}>Sin respuesta ({unanswered.length})</button>
            <button className={tab === 'hoja' ? 'on' : ''} onClick={() => setTab('hoja')}>Hoja de respuestas ({s.kb.length})</button>
          </div>
          {tab === 'charlas' && (
            <div className="list">
              {s.conversations.slice(0, 30).map((c) => (
                <button key={c.id} className="li clk" style={{ textAlign: 'left' }} onClick={() => setOpenId(c.id)}>
                  <MessageSquareText size={18} color="var(--sea)" />
                  <span className="grow" style={{ minWidth: 0 }}><b>{c.visitor}</b> · <span className="small muted">{ago(c.startedAt)} · desde {c.page}</span><div className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.messages.find((m) => m.from === 'user')?.text ?? ''}</div></span>
                  <span className={`badge ${OUTCOME[c.outcome].tone}`}>{OUTCOME[c.outcome].label}</span>
                </button>
              ))}
            </div>
          )}
          {tab === 'sin' && (
            <div className="stack" style={{ gap: 12 }}>
              <div className="callout"><WandSparkles size={18} /><span>Cada pregunta que el asistente no supo responder aparece aquí. Escribe la respuesta una vez y desde ese momento la da él, con tus palabras.</span></div>
              <div className="list">
                {unanswered.map((u) => (
                  <div key={u.id} className="li">
                    <span className="grow"><b className="small">{u.question}</b><div className="tiny muted">{u.count} {u.count === 1 ? 'vez' : 'veces'} · la última {ago(u.at)}</div></span>
                    <button className="btn btn-dark btn-xs" onClick={() => setEdit({ id: `kb${Date.now()}`, topic: '', keys: [], answer: '', active: true, updatedAt: todayIso(), uses: 0, from: u.id })}><WandSparkles size={13} /> Enseñar respuesta</button>
                  </div>
                ))}
                {!unanswered.length && <span className="small muted">Nada pendiente. El asistente tiene respuesta para todo lo que le han preguntado.</span>}
              </div>
            </div>
          )}
          {tab === 'hoja' && (
            <div className="stack" style={{ gap: 12 }}>
              <button className="btn btn-dark btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setEdit({ id: `kb${Date.now()}`, topic: '', keys: [], answer: '', active: true, updatedAt: todayIso(), uses: 0 })}><Plus size={15} /> Nueva respuesta</button>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Tema</th><th>Respuesta</th><th>Usada</th><th>Activa</th><th /></tr></thead>
                  <tbody>
                    {s.kb.map((k) => (
                      <tr key={k.id}>
                        <td><b className="small">{k.topic}</b></td>
                        <td className="small" style={{ maxWidth: 420 }}>{k.answer.length > 120 ? `${k.answer.slice(0, 120)}...` : k.answer}</td>
                        <td className="num small">{k.uses}</td>
                        <td><Switch on={k.active} label={`Activar ${k.topic}`} onChange={(v) => saveKb({ ...k, active: v })} /></td>
                        <td className="row" style={{ gap: 4 }}>
                          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Editar" onClick={() => setEdit(k)}><Pencil size={15} /></button>
                          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Borrar" onClick={() => { deleteKb(k.id); toast('Respuesta borrada', 'info'); }}><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.visitor ?? ''} sub={open ? `${ago(open.startedAt)} · desde ${open.page} · llegó por ${open.source}` : ''}>
        {open && (
          <div className="stack" style={{ gap: 8, background: 'var(--paper)', padding: 14, borderRadius: 16 }}>
            {open.messages.map((m) => (
              <div key={m.id} className={`msg ${m.from}`} style={{ animation: 'none' }}>
                {m.from === 'equipo' && <div className="who">Equipo</div>}
                {m.text}
              </div>
            ))}
          </div>
        )}
      </Drawer>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.topic ? `Editar: ${edit.topic}` : 'Enseñar una respuesta'}>
        {edit && <KbForm entry={edit} onSave={(k) => { saveKb({ ...k, updatedAt: todayIso() }); if (edit.from) resolveUnanswered(edit.from); setEdit(null); toast('Guardado. El asistente ya lo responde así.'); }} />}
      </Modal>
    </>
  );
}

function KbForm({ entry, onSave }: { entry: KbEntry & { from?: string }; onSave: (k: KbEntry) => void }) {
  const { s } = useStore();
  const q = entry.from ? s.unanswered.find((u) => u.id === entry.from)?.question : null;
  const [k, setK] = useState({ topic: entry.topic, keys: entry.keys.join(', '), answer: entry.answer });
  return (
    <form className="stack" style={{ gap: 12 }} onSubmit={(e) => { e.preventDefault(); if (!k.topic.trim() || !k.answer.trim() || !k.keys.trim()) return; onSave({ ...entry, topic: k.topic.trim(), keys: k.keys.split(',').map((x) => x.trim()).filter(Boolean), answer: k.answer.trim() }); }}>
      {q && <div className="callout"><Bot size={18} /><span>Le preguntaron: «{q}»</span></div>}
      <label className="field"><span>Tema</span><input className="input" value={k.topic} onChange={(e) => setK({ ...k, topic: e.target.value })} placeholder="Tarjeta regalo" /></label>
      <label className="field"><span>Palabras con las que lo preguntan (separadas por comas)</span><input className="input" value={k.keys} onChange={(e) => setK({ ...k, keys: e.target.value })} placeholder="regalo, tarjeta regalo, bono, cumpleaños" /></label>
      <label className="field"><span>Respuesta, tal cual la diría el estudio</span><textarea className="textarea" value={k.answer} onChange={(e) => setK({ ...k, answer: e.target.value })} /></label>
      <button className="btn btn-dark">Guardar respuesta</button>
    </form>
  );
}

const CONV: Record<ConversionType, string> = { reserva_web: 'Reserva en la web', reserva_chat: 'Reserva en el asistente', clic_whatsapp: 'Clic en WhatsApp', llamada: 'Llamada', consulta_cover: 'Consulta de cover-up' };

export function SeoPage() {
  return (
    <ManagerOnly>
      <SeoInner />
    </ManagerOnly>
  );
}

function SeoInner() {
  const { s, updateSeo, setAlt, toast } = useStore();
  const [tab, setTab] = useState<'paginas' | 'fotos' | 'ads' | 'datos'>('paginas');
  const [editPath, setEditPath] = useState<string | null>(null);
  const page = editPath ? s.seoPages.find((p) => p.path === editPath) : null;
  const [draft, setDraft] = useState({ title: '', description: '', keyword: '' });
  const conv28 = s.conversions.filter((c) => c.at.slice(0, 10) >= addDays(todayIso(), -28));
  const ads = conv28.filter((c) => c.source === 'Google Ads');
  const bySrc = useMemo(() => {
    const m = new Map<Source, number>();
    conv28.forEach((c) => m.set(c.source, (m.get(c.source) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [conv28]);
  const photos = Object.values(PHOTOS).filter((p) => !['lua', 'dani', 'marta', 'iker', 'noa', 'ruben', 'clara'].some((k) => PHOTOS[k as keyof typeof PHOTOS].id === p.id)).slice(0, 24);
  const clicks = s.seoPages.reduce((n, p) => n + p.clicks, 0);
  const impressions = s.seoPages.reduce((n, p) => n + p.impressions, 0);
  const adUrl = '/estilos/fine-line?utm_source=google&utm_medium=cpc&utm_campaign=linea-fina-malaga&gclid=Cj0KCQjwTintamar';

  return (
    <>
      <Top title="SEO y Google Ads" sub="Cada estilo y cada tatuador tiene su página, y cada reserva le dice a Google qué búsqueda o qué anuncio la trajo" />
      <div className="pn-body">
        <div className="kpis">
          <div className="kpi"><small>Clics desde Google, 28 días</small><b>{clicks.toLocaleString('es-ES')}</b></div>
          <div className="kpi"><small>Veces que salimos en Google</small><b>{impressions.toLocaleString('es-ES')}</b></div>
          <div className="kpi"><small>Conversiones, 28 días</small><b>{conv28.length}</b><span className="sub">reservas, WhatsApp y llamadas</span></div>
          <div className="kpi"><small>De ellas, por anuncios</small><b>{ads.length}</b></div>
        </div>
        <div className="card">
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={tab === 'paginas' ? 'on' : ''} onClick={() => setTab('paginas')}>Páginas y palabras clave</button>
            <button className={tab === 'fotos' ? 'on' : ''} onClick={() => setTab('fotos')}>Fotos</button>
            <button className={tab === 'ads' ? 'on' : ''} onClick={() => setTab('ads')}>Google Ads</button>
            <button className={tab === 'datos' ? 'on' : ''} onClick={() => setTab('datos')}>Datos para Google</button>
          </div>
          {tab === 'paginas' && (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Página</th><th>Búsqueda que persigue</th><th>Clics</th><th>Apariciones</th><th>Posición media</th><th /></tr></thead>
                <tbody>
                  {s.seoPages.map((p) => (
                    <tr key={p.path} className="clk" onClick={() => { setEditPath(p.path); setDraft({ title: p.title, description: p.description, keyword: p.keyword }); }}>
                      <td className="small"><b>{p.path}</b><br /><span className="muted">{p.title}</span></td>
                      <td className="small">{p.keyword}</td>
                      <td className="num">{p.clicks}</td>
                      <td className="num">{p.impressions.toLocaleString('es-ES')}</td>
                      <td><span className={`badge ${p.position <= 5 ? 'ok' : p.position <= 10 ? 'warn' : 'bad'}`}>{String(p.position).replace('.', ',')}</span></td>
                      <td><Pencil size={14} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'fotos' && (
            <div className="stack" style={{ gap: 12 }}>
              <div className="callout"><ImageIcon size={18} /><span>Google lee las fotos por su texto alternativo y su nombre, no por lo que se ve. Cada foto sale con un nombre que describe el trabajo y la ciudad, y se sirve en el tamaño de cada pantalla.</span></div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Foto</th><th>Texto alternativo</th><th>Archivo</th><th>Peso</th></tr></thead>
                  <tbody>
                    {photos.map((p) => {
                      const alt = s.photoAlts[p.id] ?? p.alt;
                      const served = Math.round(p.kb * 0.055);
                      return (
                        <tr key={p.id}>
                          <td><div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', position: 'relative' }}><Pic id={p.id} sizes="64px" ar="1:1" /></div></td>
                          <td style={{ minWidth: 260 }}>
                            <input className="input" style={{ minHeight: 38, fontSize: 13 }} defaultValue={alt} onBlur={(e) => { if (e.target.value !== alt) { setAlt(p.id, e.target.value); toast('Texto alternativo guardado. La web ya lo usa.'); } }} />
                            {alt.length < 30 && <span className="err">Demasiado corto para que Google entienda la foto</span>}
                          </td>
                          <td className="small muted">{p.file.replace('.jpg', '.avif')}</td>
                          <td className="small"><s className="muted">{(p.kb / 1000).toFixed(1).replace('.', ',')} MB</s><br /><b>{served} kB</b> <span className="badge ok">-{Math.round((1 - served / p.kb) * 100)} %</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'ads' && (
            <div className="stack" style={{ gap: 16 }}>
              <div className="callout warm"><Megaphone size={18} /><span>Cada reserva hecha en la web o con el asistente se envía a Google Ads como conversión, con el precio orientativo como valor. Así una campaña puntual aprende qué clics acaban en camilla y deja de pagar los que solo miran fotos.</span></div>
              <div className="row wrapflex" style={{ gap: 10 }}>
                <a className="btn btn-dark btn-sm" href={adUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Abrir la web como si vinieras de un anuncio</a>
                <span className="tiny muted">Reserva desde esa pestaña y vuelve aquí: la conversión aparece arriba con su campaña.</span>
              </div>
              <div className="two">
                <div>
                  <b className="small">Conversiones por origen, 28 días</b>
                  <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                    {bySrc.map(([src, n]) => (
                      <div key={src} className="row" style={{ gap: 10 }}>
                        <span className="small" style={{ width: 120 }}>{src}</span>
                        <div className="bar grow"><i style={{ width: `${(n / Math.max(1, bySrc[0][1])) * 100}%`, background: SOURCE_COLOR[src] }} /></div>
                        <b className="small num">{n}</b>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <b className="small">Páginas preparadas para cada campaña</b>
                  <div className="list" style={{ marginTop: 10 }}>
                    {[['linea-fina-malaga', '/estilos/fine-line'], ['cover-up-malaga', '/estilos/cover-up'], ['tatuajes-malaga', '/']].map(([c, path]) => (
                      <div key={c} className="li"><Globe size={16} /><span className="grow small"><b>{c}</b><br /><span className="muted">{path}</span></span><span className="badge sea">{ads.filter((x) => x.campaign === c).length} conv.</span></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Cuándo</th><th>Qué</th><th>Origen</th><th>Campaña</th><th>Valor</th><th>Cookies</th></tr></thead>
                  <tbody>
                    {conv28.slice(0, 25).map((c) => (
                      <tr key={c.id} className={c.at >= stampNow().slice(0, 13) ? 'flash' : ''}>
                        <td className="small">{ago(c.at)}</td>
                        <td className="small">{CONV[c.type]}</td>
                        <td><span className="badge" style={{ background: `${SOURCE_COLOR[c.source]}22`, color: SOURCE_COLOR[c.source] }}>{c.source}</span></td>
                        <td className="small muted">{c.campaign ?? ''}</td>
                        <td className="small num">{c.value ? `${c.value} €` : ''}</td>
                        <td>{c.consent ? <span className="badge ok">Aceptadas</span> : <span className="badge">Sin cookies</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <span className="tiny muted">Cuando un visitante rechaza las cookies, la conversión llega a Google sin identificarle, como pide la normativa europea.</span>
            </div>
          )}
          {tab === 'datos' && (
            <div className="stack" style={{ gap: 14 }}>
              <div className="list">
                <a className="li clk" href="/sitemap.xml" target="_blank"><FileCode size={16} /><span className="grow small"><b>Mapa del sitio</b> · {2 + STYLES.length + s.artists.length + 4} páginas para Google</span><ExternalLink size={14} /></a>
                <a className="li clk" href="/robots.txt" target="_blank"><FileCode size={16} /><span className="grow small"><b>Instrucciones para buscadores</b> · el panel, Mi cita y la ruleta quedan fuera</span><ExternalLink size={14} /></a>
                <div className="li"><Check size={16} color="var(--ok)" /><span className="grow small">Cada página con su título, su descripción y su dirección única, para que Google no las confunda entre sí</span></div>
              </div>
              <b className="small">Ficha del estudio que lee Google (horario, dirección, equipo y estilos)</b>
              <pre className="code">{JSON.stringify(studioJsonLd(), null, 2).slice(0, 1600)}{'\n...'}</pre>
            </div>
          )}
        </div>
      </div>
      <Drawer open={!!page} onClose={() => setEditPath(null)} title={page?.path ?? ''} sub="Lo que Google enseña en sus resultados" foot={page && <button className="btn btn-dark btn-sm" onClick={() => { updateSeo(page.path, draft); toast('Guardado'); setEditPath(null); }}>Guardar</button>}>
        {page && (
          <>
            <div className="serp">
              <span className="u">tintamar.es{page.path === '/' ? '' : ` › ${page.path.split('/').filter(Boolean).join(' › ')}`}</span>
              <span className="t">{draft.title}</span>
              <span className="d">{draft.description}</span>
            </div>
            <label className="field"><span>Título</span><input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /><span className={`counter ${draft.title.length > 60 ? 'over' : ''}`}>{draft.title.length} de 60</span></label>
            <label className="field"><span>Descripción</span><textarea className="textarea" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /><span className={`counter ${draft.description.length > 155 ? 'over' : ''}`}>{draft.description.length} de 155</span></label>
            <label className="field"><span>Búsqueda principal</span><input className="input" value={draft.keyword} onChange={(e) => setDraft({ ...draft, keyword: e.target.value })} /></label>
            {!draft.title.toLowerCase().includes('málaga') && <div className="callout warm"><Info size={18} /><span>El título no dice Málaga. Quien busca un tatuador busca cerca, y la ciudad en el título pesa.</span></div>}
          </>
        )}
      </Drawer>
    </>
  );
}

