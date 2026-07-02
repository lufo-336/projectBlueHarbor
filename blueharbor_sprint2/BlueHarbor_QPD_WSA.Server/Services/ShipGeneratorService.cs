using BlueHarbor_QPD_WSA.Server.Models;

namespace BlueHarbor_QPD_WSA.Server.Services;

/// <summary>
/// Genera i dati casuali di una nuova nave secondo le regole della consegna:
/// dimensione casuale, arrivo entro 30 giorni, durata di occupazione tra 3 e 15 giorni.
/// </summary>
public class ShipGeneratorService
{
    // Le 4 dimensioni ammesse (stesse dei check-constraint del DB).
    private static readonly string[] Sizes = { "S", "M", "L", "XL" };

    // ==========================================================================
    //  Generatori dei singoli campi
    // ==========================================================================

    // Dimensione casuale tra S / M / L / XL.
    public string GenerateSize() => Sizes[Random.Shared.Next(Sizes.Length)];

    // Arrivo: da 1 a 30 giorni dopo il giorno corrente (Next(1,31) = 1..30 inclusi).
    public int GenerateArrivalDay(int currentDay) => currentDay + Random.Shared.Next(1, 31);

    // Durata di occupazione: da 3 a 15 giorni (Next(3,16) = 3..15 inclusi).
    public int GenerateDuration() => Random.Shared.Next(3, 16);

    // ==========================================================================
    //  Composizione della nave completa (stato iniziale: Pending, non assegnata)
    // ==========================================================================
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
