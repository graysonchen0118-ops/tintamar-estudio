'use client';

import { ManagerHome, ArtistHome } from '@/components/panel/Home';
import { useRole } from '@/components/panel/Shell';

export default function Page() {
  const { isManager, artistId } = useRole();
  if (isManager) return <ManagerHome />;
  return artistId ? <ArtistHome id={artistId} /> : null;
}
