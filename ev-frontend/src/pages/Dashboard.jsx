import { Navigate } from "react-router-dom";
import { useRole } from "../auth/useRole";

export default function Dashboard() {
  const role = useRole();

  // while decoding role (first render), show a tiny placeholder
  if (role === null || role === undefined) {
    return <div className="p-6 text-gray-600">Loading dashboard…</div>;
  }

  if (role === "Backoffice") return <Navigate to="/backoffice" replace />;
  if (role === "Operator")   return <Navigate to="/operator" replace />;

  // any other authenticated role (e.g., EvOwner) → unauthorized page
  return <Navigate to="/unauthorized" replace />;
}
