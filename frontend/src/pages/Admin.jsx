import { useEffect, useState } from 'react';
import { resources, issues } from '../api/client';
import MapPicker from '../components/MapPicker';

const TYPES = ['SPORTS_COURT', 'PARK', 'LIBRARY', 'COMMUNITY_CENTER', 'GYM', 'POOL', 'OTHER'];
const STATUSES = ['SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const STATUS_STYLES = {
  SUBMITTED:   { background: '#E3F2FD', color: '#1565C0' },
  IN_PROGRESS: { background: '#FFF3E0', color: '#E65100' },
  RESOLVED:    { background: '#E8F5E9', color: '#2E7D32' },
  CLOSED:      { background: '#F5F5F5', color: '#616161' },
};

function statusSelectStyle(status) {
  return { padding: '4px 8px', fontSize: '0.78rem', width: 'auto', borderRadius: 6, border: '1px solid #ccc', fontWeight: 600, cursor: 'pointer', ...(STATUS_STYLES[status] || {}) };
}

const emptyResource = { name: '', type: 'SPORTS_COURT', location: '', latitude: '', longitude: '', capacity: '', openingTime: '', closingTime: '', description: '', available: true };

function ResourceModal({ resource, onClose, onSave }) {
  const [form, setForm] = useState(resource || emptyResource);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!resource?.resourceId;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const body = { ...form, capacity: Number(form.capacity), latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null };
      if (isEdit) await resources.update(resource.resourceId, body);
      else await resources.create(body);
      onSave();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Resource' : 'Add Resource'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Location on Map <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(click to pin)</span></label>
            <MapPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Capacity</label>
              <input className="form-input" type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Available</label>
              <select className="form-input" value={form.available} onChange={e => setForm(f => ({ ...f, available: e.target.value === 'true' }))}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Opening time</label>
              <input className="form-input" type="time" value={form.openingTime} onChange={e => setForm(f => ({ ...f, openingTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Closing time</label>
              <input className="form-input" type="time" value={form.closingTime} onChange={e => setForm(f => ({ ...f, closingTime: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Resource'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('resources');
  const [resourceList, setResourceList] = useState([]);
  const [issueList, setIssueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [msg, setMsg] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState(null);

  async function loadResources() {
    const data = await resources.getAll();
    setResourceList(data || []);
  }

  async function loadIssues() {
    const data = await issues.getAll();
    setIssueList(data || []);
  }

  async function load() {
    setLoading(true);
    try {
      if (tab === 'resources') await loadResources();
      else await loadIssues();
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [tab]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return;
    try {
      await resources.delete(id);
      setMsg('Resource deleted.'); setTimeout(() => setMsg(''), 3000);
      loadResources();
    } catch (err) { alert(err.message); }
  }

  async function handleStatusChange(id, status) {
    try {
      await issues.updateStatus(id, status);
      setMsg('Issue status updated.'); setTimeout(() => setMsg(''), 3000);
      loadIssues();
    } catch (err) { alert(err.message); }
  }

  function handleModalSave() {
    setModal(null);
    setMsg('Resource saved.'); setTimeout(() => setMsg(''), 3000);
    loadResources();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage platform resources and issue reports.</p>
        </div>
        {tab === 'resources' && (
          <button className="btn btn-primary" onClick={() => setModal({})}>+ Add Resource</button>
        )}
      </div>

      {msg && <div className="alert alert-success">✓ {msg}</div>}

      <div className="tabs">
        <button className={`tab-btn${tab === 'resources' ? ' active' : ''}`} onClick={() => setTab('resources')}>Resources</button>
        <button className={`tab-btn${tab === 'issues' ? ' active' : ''}`} onClick={() => setTab('issues')}>Issue Reports</button>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : tab === 'resources' ? (
        <div className="card">
          {resourceList.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🏙</div><h3>No resources yet</h3><p>Add your first resource.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Type</th><th>Location</th><th>Capacity</th><th>Hours</th><th>Available</th><th style={{ width: 100 }}>Actions</th></tr>
                </thead>
                <tbody>
                  {resourceList.map(r => (
                    <tr key={r.resourceId}>
                      <td><strong>{r.name}</strong></td>
                      <td><span className="resource-type-tag" style={{ fontSize: '0.7rem' }}>{r.type?.replace('_', ' ')}</span></td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{r.location}</td>
                      <td>{r.capacity}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                        {r.openingTime ? `${r.openingTime} – ${r.closingTime}` : '—'}
                      </td>
                      <td>
                        <span className={`badge ${r.available ? 'badge-active' : 'badge-cancelled'}`}>
                          {r.available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => setModal(r)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.resourceId)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          {issueList.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✅</div><h3>No issues reported</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Category</th><th>Description</th><th>Resource</th><th>Reporter</th><th>Photo</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {issueList.map(i => (
                    <tr key={i.id}>
                      <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{i.id}</td>
                      <td><strong>{i.category}</strong></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.description}</td>
                      <td>#{i.resourceId}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>User #{i.userId}</td>
                      <td>
                        {i.imageUrl
                          ? <img src={i.imageUrl} alt="evidence" onClick={() => setLightboxUrl(i.imageUrl)} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', display: 'block' }} />
                          : <span style={{ color: 'var(--muted)' }}>—</span>
                        }
                      </td>
                      <td>
                        <select
                          style={statusSelectStyle(i.status || 'SUBMITTED')}
                          value={i.status || 'SUBMITTED'}
                          onChange={e => handleStatusChange(i.id, e.target.value)}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal !== null && <ResourceModal resource={modal?.resourceId ? modal : null} onClose={() => setModal(null)} onSave={handleModalSave} />}

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute', top: 20, right: 24,
              background: 'none', border: 'none',
              color: 'white', fontSize: 28, cursor: 'pointer', lineHeight: 1,
            }}
          >✕</button>
          <img
            src={lightboxUrl}
            alt="evidence"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
}
