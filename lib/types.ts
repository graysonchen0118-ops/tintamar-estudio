import type { ArtistId, StyleSlug, ZoneId } from './mock/studio';

export type Source = 'Google orgánico' | 'Google Ads' | 'Instagram' | 'Recomendación' | 'Directo' | 'Mostrador';
export type Channel = 'web' | 'chat' | 'mostrador' | 'whatsapp' | 'telefono';

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: Source;
  createdAt: string;
  marketing: boolean;
  consentSigned: boolean;
  health?: HealthForm;
  notes?: string;
  deleted?: boolean;
};

export type HealthForm = {
  allergies: string;
  anticoagulants: boolean;
  diabetes: boolean;
  skin: boolean;
  pregnant: boolean;
  signedAt: string;
  signature: string;
  photosConsent: boolean;
};

export type Stage = 'solicitud' | 'diseno' | 'sesiones' | 'cicatrizacion' | 'terminado' | 'descartado';

export type ProjectNote = { at: string; by: string; text: string };

export type Project = {
  id: string;
  code: string;
  clientId: string;
  artistId: ArtistId | null;
  title: string;
  style: StyleSlug;
  zone: ZoneId;
  side: 'izquierdo' | 'derecho' | null;
  sizeCm: number;
  color: boolean;
  description: string;
  references: string[];
  stage: Stage;
  sessionsPlanned: number;
  quote: { min: number; max: number };
  deposit: { amount: number; paid: boolean; at?: string };
  channel: Channel;
  source: Source;
  campaign?: string;
  createdAt: string;
  notes: ProjectNote[];
  coverUp?: boolean;
};

export type ApptKind = 'sesion' | 'consulta' | 'retoque';
export type ApptStatus = 'confirmada' | 'pendiente_senal' | 'hecha' | 'cancelada' | 'no_show';
export type SyncState = 'sincronizada' | 'pendiente' | 'error';

export type Appointment = {
  id: string;
  artistId: ArtistId;
  clientId: string;
  projectId: string | null;
  kind: ApptKind;
  date: string;
  start: number;
  end: number;
  status: ApptStatus;
  channel: Channel;
  gcal: SyncState;
  gcalId?: string;
  createdAt: string;
  sessionNo?: number;
  spinCode?: string;
  holdUntil?: string;
};

/** A busy block read back from the artist's own Google Calendar: only the time, never the title. */
export type GoogleBusy = { id: string; artistId: ArtistId; date: string; start: number; end: number; receivedAt: string };

export type GcalAccount = { connected: boolean; email: string; calendar: string; lastSync: string; up: number; down: number; error?: string };

export type SyncEntry = { id: string; at: string; artistId: ArtistId | 'general'; dir: 'up' | 'down'; text: string; ok: boolean };

export type ChatMsg = { id: string; from: 'bot' | 'user' | 'equipo'; text: string; at: string; chips?: string[]; slots?: SlotOffer[]; link?: { href: string; label: string }; booking?: string };

export type SlotOffer = { artistId: ArtistId; date: string; start: number; end: number };

export type Outcome = 'reserva' | 'solicitud' | 'derivada' | 'informacion' | 'abierta';

export type Conversation = {
  id: string;
  startedAt: string;
  visitor: string;
  page: string;
  source: Source;
  outcome: Outcome;
  messages: ChatMsg[];
  projectId?: string;
};

export type Unanswered = { id: string; at: string; question: string; count: number; resolved?: boolean };

export type ConversionType = 'reserva_web' | 'reserva_chat' | 'clic_whatsapp' | 'llamada' | 'consulta_cover';

export type Conversion = { id: string; at: string; type: ConversionType; source: Source; campaign?: string; page: string; value: number; consent: boolean };

export type SeoPage = { path: string; title: string; description: string; keyword: string; clicks: number; impressions: number; position: number };

export type Prize = { id: string; name: string; short: string; weight: number; stock: number | null; color: string; active: boolean };

export type SpinCode = { code: string; clientId: string; artistId: ArtistId; apptId: string; issuedAt: string; usedAt?: string; prizeId?: string; redeemedAt?: string };

export type ReviewInvite = { id: string; code: string; at: string; opened: boolean };

export type GoogleReview = { id: string; author: string; rating: number; text: string; date: string; artistId?: ArtistId; reply?: string; lang?: 'es' | 'en' };

export type Role = 'gerencia' | ArtistId;
