/**
 * The page a player's code runs in — the same for the live preview, the
 * in-browser match and the target images, so all three render identically.
 *
 * Standards mode (the doctype) and a CSP that blocks every request: no
 * scripts, no network, only inline styles and data: images.
 */
export const PREVIEW_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:";

export function previewDocument(code: string): string {
  return `<!doctype html><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">${code}`;
}
