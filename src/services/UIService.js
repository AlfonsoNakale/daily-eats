export class UIService {
  static setMapInstance(map) {
    UIService._mapInstance = map
  }

  static displayRouteInfo(route) {
    let routeInfoContainer = document.getElementById('route-info')
    if (!routeInfoContainer) {
      routeInfoContainer = document.createElement('div')
      routeInfoContainer.id = 'route-info'
      routeInfoContainer.className = 'route-info-container'
      document
        .querySelector('.locations-map_wrapper')
        .appendChild(routeInfoContainer)
    }

    const distance = (route.distance / 1000).toFixed(1)
    const duration = Math.round(route.duration / 60)

    let routeHTML = `
            <div class="route-summary">
                <p class="route-summary-title">Route Information<p>
                <p class="route-summary-distance">Total Distance: ${distance} km</p>
                <p class="route-summary-duration">Estimated Time: ${duration} minutes</p>
            </div>
        `

    /*route.legs.forEach((leg) => {
      leg.steps.forEach((step) => {
        const instruction = step.maneuver.instruction
        const stepDistance =
          step.distance < 1000
            ? `${Math.round(step.distance)}m`
            : `${(step.distance / 1000).toFixed(1)}km`

        routeHTML += `
                    <li class="route-step">
                        <span class="instruction">${instruction}</span>
                        <span class="distance">${stepDistance}</span>
                    </li>
                `
      })
    })

    routeHTML += `
                </ol>
            </div>
        `*/

    routeInfoContainer.innerHTML = routeHTML
    this.injectRouteStyles()
  }

  static injectRouteStyles() {
    if (!document.getElementById('route-styles')) {
      const style = document.createElement('style')
      style.id = 'route-styles'
      style.textContent = `
                .route-info-container {
                width: auto;
                height: auto;
                margin-left: 0.5rem;
                padding-top: 16px;
                padding-right: 16px;
                padding-bottom: 16px;
                padding-left: 16px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
                background-color: hsla(0, 0.00%, 100.00%, 1.00);
                }
                .route-summary {
                position: relative;
                z-index: 1;
                }
                .route-summary-title {
                color: var(--dark-olive-green);
                font-size: 1.126rem;
                font-weight: 500;
                margin-bottom: -10px;
                }
                .route-summary-distance {
                color: var(--dark-olive-green);
                font-size: 0.9rem;
                font-weight: 400;
                margin-bottom: 0px;
                }
                .route-summary-duration {
                color: var(--dark-olive-green);
                font-size: 0.9rem;
                margin-bottom: 0px;
}
            `
      document.head.appendChild(style)
    }
  }

  static clearRoute() {
    // Use the stored map instance
    if (UIService._mapInstance) {
      const layerId = 'route'

      // Remove the route layer if it exists
      if (UIService._mapInstance.getLayer(layerId)) {
        UIService._mapInstance.removeLayer(layerId)
      }

      // Remove the route source if it exists
      if (UIService._mapInstance.getSource(layerId)) {
        UIService._mapInstance.removeSource(layerId)
      }

      // Remove any potential popup
      const popups = document.getElementsByClassName('mapboxgl-popup')
      if (popups.length > 0) {
        Array.from(popups).forEach((popup) => popup.remove())
      }
    }

    // Remove the route info container
    const routeInfo = document.getElementById('route-info')
    if (routeInfo) {
      routeInfo.remove()
    }
  }

  static setupEventListeners() {
    // Close location list when close button is clicked
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-list')) {
        const locationList = document.getElementById('location-list')
        if (locationList) {
          locationList.classList.remove('active')
        }
      }
    })

    // Update close block event listener to be more robust
    const closeBlock = document.querySelector('.close-block')
    if (closeBlock) {
      closeBlock.addEventListener('click', () => {
        const wrapper = document.querySelector('.locations-map_wrapper')
        if (wrapper) {
          wrapper.classList.remove('is--show')
          this.clearRoute() // Clear the route when closing
        }
      })
    }

    // Also handle clicks on the close icon inside close-block
    document.addEventListener('click', (e) => {
      const closeIcon = e.target.closest('.close-block')
      if (closeIcon) {
        const wrapper = document.querySelector('.locations-map_wrapper')
        if (wrapper) {
          wrapper.classList.remove('is--show')
          this.clearRoute() // Clear the route when closing
        }
      }
    })
  }
}
