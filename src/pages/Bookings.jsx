import { useEffect, useState } from 'react';
import { bookings, resources } from '../api/client';

function fmtDate(dt) {
  return new Date(dt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(dt) {
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function Bookings() {
  const [tab, setTab] = useState('active');
  const [list, setList] = useState([]);
  const [resourceMap, setResourceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    resources.getAll().then(data => {
      const map = {};
      (data || []).forEach(r => { map[r.resourceId] = r.name; });
      setResourceMap(map);
    }).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = tab === 'active'
        ? await bookings.getActive()
        : tab === 'history'
          ? await bookings.getHistory()
          : await bookings.getMy();
      setList(data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [tab]);

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await bookings.cancel(id);
      setMsg('Booking cancelled.'); setTimeout(() => setMsg(''), 3000);
      load();
    } catch (err) { alert(err.message); }
    finally { setCancelling(null); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">Manage your reservations and booking history.</p>
        </div>
      </div>

      {msg && <div className="alert alert-success">✓ {msg}</div>}

      <div className="tabs">
        {['active', 'history', 'all'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No bookings found</h3>
          <p>{tab === 'active' ? 'You have no upcoming reservations.' : 'No booking history yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(b => (
            <div key={b.id} className="booking-card">
              <div className="booking-date">
                <div className="day">{new Date(b.startTime).getDate()}</div>
                <div className="mon">{new Date(b.startTime).toLocaleString('en', { month: 'short' })}</div>
              </div>
              <div className="booking-info">
                <h4>{resourceMap[b.resourceId] || `Resource #${b.resourceId}`}</h4>
                <div className="booking-time">{fmtDate(b.startTime)} · {fmtTime(b.startTime)} – {fmtTime(b.endTime)}</div>
                {b.subAmenity && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 3 }}>{b.subAmenity}</div>}
              </div>
              <span className={`badge badge-${b.status?.toLowerCase()}`}>{b.status}</span>
              {b.status === 'ACTIVE' && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleCancel(b.id)}
                  disabled={cancelling === b.id}
                >
                  {cancelling === b.id ? '…' : 'Cancel'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
