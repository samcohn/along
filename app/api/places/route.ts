import { NextResponse } from 'next/server'

const PLACES_KEY = process.env.GOOGLE_PLACES_KEY

// GET /api/places?q=query&type=autocomplete|details&place_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'autocomplete'
  const q = searchParams.get('q') ?? ''
  const place_id = searchParams.get('place_id')

  if (!PLACES_KEY) {
    // Return mock data if key not configured yet
    if (type === 'autocomplete') {
      return NextResponse.json({
        predictions: [
          { place_id: 'mock_1', description: 'Central Park, New York, NY, USA', structured_formatting: { main_text: 'Central Park', secondary_text: 'New York, NY, USA' } },
          { place_id: 'mock_2', description: 'Times Square, New York, NY, USA', structured_formatting: { main_text: 'Times Square', secondary_text: 'New York, NY, USA' } },
        ]
      })
    }
    return NextResponse.json({ result: { name: 'Mock Place', geometry: { location: { lat: 40.7128, lng: -74.006 } }, formatted_address: '123 Mock St', rating: 4.5, opening_hours: null, photos: [] } })
  }

  if (type === 'autocomplete') {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${PLACES_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return NextResponse.json(data)
  }

  if (type === 'details' && place_id) {
    const fields = 'name,geometry,formatted_address,rating,opening_hours,photos,price_level,types,website,formatted_phone_number'
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${PLACES_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
