namespace oncalltool.Backend.Manager.DTOs;

public class ManagerDashboardDto
{
    public string TeamName { get; set; } = string.Empty;

    public int TeamMemberCount { get; set; }

    public string? PrimaryToday { get; set; }

    public string? SecondaryToday { get; set; }

    public int ScheduleEditors { get; set; }
}