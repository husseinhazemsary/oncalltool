console.log("ADMIN JS LOADED");


const MANAGER_DEPARTMENT = "ERP Applications";



/* =============================
   TEAM MEMBERS
   ============================= */

const teamMembers = [

    {
        id: 1,
        employeeId: "EMP1001",
        name: "Ahmed Mohamed",
        phone: "+20 12 1000 4521",
        role: "Manager",
        schedulePrivilege: true
    },

    {
        id: 2,
        employeeId: "EMP1002",
        name: "Mohamed Hassan",
        phone: "+20 12 1000 4522",
        role: "Employee",
        schedulePrivilege: false
    },

    {
        id: 3,
        employeeId: "EMP1003",
        name: "Sara Ibrahim",
        phone: "+20 12 1000 4523",
        role: "Employee",
        schedulePrivilege: false
    },

    {
        id: 4,
        employeeId: "EMP1004",
        name: "Omar Khalil",
        phone: "+20 12 1000 4524",
        role: "Employee",
        schedulePrivilege: true
    },

    {
        id: 5,
        employeeId: "EMP1005",
        name: "Karim Ali",
        phone: "+20 12 1000 4525",
        role: "Employee",
        schedulePrivilege: false
    }

];



/* =============================
   MOCK ON-CALL DATA
   ============================= */

let schedules = [

    {
        id: 1,
        department: "ERP Applications",
        date: "2026-09-13",
        primary: "Ahmed Mohamed",
        secondary: "Mohamed Hassan",
        holiday: false,
        holidayName: ""
    },

    {
        id: 2,
        department: "ERP Applications",
        date: "2026-09-14",
        primary: "Sara Ibrahim",
        secondary: "Omar Khalil",
        holiday: false,
        holidayName: ""
    },

    {
        id: 3,
        department: "ERP Applications",
        date: "2026-09-15",
        primary: "Karim Ali",
        secondary: "Ahmed Mohamed",
        holiday: false,
        holidayName: ""
    },

    {
        id: 4,
        department: "Database",
        date: "2026-09-13",
        primary: "Mahmoud Ali",
        secondary: "Hany Ibrahim",
        holiday: false,
        holidayName: ""
    },

    {
        id: 5,
        department: "Network",
        date: "2026-09-13",
        primary: "Omar Adel",
        secondary: "Sara Hassan",
        holiday: false,
        holidayName: ""
    },

    {
        id: 6,
        department: "Billing",
        date: "2026-09-13",
        primary: "Mona Ali",
        secondary: "Ali Hassan",
        holiday: false,
        holidayName: ""
    },

    {
        id: 7,
        department: "Integration",
        date: "2026-09-13",
        primary: "Karim Mostafa",
        secondary: "Omar Ahmed",
        holiday: false,
        holidayName: ""
    }

];


let editingScheduleId = null;



/* =============================
   HELPERS
   ============================= */

function formatDate(dateString) {

    const date =
        new Date(
            dateString + "T00:00:00"
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



function getDayName(dateString) {

    const date =
        new Date(
            dateString + "T00:00:00"
        );


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            weekday: "long"
        }
    ).format(date);

}



function getInitials(name) {

    if (!name) {
        return "—";
    }


    return name
        .split(" ")
        .map(x => x[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

}



function getTodayISO() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}



/* =============================
   OVERVIEW TABLE
   ============================= */

function renderMyDepartment() {

    const data =
        schedules

            .filter(
                x =>
                    x.department ===
                    MANAGER_DEPARTMENT
            )

            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    const body =
        document.querySelector(
            "#myDepartmentBody"
        );


    body.innerHTML =

        data.map(schedule => `

            <tr>

                <td>

                    <div class="cell-date">
                        ${formatDate(schedule.date)}
                    </div>

                    <div class="cell-day">
                        ${getDayName(schedule.date)}
                    </div>

                </td>


                <td>

                    <div class="who">

                        <span class="dot p"></span>

                        <span class="who-name">
                            ${schedule.primary}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="who">

                        <span class="dot s"></span>

                        <span class="who-name">
                            ${schedule.secondary}
                        </span>

                    </div>

                </td>


                <td>

                    ${schedule.holiday

                ? `
                                <span class="badge badge-orange">
                                    ${schedule.holidayName || "Holiday"}
                                </span>
                              `

                : `
                                <span class="badge">
                                    Normal day
                                </span>
                              `
            }

                </td>


                <td>

                    <button
                        class="link-edit"
                        onclick="editSchedule(${schedule.id})">

                        Edit

                    </button>

                </td>

            </tr>

        `).join("");

}



/* =============================
   ALL DEPARTMENT SCHEDULES
   ============================= */

function renderAllSchedules(search = "") {

    const filtered =

        schedules

            .filter(
                schedule =>
                    schedule.department
                        .toLowerCase()
                        .includes(
                            search.toLowerCase()
                        )
            )

            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    document.querySelector(
        "#allScheduleBody"
    ).innerHTML =

        filtered.map(schedule => {


            const canEdit =

                schedule.department ===
                MANAGER_DEPARTMENT;


            return `

                <tr>

                    <td>

                        <strong>
                            ${schedule.department}
                        </strong>

                    </td>


                    <td>

                        <div class="cell-date">
                            ${formatDate(schedule.date)}
                        </div>

                        <div class="cell-day">
                            ${getDayName(schedule.date)}
                        </div>

                    </td>


                    <td>

                        <div class="who">

                            <span class="dot p"></span>

                            <span class="who-name">
                                ${schedule.primary}
                            </span>

                        </div>

                    </td>


                    <td>

                        <div class="who">

                            <span class="dot s"></span>

                            <span class="who-name">
                                ${schedule.secondary}
                            </span>

                        </div>

                    </td>


                    <td>

                        ${schedule.holiday

                    ? `
                                    <span class="badge badge-orange">
                                        ${schedule.holidayName || "Holiday"}
                                    </span>
                                  `

                    : `
                                    <span class="badge">
                                        Normal day
                                    </span>
                                  `
                }

                    </td>


                    <td>

                        ${canEdit

                    ? `
                                    <span class="badge badge-green">
                                        Can edit
                                    </span>
                                  `

                    : `
                                    <span class="badge">
                                        View only
                                    </span>
                                  `
                }

                    </td>


                    <td>

                        ${canEdit

                    ? `
                                    <button
                                        class="link-edit"
                                        onclick="editSchedule(${schedule.id})">

                                        Edit

                                    </button>
                                  `

                    : `
                                    <span class="view-lock">
                                        🔒
                                    </span>
                                  `
                }

                    </td>

                </tr>

            `;

        }).join("");

}



/* =============================
   TEAM MEMBERS
   ============================= */

function renderTeamMembers() {

    document.querySelector(
        "#teamMembersBody"
    ).innerHTML =

        teamMembers.map(employee => `

            <tr>

                <td>

                    <div class="employee-cell">

                        <div class="table-avatar">

                            ${getInitials(employee.name)}

                        </div>

                        <div>

                            <strong>
                                ${employee.name}
                            </strong>

                        </div>

                    </div>

                </td>


                <td>
                    ${employee.employeeId}
                </td>


                <td>
                    ${employee.phone}
                </td>


                <td>

                    ${employee.role === "Manager"

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

                    ${employee.role === "Manager"

                ? `
                                <span class="manager-text">
                                    Manager
                                </span>
                              `

                : `
                                <button
                                    class="action-btn"
                                    onclick="togglePrivilege(${employee.id})">

                                    ${employee.schedulePrivilege
                    ? "Remove privilege"
                    : "Give privilege"
                }

                                </button>
                              `
            }

                </td>

            </tr>

        `).join("");

}



function togglePrivilege(employeeId) {

    const employee =

        teamMembers.find(
            x =>
                x.id === employeeId
        );


    if (!employee) {
        return;
    }


    employee.schedulePrivilege =
        !employee.schedulePrivilege;


    renderTeamMembers();

    updateStats();


    if (employee.schedulePrivilege) {

        showToast(
            `${employee.name} can now manage team on-call schedules.`
        );

    }

    else {

        showToast(
            `${employee.name}'s scheduling privilege was removed.`
        );

    }

}



/* =============================
   HOLIDAYS
   ============================= */

function renderHolidays() {

    const holidays =

        schedules.filter(
            x =>
                x.department ===
                MANAGER_DEPARTMENT
                &&
                x.holiday
        );


    const body =
        document.querySelector(
            "#holidayBody"
        );


    if (
        holidays.length === 0
    ) {

        body.innerHTML = `

            <tr>

                <td colspan="5"
                    class="empty-state">

                    No holiday coverage has been created yet.

                </td>

            </tr>

        `;

        return;
    }


    body.innerHTML =

        holidays.map(schedule => `

            <tr>

                <td>

                    <strong>
                        ${schedule.holidayName || "Holiday"}
                    </strong>

                </td>


                <td>

                    <div class="cell-date">
                        ${formatDate(schedule.date)}
                    </div>

                    <div class="cell-day">
                        ${getDayName(schedule.date)}
                    </div>

                </td>


                <td>

                    <div class="who">

                        <span class="dot p"></span>

                        <span class="who-name">
                            ${schedule.primary}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="who">

                        <span class="dot s"></span>

                        <span class="who-name">
                            ${schedule.secondary}
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

        `).join("");

}



/* =============================
   SELECT EMPLOYEES
   ============================= */

function populateEmployeeSelects() {

    const primary =
        document.querySelector(
            "#primarySelect"
        );


    const secondary =
        document.querySelector(
            "#secondarySelect"
        );


    const options =

        teamMembers.map(employee => `

            <option value="${employee.name}">

                ${employee.name}

            </option>

        `).join("");


    primary.innerHTML =
        options;


    secondary.innerHTML =
        options;


    if (
        teamMembers.length > 1
    ) {

        secondary.selectedIndex =
            1;

    }

}



/* =============================
   OPEN CREATE MODAL
   ============================= */

function openCreateScheduleModal(
    isHoliday = false
) {

    editingScheduleId =
        null;


    populateEmployeeSelects();


    document.querySelector(
        "#scheduleModalTitle"
    ).textContent =

        isHoliday
            ? "Create holiday coverage"
            : "Create on-call";


    document.querySelector(
        "#scheduleDate"
    ).value = "";


    document.querySelector(
        "#holidayCheck"
    ).checked =
        isHoliday;


    document.querySelector(
        "#holidayName"
    ).value = "";


    document.querySelector(
        "#holidayNameContainer"
    ).classList.toggle(
        "hidden",
        !isHoliday
    );


    document.querySelector(
        "#scheduleModal"
    ).classList.remove(
        "hidden"
    );

}



/* =============================
   EDIT
   ============================= */

function editSchedule(id) {

    const schedule =

        schedules.find(
            x =>
                x.id === id
        );


    if (!schedule) {
        return;
    }


    if (
        schedule.department !==
        MANAGER_DEPARTMENT
    ) {

        showToast(
            "This department is view-only."
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
        schedule.date;


    document.querySelector(
        "#primarySelect"
    ).value =
        schedule.primary;


    document.querySelector(
        "#secondarySelect"
    ).value =
        schedule.secondary;


    document.querySelector(
        "#holidayCheck"
    ).checked =
        schedule.holiday;


    document.querySelector(
        "#holidayName"
    ).value =
        schedule.holidayName || "";


    document.querySelector(
        "#holidayNameContainer"
    ).classList.toggle(
        "hidden",
        !schedule.holiday
    );


    document.querySelector(
        "#scheduleModal"
    ).classList.remove(
        "hidden"
    );

}



/* =============================
   SAVE SCHEDULE
   ============================= */

function saveSchedule() {

    const date =
        document.querySelector(
            "#scheduleDate"
        ).value;


    const primary =
        document.querySelector(
            "#primarySelect"
        ).value;


    const secondary =
        document.querySelector(
            "#secondarySelect"
        ).value;


    const holiday =
        document.querySelector(
            "#holidayCheck"
        ).checked;


    const holidayName =
        document.querySelector(
            "#holidayName"
        ).value.trim();



    if (!date) {

        showToast(
            "Please select a date."
        );

        return;

    }


    if (
        primary === secondary
    ) {

        showToast(
            "Primary and Secondary must be different employees."
        );

        return;

    }


    if (
        holiday &&
        !holidayName
    ) {

        showToast(
            "Please enter the holiday name."
        );

        return;

    }



    if (
        editingScheduleId !== null
    ) {

        const schedule =

            schedules.find(
                x =>
                    x.id ===
                    editingScheduleId
            );


        schedule.date =
            date;


        schedule.primary =
            primary;


        schedule.secondary =
            secondary;


        schedule.holiday =
            holiday;


        schedule.holidayName =
            holiday
                ? holidayName
                : "";

    }

    else {

        schedules.push({

            id:
                Date.now(),

            department:
                MANAGER_DEPARTMENT,

            date,

            primary,

            secondary,

            holiday,

            holidayName:
                holiday
                    ? holidayName
                    : ""

        });

    }


    closeScheduleModal();


    renderEverything();


    showToast(
        "On-call schedule saved successfully."
    );

}



/* =============================
   STATS
   ============================= */

function updateStats() {

    document.querySelector(
        "#teamMemberCount"
    ).textContent =
        teamMembers.length;


    const editors =

        teamMembers.filter(
            x =>
                x.role !== "Manager"
                &&
                x.schedulePrivilege
        );


    document.querySelector(
        "#editorCount"
    ).textContent =
        editors.length;


    const holidays =

        schedules.filter(
            x =>
                x.department ===
                MANAGER_DEPARTMENT
                &&
                x.holiday
        );


    document.querySelector(
        "#holidayCount"
    ).textContent =
        holidays.length;



    const today =
        getTodayISO();


    let currentSchedule =

        schedules.find(
            x =>
                x.department ===
                MANAGER_DEPARTMENT
                &&
                x.date === today
        );


    if (!currentSchedule) {

        currentSchedule =

            schedules

                .filter(
                    x =>
                        x.department ===
                        MANAGER_DEPARTMENT
                )

                .sort(
                    (a, b) =>
                        new Date(a.date) -
                        new Date(b.date)
                )[0];

    }



    const primaryName =

        currentSchedule
            ? currentSchedule.primary
            : "—";


    const secondaryName =

        currentSchedule
            ? currentSchedule.secondary
            : "—";


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



/* =============================
   NAVIGATION
   ============================= */

function showSection(sectionId) {

    document
        .querySelectorAll(
            ".manager-section"
        )
        .forEach(section => {

            section.classList.add(
                "hidden"
            );

        });


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
        .forEach(button => {

            button.classList.toggle(

                "active",

                button.dataset.section ===
                sectionId

            );

        });

}



document
    .querySelectorAll(
        "[data-section]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showSection(
                    button.dataset.section
                );

            }
        );

    });



/* =============================
   MODAL
   ============================= */

function closeScheduleModal() {

    document.querySelector(
        "#scheduleModal"
    ).classList.add(
        "hidden"
    );

}



document.querySelector(
    "#closeScheduleModal"
).onclick =
    closeScheduleModal;



document.querySelector(
    "#scheduleModal"
).onclick = e => {

    if (
        e.target.id ===
        "scheduleModal"
    ) {

        closeScheduleModal();

    }

};



document.querySelector(
    "#holidayCheck"
).onchange = e => {

    document.querySelector(
        "#holidayNameContainer"
    ).classList.toggle(
        "hidden",
        !e.target.checked
    );

};



/* =============================
   BUTTON EVENTS
   ============================= */

document.querySelector(
    "#createScheduleBtn"
).onclick = () => {

    openCreateScheduleModal(
        false
    );

};



document.querySelector(
    "#createScheduleBtn2"
).onclick = () => {

    openCreateScheduleModal(
        false
    );

};



document.querySelector(
    "#addHolidayBtn"
).onclick = () => {

    openCreateScheduleModal(
        true
    );

};



document.querySelector(
    "#saveScheduleBtn"
).onclick =
    saveSchedule;



document.querySelector(
    "#editSchedulePageBtn"
).onclick = () => {

    showSection(
        "scheduleSection"
    );

};



document.querySelector(
    "#scheduleSearch"
).oninput = e => {

    renderAllSchedules(
        e.target.value
    );

};



/* =============================
   TOAST
   ============================= */

function showToast(message) {

    const toast =
        document.querySelector(
            "#toast"
        );


    toast.textContent =
        message;


    toast.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            toast.classList.add(
                "hidden"
            );

        },
        3000
    );

}



/* =============================
   CLOCK
   ============================= */

function updateClock() {

    const now =
        new Date();


    document.querySelector(
        "#clockTime"
    ).textContent =

        new Intl.DateTimeFormat(
            "en-GB",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(now);


    document.querySelector(
        "#clockDate"
    ).textContent =

        new Intl.DateTimeFormat(
            "en-GB",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        ).format(now);

}



/* =============================
   INITIAL RENDER
   ============================= */

function renderEverything() {

    renderMyDepartment();

    renderAllSchedules();

    renderTeamMembers();

    renderHolidays();

    updateStats();

}



updateClock();

setInterval(
    updateClock,
    60000
);


renderEverything();