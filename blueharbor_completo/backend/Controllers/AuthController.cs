// ═══ SPRINT 6 ═══
// Login/logout con cookie di sessione firmato da ASP.NET Core.
// Il ruolo NON lo sceglie più il client: arriva dal DB con il login.
using System.Security.Claims;
using BlueHarbor.Api.Dtos;
using BlueHarbor.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlueHarbor.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;

    public AuthController(AuthService auth) => _auth = auth;

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _auth.FindByUsernameAsync(request.Username);
        // Anche se l'utente non esiste, verifichiamo comunque contro un hash finto:
        // cosi' il tempo di risposta non rivela se e' l'username a essere sbagliato
        // (timing attack, stesso principio del FixedTimeEquals in VerifyPassword).
        var passwordOk = AuthService.VerifyPassword(
            request.Password, user?.PasswordHash ?? AuthService.DummyHashForTimingSafety);
        // Messaggio IDENTICO per utente inesistente e password errata:
        // non rivelare quale dei due è sbagliato (modulo Sicurezza).
        if (user is null || !passwordOk)
            return Problem(statusCode: StatusCodes.Status401Unauthorized,
                title: "Credenziali non valide");

        // I claim finiscono nel cookie cifrato: da qui [Authorize] sa chi sei.
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role)
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity));

        return Ok(new LoginResponse { Username = user.Username, Role = user.Role });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    // Il frontend lo chiama al mount per sopravvivere al refresh di pagina.
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me() => Ok(new LoginResponse
    {
        Username = User.Identity!.Name!,
        Role = User.FindFirstValue(ClaimTypes.Role)!
    });
}
