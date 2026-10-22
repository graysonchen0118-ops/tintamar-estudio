import type { Metadata } from 'next';
import { Suspense } from 'react';
import BookingView from '@/components/site/BookingView';

export const metadata: Metadata = {
  title: 'Reservar cita de tatuaje en Málaga',
  description: 'Cuéntanos tu idea, señala la zona y el tamaño y reserva el hueco real de tu tatuador. Señal de 50 € descontada del precio final.',
  alternates: { canonical: '/reservar' },
};

export default function Page() {
  return (
    <Suspense>
      <BookingView />
    </Suspense>
  );
}
