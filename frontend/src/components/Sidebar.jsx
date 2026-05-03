import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  resources: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  bookings:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  issues:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  myresources: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  admin:       <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L3 7l9 5 9-5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></svg>,
  logout:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const SunIcon = ({ active }) => (
  <svg width="15" height="15" fill="none" stroke={active ? '#F6AD55' : 'var(--muted)'} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, transition: 'stroke 0.3s ease' }}>
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2"    x2="12" y2="5"/>
    <line x1="12" y1="19"   x2="12" y2="22"/>
    <line x1="4.22" y1="4.22"   x2="6.34"  y2="6.34"/>
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
    <line x1="2"  y1="12"   x2="5"     y2="12"/>
    <line x1="19" y1="12"   x2="22"    y2="12"/>
    <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66"/>
    <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = ({ active }) => (
  <svg width="14" height="14" fill="none" stroke={active ? '#90CDF4' : 'var(--muted)'} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, transition: 'stroke 0.3s ease' }}>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, logout, isAdmin, isServiceProvider } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  function handleLogout() {
    logout();
    onClose();
    navigate('/login');
  }

  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const displayName = user?.fullName || 'User';

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>
            <Link to="/" onClick={onClose} style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'opacity 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Urban<span>Space</span>
            </Link>
          </h1>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Main</span>

        <NavLink to="/" end className={navLinkClass} onClick={onClose}>
          {icons.dashboard} Dashboard
        </NavLink>

        <NavLink to="/resources" className={navLinkClass} onClick={onClose}>
          {icons.resources} Resources
        </NavLink>

        {isServiceProvider && (
          <NavLink to="/my-resources" className={navLinkClass} onClick={onClose}>
            {icons.myresources} My Resources
          </NavLink>
        )}

        <NavLink to="/bookings" className={navLinkClass} onClick={onClose}>
          {icons.bookings} My Bookings
        </NavLink>

        <NavLink to="/issues" className={navLinkClass} onClick={onClose}>
          {icons.issues} Report Issue
        </NavLink>

        {isAdmin && (
          <>
            <span className="nav-section-label" style={{ marginTop: 8 }}>Admin</span>
            <NavLink to="/admin" className={navLinkClass} onClick={onClose}>
              {icons.admin} Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 12px', marginBottom: 10 }}>
          <SunIcon active={!dark} />
          <button
            onClick={toggleTheme}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 44, height: 24,
              borderRadius: 12,
              background: dark ? '#0D7377' : '#CBD5E0',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              padding: 0,
              transition: 'background 0.3s ease',
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3,
              left: dark ? 23 : 3,
              width: 18, height: 18,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'left 0.3s ease',
              display: 'block',
            }} />
          </button>
          <MoonIcon active={dark} />
        </div>

        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <strong>{displayName}</strong>
            <span>{user?.role}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Log out">
            {icons.logout}
          </button>
        </div>
      </div>
    </aside>
  );
}
