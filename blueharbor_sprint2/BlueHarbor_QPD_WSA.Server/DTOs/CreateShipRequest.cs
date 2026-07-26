namespace BlueHarbor_QPD_WSA.Server.DTOs;

public record CreateShipRequest(string Name, string? Notes = null);

/// <summary>Modifica dei metadati di una nave (l'Operatore "mantiene le informazioni").</summary>
public record UpdateShipRequest(string Name, string? Notes = null);