import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ROLES } from '../services/roles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDay } from '../context/DayContext.jsx';
import { useDayLabel, useDurationLabel, useT } from '../context/PrefsContext.jsx';
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
  const t = useT();
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
      <nav className="admin__tabs" aria-label={t('admin.tabsAria')}>
        <button className={tab === 'users' ? 'is-active' : ''} onClick={() => setTab('users')}>{t('admin.tabUsers')}</button>
        <button className={tab === 'maintenance' ? 'is-active' : ''} onClick={() => setTab('maintenance')}>{t('admin.tabMaintenance')}</button>
        <button className={tab === 'archive' ? 'is-active' : ''} onClick={() => setTab('archive')}>{t('admin.tabArchive')}</button>
        <button className={tab === 'operator' ? 'is-active' : ''} onClick={() => setTab('operator')}>{t('admin.tabOperatorView')}</button>
        <button className={tab === 'scheduler' ? 'is-active' : ''} onClick={() => setTab('scheduler')}>{t('admin.tabSchedulerView')}</button>
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
  const t = useT();
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
      showSuccess(t('admin.toastUserCreated', { user: username }));
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
      showSuccess(t('admin.toastRoleChanged', { user: u.username, role: t(`roles.${role}`) }));
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
        showSuccess(t('admin.toastDeactivated', { user: u.username }));
      } else {
        await api.adminUpdateUser(u.id, { isActive: true });
        showSuccess(t('admin.toastReactivated', { user: u.username }));
      }
      await load();
    } catch (err) {
      showError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(u) {
    const pwd = window.prompt(t('admin.promptNewPassword', { user: u.username }));
    if (pwd === null) return; // annullato
    if (!pwd.trim()) { showError(t('admin.errPasswordEmpty')); return; }
    setBusyId(u.id);
    try {
      await api.adminUpdateUser(u.id, { password: pwd });
      showSuccess(t('admin.toastPasswordReset', { user: u.username }));
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
        <h2>{t('admin.newUser')}</h2>
        <form className="admin__form" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="new-username">Username</label>
            <input id="new-username" value={form.username}
                   onChange={(e) => setForm({ ...form, username: e.target.value })}
                   placeholder={t('admin.usernamePlaceholder')} required />
          </div>
          <div className="field">
            <label htmlFor="new-role">{t('common.role')}</label>
            <select id="new-role" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="new-password">{t('admin.initialPassword')}</label>
            <input id="new-password" type="password" value={form.password}
                   onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? t('admin.creating') : t('admin.createUser')}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>{t('admin.users')}</h2>
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr><th>Username</th><th>{t('common.role')}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th></tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.username === user.email;
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} className={u.isActive ? '' : 'is-inactive'}>
                    <td>{u.username}{isSelf && <span className="admin__you">{t('admin.you')}</span>}</td>
                    <td>
                      <select value={u.role} disabled={busy || isSelf}
                              onChange={(e) => changeRole(u, e.target.value)}>
                        {ROLES.map((r) => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-assigned' : 'badge-departed'}`}>
                        {u.isActive ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </td>
                    <td className="admin__actions">
                      <button type="button" className="btn btn-ghost btn-sm" disabled={busy}
                              onClick={() => resetPassword(u)}>
                        {t('admin.resetPassword')}
                      </button>
                      <button type="button" className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-gold'}`}
                              disabled={busy || (isSelf && u.isActive)}
                              title={isSelf && u.isActive ? t('admin.cannotSelfDeactivate') : undefined}
                              onClick={() => toggleActive(u)}>
                        {u.isActive ? t('admin.deactivate') : t('admin.reactivate')}
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
  const t = useT();
  const fmtDay = useDayLabel();
  const fmtDuration = useDurationLabel();
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
      showSuccess(t('admin.toastMaintScheduled'));
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
      showSuccess(t('admin.toastMaintRevoked'));
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
    if (data.currentDay === null) return 'scheduled';
    if (data.currentDay >= item.endDay) return 'finished';
    if (data.currentDay >= item.startDay) return 'inProgress';
    return 'scheduled';
  };
  const stateLabel = { scheduled: t('admin.stateScheduled'), finished: t('admin.stateFinished'), inProgress: t('admin.stateInProgress') };
  // I giorni virtuali qui si mostrano SEMPRE come gN/dN (non come data): forzo mode 'day'.
  const vday = (d) => fmtDay(d, { mode: 'day' });

  return (
    <>
      <section className="card">
        <h2>{t('admin.scheduleMaintenance')}</h2>
        <p className="admin__hint">
          {t('admin.maintHintA')}<strong>{t('admin.maintHintStrong')}</strong>{t('admin.maintHintB')}
        </p>
        <form className="admin__form" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="m-berth">{t('common.berth')}</label>
            <select id="m-berth" required value={form.berthId}
                    onChange={(e) => setForm({ ...form, berthId: e.target.value })}>
              <option value="">{t('common.choose')}</option>
              {data.berths.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.size})</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-start">{t('admin.startDate')}</label>
            <input id="m-start" type="date" required
                   min={data.currentDay != null ? dayToInputValue(data.currentDay, day1Date) : undefined}
                   value={form.startDay !== '' ? dayToInputValue(Number(form.startDay), day1Date) : ''}
                   onChange={(e) => {
                     const day = inputValueToDay(e.target.value, day1Date);
                     setForm((f) => ({ ...f, startDay: day ?? '' }));
                   }} />
          </div>
          <div className="field">
            <label htmlFor="m-end">{t('admin.endDate')}</label>
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
            {submitting ? t('admin.scheduling') : t('admin.schedule')}
          </button>
        </form>
        {form.startDay !== '' && form.endDay !== '' && Number(form.endDay) > Number(form.startDay) && (
          <p className="admin__hint mono">
            {t('admin.windowLabel')} {vday(Number(form.startDay))}–{vday(Number(form.endDay) - 1)} ({fmtDuration(Number(form.endDay) - Number(form.startDay))})
          </p>
        )}
        {data.currentDay !== null && (
          <p className="admin__hint mono">{t('admin.currentDayLabel')} {vday(data.currentDay)}</p>
        )}
      </section>

      <section className="card">
        <h2>{t('admin.maintenances')}</h2>
        {items.length === 0 ? (
          <p className="admin__hint">{t('admin.noMaintenance')}</p>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr><th>{t('common.berth')}</th><th>{t('admin.window')}</th><th>{t('common.status')}</th><th>{t('common.actions')}</th></tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const state = stateOf(item);
                  return (
                    <tr key={item.id}>
                      <td>{item.berthName}</td>
                      <td className="mono">{vday(item.startDay)} – {vday(item.endDay - 1)}</td>
                      <td><span className="badge">{stateLabel[state]}</span></td>
                      <td>
                        {/* Disabilitato, non nascosto: la regola si vede invece di
                            essere scoperta con un 409. */}
                        <button type="button" className="btn btn-danger btn-sm"
                                disabled={state !== 'scheduled' || busyId === item.id}
                                title={state !== 'scheduled' ? t('admin.revokeOnlyNotStarted') : undefined}
                                onClick={() => handleRevoke(item)}>
                          {t('admin.revoke')}
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
  const t = useT();
  const { setCurrentDay } = useDay();
  const { showSuccess, showError } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    const ok = window.confirm(t('admin.confirmReset'));
    if (!ok) return;
    setBusy(true);
    try {
      const { removedShips, removedHistory } = await api.adminResetSimulation();
      setCurrentDay(1);
      showSuccess(t('admin.toastReset', { ships: removedShips, history: removedHistory }));
    } catch (err) {
      showError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>{t('admin.simulation')}</h2>
      <p>{t('admin.simulationHint')}</p>
      <button className="btn btn-danger" disabled={busy} onClick={handleReset}>
        {t('admin.resetSimulation')}
      </button>
    </section>
  );
}
