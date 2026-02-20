'use client'

import dynamic from 'next/dynamic'

// SSR disabled — all map components require browser APIs
const MapCanvas      = dynamic(() => import('./MapCanvas'), { ssr: false })
const PromptBar      = dynamic(() => import('./PromptBar'), { ssr: false })
const BuildingPanel  = dynamic(() => import('@/components/panels/BuildingPanel'), { ssr: false })
const SuggestionTray = dynamic(() => import('@/components/panels/SuggestionTray'), { ssr: false })

export default function MapShell() {
  return (
    <>
      {/* Map is always the bottom layer */}
      <MapCanvas />

      {/* Floating UI — layered on top, never fully occluding the map */}
      <PromptBar />
      <BuildingPanel />
      <SuggestionTray />
    </>
  )
}
