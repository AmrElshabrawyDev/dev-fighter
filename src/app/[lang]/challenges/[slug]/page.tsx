import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Playground } from "@/components/play/Playground";
import { challenges, getChallenge, toPublic } from "@/data/challenges";
import { TopPlayers } from "@/components/play/TopPlayers";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { isScoringConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function generateStaticParams() {
  return challenges.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/challenges/[slug]">): Promise<Metadata> {
  const challenge = getChallenge((await params).slug);
  if (!challenge) return {};
  const locale = await getLocale();
  const { play } = await getDictionary();
  return { title: challenge.title[locale], description: play.metaDescription.replace("{title}", challenge.title[locale]) };
}

const difficultyColor = { easy: "text-success", medium: "text-gold", hard: "text-accent" } as const;

export default function ChallengePage({ params }: PageProps<"/[lang]/challenges/[slug]">) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <Suspense fallback={<PlaySkeleton />}>
        <Challenge params={params} />
      </Suspense>
    </div>
  );
}

async function Challenge({ params }: { params: PageProps<"/[lang]/challenges/[slug]">["params"] }) {
  const found = getChallenge((await params).slug);
  if (!found) notFound();
  const challenge = toPublic(found);
  const locale = await getLocale();
  const dict = await getDictionary();
  const t = dict.challenges;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={`/${locale}/challenges`} className="text-sm text-text-secondary transition hover:text-primary">
          <span aria-hidden className="inline-block rtl:rotate-180">←</span> {dict.play.back}
        </Link>
        <h1 className="text-2xl font-black">
          <span className="me-2 font-mono text-base text-text-tertiary">#{String(challenge.number).padStart(2, "0")}</span>
          {challenge.title[locale]}
        </h1>
        <div className="flex gap-2 text-xs">
          <span className="rounded bg-bg-surface px-2 py-1 text-text-secondary">{t[challenge.type]}</span>
          <span className={`rounded bg-bg-surface px-2 py-1 ${difficultyColor[challenge.difficulty]}`}>{t.difficulty[challenge.difficulty]}</span>
        </div>
      </div>
      <Playground
        challenge={challenge}
        locale={locale}
        t={dict.play}
        tipsHref={`/${locale}/tips`}
        loginHref={`/${locale}/login?next=${encodeURIComponent(`/${locale}/challenges/${challenge.slug}`)}`}
        canSubmit={isScoringConfigured && isSupabaseConfigured}
      />
      <Suspense fallback={<div aria-busy className="mt-8 h-40 animate-pulse rounded-xl bg-bg-elevated" />}>
        <TopPlayers slug={challenge.slug} locale={locale} t={dict.play} />
      </Suspense>
    </>
  );
}

/** Shown for a moment while moving between challenges */
function PlaySkeleton() {
  return (
    <div aria-busy className="animate-pulse">
      <div className="mb-5 h-8 w-72 rounded-lg bg-bg-elevated" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="h-[22rem] rounded-xl bg-bg-elevated lg:h-[calc(100dvh-7rem)]" />
        <div className="grid content-start gap-5">
          <div className="aspect-[4/3] rounded-xl bg-bg-elevated" />
          <div className="aspect-[4/3] rounded-xl bg-bg-elevated" />
        </div>
      </div>
    </div>
  );
}
