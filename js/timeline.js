// timeline.js - Brushable Timeline with Stacked Area Chart

let timelineSvg, xScale, yScale, brush, area, stack;
const margin = { top: 20, right: 30, bottom: 40, left: 60 };
let timelineWidth = 960;
const timelineHeight = 250;

function initTimeline() {
    const container = d3.select('#timeline');
    const containerNode = container.node();
    const width = containerNode ? containerNode.offsetWidth || 960 : 960;
    const height = 250;
    
    timelineSvg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', '#fafafa');
    
    // Load data and create timeline
    loadPowerPlantData().then(data => {
        createTimeline(data);
    });
}

function createTimeline(data) {
    const filteredData = getFilteredData();
    const capacityByYear = getCapacityByYear(filteredData);
    
    if (capacityByYear.length === 0) {
        timelineSvg.append('text')
            .attr('x', timelineWidth / 2)
            .attr('y', timelineHeight / 2)
            .attr('text-anchor', 'middle')
            .text('No data available for selected filters');
        return;
    }
    
    // Get all fuel types
    const fuelTypes = Array.from(new Set(filteredData.map(d => d.fuel))).sort();
    
    // Prepare stacked data
    const yearExtent = d3.extent(capacityByYear, d => d.year);
    const allYears = d3.range(Math.floor(yearExtent[0]), Math.ceil(yearExtent[1]) + 1);
    
    const stackedData = allYears.map(year => {
        const yearData = capacityByYear.find(d => d.year === year);
        const result = { year };
        fuelTypes.forEach(fuel => {
            result[fuel] = yearData && yearData.byFuel[fuel] ? yearData.byFuel[fuel] : 0;
        });
        return result;
    });
    
    timelineWidth = timelineSvg.node() ? timelineSvg.node().getBoundingClientRect().width || 960 : 960;
    
    // Create scales
    xScale = d3.scaleLinear()
        .domain(yearExtent)
        .range([margin.left, timelineWidth - margin.right]);
    
    yScale = d3.scaleLinear()
        .domain([0, d3.max(stackedData, d => d3.sum(fuelTypes, fuel => d[fuel]))])
        .nice()
        .range([timelineHeight - margin.bottom, margin.top]);
    
    // Requirement 1.3: Create Stacked Area Chart using d3-shape APIs
    // d3.stack() - Creates stacked data structure
    stack = d3.stack()
        .keys(fuelTypes)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
    
    const stacked = stack(stackedData);
    
    // d3.area() - Creates area path generator for stacked areas
    area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveMonotoneX);
    
    // Clear previous content
    timelineSvg.selectAll('*').remove();
    
    // Create main group
    const g = timelineSvg.append('g');
    
    // Add title "Capacity Timeline - Brush to Filter"
    g.append('text')
        .attr('x', timelineWidth / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text('Capacity Timeline - Brush to Filter');
    
    // Add "Drag to select" instruction in top right
    g.append('text')
        .attr('x', timelineWidth - margin.right)
        .attr('y', 15)
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', '#666')
        .style('font-style', 'italic')
        .text('Drag to select');
    
    // Draw stacked areas
    const areas = g.selectAll('.area')
        .data(stacked)
        .enter()
        .append('path')
        .attr('class', 'area')
        .attr('d', area)
        .attr('fill', d => getFuelColor(d.key))
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    
    // Requirement 1.3: Add axes using d3-axis APIs
    const xAxis = d3.axisBottom(xScale)
        .ticks(10)
        .tickFormat(d3.format('d'));
    
    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => d / 1000 + 'k');
    
    g.append('g')
        .attr('transform', `translate(0, ${timelineHeight - margin.bottom})`)
        .call(xAxis)
        .append('text')
        .attr('x', timelineWidth / 2)
        .attr('y', 35)
        .attr('fill', '#333')
        .style('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text('Commissioning Year');
    
    g.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -timelineHeight / 2)
        .attr('fill', '#333')
        .style('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text('Capacity (MW)');
    
    // Requirement 1.3: Implement Brush selection using d3-brush API
    // User can drag a box over a time range (e.g., 1970–1990)
    brush = d3.brushX()
        .extent([[margin.left, margin.top], [timelineWidth - margin.right, timelineHeight - margin.bottom]])
        .on('brush', handleBrush)
        .on('end', handleBrushEnd);
    
    const brushGroup = g.append('g')
        .attr('class', 'brush')
        .call(brush);
    
    // Add timeline legend
    addTimelineLegend(fuelTypes);
}

function addTimelineLegend(fuelTypes) {
    const legend = d3.select('#timeline-legend');
    legend.selectAll('.legend-item').remove();
    
    const items = legend.selectAll('.legend-item')
        .data(fuelTypes)
        .enter()
        .append('div')
        .attr('class', 'legend-item');
    
    items.append('div')
        .attr('class', 'legend-color')
        .style('background-color', d => getFuelColor(d));
    
    items.append('span')
        .text(d => d);
}

// Requirement 1.3: Brush selection handler
// Linked View: As the user brushes, both the Map and the Force Layout must instantly update
// to display only the power plants built within that time window
function handleBrush(event) {
    if (!event.selection) {
        // Brush cleared - show all data
        globalState.yearRange = null;
    } else {
        // Brush active - get selected time range (e.g., 1970–1990)
        const [x0, x1] = event.selection;
        const minYear = Math.floor(xScale.invert(x0));
        const maxYear = Math.ceil(xScale.invert(x1));
        globalState.yearRange = [minYear, maxYear];
        console.log(`Brush selection: ${minYear} - ${maxYear}`);
    }
    
    // Requirement 1.3: Linked View - Instantly update both Map and Force Layout
    // This ensures only power plants built within the brushed time window are displayed
    updateMap();           // Updates map instantly to show only plants in year range
    updateForceCluster();  // Updates force layout instantly to show only plants in year range
}

// Handle brush end event (when user finishes dragging)
function handleBrushEnd(event) {
    if (!event.selection) {
        // Brush cleared - show all data
        globalState.yearRange = null;
    } else {
        // Brush active - get selected time range (e.g., 1970–1990)
        const [x0, x1] = event.selection;
        const minYear = Math.floor(xScale.invert(x0));
        const maxYear = Math.ceil(xScale.invert(x1));
        globalState.yearRange = [minYear, maxYear];
        console.log(`Brush selection finalized: ${minYear} - ${maxYear}`);
    }
    
    // Requirement 1.3: Linked View - Instantly update both Map and Force Layout
    // This ensures only power plants built within the brushed time window are displayed
    updateMap();           // Updates map instantly to show only plants in year range
    updateForceCluster();  // Updates force layout instantly to show only plants in year range
}

function updateTimeline() {
    if (globalState.data) {
        createTimeline(globalState.data);
    }
}
