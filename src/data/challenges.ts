import "server-only";
import { launchChallenges, targetVersion, type Challenge } from "./challenge-list";
import targets from "./targets.json";

export type { Challenge, ChallengeType, Difficulty } from "./challenge-list";

/** What the browser gets: everything except the reference solution */
export type PublicChallenge = Omit<Challenge, "reference"> & { number: number; target: string };

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

export function toPublic(c: Challenge): PublicChallenge {
  const { reference, ...rest } = c;
  return { ...rest, number: challenges.indexOf(c) + 1, target: targetSrc(c) };
}
