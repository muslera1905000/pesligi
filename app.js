const TEAMS_KEY = "pes_teams";
const FIXTURES_KEY = "pes_fixtures";

const statPlayers = document.getElementById("statPlayers");
const statPlayed = document.getElementById("statPlayed");
const statGoals = document.getElementById("statGoals");
const standingsTable = document.getElementById("standingsTable");
const fixturesPublic = document.getElementById("fixturesPublic");
const scorersTable = document.getElementById("scorersTable");

function getTeams() {
  return JSON.parse(localStorage.getItem(TEAMS_KEY)) || [];
}

function getFixtures() {
  return JSON.parse(localStorage.getItem(FIXTURES_KEY)) || [];
}

function renderStats() {
  const teams = getTeams();
  const fixtures = getFixtures();

  const playedMatches = fixtures.filter(f => f.played);
  const totalGoals = playedMatches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0);

  statPlayers.textContent = teams.length;
  statPlayed.textContent = playedMatches.length;
  statGoals.textContent = totalGoals;
}

function calculateStandings() {
  const teams = getTeams();
  const fixtures = getFixtures();

  const table = teams.map(t => ({
    id: t.id,
    name: t.name,
    logo: t.logo,
    played: 0,
    win: 0,
    draw: 0,
    lose: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0
  }));

  fixtures.forEach(match => {
    if (!match.played) return;

    const home = table.find(t => t.id === match.home);
    const away = table.find(t => t.id === match.away);

    home.played++;
    away.played++;

    home.gf += match.homeScore;
    home.ga += match.awayScore;

    away.gf += match.awayScore;
    away.ga += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.win++;
      away.lose++;
      home.pts += 3;
    } else if (match.homeScore < match.awayScore) {
      away.win++;
      home.lose++;
      away.pts += 3;
    } else {
      home.draw++;
      away.draw++;
      home.pts += 1;
      away.pts += 1;
    }
  });

  table.forEach(t => {
    t.gd = t.gf - t.ga;
  });

  table.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  return table;
}

function renderStandings() {
  const standings = calculateStandings();
  standingsTable.innerHTML = "";

  standings.forEach((team, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="team-name">${team.name}</td>
      <td>${team.played}</td>
      <td>${team.win}</td>
      <td>${team.draw}</td>
      <td>${team.lose}</td>
      <td>${team.gf}</td>
      <td>${team.ga}</td>
      <td>${team.gd}</td>
      <td><strong>${team.pts}</strong></td>
    `;
    standingsTable.appendChild(tr);
  });
}

function renderFixtures() {
  const fixtures = getFixtures();
  const teams = getTeams();
  fixturesPublic.innerHTML = "";

  if (fixtures.length === 0) {
    fixturesPublic.innerHTML = `<div class="small">Henüz fikstür yok.</div>`;
    return;
  }

  fixtures.forEach(match => {
    const home = teams.find(t => t.id === match.home);
    const away = teams.find(t => t.id === match.away);

    const div = document.createElement("div");
    div.className = "fixture-item";

    div.innerHTML = `
      <div class="fixture-row">
        <div>
          <strong>Hafta ${match.week}</strong>
          <div class="small">${home?.name || "?"} vs ${away?.name || "?"}</div>
        </div>
        <div>
          ${
            match.played
              ? `<div class="fixture-score">${match.homeScore} - ${match.awayScore}</div>`
              : `<div class="status pending">Bekliyor</div>`
          }
        </div>
      </div>
    `;

    fixturesPublic.appendChild(div);
  });
}

function renderScorers() {
  const fixtures = getFixtures();
  const scorerMap = {};

  fixtures.forEach(match => {
    if (!match.played) return;

    [...match.homeScorers, ...match.awayScorers].forEach(scorer => {
      if (!scorerMap[scorer.name]) scorerMap[scorer.name] = 0;
      scorerMap[scorer.name] += scorer.goals;
    });
  });

  const sorted = Object.entries(scorerMap)
    .map(([name, goals]) => ({ name, goals }))
    .sort((a, b) => b.goals - a.goals);

  scorersTable.innerHTML = "";

  if (sorted.length === 0) {
    scorersTable.innerHTML = `<div class="small">Henüz gol kaydı yok.</div>`;
    return;
  }

  sorted.forEach((player, index) => {
    const div = document.createElement("div");
    div.className = "scorer-item";
    div.innerHTML = `
      <div class="fixture-row">
        <div>
          <strong>${index + 1}. ${player.name}</strong>
        </div>
        <div class="badge">${player.goals} Gol</div>
      </div>
    `;
    scorersTable.appendChild(div);
  });
}

renderStats();
renderStandings();
renderFixtures();
renderScorers();