import Link from "next/link";
import { Suspense } from "react";
import { DailyCard, DailyCardSkeleton } from "@/components/DailyCard";
import { TargetImage } from "@/components/TargetImage";
import { challenges, toPublic } from "@/data/challenges";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

const demo = toPublic(challenges.find((c) => c.slug === "twin-moons")!);

export default async function Home() {
  const locale = await getLocale();
  const { home, daily } = await getDictionary();
  const shape = toPublic(challenges.find((c) => c.type === "shape" && c.difficulty === "medium")!);
  const component = toPublic(challenges.find((c) => c.slug === "profile-card")!);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-20 pb-16 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-fade-in-up">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-elevated px-3 py-1 text-sm text-secondary">
              <span className="size-2 rounded-full bg-success" />
              {home.eyebrow}
            </p>
            <h1 className="text-4xl leading-tight font-black sm:text-5xl">
              {home.titleStart}
              <br />
              <span className="bg-gradient-to-l from-primary via-secondary to-info bg-clip-text text-transparent">{home.titleEnd}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">{home.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/challenges/${challenges[0].slug}`}
                className="rounded-lg bg-primary px-6 py-3 font-bold text-on-primary shadow-[0_8px_30px_-8px] shadow-primary/60 transition hover:brightness-110"
              >
                {home.ctaPrimary}
              </Link>
              <a href="#how" className="rounded-lg border border-border-strong px-6 py-3 font-semibold transition hover:border-primary">
                {home.ctaSecondary}
              </a>
            </div>
          </div>

          {/* Demo: code → target → match */}
          <div className="animate-fade-in-up [animation-delay:150ms]" dir="ltr">
            <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
                <span className="size-3 rounded-full bg-accent" />
                <span className="size-3 rounded-full bg-gold" />
                <span className="size-3 rounded-full bg-success" />
                <span className="ms-3 font-mono text-xs text-text-tertiary">twin-moons.html</span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="mb-2 text-xs text-text-tertiary" dir="auto">{home.demo.yourCode}</p>
                  <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed">
                    <code>
                      <span className="text-accent">{"<i></i><b></b>"}</span>
                      {"\n"}
                      <span className="text-accent">{"<style>"}</span>
                      {"\n"}
                      <span className="text-info">body</span>
                      {"{"}
                      <span className="text-secondary">display</span>:flex;
                      <span className="text-secondary">gap</span>:
                      <span className="text-warning">30px</span>…{"}"}
                      {"\n"}
                      <span className="text-info">i,b</span>
                      {"{"}
                      <span className="text-secondary">border-radius</span>:<span className="text-warning">50%</span>
                      {"}"}
                      {"\n"}
                      <span className="text-info">b</span>
                      {"{"}
                      <span className="text-secondary">background</span>:<span className="text-warning">#cba6f7</span>
                      {"}"}
                      {"\n"}
                      <span className="text-accent">{"</style>"}</span>
                      <span className="ms-0.5 inline-block h-4 w-2 translate-y-0.5 animate-blink bg-primary" />
                    </code>
                  </pre>
                </div>
                <div>
                  <p className="mb-2 text-xs text-text-tertiary" dir="auto">{home.demo.target}</p>
                  <TargetImage challenge={demo} size={200} label={demo.title.en} />
                </div>
              </div>
              <div className="border-t border-border-subtle px-4 py-3">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-text-secondary" dir="auto">{home.demo.match}</span>
                  <span className="text-success" dir="auto"><span className="font-mono">100% · 142</span> {home.demo.chars}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-surface">
                  <div className="h-full w-full animate-fill rounded-full bg-gradient-to-r from-primary to-success" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's challenge */}
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <Suspense fallback={<DailyCardSkeleton />}>
          <DailyCard locale={locale} t={daily} />
        </Suspense>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <h2 className="mb-10 text-3xl font-black">{home.how.title}</h2>
        <ol className="grid gap-5 md:grid-cols-3">
          {home.how.steps.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-border-subtle bg-bg-elevated p-6">
              <span className="mb-4 grid size-10 place-items-center rounded-lg bg-bg-surface font-mono font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
              <p className="leading-relaxed text-text-secondary">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Challenge types */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-3xl font-black">{home.types.title}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { info: home.types.shapes, challenge: shape, color: "text-primary" },
            { info: home.types.components, challenge: component, color: "text-secondary" },
          ].map(({ info, challenge, color }) => (
            <article key={info.title} className="flex flex-col gap-5 rounded-xl border border-border-subtle bg-bg-elevated p-6 sm:flex-row sm:items-center">
              <TargetImage challenge={challenge} size={180} label={challenge.title[locale]} />
              <div>
                <h3 className={`mb-2 text-xl font-bold ${color}`}>{info.title}</h3>
                <p className="leading-relaxed text-text-secondary">{info.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Learn */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-3xl font-black">{home.learn.title}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {home.learn.items.map((item, i) => (
            <div key={item.title} className="rounded-xl border border-border-subtle bg-bg-elevated p-6">
              <p className={`mb-3 font-mono text-sm ${["text-success", "text-gold", "text-info"][i]}`}>
                {["01 / tracks", "02 / hints", "03 / solutions"][i]}
              </p>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="leading-relaxed text-text-secondary">{item.text}</p>
            </div>
          ))}
        </div>
        <Link href={`/${locale}/tracks`} className="mt-8 inline-block rounded-lg border border-border-strong px-6 py-3 font-semibold transition hover:border-primary">
          {home.learn.cta}
        </Link>
      </section>

      {/* Battles teaser */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="relative overflow-hidden rounded-2xl border border-border-default bg-gradient-to-br from-bg-elevated to-bg-surface p-8 sm:p-12">
          <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">{home.battles.badge}</span>
          <h2 className="mt-4 mb-3 text-3xl font-black">{home.battles.title}</h2>
          <p className="max-w-2xl text-lg leading-relaxed text-text-secondary">{home.battles.text}</p>
          <div className="mt-8 grid max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-4 font-mono text-sm" dir="ltr">
            <div>
              <div className="mb-1 flex justify-between text-secondary"><span>you</span><span>87%</span></div>
              <div className="h-2 rounded-full bg-bg-base"><div className="h-full w-[87%] animate-fill rounded-full bg-secondary" /></div>
            </div>
            <span className="text-xl font-black text-text-tertiary">VS</span>
            <div>
              <div className="mb-1 flex justify-between text-accent"><span>rival</span><span>74%</span></div>
              <div className="h-2 rounded-full bg-bg-base"><div className="h-full w-[74%] animate-fill rounded-full bg-accent" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="mb-3 text-3xl font-black">{home.final.title}</h2>
        <p className="mb-8 text-lg text-text-secondary">{home.final.text}</p>
        <Link
          href={`/${locale}/login`}
          className="inline-block rounded-lg bg-primary px-8 py-3 font-bold text-on-primary transition hover:brightness-110"
        >
          {home.ctaPrimary}
        </Link>
      </section>
    </>
  );
}
