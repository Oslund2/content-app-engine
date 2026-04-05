import { useState, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Maximize2, Minimize2, Layers } from 'lucide-react'

// Lazy-load maplibre to keep initial bundle small
const MapGL = lazy(() => import('react-map-gl/maplibre'))

// MapLibre style — clean, free, no API key
const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
}

// Cincinnati defaults
const CINCY_CENTER = { latitude: 39.1031, longitude: -84.5120 }
const DEFAULT_ZOOM = 11.5

/**
 * StoryMap — The shared map component for all story apps.
 *
 * Props:
 * - center: { lat, lng } — map center (defaults to Cincinnati)
 * - zoom: number — initial zoom (default 11.5)
 * - mapStyle: 'light' | 'dark' | 'voyager'
 * - height: number | string — map height (default 380)
 * - accentColor: string — theme color for highlights
 * - interactive: boolean — allow pan/zoom (default true)
 * - expandable: boolean — show expand/collapse toggle
 * - children: map overlay content (layers, markers, etc.)
 * - className: additional CSS classes
 * - legend: ReactNode — legend content to overlay
 * - onMapClick: (e) => void — click handler
 * - attribution: string — optional source attribution
 */
export default function StoryMap({
  center,
  zoom = DEFAULT_ZOOM,
  mapStyle = 'voyager',
  height = 380,
  accentColor = '#dc2626',
  interactive = true,
  expandable = true,
  children,
  className = '',
  legend,
  onMapClick,
  attribution,
}) {
  const [expanded, setExpanded] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const mapRef = useRef(null)

  const viewState = useMemo(() => ({
    latitude: center?.lat ?? CINCY_CENTER.latitude,
    longitude: center?.lng ?? CINCY_CENTER.longitude,
    zoom,
  }), [center, zoom])

  const [vs, setVs] = useState(viewState)

  // Update view when center/zoom props change
  useEffect(() => {
    setVs(viewState)
  }, [viewState])

  const mapHeight = expanded ? '70vh' : (typeof height === 'number' ? `${height}px` : height)

  const styleUrl = MAP_STYLES[mapStyle] || MAP_STYLES.voyager

  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <div className={`relative rounded-xl overflow-hidden border border-rule bg-paper-warm mb-6 ${className}`}>
      {/* Loading skeleton */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-paper-warm"
            style={{ height: mapHeight }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
              <span className="text-xs text-ink-muted">Loading map...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={
        <div className="flex items-center justify-center bg-paper-warm" style={{ height: mapHeight }}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
            <span className="text-xs text-ink-muted">Loading map...</span>
          </div>
        </div>
      }>
        <div style={{ height: mapHeight }} className="transition-[height] duration-300">
          <MapGL
            ref={mapRef}
            {...vs}
            onMove={evt => setVs(evt.viewState)}
            onClick={onMapClick}
            onLoad={handleLoad}
            mapStyle={styleUrl}
            style={{ width: '100%', height: '100%' }}
            scrollZoom={interactive}
            dragPan={interactive}
            dragRotate={false}
            touchZoomRotate={interactive}
            doubleClickZoom={interactive}
            attributionControl={false}
          >
            {children}
          </MapGL>
        </div>
      </Suspense>

      {/* Controls overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
        {expandable && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur border border-rule shadow-sm
                       flex items-center justify-center hover:bg-white transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 size={14} className="text-ink" /> : <Maximize2 size={14} className="text-ink" />}
          </button>
        )}
      </div>

      {/* Legend overlay */}
      {legend && (
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur rounded-lg border border-rule shadow-sm px-3 py-2 max-w-[220px]">
          {legend}
        </div>
      )}

      {/* Attribution */}
      {attribution && (
        <div className="absolute bottom-1 right-1 z-10 text-[9px] text-ink-muted/50 bg-white/60 px-1 rounded">
          {attribution}
        </div>
      )}
    </div>
  )
}

/**
 * MapMarker — A styled pin marker for the map.
 */
export function MapMarker({ lat, lng, color = '#dc2626', size = 'md', pulse = false, label, onClick, children }) {
  const Marker = lazy(() => import('react-map-gl/maplibre').then(m => ({ default: m.Marker })))
  const sizes = { sm: 20, md: 28, lg: 36 }
  const s = sizes[size] || sizes.md

  return (
    <Suspense fallback={null}>
      <Marker latitude={lat} longitude={lng} anchor="bottom" onClick={onClick}>
        <div className="relative flex flex-col items-center cursor-pointer group">
          {pulse && (
            <div className="absolute -inset-2 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }} />
          )}
          <div
            className="rounded-full shadow-lg border-2 border-white flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ width: s, height: s, backgroundColor: color }}
          >
            {children || <MapPin size={s * 0.5} className="text-white" />}
          </div>
          {label && (
            <div className="mt-1 px-2 py-0.5 rounded bg-white/95 shadow-sm border border-rule text-[10px] font-semibold text-ink whitespace-nowrap">
              {label}
            </div>
          )}
        </div>
      </Marker>
    </Suspense>
  )
}

/**
 * MapRoute — A polyline on the map.
 */
export function MapRoute({ coordinates, color = '#dc2626', width = 3, dashed = false, id }) {
  const { Source, Layer } = useLazyMapParts()
  if (!Source) return null

  const geojson = useMemo(() => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates, // [[lng, lat], ...]
    },
  }), [coordinates])

  const layerId = id || `route-${color.replace('#', '')}`

  return (
    <Source id={layerId} type="geojson" data={geojson}>
      <Layer
        id={layerId}
        type="line"
        paint={{
          'line-color': color,
          'line-width': width,
          'line-opacity': 0.85,
          ...(dashed ? { 'line-dasharray': [2, 2] } : {}),
        }}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
      />
    </Source>
  )
}

/**
 * MapPolygon — A filled polygon area on the map.
 */
export function MapPolygon({ geojson, fillColor = '#dc2626', fillOpacity = 0.15, strokeColor, strokeWidth = 1.5, id, onClick }) {
  const { Source, Layer } = useLazyMapParts()
  if (!Source) return null

  const layerId = id || `polygon-${fillColor.replace('#', '')}`

  return (
    <Source id={layerId} type="geojson" data={geojson}>
      <Layer
        id={`${layerId}-fill`}
        type="fill"
        paint={{
          'fill-color': fillColor,
          'fill-opacity': fillOpacity,
        }}
      />
      <Layer
        id={`${layerId}-stroke`}
        type="line"
        paint={{
          'line-color': strokeColor || fillColor,
          'line-width': strokeWidth,
          'line-opacity': 0.7,
        }}
      />
    </Source>
  )
}

/**
 * ChoroplethLayer — Renders a GeoJSON FeatureCollection with data-driven fill colors.
 */
export function ChoroplethLayer({
  geojson,
  colorMap = {},
  dataField = 'value',
  defaultColor = '#e5e5e5',
  selectedId,
  selectedStrokeColor = '#1a1a1a',
  strokeWidth = 1,
  opacity = 0.45,
  hoverOpacity = 0.65,
  id = 'choropleth',
  onClick,
}) {
  const { Source, Layer } = useLazyMapParts()
  const [hoveredId, setHoveredId] = useState(null)
  if (!Source) return null

  // Inject colors into feature properties for data-driven styling
  const coloredGeo = useMemo(() => {
    if (!geojson?.features) return geojson
    return {
      ...geojson,
      features: geojson.features.map((f, i) => ({
        ...f,
        id: i,
        properties: {
          ...f.properties,
          _fillColor: colorMap[f.properties[dataField]] || colorMap[f.properties.name] || colorMap[f.properties.id] || defaultColor,
          _id: f.properties.id || f.properties.name || i,
        },
      })),
    }
  }, [geojson, colorMap, dataField, defaultColor])

  return (
    <Source id={id} type="geojson" data={coloredGeo}>
      <Layer
        id={`${id}-fill`}
        type="fill"
        paint={{
          'fill-color': ['get', '_fillColor'],
          'fill-opacity': [
            'case',
            ['==', ['get', '_id'], selectedId || ''], 0.7,
            ['==', ['get', '_id'], hoveredId || ''], hoverOpacity,
            opacity,
          ],
        }}
      />
      <Layer
        id={`${id}-stroke`}
        type="line"
        paint={{
          'line-color': [
            'case',
            ['==', ['get', '_id'], selectedId || ''], selectedStrokeColor,
            '#666666',
          ],
          'line-width': [
            'case',
            ['==', ['get', '_id'], selectedId || ''], strokeWidth + 1.5,
            strokeWidth,
          ],
          'line-opacity': 0.6,
        }}
      />
    </Source>
  )
}

/**
 * FloodOverlay — Animated water level visualization for the FloodRisk story.
 */
export function FloodOverlay({ level, maxLevel = 66, color = '#0369a1' }) {
  const { Source, Layer } = useLazyMapParts()
  if (!Source) return null

  // Opacity and extent scale with flood level
  const intensity = Math.max(0, Math.min(1, (level - 38) / (maxLevel - 38)))

  const geojson = useMemo(() => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-84.6500, 39.0820], [-84.6200, 39.0800], [-84.5900, 39.0790],
        [-84.5600, 39.0800], [-84.5300, 39.0820], [-84.5100, 39.0860],
        [-84.4900, 39.0870], [-84.4700, 39.0850], [-84.4500, 39.0840],
        [-84.4200, 39.0820], [-84.3600, 39.0790],
        // North extent scales with level
        [-84.3600, 39.0790 + intensity * 0.025],
        [-84.4200, 39.0820 + intensity * 0.025],
        [-84.4500, 39.0840 + intensity * 0.025],
        [-84.4700, 39.0850 + intensity * 0.025],
        [-84.4900, 39.0870 + intensity * 0.025],
        [-84.5100, 39.0860 + intensity * 0.025],
        [-84.5300, 39.0820 + intensity * 0.025],
        [-84.5600, 39.0800 + intensity * 0.025],
        [-84.5900, 39.0790 + intensity * 0.025],
        [-84.6200, 39.0800 + intensity * 0.025],
        [-84.6500, 39.0820 + intensity * 0.025],
        [-84.6500, 39.0820],
      ]],
    },
  }), [intensity])

  return (
    <Source id="flood-water" type="geojson" data={geojson}>
      <Layer
        id="flood-water-fill"
        type="fill"
        paint={{
          'fill-color': color,
          'fill-opacity': 0.15 + intensity * 0.35,
        }}
      />
      <Layer
        id="flood-water-stroke"
        type="line"
        paint={{
          'line-color': color,
          'line-width': 1.5,
          'line-opacity': 0.4 + intensity * 0.4,
        }}
      />
    </Source>
  )
}

// ── Helper: lazy-load Source and Layer from react-map-gl ─────────────
function useLazyMapParts() {
  const [parts, setParts] = useState({ Source: null, Layer: null })
  useEffect(() => {
    import('react-map-gl/maplibre').then(mod => {
      setParts({ Source: mod.Source, Layer: mod.Layer })
    })
  }, [])
  return parts
}

// ── MapLegendItem helper ──────────────────────────────────────────────
export function MapLegendItem({ color, label, type = 'fill' }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-ink-muted">
      {type === 'fill' && (
        <span className="w-3 h-3 rounded-sm border border-black/10 shrink-0" style={{ backgroundColor: color }} />
      )}
      {type === 'line' && (
        <span className="w-4 h-0.5 shrink-0 rounded" style={{ backgroundColor: color }} />
      )}
      {type === 'dot' && (
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
      <span>{label}</span>
    </div>
  )
}
