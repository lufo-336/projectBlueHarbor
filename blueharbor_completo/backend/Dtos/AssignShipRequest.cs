// ═══ SPRINT 3 ═══ Corpo della POST di assegnazione: solo la banchina scelta.
using System.ComponentModel.DataAnnotations;

namespace BlueHarbor.Api.Dtos;

public class AssignShipRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "BerthId deve essere positivo.")]
    public int BerthId { get; set; }
}
