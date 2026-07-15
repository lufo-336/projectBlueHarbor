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

  return response.json();
}

export const api = {
  // --- Autenticazione ---
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  // --- Navi (Operatore) ---
  getShips: () => request('/api/ships'),
  createShip: (name) => request('/api/ships', { method: 'POST', body: { name } }),

  // --- Scheduler ---
  getSchedulerDashboard: () => request('/api/scheduler/dashboard'),
  assignShip: (shipId, berthId) => request(`/api/ships/${shipId}/assign`, { method: 'POST', body: { berthId } }),

  // --- Tempo virtuale ---
  getCurrentDay: () => request('/api/system/current-day'),
  nextDay: () => request('/api/time/next-day', { method: 'POST' }),
};
