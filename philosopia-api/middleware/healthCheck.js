import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { rawClient, TABLES } from '../db/client.js';

export default async function healthCheck(req, res) {
  try {
    const r = await rawClient.send(new DescribeTableCommand({ TableName: TABLES.content }));
    const dbReady = r.Table?.TableStatus === 'ACTIVE';
    res.status(dbReady ? 200 : 503).json({ db: dbReady });
  } catch {
    res.status(503).json({ db: false });
  }
}
