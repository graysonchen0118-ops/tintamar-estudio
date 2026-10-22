import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RouletteView } from '@/components/site/InfoPages';

export const metadata: Metadata = { title: 'Ruleta de premios', description: 'Un giro con premio por cada sesión terminada en Tintamar.', robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <RouletteView />
    </Suspense>
  );
}
