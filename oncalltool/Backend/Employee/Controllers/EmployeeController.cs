using Microsoft.AspNetCore.Mvc;
using oncalltool.Backend.Employee.DTOs;
using oncalltool.Backend.Employee.Services;

namespace oncalltool.Backend.Employee.Controllers;

[ApiController]
[Route("api/employee")]
[ResponseCache(Location = ResponseCacheLocation.None, NoStore = true)]
public class EmployeeController : ControllerBase
{
    private readonly EmployeeService _employeeService;

    public EmployeeController(EmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    [HttpGet("dashboard")]
    public IActionResult GetDashboard([FromQuery] string employeeId)
    {
        return Execute(() => _employeeService.GetDashboard(employeeId));
    }

    [HttpPost("preferred-teams")]
    public IActionResult AddPreferredTeam(
        [FromQuery] string employeeId,
        [FromBody] PreferredTeamRequestDto request)
    {
        return Execute(() => _employeeService.AddPreferredTeam(employeeId, request.Team));
    }

    [HttpDelete("preferred-teams/{team}")]
    public IActionResult RemovePreferredTeam(
        string team,
        [FromQuery] string employeeId)
    {
        return Execute(() => _employeeService.RemovePreferredTeam(employeeId, team));
    }

    [HttpPost("replacements")]
    public IActionResult ReplaceOnCall(
        [FromQuery] string employeeId,
        [FromBody] ReplaceOnCallRequestDto request)
    {
        return Execute(() => _employeeService.ReplaceOnCall(employeeId, request));
    }

    private IActionResult Execute(Func<EmployeeDashboardDto> action)
    {
        try
        {
            return Ok(action());
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
