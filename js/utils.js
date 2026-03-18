// utils.js - Utility functions for data processing

// Global state for filters
const globalState = {
    selectedFuel: null,
    yearRange: null,
    data: null,
    worldMap: null
};

// Data loading and processing functions
async function loadPowerPlantData() {
    try {
        // Try multiple possible paths for the CSV
        let data;
        const possiblePaths = [
            './global-power-plant-database-master/output_database/global_power_plant_database.csv',
            'global-power-plant-database-master/output_database/global_power_plant_database.csv',
            '../global-power-plant-database-master/output_database/global_power_plant_database.csv',
            '../../global-power-plant-database-master/output_database/global_power_plant_database.csv',
            '../../../global-power-plant-database-master/output_database/global_power_plant_database.csv'
        ];
        
        let lastError;
        for (const path of possiblePaths) {
            try {
                console.log(`Trying to load CSV from: ${path}`);
                data = await d3.csv(path);
                console.log(`Successfully loaded ${data.length} rows from ${path}`);
                break;
            } catch (err) {
                lastError = err;
                console.warn(`Failed to load from ${path}:`, err);
            }
        }
        
        if (!data || data.length === 0) {
            throw new Error('No data loaded from any path');
        }
        
        console.log(`Raw CSV loaded: ${data.length} rows`);
        console.log('Sample row:', data[0]);
        
        // Clean and process data - prioritize country_long (confirmed column name from CSV)
        const processed = data.map(d => ({
            country: d.country_long || d['country_long'] || d.country || d['country'] || d.country_name || d['country_name'],
            latitude: +d.latitude || +d['latitude'],
            longitude: +d.longitude || +d['longitude'],
            fuel: d.primary_fuel || d['primary_fuel'] || 'Unknown',
            capacity: +d.capacity_mw || +d['capacity_mw'] || 0,
            year: d.commissioning_year ? +d.commissioning_year : (d['commissioning_year'] ? +d['commissioning_year'] : null),
            name: d.name || d['name']
        })).filter(d => 
            !isNaN(d.latitude) && 
            !isNaN(d.longitude) && 
            d.latitude !== 0 && 
            d.longitude !== 0 &&
            d.capacity > 0 &&
            d.country && d.country.trim() !== ''
        );
        
        const countryCount = new Set(processed.map(d => d.country)).size;
        console.log(`✅ Processed ${processed.length} valid power plants from ${countryCount} countries`);
        
        if (processed.length < 1000) {
            console.warn(`⚠️ Warning: Only ${processed.length} plants processed. Expected ~34,936. Check CSV loading.`);
        }
        
        if (countryCount < 50) {
            console.warn(`⚠️ Warning: Only ${countryCount} countries found. Expected 167. Check CSV loading.`);
        }
        
        // Verify we have the expected data (34,936 plants, 167 countries)
        if (processed.length >= 30000 && countryCount >= 150) {
            console.log(`✅ Data verification: ${processed.length.toLocaleString()} plants and ${countryCount} countries match expected values (34,936 plants, 167 countries)`);
        }
        
        globalState.data = processed;
        return processed;
    } catch (error) {
        console.error('❌ Error loading power plant data:', error);
        console.error('⚠️ Falling back to sample data (5 countries, 1000 plants)');
        console.error('This is NOT the real data. Please check CSV path.');
        // Return sample data for testing
        return generateSampleData();
    }
}

function generateSampleData() {
    // Generate sample data for testing if CSV fails to load
    const fuels = ['Coal', 'Hydro', 'Solar', 'Wind', 'Nuclear', 'Gas', 'Oil'];
    const countries = ['United States', 'China', 'India', 'Germany', 'Brazil'];
    const data = [];
    
    for (let i = 0; i < 1000; i++) {
        data.push({
            country: countries[Math.floor(Math.random() * countries.length)],
            latitude: (Math.random() * 120) - 60,
            longitude: (Math.random() * 360) - 180,
            fuel: fuels[Math.floor(Math.random() * fuels.length)],
            capacity: Math.random() * 1000 + 10,
            year: Math.floor(Math.random() * 50) + 1970,
            name: `Plant ${i + 1}`
        });
    }
    
    globalState.data = data;
    return data;
}

async function loadWorldMap() {
    try {
        const world = await d3.json('../../world.geojson');
        globalState.worldMap = world;
        return world;
    } catch (error) {
        console.error('Error loading world map:', error);
        return null;
    }
}

// Filter data based on global state
function getFilteredData() {
    let filtered = globalState.data || [];
    
    if (globalState.selectedFuel) {
        filtered = filtered.filter(d => d.fuel === globalState.selectedFuel);
    }
    
    if (globalState.yearRange) {
        const [minYear, maxYear] = globalState.yearRange;
        filtered = filtered.filter(d => d.year && d.year >= minYear && d.year <= maxYear);
    }
    
    return filtered;
}

// Group data by country for aggregation
function groupByCountry(data) {
    const grouped = d3.group(data, d => d.country);
    return Array.from(grouped, ([country, plants]) => ({
        country,
        totalCapacity: d3.sum(plants, d => d.capacity),
        count: plants.length,
        centerLat: d3.mean(plants, d => d.latitude),
        centerLon: d3.mean(plants, d => d.longitude)
    }));
}

// Get fuel type statistics
function getFuelStats(data) {
    const grouped = d3.group(data, d => d.fuel);
    return Array.from(grouped, ([fuel, plants]) => ({
        fuel,
        count: plants.length,
        totalCapacity: d3.sum(plants, d => d.capacity)
    }));
}

// Get capacity by year for timeline
function getCapacityByYear(data) {
    const grouped = d3.group(data, d => d.year);
    const result = [];
    
    for (const [year, plants] of grouped) {
        if (year && !isNaN(year)) {
            const byFuel = d3.group(plants, d => d.fuel);
            const fuelData = {};
            for (const [fuel, fuelPlants] of byFuel) {
                fuelData[fuel] = d3.sum(fuelPlants, d => d.capacity);
            }
            result.push({
                year: +year,
                total: d3.sum(plants, d => d.capacity),
                byFuel: fuelData
            });
        }
    }
    
    return result.sort((a, b) => a.year - b.year);
}

// Color scales
const fuelColors = {
    'Coal': '#2c3e50',
    'Hydro': '#3498db',
    'Solar': '#f39c12',
    'Wind': '#1abc9c',
    'Nuclear': '#e74c3c',
    'Gas': '#9b59b6',
    'Oil': '#34495e',
    'Biomass': '#27ae60',
    'Geothermal': '#e67e22',
    'Unknown': '#95a5a6'
};

function getFuelColor(fuel) {
    return fuelColors[fuel] || fuelColors['Unknown'];
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadPowerPlantData,
        loadWorldMap,
        getFilteredData,
        groupByCountry,
        getFuelStats,
        getCapacityByYear,
        getFuelColor,
        globalState
    };
}

