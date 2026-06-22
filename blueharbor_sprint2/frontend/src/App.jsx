// frontend/src/App.jsx
import { RoleProvider } from './context/RoleContext';
import Topbar from './components/Topbar';
import OperatorView from './components/OperatorView';
import SchedulerView from './components/SchedulerView';  // ← NUOVO IMPORT
import './App.css';

function App() {
  return (
    <RoleProvider>
      <Topbar />
      {/* Per ora mostriamo solo OperatorView o SchedulerView */}
      {/* Puoi aggiungere logica per switchare tra le viste */}
      <OperatorView />
      {/* SchedulerView è già protetto dal controllo del ruolo */}
    </RoleProvider>
  );
}

export default App;