'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScopeOption {
  id: string
  title: string
  tagline: string
  duration_days: number
  city_count: number
  cities: string[]
  pace: string
  estimated_cost: { low: number; high: number; currency: string }
  tradeoffs: string
  highlights: string[]
}

interface TripIntent {
  id: string
  destination: string
  scope_options: ScopeOption[]
}

export default function ScopeSelector({ tripIntent }: { tripIntent: TripIntent }) {
  const router = useRouter()
  const [selected, setSelected] = useState<string>(tripIntent.scope_options[0]?.id ?? '')
  const [building, setBuilding] = useState(false)
  const [buildingMsg, setBuildingMsg] = useState('')

  const scopes = tripIntent.scope_options as ScopeOption[]

  async function build() {
    setBuilding(true)
    const messages = [
      `Building your ${tripIntent.destination}…`,
      'Selecting the right places…',
      'Thinking about timing and pacing…',
      'Almost there…',
    ]
    let i = 0
    setBuildingMsg(messages[0])
    const ticker = setInterval(() => {
      i++
      setBuildingMsg(messages[Math.min(i, messages.length - 1)])
    }, 4000)

    try {
      const res = await fetch('/api/trips/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_intent_id: tripIntent.id, scope_id: selected }),
      })
      const data = await res.json()
      clearInterval(ticker)
      if (data.blueprint_id) {
        router.push(`/app/map/${data.blueprint_id}?reveal=true`)
      }
    } catch {
      clearInterval(ticker)
      setBuilding(false)
    }
  }

  if (building) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-white/20 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-white/40" />
        </div>
        <p className="text-white/60 text-sm font-light tracking-wide">{buildingMsg}</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col">

      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-12 pb-8 max-w-3xl mx-auto w-full">
        <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Your {tripIntent.destination}</p>
        <h1 className="text-white text-3xl font-light">Three ways to do this.</h1>
        <p className="text-white/40 text-sm mt-2">Each is a different philosophy. Pick the one that feels right.</p>
      </div>

      {/* Scope cards */}
      <div className="flex-1 overflow-y-auto px-8 max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-4 pb-8">
          {scopes.map((scope, i) => {
            const isSelected = scope.id === selected
            return (
              <button
                key={scope.id}
                onClick={() => setSelected(scope.id)}
                className={`
                  text-left p-6 rounded-2xl border transition-all
                  ${isSelected
                    ? 'bg-white/8 border-white/25'
                    : 'bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15'}
                `}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/20 text-xs">{String(i + 1).padStart(2, '0')}</span>
                      <h3 className="text-white font-medium">{scope.title}</h3>
                    </div>
                    <p className="text-white/45 text-sm">{scope.tagline}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-white/60 text-sm font-medium">{scope.duration_days}d</p>
                    <p className="text-white/25 text-xs mt-0.5">
                      {scope.estimated_cost.currency}{scope.estimated_cost.low.toLocaleString()}–{scope.estimated_cost.high.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Cities */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {scope.cities?.map(city => (
                    <span key={city} className="text-xs text-white/40 bg-white/5 border border-white/8 rounded-full px-2.5 py-0.5">
                      {city}
                    </span>
                  ))}
                </div>

                {/* Highlights */}
                {isSelected && scope.highlights?.length > 0 && (
                  <div className="border-t border-white/8 pt-3 mt-3">
                    <ul className="flex flex-col gap-1.5">
                      {scope.highlights.map((h, j) => (
                        <li key={j} className="flex items-start gap-2 text-white/50 text-xs">
                          <span className="text-white/20 mt-0.5">→</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tradeoffs */}
                <p className="text-white/25 text-xs mt-3 leading-relaxed">{scope.tradeoffs}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 px-8 py-6 border-t border-white/8 max-w-3xl mx-auto w-full flex items-center justify-between">
        <p className="text-white/25 text-xs">You can refine once it's built</p>
        <button
          onClick={build}
          disabled={!selected}
          className="bg-white text-black rounded-xl px-8 py-3 text-sm font-semibold hover:bg-white/90 transition"
        >
          Build this trip →
        </button>
      </div>
    </div>
  )
}
