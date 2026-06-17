import { useEffect, useState } from 'react'
import { getCurrentDay } from '../services/api'
import { useRole } from '../context/RoleContext'

// Barra fissa in alto: mostra il Giorno Virtuale letto dal DB e il selettore di ruolo.
function Topbar() {
  const { role, setRole, roles } = useRole()
  const [currentDay, setCurrentDay] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getCurrentDay()
      .then(setCurrentDay)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <header className="topbar">
      <span className="topbar-brand">BlueHarbor Terminal</span>

      <span className="topbar-day">
        Giorno Virtuale: <strong>{error ? '—' : currentDay ?? '…'}</strong>
      </span>

      <label className="topbar-role">
        Ruolo:{' '}
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
    </header>
  )
}

export default Topbar
