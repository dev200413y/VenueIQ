import { VenueProvider, useVenue } from './context/VenueContext';
import ModeBar from './components/ModeBar';
import TopBar from './components/TopBar';
import NavBar from './components/NavBar';
import OverviewPage from './components/admin/OverviewPage';
import CrowdMapPage from './components/admin/CrowdMapPage';
import QueuePage from './components/admin/QueuePage';
import NavigationPage from './components/admin/NavigationPage';
import AIAssistantPage from './components/admin/AIAssistantPage';
import AlertsPage from './components/admin/AlertsPage';
import AttendeePanel from './components/attendee/AttendeePanel';
import { VenueSettingsModal, AddCameraModal } from './components/Modals';

function AdminPanel() {
  const { activePage } = useVenue();
  return (
    <>
      <TopBar />
      <NavBar />
      <div style={{ display: activePage === 'overview' ? 'block' : 'none' }} className="page active">
        <OverviewPage />
      </div>
      <div style={{ display: activePage === 'crowd' ? 'block' : 'none' }} className="page active">
        <CrowdMapPage />
      </div>
      <div style={{ display: activePage === 'queues' ? 'block' : 'none' }} className="page active">
        <QueuePage />
      </div>
      <div style={{ display: activePage === 'navigate' ? 'block' : 'none' }} className="page active">
        <NavigationPage />
      </div>
      <div style={{ display: activePage === 'ai' ? 'block' : 'none' }} className="page active">
        <AIAssistantPage />
      </div>
      <div style={{ display: activePage === 'alerts' ? 'block' : 'none' }} className="page active">
        <AlertsPage />
      </div>
    </>
  );
}

function AppContent() {
  const { mode } = useVenue();
  return (
    <>
      <ModeBar />
      {mode === 'admin' ? <AdminPanel /> : <AttendeePanel />}
      <VenueSettingsModal />
      <AddCameraModal />
    </>
  );
}

export default function App() {
  return (
    <VenueProvider>
      <AppContent />
    </VenueProvider>
  );
}
