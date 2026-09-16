using oncalltool.Backend.Employee.DTOs;

namespace oncalltool.Backend.Employee.Services;

public class EmployeeService
{
    private const string DemoEmployeeId = "EMP001";
    private readonly object _sync = new();

    private readonly List<TeamCoverageDto> _contacts;
    private readonly List<TeamOptionDto> _allTeams;
    private readonly List<PersonDto> _weekPeople;
    private readonly List<WeekDayDto> _weekDays;
    private readonly List<FutureDutyDto> _futureDuties;
    private readonly Dictionary<string, PersonDto> _replacementEmployees;
    private readonly Dictionary<string, PersonDto> _scheduleOverrides = new();
    private readonly List<string> _preferredTeams;

    public EmployeeService()
    {
        _contacts =
        [
            Coverage("ERP Applications", "Enterprise Systems", Ahmed(), Mohamed()),
            Coverage("Integration", "Digital Platforms", OmarHassan(), Sara()),
            Coverage("Database", "Infrastructure", Mahmoud(), Karim()),
            Coverage("Infrastructure", "Technology Operations", Mostafa(), OmarKhalil()),
            Coverage("Network", "Technology Operations", Sara(), Ahmed()),
            Coverage("CRM", "Customer Platforms", Mohamed(), Sara()),
            Coverage("Billing", "Revenue Management", Karim(), OmarKhalil()),
            Coverage("Revenue Assurance", "Revenue Management", Ahmed(), Mahmoud()),
            Coverage("Fraud Management", "Enterprise Systems", Mostafa(), Mohamed()),
            Coverage("Security Operations", "Cyber Security", OmarKhalil(), Karim()),
            Coverage("Data Warehouse", "Data & Analytics", Sara(), Ahmed()),
            Coverage("Data Analytics", "Data & Analytics", Mahmoud(), Mostafa()),
            Coverage("Data Integration", "Data & Analytics", Mohamed(), OmarKhalil())
        ];

        _preferredTeams = _contacts.Take(5).Select(x => x.Team).ToList();

        _allTeams = _contacts
            .Select(x => new TeamOptionDto { Name = x.Team, Area = x.Area })
            .ToList();

        _weekPeople = [Ahmed(), Mohamed(), Sara(), OmarKhalil(), Karim()];

        _weekDays =
        [
            new() { Date = "2026-09-14", Label = "Mon 14" },
            new() { Date = "2026-09-15", Label = "Tue 15" },
            new() { Date = "2026-09-16", Label = "Wed 16" },
            new() { Date = "2026-09-17", Label = "Thu 17" },
            new() { Date = "2026-09-18", Label = "Fri 18" },
            new() { Date = "2026-09-19", Label = "Sat 19" },
            new() { Date = "2026-09-20", Label = "Sun 20" }
        ];

        _futureDuties =
        [
            new() { Id = "duty-1", Date = "2026-09-14", Team = "ERP Applications", Role = "Primary" },
            new() { Id = "duty-2", Date = "2026-09-18", Team = "ERP Applications", Role = "Secondary" },
            new() { Id = "duty-3", Date = "2026-09-25", Team = "ERP Applications", Role = "Primary" },
            new() { Id = "duty-4", Date = "2026-10-05", Team = "ERP Applications", Role = "Secondary" },
            new() { Id = "duty-5", Date = "2026-10-12", Team = "ERP Applications", Role = "Primary" }
        ];

        _replacementEmployees = new Dictionary<string, PersonDto>
        {
            ["Mohamed Hassan"] = Mohamed(),
            ["Sara Ibrahim"] = Sara(),
            ["Omar Khalil"] = OmarKhalil()
        };
    }

    public EmployeeDashboardDto GetDashboard(string employeeId)
    {
        ValidateEmployee(employeeId);

        lock (_sync)
        {
            return new EmployeeDashboardDto
            {
                Employee = new EmployeeProfileDto
                {
                    EmployeeId = DemoEmployeeId,
                    Name = "Ahmed Mohamed",
                    Team = "Enterprise Solutions",
                    Initials = "AM"
                },
                Contacts = _contacts.Select(Clone).ToList(),
                PreferredTeams = [.. _preferredTeams],
                AllTeams = _allTeams.Select(x => new TeamOptionDto { Name = x.Name, Area = x.Area }).ToList(),
                WeekPeople = _weekPeople.Select(Clone).ToList(),
                WeekDays = _weekDays.Select(x => new WeekDayDto { Date = x.Date, Label = x.Label }).ToList(),
                FutureDuties = _futureDuties.Select(x => new FutureDutyDto
                {
                    Id = x.Id,
                    Date = x.Date,
                    Team = x.Team,
                    Role = x.Role
                }).ToList(),
                ReplacementEmployees = _replacementEmployees.ToDictionary(x => x.Key, x => Clone(x.Value)),
                ScheduleOverrides = _scheduleOverrides.Select(x => new ScheduleOverrideDto
                {
                    Key = x.Key,
                    Person = Clone(x.Value)
                }).ToList()
            };
        }
    }

    public EmployeeDashboardDto AddPreferredTeam(string employeeId, string team)
    {
        ValidateEmployee(employeeId);

        lock (_sync)
        {
            if (!_allTeams.Any(x => x.Name.Equals(team, StringComparison.OrdinalIgnoreCase)))
                throw new KeyNotFoundException("Team was not found.");

            var officialName = _allTeams.First(x => x.Name.Equals(team, StringComparison.OrdinalIgnoreCase)).Name;
            if (!_preferredTeams.Contains(officialName)) _preferredTeams.Add(officialName);
        }

        return GetDashboard(employeeId);
    }

    public EmployeeDashboardDto RemovePreferredTeam(string employeeId, string team)
    {
        ValidateEmployee(employeeId);

        lock (_sync)
        {
            _preferredTeams.RemoveAll(x => x.Equals(team, StringComparison.OrdinalIgnoreCase));
        }

        return GetDashboard(employeeId);
    }

    public EmployeeDashboardDto ReplaceOnCall(
        string employeeId,
        ReplaceOnCallRequestDto request)
    {
        ValidateEmployee(employeeId);

        lock (_sync)
        {
            var duty = _futureDuties.FirstOrDefault(x => x.Id == request.DutyId)
                ?? throw new KeyNotFoundException("Duty was not found.");

            if (!_replacementEmployees.TryGetValue(request.ReplacementName, out var replacement))
                throw new KeyNotFoundException("Replacement employee was not found.");

            _scheduleOverrides[$"{duty.Team}|{duty.Date}|{duty.Role}"] = Clone(replacement);

            if (duty.Date == "2026-09-14")
            {
                var coverage = _contacts.First(x => x.Team == duty.Team);
                if (duty.Role == "Primary") coverage.Primary = Clone(replacement);
                if (duty.Role == "Secondary") coverage.Secondary = Clone(replacement);
            }
        }

        return GetDashboard(employeeId);
    }

    private static void ValidateEmployee(string employeeId)
    {
        if (!employeeId.Equals(DemoEmployeeId, StringComparison.OrdinalIgnoreCase))
            throw new KeyNotFoundException("Mock employee was not found. Use EMP001.");
    }

    private static TeamCoverageDto Coverage(string team, string area, PersonDto primary, PersonDto secondary) =>
        new() { Team = team, Area = area, Primary = primary, Secondary = secondary };

    private static TeamCoverageDto Clone(TeamCoverageDto value) => new()
    {
        Team = value.Team,
        Area = value.Area,
        Primary = Clone(value.Primary),
        Secondary = Clone(value.Secondary)
    };

    private static PersonDto Clone(PersonDto value) => new()
    {
        Name = value.Name,
        Phone = value.Phone,
        Email = value.Email,
        Initials = value.Initials
    };

    private static PersonDto Ahmed() => Person("Ahmed Mohamed", "+20 12 1000 4521", "ahmed.mohamed@company.com", "AM");
    private static PersonDto Mohamed() => Person("Mohamed Hassan", "+20 12 1000 4522", "mohamed.hassan@company.com", "MH");
    private static PersonDto Sara() => Person("Sara Ibrahim", "+20 12 4431 7655", "sara.ibrahim@company.com", "SI");
    private static PersonDto OmarKhalil() => Person("Omar Khalil", "+20 12 1000 4524", "omar.khalil@company.com", "OK");
    private static PersonDto Karim() => Person("Karim Ali", "+20 12 1000 4525", "karim.ali@company.com", "KA");
    private static PersonDto OmarHassan() => Person("Omar Hassan", "+20 12 1834 0192", "omar.hassan@company.com", "OH");
    private static PersonDto Mahmoud() => Person("Mahmoud Ali", "+20 10 7723 8841", "mahmoud.ali@company.com", "MA");
    private static PersonDto Mostafa() => Person("Mostafa Ahmed", "+20 11 0298 3317", "mostafa.ahmed@company.com", "MA");

    private static PersonDto Person(string name, string phone, string email, string initials) =>
        new() { Name = name, Phone = phone, Email = email, Initials = initials };
}
