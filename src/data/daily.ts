/**
 * The daily challenge: the same for everyone on a given day, changing at
 * midnight Arabia time (UTC+3), and cycling through every challenge in a fixed
 * shuffled order before any repeats.
 */
const DAY = 24 * 60 * 60 * 1000;
const ARABIA_OFFSET = 3 * 60 * 60 * 1000; // UTC+3 (Riyadh, Baghdad; Cairo is close)
const FIRST_DAY = Date.UTC(2026, 0, 1);

/** Days since 1 January 2026, by the calendar in UTC+3 */
export function dayNumber(now: Date): number {
  return Math.floor((now.getTime() + ARABIA_OFFSET - FIRST_DAY) / DAY);
}

/** Fisher–Yates with a small seeded generator (mulberry32), so the order never changes between deploys */
function shuffled<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function dailySlug(now: Date, slugs: string[]): string {
  const order = shuffled([...slugs].sort(), 2026);
  const day = dayNumber(now);
  return order[((day % order.length) + order.length) % order.length];
}
