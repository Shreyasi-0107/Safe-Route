// server/config/db.js
// MongoDB connection configuration using Mongoose

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saferoute';

        const conn = await mongoose.connect(mongoURI, {
            // These options are no longer needed in newer Mongoose versions
            // but kept here for compatibility
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📁 Database: ${conn.connection.name}`);

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('Make sure MongoDB is running locally: mongod --dbpath /data/db');
        process.exit(1); // Exit process with failure
    }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error(`MongoDB error: ${err.message}`);
});

module.exports = connectDB;
