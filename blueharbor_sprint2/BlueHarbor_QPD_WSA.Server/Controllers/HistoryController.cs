using BlueHarbor_QPD_WSA.Server.DTOs;
using BlueHarbor_QPD_WSA.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Controllers;

/// <summary>
/// Storico assegnazioni (audit trail) — sola lettura. La tabella è append-only:
/// qui NON esistono endpoint di update/delete, per costruzione.
/// Rotta base: /api/history
/// </summary>
[ApiController]
[Route("api/history")]
[Authorize(Roles = "Scheduler")]
public class HistoryController : ControllerBase
{
    private readonly BlueHarborContext _context;

    public HistoryController(BlueHarborContext context)
    {
        _context = context;
    }

    // ==========================================================================
    //  GET /api/history — elenco eventi (Assigned/Departed), più recenti in cima
    //  Filtri opzionali: ?shipId=&berthId=&eventType=Assigned|Departed
    // ==========================================================================
    [HttpGet]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int? shipId = null,
        [FromQuery] int? berthId = null,
        [FromQuery] string? eventType = null)
    {
        // --- Validazione filtro eventType (enum) ---
        HistoryEventType? eventFilter = null;
        if (!string.IsNullOrWhiteSpace(eventType))
        {
            if (!Enum.TryParse<HistoryEventType>(eventType, ignoreCase: true, out var parsed))
            {
                return Problem(
                    detail: $"eventType '{eventType}' non valido. Ammessi: Assigned, Departed.",
                    statusCode: StatusCodes.Status400BadRequest);
            }
            eventFilter = parsed;
        }

        var query = _context.AssignmentHistory.AsQueryable();
        if (shipId is not null) query = query.Where(h => h.ShipId == shipId);
        if (berthId is not null) query = query.Where(h => h.BerthId == berthId);
        if (eventFilter is not null) query = query.Where(h => h.EventType == eventFilter);

        var entries = await query
            .OrderByDescending(h => h.CreatedAt)
            .ThenByDescending(h => h.Id) // ordine stabile a parità di timestamp
            .Select(h => new HistoryEntryDto(
                h.Id, h.ShipId, h.ShipName, h.Size, h.BerthId, h.BerthName,
                h.OccupationStartDay, h.OccupationEndDay,
                h.EventType.ToString(), h.EventDay, h.CreatedAt))
            .ToListAsync();

        return Ok(entries);
    }
}
