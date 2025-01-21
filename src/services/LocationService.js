import { mapboxgl } from '../utils/mapboxgl.js'

export class LocationService {
  static async getUserLocation() {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lng: position.coords.longitude,
              lat: position.coords.latitude,
            })
          },
          (error) => {
            reject(error)
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        )
      } else {
        reject(new Error('Geolocation is not supported by this browser'))
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
