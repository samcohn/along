// Duffel Flights API client
// Docs: https://duffel.com/docs/guides/getting-started-with-flights
// Auth: Bearer token (DUFFEL_API_KEY)
// Sandbox: set DUFFEL_API_KEY=duffel_test_... for test inventory

const DUFFEL_BASE = 'https://api.duffel.com'
const DUFFEL_VERSION = 'beta'

function duffelHeaders() {
  const key = process.env.DUFFEL_API_KEY
  if (!key) throw new Error('DUFFEL_API_KEY is not configured')
  return {
    'Authorization': `Bearer ${key}`,
    'Duffel-Version': DUFFEL_VERSION,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

export interface FlightSearchParams {
  origin_iata: string        // e.g. 'JFK'
  destination_iata: string   // e.g. 'CDG'
  departure_date: string     // ISO date 'YYYY-MM-DD'
  passengers?: number        // default 1
  cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first'
}

export interface DuffelSlice {
  origin: { iata_code: string; city_name: string; name: string }
  destination: { iata_code: string; city_name: string; name: string }
  duration: string  // ISO 8601 duration e.g. 'PT8H30M'
  segments: {
    departing_at: string
    arriving_at: string
    marketing_carrier: { iata_code: string; name: string; logo_symbol_url?: string }
    operating_carrier: { iata_code: string; name: string }
    flight_number: string
  }[]
}

export interface DuffelOffer {
  id: string
  total_amount: string   // e.g. '234.50'
  total_currency: string // e.g. 'USD'
  tax_amount: string
  base_amount: string
  slices: DuffelSlice[]
  owner: { iata_code: string; name: string; logo_symbol_url?: string }
  passenger_identity_documents_required: boolean
  expires_at: string
  conditions: {
    refund_before_departure?: { allowed: boolean; penalty_amount?: string; penalty_currency?: string }
    change_before_departure?: { allowed: boolean; penalty_amount?: string; penalty_currency?: string }
  }
}

export interface FlightSearchResult {
  offer_request_id: string
  offers: DuffelOffer[]
  cheapest: DuffelOffer | null
}

// Step 1: Create an offer request
async function createOfferRequest(params: FlightSearchParams): Promise<string> {
  const body = {
    data: {
      slices: [{
        origin: params.origin_iata,
        destination: params.destination_iata,
        departure_date: params.departure_date,
      }],
      passengers: Array.from({ length: params.passengers ?? 1 }, () => ({
        type: 'adult',
      })),
      cabin_class: params.cabin_class ?? 'economy',
    }
  }

  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests`, {
    method: 'POST',
    headers: duffelHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Duffel offer_request failed: ${res.status} ${JSON.stringify(err)}`)
  }

  const json = await res.json()
  return json.data.id as string
}

// Step 2: List offers for the request, sorted by price
async function listOffers(offerRequestId: string, limit = 5): Promise<DuffelOffer[]> {
  const params = new URLSearchParams({
    offer_request_id: offerRequestId,
    limit: String(limit),
    sort: 'total_amount',
    'after': '',
  })

  const res = await fetch(`${DUFFEL_BASE}/air/offers?${params}`, {
    headers: duffelHeaders(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Duffel list_offers failed: ${res.status} ${JSON.stringify(err)}`)
  }

  const json = await res.json()
  return (json.data ?? []) as DuffelOffer[]
}

// Main export: search flights, return top N offers sorted cheapest first
export async function searchFlights(params: FlightSearchParams, limit = 3): Promise<FlightSearchResult> {
  const offerRequestId = await createOfferRequest(params)
  const offers = await listOffers(offerRequestId, limit * 3) // fetch more, slice later

  const sorted = offers
    .sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
    .slice(0, limit)

  return {
    offer_request_id: offerRequestId,
    offers: sorted,
    cheapest: sorted[0] ?? null,
  }
}

// Build a deep-link URL for a specific offer
// Duffel doesn't have a consumer booking page — we link to the airline's booking page
// with pre-filled search params as best-effort
export function buildFlightDeepLink(offer: DuffelOffer): string {
  if (!offer.slices[0]) return 'https://www.google.com/travel/flights'

  const slice = offer.slices[0]
  const origin = slice.origin.iata_code
  const destination = slice.destination.iata_code
  const date = slice.segments[0]?.departing_at?.split('T')[0] ?? ''

  // Google Flights as universal fallback
  return `https://www.google.com/travel/flights/search?tfs=CBwQAhoeEgoyMDI1LTAxLTAxagcIARIDSkZLcgcIARIDQ0RH&hl=en#flt=${origin}.${destination}.${date};c:USD;e:1;sd:1;t:f`
}

// Parse duration string PT8H30M → "8h 30m"
export function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso
  const h = match[1] ? `${match[1]}h` : ''
  const m = match[2] ? `${match[2]}m` : ''
  return [h, m].filter(Boolean).join(' ')
}
