import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchArtifactForPlace } from '@/lib/artifacts'

// POST /api/trips/build
// Takes a selected scope + trip intent, generates full day-by-day itinerary,
// geocodes all locations, creates blueprint, returns blueprint_id.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { trip_intent_id, scope_id } = await request.json()
  if (!trip_intent_id) return NextResponse.json({ error: 'trip_intent_id required' }, { status: 400 })

  // Fetch trip intent + taste profile
  const { data: tripIntent } = await supabase
    .from('trip_intents')
    .select('*')
    .eq('id', trip_intent_id)
    .eq('owner_id', user.id)
    .single()

  if (!tripIntent) return NextResponse.json({ error: 'Trip intent not found' }, { status: 404 })

  const { data: tasteProfile } = await supabase
    .from('taste_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const selectedScope = (tripIntent.scope_options as Array<{id: string; title: string; duration_days: number; cities: string[]; highlights: string[]}>)
    ?.find((s) => s.id === (scope_id ?? tripIntent.selected_scope_id))
    ?? (tripIntent.scope_options as Array<{id: string; title: string; duration_days: number; cities: string[]; highlights: string[]}>)?.[0]

  if (!selectedScope) return NextResponse.json({ error: 'Scope not found' }, { status: 404 })

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  // ── Generate full day-by-day itinerary ──────────────────────────────────
  const itineraryMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `You are building a precise, personalized travel itinerary.

TRAVELER PROFILE:
${tasteProfile?.taste_summary ?? 'A curious, independent traveler.'}

Aesthetic dimensions: ${JSON.stringify(tasteProfile?.dimensions ?? {})}
Anchors: ${JSON.stringify(tasteProfile?.anchors ?? {})}
Pace: ${tasteProfile?.pace ?? 'varied'}
Meal philosophy: ${tasteProfile?.meal_philosophy ?? 'mixed'}
Discovery mode: ${tasteProfile?.discovery_mode ?? 'wander'}
Constraints: ${JSON.stringify(tripIntent.hard_constraints ?? [])}
Preferences: ${JSON.stringify(tripIntent.soft_preferences ?? [])}

TRIP SCOPE: ${selectedScope.title}
Destination: ${tripIntent.destination}
Duration: ${selectedScope.duration_days} days
Cities: ${selectedScope.cities?.join(', ')}
Scope highlights: ${selectedScope.highlights?.join(', ')}

Build a day-by-day itinerary. Each day has 3-5 places. Every place must be:
- A real, specific named location (not generic)
- Genuinely matched to this traveler's taste profile — explain WHY in the "fit" field
- Timed realistically (not 8 places in one day)

Return JSON:
{
  "title": "Trip title that captures the spirit",
  "days": [
    {
      "day": 1,
      "theme": "Arrival day theme (e.g. 'Landing and orienting')",
      "places": [
        {
          "name": "Specific place name",
          "address": "Full address with city and country",
          "category": ["restaurant", "coffee"],
          "time_of_day": "morning|afternoon|evening|night",
          "duration_minutes": 90,
          "fit": "1-2 sentences on why this place is right for this specific traveler",
          "booking_required": false,
          "source_url": "https://..."
        }
      ]
    }
  ]
}

Return ONLY valid JSON. Be specific, not generic. Avoid tourist traps unless the traveler's profile suggests they want them.`
    }]
  })

  let itinerary: { title: string; days: Array<{ day: number; theme: string; places: Array<{ name: string; address: string; category: string[]; time_of_day: string; duration_minutes: number; fit: string; booking_required: boolean; source_url?: string }> }> }
  try {
    const text = itineraryMsg.content[0].type === 'text' ? itineraryMsg.content[0].text : '{}'
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    itinerary = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'Failed to parse itinerary' }, { status: 500 })
  }

  // ── Create blueprint ────────────────────────────────────────────────────
  const { data: blueprint } = await supabase
    .from('blueprints')
    .insert({
      owner_id: user.id,
      story_intent: 'travel',
      bounding_context: {},
      title: itinerary.title,
      metadata: {
        title: itinerary.title,
        is_public: false,
        tags: [tripIntent.destination],
        artifact_type: 'trip_itinerary',
        trip_intent_id,
        scope_id: selectedScope.id,
      },
    })
    .select()
    .single()

  if (!blueprint) return NextResponse.json({ error: 'Failed to create blueprint' }, { status: 500 })

  // ── Geocode all places in parallel ─────────────────────────────────────
  const KEY = process.env.GOOGLE_GEOCODING_KEY
  const allPlaces: Array<{
    id: string
    name: string
    coordinates: { lat: number; lng: number } | null
    formatted_address: string
    category: string[]
    notes: string
    day: number
    time_of_day: string
    duration_minutes: number
    booking_required: boolean
    source_url?: string
    fit: string
  }> = []

  await Promise.all(
    itinerary.days.flatMap(day =>
      day.places.map(async (place) => {
        let coordinates = null
        let formatted_address = place.address

        if (KEY) {
          try {
            const q = encodeURIComponent(`${place.name} ${place.address}`)
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${KEY}`)
            const data = await res.json()
            if (data.results?.[0]) {
              const loc = data.results[0].geometry.location
              coordinates = { lat: loc.lat, lng: loc.lng }
              formatted_address = data.results[0].formatted_address
            }
          } catch { /* skip */ }
        }

        allPlaces.push({
          id: `trip_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: place.name,
          coordinates,
          formatted_address,
          category: place.category,
          notes: place.fit,
          day: day.day,
          time_of_day: place.time_of_day,
          duration_minutes: place.duration_minutes,
          booking_required: place.booking_required,
          source_url: place.source_url,
          fit: place.fit,
        })
      })
    )
  )

  // ── Fetch Met museum artifacts for each place (in parallel, best-effort) ──
  const geocodedPlaces = allPlaces.filter(p => p.coordinates)
  const primaryCategories = geocodedPlaces.map(p => p.category[0] ?? 'landmark')

  // Infer culture from destination (simple heuristic — Claude includes country in addresses)
  const destinationCulture = tripIntent.destination ?? 'European'
  const artifactResults = await Promise.allSettled(
    primaryCategories.map((cat) =>
      fetchArtifactForPlace({ culture: destinationCulture, category: cat })
        .catch(() => null)
    )
  )

  // ── Persist locations to DB ─────────────────────────────────────────────
  await Promise.all(
    geocodedPlaces.map((place, i) => {
      const artifactResult = artifactResults[i]
      const artifact = artifactResult.status === 'fulfilled' ? artifactResult.value : null

      return supabase.from('locations').insert({
        id: place.id,
        blueprint_id: blueprint.id,
        name: place.name,
        coordinates: `POINT(${place.coordinates!.lng} ${place.coordinates!.lat})`,
        category: place.category,
        notes: place.notes,
        source_type: 'ai',
        source_name: 'Along Trip Builder',
        confidence: 0.88,
        enrichment: {
          formatted_address: place.formatted_address,
          day: place.day,
          time_of_day: place.time_of_day,
          duration_minutes: place.duration_minutes,
          booking_required: place.booking_required,
          source_url: place.source_url,
          fit: place.fit,
          // Museum artifact for the floating map overlay
          artifact: artifact
            ? {
                objectID: artifact.objectID,
                imageUrl: artifact.imageUrl,
                title: artifact.title,
                objectName: artifact.objectName,
                metUrl: artifact.metUrl,
              }
            : null,
        },
      })
    })
  )

  // ── Update trip intent with blueprint_id ───────────────────────────────
  await supabase
    .from('trip_intents')
    .update({
      blueprint_id: blueprint.id,
      selected_scope_id: selectedScope.id,
      status: 'building',
    })
    .eq('id', trip_intent_id)

  return NextResponse.json({
    blueprint_id: blueprint.id,
    title: itinerary.title,
    days: itinerary.days.length,
    total_places: geocodedPlaces.length,
    locations: allPlaces,
  })
}
