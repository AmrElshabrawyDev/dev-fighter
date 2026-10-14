import Link from "next/link";
import { PlayerName } from "@/components/PlayerName";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getChallengeLeaderboard } from "@/lib/leaderboard";

const medal = ["text-gold", "text-text-secondary", "text-warning"];

/** The challenge's top 10 (cached; refreshed when someone sets a new best) */
export async function TopPlayers({ slug, locale, t }: { slug: string; locale: Locale; t: Dictionary["play"] }) {
  const rows = await getChallengeLeaderboard(slug);
  if (rows === null) return null; // leaderboards not set up on this copy

  return (
    <section className="mt-8 rounded-xl border border-border-default bg-bg-elevated p-5" aria-labelledby="top-players">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="top-players" className="text-lg font-bold">
          {t.topPlayers}
        </h2>
        <Link href={`/${locale}/leaderboard`} className="text-sm text-secondary hover:underline">
          {t.fullLeaderboard}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-text-secondary">{t.noScores}</p>
      ) : (
        <ol className="grid gap-1">
          {rows.map((row) => (
            <li key={row.username} className="flex items-center gap-3 rounded-lg px-2 py-1.5 odd:bg-bg-base/40">
              <span className={`w-7 shrink-0 font-mono text-sm font-bold ${medal[row.rank - 1] ?? "text-text-tertiary"}`}>#{row.rank}</span>
              <PlayerName player={row} href={`/${locale}/u/${row.username}`} />
              <span className="ms-auto flex shrink-0 items-baseline gap-4 font-mono text-sm">
                <span className="hidden text-text-tertiary sm:inline" dir="ltr">
                  {row.accuracy === 100 ? "100" : row.accuracy.toFixed(1)}%
                </span>
                <span className="text-text-tertiary">
                  {row.chars} {t.chars}
                </span>
                <b className="w-12 text-end text-gold">{row.score}</b>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
