
console.log("ADMIN JS LOADED");

// Temporary demo identity.
const adminEmployeeId = "ADM001";

let departments = [];
let employees = [];

const $ = selector => document.querySelector(selector);

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showMessage(message, error = false) {
    const element = $("#message");

    element.textContent = message;
    element.classList.toggle("error", error);
    element.hidden = false;
}

function adminUrl(path) {
    const separator = path.includes("?") ? "&" : "?";

    return `/api/admin/${path}${separator}adminEmployeeId=${encodeURIComponent(adminEmployeeId)}`;
}

async function api(path, options = {}) {
    const response = await fetch(adminUrl(path), {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message || `Request failed (${response.status})`
        );
    }

    return data;
}

// =====================================================
// LOAD
// =====================================================

async function loadAdmin() {
    try {
        const data = await api("state");

        departments = data.departments || [];
        employees = data.employees || [];

        renderAll();
    }
    catch (error) {
        showMessage(error.message, true);
    }
}

// =====================================================
// NAVIGATION
// =====================================================

document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
        const view = button.dataset.view;

        document.querySelectorAll(".view").forEach(section => {
            section.hidden = section.id !== view;
        });

        document.querySelectorAll("[data-view]").forEach(item => {
            item.classList.toggle("active", item === button);
        });
    });
});

// =====================================================
// OVERVIEW
// =====================================================

function renderOverview() {
    $("#departmentCount").textContent = departments.length;

    $("#employeeCount").textContent = employees.length;

    $("#managerCount").textContent =
        employees.filter(x => x.role === "Manager").length;

    $("#unassignedCount").textContent =
        departments.filter(x => !x.managerId).length;

    $("#overviewBody").innerHTML = departments.length
        ? departments.map(department => `
            <tr>
                <td><strong>${escapeHtml(department.name)}</strong></td>
                <td>${department.employeeCount}</td>
                <td>
                    ${department.managerName
                ? escapeHtml(department.managerName)
                : '<span class="unassigned">Unassigned</span>'}
                </td>
            </tr>
        `).join("")
        : '<tr><td colspan="3">No departments yet.</td></tr>';
}

// =====================================================
// DEPARTMENTS
// =====================================================

function renderDepartments() {
    $("#departmentsBody").innerHTML = departments.length
        ? departments.map(department => `
            <tr>
                <td><strong>${escapeHtml(department.name)}</strong></td>
                <td>${department.employeeCount}</td>
                <td>
                    ${department.managerName
                ? escapeHtml(department.managerName)
                : '<span class="unassigned">Unassigned</span>'}
                </td>
                <td>
                    <button class="action danger"
                            data-action="delete-department"
                            data-id="${department.id}">
                        Remove
                    </button>
                </td>
            </tr>
        `).join("")
        : '<tr><td colspan="4">No departments yet.</td></tr>';
}

$("#departmentForm").addEventListener("submit", async event => {
    event.preventDefault();

    const name = $("#departmentName").value.trim();

    if (!name) return;

    try {
        await api("departments", {
            method: "POST",
            body: JSON.stringify({ name })
        });

        event.target.reset();

        await loadAdmin();

        showMessage("Department created successfully.");
    }
    catch (error) {
        showMessage(error.message, true);
    }
});

// =====================================================
// EMPLOYEES
// =====================================================

function departmentOptions(selectedId = null) {
    return departments.map(department => `
        <option value="${department.id}"
                ${department.id === selectedId ? "selected" : ""}>
            ${escapeHtml(department.name)}
        </option>
    `).join("");
}

function renderEmployees() {
    $("#newEmployeeDepartment").innerHTML =
        '<option value="">Select department</option>' +
        departmentOptions();

    $("#employeesBody").innerHTML = employees.length
        ? employees.map(employee => `
            <tr>

                <td>
                    <strong>${escapeHtml(employee.name)}</strong>
                </td>

                <td>${escapeHtml(employee.employeeId)}</td>

                <td>
                    <span class="badge ${employee.role === "Manager" ? "" : "employee"}">
                        ${escapeHtml(employee.role)}
                    </span>
                </td>

                <td>
                    <select data-move="${employee.id}"
                            ${employee.role === "Manager" ? "disabled" : ""}>
                        ${departmentOptions(employee.departmentId)}
                    </select>
                </td>

                <td>
                    <button class="action danger"
                            data-action="delete-employee"
                            data-id="${employee.id}"
                            ${employee.role === "Manager" ? "disabled" : ""}>
                        Remove
                    </button>
                </td>

            </tr>
        `).join("")
        : '<tr><td colspan="5">No employees yet.</td></tr>';
}

$("#employeeForm").addEventListener("submit", async event => {
    event.preventDefault();

    const payload = {
        employeeId: $("#newEmployeeId").value.trim(),
        name: $("#newEmployeeName").value.trim(),
        email: $("#newEmployeeEmail").value.trim(),
        phone: $("#newEmployeePhone").value.trim(),
        departmentId: Number($("#newEmployeeDepartment").value)
    };

    if (!payload.departmentId) {
        showMessage("Please select a department.", true);
        return;
    }

    try {
        await api("employees", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        event.target.reset();

        await loadAdmin();

        showMessage("Employee created successfully.");
    }
    catch (error) {
        showMessage(error.message, true);
    }
});

// =====================================================
// ROLES
// =====================================================

function renderRoles() {
    $("#rolesBody").innerHTML = departments.length
        ? departments.map(department => {
            const candidates = employees.filter(employee =>
                employee.departmentId === department.id
            );

            return `
                <div class="role-row">

                    <div>
                        <strong>${escapeHtml(department.name)}</strong>
                        <p style="color:#8790a5;font-size:12px">
                            Current: ${escapeHtml(department.managerName || "Unassigned")}
                        </p>
                    </div>

                    <select id="manager-${department.id}">
                        <option value="">Select employee</option>

                        ${candidates.map(employee => `
                            <option value="${employee.id}"
                                    ${employee.id === department.managerId ? "selected" : ""}>
                                ${escapeHtml(employee.name)}
                            </option>
                        `).join("")}
                    </select>

                    <button class="btn-dark"
                            data-action="assign-manager"
                            data-id="${department.id}">
                        Assign
                    </button>

                    <button class="action danger"
                            data-action="revoke-manager"
                            data-id="${department.id}"
                            ${!department.managerId ? "disabled" : ""}>
                        Revoke
                    </button>

                </div>
            `;
        }).join("")
        : "<p>No departments created yet.</p>";
}

// =====================================================
// ACTIONS
// =====================================================

document.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = Number(button.dataset.id);

    try {
        if (action === "delete-department") {
            if (!confirm("Remove this department?")) return;

            await api(`departments/${id}`, {
                method: "DELETE"
            });
        }

        else if (action === "delete-employee") {
            if (!confirm("Remove this employee?")) return;

            await api(`employees/${id}`, {
                method: "DELETE"
            });
        }

        else if (action === "assign-manager") {
            const employeeId =
                Number($(`#manager-${id}`).value);

            if (!employeeId) {
                showMessage("Select an employee first.", true);
                return;
            }

            await api(`departments/${id}/manager/${employeeId}`, {
                method: "PUT"
            });
        }

        else if (action === "revoke-manager") {
            const department = departments.find(x => x.id === id);

            if (!department?.managerId) return;

            if (!confirm("Revoke this manager's access?")) return;

            await api(
                `departments/${id}/manager/${department.managerId}`,
                { method: "DELETE" }
            );
        }

        await loadAdmin();

        showMessage("Changes saved successfully.");
    }
    catch (error) {
        showMessage(error.message, true);
    }
});

// Move employee using the department dropdown.
document.addEventListener("change", async event => {
    const select = event.target.closest("[data-move]");

    if (!select) return;

    const employeeId = Number(select.dataset.move);
    const departmentId = Number(select.value);

    try {
        await api(`employees/${employeeId}/department`, {
            method: "PUT",
            body: JSON.stringify({ departmentId })
        });

        await loadAdmin();

        showMessage("Employee department updated.");
    }
    catch (error) {
        await loadAdmin();
        showMessage(error.message, true);
    }
});

// =====================================================
// RENDER ALL
// =====================================================

function renderAll() {
    renderOverview();
    renderDepartments();
    renderEmployees();
    renderRoles();
}

loadAdmin();