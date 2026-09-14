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
   ON-CALL MOCK DATA
   ============================= */

let schedules = [

    {
        id: 1,
        department: "ERP Applications",
        date: "2026-09-14",
        primary: "Ahmed Mohamed",
        secondary: "Mohamed Hassan"
    },

    {
        id: 2,
        department: "ERP Applications",
        date: "2026-09-15",
        primary: "Sara Ibrahim",
        secondary: "Omar Khalil"
    },

    {
        id: 3,
        department: "ERP Applications",
        date: "2026-09-16",
        primary: "Karim Ali",
        secondary: "Ahmed Mohamed"
    },

    {
        id: 4,
        department: "ERP Applications",
        date: "2026-09-17",
        primary: "Mohamed Hassan",
        secondary: "Sara Ibrahim"
    },

    {
        id: 5,
        department: "ERP Applications",
        date: "2026-09-18",
        primary: "Omar Khalil",
        secondary: "Karim Ali"
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

    if (!name || name === "—") {
        return "—";
    }


    return name
        .split(" ")
        .map(word => word[0])
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
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/* =============================
   OVERVIEW SCHEDULE
   ============================= */

function renderMyDepartment() {

    const data =
        schedules

            .filter(
                schedule =>
                    schedule.department ===
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
            person =>
                person.id === employeeId
        );


    if (!employee) {
        return;
    }


    employee.schedulePrivilege =
        !employee.schedulePrivilege;


    renderTeamMembers();

    updateStats();


    showToast(

        employee.schedulePrivilege

            ? `${employee.name} can now manage team on-call schedules.`

            : `${employee.name}'s scheduling privilege was removed.`

    );

}


/* =============================
   EMPLOYEE SELECTS
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


    primary.innerHTML = "";
    secondary.innerHTML = "";


    teamMembers.forEach(employee => {

        const primaryOption =
            document.createElement(
                "option"
            );


        primaryOption.value =
            employee.name;


        primaryOption.textContent =
            `${employee.name} — ${employee.employeeId}`;


        const secondaryOption =
            document.createElement(
                "option"
            );


        secondaryOption.value =
            employee.name;


        secondaryOption.textContent =
            `${employee.name} — ${employee.employeeId}`;


        primary.appendChild(
            primaryOption
        );


        secondary.appendChild(
            secondaryOption
        );

    });


    if (teamMembers.length > 1) {

        primary.selectedIndex = 0;

        secondary.selectedIndex = 1;

    }

}


/* =============================
   CREATE
   ============================= */

function openCreateScheduleModal() {

    editingScheduleId =
        null;


    populateEmployeeSelects();


    document.querySelector(
        "#scheduleModalTitle"
    ).textContent =
        "Create on-call";


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


/* =============================
   EDIT
   ============================= */

function editSchedule(id) {

    const schedule =
        schedules.find(
            item =>
                item.id === id
        );


    if (!schedule) {
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
        "#scheduleModal"
    ).classList.remove(
        "hidden"
    );

}


/* =============================
   SAVE
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


    if (!date) {

        showToast(
            "Please select a date."
        );

        return;

    }


    if (primary === secondary) {

        showToast(
            "Primary and Secondary must be different employees."
        );

        return;

    }


    if (editingScheduleId !== null) {

        const schedule =
            schedules.find(
                item =>
                    item.id ===
                    editingScheduleId
            );


        schedule.date =
            date;


        schedule.primary =
            primary;


        schedule.secondary =
            secondary;

    }

    else {

        schedules.push({

            id: Date.now(),

            department:
                MANAGER_DEPARTMENT,

            date,

            primary,

            secondary

        });

    }


    closeScheduleModal();

    renderEverything();


    showToast(
        "On-call schedule saved successfully."
    );

}


/* =============================
   OVERVIEW STATS
   ============================= */

function updateStats() {

    document.querySelector(
        "#teamMemberCount"
    ).textContent =
        teamMembers.length;


    const editors =
        teamMembers.filter(
            employee =>
                employee.role !== "Manager"
                &&
                employee.schedulePrivilege
        );


    document.querySelector(
        "#editorCount"
    ).textContent =
        editors.length;


    const today =
        getTodayISO();


    let currentSchedule =
        schedules.find(
            schedule =>
                schedule.department ===
                MANAGER_DEPARTMENT
                &&
                schedule.date === today
        );


    if (!currentSchedule) {

        currentSchedule =
            schedules

                .filter(
                    schedule =>
                        schedule.department ===
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


    editingScheduleId =
        null;

}


document.querySelector(
    "#closeScheduleModal"
).onclick =
    closeScheduleModal;


document.querySelector(
    "#scheduleModal"
).onclick = event => {

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

        if (event.key === "Escape") {

            closeScheduleModal();

        }

    }
);


/* =============================
   BUTTONS
   ============================= */

document.querySelector(
    "#createScheduleBtn"
).onclick = () => {

    openCreateScheduleModal();

};


document.querySelector(
    "#saveScheduleBtn"
).onclick =
    saveSchedule;


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

    renderTeamMembers();

    updateStats();

}


updateClock();

setInterval(
    updateClock,
    60000
);


renderEverything();