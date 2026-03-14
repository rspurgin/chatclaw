import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";

const logFilePath = path.join(import.meta.dirname, "..", "data.log");

export async function appendToLog(message: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  try {
    await appendFile(logFilePath, entry);
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`Failed to write to log file: ${detail}`);
  }
}

export async function getLogContent(): Promise<string> {
  try {
    return await readFile(logFilePath, "utf8");
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw err;
  }
}
