import type { Metadata } from 'next';
import { Suspense } from 'react';
import MyBookingView from '@/components/site/MyBookingView';

export const metadata: Metadata = { title: 'Mi cita', description: 'Consulta tu cita, paga la señal, firma el formulario de salud o cambia la fecha.', robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <MyBookingView />
    </Suspense>
  );
}
