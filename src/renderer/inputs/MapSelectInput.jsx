import { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import {
  StoryMap, MapMarker, ChoroplethLayer, MapLegendItem,
} from '../../components/map'
import { neighborhoodPolygons, getNeighborhoodCenter } from '../../components/map'

/**
 * MapSelectInput — A map-based input where clicking a region selects it.
 * Works as a drop-in replacement for ButtonArrayInput/DropdownInput.
 *
 * Config:
 * {
 *   id: "neighborhood",
 *   type: "map-select",
 *   label: "Select your neighborhood",
 *   helpText: "Click the map to choose",
 *   center: [39.1, -84.51],
 *   zoom: 11.5,
 *   height: 350,
 *   options: [
 *     { id: "hyde-park", label: "Hyde Park", data: { safety: 62 } },
 *     { id: "price-hill", label: "Price Hill", data: { safety: 20 } },
 *   ],
 *   colorField: "safety",        // optional: color regions by this data field
 *   colorScale: {                 // optional: value ranges to colors
 *     high: { min: 50, color: "#22c55e" },
 *     mid:  { min: 30, color: "#f59e0b" },
 *     low:  { min: 0,  color: "#dc2626" },
 *   },
 *   accentColor: "#dc2626",      // theme color
 * }
 */
export default function MapSelectInput({
  id,
  label,
  helpText,
  options = [],
  value,
  onChange,
  center,
  zoom = 11.5,
  height = 350,
  colorField,
  colorScale,
  accentColor = '#dc2626',
}) {
  const mapCenter = useMemo(() => {
    if (Array.isArray(center) && center.length === 2) {
      return { lat: center[0], lng: center[1] }
    }
    if (center?.lat && center?.lng) return center
    return { lat: 39.1031, lng: -84.5120 }
  }, [center])

  // Build color map for choropleth
  const colorMap = useMemo(() => {
    if (!colorField || !colorScale) {
      // Default: all same color
      const map = {}
      options.forEach(opt => {
        map[opt.label || opt.id] = accentColor + '60'
      })
      return map
    }
    const map = {}
    const scales = Object.values(colorScale).sort((a, b) => b.min - a.min)
    options.forEach(opt => {
      const val = opt.data?.[colorField] ?? 0
      const matched = scales.find(s => val >= s.min)
      map[opt.label || opt.id] = matched ? matched.color : '#e5e5e5'
    })
    return map
  }, [options, colorField, colorScale, accentColor])

  // Filter polygon features to only include configured options
  const filteredGeo = useMemo(() => ({
    ...neighborhoodPolygons,
    features: neighborhoodPolygons.features.filter(f =>
      options.some(opt =>
        f.properties.name === (opt.label || opt.id) ||
        f.properties.name.includes(opt.label || opt.id) ||
        (opt.label || opt.id).includes(f.properties.name)
      )
    ),
  }), [options])

  const selectedLabel = useMemo(() => {
    if (!value) return ''
    if (typeof value === 'string') {
      const opt = options.find(o => o.id === value || o.label === value)
      return opt?.label || value
    }
    return value?.label || ''
  }, [value, options])

  const handleMapClick = useCallback((e) => {
    if (e.features?.length > 0) {
      const name = e.features[0].properties?.name
      if (!name) return
      const opt = options.find(o =>
        (o.label || o.id) === name ||
        name.includes(o.label || o.id) ||
        (o.label || o.id).includes(name)
      )
      if (opt && onChange) {
        onChange(opt.id, opt.data || opt)
      }
    }
  }, [options, onChange])

  return (
    <div className="mb-8">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
          {label}
        </label>
      )}
      {helpText && <p className="text-sm text-ink-light mb-3">{helpText}</p>}

      <StoryMap
        center={mapCenter}
        zoom={zoom}
        height={height}
        accentColor={accentColor}
        onMapClick={handleMapClick}
        legend={
          selectedLabel ? (
            <div className="flex items-center gap-2">
              <MapPin size={12} style={{ color: accentColor }} />
              <span className="text-[11px] font-semibold text-ink">{selectedLabel}</span>
            </div>
          ) : (
            <span className="text-[10px] text-ink-muted">Click a region to select</span>
          )
        }
      >
        <ChoroplethLayer
          geojson={filteredGeo}
          colorMap={colorMap}
          dataField="name"
          defaultColor="#e5e5e540"
          selectedId={selectedLabel}
          selectedStrokeColor={accentColor}
          opacity={0.45}
          hoverOpacity={0.65}
          id={`map-select-${id}`}
        />

        {/* Selected marker */}
        {selectedLabel && (() => {
          const c = getNeighborhoodCenter(selectedLabel)
          return c ? (
            <MapMarker lat={c.lat} lng={c.lng} color={accentColor} label={selectedLabel} pulse />
          ) : null
        })()}
      </StoryMap>

      {/* Fallback dropdown for accessibility */}
      <select
        value={typeof value === 'string' ? value : (value?.id || '')}
        onChange={(e) => {
          const opt = options.find(o => o.id === e.target.value)
          if (opt && onChange) onChange(opt.id, opt.data || opt)
        }}
        className="w-full mt-2 px-3 py-2 rounded-lg border border-rule bg-white text-ink text-xs focus:outline-none"
        style={{ borderColor: value ? accentColor + '60' : undefined }}
      >
        <option value="">Or select from list...</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.label || opt.id}</option>
        ))}
      </select>
    </div>
  )
}
