import React from 'react';
import { useRole } from '../../context/RoleContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { role } = useRole();
  if (!allowedRoles.includes(role)) return null;
  return <>{children}</>;
}
