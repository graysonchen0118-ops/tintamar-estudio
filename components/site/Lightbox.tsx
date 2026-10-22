'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PhotoKey } from '@/lib/photos';
import { Pic } from '../ui';

export default function Lightbox({ items, index, onClose, onIndex }: { items: { k: PhotoKey; caption: string }[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const go = (d: number) => onIndex((index + d + items.length) % items.length);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const it = items[index];
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Trabajo ampliado" onClick={onClose}>
      <button className="icon-btn close" aria-label="Cerrar" onClick={onClose}><X size={22} /></button>
      <figure onClick={(e) => e.stopPropagation()}>
        <div className="frame" key={it.k}><Pic k={it.k} sizes="(max-width: 900px) 100vw, 900px" ar="4:5" /></div>
        <div className="row between">
          <figcaption>{it.caption}</figcaption>
          <div className="row" style={{ gap: 6 }}>
            <button className="icon-btn" style={{ color: '#fff' }} aria-label="Anterior" onClick={() => go(-1)}><ChevronLeft size={22} /></button>
            <button className="icon-btn" style={{ color: '#fff' }} aria-label="Siguiente" onClick={() => go(1)}><ChevronRight size={22} /></button>
          </div>
        </div>
      </figure>
    </div>
  );
}
