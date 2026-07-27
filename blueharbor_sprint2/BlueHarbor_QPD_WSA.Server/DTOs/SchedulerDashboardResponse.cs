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
    int Duration,
    string? Notes);

/// <summary>Stato di una banchina con la sua coda di occupazioni attive e le manutenzioni.</summary>
public record BerthStatusDto(
    int Id,
    string Name,
    string Size,
    bool IsOccupiedNow,
    bool IsUnderMaintenanceNow,
    IReadOnlyList<BerthAssignmentDto> Assignments,
    IReadOnlyList<BerthMaintenanceDto> Maintenances);

/// <summary>Finestra di indisponibilità sulla banchina: intervallo [StartDay, EndDay).</summary>
public record BerthMaintenanceDto(
    int Id,
    int StartDay,
    int EndDay);

/// <summary>Una singola occupazione sulla banchina: intervallo [StartDay, EndDay).
/// AssignSeq è l'Id (crescente) dell'evento di assegnazione: serve a ordinare
/// "ultima assegnata per prima" senza dipendere dalle date.</summary>
public record BerthAssignmentDto(
    int ShipId,
    string ShipName,
    string Size,
    string? Notes,
    int StartDay,
    int EndDay,
    int AssignSeq);
