import { STUDIO, ARTISTS, STYLES } from './mock/studio';

export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const t = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** The studio as Google reads it: the same data the page shows, never a second copy typed by hand. */
export function studioJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    '@id': `${SITE_URL}/#estudio`,
    name: STUDIO.full,
    url: SITE_URL,
    telephone: STUDIO.phone,
    email: STUDIO.email,
    priceRange: '80 € a 700 €',
    image: `https://images.unsplash.com/photo-1769605767701-6e5a680ef685?w=1200&q=75&auto=format&fit=crop`,
    address: { '@type': 'PostalAddress', streetAddress: STUDIO.street, postalCode: STUDIO.zip, addressLocality: STUDIO.city, addressRegion: 'Andalucía', addressCountry: 'ES' },
    geo: { '@type': 'GeoCoordinates', latitude: STUDIO.geo.lat, longitude: STUDIO.geo.lng },
    openingHoursSpecification: STUDIO.hours.flatMap((h, i) => (h ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS[i], opens: t(h.open), closes: t(h.close) }] : [])),
    employee: ARTISTS.map((a) => ({ '@type': 'Person', name: a.name, jobTitle: `Tatuador: ${a.role}`, url: `${SITE_URL}/artistas/${a.slug}` })),
    makesOffer: STYLES.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, url: `${SITE_URL}/estilos/${s.slug}` } })),
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}
