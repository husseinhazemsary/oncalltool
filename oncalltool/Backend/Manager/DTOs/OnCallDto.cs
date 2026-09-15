namespace oncalltool.Backend.Manager.DTOs;

public class OnCallDto
{
    public int Id { get; set; }

    public DateTime Date { get; set; }

    public int? PrimaryEmployeeId { get; set; }

    public string PrimaryName { get; set; } = "Unassigned";

    public int? SecondaryEmployeeId { get; set; }

    public string SecondaryName { get; set; } = "Unassigned";
}