using BlueHarbor_QPD_WSA.Server.DTOs;
using BlueHarbor_QPD_WSA.Server.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Controllers;

[ApiController]
[Route("api/scheduler")]
public class SchedulerController : ControllerBase
{
    private readonly BlueHarborContext _context;

    public SchedulerController(BlueHarborContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Vista dello Scheduler: giorno corrente, navi Pending e stato di ogni banchina
    /// (occupata ora? con quali occupazioni in coda?). Sola lettura.
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        // 1) Giorno corrente virtuale.
        var setting = await _context.Settings
            .FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");

        if (setting is null || !int.TryParse(setting.Value, out var currentDay))
        {
            return Problem(
                detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        // 2) Navi in attesa, ordinate per arrivo (le più urgenti in cima).
        var pendingShips = await _context.Ships
            .Where(s => s.Status == ShipStatus.Pending)
            .OrderBy(s => s.ArrivalDay)
            .Select(s => new PendingShipDto(s.Id, s.Name, s.Size, s.ArrivalDay, s.Duration))
            .ToListAsync();

        // 3) Tutte le banchine con le loro occupazioni ATTIVE (navi Assigned).
        //    Carico i dati grezzi dal DB; la forma finale la costruisco in memoria
        //    (stesso motivo della Task 3: niente ValueTuple/calcoli ambigui in SQL).
        var berthsRaw = await _context.Berths
            .OrderBy(b => b.Id)
            .Select(b => new
            {
                b.Id,
                b.Name,
                b.Size,
                Ships = b.Ships
                    .Where(s => s.Status == ShipStatus.Assigned)
                    .Select(s => new { s.Id, s.Name, s.OccupationStartDay, s.Duration })
                    .ToList()
            })
            .ToListAsync();

        var berths = berthsRaw
            .Select(b =>
            {
                var assignments = b.Ships
                    .Select(s => new BerthAssignmentDto(
                        s.Id,
                        s.Name,
                        s.OccupationStartDay!.Value,
                        s.OccupationStartDay!.Value + s.Duration))
                    .OrderBy(a => a.StartDay)
                    .ToList();

                // Occupata ORA se un'occupazione copre il giorno corrente: [Start, End).
                bool isOccupiedNow = assignments
                    .Any(a => a.StartDay <= currentDay && currentDay < a.EndDay);

                return new BerthStatusDto(b.Id, b.Name, b.Size, isOccupiedNow, assignments);
            })
            .ToList();

        var response = new SchedulerDashboardResponse(currentDay, pendingShips, berths);
        return Ok(response);
    }
}
