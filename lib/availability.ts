import { STUDIO, artistById, type ArtistId } from './mock/studio';
import type { Appointment, GoogleBusy, SlotOffer } from './types';
import { addDays, weekday, todayIso, nowMin } from './dates';

const live = (a: Appointment) => a.status !== 'cancelada' && a.status !== 'no_show';

export function dayHours(artistId: ArtistId, date: string) {
  const artist = artistById(artistId);
  const wd = weekday(date);
  const h = STUDIO.hours[wd];
  if (!artist || !h || !artist.workDays.includes(wd)) return null;
  return h;
}

/**
 * Start times (minutes) where a block of `minutes` fits for one artist on one day.
 * Studio bookings keep half an hour around them to clean and set up the station.
 * Busy time read from the artist's Google Calendar is blocked exactly as it comes.
 */
export function freeStarts(artistId: ArtistId, date: string, minutes: number, appts: Appointment[], busy: GoogleBusy[], ignoreId?: string) {
  const h = dayHours(artistId, date);
  if (!h) return [];
  const blocks: [number, number][] = [];
  for (const a of appts) {
    if (a.artistId !== artistId || a.date !== date || !live(a) || a.id === ignoreId) continue;
    blocks.push([a.start - STUDIO.bufferMin, a.end + STUDIO.bufferMin]);
  }
  for (const b of busy) if (b.artistId === artistId && b.date === date) blocks.push([b.start, b.end]);
  const today = todayIso();
  if (date < today) return [];
  const earliest = date === today ? Math.ceil((nowMin() + 120) / 30) * 30 : h.open;
  const out: number[] = [];
  for (let s = Math.max(h.open, earliest); s + minutes <= h.close; s += 30) {
    const e = s + minutes;
    if (blocks.every(([bs, be]) => e <= bs || s >= be)) out.push(s);
  }
  return out;
}

/** First free start per day, across the next `days`, until `count` offers are found. */
export function nextOffers(artistIds: ArtistId[], minutes: number, appts: Appointment[], busy: GoogleBusy[], count = 3, from = todayIso(), days = 35): SlotOffer[] {
  const offers: SlotOffer[] = [];
  for (let d = 0; d < days && offers.length < count; d++) {
    const date = addDays(from, d);
    for (const id of artistIds) {
      const starts = freeStarts(id, date, minutes, appts, busy);
      if (starts.length) {
        offers.push({ artistId: id, date, start: starts[0], end: starts[0] + minutes });
        break;
      }
    }
  }
  return offers;
}

export function firstFree(artistId: ArtistId, minutes: number, appts: Appointment[], busy: GoogleBusy[]) {
  return nextOffers([artistId], minutes, appts, busy, 1)[0] ?? null;
}

export function conflicts(c: { id?: string; artistId: ArtistId; date: string; start: number; end: number }, appts: Appointment[], busy: GoogleBusy[]) {
  const overlaps = appts.filter((a) => a.id !== c.id && live(a) && a.artistId === c.artistId && a.date === c.date && a.start < c.end && c.start < a.end);
  const tight = appts.filter((a) => a.id !== c.id && live(a) && a.artistId === c.artistId && a.date === c.date && !overlaps.includes(a) && (Math.abs(a.end - c.start) < STUDIO.bufferMin || Math.abs(c.end - a.start) < STUDIO.bufferMin) && (a.end <= c.start || c.end <= a.start));
  const gbusy = busy.filter((b) => b.artistId === c.artistId && b.date === c.date && b.start < c.end && c.start < b.end);
  const h = dayHours(c.artistId, c.date);
  const outside = !h || c.start < h.open || c.end > h.close;
  return { overlaps, tight, gbusy, outside, ok: !overlaps.length && !gbusy.length };
}

export function bookedMinutes(artistId: ArtistId, date: string, appts: Appointment[]) {
  return appts.filter((a) => a.artistId === artistId && a.date === date && live(a)).reduce((s, a) => s + (a.end - a.start), 0);
}
