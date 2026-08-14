import axios from "axios";
import { API_BASE_URL } from "@/constant/runtime-config";

export type AuthUser = {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
};

export type AuthResponse = {
    token: string;
    user: AuthUser;
};

const api = axios.create({ baseURL: `${API_BASE_URL}/api/auth` });

const TOKEN_KEY = "infinite-canvas:auth_token";

export function getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export async function register(username: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/register", { username, password });
    setStoredToken(data.token);
    return data;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/login", { username, password });
    setStoredToken(data.token);
    return data;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
    const token = getStoredToken();
    if (!token) return null;
    try {
        const { data } = await api.get<{ user: AuthUser }>("/me", { headers: { Authorization: `Bearer ${token}` } });
        return data.user;
    } catch {
        clearStoredToken();
        return null;
    }
}

export function logout(): void {
    clearStoredToken();
}
