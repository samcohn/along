// ─── Core Blueprint Types ─────────────────────────────────────────────────────

export type StoryIntent =
  | 'memory'
  | 'research'
  | 'discovery'
  | 'data_viz'
  | 'editorial'
  | 'travel'

export type SourceType =
  | 'ai'
  | 'friend'
  | 'influencer'
  | 'editorial'
  | 'self'
  | 'dataset'

export type ArtifactType =
  | 'memory_map'
  | 'discovery_guide'
  | 'data_cartography'
  | 'wilderness'
  | 'cinematic'
  | 'living_dataset'
  | 'trip_itinerary'

export interface BoundingContext {
  center: { lat: number; lng: number }
  zoom: number
  bbox?: [number, number, number, number] // [west, south, east, north]
}

export interface SourceAttribution {
  type: SourceType
  source_id?: string
  source_name?: string
  source_url?: string
  confidence?: number
}

export interface Photo {
  url: string
  exif: {
    lat?: number
    lng?: number
    timestamp?: string
    bearing?: number
  }
  caption?: string
}

export interface PlaceEnrichment {
  google_place_id?: string
  name?: string
  formatted_address?: string
  phone?: string
  website?: string
  hours?: string[]
  rating?: number
  price_level?: number
  types?: string[]
  photos?: string[]
}

export interface Location {
  id: string
  coordinates: { lat: number; lng: number; altitude?: number }
  name: string
  category: string[]
  timestamp?: string
  photos: Photo[]
  notes: string
  quantitative_values: Record<string, number>
  source: SourceAttribution
  relationships: string[]
  enrichment: PlaceEnrichment
}

export interface Relationship {
  id: string
  from_location_id: string
  to_location_id: string
  relationship_type: string
}

export interface Collaborator {
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  invited_at: string
  accepted_at?: string
}

export interface ArtifactRef {
  id: string
  artifact_type: ArtifactType
  preset_id: string
  config_overrides?: Record<string, unknown>
}

export interface BlueprintMeta {
  title?: string
  description?: string
  is_public: boolean
  tags: string[]
}

export interface Blueprint {
  id: string
  created_at: string
  updated_at: string
  owner_id: string
  collaborators: Collaborator[]
  story_intent: StoryIntent
  bounding_context: BoundingContext
  locations: Location[]
  relationships: Relationship[]
  artifacts: ArtifactRef[]
  metadata: BlueprintMeta
}

// ─── Aesthetic Preset ─────────────────────────────────────────────────────────

export interface TypographySystem {
  heading_font: string
  body_font: string
  heading_size: string
  body_size: string
  color: string
}

export interface AtmosphereConfig {
  sky_type: 'dawn' | 'dusk' | 'overcast' | 'night' | 'clear'
  fog_density: number
  sun_angle?: number
}

export interface PostProcessing {
  vignette: number
  grain: number
  saturation: number
  color_grade?: string
}

export interface AestheticPreset {
  id: string
  name: string
  artifact_type: ArtifactType
  mapbox_style_url: string
  decklgl_config: Record<string, unknown>
  atmosphere_config: AtmosphereConfig
  typography_system: TypographySystem
  post_processing: PostProcessing
}

// ─── Living Dataset ───────────────────────────────────────────────────────────

export interface LivingDatasetConfig {
  id: string
  blueprint_id: string
  scraper_config: {
    sources: string[]
    query: string
    filters: Record<string, unknown>
  }
  cron_schedule: string
  last_run_at?: string
  status: 'active' | 'paused' | 'error'
}
