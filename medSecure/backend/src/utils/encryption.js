// =============================================================================
// MedSecure - Cifrado de campos PHI
// Capa 6: Cifrado en Reposo - AES-256-GCM con IV único por campo
// =============================================================================
// Mitiga: Exposición de datos clínicos si la BD es comprometida
// Artículo HIPAA: 164.312(a)(2)(iv) - Encrypt and decrypt PHI
// Artículo GDPR: Artículo 32 - Seguridad del tratamiento
// =============================================================================

const crypto = require('crypto');
const { config } = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Obtiene la clave maestra desde la configuración.
 * La clave debe ser 32 bytes (64 caracteres hex).
 */
function getMasterKey() {
  return Buffer.from(config.phi.masterKey, 'hex');
}

/**
 * Cifra un texto plano usando AES-256-GCM.
 * @param {string} plaintext - Texto a cifrar
 * @param {Buffer} [masterKey] - Clave de 32 bytes (opcional, usa config por defecto)
 * @returns {string} - IV:ciphertext:authTag en formato hex
 */
function encrypt(plaintext, masterKey) {
  if (!plaintext) return null;

  const key = masterKey || getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Formato: IV:ciphertext:authTag
  return `${iv.toString('hex')}:${ciphertext}:${authTag}`;
}

/**
 * Descifra un texto cifrado con AES-256-GCM.
 * @param {string} encrypted - IV:ciphertext:authTag en formato hex
 * @param {Buffer} [masterKey] - Clave de 32 bytes (opcional, usa config por defecto)
 * @returns {string|null} - Texto descifrado o null si falla
 */
function decrypt(encrypted, masterKey) {
  if (!encrypted) return null;

  try {
    const key = masterKey || getMasterKey();
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      console.error('[Encrypt] Formato inválido');
      return null;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const ciphertext = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (err) {
    console.error('[Encrypt] Error de descifrado:', err.message);
    return null;
  }
}

module.exports = { encrypt, decrypt };
