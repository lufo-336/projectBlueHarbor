// ═══ SPRINT 1 ═══
// Primo endpoint del progetto: il frontend lo chiama all'avvio per mostrare
// il giorno virtuale in Topbar. Niente try/catch: ci pensa il middleware.
using BlueHarbor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlueHarbor.Api.Controllers;

[ApiController]
[Route("api/system")]
[Authorize]
public class SystemController : ControllerBase
{
    private readonly SettingsService _settings;

    public SystemController(SettingsService settings) => _settings = settings;

    [HttpGet("current-day")]
    public async Task<IActionResult> GetCurrentDay()
        => Ok(new { currentDay = await _settings.GetCurrentDayAsync() });
}
