// ═══ SPRINT 4 ═══ Il pulsante "Next Day" chiama questo endpoint.
using BlueHarbor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlueHarbor.Api.Controllers;

[ApiController]
[Route("api/time")]
[Authorize]
public class TimeController : ControllerBase
{
    private readonly TimeService _time;

    public TimeController(TimeService time) => _time = time;

    [HttpPost("next-day")]
    public async Task<IActionResult> NextDay()
    {
        var (newDay, releasedShips) = await _time.AdvanceDayAsync();
        return Ok(new { currentDay = newDay, releasedShips });
    }
}
