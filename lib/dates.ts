import { DAY_SHORT, DAY_NAMES } from './mock/studio';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const pad = (n: number) => String(n).padStart(2, '0');

export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** 0 = lunes ... 6 = domingo */
export const weekday = (s: string) => (parse(s).getDay() + 6) % 7;

export const mondayOf = (s: string) => addDays(s, -weekday(s));

export const todayIso = () => iso(new Date());

export const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

export const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + (m || 0);
};

export const dayShort = (s: string) => {
  const d = parse(s);
  return `${DAY_SHORT[weekday(s)]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
};

export const dayLong = (s: string) => {
  const d = parse(s);
  return `${DAY_NAMES[weekday(s)]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};

export const dayNum = (s: string) => parse(s).getDate();
export const monthShort = (s: string) => MONTHS_SHORT[parse(s).getMonth()];

export const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);

export const stampNow = () => {
  const d = new Date();
  return `${iso(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const stampOf = (date: string, min: number) => `${date} ${hhmm(min)}`;

/** "hace 2 h", "ayer", "hace 3 días" from a "YYYY-MM-DD HH:MM" stamp */
export const ago = (stamp: string) => {
  const [d, t] = stamp.split(' ');
  const then = parse(d);
  if (t) {
    const [h, m] = t.split(':').map(Number);
    then.setHours(h, m);
  }
  const mins = Math.round((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  return dayShort(d);
};

export const durLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

export const euro = (n: number) => `${n.toLocaleString('es-ES')} €`;

/** Capital on the first letter only: "Sábado 24 de octubre", never "Sábado 24 De Octubre". */
export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** "1 cita", "3 citas": the count and the noun agree. */
export const pl = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
