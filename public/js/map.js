// ============================================
// SafeRoute - Leaflet Map Manager (map.js)
// Initializes Leaflet map, manages markers/popups
// ============================================

// Default center: Phagwara, Punjab area (from seed data)
const DEFAULT_CENTER = [31.22, 75.77];
const DEFAULT_ZOOM = 12;

let map;
let incidentMarkers = [];
let shelterMarkers = [];
let routeLayers = [];

// Initialize the Leaflet map
function initMap(elementId = 'map', center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM) {
    map = L.map(elementId).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Add legend control
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
            <h4>Legend</h4>
            <div class="legend-item"><span class="legend-dot" style="background:#ef4444"></span> Critical</div>
            <div class="legend-item"><span class="legend-dot" style="background:#f97316"></span> High</div>
            <div class="legend-item"><span class="legend-dot" style="background:#eab308"></span> Medium</div>
            <div class="legend-item"><span class="legend-dot" style="background:#22c55e"></span> Low</div>
            <div class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span> Shelter</div>
        `;
        return div;
    };
    legend.addTo(map);

    return map;
}

// Create a colored circle marker for incidents
function createIncidentMarker(incident) {
    const coords = incident.location.coordinates; // [lng, lat]
    const color = getMarkerColor(incident.severity);

    const marker = L.circleMarker([coords[1], coords[0]], {
        radius: incident.severity === 'critical' ? 12 : incident.severity === 'high' ? 10 : 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.85
    });

    const popupHtml = `
        <div class="popup-content">
            <span class="popup-type">${getTypeIcon(incident.type)} ${getTypeLabel(incident.type)}</span>
            <h4>${escapeHtml(incident.title)}</h4>
            <p>${escapeHtml(incident.description?.substring(0, 120) || '')}${(incident.description?.length || 0) > 120 ? '...' : ''}</p>
            <span class="severity-badge severity-${incident.severity}">${incident.severity}</span>
            <div class="popup-meta">
                <span>✅ ${incident.verificationCount || 0} confirmed</span>
                <span>${timeAgo(incident.createdAt)}</span>
            </div>
            ${incident.location.address ? `<p style="font-size:.75rem;margin-top:.3rem">📍 ${escapeHtml(incident.location.address)}</p>` : ''}
            ${getVerifyButtons(incident._id)}
        </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 280 });
    marker.incidentData = incident;
    return marker;
}

// Create a shelter marker
function createShelterMarker(shelter) {
    const coords = shelter.location.coordinates;
    const marker = L.circleMarker([coords[1], coords[0]], {
        radius: 10,
        fillColor: '#3b82f6',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.85
    });

    const occupancy = shelter.currentOccupancy || 0;
    const pct = shelter.capacity > 0 ? Math.round((occupancy / shelter.capacity) * 100) : 0;

    const popupHtml = `
        <div class="popup-content shelter-popup">
            <h4>🏠 ${escapeHtml(shelter.name)}</h4>
            <p>📍 ${escapeHtml(shelter.address)}</p>
            <p>Status: <strong>${shelter.status}</strong></p>
            <div class="capacity-bar"><div class="capacity-fill" style="width:${pct}%"></div></div>
            <p style="font-size:.78rem">${occupancy}/${shelter.capacity} occupied (${pct}%)</p>
            ${shelter.facilities?.length ? `<p style="font-size:.78rem">🏗️ ${shelter.facilities.join(', ')}</p>` : ''}
            ${shelter.contact?.phone ? `<p style="font-size:.78rem">📞 ${shelter.contact.phone}</p>` : ''}
        </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 280 });
    marker.shelterData = shelter;
    return marker;
}

// Get verify/dispute buttons HTML (only if logged in)
function getVerifyButtons(incidentId) {
    const token = localStorage.getItem('token');
    if (!token) return '';
    return `
        <div class="verify-actions">
            <button class="verify-btn confirm" onclick="verifyIncident('${incidentId}','confirm')">✅ Confirm</button>
            <button class="verify-btn dispute" onclick="verifyIncident('${incidentId}','false_report')">❌ Dispute</button>
        </div>
    `;
}

// Verify/dispute an incident
async function verifyIncident(incidentId, type) {
    try {
        const data = await apiFetch(`/incidents/${incidentId}/verify`, {
            method: 'POST',
            body: JSON.stringify({ type })
        });
        if (data && data.success) {
            showToast(data.message, 'success');
            map.closePopup();
        } else {
            showToast(data?.message || 'Verification failed', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
}

// Add incident markers to map
function addIncidentMarkers(incidents) {
    clearIncidentMarkers();
    incidents.forEach(inc => {
        if (inc.location?.coordinates) {
            const marker = createIncidentMarker(inc);
            marker.addTo(map);
            incidentMarkers.push(marker);
        }
    });
}

// Add shelter markers to map
function addShelterMarkers(shelters) {
    clearShelterMarkers();
    shelters.forEach(s => {
        if (s.location?.coordinates) {
            const marker = createShelterMarker(s);
            marker.addTo(map);
            shelterMarkers.push(marker);
        }
    });
}

// Clear markers
function clearIncidentMarkers() { incidentMarkers.forEach(m => map.removeLayer(m)); incidentMarkers = []; }
function clearShelterMarkers() { shelterMarkers.forEach(m => map.removeLayer(m)); shelterMarkers = []; }
function clearRoutes() { routeLayers.forEach(l => map.removeLayer(l)); routeLayers = []; }

// Draw a route polyline on the map
function drawRoute(geometry, color = '#2563eb', weight = 5, opacity = 0.7) {
    const coords = geometry.coordinates.map(c => [c[1], c[0]]); // [lat, lng]
    const polyline = L.polyline(coords, { color, weight, opacity }).addTo(map);
    routeLayers.push(polyline);
    return polyline;
}

// Focus map on a specific point
function focusOnPoint(lat, lng, zoom = 15) {
    map.setView([lat, lng], zoom);
}

// Fit map to show all markers
function fitMapToMarkers() {
    const allMarkers = [...incidentMarkers, ...shelterMarkers];
    if (allMarkers.length > 0) {
        const group = L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// HTML escape helper
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
