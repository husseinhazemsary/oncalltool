using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using oncalltool.Backend.Common.Data;
using oncalltool.Backend.Common.Models;
using oncalltool.Backend.Manager.DTOs;

namespace oncalltool.Backend.Manager.Services;

public class CsvOnCallImportService
{
    private readonly AppDbContext _db;


    public CsvOnCallImportService(
        AppDbContext db)
    {
        _db = db;
    }


    // =========================================================
    // GET SCHEDULE EDITOR
    //
    // Manager OR employee with SchedulePrivilege.
    // =========================================================

    private async Task<AppUser> GetScheduleEditorAsync(
        string employeeId)
    {
        var user =
            await _db.Users
                .Include(x => x.Team)
                .FirstOrDefaultAsync(x =>
                    x.EmployeeId == employeeId);


        if (user == null)
        {
            throw new KeyNotFoundException(
                "User was not found.");
        }


        if (
            user.Role != "Manager"
            &&
            !user.SchedulePrivilege
        )
        {
            throw new UnauthorizedAccessException(
                "You do not have permission to import on-call schedules.");
        }


        return user;
    }


    // =========================================================
    // IMPORT CSV
    // =========================================================

    public async Task<CsvImportResultDto> ImportAsync(
        string managerEmployeeId,
        Stream fileStream)
    {
        var editor =
            await GetScheduleEditorAsync(
                managerEmployeeId);


        var result =
            new CsvImportResultDto();


        var config =
            new CsvConfiguration(
                CultureInfo.InvariantCulture)
            {
                HeaderValidated = null,

                MissingFieldFound = null,

                BadDataFound = null,

                TrimOptions =
                    TrimOptions.Trim
            };


        using var reader =
            new StreamReader(
                fileStream);


        using var csv =
            new CsvReader(
                reader,
                config);


        // =====================================================
        // READ HEADER
        // =====================================================

        if (!await csv.ReadAsync())
        {
            throw new ArgumentException(
                "The CSV file is empty.");
        }


        csv.ReadHeader();


        // =====================================================
        // LOAD TEAM EMPLOYEES
        //
        // Manager is deliberately excluded from on-call.
        // =====================================================

        var employees =
            await _db.Users

                .Where(x =>
                    x.TeamId ==
                        editor.TeamId
                    &&
                    x.Role != "Manager")

                .ToListAsync();


        // Match CSV by employee NAME
        var employeesByName =
            employees

                .GroupBy(
                    x => x.Name.Trim(),
                    StringComparer.OrdinalIgnoreCase)

                .ToDictionary(
                    x => x.Key,
                    x => x.First(),
                    StringComparer.OrdinalIgnoreCase);


        // =====================================================
        // READ EXISTING SCHEDULES
        // =====================================================

        var existingSchedules =
            await _db.OnCallSchedules

                .Where(x =>
                    x.TeamId ==
                        editor.TeamId)

                .ToDictionaryAsync(
                    x => x.Date.Date);


        var csvDates =
            new HashSet<DateTime>();


        var schedulesToCreate =
            new List<OnCallSchedule>();


        var schedulesToUpdate =
            new List<OnCallSchedule>();


        var rowNumber =
            1;


        // =====================================================
        // READ ROWS
        // =====================================================

        while (
            await csv.ReadAsync()
        )
        {
            rowNumber++;

            result.TotalRows++;


            // -------------------------------------------------
            // DATE
            // -------------------------------------------------

            var dateText =
                GetField(
                    csv,
                    "Date");


            if (
                string.IsNullOrWhiteSpace(
                    dateText)
            )
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Date is required.");

                continue;
            }


            if (
                !TryParseDate(
                    dateText,
                    out var date)
            )
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Invalid date '{dateText}'. Recommended format: yyyy-MM-dd.");

                continue;
            }


            date =
                date.Date;


            // -------------------------------------------------
            // DUPLICATE DATE INSIDE CSV
            // -------------------------------------------------

            if (
                !csvDates.Add(
                    date)
            )
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Date {date:yyyy-MM-dd} appears more than once in the CSV.");

                continue;
            }


            // -------------------------------------------------
            // TYPE
            //
            // Working Day / Holiday / Week End
            // -------------------------------------------------

            var dayType =
                NullIfEmpty(
                    GetField(
                        csv,
                        "Type"));


            // -------------------------------------------------
            // PRIMARY
            // -------------------------------------------------

            var primaryName =
                CleanName(
                    GetField(
                        csv,
                        "Primary"));


            if (
                string.IsNullOrWhiteSpace(
                    primaryName)
            )
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Primary employee is required.");

                continue;
            }


            if (
                !employeesByName.TryGetValue(
                    primaryName,
                    out var primaryEmployee)
            )
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Primary employee '{primaryName}' was not found in this team.");

                continue;
            }


            // -------------------------------------------------
            // PRIMARY STATUS
            //
            // Example: Vacation
            // -------------------------------------------------

            var primaryStatus =
                NullIfEmpty(
                    GetField(
                        csv,
                        "Primary Status"));


            // -------------------------------------------------
            // SECONDARY
            //
            // Workbook spells this "Secondry".
            // We support BOTH spellings.
            // -------------------------------------------------

            var secondaryName =
                CleanName(
                    GetFieldAny(
                        csv,
                        "Secondry",
                        "Secondary"));


            if (
                string.IsNullOrWhiteSpace(
                    secondaryName)
            )
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Secondary employee is required.");

                continue;
            }


            if (
                !employeesByName.TryGetValue(
                    secondaryName,
                    out var secondaryEmployee)
            )
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Secondary employee '{secondaryName}' was not found in this team.");

                continue;
            }


            // -------------------------------------------------
            // PRIMARY != SECONDARY
            // -------------------------------------------------

            if (
                primaryEmployee.Id ==
                secondaryEmployee.Id
            )
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Primary and Secondary employees must be different.");

                continue;
            }


            // -------------------------------------------------
            // SWAP
            //
            // Example:
            // Swap with Esraa
            //
            // Stored as information only.
            // Does NOT automatically perform a swap.
            // -------------------------------------------------

            var swapNote =
                NullIfEmpty(
                    GetField(
                        csv,
                        "Swap"));


            // -------------------------------------------------
            // INCIDENT COUNT
            // -------------------------------------------------

            var incidentText =
                GetField(
                    csv,
                    "Incident Count");


            var incidentCount =
                0;


            if (
                !string.IsNullOrWhiteSpace(
                    incidentText)
                &&
                !int.TryParse(
                    incidentText,
                    out incidentCount)
            )
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Incident Count '{incidentText}' is invalid.");

                continue;
            }


            if (incidentCount < 0)
            {
                result.Errors.Add(
                    $"Row {rowNumber}: Incident Count cannot be negative.");

                continue;
            }


            // -------------------------------------------------
            // INCIDENT INFORMATION
            // -------------------------------------------------

            var impactedPlatforms =
                NullIfEmpty(
                    GetField(
                        csv,
                        "Impacted Platforms"));


            var incidentDescription =
                NullIfEmpty(
                    GetField(
                        csv,
                        "Incident Description"));


            // -------------------------------------------------
            // CREATE OR UPDATE
            //
            // Re-importing the CSV updates the same date
            // instead of creating duplicate schedules.
            // -------------------------------------------------

            if (
                existingSchedules.TryGetValue(
                    date,
                    out var existingSchedule)
            )
            {
                existingSchedule.PrimaryEmployeeId =
                    primaryEmployee.Id;


                existingSchedule.SecondaryEmployeeId =
                    secondaryEmployee.Id;


                existingSchedule.DayType =
                    dayType;


                existingSchedule.PrimaryStatus =
                    primaryStatus;


                existingSchedule.SwapNote =
                    swapNote;


                existingSchedule.IncidentCount =
                    incidentCount;


                existingSchedule.ImpactedPlatforms =
                    impactedPlatforms;


                existingSchedule.IncidentDescription =
                    incidentDescription;


                existingSchedule.SourceSheet =
                    "Manager CSV";


                schedulesToUpdate.Add(
                    existingSchedule);
            }

            else
            {
                var schedule =
                    new OnCallSchedule
                    {
                        TeamId =
                            editor.TeamId,

                        Date =
                            date,

                        PrimaryEmployeeId =
                            primaryEmployee.Id,

                        SecondaryEmployeeId =
                            secondaryEmployee.Id,

                        DayType =
                            dayType,

                        PrimaryStatus =
                            primaryStatus,

                        SwapNote =
                            swapNote,

                        IncidentCount =
                            incidentCount,

                        ImpactedPlatforms =
                            impactedPlatforms,

                        IncidentDescription =
                            incidentDescription,

                        SourceSheet =
                            "Manager CSV"
                    };


                schedulesToCreate.Add(
                    schedule);


                // Protect against duplicates later in same import
                existingSchedules[
                    date
                ] = schedule;
            }
        }


        // =====================================================
        // INVALID CSV
        //
        // Atomic import:
        // If ONE row is invalid, save NOTHING.
        // =====================================================

        if (
            result.Errors.Count > 0
        )
        {
            result.Success =
                false;


            result.ImportedRows =
                0;


            result.FailedRows =
                result.Errors.Count;


            return result;
        }


        if (result.TotalRows == 0)
        {
            throw new ArgumentException(
                "The CSV contains no schedule rows.");
        }


        // =====================================================
        // SAVE
        // =====================================================

        await using var transaction =
            await _db.Database
                .BeginTransactionAsync();


        try
        {
            if (
                schedulesToCreate.Count > 0
            )
            {
                _db.OnCallSchedules
                    .AddRange(
                        schedulesToCreate);
            }


            await _db.SaveChangesAsync();


            await transaction
                .CommitAsync();
        }

        catch
        {
            await transaction
                .RollbackAsync();

            throw;
        }


        result.Success =
            true;


        result.ImportedRows =
            schedulesToCreate.Count
            +
            schedulesToUpdate.Count;


        result.FailedRows =
            0;


        return result;
    }


    // =========================================================
    // HEADER HELPER
    // =========================================================

    private static string GetField(
        CsvReader csv,
        string header)
    {
        try
        {
            return csv
                .GetField(
                    header)
                ?.Trim()
                ?? "";
        }

        catch
        {
            return "";
        }
    }


    private static string GetFieldAny(
        CsvReader csv,
        params string[] headers)
    {
        foreach (
            var header in headers
        )
        {
            var value =
                GetField(
                    csv,
                    header);


            if (
                !string.IsNullOrWhiteSpace(
                    value)
            )
            {
                return value;
            }
        }


        return "";
    }


    // =========================================================
    // DATE PARSER
    // =========================================================

    private static bool TryParseDate(
        string value,
        out DateTime date)
    {
        var formats =
            new[]
            {
                "yyyy-MM-dd",
                "M/d/yyyy",
                "MM/dd/yyyy",
                "d/M/yyyy",
                "dd/MM/yyyy"
            };


        return DateTime.TryParseExact(
            value.Trim(),
            formats,
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out date);
    }


    // =========================================================
    // TEXT HELPERS
    // =========================================================

    private static string CleanName(
        string value)
    {
        return value
            .Trim();
    }


    private static string? NullIfEmpty(
        string value)
    {
        return string.IsNullOrWhiteSpace(
            value)
            ? null
            : value.Trim();
    }
}