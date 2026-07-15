// ═══ SPRINT 1 ═══
// Lettura/scrittura del giorno virtuale (tabella Settings).
// Usato da: SystemController, ShipGeneratorService, BerthAssignmentService,
// TimeService (che lo chiama DENTRO la propria transazione).
using BlueHarbor.Api.Data;
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Services;

public class SettingsService
{
    private const string CurrentDayKey = "CurrentVirtualDay";
    private readonly Db _db;

    public SettingsService(Db db) => _db = db;

    // Variante "autonoma": apre e chiude da sola la connessione.
    public async Task<int> GetCurrentDayAsync()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        return await GetCurrentDayAsync(conn, null);
    }

    // Variante per chi ha GIÀ una connessione/transazione aperta (es. TimeService):
    // così la lettura partecipa alla stessa transazione (modulo Basi di Dati: ACID).
    public async Task<int> GetCurrentDayAsync(SqlConnection conn, SqlTransaction? tx)
    {
        using var cmd = new SqlCommand("SELECT [Value] FROM Settings WHERE [Key] = @key", conn, tx);
        cmd.Parameters.AddWithValue("@key", CurrentDayKey); // parametro, mai concatenazione
        var value = (string?)await cmd.ExecuteScalarAsync()
            ?? throw new InvalidOperationException("Setting CurrentVirtualDay mancante: eseguire 02-seed.sql.");
        return int.Parse(value);
    }

    // Incremento del giorno: SOLO dentro una transazione (la richiede il Next Day).
    public async Task<int> IncrementDayAsync(SqlConnection conn, SqlTransaction tx)
    {
        var newDay = await GetCurrentDayAsync(conn, tx) + 1;
        using var cmd = new SqlCommand("UPDATE Settings SET [Value] = @value WHERE [Key] = @key", conn, tx);
        cmd.Parameters.AddWithValue("@value", newDay.ToString());
        cmd.Parameters.AddWithValue("@key", CurrentDayKey);
        await cmd.ExecuteNonQueryAsync();
        return newDay;
    }
}
