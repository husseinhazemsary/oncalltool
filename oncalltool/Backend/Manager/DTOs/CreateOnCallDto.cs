namespace oncalltool.Backend.Manager.DTOs;

public class CreateOnCallDto
{
    public DateTime Date { get; set; }

    public int PrimaryEmployeeId { get; set; }

    public int SecondaryEmployeeId { get; set; }
}