// ═══ SPRINT 2 ═══
// L'operatore inserisce SOLO il nome: size/arrivo/durata li genera il server.
import { useState } from 'react';
import { createShip } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ShipForm({ onCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // bottone disabilitato: niente doppi submit (Sprint 5)
    try {
      const ship = await createShip(name.trim());
      showSuccess(`"${ship.name}" registrata: ${ship.size}, arrivo g.${ship.arrivalDay}, ${ship.duration} giorni`);
      setName('');
      onCreated(); // la tabella si ricarica
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ship-form">
      <label htmlFor="ship-name">Nome della nave</label>
      <input id="ship-name" value={name} maxLength={100}
             onChange={(e) => setName(e.target.value)} required />
      <button type="submit" disabled={loading || !name.trim()}>
        {loading ? 'Registrazione…' : 'Registra'}
      </button>
    </form>
  );
}
