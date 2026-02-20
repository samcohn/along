-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Enable RLS on all tables and define access policies

alter table blueprints enable row level security;
alter table locations enable row level security;
alter table photos enable row level security;
alter table quantitative_values enable row level security;
alter table relationships enable row level security;
alter table artifacts enable row level security;
alter table collaborators enable row level security;
alter table source_attributions enable row level security;
alter table living_dataset_configs enable row level security;
alter table preset_registry enable row level security;

-- ─── Blueprint policies ───────────────────────────────────────────────────────

-- Owner can do everything
create policy "Owner full access" on blueprints
  for all using (owner_id = auth.uid());

-- Public blueprints are readable by anyone
create policy "Public blueprints are readable" on blueprints
  for select using ((metadata->>'is_public')::boolean = true);

-- Collaborators can read blueprints they're invited to
create policy "Collaborators can read" on blueprints
  for select using (
    exists (
      select 1 from collaborators
      where collaborators.blueprint_id = blueprints.id
        and collaborators.user_id = auth.uid()
        and collaborators.accepted_at is not null
    )
  );

-- Collaborators with editor role can update
create policy "Editors can update" on blueprints
  for update using (
    exists (
      select 1 from collaborators
      where collaborators.blueprint_id = blueprints.id
        and collaborators.user_id = auth.uid()
        and collaborators.role in ('owner', 'editor')
        and collaborators.accepted_at is not null
    )
  );

-- ─── Location policies ────────────────────────────────────────────────────────

-- Access mirrors blueprint access
create policy "Locations follow blueprint access" on locations
  for all using (
    exists (
      select 1 from blueprints
      where blueprints.id = locations.blueprint_id
        and (
          blueprints.owner_id = auth.uid()
          or (blueprints.metadata->>'is_public')::boolean = true
          or exists (
            select 1 from collaborators
            where collaborators.blueprint_id = blueprints.id
              and collaborators.user_id = auth.uid()
              and collaborators.accepted_at is not null
          )
        )
    )
  );

-- ─── Photos policy ────────────────────────────────────────────────────────────

create policy "Photos follow location access" on photos
  for all using (
    exists (
      select 1 from locations
      join blueprints on blueprints.id = locations.blueprint_id
      where locations.id = photos.location_id
        and (
          blueprints.owner_id = auth.uid()
          or (blueprints.metadata->>'is_public')::boolean = true
          or exists (
            select 1 from collaborators
            where collaborators.blueprint_id = blueprints.id
              and collaborators.user_id = auth.uid()
              and collaborators.accepted_at is not null
          )
        )
    )
  );

-- ─── Preset registry — readable by all authenticated users ───────────────────

create policy "Presets are readable by all" on preset_registry
  for select using (auth.uid() is not null);
