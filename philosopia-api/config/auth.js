export const JWT_ALGORITHM = 'HS256';

// db/client.js loads the API .env before server.js calls this. Never include
// the configured value in errors, and never substitute a fallback secret.
export function validateJwtConfig(env = process.env) {
  const secret = env.JWT_SECRET;
  if (typeof secret !== 'string' || !secret.trim()) {
    throw new Error('JWT_SECRET must be configured as a non-empty string');
  }
  return secret;
}
