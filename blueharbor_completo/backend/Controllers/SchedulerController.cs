// ═══ SPRINT 3 ═══ Dashboard dello Scheduler: pending + stato banchine.
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Dtos;
using BlueHarbor.Api.Models;
using BlueHarbor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Controllers;

[ApiController]
[Route("api/scheduler")]
[Authorize(Roles = "Scheduler")]
public class SchedulerController : ControllerBase
{
    private readonly Db _db;
    private readonly SettingsService _settings;

    public SchedulerController(Db db, SettingsService settings)
    {
        _db = db;
        _settings = settings;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var dashboard = new SchedulerDashboardDto
        {
            CurrentDay = await _settings.GetCurrentDayAsync()
        };

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // 1) Navi in attesa di assegnazione.
        using (var cmd = new SqlCommand(@"
            SELECT s.Id, s.Name, s.Size, s.ArrivalDay, s.Duration, s.Status,
                   s.BerthId, s.OccupationStartDay, CAST(NULL AS VARCHAR(50)) AS BerthName
            FROM Ships s WHERE s.Status = @pending ORDER BY s.ArrivalDay", conn))
        {
            cmd.Parameters.AddWithValue("@pending", ShipStatus.Pending);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                dashboard.PendingShips.Add(ShipDto.FromReader(reader));
        }

        // 2) Le 8 banchine con le navi Assigned (LEFT JOIN: anche berth vuote).
        using (var cmd = new SqlCommand(@"
            SELECT b.Id, b.Name, b.Size,
                   s.Id AS ShipId, s.Name AS ShipName, s.OccupationStartDay, s.Duration
            FROM Berths b
            LEFT JOIN Ships s ON s.BerthId = b.Id AND s.Status = @assigned
            ORDER BY b.Id, s.OccupationStartDay", conn))
        {
            cmd.Parameters.AddWithValue("@assigned", ShipStatus.Assigned);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var berthId = (int)reader["Id"];
                // Raggruppamento in memoria: una riga per (berth, nave assegnata).
                var berth = dashboard.Berths.FirstOrDefault(x => x.Id == berthId);
                if (berth is null)
                {
                    berth = new BerthDto
                    {
                        Id = berthId,
                        Name = (string)reader["Name"],
                        Size = (string)reader["Size"]
                    };
                    dashboard.Berths.Add(berth);
                }
                if (reader["ShipId"] is not DBNull)
                {
                    var start = (int)reader["OccupationStartDay"];
                    var duration = (int)reader["Duration"];
                    berth.Occupations.Add(new OccupationDto
                    {
                        ShipId = (int)reader["ShipId"],
                        ShipName = (string)reader["ShipName"],
                        StartDay = start,
                        EndDay = start + duration - 1
                    });
                }
            }
        }

        return Ok(dashboard);
    }
}
