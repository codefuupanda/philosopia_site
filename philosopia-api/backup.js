const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const models = {
    Philosopher: require('./models/Philosopher'),
    School: require('./models/School'),
    Period: require('./models/Period'),
    Concept: require('./models/Concept'),
    Beef: require('./models/beef'),
    Artwork: require('./models/Artwork'),
    User: require('./models/User')
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
