import { STUDIO, styleBySlug, zoneById, artistById, type StyleSlug, type ZoneId, type ArtistId } from './mock/studio';

export type EstimateInput = { style: StyleSlug; zone: ZoneId; sizeCm: number; color: boolean; artistId?: ArtistId | null; coverUp?: boolean };

export type Estimate = {
  hours: number;
  sessions: number;
  /** length of the first appointment that gets booked, in minutes */
  firstMinutes: number;
  firstKind: 'sesion' | 'consulta';
  priceMin: number;
  priceMax: number;
  perSession: { min: number; max: number } | null;
  reason: string | null;
};

const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Size, zone, style and colour decide how long the needle is on the skin.
 * The agenda books that length, so a rose on the ribs never lands in a one hour gap.
 */
export function estimate(i: EstimateInput): Estimate {
  const style = styleBySlug(i.style);
  const zone = zoneById(i.zone);
  const size = Math.max(2, Math.min(i.sizeCm, zone?.maxCm ?? 60));
  let hours = (0.5 + 0.016 * Math.pow(size, 1.8)) * (style?.factor ?? 1) * (zone?.factor ?? 1) * (i.color ? 1.25 : 1);
  hours = Math.max(1, Math.round(hours * 2) / 2);
  const sessions = Math.ceil(hours / STUDIO.maxSessionHours);
  const rate = (i.artistId && artistById(i.artistId)?.hourly) || 115;
  const total = Math.max(STUDIO.minPrice, hours * rate);
  const priceMin = Math.max(STUDIO.minPrice, round10(total * 0.88));
  const priceMax = Math.max(priceMin + 20, round10(total * 1.12));
  const perSession = sessions > 1 ? { min: round10((priceMin / sessions)), max: round10(priceMax / sessions) } : null;

  let firstKind: 'sesion' | 'consulta' = 'sesion';
  let reason: string | null = null;
  if (i.coverUp || i.style === 'cover-up') {
    firstKind = 'consulta';
    reason = 'Un cover-up empieza con una consulta gratuita de 30 minutos para ver el tatuaje antiguo.';
  } else if (sessions >= 3) {
    firstKind = 'consulta';
    reason = `Es un proyecto de unas ${sessions} sesiones, así que empieza con una consulta gratuita para medir la zona y planificarlo.`;
  }
  const firstMinutes = firstKind === 'consulta' ? 30 : Math.round(Math.min(hours, STUDIO.maxSessionHours) * 60);
  return { hours, sessions, firstMinutes, firstKind, priceMin, priceMax, perSession, reason };
}

export const sizeLabel = (cm: number) => (cm <= 6 ? 'Pequeño' : cm <= 14 ? 'Mediano' : cm <= 25 ? 'Grande' : 'Muy grande');
