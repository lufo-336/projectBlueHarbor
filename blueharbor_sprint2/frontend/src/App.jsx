import { RoleProvider, useRole } from './context/RoleContext'
import Topbar from './components/Topbar'
import OperatorView from './components/OperatorView'
import './App.css'

function App() {
  return (
    <RoleProvider>
      <Topbar />
      <OperatorView /> 
    </RoleProvider>
  )
}

export default App