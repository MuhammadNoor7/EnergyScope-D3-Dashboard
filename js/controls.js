// controls.js - Play/Pause/Reset controls for all visualizations

let isPlaying = false;
let animationTimer = null;
let currentYear = null;
let yearRange = null;

// Initialize controls
function initControls() {
    // Add control buttons to the header or a control panel
    const controlsHtml = `
        <div style="display: flex; gap: 10px; align-items: center; margin-top: 15px;">
            <button id="play-pause-btn" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                ▶️ Play
            </button>
            <button id="reset-btn" style="padding: 10px 20px; background: #764ba2; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                ⏮️ Reset
            </button>
            <span id="animation-status" style="color: white; font-size: 14px; margin-left: 10px;"></span>
        </div>
    `;
    
    // Add controls to header or create a control panel
    const header = d3.select('.dashboard-header');
    if (!header.select('#animation-controls').empty()) {
        header.select('#animation-controls').remove();
    }
    
    header.append('div')
        .attr('id', 'animation-controls')
        .html(controlsHtml);
    
    // Set up event handlers
    d3.select('#play-pause-btn').on('click', togglePlayPause);
    d3.select('#reset-btn').on('click', resetAll);
    
    // Initialize year range from timeline if available
    if (globalState.data) {
        const years = globalState.data
            .map(d => d.year)
            .filter(d => d !== null && !isNaN(d))
            .sort((a, b) => a - b);
        
        if (years.length > 0) {
            yearRange = [years[0], years[years.length - 1]];
            currentYear = years[0];
        }
    }
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    const btn = d3.select('#play-pause-btn');
    const status = d3.select('#animation-status');
    
    if (isPlaying) {
        btn.html('⏸️ Pause');
        status.text('Animating through years...');
        startAnimation();
    } else {
        btn.html('▶️ Play');
        status.text('Paused');
        stopAnimation();
    }
}

function startAnimation() {
    if (!globalState.data) return;
    
    // Get all years from data
    const years = globalState.data
        .map(d => d.year)
        .filter(d => d !== null && !isNaN(d))
        .sort((a, b) => a - b);
    
    if (years.length === 0) return;
    
    // Remove duplicates
    const uniqueYears = [...new Set(years)];
    
    // Find current year or start from beginning
    let currentIndex = 0;
    if (currentYear !== null) {
        const idx = uniqueYears.indexOf(currentYear);
        if (idx >= 0) currentIndex = idx;
    }
    
    // Animate through years
    animationTimer = d3.interval(() => {
        if (!isPlaying) {
            animationTimer.stop();
            return;
        }
        
        // Update year range to current year
        currentYear = uniqueYears[currentIndex];
        globalState.yearRange = [currentYear, currentYear];
        
        // Update all visualizations
        updateMap();
        updateForceCluster();
        updateTimeline();
        
        // Move to next year
        currentIndex++;
        if (currentIndex >= uniqueYears.length) {
            currentIndex = 0; // Loop back
        }
    }, 500); // Update every 500ms
}

function stopAnimation() {
    if (animationTimer) {
        animationTimer.stop();
        animationTimer = null;
    }
}

function resetAll() {
    // Stop animation
    isPlaying = false;
    stopAnimation();
    
    // Reset filters
    globalState.selectedFuel = null;
    globalState.yearRange = null;
    currentYear = null;
    
    // Update UI
    d3.select('#play-pause-btn').html('▶️ Play');
    d3.select('#animation-status').text('Reset');
    d3.select('#filter-info').style('display', 'none');
    d3.select('#active-filter').text('None');
    
    // Clear timeline brush if it exists
    if (typeof brush !== 'undefined' && brush) {
        const brushSelection = d3.select('#timeline .brush');
        if (!brushSelection.empty()) {
            brushSelection.call(brush.move, null);
        }
    }
    
    // Reset force cluster selection
    if (typeof forceSvg !== 'undefined' && forceSvg) {
        forceSvg.selectAll('.fuel-node').select('circle')
            .attr('stroke-width', 2);
    }
    
    // Update all visualizations
    updateMap();
    updateForceCluster();
    updateTimeline();
    
    // Clear status after a moment
    setTimeout(() => {
        d3.select('#animation-status').text('');
    }, 1000);
}

// Export functions
if (typeof window !== 'undefined') {
    window.initControls = initControls;
    window.togglePlayPause = togglePlayPause;
    window.resetAll = resetAll;
}

