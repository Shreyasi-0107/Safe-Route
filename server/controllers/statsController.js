const Incident = require('../models/Incident');
const Shelter = require('../models/Shelter');

exports.summary = async (req, res) => {
  try {
    const [activeIncidents, highSeverity, openShelters] = await Promise.all([
      Incident.countDocuments({ status: 'active' }),
      Incident.countDocuments({ status: 'active', severity: { $in: ['high', 'critical'] } }),
      Shelter.countDocuments({ status: 'open' })
    ]);
    res.json({ success: true, activeIncidents, highSeverity, openShelters });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load stats' });
  }
};