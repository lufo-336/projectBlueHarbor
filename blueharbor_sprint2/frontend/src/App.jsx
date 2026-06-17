import { RoleProvider, useRole } from './context/RoleContext'
import Topbar from './components/Topbar'
import './App.css'

function Content() {
  const { role } = useRole()
  return (
    <main className="content">
      <p>
        Benvenuto in BlueHarbor Terminal. Ruolo attivo: <strong>{role}</strong>.
      </p>
    </main>
  )
}

function App() {
  return (
    <RoleProvider>
      <Topbar />
      <Content />
    </RoleProvider>
  )
}

export default App
