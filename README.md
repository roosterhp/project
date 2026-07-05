# Phuoc Ho Van — DevOps Portfolio

A creative one-page portfolio rendered as a **CI/CD pipeline**.
Each section is a pipeline stage: `build → test → deploy → monitor → notify`.

**Stack:** vanilla HTML / CSS / JS — no build step, no framework.
**Host:** GitHub Pages, deployed by GitHub Actions on every push to `master`.

---

## Preview

| Stage    | Section          | What it shows                                |
|----------|------------------|----------------------------------------------|
| build    | `whoami`         | Terminal-style intro + profile card          |
| test     | `skills.spec`    | Test-suite style skill matrix                |
| deploy   | `projects`       | "Live services" — DevOps projects            |
| monitor  | `metrics`        | Animated career counters                     |
| notify   | `contact`        | Webhook-style contact block + CTA buttons    |

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
│   ├── avatar.svg
│   ├── favicon.svg
│   └── resume.md         # placeholder — replace with resume.pdf
├── .github/workflows/
│   └── deploy.yml        # GitHub Pages deploy
├── plans/                # implementation plan (kept for reference)
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

The workflow `.github/workflows/deploy.yml` deploys on push to `master`.

One-time GitHub setup:

1. Push this repo to GitHub (e.g. `roosterhp/test`).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source = GitHub Actions**.
4. Push any commit — the **Deploy portfolio** workflow runs and publishes.
5. The site URL appears at the bottom of the workflow run, typically:
   `https://<username>.github.io/<repo>/`.

Manual run is also available via **Actions → Deploy portfolio → Run workflow**.

---

## Customize

- **Personal info / bio / links** — edit `index.html` (search for `Phuoc`).
- **Skills** — edit the 6 `<article class="skill-suite">` blocks.
- **Projects** — edit the 6 `<article class="project">` blocks.
- **Metrics** — change `data-count` attrs on `.metric-value`.
- **Resume** — drop your `resume.pdf` into `assets/` (delete `assets/resume.md`).
- **Avatar** — replace `assets/avatar.svg` with your own SVG/PNG.
- **Colors** — tweak CSS variables at the top of `styles/main.css`.

---

## Contact

- Email: hophuoc.work@gmail.com
- GitHub: https://github.com/roosterhp
- Location: Ho Chi Minh City / Da Nang, Vietnam
