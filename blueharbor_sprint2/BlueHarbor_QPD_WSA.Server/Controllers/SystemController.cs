using BlueHarbor_QPD_WSA.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Controllers;

[ApiController]
[Route("api/system")]
[Authorize]
public class SystemController : ControllerBase
{
    private readonly BlueHarborContext _context;

    public SystemController(BlueHarborContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Restituisce il giorno corrente virtuale letto dalla tabella Settings,
    /// più la data di calendario del giorno 1 (nullable: solo presentazione).
    /// Risposta: { "currentDay": 1, "day1Date": "2026-06-08" }
    /// </summary>
    [HttpGet("current-day")]
    public async Task<IActionResult> GetCurrentDay()
    {
        var setting = await _context.Settings
            .FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");

        if (setting is null || !int.TryParse(setting.Value, out var currentDay))
        {
            return Problem(
                detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        var day1 = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "Day1Date");
        return Ok(new { currentDay, day1Date = day1?.Value });
    }

    /// <summary>
    /// Riepilogo del terminal a colpo d'occhio (per la navbar, ogni ruolo):
    /// conteggi navi per stato e banchine occupate ORA sul totale.
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var setting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");
        var currentDay = (setting is not null && int.TryParse(setting.Value, out var d)) ? d : 0;

        var pending = await _context.Ships.CountAsync(s => s.Status == ShipStatus.Pending);
        var assigned = await _context.Ships.CountAsync(s => s.Status == ShipStatus.Assigned);
        var departed = await _context.Ships.CountAsync(s => s.Status == ShipStatus.Departed);

        // Stato ORA di ogni banchina (per la mini-mappa in navbar): occupata se
        // un'assegnazione copre il giorno corrente, in manutenzione se una finestra
        // lo copre, altrimenti libera. Intervalli [Start, End).
        var berthsRaw = await _context.Berths
            .OrderBy(b => b.Id)
            .Select(b => new
            {
                b.Id,
                b.Name,
                b.Size,
                Occupied = b.Ships.Any(s => s.Status == ShipStatus.Assigned
                    && s.OccupationStartDay != null
                    && s.OccupationStartDay <= currentDay
                    && currentDay < s.OccupationStartDay + s.Duration),
                Maintenance = b.Maintenances.Any(m => m.StartDay <= currentDay && currentDay < m.EndDay),
            })
            .ToListAsync();

        var berths = berthsRaw.Select(b => new
        {
            b.Id,
            b.Name,
            b.Size,
            State = b.Maintenance ? "maintenance" : (b.Occupied ? "occupied" : "free"),
        }).ToList();

        var berthsTotal = berths.Count;
        var berthsOccupied = berths.Count(b => b.State == "occupied");

        return Ok(new { currentDay, pending, assigned, departed, berthsTotal, berthsOccupied, berths });
    }
}
