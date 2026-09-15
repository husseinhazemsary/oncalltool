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
    // CSV ROW MODEL
    // =========================================================

    private class CsvScheduleRow
    {
        public string Date { get; set; } = string.Empty;

        public string PrimaryEmployeeId { get; set; } =
            string.Empty;

        public string SecondaryEmployeeId { get; set; } =
            string.Empty;
    }


    // =========================================================
    // GET SCHEDULE EDITOR
    //
    // Allowed:
    // Manager
    // OR Employee with SchedulePrivilege = true
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


        // -----------------------------------------------------
        // READ CSV
        // -----------------------------------------------------

        using var reader =
            new StreamReader(
                fileStream);


        var config =
            new CsvConfiguration(
                CultureInfo.InvariantCulture)
            {
                HeaderValidated = null,
                MissingFieldFound = null,
                TrimOptions =
                    TrimOptions.Trim,

                BadDataFound = null
            };


        using var csv =
            new CsvReader(
                reader,
                config);


        List<CsvScheduleRow> rows;


        try
        {
            rows =
                csv.GetRecords<CsvScheduleRow>()
                    .ToList();
        }
        catch (Exception ex)
        {
            throw new ArgumentException(
                $"Could not read CSV file: {ex.Message}");
        }


        result.TotalRows =
            rows.Count;


        if (rows.Count == 0)
        {
            throw new ArgumentException(
                "The CSV file does not contain any schedule rows.");
        }


        // =====================================================
        // LOAD TEAM EMPLOYEES ONCE
        // =====================================================

        var departmentEmployees =
            await _db.Users

                .Where(x =>
                    x.DepartmentId ==
                    editor.DepartmentId)

                .ToListAsync();


        var employeesByEmployeeId =
            departmentEmployees

                .Where(x =>
                    !string.IsNullOrWhiteSpace(
                        x.EmployeeId))

                .ToDictionary(
                    x =>
                        x.EmployeeId!,
                    x =>
                        x,
                    StringComparer.OrdinalIgnoreCase);


        // =====================================================
        // LOAD EXISTING SCHEDULE DATES
        // =====================================================

        var existingScheduleDates =
            await _db.OnCallSchedules

                .Where(x =>
                    x.DepartmentId ==
                    editor.DepartmentId)

                .Select(x =>
                    x.Date.Date)

                .ToListAsync();


        var existingDates =
            existingScheduleDates
                .ToHashSet();


        // Keep track of duplicate dates inside the CSV itself.
        var csvDates =
            new HashSet<DateTime>();


        // These are only added if the entire CSV is valid.
        var schedulesToInsert =
            new List<OnCallSchedule>();


        // =====================================================
        // VALIDATE EVERY ROW
        // =====================================================

        for (
            int index = 0;
            index < rows.Count;
            index++
        )
        {
            var row =
                rows[index];


            // +2 because:
            // row 1 = header
            // first record = row 2
            var csvRowNumber =
                index + 2;


            // -------------------------------------------------
            // DATE
            // -------------------------------------------------

            if (
                !DateTime.TryParse(
                    row.Date,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var parsedDate)
            )
            {
                result.Errors.Add(
                    $"Row {csvRowNumber}: Invalid date '{row.Date}'.");

                continue;
            }


            var date =
                parsedDate.Date;


            // -------------------------------------------------
            // PRIMARY EMPLOYEE ID
            // -------------------------------------------------

            if (
                string.IsNullOrWhiteSpace(
                    row.PrimaryEmployeeId)
            )
            {
                result.Errors.Add(
                    $"Row {csvRowNumber}: PrimaryEmployeeId is required.");

                continue;
            }


            if (
                !employeesByEmployeeId.TryGetValue(
                    row.PrimaryEmployeeId,
                    out var primaryEmployee)
            )
            {
                result.Errors.Add(
                    $"Row {csvRowNumber}: Primary employee '{row.PrimaryEmployeeId}' does not exist in this department.");

                continue;
            }


            // -------------------------------------------------
            // SECONDARY EMPLOYEE ID
            // -------------------------------------------------

            if (
                string.IsNullOrWhiteSpace(
                    row.SecondaryEmployeeId)
            )
            {
                result.Errors.Add(
                    $"Row {csvRowNumber}: SecondaryEmployeeId is required.");

                continue;
            }


            if (
                !employeesByEmployeeId.TryGetValue(
                    row.SecondaryEmployeeId,
                    out var secondaryEmployee)
            )
            {
                result.Errors.Add(
                    $"Row {csvRowNumber}: Secondary employee '{row.SecondaryEmployeeId}' does not exist in this department.");

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
                    $"Row {csvRowNumber}: Primary and Secondary employees must be different.");

                continue;
            }


            // -------------------------------------------------
            // EXISTING DATABASE DATE
            // -------------------------------------------------

            if (
                existingDates.Contains(
                    date)
            )
            {
                result.Errors.Add(
                    $"Row {csvRowNumber}: A schedule already exists for {date:yyyy-MM-dd}.");

                continue;
            }


            // -------------------------------------------------
            // DUPLICATE DATE INSIDE CSV
            // -------------------------------------------------

            if (
                !csvDates.Add(
                    date)
            )
            {
                result.Errors.Add(
                    $"Row {csvRowNumber}: The date {date:yyyy-MM-dd} appears more than once in the CSV.");

                continue;
            }


            // -------------------------------------------------
            // VALID ROW
            // -------------------------------------------------

            schedulesToInsert.Add(
                new OnCallSchedule
                {
                    DepartmentId =
                        editor.DepartmentId,

                    Date =
                        date,

                    PrimaryEmployeeId =
                        primaryEmployee.Id,

                    SecondaryEmployeeId =
                        secondaryEmployee.Id,

                    SourceSheet =
                        "Manager CSV"
                });
        }


        // =====================================================
        // IF ANY ERROR EXISTS:
        //
        // Do NOT insert partial data.
        // Entire CSV is rejected.
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


        // =====================================================
        // SAVE ALL VALID ROWS
        // =====================================================

        await using var transaction =
            await _db.Database
                .BeginTransactionAsync();


        try
        {
            _db.OnCallSchedules
                .AddRange(
                    schedulesToInsert);


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
            schedulesToInsert.Count;

        result.FailedRows =
            0;


        return result;
    }
}