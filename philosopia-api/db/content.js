import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from './client.js';

/**
 * Repository for the single content table.
 * PK = entityType (philosopher | school | period | concept | beef | work | quote | artwork)
 * SK = id (string business key — the canonical identifier since the schema refactor)
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// List every item of one entity type (paginates past 1MB result pages).
export async function listByType(entityType) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.content,
      KeyConditionExpression: '#et = :t',
      ExpressionAttributeNames: { '#et': 'entityType' },
      ExpressionAttributeValues: { ':t': entityType },
      ExclusiveStartKey,
    }));
    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

export async function getById(entityType, id) {
  const res = await ddb.send(new GetCommand({
    TableName: TABLES.content,
    Key: { entityType, id },
  }));
  return res.Item || null;
}

// Batch-get items of one type by ids. Returns a Map keyed by id.
export async function getByIds(entityType, ids) {
  const unique = [...new Set(ids)].filter(Boolean);
  const byId = new Map();
  for (let i = 0; i < unique.length; i += 100) {
    let keys = unique.slice(i, i + 100).map((id) => ({ entityType, id }));
    let attempt = 0;
    while (keys.length > 0) {
      const res = await ddb.send(new BatchGetCommand({
        RequestItems: { [TABLES.content]: { Keys: keys } },
      }));
      for (const item of res.Responses?.[TABLES.content] || []) byId.set(item.id, item);
      keys = res.UnprocessedKeys?.[TABLES.content]?.Keys || [];
      if (keys.length > 0) await sleep(100 * ++attempt);
    }
  }
  return byId;
}

// Put = upsert by (entityType, id); same semantics as the old findOneAndUpdate({ upsert: true }).
export async function put(item) {
  await ddb.send(new PutCommand({ TableName: TABLES.content, Item: item }));
  return item;
}

// Batch write in chunks of 25 with retry on UnprocessedItems.
export async function putMany(items) {
  for (let i = 0; i < items.length; i += 25) {
    let requests = items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } }));
    let attempt = 0;
    while (requests.length > 0) {
      const res = await ddb.send(new BatchWriteCommand({
        RequestItems: { [TABLES.content]: requests },
      }));
      requests = res.UnprocessedItems?.[TABLES.content] || [];
      if (requests.length > 0) await sleep(100 * ++attempt);
    }
  }
}

// Delete by key; returns the old item (null if it didn't exist) so routes can 404.
export async function deleteById(entityType, id) {
  const res = await ddb.send(new DeleteCommand({
    TableName: TABLES.content,
    Key: { entityType, id },
    ReturnValues: 'ALL_OLD',
  }));
  return res.Attributes || null;
}
