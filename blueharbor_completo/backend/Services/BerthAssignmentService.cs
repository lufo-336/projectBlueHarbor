// ═══ SPRINT 3 ═══ IL CUORE DEL PROGETTO.
// Assegna una nave Pending a una banchina compatibile calcolando il primo
// giorno libero (accodamento). Traduzione 1:1 dello pseudocodice di
// documentazione/design/accodamento-algoritmo.md §7 — strategia A (riempie i buchi).
//
// Esempio 1 (test di accettazione della roadmap):
//   Ship A (arrivo 2, durata 5) su berth vuota → inizia il giorno 2, occupa 2-6.
//   Ship B (arrivo 3, durata 4) sulla stessa berth → si sovrappone ad A, viene
//   spinta a 6+1 = 7. Occupa 7-10.
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Dtos;
using BlueHarbor.Api.Middleware;
using BlueHarbor.Api.Models;
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Services;

public class BerthAssignmentService
{
    private readonly Db _db;
    private readonly SettingsService _settings;
    private readonly HistoryService _history;

    public BerthAssignmentService(Db db, SettingsService settings, HistoryService history)
    {
        _db = db;
        _settings = settings;
        _history = history;
    }

    // Logica PURA (niente DB): facilissima da verificare a mano con gli esempi.
    public static int ComputeStartDay(
        int arrivalDay, int duration, IEnumerable<(int Start, int End)> occupied, int currentDay)
    {
        // Caso limite: se l'arrivo è già passato (tanti Next Day mentre era
        // Pending), non si può iniziare nel passato → si parte da oggi.
        var start = Math.Max(arrivalDay, currentDay);

        // Si scorrono le occupazioni in ordine di inizio: se la finestra
        // [start, start+duration-1] tocca [s, e], si viene spinti a e+1.
        foreach (var (intervalStart, intervalEnd) in occupied.OrderBy(i => i.Start))
        {
            // Formula di sovrapposizione tra intervalli chiusi:
            //   a1 <= b2  E  a2 <= b1  (accodamento-algoritmo.md §1B)
            if (start <= intervalEnd && intervalStart <= start + duration - 1)
                start = intervalEnd + 1;
        }
        return start;
    }

    public async Task<ShipDto> AssignAsync(int shipId, int berthId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        // Transazione: UPDATE nave + INSERT storico devono riuscire INSIEME.
        await using var tx = (SqlTransaction)await conn.BeginTransactionAsync();

        // 1) La nave esiste? È ancora Pending? (fuori scope: MAI riassegnare)
        Ship ship;
        using (var cmd = new SqlCommand(
            "SELECT Name, Size, ArrivalDay, Duration, Status FROM Ships WHERE Id = @id", conn, tx))
        {
            cmd.Parameters.AddWithValue("@id", shipId);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
                throw new NotFoundException($"Nave {shipId} inesistente.");
            ship = new Ship
            {
                Id = shipId,
                Name = (string)reader["Name"],
                Size = (string)reader["Size"],
                ArrivalDay = (int)reader["ArrivalDay"],
                Duration = (int)reader["Duration"],
                Status = (string)reader["Status"]
            };
        }
        if (ship.Status != ShipStatus.Pending)
            throw new DomainException($"La nave {shipId} non è Pending: una nave assegnata non si riassegna (fuori scope).");

        // 2) La banchina esiste? Ha la stessa Size? (controllo PRIMA dell'accodamento)
        string berthSize;
        using (var cmd = new SqlCommand("SELECT Size FROM Berths WHERE Id = @id", conn, tx))
        {
            cmd.Parameters.AddWithValue("@id", berthId);
            berthSize = (string?)await cmd.ExecuteScalarAsync()
                ?? throw new NotFoundException($"Banchina {berthId} inesistente.");
        }
        if (berthSize != ship.Size)
            throw new DomainException(
                $"Size incompatibile: nave {ship.Size} su banchina {berthSize}.");

        // 3) Occupazioni esistenti sulla banchina (solo Assigned: le Departed
        //    occupavano giorni passati, le Pending non sono su nessuna berth).
        var occupied = new List<(int Start, int End)>();
        using (var cmd = new SqlCommand(@"
            SELECT OccupationStartDay, Duration FROM Ships
            WHERE BerthId = @berthId AND Status = @assigned", conn, tx))
        {
            cmd.Parameters.AddWithValue("@berthId", berthId);
            cmd.Parameters.AddWithValue("@assigned", ShipStatus.Assigned);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var start = (int)reader["OccupationStartDay"];
                var duration = (int)reader["Duration"];
                occupied.Add((start, start + duration - 1)); // giorni S..S+D-1
            }
        }

        // 4) Calcolo del primo giorno utile e salvataggio.
        var currentDay = await _settings.GetCurrentDayAsync(conn, tx);
        var startDay = ComputeStartDay(ship.ArrivalDay, ship.Duration, occupied, currentDay);

        using (var cmd = new SqlCommand(@"
            UPDATE Ships SET BerthId = @berthId, OccupationStartDay = @startDay, Status = @assigned
            WHERE Id = @id", conn, tx))
        {
            cmd.Parameters.AddWithValue("@berthId", berthId);
            cmd.Parameters.AddWithValue("@startDay", startDay);
            cmd.Parameters.AddWithValue("@assigned", ShipStatus.Assigned);
            cmd.Parameters.AddWithValue("@id", shipId);
            await cmd.ExecuteNonQueryAsync();
        }

        // 5) Evento nello storico (Sprint 8), stessa transazione.
        await _history.AddEventAsync(conn, tx, shipId, berthId,
            startDay, startDay + ship.Duration - 1, "Assigned");

        await tx.CommitAsync();

        ship.Status = ShipStatus.Assigned;
        ship.BerthId = berthId;
        ship.OccupationStartDay = startDay;
        return new ShipDto
        {
            Id = ship.Id, Name = ship.Name, Size = ship.Size,
            ArrivalDay = ship.ArrivalDay, Duration = ship.Duration,
            Status = ship.Status, BerthId = berthId, OccupationStartDay = startDay
        };
    }
}
