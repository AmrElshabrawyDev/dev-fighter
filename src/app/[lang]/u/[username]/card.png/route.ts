import { hasLocale } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/get-dictionary";
import { renderPlayerCard } from "@/lib/og/render";
import { getProfile } from "@/lib/profiles";

/** The player's share card (1200×630), drawn with their current scores */
export async function GET(_request: Request, { params }: RouteContext<"/[lang]/u/[username]/card.png">) {
  const { lang, username } = await params;
  if (!hasLocale(lang)) return new Response("Not found", { status: 404 });
  const profile = await getProfile(username); // reads at request time
  if (!profile) return new Response("Not found", { status: 404 });

  try {
    const png = await renderPlayerCard(lang, await getDictionaryFor(lang), profile);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        // scores change, but a share preview a few minutes old is fine
        "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Drawing a player card failed", error);
    return new Response("Couldn't draw the card", { status: 500 });
  }
}
