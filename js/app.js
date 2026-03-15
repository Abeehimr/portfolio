const SOURCE_PATH = "data/source.json";

function el(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) {
    node.textContent = String(text);
  }
  return node;
}

function makeLink(url, label) {
  const a = el("a", label || url);
  a.href = url;
  if (/^https?:\/\//.test(url)) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  return a;
}

function makeTable(headers, rows) {
  const MAX_COL_WIDTH = 38;

  const wrapCell = (value, width) => {
    const text = String(value || "");
    if (text.length <= width) return [text];

    const words = text.split(" ");
    const lines = [];
    let current = "";

    words.forEach((word) => {
      if (word.length > width) {
        if (current) {
          lines.push(current);
          current = "";
        }
        for (let i = 0; i < word.length; i += width) {
          lines.push(word.slice(i, i + width));
        }
        return;
      }

      if (!current) {
        current = word;
        return;
      }

      const candidate = `${current} ${word}`;
      if (candidate.length <= width) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    });

    if (current) lines.push(current);
    return lines.length ? lines : [""];
  };

  const drawBorder = (widths) => `+${widths.map((w) => "-".repeat(w + 2)).join("+")}+`;

  const drawWrappedRow = (cols, widths) => {
    const wrapped = cols.map((value, i) => wrapCell(value, widths[i]));
    const rowHeight = wrapped.reduce((max, lines) => Math.max(max, lines.length), 1);
    const rowLines = [];

    for (let lineIdx = 0; lineIdx < rowHeight; lineIdx += 1) {
      const line = `|${wrapped
        .map((lines, colIdx) => ` ${(lines[lineIdx] || "").padEnd(widths[colIdx], " ")} `)
        .join("|")}|`;
      rowLines.push(line);
    }

    return rowLines;
  };

  const plainRows = rows.map((row) => row.map((cell) => {
    if (cell instanceof Node) {
      return (cell.textContent || "").trim();
    }
    return String(cell);
  }));

  const widths = headers.map((header, index) => {
    const values = plainRows.map((row) => row[index] || "");
    const maxCell = values.reduce((max, value) => Math.max(max, value.length), 0);
    return Math.min(Math.max(header.length, maxCell), MAX_COL_WIDTH);
  });

  const lines = [drawBorder(widths), ...drawWrappedRow(headers, widths), drawBorder(widths)];
  plainRows.forEach((row) => {
    lines.push(...drawWrappedRow(row, widths));
  });
  lines.push(drawBorder(widths));

  const pre = document.createElement("pre");
  pre.className = "ascii-table";
  pre.textContent = lines.join("\n");
  return pre;
}

function makeCard(title, subtitle, bullets) {
  const card = document.createElement("section");
  card.className = "card";
  card.appendChild(el("h3", title));
  if (subtitle) {
    card.appendChild(el("p", subtitle));
  }

  if (bullets && bullets.length) {
    const ul = document.createElement("ul");
    bullets.forEach((item) => {
      ul.appendChild(el("li", item));
    });
    card.appendChild(ul);
  }

  return card;
}

function makeProjectCard(project) {
  const details = document.createElement("details");
  details.className = "project-card";

  const summary = document.createElement("summary");
  summary.appendChild(el("strong", project.title));
  details.appendChild(summary);

  const body = document.createElement("div");
  body.className = "project-body";

  const bullets = document.createElement("ul");
  bullets.appendChild(el("li", `Technologies: ${project.techStack.join(", ")}`));
  bullets.appendChild(el("li", project.description));
  if (project.details) {
    bullets.appendChild(el("li", project.details));
  }
  body.appendChild(bullets);

  const links = [];
  if (project.githubUrl) {
    links.push({ label: "GitHub", url: project.githubUrl });
  }
  if (project.demoUrl) {
    links.push({ label: "Live Demo", url: project.demoUrl });
  }

  if (links.length > 0) {
    const linkWrap = document.createElement("p");
    linkWrap.className = "project-links";
    links.forEach((item, index) => {
      linkWrap.appendChild(makeLink(item.url, item.label));
      if (index < links.length - 1) {
        linkWrap.appendChild(document.createTextNode(" | "));
      }
    });
    body.appendChild(linkWrap);
  }

  details.appendChild(body);
  return details;
}

async function loadData() {
  const sourceResponse = await fetch(SOURCE_PATH);
  const source = await sourceResponse.json();
  const modules = source.modules || {};

  const entries = Object.entries(modules);
  const loaded = await Promise.all(
    entries.map(async ([key, path]) => {
      const response = await fetch(path);
      const json = await response.json();
      return [key, json];
    })
  );

  const moduleData = Object.fromEntries(loaded);

  return {
    site: moduleData.site,
    profile: moduleData.profile,
    experience: moduleData.experience,
    education: moduleData.education,
    skills: moduleData.skills,
    projects: moduleData.projects,
    cpData: moduleData.cpData
  };
}

function renderNav(data, currentPage) {
  const navRoot = document.getElementById("nav");
  if (!navRoot) return;

  const nav = document.createElement("nav");
  const line = document.createElement("p");
  line.className = "nav-line";
  data.site.navigation.forEach((item, index) => {
    const anchor = makeLink(item.href, item.label);
    if (item.page === currentPage) {
      const strong = document.createElement("span");
      strong.className = "active-nav";
      anchor.setAttribute("aria-current", "page");
      strong.appendChild(anchor);
      line.appendChild(strong);
    } else {
      line.appendChild(anchor);
    }

    if (index < data.site.navigation.length - 1) {
      line.appendChild(document.createTextNode(" | "));
    }
  });

  nav.appendChild(line);
  navRoot.appendChild(nav);
}

function renderStatusBar(currentPage) {
  const existing = document.getElementById("status-bar");
  if (existing) {
    existing.remove();
  }

  const footer = document.createElement("footer");
  footer.id = "status-bar";
  footer.appendChild(el("span", `echo ${currentPage}`));
  footer.appendChild(el("span", "ready"));
  document.body.appendChild(footer);
}

function renderHome(root, data) {
  root.appendChild(el("h1", data.profile.name));

  root.appendChild(el("h2", "Professional Summary"));
  root.appendChild(el("p", data.profile.summary));

  root.appendChild(el("h2", "Skills"));
  const skillRows = data.skills.map((group) => [group.category, group.items.join(", ")]);
  const skillTable = makeTable(["Category", "Details"], skillRows);
  skillTable.classList.add("skills-table");
  root.appendChild(skillTable);

  root.appendChild(el("h2", "Professional Profiles"));
  const profiles = document.createElement("ul");

  const emailItem = document.createElement("li");
  emailItem.appendChild(document.createTextNode("Email: "));
  emailItem.appendChild(makeLink(`mailto:${data.profile.email}`, data.profile.email));
  profiles.appendChild(emailItem);

  const phoneItem = document.createElement("li");
  phoneItem.textContent = `Phone: ${data.profile.phone}`;
  profiles.appendChild(phoneItem);

  const linkedinItem = document.createElement("li");
  linkedinItem.appendChild(document.createTextNode("LinkedIn: "));
  linkedinItem.appendChild(makeLink(data.profile.linkedin, data.profile.linkedin));
  profiles.appendChild(linkedinItem);

  const githubItem = document.createElement("li");
  githubItem.appendChild(document.createTextNode("GitHub: "));
  githubItem.appendChild(makeLink(data.profile.github, data.profile.github));
  profiles.appendChild(githubItem);

  root.appendChild(profiles);
}

function renderExperience(root, data) {
  root.appendChild(el("h1", "Experience"));

  data.experience.forEach((item) => {
    const title = `${item.title} - ${item.organization}`;
    const subtitle = `${item.start} - ${item.end}`;
    root.appendChild(makeCard(title, subtitle, item.bullets));
  });
}

function renderEducation(root, data) {
  root.appendChild(el("h1", "Education"));

  data.education.forEach((item) => {
    const title = item.degree;
    const subtitle = `${item.institution} | ${item.start} - ${item.end}`;
    root.appendChild(makeCard(title, subtitle, item.details));
  });
}

function renderProjects(root, data) {
  root.appendChild(el("h1", "Projects"));

  Object.entries(data.projects).forEach(([category, projects]) => {
    const categoryBlock = document.createElement("section");
    categoryBlock.className = "project-category";

    categoryBlock.appendChild(el("h2", category));
    projects.forEach((project) => {
      categoryBlock.appendChild(makeProjectCard(project));
    });
    root.appendChild(categoryBlock);
  });
}

function renderCP(root, data) {
  root.appendChild(el("h1", "Competitive Programming"));

  root.appendChild(el("h2", "Profiles"));
  const profileList = document.createElement("ul");
  data.cpData.profiles.forEach((profile) => {
    const li = document.createElement("li");
    li.appendChild(document.createTextNode(`${profile.label}: `));
    li.appendChild(makeLink(profile.url, profile.url));
    profileList.appendChild(li);
  });
  root.appendChild(profileList);

  root.appendChild(el("h2", "Honors and Distinctions"));
  const honorsList = document.createElement("ul");
  data.cpData.honors.forEach((honor) => {
    honorsList.appendChild(el("li", honor));
  });
  root.appendChild(honorsList);

  root.appendChild(el("h2", "Contest Results"));
  const rows = data.cpData.events.map((item, index) => [
    index + 1,
    item.event,
    item.venue,
    item.position
  ]);
  root.appendChild(makeTable(["#", "Event", "Venue", "Position"], rows));
}

const renderers = {
  home: renderHome,
  experience: renderExperience,
  education: renderEducation,
  projects: renderProjects,
  cp: renderCP
};

async function start() {
  const page = document.body.dataset.page;
  const content = document.getElementById("content");
  if (!page || !content) return;

  document.body.classList.add("tui");
  const data = await loadData();
  renderNav(data, page);

  const renderer = renderers[page];
  if (renderer) {
    renderer(content, data);
  } else {
    content.appendChild(el("p", "Page is not configured."));
  }

  renderStatusBar(page);
}

start().catch((err) => {
  const content = document.getElementById("content");
  if (!content) return;
  content.appendChild(el("p", "Failed to load data."));
  content.appendChild(el("pre", String(err)));
});
