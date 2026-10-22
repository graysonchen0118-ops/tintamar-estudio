import type { Metadata } from 'next';
import Shell from '@/components/panel/Shell';

export const metadata: Metadata = { title: 'Panel del estudio', robots: { index: false, follow: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
