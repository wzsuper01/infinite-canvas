import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { signToken } from "../auth.js";
import { authMiddleware } from "../middleware.js";

const router = Router();

// 注册
router.post("/register", (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
        res.status(400).json({ error: "用户名和密码不能为空" });
        return;
    }
    if (username.length < 2 || username.length > 20) {
        res.status(400).json({ error: "用户名长度需在 2-20 个字符之间" });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ error: "密码长度不能少于 6 位" });
        return;
    }

    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
        res.status(409).json({ error: "用户名已存在" });
        return;
    }

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    db.prepare("INSERT INTO users (id, username, password_hash, display_name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
        id,
        username,
        passwordHash,
        username,
        "",
        createdAt,
    );

    const token = signToken({ userId: id });
    res.json({
        token,
        user: { id, username, displayName: username, avatarUrl: "" },
    });
});

// 登录
router.post("/login", (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
        res.status(400).json({ error: "用户名和密码不能为空" });
        return;
    }

    const row = db.prepare("SELECT id, username, password_hash, display_name, avatar_url FROM users WHERE username = ?").get(username) as
        | { id: string; username: string; password_hash: string; display_name: string; avatar_url: string }
        | undefined;

    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
        res.status(401).json({ error: "用户名或密码错误" });
        return;
    }

    const token = signToken({ userId: row.id });
    res.json({
        token,
        user: { id: row.id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url },
    });
});

// 获取当前用户
router.get("/me", authMiddleware, (req, res) => {
    const row = db.prepare("SELECT id, username, display_name, avatar_url FROM users WHERE id = ?").get(req.userId) as
        | { id: string; username: string; display_name: string; avatar_url: string }
        | undefined;

    if (!row) {
        res.status(404).json({ error: "用户不存在" });
        return;
    }

    res.json({ user: { id: row.id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url } });
});

export default router;
