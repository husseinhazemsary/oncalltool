console.log("MANAGER JS LOADED");


/* =========================================================
   CURRENT MANAGER

   Temporary intranet/demo identity.
   Later this will come from the authenticated user.    
   ========================================================= */

const managerEmployeeId =
    "MGR001";




/* =========================================================
   STATE

   These are NOT mock records.
   They are filled only from the backend API.
   ========================================================= */

let teamMembers = [];

let schedules = [];

let dashboard = null;

let editingScheduleId = null;

let scheduleFilter =
    "next7";


/* =========================================================
   API HELPER
   ========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    }
    catch {

        data = null;

    }


    if (!response.ok) {

        const message =
            data?.message
            ||
            `Request failed (${response.status})`;


        throw new Error(
            message
        );
    }


    return data;
}


/* =========================================================
   LOAD REAL DATA
   ========================================================= */

async function loadDashboard() {

    dashboard =
        await apiRequest(
            `/api/manager/dashboard?managerEmployeeId=${encodeURIComponent(
                managerEmployeeId
            )}`
        );
}


async function loadTeam() {

    teamMembers =
        await apiRequest(
            `/api/manager/team?managerEmployeeId=${encodeURIComponent(
                managerEmployeeId
            )}`
        );
}


async function loadSchedules() {

    schedules =
        await apiRequest(
            `/api/manager/oncalls?managerEmployeeId=${encodeURIComponent(
                managerEmployeeId
            )}`
        );
}


/* =========================================================
   HELPERS
   ========================================================= */

function parseLocalDate(
    dateString
) {

    const cleanDate =
        normalizeDate(
            dateString
        );


    const parts =
        cleanDate
            .split("-")
            .map(Number);


    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}


function getTodayDate() {

    const now =
        new Date();


    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
}


function addDays(
    date,
    numberOfDays
) {

    const result =
        new Date(
            date
        );


    result.setDate(
        result.getDate()
        +
        numberOfDays
    );


    return result;
}


function filterSchedulesByPeriod(
    data
) {

    const today =
        getTodayDate();


    if (
        scheduleFilter ===
        "today"
    ) {

        return data.filter(
            schedule => {

                const date =
                    parseLocalDate(
                        schedule.date
                    );


                return (
                    date.getTime() ===
                    today.getTime()
                );
            }
        );
    }


    if (
        scheduleFilter ===
        "next7"
    ) {

        const endDate =
            addDays(
                today,
                6
            );


        return data.filter(
            schedule => {

                const date =
                    parseLocalDate(
                        schedule.date
                    );


                return (
                    date >= today
                    &&
                    date <= endDate
                );
            }
        );
    }


    if (
        scheduleFilter ===
        "nextMonth"
    ) {

        const firstDayNextMonth =
            new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                1
            );


        const firstDayAfterNextMonth =
            new Date(
                today.getFullYear(),
                today.getMonth() + 2,
                1
            );


        return data.filter(
            schedule => {

                const date =
                    parseLocalDate(
                        schedule.date
                    );


                return (
                    date >=
                    firstDayNextMonth
                    &&
                    date <
                    firstDayAfterNextMonth
                );
            }
        );
    }


    // ALL
    return data;
}

function normalizeDate(
    value
) {

    if (!value) {
        return "";
    }


    return value
        .toString()
        .substring(
            0,
            10
        );
}


function formatDate(
    dateString
) {

    const cleanDate =
        normalizeDate(
            dateString
        );


    if (!cleanDate) {
        return "—";
    }


    const date =
        new Date(
            cleanDate +
            "T00:00:00"
        );


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    ).format(date);
}


function getDayName(
    dateString
) {

    const cleanDate =
        normalizeDate(
            dateString
        );


    if (!cleanDate) {
        return "";
    }


    const date =
        new Date(
            cleanDate +
            "T00:00:00"
        );


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            weekday: "long"
        }
    ).format(date);
}


function getInitials(
    name
) {

    if (
        !name
        ||
        name === "—"
        ||
        name === "Unassigned"
    ) {

        return "—";
    }


    return name
        .trim()
        .split(/\s+/)
        .map(
            word =>
                word[0]
        )
        .slice(
            0,
            2
        )
        .join("")
        .toUpperCase();
}


function escapeHtml(
    value
) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return "";
    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            "\"",
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   MANAGER / DEPARTMENT HEADER
   ========================================================= */

function renderManagerInfo() {

    const manager =
        teamMembers.find(
            employee =>
                employee.role ===
                "Manager"
        );


    const departmentName =
        dashboard?.departmentName
        ||
        "My Team";


    const departmentTitle =
        document.querySelector(
            "#departmentTitle"
        );


    const departmentBreadcrumb =
        document.querySelector(
            "#departmentBreadcrumb"
        );


    const departmentContext =
        document.querySelector(
            "#departmentContext"
        );


    const teamTitle =
        document.querySelector(
            "#teamTitle"
        );


    const modalDepartment =
        document.querySelector(
            "#modalDepartment"
        );


    if (departmentTitle) {

        departmentTitle.textContent =
            departmentName;
    }


    if (departmentBreadcrumb) {

        departmentBreadcrumb.textContent =
            departmentName;
    }


    if (departmentContext) {

        departmentContext.textContent =
            departmentName;
    }


    if (teamTitle) {

        teamTitle.textContent =
            `${departmentName} Team`;
    }


    if (modalDepartment) {

        modalDepartment.textContent =
            departmentName.toUpperCase();
    }


    if (manager) {

        const managerName =
            document.querySelector(
                "#managerName"
            );


        const managerRole =
            document.querySelector(
                "#managerRole"
            );


        const managerAvatar =
            document.querySelector(
                "#managerAvatar"
            );


        if (managerName) {

            managerName.textContent =
                manager.name;
        }


        if (managerRole) {

            managerRole.textContent =
                `${departmentName} Manager`;
        }


        if (managerAvatar) {

            managerAvatar.textContent =
                getInitials(
                    manager.name
                );
        }
    }
}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

function renderDashboard() {

    if (!dashboard) {
        return;
    }


    document.querySelector(
        "#teamMemberCount"
    ).textContent =
        dashboard.teamMemberCount
        ?? 0;


    document.querySelector(
        "#editorCount"
    ).textContent =
        dashboard.scheduleEditors
        ?? 0;


    const primaryName =
        dashboard.primaryToday
        ||
        "—";


    const secondaryName =
        dashboard.secondaryToday
        ||
        "—";


    document.querySelector(
        "#primaryToday"
    ).textContent =
        primaryName;


    document.querySelector(
        "#secondaryToday"
    ).textContent =
        secondaryName;


    document.querySelector(
        "#primaryInitials"
    ).textContent =
        getInitials(
            primaryName
        );


    document.querySelector(
        "#secondaryInitials"
    ).textContent =
        getInitials(
            secondaryName
        );
}


/* =========================================================
   REAL ON-CALL SCHEDULE TABLE
   ========================================================= */

function renderSchedules() {

    const body =
        document.querySelector(
            "#myDepartmentBody"
        );


    if (!body) {
        return;
    }


    const filteredSchedules =
        filterSchedulesByPeriod(
            schedules
        );


    if (
        filteredSchedules.length === 0
    ) {

        body.innerHTML = `

            <tr>

                <td colspan="4"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#8a93a5;
                    ">

                    No on-call schedules found.

                </td>

            </tr>

        `;

        return;
    }


   


    const sortedSchedules =
        [...filteredSchedules].sort(
            (a, b) =>
                parseLocalDate(
                    a.date
                )
                -
                parseLocalDate(
                    b.date
                )
        );


    body.innerHTML =

        sortedSchedules

            .map(
                schedule => {

                    const primaryName =
                        schedule.primaryName
                        ||
                        "Unassigned";


                    const secondaryName =
                        schedule.secondaryName
                        ||
                        "Unassigned";


                    return `

                        <tr>

                            <td>

                                <div class="cell-date">

                                    ${escapeHtml(
                        formatDate(
                            schedule.date
                        )
                    )}

                                </div>

                                <div class="cell-day">

                                    ${escapeHtml(
                        getDayName(
                            schedule.date
                        )
                    )}

                                </div>

                            </td>


                            <td>

                                <div class="who">

                                    <span class="dot p">
                                    </span>

                                    <span class="who-name">

                                        ${escapeHtml(
                        primaryName
                    )}

                                    </span>

                                </div>

                            </td>


                            <td>

                                <div class="who">

                                    <span class="dot s">
                                    </span>

                                    <span class="who-name">

                                        ${escapeHtml(
                        secondaryName
                    )}

                                    </span>

                                </div>

                            </td>


                            <td>

                                <button
                                    class="link-edit"
                                    onclick="editSchedule(${schedule.id})">

                                    Edit

                                </button>

                            </td>

                        </tr>

                    `;
                }
            )
            .join("");
}


/* =========================================================
   REAL TEAM TABLE
   ========================================================= */

function renderTeamMembers() {

    const body =
        document.querySelector(
            "#teamMembersBody"
        );


    if (!body) {
        return;
    }


    if (
        !teamMembers
        ||
        teamMembers.length === 0
    ) {

        body.innerHTML = `

            <tr>

                <td colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#8a93a5;
                    ">

                    No employees found in this team.

                </td>

            </tr>

        `;

        return;
    }


    body.innerHTML =

        teamMembers.map(
            employee => `

                <tr>

                    <td>

                        <div class="employee-cell">

                            <div class="table-avatar">

                                ${escapeHtml(
                getInitials(
                    employee.name
                )
            )}

                            </div>


                            <div>

                                <strong>

                                    ${escapeHtml(
                employee.name
            )}

                                </strong>

                            </div>

                        </div>

                    </td>


                    <td>

                        ${escapeHtml(
                employee.employeeId
            )}

                    </td>


                    <td>

                        ${escapeHtml(
                employee.phone
                ||
                "—"
            )}

                    </td>


                    <td>

                        ${employee.role ===
                    "Manager"

                    ? `
                                    <span class="badge badge-green">
                                        Manager
                                    </span>
                                  `

                    : `
                                    <span class="badge">
                                        Employee
                                    </span>
                                  `
                }

                    </td>


                    <td>

                        ${employee.schedulePrivilege

                    ? `
                                    <span class="badge badge-green">
                                        Allowed
                                    </span>
                                  `

                    : `
                                    <span class="badge badge-red">
                                        Not allowed
                                    </span>
                                  `
                }

                    </td>


                    <td>

                        ${employee.role ===
                    "Manager"

                    ? `
                                    <span class="manager-text">
                                        Manager
                                    </span>
                                  `

                    : `
                                    <button
                                        class="action-btn"
                                        onclick="togglePrivilege(
                                            ${employee.id},
                                            ${employee.schedulePrivilege}
                                        )">

                                        ${employee.schedulePrivilege
                        ? "Remove privilege"
                        : "Give privilege"
                    }

                                    </button>
                                  `
                }

                    </td>

                </tr>

            `
        ).join("");
}


/* =========================================================
   UPDATE REAL SCHEDULE PRIVILEGE
   ========================================================= */

async function togglePrivilege(
    employeeId,
    currentValue
) {

    try {

        await apiRequest(

            `/api/manager/team/${employeeId}/schedule-privilege?managerEmployeeId=${encodeURIComponent(
                managerEmployeeId
            )}`,

            {
                method:
                    "PUT",

                body:
                    JSON.stringify({
                        allowed:
                            !currentValue
                    })
            }
        );


        await refreshManagerData();


        showToast(
            "Schedule privilege updated successfully."
        );

    }
    catch (error) {

        console.error(error);

        showToast(
            error.message
        );
    }
}


/* =========================================================
   EMPLOYEE SELECTS

   Options come ONLY from database team members.
   ========================================================= */

function populateEmployeeSelects() {

    const primary =
        document.querySelector(
            "#primarySelect"
        );

    const secondary =
        document.querySelector(
            "#secondarySelect"
        );


    primary.innerHTML = "";
    secondary.innerHTML = "";


    // Manager must NOT appear in on-call assignments
    const availableEmployees =
        teamMembers.filter(
            employee =>
                employee.role === "Employee"        );


    availableEmployees.forEach(
        employee => {

            const primaryOption =
                document.createElement(
                    "option"
                );

            primaryOption.value =
                employee.id;

            primaryOption.textContent =
                `${employee.name} — ${employee.employeeId}`;


            const secondaryOption =
                document.createElement(
                    "option"
                );

            secondaryOption.value =
                employee.id;

            secondaryOption.textContent =
                `${employee.name} — ${employee.employeeId}`;


            primary.appendChild(
                primaryOption
            );

            secondary.appendChild(
                secondaryOption
            );
        }
    );


    if (availableEmployees.length > 1) {

        primary.selectedIndex = 0;
        secondary.selectedIndex = 1;
    }
}

/* =========================================================
   OPEN CREATE MODAL
   ========================================================= */

function openCreateScheduleModal() {

    const availableEmployees =
        teamMembers.filter(
            employee =>
                employee.role === "Employee"        );


    if (availableEmployees.length < 2) {

        showToast(
            "At least two employees are required to create an on-call schedule."
        );

        return;
    }


    editingScheduleId = null;


    populateEmployeeSelects();


    document.querySelector(
        "#scheduleModalTitle"
    ).textContent =
        "Create on-call";


    // Default to today's LOCAL date
    document.querySelector(
        "#scheduleDate"
    ).value =
        getTodayISO();


    document.querySelector(
        "#scheduleModal"
    ).classList.remove(
        "hidden"
    );
}
function getTodayISO() {

    const today =
        new Date();


    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


/* =========================================================
   EDIT REAL SCHEDULE
   ========================================================= */

function editSchedule(
    id
) {

    const schedule =
        schedules.find(
            item =>
                item.id === id
        );


    if (!schedule) {

        showToast(
            "Schedule was not found."
        );

        return;
    }


    editingScheduleId =
        id;


    populateEmployeeSelects();


    document.querySelector(
        "#scheduleModalTitle"
    ).textContent =
        "Edit on-call";


    document.querySelector(
        "#scheduleDate"
    ).value =
        normalizeDate(
            schedule.date
        );


    document.querySelector(
        "#primarySelect"
    ).value =
        schedule.primaryEmployeeId
            ?.toString()
        ||
        "";


    document.querySelector(
        "#secondarySelect"
    ).value =
        schedule.secondaryEmployeeId
            ?.toString()
        ||
        "";


    document.querySelector(
        "#scheduleModal"
    ).classList.remove(
        "hidden"
    );
}


/* =========================================================
   SAVE REAL SCHEDULE
   ========================================================= */

async function saveSchedule() {

    const date =
        document.querySelector(
            "#scheduleDate"
        ).value;


    const primaryEmployeeId =
        Number(
            document.querySelector(
                "#primarySelect"
            ).value
        );


    const secondaryEmployeeId =
        Number(
            document.querySelector(
                "#secondarySelect"
            ).value
        );


    if (!date) {

        showToast(
            "Please select a date."
        );

        return;
    }


    if (
        !primaryEmployeeId
        ||
        !secondaryEmployeeId
    ) {

        showToast(
            "Please select Primary and Secondary employees."
        );

        return;
    }


    if (
        primaryEmployeeId ===
        secondaryEmployeeId
    ) {

        showToast(
            "Primary and Secondary must be different employees."
        );

        return;
    }


    const payload = {

        date:

            `${date}T00:00:00`,

        primaryEmployeeId,

        secondaryEmployeeId
    };


    try {

        if (
            editingScheduleId !== null
        ) {

            await apiRequest(

                `/api/manager/oncalls/${editingScheduleId}?managerEmployeeId=${encodeURIComponent(
                    managerEmployeeId
                )}`,

                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        }

        else {

            await apiRequest(

                `/api/manager/oncalls?managerEmployeeId=${encodeURIComponent(
                    managerEmployeeId
                )}`,

                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );
        }


        closeScheduleModal();


        await refreshManagerData();


        showToast(
            "On-call schedule saved successfully."
        );

    }
    catch (error) {

        console.error(error);

        showToast(
            error.message
        );
    }
}
/* =========================================================
   INCIDENT HISTORY
   ========================================================= */

function renderIncidents() {

    const body =
        document.querySelector(
            "#incidentBody"
        );


    if (!body) {
        return;
    }


    const incidents =
        schedules

            .filter(
                schedule =>

                    Number(
                        schedule.incidentCount ?? 0
                    ) > 0

                    ||

                    (
                        schedule.impactedPlatforms
                        &&
                        schedule.impactedPlatforms.trim() !== ""
                    )

                    ||

                    (
                        schedule.incidentDescription
                        &&
                        schedule.incidentDescription.trim() !== ""
                    )
            )

            .sort(
                (a, b) =>

                    parseLocalDate(
                        b.date
                    )

                    -

                    parseLocalDate(
                        a.date
                    )
            );


    if (
        incidents.length === 0
    ) {

        body.innerHTML = `

            <tr>

                <td colspan="5"
                    style="
                        text-align:center;
                        padding:35px;
                        color:#8a93a5;
                    ">

                    No incidents recorded.

                </td>

            </tr>

        `;

        return;
    }


    body.innerHTML =

        incidents

            .map(
                schedule => `

                    <tr>


                        <td>

                            <div class="cell-date">

                                ${escapeHtml(
                    formatDate(
                        schedule.date
                    )
                )}

                            </div>


                            <div class="cell-day">

                                ${escapeHtml(
                    getDayName(
                        schedule.date
                    )
                )}

                            </div>

                        </td>



                        <td>

                            <div class="who">

                                <span class="dot p">
                                </span>

                                <span class="who-name">

                                    ${escapeHtml(
                    schedule.primaryName
                    ||
                    "Unassigned"
                )}

                                </span>

                            </div>

                        </td>



                        <td>

                            <span class="badge badge-red">

                                ${escapeHtml(
                    schedule.incidentCount
                    ??
                    0
                )}

                            </span>

                        </td>



                        <td>

                            ${escapeHtml(
                    schedule.impactedPlatforms
                    ||
                    "—"
                )}

                        </td>



                        <td>

                            ${escapeHtml(
                    schedule.incidentDescription
                    ||
                    "—"
                )}

                        </td>


                    </tr>

                `
            )

            .join("");
}


/* =========================================================
   SWAP HISTORY
   ========================================================= */

function renderSwapHistory() {

    const body =
        document.querySelector(
            "#swapHistoryBody"
        );


    if (!body) {
        return;
    }


    const swaps =
        schedules

            .filter(
                schedule =>

                    schedule.swapNote
                    &&
                    schedule.swapNote
                        .toString()
                        .trim() !== ""
            )

            .sort(
                (a, b) =>

                    parseLocalDate(
                        b.date
                    )

                    -

                    parseLocalDate(
                        a.date
                    )
            );


    if (
        swaps.length === 0
    ) {

        body.innerHTML = `

            <tr>

                <td colspan="4"
                    style="
                        text-align:center;
                        padding:35px;
                        color:#8a93a5;
                    ">

                    No swap history recorded.

                </td>

            </tr>

        `;

        return;
    }


    body.innerHTML =

        swaps

            .map(
                schedule => `

                    <tr>


                        <td>

                            <div class="cell-date">

                                ${escapeHtml(
                    formatDate(
                        schedule.date
                    )
                )}

                            </div>


                            <div class="cell-day">

                                ${escapeHtml(
                    getDayName(
                        schedule.date
                    )
                )}

                            </div>

                        </td>



                        <td>

                            <div class="who">

                                <span class="dot p">
                                </span>

                                <span class="who-name">

                                    ${escapeHtml(
                    schedule.primaryName
                    ||
                    "Unassigned"
                )}

                                </span>

                            </div>

                        </td>



                        <td>

                            <div class="who">

                                <span class="dot s">
                                </span>

                                <span class="who-name">

                                    ${escapeHtml(
                    schedule.secondaryName
                    ||
                    "Unassigned"
                )}

                                </span>

                            </div>

                        </td>



                        <td>

                            <span class="swap-note">

                                ${escapeHtml(
                    schedule.swapNote
                )}

                            </span>

                        </td>


                    </tr>

                `
            )

            .join("");
}

/* =========================================================
   REFRESH ALL REAL MANAGER DATA
   ========================================================= */

async function refreshManagerData() {

    try {

        await Promise.all([
            loadDashboard(),
            loadTeam(),
            loadSchedules()
        ]);


        console.log(
            "Schedules received:",
            schedules
        );


        renderDashboard();

        renderManagerInfo();

        renderTeamMembers();

        renderSchedules();

        renderIncidents();

        renderSwapHistory();

    }
    catch (error) {

        console.error(
            error
        );


        showToast(
            error.message
        );
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showSection(
    sectionId
) {

    document
        .querySelectorAll(
            ".manager-section"
        )
        .forEach(
            section => {

                section.classList.add(
                    "hidden"
                );
            }
        );


    document
        .querySelector(
            `#${sectionId}`
        )
        .classList.remove(
            "hidden"
        );


    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",

                    button.dataset.section ===
                    sectionId
                );
            }
        );
}
/* =========================================================
   IMPORT SCHEDULE
   CSV OR XLSX
   ========================================================= */

document.querySelector(
    "#importScheduleBtn"
).onclick = () => {

    document.querySelector(
        "#scheduleFileInput"
    ).click();
};


document.querySelector(
    "#scheduleFileInput"
).addEventListener(
    "change",
    async event => {

        const input =
            event.target;

        const file =
            input.files?.[0];


        if (!file) {
            return;
        }


        const fileName =
            file.name.toLowerCase();


        if (
            !fileName.endsWith(".csv")
            &&
            !fileName.endsWith(".xlsx")
        ) {

            showToast(
                "Please select a CSV or Excel file."
            );

            input.value = "";

            return;
        }


        const button =
            document.querySelector(
                "#importScheduleBtn"
            );


        const originalHtml =
            button.innerHTML;


        try {

            button.disabled = true;

            button.innerHTML =
                "Importing...";


            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            const response =
                await fetch(

                    `/api/manager/oncalls/import-schedule?managerEmployeeId=${encodeURIComponent(
                        managerEmployeeId
                    )}`,

                    {
                        method:
                            "POST",

                        body:
                            formData
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                if (
                    result.errors
                    &&
                    result.errors.length > 0
                ) {

                    console.error(
                        result.errors
                    );

                    showToast(
                        result.errors[0]
                    );
                }

                else {

                    showToast(
                        result.message
                        ||
                        "Schedule import failed."
                    );
                }

                return;
            }


            await refreshManagerData();


            showToast(
                `${result.importedRows} schedule rows imported successfully.`
            );

        }
        catch (error) {

            console.error(error);

            showToast(
                "Could not import the schedule file."
            );

        }
        finally {

            button.disabled =
                false;

            button.innerHTML =
                originalHtml;

            input.value =
                "";
        }
    }
);


document
    .querySelectorAll(
        "[data-section]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showSection(
                        button.dataset.section
                    );
                }
            );
        }
    );


/* =========================================================
   MODAL
   ========================================================= */

function closeScheduleModal() {

    document.querySelector(
        "#scheduleModal"
    ).classList.add(
        "hidden"
    );


    editingScheduleId =
        null;
}


document.querySelector(
    "#closeScheduleModal"
).onclick =
    closeScheduleModal;


document.querySelector(
    "#scheduleModal"
).onclick =
    event => {

        if (
            event.target.id ===
            "scheduleModal"
        ) {

            closeScheduleModal();
        }
    };


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeScheduleModal();
        }
    }
);


/* =========================================================
   BUTTONS
   ========================================================= */

document.querySelector(
    "#createScheduleBtn"
).onclick =
    openCreateScheduleModal;


document.querySelector(
    "#saveScheduleBtn"
).onclick =
    saveSchedule;


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function showToast(
    message
) {

    const toast =
        document.querySelector(
            "#toast"
        );


    toast.textContent =
        message;


    toast.classList.remove(
        "hidden"
    );


    if (toastTimer) {

        clearTimeout(
            toastTimer
        );
    }


    toastTimer =
        setTimeout(
            () => {

                toast.classList.add(
                    "hidden"
                );
            },
            3000
        );
}


/* =========================================================
   CLOCK
   ========================================================= */

function updateClock() {

    const now =
        new Date();


    document.querySelector(
        "#clockTime"
    ).textContent =

        new Intl.DateTimeFormat(
            "en-GB",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        ).format(now);


    document.querySelector(
        "#clockDate"
    ).textContent =

        new Intl.DateTimeFormat(
            "en-GB",
            {
                weekday:
                    "long",

                day:
                    "numeric",

                month:
                    "long"
            }
        ).format(now);
}
/* =========================================================
   SCHEDULE FILTER BUTTONS
   ========================================================= */

document
    .querySelectorAll(
        ".filter-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    scheduleFilter =
                        button.dataset.filter;


                    document
                        .querySelectorAll(
                            ".filter-btn"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );
                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    renderSchedules();
                }
            );
        }
    );


/* =========================================================
   CSV EXPORT HELPERS
   ========================================================= */

// Safely format CSV values for Excel and other spreadsheet apps.
function csvCell(value) {

    let text = String(value ?? "");

    // Prevent spreadsheet applications from interpreting
    // imported text as formulas.
    if (/^[\s\x00-\x1f]*[=+\-@]/.test(text)) {
        text = "'" + text;
    }

    // Escape quotation marks.
    text = text.replaceAll('"', '""');

    return `"${text}"`;
}


// Create and download a CSV file.
function downloadCsv(filename, headers, rows) {

    const csvLines = [

        headers.map(csvCell).join(","),

        ...rows.map(row =>
            row.map(csvCell).join(",")
        )

    ];

    const csvContent =
        csvLines.join("\r\n");


    // UTF-8 BOM improves Arabic/Unicode compatibility in Excel.
    const blob = new Blob(
        ["\uFEFF", csvContent],
        {
            type: "text/csv;charset=utf-8;"
        }
    );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download = filename;


    document.body.appendChild(link);

    link.click();

    link.remove();


    // Release the temporary browser URL.
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}


/* =========================================================
   EXPORT SCHEDULE
   ========================================================= */

function exportSchedules() {

    // Export only the currently selected date period.
    const filteredSchedules =
        filterSchedulesByPeriod(schedules);


    if (filteredSchedules.length === 0) {

        showToast(
            "No schedules available for the selected period."
        );

        return;
    }


    const sortedSchedules =
        [...filteredSchedules].sort(
            (a, b) =>
                parseLocalDate(a.date)
                -
                parseLocalDate(b.date)
        );


    const headers = [

        "Date",
        "Day Type",
        "Primary",
        "Primary Status",
        "Secondary",
        "Swap Note",
        "Incident Count",
        "Impacted Platforms",
        "Incident Description"

    ];


    const rows =
        sortedSchedules.map(schedule => [

            normalizeDate(schedule.date),

            schedule.dayType ?? "",

            schedule.primaryName ?? "",

            schedule.primaryStatus ?? "",

            schedule.secondaryName ?? "",

            schedule.swapNote ?? "",

            schedule.incidentCount ?? 0,

            schedule.impactedPlatforms ?? "",

            schedule.incidentDescription ?? ""

        ]);


    const filename =
        `Enterprise_RA_Schedule_${scheduleFilter}_${getTodayISO()}.csv`;


    downloadCsv(
        filename,
        headers,
        rows
    );
}


/* =========================================================
   EXPORT INCIDENTS
   ========================================================= */

function exportIncidents() {

    // Use all available incident records.
    // The Overview date filter does not affect this page.
    const incidents =

        schedules

            .filter(schedule =>

                Number(schedule.incidentCount ?? 0) > 0

                ||

                Boolean(
                    String(
                        schedule.impactedPlatforms ?? ""
                    ).trim()
                )

                ||

                Boolean(
                    String(
                        schedule.incidentDescription ?? ""
                    ).trim()
                )

            )

            .sort(
                (a, b) =>
                    parseLocalDate(b.date)
                    -
                    parseLocalDate(a.date)
            );


    if (incidents.length === 0) {

        showToast(
            "No incidents available to export."
        );

        return;
    }


    const headers = [

        "Date",
        "Day Type",
        "Primary",
        "Secondary",
        "Incident Count",
        "Impacted Platforms",
        "Incident Description"

    ];


    const rows =
        incidents.map(schedule => [

            normalizeDate(schedule.date),

            schedule.dayType ?? "",

            schedule.primaryName ?? "",

            schedule.secondaryName ?? "",

            schedule.incidentCount ?? 0,

            schedule.impactedPlatforms ?? "",

            schedule.incidentDescription ?? ""

        ]);


    const filename =
        `Enterprise_RA_Incidents_${getTodayISO()}.csv`;


    downloadCsv(
        filename,
        headers,
        rows
    );
}


/* =========================================================
   EXPORT BUTTON EVENTS
   ========================================================= */

document
    .querySelector("#exportScheduleBtn")
    ?.addEventListener(
        "click",
        exportSchedules
    );

document
    .querySelector("#exportIncidentsBtn")
    ?.addEventListener(
        "click",
        exportIncidents
    );


/* =========================================================
   INITIAL LOAD
   ========================================================= */

async function initializePage() {

    updateClock();


    // Update clock every minute
    setInterval(
        updateClock,
        60000
    );


    // Load manager data immediately
    await refreshManagerData();


    // Refresh schedules/team/dashboard every 30 seconds
    setInterval(
        async () => {

            await refreshManagerData();

        },
        30000
    );
}


initializePage();