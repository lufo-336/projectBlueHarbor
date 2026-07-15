// Check di parità con SchedulingRules.ComputeOccupationStartDay (backend).
// Esecuzione: node checks/scheduling.check.mjs  (dalla cartella frontend/)
import assert from 'node:assert/strict';
import { computeOccupationStartDay, isCompatible } from '../src/services/scheduling.js';

// Banchina libera: si parte al massimo tra giorno di arrivo e giorno corrente.
assert.equal(computeOccupationStartDay(6, 4, 5, []), 6);
assert.equal(computeOccupationStartDay(3, 5, 5, []), 5);

// Accodamento: l'occupazione [4,9) blocca, si parte alla sua fine.
assert.equal(computeOccupationStartDay(5, 4, 5, [{ start: 4, end: 9 }]), 9);

// Buco sufficiente PRIMA dell'occupazione successiva: si usa il buco.
assert.equal(computeOccupationStartDay(1, 2, 1, [{ start: 5, end: 8 }]), 1);

// Buco insufficiente: si scavalca l'occupazione.
assert.equal(computeOccupationStartDay(1, 6, 1, [{ start: 5, end: 8 }]), 8);

// Più occupazioni passate in ordine sparso: l'ordinamento è interno alla funzione.
assert.equal(computeOccupationStartDay(1, 2, 1, [{ start: 6, end: 9 }, { start: 1, end: 4 }]), 4);

// Compatibilità: stessa taglia, case-insensitive.
assert.equal(isCompatible('m', 'M'), true);
assert.equal(isCompatible('S', 'XL'), false);

console.log('scheduling.check: OK');
