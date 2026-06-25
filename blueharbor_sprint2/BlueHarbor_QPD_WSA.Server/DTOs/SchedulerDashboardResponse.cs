namespace BlueHarbor_QPD_WSA.Server.DTOs;

/// <summary>
/// Tutto ciò che serve allo Scheduler in una sola risposta:
/// il giorno corrente, le navi da assegnare e lo stato di ogni banchina.
/// È il contratto che il frontend usa per costruire la SchedulerView.
/// </summary>
public record SchedulerDashboardResponse(
    int CurrentDay,
    IReadOnlyList<PendingShipDto> PendingShips,
    IReadOnlyList<BerthStatusDto> Berths);

/// <summary>Nave in attesa di assegnazione.</summary>
public record PendingShipDto(
    int Id,
    string Name,
    string Size,
    int ArrivalDay,
    int Duration);

/// <summary>Stato di una banchina con la sua coda di occupazioni attive.</summary>
public record BerthStatusDto(
    int Id,
    string Name,
    string Size,
    bool IsOccupiedNow,
    IReadOnlyList<BerthAssignmentDto> Assignments);

/// <summary>Una singola occupazione sulla banchina: intervallo [StartDay, EndDay).</summary>
public record BerthAssignmentDto(
    int ShipId,
    string ShipName,
    int StartDay,
    int EndDay);
