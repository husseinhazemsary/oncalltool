
console.log("ADMIN JS LOADED");

// Temporary demo identity.
const adminEmployeeId = "ADM001";

let Teams = [];
let employees = [];

// Client-side employee filters (no API or database changes).
let employeeSearchQuery = "";
let selectedEmployeeTeam = "";

let selectedRoleTeam = "";
let roleSearchQuery = "";
let teamSetupId = null;

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

        Teams = data.teams || [];
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
    $("#TeamCount").textContent = Teams.length;

    $("#employeeCount").textContent = employees.length;

    $("#managerCount").textContent =
        employees.filter(x => x.role === "Manager").length;

    $("#unassignedCount").textContent =
        Teams.filter(x => !x.managerId).length;

    $("#overviewBody").innerHTML = Teams.length
        ? Teams.map(Team => `
            <tr>
                <td><strong>${escapeHtml(Team.name)}</strong></td>
                <td>${Team.employeeCount}</td>
                <td>
                    ${Team.managerName
                ? escapeHtml(Team.managerName)
                : '<span class="unassigned">Unassigned</span>'}
                </td>
            </tr>
        `).join("")
        : '<tr><td colspan="3">No Teams yet.</td></tr>';
}

// =====================================================
// TeamS
// =====================================================

function renderTeams() {
    $("#TeamsBody").innerHTML = Teams.length
        ? Teams.map(Team => `
            <tr>
                <td><strong>${escapeHtml(Team.name)}</strong></td>
                <td>${Team.employeeCount}</td>
                <td>
                    ${Team.managerName
                ? escapeHtml(Team.managerName)
                : '<span class="unassigned">Unassigned</span>'}
                </td>
                <td>
                    <button class="action danger"
                            data-action="delete-Team"
                            data-id="${Team.id}">
                        Remove
                    </button>
                </td>
            </tr>
        `).join("")
        : '<tr><td colspan="4">No Teams yet.</td></tr>';
}

$("#TeamForm").addEventListener("submit", async event => {
    event.preventDefault();

    const name = $("#TeamName").value.trim();
    if (!name) return;

    // The second submit button starts an employee-entry workflow.
    const addEmployees = event.submitter?.id === "createTeamAndAddBtn";

    try {
        const created = await api("teams", {
            method: "POST",
            body: JSON.stringify({ name })
        });

        event.target.reset();
        await loadAdmin();

        if (!addEmployees) {
            teamSetupId = null;
            showMessage("Team created successfully.");
            return;
        }

        // Prefer an ID returned by the API; fall back to the newly refreshed team list.
        const newTeam = Teams.find(team => team.id === created?.id) ||
            Teams.find(team => team.name.toLocaleLowerCase() === name.toLocaleLowerCase());

        if (!newTeam) {
            showMessage("Team created. Open Employees to add members.");
            return;
        }

        teamSetupId = newTeam.id;
        selectedEmployeeTeam = String(newTeam.id);
        employeeSearchQuery = "";

        document.querySelector('[data-view="employees"]').click();
        renderEmployees();
        $("#newEmployeeTeam").value = String(newTeam.id);
        $("#newEmployeeId").focus();
        showMessage(`Team "${newTeam.name}" created. Add its employees below.`);
    }
    catch (error) {
        showMessage(error.message, true);
    }
});

// =====================================================
// EMPLOYEES
// =====================================================

function TeamOptions(selectedId = null) {
    return Teams.map(Team => `
        <option value="${Team.id}"
                ${Team.id === selectedId ? "selected" : ""}>
            ${escapeHtml(Team.name)}
        </option>
    `).join("");
}

function renderEmployees() {
    // Keep the existing create-employee form behavior.
    $("#newEmployeeTeam").innerHTML =
        '<option value="">Select Team</option>' +
        TeamOptions();

    // Rebuild team options from the actual API data, preserving the filter.
    const teamFilter = $("#employeeTeamFilter");
    const previousTeam = selectedEmployeeTeam;

    teamFilter.innerHTML =
        '<option value="">All teams</option>' +
        Teams.map(team => `
            <option value="${team.id}">
                ${escapeHtml(team.name)}
            </option>
        `).join("");

    selectedEmployeeTeam = Teams.some(team =>
        String(team.id) === previousTeam
    ) ? previousTeam : "";

    teamFilter.value = selectedEmployeeTeam;
    $("#employeeSearch").value = employeeSearchQuery;

    renderEmployeeRows();
    hideEmployeeSuggestions();
}

function renderEmployeeRows() {
    const search = employeeSearchQuery.trim().toLocaleLowerCase();


    const filtered = employees.filter(employee => {
        const teamName = employee.teamName ||
            Teams.find(team => team.id === employee.teamId)?.name || "";

        const matchesTeam = !selectedEmployeeTeam ||
            String(employee.teamId) === selectedEmployeeTeam;


        const matchesSearch =
            !search ||
            [
                employee.name,
                employee.employeeId,
                teamName
            ].some(value => {

                const text = String(value ?? "")
                    .toLowerCase();

                return text.startsWith(search) ||
                    text.split(/\s+/).some(word =>
                        word.startsWith(search)
                    );
            });

        return matchesTeam && matchesSearch;
    });
    $("#clearEmployeeSearchBtn").hidden =
        !employeeSearchQuery;

    $("#employeeFilterCount").textContent =
        `Showing ${filtered.length} of ${employees.length} employees`;

    $("#clearEmployeeFiltersBtn").hidden =
        !employeeSearchQuery.trim() && !selectedEmployeeTeam;

    $("#employeesBody").innerHTML = filtered.length
        ? filtered.map(employee => `
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
                        ${TeamOptions(employee.teamId)}
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
        : `<tr>
            <td colspan="5" class="employee-filter-empty">
                ${employees.length
            ? "No matching employees. Try another search or clear filters."
            : "No employees yet."}
            </td>
        </tr>`;
}

// Filtering happens instantly in the browser without new API requests.
$("#employeeSearch").addEventListener("input", event => {

    employeeSearchQuery = event.target.value;

    renderEmployeeRows();

    showEmployeeSuggestions();

});

$("#employeeTeamFilter").addEventListener("change", event => {
    selectedEmployeeTeam = event.target.value;
    renderEmployeeRows();
    hideEmployeeSuggestions();
});

$("#clearEmployeeFiltersBtn").addEventListener("click", () => {
    employeeSearchQuery = "";
    selectedEmployeeTeam = "";
    $("#employeeSearch").value = "";
    $("#employeeTeamFilter").value = "";
    renderEmployeeRows();
    hideEmployeeSuggestions();
});

$("#employeeForm").addEventListener("submit", async event => {
    event.preventDefault();

    const payload = {
        employeeId: $("#newEmployeeId").value.trim(),
        name: $("#newEmployeeName").value.trim(),
        email: $("#newEmployeeEmail").value.trim(),
        phone: $("#newEmployeePhone").value.trim(),
        teamId: Number($("#newEmployeeTeam").value)
    };

    if (!payload.teamId) {
        showMessage("Please select a Team.", true);
        return;
    }

    try {
        await api("employees", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        event.target.reset();
        await loadAdmin();

        // During Create & Add Employees, keep the team selected for the next entry.
        if (teamSetupId !== null && Teams.some(team => team.id === teamSetupId)) {
            selectedEmployeeTeam = String(teamSetupId);
            renderEmployees();
            $("#newEmployeeTeam").value = String(teamSetupId);
            $("#newEmployeeId").focus();
        }

        showMessage("Employee created successfully.");
    }
    catch (error) {
        showMessage(error.message, true);
    }
});
// Clear only the search text.
// Keep the selected Team unchanged.

$("#clearEmployeeSearchBtn").addEventListener(
    "click",
    () => {

        employeeSearchQuery = "";

        $("#employeeSearch").value = "";

        renderEmployeeRows();
        hideEmployeeSuggestions();

        $("#employeeSearch").focus();
    }
);

// =====================================================
// LIVE EMPLOYEE AUTOCOMPLETE
// =====================================================

let employeeSuggestions = [];
let activeSuggestionIndex = -1;


// Check whether a word starts with the typed letters.

function matchesSuggestion(value, query) {

    const text = String(value ?? "")
        .toLowerCase();

    const search = query.trim().toLowerCase();

    if (!search) return false;

    return text.startsWith(search) ||
        text.split(/\s+/).some(word =>
            word.startsWith(search)
        );
}


// Hide autocomplete.

function hideEmployeeSuggestions() {

    const box = $("#employeeSuggestions");

    box.hidden = true;
    $("#employeeSearch").setAttribute("aria-expanded", "false");
    box.innerHTML = "";

    employeeSuggestions = [];
    activeSuggestionIndex = -1;
}


// Show autocomplete while typing.

function showEmployeeSuggestions() {

    const query = $("#employeeSearch")
        .value.trim().toLowerCase();

    const box = $("#employeeSuggestions");

    if (!query) {

        hideEmployeeSuggestions();
        return;
    }


    // Only suggest employees belonging to the selected team.

    const availableEmployees = employees.filter(employee =>
        !selectedEmployeeTeam ||
        String(employee.teamId) === selectedEmployeeTeam
    );


    // Build suggestions from names and employee IDs.

    const values = [

        ...availableEmployees.map(employee => ({
            value: employee.name,
            type: "Employee"
        })),

        ...availableEmployees.map(employee => ({
            value: employee.employeeId,
            type: "Employee ID"
        })),

        ...Teams
            .filter(team =>
                !selectedEmployeeTeam ||
                String(team.id) === selectedEmployeeTeam
            )
            .map(team => ({
                value: team.name,
                type: "Team"
            }))

    ];


    // Match starting letters and remove duplicates.

    const seen = new Set();

    employeeSuggestions = values.filter(item => {

        if (!item.value) return false;

        if (!matchesSuggestion(item.value, query)) {
            return false;
        }

        const key = String(item.value).toLowerCase();

        if (seen.has(key)) return false;

        seen.add(key);

        return true;

    }).slice(0, 8);


    if (!employeeSuggestions.length) {

        hideEmployeeSuggestions();
        return;
    }


    activeSuggestionIndex = -1;


    // Display the suggestions.

    box.innerHTML = employeeSuggestions.map((item, index) => `

        <button type="button"
                class="suggestion-item"
                data-suggestion-index="${index}"
                role="option">

            <span>
                ${escapeHtml(item.value)}
            </span>

            <small>
                ${escapeHtml(item.type)}
            </small>

        </button>

    `).join("");


    box.hidden = false;
    $("#employeeSearch").setAttribute("aria-expanded", "true");
}


// Select one suggestion.

function selectEmployeeSuggestion(index) {

    const suggestion = employeeSuggestions[index];

    if (!suggestion) return;

    employeeSearchQuery = suggestion.value;

    $("#employeeSearch").value = suggestion.value;

    renderEmployeeRows();

    hideEmployeeSuggestions();

    $("#employeeSearch").focus();
}


// Click a suggestion.

$("#employeeSuggestions").addEventListener(
    "click",
    event => {

        const button = event.target.closest(
            "[data-suggestion-index]"
        );

        if (!button) return;

        selectEmployeeSuggestion(
            Number(button.dataset.suggestionIndex)
        );

    }
);


// Keyboard support: arrows, Enter and Escape.

$("#employeeSearch").addEventListener(
    "keydown",
    event => {

        const box = $("#employeeSuggestions");

        if (box.hidden || !employeeSuggestions.length) {
            return;
        }

        if (event.key === "ArrowDown") {

            event.preventDefault();

            activeSuggestionIndex =
                (activeSuggestionIndex + 1) %
                employeeSuggestions.length;

        }

        else if (event.key === "ArrowUp") {

            event.preventDefault();

            activeSuggestionIndex =
                (activeSuggestionIndex - 1 +
                    employeeSuggestions.length) %
                employeeSuggestions.length;

        }

        else if (
            event.key === "Enter" &&
            activeSuggestionIndex >= 0
        ) {

            event.preventDefault();

            selectEmployeeSuggestion(activeSuggestionIndex);

            return;

        }

        else if (event.key === "Escape") {

            hideEmployeeSuggestions();
            return;

        }

        else {

            return;

        }


        box.querySelectorAll(".suggestion-item")
            .forEach((button, index) => {

                button.classList.toggle(
                    "active",
                    index === activeSuggestionIndex
                );

            });

    }
);


// Close suggestions when clicking elsewhere.

document.addEventListener("click", event => {

    if (!event.target.closest(".emp-search-box")) {

        hideEmployeeSuggestions();

    }

});
// =====================================================
// ROLES
// =====================================================

function renderRoles() {
    const dropdown = $("#roleTeamFilter");
    dropdown.innerHTML = '<option value="">All teams</option>' +
        Teams.map(team => `<option value="${team.id}">${escapeHtml(team.name)}</option>`).join("");

    // Preserve the selection if the team still exists after an API refresh.
    if (!Teams.some(team => String(team.id) === selectedRoleTeam)) {
        selectedRoleTeam = "";
    }
    dropdown.value = selectedRoleTeam;
    $("#roleSearch").value = roleSearchQuery;
    renderRoleRows();
}

function renderRoleRows() {
    const query = roleSearchQuery.trim().toLocaleLowerCase();
    const startsWithWord = text => String(text ?? "")
        .toLocaleLowerCase()
        .split(/\s+/)
        .some(word => word.startsWith(query));

    const visibleTeams = Teams.filter(team => {
        if (selectedRoleTeam && String(team.id) !== selectedRoleTeam) return false;
        if (!query) return true;
        const members = employees.filter(employee => employee.teamId === team.id);
        return startsWithWord(team.name) || members.some(employee =>
            startsWithWord(employee.name) || startsWithWord(employee.employeeId));
    });

    $("#roleFilterCount").textContent =
        `Showing ${visibleTeams.length} of ${Teams.length} teams`;
    $("#clearRoleFiltersBtn").hidden = !selectedRoleTeam && !query;
    $("#clearRoleSearchBtn").hidden = !roleSearchQuery.trim();

    $("#rolesBody").innerHTML = visibleTeams.length
        ? visibleTeams.map(team => {
            const members = employees.filter(employee => employee.teamId === team.id);
            const teamNameMatches = query && startsWithWord(team.name);
            const visibleMembers = !query || teamNameMatches
                ? members
                : members.filter(employee =>
                    startsWithWord(employee.name) || startsWithWord(employee.employeeId));

            // Admins cannot be appointed. Keep the current manager available.
            const candidates = members.filter(employee =>
                employee.role === "Employee" || employee.id === team.managerId);
            const matchingCandidates = visibleMembers.filter(employee =>
                candidates.some(candidate => candidate.id === employee.id));
            const suggested = query && !teamNameMatches && matchingCandidates.length === 1
                ? matchingCandidates[0]
                : null;
            const selectedManagerId = suggested?.id ?? team.managerId ?? 0;
            const canAssign = !!selectedManagerId && selectedManagerId !== team.managerId;

            return `
                <div class="role-row">
                    <div class="role-team-info">
                        <strong>${escapeHtml(team.name)}</strong>
                        <p class="role-current">Current: ${escapeHtml(team.managerName || "Unassigned")}</p>
                        <div class="role-members">
                            <span class="role-members-label">${query && !teamNameMatches ? "Matching employees" : "Team members"} (${visibleMembers.length})</span>
                            <div class="role-member-list">
                                ${visibleMembers.length ? visibleMembers.map(employee => `
                                    <span class="role-member">
                                        ${escapeHtml(employee.name)}
                                        <small>${escapeHtml(employee.employeeId)}</small>
                                    </span>
                                `).join("") : '<span class="role-no-members">No employees assigned</span>'}
                            </div>
                        </div>
                    </div>

                    <select id="manager-${team.id}" data-manager-select="${team.id}"
                            aria-label="Choose manager for ${escapeHtml(team.name)}">
                        <option value="">Select employee</option>
                        ${candidates.map(employee => `
                            <option value="${employee.id}" ${employee.id === selectedManagerId ? "selected" : ""}>
                                ${escapeHtml(employee.name)} (${escapeHtml(employee.employeeId)})
                            </option>
                        `).join("")}
                    </select>
                    <button class="btn-dark" data-action="assign-manager"
                            data-id="${team.id}" ${canAssign ? "" : "disabled"}>
                        Assign
                    </button>
                    <button class="action danger" data-action="revoke-manager"
                            data-id="${team.id}" ${!team.managerId ? "disabled" : ""}>
                        Revoke
                    </button>
                </div>`;
        }).join("")
        : '<div class="roles-empty">No matching teams or employees found.</div>';
}

$("#roleSearch").addEventListener("input", event => {
    roleSearchQuery = event.target.value;
    renderRoleRows();
});

// Clear only the search text. Keep the selected Team unchanged.
$("#clearRoleSearchBtn").addEventListener("click", () => {
    roleSearchQuery = "";
    $("#roleSearch").value = "";
    renderRoleRows();
    $("#roleSearch").focus();
});

$("#roleTeamFilter").addEventListener("change", event => {
    selectedRoleTeam = event.target.value;
    renderRoleRows();
});

$("#clearRoleFiltersBtn").addEventListener("click", () => {
    selectedRoleTeam = "";
    roleSearchQuery = "";
    $("#roleSearch").value = "";
    $("#roleTeamFilter").value = "";
    renderRoleRows();
});

// Disable Assign for the current manager or an empty selection.
document.addEventListener("change", event => {
    const select = event.target.closest("[data-manager-select]");
    if (!select) return;
    const team = Teams.find(item => item.id === Number(select.dataset.managerSelect));
    const button = select.closest(".role-row")?.querySelector('[data-action="assign-manager"]');
    if (button) button.disabled = !select.value || Number(select.value) === team?.managerId;
});

// =====================================================
// ACTIONS
// =====================================================

document.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = Number(button.dataset.id);

    try {
        if (action === "delete-Team") {
            if (!confirm("Remove this Team?")) return;

            await api(`teams/${id}`, {
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

            await api(`teams/${id}/manager/${employeeId}`, {
                method: "PUT"
            });
        }

        else if (action === "revoke-manager") {
            const Team = Teams.find(x => x.id === id);

            if (!Team?.managerId) return;

            if (!confirm("Revoke this manager's access?")) return;

            await api(
                `teams/${id}/manager/${Team.managerId}`,
                { method: "DELETE" }
            );
        }

        else {
            return;
        }

        await loadAdmin();
        showMessage("Changes saved successfully.");
    }
    catch (error) {
        showMessage(error.message, true);
    }
});

// Move employee using the Team dropdown.
document.addEventListener("change", async event => {
    const select = event.target.closest("[data-move]");

    if (!select) return;

    const employeeId = Number(select.dataset.move);
    const teamId = Number(select.value);

    try {
        await api(`employees/${employeeId}/team`, {
            method: "PUT",
            body: JSON.stringify({ teamId })
        });

        await loadAdmin();

        showMessage("Employee Team updated.");
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
    renderTeams();
    renderEmployees();
    renderRoles();
}

loadAdmin();