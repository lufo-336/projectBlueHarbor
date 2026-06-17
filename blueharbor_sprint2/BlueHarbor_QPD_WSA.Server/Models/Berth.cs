namespace BlueHarbor_QPD_WSA.Server.Models;

/// <summary>
/// Banchina del porto. Le 8 banchine sono dati statici (seeding una volta sola).
/// Una banchina ospita solo navi della propria identica dimensione.
/// </summary>
public class Berth
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Size { get; set; } = null!;

    public ICollection<Ship> Ships { get; set; } = new List<Ship>();
}
