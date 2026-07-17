# Phuoc Ho Van — DevOps Portfolio

A one-page portfolio in an **editorial + ops telemetry** style: a clean,
recruiter-scannable layout where the DevOps flavor comes from real-number
stat tiles, static SVG sparklines, and monospace accents — never from
gimmicks that hide information.

**Stack:** vanilla HTML / CSS / JS — no build step, no framework.
**Host:** GitHub Pages, deployed by GitHub Actions on every push to `master`/`main`.

---

## Sections

| Section          | What it shows                                                    |
|------------------|------------------------------------------------------------------|
| Hero             | Name, value proposition, CTAs + uptime-style status card         |
| Experience       | Case-study cards (Problem → What I did → Result) with stat tiles |
| Skills           | Grouped tool grid with one-line "used for" descriptions          |
| Certifications   | AWS Credly badges with verify links                              |
| Contact          | Intro, socials, and a Formspree-powered contact form             |

---

## Structure

```
.
├── index.html
├── styles/
│   └── main.css
├── scripts/
│   └── main.js
├── assets/
│   ├── avatar.jpg
│   ├── favicon.svg
│   └── resume.md         # placeholder — replace with resume.pdf
├── .github/workflows/
│   └── deploy.yml        # GitHub Pages deploy
└── README.md
```

---

## Run locally

It's a static site. Two options:

```bash
# 1) Just double-click index.html, or:
# 2) serve over a local HTTP server (recommended for relative paths)
python -m http.server 8080
# then open http://localhost:8080
```

---

## Deploy to GitHub Pages

The workflow `.github/workflows/deploy.yml` deploys on push to `master`/`main`.

One-time GitHub setup:

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source = GitHub Actions**.
4. Push any commit — the **Deploy portfolio** workflow runs and publishes.
5. The site URL appears at the bottom of the workflow run, typically:
   `https://<username>.github.io/<repo>/`.

Manual run is also available via **Actions → Deploy portfolio → Run workflow**.

---

## Customize

- **Personal info / bio / links** — edit `index.html` (search for `Phuoc`).
- **Status card stats** — change `data-count` / `data-suffix` attrs in the hero.
- **Experience** — edit the 3 `<article class="case-card">` blocks; stat tiles
  live in each card's `.tile-row` (sparklines are hand-authored inline SVG).
- **Skills** — edit the 6 `<article class="skill-group">` blocks.
- **Resume** — drop your `resume.pdf` into `assets/` (delete `assets/resume.md`).
- **Avatar** — replace `assets/avatar.jpg` with your own image.
- **Colors** — tweak CSS variables at the top of `styles/main.css`.

---

## Contact

- Email: hophuoc.work@gmail.com
- GitHub: https://github.com/roosterhp
- Location: Ho Chi Minh City / Da Nang, Vietnam
