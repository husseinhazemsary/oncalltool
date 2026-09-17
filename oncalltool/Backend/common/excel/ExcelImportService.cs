using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using oncalltool.Backend.Common.Data;
using oncalltool.Backend.Common.Models;

namespace oncalltool.Backend.Common.Excel;

public class ExcelImportService
{
    private readonly AppDbContext _db;

    public ExcelImportService(AppDbContext db)
    {
        _db = db;
    }


    public async Task ImportAsync(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);

        await using var transaction =
            await _db.Database.BeginTransactionAsync();

        try
        {
            // Main Enterprise RA sheet
            if (workbook.TryGetWorksheet("2026", out var enterpriseSheet))
            {
                await ImportEnterpriseRaAsync(enterpriseSheet);
            }

            // Database on-call
            if (workbook.TryGetWorksheet("DB OnCall", out var dbSheet))
            {
                await ImportDatabaseAsync(dbSheet);
            }

            // Linux on-call
            if (workbook.TryGetWorksheet("Linux OnCall", out var linuxSheet))
            {
                await ImportLinuxAsync(linuxSheet);
            }


            await _db.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }


    /* ==========================================================
       ENTERPRISE RA — SHEET "2026"
       ========================================================== */

    private async Task ImportEnterpriseRaAsync(
        IXLWorksheet sheet)
    {
        // Change this to ERP Applications if this sheet
        // actually represents ERP Applications in your company.
        var Team =
            await GetOrCreateTeamAsync(
                "Enterprise RA");


        foreach (var row in sheet.RowsUsed().Skip(1))
        {
            if (row.Cell(1).IsEmpty())
                continue;


            DateTime date;

            try
            {
                date =
                    row.Cell(1)
                        .GetDateTime()
                        .Date;
            }
            catch
            {
                continue;
            }


            string dayType =
                row.Cell(2)
                    .GetString()
                    .Trim();


            string primaryName =
                CleanName(
                    row.Cell(3)
                        .GetString());


            string primaryStatus =
                row.Cell(4)
                    .GetString()
                    .Trim();


            // Excel column is actually spelled "Secondry"
            string secondaryName =
                CleanName(
                    row.Cell(5)
                        .GetString());


            string swap =
                row.Cell(6)
                    .GetString()
                    .Trim();


            int incidentCount = 0;

            if (!row.Cell(7).IsEmpty())
            {
                int.TryParse(
                    row.Cell(7)
                        .GetString(),
                    out incidentCount);
            }


            string impactedPlatforms =
                row.Cell(8)
                    .GetString()
                    .Trim();


            string incidentDescription =
                row.Cell(9)
                    .GetString()
                    .Trim();


            var primary =
                await GetOrCreateEmployeeAsync(
                    Team,
                    primaryName);


            var secondary =
                await GetOrCreateEmployeeAsync(
                    Team,
                    secondaryName);


            var schedule =
                await GetOrCreateScheduleAsync(
                    Team.Id,
                    date);


            schedule.PrimaryEmployeeId =
                primary?.Id;

            schedule.SecondaryEmployeeId =
                secondary?.Id;

            schedule.DayType =
                NullIfEmpty(dayType);

            schedule.PrimaryStatus =
                NullIfEmpty(primaryStatus);

            schedule.SwapNote =
                NullIfEmpty(swap);

            schedule.IncidentCount =
                incidentCount;

            schedule.ImpactedPlatforms =
                NullIfEmpty(impactedPlatforms);

            schedule.IncidentDescription =
                NullIfEmpty(incidentDescription);

            schedule.SourceSheet =
                "2026";
        }
    }


    /* ==========================================================
       DATABASE — SHEET "DB OnCall"
       ========================================================== */

    private async Task ImportDatabaseAsync(
        IXLWorksheet sheet)
    {
        var Team =
            await GetOrCreateTeamAsync(
                "Database");


        foreach (var row in sheet.RowsUsed().Skip(1))
        {
            if (row.Cell(1).IsEmpty())
                continue;


            DateTime date;

            try
            {
                date =
                    row.Cell(1)
                        .GetDateTime()
                        .Date;
            }
            catch
            {
                continue;
            }


            string primaryName =
                CleanName(
                    row.Cell(2)
                        .GetString());


            string secondaryName =
                CleanName(
                    row.Cell(3)
                        .GetString());


            // Ignore completely empty future rows.
            if (
                string.IsNullOrWhiteSpace(primaryName)
                &&
                string.IsNullOrWhiteSpace(secondaryName)
            )
            {
                continue;
            }


            var primary =
                await GetOrCreateEmployeeAsync(
                    Team,
                    primaryName);


            var secondary =
                await GetOrCreateEmployeeAsync(
                    Team,
                    secondaryName);


            var schedule =
                await GetOrCreateScheduleAsync(
                    Team.Id,
                    date);


            schedule.PrimaryEmployeeId =
                primary?.Id;

            schedule.SecondaryEmployeeId =
                secondary?.Id;

            schedule.SourceSheet =
                "DB OnCall";
        }
    }


    /* ==========================================================
       LINUX — SHEET "Linux OnCall"
       ========================================================== */

    private async Task ImportLinuxAsync(
        IXLWorksheet sheet)
    {
        var Team =
            await GetOrCreateTeamAsync(
                "Linux");


        foreach (var row in sheet.RowsUsed().Skip(1))
        {
            if (row.Cell(1).IsEmpty())
                continue;


            DateTime date;

            try
            {
                date =
                    row.Cell(1)
                        .GetDateTime()
                        .Date;
            }
            catch
            {
                continue;
            }


            string primaryName =
                CleanName(
                    row.Cell(2)
                        .GetString());


            string number =
                row.Cell(3)
                    .GetString()
                    .Trim();


            /*
             "-" exists many times in the real sheet.
             We keep the date, but leave Primary unassigned.
            */

            var primary =
                await GetOrCreateEmployeeAsync(
                    Team,
                    primaryName);


            // If everything is empty, don't create useless rows.
            if (
                primary == null
                &&
                string.IsNullOrWhiteSpace(number)
            )
            {
                continue;
            }


            var schedule =
                await GetOrCreateScheduleAsync(
                    Team.Id,
                    date);


            schedule.PrimaryEmployeeId =
                primary?.Id;

            schedule.SecondaryEmployeeId =
                null;

            schedule.ContactNumber =
                NullIfEmpty(number);

            schedule.SourceSheet =
                "Linux OnCall";
        }
    }


    /* ==========================================================
       HELPERS
       ========================================================== */

    private async Task<Team>
        GetOrCreateTeamAsync(
            string TeamName)
    {
        var Team =
            await _db.Teams
                .FirstOrDefaultAsync(x =>
                    x.Name ==
                    TeamName);


        if (Team != null)
            return Team;


        Team =
            new Team
            {
                Name =
                    TeamName
            };


        _db.Teams.Add(
            Team);


        await _db.SaveChangesAsync();


        return Team;
    }


    private async Task<AppUser?>
        GetOrCreateEmployeeAsync(
            Team Team,
            string name)
    {
        if (
            string.IsNullOrWhiteSpace(name)
            ||
            name == "-"
        )
        {
            return null;
        }


        var employee =
            await _db.Users
                .FirstOrDefaultAsync(x =>
                    x.TeamId ==
                        Team.Id
                    &&
                    x.Name ==
                        name);


        if (employee != null)
            return employee;


        employee =
            new AppUser
            {
                Name =
                    name,

                TeamId =
                    Team.Id,

                Role =
                    "Employee",

                SchedulePrivilege =
                    false
            };


        _db.Users.Add(
            employee);


        await _db.SaveChangesAsync();


        return employee;
    }


    private async Task<OnCallSchedule>
        GetOrCreateScheduleAsync(
            int TeamId,
            DateTime date)
    {
        var schedule =
            await _db.OnCallSchedules
                .FirstOrDefaultAsync(x =>
                    x.TeamId ==
                        TeamId
                    &&
                    x.Date ==
                        date.Date);


        if (schedule != null)
            return schedule;


        schedule =
            new OnCallSchedule
            {
                TeamId =
                    TeamId,

                Date =
                    date.Date
            };


        _db.OnCallSchedules.Add(
            schedule);


        return schedule;
    }


    private static string CleanName(
        string value)
    {
        return value.Trim();
    }


    private static string? NullIfEmpty(
        string value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value;
    }
}