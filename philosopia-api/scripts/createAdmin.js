import colors from 'colors';
import bcrypt from 'bcryptjs';
import { getByUsername, putUser } from '../db/users.js';

const createAdmin = async () => {
    try {
        const username = 'admin';
        const password = 'password123'; // Default password

        const userExists = await getByUsername(username);

        if (userExists) {
            console.log('⚠️ Admin user already exists'.yellow);
            process.exit(0);
        }

        // Hashing happens here now (replaces the Mongoose pre-save hook)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        await putUser({ username, passwordHash, role: 'admin' });

        console.log(`✅ Admin user created: ${username} / ${password}`.green.bold);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:'.red, error);
        process.exit(1);
    }
};

createAdmin();
