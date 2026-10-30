export type EmailStatus =
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED'
  | 'RATE_LIMITED_RESCHEDULED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  createdAt: string;
}

export interface Sender {
  id: string;
  userId: string;
  email: string;
  name: string;
  hourlyLimit: number;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean;
  createdAt: string;
}

export interface SlackInfo {
  connected: boolean;
  teamName?: string;
  channelName?: string;
  connectedAt?: string;
  lastNotifiedAt?: string;
}

export interface EmailRecord {
  id: string;
  userId: string;
  senderId?: string | null;
  senderEmail: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  etherealPreviewUrl?: string | null;
  messageId?: string | null;
  delaySeconds: number;
  maxPerHour: number;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  sender?: Sender;
}

export interface SchedulePayload {
  subject: string;
  body: string;
  recipients: string[];
  senderEmail: string;
  senderId?: string;
  startTime?: string | null;
  delaySeconds: number;
  maxPerHour: number;
}
