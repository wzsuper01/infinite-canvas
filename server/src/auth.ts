import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "infinite-canvas-dev-secret-change-in-prod";
const EXPIRES_IN = "7d";

export function signToken(payload: { userId: string }): string {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
    try {
        return jwt.verify(token, SECRET) as { userId: string };
    } catch {
        return null;
    }
}
