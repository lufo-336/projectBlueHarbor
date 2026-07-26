import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ROLES, ROLE_LABELS } from '../services/roles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDay } from '../context/DayContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { dayToInputValue, inputValueToDay } from '../services/time.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ShipArchive from '../components/ShipArchive.jsx';
import OperatorView from './OperatorView.jsx';
import SchedulerView from './SchedulerView.jsx';
import './AdminView.css';

// L'Admin può gestire gli accessi (tab Utenti) e operare come Operatore/Scheduler
// (le stesse viste, riusate). Nessun potere di dominio aggiuntivo: sono gli
// endpoint esistenti, che ora accettano anche il ruolo Admin.
export default function AdminView() {
  const [tab, setTab] = useState('users');
  const [focusBerth, setFocusBerth] = useState(null);

  // La navbar può chiedere di aprire lo Scheduler su una banchina: passo alla
  // tab Scheduler e inoltro la richiesta come prop (nonce per ri-scattare).
  useEffect(() => {
    const onGoto = (e) => {
      setTab('scheduler');
      setFocusBerth({ berthId: e.detail?.berthId, nonce: Date.now() });
    };
    window.addEventListener('bh:goto-berth', onGoto);
    return () => window.removeEventListener('bh:goto-berth', onGoto);
  }, []);

  return (
    <div className="admin">
      <nav className="admin__tabs" aria-label="Sezioni Admin">
        <button className={tab === 'users' ? 'is-active' : ''} onClick={() => setTab('users')}>Gestione utenti</button>
        <button className={tab === 'maintenance' ? 'is-active' : ''} onClick={() => setTab('maintenance')}>Manutenzioni</button>
        <button className={tab === 'archive' ? 'is-active' : ''} onClick={() => setTab('archive')}>Archivio navi</button>
        <button className={tab === 'operator' ? 'is-active' : ''} onClick={() => setTab('operator')}>Vista Operatore</button>
        <button className={tab === 'scheduler' ? 'is-active' : ''} onClick={() => setTab('scheduler')}>Vista Scheduler</button>
      </nav>
      {tab === 'users' && (<><UserManagement /><SimulationTools /></>)}
      {tab === 'maintenance' && <MaintenanceManagement />}
      {tab === 'archive' && <ShipArchive />}
      {tab === 'operator' && <OperatorView />}
      {tab === 'scheduler' && <SchedulerView focusBerth={focusBerth} />}
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

// Manutenzioni: finestre [inizio, fine) in cui una banchina non e' utilizzabile.
// Le navi assegnate DOPO si accodano oltre la finestra da sole (lo fa l'algoritmo
// esistente). Una nave gia' assegnata non si sposta mai: il server rifiuta con 409.
function MaintenanceManagement() {
  const { showSuccess, showError } = useToast();
  const { day1Date } = useDay();
  const [data, setData] = useState(null); // { currentDay, berths } — null = primo caricamento
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ berthId: '', startDay: '', endDay: '' });
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const dashboard = await api.getSchedulerDashboard();
      setData({ currentDay: dashboard.currentDay, berths: dashboard.berths });
      setItems(await api.adminListMaintenance());
    } catch (err) {
      showError(err.message);
      setData({ currentDay: null, berths: [] });
      setItems([]);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.adminCreateMaintenance(
        Number(form.berthId), Number(form.startDay), Number(form.endDay));
      showSuccess('Manutenzione programmata.');
      setForm({ berthId: '', startDay: '', endDay: '' });
      await load();
    } catch (err) {
      showError(err.message); // il 409 spiega quali navi sono in conflitto
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(item) {
    setBusyId(item.id);
    try {
      await api.adminRevokeMaintenance(item.id);
      showSuccess('Manutenzione revocata.');
      await load();
    } catch (err) {
      showError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (data === null) return <LoadingSpinner />;

  // Stato derivato dal giorno corrente: solo le "programmate" si revocano.
  const stateOf = (item) => {
    if (data.currentDay === null) return 'programmata';
    if (data.currentDay >= item.endDay) return 'conclusa';
    if (data.currentDay >= item.startDay) return 'in corso';
    return 'programmata';
  };

  return (
    <>
      <section className="card">
        <h2>Programma manutenzione</h2>
        <p className="admin__hint">
          La banchina non sarà utilizzabile nei giorni indicati. Le navi assegnate dopo si
          accodano oltre la finestra. Le navi <strong>già assegnate non si spostano</strong>:
          se la finestra le incrocia, la richiesta viene rifiutata.
        </p>
        <form className="admin__form" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="m-berth">Banchina</label>
            <select id="m-berth" required value={form.berthId}
                    onChange={(e) => setForm({ ...form, berthId: e.target.value })}>
              <option value="">Scegli…</option>
              {data.berths.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.size})</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-start">Data inizio</label>
            <input id="m-start" type="date" required
                   min={data.currentDay != null ? dayToInputValue(data.currentDay, day1Date) : undefined}
                   value={form.startDay !== '' ? dayToInputValue(Number(form.startDay), day1Date) : ''}
                   onChange={(e) => {
                     const day = inputValueToDay(e.target.value, day1Date);
                     setForm((f) => ({ ...f, startDay: day ?? '' }));
                   }} />
          </div>
          <div className="field">
            <label htmlFor="m-end">Data fine (inclusa)</label>
            <input id="m-end" type="date" required
                   min={form.startDay !== ''
                     ? dayToInputValue(Number(form.startDay), day1Date)
                     : (data.currentDay != null ? dayToInputValue(data.currentDay, day1Date) : undefined)}
                   value={form.endDay !== '' ? dayToInputValue(Number(form.endDay) - 1, day1Date) : ''}
                   onChange={(e) => {
                     const dayIncl = inputValueToDay(e.target.value, day1Date);
                     setForm((f) => ({ ...f, endDay: dayIncl != null ? dayIncl + 1 : '' }));
                   }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Programmo…' : 'Programma'}
          </button>
        </form>
        {form.startDay !== '' && form.endDay !== '' && Number(form.endDay) > Number(form.startDay) && (
          <p className="admin__hint mono">
            Finestra: g{form.startDay}–g{Number(form.endDay) - 1} ({Number(form.endDay) - Number(form.startDay)} giorni)
          </p>
        )}
        {data.currentDay !== null && (
          <p className="admin__hint mono">Giorno corrente: g{data.currentDay}</p>
        )}
      </section>

      <section className="card">
        <h2>Manutenzioni</h2>
        {items.length === 0 ? (
          <p className="admin__hint">Nessuna manutenzione programmata.</p>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr><th>Banchina</th><th>Finestra</th><th>Stato</th><th>Azioni</th></tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const state = stateOf(item);
                  return (
                    <tr key={item.id}>
                      <td>{item.berthName}</td>
                      <td className="mono">g{item.startDay} – g{item.endDay - 1}</td>
                      <td><span className="badge">{state}</span></td>
                      <td>
                        {/* Disabilitato, non nascosto: la regola si vede invece di
                            essere scoperta con un 409. */}
                        <button type="button" className="btn btn-danger btn-sm"
                                disabled={state !== 'programmata' || busyId === item.id}
                                title={state !== 'programmata'
                                  ? 'Si revocano solo le manutenzioni non ancora iniziate'
                                  : undefined}
                                onClick={() => handleRevoke(item)}>
                          Revoca
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
