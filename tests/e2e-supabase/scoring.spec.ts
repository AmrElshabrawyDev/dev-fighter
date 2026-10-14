import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BrowserContext } from "@playwright/test";
import { challenges, expect, matchValue, setCode, test } from "../e2e/fixtures";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

const hexagon = challenges.find((c) => c.slug === "the-hexagon")!;
const rectangleTry = `<div></div><style>body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}div{width:180px;height:200px;background:#89b4fa}</style>`;

// one story, in order: if a step fails, the rest are skipped rather than run on a fresh player
test.describe.configure({ mode: "serial" });

// a fresh player for this run
const id = Date.now().toString(36);
const player = { email: `player-${id}@example.com`, password: `pw-${id}-Secret!`, username: `player-${id}`, name: `Test Player ${id}` };
let userId = "";

test.beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: player.email,
    password: player.password,
    email_confirm: true,
    user_metadata: { user_name: player.username, full_name: player.name },
  });
  if (error) throw error;
  userId = data.user.id;
});

test.afterAll(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId); // their profile and scores go with them
});

/** Sign the browser in the way the site does: Supabase's session cookies */
async function signIn(context: BrowserContext) {
  const jar: { name: string; value: string }[] = [];
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => jar,
      setAll: (cookies) => {
        for (const { name, value } of cookies) jar.push({ name, value });
      },
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email: player.email, password: player.password });
  if (error) throw error;
  await context.addCookies(jar.map((c) => ({ ...c, domain: "localhost", path: "/", sameSite: "Lax" as const })));
}

/** A Supabase client acting as the signed-in player, like their browser would */
async function asPlayer(): Promise<SupabaseClient> {
  const client = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email: player.email, password: player.password });
  if (error) throw error;
  return client;
}

test("signing up creates a public profile", async () => {
  const { data } = await admin.from("profiles").select("username, display_name").eq("id", userId).single();
  expect(data).toEqual({ username: player.username, display_name: player.name });
});

test("visitors are asked to sign in to submit, and come back after", async ({ page }) => {
  await page.goto(`/ar/challenges/${hexagon.slug}`);
  const link = page.getByRole("link", { name: "سجّل دخولك لإرسال حلّك" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", `/ar/login?next=${encodeURIComponent(`/ar/challenges/${hexagon.slug}`)}`);
});

test("a signed-in player submits, gets an official score and climbs the leaderboard", async ({ page, context, request }) => {
  test.setTimeout(60_000);
  // a visitor has the pages open before the submission: they must not stay stale afterwards
  const seenByVisitors = async () => {
    const pages = [`/ar/challenges/${hexagon.slug}`, `/en/challenges/${hexagon.slug}`, "/ar/leaderboard", "/en/leaderboard"];
    const html = await Promise.all(pages.map(async (path) => (await request.get(path, { headers: { cookie: "" } })).text()));
    // React separates "@" and the name with a comment in the HTML: <bdi>@<!-- -->name</bdi>
    return html.map((h) => h.replaceAll("<!-- -->", "").includes(`@${player.username}<`));
  };
  expect(await seenByVisitors()).toEqual([false, false, false, false]);

  await signIn(context);
  await page.goto(`/ar/challenges/${hexagon.slug}`);
  const submit = page.getByRole("button", { name: "أرسل الحل" });
  await expect(submit).toBeEnabled();

  // 1) a partial solution: the official match agrees with the live estimate
  await setCode(page, rectangleTry);
  const estimate = await matchValue(page);
  await submit.click();
  const result = page.getByTestId("official-result");
  await expect(result).toBeVisible({ timeout: 15_000 });
  const official = parseFloat((await result.innerText()).match(/([\d.]+)%/)![1]); // the match, in %
  expect(Math.abs(official - estimate)).toBeLessThan(0.2);
  await expect(result).toContainText("رقم قياسي جديد لك!");
  await expect(page.getByTestId("personal-best")).toBeVisible();

  // 2) straight away again: too soon
  await submit.click();
  await expect(page.getByTestId("submit-error")).toHaveText("انتظر 5 ثوانٍ بين كل إرسال والآخر.");

  // 3) the full solution: 100% and the maximum score (as long as the author's)
  await page.waitForTimeout(5_500);
  await setCode(page, hexagon.reference);
  await expect(page.getByTestId("match")).toHaveText("100.0%");
  await expect(page.getByTestId("estimated-score")).toHaveText("1000");
  await submit.click();
  await expect(result).toContainText("100%", { timeout: 15_000 });
  await expect(page.getByTestId("official-score")).toHaveText("1000");
  await expect(result).toContainText("رقم قياسي جديد لك!");
  await expect(result).toContainText(/ترتيبك في هذا التحدي: #\d+/);

  // 4) the database holds exactly what the server scored
  const { data: best } = await admin.from("best_scores").select("score, chars, accuracy").eq("user_id", userId).eq("challenge_slug", hexagon.slug).single();
  expect(best).toEqual({ score: 1000, chars: [...hexagon.reference].length, accuracy: 100 });

  // 5) the leaderboards show it right away, to visitors too, in both languages
  expect(await seenByVisitors()).toEqual([true, true, true, true]);
  await page.goto("/ar/leaderboard");
  const row = page.getByRole("row").filter({ hasText: `@${player.username}` });
  await expect(row).toContainText("1000");
  await page.goto(`/ar/challenges/${hexagon.slug}`);
  await expect(page.getByRole("region", { name: "أفضل اللاعبين في هذا التحدي" })).toContainText(`@${player.username}`);
  await expect(page.getByTestId("personal-best")).toContainText("1000");
});

test("a result can be shared, with the score in the message", async ({ page, context }) => {
  test.setTimeout(60_000);
  await signIn(context);
  await page.goto(`/en/challenges/${hexagon.slug}`);
  await setCode(page, hexagon.reference);
  await expect(page.getByTestId("match")).toHaveText("100.0%");
  await page.waitForTimeout(5_500); // the 5-second limit since the last submission
  await page.getByRole("button", { name: "Submit" }).click();
  const result = page.getByTestId("official-result");
  await expect(page.getByTestId("official-score")).toHaveText("1000", { timeout: 15_000 });

  const x = result.getByRole("link", { name: "X" });
  const href = new URL((await x.getAttribute("href"))!);
  expect(href.host).toBe("x.com");
  expect(href.searchParams.get("text")).toBe(`I scored 1000 points on “${hexagon.title.en}” in Dev Fighter (100% match, ${[...hexagon.reference].length} chars). Can you beat me?`);
  expect(href.searchParams.get("url")).toMatch(new RegExp(`/en/challenges/${hexagon.slug}$`));
});

test("a player can't write a score themselves, even through the API", async () => {
  const client = await asPlayer();
  const forged = await client.rpc("record_submission", { p_user: userId, p_slug: "twin-moons", p_code: "x", p_accuracy: 100, p_score: 1000 });
  expect(forged.error?.code).toBe("42501");

  const inserted = await client.from("best_scores").insert({ user_id: userId, challenge_slug: "twin-moons", submission_id: 1, score: 1000, chars: 1, accuracy: 100, achieved_at: new Date().toISOString() });
  expect(inserted.error?.code).toBe("42501");

  const updated = await client.from("best_scores").update({ score: 999 }).eq("user_id", userId).select();
  expect(updated.error?.code).toBe("42501");

  const { data } = await admin.from("best_scores").select("challenge_slug, score").eq("user_id", userId);
  expect(data).toEqual([{ challenge_slug: hexagon.slug, score: 1000 }]);
});

test("players only ever see their own code", async () => {
  const client = await asPlayer();
  const { data: mine } = await client.from("submissions").select("user_id");
  expect(mine!.length).toBeGreaterThan(0);
  expect(mine!.every((row) => row.user_id === userId)).toBe(true);

  const visitor = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { data: seen } = await visitor.from("submissions").select("id");
  expect(seen).toEqual([]);
});

test("visitors are asked to sign in before opening a hint", async ({ page }) => {
  const leaf = challenges.find((c) => c.slug === "leaf")!;
  await page.goto(`/ar/challenges/${leaf.slug}`);
  await expect(page.getByText("كل تلميح يخصم 10% من نقاطك في هذا التحدي.")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /افتح التلميح 1/ }).click();
  await expect(page.getByRole("link", { name: "سجّل دخولك لفتح التلميحات" })).toBeVisible();
  await expect(page.getByTestId("hints")).toHaveCount(0);
});

test("a hint takes 10% off the official score, and stays open", async ({ page, context }) => {
  test.setTimeout(60_000);
  const leaf = challenges.find((c) => c.slug === "leaf")!;
  await signIn(context);
  await page.goto(`/ar/challenges/${leaf.slug}`);

  // asked first, because it costs points
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /افتح التلميح 1/ }).click();
  await expect(page.getByTestId("hints").getByRole("listitem")).toHaveCount(1);

  await setCode(page, leaf.reference);
  await expect(page.getByTestId("match")).toHaveText("100.0%");
  await expect(page.getByTestId("estimated-score")).toHaveText("900");

  await page.waitForTimeout(5_500); // the earlier submissions' 5-second limit
  await page.getByRole("button", { name: "أرسل الحل" }).click();
  await expect(page.getByTestId("official-score")).toHaveText("900", { timeout: 15_000 });
  await expect(page.getByTestId("official-result")).toContainText("مع 1 تلميح: خصم 10%");

  const { data } = await admin.from("best_scores").select("score, hints_used").eq("user_id", userId).eq("challenge_slug", leaf.slug).single();
  expect(data).toEqual({ score: 900, hints_used: 1 });

  // the opened hint is still there after a reload, and still counts
  await page.reload();
  await expect(page.getByTestId("hints").getByRole("listitem")).toHaveCount(1);
  await expect(page.getByTestId("estimated-score")).toHaveText("900");
});

test("a player can't open hints for free through the API", async () => {
  const client = await asPlayer();
  const { error } = await client.rpc("unlock_hint", { p_user: userId, p_slug: "leaf", p_index: 1 });
  expect(error?.code).toBe("42501");
  const deleted = await client.from("hint_unlocks").delete().eq("user_id", userId).select();
  expect(deleted.error?.code).toBe("42501");
});

test("a player's public profile shows their scores, never their code", async ({ page }) => {
  // from the leaderboard to the profile
  await page.goto("/ar/leaderboard");
  const row = page.getByRole("row").filter({ hasText: `@${player.username}` });
  const rank = (await row.getByRole("cell").first().innerText()).trim(); // "#3"
  await row.getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/ar/u/${player.username}$`));

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(player.name);
  await expect(page.getByTestId("profile-score")).toHaveText("1,900"); // 1000 + 900 (the hint)
  await expect(page.getByTestId("profile-rank")).toHaveText(rank);
  await expect(page.getByTestId("profile-perfect")).toHaveText("2");
  await expect(page.getByTestId("profile-played")).toHaveText("2");

  const leaf = challenges.find((c) => c.slug === "leaf")!;
  const scores = page.getByTestId("profile-scores").getByRole("listitem");
  await expect(scores).toHaveCount(2);
  await expect(scores.filter({ hasText: hexagon.title.ar })).toContainText("1000");
  await expect(scores.filter({ hasText: leaf.title.ar })).toContainText("900");
  await expect(scores.filter({ hasText: leaf.title.ar })).toContainText("تلميحات: 1");
  await scores.filter({ hasText: hexagon.title.ar }).getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/ar/challenges/${hexagon.slug}$`));
});

test("a profile's page and share card are public, and its code stays private", async ({ request }) => {
  const html = (await (await request.get(`/ar/u/${player.username}`, { headers: { cookie: "" } })).text()).replaceAll("<!-- -->", "");
  // the code they submitted is nowhere on it
  expect(html).not.toContain("width:180px;height:200px");
  expect(html).not.toContain(hexagon.reference.split("\n").sort((a, b) => b.length - a.length)[0]);
  // shared links show the player's card, and point at the profile in both languages
  const site = "http://localhost:\\d+";
  expect(html).toMatch(new RegExp(`<meta property="og:image" content="${site}/ar/u/${player.username}/card.png"`));
  expect(html).toMatch(new RegExp(`<link rel="canonical" href="${site}/ar/u/${player.username}"`));
  expect(html).toMatch(new RegExp(`<link rel="alternate" hrefLang="en" href="${site}/en/u/${player.username}"`));
  expect(html).toContain('"@type":"ProfilePage"');

  const card = await request.get(`/en/u/${player.username}/card.png`);
  expect(card.status()).toBe(200);
  expect(card.headers()["content-type"]).toBe("image/png");
  const png = await card.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});

test("the header links a signed-in player to their profile", async ({ page, context }) => {
  await signIn(context);
  await page.goto("/en/challenges");
  await page.locator(`header a[href="/en/u/${player.username}"]`).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(player.name);
});

test("an unknown player is not found, and has no card", async ({ page, request }) => {
  await page.goto("/ar/u/nobody-here-123");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("اللاعب غير موجود");
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  expect((await request.get("/ar/u/nobody-here-123/card.png")).status()).toBe(404);
});
