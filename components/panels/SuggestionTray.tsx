'use client'

import { useLocationStore } from '@/store/locations'
import { useMapStore } from '@/store/map'

export default function SuggestionTray() {
  const { activePanel, setActivePanel } = useMapStore()
  const { suggestions, acceptSuggestion, dismissSuggestion, isFetchingSuggestions } = useLocationStore()

  const isOpen = activePanel === 'suggestions'
  if (!isOpen) return null

  return (
    <>
      {/* Desktop: right-edge vertical tray */}
      <div className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 flex-col gap-3 w-72">
        <TrayHeader onClose={() => setActivePanel('building')} />
        {isFetchingSuggestions ? (
          <LoadingCards />
        ) : suggestions.length === 0 ? (
          <EmptyState onClose={() => setActivePanel('building')} />
        ) : (
          suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={() => { acceptSuggestion(s.id); setActivePanel('building') }}
              onDismiss={() => dismissSuggestion(s.id)}
            />
          ))
        )}
      </div>

      {/* Mobile: horizontal scroll row above prompt bar */}
      <div className="lg:hidden absolute bottom-24 left-0 right-0 z-10 px-4">
        <TrayHeader onClose={() => setActivePanel('building')} />
        <div className="flex gap-3 overflow-x-auto pb-2 mt-2 snap-x">
          {isFetchingSuggestions ? (
            <LoadingCards horizontal />
          ) : suggestions.length === 0 ? (
            <EmptyState onClose={() => setActivePanel('building')} />
          ) : (
            suggestions.map((s) => (
              <div key={s.id} className="snap-start flex-shrink-0 w-64">
                <SuggestionCard
                  suggestion={s}
                  onAccept={() => { acceptSuggestion(s.id); setActivePanel('building') }}
                  onDismiss={() => dismissSuggestion(s.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

function TrayHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <p className="text-white/50 text-xs font-medium tracking-wide uppercase">AI Suggestions</p>
      <button onClick={onClose} className="text-white/30 hover:text-white transition text-xs">
        ← Back
      </button>
    </div>
  )
}

function LoadingCards({ horizontal }: { horizontal?: boolean }) {
  return (
    <div className={`flex ${horizontal ? 'flex-row gap-3' : 'flex-col gap-3'}`}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse w-full min-h-[120px]" />
      ))}
    </div>
  )
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center py-8 text-white/30 text-sm">
      No suggestions yet.{' '}
      <button onClick={onClose} className="text-white/50 hover:text-white underline transition">
        Go back
      </button>
    </div>
  )
}

interface SuggestionCardProps {
  suggestion: ReturnType<typeof useLocationStore.getState>['suggestions'][number]
  onAccept: () => void
  onDismiss: () => void
}

function SuggestionCard({ suggestion, onAccept, onDismiss }: SuggestionCardProps) {
  const confidence = Math.round((suggestion.source.confidence ?? 0.8) * 100)
  const sourceLabel = suggestion.source.source_name ?? 'Along AI'

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl p-4 flex flex-col gap-3">
      {/* Source badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-white/40 text-[10px] tracking-wide uppercase">{sourceLabel}</span>
        <span className="text-white/20 text-[10px]">·</span>
        <span className="text-white/30 text-[10px]">{confidence}% match</span>
      </div>

      {/* Place info */}
      <div>
        <p className="text-white font-medium text-sm">{suggestion.name}</p>
        {suggestion.category.length > 0 && (
          <p className="text-white/40 text-xs mt-0.5">{suggestion.category.join(' · ')}</p>
        )}
        {suggestion.notes && (
          <p className="text-white/60 text-xs mt-1.5 leading-relaxed">{suggestion.notes}</p>
        )}
      </div>

      {/* Duration */}
      {suggestion.estimated_duration_minutes && (
        <p className="text-white/30 text-xs">
          ~{suggestion.estimated_duration_minutes} min
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onAccept}
          className="flex-1 bg-white text-black rounded-lg py-2 text-xs font-medium hover:bg-white/90 transition"
        >
          Add to map
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-2 border border-white/15 rounded-lg text-white/40 text-xs hover:border-white/30 hover:text-white/60 transition"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
