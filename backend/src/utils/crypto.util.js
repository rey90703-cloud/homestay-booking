/**
 * Crypto Utility for Password Encryption
 * Requirements: 13.6
 * 
 * Sử dụng AES-256-GCM để encrypt/decrypt guest passwords
 * Key được lấy từ environment variable
 */

const crypto = require('crypto');
const logger = require('./logger');

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * Nếu không có, tạo key mới và log warning
 * 
 * @returns {Buffer} Encryption key
 */
function getEncryptionKey() {
  const keyString = process.env.ENCRYPTION_KEY;
  
  if (!keyString) {
    logger.warn('ENCRYPTION_KEY not set in environment. Using default key (NOT SECURE for production)');
    // Default key for development only
    return crypto.scryptSync('default-dev-key-not-secure', 'salt', 32);
  }
  
  // Derive key from environment string using scrypt
  return crypto.scryptSync(keyString, 'smart-door-salt', 32);
}

/**
 * Encrypt a string using AES-256-GCM
 * 
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in format: iv:authTag:encrypted
 */
function encrypt(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Text to encrypt must be a non-empty string');
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption failed', { error: error.message });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string using AES-256-GCM
 * 
 * @param {string} encryptedText - Encrypted text in format: iv:authTag:encrypted
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedText) {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new Error('Encrypted text must be a non-empty string');
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', { error: error.message });
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash a string using SHA-256
 * Useful for one-way hashing (không thể decrypt)
 * 
 * @param {string} text - Text to hash
 * @returns {string} Hashed text (hex)
 */
function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a random token
 * 
 * @param {number} length - Length in bytes (default: 32)
 * @returns {string} Random token (hex)
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate encryption key setup
 * Log warning if using default key
 */
function validateEncryptionSetup() {
  if (!process.env.ENCRYPTION_KEY) {
    logger.warn('⚠️  ENCRYPTION_KEY not set - using default key (NOT SECURE for production)');
    console.log('⚠️  ENCRYPTION_KEY not set in .env file');
    console.log('   Generate a secure key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    return false;
  }
  
  logger.info('Encryption key configured');
  return true;
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateToken,
  validateEncryptionSetup,
};
