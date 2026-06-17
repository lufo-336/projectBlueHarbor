using BlueHarbor_QPD_WSA.Server.DTOs;
using BlueHarbor_QPD_WSA.Server.Models;
using BlueHarbor_QPD_WSA.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Controllers;

[ApiController]
[Route("api/ships")]
public class ShipsController : ControllerBase
{
    private readonly BlueHarborContext _context;
    private readonly ShipGeneratorService _generator;

    public ShipsController(BlueHarborContext context, ShipGeneratorService generator)
    {
        _context = context;
        _generator = generator;
    }

    [HttpGet]
    public async Task<IActionResult> GetShips()
    {
        var ships = await _context.Ships
            .OrderBy(s => s.Id)
            .ToListAsync();

        return Ok(ships);
    }

    [HttpPost]
    public async Task<IActionResult> CreateShip([FromBody] CreateShipRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Problem(
                detail: "Il nome della nave non può essere vuoto.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var setting = await _context.Settings
            .FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");

        if (setting is null || !int.TryParse(setting.Value, out var currentDay))
        {
            return Problem(
                detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        // APPLICAZIONE CONSIGLIO: 
        // Deleghiamo la logica di business e la composizione dell'oggetto Ship al servizio dedicato.
        var ship = _generator.GenerateShip(request.Name, currentDay);

        _context.Ships.Add(ship);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetShips), new { id = ship.Id }, ship);
    }
}