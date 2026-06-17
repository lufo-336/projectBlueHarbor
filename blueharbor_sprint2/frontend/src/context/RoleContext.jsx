import { createContext, useContext, useState } from 'react'

// Ruoli previsti dall'applicazione (vedi roadmap: Operator / Scheduler).
export const ROLES = ['Operator', 'Scheduler']

const RoleContext = createContext(null)

// Stato globale del ruolo corrente, condiviso da tutta l'app.
export function RoleProvider({ children }) {
  const [role, setRole] = useState(ROLES[0])

  return (
    <RoleContext.Provider value={{ role, setRole, roles: ROLES }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole deve essere usato dentro un RoleProvider')
  }
  return context
}
