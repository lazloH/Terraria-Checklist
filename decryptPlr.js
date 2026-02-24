// decryptPlr.js
// Browser version using Web Crypto API

const KEY_HEX = "6800330079005F006700550079005A00";
const IV_HEX  = "6800330079005F006700550079005A00";

// Convert hex → Uint8Array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

const KEY_BYTES = hexToBytes(KEY_HEX);
const IV_BYTES  = hexToBytes(IV_HEX);

// Import AES key for WebCrypto
async function importAesKey() {
  return crypto.subtle.importKey(
    "raw",
    KEY_BYTES,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
}

// Decrypt .plr file (ArrayBuffer → ArrayBuffer)
export async function decryptPlrBrowser(encryptedBuffer) {
  const key = await importAesKey();

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv: IV_BYTES
    },
    key,
    encryptedBuffer
  );

  return decrypted; // ArrayBuffer
}
