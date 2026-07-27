// Глобальные данные для модалок
let globalTeams = [];
let globalPlayers = [];

document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector("nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      nav.classList.toggle("open");
      burger.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        burger.classList.remove("open");
      });
    });
  }

  document.getElementById("adminBtn")?.addEventListener("click", () => {
    window.location.href = "admin.html";
  });

  // Закрытие модалок
  document.querySelectorAll(".modal-overlay").forEach(ov => {
    ov.addEventListener("click", e => {
      if (e.target === ov) closeAllModals();
    });
  });
  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", closeAllModals);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAllModals();
  });

  initScrollAnimations();
  loadAllData();
  setTimeout(initTableSorting, 500);
});

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  document.body.style.overflow = "";
}

async function loadAllData() {
  try {
    const [teamsSnap, matchesSnap, newsSnap, adsSnap, playersSnap, totwSnap] = await Promise.all([
      db.ref("teams").once("value"),
      db.ref("matches").once("value"),
      db.ref("news").once("value"),
      db.ref("ads").once("value"),
      db.ref("players").once("value"),
      db.ref("teamOfTheRound").once("value")
    ]);

    const teams = Object.entries(teamsSnap.val() || {}).map(([id, t]) => ({ id, ...t }));
    const matches = Object.entries(matchesSnap.val() || {}).map(([id, m]) => ({ id, ...m }));
    const news = Object.entries(newsSnap.val() || {}).map(([id, n]) => ({ id, ...n }));
    const ads = Object.entries(adsSnap.val() || {}).map(([id, a]) => ({ id, ...a }));
    const players = Object.entries(playersSnap.val() || {}).map(([id, p]) => {
      const team = teams.find(t => t.id === p.teamId);
      return { id, ...p, teamName: team?.name || "" };
    });
    const totw = Object.entries(totwSnap.val() || {}).map(([id, t]) => ({ id, ...t }));

    globalTeams = teams;
    globalPlayers = players;

    if (teams.length === 0) {
      loadDemoData();
      return;
    }

    renderStandings(calculateStandings(matches, teams));
    renderMatches(matches, teams);
    renderStats(players);
    renderTeams(teams);
    renderNews(news);
    renderAds(ads);
    loadPredictions(matches, teams);
    renderTeamOfTheRound(totw, players);
    setTimeout(initScrollAnimations, 100);
  } catch (err) {
    console.error(err);
    loadDemoData();
  }
}

function loadDemoData() {
  const teams = [
    { id: "t1", name: "Динамо", city: "Москва", logo: "https://via.placeholder.com/160/1e40af/fff?text=Динамо" },
    { id: "t2", name: "Спартак", city: "Москва", logo: "https://via.placeholder.com/160/dc2626/fff?text=Спартак" },
    { id: "t3", name: "ЦСКА", city: "Москва", logo: "https://via.placeholder.com/160/b91c1c/fff?text=ЦСКА" },
    { id: "t4", name: "Зенит", city: "СПб", logo: "https://via.placeholder.com/160/0369a1/fff?text=Зенит" },
    { id: "t5", name: "Локомотив", city: "Москва", logo: "https://via.placeholder.com/160/15803d/fff?text=Локо" },
    { id: "t6", name: "Краснодар", city: "Краснодар", logo: "https://via.placeholder.com/160/166534/fff?text=Красн" }
  ];

  const matches = [
    { id: "m1", homeId: "t1", awayId: "t2", homeScore: 2, awayScore: 1, date: "2026-07-10T18:00", status: "finished", homePossession: 58, awayPossession: 42, homeShots: 14, awayShots: 9, homeCorners: 6, awayCorners: 3, homeYellow: 2, awayYellow: 3, scorers: "Иванов 23', Лебедев 71' — Петров 55'" },
    { id: "m2", homeId: "t3", awayId: "t4", homeScore: 0, awayScore: 0, date: "2026-07-11T19:00", status: "finished", homePossession: 51, awayPossession: 49, homeShots: 8, awayShots: 11, homeCorners: 4, awayCorners: 5, homeYellow: 1, awayYellow: 1 },
    { id: "m3", homeId: "t5", awayId: "t6", homeScore: 3, awayScore: 1, date: "2026-07-12T17:30", status: "finished", homePossession: 62, awayPossession: 38, homeShots: 18, awayShots: 7, homeCorners: 8, awayCorners: 2, homeYellow: 1, awayYellow: 4, scorers: "Смирнов 12', 34', 88' — Волков 50'" },
    { id: "m4", homeId: "t2", awayId: "t3", homeScore: 1, awayScore: 2, date: "2026-07-15T20:00", status: "finished" },
    { id: "m5", homeId: "t4", awayId: "t1", homeScore: 2, awayScore: 2, date: "2026-07-16T18:00", status: "finished" },
    { id: "m6", homeId: "t6", awayId: "t5", homeScore: 0, awayScore: 1, date: "2026-07-18T19:00", status: "finished" },
    { id: "m7", homeId: "t1", awayId: "t3", homeScore: 0, awayScore: 0, date: "2026-07-28T18:00", status: "scheduled" },
    { id: "m8", homeId: "t2", awayId: "t4", homeScore: 0, awayScore: 0, date: "2026-07-29T19:30", status: "scheduled" },
    { id: "m9", homeId: "t5", awayId: "t1", homeScore: 0, awayScore: 0, date: "2026-07-30T17:00", status: "scheduled" }
  ];

  const players = [
    { id: "p1", name: "Иванов А.", teamId: "t1", goals: 8, assists: 3, birthYear: 1998, position: "Нападающий", number: 9, photo: "https://via.placeholder.com/100/3b82f6/fff?text=ИА", consent: true },
    { id: "p2", name: "Петров С.", teamId: "t2", goals: 7, assists: 5, birthYear: 1995, position: "Полузащитник", number: 10, photo: "https://via.placeholder.com/100/ef4444/fff?text=ПС", consent: true },
    { id: "p3", name: "Сидоров Д.", teamId: "t4", goals: 6, assists: 2, birthYear: 2000, position: "Нападающий", number: 7, photo: "https://via.placeholder.com/100/0ea5e9/fff?text=СД", consent: false },
    { id: "p4", name: "Козлов М.", teamId: "t3", goals: 5, assists: 4, birthYear: 1997, position: "Защитник", number: 4, photo: "https://via.placeholder.com/100/f97316/fff?text=КМ", consent: true },
    { id: "p5", name: "Смирнов И.", teamId: "t5", goals: 5, assists: 1, birthYear: 1999, position: "Нападающий", number: 11, photo: "https://via.placeholder.com/100/22c55e/fff?text=СИ", consent: false },
    { id: "p6", name: "Волков Н.", teamId: "t6", goals: 4, assists: 6, birthYear: 1996, position: "Полузащитник", number: 8, photo: "https://via.placeholder.com/100/a855f7/fff?text=ВН", consent: true },
    { id: "p7", name: "Лебедев К.", teamId: "t1", goals: 3, assists: 7, birthYear: 2001, position: "Полузащитник", number: 6, photo: "https://via.placeholder.com/100/6366f1/fff?text=ЛК", consent: true },
    { id: "p8", name: "Новиков Р.", teamId: "t2", goals: 3, assists: 3, birthYear: 1994, position: "Вратарь", number: 1, photo: "https://via.placeholder.com/100/64748b/fff?text=НР", consent: false },
    { id: "p9", name: "Орлов В.", teamId: "t3", goals: 2, assists: 1, birthYear: 2002, position: "Нападающий", number: 17, photo: "https://via.placeholder.com/100/e11d48/fff?text=ОВ", consent: true },
    { id: "p10", name: "Морозов П.", teamId: "t4", goals: 1, assists: 4, birthYear: 1993, position: "Защитник", number: 5, photo: "https://via.placeholder.com/100/0891b2/fff?text=МП", consent: true },
    { id: "p11", name: "Соколов Е.", teamId: "t5", goals: 0, assists: 2, birthYear: 1998, position: "Защитник", number: 3, photo: "https://via.placeholder.com/100/16a34a/fff?text=СЕ", consent: false },
    { id: "p12", name: "Зайцев А.", teamId: "t6", goals: 2, assists: 0, birthYear: 2000, position: "Нападающий", number: 19, photo: "https://via.placeholder.com/100/7c3aed/fff?text=ЗА", consent: true }
  ].map(p => {
    const team = teams.find(t => t.id === p.teamId);
    return { ...p, teamName: team?.name || "" };
  });

  const news = [
    { id: "n1", title: "Открытие сезона АФЛ 2026!", text: "В эти выходные стартует новый сезон любительской футбольной лиги. Ждём ярких матчей и сенсаций.", image: "https://via.placeholder.com/400x200/0a1f44/fff?text=Открытие", date: "2026-07-20" },
    { id: "n2", title: "Динамо одерживает первую победу", text: "В напряжённом матче против Спартака команда Динамо вырвала победу со счётом 2:1.", image: "https://via.placeholder.com/400x200/1e40af/fff?text=Динамо", date: "2026-07-11" },
    { id: "n3", title: "Трансферное окно закрыто", text: "Все клубы завершили комплектование составов. Смотрите обновлённые заявки команд.", image: "https://via.placeholder.com/400x200/166534/fff?text=Трансферы", date: "2026-07-05" }
  ];

  const ads = [
    { id: "a1", image: "https://via.placeholder.com/400x100/e63946/fff?text=Спонсор+лиги", link: "#" },
    { id: "a2", image: "https://via.placeholder.com/400x100/0a1f44/fff?text=Партнёр+АФЛ", link: "#" }
  ];

  globalTeams = teams;
  globalPlayers = players;

  renderStandings(calculateStandings(matches, teams));
  renderMatches(matches, teams);
  renderStats(players);
  renderTeams(teams);
  renderNews(news);
  renderAds(ads);
  loadPredictions(matches, teams);
  // Демо команда тура — топ по голам+пасам
  renderTeamOfTheRound([], players);
  setTimeout(initScrollAnimations, 100);
  setTimeout(initTableSorting, 300);
}

function renderTeams(teams) {
  const grid = document.getElementById("teams-grid");
  if (!grid) return;
  grid.innerHTML = teams.map(t => `
    <div class="team-card fade-in" data-team-id="${t.id}">
      <img src="${t.logo || "https://via.placeholder.com/220x160?text=Logo"}" alt="${t.name}"
           onerror="this.src='https://via.placeholder.com/220x160?text=Logo'">
      <div class="team-card-body">
        <h3>${t.name}</h3>
        <p>${t.city || ""}</p>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll(".team-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.teamId;
      const team = teams.find(t => t.id === id) || globalTeams.find(t => t.id === id);
      if (team) openTeamModal(team);
    });
  });
}

function renderNews(news) {
  const list = document.getElementById("news-list");
  if (!list) return;
  const sorted = [...news].sort((a, b) => new Date(b.date) - new Date(a.date));
  list.innerHTML = sorted.map(n => `
    <div class="news-card fade-in">
      <img src="${n.image || "https://via.placeholder.com/400x180?text=News"}" alt=""
           onerror="this.src='https://via.placeholder.com/400x180?text=News'">
      <div class="news-card-body">
        <div class="news-date">${n.date ? new Date(n.date).toLocaleDateString("ru-RU") : ""}</div>
        <h3>${n.title}</h3>
        <p>${(n.text || "").substring(0, 140)}${(n.text || "").length > 140 ? "..." : ""}</p>
      </div>
    </div>
  `).join("");
}

function renderAds(ads) {
  const container = document.getElementById("ads-container");
  if (!container) return;
  if (!ads.length) { container.innerHTML = ""; return; }
  container.innerHTML = ads.map(a => `
    <a href="${a.link || "#"}" target="_blank" class="ad-card" rel="noopener">
      <img src="${a.image}" alt="Реклама" onerror="this.style.display='none'">
    </a>
  `).join("");
}

function initScrollAnimations() {
  const elements = document.querySelectorAll(".fade-in");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.1 });
  elements.forEach(el => observer.observe(el));
}

// ========== МОДАЛКА ИГРОКА ==========
function openPlayerModal(player) {
  const overlay = document.getElementById("playerModal");
  if (!overlay) return;
  const photo = getPlayerPhoto(player);
  const age = player.birthYear ? (new Date().getFullYear() - player.birthYear) : "—";

  overlay.querySelector(".modal-body").innerHTML = `
    <div class="modal-player-header">
      <img class="modal-player-photo ${photo.blurred ? "blurred" : ""}" src="${photo.url}"
           alt="${player.name}" onerror="this.src='https://via.placeholder.com/100?text=?'">
      <div class="modal-player-info">
        <h2>${player.name}</h2>
        <div class="team-name">${player.teamName || "Без команды"}</div>
        <div class="consent-badge ${player.consent ? "consent-yes" : "consent-no"}">
          ${player.consent ? "✓ Согласие на фото получено" : "⚠ Фото скрыто (нет согласия)"}
        </div>
      </div>
    </div>
    <div class="modal-stats-row">
      <div class="modal-stat-box"><div class="val">${player.goals || 0}</div><div class="lbl">Голы</div></div>
      <div class="modal-stat-box"><div class="val">${player.assists || 0}</div><div class="lbl">Передачи</div></div>
      <div class="modal-stat-box"><div class="val">${player.number || "—"}</div><div class="lbl">Номер</div></div>
    </div>
    <ul class="modal-detail-list">
      <li><span>Позиция</span><span>${player.position || "—"}</span></li>
      <li><span>Год рождения</span><span>${player.birthYear || "—"}</span></li>
      <li><span>Возраст</span><span>${age}</span></li>
      <li><span>Команда</span><span>${player.teamName || "—"}</span></li>
    </ul>
  `;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

// ========== МОДАЛКА КОМАНДЫ ==========
function openTeamModal(team) {
  const overlay = document.getElementById("teamModal");
  if (!overlay) return;
  const roster = globalPlayers.filter(p => p.teamId === team.id);

  let rosterHtml = "";
  if (roster.length === 0) {
    rosterHtml = "<p style='opacity:0.5;text-align:center;padding:20px'>Нет заявленных игроков</p>";
  } else {
    rosterHtml = `<div class="roster-grid">` + roster.map(p => {
      const photo = getPlayerPhoto(p);
      return `
        <div class="roster-player" data-player-id="${p.id}">
          <img src="${photo.url}" class="${photo.blurred ? "blurred" : ""}"
               onerror="this.src='https://via.placeholder.com/56?text=?'">
          <div class="name">${p.name}</div>
          <div class="pos">${p.position || ""} ${p.number ? "· #" + p.number : ""}</div>
        </div>
      `;
    }).join("") + `</div>`;
  }

  overlay.querySelector(".modal-body").innerHTML = `
    <div style="text-align:center;margin-bottom:20px">
      <img src="${team.logo || "https://via.placeholder.com/80?text=FC"}" alt=""
           style="width:80px;height:80px;border-radius:50%;object-fit:cover;background:#333"
           onerror="this.src='https://via.placeholder.com/80?text=FC'">
      <h2 style="margin-top:12px">${team.name}</h2>
      <p style="color:var(--text-muted)">${team.city || ""}</p>
    </div>
    <h3 style="font-size:1rem;margin-bottom:8px">Заявка команды (${roster.length})</h3>
    ${rosterHtml}
  `;

  overlay.querySelectorAll(".roster-player").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.playerId;
      const player = globalPlayers.find(p => p.id === id);
      if (player) {
        closeAllModals();
        setTimeout(() => openPlayerModal(player), 200);
      }
    });
  });

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

// ========== КОМАНДА ТУРА ==========
// Авто-расчёт сбалансированного состава по позициям
function autoSelectTeamOfTheRound(players) {
  const scored = [...players].map(p => ({
    ...p,
    score: (Number(p.goals) || 0) * 2 + (Number(p.assists) || 0)
  })).filter(p => p.score > 0 || p.position)
    .sort((a, b) => b.score - a.score);

  const byPos = {
    "Вратарь": [],
    "Защитник": [],
    "Полузащитник": [],
    "Нападающий": [],
    other: []
  };
  scored.forEach(p => {
    const pos = p.position || "";
    if (byPos[pos]) byPos[pos].push(p);
    else byPos.other.push(p);
  });

  // Схема 1-3-4-3 (или сколько есть)
  const pick = (arr, n) => arr.slice(0, n);
  const selected = [];
  selected.push(...pick(byPos["Вратарь"], 1));
  selected.push(...pick(byPos["Защитник"], 3));
  selected.push(...pick(byPos["Полузащитник"], 4));
  selected.push(...pick(byPos["Нападающий"], 3));

  // Добираем лучших, если не хватает 11
  const ids = new Set(selected.map(p => p.id));
  for (const p of scored) {
    if (selected.length >= 11) break;
    if (!ids.has(p.id)) {
      selected.push(p);
      ids.add(p.id);
    }
  }
  // Если всё ещё мало — любых
  if (selected.length < 5) {
    for (const p of players) {
      if (selected.length >= 11) break;
      if (!ids.has(p.id)) {
        selected.push({ ...p, score: 0 });
        ids.add(p.id);
      }
    }
  }
  return selected.slice(0, 11);
}

function renderTeamOfTheRound(totwList, players) {
  const container = document.getElementById("totw-list");
  const label = document.getElementById("totw-round-label");
  if (!container) return;

  const sorted = [...(totwList || [])].sort((a, b) => (b.round || 0) - (a.round || 0));
  const current = sorted[0];

  let list = [];
  let labelText = "";

  if (current && current.players && current.players.length) {
    labelText = current.title || ("Тур " + current.round);
    list = current.players.map(pid => {
      return players.find(pl => pl.id === pid) || { id: pid, name: "?", consent: false };
    });
  } else {
    labelText = "Авто-расчёт по статистике сезона";
    list = autoSelectTeamOfTheRound(players);
  }

  if (label) label.textContent = labelText;

  if (!list.length) {
    container.innerHTML = "<p style='text-align:center;opacity:0.5;grid-column:1/-1'>Пока нет данных для команды тура</p>";
    return;
  }

  // Группировка по линиям для визуала
  const order = ["Вратарь", "Защитник", "Полузащитник", "Нападающий"];
  const groups = { "Вратарь": [], "Защитник": [], "Полузащитник": [], "Нападающий": [], "": [] };
  list.forEach(p => {
    const pos = p.position || "";
    if (groups[pos] !== undefined) groups[pos].push(p);
    else groups[""].push(p);
  });

  let html = "";
  const renderCard = (p, i) => {
    const photo = getPlayerPhoto(p);
    const g = p.goals || 0, a = p.assists || 0;
    return `
      <div class="totw-player fade-in" data-player-id="${p.id}">
        ${i < 3 ? '<span class="totw-badge">★</span>' : ""}
        <img src="${photo.url}" class="${photo.blurred ? "blurred" : ""}"
             onerror="this.src='https://via.placeholder.com/64?text=?'">
        <div class="name">${p.name}</div>
        <div class="role">${p.position || ""} · ${p.teamName || ""}</div>
        <div class="stats-mini">${g}Г · ${a}П</div>
      </div>`;
  };

  let globalIdx = 0;
  order.forEach(pos => {
    if (!groups[pos].length) return;
    html += `<div class="formation-label" style="grid-column:1/-1">${pos}</div>`;
    groups[pos].forEach(p => {
      html += renderCard(p, globalIdx++);
    });
  });
  groups[""].forEach(p => {
    html += renderCard(p, globalIdx++);
  });

  container.innerHTML = html;

  container.querySelectorAll(".totw-player[data-player-id]").forEach(el => {
    el.addEventListener("click", () => {
      const player = globalPlayers.find(p => p.id === el.dataset.playerId);
      if (player) openPlayerModal(player);
    });
  });
}

function renderTeamOfTheRound(totwList, players) {
  const container = document.getElementById("totw-list");
  const label = document.getElementById("totw-round-label");
  if (!container) return;

  // Берём последнюю (актуальную) команду тура
  const sorted = [...(totwList || [])].sort((a, b) => (b.round || 0) - (a.round || 0));
  const current = sorted[0];

  if (!current || !current.players || !current.players.length) {
    // Авто: топ игроков по голы+пасы
    const top = [...players]
      .map(p => ({ ...p, score: (p.goals || 0) * 2 + (p.assists || 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 11);
    if (label) label.textContent = "По итогам текущего сезона";
    container.innerHTML = top.map((p, i) => {
      const photo = getPlayerPhoto(p);
      return `
        <div class="totw-player fade-in" data-player-id="${p.id}">
          ${i < 3 ? `<span class="totw-badge">★</span>` : ""}
          <img src="${photo.url}" class="${photo.blurred ? "blurred" : ""}"
               onerror="this.src='https://via.placeholder.com/64?text=?'">
          <div class="name">${p.name}</div>
          <div class="role">${p.position || ""} · ${p.teamName || ""}</div>
          <div class="stats-mini">${p.goals || 0}Г · ${p.assists || 0}П</div>
        </div>
      `;
    }).join("");
  } else {
    if (label) label.textContent = current.title || `Тур ${current.round}`;
    container.innerHTML = current.players.map((pid, i) => {
      const p = players.find(pl => pl.id === pid) || { id: pid, name: "?", consent: false };
      const photo = getPlayerPhoto(p);
      return `
        <div class="totw-player fade-in" data-player-id="${p.id}">
          ${i < 3 ? `<span class="totw-badge">★</span>` : ""}
          <img src="${photo.url}" class="${photo.blurred ? "blurred" : ""}"
               onerror="this.src='https://via.placeholder.com/64?text=?'">
          <div class="name">${p.name}</div>
          <div class="role">${p.position || ""} · ${p.teamName || ""}</div>
          <div class="stats-mini">${p.goals || 0}Г · ${p.assists || 0}П</div>
        </div>
      `;
    }).join("");
  }

  container.querySelectorAll(".totw-player[data-player-id]").forEach(el => {
    el.addEventListener("click", () => {
      const player = globalPlayers.find(p => p.id === el.dataset.playerId);
      if (player) openPlayerModal(player);
    });
  });
}
