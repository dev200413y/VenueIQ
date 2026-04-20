import { useState, useRef, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import { attendeeRouteSteps, attendeeQuickInfo, attendeeSchedule, announcements } from '../../data';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

export default function AttendeePanel() {
  const { config, attChat, sendAttChat, addAlert } = useVenue();
  const [chatInput, setChatInput] = useState('');
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportType, setReportType] = useState('Crowd / Safety concern');
  const [reportSent, setReportSent] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [attChat]);

  const sendChat = () => {
    const v = chatInput.trim();
    if (!v) return;
    sendAttChat(v);
    setChatInput('');
  };

  const submitFeedback = () => {
    setReportSent(true);
    addAlert({
      type: 'info',
      title: `Attendee report: ${reportType}`,
      body: reportText || 'No description provided',
      time: 'Just now · From attendee app',
    });
  };

  const chips = [
    { label: 'Nearest restroom', q: 'Where is the nearest restroom?' },
    { label: 'Best food stall', q: 'Best food stall right now?' },
    { label: 'Guide to seat', q: 'Guide me to my seat' },
    { label: 'Half-time plan', q: 'What should I do at half-time?' },
    { label: 'Exit safety', q: 'Is it safe to exit North now?' },
  ];

  return (
    <div className="att-page" role="main" aria-label="Attendee View">
      {/* Hero */}
      <div className="att-hero">
        <div>
          <div className="att-welcome" id="att-venue-name">{config.name}</div>
          <div className="att-sub" id="att-event-name">{config.event} · Your seat: N-Block Row 12 Seat 34</div>
        </div>
        <div className="att-ticket">
          <div className="att-ticket-icon">🎫</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0' }}>Ticket #VIQ-2024-8832</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Gate B · Section N · Checked in</div>
          </div>
        </div>
      </div>

      {/* Status Strip */}
      <div className="att-status-grid">
        <div className="att-stat">
          <div className="att-stat-val" style={{ color: '#4ade80' }}>4.2 min</div>
          <div className="att-stat-lbl">Avg queue near you</div>
        </div>
        <div className="att-stat">
          <div className="att-stat-val" style={{ color: '#f59e0b' }}>4 min</div>
          <div className="att-stat-lbl">Walk to your seat</div>
        </div>
        <div className="att-stat">
          <div className="att-stat-val" style={{ color: '#60a5fa' }}>8 min</div>
          <div className="att-stat-lbl">To half-time</div>
        </div>
      </div>

      {/* Alert Banner */}
      <div style={{ padding: '16px 20px 4px' }}>
        <div className="att-alert-banner al-warn" style={{ borderRadius: 'var(--rad)' }}>
          <div className="alind" style={{ background: '#f59e0b', marginTop: 3 }}></div>
          <div>
            <div className="al-t" style={{ fontSize: 12 }}>North Stand is congested (91%) — Gate A restricted</div>
            <div className="al-b" style={{ fontSize: 11 }}>Use Gate B or Gate D. AI has updated your route automatically.</div>
          </div>
        </div>
      </div>

      {/* Live Map for Attendee */}
      <div className="att-section">
        <div className="att-sec-title">Live Navigation & Crowd Levels</div>
        <div style={{ height: 260, width: '100%', borderRadius: 'var(--rad)', overflow: 'hidden', border: '1px solid var(--brd)', position: 'relative' }}>
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              defaultZoom={15}
              defaultCenter={{ lat: 28.6139, lng: 77.2090 }}
              mapId="ATTENDEE_MAP"
              disableDefaultUI={true}
            >
              {/* My Seat marker */}
              <AdvancedMarker position={{ lat: 28.6139, lng: 77.2090 }}>
                <div style={{ background: '#2563eb', color: '#fff', padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, border: '1px solid #1e3a8a', boxShadow: '0 y 5px rgba(0,0,0,0.5)' }}>
                  📍 My Seat (N-Block)
                </div>
              </AdvancedMarker>

              {/* Gate A (Restricted) */}
              <AdvancedMarker position={{ lat: 28.6150, lng: 77.2105 }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.95)', color: '#fff', padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, border: '1px solid #7f1d1d', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🚫</span> Gate A (91% Full)
                </div>
              </AdvancedMarker>

              {/* Gate B (Green / Routing) */}
              <AdvancedMarker position={{ lat: 28.6125, lng: 77.2075 }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.95)', color: '#fff', padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, border: '1px solid #14532d', display: 'flex', alignItems: 'center', gap: 4, animation: 'pulse 2s infinite' }}>
                  <span>✅</span> Go to Gate B (35%)
                </div>
              </AdvancedMarker>
              
              {/* Quick Needs */}
              <AdvancedMarker position={{ lat: 28.6130, lng: 77.2110 }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.95)', color: '#fff', padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, border: '1px solid #78350f' }}>
                  🍔 Food (8m Wait)
                </div>
              </AdvancedMarker>

              {/* Nearby external awareness (1-2km) */}
              <AdvancedMarker position={{ lat: 28.6220, lng: 77.2090 }}>
                <div style={{ background: 'rgba(96, 165, 250, 0.95)', color: '#fff', padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, border: '1px solid #1e3a8a' }}>
                  🚶 Traffic 1km away
                </div>
              </AdvancedMarker>
              <AdvancedMarker position={{ lat: 28.6010, lng: 77.2050 }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.95)', color: '#fff', padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, border: '1px solid #7f1d1d' }}>
                  🚗 Auto Delays (2km)
                </div>
              </AdvancedMarker>

            </Map>
          </APIProvider>
          <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(15, 23, 42, 0.8)', padding: '4px 8px', borderRadius: 4, fontSize: 9, color: '#94a3b8', backdropFilter: 'blur(2px)' }}>
            Google Maps powered routing
          </div>
        </div>
      </div>

      {/* My Route */}
      <div className="att-section">
        <div className="att-sec-title">My route to seat</div>
        <div className="att-route-card">
          {attendeeRouteSteps.map((s, i) => (
            <div key={i} className="att-step">
              <div className="att-step-dot" style={{ background: s.col }}></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 1 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Info */}
      <div className="att-section">
        <div className="att-sec-title">Quick info near you</div>
        <div className="att-quick-grid">
          {attendeeQuickInfo.map((q, i) => (
            <div key={i} className="att-quick">
              <div className="att-quick-icon">{q.ico}</div>
              <div className="att-quick-title">{q.title}</div>
              <div className="att-quick-val" style={{ color: q.vc }}>{q.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Facilities Status */}
      <div className="att-section">
        <div className="att-sec-title">Live Facilities Status</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            { ico: '🚻', name: 'Restroom Block N1', stats: '3 min wait', statCol: '#4ade80', status: 'Moderate', fill: 45 },
            { ico: '🍔', name: 'Food Court Central', stats: '8 min wait', statCol: '#f59e0b', status: 'Busy', fill: 82 },
            { ico: '🏥', name: 'Medical Bay', stats: 'Clear', statCol: '#4ade80', status: 'Available', fill: 10 },
            { ico: '👕', name: 'Merchandise Store', stats: '12 min wait', statCol: '#ef4444', status: 'Very Busy', fill: 95 },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--brd)' }}>
              <div style={{ fontSize: 20 }}>{f.ico}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 4 }}>{f.name}</div>
                <div style={{ background: 'var(--brd)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${f.fill}%`, height: '100%', background: f.fill > 85 ? '#ef4444' : f.fill > 60 ? '#f59e0b' : '#22c55e' }}></div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: f.statCol }}>{f.stats}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{f.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className="att-section">
        <div className="att-sec-title">Today's event schedule</div>
        {attendeeSchedule.map((s, i) => {
          const col = s.status === 'done' ? '#4ade80' : s.status === 'active' ? '#60a5fa' : '#475569';
          const bg = s.status === 'done' ? 'var(--gdim)' : s.status === 'active' ? 'var(--bdim)' : 'var(--bg2)';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
              background: bg, borderRadius: 7, marginBottom: 7, border: '1px solid var(--brd)',
            }}>
              <span style={{ fontSize: 16 }}>{s.ico}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12, fontWeight: s.status === 'active' ? 600 : 400,
                  color: s.status === 'up' ? '#475569' : '#e2e8f0',
                }}>{s.label}</div>
              </div>
              <div style={{ fontSize: 11, color: col, fontWeight: 500 }}>{s.time}</div>
              {s.status === 'active' && <div className="livd" style={{ background: '#60a5fa' }}></div>}
            </div>
          );
        })}
      </div>

      {/* Announcements */}
      <div className="att-section">
        <div className="att-sec-title">Venue announcements</div>
        {announcements.map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 13px',
            background: a.dim, border: `1px solid ${a.brd}`,
            borderRadius: 'var(--rads)', marginBottom: 7,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{a.ico}</span>
            <span style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.5 }}>{a.msg}</span>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="att-section">
        <div className="att-sec-title">Ask VenueIQ</div>
        <div className="chat-outer" style={{ maxWidth: '100%' }}>
          <div className="chat-hdr">
            <div className="chat-av" style={{ background: 'linear-gradient(135deg, #ff7000, #ff4500)' }}>M</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>VenueIQ for Visitors</div>
              <div style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className="livd" style={{ width: 5, height: 5, background: '#4ade80' }}></div>
                Personalized to your seat &amp; location
              </div>
            </div>
          </div>

          <div className="chat-msgs" ref={chatRef} style={{ height: 260 }}>
            {attChat.map((m, i) => (
              <div key={i} className={m.isUser ? 'msg-u' : 'msg-a'}>
                <div className={`bub ${m.isUser ? 'bub-u' : 'bub-a'}`}>
                  {m.time === 'typing' ? (
                    <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>Gemini analyzing live data…</span>
                  ) : m.text}
                </div>
                <div className="msg-meta">{m.isUser ? 'You' : 'VenueIQ · just now'}</div>
              </div>
            ))}
          </div>

          <div className="chips">
            {chips.map((c, i) => (
              <button key={i} className="chip" onClick={() => { setChatInput(c.q); sendAttChat(c.q); }}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="cinp-row">
            <input
              className="cinp"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
              placeholder="Ask anything about the venue…"
              aria-label="Attendee chat input"
              id="att-chat-input"
            />
            <button className="csend" onClick={sendChat}>Send</button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--brd)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setFeedbackDone(true)}
            style={{
              flex: 1, padding: 10, background: feedbackDone ? 'var(--gdim)' : 'var(--bg2)',
              border: `1px solid ${feedbackDone ? 'var(--gbrd)' : 'var(--brd)'}`, borderRadius: 'var(--rads)',
              color: feedbackDone ? '#4ade80' : 'var(--t2)', fontSize: 13, cursor: 'pointer', transition: '.15s',
            }}
          >{feedbackDone ? '👍 Thanks!' : '👍 Experience good'}</button>
          <button
            onClick={() => setShowReport(!showReport)}
            style={{
              flex: 1, padding: 10, background: 'var(--bg2)',
              border: '1px solid var(--brd)', borderRadius: 'var(--rads)',
              color: 'var(--t2)', fontSize: 13, cursor: 'pointer', transition: '.15s',
            }}
          >📝 Report issue</button>
        </div>

        <button
          onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSe8DMQ8kU_H2T0beOwMq5f0s9bINo9hdrhTYCSbUvU6bGZ3PA/viewform?usp=publish-editor', '_blank')}
          style={{
            width: '100%', padding: '12px', background: 'rgba(52, 168, 83, 0.1)',
            border: '1px solid #34a853', borderRadius: 'var(--rads)',
            color: '#4ade80', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '.15s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
          }}
        >
          <span>📋</span> Detailed Feedback (Google Forms)
        </button>

        {showReport && !reportSent && (
          <div style={{ marginTop: 12 }}>
            <div style={{ background: 'var(--bg1)', border: '1px solid var(--brd)', borderRadius: 'var(--rad)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--brd)', fontSize: 12, fontWeight: 500, color: '#e2e8f0' }}>Report an issue</div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select
                  className="form-select"
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                  style={{ background: 'var(--bg2)' }}
                  aria-label="Issue type"
                >
                  <option>Crowd / Safety concern</option>
                  <option>Queue / wait time issue</option>
                  <option>Navigation unclear</option>
                  <option>Facility problem</option>
                  <option>Other</option>
                </select>
                <textarea
                  style={{
                    background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 'var(--rads)',
                    padding: '8px 12px', color: '#e2e8f0', fontSize: 12, resize: 'none', outline: 'none', height: 70,
                  }}
                  placeholder="Describe the issue…"
                  value={reportText}
                  onChange={e => setReportText(e.target.value)}
                  aria-label="Issue description"
                />
                <button
                  onClick={submitFeedback}
                  style={{
                    padding: 8, background: '#185fa5', border: 'none', borderRadius: 'var(--rads)',
                    color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}
                >Submit Report</button>
              </div>
            </div>
          </div>
        )}

        {reportSent && (
          <div style={{
            marginTop: 12, background: 'var(--gdim)', border: '1px solid var(--gbrd)',
            borderRadius: 'var(--rad)', padding: '12px 16px', fontSize: 12, color: '#4ade80',
          }}>✓ Report submitted — venue team notified. Thank you!</div>
        )}
      </div>
    </div>
  );
}
