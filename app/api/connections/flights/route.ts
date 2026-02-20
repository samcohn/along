import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchFlights, buildFlightDeepLink } from '@/lib/duffel'
import type { FlightSearchParams } from '@/lib/duffel'

// City name → IATA code lookup for common travel destinations
// Supplemented by Google Places fallback for unknown cities
const CITY_IATA: Record<string, string> = {
  // North America
  'new york': 'JFK', 'nyc': 'JFK', 'manhattan': 'JFK',
  'los angeles': 'LAX', 'la': 'LAX',
  'chicago': 'ORD',
  'san francisco': 'SFO', 'sf': 'SFO',
  'miami': 'MIA',
  'boston': 'BOS',
  'washington': 'DCA', 'dc': 'DCA',
  'seattle': 'SEA',
  'atlanta': 'ATL',
  'denver': 'DEN',
  'toronto': 'YYZ',
  'montreal': 'YUL',
  'vancouver': 'YVR',
  'mexico city': 'MEX',

  // Europe
  'london': 'LHR',
  'paris': 'CDG',
  'amsterdam': 'AMS',
  'berlin': 'BER',
  'madrid': 'MAD',
  'barcelona': 'BCN',
  'rome': 'FCO',
  'milan': 'MXP',
  'florence': 'FLR',
  'venice': 'VCE',
  'naples': 'NAP',
  'lisbon': 'LIS',
  'porto': 'OPO',
  'athens': 'ATH',
  'istanbul': 'IST',
  'prague': 'PRG',
  'vienna': 'VIE',
  'zurich': 'ZRH',
  'geneva': 'GVA',
  'stockholm': 'ARN',
  'copenhagen': 'CPH',
  'oslo': 'OSL',
  'helsinki': 'HEL',
  'dublin': 'DUB',
  'edinburgh': 'EDI',
  'brussels': 'BRU',

  // Asia-Pacific
  'tokyo': 'NRT', 'tokyo narita': 'NRT',
  'osaka': 'KIX',
  'kyoto': 'KIX',  // Kyoto is served by Osaka (KIX)
  'seoul': 'ICN',
  'beijing': 'PEK',
  'shanghai': 'PVG',
  'hong kong': 'HKG',
  'singapore': 'SIN',
  'bangkok': 'BKK',
  'taipei': 'TPE',
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'auckland': 'AKL',
  'bali': 'DPS', 'denpasar': 'DPS',
  'jakarta': 'CGK',
  'kuala lumpur': 'KUL',

  // Middle East & Africa
  'dubai': 'DXB',
  'abu dhabi': 'AUH',
  'tel aviv': 'TLV',
  'cairo': 'CAI',
  'marrakech': 'RAK',
  'cape town': 'CPT',
  'johannesburg': 'JNB',

  // South America
  'buenos aires': 'EZE',
  'rio de janeiro': 'GIG', 'rio': 'GIG',
  'sao paulo': 'GRU',
  'bogota': 'BOG',
  'lima': 'LIM',
  'santiago': 'SCL',
}

function cityToIata(city: string): string | null {
  const normalized = city.toLowerCase().trim()
  // Direct match
  if (CITY_IATA[normalized]) return CITY_IATA[normalized]
  // Partial match (city may be "Paris, France" or "Paris 75001")
  for (const [key, code] of Object.entries(CITY_IATA)) {
    if (normalized.startsWith(key) || normalized.includes(key)) return code
  }
  return null
}

export interface FlightSegmentRequest {
  origin_city: string
  destination_city: string
  origin_iata?: string  // pre-resolved IATA (optional override)
  destination_iata?: string
  date: string          // 'YYYY-MM-DD' — we estimate based on trip start + day offset
  passengers?: number
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      blueprint_id: string
      segments: FlightSegmentRequest[]
    }

    const { blueprint_id, segments } = body
    if (!blueprint_id || !segments?.length) {
      return NextResponse.json({ error: 'blueprint_id and segments required' }, { status: 400 })
    }

    // Verify blueprint ownership
    const { data: bp } = await supabase
      .from('blueprints')
      .select('id')
      .eq('id', blueprint_id)
      .eq('owner_id', user.id)
      .single()

    if (!bp) return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 })

    // Check if Duffel is configured
    const hasDuffel = !!process.env.DUFFEL_API_KEY

    // Search each segment in parallel
    const results = await Promise.allSettled(
      segments.map(async (seg) => {
        const origin_iata = seg.origin_iata ?? cityToIata(seg.origin_city)
        const destination_iata = seg.destination_iata ?? cityToIata(seg.destination_city)

        let offer = null
        let deep_link_url = `https://www.google.com/travel/flights/search`

        if (hasDuffel && origin_iata && destination_iata) {
          try {
            const searchParams: FlightSearchParams = {
              origin_iata,
              destination_iata,
              departure_date: seg.date,
              passengers: seg.passengers ?? 1,
            }
            const result = await searchFlights(searchParams, 3)
            offer = result.cheapest
            if (offer) deep_link_url = buildFlightDeepLink(offer)
          } catch (err) {
            console.error(`Duffel search failed for ${origin_iata}→${destination_iata}:`, err)
            // Fall through — return no offer but don't fail the whole request
          }
        }

        // Persist to connections table
        const { data: connection } = await supabase
          .from('connections')
          .insert({
            blueprint_id,
            connection_type: 'flight',
            status: offer ? 'available' : (hasDuffel ? 'unavailable' : 'suggested'),
            provider: hasDuffel ? 'duffel' : null,
            provider_ref_id: offer?.id ?? null,
            data: offer ? {
              offer,
              origin_city: seg.origin_city,
              destination_city: seg.destination_city,
              origin_iata: origin_iata ?? null,
              destination_iata: destination_iata ?? null,
              date: seg.date,
            } : {
              origin_city: seg.origin_city,
              destination_city: seg.destination_city,
              origin_iata: origin_iata ?? null,
              destination_iata: destination_iata ?? null,
              date: seg.date,
              note: hasDuffel ? 'No routes found' : 'Duffel not configured',
            },
            deep_link_url,
          })
          .select('id')
          .single()

        return {
          connection_id: connection?.id,
          origin_city: seg.origin_city,
          destination_city: seg.destination_city,
          origin_iata: origin_iata ?? null,
          destination_iata: destination_iata ?? null,
          date: seg.date,
          cheapest_offer: offer,
          deep_link_url,
          status: offer ? 'available' : 'unavailable',
        }
      })
    )

    const segments_result = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      return {
        connection_id: null,
        origin_city: segments[i].origin_city,
        destination_city: segments[i].destination_city,
        origin_iata: null,
        destination_iata: null,
        date: segments[i].date,
        cheapest_offer: null,
        deep_link_url: 'https://www.google.com/travel/flights',
        status: 'unavailable',
        error: r.reason?.message,
      }
    })

    return NextResponse.json({ segments: segments_result })
  } catch (err) {
    console.error('POST /api/connections/flights error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
