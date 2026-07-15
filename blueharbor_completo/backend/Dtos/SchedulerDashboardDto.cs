// ═══ SPRINT 3 ═══
// Tutto ciò che serve alla vista Scheduler in UNA chiamata: navi in attesa
// + fotografia delle 8 banchine con i loro blocchi di occupazione.
namespace BlueHarbor.Api.Dtos;

public class OccupationDto
{
    public int ShipId { get; set; }
    public string ShipName { get; set; } = "";
    public int StartDay { get; set; }
    public int EndDay { get; set; }   // = StartDay + Duration - 1
}

public class BerthDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Size { get; set; } = "";
    public List<OccupationDto> Occupations { get; set; } = [];
}

public class SchedulerDashboardDto
{
    public int CurrentDay { get; set; }
    public List<ShipDto> PendingShips { get; set; } = [];
    public List<BerthDto> Berths { get; set; } = [];
}
