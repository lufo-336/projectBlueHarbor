namespace BlueHarbor_QPD_WSA.Server.DTOs;

/// <summary>
/// Proiezione di lettura di una nave. Si risponde con questa DTO, mai con
/// l'entità <c>Ship</c>, per evitare i cicli di navigazione EF (Ship -> Berth -> …)
/// che finirebbero in un 500 durante la serializzazione.
/// </summary>
public record ShipDto(
    int Id,
    string Name,
    string Size,
    int ArrivalDay,
    int Duration,
    string Status,
    int? BerthId,
    int? OccupationStartDay,
    string? Notes,
    string? BerthName);
