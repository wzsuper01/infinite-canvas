import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import assetRoutes from "./routes/assets.js";
import configRoutes from "./routes/config.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true, credentials: true }));
app.use(express.json({ limit: "50mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/config", configRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
