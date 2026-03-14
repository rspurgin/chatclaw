import { describe, it, expect, vi, beforeEach } from "vitest";

const mockIo = vi.fn(() => ({
  on: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("socket.io-client", () => ({
  io: mockIo,
}));

describe("socket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a socket instance created with expected options", async () => {
    const { socket } = await import("./socket");
    expect(socket).toBeDefined();
    expect(mockIo).toHaveBeenCalledTimes(1);
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      { autoConnect: true, reconnection: true },
    );
  });
});
