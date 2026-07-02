import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Load the API .env regardless of the caller's cwd (server, seeders, scripts).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

// Credentials come from the standard AWS env chain (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY).
// DYNAMO_ENDPOINT overrides the endpoint for DynamoDB Local testing.
export const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMO_ENDPOINT ? { endpoint: process.env.DYNAMO_ENDPOINT } : {}),
});

// DocumentClient: work with plain JS objects; nested { en, he } maps are stored natively.
export const ddb = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

const prefix = process.env.DYNAMO_TABLE_PREFIX || 'philosopia';

export const TABLES = {
  content: `${prefix}-content`,
  analytics: `${prefix}-analytics`,
  users: `${prefix}-users`,
};
