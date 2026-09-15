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


    public DbSet<Department> Departments =>
        Set<Department>();


    public DbSet<OnCallSchedule> OnCallSchedules =>
        Set<OnCallSchedule>();


    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);


        // Department name must be unique
        modelBuilder.Entity<Department>()
            .HasIndex(x => x.Name)
            .IsUnique();


        // Employee should be unique inside department
        modelBuilder.Entity<AppUser>()
            .HasIndex(x => new
            {
                x.DepartmentId,
                x.Name
            })
            .IsUnique();


        // User belongs to department
        modelBuilder.Entity<AppUser>()
            .HasOne(x => x.Department)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);


        // PostgreSQL DATE instead of timestamp
        modelBuilder.Entity<OnCallSchedule>()
            .Property(x => x.Date)
            .HasColumnType("date");


        // Only one schedule per department/date
        modelBuilder.Entity<OnCallSchedule>()
            .HasIndex(x => new
            {
                x.DepartmentId,
                x.Date
            })
            .IsUnique();


        modelBuilder.Entity<OnCallSchedule>()
            .HasOne(x => x.Department)
            .WithMany(x => x.OnCallSchedules)
            .HasForeignKey(x => x.DepartmentId)
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