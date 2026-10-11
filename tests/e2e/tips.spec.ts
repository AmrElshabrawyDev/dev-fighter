import { tips } from "../../src/data/tips";
import { previewDocument } from "../../src/lib/match/document";
import { expect, test } from "./fixtures";

test.describe("every tip draws the same picture before and after", () => {
  test.use({ viewport: { width: 400, height: 300 } });

  for (const tip of tips) {
    test(tip.slug, async ({ page }) => {
      const render = async (code: string) => {
        await page.setContent(previewDocument(code));
        return page.screenshot();
      };
      const blank = await render("");
      const before = await render(tip.before);
      expect(before.equals(blank), "the example should draw something").toBe(false);
      expect((await render(tip.after)).equals(before)).toBe(true);
    });
  }

  test("unitless numbers really are ignored here (the zero-units note)", async ({ page }) => {
    await page.setContent(previewDocument("<div><style>div{width:100px;height:100px;background:#89b4fa}"));
    const withPx = await page.screenshot();
    await page.setContent(previewDocument("<div><style>div{width:100;height:100;background:#89b4fa}"));
    expect((await page.screenshot()).equals(withPx)).toBe(false);
  });
});

test("the tips page lists every tip with its character counts", async ({ page }) => {
  await page.goto("/ar/tips");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("نصائح وحيل لكود أقصر");
  await expect(page.getByRole("article")).toHaveCount(tips.length);
  for (const tip of tips) {
    const article = page.locator(`article#${tip.slug}`);
    await expect(article.getByRole("heading", { level: 2 })).toContainText(tip.title.ar);
    await expect(page.getByTestId(`${tip.slug}-before-chars`)).toHaveText(`${tip.before.length} حرف`);
    await expect(page.getByTestId(`${tip.slug}-after-chars`)).toHaveText(`${tip.after.length} حرف`);
    await expect(article).toContainText(`وفّرت ${tip.before.length - tip.after.length} حرف`);
  }
});

test("the index jumps to a tip", async ({ page }) => {
  await page.goto("/en/tips");
  const last = tips[tips.length - 1];
  await page.getByRole("navigation", { name: "All tips" }).getByRole("link", { name: last.title.en }).click();
  await expect(page).toHaveURL(new RegExp(`#${last.slug}$`));
  await expect(page.locator(`article#${last.slug}`)).toBeInViewport();
});

test("the header and the challenge page link to the tips", async ({ page }) => {
  await page.goto("/ar/challenges");
  await page.getByRole("navigation").first().getByRole("link", { name: "نصائح وحيل" }).click();
  await expect(page).toHaveURL(/\/ar\/tips$/);

  await page.goto("/en/challenges/simply-square");
  await page.getByRole("link", { name: "Tips for shorter code" }).click();
  await expect(page).toHaveURL(/\/en\/tips$/);
});
