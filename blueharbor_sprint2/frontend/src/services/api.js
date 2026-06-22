// frontend/src/services/api.js
const API_URL = 'http://localhost:5000/api';

// ... (getShips e createShip già esistenti)

// ✅ Ottieni tutte le navi con filtro per stato
export const getShipsByStatus = async (status) => {
  try {
    const response = await fetch(`${API_URL}/ships?status=${status}`);
    if (!response.ok) {
      throw new Error(`Errore nel caricamento delle navi con status ${status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Errore getShipsByStatus:', error);
    throw error;
  }
};

// ✅ Ottieni le berths (posti barca)
export const getBerths = async () => {
  try {
    const response = await fetch(`${API_URL}/berths`);
    if (!response.ok) {
      throw new Error('Errore nel caricamento delle berths');
    }
    return await response.json();
  } catch (error) {
    console.error('Errore getBerths:', error);
    throw error;
  }
};

// ✅ Assegna una nave a una berth
export const assignShipToBerth = async (shipId, berthId) => {
  try {
    const response = await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shipId, berthId }),
    });
    
    if (!response.ok) {
      throw new Error('Errore nell\'assegnazione della nave');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Errore assignShipToBerth:', error);
    throw error;
  }
};

// ✅ Ottieni le assegnazioni attuali
export const getAssignments = async () => {
  try {
    const response = await fetch(`${API_URL}/assignments`);
    if (!response.ok) {
      throw new Error('Errore nel caricamento delle assegnazioni');
    }
    return await response.json();
  } catch (error) {
    console.error('Errore getAssignments:', error);
    throw error;
  }
};