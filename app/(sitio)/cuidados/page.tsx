import type { Metadata } from 'next';
import { CareView } from '@/components/site/InfoPages';

export const metadata: Metadata = {
  title: 'Cuidados de un tatuaje nuevo, día a día',
  description: 'Qué hacer con un tatuaje recién hecho: lavado, crema, sol, playa y piscina. La guía que damos en Tintamar, día a día.',
  alternates: { canonical: '/cuidados' },
};

export default function Page() {
  return <CareView />;
}
