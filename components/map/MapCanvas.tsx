'use client'

import Map, { NavigationControl, GeolocateControl, Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapStore } from '@/store/map'
import { useLocationStore } from '@/store/locations'
import RouteLayer from './RouteLayer'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// Mapbox style per artifact type — will expand with Mapbox Studio custom styles
const ARTIFACT_STYLES: Record<string, string> = {
  memory_map:       'mapbox://styles/mapbox/light-v11',
  discovery_guide:  'mapbox://styles/mapbox/streets-v12',
  data_cartography: 'mapbox://styles/mapbox/dark-v11',
  wilderness:       'mapbox://styles/mapbox/outdoors-v12',
  cinematic:        'mapbox://styles/mapbox/dark-v11',
  living_dataset:   'mapbox://styles/mapbox/dark-v11',
  trip_itinerary:   'mapbox://styles/mapbox/streets-v12',
}

export default function MapCanvas() {
  const { viewState, setViewState, activeArtifactType, setSelectedLocationId } = useMapStore()
  const { locations } = useLocationStore()

  const mapStyle = ARTIFACT_STYLES[activeArtifactType] ?? 'mapbox://styles/mapbox/streets-v12'

  return (
    <div className="absolute inset-0">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        id="main-map"
      >
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
              <div className="w-7 h-7 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                {i + 1}
              </div>
              <div className="w-0.5 h-2 bg-white/60" />
            </div>
          </Marker>
        ))}

        {/* Route polyline layer */}
        <RouteLayer />
      </Map>
    </div>
  )
}
