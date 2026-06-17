namespace BlueHarbor_QPD_WSA.Server.Models;

/// <summary>
/// Nave registrata dall'Operatore. Il collegamento alla banchina vive qui:
/// <see cref="BerthId"/> e <see cref="OccupationStartDay"/> restano NULL finché
/// la nave è Pending, vengono valorizzati quando lo Scheduler la assegna e
/// mantenuti come storico quando passa a Departed.
/// </summary>
public class Ship
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Size { get; set; } = null!;

    public int ArrivalDay { get; set; }

    public int Duration { get; set; }

    public ShipStatus Status { get; set; } = ShipStatus.Pending;

    public int? BerthId { get; set; }

    public int? OccupationStartDay { get; set; }

    public string? Notes { get; set; }

    public Berth? Berth { get; set; }
}
