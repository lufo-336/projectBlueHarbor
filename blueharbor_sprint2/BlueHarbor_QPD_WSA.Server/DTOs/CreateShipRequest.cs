namespace BlueHarbor_QPD_WSA.Server.DTOs;

public record CreateShipRequest(string Name, string? Notes = null);

/// <summary>Modifica dei metadati di una nave (l'Operatore "mantiene le informazioni").</summary>
public record UpdateShipRequest(string Name, string? Notes = null);

/// <summary>Modifica di un'assegnazione (Scheduler): banchina + nome + note,
/// consentita solo finché l'occupazione non è iniziata.</summary>
public record EditAssignmentRequest(int BerthId, string Name, string? Notes = null);