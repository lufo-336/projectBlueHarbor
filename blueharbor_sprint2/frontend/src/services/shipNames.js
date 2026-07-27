// Generatore di nomi nave lato client, solo per comodità in demo: il nome è
// l'unico campo che l'Operatore inserisce a mano (taglia/arrivo/durata li fa
// il server). Nessuna logica di dominio qui.

const NAMES = [
  'Aurora', 'Nettuno', 'Meridiana', 'Poseidone', 'Sirena', 'Orizzonte',
  'Tramontana', 'Maestrale', 'Scirocco', 'Levante', 'Ponente', 'Borea',
  'Stella Polare', 'Andromeda', 'Cassiopea', 'Orione', 'Vega', 'Altair',
  'Corallo', 'Perla', 'Tritone', 'Nautilus', 'Argonauta', 'Delfino',
  'Albatros', 'Procellaria', 'Gabbiano', 'Fenice', 'Zefiro', 'Calipso',
];

const ROMAN = ['II', 'III', 'IV', 'V'];

/** Un nome casuale; a volte con suffisso romano per ridurre i doppioni. */
export function randomShipName() {
  const base = NAMES[Math.floor(Math.random() * NAMES.length)];
  return Math.random() < 0.3
    ? `${base} ${ROMAN[Math.floor(Math.random() * ROMAN.length)]}`
    : base;
}
