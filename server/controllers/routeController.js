// server/controllers/routeController.js
// Handles OSRM route calculation and risk analysis

const { calculateRouteRisk } = require('../services/routeRiskService');

// OSRM Base URL - uses public demo server by default
// Can be changed to local OSRM server via env variable
const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

// ============================================
// POST /api/routes/calculate
// Calculate route using OSRM and analyze safety
// ============================================
const calculateRoute = async (req, res) => {
    try {
        const {
            startLng, startLat,
            endLng, endLat,
            searchRadius = 500
        } = req.body;

        // Validate coordinates
        if (!startLng || !startLat || !endLng || !endLat) {
            return res.status(400).json({
                success: false,
                message: 'Please provide start and end coordinates: startLng, startLat, endLng, endLat'
            });
        }

        // ============================================
        // OSRM Route Request
        // Format: /route/v1/{profile}/{lng,lat};{lng,lat}
        // alternatives=true requests alternative routes
        // geometries=geojson returns route as GeoJSON
        // steps=true includes turn-by-turn instructions
        // ============================================
        const osrmUrl = `${OSRM_BASE_URL}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?alternatives=true&geometries=geojson&overview=full&steps=true`;

        let osrmData;
        try {
            const response = await fetch(osrmUrl);

            if (!response.ok) {
                throw new Error(`OSRM returned status ${response.status}`);
            }

            osrmData = await response.json();
        } catch (fetchError) {
            console.error('OSRM fetch error:', fetchError.message);
            return res.status(503).json({
                success: false,
                message: 'Routing service is temporarily unavailable. Please try again later.',
                hint: 'The application uses OSRM demo server. Check your internet connection.'
            });
        }

        // Handle OSRM error responses
        if (osrmData.code !== 'Ok') {
            return res.status(400).json({
                success: false,
                message: `Could not find a route: ${osrmData.message || osrmData.code}`
            });
        }

        if (!osrmData.routes || osrmData.routes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No route found between these locations'
            });
        }

        // ============================================
        // Process each route and calculate risk
        // ============================================
        const processedRoutes = await Promise.all(
            osrmData.routes.map(async (route, index) => {
                // Extract coordinate pairs from GeoJSON geometry
                const routeCoordinates = route.geometry.coordinates; // [[lng, lat], [lng, lat], ...]

                // Calculate risk score using MongoDB geospatial queries
                const riskData = await calculateRouteRisk(routeCoordinates, parseInt(searchRadius));

                return {
                    routeIndex: index,
                    distance: route.distance,        // meters
                    duration: route.duration,         // seconds
                    distanceKm: (route.distance / 1000).toFixed(1),
                    durationMin: Math.round(route.duration / 60),
                    geometry: route.geometry,
                    legs: route.legs,
                    ...riskData
                };
            })
        );

        // Sort routes by risk score (lowest risk first = recommended)
        processedRoutes.sort((a, b) => a.riskScore - b.riskScore);

        // Mark the recommended route
        processedRoutes[0].isRecommended = true;

        res.json({
            success: true,
            routes: processedRoutes,
            waypoints: osrmData.waypoints,
            disclaimer: 'Route safety is based on crowd-sourced reports and may not reflect current conditions. Always follow official emergency instructions.',
            routeCount: processedRoutes.length
        });

    } catch (error) {
        console.error('Calculate route error:', error);
        res.status(500).json({ success: false, message: 'Server error during route calculation.' });
    }
};

module.exports = { calculateRoute };
