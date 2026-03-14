/**
 * Core cryptographic primitives for the HMAC-OTP stream cipher.
 * Uses Web Crypto API (crypto.subtle) for Node.js and browser compatibility.
 */

const encoder = new TextEncoder();

function getSubtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("Web Crypto API (crypto.subtle) is not available");
  return c.subtle;
}

/** Size of the counter header in bytes (uint32 big-endian). */
export const COUNTER_HEADER_BYTES = 4;

export async function generatePadBlock(
  masterKey: CryptoKey,
  counter: number,
): Promise<Uint8Array> {
  const counterBuffer = encoder.encode(counter.toString());
  const signature = await getSubtle().sign("HMAC", masterKey, counterBuffer);
  return new Uint8Array(signature);
}

export function xorBuffers(data: Uint8Array, pad: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i]! ^ pad[i % pad.length]!;
  }
  return result;
}

export function encodeCounter(counter: number): Uint8Array {
  const view = new DataView(new ArrayBuffer(COUNTER_HEADER_BYTES));
  view.setUint32(0, counter >>> 0, false);
  return new Uint8Array(view.buffer);
}

export function decodeCounter(bytes: Uint8Array): number {
  if (bytes.length < COUNTER_HEADER_BYTES) {
    throw new Error("Packet too short: missing counter header");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, COUNTER_HEADER_BYTES);
  return view.getUint32(0, false);
}
