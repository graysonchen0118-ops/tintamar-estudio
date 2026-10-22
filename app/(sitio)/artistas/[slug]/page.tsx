import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ARTISTS, artistBySlug, styleBySlug } from '@/lib/mock/studio';
import { PHOTOS } from '@/lib/photos';
import { ArtistView } from '@/components/site/Pages';
import { breadcrumbs, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return ARTISTS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = artistBySlug((await params).slug);
  if (!a) return {};
  const styles = a.styles.map((s) => styleBySlug(s)!.name.toLowerCase()).join(' y ');
  return {
    title: `${a.name}, ${a.role.toLowerCase()} en Málaga`,
    description: `${a.name} tatúa ${styles} en Tintamar, en el Soho de Málaga. Mira sus trabajos y reserva con su agenda real.`,
    alternates: { canonical: `/artistas/${a.slug}` },
    openGraph: { images: [{ url: `https://images.unsplash.com/photo-${PHOTOS[a.photo].id}?w=1200&h=630&fit=crop&q=75`, width: 1200, height: 630, alt: PHOTOS[a.photo].alt }] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = artistBySlug(slug);
  if (!a) notFound();
  const person = { '@context': 'https://schema.org', '@type': 'Person', name: a.name, jobTitle: a.role, worksFor: { '@id': `${SITE_URL}/#estudio` }, image: `https://images.unsplash.com/photo-${PHOTOS[a.photo].id}?w=800&q=75`, knowsLanguage: a.languages };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([person, breadcrumbs([{ name: 'Inicio', path: '/' }, { name: 'Artistas', path: '/artistas' }, { name: a.name, path: `/artistas/${a.slug}` }])]) }} />
      <ArtistView slug={slug} />
    </>
  );
}
