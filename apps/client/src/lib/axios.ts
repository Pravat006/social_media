import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from "axios";
import { config } from "@repo/env-config";

const api: AxiosInstance = axios.create({
    baseURL: config.NEXT_PUBLIC_SERVER_URI,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

// A separate instance for refreshing tokens to avoid interceptor deadlocks
export const refreshApi: AxiosInstance = axios.create({
    baseURL: config.NEXT_PUBLIC_SERVER_URI,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

let isRefreshing = false;
let refreshQueue: Array<{
    resolve: (token?: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token?: string) => {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    refreshQueue = [];
};

// Request interceptor to add access token to headers
api.interceptors.request.use(
    (config) => {
        // Get auth store state from localStorage
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
            try {
                const { state } = JSON.parse(authStorage);
                const accessToken = state?.accessToken;

                if (accessToken && config.headers) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
            } catch (error) {
                console.error("[AXIOS] Failed to parse auth storage:", error);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling 401 errors and token refresh
api.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
        const originalRequest = error.config as
            | (InternalAxiosRequestConfig & { _retry?: boolean })
            | undefined;

        if (!error.response || error.response.status !== 401 || !originalRequest) {
            return Promise.reject(error);
        }

        console.warn("[AXIOS] 401 Unauthorized detected at:", originalRequest.url);

        if (originalRequest._retry) {
            console.error("[AXIOS] Request already retried once, logging out...");
            if (typeof window !== "undefined") {
                // Import auth store dynamically to avoid circular dependencies
                const { useAuthStore } = await import("./stores/auth.store");
                useAuthStore.getState().logout();
                window.location.href = "/login";
            }
            return Promise.reject(error);
        }

        if (isRefreshing) {
            console.log("[AXIOS] Already refreshing, queuing request:", originalRequest.url);
            return new Promise((resolve, reject) => {
                refreshQueue.push({
                    resolve: () => {
                        resolve(api(originalRequest));
                    },
                    reject,
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            console.log("[AXIOS] Starting background token refresh...");

            // Get refresh token from storage
            const authStorage = localStorage.getItem("auth-storage");
            if (!authStorage) {
                throw new Error("No auth storage found");
            }

            const { state } = JSON.parse(authStorage);
            const refreshToken = state?.refreshToken;

            if (!refreshToken) {
                throw new Error("No refresh token found");
            }

            // Call the refresh endpoint
            const response = await refreshApi.post("/auth/refresh-tokens", {}, {
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            });

            const newTokens = response.data.data.tokens;

            // Update tokens in auth store
            const { useAuthStore } = await import("./stores/auth.store");
            useAuthStore.getState().setTokens(newTokens.accessToken, newTokens.refreshToken);

            console.log("[AXIOS] Token refresh successful, retrying original request...");

            processQueue(null);

            // Retry the original request with new token
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            }
            return api(originalRequest);
        } catch (err) {
            console.error("[AXIOS] Token refresh failed:", err);
            processQueue(err);
            if (typeof window !== "undefined") {
                const { useAuthStore } = await import("./stores/auth.store");
                useAuthStore.getState().logout();
                window.location.href = "/login";
            }
            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
