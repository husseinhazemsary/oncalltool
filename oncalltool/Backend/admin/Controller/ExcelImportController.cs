using Microsoft.AspNetCore.Mvc;
using oncalltool.Backend.Common.Excel;

namespace oncalltool.Backend.Admin.Controllers;

[ApiController]
[Route("api/admin/excel")]
public class ExcelImportController : ControllerBase
{
    private readonly ExcelImportService _importer;


    public ExcelImportController(
        ExcelImportService importer)
    {
        _importer = importer;
    }


    [HttpPost("import")]
    public async Task<IActionResult> Import(
        IFormFile file)
    {
        if (
            file == null
            ||
            file.Length == 0
        )
        {
            return BadRequest(
                new
                {
                    message =
                        "Please select an Excel file."
                });
        }


        if (
            Path.GetExtension(file.FileName)
                .ToLowerInvariant()
            != ".xlsx"
        )
        {
            return BadRequest(
                new
                {
                    message =
                        "Only .xlsx files are supported."
                });
        }


        try
        {
            await using var stream =
                file.OpenReadStream();


            await _importer.ImportAsync(
                stream);


            return Ok(
                new
                {
                    success = true,

                    message =
                        "On-call Excel data imported successfully."
                });
        }
        catch (Exception ex)
        {
            return BadRequest(
                new
                {
                    success = false,

                    message =
                        ex.Message
                });
        }
    }
}