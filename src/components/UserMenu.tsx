import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/supabase/server";

type Labels = { signIn: string; signOut: string; profile: string };

export function SignInLink({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Link
      href={`/${locale}/login`}
      className="whitespace-nowrap rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary transition hover:brightness-110"
    >
      {label}
    </Link>
  );
}

/** Reads the session cookie, so it renders inside <Suspense> (see Header) */
export async function UserMenu({ locale, labels }: { locale: Locale; labels: Labels }) {
  const user = await getCurrentUser();
  if (!user) return <SignInLink locale={locale} label={labels.signIn} />;
  return (
    <div className="flex items-center gap-3">
      <Link
        href={user.username ? `/${locale}/u/${user.username}` : `/${locale}/leaderboard`}
        title={labels.profile}
        className="flex items-center gap-3 transition hover:text-primary"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatars come from GitHub/Google
          <img src={user.avatarUrl} alt="" width={32} height={32} className="size-8 rounded-full border border-border-strong" />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-bg-surface font-mono text-sm">{user.name[0]}</span>
        )}
        <span className="hidden text-sm sm:inline">{user.name}</span>
        <span className="sr-only sm:hidden">{labels.profile}</span>
      </Link>
      <form action="/auth/signout" method="post">
        <input type="hidden" name="locale" value={locale} />
        <button className="text-sm text-text-tertiary transition hover:text-accent">{labels.signOut}</button>
      </form>
    </div>
  );
}
