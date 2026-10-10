import type { Metadata } from "next";
import { LoginButtons } from "@/components/LoginButtons";
import { LogoMark } from "@/components/Logo";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function generateMetadata(): Promise<Metadata> {
  const { login } = await getDictionary();
  return { title: login.title, robots: { index: false } };
}

export default async function LoginPage() {
  const locale = await getLocale();
  const { login } = await getDictionary();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <LogoMark className="mb-6 size-16" />
      <h1 className="text-3xl font-black">{login.title}</h1>
      <p className="mt-3 text-text-secondary">{login.subtitle}</p>
      <div className="mt-10 w-full">
        {isSupabaseConfigured ? (
          <LoginButtons locale={locale} labels={login} />
        ) : (
          <p className="rounded-lg border border-border-default bg-bg-elevated px-4 py-3 text-sm text-text-secondary">{login.notConfigured}</p>
        )}
      </div>
      <p className="mt-8 text-xs text-text-tertiary">{login.terms}</p>
    </div>
  );
}
