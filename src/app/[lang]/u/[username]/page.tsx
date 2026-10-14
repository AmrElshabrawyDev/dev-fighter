import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/JsonLd";
import { ShareButton } from "@/components/ShareButton";
import { TargetImage } from "@/components/TargetImage";
import { getChallenge, toPublic, trackChallenges, tracks } from "@/data/challenges";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getProfile, type Profile } from "@/lib/profiles";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

const cardUrl = (locale: string, username: string) => `/${locale}/u/${username}/card.png`;

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[username]">): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  const locale = await getLocale();
  const { profile: t, share, meta } = await getDictionary();
  if (!profile) return { title: t.notFoundTitle, robots: { index: false } };

  const title = `${profile.displayName} (@${profile.username})`;
  return {
    ...pageMetadata({
      locale,
      path: `/u/${profile.username}`,
      title,
      description: fill(t.metaDescription, { name: profile.displayName, score: profile.totalScore, perfect: profile.perfect }),
      image: { url: cardUrl(locale, profile.username), alt: fill(share.imageAlt, { title }) },
      siteTitle: meta.title,
      type: "profile",
    }),
    // a profile with no scores yet has nothing to find
    robots: profile.played ? undefined : { index: false },
  };
}

export default function ProfilePage({ params }: PageProps<"/[lang]/u/[username]">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <Suspense fallback={<ProfileSkeleton />}>
        <PlayerProfile params={params} />
      </Suspense>
    </div>
  );
}

/** Read live at request time (see lib/profiles) */
async function PlayerProfile({ params }: { params: PageProps<"/[lang]/u/[username]">["params"] }) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();
  const locale = await getLocale();
  const dict = await getDictionary();
  const t = dict.profile;
  const path = `/${locale}/u/${profile.username}`;
  const joined = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en", { year: "numeric", month: "long" }).format(
    new Date(profile.createdAt),
  );

  const stats = [
    { label: t.score, value: profile.totalScore.toLocaleString("en-US"), className: "text-gold", testId: "profile-score" },
    { label: t.rank, value: profile.rank ? `#${profile.rank}` : "—", className: "text-primary", testId: "profile-rank" },
    { label: t.perfect, value: String(profile.perfect), className: "text-success", testId: "profile-perfect" },
    { label: t.played, value: String(profile.played), className: "text-secondary", testId: "profile-played" },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          dateCreated: profile.createdAt,
          mainEntity: {
            "@type": "Person",
            name: profile.displayName,
            alternateName: `@${profile.username}`,
            identifier: profile.username,
            ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
            url: absoluteUrl(path),
          },
        }}
      />

      <header className="flex flex-wrap items-center gap-5">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatars come from GitHub/Google
          <img src={profile.avatarUrl} alt="" width={96} height={96} className="size-24 rounded-full border-2 border-primary" />
        ) : (
          <span aria-hidden className="grid size-24 place-items-center rounded-full border-2 border-primary bg-bg-surface text-4xl font-black text-primary">
            {[...profile.displayName][0]}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {/* <bdi>: an Arabic name on the English page (or the other way round) keeps its own direction */}
          <h1 className="text-3xl font-black break-words sm:text-4xl">
            <bdi>{profile.displayName}</bdi>
          </h1>
          <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-text-tertiary">
            <bdi className="font-mono">@{profile.username}</bdi>
            <span>{fill(t.joined, { date: joined })}</span>
          </p>
        </div>
        <ShareButton
          path={path}
          text={fill(dict.share.profile, { score: profile.totalScore })}
          t={{ button: t.share, copied: dict.share.copied }}
        />
      </header>

      <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border-default bg-bg-elevated p-4">
            <dt className="text-sm text-text-secondary">{s.label}</dt>
            <dd data-testid={s.testId} className={`mt-1 font-mono text-3xl font-bold ${s.className}`} dir="ltr">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-10" aria-labelledby="tracks-title">
        <h2 id="tracks-title" className="text-xl font-bold">
          {t.tracksTitle}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {tracks.map((track) => {
            const slugs = trackChallenges(track).map((c) => c.slug);
            const done = slugs.filter((slug) => profile.solved.includes(slug)).length;
            return (
              <li key={track.slug} className="rounded-xl border border-border-subtle bg-bg-elevated p-4">
                <Link href={`/${locale}/tracks/${track.slug}`} className="font-semibold transition hover:text-primary">
                  {track.title[locale]}
                </Link>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-surface" dir="ltr">
                    <div className="h-full rounded-full bg-success" style={{ width: `${(done / slugs.length) * 100}%` }} />
                  </div>
                  <span className="shrink-0 text-xs text-text-secondary">{fill(dict.tracks.progress, { done, total: slugs.length })}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="scores-title">
        <h2 id="scores-title" className="text-xl font-bold">
          {t.solvedTitle}
        </h2>
        {profile.scores.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border-default p-8 text-center text-text-secondary">{t.empty}</p>
        ) : (
          <ScoreList profile={profile} locale={locale} t={t} />
        )}
      </section>
    </>
  );
}

function ScoreList({ profile, locale, t }: { profile: Profile; locale: "ar" | "en"; t: Awaited<ReturnType<typeof getDictionary>>["profile"] }) {
  return (
    <ol className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="profile-scores">
      {profile.scores.map((s) => {
        const challenge = toPublic(getChallenge(s.slug)!);
        const title = challenge.title[locale];
        return (
          <li key={s.slug}>
            <Link
              href={`/${locale}/challenges/${s.slug}`}
              className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-elevated p-3 transition hover:border-primary"
            >
              <TargetImage challenge={challenge} size={96} label={title} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  <span className="me-1.5 font-mono text-xs text-text-tertiary">#{String(challenge.number).padStart(2, "0")}</span>
                  {title}
                </span>
                <span className="mt-1 flex flex-wrap gap-x-3 font-mono text-xs text-text-tertiary">
                  <span className={s.accuracy === 100 ? "text-success" : undefined} dir="ltr">
                    {s.accuracy === 100 ? "✓ 100" : s.accuracy.toFixed(1)}%
                  </span>
                  <span>
                    {s.chars} {t.chars}
                  </span>
                  {s.hintsUsed > 0 && <span className="text-gold">{t.hints.replace("{n}", String(s.hintsUsed))}</span>}
                </span>
              </span>
              <span className="shrink-0 text-end">
                <span className="block text-xs text-text-tertiary">{t.best}</span>
                <b className="font-mono text-lg text-gold">{s.score}</b>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-busy className="animate-pulse">
      <div className="flex items-center gap-5">
        <div className="size-24 rounded-full bg-bg-elevated" />
        <div className="h-10 w-64 rounded-lg bg-bg-elevated" />
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-bg-elevated" />
        ))}
      </div>
    </div>
  );
}
