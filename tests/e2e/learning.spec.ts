import { tracks } from "../../src/data/challenge-list";
import { dailySlug } from "../../src/data/daily";
import { challenges, expect, matchValue, setCode, test } from "./fixtures";

const leaf = challenges.find((c) => c.slug === "leaf")!;

test.describe("hints", () => {
  test("open one at a time, in order, and are free without scores", async ({ page }) => {
    await page.goto(`/ar/challenges/${leaf.slug}`);
    await expect(page.getByText("التلميحات مجانية على هذه النسخة.")).toBeVisible();
    await page.getByRole("button", { name: `افتح التلميح 1 من ${leaf.hints.length}` }).click();
    await expect(page.getByTestId("hints").getByRole("listitem")).toHaveCount(1);
    await expect(page.getByTestId("hints")).toContainText(leaf.hints[0].ar.slice(0, 12));
    await page.getByRole("button", { name: `افتح التلميح 2 من ${leaf.hints.length}` }).click();
    await expect(page.getByTestId("hints").getByRole("listitem")).toHaveCount(2);
    if (leaf.hints.length === 2) await expect(page.getByRole("button", { name: /افتح التلميح/ })).toHaveCount(0);
  });

  test("come in the page's language", async ({ page }) => {
    await page.goto(`/en/challenges/${leaf.slug}`);
    await page.getByRole("button", { name: /Open hint 1/ }).click();
    await expect(page.getByTestId("hints")).toContainText(leaf.hints[0].en);
  });
});

test.describe("the explained solution", () => {
  test("stays locked until a 100% match, then shows the explanation and the author's code", async ({ page }) => {
    await page.goto(`/ar/challenges/${leaf.slug}`);
    const show = page.getByRole("button", { name: "اعرض الحل المشروح" });
    await expect(show).toBeDisabled();

    await setCode(page, "<div></div><style>div{width:150px;height:150px;background:#a6e3a1}</style>");
    expect(await matchValue(page)).toBeLessThan(100);
    await expect(show).toBeDisabled();

    await setCode(page, leaf.reference);
    await expect(page.getByTestId("match")).toHaveText("100.0%");
    await show.click();
    const solution = page.getByTestId("solution");
    await expect(solution).toBeVisible({ timeout: 15_000 });
    await expect(solution).toContainText("border-radius:150px 0");
    await expect(solution.locator("pre")).toContainText("border-radius:150px 0");
  });
});

test.describe("tracks", () => {
  test("the tracks page lists every track with its challenges", async ({ page }) => {
    await page.goto("/ar/tracks");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("مسارات التعلّم");
    for (const track of tracks) {
      const count = challenges.filter((c) => c.track === track.slug).length;
      const card = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: track.title.ar }) });
      await expect(card).toContainText(`${count} تحديات`);
      await expect(card).toContainText(`0 من ${count} محلولة`);
    }
  });

  test("a track page shows its challenges in order", async ({ page }) => {
    for (const track of tracks) {
      await page.goto(`/en/tracks/${track.slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(track.title.en);
      const titles = await page.getByRole("heading", { level: 3 }).allInnerTexts();
      expect(titles).toEqual(challenges.filter((c) => c.track === track.slug).map((c) => c.title.en));
    }
  });

  test("solving a challenge marks it, and the track's progress moves", async ({ page }) => {
    await page.goto(`/ar/challenges/${leaf.slug}`);
    await setCode(page, leaf.reference);
    await expect(page.getByTestId("match")).toHaveText("100.0%");

    await page.goto(`/ar/tracks/${leaf.track}`);
    await expect(page.getByTestId(`solved-${leaf.slug}`)).toHaveText("✓ حللته في متصفحك");
    const total = challenges.filter((c) => c.track === leaf.track).length;
    await expect(page.getByTestId("track-progress")).toContainText(`1 من ${total} محلولة`);

    await page.goto("/ar/challenges");
    await expect(page.getByTestId(`solved-${leaf.slug}`)).toBeVisible();
  });

  test("an unknown track is a 404", async ({ page, consoleErrors }) => {
    await page.goto("/ar/tracks/no-such-track");
    await expect(page.getByText("404")).toBeVisible();
    consoleErrors.length = 0;
  });
});

test.describe("the daily challenge", () => {
  test("/daily leads to today's challenge, the one on the home page", async ({ page }) => {
    const today = dailySlug(new Date(), challenges.map((c) => c.slug));
    await page.goto("/ar/daily");
    await expect(page).toHaveURL(new RegExp(`/ar/challenges/${today}$`));

    await page.goto("/ar");
    const card = page.getByTestId("daily");
    await expect(card).toContainText(challenges.find((c) => c.slug === today)!.title.ar);
    await card.getByRole("link", { name: "العب تحدي اليوم" }).click();
    await expect(page).toHaveURL(new RegExp(`/ar/challenges/${today}$`));
  });
});
