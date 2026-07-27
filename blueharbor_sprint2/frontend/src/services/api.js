// ============================================================================
// Unico punto di accesso HTTP del frontend.
// - allega il token JWT (Authorization: Bearer ...) a ogni chiamata;
// - su risposta non-ok legge il campo `detail` del Problem Details e lancia
//   un ApiError con quel messaggio (le viste lo mostrano nei toast);
// - su 401 fuori dal login pulisce il token e avvisa AuthContext
//   (sessione scaduta -> si torna alla pagina di login).
// I percorsi sono relativi: in dev il proxy Vite li gira su https://localhost:7008.
// ============================================================================

const TOKEN_KEY = 'blueharbor_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// AuthContext registra qui cosa fare quando la sessione scade (401).
let onSessionExpired = null;
export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // Token assente/scaduto/manomesso: la sessione non è più valida.
    setToken(null);
    if (onSessionExpired) onSessionExpired();
    throw new ApiError('Sessione scaduta: effettua di nuovo il login.', 401);
  }

  if (!response.ok) {
    let detail = `Errore ${response.status}`;
    try {
      const problem = await response.json();
      if (problem && problem.detail) detail = problem.detail;
    } catch {
      // corpo non JSON: teniamo il messaggio generico
    }
    throw new ApiError(detail, response.status);
  }

  // 204 No Content (es. DELETE): nessun corpo da leggere.
  if (response.status === 204) return null;

  return response.json();
}

// Come request(), ma restituisce un Blob (per i download, es. export CSV).
// Ripete la gestione di auth/401/errori perché il corpo NON è JSON.
async function requestBlob(path) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(path, { headers });

  if (response.status === 401) {
    setToken(null);
    if (onSessionExpired) onSessionExpired();
    throw new ApiError('Sessione scaduta: effettua di nuovo il login.', 401);
  }

  if (!response.ok) {
    let detail = `Errore ${response.status}`;
    try {
      const problem = await response.json();
      if (problem && problem.detail) detail = problem.detail;
    } catch {
      // corpo non JSON: teniamo il messaggio generico
    }
    throw new ApiError(detail, response.status);
  }

  return response.blob();
}

// Costruisce una query string da un oggetto di parametri (salta vuoti/null).
function toQuery(params) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.append(key, value);
  }
  return qs.toString();
}

export const api = {
  // --- Autenticazione ---
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  // --- Navi (Operatore) ---
  // params opzionali: { status, size, page, pageSize } -> query string.
  // Risposta: { items, page, pageSize, total, totalPages, counts }.
  getShips: (params = {}) => {
    const query = toQuery(params);
    return request(query ? `/api/ships?${query}` : '/api/ships');
  },
  createShip: (name, notes) => request('/api/ships', { method: 'POST', body: { name, notes } }),
  updateShip: (shipId, name, notes) => request(`/api/ships/${shipId}`, { method: 'PUT', body: { name, notes } }),
  cancelShip: (shipId) => request(`/api/ships/${shipId}`, { method: 'DELETE' }),

  // --- Scheduler ---
  getSchedulerDashboard: () => request('/api/scheduler/dashboard'),
  assignShip: (shipId, berthId) => request(`/api/ships/${shipId}/assign`, { method: 'POST', body: { berthId } }),
  // Annulla un'assegnazione prima che l'occupazione inizi (nave -> Pending).
  unassignShip: (shipId) => request(`/api/ships/${shipId}/unassign`, { method: 'POST' }),
  // Modifica un'assegnazione (banchina + nome + note) prima dell'inizio occupazione.
  editAssignment: (shipId, berthId, name, notes) =>
    request(`/api/ships/${shipId}/assignment`, { method: 'PUT', body: { berthId, name, notes } }),

  // --- Storico assegnazioni (sola lettura) ---
  // params opzionali: { shipId, berthId, eventType }.
  getHistory: (params = {}) => {
    const query = toQuery(params);
    return request(query ? `/api/history?${query}` : '/api/history');
  },
  // Stessi filtri di getHistory, ma scarica un Blob CSV.
  exportHistoryCsv: (params = {}) => {
    const query = toQuery(params);
    return requestBlob(query ? `/api/history/export?${query}` : '/api/history/export');
  },

  // --- Tempo virtuale ---
  getCurrentDay: () => request('/api/system/current-day'),
  getSummary: () => request('/api/system/summary'),
  nextDay: () => request('/api/time/next-day', { method: 'POST' }),

  // --- Gestione accessi (ruolo Admin) ---
  adminListUsers: () => request('/api/admin/users'),
  adminCreateUser: (username, role, password) =>
    request('/api/admin/users', { method: 'POST', body: { username, role, password } }),
  // changes: sottoinsieme di { role, isActive, password }.
  adminUpdateUser: (id, changes) =>
    request(`/api/admin/users/${id}`, { method: 'PUT', body: changes }),
  adminDeactivateUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  adminResetSimulation: () => request('/api/admin/simulation/reset', { method: 'POST' }),

  // --- Manutenzioni banchina (ruolo Admin) ---
  adminListMaintenance: (berthId) => {
    const query = toQuery({ berthId });
    return request(query ? `/api/admin/maintenance?${query}` : '/api/admin/maintenance');
  },
  adminCreateMaintenance: (berthId, startDay, endDay) =>
    request('/api/admin/maintenance', { method: 'POST', body: { berthId, startDay, endDay } }),
  adminRevokeMaintenance: (id) =>
    request(`/api/admin/maintenance/${id}`, { method: 'DELETE' }),
};
