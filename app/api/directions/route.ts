import { NextResponse } from 'next/server'

const DIRECTIONS_KEY = process.env.GOOGLE_DIRECTIONS_KEY

// POST /api/directions
// Body: { waypoints: [{ lat, lng }] }
// Returns decoded polyline points for rendering on Mapbox canvas
export async function POST(request: Request) {
  const { waypoints } = await request.json()

  if (!waypoints || waypoints.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 waypoints' }, { status: 400 })
  }

  if (!DIRECTIONS_KEY) {
    // Return mock straight-line route between points
    return NextResponse.json({
      routes: [{
        legs: waypoints.slice(0, -1).map((_: unknown, i: number) => ({
          distance: { text: '1.2 mi', value: 1931 },
          duration: { text: '8 mins', value: 480 },
          start_address: `Point ${i + 1}`,
          end_address: `Point ${i + 2}`,
        })),
        polyline: waypoints.map((wp: { lat: number; lng: number }) => [wp.lng, wp.lat]),
        total_distance: '1.2 mi',
        total_duration: '8 mins',
      }]
    })
  }

  const origin = `${waypoints[0].lat},${waypoints[0].lng}`
  const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`
  const intermediates = waypoints.slice(1, -1)
    .map((wp: { lat: number; lng: number }) => `${wp.lat},${wp.lng}`)
    .join('|')

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${intermediates ? `&waypoints=${intermediates}` : ''}&key=${DIRECTIONS_KEY}`

  const res = await fetch(url)
  const data = await res.json()

  if (!data.routes?.length) {
    return NextResponse.json({ error: 'No routes found' }, { status: 404 })
  }

  // Decode Google's encoded polyline into [lng, lat] pairs for deck.gl
  const encodedPolyline = data.routes[0].overview_polyline.points
  const points = decodePolyline(encodedPolyline)

  return NextResponse.json({
    routes: [{
      legs: data.routes[0].legs,
      polyline: points,
      total_distance: data.routes[0].legs.reduce((acc: number, l: { distance: { value: number } }) => acc + l.distance.value, 0),
      total_duration: data.routes[0].legs.reduce((acc: number, l: { duration: { value: number } }) => acc + l.duration.value, 0),
    }]
  })
}

// Google's encoded polyline algorithm decoder → returns [lng, lat] for deck.gl
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = []
  let index = 0, lat = 0, lng = 0

  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : result >> 1

    shift = 0; result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : result >> 1

    points.push([lng / 1e5, lat / 1e5])
  }
  return points
}
