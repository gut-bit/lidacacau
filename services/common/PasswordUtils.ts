/**
 * LidaCacau - Password Utilities
 * 
 * Utilitarios para hash e verificacao de senhas.
 * Usa expo-crypto para hashing seguro.
 * 
 * NOTA: Em producao, use bcrypt no servidor.
 * Este modulo e para validacao client-side apenas.
 */

import * as Crypto from 'expo-crypto';

const SALT_LENGTH = 16;
const ITERATIONS = 10000;

export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt();
  const hash = await deriveKey(password, salt);
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    console.log('[PasswordUtils] Verifying password. StoredHash length:', storedHash?.length);
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) {
      console.log('[PasswordUtils] Plain text comparison:', password === storedHash);
      return password === storedHash;
    }
    const hash = await deriveKey(password, salt);
    const isValid = hash === originalHash;
    console.log('[PasswordUtils] Hash comparison:', isValid);
    return isValid;
  } catch (error) {
    console.log('[PasswordUtils] Error, falling back to direct comparison:', error);
    return password === storedHash;
  }
}

async function generateSalt(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(SALT_LENGTH);
  return Array.from(new Uint8Array(randomBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveKey(password: string, salt: string): Promise<string> {
  const combined = `${salt}${password}`;
  let hash = combined;
  for (let i = 0; i < ITERATIONS; i++) {
    hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hash
    );
  }
  return hash;
}

export function isPasswordHashed(password: string): boolean {
  return password.includes(':') && password.length > 100;
}
