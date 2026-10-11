-- Dev Fighter — release 1, stage 3: players, submissions, best scores, leaderboards.
--
-- Challenges live in the code (src/data/challenge-list.ts), so tables refer to
-- them by slug. Scores are computed on the server and written only through
-- record_submission(), which only the server's secret key may call: a player
-- can read leaderboards but can never write a score, even through the API.

-- ─── Profiles ────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9_-]{1,38}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public player profiles, created on sign-up from the GitHub/Google account.';

-- A profile for every new account. The username comes from the GitHub login or
-- the email name, made URL-safe; if it's taken, a random suffix is added (and
-- retried on a clash, even with someone signing up at the same moment).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base text;
  chosen text;
begin
  base := lower(coalesce(meta ->> 'user_name', meta ->> 'preferred_username', split_part(new.email, '@', 1), 'player'));
  base := trim(both '-_' from regexp_replace(base, '[^a-z0-9_-]+', '-', 'g'));
  base := left(base, 30);
  if char_length(base) < 2 then
    base := 'player';
  end if;

  chosen := base;
  for attempt in 1..10 loop
    begin
      insert into public.profiles (id, username, display_name, avatar_url)
      values (
        new.id,
        chosen,
        left(coalesce(nullif(meta ->> 'full_name', ''), nullif(meta ->> 'name', ''), meta ->> 'user_name', chosen), 80),
        coalesce(meta ->> 'avatar_url', meta ->> 'picture')
      );
      return new;
    exception when unique_violation then
      chosen := base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    end;
  end loop;
  raise exception 'could not find a free username for %', base;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Submissions and best scores ─────────────────────────────────────────────

create table public.submissions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_slug text not null check (challenge_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  code text not null check (char_length(code) <= 10000),
  chars integer not null check (chars >= 0),
  accuracy numeric(7, 4) not null check (accuracy between 0 and 100),
  score integer not null check (score between 0 and 1000),
  created_at timestamptz not null default now()
);

create index submissions_user_recent on public.submissions (user_id, created_at desc);

comment on table public.submissions is 'Every official submission. The code stays private to its author.';

-- One row per player per challenge: their best submission
create table public.best_scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_slug text not null,
  submission_id bigint not null references public.submissions (id) on delete cascade,
  score integer not null,
  chars integer not null,
  accuracy numeric(7, 4) not null,
  achieved_at timestamptz not null,
  primary key (user_id, challenge_slug)
);

-- leaderboard order: higher score, then shorter code, then earlier
create index best_scores_ranking on public.best_scores (challenge_slug, score desc, chars, achieved_at);

-- Total per player across all challenges
create view public.leaderboard
with (security_invoker = true)
as
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  sum(b.score)::integer as total_score,
  count(*) filter (where b.accuracy = 100)::integer as perfect,
  count(*)::integer as played,
  max(b.achieved_at) as last_played
from public.best_scores b
join public.profiles p on p.id = b.user_id
group by p.id;

-- ─── Recording a submission (server only) ────────────────────────────────────

-- Saves a scored submission and updates the player's best for that challenge.
-- A player may submit at most once every 5 seconds (the server renders each
-- submission in a browser, so this keeps it from being flooded).
create function public.record_submission(
  p_user uuid,
  p_slug text,
  p_code text,
  p_accuracy numeric,
  p_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_chars integer := char_length(p_code);
  v_now timestamptz := now();
  v_submission bigint;
  v_previous public.best_scores;
  v_improved boolean;
  v_best public.best_scores;
  v_rank bigint;
begin
  -- one submission at a time per player
  perform 1 from public.profiles where id = p_user for update;
  if not found then
    raise exception 'no profile for this user' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.submissions
    where user_id = p_user and created_at > v_now - interval '5 seconds'
  ) then
    raise exception 'too many submissions' using errcode = 'P0001', hint = 'rate_limited';
  end if;

  insert into public.submissions (user_id, challenge_slug, code, chars, accuracy, score)
  values (p_user, p_slug, p_code, v_chars, p_accuracy, p_score)
  returning id into v_submission;

  select * into v_previous
  from public.best_scores
  where user_id = p_user and challenge_slug = p_slug;

  v_improved := not found
    or p_score > v_previous.score
    or (p_score = v_previous.score and v_chars < v_previous.chars);

  if v_improved then
    insert into public.best_scores (user_id, challenge_slug, submission_id, score, chars, accuracy, achieved_at)
    values (p_user, p_slug, v_submission, p_score, v_chars, p_accuracy, v_now)
    on conflict (user_id, challenge_slug) do update
      set submission_id = excluded.submission_id,
          score = excluded.score,
          chars = excluded.chars,
          accuracy = excluded.accuracy,
          achieved_at = excluded.achieved_at;
  end if;

  select * into v_best from public.best_scores where user_id = p_user and challenge_slug = p_slug;

  select count(*) + 1 into v_rank
  from public.best_scores b
  where b.challenge_slug = p_slug
    and (b.score > v_best.score
      or (b.score = v_best.score and b.chars < v_best.chars)
      or (b.score = v_best.score and b.chars = v_best.chars and b.achieved_at < v_best.achieved_at));

  return jsonb_build_object(
    'submissionId', v_submission,
    'improved', v_improved,
    'best', jsonb_build_object('score', v_best.score, 'chars', v_best.chars, 'accuracy', v_best.accuracy),
    'rank', v_rank
  );
end;
$$;

-- ─── Who may do what ─────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.best_scores enable row level security;

create policy "Profiles are public"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Best scores are public"
  on public.best_scores for select
  to anon, authenticated
  using (true);

create policy "Players see their own submissions"
  on public.submissions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Belt and braces: even without a policy, take away direct writes from the
-- browser roles. Only the server (service role) writes, through the function.
revoke insert, update, delete, truncate on public.profiles, public.submissions, public.best_scores from anon, authenticated;

revoke all on function public.record_submission(uuid, text, text, numeric, integer) from public, anon, authenticated;
grant execute on function public.record_submission(uuid, text, text, numeric, integer) to service_role;

revoke all on function public.handle_new_user() from public, anon, authenticated;
