// ============================================
// SafeRoute - Dashboard Logic (dashboard.js)
// Loads incidents, stats, filters, feed
// ============================================

let allIncidents = [];
let allShelters = [];
let currentFilter = 'all';
let showingShelters = false;

// Initialize dashboard
(async function initDashboard() {
    initMap('map');
    await loadDashboardData();
})();

// Load all dashboard data
async function loadDashboardData() {
    try {
        const [incData, shelData] = await Promise.all([
            apiFetch('/incidents?status=active&limit=200'),
            apiFetch('/shelters?status=open')
        ]);

        if (incData?.success) {
            allIncidents = incData.incidents || [];
            addIncidentMarkers(allIncidents);
            renderIncidentFeed(allIncidents);
            updateStats(allIncidents, allShelters);
        }

        if (shelData?.success) {
            allShelters = shelData.shelters || [];
            addShelterMarkers(allShelters);
            updateStats(allIncidents, allShelters);
        }

        fitMapToMarkers();
    } catch (err) {
        console.error('Dashboard load error:', err);
        document.getElementById('incidentFeed').innerHTML = '<p class="no-data">Failed to load data.</p>';
    }
}

// Update stats bar
function updateStats(incidents, shelters) {
    const activeEl = document.getElementById('activeCount');
    const criticalEl = document.getElementById('criticalCount');
    const shelterEl = document.getElementById('shelterCount');

    if (activeEl) activeEl.textContent = incidents.length;
    if (criticalEl) criticalEl.textContent = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;
    if (shelterEl) shelterEl.textContent = shelters.length;
}

// Render the incident feed sidebar
function renderIncidentFeed(incidents) {
    const feed = document.getElementById('incidentFeed');
    if (!feed) return;

    if (incidents.length === 0) {
        feed.innerHTML = '<p class="no-data">No incidents found</p>';
        return;
    }

    feed.innerHTML = incidents.map(inc => `
        <div class="feed-item severity-${inc.severity}" onclick="focusOnIncident('${inc._id}')">
            <div class="feed-item-header">
                <span class="feed-item-title">${getTypeIcon(inc.type)} ${escapeHtml(inc.title)}</span>
                <span class="severity-badge severity-${inc.severity}">${inc.severity}</span>
            </div>
            <div class="feed-item-desc">${escapeHtml(inc.description?.substring(0, 80) || '')}</div>
            <div class="feed-item-meta">
                <span>✅ ${inc.verificationCount || 0}</span>
                <span>${timeAgo(inc.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

// Focus map on a specific incident
function focusOnIncident(id) {
    const marker = incidentMarkers.find(m => m.incidentData?._id === id);
    if (marker) {
        const coords = marker.incidentData.location.coordinates;
        focusOnPoint(coords[1], coords[0], 16);
        marker.openPopup();
    }
}

// Filter incidents by type
function filterIncidents(type, btn) {
    showingShelters = false;
    currentFilter = type;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    let filtered = allIncidents;
    if (type !== 'all') {
        filtered = allIncidents.filter(i => i.type === type);
    }

    // Update markers and feed
    addIncidentMarkers(filtered);
    addShelterMarkers(allShelters);
    renderIncidentFeed(filtered);

    if (filtered.length > 0) {
        const group = L.featureGroup(incidentMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Show shelters on map
function filterShelters(btn) {
    showingShelters = true;

    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    clearIncidentMarkers();
    addShelterMarkers(allShelters);

    // Show shelters in feed
    const feed = document.getElementById('incidentFeed');
    if (allShelters.length === 0) {
        feed.innerHTML = '<p class="no-data">No open shelters found</p>';
        return;
    }

    feed.innerHTML = allShelters.map(s => `
        <div class="feed-item" style="border-left-color:#3b82f6" onclick="focusOnShelter('${s._id}')">
            <div class="feed-item-header">
                <span class="feed-item-title">🏠 ${escapeHtml(s.name)}</span>
                <span class="severity-badge severity-low">${s.status}</span>
            </div>
            <div class="feed-item-desc">${escapeHtml(s.address)}</div>
            <div class="feed-item-meta">
                <span>👥 ${s.currentOccupancy || 0}/${s.capacity}</span>
                <span>${s.facilities?.length || 0} facilities</span>
            </div>
        </div>
    `).join('');

    if (shelterMarkers.length > 0) {
        const group = L.featureGroup(shelterMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Focus on a shelter
function focusOnShelter(id) {
    const marker = shelterMarkers.find(m => m.shelterData?._id === id);
    if (marker) {
        const coords = marker.shelterData.location.coordinates;
        focusOnPoint(coords[1], coords[0], 16);
        marker.openPopup();
    }
}
