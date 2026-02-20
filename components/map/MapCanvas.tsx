'use client'

import { useEffect, useRef } from 'react'
import Map, { NavigationControl, GeolocateControl, Marker, Sky } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapStore } from '@/store/map'
import { useLocationStore } from '@/store/locations'
import { PRESETS, COLOR_GRADES } from '@/lib/presets'
import RouteLayer from './RouteLayer'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// Sky gradient configs per type
const SKY_GRADIENTS = {
  clear:    { 'sky-type': 'atmosphere' as const, 'sky-atmosphere-sun': [0.0, 90.0] as [number, number], 'sky-atmosphere-sun-intensity': 15 },
  dusk:     { 'sky-type': 'gradient' as const,   'sky-gradient': ['interpolate', ['linear'], ['sky-radial-progress'], 0.8, 'rgba(135, 100, 80, 1.0)', 1, 'rgba(0, 0, 0, 1.0)'] as unknown[], 'sky-gradient-center': [0, 90] as [number, number] },
  dawn:     { 'sky-type': 'gradient' as const,   'sky-gradient': ['interpolate', ['linear'], ['sky-radial-progress'], 0.8, 'rgba(180, 140, 100, 1.0)', 1, 'rgba(20, 10, 30, 1.0)'] as unknown[], 'sky-gradient-center': [0, 90] as [number, number] },
  overcast: { 'sky-type': 'atmosphere' as const, 'sky-atmosphere-sun': [0.0, 90.0] as [number, number], 'sky-atmosphere-sun-intensity': 3 },
  night:    { 'sky-type': 'atmosphere' as const, 'sky-atmosphere-sun': [0.0, -90.0] as [number, number], 'sky-atmosphere-sun-intensity': 5 },
}

export default function MapCanvas() {
  const { viewState, setViewState, activeArtifactType, setSelectedLocationId } = useMapStore()
  const { locations } = useLocationStore()
  const mapRef = useRef<{ getMap: () => mapboxgl.Map } | null>(null)

  const preset = PRESETS[activeArtifactType]
  const atmo = preset.atmosphere_config
  const pp = preset.post_processing

  // Build CSS filter for post-processing
  const cssFilter = [
    pp.grain > 0 ? '' : '', // grain handled via SVG overlay
    pp.saturation !== 1 ? `saturate(${pp.saturation})` : '',
    pp.color_grade ? COLOR_GRADES[pp.color_grade] : '',
  ].filter(Boolean).join(' ') || 'none'

  // Terrain: enable for wilderness artifact
  useEffect(() => {
    const map = mapRef.current?.getMap?.()
    if (!map) return
    const handler = () => {
      if (activeArtifactType === 'wilderness') {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          })
        }
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })
      } else {
        map.setTerrain(null)
        if (map.getSource('mapbox-dem')) {
          map.removeSource('mapbox-dem')
        }
      }
    }
    if (map.isStyleLoaded()) handler()
    else map.once('style.load', handler)
  }, [activeArtifactType, preset.mapbox_style_url])

  // Marker color per preset
  const markerColor = (preset.decklgl_config.marker_color as string) ?? '#ffffff'

  return (
    <div className="absolute inset-0">
      {/* Post-processing: vignette + grain overlay */}
      {(pp.vignette > 0 || pp.grain > 0) && (
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: pp.vignette > 0
              ? `radial-gradient(ellipse at center, transparent ${Math.round((1 - pp.vignette) * 100)}%, rgba(0,0,0,${pp.vignette}) 100%)`
              : undefined,
          }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{ filter: cssFilter !== 'none' ? cssFilter : undefined }}
      >
        <Map
          ref={mapRef as never}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={preset.mapbox_style_url}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          id="main-map"
          fog={atmo.fog_density > 0 ? {
            color: 'rgb(186, 210, 235)',
            'high-color': 'rgb(36, 92, 223)',
            'horizon-blend': atmo.fog_density * 0.1,
            'space-color': 'rgb(11, 11, 25)',
            'star-intensity': atmo.sky_type === 'night' ? 0.6 : 0.0,
          } : undefined}
        >
          {/* Sky layer */}
          <Sky {...SKY_GRADIENTS[atmo.sky_type]} />

          <NavigationControl position="bottom-right" showCompass={false} />
          <GeolocateControl position="bottom-right" />

          {/* Location pins */}
          {locations.map((loc, i) => (
            <Marker
              key={loc.id}
              longitude={loc.coordinates.lng}
              latitude={loc.coordinates.lat}
              anchor="bottom"
              onClick={() => setSelectedLocationId(loc.id)}
            >
              <div className="flex flex-col items-center cursor-pointer group">
                <div
                  className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: markerColor, color: isLightColor(markerColor) ? '#1a1a1a' : '#ffffff' }}
                >
                  {i + 1}
                </div>
                <div className="w-0.5 h-2" style={{ backgroundColor: markerColor + '99' }} />
              </div>
            </Marker>
          ))}

          <RouteLayer />
        </Map>
      </div>
    </div>
  )
}

// Determine if a hex color is light (so we can use dark text on it)
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}
