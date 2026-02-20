# ALONG
## Platform Architecture & Implementation Blueprint
### Full-Stack Technical Specification | v1.0

---

## Platform Vision

A map is not just a navigation tool — it is a storytelling medium, a data canvas, and a memory container. This platform treats geographic coordinates as a universal schema that any kind of data, any visual language, and any human story can be rendered on top of. The same underlying blueprint that holds a startup fundraising dataset, a personal photo archive from Tokyo, or a political polling map will render into radically different visual artifacts — each appropriate to the occasion, each built from the same engine.

---

## 1. Core Architecture: The Two-Layer System

Everything in this platform resolves to a single architectural principle: the complete separation of data from presentation. This is not a styling decision — it is a foundational data architecture decision that enables the entire vision.

### 1.1 Layer One: The Blueprint

The Blueprint is the canonical, persistent data object for every map a user creates. It is not a visual thing. It is a structured schema that normalizes all location data, regardless of how it was created or what it will become. Think of it as the source of truth — the single object that holds everything the platform knows about a particular map.

When a user uploads photos, prompts the AI, imports a CSV, or scrapes a dataset, everything resolves into this same schema. The Blueprint is the engine of portability and reusability — something PamPam completely lacks. Their maps are disposable outputs. Blueprints are living, extensible data objects.

**Blueprint Schema (TypeScript)**

```typescript
interface Blueprint {
  id: string;
  created_at: timestamp;
  updated_at: timestamp;
  owner_id: string;
  collaborators: Collaborator[];
  story_intent: 'memory' | 'research' | 'discovery' | 'data_viz' | 'editorial' | 'travel';
  bounding_context: BoundingContext;
  locations: Location[];
  relationships: Relationship[];
  artifacts: ArtifactRef[];
  metadata: BlueprintMeta;
}

interface Location {
  id: string;
  coordinates: { lat: number; lng: number; altitude?: number };
  name: string;
  category: string[];
  timestamp?: timestamp; // When the memory/event occurred
  photos: Photo[]; // With EXIF metadata preserved
  notes: string;
  quantitative_values: Record<string, number>; // For data viz artifacts
  source: SourceAttribution; // WHO recommended/surfaced this
  relationships: string[]; // IDs of connected locations
  enrichment: PlaceEnrichment; // From Google Places API
}

interface SourceAttribution {
  type: 'ai' | 'friend' | 'influencer' | 'editorial' | 'self' | 'dataset';
  source_id?: string;
  source_name?: string;
  source_url?: string;
  confidence?: number;
}

interface Photo {
  url: string;
  exif: { lat?: number; lng?: number; timestamp?: string; bearing?: number; };
  caption?: string;
}
```

### 1.2 Layer Two: The Artifact

An Artifact is a rendering of a Blueprint through a particular visual lens. The same Blueprint that holds a month in Tokyo can render as a warm photo-memory collage, a clean minimalist pin list for sharing, a timeline view, or a data density map. The data does not change — the visual contract on top of it does.

Each Artifact type is a rendering specification. It declares which Blueprint fields it cares about, how to visually express them, what map style to use, what rendering engine to invoke, and what interaction patterns to enable. Users can generate multiple Artifact types from a single Blueprint and switch between them fluidly.

**Key Principle:** The Blueprint is permanent and portable. Artifacts are ephemeral, generative, and exchangeable. A user should never have to re-enter their data to tell the same story in a different visual language.

**Artifact Type Registry (V1 Core)**

| Artifact Type | Primary Use Case | Visual Language |
|---|---|---|
| Memory Map | Personal photo archives, trips with people | Photo-forward, warm palette, polaroid markers, de-labeled base, collage feel |
| Discovery Guide | Curated city guides, recommendation lists | Clean, editorial, source badges on pins, minimal base, shareable format |
| Data Cartography | Polling data, demographics, market analysis | Dark base, choropleth/gradient layers, cold precise typography, legend-first |
| Wilderness / Nature | Hiking, national parks, terrain-heavy areas | 3D terrain, atmospheric haze, illustrated canopy, serif typography, field guide feel |
| Cinematic / Editorial | Film audience targeting, cultural mapping | Full-bleed, film grain shader, title card marker style, mood color grading |
| Living Dataset | Startup maps, real-time feeds, hosted embeds | Dynamic, filter-first, data table companion, auto-updating indicators |
| Trip / Itinerary | Travel planning, day-by-day sequencing | Route lines in brand style, day grouping, time estimates, companion list panel |

---

## 2. Creation Modes: The Three Entry Points

Users access the platform through three distinct creation modes. Each is a different population pathway for the Blueprint. Crucially, all three resolve into the same underlying schema — modes are entry points, not containers. A living dataset can have memory photos layered on top. A trip itinerary can become a living map. Modes are the beginning, not the boundary.

### Mode 1: Build with AI / Research Agent

The user describes what they want mapped. The platform goes and builds the dataset. This is the highest-leverage and most novel entry point — it has no true equivalent in the market today.

**Sub-Mode A: Living Dataset (Hosted, Continuously Updated)**

The user configures a data pipeline with a natural language interface. The AI/scraper system runs on a schedule, pulls from defined sources, resolves results to coordinates, and updates the Blueprint automatically. The resulting map is a publication — something viewers subscribe to, not just a shared link.

Example prompt: 'Show me all Series A climate tech startups that raised in the last 90 days, update weekly. Sources: Crunchbase, TechCrunch, SEC EDGAR.'

- User configures sources, update cadence, and filters via a natural language form
- Backend scraper agent (Playwright + Firecrawl or equivalent) executes on schedule
- Raw results are geocoded and normalized into Blueprint Location nodes with full source attribution
- The map is hosted at a persistent URL and can be embedded via iframe
- Viewer-facing interface includes filter controls, search, and data table companion
- Owner receives update diffs and can approve, reject, or manually override entries

**Sub-Mode B: Research-Built Static Dataset**

Bounded, one-time research. User describes a collection ('best jazz bars in New Orleans', 'all Michelin restaurants in Tokyo under ¥8000') and the agent builds it once. User refines, then moves to artifact selection.

- Single scrape-and-geocode pipeline execution
- Results reviewed and edited in a card-based triage UI before committing to Blueprint
- Source citations attached to every result entry
- User can add, remove, and annotate before artifact generation

### Mode 2: Trip / Itinerary Builder

The user is constructing a sequence, not just a collection. The data model is temporal and ordered. AI is present as a co-planner, not a researcher. Google Places and Directions APIs are most active in this mode.

- Two entry paths: 'I know where I'm going' (structured input) vs 'I have a destination' (AI scaffolds the full itinerary)
- Day-by-day structure: locations grouped by day, further grouped by morning/afternoon/evening
- Routing: Google Directions API called with ordered waypoints, returns polylines rendered in artifact visual style (not Google blue)
- Time estimates between stops surfaced in companion list panel
- AI co-planner suggests next stops, fills schedule gaps, estimates durations
- Each suggestion carries source attribution — friend recommendation, editorial, influencer, platform AI
- Collaborative: multiple users can plan together in real-time (Liveblocks or Supabase Realtime)
- Output artifact: Trip Map or Discovery Guide, shareable as a formatted guide document

### Mode 3: Upload & Render

The user has existing data. The platform reads it, extracts geographic and temporal structure automatically, fills the Blueprint schema, and prompts the user to fill gaps. The lowest barrier to entry — users start from something that already has meaning.

**Supported Upload Formats:**
- Photos (JPEG/HEIC with EXIF GPS extraction)
- GPX files (hiking/running tracks from Garmin, Strava)
- KML/KMZ (Google Earth exports)
- GeoJSON
- Google Photos import (OAuth, preserves coordinates)
- iCloud Photos (where API permits)
- CSV (with column mapping UI)
- Google Sheets (live link or one-time import)
- Notion database (direct import)
- Airtable base
- Google My Maps import
- Paste from clipboard (AI parses any format)

**EXIF Processing Pipeline:**
- Client-side EXIF extraction using exifr.js before upload — no server round-trip required for metadata
- Auto-place photos on Blueprint at extracted coordinates with extracted timestamp
- Cluster detection: photos within 50m and 30 minutes are grouped as a 'moment'
- Graceful fallback: photos with no EXIF GPS prompt user to drag-drop onto map or confirm AI-guessed location
- EXIF stripping warning: notify users when photos appear to have had metadata removed (likely from social sharing)
- Magic experience: 'Upload your camera roll and we'll build the map' — the geographic and temporal structure emerges automatically

---

## 3. Mapping Infrastructure

The mapping infrastructure uses a hybrid architecture: Mapbox GL JS for map tile rendering and 3D terrain, combined with Google APIs for place data and routing. Custom visual layers are built on top using deck.gl for WebGL-accelerated rendering.

### 3.1 The Hybrid Stack

| Technology | Role | Notes |
|---|---|---|
| Mapbox GL JS v3 | Base map tiles, 3D terrain, camera | Custom styled per artifact type in Mapbox Studio. Terrain elevation via DEM raster source. Atmosphere and sky layer for nature artifacts. |
| Google Places API | Place search, POI enrichment | Autocomplete, hours, photos, ratings, price level. Enriches Blueprint nodes automatically on addition. |
| Google Geocoding API | Text to coordinates | Resolves addresses, place names, fuzzy descriptions to lat/lng. Fallback: Mapbox Geocoding API. |
| Google Directions API | Routing between waypoints | Returns polylines for trip sequences. Rendered in artifact visual style on Mapbox canvas — not Google's UI. |
| deck.gl | Custom WebGL visual layers | Sits on top of Mapbox. Renders custom markers, data layers, particle effects, photo sprites, animated overlays. |
| exifr.js | Client-side EXIF extraction | Extracts GPS, timestamp, bearing from uploaded photos before server upload. |
| Mapbox Studio | Custom map styles | One base style per core artifact type. Programmatically overridden at render time based on user visual selection. |

### 3.2 3D Terrain & Atmospheric Rendering

For nature-oriented and terrain-heavy artifacts, the platform activates Mapbox GL JS v3's full 3D capabilities.

**Terrain Configuration:**
- DEM source: Mapbox Terrain-DEM v1 raster tile source
- Exaggeration factor: configurable per artifact (1.2x for subtle, 2.0x for dramatic mountain artifacts)
- Tree/canopy layer: custom illustrated vector tiles or satellite-derived canopy overlay for wilderness feel
- Water: animated shimmer via custom deck.gl shader — subtle vertex displacement at zoom levels 12+

**Atmospheric & Lighting System:**
- Mapbox sky layer: configurable gradient — dawn, dusk, overcast, night — each mapped to an artifact mood
- Sun position: calculated from real coordinates and time-of-day metadata in the Blueprint
- Fog density: heavier fog for moody/cinematic artifacts, clear for data/editorial
- Post-processing: canvas-level color grading via CSS filter or WebGL shader (vignette, grain, saturation)

**V1 vs V2 3D Scope:**
- V1 (Launch): Mapbox terrain extrusion (DEM-based), atmospheric sky layer, fog and sun angle configuration, canvas-level post-processing (grain, vignette, color grade), deck.gl custom marker rendering, animated water via simple shader
- V2 (Post-Launch): Custom illustrated tile sets (Stamen-style), complex particle systems (snow, rain, fireflies), real-time weather layer integration, globe projection for world-scale maps, CesiumJS for photorealistic 3D (separate renderer), true 3D building extrusion for urban artifacts

### 3.3 The Visual Reference Library & Aesthetic Selection

Users select a visual language from a curated library of aesthetic presets — not color pickers or theme dropdowns, but fully realized visual worlds. Each preset is a complete rendering environment with a named identity.

The selection UI presents these as full-bleed map previews — the user sees what their map will actually look like, not an abstract palette. The platform may also suggest a preset based on story_intent in the Blueprint.

**Aesthetic Preset Architecture:**
- Each preset is a JSON spec: Mapbox style URL + deck.gl layer config + atmosphere settings + typography system + post-processing values
- Presets stored in a registry and versioned — users' maps always render on a pinned preset version
- Users can fork a preset and customize within defined bounds (no raw code — slider-based parameter tuning)
- Visual reference library is curated editorially — new presets added as the design corpus grows
- Inspiration drawn from: printed atlases, film title sequences, scientific journals, museum exhibit graphics, game world maps — not other map apps

---

## 4. Interface Architecture

The interface is built on a single principle: the map is always primary. Every UI element either serves the map or retreats when it is not needed. The companion UI is context-aware, appearing in the right form for the task at hand, and never fully occludes the map canvas.

### 4.1 The Four Interface States

- **State 1: Discovery Mode** — Full-bleed map, minimal chrome. A single floating prompt/search bar — the only persistent element. No list, no panels, no sidebar — just map and prompt.
- **State 2: Building Mode** — Bottom drawer (mobile) or right panel (desktop) slides in. Live-linked to the map. List of Blueprint locations as cards — expandable, reorderable, swipe-to-remove.
- **State 3: AI Suggestion Mode** — The AI Suggestion Tray. Suggestions are not a chat interface. They are spatial, card-based, and provenance-first. Cards float at the edge of the map, each anchored to a pin position. Feels like Tinder for places — low friction, spatially grounded, source-transparent.
- **State 4: Artifact / Share Mode** — The Blueprint renders in the chosen visual language. The UI chrome largely disappears. Artifact switcher, share output, export options.

### 4.2 Navigation & Layout System

**Desktop (1024px+):**
- Map: full viewport, always behind all panels
- Right panel: 380px wide, slides in/out on demand — never covers full map width
- Suggestion tray: right edge, collapsible
- Prompt bar: top center, expands on focus
- Artifact mode: right panel collapses, floating action bar appears bottom center

**Mobile (< 768px):**
- Map: full viewport, always primary
- Bottom sheet: standard iOS/Android pattern — peek state (80px), half state (50vh), full state (90vh)
- Prompt bar: bottom of screen above sheet, always accessible
- Suggestion cards: horizontal scroll row above prompt bar
- No sidebar — everything is bottom-anchored

**Critical Design Constraint:** The map must always remain partially visible even when panels are open. Users should never feel like they are in a list app that happens to have a map.

---

## 5. AI & Agentic Systems

AI is present throughout the platform in four distinct roles.

### 5.1 The Research Agent (Mode 1)

**Architecture:**
- Orchestrator: Claude (claude-opus-4 or claude-sonnet-4 depending on task complexity)
- Web access: Firecrawl for structured scraping, Playwright for JavaScript-heavy sites
- Search: Tavily or Exa for initial source discovery
- Geocoding: Google Geocoding API
- Deduplication: embedding-based similarity check before inserting into Blueprint
- Source citation: every inserted Location node carries full provenance
- Human-in-the-loop: results surface in a triage UI before committing to Blueprint
- For living datasets: agent runs on cron schedule, diffs against existing Blueprint

**Scraper Pipeline Stages:**
1. Intent parsing: natural language to structured query
2. Source discovery: search for relevant pages, directories, databases
3. Extraction: scrape each source, extract location name, address, relevant metadata
4. Geocoding: resolve to lat/lng via Google Geocoding
5. Deduplication: embedding similarity against existing Blueprint entries
6. Attribution: attach full source provenance to each entry
7. Triage: surface batch to user for review before Blueprint commit

### 5.2 The Co-Planner (Mode 2)

Operates as a trip planning assistant. Suggestions are structured Blueprint entries, not prose responses. The interface is spatial and card-based, not chat.

- Input: current Blueprint state + user intent/destination
- Output: batch of suggested Location nodes with full attribution, ready to drop into Blueprint
- Uses Google Places API to enrich suggestions with hours, ratings, photos
- Timing intelligence: estimates time-at-location based on category + user preference history
- Gap detection: identifies schedule holes and suggests fills
- Source mixing: blends editorial (Eater, NYT Travel, Conde Nast), friend network, and AI-generated suggestions, always labeled

### 5.3 The Interpreter (Mode 3)

- Photo batch: clusters by EXIF proximity, suggests 'moments', names each cluster with AI
- CSV: maps arbitrary column names to Blueprint schema fields via AI
- GPX: converts track to a route artifact, identifies waypoints and rest stops
- Ambiguity UI: when interpretation is uncertain, surfaces a structured disambiguation card — not a free-text prompt

### 5.4 The Artifact Recommender

Reads the Blueprint and recommends the most appropriate artifact types for the data it contains. Runs automatically after Blueprint population. Users can always override — the recommendation is a starting point, not a gate.

---

## 6. Full Technology Stack

### 6.1 Frontend

| Technology | Role | Notes |
|---|---|---|
| Next.js 14+ (App Router) | Framework | Server components for fast initial load. Client components for interactive map. API routes for lightweight backend operations. |
| TypeScript | Language | Strict typing throughout. Blueprint schema defined as shared types. |
| Mapbox GL JS v3 | Map rendering engine | Base tiles, terrain, atmosphere, camera. Custom styles per artifact type. |
| deck.gl 9+ | WebGL visual layers | Custom markers, data layers, animations. Integrates with Mapbox via interleaved rendering. |
| React Query (TanStack) | Data fetching & caching | Blueprint fetching, live dataset polling, optimistic updates for co-editing. |
| Zustand | Client state | Map view state, active artifact type, UI panel state, suggestion tray contents. |
| Framer Motion | Animations | Panel slide transitions, suggestion card animations, artifact type switching. |
| Tailwind CSS | Styling | Utility-first. Design tokens for each artifact type's UI chrome color system. |
| exifr.js | EXIF extraction | Client-side photo metadata parsing. Zero server round-trip for GPS extraction. |
| Liveblocks | Real-time collaboration | Multiplayer Blueprint editing. Presence indicators. Conflict resolution. |

### 6.2 Backend

| Technology | Role | Notes |
|---|---|---|
| Supabase | Database + Auth + Storage | PostgreSQL with PostGIS extension. Row-level security for Blueprint access control. Storage for photo uploads. |
| PostGIS | Geographic queries | Spatial indexing on Location coordinates. Bounding box queries. Proximity search. Cluster detection. |
| Next.js API Routes | Lightweight API | Blueprint CRUD, geocoding proxy, Places API proxy (keeps API keys server-side). |
| Inngest | Background job orchestration | Research agent runs, living dataset cron jobs, scraper pipeline execution, EXIF batch processing. |
| Anthropic API | AI orchestration | claude-sonnet-4 for research agent, co-planner, artifact recommender. claude-haiku-4-5 for fast autocomplete and classification tasks. |
| Firecrawl | Web scraping | Structured extraction from websites for research agent pipeline. |
| Google Places API | POI enrichment + search | Autocomplete, place details, photos, hours, ratings. Called server-side via API route. |
| Google Geocoding API | Address resolution | Text to lat/lng. Used in scraper pipeline and CSV import geocoding. |
| Google Directions API | Trip routing | Waypoint routing for trip itinerary mode. Polylines rendered on Mapbox canvas. |
| Vercel | Hosting & deployment | Next.js optimized. Edge runtime for API routes where latency matters. |

### 6.3 Vercel Deployment Notes

- Vercel serverless functions have a 10s default / 60s max execution limit — long-running research agent jobs must be offloaded to Inngest background workers, not executed in API routes directly
- Inngest runs as a separate service but integrates natively with Next.js/Vercel via a single API route handler
- Supabase database is external to Vercel — connection pooling via PgBouncer (included in Supabase) is essential for serverless environments
- Photo uploads: use Supabase Storage directly from client (presigned URLs) — do not route large files through Vercel serverless functions
- Mapbox, Google API keys: stored as Vercel environment variables, accessed via server-side API routes — never exposed to client
- Edge runtime: use for Blueprint read endpoints and geocoding proxy where sub-100ms response matters
- Image optimization: Next.js Image component handles Mapbox preview images and user photo thumbnails automatically

---

## 7. Data Architecture

### 7.1 Database Schema (PostgreSQL + PostGIS)

```sql
blueprints (id, owner_id, story_intent, bounding_context, created_at, updated_at)
locations (id, blueprint_id, name, coordinates GEOMETRY(Point,4326), category[], timestamp, notes, source_type, source_id, source_name, source_url, confidence)
photos (id, location_id, storage_url, exif_lat, exif_lng, exif_timestamp, exif_bearing, caption)
quantitative_values (id, location_id, key, value)
relationships (id, blueprint_id, from_location_id, to_location_id, relationship_type)
artifacts (id, blueprint_id, artifact_type, preset_id, config_overrides JSONB)
collaborators (id, blueprint_id, user_id, role, invited_at, accepted_at)
source_attributions (id, location_id, type, source_id, source_name, source_url, confidence, created_at)
living_dataset_configs (id, blueprint_id, scraper_config JSONB, cron_schedule, last_run_at, status)
preset_registry (id, name, artifact_type, mapbox_style_url, decklgl_config JSONB, atmosphere_config JSONB, typography_system JSONB, post_processing JSONB)
```

### 7.2 Geographic Queries

- All location coordinates stored as PostGIS GEOMETRY(Point, 4326) — enables spatial indexing and efficient bounding box queries
- Bounding box query: fetch all locations within current map viewport — critical for performance on large blueprints
- Proximity query: 'find locations within X meters of this point' — used for clustering and 'find similar nearby' feature
- Cluster detection: PostGIS ST_ClusterDBSCAN for grouping EXIF photos into memory 'moments'
- Spatial index: GiST index on coordinates column — non-negotiable for query performance at scale

### 7.3 Real-Time Architecture

- Blueprint co-editing: Liveblocks provides operational transform / CRDT-based sync — same model as Figma multiplayer
- Living dataset updates: Supabase Realtime (Postgres LISTEN/NOTIFY) — blueprint subscribers receive diff updates as scraper commits new entries
- Presence: Liveblocks presence API shows who is viewing/editing a Blueprint in real time

---

## 8. Source Attribution & Social Graph

Source attribution is a first-class data concept, not a metadata footnote. The provenance of every location in a Blueprint is visible, filterable, and central to the user experience.

### 8.1 Source Types

- **self**: user added manually
- **ai**: platform AI generated, with the prompt or query that produced it
- **friend**: a connected user whose recommendation was imported (requires social graph feature)
- **influencer**: a followed creator whose public map or guide was imported
- **editorial**: a known publication or platform (Eater, NYT Travel, Conde Nast, Michelin) — machine-matched by URL pattern
- **dataset**: a structured data source (Crunchbase, SEC, government database) — for research agent results

### 8.2 Attribution UI

- Each pin on the map carries a subtle source indicator — an icon or color signal at the pin level
- Tap/hover a pin: source attribution is the first piece of information in the detail card — not buried
- Filter by source: toggle which source types are visible on the map
- Attribution on share output: every shared guide or map credits sources
- Trust signals: friend attribution carries the friend's name and avatar; editorial attribution shows publication logo; AI attribution shows the generating query

### 8.3 Social Graph (V1 Scope)

- Follow other users: see their public maps in your discovery feed
- Import from a friend's Blueprint: pull specific locations from a friend's map into yours, with attribution preserved
- V1: simple follow graph, no in-app messaging
- V2: notifications when a followed user publishes a new map, collaborative map requests, shared blueprint ownership

---

## 9. Implementation Roadmap

| Phase | Timeline | Key Deliverables | Dependencies |
|---|---|---|---|
| Phase 0 | Weeks 1-2 | Project setup: Next.js + Supabase + PostGIS + Mapbox base rendering + Blueprint schema migrations + auth | None |
| Phase 1 | Weeks 3-6 | Blueprint CRUD, Mode 3 upload (CSV + EXIF photos), manual pin drop, basic list panel, first artifact render (Discovery Guide) | Phase 0 |
| Phase 2 | Weeks 7-10 | Mode 2 trip builder, Google Directions routing, AI co-planner suggestions, suggestion tray UI, source attribution display | Phase 1 |
| Phase 3 | Weeks 11-14 | Mode 1 research agent (static), scraper pipeline, triage UI, living dataset config UI, cron job infrastructure (Inngest) | Phase 2 |
| Phase 4 | Weeks 15-18 | Artifact type system, visual preset registry, 3D terrain for nature artifact, preset selection UI, artifact switcher | Phase 1-3 |
| Phase 5 | Weeks 19-22 | Real-time collaboration (Liveblocks), social graph (follow, import from friend), public map profiles, share output design | Phase 1-4 |
| Phase 6 | Weeks 23-26 | Visual reference library UI, additional preset types, deck.gl custom layer polish, post-processing shaders, performance optimization | Phase 4 |

### Phase 0 Checklist — Start Here

1. `npx create-next-app@latest along --typescript --tailwind --app` — initialize Next.js with App Router ✅
2. Install core deps: `mapbox-gl`, `react-map-gl`, `@deck.gl/react`, `@deck.gl/layers`, `@supabase/supabase-js`, `@supabase/ssr`, `zustand`, `@tanstack/react-query`, `framer-motion`, `exifr`, `inngest` ✅
3. Initialize Supabase project, enable PostGIS extension, run Blueprint schema migrations
4. Configure Mapbox access token, load base map in a server/client component split
5. Set up Vercel project, configure all environment variables (`MAPBOX_TOKEN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_PLACES_KEY`, `GOOGLE_GEOCODING_KEY`, `GOOGLE_DIRECTIONS_KEY`, `ANTHROPIC_API_KEY`)
6. Configure Inngest: add `/api/inngest` route handler, register first function (placeholder scraper job)
7. Auth: Supabase Auth with magic link + Google OAuth — middleware protecting all `/app` routes
8. Smoke test: authenticated user can load a full-bleed Mapbox map on `/app/new`

---

## 10. Key Architectural Decisions & Rationale

**Why Mapbox + deck.gl rather than Google Maps as the renderer:** Google Maps renderer is not controllable enough to deliver the visual language vision. You cannot implement custom shaders, post-processing, or non-standard marker rendering in Google Maps. Mapbox GL JS gives you the rendering pipeline; deck.gl gives you the WebGL layer for custom visuals. Google's value is in their data APIs — you use those without using their renderer.

**Why Supabase + PostGIS rather than a separate geo database:** PostGIS turns PostgreSQL into a fully capable spatial database. Given Supabase already provides auth, storage, and real-time — adding PostGIS is the most architecturally coherent choice.

**Why Inngest rather than Vercel background jobs for the research agent:** Vercel serverless functions have hard execution time limits (60s max). A research agent that scrapes 20 sources, geocodes 50 results, and runs deduplication will exceed this. Inngest provides durable background execution, retry logic, step-level observability, and native Next.js/Vercel integration via a single API route.

**Why the Blueprint schema rather than artifact-specific storage:** Storing data per-artifact-type would require re-ingestion when a user switches artifact types. The Blueprint schema is the investment that makes the platform extensible. New artifact types are purely rendering specs added to a registry — no data migration required.

**Why source attribution is a database concept rather than a display concept:** Storing it as a first-class database field (`source_type`, `source_id`, `source_name`, `source_url`, `confidence`) enables filtering, social graph integration, trust scoring, and future features like 'show me maps that cite the same sources I trust.' It is a data model decision that unlocks the differentiated product vision.

---

*Along — Architecture Blueprint v1.0*
*This document is a living specification. Update as architectural decisions evolve.*
