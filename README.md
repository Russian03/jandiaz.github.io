# Jan Díaz — Portfolio

[![CI](https://github.com/Russian03/jandiaz.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/Russian03/jandiaz.github.io/actions/workflows/ci.yml)
[![Deploy](https://github.com/Russian03/jandiaz.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/Russian03/jandiaz.github.io/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Personal portfolio: an interactive 3D ID card (tap to flip, hold to fidget), an "about me" text,
contact links and an English / Spanish switch. Responsive from small phones to large desktops.

**Live:** https://russian03.github.io/ <!-- update if the URL changes -->

## Stack

React 19 · TypeScript · Vite · React Three Fiber + Rapier physics (3D badge) ·
Vitest + Testing Library · Playwright · GitHub Actions + Pages. No backend, no API keys.

## Editing the content

Everything lives in two Markdown files — change them, push to `main`, and the site redeploys:

| File            | Language          |
| --------------- | ----------------- |
| `content/en.md` | English (default) |
| `content/es.md` | Español           |

The YAML front matter holds name, position, Instagram handle, hint text and link list;
the Markdown body is the "about me" text. Files are validated at build time (a missing field fails CI).
Photo: `public/profile.webp`. CV: drop the PDF in `public/` and point the `cv` link to it
(e.g. add `CV_JanDiaz_EN.pdf` and use it in `content/en.md`).

## Development

```bash
nvm use            # Node 22
npm ci
npm run dev        # http://localhost:5173
```

| Script                          | What it does                     |
| ------------------------------- | -------------------------------- |
| `npm run lint` / `format:check` | ESLint / Prettier                |
| `npm run typecheck`             | TypeScript                       |
| `npm test`                      | Unit tests (Vitest)              |
| `npm run e2e`                   | Browser smoke tests (Playwright) |
| `npm run build`                 | Production build in `dist/`      |

## Structure

```
content/          en.md, es.md — single source of content
public/           photo, CV, favicon
src/components/   Badge (3D card), CardStage, ProfileLinks, LangSwitch
src/content/      front-matter parsing + schema validation
src/i18n/         language resolution (?lang= → saved → English)
tests/  e2e/      unit and smoke tests
```

## Deployment

`.github/workflows/ci.yml` runs lint, format, types, tests, build and e2e on every PR/push.
`deploy.yml` publishes `dist/` to GitHub Pages on each push to `main`
(repository **Settings → Pages → Source: GitHub Actions**).

## Credits & license

Code: [MIT](LICENSE). The badge follows the technique from Vercel's
[Building an interactive 3D event badge with React Three Fiber](https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber)
and is inspired by the [ReactBits Lanyard](https://reactbits.dev/components/lanyard).
