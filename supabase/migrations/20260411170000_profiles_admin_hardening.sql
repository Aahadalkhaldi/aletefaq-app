-- Security hardening for public.profiles
-- Goal: only admin can change sensitive authorization fields such as role/status/rejection_reason.

create schema if not exists private;

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.status = 'approved'
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_admin_update_any"
on public.profiles
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin_user() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'Only admins can change profile authorization fields';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_sensitive_fields on public.profiles;
create trigger trg_protect_profile_sensitive_fields
before update on public.profiles
for each row
execute function public.protect_profile_sensitive_fields();
