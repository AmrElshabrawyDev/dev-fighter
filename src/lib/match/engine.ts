/**
 * The instant, in-browser match: render the player's code to pixels and
 * compare them with the target image. (The official score will be computed
 * on the server; this is the live estimate shown while typing.)
 *
 * How the code becomes pixels: it's laid out in a hidden iframe (same origin,
 * but sandboxed with scripts off and every request blocked by the CSP), then
 * that document is drawn as an SVG <foreignObject> image onto a canvas. In
 * Chromium this matches a real screenshot pixel for pixel.
 */
import pixelmatch from "pixelmatch";
import { previewDocument } from "./document";

export type Match = {
  /** 0…1 — the share of pixels that match the target */
  accuracy: number;
  /** the differing pixels on a transparent background */
  diff: ImageData;
};

const XHTML = "http://www.w3.org/1999/xhtml";
const BACKGROUND = ["background-color", "background-image", "background-repeat", "background-position", "background-size"];

let frame: HTMLIFrameElement | undefined;
let queue: Promise<unknown> = Promise.resolve();

function hiddenFrame(): HTMLIFrameElement {
  if (!frame) {
    frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-same-origin"); // readable by us; scripts stay off
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = "position:fixed;left:-10000px;top:0;border:0;opacity:0;pointer-events:none";
    document.body.append(frame);
  }
  return frame;
}

function load(frame: HTMLIFrameElement, html: string): Promise<Document> {
  return new Promise((resolve, reject) => {
    frame.onload = () => (frame.contentDocument ? resolve(frame.contentDocument) : reject(new Error("preview not readable")));
    frame.srcdoc = html;
  });
}

async function draw(src: string, width: number, height: number): Promise<ImageData> {
  const image = new Image();
  image.src = src;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff"; // a browser page with no background is white
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

async function renderNow(code: string, width: number, height: number): Promise<ImageData> {
  const target = hiddenFrame();
  target.style.width = `${width}px`;
  target.style.height = `${height}px`;
  const doc = await load(target, previewDocument(code));
  const view = doc.defaultView!;

  // A page's root background fills the whole viewport, and comes from <body>
  // when <html> has none. Inside an image that rule doesn't apply, so paint
  // it on a layer underneath and take it off the element it came from.
  const visible = (s: CSSStyleDeclaration) => s.backgroundImage !== "none" || s.backgroundColor !== "rgba(0, 0, 0, 0)";
  const source = visible(view.getComputedStyle(doc.documentElement)) ? doc.documentElement : doc.body;
  const sourceStyle = view.getComputedStyle(source);
  const canvasBackground = BACKGROUND.map((p) => `${p}:${sourceStyle.getPropertyValue(p)}`).join(";");

  const clone = doc.documentElement.cloneNode(true) as HTMLElement;
  const cloneSource = source === doc.body ? clone.querySelector("body") : clone;
  cloneSource?.style.setProperty("background", "none", "important");
  const xhtml = new XMLSerializer().serializeToString(clone);

  // <df-canvas> is a made-up tag so the player's selectors (div, p, …) can't reach it
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject width="100%" height="100%"><df-canvas xmlns="${XHTML}" style="display:block;margin:0;padding:0;border:0;width:${width}px;height:${height}px;${canvasBackground}"></df-canvas></foreignObject>` +
    `<foreignObject width="100%" height="100%">${xhtml}</foreignObject></svg>`;
  return draw(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, width, height);
}

/** Render code to pixels. Calls run one at a time (they share the hidden iframe). */
export function renderCode(code: string, width: number, height: number): Promise<ImageData> {
  const result = queue.then(() => renderNow(code, width, height));
  queue = result.catch(() => {});
  return result;
}

/** Load the target image as pixels */
export function loadTarget(src: string, width: number, height: number): Promise<ImageData> {
  return draw(src, width, height);
}

const DIFF_COLOR: [number, number, number] = [243, 139, 168]; // brand red
const SOFT_COLOR: [number, number, number] = [249, 226, 175]; // brand yellow: anti-aliased edges, not counted

export function compare(output: ImageData, target: ImageData): Match {
  const { width, height } = target;
  const diff = new ImageData(width, height);
  const mismatched = pixelmatch(output.data, target.data, diff.data, width, height, {
    threshold: 0.1,
    diffMask: true,
    diffColor: DIFF_COLOR,
    aaColor: SOFT_COLOR,
  });
  return { accuracy: 1 - mismatched / (width * height), diff };
}

/** 0…1 → "99.8" — rounded down, so only an exact match shows 100 */
export function formatAccuracy(accuracy: number): string {
  return (Math.floor(accuracy * 1000) / 10).toFixed(1);
}
