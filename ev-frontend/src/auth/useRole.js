import { useAuth } from "./AuthContext";
export function useRole() {
  const { user } = useAuth();
  return user?.role || null;
}
