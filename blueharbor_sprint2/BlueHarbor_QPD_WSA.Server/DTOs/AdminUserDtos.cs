namespace BlueHarbor_QPD_WSA.Server.DTOs;

// ==========================================================================
//  DTO per la gestione utenti (ruolo Admin). Non espongono mai l'hash password.
// ==========================================================================

/// <summary>Utente esposto in lettura all'Admin (senza hash password).</summary>
public record AdminUserDto(int Id, string Username, string Role, bool IsActive);

/// <summary>Creazione utente: username, ruolo e password iniziale.</summary>
public record CreateUserRequest(string Username, string Role, string Password);

/// <summary>
/// Aggiornamento utente: tutti i campi sono opzionali (si aggiorna solo ciò che è
/// presente). <c>Password</c> valorizzata = reset password.
/// </summary>
public record UpdateUserRequest(string? Role, bool? IsActive, string? Password);
