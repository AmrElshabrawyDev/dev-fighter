-- Dev Fighter — release 1, stage 4: hints.
--
-- Hints open one at a time and each costs 10% of the score on that challenge
-- (the server applies the discount). They're recorded here so the discount
-- can't be dodged, and — like scores — only the server's secret key writes them.

create table public.hint_unlocks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_slug text not null check (challenge_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  hint_index smallint not null check (hint_index between 0 and 9),
  created_at timestamptz not null default now(),
  primary key (user_id, challenge_slug, hint_index)
);

comment on table public.hint_unlocks is 'Hints a player has opened; each one lowers their score on that challenge by 10%.';

alter table public.hint_unlocks enable row level security;

create policy "Players see their own hints"
  on public.hint_unlocks for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete, truncate on public.hint_unlocks from anon, authenticated;

-- how many hints were open when a score was made (shown next to it)
alter table public.submissions add column hints_used smallint not null default 0 check (hints_used between 0 and 10);
alter table public.best_scores add column hints_used smallint not null default 0 check (hints_used between 0 and 10);

-- Opens the next hint (they open in order) and returns how many are open now.
-- Opening one that's already open changes nothing.
create function public.unlock_hint(p_user uuid, p_slug text, p_index integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_open integer;
begin
  select count(*) into v_open from public.hint_unlocks where user_id = p_user and challenge_slug = p_slug;
  if p_index > v_open then
    raise exception 'hints open in order' using errcode = 'P0001';
  end if;

  insert into public.hint_unlocks (user_id, challenge_slug, hint_index)
  values (p_user, p_slug, p_index)
  on conflict do nothing;

  select count(*) into v_open from public.hint_unlocks where user_id = p_user and challenge_slug = p_slug;
  return v_open;
end;
$$;

revoke all on function public.unlock_hint(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.unlock_hint(uuid, text, integer) to service_role;

-- record_submission, now also noting how many hints were open
create or replace function public.record_submission(
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
  v_hints integer;
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

  select count(*) into v_hints from public.hint_unlocks where user_id = p_user and challenge_slug = p_slug;

  insert into public.submissions (user_id, challenge_slug, code, chars, accuracy, score, hints_used)
  values (p_user, p_slug, p_code, v_chars, p_accuracy, p_score, v_hints)
  returning id into v_submission;

  select * into v_previous
  from public.best_scores
  where user_id = p_user and challenge_slug = p_slug;

  v_improved := not found
    or p_score > v_previous.score
    or (p_score = v_previous.score and v_chars < v_previous.chars);

  if v_improved then
    insert into public.best_scores (user_id, challenge_slug, submission_id, score, chars, accuracy, achieved_at, hints_used)
    values (p_user, p_slug, v_submission, p_score, v_chars, p_accuracy, v_now, v_hints)
    on conflict (user_id, challenge_slug) do update
      set submission_id = excluded.submission_id,
          score = excluded.score,
          chars = excluded.chars,
          accuracy = excluded.accuracy,
          achieved_at = excluded.achieved_at,
          hints_used = excluded.hints_used;
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
    'rank', v_rank,
    'hintsUsed', v_hints
  );
end;
$$;
