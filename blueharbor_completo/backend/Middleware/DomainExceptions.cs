// ═══ SPRINT 7 ═══
// Eccezioni "parlanti" del dominio: i servizi le lanciano, il middleware
// le traduce in status code HTTP (modulo RESTful API: 404 vs 409).
namespace BlueHarbor.Api.Middleware;

// Risorsa inesistente (ship/berth con Id sconosciuto) → 404 Not Found.
public class NotFoundException(string message) : Exception(message);

// Regola di dominio violata (size incompatibile, ship non Pending) → 409 Conflict.
public class DomainException(string message) : Exception(message);
