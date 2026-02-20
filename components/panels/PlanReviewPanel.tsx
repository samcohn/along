'use client'

import { useState } from 'react'
import { useLocationStore } from '@/store/locations'
import { useMapStore } from '@/store/map'

export interface PlanPlace {
  name: string
  address: string
  formatted_address: string
  why: string
  category: string[]
  source_url?: string
  coordinates: { lat: number; lng: number } | null
}

export interface PlanTheme {
  id: string
  name: string
  description: string
  places: PlanPlace[]
}

export interface Plan {
  title: string
  summary: string
  intent: string
  themes: PlanTheme[]
  query: string
}

interface Props {
  plan: Plan
  onClose: () => void
  onRefine: (instruction: string) => void
  refining: boolean
}

export default function PlanReviewPanel({ plan, onClose, onRefine, refining }: Props) {
  const { addLocation } = useLocationStore()
  const { setActivePanel } = useMapStore()

  // Track which places are toggled on/off
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [refineText, setRefineText] = useState('')
  const [expandedTheme, setExpandedTheme] = useState<string | null>(plan.themes[0]?.id ?? null)

  function placeKey(themeId: string, placeName: string) {
    return `${themeId}::${placeName}`
  }

  function togglePlace(themeId: string, placeName: string) {
    const key = placeKey(themeId, placeName)
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function buildMap() {
    let order = 0
    for (const theme of plan.themes) {
      for (const place of theme.places) {
        if (excluded.has(placeKey(theme.id, place.name))) continue
        if (!place.coordinates) continue
        addLocation({
          id: `plan_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: place.name,
          coordinates: place.coordinates,
          category: place.category,
          notes: place.why,
          timestamp: undefined,
          photos: [],
          relationships: [],
          quantitative_values: { order },
          source: { type: 'ai', source_name: 'Along Research', source_url: place.source_url, confidence: 0.85 },
          enrichment: { formatted_address: place.formatted_address, theme: theme.name },
        })
        order++
      }
    }
    setActivePanel('building')
    onClose()
  }

  const totalPlaces = plan.themes.reduce((n, t) => n + t.places.length, 0)
  const includedCount = plan.themes.reduce((n, t) =>
    n + t.places.filter(p => !excluded.has(placeKey(t.id, p.name))).length, 0)

  return (
    <>
      {/* ── Mobile: full-screen overlay ── */}
      <div className="lg:hidden fixed inset-0 z-20 flex flex-col bg-[#0a0a0a]">
        <PlanHeader
          plan={plan}
          onClose={onClose}
          includedCount={includedCount}
          totalPlaces={totalPlaces}
          onBuild={buildMap}
          refineText={refineText}
          setRefineText={setRefineText}
          onRefine={onRefine}
          refining={refining}
        />
        <div className="flex-1 overflow-y-auto">
          <ThemeList
            themes={plan.themes}
            excluded={excluded}
            expandedTheme={expandedTheme}
            setExpandedTheme={setExpandedTheme}
            togglePlace={togglePlace}
            placeKey={placeKey}
          />
        </div>
      </div>

      {/* ── Desktop: right panel ── */}
      <div className="hidden lg:flex flex-col absolute right-0 top-0 bottom-0 w-[420px] z-10 bg-[#0a0a0a] border-l border-white/8">
        <PlanHeader
          plan={plan}
          onClose={onClose}
          includedCount={includedCount}
          totalPlaces={totalPlaces}
          onBuild={buildMap}
          refineText={refineText}
          setRefineText={setRefineText}
          onRefine={onRefine}
          refining={refining}
        />
        <div className="flex-1 overflow-y-auto">
          <ThemeList
            themes={plan.themes}
            excluded={excluded}
            expandedTheme={expandedTheme}
            setExpandedTheme={setExpandedTheme}
            togglePlace={togglePlace}
            placeKey={placeKey}
          />
        </div>
      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlanHeader({
  plan, onClose, includedCount, totalPlaces,
  onBuild, refineText, setRefineText, onRefine, refining
}: {
  plan: Plan
  onClose: () => void
  includedCount: number
  totalPlaces: number
  onBuild: () => void
  refineText: string
  setRefineText: (v: string) => void
  onRefine: (v: string) => void
  refining: boolean
}) {
  return (
    <div className="flex-shrink-0 border-b border-white/8">
      {/* Title row */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div className="flex-1 min-w-0">
          <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1">{intentLabel(plan.intent)}</p>
          <h2 className="text-white font-semibold text-base leading-tight">{plan.title}</h2>
          <p className="text-white/40 text-xs mt-1 leading-relaxed">{plan.summary}</p>
        </div>
        <button onClick={onClose} className="text-white/25 hover:text-white/60 transition text-xl ml-3 mt-0.5 flex-shrink-0">×</button>
      </div>

      {/* Refine bar */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={refineText}
            onChange={e => setRefineText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && refineText.trim()) { onRefine(refineText); setRefineText('') } }}
            placeholder={refining ? 'Refining…' : 'Refine: "more budget-friendly" or "add day 3"'}
            disabled={refining}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/25 disabled:opacity-50 transition"
          />
          {refineText.trim() && (
            <button
              onClick={() => { onRefine(refineText); setRefineText('') }}
              disabled={refining}
              className="bg-white/10 hover:bg-white/20 text-white/70 text-xs px-3 rounded-xl transition disabled:opacity-50"
            >
              {refining ? '…' : '↵'}
            </button>
          )}
        </div>
      </div>

      {/* Build CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={onBuild}
          className="w-full bg-white text-black rounded-xl py-2.5 text-sm font-semibold hover:bg-white/90 transition"
        >
          Build map with {includedCount} place{includedCount !== 1 ? 's' : ''}
          {includedCount < totalPlaces && <span className="font-normal text-black/50 ml-1">({totalPlaces - includedCount} excluded)</span>}
        </button>
      </div>
    </div>
  )
}

function ThemeList({
  themes, excluded, expandedTheme, setExpandedTheme, togglePlace, placeKey
}: {
  themes: PlanTheme[]
  excluded: Set<string>
  expandedTheme: string | null
  setExpandedTheme: (id: string | null) => void
  togglePlace: (themeId: string, name: string) => void
  placeKey: (themeId: string, name: string) => string
}) {
  return (
    <div className="p-4 flex flex-col gap-2">
      {themes.map(theme => {
        const isOpen = expandedTheme === theme.id
        const includedInTheme = theme.places.filter(p => !excluded.has(placeKey(theme.id, p.name))).length
        return (
          <div key={theme.id} className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
            {/* Theme header */}
            <button
              onClick={() => setExpandedTheme(isOpen ? null : theme.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/4 transition"
            >
              <div>
                <p className="text-white text-sm font-medium">{theme.name}</p>
                <p className="text-white/35 text-xs mt-0.5">{theme.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className="text-white/30 text-xs">{includedInTheme}/{theme.places.length}</span>
                <svg
                  className={`w-3.5 h-3.5 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 12 12" fill="none"
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>

            {/* Places list */}
            {isOpen && (
              <div className="border-t border-white/6 divide-y divide-white/5">
                {theme.places.map(place => {
                  const key = placeKey(theme.id, place.name)
                  const isExcluded = excluded.has(key)
                  return (
                    <div
                      key={key}
                      className={`px-4 py-3 flex gap-3 transition-opacity ${isExcluded ? 'opacity-35' : 'opacity-100'}`}
                    >
                      {/* Toggle checkbox */}
                      <button
                        onClick={() => togglePlace(theme.id, place.name)}
                        className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border transition ${
                          isExcluded
                            ? 'border-white/15 bg-transparent'
                            : 'border-white/40 bg-white/90'
                        }`}
                      >
                        {!isExcluded && (
                          <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-0.5">
                            <path d="M2 6l3 3 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>

                      {/* Place info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium leading-snug">{place.name}</p>
                        <p className="text-white/35 text-[11px] mt-0.5 leading-snug">{place.formatted_address || place.address}</p>
                        <p className="text-white/50 text-[11px] mt-1 leading-relaxed">{place.why}</p>
                        {!place.coordinates && (
                          <p className="text-amber-400/60 text-[10px] mt-1">⚠ No coordinates — won't appear on map</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function intentLabel(intent: string) {
  const labels: Record<string, string> = {
    weekend_trip: 'Weekend Trip',
    day_trip: 'Day Trip',
    food_tour: 'Food Tour',
    nature: 'Nature & Outdoors',
    culture: 'Culture & Arts',
    nightlife: 'Nightlife',
    shopping: 'Shopping',
    custom: 'Custom Map',
  }
  return labels[intent] ?? 'Map Plan'
}
