import "server-only";
import { connection } from "next/server";
import { createPublicClient } from "./supabase/public";

// Leaderboards are read at request time, never cached: a player who just set a
// new best sees it at once, and so does everyone else. (Cached, they'd be baked
// into the page's static copy, which visitors kept seeing after a new score.)
// Callers render them inside <Suspense>.

export type Player = { username: string; displayName: string; avatarUrl: string | null };
export type GlobalRow = Player & { rank: number; totalScore: number; perfect: number; played: number };
export type ChallengeRow = Player & { rank: number; score: number; chars: number; accuracy: number };

/** null: leaderboards aren't set up (no Supabase), or couldn't be loaded */
export async function getLeaderboard(limit = 50): Promise<GlobalRow[] | null> {
  await connection();

  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("leaderboard")
    .select("username, display_name, avatar_url, total_score, perfect, played")
    .order("total_score", { ascending: false })
    .order("last_played", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("Loading the leaderboard failed", error.message);
    return null;
  }
  return data.map((row, i) => ({
    rank: i + 1,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    totalScore: row.total_score,
    perfect: row.perfect,
    played: row.played,
  }));
}

export async function getChallengeLeaderboard(slug: string, limit = 10): Promise<ChallengeRow[] | null> {
  await connection();

  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("best_scores")
    .select("score, chars, accuracy, profiles!inner(username, display_name, avatar_url)")
    .eq("challenge_slug", slug)
    .order("score", { ascending: false })
    .order("chars", { ascending: true })
    .order("achieved_at", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("Loading the challenge leaderboard failed", error.message);
    return null;
  }
  return data.map((row, i) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      rank: i + 1,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      score: row.score,
      chars: row.chars,
      accuracy: Number(row.accuracy),
    };
  });
}
