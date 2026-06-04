import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

export function encryptJson(value) {
  const key = getEncryptionKey();
  if (!key) {
    return { encrypted: false, value };
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(value);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: true,
    algorithm: ALGORITHM,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    value: encrypted.toString("base64")
  };
}

export function decryptJson(encryptedObj) {
  if (!encryptedObj || !encryptedObj.encrypted) {
    return encryptedObj?.value || encryptedObj;
  }

  const key = getEncryptionKey();
  if (!key) {
    return encryptedObj.value;
  }

  try {
    const iv = Buffer.from(encryptedObj.iv, "base64");
    const authTag = Buffer.from(encryptedObj.authTag, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedObj.value, "base64")),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString("utf8"));
  } catch (error) {
    console.error("Failed to decrypt audit log JSON", error.message);
    return null;
  }
}

function getEncryptionKey() {
  const secret = process.env.AUDIT_ENCRYPTION_KEY;
  if (!secret) {
    return null;
  }

  return crypto.createHash("sha256").update(secret).digest();
}
