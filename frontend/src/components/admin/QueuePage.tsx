import { queueData } from '../../data';

function QueueRow({ q }: { q: typeof queueData.concessions[0] }) {
  return (
    <div className="qrow">
      <div className="qico" style={{ background: q.col + '15' }}>{q.ico}</div>
      <div className="qinfo">
        <div className="qname">{q.name}</div>
        <div className="qsub">{q.pct}% occupancy</div>
      </div>
      <div className="qbar-w">
        <div className="qbar-bg">
          <div className="qbar-f" style={{ width: `${Math.min(q.pct, 100)}%`, background: q.col }}></div>
        </div>
        <div className="qwait" style={{ color: q.col }}>
          {q.wait}{typeof q.wait === 'number' ? ' min' : ''}
        </div>
        <div className="qwlbl">wait</div>
      </div>
      <div className="qtip">{q.tip}</div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <div id="page-queues" role="tabpanel" aria-label="Queue Intelligence Page">
      <h1 className="pg-title">Queue Intelligence</h1>
      <p className="pg-sub">Real-time wait time prediction across gates, concessions, restrooms, and facilities</p>

      {/* Mistral AI Banner */}
      <div style={{
        background: 'var(--bdim)', border: '1px solid var(--bbrd)', borderRadius: 'var(--rad)',
        padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
      }}>
        <div className="chat-av" style={{ background: 'linear-gradient(135deg, #ff7000, #ff4500)' }}>M</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#93c5fd', marginBottom: 2 }}>Gemini Queue Optimizer</div>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>
            Gate B &amp; D: 2–3 min wait only. Gate A: 13 min — restricted. Half-time surge in 8 min — head to Gate B concessions now for fastest service.
          </div>
        </div>
      </div>

      {/* Concessions */}
      <div style={{ marginBottom: 20 }}>
        <div className="sec-lbl">Concessions</div>
        {queueData.concessions.map((q, i) => <QueueRow key={i} q={q} />)}
      </div>

      {/* Facilities */}
      <div style={{ marginBottom: 20 }}>
        <div className="sec-lbl">Restrooms &amp; facilities</div>
        {queueData.facilities.map((q, i) => <QueueRow key={i} q={q} />)}
      </div>

      {/* Gates */}
      <div>
        <div className="sec-lbl">Entry / exit gates</div>
        {queueData.gates.map((q, i) => <QueueRow key={i} q={q} />)}
      </div>
    </div>
  );
}
