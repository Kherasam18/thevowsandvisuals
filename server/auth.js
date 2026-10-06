import crypto from 'node:crypto';

/*
  Sign-in for the admin.

  Two things are deliberate here. The password is stored only as a scrypt hash,
  so the stored value cannot be used to log in and cannot be read back; and the
  credentials come from the environment rather than source, because this
  repository is pushed to GitHub and anything committed stays in its history
  even after it is "removed".

  Sessions are a signed token in an httpOnly cookie. There is no server-side
  session store to keep in sync, and the cookie cannot be read by scripts on
  the page, so an injected script cannot lift it.
*/

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/*
  `scrypt:salt:hash`, all hex.

  Colons, not dollars: .env files are read through dotenv-expand, which treats
  `$abc` as a variable reference and silently expands it away — a `$`-separated
  hash arrived as the bare word "scrypt" and every sign-in failed.
*/
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, saltHex, keyHex] = stored.split(':');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;

  let key;
  try {
    key = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), SCRYPT.keylen, SCRYPT);
  } catch {
    return false;
  }
  const expected = Buffer.from(keyHex, 'hex');
  // Lengths must match before timingSafeEqual, which throws otherwise.
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

/** A tamper-evident token. The payload is readable; the signature is not forgeable. */
export function createSession(email, secret, ttlMs = 7 * 24 * 60 * 60 * 1000) {
  const payload = b64url(JSON.stringify({ email, exp: Date.now() + ttlMs }));
  const sig = b64url(crypto.createHmac('sha256', secret).update(payload).digest());
  return `${payload}.${sig}`;
}

export function readSession(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');

  const expected = b64url(crypto.createHmac('sha256', secret).update(payload).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function serializeCookie(name, value, { maxAge, secure } = {}) {
  const bits = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    // Lax still sends the cookie on normal navigation, so opening the admin
    // from a link works, while blocking it on cross-site form posts.
    'SameSite=Lax',
  ];
  if (maxAge != null) bits.push(`Max-Age=${Math.floor(maxAge / 1000)}`);
  if (secure) bits.push('Secure');
  return bits.join('; ');
}

export const SESSION_COOKIE = 'vv_session';

/**
 * Slows down guessing.
 *
 * Held in memory, so it resets when the server restarts — enough to make an
 * online brute force impractical, which is all it is for. It is not a defence
 * against someone who already has the hash.
 */
export function createLoginThrottle({ maxAttempts = 8, windowMs = 10 * 60 * 1000 } = {}) {
  const attempts = new Map();

  return {
    check(key) {
      const entry = attempts.get(key);
      if (!entry || Date.now() > entry.resetAt) return { allowed: true };
      if (entry.count < maxAttempts) return { allowed: true };
      return { allowed: false, retryAfterMs: entry.resetAt - Date.now() };
    },
    fail(key) {
      const now = Date.now();
      const entry = attempts.get(key);
      if (!entry || now > entry.resetAt) attempts.set(key, { count: 1, resetAt: now + windowMs });
      else entry.count += 1;
    },
    succeed(key) {
      attempts.delete(key);
    },
  };
}
