/**
 * Core cryptographic logic for the stateful HMAC-OTP stream cipher.
 * Uses Web Crypto API (crypto.subtle) for compatibility with Node.js and browsers/React Native.
 */

const encoder = new TextEncoder();

/**
 * Returns the Web Crypto subtle API. Uses globalThis.crypto (Node 19+, browsers, React Native).
 */
function getSubtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("Web Crypto API (crypto.subtle) is not available");
  return c.subtle;
}

/**
 * Generates a unique block of the one-time pad for the given counter index.
 * HMAC-SHA256 of the counter produces 32 bytes (256 bits) of pseudo-random pad.
 */
export async function generatePadBlock(
  masterKey: CryptoKey,
  counter: number
): Promise<Uint8Array> {
  const counterBuffer = encoder.encode(counter.toString());
  const signature = await getSubtle().sign("HMAC", masterKey, counterBuffer);
  return new Uint8Array(signature);
}

/**
 * XORs data with the pad. If data is longer than the pad, the pad is repeated (stream cipher).
 */
export function xorBuffers(data: Uint8Array, pad: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i]! ^ pad[i % pad.length]!;
  }
  return result;
}

/** Size of the counter header in bytes (uint32 big-endian). */
export const COUNTER_HEADER_BYTES = 4;

/**
 * Encodes counter as 4-byte big-endian (network byte order).
 */
export function encodeCounter(counter: number): Uint8Array {
  const view = new DataView(new ArrayBuffer(COUNTER_HEADER_BYTES));
  view.setUint32(0, counter >>> 0, false);
  return new Uint8Array(view.buffer);
}

/**
 * Decodes 4-byte big-endian counter from the start of a buffer.
 */
export function decodeCounter(bytes: Uint8Array): number {
  if (bytes.length < COUNTER_HEADER_BYTES) {
    throw new Error("Packet too short: missing counter header");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, COUNTER_HEADER_BYTES);
  return view.getUint32(0, false);
}
