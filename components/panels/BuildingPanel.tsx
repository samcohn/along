'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocationStore } from '@/store/locations'
import { useMapStore } from '@/store/map'
import type { Location } from '@/types/blueprint'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface PlaceDetails {
  result: {
    name: string
    geometry: { location: { lat: number; lng: number } }
    formatted_address: string
    rating?: number
    types?: string[]
    opening_hours?: { weekday_text: string[] }
    photos?: unknown[]
  }
}

// ─── Place Search ─────────────────────────────────────────────────────────────

function PlaceSearch({ onAdd }: { onAdd: (loc: Location) => void }) {
  const [query, setQuery] = useState('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setPredictions([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/places?type=autocomplete&q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setPredictions(data.predictions ?? [])
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  // Use onBlur with a delay so clicks on dropdown items register first
  function handleBlur() {
    blurTimeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  function handleFocus() {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    if (query.length >= 2 && predictions.length > 0) setOpen(true)
  }

  async function handleSelect(prediction: Prediction) {
    // Cancel the blur close so dropdown stays until we're done
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    setOpen(false)
    setPredictions([])
    setQuery(prediction.structured_formatting.main_text)

    const res = await fetch(`/api/places?type=details&place_id=${prediction.place_id}`)
    const data: PlaceDetails = await res.json()
    const place = data.result

    const loc: Location = {
      id: `loc_${Date.now()}`,
      name: place.name,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      category: place.types?.slice(0, 3) ?? [],
      notes: '',
      timestamp: undefined,
      photos: [],
      relationships: [],
      quantitative_values: {},
      source: { type: 'self' },
      enrichment: {
        google_place_id: prediction.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        rating: place.rating,
        types: place.types,
      },
    }

    onAdd(loc)
    setQuery('')
  }

  // Cleanup timeouts
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <svg className="absolute left-3 text-white/30 pointer-events-none" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search for a place…"
          autoComplete="off"
          className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/35 transition"
        />
        {loading && (
          <svg className="absolute right-3 animate-spin text-white/30 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {open && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#111] border border-white/15 rounded-xl overflow-hidden z-50 shadow-2xl">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(p) }}
              className="w-full flex flex-col px-3 py-2.5 hover:bg-white/8 transition text-left gap-0.5 border-b border-white/5 last:border-0"
            >
              <span className="text-white text-sm">{p.structured_formatting.main_text}</span>
              <span className="text-white/40 text-xs">{p.structured_formatting.secondary_text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function BuildingPanel() {
  const { activePanel, setActivePanel, activeArtifactType } = useMapStore()
  const {
    locations, addLocation, removeLocation,
    isFetchingSuggestions, setSuggestions, setIsFetchingSuggestions,
  } = useLocationStore()
  const [destination, setDestination] = useState('')

  const isOpen = activePanel === 'building'

  async function fetchSuggestions() {
    setIsFetchingSuggestions(true)
    setActivePanel('suggestions')
    try {
      const res = await fetch('/api/coplanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          intent: 'trip planning',
          existing_locations: locations,
          artifact_type: activeArtifactType,
        }),
      })
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
    } finally {
      setIsFetchingSuggestions(false)
    }
  }

  const content = (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-medium text-sm">Your map</h2>
        <button onClick={() => setActivePanel('none')} className="text-white/40 hover:text-white transition text-xl leading-none">×</button>
      </div>

      {/* Destination context (for AI suggestions) */}
      <input
        type="text"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination (e.g. Tokyo, New York…)"
        className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/35 transition"
      />

      {/* Google Places search */}
      <PlaceSearch onAdd={addLocation} />

      {/* Divider */}
      <div className="border-t border-white/8" />

      {/* Location list */}
      <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
        {locations.length === 0 ? (
          <p className="text-white/25 text-xs text-center py-6">
            Search for places above or ask AI to suggest some
          </p>
        ) : (
          locations.map((loc, i) => (
            <div
              key={loc.id}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 group"
            >
              <span className="text-white/30 text-xs w-5 text-center font-medium">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{loc.name}</p>
                {loc.enrichment?.formatted_address && (
                  <p className="text-white/35 text-xs truncate mt-0.5">{loc.enrichment.formatted_address}</p>
                )}
                {loc.enrichment?.rating && (
                  <p className="text-white/30 text-xs mt-0.5">★ {loc.enrichment.rating}</p>
                )}
              </div>
              <button
                onClick={() => removeLocation(loc.id)}
                className="text-white/20 hover:text-white/60 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* AI suggest button */}
      <button
        onClick={fetchSuggestions}
        disabled={isFetchingSuggestions}
        className="w-full bg-white text-black rounded-xl py-2.5 text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition flex items-center justify-center gap-2 flex-shrink-0"
      >
        {isFetchingSuggestions ? (
          <>
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Finding places…
          </>
        ) : '✦ Suggest places with AI'}
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop: right panel */}
      <div className={`hidden lg:flex flex-col absolute right-0 top-0 bottom-0 w-[380px] z-10 bg-black/80 backdrop-blur-xl border-l border-white/10 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {content}
      </div>

      {/* Mobile: bottom sheet */}
      <div className={`lg:hidden absolute left-0 right-0 bottom-0 z-10 bg-black/90 backdrop-blur-xl border-t border-white/10 rounded-t-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ maxHeight: '70vh' }}>
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />
        {content}
      </div>
    </>
  )
}
