export class UIService {
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
                <button class="close-list" style="float: right; padding: 5px 10px; border: none; background: #eee; border-radius: 4px; cursor: pointer;">×</button>
                <h3>Route Information</h3>
                <p><strong>Total Distance:</strong> ${distance} km</p>
                <p><strong>Estimated Time:</strong> ${duration} minutes</p>
            </div>
            <div class="route-steps">
                <h3>Turn-by-Turn Directions</h3>
                <ol class="steps-list">
        `

    route.legs.forEach((leg) => {
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
        `

    routeInfoContainer.innerHTML = routeHTML
    this.injectRouteStyles()
  }

  static injectRouteStyles() {
    if (!document.getElementById('route-styles')) {
      const style = document.createElement('style')
      style.id = 'route-styles'
      style.textContent = `
                .route-info-container {
                    background: white;
                    border-radius: 4px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    margin: 10px;
                    padding: 15px;
                    min-width: 20rem;
                    max-height: 500px;
                    overflow-y: auto;
                }
                .route-summary {
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }
                .route-steps {
                    margin-top: 10px;
                }
                .steps-list {
                    padding-left: 20px;
                }
                .route-step {
                    margin: 10px 0;
                    padding: 5px 0;
                    border-bottom: 1px solid #f5f5f5;
                }
                .instruction {
                    display: block;
                    margin-bottom: 5px;
                }
                .distance {
                    display: block;
                    font-size: 0.9em;
                    color: #666;
                }
            `
      document.head.appendChild(style)
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

    // Existing event listener
    document.querySelector('.close-block')?.addEventListener('click', () => {
      document
        .querySelector('.locations-map_wrapper')
        ?.classList.remove('is--show')
    })
  }
}
