const SOURCE_PATH = "data/source.json";

const state = {
  page: document.body.dataset.page || "home",
  modules: null,
  selectedNav: 0,
  focusPane: 0,
  panes: [],
  borderPreset: {
    pane: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
    block: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
    card: { tl: "├", tr: "┤", bl: "└", br: "┘", h: "─", v: "│" }
  },
  lineWidths: {
    paneNav: 36,
    paneMain: 58,
    paneSide: 40,
    block: 104,
    card: 104
  }
};

const pageTitles = {
  home: "Home",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  cp: "Competitive Programming"
};

const safe = (value, fallback = "-") => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
};

const esc = (value) =>
  safe(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

async function loadData() {
  const source = await fetch(SOURCE_PATH);
  if (!source.ok) {
    throw new Error(`Unable to load ${SOURCE_PATH}`);
  }

  const sourceJson = await source.json();
  const modules = sourceJson.modules || {};
  const moduleEntries = Object.entries(modules);

  const loaded = await Promise.all(
    moduleEntries.map(async ([key, path]) => {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Unable to load module: ${key}`);
      }
      return [key, await response.json()];
    })
  );

  state.modules = Object.fromEntries(loaded);
}

function renderError(message) {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="tui">
      <section class="statusbar">[error] ${esc(message)}</section>
      <main class="tui-main">
        <section class="pane pane-content focused">
          <header class="pane-header">System Error</header>
          <div class="pane-body">
            <p>Data modules could not be loaded.</p>
            <p>Check file paths in data/source.json.</p>
          </div>
        </section>
      </main>
      <footer class="keybar">[q] quit [r] reload</footer>
    </div>
  `;
}

function getNavItems() {
  const site = state.modules.site || {};
  const nav = site.navigation || [];
  return nav;
}

function getCurrentPageTitle() {
  return pageTitles[state.page] || "Portfolio";
}

function timeString() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function dateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function findSelectedNavIndex(navItems) {
  const idx = navItems.findIndex((item) => item.page === state.page);
  return idx >= 0 ? idx : 0;
}

function asciiPaneHeader(label, width = 44) {
  const chars = state.borderPreset.pane;
  const title = `[ ${label} ]`;
  const fillLen = Math.max(2, width - title.length - 2);
  return `${chars.tl}${title}${chars.h.repeat(fillLen)}${chars.tr}`;
}

function asciiPaneFooter(width = 44) {
  const chars = state.borderPreset.pane;
  const total = Math.max(4, Number(width) || 4);
  return `${chars.bl}${chars.h.repeat(total - 2)}${chars.br}`;
}

function getMonospaceCharWidth(refNode) {
  const probe = document.createElement("span");
  const refStyle = window.getComputedStyle(refNode || document.body);
  probe.textContent = "0";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.fontFamily = refStyle.fontFamily;
  probe.style.fontSize = refStyle.fontSize;
  probe.style.fontWeight = refStyle.fontWeight;
  probe.style.letterSpacing = refStyle.letterSpacing;
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width || 8;
  probe.remove();
  return width;
}

function fitPaneBorderWidth(paneSelector, headerLabel, fallbackWidth) {
  const pane = document.querySelector(paneSelector);
  if (!pane) {
    return;
  }

  const header = pane.querySelector(".pane-header");
  const footer = pane.querySelector(".pane-footer");
  if (!header || !footer) {
    return;
  }

  const charWidth = getMonospaceCharWidth(header);
  const horizontalPadding = 16;
  const totalWidth = Math.max(4, Math.floor((pane.clientWidth - horizontalPadding) / charWidth));
  const finalWidth = Number.isFinite(totalWidth) && totalWidth > 4 ? totalWidth : fallbackWidth;
  const footerWidth = Math.max(4, finalWidth - 2);

  header.textContent = asciiPaneHeader(headerLabel, finalWidth);
  footer.textContent = asciiPaneFooter(footerWidth);
}

function fitPaneBordersToLayout() {
  fitPaneBorderWidth(".pane-nav", "Navigation", state.lineWidths.paneNav);
  fitPaneBorderWidth(".pane-content", getCurrentPageTitle(), state.lineWidths.paneMain);
  fitPaneBorderWidth(".pane-side", "Input: mouse / keyboard", state.lineWidths.paneSide);
}

function buildAsciiLine(chars, width, kind) {
  const total = Math.max(4, Number(width) || 4);
  const w = total - 2;
  if (kind === "top") {
    return `${chars.tl}${chars.h.repeat(w)}${chars.tr}`;
  }
  return `${chars.bl}${chars.h.repeat(w)}${chars.br}`;
}

function quoteCssContent(value) {
  return `"${String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function applyBorderTheme() {
  const root = document.documentElement;
  const blockChars = state.borderPreset.block;
  const cardChars = state.borderPreset.card;

  root.style.setProperty("--block-v", "#3a5058");
  root.style.setProperty("--card-v", "#3a5058");
  root.style.setProperty("--block-top-line", quoteCssContent(buildAsciiLine(blockChars, state.lineWidths.block, "top")));
  root.style.setProperty("--block-bottom-line", quoteCssContent(buildAsciiLine(blockChars, state.lineWidths.block, "bottom")));
  root.style.setProperty("--card-top-line", quoteCssContent(buildAsciiLine(cardChars, state.lineWidths.card, "top")));
  root.style.setProperty("--card-bottom-line", quoteCssContent(buildAsciiLine(cardChars, state.lineWidths.card, "bottom")));
}

function resolveBorderTheme() {
  const borders = state.modules.borders || {};
  const presets = borders.presets || {};
  const activeKey = borders.active || "mixed";
  const chosen = presets[activeKey] || presets.mixed;

  if (chosen) {
    state.borderPreset = {
      pane: chosen.pane || state.borderPreset.pane,
      block: chosen.block || state.borderPreset.block,
      card: chosen.card || state.borderPreset.card
    };
  }

  const widths = borders.lineWidths || {};
  state.lineWidths = {
    ...state.lineWidths,
    ...widths
  };

  applyBorderTheme();
}

function renderTopBar(siteTitle) {
  const rows = window.innerHeight;
  const cols = window.innerWidth;

  return `
    <section class="statusbar" role="status" aria-live="polite">
      <div class="status-left">[ dev@portfolio ]</div>
      <div class="status-mid">section:${esc(getCurrentPageTitle().toLowerCase())}</div>
      <div class="status-right">${esc(dateString())} ${esc(timeString())} | ${cols}x${rows}</div>
    </section>
  `;
}

function renderNavPane(navItems) {
  const navButtons = navItems
    .map((item, index) => {
      const active = index === state.selectedNav ? "active" : "";
      const marker = index === state.selectedNav ? ">" : " ";
      return `
        <li>
          <button class="nav-item ${active}" data-index="${index}" data-href="${esc(item.href)}" data-page="${esc(item.page)}" type="button">
            <span class="nav-marker">${esc(marker)}</span>${esc(item.label)}
          </button>
        </li>
      `;
    })
    .join("");

  return `
    <section class="pane pane-nav">
      <header class="pane-header">${asciiPaneHeader("Navigation", state.lineWidths.paneNav)}</header>
      <div class="pane-body">
        <ul class="nav-list">${navButtons}</ul>
      </div>
      <footer class="pane-footer">${asciiPaneFooter(state.lineWidths.paneNav)}</footer>
    </section>
  `;
}

function renderProfileBlock() {
  const profile = state.modules.profile || {};
  return `
    <section class="block">
      <h2 class="section-title">Profile</h2>
      <div class="kv"><span class="label">Name</span><span>${esc(profile.name)}</span></div>
      <div class="kv"><span class="label">Location</span><span>${esc(profile.location)}</span></div>
      <div class="kv"><span class="label">Email</span><span><a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a></span></div>
      <div class="kv"><span class="label">Phone</span><span>${esc(profile.phone)}</span></div>
      <div class="kv"><span class="label">GitHub</span><span><a target="_blank" rel="noopener noreferrer" href="${esc(profile.github)}">${esc(profile.github)}</a></span></div>
      <div class="kv"><span class="label">LinkedIn</span><span><a target="_blank" rel="noopener noreferrer" href="${esc(profile.linkedin)}">${esc(profile.linkedin)}</a></span></div>
    </section>
  `;
}

function renderHomeContent() {
  const profile = state.modules.profile || {};
  const skills = state.modules.skills || [];

  const skillsHtml = skills
    .slice(0, 4)
    .map(
      (group) => `
        <div class="skill-group">
          <div class="item-title">${esc(group.category)}</div>
          <div>${esc((group.items || []).join(" | "))}</div>
        </div>
      `
    )
    .join("");

  return `
    <h1 class="section-title">About</h1>
    <p class="tagline">${esc(profile.summary)}</p>
    ${renderProfileBlock()}
    <section class="block">
      <h2 class="section-title">Top Skills</h2>
      ${skillsHtml}
    </section>
  `;
}

function renderExperienceContent() {
  const items = state.modules.experience || [];

  const timeline = items
    .map(
      (item) => `
        <article class="timeline-item">
          <div class="item-title">${esc(item.title)}</div>
          <div class="item-subtitle">${esc(item.organization)} | ${esc(item.location)} | ${esc(item.start)} -> ${esc(item.end)}</div>
          <ul class="plain-list">
            ${(item.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");

  return `
    <h1 class="section-title">Experience Timeline</h1>
    ${timeline}
  `;
}

function renderEducationContent() {
  const items = state.modules.education || [];

  return `
    <h1 class="section-title">Education</h1>
    ${items
      .map(
        (item) => `
          <article class="edu-item">
            <div class="item-title">${esc(item.degree)}</div>
            <div class="item-subtitle">${esc(item.institution)} | ${esc(item.start)} -> ${esc(item.end)}</div>
            <ul class="plain-list">
              ${(item.details || []).map((d) => `<li>${esc(d)}</li>`).join("")}
            </ul>
          </article>
        `
      )
      .join("")}
  `;
}

function renderProjectsContent() {
  const data = state.modules.projects || {};

  return `
    <h1 class="section-title">Projects</h1>
    ${Object.entries(data)
      .map(([category, projects]) => {
        const cards = (projects || [])
          .map((project) => {
            const links = [
              project.githubUrl
                ? `<a target="_blank" rel="noopener noreferrer" href="${esc(project.githubUrl)}">source</a>`
                : "",
              project.demoUrl
                ? `<a target="_blank" rel="noopener noreferrer" href="${esc(project.demoUrl)}">demo</a>`
                : ""
            ]
              .filter(Boolean)
              .join(" | ");

            return `
              <article class="project-card">
                <div class="item-title">${esc(project.title)}</div>
                <div class="tech">[${esc((project.techStack || []).join(", "))}]</div>
                <p>${esc(project.description)}</p>
                ${project.details ? `<p class="label">${esc(project.details)}</p>` : ""}
                ${links ? `<p>${links}</p>` : ""}
              </article>
            `;
          })
          .join("");

        return `
          <section class="block">
            <h2 class="section-title">${esc(category)}</h2>
            ${cards}
          </section>
        `;
      })
      .join("")}
  `;
}

function renderCpContent() {
  const cp = state.modules.cpData || {};
  const profiles = cp.profiles || [];
  const honors = cp.honors || [];
  const events = cp.events || [];

  const profileList = profiles
    .map(
      (p) =>
        `<li><span class="badge">${esc(p.label)}:</span> <a target="_blank" rel="noopener noreferrer" href="${esc(p.url)}">${esc(p.url)}</a></li>`
    )
    .join("");

  const honorsList = honors.map((h) => `<li>${esc(h)}</li>`).join("");

  const eventsList = events
    .map(
      (e) => `
      <article class="cp-item">
        <div class="item-title">${esc(e.event)}</div>
        <div class="item-subtitle">${esc(e.venue)}</div>
        <div><span class="label">Position:</span> ${esc(e.position)}</div>
      </article>
    `
    )
    .join("");

  return `
    <h1 class="section-title">Competitive Programming</h1>
    <section class="block">
      <h2 class="section-title">Profiles</h2>
      <ul class="link-list">${profileList}</ul>
    </section>
    <section class="block">
      <h2 class="section-title">Honors</h2>
      <ul class="plain-list">${honorsList}</ul>
    </section>
    <section class="block">
      <h2 class="section-title">Events</h2>
      ${eventsList}
    </section>
  `;
}

function getPageContent() {
  switch (state.page) {
    case "experience":
      return renderExperienceContent();
    case "education":
      return renderEducationContent();
    case "projects":
      return renderProjectsContent();
    case "cp":
      return renderCpContent();
    case "home":
    default:
      return renderHomeContent();
  }
}

function renderSidePane() {
  const profile = state.modules.profile || {};
  const projectData = state.modules.projects || {};
  const projectCount = Object.values(projectData).reduce(
    (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
    0
  );

  const sections = [
    `active:${getCurrentPageTitle().toLowerCase()}`,
    `skills:${(state.modules.skills || []).length}`,
    `projects:${projectCount}`,
    `experience:${(state.modules.experience || []).length}`,
    `events:${((state.modules.cpData || {}).events || []).length}`
  ];

  return `
    <section class="pane pane-side">
      <header class="pane-header">${asciiPaneHeader("Input: mouse / keyboard", state.lineWidths.paneSide)}</header>
      <div class="pane-body">
        <section class="block">
          <h2 class="section-title">Session</h2>
          <ul class="right-list">
            ${sections.map((item) => `<li>${esc(item)}</li>`).join("")}
          </ul>
        </section>
        <section class="block">
          <h2 class="section-title">Quick Contact</h2>
          <ul class="right-list">
            <li><span class="badge">mail</span> ${esc(profile.email)}</li>
            <li><span class="badge">phone</span> ${esc(profile.phone)}</li>
            <li><span class="badge">city</span> ${esc(profile.location)}</li>
          </ul>
        </section>
        <section class="block">
          <h2 class="section-title">Command Hints</h2>
          <ul class="right-list">
            <li><span class="badge">j/k</span> move in navigation</li>
            <li><span class="badge">enter</span> open selected section</li>
            <li><span class="badge">click</span> activate nav item</li>
          </ul>
        </section>
      </div>
      <footer class="pane-footer">${asciiPaneFooter(state.lineWidths.paneSide)}</footer>
    </section>
  `;
}

function renderLayout() {
  const content = document.getElementById("content");
  const navItems = getNavItems();
  state.selectedNav = findSelectedNavIndex(navItems);

  content.innerHTML = `
    <div class="tui">
      ${renderTopBar((state.modules.site || {}).title || "portfolio")}
      <main class="tui-main">
        ${renderNavPane(navItems)}
        <section class="pane pane-content">
          <header class="pane-header">${asciiPaneHeader(esc(getCurrentPageTitle()), state.lineWidths.paneMain)}</header>
          <div class="pane-body" id="main-pane-body">${getPageContent()}</div>
          <footer class="pane-footer">${asciiPaneFooter(state.lineWidths.paneMain)}</footer>
        </section>
        ${renderSidePane()}
      </main>
      <footer class="keybar">
        <div class="hints">
          <span><strong>[j/k]</strong> move</span>
          <span><strong>[↑/↓]</strong> move</span>
          <span><strong>[enter]</strong> open</span>
          <span><strong>[mouse]</strong> click/scroll/hover</span>
        </div>
      </footer>
    </div>
  `;

  wireNavEvents();
  setupPanes();
  setPaneFocus(0);
  fitPaneBordersToLayout();
  updateClock();
}

function setupPanes() {
  const paneNodes = document.querySelectorAll(".pane");
  state.panes = Array.from(paneNodes);
  state.panes.forEach((pane, index) => {
    pane.addEventListener("click", () => setPaneFocus(index));
  });
}

function setPaneFocus(index) {
  state.focusPane = index;
  state.panes.forEach((pane, idx) => {
    pane.classList.toggle("focused", idx === index);
  });
}

function wireNavEvents() {
  const buttons = document.querySelectorAll(".nav-item");
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      const idx = Number(button.dataset.index || 0);
      state.selectedNav = idx;
      paintNavSelection();
    });

    button.addEventListener("click", () => {
      const href = button.dataset.href;
      if (href) {
        window.location.href = href;
      }
    });
  });
}

function paintNavSelection() {
  const buttons = document.querySelectorAll(".nav-item");
  buttons.forEach((button, idx) => {
    const marker = button.querySelector(".nav-marker");
    const isActive = idx === state.selectedNav;
    button.classList.toggle("active", isActive);
    if (marker) {
      marker.textContent = isActive ? ">" : " ";
    }
  });
}

function openSelectedNav() {
  const target = document.querySelector(`.nav-item[data-index="${state.selectedNav}"]`);
  if (target && target.dataset.href) {
    window.location.href = target.dataset.href;
  }
}

function moveNav(step) {
  const navItems = getNavItems();
  if (!navItems.length) {
    return;
  }
  const count = navItems.length;
  state.selectedNav = (state.selectedNav + step + count) % count;
  paintNavSelection();

  const target = document.querySelector(`.nav-item[data-index="${state.selectedNav}"]`);
  if (target) {
    target.scrollIntoView({ block: "nearest" });
  }
}

function scrollActivePane(direction) {
  const pane = state.panes[state.focusPane];
  if (!pane) {
    return;
  }
  const body = pane.querySelector(".pane-body");
  if (body) {
    body.scrollBy({ top: direction * 36, behavior: "auto" });
  }
}

function cyclePaneFocus() {
  if (!state.panes.length) {
    return;
  }
  const next = (state.focusPane + 1) % state.panes.length;
  setPaneFocus(next);
}

function updateClock() {
  const status = document.querySelector(".status-right");
  if (!status) {
    return;
  }

  const render = () => {
    const rows = window.innerHeight;
    const cols = window.innerWidth;
    status.textContent = `${dateString()} ${timeString()} | ${cols}x${rows}`;
  };

  render();
  setInterval(render, 1000);
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();

  if (key === "enter") {
    event.preventDefault();
    openSelectedNav();
    return;
  }

  if (key === "arrowup" || key === "k") {
    event.preventDefault();
    moveNav(-1);
    return;
  }

  if (key === "arrowdown" || key === "j") {
    event.preventDefault();
    moveNav(1);
  }
}

async function boot() {
  try {
    await loadData();
    resolveBorderTheme();
    renderLayout();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", () => {
      fitPaneBordersToLayout();
      const status = document.querySelector(".status-right");
      if (status) {
        status.textContent = `${dateString()} ${timeString()} | ${window.innerWidth}x${window.innerHeight}`;
      }
    });
  } catch (error) {
    renderError(error.message);
  }
}

boot();
