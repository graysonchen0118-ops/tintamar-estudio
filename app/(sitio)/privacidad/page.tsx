import type { Metadata } from 'next';
import { PrivacyView } from '@/components/site/InfoPages';

export const metadata: Metadata = { title: 'Privacidad y cookies', description: 'Qué datos guarda Tintamar, para qué y cuánto tiempo, y cómo descargarlos o borrarlos.', alternates: { canonical: '/privacidad' } };

export default function Page() {
  return <PrivacyView />;
}
