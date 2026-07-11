# GI QBank

An interactive **Gastrointestinal & Hepatobiliary** question bank — USMLE-style clinical
vignettes with full tutor-mode explanations, progress tracking, and a performance dashboard.

Built to match the [Resp QBank](https://zbenja168.github.io/Resp_QBank/): React + Vite + Tailwind,
no backend, all progress stored locally in the browser.

## Features

- **~620 questions** across **31 topics** grouped into **8 categories**.
- Five answer choices per item, one correct, with a teaching **summary**, **why the answer is
  correct**, and **why each other choice is wrong**.
- **Topic filter** — pick any mix of topics/categories to build a custom quiz.
- **Tutor mode** — immediate feedback and explanation after each answer.
- **Dashboard** — overall score, per-topic performance, and session history.
- **Review** — revisit Completed, Incorrect, or Bookmarked questions.
- Answered questions are remembered (localStorage) so "Start Quiz" always serves fresh items.

## Run locally

```bash
npm install
npm run dev      # dev server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Content structure

- `public/data/topics.json` — the category → topic index with per-topic question counts.
- `public/data/questions/<categoryId>.json` — the questions for each category.

Each question follows the shape in `src/types/question.ts`. To edit or add questions, change the
JSON files — no code changes needed.

## Deploy

The production build in `dist/` is a static site. It is published to GitHub Pages from the
`gh-pages` branch (`base: './'` in `vite.config.ts` keeps all asset paths relative, so it works from
any subpath). A GitHub Actions workflow that builds and deploys on every push is available if the
`workflow` OAuth scope is granted.

---
*For educational practice only — not medical advice.*
