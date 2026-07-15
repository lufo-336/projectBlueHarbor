// ═══ SPRINT 1 ═══
// Specchio della tabella dbo.Ships. BerthId e OccupationStartDay sono
// nullable: valorizzati solo quando la nave viene assegnata (Sprint 3).
namespace BlueHarbor.Api.Models;

public class Ship
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Size { get; set; } = "";
    public int ArrivalDay { get; set; }
    public int Duration { get; set; }
    public string Status { get; set; } = ShipStatus.Pending;
    public int? BerthId { get; set; }
    public int? OccupationStartDay { get; set; }
}
