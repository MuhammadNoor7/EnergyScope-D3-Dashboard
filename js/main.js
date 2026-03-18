// main.js - Main initialization and coordination

// Initialize all components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load data first, then initialize components
    loadPowerPlantData().then(data => {
        if (data && data.length > 0) {
            const totalCapacity = d3.sum(data, d => d.capacity);
            const uniqueCountries = new Set(data.map(d => d.country));
            
            console.log(`Loaded ${data.length} power plants from ${uniqueCountries.size} countries`);
            
            // Update header stats
            d3.select('#header-plants').text(data.length.toLocaleString());
            d3.select('#header-capacity').text(totalCapacity.toFixed(0).toLocaleString() + ' MW');
            d3.select('#header-countries').text(uniqueCountries.size);
            
            // Initialize all dashboard components after data is loaded
            initMap();
            initForceCluster();
            initTimeline();
            initControls();
        } else {
            console.warn('No data loaded, initializing with empty state');
            initMap();
            initForceCluster();
            initTimeline();
            initControls();
        }
    }).catch(error => {
        console.error('Error loading data:', error);
        // Still initialize components
        initMap();
        initForceCluster();
        initTimeline();
        initControls();
    });
    
    console.log('Dashboard 1 initialized');
});
