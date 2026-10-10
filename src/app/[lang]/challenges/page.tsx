import type { Metadata } from "next";
import { TargetPreview } from "@/components/TargetPreview";
import { challenges } from "@/data/challenges";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { challenges: t } = await getDictionary();
  return { title: t.title, description: t.subtitle };
}

const difficultyColor = { easy: "text-success", medium: "text-gold", hard: "text-accent" } as const;

export default async function ChallengesPage() {
  const locale = await getLocale();
  const { challenges: t } = await getDictionary();
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-black">{t.title}</h1>
      <p className="mt-3 text-lg text-text-secondary">{t.subtitle}</p>
      <p className="mt-6 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">{t.soonNotice}</p>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map((c, i) => (
          <li key={c.slug} className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-bg-elevated p-4">
            <div className="grid place-items-center rounded-lg bg-bg-base p-3">
              <TargetPreview challenge={c} size={280} label={c.title[locale]} />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-text-tertiary">#{String(i + 1).padStart(2, "0")}</p>
                <h2 className="text-lg font-bold">{c.title[locale]}</h2>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="rounded bg-bg-surface px-2 py-1 text-text-secondary">{t[c.type]}</span>
                <span className={`rounded bg-bg-surface px-2 py-1 ${difficultyColor[c.difficulty]}`}>{t.difficulty[c.difficulty]}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5" dir="ltr">
                {c.colors.map((color) => (
                  <span key={color} title={color} className="size-5 rounded-full border border-border-strong" style={{ background: color }} />
                ))}
              </div>
              <button disabled className="cursor-not-allowed rounded-md bg-bg-surface px-4 py-1.5 text-sm text-text-tertiary">
                {t.play}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
