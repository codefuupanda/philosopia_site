import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from './client.js';

// Users table: PK = username. Password is a bcrypt hash — hashing happens in the
// caller (auth route / createAdmin script), replacing the old Mongoose pre-save hook.

export async function getByUsername(username) {
  const res = await ddb.send(new GetCommand({
    TableName: TABLES.users,
    Key: { username },
    ConsistentRead: true,
  }));
  return res.Item || null;
}

// Creation only: a concurrent registration must never replace an existing user.
// Callers must explicitly choose a role; the HTTP route authorizes that choice.
export async function putUser({ username, passwordHash, role }) {
  if (typeof role !== 'string' || !role.trim()) {
    throw new TypeError('User role must be explicitly provided');
  }
  const user = { username, password: passwordHash, role };
  await ddb.send(new PutCommand({
    TableName: TABLES.users,
    Item: user,
    ConditionExpression: 'attribute_not_exists(#username)',
    ExpressionAttributeNames: { '#username': 'username' },
  }));
  return user;
}
