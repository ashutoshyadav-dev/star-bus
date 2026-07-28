import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi } from "../api/auth";
import { classifyRole } from "../constants/roles";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// const ADMIN_ROLES = ["SUPER_ADMIN", "STATE_ADMIN", "DEPOT_MANAGER", "STAFF"];

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
  const initAuth = async () => {
    const accessToken  = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken || !refreshToken) {
      setIsInitialized(true);
      return;
    }

    // Check if refresh token itself is expired
    const refreshPayload = parseJwt(refreshToken);
    if (!refreshPayload || refreshPayload.exp * 1000 < Date.now()) {
      localStorage.clear();
      setUser(null);
      setIsInitialized(true);
      return;
    }

    // Check if access token is expired — proactively refresh
    const accessPayload = parseJwt(accessToken);
    if (!accessPayload || accessPayload.exp * 1000 < Date.now()) {
      try {
        const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7000/apbus/api/v1";
        const { data } = await fetch(`${BASE_URL}/auth/token/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }).then((r) => r.json());

        const res = data?.data ?? data;
        if (res?.accessToken) {
          const jwtClaims    = parseJwt(res.accessToken);
          const storedUser   = JSON.parse(localStorage.getItem("user") || "{}");
          const resolvedUser = {
            ...storedUser,
            ...jwtClaims,
            roles:       storedUser?.roles       ?? jwtClaims?.roles ?? [],
            permissions: storedUser?.permissions ?? jwtClaims?.perms ?? [],
          };
          localStorage.setItem("accessToken",  res.accessToken);
          localStorage.setItem("refreshToken", res.refreshToken ?? refreshToken);
          localStorage.setItem("user", JSON.stringify(resolvedUser));
          setUser(resolvedUser);
        } else {
          localStorage.clear();
          setUser(null);
        }
      } catch {
        localStorage.clear();
        setUser(null);
      }
    }

    setIsInitialized(true);
  };

  initAuth();
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

  // const isAdmin = user?.roles?.some((r) =>
  //   ADMIN_ROLES.includes(r.toUpperCase())
  // ) ?? false;

  // const accountType = user?.accountType ?? null;
const roleClass = classifyRole(user?.roles ?? []);
  const isAdmin     = roleClass === "admin";
  const isDutyStaff = roleClass === "duty_staff";   

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
        isDutyStaff,
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
