import type { Metadata } from 'next';
import { Suspense } from 'react';
import ConfirmView from '@/components/site/ConfirmView';

export const metadata: Metadata = { title: 'Reserva hecha', robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <ConfirmView />
    </Suspense>
  );
}
