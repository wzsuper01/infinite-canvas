import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./auth.js";

// 扩展 Request 类型，挂载已认证用户 ID
declare module "express-serve-static-core" {
    interface Request {
        userId?: string;
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "未登录" });
        return;
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
        res.status(401).json({ error: "登录已过期，请重新登录" });
        return;
    }
    req.userId = payload.userId;
    next();
}
