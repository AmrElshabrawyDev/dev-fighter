import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function NotFound() {
  const locale = await getLocale();
  const { notFound } = await getDictionary();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-6xl font-black text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">{notFound.title}</h1>
      <Link href={`/${locale}`} className="mt-8 inline-block text-secondary hover:underline">
        {notFound.back}
      </Link>
    </div>
  );
}
