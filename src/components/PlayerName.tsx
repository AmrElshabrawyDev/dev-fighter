import type { Player } from "@/lib/leaderboard";

/** Avatar, display name, and @username on its own line (so the two scripts never run together) */
export function PlayerName({ player }: { player: Player }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {player.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars come from GitHub/Google
        <img src={player.avatarUrl} alt="" className="size-8 shrink-0 rounded-full border border-border-strong" />
      ) : (
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-bg-surface font-mono text-xs uppercase">
          {player.displayName[0]}
        </span>
      )}
      <span className="grid min-w-0 leading-tight">
        <span className="truncate font-semibold">{player.displayName}</span>
        <bdi className="truncate font-mono text-xs text-text-tertiary">@{player.username}</bdi>
      </span>
    </span>
  );
}
