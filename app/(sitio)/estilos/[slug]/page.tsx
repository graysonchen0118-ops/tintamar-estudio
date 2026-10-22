import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { STYLES, styleBySlug } from '@/lib/mock/studio';
import { PHOTOS } from '@/lib/photos';
import { StyleView } from '@/components/site/Pages';
import { breadcrumbs, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return STYLES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = styleBySlug((await params).slug);
  if (!s) return {};
  return {
    title: s.title,
    description: s.description,
    alternates: { canonical: `/estilos/${s.slug}` },
    openGraph: { images: [{ url: `https://images.unsplash.com/photo-${PHOTOS[s.cover].id}?w=1200&h=630&fit=crop&q=75`, width: 1200, height: 630, alt: PHOTOS[s.cover].alt }] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = styleBySlug(slug);
  if (!s) notFound();
  const service = { '@context': 'https://schema.org', '@type': 'Service', name: s.title, serviceType: s.name, provider: { '@id': `${SITE_URL}/#estudio` }, areaServed: 'Málaga', offers: { '@type': 'Offer', priceCurrency: 'EUR', price: s.priceFrom } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([service, breadcrumbs([{ name: 'Inicio', path: '/' }, { name: 'Estilos', path: '/estilos' }, { name: s.name, path: `/estilos/${s.slug}` }])]) }} />
      <StyleView slug={slug} />
    </>
  );
}
