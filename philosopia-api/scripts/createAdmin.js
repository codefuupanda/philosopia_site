import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 Connected to MongoDB'.cyan.bold);

        const username = 'admin';
        const password = 'password123'; // Default password

        const userExists = await User.findOne({ username });

        if (userExists) {
            console.log('⚠️ Admin user already exists'.yellow);
            process.exit(0);
        }

        await User.create({
            username,
            password,
            role: 'admin'
        });

        console.log(`✅ Admin user created: ${username} / ${password}`.green.bold);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:'.red, error);
        process.exit(1);
    }
};

createAdmin();
