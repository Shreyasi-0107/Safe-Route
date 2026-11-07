// ============================================
// SafeRoute - Auth State Manager (auth.js)
// Manages login state, nav updates, logout
// ============================================

(function initAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const profileNav = document.getElementById('profileNavItem');
    const adminNav = document.getElementById('adminNavItem');
    const loginNav = document.getElementById('loginNavItem');
    const logoutNav = document.getElementById('logoutNavItem');

    if (token && user) {
        // User is logged in
        if (profileNav) profileNav.style.display = '';
        if (loginNav) loginNav.style.display = 'none';
        if (logoutNav) logoutNav.style.display = '';

        // Show admin link if admin
        if (user.role === 'admin' && adminNav) {
            adminNav.style.display = '';
        }
    } else {
        // Not logged in
        if (profileNav) profileNav.style.display = 'none';
        if (adminNav) adminNav.style.display = 'none';
        if (loginNav) loginNav.style.display = '';
        if (logoutNav) logoutNav.style.display = 'none';
    }
})();

// Logout function - called from nav
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Logged out successfully', 'success');
    setTimeout(() => window.location.href = '/', 500);
}

// Check if user is authenticated - redirect to login if not
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Check if user is admin
function requireAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.role !== 'admin') {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Get current user from localStorage
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}
