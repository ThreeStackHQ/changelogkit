/**
 * AES-256-GCM encryption/decryption using Web Crypto API.
 * Key must be a 32-byte (64 hex char) string in GITHUB_TOKEN_KEY env var.
 */

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getKey(keyHex: string): Promise<CryptoKey> {
  const raw = hexToBytes(keyHex);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(plaintext: string): Promise<string> {
  const keyHex = process.env.GITHUB_TOKEN_KEY;
  if (!keyHex) throw new Error("GITHUB_TOKEN_KEY not set");

  const key = await getKey(keyHex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // Format: hex(iv):hex(ciphertext)
  return `${bytesToHex(iv.buffer as ArrayBuffer)}:${bytesToHex(ciphertext)}`;
}

export async function decrypt(encrypted: string): Promise<string> {
  const keyHex = process.env.GITHUB_TOKEN_KEY;
  if (!keyHex) throw new Error("GITHUB_TOKEN_KEY not set");

  const [ivHex, ciphertextHex] = encrypted.split(":");
  if (!ivHex || !ciphertextHex) throw new Error("Invalid encrypted format");

  const key = await getKey(keyHex);
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}
