import { Router } from "express";
import type { Request, Response } from "express";
import { getLogContent } from "./logger.js";

const router = Router();

router.get("/log", async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getLogContent();
    res.json({ success: true, data });
  } catch (err: unknown) {
    console.error("Error fetching log:", err);
    res.status(500).json({ success: false, error: "Failed to read log file" });
  }
});

export default router;
