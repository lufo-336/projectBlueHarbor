using BlueHarbor_QPD_WSA.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Services;

/// <summary>
/// Gestisce l'avanzamento del tempo virtuale (azione "Next Day").
/// L'avanzamento e il rilascio delle navi avvengono in un'unica transazione:
/// o riescono entrambi, o non cambia nulla.
/// </summary>
public class TimeService
{
    private readonly BlueHarborContext _context;

    public TimeService(BlueHarborContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Avanza il giorno virtuale di 1 e marca Departed le navi che hanno
    /// completato la loro occupazione. Restituisce il nuovo giorno corrente.
    /// </summary>
    public async Task<int> AdvanceDayAsync()
    {
        // Transazione esplicita: incremento giorno + rilascio navi sono atomici.
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var setting = await _context.Settings
                .FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");

            if (setting is null || !int.TryParse(setting.Value, out var currentDay))
            {
                throw new InvalidOperationException(
                    "CurrentVirtualDay non è configurato correttamente nel database.");
            }

            var newDay = currentDay + 1;
            setting.Value = newDay.ToString();

            // Rilascia le navi che hanno completato l'occupazione.
            // Occupazione = [Start, Start + Duration): conclusa quando End <= newDay.
            // Lo stato passa a Departed; BerthId resta come storico (libera comunque
            // la banchina, perché l'accodamento considera solo le navi Assigned).
            var shipsToRelease = await _context.Ships
                .Where(s => s.Status == ShipStatus.Assigned
                            && s.OccupationStartDay != null
                            && s.OccupationStartDay + s.Duration <= newDay)
                .ToListAsync();

            foreach (var ship in shipsToRelease)
            {
                ship.Status = ShipStatus.Departed;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return newDay;
        }
        catch
        {
            // Qualsiasi errore -> annulla tutto: il giorno NON avanza.
            await transaction.RollbackAsync();
            throw;
        }
    }
}
