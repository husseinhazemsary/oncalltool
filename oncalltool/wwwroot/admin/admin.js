console.log("ADMIN JS LOADED");

const MANAGER_DEPARTMENT = 'ERP Applications';



const teamMembers = [

    {
        id: 1,
        employeeId: 'EMP1001',
        name: 'Ahmed Mohamed',
        phone: '+20 12 1000 4521',
        role: 'Manager',
        schedulePrivilege: true
    },

    {
        id: 2,
        employeeId: 'EMP1002',
        name: 'Mohamed Hassan',
        phone: '+20 12 1000 4522',
        role: 'Employee',
        schedulePrivilege: false
    },

    {
        id: 3,
        employeeId: 'EMP1003',
        name: 'Sara Ibrahim',
        phone: '+20 12 1000 4523',
        role: 'Employee',
        schedulePrivilege: false
    },

    {
        id: 4,
        employeeId: 'EMP1004',
        name: 'Omar Khalil',
        phone: '+20 12 1000 4524',
        role: 'Employee',
        schedulePrivilege: true
    },

    {
        id: 5,
        employeeId: 'EMP1005',
        name: 'Karim Ali',
        phone: '+20 12 1000 4525',
        role: 'Employee',
        schedulePrivilege: false
    }

];



let schedules = [

    {
        id: 1,
        department: 'ERP Applications',
        date: '2026-09-10',
        primary: 'Ahmed Mohamed',
        secondary: 'Mohamed Hassan',
        holiday: false,
        holidayName: ''
    },

    {
        id: 2,
        department: 'ERP Applications',
        date: '2026-09-11',
        primary: 'Sara Ibrahim',
        secondary: 'Omar Khalil',
        holiday: false,
        holidayName: ''
    },

    {
        id: 3,
        department: 'ERP Applications',
        date: '2026-09-12',
        primary: 'Karim Ali',
        secondary: 'Ahmed Mohamed',
        holiday: false,
        holidayName: ''
    },

    {
        id: 4,
        department: 'Database',
        date: '2026-09-10',
        primary: 'Mahmoud Ali',
        secondary: 'Hany Ibrahim',
        holiday: false,
        holidayName: ''
    },

    {
        id: 5,
        department: 'Network',
        date: '2026-09-10',
        primary: 'Omar Adel',
        secondary: 'Sara Hassan',
        holiday: false,
        holidayName: ''
    },

    {
        id: 6,
        department: 'Billing',
        date: '2026-09-10',
        primary: 'Mona Ali',
        secondary: 'Ali Hassan',
        holiday: false,
        holidayName: ''
    },

    {
        id: 7,
        department: 'Integration',
        date: '2026-09-10',
        primary: 'Karim Mostafa',
        secondary: 'Omar Ahmed',
        holiday: false,
        holidayName: ''
    }

];



let editingScheduleId = null;



function formatDate(dateString) {

    const date = new Date(
        dateString + 'T00:00:00'
    );


    return new Intl.DateTimeFormat(
        'en-GB',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }
    ).format(date);

}



function getDayName(dateString) {

    const date = new Date(
        dateString + 'T00:00:00'
    );


    return new Intl.DateTimeFormat(
        'en-GB',
        {
            weekday: 'long'
        }
    ).format(date);

}



function renderMyDepartment() {

    const data = schedules.filter(
        x => x.department === MANAGER_DEPARTMENT
    );


    document.querySelector('#myDepartmentBody').innerHTML =

        data.map(schedule => `

            <tr>

                <td>
                    <strong>
                        ${formatDate(schedule.date)}
                    </strong>
                </td>

                <td>
                    ${getDayName(schedule.date)}
                </td>


                <td>

                    <span class="status complete">
                        PRIMARY
                    </span>

                    <br>

                    <strong>
                        ${schedule.primary}
                    </strong>

                </td>


                <td>

                    <span class="status partial">
                        SECONDARY
                    </span>

                    <br>

                    <strong>
                        ${schedule.secondary}
                    </strong>

                </td>


                <td>

                    ${schedule.holiday

                ? `<span class="status none">
                               ${schedule.holidayName || 'Holiday'}
                           </span>`

                : `<span class="status complete">
                               Normal Day
                           </span>`
            }

                </td>


                <td>

                    <button
                        class="secondary-btn"
                        onclick="editSchedule(${schedule.id})">

                        Edit

                    </button>

                </td>

            </tr>

        `).join('');

}



function renderAllSchedules(search = '') {

    const filtered = schedules.filter(schedule =>

        schedule.department
            .toLowerCase()
            .includes(search.toLowerCase())

    );


    document.querySelector('#allScheduleBody').innerHTML =

        filtered.map(schedule => {

            const canEdit =
                schedule.department === MANAGER_DEPARTMENT;


            return `

                <tr>

                    <td>

                        <strong>
                            ${schedule.department}
                        </strong>

                    </td>


                    <td>
                        ${formatDate(schedule.date)}
                    </td>


                    <td>

                        <strong>
                            ${schedule.primary}
                        </strong>

                    </td>


                    <td>

                        <strong>
                            ${schedule.secondary}
                        </strong>

                    </td>


                    <td>

                        ${schedule.holiday

                    ? `<span class="status none">
                                   ${schedule.holidayName || 'Holiday'}
                               </span>`

                    : `<span class="status complete">
                                   Normal
                               </span>`
                }

                    </td>


                    <td>

                        ${canEdit

                    ? `<span class="status complete">
                                   Can Edit
                               </span>`

                    : `<span class="status partial">
                                   View Only
                               </span>`
                }

                    </td>


                    <td>

                        ${canEdit

                    ? `<button
                                   class="secondary-btn"
                                   onclick="editSchedule(${schedule.id})">

                                   Edit

                               </button>`

                    : `<span style="color:#888">
                                   🔒
                               </span>`
                }

                    </td>

                </tr>

            `;

        }).join('');

}



function renderTeamMembers() {

    document.querySelector('#teamMembersBody').innerHTML =

        teamMembers.map(employee => `

            <tr>

                <td>

                    <strong>
                        ${employee.name}
                    </strong>

                </td>


                <td>
                    ${employee.employeeId}
                </td>


                <td>
                    ${employee.phone}
                </td>


                <td>

                    <span class="status ${employee.role === 'Manager'
                ? 'complete'
                : 'partial'
            }">

                        ${employee.role}

                    </span>

                </td>


                <td>

                    ${employee.schedulePrivilege

                ? `<span class="status complete">
                               Allowed
                           </span>`

                : `<span class="status none">
                               Not Allowed
                           </span>`
            }

                </td>


                <td>

                    ${employee.role === 'Manager'

                ? `<span style="color:#888">
                               Manager
                           </span>`

                : `

                            <button
                                class="secondary-btn"
                                onclick="togglePrivilege(${employee.id})">

                                ${employee.schedulePrivilege
                    ? 'Remove Privilege'
                    : 'Give Privilege'
                }

                            </button>

                        `
            }

                </td>

            </tr>

        `).join('');

}



function togglePrivilege(employeeId) {

    const employee = teamMembers.find(
        x => x.id === employeeId
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

            ? `${employee.name} can now create and edit team on-calls.`

            : `${employee.name}'s schedule privilege was removed.`

    );

}



function renderHolidays() {

    const holidays = schedules.filter(
        x =>
            x.department === MANAGER_DEPARTMENT &&
            x.holiday
    );


    const body =
        document.querySelector('#holidayBody');


    if (holidays.length === 0) {

        body.innerHTML = `

            <tr>

                <td colspan="5"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#777">

                    No holiday coverage has been created.

                </td>

            </tr>

        `;

        return;

    }


    body.innerHTML = holidays.map(schedule => `

        <tr>

            <td>

                <strong>
                    ${schedule.holidayName || 'Holiday'}
                </strong>

            </td>


            <td>
                ${formatDate(schedule.date)}
            </td>


            <td>
                ${schedule.primary}
            </td>


            <td>
                ${schedule.secondary}
            </td>


            <td>

                <button
                    class="secondary-btn"
                    onclick="editSchedule(${schedule.id})">

                    Edit

                </button>

            </td>

        </tr>

    `).join('');

}



function populateEmployeeSelects() {

    const primary =
        document.querySelector('#primarySelect');

    const secondary =
        document.querySelector('#secondarySelect');


    const options = teamMembers.map(employee => `

        <option value="${employee.name}">
            ${employee.name}
        </option>

    `).join('');


    primary.innerHTML = options;

    secondary.innerHTML = options;


    if (teamMembers.length > 1) {

        secondary.selectedIndex = 1;

    }

}



function openCreateScheduleModal(isHoliday = false) {

    editingScheduleId = null;


    document.querySelector(
        '#scheduleModalTitle'
    ).textContent =

        isHoliday
            ? 'Create Holiday Coverage'
            : 'Create On-Call';


    document.querySelector(
        '#scheduleDate'
    ).value = '';


    document.querySelector(
        '#holidayCheck'
    ).checked = isHoliday;


    document.querySelector(
        '#holidayName'
    ).value = '';


    document.querySelector(
        '#holidayNameContainer'
    ).classList.toggle(
        'hidden',
        !isHoliday
    );


    populateEmployeeSelects();


    document.querySelector(
        '#scheduleModal'
    ).classList.remove('hidden');

}



function editSchedule(id) {

    const schedule = schedules.find(
        x => x.id === id
    );


    if (!schedule) {
        return;
    }


    if (schedule.department !== MANAGER_DEPARTMENT) {

        showToast(
            'You can view this department, but you cannot edit it.'
        );

        return;
    }


    editingScheduleId = id;


    populateEmployeeSelects();


    document.querySelector(
        '#scheduleModalTitle'
    ).textContent =
        'Edit On-Call';


    document.querySelector(
        '#scheduleDate'
    ).value =
        schedule.date;


    document.querySelector(
        '#primarySelect'
    ).value =
        schedule.primary;


    document.querySelector(
        '#secondarySelect'
    ).value =
        schedule.secondary;


    document.querySelector(
        '#holidayCheck'
    ).checked =
        schedule.holiday;


    document.querySelector(
        '#holidayName'
    ).value =
        schedule.holidayName || '';


    document.querySelector(
        '#holidayNameContainer'
    ).classList.toggle(
        'hidden',
        !schedule.holiday
    );


    document.querySelector(
        '#scheduleModal'
    ).classList.remove('hidden');

}



function saveSchedule() {

    const date =
        document.querySelector(
            '#scheduleDate'
        ).value;


    const primary =
        document.querySelector(
            '#primarySelect'
        ).value;


    const secondary =
        document.querySelector(
            '#secondarySelect'
        ).value;


    const holiday =
        document.querySelector(
            '#holidayCheck'
        ).checked;


    const holidayName =
        document.querySelector(
            '#holidayName'
        ).value.trim();


    if (!date) {

        alert(
            'Please select a date.'
        );

        return;
    }


    if (primary === secondary) {

        alert(
            'Primary and Secondary cannot be the same employee.'
        );

        return;
    }


    if (holiday && !holidayName) {

        alert(
            'Please enter the holiday name.'
        );

        return;
    }


    if (editingScheduleId !== null) {

        const schedule = schedules.find(
            x => x.id === editingScheduleId
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
            holiday ? holidayName : '';

    }

    else {

        schedules.push({

            id: Date.now(),

            department:
                MANAGER_DEPARTMENT,

            date,

            primary,

            secondary,

            holiday,

            holidayName:
                holiday
                    ? holidayName
                    : ''

        });

    }


    closeModals();

    renderEverything();


    showToast(
        'On-call schedule saved successfully.'
    );

}



function updateStats() {

    document.querySelector(
        '#teamMemberCount'
    ).textContent =
        teamMembers.length;


    document.querySelector(
        '#editorCount'
    ).textContent =
        teamMembers.filter(
            x =>
                x.schedulePrivilege &&
                x.role !== 'Manager'
        ).length;


    document.querySelector(
        '#holidayCount'
    ).textContent =
        schedules.filter(
            x =>
                x.department === MANAGER_DEPARTMENT &&
                x.holiday
        ).length;


    const todaySchedule =
        schedules.find(
            x =>
                x.department === MANAGER_DEPARTMENT &&
                x.date === '2026-09-10'
        );


    document.querySelector(
        '#primaryToday'
    ).textContent =

        todaySchedule
            ? todaySchedule.primary
            : '—';


    document.querySelector(
        '#secondaryToday'
    ).textContent =

        todaySchedule
            ? todaySchedule.secondary
            : '—';

}



function renderEverything() {

    renderMyDepartment();

    renderAllSchedules();

    renderTeamMembers();

    renderHolidays();

    updateStats();

}



function showSection(sectionId) {

    document
        .querySelectorAll('.manager-section')
        .forEach(section => {

            section.classList.add('hidden');

        });


    document
        .querySelector(`#${sectionId}`)
        .classList.remove('hidden');

}



document
    .querySelectorAll('[data-section]')
    .forEach(button => {

        button.onclick = () => {

            document
                .querySelectorAll('[data-section]')
                .forEach(x =>
                    x.classList.remove('active')
                );


            button.classList.add('active');


            showSection(
                button.dataset.section
            );


            document
                .querySelector('.sidebar')
                .classList.remove('open');

        };

    });



document.querySelector(
    '#scheduleSearch'
).oninput = e => {

    renderAllSchedules(
        e.target.value
    );

};



document.querySelector(
    '#createScheduleBtn'
).onclick = () => {

    openCreateScheduleModal(false);

};



document.querySelector(
    '#createScheduleBtn2'
).onclick = () => {

    openCreateScheduleModal(false);

};



document.querySelector(
    '#addHolidayBtn'
).onclick = () => {

    openCreateScheduleModal(true);

};



document
    .querySelectorAll('[data-open-schedule]')
    .forEach(button => {

        button.onclick = () => {

            showSection(
                'scheduleSection'
            );

        };

    });



document.querySelector(
    '#holidayCheck'
).onchange = e => {

    document.querySelector(
        '#holidayNameContainer'
    ).classList.toggle(
        'hidden',
        !e.target.checked
    );

};



document.querySelector(
    '#saveScheduleBtn'
).onclick =
    saveSchedule;



function closeModals() {

    document
        .querySelectorAll(
            '.modal-backdrop'
        )
        .forEach(modal => {

            modal.classList.add(
                'hidden'
            );

        });

}



document
    .querySelectorAll('.close-modal')
    .forEach(button => {

        button.onclick =
            closeModals;

    });



document
    .querySelectorAll(
        '.modal-backdrop'
    )
    .forEach(modal => {

        modal.onclick = e => {

            if (e.target === modal) {

                closeModals();

            }

        };

    });



function showToast(message) {

    const toast =
        document.querySelector(
            '#toast'
        );


    toast.textContent =
        '✓ ' + message;


    toast.classList.remove(
        'hidden'
    );


    setTimeout(
        () => {

            toast.classList.add(
                'hidden'
            );

        },
        3000
    );

}



document.querySelector(
    '.mobile-menu'
).onclick = () => {

    document
        .querySelector('.sidebar')
        .classList.toggle('open');

};



function tick() {

    document.querySelector(
        '#currentTime'
    ).textContent =

        new Intl.DateTimeFormat(
            'en-GB',
            {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            }
        ).format(
            new Date()
        );

}



tick();

setInterval(
    tick,
    60000
);



renderEverything();