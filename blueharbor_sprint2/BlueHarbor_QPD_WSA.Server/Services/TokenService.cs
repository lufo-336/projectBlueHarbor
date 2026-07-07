using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BlueHarbor_QPD_WSA.Server.Models;
using Microsoft.IdentityModel.Tokens;

namespace BlueHarbor_QPD_WSA.Server.Services;

/// <summary>
/// Crea e valida i token JWT. Il token è firmato con una chiave segreta (da appsettings)
/// e contiene l'identità dell'utente (username + ruolo). È "stateless": il server non
/// tiene sessioni, tutta l'informazione è dentro al token firmato.
/// </summary>
public class TokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    // Chiave simmetrica usata per firmare e verificare (deve essere lunga >= 32 caratteri).
    private SymmetricSecurityKey SigningKey =>
        new(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

    // ==========================================================================
    //  Creazione del token (al login)
    // ==========================================================================
    public string CreateToken(User user)
    {
        // I "claim" sono le informazioni trasportate dal token.
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var credentials = new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8), // il token scade dopo 8 ore
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // ==========================================================================
    //  Validazione del token (usata da /auth/me)
    //  Restituisce l'identità se il token è valido, altrimenti null.
    // ==========================================================================
    public ClaimsPrincipal? Validate(string token)
    {
        try
        {
            var parameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _config["Jwt:Audience"],
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = SigningKey,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero // niente tolleranza extra sulla scadenza
            };

            return new JwtSecurityTokenHandler().ValidateToken(token, parameters, out _);
        }
        catch
        {
            // Firma non valida, token scaduto o malformato -> non autenticato.
            return null;
        }
    }
}
