import type { Metadata, Viewport } from 'next';
import { Lexend } from 'next/font/google';
import { StoreProvider } from '@/lib/store';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const lexend = Lexend({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-lexend' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Tintamar · Estudio de tatuaje en el Soho de Málaga', template: '%s · Tintamar' },
  description: 'Estudio de tatuaje en el Soho de Málaga con seis tatuadores: línea fina, realismo, tradicional, japonés, blackwork y lettering. Reserva con la agenda real y señal de 50 €.',
  openGraph: { type: 'website', locale: 'es_ES', siteName: 'Tintamar Estudio de Tatuaje' },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = { themeColor: '#0f0d0c', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${lexend.className} ${lexend.variable}`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
