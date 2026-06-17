using BlueHarbor_QPD_WSA.Server.Models;

namespace BlueHarbor_QPD_WSA.Server.Services;

public class ShipGeneratorService
{
    private static readonly string[] Sizes = { "S", "M", "L", "XL" };

    public string GenerateSize() => Sizes[Random.Shared.Next(Sizes.Length)];

    public int GenerateArrivalDay(int currentDay) => currentDay + Random.Shared.Next(1, 31);

    public int GenerateDuration() => Random.Shared.Next(3, 16);

    public Ship GenerateShip(string name, int currentDay)
    {
        return new Ship
        {
            Name = name,
            Size = GenerateSize(),
            ArrivalDay = GenerateArrivalDay(currentDay),
            Duration = GenerateDuration(),
            Status = ShipStatus.Pending,
            BerthId = null,
            OccupationStartDay = null
        };
    }
}