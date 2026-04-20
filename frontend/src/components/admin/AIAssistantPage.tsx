import { useState, useRef, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';

export default function AIAssistantPage() {
  const { adminChat, sendAdminChat } = useVenue();
  const [input, setInput] = useState('');
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [adminChat]);

  const send = () => {
    const v = input.trim();
    if (!v) return;
    sendAdminChat(v);
    setInput('');
  };

  const chips = [
    { label: 'Nearest restroom', q: 'Nearest restroom with no wait?' },
    { label: 'Shortest queue', q: 'Which concession has shortest queue?' },
    { label: 'North Stand', q: 'North Stand status?' },
    { label: 'Half-time plan', q: 'Half-time surge plan?' },
    { label: 'Parking exits', q: 'Parking exit options?' },
  ];

  return (
    <div id="page-ai" role="tabpanel" aria-label="AI Assistant Page">
      <h1 className="pg-title">AI Venue Assistant</h1>
      <p className="pg-sub">Powered by Google Gemini — real-time data on crowds, queues, routes, and event info</p>

      <div className="chat-outer">
        <div className="chat-hdr">
          <div className="chat-av" aria-hidden="true" style={{ background: 'linear-gradient(135deg, #ff7000, #ff4500)' }}>M</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>VenueIQ Assistant</div>
            <div style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div className="livd" style={{ width: 5, height: 5, background: '#4ade80' }}></div>
              Live venue data connected
            </div>
          </div>
        </div>

        <div className="chat-msgs" ref={msgsRef} id="admin-chat-msgs">
          {adminChat.map((m, i) => (
            <div key={i} className={m.isUser ? 'msg-u' : 'msg-a'}>
              <div className={`bub ${m.isUser ? 'bub-u' : 'bub-a'}`}>
                {m.time === 'typing' ? (
                  <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>Gemini analyzing live data…</span>
                ) : m.text}
              </div>
              <div className="msg-meta">{m.isUser ? 'You' : 'Gemini · just now'}</div>
            </div>
          ))}
        </div>

        <div className="chips">
          {chips.map((c, i) => (
            <button key={i} className="chip" onClick={() => { setInput(c.q); sendAdminChat(c.q); }}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="cinp-row">
          <input
            className="cinp"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Ask about queues, crowds, routes, operations…"
            aria-label="Chat input"
            id="admin-chat-input"
          />
          <button className="csend" onClick={send} aria-label="Send message">Send</button>
        </div>
      </div>
    </div>
  );
}
