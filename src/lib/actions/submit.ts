"use server";

import { getChallenge, parFor } from "@/data/challenges";
import { officialAccuracy } from "@/lib/scoring/render";
import { countChars, MAX_CODE_CHARS, scoreFor } from "@/lib/scoring/score";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";

export type SubmitError = "not-configured" | "sign-in" | "unknown-challenge" | "too-long" | "rate-limited" | "failed";

export type SubmitResult =
  | {
      ok: true;
      /** 0…100 */
      accuracy: number;
      score: number;
      chars: number;
      /** this submission is now the player's best */
      improved: boolean;
      best: { score: number; chars: number; accuracy: number };
      /** the player's place on this challenge's leaderboard */
      rank: number;
      /** hints open on this challenge (each took 10% off) */
      hintsUsed: number;
    }
  | { ok: false; error: SubmitError };

/**
 * The official submission: score the code in headless Chromium, save it, and
 * update the player's best. Never trusts anything from the browser but the code.
 */
export async function submitSolution(slug: string, code: string): Promise<SubmitResult> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "not-configured" };
  if (typeof slug !== "string" || typeof code !== "string") return { ok: false, error: "failed" };

  const challenge = getChallenge(slug);
  if (!challenge) return { ok: false, error: "unknown-challenge" };
  const chars = countChars(code);
  if (chars > MAX_CODE_CHARS) return { ok: false, error: "too-long" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "sign-in" };

  // refuse early, before spending a browser render (the database checks again)
  const { count } = await admin
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gt("created_at", new Date(Date.now() - 5_000).toISOString());
  if (count) return { ok: false, error: "rate-limited" };

  let accuracy: number;
  try {
    accuracy = await officialAccuracy(challenge, code);
  } catch (error) {
    console.error("Scoring render failed", error);
    return { ok: false, error: "failed" };
  }
  // hints opened on this challenge take their share off
  const { count: hintsUsed } = await admin
    .from("hint_unlocks")
    .select("hint_index", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("challenge_slug", slug);
  const score = scoreFor(accuracy, chars, parFor(challenge), hintsUsed ?? 0);
  const percent = Math.floor(accuracy * 1_000_000) / 10_000; // 4 decimals, never rounded up to 100

  const { data, error } = await admin.rpc("record_submission", {
    p_user: user.id,
    p_slug: slug,
    p_code: code,
    p_accuracy: percent,
    p_score: score,
  });
  if (error) {
    if (error.message.includes("too many submissions")) return { ok: false, error: "rate-limited" };
    console.error("Saving the submission failed", error);
    return { ok: false, error: "failed" };
  }

  const saved = data as { improved: boolean; best: { score: number; chars: number; accuracy: number }; rank: number; hintsUsed: number };

  return {
    ok: true,
    accuracy: percent,
    score,
    chars,
    improved: saved.improved,
    best: { score: saved.best.score, chars: saved.best.chars, accuracy: Number(saved.best.accuracy) },
    rank: saved.rank,
    hintsUsed: saved.hintsUsed,
  };
}
