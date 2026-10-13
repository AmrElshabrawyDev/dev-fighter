"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Which challenges a player has solved:
 * - here: reached a 100% live match in this browser (localStorage)
 * - officially: a 100% submission, for signed-in players (read from Supabase)
 */
const KEY = "dev-fighter:solved";
const listeners = new Set<() => void>();
let cache: string | null = null; // the stored JSON, so snapshots stay stable

function readRaw(): string {
  if (cache === null) {
    try {
      cache = window.localStorage.getItem(KEY) ?? "[]";
    } catch {
      cache = "[]";
    }
  }
  return cache;
}

function parse(raw: string): string[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function markSolvedHere(slug: string) {
  const list = parse(readRaw());
  if (list.includes(slug)) return;
  cache = JSON.stringify([...list, slug]);
  try {
    window.localStorage.setItem(KEY, cache);
  } catch {
    // storage blocked: remembered until the tab closes
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cache = null;
      notify();
    }
  };
  listeners.add(notify);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

export type Progress = { here: Set<string>; official: Set<string> };

export function useProgress(): Progress {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const [official, setOfficial] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let current = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!current || !data.user) return;
      const { data: rows } = await supabase.from("best_scores").select("challenge_slug").eq("user_id", data.user.id).eq("accuracy", 100);
      if (current && rows) setOfficial(new Set(rows.map((r) => r.challenge_slug as string)));
    });
    return () => {
      current = false;
    };
  }, []);

  return { here: new Set(parse(raw)), official };
}
