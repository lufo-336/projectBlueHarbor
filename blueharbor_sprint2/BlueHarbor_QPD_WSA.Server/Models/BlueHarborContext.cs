using Microsoft.EntityFrameworkCore;

namespace BlueHarbor_QPD_WSA.Server.Models;

public class BlueHarborContext : DbContext
{
    public BlueHarborContext(DbContextOptions<BlueHarborContext> options)
        : base(options)
    {
    }

    public DbSet<Berth> Berths => Set<Berth>();

    public DbSet<Ship> Ships => Set<Ship>();

    public DbSet<Setting> Settings => Set<Setting>();

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Berth>(entity =>
        {
            entity.ToTable("Berths", t =>
                t.HasCheckConstraint("CK_Berths_Size", "[Size] IN ('XL','L','M','S')"));

            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.Size).HasMaxLength(2).IsUnicode(false);
        });

        modelBuilder.Entity<Ship>(entity =>
        {
            entity.ToTable("Ships", t =>
            {
                t.HasCheckConstraint("CK_Ships_Size", "[Size] IN ('XL','L','M','S')");
                t.HasCheckConstraint("CK_Ships_Status", "[Status] IN ('Pending','Assigned','Departed')");
                t.HasCheckConstraint("CK_Ships_ArrivalDay", "[ArrivalDay] >= 0");
                t.HasCheckConstraint("CK_Ships_Duration", "[Duration] >= 3 AND [Duration] <= 15");
            });

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Size).HasMaxLength(2).IsUnicode(false);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.Notes).HasMaxLength(255).IsUnicode(false);

            entity.HasOne(e => e.Berth)
                .WithMany(b => b.Ships)
                .HasForeignKey(e => e.BerthId)
                .HasConstraintName("FK_Ships_Berths");
        });

        modelBuilder.Entity<Setting>(entity =>
        {
            entity.ToTable("Settings");
            entity.HasKey(e => e.Key);
            entity.Property(e => e.Key).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.Value).HasMaxLength(50).IsUnicode(false);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", t =>
                t.HasCheckConstraint("CK_Users_Role", "[Role] IN ('Scheduler','Operator')"));

            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.PasswordHash).HasMaxLength(255).IsUnicode(false);
            entity.Property(e => e.Role).HasMaxLength(20).IsUnicode(false);
        });
    }
}
