'use client'

import { useState } from 'react'
import { useMapStore } from '@/store/map'
import { ARTIFACT_META, PRESETS } from '@/lib/presets'
import type { ArtifactType } from '@/types/blueprint'

const ARTIFACT_TYPES = Object.keys(PRESETS) as ArtifactType[]

export default function ArtifactSwitcher() {
  const { activeArtifactType, setActiveArtifactType } = useMapStore()
  const [open, setOpen] = useState(false)

  const active = ARTIFACT_META[activeArtifactType]

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">

      {/* Expanded picker */}
      {open && (
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5 w-64 shadow-2xl">
          <p className="text-white/30 text-[10px] uppercase tracking-widest px-2 pb-1">Visual style</p>
          {ARTIFACT_TYPES.map(type => {
            const meta = ARTIFACT_META[type]
            const preset = PRESETS[type]
            const isActive = type === activeArtifactType
            return (
              <button
                key={type}
                onClick={() => { setActiveArtifactType(type); setOpen(false) }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                  ${isActive ? 'bg-white/15 border border-white/20' : 'hover:bg-white/8 border border-transparent'}
                `}
              >
                {/* Color swatch from marker color */}
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 border border-white/20"
                  style={{ backgroundColor: preset.decklgl_config.marker_color as string }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium leading-none">{meta.label}</p>
                  <p className="text-white/35 text-[10px] mt-0.5 leading-snug truncate">{meta.description}</p>
                </div>
                {isActive && (
                  <svg className="w-3.5 h-3.5 text-white/60 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Pill button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-full
          bg-black/70 backdrop-blur-xl border transition-all duration-200 shadow-lg
          ${open ? 'border-white/30 bg-black/85' : 'border-white/15 hover:border-white/30'}
        `}
      >
        {/* Active color dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: PRESETS[activeArtifactType].decklgl_config.marker_color as string }}
        />
        <span className="text-white text-xs font-medium">{active.label}</span>
        <svg
          className={`w-3 h-3 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

    </div>
  )
}
