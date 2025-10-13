import { Outlet, Navigate } from "react-router-dom";
import { useRole } from "./useRole";

export default function RoleGate({ allowed = [] }) {
  const role = useRole();

  // Role still resolving (first render) – show a lightweight placeholder
  if (role === null || role === undefined) {
    return <div className="p-6 text-gray-600">Loading…</div>;
  }

  // If role is allowed, render the nested routes
  if (allowed.includes(role)) return <Outlet />;

  // Authenticated but not allowed (e.g., EvOwner on a Backoffice route)
  return <Navigate to="/unauthorized" replace />;
}
