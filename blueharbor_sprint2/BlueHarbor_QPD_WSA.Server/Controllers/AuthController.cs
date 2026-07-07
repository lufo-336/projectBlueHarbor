using BlueHarbor_QPD_WSA.Server.DTOs;
using BlueHarbor_QPD_WSA.Server.Models;
using BlueHarbor_QPD_WSA.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BlueHarbor_QPD_WSA.Server.Controllers;

/// <summary>
/// Autenticazione: login (rilascia un token JWT), verifica sessione (/me) e logout.
/// Rotta base: /api/auth
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly BlueHarborContext _context;
    private readonly TokenService _tokens;

    public AuthController(BlueHarborContext context, TokenService tokens)
    {
        _context = context;
        _tokens = tokens;
    }

    // ==========================================================================
    //  POST /api/auth/login — valida le credenziali e rilascia un token
    // ==========================================================================
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // --- Validazione input ---
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Problem(
                detail: "Email e password sono obbligatorie.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // --- Cerco l'utente (uso lo Username come identificatore di login) ---
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Email);

        // --- Credenziali errate: uso 400 (non 401) perché il frontend intercetta i 401
        //     come "sessione scaduta" e reindirizza; qui vogliamo mostrare l'errore. ---
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Problem(
                detail: "Credenziali non valide.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // --- Credenziali corrette: rilascio il token e restituisco l'utente ---
        var token = _tokens.CreateToken(user);
        return Ok(new LoginResponse(ToDto(user), token));
    }

    // ==========================================================================
    //  GET /api/auth/me — verifica la sessione all'avvio dell'app
    // ==========================================================================
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var header = Request.Headers.Authorization.ToString();

        // --- Nessun token: rispondo 200 con null (non loggato) per NON far scattare
        //     il redirect del frontend sui 401. ---
        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith("Bearer "))
        {
            return Ok((UserDto?)null);
        }

        // --- Token presente: lo valido ---
        var token = header["Bearer ".Length..].Trim();
        var principal = _tokens.Validate(token);

        if (principal is null)
        {
            // Token scaduto/manomesso: 401 -> il frontend pulisce il token.
            return Problem(
                detail: "Token non valido o scaduto.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        // --- Ricavo l'utente dal claim e lo rileggo dal DB (fonte di verità) ---
        var username = principal.FindFirst(ClaimTypes.Name)?.Value;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

        if (user is null)
        {
            return Problem(
                detail: "Utente non trovato.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        return Ok(ToDto(user));
    }

    // ==========================================================================
    //  POST /api/auth/logout — con JWT stateless è simbolico: il client scarta il token
    // ==========================================================================
    [HttpPost("logout")]
    public IActionResult Logout() => Ok(new { message = "Logout effettuato." });

    // --- Mappa l'entità User nella DTO esposta al frontend (senza la password) ---
    private static UserDto ToDto(User user)
    {
        // "name" leggibile: la parte prima della @, se presente.
        var name = user.Username.Contains('@') ? user.Username.Split('@')[0] : user.Username;
        return new UserDto(user.Username, name, user.Role);
    }
}
