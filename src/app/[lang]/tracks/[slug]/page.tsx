import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ProgressProvider, TrackProgress } from "@/components/progress/Progress";
import { getTrack, toPublic, trackChallenges, tracks } from "@/data/challenges";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export function generateStaticParams() {
  return tracks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/tracks/[slug]">): Promise<Metadata> {
  const track = getTrack((await params).slug);
  if (!track) return {};
  const locale = await getLocale();
  return { title: track.title[locale], description: track.description[locale] };
}

export default function TrackPage({ params }: PageProps<"/[lang]/tracks/[slug]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <Suspense fallback={<div aria-busy className="h-96 animate-pulse rounded-xl bg-bg-elevated" />}>
        <Track params={params} />
      </Suspense>
    </div>
  );
}

async function Track({ params }: { params: PageProps<"/[lang]/tracks/[slug]">["params"] }) {
  const track = getTrack((await params).slug);
  if (!track) notFound();
  const locale = await getLocale();
  const dict = await getDictionary();
  const list = trackChallenges(track).map(toPublic);
  const number = tracks.indexOf(track) + 1;

  return (
    <ProgressProvider>
      <Link href={`/${locale}/tracks`} className="text-sm text-text-secondary transition hover:text-primary">
        <span aria-hidden className="inline-block rtl:rotate-180">←</span> {dict.tracks.all}
      </Link>
      <p className="mt-6 font-mono text-sm text-primary">{dict.tracks.trackNumber.replace("{n}", String(number))}</p>
      <h1 className="mt-1 text-4xl font-black">{track.title[locale]}</h1>
      <p className="mt-3 max-w-2xl text-lg text-text-secondary">{track.description[locale]}</p>
      <div className="mt-6 max-w-sm">
        <TrackProgress slugs={list.map((c) => c.slug)} label={dict.tracks.progress} />
      </div>
      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <ChallengeCard key={c.slug} challenge={c} locale={locale} t={dict.challenges} />
        ))}
      </ol>
    </ProgressProvider>
  );
}
