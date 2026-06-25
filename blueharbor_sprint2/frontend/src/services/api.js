// frontend/src/services/api.js
// ✅ VERSIONE AGGIORNATA CON I NUOVI ENDPOINT

// ✅ Ottieni il giorno corrente (NUOVO ENDPOINT)
export const getCurrentDay = async () => {
  try {
    const response = await fetch('/api/system/current-day');
    if (!response.ok) {
      throw new Error('Errore nel caricamento del giorno corrente');
    }
    const data = await response.json();
    return data.currentDay;  // ← Il backend ritorna solo il numero
  } catch (error) {
    console.error('Errore getCurrentDay:', error);
    throw error;
  }
};

// ✅ Avanza al giorno successivo (NUOVO ENDPOINT)
export const nextDay = async () => {
  try {
    const response = await fetch('/api/time/next-day', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Errore nell\'avanzamento del giorno');
    }
    
    const data = await response.json();
    return data.currentDay;  // ← Il backend ritorna { currentDay: 2 }
  } catch (error) {
    console.error('Errore nextDay:', error);
    throw error;
  }
};

// ✅ Ottieni la dashboard dello scheduler (NUOVO - SOSTITUISCE 3 CHIAMATE!)
export const getSchedulerDashboard = async () => {
  try {
    const response = await fetch('/api/scheduler/dashboard');
    if (!response.ok) {
      throw new Error('Errore nel caricamento della dashboard');
    }
    return await response.json();
  } catch (error) {
    console.error('Errore getSchedulerDashboard:', error);
    throw error;
  }
};

// ✅ Assegna una nave a una berth (NUOVO ENDPOINT)
export const assignShip = async (shipId, berthId) => {
  try {
    const response = await fetch(`/api/ships/${shipId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ berthId }),
    });
    
    if (!response.ok) {
      // Leggi il detail dell'errore dal backend
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Errore nell\'assegnazione');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Errore assignShip:', error);
    throw error;
  }
};
