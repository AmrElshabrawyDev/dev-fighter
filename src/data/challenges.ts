/**
 * Launch challenges. Each target is rendered from its reference solution,
 * so targets are exact and reproducible (and the scoring engine will compare
 * against the same render). Reference code stays server-side once scoring lands.
 */
export type ChallengeType = "shape" | "component";
export type Difficulty = "easy" | "medium" | "hard";

export type Challenge = {
  slug: string;
  type: ChallengeType;
  difficulty: Difficulty;
  width: number;
  height: number;
  title: { ar: string; en: string };
  colors: string[];
  reference: string;
};

const SHAPE = { width: 400, height: 300 };
const COMPONENT = { width: 600, height: 400 };

const launchChallenges: Challenge[] = [
  {
    slug: "simply-square",
    type: "shape",
    difficulty: "easy",
    ...SHAPE,
    title: { ar: "مربع بسيط", en: "Simply Square" },
    colors: ["#1b1b29", "#89b4fa"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:140px;height:140px;background:#89b4fa}
</style>`,
  },
  {
    slug: "twin-moons",
    type: "shape",
    difficulty: "easy",
    ...SHAPE,
    title: { ar: "قمران", en: "Twin Moons" },
    colors: ["#11111b", "#f9e2af", "#cba6f7"],
    reference: `<i></i><b></b>
<style>
body{margin:0;height:100vh;display:flex;gap:30px;justify-content:center;align-items:center;background:#11111b}
i,b{width:110px;height:110px;border-radius:50%;background:#f9e2af}
b{background:#cba6f7}
</style>`,
  },
  {
    slug: "the-hexagon",
    type: "shape",
    difficulty: "medium",
    ...SHAPE,
    title: { ar: "السداسي", en: "The Hexagon" },
    colors: ["#1b1b29", "#89b4fa", "#11111b"],
    reference: `<div><p></p></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:180px;height:200px;display:grid;place-items:center;background:#89b4fa;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}
p{width:150px;height:170px;margin:0;background:#11111b;clip-path:inherit}
</style>`,
  },
  {
    slug: "sunset-stripes",
    type: "shape",
    difficulty: "hard",
    ...SHAPE,
    title: { ar: "غروب", en: "Sunset Stripes" },
    colors: ["#11111b", "#fab387", "#f38ba8", "#cba6f7"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:end center;background:#11111b}
div{width:240px;height:120px;border-radius:120px 120px 0 0;background:repeating-linear-gradient(#fab387 0 20px,#f38ba8 20px 40px,#cba6f7 40px 60px)}
</style>`,
  },
  {
    slug: "pill-button",
    type: "component",
    difficulty: "easy",
    ...COMPONENT,
    title: { ar: "زر رئيسي", en: "Pill Button" },
    colors: ["#11111b", "#89b4fa"],
    reference: `<button><i></i><b></b></button>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#11111b}
button{display:flex;align-items:center;gap:14px;padding:22px 36px;border:0;border-radius:999px;background:#89b4fa;box-shadow:0 12px 30px #89b4fa40}
i{width:22px;height:22px;border-radius:50%;background:#11111b}
b{width:120px;height:14px;border-radius:7px;background:#11111b}
</style>`,
  },
  {
    slug: "profile-card",
    type: "component",
    difficulty: "medium",
    ...COMPONENT,
    title: { ar: "بطاقة ملف شخصي", en: "Profile Card" },
    colors: ["#11111b", "#1b1b29", "#94e2d5", "#cdd6f4", "#45475a", "#89b4fa"],
    reference: `<div class="card"><i></i><b></b><s></s><u></u></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#11111b}
.card{width:300px;padding:32px;border-radius:24px;background:#1b1b29;border:1px solid #45475a;display:grid;justify-items:center;gap:14px}
i{width:84px;height:84px;border-radius:50%;background:#94e2d5}
b{width:160px;height:16px;border-radius:8px;background:#cdd6f4}
s{width:110px;height:12px;border-radius:6px;background:#45475a}
u{width:100%;height:44px;margin-top:10px;border-radius:12px;background:#89b4fa}
</style>`,
  },
];

/**
 * Guards the data at build time: each colour shown to the player appears once
 * (it's also a React key) and every colour the reference uses is listed, so the
 * palette never leaves a player guessing.
 */
function checked(list: Challenge[]): Challenge[] {
  for (const c of list) {
    const shown = c.colors.map((color) => color.toLowerCase());
    if (new Set(shown).size !== shown.length) throw new Error(`Challenge "${c.slug}": a colour is listed twice`);
    // 6-digit colours only; #rrggbbaa (shadows with alpha) are variations of a listed colour
    for (const [used] of c.reference.toLowerCase().matchAll(/#[0-9a-f]{6}(?![0-9a-f])/g)) {
      if (!shown.includes(used)) throw new Error(`Challenge "${c.slug}": ${used} is used but not in its colours`);
    }
  }
  return list;
}

export const challenges = checked(launchChallenges);
