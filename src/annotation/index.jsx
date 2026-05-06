import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

// HOC that renders children only if the user has the given permission
export function RequirePermission({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : fallback;
}
