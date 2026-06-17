using BlueHarbor_QPD_WSA.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Controllers;

[ApiController]
[Route("api/system")]
public class SystemController : ControllerBase
{
    private readonly BlueHarborContext _context;

    public SystemController(BlueHarborContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Restituisce il giorno corrente virtuale letto dalla tabella Settings.
    /// Risposta: { "currentDay": 1 }
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

        return Ok(new { currentDay });
    }
}
