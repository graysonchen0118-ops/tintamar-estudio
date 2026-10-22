import type { ApptStatus, Stage, Channel, SyncState, ApptKind, Source } from './types';

export const STAGES: { id: Stage; label: string; tone: string }[] = [
  { id: 'solicitud', label: 'Solicitud nueva', tone: 'accent' },
  { id: 'diseno', label: 'Diseño', tone: 'warn' },
  { id: 'sesiones', label: 'En sesiones', tone: 'sea' },
  { id: 'cicatrizacion', label: 'Curando', tone: 'ok' },
  { id: 'terminado', label: 'Terminado', tone: '' },
];
export const stageLabel = (s: Stage) => STAGES.find((x) => x.id === s)?.label ?? 'Descartado';
export const stageTone = (s: Stage) => STAGES.find((x) => x.id === s)?.tone ?? 'bad';

export const STATUS: Record<ApptStatus, { label: string; tone: string }> = {
  confirmada: { label: 'Confirmada', tone: 'ok' },
  pendiente_senal: { label: 'Falta la señal', tone: 'warn' },
  hecha: { label: 'Hecha', tone: '' },
  cancelada: { label: 'Cancelada', tone: 'bad' },
  no_show: { label: 'No vino', tone: 'bad' },
};

export const KIND: Record<ApptKind, string> = { sesion: 'Sesión', consulta: 'Consulta', retoque: 'Retoque' };

export const CHANNEL: Record<Channel, string> = { web: 'Web', chat: 'Asistente', mostrador: 'Mostrador', whatsapp: 'WhatsApp', telefono: 'Teléfono' };

export const SYNC: Record<SyncState, { label: string; tone: string }> = {
  sincronizada: { label: 'En Google Calendar', tone: 'ok' },
  pendiente: { label: 'Pendiente de Google', tone: 'warn' },
  error: { label: 'Error con Google', tone: 'bad' },
};

export const SOURCE_COLOR: Record<Source, string> = {
  'Google orgánico': '#2f8a87',
  'Google Ads': '#d4553a',
  Instagram: '#8a5fa8',
  Recomendación: '#b0832f',
  Directo: '#6d6157',
  Mostrador: '#4f6a95',
};

export const shortName = (n: string) => {
  const [a, b] = n.split(' ');
  return b ? `${a} ${b[0]}.` : a;
};
