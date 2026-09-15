namespace oncalltool.Backend.Manager.DTOs;

public class TeamMemberDto
{
    public int Id { get; set; }

    public string EmployeeId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public bool SchedulePrivilege { get; set; }
}