import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodePreview } from "@/components/CodePreview";
import { tips } from "@/data/tips";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { tips: t } = await getDictionary();
  return { title: t.title, description: t.metaDescription };
}

export default async function TipsPage() {
  const locale = await getLocale();
  const { tips: t } = await getDictionary();
  const number = (i: number) => `#${String(i + 1).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-4xl font-black">{t.title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-text-secondary">{t.intro}</p>
      <p className="mt-6 max-w-3xl rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm leading-relaxed text-warning">
        {t.disclaimer}
      </p>

      {/* jump to a tip */}
      <nav aria-label={t.index} className="mt-10">
        <ol className="flex flex-wrap gap-2">
          {tips.map((tip, i) => (
            <li key={tip.slug}>
              <a
                href={`#${tip.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-elevated px-3 py-1 text-sm text-text-secondary transition hover:border-primary hover:text-text-primary"
              >
                <span className="font-mono text-xs text-text-tertiary">{number(i)}</span>
                {tip.title[locale]}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 grid gap-8">
        {tips.map((tip, i) => {
          const saved = tip.before.length - tip.after.length;
          return (
            <article key={tip.slug} id={tip.slug} className="scroll-mt-24 rounded-xl border border-border-subtle bg-bg-elevated p-5 sm:p-6">
              <h2 className="flex items-baseline gap-3 text-xl font-bold">
                <span className="font-mono text-base text-primary">{number(i)}</span>
                {tip.title[locale]}
              </h2>
              <p className="mt-3 leading-relaxed text-text-secondary">{tip.text[locale]}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(["before", "after"] as const).map((side) => (
                  <div key={side} className="min-w-0">
                    <p className="mb-2 flex items-center gap-2 text-sm">
                      <span className="font-bold">{t[side]}</span>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-xs ${side === "after" ? "bg-success/15 text-success" : "bg-bg-surface text-text-secondary"}`}
                        data-testid={`${tip.slug}-${side}-chars`}
                      >
                        {tip[side].length} {t.chars}
                      </span>
                    </p>
                    <CodeBlock code={tip[side]} label={`${t[side]}: ${tip.title[locale]}`} />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <CodePreview code={tip.after} size={160} label={`${t.result}: ${tip.title[locale]}`} />
                <div className="text-sm">
                  <p className="font-bold text-success">{t.saved.replace("{count}", String(saved))}</p>
                  <p className="mt-1 text-text-tertiary">{t.result}</p>
                </div>
              </div>

              {tip.note && (
                <p className="mt-5 rounded-lg border border-info/30 bg-info/10 px-4 py-3 text-sm leading-relaxed text-text-primary">
                  <span className="font-bold text-info">{t.note} </span>
                  {tip.note[locale]}
                </p>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-14 rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
        <h2 className="text-2xl font-black">{t.ctaTitle}</h2>
        <p className="mt-2 text-text-secondary">{t.ctaText}</p>
        <Link
          href={`/${locale}/challenges`}
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition hover:brightness-110"
        >
          {t.ctaButton}
        </Link>
      </div>
    </div>
  );
}
