import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { DailyCard, DailyCardSkeleton } from "@/components/DailyCard";
import { ProgressProvider, TrackProgress } from "@/components/progress/Progress";
import { toPublic, trackChallenges, tracks } from "@/data/challenges";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { challenges: t } = await getDictionary();
  return { title: t.title, description: t.subtitle };
}

export default async function ChallengesPage() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const t = dict.challenges;
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-black">{t.title}</h1>
      <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>

      <div className="mt-8">
        <Suspense fallback={<DailyCardSkeleton />}>
          <DailyCard locale={locale} t={dict.daily} />
        </Suspense>
      </div>

      <ProgressProvider>
        {tracks.map((track) => {
          const list = trackChallenges(track).map(toPublic);
          return (
            <section key={track.slug} className="mt-14" aria-labelledby={`track-${track.slug}`}>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <h2 id={`track-${track.slug}`} className="text-2xl font-black">
                    {track.title[locale]}
                  </h2>
                  <p className="mt-1 text-text-secondary">{track.description[locale]}</p>
                </div>
                <Link href={`/${locale}/tracks/${track.slug}`} className="text-sm text-secondary hover:underline">
                  {dict.tracks.open}
                </Link>
              </div>
              <div className="mb-5 max-w-sm">
                <TrackProgress slugs={list.map((c) => c.slug)} label={dict.tracks.progress} />
              </div>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => (
                  <ChallengeCard key={c.slug} challenge={c} locale={locale} t={t} />
                ))}
              </ul>
            </section>
          );
        })}
      </ProgressProvider>
    </div>
  );
}
