"use client";

import { useAuthStore } from "@/lib/stores/auth.store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Social Media App
          </h1>
          <p className="text-gray-600 text-lg">
            Connect with friends and share your moments
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push("/register")}
              variant="outline"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Social Media
            </h1>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/messages")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <span>💬</span> Messages
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">@{user?.username}</p>
              <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="text-lg font-medium text-gray-900">
                  {user?.isVerified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-yellow-600">⚠ Not Verified</span>
                  )}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Privacy</p>
                <p className="text-lg font-medium text-gray-900">
                  {user?.isPrivate ? "🔒 Private" : "🌐 Public"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-lg font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">User ID</p>
                <p className="text-sm font-mono text-gray-900 truncate">{user?.id}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>🎉 Authentication Successful!</strong> You are now logged in.
                This app uses <strong>React Hook Form</strong> with <strong>Zod validation</strong> and <strong>shadcn/ui components</strong>.
                The authentication state is persisted using <strong>Zustand</strong> and will survive page refreshes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
