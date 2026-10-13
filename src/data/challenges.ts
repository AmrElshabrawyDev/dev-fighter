import "server-only";
import { launchChallenges, targetVersion, tracks, type Challenge, type Track } from "./challenge-list";
import { countChars } from "@/lib/scoring/score";
import targets from "./targets.json";

export type { Challenge, ChallengeType, Difficulty, Track, TrackSlug } from "./challenge-list";
export { tracks };

/**
 * What the browser gets: no reference solution, no hints, no explanation.
 * Hints are handed out one by one (they cost points), the explanation only
 * after a 100% match.
 */
export type PublicChallenge = Omit<Challenge, "reference" | "hints" | "explanation"> & {
  number: number;
  target: string;
  par: number;
  hintCount: number;
};

const versions: Record<string, string | undefined> = targets;

/**
 * Guards the data at build time:
 * - each colour shown to the player appears once (it's also a React key)
 * - every colour the reference uses is listed, so the palette never leaves a player guessing
 * - the target image exists and was rendered from the current reference
 */
export function validateChallenges(list: Challenge[], versions: Record<string, string | undefined>): Challenge[] {
  if (new Set(list.map((c) => c.slug)).size !== list.length) throw new Error("Two challenges share a slug");
  for (const c of list) {
    if (!tracks.some((t) => t.slug === c.track)) throw new Error(`Challenge "${c.slug}": unknown track "${c.track}"`);
    if (c.hints.length < 1 || c.hints.length > 3) throw new Error(`Challenge "${c.slug}": needs 1–3 hints`);
    for (const text of [c.title, c.explanation, ...c.hints]) {
      if (!text.ar.trim() || !text.en.trim()) throw new Error(`Challenge "${c.slug}": missing Arabic or English text`);
    }
    const shown = c.colors.map((color) => color.toLowerCase());
    if (new Set(shown).size !== shown.length) throw new Error(`Challenge "${c.slug}": a colour is listed twice`);
    // 6-digit colours only; #rrggbbaa (shadows with alpha) are variations of a listed colour
    for (const [used] of c.reference.toLowerCase().matchAll(/#[0-9a-f]{6}(?![0-9a-f])/g)) {
      if (!shown.includes(used)) throw new Error(`Challenge "${c.slug}": ${used} is used but not in its colours`);
    }
    if (versions[c.slug] !== targetVersion(c)) {
      throw new Error(`Challenge "${c.slug}": target image is missing or outdated — run \`npm run targets\``);
    }
  }
  return list;
}

export const challenges = validateChallenges(launchChallenges, versions);

export function getChallenge(slug: string): Challenge | undefined {
  return challenges.find((c) => c.slug === slug);
}

/** The target image URL; the version busts caches when the target changes */
export function targetSrc(c: Challenge): string {
  return `/targets/${c.slug}.png?v=${targetVersion(c)}`;
}

/** The length bonus is full at this many characters: the author's own solution */
export function parFor(c: Challenge): number {
  return countChars(c.reference);
}

export function toPublic(c: Challenge): PublicChallenge {
  const { reference, hints, explanation, ...rest } = c;
  return { ...rest, number: challenges.indexOf(c) + 1, target: targetSrc(c), par: parFor(c), hintCount: hints.length };
}

export function getTrack(slug: string): Track | undefined {
  return tracks.find((t) => t.slug === slug);
}

/** A track's challenges, in order */
export function trackChallenges(track: Track): Challenge[] {
  return challenges.filter((c) => c.track === track.slug);
}
