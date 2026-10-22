import { STUDIO } from './mock/studio';

const stamp = (date: string, min: number) => `${date.replace(/-/g, '')}T${String(Math.floor(min / 60)).padStart(2, '0')}${String(min % 60).padStart(2, '0')}00`;

/** A calendar file the client can open in any phone calendar. Times are local Madrid time. */
export function icsFor(o: { code: string; title: string; date: string; start: number; end: number; artist: string }) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tintamar//Citas//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${o.code}@tintamar.es`, `DTSTAMP:${stamp(new Date().toISOString().slice(0, 10), 0)}Z`,
    `DTSTART;TZID=Europe/Madrid:${stamp(o.date, o.start)}`, `DTEND;TZID=Europe/Madrid:${stamp(o.date, o.end)}`,
    `SUMMARY:${o.title} con ${o.artist} (Tintamar)`, `LOCATION:${STUDIO.street}\\, ${STUDIO.zip} ${STUDIO.city}`,
    `DESCRIPTION:Código ${o.code}. Trae el DNI\\, ven habiendo comido y sin alcohol el día anterior.`,
    'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY', 'DESCRIPTION:Mañana tienes cita en Tintamar', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadIcs(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
