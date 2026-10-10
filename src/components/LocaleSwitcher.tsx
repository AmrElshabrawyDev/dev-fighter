"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

/** Same page in the other language; remembers the choice for next visits */
export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const other: Locale = locale === "ar" ? "en" : "ar";
  const href = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${other}`) || `/${other}`;
  return (
    <Link
      href={href}
      hrefLang={other}
      lang={other}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${other}; path=/; max-age=31536000; samesite=lax`;
      }}
      className="whitespace-nowrap rounded-md border border-border-default px-3 py-1.5 text-sm text-text-secondary transition hover:border-primary hover:text-text-primary"
    >
      {label}
    </Link>
  );
}
