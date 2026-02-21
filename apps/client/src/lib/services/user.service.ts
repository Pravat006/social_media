import api from "../axios";
import type { RegisterInput, LoginInput } from "@repo/shared";

export interface AuthResponse {
    user: {
        id: string;
        name: string | null;
        username: string;
        email: string;
        bio?: string | null;
        profilePictureId?: string | null;
        isVerified: boolean;
        isPrivate: boolean;
        createdAt: string;
        updatedAt: string;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface ApiSuccessResponse<T> {
    statusCode: number;
    message: string;
    data: T;
    success: true;
}

export interface ApiErrorResponse {
    statusCode: number;
    message: string;
    success: false;
    errors?: Array<{
        field?: string;
        message: string;
    }>;
}

export class UserService {
    /**
     * Register a new user
     */
    static async register(data: RegisterInput): Promise<AuthResponse> {
        const response = await api.post<ApiSuccessResponse<AuthResponse>>(
            "/auth/register",
            data
        );
        return response.data.data;
    }

    /**
     * Login user
     */
    static async login(data: LoginInput): Promise<AuthResponse> {
        const response = await api.post<ApiSuccessResponse<AuthResponse>>(
            "/auth/login",
            data
        );
        return response.data.data;
    }

    /**
     * Logout user
     */
    static async logout(): Promise<void> {
        await api.post("/auth/logout");
    }

    /**
     * Refresh access token
     */
    static async refreshTokens(refreshToken: string): Promise<{
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }> {
        const response = await api.post<ApiSuccessResponse<{
            tokens: {
                accessToken: string;
                refreshToken: string;
            };
        }>>(
            "/auth/refresh-tokens",
            {},
            {
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            }
        );
        return response.data.data;
    }

    /**
     * Get current user profile
     */
    static async getCurrentUser(): Promise<AuthResponse["user"]> {
        const response = await api.get<ApiSuccessResponse<{ user: AuthResponse["user"] }>>(
            "/user/me"
        );
        return response.data.data.user;
    }

    /**
     * Get all users
     */
    static async getAllUsers(): Promise<AuthResponse["user"][]> {
        const response = await api.get<ApiSuccessResponse<AuthResponse["user"][]>>(
            "/user"
        );
        return response.data.data;
    }
}
