namespace BlueHarbor_QPD_WSA.Server.Models;

/// <summary>
/// Tabella di sistema chiave-valore. Per ora contiene il giorno corrente virtuale
/// (Key = "CurrentVirtualDay"), così il tempo è persistente e condiviso da tutti.
/// </summary>
public class Setting
{
    public string Key { get; set; } = null!;

    public string Value { get; set; } = null!;
}
