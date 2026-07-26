using BlueHarbor_QPD_WSA.Server.DTOs;
using BlueHarbor_QPD_WSA.Server.Models;
using BlueHarbor_QPD_WSA.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Controllers;

/// <summary>
/// Endpoint sulle navi: elenco, creazione (Operatore) e assegnazione (Scheduler).
/// Rotta base: /api/ships
/// </summary>
[ApiController]
[Route("api/ships")]
[Authorize]
public class ShipsController : ControllerBase
{
    // ==========================================================================
    //  Dipendenze (iniettate dal container DI)
    // ==========================================================================
    private readonly BlueHarborContext _context;    // accesso al database
    private readonly ShipGeneratorService _generator; // genera i dati casuali di una nuova nave

    public ShipsController(BlueHarborContext context, ShipGeneratorService generator)
    {
        _context = context;
        _generator = generator;
    }

    // Taglie ammesse per il filtro ?size= (le stesse usate in generazione nave).
    private static readonly string[] ValidSizes = { "S", "M", "L", "XL" };

    // ==========================================================================
    //  GET /api/ships — elenco paginato e filtrabile delle navi
    //  Query param opzionali:
    //    ?status=Pending|Assigned|Departed   filtra per stato
    //    ?size=S|M|L|XL                        filtra per taglia
    //    ?q=aur                                 ricerca per nome (contiene, ignora maiuscole)
    //    ?page=1 (>=1)                          pagina (default 1)
    //    ?pageSize=20 (1..100)                  ampiezza pagina (default 20)
    //  Ordinamento stabile per Id. Risposta: ShipPageResponse (items + meta + counts).
    // ==========================================================================
    [HttpGet]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<IActionResult> GetShips(
        [FromQuery] string? status = null,
        [FromQuery] string? size = null,
        [FromQuery] string? q = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // --- Validazione paginazione ---
        if (page < 1)
        {
            return Problem(
                detail: "Il parametro 'page' deve essere >= 1.",
                statusCode: StatusCodes.Status400BadRequest);
        }
        if (pageSize is < 1 or > 100)
        {
            return Problem(
                detail: "Il parametro 'pageSize' deve essere compreso tra 1 e 100.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // --- Validazione filtro stato (enum) ---
        ShipStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<ShipStatus>(status, ignoreCase: true, out var parsed))
            {
                return Problem(
                    detail: $"Stato '{status}' non valido. Ammessi: Pending, Assigned, Departed.",
                    statusCode: StatusCodes.Status400BadRequest);
            }
            statusFilter = parsed;
        }

        // --- Validazione filtro taglia ---
        string? sizeFilter = null;
        if (!string.IsNullOrWhiteSpace(size))
        {
            var normalized = size.Trim().ToUpperInvariant();
            if (!ValidSizes.Contains(normalized))
            {
                return Problem(
                    detail: $"Taglia '{size}' non valida. Ammesse: S, M, L, XL.",
                    statusCode: StatusCodes.Status400BadRequest);
            }
            sizeFilter = normalized;
        }

        // --- Contatori sull'intero insieme (indipendenti da filtri e paginazione) ---
        var counts = new ShipStatusCounts(
            Pending: await _context.Ships.CountAsync(s => s.Status == ShipStatus.Pending),
            Assigned: await _context.Ships.CountAsync(s => s.Status == ShipStatus.Assigned),
            Departed: await _context.Ships.CountAsync(s => s.Status == ShipStatus.Departed));

        // --- Query filtrata: i filtri si applicano prima di Skip/Take (lato SQL) ---
        var query = _context.Ships.AsQueryable();
        if (statusFilter is not null) query = query.Where(s => s.Status == statusFilter);
        if (sizeFilter is not null) query = query.Where(s => s.Size == sizeFilter);
        // Ricerca per nome: EF traduce Contains in LIKE %q% (case-insensitive
        // con la collation di default di SQL Server). Applicata prima di Skip/Take.
        var nameQuery = q?.Trim();
        if (!string.IsNullOrEmpty(nameQuery)) query = query.Where(s => s.Name.Contains(nameQuery));

        var total = await query.CountAsync();
        var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);

        var items = await query
            .OrderByDescending(s => s.Id) // più recenti in cima (registrazione = Id crescente)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new ShipDto(
                s.Id, s.Name, s.Size, s.ArrivalDay, s.Duration,
                s.Status.ToString(), s.BerthId, s.OccupationStartDay, s.Notes,
                s.Berth != null ? s.Berth.Name : null))
            .ToListAsync();

        return Ok(new ShipPageResponse(items, page, pageSize, total, totalPages, counts));
    }

    // ==========================================================================
    //  POST /api/ships — crea una nuova nave (ruolo Operatore)
    //  size, giorno di arrivo e durata sono generati dal backend; la nave nasce Pending.
    // ==========================================================================
    [HttpPost]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<IActionResult> CreateShip([FromBody] CreateShipRequest request)
    {
        // --- Validazione input: nome obbligatorio, nota opzionale ---
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Problem(
                detail: "Il nome della nave non può essere vuoto.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // La nota è facoltativa (es. carico, priorità): stringa vuota -> NULL.
        var notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        if (notes is { Length: > 2000 })
        {
            return Problem(
                detail: "La nota non può superare i 2000 caratteri.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // --- Leggo il giorno corrente virtuale dalla tabella Settings ---
        var setting = await _context.Settings
            .FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");

        if (setting is null || !int.TryParse(setting.Value, out var currentDay))
        {
            return Problem(
                detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        // --- Delego la composizione della nave (size/arrivo/durata casuali) al servizio dedicato ---
        var ship = _generator.GenerateShip(request.Name, currentDay);
        ship.Notes = notes;

        // --- Salvo e rispondo 201 Created ---
        _context.Ships.Add(ship);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetShips), new { id = ship.Id }, ship);
    }

    // ==========================================================================
    //  DELETE /api/ships/{id} — annulla una nave registrata per errore (ruolo Operatore)
    //  Consentito SOLO finché la nave è Pending: una volta assegnata entra nel ciclo
    //  della banchina e la consegna vieta modifiche post-assegnazione. Hard delete
    //  (la nave Pending non è mai entrata nel ciclo → il modello a 3 stati resta intatto).
    // ==========================================================================
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<IActionResult> CancelShip(int id)
    {
        var ship = await _context.Ships.FindAsync(id);
        if (ship is null)
        {
            return Problem(
                detail: $"Nave con id {id} non trovata.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Annullabile solo prima dell'assegnazione: dopo, la consegna vieta modifiche.
        if (ship.Status != ShipStatus.Pending)
        {
            return Problem(
                detail: $"La nave è annullabile solo in stato Pending (stato attuale: {ship.Status}).",
                statusCode: StatusCodes.Status409Conflict);
        }

        _context.Ships.Remove(ship);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ==========================================================================
    //  PUT /api/ships/{id} — modifica i metadati (nome, note) di una nave.
    //  Rientra nella responsabilità dell'Operatore ("mantiene le informazioni e
    //  lo stato delle navi"): non tocca taglia/arrivo/durata né l'assegnazione.
    // ==========================================================================
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<IActionResult> UpdateShip(int id, [FromBody] UpdateShipRequest request)
    {
        var ship = await _context.Ships.FindAsync(id);
        if (ship is null)
        {
            return Problem(
                detail: $"Nave con id {id} non trovata.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Problem(
                detail: "Il nome della nave non può essere vuoto.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        if (notes is { Length: > 2000 })
        {
            return Problem(
                detail: "La nota non può superare i 2000 caratteri.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        ship.Name = request.Name.Trim();
        ship.Notes = notes;
        await _context.SaveChangesAsync();

        string? berthName = null;
        if (ship.BerthId is not null)
        {
            var b = await _context.Berths.FindAsync(ship.BerthId);
            berthName = b?.Name;
        }
        return Ok(new ShipDto(ship.Id, ship.Name, ship.Size, ship.ArrivalDay, ship.Duration,
            ship.Status.ToString(), ship.BerthId, ship.OccupationStartDay, ship.Notes, berthName));
    }

    // ==========================================================================
    //  POST /api/ships/{id}/assign — assegna una nave a una banchina (ruolo Scheduler)
    // ==========================================================================
    /// <summary>
    /// Assegna una nave Pending a una banchina scelta dallo Scheduler.
    /// Valida la compatibilità di dimensione e calcola il primo giorno libero
    /// della banchina (algoritmo di accodamento). La nave passa a Assigned.
    /// </summary>
    [HttpPost("{id:int}/assign")]
    [Authorize(Roles = "Scheduler,Admin")]
    public async Task<IActionResult> AssignShip(int id, [FromBody] AssignShipRequest request)
    {
        // --- 1) La nave esiste? ---
        var ship = await _context.Ships.FindAsync(id);
        if (ship is null)
        {
            return Problem(
                detail: $"Nave con id {id} non trovata.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // --- 2) La nave è ancora assegnabile? La consegna vieta le riassegnazioni ---
        if (ship.Status != ShipStatus.Pending)
        {
            return Problem(
                detail: $"La nave non è in stato Pending (stato attuale: {ship.Status}).",
                statusCode: StatusCodes.Status409Conflict);
        }

        // --- 3) La banchina esiste? ---
        var berth = await _context.Berths.FindAsync(request.BerthId);
        if (berth is null)
        {
            return Problem(
                detail: $"Banchina con id {request.BerthId} non trovata.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // --- 4) Compatibilità di dimensione (TASK 1) ---
        if (!SchedulingRules.IsCompatible(ship.Size, berth.Size))
        {
            return Problem(
                detail: $"Nave di dimensione {ship.Size} non compatibile con banchina {berth.Size}.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // --- 5) Giorno corrente virtuale (come in CreateShip) ---
        var setting = await _context.Settings
            .FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");

        if (setting is null || !int.TryParse(setting.Value, out var currentDay))
        {
            return Problem(
                detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        // --- 6) Occupazioni attive già presenti su questa banchina -> intervalli [Start, End) ---
        //     Due passaggi: prima dal DB (EF sa tradurre un tipo anonimo), poi in memoria
        //     costruisco le tuple (EF non sa tradurre le ValueTuple in SQL).
        var occupations = await _context.Ships
            .Where(s => s.BerthId == berth.Id && s.Status == ShipStatus.Assigned)
            .Select(s => new { s.OccupationStartDay, s.Duration })
            .ToListAsync();

        // --- 6b) Manutenzioni programmate su questa banchina. Hanno la STESSA semantica
        //     [Start, End) delle occupazioni, quindi entrano nella stessa lista:
        //     per SchedulingRules una banchina in manutenzione blocca come una nave.
        //     È il motivo per cui l'algoritmo non è cambiato di una riga.
        var maintenances = await _context.BerthMaintenance
            .Where(m => m.BerthId == berth.Id)
            .Select(m => new { m.StartDay, m.EndDay })
            .ToListAsync();

        var intervals = occupations
            .Select(o => (Start: o.OccupationStartDay!.Value, End: o.OccupationStartDay!.Value + o.Duration))
            .Concat(maintenances.Select(m => (Start: m.StartDay, End: m.EndDay)))
            .ToList();

        // --- Algoritmo di accodamento (TASK 2): calcola il primo giorno libero ---
        var startDay = SchedulingRules.ComputeOccupationStartDay(
            ship.ArrivalDay, ship.Duration, currentDay, intervals);

        // --- 7) Salvo l'assegnazione e cambio stato ---
        ship.BerthId = berth.Id;
        ship.OccupationStartDay = startDay;
        ship.Status = ShipStatus.Assigned;

        // --- 7b) Storico (#1): riga append-only 'Assigned'. Stesso SaveChanges =
        //         stessa transazione dell'assegnazione, quindi atomico. ---
        _context.AssignmentHistory.Add(new AssignmentHistory
        {
            ShipId = ship.Id,
            ShipName = ship.Name,
            Size = ship.Size,
            BerthId = berth.Id,
            BerthName = berth.Name,
            OccupationStartDay = startDay,
            OccupationEndDay = startDay + ship.Duration,
            EventType = HistoryEventType.Assigned,
            EventDay = currentDay,
        });

        await _context.SaveChangesAsync();

        // --- 8) Rispondo con una DTO (non l'entità, per evitare i cicli di navigazione EF -> 500) ---
        return Ok(new AssignShipResponse(
            ship.Id, ship.Name, ship.Size, berth.Id, startDay, ship.Status));
    }

    // ==========================================================================
    //  POST /api/ships/{id}/unassign — annulla un'assegnazione PRIMA che
    //  l'occupazione inizi: la nave torna Pending e si può riassegnare.
    //  Deviazione consapevole dalla consegna (che vieta modifiche dopo
    //  l'assegnazione), limitata al caso "correzione prima dell'effetto".
    // ==========================================================================
    [HttpPost("{id:int}/unassign")]
    [Authorize(Roles = "Scheduler,Admin")]
    public async Task<IActionResult> UnassignShip(int id)
    {
        var ship = await _context.Ships.FindAsync(id);
        if (ship is null)
        {
            return Problem(
                detail: $"Nave con id {id} non trovata.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (ship.Status != ShipStatus.Assigned)
        {
            return Problem(
                detail: $"Solo una nave assegnata può essere annullata (stato attuale: {ship.Status}).",
                statusCode: StatusCodes.Status409Conflict);
        }

        var setting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");
        if (setting is null || !int.TryParse(setting.Value, out var currentDay))
        {
            return Problem(
                detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        // Consentito solo finché l'occupazione NON è ancora iniziata.
        if (ship.OccupationStartDay is int start && currentDay >= start)
        {
            return Problem(
                detail: "L'occupazione è già iniziata: l'assegnazione non è più annullabile.",
                statusCode: StatusCodes.Status409Conflict);
        }

        // Torna Pending e rimuove la voce di storico 'Assigned' della assegnazione
        // annullata (come se non fosse mai avvenuta).
        ship.Status = ShipStatus.Pending;
        ship.BerthId = null;
        ship.OccupationStartDay = null;

        var assignedRows = await _context.AssignmentHistory
            .Where(h => h.ShipId == id && h.EventType == HistoryEventType.Assigned)
            .ToListAsync();
        _context.AssignmentHistory.RemoveRange(assignedRows);

        await _context.SaveChangesAsync();

        return Ok(new { ship.Id, ship.Name, Status = ship.Status.ToString() });
    }

    // ==========================================================================
    //  PUT /api/ships/{id}/assignment — modifica un'assegnazione (Scheduler):
    //  cambia banchina (ricalcolando il primo slot libero), nome e note.
    //  Consentito SOLO finché l'occupazione non è iniziata. Aggiorna la riga
    //  di storico 'Assigned' per riflettere la modifica.
    // ==========================================================================
    [HttpPut("{id:int}/assignment")]
    [Authorize(Roles = "Scheduler,Admin")]
    public async Task<IActionResult> EditAssignment(int id, [FromBody] EditAssignmentRequest request)
    {
        var ship = await _context.Ships.FindAsync(id);
        if (ship is null)
        {
            return Problem(detail: $"Nave con id {id} non trovata.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (ship.Status != ShipStatus.Assigned)
        {
            return Problem(detail: $"Solo un'assegnazione può essere modificata (stato attuale: {ship.Status}).",
                statusCode: StatusCodes.Status409Conflict);
        }

        var setting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");
        if (setting is null || !int.TryParse(setting.Value, out var currentDay))
        {
            return Problem(detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        if (ship.OccupationStartDay is int st && currentDay >= st)
        {
            return Problem(detail: "L'occupazione è già iniziata: l'assegnazione non è più modificabile.",
                statusCode: StatusCodes.Status409Conflict);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Problem(detail: "Il nome della nave non può essere vuoto.",
                statusCode: StatusCodes.Status400BadRequest);
        }
        var notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        if (notes is { Length: > 2000 })
        {
            return Problem(detail: "La nota non può superare i 2000 caratteri.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var berth = await _context.Berths.FindAsync(request.BerthId);
        if (berth is null)
        {
            return Problem(detail: $"Banchina con id {request.BerthId} non trovata.",
                statusCode: StatusCodes.Status404NotFound);
        }
        if (!SchedulingRules.IsCompatible(ship.Size, berth.Size))
        {
            return Problem(detail: $"Nave di dimensione {ship.Size} non compatibile con banchina {berth.Size}.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // Se cambia la banchina, ricalcolo il primo slot libero (escludendo questa
        // nave). Altrimenti tengo l'occupazione attuale.
        var startDay = ship.OccupationStartDay!.Value;
        if (berth.Id != ship.BerthId)
        {
            var occupations = await _context.Ships
                .Where(s => s.BerthId == berth.Id && s.Status == ShipStatus.Assigned && s.Id != ship.Id)
                .Select(s => new { s.OccupationStartDay, s.Duration })
                .ToListAsync();
            var maintenances = await _context.BerthMaintenance
                .Where(m => m.BerthId == berth.Id)
                .Select(m => new { m.StartDay, m.EndDay })
                .ToListAsync();
            var intervals = occupations
                .Select(o => (Start: o.OccupationStartDay!.Value, End: o.OccupationStartDay!.Value + o.Duration))
                .Concat(maintenances.Select(m => (Start: m.StartDay, End: m.EndDay)))
                .ToList();
            startDay = SchedulingRules.ComputeOccupationStartDay(ship.ArrivalDay, ship.Duration, currentDay, intervals);
            ship.BerthId = berth.Id;
            ship.OccupationStartDay = startDay;
        }

        ship.Name = request.Name.Trim();
        ship.Notes = notes;

        // Riallineo la riga di storico 'Assigned' a nome/banchina/occupazione nuovi.
        var histRow = await _context.AssignmentHistory
            .Where(h => h.ShipId == id && h.EventType == HistoryEventType.Assigned)
            .OrderByDescending(h => h.Id)
            .FirstOrDefaultAsync();
        if (histRow is not null)
        {
            histRow.ShipName = ship.Name;
            histRow.BerthId = berth.Id;
            histRow.BerthName = berth.Name;
            histRow.OccupationStartDay = startDay;
            histRow.OccupationEndDay = startDay + ship.Duration;
        }

        await _context.SaveChangesAsync();

        return Ok(new AssignShipResponse(ship.Id, ship.Name, ship.Size, berth.Id, startDay, ship.Status));
    }
}
