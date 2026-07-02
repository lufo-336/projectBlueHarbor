using BlueHarbor_QPD_WSA.Server.Models;

namespace BlueHarbor_QPD_WSA.Server.DTOs;

/// <summary>
/// Richiesta di assegnazione: lo Scheduler indica a quale banchina assegnare la nave.
/// Il giorno di inizio NON viene passato: lo calcola il backend (primo slot libero).
/// </summary>
public record AssignShipRequest(int BerthId);

/// <summary>
/// Esito dell'assegnazione. Si restituisce una DTO (non l'entità Ship) per evitare
/// di esporre le proprietà di navigazione e i loro riferimenti circolari.
/// </summary>
public record AssignShipResponse(
    int ShipId,
    string Name,
    string Size,
    int BerthId,
    int OccupationStartDay,
    ShipStatus Status);
