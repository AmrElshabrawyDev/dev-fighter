# Dev Fighter

**Recreate the target with HTML & CSS. Closest match with the shortest code wins.**

An Arabic-first CSS challenge platform — shape and real UI-component challenges, learning tracks, and (soon) live 1v1 battles.

> Release 1 is built: skeleton, challenge engine, official scoring and leaderboards, content and learning, and profiles, sharing and SEO. Next: [deploying it](docs/DEPLOY.md). Product spec: [docs/SPEC.md](docs/SPEC.md)

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
6. **On Vercel**: add the same three variables, plus `NEXT_PUBLIC_SITE_URL` (your domain), under Project → Settings → Environment Variables. Scoring and player share cards run headless Chromium in a serverless function (`@sparticuz/chromium`), so keep functions at 1 GB of memory or more. The full checklist: [docs/DEPLOY.md](docs/DEPLOY.md).

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
| `tests/unit/learning.test.ts` | Tracks go from easy to hard; every challenge has hints, an explanation and no text; hints are handed out one by one and the solution only for a real 100% match |
| `tests/unit/daily.test.ts` | The daily challenge: the same all day, changes at midnight Mecca time, goes through every challenge before repeating |
| `tests/unit/bidi.test.ts` | CSS snippets inside Arabic text stay in one left-to-right piece |
| `tests/unit/tips.test.ts` | Every tip has Arabic and English text and really makes the code shorter |
| `tests/e2e/navigation.spec.ts` | Language redirects, RTL/LTR, the language switcher, 404 pages, no sideways scrolling on phones |
| `tests/e2e/challenges.spec.ts` | The list, target images, and that no page's HTML contains a reference solution, a hint or an explanation |
| `tests/e2e/play.spec.ts` | Each solution reaches 100%, partial ones score in between, diff view, compare line + Shift, slider, drafts, start over, copying colours, line wrapping |
| `tests/e2e/tips.spec.ts` | Every tip's before and after draw exactly the same picture; the tips page, its index and links |
| `tests/e2e/learning.spec.ts` | Hints open in order and in the page's language; the solution unlocks only at 100%; tracks, solved marks and progress; the daily challenge |
| `tests/unit/share.test.ts` | Every share card exists, is 1200×630 and up to date; player cards show the right numbers, can't be broken by a name, only fetch avatars from GitHub/Google, and render in the real browser |
| `tests/unit/seo.test.ts` | Canonical and hreflang links, share images, the sitemap (every page, both languages), robots.txt, the site address |
| `tests/e2e/seo.spec.ts` | Each page's head (canonical, hreflang, share card, structured data); every sitemap page loads and names itself; robots.txt; sharing copies the right message and link |
| `tests/e2e/without-supabase.spec.ts` | Without Supabase: submitting and the leaderboard say they're off, the live estimate still works, there are no profiles |
| `supabase/tests/scores.test.sql` | Profiles on sign-up, best-score rules, the 5-second limit, the leaderboard sum — and that players can't write scores or read others' code |
| `supabase/tests/hints.test.sql` | Hints open in order, are counted per challenge and noted on scores; players can't open or delete hints themselves |
| `tests/e2e-supabase/scoring.spec.ts` | A real player signs in, submits, gets an official score matching the estimate, sets a best, appears on both leaderboards right away (also for visitors who had the pages open), shares the result; a hint takes 10% off and stays open; the API refuses forged scores and free hints; their public profile and share card show their scores but never their code; unknown players are a 404 |

Every end-to-end test also fails if the page logs an error to the console.

## How scoring works

1. Every challenge has a **reference solution**. `npm run targets` renders each one in headless Chromium to `public/targets/<slug>.png`, so the browser only ever gets the image, never the reference code.
2. **While you type**, your code is laid out in a hidden sandboxed iframe (scripts off, every request blocked), drawn onto a canvas through an SVG `<foreignObject>`, and compared with the target pixel by pixel using `pixelmatch`. In Chromium this matches a real screenshot exactly. That's the instant estimate.
3. **When you submit**, the server renders your code in headless Chromium (JavaScript off, network cut) and compares it with the reference rendered by the same browser. That official score is saved through a database function only the server's secret key can call, so a score can't be forged from the browser or the API.
4. **Points**: below 100% you get up to 600 (`600 × match⁴`); at 100% you get 600 plus a length bonus of up to 400 — full when your code is as short as the author's solution or shorter. Each hint opened on the challenge takes 10% off. Equal scores rank by shorter code, then by who got there first.

## Learning

- **25 challenges in 4 tracks** (basics, centering & layout, shapes, real UI), each track from easy to hard. Every challenge names the CSS skill it practises.
- **Hints**: 1–3 per challenge, opened one at a time. Once scores are kept, each costs 10% of that challenge's score and needs sign-in (recorded in the database, so it can't be dodged).
- **Explained solutions**: the author's code and an explanation, unlocked only when your code matches 100% in the official renderer (or you already scored 100%). Hints and explanations are never in the page itself.
- **Progress**: challenges solved officially, or at 100% in your browser, are marked in the lists and tracks.
- **Daily challenge**: the same for everyone each day, changing at midnight Mecca time; `/ar/daily` always points to it.
- **No text in challenges**: fonts differ between systems, so a perfect match would depend on the player's computer.

## Profiles, sharing and search

- **Player profiles** at `/ar/u/<username>`: total score, rank, perfect matches, progress in each track, and the best score on every challenge played. The code itself is never shown. Names on the leaderboards link to them, and so does your name in the header.
- **Share cards**: the image a link shows on WhatsApp, X, LinkedIn… The site's and each challenge's (in both languages) are drawn by `npm run targets` into `public/og/`; a player's card is drawn on request with their current scores (`/ar/u/<username>/card.png`). They're HTML pages drawn by headless Chromium, which gets Arabic right.
- **Share buttons** on challenges, on official results ("I scored 1000 on…") and on profiles: the device's share sheet, or copy the link, plus X, LinkedIn and WhatsApp.
- **Search**: each page names its address in both languages (canonical + hreflang), `/sitemap.xml` lists every page, `/robots.txt` keeps sign-in out, and pages carry structured data (website, exercise, profile). Set `NEXT_PUBLIC_SITE_URL` to your domain so all of these use it.

## Adding or changing a challenge

1. Edit `src/data/challenge-list.ts`: the reference, every colour it uses, its track and skill, 1–3 hints and an explanation (Arabic and English). No text in the target.
2. Render the targets — needs Node 22.18+ and Playwright's Chromium once (`npx playwright install chromium`):
   ```bash
   npm run targets
   ```
3. Commit the PNGs, `src/data/targets.json` and `src/data/og.json` with your change (it also redraws the share cards). The build fails if a target is missing or out of date, and the tests fail if a share card is.

## Project map

| Path | What it is |
|---|---|
| `src/app/[lang]/` | Pages, one tree per language (`/ar`, `/en`) |
| `src/i18n/` | Locales, RTL/LTR, and the Arabic/English dictionaries |
| `src/proxy.ts` | Sends visitors to their language and refreshes the Supabase session |
| `src/app/auth/` | OAuth callback and sign-out |
| `src/lib/supabase/` | Supabase clients: session (server/browser), public reads, and the server-only secret-key client |
| `supabase/migrations/` | Database: profiles, submissions, best scores, leaderboard, row level security |
| `src/data/challenge-list.ts` | Tracks, and the challenges with their reference solutions, hints and explanations |
| `src/data/daily.ts` | Which challenge is today's |
| `src/lib/actions/learning.ts` | Server Actions: hints (one at a time) and explained solutions (after 100%) |
| `src/lib/progress.ts` · `src/components/progress/` | Solved marks and track progress |
| `src/app/[lang]/tracks/` · `src/app/[lang]/daily/` | Learning tracks, and the link to today's challenge |
| `src/data/challenges.ts` | Server-side access + build-time checks; the browser gets challenges without the reference |
| `scripts/render-targets.mjs` | `npm run targets` — renders each reference to its target PNG, then the share cards |
| `src/app/[lang]/challenges/[slug]/` | The challenge page |
| `src/components/play/` | Editor (CodeMirror), live preview, compare slider, diff view, match meter, submit panel, top players |
| `src/lib/match/` | The preview document (CSP sandbox) and the in-browser match engine |
| `src/lib/scoring/` | The score formula and the official server renderer |
| `src/lib/actions/submit.ts` | The submit Server Action: auth, limits, official score, save |
| `src/lib/leaderboard.ts` · `src/app/[lang]/leaderboard/` | Leaderboards, read live at request time |
| `src/data/tips.ts` · `src/app/[lang]/tips/` | Tips & tricks for shorter code (before/after examples) |
| `src/components/CodeBlock.tsx` | Code samples highlighted on the server, in the editor's colours |
| `src/lib/drafts.ts` | Keeps your code per challenge in localStorage |
| `src/app/[lang]/u/[username]/` · `src/lib/profiles.ts` | Public player profiles and their share card |
| `src/lib/og/` | Share cards: the design (`card.ts`), what goes on each (`cards.ts`), drawing player cards (`render.ts`) |
| `src/lib/seo.ts` · `src/lib/site.ts` · `src/app/sitemap.ts` · `src/app/robots.ts` | Page metadata, the site's address, sitemap and robots.txt |
| `docs/DEPLOY.md` | Deploying to Vercel + Supabase, and what to check after |
| `tests/` | Unit (`tests/unit`), end-to-end (`tests/e2e`) and Supabase end-to-end tests (`tests/e2e-supabase`) |

Built by [Amr Elshabrawy](https://amrelshabrawydev.github.io).
