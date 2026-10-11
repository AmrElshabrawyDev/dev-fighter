-- Database tests (pgTAP): npm run test:db  (needs the local Supabase: npx supabase start)
begin;
select plan(31);

-- start from an empty database (all of this is rolled back at the end)
delete from auth.users;

-- ─── Setup: three accounts, as GitHub/Google would create them ───────────────
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'amr@example.com', '{"user_name": "Amr.Elshabrawy", "full_name": "Amr Elshabrawy", "avatar_url": "https://example.com/a.png"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com', '{"user_name": "amr-elshabrawy"}'),
  ('00000000-0000-0000-0000-00000000000c', 'sara@example.com', '{"name": "Sara"}');

-- ─── Profiles are created on sign-up ─────────────────────────────────────────
select is((select username from profiles where id = '00000000-0000-0000-0000-00000000000a'), 'amr-elshabrawy', 'GitHub login becomes a URL-safe username');
select is((select display_name from profiles where id = '00000000-0000-0000-0000-00000000000a'), 'Amr Elshabrawy', 'full name is the display name');
select is((select avatar_url from profiles where id = '00000000-0000-0000-0000-00000000000a'), 'https://example.com/a.png', 'avatar is kept');
select matches((select username from profiles where id = '00000000-0000-0000-0000-00000000000b'), '^amr-elshabrawy-[0-9a-f]{6}$', 'a taken username gets a unique suffix');
select is((select username from profiles where id = '00000000-0000-0000-0000-00000000000c'), 'sara', 'without a login, the email name is used');
select is((select display_name from profiles where id = '00000000-0000-0000-0000-00000000000c'), 'Sara', 'Google name is the display name');

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@example.com', '{"user_name": "twin"}'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@example.com', '{"user_name": "twin"}'),
  ('00000000-0000-0000-0000-0000000000d3', 'd3@example.com', '{"user_name": "twin"}');
select is((select count(distinct username)::integer from profiles where username like 'twin%'), 3, 'three people wanting the same name all get one');
select is((select count(*)::integer from profiles where username ~ '^twin-[0-9a-f]{6}$'), 2, 'the later ones get a random suffix');
delete from auth.users where email like 'd_@example.com';

-- ─── Row level security is on everywhere ─────────────────────────────────────
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'RLS on profiles');
select ok((select relrowsecurity from pg_class where oid = 'public.submissions'::regclass), 'RLS on submissions');
select ok((select relrowsecurity from pg_class where oid = 'public.best_scores'::regclass), 'RLS on best_scores');

-- ─── The server records submissions ──────────────────────────────────────────
set local role service_role;

select is(
  (select (record_submission('00000000-0000-0000-0000-00000000000a', 'twin-moons', repeat('x', 150), 100, 900) ->> 'improved')::boolean),
  true, 'a first submission is the best one');

reset role;
update submissions set created_at = now() - interval '1 minute';  -- step past the rate limit
set local role service_role;

select is(
  (select (record_submission('00000000-0000-0000-0000-00000000000a', 'twin-moons', repeat('x', 140), 90, 500) ->> 'improved')::boolean),
  false, 'a lower score does not replace the best');
select is((select score from best_scores where user_id = '00000000-0000-0000-0000-00000000000a' and challenge_slug = 'twin-moons'), 900, 'best score kept');

reset role;
update submissions set created_at = now() - interval '1 minute';
set local role service_role;

select is(
  (select (record_submission('00000000-0000-0000-0000-00000000000a', 'twin-moons', repeat('x', 120), 100, 900) ->> 'improved')::boolean),
  true, 'the same score with shorter code is better');
select is((select chars from best_scores where user_id = '00000000-0000-0000-0000-00000000000a' and challenge_slug = 'twin-moons'), 120, 'chars are counted by the database');

select throws_ok(
  $$ select record_submission('00000000-0000-0000-0000-00000000000a', 'twin-moons', 'x', 100, 1000) $$,
  'P0001', 'too many submissions', 'a second submission within 5 seconds is refused');

select is(
  (select (record_submission('00000000-0000-0000-0000-00000000000c', 'twin-moons', repeat('x', 100), 100, 950) ->> 'rank')::integer),
  1, 'the better player ranks first');
select is(
  (select count(*)::integer from submissions), 4, 'every accepted submission is stored');

reset role;
update submissions set created_at = now() - interval '1 minute';
set local role service_role;
select throws_ok(
  $$ select record_submission('00000000-0000-0000-0000-00000000000c', 'twin-moons', 'x', 100, 5000) $$,
  '23514', null, 'scores above 1000 are impossible');

-- ─── Leaderboard ─────────────────────────────────────────────────────────────
reset role;
set local role anon;

select results_eq(
  $$ select username, total_score from leaderboard order by total_score desc $$,
  $$ values ('sara'::text, 950), ('amr-elshabrawy'::text, 900) $$,
  'the leaderboard sums each player''s best scores');
select is((select count(*)::integer from best_scores), 2, 'anyone can read best scores');
select is((select count(*)::integer from profiles), 3, 'anyone can read profiles');
select is((select count(*)::integer from submissions), 0, 'visitors cannot read anyone''s code');

-- ─── Players cannot write scores themselves ──────────────────────────────────
select throws_ok(
  $$ select record_submission('00000000-0000-0000-0000-00000000000a', 'twin-moons', 'x', 100, 1000) $$,
  '42501', null, 'visitors cannot call record_submission');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select throws_ok(
  $$ select record_submission('00000000-0000-0000-0000-00000000000a', 'twin-moons', 'x', 100, 1000) $$,
  '42501', null, 'signed-in players cannot call record_submission');
select throws_ok(
  $$ insert into best_scores (user_id, challenge_slug, submission_id, score, chars, accuracy, achieved_at)
     values ('00000000-0000-0000-0000-00000000000a', 'the-hexagon', 1, 1000, 1, 100, now()) $$,
  '42501', null, 'players cannot insert a best score');
select throws_ok(
  $$ insert into submissions (user_id, challenge_slug, code, chars, accuracy, score)
     values ('00000000-0000-0000-0000-00000000000a', 'the-hexagon', 'x', 1, 100, 1000) $$,
  '42501', null, 'players cannot insert a submission');
select throws_ok(
  $$ update best_scores set score = 1000 $$,
  '42501', null, 'players cannot change scores');
select is((select count(*)::integer from submissions), 3, 'players see their own submissions');
select is(
  (select count(*)::integer from submissions where user_id <> '00000000-0000-0000-0000-00000000000a'), 0,
  'but nobody else''s');

select * from finish();
rollback;
