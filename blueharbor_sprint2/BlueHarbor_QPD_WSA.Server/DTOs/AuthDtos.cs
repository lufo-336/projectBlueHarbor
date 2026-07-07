namespace BlueHarbor_QPD_WSA.Server.DTOs;

// ==========================================================================
//  DTO per l'autenticazione. Le forme rispecchiano il contratto che il
//  frontend si aspetta: login riceve { email, password } e riceve indietro
//  { user: { email, name, role }, token }.
// ==========================================================================

/// <summary>Credenziali inviate dal client al login.</summary>
public record LoginRequest(string Email, string Password);

/// <summary>Dati dell'utente esposti al frontend (mai la password).</summary>
public record UserDto(string Email, string Name, string Role);

/// <summary>Risposta del login: l'utente + il token JWT da usare nelle chiamate successive.</summary>
public record LoginResponse(UserDto User, string Token);
