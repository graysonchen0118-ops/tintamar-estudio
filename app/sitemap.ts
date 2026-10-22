import type { MetadataRoute } from 'next';
import { ARTISTS, STYLES } from '@/lib/mock/studio';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date('2026-10-22');
  return [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/artistas`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/estilos`, lastModified: now, priority: 0.8 },
    ...STYLES.map((s) => ({ url: `${SITE_URL}/estilos/${s.slug}`, lastModified: now, priority: 0.9 })),
    ...ARTISTS.map((a) => ({ url: `${SITE_URL}/artistas/${a.slug}`, lastModified: now, priority: 0.7 })),
    { url: `${SITE_URL}/reservar`, lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/cuidados`, lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/privacidad`, lastModified: now, priority: 0.2 },
  ];
}
