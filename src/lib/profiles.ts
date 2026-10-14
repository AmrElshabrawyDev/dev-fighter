import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { challenges, getChallenge } from "@/data/challenges";
import type { PlayerSummary } from "@/lib/og/cards";
import { createPublicClient } from "./supabase/public";

// Public player profiles, read live like the leaderboards (see lib/leaderboard).
// A player's code is never shown: only what the leaderboards already show.

export type ProfileScore = {
  slug: string;
  score: number;
  chars: number;
  accuracy: number;
  hintsUsed: number;
  achievedAt: string;
};

export type Profile = PlayerSummary & {
  createdAt: string;
  /** best score on each challenge played, in challenge order */
  scores: ProfileScore[];
};

/** the same rule as the database's username check */
export const USERNAME = /^[a-z0-9][a-z0-9_-]{1,38}$/;

/** A player's public profile, or null when there's no such player (or no Supabase) */
export const getProfile = cache(async (username: string): Promise<Profile | null> => {
  await connection();
  const supabase = createPublicClient();
  if (!supabase || !USERNAME.test(username)) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at")
    .eq("username", username)
    .maybeSingle();
  if (error) console.error("Loading a profile failed", error.message);
  if (!profile) return null;

  const { data: rows, error: scoresError } = await supabase
    .from("best_scores")
    .select("challenge_slug, score, chars, accuracy, hints_used, achieved_at")
    .eq("user_id", profile.id);
  if (scoresError) console.error("Loading a profile's scores failed", scoresError.message);

  const order = (slug: string) => challenges.findIndex((c) => c.slug === slug);
  const scores: ProfileScore[] = (rows ?? [])
    .filter((row) => getChallenge(row.challenge_slug)) // challenges since removed don't count
    .map((row) => ({
      slug: row.challenge_slug,
      score: row.score,
      chars: row.chars,
      accuracy: Number(row.accuracy),
      hintsUsed: row.hints_used ?? 0,
      achievedAt: row.achieved_at,
    }))
    .sort((a, b) => order(a.slug) - order(b.slug));

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const perfect = scores.filter((s) => s.accuracy === 100);
  const lastPlayed = scores.reduce((last, s) => (s.achievedAt > last ? s.achievedAt : last), "");

  return {
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    totalScore,
    rank: scores.length ? await rankOf(totalScore, lastPlayed) : null,
    perfect: perfect.length,
    played: scores.length,
    solved: [...perfect].sort((a, b) => b.score - a.score).map((s) => s.slug),
    scores,
  };
});

/** Place on the global leaderboard: players with more points, or as many but earlier, come first */
async function rankOf(totalScore: number, lastPlayed: string): Promise<number | null> {
  const supabase = createPublicClient()!;
  const { count, error } = await supabase
    .from("leaderboard")
    .select("user_id", { count: "exact", head: true })
    .or(`total_score.gt.${totalScore},and(total_score.eq.${totalScore},last_played.lt."${lastPlayed}")`);
  if (error) {
    console.error("Loading a player's rank failed", error.message);
    return null;
  }
  return (count ?? 0) + 1;
}
