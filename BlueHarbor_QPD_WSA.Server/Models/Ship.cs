using System;
using System.Collections.Generic;

namespace BlueHarbor_QPD_WSA.Server.Models;

public partial class Ship
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Size { get; set; } = null!;

    public int ArrivalDay { get; set; }

    public int DurationDays { get; set; }

    public string Status { get; set; } = null!;

    public int? DockId { get; set; }

    public int? AllocationStartDay { get; set; }

    public string? Notes { get; set; }

    public byte[] RowVersion { get; set; } = null!;

    public virtual Assignment? Assignment { get; set; }

    public virtual Berth? Dock { get; set; }
}
