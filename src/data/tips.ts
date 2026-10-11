/**
 * Code-golf tips: each one shows code before and after the trick. Both render
 * the same picture in a 400×300 challenge (the end-to-end tests check this),
 * so the "after" is always a fair, shorter replacement.
 *
 * These tricks win challenges; they're not how you'd write CSS for a real site.
 */
export type Tip = {
  slug: string;
  title: { ar: string; en: string };
  text: { ar: string; en: string };
  /** a caveat shown under the example */
  note?: { ar: string; en: string };
  before: string;
  after: string;
};

export const tips: Tip[] = [
  {
    slug: "whitespace",
    title: { ar: "احذف المسافات والأسطر الفارغة", en: "Remove whitespace" },
    text: {
      ar: "المسافات والأسطر الجديدة والمحاذاة تجعل الكود مقروءًا لك، لكن المتصفح لا يحتاجها. كل مسافة حرف يُحسب عليك، فاكتب الكود في سطر واحد بلا مسافات زائدة.",
      en: "Spaces, line breaks and indentation make code readable for you, but the browser doesn't need them. Every space is a character that counts against you, so write it on one line.",
    },
    before: `<div></div>
<style>
  div {
    width: 100px;
    height: 100px;
    background: #89b4fa;
  }
</style>`,
    after: `<div></div><style>div{width:100px;height:100px;background:#89b4fa;}</style>`,
  },
  {
    slug: "last-semicolon",
    title: { ar: "استغنِ عن آخر فاصلة منقوطة", en: "Drop the last semicolon" },
    text: {
      ar: "الفاصلة المنقوطة تفصل بين الخصائص، لذلك آخر خاصية قبل القوس } لا تحتاجها.",
      en: "Semicolons separate declarations, so the last one before } doesn't need one.",
    },
    before: `<div></div><style>div{width:100px;height:100px;background:#89b4fa;}</style>`,
    after: `<div></div><style>div{width:100px;height:100px;background:#89b4fa}</style>`,
  },
  {
    slug: "closing-tags",
    title: { ar: "لا تغلق الوسوم", en: "Skip closing tags" },
    text: {
      ar: "المتصفح يغلق الوسوم المفتوحة بنفسه عند نهاية الصفحة، حتى </style> في آخر الكود. انتبه: الوسم غير المغلق يصبح أبًا لما بعده، فقد يرث العنصر التالي مكانه أو تنسيقه.",
      en: "The browser closes open tags for you at the end of the page — even a final </style>. Careful: an unclosed tag becomes the parent of what follows it, which can change layout or inherited styles.",
    },
    before: `<div></div><style>div{width:100px;height:100px;background:#89b4fa}</style>`,
    after: `<div><style>div{width:100px;height:100px;background:#89b4fa}`,
  },
  {
    slug: "unquoted-attributes",
    title: { ar: "احذف علامات التنصيص من الخصائص", en: "Unquoted attributes" },
    text: {
      ar: "قيمة الخاصية في HTML لا تحتاج علامات تنصيص ما دامت لا تحتوي مسافة أو \" أو ' أو = أو < أو >. هذا مفيد مع style المكتوب داخل الوسم.",
      en: "An HTML attribute value needs no quotes as long as it has no spaces, quotes, =, < or >. Handy with inline style.",
    },
    note: {
      ar: "إذا احتجت مسافة (مثل border:5px solid red) أبقِ علامات التنصيص أو استخدم خصائص لا تحتاج مسافة.",
      en: "If you need a space (like border:5px solid red), keep the quotes or switch to properties that don't need one.",
    },
    before: `<div style="width:100px;height:100px;background:#89b4fa"></div>`,
    after: `<div style=width:100px;height:100px;background:#89b4fa>`,
  },
  {
    slug: "short-tags",
    title: { ar: "وسوم من حرف واحد بدل الكلاسات", en: "One-letter tags instead of classes" },
    text: {
      ar: "بدل <div class=\"ball\"> و .ball استخدم وسمًا قصيرًا مثل <b> أو <i> أو <a> واستهدفه باسمه. هذه الوسوم inline، لكنها تتصرف كصناديق داخل grid أو flex أو مع position.",
      en: "Instead of <div class=\"ball\"> and .ball, use a short tag like <b>, <i> or <a> and select it by name. They're inline, but act as boxes inside grid, flex, or when positioned.",
    },
    before: `<div class="ball"></div><style>body{display:grid}.ball{width:100px;height:100px;background:#89b4fa}</style>`,
    after: `<b><style>body{display:grid}b{width:100px;height:100px;background:#89b4fa}`,
  },
  {
    slug: "made-up-attributes",
    title: { ar: "خاصية مخترعة بدل nth-child", en: "A made-up attribute instead of nth-child" },
    text: {
      ar: "يمكنك وضع أي خاصية تخترعها على العنصر، مثل <p a>، ثم استهدافه بـ [a]. أقصر بكثير من p:nth-child(2)، وأقوى منه في الأولوية من مجرد p.",
      en: "Put any attribute you invent on an element, like <p a>, and select it with [a]. Much shorter than p:nth-child(2), and it outranks a plain p selector.",
    },
    before: `<p></p><p></p><p></p><style>p{height:50px;background:#45475a}p:nth-child(2){background:#89b4fa}</style>`,
    after: `<p><p a><p><style>p{height:50px;background:#45475a}[a]{background:#89b4fa}`,
  },
  {
    slug: "position-fixed",
    title: { ar: "fixed أقصر من absolute", en: "fixed is shorter than absolute" },
    text: {
      ar: "في التحديات لا يوجد تمرير ولا عنصر أب له position، لذلك position:fixed يضع العنصر في نفس مكان position:absolute بحرفين أقل.",
      en: "Challenges don't scroll and have no positioned parent, so position:fixed lands exactly where position:absolute would — two characters shorter.",
    },
    before: `<div><style>div{position:absolute;top:50px;left:50px;width:100px;height:100px;background:#89b4fa}`,
    after: `<div><style>div{position:fixed;top:50px;left:50px;width:100px;height:100px;background:#89b4fa}`,
  },
  {
    slug: "viewport-units",
    title: { ar: "العب بالوحدات: vw و vh", en: "Play with units: vw and vh" },
    text: {
      ar: "في تحدي 400×300: كل 1vw = 4px وكل 1vh = 3px. لذلك 100px = 25vw و 150px = 50vh، وكلاهما أقصر.",
      en: "In a 400×300 challenge, 1vw = 4px and 1vh = 3px. So 100px = 25vw and 150px = 50vh — both shorter.",
    },
    note: {
      ar: "في تحديات الواجهات (600×400) تتغير الحسبة: 1vw = 6px و 1vh = 4px.",
      en: "In UI challenges (600×400) the maths changes: 1vw = 6px and 1vh = 4px.",
    },
    before: `<div><style>div{width:100px;height:150px;background:#89b4fa}`,
    after: `<div><style>div{width:25vw;height:50vh;background:#89b4fa}`,
  },
  {
    slug: "style-body",
    title: { ar: "لا تحتاج عنصرًا لكل شيء", en: "You don't always need an element" },
    text: {
      ar: "html و body موجودان دائمًا. لون خلفية على body يملأ الصفحة كلها، فلا داعي لعنصر إضافي يغطيها.",
      en: "html and body are always there. A background on body fills the whole page, so there's no need for an extra element to cover it.",
    },
    before: `<div><style>body{margin:0}div{height:100vh;background:#89b4fa}`,
    after: `<style>body{background:#89b4fa}`,
  },
  {
    slug: "bgcolor",
    title: { ar: "خاصية bgcolor القديمة", en: "The ancient bgcolor attribute" },
    text: {
      ar: "body ما زال يقبل خاصية bgcolor من أيام HTML القديمة، وهي أقصر من كتابة style كامل.",
      en: "body still accepts the bgcolor attribute from old HTML, and it's shorter than a whole style rule.",
    },
    before: `<style>body{background:#89b4fa}`,
    after: `<body bgcolor=#89b4fa>`,
  },
  {
    slug: "zero-units",
    title: { ar: "الصفر لا يحتاج وحدة (وباقي الأرقام تحتاج)", en: "Zero needs no unit (other numbers do)" },
    text: {
      ar: "0px و 0 شيء واحد، فاكتب 0 فقط.",
      en: "0px and 0 are the same thing, so just write 0.",
    },
    note: {
      ar: "في cssbattle يمكن كتابة width:100 بدون px لأن صفحاته تعمل في «وضع التوافق» القديم. Dev Fighter يعرض كودك في الوضع القياسي مثل المواقع الحقيقية، لذلك الأرقام بدون وحدة (عدا الصفر) تُتجاهل.",
      en: "On cssbattle you can write width:100 without px because its pages run in old “quirks mode”. Dev Fighter renders your code in standards mode, like real websites, so unitless numbers (other than zero) are ignored.",
    },
    before: `<div><style>div{width:100px;height:100px;margin:0px;background:#89b4fa}`,
    after: `<div><style>div{width:100px;height:100px;margin:0;background:#89b4fa}`,
  },
  {
    slug: "grid-center",
    title: { ar: "توسيط بسطرين بدل ثلاثة", en: "Center with two declarations, not three" },
    text: {
      ar: "display:grid مع place-items:center يوسّط العنصر أفقيًا ورأسيًا، بدل flex مع align-items و justify-content.",
      en: "display:grid with place-items:center centers both ways, instead of flex with align-items and justify-content.",
    },
    before: `<div><style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center}div{width:100px;height:100px;background:#89b4fa}`,
    after: `<div><style>body{margin:0;height:100vh;display:grid;place-items:center}div{width:100px;height:100px;background:#89b4fa}`,
  },
  {
    slug: "short-colors",
    title: { ar: "أقصر طريقة لكتابة اللون", en: "The shortest way to write a colour" },
    text: {
      ar: "#ff0000 تُكتب #f00 عندما يتكرر كل رقمين، وبعض الألوان لها أسماء أقصر من رمزها مثل red و tan و #000 بدل black.",
      en: "#ff0000 becomes #f00 when each pair repeats, and some colours have names shorter than their code, like red and tan — or #000 instead of black.",
    },
    before: `<div><style>div{width:100px;height:100px;background:#ff0000}`,
    after: `<div><style>div{width:100px;height:100px;background:red}`,
  },
  {
    slug: "box-shadow-copies",
    title: { ar: "انسخ الشكل بـ box-shadow", en: "Copy a shape with box-shadow" },
    text: {
      ar: "box-shadow بدون تمويه يرسم نسخة مطابقة من العنصر في أي مكان، فلا تحتاج عنصرًا لكل شكل متكرر. والظل والإطار بدون لون يأخذان قيمة color، فاكتب اللون مرة واحدة، وارسم المربع بإطار سميك بدل width و height و background.",
      en: "A box-shadow without blur draws an exact copy of the element anywhere, so repeated shapes don't need an element each. Shadows and borders without a colour use color — write the colour once, and draw the square with a thick border instead of width, height and background.",
    },
    note: {
      ar: "النسخ تأخذ نفس الحجم والاستدارة، لكن لا يمكن أن يكون لها محتوى أو تأثير على ترتيب الصفحة.",
      en: "Copies keep the same size and rounded corners, but they can't hold content or affect the layout.",
    },
    before: `<a><b><i><style>a,b,i{position:fixed;top:120px;width:60px;height:60px;background:#89b4fa}a{left:60px}b{left:170px}i{left:280px}`,
    after: `<a><style>a{position:fixed;top:120px;left:60px;border:30px solid;color:#89b4fa;box-shadow:110px 0,220px 0}`,
  },
];
