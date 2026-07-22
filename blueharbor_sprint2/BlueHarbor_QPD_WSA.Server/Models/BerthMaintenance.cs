namespace BlueHarbor_QPD_WSA.Server.Models;

/// <summary>
/// Finestra di indisponibilità di una banchina: intervallo <b>[StartDay, EndDay)</b>,
/// esattamente la stessa semantica delle occupazioni delle navi. È questa identità
/// che permette di passarla a <c>SchedulingRules</c> insieme alle navi, senza che
/// l'algoritmo debba distinguere i due casi.
/// Programmata dall'Admin; non sposta mai una nave già assegnata.
/// </summary>
public class BerthMaintenance
{
    public int Id { get; set; }

    public int BerthId { get; set; }

    public Berth? Berth { get; set; }

    /// <summary>Primo giorno di indisponibilità (incluso).</summary>
    public int StartDay { get; set; }

    /// <summary>Primo giorno di nuovo disponibile (escluso).</summary>
    public int EndDay { get; set; }

    // Timestamp reale, valorizzato dal default SQL (SYSUTCDATETIME()).
    public DateTime CreatedAt { get; set; }
}
