namespace oncalltool.Backend.Manager.DTOs;

public class OnCallDto
{
    public int Id { get; set; }

    public DateTime Date { get; set; }


    public string? DayType { get; set; }


    public int? PrimaryEmployeeId { get; set; }

    public string PrimaryName { get; set; } =
        "Unassigned";

    public string? PrimaryStatus { get; set; }


    public int? SecondaryEmployeeId { get; set; }

    public string SecondaryName { get; set; } =
        "Unassigned";


    public string? SwapNote { get; set; }


    public int IncidentCount { get; set; }

    public string? ImpactedPlatforms { get; set; }

    public string? IncidentDescription { get; set; }
}