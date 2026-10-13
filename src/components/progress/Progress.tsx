"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useProgress, type Progress } from "@/lib/progress";

const ProgressContext = createContext<Progress>({ here: new Set(), official: new Set() });

/** Loads the player's progress once for a whole page of challenge cards */
export function ProgressProvider({ children }: { children: ReactNode }) {
  return <ProgressContext.Provider value={useProgress()}>{children}</ProgressContext.Provider>;
}

type Labels = { solved: string; solvedHere: string };

/** "Solved" (official 100%) or "Solved in your browser" (100% live match), or nothing */
export function SolvedMark({ slug, labels }: { slug: string; labels: Labels }) {
  const { here, official } = useContext(ProgressContext);
  if (official.has(slug)) {
    return <span data-testid={`solved-${slug}`} className="rounded bg-success/15 px-2 py-1 text-xs font-bold text-success">✓ {labels.solved}</span>;
  }
  if (here.has(slug)) {
    return <span data-testid={`solved-${slug}`} className="rounded bg-secondary/15 px-2 py-1 text-xs text-secondary">✓ {labels.solvedHere}</span>;
  }
  return null;
}

/** "3 of 6" and a bar, for a list of challenges */
export function TrackProgress({ slugs, label }: { slugs: string[]; label: string }) {
  const { here, official } = useContext(ProgressContext);
  const done = slugs.filter((slug) => here.has(slug) || official.has(slug)).length;
  return (
    <div className="flex items-center gap-3" data-testid="track-progress">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-surface" dir="ltr">
        <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(done / slugs.length) * 100}%` }} />
      </div>
      <span className="shrink-0 text-xs text-text-secondary">
        {label.replace("{done}", String(done)).replace("{total}", String(slugs.length))}
      </span>
    </div>
  );
}
