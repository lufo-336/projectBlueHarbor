using BlueHarbor_QPD_WSA.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BlueHarbor_QPD_WSA.Server.Controllers;

[ApiController]
[Route("api/time")]
public class TimeController : ControllerBase
{
    private readonly TimeService _timeService;

    public TimeController(TimeService timeService)
    {
        _timeService = timeService;
    }

    /// <summary>
    /// Azione "Next Day": avanza il giorno virtuale e rilascia le navi che
    /// hanno completato l'occupazione. Restituisce { "currentDay": N }.
    /// </summary>
    [HttpPost("next-day")]
    public async Task<IActionResult> NextDay()
    {
        try
        {
            var currentDay = await _timeService.AdvanceDayAsync();
            return Ok(new { currentDay });
        }
        catch (InvalidOperationException ex)
        {
            return Problem(
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }
}
