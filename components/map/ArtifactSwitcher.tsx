'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useMapStore } from '@/store/map'
import { ARTIFACT_META, PRESETS } from '@/lib/presets'

const VisualLibrary = dynamic(() => import('./VisualLibrary'), { ssr: false })

export default function ArtifactSwitcher() {
  const { activeArtifactType, activeBlueprintId } = useMapStore()
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [title, setTitle] = useState('Untitled Map')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(title)

  const meta = ARTIFACT_META[activeArtifactType]
  const dotColor = PRESETS[activeArtifactType].decklgl_config.marker_color as string

  async function saveTitle(newTitle: string) {
    const clean = newTitle.trim() || 'Untitled Map'
    setTitle(clean)
    setEditingTitle(false)
    if (!activeBlueprintId) return
    try {
      await fetch(`/api/blueprints/${activeBlueprintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: clean, metadata: { title: clean } }),
      })
    } catch { /* silent */ }
  }

  return (
    <>
      {/* Bottom bar: title (left) + style pill (right) */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-between px-6 pointer-events-none">

        {/* Map title — inline editable */}
        <div className="pointer-events-auto">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={() => saveTitle(titleDraft)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveTitle(titleDraft)
                if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(title) }
              }}
              className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-medium focus:outline-none focus:border-white/40 w-48"
            />
          ) : (
            <button
              onClick={() => { setTitleDraft(title); setEditingTitle(true) }}
              className="group flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 hover:border-white/25 rounded-xl px-3 py-2 transition-all"
            >
              <span className="text-white/80 text-sm font-medium group-hover:text-white transition">{title}</span>
              <svg className="w-3 h-3 text-white/20 group-hover:text-white/50 transition" viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Style pill */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setLibraryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/70 backdrop-blur-xl border border-white/15 hover:border-white/30 transition-all shadow-lg"
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
            <span className="text-white text-xs font-medium">{meta.label}</span>
            <svg className="w-3 h-3 text-white/40" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Visual Library full-screen overlay */}
      {libraryOpen && <VisualLibrary onClose={() => setLibraryOpen(false)} />}
    </>
  )
}
