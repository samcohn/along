-- ─── Onboarding additions to taste_profiles ───────────────────────────────────
-- Tracks whether the user has completed the Cosmos-style image séance onboarding.
-- image_selections: the 3 image IDs chosen in Act 1 (for Act 4 Mirror replay).

alter table taste_profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists image_selections jsonb not null default '[]';

-- index for fast onboarding gate check
create index if not exists taste_profiles_onboarding_idx
  on taste_profiles (user_id, onboarding_completed);
