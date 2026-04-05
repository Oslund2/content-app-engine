/**
 * Cincinnati neighborhood GeoJSON — simplified polygons for map overlays.
 * Coordinates are approximate centroids + bounding shapes for visualization.
 * Source reference: Cincinnati Open Data / US Census TIGER.
 */

// Neighborhood centroids for marker placement
export const neighborhoodCentroids = {
  // Cincinnati proper
  'Downtown / OTR':           { lat: 39.1085, lng: -84.5125 },
  'downtown-otr':             { lat: 39.1085, lng: -84.5125 },
  'Over-the-Rhine':           { lat: 39.1130, lng: -84.5180 },
  'Clifton':                  { lat: 39.1420, lng: -84.5230 },
  'Clifton / UC Area':        { lat: 39.1420, lng: -84.5230 },
  'Clifton / CUF':            { lat: 39.1420, lng: -84.5230 },
  'Clifton / Northside (Upland)': { lat: 39.1500, lng: -84.5350 },
  'Hyde Park':                { lat: 39.1390, lng: -84.4560 },
  'Hyde Park / Oakley':       { lat: 39.1390, lng: -84.4560 },
  'Mt. Auburn':               { lat: 39.1170, lng: -84.5010 },
  'Westwood':                 { lat: 39.1280, lng: -84.5920 },
  'West Price Hill':          { lat: 39.1100, lng: -84.5720 },
  'East Price Hill':          { lat: 39.1050, lng: -84.5420 },
  'Price Hill':               { lat: 39.1080, lng: -84.5580 },
  'Walnut Hills':             { lat: 39.1280, lng: -84.4870 },
  'Northside':                { lat: 39.1530, lng: -84.5450 },
  'Avondale':                 { lat: 39.1370, lng: -84.4980 },
  'Madisonville':             { lat: 39.1560, lng: -84.4220 },
  'Mt. Washington':           { lat: 39.1100, lng: -84.3900 },
  'Anderson Twp':             { lat: 39.0770, lng: -84.3650 },
  'Anderson / Mt. Washington': { lat: 39.0930, lng: -84.3780 },
  'Bond Hill':                { lat: 39.1700, lng: -84.4700 },
  'Roselawn':                 { lat: 39.1810, lng: -84.4580 },
  'College Hill':             { lat: 39.1870, lng: -84.5470 },
  'Carthage':                 { lat: 39.1950, lng: -84.4840 },
  'Winton Place':             { lat: 39.1720, lng: -84.5150 },
  'Spring Grove':             { lat: 39.1780, lng: -84.5280 },
  'Mt. Airy':                 { lat: 39.1730, lng: -84.5650 },
  'South Fairmount':          { lat: 39.1160, lng: -84.5500 },
  'North Fairmount':          { lat: 39.1270, lng: -84.5530 },
  'Camp Washington':          { lat: 39.1340, lng: -84.5400 },
  'Evanston':                 { lat: 39.1500, lng: -84.4750 },
  'Sedamsville':              { lat: 39.1010, lng: -84.5680 },
  'East End':                 { lat: 39.1020, lng: -84.4500 },
  'East End / Columbia Tusculum': { lat: 39.1020, lng: -84.4500 },
  'Riverside / Sayler Park':  { lat: 39.0880, lng: -84.6100 },

  // Northern Kentucky
  'Covington':                { lat: 39.0840, lng: -84.5080 },
  'Covington / Newport (NKY)': { lat: 39.0810, lng: -84.4950 },
  'Newport':                  { lat: 39.0910, lng: -84.4920 },
  'Bellevue':                 { lat: 39.1060, lng: -84.4780 },
  'Ft. Thomas':               { lat: 39.0750, lng: -84.4520 },
  'Northern Kentucky':        { lat: 39.0700, lng: -84.5000 },
  'Florence':                 { lat: 38.9990, lng: -84.6270 },
  'Downtown Cincy':           { lat: 39.1010, lng: -84.5120 },

  // Greater metro
  'Mason / West Chester':     { lat: 39.3600, lng: -84.3100 },
  'Mason / Liberty Twp':      { lat: 39.3600, lng: -84.3100 },
  'Mt. Lookout':              { lat: 39.1300, lng: -84.4360 },

  // The Banks / Riverfront
  'The Banks / Smale Park':   { lat: 39.0960, lng: -84.5090 },

  // Sidewalk pilot neighborhoods
  'East Westwood':            { lat: 39.1220, lng: -84.5780 },
  'Millvale':                 { lat: 39.1250, lng: -84.5620 },
  'English Woods':            { lat: 39.1650, lng: -84.5580 },
  'South Cumminsville':       { lat: 39.1400, lng: -84.5460 },

  // County areas for StormReady
  'West Side / Price Hill':   { lat: 39.1100, lng: -84.5720 },
  'Downtown / OTR':           { lat: 39.1085, lng: -84.5125 },
  'East Side / Hyde Park':    { lat: 39.1390, lng: -84.4560 },
  'Butler County':            { lat: 39.4400, lng: -84.5700 },
  'Warren County':            { lat: 39.4300, lng: -84.1700 },
  'Clermont County':          { lat: 39.0400, lng: -84.1500 },
}

// Simplified polygon boundaries for key neighborhoods (for choropleth)
// Each polygon is an array of [lng, lat] rings
export const neighborhoodPolygons = {
  type: 'FeatureCollection',
  features: [
    // ── Cincinnati neighborhoods ────────────────────────────────
    makeFeature('Downtown / OTR', 'downtown-otr', [
      [-84.5220, 39.1010], [-84.5030, 39.1010], [-84.5030, 39.1160], [-84.5220, 39.1160]
    ]),
    makeFeature('Over-the-Rhine', 'over-the-rhine', [
      [-84.5260, 39.1100], [-84.5100, 39.1100], [-84.5100, 39.1200], [-84.5260, 39.1200]
    ]),
    makeFeature('Clifton', 'clifton', [
      [-84.5350, 39.1300], [-84.5100, 39.1300], [-84.5100, 39.1520], [-84.5350, 39.1520]
    ]),
    makeFeature('Hyde Park', 'hyde-park', [
      [-84.4700, 39.1290], [-84.4400, 39.1290], [-84.4400, 39.1490], [-84.4700, 39.1490]
    ]),
    makeFeature('Westwood', 'westwood', [
      [-84.6100, 39.1150], [-84.5760, 39.1150], [-84.5760, 39.1430], [-84.6100, 39.1430]
    ]),
    makeFeature('West Price Hill', 'west-price-hill', [
      [-84.5850, 39.0970], [-84.5580, 39.0970], [-84.5580, 39.1180], [-84.5850, 39.1180]
    ]),
    makeFeature('East Price Hill', 'east-price-hill', [
      [-84.5560, 39.0950], [-84.5300, 39.0950], [-84.5300, 39.1130], [-84.5560, 39.1130]
    ]),
    makeFeature('Price Hill', 'price-hill', [
      [-84.5850, 39.0950], [-84.5300, 39.0950], [-84.5300, 39.1180], [-84.5850, 39.1180]
    ]),
    makeFeature('Walnut Hills', 'walnut-hills', [
      [-84.5000, 39.1180], [-84.4740, 39.1180], [-84.4740, 39.1380], [-84.5000, 39.1380]
    ]),
    makeFeature('Northside', 'northside', [
      [-84.5580, 39.1430], [-84.5320, 39.1430], [-84.5320, 39.1630], [-84.5580, 39.1630]
    ]),
    makeFeature('Avondale', 'avondale', [
      [-84.5100, 39.1260], [-84.4870, 39.1260], [-84.4870, 39.1470], [-84.5100, 39.1470]
    ]),
    makeFeature('Madisonville', 'madisonville', [
      [-84.4380, 39.1440], [-84.4080, 39.1440], [-84.4080, 39.1680], [-84.4380, 39.1680]
    ]),
    makeFeature('Mt. Washington', 'mt-washington', [
      [-84.4100, 39.0960], [-84.3700, 39.0960], [-84.3700, 39.1200], [-84.4100, 39.1200]
    ]),
    makeFeature('Anderson Twp', 'anderson', [
      [-84.3900, 39.0600], [-84.3400, 39.0600], [-84.3400, 39.0950], [-84.3900, 39.0950]
    ]),
    makeFeature('Bond Hill', 'bond-hill', [
      [-84.4850, 39.1600], [-84.4560, 39.1600], [-84.4560, 39.1800], [-84.4850, 39.1800]
    ]),
    makeFeature('Roselawn', 'roselawn', [
      [-84.4720, 39.1720], [-84.4450, 39.1720], [-84.4450, 39.1900], [-84.4720, 39.1900]
    ]),
    makeFeature('College Hill', 'college-hill', [
      [-84.5600, 39.1770], [-84.5340, 39.1770], [-84.5340, 39.1970], [-84.5600, 39.1970]
    ]),
    makeFeature('Winton Place', 'winton-place', [
      [-84.5280, 39.1620], [-84.5020, 39.1620], [-84.5020, 39.1820], [-84.5280, 39.1820]
    ]),
    makeFeature('Spring Grove', 'spring-grove', [
      [-84.5420, 39.1680], [-84.5160, 39.1680], [-84.5160, 39.1880], [-84.5420, 39.1880]
    ]),
    makeFeature('Mt. Airy', 'mt-airy', [
      [-84.5800, 39.1620], [-84.5520, 39.1620], [-84.5520, 39.1840], [-84.5800, 39.1840]
    ]),
    makeFeature('South Fairmount', 'south-fairmount', [
      [-84.5620, 39.1060], [-84.5380, 39.1060], [-84.5380, 39.1260], [-84.5620, 39.1260]
    ]),
    makeFeature('North Fairmount', 'north-fairmount', [
      [-84.5660, 39.1180], [-84.5400, 39.1180], [-84.5400, 39.1370], [-84.5660, 39.1370]
    ]),
    makeFeature('Camp Washington', 'camp-washington', [
      [-84.5520, 39.1240], [-84.5280, 39.1240], [-84.5280, 39.1440], [-84.5520, 39.1440]
    ]),
    makeFeature('Evanston', 'evanston', [
      [-84.4880, 39.1400], [-84.4620, 39.1400], [-84.4620, 39.1600], [-84.4880, 39.1600]
    ]),
    makeFeature('Sedamsville', 'sedamsville', [
      [-84.5800, 39.0920], [-84.5580, 39.0920], [-84.5580, 39.1080], [-84.5800, 39.1080]
    ]),
    makeFeature('East End', 'east-end', [
      [-84.4650, 39.0930], [-84.4350, 39.0930], [-84.4350, 39.1100], [-84.4650, 39.1100]
    ]),
    makeFeature('Riverside / Sayler Park', 'riverside-sayler-park', [
      [-84.6250, 39.0790], [-84.5950, 39.0790], [-84.5950, 39.0970], [-84.6250, 39.0970]
    ]),
    makeFeature('Carthage', 'carthage', [
      [-84.4980, 39.1850], [-84.4700, 39.1850], [-84.4700, 39.2050], [-84.4980, 39.2050]
    ]),
    makeFeature('Mt. Auburn', 'mt-auburn', [
      [-84.5120, 39.1100], [-84.4900, 39.1100], [-84.4900, 39.1250], [-84.5120, 39.1250]
    ]),
    makeFeature('Mt. Lookout', 'mt-lookout', [
      [-84.4500, 39.1200], [-84.4220, 39.1200], [-84.4220, 39.1400], [-84.4500, 39.1400]
    ]),

    // Sidewalk pilot extras
    makeFeature('East Westwood', 'east-westwood', [
      [-84.5920, 39.1130], [-84.5720, 39.1130], [-84.5720, 39.1300], [-84.5920, 39.1300]
    ]),
    makeFeature('Millvale', 'millvale', [
      [-84.5740, 39.1150], [-84.5540, 39.1150], [-84.5540, 39.1320], [-84.5740, 39.1320]
    ]),
    makeFeature('English Woods', 'english-woods', [
      [-84.5700, 39.1560], [-84.5460, 39.1560], [-84.5460, 39.1730], [-84.5700, 39.1730]
    ]),
    makeFeature('South Cumminsville', 'south-cumminsville', [
      [-84.5580, 39.1310], [-84.5340, 39.1310], [-84.5340, 39.1490], [-84.5580, 39.1490]
    ]),

    // ── Northern Kentucky ───────────────────────────────────────
    makeFeature('Covington', 'covington', [
      [-84.5220, 39.0700], [-84.4940, 39.0700], [-84.4940, 39.0930], [-84.5220, 39.0930]
    ]),
    makeFeature('Newport', 'newport', [
      [-84.5050, 39.0780], [-84.4790, 39.0780], [-84.4790, 39.0980], [-84.5050, 39.0980]
    ]),
    makeFeature('Bellevue', 'bellevue', [
      [-84.4900, 39.0960], [-84.4680, 39.0960], [-84.4680, 39.1140], [-84.4900, 39.1140]
    ]),
    makeFeature('Ft. Thomas', 'ft-thomas', [
      [-84.4650, 39.0620], [-84.4380, 39.0620], [-84.4380, 39.0850], [-84.4650, 39.0850]
    ]),
    makeFeature('Florence', 'florence', [
      [-84.6500, 38.9800], [-84.6020, 38.9800], [-84.6020, 39.0180], [-84.6500, 39.0180]
    ]),

    // ── Regional counties (for StormReady) ─────────────────────
    makeFeature('Butler County', 'butler-county', [
      [-84.8200, 39.3100], [-84.4200, 39.3100], [-84.4200, 39.5800], [-84.8200, 39.5800]
    ]),
    makeFeature('Warren County', 'warren-county', [
      [-84.3700, 39.3100], [-83.9700, 39.3100], [-83.9700, 39.5600], [-84.3700, 39.5600]
    ]),
    makeFeature('Clermont County', 'clermont-county', [
      [-84.2200, 38.9000], [-83.8700, 38.9000], [-83.8700, 39.2000], [-84.2200, 39.2000]
    ]),

    // The Banks area
    makeFeature('The Banks / Smale Park', 'the-banks', [
      [-84.5170, 39.0930], [-84.5010, 39.0930], [-84.5010, 39.1000], [-84.5170, 39.1000]
    ]),
  ],
}

function makeFeature(name, id, ring) {
  return {
    type: 'Feature',
    properties: { name, id },
    geometry: {
      type: 'Polygon',
      coordinates: [[...ring, ring[0]]], // close the ring
    },
  }
}

// Ohio River path (simplified) for flood visualization
export const ohioRiverPath = [
  [-84.6500, 39.0900], [-84.6200, 39.0880], [-84.5900, 39.0870],
  [-84.5600, 39.0880], [-84.5300, 39.0900], [-84.5100, 39.0940],
  [-84.4900, 39.0950], [-84.4700, 39.0930], [-84.4500, 39.0920],
  [-84.4200, 39.0900], [-84.3900, 39.0880], [-84.3600, 39.0870],
]

// Sharon Lake park features
export const sharonLakeFeatures = {
  parkCenter: { lat: 39.2860, lng: -84.3880 },
  lake: [
    [-84.3910, 39.2840], [-84.3870, 39.2830], [-84.3850, 39.2850],
    [-84.3860, 39.2880], [-84.3900, 39.2890], [-84.3920, 39.2870],
  ],
  trails: {
    lakeLoop: {
      name: 'Sharon Lake Loop Trail',
      distance: '2.1 mi',
      difficulty: 'Easy',
      color: '#059669',
      path: [
        [-84.3920, 39.2870], [-84.3910, 39.2840], [-84.3870, 39.2830],
        [-84.3850, 39.2850], [-84.3860, 39.2880], [-84.3900, 39.2890],
        [-84.3920, 39.2870],
      ],
    },
    gorge: {
      name: 'Sharon Woods Gorge Trail',
      distance: '3.4 mi',
      difficulty: 'Moderate',
      color: '#d97706',
      path: [
        [-84.3900, 39.2890], [-84.3880, 39.2920], [-84.3850, 39.2950],
        [-84.3830, 39.2970], [-84.3810, 39.2990], [-84.3800, 39.3010],
      ],
    },
    boardwalk: {
      name: 'Lakeside Boardwalk',
      distance: '0.4 mi',
      difficulty: 'Easy/Accessible',
      color: '#0ea5e9',
      path: [
        [-84.3870, 39.2880], [-84.3860, 39.2890], [-84.3850, 39.2900],
        [-84.3840, 39.2895],
      ],
    },
  },
  points: [
    { lat: 39.2855, lng: -84.3895, label: 'Kayak Launch', icon: 'kayak' },
    { lat: 39.2900, lng: -84.3885, label: 'Boardwalk Observation', icon: 'binoculars' },
    { lat: 39.2835, lng: -84.3920, label: 'Parking', icon: 'parking' },
    { lat: 39.2845, lng: -84.3870, label: 'Picnic Area', icon: 'picnic' },
    { lat: 39.2960, lng: -84.3830, label: 'Gorge Overlook', icon: 'camera' },
  ],
}

// Opening Day landmarks
export const openingDayLandmarks = {
  gabp: { lat: 39.0975, lng: -84.5065, label: 'Great American Ball Park' },
  findlayMarket: { lat: 39.1152, lng: -84.5185, label: 'Findlay Market' },
  paradeRoute: [
    [-84.5185, 39.1152], // Findlay Market
    [-84.5175, 39.1120], // Elm St south
    [-84.5140, 39.1080], // Vine St
    [-84.5120, 39.1040], // Race at 2nd
    [-84.5100, 39.1010], // toward The Banks
    [-84.5065, 39.0975], // GABP
  ],
  closedRoadSegments: [
    { name: 'Freedom Way', path: [[-84.5120, 39.0980], [-84.5040, 39.0980]] },
    { name: 'Marian Spencer Way', path: [[-84.5080, 39.0990], [-84.5050, 39.0990]] },
    { name: 'Joe Nuxhall Way', path: [[-84.5070, 39.0970], [-84.5040, 39.0970]] },
    { name: 'Mehring Way', path: [[-84.5150, 39.0960], [-84.5060, 39.0960]] },
    { name: 'Race St at 2nd', path: [[-84.5120, 39.1040], [-84.5120, 39.1020]] },
    { name: 'Vine St at 2nd', path: [[-84.5140, 39.1040], [-84.5140, 39.1020]] },
    { name: 'Elm St (Findlay to 2nd)', path: [[-84.5175, 39.1120], [-84.5175, 39.1020]] },
  ],
}

// Bridge Impact landmarks
export const bridgeImpactLandmarks = {
  bridgeLocation: { lat: 39.0910, lng: -84.5005, label: 'Former 4th St Bridge' },
  detourRoutes: {
    covington: {
      old: [[-84.5080, 39.0840], [-84.5005, 39.0910], [-84.5010, 39.0950]],
      new: [[-84.5080, 39.0840], [-84.5180, 39.0870], [-84.5200, 39.0940], [-84.5150, 39.0980], [-84.5010, 39.0950]],
    },
    newport: {
      old: [[-84.4920, 39.0890], [-84.5005, 39.0910], [-84.5010, 39.0950]],
      new: [[-84.4920, 39.0890], [-84.4850, 39.0920], [-84.4800, 39.0960], [-84.4900, 39.0980], [-84.5010, 39.0950]],
    },
    bellevue: {
      old: [[-84.4780, 39.1060], [-84.5005, 39.0910], [-84.5010, 39.0950]],
      new: [[-84.4780, 39.1060], [-84.4700, 39.0980], [-84.4800, 39.0960], [-84.4900, 39.0980], [-84.5010, 39.0950]],
    },
  },
  tankShuttleRoute: [
    [-84.5080, 39.0840], [-84.5050, 39.0880], [-84.5020, 39.0920], [-84.5010, 39.0950],
  ],
}

// FEMA flood zone approximations along Ohio River
export const floodZones = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { zone: 'AE', label: 'FEMA AE Zone (100-yr floodplain)' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-84.6500, 39.0820], [-84.6200, 39.0800], [-84.5900, 39.0790],
          [-84.5600, 39.0800], [-84.5300, 39.0820], [-84.5100, 39.0860],
          [-84.4900, 39.0870], [-84.4700, 39.0850], [-84.4500, 39.0840],
          [-84.4200, 39.0820], [-84.3600, 39.0790],
          // Return north side (wider flood extent)
          [-84.3600, 39.0960], [-84.4200, 39.0980], [-84.4500, 39.1000],
          [-84.4700, 39.1010], [-84.4900, 39.1020], [-84.5100, 39.1020],
          [-84.5300, 39.0980], [-84.5600, 39.0960], [-84.5900, 39.0950],
          [-84.6200, 39.0960], [-84.6500, 39.0980],
          [-84.6500, 39.0820], // close
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { zone: 'X', label: 'Zone X (moderate risk)' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-84.6500, 39.0980], [-84.6200, 39.0960], [-84.5900, 39.0950],
          [-84.5600, 39.0960], [-84.5300, 39.0980], [-84.5100, 39.1020],
          [-84.4900, 39.1020], [-84.4700, 39.1010], [-84.4500, 39.1000],
          [-84.4200, 39.0980], [-84.3600, 39.0960],
          // Extend a bit further north
          [-84.3600, 39.1060], [-84.4200, 39.1080], [-84.4500, 39.1100],
          [-84.4700, 39.1110], [-84.4900, 39.1120], [-84.5100, 39.1120],
          [-84.5300, 39.1080], [-84.5600, 39.1060], [-84.5900, 39.1050],
          [-84.6200, 39.1060], [-84.6500, 39.1080],
          [-84.6500, 39.0980], // close
        ]],
      },
    },
  ],
}

// Find the polygon feature matching a neighborhood name
export function findNeighborhoodFeature(name) {
  if (!name) return null
  const lower = name.toLowerCase()
  return neighborhoodPolygons.features.find(f => {
    const n = f.properties.name.toLowerCase()
    const id = f.properties.id.toLowerCase()
    return n === lower || id === lower || n.includes(lower) || lower.includes(n)
  }) || null
}

// Get centroid for a neighborhood name (fuzzy match)
export function getNeighborhoodCenter(name) {
  if (!name) return null
  // Direct match
  if (neighborhoodCentroids[name]) return neighborhoodCentroids[name]
  // Fuzzy match
  const lower = name.toLowerCase()
  for (const [key, val] of Object.entries(neighborhoodCentroids)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) return val
  }
  return null
}
