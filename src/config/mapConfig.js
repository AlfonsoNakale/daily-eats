export const mapConfig = {
  accessToken:
    'pk.eyJ1IjoiZGFpbHllYXRzIiwiYSI6ImNtNXo3bTQ0NDAxYW4yaXIycXIyMHV1MDUifQ.YdvOoOG92-BO5FY3KviEPA',
  style: 'mapbox://styles/mapbox/streets-v12',
  minZoom: 2,
  defaultMapSettings: {
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    minZoom: 2,
  },
  markerColors: {
    user: '#FF0000',
    location: '#FF9900',
  },
  layerSettings: {
    id: 'locations',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 6, 15, 12],
      'circle-stroke-width': 1,
      'circle-color': '#FF9900',
      'circle-opacity': 0.9,
      'circle-stroke-color': '#405F3B',
    },
  },
}
