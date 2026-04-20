import { navSteps, venueServices, emergencyExits, a11yFeatures } from '../../data';

export default function NavigationPage() {
  return (
    <div id="page-navigate" role="tabpanel" aria-label="Navigation Page">
      <h1 className="pg-title">Indoor Navigation</h1>
      <p className="pg-sub">AI-optimized crowd-aware routing — updates every 30 seconds</p>

      <div className="grid2">
        {/* LEFT — Route */}
        <div>
          <div className="sec-lbl">Route to your seat</div>

          {/* Destination card */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 'var(--rad)',
            padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 2 }}>Destination</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>N-Block · Row 12 · Seat 34</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#4ade80' }}>4 min</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>AI-optimized ETA</div>
            </div>
          </div>

          {/* AI savings banner */}
          <div style={{
            background: 'var(--gdim)', border: '1px solid var(--gbrd)', borderRadius: 'var(--rads)',
            padding: '9px 13px', marginBottom: 16, fontSize: 12, color: '#4ade80',
          }}>
            AI saved 3 min by rerouting away from Gate A (89% density)
          </div>

          {/* Steps */}
          <div style={{ paddingLeft: 20, position: 'relative' }}>
            {navSteps.map((s, i) => {
              const col = s.status === 'done' ? '#185fa5' : s.status === 'active' ? '#1d9e75' : '#1e2a3a';
              const tc = s.status === 'up' ? '#64748b' : '#e2e8f0';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  marginBottom: i < navSteps.length - 1 ? 16 : 0, position: 'relative',
                }}>
                  {i < navSteps.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 5, top: 14, width: 1,
                      height: 'calc(100% + 6px)', background: 'var(--brd)',
                    }}></div>
                  )}
                  <div style={{
                    width: 11, height: 11, borderRadius: '50%', background: col, flexShrink: 0,
                    marginTop: 2, border: `2px solid ${col}`,
                    ...(s.status === 'active' ? { animation: 'blink .8s infinite' } : {}),
                  }}></div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: tc, marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>{s.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accessibility */}
          <div style={{ marginTop: 16 }}>
            <div className="sec-lbl">Accessibility</div>
            <div style={{
              background: 'var(--bg1)', border: '1px solid var(--brd)',
              borderRadius: 'var(--rad)', padding: '13px 16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#e2e8f0' }}>Wheelchair-accessible path</div>
              <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 8, lineHeight: 1.5 }}>
                Gate B Lift → Level 2 Ramp → N-Block Elevator (0 min wait)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {a11yFeatures.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#86efac' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }}></div>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Services & Exits */}
        <div>
          <div className="sec-lbl">Venue services nearby</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
            {venueServices.map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 'var(--rads)',
                padding: '11px 13px', cursor: 'pointer', transition: '.15s',
              }}>
                <div style={{ fontSize: 18, marginBottom: 5 }}>{s.ico}</div>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2, color: '#e2e8f0' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{s.meta}</div>
              </div>
            ))}
          </div>

          <div className="sec-lbl">Emergency exits</div>
          {emergencyExits.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
              background: e.ok ? 'var(--gdim)' : 'var(--rdim)',
              border: `1px solid ${e.ok ? 'var(--gbrd)' : 'var(--rbrd)'}`,
              borderRadius: 'var(--rads)', marginBottom: 7,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: e.ok ? '#22c55e' : '#ef4444', flexShrink: 0 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{e.gate}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{e.desc}</div>
              </div>
              <span className={`tag ${e.ok ? 'tag-g' : 'tag-r'}`}>{e.ok ? 'Open' : 'Restricted'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
