import { create } from "zustand";

import { type AuthUser, fetchCurrentUser, getStoredToken, login as apiLogin, logout as apiLogout, register as apiRegister } from "@/services/api/auth";

export type LocalUser = AuthUser;

type UserStore = {
    user: LocalUser | null;
    isAuthLoading: boolean;
    isAuthenticated: boolean;

    initAuth: () => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
    clearSession: () => void;
};

export const useUserStore = create<UserStore>()((set) => ({
    user: null,
    isAuthLoading: true,
    isAuthenticated: false,

    initAuth: async () => {
        const token = getStoredToken();
        if (!token) {
            set({ isAuthLoading: false });
            return;
        }
        const user = await fetchCurrentUser();
        set({ user, isAuthenticated: !!user, isAuthLoading: false });
    },

    login: async (username, password) => {
        const { user } = await apiLogin(username, password);
        set({ user, isAuthenticated: true });
    },

    register: async (username, password) => {
        const { user } = await apiRegister(username, password);
        set({ user, isAuthenticated: true });
    },

    logout: () => {
        apiLogout();
        set({ user: null, isAuthenticated: false });
    },

    clearSession: () => set({ user: null, isAuthenticated: false }),
}));
