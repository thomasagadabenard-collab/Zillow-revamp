export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

export async function fetchAllProperties() {
  const items = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  while (items.length < total && page <= 1000) {
    const data = await api(`/api/properties?page=${page}&limit=50`);
    const batch = Array.isArray(data.items) ? data.items : [];
    items.push(...batch);
    total = Number(data.pagination?.total ?? items.length);
    if (!batch.length) break;
    page += 1;
  }
  return items;
}
