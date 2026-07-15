// ═══ SPRINT 6 ═══ Contratto del login.
using System.ComponentModel.DataAnnotations;

namespace BlueHarbor.Api.Dtos;

public class LoginRequest
{
    [Required] public string Username { get; set; } = "";
    [Required] public string Password { get; set; } = "";
}

public class LoginResponse
{
    public string Username { get; set; } = "";
    public string Role { get; set; } = "";
}
