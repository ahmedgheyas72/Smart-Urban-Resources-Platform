import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resources, bookings, issues } from '../api/client';
import { useAuth } from '../context/AuthContext';

function fmt(dt) {
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function ProviderDashboard({ user }) {
  const [myResources, setMyResources] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await resources.getMy().catch(() => []);
        const list = res || [];
        setMyResources(list);

        if (list.length > 0) {
          const bookingResults = await Promise.allSettled(
            list.map(r => bookings.getAllForResource(r.resourceId))
          );
          const combined = bookingResults.flatMap((result, idx) => {
            if (result.status !== 'fulfilled') return [];
            return (result.value || []).map(b => ({
              ...b,
              resourceName: list[idx].name,
              resourceId: list[idx].resourceId,
            }));
          });
          combined.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
          setAllBookings(combined);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  const availableCount = myResources.filter(r => r.available).length;
  const activeBookings = allBookings.filter(b => b.status === 'ACTIVE' || b.status === 'CONFIRMED');

  const bookingCountByResource = {};
  allBookings.forEach(b => {
    bookingCountByResource[b.resourceId] = (bookingCountByResource[b.resourceId] || 0) + 1;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {firstName}.</h1>
          <p className="page-subtitle">Here's an overview of your listed resources and bookings.</p>
        </div>
        <Link to="/my-resources" className="btn btn-primary">Manage Resources</Link>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">My Resources</div>
          <div className="stat-value">{myResources.length}</div>
          <div className="stat-sub">{availableCount} available</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{allBookings.length}</div>
          <div className="stat-sub">across all resources</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Bookings</div>
          <div className="stat-value">{activeBookings.length}</div>
          <div className="stat-sub">currently confirmed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unavailable</div>
          <div className="stat-value">{myResources.length - availableCount}</div>
          <div className="stat-sub">resources offline</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: My Resources summary */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: '1.1rem' }}>My Resources</h3>
            <Link to="/my-resources" className="btn btn-ghost btn-sm">Manage →</Link>
          </div>
          {myResources.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">🏗</div>
              <h3>No resources yet</h3>
              <p>Add your first resource to start receiving bookings.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {myResources.slice(0, 6).map(r => (
                <div key={r.resourceId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                      {r.type?.replace(/_/g, ' ')} · {r.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>
                      {bookingCountByResource[r.resourceId] || 0} bookings
                    </div>
                    <span className={`badge ${r.available ? 'badge-active' : 'badge-cancelled'}`} style={{ fontSize: '0.68rem' }}>
                      {r.available ? 'Available' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Bookings on My Resources */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: '1.1rem' }}>Recent Bookings</h3>
            {allBookings.length > 0 && (
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{allBookings.length} total</span>
            )}
          </div>
          {allBookings.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">📅</div>
              <h3>No bookings yet</h3>
              <p>Once users book your resources, they'll appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {allBookings.slice(0, 5).map((b, idx) => (
                <div key={b.id ?? idx} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center', minWidth: 40 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.25rem', fontWeight: 500, lineHeight: 1 }}>
                      {new Date(b.startTime).getDate()}
                    </div>
                    <div style={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                      {new Date(b.startTime).toLocaleString('en', { month: 'short' })}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{b.resourceName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                      {new Date(b.startTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })} – {new Date(b.endTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className={`badge badge-${b.status?.toLowerCase().replace('_', '-') || 'active'}`} style={{ fontSize: '0.68rem' }}>
                    {b.status || 'ACTIVE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin, isServiceProvider } = useAuth();
  const [data, setData] = useState({ resources: [], bookings: [], issues: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isServiceProvider) { setLoading(false); return; }
    async function load() {
      try {
        const [r, b, i] = await Promise.allSettled([
          resources.getAll(),
          bookings.getActive(),
          isAdmin ? issues.getAll() : issues.getMy(),
        ]);
        setData({
          resources: r.status === 'fulfilled' ? r.value : [],
          bookings:  b.status === 'fulfilled' ? b.value : [],
          issues:    i.status === 'fulfilled' ? i.value : [],
        });
      } finally { setLoading(false); }
    }
    load();
  }, [isAdmin, isServiceProvider]);

  if (isServiceProvider) return <ProviderDashboard user={user} />;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const availableCount = data.resources.filter(r => r.available).length;

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {firstName}.</h1>
          <p className="page-subtitle">Here's what's happening across UrbanSpace today.</p>
        </div>
        <Link to="/resources" className="btn btn-primary">Browse Resources</Link>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Available Resources</div>
          <div className="stat-value">{availableCount}</div>
          <div className="stat-sub">of {data.resources.length} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Bookings</div>
          <div className="stat-value">{data.bookings.length}</div>
          <div className="stat-sub">upcoming reservations</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{isAdmin ? 'Open Issues' : 'My Issues'}</div>
          <div className="stat-value">{data.issues.length}</div>
          <div className="stat-sub">{isAdmin ? 'awaiting review' : 'reported'}</div>
        </div>
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-label">Total Resources</div>
            <div className="stat-value">{data.resources.length}</div>
            <div className="stat-sub">in the system</div>
          </div>
        )}
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: '1.1rem' }}>Upcoming Bookings</h3>
            <Link to="/bookings" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {data.bookings.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">📅</div>
              <h3>No upcoming bookings</h3>
              <p>Browse resources to make a reservation.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.bookings.slice(0, 4).map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center', minWidth: 44 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', fontWeight: 500, lineHeight: 1 }}>
                      {new Date(b.startTime).getDate()}
                    </div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                      {new Date(b.startTime).toLocaleString('en', { month: 'short' })}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {data.resources.find(r => r.resourceId === b.resourceId)?.name || `Resource #${b.resourceId}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {new Date(b.startTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })} – {new Date(b.endTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="badge badge-active">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: '1.1rem' }}>
              {isAdmin ? 'Recent Issues' : 'My Reports'}
            </h3>
            <Link to={isAdmin ? '/admin' : '/issues'} className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {data.issues.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-icon">✅</div>
              <h3>No issues reported</h3>
              <p>Everything looks good.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {data.issues.slice(0, 4).map(issue => (
                <div key={issue.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{issue.category}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                      {issue.description}
                    </div>
                  </div>
                  <span className={`badge badge-${issue.status?.toLowerCase().replace('_', '-') || 'submitted'}`}>
                    {issue.status || 'SUBMITTED'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
