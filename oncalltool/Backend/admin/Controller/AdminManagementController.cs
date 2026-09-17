
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using oncalltool.Backend.Common.Data;
using oncalltool.Backend.Common.Models;

namespace oncalltool.Backend.Admin.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminManagementController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminManagementController(AppDbContext db)
    {
        _db = db;
    }

    // Temporary demo identity.
    // Replace with authenticated user claims before production.
    private async Task<bool> IsAdmin(string employeeId)
    {
        return await _db.Users.AnyAsync(x =>
            x.EmployeeId == employeeId &&
            x.Role == "Admin");
    }

    private IActionResult Denied() =>
        StatusCode(403, new { message = "Admin access required." });

    // =====================================================
    // GET ALL ADMIN DATA
    // =====================================================

    [HttpGet("state")]
    public async Task<IActionResult> GetState(
        [FromQuery] string adminEmployeeId)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var Teams = await _db.Teams
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,

                EmployeeCount = x.Users.Count(u =>
                    u.Role != "Admin"),

                ManagerId = x.Users
                    .Where(u => u.Role == "Manager")
                    .Select(u => (int?)u.Id)
                    .FirstOrDefault(),

                ManagerName = x.Users
                    .Where(u => u.Role == "Manager")
                    .Select(u => u.Name)
                    .FirstOrDefault()
            })
            .ToListAsync();

        var employees = await _db.Users
            .AsNoTracking()
            .Where(x => x.Role != "Admin")
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.EmployeeId,
                x.Name,
                x.Email,
                x.Phone,
                x.Role,
                x.TeamId,
                TeamName = x.Team != null
                    ? x.Team.Name
                    : ""
            })
            .ToListAsync();

        return Ok(new
        {
            Teams,
            employees
        });
    }

    // =====================================================
    // CREATE Team / TEAM
    // =====================================================

    [HttpPost("Teams")]
    public async Task<IActionResult> CreateTeam(
        [FromQuery] string adminEmployeeId,
        [FromBody] CreateTeamRequest request)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var name = request.Name?.Trim();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new
            {
                message = "Team name is required."
            });

        if (await _db.Teams.AnyAsync(x =>
                x.Name == name))
        {
            return BadRequest(new
            {
                message = "Team already exists."
            });
        }

        var Team = new Team
        {
            Name = name
        };

        _db.Teams.Add(Team);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            Team.Id,
            Team.Name
        });
    }

    // =====================================================
    // DELETE Team
    // Never delete Teams containing employees/schedules.
    // =====================================================

    [HttpDelete("Teams/{id:int}")]
    public async Task<IActionResult> DeleteTeam(
        int id,
        [FromQuery] string adminEmployeeId)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var Team = await _db.Teams
            .FindAsync(id);

        if (Team == null)
            return NotFound(new
            {
                message = "Team not found."
            });

        var hasUsers = await _db.Users
            .AnyAsync(x => x.TeamId == id);

        var hasSchedules = await _db.OnCallSchedules
            .AnyAsync(x => x.TeamId == id);

        if (hasUsers || hasSchedules)
        {
            return BadRequest(new
            {
                message =
                    "Move or remove all users and schedules before deleting this Team."
            });
        }

        _db.Teams.Remove(Team);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Team deleted."
        });
    }

    // =====================================================
    // CREATE EMPLOYEE
    // =====================================================

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee(
        [FromQuery] string adminEmployeeId,
        [FromBody] CreateEmployeeRequest request)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var employeeId = request.EmployeeId?.Trim();
        var name = request.Name?.Trim();

        if (string.IsNullOrWhiteSpace(employeeId) ||
            string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new
            {
                message = "Employee ID and name are required."
            });
        }

        var Team = await _db.Teams
            .FindAsync(request.TeamId);

        if (Team == null)
            return BadRequest(new
            {
                message = "Select a valid Team."
            });

        if (await _db.Users.AnyAsync(x =>
                x.EmployeeId == employeeId))
        {
            return BadRequest(new
            {
                message = "Employee ID already exists."
            });
        }

        if (await _db.Users.AnyAsync(x =>
                x.TeamId == request.TeamId &&
                x.Name == name))
        {
            return BadRequest(new
            {
                message = "An employee with this name already exists in the Team."
            });
        }

        var employee = new AppUser
        {
            EmployeeId = employeeId,
            Name = name,
            Email = request.Email?.Trim(),
            Phone = request.Phone?.Trim(),
            TeamId = request.TeamId,
            Role = "Employee",
            SchedulePrivilege = false
        };

        _db.Users.Add(employee);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            employee.Id,
            employee.Name,
            employee.EmployeeId
        });
    }

    // =====================================================
    // MOVE EMPLOYEE BETWEEN TeamS
    // =====================================================

    [HttpPut("employees/{id:int}/Team")]
    public async Task<IActionResult> MoveEmployee(
        int id,
        [FromQuery] string adminEmployeeId,
        [FromBody] MoveEmployeeRequest request)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var employee = await _db.Users.FindAsync(id);

        if (employee == null)
            return NotFound(new
            {
                message = "Employee not found."
            });

        if (employee.Role != "Employee")
            return BadRequest(new
            {
                message = "Only regular employees can be moved. Revoke manager access first."
            });

        if (!await _db.Teams.AnyAsync(x =>
                x.Id == request.TeamId))
        {
            return BadRequest(new
            {
                message = "Destination Team not found."
            });
        }

        if (employee.TeamId == request.TeamId)
            return Ok(new
            {
                message = "Employee is already in this Team."
            });

        var assigned = await _db.OnCallSchedules.AnyAsync(x =>
            x.PrimaryEmployeeId == id ||
            x.SecondaryEmployeeId == id);

        if (assigned)
            return BadRequest(new
            {
                message = "Employee has on-call assignments. Reassign them before moving the employee."
            });

        if (await _db.Users.AnyAsync(x =>
                x.TeamId == request.TeamId &&
                x.Name == employee.Name &&
                x.Id != id))
        {
            return BadRequest(new
            {
                message = "An employee with the same name already exists in the destination Team."
            });
        }

        employee.TeamId = request.TeamId;

        // Privileges belong to the original Team.
        employee.SchedulePrivilege = false;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Employee moved successfully."
        });
    }

    // =====================================================
    // DELETE EMPLOYEE
    // =====================================================

    [HttpDelete("employees/{id:int}")]
    public async Task<IActionResult> DeleteEmployee(
        int id,
        [FromQuery] string adminEmployeeId)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var employee = await _db.Users.FindAsync(id);

        if (employee == null)
            return NotFound(new
            {
                message = "Employee not found."
            });

        if (employee.Role != "Employee")
            return BadRequest(new
            {
                message = "Only regular employees can be removed. Revoke manager access first."
            });

        var assigned = await _db.OnCallSchedules.AnyAsync(x =>
            x.PrimaryEmployeeId == id ||
            x.SecondaryEmployeeId == id);

        if (assigned)
            return BadRequest(new
            {
                message = "Employee has on-call assignments. Reassign them before deletion."
            });

        _db.Users.Remove(employee);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Employee deleted."
        });
    }

    // =====================================================
    // ASSIGN / CHANGE Team MANAGER
    // Only an employee from this Team may become manager.
    // One manager per Team.
    // =====================================================

    [HttpPut("Teams/{TeamId:int}/manager/{employeeId:int}")]
    public async Task<IActionResult> AssignManager(
        int TeamId,
        int employeeId,
        [FromQuery] string adminEmployeeId)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var Team = await _db.Teams
            .FindAsync(TeamId);

        if (Team == null)
            return NotFound(new
            {
                message = "Team not found."
            });

        var employee = await _db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == employeeId &&
                x.TeamId == TeamId &&
                (x.Role == "Employee" || x.Role == "Manager"));

        if (employee == null)
            return BadRequest(new
            {
                message = "Select an employee belonging to this Team."
            });

        var currentManagers = await _db.Users
            .Where(x =>
                x.TeamId == TeamId &&
                x.Role == "Manager")
            .ToListAsync();

        foreach (var manager in currentManagers)
        {
            if (manager.Id != employeeId)
            {
                manager.Role = "Employee";
                manager.SchedulePrivilege = false;
            }
        }

        employee.Role = "Manager";
        employee.SchedulePrivilege = false;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = $"{employee.Name} is now the Team manager."
        });
    }

    // =====================================================
    // REVOKE MANAGER
    // =====================================================

    [HttpDelete("Teams/{TeamId:int}/manager/{employeeId:int}")]
    public async Task<IActionResult> RevokeManager(
        int TeamId,
        int employeeId,
        [FromQuery] string adminEmployeeId)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var manager = await _db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == employeeId &&
                x.TeamId == TeamId &&
                x.Role == "Manager");

        if (manager == null)
            return NotFound(new
            {
                message = "Manager not found in this Team."
            });

        manager.Role = "Employee";
        manager.SchedulePrivilege = false;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Manager access revoked."
        });
    }
}

// =========================================================
// REQUEST MODELS
// =========================================================

public class CreateTeamRequest
{
    public string Name { get; set; } = "";
}

public class CreateEmployeeRequest
{
    public string EmployeeId { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int TeamId { get; set; }
}

public class MoveEmployeeRequest
{
    public int TeamId { get; set; }
}