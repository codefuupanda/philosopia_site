import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, mock, test } from 'node:test';
import express from 'express';
import { validateJwtConfig } from '../config/auth.js';

// No .env, AWS client, transport, or listening socket is created by this suite.
let probes = 0;
let listeners = 0;
const app = {
  get() { return this; },
  use() { return this; },
  listen() { listeners++; },
};
mock.module('express', { defaultExport: Object.assign(() => app, express) });
mock.module('../db/client.js', {
  namedExports: {
    TABLES: { content: 'test-content', users: 'test-users', analytics: 'test-analytics' },
    ddb: { send() { throw new Error('Database access forbidden in startup tests'); } },
    rawClient: { async send() { probes++; return { Table: { TableStatus: 'ACTIVE' } }; } },
  },
});
// Avoid the production cache's background timer when importing server.js.
mock.module('../middleware/cache.js', {
  namedExports: { cacheMiddleware: () => (_req, _res, next) => next() },
});
after(() => { delete process.env.JWT_SECRET; });

test('JWT configuration rejects missing, blank, and non-string secrets without disclosing values', () => {
  for (const value of [undefined, null, '', ' \t\n', 123, {}, []]) {
    assert.throws(() => validateJwtConfig({ JWT_SECRET: value }), {
      message: 'JWT_SECRET must be configured as a non-empty string',
    });
  }
});
test('JWT configuration preserves an explicitly supplied secret', () => {
  const secret = randomBytes(48).toString('hex');
  assert.ok(validateJwtConfig({ JWT_SECRET: secret }) === secret);
});
test('server with missing configuration fails before a DynamoDB probe or listener', async () => {
  delete process.env.JWT_SECRET;
  await assert.rejects(import('../server.js?startup=missing'), {
    message: 'JWT_SECRET must be configured as a non-empty string',
  });
  assert.equal(probes, 0);
  assert.equal(listeners, 0);
});
test('server with valid configuration reaches the mocked probe and listener', async () => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const log = mock.method(console, 'log', () => {});
  try {
    await import('../server.js?startup=valid');
    assert.equal(probes, 1);
    assert.equal(listeners, 1);
  } finally {
    log.mock.restore();
  }
});
