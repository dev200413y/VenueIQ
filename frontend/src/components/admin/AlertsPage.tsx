import { useState, useRef, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import { alertClassMap, alertDotColor } from '../../data';

export default function AlertsPage() {
  const { alerts, addAlert, incidents, setIncidents, teamMessages, postTeamMessage } = useVenue();
  const [teamInput, setTeamInput] = useState('');
  const teamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (teamRef.current) teamRef.current.scrollTop = teamRef.current.scrollHeight;
  }, [teamMessages]);

  const emFire = (msg: string) => {
    const isAllClear = msg.toLowerCase().includes('all-clear');
    addAlert({
      type: isAllClear ? 'ok' : 'warn',
      title: isAllClear ? 'All Clear issued' : 'Protocol activated',
      body: msg,
      time: 'Just now',
    });
    if (isAllClear) {
      setIncidents(0);
    } else {
      setIncidents(p => p + 1);
    }
  };

  const doPostTeam = () => {
    const v = teamInput.trim();
    if (!v) return;
    postTeamMessage(v);
    setTeamInput('');
  };

  return (
    <div id="page-alerts" role="tabpanel" aria-label="Alerts & Coordination Page">
      <h1 className="pg-title">Alerts &amp; Team Coordination</h1>
      <p className="pg-sub">Live incidents, emergency protocols, and team strategy board</p>

      <div className="grid2" style={{ alignItems: 'start' }}>
        {/* LEFT — Alerts & Emergency */}
        <div>
          <div className="sec-lbl">Active alerts</div>
          <div id="alerts-list">
            {alerts.map((a, i) => (
              <div key={i} className={`alcard ${alertClassMap[a.type]}`}>
                <div className="alind" style={{ background: alertDotColor[a.type] }}></div>
                <div>
                  <div className="al-t">{a.title}</div>
                  <div className="al-b">{a.body}</div>
                  <div className="al-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="sec-lbl" style={{ marginTop: 20 }}>Emergency protocols</div>
          <div className="em-panel">
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="livd" style={{ background: '#ef4444' }}></div>
              Emergency Control — {incidents} active incident{incidents !== 1 ? 's' : ''}
            </div>
            <div className="em-grid">
              <button className="ebtn eb-r" onClick={() => emFire('PA Warning broadcast across all sectors')}>PA Warning</button>
              <button className="ebtn eb-a" onClick={() => emFire('Gates B & D fully opened — overflow active')}>Open Exits</button>
              <button className="ebtn eb-b" onClick={() => emFire('QRT dispatched to North Stand — ETA 90s')}>Deploy QRT</button>
              <button className="ebtn eb-g" onClick={() => emFire('All-clear issued — standard monitoring resumed')}>All Clear</button>
            </div>
          </div>
        </div>

        {/* RIGHT — Team Strategy Board */}
        <div>
          <div className="sec-lbl">Team strategy board</div>
          <div className="tbrd">
            <div ref={teamRef} style={{ maxHeight: 400, overflowY: 'auto' }}>
              {teamMessages.map((t, i) => (
                <div key={i} className="tmsg">
                  <div className="tav" style={{ background: t.col }}>{t.init}</div>
                  <div style={{ flex: 1 }}>
                    <div className="tnm">{t.name}</div>
                    <div className="ttxt">{t.text}</div>
                    <div className="tai">AI: {t.ai}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="tinp-row">
              <input
                className="tinp"
                value={teamInput}
                onChange={e => setTeamInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') doPostTeam(); }}
                placeholder="Post strategy or observation…"
                aria-label="Team message input"
                id="team-input"
              />
              <button className="tsend" onClick={doPostTeam}>Post</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
