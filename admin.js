const TEAMS_KEY = "pes_teams";
const FIXTURES_KEY = "pes_fixtures";

const teamName = document.getElementById("teamName");
const teamLogo = document.getElementById("teamLogo");
const addTeamBtn = document.getElementById("addTeamBtn");
const teamsList = document.getElementById("teamsList");

const generateFixturesBtn = document.getElementById("generateFixturesBtn");
const clearFixturesBtn = document.getElementById("clearFixturesBtn");
const fixturesList = document.getElementById("fixturesList");

const fixtureSelect = document.getElementById("fixtureSelect");
const matchForm = document.getElementById("matchForm");
const selectedMatchPreview = document.getElementById("selectedMatchPreview");
const homeScore = document.getElementById("homeScore");
const awayScore = document.getElementById("awayScore");

const homeScorers = document.getElementById("homeScorers");
const awayScorers = document.getElementById("awayScorers");
const addHomeScorerBtn = document.getElementById("addHomeScorerBtn");
const addAwayScorerBtn = document.getElementById("addAwayScorerBtn");
const saveResultBtn = document.getElementById("saveResultBtn");

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

function getTeams() {
  return JSON.parse(localStorage.getItem(TEAMS_KEY)) || [];
}

function saveTeams(teams) {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

function getFixtures() {
  return JSON.parse(localStorage.getItem(FIXTURES_KEY)) || [];
}

function saveFixtures(fixtures) {
  localStorage.setItem(FIXTURES_KEY, JSON.stringify(fixtures));
}

function getTeamById(id) {
  return getTeams().find(t => t.id === id);
}

function addTeam() {
  const name = teamName.value.trim();
  const logo = teamLogo.value.trim();

  if (!name) {
    alert("Takım adı gir.");
    return;
  }

  const teams = getTeams();

  if (teams.some(t => t.name.toLowerCase() === name.toLowerCase())) {
    alert("Bu takım zaten eklenmiş.");
    return;
  }

  teams.push({
    id: Date.now().toString(),
    name,
    logo
  });

  saveTeams(teams);
  teamName.value = "";
  teamLogo.value = "";
  renderTeams();
}

function deleteTeam(id) {
  const teams = getTeams().filter(t => t.id !== id);
  saveTeams(teams);
  renderTeams();
}

function renderTeams() {
  const teams = getTeams();
  teamsList.innerHTML = "";

  if (teams.length === 0) {
    teamsList.innerHTML = `<div class="small">Henüz takım yok.</div>`;
    return;
  }

  teams.forEach(team => {
    const div = document.createElement("div");
    div.className = "player-item";
    div.innerHTML = `
      <div class="player-row">
        <div>
          <strong>${team.name}</strong>
          <div class="small">${team.logo || "Logo eklenmedi"}</div>
        </div>
        <button class="icon-btn" onclick="deleteTeam('${team.id}')">×</button>
      </div>
    `;
    teamsList.appendChild(div);
  });
}

/*
  FİKSTÜR SİSTEMİ:
  - Her takım her rakiple 4 kez oynar
  - 2 iç saha / 2 deplasman
  - Haftalık sistem
  - Aynı haftada mümkün olduğunca herkes maç yapar
*/
function generateFixtures() {
  const teams = getTeams();

  if (teams.length < 2) {
    alert("Önce takımları ekle.");
    return;
  }

  const fixtures = [];
  let teamList = [...teams];

  // Tek sayıysa BAY ekle
  if (teamList.length % 2 !== 0) {
    teamList.push({ id: "bye", name: "BAY" });
  }

  const n = teamList.length;
  const roundsPerCycle = n - 1;
  const matchesPerRound = n / 2;

  function createRounds(reverseHomeAway = false) {
    let arr = [...teamList];
    const rounds = [];

    for (let round = 0; round < roundsPerCycle; round++) {
      const roundMatches = [];

      for (let i = 0; i < matchesPerRound; i++) {
        const teamA = arr[i];
        const teamB = arr[n - 1 - i];

        if (teamA.id !== "bye" && teamB.id !== "bye") {
          let home, away;

          // Ev/deplasman dağılımını dengele
          if ((round + i) % 2 === 0) {
            home = reverseHomeAway ? teamB.id : teamA.id;
            away = reverseHomeAway ? teamA.id : teamB.id;
          } else {
            home = reverseHomeAway ? teamA.id : teamB.id;
            away = reverseHomeAway ? teamB.id : teamA.id;
          }

          roundMatches.push({ home, away });
        }
      }

      rounds.push(roundMatches);

      // Rotation (ilk takım sabit)
      const fixed = arr[0];
      const rest = arr.slice(1);
      rest.unshift(rest.pop());
      arr = [fixed, ...rest];
    }

    return rounds;
  }

  // 4 devre
  const cycle1 = createRounds(false);
  const cycle2 = createRounds(true);
  const cycle3 = createRounds(false);
  const cycle4 = createRounds(true);

  const allRounds = [...cycle1, ...cycle2, ...cycle3, ...cycle4];

  let globalMatchIndex = 1;

  allRounds.forEach((roundMatches, weekIndex) => {
    roundMatches.forEach(match => {
      fixtures.push({
        id: `m_${Date.now()}_${globalMatchIndex++}`,
        week: weekIndex + 1,
        home: match.home,
        away: match.away,
        homeScore: null,
        awayScore: null,
        played: false,
        homeScorers: [],
        awayScorers: []
      });
    });
  });

  saveFixtures(fixtures);
  renderFixtures();
  renderFixtureSelect();
  alert("4 maçlık lig fikstürü oluşturuldu.");
}

function clearFixtures() {
  if (!confirm("Tüm fikstürü silmek istiyor musun?")) return;
  localStorage.removeItem(FIXTURES_KEY);
  renderFixtures();
  renderFixtureSelect();
}

function renderFixtures() {
  const fixtures = getFixtures();
  fixturesList.innerHTML = "";

  if (fixtures.length === 0) {
    fixturesList.innerHTML = `<div class="small">Henüz fikstür yok.</div>`;
    return;
  }

  const grouped = {};

  fixtures.forEach(match => {
    if (!grouped[match.week]) grouped[match.week] = [];
    grouped[match.week].push(match);
  });

  Object.keys(grouped).forEach(week => {
    const weekBox = document.createElement("div");
    weekBox.className = "fixture-week-box";
    weekBox.innerHTML = `<h3 style="margin-bottom:10px;">Hafta ${week}</h3>`;

    grouped[week].forEach(match => {
      const home = getTeamById(match.home);
      const away = getTeamById(match.away);

      const div = document.createElement("div");
      div.className = "fixture-item";
      div.innerHTML = `
        <div class="fixture-row">
          <div>
            <strong>${home?.name || "?"} vs ${away?.name || "?"}</strong>
          </div>
          <div class="status ${match.played ? "done" : "pending"}">
            ${match.played ? `${match.homeScore} - ${match.awayScore}` : "Bekliyor"}
          </div>
        </div>
      `;
      weekBox.appendChild(div);
    });

    fixturesList.appendChild(weekBox);
  });
}

function renderFixtureSelect() {
  const fixtures = getFixtures();
  fixtureSelect.innerHTML = `<option value="">Maç seç</option>`;

  fixtures.forEach(match => {
    const home = getTeamById(match.home);
    const away = getTeamById(match.away);

    const option = document.createElement("option");
    option.value = match.id;
    option.textContent = `Hafta ${match.week} - ${home?.name || "?"} vs ${away?.name || "?"}`;
    fixtureSelect.appendChild(option);
  });
}

function createScorerRow(container, scorer = "", goals = 1) {
  const row = document.createElement("div");
  row.className = "scorer-row";
  row.innerHTML = `
    <input type="text" placeholder="Futbolcu adı" class="scorer-name" value="${scorer}">
    <input type="number" placeholder="Gol" class="scorer-goals" min="1" value="${goals}">
    <button class="icon-btn">×</button>
  `;

  row.querySelector("button").addEventListener("click", () => row.remove());
  container.appendChild(row);
}

fixtureSelect.addEventListener("change", () => {
  const fixtures = getFixtures();
  const match = fixtures.find(m => m.id === fixtureSelect.value);

  if (!match) {
    matchForm.classList.add("hidden");
    selectedMatchPreview.textContent = "Henüz maç seçilmedi.";
    return;
  }

  const home = getTeamById(match.home);
  const away = getTeamById(match.away);

  selectedMatchPreview.innerHTML = `
    <strong>${home?.name || "?"}</strong> vs <strong>${away?.name || "?"}</strong>
  `;

  matchForm.classList.remove("hidden");
  homeScore.value = match.homeScore ?? "";
  awayScore.value = match.awayScore ?? "";

  homeScorers.innerHTML = "";
  awayScorers.innerHTML = "";

  if (match.homeScorers.length) {
    match.homeScorers.forEach(s => createScorerRow(homeScorers, s.name, s.goals));
  }

  if (match.awayScorers.length) {
    match.awayScorers.forEach(s => createScorerRow(awayScorers, s.name, s.goals));
  }
});

addHomeScorerBtn.addEventListener("click", () => createScorerRow(homeScorers));
addAwayScorerBtn.addEventListener("click", () => createScorerRow(awayScorers));

function collectScorers(container) {
  const rows = container.querySelectorAll(".scorer-row");
  const data = [];

  rows.forEach(row => {
    const name = row.querySelector(".scorer-name").value.trim();
    const goals = parseInt(row.querySelector(".scorer-goals").value) || 0;

    if (name && goals > 0) {
      data.push({ name, goals });
    }
  });

  return data;
}

function saveResult() {
  const fixtures = getFixtures();
  const matchIndex = fixtures.findIndex(m => m.id === fixtureSelect.value);

  if (matchIndex === -1) {
    alert("Maç seç.");
    return;
  }

  const hs = parseInt(homeScore.value);
  const as = parseInt(awayScore.value);

  if (isNaN(hs) || isNaN(as)) {
    alert("Skor gir.");
    return;
  }

  fixtures[matchIndex].homeScore = hs;
  fixtures[matchIndex].awayScore = as;
  fixtures[matchIndex].played = true;
  fixtures[matchIndex].homeScorers = collectScorers(homeScorers);
  fixtures[matchIndex].awayScorers = collectScorers(awayScorers);

  saveFixtures(fixtures);
  renderFixtures();
  renderFixtureSelect();

  alert("Maç sonucu kaydedildi.");
}

addTeamBtn.addEventListener("click", addTeam);
generateFixturesBtn.addEventListener("click", generateFixtures);
clearFixturesBtn.addEventListener("click", clearFixtures);
saveResultBtn.addEventListener("click", saveResult);

window.deleteTeam = deleteTeam;

renderTeams();
renderFixtures();
renderFixtureSelect();