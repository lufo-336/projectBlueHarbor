// ═══ SPRINT 8 ═══ Una riga dello storico, arricchita con i nomi leggibili.
namespace BlueHarbor.Api.Dtos;

public class HistoryEntryDto
{
    public int Id { get; set; }
    public int ShipId { get; set; }
    public string ShipName { get; set; } = "";
    public int BerthId { get; set; }
    public string BerthName { get; set; } = "";
    public int OccupationStartDay { get; set; }
    public int OccupationEndDay { get; set; }
    public string EventType { get; set; } = "";   // Assigned | Departed
    public DateTime RecordedAt { get; set; }
}
