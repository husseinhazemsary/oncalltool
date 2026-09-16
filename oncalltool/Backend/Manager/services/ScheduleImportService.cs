using System.Globalization;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using oncalltool.Backend.Common.Data;
using oncalltool.Backend.Common.Models;
using oncalltool.Backend.Manager.DTOs;

namespace oncalltool.Backend.Manager.Services;

public class ScheduleImportService
{
    private readonly AppDbContext _db;


    public ScheduleImportService(
        AppDbContext db)
    {
        _db = db;
    }


    private class ImportRow
    {
        public int RowNumber { get; set; }

        public DateTime Date { get; set; }

        public string DayType { get; set; } = "";

        public string PrimaryName { get; set; } = "";

        public string PrimaryStatus { get; set; } = "";

        public string SecondaryName { get; set; } = "";

        public string SwapNote { get; set; } = "";

        public int IncidentCount { get; set; }

        public string ImpactedPlatforms { get; set; } = "";

        public string IncidentDescription { get; set; } = "";
    }


    // =========================================================
    // PERMISSION
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
                "You do not have permission to import schedules.");
        }


        return user;
    }


    // =========================================================
    // MAIN IMPORT
    // =========================================================

    public async Task<CsvImportResultDto> ImportAsync(
        string employeeId,
        Stream fileStream,
        string extension)
    {
        var editor =
            await GetScheduleEditorAsync(
                employeeId);


        List<ImportRow> rows;


        if (
            extension.Equals(
                ".csv",
                StringComparison.OrdinalIgnoreCase)
        )
        {
            rows =
                ReadCsv(
                    fileStream);
        }

        else if (
            extension.Equals(
                ".xlsx",
                StringComparison.OrdinalIgnoreCase)
        )
        {
            rows =
                ReadExcel(
                    fileStream);
        }

        else
        {
            throw new ArgumentException(
                "Only CSV and XLSX files are supported.");
        }


        return await ImportRowsAsync(
            editor,
            rows);
    }


    // =========================================================
    // READ CSV
    // =========================================================

    private static List<ImportRow> ReadCsv(
        Stream stream)
    {
        var rows =
            new List<ImportRow>();


        using var reader =
            new StreamReader(
                stream);


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


        using var csv =
            new CsvReader(
                reader,
                config);


        if (!csv.Read())
        {
            return rows;
        }


        csv.ReadHeader();


        var rowNumber =
            1;


        while (csv.Read())
        {
            rowNumber++;


            var dateText =
                GetCsvField(
                    csv,
                    "Date");


            if (
                string.IsNullOrWhiteSpace(
                    dateText)
            )
            {
                continue;
            }


            if (
                !TryParseDate(
                    dateText,
                    out var date)
            )
            {
                throw new ArgumentException(
                    $"Row {rowNumber}: Invalid date '{dateText}'.");
            }


            var incidentText =
                GetCsvField(
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
                throw new ArgumentException(
                    $"Row {rowNumber}: Invalid Incident Count.");
            }


            rows.Add(
                new ImportRow
                {
                    RowNumber =
                        rowNumber,

                    Date =
                        date.Date,

                    DayType =
                        GetCsvField(
                            csv,
                            "Type"),

                    PrimaryName =
                        GetCsvField(
                            csv,
                            "Primary"),

                    PrimaryStatus =
                        GetCsvField(
                            csv,
                            "Primary Status"),

                    SecondaryName =
                        GetCsvFieldAny(
                            csv,
                            "Secondry",
                            "Secondary"),

                    SwapNote =
                        GetCsvField(
                            csv,
                            "Swap"),

                    IncidentCount =
                        incidentCount,

                    ImpactedPlatforms =
                        GetCsvField(
                            csv,
                            "Impacted Platforms"),

                    IncidentDescription =
                        GetCsvField(
                            csv,
                            "Incident Description")
                });
        }


        return rows;
    }


    // =========================================================
    // READ EXCEL
    //
    // Supports your original "2026" sheet.
    // =========================================================

    private static List<ImportRow> ReadExcel(
        Stream stream)
    {
        var rows =
            new List<ImportRow>();


        using var workbook =
            new XLWorkbook(
                stream);


        IXLWorksheet sheet;


        if (
            workbook.Worksheets
                .TryGetWorksheet(
                    "2026",
                    out var sheet2026)
        )
        {
            sheet =
                sheet2026;
        }

        else
        {
            sheet =
                workbook.Worksheets.First();
        }


        foreach (
            var row in
            sheet.RowsUsed().Skip(1)
        )
        {
            if (
                row.Cell(1).IsEmpty()
            )
            {
                continue;
            }


            DateTime date;


            if (
                !row.Cell(1)
                    .TryGetValue<DateTime>(
                        out date)
            )
            {
                var dateText =
                    row.Cell(1)
                        .GetString()
                        .Trim();


                if (
                    !TryParseDate(
                        dateText,
                        out date)
                )
                {
                    throw new ArgumentException(
                        $"Excel row {row.RowNumber()}: Invalid date.");
                }
            }


            var incidentCount =
                0;


            var incidentCell =
                row.Cell(7);


            if (!incidentCell.IsEmpty())
            {
                if (
                    incidentCell.TryGetValue<int>(
                        out var number)
                )
                {
                    incidentCount =
                        number;
                }

                else
                {
                    int.TryParse(
                        incidentCell.GetString(),
                        out incidentCount);
                }
            }


            rows.Add(
                new ImportRow
                {
                    RowNumber =
                        row.RowNumber(),

                    Date =
                        date.Date,

                    DayType =
                        row.Cell(2)
                            .GetString()
                            .Trim(),

                    PrimaryName =
                        row.Cell(3)
                            .GetString()
                            .Trim(),

                    PrimaryStatus =
                        row.Cell(4)
                            .GetString()
                            .Trim(),

                    SecondaryName =
                        row.Cell(5)
                            .GetString()
                            .Trim(),

                    SwapNote =
                        row.Cell(6)
                            .GetString()
                            .Trim(),

                    IncidentCount =
                        incidentCount,

                    ImpactedPlatforms =
                        row.Cell(8)
                            .GetString()
                            .Trim(),

                    IncidentDescription =
                        row.Cell(9)
                            .GetString()
                            .Trim()
                });
        }


        return rows;
    }


    // =========================================================
    // VALIDATE + SAVE
    // =========================================================

    private async Task<CsvImportResultDto>
        ImportRowsAsync(
            AppUser editor,
            List<ImportRow> rows)
    {
        var result =
            new CsvImportResultDto
            {
                TotalRows =
                    rows.Count
            };


        if (rows.Count == 0)
        {
            throw new ArgumentException(
                "The schedule file contains no rows.");
        }


        // Managers must not be assigned on-call.
        var employees =
            await _db.Users

                .Where(x =>
                    x.DepartmentId ==
                        editor.DepartmentId
                    &&
                    x.Role != "Manager")

                .ToListAsync();


        var employeesByName =
            employees

                .GroupBy(
                    x => x.Name.Trim(),
                    StringComparer.OrdinalIgnoreCase)

                .ToDictionary(
                    x => x.Key,
                    x => x.First(),
                    StringComparer.OrdinalIgnoreCase);


        var existingSchedules =
            await _db.OnCallSchedules

                .Where(x =>
                    x.DepartmentId ==
                        editor.DepartmentId)

                .ToDictionaryAsync(
                    x => x.Date.Date);


        var fileDates =
            new HashSet<DateTime>();


        var newSchedules =
            new List<OnCallSchedule>();


        foreach (
            var row in rows
        )
        {
            // ---------------------------------------------
            // PRIMARY
            // ---------------------------------------------

            if (
                string.IsNullOrWhiteSpace(
                    row.PrimaryName)
            )
            {
                result.Errors.Add(
                    $"Row {row.RowNumber}: Primary employee is missing.");

                continue;
            }


            if (
                !employeesByName.TryGetValue(
                    row.PrimaryName.Trim(),
                    out var primary)
            )
            {
                result.Errors.Add(
                    $"Row {row.RowNumber}: Primary employee '{row.PrimaryName}' is not in this team.");

                continue;
            }


            // ---------------------------------------------
            // SECONDARY
            // ---------------------------------------------

            if (
                string.IsNullOrWhiteSpace(
                    row.SecondaryName)
            )
            {
                result.Errors.Add(
                    $"Row {row.RowNumber}: Secondary employee is missing.");

                continue;
            }


            if (
                !employeesByName.TryGetValue(
                    row.SecondaryName.Trim(),
                    out var secondary)
            )
            {
                result.Errors.Add(
                    $"Row {row.RowNumber}: Secondary employee '{row.SecondaryName}' is not in this team.");

                continue;
            }


            if (
                primary.Id ==
                secondary.Id
            )
            {
                result.Errors.Add(
                    $"Row {row.RowNumber}: Primary and Secondary must be different.");

                continue;
            }


            // ---------------------------------------------
            // DUPLICATE DATE INSIDE FILE
            // ---------------------------------------------

            if (
                !fileDates.Add(
                    row.Date.Date)
            )
            {
                result.Errors.Add(
                    $"Row {row.RowNumber}: Date {row.Date:yyyy-MM-dd} appears more than once.");

                continue;
            }


            // ---------------------------------------------
            // EXISTING OR NEW SCHEDULE
            // ---------------------------------------------

            if (
                existingSchedules.TryGetValue(
                    row.Date.Date,
                    out var schedule)
            )
            {
                ApplyRow(
                    schedule,
                    row,
                    primary,
                    secondary);
            }

            else
            {
                schedule =
                    new OnCallSchedule
                    {
                        DepartmentId =
                            editor.DepartmentId,

                        Date =
                            row.Date.Date
                    };


                ApplyRow(
                    schedule,
                    row,
                    primary,
                    secondary);


                newSchedules.Add(
                    schedule);


                existingSchedules[
                    row.Date.Date
                ] =
                    schedule;
            }
        }


        // Atomic validation:
        // one bad row = nothing saved.
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


        await using var transaction =
            await _db.Database
                .BeginTransactionAsync();


        try
        {
            if (
                newSchedules.Count > 0
            )
            {
                _db.OnCallSchedules
                    .AddRange(
                        newSchedules);
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
            rows.Count;

        result.FailedRows =
            0;


        return result;
    }


    // =========================================================
    // APPLY IMPORT ROW
    // =========================================================

    private static void ApplyRow(
        OnCallSchedule schedule,
        ImportRow row,
        AppUser primary,
        AppUser secondary)
    {
        schedule.PrimaryEmployeeId =
            primary.Id;

        schedule.SecondaryEmployeeId =
            secondary.Id;

        schedule.DayType =
            NullIfEmpty(
                row.DayType);

        schedule.PrimaryStatus =
            NullIfEmpty(
                row.PrimaryStatus);

        schedule.SwapNote =
            NullIfEmpty(
                row.SwapNote);

        schedule.IncidentCount =
            row.IncidentCount;

        schedule.ImpactedPlatforms =
            NullIfEmpty(
                row.ImpactedPlatforms);

        schedule.IncidentDescription =
            NullIfEmpty(
                row.IncidentDescription);

        schedule.SourceSheet =
            "Manager Import";
    }


    // =========================================================
    // CSV HELPERS
    // =========================================================

    private static string GetCsvField(
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


    private static string GetCsvFieldAny(
        CsvReader csv,
        params string[] headers)
    {
        foreach (
            var header in headers
        )
        {
            var value =
                GetCsvField(
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
    // DATE HELPER
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


    private static string? NullIfEmpty(
        string value)
    {
        return string.IsNullOrWhiteSpace(   
            value)
            ? null
            : value.Trim();
    }
}