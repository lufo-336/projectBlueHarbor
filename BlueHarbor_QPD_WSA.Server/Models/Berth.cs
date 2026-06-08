using System;
using System.Collections.Generic;

namespace BlueHarbor_QPD_WSA.Server.Models;

public partial class Berth
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Size { get; set; } = null!;

    public int IndexOrder { get; set; }

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();

    public virtual ICollection<Ship> Ships { get; set; } = new List<Ship>();
}
