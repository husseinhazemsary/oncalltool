
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

        var departments = await _db.Departments
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
                x.DepartmentId,
                DepartmentName = x.Department != null
                    ? x.Department.Name
                    : ""
            })
            .ToListAsync();

        return Ok(new
        {
            departments,
            employees
        });
    }

    // =====================================================
    // CREATE DEPARTMENT / TEAM
    // =====================================================

    [HttpPost("departments")]
    public async Task<IActionResult> CreateDepartment(
        [FromQuery] string adminEmployeeId,
        [FromBody] CreateDepartmentRequest request)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var name = request.Name?.Trim();

        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new
            {
                message = "Department name is required."
            });

        if (await _db.Departments.AnyAsync(x =>
                x.Name == name))
        {
            return BadRequest(new
            {
                message = "Department already exists."
            });
        }

        var department = new Department
        {
            Name = name
        };

        _db.Departments.Add(department);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            department.Id,
            department.Name
        });
    }

    // =====================================================
    // DELETE DEPARTMENT
    // Never delete departments containing employees/schedules.
    // =====================================================

    [HttpDelete("departments/{id:int}")]
    public async Task<IActionResult> DeleteDepartment(
        int id,
        [FromQuery] string adminEmployeeId)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var department = await _db.Departments
            .FindAsync(id);

        if (department == null)
            return NotFound(new
            {
                message = "Department not found."
            });

        var hasUsers = await _db.Users
            .AnyAsync(x => x.DepartmentId == id);

        var hasSchedules = await _db.OnCallSchedules
            .AnyAsync(x => x.DepartmentId == id);

        if (hasUsers || hasSchedules)
        {
            return BadRequest(new
            {
                message =
                    "Move or remove all users and schedules before deleting this department."
            });
        }

        _db.Departments.Remove(department);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Department deleted."
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

        var department = await _db.Departments
            .FindAsync(request.DepartmentId);

        if (department == null)
            return BadRequest(new
            {
                message = "Select a valid department."
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
                x.DepartmentId == request.DepartmentId &&
                x.Name == name))
        {
            return BadRequest(new
            {
                message = "An employee with this name already exists in the department."
            });
        }

        var employee = new AppUser
        {
            EmployeeId = employeeId,
            Name = name,
            Email = request.Email?.Trim(),
            Phone = request.Phone?.Trim(),
            DepartmentId = request.DepartmentId,
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
    // MOVE EMPLOYEE BETWEEN DEPARTMENTS
    // =====================================================

    [HttpPut("employees/{id:int}/department")]
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

        if (!await _db.Departments.AnyAsync(x =>
                x.Id == request.DepartmentId))
        {
            return BadRequest(new
            {
                message = "Destination department not found."
            });
        }

        if (employee.DepartmentId == request.DepartmentId)
            return Ok(new
            {
                message = "Employee is already in this department."
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
                x.DepartmentId == request.DepartmentId &&
                x.Name == employee.Name &&
                x.Id != id))
        {
            return BadRequest(new
            {
                message = "An employee with the same name already exists in the destination department."
            });
        }

        employee.DepartmentId = request.DepartmentId;

        // Privileges belong to the original department.
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
    // ASSIGN / CHANGE DEPARTMENT MANAGER
    // Only an employee from this department may become manager.
    // One manager per department.
    // =====================================================

    [HttpPut("departments/{departmentId:int}/manager/{employeeId:int}")]
    public async Task<IActionResult> AssignManager(
        int departmentId,
        int employeeId,
        [FromQuery] string adminEmployeeId)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var department = await _db.Departments
            .FindAsync(departmentId);

        if (department == null)
            return NotFound(new
            {
                message = "Department not found."
            });

        var employee = await _db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == employeeId &&
                x.DepartmentId == departmentId &&
                (x.Role == "Employee" || x.Role == "Manager"));

        if (employee == null)
            return BadRequest(new
            {
                message = "Select an employee belonging to this department."
            });

        var currentManagers = await _db.Users
            .Where(x =>
                x.DepartmentId == departmentId &&
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
            message = $"{employee.Name} is now the department manager."
        });
    }

    // =====================================================
    // REVOKE MANAGER
    // =====================================================

    [HttpDelete("departments/{departmentId:int}/manager/{employeeId:int}")]
    public async Task<IActionResult> RevokeManager(
        int departmentId,
        int employeeId,
        [FromQuery] string adminEmployeeId)
    {
        if (!await IsAdmin(adminEmployeeId))
            return Denied();

        var manager = await _db.Users
            .FirstOrDefaultAsync(x =>
                x.Id == employeeId &&
                x.DepartmentId == departmentId &&
                x.Role == "Manager");

        if (manager == null)
            return NotFound(new
            {
                message = "Manager not found in this department."
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

public class CreateDepartmentRequest
{
    public string Name { get; set; } = "";
}

public class CreateEmployeeRequest
{
    public string EmployeeId { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int DepartmentId { get; set; }
}

public class MoveEmployeeRequest
{
    public int DepartmentId { get; set; }
}