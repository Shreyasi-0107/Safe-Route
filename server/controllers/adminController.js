// server/controllers/adminController.js
// Admin-only operations and MongoDB aggregation statistics

const User = require('../models/User');
const Incident = require('../models/Incident');
const Shelter = require('../models/Shelter');
const Verification = require('../models/Verification');
const Notification = require('../models/Notification');

// ============================================
// GET /api/admin/statistics
// Comprehensive statistics using MongoDB aggregation
// ============================================
const getStatistics = async (req, res) => {
    try {
        // ---- Basic Counts ----
        const totalIncidents = await Incident.countDocuments();
        const activeIncidents = await Incident.countDocuments({ status: 'active' });
        const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });
        const totalUsers = await User.countDocuments();
        const totalShelters = await Shelter.countDocuments();
        const openShelters = await Shelter.countDocuments({ status: 'open' });
        const totalVerifications = await Verification.countDocuments();

        // ---- MongoDB Aggregation: Incidents by Type ----
        // $group groups documents by the 'type' field and counts them
        const incidentsByType = await Incident.aggregate([
            { $match: { status: 'active' } },
            {
                $group: {
                    _id: '$type',          // Group by incident type
                    count: { $sum: 1 }     // Count each document
                }
            },
            { $sort: { count: -1 } }       // Sort descending
        ]);

        // ---- MongoDB Aggregation: Incidents by Severity ----
        const incidentsBySeverity = await Incident.aggregate([
            {
                $group: {
                    _id: '$severity',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // ---- MongoDB Aggregation: Incidents by Status ----
        const incidentsByStatus = await Incident.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // ---- MongoDB Aggregation: Incidents per Day (last 7 days) ----
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const incidentsPerDay = await Incident.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        // $dateToString formats the date as YYYY-MM-DD for grouping
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        // ---- MongoDB Aggregation: Top Reporters using $lookup ----
        // $lookup is like SQL JOIN - it joins users with their incidents
        const topReporters = await User.aggregate([
            { $match: { reportsCount: { $gt: 0 } } },
            {
                $project: {
                    name: 1,
                    email: 1,
                    reportsCount: 1,
                    verifiedReportsCount: 1,
                    reputation: 1
                }
            },
            { $sort: { reportsCount: -1 } },
            { $limit: 10 }
        ]);

        // ---- MongoDB Aggregation: Average verification count ----
        const avgVerification = await Incident.aggregate([
            {
                $group: {
                    _id: null,
                    avgVerificationCount: { $avg: '$verificationCount' },
                    maxVerificationCount: { $max: '$verificationCount' },
                    totalVerifications: { $sum: '$verificationCount' }
                }
            }
        ]);

        // ---- High severity incidents count ----
        const highSeverityCount = await Incident.countDocuments({
            severity: { $in: ['high', 'critical'] },
            status: 'active'
        });

        res.json({
            success: true,
            statistics: {
                overview: {
                    totalIncidents,
                    activeIncidents,
                    resolvedIncidents,
                    totalUsers,
                    totalShelters,
                    openShelters,
                    totalVerifications,
                    highSeverityCount
                },
                incidentsByType,
                incidentsBySeverity,
                incidentsByStatus,
                incidentsPerDay,
                topReporters,
                verification: avgVerification[0] || { avgVerificationCount: 0, maxVerificationCount: 0, totalVerifications: 0 }
            }
        });

    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// GET /api/admin/users
// Get all users (admin only)
// ============================================
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .sort({ createdAt: -1 })
            .select('-__v');

        res.json({ success: true, count: users.length, users });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// GET /api/admin/incidents
// Get all incidents with user details (using populate/$lookup)
// ============================================
const getAllIncidents = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, severity, type } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (severity) filter.severity = severity;
        if (type) filter.type = type;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const incidents = await Incident.find(filter)
            .populate('reportedBy', 'name email reputation role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Incident.countDocuments(filter);

        res.json({
            success: true,
            count: incidents.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            incidents
        });

    } catch (error) {
        console.error('Admin get incidents error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// PUT /api/admin/incidents/:id/status
// Update incident status (admin only)
// ============================================
const updateIncidentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'resolved', 'expired', 'false_report'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        res.json({ success: true, message: 'Status updated', incident });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// DELETE /api/admin/incidents/:id
// Delete any incident (admin only)
// ============================================
const adminDeleteIncident = async (req, res) => {
    try {
        const incident = await Incident.findByIdAndDelete(req.params.id);

        if (!incident) {
            return res.status(404).json({ success: false, message: 'Incident not found' });
        }

        // Clean up related verifications
        await Verification.deleteMany({ incidentId: req.params.id });

        res.json({ success: true, message: 'Incident deleted by admin' });

    } catch (error) {
        console.error('Admin delete incident error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ============================================
// PUT /api/admin/users/:id/role
// Change user role (admin only)
// ============================================
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: `User role updated to ${role}`, user });

    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
    getStatistics,
    getAllUsers,
    getAllIncidents,
    updateIncidentStatus,
    adminDeleteIncident,
    updateUserRole
};
