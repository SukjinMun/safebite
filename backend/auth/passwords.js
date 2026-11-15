import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const deriveKey = promisify(scrypt);
const OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const HASH_PATTERN =
  /^scrypt-v1\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt, 64, OPTIONS);
  // Retain the work parameters alongside the salt and hash.
  return `scrypt-v1$32768$8$3$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const match =
    typeof storedHash === "string" && storedHash.match(HASH_PATTERN);
  // Unknown usernames still perform the same expensive password check.
  const salt = match ? match[1] : "0".repeat(32);
  const expected = match ? Buffer.from(match[2], "hex") : Buffer.alloc(64);
  const actual = await deriveKey(password, salt, 64, OPTIONS);
  return timingSafeEqual(actual, expected) && Boolean(match);
}
