const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    role: String,
    mfaEnabled: {
        type: Boolean,
        default: false,
    },
    mfaSecret: String,
    mfaBackupCodes: [String],
});

const User = mongoose.model('User', UserSchema);

const resetMFA = async () => {
    const email = process.argv[2];

    if (!email) {
        console.error('Please provide an email address: node scripts/resetMFA.js <email>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email });

        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        user.mfaEnabled = false;
        user.mfaSecret = undefined;
        user.mfaBackupCodes = [];
        user.emailOtp = undefined; // Clear any pending OTP

        await user.save();

        console.log(`Successfully disabled MFA for user: ${email}`);
        process.exit(0);
    } catch (error) {
        console.error('Error resetting MFA:', error);
        process.exit(1);
    }
};

resetMFA();
