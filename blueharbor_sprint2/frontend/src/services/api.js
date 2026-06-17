// Punto unico di accesso alle API del backend.
const BASE_URL = '/api'

/**
 * Legge il giorno corrente virtuale dal backend.
 * @returns {Promise<number>} il numero del giorno corrente
 */
export async function getCurrentDay() {
  const response = await fetch(`${BASE_URL}/system/current-day`)
  if (!response.ok) {
    throw new Error(`Errore ${response.status} nel recupero del giorno corrente`)
  }
  const data = await response.json()
  return data.currentDay
}
