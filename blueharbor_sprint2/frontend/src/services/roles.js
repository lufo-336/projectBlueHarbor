// Ruoli riconosciuti dal backend (CK_Users_Role) e loro etichetta in italiano.
// Unico punto di verità: aggiungere un ruolo qui, non nei singoli componenti.

export const ROLES = ['Operator', 'Scheduler', 'Admin'];

export const ROLE_LABELS = { Operator: 'Operatore', Scheduler: 'Scheduler', Admin: 'Admin' };

/** Etichetta da mostrare; se il ruolo è ignoto mostra il valore grezzo invece di mentire. */
export function roleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}
