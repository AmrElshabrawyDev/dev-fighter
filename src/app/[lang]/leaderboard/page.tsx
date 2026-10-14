import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlayerName } from "@/components/PlayerName";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getLeaderboard } from "@/lib/leaderboard";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { leaderboard: t, meta } = await getDictionary();
  return pageMetadata({ locale: await getLocale(), path: "/leaderboard", title: t.title, description: t.metaDescription, siteTitle: meta.title });
}

const medal = ["text-gold", "text-text-secondary", "text-warning"];

export default async function LeaderboardPage() {
  const { leaderboard: t } = await getDictionary();

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-4xl font-black">{t.title}</h1>
      <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>

      <div className="mt-10 overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
        <Suspense fallback={<BoardSkeleton />}>
          <Board />
        </Suspense>
      </div>

      <section className="mt-10 rounded-xl border border-border-subtle bg-bg-elevated p-6">
        <h2 className="text-xl font-bold">{t.howTitle}</h2>
        <ul className="mt-4 grid list-disc gap-2 ps-5 leading-relaxed text-text-secondary">
          {t.how.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** The live table (fetched at request time, see lib/leaderboard) */
async function Board() {
  const locale = await getLocale();
  const { leaderboard: t } = await getDictionary();
  const rows = await getLeaderboard();

  if (rows === null) return <p className="p-6 text-text-secondary">{t.notConfigured}</p>;
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">{t.empty}</p>
        <Link href={`/${locale}/challenges`} className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 font-bold text-on-primary">
          {t.cta}
        </Link>
      </div>
    );
  }
  return (
    <table className="w-full table-fixed text-sm">
      <thead className="border-b border-border-subtle text-text-tertiary">
        <tr>
          <th scope="col" className="w-16 px-4 py-3 text-start font-normal">{t.rank}</th>
          <th scope="col" className="px-2 py-3 text-start font-normal">{t.player}</th>
          <th scope="col" className="hidden w-24 px-2 py-3 text-end font-normal sm:table-cell">{t.perfect}</th>
          <th scope="col" className="hidden w-20 px-2 py-3 text-end font-normal sm:table-cell">{t.played}</th>
          <th scope="col" className="w-24 px-4 py-3 text-end font-normal">{t.score}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.username} className="border-b border-border-subtle last:border-0">
            <td className={`px-4 py-3 font-mono font-bold ${medal[row.rank - 1] ?? "text-text-tertiary"}`}>#{row.rank}</td>
            <td className="px-2 py-3">
              <PlayerName player={row} href={`/${locale}/u/${row.username}`} />
            </td>
            <td className="hidden px-2 py-3 text-end font-mono sm:table-cell">{row.perfect}</td>
            <td className="hidden px-2 py-3 text-end font-mono sm:table-cell">{row.played}</td>
            <td className="px-4 py-3 text-end font-mono font-bold text-gold">{row.totalScore}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy className="grid animate-pulse gap-3 p-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-9 rounded-lg bg-bg-surface" />
      ))}
    </div>
  );
}
