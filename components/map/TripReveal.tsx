'use client'

import { useEffect, useState } from 'react'
import { useLocationStore } from '@/store/locations'
import { useMapStore } from '@/store/map'

// TripReveal — plays a cinematic "your trip materializes" animation
// when the map is first loaded with ?reveal=true.
// Pins drop one by one, map flies through each city.
export default function TripReveal({ onComplete }: { onComplete: () => void }) {
  const { locations } = useLocationStore()
  const { setViewState, viewState } = useMapStore()
  const [visibleCount, setVisibleCount] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'dropping' | 'done'>('intro')
  const [currentLabel, setCurrentLabel] = useState('')

  useEffect(() => {
    if (!locations.length) return

    // Phase 1: brief intro hold
    const introTimer = setTimeout(() => {
      setPhase('dropping')

      // Fly to first location
      if (locations[0]) {
        setViewState({
          ...viewState,
          latitude: locations[0].coordinates.lat,
          longitude: locations[0].coordinates.lng,
          zoom: 13,
          pitch: 45,
          bearing: -15,
        })
      }

      // Drop pins one by one
      let i = 0
      const drop = () => {
        if (i >= locations.length) {
          setPhase('done')
          setTimeout(onComplete, 1500)
          return
        }
        setVisibleCount(i + 1)
        setCurrentLabel(locations[i].name)

        // Gently pan to each pin
        if (locations[i].coordinates) {
          setViewState(prev => ({
            ...prev,
            latitude: locations[i].coordinates.lat + 0.002,
            longitude: locations[i].coordinates.lng,
            zoom: 13.5,
          }))
        }

        i++
        setTimeout(drop, i < 5 ? 600 : 300) // slower for first few
      }
      drop()
    }, 1800)

    return () => clearTimeout(introTimer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations.length])

  if (phase === 'done') return null

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center">

      {/* Cinematic top/bottom bars */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

      {phase === 'intro' && (
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-white/50" />
          </div>
          <p className="text-white/60 text-sm font-light tracking-widest uppercase">Your trip</p>
        </div>
      )}

      {phase === 'dropping' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <p className="text-white text-sm font-light tracking-wide opacity-90">{currentLabel}</p>
          <p className="text-white/30 text-xs">{visibleCount} of {locations.length}</p>
          {/* Progress dots */}
          <div className="flex gap-1 mt-1">
            {locations.slice(0, Math.min(locations.length, 12)).map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: i < visibleCount ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
