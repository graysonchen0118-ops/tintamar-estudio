import type { Metadata } from 'next';
import { ArtistsView } from '@/components/site/Pages';

export const metadata: Metadata = {
  title: 'Tatuadores en Málaga: el equipo de Tintamar',
  description: 'Conoce a los seis tatuadores de Tintamar en el Soho de Málaga: línea fina, realismo, tradicional, japonés, blackwork y lettering. Mira su próximo hueco libre.',
  alternates: { canonical: '/artistas' },
};

export default function Page() {
  return <ArtistsView />;
}
