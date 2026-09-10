const adminTeams=[
 ['ERP Applications','Enterprise Systems','Complete','complete',['Ahmed','Mohamed','Sara','Ahmed','Omar','Mohamed','Sara']],
 ['Integration','Digital Platforms','Complete','complete',['Karim','Karim','Ali','Ali','Omar','Omar','Karim']],
 ['Database','Infrastructure','Complete','complete',['Hany','Hany','Ahmed','Ahmed','Ali','Ali','Hany']],
 ['Network','Technology Operations','Partial','partial',['Omar','Sara','Sara','—','Karim','Omar','Omar']],
 ['Billing','Revenue Management','Partial','partial',['Mona','Mona','—','Ali','Ali','Mona','Mona']],
 ['Security Operations','Cyber Security','No schedule','none',['—','—','—','—','—','—','—']]
];
function renderAdmin(q=''){document.querySelector('#adminBody').innerHTML=adminTeams.filter(x=>(x[0]+x[1]).toLowerCase().includes(q.toLowerCase())).map(x=>`<tr><td class="team-cell"><strong>${x[0]}</strong><small>${x[1]}</small></td><td><span class="status ${x[3]}">${x[2]}</span></td>${x[4].map(p=>`<td class="${p==='—'?'missing-cell':''}">${p}</td>`).join('')}<td>›</td></tr>`).join('')}
document.querySelector('#adminSearch').oninput=e=>renderAdmin(e.target.value);document.querySelector('.mobile-menu').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');
function tick(){document.querySelector('#currentTime').textContent=new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date())}tick();setInterval(tick,60000);renderAdmin();
