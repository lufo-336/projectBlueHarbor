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
}
