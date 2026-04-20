import { useState } from 'react';
import { useVenue } from '../../context/VenueContext';
import { statusColors, statusLabels, statusTagClass } from '../../data';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

/* ── SVG-based instant venue map ── */
const svgMapStyles = `
  @keyframes pulse-crit { 0%,100%{ opacity:.22 } 50%{ opacity:.38 } }
  @keyframes pulse-warn { 0%,100%{ opacity:.14 } 50%{ opacity:.26 } }
  .zone-shape { cursor: pointer; transition: filter .2s, opacity .2s; }
  .zone-shape:hover { filter: brightness(1.4); }
  .zone-label { pointer-events: none; font-family: Inter, sans-serif; }
  .flow-arrow { animation: flowMove 2s linear infinite; }
  @keyframes flowMove { 0%{ stroke-dashoffset:24 } 100%{ stroke-dashoffset:0 } }
`;

interface ZoneInfo {
  id: string; name: string; pct: number; status: string;
  desc: string; surge: string; col: string;
  // SVG path or ellipse data
  cx: number; cy: number; rx: number; ry: number;
  labelX: number; labelY: number;
}

const ZONES: ZoneInfo[] = [
  { id:'north', name:'North Stand', pct:91, status:'CRITICAL', desc:'Surge detected. Gate A restricted. AI rerouting to East & West gates.', surge:'87%', col:'#ef4444', cx:400, cy:95, rx:160, ry:50, labelX:400, labelY:95 },
  { id:'south', name:'South Stand', pct:68, status:'MODERATE', desc:'Steady. Half-time food surge predicted in 8 min.', surge:'42%', col:'#f59e0b', cx:400, cy:345, rx:160, ry:50, labelX:400, labelY:345 },
  { id:'east',  name:'East Stand',  pct:38, status:'NORMAL', desc:'Comfortable. Accepting overflow. No action needed.', surge:'12%', col:'#22c55e', cx:620, cy:220, rx:50, ry:100, labelX:620, labelY:220 },
  { id:'west',  name:'West Stand',  pct:72, status:'HIGH', desc:'Elevated. Directing overflow to East Stand via concourse B.', surge:'54%', col:'#f59e0b', cx:180, cy:220, rx:50, ry:100, labelX:180, labelY:220 },
  { id:'food',  name:'Food Court',  pct:82, status:'HIGH', desc:'Half-time surge imminent. Open backup stalls B3–B6 now.', surge:'78%', col:'#f59e0b', cx:140, cy:90, rx:42, ry:30, labelX:140, labelY:90 },
  { id:'vip',   name:'VIP Lounge',  pct:40, status:'NORMAL', desc:'Clear. All VIP lanes operating smoothly.', surge:'15%', col:'#22c55e', cx:660, cy:90, rx:42, ry:30, labelX:660, labelY:90 },
];

const GATES = [
  { id:'A', label:'Gate A', x:400, y:42, status:'RESTRICTED', col:'#ef4444' },
  { id:'B', label:'Gate B', x:130, y:220, status:'OPEN', col:'#22c55e' },
  { id:'C', label:'Gate C', x:400, y:398, status:'OPEN', col:'#22c55e' },
  { id:'D', label:'Gate D', x:670, y:220, status:'OPEN', col:'#22c55e' },
];

export default function CrowdMapPage() {
  const { cameras, zones: liveZones, selectedCam, setSelectedCam, deleteCamera, setAddCamOpen, config, clock } = useVenue();
  const [overlays, setOverlays] = useState({ heatmap: true, ai: true, flow: true, gates: true });
  const [viewMode, setViewMode] = useState<'indoor'|'external'>('indoor');
  const [zoneDetail, setZoneDetail] = useState<{name:string;pct:string;status:string;desc:string;surge:string}|null>(null);
  const [hoveredZone, setHoveredZone] = useState<string|null>(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const tgl = (key: keyof typeof overlays) => setOverlays(p => ({ ...p, [key]: !p[key] }));

  // Merge live density data with zone layout
  const mergedZones = ZONES.map(z => {
    const live = liveZones.find(lz => lz.name === z.name);
    if (live) {
      const pct = live.pct;
      const status = pct > 85 ? 'CRITICAL' : pct > 65 ? 'HIGH' : pct > 50 ? 'MODERATE' : 'NORMAL';
      const col = pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#22c55e';
      return { ...z, pct, status, col };
    }
    return z;
  });

  const zoneClick = (z: ZoneInfo) => {
    setZoneDetail({ name: z.name, pct: z.pct + '%', status: z.status, desc: z.desc, surge: z.surge });
  };

  const cam = selectedCam !== null ? cameras[selectedCam] : null;

  const statusCols: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MODERATE: '#f59e0b', NORMAL: '#22c55e' };
  const tagCls: Record<string, string> = { CRITICAL: 'tag-r', HIGH: 'tag-a', MODERATE: 'tag-a', NORMAL: 'tag-g' };

  return (
    <div id="page-crowd" role="tabpanel" aria-label="Crowd Map Page">
      <style>{svgMapStyles}</style>
      <h1 className="pg-title">Crowd Movement Map</h1>
      <p className="pg-sub">AI venue heatmap with live density · Click zones for details · Camera feeds below</p>

      {/* MAP */}
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--brd)', borderRadius: 'var(--rad)', overflow: 'hidden', marginBottom: 14 }}>
        {/* Overlay toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderBottom: '1px solid var(--brd)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--brd)', borderRadius: 20, padding: 2, marginRight: 16 }}>
            <button onClick={() => setViewMode('indoor')} style={{ padding: '4px 12px', fontSize: 11, borderRadius: 18, background: viewMode === 'indoor' ? '#2563eb' : 'transparent', color: viewMode === 'indoor' ? '#fff' : 'var(--t3)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Indoor SVG Map</button>
            <button onClick={() => setViewMode('external')} style={{ padding: '4px 12px', fontSize: 11, borderRadius: 18, background: viewMode === 'external' ? '#2563eb' : 'transparent', color: viewMode === 'external' ? '#fff' : 'var(--t3)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Live Google Maps (External)</button>
          </div>

          <span style={{ fontSize: 11, color: 'var(--t3)', display: viewMode === 'indoor' ? 'block' : 'none' }}>Overlays:</span>
          <button className={`map-btn${overlays.heatmap ? ' on' : ''}`} onClick={() => tgl('heatmap')} style={{ display: viewMode === 'indoor' ? 'block' : 'none' }}>Heatmap</button>
          <button className={`map-btn${overlays.ai ? ' on' : ''}`} onClick={() => tgl('ai')} style={{ display: viewMode === 'indoor' ? 'block' : 'none' }}>AI Tags</button>
          <button className={`map-btn${overlays.flow ? ' on' : ''}`} onClick={() => tgl('flow')} style={{ display: viewMode === 'indoor' ? 'block' : 'none' }}>Flow Arrows</button>
          <button className={`map-btn${overlays.gates ? ' on' : ''}`} onClick={() => tgl('gates')} style={{ display: viewMode === 'indoor' ? 'block' : 'none' }}>Gates</button>
          <div style={{ flex: 1 }}></div>
          <button className="map-btn" onClick={() => setZoneDetail(null)} style={{ color: 'var(--t3)' }}>Reset</button>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>Click zone for details · {config.name}</span>
        </div>

        {/* SVG Venue Map — instant load, no tiles */}
        <div style={{ height: 420, width: '100%', background: '#060a12', position: 'relative', overflow: 'hidden', display: 'flex' }}>
          
          {/* Left panel: The Map */}
          <div style={{ flex: '1', position: 'relative' }}>
          
            {viewMode === 'external' ? (
              <div style={{ width: '100%', height: '100%' }}>
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                  <Map
                    defaultZoom={14.5}
                    defaultCenter={{ lat: 28.6139, lng: 77.2090 }} /* Coordinates for central stadium / arena representation */
                    mapId="DEMO_MAP_ID"
                    disableDefaultUI={true}
                  >
                    {/* Main Stadium Pin */}
                    <AdvancedMarker position={{ lat: 28.6139, lng: 77.2090 }}>
                      <div style={{ background: '#0ea5e9', border: '2px solid #fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>🏟️</div>
                    </AdvancedMarker>
                    
                    {/* Simulated Live Traffic & Surge markers */}
                    <AdvancedMarker position={{ lat: 28.6155, lng: 77.2105 }}>
                      <div style={{ background: 'rgba(239, 68, 68, 0.95)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid #7f1d1d', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)' }}>
                        ⚠️ North Approach Surge (87% Density)
                      </div>
                    </AdvancedMarker>

                    <AdvancedMarker position={{ lat: 28.6110, lng: 77.2050 }}>
                      <div style={{ background: 'rgba(34, 197, 94, 0.95)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid #14532d', boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)' }}>
                        ✅ Gate C Apparent Clear (35%)
                      </div>
                    </AdvancedMarker>

                    <AdvancedMarker position={{ lat: 28.6135, lng: 77.2135 }}>
                      <div style={{ background: 'rgba(245, 158, 11, 0.95)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid #78350f', boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)' }}>
                        🚕 Metro Station Queue (~4,200 wait)
                      </div>
                    </AdvancedMarker>
                    
                    {/* 1-2 KM Radius Crowd Estimates */}
                    <AdvancedMarker position={{ lat: 28.6220, lng: 77.2090 }}>
                      <div style={{ background: 'rgba(96, 165, 250, 0.95)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, border: '1px solid #1e3a8a', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                        🚶‍♂️ 1.2k arriving (1km North)
                      </div>
                    </AdvancedMarker>
                    
                    <AdvancedMarker position={{ lat: 28.6130, lng: 77.2250 }}>
                      <div style={{ background: 'rgba(96, 165, 250, 0.95)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, border: '1px solid #1e3a8a', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                        🚶‍♀️ 850 arriving (1.5km East)
                      </div>
                    </AdvancedMarker>

                    <AdvancedMarker position={{ lat: 28.6010, lng: 77.2050 }}>
                      <div style={{ background: 'rgba(239, 68, 68, 0.95)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, border: '1px solid #7f1d1d', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                        🚗 Heavy Traffic (2km South)
                      </div>
                    </AdvancedMarker>

                  </Map>
                </APIProvider>
                <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(15, 23, 42, 0.8)', padding: '6px 12px', borderRadius: 4, backdropFilter: 'blur(4px)', border: '1px solid var(--brd)', fontSize: 11, color: '#e2e8f0' }}>
                  Live maps rendering via <strong>@vis.gl/react-google-maps</strong>
                </div>
              </div>
            ) : (
            <svg viewBox="0 0 800 440" width="100%" height="100%" style={{ display: 'block' }}>
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f1724" strokeWidth="0.5"/>
                </pattern>
                <radialGradient id="fieldGlow">
                  <stop offset="0%" stopColor="#0a2a1a" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <rect width="800" height="440" fill="url(#grid)"/>

              {/* Stadium outline */}
              <ellipse cx="400" cy="220" rx="280" ry="180" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="6,3"/>
              <ellipse cx="400" cy="220" rx="240" ry="150" fill="none" stroke="#1e293b" strokeWidth="1"/>

              {/* Playing field */}
              <ellipse cx="400" cy="220" rx="120" ry="75" fill="url(#fieldGlow)" stroke="#16a34a" strokeWidth="1.5" opacity="0.7"/>
              <line x1="400" y1="145" x2="400" y2="295" stroke="#16a34a" strokeWidth="0.5" opacity="0.4"/>
              <ellipse cx="400" cy="220" rx="25" ry="16" fill="none" stroke="#16a34a" strokeWidth="0.5" opacity="0.4"/>
              <text x="400" y="224" textAnchor="middle" fill="#22c55e" fontSize="10" opacity="0.5" className="zone-label">PITCH</text>

              {/* Zone heatmap fills */}
              {overlays.heatmap && mergedZones.map(z => (
                <ellipse
                  key={z.id}
                  className="zone-shape"
                  cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry}
                  fill={z.col}
                  opacity={hoveredZone === z.id ? 0.45 : z.status === 'CRITICAL' ? 0.28 : z.status === 'HIGH' ? 0.18 : 0.12}
                  stroke={z.col}
                  strokeWidth={hoveredZone === z.id ? 2 : 1}
                  strokeDasharray={z.status === 'CRITICAL' ? '0' : '5,5'}
                  onClick={() => zoneClick(z)}
                  onMouseEnter={() => setHoveredZone(z.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  style={z.status === 'CRITICAL' ? { animation: 'pulse-crit 2s ease-in-out infinite' } : z.status === 'HIGH' ? { animation: 'pulse-warn 3s ease-in-out infinite' } : {}}
                />
              ))}

              {/* Zone labels */}
              {mergedZones.map(z => (
                <g key={z.id + '-lbl'} className="zone-label" onClick={() => zoneClick(z)} style={{ cursor: 'pointer' }}>
                  <text x={z.labelX} y={z.labelY - 10} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600">{z.name}</text>
                  <text x={z.labelX} y={z.labelY + 6} textAnchor="middle" fill={z.col} fontSize="13" fontWeight="700">{z.pct}%</text>
                </g>
              ))}

              {/* AI tags */}
              {overlays.ai && mergedZones.map(z => {
                if (z.status !== 'CRITICAL' && z.status !== 'HIGH') return null;
                const tagBg = z.status === 'CRITICAL' ? '#1a0808' : '#1a1408';
                const tagBrd = z.status === 'CRITICAL' ? '#7f1d1d' : '#78350f';
                const tagCol = z.status === 'CRITICAL' ? '#f87171' : '#fde68a';
                const label = z.status === 'CRITICAL' ? `SURGE ${z.surge}` : `DENSITY ${z.pct}%`;
                return (
                  <g key={z.id + '-ai'}>
                    <rect x={z.labelX - 38} y={z.labelY + 14} width="76" height="18" rx="3" fill={tagBg} stroke={tagBrd} strokeWidth="1"/>
                    <text x={z.labelX} y={z.labelY + 27} textAnchor="middle" fill={tagCol} fontSize="8" fontWeight="600" className="zone-label">{label}</text>
                  </g>
                );
              })}

              {/* Flow arrows showing crowd movement */}
              {overlays.flow && (
                <>
                  {/* North → East reroute */}
                  <path d="M 420,130 Q 530,150 580,190" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="6,6" className="flow-arrow" opacity="0.5"/>
                  <polygon points="577,185 585,192 574,193" fill="#60a5fa" opacity="0.5"/>
                  {/* North → West */}
                  <path d="M 380,130 Q 270,150 220,190" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="6,6" className="flow-arrow" opacity="0.5"/>
                  <polygon points="223,185 215,192 226,193" fill="#60a5fa" opacity="0.5"/>
                  {/* Gate A restricted indicator */}
                  <line x1="355" y1="48" x2="445" y2="48" stroke="#ef4444" strokeWidth="2.5" opacity="0.6"/>
                </>
              )}

              {/* Gates */}
              {overlays.gates && GATES.map(g => (
                <g key={g.id}>
                  <rect x={g.x - 22} y={g.y - 10} width="44" height="20" rx="4" fill={g.col + '20'} stroke={g.col} strokeWidth="1"/>
                  <text x={g.x} y={g.y + 4} textAnchor="middle" fill={g.col} fontSize="9" fontWeight="600" className="zone-label">{g.label}</text>
                  {g.status === 'RESTRICTED' && (
                    <text x={g.x} y={g.y + 18} textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="500" className="zone-label">RESTRICTED</text>
                  )}
                </g>
              ))}

              {/* Camera dots */}
              {cameras.slice(0, 6).map((c, i) => {
                const positions = [
                  [370, 72], [430, 82], [350, 310], [600, 205], [210, 205], [380, 350]
                ];
                const [px, py] = positions[i] || [400, 220];
                return (
                  <g key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCam(i)}>
                    <circle cx={px} cy={py} r="4" fill={statusColors[c.status]} opacity="0.9"/>
                    <circle cx={px} cy={py} r="7" fill="none" stroke={statusColors[c.status]} strokeWidth="0.8" opacity="0.5"/>
                  </g>
                );
              })}

              {/* Updated timestamp */}
              <text x="790" y="430" textAnchor="end" fill="#475569" fontSize="9" className="zone-label">Live · Updated {clock}</text>
              <text x="10" y="430" fill="#475569" fontSize="9" className="zone-label">{config.name} · AI Crowd Intelligence</text>
            </svg>
            )}
          </div>

          {/* Right panel: Live Predictions Graph */}
          <div style={{ width: '320px', borderLeft: '1px solid var(--brd)', background: 'var(--bg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 13, color: '#e2e8f0', margin: '0 0 16px 0', borderBottom: '1px solid var(--bbrd)', paddingBottom: 10 }}>Gemini Predictive Flow</h3>
            
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span>Live Trajectory</span>
              <span style={{ color: '#60a5fa' }}>+18% Surge</span>
            </div>

            <div style={{ height: 120, width: '100%', position: 'relative', borderBottom: '1px solid var(--brd)', borderLeft: '1px solid var(--brd)' }}>
              <svg viewBox="0 0 300 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <line x1="0" y1="30" x2="300" y2="30" stroke="var(--brd)" strokeDasharray="2 2" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="var(--brd)" strokeDasharray="2 2" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="var(--brd)" strokeDasharray="2 2" />

                {/* Predicted Path */}
                <path d="M 150,50 L 220,20 L 300,40" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 150,50 L 220,20 L 300,40 L 300,120 L 150,120 Z" fill="rgba(96, 165, 250, 0.1)" />

                {/* Actual Path */}
                <path d="M 0,90 L 75,70 L 150,50" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                <path d="M 0,90 L 75,70 L 150,50 L 150,120 L 0,120 Z" fill="rgba(59, 130, 246, 0.2)" />
                
                {/* Now point */}
                <circle cx="150" cy="50" r="4" fill="#fff" stroke="#3b82f6" strokeWidth="2" style={{ animation: 'pulse 2s infinite' }} />
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginTop: 8 }}>
              <span>-30m</span>
              <span style={{ fontWeight: 'bold', color: '#cbd5e1' }}>Now</span>
              <span>+30m</span>
            </div>

            <div style={{ marginTop: 'auto', background: 'var(--gdim)', borderLeft: '2px solid #16a34a', padding: 12, borderRadius: 4, fontSize: 11, color: '#4ade80', lineHeight: 1.5 }}>
              <strong>AI Insight:</strong> Crowd momentum shifting away from North Stand. Directing flow towards East gates will stabilize density within 14 mins.
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '9px 16px', borderTop: '1px solid var(--brd)', fontSize: 11, color: 'var(--t3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>Critical &gt;85%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>High 65–85%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>Normal &lt;65%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }}></span>AI Reroute</span>
          <span style={{ marginLeft: 'auto' }}>Updated: <span style={{ color: 'var(--t2)' }}>{clock}</span></span>
        </div>
      </div>

      {/* Zone Detail Panel */}
      {zoneDetail && (
        <div className="zdp" style={{ display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>{zoneDetail.name}</div>
              <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
                <span className={`tag ${tagCls[zoneDetail.status] || 'tag-g'}`}>{zoneDetail.status}</span>
                <span className="tag tag-a">Surge risk: {zoneDetail.surge}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{zoneDetail.desc}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: statusCols[zoneDetail.status] || '#e2e8f0' }}>{zoneDetail.pct}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>occupancy</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }}>Surge risk: <span style={{ fontWeight: 500 }}>{zoneDetail.surge}</span></div>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--gdim)', borderRadius: 6, borderLeft: '2px solid #16a34a', fontSize: 12, color: '#4ade80' }}>
            <span style={{ fontWeight: 600, color: '#86efac' }}>Gemini: </span>{zoneDetail.desc}
          </div>
        </div>
      )}

      {/* Camera Management */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
        <div className="sec-lbl" style={{ margin: 0, flex: 1 }}>Live camera feeds — click to inspect · drag to reorder</div>
        <button onClick={() => setAddCamOpen(true)} style={{
          padding: '5px 14px', background: 'var(--bdim)', border: '1px solid var(--bbrd)',
          borderRadius: 20, color: '#93c5fd', fontSize: 11, cursor: 'pointer', fontWeight: 500, marginLeft: 12,
        }}>+ Add Camera</button>
      </div>

      {/* Camera Grid */}
      <div className="cam-grid-mgmt">
        {cameras.map((c, i) => (
          <div key={c.id + '-' + i} className={`cam-card-m${selectedCam === i ? ' sel' : ''}`} onClick={() => setSelectedCam(i)}>
            <div className="cam-vis">
              <svg width="100%" height="100" viewBox="0 0 180 100" preserveAspectRatio="xMidYMid slice">
                <rect width="180" height="100" fill="#050810"/>
                <line x1="0" y1="33" x2="180" y2="33" stroke="#0d1117" strokeWidth=".5"/>
                <line x1="0" y1="67" x2="180" y2="67" stroke="#0d1117" strokeWidth=".5"/>
                <line x1="60" y1="0" x2="60" y2="100" stroke="#0d1117" strokeWidth=".5"/>
                <line x1="120" y1="0" x2="120" y2="100" stroke="#0d1117" strokeWidth=".5"/>
                {c.status === 'crit' ? (<><ellipse cx="90" cy="55" rx="55" ry="40" fill="#ef4444" opacity=".14"/><ellipse cx="90" cy="55" rx="30" ry="22" fill="#ef4444" opacity=".2"/></>)
                : c.status === 'warn' ? (<><ellipse cx="90" cy="55" rx="45" ry="32" fill="#f59e0b" opacity=".13"/><ellipse cx="90" cy="55" rx="24" ry="17" fill="#f59e0b" opacity=".18"/></>)
                : (<ellipse cx="70" cy="60" rx="32" ry="24" fill="#22c55e" opacity=".11"/>)}
                <circle cx="82" cy="52" r="7" fill="none" stroke={statusColors[c.status]} strokeWidth="1.2" strokeDasharray="2 2"/>
                <text x="91" y="49" fill={statusColors[c.status]} fontSize="7" fontWeight="600">{c.density}%</text>
                <rect x="5" y="5" width="5" height="5" rx="1" fill="#ef4444"/>
                <text x="13" y="12" fill="#f87171" fontSize="7" fontWeight="600">REC</text>
              </svg>
            </div>
            <div className="cam-del-btn" onClick={(e) => { e.stopPropagation(); deleteCamera(i); }} aria-label={`Delete ${c.name}`}>×</div>
            <div className="cam-lbl-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', flex: 1 }}>
                <div className="cam-status-dot" style={{ background: statusColors[c.status] }}></div>
                <span style={{ fontSize: 10, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              </div>
              <span style={{ fontSize: 9, color: statusColors[c.status], fontWeight: 600 }}>{c.status.toUpperCase()}</span>
            </div>
          </div>
        ))}
        {/* Add button */}
        <div className="add-cam-btn" onClick={() => setAddCamOpen(true)}>
          <div className="add-icon" style={{ borderColor: '#378add', color: '#93c5fd' }}>+</div>
          <span>Add Camera</span>
        </div>
      </div>

      {/* Selected camera detail panel */}
      {cam && (
        <div className="cam-detail-panel" style={{ display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{cam.name} · {cam.zone}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className={`tag ${statusTagClass[cam.status]}`}>{statusLabels[cam.status]}</span>
              <span style={{ fontSize: 10, color: 'var(--t3)', alignSelf: 'center' }}>{cam.id}</span>
            </div>
          </div>
          <div className="grid4">
            <div className="stat" style={{ padding: '10px 12px' }}>
              <div className="sv" style={{ fontSize: 20, color: statusColors[cam.status] }}>{cam.persons}</div>
              <div className="sl">Persons detected</div>
            </div>
            <div className="stat" style={{ padding: '10px 12px' }}>
              <div className="sv" style={{ fontSize: 20, color: statusColors[cam.status] }}>{cam.density}%</div>
              <div className="sl">Zone density</div>
            </div>
            <div className="stat" style={{ padding: '10px 12px' }}>
              <div className="sv" style={{ fontSize: 20, color: cam.vel === 'High' ? '#ef4444' : cam.vel === 'Medium' ? '#f59e0b' : '#22c55e' }}>{cam.vel}</div>
              <div className="sl">Crowd velocity</div>
            </div>
            <div className="stat" style={{ padding: '10px 12px' }}>
              <div className="sv" style={{ fontSize: 20, color: statusColors[cam.status] }}>{cam.surge}</div>
              <div className="sl">AI prediction</div>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--gdim)', borderRadius: 5, borderLeft: '2px solid #16a34a', fontSize: 12, color: '#4ade80' }}>
            <span style={{ fontWeight: 600 }}>Gemini: </span>{cam.ai}
          </div>
        </div>
      )}
    </div>
  );
}
