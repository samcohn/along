'use client'

import { useState, useEffect, useRef } from 'react'
import { useMapStore } from '@/store/map'
import { PRESETS, ARTIFACT_META, COLOR_GRADES } from '@/lib/presets'
import type { ArtifactType } from '@/types/blueprint'

const ARTIFACT_TYPES = Object.keys(PRESETS) as ArtifactType[]

// Inspiration blurbs — what each style is for, not just what it is
const INSPIRATION: Record<ArtifactType, { tagline: string; examples: string[] }> = {
  discovery_guide:  { tagline: 'Clean. Curated. Shareable.',      examples: ['Best ramen in Tokyo', 'Hidden bars in Williamsburg', 'A friend\'s guide to Lisbon'] },
  memory_map:       { tagline: 'For maps that feel like journals.', examples: ['A month in Japan', 'Road trip summer 2024', 'Places we went together'] },
  trip_itinerary:   { tagline: 'Every stop. Every hour.',          examples: ['10 days in Italy', 'Long weekend in NYC', 'Family reunion road trip'] },
  wilderness:       { tagline: 'Where terrain is the story.',       examples: ['PCT Section J', 'Dolomites hiking routes', 'National parks bucket list'] },
  cinematic:        { tagline: 'Mood over utility.',                examples: ['Filming locations of The Bear', 'Godfather\'s Sicily', 'Late-night Tokyo'] },
  data_cartography: { tagline: 'Precision. Pattern. Signal.',       examples: ['Climate startup locations', 'Election results by precinct', 'Coffee shop density'] },
  living_dataset:   { tagline: 'Always updating. Always live.',     examples: ['Series A raises this week', 'New restaurant openings', 'Startup hiring map'] },
}

interface Props {
  onClose: () => void
}

export default function VisualLibrary({ onClose }: Props) {
  const { activeArtifactType, setActiveArtifactType } = useMapStore()
  const [hovered, setHovered] = useState<ArtifactType>(activeArtifactType)
  const [selected, setSelected] = useState<ArtifactType>(activeArtifactType)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function confirm() {
    setActiveArtifactType(selected)
    onClose()
  }

  const activePreset = PRESETS[hovered]
  const activeMeta = ARTIFACT_META[hovered]
  const activeInspo = INSPIRATION[hovered]
  const pp = activePreset.post_processing

  // Build preview CSS filter
  const previewFilter = [
    pp.saturation !== 1 ? `saturate(${pp.saturation})` : '',
    pp.color_grade ? COLOR_GRADES[pp.color_grade] : '',
  ].filter(Boolean).join(' ') || undefined

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/8 flex-shrink-0">
        <div>
          <h2 className="text-white font-semibold text-base">Visual style</h2>
          <p className="text-white/30 text-xs mt-0.5">Choose how your map tells its story</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition text-2xl leading-none">×</button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: style list */}
        <div className="w-72 flex-shrink-0 border-r border-white/8 overflow-y-auto py-4 px-3">
          {ARTIFACT_TYPES.map(type => {
            const meta = ARTIFACT_META[type]
            const preset = PRESETS[type]
            const isSelected = selected === type
            const isHovered = hovered === type
            const dotColor = preset.decklgl_config.marker_color as string

            return (
              <button
                key={type}
                onMouseEnter={() => setHovered(type)}
                onClick={() => setSelected(type)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all mb-1
                  ${isSelected ? 'bg-white/12 border border-white/20' : isHovered ? 'bg-white/6 border border-white/10' : 'border border-transparent hover:bg-white/5'}
                `}
              >
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base"
                  style={{ backgroundColor: dotColor + '22', border: `1px solid ${dotColor}44` }}>
                  <span>{meta.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-none">{meta.label}</p>
                  <p className="text-white/35 text-[11px] mt-1 leading-snug line-clamp-1">{INSPIRATION[type].tagline}</p>
                </div>
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Right: preview + detail */}
        <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">

          {/* Map style preview — simulated with the right bg color + filter */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{ filter: previewFilter }}
          >
            {/* Background representing the map style */}
            <MapStyleMock artifactType={hovered} />

            {/* Overlay with mood text */}
            <div className="absolute inset-0 flex flex-col justify-end p-8"
              style={{
                background: pp.vignette > 0
                  ? `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${pp.vignette * 0.8}) 100%)`
                  : 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)'
              }}
            >
              <p className="text-white/50 text-xs uppercase tracking-widest mb-2">{activeMeta.emoji} {activeMeta.label}</p>
              <h3 className="text-white text-2xl font-semibold leading-tight mb-2">{activeInspo.tagline}</h3>
              <p className="text-white/50 text-sm">{activeMeta.description}</p>
            </div>
          </div>

          {/* Example use cases */}
          <div className="flex-shrink-0 border-t border-white/8 px-8 py-5 flex items-center justify-between gap-8">
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Great for</p>
              <div className="flex flex-wrap gap-2">
                {activeInspo.examples.map(ex => (
                  <span key={ex} className="text-white/50 text-xs bg-white/6 border border-white/10 rounded-full px-3 py-1">
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={confirm}
              className={`
                flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${selected !== activeArtifactType
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-white/10 text-white/50 cursor-default'}
              `}
            >
              {selected === activeArtifactType ? 'Current style' : `Apply ${ARTIFACT_META[selected].label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simulated map backgrounds per style — avoids loading a full Mapbox instance in the picker
function MapStyleMock({ artifactType }: { artifactType: ArtifactType }) {
  const configs: Record<ArtifactType, { bg: string; grid: string; dots: Array<{x: number; y: number; size: number}> }> = {
    discovery_guide:  { bg: '#f5f0eb', grid: 'rgba(0,0,0,0.06)', dots: [{x:30,y:40,size:10},{x:55,y:25,size:8},{x:70,y:60,size:12},{x:45,y:70,size:9}] },
    memory_map:       { bg: '#e8ddd0', grid: 'rgba(0,0,0,0.04)', dots: [{x:35,y:35,size:12},{x:60,y:50,size:10},{x:50,y:65,size:8},{x:25,y:60,size:11}] },
    trip_itinerary:   { bg: '#e8eef5', grid: 'rgba(0,0,50,0.07)', dots: [{x:20,y:30,size:10},{x:40,y:45,size:10},{x:60,y:35,size:10},{x:75,y:55,size:10},{x:55,y:70,size:10}] },
    wilderness:       { bg: '#d4e4d0', grid: 'rgba(0,40,0,0.06)', dots: [{x:40,y:30,size:9},{x:60,y:55,size:11},{x:30,y:65,size:8}] },
    cinematic:        { bg: '#1a1612', grid: 'rgba(255,255,255,0.03)', dots: [{x:35,y:40,size:10},{x:65,y:55,size:12},{x:50,y:30,size:8}] },
    data_cartography: { bg: '#0d1117', grid: 'rgba(0,200,255,0.08)', dots: [{x:25,y:35,size:6},{x:45,y:55,size:5},{x:60,y:40,size:7},{x:75,y:65,size:5},{x:35,y:70,size:6},{x:55,y:25,size:5}] },
    living_dataset:   { bg: '#0a0f0a', grid: 'rgba(16,185,129,0.06)', dots: [{x:30,y:40,size:6},{x:50,y:30,size:5},{x:65,y:55,size:7},{x:40,y:65,size:5},{x:70,y:35,size:6}] },
  }

  const c = configs[artifactType]
  const markerColor = PRESETS[artifactType].decklgl_config.marker_color as string

  return (
    <div className="absolute inset-0 transition-colors duration-500" style={{ backgroundColor: c.bg }}>
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d={`M 40 0 L 0 0 0 40`} fill="none" stroke={c.grid} strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* Roads */}
        <line x1="0%" y1="45%" x2="100%" y2="52%" stroke={c.grid} strokeWidth="2" opacity="0.5"/>
        <line x1="30%" y1="0%" x2="35%" y2="100%" stroke={c.grid} strokeWidth="1.5" opacity="0.4"/>
        <line x1="65%" y1="0%" x2="60%" y2="100%" stroke={c.grid} strokeWidth="1" opacity="0.3"/>
        {/* Pins */}
        {c.dots.map((dot, i) => (
          <g key={i}>
            <circle cx={`${dot.x}%`} cy={`${dot.y}%`} r={dot.size} fill={markerColor} opacity="0.9"/>
            <circle cx={`${dot.x}%`} cy={`${dot.y}%`} r={dot.size * 0.55} fill="white" opacity="0.9"/>
            <text x={`${dot.x}%`} y={`${dot.y}%`} textAnchor="middle" dominantBaseline="central" fontSize={dot.size * 0.8} fill={markerColor} fontWeight="bold">{i+1}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}
