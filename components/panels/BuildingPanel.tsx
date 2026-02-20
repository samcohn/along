'use client'

import { useState } from 'react'
import { useLocationStore } from '@/store/locations'
import { useMapStore } from '@/store/map'

export default function BuildingPanel() {
  const { activePanel, setActivePanel } = useMapStore()
  const { locations, removeLocation, reorderLocations, isFetchingSuggestions, setSuggestions, setIsFetchingSuggestions } = useLocationStore()
  const [destination, setDestination] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)

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
        }),
      })
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
    } finally {
      setIsFetchingSuggestions(false)
    }
  }

  return (
    <>
      {/* Desktop: right panel */}
      <div
        className={`
          hidden lg:flex flex-col absolute right-0 top-0 bottom-0 w-[380px] z-10
          bg-black/80 backdrop-blur-xl border-l border-white/10
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <PanelContent
          destination={destination}
          setDestination={setDestination}
          locations={locations}
          removeLocation={removeLocation}
          reorderLocations={reorderLocations}
          dragIdx={dragIdx}
          setDragIdx={setDragIdx}
          fetchSuggestions={fetchSuggestions}
          isFetchingSuggestions={isFetchingSuggestions}
          onClose={() => setActivePanel('none')}
        />
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className={`
          lg:hidden absolute left-0 right-0 bottom-0 z-10
          bg-black/90 backdrop-blur-xl border-t border-white/10 rounded-t-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '60vh' }}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />
        <PanelContent
          destination={destination}
          setDestination={setDestination}
          locations={locations}
          removeLocation={removeLocation}
          reorderLocations={reorderLocations}
          dragIdx={dragIdx}
          setDragIdx={setDragIdx}
          fetchSuggestions={fetchSuggestions}
          isFetchingSuggestions={isFetchingSuggestions}
          onClose={() => setActivePanel('none')}
        />
      </div>
    </>
  )
}

interface PanelContentProps {
  destination: string
  setDestination: (v: string) => void
  locations: ReturnType<typeof useLocationStore.getState>['locations']
  removeLocation: (id: string) => void
  reorderLocations: (from: number, to: number) => void
  dragIdx: number | null
  setDragIdx: (v: number | null) => void
  fetchSuggestions: () => void
  isFetchingSuggestions: boolean
  onClose: () => void
}

function PanelContent({
  destination, setDestination, locations, removeLocation,
  fetchSuggestions, isFetchingSuggestions, onClose
}: PanelContentProps) {
  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-medium text-sm">Your map</h2>
        <button onClick={onClose} className="text-white/40 hover:text-white transition text-lg leading-none">×</button>
      </div>

      {/* Destination input */}
      <div>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Where are you going?"
          className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Location list */}
      <div className="flex flex-col gap-2 flex-1">
        {locations.length === 0 ? (
          <div className="text-white/30 text-xs text-center py-8">
            No locations yet — ask AI for suggestions or search for a place
          </div>
        ) : (
          locations.map((loc, i) => (
            <div
              key={loc.id}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 group"
            >
              <span className="text-white/30 text-xs w-4 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{loc.name}</p>
                {loc.category.length > 0 && (
                  <p className="text-white/40 text-xs truncate">{loc.category.join(', ')}</p>
                )}
              </div>
              <button
                onClick={() => removeLocation(loc.id)}
                className="text-white/20 hover:text-white/60 transition opacity-0 group-hover:opacity-100"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* AI suggestions button */}
      <button
        onClick={fetchSuggestions}
        disabled={isFetchingSuggestions}
        className="w-full bg-white text-black rounded-xl py-2.5 text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {isFetchingSuggestions ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Finding places…
          </>
        ) : (
          <>✦ Suggest places</>
        )}
      </button>
    </div>
  )
}
