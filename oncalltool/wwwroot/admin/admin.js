const managerTeams = [

    [
        'ERP Applications',
        'Enterprise Systems',
        'Complete',
        'complete',
        [
            'Ahmed',
            'Mohamed',
            'Sara',
            'Ahmed',
            'Omar',
            'Mohamed',
            'Sara'
        ]
    ],

    [
        'Integration',
        'Digital Platforms',
        'Complete',
        'complete',
        [
            'Karim',
            'Karim',
            'Ali',
            'Ali',
            'Omar',
            'Omar',
            'Karim'
        ]
    ],

    [
        'Database',
        'Infrastructure',
        'Complete',
        'complete',
        [
            'Hany',
            'Hany',
            'Ahmed',
            'Ahmed',
            'Ali',
            'Ali',
            'Hany'
        ]
    ],

    [
        'Network',
        'Technology Operations',
        'Partial',
        'partial',
        [
            'Omar',
            'Sara',
            'Sara',
            '—',
            'Karim',
            'Omar',
            'Omar'
        ]
    ],

    [
        'Billing',
        'Revenue Management',
        'Partial',
        'partial',
        [
            'Mona',
            'Mona',
            '—',
            'Ali',
            'Ali',
            'Mona',
            'Mona'
        ]
    ],

    [
        'Security Operations',
        'Cyber Security',
        'No schedule',
        'none',
        [
            '—',
            '—',
            '—',
            '—',
            '—',
            '—',
            '—'
        ]
    ]

];



function renderManager(search = '') {

    const filteredTeams = managerTeams.filter(team => {

        const searchableText =
            (team[0] + ' ' + team[1]).toLowerCase();

        return searchableText.includes(
            search.toLowerCase()
        );

    });


    document.querySelector('#managerBody').innerHTML =

        filteredTeams.map(team => `

            <tr>

                <td class="team-cell">

                    <strong>
                        ${team[0]}
                    </strong>

                    <small>
                        ${team[1]}
                    </small>

                </td>


                <td>

                    <span class="status ${team[3]}">

                        ${team[2]}

                    </span>

                </td>


                ${team[4].map(person => `

                    <td class="${person === '—'
                ? 'missing-cell'
                : ''}">

                        ${person}

                    </td>

                `).join('')}


                <td>
                    ›
                </td>

            </tr>

        `).join('');

}



// SEARCH

document.querySelector('#managerSearch').oninput = e => {

    renderManager(
        e.target.value
    );

};



// MOBILE MENU

document.querySelector('.mobile-menu').onclick = () => {

    document
        .querySelector('.sidebar')
        .classList
        .toggle('open');

};



// CLOCK

function tick() {

    document.querySelector('#currentTime').textContent =

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


// INITIAL LOAD

renderManager();