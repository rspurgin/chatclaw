import { describe, it, expect, vi, beforeEach } from "vitest";
import { appendToLog, getLogContent } from "./logger.js";

vi.mock("node:fs/promises", () => ({
  appendFile: vi.fn(),
  readFile: vi.fn(),
}));

import { appendFile, readFile } from "node:fs/promises";

const mockedAppendFile = vi.mocked(appendFile);
const mockedReadFile = vi.mocked(readFile);

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("appendToLog", () => {
    it("calls appendFile with path and formatted log entry", async () => {
      mockedAppendFile.mockResolvedValue(undefined);
      await appendToLog("hello world");
      expect(mockedAppendFile).toHaveBeenCalledTimes(1);
      const [filePath, content] = mockedAppendFile.mock.calls[0]!;
      expect(filePath).toContain("data.log");
      expect(content).toMatch(/^\[\d{4}-\d{2}-\d{2}T[\d.:]+Z\] hello world\n$/);
    });

    it("formats message with ISO timestamp", async () => {
      mockedAppendFile.mockResolvedValue(undefined);
      await appendToLog("[CHAT] user said hi");
      const content = mockedAppendFile.mock.calls[0]![1] as string;
      expect(content).toMatch(/^\[\d{4}-\d{2}-\d{2}T/);
      expect(content).toContain("[CHAT] user said hi");
      expect(content).toMatch(/\n$/);
    });

    it("logs error to console instead of throwing on write failure", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockedAppendFile.mockRejectedValue(new Error("disk full"));
      await appendToLog("test");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to write to log file"),
        expect.objectContaining({ message: "disk full" }),
      );
      spy.mockRestore();
    });
  });

  describe("getLogContent", () => {
    it("resolves with file content when read succeeds", async () => {
      mockedReadFile.mockResolvedValue("line1\nline2\n");
      const result = await getLogContent();
      expect(result).toBe("line1\nline2\n");
      expect(mockedReadFile).toHaveBeenCalledWith(
        expect.stringContaining("data.log"),
        "utf8",
      );
    });

    it("resolves with empty string when file does not exist (ENOENT)", async () => {
      const enoent = new Error("No such file") as NodeJS.ErrnoException;
      enoent.code = "ENOENT";
      mockedReadFile.mockRejectedValue(enoent);
      await expect(getLogContent()).resolves.toBe("");
    });

    it("rejects when read fails with non-ENOENT error", async () => {
      mockedReadFile.mockRejectedValue(new Error("Permission denied"));
      await expect(getLogContent()).rejects.toThrow("Permission denied");
    });
  });
});
