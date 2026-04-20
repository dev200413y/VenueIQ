import { useVenue } from '../context/VenueContext';
import type { AdminPage } from '../types';

const tabs: { id: AdminPage; label: string; color: string }[] = [
  { id: 'overview', label: 'Overview', color: '#4ade80' },
  { id: 'crowd', label: 'Crowd Map', color: '#f59e0b' },
  { id: 'queues', label: 'Queue Intelligence', color: '#378add' },
  { id: 'navigate', label: 'Navigation', color: '#a78bfa' },
  { id: 'ai', label: 'AI Assistant', color: '#2dd4bf' },
  { id: 'alerts', label: 'Alerts & Coordination', color: '#ef4444' },
];

export default function NavBar() {
  const { activePage, setActivePage } = useVenue();
  return (
    <nav className="nav" role="navigation" aria-label="Admin Navigation">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`nv${activePage === t.id ? ' active' : ''}`}
          onClick={() => setActivePage(t.id)}
          role="tab"
          aria-selected={activePage === t.id}
          id={`nav-tab-${t.id}`}
        >
          <div className="nvd" style={{ background: t.color }} aria-hidden="true"></div>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
