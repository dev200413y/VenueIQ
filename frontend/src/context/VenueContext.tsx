import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { VenueConfig, Camera, AlertItem, TeamMessage, ChatMessage, ZoneData, AdminPage, AppMode } from '../types';
import { initialCameras, initialAlerts, initialTeamMessages, initialZones, teamAIResponses, teamColors } from '../data';
import { getGeminiResponse } from '../gemini';
import { db } from '../firebase';
import { ref, set } from 'firebase/database';

interface VenueState {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  activePage: AdminPage;
  setActivePage: (p: AdminPage) => void;
  config: VenueConfig;
  setConfig: (c: VenueConfig) => void;
  cameras: Camera[];
  setCameras: React.Dispatch<React.SetStateAction<Camera[]>>;
  selectedCam: number | null;
  setSelectedCam: (i: number | null) => void;
  alerts: AlertItem[];
  addAlert: (a: AlertItem) => void;
  teamMessages: TeamMessage[];
  postTeamMessage: (text: string) => void;
  adminChat: ChatMessage[];
  sendAdminChat: (text: string) => void;
  attChat: ChatMessage[];
  sendAttChat: (text: string) => void;
  arrived: number;
  reroutes: number;
  incidents: number;
  setIncidents: React.Dispatch<React.SetStateAction<number>>;
  zones: ZoneData[];
  clock: string;
  camCounter: React.MutableRefObject<number>;
  deleteCamera: (i: number) => void;
  addCamera: (name: string, zone: string, status: 'crit' | 'warn' | 'ok', density: number) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  addCamOpen: boolean;
  setAddCamOpen: (v: boolean) => void;
}

const VenueContext = createContext<VenueState | null>(null);

export const useVenue = (): VenueState => {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error('useVenue must be used within VenueProvider');
  return ctx;
};

export const VenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AppMode>('admin');
  const [activePage, setActivePage] = useState<AdminPage>('overview');
  const [config, setConfig] = useState<VenueConfig>({
    name: 'Grand Sports Arena',
    event: 'IPL Final · Match Day',
    capacity: 80000,
    registered: 72450,
    walkin: 4200,
    eventType: 'Cricket / IPL',
  });
  const [cameras, setCameras] = useState<Camera[]>(initialCameras);
  const [selectedCam, setSelectedCam] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>(initialTeamMessages);
  const [adminChatMsgs, setAdminChatMsgs] = useState<ChatMessage[]>([
    { text: "Hi! I'm your VenueIQ assistant powered by Google Gemini. I have real-time data on every zone, gate, queue, and route. What do you need?", isUser: false, time: 'just now' },
  ]);
  const [attChatMsgs, setAttChatMsgs] = useState<ChatMessage[]>([
    { text: 'Hi! I know your seat (N-Block Row 12 Seat 34) and current venue conditions. I can guide you to the shortest queues, your seat, restrooms, or anything else!', isUser: false, time: 'just now' },
  ]);
  const [arrived, setArrived] = useState(67842);
  const [reroutes, setReroutes] = useState(1247);
  const [incidents, setIncidents] = useState(0);
  const [zones, setZones] = useState<ZoneData[]>(initialZones);
  const [clock, setClock] = useState('--:--:--');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addCamOpen, setAddCamOpen] = useState(false);
  const camCounter = useRef(9);
  const teamCount = useRef(2);

  // Clock tick
  useEffect(() => {
    const tick = () => setClock(new Date().toTimeString().split(' ')[0]);
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  // Live KPI updates (arrived + reroutes)
  useEffect(() => {
    const iv = setInterval(() => {
      setArrived(p => {
        const newVal = p + Math.floor(Math.random() * 4);
        if (db) set(ref(db, 'live/arrived'), newVal);
        return newVal;
      });
      setReroutes(p => p + Math.floor(Math.random() * 3));
    }, 3500);
    return () => clearInterval(iv);
  }, []);

  // Store original densities for mean-reversion jitter
  const origCamDensities = useRef(initialCameras.map(c => c.density));
  const origZonePcts = useRef(initialZones.map(z => z.pct));

  // Camera density jitter every 4s — balanced around original values
  useEffect(() => {
    const iv = setInterval(() => {
      setCameras(prev => {
        const nextCams = prev.map((c, i) => {
          const origin = origCamDensities.current[i] ?? c.density;
          const pull = (origin - c.density) * 0.15;
          const noise = (Math.random() - 0.5) * 6;
          const density = Math.min(99, Math.max(5, Math.round(c.density + pull + noise)));
          const persons = Math.round(density * 0.65);
          let status: Camera['status'] = 'ok';
          if (density > 85) status = 'crit';
          else if (density > 60) status = 'warn';
          return { ...c, density, persons, status };
        });
        if (db) set(ref(db, 'live/cameras'), nextCams);
        return nextCams;
      });

      // Zone bar jitter — also mean-reverting
      setZones(prev => {
        const nextZones = prev.map((z, i) => {
          const origin = origZonePcts.current[i] ?? z.pct;
          const pull = (origin - z.pct) * 0.12;
          const noise = (Math.random() - 0.5) * 4;
          const nd = Math.min(99, Math.max(5, Math.round(z.pct + pull + noise)));
          const col = nd > 85 ? '#ef4444' : nd > 60 ? '#f59e0b' : '#22c55e';
          return { ...z, pct: nd, col };
        });
        if (db) set(ref(db, 'live/zones'), nextZones);
        return nextZones;
      });
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const addAlert = useCallback((a: AlertItem) => {
    setAlerts(prev => [a, ...prev]);
  }, []);

  const postTeamMessage = useCallback((text: string) => {
    const idx = teamCount.current;
    const col = teamColors[idx % teamColors.length];
    const msg: TeamMessage = {
      init: 'YO', col, name: 'You', text, ai: 'Gemini processing…',
    };
    setTeamMessages(prev => [...prev, msg]);
    setTimeout(() => {
      setTeamMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.ai === 'Gemini processing…') {
          copy[copy.length - 1] = { ...last, ai: teamAIResponses[idx % teamAIResponses.length] };
        }
        return copy;
      });
    }, 1300);
    teamCount.current++;
  }, []);

  const sendAdminChat = useCallback((text: string) => {
    setAdminChatMsgs(prev => [...prev, { text, isUser: true, time: 'just now' }]);
    setAdminChatMsgs(prev => [...prev, { text: '…', isUser: false, time: 'typing' }]);
    getGeminiResponse(text, 'admin').then(reply => {
      setAdminChatMsgs(prev => {
        const copy = prev.filter(m => m.time !== 'typing');
        copy.push({ text: reply, isUser: false, time: 'just now' });
        return copy;
      });
    });
  }, []);

  const sendAttChat = useCallback((text: string) => {
    setAttChatMsgs(prev => [...prev, { text, isUser: true, time: 'just now' }]);
    setAttChatMsgs(prev => [...prev, { text: '…', isUser: false, time: 'typing' }]);
    getGeminiResponse(text, 'attendee').then(reply => {
      setAttChatMsgs(prev => {
        const copy = prev.filter(m => m.time !== 'typing');
        copy.push({ text: reply, isUser: false, time: 'just now' });
        return copy;
      });
    });
  }, []);

  const deleteCamera = useCallback((i: number) => {
    setCameras(prev => prev.filter((_, idx) => idx !== i));
    setSelectedCam(prev => {
      if (prev === i) return null;
      if (prev !== null && prev > i) return prev - 1;
      return prev;
    });
  }, []);

  const addCamera = useCallback((name: string, zone: string, status: 'crit' | 'warn' | 'ok', density: number) => {
    const vel = density > 75 ? 'High' : density > 50 ? 'Medium' : 'Low';
    const newCam: Camera = {
      id: 'CAM-' + String(camCounter.current).padStart(2, '0'),
      name: name || 'New Camera',
      zone, status, density,
      persons: Math.round(density * 0.7),
      vel,
      surge: status === 'crit' ? 'CRITICAL' : status === 'warn' ? 'HIGH' : 'NORMAL',
      ai: 'Gemini AI initializing analysis for this feed…',
    };
    setCameras(prev => [...prev, newCam]);
    camCounter.current++;
  }, []);

  return (
    <VenueContext.Provider value={{
      mode, setMode, activePage, setActivePage, config, setConfig,
      cameras, setCameras, selectedCam, setSelectedCam,
      alerts, addAlert, teamMessages, postTeamMessage,
      adminChat: adminChatMsgs, sendAdminChat,
      attChat: attChatMsgs, sendAttChat,
      arrived, reroutes, incidents, setIncidents,
      zones, clock, camCounter, deleteCamera, addCamera,
      settingsOpen, setSettingsOpen, addCamOpen, setAddCamOpen,
    }}>
      {children}
    </VenueContext.Provider>
  );
};
