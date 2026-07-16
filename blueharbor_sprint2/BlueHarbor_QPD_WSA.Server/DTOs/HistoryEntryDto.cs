namespace BlueHarbor_QPD_WSA.Server.DTOs;

/// <summary>
/// Riga dello storico esposta in lettura da <c>GET /api/history</c>.
/// </summary>
public record HistoryEntryDto(
    int Id,
    int ShipId,
    string ShipName,
    string Size,
    int BerthId,
    string BerthName,
    int OccupationStartDay,
    int OccupationEndDay,
    string EventType,
    int EventDay,
    DateTime CreatedAt);
