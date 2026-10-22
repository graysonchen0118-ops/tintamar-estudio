'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Gift, ShieldCheck, Check, X, Star, MessageSquareReply, Ticket, ExternalLink, Smartphone, Users, Store, Lock, FileText, Camera, Trash2, HeartPulse, Mail, Cookie, UserPlus, Eye, EyeOff, ArrowUp, Globe, Save, CloudCheck, Info } from 'lucide-react';
import { useStore } from '@/lib/store';
import { STYLES, MANAGER, type ArtistId, type StyleSlug } from '@/lib/mock/studio';
import { PHOTOS } from '@/lib/photos';
import { addDays, todayIso, ago, dayShort } from '@/lib/dates';
import { Avatar, Modal, Switch, Stars, Pic } from '../ui';
import { Top, ManagerOnly } from './Shell';

export function RoulettePanel() {
  return (
    <ManagerOnly>
      <RouletteInner />
    </ManagerOnly>
  );
}

function RouletteInner() {
  const { s, updatePrize, redeem, replyReview, toast, artist } = useStore();
  const [tab, setTab] = useState<'premios' | 'codigos' | 'opiniones'>('premios');
  const [reply, setReply] = useState<{ id: string; text: string } | null>(null);
  const since = addDays(todayIso(), -30);
  const spins = s.codes.filter((c) => c.usedAt && c.usedAt.slice(0, 10) >= since);
  const redeemed = spins.filter((c) => c.redeemedAt).length;
  const inv = s.invites.filter((i) => i.at.slice(0, 10) >= since);
  const opened = inv.filter((i) => i.opened).length;
  const reviews30 = s.reviews.filter((r) => r.date >= since);
  const pool = s.prizes.filter((p) => p.active && p.weight > 0 && (p.stock === null || p.stock > 0));
  const total = pool.reduce((n, p) => n + p.weight, 0);
  const avg = s.reviews.length ? s.reviews.reduce((n, r) => n + r.rating, 0) / s.reviews.length : 0;
  return (
    <>
      <Top title="Ruleta y reseñas" sub="Un giro por sesión terminada, y una invitación a opinar igual para todos" actions={<Link href="/ruleta" target="_blank" className="btn btn-line btn-sm"><ExternalLink size={15} /> Ver la ruleta</Link>} />
      <div className="pn-body">
        <div className="kpis">
          <div className="kpi"><small>Giros en 30 días</small><b>{spins.length}</b></div>
          <div className="kpi"><small>Premios recogidos</small><b>{redeemed}</b><span className="sub">vuelven al estudio a por ellos</span></div>
          <div className="kpi"><small>Invitaciones abiertas</small><b>{inv.length ? Math.round((opened / inv.length) * 100) : 0} %</b><span className="sub">{opened} de {inv.length}</span></div>
          <div className="kpi"><small>Opiniones nuevas en Google</small><b>{reviews30.length}</b><span className="sub">media {avg.toFixed(1).replace('.', ',')}</span></div>
        </div>
        <div className="card">
          <div className="card-head"><h2 className="row" style={{ gap: 8 }}><ShieldCheck size={18} color="var(--sea)" /> Cómo protege la ficha de Google</h2></div>
          <div className="steps" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {[
              ['El giro llega con la sesión', 'El código se crea cuando el tatuador marca la sesión como terminada. No depende de opinar.'],
              ['La invitación es para todos', 'Gane lo que gane, cada persona recibe la misma invitación a contar su experiencia, sin filtrar a los contentos.'],
              ['Ningún premio pide estrellas', 'Google retira las reseñas conseguidas a cambio de algo y puede bloquear la ficha una temporada.'],
            ].map(([t, p], i) => (
              <div key={t} className="step" style={{ boxShadow: 'none', border: '1px solid var(--line)' }}>
                <span className="n" style={{ background: i === 2 ? 'var(--accent)' : 'var(--sea)' }}><Check size={20} /></span>
                <h3 style={{ fontSize: 16 }}>{t}</h3>
                <p className="small">{p}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={tab === 'premios' ? 'on' : ''} onClick={() => setTab('premios')}>Premios</button>
            <button className={tab === 'codigos' ? 'on' : ''} onClick={() => setTab('codigos')}>Códigos ({s.codes.length})</button>
            <button className={tab === 'opiniones' ? 'on' : ''} onClick={() => setTab('opiniones')}>Opiniones en Google</button>
          </div>
          {tab === 'premios' && (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Premio</th><th>Peso</th><th>Probabilidad</th><th>Quedan</th><th>Activo</th></tr></thead>
                <tbody>
                  {s.prizes.map((p) => {
                    const inPool = pool.includes(p);
                    return (
                      <tr key={p.id}>
                        <td><span className="row" style={{ gap: 10 }}><span className="dot" style={{ background: p.color, width: 14, height: 14 }} /><input className="input" style={{ minHeight: 36, maxWidth: 240 }} defaultValue={p.name} onBlur={(e) => e.target.value !== p.name && updatePrize(p.id, { name: e.target.value })} /></span></td>
                        <td><input className="input num" type="number" min={0} max={100} style={{ minHeight: 36, width: 80 }} value={p.weight} onChange={(e) => updatePrize(p.id, { weight: Math.max(0, Number(e.target.value) || 0) })} /></td>
                        <td className="num">{inPool && total ? `${Math.round((p.weight / total) * 100)} %` : <span className="muted">Fuera de la ruleta</span>}</td>
                        <td>{p.stock === null ? <span className="badge">Sin límite</span> : <input className="input num" type="number" min={0} style={{ minHeight: 36, width: 80 }} value={p.stock} onChange={(e) => updatePrize(p.id, { stock: Math.max(0, Number(e.target.value) || 0) })} />}</td>
                        <td><Switch on={p.active} label={`Activar ${p.name}`} onChange={(v) => { updatePrize(p.id, { active: v, weight: v && !p.weight ? 5 : p.weight, stock: v && p.stock === 0 ? 10 : p.stock }); toast(v ? 'Premio añadido a la ruleta' : 'Premio retirado de la ruleta', 'info'); }} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'codigos' && (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Código</th><th>Cliente</th><th>Sesión con</th><th>Creado</th><th>Premio</th><th>Opinión</th><th /></tr></thead>
                <tbody>
                  {s.codes.slice(0, 40).map((c) => {
                    const cl = s.clients.find((x) => x.id === c.clientId);
                    const prize = c.prizeId ? s.prizes.find((p) => p.id === c.prizeId) : null;
                    const invite = s.invites.find((i) => i.code === c.code);
                    return (
                      <tr key={c.code}>
                        <td><b>{c.code}</b></td>
                        <td className="small">{cl?.name}</td>
                        <td className="small">{artist(c.artistId).short}</td>
                        <td className="small">{ago(c.issuedAt)}</td>
                        <td className="small">{prize ? <>{prize.name}{c.redeemedAt ? <span className="badge ok" style={{ marginLeft: 6 }}>Recogido</span> : null}</> : <span className="badge warn">Sin girar</span>}</td>
                        <td>{invite ? invite.opened ? <span className="badge ok">Abrió Google</span> : <span className="badge">Invitado</span> : <span className="muted small">Aún no</span>}</td>
                        <td>{!c.usedAt ? <a className="btn btn-line btn-xs" href={`/ruleta?c=${c.code}`} target="_blank" rel="noreferrer"><Gift size={13} /> Abrir</a> : !c.redeemedAt ? <button className="btn btn-line btn-xs" onClick={() => { redeem(c.code); toast(`Premio de ${c.code} entregado`); }}><Ticket size={13} /> Entregar</button> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'opiniones' && (
            <div className="list">
              {s.reviews.slice(0, 16).map((r) => (
                <div key={r.id} className="li" style={{ alignItems: 'flex-start' }}>
                  <div className="grow stack" style={{ gap: 4 }}>
                    <div className="row wrapflex" style={{ gap: 8 }}><b className="small">{r.author}</b><Stars value={r.rating} size={13} /><span className="tiny muted">{dayShort(r.date)}{r.artistId ? ` · ${artist(r.artistId).short}` : ''}</span></div>
                    <p className="small" style={{ color: 'var(--ink-2)' }}>{r.text}</p>
                    {r.reply && <p className="small" style={{ borderLeft: '3px solid var(--sea)', paddingLeft: 10, color: 'var(--muted)' }}>Respuesta del estudio: {r.reply}</p>}
                  </div>
                  {!r.reply && <button className="btn btn-line btn-xs" onClick={() => setReply({ id: r.id, text: r.rating <= 3 ? 'Gracias por contarlo. Tienes razón en lo de la espera; ' : 'Gracias, de verdad. ' })}><MessageSquareReply size={13} /> Responder</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Modal open={!!reply} onClose={() => setReply(null)} title="Responder en Google">
        {reply && (
          <form className="stack" style={{ gap: 12 }} onSubmit={(e) => { e.preventDefault(); replyReview(reply.id, reply.text.trim()); setReply(null); toast('Respuesta publicada en la ficha'); }}>
            <textarea className="textarea" value={reply.text} onChange={(e) => setReply({ ...reply, text: e.target.value })} />
            <button className="btn btn-dark">Publicar respuesta</button>
          </form>
        )}
      </Modal>
    </>
  );
}

export function AppPage() {
  return (
    <ManagerOnly>
      <AppInner />
    </ManagerOnly>
  );
}

function AppInner() {
  const rows: [string, string, string, string][] = [
    ['Nombre, correo y teléfono', 'Para la cita y los avisos', 'Vinculado a la persona', 'No'],
    ['Formulario de salud y firma', 'Lo exige la normativa sanitaria', 'Vinculado a la persona', 'No'],
    ['Fotos de referencia', 'Para que el tatuador prepare el diseño', 'Vinculado a la persona', 'No'],
    ['Historial de citas', 'Para la agenda y los retoques', 'Vinculado a la persona', 'No'],
  ];
  return (
    <>
      <Top title="App y privacidad" sub="Lo que la app tendrá que cumplir para entrar en la App Store, y lo que ya está resuelto en la web" />
      <div className="pn-body">
        <div className="callout warm"><Info size={18} /><span>Apple rechaza en su tienda pública las apps pensadas sobre todo para el equipo interno de una empresa. Por eso son dos apps con el mismo sistema detrás: la de clientes, en la App Store, y la del equipo, instalada en privado en los móviles del estudio.</span></div>
        <div className="two">
          <div className="card stack" style={{ gap: 14, alignItems: 'center' }}>
            <div className="card-head" style={{ width: '100%' }}><h2 className="row" style={{ gap: 8 }}><Store size={18} /> App de clientes</h2><span className="badge sea">App Store pública</span></div>
            <div className="phone"><iframe src="/mi-cita" title="Vista de la app de clientes" loading="lazy" /></div>
            <p className="small muted center">Su cita, la señal, el formulario de salud, los cuidados día a día y su giro en la ruleta.</p>
          </div>
          <div className="card stack" style={{ gap: 14, alignItems: 'center' }}>
            <div className="card-head" style={{ width: '100%' }}><h2 className="row" style={{ gap: 8 }}><Users size={18} /> App del equipo</h2><span className="badge accent">Distribución privada</span></div>
            <div className="phone"><iframe src="/panel/proyectos" title="Vista de la app del equipo" loading="lazy" /></div>
            <p className="small muted center">La semana de cada tatuador, sus proyectos con las referencias y las notas, y la sesión marcada como terminada desde el móvil.</p>
          </div>
        </div>
        <div className="two">
          <div className="card">
            <div className="card-head"><h2>Lo que Apple revisa en la privacidad</h2></div>
            <div className="list">
              {[
                [FileText, 'Política de privacidad pública y enlazada', '/privacidad'],
                [Trash2, 'Borrar la cuenta y los datos desde la propia app', '/mi-cita'],
                [Camera, 'Permiso de cámara con el motivo explicado: «Para enviar fotos de referencia a tu tatuador»', ''],
                [HeartPulse, 'Datos de salud solo para la cita, nunca para publicidad', ''],
                [Mail, 'Avisos comerciales en una casilla aparte, sin marcar', '/reservar'],
                [Cookie, 'Medición de anuncios solo con permiso', '/privacidad#cookies'],
              ].map(([I, t, href]) => {
                const Icon = I as typeof FileText;
                return (
                  <div key={t as string} className="li">
                    <Icon size={17} color="var(--sea)" />
                    <span className="grow small">{t as string}</span>
                    {href ? <Link href={href as string} target="_blank" className="badge ok"><Check size={12} /> Ya en la web</Link> : <span className="badge ok"><Check size={12} /> Previsto</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h2>Ficha de privacidad para la App Store</h2></div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Dato</th><th>Para qué</th><th>Cómo</th><th>Rastreo</th></tr></thead>
                <tbody>{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className="small">{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <p className="tiny muted" style={{ marginTop: 10 }}>Sin rastreo entre apps de otras empresas, así que la app no necesita pedir permiso de seguimiento.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function TeamPage() {
  return (
    <ManagerOnly>
      <TeamInner />
    </ManagerOnly>
  );
}

function TeamInner() {
  const { s, toast } = useStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invited, setInvited] = useState<{ name: string; email: string }[]>([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const perms: [string, boolean, boolean][] = [
    ['Ver su propia semana y sus proyectos', true, true],
    ['Ver las agendas de los compañeros', true, false],
    ['Crear y mover citas de cualquiera', true, false],
    ['Ver los clientes de otros tatuadores', true, false],
    ['Ver el formulario de salud de sus clientes', true, true],
    ['Editar su perfil en la web', true, true],
    ['Configurar asistente, SEO, anuncios y ruleta', true, false],
  ];
  return (
    <>
      <Top title="Equipo y permisos" sub="Quién entra en el panel y qué ve cada uno" actions={<button className="btn btn-dark btn-sm" onClick={() => setInviteOpen(true)}><UserPlus size={15} /> Invitar</button>} />
      <div className="pn-body">
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Persona</th><th>Rol</th><th>Correo</th><th>Google Calendar</th><th>En la web</th></tr></thead>
              <tbody>
                <tr><td className="row" style={{ gap: 10 }}><Avatar k={MANAGER.photo} size={34} radius={10} /><b>{MANAGER.name}</b></td><td><span className="badge dark">Gerencia</span></td><td className="small">{MANAGER.email}</td><td><span className="badge ok"><CloudCheck size={12} /> Ve todos</span></td><td className="small muted">No aparece</td></tr>
                {s.artists.map((a) => (
                  <tr key={a.id}><td className="row" style={{ gap: 10 }}><Avatar k={a.photo} size={34} radius={10} /><b>{a.name}</b></td><td><span className="badge">Tatuador</span></td><td className="small">{a.email}</td><td>{s.gcal[a.id]?.connected ? <span className="badge ok"><CloudCheck size={12} /> Conectado</span> : <span className="badge warn">Sin conectar</span>}</td><td>{a.visible ? <span className="badge sea">Visible</span> : <span className="badge">Oculto</span>}</td></tr>
                ))}
                {invited.map((p) => <tr key={p.email}><td><b>{p.name}</b></td><td><span className="badge">Tatuador</span></td><td className="small">{p.email}</td><td><span className="badge warn">Invitación enviada</span></td><td className="small muted">Oculto hasta que entre</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2 className="row" style={{ gap: 8 }}><Lock size={17} /> Qué ve cada uno</h2></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Permiso</th><th>Gerencia</th><th>Tatuador</th></tr></thead>
              <tbody>{perms.map(([p, g, t]) => <tr key={p}><td className="small">{p}</td><td>{g ? <Check size={17} color="var(--ok)" /> : <X size={17} color="var(--bad)" />}</td><td>{t ? <Check size={17} color="var(--ok)" /> : <X size={17} color="var(--bad)" />}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>Pruébalo: sal de la cuenta con el botón de abajo a la izquierda y entra como cualquier tatuador.</p>
        </div>
      </div>
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invitar a alguien">
        <form className="stack" style={{ gap: 12 }} onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.email.includes('@')) return; setInvited((x) => [...x, form]); setInviteOpen(false); setForm({ name: '', email: '' }); toast(`Invitación enviada a ${form.email}`); }}>
          <label className="field"><span>Nombre</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span>Correo</span><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <p className="small muted">Entrará como tatuador: verá solo su semana y sus proyectos.</p>
          <button className="btn btn-dark">Enviar invitación</button>
        </form>
      </Modal>
    </>
  );
}

export function ProfilePage({ id }: { id: ArtistId }) {
  const { artist, updateArtist, toast } = useStore();
  const a = artist(id);
  const [f, setF] = useState({ role: a.role, bio: a.bio, quote: a.quote, instagram: a.instagram, styles: a.styles, visible: a.visible, portfolio: a.portfolio });
  const all = useMemo(() => Array.from(new Set([...a.portfolio])), [a.portfolio]);
  const toggleStyle = (st: StyleSlug) => setF((x) => ({ ...x, styles: x.styles.includes(st) ? x.styles.filter((y) => y !== st) : [...x.styles, st] }));
  return (
    <>
      <Top title="Mi perfil en la web" sub="Lo que cambies aquí sale en tu página pública al momento" actions={<Link href={`/artistas/${a.slug}`} target="_blank" className="btn btn-line btn-sm"><Globe size={15} /> Ver mi página</Link>} />
      <div className="pn-body">
        <div className="two">
          <div className="card stack" style={{ gap: 14 }}>
            <label className="field"><span>Lo que haces, en una línea</span><input className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></label>
            <label className="field"><span>Una frase tuya</span><input className="input" value={f.quote} onChange={(e) => setF({ ...f, quote: e.target.value })} /></label>
            <label className="field"><span>Sobre ti</span><textarea className="textarea" style={{ minHeight: 140 }} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
            <label className="field"><span>Instagram</span><input className="input" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></label>
            <div className="field"><span>Estilos en los que apareces</span><div className="row wrapflex" style={{ gap: 6 }}>{STYLES.map((st) => <button key={st.slug} type="button" className={`chip ${f.styles.includes(st.slug) ? 'on' : ''}`} onClick={() => toggleStyle(st.slug)}>{st.name}</button>)}</div></div>
            <div className="row between"><span className="small strong">Visible en la web</span><Switch on={f.visible} label="Visible en la web" onChange={(v) => setF({ ...f, visible: v })} /></div>
            <button className="btn btn-dark" style={{ alignSelf: 'flex-start' }} onClick={() => { if (!f.styles.length) return toast('Elige al menos un estilo', 'bad'); updateArtist(id, f); toast('Perfil guardado. Tu página ya lo muestra.'); }}><Save size={16} /> Guardar cambios</button>
          </div>
          <div className="card stack" style={{ gap: 12 }}>
            <div className="card-head" style={{ marginBottom: 0 }}><h2>Mis trabajos</h2><span className="tiny muted">El primero es el que se ve antes</span></div>
            <div className="ref-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
              {all.map((k) => {
                const on = f.portfolio.includes(k);
                const idx = f.portfolio.indexOf(k);
                return (
                  <div key={k} style={{ opacity: on ? 1 : 0.4 }}>
                    <Pic k={k} sizes="140px" ar="1:1" />
                    <div className="row" style={{ position: 'absolute', left: 6, right: 6, bottom: 6, gap: 4, justifyContent: 'flex-end' }}>
                      {on && idx > 0 && <button className="icon-btn" style={{ width: 30, height: 30, background: 'rgba(255,255,255,.9)' }} aria-label="Poner primero" onClick={() => setF({ ...f, portfolio: [k, ...f.portfolio.filter((x) => x !== k)] })}><ArrowUp size={14} /></button>}
                      <button className="icon-btn" style={{ width: 30, height: 30, background: 'rgba(255,255,255,.9)' }} aria-label={on ? 'Ocultar' : 'Mostrar'} onClick={() => setF({ ...f, portfolio: on ? f.portfolio.filter((x) => x !== k) : [...f.portfolio, k] })}>{on ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="tiny muted">Cada foto se publica con su texto alternativo y en el tamaño de cada pantalla, para que Google la entienda y la página cargue rápido.</p>
          </div>
        </div>
      </div>
    </>
  );
}

