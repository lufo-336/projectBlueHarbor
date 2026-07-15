// ═══ SPRINT 2 ═══
// Generazione casuale della nave secondo la specifica:
//   Size: una delle 4 a caso · ArrivalDay: giorno corrente + 1..30 · Duration: 3..15.
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Dtos;
using BlueHarbor.Api.Models;
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Services;

public class ShipGeneratorService
{
    private static readonly string[] Sizes = ["S", "M", "L", "XL"];
    private readonly Db _db;
    private readonly SettingsService _settings;

    public ShipGeneratorService(Db db, SettingsService settings)
    {
        _db = db;
        _settings = settings;
    }

    public async Task<ShipDto> CreateShipAsync(string name)
    {
        var currentDay = await _settings.GetCurrentDayAsync();

        // Random.Shared: generatore thread-safe già pronto (modulo C#).
        var size = Sizes[Random.Shared.Next(Sizes.Length)];
        var arrivalDay = currentDay + Random.Shared.Next(1, 31); // 1..30 incluso
        var duration = Random.Shared.Next(3, 16);                // 3..15 incluso

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // SCOPE_IDENTITY() restituisce l'Id appena generato dall'IDENTITY.
        using var cmd = new SqlCommand(@"
            INSERT INTO Ships (Name, Size, ArrivalDay, Duration, Status)
            VALUES (@name, @size, @arrivalDay, @duration, @status);
            SELECT CAST(SCOPE_IDENTITY() AS INT);", conn);
        cmd.Parameters.AddWithValue("@name", name);
        cmd.Parameters.AddWithValue("@size", size);
        cmd.Parameters.AddWithValue("@arrivalDay", arrivalDay);
        cmd.Parameters.AddWithValue("@duration", duration);
        cmd.Parameters.AddWithValue("@status", ShipStatus.Pending);
        var newId = (int)(await cmd.ExecuteScalarAsync())!;

        return new ShipDto
        {
            Id = newId, Name = name, Size = size, ArrivalDay = arrivalDay,
            Duration = duration, Status = ShipStatus.Pending
        };
    }
}
