// Ruoli riconosciuti dal backend (CK_Users_Role). Unico punto di verità:
// aggiungere un ruolo qui, non nei singoli componenti.
// Le ETICHETTE tradotte vivono nel dizionario i18n (COPY.<lang>.roles.<ruolo>)
// e si ottengono con t('roles.' + ruolo).

export const ROLES = ['Operator', 'Scheduler', 'Admin'];
