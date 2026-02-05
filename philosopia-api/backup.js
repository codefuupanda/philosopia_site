import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import Philosopher from './models/Philosopher.js';
import School from './models/School.js';
import Period from './models/Period.js';
import Concept from './models/Concept.js';
import Beef from './models/beef.js';
import Artwork from './models/Artwork.js';
import User from './models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = {
    Philosopher,
    School,
    Period,
    Concept,
    Beef,
    Artwork,
    User
};

const backupDir = path.join(__dirname, 'backups', new Date().toISOString().replace(/[:.]/g, '-'));

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const backup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        for (const [modelName, Model] of Object.entries(models)) {
            console.log(`Backing up ${modelName}...`);
            const data = await Model.find({});
            fs.writeFileSync(
                path.join(backupDir, `${modelName}.json`),
                JSON.stringify(data, null, 2)
            );
            console.log(`Saved ${data.length} ${modelName} records.`);
        }

        console.log(`Backup completed successfully to ${backupDir}`);
        process.exit(0);
    } catch (err) {
        console.error('Backup failed:', err);
        process.exit(1);
    }
};

backup();
