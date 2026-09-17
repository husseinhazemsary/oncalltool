using ClosedXML.Excel;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using oncalltool.Backend.Common.Data;
using oncalltool.Backend.Common.Models;
using oncalltool.Backend.Manager.DTOs;

namespace oncalltool.Backend.Manager.Services;

public class ManagerService
{
    private readonly AppDbContext _db;

    public ManagerService(AppDbContext db)
    {
        _db = db;
    }

    // =========================================================
    // GET MANAGER
    //
    // Only an actual Manager can grant/remove privileges.
    // =========================================================

    private async Task<AppUser> GetManagerAsync(
        string employeeId)
    {
        var user = await _db.Users
            .Include(x => x.Team)
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
    // 2. Employee with SchedulePrivilege
    //
    // Admin is NOT allowed through SchedulePrivilege.
    // =========================================================

    private async Task<AppUser> GetScheduleEditorAsync(
        string employeeId)
    {
        var user = await _db.Users
            .Include(x => x.Team)
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
            (
                user.Role == "Employee"
                &&
                user.SchedulePrivilege
            );

        if (!canEdit)
        {
            throw new UnauthorizedAccessException(
                "You do not have permission to manage on-call schedules.");
        }

        return user;
    }

    // =========================================================
    // DASHBOARD
    //
    // Admin is excluded from the team-member count.
    // =========================================================

    public async Task<ManagerDashboardDto> GetDashboardAsync(
        string managerEmployeeId)
    {
        var editor = await GetScheduleEditorAsync(
            managerEmployeeId);

        // Count Manager + Employees, but NOT Admin.
        var teamMemberCount = await _db.Users
            .CountAsync(x =>
                x.TeamId == editor.TeamId
                &&
                x.Role != "Admin");

        // Count only regular employees with scheduling privilege.
        var scheduleEditors = await _db.Users
            .CountAsync(x =>
                x.TeamId == editor.TeamId
                &&
                x.Role == "Employee"
                &&
                x.SchedulePrivilege);

        var today = DateTime.Today;

        var todaySchedule = await _db.OnCallSchedules
            .Include(x => x.PrimaryEmployee)
            .Include(x => x.SecondaryEmployee)
            .FirstOrDefaultAsync(x =>
                x.TeamId == editor.TeamId
                &&
                x.Date.Date == today.Date);

        return new ManagerDashboardDto
        {
            TeamName =
                editor.Team?.Name ?? "",

            TeamMemberCount =
                teamMemberCount,

            PrimaryToday =
                todaySchedule?.PrimaryEmployee?.Name,

            SecondaryToday =
                todaySchedule?.SecondaryEmployee?.Name,

            ScheduleEditors =
                scheduleEditors
        };
    }

    // =========================================================
    // GET MY TEAM
    //
    // Only members of the Manager's team.
    // Admin is excluded.
    // =========================================================

    public async Task<List<TeamMemberDto>> GetTeamAsync(
        string managerEmployeeId)
    {
        var editor = await GetScheduleEditorAsync(
            managerEmployeeId);

        return await _db.Users
            .Where(x =>
                x.TeamId == editor.TeamId
                &&
                x.Role != "Admin")

            .OrderByDescending(x =>
                x.Role == "Manager")

            .ThenBy(x =>
                x.Name)

            .Select(x => new TeamMemberDto
            {
                Id = x.Id,

                EmployeeId = x.EmployeeId ?? "",

                Name = x.Name,

                Phone = x.Phone ?? "",

                Email = x.Email ?? "",

                Role = x.Role,

                SchedulePrivilege = x.SchedulePrivilege
            })

            .ToListAsync();
    }

    // =========================================================
    // GET ON-CALL SCHEDULES
    //
    // Includes all metadata required for:
    // - Schedule table
    // - Export Schedule
    // - Incident History
    // - Swap History
    // =========================================================

    public async Task<List<OnCallDto>> GetOnCallsAsync(
        string managerEmployeeId)
    {
        var editor = await GetScheduleEditorAsync(
            managerEmployeeId);

        return await _db.OnCallSchedules
            .Where(x =>
                x.TeamId == editor.TeamId)

            .Include(x => x.PrimaryEmployee)
            .Include(x => x.SecondaryEmployee)

            .OrderBy(x => x.Date)

            .Select(x => new OnCallDto
            {
                Id = x.Id,

                Date = x.Date,

                DayType = x.DayType,

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
    //
    // Primary and Secondary must:
    // - Belong to the same team
    // - Have Role == Employee
    // - Be different employees
    //
    // Managers and Admins cannot be assigned.
    // =========================================================

    public async Task<OnCallDto> CreateOnCallAsync(
        string managerEmployeeId,
        CreateOnCallDto dto)
    {
        var editor = await GetScheduleEditorAsync(
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

        if (dto.PrimaryEmployeeId == dto.SecondaryEmployeeId)
        {
            throw new ArgumentException(
                "Primary and Secondary employees must be different.");
        }

        var normalizedDayType = NormalizeDayType(dto.DayType);
        if (normalizedDayType == null)
        {
            throw new ArgumentException(
                "Choose Day Type: Holiday (24 hours) or Weekday (16 hours).");
        }

        // -----------------------------------------------------
        // VALIDATE EMPLOYEES
        // -----------------------------------------------------

        var employees = await _db.Users
            .Where(x =>
                x.TeamId == editor.TeamId
                &&
                x.Role == "Employee"
                &&
                (
                    x.Id == dto.PrimaryEmployeeId
                    ||
                    x.Id == dto.SecondaryEmployeeId
                ))

            .ToListAsync();

        if (employees.Count != 2)
        {
            throw new ArgumentException(
                "Primary and Secondary must be regular employees from your team. Managers and Admins cannot be assigned to on-call.");
        }

        var date = dto.Date.Date;

        // -----------------------------------------------------
        // PREVENT DUPLICATE DATES
        // -----------------------------------------------------

        var exists = await _db.OnCallSchedules
            .AnyAsync(x =>
                x.TeamId == editor.TeamId
                &&
                x.Date.Date == date);

        if (exists)
        {
            throw new ArgumentException(
                "An on-call schedule already exists for this date.");
        }

        // -----------------------------------------------------
        // CREATE
        // -----------------------------------------------------

        var schedule = new OnCallSchedule
        {
            TeamId =
                editor.TeamId,

            Date =
                date,

            PrimaryEmployeeId =
                dto.PrimaryEmployeeId,

            SecondaryEmployeeId =
                dto.SecondaryEmployeeId,

            DayType = normalizedDayType
        };

        _db.OnCallSchedules.Add(schedule);

        await _db.SaveChangesAsync();

        return await GetOnCallByIdAsync(schedule.Id);
    }

    // =========================================================
    // UPDATE ON-CALL
    //
    // Only regular employees from this     
    // can be Primary or Secondary.
    // =========================================================

    public async Task<OnCallDto> UpdateOnCallAsync(
        string managerEmployeeId,
        int scheduleId,
        CreateOnCallDto dto)
    {
        var editor = await GetScheduleEditorAsync(
            managerEmployeeId);

        var schedule = await _db.OnCallSchedules
            .FirstOrDefaultAsync(x =>
                x.Id == scheduleId
                &&
                x.TeamId == editor.TeamId);

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

        if (dto.PrimaryEmployeeId == dto.SecondaryEmployeeId)
        {
            throw new ArgumentException(
                "Primary and Secondary employees must be different.");
        }

        var normalizedDayType = NormalizeDayType(dto.DayType);
        if (normalizedDayType == null)
        {
            throw new ArgumentException(
                "Choose Day Type: Holiday (24 hours) or Weekday (16 hours).");
        }

        // -----------------------------------------------------
        // VALIDATE EMPLOYEES
        // -----------------------------------------------------

        var validEmployeeCount = await _db.Users
            .CountAsync(x =>
                x.TeamId == editor.TeamId
                &&
                x.Role == "Employee"
                &&
                (
                    x.Id == dto.PrimaryEmployeeId
                    ||
                    x.Id == dto.SecondaryEmployeeId
                ));

        if (validEmployeeCount != 2)
        {
            throw new ArgumentException(
                "Primary and Secondary must be regular employees from your  team. Managers and Admins cannot be assigned to on-call.");
        }

        var newDate = dto.Date.Date;

        // -----------------------------------------------------
        // PREVENT DUPLICATE DATES
        // -----------------------------------------------------

        var duplicateDate = await _db.OnCallSchedules
            .AnyAsync(x =>
                x.TeamId == editor.TeamId
                &&
                x.Date.Date == newDate
                &&
                x.Id != scheduleId);

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

        schedule.DayType = normalizedDayType;

        await _db.SaveChangesAsync();

        return await GetOnCallByIdAsync(schedule.Id);
    }

    // =========================================================
    // DELETE ON-CALL
    //
    // Only schedules from the current Team.
    // =========================================================

    public async Task DeleteOnCallAsync(
        string managerEmployeeId,
        int scheduleId)
    {
        var editor = await GetScheduleEditorAsync(
            managerEmployeeId);

        var schedule = await _db.OnCallSchedules
            .FirstOrDefaultAsync(x =>
                x.Id == scheduleId
                &&
                x.TeamId == editor.TeamId);

        if (schedule == null)
        {
            throw new KeyNotFoundException(
                "On-call schedule was not found.");
        }

        _db.OnCallSchedules.Remove(schedule);

        await _db.SaveChangesAsync();
    }

    // =========================================================
    // UPDATE SCHEDULE PRIVILEGE
    //
    // Only Manager can grant/remove this permission.
    // Only regular Employees can receive it.
    // =========================================================

    public async Task UpdateSchedulePrivilegeAsync(
        string managerEmployeeId,
        int employeeId,
        bool allowed)
    {
        var manager = await GetManagerAsync(
            managerEmployeeId);

        var employee = await _db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == employeeId
                &&
                x.TeamId == manager.TeamId);

        if (employee == null)
        {
            throw new KeyNotFoundException(
                "Employee was not found in your Team.");
        }

        // Prevent privilege changes for Manager or Admin.
        if (employee.Role != "Employee")
        {
            throw new ArgumentException(
                "Schedule privilege can only be assigned to regular employees.");
        }

        employee.SchedulePrivilege =
            allowed;

        await _db.SaveChangesAsync();
    }

    // =========================================================
    // GET SINGLE ON-CALL
    //
    // Used after creating/updating a schedule.
    // Returns all imported metadata.
    // =========================================================

    private async Task<OnCallDto> GetOnCallByIdAsync(
        int id)
    {
        var schedule = await _db.OnCallSchedules
            .Include(x => x.PrimaryEmployee)
            .Include(x => x.SecondaryEmployee)
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


    // =========================================================
    // EXPORT PREVIOUS MONTH: matches the uploaded August sheet:
    // Day Type | Date | employee assignment columns | Hours/Day
    // | employee hours columns | Total Hours | Total Oncalls.
    // Both 1st and 2nd on-call count, exactly like its formulas.
    // =========================================================
    private static string? NormalizeDayType(string? value)
    {
        var text = value?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(text)) return null;
        if (text == "holiday" || text == "weekend" ||
            text == "public holiday" || text == "off day") return "Holiday";
        if (text == "weekday" || text == "working day" ||
            text == "workday") return "Weekday";
        return null;
    }

    public async Task<(byte[] Content, string FileName)> ExportPreviousMonthAsync(
        string managerEmployeeId)
    {
        // This authorization also scopes the query to the editor's own team.
        var editor = await GetScheduleEditorAsync(managerEmployeeId);
        var cairo = TimeZoneInfo.FindSystemTimeZoneById("Africa/Cairo");
        var cairoToday = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, cairo).Date;
        var firstThisMonth = new DateTime(cairoToday.Year, cairoToday.Month, 1);
        var firstLastMonth = firstThisMonth.AddMonths(-1);
        var days = DateTime.DaysInMonth(firstLastMonth.Year, firstLastMonth.Month);

        var assignments = await _db.OnCallSchedules
            .AsNoTracking()
            .Where(s => s.TeamId == editor.TeamId &&
                s.Date >= firstLastMonth && s.Date < firstThisMonth)
            .OrderBy(s => s.Date)
            .ToListAsync();

        if (assignments.Count == 0)
            throw new ArgumentException("No schedules exist for the previous month.");

        // Do not silently treat a missing day type as a Weekday and mispay hours.
        var invalid = assignments
            .Where(s => NormalizeDayType(s.DayType) == null)
            .Select(s => s.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))
            .ToList();
        if (invalid.Count > 0)
            throw new ArgumentException(
                "Set Holiday/Weekday on these schedules before exporting: " +
                string.Join(", ", invalid));

        var people = await _db.Users.AsNoTracking()
            .Where(u => u.TeamId == editor.TeamId && u.Role == "Employee")
            .OrderBy(u => u.Name)
            .ToListAsync();
        if (people.Count == 0)
            throw new ArgumentException("This team has no eligible employees to export.");

        // Avoid silently losing credited hours if a historical assignment
        // references a deleted/moved person or a non-Employee role.
        var eligibleIds = people.Select(person => person.Id).ToHashSet();
        var unsupportedAssignments = assignments
            .Where(s => (s.PrimaryEmployeeId.HasValue && !eligibleIds.Contains(s.PrimaryEmployeeId.Value)) ||
                        (s.SecondaryEmployeeId.HasValue && !eligibleIds.Contains(s.SecondaryEmployeeId.Value)))
            .Select(s => s.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))
            .ToList();
        if (unsupportedAssignments.Count > 0)
            throw new ArgumentException("Some historical assignments reference people outside the current employee list: " +
                string.Join(", ", unsupportedAssignments) + ". Review those records before exporting.");

        // This format needs one assignment cell per employee per date.
        // The database already enforces one schedule per team/day.
        var daySchedules = assignments.ToDictionary(s => s.Date.Date);
        var firstEmployeeColumn = 3;
        var hoursPerDayColumn = firstEmployeeColumn + people.Count;
        var firstHoursColumn = hoursPerDayColumn + 1;
        var lastColumn = firstHoursColumn + people.Count - 1;
        var endDataRow = days + 1;
        var totalHoursRow = endDataRow + 1;
        var totalOncallsRow = endDataRow + 2;

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(firstLastMonth.ToString("MMM yyyy", CultureInfo.InvariantCulture));
        sheet.Cell(1, 1).Value = "";
        sheet.Cell(1, 2).Value = "";
        sheet.Cell(1, hoursPerDayColumn).Value = "Hours/Day";

        for (var i = 0; i < people.Count; i++)
        {
            sheet.Cell(1, firstEmployeeColumn + i).Value = people[i].Name;
            sheet.Cell(1, firstHoursColumn + i).Value = people[i].Name + " Hours";
        }

        for (var day = 1; day <= days; day++)
        {
            var date = new DateTime(firstLastMonth.Year, firstLastMonth.Month, day);
            var row = day + 1;
            daySchedules.TryGetValue(date, out var schedule);
            // Missing schedule rows have no hours and follow Egypt's Fri/Sat
            // weekend default for display. Special public holidays must come
            // from a schedule's explicit DayType.
            var dayType = schedule != null
                ? NormalizeDayType(schedule.DayType)!
                : date.DayOfWeek == DayOfWeek.Friday || date.DayOfWeek == DayOfWeek.Saturday
                    ? "Holiday" : "Weekday";

            sheet.Cell(row, 1).Value = dayType;
            sheet.Cell(row, 2).Value = date;
            sheet.Cell(row, 2).Style.DateFormat.Format = "d-mmm-yy";
            sheet.Cell(row, hoursPerDayColumn).FormulaA1 =
                $"IF(A{row}=\"Holiday\",24,16)";

            if (dayType == "Holiday")
                sheet.Cell(row, 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#29B6E6");

            for (var i = 0; i < people.Count; i++)
            {
                var person = people[i];
                var assignment = schedule?.PrimaryEmployeeId == person.Id ? "1st Oncall" :
                    schedule?.SecondaryEmployeeId == person.Id ? "2nd Oncall" : "";
                var assignmentCell = sheet.Cell(row, firstEmployeeColumn + i);
                assignmentCell.Value = assignment;
                if (assignment.Length > 0)
                    assignmentCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#12A857");

                var assignmentLetter = assignmentCell.Address.ColumnLetter;
                var hoursCell = sheet.Cell(row, firstHoursColumn + i);
                var hoursPerDayLetter = sheet.Cell(row, hoursPerDayColumn).Address.ColumnLetter;
                hoursCell.FormulaA1 =
                    $"IF(OR({assignmentLetter}{row}=\"1st Oncall\",{assignmentLetter}{row}=\"2nd Oncall\"),{hoursPerDayLetter}{row},0)";
            }
        }

        sheet.Cell(totalHoursRow, 1).Value = "Total Hours";
        sheet.Cell(totalOncallsRow, 1).Value = "Total Oncalls";
        for (var i = 0; i < people.Count; i++)
        {
            var assignmentLetter = sheet.Cell(1, firstEmployeeColumn + i).Address.ColumnLetter;
            var hoursLetter = sheet.Cell(1, firstHoursColumn + i).Address.ColumnLetter;
            sheet.Cell(totalHoursRow, firstHoursColumn + i).FormulaA1 =
                $"SUM({hoursLetter}2:{hoursLetter}{endDataRow})";
            sheet.Cell(totalOncallsRow, firstHoursColumn + i).FormulaA1 =
                $"COUNTIF({assignmentLetter}2:{assignmentLetter}{endDataRow},\"1st Oncall\")+" +
                $"COUNTIF({assignmentLetter}2:{assignmentLetter}{endDataRow},\"2nd Oncall\")";
        }

        var used = sheet.Range(1, 1, totalOncallsRow, lastColumn);
        used.Style.Font.FontName = "Arial";
        used.Style.Font.FontSize = 10;
        used.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        used.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        used.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        sheet.Row(1).Style.Font.Bold = true;
        sheet.Row(totalHoursRow).Style.Font.Bold = true;
        sheet.Row(totalOncallsRow).Style.Font.Bold = true;
        sheet.Row(totalHoursRow).Style.Fill.BackgroundColor = XLColor.FromHtml("#E1F6EC");
        sheet.Row(totalOncallsRow).Style.Fill.BackgroundColor = XLColor.FromHtml("#FFF1DB");
        sheet.Column(1).Width = 16;
        sheet.Column(2).Width = 17;
        for (var i = 0; i < people.Count; i++)
        {
            sheet.Column(firstEmployeeColumn + i).Width = 20;
            sheet.Column(firstHoursColumn + i).Width = 20;
        }
        sheet.Column(hoursPerDayColumn).Width = 15;
        sheet.SheetView.FreezeRows(1);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        var safeName = System.Text.RegularExpressions.Regex.Replace(
            editor.Team?.Name ?? "Team", "[^a-zA-Z0-9_-]+", "_");
        var fileName = $"{safeName}_{firstLastMonth:yyyy-MM}_OnCall.xlsx";
        return (stream.ToArray(), fileName);
    }

}