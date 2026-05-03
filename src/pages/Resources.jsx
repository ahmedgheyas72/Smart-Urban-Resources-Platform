import { useEffect, useState } from 'react';
import { resources, bookings } from '../api/client';
import { useAuth } from '../context/AuthContext';

function formatType(t) {
  return t.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
}

const PILL_STYLES = {
  SPORTS_COURT:     { bg: '#E8F5E9', color: '#2E7D32', darkBg: 'rgba(46,125,50,0.15)',    glow: [46,  125, 50]  },
  LIBRARY:          { bg: '#E3F2FD', color: '#1565C0', darkBg: 'rgba(21,101,192,0.15)',   glow: [21,  101, 192] },
  PARK:             { bg: '#F3E5F5', color: '#6A1B9A', darkBg: 'rgba(106,27,154,0.15)',   glow: [106, 27,  154] },
  COMMUNITY_CENTER: { bg: '#FFF3E0', color: '#E65100', darkBg: 'rgba(230,81,0,0.15)',     glow: [230, 81,  0]   },
  PARKING:          { bg: '#FCE4EC', color: '#880E4F', darkBg: 'rgba(136,14,79,0.15)',    glow: [136, 14,  79]  },
};
const DEFAULT_PILL = { bg: '#F5F5F5', color: '#424242', darkBg: 'rgba(66,66,66,0.2)', glow: [13, 115, 119] };

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:00 ${period}`;
}

function generateSlots(openingTime, closingTime) {
  if (!openingTime || !closingTime) return [];
  const openHour  = parseInt(String(openingTime).split(':')[0], 10);
  const closeHour = parseInt(String(closingTime).split(':')[0], 10);
  if (isNaN(openHour) || isNaN(closeHour) || closeHour <= openHour) return [];
  const slots = [];
  for (let h = openHour; h < closeHour; h++) slots.push(h);
  return slots;
}

function isHourBooked(hour, bookedRanges, date) {
  const pad = n => String(n).padStart(2, '0');
  const slotStart = new Date(`${date}T${pad(hour)}:00:00`);
  const slotEnd   = new Date(`${date}T${pad(hour + 1)}:00:00`);
  return bookedRanges.some(b => new Date(b.startTime) < slotEnd && new Date(b.endTime) > slotStart);
}

function getCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function BookingModal({ resource, onClose, onSuccess }) {
  const hasSlots = !!(resource.openingTime && resource.closingTime);
  const slots    = generateSlots(resource.openingTime, resource.closingTime);

  const todayObj  = new Date();
  const todayStr  = todayObj.toISOString().split('T')[0];

  const [viewYear,      setViewYear]      = useState(todayObj.getFullYear());
  const [viewMonth,     setViewMonth]     = useState(todayObj.getMonth());
  const [selectedDate,  setSelectedDate]  = useState(null);
  const [confirmingHour,setConfirmingHour]= useState(null);
  const [hoveredSlot,   setHoveredSlot]   = useState(null);
  const [myBookings,    setMyBookings]    = useState([]);
  const [form,          setForm]          = useState({ startTime: '', endTime: '' });
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    bookings.getMy()
      .then(data => setMyBookings(Array.isArray(data) ? data : []))
      .catch(() => setMyBookings([]));
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(day) {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    if (dateStr < todayStr) return;
    setSelectedDate(dateStr);
    setConfirmingHour(null);
  }

  async function handleConfirm(hour) {
    const pad = n => String(n).padStart(2, '0');
    const startTime = `${selectedDate}T${pad(hour)}:00`;
    const endTime   = `${selectedDate}T${pad(hour + 1)}:00`;
    setError(''); setLoading(true);
    try {
      await bookings.create({ resourceId: resource.resourceId, startTime, endTime });
      onSuccess();
    } catch (err) { setError(err.message); setLoading(false); }
  }

  async function handleFallbackBook(e) {
    e.preventDefault();
    if (!form.startTime || !form.endTime) { setError('Please select both start and end times.'); return; }
    if (new Date(form.startTime) >= new Date(form.endTime)) { setError('End time must be after start time.'); return; }
    if (new Date(form.startTime) < new Date()) { setError('Start time cannot be in the past.'); return; }
    setError(''); setLoading(true);
    try {
      await bookings.create({ resourceId: resource.resourceId, startTime: form.startTime, endTime: form.endTime });
      onSuccess();
    } catch (err) { setError(err.message); setLoading(false); }
  }

  const calDays = getCalendarDays(viewYear, viewMonth);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700, padding: 0, overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ padding: '22px 28px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 className="modal-title">Book {resource.name}</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
            <span>📍 {resource.location}</span>
            {resource.openingTime && <span>🕐 {resource.openingTime} – {resource.closingTime}</span>}
            <span>👥 Capacity {resource.capacity}</span>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ margin: '12px 28px 0' }}>⚠ {error}</div>}

        {hasSlots ? (
          <>
            {/* ── Two-column body ── */}
            <div className="booking-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 340 }}>

              {/* Left: Calendar */}
              <div style={{ padding: '24px 16px 24px 28px', borderRight: '1px solid var(--border)' }}>
                {/* Month nav */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '2px 8px', borderRadius: 6, fontSize: '1.1rem', lineHeight: 1 }}>‹</button>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
                  <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '2px 8px', borderRadius: 6, fontSize: '1.1rem', lineHeight: 1 }}>›</button>
                </div>

                {/* Day-of-week headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
                  {DAY_HEADERS.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)', padding: '0 0 6px' }}>{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}>
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const dateStr    = toDateStr(viewYear, viewMonth, day);
                    const isPast     = dateStr < todayStr;
                    const isToday    = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    return (
                      <button
                        key={day}
                        onClick={() => !isPast && handleDayClick(day)}
                        style={{
                          width: 32, height: 32,
                          borderRadius: '50%',
                          border: isToday && !isSelected ? '2px solid #0D7377' : '2px solid transparent',
                          background: isSelected ? '#0D7377' : 'transparent',
                          color: isSelected ? '#fff' : isPast ? 'var(--muted)' : 'var(--text)',
                          opacity: isPast ? 0.3 : 1,
                          cursor: isPast ? 'default' : 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: isSelected || isToday ? 600 : 400,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Time slots */}
              <div style={{ padding: '24px 28px 8px 20px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {selectedDate ? (
                  <>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 12, color: 'var(--text)' }}>
                      {new Date(selectedDate + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="slots-container" style={{ overflowY: 'auto', maxHeight: 290, display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {slots.map(hour => {
                        const booked      = isHourBooked(hour, myBookings, selectedDate);
                        const isPast      = new Date(`${selectedDate}T${String(hour).padStart(2,'0')}:00`) < new Date();
                        const isConfirm   = confirmingHour === hour;
                        const isHovered   = hoveredSlot === hour;
                        const disabled    = booked || isPast;
                        return (
                          <div
                            key={hour}
                            onClick={() => !disabled && setConfirmingHour(isConfirm ? null : hour)}
                            onMouseEnter={() => !disabled && setHoveredSlot(hour)}
                            onMouseLeave={() => setHoveredSlot(null)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: isConfirm ? 'space-between' : 'center',
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: booked
                                ? '1.5px solid #FED7D7'
                                : isConfirm
                                  ? '1.5px solid #0D7377'
                                  : isHovered
                                    ? '1.5px solid #0D7377'
                                    : '1.5px solid var(--border)',
                              background: booked
                                ? '#FFF5F5'
                                : isConfirm
                                  ? 'rgba(13,115,119,0.07)'
                                  : 'var(--surface)',
                              cursor: disabled ? 'default' : 'pointer',
                              opacity: isPast && !booked ? 0.38 : 1,
                              transition: 'border-color 0.15s, background 0.15s',
                              flexShrink: 0,
                            }}
                          >
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: booked ? '#FC8181' : 'var(--text)' }}>
                              {formatHour(hour)}
                              {booked && <span style={{ fontSize: '0.72rem', color: '#FC8181', marginLeft: 8, fontWeight: 400 }}>Unavailable</span>}
                            </span>
                            {isConfirm && (
                              <button
                                onClick={e => { e.stopPropagation(); handleConfirm(hour); }}
                                disabled={loading}
                                style={{
                                  background: '#0D7377', color: 'white',
                                  border: 'none', borderRadius: 6,
                                  padding: '6px 18px',
                                  fontSize: '0.82rem', fontWeight: 600,
                                  cursor: loading ? 'not-allowed' : 'pointer',
                                  flexShrink: 0,
                                }}
                              >
                                {loading ? '…' : 'Confirm'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center', padding: '0 12px' }}>
                    Select a date to see available time slots
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer ── */}
            <div style={{ padding: '14px 28px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          /* Fallback: resource has no opening hours */
          <form onSubmit={handleFallbackBook} style={{ padding: '20px 28px' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start time</label>
                <input className="form-input" type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">End time</label>
                <input className="form-input" type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Booking…' : 'Confirm Booking'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Resources() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [booking, setBooking] = useState(null);
  const [success, setSuccess] = useState('');
  const [hoveredPill, setHoveredPill] = useState(null);
  const dark = useDarkMode();

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (availFilter !== '') params.available = availFilter === 'true';
      const data = await resources.getAll(params);
      setList(data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [availFilter]);

  const categories = [...new Set(list.map(r => r.type).filter(Boolean))];

  const filtered = list.filter(r => {
    const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase()) || r.location?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || r.type === categoryFilter;
    return matchSearch && matchCategory;
  });

  function handleBookingSuccess() {
    setBooking(null);
    setSuccess('Booking confirmed! View it in My Bookings.');
    setTimeout(() => setSuccess(''), 4000);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="page-subtitle">Browse and book available city spaces and facilities.</p>
        </div>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}

      <div style={{ display: 'flex', gap: 8, overflow: 'visible', flexWrap: 'wrap', padding: '8px 4px', marginBottom: 16 }}>
        {['', ...categories].map((cat, index) => {
          const key      = cat || '__all';
          const active   = categoryFilter === cat;
          const hovered  = hoveredPill === key;
          const palette  = cat ? (PILL_STYLES[cat] || DEFAULT_PILL) : DEFAULT_PILL;
          const [r, g, b] = palette.glow;

          const activeBg     = cat ? palette.color : '#0D7377';
          const inactiveBg   = dark ? palette.darkBg : palette.bg;
          const glowStrong   = `rgba(${r},${g},${b},0.6)`;
          const glowSoft     = `rgba(${r},${g},${b},0.3)`;
          const glowHoverSt  = `rgba(${r},${g},${b},0.3)`;
          const glowHoverSf  = `rgba(${r},${g},${b},0.15)`;
          const borderColor  = `rgba(${r},${g},${b},0.4)`;

          return (
            <button
              key={key}
              onClick={() => setCategoryFilter(cat)}
              onMouseEnter={() => setHoveredPill(key)}
              onMouseLeave={() => setHoveredPill(null)}
              style={{
                flexShrink: 0,
                padding: '6px 16px',
                borderRadius: 10,
                border: active
                  ? `1.5px solid ${activeBg}`
                  : `1.5px solid ${borderColor}`,
                background: active ? activeBg : inactiveBg,
                color: active ? '#fff' : palette.color,
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transform: !active && hovered ? 'scale(1.04)' : 'scale(1)',
                boxShadow: active
                  ? `0 0 6px ${glowStrong}, 0 0 12px ${glowSoft}`
                  : hovered
                    ? `0 0 6px ${glowHoverSt}, 0 0 10px ${glowHoverSf}`
                    : 'none',
                transition: 'all 0.2s ease',
                animation: `fadeUp 0.3s ease ${index * 0.05}s both`,
              }}
            >
              {cat ? formatType(cat) : 'All'}
            </button>
          );
        })}
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <span className="search-icon">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input className="form-input" type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => setAvailFilter(prev => prev === 'true' ? '' : 'true')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: availFilter === 'true' ? 'none' : '1px solid rgba(255,255,255,0.2)',
            background: availFilter === 'true' ? '#2E7D32' : 'transparent',
            color: availFilter === 'true' ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          ● Available
        </button>
        <button
          onClick={() => setAvailFilter(prev => prev === 'false' ? '' : 'false')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: availFilter === 'false' ? 'none' : '1px solid rgba(255,255,255,0.2)',
            background: availFilter === 'false' ? '#C62828' : 'transparent',
            color: availFilter === 'false' ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
          }}
        >
          ○ Unavailable
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏙</div>
          <h3>No resources found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(r => (
            <div key={r.resourceId} className="resource-card">
              <div className="resource-type-tag">{r.type ? formatType(r.type) : ''}</div>
              <div className="resource-name">{r.name}</div>
              <div className="resource-location">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {r.location}
              </div>
              {r.description && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>{r.description}</p>}
              <div className="resource-meta">
                <span className="resource-cap">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 4, verticalAlign: 'middle' }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  {r.capacity}
                </span>
                <span style={{ fontSize: '0.82rem' }}>
                  <span className={`avail-dot ${r.available ? 'yes' : 'no'}`} />
                  {r.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              {user && r.available && (
                <button className="btn btn-primary w-full" style={{ marginTop: 14, justifyContent: 'center' }} onClick={() => setBooking(r)}>
                  Book Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {booking && <BookingModal resource={booking} onClose={() => setBooking(null)} onSuccess={handleBookingSuccess} />}
    </div>
  );
}
