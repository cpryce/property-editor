const BASE = '/api/properties';

export async function getAll({ page = 1, limit = 10, sortBy = 'updatedAt', sortDir = 'desc' } = {}) {
  const res = await fetch(`${BASE}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortDir=${sortDir}`);
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json(); // { properties, total, page, limit, sortBy, sortDir }
}

export async function getOne(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch property');
  return res.json();
}

export async function create(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create property');
  return res.json();
}

export async function update(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update property');
  return res.json();
}

export async function remove(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete property');
}
