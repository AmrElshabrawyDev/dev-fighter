# Dev Fighter — Product spec (draft v0.1)

> Recreate the target with HTML & CSS. Closest match with the shortest code wins.
> Arabic-first, real UI challenges, and live 1v1 battles.

Status: **draft for review** — nothing is built yet. Open questions are at the end.

---

## 1. Why another CSS battle site?

| | cssbattle.dev | Dev Fighter |
|---|---|---|
| Language | English only | **Arabic first (RTL)** + English |
| Targets | Abstract shapes | Shapes **and real UI components** (buttons, cards, navbars…) |
| Learning | Leaderboards only | **Learning tracks**, hints, explained solutions |
| Head-to-head | — | **Live 1v1 battles** (release 2) |

Goals: an open-source portfolio project that grows a community of Arab front-end developers, **and** a place to learn CSS by doing.

---

## 2. Releases

### Release 1 — the core (this spec)
- Bilingual UI: Arabic (default, RTL) and English (LTR)
- Sign in with GitHub or Google
- Challenge page: code editor · live preview · target · compare slider · live match %
- Two challenge types on one engine: **Shape** and **Component**
- Official scoring on the server (can't be faked from the browser)
- Learning tracks, hints, explained solutions after solving
- Profiles, global and per-challenge leaderboards, a daily challenge
- 20–30 challenges at launch

### Release 2 — live 1v1 battles
- Matchmaking queue → both players get the same challenge and a timer (e.g. 10 min)
- See the opponent's live match % (never their code)
- Battle rating (ELO) and battle history

### Release 3 — growth
- Tailwind mode (solutions written with Tailwind classes, separate leaderboard)
- Community-made challenges (submitted, then reviewed)
- Sponsored challenges / optional premium features

---

## 3. Challenges

Every challenge is defined by a **reference solution** (HTML + CSS written by the author). The target image is rendered from it, so targets are always pixel-exact and reproducible.

| Field | Notes |
|---|---|
| `type` | `shape` (400×300) or `component` (size per challenge, e.g. 600×400) |
| `title`, `description` | Arabic + English |
| `difficulty` | easy · medium · hard |
| `track` | optional — position inside a learning track |
| `colors` | the exact colours used, shown to the player (like cssbattle) |
| `reference_html` | the author's solution — never sent to the browser before solving |
| `target_png` | rendered from the reference, stored in Supabase Storage |
| `hints` | 1–3 hints, each costs points when opened |
| `explanation` | Arabic + English write-up, unlocked after solving |
| `published_at` / `daily_date` | scheduling |

**Component challenges** are the same engine with a bigger canvas: the player rebuilds a real-looking UI piece (a pricing card, a login form, a nav bar). Later: multiple states (hover, RTL/LTR) scored together.

---

## 4. Scoring

1. Render the player's code at the challenge size → PNG
2. Compare with the target pixel by pixel (`pixelmatch`) → **accuracy** 0–100 %
3. **Score** (draft, to be tuned with real play):
   - accuracy < 100 % → `600 × accuracy⁴` (getting close matters most)
   - accuracy = 100 % → `600 + code-length bonus` (up to +400; shorter code = more points)
   - each hint opened: −10 % of the final score
4. A player's best submission per challenge counts; ties broken by earlier time

**Two layers so scores can be trusted:**
- *While typing:* an instant estimate in the browser (preview rendered to canvas, compared locally)
- *On submit:* the **official** score is computed on the server in headless Chromium. Only this one reaches the leaderboard.

**Sandbox rules for player code:** no JavaScript, no network. The preview runs in a sandboxed iframe with a strict CSP (`default-src 'none'; style-src 'unsafe-inline'; img-src data:`), so nobody can load the target image or call home.

---

## 5. Pages

| Route | Page |
|---|---|
| `/[locale]` | Home: today's challenge, tracks, top players |
| `/[locale]/challenges` | All challenges, filter by type / difficulty / solved |
| `/[locale]/challenges/[slug]` | The challenge: editor, preview, target, compare, submit |
| `/[locale]/tracks/[slug]` | A learning track and progress |
| `/[locale]/daily` | Today's challenge |
| `/[locale]/leaderboard` | Global and per-challenge rankings |
| `/[locale]/u/[username]` | Public profile: score, solved challenges, best solutions |
| `/[locale]/login` | GitHub / Google sign-in |

`locale` = `ar` (default) or `en`.

---

## 6. Data model (Supabase / PostgreSQL)

```
profiles      id (= auth user) · username · display_name · avatar_url · country · total_score · created_at
tracks        id · slug · title_ar · title_en · description_ar · description_en · position
challenges    id · slug · type · width · height · difficulty · track_id · track_position
              title_ar · title_en · description_ar · description_en · colors[] · reference_html
              target_path · hints jsonb · explanation_ar · explanation_en · published_at · daily_date
submissions   id · user_id · challenge_id · code · chars · accuracy · score · hints_used · created_at
best_scores   user_id · challenge_id · submission_id · score   (one row per user × challenge)
hint_unlocks  user_id · challenge_id · hint_index · created_at
-- release 2
battles       id · challenge_id · status · started_at · ends_at · winner_id
battle_players battle_id · user_id · rating_before · rating_after · best_accuracy · best_score
```

Row-level security: anyone can read published challenges, profiles and leaderboards; users write only their own rows; `reference_html` is readable only by the scoring function.

---

## 7. Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **next-intl** for Arabic/English and RTL/LTR
- **Supabase**: Auth (GitHub, Google), Postgres, Storage (target images), Realtime (battles, release 2)
- **CodeMirror 6** editor (lighter than Monaco, good RTL page support)
- **Scoring service**: headless Chromium (Playwright) + `pixelmatch`, as a serverless function (`@sparticuz/chromium` on Vercel) or a small worker if render time is too slow
- Hosting: **Vercel** + Supabase free tiers to start

---

## 8. Release 1 milestones

1. ✅ **Skeleton** — Next.js app, Arabic/English + RTL/LTR, design system, Supabase auth
2. **Challenge engine** — editor, sandboxed preview, target, compare slider, live accuracy
3. **Official scoring** — server render + pixel diff, submissions, best scores, leaderboards
4. **Content & learning** — 20–30 challenges, tracks, hints, explanations, daily challenge
5. **Polish & launch** — profiles, SEO/OG images, performance, deploy

---

## 9. Open questions

1. You picked "Something else" as a differentiator — what is it?
2. Domain name? (e.g. devfighter.dev / devfighter.io — check availability)
3. Supabase project: you create it (free) and share the URL + anon key via environment variables — never in the repo
4. ~~Visual identity~~ → decided: Amr Elshabrawy's brand colours (Catppuccin Neon Powerline)
