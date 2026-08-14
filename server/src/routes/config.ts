import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware.js";

const router = Router();

// 获取用户配置
router.get("/", authMiddleware, (req, res) => {
    const row = db.prepare("SELECT data FROM user_config WHERE user_id = ?").get(req.userId) as { data: string } | undefined;
    res.json({ config: row ? JSON.parse(row.data) : null });
});

// 更新用户配置（upsert）
router.put("/", authMiddleware, (req, res) => {
    const now = new Date().toISOString();
    const dataStr = JSON.stringify(req.body);
    db.prepare(`
        INSERT INTO user_config (user_id, data, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `).run(req.userId, dataStr, now);
    res.json({ success: true });
});

export default router;
