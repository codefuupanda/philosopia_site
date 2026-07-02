import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from './client.js';

// Users table: PK = username. Password is a bcrypt hash — hashing happens in the
// caller (auth route / createAdmin script), replacing the old Mongoose pre-save hook.

export async function getByUsername(username) {
  const res = await ddb.send(new GetCommand({
    TableName: TABLES.users,
    Key: { username },
  }));
  return res.Item || null;
}

export async function putUser({ username, passwordHash, role = 'admin' }) {
  const user = { username, password: passwordHash, role };
  await ddb.send(new PutCommand({ TableName: TABLES.users, Item: user }));
  return user;
}
