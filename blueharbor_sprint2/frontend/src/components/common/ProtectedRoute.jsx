// frontend/src/components/common/ProtectedRoute.jsx
import React from 'react';
import { useRole } from '../../context/RoleContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, allowedRoles, fallback }) => {
  const { role } = useRole();

  if (!allowedRoles.includes(role)) {
    return fallback || (
      <div className="protected-route__restricted">
        <div className="protected-route__content">
          <span className="protected-route__icon">🔒</span>
          <h2>Accesso Non Autorizzato</h2>
          <p>Questa sezione è riservata a: <strong>{allowedRoles.join(' / ')}</strong></p>
          <p className="protected-route__role">Il tuo ruolo attuale: <strong>{role}</strong></p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;