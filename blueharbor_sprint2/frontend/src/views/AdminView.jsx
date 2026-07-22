import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ROLES, ROLE_LABELS } from '../services/roles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDay } from '../context/DayContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import OperatorView from './OperatorView.jsx';
import SchedulerView from './SchedulerView.jsx';
import './AdminView.css';

// L'Admin può gestire gli accessi (tab Utenti) e operare come Operatore/Scheduler
// (le stesse viste, riusate). Nessun potere di dominio aggiuntivo: sono gli
// endpoint esistenti, che ora accettano anche il ruolo Admin.
export default function AdminView() {
  const [tab, setTab] = useState('users');
  return (
    <div className="admin">
      <nav className="admin__tabs" aria-label="Sezioni Admin">
        <button className={tab === 'users' ? 'is-active' : ''} onClick={() => setTab('users')}>Gestione utenti</button>
        <button className={tab === 'operator' ? 'is-active' : ''} onClick={() => setTab('operator')}>Vista Operatore</button>
        <button className={tab === 'scheduler' ? 'is-active' : ''} onClick={() => setTab('scheduler')}>Vista Scheduler</button>
      </nav>
      {tab === 'users' && (<><UserManagement /><SimulationTools /></>)}
      {tab === 'operator' && <OperatorView />}
      {tab === 'scheduler' && <SchedulerView />}
    </div>
  );
}

function UserManagement() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState(null); // null = primo caricamento
  const [form, setForm] = useState({ username: '', role: 'Operator', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setUsers(await api.adminListUsers());
    } catch (err) {
      showError(err.message);
      setUsers([]);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(event) {
    event.preventDefault();
    const username = form.username.trim();
    if (!username || !form.password) return;
    setSubmitting(true);
    try {
      await api.adminCreateUser(username, form.role, form.password);
      showSuccess(`Utente ${username} creato.`);
      setForm({ username: '', role: 'Operator', password: '' });
      await load();
    } catch (err) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(u, role) {
    if (role === u.role) return;
    setBusyId(u.id);
    try {
      await api.adminUpdateUser(u.id, { role });
      showSuccess(`Ruolo di ${u.username} → ${ROLE_LABELS[role]}.`);
    } catch (err) {
      showError(err.message);
    } finally {
      setBusyId(null);
      await load(); // riallinea la select (anche in caso di 409 dal guardrail)
    }
  }

  async function toggleActive(u) {
    setBusyId(u.id);
    try {
      if (u.isActive) {
        await api.adminDeactivateUser(u.id);
        showSuccess(`${u.username} disattivato.`);
      } else {
        await api.adminUpdateUser(u.id, { isActive: true });
        showSuccess(`${u.username} riattivato.`);
      }
      await load();
    } catch (err) {
      showError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(u) {
    const pwd = window.prompt(`Nuova password per ${u.username}:`);
    if (pwd === null) return; // annullato
    if (!pwd.trim()) { showError('La password non può essere vuota.'); return; }
    setBusyId(u.id);
    try {
      await api.adminUpdateUser(u.id, { password: pwd });
      showSuccess(`Password di ${u.username} reimpostata.`);
    } catch (err) {
      showError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (users === null) return <LoadingSpinner />;

  return (
    <>
      <section className="card">
        <h2>Nuovo utente</h2>
        <form className="admin__form" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="new-username">Username</label>
            <input id="new-username" value={form.username}
                   onChange={(e) => setForm({ ...form, username: e.target.value })}
                   placeholder="es. mario@blueharbor" required />
          </div>
          <div className="field">
            <label htmlFor="new-role">Ruolo</label>
            <select id="new-role" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="new-password">Password iniziale</label>
            <input id="new-password" type="password" value={form.password}
                   onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creo…' : 'Crea utente'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Utenti</h2>
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr><th>Username</th><th>Ruolo</th><th>Stato</th><th>Azioni</th></tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.username === user.email;
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} className={u.isActive ? '' : 'is-inactive'}>
                    <td>{u.username}{isSelf && <span className="admin__you"> (tu)</span>}</td>
                    <td>
                      <select value={u.role} disabled={busy || isSelf}
                              onChange={(e) => changeRole(u, e.target.value)}>
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-assigned' : 'badge-departed'}`}>
                        {u.isActive ? 'Attivo' : 'Disattivato'}
                      </span>
                    </td>
                    <td className="admin__actions">
                      <button type="button" className="btn btn-ghost btn-sm" disabled={busy}
                              onClick={() => resetPassword(u)}>
                        Reset password
                      </button>
                      <button type="button" className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-gold'}`}
                              disabled={busy || (isSelf && u.isActive)}
                              title={isSelf && u.isActive ? 'Non puoi disattivarti da solo' : undefined}
                              onClick={() => toggleActive(u)}>
                        {u.isActive ? 'Disattiva' : 'Riattiva'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SimulationTools() {
  const { setCurrentDay } = useDay();
  const { showSuccess, showError } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    const ok = window.confirm(
      'Reset della simulazione: cancella TUTTE le navi e lo storico, e riporta il giorno virtuale a 1. Continuare?');
    if (!ok) return;
    setBusy(true);
    try {
      const { removedShips, removedHistory } = await api.adminResetSimulation();
      setCurrentDay(1);
      showSuccess(`Simulazione azzerata: rimosse ${removedShips} navi e ${removedHistory} voci di storico.`);
    } catch (err) {
      showError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Simulazione</h2>
      <p>Riporta l'ambiente allo stato iniziale (giorno 1, nessuna nave). Le banchine e gli utenti non vengono toccati.</p>
      <button className="btn btn-danger" disabled={busy} onClick={handleReset}>
        Reset simulazione
      </button>
    </section>
  );
}
