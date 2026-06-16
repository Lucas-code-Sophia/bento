create extension if not exists pgcrypto;

create table if not exists public.tribune_reservations (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  place_code text not null,
  place_label text,
  level text not null check (
    level in (
      'presidentielle',
      'vip',
      'categorie_1',
      'tabouret_haut',
      'tabouret_bas'
    )
  ),
  customer_name text not null,
  customer_phone text,
  party_size integer not null default 1 check (party_size > 0),
  notes text,
  status text not null default 'confirmed' check (
    status in ('confirmed', 'cancelled', 'completed', 'no_show')
  ),
  reserved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tribune_reservations_active_place_unique
  on public.tribune_reservations (match_id, place_code)
  where status = 'confirmed';

create index if not exists tribune_reservations_match_status_idx
  on public.tribune_reservations (match_id, status);

create index if not exists tribune_reservations_customer_phone_idx
  on public.tribune_reservations (customer_phone)
  where customer_phone is not null;

create or replace function public.set_tribune_reservations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tribune_reservations_updated_at
  on public.tribune_reservations;

create trigger set_tribune_reservations_updated_at
  before update on public.tribune_reservations
  for each row
  execute function public.set_tribune_reservations_updated_at();

alter table public.tribune_reservations enable row level security;

grant select, insert, update on public.tribune_reservations to anon, authenticated;

drop policy if exists "Public can read confirmed tribune reservations"
  on public.tribune_reservations;

create policy "Public can read confirmed tribune reservations"
  on public.tribune_reservations
  for select
  using (status = 'confirmed');

drop policy if exists "Authenticated users can manage tribune reservations"
  on public.tribune_reservations;

drop policy if exists "Tribune admins can manage tribune reservations"
  on public.tribune_reservations;

drop policy if exists "Public can create tribune reservations"
  on public.tribune_reservations;

create policy "Public can create tribune reservations"
  on public.tribune_reservations
  for insert
  to anon, authenticated
  with check (status = 'confirmed');

drop policy if exists "Public can cancel tribune reservations"
  on public.tribune_reservations;

create policy "Public can cancel tribune reservations"
  on public.tribune_reservations
  for update
  to anon, authenticated
  using (status = 'confirmed')
  with check (status = 'cancelled');
