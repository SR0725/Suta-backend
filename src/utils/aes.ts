import crypto from "crypto";

const aesSecretKey = process.env.AES_SECRET_KEY;

if (!aesSecretKey || aesSecretKey.length !== 32) {
  throw new Error("Invalid or missing API_KEY_SECRET_KEY");
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", aesSecretKey!, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(encryptedText: string): string {
  const buffer = Buffer.from(encryptedText, "base64");

  const iv = buffer.slice(0, 12);
  const tag = buffer.slice(12, 28);
  const encrypted = buffer.slice(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", aesSecretKey!, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
