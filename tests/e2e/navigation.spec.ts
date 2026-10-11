import { challenges, expect, test } from "./fixtures";

test.describe("language routing", () => {
  const redirectOf = async (request: import("@playwright/test").APIRequestContext, path: string, headers: Record<string, string>) => {
    const response = await request.get(path, { headers, maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    return new URL(response.headers()["location"], "http://x").pathname;
  };

  test("sends visitors to Arabic by default", async ({ request }) => {
    expect(await redirectOf(request, "/", { "accept-language": "fr-FR,fr;q=0.9" })).toBe("/ar");
  });

  test("follows the browser's language", async ({ request }) => {
    expect(await redirectOf(request, "/", { "accept-language": "en-US,en;q=0.9" })).toBe("/en");
    expect(await redirectOf(request, "/", { "accept-language": "ar-EG,ar;q=0.9,en;q=0.8" })).toBe("/ar");
  });

  test("a saved choice beats the browser's language", async ({ request }) => {
    expect(await redirectOf(request, "/", { "accept-language": "en-US", cookie: "NEXT_LOCALE=ar" })).toBe("/ar");
  });

  test("keeps the rest of the path", async ({ request }) => {
    expect(await redirectOf(request, "/challenges", { "accept-language": "en" })).toBe("/en/challenges");
  });
});

test("Arabic pages are right-to-left, English pages left-to-right", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ارسم الهدف بالكود");

  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Draw the target with code");
});

test("the language switcher keeps the page and remembers the choice", async ({ page }) => {
  await page.goto("/ar/challenges");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/challenges$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Challenges");

  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});

test("the home page's main button opens the first challenge", async ({ page }) => {
  await page.goto("/ar");
  await page.getByRole("link", { name: "ابدأ أول تحدٍّ" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/ar/challenges/${challenges[0].slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(challenges[0].title.ar);
});

test("the sign-in page loads", async ({ page }) => {
  await page.goto("/ar/login");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ادخل الساحة");
});

test("unknown pages show the 404 page", async ({ page, consoleErrors }) => {
  for (const path of ["/ar/no-such-page", "/ar/challenges/no-such-challenge", "/en/challenges/no-such-challenge"]) {
    await page.goto(path);
    await expect(page.getByText("404")).toBeVisible();
  }
  // the browser logs the 404 response itself; that one is expected
  const unexpected = consoleErrors.filter((e) => !e.includes("404"));
  consoleErrors.length = 0;
  expect(unexpected).toEqual([]);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  for (const path of ["/ar", "/en", "/ar/challenges", `/ar/challenges/${challenges[0].slug}`, "/ar/tips", "/ar/login"]) {
    test(`${path} fits the screen without sideways scrolling`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
