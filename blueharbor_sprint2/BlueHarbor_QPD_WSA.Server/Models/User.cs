namespace BlueHarbor_QPD_WSA.Server.Models;

/// <summary>
/// Utente dell'applicazione. Ruoli ammessi: Operator, Scheduler.
/// </summary>
public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string Role { get; set; } = null!;
}
