import { mapboxgl } from '../utils/mapboxgl.js'

export class LocationService {
  static async getUserLocation() {
    // Default coordinates for Windhoek Central
    const defaultLocation = {
      lng: 17.080475533746686,
      lat: -22.573475211818067,
      isDefault: true,
    }

    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        // Set a timeout for the geolocation request
        const timeoutId = setTimeout(() => {
          console.log('Geolocation request timed out, using default location')
          resolve(defaultLocation)
        }, 5000)

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId)
            resolve({
              lng: position.coords.longitude,
              lat: position.coords.latitude,
              isDefault: false,
            })
          },
          (error) => {
            clearTimeout(timeoutId)
            console.warn('Geolocation error:', error.message)
            resolve(defaultLocation)
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        )
      } else {
        console.warn('Geolocation is not supported by this browser')
        resolve(defaultLocation)
      }
    })
  }

  static getGeoData() {
    const locationNodes = document.querySelectorAll('#location-list > *')
    return {
      type: 'FeatureCollection',
      features: Array.from(locationNodes).map((location, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(location.querySelector('#locationLongitude').value),
            parseFloat(location.querySelector('#locationLatitude').value),
          ],
        },
        properties: {
          id: location.querySelector('#locationID').value,
          description: location.querySelector('.locations-map_card').innerHTML,
          arrayID: index,
        },
      })),
    }
  }

  static async fetchDirections(origin, destination) {
    const profile = 'driving'
    const queryUrl = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin.lng},${origin.lat};${destination[0]},${destination[1]}?steps=true&geometries=geojson&overview=full&annotations=distance,duration&access_token=${mapboxgl.accessToken}`

    try {
      const response = await fetch(queryUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching directions:', error)
      throw error
    }
  }
}
