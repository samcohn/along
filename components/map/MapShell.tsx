'use client'

import dynamic from 'next/dynamic'

const MapCanvas = dynamic(() => import('./MapCanvas'), { ssr: false })
const PromptBar = dynamic(() => import('./PromptBar'), { ssr: false })

export default function MapShell() {
  return (
    <>
      <MapCanvas />
      <PromptBar />
    </>
  )
}
