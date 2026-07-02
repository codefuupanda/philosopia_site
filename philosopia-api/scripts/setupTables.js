import {
  CreateTableCommand,
  DescribeTableCommand,
  DescribeTimeToLiveCommand,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { rawClient, TABLES } from '../db/client.js';

/**
 * One-off idempotent setup: creates the 3 DynamoDB tables (on-demand billing)
 * and enables TTL on the analytics table. Safe to re-run.
 *
 *   node scripts/setupTables.js
 */

const tableDefs = [
  {
    TableName: TABLES.content,
    AttributeDefinitions: [
      { AttributeName: 'entityType', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'entityType', KeyType: 'HASH' },
      { AttributeName: 'id', KeyType: 'RANGE' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: TABLES.analytics,
    AttributeDefinitions: [
      { AttributeName: 'day', AttributeType: 'S' },
      { AttributeName: 'ts', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'day', KeyType: 'HASH' },
      { AttributeName: 'ts', KeyType: 'RANGE' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: TABLES.users,
    AttributeDefinitions: [{ AttributeName: 'username', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'username', KeyType: 'HASH' }],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

async function tableExists(TableName) {
  try {
    await rawClient.send(new DescribeTableCommand({ TableName }));
    return true;
  } catch (e) {
    if (e.name === 'ResourceNotFoundException') return false;
    throw e;
  }
}

async function setup() {
  for (const def of tableDefs) {
    if (await tableExists(def.TableName)) {
      console.log(`⏭️  ${def.TableName} already exists`);
      continue;
    }
    console.log(`⏳ Creating ${def.TableName}...`);
    await rawClient.send(new CreateTableCommand(def));
    await waitUntilTableExists(
      { client: rawClient, maxWaitTime: 120 },
      { TableName: def.TableName }
    );
    console.log(`✅ ${def.TableName} is ACTIVE`);
  }

  // TTL on analytics (90-day auto-expiry, replaces the Mongo TTL index)
  const ttl = await rawClient.send(new DescribeTimeToLiveCommand({ TableName: TABLES.analytics }));
  const status = ttl.TimeToLiveDescription?.TimeToLiveStatus;
  if (status === 'ENABLED' || status === 'ENABLING') {
    console.log(`⏭️  TTL already ${status} on ${TABLES.analytics}`);
  } else {
    await rawClient.send(new UpdateTimeToLiveCommand({
      TableName: TABLES.analytics,
      TimeToLiveSpecification: { AttributeName: 'expiresAt', Enabled: true },
    }));
    console.log(`✅ TTL enabled on ${TABLES.analytics} (attribute: expiresAt)`);
  }

  console.log('\n🎉 DynamoDB setup complete');
}

setup().catch((err) => {
  console.error('❌ Setup failed:', err.name, err.message);
  process.exit(1);
});
