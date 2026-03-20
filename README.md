# EnergyScope D3 Dashboard

A detailed interactive dashboard for spatial, network, and temporal analysis of global power plant data, built with pure D3.js.

![Overview](https://github.com/MuhammadNoor7/EnergyScope-D3-Dashboard/blob/main/screenshots/gppa-overview.jpg)

## Project Overview

EnergyScope D3 Dashboard is an advanced single-page visualization project designed to explore the global power plant landscape across countries, fuel types, and time. It combines multiple coordinated views to support rich exploratory analysis:

- A zoomable world map with semantic zooming for geographic exploration.
- A force-directed fuel clustering view for understanding relationships between energy sources.
- A brushable timeline for time-based filtering and temporal analysis.
- Linked visualizations that update together to reveal patterns across ~35k power plants in 167 countries.
- A pure D3.js implementation without heavyweight dashboard frameworks.

The project is designed to make a large global energy dataset approachable, interactive, and visually explainable.

## Screenshots

### Dashboard Overview

![Dashboard Overview](https://github.com/MuhammadNoor7/EnergyScope-D3-Dashboard/blob/main/screenshots/gppa-overview.jpg)

The main dashboard shows the coordinated visualization layout and the overall analytical workspace.

### Force-Directed Fuel Clustering

![Force-Directed Fuel Clustering](https://github.com/MuhammadNoor7/EnergyScope-D3-Dashboard/blob/main/screenshots/force-dir-fuel-clustering.jpg)

This view groups power plants by fuel type using force-directed positioning to make energy-source relationships easier to inspect.

### Brushable Timeline

![Brushable Timeline](https://github.com/MuhammadNoor7/EnergyScope-D3-Dashboard/blob/main/screenshots/brushable-timeline.jpg)

The timeline supports brushing so users can focus on a selected time range and analyze changes over time.

### Play/Pause Interface

![Play Pause Interface](https://github.com/MuhammadNoor7/EnergyScope-D3-Dashboard/blob/main/screenshots/play-pause-interface.jpg)

The play/pause controls enable animated temporal exploration and step-through interaction.

## Key Features

- Pure D3.js implementation for maximum control over rendering and interactions.
- Coordinated multiple views for linked exploration.
- Interactive world map with semantic zooming.
- Fuel-based force clustering for high-level structure discovery.
- Brush-based time filtering with play/pause controls.
- Data-driven rendering of thousands of records efficiently.
- Designed for global-scale power plant analysis.

## Repository Structure

### Root files

- `.gitignore` — Git ignore rules for local and generated files.
- `LICENSE` — Repository license.
- `README.md` — Main project documentation.

### data/

Contains the source dataset and supporting data dependencies.

- `global_power_plant_database.csv` — The main dataset used by the dashboard.
- `requirements.txt` — Data-related Python dependencies or setup requirements.

### html/

Contains the main HTML entry point.

- `index.html` — The application shell and page structure used to load the dashboard.

### js/

Contains the JavaScript modules that power the visualization and interactions.

- `charts.js` — Chart composition and visualization logic.
- `controls.js` — UI controls, buttons, filters, and interaction handling.
- `main.js` — Application bootstrap and initialization logic.
- `map.js` — World map rendering and geographic interactions.
- `timeline.js` — Timeline rendering, brushing, and temporal playback logic.
- `utils.js` — Shared helper functions used across the app.

### screenshots/

Contains screenshots used to document and explain the project visually.

- `gppa-overview.jpg`
- `force-dir-fuel-clustering.jpg`
- `brushable-timeline.jpg`
- `play-pause-interface.jpg`

## How It Works

1. The application loads the global power plant dataset from the `data/` directory.
2. JavaScript modules in `js/` prepare, filter, and transform data for visualization.
3. The HTML shell in `html/index.html` loads the app and connects the visual components.
4. D3.js renders the coordinated map, clustering, and timeline views.
5. User interactions such as brushing, zooming, and playback update all linked views.

## Data Overview

The project is centered around global power plant data with attributes that support spatial and temporal analysis. The dashboard is intended to help users inspect:

- Geographic distribution of power plants.
- Fuel type and technology clustering.
- Country-level and regional patterns.
- Time-based development and historical trends.
- Cross-view relationships between location, fuel, and timeline.

## Usage

Open `html/index.html` in a browser or serve the project through a local web server to explore the dashboard.

## Notes

- The project is built with pure D3.js.
- The dashboard is intended for interactive exploratory analysis.
- The screenshots included in this README reflect the key visual components of the project.

## License

This project is licensed under the terms of the license in the `LICENSE` file.
