import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function PlayerNotFound() {
  const locale = await getLocale();
  const { profile: t, leaderboard } = await getDictionary();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-6xl font-black text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t.notFoundTitle}</h1>
      <p className="mt-3 text-text-secondary">{t.notFoundText}</p>
      <Link href={`/${locale}/leaderboard`} className="mt-8 inline-block text-secondary hover:underline">
        {leaderboard.title}
      </Link>
    </div>
  );
}
