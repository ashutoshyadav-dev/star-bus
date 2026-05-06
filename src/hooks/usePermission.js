import { useAuth } from "../context/AuthContext";

/**
 * Returns whether the current user has the given permission string.
 * Usage: const canView = usePermission("user:view");
 */
export function usePermission(perm) {
  const { hasPermission } = useAuth();
  return hasPermission(perm);
}
