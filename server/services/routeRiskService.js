// server/services/routeRiskService.js
// Calculates safety risk score for a given route based on nearby incidents
// Uses MongoDB geospatial queries to find incidents along the route

const Incident = require('../models/Incident');

// Severity risk scores
const RISK_SCORES = {
    low: 1,
    medium: 3,
    high: 6,
    critical: 10
};

// Risk level labels based on total score
const getRiskLabel = (score) => {
    if (score === 0) return { label: 'SAFE', color: '#28a745', emoji: '✅' };
    if (score <= 3) return { label: 'LOW RISK', color: '#90EE90', emoji: '🟡' };
    if (score <= 9) return { label: 'MEDIUM RISK', color: '#FFA500', emoji: '🟠' };
    if (score <= 19) return { label: 'HIGH RISK', color: '#FF4500', emoji: '🔴' };
    return { label: 'CRITICAL RISK', color: '#8B0000', emoji: '🆘' };
};

// ============================================
// Calculate risk score for a route
// routeCoordinates: array of [lng, lat] pairs from OSRM
// searchRadius: meters around each route point to check for incidents
// ============================================
const calculateRouteRisk = async (routeCoordinates, searchRadius = 500) => {
    try {
        // Sample route points (don't check every single point - too many DB queries)
        // Take every Nth point to keep queries manageable
        const sampleInterval = Math.max(1, Math.floor(routeCoordinates.length / 10));
        const samplePoints = [];

        for (let i = 0; i < routeCoordinates.length; i += sampleInterval) {
            samplePoints.push(routeCoordinates[i]);
        }
        // Always include the last point
        if (routeCoordinates.length > 0) {
            samplePoints.push(routeCoordinates[routeCoordinates.length - 1]);
        }

        // Find all unique incidents near any sample point along the route
        // Using $geoNear in a collection query isn't possible for multiple points
        // So we use $near for each sample point and collect unique results

        const incidentMap = new Map(); // Use Map to avoid duplicates by incident ID

        for (const point of samplePoints) {
            const [lng, lat] = point;

            // MongoDB geospatial query: $near finds incidents near this route point
            const nearbyIncidents = await Incident.find({
                status: 'active',
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [lng, lat]
                        },
                        $maxDistance: searchRadius
                    }
                }
            }).select('_id title type severity location description verificationCount').limit(5);

            nearbyIncidents.forEach(incident => {
                incidentMap.set(incident._id.toString(), incident);
            });
        }

        // Convert Map to array
        const affectingIncidents = Array.from(incidentMap.values());

        // Calculate total risk score
        let totalRiskScore = 0;
        affectingIncidents.forEach(incident => {
            totalRiskScore += RISK_SCORES[incident.severity] || 1;
        });

        const riskInfo = getRiskLabel(totalRiskScore);

        return {
            riskScore: totalRiskScore,
            riskLabel: riskInfo.label,
            riskColor: riskInfo.color,
            riskEmoji: riskInfo.emoji,
            affectingIncidents: affectingIncidents.map(inc => ({
                id: inc._id,
                title: inc.title,
                type: inc.type,
                severity: inc.severity,
                description: inc.description,
                coordinates: inc.location.coordinates,
                verificationCount: inc.verificationCount,
                riskScore: RISK_SCORES[inc.severity] || 1
            })),
            incidentCount: affectingIncidents.length,
            searchRadius
        };

    } catch (error) {
        console.error('Route risk calculation error:', error);
        return {
            riskScore: 0,
            riskLabel: 'UNKNOWN',
            riskColor: '#808080',
            riskEmoji: '❓',
            affectingIncidents: [],
            incidentCount: 0,
            searchRadius,
            error: 'Could not calculate risk score'
        };
    }
};

module.exports = { calculateRouteRisk, getRiskLabel, RISK_SCORES };
