-- Undoes 040: removes the `kind` column from krathong_floats. Deploy the app version
-- from before 040 first (it never reads or writes `kind`), or dropping the column will
-- break the lantern shop / sky animation. Krathong floating is unaffected either way.
begin;
alter table public.krathong_floats drop column if exists kind;
commit;
