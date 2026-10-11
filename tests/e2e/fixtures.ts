import { test as base, expect, type Page } from "@playwright/test";
import { launchChallenges } from "../../src/data/challenge-list";

export { expect };
export const challenges = launchChallenges;

/**
 * Every test fails if the page logs an error to the console or throws.
 * A test that expects some (e.g. a 404 page) can filter `consoleErrors`.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        // Playwright's own tracing tries to inject scripts into the preview iframes;
        // the sandbox blocking them is exactly what it should do, not a page error
        if (message.text().startsWith("Blocked script execution in 'about:")) return;
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export const editor = (page: Page) => page.locator(".cm-content");

/** Replace everything in the code editor */
export async function setCode(page: Page, code: string) {
  await editor(page).click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Delete");
  await page.keyboard.insertText(code);
}

/** The code as the editor holds it */
export const editorCode = (page: Page) => editor(page).innerText();

/** Waits for the live match to settle on a number and returns it (0…100) */
export async function matchValue(page: Page): Promise<number> {
  const match = page.getByTestId("match");
  await expect(match).toHaveText(/^\d+\.\d%$/);
  // the match runs a moment after typing stops; wait until it stops changing
  let last = "";
  await expect
    .poll(async () => {
      const now = await match.innerText();
      const stable = now === last;
      last = now;
      return stable;
    }, { intervals: [300] })
    .toBe(true);
  return parseFloat(last);
}
