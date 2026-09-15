namespace oncalltool.Backend.Common.Models;

public class AppUser
{
    public int Id { get; set; }

    public string? EmployeeId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string Role { get; set; } = "Employee";

    public bool SchedulePrivilege { get; set; }

    public int DepartmentId { get; set; }

    public Department? Department { get; set; }
}