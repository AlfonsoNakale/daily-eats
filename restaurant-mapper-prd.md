# Restaurant Mapping Application PRD

Version: 1.0
Date: January 14, 2025
Author: [Alfonso]

## Problem Statement

Users need a convenient way to discover and locate restaurants and pubs in their area. Currently, existing solutions may not provide an intuitive map-based interface or comprehensive restaurant information.

## Product Vision

-Website: <https://daily-eats-2.webflow.io/> "developed with Webflow"

Enhance my website with javascript to enable additional features to my Mapbox integration.

## Target Audience

- Local residents looking for dining and pubs options
- Tourists exploring new areas
- Food enthusiasts researching restaurants
- Restaurant owners wanting to increase visibility

## Features and Requirements

## Map Display

- Interactive map using Mapbox CDN (mapbox token 'pk.eyJ1IjoiZGFpbHllYXRzIiwiYSI6ImNtNXo3bTQ0NDAxYW4yaXIycXIyMHV1MDUifQ.YdvOoOG92-BO5FY3KviEPA')
- Restaurant locations displayed as markers
- Basic zoom and pan controls
- Current location detection (optional)

## Restaurant Information

- Restaurant name
- Address
- Cuisine type
- Operating hours
- Contact information

## Search and Filter

- Search by location/area
- Filter by cuisine type
- Filter by operating hours
- Distance-based search

## Technical Requirements

- Compatible with modern browsers
- Mapbox GL JS integration
- Mapbox directions integration
- Collapsible sidebar for filters
- Smooth animations for interactions
- Map interaction response < 100ms
- Maximum marker render time < 1 second
- Mobile-optimized performance

## Security Requirements

- Secure API key management
- Data privacy compliance
- User location permission handling
- Rate limiting for API calls

## Future Enhancements (Post-MVP)

- User reviews and ratings
- Restaurant owner dashboard
- Booking integration
- Social sharing features
- Favorites/bookmarking system

## Proposed File Structure

├── src/
│   ├── main.js
│   ├── styles/
│   ├── components/
│   ├── services/
│   ├── utils/
│   ├── config/
│   └── assets/

## Current JavaScript Code that runs the Mapbox integration

<!--
<script src='https://api.tiles.mapbox.com/mapbox-gl-js/v2.2.0/mapbox-gl.js'></script>
<link href='https://api.tiles.mapbox.com/mapbox-gl-js/v2.2.0/mapbox-gl.css' rel='stylesheet' />

<style>
/*style map popups*/
.mapboxgl-popup-content {
 pointer-events: auto;
  border-radius: 4px;
  box-shadow: none;
  padding: 12px 16px;
  color: #161616;
  background-color: #fefae0;
}
/*popup bottom arrow color*/
.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
    border-top-color: #fefae0;
}
</style>-->

<!--
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.3/jquery.min.js"></script>

<script>
class MapManager {
    constructor() {
        this.userLocation = null;
        this.mapLocations = {
            type: "FeatureCollection",
            features: []
        };
        this.map = null;
        this.popup = null;
        this.activeRoute = null;
        this.initializeMap();
    }

    initializeMap() {
        mapboxgl.accessToken = "pk.eyJ1IjoiZGFpbHllYXRzIiwiYSI6ImNtNXo3bTQ0NDAxYW4yaXIycXIyMHV1MDUifQ.YdvOoOG92-BO5FY3KviEPA";

        this.map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/streets-v12",
            minZoom: 2
        });

        this.map.addControl(new mapboxgl.NavigationControl());

        const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        });
        this.map.addControl(geolocateControl);

        this.popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            maxWidth: '300px'
        });

        this.setupEventListeners();
    }

    getUserLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lng: position.coords.longitude,
                        lat: position.coords.latitude
                    };

                    this.getGeoData();
                    
                    this.map.flyTo({
                        center: [this.userLocation.lng, this.userLocation.lat],
                        zoom: 13,
                        essential: true,
                        duration: 2000
                    });

                    new mapboxgl.Marker({
                        color: "#FF0000"
                    })
                        .setLngLat([this.userLocation.lng, this.userLocation.lat])
                        .addTo(this.map);

                    this.addMapPoints();
                },
                (error) => {
                    console.warn("Error getting user location:", error);
                    this.getGeoData();
                    this.addMapPoints();
                    this.setupCountryZoom();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            console.warn("Geolocation is not supported by this browser");
            this.getGeoData();
            this.addMapPoints();
            this.setupCountryZoom();
        }
    }

    getGeoData() {
        const locationNodes = document.querySelectorAll("#location-list > *");
        
        this.mapLocations.features = Array.from(locationNodes).map((location, index) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    parseFloat(location.querySelector("#locationLongitude").value),
                    parseFloat(location.querySelector("#locationLatitude").value)
                ]
            },
            properties: {
                id: location.querySelector("#locationID").value,
                description: location.querySelector(".locations-map_card").innerHTML,
                arrayID: index
            }
        }));
    }

    addMapPoints() {
        const layerId = 'locations';
        
        if (this.map.getLayer(layerId)) {
            this.map.removeLayer(layerId);
        }

        if (this.map.getSource(layerId)) {
            this.map.removeSource(layerId);
        }

        this.map.addSource(layerId, {
            type: "geojson",
            data: this.mapLocations
        });

        this.map.addLayer({
            id: layerId,
            type: "circle",
            source: layerId,
            paint: {
                "circle-radius": ["interpolate", ["linear"], ["zoom"],
                    10, 6,
                    15, 12
                ],
                "circle-stroke-width": 1,
                "circle-color": "#FF9900",
                "circle-opacity": 0.9,
                "circle-stroke-color": "#405F3B"
            }
        });
    }

    showPopup(e) {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        this.popup.setLngLat(coordinates)
                  .setHTML(description)
                  .addTo(this.map);
    }

    setupCountryZoom() {
        this.map.addSource('country-boundaries', {
            type: 'vector',
            url: 'mapbox://mapbox.country-boundaries-v1',
            promoteId: 'iso_3166_1'
        });

        this.map.addLayer({
            'id': 'country-boundaries',
            'type': 'fill',
            'source': 'country-boundaries',
            'source-layer': 'country_boundaries',
            'paint': {
                'fill-opacity': 0
            },
            'filter': ['==', ['get', 'iso_3166_1'], 'GB']
        });

        const bounds = new mapboxgl.LngLatBounds();
        const handleSourceData = (e) => {
            if (e.sourceId !== 'country-boundaries' || !this.map.isSourceLoaded('country-boundaries')) {
                return;
            }

            const features = this.map.querySourceFeatures('country-boundaries', {
                sourceLayer: 'country_boundaries'
            });
            
            if (features.length > 0) {
                features.forEach(feature => {
                    if (feature.geometry && feature.geometry.coordinates) {
                        feature.geometry.coordinates.forEach(ring => {
                            ring.forEach(coord => {
                                bounds.extend(coord);
                            });
                        });
                    }
                });
                
                this.map.fitBounds(bounds, {
                    padding: { top: 50, bottom: 50, left: 50, right: 50 },
                    duration: 1000,
                    maxZoom: 12
                });

                this.map.off('sourcedata', handleSourceData);
            }
        };

        this.map.on('sourcedata', handleSourceData);
    }

    fetchDirections(destination) {
        if (!this.userLocation) {
            console.error("User location is not set.");
            return;
        }

        const { lng, lat } = this.userLocation;
        const destinationLng = destination[0];
        const destinationLat = destination[1];
        const profile = 'driving';

        const queryUrl = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${lng},${lat};${destinationLng},${destinationLat}?steps=true&geometries=geojson&overview=full&annotations=distance,duration&access_token=${mapboxgl.accessToken}`;

        fetch(queryUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    this.activeRoute = route;
                    this.displayRoute(route.geometry.coordinates);
                    this.displayRouteInfo(route);
                } else {
                    console.error('No routes found');
                }
            })
            .catch(error => console.error('Error fetching directions:', error));
    }

    displayRoute(routeCoordinates) {
        const layerId = 'route';

        if (this.map.getLayer(layerId)) {
            this.map.removeLayer(layerId);
            this.map.removeSource(layerId);
        }

        this.map.addSource(layerId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: routeCoordinates
                }
            }
        });

        this.map.addLayer({
            id: layerId,
            type: 'line',
            source: layerId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#FF0000',
                'line-width': 5
            }
        });

        const coordinates = routeCoordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        this.map.fitBounds(bounds, {
            padding: 50
        });
    }

    displayRouteInfo(route) {
        let routeInfoContainer = document.getElementById('route-info');
        if (!routeInfoContainer) {
            routeInfoContainer = document.createElement('div');
            routeInfoContainer.id = 'route-info';
            routeInfoContainer.className = 'route-info-container';
            document.querySelector('.locations-map_wrapper').appendChild(routeInfoContainer);
        }

        const distance = (route.distance / 1000).toFixed(1);
        const duration = Math.round(route.duration / 60);

        let routeHTML = `
            <div class="route-summary">
                <h3>Route Information</h3>
                <p><strong>Total Distance:</strong> ${distance} km</p>
                <p><strong>Estimated Time:</strong> ${duration} minutes</p>
            </div>
            <div class="route-steps">
                <h3>Turn-by-Turn Directions</h3>
                <ol class="steps-list">
        `;

        route.legs.forEach(leg => {
            leg.steps.forEach(step => {
                const instruction = step.maneuver.instruction;
                const stepDistance = step.distance < 1000 
                    ? `${Math.round(step.distance)}m` 
                    : `${(step.distance / 1000).toFixed(1)}km`;
                
                routeHTML += `
                    <li class="route-step">
                        <span class="instruction">${instruction}</span>
                        <span class="distance">${stepDistance}</span>
                    </li>
                `;
            });
        });

        routeHTML += `
                </ol>
            </div>
        `;

        routeInfoContainer.innerHTML = routeHTML;

        const style = document.createElement('style');
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
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        this.map.on('load', () => {
            this.getUserLocation();

            this.map.on("click", "locations", (e) => {
                const ID = e.features[0].properties.arrayID;
                
                this.showPopup(e);
                
                const destinationCoordinates = [
                    e.features[0].geometry.coordinates[0],
                    e.features[0].geometry.coordinates[1]
                ];

                this.fetchDirections(destinationCoordinates);

                $(".locations-map_wrapper").addClass("is--show");
                $(".locations-map_item.is--show").removeClass("is--show");
                $(".locations-map_item").eq(ID).addClass("is--show");

                this.map.easeTo({
                    center: e.features[0].geometry.coordinates,
                    speed: 0.5,
                    curve: 1,
                    duration: 1000
                });
            });

            this.map.on('mouseenter', 'locations', (e) => {
                this.map.getCanvas().style.cursor = 'pointer';
                this.showPopup(e);
            });

            this.map.on('mouseleave', 'locations', () => {
                this.map.getCanvas().style.cursor = '';
                this.popup.remove();
            });
        });

        $(".close-block").on("click", () => {
            $(".locations-map_wrapper").removeClass("is--show");
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MapManager();
});
</script>
 -->

## Usefull Sites

<https://alfonsos-wondrous-site-1abcc4.design.webflow.com/>
<https://www.landingfolio.com/library/select-box/webflow>
<https://salty-dev.webflow.io/>
<https://preview.webflow.com/preview/mapbox-webflow-cms?utm_medium=preview_link&utm_source=showcase&utm_content=mapbox-webflow-cms&preview=db480d31042743f2871b69c7f9832508>
<https://www.localfinds.co.uk/listings>
