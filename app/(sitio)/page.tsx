import HomeView from '@/components/site/HomeView';
import { studioJsonLd } from '@/lib/site';

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(studioJsonLd()) }} />
      <HomeView />
    </>
  );
}
