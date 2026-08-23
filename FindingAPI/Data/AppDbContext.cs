using FindingAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FindingAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Confession> Confessions { get; set; } = null!;
    public DbSet<ConfessionComment> ConfessionComments { get; set; } = null!;
    public DbSet<InteractionRequest> InteractionRequests { get; set; } = null!;
    public DbSet<ChatRoom> ChatRooms { get; set; } = null!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
    public DbSet<Payment> Payments { get; set; } = null!;
    public DbSet<StudentVerification> StudentVerifications { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<Report> Reports { get; set; } = null!;
    public DbSet<UserInterest> UserInterests { get; set; } = null!;
    public DbSet<Interest> Interests { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserInterest>()
            .HasKey(ui => new { ui.UserId, ui.InterestId });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.AnonymousUsername).IsUnique();
        });

        modelBuilder.Entity<Confession>(entity =>
        {
            entity.HasOne(c => c.Author)
                .WithMany(u => u.ConfessionsMade)
                .HasForeignKey(c => c.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.TargetUser)
                .WithMany(u => u.ConfessionsTargeted)
                .HasForeignKey(c => c.TargetUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InteractionRequest>(entity =>
        {
            entity.HasOne(i => i.Confessor)
                .WithMany(u => u.SentInteractions)
                .HasForeignKey(i => i.ConfessorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(i => i.TargetUser)
                .WithMany(u => u.ReceivedInteractions)
                .HasForeignKey(i => i.TargetUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(i => i.ChatRoom)
                .WithOne(c => c.InteractionRequest)
                .HasForeignKey<ChatRoom>(c => c.InteractionRequestId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChatRoom>(entity =>
        {
            entity.HasOne(c => c.User1)
                .WithMany()
                .HasForeignKey(c => c.User1Id)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.User2)
                .WithMany()
                .HasForeignKey(c => c.User2Id)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasOne(r => r.ReportedByUser)
                .WithMany(u => u.ReportsMade)
                .HasForeignKey(r => r.ReportedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.ReportedUser)
                .WithMany(u => u.ReportsReceived)
                .HasForeignKey(r => r.ReportedUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.Property(p => p.Amount)
                .HasColumnType("decimal(18,2)");

            entity.HasOne(p => p.ChatRoom)
                .WithOne(c => c.Payment)
                .HasForeignKey<Payment>(p => p.ChatRoomId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Set Restrict on all remaining relationships
        foreach (var relationship in modelBuilder.Model
            .GetEntityTypes()
            .SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }
}

