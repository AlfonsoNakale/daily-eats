import { initializeFilters } from '../filters.js'
import { MapManager } from './components/MapManager.js'

//console.log('Script loaded - checking for Webflow...')

function waitForWebflow(callback) {
  //console.log('Webflow status:', window.Webflow ? 'Found' : 'Not found')
  if (window.Webflow && window.Webflow.push) {
    //console.log('Webflow ready - initializing app')
    window.Webflow.push(callback)
  } else {
    //console.log('Waiting for Webflow...')
    setTimeout(() => waitForWebflow(callback), 100)
  }
}

function initializeApp() {
  //console.log('Starting app initialization')
  try {
    new MapManager()
    console.log('MapManager initialized successfully')

    // Initialize filtering functionality
    initializeFilters()
    console.log('Filters initialized successfully')
  } catch (error) {
    console.error('Error initializing app:', error)
  }
}

// Ensure both DOM and Webflow are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    //console.log('DOM loaded - waiting for Webflow')
    waitForWebflow(() => {
      initializeApp()
    })
  })
} else {
  //console.log('DOM already loaded - waiting for Webflow')
  waitForWebflow(() => {
    initializeApp()
  })
}
