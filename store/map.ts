import { create } from 'zustand'
import type { ArtifactType } from '@/types/blueprint'

export type UIPanel = 'none' | 'building' | 'suggestions' | 'artifact'

interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

interface MapStore {
  // Map view
  viewState: ViewState
  setViewState: (vs: ViewState) => void

  // Active blueprint
  activeBlueprintId: string | null
  setActiveBlueprintId: (id: string | null) => void

  // Active artifact type
  activeArtifactType: ArtifactType
  setActiveArtifactType: (type: ArtifactType) => void

  // UI panel state (Discovery → Building → Suggestions → Artifact)
  activePanel: UIPanel
  setActivePanel: (panel: UIPanel) => void

  // Selected location
  selectedLocationId: string | null
  setSelectedLocationId: (id: string | null) => void
}

export const useMapStore = create<MapStore>((set) => ({
  viewState: {
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 12,
    pitch: 0,
    bearing: 0,
  },
  setViewState: (viewState) => set({ viewState }),

  activeBlueprintId: null,
  setActiveBlueprintId: (id) => set({ activeBlueprintId: id }),

  activeArtifactType: 'discovery_guide',
  setActiveArtifactType: (type) => set({ activeArtifactType: type }),

  activePanel: 'none',
  setActivePanel: (panel) => set({ activePanel: panel }),

  selectedLocationId: null,
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
}))
