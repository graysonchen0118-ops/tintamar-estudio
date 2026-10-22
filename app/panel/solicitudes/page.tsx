'use client';

import { RequestsPage } from '@/components/panel/Home';
import { ManagerOnly } from '@/components/panel/Shell';

export default function Page() {
  return (
    <ManagerOnly>
      <RequestsPage />
    </ManagerOnly>
  );
}
