import { challenges, expect, test } from "./fixtures";

// These run against a build without Supabase keys (npm run test:e2e). The full
// sign-in → submit → leaderboard story is in tests/e2e-supabase.

test("submitting is shown as unavailable, and the live estimate still works", async ({ page }) => {
  await page.goto(`/ar/challenges/${challenges[0].slug}`);
  await expect(page.getByRole("button", { name: "الإرسال غير مفعّل على هذه النسخة" })).toBeDisabled();
  await expect(page.getByTestId("match")).toHaveText(/%$/);
  await expect(page.getByTestId("estimated-score")).toHaveText(/^\d+$/);
  await expect(page.getByText(`حل المؤلف ${[...challenges[0].reference].length} حرف`)).toBeVisible();
  await expect(page.getByRole("region", { name: "أفضل اللاعبين في هذا التحدي" })).toHaveCount(0);
});

test("the leaderboard says it isn't enabled, and explains the scoring", async ({ page }) => {
  await page.goto("/ar");
  await page.getByRole("navigation").first().getByRole("link", { name: "المتصدرون" }).click();
  await expect(page).toHaveURL(/\/ar\/leaderboard$/);
  await expect(page.getByText("لوحة المتصدرين غير مفعّلة على هذه النسخة.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "كيف تُحسب النقاط؟" })).toBeVisible();
});

test("player profiles need Supabase: without it there are none", async ({ page, request }) => {
  await page.goto("/en/u/someone");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Player not found");
  await expect(page.getByRole("link", { name: "Leaderboard" }).last()).toHaveAttribute("href", "/en/leaderboard");
  expect((await request.get("/en/u/someone/card.png")).status()).toBe(404);
});
