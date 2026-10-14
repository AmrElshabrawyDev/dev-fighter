# Deploying Dev Fighter

Vercel (hosting) + Supabase (sign-in and database). Both free tiers are enough to launch.
Nothing secret ever goes in the repository: every key lives in environment variables.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (pick the region closest to your players, e.g. Frankfurt for the Middle East).
2. Create the tables from this repo's migrations:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
3. **Sign-in providers** (Authentication → Sign In / Providers):
   - **GitHub**: github.com → Settings → Developer settings → OAuth Apps → New. Callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`. Paste the client ID and secret into Supabase.
   - **Google**: Google Cloud Console → APIs & Services → Credentials → OAuth client (web), same callback URL.
4. **URLs** (Authentication → URL Configuration):
   - Site URL: `https://<your-domain>`
   - Redirect URLs: `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback` for local work)
5. Keys (Project Settings → API keys): the **publishable** key and the **secret** key. The secret key is for Vercel only — never in the browser, a chat, or a commit.

## 2. Vercel

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new). The defaults are right (Next.js, `npm run build`).
2. **Environment variables** (Project → Settings → Environment Variables), for Production and Preview:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
   | `SUPABASE_SECRET_KEY` | `sb_secret_…` (mark it **Sensitive**) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (optional until you have a domain: Vercel's production URL is used) |

3. **Functions**: scoring and player share cards run headless Chromium (`@sparticuz/chromium`) inside a serverless function. Vercel's default function memory is enough; if you change it, keep it at 1 GB or more. No `vercel.json` is needed.
4. Deploy. Then add your domain (Project → Settings → Domains) and update `NEXT_PUBLIC_SITE_URL` and Supabase's Site URL to it.

## 3. Check it after each deploy

- [ ] `/ar` and `/en` load; `/` redirects to one of them.
- [ ] Sign in with GitHub and with Google; you land back where you were.
- [ ] Open a challenge, paste a solution, **Submit**: an official score comes back within a few seconds. (This is the test that Chromium runs on Vercel — the first submission after a deploy is the slowest.)
- [ ] The leaderboard shows you; your name opens your profile (`/ar/u/<username>`).
- [ ] Share previews: paste a challenge link and your profile link into [opengraph.xyz](https://www.opengraph.xyz) or a WhatsApp chat — each shows its card.
- [ ] `/sitemap.xml` and `/robots.txt` use your domain.
- [ ] Submit the sitemap in [Google Search Console](https://search.google.com/search-console) once the domain is final.

## If something goes wrong

| Symptom | Likely cause |
|---|---|
| "Submitting isn't enabled on this copy" | `SUPABASE_SECRET_KEY` is missing in Vercel (redeploy after adding it) |
| Sign-in returns to the wrong site or errors | Supabase Site URL / redirect URLs don't match your domain |
| "Couldn't score your solution" on every submit | Chromium couldn't start: check the function logs in Vercel (memory, or the function size limit) |
| Share previews show `localhost` | `NEXT_PUBLIC_SITE_URL` isn't set (or was set after the build: redeploy) |
