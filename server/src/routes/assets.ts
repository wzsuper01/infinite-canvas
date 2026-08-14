import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware.js";

const router = Router();

type AssetRow = {
    id: string;
    user_id: string;
    type: string;
    data: string;
    created_at: string;
};

// 获取当前用户所有资产
router.get("/", authMiddleware, (req, res) => {
    const rows = db.prepare("SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC").all(req.userId) as AssetRow[];
    const assets = rows.map((row) => ({
        id: row.id,
        type: row.type,
        ...JSON.parse(row.data),
        createdAt: row.created_at,
    }));
    res.json({ assets });
});

// 创建资产
router.post("/", authMiddleware, (req, res) => {
    const { id, type, ...data } = req.body;
    if (!id || !type) {
        res.status(400).json({ error: "id 和 type 不能为空" });
        return;
    }
    const now = new Date().toISOString();
    db.prepare("INSERT INTO assets (id, user_id, type, data, created_at) VALUES (?, ?, ?, ?, ?)").run(
        String(id),
        req.userId,
        String(type),
        JSON.stringify(data),
        now,
    );
    res.json({ success: true });
});

// 删除资产
router.delete("/:id", authMiddleware, (req, res) => {
    db.prepare("DELETE FROM assets WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
});

export default router;
