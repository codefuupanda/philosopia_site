import crypto from 'crypto';
import { QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from './client.js';

/**
 * Analytics table: PK = day (YYYY-MM-DD), SK = ts (ISO timestamp + random suffix).
 * Native DynamoDB TTL on `expiresAt` (epoch seconds) replaces the Mongo 90-day TTL index.
 */

const TTL_DAYS = 90;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function toItem(event) {
  const ts = event.timestamp instanceof Date ? event.timestamp : new Date();
  return {
    ...event,
    day: ts.toISOString().slice(0, 10),
    ts: `${ts.toISOString()}#${crypto.randomUUID().slice(0, 8)}`,
    timestamp: ts.toISOString(),
    expiresAt: Math.floor(ts.getTime() / 1000) + TTL_DAYS * 24 * 60 * 60,
  };
}

// Batch write events (route accepts ≤50 per call → at most 2 chunks of 25).
export async function putEvents(events) {
  const items = events.map(toItem);
  for (let i = 0; i < items.length; i += 25) {
    let requests = items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } }));
    let attempt = 0;
    while (requests.length > 0) {
      const res = await ddb.send(new BatchWriteCommand({
        RequestItems: { [TABLES.analytics]: requests },
      }));
      requests = res.UnprocessedItems?.[TABLES.analytics] || [];
      if (requests.length > 0) await sleep(100 * ++attempt);
    }
  }
  return items.length;
}

// Fetch all events for the last N days: one bounded Query per day partition, in parallel.
export async function queryLastDays(days) {
  const dayKeys = [];
  const now = Date.now();
  for (let i = 0; i < days; i++) {
    dayKeys.push(new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  }

  const perDay = await Promise.all(dayKeys.map(async (day) => {
    const items = [];
    let ExclusiveStartKey;
    do {
      const res = await ddb.send(new QueryCommand({
        TableName: TABLES.analytics,
        KeyConditionExpression: '#d = :day',
        ExpressionAttributeNames: { '#d': 'day' },
        ExpressionAttributeValues: { ':day': day },
        ExclusiveStartKey,
      }));
      items.push(...(res.Items || []));
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  }));

  return perDay.flat();
}
