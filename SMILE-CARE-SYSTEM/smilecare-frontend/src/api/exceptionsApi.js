import { API_URL } from './api.js';

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

export async function getClinicExceptions() {
  const res = await fetch(`${API_URL}/clinic-exceptions`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch exceptions');
  return res.json();
}

export async function addClinicException(date, reason) {
  const res = await fetch(`${API_URL}/clinic-exceptions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ date, reason })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to add exception' }));
    throw new Error(errorData.error || 'Failed to add exception');
  }
  
  return res.json();
}

export async function deleteClinicException(id) {
  const res = await fetch(`${API_URL}/clinic-exceptions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete exception');
}
