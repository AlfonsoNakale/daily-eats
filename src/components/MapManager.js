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

      // Wait for the search script to load before initializing search
      const searchScript = document.getElementById('search-js')
      if (searchScript) {
        searchScript.addEventListener('load', () => {
          this.initializeSearch()
        })
        // If the script is already loaded, initialize search immediately
        if (window.mapboxsearch) {
          this.initializeSearch()
        }
      } else {
        console.error('Search script not found in the DOM')
      }

      // Initialize a popup for displaying information
      this.popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: 'auto',
        offset: 45,
      })

      this.setupEventListeners() // Set up event listeners for map interactions
    } catch (error) {
      console.error('Error initializing map:', error)
      throw error
    }
  }

  // Initialize the search functionality
  initializeSearch() {
    try {
      if (!window.mapboxsearch) {
        throw new Error('Mapbox search not available')
      }

      const searchBox = new window.mapboxsearch.MapboxSearchBox()

      searchBox.accessToken = mapConfig.accessToken

      // Define custom suggestions
      const customSuggestions = [
        {
          name: 'Khomasdal',
          coordinates: [17.0469176743274, -22.54520317814792],
          place_type: ['neighborhood'],
          place_name: 'Khomasdal, Windhoek, Namibia',
        },
        {
          name: 'Katutura',
          coordinates: [17.05041064852741, -22.520378030509132],
          place_type: ['neighborhood'],
          place_name: 'Katutura, Windhoek, Namibia',
        },
        {
          name: 'Suiderhof',
          coordinates: [17.09256469161655, -22.601199158359044],
          place_type: ['neighborhood'],
          place_name: 'Suiderhof, Windhoek, Namibia',
        },
        {
          name: 'Elisenheim',
          coordinates: [17.08129531310496, -22.50958262249567],
          place_type: ['neighborhood'],
          place_name: 'Elisenheim, Windhoek, Namibia',
        },
        {
          name: 'Windhoek West',
          coordinates: [17.074678455945417, -22.562507321165512],
          place_type: ['neighborhood'],
          place_name: 'Windhoek West, Windhoek, Namibia',
        },
        {
          name: 'Klein Windhoek',
          coordinates: [17.097251926129626, -22.571305048553636],
          place_type: ['neighborhood'],
          place_name: 'Klein Windhoek, Windhoek, Namibia',
        },
        {
          name: 'Southern Industrial Area',
          coordinates: [17.07989317043607, -22.58497349355685],
          place_type: ['neighborhood'],
          place_name: 'Southern Industrial Area, Windhoek, Namibia',
        },
        {
          name: 'Windhoek Central',
          coordinates: [17.080475533746686, -22.573475211818067],
          place_type: ['neighborhood'],
          place_name: 'Windhoek Central, Windhoek, Namibia',
        },
        {
          name: 'Eros',
          coordinates: [17.092279160163002, -22.54941850015299],
          place_type: ['neighborhood'],
          place_name: 'Eros, Windhoek, Namibia',
        },
      ]

      // Configure search box options
      searchBox.options = {
        language: 'en',
        country: 'NA',
        types: ['neighborhood'], // Empty types to prevent Mapbox suggestions
        limit: 1, // Set limit to 0 to prevent Mapbox suggestions
        showResultsWhileTyping: true,
        minLength: 1,
        enableGeolocation: false,
        geocoder: {
          enabled: false, // Disable Mapbox geocoding service
        },
      }

      // Set up the search box
      console.log('Setting up mapboxgl and marker...')
      searchBox.mapboxgl = mapboxgl
      searchBox.marker = false
      searchBox.flyTo = false

      // Prevent default form submission which triggers geocoding
      searchBox.addEventListener('submit', (e) => {
        e.preventDefault()
        return false
      })

      // Get the container for the search box
      const container = document.getElementById('search-box-container')
      if (!container) {
        throw new Error('Search box container not found')
      }

      // Create a suggestions container
      const suggestionsContainer = document.createElement('div')
      suggestionsContainer.className = 'mapboxgl-ctrl-geocoder--suggestions'
      container.appendChild(suggestionsContainer)

      // Add the search box to the container
      console.log('Adding search box to DOM...')
      container.appendChild(searchBox)

      // Function to update suggestions UI
      const updateSuggestionsUI = (suggestions) => {
        if (suggestions.length > 0) {
          suggestionsContainer.innerHTML = suggestions
            .map(
              (result) => `
              <div class="mapboxgl-ctrl-geocoder--suggestion" data-location='${JSON.stringify(
                result
              )}'>
                <div class="mapboxgl-ctrl-geocoder--suggestion-name">${
                  result.place_name
                }</div>
              </div>
            `
            )
            .join('')

          // Add click handlers to suggestions
          suggestionsContainer
            .querySelectorAll('.mapboxgl-ctrl-geocoder--suggestion')
            .forEach((element) => {
              element.addEventListener('click', () => {
                const locationData = JSON.parse(element.dataset.location)
                const coordinates = locationData.coordinates

                if (coordinates) {
                  // Update search box value with selected location
                  searchBox.value = locationData.place_name
                  this.map.flyTo({
                    center: coordinates,
                    zoom: 15,
                    essential: true,
                    duration: 2000,
                  })
                }
                suggestionsContainer.innerHTML = ''
                suggestionsContainer.style.display = 'none'
              })
            })

          suggestionsContainer.style.display = 'block'
        } else {
          suggestionsContainer.style.display = 'none'
        }
      }

      // Listen for input events to handle suggestions
      searchBox.addEventListener('input', (event) => {
        const query = event.target.value?.toLowerCase() || ''

        if (query.length > 0) {
          // Get matching custom suggestions
          const customMatches = customSuggestions
            .filter((suggestion) =>
              suggestion.name.toLowerCase().includes(query)
            )
            .map((match) => ({
              type: 'Feature',
              id: match.name,
              place_type: match.place_type,
              place_name: match.place_name,
              properties: {
                name: match.name,
              },
              text: match.name,
              coordinates: match.coordinates,
              geometry: {
                type: 'Point',
                coordinates: match.coordinates,
              },
            }))

          // Update UI with custom matches
          updateSuggestionsUI(customMatches)
        } else {
          suggestionsContainer.style.display = 'none'
        }
      })

      // Update the styles for better suggestion display
      const style = document.createElement('style')
      style.textContent = `
        .mapboxgl-ctrl-geocoder--suggestions {
          display: none;
          position: absolute;
          left: auto;
          top: auto;
          right: auto;
          bottom: auto;
          z-index: 1000;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.0);
          width: 98%;
          max-height: 200px;
          overflow-y: auto;
          margin: 48px 0px 0px  0px;
        }
        .mapboxgl-ctrl-geocoder--suggestion {
          padding: 5px;
          cursor: pointer;
          border-bottom: 1px solid #e8e8e8;
        }
        .mapboxgl-ctrl-geocoder--suggestion:last-child {
          border-bottom: none;
        }
        .mapboxgl-ctrl-geocoder--suggestion:hover {
          background: #f5f5f5;
        }
        .mapboxgl-ctrl-geocoder--suggestion-name {
          font-size: 14px;
          color: #404040;
        }
      `
      document.head.appendChild(style)

      // Bind search box to map
      console.log('Binding search box to map...')
      searchBox.bindMap(this.map)
    } catch (error) {
      console.error('Error initializing search:', error)
      // Try to show error to user
      const container = document.getElementById('search-box-container')
      if (container) {
        container.innerHTML = `<div style="padding: 10px; color: red;">Error loading search. Please refresh the page.</div>`
      }
    }
  }

  // Asynchronously initializes the user's location and map points
  async initializeUserLocation() {
    try {
      // Get the user's current location or default location
      this.userLocation = await LocationService.getUserLocation()
      this.mapLocations = LocationService.getGeoData()

      // Fly to the location with different zoom levels based on whether it's default or not
      this.map.flyTo({
        center: [this.userLocation.lng, this.userLocation.lat],
        zoom: this.userLocation.isDefault ? 13 : 16, // Use a wider zoom for default location
        essential: true,
        duration: 2000,
      })

      // Only add the user location marker if it's not the default location
      if (!this.userLocation.isDefault) {
        new mapboxgl.Marker({
          color: mapConfig.markerColors.user,
        })
          .setLngLat([this.userLocation.lng, this.userLocation.lat])
          .addTo(this.map)
      }

      this.addMapPoints()
    } catch (error) {
      console.warn('Error in initializeUserLocation:', error)
      this.mapLocations = LocationService.getGeoData()
      this.addMapPoints()
      this.setupCountryZoom()
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
