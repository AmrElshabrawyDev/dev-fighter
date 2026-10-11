# Dev Fighter

**Recreate the target with HTML & CSS. Closest match with the shortest code wins.**

An Arabic-first CSS challenge platform — shape and real UI-component challenges, learning tracks, and (soon) live 1v1 battles.

> 🚧 Release 1 in progress — stages 1 (skeleton) and 2 (challenge engine) are done. See the product spec: [docs/SPEC.md](docs/SPEC.md)

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · CodeMirror 6 · pixelmatch · Supabase (auth, Postgres) · Arabic (RTL, default) + English

## Run it locally

```bash
npm install
cp .env.example .env.local   # optional: add Supabase keys to enable sign-in
npm run dev                   # http://localhost:3000 → redirects to /ar or /en
```

Without Supabase keys the whole site works; the sign-in page just says sign-in isn't enabled yet.

## Tests

```bash
npm test            # unit tests (Vitest) — a second or so
npm run test:e2e    # end-to-end tests (Playwright): builds the site, then plays it in Chromium
```

The first time, install the browser for the end-to-end tests: `npx playwright install chromium`.

| File | What it checks |
|---|---|
| `tests/unit/challenges.test.ts` | Every challenge is well formed, lists every colour it uses, and has an up-to-date target image of the right size; the browser never gets a reference solution |
| `tests/unit/i18n.test.ts` | Arabic and English have the same keys and no empty text; language picking from the cookie and the browser |
| `tests/unit/safety.test.ts` | Sign-in redirects stay on the site; the preview sandbox blocks scripts and requests; match % formatting |
| `tests/e2e/navigation.spec.ts` | Language redirects, RTL/LTR, the language switcher, 404 pages, no sideways scrolling on phones |
| `tests/e2e/challenges.spec.ts` | The list, target images, and that no page's HTML contains a reference solution |
| `tests/e2e/play.spec.ts` | Each solution reaches 100%, partial ones score in between, diff view, compare line + Shift, slider, drafts, start over, copying colours, line wrapping |

Every end-to-end test also fails if the page logs an error to the console.

## How the live match works

1. Every challenge has a **reference solution**. `npm run targets` renders each one in headless Chromium to `public/targets/<slug>.png`, so the browser only ever gets the image, never the reference code.
2. While you type, your code is laid out in a hidden sandboxed iframe (scripts off, every request blocked), drawn onto a canvas through an SVG `<foreignObject>`, and compared with the target pixel by pixel using `pixelmatch`. In Chromium this render matches a real screenshot exactly.
3. The result is an instant **estimate**. Official scores will be computed on the server (stage 3).

## Adding or changing a challenge

1. Edit `src/data/challenge-list.ts` (list every colour the reference uses).
2. Render the targets — needs Node 22.18+ and Playwright's Chromium once (`npx playwright install chromium`):
   ```bash
   npm run targets
   ```
3. Commit the PNGs and `src/data/targets.json` with your change. The build fails if a target is missing or out of date.

## Project map

| Path | What it is |
|---|---|
| `src/app/[lang]/` | Pages, one tree per language (`/ar`, `/en`) |
| `src/i18n/` | Locales, RTL/LTR, and the Arabic/English dictionaries |
| `src/proxy.ts` | Sends visitors to their language and refreshes the Supabase session |
| `src/app/auth/` | OAuth callback and sign-out |
| `src/lib/supabase/` | Supabase clients (server and browser) |
| `src/data/challenge-list.ts` | Launch challenges and their reference solutions |
| `src/data/challenges.ts` | Server-side access + build-time checks; the browser gets challenges without the reference |
| `scripts/render-targets.mjs` | `npm run targets` — renders each reference to its target PNG |
| `src/app/[lang]/challenges/[slug]/` | The challenge page |
| `src/components/play/` | Editor (CodeMirror), live preview, compare slider, diff view, match meter |
| `src/lib/match/` | The preview document (CSP sandbox) and the in-browser match engine |
| `src/lib/drafts.ts` | Keeps your code per challenge in localStorage |
| `tests/` | Unit tests (`tests/unit`) and end-to-end tests (`tests/e2e`) |

Built by [Amr Elshabrawy](https://amrelshabrawydev.github.io).
