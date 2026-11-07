
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const shelterRoutes = require('./routes/shelterRoutes');
const routeRoutes = require('./routes/routeRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/geocode', require('./routes/geocodeRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'SafeRoute API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../public/dashboard.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../public/register.html')));
app.get('/report', (req, res) => res.sendFile(path.join(__dirname, '../public/report.html')));
app.get('/route', (req, res) => res.sendFile(path.join(__dirname, '../public/route.html')));
app.get('/shelters', (req, res) => res.sendFile(path.join(__dirname, '../public/shelters.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, '../public/profile.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Something went wrong on the server. Please try again.'
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Connect to MongoDB first
    await connectDB();

    app.listen(PORT, () => {
        console.log('\n🚀 SafeRoute Server Started!');
        console.log(`📡 Server URL: http://localhost:${PORT}`);
        console.log(`🗺️  Open: http://localhost:${PORT} in your browser`);
        console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('\nAPI Endpoints:');
        console.log(`  Auth:      http://localhost:${PORT}/api/auth`);
        console.log(`  Incidents: http://localhost:${PORT}/api/incidents`);
        console.log(`  Shelters:  http://localhost:${PORT}/api/shelters`);
        console.log(`  Routes:    http://localhost:${PORT}/api/routes`);
        console.log(`  Admin:     http://localhost:${PORT}/api/admin`);
        console.log('\nPress Ctrl+C to stop the server\n');
    });
};

startServer();
