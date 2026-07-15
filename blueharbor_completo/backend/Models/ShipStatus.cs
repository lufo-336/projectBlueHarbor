// ═══ SPRINT 1 ═══
// I tre stati del ciclo di vita di una nave. Costanti stringa (non enum)
// perché con ADO.NET lo Status viaggia come VARCHAR: così il mapping è 1:1
// con la colonna e con il CHECK constraint del DB.
namespace BlueHarbor.Api.Models;

public static class ShipStatus
{
    public const string Pending  = "Pending";   // registrata, in attesa di banchina
    public const string Assigned = "Assigned";  // pianificata su una banchina
    public const string Departed = "Departed";  // ciclo concluso, banchina liberata
}
