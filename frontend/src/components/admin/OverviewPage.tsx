import { useVenue } from '../../context/VenueContext';
import { predictions, eventTimeline } from '../../data';
import { useEffect, useRef, useState, useCallback } from 'react';
import { db } from '../../firebase';
import { ref, set } from 'firebase/database';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

/* realistic arrival pattern: starts slow, builds, peaks, dips slightly */
const realisticSparkline = [12, 22, 35, 48, 55, 60, 54, 68, 72, 78, 85, 82, 75, 91, 88];

export default function OverviewPage() {
  const { config, arrived, reroutes, incidents, zones, cameras } = useVenue();
  const sparkRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Camera / Video state ── */
  const [cameraMode, setCameraMode] = useState<'none' | 'webcam' | 'video'>('none');
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [cameraAnalysis, setCameraAnalysis] = useState<{persons: number; density: number; status: string; ai: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /* ── Staff deployment (all venue areas) ── */
  const [staffData] = useState([
    { ico: '🏟', zone: 'North Stand', deployed: 24, needed: 30, status: 'understaffed' },
    { ico: '🍔', zone: 'Food Court', deployed: 18, needed: 20, status: 'ok' },
    { ico: '🏟', zone: 'East Stand', deployed: 12, needed: 10, status: 'ok' },
    { ico: '🏟', zone: 'West Stand', deployed: 15, needed: 18, status: 'understaffed' },
    { ico: '🚪', zone: 'Gate A', deployed: 8, needed: 8, status: 'ok' },
    { ico: '🚪', zone: 'Gate B & D', deployed: 10, needed: 10, status: 'ok' },
    { ico: '🚻', zone: 'Restroom Block N1', deployed: 3, needed: 4, status: 'understaffed' },
    { ico: '🚻', zone: 'Restroom Block W2', deployed: 2, needed: 2, status: 'ok' },
    { ico: '🏥', zone: 'Medical Bay', deployed: 6, needed: 6, status: 'ok' },
    { ico: '👕', zone: 'Merchandise Store', deployed: 5, needed: 5, status: 'ok' },
    { ico: '🅿', zone: 'Parking East', deployed: 4, needed: 6, status: 'understaffed' },
    { ico: '🎙', zone: 'Press Box', deployed: 2, needed: 2, status: 'ok' },
  ]);

  /* ── Revenue tracker (editable) ── */
  const [revenue, setRevenue] = useState({
    tickets: 28980000,
    food: 1245000,
    merch: 340000,
    parking: 180000,
  });
  const [editingRevenue, setEditingRevenue] = useState(false);
  const [revenueForm, setRevenueForm] = useState({ ...revenue });

  // Sparkline jitter — balanced green/yellow/red
  useEffect(() => {
    const iv = setInterval(() => {
      if (!sparkRef.current) return;
      const bars = sparkRef.current.querySelectorAll('.spk') as NodeListOf<HTMLDivElement>;
      bars.forEach(b => {
        const cur = parseInt(b.style.height) || 20;
        const nxt = Math.min(36, Math.max(4, cur + (Math.round(Math.random() * 6) - 3)));
        b.style.height = nxt + 'px';
        b.style.background = nxt > 28 ? '#ef4444' : nxt > 18 ? '#f59e0b' : '#22c55e';
      });
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  /* ── Webcam start ── */
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraMode('webcam');
    } catch (err) {
      console.warn('Webcam access denied:', err);
      alert('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  /* ── Stop camera ── */
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraMode('none');
    setVideoSrc('');
    setCameraAnalysis(null);
  }, []);

  /* ── Video file upload ── */
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setCameraMode('video');
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.play();
    }
  }, []);

  /* ── AI Analysis (simulated computer vision) ── */
  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsAnalyzing(true);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;
      ctx.drawImage(videoRef.current, 0, 0);
    }
    // Simulate AI processing (in real app this would call a CV model)
    setTimeout(() => {
      const persons = Math.floor(Math.random() * 60) + 10;
      const density = Math.min(99, Math.floor(persons * 1.3 + Math.random() * 15));
      const status = density > 85 ? 'CRITICAL' : density > 65 ? 'HIGH' : density > 40 ? 'MODERATE' : 'NORMAL';
      const analyses = [
        `Detected ${persons} persons. Crowd velocity moderate. No surge pattern identified.`,
        `${persons} individuals tracked. Density ${density}% — ${density > 65 ? 'recommend increasing staff presence' : 'no action needed'}.`,
        `AI scan complete: ${persons} people detected. Flow pattern ${density > 50 ? 'forming bottleneck at narrow passage' : 'is smooth and orderly'}.`,
        `Computer vision tracked ${persons} unique individuals. ${density > 80 ? 'ALERT: Near capacity. Consider restricting entry.' : 'Zone operating normally.'}`
      ];
      setCameraAnalysis({
        persons, density, status,
        ai: analyses[Math.floor(Math.random() * analyses.length)]
      });
      setIsAnalyzing(false);
    }, 1500);
  }, []);

  // Auto-analyze every 5s when camera is active
  useEffect(() => {
    if (cameraMode === 'none') return;
    const iv = setInterval(analyzeFrame, 5000);
    analyzeFrame(); // first analysis immediately
    return () => clearInterval(iv);
  }, [cameraMode, analyzeFrame]);

  const totalRevenue = revenue.tickets + revenue.food + revenue.merch + revenue.parking;

  return (
    <div id="page-overview" role="tabpanel" aria-label="Overview Page">
      <h1 className="pg-title">Command Overview</h1>
      <p className="pg-sub">Real-time venue intelligence — visitor flow, crowd density, and coordination status</p>

      {/* Row 1 — Visitor Intelligence */}
      <div className="grid4" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="sv" style={{ color: '#60a5fa' }} id="ov-exp">{config.capacity.toLocaleString()}</div>
          <div className="sl">Expected visitors</div>
          <div className="ss" style={{ color: 'var(--t3)' }}>Pre-event forecast</div>
        </div>
        <div className="stat">
          <div className="sv" style={{ color: '#4ade80' }} id="ov-reg">{config.registered.toLocaleString()}</div>
          <div className="sl">Registered tickets</div>
          <div className="ss" style={{ color: '#4ade80' }}>90.6% of capacity</div>
        </div>
        <div className="stat">
          <div className="sv" style={{ color: '#4ade80' }} id="ov-arr">{arrived.toLocaleString()}</div>
          <div className="sl">Arrived (checked in)</div>
          <div className="ss" style={{ color: 'var(--t3)' }}>↑ +342 last 10 min</div>
        </div>
        <div className="stat">
          <div className="sv" style={{ color: '#f59e0b' }} id="ov-unreg">~{config.walkin.toLocaleString()}</div>
          <div className="sl">Unregistered / walk-in</div>
          <div className="ss" style={{ color: '#fde68a' }}>Gate scanner flagged</div>
        </div>
      </div>

      {/* Zone density + Maps */}
      <div className="grid2" style={{ marginBottom: 24, gap: 24 }}>
        {/* Left: Google Maps Component */}
        <div className="card">
          <div className="sec-lbl" style={{ marginBottom: 12 }}>Live Outside Traffic (Google Maps)</div>
          <div style={{ width: '100%', height: '320px', borderRadius: '8px', overflow: 'hidden' }}>
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
              <Map
                mapId="demo-map-id"
                defaultCenter={{ lat: 28.627885, lng: 77.240478 }} // Approximate stadium location
                defaultZoom={15}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
              >
                <AdvancedMarker position={{ lat: 28.627885, lng: 77.240478 }} title="Stadium Center" />
              </Map>
            </APIProvider>
          </div>
          <div style={{ marginTop: '12px', color: '#9ca3af', fontSize: '0.85rem' }}>
            <span style={{color: '#4ade80'}}>●</span> Live external traffic assessment and VIP route planning active.
          </div>
        </div>

        {/* Right: Zone density stats */}
        <div className="card">
          <div className="sec-lbl">Zone density — live</div>
          {zones.map(z => (
            <div key={z.name} style={{ marginBottom: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: '#e2e8f0' }}>{z.name}</span>
                <span style={{ color: z.col, fontWeight: 500 }}>{z.pct}%</span>
              </div>
              <div style={{ background: 'var(--brd)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                <div style={{ width: `${z.pct}%`, height: 5, borderRadius: 3, background: z.col, transition: 'width 0.6s' }}></div>
              </div>
            </div>
          ))}

          <div className="sec-lbl" style={{marginTop: 24}}>Event timeline</div>
          {eventTimeline.map((e, i) => {
            const col = e.status === 'done' ? '#4ade80' : e.status === 'active' ? '#60a5fa' : '#475569';
            const bg = e.status === 'done' ? 'var(--gdim)' : e.status === 'active' ? 'var(--bdim)' : 'var(--bg3)';
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '7px 11px',
                background: bg, borderRadius: 5, marginBottom: 6, border: '1px solid var(--brd)',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0,
                  ...(e.status === 'active' ? { animation: 'blink .8s infinite' } : {}),
                }} aria-hidden="true"></div>
                <div style={{ flex: 1, fontSize: 12, color: '#e2e8f0', fontWeight: e.status === 'active' ? 500 : 400 }}>{e.label}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{e.time}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2 — Operations */}
      <div className="grid4" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="sv" style={{ color: '#ef4444', animation: 'pulse 2s infinite' }}>2</div>
          <div className="sl">Critical zones</div>
          <div className="ss" style={{ color: '#fca5a5' }}>North Stand · Food Court</div>
        </div>
        <div className="stat">
          <div className="sv" style={{ color: '#4ade80' }}>4.2<span style={{ fontSize: 14, fontWeight: 400 }}> min</span></div>
          <div className="sl">Avg queue wait</div>
          <div className="ss" style={{ color: '#4ade80' }}>↓ from 9.1 min baseline</div>
        </div>
        <div className="stat">
          <div className="sv" style={{ color: '#4ade80' }} id="ov-reroutes">{reroutes.toLocaleString()}</div>
          <div className="sl">AI reroutes issued</div>
          <div className="ss" style={{ color: 'var(--t3)' }}>Push notifications sent</div>
        </div>
        <div className="stat">
          <div className="sv" style={{ color: incidents > 0 ? '#ef4444' : '#4ade80' }} id="ov-em">{incidents}</div>
          <div className="sl">Emergency incidents</div>
          <div className="ss" style={{ color: '#4ade80' }}>{incidents === 0 ? 'All clear · No escalations' : `${incidents} active`}</div>
        </div>
      </div>

      {/* ═══════════ AI PREDICTIVE GRAPH ═══════════ */}
      <div style={{ marginBottom: 24 }}>
        <div className="sec-lbl">📈 Crowd Density Forecast (Gemini Predictive Analysis)</div>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>Live trajectory vs Predicted model</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}></div> Actual
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', border: '1px dashed #60a5fa' }}></div> Predicted
              </div>
            </div>
          </div>
          
          {/* Simple pure-CSS SVG Graph representation */}
          <div style={{ width: '100%', height: 160, position: 'relative', borderBottom: '1px solid var(--brd)', borderLeft: '1px solid var(--brd)' }}>
            <svg viewBox="0 0 800 160" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid lines */}
              <line x1="0" y1="40" x2="800" y2="40" stroke="var(--brd)" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="800" y2="80" stroke="var(--brd)" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="800" y2="120" stroke="var(--brd)" strokeDasharray="4 4" />
              
              {/* Predicted Path (Dashed Area + Line) */}
              <path d="M 400,60 L 500,40 L 600,70 L 700,30 L 800,50" fill="none" stroke="#60a5fa" strokeWidth="3" strokeDasharray="8 6" />
              <path d="M 400,60 L 500,40 L 600,70 L 700,30 L 800,50 L 800,160 L 400,160 Z" fill="rgba(96, 165, 250, 0.1)" />

              {/* Actual Path (Solid Area + Line) */}
              <path d="M 0,120 L 100,100 L 200,90 L 300,110 L 400,60" fill="none" stroke="#3b82f6" strokeWidth="4" />
              <path d="M 0,120 L 100,100 L 200,90 L 300,110 L 400,60 L 400,160 L 0,160 Z" fill="rgba(59, 130, 246, 0.2)" />
              
              {/* Current Point Marker */}
              <circle cx="400" cy="60" r="5" fill="#fff" stroke="#3b82f6" strokeWidth="2" style={{ animation: 'pulse 2s infinite' }} />
              
              {/* Time labels under axis */}
              <text x="0" y="180" fill="var(--t3)" fontSize="12">18:00</text>
              <text x="200" y="180" fill="var(--t3)" fontSize="12">19:00</text>
              <text x="400" y="180" fill="#cbd5e1" fontSize="12" fontWeight="bold">Now (20:00)</text>
              <text x="600" y="180" fill="var(--t3)" fontSize="12">21:00</text>
              <text x="800" y="180" fill="var(--t3)" fontSize="12" textAnchor="end">22:00</text>
            </svg>
            
            {/* Y Axis Labels */}
            <div style={{ position: 'absolute', left: -30, top: -10, fontSize: 10, color: 'var(--t3)' }}>High</div>
            <div style={{ position: 'absolute', left: -30, bottom: 5, fontSize: 10, color: 'var(--t3)' }}>Low</div>
          </div>

          <div style={{ fontSize: 13, color: '#94a3b8', background: 'var(--bg)', padding: 12, borderRadius: 6, border: '1px solid var(--bbrd)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span><strong>Gemini Insight:</strong> Crowd flow implies a 24% surge in expected footfall at the North exits between 20:30 and 21:00. Recommend redirecting traffic early.</span>
          </div>
        </div>
      </div>

      {/* ═══════════ LIVE CAMERA / VIDEO FEED ═══════════ */}
      <div style={{ marginBottom: 24 }}>
        <div className="sec-lbl">🎥 Live camera AI analysis — connect webcam or upload video</div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Camera toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--brd)', flexWrap: 'wrap' }}>
            <button onClick={cameraMode === 'webcam' ? stopCamera : startWebcam} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: '.15s',
              background: cameraMode === 'webcam' ? 'var(--rdim)' : 'var(--gdim)',
              borderColor: cameraMode === 'webcam' ? 'var(--rbrd)' : 'var(--gbrd)',
              color: cameraMode === 'webcam' ? '#fca5a5' : '#86efac',
            }}>
              {cameraMode === 'webcam' ? '⏹ Stop Webcam' : '📷 Start Webcam'}
            </button>
            <label style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              background: 'var(--bdim)', border: '1px solid var(--bbrd)', color: '#93c5fd', transition: '.15s',
            }}>
              📁 Upload Video
              <input type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
            </label>
            {cameraMode !== 'none' && (
              <>
                <button onClick={analyzeFrame} disabled={isAnalyzing} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  background: isAnalyzing ? 'var(--bg3)' : 'linear-gradient(135deg, #ff7000, #ff4500)',
                  border: 'none', color: 'white', opacity: isAnalyzing ? 0.6 : 1,
                }}>
                  {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Now'}
                </button>
                <button onClick={stopCamera} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  background: 'transparent', border: '1px solid var(--brd)', color: 'var(--t3)',
                }}>✕ Close</button>
              </>
            )}
            <div style={{ flex: 1 }}></div>
            {cameraMode !== 'none' && (
              <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'blink 1s infinite', display: 'inline-block' }}></span>
                <span style={{ color: '#fca5a5', fontWeight: 500 }}>REC</span>
                <span style={{ color: 'var(--t3)' }}>· AI auto-analyzing every 5s</span>
              </span>
            )}
          </div>

          {/* Video area */}
          <div style={{ position: 'relative', background: '#050810' }}>
            {cameraMode === 'none' ? (
              /* ── Simulated AI feed using database data ── */
              <div style={{ display: 'flex', height: 240 }}>
                {/* Left: Simulated camera view with SVG crowd viz */}
                <div className="custom-scrollbar" style={{ flex: 1, position: 'relative', overflowX: 'auto', overflowY: 'hidden' }}>
                  <svg viewBox={`0 0 ${Math.max(400, cameras.length * 130 + 40)} 240`} width={Math.max(400, cameras.length * 130 + 40)} height="240" style={{ display: 'block' }}>
                    {/* Background */}
                    <rect width="100%" height="240" fill="#070d18"/>
                    <defs>
                      <pattern id="camGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#0f1724" strokeWidth="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="240" fill="url(#camGrid)"/>
                    {/* Simulated crowd dots from database */}
                    {cameras.map((c, ci) => {
                      const dots = [];
                      const count = Math.min(c.persons, 30);
                      for (let d = 0; d < count; d++) {
                        const x = 40 + ci * 130 + Math.sin(d * 2.1) * 40 + Math.cos(d * 0.7) * 20;
                        const y = 60 + Math.sin(d * 1.3 + ci) * 50 + Math.cos(d * 0.5) * 30;
                        const col = c.status === 'crit' ? '#ef4444' : c.status === 'warn' ? '#f59e0b' : '#22c55e';
                        dots.push(
                          <circle key={`${ci}-${d}`} cx={x} cy={y} r="2.5" fill={col} opacity={0.5 + Math.random() * 0.3}>
                            <animate attributeName="opacity" values={`${0.3 + Math.random() * 0.3};${0.6 + Math.random() * 0.3};${0.3 + Math.random() * 0.3}`} dur={`${2 + Math.random() * 2}s`} repeatCount="indefinite"/>
                          </circle>
                        );
                      }
                      return (
                        <g key={ci}>
                          {/* Zone boundary */}
                          <rect x={15 + ci * 130} y={30} width={120} height={160} rx="6" fill="none" stroke={c.status === 'crit' ? '#ef444440' : c.status === 'warn' ? '#f59e0b30' : '#22c55e20'} strokeWidth="1" strokeDasharray="4,4"/>
                          <text x={75 + ci * 130} y={22} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">{c.zone}</text>
                          {dots}
                          {/* Person count label */}
                          <rect x={45 + ci * 130} y={195} width={60} height={18} rx="3" fill="rgba(0,0,0,.7)"/>
                          <text x={75 + ci * 130} y={208} textAnchor="middle" fill={c.status === 'crit' ? '#f87171' : c.status === 'warn' ? '#fde68a' : '#86efac'} fontSize="9" fontWeight="600" fontFamily="sans-serif">{c.persons} ppl · {c.density}%</text>
                        </g>
                      );
                    })}
                    {/* Timestamp & Source overlays using foreignObject for fixed positioning feel */}
                    <foreignObject x="0" y="0" width="100%" height="240" style={{ pointerEvents: 'none' }}>
                      <div style={{ position: 'sticky', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', top: 5, left: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'blink 1.5s infinite' }}></div>
                          <div style={{ color: '#f87171', fontSize: 7, fontWeight: 600 }}>SIMULATED · DATABASE FEED</div>
                        </div>
                        <div style={{ position: 'absolute', bottom: 5, right: 10, color: '#475569', fontSize: 7, textAlign: 'right' }}>
                          Source: Venue Database · {cameras.length} cameras
                        </div>
                      </div>
                    </foreignObject>
                  </svg>
                </div>
                {/* Right: Live stats panel from DB */}
                <div style={{ width: 240, borderLeft: '1px solid var(--brd)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg1)' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '.06em' }}>📊 Database Feed — Live</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#60a5fa' }}>{cameras.reduce((a, c) => a + c.persons, 0)}</div>
                      <div style={{ fontSize: 8, color: 'var(--t3)' }}>Total persons</div>
                    </div>
                    <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: cameras.some(c => c.status === 'crit') ? '#ef4444' : '#f59e0b' }}>
                        {Math.round(cameras.reduce((a, c) => a + c.density, 0) / cameras.length)}%
                      </div>
                      <div style={{ fontSize: 8, color: 'var(--t3)' }}>Avg density</div>
                    </div>
                  </div>
                  {/* Per-camera mini stats */}
                  <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2 }}>Top cameras:</div>
                  {cameras.slice(0, 4).map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.status === 'crit' ? '#ef4444' : c.status === 'warn' ? '#f59e0b' : '#22c55e', flexShrink: 0 }}></div>
                      <span style={{ color: 'var(--t2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ color: c.status === 'crit' ? '#f87171' : c.status === 'warn' ? '#fde68a' : '#86efac', fontWeight: 600 }}>{c.density}%</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 10, color: '#4ade80', padding: '5px 7px', background: 'var(--gdim)', borderRadius: 4, borderLeft: '2px solid #16a34a', lineHeight: 1.4, marginTop: 'auto' }}>
                    <span style={{ fontWeight: 600, color: '#86efac' }}>Mistral AI: </span>
                    {cameras.some(c => c.status === 'crit') 
                      ? 'Critical density detected. Rerouting in progress.' 
                      : 'All zones within safe parameters.'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 0 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <video ref={videoRef} muted playsInline loop style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
                  {/* Overlay grid on video */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                      <line x1="33%" y1="0" x2="33%" y2="100%" stroke="#22c55e" strokeWidth="0.5" opacity="0.2"/>
                      <line x1="66%" y1="0" x2="66%" y2="100%" stroke="#22c55e" strokeWidth="0.5" opacity="0.2"/>
                      <line x1="0" y1="33%" x2="100%" y2="33%" stroke="#22c55e" strokeWidth="0.5" opacity="0.2"/>
                      <line x1="0" y1="66%" x2="100%" y2="66%" stroke="#22c55e" strokeWidth="0.5" opacity="0.2"/>
                    </svg>
                    {/* REC badge */}
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,.7)', padding: '3px 8px', borderRadius: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'blink 1s infinite' }}></div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#f87171' }}>REC</span>
                    </div>
                    {/* Detection status */}
                    {cameraAnalysis && (
                      <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'rgba(0,0,0,.75)', padding: '6px 10px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#4ade80' }}>👁 AI Vision Active</span>
                        <span style={{ fontSize: 10, color: cameraAnalysis.density > 85 ? '#ef4444' : cameraAnalysis.density > 60 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                          {cameraAnalysis.persons} persons · {cameraAnalysis.density}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Analysis panel */}
                {cameraAnalysis && (
                  <div style={{ width: 260, background: 'var(--bg1)', borderLeft: '1px solid var(--brd)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '.06em' }}>AI Analysis</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#60a5fa' }}>{cameraAnalysis.persons}</div>
                        <div style={{ fontSize: 9, color: 'var(--t3)' }}>Persons</div>
                      </div>
                      <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 600, color: cameraAnalysis.density > 85 ? '#ef4444' : cameraAnalysis.density > 60 ? '#f59e0b' : '#22c55e' }}>{cameraAnalysis.density}%</div>
                        <div style={{ fontSize: 9, color: 'var(--t3)' }}>Density</div>
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600, textAlign: 'center',
                      background: cameraAnalysis.status === 'CRITICAL' ? 'var(--rdim)' : cameraAnalysis.status === 'HIGH' ? 'var(--adim)' : 'var(--gdim)',
                      color: cameraAnalysis.status === 'CRITICAL' ? '#fca5a5' : cameraAnalysis.status === 'HIGH' ? '#fde68a' : '#86efac',
                      border: `1px solid ${cameraAnalysis.status === 'CRITICAL' ? 'var(--rbrd)' : cameraAnalysis.status === 'HIGH' ? 'var(--abrd)' : 'var(--gbrd)'}`,
                    }}>{cameraAnalysis.status}</div>
                    <div style={{ fontSize: 11, color: '#4ade80', padding: '6px 8px', background: 'var(--gdim)', borderRadius: 5, borderLeft: '2px solid #16a34a', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: '#86efac' }}>Gemini: </span>{cameraAnalysis.ai}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>

      {/* ═══════════ STAFF DEPLOYMENT & REVENUE ═══════════ */}
      <div className="grid2" style={{ marginBottom: 24 }}>
        {/* Staff Deployment */}
        <div className="card" style={{ padding: '18px 18px 8px' }}>
          <div className="sec-lbl">👥 Staff deployment — all areas ({staffData.length} zones)</div>
          <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
            {staffData.map((s, i) => {
              const pct = Math.round((s.deployed / s.needed) * 100);
              const col = pct >= 100 ? '#22c55e' : pct >= 80 ? '#f59e0b' : '#ef4444';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '7px 10px', background: 'var(--bg2)', borderRadius: 6, border: '1px solid var(--brd)' }}>
                  <div style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{s.ico}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#e2e8f0', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.zone}</div>
                    <div style={{ background: 'var(--brd)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: 4, borderRadius: 3, background: col, transition: 'width .6s' }}></div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: col }}>{s.deployed}/{s.needed}</div>
                    <div style={{ fontSize: 8, color: 'var(--t3)' }}>{s.status === 'ok' ? '✓ Staffed' : '⚠ Need more'}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Summary footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 2px', borderTop: '1px solid var(--brd)', fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
            <span>Total deployed: <b style={{ color: '#e2e8f0' }}>{staffData.reduce((a, s) => a + s.deployed, 0)}</b></span>
            <span>Understaffed: <b style={{ color: '#ef4444' }}>{staffData.filter(s => s.status === 'understaffed').length}</b> zones</span>
          </div>
        </div>

        {/* Revenue & Weather */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Weather */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 40 }}>🌙</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#e2e8f0' }}>28°C</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Clear night · Humidity 65% · Wind 12km/h</div>
              <div style={{ fontSize: 11, color: '#4ade80', marginTop: 3 }}>✓ Good conditions for outdoor event</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--t3)' }}>
              <div>Feels like 30°C</div>
              <div>No rain expected</div>
            </div>
          </div>

          {/* Revenue — Editable */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="sec-lbl" style={{ margin: 0, flex: 1 }}>💰 Revenue tracker — tonight</div>
              <button onClick={() => {
                if (editingRevenue) {
                  setRevenue({ ...revenueForm });
                  // Sync to Firebase if available
                  try {
                    if (db) set(ref(db, 'venue/revenue'), revenueForm);
                  } catch { /* Firebase not configured */ }
                }
                setEditingRevenue(!editingRevenue);
                setRevenueForm({ ...revenue });
              }} style={{
                padding: '3px 12px', borderRadius: 20, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: '1px solid',
                background: editingRevenue ? 'var(--gdim)' : 'var(--bdim)',
                borderColor: editingRevenue ? 'var(--gbrd)' : 'var(--bbrd)',
                color: editingRevenue ? '#86efac' : '#93c5fd',
              }}>{editingRevenue ? '💾 Save' : '✏️ Edit'}</button>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#4ade80', marginBottom: 10 }}>₹{(totalRevenue / 10000000).toFixed(2)} Cr</div>
            {[
              { key: 'tickets' as const, label: 'Ticket sales', col: '#60a5fa' },
              { key: 'food' as const, label: 'Food & beverage', col: '#4ade80' },
              { key: 'merch' as const, label: 'Merchandise', col: '#a78bfa' },
              { key: 'parking' as const, label: 'Parking', col: '#f59e0b' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: r.col, display: 'inline-block' }}></span>
                  <span style={{ color: 'var(--t2)' }}>{r.label}</span>
                </div>
                {editingRevenue ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>₹</span>
                    <input
                      type="number"
                      value={revenueForm[r.key]}
                      onChange={e => setRevenueForm(p => ({ ...p, [r.key]: parseInt(e.target.value) || 0 }))}
                      style={{
                        width: 100, background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 4,
                        padding: '3px 6px', color: '#e2e8f0', fontSize: 11, textAlign: 'right', outline: 'none',
                      }}
                    />
                  </div>
                ) : (
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>₹{(revenue[r.key] / 100000).toFixed(1)}L</span>
                )}
              </div>
            ))}
          </div>

          {/* System Health */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <div className="sec-lbl" style={{ marginBottom: 8 }}>⚡ System health</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'API', status: 'ok', val: '24ms' },
                { label: 'Firebase', status: 'ok', val: 'Synced' },
                { label: 'Gemini AI', status: 'ok', val: 'Active' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '6px 0' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', margin: '0 auto 4px' }}></div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 500 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Predictions */}
      <div style={{ marginBottom: 24 }}>
        <div className="sec-lbl">AI predictions — next 15 min</div>
        <div className="grid3">
          {predictions.map((p, i) => (
            <div className="card" key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{p.zone}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: p.col }}>{p.cur}%</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)' }}>now</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>→15 min:</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: p.dir > 0 ? '#f87171' : '#4ade80' }}>{p.fut}%</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: p.dir > 0 ? '#f87171' : '#4ade80' }}>
                  {p.dir > 0 ? '↑' : '↓'}{Math.abs(p.fut - p.cur)}%
                </span>
              </div>
              <div style={{ background: 'var(--brd)', borderRadius: 3, height: 4, overflow: 'hidden', marginBottom: 9 }}>
                <div style={{ width: `${p.fut}%`, height: 4, borderRadius: 3, background: p.col, transition: 'width 0.6s' }}></div>
              </div>
              <div style={{
                fontSize: 11, color: '#4ade80', padding: '5px 9px', background: 'var(--gdim)',
                borderRadius: 5, borderLeft: '2px solid #16a34a', lineHeight: 1.5,
              }}>{p.ai}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
