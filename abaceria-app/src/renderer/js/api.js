const API_BASE = window.appConfig ? window.appConfig.apiURL : (window.location.origin + '/api');

function getAuthHeaders() {
  const token = localStorage.getItem('abaceria-token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

function handleAuthError(res) {
  if (res.status === 401) {
    localStorage.removeItem('abaceria-token');
    localStorage.removeItem('abaceria-user');
    window.location.hash = '#login';
    throw new Error('Sesion expirada');
  }
}

const api = {
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: getAuthHeaders(),
    });
    handleAuthError(res);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Connection error' }));
      throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    handleAuthError(res);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Connection error' }));
      throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
  },

  async put(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    handleAuthError(res);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Connection error' }));
      throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
  },

  async delete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    handleAuthError(res);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Connection error' }));
      throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
  },
};
