# Portfolio Website

Minimal, old-school multi-page portfolio website with modular JSON data and vanilla JavaScript rendering.

## Overview

This project is designed so content is not hardcoded into page markup. Each section is loaded from JSON, making updates easy from one place.

## Features

- Multi-page layout:
  - Home
  - Experience
  - Education
  - Projects
  - Competitive Programming
- Shared renderer in JavaScript
- Modular JSON data files
- Minimal styling with light/dark theme support
- Expandable project cards with optional links

## Project Structure

```text
.
├── index.html
├── experience.html
├── education.html
├── projects.html
├── cp.html
├── style.css
├── js/
│   └── app.js
└── data/
    ├── source.json
    ├── site.json
    ├── profile.json
    ├── experience.json
    ├── education.json
    ├── skills.json
    ├── projects.json
    └── cp.json
```

## Data Flow

1. The app loads module paths from `data/source.json`.
2. It fetches each JSON module.
3. It renders page content dynamically based on the current page.

## Updating Content

Edit JSON files in `data/`:

- Navigation label/order: `data/site.json`
- Personal summary/contact/profile: `data/profile.json`
- Experience: `data/experience.json`
- Education: `data/education.json`
- Skills: `data/skills.json`
- Projects and project links/details: `data/projects.json`
- Competitive programming entries/honors/profiles: `data/cp.json`

For projects, each card supports these optional fields:

- `githubUrl`
- `demoUrl`
- `details`

## Run Locally

Use a local server (recommended), for example:

```bash
python3 -m http.server 8080
```

Then open:

- http://localhost:8080/

## Publish to GitHub

If this repo is already connected to GitHub:

```bash
git add .
git commit -m "Add README and portfolio documentation"
git push
```

If this is a new GitHub repository:

```bash
git add .
git commit -m "Initial portfolio site"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Notes

- This project is intentionally minimal and framework-free.
- Content updates should be done through JSON modules, not HTML page content.
