/* ============================================
   VenueIQ — Types & Interfaces
   ============================================ */

export interface VenueConfig {
  name: string;
  event: string;
  capacity: number;
  registered: number;
  walkin: number;
  eventType: string;
}

export interface Camera {
  id: string;
  name: string;
  zone: string;
  status: 'crit' | 'warn' | 'ok';
  density: number;
  persons: number;
  vel: string;
  surge: string;
  ai: string;
}

export interface ZoneData {
  name: string;
  pct: number;
  col: string;
}

export interface QueueItem {
  name: string;
  ico: string;
  pct: number;
  wait: string | number;
  col: string;
  tip: string;
}

export interface AlertItem {
  type: 'crit' | 'warn' | 'info' | 'ok';
  title: string;
  body: string;
  time: string;
}

export interface TeamMessage {
  init: string;
  col: string;
  name: string;
  text: string;
  ai: string;
}

export interface ChatMessage {
  text: string;
  isUser: boolean;
  time: string;
}

export interface NavStep {
  title: string;
  sub: string;
  status: 'done' | 'active' | 'up';
}

export interface Prediction {
  zone: string;
  cur: number;
  fut: number;
  dir: number;
  col: string;
  ai: string;
}

export interface TimelineEvent {
  time: string;
  label: string;
  status: 'done' | 'active' | 'up';
  ico?: string;
}

export type AdminPage = 'overview' | 'crowd' | 'queues' | 'navigate' | 'ai' | 'alerts';
export type AppMode = 'admin' | 'attendee';
