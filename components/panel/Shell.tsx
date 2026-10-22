'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  LayoutDashboard, CalendarDays, Inbox, SquareKanban, Contact, CalendarCheck, Bot, SearchCheck, Gift, Smartphone, UsersRound, UserRound, LogOut, Menu, Globe, RotateCcw, Lock, PenTool, ArrowRight,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ARTISTS, MANAGER } from '@/lib/mock/studio';
import { Avatar, Toasts, Spinner, Sk } from '../ui';
import { Backdrop } from '../three';
import { PHOTOS } from '@/lib/photos';
import type { Role } from '@/lib/types';

const NavCtx = createContext<{ open: () => void }>({ open: () => {} });

export function useRole() {
  const { s } = useStore();
  const role = s.user;
  const isManager = role === 'gerencia';
  return { role, isManager, artistId: isManager || !role ? null : role };
}

export function Top({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  const { open } = useContext(NavCtx);
  return (
    <header className="pn-top">
      <button className="icon-btn pn-burger" aria-label="Abrir menú" onClick={open}><Menu size={22} /></button>
      <div className="grow">
        <h1>{title}</h1>
        {sub && <div className="tiny muted" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="row" style={{ gap: 8 }}>{actions}</div>
    </header>
  );
}

export function ManagerOnly({ children }: { children: ReactNode }) {
  const { isManager } = useRole();
  if (isManager) return <>{children}</>;
  return (
    <>
      <Top title="Sección de gerencia" />
      <div className="pn-body">
        <div className="card lock">
          <span className="ico"><Lock size={28} /></span>
          <h2 style={{ fontSize: 20 }}>Esto lo ve solo la gerencia</h2>
          <p className="muted" style={{ maxWidth: 440 }}>Cada tatuador ve su propia semana y sus propios proyectos. Las agendas de los compañeros, los clientes del resto y la configuración del estudio quedan fuera de su panel.</p>
          <Link href="/panel" className="btn btn-dark">Volver a mi semana</Link>
        </div>
      </div>
    </>
  );
}

function Login() {
  const { login } = useStore();
  const [busy, setBusy] = useState<Role | null>(null);
  const go = async (r: Role) => {
    setBusy(r);
    await login(r);
    setBusy(null);
  };
  return (
    <div className="login dark">
      <div className="phead-canvas" style={{ position: 'absolute', inset: 0, zIndex: -1, opacity: 0.55 }}><Backdrop photos={[PHOTOS.estudioDosPuestos.id, PHOTOS.laminasPared.id, PHOTOS.mesaDibujo.id, PHOTOS.maquinaMano.id]} /></div>
      <div className="login-box enter">
        <div className="stack" style={{ gap: 10 }}>
          <span className="logo"><span className="logo-mark"><PenTool size={19} /></span> Tintamar · Panel del estudio</span>
          <h1 className="h2">¿Quién entra?</h1>
          <p className="lead">Cada persona entra con su cuenta. La gerencia ve el estudio entero; cada tatuador, solo su agenda y sus proyectos.</p>
        </div>
        <button className="login-card main-role" onClick={() => go('gerencia')} disabled={!!busy}>
          <Avatar k={MANAGER.photo} size={54} radius={15} />
          <span className="grow"><b>{MANAGER.name}</b><br /><span className="small" style={{ color: 'var(--cream-muted)' }}>{MANAGER.role} · calendario general de todo el equipo</span></span>
          {busy === 'gerencia' ? <Spinner /> : <ArrowRight size={18} />}
        </button>
        <div className="login-grid">
          {ARTISTS.map((a) => (
            <button key={a.id} className="login-card" onClick={() => go(a.id)} disabled={!!busy}>
              <Avatar k={a.photo} size={54} radius={15} />
              <span className="grow"><b>{a.name}</b><br /><span className="small" style={{ color: 'var(--cream-muted)' }}>{a.role}</span></span>
              {busy === a.id ? <Spinner /> : <ArrowRight size={18} />}
            </button>
          ))}
        </div>
        <Link href="/" className="small" style={{ color: 'var(--cream-muted)' }}><Globe size={13} style={{ verticalAlign: -2 }} /> Volver a la web del estudio</Link>
      </div>
      <Toasts />
    </div>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const { s, ready, logout, reset, artist } = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  if (!ready) return <div className="pn"><div /><div className="pn-body"><Sk h={60} /><Sk h={300} /></div></div>;
  if (!s.user) return <Login />;
  const isManager = s.user === 'gerencia';
  const me = isManager ? { name: MANAGER.name, role: MANAGER.role, photo: MANAGER.photo } : (() => { const a = artist(s.user!); return { name: a.name, role: a.role, photo: a.photo }; })();
  const requests = s.projects.filter((p) => p.stage === 'solicitud' && (isManager || p.artistId === s.user)).length;
  const mine = s.projects.filter((p) => p.artistId === s.user && p.stage === 'solicitud').length;
  const unanswered = s.unanswered.filter((u) => !u.resolved).length;
  const nav: { lbl?: string; href?: string; label?: string; icon?: typeof LayoutDashboard; count?: number }[] = isManager
    ? [
        { lbl: 'Estudio' },
        { href: '/panel', label: 'Resumen', icon: LayoutDashboard },
        { href: '/panel/calendario', label: 'Calendario general', icon: CalendarDays },
        { href: '/panel/solicitudes', label: 'Solicitudes', icon: Inbox, count: requests },
        { href: '/panel/proyectos', label: 'Proyectos', icon: SquareKanban },
        { href: '/panel/clientes', label: 'Clientes', icon: Contact },
        { lbl: 'Conexiones' },
        { href: '/panel/google', label: 'Google Calendar', icon: CalendarCheck },
        { href: '/panel/asistente', label: 'Asistente IA', icon: Bot, count: unanswered },
        { href: '/panel/seo', label: 'SEO y Google Ads', icon: SearchCheck },
        { lbl: 'Clientes que vuelven' },
        { href: '/panel/ruleta', label: 'Ruleta y reseñas', icon: Gift },
        { lbl: 'Equipo' },
        { href: '/panel/app', label: 'App y privacidad', icon: Smartphone },
        { href: '/panel/equipo', label: 'Equipo y permisos', icon: UsersRound },
      ]
    : [
        { lbl: 'Mi trabajo' },
        { href: '/panel', label: 'Mi semana', icon: CalendarDays },
        { href: '/panel/proyectos', label: 'Mis proyectos', icon: SquareKanban, count: mine },
        { href: '/panel/google', label: 'Mi Google Calendar', icon: CalendarCheck },
        { href: '/panel/perfil', label: 'Mi perfil en la web', icon: UserRound },
      ];
  return (
    <NavCtx.Provider value={{ open: () => setOpen(true) }}>
      <div className="pn">
        <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
        <aside className={`pn-side ${open ? 'open' : ''}`}>
          <Link href="/panel" className="logo"><span className="logo-mark"><PenTool size={19} /></span><span>Tintamar<small>Panel del estudio</small></span></Link>
          <nav className="pn-nav">
            {nav.map((n, i) =>
              n.lbl ? <div key={i} className="lbl">{n.lbl}</div> : (
                <Link key={n.href} href={n.href!} className={path === n.href ? 'on' : ''}>
                  {n.icon && <n.icon size={18} />} {n.label}
                  {!!n.count && <span className="count">{n.count}</span>}
                </Link>
              ),
            )}
            <div className="lbl">Web</div>
            <Link href="/" target="_blank"><Globe size={18} /> Ver la web</Link>
          </nav>
          <div className="pn-user">
            <Avatar k={me.photo} size={40} />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="small strong" style={{ color: '#fff' }}>{me.name}</div>
              <div className="tiny" style={{ color: 'var(--cream-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.role}</div>
            </div>
            <button className="icon-btn" style={{ color: 'var(--cream-muted)', width: 36, height: 36 }} aria-label="Cambiar de cuenta" title="Cambiar de cuenta" onClick={logout}><LogOut size={17} /></button>
          </div>
          <button className="small row" style={{ gap: 6, color: '#8d8274', padding: '6px 10px' }} onClick={reset}><RotateCcw size={13} /> Reiniciar datos de la sesión</button>
        </aside>
        <div className="pn-main main">{children}</div>
      </div>
      <Toasts />
    </NavCtx.Provider>
  );
}
