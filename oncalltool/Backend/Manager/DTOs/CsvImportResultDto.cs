namespace oncalltool.Backend.Manager.DTOs;

public class CsvImportResultDto
{
    public bool Success { get; set; }

    public int TotalRows { get; set; }

    public int ImportedRows { get; set; }

    public int FailedRows { get; set; }

    public List<string> Errors { get; set; } = new();
}