"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const initialize = useAuthStore((state) => state.initialize);

    useEffect(() => {
        const initAuth = async () => {
            try {
                await initialize();
            } catch (error) {
                console.error("Failed to initialize auth:", error);
            } finally {
                setIsInitialized(true);
            }
        };

        initAuth();
    }, [initialize]);

    // Show loading state while initializing
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
