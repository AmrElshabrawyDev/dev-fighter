# Dev Fighter

**Recreate the target with HTML & CSS. Closest match with the shortest code wins.**

An Arabic-first CSS challenge platform — shape and real UI-component challenges, learning tracks, and (soon) live 1v1 battles.

> 🚧 Release 1 in progress — stage 1 (skeleton) is done. See the product spec: [docs/SPEC.md](docs/SPEC.md)

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Supabase (auth, Postgres) · Arabic (RTL, default) + English

## Run it locally

```bash
npm install
cp .env.example .env.local   # optional: add Supabase keys to enable sign-in
npm run dev                   # http://localhost:3000 → redirects to /ar or /en
```

Without Supabase keys the whole site works; the sign-in page just says sign-in isn't enabled yet.

## Project map

| Path | What it is |
|---|---|
| `src/app/[lang]/` | Pages, one tree per language (`/ar`, `/en`) |
| `src/i18n/` | Locales, RTL/LTR, and the Arabic/English dictionaries |
| `src/proxy.ts` | Sends visitors to their language and refreshes the Supabase session |
| `src/app/auth/` | OAuth callback and sign-out |
| `src/lib/supabase/` | Supabase clients (server and browser) |
| `src/data/challenges.ts` | Launch challenges — each target is rendered from its reference solution |
| `src/components/TargetPreview.tsx` | Renders challenge code in a sandboxed iframe (no scripts, no network) |

Built by [Amr Elshabrawy](https://amrelshabrawydev.github.io).
