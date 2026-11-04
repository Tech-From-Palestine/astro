const BASE = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '') + '/api';

export function getToken() {
  try { return localStorage.getItem('astro_token'); } catch { return null; }
}
export function setToken(t) {
  try { t ? localStorage.setItem('astro_token', t) : localStorage.removeItem('astro_token'); } catch { /* ignore */ }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'حدث خطأ غير متوقع');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b ?? {}),
  patch: (p, b) => request('PATCH', p, b ?? {}),
  del: (p) => request('DELETE', p),
};

export const qs = (obj) => {
  const s = new URLSearchParams(Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined && v !== null && v !== false));
  const str = s.toString();
  return str ? `?${str}` : '';
};
