import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  {
    id: 'citizen',
    label: 'Citizen',
    description: 'Book public resources and report issues',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    id: 'provider',
    label: 'Service Provider',
    description: 'List and manage your own resources',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  },
];

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('citizen');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    try {
      const role = selectedRole === 'provider' ? 'SERVICE_PROVIDER' : 'CITIZEN';
      const res = await auth.register({ ...form, role });
      login({ fullName: res.fullName, email: res.email, role: res.role }, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>UrbanSpace</h1>
          <p>Smart Urban Resources Platform</p>
        </div>
        <div className="auth-tagline">
          <blockquote>"Book parks, courts, and public spaces — all in one place."</blockquote>
          <cite>— Sharjah Smart City Initiative</cite>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <h2>Create account</h2>
          <p>Join UrbanSpace to book and manage city resources.</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Ahmed Al-Rashid"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 4 }}>
              <label className="form-label">Register as</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                {ROLE_OPTIONS.map(opt => {
                  const active = selectedRole === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedRole(opt.id)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: 8,
                        border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        background: active ? 'var(--accent-lt)' : 'var(--surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ color: active ? 'var(--accent)' : 'var(--muted)', marginBottom: 6 }}>{opt.icon}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{opt.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.4 }}>{opt.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="auth-divider"><span>Already have an account?</span></div>
          <Link to="/login" className="btn btn-outline w-full" style={{ justifyContent: 'center' }}>
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
