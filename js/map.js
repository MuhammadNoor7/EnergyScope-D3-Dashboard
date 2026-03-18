// map.js - Zoomable Aggregate Map with Semantic Zooming

let mapSvg, mapG, projection, path, zoom, currentZoomLevel = 1;
const ZOOM_THRESHOLD = 2; // Threshold for switching between aggregate and individual view

function initMap() {
    const container = d3.select('#map');
    const containerNode = container.node();
    const width = containerNode ? containerNode.offsetWidth || 960 : 960;
    const height = 600;
    
    mapSvg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', '#fafafa');
    
    // Create projection
    projection = d3.geoMercator()
        .scale(150)
        .translate([width / 2, height / 2])
        .center([0, 20]);
    
    path = d3.geoPath().projection(projection);
    
    // Create main group for zoomable content
    mapG = mapSvg.append('g');
    
    // Add zoom behavior
    zoom = d3.zoom()
        .scaleExtent([0.5, 8])
        .on('zoom', handleZoom);
    
    mapSvg.call(zoom);
    
    // Load and render world map
    loadWorldMap().then(worldData => {
        if (worldData) {
            renderWorldMap(worldData);
        }
        // Load and render power plant data
        loadPowerPlantData().then(data => {
            if (data && data.length > 0) {
                renderPowerPlants(data);
            }
        });
    });
}

function renderWorldMap(worldData) {
    mapG.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(worldData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', '#e8e8e8')
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5);
}

function renderPowerPlants(data) {
    const filteredData = getFilteredData();
    
    // Clear existing plants
    mapG.selectAll('.power-plant').remove();
    mapG.selectAll('.country-aggregate').remove();
    
    if (currentZoomLevel < ZOOM_THRESHOLD) {
        // Show aggregated view by country
        renderAggregateView(filteredData);
    } else {
        // Show individual plants
        renderIndividualView(filteredData);
    }
}

function renderAggregateView(data) {
    const countryGroups = groupByCountry(data);
    
    const aggregates = mapG.append('g')
        .attr('class', 'country-aggregates')
        .selectAll('circle')
        .data(countryGroups)
        .enter()
        .append('circle')
        .attr('class', 'country-aggregate')
        .attr('cx', d => projection([d.centerLon, d.centerLat])[0])
        .attr('cy', d => projection([d.centerLon, d.centerLat])[1])
        .attr('r', d => Math.sqrt(d.totalCapacity) * 0.1)
        .attr('fill', '#667eea')
        .attr('fill-opacity', 0.6)
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            showTooltip(event, {
                country: d.country,
                capacity: d.totalCapacity.toFixed(2) + ' MW',
                plants: d.count + ' plants'
            });
        })
        .on('mouseout', hideTooltip);
}

function renderIndividualView(data) {
    // Limit rendering for performance
    const maxPoints = 5000;
    const sampleData = data.length > maxPoints 
        ? d3.shuffle(data).slice(0, maxPoints)
        : data;
    
    const plants = mapG.append('g')
        .attr('class', 'power-plants')
        .selectAll('circle')
        .data(sampleData)
        .enter()
        .append('circle')
        .attr('class', 'power-plant')
        .attr('cx', d => projection([d.longitude, d.latitude])[0])
        .attr('cy', d => projection([d.longitude, d.latitude])[1])
        .attr('r', d => Math.sqrt(d.capacity) * 0.05)
        .attr('fill', d => getFuelColor(d.fuel))
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event, d) {
            showTooltip(event, {
                name: d.name,
                fuel: d.fuel,
                capacity: d.capacity.toFixed(2) + ' MW',
                country: d.country,
                year: d.year || 'Unknown'
            });
        })
        .on('mouseout', hideTooltip);
}

function handleZoom(event) {
    currentZoomLevel = event.transform.k;
    mapG.attr('transform', event.transform);
    
    // Re-render based on zoom level
    const data = globalState.data;
    if (data) {
        renderPowerPlants(data);
    }
}

function showTooltip(event, data) {
    const tooltip = d3.select('#tooltip');
    let html = '';
    for (const [key, value] of Object.entries(data)) {
        html += `<strong>${key}:</strong> ${value}<br>`;
    }
    tooltip
        .html(html)
        .style('display', 'block')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
}

function hideTooltip() {
    d3.select('#tooltip').style('display', 'none');
}

// Update map when filters change
function updateMap() {
    if (globalState.data) {
        renderPowerPlants(globalState.data);
    }
}
