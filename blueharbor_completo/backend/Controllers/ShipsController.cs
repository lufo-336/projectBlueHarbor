// ═══ SPRINT 2 (paginazione SPRINT 7, assign SPRINT 3 nel Task 5) ═══
// Le navi: registrazione (Operator) e consultazione paginata.
using BlueHarbor.Api.Data;
using BlueHarbor.Api.Dtos;
using BlueHarbor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Controllers;

// GET resta accessibile a entrambi i ruoli (Operator e Scheduler devono
// vedere l'elenco navi); Create e Assign sono ristretti al ruolo giusto.
[ApiController]
[Route("api/ships")]
[Authorize]
public class ShipsController : ControllerBase
{
    private readonly Db _db;
    private readonly ShipGeneratorService _generator;
    private readonly BerthAssignmentService _assignment;

    public ShipsController(Db db, ShipGeneratorService generator, BerthAssignmentService assignment)
    {
        _db = db;
        _generator = generator;
        _assignment = assignment;
    }

    // POST /api/ships — [ApiController] valida CreateShipRequest da solo:
    // se Name manca risponde 400 ProblemDetails senza entrare qui (Sprint 7).
    [HttpPost]
    [Authorize(Roles = "Operator")]
    public async Task<IActionResult> Create(CreateShipRequest request)
    {
        var ship = await _generator.CreateShipAsync(request.Name);
        // 201 + header Location: la risorsa creata è consultabile in lista.
        return Created($"/api/ships?status=&page=1&pageSize=20", ship);
    }

    // GET /api/ships?status=Pending&page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        // Guardie sui parametri: mai fidarsi dell'input (modulo Sicurezza).
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 20;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // 1) conteggio totale per i metadati di paginazione
        using var countCmd = new SqlCommand(
            "SELECT COUNT(*) FROM Ships WHERE (@status IS NULL OR Status = @status)", conn);
        countCmd.Parameters.AddWithValue("@status", (object?)status ?? DBNull.Value);
        var totalCount = (int)(await countCmd.ExecuteScalarAsync())!;

        // 2) pagina richiesta: OFFSET/FETCH (T-SQL, modulo Basi di Dati)
        using var cmd = new SqlCommand(@"
            SELECT s.Id, s.Name, s.Size, s.ArrivalDay, s.Duration, s.Status,
                   s.BerthId, s.OccupationStartDay, b.Name AS BerthName
            FROM Ships s
            LEFT JOIN Berths b ON b.Id = s.BerthId
            WHERE (@status IS NULL OR s.Status = @status)
            ORDER BY s.Id
            OFFSET (@page - 1) * @pageSize ROWS FETCH NEXT @pageSize ROWS ONLY", conn);
        cmd.Parameters.AddWithValue("@status", (object?)status ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        var items = new List<ShipDto>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            items.Add(ShipDto.FromReader(reader));

        return Ok(new PagedShipsResponse
        {
            Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize
        });
    }

    // POST /api/ships/{id}/assign — solo Scheduler.
    [HttpPost("{id:int}/assign")]
    [Authorize(Roles = "Scheduler")]
    public async Task<IActionResult> Assign(int id, AssignShipRequest request)
        => Ok(await _assignment.AssignAsync(id, request.BerthId));
}
