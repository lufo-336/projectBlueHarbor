// ═══ SPRINT 8 ═══
// Storico append-only: INSERT-only, sempre dentro la transazione del chiamante
// (assegnazione o Next Day), così storico e stato nave restano coerenti.
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Dtos;
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Services;

public class HistoryService
{
    private readonly Db _db;

    public HistoryService(Db db) => _db = db;

    public async Task AddEventAsync(SqlConnection conn, SqlTransaction tx,
        int shipId, int berthId, int startDay, int endDay, string eventType)
    {
        using var cmd = new SqlCommand(@"
            INSERT INTO AssignmentHistory
                (ShipId, BerthId, OccupationStartDay, OccupationEndDay, EventType)
            VALUES (@shipId, @berthId, @startDay, @endDay, @eventType)", conn, tx);
        cmd.Parameters.AddWithValue("@shipId", shipId);
        cmd.Parameters.AddWithValue("@berthId", berthId);
        cmd.Parameters.AddWithValue("@startDay", startDay);
        cmd.Parameters.AddWithValue("@endDay", endDay);
        cmd.Parameters.AddWithValue("@eventType", eventType);
        await cmd.ExecuteNonQueryAsync();
    }

    // Lettura filtrata dello storico (endpoint del Task 8).
    public async Task<List<HistoryEntryDto>> QueryAsync(int? berthId, int? shipId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(@"
            SELECT h.Id, h.ShipId, s.Name AS ShipName, h.BerthId, b.Name AS BerthName,
                   h.OccupationStartDay, h.OccupationEndDay, h.EventType, h.RecordedAt
            FROM AssignmentHistory h
            JOIN Ships  s ON s.Id = h.ShipId
            JOIN Berths b ON b.Id = h.BerthId
            WHERE (@berthId IS NULL OR h.BerthId = @berthId)
              AND (@shipId  IS NULL OR h.ShipId  = @shipId)
            ORDER BY h.Id DESC", conn);
        cmd.Parameters.AddWithValue("@berthId", (object?)berthId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@shipId",  (object?)shipId  ?? DBNull.Value);

        var entries = new List<HistoryEntryDto>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            entries.Add(new HistoryEntryDto
            {
                Id = (int)reader["Id"],
                ShipId = (int)reader["ShipId"],
                ShipName = (string)reader["ShipName"],
                BerthId = (int)reader["BerthId"],
                BerthName = (string)reader["BerthName"],
                OccupationStartDay = (int)reader["OccupationStartDay"],
                OccupationEndDay = (int)reader["OccupationEndDay"],
                EventType = (string)reader["EventType"],
                RecordedAt = (DateTime)reader["RecordedAt"]
            });
        return entries;
    }
}
