"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BidiText } from "@/components/BidiText";
import { CodeBlock } from "@/components/CodeBlock";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { revealHint, revealSolution } from "@/lib/actions/learning";

type Props = {
  slug: string;
  skill: string;
  hintCount: number;
  /** the hints opened so far, in order */
  hints: string[];
  onHintOpened: (text: string) => void;
  /** the live match is 100% right now */
  matched: boolean;
  code: string;
  locale: Locale;
  /** scores are kept here, so hints cost points (and need sign-in) */
  scoring: boolean;
  loginHref: string;
  t: Dictionary["play"];
};

/** Hints (one at a time) and the explained solution (after a 100% match) */
export function LearnPanel({ slug, skill, hintCount, hints, onHintOpened, matched, code, locale, scoring, loginHref, t }: Props) {
  const [hintError, setHintError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [solution, setSolution] = useState<{ reference: string; explanation: string } | null>(null);
  const [notSolved, setNotSolved] = useState(false);
  const [hintPending, startHint] = useTransition();
  const [solutionPending, startSolution] = useTransition();

  const next = hints.length;
  const fill = (text: string, values: Record<string, string | number>) =>
    text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

  const openHint = () => {
    if (scoring && !window.confirm(t.hintConfirm)) return;
    setHintError(null);
    startHint(async () => {
      const result = await revealHint(slug, next, locale);
      if (result.ok) onHintOpened(result.text);
      else if (result.error === "sign-in") setNeedsSignIn(true);
      else setHintError(t.hintErrors[result.error === "order" ? "order" : "failed"]);
    });
  };

  const showSolution = () =>
    startSolution(async () => {
      const result = await revealSolution(slug, code, locale);
      if (result.ok) setSolution({ reference: result.reference, explanation: result.explanation });
      else setNotSolved(true);
    });

  return (
    <section
      className="min-w-0 rounded-xl border border-border-default bg-bg-elevated p-4 sm:col-span-2 lg:col-span-1 2xl:col-span-2"
      aria-labelledby="learn-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="learn-title" className="text-sm font-bold">
          {t.learn}
        </h2>
        <span className="rounded bg-bg-surface px-2 py-0.5 text-xs text-text-secondary">
          {t.skill}: <span className="font-mono text-secondary" dir="ltr">{skill}</span>
        </span>
      </div>

      {/* Hints */}
      <h3 className="text-sm text-text-secondary">
        {t.hints} <span className="font-mono text-text-tertiary">({hints.length}/{hintCount})</span>
      </h3>
      <p className="mt-1 text-xs text-text-tertiary">{scoring ? t.hintCost : t.hintFree}</p>
      {hints.length > 0 && (
        <ol className="mt-3 grid gap-2" data-testid="hints">
          {hints.map((hint, i) => (
            <li key={i} className="flex gap-2 rounded-lg border border-gold/20 bg-gold/5 p-2.5 text-sm leading-relaxed">
              <span className="font-mono text-gold">{i + 1}.</span>
              <span>{locale === "ar" ? <BidiText text={hint} /> : hint}</span>
            </li>
          ))}
        </ol>
      )}
      {next < hintCount &&
        (needsSignIn ? (
          <Link href={loginHref} className="mt-3 inline-block text-sm text-primary hover:underline">
            {t.signInForHints}
          </Link>
        ) : (
          <button
            type="button"
            onClick={openHint}
            disabled={hintPending}
            className="mt-3 rounded-lg border border-gold/40 px-3 py-1.5 text-sm text-gold transition hover:bg-gold/10 disabled:opacity-60"
          >
            {fill(t.openHint, { n: next + 1, total: hintCount })}
            {scoring && <span className="ms-1 font-mono text-xs" dir="ltr">(−10%)</span>}
          </button>
        ))}
      {hintError && <p className="mt-2 text-xs text-accent">{hintError}</p>}

      {/* Explained solution */}
      <h3 className="mt-5 border-t border-border-subtle pt-4 text-sm text-text-secondary">{t.solution}</h3>
      {solution ? (
        <div className="mt-3" data-testid="solution">
          <p className="text-sm leading-relaxed">{locale === "ar" ? <BidiText text={solution.explanation} /> : solution.explanation}</p>
          <p className="mt-3 mb-2 text-xs text-text-tertiary">{fill(t.authorSolution, { chars: [...solution.reference].length })}</p>
          <CodeBlock code={solution.reference} label={t.solution} />
        </div>
      ) : (
        <>
          <p className="mt-1 text-xs text-text-tertiary">{t.solutionLocked}</p>
          <button
            type="button"
            onClick={showSolution}
            disabled={!matched || solutionPending}
            className="mt-3 rounded-lg bg-success px-3 py-1.5 text-sm font-bold text-on-primary transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-bg-surface disabled:text-text-tertiary"
          >
            {solutionPending ? t.checking : t.showSolution}
          </button>
          {notSolved && <p className="mt-2 text-xs text-accent">{t.notSolved}</p>}
        </>
      )}
    </section>
  );
}
