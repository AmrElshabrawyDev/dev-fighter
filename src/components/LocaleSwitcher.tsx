"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

type Props = { locale: Locale; label: string };

/** Same page in the other language; remembers the choice for next visits */
export function LocaleSwitcher({ locale, label }: Props) {
  const other: Locale = locale === "ar" ? "en" : "ar";
  // On pages whose address is only known at request time (a player's profile),
  // the other language's home page stands in until the real link streams in.
  return (
    <Suspense fallback={<SwitchLink href={`/${other}`} locale={other} label={label} />}>
      <CurrentPageSwitch other={other} label={label} />
    </Suspense>
  );
}

function CurrentPageSwitch({ other, label }: { other: Locale; label: string }) {
  const pathname = usePathname();
  const href = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${other}`) || `/${other}`;
  return <SwitchLink href={href} locale={other} label={label} />;
}

function SwitchLink({ href, locale, label }: { href: string; locale: Locale; label: string }) {
  return (
    <Link
      href={href}
      hrefLang={locale}
      lang={locale}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
      }}
      className="whitespace-nowrap rounded-md border border-border-default px-3 py-1.5 text-sm text-text-secondary transition hover:border-primary hover:text-text-primary"
    >
      {label}
    </Link>
  );
}
