import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi } from "../api/auth";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const ADMIN_ROLES = ["SUPER_ADMIN", "STATE_ADMIN", "DEPOT_MANAGER", "STAFF"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Validate stored token on mount
    const token = localStorage.getItem("accessToken");
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.exp * 1000 < Date.now()) {
        // Token expired — attempt refresh or clear
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          localStorage.clear();
          setUser(null);
        }
      }
    }
    setIsInitialized(true);
  }, []);

  const saveTokens = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // Build a complete user object: prefer backend user, enrich with JWT claims
    const jwtClaims = parseJwt(accessToken);
    const resolvedUser = {
      ...jwtClaims,
      ...userData,
      // Guarantee roles array is always present
      roles: userData?.roles ?? jwtClaims?.roles ?? [],
      permissions: userData?.permissions ?? jwtClaims?.perms ?? [],
    };

    localStorage.setItem("user", JSON.stringify(resolvedUser));
    setUser(resolvedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout API failed:", err?.response?.data?.message);
    } finally {
      localStorage.clear();
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } catch (err) {
      console.warn("Logout-all failed:", err?.response?.data?.message);
    } finally {
      localStorage.clear();
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (perm) =>
      user?.permissions?.includes(perm) ||
      user?.perms?.includes(perm) ||
      false,
    [user]
  );

  const isAdmin = user?.roles?.some((r) =>
    ADMIN_ROLES.includes(r.toUpperCase())
  ) ?? false;

  const accountType = user?.accountType ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isInitialized,
        saveTokens,
        logout,
        logoutAll,
        hasPermission,
        isAdmin,
        accountType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
