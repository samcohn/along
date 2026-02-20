-- Add enrichment JSONB column to locations (for Google Places data)
alter table locations add column if not exists enrichment jsonb not null default '{}';

-- Add title column shortcut to blueprints for easier querying
-- (title also lives in metadata->title but this makes sorting/searching easier)
alter table blueprints add column if not exists title text;

-- Allow locations to accept a client-provided UUID (already is uuid pk, just confirming upsert works)
-- The upsert in the API uses onConflict: 'id' which requires the id to be the PK — already true.
