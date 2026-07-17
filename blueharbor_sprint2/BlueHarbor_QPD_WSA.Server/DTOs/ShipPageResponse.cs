namespace BlueHarbor_QPD_WSA.Server.DTOs;

/// <summary>
/// Risposta paginata di <c>GET /api/ships</c>.
/// <para>
/// <see cref="Total"/> e <see cref="TotalPages"/> riflettono i <b>filtri attivi</b>
/// (stato/taglia): sono il conteggio della lista che si sta sfogliando.
/// </para>
/// <para>
/// <see cref="Counts"/> è invece calcolato su <b>tutte</b> le navi, indipendente da
/// filtri e paginazione: alimenta i tre contatori del cruscotto Operatore, che devono
/// restare stabili anche mentre si filtra o si cambia pagina.
/// </para>
/// </summary>
public record ShipPageResponse(
    IReadOnlyList<ShipDto> Items,
    int Page,
    int PageSize,
    int Total,
    int TotalPages,
    ShipStatusCounts Counts);

/// <summary>
/// Totali per stato sull'intero insieme delle navi (non filtrati).
/// </summary>
public record ShipStatusCounts(int Pending, int Assigned, int Departed);
