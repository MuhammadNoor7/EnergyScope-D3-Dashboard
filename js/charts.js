// charts.js - Force-Directed Fuel Clustering

let forceSvg, simulation, nodes, links;

function initForceCluster() {
    const container = d3.select('#force-cluster');
    const containerNode = container.node();
    const width = containerNode ? containerNode.offsetWidth || 800 : 800;
const height = 600;

    forceSvg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', '#fafafa');

// Load data and create force simulation
    loadPowerPlantData().then(data => {
        createForceSimulation(data);
    });
}

function createForceSimulation(data) {
    const containerNode = forceSvg.node();
    const width = containerNode ? containerNode.getBoundingClientRect().width || 800 : 800;
    const height = 600;
    const filteredData = getFilteredData();
    const fuelStats = getFuelStats(filteredData);
    
    // Create nodes for each fuel type (Requirement 1.2: Each node is a "Fuel Type")
    nodes = fuelStats.map(d => ({
        id: d.fuel,
        count: d.count,
        capacity: d.totalCapacity,
        // Radius based on capacity - ensures all fuel types are visible
        radius: Math.sqrt(d.totalCapacity) * 0.3
    }));
    
    // Clear previous simulation
    if (simulation) {
        simulation.stop();
    }
    
    // Create force simulation (Requirement 1.2: Force-Directed Fuel Clustering)
    // Using d3-force APIs: d3.forceSimulation, d3.forceManyBody, d3.forceCenter, d3.forceCollide
    simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(-300)) // Repulsion between nodes
        .force('center', d3.forceCenter(width / 2, height / 2)) // Center attraction
        .force('collision', d3.forceCollide().radius(d => d.radius + 10)) // Prevent overlap (Requirement 1.2)
        .on('tick', updateForceNodes);
    
    // Initial render
    updateForceNodes();
    
    // Create legend
    createForceLegend();
}

function updateForceNodes() {
    const nodeSelection = forceSvg.selectAll('.fuel-node')
        .data(nodes, d => d.id);
    
    // Enter
    const nodeEnter = nodeSelection.enter()
        .append('g')
        .attr('class', 'fuel-node')
        .attr('cursor', 'pointer')
        .on('click', handleFuelClick);
    
    nodeEnter.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => getFuelColor(d.id))
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
    
    nodeEnter.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('font-size', d => Math.min(d.radius / 3, 14))
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)') // Better text visibility
        .text(d => d.id);
    
    // Update - nodes float around with force simulation
    nodeSelection.select('circle')
                .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    
    nodeSelection.select('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    
    // Exit
    nodeSelection.exit().remove();
}

function handleFuelClick(event, d) {
    // Requirement 1.2: Clicking a "Fuel" node acts as a global filter
    // Toggle selection
    if (globalState.selectedFuel === d.id) {
        globalState.selectedFuel = null;
        d3.select(event.currentTarget).select('circle')
            .attr('stroke-width', 2);
        d3.select('#filter-info').style('display', 'none');
        d3.select('#active-filter').text('None');
    } else {
        globalState.selectedFuel = d.id;
        // Highlight selected
        forceSvg.selectAll('.fuel-node').select('circle')
            .attr('stroke-width', node => node.id === globalState.selectedFuel ? 4 : 2);
        d3.select('#filter-info').style('display', 'block');
        d3.select('#active-filter').text(d.id);
    }
    
    // Requirement 1.2: The Map (Req 1.1) must update to show only selected fuel plants
    // Update all visualizations
    updateMap(); // Updates map to show only selected fuel type
    updateTimeline();
    createForceSimulation(globalState.data);
}

function updateForceCluster() {
    if (globalState.data) {
        createForceSimulation(globalState.data);
    }
}

// Create legend
function createForceLegend() {
    const legend = d3.select('#force-legend');
    legend.html('<strong>Click a fuel type to filter the map</strong>');
}
