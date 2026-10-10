"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";

type Labels = { github: string; google: string; error: string };
type Provider = "github" | "google";

function Buttons({ locale, labels }: { locale: Locale; labels: Labels }) {
  const [pending, setPending] = useState<Provider | null>(null);
  const failed = useSearchParams().has("error");

  async function signIn(provider: Provider) {
    const supabase = createClient();
    if (!supabase) return;
    setPending(provider);
    const next = `/${locale}`;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {failed && <p className="rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent">{labels.error}</p>}
      <button
        onClick={() => signIn("github")}
        disabled={pending !== null}
        className="flex items-center justify-center gap-3 rounded-lg bg-text-primary px-4 py-3 font-semibold text-bg-base transition hover:brightness-95 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
        </svg>
        {labels.github}
      </button>
      <button
        onClick={() => signIn("google")}
        disabled={pending !== null}
        className="flex items-center justify-center gap-3 rounded-lg border border-border-strong px-4 py-3 font-semibold transition hover:border-primary disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z" />
        </svg>
        {labels.google}
      </button>
    </div>
  );
}

/** useSearchParams needs a Suspense boundary under Cache Components */
export function LoginButtons(props: { locale: Locale; labels: Labels }) {
  return (
    <Suspense>
      <Buttons {...props} />
    </Suspense>
  );
}
