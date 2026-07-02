"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/lib/types";
import { api, setAuthTokens, clearAuthTokens, apiRequest } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { fullName: string; email: string; password: string; country?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const me = await apiRequest<User>("/users/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hasToken = typeof window !== "undefined" && window.localStorage.getItem("afc_access_token");
    if (hasToken) refreshUser();
    else setLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<User> {
    const res = await api.auth.login({ email, password }) as { user: User; accessToken: string; refreshToken: string };
    setAuthTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    return res.user;
  }

  async function register(data: { fullName: string; email: string; password: string; country?: string }) {
    const res = await api.auth.register(data) as { user: User; accessToken: string; refreshToken: string };
    setAuthTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }

  function logout() {
    clearAuthTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
