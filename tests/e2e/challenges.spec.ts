import { challenges, expect, test } from "./fixtures";

test("the list shows every challenge and each card opens it", async ({ page }) => {
  await page.goto("/ar/challenges");
  const cards = page.getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3 }) });
  await expect(cards).toHaveCount(challenges.length);

  for (const c of challenges) {
    const link = page.getByRole("link", { name: c.title.ar, exact: true });
    await expect(link).toHaveAttribute("href", `/ar/challenges/${c.slug}`);
    // the target image is loaded at its real size (looked up in its own card: today's
    // challenge also appears in the daily card at the top)
    const image = cards.filter({ has: link }).getByRole("img", { name: c.title.ar, exact: true });
    await expect(image).toBeVisible();
    expect(await image.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])).toEqual([c.width, c.height]);
  }

  await page.getByRole("link", { name: challenges[1].title.ar, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/ar/challenges/${challenges[1].slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(challenges[1].title.ar);
});

test("reference solutions, hints and explanations never reach the browser", async ({ request }) => {
  // the most telling line of each solution (its longest), e.g. the clip-path of the hexagon,
  // and every hint and explanation in both languages
  const secrets = challenges.flatMap((c) => [
    c.reference.split("\n").sort((a, b) => b.length - a.length)[0],
    ...[c.explanation, ...c.hints].flatMap((text) => [text.ar, text.en]),
  ]);
  const pages = [
    "/ar", "/en", "/ar/challenges", "/en/challenges", "/ar/tracks", "/en/tracks",
    ...["basics", "layout", "shapes", "ui"].map((t) => `/ar/tracks/${t}`),
    ...challenges.flatMap((c) => [`/ar/challenges/${c.slug}`, `/en/challenges/${c.slug}`]),
  ];
  for (const path of pages) {
    const html = await (await request.get(path)).text();
    for (const secret of secrets) expect(html, `${path} leaks a reference`).not.toContain(secret);
  }
});

test("a challenge page shows its target, size and colours", async ({ page }) => {
  const c = challenges.find((x) => x.type === "component")!;
  await page.goto(`/en/challenges/${c.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(c.title.en);
  await expect(page.getByText(`${c.width}×${c.height}`)).toBeVisible();
  const target = page.getByRole("img", { name: "The image to recreate" });
  expect(await target.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])).toEqual([c.width, c.height]);
  for (const color of c.colors) await expect(page.getByRole("button", { name: color })).toBeVisible();
});
