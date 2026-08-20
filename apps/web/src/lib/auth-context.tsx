"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiClient, ApiError } from "./api-client";

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: PublicUser | null;
  accessToken: string | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (user: PublicUser, accessToken: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    apiClient
      .post<AuthResponse>("/auth/refresh")
      .then((res) => {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setStatus("authenticated");
      })
      .catch(() => {
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<AuthResponse>("/auth/login", { email, password });
    setUser(res.user);
    setAccessToken(res.accessToken);
    setStatus("authenticated");
  }, []);

  const signup = useCallback(
    async (fullName: string, email: string, password: string) => {
      const res = await apiClient.post<AuthResponse>("/auth/signup", {
        fullName,
        email,
        password,
      });
      setUser(res.user);
      setAccessToken(res.accessToken);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Clear local state regardless of network/API failure.
    }
    setUser(null);
    setAccessToken(null);
    setStatus("unauthenticated");
  }, []);

  const setSession = useCallback((nextUser: PublicUser, nextAccessToken: string) => {
    setUser(nextUser);
    setAccessToken(nextAccessToken);
    setStatus("authenticated");
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, status, login, signup, logout, setSession }),
    [user, accessToken, status, login, signup, logout, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { ApiError };
