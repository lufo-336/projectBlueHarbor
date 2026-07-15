// ═══ SPRINT 4 ═══
// Il "motore del tempo": incrementa il giorno e libera le navi che hanno
// finito, in UNA transazione (o tutto o niente — modulo Basi di Dati).
// Regola di partenza: Departed quando OccupationStartDay + Duration <= nuovoGiorno.
// Esempio 2 della roadmap: nave con inizio 2 e durata 3 → occupata nei giorni
// 2-3-4, Departed esattamente al giorno 5 (2+3=5 <= 5).
// VINCOLO fuori scope: qui NON si assegna nulla, si aggiornano solo stati passati.
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Models;
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Services;

public class TimeService
{
    private readonly Db _db;
    private readonly SettingsService _settings;
    private readonly HistoryService _history;

    public TimeService(Db db, SettingsService settings, HistoryService history)
    {
        _db = db;
        _settings = settings;
        _history = history;
    }

    public async Task<(int NewDay, int ReleasedShips)> AdvanceDayAsync()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var tx = (SqlTransaction)await conn.BeginTransactionAsync();

        // 1) Giorno + 1 (dentro la transazione).
        var newDay = await _settings.IncrementDayAsync(conn, tx);

        // 2) Chi ha finito? Letti PRIMA dell'UPDATE per registrarli nello storico.
        var released = new List<(int ShipId, int BerthId, int StartDay, int EndDay)>();
        using (var cmd = new SqlCommand(@"
            SELECT Id, BerthId, OccupationStartDay, Duration FROM Ships
            WHERE Status = @assigned AND OccupationStartDay + Duration <= @newDay", conn, tx))
        {
            cmd.Parameters.AddWithValue("@assigned", ShipStatus.Assigned);
            cmd.Parameters.AddWithValue("@newDay", newDay);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var start = (int)reader["OccupationStartDay"];
                released.Add(((int)reader["Id"], (int)reader["BerthId"],
                    start, start + (int)reader["Duration"] - 1));
            }
        }

        // 3) UPDATE di massa: Assigned → Departed.
        using (var cmd = new SqlCommand(@"
            UPDATE Ships SET Status = @departed
            WHERE Status = @assigned AND OccupationStartDay + Duration <= @newDay", conn, tx))
        {
            cmd.Parameters.AddWithValue("@departed", ShipStatus.Departed);
            cmd.Parameters.AddWithValue("@assigned", ShipStatus.Assigned);
            cmd.Parameters.AddWithValue("@newDay", newDay);
            await cmd.ExecuteNonQueryAsync();
        }

        // 4) Evento storico per ogni nave partita (Sprint 8), stessa transazione.
        foreach (var (shipId, berthId, startDay, endDay) in released)
            await _history.AddEventAsync(conn, tx, shipId, berthId, startDay, endDay, "Departed");

        // Se QUALSIASI passo sopra fosse fallito, l'eccezione avrebbe saltato
        // il Commit e il using avrebbe fatto rollback: giorno e navi coerenti.
        await tx.CommitAsync();
        return (newDay, released.Count);
    }
}
