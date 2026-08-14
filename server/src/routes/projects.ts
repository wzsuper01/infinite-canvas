import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware.js";

const router = Router();

type ProjectRow = {
    id: string;
    user_id: string;
    title: string;
    data: string;
    created_at: string;
    updated_at: string;
};

// 获取当前用户所有画布项目
router.get("/", authMiddleware, (req, res) => {
    const rows = db.prepare("SELECT * FROM canvas_projects WHERE user_id = ? ORDER BY updated_at DESC").all(req.userId) as ProjectRow[];
    const projects = rows.map((row) => ({
        id: row.id,
        ...JSON.parse(row.data),
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
    res.json({ projects });
});

// 创建或更新单个画布项目（upsert）
router.put("/:id", authMiddleware, (req, res) => {
    const projectId = req.params.id;
    const body = req.body;
    const now = new Date().toISOString();

    // 提取 title 和 data（data 是除 id/title/createdAt/updatedAt 外的全部字段）
    const { id, title, createdAt, updatedAt, ...data } = body;
    const dataStr = JSON.stringify(data);
    const titleStr = title || "未命名画布";

    const existing = db.prepare("SELECT id FROM canvas_projects WHERE id = ? AND user_id = ?").get(projectId, req.userId);
    if (existing) {
        db.prepare("UPDATE canvas_projects SET title = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(
            titleStr,
            dataStr,
            now,
            projectId,
            req.userId,
        );
    } else {
        db.prepare("INSERT INTO canvas_projects (id, user_id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(
            projectId,
            req.userId,
            titleStr,
            dataStr,
            createdAt || now,
            now,
        );
    }

    res.json({ success: true });
});

// 删除画布项目
router.delete("/:id", authMiddleware, (req, res) => {
    db.prepare("DELETE FROM canvas_projects WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
});

// 批量替换（全量同步，用于初次登录或强制覆盖）
router.post("/replace", authMiddleware, (req, res) => {
    const { projects } = req.body as { projects: Array<Record<string, unknown>> };
    if (!Array.isArray(projects)) {
        res.status(400).json({ error: "projects 必须是数组" });
        return;
    }

    const deleteAll = db.prepare("DELETE FROM canvas_projects WHERE user_id = ?");
    const insert = db.prepare("INSERT INTO canvas_projects (id, user_id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)");

    const tx = db.transaction(() => {
        deleteAll.run(req.userId);
        for (const proj of projects) {
            const { id, title, createdAt, updatedAt, ...data } = proj;
            insert.run(
                String(id),
                req.userId,
                String(title || "未命名画布"),
                JSON.stringify(data),
                String(createdAt || new Date().toISOString()),
                String(updatedAt || new Date().toISOString()),
            );
        }
    });
    tx();

    res.json({ success: true });
});

export default router;
