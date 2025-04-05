import { initializeFilters } from '../filters.js'
import { initializeListingManager } from '../ListingManager.js'
import { MapManager } from './components/MapManager.js'

console.log('Main.js script loaded - checking for Webflow...')

function waitForWebflow(callback) {
  console.log('Webflow status:', window.Webflow ? 'Found' : 'Not found')
  if (window.Webflow && window.Webflow.push) {
    console.log('Webflow ready - initializing app')
    window.Webflow.push(callback)
  } else {
    console.log('Waiting for Webflow...')
    setTimeout(() => waitForWebflow(callback), 100)
  }
}

// Ensure both DOM and Webflow are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - waiting for Webflow')
    waitForWebflow(() => {
      initializeApp()
    })
  })
} else {
  console.log('DOM already loaded - waiting for Webflow')
  waitForWebflow(() => {
    initializeApp()
  })
}

function initializeApp() {
  console.log('Starting app initialization')
  try {
    // Initialize MapManager only if we're on a page with a map
    const mapContainer = document.getElementById('map')
    if (mapContainer) {
      new MapManager()
      console.log('MapManager initialized successfully')
    } else {
      console.log('No map container found, skipping MapManager')
    }

    // Initialize filtering functionality
    console.log('Attempting to initialize filters...')
    initializeFilters()
  } catch (error) {
    console.error('Error initializing app:', error)
  }
  // Initialize ListingManager

  initializeListingManager()
}
