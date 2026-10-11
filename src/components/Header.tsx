import Link from "next/link";
import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { SignInLink, UserMenu } from "./UserMenu";

export async function Header() {
  const locale = await getLocale();
  const { nav } = await getDictionary();
  const links = [
    { href: `/${locale}/challenges`, label: nav.challenges },
    { href: `/${locale}/tips`, label: nav.tips },
    { label: nav.tracks, soon: true },
    { label: nav.battles, soon: true },
    { label: nav.leaderboard, soon: true },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-overlay backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={`/${locale}`} aria-label="Dev Fighter">
          <Logo />
        </Link>
        <nav aria-label={nav.menu} className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) =>
            link.href ? (
              <Link key={link.label} href={link.href} className="text-text-secondary transition hover:text-text-primary">
                {link.label}
              </Link>
            ) : (
              <span key={link.label} className="flex items-center gap-1.5 text-text-tertiary">
                {link.label}
                <span className="rounded bg-bg-surface px-1.5 py-0.5 text-[10px] text-warning">{nav.soon}</span>
              </span>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher locale={locale} label={nav.switchTo} />
          <Suspense fallback={<SignInLink locale={locale} label={nav.signIn} />}>
            <UserMenu locale={locale} labels={nav} />
          </Suspense>
        </div>
      </div>
      {/* small screens: the same links in a scrollable row */}
      <nav aria-label={nav.menu} className="flex gap-5 overflow-x-auto border-t border-border-subtle px-4 py-2.5 text-sm whitespace-nowrap md:hidden">
        {links.map((link) =>
          link.href ? (
            <Link key={link.label} href={link.href} className="text-text-primary">
              {link.label}
            </Link>
          ) : (
            <span key={link.label} className="text-text-tertiary">
              {link.label} <span className="text-[10px] text-warning">· {nav.soon}</span>
            </span>
          ),
        )}
      </nav>
    </header>
  );
}
