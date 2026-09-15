using Microsoft.AspNetCore.Mvc;
using oncalltool.Backend.Manager.DTOs;
using oncalltool.Backend.Manager.Services;

namespace oncalltool.Backend.Manager.Controllers;

[ApiController]
[Route("api/manager")]
public class ManagerController : ControllerBase
{
    private readonly ManagerService _managerService;


    public ManagerController(
        ManagerService managerService)
    {
        _managerService =
            managerService;
    }


    // =========================================================
    // DASHBOARD
    //
    // GET:
    // /api/manager/dashboard?managerEmployeeId=EMP1001
    // =========================================================

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] string managerEmployeeId)
    {
        try
        {
            var result =
                await _managerService
                    .GetDashboardAsync(
                        managerEmployeeId);


            return Ok(
                result);
        }

        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        ex.Message
                });
        }
    }


    // =========================================================
    // MY TEAM
    //
    // GET:
    // /api/manager/team?managerEmployeeId=EMP1001
    // =========================================================

    [HttpGet("team")]
    public async Task<IActionResult> GetTeam(
        [FromQuery] string managerEmployeeId)
    {
        try
        {
            var result =
                await _managerService
                    .GetTeamAsync(
                        managerEmployeeId);


            return Ok(
                result);
        }

        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        ex.Message
                });
        }
    }


    // =========================================================
    // GET ON-CALL SCHEDULES
    //
    // GET:
    // /api/manager/oncalls?managerEmployeeId=EMP1001
    // =========================================================

    [HttpGet("oncalls")]
    public async Task<IActionResult> GetOnCalls(
        [FromQuery] string managerEmployeeId)
    {
        try
        {
            var result =
                await _managerService
                    .GetOnCallsAsync(
                        managerEmployeeId);


            return Ok(
                result);
        }

        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        ex.Message
                });
        }
    }


    // =========================================================
    // CREATE ON-CALL
    //
    // POST:
    // /api/manager/oncalls?managerEmployeeId=EMP1001
    // =========================================================

    [HttpPost("oncalls")]
    public async Task<IActionResult> CreateOnCall(
        [FromQuery] string managerEmployeeId,
        [FromBody] CreateOnCallDto dto)
    {
        try
        {
            var result =
                await _managerService
                    .CreateOnCallAsync(
                        managerEmployeeId,
                        dto);


            return Ok(
                result);
        }

        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (ArgumentException ex)
        {
            return BadRequest(
                new
                {
                    message =
                        ex.Message
                });
        }
    }


    // =========================================================
    // UPDATE ON-CALL
    //
    // PUT:
    // /api/manager/oncalls/5?managerEmployeeId=EMP1001
    // =========================================================

    [HttpPut("oncalls/{id:int}")]
    public async Task<IActionResult> UpdateOnCall(
        int id,
        [FromQuery] string managerEmployeeId,
        [FromBody] CreateOnCallDto dto)
    {
        try
        {
            var result =
                await _managerService
                    .UpdateOnCallAsync(
                        managerEmployeeId,
                        id,
                        dto);


            return Ok(
                result);
        }

        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (ArgumentException ex)
        {
            return BadRequest(
                new
                {
                    message =
                        ex.Message
                });
        }
    }


    // =========================================================
    // DELETE ON-CALL
    //
    // DELETE:
    // /api/manager/oncalls/5?managerEmployeeId=EMP1001
    // =========================================================

    [HttpDelete("oncalls/{id:int}")]
    public async Task<IActionResult> DeleteOnCall(
        int id,
        [FromQuery] string managerEmployeeId)
    {
        try
        {
            await _managerService
                .DeleteOnCallAsync(
                    managerEmployeeId,
                    id);


            return Ok(
                new
                {
                    message =
                        "On-call schedule deleted successfully."
                });
        }

        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        ex.Message
                });
        }
    }


    // =========================================================
    // UPDATE SCHEDULE PRIVILEGE
    //
    // Only Manager can grant/remove this permission.
    //
    // PUT:
    // /api/manager/team/4/schedule-privilege
    // ?managerEmployeeId=EMP1001
    // =========================================================

    [HttpPut(
        "team/{employeeId:int}/schedule-privilege")]
    public async Task<IActionResult>
        UpdateSchedulePrivilege(
            int employeeId,
            [FromQuery] string managerEmployeeId,
            [FromBody] UpdatePrivilegeDto dto)
    {
        try
        {
            await _managerService
                .UpdateSchedulePrivilegeAsync(
                    managerEmployeeId,
                    employeeId,
                    dto.Allowed);


            return Ok(
                new
                {
                    message =
                        "Schedule privilege updated successfully."
                });
        }

        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (ArgumentException ex)
        {
            return BadRequest(
                new
                {
                    message =
                        ex.Message
                });
        }
    }
    // =========================================================
    // IMPORT SCHEDULE
    // CSV OR XLSX
    // =========================================================

    [HttpPost("oncalls/import-schedule")]
    public async Task<IActionResult> ImportSchedule(
        [FromQuery] string managerEmployeeId,
        IFormFile file,
        [FromServices]
    ScheduleImportService importService)
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
                        "Please select a schedule file."
                });
        }


        var extension =
            Path.GetExtension(
                file.FileName)
                .ToLowerInvariant();


        if (
            extension != ".csv"
            &&
            extension != ".xlsx"
        )
        {
            return BadRequest(
                new
                {
                    message =
                        "Only CSV and Excel (.xlsx) files are supported."
                });
        }


        try
        {
            await using var stream =
                file.OpenReadStream();


            var result =
                await importService.ImportAsync(
                    managerEmployeeId,
                    stream,
                    extension);


            if (!result.Success)
            {
                return BadRequest(
                    result);
            }


            return Ok(
                result);
        }

        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        ex.Message
                });
        }

        catch (ArgumentException ex)
        {
            return BadRequest(
                new
                {
                    message =
                        ex.Message
                });
        }
    }
}