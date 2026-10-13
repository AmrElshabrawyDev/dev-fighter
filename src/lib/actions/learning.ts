"use server";

import { getChallenge } from "@/data/challenges";
import { hasLocale, type Locale } from "@/i18n/config";
import { officialAccuracy } from "@/lib/scoring/render";
import { countChars, MAX_CODE_CHARS } from "@/lib/scoring/score";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";

/**
 * Hints and explained solutions. Neither is in the page: hints are handed out
 * one at a time (each costs 10% of the score once scores are kept), and the
 * explanation only to someone whose code really matches 100%.
 */

export type HintResult =
  | { ok: true; text: string; opened: number }
  | { ok: false; error: "sign-in" | "unknown" | "order" | "failed" };

export async function revealHint(slug: string, index: number, locale: Locale): Promise<HintResult> {
  const challenge = getChallenge(slug);
  if (!challenge || !Number.isInteger(index) || index < 0 || index >= challenge.hints.length || !hasLocale(locale)) {
    return { ok: false, error: "unknown" };
  }
  const text = challenge.hints[index][locale];

  // no scores on this copy: hints are free
  const admin = createAdminClient();
  if (!admin) return { ok: true, text, opened: index + 1 };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "sign-in" };
  const { data, error } = await admin.rpc("unlock_hint", { p_user: user.id, p_slug: slug, p_index: index });
  if (error) {
    if (error.message.includes("hints open in order")) return { ok: false, error: "order" };
    console.error("Opening a hint failed", error);
    return { ok: false, error: "failed" };
  }
  return { ok: true, text, opened: data as number };
}

/** The hints this player already opened on a challenge, in order (empty when signed out) */
export async function openedHints(slug: string, locale: Locale): Promise<string[]> {
  const challenge = getChallenge(slug);
  const admin = createAdminClient();
  if (!challenge || !admin || !hasLocale(locale)) return [];
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await admin
    .from("hint_unlocks")
    .select("hint_index")
    .eq("user_id", user.id)
    .eq("challenge_slug", slug)
    .order("hint_index");
  return (data ?? []).map((row) => challenge.hints[row.hint_index]?.[locale]).filter((text): text is string => Boolean(text));
}

export type SolutionResult =
  | { ok: true; reference: string; explanation: string }
  | { ok: false; error: "not-solved" | "unknown" };

/**
 * The reference solution and its explanation — for code that matches 100% in
 * the official renderer, or a player who already scored 100% on it.
 */
export async function revealSolution(slug: string, code: string, locale: Locale): Promise<SolutionResult> {
  const challenge = getChallenge(slug);
  if (!challenge || !hasLocale(locale)) return { ok: false, error: "unknown" };
  const solved = { ok: true as const, reference: challenge.reference, explanation: challenge.explanation[locale] };

  const admin = createAdminClient();
  if (admin) {
    const user = await getCurrentUser();
    if (user) {
      const { data } = await admin
        .from("best_scores")
        .select("accuracy")
        .eq("user_id", user.id)
        .eq("challenge_slug", slug)
        .maybeSingle();
      if (data && Number(data.accuracy) === 100) return solved;
    }
  }

  if (typeof code !== "string" || countChars(code) > MAX_CODE_CHARS) return { ok: false, error: "not-solved" };
  try {
    if ((await officialAccuracy(challenge, code)) === 1) return solved;
  } catch (error) {
    console.error("Checking a solution failed", error);
  }
  return { ok: false, error: "not-solved" };
}
