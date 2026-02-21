import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserService, type AuthResponse } from "../services/user.service";
import type { RegisterInput, LoginInput } from "@repo/shared";

interface AuthState {
    // State
    user: AuthResponse["user"] | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    register: (data: RegisterInput) => Promise<void>;
    login: (data: LoginInput) => Promise<void>;
    logout: () => Promise<void>;
    refreshTokens: () => Promise<void>;
    setUser: (user: AuthResponse["user"]) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    clearError: () => void;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Register action
            register: async (data: RegisterInput) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await UserService.register(data);
                    set({
                        user: response.user,
                        accessToken: response.tokens.accessToken,
                        refreshToken: response.tokens.refreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: any) {
                    const errorMessage =
                        error.response?.data?.message ||
                        error.message ||
                        "Registration failed";
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            // Login action
            login: async (data: LoginInput) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await UserService.login(data);
                    set({
                        user: response.user,
                        accessToken: response.tokens.accessToken,
                        refreshToken: response.tokens.refreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: any) {
                    const errorMessage =
                        error.response?.data?.message ||
                        error.message ||
                        "Login failed";
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            // Logout action
            logout: async () => {
                set({ isLoading: true });
                try {
                    await UserService.logout();
                } catch (error) {
                    console.error("Logout error:", error);
                } finally {
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                }
            },

            // Refresh tokens action
            refreshTokens: async () => {
                const { refreshToken } = get();
                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                try {
                    const response = await UserService.refreshTokens(refreshToken);
                    set({
                        accessToken: response.tokens.accessToken,
                        refreshToken: response.tokens.refreshToken,
                    });
                } catch (error) {
                    console.error("Token refresh failed:", error);
                    // Clear auth state on refresh failure
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            // Set user
            setUser: (user: AuthResponse["user"]) => {
                set({ user });
            },

            // Set tokens
            setTokens: (accessToken: string, refreshToken: string) => {
                set({ accessToken, refreshToken });
            },

            // Clear error
            clearError: () => {
                set({ error: null });
            },

            // Initialize - fetch current user if tokens exist
            initialize: async () => {
                const { accessToken, refreshToken } = get();

                if (!accessToken || !refreshToken) {
                    return;
                }

                set({ isLoading: true });
                try {
                    const user = await UserService.getCurrentUser();
                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    console.error("Failed to fetch current user:", error);
                    // Try to refresh tokens
                    try {
                        await get().refreshTokens();
                        const user = await UserService.getCurrentUser();
                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    } catch (refreshError) {
                        console.error("Token refresh failed:", refreshError);
                        set({
                            user: null,
                            accessToken: null,
                            refreshToken: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                    }
                }
            },
        }),
        {
            name: "auth-storage", // unique name for localStorage key
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
