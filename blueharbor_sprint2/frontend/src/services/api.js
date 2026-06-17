// services/api.js
const API_URL = 'http://localhost:5000/api';

export const getShips = async () => {
  try {
    const response = await fetch(`${API_URL}/ships`);
    if (!response.ok) {
      throw new Error('Errore nel caricamento delle navi');
    }
    return await response.json();
  } catch (error) {
    console.error('Errore getShips:', error);
    throw error;
  }
};

export const createShip = async (name) => {
  try {
    const response = await fetch(`${API_URL}/ships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error('Errore nella creazione della nave');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Errore createShip:', error);
    throw error;
  }
};