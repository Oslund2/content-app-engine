import { useMemo } from 'react'
import { useConfig } from '../ConfigContext'
import {
  StoryMap, MapMarker, MapRoute, MapPolygon, ChoroplethLayer, FloodOverlay, MapLegendItem,
} from '../../components/map'
import { neighborhoodPolygons, getNeighborhoodCenter } from '../../components/map'

/**
 * MapBlock — Config-driven map for AI-generated stories.
 *
 * Config:
 * {
 *   type: "map",
 *   id: "flood-map",
 *   center: [39.1, -84.51],       // [lat, lng] — defaults to Cincinnati
 *   zoom: 11,
 *   height: 400,
 *   style: "light" | "dark" | "voyager",
 *   selectInput: "neighborhood",   // optional — clicking map sets this input
 *   layers: [
 *     {
 *       type: "choropleth",
 *       dataField: "risk",
 *       colorMap: { high: "#dc2626", low: "#22c55e" },
 *       neighborhoods: ["West Price Hill", "Hyde Park", ...]  // optional filter
 *     },
 *     {
 *       type: "markers",
 *       data: [
 *         { lat: 39.0968, lng: -84.5101, label: "GABP", color: "#c41230" },
 *       ]
 *     },
 *     {
 *       type: "route",
 *       coordinates: [[lng, lat], ...],
 *       color: "#c41230",
 *       width: 3,
 *       label: "Parade Route"
 *     },
 *     {
 *       type: "polygon",
 *       coordinates: [[lng, lat], ...],
 *       fillColor: "#0ea5e9",
 *       label: "Lake Area"
 *     },
 *     {
 *       type: "flood-overlay",
 *       levelInput: "simLevel",   // reads value from this input
 *       color: "#0369a1"
 *     },
 *     {
 *       type: "selected-marker",
 *       inputId: "neighborhood"   // shows a marker for the currently selected input
 *     }
 *   ],
 *   legend: [
 *     { color: "#dc2626", label: "High risk" },
 *     { color: "#22c55e", label: "Low risk", type: "dot" },
 *   ]
 * }
 */
export default function MapBlock({
  id,
  center,
  zoom = 11.5,
  height = 400,
  style = 'voyager',
  selectInput,
  layers = [],
  legend = [],
}) {
  const { inputState, setInput } = useConfig()

  const mapCenter = useMemo(() => {
    if (Array.isArray(center) && center.length === 2) {
      return { lat: center[0], lng: center[1] }
    }
    if (center?.lat && center?.lng) return center
    return { lat: 39.1031, lng: -84.5120 } // Cincinnati default
  }, [center])

  const handleMapClick = (e) => {
    if (!selectInput) return
    if (e.features?.length > 0) {
      const name = e.features[0].properties?.name
      if (name) setInput(selectInput, name)
    }
  }

  const legendContent = legend.length > 0 ? (
    <div className="space-y-1">
      {legend.map((item, i) => (
        <MapLegendItem key={i} color={item.color} label={item.label} type={item.type || 'fill'} />
      ))}
    </div>
  ) : null

  return (
    <div className="mb-8">
      <StoryMap
        center={mapCenter}
        zoom={zoom}
        height={height}
        mapStyle={style}
        onMapClick={handleMapClick}
        legend={legendContent}
      >
        {layers.map((layer, i) => (
          <MapLayerRenderer key={layer.id || `layer-${i}`} layer={layer} index={i} inputState={inputState} />
        ))}
      </StoryMap>
    </div>
  )
}

function MapLayerRenderer({ layer, index, inputState }) {
  switch (layer.type) {
    case 'choropleth': {
      const features = layer.neighborhoods
        ? neighborhoodPolygons.features.filter(f =>
            layer.neighborhoods.some(n => f.properties.name === n || f.properties.name.includes(n))
          )
        : neighborhoodPolygons.features

      // Add data from input state if dataField references inputs
      const enrichedFeatures = features.map(f => {
        const extraData = {}
        if (layer.dataField) {
          // Try to resolve from neighborhoodPolygons properties first
          if (f.properties[layer.dataField]) {
            extraData[layer.dataField] = f.properties[layer.dataField]
          }
        }
        return { ...f, properties: { ...f.properties, ...extraData } }
      })

      const selectedName = layer.selectHighlight && inputState[layer.selectHighlight]
        ? (typeof inputState[layer.selectHighlight] === 'string'
            ? inputState[layer.selectHighlight]
            : inputState[layer.selectHighlight]?.label || '')
        : ''

      return (
        <ChoroplethLayer
          geojson={{ ...neighborhoodPolygons, features: enrichedFeatures }}
          colorMap={layer.colorMap || {}}
          dataField={layer.dataField || 'name'}
          defaultColor={layer.defaultColor || '#e5e5e5'}
          selectedId={selectedName}
          selectedStrokeColor={layer.selectedColor || '#1a1a1a'}
          opacity={layer.opacity ?? 0.45}
          id={layer.id || `choropleth-${index}`}
        />
      )
    }

    case 'markers':
      return (layer.data || []).map((marker, mi) => (
        <MapMarker
          key={mi}
          lat={marker.lat}
          lng={marker.lng}
          color={marker.color || '#dc2626'}
          size={marker.size || 'md'}
          label={marker.label}
          pulse={marker.pulse}
        />
      ))

    case 'route':
      return (
        <MapRoute
          coordinates={layer.coordinates || []}
          color={layer.color || '#dc2626'}
          width={layer.width || 3}
          dashed={layer.dashed}
          id={layer.id || `route-${index}`}
        />
      )

    case 'polygon':
      return (
        <MapPolygon
          geojson={{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [...(layer.coordinates || []), (layer.coordinates || [])[0]],
              ],
            },
          }}
          fillColor={layer.fillColor || '#0ea5e9'}
          fillOpacity={layer.fillOpacity ?? 0.25}
          strokeColor={layer.strokeColor}
          id={layer.id || `polygon-${index}`}
        />
      )

    case 'flood-overlay': {
      const level = layer.levelInput ? (inputState[layer.levelInput] ?? 46) : (layer.level ?? 46)
      return <FloodOverlay level={typeof level === 'number' ? level : 46} color={layer.color || '#0369a1'} />
    }

    case 'selected-marker': {
      const val = layer.inputId ? inputState[layer.inputId] : null
      if (!val) return null
      const name = typeof val === 'string' ? val : (val?.label || '')
      const c = getNeighborhoodCenter(name)
      if (!c) return null
      return (
        <MapMarker
          lat={c.lat} lng={c.lng}
          color={layer.color || '#dc2626'}
          label={name}
          pulse
        />
      )
    }

    default:
      return null
  }
}
