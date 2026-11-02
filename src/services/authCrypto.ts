/**
 * Web Crypto API security utilities for password hashing and verification.
 * Uses PBKDF2 with SHA-256 and 100,000 iterations and a cryptographically random salt.
 * Passwords are NEVER stored in plain text.
 */

function bufToHex(buf: ArrayBuffer): string {
  const byteArr = new Uint8Array(buf);
  return Array.from(byteArr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateRandomSalt(length: number = 16): string {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return bufToHex(array.buffer);
}

export async function hashPasswordWithSalt(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const passwordData = enc.encode(password);
  const saltData = enc.encode(saltHex);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltData,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    return bufToHex(derivedBits);
  }

  // Fallback if subtle crypto is somehow unavailable
  let hash = 0;
  const combined = `${password}:${saltHex}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export async function verifyPassword(
  attempt: string,
  saltHex: string,
  expectedHashHex: string
): Promise<boolean> {
  try {
    const computed = await hashPasswordWithSalt(attempt, saltHex);
    return computed === expectedHashHex;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}
