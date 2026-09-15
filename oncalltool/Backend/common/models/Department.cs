namespace oncalltool.Backend.Common.Models;

public class Department
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public List<AppUser> Users { get; set; } = new();

    public List<OnCallSchedule> OnCallSchedules { get; set; } = new();
}