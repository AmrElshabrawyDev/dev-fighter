-- Hint tests (pgTAP): npm run test:db
begin;
select plan(11);

delete from auth.users;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'h1@example.com', '{"user_name": "hinter"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'h2@example.com', '{"user_name": "other"}');

set local role service_role;

select throws_ok(
  $$ select unlock_hint('00000000-0000-0000-0000-0000000000a1', 'leaf', 1) $$,
  'P0001', 'hints open in order', 'the second hint can''t open before the first');
select is(unlock_hint('00000000-0000-0000-0000-0000000000a1', 'leaf', 0), 1, 'the first hint opens');
select is(unlock_hint('00000000-0000-0000-0000-0000000000a1', 'leaf', 0), 1, 'opening it again changes nothing');
select is(unlock_hint('00000000-0000-0000-0000-0000000000a1', 'leaf', 1), 2, 'then the second');
select is(unlock_hint('00000000-0000-0000-0000-0000000000a1', 'diamond', 0), 1, 'hints are counted per challenge');

select is(
  (select (record_submission('00000000-0000-0000-0000-0000000000a1', 'leaf', 'x', 100, 640) ->> 'hintsUsed')::integer),
  2, 'a submission notes how many hints were open');
select is((select hints_used::integer from best_scores where challenge_slug = 'leaf'), 2, 'so does the best score');

-- players can see their own hints, and can't open hints for free
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated"}', true);

select is((select count(*)::integer from hint_unlocks), 0, 'nobody sees another player''s hints');
select throws_ok(
  $$ select unlock_hint('00000000-0000-0000-0000-0000000000a2', 'leaf', 0) $$,
  '42501', null, 'players can''t call unlock_hint themselves');
select throws_ok(
  $$ delete from hint_unlocks $$,
  '42501', null, 'players can''t delete opened hints (to dodge the discount)');

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);
select is((select count(*)::integer from hint_unlocks), 3, 'players see their own opened hints');

select * from finish();
rollback;
