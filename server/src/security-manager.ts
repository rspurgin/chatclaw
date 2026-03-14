import {
  generatePadBlock,
  xorBuffers,
  COUNTER_HEADER_BYTES,
  encodeCounter,
  decodeCounter,
} from "./crypto-engine.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export class ReplayAttackError extends Error {
  constructor(received: number, lastUsed: number) {
    super(
      `Replay or out-of-order packet: counter ${received} is not greater than last used ${lastUsed}`,
    );
    this.name = "ReplayAttackError";
  }
}

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

export class SecurityManager {
  private masterKey: CryptoKey | null = null;
  private localCounter = 0;
  private lastUsedCounter = -1;

  async importSecret(keyString: string): Promise<void> {
    const raw = hexToBytes(keyString);
    const keyBuffer = new ArrayBuffer(raw.byteLength);
    new Uint8Array(keyBuffer).set(raw);
    this.masterKey = await globalThis.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }

  private requireKey(): CryptoKey {
    if (!this.masterKey) {
      throw new Error("SecurityManager: call importSecret(keyString) before encrypt/decrypt");
    }
    return this.masterKey;
  }

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

  async decryptStream(packet: Buffer): Promise<string> {
    const key = this.requireKey();
    const bytes = new Uint8Array(packet.buffer, packet.byteOffset, packet.byteLength);

    const receivedCounter = decodeCounter(bytes);
    if (receivedCounter <= this.lastUsedCounter) {
      throw new ReplayAttackError(receivedCounter, this.lastUsedCounter);
    }

    const cipherBytes = bytes.subarray(COUNTER_HEADER_BYTES);
    const pad = await generatePadBlock(key, receivedCounter);
    const plainBytes = xorBuffers(cipherBytes, pad);

    this.lastUsedCounter = receivedCounter;
    return decoder.decode(plainBytes);
  }

  resetEncryptCounter(): void {
    this.localCounter = 0;
  }

  resetDecryptCounter(): void {
    this.lastUsedCounter = -1;
  }
}
