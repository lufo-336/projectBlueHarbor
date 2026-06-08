using System;
using System.Collections.Generic;

namespace BlueHarbor_QPD_WSA.Server.Models;

public partial class Assignment
{
    public int Id { get; set; }

    public int ShipId { get; set; }

    public int BerthId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public DateOnly AssignedAtDate { get; set; }

    public virtual Berth Berth { get; set; } = null!;

    public virtual Ship Ship { get; set; } = null!;
}
