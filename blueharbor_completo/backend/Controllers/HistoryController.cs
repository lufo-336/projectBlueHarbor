// ═══ SPRINT 8 ═══
// Consultazione dello storico: SOLA lettura. Non esiste (volutamente) nessun
// endpoint di scrittura: lo storico si popola solo come effetto di
// assegnazioni e Next Day.
using BlueHarbor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlueHarbor.Api.Controllers;

[ApiController]
[Route("api/history")]
[Authorize(Roles = "Scheduler")]
public class HistoryController : ControllerBase
{
    private readonly HistoryService _history;

    public HistoryController(HistoryService history) => _history = history;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? berthId, [FromQuery] int? shipId)
        => Ok(await _history.QueryAsync(berthId, shipId));
}
