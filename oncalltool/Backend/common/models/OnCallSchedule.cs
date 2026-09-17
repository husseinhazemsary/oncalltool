namespace oncalltool.Backend.Common.Models;

public class OnCallSchedule
{
    public int Id { get; set; }

    public DateTime Date { get; set; }

    public int TeamId { get; set; }

    public Team? Team { get; set; }


    // Nullable because some Excel rows have "-" / no assignment
    public int? PrimaryEmployeeId { get; set; }

    public AppUser? PrimaryEmployee { get; set; }


    // Nullable because Linux has no Secondary column
    public int? SecondaryEmployeeId { get; set; }

    public AppUser? SecondaryEmployee { get; set; }


    // From Enterprise RA / 2026 sheet
    public string? DayType { get; set; }

    public string? PrimaryStatus { get; set; }

    public string? SwapNote { get; set; }


    // Incident information
    public int IncidentCount { get; set; }

    public string? ImpactedPlatforms { get; set; }

    public string? IncidentDescription { get; set; }


    // Linux-specific Number column
    public string? ContactNumber { get; set; }


    // Helps us know where the record came from
    public string? SourceSheet { get; set; }
}