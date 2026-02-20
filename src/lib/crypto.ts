import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? ""
const IV_LENGTH = 16

export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY, "utf-8"),
    iv
  )
  let encrypted = cipher.update(plain, "utf8", "base64")
  encrypted += cipher.final("base64")
  const authTag = cipher.getAuthTag()
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`
}

export function decryptToken(cipherText: string): string {
  const [ivB64, authTagB64, encrypted] = cipherText.split(":")
  const iv = Buffer.from(ivB64, "base64")
  const authTag = Buffer.from(authTagB64, "base64")
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY, "utf-8"),
    iv
  )
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, "base64", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

