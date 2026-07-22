namespace BlueHarbor_QPD_WSA.Server.DTOs;

/// <summary>Finestra di manutenzione come esce dalle API: intervallo [StartDay, EndDay).</summary>
public record MaintenanceDto(
    int Id,
    int BerthId,
    string BerthName,
    int StartDay,
    int EndDay);

/// <summary>Corpo di POST /api/admin/maintenance.</summary>
public record CreateMaintenanceRequest(
    int BerthId,
    int StartDay,
    int EndDay);
