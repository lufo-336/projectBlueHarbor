// frontend/src/components/Topbar.jsx
import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { useDay } from '../context/DayContext';
import { useToast } from '../context/ToastContext';
import { nextDay } from '../services/api';  // ← nextDay ora ritorna solo il numero
import './Topbar.css';

const Topbar = ({ onDayChange }) => {
  const { role } = useRole();
  const { currentDay, updateDay } = useDay();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const handleNextDay = async () => {
    setLoading(true);
    
    try {
      const newDay = await nextDay();  // ← Ora ritorna solo il numero (es. 2)
      updateDay(newDay);
      showSuccess(`📅 Giorno avanzato al ${newDay}!`);
      if (onDayChange) {
        onDayChange();
      }
    } catch (err) {
      showError(`❌ Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ... resto del componente invariato
};

export default Topbar;