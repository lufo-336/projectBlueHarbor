using BlueHarbor_QPD_WSA.Server.DTOs;
using BlueHarbor_QPD_WSA.Server.Models;
using BlueHarbor_QPD_WSA.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Controllers;

/// <summary>
/// Gestione accessi (ruolo Admin di piattaforma): elenco, creazione, modifica e
/// disattivazione degli utenti. NON espone poteri di dominio: l'Admin opera come
/// Operator/Scheduler tramite gli endpoint esistenti, non da qui.
/// Rotta base: /api/admin
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private static readonly string[] ValidRoles = { "Operator", "Scheduler", "Admin" };

    private readonly BlueHarborContext _context;

    public AdminController(BlueHarborContext context)
    {
        _context = context;
    }

    // ==========================================================================
    //  GET /api/admin/users — elenco utenti (senza hash password)
    // ==========================================================================
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.Id)
            .Select(u => new AdminUserDto(u.Id, u.Username, u.Role, u.IsActive))
            .ToListAsync();

        return Ok(users);
    }

    // ==========================================================================
    //  POST /api/admin/users — crea un nuovo utente
    // ==========================================================================
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var username = request.Username?.Trim();

        if (string.IsNullOrWhiteSpace(username))
            return Problem(detail: "Lo username è obbligatorio.", statusCode: StatusCodes.Status400BadRequest);
        if (username.Length > 50)
            return Problem(detail: "Lo username non può superare i 50 caratteri.", statusCode: StatusCodes.Status400BadRequest);
        if (!ValidRoles.Contains(request.Role))
            return Problem(detail: $"Ruolo '{request.Role}' non valido. Ammessi: Operator, Scheduler, Admin.", statusCode: StatusCodes.Status400BadRequest);
        if (string.IsNullOrWhiteSpace(request.Password))
            return Problem(detail: "La password iniziale è obbligatoria.", statusCode: StatusCodes.Status400BadRequest);
        if (await _context.Users.AnyAsync(u => u.Username == username))
            return Problem(detail: $"Esiste già un utente '{username}'.", statusCode: StatusCodes.Status409Conflict);

        var user = new User
        {
            Username = username,
            Role = request.Role,
            PasswordHash = PasswordHasher.Hash(request.Password),
            IsActive = true,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUsers), new { id = user.Id },
            new AdminUserDto(user.Id, user.Username, user.Role, user.IsActive));
    }

    // ==========================================================================
    //  PUT /api/admin/users/{id} — cambia ruolo / (dis)attiva / reset password
    //  Tutti i campi del body sono opzionali: si aggiorna solo ciò che è presente.
    // ==========================================================================
    [HttpPut("users/{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null)
            return Problem(detail: $"Utente con id {id} non trovato.", statusCode: StatusCodes.Status404NotFound);

        // Calcolo i valori risultanti (servono ai guardrail prima di applicarli).
        var newRole = user.Role;
        if (request.Role is not null)
        {
            if (!ValidRoles.Contains(request.Role))
                return Problem(detail: $"Ruolo '{request.Role}' non valido. Ammessi: Operator, Scheduler, Admin.", statusCode: StatusCodes.Status400BadRequest);
            newRole = request.Role;
        }
        var newActive = request.IsActive ?? user.IsActive;

        if (request.Password is not null && string.IsNullOrWhiteSpace(request.Password))
            return Problem(detail: "La nuova password non può essere vuota.", statusCode: StatusCodes.Status400BadRequest);

        var guardrail = await CheckAdminGuardrailsAsync(user, newRole, newActive);
        if (guardrail is not null) return guardrail;

        user.Role = newRole;
        user.IsActive = newActive;
        if (!string.IsNullOrWhiteSpace(request.Password))
            user.PasswordHash = PasswordHasher.Hash(request.Password);

        await _context.SaveChangesAsync();
        return Ok(new AdminUserDto(user.Id, user.Username, user.Role, user.IsActive));
    }

    // ==========================================================================
    //  DELETE /api/admin/users/{id} — disattivazione (soft delete: preferito
    //  all'eliminazione, così lo storico e i riferimenti restano coerenti)
    // ==========================================================================
    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null)
            return Problem(detail: $"Utente con id {id} non trovato.", statusCode: StatusCodes.Status404NotFound);

        var guardrail = await CheckAdminGuardrailsAsync(user, user.Role, isActiveAfter: false);
        if (guardrail is not null) return guardrail;

        user.IsActive = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ==========================================================================
    //  GET /api/admin/maintenance — finestre programmate (filtro ?berthId=)
    // ==========================================================================
    [HttpGet("maintenance")]
    public async Task<IActionResult> GetMaintenance([FromQuery] int? berthId)
    {
        var query = _context.BerthMaintenance.AsQueryable();
        if (berthId is not null) query = query.Where(m => m.BerthId == berthId);

        var list = await query
            .OrderBy(m => m.StartDay).ThenBy(m => m.Id)
            .Select(m => new MaintenanceDto(m.Id, m.BerthId, m.Berth!.Name, m.StartDay, m.EndDay))
            .ToListAsync();

        return Ok(list);
    }

    // ==========================================================================
    //  POST /api/admin/maintenance — programma una finestra di indisponibilità
    //  Regola d'oro: una nave già assegnata non si tocca MAI. Se la finestra la
    //  incrocia si rifiuta (409) e sarà l'Admin a scegliere altri giorni.
    // ==========================================================================
    [HttpPost("maintenance")]
    public async Task<IActionResult> CreateMaintenance([FromBody] CreateMaintenanceRequest request)
    {
        var berth = await _context.Berths.FindAsync(request.BerthId);
        if (berth is null)
            return Problem(detail: $"Banchina con id {request.BerthId} non trovata.",
                           statusCode: StatusCodes.Status404NotFound);

        if (request.EndDay <= request.StartDay)
            return Problem(detail: "Il giorno di fine deve essere successivo a quello di inizio.",
                           statusCode: StatusCodes.Status400BadRequest);

        var currentDay = await GetCurrentDayAsync();
        if (currentDay is null)
            return Problem(detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                           statusCode: StatusCodes.Status500InternalServerError);

        if (request.StartDay < currentDay)
            return Problem(detail: $"Non si può programmare una manutenzione nel passato (giorno corrente: {currentDay}).",
                           statusCode: StatusCodes.Status400BadRequest);

        // Conflitto con navi ASSEGNATE su questa banchina. Solo Assigned: le Departed
        // hanno finito, le Pending non hanno ancora una banchina.
        var assigned = await _context.Ships
            .Where(s => s.BerthId == berth.Id && s.Status == ShipStatus.Assigned)
            .Select(s => new { s.Name, s.OccupationStartDay, s.Duration })
            .ToListAsync();

        // [a1,a2) e [b1,b2) si sovrappongono se a1 < b2 && b1 < a2.
        var clashing = assigned
            .Where(s => s.OccupationStartDay!.Value < request.EndDay
                     && request.StartDay < s.OccupationStartDay!.Value + s.Duration)
            .Select(s => s.Name)
            .ToList();

        if (clashing.Count > 0)
            return Problem(
                detail: $"La finestra confligge con navi già assegnate a {berth.Name}: {string.Join(", ", clashing)}. Le navi assegnate non si spostano: scegli altri giorni.",
                statusCode: StatusCodes.Status409Conflict);

        var overlaps = await _context.BerthMaintenance.AnyAsync(m =>
            m.BerthId == berth.Id && m.StartDay < request.EndDay && request.StartDay < m.EndDay);

        if (overlaps)
            return Problem(detail: $"Esiste già una manutenzione sovrapposta su {berth.Name}.",
                           statusCode: StatusCodes.Status409Conflict);

        var maintenance = new BerthMaintenance
        {
            BerthId = berth.Id,
            StartDay = request.StartDay,
            EndDay = request.EndDay,
        };
        _context.BerthMaintenance.Add(maintenance);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMaintenance), new { id = maintenance.Id },
            new MaintenanceDto(maintenance.Id, berth.Id, berth.Name,
                               maintenance.StartDay, maintenance.EndDay));
    }

    // ==========================================================================
    //  DELETE /api/admin/maintenance/{id} — revoca una finestra NON ancora iniziata
    // ==========================================================================
    [HttpDelete("maintenance/{id:int}")]
    public async Task<IActionResult> DeleteMaintenance(int id)
    {
        var maintenance = await _context.BerthMaintenance.FindAsync(id);
        if (maintenance is null)
            return Problem(detail: $"Manutenzione con id {id} non trovata.",
                           statusCode: StatusCodes.Status404NotFound);

        var currentDay = await GetCurrentDayAsync();
        if (currentDay is null)
            return Problem(detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                           statusCode: StatusCodes.Status500InternalServerError);

        if (maintenance.StartDay <= currentDay)
            return Problem(detail: "Una manutenzione già iniziata non si revoca.",
                           statusCode: StatusCodes.Status409Conflict);

        _context.BerthMaintenance.Remove(maintenance);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ==========================================================================
    //  POST /api/admin/simulation/reset — riporta la simulazione allo stato iniziale
    //  Cancella navi e storico, CurrentVirtualDay = 1. NON tocca banchine (set fisso)
    //  ne' utenti (il reset riguarda la simulazione, non gli accessi).
    // ==========================================================================
    [HttpPost("simulation/reset")]
    public async Task<IActionResult> ResetSimulation()
    {
        await using var tx = await _context.Database.BeginTransactionAsync();

        // Prima lo storico (ha FK verso Ships), poi le navi.
        var removedHistory = await _context.AssignmentHistory.ExecuteDeleteAsync();
        var removedShips = await _context.Ships.ExecuteDeleteAsync();

        var day = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");
        if (day is null)
            return Problem(
                detail: "CurrentVirtualDay non è configurato correttamente nel database.",
                statusCode: StatusCodes.Status500InternalServerError);
        day.Value = "1";
        await _context.SaveChangesAsync();

        await tx.CommitAsync();
        return Ok(new { removedShips, removedHistory });
    }

    // ==========================================================================
    //  Guardrail: nessun auto-lockout, mai zero Admin attivi.
    //  Ritorna un 409 se l'operazione toglierebbe l'accesso Admin in modo vietato,
    //  altrimenti null.
    // ==========================================================================
    private async Task<IActionResult?> CheckAdminGuardrailsAsync(User target, string roleAfter, bool isActiveAfter)
    {
        var wasActiveAdmin = target.Role == "Admin" && target.IsActive;
        var willBeActiveAdmin = roleAfter == "Admin" && isActiveAfter;

        // Il rischio esiste solo se stiamo togliendo l'accesso a un Admin oggi attivo.
        if (!wasActiveAdmin || willBeActiveAdmin) return null;

        // Auto-lockout: l'Admin non può disattivare/declassare se stesso.
        if (target.Username == User.Identity?.Name)
            return Problem(detail: "Non puoi disattivarti o declassarti da solo.", statusCode: StatusCodes.Status409Conflict);

        // Ultimo Admin attivo: deve restarne almeno un altro.
        var otherActiveAdmins = await _context.Users
            .CountAsync(u => u.Id != target.Id && u.Role == "Admin" && u.IsActive);
        if (otherActiveAdmins == 0)
            return Problem(detail: "Operazione negata: resterebbe zero Admin attivi.", statusCode: StatusCodes.Status409Conflict);

        return null;
    }

    // ==========================================================================
    //  Giorno virtuale corrente. Stessa lettura degli altri controller.
    // ==========================================================================
    private async Task<int?> GetCurrentDayAsync()
    {
        var setting = await _context.Settings
            .FirstOrDefaultAsync(s => s.Key == "CurrentVirtualDay");

        return setting is not null && int.TryParse(setting.Value, out var day) ? day : null;
    }
}
