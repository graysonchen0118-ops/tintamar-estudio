'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Star, X, CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { PHOTOS, type PhotoKey } from '@/lib/photos';

const base = (id: string) => `https://images.unsplash.com/photo-${id}`;

/** A real photo. Fills its positioned parent, or keeps its own aspect ratio when `box` is given. */
export function Pic({ k, id, alt, sizes = '100vw', ar, box, priority, className = '', style }: { k?: PhotoKey; id?: string; alt?: string; sizes?: string; ar?: string; box?: string; priority?: boolean; className?: string; style?: CSSProperties }) {
  const { s } = useStore();
  const p = k ? PHOTOS[k] : null;
  const pid = id ?? p?.id ?? '';
  const src = pid.startsWith('data:') ? pid : `${base(pid)}${ar ? `?ar=${ar}` : ''}`;
  const text = alt ?? s.photoAlts[pid] ?? p?.alt ?? Object.values(PHOTOS).find((x) => x.id === pid)?.alt ?? '';
  const wrap: CSSProperties = box ? { position: 'relative', aspectRatio: box, width: '100%', ...style } : { position: 'absolute', inset: 0, ...style };
  return (
    <div className={`pic ${className}`} style={wrap}>
      <Image src={src} alt={text} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover' }} />
    </div>
  );
}

export function Avatar({ k, size = 40, radius = 12 }: { k: PhotoKey; size?: number; radius?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <Pic k={k} sizes={`${size * 2}px`} ar="1:1" />
    </span>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? '' : 'off'} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

export function Sk({ w = '100%', h = 14, r = 8, style }: { w?: number | string; h?: number | string; r?: number; style?: CSSProperties }) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkRows({ rows = 6, h = 46 }: { rows?: number; h?: number }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Sk key={i} h={h} r={12} style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty enter">
      <div className="ico">{icon}</div>
      <div className="strong" style={{ color: 'var(--ink)' }}>{title}</div>
      {text && <div className="small" style={{ maxWidth: 380 }}>{text}</div>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim show" style={{ zIndex: 84 }} onClick={onClose} />
      <div className="modal-wrap">
        <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { width: 'min(860px, 100%)' } : undefined}>
          <div className="drawer-head">
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>{title}</h3>
            <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
          </div>
          <div style={{ padding: 20 }}>{children}</div>
        </div>
      </div>
    </>
  );
}

export function Drawer({ open, onClose, title, children, foot, sub }: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; foot?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <>
      <div className={`scrim ${open ? 'show' : ''}`} style={{ zIndex: 65 }} onClick={onClose} />
      <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open} role="dialog">
        <div className="drawer-head">
          <div className="grow">
            <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
            {sub && <div className="small muted">{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        {open && <div className="drawer-body">{children}</div>}
        {open && foot && <div className="drawer-foot">{foot}</div>}
      </aside>
    </>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          {t.tone === 'ok' ? <CheckCircle2 size={18} /> : t.tone === 'bad' ? <AlertTriangle size={18} /> : <Info size={18} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Real perspective under the pointer, with a light that follows it. */
export function Tilt({ children, className = '', max = 8, style }: { children: ReactNode; className?: string; max?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateZ(6px)`;
    if (glare.current) glare.current.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return (
    <div ref={ref} className={`tilt ${className}`} style={{ position: 'relative', ...style }} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
      <div ref={glare} className="tilt-glare" />
    </div>
  );
}

export function Reveal({ children, delay = 0, className = '', style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setIn(true);
        io.disconnect();
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${inView ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/** Moves its content at a different speed from the page as it scrolls, so sections sit on separate planes. */
export function Layer({ children, speed = 0.12, className = '', style }: { children: ReactNode; speed?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-mid * speed).toFixed(1)}px, 0)`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, [speed]);
  return (
    <div ref={ref} className={`layer ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="spin" />;
}

export function useHydrated() {
  const { ready } = useStore();
  return ready;
}
