-- ─── Connections: universal ledger for all booking integrations ────────────────
-- Stores flight offers, restaurant reservations, hotel options, calendar exports.
-- Future: voice_call connections for autonomous restaurant booking via phone agent.
-- Future: 'watching' status for price-watch background jobs (Inngest).

create table if not exists connections (
  id               uuid primary key default gen_random_uuid(),
  blueprint_id     uuid not null references blueprints(id) on delete cascade,
  location_id      uuid references locations(id) on delete set null,
  connection_type  text not null check (connection_type in (
    'flight', 'hotel', 'restaurant', 'calendar', 'transport', 'voice_call'
  )),
  status           text not null default 'suggested' check (status in (
    'suggested', 'searching', 'available', 'watching', 'calling', 'booked', 'unavailable'
  )),
  provider         text,          -- 'duffel', 'resy', 'google_calendar', 'voice_agent', etc.
  provider_ref_id  text,          -- Duffel offer ID, Resy reservation ID, etc.
  data             jsonb not null default '{}',  -- full offer / booking payload
  deep_link_url    text,          -- handoff URL for user to complete booking
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

-- Index for fast lookup by blueprint
create index connections_blueprint_id_idx on connections (blueprint_id);
create index connections_location_id_idx on connections (location_id);
create index connections_type_status_idx on connections (connection_type, status);

-- updated_at auto-maintenance
create or replace function update_connections_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger connections_updated_at
  before update on connections
  for each row execute function update_connections_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────────
alter table connections enable row level security;

-- Users can only see connections belonging to their own blueprints
create policy "connections: owner select"
  on connections for select
  using (
    blueprint_id in (
      select id from blueprints where owner_id = auth.uid()
    )
  );

create policy "connections: owner insert"
  on connections for insert
  with check (
    blueprint_id in (
      select id from blueprints where owner_id = auth.uid()
    )
  );

create policy "connections: owner update"
  on connections for update
  using (
    blueprint_id in (
      select id from blueprints where owner_id = auth.uid()
    )
  );

create policy "connections: owner delete"
  on connections for delete
  using (
    blueprint_id in (
      select id from blueprints where owner_id = auth.uid()
    )
  );

-- Service role bypass (for server-side API routes)
create policy "connections: service role all"
  on connections for all
  using (auth.role() = 'service_role');
