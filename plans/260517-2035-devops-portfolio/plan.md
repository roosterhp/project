# DevOps Portfolio — CI/CD Pipeline Visual Theme

**Owner:** Phuoc Ho Van | **Stack:** HTML/CSS/JS thuần | **Host:** GitHub Pages via Actions

## Concept

Portfolio render như một CI/CD pipeline đang chạy. Mỗi section = 1 stage (Build → Test → Deploy → Monitor → Contact). Stages có status indicator (success/running), connector lines giữa các stage, log-style typing animation, monospace font cho phần code.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Page structure + content (index.html) | ☐ |
| 2 | Pipeline visual CSS (stages, connectors, dark theme) | ☐ |
| 3 | JS interactions (typing, stage progress, scroll-trigger) | ☐ |
| 4 | Assets placeholder (avatar, CV link, favicon) | ☐ |
| 5 | GitHub Actions deploy workflow | ☐ |
| 6 | README + commit + push | ☐ |

## Acceptance criteria

1. Single-page site, opens via `index.html` in browser, no build step.
2. 5 stages render as connected pipeline blocks with status badges.
3. Sections: whoami (Build), Skills (Test), Projects 4-6 (Deploy), Monitor/stats, Contact + CV download.
4. Responsive (mobile ≥ 360px).
5. `.github/workflows/deploy.yml` deploys to GitHub Pages on push to master.
6. Site loads with zero JS errors in console.

## Out of scope

- Backend / API
- CMS / blog
- Auth, analytics dashboards
- Custom domain (CNAME) — easy to add later

## Files

- `index.html`
- `styles/main.css`
- `scripts/main.js`
- `assets/avatar.svg`, `assets/resume.pdf` (placeholder)
- `.github/workflows/deploy.yml`
- `README.md`, `.gitignore`
