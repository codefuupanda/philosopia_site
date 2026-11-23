import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Duplex } from 'node:stream';
import { after, beforeEach, mock, test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

// Replace the entire client module BEFORE importing application modules. The
// real client, .env loader, credential chain, and AWS transport never execute.
const TABLES = { users: 'test-users', content: 'test-content', analytics: 'test-analytics' };
const users = new Map();
const content = new Map();
const calls = [];
let failUserRead = false;
let failUserWrite = false;
let removeKeyAfterRead = false;
const key = (type, id) => JSON.stringify([type, id]);
const copy = (value) => value && structuredClone(value);
const conditionalFailure = () => Object.assign(new Error('Simulated duplicate'), { name: 'ConditionalCheckFailedException' });

const ddb = {
  async send(command) {
    calls.push(command);
    const input = command.input;
    if (input.TableName === TABLES.users) {
      if (command instanceof GetCommand) {
        if (failUserRead) throw new Error('Simulated account lookup failure');
        if (removeKeyAfterRead) delete process.env.JWT_SECRET;
        return { Item: copy(users.get(input.Key.username)) };
      }
      if (command instanceof PutCommand) {
        if (failUserWrite) throw new Error('Simulated account write failure');
        // Model conditional writes atomically. Without the condition, duplicate
        // requests would both succeed and the concurrent-registration test fails.
        if (input.ConditionExpression) {
          assert.equal(input.ConditionExpression, 'attribute_not_exists(#username)');
          assert.equal(input.ExpressionAttributeNames['#username'], 'username');
          if (users.has(input.Item.username)) throw conditionalFailure();
        }
        users.set(input.Item.username, copy(input.Item));
        return {};
      }
    }
    if (input.TableName === TABLES.content) {
      if (command instanceof GetCommand) return { Item: copy(content.get(key(input.Key.entityType, input.Key.id))) };
      if (command instanceof PutCommand) {
        content.set(key(input.Item.entityType, input.Item.id), copy(input.Item));
        return {};
      }
      if (command instanceof DeleteCommand) {
        const itemKey = key(input.Key.entityType, input.Key.id);
        const item = content.get(itemKey);
        content.delete(itemKey);
        return { Attributes: copy(item) };
      }
      if (command instanceof QueryCommand) {
        return { Items: [...content.values()].filter((item) => item.entityType === input.ExpressionAttributeValues[':t']).map(copy) };
      }
    }
    if (command instanceof BatchGetCommand) {
      assert.deepEqual(Object.keys(input.RequestItems), [TABLES.content]);
      return { Responses: { [TABLES.content]: input.RequestItems[TABLES.content].Keys
        .map((item) => copy(content.get(key(item.entityType, item.id)))).filter(Boolean) } };
    }
    if (input.TableName === TABLES.analytics && command instanceof QueryCommand) return { Items: [] };
    throw new Error('Unexpected database operation: isolated tests prohibit AWS access');
  },
};

mock.module('../db/client.js', {
  namedExports: {
    ddb, TABLES,
    rawClient: { send() { throw new Error('Raw AWS access forbidden in isolated tests'); } },
  },
});
// Rate-limit policy is unchanged and outside these auth regressions. Avoid
// sharing the ten-request quota between otherwise independent test cases.
mock.module('../middleware/rateLimiter.js', {
  namedExports: { authLimiter: (_req, _res, next) => next() },
});

const secret = randomBytes(48).toString('hex');
process.env.JWT_SECRET = secret;
const { default: authRoutes } = await import('../routes/authRoutes.js');
const { default: beefRoutes } = await import('../routes/beefs.js');
const { getByUsername, putUser } = await import('../db/users.js');
const { requireAdmin } = await import('../middleware/authMiddleware.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/beefs', beefRoutes);
for (const [path, file] of [
  ['philosophers', 'philosophers'], ['periods', 'periods'], ['schools', 'schools'],
  ['concepts', 'concepts'], ['artworks', 'artworkRoutes'], ['works', 'works'],
  ['quotes', 'quotes'], ['analytics', 'analytics'],
]) {
  app.use(`/api/${path}`, (await import(`../routes/${file}.js`)).default);
}
// Keep malformed JSON responses deterministic without production error logging.
app.use((error, _req, res, _next) => res.status(error.status || 500).json({ message: 'Request failed' }));

const password = 'isolated-test-password';
// Deliberately shorter than the new registration minimum: existing logins must
// continue to work without imposing the new-account policy retroactively.
const legacyPassword = 'old-pass';
const legacyHash = await bcrypt.hash(legacyPassword, 10);
after(() => { delete process.env.JWT_SECRET; });
beforeEach(() => {
  calls.length = 0;
  users.clear();
  content.clear();
  failUserRead = false;
  failUserWrite = false;
  removeKeyAfterRead = false;
  process.env.JWT_SECRET = secret;
  users.set('admin', { username: 'admin', role: 'admin', password: legacyHash });
  users.set('viewer', { username: 'viewer', role: 'viewer', password: legacyHash });
  content.set(key('beef', 'existing'), {
    entityType: 'beef', id: 'existing', title: { en: 'Test', he: 'בדיקה' },
    philosopherAId: 'first', philosopherBId: 'second',
  });
});

const tokenFor = (id = 'admin', claims = {}, options = {}) =>
  jwt.sign({ id, ...claims }, secret, { expiresIn: '30d', ...options });
const accountWrites = () => calls.filter((c) => c instanceof PutCommand && c.input.TableName === TABLES.users);
const writes = () => calls.filter((c) => c instanceof PutCommand || c instanceof DeleteCommand);
const userReads = () => calls.filter((c) => c instanceof GetCommand && c.input.TableName === TABLES.users);
const beefPayload = { id: 'new-beef', titleEn: 'Test', titleHe: 'בדיקה', philosopherA: 'first', philosopherB: 'second' };
const registration = { username: 'new-admin', password };
const protectedRequests = [
  { name: 'registration', method: 'POST', path: '/api/auth/register', body: registration },
  { name: 'beef creation', method: 'POST', path: '/api/beefs', body: beefPayload },
  { name: 'beef deletion', method: 'DELETE', path: '/api/beefs/existing' },
];
async function request({ method = 'GET', path, body }, token, authorization) {
  // Exercise Express and its JSON parser using real Node HTTP objects over an
  // in-memory duplex stream. No listener, outbound connection, or .env access.
  const chunks = [];
  const socket = new Duplex({
    read() {},
    write(chunk, _encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); },
  });
  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = path;
  req.httpVersion = '1.1';
  req.httpVersionMajor = 1;
  req.httpVersionMinor = 1;
  req.headers = { 'content-type': 'application/json' };
  if (token) req.headers.authorization = `Bearer ${token}`;
  if (authorization !== undefined) req.headers.authorization = authorization;
  const payload = body === undefined ? undefined : JSON.stringify(body);
  if (payload !== undefined) req.headers['content-length'] = String(Buffer.byteLength(payload));
  const res = new ServerResponse(req);
  res.assignSocket(socket);
  const finished = once(res, 'finish');
  app.handle(req, res);
  if (payload !== undefined) req.push(payload);
  req.complete = true;
  req.push(null);
  await finished;
  const wireResponse = Buffer.concat(chunks).toString('utf8');
  socket.destroy();
  return { status: res.statusCode, body: JSON.parse(wireResponse.slice(wireResponse.indexOf('\r\n\r\n') + 4)) };
}

for (const route of protectedRequests) {
  test(`${route.name}: anonymous request is denied without writes`, async () => {
    assert.equal((await request(route)).status, 401);
    assert.equal(calls.length, 0);
  });
  for (const role of ['viewer', 'editor', undefined, 'ADMIN']) {
    test(`${route.name}: current ${role ?? 'missing'} role is denied despite an admin token claim`, async () => {
      users.set('viewer', { username: 'viewer', role, password: legacyHash });
      assert.equal((await request(route, tokenFor('viewer', { role: 'admin' }))).status, 403);
      assert.equal(writes().length, 0);
      assert.ok(userReads().every((c) => c.input.ConsistentRead === true));
    });
  }
  test(`${route.name}: deleted user cannot use an existing token`, async () => {
    const token = tokenFor();
    users.delete('admin');
    assert.equal((await request(route, token)).status, 401);
    assert.equal(writes().length, 0);
  });
  test(`${route.name}: account lookup failure fails closed`, async () => {
    failUserRead = true;
    assert.equal((await request(route, tokenFor())).status, 503);
    assert.equal(writes().length, 0);
  });
}

const invalidTokens = [
  ['malformed token', () => 'malformed'],
  ['wrong signature', () => jwt.sign({ id: 'admin' }, randomBytes(48).toString('hex'), { expiresIn: '30d' })],
  ['expired token', () => tokenFor('admin', {}, { expiresIn: -1 })],
  ['future not-before claim', () => tokenFor('admin', { nbf: Math.floor(Date.now() / 1000) + 3600 })],
  ['unsigned token', () => jwt.sign({ id: 'admin' }, null, { algorithm: 'none', expiresIn: '30d' })],
  ['unexpected algorithm', () => tokenFor('admin', {}, { algorithm: 'HS384' })],
  ['missing identity', () => jwt.sign({}, secret, { expiresIn: '30d' })],
  ['numeric identity', () => tokenFor(123)],
  ['empty identity', () => tokenFor('')],
  ['whitespace identity', () => tokenFor('   ')],
  ['padded identity', () => tokenFor(' admin ')],
  ['missing expiry', () => jwt.sign({ id: 'admin' }, secret)],
];
for (const [name, makeToken] of invalidTokens) {
  test(`${name} is rejected before account access`, async () => {
    for (const route of protectedRequests) assert.equal((await request(route, makeToken())).status, 401);
    assert.equal(calls.length, 0);
  });
}
for (const authorization of ['Bearer', 'Bearer ', 'BearerX token', 'Basic token', 'Bearer one two']) {
  test(`malformed authorization header (${authorization.split(' ')[0]}) returns one denial`, async () => {
    assert.equal((await request(protectedRequests[0], undefined, authorization)).status, 401);
    assert.equal(calls.length, 0);
  });
}

test('role changes revoke access on the next request with the same token', async () => {
  const token = tokenFor();
  assert.equal((await request(protectedRequests[1], token)).status, 201);
  users.get('admin').role = 'viewer';
  assert.equal((await request(protectedRequests[2], token)).status, 403);
  users.delete('admin');
  assert.equal((await request(protectedRequests[2], token)).status, 401);
  assert.ok(userReads().every((c) => c.input.ConsistentRead === true));
});

test('legacy admin login preserves response keys, id claim, algorithm, and lifetime', async () => {
  const result = await request({ method: 'POST', path: '/api/auth/login', body: { username: ' admin ', password: legacyPassword } });
  assert.equal(result.status, 200);
  assert.deepEqual(Object.keys(result.body).sort(), ['_id', 'token', 'username']);
  assert.equal(result.body._id, 'admin');
  assert.equal(result.body.username, 'admin');
  const decoded = jwt.verify(result.body.token, secret, { complete: true });
  assert.equal(decoded.header.alg, 'HS256');
  assert.equal(decoded.payload.id, 'admin');
  assert.equal(decoded.payload.exp - decoded.payload.iat, 30 * 24 * 60 * 60);
  assert.equal((await request(protectedRequests[1], result.body.token)).status, 201);
  assert.equal((await request(protectedRequests[2], result.body.token)).status, 200);
});

test('non-admin login remains available but its token cannot mutate', async () => {
  const result = await request({ method: 'POST', path: '/api/auth/login', body: { username: 'viewer', password: legacyPassword } });
  assert.equal(result.status, 200);
  assert.equal((await request(protectedRequests[1], result.body.token)).status, 403);
});
test('login rejects wrong passwords and missing accounts without writes', async () => {
  for (const body of [{ username: 'admin', password: 'incorrect' }, { username: 'absent', password }]) {
    assert.equal((await request({ method: 'POST', path: '/api/auth/login', body })).status, 401);
  }
  assert.equal(writes().length, 0);
});
test('login validates missing inputs and fails closed on lookup errors', async () => {
  assert.equal((await request({ method: 'POST', path: '/api/auth/login' })).status, 400);
  failUserRead = true;
  assert.equal((await request({ method: 'POST', path: '/api/auth/login', body: { username: 'admin', password } })).status, 500);
  assert.equal(writes().length, 0);
});

test('admin registration hashes the password, trims the username, and ignores client role claims', async () => {
  const result = await request({ ...protectedRequests[0], body: { username: ' new-admin ', password, role: 'viewer' } }, tokenFor());
  assert.equal(result.status, 201);
  assert.deepEqual(Object.keys(result.body).sort(), ['_id', 'token', 'username']);
  const account = users.get('new-admin');
  assert.equal(account.role, 'admin');
  assert.ok(account.password !== password);
  assert.ok(await bcrypt.compare(password, account.password));
  assert.equal(jwt.verify(result.body.token, secret).id, 'new-admin');
  assert.equal(accountWrites().length, 1);
  assert.equal((await request(protectedRequests[1], result.body.token)).status, 201);
});

const invalidRegistrations = [
  ['missing body', undefined], ['null body', null], ['array body', []], ['missing fields', {}],
  ['numeric username', { username: 123, password }],
  ['empty username', { username: '', password }],
  ['blank username', { username: '   ', password }],
  ['long username', { username: 'u'.repeat(129), password }],
  ['control character', { username: 'bad\u0000name', password }],
  ['numeric password', { username: 'new-admin', password: 123 }],
  ['short password', { username: 'new-admin', password: 'short' }],
  ['blank password', { username: 'new-admin', password: ' '.repeat(12) }],
  ['long password', { username: 'new-admin', password: 'p'.repeat(73) }],
  ['multibyte overflow', { username: 'new-admin', password: '界'.repeat(25) }],
];
for (const [name, body] of invalidRegistrations) {
  test(`registration rejects ${name} without account writes`, async () => {
    assert.equal((await request({ ...protectedRequests[0], body }, tokenFor())).status, 400);
    assert.equal(accountWrites().length, 0);
  });
}
for (const [name, body] of [
  ['minimum password', { username: 'new-admin', password: 'p'.repeat(12) }],
  ['maximum bcrypt bytes', { username: 'new-admin', password: '界'.repeat(24) }],
  ['Unicode username at limit', { username: 'א'.repeat(128), password }],
]) {
  test(`registration accepts ${name}`, async () => {
    assert.equal((await request({ ...protectedRequests[0], body }, tokenFor())).status, 201);
  });
}

test('duplicate registration returns 409 and preserves the original account', async () => {
  const original = structuredClone(users.get('admin'));
  assert.equal((await request({ ...protectedRequests[0], body: { username: ' admin ', password } }, tokenFor())).status, 409);
  assert.ok(users.get('admin').password === original.password);
  assert.equal(users.get('admin').role, original.role);
});
test('concurrent registrations create exactly one account', async () => {
  const results = await Promise.all([
    request(protectedRequests[0], tokenFor()), request(protectedRequests[0], tokenFor()),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(users.size, 3);
  assert.ok(await bcrypt.compare(password, users.get('new-admin').password));
});
test('account write failure returns a generic error without creating an account', async () => {
  failUserWrite = true;
  const result = await request(protectedRequests[0], tokenFor());
  assert.equal(result.status, 500);
  assert.equal(result.body.message, 'Server error');
  assert.equal(users.has('new-admin'), false);
});
test('signing configuration failure after authorization does not create an account', async () => {
  removeKeyAfterRead = true;
  assert.equal((await request(protectedRequests[0], tokenFor())).status, 500);
  assert.equal(accountWrites().length, 0);
});
test('missing signing configuration rejects protected requests without account access', async () => {
  const token = tokenFor();
  delete process.env.JWT_SECRET;
  for (const route of protectedRequests) assert.equal((await request(route, token)).status, 401);
  assert.equal(calls.length, 0);
});
test('repository reads are strongly consistent and do not invent missing users', async () => {
  assert.equal(await getByUsername('absent'), null);
  assert.equal(calls[0].input.ConsistentRead, true);
});
test('repository requires an explicit role before any write', async () => {
  for (const role of [undefined, null, '', ' ']) {
    await assert.rejects(putUser({ username: 'new-admin', passwordHash: legacyHash, role }), /role/i);
  }
  assert.equal(calls.length, 0);
});
test('admin guard rejects calls without authenticated user state', () => {
  let nextCalls = 0;
  let responses = 0;
  const res = {
    status(code) { assert.equal(code, 401); return this; },
    json() { responses++; },
  };
  requireAdmin({}, res, () => nextCalls++);
  assert.equal(nextCalls, 0);
  assert.equal(responses, 1);
});

for (const path of ['/api/beefs', '/api/beefs/existing', '/api/philosophers', '/api/periods',
  '/api/schools', '/api/concepts', '/api/artworks', '/api/works', '/api/quotes', '/api/analytics/stats']) {
  test(`public read remains anonymous: ${path}`, async () => {
    assert.equal((await request({ path })).status, 200);
    assert.equal(userReads().length, 0);
    assert.equal(writes().length, 0);
  });
}
