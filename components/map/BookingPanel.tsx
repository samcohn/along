'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocationStore } from '@/store/locations'
import { useConnectionsStore } from '@/store/connections'
import { useMapStore } from '@/store/map'
import { formatDuration } from '@/lib/duffel'
import type { DuffelOffer } from '@/lib/duffel'
import type { Location } from '@/types/blueprint'

interface Props {
  onClose: () => void
}

// ─── City extraction helpers ─────────────────────────────────────────────────

function extractCity(address: string): string {
  // "Le Jules Verne, Champ de Mars, 5 Av. Anatole France, 75007 Paris, France"
  // → try to find the city token (usually second-to-last comma segment)
  const parts = address.split(',').map((s) => s.trim())
  if (parts.length >= 2) {
    // Often the pattern is: ..., City ZIPCODE, Country
    // Try to strip ZIP codes
    const city = parts[parts.length - 2].replace(/\d{4,6}\s*/g, '').trim()
    if (city.length > 1) return city
  }
  return parts[0] ?? address
}

function buildCitySequence(locations: Location[]): string[] {
  // Sort by day (from enrichment), then deduplicate cities while preserving order
  const sorted = [...locations].sort((a, b) => {
    const dayA = (a.enrichment as Record<string, unknown>)?.day as number ?? 0
    const dayB = (b.enrichment as Record<string, unknown>)?.day as number ?? 0
    return dayA - dayB
  })

  const seen = new Set<string>()
  const cities: string[] = []
  for (const loc of sorted) {
    const addr = (loc.enrichment as Record<string, unknown>)?.formatted_address as string
      ?? loc.notes
      ?? ''
    const city = extractCity(addr)
    const normalized = city.toLowerCase()
    if (!seen.has(normalized)) {
      seen.add(normalized)
      cities.push(city)
    }
  }
  return cities
}

function estimateDepartureDate(dayIndex: number): string {
  // Default: start 30 days from now, each segment adds duration_days
  const base = new Date()
  base.setDate(base.getDate() + 30 + dayIndex * 3)
  return base.toISOString().split('T')[0]
}

function buildResyLink(name: string, city: string): string {
  const q = encodeURIComponent(`${name} ${city}`)
  return `https://resy.com/cities/ny?query=${q}`
}

function buildOpenTableLink(name: string): string {
  const q = encodeURIComponent(name)
  return `https://www.opentable.com/s?term=${q}`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FlightCard({ segment }: { segment: ReturnType<typeof useConnectionsStore.getState>['flightSegments'][0] }) {
  const offer: DuffelOffer | null = segment.cheapest_offer
  const isLoading = segment.status === 'searching'
  const isUnavailable = segment.status === 'unavailable' && !offer

  return (
    <a
      href={segment.deep_link_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all p-3 group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white/40 text-xs">✈️</span>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {segment.origin_city} → {segment.destination_city}
            </p>
            {offer ? (
              <p className="text-white/50 text-xs mt-0.5">
                {offer.owner.name}
                {offer.slices[0] && ` · ${formatDuration(offer.slices[0].duration)}`}
              </p>
            ) : isLoading ? (
              <p className="text-white/30 text-xs mt-0.5">Searching…</p>
            ) : (
              <p className="text-white/30 text-xs mt-0.5">Search on Google Flights</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {offer && (
            <span className="text-white font-semibold text-sm">
              {offer.total_currency === 'USD' ? '$' : offer.total_currency + ' '}
              {Math.round(parseFloat(offer.total_amount)).toLocaleString()}
            </span>
          )}
          <span className="text-white/30 group-hover:text-white/70 transition-colors text-xs">→</span>
        </div>
      </div>

      {offer && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
          {offer.conditions.refund_before_departure?.allowed && (
            <span className="text-emerald-400/70 text-[10px] tracking-wide uppercase">Refundable</span>
          )}
          {offer.conditions.change_before_departure?.allowed && (
            <span className="text-blue-400/70 text-[10px] tracking-wide uppercase">Changeable</span>
          )}
          <span className="text-white/20 text-[10px] ml-auto">
            {segment.origin_iata} → {segment.destination_iata}
          </span>
        </div>
      )}
    </a>
  )
}

function RestaurantCard({ restaurant }: { restaurant: ReturnType<typeof useConnectionsStore.getState>['restaurantConnections'][0] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{restaurant.name}</p>
          <p className="text-white/40 text-xs mt-0.5">
            Day {restaurant.day} · {restaurant.time_of_day}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0 mt-0.5">
          <a
            href={buildResyLink(restaurant.name, restaurant.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            Resy
          </a>
          <a
            href={buildOpenTableLink(restaurant.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            OpenTable
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function BookingPanel({ onClose }: Props) {
  const { locations } = useLocationStore()
  const {
    flightSegments, restaurantConnections,
    isLoadingFlights,
    setFlightSegments, setRestaurantConnections, setLoadingFlights,
  } = useConnectionsStore()
  const { activeBlueprintId } = useMapStore()

  const [visible, setVisible] = useState(false)
  const hasSearched = useRef(false)

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Extract restaurant connections from locations
  useEffect(() => {
    const restaurants = locations
      .filter((loc) => {
        const e = loc.enrichment as Record<string, unknown>
        return e?.booking_required === true
      })
      .map((loc) => {
        const e = loc.enrichment as Record<string, unknown>
        const addr = e?.formatted_address as string ?? loc.notes ?? ''
        const city = extractCity(addr)
        return {
          id: loc.id,
          name: loc.name,
          day: (e?.day as number) ?? 0,
          time_of_day: (e?.time_of_day as string) ?? '',
          address: city,
        }
      })
      .sort((a, b) => a.day - b.day)

    setRestaurantConnections(restaurants)
  }, [locations, setRestaurantConnections])

  // Search flights once
  useEffect(() => {
    if (hasSearched.current || !activeBlueprintId || !locations.length) return
    hasSearched.current = true

    const cities = buildCitySequence(locations)
    if (cities.length < 2) return

    // Build segments: each city pair + return leg
    const segments = []
    for (let i = 0; i < cities.length - 1; i++) {
      segments.push({
        origin_city: cities[i],
        destination_city: cities[i + 1],
        date: estimateDepartureDate(i),
        passengers: 1,
      })
    }
    // Return leg
    segments.push({
      origin_city: cities[cities.length - 1],
      destination_city: cities[0],
      date: estimateDepartureDate(segments.length),
      passengers: 1,
    })

    // Optimistically set segments as searching
    setFlightSegments(
      segments.map((seg, i) => ({
        id: `seg_${i}`,
        origin_city: seg.origin_city,
        destination_city: seg.destination_city,
        origin_iata: '',
        destination_iata: '',
        date: seg.date,
        cheapest_offer: null,
        deep_link_url: 'https://www.google.com/travel/flights',
        status: 'searching',
      }))
    )
    setLoadingFlights(true)

    fetch('/api/connections/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprint_id: activeBlueprintId, segments }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.segments) {
          setFlightSegments(
            data.segments.map((seg: {
              connection_id: string | null
              origin_city: string
              destination_city: string
              origin_iata: string | null
              destination_iata: string | null
              date: string
              cheapest_offer: DuffelOffer | null
              deep_link_url: string
              status: string
            }, i: number) => ({
              id: seg.connection_id ?? `seg_${i}`,
              origin_city: seg.origin_city,
              destination_city: seg.destination_city,
              origin_iata: seg.origin_iata ?? '',
              destination_iata: seg.destination_iata ?? '',
              date: seg.date,
              cheapest_offer: seg.cheapest_offer,
              deep_link_url: seg.deep_link_url,
              status: seg.status as 'available' | 'unavailable',
            }))
          )
        }
      })
      .catch((err) => console.error('Flight search error:', err))
      .finally(() => setLoadingFlights(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlueprintId, locations.length])

  const actionCount = flightSegments.length + restaurantConnections.length

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Backdrop gradient */}
      <div className="absolute inset-x-0 bottom-0 h-[110%] bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

      <div className="relative max-w-xl mx-auto px-4 pb-6 pt-2">
        {/* Handle bar */}
        <div className="flex justify-center mb-3">
          <div className="w-8 h-0.5 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-medium text-sm tracking-wide">
              {actionCount > 0 ? `${actionCount} thing${actionCount !== 1 ? 's' : ''} to book` : 'Your trip is ready'}
            </h3>
            <p className="text-white/40 text-xs mt-0.5">
              {isLoadingFlights ? 'Finding the best flights…' : 'Review and confirm when you\'re ready'}
            </p>
          </div>
          <button
            onClick={() => {
              setVisible(false)
              setTimeout(onClose, 400)
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all text-xs"
          >
            ✕
          </button>
        </div>

        {/* Flights section */}
        {flightSegments.length > 0 && (
          <div className="mb-4">
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Flights</p>
            <div className="flex flex-col gap-2">
              {flightSegments.map((seg) => (
                <FlightCard key={seg.id} segment={seg} />
              ))}
            </div>
          </div>
        )}

        {/* Restaurants section */}
        {restaurantConnections.length > 0 && (
          <div className="mb-4">
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">
              Reservations needed
            </p>
            <div className="flex flex-col gap-2">
              {restaurantConnections.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          </div>
        )}

        {/* Footer: Calendar export (deferred) */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 opacity-40 cursor-not-allowed select-none">
            <span className="text-xs">📅</span>
            <span className="text-white/60 text-xs">Export to Calendar</span>
            <span className="text-white/30 text-[10px] tracking-wide uppercase ml-1">Soon</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 opacity-40 cursor-not-allowed select-none">
            <span className="text-xs">📞</span>
            <span className="text-white/60 text-xs">Call to reserve</span>
            <span className="text-white/30 text-[10px] tracking-wide uppercase ml-1">Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
