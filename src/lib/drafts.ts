"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A player's code per challenge, kept in localStorage so a refresh doesn't
 * lose it. Memory is the source of truth, so it still works when storage is
 * blocked (private mode) — the draft just doesn't survive a reload then.
 */
const memory = new Map<string, string | null>();
const listeners = new Set<() => void>();

function read(key: string): string | null {
  if (!memory.has(key)) {
    try {
      memory.set(key, window.localStorage.getItem(key));
    } catch {
      memory.set(key, null);
    }
  }
  return memory.get(key)!;
}

function write(key: string, code: string) {
  memory.set(key, code);
  try {
    window.localStorage.setItem(key, code);
  } catch {
    // storage blocked or full
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  // another tab edited the same challenge
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || memory.has(e.key)) {
      if (e.key) memory.delete(e.key);
      else memory.clear();
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

export function useDraft(key: string, fallback: string): [string, (code: string) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null, // the server has no drafts: render the starter, then swap in the draft
  );
  const save = useCallback((code: string) => write(key, code), [key]);
  return [stored ?? fallback, save];
}
