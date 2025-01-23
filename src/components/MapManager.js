import { mapConfig } from '../config/mapConfig.js'
import { LocationService } from '../services/LocationService.js'
import { UIService } from '../services/UIService.js'
import { mapboxgl } from '../utils/mapboxgl.js'

// The MapManager class is responsible for managing the map and its interactions
export class MapManager {
  constructor() {
    this.userLocation = null // Stores the user's current location
    this.mapLocations = {
      type: 'FeatureCollection', // GeoJSON format for storing map features
      features: [],
    }
    this.map = null // Reference to the map instance
    this.popup = null // Reference to the popup instance
    this.activeRoute = null // Stores the currently active route
    this.initializeMap() // Initialize the map when the class is instantiated
  }

  // Initializes the map with default settings and controls
  initializeMap() {
    mapboxgl.accessToken = mapConfig.accessToken // Set the Mapbox access token

    // Check if the map container exists in the DOM
    const mapContainer = document.getElementById('map')
    if (!mapContainer) {
      console.error('Map container #map not found')
      throw new Error('Map container #map not found in the DOM')
    }

    // Ensure the map container has dimensions
    if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
      console.error('Map container has no dimensions:', {
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
      })
      mapContainer.style.width = '100%' // Set default width
      mapContainer.style.height = '100vh' // Set default height
    }

    try {
      // Create a new map instance with default settings
      this.map = new mapboxgl.Map(mapConfig.defaultMapSettings)

      // Share the map instance with UIService
      UIService.setMapInstance(this.map)

      // Add navigation controls
      this.map.addControl(new mapboxgl.NavigationControl())

      // Add geolocation control to track user location
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
      this.map.addControl(geolocateControl)

      // Initialize a popup for displaying information
      this.popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '300px',
      })

      this.setupEventListeners() // Set up event listeners for map interactions
    } catch (error) {
      console.error('Error initializing map:', error)
      throw error
    }
  }

  // Asynchronously initializes the user's location and map points
  async initializeUserLocation() {
    try {
      // Get the user's current location
      this.userLocation = await LocationService.getUserLocation()
      this.mapLocations = LocationService.getGeoData() // Get geo data for map points

      // Fly the map to the user's location
      this.map.flyTo({
        center: [this.userLocation.lng, this.userLocation.lat],
        zoom: 16, // set the zoom level
        essential: true, // ensure the flyTo is essential
        duration: 2000, // set the duration of the flyTo animation
      })

      // Add a marker at the user's location
      new mapboxgl.Marker({
        color: mapConfig.markerColors.user,
      })
        .setLngLat([this.userLocation.lng, this.userLocation.lat])
        .addTo(this.map)

      this.addMapPoints() // Add points to the map
    } catch (error) {
      console.warn('Error getting user location:', error)
      this.mapLocations = LocationService.getGeoData() // Fallback to geo data
      this.addMapPoints() // Add points to the map
      this.setupCountryZoom() // Set up zoom for country boundaries
    }
  }

  // Adds points to the map from the geo data
  addMapPoints() {
    const layerId = mapConfig.layerSettings.id

    // Remove existing layer and source if they exist
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId)
    }
    if (this.map.getSource(layerId)) {
      this.map.removeSource(layerId)
    }

    // Create markers for each location
    this.mapLocations.features.forEach((location, index) => {
      // Get the icon URL from the location list
      const locationNode =
        document.querySelectorAll('#location-list > *')[index]
      const iconImg = locationNode?.querySelector('.markericon img')
      const iconUrl =
        iconImg?.src ||
        'https://cdn.prod.website-files.com/678d364888a0aa90f5f49e2c/678fb0a891ae9c935315e936_kitchen-utensils.svg'

      // Skip placeholder icons
      if (iconUrl.includes('placeholder.60f9b1840c.svg')) {
        return
      }

      // Create marker element
      const el = document.createElement('div')
      el.className = 'markericon'
      el.style.backgroundImage = `url("${iconUrl}")`

      // Create and add the marker to the map
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat(location.geometry.coordinates)
        .addTo(this.map)

      // Add click event listener to the marker
      marker.getElement().addEventListener('click', () => {
        const e = {
          features: [
            {
              geometry: {
                coordinates: location.geometry.coordinates,
              },
              properties: location.properties,
            },
          ],
          lngLat: {
            lng: location.geometry.coordinates[0],
            lat: location.geometry.coordinates[1],
          },
        }
        this.handleLocationClick(e)
      })
    })
  }

  // Displays a popup with information about a map point
  showPopup(e) {
    const coordinates = e.features[0].geometry.coordinates.slice() // Get coordinates
    const description = e.features[0].properties.description // Get description

    // Adjust coordinates for popup display
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
    }

    // Set and display the popup
    this.popup.setLngLat(coordinates).setHTML(description).addTo(this.map)
  }

  // Sets up zoom for country boundaries
  setupCountryZoom() {
    // Add a source for country boundaries
    this.map.addSource('country-boundaries', {
      type: 'vector',
      url: 'mapbox://mapbox.country-boundaries-v1',
      promoteId: 'iso_3166_1',
    })

    // Add a layer for country boundaries
    this.map.addLayer({
      id: 'country-boundaries',
      type: 'fill',
      source: 'country-boundaries',
      'source-layer': 'country_boundaries',
      paint: {
        'fill-opacity': 0,
      },
      filter: ['==', ['get', 'iso_3166_1'], 'NA'], // Filter for a specific country
    })

    const bounds = new mapboxgl.LngLatBounds() // Initialize bounds for zoom
    const handleSourceData = (e) => {
      if (
        e.sourceId !== 'country-boundaries' ||
        !this.map.isSourceLoaded('country-boundaries')
      ) {
        return
      }

      // Get features from the source
      const features = this.map.querySourceFeatures('country-boundaries', {
        sourceLayer: 'country_boundaries',
      })

      if (features.length > 0) {
        features.forEach((feature) => {
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates.forEach((ring) => {
              ring.forEach((coord) => {
                bounds.extend(coord) // Extend bounds with coordinates
              })
            })
          }
        })

        // Fit the map to the bounds
        this.map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
          maxZoom: 12,
        })

        this.map.off('sourcedata', handleSourceData) // Remove event listener
      }
    }

    this.map.on('sourcedata', handleSourceData) // Add event listener for source data
  }

  // Handles click events on map locations
  async handleLocationClick(e) {
    const ID = e.features[0].properties.arrayID

    // Show popup for the clicked location
    this.showPopup(e)

    // Show location list and highlight the selected location
    const locationList = document.getElementById('location-list')
    if (locationList) {
      locationList.classList.add('active')
    }

    // Show map wrapper and highlight the selected location
    const mapWrapper = document.querySelector('.locations-map_wrapper')
    if (mapWrapper) {
      mapWrapper.classList.add('is--show')
    }

    // Remove highlight from all items and highlight the clicked one
    document
      .querySelectorAll('.locations-map_item.is--show')
      .forEach((item) => item.classList.remove('is--show'))

    const locationItems = document.querySelectorAll('.locations-map_item')
    if (locationItems[ID]) {
      locationItems[ID].classList.add('is--show')
    }

    // Get directions if user location is available
    if (this.userLocation) {
      try {
        const destinationCoordinates = [
          e.features[0].geometry.coordinates[0],
          e.features[0].geometry.coordinates[1],
        ]

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

    // Ease the map to the clicked location
    this.map.easeTo({
      center: e.features[0].geometry.coordinates,
      speed: 0.5,
      curve: 1,
      duration: 1000,
    })
  }

  // Displays the route on the map
  displayRoute(routeCoordinates) {
    const layerId = 'route' // Define the layer ID for the route

    // Remove existing route layer and source if they exist
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId)
      this.map.removeSource(layerId)
    }

    // Add a new source for the route
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

    // Add a new layer to display the route
    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: layerId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#FF0000', // Set the line color
        'line-width': 5, // Set the line width
      },
    })

    // Fit the map to the bounds of the route
    const bounds = routeCoordinates.reduce((bounds, coord) => {
      return bounds.extend(coord)
    }, new mapboxgl.LngLatBounds(routeCoordinates[0], routeCoordinates[0]))

    this.map.fitBounds(bounds, {
      padding: 50,
    })
  }

  // Sets up event listeners for map interactions
  setupEventListeners() {
    this.map.on('load', () => {
      this.initializeUserLocation() // Initialize user location on map load

      // Add click event listener for map locations
      this.map.on('click', 'locations', this.handleLocationClick.bind(this))

      // Change cursor and show popup on mouse enter
      this.map.on('mouseenter', 'locations', (e) => {
        this.map.getCanvas().style.cursor = 'pointer'
        this.showPopup(e)
      })

      // Reset cursor and remove popup on mouse leave
      this.map.on('mouseleave', 'locations', () => {
        this.map.getCanvas().style.cursor = ''
        this.popup.remove()
      })
    })

    UIService.setupEventListeners() // Set up additional UI event listeners
  }
}
