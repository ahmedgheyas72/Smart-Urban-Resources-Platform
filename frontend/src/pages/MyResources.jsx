import { useEffect, useState } from 'react';
import { resources, issues } from '../api/client';
import MapPicker from '../components/MapPicker';

const TYPES = ['SPORTS_COURT', 'PARK', 'LIBRARY', 'COMMUNITY_CENTER', 'GYM', 'POOL', 'OTHER'];

const emptyResource = {
  name: '', type: 'SPORTS_COURT', location: '',
  latitude: '', longitude: '', capacity: '',
  openingTime: '', closingTime: '', description: '', available: true,
};

const STATUS_COLORS = {
  SUBMITTED:   { bg: '#EBF8FF', color: '#2B6CB0' },
  IN_PROGRESS: { bg: '#FEFCBF', color: '#744210' },
  RESOLVED:    { bg: '#F0FFF4', color: '#276749' },
  CLOSED:      { bg: '#F7FAFC', color: '#718096' },
};

function ResourceModal({ resource, onClose, onSave }) {
  const [form, setForm] = useState(resource || emptyResource);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!resource?.resourceId;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const body = {
        ...form,
        capacity: Number(form.capacity),
        latitude:  form.latitude  ? Number(form.latitude)  : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };
      if (isEdit) await resources.update(resource.resourceId, body);
      else        await resources.create(body);
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
                {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">
              Location on Map <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(click to pin)</span>
            </label>
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResourcesTab({ list, loading, onAdd, onEdit, onDelete, msg }) {
  return (
    <>
      {msg && <div className="alert alert-success">✓ {msg}</div>}
      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : (
        <div className="card">
          {list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏗</div>
              <h3>No resources yet</h3>
              <p>You haven't added any resources yet. Click + Add Resource to get started.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Hours</th>
                    <th>Available</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(r => (
                    <tr key={r.resourceId}>
                      <td><strong>{r.name}</strong></td>
                      <td>
                        <span className="resource-type-tag" style={{ fontSize: '0.7rem' }}>
                          {r.type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{r.location}</td>
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
                          <button className="btn btn-outline btn-sm" onClick={() => onEdit(r)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => onDelete(r.resourceId)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function IssuesTab({ resourceIds }) {
  const [issueList, setIssueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await issues.getAll();
        const filtered = (data || []).filter(i => resourceIds.includes(i.resourceId));
        setIssueList(filtered);
      } catch (err) {
        if (err.message?.includes('403') || err.message?.toLowerCase().includes('forbidden')) {
          setForbidden(true);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resourceIds.join(',')]);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  if (forbidden) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h3>Issues not available</h3>
          <p>Issue analytics are not accessible for your role at this time.</p>
        </div>
      </div>
    );
  }

  const statusStyle = (status) => {
    const s = STATUS_COLORS[status] || { bg: '#EBF8FF', color: '#2B6CB0' };
    return {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: '0.72rem',
      fontWeight: 600,
      background: s.bg,
      color: s.color,
    };
  };

  return (
    <div className="card">
      {issueList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No issues reported</h3>
          <p>No issues have been submitted for your resources.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {issueList.map(i => (
                <tr key={i.id}>
                  <td style={{ fontSize: '0.85rem' }}><strong>{i.resourceName || `#${i.resourceId}`}</strong></td>
                  <td>
                    <span className="resource-type-tag" style={{ fontSize: '0.7rem' }}>
                      {i.category?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.82rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {i.description}
                  </td>
                  <td><span style={statusStyle(i.status)}>{i.status || 'SUBMITTED'}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MyResources() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('resources');

  async function loadResources() {
    setLoading(true);
    try {
      const data = await resources.getMy();
      setList(data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadResources(); }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return;
    try {
      await resources.delete(id);
      setMsg('Resource deleted.'); setTimeout(() => setMsg(''), 3000);
      loadResources();
    } catch (err) { alert(err.message); }
  }

  function handleModalSave() {
    setModal(null);
    setMsg('Resource saved.'); setTimeout(() => setMsg(''), 3000);
    loadResources();
  }

  const resourceIds = list.map(r => r.resourceId);

  const tabStyle = (tab) => ({
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    fontWeight: 500,
    background: activeTab === tab ? 'var(--accent)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--muted)',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Resources</h1>
          <p className="page-subtitle">Manage your listed spaces and facilities.</p>
        </div>
        {activeTab === 'resources' && (
          <button className="btn btn-primary" onClick={() => setModal({})}>+ Add Resource</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        <button style={tabStyle('resources')} onClick={() => setActiveTab('resources')}>Resources</button>
        <button style={tabStyle('issues')} onClick={() => setActiveTab('issues')}>Issues</button>
      </div>

      {activeTab === 'resources' && (
        <ResourcesTab
          list={list}
          loading={loading}
          msg={msg}
          onAdd={() => setModal({})}
          onEdit={(r) => setModal(r)}
          onDelete={handleDelete}
        />
      )}

      {activeTab === 'issues' && (
        <IssuesTab resourceIds={resourceIds} />
      )}

      {modal !== null && (
        <ResourceModal
          resource={modal?.resourceId ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
