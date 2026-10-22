'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { ProfilePage } from '@/components/panel/More';
import { Top, useRole } from '@/components/panel/Shell';

export default function Page() {
  const { artistId } = useRole();
  if (artistId) return <ProfilePage id={artistId} key={artistId} />;
  return (
    <>
      <Top title="Perfil en la web" />
      <div className="pn-body">
        <div className="card lock">
          <span className="ico"><UserRound size={28} /></span>
          <p className="muted" style={{ maxWidth: 420 }}>Cada tatuador edita su propio perfil desde su cuenta. Desde gerencia se ocultan o se muestran en Equipo y permisos.</p>
          <Link href="/panel/equipo" className="btn btn-dark">Ir a Equipo</Link>
        </div>
      </div>
    </>
  );
}
