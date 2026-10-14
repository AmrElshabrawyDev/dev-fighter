import type { Metadata } from "next";
import Link from "next/link";
import { TargetImage } from "@/components/TargetImage";
import { ProgressProvider, TrackProgress } from "@/components/progress/Progress";
import { toPublic, trackChallenges, tracks } from "@/data/challenges";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { tracks: t, meta } = await getDictionary();
  return pageMetadata({ locale: await getLocale(), path: "/tracks", title: t.title, description: t.subtitle, siteTitle: meta.title });
}

export default async function TracksPage() {
  const locale = await getLocale();
  const { tracks: t } = await getDictionary();
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-4xl font-black">{t.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-text-secondary">{t.subtitle}</p>

      <ProgressProvider>
        <ol className="mt-10 grid gap-5 md:grid-cols-2">
          {tracks.map((track, i) => {
            const list = trackChallenges(track).map(toPublic);
            return (
              <li key={track.slug} className="relative flex flex-col gap-4 rounded-xl border border-border-subtle bg-bg-elevated p-5 transition hover:border-primary/60">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-bg-surface font-mono font-bold text-primary">{i + 1}</span>
                  <h2 className="text-xl font-bold">
                    <Link href={`/${locale}/tracks/${track.slug}`} className="after:absolute after:inset-0 after:rounded-xl">
                      {track.title[locale]}
                    </Link>
                  </h2>
                </div>
                <p className="leading-relaxed text-text-secondary">{track.description[locale]}</p>
                <div className="flex gap-2" dir="ltr">
                  {list.slice(0, 4).map((c) => (
                    <TargetImage key={c.slug} challenge={c} size={c.type === "shape" ? 64 : 72} label="" />
                  ))}
                </div>
                <p className="text-sm text-text-tertiary">{t.count.replace("{n}", String(list.length))}</p>
                <TrackProgress slugs={list.map((c) => c.slug)} label={t.progress} />
              </li>
            );
          })}
        </ol>
      </ProgressProvider>
    </div>
  );
}
