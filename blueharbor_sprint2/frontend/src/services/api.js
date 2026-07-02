// frontend/src/services/api.js
// ✅ VERSIONE CON INTERCETTORI PER 401

const API_BASE_URL = '/api';

// Helper per ottenere il token
const getAuthToken = () => localStorage.getItem('authToken');

// Helper per gestire le risposte
const handleResponse = async (response) => {
  // ✅ INTERCETTA 401 - SESSIONE SCADUTA!
  if (response.status === 401) {
    // Rimuovi token scaduto
    localStorage.removeItem('authToken');
    // Reindirizza al login
    window.location.href = '/';
    throw new Error('Sessione scaduta. Effettua di nuovo il login.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || 'Errore durante la richiesta');
  }

  return response.json();
};

// Helper per fare richieste autenticate
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
};

// ============================================================
// API ENDPOINTS
// ============================================================

// ✅ LOGIN
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

// ✅ LOGOUT
export const logout = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
};

// ✅ GET CURRENT USER (verifica sessione)
export const getCurrentUser = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthToken() && { 'Authorization': `Bearer ${getAuthToken()}` }),
    },
  });
  return handleResponse(response);
};

// ============================================================
// SHIPS
// ============================================================

// ✅ Ottieni tutte le navi
export const getShips = async () => {
  return fetchWithAuth('/ships');
};

// ✅ Crea una nuova nave
export const createShip = async (name) => {
  return fetchWithAuth('/ships', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
};

// ============================================================
// SCHEDULER
// ============================================================

// ✅ Ottieni la dashboard dello scheduler
export const getSchedulerDashboard = async () => {
  return fetchWithAuth('/scheduler/dashboard');
};

// ✅ Assegna una nave a una berth
export const assignShip = async (shipId, berthId) => {
  return fetchWithAuth(`/ships/${shipId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ berthId }),
  });
};

// ============================================================
// DAY / TIME
// ============================================================

// ✅ Ottieni il giorno corrente
export const getCurrentDay = async () => {
  const data = await fetchWithAuth('/system/current-day');
  return data.currentDay;
};

// ✅ Avanza al giorno successivo
export const nextDay = async () => {
  const data = await fetchWithAuth('/time/next-day', {
    method: 'POST',
  });
  return data.currentDay;
};

// ============================================================
// SHIPS (OLD - da mantenere per compatibilità)
// ============================================================

// @deprecated - Usa getShips invece
export const getShipsByStatus = async (status) => {
  return fetchWithAuth(`/ships?status=${status}`);
};

// @deprecated - Usa getSchedulerDashboard invece
export const getBerths = async () => {
  return fetchWithAuth('/berths');
};

// @deprecated - Usa getSchedulerDashboard invece
export const getAssignments = async () => {
  return fetchWithAuth('/assignments');
};