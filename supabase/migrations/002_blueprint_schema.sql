-- ─── Blueprints ───────────────────────────────────────────────────────────────

create table blueprints (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  story_intent text not null check (story_intent in ('memory','research','discovery','data_viz','editorial','travel')),
  bounding_context jsonb not null default '{}',
  metadata jsonb not null default '{"is_public": false, "tags": []}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Locations ────────────────────────────────────────────────────────────────

create table locations (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references blueprints(id) on delete cascade,
  name text not null,
  coordinates geometry(Point, 4326) not null,
  category text[] not null default '{}',
  timestamp timestamptz,
  notes text not null default '',
  source_type text not null default 'self' check (source_type in ('ai','friend','influencer','editorial','self','dataset')),
  source_id text,
  source_name text,
  source_url text,
  confidence numeric(3,2),
  created_at timestamptz not null default now()
);

-- Spatial index — non-negotiable for viewport bounding box queries
create index locations_coordinates_gist on locations using gist(coordinates);
create index locations_blueprint_id_idx on locations(blueprint_id);

-- ─── Photos ───────────────────────────────────────────────────────────────────

create table photos (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  storage_url text not null,
  exif_lat numeric(10,7),
  exif_lng numeric(10,7),
  exif_timestamp timestamptz,
  exif_bearing numeric(5,2),
  caption text,
  created_at timestamptz not null default now()
);

create index photos_location_id_idx on photos(location_id);

-- ─── Quantitative Values ──────────────────────────────────────────────────────

create table quantitative_values (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  key text not null,
  value numeric not null,
  unique(location_id, key)
);

-- ─── Relationships ────────────────────────────────────────────────────────────

create table relationships (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references blueprints(id) on delete cascade,
  from_location_id uuid not null references locations(id) on delete cascade,
  to_location_id uuid not null references locations(id) on delete cascade,
  relationship_type text not null
);

-- ─── Artifacts ────────────────────────────────────────────────────────────────

create table artifacts (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references blueprints(id) on delete cascade,
  artifact_type text not null check (artifact_type in ('memory_map','discovery_guide','data_cartography','wilderness','cinematic','living_dataset','trip_itinerary')),
  preset_id uuid,
  config_overrides jsonb,
  created_at timestamptz not null default now()
);

create index artifacts_blueprint_id_idx on artifacts(blueprint_id);

-- ─── Collaborators ────────────────────────────────────────────────────────────

create table collaborators (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references blueprints(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','editor','viewer')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique(blueprint_id, user_id)
);

-- ─── Source Attributions ──────────────────────────────────────────────────────

create table source_attributions (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  type text not null check (type in ('ai','friend','influencer','editorial','self','dataset')),
  source_id text,
  source_name text,
  source_url text,
  confidence numeric(3,2),
  created_at timestamptz not null default now()
);

-- ─── Living Dataset Configs ───────────────────────────────────────────────────

create table living_dataset_configs (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references blueprints(id) on delete cascade,
  scraper_config jsonb not null default '{}',
  cron_schedule text not null default '0 9 * * 1',
  last_run_at timestamptz,
  status text not null default 'active' check (status in ('active','paused','error')),
  created_at timestamptz not null default now()
);

-- ─── Preset Registry ──────────────────────────────────────────────────────────

create table preset_registry (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  artifact_type text not null,
  mapbox_style_url text not null,
  decklgl_config jsonb not null default '{}',
  atmosphere_config jsonb not null default '{}',
  typography_system jsonb not null default '{}',
  post_processing jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger blueprints_updated_at
  before update on blueprints
  for each row execute procedure handle_updated_at();
