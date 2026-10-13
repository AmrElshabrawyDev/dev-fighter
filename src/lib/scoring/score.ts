/**
 * How a submission is scored (the same formula in the browser estimate and on
 * the server):
 *
 * - below a perfect match: up to 600 points, falling steeply as the match
 *   drops (600 × accuracy⁴) — getting close matters most
 * - a perfect match: 600 + a length bonus of up to 400. Code as short as the
 *   challenge's "par" (the author's own solution) or shorter earns the full
 *   bonus; longer code earns par ÷ length of it
 *
 * - each hint opened on the challenge takes 10% off
 *
 * Players with equal scores are ranked by shorter code, then by who got there first.
 */
export const MATCH_POINTS = 600;
export const LENGTH_POINTS = 400;
export const MAX_SCORE = MATCH_POINTS + LENGTH_POINTS;

/** Longest code accepted for an official submission (the database enforces it too) */
export const MAX_CODE_CHARS = 10_000;

/** Characters as people count them (and as Postgres's char_length does): emoji count once */
export function countChars(code: string): number {
  return [...code].length;
}

/** Each hint opened takes this share off the score */
export const HINT_PENALTY = 0.1;

/** accuracy is 0…1 */
export function scoreFor(accuracy: number, chars: number, par: number, hintsUsed = 0): number {
  const base =
    accuracy < 1
      ? MATCH_POINTS * Math.max(0, accuracy) ** 4
      : MATCH_POINTS + LENGTH_POINTS * Math.min(1, par / Math.max(1, chars));
  return Math.round(base * Math.max(0, 1 - HINT_PENALTY * hintsUsed));
}
