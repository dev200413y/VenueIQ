/* ============================================
   VenueIQ — Mock Data & Constants
   ============================================ */
import type { Camera, ZoneData, QueueItem, AlertItem, TeamMessage, NavStep, Prediction, TimelineEvent } from './types';

// ---- CAMERAS ----
export const initialCameras: Camera[] = [
  { id: 'CAM-01', name: 'Gate A — Main Entrance', zone: 'Gate Area', status: 'crit', density: 89, persons: 47, vel: 'High', surge: 'SURGE', ai: 'Restrict incoming flow. Reroute via Gate D.' },
  { id: 'CAM-02', name: 'North Stand Upper', zone: 'North Stand', status: 'crit', density: 91, persons: 63, vel: 'High', surge: 'CRITICAL', ai: 'Surge detected. Emergency protocol recommended.' },
  { id: 'CAM-03', name: 'Food Court Central', zone: 'Food Court', status: 'warn', density: 82, persons: 38, vel: 'Medium', surge: 'HIGH', ai: 'Half-time surge imminent. Open backup stalls B3-B6.' },
  { id: 'CAM-04', name: 'East Gate Entrance', zone: 'East Stand', status: 'ok', density: 38, persons: 18, vel: 'Low', surge: 'NORMAL', ai: 'Clear. Accepting overflow redirects from North.' },
  { id: 'CAM-05', name: 'West Corridor', zone: 'West Stand', status: 'warn', density: 72, persons: 31, vel: 'Medium', surge: 'MODERATE', ai: 'Monitor. Density rising. Pre-stage staff here.' },
  { id: 'CAM-06', name: 'South Stand Lower', zone: 'South Stand', status: 'ok', density: 55, persons: 24, vel: 'Low', surge: 'NORMAL', ai: 'Normal. No action required.' },
  { id: 'CAM-07', name: 'VIP Entrance', zone: 'VIP Lounge', status: 'ok', density: 40, persons: 12, vel: 'Low', surge: 'NORMAL', ai: 'Clear. All VIP lanes operating smoothly.' },
  { id: 'CAM-08', name: 'Parking Exit East', zone: 'Parking', status: 'warn', density: 60, persons: 28, vel: 'Medium', surge: 'MODERATE', ai: 'Queue forming. Open overflow lane P3.' },
];

// ---- ZONES ----
export const initialZones: ZoneData[] = [
  { name: 'North Stand', pct: 91, col: '#ef4444' },
  { name: 'Food Court', pct: 82, col: '#f59e0b' },
  { name: 'West Stand', pct: 72, col: '#f59e0b' },
  { name: 'South Stand', pct: 68, col: '#f59e0b' },
  { name: 'East Stand', pct: 38, col: '#22c55e' },
  { name: 'VIP Lounge', pct: 40, col: '#22c55e' },
];

// ---- QUEUES ----
export const queueData: Record<string, QueueItem[]> = {
  concessions: [
    { name: 'Gate A Concessions', ico: '🍔', pct: 91, wait: 13, col: '#ef4444', tip: 'Use Gate B — 2 min wait' },
    { name: 'Gate B Concessions', ico: '🥤', pct: 28, wait: 2, col: '#22c55e', tip: 'Recommended now' },
    { name: 'Food Court A', ico: '🍕', pct: 82, wait: 10, col: '#f59e0b', tip: 'Backup stalls opening soon' },
    { name: 'VIP Lounge Bar', ico: '🍷', pct: 40, wait: 3, col: '#22c55e', tip: 'Low load — fast service' },
  ],
  facilities: [
    { name: 'Restroom Block N1', ico: '🚻', pct: 80, wait: 5, col: '#f59e0b', tip: 'Try Block W2 — 0 min' },
    { name: 'Restroom Block W2', ico: '🚻', pct: 22, wait: 0, col: '#22c55e', tip: 'Best option right now' },
    { name: 'Medical Bay M1', ico: '🏥', pct: 10, wait: 0, col: '#22c55e', tip: 'Open · Ground floor Gate B' },
    { name: 'Merchandise Store', ico: '👕', pct: 65, wait: 7, col: '#f59e0b', tip: 'Moderate — peak after match' },
  ],
  gates: [
    { name: 'Gate A — Main', ico: '🚪', pct: 89, wait: 'RESTRICTED', col: '#ef4444', tip: 'AI-restricted — surge' },
    { name: 'Gate B — West', ico: '🚪', pct: 35, wait: 'Open', col: '#22c55e', tip: 'Recommended entry/exit' },
    { name: 'Gate C — South', ico: '🚪', pct: 58, wait: '2 min', col: '#22c55e', tip: 'Normal flow' },
    { name: 'Gate D — East', ico: '🚪', pct: 30, wait: 'Open', col: '#22c55e', tip: 'Overflow gate — now open' },
  ],
};

// ---- ALERTS ----
export const initialAlerts: AlertItem[] = [
  { type: 'crit', title: 'North Stand — 91% density', body: 'Gemini surge alert: restrict Gate A incoming flow. Rerouting to Gate D.', time: 'Just now' },
  { type: 'warn', title: 'Food Court — half-time surge predicted', body: '34% increase expected in 8 min. Open backup stalls B3–B6 immediately.', time: 'Just now' },
  { type: 'info', title: 'Gate D overflow opened successfully', body: 'Rerouting effective — North Stand density curve flattening.', time: 'Just now' },
  { type: 'ok', title: 'Medical Bay — all clear', body: 'No incidents reported. Staff at full strength.', time: 'Just now' },
];

// ---- TEAM MESSAGES ----
export const initialTeamMessages: TeamMessage[] = [
  { init: 'RK', col: '#185fa5', name: 'Rahul K — Ops', text: 'Open Gate D now — North filling fast', ai: 'Confirmed. Gate D opened. 1,200+ rerouted.' },
  { init: 'SM', col: '#1d9e75', name: 'Sunita M — F&B', text: 'Deploy 3 more staff to Food Court before half-time', ai: 'Good call. Backup stalls B3-B6 activating in 2 min.' },
];

// ---- AI TEAM RESPONSES ----
export const teamAIResponses = [
  'Strategy logged. Gemini AI modeling now — update in 30s.',
  'Confirmed. Pre-staging resources at flagged zones.',
  'Acknowledged. All teams notified. Monitoring impact.',
  'Good observation. Deploying staff immediately.',
  'Running simulation. Results in 45 seconds.',
];

export const teamColors = ['#534ab7', '#993c1d', '#185fa5', '#0f6e56', '#72243e'];

// ---- NAVIGATION STEPS ----
export const navSteps: NavStep[] = [
  { title: 'Current location', sub: 'Concourse M, Gate A area', status: 'done' },
  { title: 'Head to West Corridor', sub: 'Avoid North Gate — 89% density. AI rerouting active.', status: 'done' },
  { title: 'West Elevator → Level 3', sub: 'Accessible · 0 min wait · Green floor markers', status: 'active' },
  { title: 'Follow N-Block signage', sub: 'AI-guided green arrows on floor panels', status: 'up' },
  { title: 'N-Block · Row 12 · Seat 34', sub: 'Estimated arrival: 4 minutes', status: 'up' },
];

// ---- PREDICTIONS ----
export const predictions: Prediction[] = [
  { zone: 'North Stand', cur: 91, fut: 75, dir: -1, col: '#ef4444', ai: 'Rerouting active — density dropping as Gate D opened.' },
  { zone: 'Food Court', cur: 82, fut: 94, dir: 1, col: '#f59e0b', ai: 'Half-time surge in 8 min. Open backup stalls B3–B6 now.' },
  { zone: 'East Stand', cur: 38, fut: 55, dir: 1, col: '#22c55e', ai: 'Comfortable. No action needed — absorbing overflow.' },
];

// ---- EVENT TIMELINE ----
export const eventTimeline: TimelineEvent[] = [
  { time: '19:30', label: 'Match begins', status: 'done' },
  { time: '20:15', label: 'Half-time (now)', status: 'active' },
  { time: '20:30', label: 'Second half', status: 'up' },
  { time: '22:00', label: 'Post-match exit', status: 'up' },
];

// ---- SPARKLINE DATA ----
export const sparklineData = [38, 45, 54, 61, 67, 72, 70, 78, 82, 87, 91, 86, 89, 91, 88];

// ---- AI CHAT REPLIES ----
export const aiReplies: Record<string, string> = {
  restroom: 'Restroom Block W2 (Level 1) has 0 min wait — only 22% occupancy. 2 min walk via West Corridor from Gate A.',
  food: 'Gate B Concessions: 2 min wait only. vs 13 min at Gate A. Note: half-time rush in 8 min — go now!',
  seat: 'From Gate A → West Corridor (avoid North, 89%) → West Elevator Level 3 → Green N-Block markers → Seat 34. ETA 4 min.',
  north: 'North Stand at 91% — CRITICAL. Gate A restricted. East Stand is comfortable at 38% — use Gate D.',
  half: 'Half-time in 8 min. Predicted 34% surge to concessions. Go to Gate B Concessions and Restroom W2 now to beat the rush.',
  parking: 'East Parking: 6 min wait — recommended. West Parking: 14 min. AI routing traffic to staggered exits post-match.',
  def: 'Live data: North Stand congested (91%), Gate A restricted. East/West facilities clear. Where can I guide you?',
};

export function getAIReply(message: string): string {
  const ml = message.toLowerCase();
  if (ml.includes('restroom') || ml.includes('toilet') || ml.includes('bathroom')) return aiReplies.restroom;
  if (ml.includes('food') || ml.includes('eat') || ml.includes('stall') || ml.includes('queue') || ml.includes('concession')) return aiReplies.food;
  if (ml.includes('seat') || ml.includes('route') || ml.includes('navigate') || ml.includes('guide')) return aiReplies.seat;
  if (ml.includes('north')) return aiReplies.north;
  if (ml.includes('half') || ml.includes('plan')) return aiReplies.half;
  if (ml.includes('park')) return aiReplies.parking;
  return aiReplies.def;
}

// ---- VENUE SERVICES ----
export const venueServices = [
  { ico: '🚻', name: 'Restroom W2', meta: '0 min · Level 1' },
  { ico: '🏥', name: 'Medical Bay', meta: 'Open · Gate B' },
  { ico: '🍔', name: 'Gate B Food', meta: '2 min wait' },
  { ico: '💳', name: 'ATM Zone A', meta: 'No queue' },
  { ico: '🔍', name: 'Lost & Found', meta: 'Gate B Office' },
  { ico: '🚗', name: 'Parking Exit E', meta: '6 min wait' },
];

// ---- EMERGENCY EXITS ----
export const emergencyExits = [
  { gate: 'Gate B', desc: 'West · 1 min', ok: true },
  { gate: 'Gate D', desc: 'East · 2 min', ok: true },
  { gate: 'Gate C', desc: 'South · 3 min', ok: true },
  { gate: 'Gate A', desc: 'North · RESTRICTED', ok: false },
];

// ---- A11Y FEATURES ----
export const a11yFeatures = [
  'Elevator operational — 0 min wait',
  'Tactile floor paving active',
  'Audio guidance available',
];

// ---- ATTENDEE ROUTE STEPS ----
export const attendeeRouteSteps = [
  { ico: '📍', title: 'You are here', sub: 'Gate B, Level 1', col: '#4ade80' },
  { ico: '🚶', title: 'Head to West Elevator', sub: 'Follow green floor arrows — 1 min', col: '#60a5fa' },
  { ico: '🛗', title: 'Elevator to Level 3', sub: 'Accessible · 0 min wait', col: '#a78bfa' },
  { ico: '🪑', title: 'N-Block · Row 12 · Seat 34', sub: 'AI-optimized · 4 min total', col: '#4ade80' },
];

// ---- ATTENDEE QUICK INFO ----
export const attendeeQuickInfo = [
  { ico: '🚻', title: 'Nearest restroom', val: 'Block W2 · 0 min wait', vc: '#4ade80' },
  { ico: '🍔', title: 'Shortest food queue', val: 'Gate B · 2 min wait', vc: '#4ade80' },
  { ico: '🏥', title: 'Medical bay', val: 'Gate B Ground Floor · Open', vc: '#4ade80' },
  { ico: '🚪', title: 'Exit options', val: 'Gate B or D recommended', vc: '#4ade80' },
];

// ---- ATTENDEE SCHEDULE ----
export const attendeeSchedule: TimelineEvent[] = [
  { time: '19:00', label: 'Gates open', status: 'done', ico: '🚪' },
  { time: '19:30', label: 'Match begins — Toss & Lineup', status: 'done', ico: '🏏' },
  { time: '20:15', label: 'Half-time (now) — 15 min break', status: 'active', ico: '⏸' },
  { time: '20:30', label: 'Second half kicks off', status: 'up', ico: '▶' },
  { time: '22:00', label: 'Match ends — post-match ceremony', status: 'up', ico: '🏆' },
  { time: '22:30', label: 'Staggered exit begins', status: 'up', ico: '🚶' },
];

// ---- ANNOUNCEMENTS ----
export const announcements = [
  { ico: '🚨', msg: 'Gate A is currently restricted — please use Gate B or Gate D', col: '#f59e0b', dim: 'var(--adim)', brd: 'var(--abrd)' },
  { ico: '🍔', msg: 'Half-time special: 20% off at Gate B Concessions for next 15 min', col: '#4ade80', dim: 'var(--gdim)', brd: 'var(--gbrd)' },
  { ico: '🎵', msg: 'Live music at South Plaza during half-time break', col: '#a78bfa', dim: '#1a1230', brd: '#4c3a8a' },
  { ico: '🚗', msg: 'Parking: East lot recommended for fastest exit post-match', col: '#60a5fa', dim: 'var(--bdim)', brd: 'var(--bbrd)' },
];

// ---- CAMERA ZONES FOR ADD MODAL ----
export const cameraZoneOptions = ['North Stand', 'South Stand', 'East Stand', 'West Stand', 'Food Court', 'Gate Area', 'Parking', 'VIP Lounge'];

// ---- STATUS COLOR MAP ----
export const statusColors: Record<string, string> = {
  crit: '#ef4444',
  warn: '#f59e0b',
  ok: '#22c55e',
};

export const statusLabels: Record<string, string> = {
  crit: 'CRITICAL',
  warn: 'WARNING',
  ok: 'NORMAL',
};

export const statusTagClass: Record<string, string> = {
  crit: 'tag-r',
  warn: 'tag-a',
  ok: 'tag-g',
};

export const alertClassMap: Record<string, string> = {
  crit: 'al-crit',
  warn: 'al-warn',
  info: 'al-info',
  ok: 'al-ok',
};

export const alertDotColor: Record<string, string> = {
  crit: '#ef4444',
  warn: '#f59e0b',
  info: '#60a5fa',
  ok: '#22c55e',
};
