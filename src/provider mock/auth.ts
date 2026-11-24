import type { AuthProvider } from "@refinedev/core";
import { BACKEND_BASE_URL } from "@/constants";

export type AppIdentity = {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: "student" | "teacher" | "admin";
};

type SessionResponse = {
    user: AppIdentity;
} | null;

const getSession = async (): Promise<SessionResponse> => {
    const response = await fetch(`${BACKEND_BASE_URL}auth/get-session`, {
        credentials: "include",
    });
    if (!response.ok) throw new Error("Could not check your sign-in session");
    return response.json() as Promise<SessionResponse>;
};

const postAuth = async (
    path: string,
    body?: Record<string, unknown>,
): Promise<{ success: boolean; redirectTo?: string; error?: Error }> => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}auth/${path}`, {
            method: "POST",
            credentials: "include",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
        const payload = await response.json() as { message?: string; error?: string };
        if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Authentication failed");
        return { success: true, redirectTo: path === "sign-out" ? "/login" : "/" };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error("Authentication request failed"),
        };
    }
};

export const authProvider: AuthProvider = {
    login: async (params) => postAuth("sign-in/email", params),
    register: async (params) => postAuth("sign-up/email", params),
    logout: async () => postAuth("sign-out"),
    check: async () => {
        const session = await getSession();
        return session?.user
            ? { authenticated: true }
            : { authenticated: false, redirectTo: "/login" };
    },
    getIdentity: async () => {
        const session = await getSession();
        return session?.user ?? null;
    },
    getPermissions: async () => {
        const session = await getSession();
        return session?.user.role ?? null;
    },
    onError: async (error) => {
        if (error?.statusCode === 401) {
            return { logout: true, redirectTo: "/login", error };
        }
        return {};
    },
};
