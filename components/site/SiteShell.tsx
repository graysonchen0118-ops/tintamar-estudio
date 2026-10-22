'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Menu, X, PenTool, CalendarCheck, AtSign, Phone, MessageCircle, Mail, MapPin, Users, Palette, HeartPulse, Ticket, Home } from 'lucide-react';
import { useStore } from '@/lib/store';
import { STUDIO, STYLES } from '@/lib/mock/studio';
import { Toasts } from '../ui';
import ChatWidget from './ChatWidget';
import CookieBanner from './CookieBanner';
import type { Source } from '@/lib/types';

export function Logo({ small }: { small?: boolean }) {
  return (
    <Link href="/" className="logo" aria-label="Tintamar, inicio">
      <span className="logo-mark"><PenTool size={19} strokeWidth={2.4} /></span>
      <span>
        Tintamar
        {!small && <small>Estudio de tatuaje</small>}
      </span>
    </Link>
  );
}

const NAV = [
  { href: '/artistas', label: 'Artistas', icon: Users },
  { href: '/estilos', label: 'Estilos', icon: Palette },
  { href: '/cuidados', label: 'Cuidados', icon: HeartPulse },
  { href: '/#estudio', label: 'El estudio', icon: Home },
  { href: '/mi-cita', label: 'Mi cita', icon: Ticket },
];

function Header() {
  const path = usePathname();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <header className={`hdr ${solid || open ? 'solid' : ''}`}>
        <div className="wrap hdr-in">
          <button className="icon-btn burger" aria-label="Abrir menú" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <Logo />
          <nav className="nav" aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={path === n.href || (n.href !== '/' && path.startsWith(n.href) && !n.href.includes('#')) ? 'on' : ''}>{n.label}</Link>
            ))}
          </nav>
          <div className="hdr-cta" style={{ marginLeft: 'auto' }}>
            <Link href="/reservar" className="btn btn-primary"><CalendarCheck size={17} /> Reservar</Link>
          </div>
        </div>
      </header>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <nav className={`mnav ${open ? 'open' : ''}`} aria-label="Menú">
        <div className="row between" style={{ marginBottom: 10 }}>
          <Logo small />
          <button className="icon-btn" aria-label="Cerrar menú" onClick={() => setOpen(false)}><X size={22} /></button>
        </div>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}><n.icon size={18} /> {n.label}</Link>
        ))}
        <Link href="/reservar" className="btn btn-primary" style={{ marginTop: 12 }}><CalendarCheck size={17} /> Reservar cita</Link>
      </nav>
    </>
  );
}

function Footer() {
  const { track } = useStore();
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          <div className="stack" style={{ gap: 12 }}>
            <Logo />
            <p>{STUDIO.street}, {STUDIO.zip} {STUDIO.city}. En pleno Soho, a cinco minutos de la Alameda.</p>
            <p>Lunes a viernes de 11:00 a 20:00<br />Sábados de 10:00 a 15:00</p>
          </div>
          <div>
            <h4>Estilos</h4>
            {STYLES.map((s) => (
              <Link key={s.slug} href={`/estilos/${s.slug}`}>{s.name}</Link>
            ))}
          </div>
          <div>
            <h4>Estudio</h4>
            <Link href="/artistas">Artistas</Link>
            <Link href="/reservar">Reservar cita</Link>
            <Link href="/mi-cita">Mi cita</Link>
            <Link href="/cuidados">Cuidados</Link>
            <Link href="/ruleta">Ruleta de premios</Link>
          </div>
          <div>
            <h4>Contacto</h4>
            <a href={`tel:${STUDIO.phone.replace(/\s/g, '')}`} onClick={() => track('llamada', 'pie')}><span className="row" style={{ gap: 8 }}><Phone size={15} /> {STUDIO.phone}</span></a>
            <a href={`https://wa.me/${STUDIO.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={() => track('clic_whatsapp', 'pie')}><span className="row" style={{ gap: 8 }}><MessageCircle size={15} /> WhatsApp</span></a>
            <a href={`mailto:${STUDIO.email}`}><span className="row" style={{ gap: 8 }}><Mail size={15} /> {STUDIO.email}</span></a>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><span className="row" style={{ gap: 8 }}><AtSign size={15} /> {STUDIO.instagram}</span></a>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${STUDIO.street}, ${STUDIO.city}`)}`} target="_blank" rel="noreferrer"><span className="row" style={{ gap: 8 }}><MapPin size={15} /> Cómo llegar</span></a>
          </div>
        </div>
        <div className="ftr-bottom">
          <span>© 2026 {STUDIO.full} · {STUDIO.city}</span>
          <span className="row wrapflex" style={{ gap: 16 }}>
            <Link href="/privacidad">Privacidad y cookies</Link>
            <Link href="/panel">Acceso del equipo</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Where the visit came from, so a booking can be credited to the ad, the search or Instagram. */
function useAttribution() {
  const { setAttribution, ready } = useStore();
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(window.location.search);
    let a: { source: Source; campaign?: string } | null = null;
    if (q.get('gclid') || (q.get('utm_source') === 'google' && q.get('utm_medium') === 'cpc')) a = { source: 'Google Ads', campaign: q.get('utm_campaign') ?? undefined };
    else if (q.get('utm_source')?.includes('instagram')) a = { source: 'Instagram', campaign: q.get('utm_campaign') ?? undefined };
    else if (/google\./.test(document.referrer)) a = { source: 'Google orgánico' };
    try {
      if (a) sessionStorage.setItem('tintamar:origen', JSON.stringify(a));
      else {
        const saved = sessionStorage.getItem('tintamar:origen');
        if (saved) a = JSON.parse(saved);
      }
    } catch {}
    setAttribution(a);
  }, [ready, setAttribution]);
}

export default function SiteShell({ children }: { children: ReactNode }) {
  useAttribution();
  return (
    <div className="site dark">
      <Header />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
      <CookieBanner />
      <Toasts />
    </div>
  );
}
