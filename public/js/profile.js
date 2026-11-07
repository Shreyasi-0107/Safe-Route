// ============================================
// SafeRoute - Profile Page Logic (profile.js)
// Loads user profile, reports, notifications
// ============================================

// Require auth
if (!requireAuth()) {
    // requireAuth() redirects to login
}

(async function loadProfile() {
    try {
        const data = await apiFetch('/users/profile');
        if (!data || !data.success) {
            showToast('Failed to load profile', 'error');
            return;
        }

        const user = data.user;

        // Avatar - first letter of name
        const avatar = document.getElementById('profileAvatar');
        if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();

        // Profile card
        setText('profileName', user.name);
        setText('profileEmail', user.email);
        setText('reputationBadge', user.reputationLabel || 'New Reporter');
        setText('repScore', user.reputation || 0);
        setText('reportsCount', user.reportsCount || 0);
        setText('verifiedCount', user.verifiedReportsCount || 0);

        // Detail table
        setText('detailName', user.name);
        setText('detailEmail', user.email);
        setText('detailRole', user.role === 'admin' ? '🛡️ Admin' : '👤 User');
        setText('detailJoined', formatDate(user.createdAt));
        setText('detailRep', `${user.reputation} pts (${user.reputationLabel})`);
        setText('detailReports', user.reportsCount || 0);
        setText('detailVerified', user.verifiedReportsCount || 0);
        setText('detailIncorrect', user.incorrectReportsCount || 0);

        // Recent reports
        renderReports(data.recentIncidents || []);

        // Load notifications
        await loadNotifications();

    } catch (err) {
        console.error('Profile load error:', err);
        showToast('Error loading profile', 'error');
    }
})();

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderReports(incidents) {
    const container = document.getElementById('myReports');
    if (!container) return;

    if (incidents.length === 0) {
        container.innerHTML = '<p class="no-data">No reports yet. <a href="/report.html">Report an incident</a></p>';
        return;
    }

    container.innerHTML = incidents.map(inc => `
        <div class="report-item">
            <div class="report-info">
                <span>${getTypeIcon(inc.type)}</span>
                <div>
                    <strong>${escapeHtml(inc.title)}</strong>
                    <div class="report-meta">
                        <span class="severity-badge severity-${inc.severity}">${inc.severity}</span>
                        ${inc.status !== 'active' ? `<span style="margin-left:.5rem;color:#64748b">(${inc.status})</span>` : ''}
                    </div>
                </div>
            </div>
            <span class="report-meta">✅ ${inc.verificationCount || 0} · ${timeAgo(inc.createdAt)}</span>
        </div>
    `).join('');
}

async function loadNotifications() {
    try {
        const data = await apiFetch('/users/notifications');
        const container = document.getElementById('notifications');
        if (!container) return;

        if (!data?.success || !data.notifications?.length) {
            container.innerHTML = '<p class="no-data">No notifications</p>';
            return;
        }

        container.innerHTML = data.notifications.map(n => `
            <div class="notif-item ${n.isRead ? '' : 'unread'}">
                <div>${escapeHtml(n.message)}</div>
                <div class="notif-time">${timeAgo(n.createdAt)}</div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Notifications error:', err);
    }
}

// Escape HTML helper (fallback if common.js not loaded)
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
