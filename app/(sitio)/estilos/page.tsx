import type { Metadata } from 'next';
import { StylesIndex } from '@/components/site/Pages';

export const metadata: Metadata = {
  title: 'Estilos de tatuaje en Málaga',
  description: 'Línea fina, realismo, tradicional, japonés, blackwork, lettering y cover-up en el Soho de Málaga. Precio orientativo y tatuadores de cada estilo.',
  alternates: { canonical: '/estilos' },
};

export default function Page() {
  return <StylesIndex />;
}
