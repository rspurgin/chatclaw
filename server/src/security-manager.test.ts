import { describe, it, expect } from "vitest";
import { SecurityManager, ReplayAttackError } from "./security-manager.js";

const TEST_KEY_HEX =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("SecurityManager", () => {
  describe("importSecret", () => {
    it("accepts a valid hex key string", async () => {
      const sm = new SecurityManager();
      await expect(sm.importSecret(TEST_KEY_HEX)).resolves.toBeUndefined();
    });

    it("throws on invalid hex characters", async () => {
      const sm = new SecurityManager();
      await expect(sm.importSecret("gg")).rejects.toThrow("Invalid hex");
    });

    it("throws on odd-length hex string", async () => {
      const sm = new SecurityManager();
      await expect(sm.importSecret("abc")).rejects.toThrow("even number");
    });
  });

  describe("encryptStream / decryptStream", () => {
    it("round-trips plaintext through encrypt then decrypt", async () => {
      const client = new SecurityManager();
      const server = new SecurityManager();
      await client.importSecret(TEST_KEY_HEX);
      await server.importSecret(TEST_KEY_HEX);

      const plain = "Hello, Open Claw!";
      const packet = await client.encryptStream(plain);
      expect(packet.length).toBeGreaterThan(4);
      const decrypted = await server.decryptStream(packet);
      expect(decrypted).toBe(plain);
    });

    it("produces different ciphertext for identical messages (counter increments)", async () => {
      const sm = new SecurityManager();
      await sm.importSecret(TEST_KEY_HEX);

      const p1 = await sm.encryptStream("same");
      const p2 = await sm.encryptStream("same");
      expect(p1.equals(p2)).toBe(false);
      expect(p1.subarray(4).equals(p2.subarray(4))).toBe(false);
    });

    it("rejects replayed packet with duplicate counter", async () => {
      const client = new SecurityManager();
      const server = new SecurityManager();
      await client.importSecret(TEST_KEY_HEX);
      await server.importSecret(TEST_KEY_HEX);

      const packet = await client.encryptStream("first");
      await server.decryptStream(packet);
      await expect(server.decryptStream(packet)).rejects.toThrow(ReplayAttackError);
    });

    it("rejects out-of-order packet with lower counter", async () => {
      const client = new SecurityManager();
      const server = new SecurityManager();
      await client.importSecret(TEST_KEY_HEX);
      await server.importSecret(TEST_KEY_HEX);

      const p1 = await client.encryptStream("first");
      const p2 = await client.encryptStream("second");
      await server.decryptStream(p2);
      await expect(server.decryptStream(p1)).rejects.toThrow(ReplayAttackError);
    });

    it("throws when decryptStream called before importSecret", async () => {
      const sm = new SecurityManager();
      const packet = Buffer.alloc(36);
      packet.writeUInt32BE(0, 0);
      await expect(sm.decryptStream(packet)).rejects.toThrow("importSecret");
    });

    it("throws when packet is shorter than counter header", async () => {
      const sm = new SecurityManager();
      await sm.importSecret(TEST_KEY_HEX);
      await expect(sm.decryptStream(Buffer.alloc(2))).rejects.toThrow("too short");
    });
  });

  describe("counter resets", () => {
    it("resetEncryptCounter restarts client counter at 0", async () => {
      const client = new SecurityManager();
      await client.importSecret(TEST_KEY_HEX);

      await client.encryptStream("first");
      client.resetEncryptCounter();
      const packet = await client.encryptStream("again");
      const receivedCounter = packet.readUInt32BE(0);
      expect(receivedCounter).toBe(0);
    });

    it("resetDecryptCounter allows server to accept counter 0 again", async () => {
      const client = new SecurityManager();
      const server = new SecurityManager();
      await client.importSecret(TEST_KEY_HEX);
      await server.importSecret(TEST_KEY_HEX);

      const packet = await client.encryptStream("hello");
      await server.decryptStream(packet);

      server.resetDecryptCounter();
      client.resetEncryptCounter();

      const packet2 = await client.encryptStream("hello again");
      const decrypted = await server.decryptStream(packet2);
      expect(decrypted).toBe("hello again");
    });
  });
});
