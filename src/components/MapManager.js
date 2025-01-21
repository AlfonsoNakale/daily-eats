import { mapConfig } from '../config/mapConfig.js'
import { LocationService } from '../services/LocationService.js'
import { UIService } from '../services/UIService.js'
import { mapboxgl } from '../utils/mapboxgl.js'

export class MapManager {
  constructor() {
    this.userLocation = null
    this.mapLocations = {
      type: 'FeatureCollection',
      features: [],
    }
    this.map = null
    this.popup = null
    this.activeRoute = null
    this.initializeMap()
  }

  initializeMap() {
    mapboxgl.accessToken = mapConfig.accessToken

    // Check if map container exists
    const mapContainer = document.getElementById('map')
    if (!mapContainer) {
      console.error('Map container #map not found')
      throw new Error('Map container #map not found in the DOM')
    }

    // Check map container dimensions
    if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
      console.error('Map container has no dimensions:', {
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
      })
      mapContainer.style.width = '100%'
      mapContainer.style.height = '500px' // Set a default height
    }

    try {
      this.map = new mapboxgl.Map(mapConfig.defaultMapSettings)
      this.map.addControl(new mapboxgl.NavigationControl())

      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
      this.map.addControl(geolocateControl)

      this.popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '300px',
      })

      this.setupEventListeners()
    } catch (error) {
      console.error('Error initializing map:', error)
      throw error
    }
  }

  async initializeUserLocation() {
    try {
      this.userLocation = await LocationService.getUserLocation()
      this.mapLocations = LocationService.getGeoData()

      this.map.flyTo({
        center: [this.userLocation.lng, this.userLocation.lat],
        zoom: 13,
        essential: true,
        duration: 2000,
      })

      new mapboxgl.Marker({
        color: mapConfig.markerColors.user,
      })
        .setLngLat([this.userLocation.lng, this.userLocation.lat])
        .addTo(this.map)

      this.addMapPoints()
    } catch (error) {
      console.warn('Error getting user location:', error)
      this.mapLocations = LocationService.getGeoData()
      this.addMapPoints()
      this.setupCountryZoom()
    }
  }

  addMapPoints() {
    const layerId = mapConfig.layerSettings.id

    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId)
    }

    if (this.map.getSource(layerId)) {
      this.map.removeSource(layerId)
    }

    this.map.addSource(layerId, {
      type: 'geojson',
      data: this.mapLocations,
    })

    this.map.addLayer({
      id: layerId,
      type: 'circle',
      source: layerId,
      paint: mapConfig.layerSettings.paint,
    })
  }

  showPopup(e) {
    const coordinates = e.features[0].geometry.coordinates.slice()
    const description = e.features[0].properties.description

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
    }

    this.popup.setLngLat(coordinates).setHTML(description).addTo(this.map)
  }

  setupCountryZoom() {
    this.map.addSource('country-boundaries', {
      type: 'vector',
      url: 'mapbox://mapbox.country-boundaries-v1',
      promoteId: 'iso_3166_1',
    })

    this.map.addLayer({
      id: 'country-boundaries',
      type: 'fill',
      source: 'country-boundaries',
      'source-layer': 'country_boundaries',
      paint: {
        'fill-opacity': 0,
      },
      filter: ['==', ['get', 'iso_3166_1'], 'GB'],
    })

    const bounds = new mapboxgl.LngLatBounds()
    const handleSourceData = (e) => {
      if (
        e.sourceId !== 'country-boundaries' ||
        !this.map.isSourceLoaded('country-boundaries')
      ) {
        return
      }

      const features = this.map.querySourceFeatures('country-boundaries', {
        sourceLayer: 'country_boundaries',
      })

      if (features.length > 0) {
        features.forEach((feature) => {
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates.forEach((ring) => {
              ring.forEach((coord) => {
                bounds.extend(coord)
              })
            })
          }
        })

        this.map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
          maxZoom: 12,
        })

        this.map.off('sourcedata', handleSourceData)
      }
    }

    this.map.on('sourcedata', handleSourceData)
  }

  async handleLocationClick(e) {
    const ID = e.features[0].properties.arrayID

    this.showPopup(e)

    const destinationCoordinates = [
      e.features[0].geometry.coordinates[0],
      e.features[0].geometry.coordinates[1],
    ]

    // Show location list
    const locationList = document.getElementById('location-list')
    if (locationList) {
      locationList.classList.add('active')
    }

    if (this.userLocation) {
      try {
        const routeData = await LocationService.fetchDirections(
          this.userLocation,
          destinationCoordinates
        )
        if (routeData.routes && routeData.routes.length > 0) {
          this.activeRoute = routeData.routes[0]
          this.displayRoute(routeData.routes[0].geometry.coordinates)
          UIService.displayRouteInfo(routeData.routes[0])
        }
      } catch (error) {
        console.error('Error fetching directions:', error)
      }
    }

    document.querySelector('.locations-map_wrapper').classList.add('is--show')
    document
      .querySelectorAll('.locations-map_item.is--show')
      .forEach((item) => item.classList.remove('is--show'))
    document
      .querySelectorAll('.locations-map_item')
      [ID].classList.add('is--show')

    this.map.easeTo({
      center: e.features[0].geometry.coordinates,
      speed: 0.5,
      curve: 1,
      duration: 1000,
    })
  }

  displayRoute(routeCoordinates) {
    const layerId = 'route'

    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId)
      this.map.removeSource(layerId)
    }

    this.map.addSource(layerId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates,
        },
      },
    })

    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: layerId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#FF0000',
        'line-width': 5,
      },
    })

    const bounds = routeCoordinates.reduce((bounds, coord) => {
      return bounds.extend(coord)
    }, new mapboxgl.LngLatBounds(routeCoordinates[0], routeCoordinates[0]))

    this.map.fitBounds(bounds, {
      padding: 50,
    })
  }

  setupEventListeners() {
    this.map.on('load', () => {
      this.initializeUserLocation()

      this.map.on('click', 'locations', this.handleLocationClick.bind(this))

      this.map.on('mouseenter', 'locations', (e) => {
        this.map.getCanvas().style.cursor = 'pointer'
        this.showPopup(e)
      })

      this.map.on('mouseleave', 'locations', () => {
        this.map.getCanvas().style.cursor = ''
        this.popup.remove()
      })
    })

    UIService.setupEventListeners()
  }
}
