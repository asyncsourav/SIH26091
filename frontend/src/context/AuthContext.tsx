import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PublicUser } from "@/types";
import * as authService from "@/services/auth.service";

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (input: Parameters<typeof authService.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Try a silent refresh first (httpOnly cookie may still be valid from
      // a previous session), then fetch the current user.
      const refreshed = await authService.silentRefresh();
      if (refreshed) {
        const me = await authService.fetchMe();
        setUser(me);
      }
      setLoading(false);
    })();
  }, []);

  async function login(phone: string, password: string) {
    const u = await authService.login(phone, password);
    setUser(u);
  }

  async function register(input: Parameters<typeof authService.register>[0]) {
    const u = await authService.register(input);
    setUser(u);
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
