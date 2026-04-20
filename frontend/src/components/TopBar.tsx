import { useVenue } from '../context/VenueContext';

export default function TopBar() {
  const { config, arrived, clock, cameras, setSettingsOpen, setActivePage } = useVenue();
  return (
    <div className="topbar" role="toolbar" aria-label="Venue Information Bar">
      <div className="t-logo">
        <span id="venue-display">{config.name}</span>
        <span className="venue-name" id="venue-event-display">· {config.event}</span>
      </div>
      <div className="t-meta">
        <span>Expected <b id="hdr-exp">{config.capacity.toLocaleString()}</b></span>
        <span>Registered <b id="hdr-reg">{config.registered.toLocaleString()}</b></span>
        <span>Arrived <b style={{ color: '#4ade80' }} id="hdr-arr">{arrived.toLocaleString()}</b></span>
        <span>Unregistered <b style={{ color: '#f59e0b' }} id="hdr-unreg">~{config.walkin.toLocaleString()}</b></span>
        <span>Cameras <b style={{ color: '#4ade80' }} id="hdr-cams">{cameras.length} live</b></span>
        <span style={{ color: '#4ade80' }} id="hdr-clock">{clock}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="settings-btn" onClick={() => setSettingsOpen(true)} aria-label="Venue Settings">
          ⚙ Venue Settings
        </button>
        <button className="em-btn-top" onClick={() => setActivePage('alerts')} aria-label="Emergency Alerts">
          ⚠ Emergency
        </button>
      </div>
    </div>
  );
}
