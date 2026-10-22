'use client';

import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { useStore } from '@/lib/store';

/** Google Ads only measures with permission: nothing is stored for ads until the visitor says yes. */
export default function CookieBanner() {
  const { cookie, setCookie } = useStore();
  if (cookie !== null) return null;
  return (
    <div className="cookie" role="dialog" aria-label="Cookies">
      <div className="row" style={{ gap: 10 }}>
        <Cookie size={20} color="var(--accent)" />
        <strong>Cookies</strong>
      </div>
      <p>Cookies propias para que la web funcione y, si aceptas, de Google para medir qué anuncios traen citas. <Link href="/privacidad#cookies" style={{ textDecoration: 'underline' }}>Más información</Link></p>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-line btn-sm" onClick={() => setCookie('denied')}>Rechazar</button>
        <button className="btn btn-dark btn-sm" onClick={() => setCookie('granted')}>Aceptar</button>
      </div>
    </div>
  );
}
