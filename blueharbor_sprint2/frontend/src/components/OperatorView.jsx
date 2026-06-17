import React, { useState } from "react";
import ShipForm from './ShipForm';
import ShipTable from './ShipTable';
import { useRole } from '../context/RoleContext';

const OperatorView = () => {
  const { role } = useRole();
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Controllo del ruolo
  if (role !== 'Operator') {
    return null;
  }

  const refreshTable = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="operator-view">
      {/* Form di registrazione sopra */}
      <div className="operator-view__form-section">
        <ShipForm onShipCreated={refreshTable} />
      </div>
      {/* Tabella storico sotto */}
      <div className="operator-view__table-section">
        <ShipTable refreshCounter={refreshCounter} />
      </div>
    </div>
  );
};

export default OperatorView;