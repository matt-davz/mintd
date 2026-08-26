-- Stores PSA price estimate + recent sales per cert (append-only, same pattern as population_snapshots)
create table public.psa_price_snapshots (
  id            uuid        primary key default gen_random_uuid(),
  cert_id       uuid        not null references public.certifications(id) on delete cascade,
  psa_estimate  text,
  recent_sales  jsonb,
  synced_at     timestamptz not null default now()
);

create index idx_psa_price_cert_id   on public.psa_price_snapshots(cert_id);
create index idx_psa_price_synced_at on public.psa_price_snapshots(synced_at desc);

alter table public.psa_price_snapshots enable row level security;

create policy "anon can read psa_price_snapshots"
  on public.psa_price_snapshots for select to anon using (true);

-- Admin uses anon key (Clerk handles auth at app level), so allow anon inserts
create policy "anon can insert psa_price_snapshots"
  on public.psa_price_snapshots for insert to anon with check (true);

create policy "service can manage psa_price_snapshots"
  on public.psa_price_snapshots for all to service_role using (true);

-- Most recent price snapshot per cert — always query this, not the raw table
create or replace view public.latest_psa_price as
select distinct on (cert_id)
  id, cert_id, psa_estimate, recent_sales, synced_at
from public.psa_price_snapshots
order by cert_id, synced_at desc;

grant select on public.latest_psa_price to anon, authenticated;
