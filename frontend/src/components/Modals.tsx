import { useState, useRef, useEffect } from 'react';
import { useVenue } from '../context/VenueContext';
import { cameraZoneOptions } from '../data';

export function VenueSettingsModal() {
  const { config, setConfig, settingsOpen, setSettingsOpen } = useVenue();
  const [form, setForm] = useState({ ...config });

  const open = settingsOpen;
  if (!open) return null;

  const apply = () => {
    setConfig({ ...form });
    setSettingsOpen(false);
  };

  return (
    <div className={`modal-bg${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setSettingsOpen(false); }}>
      <div className="modal" style={{ width: 440 }} role="dialog" aria-label="Venue Settings">
        <div className="modal-title">⚙ Venue Settings</div>
        <div className="form-row">
          <div className="form-lbl">Venue Name</div>
          <input className="form-inp" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} id="vs-name" />
        </div>
        <div className="form-row">
          <div className="form-lbl">Event Name</div>
          <input className="form-inp" value={form.event} onChange={e => setForm(p => ({ ...p, event: e.target.value }))} id="vs-event" />
        </div>
        <div className="form-row">
          <div className="form-lbl">Total Capacity</div>
          <input className="form-inp" type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) || 0 }))} id="vs-capacity" />
        </div>
        <div className="form-row">
          <div className="form-lbl">Registered Tickets</div>
          <input className="form-inp" type="number" value={form.registered} onChange={e => setForm(p => ({ ...p, registered: parseInt(e.target.value) || 0 }))} id="vs-reg" />
        </div>
        <div className="form-row">
          <div className="form-lbl">Expected Walk-ins</div>
          <input className="form-inp" type="number" value={form.walkin} onChange={e => setForm(p => ({ ...p, walkin: parseInt(e.target.value) || 0 }))} id="vs-walkin" />
        </div>
        <div className="form-row">
          <div className="form-lbl">Event Type</div>
          <select className="form-select" value={form.eventType} onChange={e => setForm(p => ({ ...p, eventType: e.target.value }))} id="vs-type">
            <option>Cricket / IPL</option>
            <option>Football</option>
            <option>Concert</option>
            <option>Exhibition</option>
            <option>Marathon</option>
            <option>Other</option>
          </select>
        </div>
        <div className="modal-btns">
          <button className="mbtn-cancel" onClick={() => setSettingsOpen(false)}>Cancel</button>
          <button className="mbtn-ok" onClick={apply}>Apply</button>
        </div>
      </div>
    </div>
  );
}

/* ── Extended zone options for camera placement ── */
const allZoneOptions = [
  ...cameraZoneOptions,
  'Restroom Block N1', 'Restroom Block W2', 'Restroom Block S3',
  'Medical Bay', 'Merchandise Store', 'ATM Zone',
  'Concession Area', 'VIP Corridor', 'Press Box',
  'Broadcast Room', 'Player Tunnel', 'Loading Dock',
];

export function AddCameraModal() {
  const { addCamOpen, setAddCamOpen, addCamera } = useVenue();
  const [name, setName] = useState('');
  const [zone, setZone] = useState('North Stand');
  const [status, setStatus] = useState<'ok' | 'warn' | 'crit'>('ok');
  const [density, setDensity] = useState(45);
  const [sourceMode, setSourceMode] = useState<'manual' | 'webcam' | 'video'>('manual');
  const [webcamActive, setWebcamActive] = useState(false);
  const [videoFile, setVideoFile] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // cleanup webcam on close
    if (!addCamOpen && videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
      setWebcamActive(false);
      setSourceMode('manual');
      setVideoFile('');
    }
  }, [addCamOpen]);

  if (!addCamOpen) return null;

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setWebcamActive(true);
      setSourceMode('webcam');
    } catch {
      alert('Camera access denied. Please allow camera permission in your browser.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    setSourceMode('manual');
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoFile(url);
    setSourceMode('video');
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.play();
    }
    // auto-fill name from filename
    if (!name) setName(file.name.replace(/\.[^.]+$/, ''));
  };

  const submit = () => {
    // Stop webcam if active
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    addCamera(name || `Camera - ${zone}`, zone, status, density);
    setAddCamOpen(false);
    setName('');
    setDensity(45);
    setStatus('ok');
    setSourceMode('manual');
    setWebcamActive(false);
    setVideoFile('');
  };

  return (
    <div className={`modal-bg${addCamOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) { stopWebcam(); setAddCamOpen(false); } }}>
      <div className="modal" style={{ width: 520 }} role="dialog" aria-label="Add Camera">
        <div className="modal-title">📷 Add Live Camera Feed</div>

        {/* Source selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          <button onClick={() => { stopWebcam(); setSourceMode('manual'); }} style={{
            flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: '.15s', border: '1px solid',
            background: sourceMode === 'manual' ? 'var(--bdim)' : 'transparent',
            borderColor: sourceMode === 'manual' ? 'var(--bbrd)' : 'var(--brd)',
            color: sourceMode === 'manual' ? '#93c5fd' : 'var(--t3)',
          }}>✏️ Manual Entry</button>
          <button onClick={startWebcam} style={{
            flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: '.15s', border: '1px solid',
            background: sourceMode === 'webcam' ? 'var(--gdim)' : 'transparent',
            borderColor: sourceMode === 'webcam' ? 'var(--gbrd)' : 'var(--brd)',
            color: sourceMode === 'webcam' ? '#86efac' : 'var(--t3)',
          }}>📷 Live Webcam</button>
          <label style={{
            flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: '.15s', border: '1px solid', textAlign: 'center',
            background: sourceMode === 'video' ? 'var(--adim)' : 'transparent',
            borderColor: sourceMode === 'video' ? 'var(--abrd)' : 'var(--brd)',
            color: sourceMode === 'video' ? '#fde68a' : 'var(--t3)',
          }}>
            📁 Upload Video
            <input type="file" accept="video/*" onChange={handleVideoFile} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Video preview */}
        {(sourceMode === 'webcam' || sourceMode === 'video') && (
          <div style={{ marginBottom: 14, borderRadius: 8, overflow: 'hidden', position: 'relative', background: '#050810', border: '1px solid var(--brd)' }}>
            <video ref={videoRef} muted playsInline loop style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
            {/* Grid overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <svg width="100%" height="100%">
                <line x1="33%" y1="0" x2="33%" y2="100%" stroke="#22c55e" strokeWidth="0.5" opacity="0.25"/>
                <line x1="66%" y1="0" x2="66%" y2="100%" stroke="#22c55e" strokeWidth="0.5" opacity="0.25"/>
                <line x1="0" y1="33%" x2="100%" y2="33%" stroke="#22c55e" strokeWidth="0.5" opacity="0.25"/>
                <line x1="0" y1="66%" x2="100%" y2="66%" stroke="#22c55e" strokeWidth="0.5" opacity="0.25"/>
              </svg>
              <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,.7)', padding: '3px 8px', borderRadius: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'blink 1s infinite' }}></div>
                <span style={{ fontSize: 9, fontWeight: 600, color: '#f87171' }}>PREVIEW</span>
              </div>
              <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: 'rgba(0,0,0,.65)', padding: '5px 8px', borderRadius: 4 }}>
                <span style={{ fontSize: 10, color: '#4ade80' }}>👁 {sourceMode === 'webcam' ? 'Live webcam feed' : 'Video file loaded'} — AI will analyze after adding</span>
              </div>
            </div>
          </div>
        )}

        {/* Manual entry only shows placeholder */}
        {sourceMode === 'manual' && (
          <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, marginBottom: 14, color: 'var(--t3)', fontSize: 12 }}>
            No video source — camera will use simulated AI feed
          </div>
        )}

        <div className="form-row">
          <div className="form-lbl">Camera Name / Location</div>
          <input className="form-inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Restroom Block N1 Entrance" id="new-cam-name" />
        </div>
        <div className="form-row">
          <div className="form-lbl">Zone / Area</div>
          <select className="form-select" value={zone} onChange={e => setZone(e.target.value)} id="new-cam-zone">
            {allZoneOptions.map(z => <option key={z}>{z}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-row">
            <div className="form-lbl">Initial Status</div>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as 'ok' | 'warn' | 'crit')} id="new-cam-status">
              <option value="ok">Normal</option>
              <option value="warn">Warning</option>
              <option value="crit">Critical</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-lbl">Starting Density (%)</div>
            <input className="form-inp" type="number" min={0} max={100} value={density} onChange={e => setDensity(parseInt(e.target.value) || 0)} id="new-cam-density" />
          </div>
        </div>
        <div className="modal-btns">
          <button className="mbtn-cancel" onClick={() => { stopWebcam(); setAddCamOpen(false); }}>Cancel</button>
          <button className="mbtn-ok" onClick={submit} style={{ background: 'linear-gradient(135deg, #185fa5, #1d6bbf)' }}>
            {sourceMode === 'webcam' ? '📷 Add Live Camera' : sourceMode === 'video' ? '📁 Add Video Feed' : '➕ Add Camera'}
          </button>
        </div>
      </div>
    </div>
  );
}

