// ═══ SPRINT 1 (auth SPRINT 6, errori SPRINT 7) ═══
// UNICO punto di accesso all'API: nessun componente chiama fetch direttamente.
// - credentials 'include': il cookie di sessione viaggia con ogni chiamata.
// - su 401 avvisa l'AuthContext (sessione scaduta → si torna al login).
// - legge il body ProblemDetails per messaggi di errore specifici.

let onUnauthorized = null;
// L'AuthContext registra qui cosa fare quando il server risponde 401.
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (response.status === 401 && onUnauthorized) onUnauthorized();

  if (!response.ok) {
    // ProblemDetails (RFC 7807): detail > title > status generico.
    let message = `Errore ${response.status}`;
    try {
      const problem = await response.json();
      message = problem.detail || problem.title || message;
    } catch { /* body non JSON: teniamo il messaggio generico */ }
    throw new Error(message);
  }

  if (response.status === 204) return null; // logout: nessun body
  return response.json();
}

// --- Auth (Sprint 6) ---
export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: { username, password } });
export const logout = () => request('/auth/logout', { method: 'POST' });
export const fetchMe = () => request('/auth/me');

// --- Sistema e tempo (Sprint 1 e 4) ---
export const getCurrentDay = () => request('/system/current-day');
export const nextDay = () => request('/time/next-day', { method: 'POST' });

// --- Navi (Sprint 2, paginazione Sprint 7) ---
export const getShips = ({ status = '', page = 1, pageSize = 10 } = {}) =>
  request(`/ships?status=${status}&page=${page}&pageSize=${pageSize}`);
export const createShip = (name) =>
  request('/ships', { method: 'POST', body: { name } });

// --- Scheduler (Sprint 3) e storico (Sprint 8) ---
export const assignShip = (shipId, berthId) =>
  request(`/ships/${shipId}/assign`, { method: 'POST', body: { berthId } });
export const getDashboard = () => request('/scheduler/dashboard');
export const getHistory = ({ berthId = '', shipId = '' } = {}) =>
  request(`/history?berthId=${berthId}&shipId=${shipId}`);
