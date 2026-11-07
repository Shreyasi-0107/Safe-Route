// ============================================
// SafeRoute - Common Utilities (common.js)
// Shared across all pages
// ============================================

const API_BASE = '/api';

// Toggle mobile nav
function toggleNav() {
    const nav = document.getElementById('navLinks');
    if (nav) nav.classList.toggle('active');
}

// Type → Emoji icon mapping
function getTypeIcon(type) {
    const icons = {
        road_blocked: '🚧', waterlogging: '🌊', accident: '💥',
        fire: '🔥', unsafe_area: '⚠️', traffic_jam: '🚗',
        ambulance_access: '🚑', shelter_open: '🏠', shelter_closed: '🏚️', other: '❗'
    };
    return icons[type] || '❗';
}

// Type → Readable label
function getTypeLabel(type) {
    const labels = {
        road_blocked: 'Road Blocked', waterlogging: 'Waterlogging', accident: 'Accident',
        fire: 'Fire', unsafe_area: 'Unsafe Area', traffic_jam: 'Traffic Jam',
        ambulance_access: 'Ambulance Access', shelter_open: 'Shelter Open',
        shelter_closed: 'Shelter Closed', other: 'Other'
    };
    return labels[type] || type;
}

// Relative time (e.g. "2h ago")
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Format date nicely
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

// Severity → CSS class color
function getSeverityColor(severity) {
    const colors = {
        low: '#16a34a', medium: '#ca8a04', high: '#c2410c', critical: '#991b1b'
    };
    return colors[severity] || '#64748b';
}

// Severity → marker color hex
function getMarkerColor(severity) {
    const colors = {
        low: '#22c55e', medium: '#eab308', high: '#f97316', critical: '#ef4444'
    };
    return colors[severity] || '#3b82f6';
}

// Generic fetch helper with auth header
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(API_BASE + url, { ...options, headers });
    const data = await response.json();
    
    // If token expired, clear and redirect
    if (response.status === 401 && data.message && data.message.includes('expired')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return null;
    }
    
    return data;
}

// Show a toast notification
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 1.5rem; right: 1.5rem; padding: .75rem 1.25rem;
        border-radius: 8px; color: #fff; font-size: .9rem; font-weight: 500;
        z-index: 9999; animation: slideIn .3s ease; max-width: 350px;
        box-shadow: 0 4px 12px rgba(0,0,0,.2);
        background: ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb'};
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Add toast animation
const toastStyle = document.createElement('style');
toastStyle.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
document.head.appendChild(toastStyle);
