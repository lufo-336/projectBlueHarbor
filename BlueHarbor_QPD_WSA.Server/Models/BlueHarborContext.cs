using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Models;

public partial class BlueHarborContext : DbContext
{
    public BlueHarborContext()
    {
    }

    public BlueHarborContext(DbContextOptions<BlueHarborContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Assignment> Assignments { get; set; }

    public virtual DbSet<Berth> Berths { get; set; }

    public virtual DbSet<Ship> Ships { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=.;Database=BlueHarbor;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Assignme__3213E83FB7CD201B");

            entity.HasIndex(e => e.ShipId, "UQ__Assignme__CCF471DB4274E718").IsUnique();

            entity.HasIndex(e => new { e.BerthId, e.StartDate, e.EndDate }, "idx_assignments_berth_dates");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AssignedAtDate).HasColumnName("assigned_at_date");
            entity.Property(e => e.BerthId).HasColumnName("berth_id");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.ShipId).HasColumnName("ship_id");
            entity.Property(e => e.StartDate).HasColumnName("start_date");

            entity.HasOne(d => d.Berth).WithMany(p => p.Assignments)
                .HasForeignKey(d => d.BerthId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_assignments_berth");

            entity.HasOne(d => d.Ship).WithOne(p => p.Assignment)
                .HasForeignKey<Assignment>(d => d.ShipId)
                .HasConstraintName("FK_assignments_ship");
        });

        modelBuilder.Entity<Berth>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Berths__3213E83F279CBA41");

            entity.HasIndex(e => e.Code, "UQ__Berths__357D4CF960C35D70").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(20)
                .HasColumnName("code");
            entity.Property(e => e.IndexOrder).HasColumnName("index_order");
            entity.Property(e => e.Size)
                .HasMaxLength(2)
                .HasColumnName("size");
        });

        modelBuilder.Entity<Ship>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_ships");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AllocationStartDay).HasColumnName("allocation_start_day");
            entity.Property(e => e.ArrivalDay).HasColumnName("arrivalDay");
            entity.Property(e => e.DockId).HasColumnName("dockId");
            entity.Property(e => e.DurationDays).HasColumnName("durationDays");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("name");
            entity.Property(e => e.Notes)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("notes");
            entity.Property(e => e.RowVersion)
                .IsRowVersion()
                .IsConcurrencyToken()
                .HasColumnName("rowVersion");
            entity.Property(e => e.Size)
                .HasMaxLength(2)
                .IsUnicode(false)
                .HasColumnName("size");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Pending")
                .HasColumnName("status");

            entity.HasOne(d => d.Dock).WithMany(p => p.Ships)
                .HasForeignKey(d => d.DockId)
                .HasConstraintName("FK_Ships_Berths");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_users");

            entity.HasIndex(e => e.Username, "UQ_users_Username").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("passwordHash");
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("role");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
