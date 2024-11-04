// Initialize the MapLibre map
const map = new maplibregl.Map({
    container: 'map', // ID of the HTML element for the map
    style: 'https://api.maptiler.com/maps/darkmatter/style.json?key=BQ8hpDbxV4HMINiQ8NOz', // Dark base map style
    center: [-3.2, 55], // Center the map on your area of interest
    zoom: 5
});

// Add navigation controls to the map (zoom in/out)
map.addControl(new maplibregl.NavigationControl());

// Load the JSON data and add the wind farm layer
map.on('load', () => {
    // Load the JSON file and process it
    fetch('wind_farms.json')
        .then(response => response.json())
        .then(data => {
            // Process each feature to extract the year from the Operational timestamp
            data.features.forEach(feature => {
                const timestamp = feature.properties.Operational;
                const year = new Date(timestamp).getFullYear(); // Convert UNIX timestamp to year
                feature.properties.start_year = year; // Add as a new property
            });

            // Add processed data as source
            map.addSource('windFarms', {
                type: 'geojson',
                data: data // JSON data with start_year
            });

            // Add a circle layer for the wind farms
            map.addLayer({
                id: 'windFarmsLayer',
                type: 'circle',
                source: 'windFarms',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#00bfff',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 1
                }
            });

            // Add popups on click
            map.on('click', 'windFarmsLayer', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const properties = e.features[0].properties;
                const name = properties.Site_Name || 'N/A';
                const capacity = properties.Installed_Capacity__MWelec_ || 'N/A';
                const year = properties.start_year || 'Unknown';

                // Construct the popup content
                const popupContent = `
                    <strong>${name}</strong><br>
                    Capacity: ${capacity} MW<br>
                    Operational Since: ${year}
                `;

                // Create the popup and set its coordinates and HTML content
                new maplibregl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(popupContent)
                    .addTo(map);

                // Temporarily change cursor to indicate a click
                map.getCanvas().style.cursor = 'progress';
                setTimeout(() => {
                    map.getCanvas().style.cursor = 'pointer';
                }, 200); // Reset cursor after 200ms
            });

            // Change cursor to pointer when hovering over a point
            map.on('mouseenter', 'windFarmsLayer', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            // Change cursor back when no longer hovering
            map.on('mouseleave', 'windFarmsLayer', () => {
                map.getCanvas().style.cursor = '';
            });

            // Add the slider filter functionality
            const slider = document.getElementById('yearSlider');
            const label = document.getElementById('yearLabel');

            slider.addEventListener('input', (event) => {
                const selectedYear = parseInt(event.target.value, 10);
                label.textContent = `Year: ${selectedYear}`;

                // Filter wind farms based on the selected year
                map.setFilter('windFarmsLayer', [
                    'all',
                    ['<=', ['get', 'start_year'], selectedYear]
                ]);
            });
        });
});
