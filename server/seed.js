// server/seed.js
// Database seeder - inserts realistic demo data for SafeRoute
// Run with: npm run seed   (or: node server/seed.js)
//
// WARNING: this DELETES all users, incidents, shelters, verifications and
// notifications first. Accounts you registered by hand will be removed.
//
// Optional environment variables (set them before seeding a public database):
//   MONGODB_URI          - database to seed (defaults to local MongoDB)
//   SEED_ADMIN_PASSWORD  - password for admin@saferoute.com (default: admin123, local use only)
//   SEED_USER_PASSWORD   - password for user@saferoute.com  (default: user123, local use only)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Incident = require('./models/Incident');
const Shelter = require('./models/Shelter');
const Verification = require('./models/Verification');
const Notification = require('./models/Notification');

// Demo incidents stay "active" for this many days after seeding.
const DEMO_EXPIRY_DAYS = 90;

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);
const demoExpiry = () => new Date(Date.now() + DEMO_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

// Random password for the fictional users, so no shared password sits in the code.
// "Aa1" guarantees an uppercase letter, a lowercase letter and a digit.
const randomPassword = () => 'Aa1' + crypto.randomBytes(12).toString('hex');

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'user123';

// Connect to MongoDB
const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saferoute';
    await mongoose.connect(mongoURI);
    console.log(`✅ Connected to MongoDB for seeding: ${mongoose.connection.host} / ${mongoose.connection.name}`);
};

// ============================================
// SEED DATA - Realistic Indian Locations
// (Phagwara, Jalandhar, Ludhiana area)
// ============================================

// Fictional users (NOT real people)
const usersData = [
    { name: 'Admin User', email: 'admin@saferoute.com', password: ADMIN_PASSWORD, role: 'admin', reputation: 100 },
    { name: 'Rajan Sharma', email: 'rajan.sharma@email.com', password: randomPassword(), reputation: 45, reportsCount: 8, verifiedReportsCount: 6 },
    { name: 'Priya Verma', email: 'priya.verma@email.com', password: randomPassword(), reputation: 32, reportsCount: 5, verifiedReportsCount: 4 },
    { name: 'Amit Kumar', email: 'amit.kumar@email.com', password: randomPassword(), reputation: 67, reportsCount: 12, verifiedReportsCount: 10 },
    { name: 'Sunita Patel', email: 'sunita.patel@email.com', password: randomPassword(), reputation: 15, reportsCount: 3, verifiedReportsCount: 2 },
    { name: 'Harjit Singh', email: 'harjit.singh@email.com', password: randomPassword(), reputation: 23, reportsCount: 4, verifiedReportsCount: 3 },
    { name: 'Meena Devi', email: 'meena.devi@email.com', password: randomPassword(), reputation: 8, reportsCount: 2, verifiedReportsCount: 1 },
    { name: 'Vikram Mehta', email: 'vikram.mehta@email.com', password: randomPassword(), reputation: 56, reportsCount: 9, verifiedReportsCount: 8 },
    { name: 'Kavita Rao', email: 'kavita.rao@email.com', password: randomPassword(), reputation: 28, reportsCount: 5, verifiedReportsCount: 4 },
    { name: 'Suresh Gupta', email: 'suresh.gupta@email.com', password: randomPassword(), reputation: 41, reportsCount: 7, verifiedReportsCount: 5 },
    { name: 'Anita Joshi', email: 'anita.joshi@email.com', password: randomPassword(), reputation: 19, reportsCount: 3, verifiedReportsCount: 2 },
    { name: 'Test User', email: 'user@saferoute.com', password: USER_PASSWORD, reputation: 0, reportsCount: 0 }
];

// Shelter data around Phagwara/Jalandhar/Ludhiana
const sheltersData = [
    {
        name: 'Government School Relief Camp',
        address: 'Government High School, Phagwara, Punjab',
        capacity: 500,
        currentOccupancy: 120,
        status: 'open',
        contact: { phone: '01824-261001', name: 'Relief Coordinator' },
        location: { type: 'Point', coordinates: [75.7720, 31.2240] },
        facilities: ['Food', 'Water', 'First Aid', 'Beds', 'Toilets'],
        notes: 'Open 24/7 during emergency'
    },
    {
        name: 'Civil Hospital Emergency Shelter',
        address: 'Civil Hospital Road, Phagwara',
        capacity: 200,
        currentOccupancy: 45,
        status: 'open',
        contact: { phone: '01824-261234', name: 'Dr. Ramesh' },
        location: { type: 'Point', coordinates: [75.7688, 31.2198] },
        facilities: ['Food', 'Water', 'First Aid', 'Medical Staff', 'Beds'],
        notes: 'Medical assistance available'
    },
    {
        name: 'Community Hall Flood Relief',
        address: 'Nehru Community Hall, Phagwara Bus Stand Area',
        capacity: 300,
        currentOccupancy: 300,
        status: 'full',
        contact: { phone: '01824-261555', name: 'Sarpanch Balwinder' },
        location: { type: 'Point', coordinates: [75.7745, 31.2260] },
        facilities: ['Food', 'Water', 'Toilets'],
        notes: 'Currently at full capacity'
    },
    {
        name: 'Jalandhar District Emergency Center',
        address: 'District Administrative Complex, Jalandhar',
        capacity: 1000,
        currentOccupancy: 234,
        status: 'open',
        contact: { phone: '0181-2454567', name: 'District Collector Office' },
        location: { type: 'Point', coordinates: [75.5762, 31.3260] },
        facilities: ['Food', 'Water', 'First Aid', 'Electricity', 'Beds', 'Toilets', 'Medical Staff', 'WiFi'],
        notes: 'Main relief center for Jalandhar'
    },
    {
        name: 'Guru Nanak Stadium Shelter',
        address: 'Guru Nanak Stadium, Jalandhar',
        capacity: 800,
        currentOccupancy: 156,
        status: 'open',
        contact: { phone: '0181-2223344', name: 'Sports Authority Contact' },
        location: { type: 'Point', coordinates: [75.5680, 31.3180] },
        facilities: ['Food', 'Water', 'Toilets', 'Beds'],
        notes: 'Large open area available'
    },
    {
        name: 'Ludhiana Civil Lines Relief Camp',
        address: 'Civil Lines, Ludhiana',
        capacity: 600,
        currentOccupancy: 0,
        status: 'closed',
        contact: { phone: '0161-2401234', name: 'Emergency Control Room' },
        location: { type: 'Point', coordinates: [75.8573, 30.9010] },
        facilities: ['Food', 'Water', 'First Aid', 'Beds'],
        notes: 'Currently closed. Will open when required.'
    },
    {
        name: 'Phagwara Gurudwara Langar Camp',
        address: 'Shri Gurudwara Sahib, Model Town, Phagwara',
        capacity: 400,
        currentOccupancy: 89,
        status: 'open',
        contact: { phone: '01824-262000', name: 'Granthi Sahib' },
        location: { type: 'Point', coordinates: [75.7810, 31.2310] },
        facilities: ['Food', 'Water', 'Beds'],
        notes: 'Langar (free food) available 24 hours'
    },
    {
        name: 'NIT Jalandhar Emergency Camp',
        address: 'NIT Campus, Jalandhar-Kapurthala Road',
        capacity: 250,
        currentOccupancy: 67,
        status: 'open',
        contact: { phone: '0181-2690301', name: 'NIT Administration' },
        location: { type: 'Point', coordinates: [75.5337, 31.3959] },
        facilities: ['Food', 'Water', 'First Aid', 'Electricity', 'WiFi'],
        notes: 'Institute hostel available for emergency'
    }
];

// Incidents around Phagwara, Jalandhar, Ludhiana
// ageHours = how long ago the report was made (spreads them over ~6 days
// so the admin "Last 7 Days" chart has several bars).
// createdAt, updatedAt and expiresAt are filled in by the .map() at the end.
const getIncidentsData = (users) => [
    {
        title: 'Major Flooding on NH-44 Near Phagwara',
        type: 'waterlogging',
        description: 'NH-44 is completely submerged near Phagwara bypass. Water level is approximately 3 feet. All vehicles are stuck. Use alternate routes.',
        severity: 'critical',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7750, 31.2200], address: 'NH-44, Phagwara Bypass' },
        reportedBy: users[1]._id,
        verificationCount: 12,
        metadata: { waterLevel: '3 feet', vehicleAccess: false, affectedLaneCount: 4 },
        ageHours: 3
    },
    {
        title: 'Road Blocked Due to Fallen Tree',
        type: 'road_blocked',
        description: 'A large tree has fallen on the road near Model Town Phagwara. Only one lane is open. Traffic is very slow.',
        severity: 'high',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7820, 31.2330], address: 'Model Town Road, Phagwara' },
        reportedBy: users[2]._id,
        verificationCount: 7,
        metadata: { roadName: 'Model Town Road', vehicleAccess: true, lanesBlocked: 1 },
        ageHours: 7
    },
    {
        title: 'Serious Accident at Phagwara Chowk',
        type: 'accident',
        description: 'Two trucks collided at the main chowk. Ambulance has been called. Police are managing traffic. Avoid this area.',
        severity: 'critical',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7700, 31.2280], address: 'Phagwara Main Chowk' },
        reportedBy: users[3]._id,
        verificationCount: 15,
        metadata: { vehiclesInvolved: 2, injuriesReported: true, emergencyServicesCalled: true },
        ageHours: 2
    },
    {
        title: 'Waterlogging in Bus Stand Area',
        type: 'waterlogging',
        description: 'Bus stand area has severe waterlogging after heavy rains. Buses are not operating. Drainage system is blocked.',
        severity: 'high',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7680, 31.2250], address: 'Phagwara Bus Stand' },
        reportedBy: users[4]._id,
        verificationCount: 9,
        metadata: { waterLevel: '1.5 feet', vehicleAccess: false, busServiceAffected: true },
        ageHours: 26
    },
    {
        title: 'Fire at Industrial Area',
        type: 'fire',
        description: 'A factory in the industrial area is on fire. Fire brigade has reached but fire is still spreading. People in surrounding area should evacuate.',
        severity: 'critical',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7900, 31.2180], address: 'Industrial Area, Phagwara' },
        reportedBy: users[5]._id,
        verificationCount: 20,
        metadata: { fireSize: 'large', emergencyServicesCalled: true, evacuationRequired: true },
        ageHours: 5
    },
    {
        title: 'Unsafe Area - Power Lines Down',
        type: 'unsafe_area',
        description: 'High-tension power lines have fallen near the canal road. Extreme danger. Do not enter this zone.',
        severity: 'critical',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7650, 31.2350], address: 'Canal Road, Phagwara' },
        reportedBy: users[6]._id,
        verificationCount: 11,
        metadata: { hazardType: 'electric', powerSupplyCut: false, dangerRadius: '200 meters' },
        ageHours: 1
    },
    {
        title: 'Heavy Traffic Jam on GT Road',
        type: 'traffic_jam',
        description: 'GT Road near Phagwara has heavy traffic jam due to waterlogging. Vehicles are moving very slowly. Expected delay: 2 hours.',
        severity: 'medium',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7730, 31.2170], address: 'GT Road, Phagwara' },
        reportedBy: users[7]._id,
        verificationCount: 6,
        metadata: { expectedDelay: '2 hours', alternateRoute: 'Use Nakodar Road' },
        ageHours: 9
    },
    {
        title: 'Ambulance Access Blocked',
        type: 'ambulance_access',
        description: 'Ambulance cannot reach Sector 7 colony due to waterlogging on the approach road. Medical emergency situation.',
        severity: 'critical',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7790, 31.2290], address: 'Sector 7, Phagwara' },
        reportedBy: users[8]._id,
        verificationCount: 8,
        metadata: { blockageType: 'waterlogging', alternateAccessPossible: false },
        ageHours: 14
    },
    {
        title: 'Shelter Open at Gurudwara',
        type: 'shelter_open',
        description: 'Gurudwara in Model Town has opened for flood-affected people. Free food and water available. Capacity for 400 people.',
        severity: 'low',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7810, 31.2310], address: 'Gurudwara, Model Town, Phagwara' },
        reportedBy: users[9]._id,
        verificationCount: 18,
        metadata: { capacity: 400, foodAvailable: true, waterAvailable: true },
        ageHours: 40
    },
    {
        title: 'Jalandhar-Phagwara Highway Flooding',
        type: 'waterlogging',
        description: 'The highway connecting Jalandhar to Phagwara has severe flooding near Kartarpur intersection. Traffic completely blocked. Alternate route via Nakodar.',
        severity: 'critical',
        status: 'active',
        location: { type: 'Point', coordinates: [75.6800, 31.2700], address: 'Jalandhar-Phagwara Highway, Kartarpur' },
        reportedBy: users[1]._id,
        verificationCount: 25,
        metadata: { waterLevel: '4 feet', vehicleAccess: false, alternateRoute: 'Via Nakodar' },
        ageHours: 4
    },
    {
        title: 'Gas Leak Near Railway Station',
        type: 'unsafe_area',
        description: 'Possible gas leak detected near Phagwara Railway Station. People are evacuating the area. Keep windows open.',
        severity: 'high',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7660, 31.2220], address: 'Near Railway Station, Phagwara' },
        reportedBy: users[2]._id,
        verificationCount: 5,
        metadata: { hazardType: 'gas_leak', evacuationRequired: true },
        ageHours: 18
    },
    {
        title: 'Minor Accident on Bypass Road',
        type: 'accident',
        description: 'Two-wheeler accident on bypass road. No serious injuries. Police have arrived.',
        severity: 'low',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7850, 31.2150], address: 'Phagwara Bypass Road' },
        reportedBy: users[3]._id,
        verificationCount: 3,
        metadata: { vehiclesInvolved: 1, injuriesReported: false, emergencyServicesCalled: true },
        ageHours: 52
    },
    {
        title: 'Jalandhar Bus Stand Waterlogging',
        type: 'waterlogging',
        description: 'Jalandhar bus stand area has 2 feet of water. Bus services partially disrupted. Auto-rickshaws available.',
        severity: 'high',
        status: 'active',
        location: { type: 'Point', coordinates: [75.5730, 31.3200], address: 'Bus Stand, Jalandhar' },
        reportedBy: users[4]._id,
        verificationCount: 14,
        metadata: { waterLevel: '2 feet', vehicleAccess: false },
        ageHours: 11
    },
    {
        title: 'Bridge Damaged on Sutlej',
        type: 'road_blocked',
        description: 'The old bridge near Kapurthala road shows structural damage after flood. Heavy vehicles must not use this bridge.',
        severity: 'critical',
        status: 'active',
        location: { type: 'Point', coordinates: [75.5500, 31.3400], address: 'Sutlej Bridge, Jalandhar' },
        reportedBy: users[5]._id,
        verificationCount: 19,
        metadata: { bridgeDamage: 'structural', heavyVehicleRestriction: true },
        ageHours: 30
    },
    {
        title: 'Market Fire - Jalandhar Old City',
        type: 'fire',
        description: 'Fire broke out in the cloth market area of old Jalandhar. Multiple shops affected. Fire brigade working.',
        severity: 'high',
        status: 'active',
        location: { type: 'Point', coordinates: [75.5800, 31.3260], address: 'Cloth Market, Old Jalandhar' },
        reportedBy: users[6]._id,
        verificationCount: 13,
        metadata: { fireSize: 'medium', emergencyServicesCalled: true, shopsAffected: 5 },
        ageHours: 6
    },
    {
        title: 'Road Closure for Emergency Repairs',
        type: 'road_blocked',
        description: 'Ferozepore Road in Ludhiana closed for emergency sinkhole repair. Use GT Road instead.',
        severity: 'medium',
        status: 'active',
        location: { type: 'Point', coordinates: [75.8480, 30.9100], address: 'Ferozepore Road, Ludhiana' },
        reportedBy: users[7]._id,
        verificationCount: 8,
        metadata: { roadName: 'Ferozepore Road', cause: 'sinkhole', alternateRoute: 'GT Road' },
        ageHours: 75
    },
    {
        title: 'Ludhiana Industrial Area Flash Flood',
        type: 'waterlogging',
        description: 'Flash flooding in the industrial area of Ludhiana after heavy rainfall. Factory workers are stranded.',
        severity: 'high',
        status: 'active',
        location: { type: 'Point', coordinates: [75.8700, 30.8900], address: 'Industrial Area, Ludhiana' },
        reportedBy: users[8]._id,
        verificationCount: 11,
        metadata: { waterLevel: '2.5 feet', vehicleAccess: false, workersStranded: true },
        ageHours: 22
    },
    {
        title: 'Traffic Jam at Phagwara Toll Plaza',
        type: 'traffic_jam',
        description: 'Massive traffic jam at Phagwara toll plaza due to accident ahead. Queue stretching 5 km.',
        severity: 'medium',
        status: 'resolved',
        location: { type: 'Point', coordinates: [75.7600, 31.2150], address: 'Phagwara Toll Plaza, NH-44' },
        reportedBy: users[9]._id,
        verificationCount: 22,
        metadata: { queueLength: '5 km', expectedDelay: '1.5 hours' },
        ageHours: 100
    },
    {
        title: 'Broken Water Main on Station Road',
        type: 'road_blocked',
        description: 'Water main pipe has burst on Station Road. Road partially flooded and repair work ongoing.',
        severity: 'medium',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7710, 31.2260], address: 'Station Road, Phagwara' },
        reportedBy: users[10]._id,
        verificationCount: 4,
        metadata: { cause: 'burst_pipe', repairInProgress: true },
        ageHours: 16
    },
    {
        title: 'Heavy Vehicle Restriction on Market Road',
        type: 'road_blocked',
        description: 'Market road has been restricted to light vehicles only due to road damage. Heavy trucks must use bypass.',
        severity: 'low',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7760, 31.2300], address: 'Market Road, Phagwara' },
        reportedBy: users[1]._id,
        verificationCount: 2,
        metadata: { vehicleRestriction: 'heavy_vehicles', alternateRoute: 'Bypass road' },
        ageHours: 60
    },
    {
        title: 'Riot Police Deployed - Avoid Area',
        type: 'unsafe_area',
        description: 'Large protest gathering near courts area. Police deployed. Avoid for next few hours.',
        severity: 'high',
        status: 'active',
        location: { type: 'Point', coordinates: [75.5840, 31.3300], address: 'Court Road, Jalandhar' },
        reportedBy: users[2]._id,
        verificationCount: 7,
        metadata: { causeType: 'protest', policeDeployed: true },
        ageHours: 8
    },
    {
        title: 'School Road Waterlogging',
        type: 'waterlogging',
        description: 'Road leading to Govt School in Ludhiana has 1 foot water. Children cannot reach school.',
        severity: 'medium',
        status: 'active',
        location: { type: 'Point', coordinates: [75.8610, 30.9050], address: 'Govt School Road, Ludhiana' },
        reportedBy: users[3]._id,
        verificationCount: 5,
        metadata: { waterLevel: '1 foot', vehicleAccess: true },
        ageHours: 34
    },
    {
        title: 'Shelter Closed Due to Capacity',
        type: 'shelter_closed',
        description: 'Community hall relief camp is now full. People should proceed to Government School camp or Gurudwara.',
        severity: 'medium',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7745, 31.2260], address: 'Nehru Community Hall, Phagwara' },
        reportedBy: users[4]._id,
        verificationCount: 10,
        metadata: { capacity: 300, alternateLocation: 'Government School, Phagwara' },
        ageHours: 12
    },
    {
        title: 'Emergency: River Bank Erosion',
        type: 'unsafe_area',
        description: 'River bank showing signs of erosion near villages. Local administration warns residents to move away immediately.',
        severity: 'critical',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7400, 31.2050], address: 'River Bank Area, near Phagwara' },
        reportedBy: users[5]._id,
        verificationCount: 16,
        metadata: { erosionSeverity: 'severe', evacuationRequired: true, distanceFromRiver: '100 meters' },
        ageHours: 2
    },
    {
        title: 'Power Outage in Sector 12',
        type: 'other',
        description: 'Complete power outage in Sector 12 area of Phagwara. No electricity for last 6 hours. Generator backup failing.',
        severity: 'medium',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7830, 31.2340], address: 'Sector 12, Phagwara' },
        reportedBy: users[6]._id,
        verificationCount: 6,
        metadata: { duration: '6 hours', affectedHouseholds: 500 },
        ageHours: 20
    },
    {
        title: 'Four-Wheeler Accident with Injuries',
        type: 'accident',
        description: 'Car collision near Kapurthala road intersection. Two people injured. Ambulance on the way. Road partially blocked.',
        severity: 'high',
        status: 'resolved',
        location: { type: 'Point', coordinates: [75.5900, 31.3150], address: 'Kapurthala Road, Jalandhar' },
        reportedBy: users[7]._id,
        verificationCount: 9,
        metadata: { vehiclesInvolved: 2, injuriesReported: true, emergencyServicesCalled: true },
        ageHours: 120
    },
    {
        title: 'Truck Overturned on Highway',
        type: 'road_blocked',
        description: 'A heavily loaded truck overturned on the highway blocking both lanes. Crane dispatched.',
        severity: 'high',
        status: 'active',
        location: { type: 'Point', coordinates: [75.6500, 31.2900], address: 'NH-44, Between Phagwara and Jalandhar' },
        reportedBy: users[8]._id,
        verificationCount: 12,
        metadata: { vehiclesInvolved: 1, roadCompletelyBlocked: true },
        ageHours: 10
    },
    {
        title: 'Dengue Alert - Standing Water',
        type: 'unsafe_area',
        description: 'Heavy standing water creating mosquito breeding grounds. Health department warns of dengue risk. Clear water from surroundings.',
        severity: 'medium',
        status: 'active',
        location: { type: 'Point', coordinates: [75.7870, 31.2280], address: 'Residential Colony, Phagwara' },
        reportedBy: users[9]._id,
        verificationCount: 4,
        metadata: { healthRisk: 'dengue', standingWaterArea: '2000 sq meters' },
        ageHours: 45
    },
    {
        title: 'Old Railway Bridge Unsafe',
        type: 'road_blocked',
        description: 'Old railway overbridge showing cracks. PWD has put restriction. Use Nehru Bridge instead.',
        severity: 'high',
        status: 'active',
        location: { type: 'Point', coordinates: [75.5720, 31.3280], address: 'Railway Overbridge, Jalandhar' },
        reportedBy: users[10]._id,
        verificationCount: 8,
        metadata: { structuralIssue: true, alternateRoute: 'Nehru Bridge' },
        ageHours: 90
    },
    {
        title: 'Mini Fire at LPG Outlet',
        type: 'fire',
        description: 'Small fire at LPG gas agency. Controlled quickly. Nearby roads clear but avoid for caution.',
        severity: 'low',
        status: 'resolved',
        location: { type: 'Point', coordinates: [75.8520, 30.9070], address: 'LPG Agency, Ludhiana' },
        reportedBy: users[1]._id,
        verificationCount: 3,
        metadata: { fireSize: 'small', emergencyServicesCalled: true, controlled: true },
        ageHours: 140
    }
].map(({ ageHours, ...incident }) => ({
    ...incident,
    createdAt: hoursAgo(ageHours),
    updatedAt: hoursAgo(ageHours),
    expiresAt: demoExpiry()
}));

// ============================================
// MAIN SEEDER FUNCTION
// ============================================
const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('\n🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Incident.deleteMany({});
        await Shelter.deleteMany({});
        await Verification.deleteMany({});
        await Notification.deleteMany({});
        console.log('✅ Cleared all existing data');

        // ---- Insert Users ----
        console.log('\n👤 Inserting users...');
        const users = [];
        for (const userData of usersData) {
            const user = new User(userData);
            await user.save(); // Triggers bcrypt hashing
            users.push(user);
        }
        console.log(`✅ Created ${users.length} users`);

        // ---- Insert Shelters ----
        console.log('\n🏠 Inserting shelters...');
        const shelters = await Shelter.insertMany(sheltersData);
        console.log(`✅ Created ${shelters.length} shelters`);

        // ---- Insert Incidents ----
        console.log('\n⚠️  Inserting incidents...');
        const incidentsData = getIncidentsData(users);
        const incidents = await Incident.insertMany(incidentsData);
        console.log(`✅ Created ${incidents.length} incidents`);

        // ---- Insert Verifications ----
        console.log('\n✔️  Creating verifications...');
        const verifications = [];
        // Create some sample verifications
        for (let i = 0; i < Math.min(15, incidents.length); i++) {
            const incident = incidents[i];
            // Use a different user than the reporter
            const verifierIndex = (i + 2) % users.length;
            const verifier = users[verifierIndex];

            if (incident.reportedBy.toString() !== verifier._id.toString()) {
                verifications.push({
                    incidentId: incident._id,
                    userId: verifier._id,
                    type: i % 5 === 0 ? 'false_report' : 'confirm'
                });
            }
        }
        if (verifications.length > 0) {
            await Verification.insertMany(verifications);
        }
        console.log(`✅ Created ${verifications.length} verifications`);

        // ---- Insert Notifications ----
        console.log('\n🔔 Creating notifications...');
        await Notification.insertMany([
            {
                userId: users[1]._id,
                message: 'Your report "Major Flooding on NH-44" was confirmed by 12 users. Great work!',
                type: 'report_confirmed',
                relatedId: incidents[0]._id,
                relatedModel: 'Incident'
            },
            {
                userId: users[2]._id,
                message: 'Your report "Road Blocked Due to Fallen Tree" was confirmed by 7 users. +5 reputation added!',
                type: 'report_confirmed',
                relatedId: incidents[1]._id,
                relatedModel: 'Incident'
            },
            {
                userId: users[1]._id,
                message: 'Welcome to SafeRoute! Start reporting incidents to help your community.',
                type: 'system'
            }
        ]);
        console.log('✅ Created sample notifications');

        // ---- Print Summary ----
        console.log('\n' + '='.repeat(50));
        console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
        console.log('='.repeat(50));
        console.log(`\n📊 Summary:`);
        console.log(`   Users:         ${users.length}`);
        console.log(`   Incidents:     ${incidents.length}`);
        console.log(`   Shelters:      ${shelters.length}`);
        console.log(`   Verifications: ${verifications.length}`);
        console.log(`\n⏳ Incidents stay active for ${DEMO_EXPIRY_DAYS} days from now.`);
        console.log('\n🔐 Demo accounts:');
        console.log('   Admin: admin@saferoute.com  (password = SEED_ADMIN_PASSWORD, or admin123 if not set)');
        console.log('   User:  user@saferoute.com   (password = SEED_USER_PASSWORD, or user123 if not set)');
        console.log('\n🌐 Start the app with: npm start');
        console.log('   Then open: http://localhost:5000\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        if (error.code === 11000) {
            console.error('Duplicate key error - data might already exist');
        }
        process.exit(1);
    }
};

seedDatabase();