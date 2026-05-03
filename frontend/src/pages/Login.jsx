import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import logoSrc from '../assets/logo.svg';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await auth.login(form);
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

      {/* ── Left panel ── */}
      <div className="auth-left" style={{
        background: 'radial-gradient(ellipse at center, #0f8a8f 0%, #0a5c5f 60%, #063d3f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        padding: '56px 40px',
      }}>
        <img
          src={logoSrc}
          alt="UrbanSpace"
          style={{
            width: '80%',
            maxWidth: 320,
            filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.3))',
            animation: 'logoEntrance 0.6s ease forwards',
          }}
        />
        <p style={{
          color: 'rgba(255,255,255,0.85)',
          fontStyle: 'italic',
          fontSize: 16,
          marginTop: 24,
          textAlign: 'center',
          lineHeight: 1.6,
          maxWidth: 280,
          animation: 'logoEntrance 0.6s ease 0.2s both',
        }}>
          Connecting citizens to the spaces that shape their city.
        </p>

        <style>{`
          @keyframes logoEntrance {
            from { opacity: 0; transform: scale(0.92); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>

      {/* ── Right panel (form unchanged) ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {/* Logo shown above form on mobile only */}
          <div className="login-mobile-logo">
            <img src={logoSrc} alt="UrbanSpace" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          </div>

          <h2>Welcome back</h2>
          <p>Sign in to access your bookings and resources.</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
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
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-divider"><span>New to UrbanSpace?</span></div>
          <Link to="/register" className="btn btn-outline w-full" style={{ justifyContent: 'center' }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
