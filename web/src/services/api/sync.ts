import axios from "axios";
import { API_BASE_URL } from "@/constant/runtime-config";
import { getStoredToken } from "./auth";

export const syncApi = axios.create({ baseURL: `${API_BASE_URL}/api` });

syncApi.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// 画布项目同步
export async function fetchProjects() {
    const { data } = await syncApi.get<{ projects: unknown[] }>("/projects");
    return data.projects;
}

export async function syncProject(project: Record<string, unknown>) {
    await syncApi.put(`/projects/${project.id}`, project);
}

export async function deleteProject(id: string) {
    await syncApi.delete(`/projects/${id}`);
}

// 资产同步
export async function fetchAssets() {
    const { data } = await syncApi.get<{ assets: unknown[] }>("/assets");
    return data.assets;
}

export async function createAsset(asset: Record<string, unknown>) {
    await syncApi.post("/assets", asset);
}

export async function deleteAsset(id: string) {
    await syncApi.delete(`/assets/${id}`);
}

// 配置同步
export async function fetchConfig() {
    const { data } = await syncApi.get<{ config: unknown }>("/config");
    return data.config;
}

export async function syncConfig(config: unknown) {
    await syncApi.put("/config", config);
}
