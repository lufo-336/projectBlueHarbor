namespace BlueHarbor_QPD_WSA.Server.Models;

/// <summary>
/// Riga dello storico assegnazioni. Tabella <b>append-only</b>: nessun endpoint la
/// aggiorna o cancella. I campi nave/banchina sono <b>snapshot denormalizzati</b>
/// (nome, taglia) così lo storico resta leggibile anche se la nave cambia in seguito.
/// </summary>
public class AssignmentHistory
{
    public int Id { get; set; }

    // --- Snapshot della nave coinvolta ---
    public int ShipId { get; set; }
    public string ShipName { get; set; } = null!;
    public string Size { get; set; } = null!;

    // --- Snapshot della banchina coinvolta ---
    public int BerthId { get; set; }
    public string BerthName { get; set; } = null!;

    // --- Finestra di occupazione [Start, End) al momento dell'evento ---
    public int OccupationStartDay { get; set; }
    public int OccupationEndDay { get; set; }

    // --- Evento ---
    public HistoryEventType EventType { get; set; }
    public int EventDay { get; set; }

    // Timestamp reale, valorizzato dal default SQL (SYSUTCDATETIME()).
    public DateTime CreatedAt { get; set; }
}
