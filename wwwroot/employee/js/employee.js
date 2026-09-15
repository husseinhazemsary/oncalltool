const contacts = [
  {team:'ERP Applications',area:'Enterprise Systems',primary:{name:'Ahmed Mohamed',phone:'+20 12 1000 4521',email:'ahmed.mohamed@company.com',initials:'AM'},secondary:{name:'Mohamed Hassan',phone:'+20 12 1000 4522',email:'mohamed.hassan@company.com',initials:'MH'}},
  {team:'Integration',area:'Digital Platforms',primary:{name:'Omar Hassan',phone:'+20 12 1834 0192',email:'omar.hassan@company.com',initials:'OH'},secondary:{name:'Sara Ibrahim',phone:'+20 12 4431 7655',email:'sara.ibrahim@company.com',initials:'SI'}},
  {team:'Database',area:'Infrastructure',primary:{name:'Mahmoud Ali',phone:'+20 10 7723 8841',email:'mahmoud.ali@company.com',initials:'MA'},secondary:{name:'Karim Ali',phone:'+20 12 1000 4525',email:'karim.ali@company.com',initials:'KA'}},
  {team:'Infrastructure',area:'Technology Operations',primary:{name:'Mostafa Ahmed',phone:'+20 11 0298 3317',email:'mostafa.ahmed@company.com',initials:'MA'},secondary:{name:'Omar Khalil',phone:'+20 12 1000 4524',email:'omar.khalil@company.com',initials:'OK'}},
  {team:'Network',area:'Technology Operations',primary:{name:'Sara Ibrahim',phone:'+20 12 4431 7655',email:'sara.ibrahim@company.com',initials:'SI'},secondary:{name:'Ahmed Mohamed',phone:'+20 12 1000 4521',email:'ahmed.mohamed@company.com',initials:'AM'}}
];

let preferred = contacts.map(x => x.team);

const allTeams = [
  {name:'CRM',area:'Customer Platforms'},
  {name:'Billing',area:'Revenue Management'},
  {name:'Revenue Assurance',area:'Revenue Management'},
  {name:'Fraud Management',area:'Enterprise Systems'},
  {name:'Security Operations',area:'Cyber Security'},
  {name:'Data Warehouse',area:'Data & Analytics'},
  {name:'Data Analytics',area:'Data & Analytics'},
  {name:'Data Integration',area:'Data & Analytics'},
  ...contacts.map(x => ({name:x.team,area:x.area}))
];

const weekPeople = [
  {name:'Ahmed Mohamed',phone:'+20 12 1000 4521',email:'ahmed.mohamed@company.com'},
  {name:'Mohamed Hassan',phone:'+20 12 1000 4522',email:'mohamed.hassan@company.com'},
  {name:'Sara Ibrahim',phone:'+20 12 4431 7655',email:'sara.ibrahim@company.com'},
  {name:'Omar Khalil',phone:'+20 12 1000 4524',email:'omar.khalil@company.com'},
  {name:'Karim Ali',phone:'+20 12 1000 4525',email:'karim.ali@company.com'}
];

const replacementEmployees = {
  'Mohamed Hassan': {name:'Mohamed Hassan',phone:'+20 12 1000 4522',email:'mohamed.hassan@company.com',initials:'MH'},
  'Sara Ibrahim': {name:'Sara Ibrahim',phone:'+20 12 4431 7655',email:'sara.ibrahim@company.com',initials:'SI'},
  'Omar Khalil': {name:'Omar Khalil',phone:'+20 12 1000 4524',email:'omar.khalil@company.com',initials:'OK'}
};

const weekDays = [
  {date:'2026-09-14',label:'Mon 14'},
  {date:'2026-09-15',label:'Tue 15'},
  {date:'2026-09-16',label:'Wed 16'},
  {date:'2026-09-17',label:'Thu 17'},
  {date:'2026-09-18',label:'Fri 18'},
  {date:'2026-09-19',label:'Sat 19'},
  {date:'2026-09-20',label:'Sun 20'}
];

const futureDuties = [
  {id:'duty-1',date:'2026-09-14',team:'ERP Applications',role:'Primary'},
  {id:'duty-2',date:'2026-09-18',team:'ERP Applications',role:'Secondary'},
  {id:'duty-3',date:'2026-09-25',team:'ERP Applications',role:'Primary'},
  {id:'duty-4',date:'2026-10-05',team:'ERP Applications',role:'Secondary'},
  {id:'duty-5',date:'2026-10-12',team:'ERP Applications',role:'Primary'}
];

const scheduleOverrides = new Map();

const esc = s => s.replace(/[&<>'"]/g, c => ({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  "'":'&#39;',
  '"':'&quot;'
}[c]));

function renderContacts(filter = '') {
  const data = contacts.filter(
    x => preferred.includes(x.team) &&
    x.team.toLowerCase().includes(filter.toLowerCase())
  );

  document.querySelector('#nowView').innerHTML = data.length
    ? data.map(x => `
      <article class="contact-card">
        <div class="team-identity">
          <span class="team-icon">${esc(x.team[0])}</span>
          <div>
            <strong>${esc(x.team)}</strong>
            <span>${esc(x.area)}</span>
          </div>
        </div>

        <div class="person coverage-person primary-contact">
          <span class="avatar">${x.primary.initials}</span>
          <div class="person-meta">
            <span class="coverage-role primary-role">PRIMARY</span>
            <strong>${esc(x.primary.name)}</strong>
            <small>${esc(x.primary.phone)} · ${esc(x.primary.email)}</small>
          </div>
        </div>

        <div class="person coverage-person secondary-contact">
          <span class="avatar">${x.secondary.initials}</span>
          <div class="person-meta">
            <span class="coverage-role secondary-role">SECONDARY</span>
            <strong>${esc(x.secondary.name)}</strong>
            <small>${esc(x.secondary.phone)} · ${esc(x.secondary.email)}</small>
          </div>
        </div>
      </article>
    `).join('')
    : '<div style="padding:30px;text-align:center;color:#777">No preferred teams match your search.</div>';
}

function renderChips() {
  document.querySelector('#preferredChips').innerHTML = preferred.map(x => `
    <span class="chip">
      ${esc(x)}
      <button data-remove="${esc(x)}" aria-label="Remove ${esc(x)}">×</button>
    </span>
  `).join('');
}

function renderWeek() {
  const weekContact = (person, role) => `
    <div class="week-contact">
      <span class="week-role ${role.toLowerCase()}-week">${role}</span>
      <strong>${esc(person.name)}</strong>
    </div>
  `;

  document.querySelector('#weekView').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Team</th>
          ${weekDays.map(x => `<th>${x.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${preferred.map((team, teamIndex) => `
          <tr>
            <td><strong>${esc(team)}</strong></td>
            ${weekDays.map((day, dayIndex) => {
              const primaryIndex = (dayIndex + teamIndex) % weekPeople.length;
              const secondaryIndex = (primaryIndex + 1) % weekPeople.length;
              const primary = scheduleOverrides.get(`${team}|${day.date}|Primary`) || weekPeople[primaryIndex];
              const secondary = scheduleOverrides.get(`${team}|${day.date}|Secondary`) || weekPeople[secondaryIndex];

              return `
                <td>
                  <button class="coverage-cell-button"
                          data-team-index="${teamIndex}"
                          data-day-index="${dayIndex}"
                          aria-label="View ${esc(team)} coverage for ${day.label}">
                    ${weekContact(primary, 'PRIMARY')}
                    ${weekContact(secondary, 'SECONDARY')}
                  </button>
                </td>
              `;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function showCoverageDetails(teamIndex, dayIndex) {
  const team = preferred[teamIndex];
  const primaryIndex = (dayIndex + teamIndex) % weekPeople.length;
  const secondaryIndex = (primaryIndex + 1) % weekPeople.length;
  const day = weekDays[dayIndex];
  const primary = scheduleOverrides.get(`${team}|${day.date}|Primary`) || weekPeople[primaryIndex];
  const secondary = scheduleOverrides.get(`${team}|${day.date}|Secondary`) || weekPeople[secondaryIndex];

  document.querySelector('#coverageTeam').textContent = team.toUpperCase();
  document.querySelector('#coverageDate').textContent = day.label;
  document.querySelector('#coverageDetails').innerHTML = `
    <div class="current-duty">
      <span class="primary-role">PRIMARY</span>
      <strong>${esc(primary.name)}</strong>
      <span>${esc(primary.phone)}</span>
      <span>${esc(primary.email)}</span>
    </div>
    <div class="current-duty">
      <span class="secondary-role">SECONDARY</span>
      <strong>${esc(secondary.name)}</strong>
      <span>${esc(secondary.phone)}</span>
      <span>${esc(secondary.email)}</span>
    </div>
  `;

  openModal('#coverageModal');
}

function renderTeamResults(q = '') {
  const matches = allTeams
    .filter(x => x.name.toLowerCase().includes(q.toLowerCase()))
    .filter(x => !preferred.includes(x.name))
    .slice(0, 6);

  document.querySelector('#teamResults').innerHTML = matches.length
    ? matches.map(x => `
      <div class="team-result">
        <div>
          <strong>${esc(x.name)}</strong>
          <small>${esc(x.area)}</small>
        </div>
        <button class="add-link" data-add="${esc(x.name)}">+ Add</button>
      </div>
    `).join('')
    : '<div style="padding:25px 0;color:#777;text-align:center">No matching teams found.</div>';
}

function openModal(id) {
  document.querySelector(id).classList.remove('hidden');
}

function closeModals() {
  document.querySelectorAll('.modal-backdrop')
    .forEach(x => x.classList.add('hidden'));
}

function formatDutyDate(dateValue) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday:'long',
    day:'numeric',
    month:'long'
  }).format(new Date(`${dateValue}T12:00:00`));
}

function renderDutyOptions() {
  const dutySelect = document.querySelector('#dutySelect');

  dutySelect.innerHTML = futureDuties.map(duty => `
    <option value="${duty.id}">
      ${formatDutyDate(duty.date)} · ${duty.team} · ${duty.role}
    </option>
  `).join('');

  updateSelectedDuty();
}

function selectedDuty() {
  return futureDuties.find(
    duty => duty.id === document.querySelector('#dutySelect').value
  );
}

function updateSelectedDuty() {
  const duty = selectedDuty();
  if (!duty) return;

  document.querySelector('#selectedDuty').innerHTML = `
    <span>Selected duty</span>
    <strong>${formatDutyDate(duty.date)} · ${duty.role}</strong>
  `;

  swapPreview();
}

function swapPreview() {
  const name = document.querySelector('#swapSelect').value;
  const duty = selectedDuty();
  if (!duty) return;

  document.querySelector('#swapPreview').innerHTML = `
    <span>Change summary</span>
    <strong>${name} will replace you as ${duty.role} on ${formatDutyDate(duty.date)}. You will be off-duty for this duty.</strong>
  `;
}

document.querySelectorAll('[data-view]').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('active'));
    button.classList.add('active');

    document.querySelector('#nowView')
      .classList.toggle('hidden', button.dataset.view !== 'now');

    document.querySelector('#weekView')
      .classList.toggle('hidden', button.dataset.view !== 'week');

    document.querySelector('.content-grid')
      .classList.toggle('week-mode', button.dataset.view === 'week');

    renderWeek();
  };
});

document.querySelector('#contactSearch').oninput = e => {
  renderContacts(e.target.value);
};

document.querySelector('#weekView').onclick = e => {
  const button = e.target.closest('.coverage-cell-button');
  if (!button) return;

  showCoverageDetails(
    Number(button.dataset.teamIndex),
    Number(button.dataset.dayIndex)
  );
};

document.querySelector('#preferredChips').onclick = e => {
  if (e.target.dataset.remove) {
    preferred = preferred.filter(x => x !== e.target.dataset.remove);
    renderChips();
    renderContacts();
    renderWeek();
  }
};

document.querySelector('#teamResults').onclick = e => {
  if (e.target.dataset.add) {
    preferred.push(e.target.dataset.add);
    renderChips();
    renderContacts();
    renderTeamResults(document.querySelector('#teamSearch').value);
  }
};

document.querySelector('#teamSearch').oninput = e => {
  renderTeamResults(e.target.value);
};

document.querySelector('#addTeamBtn').onclick = () => {
  openModal('#teamModal');
  renderTeamResults();
};

document.querySelector('#findTeamBtn').onclick = () => {
  openModal('#teamModal');
  renderTeamResults();
};

document.querySelector('#swapBtn').onclick = () => {
  openModal('#swapModal');
  renderDutyOptions();
};

document.querySelector('#dutySelect').onchange = updateSelectedDuty;
document.querySelector('#swapSelect').onchange = swapPreview;

document.querySelectorAll('.close-modal').forEach(x => {
  x.onclick = closeModals;
});

document.querySelectorAll('.modal-backdrop').forEach(x => {
  x.onclick = e => {
    if (e.target === x) closeModals();
  };
});

document.querySelector('#confirmSwap').onclick = () => {
  const name = document.querySelector('#swapSelect').value;
  const replacement = replacementEmployees[name];
  const duty = selectedDuty();
  if (!duty) return;

  scheduleOverrides.set(
    `${duty.team}|${duty.date}|${duty.role}`,
    {...replacement}
  );

  if (duty.date === '2026-09-14') {
    const erpContact = contacts.find(x => x.team === duty.team);
    erpContact[duty.role.toLowerCase()] = {...replacement};
    renderContacts();
  }

  renderWeek();

  if (duty.date === '2026-09-14') {
    document.querySelector('.my-oncall .panel-head h2').textContent = 'You are off-duty';
    document.querySelector('.date-block > div:last-child span').textContent =
      `${name} is now ${duty.role} on-call`;
  }

  closeModals();

  const toast = document.querySelector('#toast');
  toast.textContent = `✓ ${name} is now ${duty.role} on-call for ${formatDutyDate(duty.date)}`;
  toast.classList.remove('hidden');

  setTimeout(() => toast.classList.add('hidden'), 3000);
};

document.querySelector('.mobile-menu').onclick = () => {
  document.querySelector('.sidebar').classList.toggle('open');
};

function tick() {
  document.querySelector('#currentTime').textContent =
    new Intl.DateTimeFormat('en-GB', {
      weekday:'short',
      day:'numeric',
      month:'short',
      hour:'2-digit',
      minute:'2-digit'
    }).format(new Date());
}

tick();
setInterval(tick, 60000);

renderContacts();
renderChips();
renderWeek();
