using Microsoft.EntityFrameworkCore;
using oncalltool.Backend.Common.Data;
using oncalltool.Backend.Common.Models;
using oncalltool.Backend.Manager.DTOs;

namespace oncalltool.Backend.Manager.Services;

public class ManagerService
{
    private readonly AppDbContext _db;


    public ManagerService(
        AppDbContext db)
    {
        _db = db;
    }


    // =========================================================
    // GET MANAGER
    //
    // Used for actions that ONLY the actual Manager can do.
    // Example: granting/removing schedule privilege.
    // =========================================================

    private async Task<AppUser> GetManagerAsync(
        string employeeId)
    {
        var user =
            await _db.Users
                .Include(x => x.Department)
                .FirstOrDefaultAsync(x =>
                    x.EmployeeId == employeeId);


        if (user == null)
        {
            throw new KeyNotFoundException(
                "User was not found.");
        }


        if (user.Role != "Manager")
        {
            throw new UnauthorizedAccessException(
                "Only the team manager can perform this action.");
        }


        return user;
    }


    // =========================================================
    // GET SCHEDULE EDITOR
    //
    // Allowed:
    // 1. Manager
    // 2. Employee with SchedulePrivilege = true
    // =========================================================

    private async Task<AppUser> GetScheduleEditorAsync(
        string employeeId)
    {
        var user =
            await _db.Users
                .Include(x => x.Department)
                .FirstOrDefaultAsync(x =>
                    x.EmployeeId == employeeId);


        if (user == null)
        {
            throw new KeyNotFoundException(
                "User was not found.");
        }


        var canEdit =
            user.Role == "Manager"
            ||
            user.SchedulePrivilege;


        if (!canEdit)
        {
            throw new UnauthorizedAccessException(
                "You do not have permission to manage on-call schedules.");
        }


        return user;
    }


    // =========================================================
    // DASHBOARD
    // =========================================================

    public async Task<ManagerDashboardDto>
        GetDashboardAsync(
            string managerEmployeeId)
    {
        var editor =
            await GetScheduleEditorAsync(
                managerEmployeeId);


        var teamMemberCount =
            await _db.Users
                .CountAsync(x =>
                    x.DepartmentId ==
                    editor.DepartmentId);


        var scheduleEditors =
            await _db.Users
                .CountAsync(x =>
                    x.DepartmentId ==
                        editor.DepartmentId
                    &&
                    x.Role != "Manager"
                    &&
                    x.SchedulePrivilege);


        var today =
            DateTime.Today;


        var todaySchedule =
            await _db.OnCallSchedules

                .Include(x =>
                    x.PrimaryEmployee)

                .Include(x =>
                    x.SecondaryEmployee)

                .FirstOrDefaultAsync(x =>
                    x.DepartmentId ==
                        editor.DepartmentId
                    &&
                    x.Date.Date ==
                        today.Date);


        return new ManagerDashboardDto
        {
            DepartmentName =
                editor.Department?.Name
                ?? "",

            TeamMemberCount =
                teamMemberCount,

            PrimaryToday =
                todaySchedule?
                    .PrimaryEmployee?
                    .Name,

            SecondaryToday =
                todaySchedule?
                    .SecondaryEmployee?
                    .Name,

            ScheduleEditors =
                scheduleEditors
        };
    }


    // =========================================================
    // GET MY TEAM
    // =========================================================

    public async Task<List<TeamMemberDto>>
        GetTeamAsync(
            string managerEmployeeId)
    {
        var editor =
            await GetScheduleEditorAsync(
                managerEmployeeId);


        return await _db.Users

            .Where(x =>
                x.DepartmentId ==
                editor.DepartmentId)

            .OrderByDescending(x =>
                x.Role == "Manager")

            .ThenBy(x =>
                x.Name)

            .Select(x =>
                new TeamMemberDto
                {
                    Id =
                        x.Id,

                    EmployeeId =
                        x.EmployeeId ?? "",

                    Name =
                        x.Name,

                    Phone =
                        x.Phone ?? "",

                    Email =
                        x.Email ?? "",

                    Role =
                        x.Role,

                    SchedulePrivilege =
                        x.SchedulePrivilege
                })

            .ToListAsync();
    }


    // =========================================================
    // GET ON-CALL SCHEDULES
    //
    // Includes:
    // - Primary / Secondary
    // - Day Type
    // - Primary Status
    // - Swap Note
    // - Incident information
    // =========================================================

    public async Task<List<OnCallDto>>
        GetOnCallsAsync(
            string managerEmployeeId)
    {
        var editor =
            await GetScheduleEditorAsync(
                managerEmployeeId);


        return await _db.OnCallSchedules

            .Where(x =>
                x.DepartmentId ==
                editor.DepartmentId)

            .Include(x =>
                x.PrimaryEmployee)

            .Include(x =>
                x.SecondaryEmployee)

            .OrderBy(x =>
                x.Date)

            .Select(x =>
                new OnCallDto
                {
                    Id =
                        x.Id,

                    Date =
                        x.Date,

                    DayType =
                        x.DayType,


                    PrimaryEmployeeId =
                        x.PrimaryEmployeeId,

                    PrimaryName =
                        x.PrimaryEmployee != null
                            ? x.PrimaryEmployee.Name
                            : "Unassigned",

                    PrimaryStatus =
                        x.PrimaryStatus,


                    SecondaryEmployeeId =
                        x.SecondaryEmployeeId,

                    SecondaryName =
                        x.SecondaryEmployee != null
                            ? x.SecondaryEmployee.Name
                            : "Unassigned",


                    SwapNote =
                        x.SwapNote,


                    IncidentCount =
                        x.IncidentCount,

                    ImpactedPlatforms =
                        x.ImpactedPlatforms,

                    IncidentDescription =
                        x.IncidentDescription
                })

            .ToListAsync();
    }


    // =========================================================
    // CREATE ON-CALL
    // =========================================================

    public async Task<OnCallDto>
        CreateOnCallAsync(
            string managerEmployeeId,
            CreateOnCallDto dto)
    {
        var editor =
            await GetScheduleEditorAsync(
                managerEmployeeId);


        // -----------------------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------------------

        if (dto.Date == default)
        {
            throw new ArgumentException(
                "Schedule date is required.");
        }


        if (dto.PrimaryEmployeeId <= 0)
        {
            throw new ArgumentException(
                "Primary employee is required.");
        }


        if (dto.SecondaryEmployeeId <= 0)
        {
            throw new ArgumentException(
                "Secondary employee is required.");
        }


        if (
            dto.PrimaryEmployeeId ==
            dto.SecondaryEmployeeId
        )
        {
            throw new ArgumentException(
                "Primary and Secondary employees must be different.");
        }


        // -----------------------------------------------------
        // VALIDATE EMPLOYEES
        //
        // They must:
        // - belong to this department
        // - NOT be Managers
        // -----------------------------------------------------

        var employees =
            await _db.Users

                .Where(x =>
                    x.DepartmentId ==
                        editor.DepartmentId

                    &&

                    x.Role != "Manager"

                    &&

                    (
                        x.Id ==
                            dto.PrimaryEmployeeId

                        ||

                        x.Id ==
                            dto.SecondaryEmployeeId
                    ))

                .ToListAsync();


        if (employees.Count != 2)
        {
            throw new ArgumentException(
                "Primary and Secondary must be employees from your department. Managers cannot be assigned to on-call.");
        }


        var date =
            dto.Date.Date;


        // -----------------------------------------------------
        // DUPLICATE DATE CHECK
        // -----------------------------------------------------

        var exists =
            await _db.OnCallSchedules
                .AnyAsync(x =>
                    x.DepartmentId ==
                        editor.DepartmentId
                    &&
                    x.Date.Date ==
                        date);


        if (exists)
        {
            throw new ArgumentException(
                "An on-call schedule already exists for this date.");
        }


        // -----------------------------------------------------
        // CREATE
        // -----------------------------------------------------

        var schedule =
            new OnCallSchedule
            {
                DepartmentId =
                    editor.DepartmentId,

                Date =
                    date,

                PrimaryEmployeeId =
                    dto.PrimaryEmployeeId,

                SecondaryEmployeeId =
                    dto.SecondaryEmployeeId
            };


        _db.OnCallSchedules.Add(
            schedule);


        await _db.SaveChangesAsync();


        return await GetOnCallByIdAsync(
            schedule.Id);
    }


    // =========================================================
    // UPDATE ON-CALL
    // =========================================================

    public async Task<OnCallDto>
        UpdateOnCallAsync(
            string managerEmployeeId,
            int scheduleId,
            CreateOnCallDto dto)
    {
        var editor =
            await GetScheduleEditorAsync(
                managerEmployeeId);


        var schedule =
            await _db.OnCallSchedules
                .FirstOrDefaultAsync(x =>
                    x.Id ==
                        scheduleId
                    &&
                    x.DepartmentId ==
                        editor.DepartmentId);


        if (schedule == null)
        {
            throw new KeyNotFoundException(
                "On-call schedule was not found.");
        }


        // -----------------------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------------------

        if (dto.Date == default)
        {
            throw new ArgumentException(
                "Schedule date is required.");
        }


        if (dto.PrimaryEmployeeId <= 0)
        {
            throw new ArgumentException(
                "Primary employee is required.");
        }


        if (dto.SecondaryEmployeeId <= 0)
        {
            throw new ArgumentException(
                "Secondary employee is required.");
        }


        if (
            dto.PrimaryEmployeeId ==
            dto.SecondaryEmployeeId
        )
        {
            throw new ArgumentException(
                "Primary and Secondary employees must be different.");
        }


        // -----------------------------------------------------
        // VALIDATE EMPLOYEES
        //
        // Managers cannot be placed on-call.
        // -----------------------------------------------------

        var validEmployeeCount =
            await _db.Users
                .CountAsync(x =>
                    x.DepartmentId ==
                        editor.DepartmentId

                    &&

                    x.Role != "Manager"

                    &&

                    (
                        x.Id ==
                            dto.PrimaryEmployeeId

                        ||

                        x.Id ==
                            dto.SecondaryEmployeeId
                    ));


        if (validEmployeeCount != 2)
        {
            throw new ArgumentException(
                "Primary and Secondary must be employees from your department. Managers cannot be assigned to on-call.");
        }


        var newDate =
            dto.Date.Date;


        // -----------------------------------------------------
        // DUPLICATE DATE CHECK
        // -----------------------------------------------------

        var duplicateDate =
            await _db.OnCallSchedules
                .AnyAsync(x =>
                    x.DepartmentId ==
                        editor.DepartmentId
                    &&
                    x.Date.Date ==
                        newDate
                    &&
                    x.Id !=
                        scheduleId);


        if (duplicateDate)
        {
            throw new ArgumentException(
                "Another on-call schedule already exists for this date.");
        }


        // -----------------------------------------------------
        // UPDATE
        // -----------------------------------------------------

        schedule.Date =
            newDate;


        schedule.PrimaryEmployeeId =
            dto.PrimaryEmployeeId;


        schedule.SecondaryEmployeeId =
            dto.SecondaryEmployeeId;


        await _db.SaveChangesAsync();


        return await GetOnCallByIdAsync(
            schedule.Id);
    }


    // =========================================================
    // DELETE ON-CALL
    // =========================================================

    public async Task DeleteOnCallAsync(
        string managerEmployeeId,
        int scheduleId)
    {
        var editor =
            await GetScheduleEditorAsync(
                managerEmployeeId);


        var schedule =
            await _db.OnCallSchedules
                .FirstOrDefaultAsync(x =>
                    x.Id ==
                        scheduleId
                    &&
                    x.DepartmentId ==
                        editor.DepartmentId);


        if (schedule == null)
        {
            throw new KeyNotFoundException(
                "On-call schedule was not found.");
        }


        _db.OnCallSchedules.Remove(
            schedule);


        await _db.SaveChangesAsync();
    }


    // =========================================================
    // UPDATE SCHEDULE PRIVILEGE
    //
    // ONLY an actual Manager can grant/remove this permission.
    // =========================================================

    public async Task UpdateSchedulePrivilegeAsync(
        string managerEmployeeId,
        int employeeId,
        bool allowed)
    {
        var manager =
            await GetManagerAsync(
                managerEmployeeId);


        var employee =
            await _db.Users
                .FirstOrDefaultAsync(x =>
                    x.Id ==
                        employeeId
                    &&
                    x.DepartmentId ==
                        manager.DepartmentId);


        if (employee == null)
        {
            throw new KeyNotFoundException(
                "Employee was not found in your department.");
        }


        if (employee.Role == "Manager")
        {
            throw new ArgumentException(
                "Manager privilege cannot be changed here.");
        }


        employee.SchedulePrivilege =
            allowed;


        await _db.SaveChangesAsync();
    }


    // =========================================================
    // GET SINGLE ON-CALL
    //
    // Used after create/update.
    // Includes all imported metadata too.
    // =========================================================

    private async Task<OnCallDto>
        GetOnCallByIdAsync(
            int id)
    {
        var schedule =
            await _db.OnCallSchedules

                .Include(x =>
                    x.PrimaryEmployee)

                .Include(x =>
                    x.SecondaryEmployee)

                .FirstOrDefaultAsync(x =>
                    x.Id == id);


        if (schedule == null)
        {
            throw new KeyNotFoundException(
                "On-call schedule was not found.");
        }


        return new OnCallDto
        {
            Id =
                schedule.Id,

            Date =
                schedule.Date,

            DayType =
                schedule.DayType,


            PrimaryEmployeeId =
                schedule.PrimaryEmployeeId,

            PrimaryName =
                schedule.PrimaryEmployee != null
                    ? schedule.PrimaryEmployee.Name
                    : "Unassigned",

            PrimaryStatus =
                schedule.PrimaryStatus,


            SecondaryEmployeeId =
                schedule.SecondaryEmployeeId,

            SecondaryName =
                schedule.SecondaryEmployee != null
                    ? schedule.SecondaryEmployee.Name
                    : "Unassigned",


            SwapNote =
                schedule.SwapNote,


            IncidentCount =
                schedule.IncidentCount,

            ImpactedPlatforms =
                schedule.ImpactedPlatforms,

            IncidentDescription =
                schedule.IncidentDescription
        };
    }
}