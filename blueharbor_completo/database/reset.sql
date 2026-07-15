-- ═══ SPRINT 5 ═══
-- Reset per la demo: svuota navi e storico, giorno torna a 1.
-- Berths e Users NON si toccano (sono dati "di impianto").
-- Ordine: prima History (ha FK verso Ships), poi Ships.
USE BlueHarborCompleto;
GO
DELETE FROM dbo.AssignmentHistory;
DELETE FROM dbo.Ships;
UPDATE dbo.Settings SET [Value] = '1' WHERE [Key] = 'CurrentVirtualDay';
GO
PRINT 'Reset completato: 0 ships, 0 history, giorno = 1.';
