/**
 * PHI Tokenization & Encryption Service
 * HIPAA-compliant encryption for Protected Health Information
 *
 * Uses AES-256-GCM encryption with environment-based encryption key
 * All PHI (names, locations, emails, phones) is encrypted before storage
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * In production, this should be stored in a secure key management service (AWS KMS, Azure Key Vault, etc.)
 */
function getEncryptionKey(): Buffer {
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable not set - PHI encryption requires this key');
  }

  // Ensure key is 32 bytes (256 bits) for AES-256
  return crypto.scryptSync(encryptionKey, 'salt', 32);
}

/**
 * Encrypt sensitive data (PHI)
 * @param plaintext - The data to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted data
 * @param encryptedData - Data in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a unique token key for PHI storage
 * @param conversationId - Conversation ID
 * @param fieldType - Type of field (name, location, email, phone)
 * @returns Token key like "TOKEN_NAME_abc123"
 */
export function generateTokenKey(conversationId: string, fieldType: string): string {
  const randomId = crypto.randomBytes(6).toString('hex');
  return `TOKEN_${fieldType.toUpperCase()}_${randomId}`;
}

/**
 * Hash sensitive data for comparison (without encryption)
 * Useful for checking if PHI has changed without storing it
 * @param data - Data to hash
 * @returns SHA-256 hash
 */
export function hashData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Redact PHI from text by replacing with tokens
 * @param text - Original text with PHI
 * @param tokens - Map of token keys to their positions
 * @returns Text with PHI replaced by token placeholders
 */
export function redactPHI(text: string, tokens: Map<string, string>): string {
  let redactedText = text;

  tokens.forEach((value, tokenKey) => {
    // Replace all occurrences of the PHI with token placeholder
    const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    redactedText = redactedText.replace(regex, `[${tokenKey}]`);
  });

  return redactedText;
}

/**
 * Restore PHI in text by replacing tokens with decrypted values
 * @param text - Text with token placeholders
 * @param tokens - Map of token keys to encrypted values
 * @returns Text with PHI restored
 */
export function restorePHI(text: string, tokens: Map<string, string>): string {
  let restoredText = text;

  tokens.forEach((encryptedValue, tokenKey) => {
    try {
      const decryptedValue = decrypt(encryptedValue);
      const tokenPlaceholder = `[${tokenKey}]`;
      restoredText = restoredText.replace(new RegExp(tokenPlaceholder, 'g'), decryptedValue);
    } catch (error) {
      console.error(`Failed to restore token ${tokenKey}:`, error);
    }
  });

  return restoredText;
}

/**
 * Validate if a string contains potential PHI patterns
 * Helps identify data that should be tokenized
 */
export function containsPHI(text: string): {
  hasEmail: boolean;
  hasPhone: boolean;
  hasSSN: boolean;
  hasAddress: boolean;
} {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/;
  const addressRegex = /\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)/i;

  return {
    hasEmail: emailRegex.test(text),
    hasPhone: phoneRegex.test(text),
    hasSSN: ssnRegex.test(text),
    hasAddress: addressRegex.test(text),
  };
}

/**
 * Extract and tokenize email from text
 * @param text - Text containing email
 * @param conversationId - Conversation ID
 * @returns Object with tokenized email and token key
 */
export function tokenizeEmail(text: string, conversationId: string): { tokenKey: string; encryptedValue: string; originalValue: string } | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);

  if (!match) return null;

  const email = match[0];
  const tokenKey = generateTokenKey(conversationId, 'email');
  const encryptedValue = encrypt(email);

  return { tokenKey, encryptedValue, originalValue: email };
}

/**
 * Extract and tokenize phone number from text
 * @param text - Text containing phone
 * @param conversationId - Conversation ID
 * @returns Object with tokenized phone and token key
 */
export function tokenizePhone(text: string, conversationId: string): { tokenKey: string; encryptedValue: string; originalValue: string } | null {
  const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  const match = text.match(phoneRegex);

  if (!match) return null;

  const phone = match[0];
  const tokenKey = generateTokenKey(conversationId, 'phone');
  const encryptedValue = encrypt(phone);

  return { tokenKey, encryptedValue, originalValue: phone };
}

/**
 * Tokenize a name (first/last name or full name)
 * @param name - Name to tokenize
 * @param conversationId - Conversation ID
 * @returns Object with tokenized name and token key
 */
export function tokenizeName(name: string, conversationId: string): { tokenKey: string; encryptedValue: string } {
  const tokenKey = generateTokenKey(conversationId, 'name');
  const encryptedValue = encrypt(name.trim());

  return { tokenKey, encryptedValue };
}

/**
 * Tokenize a location (full address or partial)
 * @param location - Location to tokenize
 * @param conversationId - Conversation ID
 * @returns Object with tokenized location and token key
 */
export function tokenizeLocation(location: string, conversationId: string): { tokenKey: string; encryptedValue: string } {
  const tokenKey = generateTokenKey(conversationId, 'location');
  const encryptedValue = encrypt(location.trim());

  return { tokenKey, encryptedValue };
}

/**
 * Check if encryption is properly configured
 * @returns true if encryption key is set
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Test encryption/decryption roundtrip
 * Used for testing and validation
 */
export function testEncryption(): boolean {
  try {
    const testData = 'Sensitive PHI Data 12345';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);

    return decrypted === testData;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
}
