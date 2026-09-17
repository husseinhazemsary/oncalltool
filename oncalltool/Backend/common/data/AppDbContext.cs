using Microsoft.EntityFrameworkCore;
using oncalltool.Backend.Common.Models;

namespace oncalltool.Backend.Common.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(
        DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }


    public DbSet<AppUser> Users =>
        Set<AppUser>();


    public DbSet<Team> Teams =>
        Set<Team>();


    public DbSet<OnCallSchedule> OnCallSchedules =>
        Set<OnCallSchedule>();


    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);


        // Team name must be unique
        modelBuilder.Entity<Team>()
            .HasIndex(x => x.Name)
            .IsUnique();


        // Employee should be unique inside Team
        modelBuilder.Entity<AppUser>()
            .HasIndex(x => new
            {
                x.TeamId,
                x.Name
            })
            .IsUnique();


        // User belongs to Team
        modelBuilder.Entity<AppUser>()
            .HasOne(x => x.Team)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.TeamId)
            .OnDelete(DeleteBehavior.Restrict);


        // PostgreSQL DATE instead of timestamp
        modelBuilder.Entity<OnCallSchedule>()
            .Property(x => x.Date)
            .HasColumnType("date");


        // Only one schedule per Team/date
        modelBuilder.Entity<OnCallSchedule>()
            .HasIndex(x => new
            {
                x.TeamId,
                x.Date
            })
            .IsUnique();


        modelBuilder.Entity<OnCallSchedule>()
            .HasOne(x => x.Team)
            .WithMany(x => x.OnCallSchedules)
            .HasForeignKey(x => x.TeamId)
            .OnDelete(DeleteBehavior.Restrict);


        modelBuilder.Entity<OnCallSchedule>()
            .HasOne(x => x.PrimaryEmployee)
            .WithMany()
            .HasForeignKey(x => x.PrimaryEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);


        modelBuilder.Entity<OnCallSchedule>()
            .HasOne(x => x.SecondaryEmployee)
            .WithMany()
            .HasForeignKey(x => x.SecondaryEmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}