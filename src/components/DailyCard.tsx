import Link from "next/link";
import { connection } from "next/server";
import { TargetImage } from "@/components/TargetImage";
import { challenges, toPublic } from "@/data/challenges";
import { dailySlug } from "@/data/daily";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Today's challenge (it changes at midnight, so it's worked out per request: render inside <Suspense>) */
export async function DailyCard({ locale, t }: { locale: Locale; t: Dictionary["daily"] }) {
  await connection();
  const slug = dailySlug(new Date(), challenges.map((c) => c.slug));
  const c = toPublic(challenges.find((x) => x.slug === slug)!);
  return (
    <div data-testid="daily" className="flex flex-col gap-5 rounded-xl border border-gold/30 bg-gradient-to-l from-gold/10 to-transparent p-5 sm:flex-row sm:items-center">
      <TargetImage challenge={c} size={200} label={c.title[locale]} />
      <div>
        <p className="text-sm font-bold text-gold">★ {t.title}</p>
        <h2 className="mt-1 text-2xl font-black">{c.title[locale]}</h2>
        <p className="mt-2 text-sm text-text-secondary">{t.subtitle}</p>
        <Link
          href={`/${locale}/challenges/${c.slug}`}
          className="mt-4 inline-block rounded-lg bg-gold px-5 py-2.5 font-bold text-on-primary transition hover:brightness-110"
        >
          {t.cta}
        </Link>
      </div>
    </div>
  );
}

export function DailyCardSkeleton() {
  return <div aria-busy className="h-[13.5rem] animate-pulse rounded-xl border border-gold/20 bg-bg-elevated sm:h-[11.5rem]" />;
}
