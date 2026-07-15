// ═══ SPRINT 2 (paginazione: SPRINT 7) ═══
// DTO delle navi: cosa entra (CreateShipRequest) e cosa esce (ShipDto,
// PagedShipsResponse). I DTO separano il contratto API dal modello interno.
using System.ComponentModel.DataAnnotations;
using Microsoft.Data.SqlClient;

namespace BlueHarbor.Api.Dtos;

// L'operatore manda SOLO il nome: tutto il resto lo genera il sistema.
public class CreateShipRequest
{
    [Required(ErrorMessage = "Il nome della nave è obbligatorio.")]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = "";
}

public class ShipDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Size { get; set; } = "";
    public int ArrivalDay { get; set; }
    public int Duration { get; set; }
    public string Status { get; set; } = "";
    public int? BerthId { get; set; }
    public string? BerthName { get; set; }
    public int? OccupationStartDay { get; set; }

    // Mapping manuale da DataReader: con ADO.NET lo scriviamo noi (niente ORM).
    // Si aspetta le colonne: Id, Name, Size, ArrivalDay, Duration, Status,
    // BerthId, OccupationStartDay, BerthName (LEFT JOIN, può essere NULL).
    public static ShipDto FromReader(SqlDataReader reader) => new()
    {
        Id = (int)reader["Id"],
        Name = (string)reader["Name"],
        Size = (string)reader["Size"],
        ArrivalDay = (int)reader["ArrivalDay"],
        Duration = (int)reader["Duration"],
        Status = (string)reader["Status"],
        BerthId = reader["BerthId"] is DBNull ? null : (int)reader["BerthId"],
        BerthName = reader["BerthName"] is DBNull ? null : (string)reader["BerthName"],
        OccupationStartDay = reader["OccupationStartDay"] is DBNull ? null : (int)reader["OccupationStartDay"]
    };
}

// Risposta paginata (Sprint 7): items + metadati per i controlli UI.
public class PagedShipsResponse
{
    public List<ShipDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
