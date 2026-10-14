"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { submitSolution, type SubmitResult } from "@/lib/actions/submit";
import { createClient } from "@/lib/supabase/client";
import { ShareButton } from "@/components/ShareButton";

type Props = {
  slug: string;
  code: string;
  /** the server can score submissions (Supabase and its secret key are set) */
  enabled: boolean;
  loginHref: string;
  t: Dictionary["play"];
  /** for sharing a result: the challenge's title and path */
  share: { title: string; path: string; t: Dictionary["share"] };
};

type Best = { score: number; chars: number };

/** The official submission: sign-in state, the submit button, and the result */
export function SubmitPanel({ slug, code, enabled, loginHref, t, share }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [best, setBest] = useState<Best | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [pending, startTransition] = useTransition();

  // who's here, and their best on this challenge so far
  useEffect(() => {
    const supabase = enabled ? createClient() : null;
    if (!supabase) return;
    let current = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!current) return;
      setSignedIn(Boolean(data.user));
      if (!data.user) return;
      const { data: row } = await supabase
        .from("best_scores")
        .select("score, chars")
        .eq("user_id", data.user.id)
        .eq("challenge_slug", slug)
        .maybeSingle();
      if (current && row) setBest(row);
    });
    return () => {
      current = false;
    };
  }, [enabled, slug]);

  const submit = () =>
    startTransition(async () => {
      const outcome = await submitSolution(slug, code);
      setResult(outcome);
      if (outcome.ok) setBest(outcome.best);
      else if (outcome.error === "sign-in") setSignedIn(false);
    });

  const fill = (text: string, values: Record<string, string | number>) =>
    text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

  const button = "mt-3 flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-bold transition";

  return (
    <div data-testid="submit-panel">
      {!enabled ? (
        <button type="button" disabled className={`${button} cursor-not-allowed bg-bg-surface text-text-tertiary`}>
          {t.submitDisabled}
        </button>
      ) : signedIn === false ? (
        <Link href={loginHref} className={`${button} border border-primary text-primary hover:bg-primary/10`}>
          {t.signInToSubmit}
        </Link>
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={signedIn === null || pending}
          className={`${button} bg-primary text-on-primary hover:brightness-110 disabled:cursor-wait disabled:opacity-60`}
        >
          {pending ? t.submitting : t.submit}
        </button>
      )}

      {result?.ok && (
        <div data-testid="official-result" className="mt-3 rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
          <p className="font-bold">{t.official}</p>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-xs text-text-tertiary">{t.match}</dt>
              <dd className="font-mono font-bold" dir="ltr">
                {result.accuracy === 100 ? "100" : result.accuracy.toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-text-tertiary">{t.scoreLabel}</dt>
              <dd data-testid="official-score" className="font-mono font-bold text-success">{result.score}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-tertiary">{t.chars}</dt>
              <dd className="font-mono font-bold">{result.chars}</dd>
            </div>
          </dl>
          {result.hintsUsed > 0 && (
            <p className="mt-2 text-xs text-gold">{fill(t.hintsTaken, { n: result.hintsUsed, percent: result.hintsUsed * 10 })}</p>
          )}
          {result.improved && <p className="mt-2 font-bold text-success">{t.newBest}</p>}
          <p className="mt-1 text-text-secondary">{fill(t.rank, { rank: result.rank })}</p>
          <div className="mt-3 border-t border-success/20 pt-3">
            <ShareButton
              path={share.path}
              text={fill(share.t.result, {
                score: result.score,
                title: share.title,
                accuracy: result.accuracy === 100 ? "100" : result.accuracy.toFixed(1),
                chars: result.chars,
              })}
              t={share.t}
            />
          </div>
        </div>
      )}
      {result && !result.ok && (
        <p role="alert" data-testid="submit-error" className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">
          {t.errors[result.error]}
        </p>
      )}
      {best && (
        <p data-testid="personal-best" className="mt-2 text-xs text-text-tertiary">
          {fill(t.yourBest, { score: best.score, chars: best.chars })}
        </p>
      )}
    </div>
  );
}
