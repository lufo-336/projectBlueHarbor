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

    /// <summary>
    /// Assegna una nave Pending a una banchina scelta dallo Scheduler.
    /// Valida la compatibilità di dimensione e calcola il primo giorno libero
    /// della banchina (algoritmo di accodamento). La nave passa a Assigned.
    /// </summary>
    [HttpPost("{id:int}/assign")]
    public async Task<IActionResult> AssignShip(int id, [FromBody] AssignShipRequest request)
    {
        // 1) La nave esiste?
        var ship = await _context.Ships.FindAsync(id);
        if (ship is null)
        {
            return Problem(
                detail: $"Nave con id {id} non trovata.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // 2) La nave è ancora assegnabile? La consegna vieta riassegnazioni.
        if (ship.Status != ShipStatus.Pending)
        {
            return Problem(
                detail: $"La nave non è in stato Pending (stato attuale: {ship.Status}).",
                statusCode: StatusCodes.Status409Conflict);
        }

        // 3) La banchina esiste?
        var berth = await _context.Berths.FindAsync(request.BerthId);
        if (berth is null)
        {
            return Problem(
                detail: $"Banchina con id {request.BerthId} non trovata.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // 4) Compatibilità di dimensione (TASK 1).
        if (!SchedulingRules.IsCompatible(ship.Size, berth.Size))
        {
            return Problem(
                detail: $"Nave di dimensione {ship.Size} non compatibile con banchina {berth.Size}.",
                statusCode: StatusCodes.Status422UnprocessableEntity);
        }

        // 5) Giorno corrente virtuale (come in CreateShip).
        var setting = await _context.Settings
            .FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");

        if (setting is null || !int.TryParse(setting.Value, out var currentDay))
        {
            return Problem(
                detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        // 6) Occupazioni attive già presenti su questa banchina -> intervalli [Start, End).
        var occupations = await _context.Ships
            .Where(s => s.BerthId == berth.Id && s.Status == ShipStatus.Assigned)
            .Select(s => new { s.OccupationStartDay, s.Duration })
            .ToListAsync();

        var intervals = occupations
            .Select(o => (Start: o.OccupationStartDay!.Value, End: o.OccupationStartDay!.Value + o.Duration))
            .ToList();

        // Algoritmo di accodamento (TASK 2): primo giorno libero.
        var startDay = SchedulingRules.ComputeOccupationStartDay(
            ship.ArrivalDay, ship.Duration, currentDay, intervals);

        // 7) Salva l'assegnazione e cambia stato.
        ship.BerthId = berth.Id;
        ship.OccupationStartDay = startDay;
        ship.Status = ShipStatus.Assigned;

        await _context.SaveChangesAsync();

        // 8) Restituisci una DTO con l'esito (non l'entità, per evitare i cicli di navigazione).
        return Ok(new AssignShipResponse(
            ship.Id, ship.Name, ship.Size, berth.Id, startDay, ship.Status));
    }
}