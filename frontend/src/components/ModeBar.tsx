import { useVenue } from '../context/VenueContext';

export default function ModeBar() {
  const { mode, setMode, clock } = useVenue();
  return (
    <div className="mode-bar" role="banner" aria-label="VenueIQ Mode Switcher">
      <div className="mode-logo">
        <div className="mode-logo-mark">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        VenueIQ
      </div>
      <div className="mode-toggle" role="tablist" aria-label="Panel Mode">
        <button
          className={`mode-btn${mode === 'admin' ? ' active' : ''}`}
          onClick={() => setMode('admin')}
          role="tab"
          aria-selected={mode === 'admin'}
          id="mode-admin-tab"
        >
          Admin / Ops Panel
        </button>
        <button
          className={`mode-btn${mode === 'attendee' ? ' active' : ''}`}
          onClick={() => setMode('attendee')}
          role="tab"
          aria-selected={mode === 'attendee'}
          id="mode-attendee-tab"
        >
          Attendee View
        </button>
      </div>
      <div className="mode-right">
        <div className="live-chip"><div className="livd" aria-hidden="true"></div>System Live</div>
        <span aria-label="Current time">{clock}</span>
      </div>
    </div>
  );
}
