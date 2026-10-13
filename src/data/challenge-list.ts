/**
 * Launch challenges and learning tracks. Each target image is rendered from
 * the challenge's reference solution (`npm run targets`), so targets are exact
 * and the browser never needs the reference code. Hints and explanations stay
 * on the server too: hints are handed out one at a time, the explanation only
 * after a 100% match.
 *
 * No text inside challenges: fonts differ between systems, so a perfect match
 * would depend on the player's computer.
 *
 * Plain data with no imports: the targets script loads this file directly.
 */
export type ChallengeType = "shape" | "component";
export type Difficulty = "easy" | "medium" | "hard";
export type TrackSlug = "basics" | "layout" | "shapes" | "ui";

type Text = { ar: string; en: string };

export type Track = {
  slug: TrackSlug;
  title: Text;
  description: Text;
};

export type Challenge = {
  slug: string;
  type: ChallengeType;
  difficulty: Difficulty;
  width: number;
  height: number;
  title: Text;
  colors: string[];
  reference: string;
  track: TrackSlug;
  /** the CSS idea it practises, e.g. "border-radius" */
  skill: string;
  /** from a gentle nudge to almost the answer */
  hints: Text[];
  /** how the reference solution works, shown after a 100% match */
  explanation: Text;
};

export const tracks: Track[] = [
  {
    slug: "basics",
    title: { ar: "الأساسيات", en: "The basics" },
    description: {
      ar: "الصندوق في CSS: الأبعاد والهوامش والحدود والاستدارة والتدرجات اللونية.",
      en: "The CSS box: sizes, margins, borders, rounded corners and gradients.",
    },
  },
  {
    slug: "layout",
    title: { ar: "التوسيط والتخطيط", en: "Centering & layout" },
    description: {
      ar: "Flexbox و Grid و position: كيف تضع كل عنصر في مكانه بالضبط.",
      en: "Flexbox, Grid and position: putting every element exactly where it belongs.",
    },
  },
  {
    slug: "shapes",
    title: { ar: "الأشكال", en: "Shapes" },
    description: {
      ar: "clip-path و transform و box-shadow: أشكال بلا صور وبأقل عدد من العناصر.",
      en: "clip-path, transform and box-shadow: shapes without images, with as few elements as possible.",
    },
  },
  {
    slug: "ui",
    title: { ar: "واجهات حقيقية", en: "Real UI" },
    description: {
      ar: "أزرار وبطاقات وقوائم كالتي تبنيها في عملك اليومي.",
      en: "Buttons, cards and bars like the ones you build at work.",
    },
  },
];

const SHAPE = { width: 400, height: 300 };
const COMPONENT = { width: 600, height: 400 };

export const launchChallenges: Challenge[] = [
  // ─── The basics ────────────────────────────────────────────────────────────
  {
    slug: "simply-square",
    type: "shape",
    difficulty: "easy",
    ...SHAPE,
    track: "basics",
    skill: "width / height",
    title: { ar: "مربع بسيط", en: "Simply Square" },
    colors: ["#1b1b29", "#89b4fa"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:140px;height:140px;background:#89b4fa}
</style>`,
    hints: [
      { ar: "المربع في منتصف الصفحة تمامًا، ومقاسه 140×140.", en: "The square sits exactly in the middle, and it's 140×140." },
      { ar: "للمتصفح هامش افتراضي على body قدره 8px. أزله بـ margin:0.", en: "Browsers give body an 8px margin by default. Remove it with margin:0." },
      { ar: "اجعل body بارتفاع 100vh ثم display:grid و place-items:center.", en: "Give body height:100vh, then display:grid and place-items:center." },
    ],
    explanation: {
      ar: "body يأخذ ارتفاع الشاشة كاملًا (100vh) بلا هوامش، و display:grid مع place-items:center يضعان المربع في المنتصف أفقيًا ورأسيًا بسطرين فقط. لون خلفية body يملأ الصفحة كلها.",
      en: "body takes the full screen height (100vh) with no margin, and display:grid with place-items:center centres the square both ways in two declarations. body's background fills the whole page.",
    },
  },
  {
    slug: "quiet-corner",
    type: "shape",
    difficulty: "easy",
    ...SHAPE,
    track: "basics",
    skill: "margin",
    title: { ar: "الزاوية الهادئة", en: "Quiet Corner" },
    colors: ["#1b1b29", "#f9e2af"],
    reference: `<div></div>
<style>
body{margin:0;background:#1b1b29}
div{width:120px;height:120px;margin:40px;background:#f9e2af}
</style>`,
    hints: [
      { ar: "المربع يبعد 40px عن الحافة العلوية و40px عن اليسرى.", en: "The square is 40px from the top edge and 40px from the left." },
      { ar: "لا تحتاج أي تخطيط: هامش واحد على العنصر يكفي.", en: "No layout needed: one margin on the element is enough." },
    ],
    explanation: {
      ar: "margin:40px يبعد المربع عن كل الجهات. لاحظ أن هامش div العلوي «ينهار» مع هامش body فيظهر المربع على بعد 40px من الأعلى كما هو متوقع، لأننا صفّرنا هامش body.",
      en: "margin:40px pushes the square away on every side. Its top margin collapses through body, which is why it still lands 40px from the top — we zeroed body's own margin.",
    },
  },
  {
    slug: "picture-frame",
    type: "shape",
    difficulty: "easy",
    ...SHAPE,
    track: "basics",
    skill: "border",
    title: { ar: "إطار صورة", en: "Picture Frame" },
    colors: ["#1b1b29", "#fab387", "#11111b"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:120px;height:120px;border:20px solid #fab387;background:#11111b}
</style>`,
    hints: [
      { ar: "المقاس الكلي 160×160، منها إطار سمكه 20px.", en: "It's 160×160 in total, including a 20px-thick frame." },
      { ar: "الإطار يُضاف خارج width و height (إلا إذا استخدمت box-sizing:border-box).", en: "A border is added outside width and height (unless you use box-sizing:border-box)." },
    ],
    explanation: {
      ar: "العرض 120 + إطار 20 من كل جهة = 160px. هذا هو «نموذج الصندوق»: المحتوى ثم الحشو ثم الإطار ثم الهامش، وكلها تُجمع على width و height.",
      en: "Width 120 + a 20px border on each side = 160px. That's the box model: content, then padding, then border, then margin — all added on top of width and height.",
    },
  },
  {
    slug: "twin-moons",
    type: "shape",
    difficulty: "easy",
    ...SHAPE,
    track: "basics",
    skill: "border-radius",
    title: { ar: "قمران", en: "Twin Moons" },
    colors: ["#11111b", "#f9e2af", "#cba6f7"],
    reference: `<i></i><b></b>
<style>
body{margin:0;height:100vh;display:flex;gap:30px;justify-content:center;align-items:center;background:#11111b}
i,b{width:110px;height:110px;border-radius:50%;background:#f9e2af}
b{background:#cba6f7}
</style>`,
    hints: [
      { ar: "كل دائرة 110×110، وبينهما مسافة 30px.", en: "Each circle is 110×110, with 30px between them." },
      { ar: "border-radius:50% يحول المربع إلى دائرة.", en: "border-radius:50% turns a square into a circle." },
      { ar: "display:flex مع gap يضع العنصرين بجانب بعض بمسافة ثابتة.", en: "display:flex with gap puts the two side by side with a fixed space." },
    ],
    explanation: {
      ar: "border-radius:50% يجعل كل زاوية نصف عرض العنصر فتصبح دائرة. و gap في flex يضع مسافة بين العناصر بلا هوامش، و justify-content و align-items يوسّطانها.",
      en: "border-radius:50% makes each corner half the element's width, so it becomes a circle. gap in flex spaces the items without margins, and justify-content plus align-items centre them.",
    },
  },
  {
    slug: "leaf",
    type: "shape",
    difficulty: "medium",
    ...SHAPE,
    track: "basics",
    skill: "border-radius",
    title: { ar: "ورقة شجر", en: "Leaf" },
    colors: ["#1b1b29", "#a6e3a1"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:150px;height:150px;border-radius:150px 0;background:#a6e3a1}
</style>`,
    hints: [
      { ar: "مربع 150×150، زاويتان منه حادتان واثنتان مستديرتان بالكامل.", en: "A 150×150 square: two sharp corners, two fully rounded." },
      { ar: "border-radius يقبل قيمة لكل زاوية، وقيمتان تعنيان: (أعلى اليسار وأسفل اليمين) ثم (أعلى اليمين وأسفل اليسار).", en: "border-radius takes a value per corner; two values mean (top-left & bottom-right) then (top-right & bottom-left)." },
    ],
    explanation: {
      ar: "border-radius:150px 0 يعطي استدارة كاملة لزاويتين متقابلتين ويترك الأخريين حادتين، فيظهر شكل الورقة. نصف قطر بطول الضلع كاملًا يجعل القوس يمتد من زاوية لأخرى.",
      en: "border-radius:150px 0 fully rounds two opposite corners and leaves the other two sharp — a leaf. A radius as long as the side makes the curve run corner to corner.",
    },
  },
  {
    slug: "three-bands",
    type: "shape",
    difficulty: "medium",
    ...SHAPE,
    track: "basics",
    skill: "linear-gradient",
    title: { ar: "ثلاثة أشرطة", en: "Three Bands" },
    colors: ["#94e2d5", "#cdd6f4", "#cba6f7"],
    reference: `<style>
body{margin:0;height:100vh;background:linear-gradient(90deg,#94e2d5 33.3%,#cdd6f4 0 66.6%,#cba6f7 0)}
</style>`,
    hints: [
      { ar: "ثلاثة أشرطة عمودية متساوية تملأ الصفحة، بلا أي عنصر.", en: "Three equal vertical bands fill the page — no element needed." },
      { ar: "التدرج يمكن أن يكون «حادًا»: لونان عند نفس النقطة يعطيان حدًا مستقيمًا بدل الانتقال الناعم.", en: "A gradient can be sharp: two colours at the same point give a hard edge instead of a blend." },
      { ar: "linear-gradient(90deg, لون 33.3%, لون 0 66.6%, لون 0)", en: "linear-gradient(90deg, colour 33.3%, colour 0 66.6%, colour 0)" },
    ],
    explanation: {
      ar: "خلفية body وحدها تكفي. في التدرج، كتابة 0 كبداية للون التالي تعني «ابدأ من حيث انتهى السابق»، فيتحول الانتقال الناعم إلى حد حاد. 90deg يجعل الاتجاه من اليسار لليمين.",
      en: "body's background is enough. In a gradient, 0 as the next colour's start means \"start where the last one ended\", turning the blend into a hard edge. 90deg makes it run left to right.",
    },
  },

  // ─── Centering & layout ────────────────────────────────────────────────────
  {
    slug: "traffic-light",
    type: "shape",
    difficulty: "easy",
    ...SHAPE,
    track: "layout",
    skill: "flex-direction",
    title: { ar: "إشارة المرور", en: "Traffic Light" },
    colors: ["#1b1b29", "#11111b", "#f38ba8", "#f9e2af", "#a6e3a1"],
    reference: `<div><i></i><i></i><i></i></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{display:flex;flex-direction:column;gap:14px;padding:16px;border-radius:24px;background:#11111b}
i{width:56px;height:56px;border-radius:50%;background:#f38ba8}
i+i{background:#f9e2af}
i+i+i{background:#a6e3a1}
</style>`,
    hints: [
      { ar: "ثلاث دوائر 56px فوق بعضها، بينها 14px، داخل صندوق بحشو 16px.", en: "Three 56px circles stacked, 14px apart, in a box with 16px padding." },
      { ar: "flex-direction:column يرص العناصر رأسيًا.", en: "flex-direction:column stacks items vertically." },
      { ar: "i+i يختار كل i يأتي بعد i آخر، و i+i+i الثالث فقط.", en: "i+i selects every i that follows another i; i+i+i only the third." },
    ],
    explanation: {
      ar: "flex مع flex-direction:column و gap يرصّ الدوائر رأسيًا بمسافات متساوية، والحشو والاستدارة يصنعان جسم الإشارة. محدد الأخ المجاور (+) يلوّن الدائرتين الثانية والثالثة بلا كلاسات.",
      en: "flex with flex-direction:column and gap stacks the circles evenly; padding and rounding make the housing. The adjacent-sibling selector (+) colours the second and third circles without classes.",
    },
  },
  {
    slug: "tic-grid",
    type: "shape",
    difficulty: "medium",
    ...SHAPE,
    track: "layout",
    skill: "grid",
    title: { ar: "شبكة تسعة", en: "Nine Grid" },
    colors: ["#11111b", "#89b4fa", "#f38ba8"],
    reference: `<div><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#11111b}
div{display:grid;grid-template-columns:repeat(3,60px);gap:12px}
b{height:60px;border-radius:8px;background:#89b4fa}
b:nth-child(5){background:#f38ba8}
</style>`,
    hints: [
      { ar: "تسعة مربعات 60px في ثلاثة أعمدة، بينها 12px، والأوسط مختلف اللون.", en: "Nine 60px squares in three columns, 12px apart, the middle one a different colour." },
      { ar: "grid-template-columns:repeat(3,60px) يصنع ثلاثة أعمدة متساوية.", en: "grid-template-columns:repeat(3,60px) makes three equal columns." },
      { ar: ":nth-child(5) يختار العنصر الخامس، وهو الأوسط.", en: ":nth-child(5) picks the fifth element — the middle one." },
    ],
    explanation: {
      ar: "Grid يرتب العناصر في أعمدة وصفوف تلقائيًا: نحدد الأعمدة فقط، والصفوف تُنشأ وحدها. gap يضع المسافة بين الخلايا، و nth-child يميّز الخلية الوسطى.",
      en: "Grid arranges items into columns and rows automatically: we only define the columns; rows appear on their own. gap spaces the cells and nth-child picks out the middle one.",
    },
  },
  {
    slug: "staircase",
    type: "shape",
    difficulty: "medium",
    ...SHAPE,
    track: "layout",
    skill: "align-items",
    title: { ar: "السلّم", en: "Staircase" },
    colors: ["#1b1b29", "#a6e3a1"],
    reference: `<div><i></i><i></i><i></i><i></i></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{display:flex;align-items:flex-end;gap:12px;height:200px}
i{width:50px;height:50px;background:#a6e3a1}
i+i{height:100px}
i+i+i{height:150px}
i+i+i+i{height:200px}
</style>`,
    hints: [
      { ar: "أربعة أعمدة عرضها 50px وأطوالها 50 و100 و150 و200، تقف على خط واحد من الأسفل.", en: "Four 50px-wide bars, 50, 100, 150 and 200 tall, all standing on one baseline." },
      { ar: "في flex، align-items:flex-end يصفّ العناصر من الأسفل.", en: "In flex, align-items:flex-end lines items up at the bottom." },
    ],
    explanation: {
      ar: "align-items يحدد مكان العناصر على المحور العرضي: flex-end يجعلها تقف على الحافة السفلية للحاوية، فتصعد الأعمدة كدرجات سلّم. كل عمود أطول بـ 50px عن سابقه.",
      en: "align-items places items on the cross axis: flex-end stands them on the container's bottom edge, so the bars rise like steps — each 50px taller than the last.",
    },
  },
  {
    slug: "orbit",
    type: "shape",
    difficulty: "medium",
    ...SHAPE,
    track: "layout",
    skill: "position",
    title: { ar: "مدار", en: "Orbit" },
    colors: ["#11111b", "#45475a", "#fab387"],
    reference: `<b></b><i></i>
<style>
body{margin:0;background:#11111b}
b,i{position:fixed;border-radius:50%}
b{left:120px;top:70px;width:140px;height:140px;border:10px solid #45475a}
i{left:185px;top:60px;width:30px;height:30px;background:#fab387}
</style>`,
    hints: [
      { ar: "حلقة قطرها 160px (بإطار 10px) في المنتصف، وقمر صغير 30px يجلس على أعلاها.", en: "A 160px ring (10px border) in the centre, with a small 30px moon sitting on its top." },
      { ar: "position:fixed مع left و top يضع العنصر في إحداثيات دقيقة من زاوية الصفحة.", en: "position:fixed with left and top places an element at exact coordinates from the page corner." },
      { ar: "منتصف الصفحة (200, 150). الحلقة تبدأ من (120, 70)، والقمر من (185, 60).", en: "The page centre is (200, 150). The ring starts at (120, 70), the moon at (185, 60)." },
    ],
    explanation: {
      ar: "عندما تحتاج مكانًا دقيقًا بالبكسل، position يكفي: الحلقة 140 + إطار 10 من كل جهة = 160، فتبدأ من 200−80 و 150−80. القمر مركزه على خط الإطار العلوي: 75 − 15 = 60.",
      en: "When you need exact pixels, position does it: the ring is 140 + a 10px border each side = 160, so it starts at 200−80 and 150−80. The moon is centred on the top of the border: 75 − 15 = 60.",
    },
  },
  {
    slug: "checkerboard",
    type: "shape",
    difficulty: "hard",
    ...SHAPE,
    track: "layout",
    skill: "conic-gradient",
    title: { ar: "رقعة شطرنج", en: "Checkerboard" },
    colors: ["#cdd6f4", "#11111b"],
    reference: `<style>
body{margin:0;height:100vh;background:conic-gradient(#cdd6f4 25%,#11111b 0 50%,#cdd6f4 0 75%,#11111b 0) 0 0/100px 100px}
</style>`,
    hints: [
      { ar: "مربعات 50px تملأ الصفحة، والنمط يتكرر كل 100px.", en: "50px squares fill the page; the pattern repeats every 100px." },
      { ar: "صمّم «بلاطة» واحدة 100×100 فيها أربعة مربعات، ثم كررها بـ background-size.", en: "Design one 100×100 tile with four squares, then repeat it with background-size." },
      { ar: "conic-gradient يلف حول المنتصف: كل ربع (25%) منه مربع.", en: "conic-gradient sweeps around the centre: each quarter (25%) is one square." },
    ],
    explanation: {
      ar: "conic-gradient يوزّع الألوان حول نقطة المنتصف كعقارب الساعة، فأربعة أرباع بالتبادل تصنع بلاطة 2×2. ثم background-size:100px يكرر البلاطة على الصفحة كلها، بلا أي عنصر.",
      en: "conic-gradient spreads colours around the centre like clock hands, so four alternating quarters make a 2×2 tile. background-size:100px then repeats the tile across the page — no elements at all.",
    },
  },

  // ─── Shapes ────────────────────────────────────────────────────────────────
  {
    slug: "triangle",
    type: "shape",
    difficulty: "easy",
    ...SHAPE,
    track: "shapes",
    skill: "clip-path",
    title: { ar: "مثلث", en: "Triangle" },
    colors: ["#1b1b29", "#f9e2af"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:200px;height:170px;background:#f9e2af;clip-path:polygon(50% 0,100% 100%,0 100%)}
</style>`,
    hints: [
      { ar: "مثلث قاعدته 200px وارتفاعه 170px، في منتصف الصفحة.", en: "A triangle 200px wide at the base and 170px tall, in the middle." },
      { ar: "clip-path:polygon(...) يقص العنصر حسب نقاط تحددها بالنسبة المئوية.", en: "clip-path:polygon(...) cuts the element along points you give in percent." },
    ],
    explanation: {
      ar: "clip-path يبقي فقط الجزء داخل المضلع: الرأس في منتصف الأعلى (50% 0)، والقاعدة في الزاويتين السفليتين. العنصر ما زال مستطيلًا في التخطيط، لكنه يُرسم مثلثًا.",
      en: "clip-path keeps only what's inside the polygon: the tip at the top centre (50% 0) and the base at the two bottom corners. The element is still a rectangle for layout — it's just drawn as a triangle.",
    },
  },
  {
    slug: "diamond",
    type: "shape",
    difficulty: "easy",
    ...SHAPE,
    track: "shapes",
    skill: "transform",
    title: { ar: "معيّن", en: "Diamond" },
    colors: ["#1b1b29", "#94e2d5"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:130px;height:130px;background:#94e2d5;transform:rotate(45deg)}
</style>`,
    hints: [
      { ar: "هو مربع 130×130… لكنه مائل.", en: "It's a 130×130 square… tilted." },
      { ar: "transform:rotate() يدير العنصر حول منتصفه.", en: "transform:rotate() turns an element around its centre." },
    ],
    explanation: {
      ar: "rotate(45deg) يدير المربع حول مركزه فيصبح معيّنًا. الدوران لا يغيّر مكان العنصر في التخطيط، لذلك يبقى موسّطًا تمامًا.",
      en: "rotate(45deg) turns the square around its centre into a diamond. Transforms don't change the element's place in the layout, so it stays perfectly centred.",
    },
  },
  {
    slug: "the-hexagon",
    type: "shape",
    difficulty: "medium",
    ...SHAPE,
    track: "shapes",
    skill: "clip-path",
    title: { ar: "السداسي", en: "The Hexagon" },
    colors: ["#1b1b29", "#89b4fa", "#11111b"],
    reference: `<div><p></p></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:180px;height:200px;display:grid;place-items:center;background:#89b4fa;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)}
p{width:150px;height:170px;margin:0;background:#11111b;clip-path:inherit}
</style>`,
    hints: [
      { ar: "سداسي أزرق 180×200، وداخله سداسي داكن 150×170.", en: "A blue 180×200 hexagon with a dark 150×170 hexagon inside." },
      { ar: "النقاط الست: (50% 0) (100% 25%) (100% 75%) (50% 100%) (0 75%) (0 25%).", en: "The six points: (50% 0) (100% 25%) (100% 75%) (50% 100%) (0 75%) (0 25%)." },
      { ar: "clip-path:inherit يجعل العنصر الداخلي يستخدم نفس شكل الأب.", en: "clip-path:inherit gives the inner element the parent's shape." },
    ],
    explanation: {
      ar: "نفس المضلع يُطبَّق مرتين: على الأب الأزرق، ثم على ابنه الداكن الأصغر بـ inherit. الفرق في المقاس (30px) يظهر كإطار أزرق متساوي السمك تقريبًا.",
      en: "The same polygon is applied twice: to the blue parent, then via inherit to its smaller dark child. The 30px size difference shows up as an even blue border.",
    },
  },
  {
    slug: "crescent",
    type: "shape",
    difficulty: "medium",
    ...SHAPE,
    track: "shapes",
    skill: "box-shadow",
    title: { ar: "هلال", en: "Crescent" },
    colors: ["#11111b", "#f9e2af"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#11111b}
div{width:150px;height:150px;border-radius:50%;box-shadow:-30px 20px #f9e2af}
</style>`,
    hints: [
      { ar: "الهلال دائرة تنقصها دائرة أخرى… وكلتاهما 150px.", en: "A crescent is a circle minus another circle — both 150px." },
      { ar: "ظل العنصر (box-shadow) لا يُرسم تحت العنصر نفسه، بل حوله فقط.", en: "An element's box-shadow isn't drawn under the element itself, only around it." },
      { ar: "دائرة شفافة بظل مزاح −30px أفقيًا و20px رأسيًا.", en: "A transparent circle with a shadow shifted −30px across and 20px down." },
    ],
    explanation: {
      ar: "الظل الخارجي يُقص داخل حدود العنصر، فدائرة بلا خلفية مع ظل مُزاح تُظهر فقط الجزء الذي خرج من الظل خارج الدائرة: هلال، بعنصر واحد وبلا لون خلفية.",
      en: "An outer shadow is clipped inside the element's own box, so a background-less circle with an offset shadow shows only the part of the shadow outside the circle: a crescent from one element.",
    },
  },
  {
    slug: "sunset-stripes",
    type: "shape",
    difficulty: "hard",
    ...SHAPE,
    track: "shapes",
    skill: "repeating-linear-gradient",
    title: { ar: "غروب", en: "Sunset Stripes" },
    colors: ["#11111b", "#fab387", "#f38ba8", "#cba6f7"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:end center;background:#11111b}
div{width:240px;height:120px;border-radius:120px 120px 0 0;background:repeating-linear-gradient(#fab387 0 20px,#f38ba8 20px 40px,#cba6f7 40px 60px)}
</style>`,
    hints: [
      { ar: "نصف دائرة 240×120 تقف على الحافة السفلية، مخططة بأشرطة 20px.", en: "A 240×120 half circle on the bottom edge, striped in 20px bands." },
      { ar: "نصف الدائرة: استدارة 120px للزاويتين العلويتين فقط.", en: "The half circle: a 120px radius on the two top corners only." },
      { ar: "repeating-linear-gradient يكرر مجموعة الأشرطة حتى يملأ العنصر.", en: "repeating-linear-gradient repeats the set of bands until the element is full." },
    ],
    explanation: {
      ar: "place-items:end center ينزل العنصر للأسفل ويوسّطه أفقيًا. الاستدارة على الزاويتين العلويتين تصنع نصف الدائرة، و repeating-linear-gradient يكرر ثلاثة أشرطة حادة الحدود.",
      en: "place-items:end center drops the element to the bottom and centres it across. Rounding the two top corners makes the half circle, and repeating-linear-gradient repeats three hard-edged bands.",
    },
  },
  {
    slug: "target",
    type: "shape",
    difficulty: "hard",
    ...SHAPE,
    track: "shapes",
    skill: "radial-gradient",
    title: { ar: "الهدف", en: "Bullseye" },
    colors: ["#1b1b29", "#f38ba8", "#cdd6f4"],
    reference: `<div></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{width:160px;height:160px;border-radius:50%;background:radial-gradient(#f38ba8 20px,#cdd6f4 0 40px,#f38ba8 0 60px,#cdd6f4 0)}
</style>`,
    hints: [
      { ar: "دائرة قطرها 160px فيها أربع حلقات متبادلة، كل حلقة سمكها 20px.", en: "A 160px circle with four alternating rings, each 20px thick." },
      { ar: "radial-gradient يرسم الألوان في دوائر تخرج من المنتصف.", en: "radial-gradient paints colours in circles growing out from the centre." },
      { ar: "مثل الأشرطة الحادة: لون حتى 20px، ثم التالي من 0 حتى 40px، وهكذا.", en: "Like hard-edged stripes: one colour up to 20px, the next from 0 to 40px, and so on." },
    ],
    explanation: {
      ar: "radial-gradient بنقاط توقف حادة يرسم حلقات كاملة الاستدارة من عنصر واحد. جرّب نفس الشكل بـ box-shadow spread حول دائرة صغيرة: ستجد الحلقات الخارجية تتحول لمربعات مستديرة، لأن المتصفح يقلل استدارة الظل كلما كبر.",
      en: "A radial-gradient with hard stops paints perfectly round rings from one element. Try the same with box-shadow spread around a small circle and the outer rings turn into rounded squares — browsers soften the shadow's rounding as it grows.",
    },
  },

  // ─── Real UI ───────────────────────────────────────────────────────────────
  {
    slug: "pill-button",
    type: "component",
    difficulty: "easy",
    ...COMPONENT,
    track: "ui",
    skill: "padding / gap",
    title: { ar: "زر رئيسي", en: "Pill Button" },
    colors: ["#11111b", "#89b4fa"],
    reference: `<button><i></i><b></b></button>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#11111b}
button{display:flex;align-items:center;gap:14px;padding:22px 36px;border:0;border-radius:999px;background:#89b4fa;box-shadow:0 12px 30px #89b4fa40}
i{width:22px;height:22px;border-radius:50%;background:#11111b}
b{width:120px;height:14px;border-radius:7px;background:#11111b}
</style>`,
    hints: [
      { ar: "زر بحشو 22px رأسيًا و36px أفقيًا، فيه دائرة 22px وشريط 120×14.", en: "A button with 22px/36px padding holding a 22px dot and a 120×14 bar." },
      { ar: "border-radius كبير جدًا (مثل 999px) يجعل الطرفين نصف دائرة مهما كان الطول.", en: "A huge border-radius (like 999px) makes both ends half circles at any length." },
      { ar: "الظل لونه نفس لون الزر بشفافية: #89b4fa40.", en: "The shadow is the button's own colour, see-through: #89b4fa40." },
    ],
    explanation: {
      ar: "الحشو يحدد حجم الزر حول محتواه، و gap يباعد الأيقونة عن النص. border-radius:999px يصنع «حبة الدواء» لأي عرض، والظل الملون بشفافية (آخر رقمين في اللون) يعطيه إحساس الارتفاع.",
      en: "Padding sizes the button around its content and gap spaces the icon from the label. border-radius:999px makes a pill at any width, and a tinted see-through shadow (the colour's last two digits) lifts it.",
    },
  },
  {
    slug: "toggle-switch",
    type: "component",
    difficulty: "easy",
    ...COMPONENT,
    track: "ui",
    skill: "justify-content",
    title: { ar: "مفتاح تشغيل", en: "Toggle Switch" },
    colors: ["#11111b", "#a6e3a1"],
    reference: `<div><i></i></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#11111b}
div{display:flex;justify-content:flex-end;width:160px;height:84px;padding:8px;box-sizing:border-box;border-radius:42px;background:#a6e3a1}
i{width:68px;height:68px;border-radius:50%;background:#11111b}
</style>`,
    hints: [
      { ar: "مسار 160×84 مستدير، والمقبض دائرة 68px في الطرف الأيمن مع حشو 8px.", en: "A 160×84 rounded track; the knob is a 68px circle at the right end, with 8px padding." },
      { ar: "box-sizing:border-box يجعل الحشو داخل width و height بدل أن يُضاف إليهما.", en: "box-sizing:border-box puts the padding inside width and height instead of on top." },
      { ar: "justify-content:flex-end يدفع المقبض لنهاية المسار.", en: "justify-content:flex-end pushes the knob to the end of the track." },
    ],
    explanation: {
      ar: "المسار حاوية flex، و justify-content:flex-end يضع المقبض في آخرها (وضع «مفعّل»). مع border-box، الحشو 8px من كل جهة يترك 68px بالضبط للمقبض.",
      en: "The track is a flex container and justify-content:flex-end parks the knob at its end — the \"on\" state. With border-box, 8px of padding on each side leaves exactly 68px for the knob.",
    },
  },
  {
    slug: "progress-bar",
    type: "component",
    difficulty: "easy",
    ...COMPONENT,
    track: "ui",
    skill: "percent widths",
    title: { ar: "شريط التقدم", en: "Progress Bar" },
    colors: ["#11111b", "#313244", "#89b4fa", "#cba6f7"],
    reference: `<div><b></b></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#11111b}
div{width:360px;height:24px;border-radius:12px;background:#313244}
b{display:block;width:65%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#89b4fa,#cba6f7)}
</style>`,
    hints: [
      { ar: "مسار 360×24 مستدير، ممتلئ بنسبة 65% بتدرج من الأزرق إلى البنفسجي.", en: "A 360×24 rounded track, 65% full with a blue-to-purple gradient." },
      { ar: "النسبة المئوية في width تُحسب من عرض الأب.", en: "A percent width is worked out from the parent's width." },
      { ar: "<b> عنصر inline: يحتاج display:block ليأخذ عرضًا وارتفاعًا.", en: "<b> is inline: it needs display:block to take a width and height." },
    ],
    explanation: {
      ar: "الامتلاء عنصر داخلي بعرض 65% من المسار وارتفاع 100%، يرث الاستدارة بـ inherit. التدرج الأفقي الناعم بين لونين يعطيه الحيوية، وتغيير الرقم وحده يحرّك التقدم.",
      en: "The fill is a child 65% of the track's width and 100% of its height, inheriting the rounding. A smooth horizontal gradient brings it to life, and changing one number moves the progress.",
    },
  },
  {
    slug: "search-bar",
    type: "component",
    difficulty: "medium",
    ...COMPONENT,
    track: "ui",
    skill: "box-sizing",
    title: { ar: "شريط البحث", en: "Search Bar" },
    colors: ["#1b1b29", "#11111b", "#45475a", "#7f849c"],
    reference: `<div><i></i><b></b></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#1b1b29}
div{display:flex;align-items:center;gap:16px;width:420px;height:64px;padding:0 22px;box-sizing:border-box;border:2px solid #45475a;border-radius:32px;background:#11111b}
i{width:14px;height:14px;border:4px solid #7f849c;border-radius:50%}
b{width:180px;height:12px;border-radius:6px;background:#45475a}
</style>`,
    hints: [
      { ar: "حقل 420×64 بإطار 2px واستدارة كاملة، فيه أيقونة دائرية وشريط نص.", en: "A 420×64 field with a 2px border and full rounding, holding a ring icon and a text bar." },
      { ar: "الأيقونة حلقة: عنصر 14px بإطار 4px (المجموع 22px).", en: "The icon is a ring: a 14px element with a 4px border (22px in all)." },
      { ar: "مع box-sizing:border-box يبقى المقاس الكلي 420×64 رغم الحشو والإطار.", en: "With box-sizing:border-box the field stays 420×64 despite padding and border." },
    ],
    explanation: {
      ar: "border-box يجعل width و height تشملان الحشو والإطار، فيسهل ضبط المقاسات كما في التصميم. align-items:center يوسّط الأيقونة والنص رأسيًا داخل الارتفاع الثابت.",
      en: "border-box makes width and height include padding and border, so sizes match the design. align-items:center centres the icon and text vertically in the fixed height.",
    },
  },
  {
    slug: "notification-badge",
    type: "component",
    difficulty: "medium",
    ...COMPONENT,
    track: "ui",
    skill: "position: absolute",
    title: { ar: "شارة الإشعارات", en: "Notification Badge" },
    colors: ["#11111b", "#313244", "#f38ba8"],
    reference: `<div><i></i></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#11111b}
div{position:relative;width:120px;height:120px;border-radius:28px;background:#313244}
i{position:absolute;top:-14px;right:-14px;width:40px;height:40px;border:6px solid #11111b;border-radius:50%;background:#f38ba8}
</style>`,
    hints: [
      { ar: "أيقونة مربعة 120px مستديرة الزوايا، وشارة حمراء تخرج من زاويتها العليا اليمنى.", en: "A 120px rounded square icon, with a red badge poking out of its top-right corner." },
      { ar: "position:relative على الأب و absolute على الشارة يجعلان top و right تُحسبان من الأب.", en: "position:relative on the parent and absolute on the badge measure top and right from the parent." },
      { ar: "الحلقة الداكنة حول الشارة إطار بلون الخلفية، يفصلها عن الأيقونة.", en: "The dark ring around the badge is a border in the page colour, separating it from the icon." },
    ],
    explanation: {
      ar: "الأب relative يصبح نقطة المرجع، والشارة absolute بقيم سالبة (−14px) تخرج جزئيًا خارجه. الإطار بلون الخلفية حيلة شائعة لفصل الشارة بصريًا عن الأيقونة.",
      en: "The relative parent becomes the reference point, and the absolute badge with negative offsets (−14px) pokes out of it. A border in the page colour is a common trick to cut the badge visually from the icon.",
    },
  },
  {
    slug: "profile-card",
    type: "component",
    difficulty: "medium",
    ...COMPONENT,
    track: "ui",
    skill: "grid + justify-items",
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
    hints: [
      { ar: "بطاقة بعرض 300px وحشو 32px وإطار 1px، عناصرها موسّطة وبينها 14px.", en: "A 300px card with 32px padding and a 1px border; items centred, 14px apart." },
      { ar: "display:grid مع justify-items:center يوسّط كل عنصر أفقيًا في سطره.", en: "display:grid with justify-items:center centres each item across its row." },
      { ar: "الزر عرضه 100% وفوقه 10px إضافية (margin-top).", en: "The button is 100% wide with 10px extra above it (margin-top)." },
    ],
    explanation: {
      ar: "Grid بعمود واحد يرص العناصر رأسيًا، و justify-items:center يوسّطها، و gap يوحّد المسافات. الزر بعرض 100% يملأ عرض البطاقة الداخلي، و margin-top يفصله قليلًا عن النصوص.",
      en: "A one-column grid stacks the items, justify-items:center centres them and gap evens the spacing. The 100% button fills the card's inner width, and margin-top sets it apart from the text.",
    },
  },
  {
    slug: "nav-bar",
    type: "component",
    difficulty: "medium",
    ...COMPONENT,
    track: "ui",
    skill: "margin: auto in flex",
    title: { ar: "شريط التنقل", en: "Nav Bar" },
    colors: ["#11111b", "#1b1b29", "#313244", "#89b4fa", "#7f849c"],
    reference: `<nav><i></i><b></b><b></b><b></b><u></u></nav>
<style>
body{margin:0;background:#11111b}
nav{display:flex;align-items:center;gap:24px;height:72px;padding:0 32px;background:#1b1b29;border-bottom:1px solid #313244}
i{width:36px;height:36px;margin-right:auto;border-radius:10px;background:#89b4fa}
b{width:64px;height:10px;border-radius:5px;background:#7f849c}
u{width:110px;height:40px;border-radius:20px;background:#89b4fa}
</style>`,
    hints: [
      { ar: "شريط بارتفاع 72px أعلى الصفحة: شعار على اليسار، وثلاثة روابط وزر على اليمين.", en: "A 72px bar at the top: a logo on the left, three links and a button on the right." },
      { ar: "في flex، margin-right:auto على عنصر يأخذ كل المساحة الفارغة بعده.", en: "In flex, margin-right:auto on an item takes all the free space after it." },
    ],
    explanation: {
      ar: "margin-right:auto على الشعار يبتلع المساحة الفارغة فيدفع باقي العناصر لليمين، وهي أبسط طريقة لفصل مجموعتين في نفس الشريط. align-items:center يوسّط الكل رأسيًا.",
      en: "margin-right:auto on the logo swallows the free space and pushes everything else right — the simplest way to split one bar into two groups. align-items:center lines them up vertically.",
    },
  },
  {
    slug: "pricing-card",
    type: "component",
    difficulty: "hard",
    ...COMPONENT,
    track: "ui",
    skill: "grid + gradients",
    title: { ar: "بطاقة الأسعار", en: "Pricing Card" },
    colors: ["#11111b", "#1b1b29", "#cba6f7", "#cdd6f4", "#a6e3a1", "#45475a"],
    reference: `<div><s></s><b></b><p></p><p></p><p></p><a></a></div>
<style>
body{margin:0;height:100vh;display:grid;place-items:center;background:#11111b}
div{display:grid;gap:14px;width:260px;padding:28px;border-top:6px solid #cba6f7;border-radius:20px;background:#1b1b29}
s{width:90px;height:12px;border-radius:6px;background:#cba6f7}
b{width:150px;height:36px;border-radius:8px;background:#cdd6f4}
p{margin:0;height:14px;border-radius:7px;background:linear-gradient(90deg,#a6e3a1 14px,#1b1b29 0 24px,#45475a 0)}
a{height:44px;margin-top:8px;border-radius:12px;background:#cba6f7}
</style>`,
    hints: [
      { ar: "بطاقة 260px بحشو 28px وخط علوي بنفسجي 6px: عنوان صغير، سعر كبير، ثلاث مزايا، وزر.", en: "A 260px card with 28px padding and a 6px purple top line: a small title, a big price, three features and a button." },
      { ar: "كل سطر ميزة عنصر واحد: مربع أخضر 14px ثم فراغ 10px ثم شريط رمادي، كلها بتدرج حاد.", en: "Each feature line is one element: a 14px green square, a 10px gap, then a grey bar — all one hard-stop gradient." },
      { ar: "في grid، العناصر بلا width تمتد بعرض البطاقة، والتي لها width تبدأ من اليسار.", en: "In grid, items without a width stretch across the card; those with one sit at the start." },
    ],
    explanation: {
      ar: "Grid بعمود واحد و gap يرتب البطاقة، والخط العلوي إطار علوي فقط. كل سطر ميزة عنصر واحد يرسم فيه تدرج حاد العلامة والفراغ والنص معًا، بدل ثلاثة عناصر.",
      en: "A one-column grid with gap lays out the card, and the top line is a top border only. Each feature line is a single element whose hard-stop gradient draws the tick, the gap and the text bar together — instead of three elements.",
    },
  },
];

/**
 * Fingerprint of everything that shapes a target image (FNV-1a, 8 hex digits).
 * Stored next to the rendered PNGs so a stale target is caught at build time.
 */
export function targetVersion({ width, height, reference }: Pick<Challenge, "width" | "height" | "reference">): string {
  let hash = 0x811c9dc5;
  for (const char of `${width}x${height}\n${reference}`) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
