'use client'

import { useMapStore } from '@/store/map'
import { useLocationStore } from '@/store/locations'
import type { Location } from '@/types/blueprint'

interface TriageResult {
  id: string
  name: string
  formatted_address: string
  description: string
  category: string[]
  coordinates: { lat: number; lng: number }
  source: { type: string; source_name: string; source_url?: string; confidence: number }
}

interface TriagePanelProps {
  results: TriageResult[]
  query: string
  onClose: () => void
}

export default function TriagePanel({ results, query, onClose }: TriagePanelProps) {
  const { addLocation } = useLocationStore()
  const { setActivePanel } = useMapStore()

  function accept(result: TriageResult) {
    const loc: Location = {
      id: result.id,
      name: result.name,
      coordinates: result.coordinates,
      category: result.category,
      notes: result.description,
      timestamp: undefined,
      photos: [],
      relationships: [],
      quantitative_values: {},
      source: result.source,
      enrichment: { formatted_address: result.formatted_address },
    }
    addLocation(loc)
  }

  function acceptAll() {
    results.forEach(accept)
    setActivePanel('building')
    onClose()
  }

  return (
    <>
      {/* Mobile: full-screen overlay */}
      <div className="lg:hidden fixed inset-0 z-20 flex flex-col bg-black/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Research results</p>
            <h2 className="text-white font-medium text-sm leading-snug max-w-[260px]">&ldquo;{query}&rdquo;</h2>
            <p className="text-white/30 text-xs mt-1">{results.length} places found — review before adding</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition text-2xl leading-none mt-0.5 px-2">×</button>
        </div>

        {/* Accept all */}
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <button
            onClick={acceptAll}
            className="w-full bg-white text-black rounded-xl py-2.5 text-sm font-medium hover:bg-white/90 transition"
          >
            Add all {results.length} to map
          </button>
        </div>

        {/* Result cards */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {results.map((result) => (
            <TriageCard key={result.id} result={result} onAccept={() => accept(result)} />
          ))}
        </div>
      </div>

      {/* Desktop: side panel */}
      <div className="hidden lg:flex flex-col absolute right-0 top-0 bottom-0 w-[420px] z-10 bg-black/85 backdrop-blur-xl border-l border-white/10">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/8">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Research results</p>
            <h2 className="text-white font-medium text-sm leading-snug max-w-[280px]">&ldquo;{query}&rdquo;</h2>
            <p className="text-white/30 text-xs mt-1">{results.length} places found — review before adding</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition text-xl leading-none mt-0.5">×</button>
        </div>

        {/* Accept all */}
        <div className="px-4 py-3 border-b border-white/8">
          <button
            onClick={acceptAll}
            className="w-full bg-white text-black rounded-xl py-2 text-sm font-medium hover:bg-white/90 transition"
          >
            Add all {results.length} to map
          </button>
        </div>

        {/* Result cards */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {results.map((result) => (
            <TriageCard key={result.id} result={result} onAccept={() => accept(result)} />
          ))}
        </div>
      </div>
    </>
  )
}

function TriageCard({ result, onAccept }: { result: TriageResult; onAccept: () => void }) {
  const confidence = Math.round((result.source.confidence ?? 0.8) * 100)

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5">
      {/* Source */}
      <div className="flex items-center gap-1.5">
        <span className="text-white/35 text-[10px] tracking-wide uppercase">{result.source.source_name}</span>
        <span className="text-white/20 text-[10px]">·</span>
        <span className="text-white/25 text-[10px]">{confidence}%</span>
      </div>

      {/* Name + address */}
      <div>
        <p className="text-white text-sm font-medium">{result.name}</p>
        <p className="text-white/40 text-xs mt-0.5">{result.formatted_address}</p>
      </div>

      {/* Description */}
      {result.description && (
        <p className="text-white/55 text-xs leading-relaxed">{result.description}</p>
      )}

      {/* Categories */}
      {result.category?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.category.map((c) => (
            <span key={c} className="text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Source URL */}
      {result.source.source_url && (
        <a
          href={result.source.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/25 text-[10px] truncate hover:text-white/50 transition"
        >
          {result.source.source_url}
        </a>
      )}

      {/* Action */}
      <button
        onClick={onAccept}
        className="w-full border border-white/20 rounded-xl py-2 text-white/70 text-xs hover:bg-white hover:text-black hover:border-white transition mt-1"
      >
        Add to map
      </button>
    </div>
  )
}
