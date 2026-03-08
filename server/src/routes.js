import express from 'express';
import { getLogContent } from './logger.js';
const router = express.Router();
// GET /api/log
// Returns the entire content of the log file
router.get('/log', async (req, res) => {
    try {
        const data = await getLogContent();
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Error fetching log:', error);
        res.status(500).json({ success: false, error: 'Failed to read log file' });
    }
});
export default router;
//# sourceMappingURL=routes.js.map