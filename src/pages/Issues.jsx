import { useEffect, useRef, useState } from 'react';
import { issues, resources } from '../api/client';

const CATEGORIES = ['MAINTENANCE', 'SAFETY', 'CLEANLINESS', 'ACCESSIBILITY', 'DAMAGE', 'OTHER'];

function statusBadge(status) {
  const s = status?.toLowerCase().replace('_', '-') || 'submitted';
  return <span className={`badge badge-${s}`}>{status || 'SUBMITTED'}</span>;
}

function Lightbox({ url, onClose }) {
  if (!url) return null;
  return (
    <div
      onClick={onClose}
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
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 24,
          background: 'none', border: 'none',
          color: 'white', fontSize: 28, cursor: 'pointer', lineHeight: 1,
        }}
      >✕</button>
      <img
        src={url}
        alt="evidence"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }}
      />
    </div>
  );
}

function PhotoThumb({ url, onOpen }) {
  if (!url) return <span style={{ color: 'var(--muted)' }}>—</span>;
  return (
    <img
      src={url}
      alt="evidence"
      onClick={() => onOpen(url)}
      style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', display: 'block' }}
    />
  );
}

export default function Issues() {
  const [myIssues, setMyIssues] = useState([]);
  const [resourceList, setResourceList] = useState([]);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'MAINTENANCE', description: '', resourceId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [uploadHovered, setUploadHovered] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const [i, r] = await Promise.allSettled([issues.getMy(), resources.getAll()]);
      setMyIssues(i.status === 'fulfilled' ? i.value : []);
      setResourceList(r.status === 'fulfilled' ? r.value : []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageUrl('');
    setImageError('');
    setImageUploading(true);
    try {
      const res = await issues.uploadImage(file);
      setImageUrl(res.imageUrl || res.url || '');
    } catch {
      setImageError('Upload failed, try again');
      setImagePreview(null);
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageUrl('');
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.resourceId) { setError('Please select a resource.'); return; }
    if (!form.description.trim()) { setError('Please provide a description.'); return; }
    setError(''); setSubmitting(true);
    try {
      const body = { ...form, resourceId: Number(form.resourceId) };
      if (imageUrl) body.imageUrl = imageUrl;
      await issues.create(body);
      setSuccess('Issue reported successfully.'); setTimeout(() => setSuccess(''), 4000);
      setShowForm(false);
      setForm({ category: 'MAINTENANCE', description: '', resourceId: '' });
      removeImage();
      load();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Report Issue</h1>
          <p className="page-subtitle">Help us keep city resources in top condition.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Close Form' : '+ New Report'}
        </button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 28, maxWidth: 560 }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, marginBottom: 20 }}>New Issue Report</h3>
          {error && <div className="alert alert-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Resource</label>
              <select className="form-input" value={form.resourceId} onChange={e => setForm(f => ({ ...f, resourceId: e.target.value }))} required>
                <option value="">Select a resource…</option>
                {resourceList.map(r => <option key={r.resourceId} value={r.resourceId}>{r.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Describe the issue in detail…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Photo Evidence <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

              {!imagePreview && !imageUploading && !imageError && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={() => setUploadHovered(true)}
                  onMouseLeave={() => setUploadHovered(false)}
                  style={{
                    border: `2px dashed ${uploadHovered ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10,
                    padding: 20,
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: uploadHovered ? 'var(--accent)' : 'var(--muted)',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    background: uploadHovered ? 'var(--accent-lt)' : 'transparent',
                  }}
                >
                  📎 Click to attach a photo
                </div>
              )}

              {imageUploading && (
                <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
                  Uploading…
                </div>
              )}

              {imageError && (
                <div style={{ border: '2px dashed #FC8181', borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', fontSize: '0.875rem', color: '#E53E3E' }}
                  onClick={() => { setImageError(''); fileInputRef.current?.click(); }}>
                  ⚠ {imageError} — click to retry
                </div>
              )}

              {imagePreview && !imageUploading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}>
                  <img src={imagePreview} alt="preview" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {imageUrl ? '✓ Uploaded' : 'Processing…'}
                  </div>
                  <button type="button" onClick={removeImage} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1, padding: 4 }}>✕</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); removeImage(); }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || imageUploading}>
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, marginBottom: 20 }}>My Reports</h3>
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : myIssues.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-icon">✅</div>
            <h3>No issues reported</h3>
            <p>Click "+ New Report" to report a problem with a resource.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Resource</th>
                  <th>Photo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myIssues.map(i => (
                  <tr key={i.id}>
                    <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{i.id}</td>
                    <td><span style={{ fontWeight: 600 }}>{i.category}</span></td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.description}</td>
                    <td>#{i.resourceId}</td>
                    <td><PhotoThumb url={i.imageUrl} onOpen={setLightboxUrl} /></td>
                    <td>{statusBadge(i.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
