// ═══ SPRINT 6 ═══ Specchio della tabella dbo.Users per il login.
namespace BlueHarbor.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";   // PBKDF2, mai in chiaro
    public string Role { get; set; } = "";           // Operator | Scheduler
}
