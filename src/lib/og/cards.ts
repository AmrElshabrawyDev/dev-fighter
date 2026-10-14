/**
 * What goes on each share card, and where its image lives. Pure functions of
 * their arguments (no imports at runtime), shared by `npm run targets` and the server.
 */
import type { Challenge, Track } from "../../data/challenge-list";
import type { CardStat, ShareCard } from "./card";

type Locale = "ar" | "en";

/** The strings a card needs: the dictionary's `share` section, plus a few from elsewhere */
export type CardStrings = {
  share: {
    siteKicker: string;
    siteText: string;
    challengeKicker: string;
    prompt: string;
    playerKicker: string;
    stats: { score: string; rank: string; perfect: string; played: string };
    empty: string;
  };
  home: { titleStart: string; titleEnd: string };
  challenges: { shape: string; component: string; difficulty: Record<Challenge["difficulty"], string> };
};

/** Pre-drawn card images, under public/ */
export const cardImage = {
  site: (locale: Locale) => `/og/${locale}/site.png`,
  challenge: (locale: Locale, slug: string) => `/og/${locale}/challenges/${slug}.png`,
};

export const targetImage = (slug: string) => `/targets/${slug}.png`;

export function siteCard(locale: Locale, t: CardStrings, challenges: Pick<Challenge, "slug">[]): ShareCard {
  // a recognisable mix: a shape, a layout, a UI piece, another shape
  const picks = ["twin-moons", "pricing-card", "the-hexagon", "toggle-switch"].filter((slug) => challenges.some((c) => c.slug === slug));
  return {
    locale,
    kind: "site",
    kicker: t.share.siteKicker,
    lines: [t.home.titleStart, t.home.titleEnd],
    text: t.share.siteText,
    images: picks.map(targetImage),
  };
}

const difficultyTone = { easy: "success", medium: "gold", hard: "accent" } as const;

export function challengeCard(locale: Locale, t: CardStrings, challenge: Challenge, number: number, track: Track): ShareCard {
  return {
    locale,
    kind: "challenge",
    kicker: t.share.challengeKicker,
    number,
    title: challenge.title[locale],
    chips: [
      { text: track.title[locale], tone: "primary" },
      { text: t.challenges.difficulty[challenge.difficulty], tone: difficultyTone[challenge.difficulty] },
      { text: challenge.skill, tone: "secondary", mono: true },
    ],
    prompt: t.share.prompt,
    image: targetImage(challenge.slug),
    size: `${challenge.width}×${challenge.height}`,
  };
}

export type PlayerSummary = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number;
  rank: number | null;
  perfect: number;
  played: number;
  /** slugs of the challenges they solved at 100%, best first */
  solved: string[];
};

export function playerCard(locale: Locale, t: CardStrings, player: PlayerSummary, avatar: string | null): ShareCard {
  const format = (n: number) => n.toLocaleString("en-US");
  const stats: CardStat[] = [
    { label: t.share.stats.score, value: format(player.totalScore), tone: "gold" },
    { label: t.share.stats.rank, value: player.rank ? `#${format(player.rank)}` : "—", tone: "primary" },
    { label: t.share.stats.perfect, value: format(player.perfect), tone: "success" },
    { label: t.share.stats.played, value: format(player.played), tone: "secondary" },
  ];
  return {
    locale,
    kind: "player",
    kicker: t.share.playerKicker,
    name: player.displayName,
    username: player.username,
    avatar,
    stats,
    images: player.solved.slice(0, 6).map(targetImage),
    empty: t.share.empty,
  };
}

/** Every pre-drawn card: the site's and each challenge's, in both languages */
export function staticCards(strings: Record<Locale, CardStrings>, challenges: Challenge[], tracks: Track[]): { path: string; card: ShareCard }[] {
  return (["ar", "en"] as const).flatMap((locale) => [
    { path: cardImage.site(locale), card: siteCard(locale, strings[locale], challenges) },
    ...challenges.map((c, i) => ({
      path: cardImage.challenge(locale, c.slug),
      card: challengeCard(locale, strings[locale], c, i + 1, tracks.find((t) => t.slug === c.track)!),
    })),
  ]);
}
