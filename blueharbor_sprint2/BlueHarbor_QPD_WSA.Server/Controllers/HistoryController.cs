using System.Globalization;
using System.Text;
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
[Authorize(Roles = "Scheduler,Admin")]
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
        if (!TryBuildQuery(shipId, berthId, eventType, out var query, out var error))
            return error!;

        return Ok(await ToDtoListAsync(query));
    }

    // ==========================================================================
    //  GET /api/history/export — stesso elenco in CSV, come download
    //  Stessi filtri di GET /api/history.
    // ==========================================================================
    [HttpGet("export")]
    public async Task<IActionResult> ExportHistory(
        [FromQuery] int? shipId = null,
        [FromQuery] int? berthId = null,
        [FromQuery] string? eventType = null)
    {
        if (!TryBuildQuery(shipId, berthId, eventType, out var query, out var error))
            return error!;

        var rows = await ToDtoListAsync(query);
        var csv = BuildCsv(rows);

        // BOM UTF-8: fa riconoscere la codifica a Excel (nomi con accenti leggibili).
        var preamble = Encoding.UTF8.GetPreamble();
        var body = Encoding.UTF8.GetBytes(csv);
        var bytes = new byte[preamble.Length + body.Length];
        Buffer.BlockCopy(preamble, 0, bytes, 0, preamble.Length);
        Buffer.BlockCopy(body, 0, bytes, preamble.Length, body.Length);

        // File(...) imposta Content-Disposition: attachment; filename="storico.csv".
        return File(bytes, "text/csv", "storico.csv");
    }

    // ==========================================================================
    //  Helper condivisi
    // ==========================================================================

    /// <summary>
    /// Costruisce la query filtrata comune a elenco ed export. Ritorna false e
    /// valorizza <paramref name="error"/> (400) se <paramref name="eventType"/> non è valido.
    /// </summary>
    private bool TryBuildQuery(
        int? shipId, int? berthId, string? eventType,
        out IQueryable<AssignmentHistory> query, out IActionResult? error)
    {
        error = null;
        query = _context.AssignmentHistory.AsQueryable();

        HistoryEventType? eventFilter = null;
        if (!string.IsNullOrWhiteSpace(eventType))
        {
            if (!Enum.TryParse<HistoryEventType>(eventType, ignoreCase: true, out var parsed))
            {
                error = Problem(
                    detail: $"eventType '{eventType}' non valido. Ammessi: Assigned, Departed.",
                    statusCode: StatusCodes.Status400BadRequest);
                return false;
            }
            eventFilter = parsed;
        }

        if (shipId is not null) query = query.Where(h => h.ShipId == shipId);
        if (berthId is not null) query = query.Where(h => h.BerthId == berthId);
        if (eventFilter is not null) query = query.Where(h => h.EventType == eventFilter);
        return true;
    }

    /// <summary>Ordina (più recenti in cima, ordine stabile) e proietta in DTO.</summary>
    private static Task<List<HistoryEntryDto>> ToDtoListAsync(IQueryable<AssignmentHistory> query) =>
        query
            .OrderByDescending(h => h.CreatedAt)
            .ThenByDescending(h => h.Id) // ordine stabile a parità di timestamp
            .Select(h => new HistoryEntryDto(
                h.Id, h.ShipId, h.ShipName, h.Size, h.BerthId, h.BerthName,
                h.OccupationStartDay, h.OccupationEndDay,
                h.EventType.ToString(), h.EventDay, h.CreatedAt))
            .ToListAsync();

    private static string BuildCsv(IEnumerable<HistoryEntryDto> rows)
    {
        var sb = new StringBuilder();
        sb.Append("Evento,Nave,Taglia,Banchina,InizioOccupazione,FineOccupazione,GiornoEvento,RegistratoUtc\r\n");
        foreach (var r in rows)
        {
            sb.Append(Escape(r.EventType)).Append(',')
              .Append(Escape(r.ShipName)).Append(',')
              .Append(Escape(r.Size)).Append(',')
              .Append(Escape(r.BerthName)).Append(',')
              .Append(r.OccupationStartDay).Append(',')
              .Append(r.OccupationEndDay).Append(',')
              .Append(r.EventDay).Append(',')
              .Append(Escape(r.CreatedAt.ToString("o", CultureInfo.InvariantCulture)))
              .Append("\r\n");
        }
        return sb.ToString();
    }

    /// <summary>Escaping CSV: campi con virgola, virgolette o a-capo vanno quotati (virgolette raddoppiate).</summary>
    private static string Escape(string field)
    {
        if (field.IndexOfAny(new[] { '"', ',', '\n', '\r' }) >= 0)
            return "\"" + field.Replace("\"", "\"\"") + "\"";
        return field;
    }
}
