import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from './db/client.js';

// Dumps every DynamoDB table to timestamped JSON files under backups/.
// (For point-in-time recovery, enable PITR on the tables in the AWS console.)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.join(__dirname, 'backups', new Date().toISOString().replace(/[:.]/g, '-'));

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

async function scanAll(TableName) {
    const items = [];
    let ExclusiveStartKey;
    do {
        const res = await ddb.send(new ScanCommand({ TableName, ExclusiveStartKey }));
        items.push(...(res.Items || []));
        ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
}

const backup = async () => {
    try {
        for (const [name, TableName] of Object.entries(TABLES)) {
            console.log(`Backing up ${TableName}...`);
            const data = await scanAll(TableName);
            fs.writeFileSync(
                path.join(backupDir, `${name}.json`),
                JSON.stringify(data, null, 2)
            );
            console.log(`Saved ${data.length} ${name} records.`);
        }

        console.log(`Backup completed successfully to ${backupDir}`);
        process.exit(0);
    } catch (err) {
        console.error('Backup failed:', err);
        process.exit(1);
    }
};

backup();
