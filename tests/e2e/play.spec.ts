import { challenges, editor, editorCode, expect, matchValue, setCode, test } from "./fixtures";

const hexagon = challenges.find((c) => c.slug === "the-hexagon")!;
/** A fair first try at the hexagon: the right size and colours, but a plain rectangle */
const rectangleTry = `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:180px;height:200px;background:#89b4fa}
</style>`;

test.describe("the live match", () => {
  for (const c of challenges) {
    test(`reaches 100% with the solution to "${c.slug}"`, async ({ page }) => {
      await page.goto(`/ar/challenges/${c.slug}`);
      await setCode(page, c.reference);
      expect((await editorCode(page)).replace(/\s/g, "")).toBe(c.reference.replace(/\s/g, ""));
      await expect(page.getByTestId("match")).toHaveText("100.0%");
      await expect(page.getByText("تطابق كامل!")).toBeVisible();
      await expect(page.getByTestId("chars")).toHaveText(String(c.reference.length));
    });
  }

  test("treats a background set only on <body> like a real browser does (fills the page)", async ({ page }) => {
    const square = challenges.find((c) => c.slug === "simply-square")!;
    await page.goto(`/ar/challenges/${square.slug}`);
    // no height on body: only the page-wide background makes this a perfect match
    await setCode(page, "<div></div><style>body{background:#1b1b29;margin:0}div{width:140px;height:140px;background:#89b4fa;margin:80px 130px}</style>");
    await expect(page.getByTestId("match")).toHaveText("100.0%");
  });

  test("scores a partial solution in between", async ({ page }) => {
    await page.goto(`/ar/challenges/${hexagon.slug}`);
    await setCode(page, rectangleTry);
    const value = await matchValue(page);
    expect(value).toBeGreaterThan(60);
    expect(value).toBeLessThan(95);
  });

  test("scores the starter code low", async ({ page }) => {
    await page.goto(`/en/challenges/${challenges[0].slug}`);
    await expect(editor(page)).toContainText("width: 100px");
    expect(await matchValue(page)).toBeLessThan(50);
  });

  test("updates as you type", async ({ page }) => {
    await page.goto(`/ar/challenges/${hexagon.slug}`);
    await setCode(page, rectangleTry);
    const before = await matchValue(page);
    await setCode(page, hexagon.reference);
    await expect(page.getByTestId("match")).toHaveText("100.0%");
    expect(before).toBeLessThan(100);
  });
});

test.describe("comparing with the target", () => {
  test("the diff shows mismatched pixels, and none for a perfect match", async ({ page }) => {
    await page.goto(`/ar/challenges/${hexagon.slug}`);
    const redPixels = () =>
      page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
        const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
        let count = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 0 && data[i] > 200 && data[i + 1] < 160) count++;
        return count;
      });

    await setCode(page, rectangleTry);
    await matchValue(page);
    await page.getByRole("button", { name: "الفرق" }).click();
    await expect.poll(redPixels).toBeGreaterThan(1000);

    await setCode(page, hexagon.reference);
    await expect(page.getByTestId("match")).toHaveText("100.0%");
    await expect.poll(redPixels).toBe(0);
  });

  test("hovering shows the line's position in pixels; Shift switches to top/bottom", async ({ page }) => {
    await page.goto(`/ar/challenges/${hexagon.slug}`);
    const output = page.getByTestId("output");
    const position = page.getByTestId("compare-position");
    const box = (await output.boundingBox())!;

    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3);
    await expect(position).toHaveText(String(hexagon.width / 2));
    // the label sits outside the canvas: below it, centred on the line
    let label = (await position.boundingBox())!;
    expect(label.y).toBeGreaterThanOrEqual(box.y + box.height);
    expect(Math.abs(label.x + label.width / 2 - (box.x + box.width * 0.5))).toBeLessThan(2);

    await page.keyboard.down("Shift");
    await expect(position).toHaveText(String(Math.round(hexagon.height * 0.3)));
    // …and beside it in the top/bottom mode
    label = (await position.boundingBox())!;
    expect(label.x).toBeGreaterThanOrEqual(box.x + box.width);
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6);
    await expect(position).toHaveText(String(Math.round(hexagon.height * 0.6)));
    await page.keyboard.up("Shift");
    await expect(position).toHaveText(String(hexagon.width / 2));

    await page.mouse.move(box.x + box.width + 50, box.y - 50); // leave the output
    await expect(position).toHaveCount(0);
  });

  test("the output and the target are shown at the same size, with room around them", async ({ page }) => {
    await page.goto(`/ar/challenges/${hexagon.slug}`);
    const output = (await page.getByTestId("output").boundingBox())!;
    const target = (await page.getByRole("img", { name: "الصورة المطلوب رسمها" }).boundingBox())!;
    expect(Math.round(output.width)).toBe(Math.round(target.width));
    expect(Math.round(output.height)).toBe(Math.round(target.height));
    expect(output.width).toBeGreaterThan(300); // the frame doesn't eat into the canvas on a laptop screen
  });

  test("the slider works from the keyboard", async ({ page }) => {
    await page.goto(`/en/challenges/${hexagon.slug}`);
    const slider = page.getByRole("slider");
    await slider.focus();
    await slider.press("Home");
    await expect(page.getByTestId("compare-position")).toHaveText("0");
    await slider.press("End");
    await expect(page.getByTestId("compare-position")).toHaveText(String(hexagon.width));
  });
});

test.describe("the editor", () => {
  test("keeps your code after a reload", async ({ page }) => {
    await page.goto(`/ar/challenges/${hexagon.slug}`);
    await setCode(page, rectangleTry);
    await matchValue(page);
    await page.reload();
    await expect(editor(page)).toContainText("width:180px");
    expect(await matchValue(page)).toBeLessThan(100);
  });

  test("keeps a separate draft per challenge", async ({ page }) => {
    await page.goto(`/ar/challenges/${hexagon.slug}`);
    await setCode(page, rectangleTry);
    await matchValue(page);
    await page.goto(`/ar/challenges/${challenges[0].slug}`);
    await expect(editor(page)).not.toContainText("width:180px");
  });

  test("“start over” asks first, then restores the starter code", async ({ page }) => {
    await page.goto(`/ar/challenges/${hexagon.slug}`);
    const starter = await editorCode(page);
    await setCode(page, rectangleTry);

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "ابدأ من جديد" }).click();
    await expect(editor(page)).toContainText("width:180px");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "ابدأ من جديد" }).click();
    await expect.poll(() => editorCode(page)).toBe(starter);
  });

  test("wraps long lines instead of scrolling sideways", async ({ page }) => {
    await page.goto(`/ar/challenges/${hexagon.slug}`);
    await setCode(page, hexagon.reference.replace(/\n/g, ""));
    await expect(page.getByTestId("match")).toHaveText("100.0%");
    const sideways = await page.locator(".cm-scroller").evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(sideways).toBeLessThanOrEqual(0);
  });
});

test("clicking a colour copies it", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const c = challenges[0];
  await page.goto(`/ar/challenges/${c.slug}`);
  await page.getByRole("button", { name: c.colors[1] }).click();
  await expect(page.getByText("تم النسخ")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(c.colors[1]);
});
