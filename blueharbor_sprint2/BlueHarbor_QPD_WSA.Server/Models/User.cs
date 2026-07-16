namespace BlueHarbor_QPD_WSA.Server.Models;

/// <summary>
/// Utente dell'applicazione. Ruoli ammessi: Operator, Scheduler, Admin.
/// L'Admin è un ruolo di piattaforma (gestione accessi + capacità di Operator
/// e Scheduler): non ha poteri di dominio vietati (nessuna riassegnazione, ecc.).
/// </summary>
public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string Role { get; set; } = null!;

    // Utente disattivato: non può più effettuare il login. Default true.
    public bool IsActive { get; set; } = true;
}
