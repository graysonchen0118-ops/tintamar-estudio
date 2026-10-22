'use client';

import { ClientsPage } from '@/components/panel/Work';
import { ManagerOnly } from '@/components/panel/Shell';

export default function Page() {
  return (
    <ManagerOnly>
      <ClientsPage />
    </ManagerOnly>
  );
}
