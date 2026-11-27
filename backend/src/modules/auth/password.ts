import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const version = 'scrypt-v1';

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 15 || Buffer.byteLength(password) > 512) {
    throw new TypeError('Password length outside supported bounds.');
  }
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `${version}:${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored?: string,
): Promise<boolean> {
  const parts = stored?.match(/^scrypt-v1:([0-9a-f]{32}):([0-9a-f]{64})$/);
  // Always perform the same work for a missing account or unusable hash.
  const salt = parts ? Buffer.from(parts[1], 'hex') : Buffer.alloc(16);
  const expected = parts ? Buffer.from(parts[2], 'hex') : Buffer.alloc(32);
  const matches = timingSafeEqual(await derive(password, salt), expected);
  return !!parts && matches;
}
