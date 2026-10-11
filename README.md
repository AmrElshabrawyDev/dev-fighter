# Dev Fighter

**Recreate the target with HTML & CSS. Closest match with the shortest code wins.**

An Arabic-first CSS challenge platform — shape and real UI-component challenges, learning tracks, and (soon) live 1v1 battles.

> 🚧 Release 1 in progress — stages 1 (skeleton), 2 (challenge engine) and 3 (official scoring and leaderboards) are done. See the product spec: [docs/SPEC.md](docs/SPEC.md)

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · CodeMirror 6 · pixelmatch · headless Chromium (Playwright / @sparticuz/chromium) · Supabase (auth, Postgres) · Arabic (RTL, default) + English

## Run it locally

```bash
npm install
npx playwright install chromium   # once: the browser that scores submissions (and runs the tests)
cp .env.example .env.local        # optional: add Supabase keys (see below)
npm run dev                       # http://localhost:3000 → redirects to /ar or /en
```

Without Supabase keys the whole site works: you can play every challenge with the live match; sign-in, submitting and the leaderboard just say they aren't enabled.

## Setting up Supabase (sign-in, submissions, leaderboards)

1. **Create a project** at [supabase.com](https://supabase.com) (the free tier is enough).
2. **Keys → `.env.local`** (Project Settings → API keys). Never commit this file.
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
   SUPABASE_SECRET_KEY=sb_secret_…        # server only — never NEXT_PUBLIC_
   ```
3. **Create the tables** (profiles, submissions, best scores, leaderboard):
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
4. **Sign-in providers** (Authentication → Sign In / Providers):
   - **GitHub**: create an OAuth app at github.com → Settings → Developer settings, with the callback URL `https://<project-ref>.supabase.co/auth/v1/callback`, then paste its client ID and secret into Supabase.
   - **Google**: same idea in Google Cloud Console (OAuth client, same callback URL).
5. **Redirect URLs** (Authentication → URL Configuration): set the Site URL to your domain and add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`.
6. **On Vercel**: add the same three variables under Project → Settings → Environment Variables. Scoring runs headless Chromium in a serverless function (`@sparticuz/chromium`), so give functions at least 1 GB of memory.

### Or run Supabase on your machine

With Docker running: `npx supabase start` starts a local Supabase with the same tables. `npx supabase status` shows its URL and keys for `.env.local`.

## Tests

```bash
npm test                    # unit tests (Vitest), including the official renderer — a few seconds
npm run test:e2e            # end-to-end tests (Playwright): builds the site without Supabase, then plays it
npm run test:db             # database tests (pgTAP) — needs the local Supabase (npx supabase start)
npm run test:e2e:supabase   # sign in → submit → leaderboard, against the local Supabase
```

| File | What it checks |
|---|---|
| `tests/unit/challenges.test.ts` | Every challenge is well formed, lists every colour it uses, and has an up-to-date target image of the right size; the browser never gets a reference solution |
| `tests/unit/scoring.test.ts` | The score formula; every reference scores 100% in the official renderer and agrees with the target images; player JavaScript never runs |
| `tests/unit/i18n.test.ts` | Arabic and English have the same keys and no empty text; language picking from the cookie and the browser |
| `tests/unit/safety.test.ts` | Sign-in redirects stay on the site; the preview sandbox blocks scripts and requests; match % formatting |
| `tests/unit/tips.test.ts` | Every tip has Arabic and English text and really makes the code shorter |
| `tests/e2e/navigation.spec.ts` | Language redirects, RTL/LTR, the language switcher, 404 pages, no sideways scrolling on phones |
| `tests/e2e/challenges.spec.ts` | The list, target images, and that no page's HTML contains a reference solution |
| `tests/e2e/play.spec.ts` | Each solution reaches 100%, partial ones score in between, diff view, compare line + Shift, slider, drafts, start over, copying colours, line wrapping |
| `tests/e2e/tips.spec.ts` | Every tip's before and after draw exactly the same picture; the tips page, its index and links |
| `tests/e2e/without-supabase.spec.ts` | Without Supabase: submitting and the leaderboard say they're off, the live estimate still works |
| `supabase/tests/scores.test.sql` | Profiles on sign-up, best-score rules, the 5-second limit, the leaderboard sum — and that players can't write scores or read others' code |
| `tests/e2e-supabase/scoring.spec.ts` | A real player signs in, submits, gets an official score matching the estimate, sets a best, appears on both leaderboards right away (also for visitors who had the pages open); the API refuses forged scores |

Every end-to-end test also fails if the page logs an error to the console.

## How scoring works

1. Every challenge has a **reference solution**. `npm run targets` renders each one in headless Chromium to `public/targets/<slug>.png`, so the browser only ever gets the image, never the reference code.
2. **While you type**, your code is laid out in a hidden sandboxed iframe (scripts off, every request blocked), drawn onto a canvas through an SVG `<foreignObject>`, and compared with the target pixel by pixel using `pixelmatch`. In Chromium this matches a real screenshot exactly. That's the instant estimate.
3. **When you submit**, the server renders your code in headless Chromium (JavaScript off, network cut) and compares it with the reference rendered by the same browser. That official score is saved through a database function only the server's secret key can call, so a score can't be forged from the browser or the API.
4. **Points**: below 100% you get up to 600 (`600 × match⁴`); at 100% you get 600 plus a length bonus of up to 400 — full when your code is as short as the author's solution or shorter. Equal scores rank by shorter code, then by who got there first.

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
| `src/lib/supabase/` | Supabase clients: session (server/browser), public reads, and the server-only secret-key client |
| `supabase/migrations/` | Database: profiles, submissions, best scores, leaderboard, row level security |
| `src/data/challenge-list.ts` | Launch challenges and their reference solutions |
| `src/data/challenges.ts` | Server-side access + build-time checks; the browser gets challenges without the reference |
| `scripts/render-targets.mjs` | `npm run targets` — renders each reference to its target PNG |
| `src/app/[lang]/challenges/[slug]/` | The challenge page |
| `src/components/play/` | Editor (CodeMirror), live preview, compare slider, diff view, match meter, submit panel, top players |
| `src/lib/match/` | The preview document (CSP sandbox) and the in-browser match engine |
| `src/lib/scoring/` | The score formula and the official server renderer |
| `src/lib/actions/submit.ts` | The submit Server Action: auth, limits, official score, save |
| `src/lib/leaderboard.ts` · `src/app/[lang]/leaderboard/` | Leaderboards, read live at request time |
| `src/data/tips.ts` · `src/app/[lang]/tips/` | Tips & tricks for shorter code (before/after examples) |
| `src/components/CodeBlock.tsx` | Code samples highlighted on the server, in the editor's colours |
| `src/lib/drafts.ts` | Keeps your code per challenge in localStorage |
| `tests/` | Unit (`tests/unit`), end-to-end (`tests/e2e`) and Supabase end-to-end tests (`tests/e2e-supabase`) |

Built by [Amr Elshabrawy](https://amrelshabrawydev.github.io).
