import Link from "next/link";
import { SolvedMark } from "@/components/progress/Progress";
import { TargetImage } from "@/components/TargetImage";
import type { PublicChallenge } from "@/data/challenges";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

const difficultyColor = { easy: "text-success", medium: "text-gold", hard: "text-accent" } as const;

/** A challenge in a list: target, number, title, type, difficulty, skill, colours. The whole card is the link. */
export function ChallengeCard({ challenge: c, locale, t }: { challenge: PublicChallenge; locale: Locale; t: Dictionary["challenges"] }) {
  return (
    <li className="relative flex flex-col gap-4 rounded-xl border border-border-subtle bg-bg-elevated p-4 transition hover:border-primary/60">
      <div className="grid place-items-center rounded-lg bg-bg-base p-3">
        <TargetImage challenge={c} size={280} label={c.title[locale]} />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-text-tertiary">#{String(c.number).padStart(2, "0")}</p>
          <h3 className="text-lg font-bold">
            {/* the whole card is the link (its ::after covers the card) */}
            <Link href={`/${locale}/challenges/${c.slug}`} className="after:absolute after:inset-0 after:rounded-xl">
              {c.title[locale]}
            </Link>
          </h3>
          <p className="mt-0.5 font-mono text-xs text-secondary" dir="ltr">
            {c.skill}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded bg-bg-surface px-2 py-1 text-text-secondary">{t[c.type]}</span>
          <span className={`rounded bg-bg-surface px-2 py-1 ${difficultyColor[c.difficulty]}`}>{t.difficulty[c.difficulty]}</span>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex gap-1.5" dir="ltr">
          {c.colors.map((color) => (
            <span key={color} title={color} className="size-5 rounded-full border border-border-strong" style={{ background: color }} />
          ))}
        </div>
        <SolvedMark slug={c.slug} labels={t} />
      </div>
    </li>
  );
}
