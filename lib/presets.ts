import type { AestheticPreset, ArtifactType } from '@/types/blueprint'

// ─── Preset Registry ──────────────────────────────────────────────────────────
// Each preset is a complete rendering environment. The map style, atmosphere,
// fog, terrain, post-processing, and typography are all specified here.
// MapCanvas reads the active preset and applies every layer.

export const PRESETS: Record<ArtifactType, AestheticPreset> = {

  discovery_guide: {
    id: 'discovery_guide_v1',
    name: 'Discovery Guide',
    artifact_type: 'discovery_guide',
    mapbox_style_url: 'mapbox://styles/mapbox/light-v11',
    decklgl_config: {
      marker_style: 'editorial',
      marker_color: '#1a1a1a',
      marker_size: 32,
    },
    atmosphere_config: {
      sky_type: 'clear',
      fog_density: 0,
      sun_angle: 45,
    },
    typography_system: {
      heading_font: 'Inter',
      body_font: 'Inter',
      heading_size: '18px',
      body_size: '13px',
      color: '#1a1a1a',
    },
    post_processing: {
      vignette: 0,
      grain: 0,
      saturation: 1,
    },
  },

  memory_map: {
    id: 'memory_map_v1',
    name: 'Memory Map',
    artifact_type: 'memory_map',
    mapbox_style_url: 'mapbox://styles/mapbox/light-v11',
    decklgl_config: {
      marker_style: 'polaroid',
      marker_color: '#c8956c',
      marker_size: 36,
    },
    atmosphere_config: {
      sky_type: 'dusk',
      fog_density: 0.15,
      sun_angle: 20,
    },
    typography_system: {
      heading_font: 'Georgia',
      body_font: 'Georgia',
      heading_size: '20px',
      body_size: '14px',
      color: '#3d2b1f',
    },
    post_processing: {
      vignette: 0.35,
      grain: 0.12,
      saturation: 0.85,
      color_grade: 'warm',
    },
  },

  trip_itinerary: {
    id: 'trip_itinerary_v1',
    name: 'Trip Itinerary',
    artifact_type: 'trip_itinerary',
    mapbox_style_url: 'mapbox://styles/mapbox/streets-v12',
    decklgl_config: {
      marker_style: 'numbered',
      marker_color: '#2563eb',
      marker_size: 34,
      show_route: true,
    },
    atmosphere_config: {
      sky_type: 'clear',
      fog_density: 0,
      sun_angle: 60,
    },
    typography_system: {
      heading_font: 'Inter',
      body_font: 'Inter',
      heading_size: '16px',
      body_size: '12px',
      color: '#1e3a5f',
    },
    post_processing: {
      vignette: 0,
      grain: 0,
      saturation: 1.05,
    },
  },

  wilderness: {
    id: 'wilderness_v1',
    name: 'Wilderness',
    artifact_type: 'wilderness',
    mapbox_style_url: 'mapbox://styles/mapbox/outdoors-v12',
    decklgl_config: {
      marker_style: 'terrain',
      marker_color: '#2d5a27',
      marker_size: 30,
    },
    atmosphere_config: {
      sky_type: 'overcast',
      fog_density: 0.3,
      sun_angle: 30,
    },
    typography_system: {
      heading_font: 'Georgia',
      body_font: 'Georgia',
      heading_size: '18px',
      body_size: '13px',
      color: '#2d3d1e',
    },
    post_processing: {
      vignette: 0.2,
      grain: 0.08,
      saturation: 0.9,
      color_grade: 'cool',
    },
  },

  cinematic: {
    id: 'cinematic_v1',
    name: 'Cinematic',
    artifact_type: 'cinematic',
    mapbox_style_url: 'mapbox://styles/mapbox/dark-v11',
    decklgl_config: {
      marker_style: 'title_card',
      marker_color: '#e8d5a3',
      marker_size: 38,
    },
    atmosphere_config: {
      sky_type: 'night',
      fog_density: 0.4,
      sun_angle: 5,
    },
    typography_system: {
      heading_font: 'Georgia',
      body_font: 'Georgia',
      heading_size: '22px',
      body_size: '14px',
      color: '#e8d5a3',
    },
    post_processing: {
      vignette: 0.55,
      grain: 0.22,
      saturation: 0.7,
      color_grade: 'cinematic',
    },
  },

  data_cartography: {
    id: 'data_cartography_v1',
    name: 'Data Cartography',
    artifact_type: 'data_cartography',
    mapbox_style_url: 'mapbox://styles/mapbox/dark-v11',
    decklgl_config: {
      marker_style: 'data_point',
      marker_color: '#00d4ff',
      marker_size: 24,
    },
    atmosphere_config: {
      sky_type: 'night',
      fog_density: 0,
      sun_angle: 0,
    },
    typography_system: {
      heading_font: 'Inter',
      body_font: 'Inter',
      heading_size: '14px',
      body_size: '11px',
      color: '#00d4ff',
    },
    post_processing: {
      vignette: 0.1,
      grain: 0,
      saturation: 1.2,
      color_grade: 'cold',
    },
  },

  living_dataset: {
    id: 'living_dataset_v1',
    name: 'Living Dataset',
    artifact_type: 'living_dataset',
    mapbox_style_url: 'mapbox://styles/mapbox/dark-v11',
    decklgl_config: {
      marker_style: 'pulse',
      marker_color: '#10b981',
      marker_size: 20,
    },
    atmosphere_config: {
      sky_type: 'night',
      fog_density: 0,
      sun_angle: 0,
    },
    typography_system: {
      heading_font: 'Inter',
      body_font: 'Inter',
      heading_size: '13px',
      body_size: '11px',
      color: '#10b981',
    },
    post_processing: {
      vignette: 0.05,
      grain: 0,
      saturation: 1.15,
      color_grade: 'cold',
    },
  },
}

// Human-readable labels and descriptions for the switcher UI
export const ARTIFACT_META: Record<ArtifactType, { label: string; description: string; emoji: string }> = {
  discovery_guide:  { label: 'Discovery Guide',   description: 'Clean editorial, shareable city guide',        emoji: '🗺' },
  memory_map:       { label: 'Memory Map',         description: 'Photo-forward, warm and personal',             emoji: '📷' },
  trip_itinerary:   { label: 'Trip Itinerary',     description: 'Day-by-day route with timing',                 emoji: '✈️' },
  wilderness:       { label: 'Wilderness',         description: 'Terrain-first, field guide feel',              emoji: '🌲' },
  cinematic:        { label: 'Cinematic',          description: 'Moody, film-grain, editorial dark',            emoji: '🎬' },
  data_cartography: { label: 'Data Cartography',  description: 'Dark base, cold precision, data-first',        emoji: '📊' },
  living_dataset:   { label: 'Living Dataset',     description: 'Real-time feed, auto-updating markers',        emoji: '⚡' },
}

// CSS filter strings per color grade
export const COLOR_GRADES: Record<string, string> = {
  warm:      'sepia(0.18) saturate(0.88) brightness(0.97)',
  cool:      'hue-rotate(10deg) saturate(0.85) brightness(0.96)',
  cinematic: 'sepia(0.25) contrast(1.08) saturate(0.72) brightness(0.92)',
  cold:      'hue-rotate(185deg) saturate(1.1) brightness(0.95)',
}
