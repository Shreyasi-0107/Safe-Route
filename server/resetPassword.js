// server/resetPassword.js
// Sets a user's password the correct way (hashed by the User model).
// PowerShell (use SINGLE quotes around the password):
//   node server/resetPassword.js you@example.com 'NewPassword1' admin

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');

const run = async () => {
    const [, , emailArg, newPassword, roleArg] = process.argv;

    if (!emailArg || !newPassword) {
        console.error("Usage: node server/resetPassword.js <email> '<new password>' [admin]");
        process.exit(1);
    }

    const problems = [];
    if (newPassword.length < 8) problems.push('at least 8 characters');
    if (!/[A-Z]/.test(newPassword)) problems.push('one uppercase letter');
    if (!/[a-z]/.test(newPassword)) problems.push('one lowercase letter');
    if (!/[0-9]/.test(newPassword)) problems.push('one number');
    if (problems.length) {
        console.error('Password needs: ' + problems.join(', ') + '.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saferoute');

    const email = emailArg.trim().toLowerCase();
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        console.error('No user found with email: ' + email);
        process.exit(1);
    }

    user.password = newPassword;          // hashed by the model's pre-save hook
    user.isActive = true;
    if (roleArg === 'admin') user.role = 'admin';
    await user.save();

    const ok = await user.comparePassword(newPassword);
    if (ok) {
        console.log('✅ Password updated for ' + email + ' (role: ' + user.role + ').');
        console.log('   You can log in now.');
    } else {
        console.error('⚠️  Saved, but the password was not hashed correctly.');
        console.error('   Check the pre-save hook in server/models/User.js.');
        process.exit(1);
    }

    process.exit(0);
};

run().catch((err) => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
});