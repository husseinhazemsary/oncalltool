const employeeId = 'EMP001';
const employeeApi = `/api/employee`;

let contacts = [];
let preferred = [];
let allTeams = [];
let weekPeople = [];
let replacementEmployees = {};
let weekDays = [];
let futureDuties = [];

const scheduleOverrides = new Map();

async function apiRequest(path, options = {}) {
  const response = await fetch(`${employeeApi}${path}`, {
    cache: 'no-store',
    headers: {'Content-Type': 'application/json'},
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Unable to load employee data.');
  }

  return response.json();
}

function applyDashboard(data) {
  contacts = data.contacts;
  preferred = data.preferredTeams;
  allTeams = data.allTeams;
  weekPeople = data.weekPeople;
  weekDays = data.weekDays;
  futureDuties = data.futureDuties;
  replacementEmployees = data.replacementEmployees;

  scheduleOverrides.clear();
  data.scheduleOverrides.forEach(x => scheduleOverrides.set(x.key, x.person));

  document.querySelector('.signed-in .avatar').textContent = data.employee.initials;
  document.querySelector('.signed-in strong').textContent = data.employee.name;
  document.querySelector('.signed-in small').textContent = data.employee.team;
}

function renderDashboard() {
  renderContacts(document.querySelector('#contactSearch').value);
  renderChips();
  renderWeek();
}

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
      <article class="contact-card"
               data-team="${esc(x.team)}"
               tabindex="0"
               role="button"
               aria-label="View current on-call coverage for ${esc(x.team)}">
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
function showCurrentTeamCoverage(teamElement) {
  const team = contacts.find(
    item => item.team === teamElement.dataset.team
  );

  if (!team) return;

  document.querySelector('#coverageTeam').textContent =
    team.team.toUpperCase();

  document.querySelector('#coverageDate').textContent =
    'On-call now';

  document.querySelector('#coverageDetails').innerHTML = `
    <div class="current-duty">
      <span class="primary-role">PRIMARY</span>
      <strong>${esc(team.primary.name)}</strong>
      <span>${esc(team.primary.phone)}</span>
      <span>${esc(team.primary.email)}</span>
    </div>
    <div class="current-duty">
      <span class="secondary-role">SECONDARY</span>
      <strong>${esc(team.secondary.name)}</strong>
      <span>${esc(team.secondary.phone)}</span>
      <span>${esc(team.secondary.email)}</span>
    </div>
  `;

  openModal('#coverageModal');
}

document.querySelector('#nowView').addEventListener('click', event => {
  const teamElement = event.target.closest('.contact-card[data-team]');

  if (teamElement) {
    showCurrentTeamCoverage(teamElement);
  }
});

document.querySelector('#nowView').addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;

  const teamElement = event.target.closest('.contact-card[data-team]');

  if (!teamElement) return;

  event.preventDefault();
  showCurrentTeamCoverage(teamElement);
});

document.querySelector('#weekView').onclick = e => {
  const button = e.target.closest('.coverage-cell-button');
  if (!button) return;

  showCoverageDetails(
    Number(button.dataset.teamIndex),
    Number(button.dataset.dayIndex)
  );
};

document.querySelector('#preferredChips').onclick = async e => {
  if (e.target.dataset.remove) {
    try {
      const team = encodeURIComponent(e.target.dataset.remove);
      const data = await apiRequest(
        `/preferred-teams/${team}?employeeId=${employeeId}`,
        {method: 'DELETE'}
      );
      applyDashboard(data);
      renderDashboard();
    } catch (error) {
      alert(error.message);
    }
  }
};

document.querySelector('#teamResults').onclick = async e => {
  if (e.target.dataset.add) {
    try {
      const data = await apiRequest(
        `/preferred-teams?employeeId=${employeeId}`,
        {
          method: 'POST',
          body: JSON.stringify({team: e.target.dataset.add})
        }
      );
      applyDashboard(data);
      renderDashboard();
      renderTeamResults(document.querySelector('#teamSearch').value);
    } catch (error) {
      alert(error.message);
    }
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

document.querySelector('#confirmSwap').onclick = async () => {
  const name = document.querySelector('#swapSelect').value;
  const duty = selectedDuty();
  if (!duty) return;

  try {
    const data = await apiRequest(
      `/replacements?employeeId=${employeeId}`,
      {
        method: 'POST',
        body: JSON.stringify({dutyId: duty.id, replacementName: name})
      }
    );

    applyDashboard(data);
    renderDashboard();

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
  } catch (error) {
    alert(error.message);
  }
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

async function initializeEmployeePage() {
  try {
    const data = await apiRequest(`/dashboard?employeeId=${employeeId}`);
    applyDashboard(data);
    renderDashboard();
  } catch (error) {
    document.querySelector('#nowView').innerHTML = `
      <div style="padding:30px;text-align:center;color:#d52b1e">
        ${esc(error.message)}
      </div>
    `;
  }
}

initializeEmployeePage();
