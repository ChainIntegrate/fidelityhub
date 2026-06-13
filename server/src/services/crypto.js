const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.MASTER_ENCRYPTION_KEY, "hex");

/**
 * Cifra una chiave privata EOA
 * @param {string} privateKey - chiave privata in chiaro (0x...)
 * @returns {string} stringa cifrata nel formato iv:tag:encrypted
 */
function cifra(privateKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decifra una chiave privata EOA
 * @param {string} data - stringa cifrata nel formato iv:tag:encrypted
 * @returns {string} chiave privata in chiaro (0x...)
 */
function decifra(data) {
  const [ivHex, tagHex, encryptedHex] = data.split(":");
  const iv        = Buffer.from(ivHex, "hex");
  const tag       = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher  = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

module.exports = { cifra, decifra };