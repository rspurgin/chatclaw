/**
 * SecurityManager: stateful HMAC-OTP stream cipher for phone-to-Mac Mini connection.
 * Uses a counter in the packet header to prevent replay and injection attacks.
 */

import {
  generatePadBlock,
  xorBuffers,
  COUNTER_HEADER_BYTES,
  encodeCounter,
  decodeCounter,
} from "./crypto-engine.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

/**
 * Parses a hex string into a Uint8Array (raw key material).
 */
function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.replace(/\s/g, "").replace(/^0x/i, "");
  if (normalized.length % 2 !== 0) {
    throw new Error("Hex key must have an even number of characters");
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const pair = normalized.slice(i * 2, i * 2 + 2);
    const n = parseInt(pair, 16);
    if (Number.isNaN(n)) throw new Error(`Invalid hex at position ${i * 2}`);
    bytes[i] = n;
  }
  return bytes;
}

/**
 * SecurityManager holds the shared secret (as a CryptoKey) and maintains
 * counter state for encryption (client) and the last accepted counter for
 * replay protection (server).
 */
export class SecurityManager {
  private masterKey: CryptoKey | null = null;
  /** Client: next counter to use when encrypting. */
  private localCounter = 0;
  /** Server: last accepted counter; any packet with counter <= this is rejected (replay). */
  private lastUsedCounter = -1;

  /**
   * Imports a raw secret from a hex string into a CryptoKey for HMAC-SHA-256.
   * Call this once after construction (or when rotating keys).
   */
  async importSecret(keyString: string): Promise<void> {
    const raw = hexToBytes(keyString);
    const keyBuffer = new Uint8Array(raw).buffer;
    this.masterKey = await globalThis.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
  }

  /**
   * Ensures the master key has been imported.
   */
  private requireKey(): CryptoKey {
    if (!this.masterKey) {
      throw new Error("SecurityManager: call importSecret(keyString) before encrypt/decrypt");
    }
    return this.masterKey;
  }

  /**
   * Encrypts a string for the stream. Increments the local counter, generates
   * a one-time pad from HMAC(counter), XORs the UTF-8 text with the pad, and
   * returns a buffer: [4-byte counter (big-endian)] + [XORed ciphertext].
   * Use on the client (phone).
   */
  async encryptStream(text: string): Promise<Buffer> {
    const key = this.requireKey();
    const counter = this.localCounter;
    this.localCounter = (this.localCounter + 1) >>> 0;

    const plainBytes = encoder.encode(text);
    const pad = await generatePadBlock(key, counter);
    const cipherBytes = xorBuffers(plainBytes, pad);

    const header = encodeCounter(counter);
    const packet = new Uint8Array(COUNTER_HEADER_BYTES + cipherBytes.length);
    packet.set(header, 0);
    packet.set(cipherBytes, COUNTER_HEADER_BYTES);
    return Buffer.from(packet);
  }

  /**
   * Decrypts a packet from the stream. Reads the 4-byte counter from the
   * header, verifies it is greater than the last used counter (replay
   * protection), generates the same pad, XORs to recover plaintext, then
   * updates the last used counter. Use on the server (Mac Mini).
   * @throws if the packet is too short or if the counter is not strictly greater than last used (replay).
   */
  async decryptStream(packet: Buffer): Promise<string> {
    const key = this.requireKey();
    const bytes = new Uint8Array(
      packet.buffer,
      packet.byteOffset,
      packet.byteLength
    );

    const receivedCounter = decodeCounter(bytes);
    if (receivedCounter <= this.lastUsedCounter) {
      throw new Error(
        `Replay or out-of-order packet: counter ${receivedCounter} is not greater than last used ${this.lastUsedCounter}`
      );
    }

    const cipherBytes = bytes.subarray(COUNTER_HEADER_BYTES);
    const pad = await generatePadBlock(key, receivedCounter);
    const plainBytes = xorBuffers(cipherBytes, pad);

    this.lastUsedCounter = receivedCounter;
    return decoder.decode(plainBytes);
  }

  /**
   * Resets local counter (client). Useful when establishing a new session.
   */
  resetEncryptCounter(): void {
    this.localCounter = 0;
  }

  /**
   * Resets last used counter (server). Use only when starting a new session.
   */
  resetDecryptCounter(): void {
    this.lastUsedCounter = -1;
  }
}
