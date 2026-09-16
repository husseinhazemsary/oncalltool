namespace oncalltool.Backend.Employee.DTOs;

public class EmployeeDashboardDto
{
    public EmployeeProfileDto Employee { get; set; } = new();
    public List<TeamCoverageDto> Contacts { get; set; } = new();
    public List<string> PreferredTeams { get; set; } = new();
    public List<TeamOptionDto> AllTeams { get; set; } = new();
    public List<PersonDto> WeekPeople { get; set; } = new();
    public List<WeekDayDto> WeekDays { get; set; } = new();
    public List<FutureDutyDto> FutureDuties { get; set; } = new();
    public Dictionary<string, PersonDto> ReplacementEmployees { get; set; } = new();
    public List<ScheduleOverrideDto> ScheduleOverrides { get; set; } = new();
}

public class EmployeeProfileDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
}

public class TeamCoverageDto
{
    public string Team { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
    public PersonDto Primary { get; set; } = new();
    public PersonDto Secondary { get; set; } = new();
}

public class PersonDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
}

public class TeamOptionDto
{
    public string Name { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;
}

public class WeekDayDto
{
    public string Date { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}

public class FutureDutyDto
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class ScheduleOverrideDto
{
    public string Key { get; set; } = string.Empty;
    public PersonDto Person { get; set; } = new();
}

public class PreferredTeamRequestDto
{
    public string Team { get; set; } = string.Empty;
}

public class ReplaceOnCallRequestDto
{
    public string DutyId { get; set; } = string.Empty;
    public string ReplacementName { get; set; } = string.Empty;
}
