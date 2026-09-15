using Microsoft.EntityFrameworkCore;
using oncalltool.Backend.Common.Data;
using oncalltool.Backend.Common.Models;

namespace oncalltool.Backend.Common.Demo;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(
        AppDbContext db)
    {
        // =====================================================
        // DEPARTMENT / TEAM
        // =====================================================

        var department =
            await db.Departments
                .FirstOrDefaultAsync(x =>
                    x.Name ==
                    DemoIdentity.DepartmentName);


        if (department == null)
        {
            department =
                new Department
                {
                    Name =
                        DemoIdentity.DepartmentName
                };


            db.Departments.Add(
                department);


            await db.SaveChangesAsync();
        }


        // =====================================================
        // MANAGER — ORA
        // =====================================================

        var manager =
            await db.Users
                .FirstOrDefaultAsync(x =>
                    x.EmployeeId ==
                    DemoIdentity.ManagerEmployeeId);


        if (manager == null)
        {
            manager =
                new AppUser
                {
                    EmployeeId =
                        DemoIdentity.ManagerEmployeeId,

                    Name =
                        DemoIdentity.ManagerName,

                    Role =
                        "Manager",

                    SchedulePrivilege =
                        true,

                    DepartmentId =
                        department.Id
                };


            db.Users.Add(
                manager);
        }
        else
        {
            manager.Name =
                DemoIdentity.ManagerName;

            manager.Role =
                "Manager";

            manager.SchedulePrivilege =
                true;

            manager.DepartmentId =
                department.Id;
        }


        // =====================================================
        // EMPLOYEE — JOHN
        // Picked from the uploaded Enterprise RA sheet
        // =====================================================

        var john =
            await db.Users
                .FirstOrDefaultAsync(x =>
                    x.EmployeeId == "EMP001");


        if (john == null)
        {
            john =
                new AppUser
                {
                    EmployeeId =
                        "EMP001",

                    Name =
                        "John",

                    Role =
                        "Employee",

                    SchedulePrivilege =
                        false,

                    DepartmentId =
                        department.Id
                };


            db.Users.Add(
                john);
        }


        // =====================================================
        // EMPLOYEE — ESRAA
        // =====================================================

        var esraa =
            await db.Users
                .FirstOrDefaultAsync(x =>
                    x.EmployeeId == "EMP002");


        if (esraa == null)
        {
            esraa =
                new AppUser
                {
                    EmployeeId =
                        "EMP002",

                    Name =
                        "Esraa",

                    Role =
                        "Employee",

                    SchedulePrivilege =
                        false,

                    DepartmentId =
                        department.Id
                };


            db.Users.Add(
                esraa);
        }


        // =====================================================
        // EMPLOYEE — OMAR
        // =====================================================

        var omar =
            await db.Users
                .FirstOrDefaultAsync(x =>
                    x.EmployeeId == "EMP003");


        if (omar == null)
        {
            omar =
                new AppUser
                {
                    EmployeeId =
                        "EMP003",

                    Name =
                        "Omar",

                    Role =
                        "Employee",

                    SchedulePrivilege =
                        false,

                    DepartmentId =
                        department.Id
                };


            db.Users.Add(
                omar);
        }


        await db.SaveChangesAsync();


        // =====================================================
        // TEST ON-CALL
        //
        // From Enterprise RA workbook:
        // 15 Sep 2026
        // Primary   = Esraa
        // Secondary = Omar
        // =====================================================

        var testDate =
            new DateTime(
                2026,
                9,
                15);


        var scheduleExists =
            await db.OnCallSchedules
                .AnyAsync(x =>
                    x.DepartmentId ==
                        department.Id
                    &&
                    x.Date ==
                        testDate);


        if (!scheduleExists)
        {
            db.OnCallSchedules.Add(
                new OnCallSchedule
                {
                    DepartmentId =
                        department.Id,

                    Date =
                        testDate,

                    PrimaryEmployeeId =
                        esraa.Id,

                    SecondaryEmployeeId =
                        omar.Id,

                    SourceSheet =
                        "2026 Demo"
                });


            await db.SaveChangesAsync();
        }
    }
}