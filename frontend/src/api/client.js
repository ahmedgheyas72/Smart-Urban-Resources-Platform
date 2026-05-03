const BASE = '';

const AUTH_URL = 'https://smarturban-auth-a2d9dkahdzcwaser.uaenorth-01.azurewebsites.net';
const RESOURCE_URL = 'https://smarturban-resource-cvdgfzf7g5azhuce.uaenorth-01.azurewebsites.net';
const BOOKING_URL = 'https://smarturban-booking-bgevemc2h9eteabf.uaenorth-01.azurewebsites.net';
const ISSUE_URL = 'https://smarturban-issue-ekang8fkdxffaqgs.uaenorth-01.azurewebsites.net';

function getToken() {
  return localStorage.getItem('token');
}

async function request(baseUrl, path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(baseUrl + path, { ...options, headers });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const data = await res.json(); msg = data.message || data.error || msg; } catch (_) {}
    throw new Error(msg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Auth
export const auth = {
  register: (body) => request(AUTH_URL, '/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request(AUTH_URL, '/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
};

// Resources
export const resources = {
  getAll:   (params = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v != null && v !== '')));
    return request(RESOURCE_URL, `/api/resources${q.toString() ? '?' + q : ''}`);
  },
  getMy:    ()     => request(RESOURCE_URL, '/api/resources/my'),
  getById:  (id)   => request(RESOURCE_URL, `/api/resources/${id}`),
  create:   (body) => request(RESOURCE_URL, '/api/resources', { method: 'POST', body: JSON.stringify(body) }),
  update:   (id, body) => request(RESOURCE_URL, `/api/resources/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:   (id)   => request(RESOURCE_URL, `/api/resources/${id}`, { method: 'DELETE' }),
};

// Bookings
export const bookings = {
  create:         (body) => request(BOOKING_URL, '/api/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getMy:          ()     => request(BOOKING_URL, '/api/bookings/my'),
  getActive:      ()     => request(BOOKING_URL, '/api/bookings/my/active'),
  getHistory:     ()     => request(BOOKING_URL, '/api/bookings/my/history'),
  getById:        (id)   => request(BOOKING_URL, `/api/bookings/${id}`),
  getForResource:    (resourceId, date) => request(BOOKING_URL, `/api/bookings?resourceId=${resourceId}&date=${date}`),
  getAllForResource:  (resourceId)       => request(BOOKING_URL, `/api/bookings?resourceId=${resourceId}`),
  update:         (id, body) => request(BOOKING_URL, `/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  cancel:         (id)   => request(BOOKING_URL, `/api/bookings/${id}`, { method: 'DELETE' }),
};

// Issues
export const issues = {
  create:       (body) => request(ISSUE_URL, '/api/issues', { method: 'POST', body: JSON.stringify(body) }),
  getMy:        ()     => request(ISSUE_URL, '/api/issues/my'),
  getAll:       ()     => request(ISSUE_URL, '/api/issues'),
  updateStatus: (id, status) => request(ISSUE_URL, `/api/issues/${id}/status?status=${status}`, { method: 'PUT' }),
  uploadImage: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${ISSUE_URL}/api/issues/upload-image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
